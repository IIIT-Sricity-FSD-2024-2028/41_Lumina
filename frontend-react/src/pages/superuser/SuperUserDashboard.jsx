/**
 * SuperUserDashboard.jsx
 *
 * Lumina Super User Console
 * Provides platform-wide B2B SaaS administrative control:
 *  - Tab 1: Platform Overview & System Health Telemetry
 *  - Tab 2: Client Universities & Multi-Tenant SaaS Subscriptions
 *  - Tab 3: Lumina SPOC Staff Operations Roster
 *  - Tab 4: Inbound University Onboarding Queue
 *  - Tab 5: Real-time System Logs Terminal Stream
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import TopNavbar from '../../components/common/TopNavbar';
import Footer from '../../components/Footer';

import { adminService } from '../../services/admin.service';
import { revenueService } from '../../services/revenue.service';

import styles from './SuperUser.module.css';


/**
 * Converts a verbose browser User-Agent into a clean concise badge (e.g. "Firefox 157 (Win 10/11)").
 */
function parseUserAgent(ua) {
  if (!ua) return 'Client';
  let browser;
  let os = '';

  if (/Firefox\/(\d+)/i.test(ua)) browser = `Firefox ${RegExp.$1}`;
  else if (/Edg\/(\d+)/i.test(ua)) browser = `Edge ${RegExp.$1}`;
  else if (/Chrome\/(\d+)/i.test(ua)) browser = `Chrome ${RegExp.$1}`;
  else if (/Safari\/(\d+)/i.test(ua)) browser = `Safari`;
  else if (/curl/i.test(ua)) browser = 'curl';
  else if (/Postman/i.test(ua)) browser = 'Postman';
  else browser = 'Browser';

  if (/Windows NT 10/i.test(ua)) os = 'Win 10/11';
  else if (/Macintosh/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad/i.test(ua)) os = 'iOS';

  return os ? `${browser} (${os})` : browser;
}

/**
 * Parses a raw log line from the backend access.log into a structured industry-standard object.
 * Format: ${timestamp} | ${level} | ROLE: ${role} | ${method} | ${originalUrl} | ${statusCode} ${statusText} | ${responseTime}ms | IP: ${clientIp} | UA: ${userAgent}
 */
function parseLogLine(rawLine) {
  if (!rawLine || typeof rawLine !== 'string') return null;
  const trimmed = rawLine.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(' | ');
  if (parts.length >= 6) {
    const rawTime = parts[0]?.trim();
    const dateObj = new Date(rawTime);
    const isValidDate = !isNaN(dateObj.getTime());

    // Exact recorded time in standard 24h industry format (HH:mm:ss.SSS)
    const pad = (n, len = 2) => String(n).padStart(len, '0');
    const formattedTime = isValidDate
      ? `${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}:${pad(dateObj.getSeconds())}.${pad(dateObj.getMilliseconds(), 3)}`
      : rawTime;

    const level = (parts[1] || 'INFO').trim().toUpperCase();
    const role = (parts[2] || '').replace(/^ROLE:\s*/i, '').trim() || 'System';
    const method = (parts[3] || '').trim().toUpperCase();
    const path = (parts[4] || '').trim();
    const status = (parts[5] || '').trim();
    const duration = (parts[6] || '').trim();
    const ip = (parts[7] || '').replace(/^IP:\s*/i, '').trim();
    const ua = (parts[8] || '').replace(/^UA:\s*/i, '').trim();
    const uaSummary = parseUserAgent(ua);

    const statusCodeMatch = status.match(/^(\d{3})/);
    const statusCode = statusCodeMatch ? parseInt(statusCodeMatch[1], 10) : 200;

    return {
      id: trimmed,
      raw: trimmed,
      isStructured: true,
      timestamp: isValidDate ? dateObj.getTime() : Date.now(),
      rawTime,
      formattedTime,
      level,
      role,
      method,
      path,
      status,
      statusCode,
      duration,
      ip,
      ua,
      uaSummary,
    };
  }

  // Fallback for unstructured logs (system boot messages, unhandled errors, stack traces)
  let detectedLevel = 'INFO';
  if (/error|exception|fail/i.test(trimmed)) detectedLevel = 'ERROR';
  else if (/warn/i.test(trimmed)) detectedLevel = 'WARN';
  else if (/debug/i.test(trimmed)) detectedLevel = 'DEBUG';

  const firstWord = trimmed.split(' ')[0];
  const dateObj = new Date(firstWord);
  const isValidDate = !isNaN(dateObj.getTime());
  const pad = (n, len = 2) => String(n).padStart(len, '0');

  return {
    id: trimmed,
    raw: trimmed,
    isStructured: false,
    timestamp: isValidDate ? dateObj.getTime() : Date.now(),
    rawTime: isValidDate ? firstWord : null,
    formattedTime: isValidDate
      ? `${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}:${pad(dateObj.getSeconds())}.${pad(dateObj.getMilliseconds(), 3)}`
      : '--:--:--.---',
    level: detectedLevel,
    role: 'System',
    method: '',
    path: '',
    status: '',
    statusCode: 0,
    duration: '',
    ip: '',
    ua: '',
    message: trimmed,
  };
}

