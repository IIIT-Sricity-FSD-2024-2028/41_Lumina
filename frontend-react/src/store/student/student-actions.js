import { studentActions } from './student-slice';
import { coursesService } from '../../services/courses.service';
import { registrationsService } from '../../services/registrations.service';
import { revenueService } from '../../services/revenue.service';
import { announcementsService } from '../../services/announcements.service';
import { slotsService } from '../../services/slots.service';
import { policiesService } from '../../services/policies.service';
import { overridesService } from '../../services/overrides.service';
import { usersService } from '../../services/users.service';

export function computeTermLabel(academicYear, term) {
  if (!academicYear || !term) return 'Spring 2026';
  const parts = academicYear.split('-');
  if (parts.length !== 2) return `${term} ${academicYear}`;
  const startYear = parts[0].trim();
  const endYear = parts[1].trim();
  if (term === 'Spring' || term === 'Summer') return `${term} ${endYear}`;
  if (term === 'Monsoon' || term === 'Fall') return `${term} ${startYear}`;
  return `${term} ${endYear}`;
}

export const fetchStudentDashboard = (studentId, studentName = 'Student') => {
  return async (dispatch) => {
    dispatch(studentActions.setLoading(true));
    dispatch(studentActions.setError(null));

    try {
      const [
        billingRes,
        annRes,
        studentCourseRes,
        regRes,
        allCoursesRes,
        slotsRes,
        policiesRes,
      ] = await Promise.allSettled([
        revenueService.getStudentBilling(studentId),
        announcementsService.getAll(),
        coursesService.getForStudent(studentId),
        registrationsService.getAll(),
        coursesService.getAll(),
        slotsService.getAll(),
        policiesService.getPolicies(),
      ]);

      let billing = {
        studentId,
        studentName,
        flatSemesterTuition: 2500,
        totalAmountDue: 2500,
        amountPaid: 0,
        balanceDue: 2500,
        paymentStatus: 'Pending',
        isFinancialHoldActive: true,
      };
      if (billingRes.status === 'fulfilled' && billingRes.value) {
        billing = billingRes.value;
      }

      const announcements =
        annRes.status === 'fulfilled' && Array.isArray(annRes.value) ? annRes.value : [];
      const allCatalog =
        allCoursesRes.status === 'fulfilled' && Array.isArray(allCoursesRes.value)
          ? allCoursesRes.value
          : [];
      const slots =
        slotsRes.status === 'fulfilled' && Array.isArray(slotsRes.value) ? slotsRes.value : [];

      let policies = null;
      let activeTerm = 'Spring 2026';
      let maxCredits = 20;
      let currentSemester = 4;

      if (policiesRes.status === 'fulfilled' && policiesRes.value?.settings) {
        const pol = policiesRes.value.settings;
        policies = pol;
        if (pol.academicYear && pol.term) {
          activeTerm = computeTermLabel(pol.academicYear, pol.term);
        }
        if (pol.maxCredits) {
          maxCredits = pol.maxCredits;
        }
      }

      let courses = [];
      if (studentCourseRes.status === 'fulfilled' && studentCourseRes.value) {
        const raw = studentCourseRes.value;
        if (raw.currentSemester) currentSemester = raw.currentSemester;
        if (raw.activeTerm) activeTerm = raw.activeTerm;
        if (raw.maxCreditLimit) maxCredits = raw.maxCreditLimit;

        if (raw.courses && Array.isArray(raw.courses)) {
          courses = raw.courses.map((item) => ({
            ...item.course,
            courseType: item.courseType || item.course?.courseType || 'Program Core',
            sections: item.sections,
          }));
        } else if (Array.isArray(raw)) {
          courses = raw;
        }
      }

      let allUserRegistrations = [];
      if (regRes.status === 'fulfilled' && Array.isArray(regRes.value)) {
        allUserRegistrations = regRes.value.filter(
          (r) => r.studentId === studentId || r.Student_ID === studentId
        );
      }

      dispatch(
        studentActions.setDashboardData({
          billing,
          announcements,
          courses,
          allCatalog,
          allUserRegistrations,
          slots,
          policies,
          currentSemester,
          activeTerm,
          maxCredits,
        })
      );
    } catch (err) {
      console.error('Error in fetchStudentDashboard:', err);
      dispatch(studentActions.setError(err.message || 'Failed to load dashboard data'));
    } finally {
      dispatch(studentActions.setLoading(false));
    }
  };
};

