import React, { useState, useEffect, useMemo } from 'react';
import './roadmap.css';


const allProgramElectives = [
  'Agent Based Modelling & Simulations',
  'Cloud Computing',
  'Compiler Design',
  'Computer Graphics and Multimedia',
  'Computer Vision',
  'Data Mining',
  'Distributed Computing',
  'High-Performance Computing',
  'Information Retrieval',
  'Introduction to Cyber Security',
  'Machine Learning',
  'Natural Language Processing',
  'Principles of Cyber Physical System Computation',
  'Soft Computing and Evolutionary AI',
];

const allInstituteElectives = [
  'Applied Stochastic Models',
  'Brain Computer Interaction',
  'Cryptography',
  'Digital Image Processing',
  'Introduction to Data Analytics',
];

const allSeedCourses = [
  'Energy and Environment',
  'Ethics in Everyday Life',
  'Skills for Employability',
  'Quantitative and Reasoning Aptitude',
  'Personal Growth Programme',
  'Macro-economics and Personal Finance',
  'IT Project Management',
  'Innovation and Entrepreneurship',
  'Climate Change and its Implications',
  'ICT for Development',
  'Startup 101',
  'Organizational Behavior',
];

const futureSemesters = {
  4: {
    label: 'Semester 4',
    date: 'Spring 2026 – Summer 2026',
    limits: null,
    courses: [
      { name: 'Computer Communication Networks (CCN)', credits: 4, prereq: 'None', type: 'core', warning: null },
      { name: 'Artificial Intelligence (AI)', credits: 4, prereq: 'None', type: 'core', warning: null },
      { name: 'Theory of Computation (TOC)', credits: 4, prereq: 'OS', type: 'core', warning: null },
      { name: 'Full Stack Dev (FFSD)', credits: 4, prereq: 'None', type: 'core', warning: null },
      { name: 'Advanced Communication Skills (ACS)', credits: 2, prereq: 'EE, OPC, PC', type: 'core', warning: null },
      { name: 'Logical Reasoning (LR)', credits: 2, prereq: 'None', type: 'core', warning: null },
      { name: 'Deep Learning (DL)', credits: 4, prereq: 'ML', type: 'core', warning: 'Prerequisite ML not met.' },
    ],
  },
  5: {
    label: 'Semester 5',
    date: 'Fall 2026 – Winter 2027',
    limits: { PE: 4, IE: 0, SEED: 2 },
    courses: [
      { name: 'Framework Driven Front-End Development (FDFED)', credits: 4, prereq: 'None', type: 'core', warning: null },
    ],
  },
  6: {
    label: 'Semester 6',
    date: 'Spring 2027 – Summer 2027',
    limits: { PE: 3, IE: 1, SEED: 1 },
    courses: [
      { name: 'Web Services and Backend Development (WBD)', credits: 4, prereq: 'None', type: 'core', warning: null },
    ],
  },
  7: {
    label: 'Semester 7',
    date: 'Fall 2027 – Winter 2028',
    limits: { PE: 1, IE: 1, SEED: 1 },
    courses: [],
  },
  8: {
    label: 'Semester 8',
    date: 'Spring 2028 – Summer 2028',
    limits: { PE: 1, IE: 1, SEED: 1 },
    courses: [],
  },
};

const semSequence = {
  5: [5],
  6: [5, 6],
  7: [5, 6, 7],
  8: [5, 6, 7, 8],
};

