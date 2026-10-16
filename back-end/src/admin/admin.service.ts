import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { SupportDocket } from '../database/interfaces';
import { SuperUserService } from '../super-user/super-user.service';

export interface AdminDashboardData {
  spoc: {
    adminId: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    slaHealth: string;
  };
  allSpocs: Array<{
    adminId: string;
    fullName: string;
    email: string;
    phone: string;
    assignedInstituteId: string;
    slaHealth: string;
  }>;
  assignedInstitute: {
    instituteId: string;
    name: string;
    tier: string;
    deanName: string;
    deanEmail: string;
    studentCount: number;
    annualContractValue: number;
    joinedDate: string;
    status: string;
  };
  assignedInstitutes: Array<{
    instituteId: string;
    name: string;
    tier: string;
    deanName: string;
    deanEmail: string;
    studentCount: number;
    annualContractValue: number;
    joinedDate: string;
    status: string;
  }>;
  metrics: {
    openDocketsCount: number;
    resolvedDocketsCount: number;
    totalStudents: number;
    seatsUsed: number;
    quotaPct: number;
    facultyCount: number;
    activeCoursesCount: number;
    totalSectionsCount: number;
    avgResponseMinutes: number;
    slaUptimePercent: string;
  };
  activeTerm: {
    termId: string;
    termName: string;
    startTimestamp: string;
    endTimestamp: string;
    lastBackupVerified: string;
    backupSha256: string;
  };
  ssoConfig: {
    idpName: string;
    metadataUrl: string;
    connectionStatus: string;
    handshakeLatencyMs: number;
    certExpiresInDays: number;
    attributeMapping: string;
    renewalPending: boolean;
  };
  planState: {
    tier: string;
    status: string;
    renewalDate: string;
    annualContractValue: number;
  };
  migrationHistory: Array<{
    id: string;
    type: string;
    records: number;
    status: string;
    runBy: string;
    timestamp: string;
  }>;
  infraMetrics: {
    gatewayLatencyMs: number;
    p99LatencyMs: number;
    dbPoolUsed: number;
    dbPoolTotal: number;
    apiErrorRate: string;
    cdnActive: boolean;
    authTokenIssueRate: string;
    storageUsedGb: number;
    storageTotalGb: number;
    activeSessionsCount: number;
    peakSessionsToday: number;
  };
  recentDockets: SupportDocket[];
  systemAlerts: Array<{
    type: 'warning' | 'info' | 'success';
    title: string;
    message: string;
    time: string;
  }>;
}

