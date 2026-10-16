import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';

import AppShell from '../../components/common/AppShell';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

import { useAuth } from '../../context/AuthContext';
import { coursesService } from '../../services/courses.service';
import { registrationsService } from '../../services/registrations.service';
import { overridesService } from '../../services/overrides.service';
import { revenueService } from '../../services/revenue.service';
import { slotsService } from '../../services/slots.service';
import { usersService } from '../../services/users.service';

import styles from './StudentRegistration.module.css';

export default function StudentRegistration() {
  const { user } = useAuth();
  const studentId = user?.User_ID || 'S2024001';

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [allRegistrations, setAllRegistrations] = useState([]);
  const [slots, setSlots] = useState([]);
  const [overrides, setOverrides] = useState([]);
  const [billing, setBilling] = useState(null);
  const [currentSemester, setCurrentSemester] = useState(user?.Current_Semester || 4);
  const [activeTerm, setActiveTerm] = useState('Spring 2026');
  const [maxCredits, setMaxCredits] = useState(20);
  const [facultyMap, setFacultyMap] = useState({});

  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'myCourses' | 'overrides' | 'timetable'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideCourse, setOverrideCourse] = useState(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);

  const [isTuitionModalOpen, setIsTuitionModalOpen] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [catalogRes, studentCoursesRes, regsRes, overridesRes, billingRes, slotsRes, usersRes] =
          await Promise.allSettled([
            coursesService.getAll(),
            coursesService.getForStudent(studentId),
            registrationsService.getAll(),
            overridesService.getByStudent(studentId),
            revenueService.getStudentBilling(studentId),
            slotsService.getAll(),
            usersService.getAll(),
          ]);

        const catalogList = catalogRes.status === 'fulfilled' && Array.isArray(catalogRes.value) ? catalogRes.value : [];
        const studentRaw = studentCoursesRes.status === 'fulfilled' ? studentCoursesRes.value : null;
        const studentCourses = studentRaw?.courses && Array.isArray(studentRaw.courses)
          ? studentRaw.courses.map((item) => ({
              ...item.course,
              courseType: item.courseType || item.course?.courseType,
              sections: item.sections,
              prerequisite: item.course?.prerequisite || null,
              prerequisiteCourseId: item.course?.prerequisiteCourseId || null,
            }))
          : [];

        if (studentRaw?.currentSemester) {
          setCurrentSemester(studentRaw.currentSemester);
        }
        if (studentRaw?.activeTerm) {
          setActiveTerm(studentRaw.activeTerm);
        }
        if (studentRaw?.maxCreditLimit) {
          setMaxCredits(studentRaw.maxCreditLimit);
        }

        if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value)) {
          const fMap = {};
          usersRes.value.forEach((u) => {
            const uId = u.userId || u.User_ID;
            const uName = u.fullName || u.Full_Name;
            if (uId && uName) fMap[uId] = uName;
          });
          setFacultyMap(fMap);
        }

        // Show the courses of that student's semester
        if (studentCourses.length > 0) {
          setCourses(studentCourses);
        } else {
          // If student courses list is empty or API unavailable, filter catalog for semester
          const semCourses = catalogList.filter((c) => c.semester === currentSemester);
          setCourses(semCourses.length > 0 ? semCourses : catalogList.slice(0, 6));
        }

        if (regsRes.status === 'fulfilled' && Array.isArray(regsRes.value)) {
          setAllRegistrations(regsRes.value);
          const userRegs = regsRes.value.filter(
            (r) => r.studentId === studentId || r.Student_ID === studentId
          );
          setRegistrations(userRegs);
        } else {
          setRegistrations([]);
        }

        if (slotsRes.status === 'fulfilled' && Array.isArray(slotsRes.value)) {
          setSlots(slotsRes.value);
        }

        if (overridesRes.status === 'fulfilled' && Array.isArray(overridesRes.value)) {
          setOverrides(overridesRes.value);
        }

        if (billingRes.status === 'fulfilled' && billingRes.value) {
          setBilling(billingRes.value);
        } else {
          setBilling({
            studentId,
            balanceDue: 0,
            paymentStatus: 'Cleared',
            isFinancialHoldActive: false,
          });
        }
      } catch (err) {
        console.error('Error loading registration data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [studentId, currentSemester]);

  // Courses available in current semester catalog
  const catalogCourseIds = useMemo(() => {
    return new Set(courses.map((c) => c.courseId || c.Course_ID).filter(Boolean));
  }, [courses]);

  // Registered courses that are strictly in this semester catalog
  const registeredInCatalogCourseIds = useMemo(() => {
    return new Set(
      registrations
        .filter((r) => r.status === 'Enrolled' || r.status === 'Waitlisted' || r.status === 'Pending_Allocation')
        .map((r) => r.courseId || r.Course_ID)
        .filter((cId) => Boolean(cId) && catalogCourseIds.has(cId))
    );
  }, [registrations, catalogCourseIds]);

  const registeredCourseIds = registeredInCatalogCourseIds;

  async function handleRegister(courseId) {
    if (billing?.isFinancialHoldActive) {
      toast.error('Cannot register: You have an active financial hold! Clear tuition balance first.');
      setIsTuitionModalOpen(true);
      return;
    }

    try {
      const res = await registrationsService.enroll(studentId, courseId);
      toast.success(`Successfully registered for ${courseId}!`);
      setRegistrations((prev) => [...prev, res]);
      setAllRegistrations((prev) => [...prev, res]);
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message || `Failed to enroll in ${courseId}.`;
      toast.error(errMsg);
    }
  }

  function handleOpenOverride(course) {
    setOverrideCourse(course);
    setOverrideReason('');
    setIsOverrideModalOpen(true);
  }

  async function handleSubmitOverride() {
    if (!overrideReason.trim()) {
      toast.error('Please enter a valid justification reason for the override request.');
      return;
    }

    setIsSubmittingOverride(true);
    try {
      const res = await overridesService.create({
        Student_ID: studentId,
        Course_ID: overrideCourse.courseId || overrideCourse.Course_ID,
        Reason: overrideReason,
      });
      toast.success(`Override request for ${overrideCourse.courseId || overrideCourse.Course_ID} submitted to Assistant Dean!`);
      setOverrides((prev) => [...prev, res]);
      setIsOverrideModalOpen(false);
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to submit override request.';
      toast.error(errMsg);
    } finally {
      setIsSubmittingOverride(false);
    }
  }

  async function handlePayTuition() {
    setIsPaying(true);
    try {
      const res = await revenueService.payStudentTuition(studentId, billing?.balanceDue || 2500);
      toast.success(res.message || 'Financial hold cleared! Course registration unlocked.');
      setBilling((prev) => ({
        ...prev,
        amountPaid: res.amountPaid || prev.totalAmountDue || 2500,
        balanceDue: 0,
        paymentStatus: 'Cleared',
        isFinancialHoldActive: false,
        transactionId: res.transactionId,
      }));
      setIsTuitionModalOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Tuition payment failed. Please try again.');
    } finally {
      setIsPaying(false);
    }
  }

  // Calculate enrolled credits strictly from registered courses in this catalog
  const enrolledCredits = courses
    .filter((c) => registeredInCatalogCourseIds.has(c.courseId || c.Course_ID))
    .reduce((sum, c) => sum + (c.credits || 4), 0);

  // Dynamically compute available course categories from active course catalog
  const availableCategories = useMemo(() => {
    const cats = new Set();
    courses.forEach((c) => {
      if (c.courseType) cats.add(c.courseType);
    });
    if (cats.size === 0) {
      return ['All', 'Institute Core', 'Program Core', 'Elective', 'SEED'];
    }
    return ['All', ...Array.from(cats)];
  }, [courses]);

  // Registrations strictly for active semester
  const currentTermRegistrations = useMemo(() => {
    return registrations.filter((r) => {
      const isCurrentTerm = !r.termId || r.termId === activeTerm || r.termId === 'SPRING2026';
      const isEnrolledStatus = r.status === 'Enrolled' || r.status === 'Waitlisted' || r.status === 'Pending_Allocation' || !r.status;
      const isCourseInCatalog = catalogCourseIds.has(r.courseId || r.Course_ID);
      return isCurrentTerm && isEnrolledStatus && isCourseInCatalog;
    });
  }, [registrations, activeTerm, catalogCourseIds]);

  // Set of courses student has passed in past terms
  const passedCourseIds = useMemo(() => {
    return new Set(
      registrations
        .filter((r) => r.finalGrade && r.finalGrade !== 'F')
        .map((r) => r.courseId || r.Course_ID)
    );
  }, [registrations]);

  // Filter courses by selected category and search term
  const filteredCourses = courses.filter((c) => {
    const matchesCategory =
      selectedCategory === 'All' || c.courseType === selectedCategory;

    const matchesSearch =
      (c.courseId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.courseName || '').toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <AppShell>
      <div className={styles.container}>
        <PageHeader
          title="Course Registration & Catalog"
          subtitle={`${activeTerm} Active Enrollment • Semester ${currentSemester} Courses • Select courses, manage registrations, and submit override requests.`}
        />

        {/* Financial Hold Warning Banner */}
        {billing?.isFinancialHoldActive && (
          <div className={styles.holdBanner}>
            <div className={styles.holdBannerText}>
              <span style={{ fontSize: '1.4rem' }}>🚨</span>
              <div>
                <strong>
                  FINANCIAL HOLD ACTIVE ({billing?.balanceDue > 0 ? `$${billing.balanceDue.toLocaleString()} ` : ''}Unpaid Balance)
                </strong>
                <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                  Tuition payment is required before finalizing course registration choices.
                </div>
              </div>
            </div>
            <button
              type="button"
              className="btn-primary"
              style={{ background: '#dc2626' }}
              onClick={() => setIsTuitionModalOpen(true)}
            >
              Pay Tuition & Clear Hold
            </button>
          </div>
        )}

        {/* Academic Status Bar */}
        <div className={styles.statusBar}>
          <div className={styles.statusItems}>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Term / Semester</span>
              <span className={styles.statusVal}>{activeTerm} (Sem {currentSemester})</span>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Enrolled Credits</span>
              <span className={styles.statusVal}>{enrolledCredits} / {maxCredits} Credits</span>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Enrolled Courses</span>
              <span className={styles.statusVal}>{registeredCourseIds.size} Courses</span>
            </div>
          </div>
          <div>
            {billing?.isFinancialHoldActive ? (
              <span className="badge badge-rejected" style={{ fontSize: '0.85rem' }}>
                Financial Hold Active
              </span>
            ) : (
              <span className="badge badge-approved" style={{ fontSize: '0.85rem' }}>
                Financial Hold Cleared
              </span>
            )}
          </div>
        </div>

        {/* Tabs Bar */}
        <div className={styles.tabBar}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'catalog' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('catalog')}
          >
            Semester {currentSemester} Catalog ({courses.length})
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'myCourses' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('myCourses')}
          >
            My Registered Courses ({registeredCourseIds.size})
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'overrides' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('overrides')}
          >
            Override Requests ({overrides.length})
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'timetable' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('timetable')}
          >
            Weekly Timetable Schedule
          </button>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading course catalog & enrollment records..." />
        ) : (
          <>
            {/* TAB 1: CATALOG VIEW */}
            {activeTab === 'catalog' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className={styles.filterControls}>
                  <div className={styles.categoryPills}>
                    {availableCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        className={`${styles.pill} ${selectedCategory === cat ? styles.pillActive : ''}`}
                        onClick={() => setSelectedCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    placeholder="Search by code or course name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>

                <div className={styles.courseGrid}>
                  {filteredCourses.map((c) => {
                    const cId = c.courseId || c.Course_ID;
                    const isEnrolled = registeredCourseIds.has(cId);

                    const courseSlots = slots.filter((s) => s.sectionId?.startsWith(cId));
                    const slotDays = courseSlots.length > 0
                      ? [...new Set(courseSlots.map((s) => s.dayOfWeek.slice(0, 3)))].join(' & ')
                      : 'TBA';
                    const slotTime = courseSlots[0] ? `${courseSlots[0].startTime} - ${courseSlots[0].endTime}` : 'TBA';
                    const slotRoom = courseSlots[0]?.roomNumber ? `Room ${courseSlots[0].roomNumber}` : 'TBA';
                    const facultyId = courseSlots[0]?.facultyId;
                    const facultyText = facultyId ? (facultyMap[facultyId] || `Faculty (${facultyId})`) : 'TBA';

                    const prereqText = c.prerequisite || 'None';
                    const prereqId = c.prerequisiteCourseId;
                    const isPrereqMet = !prereqId || passedCourseIds.has(prereqId);

                    const enrolledInCourseCount = allRegistrations.filter(
                      (r) => (r.courseId === cId || r.Course_ID === cId) && (r.status === 'Enrolled' || r.status === 'Waitlisted')
                    ).length;
                    const capacity = c.courseCapacity || 60;
                    const isFull = enrolledInCourseCount >= capacity;

                    return (
                      <div key={cId} className={styles.courseCard}>
                        <div>
                          <div className={styles.cardTop}>
                            <div>
                              <div className={styles.courseCode}>{cId}</div>
                              <div className={styles.courseTitle}>{c.courseName}</div>
                            </div>
                            <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                              {c.credits || 4} CR
                            </span>
                          </div>

                          <div className={styles.cardBody} style={{ marginTop: '12px' }}>
                            <div className={styles.metaRow}>
                              <strong>Type:</strong> <span>{c.courseType || 'Program Core'}</span>
                            </div>
                            <div className={styles.metaRow}>
                              <strong>Dept:</strong> <span>{c.deptId || 'CSE'}</span>
                            </div>
                            <div className={styles.metaRow}>
                              <strong>Prerequisite:</strong>{' '}
                              {prereqId ? (
                                <span
                                  className={styles.prereqBadge}
                                  style={
                                    isPrereqMet
                                      ? { background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }
                                      : { background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }
                                  }
                                >
                                  {isPrereqMet ? '✓ ' : '⚠️ '}
                                  {prereqText}
                                </span>
                              ) : (
                                <span className={styles.prereqBadge}>None</span>
                              )}
                            </div>
                            <div className={styles.metaRow}>
                              <strong>Seats:</strong>{' '}
                              <span>
                                {enrolledInCourseCount} / {capacity}
                                {isFull && <span className="badge badge-rejected" style={{ marginLeft: '6px', fontSize: '0.72rem' }}>Full</span>}
                              </span>
                            </div>
                            <div className={styles.metaRow}>
                              <strong>Schedule:</strong> <span>{slotDays} ({slotTime}) • {slotRoom}</span>
                            </div>
                            <div className={styles.metaRow}>
                              <strong>Instructor:</strong> <span>{facultyText}</span>
                            </div>
                          </div>
                        </div>

                        <div
                          className={styles.cardFooter}
                          style={isEnrolled ? { justifyContent: 'flex-end' } : {}}
                        >
                          {!isEnrolled && (
                            <button
                              type="button"
                              className="btn-outline"
                              onClick={() => handleOpenOverride(c)}
                              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                            >
                              Request Override
                            </button>
                          )}

                          {isEnrolled ? (
                            <span className="badge badge-approved" style={{ padding: '6px 12px' }}>
                              ✓ Registered
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="btn-primary"
                              onClick={() => handleRegister(cId)}
                              style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                            >
                              Register Now
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: MY REGISTERED COURSES */}
            {activeTab === 'myCourses' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {courses.filter((c) => registeredInCatalogCourseIds.has(c.courseId || c.Course_ID)).length === 0 ? (
                  <div style={{ background: '#ffffff', padding: '32px', textAlign: 'center', borderRadius: '12px', color: '#64748b' }}>
                    No registered courses found for Semester {currentSemester} ({activeTerm}).
                  </div>
                ) : (
                  courses
                    .filter((c) => registeredInCatalogCourseIds.has(c.courseId || c.Course_ID))
                    .map((c) => {
                      const matchReg = registrations.find(
                        (r) => (r.courseId || r.Course_ID) === (c.courseId || c.Course_ID)
                      );
                      return (
                        <div
                          key={c.courseId || c.Course_ID}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            padding: '16px 20px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '12px',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
                              {c.courseId}: {c.courseName}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                              {c.credits || 4} Credits • Section {matchReg?.sectionId || 'S1'} • Term {matchReg?.termId || activeTerm} • Type: {c.courseType || 'Program Core'}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span className="badge badge-approved" style={{ fontSize: '0.85rem' }}>
                              ✓ Enrolled & Confirmed
                            </span>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            )}

            {/* TAB 3: OVERRIDE REQUESTS */}
            {activeTab === 'overrides' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {overrides.length === 0 ? (
                  <div style={{ background: '#ffffff', padding: '32px', textAlign: 'center', borderRadius: '12px', color: '#64748b' }}>
                    No override requests submitted. If you need a prerequisite or capacity override, click "Request Override" on any course card.
                  </div>
                ) : (
                  overrides.map((ov) => {
                    const statusBg =
                      ov.approvalStatus === 'Approved' ? '#ecfdf5' : ov.approvalStatus === 'Rejected' ? '#fef2f2' : '#fffbeb';
                    const statusColor =
                      ov.approvalStatus === 'Approved' ? '#10b981' : ov.approvalStatus === 'Rejected' ? '#ef4444' : '#b45309';

                    return (
                      <div
                        key={ov.requestId || ov.id}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '16px 20px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '12px',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>
                            {ov.courseId} Override Request #{ov.requestId || ov.id}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                            Reason: {ov.reason}
                          </div>
                        </div>
                        <span
                          className="badge"
                          style={{ background: statusBg, color: statusColor, fontSize: '0.85rem', padding: '6px 14px' }}
                        >
                          {ov.approvalStatus || 'Pending Approval'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 4: WEEKLY TIMETABLE */}
            {activeTab === 'timetable' && (
              <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                    {activeTerm} Weekly Slot Schedule Grid
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Showing schedule for {currentTermRegistrations.length} enrolled course(s)
                  </span>
                </div>

                {currentTermRegistrations.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                    <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>🗓</div>
                    <strong style={{ display: 'block', marginBottom: '4px', color: '#1e293b' }}>No enrolled classes to display for {activeTerm}</strong>
                    <span>Select and register for courses from the Catalog tab to generate your personal weekly schedule.</span>
                  </div>
                ) : (
                  <div className={styles.timetableGrid}>
                    <div className={styles.ttHeader}>Time</div>
                    <div className={styles.ttHeader}>Monday</div>
                    <div className={styles.ttHeader}>Tuesday</div>
                    <div className={styles.ttHeader}>Wednesday</div>
                    <div className={styles.ttHeader}>Thursday</div>
                    <div className={styles.ttHeader}>Friday</div>

                    {[
                      { label: '08:45 AM', matchStart: '08:45' },
                      { label: '10:00 AM', matchStart: '10:00' },
                      { label: '11:00 AM', matchStart: '11:00' },
                      { label: '02:15 PM', matchStart: '14:15' },
                      { label: '03:30 PM', matchStart: '15:30' },
                    ].map(({ label, matchStart }) => (
                      <div key={label} style={{ display: 'contents' }}>
                        <div className={styles.ttCell} style={{ fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {label}
                        </div>
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => {
                          const activeSlotsForCell = slots.filter((s) => {
                            if (s.dayOfWeek !== day) return false;
                            if (!s.startTime.startsWith(matchStart.slice(0, 2))) return false;
                            const coursePrefix = s.sectionId?.split('-')[0];
                            const studentReg = currentTermRegistrations.find((r) => {
                              const cId = r.courseId || r.Course_ID;
                              if (r.sectionId) {
                                return r.sectionId === s.sectionId;
                              }
                              return cId === coursePrefix && s.sectionId === `${cId}-S1`;
                            });
                            return !!studentReg;
                          });

                          return (
                            <div key={day} className={styles.ttCell}>
                              {activeSlotsForCell.map((slot) => {
                                const cId = slot.sectionId?.split('-')[0];
                                return (
                                  <div key={slot.slotId} className={styles.ttBlock}>
                                    <div>{cId}</div>
                                    <div style={{ fontSize: '0.72rem', opacity: 0.85 }}>({slot.roomNumber || 'Room'})</div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Override Request Modal */}
        {isOverrideModalOpen && overrideCourse && (
          <div className={styles.modalOverlay} onClick={() => setIsOverrideModalOpen(false)}>
            <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                  Submit Override Request: {overrideCourse.courseId}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsOverrideModalOpen(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b' }}
                >
                  &times;
                </button>
              </div>

              <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                Course: <strong>{overrideCourse.courseName}</strong> ({overrideCourse.credits} Credits)
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                  Justification / Reason for Assistant Dean Review:
                </label>
                <textarea
                  rows={4}
                  placeholder="Explain why an override is required (e.g., prerequisite waived by professor, credit overload approval, or degree requirement conflict)..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setIsOverrideModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSubmitOverride}
                  disabled={isSubmittingOverride}
                >
                  {isSubmittingOverride ? 'Submitting...' : 'Submit Override Request'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tuition Payment Modal */}
        {isTuitionModalOpen && (
          <div className={styles.modalOverlay} onClick={() => setIsTuitionModalOpen(false)}>
            <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                  Clear Financial Hold & Tuition
                </h3>
                <button
                  type="button"
                  onClick={() => setIsTuitionModalOpen(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b' }}
                >
                  &times;
                </button>
              </div>

              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', color: '#991b1b', fontSize: '0.85rem' }}>
                <strong>Attention:</strong> Payment of ${(billing?.balanceDue || 2500).toLocaleString()} semester tuition will immediately clear your financial hold and enable course registration.
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Tuition Amount Due</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                    ${(billing?.balanceDue || 2500).toLocaleString()}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handlePayTuition}
                  disabled={isPaying}
                  style={{ background: '#0284c7' }}
                >
                  {isPaying ? 'Processing...' : `Pay $${(billing?.balanceDue || 2500).toLocaleString()} & Clear Hold`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
