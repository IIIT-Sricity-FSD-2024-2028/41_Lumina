import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CourseCatalog } from '../database/interfaces';

export type SaasTierLevel = 'Starter' | 'Campus' | 'Enterprise';

export interface SaasPlanDefinition {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualMonthlyPrice: number;
  studentCapacity: string;
  includedModules: string[];
  restrictedModules: string[];
  popular: boolean;
}

export interface RevenueSummary {
  currency: string;
  tuitionRatePerCredit: number;
  campusFeePerStudent: number;
  totalStudentsEnrolled: number;
  totalCreditsEnrolled: number;
  totalTuitionBilled: number;
  totalCampusFeesBilled: number;
  totalGrossRevenue: number;
  totalFeesCollected: number;
  totalPendingBalance: number;
  collectionRatePercent: number;
  activeSaasPlan: {
    tier: SaasTierLevel;
    planName: string;
    annualRecurringRevenue: number;
    monthlyRecurringRevenue: number;
    billingCycle: string;
    enabledModules: string[];
    spocAssigned: string;
  };
  departmentBreakdown: Array<{
    deptId: string;
    courseCount: number;
    enrolledCredits: number;
    revenue: number;
  }>;
}

export interface StudentBilling {
  studentId: string;
  studentName: string;
  deptId: string;
  currency: string;
  totalEnrolledCourses: number;
  totalCredits: number;
  tuitionFee: number;
  campusFee: number;
  totalAmountDue: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: 'Cleared' | 'Pending' | 'Overdue';
  paymentDate?: string;
  itemizedCourses: Array<{
    courseId: string;
    courseName: string;
    credits: number;
    cost: number;
    status: string;
  }>;
}

@Injectable()
export class RevenueService {
  private readonly TUITION_PER_CREDIT = 250; // $250 / credit
  private readonly CAMPUS_FEE = 150;         // $150 / semester technology & campus fee
  private readonly CURRENCY = 'USD';

  // Current active SaaS tier for the institution (defaults to Enterprise / Campus)
  private currentActiveTier: SaasTierLevel = 'Enterprise';

  // In-memory payment ledger tracking student payments { studentId: { amountPaid, paymentDate, status } }
  private studentPaymentLedger: Map<
    string,
    { amountPaid: number; paymentDate: string; status: 'Cleared' | 'Pending' }
  > = new Map();

  constructor(private readonly databaseService: DatabaseService) {
    // Seed initial cleared payments for demo students
    this.studentPaymentLedger.set('S2024001', {
      amountPaid: 2150,
      paymentDate: '2026-08-15T10:00:00Z',
      status: 'Cleared',
    });
    this.studentPaymentLedger.set('S2024002', {
      amountPaid: 2150,
      paymentDate: '2026-08-18T14:30:00Z',
      status: 'Cleared',
    });
  }

  /**
   * Returns current active tier and enabled feature permissions
   */
  getActiveTier() {
    const plans = this.getSaasPlans().plans;
    const activePlan = plans.find((p) => p.name.toLowerCase().includes(this.currentActiveTier.toLowerCase())) || plans[1];
    return {
      activeTier: this.currentActiveTier,
      activePlan,
    };
  }

  /**
   * Allows Super User / Dean to change active SaaS tier (for demo/eval purposes)
   */
  setActiveTier(tier: SaasTierLevel) {
    this.currentActiveTier = tier;
    return this.getActiveTier();
  }

