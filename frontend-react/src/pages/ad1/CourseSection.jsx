/**
 * CourseSection — Deal1 Page 3
 * Refactored to use shared AD1PageLayout, StatCard, Modal, FormGroup, DataTable.
 */
import { useState, useMemo, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import AD1PageLayout from './components/AD1PageLayout';
import StatCard, { StatCardsRow } from './components/StatCard';
import Modal from './components/Modal';
import DataTable from './components/DataTable';
import useAD1Data from './hooks/useAD1Data';
import { registrationsService } from '../../services/registrations.service';
import { normalizeSectionValue, formatSectionLabel, getSemesterFromTerm, MAX_SECTION_CAPACITY } from './utils/dataTransforms';
import shared from './styles/ad1-shared.module.css';
import styles from './CourseSection.module.css';

export default function CourseSection() {
  const { data, loading, error, setData, refetch } = useAD1Data();
  const [saving, setSaving] = useState(false);

  // ─── Filters ───────────────────────────────────────────────
  const [filterTerm, setFilterTerm] = useState('Spring 2026');
  const [filterUG, setFilterUG] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [searchStudent, setSearchStudent] = useState('');

  // ─── Modals ────────────────────────────────────────────────
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [modalNewSection, setModalNewSection] = useState('');
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [configNewSections, setConfigNewSections] = useState(1);
  const [configWarning, setConfigWarning] = useState('');
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [lastSaved, setLastSaved] = useState('');

  const deptDisabled = filterType === 'Institute Core' || filterType === 'Seed Course';
  useEffect(() => { if (deptDisabled) setFilterDept('All Departments'); }, [deptDisabled]);

  // ─── Course options ────────────────────────────────────────
  const courseOptions = useMemo(() => {
    if (!data) return [];
    const semester = getSemesterFromTerm(filterTerm);
    const readyToFetch = filterType === 'Institute Core' ? filterUG : (filterUG && filterDept && filterDept !== '');
    if (!readyToFetch) return [];
    let matching = data.courses.filter((c) => c.status === 'Active' && c.ugYear === filterUG && c.semester === semester);
    if (filterType === 'Institute Core') matching = matching.filter((c) => c.type === 'Institute Core');
    else if (filterType === 'Seed Course') matching = matching.filter((c) => c.type === 'Seed Course');
    else if (filterType === 'Program Core') matching = matching.filter((c) => c.type === 'Program Core' && c.dept === filterDept);
    else if (filterType === 'Elective') matching = matching.filter((c) => c.type === 'Elective' && c.dept.includes(filterDept));
    return matching;
  }, [data, filterTerm, filterUG, filterType, filterDept]);

  useEffect(() => { setFilterCourse(''); }, [filterTerm, filterUG, filterType, filterDept]);

  const currentCourse = useMemo(() => {
    if (!data || !filterCourse) return null;
    return data.courses.find((c) => c.code === filterCourse) || null;
  }, [data, filterCourse]);

  const sectionOptions = useMemo(() => {
    if (!currentCourse) return [];
    const opts = ['All Sections'];
    for (let i = 1; i <= (currentCourse.sections || 1); i++) opts.push(`Section ${i}`);
    return opts;
  }, [currentCourse]);

  useEffect(() => { if (currentCourse) setFilterSection('All Sections'); else setFilterSection(''); }, [currentCourse]);

  const allFiltersComplete = filterTerm && filterUG && filterType && (deptDisabled || filterDept) && filterCourse && filterSection;

  // ─── Students ──────────────────────────────────────────────
  const roster = useMemo(() => {
    if (!data || !filterCourse) return [];
    // Convert display term "Spring 2026" → termId "SPRING2026"
    const termId = filterTerm ? filterTerm.replace(' ', '').toUpperCase() : '';
    return data.students.filter(
      (s) => s.course === filterCourse && (!termId || s.termId === termId)
    );
  }, [data, filterCourse, filterTerm]);

  const sectionCounts = useMemo(() => {
    const counts = {};
    const numSec = currentCourse ? currentCourse.sections || 1 : 0;
    for (let i = 1; i <= numSec; i++) counts[`Section ${i}`] = 0;
    roster.forEach((s) => {
      const norm = normalizeSectionValue(s.section);
      if (norm && counts[norm] !== undefined) counts[norm]++;
    });
    return counts;
  }, [roster, currentCourse]);

  const totalAssigned = Object.values(sectionCounts).reduce((a, b) => a + b, 0);

  const displayedStudents = useMemo(() => {
    let list = roster;
    if (filterSection && filterSection !== 'All Sections') list = list.filter((s) => s.section === filterSection);
    const q = searchStudent.toLowerCase();
    if (q) list = list.filter((s) => s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
    return list;
  }, [roster, filterSection, searchStudent]);

  // ─── Edit Section ──────────────────────────────────────────
  const openEditModal = (studentId) => {
    setEditingStudentId(studentId); setModalNewSection(''); setEditModalOpen(true);
  };

  const editingStudent = useMemo(() => {
    if (!editingStudentId || !currentCourse || !data) return null;
    return data.students.find((s) => s.id === editingStudentId && s.course === currentCourse.code);
  }, [editingStudentId, currentCourse, data]);

  const modalCapacityWarning = useMemo(() => {
    if (!modalNewSection || !currentCourse || !data) return '';
    const currentCount = data.students.filter(
      (s) => s.course === currentCourse.code && normalizeSectionValue(s.section) === modalNewSection
    ).length;
    const adjustedCount = (editingStudent && normalizeSectionValue(editingStudent.section) === modalNewSection)
      ? currentCount : currentCount + 1;
    if (adjustedCount > MAX_SECTION_CAPACITY) return `Section ${modalNewSection} is at full capacity (100 students)`;
    return '';
  }, [modalNewSection, currentCourse, data, editingStudent]);

  const confirmEditSection = useCallback(() => {
    if (!editingStudentId || !data) return;
    setData((prev) => ({
      ...prev,
      students: prev.students.map((s) =>
        s.id === editingStudentId && s.course === currentCourse.code ? { ...s, section: modalNewSection || '' } : s
      ),
    }));
    setEditModalOpen(false);
    setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    modalCapacityWarning ? toast(modalCapacityWarning, { icon: '⚠️' }) : toast.success(`Student moved to ${formatSectionLabel(modalNewSection)} successfully`);
  }, [editingStudentId, modalNewSection, currentCourse, data, setData, modalCapacityWarning]);

  // ─── Config Sections ──────────────────────────────────────
  const openConfigModal = () => {
    if (!currentCourse) return;
    setConfigNewSections(currentCourse.sections || 1); setConfigWarning(''); setConfigModalOpen(true);
  };

  const saveConfigSection = () => {
    const newSec = parseInt(configNewSections, 10);
    if (isNaN(newSec) || newSec < 1 || newSec > 6) { setConfigWarning('Enter a valid number between 1 and 6.'); return; }
    const currSec = currentCourse.sections || 1;
    if (newSec < currSec) {
      for (let i = currSec; i > newSec; i--) {
        const count = roster.filter((s) => s.section === `Section ${i}`).length;
        if (count > 0) { setConfigWarning(`Cannot reduce — Section ${i} has ${count} students. Reassign first.`); return; }
      }
    }
    setData((prev) => ({ ...prev, courses: prev.courses.map((c) => c.code === currentCourse.code ? { ...c, sections: newSec } : c) }));
    setConfigModalOpen(false);
    toast.success(`Sections updated to ${newSec} for ${currentCourse.code}`);
  };

  // ─── Actions ───────────────────────────────────────────────
  const clearAssignments = () => {
    if (!currentCourse) return;
    setConfirmModal({
      open: true, title: 'Clear Course Assignments',
      message: `Remove all section assignments for ${currentCourse.code}?`,
      onConfirm: () => {
        setData((prev) => ({ ...prev, students: prev.students.map((s) => s.course === currentCourse.code ? { ...s, section: '' } : s) }));
        setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        toast.success(`Cleared all assignments for ${currentCourse.code}.`);
      },
    });
  };

  const exportCSV = () => {
    if (displayedStudents.length === 0) { toast.error('No students to export.'); return; }
    let csv = 'Student ID,Student Name,Program,Year,Course,Section\n';
    displayedStudents.forEach((s) => { csv += `${s.id},${s.name},${s.program},${s.ugYear},${s.course},${s.section || 'Unassigned'}\n`; });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `Section_Allocation_${Date.now()}.csv`; a.click(); URL.revokeObjectURL(a.href);
  };

  const saveAssignments = async () => {
    if (!currentCourse) {
      toast.error('Please select a course first.');
      return;
    }
    setSaving(true);
    try {
      const assignments = roster
        .map((s) => {
          let secId = null;
          if (s.section && s.section !== 'Unassigned') {
            const secNum = s.section.replace(/\D/g, '');
            const match = data?._raw?.sections?.find(
              (sec) =>
                sec.Course_ID === currentCourse.code &&
                (sec.Section_Name === `S${secNum}` ||
                  sec.Section_Name === `Section ${secNum}` ||
                  sec.Section_ID === `${currentCourse.code}-S${secNum}`)
            );
            secId = match ? match.Section_ID : `${currentCourse.code}-S${secNum}`;
          }
          return { enrollmentId: Number(s.enrollmentId), sectionId: secId };
        })
        .filter((a) => a.enrollmentId);

      if (assignments.length > 0) {
        // Ensure sections exist in backend first so batch assignment does not fail
        const allSections = await sectionsService.getAll().catch(() => []);
        const termId = filterTerm ? filterTerm.replace(' ', '').toUpperCase() : 'SPRING2026';
        const numSec = currentCourse.sections || 1;
        for (let i = 1; i <= numSec; i++) {
          const expectedSecId = `${currentCourse.code}-S${i}`;
          if (!allSections.some((sec) => sec.sectionId === expectedSecId)) {
            await sectionsService.create({
              sectionId: expectedSecId,
              sectionName: `S${i}`,
              courseId: currentCourse.code,
              termId,
              capacity: 100,
            }).catch(() => null);
          }
        }

        const result = await registrationsService.batchAssignSections(assignments);
        if (result.errors && result.errors.length > 0) {
          toast.error(`Saved with ${result.errors.length} error(s).`);
        } else {
          toast.success('All section assignments saved to backend!');
        }
      } else {
        toast.success('No student assignments to save.');
      }
      setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('Failed to save assignments:', err);
      toast.error('Failed to save assignments: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleResetChanges = async () => {
    if (refetch) {
      await refetch();
      toast.success('Changes reset.');
    } else {
      window.location.reload();
    }
  };

  const numSec = currentCourse ? currentCourse.sections || 1 : 0;

  return (
    <AD1PageLayout loading={loading} error={error} loadingMessage="Loading Course Sections...">
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Course Section Allocation</h1>
        <p className={styles.pageSubtitle}>Manage student enrollment sections across courses</p>
      </div>

      {/* Filters */}
      <div className={styles.filterBar}>
        {[
          { label: 'Term', value: filterTerm, onChange: setFilterTerm, options: [{ v: 'Monsoon 2025', l: 'Monsoon 2025' }, { v: 'Spring 2026', l: 'Spring 2026' }] },
          { label: 'UG Year', value: filterUG, onChange: setFilterUG, options: [{ v: '', l: 'Select Year', disabled: true }, { v: 'UG1', l: 'UG1' }, { v: 'UG2', l: 'UG2' }, { v: 'UG3', l: 'UG3' }, { v: 'UG4', l: 'UG4' }] },
          { label: 'Course Type', value: filterType, onChange: setFilterType, options: [{ v: '', l: 'Select Type', disabled: true }, { v: 'Institute Core', l: 'Institute Core' }, { v: 'Program Core', l: 'Program Core' }, { v: 'Elective', l: 'Elective' }, { v: 'Seed Course', l: 'Seed Course' }] },
        ].map((f) => (
          <div className={styles.filterGroup} key={f.label}>
            <label className={styles.filterLabel}>{f.label}</label>
            <select className={shared.selectField} value={f.value} onChange={(e) => f.onChange(e.target.value)}>
              {f.options.map((o) => <option key={o.v} value={o.v} disabled={o.disabled}>{o.l}</option>)}
            </select>
          </div>
        ))}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Department</label>
          <select className={shared.selectField} value={filterDept} disabled={deptDisabled} onChange={(e) => setFilterDept(e.target.value)}>
            {deptDisabled ? <option value="All Departments">All Departments</option> : (
              <><option value="" disabled>Select Dept</option><option value="CSE">CSE</option><option value="ECE">ECE</option><option value="AIDS">AIDS</option></>
            )}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Course</label>
          <select className={shared.selectField} value={filterCourse} disabled={courseOptions.length === 0} onChange={(e) => setFilterCourse(e.target.value)}>
            <option value="" disabled>Select Course</option>
            {courseOptions.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Section</label>
          <select className={shared.selectField} value={filterSection} disabled={!currentCourse} onChange={(e) => setFilterSection(e.target.value)}>
            {sectionOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Stats */}
      <StatCardsRow>
        <StatCard icon="🏫" label="Sections Created" value={numSec} color="amber" />
        <StatCard icon="✅" label="Students Assigned" value={totalAssigned} color="green" />
      </StatCardsRow>

      {/* Section Cards */}
      {currentCourse && (
        <div className={styles.sectionCardsWrapper}>
          <div className={styles.sectionCardsHeader}>
            <h2 className={styles.sectionCardsTitle}>Section Overview</h2>
            <button className={shared.btnSecondary} onClick={openConfigModal}>⚙ Configure Sections</button>
          </div>
          <div className={styles.sectionCards}>
            {Array.from({ length: numSec }, (_, i) => {
              const secKey = `Section ${i + 1}`;
              const assigned = sectionCounts[secKey] || 0;
              const pct = Math.round((assigned / MAX_SECTION_CAPACITY) * 100);
              let state = 'available';
              if (assigned >= MAX_SECTION_CAPACITY * 0.9) state = 'full';
              else if (assigned >= MAX_SECTION_CAPACITY * 0.6) state = 'nearFull';
              const stateLabel = { available: 'AVAILABLE', nearFull: 'NEAR FULL', full: 'FULL' }[state];
              const stateClass = state.charAt(0).toUpperCase() + state.slice(1);
              return (
                <div className={styles.sectionCard} key={secKey}>
                  <div className={styles.sectionCardHeader}>
                    <div className={styles.sectionCardTitle}>{secKey}</div>
                    <div className={`${styles.sectionCardBadge} ${styles[`badge${stateClass}`]}`}>{stateLabel}</div>
                  </div>
                  <div className={styles.sectionCardStats}><span>{assigned} Assigned</span><span>Max: {MAX_SECTION_CAPACITY}</span></div>
                  <div className={styles.sectionCardBarBg}>
                    <div className={`${styles.sectionCardBarFill} ${styles[`fill${stateClass}`]}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Workspace */}
      <div className={styles.workspace}>
        <div className={styles.workspaceHeader}>
          <input className={shared.searchInput} placeholder="Search students by name or ID..." value={searchStudent}
            onChange={(e) => setSearchStudent(e.target.value)} style={{ maxWidth: 400 }} />
          <button className={shared.btnDanger} disabled={!currentCourse} onClick={clearAssignments}>Clear Assignments</button>
        </div>
        <div className={styles.tableResponsive}>
          <DataTable columns={['', 'Student ID', 'Student Name', 'Program / Year', 'Section', 'Status']}
            emptyText={!allFiltersComplete ? 'Please select all filters to load students.' : 'No students match current filters/search.'}>
            {allFiltersComplete && displayedStudents.map((s) => {
              const isAssigned = !!normalizeSectionValue(s.section);
              return (
                <tr key={`${s.id}-${s.course}`}>
                  <td><input type="checkbox" /></td>
                  <td style={{ fontWeight: 600 }}>{s.id}</td>
                  <td>{s.name}</td>
                  <td>{s.program} / {s.ugYear}</td>
                  <td>
                    <span className={styles.sectionText}>{formatSectionLabel(s.section)}</span>
                    <button className={styles.editIconBtn} title="Change Section" onClick={() => openEditModal(s.id)}>✏️</button>
                  </td>
                  <td>
                    <span className={`${styles.badgeStatus} ${isAssigned ? styles.badgeStatusAssigned : styles.badgeStatusUnassigned}`}>
                      {isAssigned ? 'Assigned' : 'Unassigned'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </DataTable>
        </div>
        <div className={styles.workspaceFooter}>Showing {displayedStudents.length} students</div>
      </div>

      {/* Bottom Bar */}
      <div className={styles.bottomBar}>
        <button className={shared.btnSecondary} onClick={exportCSV}>📥 Export CSV</button>
        <div className={styles.bottomBarRight}>
          {lastSaved && (
            <div className={styles.syncStatus}>
              <span>🟢</span>
              <div><div className={styles.syncTitle}>Synced</div><div className={styles.syncTime}>Last saved: {lastSaved}</div></div>
            </div>
          )}
          <button className={shared.btnSecondary} onClick={handleResetChanges} disabled={saving}>↩ Reset Changes</button>
          <button className={shared.btnPrimary} onClick={saveAssignments} disabled={saving || !currentCourse}>
            {saving ? 'Saving...' : 'Save Assignments'}
          </button>
        </div>
      </div>

      {/* Edit Section Modal */}
      <Modal open={editModalOpen && !!editingStudent} onClose={() => setEditModalOpen(false)} title="Change Section Assignment" maxWidth="500px">
        <Modal.Body>
          {editingStudent && (
            <>
              <p><strong>{editingStudent.name}</strong> ({editingStudent.id})</p>
              <p style={{ marginTop: 8, color: '#6b7280' }}>Current: {formatSectionLabel(editingStudent.section)}</p>
              <div style={{ marginTop: 16 }}>
                <label className={shared.formLabel}>New Section</label>
                <select className={shared.selectField} value={modalNewSection} onChange={(e) => setModalNewSection(e.target.value)}>
                  <option value="">Unassigned</option>
                  {Array.from({ length: currentCourse?.sections || 1 }, (_, i) => {
                    const sv = `Section ${i + 1}`;
                    if (sv === normalizeSectionValue(editingStudent.section)) return null;
                    return <option key={sv} value={sv}>{i + 1}</option>;
                  })}
                </select>
              </div>
              {modalCapacityWarning && <div className={styles.msgWarning} style={{ marginTop: 12 }}>⚠️ {modalCapacityWarning}</div>}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button className={shared.btnSecondary} onClick={() => setEditModalOpen(false)}>Cancel</button>
          <button className={shared.btnPrimary} onClick={confirmEditSection}>Confirm</button>
        </Modal.Footer>
      </Modal>

      {/* Config Sections Modal */}
      <Modal open={configModalOpen && !!currentCourse} onClose={() => setConfigModalOpen(false)} title="Configure Sections" maxWidth="500px">
        <Modal.Body>
          {currentCourse && (
            <>
              <p><strong>{currentCourse.code} — {currentCourse.name}</strong></p>
              <div style={{ marginTop: 16 }}>
                <label className={shared.formLabel}>Current Sections</label>
                <input className={`${shared.inputField} ${shared.readonlyField}`} value={currentCourse.sections || 1} readOnly />
              </div>
              <div style={{ marginTop: 12 }}>
                <label className={shared.formLabel}>New Number of Sections</label>
                <input className={shared.inputField} type="number" min="1" max="6" value={configNewSections}
                  onChange={(e) => { setConfigNewSections(e.target.value); setConfigWarning(''); }} />
              </div>
              {configWarning && <div className={styles.msgWarning} style={{ marginTop: 12 }}>⚠️ {configWarning}</div>}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button className={shared.btnSecondary} onClick={() => setConfigModalOpen(false)}>Cancel</button>
          <button className={shared.btnPrimary} onClick={saveConfigSection}>Save</button>
        </Modal.Footer>
      </Modal>

      {/* Confirm Modal */}
      <Modal open={confirmModal.open} onClose={() => setConfirmModal({ ...confirmModal, open: false })} title={confirmModal.title} maxWidth="500px">
        <Modal.Body><p>{confirmModal.message}</p></Modal.Body>
        <Modal.Footer>
          <button className={shared.btnSecondary} onClick={() => setConfirmModal({ ...confirmModal, open: false })}>Cancel</button>
          <button className={shared.btnDanger} onClick={() => { confirmModal.onConfirm?.(); setConfirmModal({ ...confirmModal, open: false }); }}>Confirm</button>
        </Modal.Footer>
      </Modal>
    </AD1PageLayout>
  );
}
