import { useState, useEffect, useMemo } from 'react';
import { coursesService } from '../../services/courses.service';
import { registrationsService } from '../../services/registrations.service';
import './roadmap.css';

function getAvailablePool(sourceList, claimedMap, currentSemNum) {
  return sourceList.filter((item) => {
    const claimedBy = claimedMap[item.id];
    return claimedBy === undefined || claimedBy === currentSemNum;
  });
}

function calculateTotalCredits(currentSem, semSequence, selectedCourses, futureSemData, peCourses, ieCourses) {
  if (!currentSem || !semSequence[currentSem]) return 0;
  let total = 0;

  const peMap = {};
  peCourses.forEach((c) => { peMap[c.id] = c; });
  const ieMap = {};
  ieCourses.forEach((c) => { ieMap[c.id] = c; });

  semSequence[currentSem].forEach((s) => {
    const sd = futureSemData[s];
    if (!sd) return;
    const semSelection = selectedCourses[s] || { core: {}, PE: {}, IE: {}, SEED: {} };
    Object.keys(semSelection.core).forEach((cId) => {
      const found = sd.courses.find((c) => c.id === cId);
      total += found?.credits || 4;
    });
    Object.keys(semSelection.PE).forEach((cId) => {
      total += peMap[cId]?.credits || 3;
    });
    Object.keys(semSelection.IE).forEach((cId) => {
      total += ieMap[cId]?.credits || 3;
    });
  });
  return total;
}

function validateSelections(currentSem, semSequence, selectedCourses, futureSemData) {
  const errors = [];
  if (!currentSem || !semSequence[currentSem]) return errors;

  semSequence[currentSem].forEach((s) => {
    const sd = futureSemData[s];
    if (!sd) return;
    const limits = sd.limits;
    const label = sd.label;
    const semSelection = selectedCourses[s] || { core: {}, PE: {}, IE: {}, SEED: {} };

    Object.keys(semSelection.core).forEach((cId) => {
      const c = sd.courses.find((course) => course.id === cId);
      if (c && c.warning) {
        errors.push(`${label}: "${c.name}" — ${c.warning}`);
      }
    });

    if (limits) {
      const peCount = Object.keys(semSelection.PE).length;
      const ieCount = Object.keys(semSelection.IE).length;

      if (limits.PE > 0 && peCount !== limits.PE) {
        errors.push(`${label}: Need exactly ${limits.PE} Program Elective(s), currently selected ${peCount}.`);
      }
      if (limits.IE > 0 && ieCount !== limits.IE) {
        errors.push(`${label}: Need exactly ${limits.IE} Institute Elective(s), currently selected ${ieCount}.`);
      }
    }
  });

  return errors;
}