export const fetchStudentRegistration = (studentId, fallbackSemester = 4) => {
  return async (dispatch) => {
    dispatch(studentActions.setLoading(true));
    dispatch(studentActions.setError(null));

    try {
      const [
        catalogRes,
        studentCoursesRes,
        regsRes,
        overridesRes,
        billingRes,
        slotsRes,
        usersRes,
        policiesRes,
      ] = await Promise.allSettled([
        coursesService.getAll(),
        coursesService.getForStudent(studentId),
        registrationsService.getAll(),
        overridesService.getByStudent(studentId),
        revenueService.getStudentBilling(studentId),
        slotsService.getAll(),
        usersService.getAll(),
        policiesService.getPolicies(),
      ]);

      const catalogList =
        catalogRes.status === 'fulfilled' && Array.isArray(catalogRes.value)
          ? catalogRes.value
          : [];

      const studentRaw = studentCoursesRes.status === 'fulfilled' ? studentCoursesRes.value : null;
      const studentCourses =
        studentRaw?.courses && Array.isArray(studentRaw.courses)
          ? studentRaw.courses.map((item) => ({
              ...item.course,
              courseType: item.courseType || item.course?.courseType,
              sections: item.sections,
              prerequisite: item.course?.prerequisite || null,
              prerequisiteCourseId: item.course?.prerequisiteCourseId || null,
            }))
          : [];

      let currentSemester = studentRaw?.currentSemester || fallbackSemester;
      let activeTerm = studentRaw?.activeTerm || 'Spring 2026';
      let maxCredits = studentRaw?.maxCreditLimit || 20;
      let policies = null;

      if (policiesRes.status === 'fulfilled' && policiesRes.value?.settings) {
        const pol = policiesRes.value.settings;
        policies = pol;
        if (pol.academicYear && pol.term) {
          activeTerm = computeTermLabel(pol.academicYear, pol.term);
        }
        if (pol.maxCredits) {
          maxCredits = pol.maxCredits;
        }
      }

      const facultyMap = {};
      if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value)) {
        usersRes.value.forEach((u) => {
          const uId = u.userId || u.User_ID;
          const uName = u.fullName || u.Full_Name;
          if (uId && uName) facultyMap[uId] = uName;
        });
      }

      let courses = [];
      if (studentCourses.length > 0) {
        courses = studentCourses;
      } else {
        const semCourses = catalogList.filter((c) => c.semester === currentSemester);
        courses = semCourses.length > 0 ? semCourses : catalogList.slice(0, 6);
      }

      let allRegistrations = [];
      let registrations = [];
      if (regsRes.status === 'fulfilled' && Array.isArray(regsRes.value)) {
        allRegistrations = regsRes.value;
        registrations = regsRes.value.filter(
          (r) => r.studentId === studentId || r.Student_ID === studentId
        );
      }

      const slots =
        slotsRes.status === 'fulfilled' && Array.isArray(slotsRes.value) ? slotsRes.value : [];
      const overrides =
        overridesRes.status === 'fulfilled' && Array.isArray(overridesRes.value)
          ? overridesRes.value
          : [];

      let billing = {
        studentId,
        balanceDue: 0,
        paymentStatus: 'Cleared',
        isFinancialHoldActive: false,
      };
      if (billingRes.status === 'fulfilled' && billingRes.value) {
        billing = billingRes.value;
      }

      dispatch(
        studentActions.setRegistrationData({
          courses,
          registrations,
          allRegistrations,
          slots,
          overrides,
          billing,
          facultyMap,
          policies,
          currentSemester,
          activeTerm,
          maxCredits,
        })
      );
    } catch (err) {
      console.error('Error in fetchStudentRegistration:', err);
      dispatch(studentActions.setError(err.message || 'Failed to load registration data'));
    } finally {
      dispatch(studentActions.setLoading(false));
    }
  };
};