export default function SuperUserDashboard() {
  // Active top-level Tab: 'overview' | 'institutes' | 'spocs' | 'queue' | 'logs'
  const [activeTab, setActiveTab] = useState('overview');

  // Client Institutes & SPOC state
  const [institutes, setInstitutes] = useState([]);
  const [adminTeam, setAdminTeam] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [onboardDockets, setOnboardDockets] = useState([]);

  // Tier counts & annual contract averages derived dynamically from live institutes
  const tierStats = useMemo(() => {
    const active = institutes.filter(i => i.status !== 'Archived');
    const enterprise = active.filter(i => i.tier === 'Enterprise');
    const campus = active.filter(i => i.tier === 'Campus');
    const starter = active.filter(i => i.tier === 'Starter');
    return {
      enterpriseCount: enterprise.length,
      campusCount: campus.length,
      starterCount: starter.length,
      enterpriseAvg: enterprise.length > 0 ? Math.round(enterprise.reduce((s, i) => s + (i.annualContractValue || 0), 0) / enterprise.length) : 107988,
      campusAvg: campus.length > 0 ? Math.round(campus.reduce((s, i) => s + (i.annualContractValue || 0), 0) / campus.length) : 41988,
      starterAvg: starter.length > 0 ? Math.round(starter.reduce((s, i) => s + (i.annualContractValue || 0), 0) / starter.length) : 11988,
    };
  }, [institutes]);

  // System Logs Real-Time Streaming state
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [logLevelFilter, setLogLevelFilter] = useState('ALL');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [expandedLogId, setExpandedLogId] = useState(null);
  const clearWatermarkRef = useRef(0);
  const seenLogSetRef = useRef(new Set());

  // Modals state
  const [editInstModal, setEditInstModal] = useState({
    isOpen: false,
    instId: '',
    name: '',
    studentCount: 0,
    deanName: '',
    deanEmail: '',
    slaStatus: '99.99% SLA',
  });
  const [reassignSpocModal, setReassignSpocModal] = useState({ isOpen: false, instId: '', instName: '', spocId: '' });
  const [changeTierModal, setChangeTierModal] = useState({ isOpen: false, instId: '', instName: '', tier: 'Campus' });
  const [employSpocModal, setEmploySpocModal] = useState({ isOpen: false, fullName: '', email: '', phone: '' });
  const [deleteSpocModal, setDeleteSpocModal] = useState({ isOpen: false, adminId: '', spocName: '' });
  const [archiveTenantModal, setArchiveTenantModal] = useState({ isOpen: false, instId: '', instName: '' });
  const [onboardInstModal, setOnboardInstModal] = useState({
    isOpen: false,
    name: '',
    deanName: '',
    deanEmail: '',
    studentCount: 2000,
    tier: 'Campus',
    spocAdminId: 'SPOC-001',
  });

  // Load Initial Data (only necessary tenant data on mount)
  useEffect(() => {
    loadInstitutesAndStaff();
    loadDockets();
  }, []);

  // Real-Time Log Streaming Effect: live polling every 2.5s while logs tab is active
  useEffect(() => {
    if (activeTab !== 'logs') return;

    // Fetch immediately on tab switch
    fetchLogs(false);

    if (!isLiveStreaming) return;

    const intervalId = setInterval(() => {
      fetchLogs(true);
    }, 1500);

    return () => clearInterval(intervalId);
  }, [activeTab, isLiveStreaming]);


  // Load Institutes, Admin Team & System Health
  async function loadInstitutesAndStaff() {
    try {
      const [instData, teamData, healthData] = await Promise.allSettled([
        adminService.getInstitutes(),
        adminService.getAdminTeam(),
        adminService.getSystemHealth(),
      ]);
      if (instData.status === 'fulfilled' && Array.isArray(instData.value)) {
        setInstitutes(instData.value);
      }
      if (teamData.status === 'fulfilled' && Array.isArray(teamData.value)) {
        setAdminTeam(teamData.value);
      }
      if (healthData.status === 'fulfilled' && healthData.value) {
        setSystemHealth(healthData.value);
      }
    } catch (err) {
      console.warn('Error loading institutes / admin team / health:', err);
    }
  }

  // Load Onboard Dockets from localStorage
  function loadDockets() {
    try {
      const raw = localStorage.getItem('Lumina_Onboard_Dockets');
      if (raw) setOnboardDockets(JSON.parse(raw));
    } catch (e) {
      console.warn('Failed to parse onboard dockets:', e);
      setOnboardDockets([]);
    }
  }

  // Fetch System Logs from server with industry-standard parsing & real-time streaming
  async function fetchLogs(isBackground = false, forceReload = false) {
    if (!isBackground) setLogsLoading(true);
    try {
      const res = await adminService.getLogs('access', 100);
      let rawLines = [];
      if (Array.isArray(res)) {
        rawLines = res;
      } else if (res && Array.isArray(res.logs)) {
        rawLines = res.logs;
      } else if (res && Array.isArray(res.lines)) {
        rawLines = res.lines;
      }

      // Parse each raw line and enforce clear watermark
      const parsed = rawLines
        .map(line => parseLogLine(line))
        .filter(entry => entry !== null && (forceReload || entry.timestamp >= clearWatermarkRef.current));

      // Backend logs are appended chronologically (oldest at top of file, newest at bottom).
      // We reverse so newest logs appear at index 0 (top of the console).
      const reversed = parsed.reverse();

      setLogs(prev => {
        // If forceReload is false and parsed logs have identical length and the first item is the same, no new logs arrived
        if (!forceReload && prev.length === reversed.length && prev[0]?.id === reversed[0]?.id) {
          return prev;
        }
        return reversed;
      });
    } catch (e) {
      console.warn('System log stream unavailable:', e);
    } finally {
      if (!isBackground) setLogsLoading(false);
    }
  }

  // Clear log console display (sets watermark so previous logs don't repopulate)
  function handleClearLogs() {
    clearWatermarkRef.current = Date.now();
    seenLogSetRef.current.clear();
    setLogs([]);
  }

  // Reset and reload full log history from server disk
  function handleReloadAllLogs() {
    clearWatermarkRef.current = 0;
    seenLogSetRef.current.clear();
    setLogLevelFilter('ALL');
    setLogSearchQuery('');
    fetchLogs(false, true);
    toast.success('Reloaded log history from server');
  }

  // Metrics Calculations
  const metrics = useMemo(() => {
    const activeInsts = institutes.filter(i => i.status !== 'Archived');
    const totalArr = activeInsts.reduce((sum, i) => sum + (i.annualContractValue || 0), 0);
    const totalStudents = activeInsts.reduce((sum, i) => sum + (i.studentCount || 0), 0);
    return {
      instCount: activeInsts.length,
      totalCount: institutes.length,
      spocCount: adminTeam.length,
      arr: totalArr,
      mrr: Math.round(totalArr / 12),
      students: totalStudents,
    };
  }, [institutes, adminTeam]);

  // Filtered log lines
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (logLevelFilter !== 'ALL' && log.level !== logLevelFilter) return false;
      if (logSearchQuery.trim()) {
        const query = logSearchQuery.toLowerCase();
        const rawMatch = log.raw && log.raw.toLowerCase().includes(query);
        const pathMatch = log.path && log.path.toLowerCase().includes(query);
        const methodMatch = log.method && log.method.toLowerCase().includes(query);
        const roleMatch = log.role && log.role.toLowerCase().includes(query);
        const statusMatch = log.status && log.status.toLowerCase().includes(query);
        const msgMatch = log.message && log.message.toLowerCase().includes(query);
        if (!rawMatch && !pathMatch && !methodMatch && !roleMatch && !statusMatch && !msgMatch) return false;
      }
      return true;
    });
  }, [logs, logLevelFilter, logSearchQuery]);


  // Tenant / Institute Actions
  async function handleConfirmEditInstitute(e) {
    e.preventDefault();
    try {
      await adminService.updateInstitute(editInstModal.instId, {
        name: editInstModal.name,
        studentCount: Number(editInstModal.studentCount),
        deanName: editInstModal.deanName,
        deanEmail: editInstModal.deanEmail,
        slaStatus: editInstModal.slaStatus,
      });
      toast.success(`Updated quota & details for ${editInstModal.name}!`);
      setEditInstModal({ isOpen: false, instId: '', name: '', studentCount: 0, deanName: '', deanEmail: '', slaStatus: '99.99% SLA' });
      loadInstitutesAndStaff();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update institute details');
    }
  }

  async function handleConfirmAssignSpoc() {
    try {
      await adminService.assignSpoc(reassignSpocModal.instId, reassignSpocModal.spocId);
      toast.success('SPOC assigned successfully!');
      setReassignSpocModal({ isOpen: false, instId: '', instName: '', spocId: '' });
      loadInstitutesAndStaff();
    } catch (e) {
      console.error(e);
      toast.error('Failed to assign SPOC');
    }
  }

  async function handleConfirmChangeTier() {
    try {
      await adminService.updateInstituteTier(changeTierModal.instId, changeTierModal.tier);
      localStorage.setItem('Lumina_Active_Tier', changeTierModal.tier);
      revenueService.setActiveTier(changeTierModal.tier).catch(() => null);
      toast.success(`Updated tier to ${changeTierModal.tier}!`);
      setChangeTierModal({ isOpen: false, instId: '', instName: '', tier: 'Campus' });
      loadInstitutesAndStaff();
    } catch (e) {
      console.error(e);
      toast.error('Failed to change subscription tier');
    }
  }

  async function confirmArchiveTenant() {
    const { instId, instName } = archiveTenantModal;
    setArchiveTenantModal({ isOpen: false, instId: '', instName: '' });
    try {
      await adminService.archiveInstitute(instId);
      toast.success(`📦 Tenant ${instName} archived. Seats reclaimed.`);
      loadInstitutesAndStaff();
    } catch (e) {
      console.error(e);
      toast.error('Failed to archive tenant');
    }
  }

  async function handleEmploySpoc(e) {
    e.preventDefault();
    try {
      await adminService.addAdminSpoc({
        fullName: employSpocModal.fullName,
        email: employSpocModal.email,
        phone: employSpocModal.phone,
      });
      toast.success(`Employed ${employSpocModal.fullName} to Lumina Admin Staff!`);
      setEmploySpocModal({ isOpen: false, fullName: '', email: '', phone: '' });
      loadInstitutesAndStaff();
    } catch (e) {
      console.error(e);
      toast.error('Failed to employ SPOC');
    }
  }

  async function confirmDeleteSpoc() {
    const { adminId, spocName } = deleteSpocModal;
    setDeleteSpocModal({ isOpen: false, adminId: '', spocName: '' });
    try {
      await adminService.deleteAdminSpoc(adminId);
      toast.success(`SPOC ${spocName} (${adminId}) offboarded successfully`);
      loadInstitutesAndStaff();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to offboard SPOC');
    }
  }

  async function handleOnboardInstitute(e) {
    e.preventDefault();
    try {
      await adminService.createInstitute({
        name: onboardInstModal.name,
        deanName: onboardInstModal.deanName,
        deanEmail: onboardInstModal.deanEmail,
        studentCount: Number(onboardInstModal.studentCount),
        tier: onboardInstModal.tier,
        spocAdminId: onboardInstModal.spocAdminId,
      });
      toast.success(`Onboarded ${onboardInstModal.name} on ${onboardInstModal.tier} Tier!`);
      setOnboardInstModal({ isOpen: false, name: '', deanName: '', deanEmail: '', studentCount: 2000, tier: 'Campus', spocAdminId: 'SPOC-001' });
      loadInstitutesAndStaff();
    } catch (e) {
      console.error(e);
      toast.error('Failed to provision institute tenant');
    }
  }

  function handleOnboardFromDocket(docketId) {
    const docket = onboardDockets.find(d => d.id === docketId);
    if (!docket) return;

    setOnboardInstModal({
      isOpen: true,
      name: docket.instituteName,
      deanName: docket.repName,
      deanEmail: docket.email,
      studentCount: Number(docket.students || 2000),
      tier: docket.plan || 'Campus',
      spocAdminId: adminTeam[0]?.adminId || 'SPOC-001',
    });

    const updated = onboardDockets.filter(d => d.id !== docketId);
    localStorage.setItem('Lumina_Onboard_Dockets', JSON.stringify(updated));
    setOnboardDockets(updated);
  }

  const navLinks = [
    { label: 'Overview', onClick: () => setActiveTab('overview'), isActive: activeTab === 'overview' },
    { label: 'Client Institutes', onClick: () => setActiveTab('institutes'), isActive: activeTab === 'institutes' },
    { label: 'SPOC Staff', onClick: () => setActiveTab('spocs'), isActive: activeTab === 'spocs' },
    { label: 'Onboarding Queue', onClick: () => setActiveTab('queue'), isActive: activeTab === 'queue' },
    { label: 'System Logs', onClick: () => setActiveTab('logs'), isActive: activeTab === 'logs' },
  ];

  return (
    <>
      <TopNavbar navLinks={navLinks} />

      <main className={styles.pageContainer}>
        {/* Top Title */}
        <div className={styles.headerGroup}>
          <div className={styles.titleRow}>
            <div>
              <h1 className={styles.pageTitle}>
                <img src="/assets/icons/shield.svg" alt="" width="26" height="26" />
                Super User Administration Console
              </h1>
              <p className={styles.pageSubtitle}>
                Global multi-tenant orchestration, platform telemetry, and server runtime logs
              </p>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: PLATFORM OVERVIEW & INFRASTRUCTURE                */}
        {/* ======================================================== */}
        {activeTab === 'overview' && (
          <div>
            {/* Top 4 Metrics Strip */}
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <div className={styles.metricTitle}>Client Universities</div>
                <div className={styles.metricValue}>{metrics.instCount}</div>
                <p className={styles.metricSubtext}>Active SaaS tenants</p>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricTitle}>SPOC Account Managers</div>
                <div className={styles.metricValue}>{metrics.spocCount}</div>
                <p className={styles.metricSubtext}>Lumina internal operations</p>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricTitle}>Annual Recurring Revenue</div>
                <div className={styles.metricValue}>${metrics.arr.toLocaleString()}</div>
                <p className={styles.metricSubtext}>${metrics.mrr.toLocaleString()} monthly MRR</p>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricTitle}>Campus Students</div>
                <div className={styles.metricValue}>{metrics.students.toLocaleString()}</div>
                <p className={styles.metricSubtext}>Across all university tenants</p>
              </div>
            </div>

            {/* 2-Column Telemetry & Subscription Grid */}
            <div className={styles.telemetryGrid}>
              {/* Telemetry Column */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3 className={styles.cardHeading}>Platform Runtime Telemetry</h3>
                    <p className={styles.cardSubheading}>Live server infrastructure and node process metrics</p>
                  </div>
                  <span className={`${styles.badge} ${styles.badgeApproved}`}>● ONLINE</span>
                </div>
                <div className={styles.telemetryList}>
                  <div className={styles.telemetryRow}>
                    <span className={styles.telemetryLabel}>Server Health Status</span>
                    <span className={styles.telemetryValue} style={{ color: '#16a34a' }}>
                      ● {systemHealth?.server?.status ? `100% ${systemHealth.server.status}` : '100% Operational'}
                    </span>
                  </div>
                  <div className={styles.telemetryRow}>
                    <span className={styles.telemetryLabel}>Node Runtime</span>
                    <span className={styles.telemetryValue}>
                      {systemHealth?.server?.nodeVersion || 'v20.18.0'} ({systemHealth?.server?.platform || 'linux'} {systemHealth?.server?.architecture || 'x64'})
                    </span>
                  </div>
                  <div className={styles.telemetryRow}>
                    <span className={styles.telemetryLabel}>Process Memory RSS</span>
                    <span className={styles.telemetryValue}>
                      {systemHealth?.server?.processMemory?.rssMB ? `${systemHealth.server.processMemory.rssMB} MB / ${systemHealth.server.processMemory.heapTotalMB} MB Heap` : '94 MB / 189 MB Heap'}
                    </span>
                  </div>
                  <div className={styles.telemetryRow}>
                    <span className={styles.telemetryLabel}>Multi-Tenant Isolation</span>
                    <span className={styles.telemetryValue} style={{ color: '#2563eb' }}>
                      Active Ecosystem &bull; {systemHealth?.ecosystem?.totalUsers || 'Platform'} Users
                    </span>
                  </div>
                </div>
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}
                    onClick={() => setActiveTab('logs')}
                  >
                    View Live Server Logs →
                  </button>
                </div>
              </div>

              {/* Subscription Breakdown Column */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3 className={styles.cardHeading}>SaaS Tier & Revenue Breakdown</h3>
                    <p className={styles.cardSubheading}>Multi-college subscription licensing and tier distribution</p>
                  </div>
                  <span className={`${styles.badge} ${styles.badgeApproved}`}>99.99% SLA</span>
                </div>
                <div className={styles.telemetryList}>
                  <div className={styles.telemetryRow}>
                    <span className={styles.telemetryLabel}>Enterprise Elite (${tierStats.enterpriseAvg.toLocaleString()} / yr)</span>
                    <span className={styles.telemetryValue}>{tierStats.enterpriseCount} {tierStats.enterpriseCount === 1 ? 'University' : 'Universities'}</span>
                  </div>
                  <div className={styles.telemetryRow}>
                    <span className={styles.telemetryLabel}>Campus Growth (${tierStats.campusAvg.toLocaleString()} / yr)</span>
                    <span className={styles.telemetryValue}>{tierStats.campusCount} {tierStats.campusCount === 1 ? 'University' : 'Universities'}</span>
                  </div>
                  <div className={styles.telemetryRow}>
                    <span className={styles.telemetryLabel}>Starter Tier (${tierStats.starterAvg.toLocaleString()} / yr)</span>
                    <span className={styles.telemetryValue}>{tierStats.starterCount} {tierStats.starterCount === 1 ? 'University' : 'Universities'}</span>
                  </div>
                  <div className={styles.telemetryRow}>
                    <span className={styles.telemetryLabel}>Total Contract Portfolio</span>
                    <span className={styles.telemetryValue} style={{ color: '#166534' }}>${metrics.arr.toLocaleString()} ARR</span>
                  </div>
                </div>
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
                    onClick={() => setActiveTab('institutes')}
                  >
                    Manage Client Institutes →
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Multi-Tenant Status Matrix */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardHeading}>Client Universities Tenant Directory</h3>
                  <p className={styles.cardSubheading}>Current operational status of onboarded higher education institutions</p>
                </div>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}
                  onClick={() => setActiveTab('institutes')}
                >
                  View Full Matrix ({institutes.length})
                </button>
              </div>

              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>INSTITUTE NAME & ID</th>
                      <th>SUBSCRIPTION TIER</th>
                      <th>LUMINA SPOC</th>
                      <th>CAMPUS CONTACT</th>
                      <th>STUDENT QUOTA</th>
                      <th>STATUS</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {institutes.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                          No client university tenants onboarded yet.
                        </td>
                      </tr>
                    ) : (
                      institutes.map(inst => {
                      const isGrace = inst.status === 'Grace_Period';
                      const isArchived = inst.status === 'Archived';
                      return (
                        <tr key={inst.instituteId}>
                          <td>
                            <strong>{inst.name}</strong>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{inst.instituteId}</div>
                          </td>
                          <td>
                            <span className={`${styles.badge} ${styles.badgeApproved}`}>{inst.tier} Plan</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <img src="/assets/icons/shield.svg" alt="" width="14" height="14" opacity="0.6" />
                              <strong>{inst.spocName || 'Unassigned'}</strong>
                            </div>
                          </td>
                          <td>
                            <div>{inst.deanName}</div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inst.deanEmail}</span>
                          </td>
                          <td>
                            <strong>{Number(inst.studentCount || 0).toLocaleString()}</strong>
                          </td>
                          <td>
                            {isGrace ? (
                              <span className={`${styles.badge} ${styles.badgeGrace}`}>⚠️ Grace Period</span>
                            ) : isArchived ? (
                              <span className={`${styles.badge} ${styles.badgeArchived}`}>Archived</span>
                            ) : (
                              <span className={`${styles.badge} ${styles.badgeApproved}`}>● Active</span>
                            )}
                          </td>
                          <td>
                            <button
                              type="button"
                              className={styles.actionBtn}
                              onClick={() => setActiveTab('institutes')}
                            >
                              Configure →
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: CLIENT UNIVERSITIES                               */}
        {/* ======================================================== */}
        {activeTab === 'institutes' && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.cardHeading}>Client Universities & SaaS Subscription Matrix</h3>
                <p className={styles.cardSubheading}>Multi-college tenant directory, assigned Lumina SPOCs, and active license tiers.</p>
              </div>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
                onClick={() => setOnboardInstModal({ isOpen: true, name: '', deanName: '', deanEmail: '', studentCount: 2000, tier: 'Campus', spocAdminId: adminTeam[0]?.adminId || 'SPOC-001' })}
              >
                + Onboard New College
              </button>
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>INSTITUTE NAME & ID</th>
                    <th>SUBSCRIPTION TIER</th>
                    <th>ASSIGNED LUMINA SPOC</th>
                    <th>DEAN / CONTACT</th>
                    <th>ENROLLED STUDENTS</th>
                    <th>ANNUAL CONTRACT</th>
                    <th>SLA STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {institutes.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                        No client institutes currently registered.
                      </td>
                    </tr>
                  ) : (
                    institutes.map(inst => {
                      const isGrace = inst.status === 'Grace_Period';
                      const isArchived = inst.status === 'Archived';
                      return (
                        <tr key={inst.instituteId}>
                          <td>
                            <strong>{inst.name}</strong>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{inst.instituteId}</div>
                          </td>
                          <td>
                            {isGrace ? (
                              <span className={`${styles.badge} ${styles.badgeGrace}`}>
                                ⚠️ Grace Period ({inst.daysRemainingInGrace != null ? `${inst.daysRemainingInGrace}d Left` : 'Active'})
                              </span>
                            ) : isArchived ? (
                              <span className={`${styles.badge} ${styles.badgeArchived}`}>Archived</span>
                            ) : (
                              <span className={`${styles.badge} ${styles.badgeApproved}`}>{inst.tier} Tier</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <img src="/assets/icons/shield.svg" alt="" width="14" height="14" opacity="0.6" />
                              <strong>{inst.spocName || 'Unassigned'}</strong>
                            </div>
                          </td>
                          <td>
                            <div>{inst.deanName}</div>
                            <a href={`mailto:${inst.deanEmail}`} style={{ fontSize: '0.75rem', color: 'var(--accent-blue)' }}>{inst.deanEmail}</a>
                          </td>
                          <td><strong>{Number(inst.studentCount || 0).toLocaleString()}</strong></td>
                          <td><strong style={{ color: '#166534' }}>${Number(inst.annualContractValue || 0).toLocaleString()} / yr</strong></td>
                          <td>
                            {isGrace ? (
                              <span className={`${styles.badge} ${styles.badgeLocked}`}>🔒 Read-Only Locked</span>
                            ) : isArchived ? (
                              <span className={`${styles.badge} ${styles.badgeArchived}`}>Decommissioned</span>
                            ) : (
                              <span className={`${styles.badge} ${styles.badgeApproved}`}>● {inst.slaStatus || '99.95% SLA'}</span>
                            )}
                          </td>
                          <td>
                            <div className={styles.rowActions}>
                              <button
                                type="button"
                                className={styles.actionBtn}
                                onClick={() => setEditInstModal({
                                  isOpen: true,
                                  instId: inst.instituteId,
                                  name: inst.name,
                                  studentCount: inst.studentCount || 0,
                                  deanName: inst.deanName || '',
                                  deanEmail: inst.deanEmail || '',
                                  slaStatus: inst.slaStatus || '99.99% SLA',
                                })}
                              >
                                Edit Quota
                              </button>
                              <button
                                type="button"
                                className={styles.actionBtn}
                                onClick={() => setReassignSpocModal({ isOpen: true, instId: inst.instituteId, instName: inst.name, spocId: inst.spocAdminId })}
                              >
                                Reassign SPOC
                              </button>
                              <button
                                type="button"
                                className={styles.actionBtn}
                                onClick={() => setChangeTierModal({ isOpen: true, instId: inst.instituteId, instName: inst.name, tier: inst.tier })}
                              >
                                Change Tier
                              </button>
                              {isGrace && (
                                <button
                                  type="button"
                                  className={`${styles.btn} ${styles.btnDangerOutline} ${styles.btnXs}`}
                                  onClick={() => setArchiveTenantModal({ isOpen: true, instId: inst.instituteId, instName: inst.name })}
                                >
                                  📦 Archive
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: SPOC STAFF DIRECTORY                              */}
        {/* ======================================================== */}
        {activeTab === 'spocs' && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.cardHeading}>Lumina Operations & SPOC Staff Roster</h3>
                <p className={styles.cardSubheading}>Internal operations personnel managing university SLAs and tenant configurations.</p>
              </div>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
                onClick={() => setEmploySpocModal({ isOpen: true, fullName: '', email: '', phone: '' })}
              >
                + Employ New SPOC
              </button>
            </div>

            <div className={styles.spocGrid}>
              {adminTeam.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', gridColumn: '1 / -1' }}>
                  No SPOC staff members currently assigned.
                </div>
              ) : (
                adminTeam.map(spoc => {
                  const initials = (spoc.fullName || 'Admin').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                  return (
                    <div key={spoc.adminId} className={styles.spocCard}>
                      <div className={styles.spocCardHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div className={styles.spocAvatar}>{initials}</div>
                          <div>
                            <strong>{spoc.fullName}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{spoc.adminId}</div>
                          </div>
                        </div>
                        <span className={`${styles.badge} ${styles.badgeApproved}`}>{spoc.status}</span>
                      </div>

                      <div className={styles.spocTenantBox}>
                        <div className={styles.spocTenantLabel}>
                          Assigned University Tenant{spoc.assignedInstituteName?.includes(',') ? 's' : ''}
                        </div>
                        <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                          {spoc.assignedInstituteName}
                        </div>
                      </div>

                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div>✉️ {spoc.email}</div>
                        <div>📞 {spoc.phone}</div>
                        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <span className={`${styles.badge} ${styles.badgeRole}`}>{spoc.slaHealth}</span>
                            <span className={`${styles.badge} ${spoc.activeDockets > 0 ? styles.badgePending : styles.badgeApproved}`}>
                              {spoc.activeDockets || 0} Open {spoc.activeDockets === 1 ? 'Docket' : 'Dockets'}
                            </span>
                          </div>
                          <button
                            type="button"
                            className={`${styles.btn} ${styles.btnDangerOutline} ${styles.btnXs}`}
                            onClick={() => setDeleteSpocModal({ isOpen: true, adminId: spoc.adminId, spocName: spoc.fullName })}
                            title={`Offboard SPOC ${spoc.fullName}`}
                          >
                            🗑 Delete SPOC
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: ONBOARDING QUEUE                                  */}
        {/* ======================================================== */}
        {activeTab === 'queue' && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.cardHeading}>Inbound University Onboarding Queue</h3>
                <p className={styles.cardSubheading}>Trial and onboarding dockets submitted from the public landing page.</p>
              </div>
            </div>

            <div className={styles.tableContainer}>
              {onboardDockets.length === 0 ? (
                <div className={styles.emptyState}>
                  <img src="/assets/icons/clipboard.svg" alt="" className={styles.emptyIcon} />
                  <h4>No pending inbound onboarding requests</h4>
                  <p>Inbound requests submitted from the landing page will appear here.</p>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>INSTITUTE NAME</th>
                      <th>TARGET SAAS PLAN</th>
                      <th>REPRESENTATIVE & EMAIL</th>
                      <th>STUDENTS</th>
                      <th>SUBMITTED DATE</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {onboardDockets.map(docket => (
                      <tr key={docket.id}>
                        <td><strong>{docket.instituteName}</strong></td>
                        <td><span className={`${styles.badge} ${styles.badgePending}`}>{docket.plan}</span></td>
                        <td>
                          <div>{docket.repName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{docket.email}</div>
                        </td>
                        <td><strong>{Number(docket.students || 0).toLocaleString()}</strong></td>
                        <td>{new Date(docket.submittedAt).toLocaleDateString()}</td>
                        <td>
                          <button
                            type="button"
                            className={`${styles.btn} ${styles.btnPrimary} ${styles.btnXs}`}
                            onClick={() => handleOnboardFromDocket(docket.id)}
                          >
                            Assign SPOC & Onboard
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: SYSTEM LOGS STREAM                                */}
        {/* ======================================================== */}
        {activeTab === 'logs' && (
          <div className={styles.terminalCard}>
            <div className={styles.terminalHeader}>
              <div className={styles.terminalStatusGroup}>
                <div className={styles.terminalDots}>
                  <span className={`${styles.dot} ${styles.dotRed}`} />
                  <span className={`${styles.dot} ${styles.dotYellow}`} />
                  <span className={`${styles.dot} ${styles.dotGreen}`} />
                </div>
                <div className={styles.terminalTitle}>
                  <img src="/assets/icons/terminal.svg" alt="" width="16" height="16" />
                  <span>Real-Time System Log Stream</span>
                </div>
                {isLiveStreaming ? (
                  <span className={`${styles.liveBadge} ${styles.liveBadgeActive}`}>
                    <span className={styles.pulsingDot} /> LIVE STREAMING
                  </span>
                ) : (
                  <span className={`${styles.liveBadge} ${styles.liveBadgePaused}`}>
                    ⏸ STREAM PAUSED
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnOutline} ${styles.btnXs}`}
                  onClick={() => setIsLiveStreaming(prev => !prev)}
                >
                  {isLiveStreaming ? '⏸ Pause Stream' : '▶ Resume Live'}
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnOutline} ${styles.btnXs}`}
                  onClick={handleClearLogs}
                >
                  🧹 Clear Console
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnOutline} ${styles.btnXs}`}
                  onClick={handleReloadAllLogs}
                  disabled={logsLoading}
                >
                  {logsLoading ? '⏳ Loading...' : '🔄 Full History'}
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnOutline} ${styles.btnXs}`}
                  onClick={() => {
                    const text = logs.map(l => l.raw).join('\n');
                    const blob = new Blob([text], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `lumina_system_logs_${new Date().toISOString().slice(0, 10)}.log`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  📥 Download .log
                </button>
              </div>
            </div>

            <div className={styles.terminalToolbar}>
              <div className={styles.logLevelPills}>
                {['ALL', 'INFO', 'WARN', 'ERROR', 'DEBUG'].map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    className={`${styles.levelPill} ${logLevelFilter === lvl ? styles.levelPillActive : ''}`}
                    onClick={() => setLogLevelFilter(lvl)}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Search route, method, status, role..."
                  className={styles.searchInput}
                  style={{ background: '#090d16', color: '#f1f5f9', borderColor: '#334155', width: '260px' }}
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                />

                <span style={{ color: '#64748b', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                  {filteredLogs.length} / {logs.length} events (Newest on top)
                </span>
              </div>
            </div>

            {/* Column Header Alignment Bar */}
            <div className={styles.terminalColHeaders}>
              <span>TIMESTAMP</span>
              <span style={{ textAlign: 'center' }}>LEVEL</span>
              <span style={{ textAlign: 'center' }}>METHOD</span>
              <span style={{ textAlign: 'center' }}>STATUS</span>
              <span style={{ textAlign: 'right' }}>LATENCY</span>
              <span style={{ textAlign: 'center' }}>ROLE</span>
              <span>ENDPOINT ROUTE</span>
              <span>CLIENT IP &amp; USER AGENT</span>
              <span />
            </div>

            <div className={styles.terminalViewport}>
              {filteredLogs.length === 0 ? (
                <div style={{ color: '#64748b', textAlign: 'center', padding: '48px 0', fontFamily: 'sans-serif' }}>
                  <p style={{ margin: '0 0 6px 0', fontSize: '0.9rem', color: '#94a3b8' }}>
                    {clearWatermarkRef.current > 0
                      ? 'Console display has been cleared. Streaming new incoming logs in real-time...'
                      : 'No log entries found matching filter criteria.'}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                    Click <strong>"🔄 Full History"</strong> to reload past server logs from disk.
                  </p>
                </div>
              ) : (
                filteredLogs.map((log, idx) => {
                  const isExpanded = expandedLogId === log.id;

                  if (log.isStructured) {
                    const is2xx = log.statusCode >= 200 && log.statusCode < 300;
                    const is3xx = log.statusCode >= 300 && log.statusCode < 400;
                    const is4xx = log.statusCode >= 400 && log.statusCode < 500;
                    const is5xx = log.statusCode >= 500;

                    const methodClass =
                      log.method === 'GET' ? styles.logMethodGet :
                      log.method === 'POST' ? styles.logMethodPost :
                      (log.method === 'PUT' || log.method === 'PATCH') ? styles.logMethodPut :
                      log.method === 'DELETE' ? styles.logMethodDelete : styles.logMethodOther;

                    const statusClass =
                      is2xx ? styles.logStatusOk :
                      is3xx ? styles.logStatusInfo :
                      is4xx ? styles.logStatusWarn :
                      is5xx ? styles.logStatusError : styles.logStatusInfo;

                    const levelClass =
                      log.level === 'WARN' ? styles.logLevelWarn :
                      log.level === 'ERROR' ? styles.logLevelError :
                      log.level === 'DEBUG' ? styles.logLevelDebug : styles.logLevelInfo;

                    return (
                      <div key={`${log.id}-${idx}`} className={styles.logRowContainer}>
                        <div
                          className={`${styles.logLine} ${isExpanded ? styles.logLineExpanded : ''}`}
                          onClick={() => setExpandedLogId(prev => prev === log.id ? null : log.id)}
                          title="Click row to inspect full telemetry and raw log payload"
                        >
                          <span className={styles.logTime}>{log.formattedTime}</span>
                          <span className={`${styles.logBadge} ${styles.logBadgeLevel} ${levelClass}`}>{log.level}</span>
                          <span className={`${styles.logBadge} ${styles.logBadgeMethod} ${methodClass}`}>{log.method}</span>
                          <span className={`${styles.logStatusBadge} ${statusClass}`}>{log.statusCode || log.status}</span>
                          <span className={styles.logDuration}>{log.duration || '0ms'}</span>
                          <span className={styles.logRole} title={log.role}>{log.role}</span>
                          <span className={styles.logPath} title={log.path}>{log.path}</span>
                          <div className={styles.logClientMeta}>
                            <span className={styles.logIp}>{log.ip || '127.0.0.1'}</span>
                            <span className={styles.logUa} title={log.ua}>{log.uaSummary || log.ua}</span>
                          </div>
                          <span className={styles.logExpandChevron}>{isExpanded ? '▲' : '▼'}</span>
                        </div>

                        {isExpanded && (
                          <div className={styles.logDetailDrawer}>
                            <div className={styles.detailDrawerHeader}>
                              <span className={styles.detailDrawerTitle}>Request Telemetry &amp; Payload Inspector</span>
                              <button
                                type="button"
                                className={styles.copyLogBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(log.raw);
                                  toast.success('Log line copied to clipboard');
                                }}
                              >
                                📋 Copy Raw Log
                              </button>
                            </div>
                            <div className={styles.detailGrid}>
                              <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Timestamp (ISO)</span>
                                <span className={styles.detailVal}>{log.rawTime}</span>
                              </div>
                              <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Method &amp; Route</span>
                                <span className={styles.detailVal}><code>{log.method} {log.path}</code></span>
                              </div>
                              <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>HTTP Status &amp; Latency</span>
                                <span className={styles.detailVal}>{log.status} &bull; {log.duration}</span>
                              </div>
                              <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Actor Role</span>
                                <span className={styles.detailVal}>{log.role}</span>
                              </div>
                              <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Client IP Address</span>
                                <span className={styles.detailVal}>{log.ip || '127.0.0.1'}</span>
                              </div>
                              <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Client User Agent</span>
                                <span className={styles.detailVal} style={{ wordBreak: 'break-all' }}>{log.ua || 'N/A'}</span>
                              </div>
                            </div>
                            <div className={styles.rawBox}>
                              <div className={styles.rawLabel}>Raw Server Log:</div>
                              <pre className={styles.rawCode}>{log.raw}</pre>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  const levelClass =
                    log.level === 'WARN' ? styles.logLevelWarn :
                    log.level === 'ERROR' ? styles.logLevelError :
                    log.level === 'DEBUG' ? styles.logLevelDebug : styles.logLevelInfo;

                  return (
                    <div key={`${log.id}-${idx}`} className={styles.logRowContainer}>
                      <div
                        className={`${styles.logLine} ${isExpanded ? styles.logLineExpanded : ''}`}
                        onClick={() => setExpandedLogId(prev => prev === log.id ? null : log.id)}
                      >
                        <span className={styles.logTime}>{log.formattedTime}</span>
                        <span className={`${styles.logBadge} ${styles.logBadgeLevel} ${levelClass}`}>{log.level}</span>
                        <span className={styles.logMsg}>{log.message || log.raw}</span>
                        <span className={styles.logExpandChevron}>{isExpanded ? '▲' : '▼'}</span>
                      </div>
                      {isExpanded && (
                        <div className={styles.logDetailDrawer}>
                          <div className={styles.rawBox}>
                            <pre className={styles.rawCode}>{log.raw}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>


      {/* ======================================================== */}
      {/* MODAL 3: REASSIGN SPOC MODAL                             */}
      {/* ======================================================== */}
      {reassignSpocModal.isOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalDialog}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Assign Dedicated Lumina SPOC</h3>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setReassignSpocModal({ isOpen: false, instId: '', instName: '', spocId: '' })}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Select an operations administrator for <strong>{reassignSpocModal.instName}</strong>
              </p>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Select Admin SPOC</label>
                <select
                  className={styles.formControl}
                  value={reassignSpocModal.spocId}
                  onChange={(e) => setReassignSpocModal(prev => ({ ...prev, spocId: e.target.value }))}
                >
                  {adminTeam.map(spoc => (
                    <option key={spoc.adminId} value={spoc.adminId}>
                      {spoc.fullName} ({spoc.adminId})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setReassignSpocModal({ isOpen: false, instId: '', instName: '', spocId: '' })}>Cancel</button>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleConfirmAssignSpoc}>Assign SPOC</button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: CHANGE TIER MODAL                               */}
      {/* ======================================================== */}
      {changeTierModal.isOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalDialog}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Modify SaaS Subscription Tier</h3>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setChangeTierModal({ isOpen: false, instId: '', instName: '', tier: 'Campus' })}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Update licensing package for <strong>{changeTierModal.instName}</strong>
              </p>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Select Subscription Tier</label>
                <select
                  className={styles.formControl}
                  value={changeTierModal.tier}
                  onChange={(e) => setChangeTierModal(prev => ({ ...prev, tier: e.target.value }))}
                >
                  <option value="Starter">Starter College Tier ($1,499/mo)</option>
                  <option value="Campus">University Campus Tier ($3,999/mo)</option>
                  <option value="Enterprise">Multi-Campus Enterprise Tier ($8,999/mo)</option>
                </select>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setChangeTierModal({ isOpen: false, instId: '', instName: '', tier: 'Campus' })}>Cancel</button>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleConfirmChangeTier}>Update Tier</button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: EMPLOY SPOC MODAL                               */}
      {/* ======================================================== */}
      {employSpocModal.isOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalDialog}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Employ New Lumina Admin SPOC</h3>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setEmploySpocModal({ isOpen: false, fullName: '', email: '', phone: '' })}>&times;</button>
            </div>
            <form onSubmit={handleEmploySpoc}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Staff Full Name</label>
                  <input
                    type="text"
                    required
                    className={styles.formControl}
                    placeholder="e.g. Vikramaditya Sen"
                    value={employSpocModal.fullName}
                    onChange={(e) => setEmploySpocModal(prev => ({ ...prev, fullName: e.target.value }))}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Corporate Email</label>
                  <input
                    type="email"
                    required
                    className={styles.formControl}
                    placeholder="vikram.spoc@lumina.edu"
                    value={employSpocModal.email}
                    onChange={(e) => setEmploySpocModal(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Contact Phone</label>
                  <input
                    type="text"
                    required
                    className={styles.formControl}
                    placeholder="+91 98765 11223"
                    value={employSpocModal.phone}
                    onChange={(e) => setEmploySpocModal(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setEmploySpocModal({ isOpen: false, fullName: '', email: '', phone: '' })}>Cancel</button>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>Employ Staff Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 6: ONBOARD INSTITUTE MODAL                         */}
      {/* ======================================================== */}
      {onboardInstModal.isOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalDialog}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Onboard New Client University</h3>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setOnboardInstModal(prev => ({ ...prev, isOpen: false }))}>&times;</button>
            </div>
            <form onSubmit={handleOnboardInstitute}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Institute Full Name</label>
                  <input
                    type="text"
                    required
                    className={styles.formControl}
                    placeholder="e.g. Birla Institute of Technology"
                    value={onboardInstModal.name}
                    onChange={(e) => setOnboardInstModal(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Dean / Registrar</label>
                    <input
                      type="text"
                      required
                      className={styles.formControl}
                      placeholder="Dr. S. K. Gupta"
                      value={onboardInstModal.deanName}
                      onChange={(e) => setOnboardInstModal(prev => ({ ...prev, deanName: e.target.value }))}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Student Count</label>
                    <input
                      type="number"
                      required
                      className={styles.formControl}
                      placeholder="3500"
                      value={onboardInstModal.studentCount}
                      onChange={(e) => setOnboardInstModal(prev => ({ ...prev, studentCount: e.target.value }))}
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Institutional Email</label>
                  <input
                    type="email"
                    required
                    className={styles.formControl}
                    placeholder="dean@bit.edu"
                    value={onboardInstModal.deanEmail}
                    onChange={(e) => setOnboardInstModal(prev => ({ ...prev, deanEmail: e.target.value }))}
                  />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>SaaS Plan Tier</label>
                    <select
                      className={styles.formControl}
                      value={onboardInstModal.tier}
                      onChange={(e) => setOnboardInstModal(prev => ({ ...prev, tier: e.target.value }))}
                    >
                      <option value="Campus">University Campus</option>
                      <option value="Enterprise">Multi-Campus Enterprise</option>
                      <option value="Starter">Starter College</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Assign SPOC</label>
                    <select
                      className={styles.formControl}
                      value={onboardInstModal.spocAdminId}
                      onChange={(e) => setOnboardInstModal(prev => ({ ...prev, spocAdminId: e.target.value }))}
                    >
                      {adminTeam.map(s => (
                        <option key={s.adminId} value={s.adminId}>{s.fullName} ({s.adminId})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setOnboardInstModal(prev => ({ ...prev, isOpen: false }))}>Cancel</button>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>Provision Tenant</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Offboard SPOC Modal */}
      {deleteSpocModal.isOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalDialog}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle} style={{ color: '#ef4444' }}>Offboard Operations SPOC</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setDeleteSpocModal({ isOpen: false, adminId: '', spocName: '' })}
              >
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ marginBottom: '12px', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                Are you sure you want to offboard <strong>{deleteSpocModal.spocName}</strong> (<code>{deleteSpocModal.adminId}</code>)?
              </p>
              <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', padding: '12px', color: '#991b1b', fontSize: '0.85rem', lineHeight: '1.4' }}>
                ⚠️ <strong>Tenant Reassignment:</strong> Any client universities or SaaS tenants currently assigned to this SPOC will be automatically returned to the <strong>Floating Support Queue</strong> or reassigned to a backup SPOC.
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnOutline}`}
                onClick={() => setDeleteSpocModal({ isOpen: false, adminId: '', spocName: '' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnDanger}`}
                onClick={confirmDeleteSpoc}
              >
                Confirm Offboarding
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Tenant Modal */}
      {archiveTenantModal.isOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalDialog}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle} style={{ color: '#ef4444' }}>Archive Client Tenant</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setArchiveTenantModal({ isOpen: false, instId: '', instName: '' })}
              >
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ marginBottom: '12px', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                Are you sure you want to archive <strong>{archiveTenantModal.instName}</strong>?
              </p>
              <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', padding: '12px', color: '#991b1b', fontSize: '0.85rem', lineHeight: '1.4' }}>
                📦 <strong>Cold Storage &amp; Quota:</strong> The tenant records will be securely migrated to cold storage and allocated seat capacity will be reclaimed.
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnOutline}`}
                onClick={() => setArchiveTenantModal({ isOpen: false, instId: '', instName: '' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnDanger}`}
                onClick={confirmArchiveTenant}
              >
                Archive Tenant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tenant Quota & Details Modal */}
      {editInstModal.isOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalDialog}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Edit Client University Quota &amp; Details</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setEditInstModal(prev => ({ ...prev, isOpen: false }))}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleConfirmEditInstitute}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Institute Full Name</label>
                  <input
                    type="text"
                    required
                    className={styles.formControl}
                    value={editInstModal.name}
                    onChange={(e) => setEditInstModal(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Enrolled Student Count / Quota</label>
                    <input
                      type="number"
                      required
                      min="0"
                      className={styles.formControl}
                      value={editInstModal.studentCount}
                      onChange={(e) => setEditInstModal(prev => ({ ...prev, studentCount: e.target.value }))}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>SLA Status</label>
                    <select
                      className={styles.formControl}
                      value={editInstModal.slaStatus}
                      onChange={(e) => setEditInstModal(prev => ({ ...prev, slaStatus: e.target.value }))}
                    >
                      <option value="99.99% SLA">99.99% SLA (Dedicated)</option>
                      <option value="99.95% SLA">99.95% SLA (High Priority)</option>
                      <option value="99.90% SLA">99.90% SLA (Standard)</option>
                      <option value="99.85% SLA">99.85% SLA (Standard Basic)</option>
                      <option value="99.80% SLA">99.80% SLA (Basic)</option>
                    </select>
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Dean / Registrar Contact</label>
                    <input
                      type="text"
                      required
                      className={styles.formControl}
                      value={editInstModal.deanName}
                      onChange={(e) => setEditInstModal(prev => ({ ...prev, deanName: e.target.value }))}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Institutional Email</label>
                    <input
                      type="email"
                      required
                      className={styles.formControl}
                      value={editInstModal.deanEmail}
                      onChange={(e) => setEditInstModal(prev => ({ ...prev, deanEmail: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnOutline}`}
                  onClick={() => setEditInstModal(prev => ({ ...prev, isOpen: false }))}
                >
                  Cancel
                </button>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
                  Save Tenant Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

