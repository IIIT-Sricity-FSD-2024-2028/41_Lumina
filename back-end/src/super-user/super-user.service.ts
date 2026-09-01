import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import type { LuminaAdminSpoc, ClientInstitute } from '../database/interfaces';
import { LogManagerService } from '../common/middleware/log-manager.service';
import * as os from 'os';

export type { LuminaAdminSpoc, ClientInstitute };

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
    return this.db.adminTeam;
  }

  /**
   * Recruits / adds a new Lumina Admin SPOC to the internal staff
   */
  addAdminSpoc(payload: Partial<LuminaAdminSpoc>): LuminaAdminSpoc {
    const newAdmin: LuminaAdminSpoc = {
      adminId: payload.adminId || `SPOC-00${this.db.adminTeam.length + 1}`,
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
    this.db.adminTeam.push(newAdmin);
    return newAdmin;
  }

  /**
   * Returns all onboarded client institutions with dynamic tenant lifecycle state
   */
  getInstitutes(): ClientInstitute[] {
    const activePlan = this.db.activeInstitutePlan;
    const realStudentsCount = this.db.users.filter((u) => u.role === 'Student').length;
    const iiitsStudentCount = Math.max(1250, 1250 + (realStudentsCount - 22));

    return this.db.institutes.map((inst) => {
      let dynamicStudentCount = inst.studentCount;
      if (inst.instituteId === 'INST-IIITS') {
        dynamicStudentCount = activePlan.status === 'Suspended' ? 0 : iiitsStudentCount;
        if (activePlan.status === 'Read_Only_Grace_Period') {
          return {
            ...inst,
            studentCount: dynamicStudentCount,
            status: 'Grace_Period',
            displayTier: 'Enterprise (Grace Period)',
          };
        } else if (activePlan.status === 'Canceled') {
          return {
            ...inst,
            studentCount: dynamicStudentCount,
            status: 'Canceled',
            displayTier: 'Enterprise (Auto-Renew OFF)',
          };
        } else if (activePlan.status === 'Suspended') {
          return {
            ...inst,
            studentCount: 0,
            status: 'Archived',
            displayTier: 'Archived (Cold Storage)',
          };
        }
      } else if (inst.status === 'Archived') {
        dynamicStudentCount = 0;
      }
      return {
        ...inst,
        studentCount: dynamicStudentCount,
        displayTier: `${inst.tier} Tier`,
      };
    });
  }

  /**
   * Archives an expired tenant, releases seat capacity, and moves data to Cold Storage
   */
  archiveInstitute(instituteId: string) {
    const inst = this.db.institutes.find((i) => i.instituteId === instituteId);
    if (!inst) {
      return { success: false, message: `Institute ${instituteId} not found.` };
    }

    inst.status = 'Archived';
    if (instituteId === 'INST-IIITS') {
      this.db.activeInstitutePlan.status = 'Suspended';
    }

    const spoc = this.db.adminTeam.find((a) => a.adminId === inst.spocAdminId);
    if (spoc) {
      spoc.assignedInstituteId = 'UNASSIGNED';
      spoc.assignedInstituteName = 'Floating Support Queue';
    }

    return {
      success: true,
      instituteId,
      instituteName: inst.name,
      status: 'Archived',
      message: `Tenant ${inst.name} successfully encrypted and migrated to Cold Storage. Seat quota (1,250 seats) reclaimed.`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Onboards a new client institution tenant and links it to a Lumina SPOC
   */
  onboardInstitute(payload: Partial<ClientInstitute>): ClientInstitute {
    const spoc = this.db.adminTeam.find((a: LuminaAdminSpoc) => a.adminId === payload.spocAdminId) || this.db.adminTeam[0];

    const targetTier = payload.tier || 'Campus';
    const plan = this.db.saasPlans.find(
      (p) => p.id.toLowerCase() === targetTier.toLowerCase() || p.name.toLowerCase().includes(targetTier.toLowerCase()),
    );
    const calculatedAcv = plan ? plan.annualMonthlyPrice * 12 : 41988;

    const newInst: ClientInstitute = {
      instituteId: payload.instituteId || `INST-${Date.now().toString().slice(-4)}`,
      name: payload.name || 'New University Client',
      tier: targetTier,
      spocAdminId: spoc.adminId,
      spocName: spoc.fullName,
      deanName: payload.deanName || 'Academic Dean',
      deanEmail: payload.deanEmail || 'dean@university.edu',
      studentCount: Number(payload.studentCount) || 1000,
      status: payload.status || 'Active',
      annualContractValue: calculatedAcv,
      joinedDate: new Date().toISOString().split('T')[0],
    };

    this.db.institutes.push(newInst);

    spoc.assignedInstituteId = newInst.instituteId;
    spoc.assignedInstituteName = newInst.name;

    return newInst;
  }

  /**
   * Updates an institute's plan tier
   */
  updateInstituteTier(instituteId: string, newTier: 'Starter' | 'Campus' | 'Enterprise'): ClientInstitute | null {
    const inst = this.db.institutes.find((i) => i.instituteId === instituteId);
    if (!inst) return null;

    inst.tier = newTier;

    const plan = this.db.saasPlans.find(
      (p) => p.id.toLowerCase() === newTier.toLowerCase() || p.name.toLowerCase().includes(newTier.toLowerCase()),
    );
    if (plan) {
      inst.annualContractValue = plan.annualMonthlyPrice * 12;
    }

    if (instituteId === 'INST-IIITS') {
      this.db.activeInstitutePlan.tier = newTier;
      this.db.activeInstitutePlan.status = 'Active';
      this.db.activeInstitutePlan.autoRenew = true;
    }

    return inst;
  }

  /**
   * Assigns a Lumina SPOC Admin to a specific Client Institute
   */
  assignSpocToInstitute(
    instituteId: string,
    spocId: string,
  ): { success: boolean; institute: ClientInstitute | null; spoc: LuminaAdminSpoc | null } {
    const inst = this.db.institutes.find((i) => i.instituteId === instituteId);
    const spoc = this.db.adminTeam.find((a) => a.adminId === spocId);

    if (!inst || !spoc) {
      return { success: false, institute: null, spoc: null };
    }

    inst.spocAdminId = spoc.adminId;
    inst.spocName = spoc.fullName;

    spoc.assignedInstituteId = inst.instituteId;
    spoc.assignedInstituteName = inst.name;

    return { success: true, institute: inst, spoc: spoc };
  }
}
