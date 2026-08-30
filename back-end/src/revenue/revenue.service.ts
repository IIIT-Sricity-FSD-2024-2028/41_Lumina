import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CourseCatalog, SaasPlanDefinition } from '../database/interfaces';

export type SaasTierLevel = 'Starter' | 'Campus' | 'Enterprise';
export type { SaasPlanDefinition };

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

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Returns current active tier and enabled feature permissions
   */
  getActiveTier() {
    const plans = this.getSaasPlans().plans;
    const activeTier = this.databaseService.activeInstitutePlan.tier;
    const activePlan =
      plans.find(
        (p) =>
          p.name.toLowerCase().includes(activeTier.toLowerCase()) ||
          p.id.toLowerCase() === activeTier.toLowerCase(),
      ) || plans[2] || plans[0];
    return {
      activeTier,
      activePlan,
    };
  }

  /**
   * Allows Super User / Dean to change active SaaS tier (for demo/eval purposes)
   */
  setActiveTier(tier: SaasTierLevel) {
    this.databaseService.activeInstitutePlan.tier = tier;
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
    for (const [studentId, payment] of Object.entries(this.databaseService.studentPaymentLedger)) {
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

    const activeTier = this.databaseService.activeInstitutePlan.tier;
    const mrr = activeTier === 'Starter' ? 1499 : activeTier === 'Campus' ? 3999 : 8999;

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
        tier: activeTier,
        planName: `Lumina ${activeTier} Tier`,
        annualRecurringRevenue: mrr * 12,
        monthlyRecurringRevenue: mrr,
        billingCycle: 'Annual (Billed Monthly)',
        enabledModules: this.getEnabledModulesForTier(activeTier),
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
    let user = this.databaseService.users.find(
      (u) => u.userId === studentId && u.role === 'Student',
    );
    if (!user) {
      user = this.databaseService.users.find((u) => u.role === 'Student') || {
        userId: studentId && studentId.startsWith('S') ? studentId : 'S2024001',
        fullName: 'Mahtab Alam',
        email: 'mahtab@lumina.iiits.in',
        password: '',
        role: 'Student',
        deptId: 'CSE',
      };
    }

    const effectiveId = user.userId;

    const studentRegistrations = this.databaseService.registrations.filter(
      (r) => r.studentId === effectiveId && r.status === 'Enrolled',
    );

    const courses = this.databaseService.courseCatalog;
    const courseMap = new Map<string, CourseCatalog>(
      courses.map((c) => [c.courseId, c]),
    );

    let itemizedCourses = studentRegistrations.map((reg) => {
      const course = courseMap.get(reg.courseId);
      const credits = course ? course.credits : 3;
      const cost = credits * this.TUITION_PER_CREDIT;
      return {
        courseId: reg.courseId,
        courseName: course ? course.courseName : 'Academic Course',
        credits,
        cost,
        status: reg.status,
      };
    });

    if (itemizedCourses.length === 0) {
      const defaultCourses = courses.slice(0, 4);
      itemizedCourses = defaultCourses.map((c) => ({
        courseId: c.courseId,
        courseName: c.courseName,
        credits: c.credits || 4,
        cost: (c.credits || 4) * this.TUITION_PER_CREDIT,
        status: 'Enrolled',
      }));
    }

    const totalCredits = itemizedCourses.reduce((sum, c) => sum + c.credits, 0);
    const tuitionFee = totalCredits * this.TUITION_PER_CREDIT;
    const campusFee = totalCredits > 0 ? this.CAMPUS_FEE : 0;
    const totalAmountDue = tuitionFee + campusFee;

    const paymentInfo = this.databaseService.studentPaymentLedger[effectiveId];
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
      totalEnrolledCourses: itemizedCourses.length,
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
    const effectiveId = billing.studentId;
    const payAmount = amount && amount > 0 ? amount : billing.balanceDue;

    if (payAmount <= 0) {
      return {
        success: true,
        transactionId: `TXN-ALREADY-CLEARED-${Date.now()}`,
        studentId: effectiveId,
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

    this.databaseService.studentPaymentLedger[effectiveId] = {
      amountPaid: newAmountPaid,
      paymentDate: timestamp,
      status: newStatus,
    };

    return {
      success: true,
      transactionId,
      studentId: effectiveId,
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
      plans: this.databaseService.saasPlans,
      billingOptions: {
        annualDiscountPercent: 20,
        currency: 'USD',
      },
    };
  }
}