const fallbackSemHistory = {
  1: {
    title: 'Semester 1',
    date: 'Aug 2024 – Dec 2024',
    isCurrent: false,
    coursesSummary: 'CP, DLD, OCW, DSMA, EE, FHVE',
    courses: [
      { name: 'Computer Programming', credits: 4 },
      { name: 'Digital Logic Design', credits: 4 },
      { name: 'Overview of Computer Workshop', credits: 4 },
      { name: 'Discrete Structures', credits: 4 },
      { name: 'Essential English', credits: 2 },
      { name: 'Human Values and Ethics', credits: 2 },
    ],
    totalCredits: 20,
  },
  2: {
    title: 'Semester 2',
    date: 'Jan 2025 – May 2025',
    isCurrent: false,
    coursesSummary: 'DSA, CA, SS, PS, OPC, EEN',
    courses: [
      { name: 'Data Structures & Algorithms', credits: 4 },
      { name: 'Computer Architecture', credits: 4 },
      { name: 'Signals & Systems', credits: 4 },
      { name: 'Probability & Statistics', credits: 4 },
      { name: 'Operational Communication', credits: 2 },
      { name: 'Energy & Environment', credits: 2 },
    ],
    totalCredits: 20,
  },
  3: {
    title: 'Semester 3',
    date: 'Aug 2025 – Dec 2025',
    isCurrent: false,
    coursesSummary: 'ADSA, RANAC, OS, OOP, DBMS, PC',
    courses: [
      { name: 'Advanced Data Structures & Algorithms', credits: 4 },
      { name: 'Operating Systems', credits: 4 },
      { name: 'Database Management Systems', credits: 4 },
      { name: 'Object Oriented Programming', credits: 4 },
      { name: 'Analysis and Calculus', credits: 4 },
      { name: 'Professional Communication', credits: 2 },
    ],
    totalCredits: 22,
  },
};


function getAvailablePool(pool, claimedMap, currentSemNum) {
  const source = pool === 'PE' ? allProgramElectives : pool === 'IE' ? allInstituteElectives : allSeedCourses;
  return source
    .map((name, idx) => ({ originalIdx: idx, name }))
    .filter((item) => {
      const claimedBy = claimedMap[item.originalIdx];
      return claimedBy === undefined || claimedBy === currentSemNum;
    });
}

function calculateTotalCredits(currentSem, selectedCourses) {
  if (!currentSem || !semSequence[currentSem]) return 0;
  let total = 0;
  semSequence[currentSem].forEach((s) => {
    const sd = futureSemesters[s];
    const semSelection = selectedCourses[s] || { core: {}, PE: {}, IE: {}, SEED: {} };
    Object.keys(semSelection.core).forEach((idx) => {
      total += sd.courses[parseInt(idx, 10)]?.credits || 0;
    });
    total += Object.keys(semSelection.PE).length * 3;
    total += Object.keys(semSelection.IE).length * 3;
    total += Object.keys(semSelection.SEED).length * 2;
  });
  return total;
}

function validateSelections(currentSem, selectedCourses) {
  const errors = [];
  if (!currentSem || !semSequence[currentSem]) return errors;

  semSequence[currentSem].forEach((s) => {
    const sd = futureSemesters[s];
    const limits = sd.limits;
    const label = sd.label;
    const semSelection = selectedCourses[s] || { core: {}, PE: {}, IE: {}, SEED: {} };

    Object.keys(semSelection.core).forEach((idx) => {
      const c = sd.courses[parseInt(idx, 10)];
      if (c && c.warning) {
        errors.push(`${label}: "${c.name}" — ${c.warning}`);
      }
    });

    if (limits) {
      const peCount = Object.keys(semSelection.PE).length;
      const ieCount = Object.keys(semSelection.IE).length;
      const seedCount = Object.keys(semSelection.SEED).length;

      if (peCount !== limits.PE) errors.push(`${label}: Need exactly ${limits.PE} PE, got ${peCount}.`);
      if (limits.IE > 0 && ieCount !== limits.IE) errors.push(`${label}: Need exactly ${limits.IE} IE, got ${ieCount}.`);
      if (seedCount !== limits.SEED) errors.push(`${label}: Need exactly ${limits.SEED} SEED, got ${seedCount}.`);
    }
  });

  return errors;
}

