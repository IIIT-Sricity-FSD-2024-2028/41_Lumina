/**
 * LoadingSpinner
 *
 * A centered, accessible loading indicator used while API data is being fetched.
 * Legacy had no dedicated spinner — pages simply rendered empty containers.
 * This provides a consistent loading experience across all role pages.
 *
 * Props:
 *   message {string} - Optional loading text (default: 'Loading...')
 *   size    {string} - 'sm' | 'md' | 'lg' (default: 'md')
 */
import styles from './LoadingSpinner.module.css';

export default function LoadingSpinner({ message = 'Loading...', size = 'md' }) {
  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      <div className={`${styles.spinner} ${styles[size] || ''}`} aria-hidden="true" />
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
}
