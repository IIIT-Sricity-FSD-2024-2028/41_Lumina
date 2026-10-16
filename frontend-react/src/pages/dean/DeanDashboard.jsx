/**
 * DeanDashboard.jsx
 *
 * Lumina Dean's Executive Portal
 * Features:
 * - Institutional oversight & assistant dean management
 * - High-priority override interventions with form downloads
 * - Academic enrollment window calendar timeline
 * - Real-time enrollment availability & capacity metrics
 * - Semester Revenue & B2B SaaS Tier Subscription Management (Proration, Upgrade, Renewal, Cancel, Grace Period)
 * - Critical System Audit Trail
 * - System User Directory CRUD Engine (Add, Edit, Delete users)
 * - B2C Student Tuition Clearance & Financial Hold Ledger (Record payments, Waive holds)
 * - Institutional Academic Archive JSON export
 */

import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import TopNavbar from '../../components/common/TopNavbar';
import Footer from '../../components/Footer';

// Pre-built services
import { usersService } from '../../services/users.service';
import { coursesService } from '../../services/courses.service';
import { registrationsService } from '../../services/registrations.service';
import { revenueService } from '../../services/revenue.service';
import { policiesService } from '../../services/policies.service';
import { overridesService } from '../../services/overrides.service';

import styles from './DeanDashboard.module.css';

function formatTimelineDate(dtStr, fallbackMonth = 'SEP', fallbackDay = '01') {
  if (!dtStr) return { month: fallbackMonth, day: fallbackDay };
  const d = new Date(dtStr);
  if (isNaN(d.getTime())) return { month: fallbackMonth, day: fallbackDay };
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const day = String(d.getDate()).padStart(2, '0');
  return { month, day };
}

