import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  data: null,
  loading: false,
  writing: false,
  savingAssignments: false,
  error: null,
};

function mergeSections(data, sections) {
  if (!sections.length) return;
  const byId = new Map(data.sections.map((section) => [section.Section_ID, section]));
  sections.forEach((section) => byId.set(section.Section_ID, section));
  data.sections = [...byId.values()];
}

const ad1PlanningSlice = createSlice({
  name: 'ad1Planning',
  initialState,
  reducers: {
    clearPlanning() {
      return initialState;
    },
    loadStarted(state) {
      state.loading = true;
      state.error = null;
    },
    loadSucceeded(state, { payload }) {
      state.data = payload;
      state.loading = false;
    },
    loadFailed(state, { payload }) {
      state.error = payload;
      state.loading = false;
    },
    writeStarted(state, { payload }) {
      state.writing = true;
      state.savingAssignments = payload;
    },
    writeFinished(state) {
      state.writing = false;
      state.savingAssignments = false;
    },
    courseSaved(state, { payload: { course, requirement, prerequisites, sections } }) {
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
    },
    assignmentsSaved(state, { payload: { sections, updated } }) {
      mergeSections(state.data, sections);
      const byEnrollment = new Map(updated.map((row) => [row.Enrollment_ID, row]));
      state.data.registrations = state.data.registrations.map(
        (row) => byEnrollment.get(row.Enrollment_ID) || row,
      );
    },
    sectionsReceived(state, { payload }) {
      mergeSections(state.data, payload);
    },
    slotAdded(state, { payload: slot }) {
      state.data.slots.push(slot);
    },
    slotUpdated(state, { payload: slot }) {
      state.data.slots = state.data.slots.map(
        (entry) => entry.Slot_ID === slot.Slot_ID ? slot : entry,
      );
    },
    slotRemoved(state, { payload: slotId }) {
      state.data.slots = state.data.slots.filter((slot) => slot.Slot_ID !== slotId);
    },
  },
});

export const ad1Actions = ad1PlanningSlice.actions;
export default ad1PlanningSlice;
