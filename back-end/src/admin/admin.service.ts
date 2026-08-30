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
  metrics: {
    openDocketsCount: number;
    resolvedDocketsCount: number;
    totalStudents: number;
    activeCoursesCount: number;
    totalSectionsCount: number;
    avgResponseMinutes: number;
    slaUptimePercent: string;
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
   * Retrieves aggregated dashboard context for a specific SPOC Admin
   */
  getDashboard(spocId: string): AdminDashboardData {
    const adminTeam = this.databaseService.adminTeam;
    const spoc = adminTeam.find((a) => a.adminId === spocId) || adminTeam[0];

    const institutes = this.databaseService.institutes;
    const assignedInst = institutes.find((i) => i.instituteId === spoc.assignedInstituteId) || institutes[0];

    const spocDockets = this.databaseService.supportDockets.filter((d) => d.assignedSpocId === spoc.adminId || d.instituteId === assignedInst.instituteId);
    const openDockets = spocDockets.filter((d) => d.status !== 'Resolved');
    const resolvedDockets = spocDockets.filter((d) => d.status === 'Resolved');

    const activeCoursesCount = this.databaseService.courseCatalog.length;
    const totalSectionsCount = this.databaseService.sections.length;
    const totalStudents = assignedInst.studentCount || 1250;

    return {
      spoc: {
        adminId: spoc.adminId,
        fullName: spoc.fullName,
        email: spoc.email,
        phone: spoc.phone,
        role: 'Lumina Institute SPOC',
        slaHealth: spoc.slaHealth || '99.99% SLA (Healthy)',
      },
      assignedInstitute: {
        instituteId: assignedInst.instituteId,
        name: assignedInst.name,
        tier: assignedInst.tier,
        deanName: assignedInst.deanName,
        deanEmail: assignedInst.deanEmail,
        studentCount: totalStudents,
        annualContractValue: assignedInst.annualContractValue,
        joinedDate: assignedInst.joinedDate,
        status: assignedInst.status,
      },
      metrics: {
        openDocketsCount: openDockets.length,
        resolvedDocketsCount: resolvedDockets.length,
        totalStudents,
        activeCoursesCount,
        totalSectionsCount,
        avgResponseMinutes: 14,
        slaUptimePercent: '99.99%',
      },
      recentDockets: spocDockets,
      systemAlerts: [
        {
          type: 'info',
          title: 'Enrollment Phase Active',
          message: 'Priority Window 1 active for Spring 2026 term. 84% course slots allocated.',
          time: '15m ago',
        },
        {
          type: 'warning',
          title: 'Section Near Capacity',
          message: 'CS301 Database Systems (Section A) is at 95% capacity.',
          time: '1h ago',
        },
        {
          type: 'success',
          title: 'SLA Performance Healthy',
          message: 'Average ticket resolution time is under 15 minutes (Target: <30m).',
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
