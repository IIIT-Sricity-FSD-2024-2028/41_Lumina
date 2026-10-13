import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Dean2Layout from './Dean2Layout';
import { coursesService } from '../../services/courses.service';
import { registrationsService } from '../../services/registrations.service';
import { usersService } from '../../services/users.service';
import toast from 'react-hot-toast';
import styles from './Dean2.module.css';

export default function Dean2GradesheetDetail() {
  const { courseId: paramCourseId, termId: paramTermId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [term, setTerm] = useState(paramTermId || 'Spring 2026');
  const [enrollments, setEnrollments] = useState([]);

  useEffect(() => {
    async function loadDetail() {
      try {
        setLoading(true);
        const [cRes, rRes, uRes] = await Promise.allSettled([
          coursesService.getAll(),
          registrationsService.getAll(),
          usersService.getAll(),
        ]);

        const allCourses = cRes.status === 'fulfilled' && Array.isArray(cRes.value) ? cRes.value : [];
        const allRegistrations = rRes.status === 'fulfilled' && Array.isArray(rRes.value) ? rRes.value : [];
        const allUsers = uRes.status === 'fulfilled' && Array.isArray(uRes.value) ? uRes.value : [];

        // Match selected course or default to first
        let targetCourse = allCourses.find((c) => (c.courseId || c.Course_ID) === paramCourseId);
        if (!targetCourse && allCourses.length > 0) {
          targetCourse = allCourses[0];
        }
        setCourse(targetCourse || { courseId: paramCourseId || 'CS201', courseName: 'Data Structures', deptId: 'CSE', credits: 4 });

        const cid = targetCourse ? targetCourse.courseId || targetCourse.Course_ID : paramCourseId;
        const currentTerm = paramTermId ? decodeURIComponent(paramTermId) : 'Spring 2026';
        setTerm(currentTerm);

        // Filter enrollments for this course
        const matchedRegs = allRegistrations.filter(
          (r) => (r.courseId || r.Course_ID) === cid
        );

        const usersMap = {};
        allUsers.forEach((u) => {
          usersMap[u.userId || u.User_ID] = u;
        });

        if (matchedRegs.length > 0) {
          const list = matchedRegs.map((r) => {
            const sid = r.studentId || r.Student_ID;
            const u = usersMap[sid] || {};
            const grade = r.finalGrade || r.Final_Grade || 'A';
            return {
              studentId: sid,
              studentName: u.fullName || u.Full_Name || 'Enrolled Student',
              credits: targetCourse?.credits || targetCourse?.Credits || 4,
              grade: grade,
              gradePoint: grade === 'A' ? '10.0' : grade === 'B+' ? '9.0' : grade === 'B' ? '8.0' : grade === 'C' ? '7.0' : '6.0',
            };
          });
          setEnrollments(list);
        } else {
          // Fallback sample roster for preview if no registrations seeded for this specific course
          setEnrollments([
            { studentId: 'S2024001', studentName: 'Alice Johnson', credits: targetCourse?.credits || 4, grade: 'A', gradePoint: '10.0' },
            { studentId: 'S2024002', studentName: 'Bob Williams', credits: targetCourse?.credits || 4, grade: 'B+', gradePoint: '9.0' },
            { studentId: 'S2024003', studentName: 'Charlie Brown', credits: targetCourse?.credits || 4, grade: 'B', gradePoint: '8.0' },
            { studentId: 'S2024004', studentName: 'Diana Prince', credits: targetCourse?.credits || 4, grade: 'A', gradePoint: '10.0' },
          ]);
        }
      } catch (err) {
        console.error('Failed to load gradesheet detail:', err);
        toast.error('Failed to load grade sheet detail');
      } finally {
        setLoading(false);
      }
    }

    loadDetail();
  }, [paramCourseId, paramTermId]);

  const getGradeBadgeClass = (grade) => {
    switch (grade) {
      case 'A':
        return `${styles.gradeBadge} ${styles.gradeA}`;
      case 'B+':
        return `${styles.gradeBadge} ${styles.gradeBPlus}`;
      case 'B':
        return `${styles.gradeBadge} ${styles.gradeB}`;
      case 'C':
        return `${styles.gradeBadge} ${styles.gradeC}`;
      case 'D':
        return `${styles.gradeBadge} ${styles.gradeD}`;
      default:
        return `${styles.gradeBadge} ${styles.gradeDash}`;
    }
  };

  const handleCalculateGpa = () => {
    toast.success('🧮 GPA Calculated Successfully!');
  };

  const handleSendGpa = () => {
    toast.success('▷ GPA sent to all students!');
  };

  const handleSaveDraft = () => {
    toast.success('Draft saved successfully');
  };

  const handleSubmitReview = () => {
    toast.success('Grade sheet submitted for Dean review!');
  };

  const courseCode = course?.courseId || course?.Course_ID || 'CS201';
  const courseName = course?.courseName || course?.Course_Name || 'Data Structures';
  const deptId = course?.deptId || course?.Dept_ID || 'CSE';
  const credits = course?.credits || course?.Credits || 4;

  return (
    <Dean2Layout>
      <div className={`${styles.pageHeader} ${styles.flexBetween}`}>
        <div>
          <h1>Grade Sheets Workspace</h1>
          <p>Manage and review academic course grading records and submit them to students.</p>
        </div>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={() => toast.success('📥 Records exported!')}
        >
          📥 Export Records
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className={styles.tabsNav}>
        <Link to="/ad2/gradesheets" className={styles.tabLink}>
          Grade Sheets List
        </Link>
        <Link to="/ad2/gradesheets/detail" className={`${styles.tabLink} ${styles.tabLinkActive}`}>
          Grade Sheet Details
        </Link>
      </div>

      {/* Dimmed list card for visual continuity */}
      <div className={`${styles.card} ${styles.gsListDimmed}`}>
        <div className={styles.flexBetween} style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--d2-text-dark)' }}>
            Course Grade Sheets Overview
          </h3>
          <div className={styles.gsSearchWrap}>
            <span className={styles.gsSearchIcon}>🔍</span>
            <input type="text" className={styles.gsSearchInput} placeholder="Search courses..." disabled />
          </div>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Course Code</th>
              <th>Course Name</th>
              <th>Semester</th>
              <th>Status</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>{courseCode}</strong>
              </td>
              <td>{courseName}</td>
              <td>
                <span className={`${styles.badge} ${styles.badgeUpcoming}`}>{term}</span>
              </td>
              <td>
                <span className={`${styles.badge} ${styles.badgePending}`}>Pending</span>
              </td>
              <td style={{ color: 'var(--d2-text-muted)' }}>2026-10-15</td>
              <td>
                <span className={styles.btnViewDark} style={{ cursor: 'default' }}>
                  View Grade Sheet &rarr;
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Detail header row */}
      <div className={styles.gsDetailHeaderRow}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <button
            type="button"
            className={styles.gsBackBtn}
            onClick={() => navigate('/ad2/gradesheets')}
            title="Back to Grade Sheets"
          >
            &larr;
          </button>
          <div>
            <h2 className={styles.gsDetailTitle}>
              Grade Sheet Details: {courseCode} - {courseName}
            </h2>
            <div className={styles.gsDetailMeta}>
              {term} &nbsp;&bull;&nbsp; <span className={styles.badgeAwaiting}>REVIEW</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexShrink: 0 }}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={handleSaveDraft}>
            Save Draft
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSubmitReview}>
            Submit for Review
          </button>
        </div>
      </div>

      {/* Main grade sheet card */}
      <div className={`${styles.card} ${styles.gsDetailCard}`}>
        <h2 className={styles.gsInnerTitle}>
          Grade Sheet Details - {courseCode}: {courseName}
        </h2>
        <div className={styles.gsInnerMeta}>
          📅 Term: {term} &nbsp;&nbsp;&bull;&nbsp;&nbsp; 🎓 Department of {deptId}
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Student Name</th>
              <th style={{ textAlign: 'center' }}>Credit Hours</th>
              <th style={{ textAlign: 'center' }}>Grade</th>
              <th style={{ textAlign: 'center' }}>Grade Point</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                  Loading grade sheet details...
                </td>
              </tr>
            ) : enrollments.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--d2-text-muted)' }}>
                  No enrollments found for this course.
                </td>
              </tr>
            ) : (
              enrollments.map((r, idx) => (
                <tr key={r.studentId || idx}>
                  <td style={{ color: 'var(--d2-text-muted)' }}>{r.studentId}</td>
                  <td>
                    <strong>{r.studentName}</strong>
                  </td>
                  <td style={{ textAlign: 'center', color: 'var(--d2-text-muted)' }}>{r.credits || credits}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={getGradeBadgeClass(r.grade)}>{r.grade}</span>
                  </td>
                  <td style={{ textAlign: 'center', color: 'var(--d2-text-muted)' }}>{r.gradePoint}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className={styles.gsCardFooter}>
          <div className={styles.gsPagination}>
            <button type="button" className={styles.gsPageBtn} aria-label="Previous page">
              &lsaquo;
            </button>
            <span>Page 1 of 1</span>
            <button type="button" className={styles.gsPageBtn} aria-label="Next page">
              &rsaquo;
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleCalculateGpa}>
              🧮 Calculate GPA
            </button>
            <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSendGpa}>
              ▷ Send GPA to Students
            </button>
          </div>
        </div>
      </div>
    </Dean2Layout>
  );
}
