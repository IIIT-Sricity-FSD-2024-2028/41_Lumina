import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Dean2Layout from './Dean2Layout';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchGradesheetDetail,
  calculateGpa,
  sendGpaToStudents,
  saveGradesheetDraft,
  submitGradesheetForReview,
} from '../../store/ad2/ad2-actions';
import toast from 'react-hot-toast';
import styles from './Dean2.module.css';

export default function Dean2GradesheetDetail() {
  const { courseId: paramCourseId, termId: paramTermId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux state
  const { loading, actionLoading, gradesheetDetail } = useSelector((state) => state.ad2);
  const { course, term, enrollments, sheetStatus, gpaStats } = gradesheetDetail;

  useEffect(() => {
    dispatch(fetchGradesheetDetail(paramCourseId, paramTermId))
      .catch(() => toast.error('Failed to load grade sheet detail'));
  }, [dispatch, paramCourseId, paramTermId]);

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

  // 1. Calculate GPA
  const handleCalculateGpa = () => {
    if (enrollments.length === 0) {
      toast.error('No students enrolled to calculate GPA.');
      return;
    }
    const stats = dispatch(calculateGpa());
    if (stats) {
      toast.success(`🧮 GPA Calculated! Class Average: ${stats.avgGpa} / 10.0 (${stats.studentCount} students)`);
    }
  };

  // 2. Send GPA to Students
  const handleSendGpa = async () => {
    if (enrollments.length === 0) {
      toast.error('No student grades available to send.');
      return;
    }
    try {
      await dispatch(sendGpaToStudents());
      toast.success(`▷ GPA & grades officially published to ${enrollments.length} students!`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send GPA to students');
    }
  };

  // 3. Save Draft
  const handleSaveDraft = async () => {
    try {
      const code = await dispatch(saveGradesheetDraft());
      toast.success(`💾 Grade sheet draft for ${code} saved.`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save draft');
    }
  };

  // 4. Submit for Review
  const handleSubmitReview = async () => {
    try {
      const code = await dispatch(submitGradesheetForReview());
      toast.success(`📨 Grade sheet for ${code} submitted for Dean review!`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit for review');
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