export default function DeanDashboard() {
  const { user } = useAuth();

  // Core Data States
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [revenueData, setRevenueData] = useState(null);
  const [clearanceRoster, setClearanceRoster] = useState([]);
  const [clearanceFilter, setClearanceFilter] = useState('all');
  const [graceLifecycle, setGraceLifecycle] = useState(null);
  const [policies, setPolicies] = useState({});
  const [phases, setPhases] = useState([]);
  const [overrides, setOverrides] = useState([]);
  const [loading, setLoading] = useState(true);

  // User CRUD Modal State
  const [userModal, setUserModal] = useState({
    isOpen: false,
    mode: 'create', // 'create' | 'edit'
    data: null,
  });

  // Financial Hold Waiver Modal State
  const [waiverModal, setWaiverModal] = useState({
    isOpen: false,
    studentId: '',
    studentName: '',
    reason: 'Dean Academic Merit Scholarship Waiver',
  });

  // SaaS Subscription Modal State
  const [saasModal, setSaasModal] = useState({
    isOpen: false,
    targetTier: 'Enterprise',
    billingCycle: 'annual', // 'annual' | 'monthly'
    proration: null,
    loading: false,
  });

  // Cancel Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [deleteUserModal, setDeleteUserModal] = useState({ isOpen: false, userId: '' });

  // Load all initial data dynamically
  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      const [uRes, cRes, rRes, revRes, clearRes, lifeRes, polRes, phasesRes, ovRes] = await Promise.allSettled([
        usersService.getAll(),
        coursesService.getAll(),
        registrationsService.getAll(),
        revenueService.getSummary(),
        revenueService.getClearanceRoster(),
        revenueService.getLifecycle(),
        policiesService.getPolicies(),
        policiesService.getPhases(),
        overridesService.getAll(),
      ]);

      if (uRes.status === 'fulfilled' && Array.isArray(uRes.value)) setUsers(uRes.value);
      if (cRes.status === 'fulfilled' && Array.isArray(cRes.value)) setCourses(cRes.value);
      if (rRes.status === 'fulfilled' && Array.isArray(rRes.value)) setRegistrations(rRes.value);
      if (revRes.status === 'fulfilled' && revRes.value) setRevenueData(revRes.value);
      if (clearRes.status === 'fulfilled' && Array.isArray(clearRes.value)) setClearanceRoster(clearRes.value);
      if (lifeRes.status === 'fulfilled' && lifeRes.value) setGraceLifecycle(lifeRes.value);
      if (polRes.status === 'fulfilled' && polRes.value?.settings) setPolicies(polRes.value.settings);
      if (phasesRes.status === 'fulfilled' && Array.isArray(phasesRes.value)) setPhases(phasesRes.value);
      if (ovRes.status === 'fulfilled' && Array.isArray(ovRes.value)) setOverrides(ovRes.value);
    } catch (err) {
      console.warn('Error loading Dean dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Filtered Assistant Deans
  const assistantDeans = useMemo(() => {
    return users.filter(u => {
      const r = u.role || u.Role || '';
      return r.includes('Assistant_Dean');
    });
  }, [users]);

  // Pending Override Requests
  const pendingOverrides = useMemo(() => {
    return overrides.filter(
      (o) => (o.approvalStatus || o.Approval_Status || o.status) === 'Pending'
    );
  }, [overrides]);

  const startDateObj = formatTimelineDate(policies.startDate, 'AUG', '01');
  const endDateObj = formatTimelineDate(policies.endDate, 'AUG', '30');

  // Enrollment Statistics Calculations
  const enrollmentStats = useMemo(() => {
    const totalCourses = courses.length;
    const availableCourses = courses.filter(c => {
      const enrolled = registrations.filter(r => r.courseId === c.courseId).length;
      return enrolled < (c.capacity || c.courseCapacity || 60);
    });
    const availabilityPercent = totalCourses > 0 ? Math.round((availableCourses.length / totalCourses) * 100) : 0;

    const uniqueStudents = new Set(registrations.map(r => r.studentId || r.Student_ID)).size;
    const universityCapacity = 2000;
    const capacityPercent = Math.min(100, Math.round((uniqueStudents / universityCapacity) * 100));

    return {
      availableCount: availableCourses.length,
      totalCourses,
      availabilityPercent,
      uniqueStudents,
      universityCapacity,
      capacityPercent,
    };
  }, [courses, registrations]);

  // Filtered Student Clearance Roster
  const filteredClearanceRoster = useMemo(() => {
    if (clearanceFilter === 'all') return clearanceRoster;
    return clearanceRoster.filter(s => s.status === clearanceFilter);
  }, [clearanceRoster, clearanceFilter]);

  const clearanceCounts = useMemo(() => {
    return {
      all: clearanceRoster.length,
      cleared: clearanceRoster.filter(s => s.status === 'Cleared').length,
      pending: clearanceRoster.filter(s => s.status === 'Pending').length,
      waived: clearanceRoster.filter(s => s.status === 'Waived').length,
    };
  }, [clearanceRoster]);

  // ---------------------------------------------------------------------------
  // Action Handlers
  // ---------------------------------------------------------------------------

  // User CRUD Actions
  async function handleSaveUser(e) {
    e.preventDefault();
    const form = e.target;
    const payload = {
      User_ID: form.userId.value.trim(),
      Full_Name: form.fullName.value.trim(),
      Email: form.email.value.trim(),
      Role: form.role.value,
      Dept_ID: form.deptId.value,
    };

    try {
      if (userModal.mode === 'create') {
        payload.Password = 'password123';
        await usersService.create(payload);
        toast.success(`User ${payload.User_ID} created successfully!`);
      } else {
        await usersService.update(payload.User_ID, payload);
        toast.success(`User ${payload.User_ID} updated successfully!`);
      }
      setUserModal({ isOpen: false, mode: 'create', data: null });
      const refreshedUsers = await usersService.getAll();
      setUsers(refreshedUsers);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save user');
    }
  }

  function handleDeleteUser(userId) {
    if (userId === user?.User_ID) {
      toast.error('You cannot delete your own active session!');
      return;
    }
    setDeleteUserModal({ isOpen: true, userId });
  }

  async function confirmDeleteUser() {
    const userId = deleteUserModal.userId;
    setDeleteUserModal({ isOpen: false, userId: '' });
    try {
      await usersService.delete(userId);
      toast.success(`User ${userId} deleted.`);
      setUserModal({ isOpen: false, mode: 'create', data: null });
      const refreshed = await usersService.getAll();
      setUsers(refreshed);
    } catch (err) {
      toast.error('Failed to delete user');
    }
  }

  // Tuition Financial Actions
  async function handleRecordPayment(studentId, name) {
    try {
      await revenueService.payStudentTuition(studentId, 2500);
      toast.success(`Payment recorded for ${name} ($2,500)! Registration hold cleared.`);
      const [revRes, clearRes] = await Promise.all([
        revenueService.getSummary(),
        revenueService.getClearanceRoster(),
      ]);
      setRevenueData(revRes);
      setClearanceRoster(clearRes);
    } catch (err) {
      toast.error('Failed to record payment');
    }
  }

  function openGrantWaiverModal(studentId, name) {
    setWaiverModal({
      isOpen: true,
      studentId,
      studentName: name,
      reason: 'Dean Academic Merit Scholarship Waiver',
    });
  }

  async function handleConfirmWaiver(e) {
    e.preventDefault();
    const { studentId, studentName, reason } = waiverModal;
    setWaiverModal(prev => ({ ...prev, isOpen: false }));
    try {
      await revenueService.waiveHold(studentId, reason.trim() || 'Dean Academic Merit Scholarship Waiver');
      toast.success(`Financial hold waived for ${studentName}!`);
      const [revRes, clearRes] = await Promise.all([
        revenueService.getSummary(),
        revenueService.getClearanceRoster(),
      ]);
      setRevenueData(revRes);
      setClearanceRoster(clearRes);
    } catch (err) {
      toast.error('Failed to grant waiver');
    }
  }

  // SaaS Proration Calculator & Subscription Update
  async function fetchProrationPreview(targetTier, cycle) {
    try {
      const data = await revenueService.getProrationPreview(targetTier, cycle);
      setSaasModal(prev => ({ ...prev, proration: data }));
    } catch (err) {
      console.warn('Proration error:', err);
    }
  }

  function openSaasManageModal() {
    const currentTier = revenueData?.activeSaasPlan?.tier || 'Enterprise';
    setSaasModal({
      isOpen: true,
      targetTier: currentTier,
      billingCycle: 'annual',
      proration: null,
      loading: false,
    });
    fetchProrationPreview(currentTier, 'annual');
  }

  async function handleConfirmSaasTier() {
    setSaasModal(prev => ({ ...prev, loading: true }));
    try {
      const res = await revenueService.setActiveTier(saasModal.targetTier, saasModal.billingCycle);
      toast.success(res.message || `Subscription updated to ${saasModal.targetTier} Plan!`);
      setSaasModal(prev => ({ ...prev, isOpen: false, loading: false }));
      const [revRes, lifeRes] = await Promise.all([
        revenueService.getSummary(),
        revenueService.getLifecycle(),
      ]);
      setRevenueData(revRes);
      setGraceLifecycle(lifeRes);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update SaaS subscription');
      setSaasModal(prev => ({ ...prev, loading: false }));
    }
  }

  // Subscription Cancellation
  async function handleConfirmCancelSubscription() {
    try {
      await revenueService.cancelSubscription();
      toast.success('Subscription auto-renewal disabled. Access remains active until period end.');
      setCancelModalOpen(false);
      const revRes = await revenueService.getSummary();
      setRevenueData(revRes);
    } catch (err) {
      toast.error('Failed to cancel subscription');
    }
  }

  // Simulate Grace Period / Reactivate License
  async function handleToggleGrace(enable) {
    try {
      await revenueService.simulateGracePeriod(enable);
      toast.success(enable ? '⚠️ 60-Day Grace Period simulation is now ACTIVE!' : '✅ Institutional License Reactivated!');
      setCancelModalOpen(false);
      const [revRes, lifeRes] = await Promise.all([
        revenueService.getSummary(),
        revenueService.getLifecycle(),
      ]);
      setRevenueData(revRes);
      setGraceLifecycle(lifeRes);
    } catch (err) {
      toast.error('Failed to toggle grace period simulation');
    }
  }

  // Export Academic Archive JSON
  async function handleExportArchive() {
    try {
      toast.loading('Generating Institutional Archive...', { id: 'archive-toast' });
      const data = await revenueService.exportArchive();
      toast.dismiss('archive-toast');

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const instName = data?.institutionInfo?.name?.replace(/\s+/g, '_') || 'IIIT_Sri_City';
      a.download = `lumina_academic_archive_${instName}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('📥 Academic Archive Downloaded Successfully!');
    } catch (err) {
      toast.error('Failed to export academic archive');
    }
  }

  // Download Pending Override Intervention Forms Report
  function handleDownloadOverrideForms() {
    const pendingList = overrides.filter(
      (o) => (o.approvalStatus || o.Approval_Status || o.status) === 'Pending'
    );
    if (pendingList.length === 0) {
      toast.error('No pending override requests to download.');
      return;
    }

    const headers = ['Request ID', 'Student ID', 'Course ID', 'Reason', 'Status', 'Date'];
    const rows = pendingList.map((r) => [
      `"${r.requestId || r.Request_ID || r.id}"`,
      `"${r.studentId || r.Student_ID || 'N/A'}"`,
      `"${r.courseId || r.Course_ID || 'N/A'}"`,
      `"${(r.reason || r.Reason || '').replace(/"/g, '""')}"`,
      `"${r.approvalStatus || r.Approval_Status || 'Pending'}"`,
      `"${r.createdAt || r.Created_At || new Date().toISOString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Lumina_Pending_Override_Interventions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`📥 Downloaded ${pendingList.length} override intervention forms!`);
  }

  // Download User Import Template CSV
  function handleDownloadUserTemplate() {
    const headers = ['User_ID', 'Full_Name', 'Email', 'Role', 'Dept_ID'];
    const sampleRows = [
      ['S2024099', 'Sample Student', 'student@lumina.edu', 'Student', 'CSE'],
      ['F2024099', 'Dr. Sample Faculty', 'faculty@lumina.edu', 'Faculty', 'ECE'],
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...sampleRows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Lumina_User_Directory_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('📥 User Directory import template downloaded!');
  }

  const navLinks = [
    { label: 'Home', to: '/dean', end: true },
  ];

  const activePlan = revenueData?.activeSaasPlan || {};
  const isGraceActive = graceLifecycle?.status === 'Read_Only_Grace_Period';

  return (
    <>
      <TopNavbar navLinks={navLinks} />

      <main className={styles.pageContainer}>
        {/* 60-Day Grace Period Warning Banner */}
        {isGraceActive && (
          <div className={styles.graceBanner}>
            <div className={styles.graceLeft}>
              <span style={{ fontSize: '1.8rem' }}>⚠️</span>
              <div>
                <div className={styles.graceTitle}>
                  INSTITUTIONAL LICENSE EXPIRED — 60-Day Read-Only Grace Period Active
                </div>
                <div className={styles.graceText}>
                  Operating in Read-Only mode ({graceLifecycle?.daysRemainingInGrace || 29} Days Remaining). Grade and transcript exports remain available.
                </div>
              </div>
            </div>
            <div className={styles.graceActions}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}
                style={{ borderColor: '#d97706', color: '#b45309', background: '#fef3c7' }}
                onClick={handleExportArchive}
              >
                📥 Export Archive (JSON)
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSuccess} ${styles.btnSm}`}
                onClick={() => handleToggleGrace(false)}
              >
                🔄 Reactivate License
              </button>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Dean's Dashboard</h1>
          <p className={styles.pageSubtitle}>
            Institutional oversight and administrative management.
          </p>
        </div>

        {/* Top Grid: Assistant Deans | Override Interventions | Enrollment Timeline */}
        <div className={styles.topGrid}>
          {/* Assistant Deans Delegation */}
          <div className={styles.card}>
            <div className={styles.cardHeaderFlex}>
              <h3 className={styles.cardTitle}>👥 Assistant Deans</h3>
              <span className={styles.cardLiveBadge}>{assistantDeans.length} ACTIVE</span>
            </div>
            <div className={styles.deansList}>
              {assistantDeans.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No Assistant Deans assigned.</div>
              ) : (
                assistantDeans.map(d => {
                  const initials = (d.fullName || d.Full_Name || 'AD').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
                  const roleName = (d.role || d.Role || '').replace(/_/g, ' ');
                  return (
                    <div key={d.userId || d.User_ID} className={styles.deanRow}>
                      <div className={styles.deanInfo}>
                        <div className={styles.deanAvatar}>{initials}</div>
                        <div>
                          <div>{d.fullName || d.Full_Name}</div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{roleName}</span>
                        </div>
                      </div>
                      <span className={`${styles.badge} ${styles.badgeActive}`}>ACTIVE</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Override Interventions */}
          <div className={styles.card}>
            <div className={styles.cardHeaderFlex}>
              <h3 className={styles.cardTitle}>❗ Override Interventions</h3>
              <span
                className={styles.cardLiveBadge}
                style={{
                  background: pendingOverrides.length > 0 ? '#fef2f2' : '#f0fdf4',
                  color: pendingOverrides.length > 0 ? '#dc2626' : '#16a34a',
                  borderColor: pendingOverrides.length > 0 ? '#fca5a5' : '#86efac',
                }}
              >
                {pendingOverrides.length > 0 ? `${pendingOverrides.length} PENDING` : 'RESOLVED'}
              </span>
            </div>

            {pendingOverrides.length > 0 ? (
              <>
                <div className={`${styles.alertBox} ${styles.alertHigh}`}>
                  <h4 className={styles.alertHighTitle}>
                    {pendingOverrides[0].courseId || pendingOverrides[0].Course_ID || 'Course Override'} Exception
                  </h4>
                  <p className={styles.alertText}>
                    Student {pendingOverrides[0].studentId || pendingOverrides[0].Student_ID}: {pendingOverrides[0].reason || pendingOverrides[0].Reason || 'Prerequisite / Capacity Override Request'}.
                  </p>
                  <button
                    type="button"
                    className={styles.alertLink}
                    onClick={handleDownloadOverrideForms}
                  >
                    Download and Review forms ({pendingOverrides.length}) ↗
                  </button>
                </div>
                {pendingOverrides.length > 1 && (
                  <div className={`${styles.alertBox} ${styles.alertMinor}`}>
                    <h4 className={styles.alertMinorTitle}>Active AD2 Override Queue</h4>
                    <p className={styles.alertText}>
                      {pendingOverrides.length - 1} additional exception request(s) awaiting Assistant Dean review.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.alertBox} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <h4 style={{ color: '#166534', margin: '0 0 4px 0', fontSize: '0.95rem' }}>✓ All Overrides Reviewed</h4>
                <p className={styles.alertText} style={{ color: '#15803d' }}>
                  No urgent prerequisite or capacity conflicts currently pending Dean or Assistant Dean intervention.
                </p>
              </div>
            )}
          </div>

          {/* Enrollment Window Calendar */}
          <div className={styles.card}>
            <div className={styles.cardHeaderFlex}>
              <h3 className={styles.cardTitle}>📅 Enrollment Window Calendar</h3>
              <span className={styles.cardLiveBadge}>
                {policies.windowStatus || 'ACTIVE'}
              </span>
            </div>
            <div className={styles.timelineItem}>
              <div className={styles.dateBox}>
                <span className={styles.dateMonth}>{startDateObj.month}</span>
                <span className={styles.dateDay}>{startDateObj.day}</span>
              </div>
              <div className={styles.timelineContent}>
                <h4>Enrollment Window Start</h4>
                <p>Term: {policies.term || 'Spring'} {policies.academicYear || '2025-2026'}</p>
              </div>
            </div>

            {phases.length > 0 ? (
              phases.slice(0, 2).map((phase) => (
                <div key={phase.id} className={styles.timelineItem}>
                  <div
                    className={styles.dateBox}
                    style={{ background: '#eff6ff', color: '#2563EB', borderColor: '#bfdbfe' }}
                  >
                    <span className={styles.dateMonth}>
                      {phase.status?.substring(0, 3).toUpperCase() || 'PHS'}
                    </span>
                    <span className={styles.dateDay}>●</span>
                  </div>
                  <div className={styles.timelineContent}>
                    <h4>{phase.name}</h4>
                    <p>{phase.timeline || phase.eligibleGroups || 'Registration Phase'}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.timelineItem}>
                <div className={styles.dateBox}>
                  <span className={styles.dateMonth}>ACTIVE</span>
                  <span className={styles.dateDay}>●</span>
                </div>
                <div className={styles.timelineContent}>
                  <h4>Regular Registration Period</h4>
                  <p>All enrolled student cohorts</p>
                </div>
              </div>
            )}

            <div className={styles.timelineItem}>
              <div className={`${styles.dateBox} ${styles.dateBoxGray}`}>
                <span className={styles.dateMonth}>{endDateObj.month}</span>
                <span className={styles.dateDay}>{endDateObj.day}</span>
              </div>
              <div className={styles.timelineContent}>
                <h4>Enrollment Window End</h4>
                <p>Add/drop frozen; section capacity locks enforced</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Grid: Enrollment Statistics & Semester Revenue / SaaS Tiers */}
        <div className={styles.bottomGrid}>
          {/* Enrollment Statistics */}
          <div className={styles.card}>
            <div className={styles.cardHeaderFlex}>
              <h3 className={styles.cardTitle}>📊 Enrollment Statistics</h3>
              <span className={styles.cardLiveBadge}>REAL-TIME METRICS</span>
            </div>

            <div className={styles.statBlock}>
              <div className={styles.statTextRow}>
                <span className={styles.statName}>Courses with Seat Availability</span>
                <span className={styles.statValue}>{enrollmentStats.availabilityPercent}%</span>
              </div>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${enrollmentStats.availabilityPercent}%` }} />
              </div>
              <p className={styles.statSubtext}>
                {enrollmentStats.availableCount} of {enrollmentStats.totalCourses} courses currently have open seats
              </p>
            </div>

            <div className={styles.statBlock}>
              <div className={styles.statTextRow}>
                <span className={styles.statName}>Total Enrolled Students</span>
                <span className={styles.statValue}>{enrollmentStats.uniqueStudents} / {enrollmentStats.universityCapacity}</span>
              </div>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${enrollmentStats.capacityPercent}%`, background: '#10b981' }}
                />
              </div>
              <p className={styles.statSubtext}>
                {enrollmentStats.capacityPercent}% of total university enrollment capacity reached
              </p>
            </div>
          </div>

          {/* Semester Revenue & SaaS License Tier */}
          <div className={styles.card}>
            <div className={styles.cardHeaderFlex}>
              <h3 className={styles.cardTitle}>💰 Semester Revenue & Tuition</h3>
              <span className={styles.cardLiveBadge}>LIVE REVENUE</span>
            </div>

            <div className={styles.statBlock}>
              <div className={styles.statTextRow}>
                <span className={styles.statName}>Total Tuition Billed</span>
                <span className={styles.statValue} style={{ color: '#0284c7' }}>
                  ${(revenueData?.totalTuitionTarget || revenueData?.totalGrossRevenue || 3125000).toLocaleString()}
                </span>
              </div>
              <div className={styles.statTextRow}>
                <span className={styles.statName}>Tuition Collected</span>
                <span className={styles.statValue} style={{ color: '#16a34a' }}>
                  ${(revenueData?.totalFeesCollected || 0).toLocaleString()} ({revenueData?.collectionRatePercent || 0}%)
                </span>
              </div>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${Math.min(100, revenueData?.collectionRatePercent || 0)}%`, background: '#16a34a' }}
                />
              </div>
              <p className={styles.statSubtext}>
                {(revenueData?.clearedStudentsCount || 0) + (revenueData?.waivedStudentsCount || 0)} of {revenueData?.totalStudentsEnrolled || 0} Students Cleared ($2,500 Flat Fee)
              </p>
            </div>

            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed var(--border-color)' }}>
              <div className={styles.statTextRow}>
                <span className={styles.statName}>Institutional SaaS Tier</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{activePlan.tier || 'Enterprise'} Plan</span>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnOutline} ${styles.btnXs}`}
                    style={{ color: 'var(--accent-blue)', borderColor: '#93c5fd', background: '#eff6ff' }}
                    onClick={openSaasManageModal}
                  >
                    ⚙️ Manage / Renew
                  </button>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnOutline} ${styles.btnXs}`}
                    style={{ color: '#dc2626', borderColor: '#fca5a5', background: '#fef2f2' }}
                    onClick={() => setCancelModalOpen(true)}
                  >
                    🚫 Cancel
                  </button>
                </div>
              </div>
              <p className={styles.statSubtext}>
                ${(activePlan.monthlyRecurringRevenue || 8999).toLocaleString()} / mo (ARR: ${(activePlan.annualRecurringRevenue || 107988).toLocaleString()})
              </p>
            </div>
          </div>
        </div>

        {/* System User Directory (CRUD Table) */}
        <div className={styles.card} style={{ marginBottom: '24px' }}>
          <div className={styles.cardHeaderFlex}>
            <div>
              <h3 className={styles.cardTitle}>👥 System User Directory</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Full administrative directory for faculty, students, and operational personnel.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}
                onClick={handleDownloadUserTemplate}
                title="Download CSV import template"
              >
                📥 Download Template
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
                onClick={() => setUserModal({ isOpen: true, mode: 'create', data: null })}
              >
                + Add New User
              </button>
            </div>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>USER ID</th>
                  <th>FULL NAME</th>
                  <th>ROLE</th>
                  <th>DEPARTMENT</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 15).map(u => (
                  <tr key={u.userId || u.User_ID}>
                    <td><strong>{u.userId || u.User_ID}</strong></td>
                    <td>{u.fullName || u.Full_Name}</td>
                    <td>
                      <span className={`${styles.badge} ${styles.badgeRole}`}>
                        {(u.role || u.Role || 'Student').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>{u.deptId || u.Dept_ID || 'CSE'}</td>
                    <td>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnOutline} ${styles.btnXs}`}
                        onClick={() => setUserModal({ isOpen: true, mode: 'edit', data: u })}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Student Tuition Clearance & Financial Hold Roster */}
        <div className={styles.card}>
          <div className={styles.cardHeaderFlex}>
            <div>
              <h3 className={styles.cardTitle}>🎓 Student Tuition Clearance & Financial Hold Roster</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Flat Semester Tuition ($2,500). Enforces enrollment holds until fee clearance or merit waiver.
              </p>
            </div>
            <div className={styles.filterStrip}>
              <button
                type="button"
                className={`${styles.filterBtn} ${clearanceFilter === 'all' ? styles.filterBtnActive : ''}`}
                onClick={() => setClearanceFilter('all')}
              >
                All ({clearanceCounts.all})
              </button>
              <button
                type="button"
                className={`${styles.filterBtn} ${clearanceFilter === 'Cleared' ? styles.filterBtnActive : ''}`}
                style={{ color: '#16a34a' }}
                onClick={() => setClearanceFilter('Cleared')}
              >
                Cleared ({clearanceCounts.cleared})
              </button>
              <button
                type="button"
                className={`${styles.filterBtn} ${clearanceFilter === 'Pending' ? styles.filterBtnActive : ''}`}
                style={{ color: '#b91c1c' }}
                onClick={() => setClearanceFilter('Pending')}
              >
                Pending Hold ({clearanceCounts.pending})
              </button>
              <button
                type="button"
                className={`${styles.filterBtn} ${clearanceFilter === 'Waived' ? styles.filterBtnActive : ''}`}
                style={{ color: '#7c3aed' }}
                onClick={() => setClearanceFilter('Waived')}
              >
                Waived ({clearanceCounts.waived})
              </button>
            </div>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>STUDENT SCHOLAR</th>
                  <th>DEPT & SEMESTER</th>
                  <th>FLAT TUITION</th>
                  <th>AMOUNT PAID</th>
                  <th>BALANCE DUE</th>
                  <th>CLEARANCE STATUS</th>
                  <th>FINANCIAL ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredClearanceRoster.map(s => {
                  const isCleared = s.status === 'Cleared';
                  const isWaived = s.status === 'Waived';
                  return (
                    <tr key={s.studentId}>
                      <td>
                        <strong>{s.fullName}</strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.studentId}</div>
                      </td>
                      <td>
                        <strong>{s.deptId}</strong> · Semester {s.semester}
                      </td>
                      <td>${(s.totalSemesterFee || 2500).toLocaleString()}</td>
                      <td style={{ color: '#16a34a', fontWeight: '700' }}>${(s.amountPaid || 0).toLocaleString()}</td>
                      <td style={{ color: s.balanceDue > 0 ? '#b91c1c' : '#16a34a', fontWeight: '700' }}>
                        ${(s.balanceDue || 0).toLocaleString()}
                      </td>
                      <td>
                        {isCleared ? (
                          <span className={`${styles.badge} ${styles.badgeCleared}`}>✅ Cleared</span>
                        ) : isWaived ? (
                          <span className={`${styles.badge} ${styles.badgeWaived}`}>🎓 Waived</span>
                        ) : (
                          <span className={`${styles.badge} ${styles.badgePending}`}>⚠️ Fee Hold Active</span>
                        )}
                      </td>
                      <td>
                        {isCleared ? (
                          <span style={{ fontSize: '0.75rem', color: '#059669', fontFamily: 'monospace' }}>
                            {s.transactionId || 'PAID'}
                          </span>
                        ) : isWaived ? (
                          <span style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: '600' }}>
                            {s.waiverReason || 'Scholarship Waiver'}
                          </span>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              className={`${styles.btn} ${styles.btnOutline} ${styles.btnXs}`}
                              style={{ color: '#16a34a', borderColor: '#86efac', background: '#f0fdf4' }}
                              onClick={() => handleRecordPayment(s.studentId, s.fullName)}
                            >
                              💳 Mark Paid
                            </button>
                            <button
                              type="button"
                              className={`${styles.btn} ${styles.btnOutline} ${styles.btnXs}`}
                              style={{ color: '#7c3aed', borderColor: '#c4b5fd', background: '#f5f3ff' }}
                              onClick={() => openGrantWaiverModal(s.studentId, s.fullName)}
                            >
                              🎓 Waive Hold
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* User CRUD Modal */}
      {userModal.isOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalDialog}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {userModal.mode === 'create' ? 'Add New User' : 'Edit User Details'}
              </h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setUserModal({ isOpen: false, mode: 'create', data: null })}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveUser}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>User ID</label>
                  <input
                    type="text"
                    name="userId"
                    required
                    readOnly={userModal.mode === 'edit'}
                    defaultValue={userModal.data?.userId || userModal.data?.User_ID || ''}
                    className={styles.formControl}
                    placeholder="e.g. S2024099"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    defaultValue={userModal.data?.fullName || userModal.data?.Full_Name || ''}
                    className={styles.formControl}
                    placeholder="e.g. Jane Doe"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    required
                    defaultValue={userModal.data?.email || userModal.data?.Email || ''}
                    className={styles.formControl}
                    placeholder="jane.doe@lumina.edu"
                  />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>System Role</label>
                    <select
                      name="role"
                      defaultValue={userModal.data?.role || userModal.data?.Role || 'Student'}
                      className={styles.formControl}
                    >
                      <option value="Student">Student</option>
                      <option value="Faculty">Faculty</option>
                      <option value="Assistant_Dean_1">Assistant Dean 1</option>
                      <option value="Assistant_Dean_2">Assistant Dean 2</option>
                      <option value="Dean">Dean</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Department</label>
                    <select
                      name="deptId"
                      defaultValue={userModal.data?.deptId || userModal.data?.Dept_ID || 'CSE'}
                      className={styles.formControl}
                    >
                      <option value="CSE">CSE</option>
                      <option value="ECE">ECE</option>
                      <option value="AIDS">AIDS</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                {userModal.mode === 'edit' && (
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnOutline}`}
                    style={{ color: '#ef4444', borderColor: '#fca5a5', marginRight: 'auto' }}
                    onClick={() => handleDeleteUser(userModal.data?.userId || userModal.data?.User_ID)}
                  >
                    Delete User
                  </button>
                )}
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnOutline}`}
                  onClick={() => setUserModal({ isOpen: false, mode: 'create', data: null })}
                >
                  Cancel
                </button>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SaaS Tier Management Modal */}
      {saasModal.isOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalDialog} style={{ maxWidth: '620px' }}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Institutional SaaS Subscription Package</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Upgrade or renew university licensing and active capability tiers
                </span>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setSaasModal(prev => ({ ...prev, isOpen: false }))}
              >
                &times;
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Billing Cycle Switcher */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnSm}`}
                    style={{
                      background: saasModal.billingCycle === 'annual' ? '#3b82f6' : 'transparent',
                      color: saasModal.billingCycle === 'annual' ? '#ffffff' : '#64748b',
                    }}
                    onClick={() => {
                      setSaasModal(prev => ({ ...prev, billingCycle: 'annual' }));
                      fetchProrationPreview(saasModal.targetTier, 'annual');
                    }}
                  >
                    Annual Term (20% Off)
                  </button>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnSm}`}
                    style={{
                      background: saasModal.billingCycle === 'monthly' ? '#3b82f6' : 'transparent',
                      color: saasModal.billingCycle === 'monthly' ? '#ffffff' : '#64748b',
                    }}
                    onClick={() => {
                      setSaasModal(prev => ({ ...prev, billingCycle: 'monthly' }));
                      fetchProrationPreview(saasModal.targetTier, 'monthly');
                    }}
                  >
                    Monthly Billing
                  </button>
                </div>
              </div>

              {/* Tier Cards */}
              {[
                { id: 'Starter', name: 'Starter College Tier', price: saasModal.billingCycle === 'annual' ? '$999 / mo' : '$1,499 / mo', desc: 'Core course enrollment & catalog management' },
                { id: 'Campus', name: 'University Campus Tier', price: saasModal.billingCycle === 'annual' ? '$2,499 / mo' : '$3,499 / mo', desc: 'Adds Prerequisite validation & full Faculty gradebook' },
                { id: 'Enterprise', name: 'Enterprise Multi-Campus', price: saasModal.billingCycle === 'annual' ? '$5,999 / mo' : '$8,999 / mo', desc: '99.99% Dedicated SLA, Lumina SPOC & system audit trail' },
              ].map(t => {
                const isSelected = saasModal.targetTier === t.id;
                return (
                  <div
                    key={t.id}
                    className={`${styles.tierCard} ${isSelected ? styles.tierCardActive : ''}`}
                    onClick={() => {
                      setSaasModal(prev => ({ ...prev, targetTier: t.id }));
                      fetchProrationPreview(t.id, saasModal.billingCycle);
                    }}
                  >
                    <input type="radio" checked={isSelected} readOnly />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.95rem' }}>{t.name}</strong>
                        <span style={{ fontWeight: '800', color: '#166534' }}>{t.price}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {t.desc}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Proration Summary Box */}
              {saasModal.proration && (
                <div className={styles.prorationSummaryBox}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#475569' }}>
                      ⚡ Prorated Billing Calculation
                    </span>
                    <span className={`${styles.badge} ${styles.badgeRole}`}>
                      {saasModal.proration.action || 'RENEWAL'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#334155', marginBottom: '4px' }}>
                    <span>Amount Charged Today:</span>
                    <strong style={{ color: '#2563eb', fontSize: '1.05rem' }}>
                      ${(saasModal.proration.netAmountToPay || 0).toLocaleString()}
                    </strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Next Renewal Date: {new Date(saasModal.proration.newRenewalDate || Date.now()).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnOutline}`}
                onClick={() => setSaasModal(prev => ({ ...prev, isOpen: false }))}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                disabled={saasModal.loading}
                onClick={handleConfirmSaasTier}
              >
                {saasModal.loading ? 'Processing...' : 'Confirm Subscription Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation & Grace Simulation Modal */}
      {cancelModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalDialog}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle} style={{ color: '#dc2626' }}>Cancel Institutional Subscription</h3>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setCancelModalOpen(false)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ fontSize: '0.9rem', color: '#334155' }}>
                Are you sure you want to disable automatic contract renewal for your university? Your active access will remain valid until the expiration date, followed by a 60-day read-only grace period.
              </p>
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px', borderRadius: '8px', marginTop: '12px' }}>
                <strong style={{ color: '#991b1b', fontSize: '0.85rem' }}>🧪 Lab / Viva Simulation Action:</strong>
                <p style={{ margin: '4px 0 8px 0', fontSize: '0.8rem', color: '#7f1d1d' }}>
                  Simulate contract expiration immediately to demonstrate the 60-Day Read-Only Grace Period banner and academic transcript export.
                </p>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}
                  style={{ color: '#b45309', borderColor: '#f59e0b', background: '#fffbeb', fontWeight: '700' }}
                  onClick={() => handleToggleGrace(true)}
                >
                  ⚡ Trigger 60-Day Grace Period Simulation
                </button>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setCancelModalOpen(false)}>Back</button>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} style={{ background: '#dc2626' }} onClick={handleConfirmCancelSubscription}>
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deleteUserModal.isOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalDialog}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle} style={{ color: '#ef4444' }}>Delete User Account</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setDeleteUserModal({ isOpen: false, userId: '' })}
              >
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ marginBottom: '12px', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                Are you sure you want to permanently delete user account <code>{deleteUserModal.userId}</code>?
              </p>
              <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', padding: '12px', color: '#991b1b', fontSize: '0.85rem' }}>
                ⚠️ This will immediately revoke their access and dissociate all active enrollments.
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnOutline}`}
                onClick={() => setDeleteUserModal({ isOpen: false, userId: '' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnDanger}`}
                style={{ background: '#dc2626', color: '#ffffff' }}
                onClick={confirmDeleteUser}
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Financial Hold Waiver Modal */}
      {waiverModal.isOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalDialog} style={{ maxWidth: '480px' }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Grant Tuition Hold Waiver</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setWaiverModal(prev => ({ ...prev, isOpen: false }))}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleConfirmWaiver}>
              <div className={styles.modalBody}>
                <p style={{ margin: '0 0 16px', fontSize: '0.92rem', color: 'var(--text-main)' }}>
                  Waive the tuition fee hold for scholar{' '}
                  <strong>{waiverModal.studentName}</strong> (<code>{waiverModal.studentId}</code>)?
                </p>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Waiver Reason / Justification</label>
                  <input
                    type="text"
                    required
                    value={waiverModal.reason}
                    onChange={(e) => setWaiverModal(prev => ({ ...prev, reason: e.target.value }))}
                    className={styles.formControl}
                    placeholder="e.g. Dean Academic Merit Scholarship Waiver"
                  />
                </div>
                <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '8px', padding: '12px', color: '#6d28d9', fontSize: '0.85rem' }}>
                  🎓 This will lift financial clearance holds immediately and allow course registration.
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnOutline}`}
                  onClick={() => setWaiverModal(prev => ({ ...prev, isOpen: false }))}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  style={{ background: '#7c3aed', borderColor: '#6d28d9' }}
                >
                  Confirm &amp; Waive Hold
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
