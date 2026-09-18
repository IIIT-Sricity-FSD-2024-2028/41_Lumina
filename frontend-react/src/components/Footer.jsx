import { useState } from 'react';
import BugReportModal from './BugReportModal';
import styles from './Footer.module.css';

export default function Footer() {
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);

  return (
    <>
      <footer className={styles.siteFooter}>
        <div className={styles.footerTop}>
          <div className={styles.logoGroup}>
            <img
              src="/assets/icons/logo_white.svg"
              alt="Lumina"
              className={styles.logoIcon}
            />
            <span>Lumina</span>
          </div>

          <nav className={styles.footerNav}>
            <button
              type="button"
              onClick={() => setIsBugModalOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                font: 'inherit',
                cursor: 'pointer',
                padding: 0
              }}
            >
              Help Desk / Report Bug
            </button>
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
          </nav>
        </div>

        <div className={styles.footerBottom}>
          <p>&copy; 2026 Lumina Academic Systems. All rights reserved.</p>
          <div className={styles.socialLinks}>
            <a href="https://twitter.com" target="_blank" rel="noreferrer">Twitter</a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer">LinkedIn</a>
            <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
          </div>
        </div>
      </footer>

      {/* Connected Support Incident Modal */}
      <BugReportModal
        isOpen={isBugModalOpen}
        onClose={() => setIsBugModalOpen(false)}
      />
    </>
  );
}
