/**
 * Timetable — Deal1 Page 4
 * Refactored to use shared AD1PageLayout and shared CSS tokens.
 */
import { useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import AD1PageLayout from './components/AD1PageLayout';
import Modal from './components/Modal';
import useAD1Data from './hooks/useAD1Data';
import { slotsService } from '../../services/slots.service';
import {
  TIME_SLOTS, DAYS, getSemesterFromTerm, normalizeSectionValue, getCardColorClass,
} from './utils/dataTransforms';
import { validateSlot } from './utils/validation';
import shared from './styles/ad1-shared.module.css';
import styles from './Timetable.module.css';

export default function Timetable() {
  const { data, loading, error, setData } = useAD1Data();

  // ─── Filters ───────────────────────────────────────────────
  const [filterTerm, setFilterTerm] = useState('Spring 2026');
  const [filterUG, setFilterUG] = useState('UG1');
  const [filterType, setFilterType] = useState('Institute Core');
  const [filterDept, setFilterDept] = useState('All Departments');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterSection, setFilterSection] = useState('');

  const [editMode, setEditMode] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // ─── Side Panel ────────────────────────────────────────────
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelDay, setPanelDay] = useState('');
  const [panelSlot, setPanelSlot] = useState('');
  const [editingAlloc, setEditingAlloc] = useState(null);
  const [panelCourse, setPanelCourse] = useState('');
  const [panelSection, setPanelSection] = useState('Section 1');
  const [panelFaculty, setPanelFaculty] = useState('');
  const [panelRoom, setPanelRoom] = useState('');

  const deptDisabled = filterType === 'Institute Core' || filterType === 'Seed Course';

  // ─── Matching courses ──────────────────────────────────────
  const matchingCourses = useMemo(() => {
    if (!data) return [];
    const semester = getSemesterFromTerm(filterTerm);
    let result = data.courses.filter(
      (c) => c.status === 'Active' && c.ugYear === filterUG && c.semester === semester && c.type === filterType
    );
    if (filterType === 'Program Core') result = result.filter((c) => c.dept === filterDept);
    else if (filterType === 'Elective') result = result.filter((c) => c.dept.includes(filterDept));
    return result;
  }, [data, filterTerm, filterUG, filterType, filterDept]);

  const handleTypeChange = useCallback((t) => {
    setFilterType(t);
    setFilterDept(t === 'Institute Core' || t === 'Seed Course' ? 'All Departments' : 'CSE');
    setFilterCourse(''); setFilterSection('');
  }, []);

  const sectionFilterHidden = filterType === 'Elective';

  const sectionOptions = useMemo(() => {
    const scoped = filterCourse ? matchingCourses.filter((c) => c.code === filterCourse) : matchingCourses;
    let maxSec = 0;
    scoped.forEach((c) => { const s = parseInt(c.sections, 10) || 1; if (s > maxSec) maxSec = s; });
    if (maxSec === 0) maxSec = 1;
    const opts = [{ value: '', label: 'All Sections' }];
    for (let i = 1; i <= maxSec; i++) opts.push({ value: `Section ${i}`, label: `Section ${i}` });
    return opts;
  }, [matchingCourses, filterCourse]);

  // ─── Filtered allocations ──────────────────────────────────
  const filteredAllocations = useMemo(() => {
    if (!data) return [];
    const semester = getSemesterFromTerm(filterTerm);
    return data.timetable.filter((alloc) => {
      const course = data.courses.find((c) => c.code === alloc.courseCode);
      if (!course || course.ugYear !== filterUG || course.semester !== semester || course.type !== filterType) return false;
      if (filterType === 'Program Core' && course.dept !== filterDept) return false;
      if (filterType === 'Elective' && !course.dept.includes(filterDept)) return false;
      if (filterCourse && alloc.courseCode !== filterCourse) return false;
      if (filterSection && normalizeSectionValue(alloc.section) !== filterSection) return false;
      return true;
    });
  }, [data, filterTerm, filterUG, filterType, filterDept, filterCourse, filterSection]);

  const allocMap = useMemo(() => {
    const map = {};
    filteredAllocations.forEach((a) => { const k = `${a.day}|${a.timeSlot}`; if (!map[k]) map[k] = []; map[k].push(a); });
    return map;
  }, [filteredAllocations]);

  // ─── Side Panel Logic ──────────────────────────────────────
  const closeSidePanel = useCallback(() => { setPanelOpen(false); setEditingAlloc(null); }, []);
  const toggleEditMode = () => setEditMode((prev) => { if (prev) closeSidePanel(); return !prev; });

  const openSidePanel = useCallback((day, slot, alloc = null) => {
    if (!editMode || !data) return;
    setPanelDay(day); setPanelSlot(slot); setEditingAlloc(alloc);
    const coursesForPanel = filterCourse ? matchingCourses.filter((c) => c.code === filterCourse) : matchingCourses;
    if (alloc) {
      setPanelCourse(alloc.courseCode);
      let secVal = alloc.section; if (secVal && !secVal.startsWith('Section')) secVal = `Section ${secVal}`;
      setPanelSection(secVal || 'Section 1'); setPanelFaculty(alloc.professor); setPanelRoom(alloc.room);
    } else {
      setPanelCourse(filterCourse || (coursesForPanel.length > 0 ? coursesForPanel[0].code : ''));
      setPanelSection(filterSection || 'Section 1'); setPanelFaculty(''); setPanelRoom('');
    }
    setPanelOpen(true);
  }, [editMode, data, matchingCourses, filterCourse, filterSection]);

  const panelValidation = useMemo(() => {
    if (!data) return { facultyOk: false, roomOk: false, facultyMsg: '', roomMsg: '' };
    return validateSlot({ day: panelDay, timeSlot: panelSlot, professor: panelFaculty, room: panelRoom, editingAlloc }, data.timetable);
  }, [data, panelDay, panelSlot, panelFaculty, panelRoom, editingAlloc]);

  const canUpdate = panelCourse && panelFaculty && panelRoom && panelValidation.facultyOk && panelValidation.roomOk;

  const panelSectionOptions = useMemo(() => {
    if (!data || !panelCourse) return [];
    const course = data.courses.find((c) => c.code === panelCourse);
    const maxSec = course ? parseInt(course.sections, 10) || 1 : 1;
    return Array.from({ length: maxSec }, (_, i) => `Section ${i + 1}`);
  }, [data, panelCourse]);

  const panelCourseOptions = useMemo(() => {
    if (!data) return [];
    return filterCourse ? matchingCourses.filter((c) => c.code === filterCourse) : matchingCourses;
  }, [matchingCourses, filterCourse, data]);

  // ─── CRUD ──────────────────────────────────────────────────
  const handleUpdateSlot = async () => {
    if (!data || !canUpdate) return;
    const newAlloc = { day: panelDay, timeSlot: panelSlot, courseCode: panelCourse, room: panelRoom, professor: panelFaculty, section: panelSection };
    try {
      if (editingAlloc) {
        await slotsService.update(editingAlloc.id, { roomNumber: newAlloc.room, dayOfWeek: newAlloc.day, startTime: newAlloc.timeSlot.split('-')[0], endTime: newAlloc.timeSlot.split('-')[1] });
        setData((prev) => ({ ...prev, timetable: prev.timetable.map((a) => a.id === editingAlloc.id ? { ...a, ...newAlloc, id: editingAlloc.id } : a) }));
        toast.success('Slot updated successfully');
      } else {
        const faculty = data.faculty.find((f) => f.name === panelFaculty);
        const res = await slotsService.create({ sectionId: `${panelCourse}-S1`, facultyId: faculty?.id || 'F2024001', roomNumber: newAlloc.room, dayOfWeek: newAlloc.day, startTime: newAlloc.timeSlot.split('-')[0], endTime: newAlloc.timeSlot.split('-')[1], syllabus: null });
        setData((prev) => ({ ...prev, timetable: [...prev.timetable, { ...newAlloc, id: res?.slotId || Date.now() }] }));
        toast.success('Slot allocated successfully');
      }
    } catch (err) { toast.error('Failed to save slot: ' + (err.response?.data?.message || err.message)); }
    closeSidePanel();
  };

  const handleRemoveAllocation = () => {
    if (!editingAlloc || !data) return;
    setDeleteConfirmOpen(true);
  };

  const handleConfirmRemove = async () => {
    setDeleteConfirmOpen(false);
    if (!editingAlloc || !data) return;
    try {
      await slotsService.delete(editingAlloc.id);
      setData((prev) => ({ ...prev, timetable: prev.timetable.filter((a) => a.id !== editingAlloc.id) }));
      toast.success('Slot removed');
    } catch (err) { toast.error('Failed: ' + (err.response?.data?.message || err.message)); }
    closeSidePanel();
  };

  return (
    <AD1PageLayout loading={loading} error={error} loadingMessage="Loading Timetable...">
      {/* Header */}
      <div className={styles.ttHeader}>
        <h1 className={styles.ttHeaderTitle}>Allocate Course Slots</h1>
        <button className={`${styles.btnEditMode} ${editMode ? styles.editModeActive : ''}`} onClick={toggleEditMode}>
          ✏️ {editMode ? 'Deactivate Edit Mode' : 'Activate Edit Mode'}
        </button>
      </div>

      {/* Filters */}
      <div className={styles.ttFilters}>
        <div className={styles.ttFilterGroup}>
          <label className={styles.ttFilterLabel}>Term</label>
          <select className={shared.selectField} value={filterTerm} onChange={(e) => setFilterTerm(e.target.value)}>
            <option value="Monsoon 2025">Monsoon 2025</option><option value="Spring 2026">Spring 2026</option>
          </select>
        </div>
        <div className={styles.ttFilterGroup}>
          <label className={styles.ttFilterLabel}>UG Year</label>
          <div className={styles.toggleGroup}>
            {['UG1', 'UG2', 'UG3', 'UG4'].map((ug) => (
              <button key={ug} className={`${styles.toggleBtn} ${filterUG === ug ? styles.toggleBtnActive : ''}`}
                onClick={() => { setFilterUG(ug); setFilterCourse(''); setFilterSection(''); }}>{ug}</button>
            ))}
          </div>
        </div>
        <div className={styles.ttFilterGroup}>
          <label className={styles.ttFilterLabel}>Course Type</label>
          <select className={shared.selectField} value={filterType} onChange={(e) => handleTypeChange(e.target.value)}>
            <option value="Institute Core">Institute Core</option><option value="Program Core">Program Core</option>
            <option value="Elective">Elective</option><option value="Seed Course">Seed Course</option>
          </select>
        </div>
        <div className={styles.ttFilterGroup}>
          <label className={styles.ttFilterLabel}>Department</label>
          <select className={shared.selectField} value={filterDept} disabled={deptDisabled} onChange={(e) => { setFilterDept(e.target.value); setFilterCourse(''); setFilterSection(''); }}>
            {deptDisabled ? <option value="All Departments">All Departments</option> : (
              <><option value="CSE">CSE</option><option value="ECE">ECE</option><option value="AIDS">AIDS</option></>
            )}
          </select>
        </div>
        <div className={styles.ttFilterGroup}>
          <label className={styles.ttFilterLabel}>Course</label>
          <select className={shared.selectField} value={filterCourse} onChange={(e) => { setFilterCourse(e.target.value); setFilterSection(''); }}>
            <option value="">All Courses</option>
            {matchingCourses.map((c) => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
          </select>
        </div>
        {!sectionFilterHidden && (
          <div className={styles.ttFilterGroup}>
            <label className={styles.ttFilterLabel}>Section</label>
            <select className={shared.selectField} value={filterSection} onChange={(e) => setFilterSection(e.target.value)}>
              {sectionOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className={styles.ttGridWrapper}>
        <table className={styles.ttGrid}>
          <thead>
            <tr>
              <th className={styles.ttGridTimeHeader}>Time</th>
              {DAYS.map((day) => <th key={day}>{day}</th>)}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((ts) => {
              if (ts.type === 'short_break') return (
                <tr key={ts.key} className={styles.ttBreakRow}>
                  <td className={styles.ttGridTimeCell}>{ts.label}</td>
                  <td colSpan="5"><div className={styles.ttBreakLabel}>S H O R T &nbsp; B R E A K</div></td>
                </tr>
              );
              if (ts.type === 'lunch_break') return (
                <tr key={ts.key} className={`${styles.ttBreakRow} ${styles.ttBreakRowLunch}`}>
                  <td className={styles.ttGridTimeCell}><b>{ts.label}</b></td>
                  <td colSpan="5"><div className={styles.ttBreakLabel}>🍽 L U N C H &nbsp; B R E A K</div></td>
                </tr>
              );
              return (
                <tr key={ts.key}>
                  <td className={styles.ttGridTimeCell}>{ts.label}</td>
                  {DAYS.map((day) => {
                    const cells = allocMap[`${day}|${ts.key}`] || [];
                    return (
                      <td key={day} className={editMode ? styles.ttSlotEditable : ''} onClick={editMode ? () => openSidePanel(day, ts.key) : undefined}>
                        {cells.map((alloc) => {
                          const colorCls = data ? styles[getCardColorClass(alloc.courseCode, data.courses)] : '';
                          const course = data?.courses.find((c) => c.code === alloc.courseCode);
                          return (
                            <div key={alloc.id || `${alloc.courseCode}-${alloc.room}`}
                              className={`${styles.slotCard} ${colorCls} ${editMode ? styles.slotCardClickable : ''}`}
                              onClick={editMode ? (e) => { e.stopPropagation(); openSidePanel(day, ts.key, alloc); } : undefined}>
                              <div className={styles.slotCardHeader}>
                                <span className={styles.slotCardCode}>{alloc.courseCode}</span>
                                <span className={styles.slotCardRoom}>{alloc.room}</span>
                              </div>
                              <div className={styles.slotCardName}>{course?.name || ''}</div>
                              <div className={styles.slotCardProf}>{alloc.professor}</div>
                            </div>
                          );
                        })}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Side Panel Overlay */}
      {panelOpen && <div className={styles.sidePanelOverlay} onClick={closeSidePanel} />}

      {/* Side Panel */}
      <div className={`${styles.sidePanel} ${panelOpen ? styles.sidePanelOpen : ''}`}>
        <div className={styles.sidePanelHeader}>
          <div>
            <h3 className={styles.sidePanelTitle}>{editingAlloc ? 'Edit Slot Allocation' : 'Allocate Course Slot'}</h3>
            <p className={styles.sidePanelSubtitle}>{panelDay} | {TIME_SLOTS.find((t) => t.key === panelSlot)?.label || panelSlot}</p>
          </div>
          <button className={styles.sidePanelClose} onClick={closeSidePanel}>&times;</button>
        </div>
        <div className={styles.sidePanelBody}>
          <div className={styles.formGroup}><label className={shared.formLabel}>Course</label>
            <select className={shared.selectField} value={panelCourse} onChange={(e) => setPanelCourse(e.target.value)}>
              {panelCourseOptions.map((c) => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
            </select>
          </div>
          <div className={styles.formGroup}><label className={shared.formLabel}>Section</label>
            <select className={shared.selectField} value={panelSection} onChange={(e) => setPanelSection(e.target.value)}>
              {panelSectionOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className={styles.formGroup}><label className={shared.formLabel}>Faculty</label>
            <select className={shared.selectField} value={panelFaculty} onChange={(e) => setPanelFaculty(e.target.value)}>
              <option value="">Select Faculty</option>
              {data?.faculty.map((f) => {
                const { facultyOk } = validateSlot({ day: panelDay, timeSlot: panelSlot, professor: f.name, room: '', editingAlloc }, data.timetable);
                return <option key={f.id} value={f.name}>{f.name} ({f.dept}){!facultyOk ? ' [Conflict]' : ''}</option>;
              })}
            </select>
          </div>
          <div className={styles.formGroup}><label className={shared.formLabel}>Room</label>
            <select className={shared.selectField} value={panelRoom} onChange={(e) => setPanelRoom(e.target.value)}>
              <option value="">Select Room</option>
              {data?.rooms.map((r) => {
                const { roomOk } = validateSlot({ day: panelDay, timeSlot: panelSlot, professor: '', room: r.name, editingAlloc }, data.timetable);
                return <option key={r.name} value={r.name}>{r.name} (Cap: {r.capacity}){!roomOk ? ' [Booked]' : ''}</option>;
              })}
            </select>
          </div>
          <div className={styles.validationFeed}>
            <div className={`${styles.validationItem} ${panelFaculty ? (panelValidation.facultyOk ? styles.validationOk : styles.validationError) : ''}`}>
              <span className={styles.validationIcon}>{!panelFaculty ? '—' : panelValidation.facultyOk ? '✓' : '✗'}</span>
              <span>{panelValidation.facultyMsg}</span>
            </div>
            <div className={`${styles.validationItem} ${panelRoom ? (panelValidation.roomOk ? styles.validationOk : styles.validationError) : ''}`}>
              <span className={styles.validationIcon}>{!panelRoom ? '—' : panelValidation.roomOk ? '✓' : '✗'}</span>
              <span>{panelValidation.roomMsg}</span>
            </div>
          </div>
        </div>
        <div className={styles.sidePanelFooter}>
          <button className={shared.btnPrimary} style={{ width: '100%' }} disabled={!canUpdate} onClick={handleUpdateSlot}>
            {editingAlloc ? 'Update Slot' : 'Allocate Slot'}
          </button>
          <div className={styles.sidePanelLinks}>
            <button className={styles.sidePanelLink} onClick={closeSidePanel}>Cancel</button>
            {editingAlloc && <button className={`${styles.sidePanelLink} ${styles.sidePanelLinkDanger}`} onClick={handleRemoveAllocation}>Remove Allocation</button>}
          </div>
        </div>
      </div>

      {/* ── Remove Slot Confirmation Modal (replaces browser window.confirm with zero localhost popups) ── */}
      <Modal open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Remove Course Slot" maxWidth="450px">
        <Modal.Body>
          <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-main, #0f172a)', lineHeight: 1.5 }}>
            Are you sure you want to remove the allocated slot for <strong>{editingAlloc?.courseCode}</strong> on {editingAlloc?.day} ({editingAlloc?.timeSlot}) in Room {editingAlloc?.room}?
          </p>
        </Modal.Body>
        <Modal.Footer>
          <button className={shared.btnSecondary} onClick={() => setDeleteConfirmOpen(false)}>Cancel</button>
          <button className={shared.btnDanger} onClick={handleConfirmRemove}>Remove Slot</button>
        </Modal.Footer>
      </Modal>
    </AD1PageLayout>
  );
}
