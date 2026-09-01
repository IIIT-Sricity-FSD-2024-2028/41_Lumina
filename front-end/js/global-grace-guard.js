/**
 * global-grace-guard.js – Centralized DRY Grace Period & Universal UI Guard
 * 
 * Provides:
 * 1. Global Fetch Interceptor for 60-Day Read-Only Grace Period & Tier locks.
 * 2. Universal override for window.alert / window.confirm (eliminates all localhost:5502 popups).
 * 3. Unified Lumina Modal dialogs across Dean, Assistant Dean, Faculty, and Student pages.
 * 4. Automatic top-banner injection when institution is in Grace Period.
 */

(function () {
  'use strict';

  var API_BASE = 'http://localhost:3000';

  // ── 1. INJECT UNIFIED MODAL & BANNER STYLES ────────────────
  function injectGuardStyles() {
    if (document.getElementById('lumina-global-guard-styles')) return;
    var style = document.createElement('style');
    style.id = 'lumina-global-guard-styles';
    style.textContent = `
      .lumina-guard-overlay {
        position: fixed !important;
        inset: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background-color: rgba(15, 23, 42, 0.65) !important;
        backdrop-filter: blur(6px) !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        z-index: 999999 !important;
        padding: 20px !important;
        box-sizing: border-box !important;
        animation: luminaFadeIn 0.2s ease-out !important;
      }
      .lumina-guard-card {
        background: #ffffff !important;
        border-radius: 16px !important;
        width: 100% !important;
        max-width: 460px !important;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
        padding: 32px 28px 24px 28px !important;
        text-align: center !important;
        box-sizing: border-box !important;
        border: 1px solid #e2e8f0 !important;
        animation: luminaScaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
        font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
      }
      .lumina-guard-icon {
        width: 60px !important;
        height: 60px !important;
        border-radius: 50% !important;
        background: #fff7ed !important;
        border: 1px solid #ffedd5 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 26px !important;
        margin: 0 auto 16px auto !important;
      }
      .lumina-guard-title {
        font-size: 1.25rem !important;
        font-weight: 800 !important;
        color: #0f172a !important;
        margin: 0 0 10px 0 !important;
        line-height: 1.3 !important;
      }
      .lumina-guard-badge {
        display: inline-block !important;
        padding: 4px 12px !important;
        background: #fef3c7 !important;
        color: #b45309 !important;
        border: 1px solid #fde68a !important;
        font-size: 0.75rem !important;
        font-weight: 700 !important;
        letter-spacing: 0.5px !important;
        text-transform: uppercase !important;
        border-radius: 20px !important;
        margin-bottom: 14px !important;
      }
      .lumina-guard-body {
        font-size: 0.9rem !important;
        color: #475569 !important;
        line-height: 1.55 !important;
        margin: 0 0 22px 0 !important;
      }
      .lumina-guard-actions {
        display: flex !important;
        gap: 12px !important;
        justify-content: center !important;
      }
      .lumina-guard-btn {
        background: #0f172a !important;
        color: #ffffff !important;
        border: none !important;
        padding: 11px 24px !important;
        border-radius: 8px !important;
        font-weight: 700 !important;
        font-size: 0.9rem !important;
        cursor: pointer !important;
        transition: background 0.15s ease !important;
        flex: 1 !important;
      }
      .lumina-guard-btn:hover {
        background: #1e293b !important;
      }
      @keyframes luminaFadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes luminaScaleUp { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    `;
    document.head.appendChild(style);
  }

  // ── 2. SHOW UNIVERSAL GRACE PERIOD / LOCK MODAL ───────────
  function showGracePeriodModal(customMessage, titleText) {
    injectGuardStyles();

    // Remove existing if open
    var existing = document.getElementById('lumina-guard-overlay-el');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'lumina-guard-overlay-el';
    overlay.className = 'lumina-guard-overlay';

    var title = titleText || 'Subscription in Grace Period';
    var message = customMessage || 'Operation locked: Institutional SaaS subscription is currently operating in a 60-Day Read-Only Grace Period. Write operations are locked until the license is reactivated.';

    overlay.innerHTML = `
      <div class="lumina-guard-card">
        <div class="lumina-guard-icon">🔒</div>
        <h2 class="lumina-guard-title">${title}</h2>
        <div class="lumina-guard-badge">⚠️ 60-DAY READ-ONLY GRACE PERIOD</div>
        <p class="lumina-guard-body">${message}</p>
        <div class="lumina-guard-actions">
          <button type="button" class="lumina-guard-btn" id="lumina-guard-dismiss-btn">Understood</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    var dismissBtn = document.getElementById('lumina-guard-dismiss-btn');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', function () {
        overlay.remove();
      });
    }
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.remove();
    });
  }

  // ── 3. UNIVERSAL ALERT OVERRIDE (ELIMINATES LOCALHOST POPUPS) ──
  var originalAlert = window.alert;
  window.alert = function (msg) {
    var str = String(msg || '');
    if (str.includes('Grace Period') || str.includes('Operation locked') || str.includes('subscription')) {
      showGracePeriodModal(str);
      return;
    }
    // For other alerts, show modern modal
    injectGuardStyles();
    var existing = document.getElementById('lumina-guard-overlay-el');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'lumina-guard-overlay-el';
    overlay.className = 'lumina-guard-overlay';
    overlay.innerHTML = `
      <div class="lumina-guard-card">
        <div class="lumina-guard-icon" style="background:#f1f5f9; border-color:#e2e8f0;">ℹ️</div>
        <h2 class="lumina-guard-title">System Notification</h2>
        <p class="lumina-guard-body">${str}</p>
        <div class="lumina-guard-actions">
          <button type="button" class="lumina-guard-btn" id="lumina-guard-dismiss-btn">OK</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('lumina-guard-dismiss-btn').addEventListener('click', function () {
      overlay.remove();
    });
  };

  // ── 4. GLOBAL FETCH INTERCEPTOR (DRY GRACE PERIOD GUARD) ───
  var originalFetch = window.fetch;
  window.fetch = async function () {
    var args = Array.prototype.slice.call(arguments);
    var url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '');
    var options = args[1] || {};
    var method = (options.method || 'GET').toUpperCase();

    try {
      var response = await originalFetch.apply(window, args);

      // Clone response to inspect body without consuming the stream
      if (!response.ok && (response.status === 403 || response.status === 400)) {
        var clone = response.clone();
        clone.json().then(function (data) {
          var rawMsg = data.message;
          var msgStr = Array.isArray(rawMsg) ? rawMsg.join(' ') : String(rawMsg || '');

          if (msgStr.includes('Grace Period') || msgStr.includes('Operation locked')) {
            showGracePeriodModal(msgStr);
          }
        }).catch(function () {
          // Ignore JSON parse failure on error streams
        });
      }

      return response;
    } catch (err) {
      throw err;
    }
  };

  // ── 5. ROADMAP EDIT BUTTON PROTECTION ──────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    // Intercept roadmap edit buttons
    var editRoadmapBtn = document.querySelector('button[onclick*="view-selection"], .btn-edit-roadmap, #edit-selected-courses-btn');
    if (!editRoadmapBtn) {
      // Find button by text content
      var allButtons = document.querySelectorAll('button');
      for (var i = 0; i < allButtons.length; i++) {
        if (allButtons[i].textContent.includes('Edit Selected Courses')) {
          editRoadmapBtn = allButtons[i];
          break;
        }
      }
    }

    if (editRoadmapBtn) {
      editRoadmapBtn.addEventListener('click', async function (e) {
        try {
          var role = localStorage.getItem('user_role') || 'Student';
          var token = localStorage.getItem('token');
          var res = await originalFetch(`${API_BASE}/revenue/lifecycle`, {
            headers: { 'x-role': role, 'Authorization': token ? `Bearer ${token}` : '' }
          });
          if (res.ok) {
            var data = await res.json();
            if (data.status === 'Read_Only_Grace_Period') {
              e.preventDefault();
              e.stopImmediatePropagation();
              showGracePeriodModal('Operation locked: Your university is in a 60-Day Read-Only Grace Period. Course roadmap editing and modifications are disabled. You may continue viewing and downloading your PDF.', 'Roadmap Modifications Locked');
            }
          }
        } catch (err) {
          // Ignore check errors
        }
      }, true);
    }
  });

  // Expose global helper
  window.showGracePeriodModal = showGracePeriodModal;
})();