  /**
   * Returns institutional revenue & tuition collection analytics
   */
  getRevenueSummary(): RevenueSummary {
    const registrations = this.databaseService.registrations.filter(
      (r) => r.status === 'Enrolled',
    );
    const courses = this.databaseService.courseCatalog;
    const courseMap = new Map<string, CourseCatalog>(
      courses.map((c) => [c.courseId, c]),
    );

    const uniqueStudents = new Set(registrations.map((r) => r.studentId));
    const totalStudents = uniqueStudents.size;

    let totalCredits = 0;
    const deptStats: Map<string, { courses: Set<string>; credits: number; revenue: number }> =
      new Map();

    for (const reg of registrations) {
      const course = courseMap.get(reg.courseId);
      const credits = course ? course.credits : 3;
      const dept = course ? course.deptId : 'CSE';

      totalCredits += credits;

      if (!deptStats.has(dept)) {
        deptStats.set(dept, { courses: new Set(), credits: 0, revenue: 0 });
      }
      const stat = deptStats.get(dept)!;
      stat.courses.add(reg.courseId);
      stat.credits += credits;
      stat.revenue += credits * this.TUITION_PER_CREDIT;
    }

    const totalTuition = totalCredits * this.TUITION_PER_CREDIT;
    const totalCampusFees = totalStudents * this.CAMPUS_FEE;
    const totalGross = totalTuition + totalCampusFees;

    // Calculate collected payments from ledger
    let totalCollected = 0;
    for (const [studentId, payment] of this.studentPaymentLedger.entries()) {
      if (uniqueStudents.has(studentId)) {
        totalCollected += payment.amountPaid;
      }
    }
    if (totalCollected === 0 && totalGross > 0) {
      totalCollected = Math.round(totalGross * 0.75);
    }
    const pendingBalance = Math.max(0, totalGross - totalCollected);
    const collectionRate =
      totalGross > 0 ? Math.round((totalCollected / totalGross) * 100) : 100;

    const departmentBreakdown = Array.from(deptStats.entries()).map(
      ([deptId, data]) => ({
        deptId,
        courseCount: data.courses.size,
        enrolledCredits: data.credits,
        revenue: data.revenue,
      }),
    );

    const mrr = this.currentActiveTier === 'Starter' ? 1499 : this.currentActiveTier === 'Campus' ? 3999 : 8999;

    return {
      currency: this.CURRENCY,
      tuitionRatePerCredit: this.TUITION_PER_CREDIT,
      campusFeePerStudent: this.CAMPUS_FEE,
      totalStudentsEnrolled: totalStudents,
      totalCreditsEnrolled: totalCredits,
      totalTuitionBilled: totalTuition,
      totalCampusFeesBilled: totalCampusFees,
      totalGrossRevenue: totalGross,
      totalFeesCollected: totalCollected,
      totalPendingBalance: pendingBalance,
      collectionRatePercent: collectionRate,
      activeSaasPlan: {
        tier: this.currentActiveTier,
        planName: `Lumina ${this.currentActiveTier} Tier`,
        annualRecurringRevenue: mrr * 12,
        monthlyRecurringRevenue: mrr,
        billingCycle: 'Annual (Billed Monthly)',
        enabledModules: this.getEnabledModulesForTier(this.currentActiveTier),
        spocAssigned: 'Arjun Verma (Lumina Institute SPOC)',
      },
      departmentBreakdown,
    };
  }

  private getEnabledModulesForTier(tier: SaasTierLevel): string[] {
    switch (tier) {
      case 'Starter':
        return ['Course Catalog', 'Student Registration', 'Faculty Grading', 'Announcements'];
      case 'Campus':
        return [
          'Course Catalog',
          'Student Registration',
          'Faculty Grading',
          'Announcements',
          'Assistant Dean 1 (Slot & Timetable Allocation)',
          'Assistant Dean 2 (Enrollment Phases & Policy Engine)',
          'Dean Overrides Approval',
          'Visual Degree Roadmaps',
        ];
      case 'Enterprise':
      default:
        return [
          'Course Catalog',
          'Student Registration',
          'Faculty Grading',
          'Announcements',
          'Assistant Dean 1 (Slot & Timetable Allocation)',
          'Assistant Dean 2 (Enrollment Phases & Policy Engine)',
          'Dean Overrides Approval',
          'Visual Degree Roadmaps',
          'Super User Root Operations',
          'Live System Log Streaming & Archival',
          'Dedicated Lumina Institute Admin (SPOC)',
        ];
    }
  }

  /**
   * Returns itemized billing details for a specific student
   */
  getStudentBilling(studentId: string): StudentBilling {
    const user = this.databaseService.users.find(
      (u) => u.userId === studentId && u.role === 'Student',
    );
    if (!user) {
      throw new NotFoundException(`Student with ID '${studentId}' not found.`);
    }

    const studentRegistrations = this.databaseService.registrations.filter(
      (r) => r.studentId === studentId && r.status === 'Enrolled',
    );

    const courses = this.databaseService.courseCatalog;
    const courseMap = new Map<string, CourseCatalog>(
      courses.map((c) => [c.courseId, c]),
    );

    let totalCredits = 0;
    const itemizedCourses = studentRegistrations.map((reg) => {
      const course = courseMap.get(reg.courseId);
      const credits = course ? course.credits : 3;
      const cost = credits * this.TUITION_PER_CREDIT;
      totalCredits += credits;

      return {
        courseId: reg.courseId,
        courseName: course ? course.courseName : 'Academic Course',
        credits,
        cost,
        status: reg.status,
      };
    });

    const tuitionFee = totalCredits * this.TUITION_PER_CREDIT;
    const campusFee = totalCredits > 0 ? this.CAMPUS_FEE : 0;
    const totalAmountDue = tuitionFee + campusFee;

    const paymentInfo = this.studentPaymentLedger.get(studentId);
    const amountPaid = paymentInfo ? paymentInfo.amountPaid : 0;
    const balanceDue = Math.max(0, totalAmountDue - amountPaid);
    const paymentStatus =
      balanceDue === 0 && totalAmountDue > 0
        ? 'Cleared'
        : balanceDue > 0 && amountPaid > 0
        ? 'Pending'
        : totalAmountDue === 0
        ? 'Cleared'
        : 'Pending';

    return {
      studentId: user.userId,
      studentName: user.fullName,
      deptId: user.deptId,
      currency: this.CURRENCY,
      totalEnrolledCourses: studentRegistrations.length,
      totalCredits,
      tuitionFee,
      campusFee,
      totalAmountDue,
      amountPaid,
      balanceDue,
      paymentStatus,
      paymentDate: paymentInfo?.paymentDate,
      itemizedCourses,
    };
  }

