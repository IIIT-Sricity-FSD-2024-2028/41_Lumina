/**
 * AD1 Dashboard — Deal1 Home (Page 1)
 * Refactored to use shared AD1PageLayout, StatCard, and DataTable.
 */
import { useState, useMemo } from 'react';
import AD1PageLayout from './components/AD1PageLayout';
import StatCard, { StatCardsRow } from './components/StatCard';
import DataTable from './components/DataTable';
import useAD1Data from './hooks/useAD1Data';
import { ALL_SLOT_KEYS } from './utils/dataTransforms';
import shared from './styles/ad1-shared.module.css';
import styles from './AD1Dashboard.module.css';

export default function AD1Dashboard() {
  const { data, loading, error } = useAD1Data();
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedRoomIdx, setSelectedRoomIdx] = useState(0);

  const stats = useMemo(() => {
    if (!data) return null;
    const courses = data.courses.filter((c) => c.status === 'Active');
    const total = courses.length;
    const allocatedCodes = new Set(data.timetable.map((t) => t.courseCode));
    const allocated = courses.filter((c) => allocatedCodes.has(c.code)).length;
    const pending = total - allocated;
    const requiredSlots = courses
      .filter((c) => !allocatedCodes.has(c.code))
      .reduce((sum, c) => sum + c.credits, 0);
    return { total, allocated, pending, requiredSlots };
  }, [data]);

  const roomCard = useMemo(() => {
    if (!data || data.rooms.length === 0) return null;
    const idx = Math.min(selectedRoomIdx, data.rooms.length - 1);
    const room = data.rooms[idx];
    const booked = new Set(
      data.timetable
        .filter((a) => a.room === room.name && a.day === selectedDay)
        .map((a) => a.timeSlot)
    );
    const avail = ALL_SLOT_KEYS.filter((s) => !booked.has(s));
    return { room, avail, hasSlots: avail.length > 0 };
  }, [data, selectedDay, selectedRoomIdx]);

  return (
    <AD1PageLayout loading={loading} error={error} loadingMessage="Loading Dashboard...">
      {stats && (
        <>
          <StatCardsRow>
            <StatCard icon="📋" label="Total Courses" value={stats.total} color="blue" />
            <StatCard icon="📅" label="Allocated" value={stats.allocated} color="green" />
            <StatCard icon="⏳" label="Pending" value={stats.pending} color="red" />
            <StatCard icon="🏫" label="Required Slots" value={stats.requiredSlots} color="amber" />
          </StatCardsRow>

          <section className={styles.dashboardBottom}>
            {/* Room Availability */}
            <div className={styles.card}>
              <h2 className={styles.panelTitle}>Room Availability Overview</h2>
              <div className={styles.roomFilters}>
                <div className={styles.roomFilter}>
                  <label className={styles.roomFilterLabel} htmlFor="dayFilter">Day</label>
                  <select id="dayFilter" className={styles.selectSm} value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.roomFilter}>
                  <label className={styles.roomFilterLabel} htmlFor="roomFilter">Room</label>
                  <select id="roomFilter" className={styles.selectSm} value={selectedRoomIdx}
                    onChange={(e) => setSelectedRoomIdx(Number(e.target.value))}>
                    {data.rooms.map((r, i) => (
                      <option key={r.name} value={i}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {roomCard && (
                <div className={styles.roomCard}>
                  <div className={styles.roomCardName}>{roomCard.room.name}</div>
                  <div className={styles.roomCardMeta}>
                    <div className={styles.roomCardMetaItem}>
                      <span className={styles.roomCardMetaLabel}>Capacity</span>
                      <span className={styles.roomCardMetaValue}>{roomCard.room.capacity}</span>
                    </div>
                    <div className={styles.roomCardMetaItem}>
                      <span className={styles.roomCardMetaLabel}>Status</span>
                      {roomCard.hasSlots ? (
                        <span className={`${styles.badge} ${styles.badgeAvailable}`}>
                          <span className={`${styles.badgeDot} ${styles.dotGreen}`} />Available
                        </span>
                      ) : (
                        <span className={`${styles.badge} ${styles.badgeBooked}`}>
                          <span className={`${styles.badgeDot} ${styles.dotRed}`} />Fully Booked
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.roomCardSlots}>
                    {roomCard.hasSlots ? (
                      <>
                        <div className={styles.roomCardSlotsLabel}>Available Timeslots</div>
                        {roomCard.avail.map((s) => (
                          <span key={s} className={styles.timeTag}>{s}</span>
                        ))}
                      </>
                    ) : (
                      <span className={styles.timeTagEmpty}>All slots booked for this day</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Recent Activities */}
            <div className={styles.card}>
              <h2 className={styles.panelTitle}>Recent Activities</h2>
              <div className={styles.activityTableWrapper}>
                <DataTable columns={['Activity', 'Details', 'Time']}>
                  {data.recentActivities.map((a, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{a.title}</td>
                      <td>{a.detail}</td>
                      <td className={styles.activityTime}>{a.time}</td>
                    </tr>
                  ))}
                </DataTable>
              </div>
            </div>
          </section>
        </>
      )}
    </AD1PageLayout>
  );
}
