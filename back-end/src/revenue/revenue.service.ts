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

  constructor(private readonly databaseService: DatabaseService) { }

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
   * Calculates industry-standard Proration for SaaS plan upgrades, downgrades & renewals
   */
  calculateProration(targetTier: SaasTierLevel, billingCycle: 'monthly' | 'annual' = 'annual') {
    const plans = this.getSaasPlans().plans;
    const currentTier = this.databaseService.activeInstitutePlan.tier;
    const currentCycle = this.databaseService.activeInstitutePlan.billingCycle || 'annual';

    const currentPlan =
      plans.find(
        (p) =>
          p.id.toLowerCase() === currentTier.toLowerCase() ||
          p.name.toLowerCase().includes(currentTier.toLowerCase()),
      ) || plans[0];
    const targetPlan =
      plans.find(
        (p) =>
          p.id.toLowerCase() === targetTier.toLowerCase() ||
          p.name.toLowerCase().includes(targetTier.toLowerCase()),
      ) || plans[2];

    const currentPrice =
      currentCycle === 'annual' ? currentPlan.annualMonthlyPrice : currentPlan.monthlyPrice;
    const targetPrice =
      billingCycle === 'annual' ? targetPlan.annualMonthlyPrice : targetPlan.monthlyPrice;

    // Simulate 15 days remaining in standard 30-day billing cycle
    const daysRemaining = 15;
    const totalDaysInMonth = 30;

    const unusedCredit = Math.round((currentPrice / totalDaysInMonth) * daysRemaining);
    const newPlanRemainingCost = Math.round((targetPrice / totalDaysInMonth) * daysRemaining);

    let action: 'UPGRADE' | 'DOWNGRADE' | 'RENEWAL' = 'RENEWAL';
    let netAmountToPay = 0;
    const effectiveDate = new Date().toISOString();
    const newRenewalDate =
      billingCycle === 'annual'
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    if (targetPrice > currentPrice) {
      action = 'UPGRADE';
      netAmountToPay = Math.max(0, newPlanRemainingCost - unusedCredit);
    } else if (targetPrice < currentPrice) {
      action = 'DOWNGRADE';
      netAmountToPay = 0; // Downgrade takes effect on next renewal date without immediate charge
    } else {
      action = 'RENEWAL';
      netAmountToPay = billingCycle === 'annual' ? targetPrice * 12 : targetPrice;
    }

    return {
      currentTier,
      currentPlanName: currentPlan.name,
      currentPrice,
      currentCycle,
      targetTier,
      targetPlanName: targetPlan.name,
      targetPrice,
      billingCycle,
      action,
      daysRemaining,
      unusedCredit,
      newPlanRemainingCost,
      netAmountToPay,
      effectiveDate,
      newRenewalDate,
      annualSavingsPercent: billingCycle === 'annual' ? 20 : 0,
      currency: this.CURRENCY,
    };
  }

  /**
   * Processes institutional subscription payment and applies tier entitlement immediately
   */
  processSubscriptionPayment(
    targetTier: SaasTierLevel,
    billingCycle: 'monthly' | 'annual' = 'annual',
  ) {
    const proration = this.calculateProration(targetTier, billingCycle);
    const timestamp = new Date().toISOString();
    const transactionId = `TXN-INST-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    // Update active institute plan state
    this.databaseService.activeInstitutePlan = {
      tier: targetTier,
      billingCycle,
      status: 'Active',
      activatedAt: timestamp,
      renewalDate: proration.newRenewalDate,
      autoRenew: true,
    };

    return {
      success: true,
      transactionId,
      invoiceNumber,
      action: proration.action,
      previousTier: proration.currentTier,
      activeTier: targetTier,
      billingCycle,
      activePlanName: proration.targetPlanName,
      amountPaid: proration.netAmountToPay,
      unusedCreditApplied: proration.unusedCredit,
      currency: this.CURRENCY,
      newRenewalDate: proration.newRenewalDate,
      timestamp,
    };
  }

  /**
   * Allows Super User / Dean to change active SaaS tier (for demo/eval purposes)
   */
  setActiveTier(tier: SaasTierLevel, billingCycle: 'monthly' | 'annual' = 'annual') {
    return this.processSubscriptionPayment(tier, billingCycle);
  }

  /**
   * Evaluates tenant lifecycle state (Active, Grace Period, Suspended)
   */
  getTenantLifecycle() {
    const planState = this.databaseService.activeInstitutePlan;
    const renewalMs = new Date(planState.renewalDate || Date.now()).getTime();
    const nowMs = Date.now();
    const graceEndsMs = renewalMs + 60 * 24 * 60 * 60 * 1000; // +60 days

    let lifecycleStatus = planState.status;
    let isReadOnly = false;

    if (planState.status === 'Read_Only_Grace_Period' || planState.status === 'Suspended') {
      isReadOnly = true;
    } else if (nowMs > renewalMs && !planState.autoRenew) {
      if (nowMs <= graceEndsMs) {
        lifecycleStatus = 'Read_Only_Grace_Period';
        isReadOnly = true;
      } else {
        lifecycleStatus = 'Suspended';
        isReadOnly = true;
      }
    }

    const daysRemainingInGrace = Math.max(
      0,
      Math.ceil((graceEndsMs - nowMs) / (1000 * 60 * 60 * 24)),
    );

    return {
      instituteId: this.databaseService.institutes[0]?.instituteId || 'INST-IIITS',
      instituteName: this.databaseService.institutes[0]?.name || 'IIIT Sri City',
      currentTier: planState.tier,
      billingCycle: planState.billingCycle,
      status: lifecycleStatus,
      autoRenew: planState.autoRenew,
      contractRenewalDate: planState.renewalDate,
      gracePeriodDurationDays: 60,
      gracePeriodEndsAt: new Date(graceEndsMs).toISOString(),
      daysRemainingInGrace,
      isReadOnly,
      dataExportAvailable: true,
      complianceNote:
        'Data Sovereignty & Portability: Institution maintains full rights to download all academic and administrative records during the 60-day grace period.',
    };
  }

  /**
   * Generates a full exportable archive of academic records and logs for institutional offboarding
   */
  exportInstitutionalArchive() {
    const timestamp = new Date().toISOString();
    const institute = this.databaseService.institutes[0];

    // Sanitize user passwords before export
    const sanitizedUsers = this.databaseService.users.map((u) => ({
      userId: u.userId,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      deptId: u.deptId,
    }));

    return {
      archiveMetadata: {
        exportId: `LUMINA-ARCHIVE-${Date.now()}`,
        generatedAt: timestamp,
        instituteId: institute?.instituteId || 'INST-IIITS',
        instituteName: institute?.name || 'IIIT Sri City',
        format: 'JSON / CSV Academic Bundle',
        complianceStandard: 'Standard Institutional Academic Data Portability Archive',
        totalEntitiesExported:
          sanitizedUsers.length +
          this.databaseService.courseCatalog.length +
          this.databaseService.registrations.length,
      },
      institutionInfo: institute,
      activeSubscriptionState: this.databaseService.activeInstitutePlan,
      userRoster: sanitizedUsers,
      courseCatalog: this.databaseService.courseCatalog,
      studentEnrollments: this.databaseService.registrations,
      financialPaymentLedger: this.databaseService.studentPaymentLedger,
      supportDocketsHistory: this.databaseService.supportDockets,
    };
  }

  /**
   * Allows Dean or Super User to simulate the 60-day Grace Period for evaluation demos
   */
  simulateGracePeriod(enableGrace: boolean) {
    if (enableGrace) {
      this.databaseService.activeInstitutePlan.status = 'Read_Only_Grace_Period';
      this.databaseService.activeInstitutePlan.autoRenew = false;

      // Add automated retention & data export ticket to SPOC docket queue
      const existingDocket = this.databaseService.supportDockets.find(
        (d) => d.docketId === 'DOC-1007',
      );
      if (!existingDocket) {
        this.databaseService.supportDockets.unshift({
          docketId: 'DOC-1007',
          instituteId: 'INST-IIITS',
          instituteName: 'IIIT Sri City',
          submittedBy: 'Lumina Sentinel Daemon (Automated)',
          category: 'Offboarding_Retention',
          priority: 'High',
          subject: 'SaaS Subscription Expired — 60-Day Read-Only Grace Period Active (29 Days Remaining)',
          description:
            'Tenant contract expired. System operating in Read-Only mode. SPOC Action: Conduct retention outreach, assist Dean with Academic Data Export, or process offline renewal wire.',
          status: 'Open',
          assignedSpocId: 'SPOC-001',
          createdAt: new Date().toISOString(),
        });
      } else {
        existingDocket.status = 'Open';
      }
    } else {
      this.databaseService.activeInstitutePlan.status = 'Active';
      this.databaseService.activeInstitutePlan.autoRenew = true;

      // Mark offboarding docket as resolved
      const existingDocket = this.databaseService.supportDockets.find(
        (d) => d.docketId === 'DOC-1007',
      );
      if (existingDocket) {
        existingDocket.status = 'Resolved';
        existingDocket.resolvedAt = new Date().toISOString();
        existingDocket.resolutionNotes =
          'Subscription reactivated with continuous auto-renewal. Tenant write operations restored.';
      }
    }
    return this.getTenantLifecycle();
  }

  /**
   * Cancels institutional subscription at period end (disables auto-renew)
   */
  cancelSubscription() {
    this.databaseService.activeInstitutePlan.autoRenew = false;
    this.databaseService.activeInstitutePlan.status = 'Canceled';
    const renewalDate =
      this.databaseService.activeInstitutePlan.renewalDate ||
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    return {
      success: true,
      status: 'Canceled',
      autoRenew: false,
      activeUntil: renewalDate,
      message:
        'Subscription canceled successfully. Access remains fully active until the end of the prepaid contract term.',
    };
  }

  /**
   * Reactivates a canceled subscription
   */
  reactivateSubscription() {
    this.databaseService.activeInstitutePlan.autoRenew = true;
    this.databaseService.activeInstitutePlan.status = 'Active';
    return {
      success: true,
      status: 'Active',
      autoRenew: true,
      message: 'Subscription successfully reactivated with continuous auto-renewal.',
    };
  }

  /**
   * Returns institutional revenue & tuition collection analytics
   */
  readonly SEMESTER_FLAT_TUITION = 2500;

  /**
   * Returns institutional revenue & tuition collection analytics with dynamic B2C Fee metrics
   */
  getRevenueSummary() {
    const students = this.databaseService.students;
    const users = this.databaseService.users.filter((u) => u.role === 'Student');
    const ledger = this.databaseService.studentPaymentLedger;

    const totalStudents = students.length > 0 ? students.length : users.length;
    const totalTuitionTarget = totalStudents * this.SEMESTER_FLAT_TUITION;

    let totalCollected = 0;
    let clearedCount = 0;
    let pendingCount = 0;
    let waivedCount = 0;

    for (const student of students) {
      const record = ledger[student.studentId];
      if (record) {
        totalCollected += record.amountPaid;
        if (record.status === 'Cleared') clearedCount++;
        else if (record.status === 'Waived') waivedCount++;
        else pendingCount++;
      } else {
        pendingCount++;
      }
    }

    const totalOutstanding = Math.max(0, totalTuitionTarget - totalCollected);
    const clearanceRate = totalStudents > 0 ? Math.round(((clearedCount + waivedCount) / totalStudents) * 100) : 100;

    const activeTier = this.databaseService.activeInstitutePlan.tier;
    const plan =
      this.databaseService.saasPlans.find(
        (p) =>
          p.id.toLowerCase() === activeTier.toLowerCase() ||
          p.name.toLowerCase().includes(activeTier.toLowerCase()),
      ) || this.databaseService.saasPlans[2];

    const mrr = plan.monthlyPrice;
    const primaryInst = this.databaseService.institutes[0];
    const spoc =
      this.databaseService.adminTeam.find(
        (a) => a.adminId === primaryInst?.spocAdminId,
      ) || this.databaseService.adminTeam[0];

    return {
      currency: this.CURRENCY,
      flatSemesterTuition: this.SEMESTER_FLAT_TUITION,
      totalStudentsEnrolled: totalStudents,
      totalTuitionTarget,
      totalFeesCollected: totalCollected,
      totalPendingBalance: totalOutstanding,
      clearedStudentsCount: clearedCount,
      pendingHoldStudentsCount: pendingCount,
      waivedStudentsCount: waivedCount,
      collectionRatePercent: clearanceRate,
      activeSaasPlan: {
        tier: activeTier,
        planName: plan.name,
        annualRecurringRevenue: plan.annualMonthlyPrice * 12,
        monthlyRecurringRevenue: mrr,
        billingCycle: this.databaseService.activeInstitutePlan.billingCycle === 'annual' ? 'Annual (Prepaid Upfront)' : 'Monthly',
        enabledModules: plan.includedModules,
        spocAssigned: spoc
          ? `${spoc.fullName} (Lumina Institute SPOC)`
          : 'Arjun Verma (Lumina Institute SPOC)',
      },
      studentClearanceRoster: this.getStudentsClearanceRoster(),
    };
  }

  /**
   * Returns itemized flat semester billing details for a specific student
   */
  getStudentBilling(studentId: string) {
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
    const studentInfo = this.databaseService.students.find((s) => s.studentId === effectiveId);
    const semester = studentInfo?.currentSemester || 4;

    const paymentInfo = this.databaseService.studentPaymentLedger[effectiveId] || {
      amountPaid: 0,
      totalSemesterFee: this.SEMESTER_FLAT_TUITION,
      status: 'Pending',
      semester,
    };

    const isCleared = paymentInfo.status === 'Cleared' || paymentInfo.status === 'Waived';
    const amountPaid = paymentInfo.amountPaid;
    const balanceDue = isCleared ? 0 : Math.max(0, this.SEMESTER_FLAT_TUITION - amountPaid);

    return {
      studentId: user.userId,
      studentName: user.fullName,
      deptId: user.deptId,
      semester,
      currency: this.CURRENCY,
      flatSemesterTuition: this.SEMESTER_FLAT_TUITION,
      totalAmountDue: this.SEMESTER_FLAT_TUITION,
      amountPaid,
      balanceDue,
      paymentStatus: paymentInfo.status,
      isFinancialHoldActive: !isCleared,
      waiverReason: paymentInfo.waiverReason,
      paymentDate: paymentInfo.paymentDate,
      transactionId: paymentInfo.transactionId,
    };
  }

  /**
   * Simulates flat semester tuition fee payment for a student
   */
  payStudentTuition(
    studentId: string,
    amount?: number,
  ) {
    const billing = this.getStudentBilling(studentId);
    const effectiveId = billing.studentId;
    const payAmount = amount && amount > 0 ? amount : this.SEMESTER_FLAT_TUITION;

    const timestamp = new Date().toISOString();
    const transactionId = `TXN-LUM-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    this.databaseService.studentPaymentLedger[effectiveId] = {
      amountPaid: this.SEMESTER_FLAT_TUITION,
      totalSemesterFee: this.SEMESTER_FLAT_TUITION,
      paymentDate: timestamp,
      status: 'Cleared',
      semester: billing.semester,
      transactionId,
    };

    return {
      success: true,
      transactionId,
      studentId: effectiveId,
      studentName: billing.studentName,
      amountPaid: payAmount,
      totalSemesterFee: this.SEMESTER_FLAT_TUITION,
      remainingBalance: 0,
      paymentStatus: 'Cleared',
      isFinancialHoldActive: false,
      message: `Semester ${billing.semester} Tuition Fee ($${payAmount}) paid successfully. Course registration unlocked.`,
      timestamp,
    };
  }

  /**
   * Allows Dean or Academic Administrator to grant a financial hold waiver (scholarship / bank loan delay)
   */
  waiveStudentFeeHold(studentId: string, waiverReason?: string) {
    const billing = this.getStudentBilling(studentId);
    const effectiveId = billing.studentId;

    const reason = waiverReason || 'Dean Merit Scholarship / Financial Aid Waiver';
    const timestamp = new Date().toISOString();
    const transactionId = `WVR-DEAN-${Date.now()}`;

    this.databaseService.studentPaymentLedger[effectiveId] = {
      amountPaid: 0,
      totalSemesterFee: this.SEMESTER_FLAT_TUITION,
      paymentDate: timestamp,
      status: 'Waived',
      semester: billing.semester,
      waiverReason: reason,
      transactionId,
    };

    return {
      success: true,
      transactionId,
      studentId: effectiveId,
      studentName: billing.studentName,
      paymentStatus: 'Waived',
      waiverReason: reason,
      isFinancialHoldActive: false,
      message: `Financial hold waived for ${billing.studentName}: ${reason}. Course registration unlocked.`,
      timestamp,
    };
  }

  /**
   * Returns complete student financial clearance roster for Dean dashboard
   */
  getStudentsClearanceRoster() {
    const students = this.databaseService.students;
    const users = this.databaseService.users.filter((u) => u.role === 'Student');
    const ledger = this.databaseService.studentPaymentLedger;

    return students.map((student) => {
      const user = users.find((u) => u.userId === student.studentId) || {
        userId: student.studentId,
        fullName: 'Student Scholar',
        email: `${student.studentId.toLowerCase()}@lumina.iiits.in`,
        deptId: 'CSE',
      };

      const record = ledger[student.studentId];
      const status = record ? record.status : 'Pending';
      const amountPaid = record ? record.amountPaid : 0;
      const totalFee = record ? record.totalSemesterFee : this.SEMESTER_FLAT_TUITION;
      const balanceDue = status === 'Cleared' || status === 'Waived' ? 0 : Math.max(0, totalFee - amountPaid);

      return {
        studentId: student.studentId,
        fullName: user.fullName,
        email: user.email,
        deptId: user.deptId,
        semester: student.currentSemester,
        totalSemesterFee: totalFee,
        amountPaid,
        balanceDue,
        status,
        paymentDate: record?.paymentDate,
        waiverReason: record?.waiverReason,
        transactionId: record?.transactionId,
      };
    });
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

