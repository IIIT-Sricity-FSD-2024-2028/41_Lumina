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
async function addAllocation(alloc, appData) {
  const headers = { 'Content-Type': 'application/json', 'x-role': 'Assistant_Dean_1' };
  try {
    const res = await fetch('http://localhost:3000/course-slots', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sectionId: `${alloc.courseCode}-S1`,
        facultyId: appData.faculty.find(f => f.Full_Name === alloc.professor)?.User_ID || 'F2024001',
        roomNumber: alloc.room,
        dayOfWeek: alloc.day,
        startTime: alloc.timeSlot.split('-')[0],
        endTime: alloc.timeSlot.split('-')[1],
        syllabus: null
      })
    });
    if (res.ok) {
      const dbSlot = await res.json();
      alloc.id = dbSlot.slotId;
      appData.timetable.push(alloc);
      updateProgressOnHome(appData);
    }
  } catch(e) { console.error('Add slot failed', e); }
}

async function updateAllocation(oldAlloc, newAlloc, appData) {
  const headers = { 'Content-Type': 'application/json', 'x-role': 'Assistant_Dean_1' };
  try {
    const res = await fetch(`http://localhost:3000/course-slots/${oldAlloc.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        roomNumber: newAlloc.room,
        dayOfWeek: newAlloc.day,
        startTime: newAlloc.timeSlot.split('-')[0],
        endTime: newAlloc.timeSlot.split('-')[1]
      })
    });
    if (res.ok) {
      const idx = appData.timetable.findIndex(a => a.id === oldAlloc.id);
      if (idx !== -1) {
        newAlloc.id = oldAlloc.id;
        appData.timetable[idx] = newAlloc;
        updateProgressOnHome(appData);
      }
    }
  } catch(e) { console.error('Update slot failed', e); }
}

async function removeAllocation(alloc, appData) {
  const headers = { 'Content-Type': 'application/json', 'x-role': 'Assistant_Dean_1' };
  try {
    const res = await fetch(`http://localhost:3000/course-slots/${alloc.id}`, {
      method: 'DELETE',
      headers
    });
    if (res.ok) {
      const idx = appData.timetable.findIndex(a => a.id === alloc.id);
      if (idx !== -1) {
        appData.timetable.splice(idx, 1);
        updateProgressOnHome(appData);
      }
    }
  } catch(e) { console.error('Delete slot failed', e); }
}