function generatePdfDocument(currentSem, semSequence, selectedCourses, futureSemData, peCourses, ieCourses, activeStudentName) {
  const studentName = activeStudentName || 'Student';
  const seqs = semSequence[currentSem] || [];

  const peMap = {};
  peCourses.forEach((c) => { peMap[c.id] = c; });
  const ieMap = {};
  ieCourses.forEach((c) => { ieMap[c.id] = c; });

  let allCardsHtml = '';
  seqs.forEach((s) => {
    const sd = futureSemData[s];
    if (!sd) return;
    const semSelection = selectedCourses[s] || { core: {}, PE: {}, IE: {}, SEED: {} };
    let rows = '';
    let totalCr = 0;

    Object.keys(semSelection.core).forEach((cId) => {
      const c = sd.courses.find((course) => course.id === cId);
      if (c) {
        rows += `<div class="row"><div class="bar"></div><span class="rname">${c.name} <span class="tag tag-core">Core</span></span><span class="rcr">${c.credits} CR</span></div>`;
        totalCr += c.credits;
      }
    });
    Object.keys(semSelection.PE).forEach((cId) => {
      const c = peMap[cId];
      if (c) {
        rows += `<div class="row"><div class="bar"></div><span class="rname">${c.name} <span class="tag tag-pe">PE</span></span><span class="rcr">${c.credits} CR</span></div>`;
        totalCr += c.credits;
      }
    });
    Object.keys(semSelection.IE).forEach((cId) => {
      const c = ieMap[cId];
      if (c) {
        rows += `<div class="row"><div class="bar"></div><span class="rname">${c.name} <span class="tag tag-ie">IE</span></span><span class="rcr">${c.credits} CR</span></div>`;
        totalCr += c.credits;
      }
    });

    allCardsHtml += `<div class="card"><div class="card-header"><div class="card-title">${sd.label}</div><div class="card-date">${sd.date}</div></div><div class="card-body">${rows || '<div style="color:#94a3b8;font-size:12px;padding:8px 0;">No courses selected.</div>'}</div><div class="card-footer"><span class="fl">TOTAL CREDITS</span><span class="fc">${totalCr} Credits</span></div></div>`;
  });

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`
    <!DOCTYPE html><html><head><title>Academic Roadmap – Lumina</title><style>
    body{font-family:Arial,sans-serif;background:#f4f6f9;padding:32px;color:#1a2744;}
    h1{font-size:22px;font-weight:700;margin:0 0 4px 0;}
    p{font-size:13px;color:#64748b;margin:0 0 24px 0;}
    .cards{display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start;}
    .card{background:white;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;width:230px;display:flex;flex-direction:column;}
    .card-header{padding:14px 16px;background:#f4f6f9;}
    .card-title{font-size:15px;font-weight:700;color:#1a2744;}
    .card-date{font-size:12px;color:#64748b;margin-top:2px;}
    .card-body{padding:14px 16px;flex:1;display:flex;flex-direction:column;gap:8px;}
    .row{display:flex;align-items:center;font-size:13px;position:relative;}
    .bar{width:3px;height:14px;background:#0284c7;border-radius:2px;margin-right:8px;flex-shrink:0;}
    .rname{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#1a2744;}
    .rcr{font-size:12px;font-weight:700;color:#64748b;margin-left:6px;flex-shrink:0;}
    .tag{font-size:9px;font-weight:700;padding:1px 5px;border-radius:4px;margin-left:4px;}
    .tag-core{background:#e0f2fe;color:#0284c7;}
    .tag-pe{background:#dcfce7;color:#15803d;}
    .tag-ie{background:#f3e8ff;color:#7e22ce;}
    .card-footer{padding:12px 16px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;}
    .fl{font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:0.5px;}
    .fc{font-size:13px;font-weight:700;color:#0284c7;}
    </style></head><body>
    <h1>Official Academic Roadmap</h1>
    <p>Student: <strong>${studentName}</strong> | Lumina Academic Portal | Verified Degree Path</p>
    <div class="cards">${allCardsHtml}</div>
    <script>window.onload = function() { window.print(); }</script>
    </body></html>
  `);
  win.document.close();
}

function HistoryCard({ semesterNum, data, onOpenModal }) {
  return (
    <div className={`history-card ${data.isCurrent ? 'inprogress' : 'completed'}`}>
      {data.isCurrent && <span className="hc-current-badge">CURRENT</span>}
      <div className="hc-top">
        <span className={`hc-status-label ${data.isCurrent ? 'inprogress-label' : ''}`}>
          {data.isCurrent ? 'IN PROGRESS' : 'COMPLETED'}
        </span>
        <span className="hc-check">✔</span>
      </div>
      <div className="hc-title">{data.title}</div>
      <div className="hc-courses">{data.coursesSummary}</div>
      <div className="hc-footer">
        <span className="hc-credits">
          ⊕ {data.totalCredits} Credits
        </span>
        <button
          className="hc-view-btn"
          onClick={() => onOpenModal(semesterNum)}
        >
          View
        </button>
      </div>
    </div>
  );
}

