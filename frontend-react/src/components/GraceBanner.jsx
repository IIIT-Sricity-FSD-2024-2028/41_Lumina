import { useState, useEffect } from 'react';
import { revenueService } from '../services/revenue.service';
import styles from './GraceBanner.module.css';

export default function GraceBanner() {
  const [lifecycle, setLifecycle] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check institutional lifecycle state on mount
    revenueService.getActiveTier()
      .then((data) => {
        if (data?.lifecycle) {
          setLifecycle(data.lifecycle);
        }
      })
      .catch(() => {
        // If revenue endpoint fails or server is offline, keep silent
      });
  }, []);

  // 1. If dismissed by user, or not in grace period -> render NOTHING
  if (dismissed || !lifecycle || !lifecycle.isReadOnly) {
    return null;
  }

  const daysLeft = lifecycle.daysRemainingInGrace ?? 60;

  return (
    <div className={styles.graceBanner} role="alert">
      <div className={styles.content}>
        <span className={styles.warningIcon}>⚠️</span>
        <span className={styles.badge}>Institutional Grace Period</span>
        <span>
          Your university subscription is expired. System is in <strong>Read-Only Mode</strong> ({daysLeft} days remaining).
        </span>
      </div>

      <button
        className={styles.closeBtn}
        onClick={() => setDismissed(true)}
        title="Dismiss warning"
      >
        ×
      </button>
    </div>
  );
}
