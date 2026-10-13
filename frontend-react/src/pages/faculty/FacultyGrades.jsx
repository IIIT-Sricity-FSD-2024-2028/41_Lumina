import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { facultyDataService, getGradeLetter } from '../../services/facultyData';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import styles from './FacultyGrades.module.css';

export default function FacultyGrades() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { courseId: pathCourseId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [gradesData, setGradesData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load course list
  useEffect(() => {
    async function initCourses() {
      setLoading(true);
      try {
        const cList = await facultyDataService.getCourses(user);
        setCourses(cList);
      } catch (err) {
        console.error('Failed to load courses for grading', err);
        toast.error('Failed to load courses');
      } finally {
        setLoading(false);
      }
    }

    initCourses();
  }, [user]);

  // Give valid path parameter precedence over query parameter, then fallback to default
  const selectedCourseId = (() => {
    if (pathCourseId && courses.some((c) => c.id.toLowerCase() === pathCourseId.toLowerCase())) {
      return courses.find((c) => c.id.toLowerCase() === pathCourseId.toLowerCase()).id;
    }
    const queryCourseId = searchParams.get('course');
    if (queryCourseId && courses.some((c) => c.id.toLowerCase() === queryCourseId.toLowerCase())) {
      return courses.find((c) => c.id.toLowerCase() === queryCourseId.toLowerCase()).id;
    }
    if (pathCourseId) return pathCourseId;
    if (queryCourseId) return queryCourseId;
    return courses[0]?.id || 'CS402';
  })();

  // Load students/grades whenever selected course changes
  useEffect(() => {
    if (!selectedCourseId) return;

    async function loadGrades() {
      try {
        const list = await facultyDataService.getStudentsForCourse(selectedCourseId);
        setGradesData(list);
      } catch (err) {
        console.error('Failed to load students for course', err);
        toast.error('Could not load course roster');
      }
    }

    loadGrades();
  }, [selectedCourseId]);

  // Change course handler
  function handleCourseChange(e) {
    const newCourseId = e.target.value;
    if (pathCourseId) {
      navigate(`/faculty/grades/${newCourseId}`);
    } else {
      setSearchParams({ course: newCourseId });
    }
  }

  // Update a student's marks in local state
  function handleScoreChange(roll, field, val) {
    const numericVal = Math.max(0, Number(val) || 0);
    const maxVal = field === 'mid' ? 30 : 70;
    const boundedVal = Math.min(numericVal, maxVal);

    setGradesData((prev) =>
      prev.map((item) => {
        if (item.roll === roll) {
          const updatedMid = field === 'mid' ? boundedVal : item.mid;
          const updatedFin = field === 'fin' ? boundedVal : item.fin;
          const newTotal = updatedMid + updatedFin;
          return {
            ...item,
            [field]: boundedVal,
            finalGrade: getGradeLetter(newTotal).grade,
            submitted: false,
          };
        }
        return item;
      })
    );
  }

  // Save Draft
  async function handleSaveDraft() {
    try {
      await facultyDataService.saveDraftGrades(selectedCourseId, gradesData);
      toast.success('Draft marks saved successfully!');
    } catch {
      toast.error('Failed to save draft');
    }
  }

  // Final Submit
  async function handleSubmitGrades() {
    const confirm = window.confirm(
      `Are you sure you want to finalize and submit grades for ${selectedCourseId}? This will record the official letter grades.`
    );
    if (!confirm) return;

    setIsSubmitting(true);
    try {
      const result = await facultyDataService.submitFinalGrades(selectedCourseId, gradesData);
      setGradesData(result.grades);
      if (result.backendSuccess) {
        toast.success(`Official grades persisted to server for ${result.syncedCount} students! 🎉`);
      } else if (result.backendError) {
        toast.error(`Server persistence failed: ${result.backendError}. Saved to local draft.`);
      } else {
        toast.success(`Official grades recorded locally for ${selectedCourseId}. (Server offline)`);
      }
    } catch {
      toast.error('Failed to submit grades');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Export CSV
  function handleExportCSV() {
    if (!gradesData.length) {
      toast.error('No grades to export');
      return;
    }

    const headers = ['Roll Number', 'Student Name', 'Department', 'Midterm (/30)', 'Final (/70)', 'Total (/100)', 'Grade', 'Status'];
    const rows = gradesData.map((s) => {
      const tot = s.mid + s.fin;
      const letter = getGradeLetter(tot).grade;
      return [
        s.roll,
        `"${s.name}"`,
        s.prog || 'CSE',
        s.mid,
        s.fin,
        tot,
        letter,
        s.submitted ? 'Submitted' : 'Draft',
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Grades_${selectedCourseId}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported Grades_${selectedCourseId}.csv`);
  }

  if (loading) {
    return <LoadingSpinner text="Loading gradebook..." />;
  }

  // Compute Grade Statistics
  const totalCount = gradesData.length;
  const totalScoresSum = gradesData.reduce((acc, s) => acc + (s.mid + s.fin), 0);
  const avgScore = totalCount ? (totalScoresSum / totalCount).toFixed(1) : 0;

  const distCounts = { O: 0, A: 0, B: 0, C: 0, D: 0, F: 0 };
  gradesData.forEach((s) => {
    const letter = getGradeLetter(s.mid + s.fin).grade;
    if (distCounts[letter] !== undefined) distCounts[letter]++;
  });

  // Filter students by search
  const filteredGrades = gradesData.filter((s) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return s.name.toLowerCase().includes(q) || s.roll.toLowerCase().includes(q);
  });

  const selectedCourseObj = courses.find((c) => c.id === selectedCourseId);

  return (
    <div className={styles.container}>
      {/* ── Page Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Academic Gradebook</h1>
          <p className={styles.pageSub}>
            Record, audit, and submit course evaluation marks and letter grades.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.exportBtn} onClick={handleExportCSV}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* ── Control Toolbar ── */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <select
            className={styles.courseSelect}
            value={selectedCourseId}
            onChange={handleCourseChange}
          >
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.id} &ndash; {course.name}
              </option>
            ))}
          </select>

          <div className={styles.searchWrapper}>
            <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search student or roll number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
          {selectedCourseObj?.termLabel || 'Spring 2026'} &bull; {selectedCourseObj?.semester}
        </span>
      </div>

      {/* ── Grade Distribution Summary Bar ── */}
      <div className={styles.statsBar}>
        <div className={styles.summaryMetrics}>
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Total Students</span>
            <span className={styles.metricValue}>{totalCount}</span>
          </div>
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Class Average</span>
            <span className={styles.metricValue}>{avgScore}/100</span>
          </div>
        </div>

        <div className={styles.gradeDist}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Distribution:
          </span>
          <span className={styles.distBadge} style={{ background: '#ecfdf5', color: '#059669' }}>
            O: {distCounts.O}
          </span>
          <span className={styles.distBadge} style={{ background: '#eff6ff', color: '#2563eb' }}>
            A: {distCounts.A}
          </span>
          <span className={styles.distBadge} style={{ background: '#eef2ff', color: '#4f46e5' }}>
            B: {distCounts.B}
          </span>
          <span className={styles.distBadge} style={{ background: '#fffbeb', color: '#d97706' }}>
            C: {distCounts.C}
          </span>
          <span className={styles.distBadge} style={{ background: '#fff7ed', color: '#c2410c' }}>
            D: {distCounts.D}
          </span>
          <span className={styles.distBadge} style={{ background: '#fef2f2', color: '#dc2626' }}>
            F: {distCounts.F}
          </span>
        </div>
      </div>

      {/* ── Spreadsheet Table ── */}
      <div className={styles.tableContainer}>
        <div className={styles.tableWrap}>
          <table className={styles.gradeTable}>
            <thead>
              <tr>
                <th style={{ width: '48px', textAlign: 'center' }}>#</th>
                <th>Roll Number</th>
                <th>Student Name</th>
                <th style={{ textAlign: 'center' }}>Midterm (/30)</th>
                <th style={{ textAlign: 'center' }}>Final (/70)</th>
                <th style={{ textAlign: 'center' }}>Total (/100)</th>
                <th style={{ textAlign: 'center' }}>Grade</th>
                <th style={{ textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredGrades.length > 0 ? (
                filteredGrades.map((student, idx) => {
                  const total = student.mid + student.fin;
                  const gradeInfo = getGradeLetter(total);

                  return (
                    <tr key={student.roll}>
                      <td style={{ textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>
                        {idx + 1}
                      </td>
                      <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>
                        {student.roll}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {student.name}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="number"
                          min="0"
                          max="30"
                          className={styles.scoreInput}
                          value={student.mid}
                          onChange={(e) => handleScoreChange(student.roll, 'mid', e.target.value)}
                          disabled={student.submitted}
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="number"
                          min="0"
                          max="70"
                          className={styles.scoreInput}
                          value={student.fin}
                          onChange={(e) => handleScoreChange(student.roll, 'fin', e.target.value)}
                          disabled={student.submitted}
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={styles.totalScore}>{total}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className={styles.gradeBadge}
                          style={{
                            backgroundColor: gradeInfo.bg,
                            color: gradeInfo.color,
                          }}
                        >
                          {gradeInfo.grade}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {student.submitted ? (
                          <span className={styles.statusPillSubmitted}>✓ Submitted</span>
                        ) : (
                          <span className={styles.statusPillDraft}>Draft</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className={styles.emptyState}>
                    No student records found matching &quot;{searchTerm}&quot;
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} style={{ textAlign: 'right', paddingRight: '24px' }}>
                  Class Summary Average:
                </td>
                <td style={{ textAlign: 'center' }}>
                  {totalCount
                    ? (gradesData.reduce((acc, s) => acc + s.mid, 0) / totalCount).toFixed(1)
                    : 0}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {totalCount
                    ? (gradesData.reduce((acc, s) => acc + s.fin, 0) / totalCount).toFixed(1)
                    : 0}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {avgScore}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── Bottom Action Bar ── */}
      <div className={styles.bottomActionBar}>
        <div className={styles.noticeText}>
          <span>ℹ️</span>
          <span>
            Grades must be verified against academic guidelines before submission to the Dean&apos;s office.
          </span>
        </div>

        <div className={styles.actionButtonGroup}>
          <button className={styles.saveDraftBtn} onClick={handleSaveDraft}>
            Save Draft
          </button>
          <button
            className={styles.submitGradesBtn}
            onClick={handleSubmitGrades}
            disabled={isSubmitting}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {isSubmitting ? 'Submitting...' : 'Submit Final Grades'}
          </button>
        </div>
      </div>
    </div>
  );
}
