import { useState, useRef, useEffect } from 'react';
import styles from './StudentProfileDropdown.module.css';

/**
 * Extracts initials from a name (e.g. "Mahtab Alam" -> "MA")
 */
function getInitials(name) {
  if (!name || typeof name !== 'string') return 'ST';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function StudentProfileDropdown({
  user = null,
  onLogout = null,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const containerRef = useRef(null);

  // ── 1. Resolve Student Data with Sensible Fallbacks ──
  const rollNumber =
    user?.Roll_Number ||
    user?.rollNumber ||
    user?.Student_ID ||
    user?.studentId ||
    user?.profile?.studentId ||
    user?.User_ID ||
    'S2024002';

  const studentName =
    user?.Full_Name ||
    user?.fullName ||
    user?.name ||
    'Mahtab Alam';

  const email =
    user?.Email ||
    user?.email ||
    (rollNumber && rollNumber !== 'Not available'
      ? `${rollNumber.toLowerCase()}@iiits.in`
      : 'Not available');

  // Format CGPA (out of 10)
  const rawCgpa =
    user?.CGPA ||
    user?.cgpa ||
    user?.GPA ||
    user?.gpa?.cumulative ||
    (typeof user?.gpa === 'string' ? user.gpa : null) ||
    '8.9';

  // Normalize CGPA representation so "8.9 / 10.0" or "8.9" displays cleanly out of 10
  const cleanCgpaNum = String(rawCgpa).replace(/[^0-9.]/g, '').split('.').slice(0, 2).join('.') || '8.9';

  const department =
    user?.Dept_ID ||
    user?.department ||
    user?.profile?.department ||
    'CSE';

  const profilePhoto = user?.profilePhoto || user?.avatarUrl || user?.photo || null;
  const initials = getInitials(studentName);

  // ── 2. Click Outside Handler for Dropdown ──
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // ── 3. Keyboard Escape Handler for Dropdown & Modal ──
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        if (isDetailsOpen) {
          setIsDetailsOpen(false);
        } else if (isOpen) {
          setIsOpen(false);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDetailsOpen]);

  // Open the profile details modal and close dropdown
  const handleOpenDetails = () => {
    setIsOpen(false);
    setIsDetailsOpen(true);
  };

  return (
    <div className={styles.profileContainer} ref={containerRef}>
      {/* ── Navbar Profile Avatar Button ── */}
      <button
        type="button"
        className={`${styles.avatarBtn} ${isOpen ? styles.avatarBtnActive : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Student profile menu"
        title={`${studentName} (${rollNumber})`}
      >
        <div className={styles.avatarCircle}>
          {profilePhoto && !photoError ? (
            <img
              src={profilePhoto}
              alt={studentName}
              className={styles.avatarImg}
              onError={() => setPhotoError(true)}
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>
      </button>

      {/* ── Floating LeetCode-Inspired Profile Dropdown ── */}
      {isOpen && (
        <div
          className={styles.dropdownMenu}
          role="menu"
          aria-label="Profile dropdown options"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Section: Large Profile Photo + Name */}
          <div className={styles.popupHeader}>
            <div
              className={styles.largeAvatarWrapper}
              onClick={handleOpenDetails}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleOpenDetails()}
              title="Click to view profile details"
              aria-label="View student details"
            >
              <div className={styles.largeAvatar}>
                {profilePhoto && !photoError ? (
                  <img
                    src={profilePhoto}
                    alt={studentName}
                    className={styles.avatarImg}
                    onError={() => setPhotoError(true)}
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <div className={styles.photoBadge} title="View details">
                {/* Search / eye icon */}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
            </div>

            <span className={styles.studentName} title={studentName}>
              {studentName}
            </span>

            <div className={styles.studentMeta}>
              <span className={styles.roleChip}>Student</span>
              <span>•</span>
              <span>{rollNumber}</span>
            </div>
          </div>

          {/* Subtle Divider */}
          <div className={styles.divider} />

          {/* Menu Options */}
          <div className={styles.menuList}>
            {/* View Profile */}
            <button
              type="button"
              className={styles.menuItem}
              onClick={handleOpenDetails}
              role="menuitem"
            >
              <span className={styles.menuIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <span>View Profile</span>
              <span className={styles.menuArrow}>›</span>
            </button>

            {/* Logout Option (only if onLogout provided) */}
            {typeof onLogout === 'function' && (
              <>
                <div className={styles.divider} />
                <button
                  type="button"
                  className={`${styles.menuItem} ${styles.logoutItem}`}
                  onClick={() => {
                    setIsOpen(false);
                    onLogout();
                  }}
                  role="menuitem"
                >
                  <span className={styles.menuIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  </span>
                  <span>Sign Out</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Student Details Modal / Panel ── */}
      {isDetailsOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setIsDetailsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="student-profile-title"
        >
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Header */}
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <div className={styles.headerIconBox}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                </div>
                <div>
                  <h3 id="student-profile-title" className={styles.modalTitle}>
                    Student Profile
                  </h3>
                  <p className={styles.modalSubtitle}>Institutional Record</p>
                </div>
              </div>

              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsDetailsOpen(false)}
                aria-label="Close profile details"
                title="Close (Esc)"
              >
                &times;
              </button>
            </div>

            {/* Profile Hero Header */}
            <div className={styles.modalHero}>
              <div className={styles.modalAvatar}>
                {profilePhoto && !photoError ? (
                  <img
                    src={profilePhoto}
                    alt={studentName}
                    className={styles.avatarImg}
                    onError={() => setPhotoError(true)}
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              <div className={styles.modalStudentName}>{studentName}</div>
              <span className={styles.modalTag}>
                {department} • Undergraduate Student
              </span>
            </div>

            {/* Structured Details Grid */}
            <div className={styles.detailsGrid}>
              {/* 1. Roll Number */}
              <div className={styles.detailRow}>
                <div className={styles.detailLabelGroup}>
                  <div className={styles.detailIcon}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <line x1="6" y1="8" x2="10" y2="8" />
                      <line x1="6" y1="12" x2="14" y2="12" />
                      <line x1="6" y1="16" x2="10" y2="16" />
                    </svg>
                  </div>
                  <span className={styles.detailLabel}>Roll Number</span>
                </div>
                <span className={styles.detailValue}>
                  {rollNumber || 'Not available'}
                </span>
              </div>

              {/* 2. Full Name */}
              <div className={styles.detailRow}>
                <div className={styles.detailLabelGroup}>
                  <div className={styles.detailIcon}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <span className={styles.detailLabel}>Name</span>
                </div>
                <span className={styles.detailValue}>
                  {studentName || 'Not available'}
                </span>
              </div>

              {/* 3. Institutional Email */}
              <div className={styles.detailRow}>
                <div className={styles.detailLabelGroup}>
                  <div className={styles.detailIcon}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <span className={styles.detailLabel}>Email</span>
                </div>
                <span className={styles.detailValue}>
                  {email || 'Not available'}
                </span>
              </div>

              {/* 4. CGPA (Visually Distinct) */}
              <div className={`${styles.detailRow} ${styles.cgpaRow}`}>
                <div className={styles.detailLabelGroup}>
                  <div className={styles.detailIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                  <span className={styles.detailLabel}>CGPA</span>
                </div>
                <div className={styles.cgpaBadge}>
                  <span>{cleanCgpaNum}</span>
                  <span className={styles.cgpaScale}>/ 10</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.modalCloseAction}
                onClick={() => setIsDetailsOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
