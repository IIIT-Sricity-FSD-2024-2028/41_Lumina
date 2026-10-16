import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { facultyDataService } from '../../services/facultyData';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import styles from './FacultyCourses.module.css';

export default function FacultyCourses() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Materials Modal state
  const [activeCourseForModal, setActiveCourseForModal] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [newMatTitle, setNewMatTitle] = useState('');
  const [newMatType, setNewMatType] = useState('Slides');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function loadCourses() {
      setLoading(true);
      try {
        const list = await facultyDataService.getCourses(user);
        setCourses(list);
      } catch (err) {
        console.error('Failed to load courses', err);
        toast.error('Failed to load courses data');
      } finally {
        setLoading(false);
      }
    }

    loadCourses();
  }, [user]);

  // Open Materials Modal
  async function handleOpenMaterials(course) {
    setActiveCourseForModal(course);
    try {
      const mats = await facultyDataService.getMaterials(course.id);
      setMaterials(mats);
    } catch {
      setMaterials([]);
    }
  }

  function handleCloseMaterials() {
    setActiveCourseForModal(null);
    setNewMatTitle('');
    setSelectedFile(null);
  }

  // File upload security & format constraints matching backend Multer rules
  const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.csv', '.xls', '.xlsx', '.jpg', '.jpeg', '.png'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error(`Unsupported format "${ext}". Allowed formats: PDF, DOC, DOCX, TXT, CSV, XLS, XLSX, JPG, PNG.`);
      e.target.value = '';
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File size exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      e.target.value = '';
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  }

  // Handle Material Upload
  async function handleAddMaterial(e) {
    e.preventDefault();
    if (!newMatTitle.trim()) {
      toast.error('Please enter a material title');
      return;
    }

    if (selectedFile) {
      const ext = '.' + selectedFile.name.split('.').pop().toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        toast.error(`Unsupported format "${ext}". Allowed formats: PDF, DOC, DOCX, TXT, CSV, XLS, XLSX, JPG, PNG.`);
        return;
      }
      if (selectedFile.size > MAX_FILE_SIZE) {
        toast.error('File size exceeds the 5MB limit.');
        return;
      }
    }

    setUploading(true);
    try {
      const added = await facultyDataService.addMaterial(
        activeCourseForModal.id,
        { name: newMatTitle, type: newMatType, slotId: activeCourseForModal.slotId || 1 },
        selectedFile
      );

      setMaterials((prev) => [added.material, ...prev]);
      setNewMatTitle('');
      setSelectedFile(null);
      if (added.backendSuccess) {
        toast.success('Document uploaded and persisted to server!');
      } else if (added.backendError) {
        toast.error(`Server upload failed: ${added.backendError}. Saved locally.`);
      } else {
        toast.success('Document added to course materials repository');
      }
    } catch (err) {
      console.error('Upload error', err);
      toast.error('Failed to upload material');
    } finally {
      setUploading(false);
    }
  }

  // Handle mock download
  function handleDownload(mat) {
    if (mat.fileUrl) {
      window.open(mat.fileUrl, '_blank');
    } else {
      toast.success(`Downloading ${mat.name}...`);
    }
  }

  if (loading) {
    return <LoadingSpinner text="Loading courses..." />;
  }

  // Filter courses
  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      searchTerm.trim() === '' ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTerm = selectedTerm === 'all' || c.termId === selectedTerm;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

    return matchesSearch && matchesTerm && matchesStatus;
  });

  return (
    <div className={styles.container}>
      {/* ── Page Header ── */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>My Courses</h1>
        <p className={styles.pageSub}>
          Manage course descriptions, syllabi, enrollments, and academic performance.
        </p>
      </div>

      {/* ── Search and Filter Toolbar ── */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by course code or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className={styles.semSelect}
          value={selectedTerm}
          onChange={(e) => setSelectedTerm(e.target.value)}
        >
          <option value="all">All Academic Terms</option>
          <option value="SPRING2026">Spring 2026</option>
          <option value="FALL2026">Monsoon 2026</option>
        </select>

        <div className={styles.statusTabs}>
          <button
            className={`${styles.tabBtn} ${statusFilter === 'all' ? styles.tabBtnActive : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All
          </button>
          <button
            className={`${styles.tabBtn} ${statusFilter === 'active' ? styles.tabBtnActive : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            Active
          </button>
          <button
            className={`${styles.tabBtn} ${statusFilter === 'inactive' ? styles.tabBtnActive : ''}`}
            onClick={() => setStatusFilter('inactive')}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* ── Course Grid ── */}
      {filteredCourses.length > 0 ? (
        <div className={styles.coursesGrid}>
          {filteredCourses.map((course) => (
            <div key={course.id} className={styles.courseCard}>
              <div>
                <div className={styles.cardHeader}>
                  <span className={styles.termTag}>
                    {course.termLabel || 'Spring 2026'} &bull; {course.semester}
                  </span>
                  <span
                    className={
                      course.status === 'active'
                        ? styles.statusBadgeActive
                        : styles.statusBadgeInactive
                    }
                  >
                    {course.status.toUpperCase()}
                  </span>
                </div>

                <h2 className={styles.courseTitle}>
                  {course.id} &ndash; {course.name}
                </h2>

                <p className={styles.courseSyllabusSnippet}>
                  {course.syllabus || 'Course syllabus and topics overview.'}
                </p>

                <div className={styles.metaRow}>
                  <div className={styles.metaItem}>
                    <span>👥</span>
                    <span><strong>{course.students}</strong>/{course.capacity} Enrolled</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span>🎓</span>
                    <span><strong>{course.credits}</strong> Credits</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span>🏛️</span>
                    <span>{course.room}</span>
                  </div>
                </div>
              </div>

              {/* Card Action Buttons */}
              <div className={styles.cardActions}>
                <button
                  className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
                  onClick={() => handleOpenMaterials(course)}
                  title="Upload or view course materials and syllabus"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  Materials
                </button>

                <button
                  className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
                  onClick={() => navigate(`/faculty/roster?course=${course.id}`)}
                  title="View full academic roster of enrolled students"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  Roster
                </button>

                <button
                  className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                  onClick={() => navigate(`/faculty/grades?course=${course.id}`)}
                  title="Open interactive gradebook sheet"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M9 21V9" />
                  </svg>
                  Grades
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.noResults}>
          <p>No courses match your filter criteria.</p>
        </div>
      )}

      {/* ── Materials & Syllabus Modal ── */}
      {activeCourseForModal && (
        <div
          className={styles.modalOverlay}
          onClick={handleCloseMaterials}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>
                  {activeCourseForModal.id} &ndash; Course Materials
                </h3>
                <p className={styles.modalSub}>{activeCourseForModal.name}</p>
              </div>
              <button
                className={styles.closeBtn}
                onClick={handleCloseMaterials}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Add Material Form */}
              <form onSubmit={handleAddMaterial} className={styles.addMatForm}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '10px' }}>
                  Upload New Document / Syllabus
                </h4>
                <div className={styles.formGrid}>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Document title (e.g. Chapter 4 Slides)..."
                    value={newMatTitle}
                    onChange={(e) => setNewMatTitle(e.target.value)}
                  />
                  <select
                    className={styles.formInput}
                    value={newMatType}
                    onChange={(e) => setNewMatType(e.target.value)}
                  >
                    <option value="Syllabus">Syllabus</option>
                    <option value="Slides">Lecture Slides</option>
                    <option value="Notes">Notes / Readings</option>
                    <option value="Assignment">Assignment</option>
                  </select>
                </div>

                <div className={styles.filePickRow}>
                  <label className={styles.filePickBtn}>
                    <input
                      type="file"
                      hidden
                      accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.png,.jpg,.jpeg"
                      onChange={handleFileSelect}
                    />
                    {selectedFile ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span>📎 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedFile(null);
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            padding: '2px 6px',
                          }}
                        >
                          ✕ Remove
                        </button>
                      </div>
                    ) : (
                      '+ Choose File (.pdf, .doc, .docx, .txt, .csv, .xls, .png, .jpg)'
                    )}
                  </label>

                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </form>

              {/* Material List */}
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '8px' }}>
                Course Repository ({materials.length})
              </h4>
              <ul className={styles.matList}>
                {materials.map((mat) => (
                  <li key={mat.id} className={styles.matItem}>
                    <div className={styles.matInfo}>
                      <div className={styles.matIcon}>
                        {mat.type === 'Syllabus' ? '📜' : mat.type === 'Assignment' ? '📝' : '📄'}
                      </div>
                      <div>
                        <div className={styles.matName}>{mat.name}</div>
                        <div className={styles.matMeta}>
                          <span>{mat.type}</span>
                          <span>&bull;</span>
                          <span>{mat.date}</span>
                          <span>&bull;</span>
                          <span>{mat.size}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      className={styles.downloadBtn}
                      onClick={() => handleDownload(mat)}
                      title="Download file"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Download
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
