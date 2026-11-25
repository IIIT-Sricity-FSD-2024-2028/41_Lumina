import { ad1Actions } from './ad1-slice';
import { coursesService } from '../../services/courses.service';
import { usersService } from '../../services/users.service';
import { registrationsService } from '../../services/registrations.service';
import { sectionsService } from '../../services/sections.service';
import { slotsService } from '../../services/slots.service';

/**
 * Maps the camelCase API response into the PascalCase table rows
 * expected by the legacy builder functions.
 */
function mapCourses(courses) {
  return (courses || []).map((c) => ({
    Course_ID: c.courseId,
    Course_Name: c.courseName,
    Credits: c.credits,
    Status: c.status,
    Dept_ID: c.deptId,
  }));
}

function mapUsers(users) {
  return (users || []).map((u) => ({
    User_ID: u.userId,
    Full_Name: u.fullName,
    Role: u.role,
    Dept_ID: u.deptId,
  }));
}

function mapRegistrations(regs) {
  return (regs || []).map((r) => ({
    Enrollment_ID: r.enrollmentId,
    Student_ID: r.studentId,
    Course_ID: r.courseId,
    Term_ID: r.termId,
    Section_ID: r.sectionId,
    Status: r.status,
  }));
}

function mapSections(sections) {
  return (sections || []).map((s) => ({
    Section_ID: s.sectionId,
    Section_Name: s.sectionName,
    Course_ID: s.courseId,
    Term_ID: s.termId,
  }));
}

function mapSlots(slots) {
  return (slots || []).map((s) => ({
    Slot_ID: s.slotId,
    Section_ID: s.sectionId,
    Faculty_ID: s.facultyId,
    Room_Number: s.roomNumber,
    Day_of_Week: s.dayOfWeek,
    Start_Time: s.startTime,
    End_Time: s.endTime,
  }));
}

function mapDegreeRequirements(reqs) {
  return (reqs || []).map((dr) => ({
    Course_ID: dr.courseId,
    Course_Type: dr.courseType === 'SEED' ? 'Seed Course' : dr.courseType,
    Target_Semester: dr.targetSemester,
  }));
}

function mapPrerequisites(prereqs) {
  return (prereqs || []).map((p) => ({
    Target_Course_ID: p.targetCourseId,
    Required_Course_ID: p.requiredCourseId,
  }));
}

export const loadAD1Planning = ({ refresh = false } = {}) => {
  return async (dispatch, getState) => {
    const { auth, ad1Planning } = getState();
    const { data, error, loading, writing } = ad1Planning;
    if (loading || writing || (!refresh && data && !error)) return;

    dispatch(ad1Actions.loadStarted());
    try {
      const [courses, users, registrations, sections, slots, requirements, prerequisites] =
        await Promise.all([
          coursesService.getAll(),
          usersService.getAll(),
          registrationsService.getAll(),
          sectionsService.getAll(),
          slotsService.getAll(),
          coursesService.getDegreeRequirements().catch(() => []),
          coursesService.getPrerequisites().catch(() => []),
        ]);

      if (getState().auth.user !== auth.user) return;
      const planning = {
        courses: mapCourses(courses),
        users: mapUsers(users),
        registrations: mapRegistrations(registrations),
        sections: mapSections(sections),
        slots: mapSlots(slots),
        requirements: mapDegreeRequirements(requirements),
        prerequisites: mapPrerequisites(prerequisites),
      };
      dispatch(ad1Actions.loadSucceeded(planning));
      return planning;
    } catch (err) {
      console.error('AD1 data fetch error:', err);
      if (getState().auth.user === auth.user) {
        dispatch(ad1Actions.loadFailed(err.message || 'Failed to load data'));
      }
    }
  };
};

function startWrite(dispatch, getState, savingAssignments = false) {
  const { auth, ad1Planning } = getState();
  const { data, loading, writing } = ad1Planning;
  if (!data || loading || writing) {
    throw new Error('AD1 data is loading or a save is already in progress.');
  }

  dispatch(ad1Actions.writeStarted(savingAssignments));
  return () => getState().auth.user === auth.user;
}

function courseChanges(courseId, request, saved) {
  const [course] = mapCourses([{ ...request, ...saved, courseId }]);
  const year = Number(request.ugYear.slice(2));
  const targetSemester = year * 2 - (request.semester === 'Monsoon' ? 1 : 0);
  return {
    course,
    requirement: {
      Course_ID: courseId,
      Course_Type: request.courseType,
      Target_Semester: targetSemester,
    },
    prerequisites: request.prerequisites.map((code) => ({
      Target_Course_ID: courseId,
      Required_Course_ID: code,
    })),
  };
}

