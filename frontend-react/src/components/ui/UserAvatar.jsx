/**
 * UserAvatar
 *
 * Renders a circular avatar with auto-generated initials from the user's name.
 * Matches the .navbar-avatar pattern used in faculty_common.css and
 * the .avatar pattern in Dean2_styles.css / super_user.css.
 *
 * Props:
 *   name      {string} - Full name (e.g. "Manoj Kumar" -> "MK")
 *   size      {string} - 'sm' | 'md' | 'lg' (default: 'md')
 *   className {string} - Extra CSS class
 */
import styles from './UserAvatar.module.css';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function UserAvatar({ name = '', size = 'md', className = '' }) {
  const initials = getInitials(name);

  return (
    <div
      className={`${styles.avatar} ${styles[size] || ''} ${className}`}
      title={name}
      aria-label={name ? `${name}'s avatar` : 'User avatar'}
    >
      {initials}
    </div>
  );
}
