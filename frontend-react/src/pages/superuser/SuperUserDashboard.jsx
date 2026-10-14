/**
 * SuperUserDashboard.jsx
 *
 * Lumina Super User Console
 * Provides comprehensive platform-wide administrative control:
 *  - Tab 1: Overview & Universal Schema CRUD Engine (Users, Courses, Sections, Slots, Registrations, Overrides, Phases, Announcements)
 *  - Tab 2: Client Universities & Multi-Tenant SaaS Subscriptions
 *  - Tab 3: Lumina SPOC Staff Operations Roster
 *  - Tab 4: Inbound University Onboarding Queue
 *  - Tab 5: Real-time System Logs Terminal Stream
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import TopNavbar from '../../components/common/TopNavbar';
import Footer from '../../components/Footer';

// Pre-built services
import { adminService } from '../../services/admin.service';
import { usersService } from '../../services/users.service';
import { coursesService } from '../../services/courses.service';
import { sectionsService } from '../../services/sections.service';
import { slotsService } from '../../services/slots.service';
import { registrationsService } from '../../services/registrations.service';
import { overridesService } from '../../services/overrides.service';
import { policiesService } from '../../services/policies.service';
import { announcementsService } from '../../services/announcements.service';
import { revenueService } from '../../services/revenue.service';

import styles from './SuperUser.module.css';

// Default mock tenants and SPOCs matching legacy super_user.js
const DEFAULT_INSTITUTES = [
  {
    instituteId: 'INST-IIITS',
    name: 'Indian Institute of Information Technology Sri City',
    tier: 'Enterprise',
    spocAdminId: 'SPOC-001',
    spocName: 'Arjun Verma',
    deanName: 'Dr. Hrishikesh Venkataraman',
    deanEmail: 'dean.academics@iiits.in',
    studentCount: 1250,
    status: 'Grace_Period',
    annualContractValue: 107988,
  },
  {
    instituteId: 'INST-IITB',
    name: 'Indian Institute of Technology Bombay',
    tier: 'Enterprise',
    spocAdminId: 'SPOC-002',
    spocName: 'Eswar Prasad',
    deanName: 'Prof. S. Sudarshan',
    deanEmail: 'dean.ap@iitb.ac.in',
    studentCount: 3400,
    status: 'Active',
    annualContractValue: 107988,
  },
  {
    instituteId: 'INST-BITS',
    name: 'Birla Institute of Technology and Science Pilani',
    tier: 'Campus',
    spocAdminId: 'SPOC-003',
    spocName: 'Priya Sharma',
    deanName: 'Prof. V. Ramgopal Rao',
    deanEmail: 'dean.wilp@bits-pilani.ac.in',
    studentCount: 2200,
    status: 'Active',
    annualContractValue: 41988,
  },
  {
    instituteId: 'INST-NITK',
    name: 'National Institute of Technology Karnataka',
    tier: 'Campus',
    spocAdminId: 'SPOC-001',
    spocName: 'Arjun Verma',
    deanName: 'Prof. K. Vidyadhar',
    deanEmail: 'dean.acad@nitk.edu.in',
    studentCount: 1800,
    status: 'Onboarding',
    annualContractValue: 41988,
  },
  {
    instituteId: 'INST-IIITH',
    name: 'International Institute of Information Technology Hyderabad',
    tier: 'Enterprise',
    spocAdminId: 'SPOC-002',
    spocName: 'Eswar Prasad',
    deanName: 'Prof. P. J. Narayanan',
    deanEmail: 'director@iiit.ac.in',
    studentCount: 1950,
    status: 'Active',
    annualContractValue: 107988,
  },
  {
    instituteId: 'INST-MANIPAL',
    name: 'Manipal Academy of Higher Education',
    tier: 'Starter',
    spocAdminId: 'SPOC-003',
    spocName: 'Priya Sharma',
    deanName: 'Dr. Narayana Sabhahit',
    deanEmail: 'registrar@manipal.edu',
    studentCount: 950,
    status: 'Trial',
    annualContractValue: 14388,
  },
];

const DEFAULT_ADMIN_TEAM = [
  {
    adminId: 'SPOC-001',
    fullName: 'Arjun Verma',
    email: 'arjun.spoc@lumina.edu',
    phone: '+91 98765 43210',
    assignedInstituteId: 'INST-IIITS',
    assignedInstituteName: 'IIIT Sri City',
    status: 'Active',
    slaHealth: '99.99% SLA (Dedicated)',
  },
  {
    adminId: 'SPOC-002',
    fullName: 'Eswar Prasad',
    email: 'eswar.spoc@lumina.edu',
    phone: '+91 98765 43211',
    assignedInstituteId: 'INST-IITB',
    assignedInstituteName: 'IIT Bombay',
    status: 'Active',
    slaHealth: '99.95% SLA (Portfolio)',
  },
  {
    adminId: 'SPOC-003',
    fullName: 'Priya Sharma',
    email: 'priya.spoc@lumina.edu',
    phone: '+91 98765 43212',
    assignedInstituteId: 'INST-BITS',
    assignedInstituteName: 'BITS Pilani',
    status: 'Active',
    slaHealth: '99.90% SLA (Standard)',
  },
];

const ENTITY_CONFIGS = {
  users: {
    title: 'Users',
    singular: 'User',
    idKey: 'userId',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    columns: ['User ID', 'Full Name', 'Email', 'Role', 'Department', 'Actions'],
    filterOptions: [
      { value: 'ALL', label: 'All Roles' },
      { value: 'Student', label: 'Students' },
      { value: 'Faculty', label: 'Faculty' },
      { value: 'Dean', label: 'Deans' },
      { value: 'Admin', label: 'Admins' },
      { value: 'Super_User', label: 'Super Users' },
    ],
    searchFields: ['userId', 'fullName', 'email', 'role', 'deptId'],
  },
  courses: {
    title: 'Courses',
    singular: 'Course',
    idKey: 'courseId',
    canCreate: true,
    canEdit: true,
    canDelete: false,
    columns: ['Course ID', 'Course Name', 'Credits', 'Capacity', 'Status', 'Department', 'Actions'],
    filterOptions: [
      { value: 'ALL', label: 'All Statuses' },
      { value: 'Active', label: 'Active' },
      { value: 'Inactive', label: 'Inactive' },
    ],
    searchFields: ['courseId', 'courseName', 'deptId', 'status'],
  },
  sections: {
    title: 'Sections',
    singular: 'Section',
    idKey: 'sectionId',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    columns: ['Section ID', 'Course ID', 'Term', 'Instructor', 'Capacity', 'Actions'],
    filterOptions: [
      { value: 'ALL', label: 'All Terms' },
      { value: 'Fall 2026', label: 'Fall 2026' },
      { value: 'Spring 2026', label: 'Spring 2026' },
      { value: 'Summer 2026', label: 'Summer 2026' },
    ],
    searchFields: ['sectionId', 'courseId', 'term', 'instructor'],
  },
  'course-slots': {
    title: 'Course Slots',
    singular: 'Course Slot',
    idKey: 'slotId',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    columns: ['Slot ID', 'Section ID', 'Day', 'Time', 'Room', 'Actions'],
    filterOptions: [
      { value: 'ALL', label: 'All Days' },
      { value: 'Monday', label: 'Monday' },
      { value: 'Tuesday', label: 'Tuesday' },
      { value: 'Wednesday', label: 'Wednesday' },
      { value: 'Thursday', label: 'Thursday' },
      { value: 'Friday', label: 'Friday' },
    ],
    searchFields: ['slotId', 'sectionId', 'day', 'time', 'room'],
  },
  registrations: {
    title: 'Registrations',
    singular: 'Registration',
    idKey: 'enrollmentId',
    canCreate: false,
    canEdit: true,
    canDelete: false,
    columns: ['Enrollment ID', 'Student ID', 'Course ID', 'Term', 'Status', 'Final Grade', 'Actions'],
    filterOptions: [
      { value: 'ALL', label: 'All Statuses' },
      { value: 'Enrolled', label: 'Enrolled' },
      { value: 'Pending_Allocation', label: 'Pending Allocation' },
      { value: 'Waitlisted', label: 'Waitlisted' },
      { value: 'Dropped', label: 'Dropped' },
    ],
    searchFields: ['enrollmentId', 'studentId', 'courseId', 'term', 'status', 'finalGrade'],
  },
  overrides: {
    title: 'Override Requests',
    singular: 'Override Request',
    idKey: 'requestId',
    canCreate: false,
    canEdit: true,
    canDelete: false,
    columns: ['Request ID', 'Student ID', 'Course ID', 'Reason', 'Status', 'Actions'],
    filterOptions: [
      { value: 'ALL', label: 'All Statuses' },
      { value: 'Pending', label: 'Pending' },
      { value: 'Approved', label: 'Approved' },
      { value: 'Rejected', label: 'Rejected' },
    ],
    searchFields: ['requestId', 'studentId', 'courseId', 'reason', 'status'],
  },
  'enrollment-phases': {
    title: 'Enrollment Phases',
    singular: 'Enrollment Phase',
    idKey: 'phaseId',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    columns: ['Phase ID', 'Phase Name', 'Eligible Groups', 'Timeline', 'Status', 'Actions'],
    filterOptions: [
      { value: 'ALL', label: 'All Statuses' },
      { value: 'Active', label: 'Active' },
      { value: 'Upcoming', label: 'Upcoming' },
      { value: 'Completed', label: 'Completed' },
    ],
    searchFields: ['phaseId', 'id', 'name', 'phaseName', 'eligibleGroups', 'status'],
  },
  announcements: {
    title: 'Announcements',
    singular: 'Announcement',
    idKey: 'announcementId',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    columns: ['ID', 'Course', 'Title', 'Message', 'Posted By', 'Actions'],
    filterOptions: [{ value: 'ALL', label: 'All Announcements' }],
    searchFields: ['announcementId', 'id', 'courseId', 'title', 'message'],
  },
};

export default function SuperUserDashboard() {
  const { user } = useAuth();

  // Active top-level Tab: 'overview' | 'institutes' | 'spocs' | 'queue' | 'logs'
  const [activeTab, setActiveTab] = useState('overview');

  // Overview Tab Entity selection:
  const [selectedEntity, setSelectedEntity] = useState('users');
  const [entityData, setEntityData] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValue, setFilterValue] = useState('ALL');

  // Client Institutes & SPOC state
  const [institutes, setInstitutes] = useState(DEFAULT_INSTITUTES);
  const [adminTeam, setAdminTeam] = useState(DEFAULT_ADMIN_TEAM);
  const [onboardDockets, setOnboardDockets] = useState([]);

  // System Logs state
  const [logs, setLogs] = useState([]);
  const [logLevelFilter, setLogLevelFilter] = useState('ALL');
  const [logModuleFilter, setLogModuleFilter] = useState('ALL');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const terminalEndRef = useRef(null);

  // Modals state
  const [crudModal, setCrudModal] = useState({ isOpen: false, mode: 'create', data: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, confirmId: '' });
  const [reassignSpocModal, setReassignSpocModal] = useState({ isOpen: false, instId: '', instName: '', spocId: '' });
  const [changeTierModal, setChangeTierModal] = useState({ isOpen: false, instId: '', instName: '', tier: 'Campus' });
  const [employSpocModal, setEmploySpocModal] = useState({ isOpen: false, fullName: '', email: '', phone: '' });
  const [onboardInstModal, setOnboardInstModal] = useState({
    isOpen: false,
    name: '',
    deanName: '',
    deanEmail: '',
    studentCount: 2000,
    tier: 'Campus',
    spocAdminId: 'SPOC-001',
  });

  // Load Initial Data
  useEffect(() => {
    loadEntity(selectedEntity);
    loadInstitutesAndStaff();
    loadDockets();
    loadLogs();
  }, []);

  // Live log polling effect
  useEffect(() => {
    if (!isLiveStreaming) return;
    const interval = setInterval(() => {
      // Simulate/fetch latest logs
      if (activeTab === 'logs') {
        loadLogs();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isLiveStreaming, activeTab]);

  // Scroll terminal to bottom
  useEffect(() => {
    if (activeTab === 'logs' && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, activeTab]);

  // Load Entity Data
  async function loadEntity(entityKey) {
    setTableLoading(true);
    try {
      let data = [];
      switch (entityKey) {
        case 'users':
          data = await usersService.getAll();
          break;
        case 'courses':
          data = await coursesService.getAll();
          break;
        case 'sections':
          data = await sectionsService.getAll();
          break;
        case 'course-slots':
          data = await slotsService.getAll();
          break;
        case 'registrations':
          data = await registrationsService.getAll();
          break;
        case 'overrides':
          data = await overridesService.getAll();
          break;
        case 'enrollment-phases':
          data = await policiesService.getPhases();
          break;
        case 'announcements':
          data = await announcementsService.getAll();
          break;
        default:
          data = [];
      }
      setEntityData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn(`Error loading ${entityKey}:`, err);
      toast.error(`Could not fetch ${ENTITY_CONFIGS[entityKey]?.title || entityKey}`);
      setEntityData([]);
    } finally {
      setTableLoading(false);
    }
  }

  // Load Institutes & Admin Team
  async function loadInstitutesAndStaff() {
    try {
      const [instData, teamData] = await Promise.allSettled([
        adminService.getInstitutes(),
        adminService.getAdminTeam(),
      ]);
      if (instData.status === 'fulfilled' && Array.isArray(instData.value) && instData.value.length > 0) {
        setInstitutes(instData.value);
      }
      if (teamData.status === 'fulfilled' && Array.isArray(teamData.value) && teamData.value.length > 0) {
        setAdminTeam(teamData.value);
      }
    } catch (err) {
      console.warn('Using default institutes / admin team:', err);
    }
  }

  // Load Onboard Dockets from localStorage
  function loadDockets() {
    try {
      const raw = localStorage.getItem('Lumina_Onboard_Dockets');
      if (raw) setOnboardDockets(JSON.parse(raw));
    } catch (e) {
      setOnboardDockets([]);
    }
  }

  // Load System Logs
  async function loadLogs() {
    try {
      const res = await adminService.getLogs('access', 60);
      if (Array.isArray(res)) {
        setLogs(res);
      } else if (res && Array.isArray(res.logs)) {
        // Backend returns { logType, totalLinesRetrieved, timestamp, logs: [...] }
        const parsedLogs = res.logs.map(entry => {
          if (typeof entry === 'string') {
            return {
              timestamp: new Date().toISOString(),
              level: entry.includes('ERROR') ? 'ERROR' : entry.includes('WARN') ? 'WARN' : 'INFO',
              module: 'Server',
              message: entry,
            };
          }
          return entry;
        });
        setLogs(parsedLogs);
      } else if (res && Array.isArray(res.lines)) {
        setLogs(res.lines);
      }
    } catch (e) {
      console.warn('System log endpoint unavailable:', e);
    }
  }

  // Handle Entity Switch
  function handleSelectEntity(entityKey) {
    setSelectedEntity(entityKey);
    setSearchQuery('');
    setFilterValue('ALL');
    loadEntity(entityKey);
  }

  // Metrics Calculations
  const metrics = useMemo(() => {
    const activeInsts = institutes.filter(i => i.status !== 'Archived');
    const totalArr = activeInsts.reduce((sum, i) => sum + (i.annualContractValue || 0), 0);
    const totalStudents = activeInsts.reduce((sum, i) => sum + (i.studentCount || 0), 0);
    return {
      instCount: institutes.length,
      spocCount: adminTeam.length,
      arr: totalArr,
      mrr: Math.round(totalArr / 12),
      students: totalStudents,
    };
  }, [institutes, adminTeam]);

  // Filtered entity records
  const filteredRecords = useMemo(() => {
    const config = ENTITY_CONFIGS[selectedEntity];
    if (!config) return [];

    return entityData.filter(item => {
      // Dropdown filter
      if (filterValue !== 'ALL') {
        if (selectedEntity === 'users' && item.role !== filterValue && item.Role !== filterValue) return false;
        if (selectedEntity === 'courses' && item.status !== filterValue) return false;
        if (selectedEntity === 'sections' && item.term !== filterValue) return false;
        if (selectedEntity === 'course-slots' && item.day !== filterValue) return false;
        if (selectedEntity === 'registrations' && item.status !== filterValue) return false;
        if (selectedEntity === 'overrides' && item.status !== filterValue) return false;
      }
      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matches = config.searchFields.some(field => {
          const val = item[field] || item[field.toLowerCase()];
          return val && String(val).toLowerCase().includes(query);
        });
        if (!matches) return false;
      }
      return true;
    });
  }, [entityData, selectedEntity, filterValue, searchQuery]);

  // Filtered log lines
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (logLevelFilter !== 'ALL' && log.level !== logLevelFilter) return false;
      if (logModuleFilter !== 'ALL' && log.module !== logModuleFilter) return false;
      if (logSearchQuery.trim()) {
        const query = logSearchQuery.toLowerCase();
        const msgMatch = log.message && log.message.toLowerCase().includes(query);
        const modMatch = log.module && log.module.toLowerCase().includes(query);
        if (!msgMatch && !modMatch) return false;
      }
      return true;
    });
  }, [logs, logLevelFilter, logModuleFilter, logSearchQuery]);

  // CSV Export for current entity
  function exportCSV() {
    const config = ENTITY_CONFIGS[selectedEntity];
    if (!filteredRecords.length) {
      toast.error('No data available to export');
      return;
    }
    const headers = config.columns.filter(c => c !== 'Actions');
    const rows = filteredRecords.map(item => {
      return headers.map(header => {
        let val = '';
        if (header === 'User ID') val = item.userId || item.User_ID;
        else if (header === 'Full Name') val = item.fullName || item.Full_Name;
        else if (header === 'Email') val = item.email || item.Email;
        else if (header === 'Role') val = item.role || item.Role;
        else if (header === 'Department') val = item.deptId || item.Dept_ID;
        else if (header === 'Course ID') val = item.courseId;
        else if (header === 'Course Name') val = item.courseName;
        else if (header === 'Credits') val = item.credits;
        else if (header === 'Capacity') val = item.capacity;
        else if (header === 'Status') val = item.status;
        else if (header === 'Section ID') val = item.sectionId;
        else if (header === 'Term') val = item.term;
        else if (header === 'Instructor') val = item.instructor;
        else if (header === 'Slot ID') val = item.slotId;
        else if (header === 'Day') val = item.day;
        else if (header === 'Time') val = item.time;
        else if (header === 'Room') val = item.room;
        else if (header === 'Enrollment ID') val = item.enrollmentId;
        else if (header === 'Student ID') val = item.studentId;
        else if (header === 'Final Grade') val = item.finalGrade;
        else if (header === 'Request ID') val = item.requestId;
        else if (header === 'Reason') val = item.reason;
        else if (header === 'Phase ID') val = item.phaseId || item.id;
        else if (header === 'Phase Name') val = item.phaseName || item.name;
        else if (header === 'Title') val = item.title;
        else if (header === 'Message') val = item.message;
        else val = '';
        return `"${String(val || '').replace(/"/g, '""')}"`;
      }).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lumina_${selectedEntity}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${selectedEntity}.csv`);
  }

  // Save Modal Action (Create or Update)
  async function handleSaveEntity(e) {
    e.preventDefault();
    const form = e.target;
    const config = ENTITY_CONFIGS[selectedEntity];

    try {
      if (crudModal.mode === 'create') {
        if (selectedEntity === 'users') {
          await usersService.create({
            User_ID: form.userId.value,
            Full_Name: form.fullName.value,
            Email: form.email.value,
            Password: form.password.value || 'Lumina@123',
            Role: form.role.value,
            Dept_ID: form.deptId.value,
          });
        } else if (selectedEntity === 'courses') {
          await coursesService.create({
            courseId: form.courseId.value,
            courseName: form.courseName.value,
            credits: Number(form.credits.value),
            capacity: Number(form.capacity.value),
            deptId: form.deptId.value,
          });
        } else if (selectedEntity === 'sections') {
          await sectionsService.create({
            sectionId: form.sectionId.value,
            courseId: form.courseId.value,
            term: form.term.value,
            instructor: form.instructor.value,
            capacity: Number(form.capacity.value),
          });
        } else if (selectedEntity === 'course-slots') {
          await slotsService.create({
            slotId: form.slotId.value,
            sectionId: form.sectionId.value,
            day: form.day.value,
            time: form.time.value,
            room: form.room.value,
          });
        } else if (selectedEntity === 'announcements') {
          const fd = new FormData();
          fd.append('courseId', form.courseId.value);
          fd.append('title', form.title.value);
          fd.append('message', form.message.value);
          await announcementsService.create(fd);
        }
        toast.success(`Created new ${config.singular}!`);
      } else if (crudModal.mode === 'edit') {
        const id = crudModal.data[config.idKey] || crudModal.data.User_ID || crudModal.data.id;
        if (selectedEntity === 'users') {
          await usersService.update(id, {
            Full_Name: form.fullName.value,
            Email: form.email.value,
            Role: form.role.value,
            Dept_ID: form.deptId.value,
          });
        } else if (selectedEntity === 'courses') {
          await coursesService.update(id, {
            courseName: form.courseName.value,
            credits: Number(form.credits.value),
            capacity: Number(form.capacity.value),
            status: form.status.value,
          });
        } else if (selectedEntity === 'registrations') {
          await registrationsService.updateGrade(id, form.finalGrade.value);
        }
        toast.success(`Updated ${config.singular}!`);
      }

      setCrudModal({ isOpen: false, mode: 'create', data: null });
      loadEntity(selectedEntity);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Operation failed');
    }
  }

  // Delete Action
  async function confirmDelete() {
    const id = deleteModal.id;
    try {
      if (selectedEntity === 'users') await usersService.delete(id);
      else if (selectedEntity === 'sections') await sectionsService.delete(id);
      else if (selectedEntity === 'course-slots') await slotsService.delete(id);
      else if (selectedEntity === 'announcements') await announcementsService.delete(id);

      toast.success(`Record ${id} removed permanently`);
      setDeleteModal({ isOpen: false, id: null, confirmId: '' });
      loadEntity(selectedEntity);
    } catch (err) {
      toast.error('Failed to delete record');
    }
  }

  // Override Approval / Rejection
  async function handleOverrideDecision(requestId, decision) {
    try {
      if (decision === 'Approved') await overridesService.approve(requestId);
      else await overridesService.reject(requestId, 'Rejected by Super User');
      toast.success(`Override ${decision}!`);
      loadEntity('overrides');
    } catch (e) {
      toast.error('Failed to process override');
    }
  }

  // Tenant / Institute Actions
  async function handleConfirmAssignSpoc() {
    try {
      await adminService.assignSpoc(reassignSpocModal.instId, reassignSpocModal.spocId);
      toast.success('SPOC assigned successfully!');
      setReassignSpocModal({ isOpen: false, instId: '', instName: '', spocId: '' });
      loadInstitutesAndStaff();
    } catch (e) {
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
      toast.error('Failed to change subscription tier');
    }
  }

  async function handleArchiveTenant(instId, instName) {
    if (!window.confirm(`Are you sure you want to archive tenant "${instName}" and transfer data to cold storage?`)) return;
    try {
      await adminService.archiveInstitute(instId);
      toast.success(`📦 Tenant ${instName} archived. Seats reclaimed.`);
      loadInstitutesAndStaff();
    } catch (e) {
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
      toast.error('Failed to employ SPOC');
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
    { label: 'Super User Console', to: '/superuser', end: true },
  ];

  return (
    <>
      <TopNavbar navLinks={navLinks} />

      <main className={styles.pageContainer}>
        {/* Top Title & Navigation Tabs */}
        <div className={styles.headerGroup}>
          <div className={styles.titleRow}>
            <div>
              <h1 className={styles.pageTitle}>
                <img src="/assets/icons/shield.svg" alt="" width="26" height="26" />
                Super User Administration Console
              </h1>
              <p className={styles.pageSubtitle}>
                Global multi-tenant orchestration, database entity management, and server runtime logs
              </p>
            </div>
            <div className={styles.navTabs}>
              <button
                type="button"
                className={`${styles.navTabBtn} ${activeTab === 'overview' ? styles.navTabActive : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <img src="/assets/icons/database.svg" alt="" width="16" height="16" />
                <span>Overview & CRUD</span>
              </button>
              <button
                type="button"
                className={`${styles.navTabBtn} ${activeTab === 'institutes' ? styles.navTabActive : ''}`}
                onClick={() => setActiveTab('institutes')}
              >
                <img src="/assets/icons/layers.svg" alt="" width="16" height="16" />
                <span>Client Institutes ({institutes.length})</span>
              </button>
              <button
                type="button"
                className={`${styles.navTabBtn} ${activeTab === 'spocs' ? styles.navTabActive : ''}`}
                onClick={() => setActiveTab('spocs')}
              >
                <img src="/assets/icons/users.svg" alt="" width="16" height="16" />
                <span>SPOC Staff ({adminTeam.length})</span>
              </button>
              <button
                type="button"
                className={`${styles.navTabBtn} ${activeTab === 'queue' ? styles.navTabActive : ''}`}
                onClick={() => setActiveTab('queue')}
              >
                <img src="/assets/icons/clipboard.svg" alt="" width="16" height="16" />
                <span>Onboarding Queue ({onboardDockets.length})</span>
              </button>
              <button
                type="button"
                className={`${styles.navTabBtn} ${activeTab === 'logs' ? styles.navTabActive : ''}`}
                onClick={() => setActiveTab('logs')}
              >
                <img src="/assets/icons/terminal.svg" alt="" width="16" height="16" />
                <span>System Logs</span>
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: OVERVIEW & UNIVERSAL DATA CRUD                   */}
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

            {/* Entity Selector Chips */}
            <div className={styles.entitySelector}>
              <div className={styles.entityHeader}>
                <span className={styles.entityTitle}>Data Entities</span>
                <span className={styles.entityHint}>Select a schema entity to inspect and manage records</span>
              </div>
              <div className={styles.entityChipsList}>
                {Object.keys(ENTITY_CONFIGS).map(key => {
                  const cfg = ENTITY_CONFIGS[key];
                  const isActive = selectedEntity === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`${styles.entityChip} ${isActive ? styles.entityChipActive : ''}`}
                      onClick={() => handleSelectEntity(key)}
                    >
                      <img src="/assets/icons/layers.svg" alt="" width="14" height="14" />
                      <span>{cfg.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Entity Data Table Card */}
            <div className={styles.card}>
              <div className={styles.tableToolbar}>
                <div className={styles.toolbarLeft}>
                  {/* Search box */}
                  <div className={styles.searchWrapper}>
                    <img src="/assets/icons/search.svg" alt="" width="14" height="14" className={styles.searchIcon} />
                    <input
                      type="text"
                      className={styles.searchInput}
                      placeholder={`Search in ${ENTITY_CONFIGS[selectedEntity]?.title}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        className={styles.clearSearchBtn}
                        onClick={() => setSearchQuery('')}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Filter Dropdown */}
                  <select
                    className={styles.filterSelect}
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                  >
                    {ENTITY_CONFIGS[selectedEntity]?.filterOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>

                  <span className={styles.recordsBadge}>
                    {filteredRecords.length} {filteredRecords.length === 1 ? 'record' : 'records'}
                  </span>
                </div>

                <div className={styles.toolbarRight}>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}
                    onClick={() => loadEntity(selectedEntity)}
                  >
                    <img src="/assets/icons/refresh.svg" alt="" width="14" height="14" />
                    <span>Refresh</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}
                    onClick={exportCSV}
                  >
                    <img src="/assets/icons/download.svg" alt="" width="14" height="14" />
                    <span>Export CSV</span>
                  </button>

                  {ENTITY_CONFIGS[selectedEntity]?.canCreate && (
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
                      onClick={() => setCrudModal({ isOpen: true, mode: 'create', data: null })}
                    >
                      <img src="/assets/icons/plus.svg" alt="" width="14" height="14" style={{ filter: 'brightness(0) invert(1)' }} />
                      <span>+ Add New {ENTITY_CONFIGS[selectedEntity]?.singular}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Table Render */}
              <div className={styles.tableContainer}>
                {tableLoading ? (
                  <div className={styles.emptyState}>Fetching records from server...</div>
                ) : filteredRecords.length === 0 ? (
                  <div className={styles.emptyState}>
                    <img src="/assets/icons/database.svg" alt="" className={styles.emptyIcon} />
                    <h4>No records found</h4>
                    <p>There are no records matching your current filter criteria.</p>
                  </div>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        {ENTITY_CONFIGS[selectedEntity]?.columns.map(col => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((item, idx) => (
                        <tr key={idx}>
                          {renderRowCells(selectedEntity, item, {
                            onEdit: (rec) => setCrudModal({ isOpen: true, mode: 'edit', data: rec }),
                            onDelete: (id) => setDeleteModal({ isOpen: true, id, confirmId: '' }),
                            onApprove: (id) => handleOverrideDecision(id, 'Approved'),
                            onReject: (id) => handleOverrideDecision(id, 'Rejected'),
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
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
                  {institutes.map(inst => {
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
                            <span className={`${styles.badge} ${styles.badgeGrace}`}>⚠️ Grace Period (29d Left)</span>
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
                            <span className={`${styles.badge} ${styles.badgeApproved}`}>● 99.99% SLA</span>
                          )}
                        </td>
                        <td>
                          <div className={styles.rowActions}>
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
                                onClick={() => handleArchiveTenant(inst.instituteId, inst.name)}
                              >
                                📦 Archive
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
              {adminTeam.map(spoc => {
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
                      <div className={styles.spocTenantLabel}>Assigned University Tenant</div>
                      <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                        {spoc.assignedInstituteName}
                      </div>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div>✉️ {spoc.email}</div>
                      <div>📞 {spoc.phone}</div>
                      <div style={{ marginTop: '4px' }}>
                        <span className={`${styles.badge} ${styles.badgeRole}`}>{spoc.slaHealth}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
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
                  <span>System Log Stream</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnOutline} ${styles.btnXs}`}
                  onClick={() => setIsLiveStreaming(!isLiveStreaming)}
                >
                  {isLiveStreaming ? '● LIVE (Auto-polling)' : '○ PAUSED'}
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnOutline} ${styles.btnXs}`}
                  onClick={() => setLogs([])}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnOutline} ${styles.btnXs}`}
                  onClick={() => {
                    const text = logs.map(l => `[${l.timestamp}] [${l.level}] [${l.module}] ${l.message}`).join('\n');
                    const blob = new Blob([text], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `lumina_system_logs_${new Date().toISOString().slice(0, 10)}.log`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download .log
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
                <select
                  className={styles.filterSelect}
                  style={{ background: '#090d16', color: '#f1f5f9', borderColor: '#334155' }}
                  value={logModuleFilter}
                  onChange={(e) => setLogModuleFilter(e.target.value)}
                >
                  <option value="ALL">All Modules</option>
                  <option value="AuthService">AuthService</option>
                  <option value="UsersService">UsersService</option>
                  <option value="CoursesService">CoursesService</option>
                  <option value="SectionsService">SectionsService</option>
                  <option value="OverridesService">OverridesService</option>
                  <option value="RevenueService">RevenueService</option>
                  <option value="DatabaseService">DatabaseService</option>
                  <option value="SuperUserService">SuperUserService</option>
                </select>

                <input
                  type="text"
                  placeholder="Filter logs..."
                  className={styles.searchInput}
                  style={{ background: '#090d16', color: '#f1f5f9', borderColor: '#334155', width: '180px' }}
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                />

                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                  {filteredLogs.length} / {logs.length} lines
                </span>
              </div>
            </div>

            <div className={styles.terminalViewport}>
              {filteredLogs.map((log, i) => (
                <div key={i} className={styles.logLine}>
                  <span className={styles.logTime}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className={
                    log.level === 'WARN' ? styles.logLevelWarn :
                    log.level === 'ERROR' ? styles.logLevelError :
                    log.level === 'DEBUG' ? styles.logLevelDebug : styles.logLevelInfo
                  }>
                    [{log.level}]
                  </span>
                  <span className={styles.logModule}>[{log.module || 'System'}]</span>
                  <span className={styles.logMsg}>{log.message}</span>
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* MODAL 1: DYNAMIC CRUD MODAL                              */}
      {/* ======================================================== */}
      {crudModal.isOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalDialog}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>
                  {crudModal.mode === 'create' ? `Add New ${ENTITY_CONFIGS[selectedEntity]?.singular}` : `Edit ${ENTITY_CONFIGS[selectedEntity]?.singular}`}
                </h3>
                <span className={styles.modalSubtitle}>Configure schema attributes for Lumina database</span>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setCrudModal({ isOpen: false, mode: 'create', data: null })}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEntity}>
              <div className={styles.modalBody}>
                {renderFormFields(selectedEntity, crudModal.mode, crudModal.data)}
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnOutline}`}
                  onClick={() => setCrudModal({ isOpen: false, mode: 'create', data: null })}
                >
                  Cancel
                </button>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: DELETE CONFIRMATION MODAL                       */}
      {/* ======================================================== */}
      {deleteModal.isOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalDialog}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle} style={{ color: '#ef4444' }}>Confirm Permanent Deletion</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setDeleteModal({ isOpen: false, id: null, confirmId: '' })}
              >
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>This action cannot be undone. To delete, please confirm record ID: <code>{deleteModal.id}</code></p>
              <input
                type="text"
                className={styles.formControl}
                placeholder="Type ID to confirm..."
                value={deleteModal.confirmId}
                onChange={(e) => setDeleteModal(prev => ({ ...prev, confirmId: e.target.value }))}
              />
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnOutline}`}
                onClick={() => setDeleteModal({ isOpen: false, id: null, confirmId: '' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnDanger}`}
                disabled={String(deleteModal.confirmId).trim() !== String(deleteModal.id).trim()}
                onClick={confirmDelete}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

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

      <Footer />
    </>
  );
}

// ----------------------------------------------------------------------------
// Helper: Render Row Cells for each Entity
// ----------------------------------------------------------------------------
function renderRowCells(entityKey, item, actions) {
  switch (entityKey) {
    case 'users':
      return (
        <>
          <td><strong>{item.userId || item.User_ID}</strong></td>
          <td>{item.fullName || item.Full_Name || '—'}</td>
          <td>{item.email || item.Email || '—'}</td>
          <td><span className={`${styles.badge} ${styles.badgeRole}`}>{item.role || item.Role || 'Student'}</span></td>
          <td>{item.deptId || item.Dept_ID || '—'}</td>
          <td>
            <div className={styles.rowActions}>
              <button type="button" className={styles.actionBtn} onClick={() => actions.onEdit(item)}>Edit</button>
              <button type="button" className={`${styles.actionBtn} ${styles.actionBtnDelete}`} onClick={() => actions.onDelete(item.userId || item.User_ID)}>Delete</button>
            </div>
          </td>
        </>
      );
    case 'courses':
      return (
        <>
          <td><strong>{item.courseId}</strong></td>
          <td>{item.courseName || '—'}</td>
          <td>{item.credits ?? '—'}</td>
          <td>{item.capacity ?? '—'}</td>
          <td><span className={`${styles.badge} ${item.status === 'Inactive' ? styles.badgeRejected : styles.badgeApproved}`}>{item.status || 'Active'}</span></td>
          <td>{item.deptId || '—'}</td>
          <td>
            <div className={styles.rowActions}>
              <button type="button" className={styles.actionBtn} onClick={() => actions.onEdit(item)}>Edit</button>
            </div>
          </td>
        </>
      );
    case 'sections':
      return (
        <>
          <td><strong>{item.sectionId}</strong></td>
          <td>{item.courseId || '—'}</td>
          <td>{item.term || '—'}</td>
          <td>{item.instructor || '—'}</td>
          <td>{item.capacity ?? '—'}</td>
          <td>
            <div className={styles.rowActions}>
              <button type="button" className={styles.actionBtn} onClick={() => actions.onEdit(item)}>Edit</button>
              <button type="button" className={`${styles.actionBtn} ${styles.actionBtnDelete}`} onClick={() => actions.onDelete(item.sectionId)}>Delete</button>
            </div>
          </td>
        </>
      );
    case 'course-slots':
      return (
        <>
          <td><strong>{item.slotId}</strong></td>
          <td>{item.sectionId || '—'}</td>
          <td>{item.day || '—'}</td>
          <td>{item.time || '—'}</td>
          <td>{item.room || '—'}</td>
          <td>
            <div className={styles.rowActions}>
              <button type="button" className={styles.actionBtn} onClick={() => actions.onEdit(item)}>Edit</button>
              <button type="button" className={`${styles.actionBtn} ${styles.actionBtnDelete}`} onClick={() => actions.onDelete(item.slotId)}>Delete</button>
            </div>
          </td>
        </>
      );
    case 'registrations':
      return (
        <>
          <td><strong>{item.enrollmentId}</strong></td>
          <td>{item.studentId || '—'}</td>
          <td>{item.courseId || '—'}</td>
          <td>{item.term || '—'}</td>
          <td><span className={`${styles.badge} ${styles.badgeApproved}`}>{item.status || 'Enrolled'}</span></td>
          <td><strong>{item.finalGrade || 'N/A'}</strong></td>
          <td>
            <div className={styles.rowActions}>
              <button type="button" className={styles.actionBtn} onClick={() => actions.onEdit(item)}>Edit Grade</button>
            </div>
          </td>
        </>
      );
    case 'overrides': {
      const isPending = item.status === 'Pending';
      return (
        <>
          <td><strong>{item.requestId}</strong></td>
          <td>{item.studentId || '—'}</td>
          <td>{item.courseId || '—'}</td>
          <td>{item.reason || '—'}</td>
          <td><span className={`${styles.badge} ${item.status === 'Approved' ? styles.badgeApproved : item.status === 'Rejected' ? styles.badgeRejected : styles.badgePending}`}>{item.status || 'Pending'}</span></td>
          <td>
            <div className={styles.rowActions}>
              {isPending ? (
                <>
                  <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnXs}`} onClick={() => actions.onApprove(item.requestId)}>✓ Approve</button>
                  <button type="button" className={`${styles.btn} ${styles.btnDangerOutline} ${styles.btnXs}`} onClick={() => actions.onReject(item.requestId)}>✕ Reject</button>
                </>
              ) : (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Decided</span>
              )}
            </div>
          </td>
        </>
      );
    }
    case 'enrollment-phases': {
      const id = item.phaseId || item.id;
      return (
        <>
          <td><strong>{id}</strong></td>
          <td>{item.phaseName || item.name || '—'}</td>
          <td>{item.eligibleGroups || 'All Students'}</td>
          <td>{item.timeline || `${item.startDate || ''} – ${item.endDate || ''}`}</td>
          <td><span className={`${styles.badge} ${styles.badgeApproved}`}>{item.status || 'Active'}</span></td>
          <td>
            <div className={styles.rowActions}>
              <button type="button" className={styles.actionBtn} onClick={() => actions.onEdit(item)}>Edit</button>
              <button type="button" className={`${styles.actionBtn} ${styles.actionBtnDelete}`} onClick={() => actions.onDelete(id)}>Delete</button>
            </div>
          </td>
        </>
      );
    }
    case 'announcements': {
      const id = item.announcementId || item.id;
      return (
        <>
          <td><strong>{id}</strong></td>
          <td><span className={`${styles.badge} ${styles.badgeRole}`}>{item.courseId || 'ALL'}</span></td>
          <td><strong>{item.title || '—'}</strong></td>
          <td>{item.message || '—'}</td>
          <td>{item.postedBy || 'Admin'}</td>
          <td>
            <div className={styles.rowActions}>
              <button type="button" className={`${styles.actionBtn} ${styles.actionBtnDelete}`} onClick={() => actions.onDelete(id)}>Delete</button>
            </div>
          </td>
        </>
      );
    }
    default:
      return null;
  }
}

// ----------------------------------------------------------------------------
// Helper: Render Dynamic Form Fields for CRUD modal
// ----------------------------------------------------------------------------
function renderFormFields(entityKey, mode, data) {
  const isEdit = mode === 'edit';
  switch (entityKey) {
    case 'users':
      return (
        <>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>User ID</label>
            <input
              type="text"
              name="userId"
              required
              readOnly={isEdit}
              defaultValue={data?.userId || data?.User_ID || ''}
              className={styles.formControl}
              placeholder="e.g. U-1009"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Full Name</label>
            <input
              type="text"
              name="fullName"
              required
              defaultValue={data?.fullName || data?.Full_Name || ''}
              className={styles.formControl}
              placeholder="e.g. Dr. Jane Doe"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Email</label>
            <input
              type="email"
              name="email"
              required
              defaultValue={data?.email || data?.Email || ''}
              className={styles.formControl}
              placeholder="jane.doe@lumina.edu"
            />
          </div>
          {!isEdit && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Password</label>
              <input
                type="password"
                name="password"
                className={styles.formControl}
                placeholder="Defaults to Lumina@123"
              />
            </div>
          )}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Role</label>
              <select name="role" defaultValue={data?.role || data?.Role || 'Student'} className={styles.formControl}>
                <option value="Student">Student</option>
                <option value="Faculty">Faculty</option>
                <option value="Dean">Dean</option>
                <option value="Assistant_Dean_1">Assistant Dean 1</option>
                <option value="Assistant_Dean_2">Assistant Dean 2</option>
                <option value="Admin">Admin</option>
                <option value="Super_User">Super User</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Department</label>
              <input
                type="text"
                name="deptId"
                defaultValue={data?.deptId || data?.Dept_ID || 'CSE'}
                className={styles.formControl}
                placeholder="e.g. CSE"
              />
            </div>
          </div>
        </>
      );
    case 'courses':
      return (
        <>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Course ID</label>
            <input
              type="text"
              name="courseId"
              required
              readOnly={isEdit}
              defaultValue={data?.courseId || ''}
              className={styles.formControl}
              placeholder="e.g. CS302"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Course Name</label>
            <input
              type="text"
              name="courseName"
              required
              defaultValue={data?.courseName || ''}
              className={styles.formControl}
              placeholder="e.g. Database Management Systems"
            />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Credits</label>
              <input
                type="number"
                name="credits"
                required
                defaultValue={data?.credits ?? 4}
                className={styles.formControl}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Capacity</label>
              <input
                type="number"
                name="capacity"
                required
                defaultValue={data?.capacity ?? 60}
                className={styles.formControl}
              />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Department</label>
              <input
                type="text"
                name="deptId"
                defaultValue={data?.deptId || 'CSE'}
                className={styles.formControl}
              />
            </div>
            {isEdit && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Status</label>
                <select name="status" defaultValue={data?.status || 'Active'} className={styles.formControl}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>
        </>
      );
    case 'registrations':
      return (
        <>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Enrollment ID</label>
            <input type="text" readOnly defaultValue={data?.enrollmentId} className={styles.formControl} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Final Grade</label>
            <input
              type="text"
              name="finalGrade"
              required
              defaultValue={data?.finalGrade || ''}
              className={styles.formControl}
              placeholder="e.g. A, A-, B+, B"
            />
          </div>
        </>
      );
    case 'announcements':
      return (
        <>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Course ID</label>
            <input type="text" name="courseId" defaultValue="ALL" className={styles.formControl} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Title</label>
            <input type="text" name="title" required className={styles.formControl} placeholder="Announcement Title" />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Message Body</label>
            <textarea name="message" required rows={4} className={styles.formControl} placeholder="Write announcement message..." />
          </div>
        </>
      );
    default:
      return <div>No custom fields defined for {entityKey}</div>;
  }
}
