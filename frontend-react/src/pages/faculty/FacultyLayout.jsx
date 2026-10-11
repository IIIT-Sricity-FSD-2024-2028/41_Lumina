import { Outlet } from 'react-router-dom';
import TopNavbar from '../../components/common/TopNavbar';
import Footer from '../../components/Footer';
import GraceBanner from '../../components/GraceBanner';
import styles from './FacultyLayout.module.css';

const FACULTY_NAV_LINKS = [
  { label: 'Home', to: '/faculty', end: true },
  { label: 'My Courses', to: '/faculty/courses' },
  { label: 'Grades', to: '/faculty/grades' },
  { label: 'Rosters', to: '/faculty/roster' },
  { label: 'Announcements', to: '/faculty/announcements' },
];

export default function FacultyLayout() {
  const notifications = [
    { id: 1, text: 'Enrollment open for upcoming academic term', time: '2 hours ago', type: 'info' },
    { id: 2, text: 'Syllabus submission deadline approaching', time: 'Today, 09:15 AM', type: 'info' },
    { id: 3, text: 'Grade submission review reminder', time: 'Yesterday', type: 'warning' },
  ];

  return (
    <div className={styles.layout}>
      <GraceBanner />
      <TopNavbar navLinks={FACULTY_NAV_LINKS} notifications={notifications} />
      <main className={styles.mainContent}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
