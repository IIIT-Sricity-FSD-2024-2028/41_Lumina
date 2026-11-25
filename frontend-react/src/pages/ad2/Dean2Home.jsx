import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Dean2Layout from './Dean2Layout';
import { fetchDean2HomeDashboard } from '../../store/ad2/ad2-actions';
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
  const dispatch = useDispatch();

  // ── Redux state ──────────────────────────────────────────────────
  const {
    loading,
    policies,
    activePhase,
    pendingOverridesCount,
    metrics,
    ugBreakdown,
  } = useSelector((state) => state.ad2);

  // ── Fetch on mount ───────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchDean2HomeDashboard());
  }, [dispatch]);

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
