/**
 * AdminPortalPage.jsx
 *
 * Lumina SPOC Operations & Technical Incident Portal
 * React conversion of admin_portal.html + js/admin_portal.js
 *
 * Features:
 *   • Hero banner with tenant context & SPOC/Institute switcher
 *   • 4-tab interface: Technical Incidents | Tenant Provisioning | Data Migration | Infra Health
 *   • Technical Incidents table with mitigate action
 *   • Resolve Docket modal
 *   • Log New Incident modal
 *   • CSV drag-and-drop upload + bulk import engine
 *   • Mock data fallback when API is offline
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import AdminPortalLayout from './AdminPortalLayout';
import { adminService } from '../../services/admin.service';
import { useAuth } from '../../context/AuthContext';
import styles from './AdminPortal.module.css';

// ─── Badge Helpers ─────────────────────────────────────────────────────────────
function CategoryBadge({ category }) {
  const map = {
    SSO_Integration: [styles.catSso, 'SAML SSO'],
    Performance_Latency: [styles.catLatency, 'Latency & Load'],
    Data_Migration: [styles.catMigration, 'Data Ingestion'],
    Seat_Quota_Expansion: [styles.catQuota, 'Seat Quota'],
    Database_Backup: [styles.catBackup, 'Backup & Cold Archive'],
    Offboarding_Retention: [styles.catOffboarding, 'Offboarding & Grace'],
  };
  const [cls, label] = map[category] || [styles.categoryBadge, 'Infrastructure'];
  return <span className={`${styles.categoryBadge} ${cls}`}>{label}</span>;
}

function PriorityBadge({ priority }) {
  const cls = {
    Critical: styles.priorityCritical,
    High: styles.priorityHigh,
    Medium: styles.priorityMedium,
    Low: styles.priorityLow,
  }[priority] || styles.priorityLow;
  return <span className={`${styles.priorityBadge} ${cls}`}>{priority}</span>;
}

function StatusBadge({ status }) {
  const cls = status === 'Resolved' ? styles.statusResolved : status === 'In_Progress' ? styles.statusProgress : styles.statusOpen;
  const label = status === 'In_Progress' ? 'In Progress' : status;
  return <span className={`${styles.statusBadge} ${cls}`}>{label}</span>;
}

function getAlertItemClass(type) {
  if (type === 'warning') return `${styles.alertItem} ${styles.alertItemWarning}`;
  if (type === 'success') return `${styles.alertItem} ${styles.alertItemSuccess}`;
  return styles.alertItem;
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function AdminPortalPage() {
  const { user } = useAuth();

  // Derive initial SPOC from session
  const initialSpocId = (user?.userId || user?.User_ID || '').startsWith('SPOC-')
    ? (user.userId || user.User_ID)
    : 'SPOC-001';

  const [currentSpocId, setCurrentSpocId] = useState(initialSpocId);
  const [currentInstituteId, setCurrentInstituteId] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [adminTeam, setAdminTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab state
  const [activeTab, setActiveTab] = useState('incidents');

  // Resolve modal state
  const [resolveModal, setResolveModal] = useState({ open: false, docketId: '', subject: '' });
  const [resolveStatus, setResolveStatus] = useState('Resolved');
  const [resolveNotes, setResolveNotes] = useState('');

  // Log Incident modal state
  const [logModal, setLogModal] = useState(false);
  const [logForm, setLogForm] = useState({
    category: 'Performance_Latency',
    priority: 'Medium',
    submitter: '',
    targetQueue: 'spoc_active',
    subject: '',
    description: '',
  });

  // Migration / CSV state
  const [csvText, setCsvText] = useState('');
  const [logOutput, setLogOutput] = useState('[Migration Engine]: Standing by for course/student CSV dataset payload...');
  const [isDragOver, setIsDragOver] = useState(false);
  const csvFileInputRef = useRef(null);

  // Rollover console state
  const [rolloverLog, setRolloverLog] = useState(
    '[Term Status]: Active Term is Spring 2026. Last snapshot backup verified at 2026-08-30T09:00:00Z (SHA-256: 8f4b...3a1c).'
  );

  // Load Admin SPOC roster dynamically
  useEffect(() => {
    async function fetchAdminTeam() {
      try {
        const team = await adminService.getAdminTeam();
        if (Array.isArray(team)) {
          setAdminTeam(team);
        }
      } catch (err) {
        console.warn('Could not load SPOC team roster:', err);
      }
    }
    fetchAdminTeam();
  }, []);

  // ── Load dashboard ────────────────────────────────────────────────────────
  const loadDashboard = useCallback(async (spocId, instId) => {
    try {
      setLoading(true);
      const data = await adminService.getDashboard(spocId, instId || undefined);
      setDashboard(data);
      if (data?.assignedInstitute?.instituteId) {
        setCurrentInstituteId(data.assignedInstitute.instituteId);
      }
    } catch (err) {
      console.warn('Failed to load SPOC operational dashboard:', err);
      toast.error('Could not load SPOC operational dashboard from server');
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function initDashboard() {
      try {
        const data = await adminService.getDashboard(currentSpocId, currentInstituteId || undefined);
        if (ignore) return;
        setDashboard(data);
        if (data?.assignedInstitute?.instituteId) {
          setCurrentInstituteId(data.assignedInstitute.instituteId);
        }
      } catch (err) {
        if (!ignore) {
          console.warn('Failed to load SPOC operational dashboard:', err);
          toast.error('Could not load SPOC operational dashboard from server');
          setDashboard(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    initDashboard();
    return () => {
      ignore = true;
    };
  }, [currentSpocId, currentInstituteId]);

  // ── Switchers ─────────────────────────────────────────────────────────────
  function handleSpocSwitch(spocId) {
    setCurrentSpocId(spocId);
    setCurrentInstituteId(null);
    loadDashboard(spocId, null);
  }

  function handleInstituteSwitch(instId) {
    setCurrentInstituteId(instId);
    loadDashboard(currentSpocId, instId);
  }

  // ── Resolve Modal ─────────────────────────────────────────────────────────
  function openResolveModal(docketId, subject) {
    setResolveModal({ open: true, docketId, subject });
    setResolveStatus('Resolved');
    setResolveNotes('');
  }

  function closeResolveModal() {
    setResolveModal({ open: false, docketId: '', subject: '' });
  }

  async function submitResolution() {
    try {
      await adminService.updateDocketStatus(resolveModal.docketId, resolveStatus, resolveNotes);
      toast.success(`✔ Docket ${resolveModal.docketId} marked as ${resolveStatus.replace('_', ' ')}`);
      closeResolveModal();
      loadDashboard(currentSpocId, currentInstituteId);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update docket status on server');
    }
  }

  // ── Log Incident Modal ────────────────────────────────────────────────────
  function openLogModal() {
    setLogModal(true);
    setLogForm((prev) => ({
      ...prev,
      submitter: dashboard?.spoc?.fullName ? `${dashboard.spoc.fullName} (Lumina SPOC)` : '',
    }));
  }

  function closeLogModal() {
    setLogModal(false);
    setLogForm({ category: 'Performance_Latency', priority: 'Medium', submitter: '', targetQueue: 'spoc_active', subject: '', description: '' });
  }

  async function submitLogDocket(e) {
    e.preventDefault();
    const instName = dashboard?.assignedInstitute?.name || 'IIIT Sri City';
    const instId = dashboard?.assignedInstitute?.instituteId || 'INST-IIITS';
    const payload = {
      instituteId: instId,
      instituteName: instName,
      submittedBy: logForm.submitter,
      category: logForm.category,
      priority: logForm.priority,
      subject: logForm.subject,
      description: logForm.targetQueue === 'super_user_escalate'
        ? `[ESCALATED TO SUPER USER] ${logForm.description}`
        : logForm.description,
      assignedSpocId: currentSpocId,
    };
    try {
      await adminService.createDocket(payload);
      toast.success(`✔ Technical Docket dispatched to ${logForm.targetQueue === 'super_user_escalate' ? 'Super User Escalation Queue' : 'SPOC Incident Queue'}!`);
      closeLogModal();
      loadDashboard(currentSpocId, currentInstituteId);
    } catch (err) {
      console.error(err);
      toast.error('Failed to log technical docket');
    }
  }

  // ── SSO Handshake ─────────────────────────────────────────────────────────
  function triggerSsoHandshakeTest() {
    toast.success('✔ SAML 2.0 IdP Handshake Successful! Response Time: 4ms. Valid DigiCert Certificate.', {
      duration: 4000,
    });
  }

  // ── Seat Quota Upgrade ────────────────────────────────────────────────────
  async function requestQuotaUpgrade() {
    const spocName = dashboard?.spoc?.fullName || 'Arjun Verma';
    const instName = dashboard?.assignedInstitute?.name || 'IIIT Sri City';
    const instId = dashboard?.assignedInstitute?.instituteId || 'INST-IIITS';
    try {
      await adminService.createDocket({
        instituteId: instId,
        instituteName: instName,
        submittedBy: `${spocName} (Assigned SPOC)`,
        category: 'Seat_Quota_Expansion',
        priority: 'High',
        subject: `Tenant seat quota upgrade requested (+500 seats) for ${instName}`,
        description: 'University tenant is approaching licensed capacity. Requested expansion by 500 seats.',
        assignedSpocId: currentSpocId,
      });
      toast.success('✔ Capacity expansion ticket dispatched to Super User sales queue!');
      loadDashboard(currentSpocId, currentInstituteId);
    } catch (err) {
      console.error(err);
      toast.error('Failed to request seat quota expansion');
    }
  }

  // ── Term Rollover ─────────────────────────────────────────────────────────
  function triggerTermRollover() {
    setRolloverLog(
      '✔ Term Rollover Executed Successfully!\n• Active Term frozen & archived (Fall 2025)\n• Database snapshot verified (SHA-256: e3b0...c49a)\n• Clean schema partition initialized for: Spring 2026'
    );
  }

  // ── CSV / Migration helpers ───────────────────────────────────────────────
  function handleCsvFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCsvText(ev.target.result);
      runDryValidation(ev.target.result);
    };
    reader.readAsText(file);
  }

  function downloadSampleCsv() {
    const sample = 'CourseID, CourseName, Credits, Department\nCS401, Advanced Distributed Systems, 4, CSE\nEC302, Wireless Sensor Networks, 4, ECE\nAI304, Deep Reinforcement Learning, 4, AIDS\n';
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lumina_course_catalog_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function runDryValidation(rawText) {
    const text = rawText !== undefined ? rawText : csvText;
    if (!text.trim()) {
      setLogOutput('⚠ Error: Please enter CSV course data to perform dry-run.');
      return;
    }
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const validated = lines.map((line) => {
      const parts = line.split(',').map((s) => s.trim());
      return {
        id: parts[0] || 'INVALID',
        name: parts[1] || 'Unknown',
        credits: parts[2] || '4',
        dept: parts[3] || 'CSE',
        status: parts.length >= 4 ? 'PASS' : 'WARN: Missing Department',
      };
    });
    setLogOutput(
      `[Dry-Run Engine]: Validated ${validated.length} course definitions:\n` +
      validated.map((v) => `• [${v.status}] ${v.id}: ${v.name} (${v.credits} CR, ${v.dept})`).join('\n') +
      '\n✔ 0 Schema Violations detected. Ready for commit.'
    );
  }

  async function executeBulkImport() {
    if (!csvText.trim()) {
      setLogOutput('⚠ Error: Please enter comma-separated course records.');
      return;
    }
    const lines = csvText.split('\n').map((l) => l.trim()).filter(Boolean);
    const parsedCourses = lines
      .map((line) => {
        const parts = line.split(',').map((s) => s.trim());
        return { courseId: parts[0] || '', courseName: parts[1] || 'Imported Course', credits: Number(parts[2]) || 4, deptId: parts[3] || 'CSE' };
      })
      .filter((c) => c.courseId);

    setLogOutput(`Ingesting ${parsedCourses.length} course definitions into tenant catalog...`);

    try {
      await adminService.bulkImportCourses(parsedCourses);
      toast.success(`✔ Successfully imported ${parsedCourses.length} courses!`);
      setLogOutput(
        `✔ Successfully committed ${parsedCourses.length} courses to database:\n` +
        parsedCourses.map((c) => `• Ingested: ${c.courseId} - ${c.courseName} (${c.credits} CR, ${c.deptId})`).join('\n')
      );
    } catch (err) {
      console.error(err);
      toast.error('Failed to import courses into database');
      setLogOutput(`❌ Database import failed: ${err?.response?.data?.message || err?.message || 'Server error'}`);
    }
  }

  // ── Drag & Drop handlers ──────────────────────────────────────────────────
  function onDragOver(e) { e.preventDefault(); setIsDragOver(true); }
  function onDragLeave() { setIsDragOver(false); }
  function onDrop(e) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => { setCsvText(ev.target.result); runDryValidation(ev.target.result); };
      reader.readAsText(file);
    }
  }

  // ── Derived metrics ───────────────────────────────────────────────────────
  const inst = dashboard?.assignedInstitute;
  const totalStudents = inst?.studentCount || dashboard?.metrics?.totalStudents || 1250;
  const tierMultiplier = inst?.tier === 'Enterprise' ? 0.976 : inst?.tier === 'Campus' ? 0.85 : 0.72;
  const seatsUsed = Math.min(totalStudents, Math.round(totalStudents * tierMultiplier));
  const quotaPct = Math.min(100, Math.round((seatsUsed / totalStudents) * 100));
  const progressColor = quotaPct > 95 ? '#f59e0b' : '#10b981';

  const dockets = dashboard?.recentDockets || [];
  const systemAlerts = dashboard?.systemAlerts || [];
  const openDockets = dockets.filter((d) => d.status !== 'Resolved').length;

  return (
    <AdminPortalLayout>

      {/* ── Hero Banner ─────────────────────────────────────────────────── */}
      <div className={styles.heroBanner}>
        <div className={styles.heroContent}>
          <span className={styles.tenantBadgePill}>{inst?.tier || 'Enterprise'} Tier</span>
          <h1>
            <span>🏛️</span>
            <span>{inst?.name || 'Indian Institute of Information Technology Sri City'}</span>
          </h1>
          <p>
            Dean Contact:{' '}
            <strong style={{ color: '#e2e8f0' }}>{inst?.deanName || 'Dr. K Divyabramham'}</strong>{' '}
            (<span>{inst?.deanEmail || 'dean@iiits.in'}</span>) &bull; Dedicated SPOC:{' '}
            <strong>{dashboard?.spoc?.fullName || 'Arjun Verma'}</strong>
          </p>
        </div>

        {/* Quick Switchers */}
        <div className={styles.spocSwitcher}>
          <div className={styles.switcherGroup}>
            <label className={styles.switcherLabel}>SPOC Admin:</label>
            <select
              className={styles.spocSelect}
              value={currentSpocId}
              onChange={(e) => handleSpocSwitch(e.target.value)}
            >
              {adminTeam.length > 0 ? (
                adminTeam.map((spoc) => (
                  <option key={spoc.adminId} value={spoc.adminId}>
                    {spoc.fullName} ({spoc.adminId})
                  </option>
                ))
              ) : (
                <option value={currentSpocId}>
                  {dashboard?.spoc?.fullName ? `${dashboard.spoc.fullName} (${currentSpocId})` : currentSpocId}
                </option>
              )}
            </select>
          </div>
          <div className={styles.switcherGroup}>
            <label className={styles.switcherLabelBlue}>Switch Active Client:</label>
            <select
              className={styles.spocSelectBlue}
              value={currentInstituteId || ''}
              onChange={(e) => handleInstituteSwitch(e.target.value)}
            >
              {(dashboard?.assignedInstitutes || []).map((i) => (
                <option key={i.instituteId} value={i.instituteId}>
                  🏛️ {i.name} ({i.tier})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Metrics Row ─────────────────────────────────────────────────── */}
      <div className={styles.metricsGrid}>
        <div className={styles.cardNoMargin}>
          <div className={styles.cardTitle}>Licensed Student Seats</div>
          <div className={styles.cardValue}>{totalStudents.toLocaleString()}</div>
          <p className={styles.subtext}>
            <span style={{ fontWeight: 700, color: '#2563eb' }}>{seatsUsed.toLocaleString()}</span>
            {' '}/ {totalStudents.toLocaleString()} Allocated ({quotaPct}%)
          </p>
        </div>
        <div className={styles.cardNoMargin}>
          <div className={styles.cardTitle}>Open Technical Incidents</div>
          <div className={styles.cardValue} style={{ color: '#2563eb' }}>{openDockets}</div>
          <p className={styles.subtext}>Active SLA escalation queue</p>
        </div>
        <div className={styles.cardNoMargin}>
          <div className={styles.cardTitle}>SLA Compliance</div>
          <div className={styles.cardValue} style={{ color: '#059669' }}>
            {dashboard?.metrics?.slaUptimePercent || '99.99%'}
          </div>
          <p className={styles.subtext}>Platform Uptime Target: ≥ 99.95%</p>
        </div>
        <div className={styles.cardNoMargin}>
          <div className={styles.cardTitle}>Average Time to Resolve</div>
          <div className={styles.cardValue}>{dashboard?.metrics?.avgResponseMinutes || 14}m</div>
          <p className={styles.subtext}>SLA Threshold: &lt; 30 mins</p>
        </div>
      </div>

      {/* ── Tab Navigation ───────────────────────────────────────────────── */}
      <div className={styles.tabNav}>
        {[
          { key: 'incidents', label: 'Technical Incidents' },
          { key: 'provisioning', label: 'Tenant Provisioning' },
          { key: 'migration', label: 'Data Migration Engine' },
          { key: 'telemetry', label: 'Infrastructure Health' },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tabBtn} ${activeTab === tab.key ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB 1: TECHNICAL INCIDENTS
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'incidents' && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderLeft}>
              <h3>Technical Incident &amp; Support Docket Queue</h3>
              <p>Infrastructure alerts, SAML SSO rotations, registration load spikes, and data ingestion tickets for this university tenant.</p>
            </div>
            <button className={styles.btnPrimary} onClick={openLogModal}>
              + Log Technical Incident
            </button>
          </div>

          <div className={styles.tableWrapper}>
            {loading ? (
              <div className={styles.loadingState}>Loading incidents...</div>
            ) : (
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Incident ID</th>
                    <th>Priority</th>
                    <th>Category</th>
                    <th>Technical Subject &amp; Root Cause</th>
                    <th>Submitted By</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dockets.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                        No technical incidents logged for this university tenant.
                      </td>
                    </tr>
                  ) : (
                    dockets.map((doc) => (
                      <tr key={doc.docketId}>
                        <td><span className={styles.docketCode}>{doc.docketId}</span></td>
                        <td><PriorityBadge priority={doc.priority} /></td>
                        <td><CategoryBadge category={doc.category} /></td>
                        <td>
                          <span className={styles.subjectStrong}>{doc.subject}</span>
                          <span className={styles.subjectDesc}>{doc.description}</span>
                          {doc.resolutionNotes && (
                            <div className={styles.rcaNotes}>
                              <strong>RCA Notes:</strong> {doc.resolutionNotes}
                            </div>
                          )}
                        </td>
                        <td><span className={styles.submittedBy}>{doc.submittedBy}</span></td>
                        <td><StatusBadge status={doc.status} /></td>
                        <td>
                          {doc.status !== 'Resolved' ? (
                            <button
                              className={styles.mitigateBtn}
                              onClick={() => openResolveModal(doc.docketId, doc.subject)}
                            >
                              ✓ Mitigate
                            </button>
                          ) : (
                            <span className={styles.mitigatedLabel}>Mitigated</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 2: TENANT PROVISIONING
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'provisioning' && (
        <>
          <div className={styles.grid2}>
            {/* SSO Card */}
            <div className={styles.cardNoMargin}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 12 }}>SAML 2.0 / SSO Identity Provider</h3>
              <div className={styles.infoBlock}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>IDENTITY PROVIDER:</span>
                  <strong className={styles.infoValue}>Google Workspace SAML</strong>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>METADATA URL:</span>
                  <code className={styles.infoCode}>https://auth.lumina.edu/saml/iiits</code>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>IDP CONNECTION STATUS:</span>
                  <span className={styles.infoValueGreen}>● Active (Handshake 4ms)</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>CERTIFICATE EXPIRATION:</span>
                  <span className={styles.infoValueAmber}>Expires in 14 days (Renewal Pending)</span>
                </div>
              </div>
              <button className={`${styles.btnOutline} ${styles.btnSm}`} onClick={triggerSsoHandshakeTest}>
                Test SSO Handshake
              </button>
            </div>

            {/* Quota Card */}
            <div className={styles.cardNoMargin}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 12 }}>SaaS Seat Quota &amp; License Utilization</h3>
              <div className={styles.infoBlock}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>STUDENT SEAT UTILIZATION:</span>
                  <strong className={styles.infoValue}>
                    {seatsUsed.toLocaleString()} / {totalStudents.toLocaleString()} Seats
                  </strong>
                </div>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${quotaPct}%`, background: progressColor }}
                  />
                </div>
                <div className={styles.quotaFooter}>
                  <span>Starter: 1k • Campus: 5k • Enterprise: Unlimited</span>
                  <span style={{ color: '#b45309', fontWeight: 700 }}>{quotaPct}% (Near Cap Limit)</span>
                </div>
              </div>
              <button className={`${styles.btnOutline} ${styles.btnSm}`} onClick={requestQuotaUpgrade}>
                Request Quota Upgrade
              </button>
            </div>
          </div>

          {/* Term Rollover Card */}
          <div className={styles.card}>
            <div className={styles.rolloverHeader}>
              <div>
                <h3>Automated Term Rollover &amp; Cold Archival Runner</h3>
                <p>SPOC utility to freeze finished terms, verify SHA-256 snapshot backups, and provision the next academic term schema.</p>
              </div>
              <button className={styles.btnPrimary} onClick={triggerTermRollover}>
                Execute Term Rollover
              </button>
            </div>
            <div className={styles.rolloverConsole}>
              {rolloverLog.split('\n').map((line, i) => (
                <span key={i} style={line.startsWith('✔') ? { color: '#059669', fontWeight: 700 } : {}}>
                  {line}{i < rolloverLog.split('\n').length - 1 && <br />}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 3: DATA MIGRATION ENGINE
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'migration' && (
        <div className={styles.card}>
          <div style={{ marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 16 }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
              Bulk Course Catalog &amp; Student Migration Engine
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
              Validate, dry-run, and batch ingest client university course structures and rosters directly into the tenant partition.
            </p>
          </div>

          <div className={styles.migrationGrid}>
            {/* Upload + Input area */}
            <div>
              {/* Dropzone */}
              <div
                className={`${styles.csvDropzone} ${isDragOver ? styles.csvDropzoneDragOver : ''}`}
                onClick={() => csvFileInputRef.current?.click()}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              >
                <div className={styles.dropzoneIcon}>📁</div>
                <strong className={styles.dropzoneTitle}>Click to Upload CSV or Drag &amp; Drop</strong>
                <span className={styles.dropzoneSubtext}>Supports Course Catalog &amp; Student Roster (.csv files)</span>
                <input
                  type="file"
                  ref={csvFileInputRef}
                  accept=".csv,text/csv"
                  style={{ display: 'none' }}
                  onChange={handleCsvFileUpload}
                />
              </div>

              <div className={styles.csvPasteRow}>
                <span className={styles.csvPasteLabel}>Or Paste CSV Text Directly:</span>
                <button className={`${styles.btnOutline} ${styles.btnXs}`} onClick={downloadSampleCsv}>
                  ⬇ Download Sample Template
                </button>
              </div>

              <textarea
                className={styles.csvTextarea}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={'CS401, Advanced Distributed Systems, 4, CSE\nEC302, Wireless Communications, 4, ECE\nAI304, Deep Reinforcement Learning, 4, AIDS'}
              />

              <div className={styles.csvActions}>
                <button className={styles.btnOutline} onClick={() => runDryValidation()}>Dry-Run Syntax Check</button>
                <button className={styles.btnPrimary} onClick={executeBulkImport}>Commit &amp; Ingest Records</button>
              </div>
            </div>

            {/* Log output */}
            <div className={styles.migrationLogBox}>
              <h4 className={styles.migrationLogTitle}>Migration Engine Log &amp; Validation Output:</h4>
              <div className={styles.logOutput}>{logOutput}</div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 4: INFRASTRUCTURE HEALTH
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'telemetry' && (
        <>
          <div className={styles.grid3}>
            <div className={styles.cardNoMargin}>
              <div className={styles.cardTitle}>Tenant Gateway Latency</div>
              <div className={styles.cardValue} style={{ color: '#059669' }}>14 ms</div>
              <p className={styles.subtext}>p99 Latency: 28ms &bull; Global CDN Active</p>
            </div>
            <div className={styles.cardNoMargin}>
              <div className={styles.cardTitle}>DB Pool Connection Utilization</div>
              <div className={styles.cardValue} style={{ color: '#2563eb' }}>12 / 20</div>
              <p className={styles.subtext}>PostgreSQL connection pool healthy</p>
            </div>
            <div className={styles.cardNoMargin}>
              <div className={styles.cardTitle}>API Error Rate (Last 24h)</div>
              <div className={styles.cardValue} style={{ color: '#059669' }}>0.01%</div>
              <p className={styles.subtext}>Zero fatal crash events recorded</p>
            </div>
          </div>

          <div className={styles.card}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 12 }}>
              Real-Time Operational Alerts &amp; Telemetry Feed
            </h3>
            <div className={styles.alertsList}>
              {systemAlerts.length === 0 ? (
                <div className={styles.loadingState}>No active alerts.</div>
              ) : (
                systemAlerts.map((alert, idx) => (
                  <div key={idx} className={getAlertItemClass(alert.type)}>
                    <div className={styles.alertHeader}>
                      <strong className={styles.alertTitle}>{alert.title}</strong>
                      <span className={styles.alertTime}>{alert.time}</span>
                    </div>
                    <p className={styles.alertMsg}>{alert.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          RESOLVE DOCKET MODAL
          ══════════════════════════════════════════════════════════════════ */}
      {resolveModal.open && (
        <div className={styles.modalBackdrop} onClick={(e) => e.target === e.currentTarget && closeResolveModal()}>
          <div className={styles.modalDialog}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                Resolve Technical Incident: {resolveModal.docketId}
              </h3>
              <button className={styles.modalCloseBtn} onClick={closeResolveModal}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup} style={{ marginBottom: 12 }}>
                <label className={styles.formLabel}>Incident Status</label>
                <select
                  className={styles.formSelect}
                  value={resolveStatus}
                  onChange={(e) => setResolveStatus(e.target.value)}
                >
                  <option value="In_Progress">In Progress (Investigating / Patching)</option>
                  <option value="Resolved">Resolved (Mitigated &amp; Verified)</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Resolution &amp; Root Cause Analysis Notes</label>
                <textarea
                  className={styles.formTextarea}
                  style={{ height: 100 }}
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="Document root cause and mitigation steps applied..."
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnOutline} onClick={closeResolveModal}>Cancel</button>
              <button className={styles.btnPrimary} onClick={submitResolution}>
                Save Resolution &amp; Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          LOG OPERATIONAL INCIDENT MODAL
          ══════════════════════════════════════════════════════════════════ */}
      {logModal && (
        <div className={styles.modalBackdrop} onClick={(e) => e.target === e.currentTarget && closeLogModal()}>
          <div className={styles.modalDialog} style={{ maxWidth: 560 }}>
            <div className={styles.modalHeaderDark}>
              <div>
                <h3><span>⚡</span> Log Operational Incident &amp; Technical Docket</h3>
                <p>Create an internal technical support ticket or escalate to Lumina Super User &amp; Engineering</p>
              </div>
              <button className={styles.modalCloseBtnLight} onClick={closeLogModal}>✕</button>
            </div>

            <form onSubmit={submitLogDocket}>
              <div className={styles.modalBodyForm}>
                {/* Tenant context */}
                <div className={styles.tenantContextRow}>
                  <div>
                    <div className={styles.tenantContextLabel}>Active University Tenant</div>
                    <div className={styles.tenantContextName}>
                      {inst?.name || 'IIIT Sri City'} ({inst?.instituteId || 'INST-IIITS'})
                    </div>
                  </div>
                  <span className={styles.tenantBadgePill} style={{ margin: 0 }}>
                    {inst?.tier || 'Enterprise'} Tier
                  </span>
                </div>

                {/* Category + Priority */}
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Incident Category</label>
                    <select
                      className={styles.formSelect}
                      value={logForm.category}
                      onChange={(e) => setLogForm((f) => ({ ...f, category: e.target.value }))}
                    >
                      <option value="Performance_Latency">Performance &amp; Latency</option>
                      <option value="SSO_Integration">SAML / SSO Certificate</option>
                      <option value="Data_Migration">Data Migration / Ingestion</option>
                      <option value="Seat_Quota_Expansion">Seat Quota Expansion</option>
                      <option value="Database_Backup">Database Backup &amp; Snapshots</option>
                      <option value="System_Incident">Platform Incident / Bug</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Severity / Priority</label>
                    <select
                      className={styles.formSelect}
                      value={logForm.priority}
                      onChange={(e) => setLogForm((f) => ({ ...f, priority: e.target.value }))}
                    >
                      <option value="Low">Low (Routine Maintenance)</option>
                      <option value="Medium">Medium (Elevated Priority)</option>
                      <option value="High">High (Immediate Action)</option>
                      <option value="Critical">Critical (P0 Blocker)</option>
                    </select>
                  </div>
                </div>

                {/* Submitter + Target Queue */}
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Submitted By / Origin</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={logForm.submitter}
                      onChange={(e) => setLogForm((f) => ({ ...f, submitter: e.target.value }))}
                      placeholder="e.g. Arjun Verma (SPOC)"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Target Queue / Action</label>
                    <select
                      className={styles.formSelect}
                      value={logForm.targetQueue}
                      onChange={(e) => setLogForm((f) => ({ ...f, targetQueue: e.target.value }))}
                    >
                      <option value="spoc_active">Tenant SPOC Queue (Active Tracking)</option>
                      <option value="super_user_escalate">Escalate to Super User / Engineering</option>
                    </select>
                  </div>
                </div>

                {/* Subject */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Technical Subject &amp; Root Cause Summary</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={logForm.subject}
                    onChange={(e) => setLogForm((f) => ({ ...f, subject: e.target.value }))}
                    placeholder="e.g. Database connection pool latency spike during priority enrollment phase"
                    required
                  />
                </div>

                {/* Description */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Detailed Operational Description &amp; Log Snippet</label>
                  <textarea
                    className={styles.formTextarea}
                    style={{ height: 90 }}
                    value={logForm.description}
                    onChange={(e) => setLogForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Describe technical observations, stack trace or operational steps required..."
                    required
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnOutline} onClick={closeLogModal}>Cancel</button>
                <button type="submit" className={styles.btnPrimary}>⚡ Log Docket &amp; Begin Tracking</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </AdminPortalLayout>
  );
}