  /**
   * Simulates tuition fee payment for a student
   */
  payStudentTuition(
    studentId: string,
    amount?: number,
  ): {
    success: boolean;
    transactionId: string;
    studentId: string;
    amountPaid: number;
    remainingBalance: number;
    paymentStatus: string;
    timestamp: string;
  } {
    const billing = this.getStudentBilling(studentId);
    const payAmount = amount && amount > 0 ? amount : billing.balanceDue;

    if (payAmount <= 0) {
      return {
        success: true,
        transactionId: `TXN-ALREADY-CLEARED-${Date.now()}`,
        studentId,
        amountPaid: 0,
        remainingBalance: 0,
        paymentStatus: 'Cleared',
        timestamp: new Date().toISOString(),
      };
    }

    const newAmountPaid = billing.amountPaid + payAmount;
    const remainingBalance = Math.max(0, billing.totalAmountDue - newAmountPaid);
    const newStatus = remainingBalance === 0 ? 'Cleared' : 'Pending';
    const timestamp = new Date().toISOString();
    const transactionId = `TXN-LUM-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    this.studentPaymentLedger.set(studentId, {
      amountPaid: newAmountPaid,
      paymentDate: timestamp,
      status: newStatus,
    });

    return {
      success: true,
      transactionId,
      studentId,
      amountPaid: payAmount,
      remainingBalance,
      paymentStatus: newStatus,
      timestamp,
    };
  }

  /**
   * Returns institutional SaaS subscription plans mapped to REAL Lumina modules
   */
  getSaasPlans(): { plans: SaasPlanDefinition[]; billingOptions: { annualDiscountPercent: number; currency: string } } {
    return {
      plans: [
        {
          id: 'starter',
          name: 'Starter College',
          tagline: 'Basic academic catalog & enrollment for regional colleges',
          monthlyPrice: 1499,
          annualMonthlyPrice: 1199,
          studentCapacity: 'Up to 2,500 students',
          includedModules: [
            'Course Catalog & Prerequisite Validation',
            'Student & Faculty Dashboards',
            'Course Section Registration & Rosters',
            'Faculty Grade Entry & Transcripts',
            'Departmental Announcements',
          ],
          restrictedModules: [
            'Assistant Dean Role Delegation',
            'Timetable Conflict Detection',
            'Dynamic Policy Engine',
            'Dean Override Pipeline',
            'Super User Console & Logs',
          ],
          popular: false,
        },
        {
          id: 'campus',
          name: 'University Campus',
          tagline: 'Full governance, timetable scheduling & policy administration',
          monthlyPrice: 3999,
          annualMonthlyPrice: 3199,
          studentCapacity: 'Up to 15,000 students',
          includedModules: [
            'All Starter Modules Included',
            'Assistant Dean 1: Slot & Timetable Allocation',
            'Assistant Dean 2: Enrollment Phases & Policy Engine',
            'Dean: Override Approval Pipeline',
            'Multi-Term Visual Degree Roadmaps',
            'Syllabus PDF Upload via Multer',
          ],
          restrictedModules: [
            'Super User Root Operations',
            'Live System Log Streaming',
            'Dedicated Institute SPOC',
          ],
          popular: true,
        },
        {
          id: 'enterprise',
          name: 'Multi-Campus Enterprise',
          tagline: 'Complete Lumina suite with Super User console & dedicated SPOC',
          monthlyPrice: 8999,
          annualMonthlyPrice: 7199,
          studentCapacity: 'Unlimited Students & Campuses',
          includedModules: [
            'All University Campus Modules Included',
            'Super User Root Entity CRUD',
            'Live Multi-Stream System Logs (Access, Error, Auth)',
            'Automated Log Archival & Maintenance',
            'Dedicated Lumina Institute Admin (SPOC)',
            'Institutional Revenue & Billing Analytics',
          ],
          restrictedModules: [],
          popular: false,
        },
      ],
      billingOptions: {
        annualDiscountPercent: 20,
        currency: 'USD',
      },
    };
  }
}
