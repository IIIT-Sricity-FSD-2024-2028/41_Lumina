import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/admin.service';
import toast from 'react-hot-toast';
import styles from './BugReportModal.module.css';

export default function BugReportModal({ isOpen, onClose }) {
  const { user } = useAuth();

  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('System_Incident');
  const [priority, setPriority] = useState('Medium');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Auto-fill user email/ID if logged in
  useEffect(() => {
    if (user?.Email) {
      setEmail(user.Email);
    } else if (user?.User_ID) {
      setEmail(`${user.User_ID}@lumina.edu`);
    }
  }, [user]);

  // 1. If not open, render nothing
  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await adminService.createDocket({
        submitterEmail: email,
        category,
        priority,
        subject,
        description,
        timestamp: new Date().toISOString(),
      });

      toast.success('Support incident dispatched to assigned SPOC!');
      // Reset form & close
      setSubject('');
      setDescription('');
      onClose();
    } catch (err) {
      console.error('Failed to dispatch docket', err);
      toast.error('Failed to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      {/* Prevent clicks inside the card from closing the modal */}
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h3><span>🐞</span> Technical Help Desk & Bug Report</h3>
            <p>Directly escalated to your university's assigned Lumina Technical SPOC</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className={styles.body}>
            {/* SPOC Info Badge */}
            <div className={styles.spocBadge}>
              <span>🛡️</span>
              <span>Assigned SPOC: <strong>Arjun Verma</strong> &bull; Avg Response: <strong>14 mins</strong> (99.99% SLA)</span>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="bug-email">Your Email / Submitter</label>
              <input
                id="bug-email"
                type="email"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@iiits.in"
                required
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="bug-category">Incident Category</label>
                <select
                  id="bug-category"
                  className={styles.select}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="System_Incident">Platform Error / Bug</option>
                  <option value="Performance_Latency">High Load / Latency</option>
                  <option value="SSO_Integration">Login / SAML SSO Issue</option>
                  <option value="Data_Migration">Course / Student Data Anomaly</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="bug-priority">Priority Level</label>
                <select
                  id="bug-priority"
                  className={styles.select}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="Low">Low (General Query)</option>
                  <option value="Medium">Medium (Standard Issue)</option>
                  <option value="High">High (Blocking Operation)</option>
                  <option value="Critical">Critical (System Outage)</option>
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="bug-subject">Subject</label>
              <input
                id="bug-subject"
                type="text"
                className={styles.input}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="E.g., 504 error when clicking Section Registration"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="bug-desc">Detailed Description</label>
              <textarea
                id="bug-desc"
                className={styles.textarea}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe what occurred and the error message received..."
                required
              />
            </div>
          </div>

          <div className={styles.footer}>
            <button type="button" className="btn-outline" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Dispatching...' : 'Dispatch Ticket to SPOC'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
