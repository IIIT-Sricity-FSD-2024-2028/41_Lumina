/**
 * Lumina — Home Dashboard (Page 1)
 * Renders stats, progress, room availability, and recent activities.
 */

let dashData;
let currentRoomIndex = 0;

document.addEventListener('DOMContentLoaded', async () => {

  dashData = await loadData();

  renderNavbar('home');
  renderFooter();

  // Populate room dropdown
  const roomFilter = document.getElementById('roomFilter');
  dashData.rooms.forEach((room, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = room.name;
    roomFilter.appendChild(opt);
  });

  renderRoomCard(dashData, 'Monday');
  renderActivities(dashData);

  // Day filter change
  document.getElementById('dayFilter').addEventListener('change', (e) => {
    renderRoomCard(dashData, e.target.value);
  });

  // Room dropdown change
  roomFilter.addEventListener('change', (e) => {
    currentRoomIndex = parseInt(e.target.value, 10);
    renderRoomCard(dashData, document.getElementById('dayFilter').value);
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


/* ════════ Room Availability — Single Card with Dropdown ════════ */

function renderRoomCard(data, day) {
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

  const rooms = data.rooms;
  if (rooms.length === 0) return;

  if (currentRoomIndex >= rooms.length) currentRoomIndex = rooms.length - 1;
  if (currentRoomIndex < 0) currentRoomIndex = 0;

  const room = rooms[currentRoomIndex];

  const booked = new Set(
    data.timetable
      .filter(a => a.room === room.name && a.day === day)
      .map(a => a.timeSlot)
  );

  const avail = ALL_SLOT_KEYS.filter(slotKey => !booked.has(slotKey));
  const hasSlots = avail.length > 0;

  // Room name
  document.getElementById('roomCardName').textContent = room.name;

  // Capacity
  document.getElementById('roomCardCapacity').textContent = room.capacity;

  // Status badge
  const statusEl = document.getElementById('roomCardStatus');
  if (hasSlots) {
    statusEl.innerHTML = `<span class="badge badge--available"><span class="badge-dot badge-dot--green"></span> Available</span>`;
  } else {
    statusEl.innerHTML = `<span class="badge badge--booked"><span class="badge-dot badge-dot--red"></span> Fully Booked</span>`;
  }

  // Available timeslots
  const slotsEl = document.getElementById('roomCardSlots');
  if (hasSlots) {
    slotsEl.innerHTML =
      '<div class="room-card__slots-label">Available Timeslots</div>' +
      avail.map(s => `<span class="time-tag">${s}</span>`).join('');
  } else {
    slotsEl.innerHTML = '<span class="time-tag--empty">All slots booked for this day</span>';
  }
}


/* ════════ Recent Activities — Inline Table ════════ */

function renderActivities(data) {
  const tbody = document.getElementById('activityTableBody');
  tbody.innerHTML = data.recentActivities.map(a => `
    <tr>
      <td style="font-weight:600">${a.title}</td>
      <td>${a.detail}</td>
      <td style="white-space:nowrap; color: var(--accent); font-weight:500">${a.time}</td>
    </tr>
  `).join('');
}