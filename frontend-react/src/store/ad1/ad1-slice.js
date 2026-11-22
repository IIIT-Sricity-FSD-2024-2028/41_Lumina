import { createSelector, createSlice, isAnyOf } from '@reduxjs/toolkit';
import { authActions } from '../auth/auth-slice';
import {
  buildAppCourses, buildFaculty, buildRecentActivities, buildRooms, buildStudentRecords, buildTimetable,
} from '../../pages/ad1/utils/dataTransforms';
import {
  createAD1Course, createAD1Slot, deleteAD1Slot, loadAD1Planning,
  saveAD1Assignments, updateAD1Course, updateAD1Slot,
} from './ad1-actions';

const initialState = {
  data: null,
  loadRequestId: null,
  writeRequestId: null,
  savingAssignments: false,
  error: null,
};

const writes = [
  createAD1Course, updateAD1Course, saveAD1Assignments, createAD1Slot, updateAD1Slot, deleteAD1Slot,
];

function mergeSections(data, sections) {
  if (!sections.length) return;
  const byId = new Map(data.sections.map((section) => [section.Section_ID, section]));
  sections.forEach((section) => byId.set(section.Section_ID, section));
  data.sections = [...byId.values()];
}

function applyCourseChanges(state, { payload, meta }) {
  if (state.writeRequestId !== meta.requestId) return;
  const { course, requirement, prerequisites, sections } = payload;
  const courseId = course.Course_ID;
  const data = state.data;
  const existing = data.courses.find((entry) => entry.Course_ID === courseId);
  if (existing) {
    Object.assign(existing, course);
  } else {
    data.courses.push(course);
  }
  data.requirements = data.requirements.filter((entry) => entry.Course_ID !== courseId);
  data.requirements.push(requirement);
  data.prerequisites = data.prerequisites.filter((entry) => entry.Target_Course_ID !== courseId);
  data.prerequisites.push(...prerequisites);
  if (sections) mergeSections(data, sections);
}

const ad1PlanningSlice = createSlice({
  name: 'ad1Planning',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(authActions.login, () => initialState)
      .addCase(authActions.logout, () => initialState)
      .addCase(loadAD1Planning.pending, (state, action) => {
        state.loadRequestId = action.meta.requestId;
        state.error = null;
      })
      .addCase(loadAD1Planning.fulfilled, (state, action) => {
        if (state.loadRequestId !== action.meta.requestId) return;
        state.data = action.payload;
        state.loadRequestId = null;
      })
      .addCase(loadAD1Planning.rejected, (state, action) => {
        if (state.loadRequestId !== action.meta.requestId) return;
        state.error = action.payload || action.error.message;
        state.loadRequestId = null;
      })
      .addCase(createAD1Course.fulfilled, applyCourseChanges)
      .addCase(updateAD1Course.fulfilled, applyCourseChanges)
      .addCase(saveAD1Assignments.fulfilled, (state, { payload, meta }) => {
        if (state.writeRequestId !== meta.requestId || !payload) return;
        mergeSections(state.data, payload.sections);
        const updated = new Map(payload.updated.map((row) => [row.Enrollment_ID, row]));
        state.data.registrations = state.data.registrations.map(
          (row) => updated.get(row.Enrollment_ID) || row,
        );
      })
      .addCase(saveAD1Assignments.rejected, (state, { payload, meta }) => {
        if (state.writeRequestId !== meta.requestId || !payload) return;
        mergeSections(state.data, payload.sections);
      })
      .addCase(createAD1Slot.fulfilled, (state, { payload, meta }) => {
        if (state.writeRequestId !== meta.requestId) return;
        state.data.slots.push(payload);
      })
      .addCase(updateAD1Slot.fulfilled, (state, { payload, meta }) => {
        if (state.writeRequestId !== meta.requestId) return;
        state.data.slots = state.data.slots.map(
          (slot) => slot.Slot_ID === payload.Slot_ID ? payload : slot,
        );
      })
      .addCase(deleteAD1Slot.fulfilled, (state, { payload, meta }) => {
        if (state.writeRequestId !== meta.requestId) return;
        state.data.slots = state.data.slots.filter((slot) => slot.Slot_ID !== payload);
      })
      .addMatcher(isAnyOf(...writes.map((thunk) => thunk.pending)), (state, action) => {
        state.writeRequestId = action.meta.requestId;
        state.savingAssignments = saveAD1Assignments.pending.match(action);
      })
      .addMatcher(isAnyOf(...writes.map((thunk) => thunk.settled)), (state, action) => {
        if (state.writeRequestId !== action.meta.requestId) return;
        state.writeRequestId = null;
        state.savingAssignments = false;
      });
  },
});

export const selectAD1Loading = ({ ad1Planning }) =>
  Boolean(ad1Planning.loadRequestId) || (!ad1Planning.data && !ad1Planning.error);
export const selectAD1Error = ({ ad1Planning }) => ad1Planning.error;
export const selectAD1Writing = ({ ad1Planning }) => Boolean(ad1Planning.writeRequestId);
export const selectAD1SavingAssignments = ({ ad1Planning }) => ad1Planning.savingAssignments;

export const selectAD1Data = createSelector(
  [(state) => state.ad1Planning.data],
  (data) => {
    if (!data) return null;
    const { courses, users, registrations, sections, slots, requirements, prerequisites } = data;
    const appCourses = buildAppCourses(courses, requirements, prerequisites, sections);
    return {
      courses: appCourses,
      faculty: buildFaculty(users, slots, sections, appCourses),
      students: buildStudentRecords(registrations, users, sections, appCourses),
      timetable: buildTimetable(slots, sections, users),
      rooms: buildRooms(slots),
      recentActivities: buildRecentActivities(registrations, courses, slots, users),
      departments: [...new Set(courses.map((course) => course.Dept_ID).filter(Boolean))],
      sections,
    };
  },
);

export default ad1PlanningSlice;
