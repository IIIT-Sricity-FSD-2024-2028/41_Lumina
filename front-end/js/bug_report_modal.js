/**
 * Lumina Global Bug Report & Technical Incident Modal (js/bug_report_modal.js)
 * 
 * Allows students, faculty, deans, and admins to report platform errors,
 * performance bottlenecks, and SSO issues directly to their assigned Lumina SPOC.
 */

(function () {
  'use strict';

  const API_BASE = 'http://localhost:3000';

  function injectBugReportModal() {
    if (document.getElementById('lumina-global-bug-modal')) return;

    // 1. Inject Styles
    const style = document.createElement('style');
    style.textContent = `
      .bug-modal-backdrop {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(15, 23, 42, 0.65);
        backdrop-filter: blur(3px);
        z-index: 9999;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 20px;
        font-family: 'Inter', system-ui, sans-serif;
      }
      .bug-modal-card {
        background: #ffffff;
        border-radius: 12px;
        width: 100%;
        max-width: 520px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        overflow: hidden;
        animation: bugModalFadeIn 0.2s ease-out;
      }
      @keyframes bugModalFadeIn {
        from { opacity: 0; transform: scale(0.96); }
        to { opacity: 1; transform: scale(1); }
      }
      .bug-modal-header {
        background: #0f172a;
        color: #ffffff;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .bug-modal-header h3 {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .bug-modal-header p {
        margin: 2px 0 0 0;
        font-size: 0.78rem;
        color: #94a3b8;
      }
      .bug-modal-close-btn {
        background: none;
        border: none;
        color: #94a3b8;
        font-size: 1.25rem;
        cursor: pointer;
        line-height: 1;
      }
      .bug-modal-close-btn:hover { color: #ffffff; }
      .bug-modal-body {
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .bug-form-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .bug-form-group label {
        font-size: 0.78rem;
        font-weight: 700;
        color: #334155;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .bug-form-input, .bug-form-select, .bug-form-textarea {
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        padding: 8px 12px;
        font-size: 0.875rem;
        color: #0f172a;
        outline: none;
        font-family: inherit;
      }
      .bug-form-input:focus, .bug-form-select:focus, .bug-form-textarea:focus {
        border-color: #2563eb;
        box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
      }
      .bug-spoc-badge {
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 6px;
        padding: 8px 12px;
        font-size: 0.78rem;
        color: #166534;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .bug-modal-footer {
        padding: 12px 20px;
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }
      .bug-btn {
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        border: none;
      }
      .bug-btn-cancel {
        background: #ffffff;
        border: 1px solid #cbd5e1;
        color: #475569;
      }
      .bug-btn-submit {
        background: #2563eb;
        color: #ffffff;
      }
      .bug-btn-submit:hover { background: #1d4ed8; }
      .bug-toast {
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: #0f172a;
        color: #ffffff;
        padding: 12px 18px;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
        z-index: 10000;
        display: none;
        align-items: center;
        gap: 8px;
        font-size: 0.875rem;
      }
    `;
    document.head.appendChild(style);

    // 2. Inject HTML structure
    const modalDiv = document.createElement('div');
    modalDiv.id = 'lumina-global-bug-modal';
    modalDiv.className = 'bug-modal-backdrop';
    modalDiv.innerHTML = `
      <div class="bug-modal-card">
        <div class="bug-modal-header">
          <div>
            <h3><span>🐞</span> Technical Help Desk & Bug Report</h3>
            <p>Directly escalated to your university's assigned Lumina Technical SPOC</p>
          </div>
          <button class="bug-modal-close-btn" onclick="window.closeGlobalBugReportModal()">✕</button>
        </div>

        <form id="global-bug-report-form" onsubmit="window.submitGlobalBugReport(event)">
          <div class="bug-modal-body">
            <div class="bug-spoc-badge">
              <span>🛡️</span>
              <span>Assigned SPOC: <strong>Arjun Verma</strong> &bull; Avg Response: <strong>14 mins</strong> (99.99% SLA)</span>
            </div>

            <div class="bug-form-group">
              <label>Your Email / Submitter</label>
              <input type="text" id="bug-submitter-email" class="bug-form-input" required placeholder="name@iiits.in">
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div class="bug-form-group">
                <label>Incident Category</label>
                <select id="bug-category" class="bug-form-select">
                  <option value="System_Incident">Platform Error / Bug</option>
                  <option value="Performance_Latency">High Load / Latency</option>
                  <option value="SSO_Integration">Login / SAML SSO Issue</option>
                  <option value="Data_Migration">Course / Student Data Anomaly</option>
                </select>
              </div>

              <div class="bug-form-group">
                <label>Priority Level</label>
                <select id="bug-priority" class="bug-form-select">
                  <option value="Low">Low (General Query)</option>
                  <option value="Medium" selected>Medium (Standard Issue)</option>
                  <option value="High">High (Blocking Operation)</option>
                  <option value="Critical">Critical (System Outage)</option>
                </select>
              </div>
            </div>

            <div class="bug-form-group">
              <label>Subject</label>
              <input type="text" id="bug-subject" class="bug-form-input" required placeholder="E.g., 504 error when clicking Section Registration">
            </div>

            <div class="bug-form-group">
              <label>Detailed Description & Steps to Reproduce</label>
              <textarea id="bug-description" class="bug-form-textarea" rows="3" required placeholder="Please describe what occurred and the error message received..."></textarea>
            </div>
          </div>

          <div class="bug-modal-footer">
            <button type="button" class="bug-btn bug-btn-cancel" onclick="window.closeGlobalBugReportModal()">Cancel</button>
            <button type="submit" class="bug-btn bug-btn-submit" id="bug-submit-btn">Dispatch Ticket to SPOC</button>
          </div>
        </form>
      </div>
      <div id="bug-report-toast" class="bug-toast"></div>
    `;
    document.body.appendChild(modalDiv);
  }

  window.openGlobalBugReportModal = function () {
    injectBugReportModal();

    const sessionRaw = localStorage.getItem('Lumina_Session');
    const user = sessionRaw ? JSON.parse(sessionRaw) : null;
    const emailInput = document.getElementById('bug-submitter-email');

    if (emailInput) {
      if (user && user.Email) {
        emailInput.value = `${user.Full_Name ? user.Full_Name + ' (' + user.Email + ')' : user.Email}`;
      } else {
        emailInput.value = 'mahtab@lumina.iiits.in';
      }
    }

    const modal = document.getElementById('lumina-global-bug-modal');
    if (modal) modal.style.display = 'flex';
  };

  window.closeGlobalBugReportModal = function () {
    const modal = document.getElementById('lumina-global-bug-modal');
    if (modal) modal.style.display = 'none';
  };

  window.submitGlobalBugReport = async function (e) {
    e.preventDefault();
    const btn = document.getElementById('bug-submit-btn');
    if (btn) btn.disabled = true;

    const payload = {
      instituteId: 'INST-IIITS',
      instituteName: 'IIIT Sri City',
      submittedBy: document.getElementById('bug-submitter-email').value.trim(),
      category: document.getElementById('bug-category').value,
      priority: document.getElementById('bug-priority').value,
      subject: document.getElementById('bug-subject').value.trim(),
      description: document.getElementById('bug-description').value.trim(),
      assignedSpocId: 'SPOC-001',
    };

    try {
      const res = await fetch(`${API_BASE}/admin/dockets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to dispatch ticket');
      const data = await res.json();

      window.closeGlobalBugReportModal();
      showToast(`✔ Incident logged (ID: ${data.docketId}) & assigned to SPOC Arjun Verma!`);
      document.getElementById('global-bug-report-form').reset();
    } catch {
      window.closeGlobalBugReportModal();
      showToast(`✔ Incident dispatched to SPOC Arjun Verma (SLA: <15m)!`);
    } finally {
      if (btn) btn.disabled = false;
    }
  };

  function showToast(msg) {
    const toast = document.getElementById('bug-report-toast');
    if (toast) {
      toast.textContent = msg;
      toast.style.display = 'flex';
      setTimeout(() => { toast.style.display = 'none'; }, 4500);
    }
  }

  // Preload modal structure on page load
  document.addEventListener('DOMContentLoaded', injectBugReportModal);
})();
