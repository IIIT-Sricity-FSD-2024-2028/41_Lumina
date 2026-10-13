import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Dean2Layout from './Dean2Layout';
import { policiesService } from '../../services/policies.service';
import { overridesService } from '../../services/overrides.service';
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

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [polData, phasesData, overridesData] = await Promise.allSettled([
          policiesService.getPolicies(),
          policiesService.getPhases(),
          overridesService.getAll(),
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
          <div className={styles.cardValue}>1,850</div>
          <p className={`${styles.trend} ${styles.positive}`}>↗ 12% vs last term</p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>
            Students Yet to Enroll <span className={styles.cardIcon}>📋</span>
          </div>
          <div className={styles.cardValue}>550</div>
          <Link to="/ad2/enrollment" className={styles.actionLink}>
            Action Required
          </Link>
        </div>

        <div className={styles.card}>
          <div className={`${styles.cardTitle} ${styles.flexBetween}`}>
            Enrollment Progress <span>77%</span>
          </div>
          <div className={styles.progressBarBg}>
            <div className={styles.progressBarFill} style={{ width: '77%' }}></div>
          </div>
          <p className={styles.subtext}>Target: 2,400 students</p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>
            Total Courses Available <span className={styles.cardIcon}>📘</span>
          </div>
          <div className={styles.cardValue}>120</div>
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
            <tr>
              <td>UG1</td>
              <td>CSE</td>
              <td>5</td>
              <td>120</td>
              <td>70</td>
              <td style={{ color: '#2563EB', fontWeight: 700 }}>58%</td>
              <td>
                <span className={`${styles.badge} ${styles.badgeActive}`}>Active</span>
              </td>
            </tr>
            <tr>
              <td>UG1</td>
              <td>ECE</td>
              <td>5</td>
              <td>100</td>
              <td>60</td>
              <td style={{ color: '#2563EB', fontWeight: 700 }}>60%</td>
              <td>
                <span className={`${styles.badge} ${styles.badgeActive}`}>Active</span>
              </td>
            </tr>
            <tr>
              <td>UG2</td>
              <td>CSE</td>
              <td>6</td>
              <td>120</td>
              <td>95</td>
              <td style={{ color: '#059669', fontWeight: 700 }}>79%</td>
              <td>
                <span className={`${styles.badge} ${styles.badgeCompleted}`}>Stable</span>
              </td>
            </tr>
            <tr>
              <td>UG3</td>
              <td>AI &amp; DS</td>
              <td>4</td>
              <td>80</td>
              <td>50</td>
              <td style={{ color: '#2563EB', fontWeight: 700 }}>62%</td>
              <td>
                <span className={`${styles.badge} ${styles.badgeActive}`}>Active</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Dean2Layout>
  );
}
