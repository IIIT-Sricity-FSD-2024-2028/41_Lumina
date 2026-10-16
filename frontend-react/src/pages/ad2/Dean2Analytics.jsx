import { useState, useEffect, useMemo } from 'react';
import Dean2Layout from './Dean2Layout';
import TierGate from '../../components/TierGate';
import { coursesService } from '../../services/courses.service';
import { registrationsService } from '../../services/registrations.service';
import { sectionsService } from '../../services/sections.service';
import { usersService } from '../../services/users.service';
import styles from './Dean2.module.css';

export default function Dean2Analytics() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [sections, setSections] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    let ignore = false;
    async function loadAnalytics() {
      try {
        setLoading(true);
        const [cRes, rRes, sRes, uRes] = await Promise.allSettled([
          coursesService.getAll(),
          registrationsService.getAll(),
          sectionsService.getAll(),
          usersService.getAll(),
        ]);

        if (!ignore) {
          if (cRes.status === 'fulfilled' && Array.isArray(cRes.value)) {
            setCourses(cRes.value);
          }
          if (rRes.status === 'fulfilled' && Array.isArray(rRes.value)) {
            setRegistrations(rRes.value);
          }
          if (sRes.status === 'fulfilled' && Array.isArray(sRes.value)) {
            setSections(sRes.value);
          }
          if (uRes.status === 'fulfilled' && Array.isArray(uRes.value)) {
            setUsers(uRes.value);
          }
        }
      } catch (err) {
        console.error('Failed to load analytics data:', err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadAnalytics();
    return () => {
      ignore = true;
    };
  }, []);

  // Compute Year-wise Enrollment Progress
  const yearWiseStats = useMemo(() => {
    const students = users.filter((u) => (u.role || u.Role) === 'Student');
    const enrolledIds = new Set(
      registrations
        .filter((r) => (r.status || r.Status || 'Enrolled') === 'Enrolled')
        .map((r) => r.studentId || r.Student_ID)
    );

    const getYearGroup = (s) => {
      const sid = s.userId || s.User_ID || s.studentId || '';
      if (sid.includes('2025') || s.currentSemester <= 2) return 1;
      if (sid.includes('2024') || s.currentSemester === 3 || s.currentSemester === 4) return 2;
      if (sid.includes('2023') || s.currentSemester === 5 || s.currentSemester === 6) return 3;
      return 4;
    };

    const groups = {
      1: { label: '1st Year', sub: 'Freshman Intake', total: 0, enrolled: 0 },
      2: { label: '2nd Year', sub: 'Sophomore Retention', total: 0, enrolled: 0 },
      3: { label: '3rd Year', sub: 'Junior Specialization', total: 0, enrolled: 0 },
      4: { label: '4th Year', sub: 'Senior Graduation Track', total: 0, enrolled: 0 },
    };

    students.forEach((s) => {
      const yg = getYearGroup(s);
      if (groups[yg]) {
        groups[yg].total += 1;
        const sid = s.userId || s.User_ID || s.studentId;
        if (enrolledIds.has(sid)) {
          groups[yg].enrolled += 1;
        }
      }
    });

    return Object.values(groups).map((g) => {
      const pct = g.total > 0 ? Math.round((g.enrolled / g.total) * 100) : 0;
      return { ...g, pct };
    });
  }, [users, registrations]);

  // Compute Department Statistics
  const deptStats = useMemo(() => {
    const capacityByCourse = {};
    sections.forEach((s) => {
      const cid = s.courseId || s.Course_ID;
      if (cid) {
        capacityByCourse[cid] = (capacityByCourse[cid] || 0) + (Number(s.capacity || s.Capacity) || 40);
      }
    });

    const byDept = {};
    courses.forEach((c) => {
      const dept = c.deptId || c.Dept_ID || 'General';
      const cid = c.courseId || c.Course_ID;
      if (!byDept[dept]) {
        byDept[dept] = { dept, totalCapacity: 0, courseIds: [] };
      }
      byDept[dept].totalCapacity += capacityByCourse[cid] || 40;
      byDept[dept].courseIds.push(cid);
    });

    return Object.values(byDept).map((d) => {
      const enrolled = registrations.filter(
        (r) => d.courseIds.includes(r.courseId || r.Course_ID) && (r.status || r.Status || 'Enrolled') === 'Enrolled'
      ).length;
      const utilPct = d.totalCapacity > 0 ? Math.min(100, Math.round((enrolled / d.totalCapacity) * 100)) : 0;
      return {
        dept: d.dept,
        totalCapacity: d.totalCapacity,
        enrolled,
        utilPct,
      };
    }).sort((a, b) => b.utilPct - a.utilPct);
  }, [courses, sections, registrations]);

  // Compute Course Capacity Monitoring
  const courseCapacities = useMemo(() => {
    const capacityByCourse = {};
    sections.forEach((s) => {
      const cid = s.courseId || s.Course_ID;
      if (cid) {
        capacityByCourse[cid] = (capacityByCourse[cid] || 0) + (Number(s.capacity || s.Capacity) || 40);
      }
    });

    const list = courses.map((c) => {
      const cid = c.courseId || c.Course_ID;
      const cap = capacityByCourse[cid] || 60;
      const enrolled = registrations.filter(
        (r) => (r.courseId || r.Course_ID) === cid && (r.status || r.Status || 'Enrolled') === 'Enrolled'
      ).length;
      const utilPct = cap > 0 ? Math.min(100, Math.round((enrolled / cap) * 100)) : 0;
      const courseType = c.courseType || c.Course_Type || (c.credits >= 4 ? 'Program Core' : 'Institute Core');

      return {
        courseId: cid,
        courseName: c.courseName || c.Course_Name || '',
        courseType,
        capacity: cap,
        enrolled,
        utilPct,
      };
    });

    list.sort((a, b) => b.utilPct - a.utilPct || a.courseId.localeCompare(b.courseId));
    return list;
  }, [courses, sections, registrations]);

  return (
    <Dean2Layout>
      <TierGate requiredTier="Campus" featureName="Enrollment Analytics &amp; Projections">
        <div className={styles.pageHeader}>
          <h1>Enrollment Monitoring</h1>
          <p>Track enrollment activity and capacity utilization across departments.</p>
        </div>

        {/* Year-wise Enrollment Progress */}
        <div className={styles.card}>
          <div className={styles.flexBetween} style={{ marginBottom: '1.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '1.1rem' }}>📊</span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--d2-primary)' }}>
                  Year-wise Enrollment Progress
                </h3>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--d2-text-muted)' }}>
                Comparative analysis of enrollment targets across academic years
              </p>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.82rem',
                color: 'var(--d2-text-muted)',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  background: 'var(--d2-primary)',
                  borderRadius: '50%',
                }}
              ></span>
              Actual Enrollment
            </div>
          </div>

          <div className={styles.grid2}>
            {yearWiseStats.map((y) => (
              <div key={y.label}>
                <div className={styles.flexBetween} style={{ marginBottom: '6px' }}>
                  <div>
                    <div className={styles.analyticsYearLabel}>{y.label}</div>
                    <div className={styles.analyticsYearSub}>
                      {y.sub} ({loading ? '...' : `${y.enrolled}/${y.total} students`})
                    </div>
                  </div>
                  <div className={styles.analyticsPct}>{loading ? '...' : `${y.pct}%`}</div>
                </div>
                <div className={styles.progressBarBg} style={{ height: '12px' }}>
                  <div
                    className={styles.progressBarFill}
                    style={{ width: `${loading ? 0 : Math.min(100, y.pct)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Department Statistics */}
        <div className={styles.card}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--d2-primary)', marginBottom: '1.5rem' }}>
            Department Statistics
          </h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Department</th>
                <th>Total Capacity</th>
                <th>Students Enrolled</th>
                <th>Utilization %</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--d2-text-muted)' }}>
                    Loading department statistics...
                  </td>
                </tr>
              ) : deptStats.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--d2-text-muted)' }}>
                    No department data available.
                  </td>
                </tr>
              ) : (
                deptStats.map((d) => {
                  const utilClass =
                    d.utilPct >= 80
                      ? styles.utilizationHigh
                      : d.utilPct >= 50
                      ? styles.utilizationMed
                      : styles.utilizationLow;

                  return (
                    <tr key={d.dept}>
                      <td>
                        <strong>{d.dept}</strong>
                      </td>
                      <td>{d.totalCapacity.toLocaleString()}</td>
                      <td>{d.enrolled.toLocaleString()}</td>
                      <td>
                        <div className={styles.progressRow}>
                          <div className={styles.progressBarBg} style={{ height: '8px' }}>
                            <div className={styles.progressBarFill} style={{ width: `${d.utilPct}%` }}></div>
                          </div>
                          <span className={utilClass} style={{ minWidth: '38px' }}>
                            {d.utilPct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Course Capacity Monitoring */}
        <div className={styles.card}>
          <div className={styles.flexBetween} style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--d2-primary)' }}>
              Course Capacity Monitoring
            </h3>
            {courseCapacities.some((c) => c.utilPct >= 80) && (
              <span className={styles.criticalBadge}>⚠️ Critical: Low Seats Remaining</span>
            )}
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Type</th>
                <th>Capacity</th>
                <th>Enrolled</th>
                <th>Utilization %</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--d2-text-muted)' }}>
                    Loading course capacity data...
                  </td>
                </tr>
              ) : courseCapacities.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--d2-text-muted)' }}>
                    No course capacity records found.
                  </td>
                </tr>
              ) : (
                courseCapacities.map((c) => {
                  const isCrit = c.utilPct >= 90;
                  const utilClass = isCrit
                    ? styles.utilizationCrit
                    : c.utilPct >= 75
                    ? styles.utilizationHigh
                    : styles.utilizationMed;
                  const barColor = isCrit ? '#DC2626' : undefined;

                  return (
                    <tr key={c.courseId}>
                      <td>
                        <strong>{c.courseId}</strong>
                        {c.courseName && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--d2-text-muted)', display: 'block' }}>
                            {c.courseName}
                          </span>
                        )}
                      </td>
                      <td>{c.courseType}</td>
                      <td>{c.capacity}</td>
                      <td>{c.enrolled}</td>
                      <td>
                        <div className={styles.progressRow}>
                          <div className={styles.progressBarBg} style={{ height: '8px' }}>
                            <div
                              className={styles.progressBarFill}
                              style={{ width: `${c.utilPct}%`, background: barColor }}
                            ></div>
                          </div>
                          <span className={utilClass} style={{ minWidth: '38px' }}>
                            {c.utilPct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </TierGate>
    </Dean2Layout>
  );
}