export const createAD1Course = (request) => {
  return async (dispatch, getState) => {
    const isCurrentSession = startWrite(dispatch, getState);
    try {
      const saved = await coursesService.create(request);
      const { courseId } = request;
      // The course endpoint creates a default section and returns only the course.
      const sections = isCurrentSession()
        ? await sectionsService.getAll().catch(() => [])
        : [];
      const changes = {
        ...courseChanges(courseId, request, saved),
        sections: mapSections(sections.filter((section) => section.courseId === courseId)),
      };
      if (isCurrentSession()) dispatch(ad1Actions.courseSaved(changes));
      return changes;
    } finally {
      if (isCurrentSession()) dispatch(ad1Actions.writeFinished());
    }
  };
};

export const updateAD1Course = ({ courseId, changes }) => {
  return async (dispatch, getState) => {
    const isCurrentSession = startWrite(dispatch, getState);
    try {
      const course = getState().ad1Planning.data.courses.find((entry) => entry.Course_ID === courseId);
      if (course?.Status === 'Active' && changes.status === 'Inactive') {
        const registrations = await registrationsService.getAll();
        if (!isCurrentSession()) return;

        if (registrations.some((entry) => entry.courseId === courseId && entry.status === 'Enrolled')) {
          const error = new Error('This course cannot be made inactive while students are enrolled.');
          error.field = 'status';
          throw error;
        }
      }

      const saved = await coursesService.update(courseId, changes);
      const result = courseChanges(courseId, changes, saved);
      if (isCurrentSession()) dispatch(ad1Actions.courseSaved(result));
      return result;
    } finally {
      if (isCurrentSession()) dispatch(ad1Actions.writeFinished());
    }
  };
};

export const saveAD1Assignments = ({ assignments, courseId, termId, sectionCount }) => {
  return async (dispatch, getState) => {
    const isCurrentSession = startWrite(dispatch, getState, true);
    const sections = [];
    try {
      const existing = await sectionsService.getAll().catch(() => []);
      sections.push(...existing.filter((section) => section.courseId === courseId));
      for (let i = 1; i <= sectionCount; i++) {
        if (!isCurrentSession()) return;
        const sectionId = `${courseId}-S${i}`;
        if (!existing.some((section) => section.sectionId === sectionId)) {
          const section = await sectionsService.create({
            sectionId,
            sectionName: `S${i}`,
            courseId,
            termId,
          });
          if (section) sections.push(section);
        }
      }

      if (!isCurrentSession()) return;
      const result = await registrationsService.batchAssignSections(assignments);
      const saved = {
        sections: mapSections(sections),
        updated: mapRegistrations(result.updated),
        errors: result.errors,
      };
      if (isCurrentSession()) dispatch(ad1Actions.assignmentsSaved(saved));
      return saved;
    } catch (err) {
      if (isCurrentSession()) dispatch(ad1Actions.sectionsReceived(mapSections(sections)));
      throw err;
    } finally {
      if (isCurrentSession()) dispatch(ad1Actions.writeFinished());
    }
  };
};

export const createAD1Slot = (request) => {
  return async (dispatch, getState) => {
    const isCurrentSession = startWrite(dispatch, getState);
    try {
      const saved = await slotsService.create(request);
      const slotId = saved?.slotId || Date.now();
      const [slot] = mapSlots([{ ...request, ...saved, slotId }]);
      if (isCurrentSession()) dispatch(ad1Actions.slotAdded(slot));
      return slot;
    } finally {
      if (isCurrentSession()) dispatch(ad1Actions.writeFinished());
    }
  };
};

export const updateAD1Slot = ({ slotId, changes }) => {
  return async (dispatch, getState) => {
    const isCurrentSession = startWrite(dispatch, getState);
    try {
      const previous = getState().ad1Planning.data.slots.find((slot) => slot.Slot_ID === slotId);
      const saved = await slotsService.update(slotId, changes);
      const [slot] = mapSlots([{
        sectionId: previous?.Section_ID,
        facultyId: previous?.Faculty_ID,
        ...changes,
        ...saved,
        slotId,
      }]);
      if (isCurrentSession()) dispatch(ad1Actions.slotUpdated(slot));
      return slot;
    } finally {
      if (isCurrentSession()) dispatch(ad1Actions.writeFinished());
    }
  };
};

export const deleteAD1Slot = (slotId) => {
  return async (dispatch, getState) => {
    const isCurrentSession = startWrite(dispatch, getState);
    try {
      await slotsService.delete(slotId);
      if (isCurrentSession()) dispatch(ad1Actions.slotRemoved(slotId));
      return slotId;
    } finally {
      if (isCurrentSession()) dispatch(ad1Actions.writeFinished());
    }
  };
};