@Injectable()
export class AdminService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly superUserService: SuperUserService,
  ) { }

  /**
   * Retrieves aggregated dashboard context for a specific SPOC Admin, optionally scoped to a specific institute
   */
  getDashboard(spocId: string, instituteId?: string): AdminDashboardData {
    const adminTeam = this.databaseService.adminTeam;
    const spoc = adminTeam.find((a) => a.adminId === spocId) || adminTeam[0];

    const institutes = this.databaseService.institutes;
    // Find all client institutes assigned to this SPOC
    const spocInstitutes = institutes.filter((i) => i.spocAdminId === spoc.adminId);
    const availableInstitutes = spocInstitutes.length > 0 ? spocInstitutes : institutes;

    // Resolve active institute: user-specified instituteId OR SPOC assigned institute OR first available
    const assignedInst =
      (instituteId ? institutes.find((i) => i.instituteId === instituteId) : null) ||
      institutes.find((i) => i.instituteId === spoc.assignedInstituteId && (!spocInstitutes.length || spocInstitutes.some(si => si.instituteId === i.instituteId))) ||
      availableInstitutes[0] ||
      institutes[0];

    // Filter dockets for this specific institute and SPOC
    const spocDockets = this.databaseService.supportDockets.filter(
      (d) => d.instituteId === assignedInst.instituteId || (d.assignedSpocId === spoc.adminId && (!instituteId || d.instituteId === assignedInst.instituteId)),
    );
    const openDockets = spocDockets.filter((d) => d.status !== 'Resolved');
    const resolvedDockets = spocDockets.filter((d) => d.status === 'Resolved');

    // Dynamically calculate metrics directly from database
    const activeCoursesCount = this.databaseService.courseCatalog.length;
    const totalSectionsCount = this.databaseService.sections.length;
    const facultyCount = this.databaseService.users.filter(
      (u) => u.role === 'Faculty' && (u.instituteId === assignedInst.instituteId || !u.instituteId),
    ).length;

    // Real student body count in the database for the assigned institute
    const instituteStudents = this.databaseService.students.filter(
      (s) => s.instituteId === assignedInst.instituteId,
    );
    const totalStudentsCount = instituteStudents.length > 0
      ? instituteStudents.length
      : (assignedInst.studentCount || 0);

    // Real count of distinct students who have active course registrations for this institute
    const instituteStudentIds = new Set(
      (instituteStudents.length > 0 ? instituteStudents : this.databaseService.students).map((s) => s.studentId),
    );
    const distinctActiveStudents = new Set(
      this.databaseService.registrations
        .filter((r) => instituteStudentIds.has(r.studentId))
        .map((r) => r.studentId),
    ).size;

    const enrollmentPct = totalStudentsCount > 0
      ? Math.round((distinctActiveStudents / totalStudentsCount) * 100)
      : 0;

    // Calculate average resolution time across resolved dockets with timestamps
    let avgResponseMinutes = 14;
    const resolvedWithTimestamps = resolvedDockets.filter((d) => Boolean(d.createdAt && d.resolvedAt));
    if (resolvedWithTimestamps.length > 0) {
      const totalMinutes = resolvedWithTimestamps.reduce((sum, d) => {
        const start = new Date(d.createdAt).getTime();
        const end = new Date(d.resolvedAt as string).getTime();
        const diffMin = Math.round(Math.abs(end - start) / (1000 * 60));
        return sum + Math.max(1, diffMin);
      }, 0);
      avgResponseMinutes = Math.round(totalMinutes / resolvedWithTimestamps.length);
    }

    const slaStatusStr = (assignedInst as any).slaStatus
      ? (assignedInst as any).slaStatus.replace(' SLA', '')
      : '99.99%';

    // Active academic term from database
    const terms = this.databaseService.academicTerms;
    const activeTermRecord = terms.find((t) => t.termId === 'SPRING2026') || terms[terms.length - 1];

    return {
      spoc: {
        adminId: spoc.adminId,
        fullName: spoc.fullName,
        email: spoc.email,
        phone: spoc.phone,
        role: 'Lumina Institute SPOC',
        slaHealth: spoc.slaHealth || '99.99% SLA (Healthy)',
      },
      allSpocs: adminTeam.map((a) => ({
        adminId: a.adminId,
        fullName: a.fullName,
        email: a.email,
        phone: a.phone,
        assignedInstituteId: a.assignedInstituteId,
        slaHealth: a.slaHealth,
      })),
      assignedInstitute: {
        instituteId: assignedInst.instituteId,
        name: assignedInst.name,
        tier: assignedInst.tier,
        deanName: assignedInst.deanName,
        deanEmail: assignedInst.deanEmail,
        studentCount: totalStudentsCount,
        annualContractValue: assignedInst.annualContractValue,
        joinedDate: assignedInst.joinedDate,
        status: assignedInst.status,
      },
      assignedInstitutes: availableInstitutes.map((inst) => ({
        instituteId: inst.instituteId,
        name: inst.name,
        tier: inst.tier,
        deanName: inst.deanName,
        deanEmail: inst.deanEmail,
        studentCount: inst.instituteId === assignedInst.instituteId ? totalStudentsCount : inst.studentCount,
        annualContractValue: inst.annualContractValue,
        joinedDate: inst.joinedDate,
        status: inst.status,
      })),
      metrics: {
        openDocketsCount: openDockets.length,
        resolvedDocketsCount: resolvedDockets.length,
        totalStudents: totalStudentsCount,
        seatsUsed: distinctActiveStudents,
        quotaPct: enrollmentPct,
        facultyCount,
        activeCoursesCount,
        totalSectionsCount,
        avgResponseMinutes,
        slaUptimePercent: slaStatusStr,
      },
      activeTerm: {
        termId: activeTermRecord?.termId || 'SPRING2026',
        termName: activeTermRecord?.termName || 'Spring 2026',
        startTimestamp: activeTermRecord?.startTimestamp || '2026-01-15T00:00:00Z',
        endTimestamp: activeTermRecord?.endTimestamp || '2026-05-30T23:59:59Z',
        lastBackupVerified: '2026-08-30T09:00:00Z',
        backupSha256: '8f4b3a1c9e2034bc6689d01247fe1882a',
      },
      ssoConfig: {
        idpName: 'Google Workspace SAML',
        metadataUrl: `https://auth.lumina.edu/saml/${assignedInst.instituteId.toLowerCase().replace('inst-', '')}`,
        connectionStatus: 'Active',
        handshakeLatencyMs: 4,
        certExpiresInDays: 14,
        attributeMapping: 'email → NameID · department → groups',
        renewalPending: true,
      },
      planState: {
        tier: assignedInst.tier,
        status: assignedInst.status,
        renewalDate: this.databaseService.activeInstitutePlan?.renewalDate || '2026-12-31',
        annualContractValue: assignedInst.annualContractValue,
      },
      migrationHistory: [
        {
          id: 'MIG-2026-041',
          type: 'Course Catalog',
          records: activeCoursesCount,
          status: 'Completed',
          runBy: `${spoc.fullName} (SPOC)`,
          timestamp: '2026-10-14 09:22 IST',
        },
        {
          id: 'MIG-2026-039',
          type: 'Student Roster',
          records: totalStudentsCount,
          status: 'Completed',
          runBy: assignedInst.deanEmail,
          timestamp: '2026-09-30 18:05 IST',
        },
        {
          id: 'MIG-2026-034',
          type: 'Faculty Roster',
          records: facultyCount,
          status: 'Completed',
          runBy: `${spoc.fullName} (SPOC)`,
          timestamp: '2026-09-01 10:15 IST',
        },
      ],
      infraMetrics: {
        gatewayLatencyMs: 14,
        p99LatencyMs: 28,
        dbPoolUsed: 12,
        dbPoolTotal: 20,
        apiErrorRate: '0.01%',
        cdnActive: true,
        authTokenIssueRate: '99.8%',
        storageUsedGb: 18.4,
        storageTotalGb: 50,
        activeSessionsCount: 243,
        peakSessionsToday: 891,
      },
      recentDockets: spocDockets,
      systemAlerts: [
        {
          type: 'info',
          title: `Tenant Active: ${assignedInst.name}`,
          message: `Priority Window 1 active for Spring 2026 term. ${activeCoursesCount} courses and ${totalSectionsCount} sections active in catalog.`,
          time: '10m ago',
        },
        {
          type: 'warning',
          title: 'Student Course Registration Progress',
          message: `${distinctActiveStudents} of ${totalStudentsCount} enrolled students (${enrollmentPct}%) have registered for term sections.`,
          time: '1h ago',
        },
        {
          type: 'success',
          title: 'SLA Performance Healthy',
          message: `Average ticket resolution time is ${avgResponseMinutes} minutes (Target: <30m).`,
          time: '3h ago',
        },
      ],
    };
  }

  /**
   * Retrieves support dockets scoped to a SPOC or Institute
   */
  getDockets(spocId?: string, instituteId?: string): SupportDocket[] {
    let result = [...this.databaseService.supportDockets];
    if (spocId) {
      result = result.filter((d) => d.assignedSpocId === spocId);
    }
    if (instituteId) {
      result = result.filter((d) => d.instituteId === instituteId);
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Submits a new support/onboarding docket
   */
  createDocket(payload: Partial<SupportDocket>): SupportDocket {
    const newDocket: SupportDocket = {
      docketId: `DOC-${Math.floor(1000 + Math.random() * 9000)}`,
      instituteId: payload.instituteId || 'INST-IIITS',
      instituteName: payload.instituteName || 'IIIT Sri City',
      submittedBy: payload.submittedBy || 'dean@iiits.in',
      category: payload.category || 'System_Incident',
      priority: payload.priority || 'Medium',
      subject: payload.subject || 'Administrative support docket',
      description: payload.description || 'No description provided.',
      status: 'Open',
      assignedSpocId: payload.assignedSpocId || 'SPOC-001',
      createdAt: new Date().toISOString(),
    };

    this.databaseService.supportDockets.unshift(newDocket);
    return newDocket;
  }

  /**
   * Updates docket status and attaches resolution notes
   */
  updateDocketStatus(docketId: string, status: 'Open' | 'In_Progress' | 'Resolved', notes?: string): SupportDocket {
    const docket = this.databaseService.supportDockets.find((d) => d.docketId === docketId);
    if (!docket) {
      throw new NotFoundException(`Support Docket '${docketId}' not found.`);
    }

    docket.status = status;
    if (status === 'Resolved') {
      docket.resolvedAt = new Date().toISOString();
      if (notes) docket.resolutionNotes = notes;
    } else if (notes) {
      docket.resolutionNotes = notes;
    }

    return docket;
  }

  /**
   * Validates and imports batch course records for the assigned institute
   */
  bulkImportCourses(courses: Array<{ courseId: string; courseName: string; credits: number; deptId: string }>) {
    const inserted = [];
    for (const c of courses) {
      if (!c.courseId || !c.courseName) continue;
      const existing = this.databaseService.courseCatalog.find((cat) => cat.courseId === c.courseId);
      if (!existing) {
        const newCourse = {
          courseId: c.courseId,
          courseName: c.courseName,
          credits: Number(c.credits) || 4,
          courseCapacity: 60,
          status: 'Active' as const,
          deptId: c.deptId || 'CSE',
          description: `Imported via Lumina Operations Ingestion Tool`,
        };
        this.databaseService.courseCatalog.push(newCourse);
        inserted.push(newCourse);
      }
    }
    return {
      success: true,
      importedCount: inserted.length,
      courses: inserted,
    };
  }
}
