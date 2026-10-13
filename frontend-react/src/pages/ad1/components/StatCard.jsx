/**
 * StatCard — single stat card with icon, label, and value.
 */
import styles from './StatCard.module.css';

const COLOR_MAP = {
  blue:  styles.iconBlue,
  green: styles.iconGreen,
  red:   styles.iconRed,
  amber: styles.iconAmber,
};

export default function StatCard({ icon, label, value, color = 'blue' }) {
  return (
    <div className={styles.card}>
      {icon && (
        <div className={`${styles.icon} ${COLOR_MAP[color] || ''}`}>{icon}</div>
      )}
      <div>
        <div className={styles.label}>{label}</div>
        <div className={styles.value}>{value}</div>
      </div>
    </div>
  );
}

/**
 * StatCardsRow — grid container for StatCards.
 */
export function StatCardsRow({ children }) {
  return <section className={styles.grid}>{children}</section>;
}
