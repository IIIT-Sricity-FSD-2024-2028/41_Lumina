/**
 * Slot Allocation Controller
 * Handles mutations to the timetable data and syncing progress to Page 1.
 */

/**
 * Update the overall timetable progress in localStorage
 * @param {Object} appData 
 */
function updateProgressOnHome(appData) {
  // Ensure appData and timetable exist
  if (!appData || !appData.timetable || !appData.courses) return;
  
  // Formula: (courses with at least 1 allocated slot / total courses) * 100
  const uniqueAllocatedCourses = new Set(appData.timetable.map(a => a.courseCode));
  const totalCourses = appData.courses.length;
  
  if (totalCourses > 0) {
    const pct = Math.round((uniqueAllocatedCourses.size / totalCourses) * 100);
    localStorage.setItem('lumina_timetable_progress', pct);
  } else {
    localStorage.setItem('lumina_timetable_progress', 0);
  }
}

/**
 * Adds a new slot allocation to the institutional timetable.
 * @param {Object} alloc - The allocation object {day, timeSlot, courseCode, room, professor, section}
 * @param {Object} appData - Global app data
 */
function addAllocation(alloc, appData) {
  // Generate a unique ID for the new allocation
  const newId = 'alloc_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  alloc.id = newId;

  appData.timetable.push(alloc);
  saveData(appData);
  updateProgressOnHome(appData);
}

/**
 * Updates an existing slot allocation.
 * @param {Object} oldAlloc - The existing allocation to replace
 * @param {Object} newAlloc - The new allocation data
 * @param {Object} appData - Global app data
 */
function updateAllocation(oldAlloc, newAlloc, appData) {
  const idx = appData.timetable.findIndex(a => a.id === oldAlloc.id);
  if (idx !== -1) {
    // Preserve ID
    newAlloc.id = oldAlloc.id;
    appData.timetable[idx] = newAlloc;
    saveData(appData);
    updateProgressOnHome(appData);
  }
}

/**
 * Removes an existing slot allocation.
 * @param {Object} alloc - The allocation to remove
 * @param {Object} appData - Global app data
 */
function removeAllocation(alloc, appData) {
  const idx = appData.timetable.findIndex(a => a.id === alloc.id);
  if (idx !== -1) {
    appData.timetable.splice(idx, 1);
    saveData(appData);
    updateProgressOnHome(appData);
  }
}
