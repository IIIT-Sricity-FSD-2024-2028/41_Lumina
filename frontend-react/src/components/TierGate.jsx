import { useState, useEffect } from 'react';
import { revenueService } from '../services/revenue.service';
import styles from './TierGate.module.css';

// Tier hierarchy rankings
const TIER_RANKS = {
  Starter: 1,
  Campus: 2,
  Enterprise: 3,
};

export default function TierGate({ requiredTier = 'Campus', featureName = 'This feature', children }) {
  const [currentTier, setCurrentTier] = useState('Enterprise'); // Default to Enterprise during dev

  useEffect(() => {
    revenueService.getActiveTier()
      .then((data) => {
        if (data?.tier) {
          setCurrentTier(data.tier);
        }
      })
      .catch(() => {
        // Fallback gracefully
      });
  }, []);

  const currentRank = TIER_RANKS[currentTier] || 1;
  const requiredRank = TIER_RANKS[requiredTier] || 2;

  // 1. Institution has sufficient tier rank -> Render children!
  if (currentRank >= requiredRank) {
    return children;
  }

  // 2. Insufficient tier rank -> Render locked feature card
  return (
    <div className={styles.lockedCard}>
      <div className={styles.lockIcon}>🔒</div>
      <h3 className={styles.title}>{featureName} is Locked</h3>
      <p className={styles.description}>
        This module requires institutional licensing at the <strong>{requiredTier} Tier</strong> or higher.
      </p>

      <div className={styles.tierPills}>
        <span className={`${styles.pill} ${styles.currentPill}`}>
          Current Plan: <strong>{currentTier}</strong>
        </span>
        <span className={`${styles.pill} ${styles.requiredPill}`}>
          Required: <strong>{requiredTier}</strong>
        </span>
      </div>

      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        Please contact your Lumina Institute SPOC or University Administrator to request a plan upgrade.
      </p>
    </div>
  );
}
