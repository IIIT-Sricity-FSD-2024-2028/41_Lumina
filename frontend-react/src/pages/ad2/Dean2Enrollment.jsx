import { useState, useEffect } from 'react';
import Dean2Layout from './Dean2Layout';
import { policiesService } from '../../services/policies.service';
import toast from 'react-hot-toast';
import styles from './Dean2.module.css';

function formatDateShort(dtStr) {
  if (!dtStr) return '';
  const d = new Date(dtStr);
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Dean2Enrollment() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    systemStatus: 'Active',
    windowStatus: 'Open',
    startDate: '',
    endDate: '',
  });
  const [phases, setPhases] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [modalData, setModalData] = useState({
    name: '',
    eligibleGroups: 'Final Year',
    timeline: '',
    status: 'Upcoming',
  });
  const [savingPhase, setSavingPhase] = useState(false);

  const loadEnrollmentData = async () => {
    try {
      const [polRes, phasesRes] = await Promise.allSettled([
        policiesService.getPolicies(),
        policiesService.getPhases(),
      ]);

      if (polRes.status === 'fulfilled' && polRes.value?.settings) {
        setSettings((prev) => ({ ...prev, ...polRes.value.settings }));
      }
      if (phasesRes.status === 'fulfilled' && Array.isArray(phasesRes.value)) {
        setPhases(phasesRes.value);
      }
    } catch (err) {
      console.error('Failed to load enrollment configuration:', err);
      toast.error('Failed to load enrollment configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const [polRes, phasesRes] = await Promise.allSettled([
          policiesService.getPolicies(),
          policiesService.getPhases(),
        ]);

        if (!ignore) {
          if (polRes.status === 'fulfilled' && polRes.value?.settings) {
            setSettings((prev) => ({ ...prev, ...polRes.value.settings }));
          }
          if (phasesRes.status === 'fulfilled' && Array.isArray(phasesRes.value)) {
            setPhases(phasesRes.value);
          }
        }
      } catch (err) {
        if (!ignore) {
          console.error('Failed to load enrollment configuration:', err);
          toast.error('Failed to load enrollment configuration');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    init();
    return () => {
      ignore = true;
    };
  }, []);

  const handleUpdateSetting = async (key, value, label) => {
    try {
      const logMsg = label || `Updated ${key} to ${value}`;
      await policiesService.updatePolicies({ [key]: value, logMessage: logMsg });
      setSettings((prev) => ({ ...prev, [key]: value }));
      toast.success(`${key === 'systemStatus' ? 'System status' : 'Window status'} updated to ${value}`);
    } catch (err) {
      console.error('Failed to update setting:', err);
      toast.error(err.response?.data?.message || `Failed to update ${key}`);
    }
  };

  const handleDatesChange = async (newStart, newEnd) => {
    try {
      await policiesService.updatePolicies({
        startDate: newStart,
        endDate: newEnd,
        logMessage: `Updated enrollment window dates`,
      });
      setSettings((prev) => ({ ...prev, startDate: newStart, endDate: newEnd }));
      toast.success('Enrollment window dates saved');
    } catch (err) {
      console.error('Failed to update dates:', err);
      toast.error('Failed to update window dates');
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setModalData({
      name: '',
      eligibleGroups: 'Final Year',
      timeline: '',
      status: 'Upcoming',
    });
    setModalOpen(true);
  };

  const openEditModal = (phase) => {
    setEditingId(phase.id);
    setModalData({
      name: phase.name || '',
      eligibleGroups: phase.eligibleGroups || phase.eligible || 'Final Year',
      timeline: phase.timeline || '',
      status: phase.status || 'Upcoming',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const handleSavePhase = async (e) => {
    e.preventDefault();
    if (!modalData.name.trim()) {
      toast.error('Please enter a phase name');
      return;
    }
    if (!modalData.timeline.trim()) {
      toast.error('Please enter a timeline');
      return;
    }

    try {
      setSavingPhase(true);
      if (editingId) {
        await policiesService.updatePhase(editingId, {
          name: modalData.name.trim(),
          eligibleGroups: modalData.eligibleGroups,
          timeline: modalData.timeline.trim(),
          status: modalData.status,
        });
        toast.success('Phase updated successfully');
      } else {
        await policiesService.createPhase({
          name: modalData.name.trim(),
          eligibleGroups: modalData.eligibleGroups,
          timeline: modalData.timeline.trim(),
          status: modalData.status,
        });
        toast.success('Phase added successfully');
      }
      closeModal();
      await loadEnrollmentData();
    } catch (err) {
      console.error('Failed to save phase:', err);
      toast.error(err.response?.data?.message || 'Failed to save phase');
    } finally {
      setSavingPhase(false);
    }
  };

  const [confirmDeletePhase, setConfirmDeletePhase] = useState(null);
  const [isDeletingPhase, setIsDeletingPhase] = useState(false);

  const handleDeletePhase = async () => {
    if (!confirmDeletePhase) return;
    const { id, name } = confirmDeletePhase;
    try {
      setIsDeletingPhase(true);
      await policiesService.deletePhase(id);
      toast.success(`Phase "${name}" deleted`);
      setPhases((prev) => prev.filter((p) => p.id !== id));
      setConfirmDeletePhase(null);
    } catch (err) {
      console.error('Failed to delete phase:', err);
      toast.error(err.response?.data?.message || 'Failed to delete phase');
    } finally {
      setIsDeletingPhase(false);
    }
  };

  const activePhase = phases.find((p) => p.status === 'Active');
  const globalDatesStr =
    settings.startDate && settings.endDate
      ? `📅 ${formatDateShort(settings.startDate)} – ${formatDateShort(settings.endDate)}`
      : '📅 No dates set';

  const windowBadgeClass =
    settings.windowStatus === 'Open'
      ? `${styles.badge} ${styles.badgeActive}`
      : settings.windowStatus === 'Paused'
      ? `${styles.badge} ${styles.badgePaused}`
      : `${styles.badge} ${styles.badgeClosed}`;

  return (
    <Dean2Layout>
      <div className={styles.pageHeader}>
        <h1>Enrollment Setup</h1>
        <p>Configure enrollment windows, phases, and course availability.</p>
      </div>

      {/* Current Enrollment Status */}
      <div className={`${styles.card} ${styles.enrollmentStatusCard}`}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: 'var(--d2-text-muted)',
                textTransform: 'uppercase',
              }}
            >
              Current Enrollment Status
            </span>
            <span
              className={`${styles.badge} ${
                settings.systemStatus === 'Active' ? styles.badgeActive : styles.badgeCompleted
              }`}
            >
              ● {loading ? '...' : (settings.systemStatus || 'Active').toUpperCase()}
            </span>
          </div>
          <div className={styles.enrollmentPhaseName}>
            {activePhase ? activePhase.name : 'No Active Phase'}
          </div>
          <div className={styles.enrollmentMeta}>
            <span>
              👥 Eligible: {activePhase ? (activePhase.eligibleGroups || activePhase.eligible) + ' Students' : 'N/A'}
            </span>
            <span>{globalDatesStr}</span>
          </div>
        </div>

        <div className={styles.enrollmentActions}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => handleUpdateSetting('systemStatus', 'Active', 'System Activated')}
          >
            ▶ Activate Enrollment
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnLight}`}
            onClick={() => handleUpdateSetting('systemStatus', 'Deactivated', 'System Deactivated')}
          >
            Deactivate System
          </button>
        </div>
      </div>

      {/* Enrollment Window Configuration */}
      <div className={`${styles.card} ${styles.windowCard}`}>
        <div className={styles.windowHeader}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--d2-primary)' }}>
            Enrollment Window Configuration
          </h3>
          <span className={windowBadgeClass}>
            {(settings.windowStatus || 'Open').toUpperCase()}
          </span>
        </div>

        <div className={styles.windowDates}>
          <div className={styles.formGroup} style={{ margin: 0 }}>
            <label htmlFor="startDateInput">Enrollment Start Date &amp; Time</label>
            <input
              type="datetime-local"
              id="startDateInput"
              value={settings.startDate || ''}
              onChange={(e) => handleDatesChange(e.target.value, settings.endDate)}
              className={styles.formControl}
            />
          </div>
          <div className={styles.formGroup} style={{ margin: 0 }}>
            <label htmlFor="endDateInput">Enrollment End Date &amp; Time</label>
            <input
              type="datetime-local"
              id="endDateInput"
              value={settings.endDate || ''}
              onChange={(e) => handleDatesChange(settings.startDate, e.target.value)}
              className={styles.formControl}
            />
          </div>
        </div>

        <div className={styles.windowButtons}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => handleUpdateSetting('windowStatus', 'Open', 'Enrollment Window Opened')}
          >
            🔓 Open Enrollment
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnWarning}`}
            onClick={() => handleUpdateSetting('windowStatus', 'Paused', 'Enrollment Window Paused')}
          >
            ⏸ Pause Enrollment
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnDanger}`}
            onClick={() => handleUpdateSetting('windowStatus', 'Closed', 'Enrollment Window Closed')}
          >
            ✕ Close Enrollment
          </button>
        </div>
      </div>

      {/* Enrollment Phases */}
      <div className={styles.card}>
        <div className={styles.phasesHeader}>
          <div className={styles.phasesTitle}>Enrollment Phases</div>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
            onClick={openAddModal}
          >
            + Add Phase
          </button>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Phase Name</th>
              <th>Eligible Students</th>
              <th>Timeline</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {phases.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--d2-text-muted)', padding: '2rem' }}>
                  {loading ? 'Loading phases...' : 'No phases configured yet.'}
                </td>
              </tr>
            ) : (
              phases.map((phase) => {
                const bc =
                  phase.status === 'Completed'
                    ? styles.badgeCompleted
                    : phase.status === 'Active'
                    ? styles.badgeActive
                    : styles.badgeUpcoming;
                return (
                  <tr key={phase.id}>
                    <td>
                      <strong>{phase.name}</strong>
                    </td>
                    <td>{phase.eligibleGroups || phase.eligible}</td>
                    <td>{phase.timeline}</td>
                    <td>
                      <span className={`${styles.badge} ${bc}`}>{phase.status}</span>
                    </td>
                    <td className={styles.actionIcons}>
                      <span
                        title="Edit Phase"
                        onClick={() => openEditModal(phase)}
                        style={{ cursor: 'pointer', marginRight: '8px' }}
                      >
                        ✏️
                      </span>
                      <span
                        title="Delete Phase"
                        onClick={() => setConfirmDeletePhase({ id: phase.id, name: phase.name })}
                        style={{ cursor: 'pointer', color: 'var(--d2-accent-red)' }}
                      >
                        🗑️
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Phase Modal */}
      {modalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className={styles.modalBox} role="dialog" aria-modal="true">
            <div className={styles.modalTitle}>
              {editingId ? 'Edit Enrollment Phase' : 'Add Enrollment Phase'}
            </div>
            <form onSubmit={handleSavePhase}>
              <div className={styles.formGroup}>
                <label htmlFor="modalPhaseName">Phase Name</label>
                <input
                  type="text"
                  id="modalPhaseName"
                  placeholder="e.g. Final Year Registration"
                  value={modalData.name}
                  onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
                  className={styles.formControl}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="modalYear">Eligible Students</label>
                <select
                  id="modalYear"
                  value={modalData.eligibleGroups}
                  onChange={(e) => setModalData({ ...modalData, eligibleGroups: e.target.value })}
                  className={styles.formControlSelect}
                >
                  <option value="Final Year">Final Year Students</option>
                  <option value="3rd Year">3rd Year Students</option>
                  <option value="2nd Year">2nd Year Students</option>
                  <option value="1st Year">1st Year Students</option>
                  <option value="Backlog Students">Backlog Students</option>
                  <option value="All Students">All Students</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="modalSemester">Timeline</label>
                <input
                  type="text"
                  id="modalSemester"
                  placeholder="e.g. Aug 1 - Aug 2"
                  value={modalData.timeline}
                  onChange={(e) => setModalData({ ...modalData, timeline: e.target.value })}
                  className={styles.formControl}
                  required
                />
              </div>

              <div className={styles.formGroup} style={{ margin: 0 }}>
                <label htmlFor="modalPhaseStatus">Phase Status</label>
                <select
                  id="modalPhaseStatus"
                  value={modalData.status}
                  onChange={(e) => setModalData({ ...modalData, status: e.target.value })}
                  className={styles.formControlSelect}
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnOutline}`}
                  onClick={closeModal}
                  disabled={savingPhase}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  disabled={savingPhase}
                >
                  {savingPhase ? 'Saving...' : 'Save Phase Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeletePhase && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeletingPhase) setConfirmDeletePhase(null);
          }}
        >
          <div className={styles.modalBox} role="dialog" aria-modal="true" style={{ maxWidth: '440px' }}>
            <div className={styles.modalTitle}>Confirm Phase Deletion</div>
            <p style={{ color: 'var(--d2-text-muted)', fontSize: '0.92rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Are you sure you want to delete enrollment phase{' '}
              <strong style={{ color: 'var(--d2-text-dark)' }}>&ldquo;{confirmDeletePhase.name}&rdquo;</strong>?
              This action cannot be undone.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnOutline}`}
                onClick={() => setConfirmDeletePhase(null)}
                disabled={isDeletingPhase}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnDanger}`}
                onClick={handleDeletePhase}
                disabled={isDeletingPhase}
              >
                {isDeletingPhase ? 'Deleting...' : 'Delete Phase'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Dean2Layout>
  );
}
