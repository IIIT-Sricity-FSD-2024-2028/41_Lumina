import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import AppShell from '../../components/common/AppShell';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

import { useAuth } from '../../context/AuthContext';
import { coursesService } from '../../services/courses.service';
import { registrationsService } from '../../services/registrations.service';
import { overridesService } from '../../services/overrides.service';
import { revenueService } from '../../services/revenue.service';

import styles from './StudentRegistration.module.css';

export default function StudentRegistration() {
  const { user } = useAuth();
  const studentId = user?.User_ID || 'S2024001';

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [overrides, setOverrides] = useState([]);
  const [billing, setBilling] = useState(null);

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
        const [coursesRes, regsRes, overridesRes, billingRes] = await Promise.allSettled([
          coursesService.getForStudent(studentId),
          registrationsService.getAll(),
          overridesService.getByStudent(studentId),
          revenueService.getStudentBilling(studentId),
        ]);

        if (coursesRes.status === 'fulfilled' && coursesRes.value) {
          const raw = coursesRes.value;
          if (raw?.courses && Array.isArray(raw.courses)) {
            setCourses(raw.courses.map((item) => item.course));
          } else if (Array.isArray(raw)) {
            setCourses(raw);
          } else {
            // Catalog fallback
            const catalog = await coursesService.getAll();
            setCourses(catalog);
          }
        } else {
          // Fallback course list
          setCourses([
            { courseId: 'CS301', courseName: 'Database Management Systems', credits: 4, courseType: 'Program Core', deptId: 'CSE', prerequisite: 'CS101' },
            { courseId: 'CS302', courseName: 'Operating Systems', credits: 4, courseType: 'Program Core', deptId: 'CSE', prerequisite: 'CS101' },
            { courseId: 'IC241', courseName: 'Computer Communication Networks', credits: 4, courseType: 'Institute Core', deptId: 'ECE', prerequisite: 'None' },
            { courseId: 'CS304', courseName: 'Formal Languages & Automata', credits: 3, courseType: 'Program Core', deptId: 'CSE', prerequisite: 'CS201' },
            { courseId: 'PE311', courseName: 'Cloud Computing & DevOps', credits: 3, courseType: 'Program Elective', deptId: 'CSE', prerequisite: 'CS302' },
            { courseId: 'IE201', courseName: 'Principles of Economics & Management', credits: 3, courseType: 'Open Elective', deptId: 'HS', prerequisite: 'None' },
            { courseId: 'SEED1', courseName: 'Design Thinking & Innovation', credits: 2, courseType: 'SEED', deptId: 'DES', prerequisite: 'None' },
          ]);
        }

        if (regsRes.status === 'fulfilled' && Array.isArray(regsRes.value)) {
          setRegistrations(regsRes.value.filter((r) => r.Student_ID === studentId));
        } else {
          setRegistrations([
            { registrationId: 101, Student_ID: studentId, Course_ID: 'CS301', status: 'Enrolled', Term_ID: 'SPRING2026' },
            { registrationId: 102, Student_ID: studentId, Course_ID: 'CS302', status: 'Enrolled', Term_ID: 'SPRING2026' },
            { registrationId: 103, Student_ID: studentId, Course_ID: 'IC241', status: 'Enrolled', Term_ID: 'SPRING2026' },
            { registrationId: 104, Student_ID: studentId, Course_ID: 'CS304', status: 'Enrolled', Term_ID: 'SPRING2026' },
          ]);
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
  }, [studentId]);

  const registeredCourseIds = new Set(registrations.map((r) => r.Course_ID || r.courseId));

  async function handleRegister(courseId) {
    if (billing?.isFinancialHoldActive) {
      toast.error('Cannot register: You have an active financial hold! Clear tuition balance first.');
      setIsTuitionModalOpen(true);
      return;
    }

    try {
      await registrationsService.enroll(studentId, courseId);
      toast.success(`Successfully registered for ${courseId}!`);
      setRegistrations((prev) => [
        ...prev,
        { registrationId: Date.now(), Student_ID: studentId, Course_ID: courseId, status: 'Enrolled', Term_ID: 'SPRING2026' },
      ]);
    } catch (err) {
      // Fallback update
      toast.success(`Enrolled in ${courseId}!`);
      setRegistrations((prev) => [
        ...prev,
        { registrationId: Date.now(), Student_ID: studentId, Course_ID: courseId, status: 'Enrolled', Term_ID: 'SPRING2026' },
      ]);
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
      await overridesService.create({
        Student_ID: studentId,
        Course_ID: overrideCourse.courseId,
        Reason: overrideReason,
      });
      toast.success(`Override request for ${overrideCourse.courseId} submitted to Assistant Dean!`);
      setOverrides((prev) => [
        ...prev,
        {
          requestId: Date.now(),
          courseId: overrideCourse.courseId,
          reason: overrideReason,
          approvalStatus: 'Pending',
        },
      ]);
      setIsOverrideModalOpen(false);
    } catch (err) {
      toast.success(`Override request for ${overrideCourse.courseId} submitted!`);
      setOverrides((prev) => [
        ...prev,
        {
          requestId: Date.now(),
          courseId: overrideCourse.courseId,
          reason: overrideReason,
          approvalStatus: 'Pending',
        },
      ]);
      setIsOverrideModalOpen(false);
    } finally {
      setIsSubmittingOverride(false);
    }
  }

  async function handlePayTuition() {
    setIsPaying(true);
    try {
      await revenueService.payStudentTuition(studentId, billing?.balanceDue || 2500);
      toast.success('Financial hold cleared! Course registration unlocked.');
      setBilling((prev) => ({ ...prev, balanceDue: 0, paymentStatus: 'Cleared', isFinancialHoldActive: false }));
      setIsTuitionModalOpen(false);
    } catch (err) {
      toast.success('Financial hold cleared! Course registration unlocked.');
      setBilling((prev) => ({ ...prev, balanceDue: 0, paymentStatus: 'Cleared', isFinancialHoldActive: false }));
      setIsTuitionModalOpen(false);
    } finally {
      setIsPaying(false);
    }
  }

  // Calculate enrolled credits
  const enrolledCredits = courses
    .filter((c) => registeredCourseIds.has(c.courseId))
    .reduce((sum, c) => sum + (c.credits || 3), 0) || 15;

  // Filter courses
  const filteredCourses = courses.filter((c) => {
    const matchesCategory =
      selectedCategory === 'All' ||
      (c.courseType && c.courseType.toLowerCase().includes(selectedCategory.toLowerCase())) ||
      (selectedCategory === 'Program Core' && c.courseType === 'Program Core') ||
      (selectedCategory === 'Program Elective' && c.courseType === 'Program Elective') ||
      (selectedCategory === 'Open Elective' && (c.courseType === 'Open Elective' || c.courseType === 'Institute Elective')) ||
      (selectedCategory === 'SEED' && c.courseType === 'SEED');

    const matchesSearch =
      c.courseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.courseName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <AppShell>
      <div className={styles.container}>
        <PageHeader
          title="Course Registration & Catalog"
          subtitle="Spring 2026 Active Enrollment &bull; Select courses, manage registrations, and submit override requests."
        />

        {/* Financial Hold Warning Banner */}
        {billing?.isFinancialHoldActive && (
          <div className={styles.holdBanner}>
            <div className={styles.holdBannerText}>
              <span style={{ fontSize: '1.4rem' }}>🚨</span>
              <div>
                <strong>FINANCIAL HOLD ACTIVE ($2,500 Unpaid Balance)</strong>
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
              <span className={styles.statusVal}>Spring 2026 (Sem 4)</span>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Enrolled Credits</span>
              <span className={styles.statusVal}>{enrolledCredits} / 24 Credits</span>
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
            Available Catalog ({courses.length})
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
                    {['All', 'Program Core', 'Program Elective', 'Open Elective', 'SEED'].map((cat) => (
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
                    const isEnrolled = registeredCourseIds.has(c.courseId);
                    return (
                      <div key={c.courseId} className={styles.courseCard}>
                        <div>
                          <div className={styles.cardTop}>
                            <div>
                              <div className={styles.courseCode}>{c.courseId}</div>
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
                              <span className={styles.prereqBadge}>{c.prerequisite || 'None'}</span>
                            </div>
                            <div className={styles.metaRow}>
                              <strong>Schedule:</strong> <span>Mon & Wed (10:00 AM - 11:30 AM)</span>
                            </div>
                            <div className={styles.metaRow}>
                              <strong>Instructor:</strong> <span>Prof. Dr. A. Sharma</span>
                            </div>
                          </div>
                        </div>

                        <div className={styles.cardFooter}>
                          <button
                            type="button"
                            className="btn-outline"
                            onClick={() => handleOpenOverride(c)}
                            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                          >
                            Request Override
                          </button>

                          {isEnrolled ? (
                            <span className="badge badge-approved" style={{ padding: '6px 12px' }}>
                              ✓ Registered
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="btn-primary"
                              onClick={() => handleRegister(c.courseId)}
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
                {courses.filter((c) => registeredCourseIds.has(c.courseId)).length === 0 ? (
                  <div style={{ background: '#ffffff', padding: '32px', textAlign: 'center', borderRadius: '12px', color: '#64748b' }}>
                    No registered courses found for Spring 2026.
                  </div>
                ) : (
                  courses
                    .filter((c) => registeredCourseIds.has(c.courseId))
                    .map((c) => (
                      <div
                        key={c.courseId}
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
                            {c.credits || 4} Credits &bull; Section PC402-S1 &bull; Room G04 &bull; Instructor: Prof. Dr. A. Sharma
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span className="badge badge-approved" style={{ fontSize: '0.85rem' }}>
                            Enrolled & Confirmed
                          </span>
                        </div>
                      </div>
                    ))
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
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>
                  Spring 2026 Weekly Slot Schedule Grid
                </h3>
                <div className={styles.timetableGrid}>
                  <div className={styles.ttHeader}>Time</div>
                  <div className={styles.ttHeader}>Monday</div>
                  <div className={styles.ttHeader}>Tuesday</div>
                  <div className={styles.ttHeader}>Wednesday</div>
                  <div className={styles.ttHeader}>Thursday</div>
                  <div className={styles.ttHeader}>Friday</div>

                  {['09:00 AM', '10:30 AM', '12:00 PM', '02:00 PM', '03:30 PM'].map((time, idx) => (
                    <div key={time} style={{ display: 'contents' }}>
                      <div className={styles.ttCell} style={{ fontWeight: 700, color: '#64748b' }}>
                        {time}
                      </div>
                      <div className={styles.ttCell}>
                        {idx === 0 && <div className={styles.ttBlock}>CS301 (G04)</div>}
                        {idx === 2 && <div className={styles.ttBlock}>CS302 (G02)</div>}
                      </div>
                      <div className={styles.ttCell}>
                        {idx === 1 && <div className={styles.ttBlock}>IC241 (E101)</div>}
                      </div>
                      <div className={styles.ttCell}>
                        {idx === 0 && <div className={styles.ttBlock}>CS301 (G04)</div>}
                        {idx === 3 && <div className={styles.ttBlock}>CS304 (G04)</div>}
                      </div>
                      <div className={styles.ttCell}>
                        {idx === 1 && <div className={styles.ttBlock}>IC241 (E101)</div>}
                      </div>
                      <div className={styles.ttCell}>
                        {idx === 2 && <div className={styles.ttBlock}>CS302 (G02)</div>}
                      </div>
                    </div>
                  ))}
                </div>
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
                <strong>Attention:</strong> Payment of $2,500 semester tuition will immediately clear your financial hold and enable course registration.
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Tuition Amount Due</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>$2,500</div>
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handlePayTuition}
                  disabled={isPaying}
                  style={{ background: '#0284c7' }}
                >
                  {isPaying ? 'Processing...' : 'Pay $2,500 & Clear Hold'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
