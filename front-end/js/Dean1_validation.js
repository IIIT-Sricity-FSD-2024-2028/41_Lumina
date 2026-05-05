/**
 * Institutional Timetable Validation Engine
 * Implements strict cross-UG, cross-Department cross-check.
 */

/**
 * Validates a given slot for Faculty and Room conflicts across the entire institution.
 * 
 * @param {Object} draft - Draft allocation: { day, timeSlot, professor, room, editingAlloc }
 * @param {Object} appData - Global app data reference
 * @returns {Object} { facultyOk, roomOk, facultyMsg, roomMsg }
 */
function validateSlot(draft, appData) {
  const { day, timeSlot, professor, room, editingAlloc } = draft;

  let facultyOk = true;
  let roomOk = true;
  let facultyMsg = 'Faculty Availability';
  let roomMsg = 'Room Availability';

  // If we only need to validate partial dropdown states (e.g. checking a faculty without a room selected)
  if (!professor && !room) {
    return { facultyOk: false, roomOk: false, facultyMsg: 'Select Faculty', roomMsg: 'Select Room' };
  }

  // 1. Get ALL slots occurring at the exact same day and time
  const sameDayTimeAllocations = appData.timetable.filter(a => {
    // Exclude the allocation currently being edited from conflict checks
    if (editingAlloc && a.id === editingAlloc.id) return false;
    return a.day === day && a.timeSlot === timeSlot;
  });

  // 2. CHECK FACULTY CONFLICT
  if (professor) {
    const facultyConflict = sameDayTimeAllocations.find(a => a.professor === professor);
    if (facultyConflict) {
      facultyOk = false;
      facultyMsg = 'Faculty Not Available';
    } else {
      facultyOk = true;
      facultyMsg = 'Faculty Available';
    }
  } else {
    facultyOk = false;
    facultyMsg = 'Faculty Availability';
  }

  // 3. CHECK ROOM CONFLICT
  if (room) {
    const roomConflict = sameDayTimeAllocations.find(a => a.room === room);
    if (roomConflict) {
      roomOk = false;
      roomMsg = 'Room Not Available';
    } else {
      roomOk = true;
      roomMsg = 'Room Available';
    }
  } else {
    roomOk = false;
    roomMsg = 'Room Availability';
  }

  return { facultyOk, roomOk, facultyMsg, roomMsg };
}