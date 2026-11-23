import { createAsyncThunk } from '@reduxjs/toolkit';
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

export const loadAD1Planning = createAsyncThunk(
  'ad1Planning/load',
  async (_, { rejectWithValue }) => {
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

      return {
        courses: mapCourses(courses),
        users: mapUsers(users),
        registrations: mapRegistrations(registrations),
        sections: mapSections(sections),
        slots: mapSlots(slots),
        requirements: mapDegreeRequirements(requirements),
        prerequisites: mapPrerequisites(prerequisites),
      };
    } catch (err) {
      console.error('AD1 data fetch error:', err);
      return rejectWithValue(err.message || 'Failed to load data');
    }
  },
  {
    condition: ({ refresh = false } = {}, { getState }) => {
      const { data, error, loadRequestId, writeRequestId } = getState().ad1Planning;
      return !loadRequestId && !writeRequestId && (refresh || !data || Boolean(error));
    },
  },
);

function canWritePlanning(_, { getState }) {
  const { data, loadRequestId, writeRequestId } = getState().ad1Planning;
  return !!data && !loadRequestId && !writeRequestId;
}

function writeError(err) {
  return { message: err.response?.data?.message || err.message };
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

export const createAD1Course = createAsyncThunk(
  'ad1Planning/createCourse',
  async (request, { getState, requestId, rejectWithValue }) => {
    try {
      const saved = await coursesService.create(request);
      const { courseId } = request;
      // The course endpoint creates a default section and returns only the course.
      const sections = getState().ad1Planning.writeRequestId === requestId
        ? await sectionsService.getAll().catch(() => [])
        : [];
      return {
        ...courseChanges(courseId, request, saved),
        sections: mapSections(sections.filter((section) => section.courseId === courseId)),
      };
    } catch (err) {
      return rejectWithValue(writeError(err));
    }
  },
  { condition: canWritePlanning },
);

export const updateAD1Course = createAsyncThunk(
  'ad1Planning/updateCourse',
  async ({ courseId, changes }, { rejectWithValue }) => {
    try {
      const saved = await coursesService.update(courseId, changes);
      return courseChanges(courseId, changes, saved);
    } catch (err) {
      return rejectWithValue(writeError(err));
    }
  },
  { condition: canWritePlanning },
);

export const saveAD1Assignments = createAsyncThunk(
  'ad1Planning/saveAssignments',
  async ({ assignments, courseId, termId, sectionCount }, { getState, requestId, rejectWithValue }) => {
    const sections = [];
    try {
      const existing = await sectionsService.getAll().catch(() => []);
      sections.push(...existing.filter((section) => section.courseId === courseId));
      for (let i = 1; i <= sectionCount; i++) {
        if (getState().ad1Planning.writeRequestId !== requestId) return;
        const sectionId = `${courseId}-S${i}`;
        if (!existing.some((section) => section.sectionId === sectionId)) {
          const section = await sectionsService.create({
            sectionId,
            sectionName: `S${i}`,
            courseId,
            termId,
            capacity: 100,
          }).catch(() => null);
          if (section) sections.push(section);
        }
      }

      if (getState().ad1Planning.writeRequestId !== requestId) return;
      const result = await registrationsService.batchAssignSections(assignments);
      return {
        sections: mapSections(sections),
        updated: mapRegistrations(result.updated),
        errors: result.errors,
      };
    } catch (err) {
      return rejectWithValue({ ...writeError(err), sections: mapSections(sections) });
    }
  },
  { condition: canWritePlanning },
);

export const createAD1Slot = createAsyncThunk(
  'ad1Planning/createSlot',
  async (request, { rejectWithValue }) => {
    try {
      const saved = await slotsService.create(request);
      const slotId = saved?.slotId || Date.now();
      const [slot] = mapSlots([{ ...request, ...saved, slotId }]);
      return slot;
    } catch (err) {
      return rejectWithValue(writeError(err));
    }
  },
  { condition: canWritePlanning },
);

export const updateAD1Slot = createAsyncThunk(
  'ad1Planning/updateSlot',
  async ({ slotId, changes }, { getState, rejectWithValue }) => {
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
      return slot;
    } catch (err) {
      return rejectWithValue(writeError(err));
    }
  },
  { condition: canWritePlanning },
);

export const deleteAD1Slot = createAsyncThunk(
  'ad1Planning/deleteSlot',
  async (slotId, { rejectWithValue }) => {
    try {
      await slotsService.delete(slotId);
      return slotId;
    } catch (err) {
      return rejectWithValue(writeError(err));
    }
  },
  { condition: canWritePlanning },
);
