import { ad2Actions } from './ad2-slice';
import { policiesService } from '../../services/policies.service';
import { overridesService } from '../../services/overrides.service';
import { usersService } from '../../services/users.service';
import { coursesService } from '../../services/courses.service';
import { registrationsService } from '../../services/registrations.service';
import { sectionsService } from '../../services/sections.service';
import { announcementsService } from '../../services/announcements.service';

// ─────────────────────────────────────────────────────────────────────────────
// HOME DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Thunk: Load all data needed by Dean2Home dashboard
 */
export const fetchDean2HomeDashboard = () => async (dispatch) => {
  dispatch(ad2Actions.setLoading(true));
  dispatch(ad2Actions.setError(null));
  try {
    const [
      polData,
      phasesData,
      overridesData,
      usersData,
      coursesData,
      regsData,
      sectionsData,
    ] = await Promise.allSettled([
      policiesService.getPolicies(),
      policiesService.getPhases(),
      overridesService.getAll(),
      usersService.getAll(),
      coursesService.getAll(),
      registrationsService.getAll(),
      sectionsService.getAll(),
    ]);

    // policies
    if (polData.status === 'fulfilled' && polData.value?.settings) {
      dispatch(ad2Actions.setPolicies(polData.value.settings));
    }

    // active phase
    if (phasesData.status === 'fulfilled' && Array.isArray(phasesData.value)) {
      dispatch(ad2Actions.setPhases(phasesData.value));
      const active = phasesData.value.find((p) => p.status === 'Active');
      dispatch(ad2Actions.setActivePhase(active ? active.name : null));
    }

    // pending overrides count
    if (overridesData.status === 'fulfilled' && Array.isArray(overridesData.value)) {
      const pending = overridesData.value.filter(
        (o) => (o.approvalStatus || o.Approval_Status) === 'Pending'
      ).length;
      dispatch(ad2Actions.setPendingOverridesCount(pending));
    }

    const users =
      usersData.status === 'fulfilled' && Array.isArray(usersData.value) ? usersData.value : [];
    const courses =
      coursesData.status === 'fulfilled' && Array.isArray(coursesData.value) ? coursesData.value : [];
    const registrations =
      regsData.status === 'fulfilled' && Array.isArray(regsData.value) ? regsData.value : [];
    const sections =
      sectionsData.status === 'fulfilled' && Array.isArray(sectionsData.value) ? sectionsData.value : [];

    dispatch(ad2Actions.setUsers(users));
    dispatch(ad2Actions.setCourses(courses));
    dispatch(ad2Actions.setRegistrations(registrations));
    dispatch(ad2Actions.setSections(sections));

    // metrics
    const students = users.filter((u) => (u.role || u.Role) === 'Student');
    const enrolledStudentIds = new Set(
      registrations
        .filter((r) => (r.status || r.Status || 'Enrolled') === 'Enrolled')
        .map((r) => r.studentId || r.Student_ID)
    );
    const enrolledCount = enrolledStudentIds.size;
    const totalStudentCount = students.length || enrolledCount || 0;
    const yetToEnrollCount = Math.max(0, totalStudentCount - enrolledCount);
    const progressPct =
      totalStudentCount > 0 ? Math.round((enrolledCount / totalStudentCount) * 100) : 0;

    dispatch(
      ad2Actions.setMetrics({
        totalEnrolled: enrolledCount,
        yetToEnroll: yetToEnrollCount,
        targetStudents: totalStudentCount,
        enrollmentProgress: progressPct,
        totalCourses: courses.length,
      })
    );

    // Build UG breakdown
    const capacityByCourse = {};
    sections.forEach((s) => {
      const cid = s.courseId || s.Course_ID;
      if (cid) {
        capacityByCourse[cid] = (capacityByCourse[cid] || 0) + (Number(s.capacity || s.Capacity) || 40);
      }
    });

    const groups = {};
    courses.forEach((c) => {
      const cid = c.courseId || c.Course_ID || '';
      const dept = c.deptId || c.Dept_ID || 'General';
      const match = cid.match(/\d+/);
      const num = match ? parseInt(match[0], 10) : 100;
      const ugLevel = num >= 400 ? 'UG4' : num >= 300 ? 'UG3' : num >= 200 ? 'UG2' : 'UG1';
      const key = `${ugLevel}_${dept}`;
      if (!groups[key]) {
        groups[key] = { ugLevel, dept, courseIds: [], seats: 0 };
      }
      groups[key].courseIds.push(cid);
      groups[key].seats += capacityByCourse[cid] || 40;
    });

    const breakdown = Object.values(groups).map((g) => {
      const enrolledInGroup = registrations.filter(
        (r) =>
          g.courseIds.includes(r.courseId || r.Course_ID) &&
          (r.status || r.Status || 'Enrolled') === 'Enrolled'
      ).length;
      const fillRate = g.seats > 0 ? Math.min(100, Math.round((enrolledInGroup / g.seats) * 100)) : 0;
      const status = fillRate >= 75 ? 'Stable' : fillRate >= 40 ? 'Active' : 'On Track';
      return {
        ugLevel: g.ugLevel,
        dept: g.dept,
        coursesCount: g.courseIds.length,
        totalSeats: g.seats,
        enrolled: enrolledInGroup,
        fillRate,
        status,
      };
    });

    breakdown.sort((a, b) => a.ugLevel.localeCompare(b.ugLevel) || a.dept.localeCompare(b.dept));
    dispatch(ad2Actions.setUgBreakdown(breakdown));
  } catch (err) {
    console.error('Error loading Dean2 dashboard data:', err);
    dispatch(ad2Actions.setError(err.message || 'Failed to load dashboard'));
  } finally {
    dispatch(ad2Actions.setLoading(false));
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ENROLLMENT SETUP
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Thunk: Load enrollment settings and phases
 */
export const fetchEnrollmentData = () => async (dispatch) => {
  dispatch(ad2Actions.setLoading(true));
  dispatch(ad2Actions.setError(null));
  try {
    const [polRes, phasesRes] = await Promise.allSettled([
      policiesService.getPolicies(),
      policiesService.getPhases(),
    ]);

    if (polRes.status === 'fulfilled' && polRes.value?.settings) {
      dispatch(ad2Actions.setEnrollmentSettings(polRes.value.settings));
    }
    if (phasesRes.status === 'fulfilled' && Array.isArray(phasesRes.value)) {
      dispatch(ad2Actions.setPhases(phasesRes.value));
    }
  } catch (err) {
    console.error('Failed to load enrollment configuration:', err);
    dispatch(ad2Actions.setError(err.message || 'Failed to load enrollment data'));
    throw err;
  } finally {
    dispatch(ad2Actions.setLoading(false));
  }
};

/**
 * Thunk: Update a single enrollment setting key (systemStatus / windowStatus)
 */
export const updateEnrollmentSetting = (key, value, label) => async (dispatch) => {
  try {
    const logMsg = label || `Updated ${key} to ${value}`;
    await policiesService.updatePolicies({ [key]: value, logMessage: logMsg });
    dispatch(ad2Actions.setEnrollmentSettings({ [key]: value }));
  } catch (err) {
    console.error('Failed to update setting:', err);
    throw err;
  }
};

/**
 * Thunk: Update academic term
 */
export const updateEnrollmentTerm = (newYear, newTerm, termLabel) => async (dispatch) => {
  try {
    await policiesService.updatePolicies({
      academicYear: newYear,
      term: newTerm,
      logMessage: `Term updated to ${termLabel}`,
    });
    dispatch(ad2Actions.setEnrollmentSettings({ academicYear: newYear, term: newTerm }));
  } catch (err) {
    console.error('Failed to update term:', err);
    throw err;
  }
};

/**
 * Thunk: Update enrollment window dates
 */
export const updateEnrollmentDates = (newStart, newEnd) => async (dispatch) => {
  try {
    await policiesService.updatePolicies({
      startDate: newStart,
      endDate: newEnd,
      logMessage: 'Updated enrollment window dates',
    });
    dispatch(ad2Actions.setEnrollmentSettings({ startDate: newStart, endDate: newEnd }));
  } catch (err) {
    console.error('Failed to update dates:', err);
    throw err;
  }
};

/**
 * Thunk: Save (create or update) an enrollment phase
 */
export const savePhase = (editingId, modalData) => async (dispatch) => {
  if (editingId) {
    await policiesService.updatePhase(editingId, {
      name: modalData.name.trim(),
      eligibleGroups: modalData.eligibleGroups,
      timeline: modalData.timeline.trim(),
      status: modalData.status,
    });
    dispatch(
      ad2Actions.updatePhaseInList({
        id: editingId,
        name: modalData.name.trim(),
        eligibleGroups: modalData.eligibleGroups,
        timeline: modalData.timeline.trim(),
        status: modalData.status,
      })
    );
  } else {
    const created = await policiesService.createPhase({
      name: modalData.name.trim(),
      eligibleGroups: modalData.eligibleGroups,
      timeline: modalData.timeline.trim(),
      status: modalData.status,
    });
    // Re-fetch to get the server-assigned id
    await dispatch(fetchEnrollmentData());
    return created;
  }
};

/**
 * Thunk: Delete an enrollment phase
 */
export const deletePhase = (id) => async (dispatch) => {
  await policiesService.deletePhase(id);
  dispatch(ad2Actions.removePhase(id));
};

// ─────────────────────────────────────────────────────────────────────────────
// OVERRIDES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Thunk: Load all override requests and cross-reference users/courses
 */
export const fetchOverrides = () => async (dispatch) => {
  dispatch(ad2Actions.setLoading(true));
  dispatch(ad2Actions.setError(null));
  try {
    const [ovRes, usersRes, coursesRes] = await Promise.allSettled([
      overridesService.getAll(),
      usersService.getAll(),
      coursesService.getAll(),
    ]);

    const rawOverrides =
      ovRes.status === 'fulfilled' && Array.isArray(ovRes.value) ? ovRes.value : [];
    const allUsers =
      usersRes.status === 'fulfilled' && Array.isArray(usersRes.value) ? usersRes.value : [];
    const allCourses =
      coursesRes.status === 'fulfilled' && Array.isArray(coursesRes.value) ? coursesRes.value : [];

    const usersMap = {};
    allUsers.forEach((u) => {
      usersMap[u.userId || u.User_ID] = u;
    });

    const coursesMap = {};
    allCourses.forEach((c) => {
      coursesMap[c.courseId || c.Course_ID] = c;
    });

    const normalised = rawOverrides.map((o, idx) => {
      const sid = o.studentId || o.Student_ID || '';
      const cid = o.courseId || o.Course_ID || '';
      const u = usersMap[sid] || {};
      const c = coursesMap[cid] || {};
      return {
        id: o.overrideId || o.Override_ID || o.id || idx + 1,
        name: u.fullName || u.Full_Name || o.studentName || 'Student',
        sid: sid || `STU-${idx + 1}`,
        dept: c.deptId || c.Dept_ID || o.deptId || 'General',
        course:
          `${cid} ${c.courseName || c.Course_Name || ''}`.trim() || `Course ${idx + 1}`,
        reason:
          o.reason || o.Reason || 'Course Full (Section capacity exceeded)',
        status: o.approvalStatus || o.Approval_Status || o.status || 'Pending',
        date: o.createdAt
          ? new Date(o.createdAt).toLocaleDateString()
          : new Date().toLocaleDateString(),
        year: u.currentSemester
          ? `Semester ${u.currentSemester}`
          : o.year || 'Year 1',
        raw: o,
      };
    });

    dispatch(ad2Actions.setOverridesList(normalised));
  } catch (err) {
    console.error('Failed to load overrides:', err);
    dispatch(ad2Actions.setError(err.message || 'Failed to load overrides'));
  } finally {
    dispatch(ad2Actions.setLoading(false));
  }
};

/**
 * Thunk: Approve or reject a single override
 */
export const updateOverrideStatus = (id, newStatus) => async (dispatch) => {
  dispatch(ad2Actions.setActionLoading(true));
  try {
    await overridesService.updateStatus(id, newStatus);
    dispatch(ad2Actions.updateOverrideStatus({ id, status: newStatus }));
  } catch (err) {
    console.error('Failed to update override status:', err);
    throw err;
  } finally {
    dispatch(ad2Actions.setActionLoading(false));
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GRADE SHEETS LIST
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Thunk: Load courses and registrations for the grade sheets list
 */
export const fetchGradesheets = () => async (dispatch) => {
  dispatch(ad2Actions.setLoading(true));
  dispatch(ad2Actions.setError(null));
  try {
    const [cRes, rRes] = await Promise.allSettled([
      coursesService.getAll(),
      registrationsService.getAll(),
    ]);

    if (cRes.status === 'fulfilled' && Array.isArray(cRes.value)) {
      dispatch(ad2Actions.setGradesheetCourses(cRes.value));
    }
    if (rRes.status === 'fulfilled' && Array.isArray(rRes.value)) {
      dispatch(ad2Actions.setGradesheetRegistrations(rRes.value));
    }
  } catch (err) {
    console.error('Failed to load gradesheets data:', err);
    dispatch(ad2Actions.setError(err.message || 'Failed to load grade sheets'));
    throw err;
  } finally {
    dispatch(ad2Actions.setLoading(false));
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GRADE SHEET DETAIL
// ─────────────────────────────────────────────────────────────────────────────

const GRADE_POINT_MAP = {
  'O': 10.0, 'S': 10.0, 'A+': 10.0, A: 10.0, 'A-': 9.0, 'B+': 9.0, B: 8.0,
  'B-': 7.0, 'C+': 7.0, C: 7.0, D: 6.0, F: 0.0,
};

/**
 * Thunk: Load detail data for a specific grade sheet
 */
export const fetchGradesheetDetail = (paramCourseId, paramTermId) => async (dispatch) => {
  dispatch(ad2Actions.setLoading(true));
  dispatch(ad2Actions.setError(null));
  dispatch(ad2Actions.setGradesheetDetailGpaStats(null));
  dispatch(ad2Actions.setGradesheetDetailStatus('REVIEW'));
  try {
    const [cRes, rRes, uRes] = await Promise.allSettled([
      coursesService.getAll(),
      registrationsService.getAll(),
      usersService.getAll(),
    ]);

    const allCourses =
      cRes.status === 'fulfilled' && Array.isArray(cRes.value) ? cRes.value : [];
    const allRegistrations =
      rRes.status === 'fulfilled' && Array.isArray(rRes.value) ? rRes.value : [];
    const allUsers =
      uRes.status === 'fulfilled' && Array.isArray(uRes.value) ? uRes.value : [];

    let targetCourse = allCourses.find((c) => (c.courseId || c.Course_ID) === paramCourseId);
    if (!targetCourse && allCourses.length > 0) targetCourse = allCourses[0];
    dispatch(
      ad2Actions.setGradesheetDetailCourse(
        targetCourse || {
          courseId: paramCourseId || 'CS201',
          courseName: 'Data Structures',
          deptId: 'CSE',
          credits: 4,
        }
      )
    );

    const cid = targetCourse
      ? targetCourse.courseId || targetCourse.Course_ID
      : paramCourseId;
    const currentTerm = paramTermId ? decodeURIComponent(paramTermId) : 'Spring 2026';
    dispatch(ad2Actions.setGradesheetDetailTerm(currentTerm));

    const matchedRegs = allRegistrations.filter(
      (r) => (r.courseId || r.Course_ID) === cid
    );

    const usersMap = {};
    allUsers.forEach((u) => {
      usersMap[u.userId || u.User_ID] = u;
    });

    if (matchedRegs.length > 0) {
      const list = matchedRegs.map((r) => {
        const sid = r.studentId || r.Student_ID;
        const u = usersMap[sid] || {};
        const grade = r.finalGrade || r.Final_Grade || 'A';
        const pt = GRADE_POINT_MAP[grade];
        const gradePoint = pt !== undefined ? String(pt.toFixed(1)) : '—';
        return {
          enrollmentId: r.enrollmentId || r.Enrollment_ID || r.id,
          studentId: sid,
          studentName: u.fullName || u.Full_Name || 'Enrolled Student',
          credits: targetCourse?.credits || targetCourse?.Credits || 4,
          grade,
          gradePoint,
        };
      });
      dispatch(ad2Actions.setGradesheetDetailEnrollments(list));
    } else {
      dispatch(ad2Actions.setGradesheetDetailEnrollments([]));
    }
  } catch (err) {
    console.error('Failed to load gradesheet detail:', err);
    dispatch(ad2Actions.setError(err.message || 'Failed to load grade sheet detail'));
    throw err;
  } finally {
    dispatch(ad2Actions.setLoading(false));
  }
};

/**
 * Thunk: Calculate GPA for the current grade sheet
 */
export const calculateGpa = () => (dispatch, getState) => {
  const { enrollments } = getState().ad2.gradesheetDetail;
  if (enrollments.length === 0) return null;

  let totalPoints = 0;
  let counted = 0;
  let minGp = 10.0;
  let maxGp = 0.0;

  const updated = enrollments.map((e) => {
    const g = (e.grade || 'A').toUpperCase().trim();
    const pt = GRADE_POINT_MAP[g] !== undefined ? GRADE_POINT_MAP[g] : 7.0;
    totalPoints += pt;
    counted += 1;
    if (pt < minGp) minGp = pt;
    if (pt > maxGp) maxGp = pt;
    return { ...e, gradePoint: pt.toFixed(1) };
  });

  dispatch(ad2Actions.setGradesheetDetailEnrollments(updated));
  const gpaStats = {
    calculated: true,
    avgGpa: counted > 0 ? (totalPoints / counted).toFixed(2) : '0.00',
    highestGpa: maxGp.toFixed(1),
    lowestGpa: minGp.toFixed(1),
    studentCount: counted,
  };
  dispatch(ad2Actions.setGradesheetDetailGpaStats(gpaStats));
  return gpaStats;
};

/**
 * Thunk: Send GPA to students (persist grades + broadcast announcement)
 */
export const sendGpaToStudents = () => async (dispatch, getState) => {
  dispatch(ad2Actions.setActionLoading(true));
  try {
    const { enrollments, course } = getState().ad2.gradesheetDetail;
    const courseCode = course?.courseId || course?.Course_ID || 'CS201';
    const courseName = course?.courseName || course?.Course_Name || 'Course';

    const gradeBatch = enrollments
      .filter((e) => e.enrollmentId)
      .map((e) => ({ enrollmentId: Number(e.enrollmentId), finalGrade: e.grade }));

    if (gradeBatch.length > 0) {
      await registrationsService.batchUpdateGrades(gradeBatch);
    }

    await announcementsService.create({
      title: `Official Grades & GPA Released: ${courseCode}`,
      message: `Official semester grades and GPA for ${courseCode} (${courseName}) have been processed and published to all student profiles by Assistant Dean 2.`,
      courseId: courseCode,
    });

    dispatch(ad2Actions.setGradesheetDetailStatus('PUBLISHED'));
  } catch (err) {
    console.error('Failed to send GPA to students:', err);
    throw err;
  } finally {
    dispatch(ad2Actions.setActionLoading(false));
  }
};

/**
 * Thunk: Save grade sheet as draft
 */
export const saveGradesheetDraft = () => async (dispatch, getState) => {
  dispatch(ad2Actions.setActionLoading(true));
  try {
    const { enrollments, course } = getState().ad2.gradesheetDetail;
    const courseCode = course?.courseId || course?.Course_ID || 'CS201';

    const gradeBatch = enrollments
      .filter((e) => e.enrollmentId)
      .map((e) => ({ enrollmentId: Number(e.enrollmentId), finalGrade: e.grade }));

    if (gradeBatch.length > 0) {
      await registrationsService.batchUpdateGrades(gradeBatch);
    }

    dispatch(ad2Actions.setGradesheetDetailStatus('DRAFT'));
    return courseCode;
  } catch (err) {
    console.error('Failed to save draft:', err);
    throw err;
  } finally {
    dispatch(ad2Actions.setActionLoading(false));
  }
};

/**
 * Thunk: Submit grade sheet for Dean review
 */
export const submitGradesheetForReview = () => async (dispatch, getState) => {
  dispatch(ad2Actions.setActionLoading(true));
  try {
    const { course } = getState().ad2.gradesheetDetail;
    const courseCode = course?.courseId || course?.Course_ID || 'CS201';
    const courseName = course?.courseName || course?.Course_Name || 'Course';

    await announcementsService.create({
      title: `Grade Sheet Submitted for Dean Approval: ${courseCode}`,
      message: `Assistant Dean 2 has submitted the grade sheet and calculated GPA records for ${courseCode} (${courseName}) for final Dean sign-off.`,
      courseId: courseCode,
    });

    dispatch(ad2Actions.setGradesheetDetailStatus('SUBMITTED_FOR_REVIEW'));
    return courseCode;
  } catch (err) {
    console.error('Failed to submit for review:', err);
    throw err;
  } finally {
    dispatch(ad2Actions.setActionLoading(false));
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Thunk: Load all data for the Analytics page (reuses shared state if loaded)
 */
export const fetchAnalyticsData = () => async (dispatch, getState) => {
  const { courses, analyticsLoaded } = getState().ad2;
  if (analyticsLoaded && courses.length > 0) return; // already loaded

  dispatch(ad2Actions.setLoading(true));
  dispatch(ad2Actions.setError(null));
  try {
    const [cRes, rRes, sRes, uRes] = await Promise.allSettled([
      coursesService.getAll(),
      registrationsService.getAll(),
      sectionsService.getAll(),
      usersService.getAll(),
    ]);

    if (cRes.status === 'fulfilled' && Array.isArray(cRes.value)) {
      dispatch(ad2Actions.setCourses(cRes.value));
    }
    if (rRes.status === 'fulfilled' && Array.isArray(rRes.value)) {
      dispatch(ad2Actions.setRegistrations(rRes.value));
    }
    if (sRes.status === 'fulfilled' && Array.isArray(sRes.value)) {
      dispatch(ad2Actions.setSections(sRes.value));
    }
    if (uRes.status === 'fulfilled' && Array.isArray(uRes.value)) {
      dispatch(ad2Actions.setUsers(uRes.value));
    }
    dispatch(ad2Actions.setAnalyticsLoaded(true));
  } catch (err) {
    console.error('Failed to load analytics data:', err);
    dispatch(ad2Actions.setError(err.message || 'Failed to load analytics'));
  } finally {
    dispatch(ad2Actions.setLoading(false));
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POLICIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Thunk: Fetch current policies and change log
 */
export const fetchPolicies = () => async (dispatch) => {
  dispatch(ad2Actions.setLoading(true));
  dispatch(ad2Actions.setError(null));
  try {
    const data = await policiesService.getPolicies();
    if (data?.settings) {
      dispatch(ad2Actions.setPolicySettings(data.settings));
    }
    if (Array.isArray(data?.logs)) {
      dispatch(ad2Actions.setPolicyLogs(data.logs));
    }
  } catch (err) {
    console.error('Failed to load policies:', err);
    dispatch(ad2Actions.setError(err.message || 'Failed to load policies'));
    throw err;
  } finally {
    dispatch(ad2Actions.setLoading(false));
  }
};

/**
 * Thunk: Send a policy update payload and refresh settings + logs
 */
export const sendPolicyUpdate = (payload, successMsg) => async (dispatch) => {
  dispatch(ad2Actions.setSaving(true));
  try {
    const res = await policiesService.updatePolicies(payload);
    if (res?.settings) {
      dispatch(ad2Actions.setPolicySettings(res.settings));
    }
    if (Array.isArray(res?.logs)) {
      dispatch(ad2Actions.setPolicyLogs(res.logs));
    }
    return { ok: true, successMsg };
  } catch (err) {
    console.error('Policy update error:', err);
    const msg = err.response?.data?.message || 'Failed to update policy';
    throw new Error(msg, { cause: err });
  } finally {
    dispatch(ad2Actions.setSaving(false));
  }
};

/**
 * Thunk: Lock the academic term
 */
export const lockTerm = (academicYear, term, termLabel) => async (dispatch) => {
  return dispatch(
    sendPolicyUpdate(
      { academicYear, term, termLocked: true, logMessage: `Term Locked: ${termLabel}` },
      'Academic Term locked successfully'
    )
  );
};

/**
 * Thunk: Unlock the academic term
 */
export const unlockTerm = () => async (dispatch) => {
  return dispatch(
    sendPolicyUpdate({ termLocked: false, logMessage: 'Term Unlocked' }, 'Academic Term unlocked')
  );
};

/**
 * Thunk: Validate policies
 */
export const validatePolicies = (settings) => async (dispatch) => {
  return dispatch(
    sendPolicyUpdate(
      { ...settings, status: 'Validated', logMessage: 'Policies validated' },
      'Policies validated successfully'
    )
  );
};

/**
 * Thunk: Lock all policies
 */
export const lockPolicies = (settings) => async (dispatch) => {
  const payload = {
    minCredits: Number(settings?.minCredits ?? 12),
    maxCredits: Number(settings?.maxCredits ?? 21),
    maxCourses: Number(settings?.maxCourses ?? 6),
    minGpa: Number(settings?.minGpa ?? 5.0),
    enforcePrereq: Boolean(settings?.enforcePrereq),
    allowConditional: Boolean(settings?.allowConditional),
    allowAdvisorOverride: Boolean(settings?.allowAdvisorOverride),
    financialClearance: Boolean(settings?.financialClearance),
    advisorApproval: Boolean(settings?.advisorApproval),
    academicYear: settings?.academicYear,
    term: settings?.term,
    isLocked: true,
    status: settings?.status === 'Pending' ? 'Pending' : 'Validated',
    logMessage: 'Policies Locked',
  };
  return dispatch(
    sendPolicyUpdate(payload, 'Policies locked')
  );
};

/**
 * Thunk: Unlock all policies
 */
export const unlockPolicies = () => async (dispatch) => {
  return dispatch(
    sendPolicyUpdate(
      { isLocked: false, status: 'Pending', logMessage: 'Policies Unlocked' },
      'Policies unlocked'
    )
  );
};

