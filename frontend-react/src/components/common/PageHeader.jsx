/**
 * PageHeader
 *
 * A common page title + optional subtitle block used at the top of
 * authenticated role dashboards.
 *
 * Legacy references:
 *   - Dean2: .page-header h1 + p pattern in Dean2_index.html
 *   - Faculty: .welcome-block h1 + p in faculty_home.html
 *   - Dean1: section heading patterns in Dean1_dashboard.html
 *
 * Props:
 *   title    {string} - Main page heading (required)
 *   subtitle {string} - Optional description line below the title
 *   actions  {node}   - Optional right-aligned action buttons/controls
 */
import styles from './PageHeader.module.css';

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className={styles.pageHeader}>
      <div className={styles.textGroup}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
