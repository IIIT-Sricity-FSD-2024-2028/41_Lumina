import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

import AppShell from '../../components/common/AppShell';
import PageHeader from '../../components/common/PageHeader';
import UserAvatar from '../../components/ui/UserAvatar';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

import { useAuth } from '../../context/AuthContext';
import { revenueService } from '../../services/revenue.service';
import { announcementsService } from '../../services/announcements.service';
import { coursesService } from '../../services/courses.service';
import { registrationsService } from '../../services/registrations.service';
import { slotsService } from '../../services/slots.service';
import { policiesService } from '../../services/policies.service';

function computeTermLabel(academicYear, term) {
  if (!academicYear || !term) return 'Spring 2026';
  const parts = academicYear.split('-');
  if (parts.length !== 2) return `${term} ${academicYear}`;
  const startYear = parts[0].trim();
  const endYear = parts[1].trim();
  if (term === 'Spring' || term === 'Summer') return `${term} ${endYear}`;
  if (term === 'Monsoon' || term === 'Fall') return `${term} ${startYear}`;
  return `${term} ${endYear}`;
}

import styles from './StudentDashboard.module.css';

const GRADE_POINTS = {
  'A+': 10, 'A': 10, 'A-': 9,
  'B+': 8, 'B': 8, 'B-': 7,
  'C+': 6, 'C': 6, 'C-': 5,
  'D': 4, 'F': 0,
};