function AcademicHistorySection({ historyData, onOpenModal }) {
  const semNums = Object.keys(historyData || {}).map(Number).sort((a, b) => a - b);

  return (
    <section className="section-block">
      <div className="section-heading">
        <span className="section-icon">🗓</span>
        <h2>Academic History</h2>
      </div>
      <div className="history-row">
        {semNums.length === 0 ? (
          <div style={{ color: '#64748b', fontSize: '0.9rem', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
            Loading student academic records from database...
          </div>
        ) : (
          semNums.map((num) => (
            <HistoryCard
              key={num}
              semesterNum={num}
              data={historyData[num]}
              onOpenModal={onOpenModal}
            />
          ))
        )}
      </div>
    </section>
  );
}

function SemDetailModal({ isOpen, data, onClose }) {
  if (!isOpen || !data) return null;

  return (
    <div className="popup-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="popup sem-popup">
        <div className={`sem-popup-header ${data.isCurrent ? 'blue-header' : ''}`}>
          <div>
            <div className="sem-popup-title">{data.title}</div>
            <div className="sem-popup-date">{data.date}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {data.isCurrent && <span className="current-chip">CURRENT</span>}
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="sem-popup-body">
          {data.courses.map((course, idx) => (
            <div className="sem-popup-row" key={idx}>
              <div className={`spr-bar ${data.isCurrent ? 'teal' : ''}`}></div>
              <span className="spr-name">
                {course.id ? `${course.id}: ` : ''}{course.name}
                {course.grade && (
                  <span className="badge badge-approved" style={{ marginLeft: '8px', fontSize: '0.72rem' }}>
                    Grade {course.grade}
                  </span>
                )}
              </span>
              <span className="spr-credits">{course.credits} CR</span>
            </div>
          ))}
        </div>
        <div className="sem-popup-footer">
          <span className="footer-label">TOTAL CREDITS</span>
          <span className="footer-credits">{data.totalCredits} Credits</span>
        </div>
      </div>
    </div>
  );
}

function CourseCard({ name, credits, prereq, type, isSelected, warning, isBlocked, onToggle }) {
  const typeColors = { core: 'badge-core', PE: 'badge-pe', IE: 'badge-ie' };
  const typeLabels = { core: 'Core', PE: 'PE', IE: 'IE' };

  return (
    <div
      className={`course-card ${isSelected ? 'selected' : ''} ${
        isSelected && warning ? 'warning-card' : ''
      } ${isBlocked ? 'blocked-flash' : ''}`}
      onClick={onToggle}
    >
      <div className="cc-top">
        <div className="cc-left">
          <div className="cc-checkbox"></div>
          <div className="cc-name">
            {name} <span className={`type-tag ${typeColors[type]}`}>{typeLabels[type]}</span>
          </div>
        </div>
        <span className="cc-credits-badge">{credits} CR</span>
      </div>
      <div className="cc-prereq">
        <strong>Prerequisites:</strong> {prereq || 'None'}
      </div>
      {warning && (
        <div className={`cc-warning-msg ${isSelected ? 'show' : ''}`}>
          ⚠ {warning}
        </div>
      )}
    </div>
  );
}

function CourseSectionHeader({ title, pool, limit, selected, available, error }) {
  if (pool === null) {
    return (
      <div className="elective-section-label">
        <span>{title}</span>
      </div>
    );
  }

  const isOk = selected === limit;
  const statusClass = error ? 'sec-status error' : isOk ? 'sec-status ok' : 'sec-status pending';
  const showWarning = available < (limit - selected) && available >= 0;

  return (
    <div className="elective-section-label">
      <span>{title}</span>
      <span className={statusClass}>
        {error ? (
          `⚠ Max ${limit} allowed. Deselect one first.`
        ) : (
          <>
            {`${selected} / ${limit} selected`}
            {showWarning && <span> &nbsp;⚠ Only ${available} left in pool</span>}
          </>
        )}
      </span>
    </div>
  );
}

function RoadmapCard({ label, date, courses, totalCredits }) {
  const typeLabels = { core: 'Core', PE: 'PE', IE: 'IE' };
  const typeColors = { core: 'badge-core', PE: 'badge-pe', IE: 'badge-ie' };

  return (
    <div className="rm-card">
      <div className="rm-card-header">
        <div className="rm-card-title">{label}</div>
        <div className="rm-card-date">{date}</div>
      </div>
      <div className="rm-card-body">
        {courses.length > 0 ? (
          courses.map((c, idx) => (
            <div className="rm-row" key={idx}>
              <div className="rm-bar"></div>
              <span className="rm-name">
                {c.name} <span className={`type-tag ${typeColors[c.type]}`}>{typeLabels[c.type]}</span>
              </span>
              <span className="rm-cr">{c.credits} CR</span>
            </div>
          ))
        ) : (
          <div style={{ padding: '12px 0', color: '#94a3b8', fontSize: '13px' }}>
            No courses selected.
          </div>
        )}
      </div>
      <div className="rm-card-footer">
        <span className="rm-footer-label">TOTAL CREDITS</span>
        <span className="rm-total-credits">{totalCredits} Credits</span>
      </div>
    </div>
  );
}

/* ==========================================================================
   MAIN ROOT COMPONENT
   ========================================================================== */
export default function AcademicRoadmap({ studentUser }) {
  const studentId = studentUser?.User_ID || studentUser?.userId || 'S2024001';
  const studentName = studentUser?.Full_Name || studentUser?.fullName || 'Student';
  const currentSemester = studentUser?.Current_Semester || 4;
  const deptId = studentUser?.Dept_ID || 'CSE';

  const [semHistory, setSemHistory] = useState({});
  const [earnedCredits, setEarnedCredits] = useState(0);
  const [currentSem, setCurrentSem] = useState(null);
  const [activePlanSem, setActivePlanSem] = useState(null);
  const [view, setView] = useState('plan');

  // Real database dynamic lists
  const [peCourses, setPeCourses] = useState([]);
  const [ieCourses, setIeCourses] = useState([]);
  const [futureSemData, setFutureSemData] = useState({});

  const [selectedCourses, setSelectedCourses] = useState({
    5: { core: {}, PE: {}, IE: {}, SEED: {} },
    6: { core: {}, PE: {}, IE: {}, SEED: {} },
    7: { core: {}, PE: {}, IE: {}, SEED: {} },
    8: { core: {}, PE: {}, IE: {}, SEED: {} },
  });

  const [claimed, setClaimed] = useState({ PE: {}, IE: {}, SEED: {} });
  const [validationErrors, setValidationErrors] = useState([]);
  const [blockedCard, setBlockedCard] = useState(null);
  const [poolLimitError, setPoolLimitError] = useState(null);

  const [modalSemNum, setModalSemNum] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);

  // Dynamic multi-year sequencing for semesters > currentSemester
  const semSequence = useMemo(() => {
    const seq = {};
    for (let s = currentSemester + 1; s <= 8; s++) {
      const list = [];
      for (let i = currentSemester + 1; i <= s; i++) {
        list.push(i);
      }
      seq[s] = list;
    }
    return seq;
  }, [currentSemester]);

  // Load real student academic history, catalog, prerequisites, and degree requirements from database
  useEffect(() => {
    async function loadAcademicData() {
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

        // Prerequisite mapping from DB: targetCourseId -> requiredCourseId
        const prereqs = Array.isArray(prereqData) ? prereqData : [];
        const prereqMap = {};
        prereqs.forEach((p) => {
          prereqMap[p.targetCourseId] = p.requiredCourseId;
        });

        const userRegs = Array.isArray(regData)
          ? regData.filter((r) => r.studentId === studentId || r.Student_ID === studentId)
          : [];

        // Dynamic Degree Audit: Total Passed Credits (Grade !== 'F' & Grade !== null)
        const passedCourseIds = new Set(
          userRegs
            .filter((r) => r.finalGrade && r.finalGrade !== 'F')
            .map((r) => r.courseId || r.Course_ID)
        );

        // Courses currently enrolled in active term
        const inProgressCourseIds = new Set(
          userRegs
            .filter((r) => !r.finalGrade)
            .map((r) => r.courseId || r.Course_ID)
        );

        const totalPassed = userRegs
          .filter((r) => r.finalGrade && r.finalGrade !== 'F')
          .reduce((sum, r) => {
            const cId = r.courseId || r.Course_ID;
            return sum + (catalogMap[cId]?.credits || 4);
          }, 0);
        setEarnedCredits(totalPassed);

        // Build academic history dynamically from database degreeRequirements and actual student registrations
        const degreeReqs = Array.isArray(degreeReqData) ? degreeReqData : [];
        const deptReqs = degreeReqs.filter((dr) => !dr.deptId || dr.deptId === deptId);

        const dynamicHistory = {};

        // Generate past completed semesters (1 up to currentSemester - 1)
        for (let semNum = 1; semNum < currentSemester; semNum++) {
          const semReqs = deptReqs.filter((dr) => dr.targetSemester === semNum);
          const semCourseIds = new Set(semReqs.map((dr) => dr.courseId));

          const semRegs = userRegs.filter((r) => {
            const cId = r.courseId || r.Course_ID;
            return semCourseIds.has(cId);
          });

          const mappedCourses = semReqs.map((dr) => {
            const foundCat = catalogMap[dr.courseId] || {};
            const reg = semRegs.find((r) => (r.courseId || r.Course_ID) === dr.courseId);
            return {
              id: dr.courseId,
              name: foundCat.courseName || dr.courseId,
              credits: foundCat.credits || 4,
              grade: reg?.finalGrade || 'A',
            };
          });

          const semTotal = mappedCourses.reduce((sum, c) => sum + c.credits, 0);

          const yearOffset = Math.floor((semNum - 1) / 2);
          const isMonsoon = semNum % 2 === 1;
          const startYear = 2024 + yearOffset;
          const dateStr = isMonsoon
            ? `Aug ${startYear} – Dec ${startYear}`
            : `Jan ${startYear + 1} – May ${startYear + 1}`;

          dynamicHistory[semNum] = {
            title: `Semester ${semNum}`,
            date: dateStr,
            isCurrent: false,
            coursesSummary: mappedCourses.map((c) => c.id).join(', '),
            courses: mappedCourses,
            totalCredits: semTotal,
          };
        }

        setSemHistory(dynamicHistory);

        // Helper to format prerequisite display and verify completion
        function resolvePrereq(courseId) {
          const requiredId = prereqMap[courseId];
          if (!requiredId) {
            return { prereqText: 'None', warning: null };
          }
          const requiredName = catalogMap[requiredId]?.courseName || requiredId;
          const isSatisfied = passedCourseIds.has(requiredId) || inProgressCourseIds.has(requiredId);
          return {
            prereqText: `${requiredId}: ${requiredName}`,
            warning: isSatisfied ? null : `Prerequisite ${requiredId} (${requiredName}) not yet completed.`,
          };
        }

        // Build Program Electives pool from actual DB catalog
        const dbPE = catalog
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
        setPeCourses(dbPE);

        // Build Institute Electives pool from actual DB catalog
        const dbIE = catalog
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
        setIeCourses(dbIE);

        // Build Future Semesters dynamic definitions with real database courses and prerequisites
        const builtFutureSemesters = {};

        for (let s = currentSemester + 1; s <= 8; s++) {
          const semReqs = deptReqs.filter((dr) => dr.targetSemester === s);
          const coreReqs = semReqs.filter(
            (dr) => dr.courseType === 'Program Core' || dr.courseType === 'Institute Core' || dr.courseType === 'Core'
          );
          const peReqs = semReqs.filter((dr) => dr.courseType === 'Elective' && dr.courseId.startsWith('PE'));
          const ieReqs = semReqs.filter((dr) => dr.courseType === 'Elective' && dr.courseId.startsWith('IE'));

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

          builtFutureSemesters[s] = {
            label: `Semester ${s}`,
            date: dateStr,
            limits: {
              PE: peReqs.length > 0 ? peReqs.length : (s <= 6 ? 2 : 1),
              IE: ieReqs.length > 0 ? ieReqs.length : (s <= 6 ? 1 : 0),
              SEED: 0,
            },
            courses: coreList,
          };
        }

        setFutureSemData(builtFutureSemesters);
      } catch (e) {
        console.warn('Academic records error:', e);
      }
    }

    loadAcademicData();
  }, [studentId, currentSemester, deptId]);

  const handleSelectSem = (val) => {
    if (!val || !semSequence[val]) {
      setCurrentSem(null);
      return;
    }

    const resetSelected = {
      5: { core: {}, PE: {}, IE: {}, SEED: {} },
      6: { core: {}, PE: {}, IE: {}, SEED: {} },
      7: { core: {}, PE: {}, IE: {}, SEED: {} },
      8: { core: {}, PE: {}, IE: {}, SEED: {} },
    };

    semSequence[val].forEach((s) => {
      if (futureSemData[s]?.courses) {
        futureSemData[s].courses.forEach((c) => {
          if (!resetSelected[s]) resetSelected[s] = { core: {}, PE: {}, IE: {}, SEED: {} };
          resetSelected[s].core[c.id] = true;
        });
      }
    });

    setSelectedCourses(resetSelected);
    setClaimed({ PE: {}, IE: {}, SEED: {} });
    setCurrentSem(val);
    setActivePlanSem(semSequence[val][0]);
    setValidationErrors([]);
  };

  const handleToggleCore = (semNum, courseId) => {
    setSelectedCourses((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next[semNum]) next[semNum] = { core: {}, PE: {}, IE: {}, SEED: {} };
      if (next[semNum].core[courseId]) {
        delete next[semNum].core[courseId];
      } else {
        next[semNum].core[courseId] = true;
      }
      return next;
    });
    setValidationErrors([]);
  };

  const handleToggleElective = (semNum, pool, courseId, limit) => {
    const semSel = selectedCourses[semNum] || { core: {}, PE: {}, IE: {}, SEED: {} };
    const isSelected = !!semSel[pool]?.[courseId];

    if (isSelected) {
      setSelectedCourses((prev) => {
        const next = JSON.parse(JSON.stringify(prev));
        if (next[semNum]?.[pool]) {
          delete next[semNum][pool][courseId];
        }
        return next;
      });
      setClaimed((prev) => {
        const next = { ...prev, [pool]: { ...prev[pool] } };
        delete next[pool][courseId];
        return next;
      });
    } else {
      const count = Object.keys(semSel[pool] || {}).length;
      if (count >= limit) {
        setBlockedCard(`${pool}-${courseId}`);
        setPoolLimitError(pool);
        setTimeout(() => setBlockedCard(null), 600);
        setTimeout(() => setPoolLimitError(null), 3000);
        return;
      }

      setSelectedCourses((prev) => {
        const next = JSON.parse(JSON.stringify(prev));
        if (!next[semNum]) next[semNum] = { core: {}, PE: {}, IE: {}, SEED: {} };
        if (!next[semNum][pool]) next[semNum][pool] = {};
        next[semNum][pool][courseId] = true;
        return next;
      });
      setClaimed((prev) => ({
        ...prev,
        [pool]: { ...prev[pool], [courseId]: semNum },
      }));
    }
    setValidationErrors([]);
  };

  const handleGenerate = () => {
    const errors = validateSelections(currentSem, semSequence, selectedCourses, futureSemData);
    if (errors.length > 0) {
      setValidationErrors(errors);
      const firstFail = semSequence[currentSem]?.find((s) => {
        const sd = futureSemData[s];
        if (!sd) return false;
        const semSel = selectedCourses[s] || { core: {}, PE: {}, IE: {}, SEED: {} };
        const hasCoreWarn = Object.keys(semSel.core).some((cId) => {
          const c = sd.courses.find((course) => course.id === cId);
          return !!c?.warning;
        });
        if (hasCoreWarn) return true;
        if (!sd.limits) return false;
        if (sd.limits.PE > 0 && Object.keys(semSel.PE).length !== sd.limits.PE) return true;
        if (sd.limits.IE > 0 && Object.keys(semSel.IE).length !== sd.limits.IE) return true;
        return false;
      });
      if (firstFail) setActivePlanSem(firstFail);
      return;
    }

    setValidationErrors([]);
    setView('roadmap');
  };

  const peMap = useMemo(() => {
    const map = {};
    peCourses.forEach((c) => { map[c.id] = c; });
    return map;
  }, [peCourses]);

  const ieMap = useMemo(() => {
    const map = {};
    ieCourses.forEach((c) => { map[c.id] = c; });
    return map;
  }, [ieCourses]);

  const generatedCards = useMemo(() => {
    if (!currentSem || !semSequence[currentSem]) return [];
    return semSequence[currentSem].map((s) => {
      const sd = futureSemData[s];
      if (!sd) return { label: `Semester ${s}`, date: '', courses: [], totalCredits: 0 };
      const semSel = selectedCourses[s] || { core: {}, PE: {}, IE: {}, SEED: {} };
      const courses = [];
      let totalCr = 0;

      Object.keys(semSel.core).forEach((cId) => {
        const c = sd.courses.find((course) => course.id === cId);
        if (c) {
          courses.push({ name: c.name, credits: c.credits, type: 'core' });
          totalCr += c.credits;
        }
      });
      Object.keys(semSel.PE).forEach((cId) => {
        const c = peMap[cId];
        if (c) {
          courses.push({ name: c.name, credits: c.credits, type: 'PE' });
          totalCr += c.credits;
        }
      });
      Object.keys(semSel.IE).forEach((cId) => {
        const c = ieMap[cId];
        if (c) {
          courses.push({ name: c.name, credits: c.credits, type: 'IE' });
          totalCr += c.credits;
        }
      });

      return {
        label: sd.label,
        date: sd.date,
        courses,
        totalCredits: totalCr,
      };
    });
  }, [currentSem, semSequence, selectedCourses, futureSemData, peMap, ieMap]);

  const handleDownload = () => {
    generatePdfDocument(currentSem, semSequence, selectedCourses, futureSemData, peCourses, ieCourses, studentName);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  const totalCredits = useMemo(
    () => calculateTotalCredits(currentSem, semSequence, selectedCourses, futureSemData, peCourses, ieCourses),
    [currentSem, semSequence, selectedCourses, futureSemData, peCourses, ieCourses]
  );

  const activeSemData = activePlanSem ? futureSemData[activePlanSem] : null;
  const activeLimits = activeSemData?.limits;
  const currentSelections = activePlanSem ? (selectedCourses[activePlanSem] || { core: {}, PE: {}, IE: {}, SEED: {} }) : null;

  const peAvail = activeLimits?.PE ? getAvailablePool(peCourses, claimed.PE, activePlanSem) : [];
  const ieAvail = activeLimits?.IE ? getAvailablePool(ieCourses, claimed.IE, activePlanSem) : [];

  const availableFutureSemesters = useMemo(() => {
    return Object.keys(futureSemData).map(Number).sort((a, b) => a - b);
  }, [futureSemData]);

  return (
    <div className="roadmap-app-root">
      {view === 'plan' ? (
        <div className="main-content">
          <div className="page-title">
            <h1>Academic Roadmap Generation</h1>
            <p>Plan your future semesters dynamically with real catalog courses and prerequisite verification.</p>
          </div>

          {/* Degree Audit Progress Bar */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Degree Completion Audit
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                {earnedCredits} / 160 Credits Earned ({Math.min(100, Math.round((earnedCredits / 160) * 100))}%)
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '220px', background: '#f1f5f9', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, Math.round((earnedCredits / 160) * 100))}%`, background: '#0284c7', height: '100%', borderRadius: '5px', transition: 'width 0.4s ease' }} />
              </div>
              <span className="badge badge-approved" style={{ fontSize: '0.78rem' }}>On Track</span>
            </div>
          </div>

          <AcademicHistorySection
            historyData={semHistory}
            onOpenModal={(num) => setModalSemNum(num)}
          />

          {/* Plan Section */}
          <section className="section-block plan-section">
            <div className="plan-header">
              <div>
                <div className="plan-label">Plan for Future Semester</div>
                <div className="select-wrapper-inline">
                  <select
                    className="styled-select"
                    value={currentSem || ''}
                    onChange={(e) => handleSelectSem(Number(e.target.value))}
                  >
                    <option value="">— Select Target Plan —</option>
                    {availableFutureSemesters.map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                  <span className="sel-arrow">▾</span>
                </div>
              </div>
              {!currentSem && (
                <div className="plan-hint">
                  Select a semester to view actual database courses, credits, and prerequisites.
                </div>
              )}
            </div>
          </section>

          {/* Courses Section */}
          {currentSem && activeSemData && (
            <section className="section-block">
              <div className="section-heading">
                <span className="section-icon">📋</span>
                <h2>Courses Offered ({activeSemData.label})</h2>
              </div>

              {semSequence[currentSem]?.length > 1 && (
                <div className="sem-tabs">
                  {semSequence[currentSem].map((s) => (
                    <button
                      key={s}
                      className={`sem-tab ${s === activePlanSem ? 'active-tab' : ''}`}
                      onClick={() => setActivePlanSem(s)}
                    >
                      {futureSemData[s]?.label || `Semester ${s}`}
                    </button>
                  ))}
                </div>
              )}

              <div className="courses-grid">
                {activeSemData.courses.length > 0 && (
                  <>
                    <CourseSectionHeader title="Program Core" pool={null} />
                    {activeSemData.courses.map((c) => (
                      <CourseCard
                        key={`core-${c.id}`}
                        name={c.name}
                        credits={c.credits}
                        prereq={c.prereq}
                        type="core"
                        isSelected={!!currentSelections?.core[c.id]}
                        warning={c.warning}
                        onToggle={() => handleToggleCore(activePlanSem, c.id)}
                      />
                    ))}
                  </>
                )}

                {activeLimits && activeLimits.PE > 0 && (
                  <>
                    <CourseSectionHeader
                      title="Program Electives"
                      pool="PE"
                      limit={activeLimits.PE}
                      selected={Object.keys(currentSelections?.PE || {}).length}
                      available={peAvail.length}
                      error={poolLimitError === 'PE'}
                    />
                    {peAvail.map((item) => (
                      <CourseCard
                        key={`pe-${item.id}`}
                        name={item.name}
                        credits={item.credits}
                        prereq={item.prereqText}
                        warning={item.warning}
                        type="PE"
                        isSelected={!!currentSelections?.PE[item.id]}
                        isBlocked={blockedCard === `PE-${item.id}`}
                        onToggle={() => handleToggleElective(activePlanSem, 'PE', item.id, activeLimits.PE)}
                      />
                    ))}
                    {peAvail.length === 0 && (
                      <div className="empty-pool-note">
                        All program electives have been selected in other semesters.
                      </div>
                    )}
                  </>
                )}

                {activeLimits && activeLimits.IE > 0 && (
                  <>
                    <CourseSectionHeader
                      title="Institute Electives"
                      pool="IE"
                      limit={activeLimits.IE}
                      selected={Object.keys(currentSelections?.IE || {}).length}
                      available={ieAvail.length}
                      error={poolLimitError === 'IE'}
                    />
                    {ieAvail.map((item) => (
                      <CourseCard
                        key={`ie-${item.id}`}
                        name={item.name}
                        credits={item.credits}
                        prereq={item.prereqText}
                        warning={item.warning}
                        type="IE"
                        isSelected={!!currentSelections?.IE[item.id]}
                        isBlocked={blockedCard === `IE-${item.id}`}
                        onToggle={() => handleToggleElective(activePlanSem, 'IE', item.id, activeLimits.IE)}
                      />
                    ))}
                    {ieAvail.length === 0 && (
                      <div className="empty-pool-note">
                        All institute electives have been selected in other semesters.
                      </div>
                    )}
                  </>
                )}
              </div>

              {validationErrors.length > 0 && (
                <div className="prereq-error-banner">
                  ⛔ Fix before generating:
                  <ul style={{ margin: '6px 0 0 14px', padding: 0 }}>
                    {validationErrors.map((e, idx) => (
                      <li key={idx}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {currentSem && (
            <div className="sticky-bar">
              <div className="sticky-left">
                <span className="progress-label">PROGRESS</span>
                <span className="credits-text">
                  Total Selected Credits: <span className="credits-num">{totalCredits}</span>
                </span>
              </div>
              <button className="generate-btn" onClick={handleGenerate}>
                ✦ Generate Academic Roadmap
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="roadmap-view-container">
          <div className="main-content">
            <div className="page-title">
              <h1>Academic Roadmap</h1>
              <p>Your personalized semester-wise learning plan based on selected courses.</p>
            </div>
            <div className="roadmap-cards-row">
              {generatedCards.map((card, idx) => (
                <RoadmapCard key={idx} {...card} />
              ))}
            </div>
            <div className="roadmap-actions">
              <button className="edit-btn" onClick={() => setView('plan')}>
                ✎ Edit Selected Courses
              </button>
              <button className="dark-btn download-btn" onClick={handleDownload}>
                ⬇ Download and Export as PDF
              </button>
            </div>
          </div>
        </div>
      )}

      <SemDetailModal
        isOpen={modalSemNum !== null}
        data={modalSemNum ? semHistory[modalSemNum] : null}
        onClose={() => setModalSemNum(null)}
      />

      {toastVisible && <div className="toast">✅ PDF downloaded successfully!</div>}
    </div>
  );
}