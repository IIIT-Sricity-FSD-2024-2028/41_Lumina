/**
 * TopNavbar
 *
 * The shared top navigation bar used by ALL authenticated role pages.
 *
 * This is the React equivalent of the duplicated navbar HTML found across:
 *   - faculty_home.html + faculty_common.css (Faculty)
 *   - Dean1_layout.js renderNavbar() + Dean1_shared.css (Dean1 / AD1)
 *   - Dean2_index.html + Dean2_styles.css (Dean2 / AD2)
 *   - student_navbar.html + student_style.css (Student)
 *   - super_user.html header + super_user.css (Super User)
 *   - admin_portal.html header (Admin / SPOC)
 *
 * Shared structure across ALL roles:
 *   [Logo | Lumina wordmark] [Nav links (role-specific)] [Bell | User name/dept | Avatar | Sign Out]
 *
 * Props:
 *   navLinks      {Array<{label, to}>} - Page links for this role
 *   notifications {Array<{id, text, time, type}>} - Notification items (role page provides these)
 *   title         {string}             - Optional role label shown below user name
 *
 * Usage (Dean2 example):
 *   const dean2Links = [
 *     { label: 'Home', to: '/dean2' },
 *     { label: 'Academic Terms & Policies', to: '/dean2/policies' },
 *     { label: 'Enrollment Configuration', to: '/dean2/enrollment' },
 *     { label: 'Override Requests', to: '/dean2/overrides' },
 *     { label: 'Enrollment Analytics', to: '/dean2/analytics' },
 *   ];
 *   <TopNavbar navLinks={dean2Links} notifications={[]} />
 */
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../ui/UserAvatar';
import styles from './TopNavbar.module.css';

export default function TopNavbar({ navLinks = [], notifications = [] }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);

  const hasUnread = notifications.length > 0;
  const displayName = user?.Full_Name || user?.User_ID || 'User';
  // Derive a short role label for the sub-line under the user name
  const roleLabel = user?.Role
    ? user.Role.replace(/_/g, ' ').replace('Assistant', 'Asst.')
    : '';

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function toggleNotif() {
    setNotifOpen((prev) => !prev);
  }

  function closeNotif() {
    setNotifOpen(false);
  }

  return (
    <header className={styles.navbar}>
      {/* ── Left: Logo ── */}
      <div className={styles.navLeft}>
        <NavLink to="/" className={styles.brand}>
          <img
            src="/assets/icons/logo.svg"
            alt="Lumina"
            className={styles.brandLogo}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <span>Lumina</span>
        </NavLink>

        {/* ── Center: Nav links (role-specific) ── */}
        {navLinks.length > 0 && (
          <nav className={styles.navLinks} aria-label="Main navigation">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
                end={link.end}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        )}
      </div>

      {/* ── Right: Bell + User + Logout ── */}
      <div className={styles.navRight}>

        {/* Notification Bell */}
        <div className={styles.bellWrapper}>
          <button
            type="button"
            className={styles.bellBtn}
            onClick={toggleNotif}
            aria-label={hasUnread ? `${notifications.length} notifications` : 'No new notifications'}
            aria-expanded={notifOpen}
          >
            <img
              src="/assets/icons/bell.svg"
              alt=""
              className={styles.bellIcon}
              aria-hidden="true"
            />
            {hasUnread && (
              <span className={styles.bellDot} aria-hidden="true" />
            )}
          </button>

          {/* Notification Dropdown */}
          {notifOpen && (
            <>
              {/* Click-outside overlay */}
              <div className={styles.notifOverlay} onClick={closeNotif} aria-hidden="true" />
              <div className={styles.notifPopup} role="region" aria-label="Notifications">
                <div className={styles.notifHeader}>
                  <span>System Alerts</span>
                  <button
                    type="button"
                    className={styles.notifClose}
                    onClick={closeNotif}
                    aria-label="Close notifications"
                  >
                    &times;
                  </button>
                </div>
                <ul className={styles.notifList}>
                  {notifications.length === 0 ? (
                    <li className={styles.notifEmpty}>
                      <span>🔕</span>
                      <span>No new notifications</span>
                    </li>
                  ) : (
                    notifications.map((n) => (
                      <li key={n.id} className={styles.notifItem}>
                        <span
                          className={`${styles.notifDot} ${
                            n.type === 'error'
                              ? styles.dotRed
                              : n.type === 'warning'
                              ? styles.dotYellow
                              : styles.dotGreen
                          }`}
                          aria-hidden="true"
                        />
                        <div>
                          <div className={styles.notifText}>{n.text}</div>
                          <div className={styles.notifTime}>{n.time}</div>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </>
          )}
        </div>

        {/* User Info + Avatar */}
        <div className={styles.userInfo}>
          <div className={styles.userText}>
            <span className={styles.userName}>{displayName}</span>
            {roleLabel && <span className={styles.userRole}>{roleLabel}</span>}
          </div>
          <UserAvatar name={displayName} size="md" />
        </div>

        {/* Sign Out */}
        <button
          type="button"
          className={styles.logoutBtn}
          onClick={handleLogout}
          title="Sign Out"
          aria-label="Sign Out"
        >
          <span className={styles.logoutText}>Sign Out</span>
          <img
            src="/assets/icons/logout.svg"
            alt=""
            className={styles.logoutIcon}
            aria-hidden="true"
          />
        </button>
      </div>
    </header>
  );
}