export default function StudentDashboard() {
  const { user } = useAuth();

  const studentId = user?.User_ID || 'S2024001';
  const studentName = user?.Full_Name || 'Student';
  const department = user?.Dept_ID || 'Computer Science & Engineering';

  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [courses, setCourses] = useState([]);
  const [allCatalog, setAllCatalog] = useState([]);
  const [allUserRegistrations, setAllUserRegistrations] = useState([]);
  const [slots, setSlots] = useState([]);
  const [currentSemester, setCurrentSemester] = useState(user?.Current_Semester || 4);
  const [activeTerm, setActiveTerm] = useState('Spring 2026');
  const [maxCredits, setMaxCredits] = useState(20);
  const [policies, setPolicies] = useState(null);

  const [isTuitionModalOpen, setIsTuitionModalOpen] = useState(false);
  const [isAnnouncementsModalOpen, setIsAnnouncementsModalOpen] = useState(false);
  const [announcementSearch, setAnnouncementSearch] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [billingRes, annRes, studentCourseRes, regRes, allCoursesRes, slotsRes, policiesRes] =
          await Promise.allSettled([
            revenueService.getStudentBilling(studentId),
            announcementsService.getAll(),
            coursesService.getForStudent(studentId),
            registrationsService.getAll(),
            coursesService.getAll(),
            slotsService.getAll(),
            policiesService.getPolicies(),
          ]);

        if (billingRes.status === 'fulfilled' && billingRes.value) {
          setBilling(billingRes.value);
        } else {
          setBilling({
            studentId,
            studentName,
            flatSemesterTuition: 2500,
            totalAmountDue: 2500,
            amountPaid: 0,
            balanceDue: 2500,
            paymentStatus: 'Pending',
            isFinancialHoldActive: true,
          });
        }

        if (annRes.status === 'fulfilled' && Array.isArray(annRes.value)) {
          setAnnouncements(annRes.value);
        }

        if (allCoursesRes.status === 'fulfilled' && Array.isArray(allCoursesRes.value)) {
          setAllCatalog(allCoursesRes.value);
        }

        if (slotsRes.status === 'fulfilled' && Array.isArray(slotsRes.value)) {
          setSlots(slotsRes.value);
        }

        if (policiesRes.status === 'fulfilled' && policiesRes.value?.settings) {
          const pol = policiesRes.value.settings;
          setPolicies(pol);
          if (pol.academicYear && pol.term) {
            setActiveTerm(computeTermLabel(pol.academicYear, pol.term));
          }
          if (pol.maxCredits) {
            setMaxCredits(pol.maxCredits);
          }
        }


        if (studentCourseRes.status === 'fulfilled' && studentCourseRes.value) {
          const raw = studentCourseRes.value;
          if (raw.currentSemester) setCurrentSemester(raw.currentSemester);
          if (raw.activeTerm) setActiveTerm(raw.activeTerm);
          if (raw.maxCreditLimit) setMaxCredits(raw.maxCreditLimit);

          if (raw.courses && Array.isArray(raw.courses)) {
            setCourses(
              raw.courses.map((item) => ({
                ...item.course,
                courseType: item.courseType || item.course?.courseType || 'Program Core',
                sections: item.sections,
              }))
            );
          } else if (Array.isArray(raw)) {
            setCourses(raw);
          }
        }

        if (regRes.status === 'fulfilled' && Array.isArray(regRes.value)) {
          const userRegs = regRes.value.filter(
            (r) => r.studentId === studentId || r.Student_ID === studentId
          );
          setAllUserRegistrations(userRegs);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [studentId, studentName]);

  async function handlePayTuition() {
    if (!billing || billing.balanceDue === 0) return;
    setIsPaying(true);
    try {
      const res = await revenueService.payStudentTuition(studentId, billing.balanceDue);
      toast.success(res.message || 'Tuition payment cleared successfully!');
      setBilling((prev) => ({
        ...prev,
        amountPaid: res.amountPaid ?? prev.totalAmountDue ?? 2500,
        balanceDue: 0,
        paymentStatus: 'Cleared',
        isFinancialHoldActive: false,
        transactionId: res.transactionId,
        paymentDate: res.timestamp,
      }));
      setIsTuitionModalOpen(false);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || 'Tuition payment could not be processed. Please check your network and try again.'
      );
    } finally {
      setIsPaying(false);
    }
  }

  // Active registered courses for the current semester catalog
  const activeRegisteredCourses = useMemo(() => {
    const enrolledRegs = allUserRegistrations.filter(
      (r) => r.status === 'Enrolled' || r.status === 'Waitlisted' || r.status === 'Pending_Allocation'
    );
    return courses.filter((c) => {
      const cId = c.courseId || c.Course_ID;
      return enrolledRegs.some((r) => (r.courseId || r.Course_ID) === cId);
    });
  }, [courses, allUserRegistrations]);

  // Dynamic registered credits
  const enrolledCredits = useMemo(() => {
    if (activeRegisteredCourses.length === 0) return 0;
    return activeRegisteredCourses.reduce((sum, c) => sum + (c.credits || 4), 0);
  }, [activeRegisteredCourses]);

  const enrolledCount = activeRegisteredCourses.length;

  const coreCount = activeRegisteredCourses.filter(
    (c) => !c.courseType?.includes('Elective') && c.courseType !== 'SEED'
  ).length;

  const electiveCount = activeRegisteredCourses.filter(
    (c) => c.courseType?.includes('Elective') || c.courseType === 'SEED'
  ).length;

  const isCleared =
    billing?.balanceDue === 0 ||
    billing?.paymentStatus === 'Cleared' ||
    billing?.paymentStatus === 'Waived';

  // Dynamic Cumulative GPA calculated from student's historical graded registrations
  const cumulativeGPA = useMemo(() => {
    const gradedRegs = allUserRegistrations.filter(
      (r) => r.finalGrade && GRADE_POINTS[r.finalGrade] !== undefined
    );
    if (gradedRegs.length === 0) return null;

    let totalPoints = 0;
    let totalGradedCredits = 0;

    gradedRegs.forEach((r) => {
      const c = allCatalog.find((cat) => cat.courseId === r.courseId) || {};
      const credits = c.credits || 4;
      totalPoints += GRADE_POINTS[r.finalGrade] * credits;
      totalGradedCredits += credits;
    });

    if (totalGradedCredits === 0) return null;
    return (totalPoints / totalGradedCredits).toFixed(2);
  }, [allUserRegistrations, allCatalog]);

  // Primary active assigned section
  const primarySection = useMemo(() => {
    const assignedReg = allUserRegistrations.find(
      (r) =>
        (r.status === 'Enrolled' || r.status === 'Waitlisted') &&
        r.sectionId &&
        courses.some((c) => (c.courseId || c.Course_ID) === r.courseId)
    );
    return assignedReg ? assignedReg.sectionId : 'Section Pending Allocation';
  }, [allUserRegistrations, courses]);

  // Upcoming scheduled class derived from active sections & slots
  const upcomingClass = useMemo(() => {
    if (activeRegisteredCourses.length === 0) return null;

    const registeredCourseIds = new Set(
      activeRegisteredCourses.map((c) => c.courseId || c.Course_ID)
    );

    // Look for slots matching the student's assigned sections
    const matchingSlots = slots.filter((s) => {
      const reg = allUserRegistrations.find((r) => r.sectionId === s.sectionId);
      if (reg) return true;
      const prefix = s.sectionId?.split('-')[0];
      return prefix && registeredCourseIds.has(prefix);
    });

    if (matchingSlots.length > 0) {
      const slot = matchingSlots[0];
      const courseId = slot.sectionId?.split('-')[0];
      const course =
        allCatalog.find((c) => c.courseId === courseId) ||
        courses.find((c) => (c.courseId || c.Course_ID) === courseId) ||
        activeRegisteredCourses[0];

      return {
        courseId: course?.courseId || courseId,
        courseName: course?.courseName || 'Class Lecture',
        day: slot.dayOfWeek,
        time: `${slot.startTime} - ${slot.endTime}`,
        room: `Room ${slot.roomNumber}`,
        sectionId: slot.sectionId,
      };
    }

    const first = activeRegisteredCourses[0];
    return {
      courseId: first.courseId || first.Course_ID,
      courseName: first.courseName,
      day: 'Schedule TBA',
      time: 'TBA',
      room: 'TBA',
      sectionId: primarySection,
    };
  }, [activeRegisteredCourses, slots, allUserRegistrations, allCatalog, courses, primarySection]);

  const windowStatusInfo = useMemo(() => {
    if (!policies) {
      return {
        isOpen: true,
        badgeClass: 'badge-approved',
        badgeText: `${activeTerm} Registration Active`,
        datesStr: null,
      };
    }
    if (policies.systemStatus === 'Deactivated') {
      return {
        isOpen: false,
        badgeClass: 'badge-rejected',
        badgeText: 'System Inactive',
        datesStr: null,
      };
    }
    if (policies.windowStatus === 'Closed') {
      return {
        isOpen: false,
        badgeClass: 'badge-rejected',
        badgeText: 'Window Closed',
        datesStr: null,
      };
    }
    if (policies.windowStatus === 'Paused') {
      return {
        isOpen: false,
        badgeClass: 'badge-pending',
        badgeText: 'Window Paused',
        datesStr: null,
      };
    }

    const now = new Date();
    const startDate = policies.startDate ? new Date(policies.startDate) : null;
    const endDate = policies.endDate ? new Date(policies.endDate) : null;

    if (startDate && !isNaN(startDate.getTime()) && now < startDate) {
      const startStr = startDate.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      return {
        isOpen: false,
        badgeClass: 'badge-pending',
        badgeText: `Opens ${startStr}`,
        datesStr: startDate.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
      };
    }

    if (endDate && !isNaN(endDate.getTime()) && now > endDate) {
      return {
        isOpen: false,
        badgeClass: 'badge-rejected',
        badgeText: 'Window Closed',
        datesStr: `Closed ${endDate.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}`,
      };
    }

    const datesStr =
      startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())
        ? `${startDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${endDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}`
        : null;

    return {
      isOpen: true,
      badgeClass: 'badge-approved',
      badgeText: `${activeTerm} Registration Active`,
      datesStr,
    };
  }, [policies, activeTerm]);

  const sortedAnnouncements = useMemo(() => {
    return [...announcements].sort((a, b) => {
      const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tB - tA;
    });
  }, [announcements]);

  const filteredModalAnnouncements = useMemo(() => {
    if (!announcementSearch.trim()) return sortedAnnouncements;
    const q = announcementSearch.toLowerCase();
    return sortedAnnouncements.filter((a) =>
      (a.title && a.title.toLowerCase().includes(q)) ||
      (a.message && a.message.toLowerCase().includes(q)) ||
      (a.courseId && a.courseId.toLowerCase().includes(q))
    );
  }, [sortedAnnouncements, announcementSearch]);

  const getAttachmentUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
    return `${base.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
  };

  const handleDownloadAttachment = async (e, ann) => {
    e.stopPropagation();
    if (!ann.attachmentUrl) return;
    const fullUrl = getAttachmentUrl(ann.attachmentUrl);
    try {
      const res = await fetch(fullUrl);
      if (!res.ok) throw new Error('File download failed');
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = ann.attachmentName || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(fullUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleViewAttachment = (e, ann) => {
    e.stopPropagation();
    if (!ann.attachmentUrl) return;
    const fullUrl = getAttachmentUrl(ann.attachmentUrl);
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  const yearNumber = Math.ceil(currentSemester / 2);

  return (
    <AppShell>
      <div className={styles.container}>
        <PageHeader
          title={`Welcome back, ${studentName.split(' ')[0]}!`}
          subtitle={`${activeTerm} Academic Term • Student Dashboard & Quick Actions`}
          actions={
            <Link to="/student/registration" className="btn-primary">
              Browse Course Catalog &rarr;
            </Link>
          }
        />

        {loading ? (
          <LoadingSpinner message="Loading student dashboard..." />
        ) : (
          <>
            {/* Student Meta Summary */}
            <div className={styles.profileCard}>
              <div className={styles.studentDetails}>
                <UserAvatar name={studentName} size="lg" />
                <div className={styles.studentMeta}>
                  <h2>{studentName}</h2>
                  <div className={styles.metaTags}>
                    <span className={styles.metaTag}>ID: {studentId}</span>
                    <span className={styles.metaTag}>UG Year {yearNumber}</span>
                    <span className={styles.metaTag}>Semester {currentSemester}</span>
                    <span className={styles.metaTag}>{department}</span>
                    <span className={styles.metaTag}>{primarySection}</span>
                  </div>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span className={`badge ${windowStatusInfo.badgeClass}`} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                    {windowStatusInfo.badgeText}
                  </span>
                  {windowStatusInfo.datesStr && (
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                      Window: {windowStatusInfo.datesStr}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Registered Credits</span>
                <span className={styles.statValue}>{enrolledCredits} / {maxCredits}</span>
                <span className={styles.statSub}>Active Term Cap: {maxCredits} Credits</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Enrolled Courses</span>
                <span className={styles.statValue}>{enrolledCount}</span>
                <span className={styles.statSub}>{coreCount} Core, {electiveCount} Elective</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Financial Status</span>
                <span
                  className={styles.statValue}
                  style={{ color: isCleared ? '#15803d' : '#b45309' }}
                >
                  {isCleared ? 'CLEARED' : `$${billing?.balanceDue?.toLocaleString() || '2,500'}`}
                </span>
                <span className={styles.statSub}>
                  {isCleared ? 'Tuition Hold Cleared' : 'Payment Due Before Term'}
                </span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Cumulative GPA</span>
                <span className={styles.statValue} style={{ color: '#0284c7' }}>
                  {cumulativeGPA ? `${cumulativeGPA} / 10` : 'N/A'}
                </span>
                <span className={styles.statSub}>
                  {cumulativeGPA ? 'Calculated from Past Graded Terms' : 'No Graded Courses Yet'}
                </span>
              </div>
            </div>

            {/* Main Content Layout */}
            <div className={styles.mainGrid}>
              {/* Left Column: Courses & Next Class */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Tuition Fee Clearance Banner Card */}
                <div className={styles.tuitionCard}>
                  <div className={styles.tuitionInfo}>
                    <span className={styles.tuitionTitle}>Tuition & Campus Fee Status</span>
                    <span className={styles.tuitionAmount}>
                      {isCleared ? '$0 Outstanding Balance' : `$${billing?.balanceDue?.toLocaleString() || '2,500'} Due`}
                    </span>
                    <span className={styles.statSub}>
                      {enrolledCredits} Credits Enrolled • {activeTerm} Semester
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {isCleared ? (
                      <span className={styles.tuitionStatusCleared}>
                        ✓ TUITION CLEARED
                      </span>
                    ) : (
                      <span className={styles.tuitionStatusPending}>
                        ⚠ PAYMENT DUE
                      </span>
                    )}
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => setIsTuitionModalOpen(true)}
                    >
                      {isCleared ? 'View Receipt / Breakdown' : 'Pay Tuition & Clear Hold'}
                    </button>
                  </div>
                </div>

                {/* Next Upcoming Class Card */}
                <div className={styles.sectionBox}>
                  <div className={styles.sectionHeader}>
                    <h3>Next Upcoming Class</h3>
                    <span className="badge" style={{ background: '#ede9fe', color: '#6d28d9' }}>
                      Schedule Overview
                    </span>
                  </div>
                  <div className={styles.nextClassCard}>
                    {upcomingClass ? (
                      <>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#4c1d95' }}>
                          {upcomingClass.courseId}: {upcomingClass.courseName}
                        </div>
                        <div style={{ fontSize: '0.88rem', color: '#5b21b6', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                          <span>📅 {upcomingClass.day}</span>
                          <span>⏰ {upcomingClass.time}</span>
                          <span>📍 {upcomingClass.room}</span>
                          {upcomingClass.sectionId && <span>🏷 Section {upcomingClass.sectionId}</span>}
                        </div>
                      </>
                    ) : (
                      <div style={{ color: '#6b21a8', fontSize: '0.9rem' }}>
                        No enrolled classes scheduled yet. Visit the Registration portal to select courses.
                      </div>
                    )}
                  </div>
                </div>

                {/* Registered Courses Quick View */}
                <div className={styles.sectionBox}>
                  <div className={styles.sectionHeader}>
                    <h3>Enrolled Courses</h3>
                    <Link to="/student/registration" style={{ color: '#0284c7', fontWeight: 600, fontSize: '0.88rem' }}>
                      Manage Registration &rarr;
                    </Link>
                  </div>
                  <div className={styles.courseList}>
                    {activeRegisteredCourses.length > 0 ? (
                      activeRegisteredCourses.map((c) => {
                        const matchingReg = allUserRegistrations.find(
                          (r) => (r.courseId || r.Course_ID) === (c.courseId || c.Course_ID)
                        );
                        return (
                          <div key={c.courseId || c.Course_ID} className={styles.courseItem}>
                            <div>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>
                                {c.courseId || c.Course_ID}: {c.courseName}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                {c.credits || 4} Credits • Section {matchingReg?.sectionId || 'S1'} • {c.courseType || 'Program Core'}
                              </div>
                            </div>
                            <span className="badge badge-approved">Enrolled</span>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                        No courses registered for this semester yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Department Announcements */}
              <div className={styles.sectionBox}>
                <div className={styles.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0 }}>Campus Alerts & Announcements</h3>
                  <button
                    type="button"
                    onClick={() => setIsAnnouncementsModalOpen(true)}
                    className="btn-outline"
                    style={{
                      fontSize: '0.75rem',
                      padding: '4px 10px',
                      fontWeight: 600,
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    View All ({sortedAnnouncements.length}) &rarr;
                  </button>
                </div>
                <div className={styles.announcementList}>
                  {sortedAnnouncements.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                      No active campus announcements at this time.
                    </div>
                  ) : (
                    sortedAnnouncements.slice(0, 5).map((ann) => (
                      <div
                        key={ann.announcementId || ann.id}
                        className={styles.announcementItem}
                        style={{ cursor: 'pointer', transition: 'background 0.15s ease', padding: '10px 8px', borderRadius: '6px' }}
                        onClick={() => setIsAnnouncementsModalOpen(true)}
                        title="Click to view all announcements & details"
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span className="badge" style={{ background: '#e0e7ff', color: '#4338ca', fontWeight: 600 }}>
                            {ann.courseId || 'Campus Alert'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            {ann.createdAt ? new Date(ann.createdAt).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>
                          {ann.title || 'Department Notice'}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px', lineHeight: 1.4 }}>
                          {ann.message}
                        </div>
                        {ann.attachmentUrl && (
                          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => handleViewAttachment(e, ann)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '0.74rem',
                                color: '#1d4ed8',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                              title="Open PDF in new tab"
                            >
                              📄 {ann.attachmentName || 'View PDF'}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDownloadAttachment(e, ann)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#f8fafc',
                                border: '1px solid #cbd5e1',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                color: '#475569',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                              title="Download PDF"
                            >
                              ⬇ Download
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}

                  {sortedAnnouncements.length > 5 && (
                    <div style={{ marginTop: '8px', textAlign: 'center', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                      <button
                        type="button"
                        onClick={() => setIsAnnouncementsModalOpen(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2563eb',
                          fontWeight: 600,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        View all {sortedAnnouncements.length} announcements & attachments &rarr;
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}


        {/* Full Announcements & PDF Attachments Modal */}
        {isAnnouncementsModalOpen && (
          <div className={styles.modalOverlay} onClick={() => setIsAnnouncementsModalOpen(false)}>
            <div
              className={styles.modalBox}
              style={{ maxWidth: '720px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.25rem' }}>📢</span>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>Campus Alerts & Announcements</h3>
                    <span className="badge badge-approved" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                      {sortedAnnouncements.length} Total
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                    Official notices, course circulars, and reference materials from faculty
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAnnouncementsModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '1.4rem',
                    lineHeight: 1,
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                  aria-label="Close modal"
                >
                  &times;
                </button>
              </div>

              {/* Search Filter */}
              <div style={{ padding: '6px 0 2px 0' }}>
                <input
                  type="text"
                  placeholder="Search announcements by course, title, or keywords..."
                  value={announcementSearch}
                  onChange={(e) => setAnnouncementSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Scrollable Announcements List */}
              <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '4px' }}>
                {filteredModalAnnouncements.length === 0 ? (
                  <div style={{ padding: '36px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                    No announcements found matching "{announcementSearch}".
                  </div>
                ) : (
                  filteredModalAnnouncements.map((ann) => (
                    <div
                      key={ann.announcementId || ann.id}
                      style={{
                        padding: '16px',
                        borderRadius: '8px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="badge" style={{ background: '#e0e7ff', color: '#4338ca', fontWeight: 600 }}>
                          {ann.courseId || 'Campus Alert'}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {ann.createdAt ? new Date(ann.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Recent'}
                        </span>
                      </div>

                      <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#0f172a' }}>
                        {ann.title || 'Department Notice'}
                      </div>

                      <div style={{ fontSize: '0.88rem', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                        {ann.message}
                      </div>

                      {/* Attachment Card */}
                      {ann.attachmentUrl && (
                        <div
                          style={{
                            marginTop: '6px',
                            padding: '10px 14px',
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '10px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.4rem' }}>📄</span>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.86rem', color: '#1e293b' }}>
                                {ann.attachmentName || 'Attached Document'}
                              </div>
                              {ann.fileSize && (
                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                  {(ann.fileSize / 1024).toFixed(1)} KB &bull; Document
                                </div>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={(e) => handleViewAttachment(e, ann)}
                              className="btn-outline"
                              style={{
                                fontSize: '0.78rem',
                                padding: '5px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              👁️ Open PDF
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDownloadAttachment(e, ann)}
                              className="btn-primary"
                              style={{
                                fontSize: '0.78rem',
                                padding: '5px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              ⬇ Download
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Modal Footer */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Showing {filteredModalAnnouncements.length} of {sortedAnnouncements.length} announcements
                </span>
                <button
                  type="button"
                  onClick={() => setIsAnnouncementsModalOpen(false)}
                  className="btn-secondary"
                  style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tuition Breakdown Modal */}
        {isTuitionModalOpen && (
          <div className={styles.modalOverlay} onClick={() => setIsTuitionModalOpen(false)}>
            <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                  {activeTerm} Semester Tuition Ledger
                </h3>
                <button
                  type="button"
                  onClick={() => setIsTuitionModalOpen(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b' }}
                >
                  &times;
                </button>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontWeight: 600, color: '#475569' }}>
                  <span>Flat Semester Tuition (Institutional B2C)</span>
                  <span>${(billing?.flatSemesterTuition || 2500).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontWeight: 600, color: '#475569' }}>
                  <span>Amount Paid to Date</span>
                  <span style={{ color: '#16a34a' }}>${(billing?.amountPaid || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#475569' }}>
                  <span>Payment Status</span>
                  <span style={{ color: isCleared ? '#15803d' : '#b45309', fontWeight: 700 }}>
                    {billing?.paymentStatus || (isCleared ? 'Cleared' : 'Pending')}
                  </span>
                </div>
                {billing?.transactionId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.78rem', color: '#64748b' }}>
                    <span>Ref Transaction ID</span>
                    <span style={{ fontFamily: 'monospace' }}>{billing.transactionId}</span>
                  </div>
                )}
              </div>

              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
                Itemized Enrolled Courses ({enrolledCount} Courses • {enrolledCredits} Credits):
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                {activeRegisteredCourses.length > 0 ? (
                  activeRegisteredCourses.map((c) => (
                    <div key={c.courseId || c.Course_ID} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.88rem' }}>
                      <div>
                        <strong>{c.courseId || c.Course_ID}</strong>: {c.courseName}
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{c.credits || 4} Credits • {c.courseType || 'Program Core'}</div>
                      </div>
                      <span className="badge badge-approved" style={{ fontSize: '0.75rem' }}>Covered</span>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    No courses enrolled for this term.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #e2e8f0', paddingTop: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Outstanding Balance Due</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: isCleared ? '#15803d' : '#0f172a' }}>
                    {isCleared ? '$0 (Cleared)' : `$${(billing?.balanceDue || 2500).toLocaleString()}`}
                  </div>
                </div>
                {isCleared ? (
                  <button type="button" className="btn-primary" style={{ background: '#15803d' }} disabled>
                    ✓ Tuition Cleared
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handlePayTuition}
                    disabled={isPaying}
                    style={{ background: '#0284c7' }}
                  >
                    {isPaying ? 'Processing...' : `Pay $${(billing?.balanceDue || 2500).toLocaleString()}`}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