export const fetchStudentRoadmap = (studentId, currentSemester = 4, deptId = 'CSE') => {
  return async (dispatch) => {
    try {
      const [regData, catData, prereqData, degreeReqData] = await Promise.all([
        registrationsService.getAll(),
        coursesService.getAll(),
        coursesService.getPrerequisites(),
        coursesService.getDegreeRequirements(),
      ]);

      const catalog = Array.isArray(catData) ? catData : [];
      const catalogMap = {};
      catalog.forEach((c) => {
        catalogMap[c.courseId || c.Course_ID] = c;
      });

      const prereqs = Array.isArray(prereqData) ? prereqData : [];
      const prereqMap = {};
      prereqs.forEach((p) => {
        prereqMap[p.targetCourseId] = p.requiredCourseId;
      });

      const userRegs = Array.isArray(regData)
        ? regData.filter((r) => r.studentId === studentId || r.Student_ID === studentId)
        : [];

      const degreeReqs = Array.isArray(degreeReqData) ? degreeReqData : [];
      const deptReqs = degreeReqs.filter((dr) => !dr.deptId || dr.deptId === deptId);

      // Curriculum definitions matching official Lumina curriculum:
      // Sem 1 (20 cr) + Sem 2 (20 cr) + Sem 3 (22 cr) + Sem 4 (24 cr) = 86 cr total
      const curriculumMap = {
        1: [
          { id: 'IC101', name: 'Computer Programming', defaultCredits: 4 },
          { id: 'IC104', name: 'Digital Logic Design', defaultCredits: 4 },
          { id: 'IC103', name: 'Overview of Computers Workshop', defaultCredits: 4 },
          { id: 'IC102', name: 'Discrete Structures and Matrix Algebra', defaultCredits: 4 },
          { id: 'SEED01', name: 'Essential English', defaultCredits: 2 },
          { id: 'SEED02', name: 'Foundations in Human Values', defaultCredits: 2 },
        ],
        2: [
          { id: 'PC201', name: 'Data Structures and Algorithms', defaultCredits: 4 },
          { id: 'IC203', name: 'Computer Architecture', defaultCredits: 4 },
          { id: 'IC202', name: 'Signals and Systems', defaultCredits: 4 },
          { id: 'IC201', name: 'Probability and Statistics', defaultCredits: 4 },
          { id: 'SEED03', name: 'Operational Communication', defaultCredits: 2 },
          { id: 'SEED06', name: 'Energy and Environment', defaultCredits: 2 },
        ],
        3: [
          { id: 'PC302', name: 'Advanced Data Structures and Algorithms', defaultCredits: 4 },
          { id: 'PC303', name: 'Operating Systems', defaultCredits: 4 },
          { id: 'PC304', name: 'Database Management Systems', defaultCredits: 4 },
          { id: 'PC301', name: 'Object Oriented Programming', defaultCredits: 4 },
          { id: 'IC301', name: 'Real Analysis and Numerical Methods', defaultCredits: 4 },
          { id: 'SEED04', name: 'Professional Communication', defaultCredits: 2 },
        ],
        4: [
          { id: 'PC401', name: 'Computer and Communication Networks', defaultCredits: 4 },
          { id: 'PC402', name: 'Fundamentals of Full Stack Development', defaultCredits: 4 },
          { id: 'IC401', name: 'Theory of Computation', defaultCredits: 4 },
          { id: 'PC403', name: 'Artificial Intelligence', defaultCredits: 4 },
          { id: 'SEED05', name: 'Advanced Communication Skills', defaultCredits: 2 },
          { id: 'SEED07', name: 'Logical Reasoning', defaultCredits: 2 },
          { id: 'PE504', name: 'Deep Learning', defaultCredits: 4 },
        ],
      };

      const semHistory = {};
      const passedCourseIds = new Set();
      const inProgressCourseIds = new Set();

      for (let semNum = 1; semNum <= currentSemester; semNum++) {
        const isCurrent = semNum === currentSemester;
        const defaultList = curriculumMap[semNum] || [];
        const semReqs = deptReqs.filter((dr) => dr.targetSemester === semNum);

        let courseList = [];
        if (defaultList.length > 0) {
          courseList = defaultList;
        } else if (semReqs.length > 0) {
          courseList = semReqs.map((dr) => ({
            id: dr.courseId,
            name: catalogMap[dr.courseId]?.courseName || dr.courseId,
            defaultCredits: catalogMap[dr.courseId]?.credits || 4,
          }));
        }

        const mappedCourses = courseList.map((item) => {
          const catItem = catalogMap[item.id] || {};
          const reg = userRegs.find((r) => (r.courseId || r.Course_ID) === item.id);
          const grade = reg?.finalGrade || (isCurrent ? 'In Progress' : 'A');
          const credits = item.defaultCredits || catItem.credits || 4;

          if (isCurrent) {
            inProgressCourseIds.add(item.id);
          } else if (grade !== 'F') {
            passedCourseIds.add(item.id);
          }

          return {
            id: item.id,
            name: catItem.courseName || item.name,
            credits,
            grade,
          };
        });

        const semTotal = mappedCourses.reduce((sum, c) => sum + c.credits, 0);
        const yearOffset = Math.floor((semNum - 1) / 2);
        const isMonsoon = semNum % 2 === 1;
        const startYear = 2024 + yearOffset;
        const dateStr = isMonsoon
          ? `Aug ${startYear} – Dec ${startYear}`
          : `Jan ${startYear + 1} – May ${startYear + 1}`;

        semHistory[semNum] = {
          title: `Semester ${semNum}`,
          date: dateStr,
          isCurrent,
          coursesSummary: mappedCourses.map((c) => c.id).join(', '),
          courses: mappedCourses,
          totalCredits: semTotal,
        };
      }

      // Also merge any additional passed or in-progress courses from userRegs
      userRegs.forEach((r) => {
        const cId = r.courseId || r.Course_ID;
        if (r.finalGrade && r.finalGrade !== 'F') {
          passedCourseIds.add(cId);
        } else if (!r.finalGrade) {
          inProgressCourseIds.add(cId);
        }
      });

      // Calculate total earned credits by adding up all previous semesters' credits as well as current semester's credits
      let previousSemCredits = 0;
      let currentSemCredits = 0;
      Object.keys(semHistory).forEach((s) => {
        const semNum = Number(s);
        if (semNum < currentSemester) {
          previousSemCredits += semHistory[s].totalCredits || 0;
        } else if (semNum === currentSemester) {
          currentSemCredits += semHistory[s].totalCredits || 0;
        }
      });
      const earnedCredits = previousSemCredits + currentSemCredits;

      function resolvePrereq(courseId) {
        const requiredId = prereqMap[courseId];
        if (!requiredId) {
          return { prereqText: 'None', warning: null };
        }
        const requiredName = catalogMap[requiredId]?.courseName || requiredId;
        const isSatisfied = passedCourseIds.has(requiredId) || inProgressCourseIds.has(requiredId);
        return {
          prereqText: `${requiredId}: ${requiredName}`,
          warning: isSatisfied
            ? null
            : `Prerequisite ${requiredId} (${requiredName}) not yet completed.`,
        };
      }

      const peCourses = catalog
        .filter((c) => (c.courseId || '').startsWith('PE'))
        .map((c) => {
          const { prereqText, warning } = resolvePrereq(c.courseId);
          return {
            id: c.courseId,
            name: `${c.courseId}: ${c.courseName}`,
            credits: c.credits || 3,
            prereqText,
            warning,
          };
        });

      const ieCourses = catalog
        .filter((c) => (c.courseId || '').startsWith('IE'))
        .map((c) => {
          const { prereqText, warning } = resolvePrereq(c.courseId);
          return {
            id: c.courseId,
            name: `${c.courseId}: ${c.courseName}`,
            credits: c.credits || 3,
            prereqText,
            warning,
          };
        });

      const futureSemData = {};
      for (let s = currentSemester + 1; s <= 8; s++) {
        const semReqs = deptReqs.filter((dr) => dr.targetSemester === s);
        const coreReqs = semReqs.filter(
          (dr) =>
            dr.courseType === 'Program Core' ||
            dr.courseType === 'Institute Core' ||
            dr.courseType === 'Core'
        );
        const peReqs = semReqs.filter(
          (dr) => dr.courseType === 'Elective' && dr.courseId.startsWith('PE')
        );
        const ieReqs = semReqs.filter(
          (dr) => dr.courseType === 'Elective' && dr.courseId.startsWith('IE')
        );

        const coreList = coreReqs.map((dr) => {
          const cat = catalogMap[dr.courseId] || {};
          const { prereqText, warning } = resolvePrereq(dr.courseId);
          return {
            id: dr.courseId,
            name: `${dr.courseId}: ${cat.courseName || dr.courseId}`,
            credits: cat.credits || 4,
            prereq: prereqText,
            warning,
            type: 'core',
          };
        });

        const yearOffset = Math.floor((s - 1) / 2);
        const isMonsoon = s % 2 === 1;
        const year = 2024 + yearOffset + (isMonsoon ? 0 : 1);
        const dateStr = isMonsoon ? `Monsoon ${year}` : `Spring ${year}`;

        futureSemData[s] = {
          label: `Semester ${s}`,
          date: dateStr,
          limits: {
            PE: peReqs.length > 0 ? peReqs.length : s <= 6 ? 2 : 1,
            IE: ieReqs.length > 0 ? ieReqs.length : s <= 6 ? 1 : 0,
            SEED: 0,
          },
          courses: coreList,
        };
      }

      dispatch(
        studentActions.setRoadmapData({
          semHistory,
          earnedCredits,
          peCourses,
          ieCourses,
          futureSemData,
        })
      );
    } catch (err) {
      console.warn('Academic records error in fetchStudentRoadmap:', err);
    }
  };
};

