import { useState, useEffect, useMemo } from 'react';
import Dean2Layout from './Dean2Layout';
import TierGate from '../../components/TierGate';
import { overridesService } from '../../services/overrides.service';
import { usersService } from '../../services/users.service';
import { coursesService } from '../../services/courses.service';
import toast from 'react-hot-toast';
import styles from './Dean2.module.css';

function formatDateShort(dtStr) {
  if (!dtStr) return '';
  const d = new Date(dtStr);
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Dean2Overrides() {
  const [loading, setLoading] = useState(true);
  const [overridesList, setOverridesList] = useState([]);
  const [activeRequest, setActiveRequest] = useState(null);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All Departments');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [ovRes, usrRes, crsRes] = await Promise.allSettled([
          overridesService.getAll(),
          usersService.getAll(),
          coursesService.getAll(),
        ]);

        let rawOverrides = [];
        let usersMap = {};
        let coursesMap = {};

        if (ovRes.status === 'fulfilled' && Array.isArray(ovRes.value)) {
          rawOverrides = ovRes.value;
        }
        if (usrRes.status === 'fulfilled' && Array.isArray(usrRes.value)) {
          usrRes.value.forEach((u) => {
            usersMap[u.userId || u.User_ID] = u;
          });
        }
        if (crsRes.status === 'fulfilled' && Array.isArray(crsRes.value)) {
          crsRes.value.forEach((c) => {
            coursesMap[c.courseId || c.Course_ID] = c;
          });
        }

        const mapped = rawOverrides.map((r) => {
          const sid = r.studentId || r.Student_ID;
          const cid = r.courseId || r.Course_ID;
          const student = usersMap[sid] || {};
          const course = coursesMap[cid] || {};
          return {
            id: r.requestId || r.id || r.Request_ID,
            name: student.fullName || student.Full_Name || 'Unknown Student',
            sid: sid || 'N/A',
            dept: student.deptId || student.Dept_ID || 'Unknown',
            year: student.year || 'N/A',
            course: `${cid} (${course.courseName || course.Course_Name || 'Unknown'})`,
            reason: r.reason || r.Reason || '',
            date: formatDateShort(r.createdAt || r.Created_At),
            status: r.approvalStatus || r.Approval_Status || 'Pending',
          };
        });

        mapped.sort((a, b) => Number(b.id) - Number(a.id));
        setOverridesList(mapped);

        // Auto-select first request if available
        if (mapped.length > 0) {
          setActiveRequest(mapped[0]);
        }
      } catch (err) {
        console.error('Failed to load overrides data:', err);
        toast.error('Failed to load override requests');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    let list = overridesList;
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (r) => r.name.toLowerCase().includes(q) || r.sid.toLowerCase().includes(q)
      );
    }
    if (deptFilter !== 'All Departments') {
      list = list.filter((r) => r.dept === deptFilter);
    }
    if (statusFilter !== 'All Status') {
      list = list.filter((r) => r.status === statusFilter);
    }
    return list;
  }, [overridesList, search, deptFilter, statusFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const pending = overridesList.filter((r) => r.status === 'Pending').length;
    const approved = overridesList.filter((r) => r.status === 'Approved').length;
    const rejected = overridesList.filter((r) => r.status === 'Rejected').length;
    return { pending, approved, rejected };
  }, [overridesList]);

  // Insights
  const insights = useMemo(() => {
    const total = overridesList.length;
    const cseCnt = overridesList.filter((r) => r.dept === 'CSE').length;
    const cfCnt = overridesList.filter((r) => r.reason.toLowerCase().includes('course full')).length;
    const csePct = total > 0 ? Math.round((cseCnt / total) * 100) : 0;
    const cfPct = total > 0 ? Math.round((cfCnt / total) * 100) : 0;
    const pending = overridesList.filter((r) => r.status === 'Pending').length;

    return { total, cseCnt, csePct, cfPct, pending };
  }, [overridesList]);

  // Handle Approve / Reject
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      setActionLoading(true);
      await overridesService.updateStatus(id, newStatus);
      toast.success(`Request OR-${id} ${newStatus.toLowerCase()} successfully`);

      setOverridesList((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );

      if (activeRequest && activeRequest.id === id) {
        setActiveRequest((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error('Failed to update override status:', err);
      toast.error(err.response?.data?.message || `Failed to update status to ${newStatus}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestMoreInfo = (id) => {
    toast.success(`📧 A request for more information has been sent to the student regarding OR-${id}.`, {
      duration: 4000,
    });
  };

  return (
    <Dean2Layout>
      <TierGate requiredTier="Campus" featureName="Override Requests &amp; Interventions">
        <div className={styles.pageHeader}>
          <h1>Override Requests</h1>
          <p>Review and manage student enrollment exception requests.</p>
        </div>

        <div className={styles.overridesLayout}>
          {/* LEFT COLUMN */}
          <div>
            {/* Filters Bar */}
            <div className={styles.filtersBar}>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label htmlFor="searchInput">Search</label>
                <div className={styles.filterSearchWrap}>
                  <span className={styles.searchIcon}>🔍</span>
                  <input
                    type="text"
                    id="searchInput"
                    placeholder="Student Name or ID"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={styles.formControl}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="deptFilter">Department</label>
                <select
                  id="deptFilter"
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className={styles.formControlSelect}
                >
                  <option value="All Departments">All Departments</option>
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="AIDS">AIDS</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="statusFilter">Status</label>
                <select
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={styles.formControlSelect}
                >
                  <option value="All Status">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                style={{ height: '42px', flexShrink: 0 }}
                onClick={() => {}}
              >
                Filter
              </button>
            </div>

            {/* Overrides Table */}
            <div className={styles.overridesTableCard}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Dept / Course</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--d2-text-muted)', padding: '2rem' }}>
                        {loading ? 'Loading requests...' : 'No requests match your filters.'}
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req) => {
                      const isSelected = activeRequest && activeRequest.id === req.id;
                      const statusClass =
                        req.status === 'Pending'
                          ? styles.badgePending
                          : req.status === 'Approved'
                          ? styles.badgeActive
                          : styles.badgeRejected;
                      const btnClass = req.status === 'Pending' ? styles.btnPrimary : styles.btnOutline;
                      const btnLabel = req.status === 'Pending' ? 'Review' : 'View';

                      return (
                        <tr
                          key={req.id}
                          style={isSelected ? { background: '#F8FAFF' } : {}}
                          onClick={() => setActiveRequest(req)}
                        >
                          <td>
                            <div style={{ fontWeight: 600 }}>{req.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--d2-text-muted)' }}>{req.sid}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{req.dept}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--d2-text-muted)' }}>
                              {req.course.split(' ')[0]}
                            </div>
                          </td>
                          <td style={{ color: 'var(--d2-text-muted)', fontSize: '0.88rem' }}>
                            {req.reason.split('(')[0].trim()}
                          </td>
                          <td>
                            <span className={`${styles.badge} ${statusClass}`}>{req.status}</span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className={`${styles.btn} ${btnClass} ${styles.btnSm}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveRequest(req);
                              }}
                            >
                              {btnLabel}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Metrics */}
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard} style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
                <div className={styles.metricIcon} style={{ background: '#F59E0B', color: 'white' }}>
                  📋
                </div>
                <div>
                  <div className={styles.metricLabel} style={{ color: '#92400E' }}>
                    Pending
                  </div>
                  <div className={styles.metricValue}>{metrics.pending}</div>
                </div>
              </div>

              <div className={styles.metricCard} style={{ background: '#F0FDF4', borderColor: '#A7F3D0' }}>
                <div className={styles.metricIcon} style={{ background: '#059669', color: 'white' }}>
                  ✓
                </div>
                <div>
                  <div className={styles.metricLabel} style={{ color: '#047857' }}>
                    Approved
                  </div>
                  <div className={styles.metricValue}>{metrics.approved}</div>
                </div>
              </div>

              <div className={styles.metricCard} style={{ background: '#FFF1F2', borderColor: '#FECACA' }}>
                <div className={styles.metricIcon} style={{ background: '#EF4444', color: 'white' }}>
                  ✕
                </div>
                <div>
                  <div className={styles.metricLabel} style={{ color: '#991B1B' }}>
                    Rejected
                  </div>
                  <div className={styles.metricValue}>{metrics.rejected}</div>
                </div>
              </div>
            </div>

            {/* Quick Insights */}
            <div className={styles.card} style={{ marginBottom: 0 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: 'var(--d2-primary)',
                  marginBottom: '1rem',
                }}
              >
                Quick Insights
              </div>
              <ul className={styles.bulletList}>
                <li>
                  CSE Department accounts for <strong>{insights.csePct}%</strong> of all override requests (
                  {insights.cseCnt} of {insights.total}).
                </li>
                <li>
                  &apos;Course Full&apos; is the top reason for override requests (<strong>{insights.cfPct}%</strong> of total).
                </li>
                <li>
                  There are currently <strong>{insights.pending}</strong> pending requests awaiting review.
                </li>
              </ul>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className={styles.overrideSidebar}>
            <div className={styles.sidebarCard}>
              {!activeRequest ? (
                <div className={styles.sidebarEmpty}>
                  <div className={styles.emptyIcon}>📋</div>
                  <p>No Request Selected</p>
                  <p>Click Review or View on any request to see its details here.</p>
                </div>
              ) : (
                <div className={styles.sidebarDetail}>
                  <div className={styles.reviewHeader}>
                    <h3>Review Request</h3>
                    <span
                      className={`${styles.badge} ${
                        activeRequest.status === 'Pending'
                          ? styles.badgePending
                          : activeRequest.status === 'Approved'
                          ? styles.badgeActive
                          : styles.badgeRejected
                      }`}
                    >
                      OR-{activeRequest.id}
                    </span>
                  </div>

                  <div className={styles.sidebarSectionLabel}>Student Information</div>

                  <div className={styles.studentCard}>
                    <div className={styles.studentAvatar}>👤</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--d2-text-dark)' }}>
                        {activeRequest.name}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--d2-text-muted)' }}>
                        {activeRequest.sid} | {activeRequest.dept} | {activeRequest.year}
                      </div>
                    </div>
                  </div>

                  <div className={styles.sidebarSectionLabel}>Request Details</div>

                  <div className={styles.reqDetailItem}>
                    <span className={styles.reqDetailIcon}>📘</span>
                    <div>
                      <div className={styles.reqDetailLabel}>Course</div>
                      <div className={styles.reqDetailValue}>{activeRequest.course}</div>
                    </div>
                  </div>

                  <div className={styles.reqDetailItem}>
                    <span className={styles.reqDetailIcon}>⚠️</span>
                    <div>
                      <div className={styles.reqDetailLabel}>Reason</div>
                      <div className={styles.reqDetailValue}>{activeRequest.reason}</div>
                    </div>
                  </div>

                  <div className={styles.reqDetailItem} style={{ borderBottom: 'none' }}>
                    <span className={styles.reqDetailIcon}>📅</span>
                    <div>
                      <div className={styles.reqDetailLabel}>Requested Date</div>
                      <div className={styles.reqDetailValue}>{activeRequest.date}</div>
                    </div>
                  </div>

                  {/* Resolved Banner if Approved or Rejected */}
                  {activeRequest.status !== 'Pending' && (
                    <div
                      className={styles.resolvedBanner}
                      style={
                        activeRequest.status === 'Approved'
                          ? { background: '#D1FAE5', color: '#065F46', borderColor: '#A7F3D0' }
                          : { background: '#FEE2E2', color: '#991B1B', borderColor: '#FECACA' }
                      }
                    >
                      {activeRequest.status === 'Approved' ? (
                        <strong>✓ This request has been Approved.</strong>
                      ) : (
                        <strong>✕ This request has been Rejected.</strong>
                      )}
                    </div>
                  )}

                  {/* Action Buttons if Pending */}
                  {activeRequest.status === 'Pending' && (
                    <div className={styles.sidebarActions}>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        disabled={actionLoading}
                        onClick={() => handleUpdateStatus(activeRequest.id, 'Approved')}
                      >
                        ✓ Approve Request
                      </button>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnDangerOutline}`}
                        disabled={actionLoading}
                        onClick={() => handleUpdateStatus(activeRequest.id, 'Rejected')}
                      >
                        ✕ Reject Request
                      </button>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnLight}`}
                        disabled={actionLoading}
                        onClick={() => handleRequestMoreInfo(activeRequest.id)}
                      >
                        💬 Request More Info
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </TierGate>
    </Dean2Layout>
  );
}
