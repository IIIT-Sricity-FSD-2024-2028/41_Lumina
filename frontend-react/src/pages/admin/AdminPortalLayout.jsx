/**
 * AdminPortalLayout.jsx
 *
 * Shared layout wrapper for the Lumina SPOC / Admin Portal.
 * Replaces the duplicated <header> in admin_portal.html.
 *
 * Renders:
 *   <TopNavbar> with the 4 admin navigation tab links
 *   <main class="container"> wrapping children
 *   <Footer>
 */
import TopNavbar from '../../components/common/TopNavbar';
import Footer from '../../components/Footer';
import styles from './AdminPortal.module.css';

/** The 4 tab links for the Admin / SPOC portal */
const ADMIN_NAV_LINKS = [
  { label: 'Technical Incidents', to: '/admin', end: true },
  { label: 'Tenant Provisioning', to: '/admin/provisioning' },
  { label: 'Data Migration Engine', to: '/admin/migration' },
  { label: 'Infrastructure Health', to: '/admin/telemetry' },
];

export default function AdminPortalLayout({ children }) {
  return (
    <>
      <TopNavbar navLinks={ADMIN_NAV_LINKS} notifications={[]} />
      <main className={styles.container}>
        {children}
      </main>
      <Footer />
    </>
  );
}
