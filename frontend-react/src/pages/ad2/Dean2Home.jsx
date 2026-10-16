import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Dean2Layout from './Dean2Layout';
import { policiesService } from '../../services/policies.service';
import { overridesService } from '../../services/overrides.service';
import { usersService } from '../../services/users.service';
import { coursesService } from '../../services/courses.service';
import { registrationsService } from '../../services/registrations.service';
import { sectionsService } from '../../services/sections.service';
import styles from './Dean2.module.css';

function computeTermLabel(academicYear, term) {
  if (!academicYear || !term) return '—';
  const parts = academicYear.split('-');
  if (parts.length !== 2) return `${term} ${academicYear}`;
  const startYear = parts[0].trim();
  const endYear = parts[1].trim();
  if (term === 'Spring' || term === 'Summer') return `${term} ${endYear}`;
  if (term === 'Monsoon' || term === 'Fall') return `${term} ${startYear}`;
  return `${term} ${endYear}`;
}

function formatDateOnly(dtStr) {
  if (!dtStr) return '';
  const d = new Date(dtStr);
  return d.toLocaleString([], { month: 'short', day: 'numeric' });
}

export default function Dean2Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState({});
  const [activePhase, setActivePhase] = useState(null);
  const [pendingOverridesCount, setPendingOverridesCount] = useState(0);
  const [metrics, setMetrics] = useState({
    totalEnrolled: 0,
    yetToEnroll: 0,
    targetStudents: 0,
    enrollmentProgress: 0,
    totalCourses: 0,
  });
  const [ugBreakdown, setUgBreakdown] = useState([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [
          polData,
          phasesData,
          overridesData,
          usersData,
          coursesData,
          regsData,
          sectionsData,
        ] = await Promise.allSettled([
          policiesService.getPolicies(),
          policiesService.getPhases(),
          overridesService.getAll(),
          usersService.getAll(),
          coursesService.getAll(),
          registrationsService.getAll(),
          sectionsService.getAll(),
        ]);

        if (polData.status === 'fulfilled' && polData.value?.settings) {
          setPolicies(polData.value.settings);
        }

        if (phasesData.status === 'fulfilled' && Array.isArray(phasesData.value)) {
          const active = phasesData.value.find((p) => p.status === 'Active');
          setActivePhase(active ? active.name : null);
        }

        if (overridesData.status === 'fulfilled' && Array.isArray(overridesData.value)) {
          const pending = overridesData.value.filter(
            (o) => (o.approvalStatus || o.Approval_Status) === 'Pending'
          ).length;
          setPendingOverridesCount(pending);
        }

        const users = usersData.status === 'fulfilled' && Array.isArray(usersData.value) ? usersData.value : [];
        const courses = coursesData.status === 'fulfilled' && Array.isArray(coursesData.value) ? coursesData.value : [];
        const registrations = regsData.status === 'fulfilled' && Array.isArray(regsData.value) ? regsData.value : [];
        const sections = sectionsData.status === 'fulfilled' && Array.isArray(sectionsData.value) ? sectionsData.value : [];

        const students = users.filter((u) => (u.role || u.Role) === 'Student');
        const enrolledStudentIds = new Set(
          registrations
            .filter((r) => (r.status || r.Status || 'Enrolled') === 'Enrolled')
            .map((r) => r.studentId || r.Student_ID)
        );
        const enrolledCount = enrolledStudentIds.size;
        const totalStudentCount = students.length || enrolledCount || 0;
        const yetToEnrollCount = Math.max(0, totalStudentCount - enrolledCount);
        const progressPct = totalStudentCount > 0 ? Math.round((enrolledCount / totalStudentCount) * 100) : 0;

        setMetrics({
          totalEnrolled: enrolledCount,
          yetToEnroll: yetToEnrollCount,
          targetStudents: totalStudentCount,
          enrollmentProgress: progressPct,
          totalCourses: courses.length,
        });

        // Build capacity map by courseId
        const capacityByCourse = {};
        sections.forEach((s) => {
          const cid = s.courseId || s.Course_ID;
          if (cid) {
            capacityByCourse[cid] = (capacityByCourse[cid] || 0) + (Number(s.capacity || s.Capacity) || 40);
          }
        });

        // Group courses by UG Level and Department
        const groups = {};
        courses.forEach((c) => {
          const cid = c.courseId || c.Course_ID || '';
          const dept = c.deptId || c.Dept_ID || 'General';
          const match = cid.match(/\d+/);
          const num = match ? parseInt(match[0], 10) : 100;
          const ugLevel = num >= 400 ? 'UG4' : num >= 300 ? 'UG3' : num >= 200 ? 'UG2' : 'UG1';
          const key = `${ugLevel}_${dept}`;

          if (!groups[key]) {
            groups[key] = {
              ugLevel,
              dept,
              courseIds: [],
              seats: 0,
            };
          }
          groups[key].courseIds.push(cid);
          groups[key].seats += capacityByCourse[cid] || 40;
        });

        const breakdown = Object.values(groups).map((g) => {
          const enrolledInGroup = registrations.filter(
            (r) => g.courseIds.includes(r.courseId || r.Course_ID) && (r.status || r.Status || 'Enrolled') === 'Enrolled'
          ).length;
          const fillRate = g.seats > 0 ? Math.min(100, Math.round((enrolledInGroup / g.seats) * 100)) : 0;
          const status = fillRate >= 75 ? 'Stable' : fillRate >= 40 ? 'Active' : 'On Track';

          return {
            ugLevel: g.ugLevel,
            dept: g.dept,
            coursesCount: g.courseIds.length,
            totalSeats: g.seats,
            enrolled: enrolledInGroup,
            fillRate,
            status,
          };
        });

        breakdown.sort((a, b) => a.ugLevel.localeCompare(b.ugLevel) || a.dept.localeCompare(b.dept));
        setUgBreakdown(breakdown);
      } catch (err) {
        console.error('Error loading Dean2 dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const academicTermLabel = computeTermLabel(policies.academicYear, policies.term);
  const termStatusText = policies.termLocked ? 'Locked' : 'Active';
  const termStatusColor = policies.termLocked ? '#D97706' : '#059669';

  let policyStatusText = '—';
  let policyStatusColor = 'inherit';
  if (policies.isLocked) {
    policyStatusText = 'Locked';
    policyStatusColor = '#2563EB';
  } else if (policies.status) {
    policyStatusText = policies.status;
    policyStatusColor = policies.status === 'Validated' ? '#059669' : '#D97706';
  }

  const enrollmentWindowStatus = policies.windowStatus || '—';
  const windowStatusColorMap = {
    Open: '#059669',
    Paused: '#D97706',
    Closed: '#EF4444',
  };
  const enrollmentStatusColor = windowStatusColorMap[enrollmentWindowStatus] || 'inherit';

  const windowDatesText =
    policies.startDate && policies.endDate
      ? `${formatDateOnly(policies.startDate)} – ${formatDateOnly(policies.endDate)}`
      : '—';

  return (
    <Dean2Layout>
      <div className={styles.pageHeader}>
        <h1>Home Dashboard</h1>
        <p>Overview of university enrollment activity and system status.</p>
      </div>

      {/* Status Row */}
      <div className={styles.grid6}>
        <div className={`${styles.card} ${styles.statusCard}`}>
          <div className={styles.statusIcon}>📅</div>
          <div className={styles.statusInfo}>
            <span className={styles.statusLabel}>Academic Term</span>
            <strong className={styles.statusValue}>{loading ? '...' : academicTermLabel}</strong>
          </div>
        </div>

        <div className={`${styles.card} ${styles.statusCard}`}>
          <div className={styles.statusIcon}>✓</div>
          <div className={styles.statusInfo}>
            <span className={styles.statusLabel}>Term Status</span>
            <strong className={styles.statusValue} style={{ color: termStatusColor }}>
              {loading ? '...' : termStatusText}
            </strong>
          </div>
        </div>

        <div className={`${styles.card} ${styles.statusCard}`}>
          <div className={styles.statusIcon}>🛡️</div>
          <div className={styles.statusInfo}>
            <span className={styles.statusLabel}>Policies</span>
            <strong className={styles.statusValue} style={{ color: policyStatusColor }}>
              {loading ? '...' : policyStatusText}
            </strong>
          </div>
        </div>

        <div className={`${styles.card} ${styles.statusCard}`}>
          <div className={styles.statusIcon}>🚪</div>
          <div className={styles.statusInfo}>
            <span className={styles.statusLabel}>Enrollment</span>
            <strong className={styles.statusValue} style={{ color: enrollmentStatusColor }}>
              {loading ? '...' : enrollmentWindowStatus}
            </strong>
          </div>
        </div>

        <div className={`${styles.card} ${styles.statusCard}`}>
          <div className={styles.statusIcon}>⏱️</div>
          <div className={styles.statusInfo}>
            <span className={styles.statusLabel}>Window</span>
            <strong className={styles.statusValue}>{loading ? '...' : windowDatesText}</strong>
          </div>
        </div>

        <div className={`${styles.card} ${styles.statusCard}`}>
          <div className={styles.statusIcon}>👥</div>
          <div className={styles.statusInfo}>
            <span className={styles.statusLabel}>Current Phase</span>
            <strong className={styles.statusValue}>
              {loading ? '...' : activePhase || 'No Active Phase'}
            </strong>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className={styles.grid3}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>
            Total Students Enrolled <span className={styles.cardIcon}>👥</span>
          </div>
          <div className={styles.cardValue}>{loading ? '...' : metrics.totalEnrolled.toLocaleString()}</div>
          <p className={`${styles.trend} ${styles.positive}`}>
            {metrics.targetStudents > 0
              ? `${Math.round((metrics.totalEnrolled / metrics.targetStudents) * 100)}% of total students`
              : 'Active term'}
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>
            Students Yet to Enroll <span className={styles.cardIcon}>📋</span>
          </div>
          <div className={styles.cardValue}>{loading ? '...' : metrics.yetToEnroll.toLocaleString()}</div>
          {metrics.yetToEnroll > 0 ? (
            <Link to="/ad2/enrollment" className={styles.actionLink}>
              Action Required
            </Link>
          ) : (
            <span style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 600 }}>All Enrolled</span>
          )}
        </div>

        <div className={styles.card}>
          <div className={`${styles.cardTitle} ${styles.flexBetween}`}>
            Enrollment Progress <span>{loading ? '...' : `${metrics.enrollmentProgress}%`}</span>
          </div>
          <div className={styles.progressBarBg}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${loading ? 0 : Math.min(100, metrics.enrollmentProgress)}%` }}
            ></div>
          </div>
          <p className={styles.subtext}>
            Target: {loading ? '...' : `${metrics.targetStudents.toLocaleString()} students`}
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>
            Total Courses Available <span className={styles.cardIcon}>📘</span>
          </div>
          <div className={styles.cardValue}>{loading ? '...' : metrics.totalCourses}</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>
            Pending Override Requests <span className={styles.cardIcon}>⚡</span>
          </div>
          <div className={styles.cardValue}>{loading ? '...' : pendingOverridesCount}</div>
          <Link to="/ad2/overrides" className={styles.btnLink}>
            <button
              className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
              style={{ marginTop: '0.5rem' }}
            >
              Review Requests
            </button>
          </Link>
        </div>

        <div
          className={`${styles.card} ${styles.primaryAction}`}
          onClick={() => navigate('/ad2/gradesheets')}
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter') navigate('/ad2/gradesheets');
          }}
        >
          <div className={styles.actionLabel}>QUICK ACTION</div>
          <div className={styles.actionTitle}>📄 Manage Grade Sheets</div>
        </div>
      </div>

      {/* UG Enrollment Table */}
      <div className={`${styles.card} ${styles.ugTableCard}`}>
        <div className={styles.sectionHeading}>📊 Undergraduate Enrollment Overview</div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>UG Level</th>
              <th>Department</th>
              <th>Courses</th>
              <th>Total Seats</th>
              <th>Enrolled</th>
              <th>Fill Rate</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--d2-text-muted)' }}>
                  Loading enrollment breakdown...
                </td>
              </tr>
            ) : ugBreakdown.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--d2-text-muted)' }}>
                  No course enrollment data available.
                </td>
              </tr>
            ) : (
              ugBreakdown.map((row) => {
                const badgeClass =
                  row.status === 'Stable'
                    ? styles.badgeCompleted
                    : row.status === 'Active'
                    ? styles.badgeActive
                    : styles.badgeInfo;
                const fillRateColor = row.fillRate >= 75 ? '#059669' : '#2563EB';

                return (
                  <tr key={`${row.ugLevel}-${row.dept}`}>
                    <td>{row.ugLevel}</td>
                    <td><strong>{row.dept}</strong></td>
                    <td>{row.coursesCount}</td>
                    <td>{row.totalSeats}</td>
                    <td>{row.enrolled}</td>
                    <td style={{ color: fillRateColor, fontWeight: 700 }}>{row.fillRate}%</td>
                    <td>
                      <span className={`${styles.badge} ${badgeClass}`}>{row.status}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Dean2Layout>
  );
}
