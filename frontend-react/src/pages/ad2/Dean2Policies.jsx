import { useState, useEffect } from 'react';
import Dean2Layout from './Dean2Layout';
import { policiesService } from '../../services/policies.service';
import toast from 'react-hot-toast';
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

export default function Dean2Policies() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    academicYear: '2025-2026',
    term: 'Spring',
    termLocked: true,
    minCredits: 12,
    maxCredits: 21,
    maxCourses: 6,
    enforcePrereq: true,
    allowConditional: false,
    allowAdvisorOverride: true,
    minGpa: 5.0,
    financialClearance: true,
    advisorApproval: true,
    status: 'Validated',
    isLocked: false,
  });
  const [logs, setLogs] = useState([]);
  const [showAllLogs, setShowAllLogs] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function fetchPolicies() {
      try {
        const data = await policiesService.getPolicies();
        if (!ignore) {
          if (data?.settings) {
            setSettings((prev) => ({ ...prev, ...data.settings }));
          }
          if (Array.isArray(data?.logs)) {
            setLogs(data.logs);
          }
        }
      } catch (err) {
        if (!ignore) {
          console.error('Failed to load policies:', err);
          toast.error('Failed to load academic policies');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchPolicies();
    return () => {
      ignore = true;
    };
  }, []);

  const markPendingLocally = (field, value) => {
    setSettings((prev) => {
      if (prev.isLocked) return prev;
      return {
        ...prev,
        [field]: value,
        status: 'Pending',
      };
    });
  };

  const sendPolicyUpdate = async (payload, successMsg) => {
    try {
      setSaving(true);
      const res = await policiesService.updatePolicies(payload);
      if (res?.settings) {
        setSettings((prev) => ({ ...prev, ...res.settings }));
      }
      if (Array.isArray(res?.logs)) {
        setLogs(res.logs);
      }
      if (successMsg) toast.success(successMsg);
      return true;
    } catch (err) {
      console.error('Policy update error:', err);
      const msg = err.response?.data?.message || 'Failed to update policy';
      toast.error(msg);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Lock / Unlock Term
  const handleLockTerm = async () => {
    if (!settings.academicYear) {
      toast.error('Please select an Academic Year before locking the term.');
      return;
    }
    const label = computeTermLabel(settings.academicYear, settings.term);
    await sendPolicyUpdate(
      {
        academicYear: settings.academicYear,
        term: settings.term,
        termLocked: true,
        logMessage: `Term Locked: ${label}`,
      },
      'Academic Term locked successfully'
    );
  };

  const handleUnlockTerm = async () => {
    await sendPolicyUpdate(
      {
        termLocked: false,
        logMessage: 'Term Unlocked',
      },
      'Academic Term unlocked'
    );
  };

  // Validate Policies
  const handleValidate = async () => {
    if (settings.isLocked) {
      toast.error('Policies are locked. Unlock before validating.');
      return;
    }

    const minCr = parseInt(settings.minCredits, 10);
    const maxCr = parseInt(settings.maxCredits, 10);
    const maxCrs = parseInt(settings.maxCourses, 10);
    const gpa = parseFloat(settings.minGpa);

    if (isNaN(minCr) || minCr < 1 || minCr > 30) {
      toast.error('Please enter a valid Minimum Credit Limit (between 1 and 30).');
      return;
    }
    if (isNaN(maxCr) || maxCr < 1 || maxCr > 30) {
      toast.error('Please enter a valid Maximum Credit Limit (between 1 and 30).');
      return;
    }
    if (minCr > maxCr) {
      toast.error(`Minimum credits (${minCr}) cannot exceed Maximum credits (${maxCr}).`);
      return;
    }
    if (isNaN(maxCrs) || maxCrs < 1 || maxCrs > 15) {
      toast.error('Please enter a valid Maximum Courses Limit (between 1 and 15).');
      return;
    }
    if (isNaN(gpa) || gpa < 0 || gpa > 10) {
      toast.error('Please enter a valid Minimum GPA (between 0.0 and 10.0).');
      return;
    }

    const payload = {
      minCredits: minCr,
      maxCredits: maxCr,
      maxCourses: maxCrs,
      minGpa: gpa,
      enforcePrereq: !!settings.enforcePrereq,
      allowConditional: !!settings.allowConditional,
      allowAdvisorOverride: !!settings.allowAdvisorOverride,
      financialClearance: !!settings.financialClearance,
      advisorApproval: !!settings.advisorApproval,
      academicYear: settings.academicYear,
      term: settings.term,
      status: 'Validated',
      logMessage: 'Policies Validated',
    };

    await sendPolicyUpdate(payload, 'Policies successfully validated and saved!');
  };

  // Lock / Unlock Policies
  const handleLockPolicies = async () => {
    await sendPolicyUpdate(
      { isLocked: true, logMessage: 'Policies Locked' },
      'Policies locked against further modifications.'
    );
  };

  const handleUnlockPolicies = async () => {
    await sendPolicyUpdate(
      { isLocked: false, logMessage: 'Policies Unlocked' },
      'Policies unlocked for editing.'
    );
  };

  // Banner status styling
  let bannerStyle = { background: '#FFFBEB', borderColor: '#FDE68A' };
  let statusIcon = '⚠';
  let statusIconStyle = { background: '#F59E0B', color: 'white' };
  let statusTitle = 'Policy Status – Pending Validation';
  let statusTitleColor = '#92400E';
  let statusDesc = 'Policies have been modified. Please validate before locking.';
  let statusDescColor = '#B45309';

  if (settings.isLocked) {
    bannerStyle = { background: '#EFF6FF', borderColor: '#BFDBFE' };
    statusIcon = '🔒';
    statusIconStyle = { background: '#DBEAFE', color: '#2563EB' };
    statusTitle = 'Policy Status – Locked';
    statusTitleColor = '#1E40AF';
    statusDesc = 'Policies are locked and cannot be modified.';
    statusDescColor = '#3B82F6';
  } else if (settings.status === 'Validated') {
    bannerStyle = { background: '#F0FDF4', borderColor: '#A7F3D0' };
    statusIcon = '✓';
    statusIconStyle = { background: '#059669', color: 'white' };
    statusTitle = 'Policy Status – Validated';
    statusTitleColor = '#065F46';
    statusDesc = 'All current policies meet academic board standards.';
    statusDescColor = '#047857';
  }

  const isFieldsDisabled = settings.isLocked || saving || loading;
  const isTermDisabled = settings.isLocked || settings.termLocked || saving || loading;

  return (
    <Dean2Layout>
      <div className={styles.pageHeader}>
        <h1>Academic &amp; Enrollment Policies</h1>
        <p>Define and manage academic rules and enrollment policies for the current enrollment term.</p>
      </div>

      <div className={styles.policiesLayout}>
        {/* Left: Main Settings */}
        <div className={styles.policiesMain}>
          {/* Academic Term Settings */}
          <div className={styles.card}>
            <div className={styles.policySectionTitle}>📅 Academic Term Settings</div>

            <div
              className={`${styles.infoBanner} ${
                settings.termLocked ? styles.infoBannerShow : ''
              }`}
            >
              🔒 Term is currently locked. Click &quot;Unlock Term&quot; to make changes.
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className={styles.formGroup} style={{ flex: 1, minWidth: '160px', margin: 0 }}>
                <label htmlFor="academicYearInput">Academic Year</label>
                <select
                  id="academicYearInput"
                  value={settings.academicYear || ''}
                  disabled={isTermDisabled}
                  onChange={(e) => markPendingLocally('academicYear', e.target.value)}
                  className={styles.formControlSelect}
                >
                  <option value="">Select Year...</option>
                  <option value="2024-2025">2024-2025</option>
                  <option value="2025-2026">2025-2026</option>
                  <option value="2026-2027">2026-2027</option>
                  <option value="2027-2028">2027-2028</option>
                </select>
              </div>

              <div className={styles.formGroup} style={{ flex: 1, minWidth: '140px', margin: 0 }}>
                <label htmlFor="termSelect">Term</label>
                <select
                  id="termSelect"
                  value={settings.term || 'Spring'}
                  disabled={isTermDisabled}
                  onChange={(e) => markPendingLocally('term', e.target.value)}
                  className={styles.formControlSelect}
                >
                  <option value="Spring">Spring</option>
                  <option value="Monsoon">Monsoon</option>
                </select>
              </div>

              {settings.termLocked ? (
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnOutline}`}
                  style={{ height: '42px' }}
                  disabled={settings.isLocked || saving}
                  onClick={handleUnlockTerm}
                >
                  🔓 Unlock Term
                </button>
              ) : (
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  style={{ height: '42px' }}
                  disabled={settings.isLocked || saving}
                  onClick={handleLockTerm}
                >
                  🔒 Lock Term
                </button>
              )}
            </div>
          </div>

          {/* Credit & Prereq */}
          <div className={styles.twoCol}>
            <div className={styles.card} style={{ margin: 0 }}>
              <div className={styles.policySectionTitle}>💳 Credit Limit Policy</div>
              <div className={styles.formGroup}>
                <label htmlFor="minCredits">Minimum Credits Allowed</label>
                <input
                  type="number"
                  id="minCredits"
                  value={settings.minCredits ?? 12}
                  min="0"
                  max="30"
                  disabled={isFieldsDisabled}
                  onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                  onChange={(e) => markPendingLocally('minCredits', e.target.value)}
                  className={styles.formControl}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="maxCredits">Maximum Credits Allowed</label>
                <input
                  type="number"
                  id="maxCredits"
                  value={settings.maxCredits ?? 21}
                  min="0"
                  max="30"
                  disabled={isFieldsDisabled}
                  onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                  onChange={(e) => markPendingLocally('maxCredits', e.target.value)}
                  className={styles.formControl}
                />
              </div>
              <div className={styles.formGroup} style={{ margin: 0 }}>
                <label htmlFor="maxCourses">Maximum Courses Allowed</label>
                <input
                  type="number"
                  id="maxCourses"
                  value={settings.maxCourses ?? 6}
                  min="0"
                  max="10"
                  disabled={isFieldsDisabled}
                  onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                  onChange={(e) => markPendingLocally('maxCourses', e.target.value)}
                  className={styles.formControl}
                />
              </div>
            </div>

            <div className={styles.card} style={{ margin: 0 }}>
              <div className={styles.policySectionTitle}>🛡️ Prerequisite Policy</div>
              <div className={styles.toggleRow}>
                <span>Enforce Prerequisite Checking</span>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={!!settings.enforcePrereq}
                    disabled={isFieldsDisabled}
                    onChange={(e) => markPendingLocally('enforcePrereq', e.target.checked)}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
              <div className={styles.toggleRow}>
                <span>Allow Conditional Enrollment</span>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={!!settings.allowConditional}
                    disabled={isFieldsDisabled}
                    onChange={(e) => markPendingLocally('allowConditional', e.target.checked)}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
              <div className={styles.toggleRow} style={{ margin: 0 }}>
                <span>Allow Advisor Override</span>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={!!settings.allowAdvisorOverride}
                    disabled={isFieldsDisabled}
                    onChange={(e) => markPendingLocally('allowAdvisorOverride', e.target.checked)}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>
          </div>

          {/* Eligibility Rules */}
          <div className={styles.card}>
            <div className={styles.policySectionTitle}>⚖️ Enrollment Eligibility Rules</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
              <div className={styles.formGroup} style={{ margin: 0 }}>
                <label htmlFor="minGpa">Min GPA Required</label>
                <input
                  type="number"
                  step="0.1"
                  id="minGpa"
                  value={settings.minGpa ?? 5.0}
                  min="0"
                  max="10.0"
                  disabled={isFieldsDisabled}
                  onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                  onChange={(e) => markPendingLocally('minGpa', e.target.value)}
                  className={styles.formControl}
                />
              </div>
              <div>
                <div className={styles.toggleRow} style={{ margin: 0 }}>
                  <span>Financial Clearance Required</span>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={!!settings.financialClearance}
                      disabled={isFieldsDisabled}
                      onChange={(e) => markPendingLocally('financialClearance', e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>
              <div>
                <div className={styles.toggleRow} style={{ margin: 0 }}>
                  <span>Advisor Approval Required</span>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={!!settings.advisorApproval}
                      disabled={isFieldsDisabled}
                      onChange={(e) => markPendingLocally('advisorApproval', e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Change Log Sidebar */}
        <div>
          <div className={styles.card} style={{ height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div className={styles.policySectionTitle} style={{ margin: 0 }}>
                Policy Change Log
              </div>
              <span style={{ fontSize: '1rem' }}>⏱️</span>
            </div>
            <div className={styles.changeLog}>
              {logs.length === 0 ? (
                <div style={{ color: 'var(--d2-text-light)', fontSize: '0.85rem' }}>
                  No policy changes recorded.
                </div>
              ) : (
                (showAllLogs ? logs : logs.slice(0, 6)).map((log, i) => {
                  const timeStr = log.createdAt
                    ? new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Just now';
                  return (
                    <div className={styles.logEntry} key={log.id || i}>
                      <div className={`${styles.logDot} ${i === 0 ? styles.logDotLatest : ''}`} />
                      <div className={styles.logMsg}>{log.message}</div>
                      <div className={styles.logMeta}>
                        By {log.by} &bull; {timeStr}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {logs.length > 6 && (
              <button
                type="button"
                className={`${styles.btn} ${styles.btnOutline}`}
                style={{ width: '100%', marginTop: '0.75rem' }}
                onClick={() => setShowAllLogs(!showAllLogs)}
              >
                {showAllLogs ? 'Show Less' : 'View All Logs'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Policy Status Banner */}
      <div className={`${styles.policyStatusBanner} ${styles.card}`} style={bannerStyle}>
        <div className={styles.statusLeft}>
          <div className={styles.statusIcon} style={statusIconStyle}>
            {statusIcon}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '2px', color: statusTitleColor }}>
              {statusTitle}
            </div>
            <div style={{ fontSize: '0.85rem', color: statusDescColor }}>{statusDesc}</div>
          </div>
        </div>
        <div className={styles.statusBannerActions}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnOutline}`}
            disabled={settings.isLocked || saving}
            onClick={handleValidate}
          >
            {saving ? 'Validating...' : 'Validate Policies'}
          </button>
          {settings.isLocked ? (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnGhost}`}
              disabled={saving}
              onClick={handleUnlockPolicies}
            >
              Unlock Policies
            </button>
          ) : (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnGreen}`}
              disabled={saving}
              onClick={handleLockPolicies}
            >
              Lock Policies
            </button>
          )}
        </div>
      </div>
    </Dean2Layout>
  );
}
