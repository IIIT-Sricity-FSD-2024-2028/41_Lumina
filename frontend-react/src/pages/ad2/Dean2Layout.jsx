/**
 * Dean2Layout.jsx
 *
 * Shared layout wrapper for all Dean2 (Assistant Dean 2) pages.
 * Replaces the duplicated <header> found in every Dean2_*.html file.
 *
 * Renders:
 *   <TopNavbar> with the 5 AD2 navigation links
 *   <main class="container"> wrapping children
 *   <Footer>
 */
import TopNavbar from '../../components/common/TopNavbar';
import Footer from '../../components/Footer';
import styles from './Dean2.module.css';

/** The 5 nav links shared across all Dean2 pages */
const DEAN2_NAV_LINKS = [
  { label: 'Home', to: '/ad2', end: true },
  { label: 'Academic Terms & Policies', to: '/ad2/policies' },
  { label: 'Enrollment Configuration', to: '/ad2/enrollment' },
  { label: 'Override Requests', to: '/ad2/overrides' },
  { label: 'Enrollment Analytics', to: '/ad2/analytics' },
];

export default function Dean2Layout({ children }) {
  return (
    <>
      <TopNavbar navLinks={DEAN2_NAV_LINKS} notifications={[]} />
      <main className={styles.container}>
        {children}
      </main>
      <Footer />
    </>
  );
}
