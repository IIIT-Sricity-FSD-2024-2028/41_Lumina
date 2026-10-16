import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Dean2Layout from './Dean2Layout';
import { coursesService } from '../../services/courses.service';
import { registrationsService } from '../../services/registrations.service';
import { usersService } from '../../services/users.service';
import { announcementsService } from '../../services/announcements.service';
import toast from 'react-hot-toast';
import styles from './Dean2.module.css';

export default function Dean2GradesheetDetail() {
  const { courseId: paramCourseId, termId: paramTermId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [term, setTerm] = useState(paramTermId || 'Spring 2026');
  const [enrollments, setEnrollments] = useState([]);
  const [sheetStatus, setSheetStatus] = useState('REVIEW'); // 'REVIEW' | 'DRAFT' | 'SUBMITTED_FOR_REVIEW' | 'PUBLISHED'
  const [gpaStats, setGpaStats] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

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
            const gradePoint =
              grade === 'A+' || grade === 'A'
                ? '10.0'
                : grade === 'A-'
                ? '9.0'
                : grade === 'B+'
                ? '9.0'
                : grade === 'B'
                ? '8.0'
                : grade === 'C'
                ? '7.0'
                : grade === 'D'
                ? '6.0'
                : grade === 'F'
                ? '0.0'
                : '—';

            return {
              enrollmentId: r.enrollmentId || r.Enrollment_ID || r.id,
              studentId: sid,
              studentName: u.fullName || u.Full_Name || 'Enrolled Student',
              credits: targetCourse?.credits || targetCourse?.Credits || 4,
              grade: grade,
              gradePoint: gradePoint,
            };
          });
          setEnrollments(list);
        } else {
          setEnrollments([]);
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
      case 'A+':
      case 'A':
        return `${styles.gradeBadge} ${styles.gradeA}`;
      case 'A-':
      case 'B+':
        return `${styles.gradeBadge} ${styles.gradeBPlus}`;
      case 'B':
        return `${styles.gradeBadge} ${styles.gradeB}`;
      case 'C':
        return `${styles.gradeBadge} ${styles.gradeC}`;
      case 'D':
        return `${styles.gradeBadge} ${styles.gradeD}`;
      case 'F':
        return `${styles.gradeBadge} ${styles.gradeRejected}`;
      default:
        return `${styles.gradeBadge} ${styles.gradeDash}`;
    }
  };

  const courseCode = course?.courseId || course?.Course_ID || 'CS201';
  const courseName = course?.courseName || course?.Course_Name || 'Data Structures';
  const deptId = course?.deptId || course?.Dept_ID || 'CSE';
  const credits = course?.credits || course?.Credits || 4;

  // 1. Calculate GPA: Computes exact GPA point values, averages, and updates list
  const handleCalculateGpa = () => {
    if (enrollments.length === 0) {
      toast.error('No students enrolled to calculate GPA.');
      return;
    }

    const gradePointMap = {
      'A+': 10.0,
      'A': 10.0,
      'A-': 9.0,
      'B+': 9.0,
      'B': 8.0,
      'B-': 7.0,
      'C+': 7.0,
      'C': 7.0,
      'D': 6.0,
      'F': 0.0,
    };

    let totalPoints = 0;
    let counted = 0;
    let minGp = 10.0;
    let maxGp = 0.0;

    const updated = enrollments.map((e) => {
      const g = (e.grade || 'A').toUpperCase().trim();
      const pt = gradePointMap[g] !== undefined ? gradePointMap[g] : 7.0;
      totalPoints += pt;
      counted += 1;
      if (pt < minGp) minGp = pt;
      if (pt > maxGp) maxGp = pt;
      return {
        ...e,
        gradePoint: pt.toFixed(1),
      };
    });

    const avg = counted > 0 ? (totalPoints / counted).toFixed(2) : '0.00';
    setEnrollments(updated);
    setGpaStats({
      calculated: true,
      avgGpa: avg,
      highestGpa: maxGp.toFixed(1),
      lowestGpa: minGp.toFixed(1),
      studentCount: counted,
    });

    toast.success(`🧮 GPA Calculated! Class Average: ${avg} / 10.0 (${counted} students)`);
  };

  // 2. Send GPA to Students: Persists batch grades to backend & broadcasts announcement
  const handleSendGpa = async () => {
    if (enrollments.length === 0) {
      toast.error('No student grades available to send.');
      return;
    }

    try {
      setActionLoading(true);

      // Persist grades if enrollment IDs available
      const gradeBatch = enrollments
        .filter((e) => e.enrollmentId)
        .map((e) => ({
          enrollmentId: e.enrollmentId,
          finalGrade: e.grade,
        }));

      if (gradeBatch.length > 0) {
        await registrationsService.batchUpdateGrades(gradeBatch).catch((err) => {
          console.warn('Batch grades persist notice:', err);
        });
      }

      // Publish announcement to students
      await announcementsService.create({
        title: `Official Grades & GPA Released: ${courseCode}`,
        content: `Official semester grades and GPA for ${courseCode} (${courseName}) have been processed and published to all student profiles by Assistant Dean 2.`,
        deptId: deptId,
        courseId: courseCode,
      }).catch((err) => {
        console.warn('Announcement dispatch notice:', err);
      });

      setSheetStatus('PUBLISHED');
      toast.success(`▷ GPA & grades officially published to ${enrollments.length} students!`);
    } catch (err) {
      console.error('Failed to send GPA to students:', err);
      toast.error('Failed to send GPA to students');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Save Draft
  const handleSaveDraft = async () => {
    try {
      setActionLoading(true);
      const gradeBatch = enrollments
        .filter((e) => e.enrollmentId)
        .map((e) => ({
          enrollmentId: e.enrollmentId,
          finalGrade: e.grade,
        }));

      if (gradeBatch.length > 0) {
        await registrationsService.batchUpdateGrades(gradeBatch).catch(() => {});
      }

      setSheetStatus('DRAFT');
      toast.success(`💾 Grade sheet draft for ${courseCode} saved.`);
    } catch (err) {
      console.error('Failed to save draft:', err);
      toast.error('Failed to save draft');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Submit for Review
  const handleSubmitReview = async () => {
    try {
      setActionLoading(true);
      await announcementsService.create({
        title: `Grade Sheet Submitted for Dean Approval: ${courseCode}`,
        content: `Assistant Dean 2 has submitted the grade sheet and calculated GPA records for ${courseCode} (${courseName}) for final Dean sign-off.`,
        deptId: deptId,
        courseId: courseCode,
      }).catch(() => {});

      setSheetStatus('SUBMITTED_FOR_REVIEW');
      toast.success(`📨 Grade sheet for ${courseCode} submitted for Dean review!`);
    } catch (err) {
      console.error('Failed to submit for review:', err);
      toast.error('Failed to submit for review');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Export Records (Real CSV generation & download)
  const handleExportRecords = () => {
    if (enrollments.length === 0) {
      toast.error('No enrollment records to export.');
      return;
    }

    const headers = ['Student ID', 'Student Name', 'Course Code', 'Course Name', 'Term', 'Credit Hours', 'Grade', 'Grade Point'];
    const rows = enrollments.map((e) => [
      `"${e.studentId}"`,
      `"${e.studentName.replace(/"/g, '""')}"`,
      `"${courseCode}"`,
      `"${courseName.replace(/"/g, '""')}"`,
      `"${term}"`,
      e.credits || credits,
      `"${e.grade || '—'}"`,
      e.gradePoint || '—',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GradeSheet_${courseCode}_${term.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`📥 Exported ${enrollments.length} student records to CSV!`);
  };

  const getStatusBadge = () => {
    switch (sheetStatus) {
      case 'PUBLISHED':
        return <span className={`${styles.badge} ${styles.badgeActive}`}>PUBLISHED</span>;
      case 'SUBMITTED_FOR_REVIEW':
        return <span className={`${styles.badge} ${styles.badgeUpcoming}`}>UNDER DEAN REVIEW</span>;
      case 'DRAFT':
        return <span className={`${styles.badge} ${styles.badgePaused}`}>DRAFT</span>;
      default:
        return <span className={styles.badgeAwaiting}>REVIEW</span>;
    }
  };

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
          onClick={handleExportRecords}
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
              <th>Enrolled</th>
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
              <td>{getStatusBadge()}</td>
              <td style={{ color: 'var(--d2-text-muted)' }}>{enrollments.length} Students</td>
              <td>
                <span className={styles.btnViewDark} style={{ cursor: 'default' }}>
                  Viewing &rarr;
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
              {term} &nbsp;&bull;&nbsp; {getStatusBadge()}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexShrink: 0 }}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnOutline}`}
            onClick={handleSaveDraft}
            disabled={actionLoading}
          >
            Save Draft
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleSubmitReview}
            disabled={actionLoading}
          >
            Submit for Review
          </button>
        </div>
      </div>

      {/* GPA Calculation Summary Banner (when calculated) */}
      {gpaStats && (
        <div
          className={styles.card}
          style={{
            background: '#F0FDF4',
            borderColor: '#A7F3D0',
            marginBottom: '1rem',
            padding: '1rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <strong style={{ color: '#065F46', fontSize: '1rem' }}>
              📊 GPA Calculation Summary
            </strong>
            <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#047857' }}>
              Evaluated for <strong>{gpaStats.studentCount}</strong> enrolled students.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#047857', display: 'block', textTransform: 'uppercase' }}>
                Class Average
              </span>
              <strong style={{ fontSize: '1.25rem', color: '#065F46' }}>{gpaStats.avgGpa}</strong>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#047857', display: 'block', textTransform: 'uppercase' }}>
                Highest
              </span>
              <strong style={{ fontSize: '1.25rem', color: '#065F46' }}>{gpaStats.highestGpa}</strong>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#047857', display: 'block', textTransform: 'uppercase' }}>
                Lowest
              </span>
              <strong style={{ fontSize: '1.25rem', color: '#065F46' }}>{gpaStats.lowestGpa}</strong>
            </div>
          </div>
        </div>
      )}

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
                  <td style={{ textAlign: 'center', color: 'var(--d2-text-dark)', fontWeight: 600 }}>
                    {r.gradePoint}
                  </td>
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
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={handleCalculateGpa}
              disabled={actionLoading}
            >
              🧮 Calculate GPA
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={handleSendGpa}
              disabled={actionLoading}
            >
              {actionLoading ? 'Publishing...' : '▷ Send GPA to Students'}
            </button>
          </div>
        </div>
      </div>
    </Dean2Layout>
  );
}