function generatePdfDocument(currentSem, selectedCourses, activeStudentName) {
  const studentProfile = window.getCurrentStudentProfile ? window.getCurrentStudentProfile() : null;
  const studentName = studentProfile?.user?.Full_Name || 'S2024002';
  const seqs = semSequence[currentSem] || [];

  let allCardsHtml = '';
  seqs.forEach((s) => {
    const sd = futureSemesters[s];
    const semSelection = selectedCourses[s] || { core: {}, PE: {}, IE: {}, SEED: {} };
    let rows = '';
    let totalCr = 0;

    Object.keys(semSelection.core).forEach((idx) => {
      const c = sd.courses[parseInt(idx, 10)];
      rows += `<div class="row"><div class="bar"></div><span class="rname">${c.name} <span class="tag tag-core">Core</span></span><span class="rcr">${c.credits} CR</span></div>`;
      totalCr += c.credits;
    });
    Object.keys(semSelection.PE).forEach((idx) => {
      rows += `<div class="row"><div class="bar"></div><span class="rname">${allProgramElectives[parseInt(idx, 10)]} <span class="tag tag-pe">PE</span></span><span class="rcr">3 CR</span></div>`;
      totalCr += 3;
    });
    Object.keys(semSelection.IE).forEach((idx) => {
      rows += `<div class="row"><div class="bar"></div><span class="rname">${allInstituteElectives[parseInt(idx, 10)]} <span class="tag tag-ie">IE</span></span><span class="rcr">3 CR</span></div>`;
      totalCr += 3;
    });
    Object.keys(semSelection.SEED).forEach((idx) => {
      rows += `<div class="row"><div class="bar"></div><span class="rname">${allSeedCourses[parseInt(idx, 10)]} <span class="tag tag-seed">SEED</span></span><span class="rcr">2 CR</span></div>`;
      totalCr += 2;
    });

    allCardsHtml += `<div class="card"><div class="card-header"><div class="card-title">${sd.label}</div><div class="card-date">${sd.date}</div></div><div class="card-body">${rows || '<div style="color:#94a3b8;font-size:12px;padding:8px 0;">No courses selected.</div>'}</div><div class="card-footer"><span class="fl">TOTAL CREDITS</span><span class="fc">${totalCr} Credits</span></div></div>`;
  });

  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html><html><head><title>Academic Roadmap – Lumina</title><style>
    body{font-family:Arial,sans-serif;background:#f4f6f9;padding:32px;color:#1a2744;}
    h1{font-size:22px;font-weight:700;margin:0 0 4px 0;}
    p{font-size:13px;color:#64748b;margin:0 0 24px 0;}
    .cards{display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start;}
    .card{background:white;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;width:210px;display:flex;flex-direction:column;}
    .card-header{padding:14px 16px;background:#f4f6f9;}
    .card-title{font-size:15px;font-weight:700;color:#1a2744;}
    .card-date{font-size:11px;color:#94a3b8;margin-top:3px;}
    .card-body{padding:8px 14px;flex:1;}
    .row{display:flex;align-items:center;padding:7px 0;border-bottom:1px solid #f1f5f9;}
    .row:last-child{border-bottom:none;}
    .bar{width:3px;height:20px;border-radius:3px;background:#3b82f6;margin-right:8px;flex-shrink:0;}
    .rname{font-size:11px;font-weight:500;flex:1;}
    .tag{font-size:9px;font-weight:700;padding:1px 5px;border-radius:4px;margin-left:4px;}
    .tag-pe{background:#d1fae5;color:#065f46;}
    .tag-ie{background:#fef3c7;color:#92400e;}
    .tag-seed{background:#ede9fe;color:#5b21b6;}
    .tag-core{background:#dbeafe;color:#1e40af;}
    .rcr{font-size:11px;font-weight:700;color:#94a3b8;margin-left:6px;}
    .card-footer{padding:10px 14px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;}
    .fl{font-size:9px;font-weight:700;color:#94a3b8;}
    .fc{font-size:15px;font-weight:700;color:#1a2744;}
    </style></head><body><h1>Academic Roadmap</h1><p>Personalized semester-wise plan — ${studentName}</p><div class="cards">${allCardsHtml}</div><script>window.onload=function(){window.print();}</script></body></html>
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
        <span className={`hc-credits ${semesterNum === 3 ? 'teal' : ''}`}>
          ⊕ {data.totalCredits} Credits
        </span>
        <button
          className={`hc-view-btn ${semesterNum === 3 ? 'dark' : ''}`}
          onClick={() => onOpenModal(semesterNum)}
        >
          View
        </button>
      </div>
    </div>
  );
}

function AcademicHistorySection({ historyData, onOpenModal }) {
  return (
    <section className="section-block">
      <div className="section-heading">
        <span className="section-icon">🗓</span>
        <h2>Academic History</h2>
      </div>
      <div className="history-row">
        {[1, 2, 3].map((num) => (
          historyData[num] && (
            <HistoryCard
              key={num}
              semesterNum={num}
              data={historyData[num]}
              onOpenModal={onOpenModal}
            />
          )
        ))}
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
              <span className="spr-name">{course.name}</span>
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
  const typeColors = { core: 'badge-core', PE: 'badge-pe', IE: 'badge-ie', SEED: 'badge-seed' };
  const typeLabels = { core: 'Core', PE: 'PE', IE: 'IE', SEED: 'SEED' };

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
      <div className="cc-prereq">Prerequisites: {prereq}</div>
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
            {showWarning && <span> &nbsp;⚠ Only {available} left in pool</span>}
          </>
        )}
      </span>
    </div>
  );
}

function RoadmapCard({ label, date, courses, totalCredits }) {
  const typeLabels = { core: 'Core', PE: 'PE', IE: 'IE', SEED: 'SEED' };
  const typeColors = { core: 'badge-core', PE: 'badge-pe', IE: 'badge-ie', SEED: 'badge-seed' };

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
   4. MAIN ROOT COMPONENT
   ========================================================================== */
export default function AcademicRoadmap({ studentUser }) {
  const [semHistory, setSemHistory] = useState(fallbackSemHistory);
  const [currentSem, setCurrentSem] = useState(null);
  const [activePlanSem, setActivePlanSem] = useState(null);
  const [view, setView] = useState('plan');

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

  // Sync with API fallback
  useEffect(() => {
    async function loadHistory() {
      try {
        const session = localStorage.getItem('Lumina_Session');
        const user = session ? JSON.parse(session) : null;
        const headers = { 'x-role': user ? user.Role : 'Student' };
        const studentId = user ? user.User_ID : 'S2024002';

        const [regRes, catRes] = await Promise.all([
          fetch('http://localhost:3000/registrations', { headers }).catch(() => null),
          fetch('http://localhost:3000/courses', { headers }).catch(() => null),
        ]);

        if (regRes?.ok && catRes?.ok) {
          const registrations = await regRes.json();
          const catalog = await catRes.json();

          const sem3Regs = registrations.filter(
            (r) => r.studentId === studentId || r.Student_ID === studentId
          );

          if (sem3Regs.length > 0) {
            const sem3Courses = sem3Regs.map((r) => {
              const cId = r.courseId || r.Course_ID;
              const found = catalog.find((c) => c.courseId === cId || c.Course_ID === cId) || {};
              return {
                name: found.courseName || found.Course_Name || cId,
                credits: found.credits || 4,
              };
            });

            const sem3Credits = sem3Courses.reduce((sum, c) => sum + c.credits, 0);

            setSemHistory((prev) => ({
              ...prev,
              3: {
                ...prev[3],
                courses: sem3Courses,
                totalCredits: sem3Credits,
              },
            }));
          }
        }
      } catch (e) {
        console.warn('API fallback in use:', e);
      }
    }
    loadHistory();
  }, []);

  const handleSelectSem = (val) => {
    if (!val) {
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
      futureSemesters[s].courses.forEach((_, idx) => {
        resetSelected[s].core[idx] = true;
      });
    });

    setSelectedCourses(resetSelected);
    setClaimed({ PE: {}, IE: {}, SEED: {} });
    setCurrentSem(val);
    setActivePlanSem(semSequence[val][0]);
    setValidationErrors([]);
  };

  const handleToggleCore = (semNum, idx) => {
    setSelectedCourses((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      if (next[semNum].core[idx]) {
        delete next[semNum].core[idx];
      } else {
        next[semNum].core[idx] = true;
      }
      return next;
    });
    setValidationErrors([]);
  };

  const handleToggleElective = (semNum, pool, originalIdx, limit) => {
    const isSelected = !!selectedCourses[semNum][pool][originalIdx];

    if (isSelected) {
      setSelectedCourses((prev) => {
        const next = JSON.parse(JSON.stringify(prev));
        delete next[semNum][pool][originalIdx];
        return next;
      });
      setClaimed((prev) => {
        const next = { ...prev, [pool]: { ...prev[pool] } };
        delete next[pool][originalIdx];
        return next;
      });
    } else {
      const count = Object.keys(selectedCourses[semNum][pool]).length;
      if (count >= limit) {
        setBlockedCard(`${pool}-${originalIdx}`);
        setPoolLimitError(pool);
        setTimeout(() => setBlockedCard(null), 600);
        setTimeout(() => setPoolLimitError(null), 3000);
        return;
      }

      setSelectedCourses((prev) => {
        const next = JSON.parse(JSON.stringify(prev));
        next[semNum][pool][originalIdx] = true;
        return next;
      });
      setClaimed((prev) => ({
        ...prev,
        [pool]: { ...prev[pool], [originalIdx]: semNum },
      }));
    }
    setValidationErrors([]);
  };

  const handleGenerate = () => {
    const errors = validateSelections(currentSem, selectedCourses);
    if (errors.length > 0) {
      setValidationErrors(errors);
      const firstFail = semSequence[currentSem].find((s) => {
        const sd = futureSemesters[s];
        const semSel = selectedCourses[s];
        const hasCoreWarn = Object.keys(semSel.core).some(
          (idx) => !!sd.courses[parseInt(idx, 10)].warning
        );
        if (hasCoreWarn) return true;
        if (!sd.limits) return false;
        if (Object.keys(semSel.PE).length !== sd.limits.PE) return true;
        if (sd.limits.IE > 0 && Object.keys(semSel.IE).length !== sd.limits.IE) return true;
        return Object.keys(semSel.SEED).length !== sd.limits.SEED;
      });
      if (firstFail) setActivePlanSem(firstFail);
      return;
    }

    setValidationErrors([]);
    setView('roadmap');
  };

  const generatedCards = useMemo(() => {
    if (!currentSem || !semSequence[currentSem]) return [];
    return semSequence[currentSem].map((s) => {
      const sd = futureSemesters[s];
      const semSel = selectedCourses[s];
      const courses = [];
      let totalCr = 0;

      Object.keys(semSel.core).forEach((idx) => {
        const c = sd.courses[parseInt(idx, 10)];
        courses.push({ name: c.name, credits: c.credits, type: 'core' });
        totalCr += c.credits;
      });
      Object.keys(semSel.PE).forEach((idx) => {
        courses.push({ name: allProgramElectives[parseInt(idx, 10)], credits: 3, type: 'PE' });
        totalCr += 3;
      });
      Object.keys(semSel.IE).forEach((idx) => {
        courses.push({ name: allInstituteElectives[parseInt(idx, 10)], credits: 3, type: 'IE' });
        totalCr += 3;
      });
      Object.keys(semSel.SEED).forEach((idx) => {
        courses.push({ name: allSeedCourses[parseInt(idx, 10)], credits: 2, type: 'SEED' });
        totalCr += 2;
      });

      return {
        label: sd.label,
        date: sd.date,
        courses,
        totalCredits: totalCr,
      };
    });
  }, [currentSem, selectedCourses]);

  const handleDownload = () => {
    generatePdfDocument(currentSem, selectedCourses, studentUser?.Full_Name || studentUser?.Name);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  const totalCredits = useMemo(
    () => calculateTotalCredits(currentSem, selectedCourses),
    [currentSem, selectedCourses]
  );

  const activeSemData = activePlanSem ? futureSemesters[activePlanSem] : null;
  const activeLimits = activeSemData?.limits;
  const currentSelections = activePlanSem ? (selectedCourses[activePlanSem] || { core: {}, PE: {}, IE: {}, SEED: {} }) : null;

  const peAvail = activeLimits?.PE ? getAvailablePool('PE', claimed.PE, activePlanSem) : [];
  const ieAvail = activeLimits?.IE ? getAvailablePool('IE', claimed.IE, activePlanSem) : [];
  const seedAvail = activeLimits?.SEED ? getAvailablePool('SEED', claimed.SEED, activePlanSem) : [];

  return (
    <div className="roadmap-app-root">
      {view === 'plan' ? (
        <div className="main-content">
          <div className="page-title">
            <h1>Academic Roadmap Generation</h1>
            <p>Plan your future semesters and generate a personalized academic roadmap.</p>
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
                    <option value="">— Select Semester —</option>
                    <option value="5">Semester 5</option>
                    <option value="6">Semester 6</option>
                    <option value="7">Semester 7</option>
                    <option value="8">Semester 8</option>
                  </select>
                  <span className="sel-arrow">▾</span>
                </div>
              </div>
              {!currentSem && (
                <div className="plan-hint">
                  Select a semester to view available courses and prerequisites.
                </div>
              )}
            </div>
          </section>

          {/* Courses Section */}
          {currentSem && (
            <section className="section-block">
              <div className="section-heading">
                <span className="section-icon">📋</span>
                <h2>Courses Offered ({activeSemData.label})</h2>
              </div>

              {semSequence[currentSem].length > 1 && (
                <div className="sem-tabs">
                  {semSequence[currentSem].map((s) => (
                    <button
                      key={s}
                      className={`sem-tab ${s === activePlanSem ? 'active-tab' : ''}`}
                      onClick={() => setActivePlanSem(s)}
                    >
                      {futureSemesters[s].label}
                    </button>
                  ))}
                </div>
              )}

              <div className="courses-grid">
                {activeSemData.courses.length > 0 && (
                  <>
                    <CourseSectionHeader title="Program Core" pool={null} />
                    {activeSemData.courses.map((c, idx) => (
                      <CourseCard
                        key={`core-${idx}`}
                        name={c.name}
                        credits={c.credits}
                        prereq={c.prereq}
                        type="core"
                        isSelected={!!currentSelections.core[idx]}
                        warning={c.warning}
                        onToggle={() => handleToggleCore(activePlanSem, idx)}
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
                      selected={Object.keys(currentSelections.PE).length}
                      available={peAvail.length}
                      error={poolLimitError === 'PE'}
                    />
                    {peAvail.map((item) => (
                      <CourseCard
                        key={`pe-${item.originalIdx}`}
                        name={item.name}
                        credits={3}
                        prereq="None"
                        type="PE"
                        isSelected={!!currentSelections.PE[item.originalIdx]}
                        isBlocked={blockedCard === `PE-${item.originalIdx}`}
                        onToggle={() => handleToggleElective(activePlanSem, 'PE', item.originalIdx, activeLimits.PE)}
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
                      selected={Object.keys(currentSelections.IE).length}
                      available={ieAvail.length}
                      error={poolLimitError === 'IE'}
                    />
                    {ieAvail.map((item) => (
                      <CourseCard
                        key={`ie-${item.originalIdx}`}
                        name={item.name}
                        credits={3}
                        prereq="None"
                        type="IE"
                        isSelected={!!currentSelections.IE[item.originalIdx]}
                        isBlocked={blockedCard === `IE-${item.originalIdx}`}
                        onToggle={() => handleToggleElective(activePlanSem, 'IE', item.originalIdx, activeLimits.IE)}
                      />
                    ))}
                    {ieAvail.length === 0 && (
                      <div className="empty-pool-note">
                        All institute electives have been selected in other semesters.
                      </div>
                    )}
                  </>
                )}

                {activeLimits && activeLimits.SEED > 0 && (
                  <>
                    <CourseSectionHeader
                      title="SEED Courses"
                      pool="SEED"
                      limit={activeLimits.SEED}
                      selected={Object.keys(currentSelections.SEED).length}
                      available={seedAvail.length}
                      error={poolLimitError === 'SEED'}
                    />
                    {seedAvail.map((item) => (
                      <CourseCard
                        key={`seed-${item.originalIdx}`}
                        name={item.name}
                        credits={2}
                        prereq="None"
                        type="SEED"
                        isSelected={!!currentSelections.SEED[item.originalIdx]}
                        isBlocked={blockedCard === `SEED-${item.originalIdx}`}
                        onToggle={() => handleToggleElective(activePlanSem, 'SEED', item.originalIdx, activeLimits.SEED)}
                      />
                    ))}
                    {seedAvail.length === 0 && (
                      <div className="empty-pool-note">
                        All SEED courses have been selected in other semesters.
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