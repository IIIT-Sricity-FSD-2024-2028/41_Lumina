import GraceBanner from '../GraceBanner';
import TopNavbar from './TopNavbar';
import Footer from '../Footer';
import styles from './AppShell.module.css';

const DEFAULT_STUDENT_NAV_LINKS = [
  { label: 'Home', to: '/student', end: true },
  { label: 'Course Registration', to: '/student/registration' },
  { label: 'Academic Roadmap', to: '/student/roadmap' },
];

export default function AppShell({
  children,
  navLinks = DEFAULT_STUDENT_NAV_LINKS,
  notifications = [],
}) {
  return (
    <div className={styles.shellLayout}>
      <GraceBanner />
      <TopNavbar navLinks={navLinks} notifications={notifications} />
      <main className={styles.mainContent}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
