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

  const [isTuitionModalOpen, setIsTuitionModalOpen] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [billingRes, annRes, studentCourseRes, regRes, allCoursesRes, slotsRes] =
          await Promise.allSettled([
            revenueService.getStudentBilling(studentId),
            announcementsService.getAll(),
            coursesService.getForStudent(studentId),
            registrationsService.getAll(),
            coursesService.getAll(),
            slotsService.getAll(),
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
                <span className="badge badge-approved" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                  {activeTerm} Registration Active
                </span>
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
                <div className={styles.sectionHeader}>
                  <h3>Campus Alerts & Announcements</h3>
                </div>
                <div className={styles.announcementList}>
                  {announcements.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                      No active campus announcements at this time.
                    </div>
                  ) : (
                    announcements.slice(0, 5).map((ann) => (
                      <div key={ann.announcementId || ann.id} className={styles.announcementItem}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span className="badge" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                            {ann.courseId || 'Campus Alert'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            {ann.createdAt ? new Date(ann.createdAt).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>
                          {ann.title || 'Department Notice'}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                          {ann.message}
                        </div>
                        {ann.attachmentUrl && (
                          <div style={{ marginTop: '6px' }}>
                            <a
                              href={ann.attachmentUrl.startsWith('http') ? ann.attachmentUrl : `http://localhost:3000${ann.attachmentUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                color: '#2563eb',
                                fontWeight: 600,
                              }}
                            >
                              📎 {ann.attachmentName || 'Download Attachment'}
                            </a>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
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
