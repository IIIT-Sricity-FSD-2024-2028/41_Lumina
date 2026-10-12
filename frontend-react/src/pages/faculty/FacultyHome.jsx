import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { facultyDataService } from '../../services/facultyData';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import styles from './FacultyHome.module.css';

export default function FacultyHome() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [todaysClasses, setTodaysClasses] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [rosterSearch, setRosterSearch] = useState('');

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const prof = facultyDataService.getProfile(user);
        setProfile(prof);

        const [cList, classes, students] = await Promise.all([
          facultyDataService.getCourses(user),
          facultyDataService.getTodaysClasses(),
          facultyDataService.getAllEnrolledStudents(),
        ]);

        setCourses(cList);
        setTodaysClasses(classes);
        setAllStudents(students);
      } catch (err) {
        console.error('Failed to load faculty dashboard data', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user]);

  if (loading) {
    return <LoadingSpinner text="Loading faculty workspace..." />;
  }

  // Calculate statistics
  const activeCoursesCount = courses.filter((c) => c.status === 'active').length;
  const totalEnrolledCount = courses.reduce((sum, c) => sum + (c.students || 0), 0);
  const upcomingClassesCount = todaysClasses.length;

  // Filter Quick Roster students
  const filteredRoster = allStudents
    .filter((s) => {
      const q = rosterSearch.trim().toLowerCase();
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.roll.toLowerCase().includes(q) ||
        s.courseId.toLowerCase().includes(q)
      );
    })
    .slice(0, 8);

  return (
    <div className={styles.container}>
      {/* ── Welcome Header ── */}
      <div className={styles.welcomeBlock}>
        <h1 className={styles.welcomeTitle}>
          Welcome {profile?.displayName || 'Professor'}
        </h1>
        <div className={styles.welcomeSub}>
          <span>Here is what is happening in your academic department today.</span>
          <span className={styles.deptBadge}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
            {profile?.deptName}
          </span>
        </div>
      </div>

      {/* ── Top Metric Cards ── */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div>
            <p className={styles.statLabel}>Active Courses</p>
            <p className={styles.statValue}>{activeCoursesCount}</p>
          </div>
          <div className={`${styles.statIconBox} ${styles.statIconBlue}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M8 10h8M8 14h5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <div className={styles.statCard}>
          <div>
            <p className={styles.statLabel}>Total Enrolled</p>
            <p className={styles.statValue}>{totalEnrolledCount}</p>
          </div>
          <div className={`${styles.statIconBox} ${styles.statIconEmerald}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <div className={styles.statCard}>
          <div>
            <p className={styles.statLabel}>Upcoming Classes</p>
            <p className={styles.statValue}>{upcomingClassesCount}</p>
          </div>
          <div className={`${styles.statIconBox} ${styles.statIconAmber}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div className={styles.dashGrid}>
        {/* Left Column: Classes & Mini Courses */}
        <div className={styles.leftCol}>
          {/* Upcoming Classes Section */}
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <svg className={styles.sectionTitleIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 15 15" strokeLinecap="round" />
                </svg>
                Today&apos;s Upcoming Classes
              </h2>
              <span className={styles.metaBadge}>{todaysClasses.length} Scheduled</span>
            </div>

            <div className={styles.classList}>
              {todaysClasses.map((item) => (
                <div key={item.id} className={styles.classCard}>
                  <div className={styles.classTimeBox}>
                    <span className={styles.timeHour}>{item.time}</span>
                    <span className={styles.timeAmpm}>{item.ampm}</span>
                  </div>
                  <div className={styles.classDetails}>
                    <div className={styles.className}>{item.courseId} - {item.courseName}</div>
                    <div className={styles.classMeta}>
                      <span className={styles.metaBadge}>{item.room}</span>
                      <span>{item.dayOfWeek}</span>
                      <span>&bull;</span>
                      <span>Ends at {item.end}</span>
                    </div>
                  </div>
                  <span className={styles.upcomingBadge}>UPCOMING</span>
                </div>
              ))}
            </div>
          </section>

          {/* Mini Courses Section */}
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <svg className={styles.sectionTitleIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                Assigned Courses
              </h2>
              <Link to="/faculty/courses" className={styles.viewAllLink}>
                View All Courses &rarr;
              </Link>
            </div>

            <div className={styles.miniCoursesGrid}>
              {courses.slice(0, 2).map((course) => (
                <div key={course.id} className={styles.miniCourseCard}>
                  <div>
                    <span className={styles.miniCourseSem}>{course.semester}</span>
                    <h3 className={styles.miniCourseTitle} style={{ marginTop: '4px' }}>
                      {course.id} &ndash; {course.name}
                    </h3>
                  </div>
                  <div className={styles.miniCourseMeta}>
                    <span>👥 {course.students} Enrolled</span>
                    <span>🎓 {course.credits} Credits</span>
                    <span>🏛️ {course.room}</span>
                  </div>
                  <div className={styles.miniCourseActions}>
                    <button
                      className={`${styles.miniBtn} ${styles.miniBtnOutline}`}
                      onClick={() => navigate(`/faculty/roster?course=${course.id}`)}
                    >
                      Roster
                    </button>
                    <button
                      className={`${styles.miniBtn} ${styles.miniBtnPrimary}`}
                      onClick={() => navigate(`/faculty/grades?course=${course.id}`)}
                    >
                      Gradebook
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Quick Roster Search */}
        <div className={styles.rightCol}>
          <div className={styles.widgetCard}>
            <h3 className={styles.widgetTitle}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" style={{ color: 'var(--accent-blue)' }}>
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" />
              </svg>
              Quick Student Lookup
            </h3>

            <input
              type="text"
              className={styles.rosterSearch}
              placeholder="Search student or roll number..."
              value={rosterSearch}
              onChange={(e) => setRosterSearch(e.target.value)}
            />

            <ul className={styles.rosterList}>
              {filteredRoster.length > 0 ? (
                filteredRoster.map((student) => (
                  <li
                    key={`${student.courseId}-${student.roll}`}
                    className={styles.rosterRow}
                    onClick={() => navigate(`/faculty/roster?course=${student.courseId}`)}
                    title={`View ${student.name} in ${student.courseId} roster`}
                  >
                    <div className={styles.rosterLeft}>
                      <div className={styles.rAvatar} style={{ backgroundColor: student.color }}>
                        {student.init}
                      </div>
                      <div className={styles.rInfo}>
                        <div className={styles.rName}>{student.name}</div>
                        <div className={styles.rCourse}>{student.roll} &bull; {student.courseId}</div>
                      </div>
                    </div>
                    <span className={styles.rArrow}>&rsaquo;</span>
                  </li>
                ))
              ) : (
                <li className={styles.emptyRoster}>
                  No students found matching &quot;{rosterSearch}&quot;
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