export const registerStudentCourse = (studentId, courseId) => {
  return async (dispatch) => {
    const res = await registrationsService.enroll(studentId, courseId);
    dispatch(studentActions.addRegistration(res));
    return res;
  };
};

export const submitStudentOverride = ({ studentId, courseId, reason }) => {
  return async (dispatch) => {
    dispatch(studentActions.setIsSubmittingOverride(true));
    try {
      const res = await overridesService.create({
        Student_ID: studentId,
        Course_ID: courseId,
        Reason: reason,
      });
      dispatch(studentActions.addOverride(res));
      return res;
    } finally {
      dispatch(studentActions.setIsSubmittingOverride(false));
    }
  };
};

export const payStudentTuition = (studentId, amount) => {
  return async (dispatch) => {
    dispatch(studentActions.setIsPaying(true));
    try {
      const res = await revenueService.payStudentTuition(studentId, amount);
      dispatch(
        studentActions.updateBilling({
          amountPaid: res.amountPaid || amount,
          balanceDue: 0,
          paymentStatus: 'Cleared',
          isFinancialHoldActive: false,
          transactionId: res.transactionId,
          paymentDate: res.timestamp,
        })
      );
      return res;
    } finally {
      dispatch(studentActions.setIsPaying(false));
    }
  };
};
