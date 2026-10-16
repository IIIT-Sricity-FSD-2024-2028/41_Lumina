/**
 * TechnicalIncidentsTab.jsx
 *
 * Tab 1: Technical Incident & Support Docket Queue
 * - Incidents data table with priority / category / status badges
 * - "✓ Mitigate" action → Resolve Docket modal
 * - "+ Log Technical Incident" → Log new incident modal
 * - Full mock data fallback when API is offline
 */
import { useState } from 'react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/admin.service';
import styles from './AdminPortal.module.css';

// ─── Badge Sub-Components ──────────────────────────────────────────────────────
function CategoryBadge({ category }) {
  const map = {
    SSO_Integration:      [styles.catSso,        'SAML SSO'],
    Performance_Latency:  [styles.catLatency,     'Latency & Load'],
    Data_Migration:       [styles.catMigration,   'Data Ingestion'],
    Seat_Quota_Expansion: [styles.catQuota,       'Seat Quota'],
    Database_Backup:      [styles.catBackup,      'Backup & Cold Archive'],
    Offboarding_Retention:[styles.catOffboarding, 'Offboarding & Grace'],
    System_Incident:      [styles.catLatency,     'Platform Incident'],
  };
  const [cls, label] = map[category] || [styles.categoryBadge, 'Infrastructure'];
  return <span className={`${styles.categoryBadge} ${cls}`}>{label}</span>;
}

function PriorityBadge({ priority }) {
  const cls = {
    Critical: styles.priorityCritical,
    High:     styles.priorityHigh,
    Medium:   styles.priorityMedium,
    Low:      styles.priorityLow,
  }[priority] || styles.priorityLow;
  return <span className={`${styles.priorityBadge} ${cls}`}>{priority}</span>;
}

function StatusBadge({ status }) {
  const cls = status === 'Resolved'    ? styles.statusResolved
            : status === 'In_Progress' ? styles.statusProgress
            : styles.statusOpen;
  const label = status === 'In_Progress' ? 'In Progress' : status;
  return <span className={`${styles.statusBadge} ${cls}`}>{label}</span>;
}

// ─── Tab Component ──────────────────────────────────────────────────────────────
export default function TechnicalIncidentsTab({
  dashboard, setDashboard, loading, currentSpocId, inst, onRefresh,
}) {
  const dockets = dashboard?.recentDockets || [];

  // ── Resolve modal state ──
  const [resolveModal, setResolveModal] = useState({ open: false, docketId: '', subject: '' });
  const [resolveStatus, setResolveStatus] = useState('Resolved');
  const [resolveNotes, setResolveNotes]   = useState('');
  const [isSubmitting, setIsSubmitting]   = useState(false);

  function openResolveModal(docketId, subject) {
    setResolveModal({ open: true, docketId, subject });
    setResolveStatus('Resolved');
    setResolveNotes('');
  }
  function closeResolveModal() {
    setResolveModal({ open: false, docketId: '', subject: '' });
  }
  async function submitResolution() {
    setIsSubmitting(true);
    try {
      await adminService.updateDocketStatus(resolveModal.docketId, resolveStatus, resolveNotes);
      setDashboard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          recentDockets: prev.recentDockets.map((d) =>
            d.docketId === resolveModal.docketId
              ? { ...d, status: resolveStatus, resolutionNotes: resolveNotes, resolvedAt: new Date().toISOString() }
              : d
          ),
        };
      });
      toast.success(`✔ Docket ${resolveModal.docketId} marked as ${resolveStatus.replace('_', ' ')} in database`);
      closeResolveModal();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update docket status on server');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Log Incident modal state ──
  const [logModal, setLogModal] = useState(false);
  const [logForm, setLogForm]   = useState({
    category: 'Performance_Latency', priority: 'Medium',
    submitter: '', targetQueue: 'spoc_active',
    subject: '', description: '',
  });

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
    setIsSubmitting(true);
    const instName = inst?.name || 'IIIT Sri City';
    const instId   = inst?.instituteId || 'INST-IIITS';
    const payload  = {
      instituteId: instId, instituteName: instName,
      submittedBy: logForm.submitter, category: logForm.category,
      priority: logForm.priority, subject: logForm.subject,
      description: logForm.targetQueue === 'super_user_escalate'
        ? `[ESCALATED TO SUPER USER] ${logForm.description}`
        : logForm.description,
      assignedSpocId: currentSpocId,
    };
    try {
      const created = await adminService.createDocket(payload);
      const newDocket = created && created.docketId
        ? created
        : { ...payload, docketId: `DOC-${Date.now().toString().slice(-4)}`, status: 'Open', createdAt: new Date().toISOString() };
      setDashboard((prev) => prev ? { ...prev, recentDockets: [newDocket, ...(prev.recentDockets || [])] } : prev);
      toast.success(`✔ Technical Docket logged and dispatched to ${logForm.targetQueue === 'super_user_escalate' ? 'Super User Escalation Queue' : 'SPOC Incident Queue'}!`);
      closeLogModal();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      toast.error('Failed to log technical docket to backend database');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {/* ── Incidents Table ── */}
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

      {/* ── Resolve Docket Modal ── */}
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
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 16px 0', fontStyle: 'italic' }}>
                {resolveModal.subject}
              </p>
              <div className={styles.formGroup} style={{ marginBottom: 12 }}>
                <label className={styles.formLabel}>Incident Status</label>
                <select className={styles.formSelect} value={resolveStatus} onChange={(e) => setResolveStatus(e.target.value)}>
                  <option value="In_Progress">In Progress (Investigating / Patching)</option>
                  <option value="Resolved">Resolved (Mitigated &amp; Verified)</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Resolution &amp; Root Cause Analysis Notes</label>
                <textarea
                  className={styles.formTextarea} style={{ height: 100 }}
                  value={resolveNotes} onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="Document root cause and mitigation steps applied..."
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnOutline} onClick={closeResolveModal}>Cancel</button>
              <button type="button" className={styles.btnPrimary} onClick={submitResolution} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Resolution & Log'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Log Operational Incident Modal ── */}
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
                    <select className={styles.formSelect} value={logForm.category} onChange={(e) => setLogForm((f) => ({ ...f, category: e.target.value }))}>
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
                    <select className={styles.formSelect} value={logForm.priority} onChange={(e) => setLogForm((f) => ({ ...f, priority: e.target.value }))}>
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
                    <input type="text" className={styles.formInput} value={logForm.submitter}
                      onChange={(e) => setLogForm((f) => ({ ...f, submitter: e.target.value }))}
                      placeholder="e.g. Arjun Verma (SPOC)" required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Target Queue / Action</label>
                    <select className={styles.formSelect} value={logForm.targetQueue} onChange={(e) => setLogForm((f) => ({ ...f, targetQueue: e.target.value }))}>
                      <option value="spoc_active">Tenant SPOC Queue (Active Tracking)</option>
                      <option value="super_user_escalate">Escalate to Super User / Engineering</option>
                    </select>
                  </div>
                </div>

                {/* Subject */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Technical Subject &amp; Root Cause Summary</label>
                  <input type="text" className={styles.formInput} value={logForm.subject}
                    onChange={(e) => setLogForm((f) => ({ ...f, subject: e.target.value }))}
                    placeholder="e.g. Database connection pool latency spike during priority enrollment phase" required
                  />
                </div>

                {/* Description */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Detailed Operational Description &amp; Log Snippet</label>
                  <textarea className={styles.formTextarea} style={{ height: 90 }} value={logForm.description}
                    onChange={(e) => setLogForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Describe technical observations, stack trace or operational steps required..." required
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
    </>
  );
}
