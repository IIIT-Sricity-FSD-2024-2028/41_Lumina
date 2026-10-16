/**
 * FormGroup — label + input/select wrapper + optional error message.
 */
import styles from './FormGroup.module.css';

export default function FormGroup({ label, error, children }) {
  return (
    <div className={`${styles.group} ${error ? styles.invalid : ''}`}>
      <label className={styles.label}>{label}</label>
      {children}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
