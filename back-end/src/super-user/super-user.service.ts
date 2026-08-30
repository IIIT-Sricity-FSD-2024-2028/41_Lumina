import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { LogManagerService } from '../common/middleware/log-manager.service';
import * as os from 'os';

export interface LuminaAdminSpoc {
  adminId: string;
  fullName: string;
  email: string;
  phone: string;
  assignedInstituteId: string;
  assignedInstituteName: string;
  role: 'Lumina_SPOC';
  status: 'Active' | 'On Leave';
  slaHealth: string;
  activeDockets: number;
}

export interface ClientInstitute {
  instituteId: string;
  name: string;
  tier: 'Starter' | 'Campus' | 'Enterprise';
  spocAdminId: string;
  spocName: string;
  deanName: string;
  deanEmail: string;
  studentCount: number;
  status: 'Active' | 'Onboarding' | 'Trial';
  annualContractValue: number;
  joinedDate: string;
}

/**
 * SuperUserService
 *
 * Provides administrative business logic for the Super User (Top Admin):
 * 1. Log querying and inspection (Access Logs, Error Logs).
 * 2. System health metrics (Memory usage, Node uptime, Platform info).
 * 3. Global ecosystem stats (Total Users, Courses, Sections, Registrations).
 * 4. Multi-College SaaS Operations: Lumina Admin Team (Institute SPOCs) and Client Institutes.
 */
@Injectable()
export class SuperUserService {
  // In-memory Lumina Staff / Admin Team roster (employed under Super User)
  private adminTeam: LuminaAdminSpoc[] = [
    {
      adminId: 'SPOC-001',
      fullName: 'Arjun Verma',
      email: 'arjun.spoc@lumina.edu',
      phone: '+91 98765 43210',
      assignedInstituteId: 'INST-IIITS',
      assignedInstituteName: 'IIIT Sri City',
      role: 'Lumina_SPOC',
      status: 'Active',
      slaHealth: '99.99% SLA (Healthy)',
      activeDockets: 2,
    },
    {
      adminId: 'SPOC-002',
      fullName: 'Eswar Prasad',
      email: 'eswar.spoc@lumina.edu',
      phone: '+91 98765 43211',
      assignedInstituteId: 'INST-IITB',
      assignedInstituteName: 'IIT Bombay',
      role: 'Lumina_SPOC',
      status: 'Active',
      slaHealth: '99.95% SLA (Healthy)',
      activeDockets: 4,
    },
    {
      adminId: 'SPOC-003',
      fullName: 'Priya Sharma',
      email: 'priya.spoc@lumina.edu',
      phone: '+91 98765 43212',
      assignedInstituteId: 'INST-BITS',
      assignedInstituteName: 'BITS Pilani',
      role: 'Lumina_SPOC',
      status: 'Active',
      slaHealth: '99.90% SLA (Healthy)',
      activeDockets: 1,
    },
  ];

  // In-memory Client Institutes / Multi-Tenant Directory
  private institutes: ClientInstitute[] = [
    {
      instituteId: 'INST-IIITS',
      name: 'Indian Institute of Information Technology Sri City',
      tier: 'Enterprise',
      spocAdminId: 'SPOC-001',
      spocName: 'Arjun Verma',
      deanName: 'Dr. K Divyabramham',
      deanEmail: 'dean@iiits.in',
      studentCount: 1250,
      status: 'Active',
      annualContractValue: 107988,
      joinedDate: '2024-06-01',
    },
    {
      instituteId: 'INST-IITB',
      name: 'Indian Institute of Technology Bombay',
      tier: 'Campus',
      spocAdminId: 'SPOC-002',
      spocName: 'Eswar Prasad',
      deanName: 'Dr. Himangshu Sarma',
      deanEmail: 'dean@iitb.ac.in',
      studentCount: 4800,
      status: 'Active',
      annualContractValue: 47988,
      joinedDate: '2025-01-15',
    },
    {
      instituteId: 'INST-BITS',
      name: 'Birla Institute of Technology and Science, Pilani',
      tier: 'Starter',
      spocAdminId: 'SPOC-003',
      spocName: 'Priya Sharma',
      deanName: 'Prof. Sudhirkumar Barai',
      deanEmail: 'dean@pilani.bits-pilani.ac.in',
      studentCount: 3500,
      status: 'Active',
      annualContractValue: 17988,
      joinedDate: '2025-08-10',
    },
  ];


  constructor(
    private readonly db: DatabaseService,
    private readonly logManager: LogManagerService,
  ) { }

  /**
   * Retrieves access, error, or auth log lines from the server filesystem.
   */
  getSystemLogs(type: 'access' | 'error' | 'auth' = 'access', maxLines = 50) {
    const logs = this.logManager.getRecentLogs(type, maxLines);
    return {
      logType: type,
      totalLinesRetrieved: logs.length,
      timestamp: new Date().toISOString(),
      logs,
    };
  }

