/**
 * Lumina — Home Dashboard (Page 1)
 * Renders stats, progress, room availability, and recent activities.
 */

document.addEventListener('DOMContentLoaded', () => {

  const data = loadData();

  renderNavbar('home');
  renderFooter();
  renderRoomTable(data, 'Monday');
  renderActivities(data);

  // Day filter change
  document.getElementById('dayFilter').addEventListener('change', (e) => {
    renderRoomTable(data, e.target.value);
  });

  // See History button
  const historyBtn = document.getElementById('seeHistoryBtn');
  const historyModal = document.getElementById('historyModal');
  const closeHistoryModal = document.getElementById('closeHistoryModal');

  historyBtn.addEventListener('click', (e) => {
    e.preventDefault();
    historyModal.classList.add('modal-overlay--active');
  });
  closeHistoryModal.addEventListener('click', () => historyModal.classList.remove('modal-overlay--active'));
  historyModal.addEventListener('click', (e) => {
    if (e.target === historyModal) historyModal.classList.remove('modal-overlay--active');
  });

  // View All Rooms link
  const viewAllRooms = document.getElementById('viewAllRooms');
  const allRoomsModal = document.getElementById('allRoomsModal');
  const closeAllRoomsModal = document.getElementById('closeAllRoomsModal');

  viewAllRooms.addEventListener('click', (e) => {
    e.preventDefault();
    allRoomsModal.classList.add('modal-overlay--active');
  });
  closeAllRoomsModal.addEventListener('click', () => allRoomsModal.classList.remove('modal-overlay--active'));
  allRoomsModal.addEventListener('click', (e) => {
    if (e.target === allRoomsModal) allRoomsModal.classList.remove('modal-overlay--active');
  });
});


/* ════════ Progress Bar ════════ */

function renderProgress(data) {
  const courses = data.courses.filter(c => c.status === 'Active');
  const total = courses.length;
  const allocatedCodes = new Set(data.timetable.map(t => t.courseCode));
  const allocated = courses.filter(c => allocatedCodes.has(c.code)).length;
  const pct = total > 0 ? Math.round((allocated / total) * 100) : 0;

  document.getElementById('progressPct').textContent = `${pct}% Completed`;
  document.getElementById('progressFill').style.width = `${pct}%`;
}


/* ════════ Stat Cards ════════ */

function renderStatCards(data) {
  const courses = data.courses.filter(c => c.status === 'Active');
  const total = courses.length;
  const allocatedCodes = new Set(data.timetable.map(t => t.courseCode));
  const allocated = courses.filter(c => allocatedCodes.has(c.code)).length;
  const pending = total - allocated;

  // Required slots = sum of course credits for active courses that are not yet allocated
  const requiredSlots = courses
    .filter(c => !allocatedCodes.has(c.code))
    .reduce((sum, c) => sum + c.credits, 0);

  const cards = [
    { icon: '📋', label: 'Total Courses', value: total, colorClass: 'stat-card__icon--blue' },
    { icon: '📅', label: 'Allocated', value: allocated, colorClass: 'stat-card__icon--green' },
    { icon: '⏳', label: 'Pending', value: pending, colorClass: 'stat-card__icon--red' },
    { icon: '🏫', label: 'Required Slots', value: requiredSlots, colorClass: 'stat-card__icon--amber' },
  ];

  const container = document.getElementById('statCards');
  container.innerHTML = cards.map(c => `
    <div class="stat-card">
      <div class="stat-card__icon ${c.colorClass}">${c.icon}</div>
      <div>
        <div class="stat-card__label">${c.label}</div>
        <div class="stat-card__value">${c.value}</div>
      </div>
    </div>
  `).join('');
}


/* ════════ Room Availability Table ════════ */

function renderRoomTable(data, day) {
  const tbody = document.getElementById('roomTableBody');

  const ALL_SLOT_KEYS = [
    '08:45-09:45',
    '09:45-10:45',
    '11:00-12:00',
    '12:00-13:00',
    '14:15-15:15',
    '15:15-16:15',
    '16:30-17:30',
    '17:30-18:30'
  ];

  tbody.innerHTML = data.rooms.map((room, roomIndex) => {
    const booked = new Set(
      data.timetable
        .filter(a => a.room === room.name && a.day === day)
        .map(a => a.timeSlot)
    );

    const avail = ALL_SLOT_KEYS.filter((slotKey) => !booked.has(slotKey));

    const slotsHTML = avail.length > 0
      ? avail.map(s => `<span class="time-tag">${s}</span>`).join('')
      : '<span class="time-tag--empty">No slots available</span>';

    const hasSlots  = avail.length > 0;
    const statusClass = hasSlots ? 'badge--available' : 'badge--booked';
    const statusText  = hasSlots ? 'Available' : 'Fully Booked';
    const dotClass    = hasSlots ? 'badge-dot--green' : 'badge-dot--red';

    return `
      <tr>
        <td style="font-weight:600">${room.name}</td>
        <td>${room.capacity}</td>
        <td>${slotsHTML}</td>
        <td>
          <span class="badge ${statusClass}">
            <span class="badge-dot ${dotClass}"></span>
            ${statusText}
          </span>
        </td>
      </tr>
    `;
  }).join('');
}



/* ════════ Recent Activities ════════ */

function renderActivities(data) {
  const list = document.getElementById('activityList');
  const assetBasePath = 'assets/icons';
  const iconMap = {
    slot: 'clipboard.svg',
    course: 'book.svg',
    success: 'tick.svg'
  };

  list.innerHTML = data.recentActivities.map(a => `
    <li class="activity-item">
      <div class="activity-item__icon">
        <img src="${assetBasePath}/${iconMap[a.icon] || 'clipboard.svg'}" alt="" class="activity-item__icon-img">
      </div>
      <div class="activity-item__content">
        <div class="activity-item__title">${a.title}</div>
        <div class="activity-item__detail">${a.detail}</div>
        <div class="activity-item__time">${a.time}</div>
      </div>
    </li>
  `).join('');
}
