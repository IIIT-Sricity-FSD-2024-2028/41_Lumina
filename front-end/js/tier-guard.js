/**
 * Lumina SaaS Tier Guard (js/tier-guard.js)
 * 
 * Enforces dynamic multi-tenant subscription plan feature gates across all
 * role dashboards (Student, Faculty, Dean, Assistant Dean).
 * 
 * Plan Levels:
 * 1. Starter    -> Basic registration, grade view. (Locked: Overrides, Analytics, Roadmaps)
 * 2. Campus     -> Basic + Overrides + Analytics + Roadmaps. (Locked: Enterprise Audit Logs)
 * 3. Enterprise -> Full platform access unlocked.
 */

(function () {
  'use strict';

  const TIER_HIERARCHY = {
    Starter: 1,
    Campus: 2,
    Enterprise: 3,
  };

  const API_BASE = 'http://localhost:3000';

  /**
   * Reads current active tier from localStorage or backend
   */
  function getActiveTier() {
    return localStorage.getItem('Lumina_Active_Tier') || 'Enterprise';
  }

  /**
   * Sets active tier and notifies listeners
   */
  function setActiveTier(tier) {
    if (TIER_HIERARCHY[tier]) {
      localStorage.setItem('Lumina_Active_Tier', tier);
      window.dispatchEvent(new CustomEvent('lumina-tier-changed', { detail: { tier } }));
    }
  }

  /**
   * Checks if active tier satisfies required tier
   */
  function hasAccess(requiredTier) {
    const current = getActiveTier();
    const currentLevel = TIER_HIERARCHY[current] || 3;
    const requiredLevel = TIER_HIERARCHY[requiredTier] || 1;
    return currentLevel >= requiredLevel;
  }

  /**
   * Injects lock card CSS into the page head if not already present
   */
  function injectStyles() {
    if (document.getElementById('lumina-tier-guard-styles')) return;
    const style = document.createElement('style');
    style.id = 'lumina-tier-guard-styles';
    style.textContent = `
      .tier-lock-banner {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 48px 24px;
        text-align: center;
        margin: 24px auto;
        max-width: 720px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        font-family: 'Inter', system-ui, sans-serif;
      }
      .tier-lock-icon-box {
        width: 56px;
        height: 56px;
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px;
        font-size: 24px;
      }
      .tier-lock-pill {
        display: inline-block;
        padding: 4px 12px;
        background: #f1f5f9;
        color: #475569;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        border-radius: 20px;
        margin-bottom: 12px;
      }
      .tier-lock-pill.campus {
        background: #e0e7ff;
        color: #3730a3;
      }
      .tier-lock-pill.enterprise {
        background: #fef3c7;
        color: #92400e;
      }
      .tier-lock-title {
        font-size: 1.35rem;
        font-weight: 800;
        color: #0f172a;
        margin-bottom: 8px;
      }
      .tier-lock-desc {
        font-size: 0.925rem;
        color: #64748b;
        max-width: 540px;
        margin: 0 auto 20px;
        line-height: 1.5;
      }
      .tier-lock-perks {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 16px 20px;
        text-align: left;
        max-width: 480px;
        margin: 0 auto 24px;
      }
      .tier-lock-perks-title {
        font-size: 0.8rem;
        font-weight: 700;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin-bottom: 8px;
      }
      .tier-lock-perks-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .tier-lock-perks-list li {
        font-size: 0.85rem;
        color: #334155;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .tier-lock-perks-list li::before {
        content: "✓";
        color: #2563eb;
        font-weight: 700;
      }
      .tier-lock-footer-hint {
        font-size: 0.82rem;
        color: #94a3b8;
      }
      .tier-lock-nav-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 0.7rem;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
        background: #fef3c7;
        color: #b45309;
        margin-left: 6px;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Enforces feature gating on a specific container
   */
  function enforceFeatureGate({
    containerId,
    requiredTier,
    featureName,
    featureDescription,
    perks = [],
  }) {
    injectStyles();
    const container = document.getElementById(containerId);
    if (!container) return;

    const currentTier = getActiveTier();
    const allowed = hasAccess(requiredTier);

    if (!allowed) {
      const perksHtml = perks.length > 0
        ? `
          <div class="tier-lock-perks">
            <div class="tier-lock-perks-title">Included in ${requiredTier} Plan:</div>
            <ul class="tier-lock-perks-list">
              ${perks.map(p => `<li>${p}</li>`).join('')}
            </ul>
          </div>
        `
        : '';

      container.innerHTML = `
        <div class="tier-lock-banner">
          <div class="tier-lock-icon-box">🔒</div>
          <span class="tier-lock-pill ${requiredTier.toLowerCase()}">${requiredTier} Plan Required</span>
          <h2 class="tier-lock-title">${featureName} is Restricted</h2>
          <p class="tier-lock-desc">
            ${featureDescription || `This module is part of the Lumina <strong>${requiredTier}</strong> subscription.`}
            Your university tenant is currently operating on the <strong>${currentTier} Plan</strong>.
          </p>
          ${perksHtml}
          <div class="tier-lock-footer-hint">
            To unlock this module, have your Academic Dean or Lumina Super User upgrade your institutional subscription tier.
          </div>
        </div>
      `;
    }
  }

  // Initialize and check backend active tier asynchronously
  async function syncWithBackend() {
    try {
      const res = await fetch(`${API_BASE}/revenue/tier`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.activeTier) {
          localStorage.setItem('Lumina_Active_Tier', data.activeTier);
        }
      }
    } catch {
      // Offline fallback: keep localStorage value
    }
  }

  // Auto-sync on script load
  syncWithBackend();

  // Export globally
  window.LuminaTierGuard = {
    getActiveTier,
    setActiveTier,
    hasAccess,
    enforceFeatureGate,
  };
})();
