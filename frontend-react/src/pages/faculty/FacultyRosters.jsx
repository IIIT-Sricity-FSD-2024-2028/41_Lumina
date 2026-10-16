import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { facultyDataService, getColorForString, getInitials } from '../../services/facultyData';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import styles from './FacultyRosters.module.css';

const PAGE_SIZE = 8;

export default function FacultyRosters() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { courseId: pathCourseId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Load courses
  useEffect(() => {
    async function initCourses() {
      setLoading(true);
      try {
        const cList = await facultyDataService.getCourses(user);
        setCourses(cList);
      } catch (err) {
        console.error('Failed to load courses', err);
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
    return courses[0]?.id || '';
  })();

  // Load roster whenever selectedCourseId changes
  useEffect(() => {
    if (!selectedCourseId) return;

    async function loadRoster() {
      try {
        const list = await facultyDataService.getStudentsForCourse(selectedCourseId);
        setStudents(list);
        setCurrentPage(1);
      } catch (err) {
        console.error('Failed to load student roster', err);
        toast.error('Could not load student roster');
      }
    }

    loadRoster();
  }, [selectedCourseId]);

  // Handle course switch
  function handleCourseChange(e) {
    const newCourseId = e.target.value;
    if (pathCourseId) {
      navigate(`/faculty/roster/${newCourseId}`);
    } else {
      setSearchParams({ course: newCourseId });
    }
  }

  // Export CSV
  function handleExportCSV() {
    if (!students.length) {
      toast.error('No students in roster to export');
      return;
    }

    const headers = ['Roll Number', 'Student Name', 'Email', 'Program / Department', 'Semester'];
    const rows = students.map((s) => [
      s.roll,
      `"${s.name}"`,
      s.email,
      s.prog || 'CSE',
      s.semester || 4,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Roster_${selectedCourseId}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported Roster_${selectedCourseId}.csv`);
  }

  if (loading) {
    return <LoadingSpinner text="Loading academic roster..." />;
  }

  // Filter students by search
  const filteredStudents = students.filter((s) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.roll.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.prog && s.prog.toLowerCase().includes(q))
    );
  });

  // Pagination calculation
  const totalCount = filteredStudents.length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;
  const validPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validPage - 1) * PAGE_SIZE;
  const currentStudentsPage = filteredStudents.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className={styles.container}>
      {/* ── Page Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Academic Roster</h1>
          <p className={styles.pageSub}>
            Official list of students actively registered for your assigned course sections.
          </p>
        </div>

        <button className={styles.exportBtn} onClick={handleExportCSV}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* ── Toolbar ── */}
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
              placeholder="Search student, roll, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.enrolledBadge}>
          {totalCount} Enrolled Students
        </div>
      </div>

      {/* ── Roster Table Card ── */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrap}>
          <table className={styles.rosterTable}>
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                <th>Student</th>
                <th>Roll Number</th>
                <th>Email Address</th>
                <th>Program / Dept</th>
                <th>Semester</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentStudentsPage.length > 0 ? (
                currentStudentsPage.map((student, idx) => (
                  <tr key={student.roll}>
                    <td style={{ textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>
                      {startIndex + idx + 1}
                    </td>
                    <td>
                      <div className={styles.studentCell}>
                        <div
                          className={styles.avatarCircle}
                          style={{ backgroundColor: getColorForString(student.roll) }}
                        >
                          {getInitials(student.name)}
                        </div>
                        <span className={styles.studentName}>{student.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={styles.rollCode}>{student.roll}</span>
                    </td>
                    <td>
                      <a href={`mailto:${student.email}`} className={styles.emailLink}>
                        {student.email}
                      </a>
                    </td>
                    <td>
                      <span className={styles.progBadge}>{student.prog || 'CSE'}</span>
                    </td>
                    <td style={{ color: '#64748b' }}>
                      Semester {student.semester || 4}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className={styles.gradebookLink}
                        onClick={() => navigate(`/faculty/grades?course=${selectedCourseId}`)}
                      >
                        Gradebook
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>
                    No enrolled students found matching &quot;{searchTerm}&quot;
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Row ── */}
        <div className={styles.paginationRow}>
          <div className={styles.pageInfo}>
            Showing {totalCount === 0 ? 0 : startIndex + 1} &ndash;{' '}
            {Math.min(startIndex + PAGE_SIZE, totalCount)} of {totalCount} students
          </div>

          <div className={styles.pageBtns}>
            <button
              className={styles.pageBtn}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={validPage <= 1}
            >
              &larr; Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                className={`${styles.pageBtn} ${pg === validPage ? styles.pageBtnActive : ''}`}
                onClick={() => setCurrentPage(pg)}
              >
                {pg}
              </button>
            ))}

            <button
              className={styles.pageBtn}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={validPage >= totalPages}
            >
              Next &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
