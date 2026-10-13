/**
 * AD1PageLayout — shared page wrapper for all Deal1 pages.
 *
 * Handles the TopNavbar + main + loading/error/children + Footer pattern.
 */
import TopNavbar from '../../../components/common/TopNavbar';
import Footer from '../../../components/Footer';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { AD1_NAV_LINKS } from '../constants/navLinks';
import shared from '../styles/ad1-shared.module.css';

export default function AD1PageLayout({ loading, error, loadingMessage, children }) {
  if (loading) {
    return (
      <>
        <TopNavbar navLinks={AD1_NAV_LINKS} />
        <main className={shared.mainContent}>
          <LoadingSpinner message={loadingMessage || 'Loading...'} />
        </main>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <TopNavbar navLinks={AD1_NAV_LINKS} />
        <main className={shared.mainContent}>
          <div className={shared.errorState}>
            <h2>Something went wrong</h2>
            <p>{error}</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <TopNavbar navLinks={AD1_NAV_LINKS} />
      <main className={shared.mainContent}>
        {children}
      </main>
      <Footer />
    </>
  );
}