  /**
   * Triggers an immediate log maintenance archive run.
   */
  triggerLogArchive() {
    this.logManager.performPeriodicLogMaintenance();
    return {
      success: true,
      message: 'Log maintenance and snapshot archive executed successfully.',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Aggregates live system health, process metrics, and database ecosystem stats.
   */
  getSystemHealth() {
    const memoryUsage = process.memoryUsage();
    return {
      server: {
        status: 'ONLINE',
        uptimeSeconds: Math.floor(process.uptime()),
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        cpuCount: os.cpus().length,
        freeMemoryMB: Math.round(os.freemem() / (1024 * 1024)),
        totalMemoryMB: Math.round(os.totalmem() / (1024 * 1024)),
        processMemory: {
          heapUsedMB: Math.round(memoryUsage.heapUsed / (1024 * 1024)),
          heapTotalMB: Math.round(memoryUsage.heapTotal / (1024 * 1024)),
          rssMB: Math.round(memoryUsage.rss / (1024 * 1024)),
        },
      },
      ecosystem: {
        totalUsers: this.db.users.length,
        totalStudents: this.db.students.length,
        totalDepartments: this.db.departments.length,
        totalCourses: this.db.courseCatalog.length,
        totalSections: this.db.sections.length,
        totalRegistrations: this.db.registrations.length,
        policyStatus: this.db.policySettings.systemStatus,
        windowStatus: this.db.policySettings.windowStatus,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Returns a breakdown of all system users by role.
   */
  getAllUsersSummary() {
    const roleCounts: Record<string, number> = {};
    for (const user of this.db.users) {
      roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
    }

    return {
      totalUsers: this.db.users.length,
      roleBreakdown: roleCounts,
      users: this.db.users.map((u) => ({
        userId: u.userId,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        deptId: u.deptId,
      })),
    };
  }

  // =========================================================================
  // --- MULTI-COLLEGE SAAS: LUMINA ADMIN TEAM & INSTITUTE SPOC APIS ---
  // =========================================================================

  /**
   * Returns all Lumina Admins (SPOCs) employed under Super User
   */
  getAdminTeam(): LuminaAdminSpoc[] {
    return this.adminTeam;
  }

  /**
   * Recruits / adds a new Lumina Admin SPOC to the internal staff
   */
  addAdminSpoc(payload: Partial<LuminaAdminSpoc>): LuminaAdminSpoc {
    const newAdmin: LuminaAdminSpoc = {
      adminId: payload.adminId || `SPOC-00${this.adminTeam.length + 1}`,
      fullName: payload.fullName || 'Lumina Operations Admin',
      email: payload.email || 'admin.spoc@lumina.edu',
      phone: payload.phone || '+91 98765 00000',
      assignedInstituteId: payload.assignedInstituteId || 'UNASSIGNED',
      assignedInstituteName: payload.assignedInstituteName || 'Floating Support Queue',
      role: 'Lumina_SPOC',
      status: payload.status || 'Active',
      slaHealth: '99.95% SLA (Standard)',
      activeDockets: 0,
    };
    this.adminTeam.push(newAdmin);
    return newAdmin;
  }

  /**
   * Returns all onboarded client institutions
   */
  getInstitutes(): ClientInstitute[] {
    return this.institutes;
  }

  /**
   * Onboards a new client institution tenant and links it to a Lumina SPOC
   */
  onboardInstitute(payload: Partial<ClientInstitute>): ClientInstitute {
    const spoc = this.adminTeam.find((a) => a.adminId === payload.spocAdminId) || this.adminTeam[0];

    const newInst: ClientInstitute = {
      instituteId: payload.instituteId || `INST-${Date.now().toString().slice(-4)}`,
      name: payload.name || 'New University Client',
      tier: payload.tier || 'Campus',
      spocAdminId: spoc.adminId,
      spocName: spoc.fullName,
      deanName: payload.deanName || 'Academic Dean',
      deanEmail: payload.deanEmail || 'dean@university.edu',
      studentCount: Number(payload.studentCount) || 1000,
      status: payload.status || 'Active',
      annualContractValue: payload.tier === 'Starter' ? 17988 : payload.tier === 'Campus' ? 47988 : 107988,
      joinedDate: new Date().toISOString().split('T')[0],
    };

    this.institutes.push(newInst);

    spoc.assignedInstituteId = newInst.instituteId;
    spoc.assignedInstituteName = newInst.name;

    return newInst;
  }

  /**
   * Updates an institute's plan tier
   */
  updateInstituteTier(instituteId: string, tier: 'Starter' | 'Campus' | 'Enterprise'): ClientInstitute {
    const inst = this.institutes.find((i) => i.instituteId === instituteId);
    if (!inst) throw new NotFoundException(`Institute '${instituteId}' not found.`);

    inst.tier = tier;
    inst.annualContractValue = tier === 'Starter' ? 17988 : tier === 'Campus' ? 47988 : 107988;
    return inst;
  }

  /**
   * Assigns / reassigns a Lumina SPOC to a specific institute
   */
  assignSpocToInstitute(instituteId: string, spocAdminId: string) {
    const inst = this.institutes.find((i) => i.instituteId === instituteId);
    if (!inst) throw new NotFoundException(`Institute '${instituteId}' not found.`);

    const spoc = this.adminTeam.find((a) => a.adminId === spocAdminId);
    if (!spoc) throw new NotFoundException(`Lumina Admin SPOC '${spocAdminId}' not found.`);

    inst.spocAdminId = spoc.adminId;
    inst.spocName = spoc.fullName;

    spoc.assignedInstituteId = inst.instituteId;
    spoc.assignedInstituteName = inst.name;

    return {
      success: true,
      message: `Assigned ${spoc.fullName} as dedicated SPOC for ${inst.name}.`,
      institute: inst,
      spoc,
    };
  }
}
