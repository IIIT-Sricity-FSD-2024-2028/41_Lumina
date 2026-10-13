/**
 * CourseCatalog — Deal1 Page 2
 * Refactored to use shared AD1PageLayout, StatCard, Modal, FormGroup,
 * DataTable, Pagination, PrereqDropdown, and shared CSS tokens.
 */
import { useState, useMemo, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import AD1PageLayout from './components/AD1PageLayout';
import StatCard, { StatCardsRow } from './components/StatCard';
import Modal from './components/Modal';
import FormGroup from './components/FormGroup';
import DataTable from './components/DataTable';
import Pagination from './components/Pagination';
import PrereqDropdown from './components/PrereqDropdown';
import useAD1Data from './hooks/useAD1Data';
import usePagination from './hooks/usePagination';
import { coursesService } from '../../services/courses.service';
import { getTypeBadgeInfo, getDeptDisplay } from './utils/dataTransforms';
import shared from './styles/ad1-shared.module.css';
import styles from './CourseCatalog.module.css';

export default function CourseCatalog() {
  const { data, loading, error, setData } = useAD1Data();

  // ─── Filters ───────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [filterUG, setFilterUG] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // ─── Modal State ───────────────────────────────────────────
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCourseCode, setEditingCourseCode] = useState(null);

  // ─── Form State ────────────────────────────────────────────
  const [addForm, setAddForm] = useState({ code: '', name: '', credits: '', ugYear: '', semester: '', type: '', dept: '' });
  const [addPrereqTags, setAddPrereqTags] = useState([]);
  const [addErrors, setAddErrors] = useState({});
  const [editForm, setEditForm] = useState({ code: '', name: '', credits: '', ugYear: '', semester: '', type: '', dept: '', status: '' });
  const [editPrereqTags, setEditPrereqTags] = useState([]);
  const [editErrors, setEditErrors] = useState({});

  const deptDisabled = filterType === 'Institute Core' || filterType === 'Seed Course';

  // ─── Filtered courses ──────────────────────────────────────
  const filteredCourses = useMemo(() => {
    if (!data) return [];
    return data.courses.filter((c) => {
      if (search && !c.code.toLowerCase().includes(search.toLowerCase()) && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterUG && c.ugYear !== filterUG) return false;
      if (filterType && c.type !== filterType) return false;
      if (filterDept && c.dept !== filterDept) return false;
      if (filterSemester && c.semester !== filterSemester) return false;
      if (filterStatus && c.status !== filterStatus) return false;
      return true;
    });
  }, [data, search, filterUG, filterType, filterDept, filterSemester, filterStatus]);

  const stats = useMemo(() => {
    if (!data) return { total: 0, active: 0, inactive: 0, depts: 0 };
    return {
      total: data.courses.length,
      active: data.courses.filter((c) => c.status === 'Active').length,
      inactive: data.courses.filter((c) => c.status === 'Inactive').length,
      depts: new Set(data.departments).size,
    };
  }, [data]);

  // ─── Pagination (shared hook) ──────────────────────────────
  const { pagedItems, currentPage, totalPages, setPage, info: paginationInfo } = usePagination(filteredCourses, 6);

  const clearFilters = useCallback(() => {
    setSearch(''); setFilterUG(''); setFilterType(''); setFilterDept('');
    setFilterSemester(''); setFilterStatus('');
  }, []);

  useEffect(() => { if (deptDisabled) setFilterDept(''); }, [deptDisabled]);

  // ─── Type change handlers ─────────────────────────────────
  const handleTypeChange = (form, setForm) => (type) => {
    const updates = { type };
    if (type === 'Institute Core') updates.dept = '';
    else if (type === 'Seed Course') { updates.dept = 'All Departments (CSE, ECE, AIDS)'; updates.credits = '2'; }
    setForm((f) => ({ ...f, ...updates }));
  };

  // ─── Validate form ─────────────────────────────────────────
  const validateForm = (form, isAdd) => {
    const errs = {};
    if (isAdd) {
      const code = form.code.trim().toUpperCase();
      if (!code) errs.code = 'Course code is required';
      else if (!/[A-Za-z]/.test(code) || !/[0-9]/.test(code)) errs.code = 'Must contain letters and numbers';
      else if (data?.courses?.some((c) => c.code === code)) errs.code = 'Course code already exists';
    }
    if (!form.name.trim()) errs.name = 'Course name is required';
    else if (isAdd && !/^[A-Za-z\s]+$/.test(form.name.trim())) errs.name = 'Name must contain only letters';
    const maxCredits = isAdd ? 4 : 6;
    if (!form.credits || form.credits < 1 || form.credits > maxCredits) errs.credits = `Credits must be 1-${maxCredits}`;
    if (!form.ugYear) errs.ugYear = 'UG Year is required';
    if (!form.semester) errs.semester = 'Semester is required';
    if (!form.type) errs.type = 'Type is required';
    if (form.type === 'Seed Course' && form.credits !== '2') errs.credits = 'Seed Course credits must be 2';
    if (form.type !== 'Institute Core' && form.type !== 'Seed Course' && !form.dept) errs.dept = 'Department is required';
    if (!isAdd && !form.status) errs.status = 'Status is required';
    return errs;
  };

  // ─── Build course object from form ─────────────────────────
  const buildCourseFromForm = (form, prereqs) => ({
    code: form.code?.trim().toUpperCase() || form.code,
    name: form.name.trim(),
    credits: parseInt(form.credits, 10),
    ugYear: form.ugYear,
    semester: form.semester,
    type: form.type,
    dept: form.type === 'Institute Core' ? '-' : form.type === 'Seed Course' ? 'All Departments (CSE, ECE, AIDS)' : form.dept,
    prerequisites: [...prereqs],
    status: form.status || 'Active',
    sections: 1,
  });

  // ─── Open modals ───────────────────────────────────────────
  const openAddModal = () => {
    setAddForm({ code: '', name: '', credits: '', ugYear: '', semester: '', type: '', dept: '' });
    setAddPrereqTags([]); setAddErrors({}); setAddModalOpen(true);
  };

  const openEditModal = (code) => {
    const course = data?.courses?.find((c) => c.code === code);
    if (!course) return;
    setEditingCourseCode(code);
    setEditForm({ code: course.code, name: course.name, credits: String(course.credits), ugYear: course.ugYear,
      semester: course.semester, type: course.type, dept: course.dept, status: course.status });
    setEditPrereqTags([...(course.prerequisites || [])]); setEditErrors({}); setEditModalOpen(true);
  };

  // ─── Submit handlers ──────────────────────────────────────
  const handleAddCourse = async (e) => {
    e.preventDefault();
    const errs = validateForm(addForm, true);
    setAddErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const newCourse = buildCourseFromForm(addForm, addPrereqTags);
    try {
      await coursesService.create({
        courseId: newCourse.code, courseName: newCourse.name, credits: newCourse.credits,
        courseCapacity: newCourse.type === 'Seed Course' ? 120 : 60, status: newCourse.status,
        deptId: newCourse.dept === '-' || newCourse.dept.startsWith('All') ? 'CSE' : newCourse.dept,
      });
      setData((prev) => ({ ...prev, courses: [...prev.courses, newCourse] }));
      setAddModalOpen(false);
      toast.success('Course added successfully!');
    } catch (err) {
      toast.error('Failed to add course: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEditCourse = async (e) => {
    e.preventDefault();
    const errs = validateForm(editForm, false);
    setEditErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const updated = buildCourseFromForm(editForm, editPrereqTags);
    try {
      await coursesService.update(editingCourseCode, {
        courseName: updated.name, credits: updated.credits, status: updated.status,
        deptId: updated.dept === '-' || updated.dept.startsWith('All') ? 'CSE' : updated.dept,
      });
      setData((prev) => ({ ...prev, courses: prev.courses.map((c) => c.code === editingCourseCode ? { ...c, ...updated } : c) }));
      setEditModalOpen(false);
      toast.success('Course updated successfully!');
    } catch (err) {
      toast.error('Failed to update course: ' + (err.response?.data?.message || err.message));
    }
  };

  // ─── Course Form JSX (shared between Add/Edit) ────────────
  const renderCourseForm = (form, setForm, errors, prereqTags, setPrereqTags, isAdd) => (
    <>
      <div className={shared.formRow}>
        <FormGroup label="Course Code" error={errors.code}>
          {isAdd ? (
            <input className={shared.inputField} placeholder="e.g. CS101" value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
          ) : (
            <input className={`${shared.inputField} ${shared.readonlyField}`} value={form.code} readOnly />
          )}
        </FormGroup>
        <FormGroup label="Course Name" error={errors.name}>
          <input className={shared.inputField} placeholder="e.g. Intro to Logic" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </FormGroup>
      </div>
      <div className={shared.formRow}>
        <FormGroup label="Credits" error={errors.credits}>
          <input className={shared.inputField} type="number" min="1" max={isAdd ? 4 : 6} placeholder="e.g. 4"
            value={form.credits} readOnly={form.type === 'Seed Course'}
            onChange={(e) => setForm((f) => ({ ...f, credits: e.target.value }))} />
        </FormGroup>
        <FormGroup label="UG Year" error={errors.ugYear}>
          <select className={shared.selectField} value={form.ugYear}
            onChange={(e) => setForm((f) => ({ ...f, ugYear: e.target.value }))}>
            {isAdd && <option value="">Select Year</option>}
            <option value="UG1">UG1</option><option value="UG2">UG2</option>
            <option value="UG3">UG3</option><option value="UG4">UG4</option>
          </select>
        </FormGroup>
      </div>
      <div className={shared.formRow}>
        <FormGroup label="Semester" error={errors.semester}>
          <div className={shared.radioGroup}>
            {['Monsoon', 'Spring'].map((s) => (
              <label key={s} className={shared.radioLabel}>
                <input type="radio" name={`${isAdd ? 'add' : 'edit'}Semester`} value={s} checked={form.semester === s}
                  onChange={() => setForm((f) => ({ ...f, semester: s }))} /> {s}
              </label>
            ))}
          </div>
        </FormGroup>
        <FormGroup label="Type" error={errors.type}>
          <select className={shared.selectField} value={form.type}
            onChange={(e) => handleTypeChange(form, setForm)(e.target.value)}>
            {isAdd && <option value="">Select Type</option>}
            <option value="Institute Core">Institute Core</option>
            <option value="Program Core">Program Core</option>
            <option value="Elective">Elective</option>
            <option value="Seed Course">Seed Course</option>
          </select>
        </FormGroup>
      </div>
      <div className={shared.formRow}>
        <FormGroup label="Department" error={errors.dept}>
          <select className={shared.selectField} value={form.dept}
            disabled={form.type === 'Institute Core' || form.type === 'Seed Course'}
            onChange={(e) => setForm((f) => ({ ...f, dept: e.target.value }))}>
            {isAdd && <option value="">Select Department</option>}
            <option value="All Departments (CSE, ECE, AIDS)">All Departments (CSE, ECE, AIDS)</option>
            <option value="CSE">CSE</option><option value="ECE">ECE</option><option value="AIDS">AIDS</option>
          </select>
        </FormGroup>
        {!isAdd && (
          <FormGroup label="Status" error={errors.status}>
            <div className={shared.radioGroup}>
              {['Active', 'Inactive'].map((s) => (
                <label key={s} className={shared.radioLabel}>
                  <input type="radio" name="editStatus" value={s} checked={form.status === s}
                    onChange={() => setForm((f) => ({ ...f, status: s }))} /> {s}
                </label>
              ))}
            </div>
          </FormGroup>
        )}
      </div>
      <div style={{ marginBottom: 16 }}>
        <label className={shared.formLabel}>Prerequisites</label>
        <PrereqDropdown courses={data?.courses || []} tags={prereqTags} setTags={setPrereqTags}
          excludeCode={isAdd ? null : editingCourseCode} />
      </div>
    </>
  );

  return (
    <AD1PageLayout loading={loading} error={error} loadingMessage="Loading Course Catalog...">
      {/* Header */}
      <div className={styles.catalogHeader}>
        <h1 className={styles.catalogTitle}>Course Catalog Management</h1>
        <button className={shared.btnPrimary} onClick={openAddModal}>+ Add New Course</button>
      </div>

      {/* Stats */}
      <StatCardsRow>
        <StatCard label="Total Courses" value={stats.total} color="blue" />
        <StatCard label="Active Courses" value={stats.active} color="green" />
        <StatCard label="Inactive Courses" value={stats.inactive} color="red" />
        <StatCard label="Departments" value={stats.depts} color="amber" />
      </StatCardsRow>

      {/* Filters */}
      <div className={styles.filterBar}>
        <div className={styles.filterSearch}>
          <span className={styles.searchIcon}>🔍</span>
          <input type="text" className={styles.searchInput} placeholder="Search by course code or name..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className={styles.filterSelect} value={filterUG} onChange={(e) => setFilterUG(e.target.value)}>
          <option value="">UG</option>
          <option value="UG1">UG1</option><option value="UG2">UG2</option>
          <option value="UG3">UG3</option><option value="UG4">UG4</option>
        </select>
        <select className={styles.filterSelect} value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)}>
          <option value="">Semester</option>
          <option value="Monsoon">Monsoon</option><option value="Spring">Spring</option>
        </select>
        <select className={styles.filterSelect} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">Course Type</option>
          <option value="Institute Core">Institute Core</option><option value="Program Core">Program Core</option>
          <option value="Elective">Elective</option><option value="Seed Course">Seed Course</option>
        </select>
        <select className={styles.filterSelect} value={filterDept} onChange={(e) => setFilterDept(e.target.value)} disabled={deptDisabled}>
          <option value="">{deptDisabled ? 'All Departments' : 'Department'}</option>
          <option value="CSE">CSE</option><option value="ECE">ECE</option><option value="AIDS">AIDS</option>
        </select>
        <select className={styles.filterSelect} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Status</option>
          <option value="Active">Active</option><option value="Inactive">Inactive</option>
        </select>
        <button className={styles.clearBtn} onClick={clearFilters} title="Clear all filters">⟳</button>
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <DataTable columns={['Course Code', 'Course Name', 'Dept', 'Credits', 'Course Type', 'Prerequisites', 'UG Year', 'Semester', 'Status', 'Actions']}
          emptyText="No courses found.">
          {pagedItems.map((c) => {
            const badge = getTypeBadgeInfo(c.type);
            return (
              <tr key={c.code}>
                <td className={styles.codeCell}>{c.code}</td>
                <td>{c.name}</td>
                <td>{getDeptDisplay(c)}</td>
                <td>{c.credits}</td>
                <td><span className={`${styles.typeBadge} ${styles[`typeBadge${badge.cls.charAt(0).toUpperCase() + badge.cls.slice(1)}`]}`}>{badge.label}</span></td>
                <td>{(!c.prerequisites || c.prerequisites.length === 0) ? 'None' : c.prerequisites.join(', ')}</td>
                <td>{c.ugYear}</td>
                <td>{c.semester}</td>
                <td>
                  <span className={`${styles.statusBadge} ${c.status === 'Active' ? styles.badgeActive : styles.badgeInactive}`}>
                    <span className={`${styles.badgeDot} ${c.status === 'Active' ? styles.dotGreen : styles.dotRed}`} />
                    {c.status}
                  </span>
                </td>
                <td><button className={styles.actionBtn} title="Edit" onClick={() => openEditModal(c.code)}>✏️</button></td>
              </tr>
            );
          })}
        </DataTable>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} info={paginationInfo} />
      </div>

      {/* Add Modal */}
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add New Course">
        <form onSubmit={handleAddCourse} noValidate>
          <Modal.Body>
            {renderCourseForm(addForm, setAddForm, addErrors, addPrereqTags, setAddPrereqTags, true)}
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className={shared.btnSecondary} onClick={() => setAddModalOpen(false)}>Cancel</button>
            <button type="submit" className={shared.btnPrimary}>Add Course</button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Course">
        <form onSubmit={handleEditCourse} noValidate>
          <Modal.Body>
            {renderCourseForm(editForm, setEditForm, editErrors, editPrereqTags, setEditPrereqTags, false)}
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className={shared.btnSecondary} onClick={() => setEditModalOpen(false)}>Cancel</button>
            <button type="submit" className={shared.btnPrimary}>Save Changes</button>
          </Modal.Footer>
        </form>
      </Modal>
    </AD1PageLayout>
  );
}
