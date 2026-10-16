import { allProgramElectives, allInstituteElectives, allSeedCourses, futureSemesters, semSequence } from '../data/roadmapData';

export function getAvailablePool(pool, claimedMap, currentSemNum) {
  const source = pool === 'PE' ? allProgramElectives : pool === 'IE' ? allInstituteElectives : allSeedCourses;
  return source
    .map((name, idx) => ({ originalIdx: idx, name }))
    .filter((item) => {
      const claimedBy = claimedMap[item.originalIdx];
      return claimedBy === undefined || claimedBy === currentSemNum;
    });
}

export function calculateTotalCredits(currentSem, selectedCourses) {
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

export function validateSelections(currentSem, selectedCourses) {
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

export function generatePdfDocument(currentSem, selectedCourses) {
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
