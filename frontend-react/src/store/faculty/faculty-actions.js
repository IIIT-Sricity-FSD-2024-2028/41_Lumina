import { facultyActions } from './faculty-slice';
import { facultyService } from '../../services/faculty.service';

/**
 * Fetch full dashboard data for Faculty Home
 */
export const fetchFacultyDashboard = (user) => {
  return async (dispatch) => {
    dispatch(facultyActions.setLoading(true));
    dispatch(facultyActions.setError(null));

    try {
      const profile = facultyService.getProfile(user);

      const [courses, todaysClasses, allStudents] = await Promise.all([
        facultyService.getCourses(user),
        facultyService.getTodaysClasses(user),
        facultyService.getAllEnrolledStudents(user),
      ]);

      dispatch(
        facultyActions.setDashboardData({
          profile,
          courses,
          todaysClasses,
          allStudents,
        })
      );

      return { profile, courses, todaysClasses, allStudents };
    } catch (err) {
      console.error('Failed to load faculty dashboard data', err);
      dispatch(facultyActions.setError(err.message || 'Failed to load faculty dashboard'));
      throw err;
    } finally {
      dispatch(facultyActions.setLoading(false));
    }
  };
};

/**
 * Fetch courses assigned to the faculty
 */
export const fetchFacultyCourses = (user) => {
  return async (dispatch) => {
    dispatch(facultyActions.setLoading(true));
    dispatch(facultyActions.setError(null));

    try {
      const courses = await facultyService.getCourses(user);
      dispatch(facultyActions.setCourses(courses));
      return courses;
    } catch (err) {
      console.error('Failed to fetch faculty courses', err);
      dispatch(facultyActions.setError(err.message || 'Failed to fetch courses'));
      throw err;
    } finally {
      dispatch(facultyActions.setLoading(false));
    }
  };
};

/**
 * Fetch students enrolled in a specific course (for Rosters / Grading)
 */
export const fetchCourseStudents = (courseId) => {
  return async (dispatch) => {
    dispatch(facultyActions.setGradesLoading(true));
    try {
      const students = await facultyService.getStudentsForCourse(courseId);
      dispatch(facultyActions.setCurrentCourseStudents(students));
      return students;
    } catch (err) {
      console.error(`Failed to load students for course ${courseId}`, err);
      throw err;
    } finally {
      dispatch(facultyActions.setGradesLoading(false));
    }
  };
};

/**
 * Save draft marks for a course
 */
export const saveDraftGrades = (courseId, gradesList) => {
  return async (dispatch) => {
    try {
      const saved = await facultyService.saveDraftGrades(courseId, gradesList);
      dispatch(facultyActions.setCurrentCourseStudents(saved));
      return saved;
    } catch (err) {
      console.error('Failed to save draft grades', err);
      throw err;
    }
  };
};

/**
 * Submit finalized grades and sync to backend
 */
export const submitFinalGrades = (courseId, gradesList) => {
  return async (dispatch) => {
    dispatch(facultyActions.setSubmittingGrades(true));
    try {
      const result = await facultyService.submitFinalGrades(courseId, gradesList);
      dispatch(facultyActions.setCurrentCourseStudents(result.grades));
      return result;
    } catch (err) {
      console.error('Failed to submit final grades', err);
      throw err;
    } finally {
      dispatch(facultyActions.setSubmittingGrades(false));
    }
  };
};

/**
 * Fetch materials for a specific course
 */
export const fetchCourseMaterials = (courseId) => {
  return async (dispatch) => {
    dispatch(facultyActions.setMaterialsLoading(true));
    try {
      const mats = await facultyService.getMaterials(courseId);
      dispatch(facultyActions.setCurrentCourseMaterials(mats));
      return mats;
    } catch (err) {
      console.error(`Failed to load materials for course ${courseId}`, err);
      dispatch(facultyActions.setCurrentCourseMaterials([]));
      return [];
    } finally {
      dispatch(facultyActions.setMaterialsLoading(false));
    }
  };
};

/**
 * Upload & add a course material
 */
export const addCourseMaterial = (courseId, materialData, file) => {
  return async (dispatch) => {
    try {
      const result = await facultyService.addMaterial(courseId, materialData, file);
      if (result.material) {
        dispatch(facultyActions.addMaterialToState(result.material));
      }
      return result;
    } catch (err) {
      console.error('Failed to upload material', err);
      throw err;
    }
  };
};

/**
 * Fetch all announcements for faculty
 */
export const fetchAnnouncements = () => {
  return async (dispatch) => {
    dispatch(facultyActions.setAnnouncementsLoading(true));
    try {
      const list = await facultyService.getAnnouncements();
      dispatch(facultyActions.setAnnouncements(list));
      return list;
    } catch (err) {
      console.error('Failed to fetch announcements', err);
      throw err;
    } finally {
      dispatch(facultyActions.setAnnouncementsLoading(false));
    }
  };
};

/**
 * Create a new announcement
 */
export const createAnnouncement = (data, file) => {
  return async (dispatch) => {
    try {
      const result = await facultyService.createAnnouncement(data, file);
      if (result.created) {
        dispatch(facultyActions.addAnnouncementToState(result.created));
      }
      return result;
    } catch (err) {
      console.error('Failed to create announcement', err);
      throw err;
    }
  };
};

/**
 * Update an existing announcement
 */
export const updateAnnouncement = (id, data) => {
  return async (dispatch) => {
    try {
      const result = await facultyService.updateAnnouncement(id, data);
      if (result.updated) {
        dispatch(facultyActions.updateAnnouncementInState(result.updated));
      }
      return result;
    } catch (err) {
      console.error('Failed to update announcement', err);
      throw err;
    }
  };
};

/**
 * Delete an announcement
 */
export const deleteAnnouncement = (id) => {
  return async (dispatch) => {
    try {
      const result = await facultyService.deleteAnnouncement(id);
      dispatch(facultyActions.removeAnnouncementFromState(id));
      return result;
    } catch (err) {
      console.error('Failed to delete announcement', err);
      throw err;
    }
  };
};
