/**
 * Timetable Validation Engine
 *
 * Migrated from legacy Dean1_validation.js.
 * Implements strict cross-UG, cross-Department conflict checks
 * for Faculty and Room at the same day + time slot.
 *
 * @param {Object} draft - { day, timeSlot, professor, room, editingAlloc }
 * @param {Array}  timetable - All current timetable allocations
 * @returns {Object} { facultyOk, roomOk, facultyMsg, roomMsg }
 */
export function validateSlot(draft, timetable) {
  const { day, timeSlot, professor, room, editingAlloc } = draft;

  let facultyOk;
  let roomOk;
  let facultyMsg;
  let roomMsg;

  if (!professor && !room) {
    return {
      facultyOk: false,
      roomOk: false,
      facultyMsg: 'Select Faculty',
      roomMsg: 'Select Room',
    };
  }

  // 1. All allocations at the same day + time (excluding the one being edited)
  const sameDayTimeAllocations = timetable.filter((a) => {
    if (editingAlloc && a.id === editingAlloc.id) return false;
    return a.day === day && a.timeSlot === timeSlot;
  });

  // 2. Faculty conflict
  if (professor) {
    const facultyConflict = sameDayTimeAllocations.find((a) => a.professor === professor);
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

  // 3. Room conflict
  if (room) {
    const roomConflict = sameDayTimeAllocations.find((a) => a.room === room);
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
