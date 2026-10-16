import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { facultyService } from '../../services/faculty.service';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import styles from './FacultyAnnouncements.module.css';

export default function FacultyAnnouncements() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    courseId: 'all',
    title: '',
    message: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Custom Delete Modal State (replaces browser window.confirm with zero localhost popups)
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [cList, annList] = await Promise.all([
          facultyService.getCourses(user),
          facultyService.getAnnouncements(),
        ]);
        setCourses(cList);
        setAnnouncements(annList);
      } catch (err) {
        console.error('Failed to load announcements', err);
        toast.error('Failed to load announcements');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  function handleOpenCreate() {
    setEditingId(null);
    setFormData({
      courseId: 'all',
      title: '',
      message: '',
    });
    setSelectedFile(null);
    setModalOpen(true);
  }

  function handleOpenEdit(ann) {
    setEditingId(ann.id);
    setFormData({
      courseId: ann.courseId || 'all',
      title: ann.title || '',
      message: ann.message || '',
    });
    setSelectedFile(null);
    setModalOpen(true);
  }

  function handleCloseModal() {
    setModalOpen(false);
    setEditingId(null);
    setSelectedFile(null);
  }

  async function handleSaveAnnouncement(e) {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter an announcement title');
      return;
    }
    if (!formData.message.trim()) {
      toast.error('Please enter announcement message content');
      return;
    }

    if (selectedFile) {
      const ext = '.' + selectedFile.name.split('.').pop().toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        toast.error(`Unsupported file format "${ext}". Please attach a valid document.`);
        return;
      }
      if (selectedFile.size > MAX_FILE_SIZE) {
        toast.error('File size exceeds the 5MB limit.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (editingId) {
        // Edit existing announcement via facultyService and update backend PUT /announcements/:id
        const result = await facultyService.updateAnnouncement(editingId, {
          courseId: formData.courseId,
          title: formData.title,
          message: formData.message,
        });

        setAnnouncements((prev) =>
          prev.map((a) => (a.id === editingId ? result.updated : a))
        );

        if (result.backendSuccess) {
          toast.success('Announcement updated and synced with server!');
        } else if (result.backendError) {
          toast.error(`Server update failed: ${result.backendError}`);
        } else {
          toast.success('Announcement updated');
        }
      } else {
        // Create new announcement
        const result = await facultyService.createAnnouncement(formData, selectedFile);
        if (result.backendSuccess) {
          setAnnouncements((prev) => [result.created, ...prev]);
          toast.success('Announcement broadcast and saved to server! 📢');
        } else if (result.backendError) {
          toast.error(`Server rejected announcement: ${result.backendError}`);
          return;
        } else {
          setAnnouncements((prev) => [result.created, ...prev]);
          toast.success('Announcement broadcast successfully 📢');
        }
      }

      handleCloseModal();
    } catch (err) {
      console.error('Save announcement error', err);
      toast.error('Failed to save announcement');
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDeleteAnnouncement() {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const result = await facultyService.deleteAnnouncement(deleteTarget.id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      if (result.backendSuccess) {
        toast.success('Announcement deleted from server');
      } else if (result.backendError) {
        toast.error(`Server delete failed: ${result.backendError}`);
      } else {
        toast.success('Announcement deleted');
      }
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete announcement');
    } finally {
      setIsDeleting(false);
    }
  }

  if (loading) {
    return <LoadingSpinner text="Loading announcements..." />;
  }

  // Filter announcements
  const filteredAnnouncements = announcements.filter((a) => {
    const matchesCourse = courseFilter === 'all' || a.courseId === courseFilter;
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (a.title && a.title.toLowerCase().includes(q)) ||
      (a.message && a.message.toLowerCase().includes(q));

    return matchesCourse && matchesSearch;
  });

  return (
    <div className={styles.container}>
      {/* ── Page Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Announcements</h1>
          <p className={styles.pageSub}>
            Broadcast academic notifications, timetable changes, and exam guidelines to your classes.
          </p>
        </div>

        <button className={styles.newBtn} onClick={handleOpenCreate}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Announcement
        </button>
      </div>

      {/* ── Filter Toolbar ── */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search announcements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className={styles.courseSelect}
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
        >
          <option value="all">All Courses</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.id} &ndash; {course.name}
            </option>
          ))}
        </select>
      </div>

      {/* ── Announcements Grid ── */}
      {filteredAnnouncements.length > 0 ? (
        <div className={styles.annGrid}>
          {filteredAnnouncements.map((ann) => (
            <div key={ann.id} className={styles.annCard}>
              <div className={styles.annTop}>
                <span className={styles.courseTag}>{ann.courseLabel || 'COURSE ANNOUNCEMENT'}</span>
                <span className={styles.timeText}>{ann.ago || 'Recently'}</span>
              </div>

              <h2 className={styles.annTitle}>{ann.title}</h2>
              <p className={styles.annMessage}>{ann.message}</p>

              {ann.attachmentName && (
                <div className={styles.attachmentPill}>
                  <span>📎</span>
                  <span>{ann.attachmentName}</span>
                </div>
              )}

              <div className={styles.cardFooter}>
                <button
                  className={`${styles.cardActionBtn} ${styles.editBtn}`}
                  onClick={() => handleOpenEdit(ann)}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit
                </button>

                <button
                  className={`${styles.cardActionBtn} ${styles.deleteBtn}`}
                  onClick={() => setDeleteTarget(ann)}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p>No announcements found matching your criteria.</p>
        </div>
      )}

      {/* ── Create / Edit Announcement Modal ── */}
      {modalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingId ? 'Edit Announcement' : 'Post New Course Announcement'}
              </h3>
              <button className={styles.closeBtn} onClick={handleCloseModal}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveAnnouncement}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Target Audience / Course</label>
                  <select
                    className={styles.formInput}
                    value={formData.courseId}
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  >
                    <option value="all">All Assigned Courses</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.id} &ndash; {course.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Announcement Title</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="e.g. Midterm Examination Guidelines"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Message Body</label>
                  <textarea
                    className={styles.formTextarea}
                    placeholder="Provide details regarding timings, room allocations, syllabus coverage, or submission criteria..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Document Attachment (Optional &bull; Max 5MB)
                  </label>
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
                      '+ Attach Reference Document (.pdf, .doc, .docx, .txt, .csv, .xls, .png, .jpg)'
                    )}
                  </label>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                  disabled={submitting}
                >
                  {submitting ? 'Publishing...' : editingId ? 'Save Changes' : 'Broadcast Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Custom Delete Confirmation Modal (no browser alert/localhost prompt) ── */}
      {deleteTarget && (
        <div
          className={styles.modalOverlay}
          onClick={() => !isDeleting && setDeleteTarget(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={styles.modalBox}
            style={{ maxWidth: '440px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle} style={{ color: '#ef4444' }}>
                Delete Announcement
              </h3>
              <button
                className={styles.closeBtn}
                onClick={() => setDeleteTarget(null)}
                aria-label="Close modal"
                disabled={isDeleting}
              >
                &times;
              </button>
            </div>
            <div className={styles.modalBody} style={{ padding: '16px 20px' }}>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-main, #0f172a)', margin: '0 0 8px 0', fontWeight: 600 }}>
                {deleteTarget.title}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)', margin: 0, lineHeight: 1.5 }}>
                Are you sure you want to delete this announcement? This action will permanently remove it from all student feeds.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.7 : 1,
                }}
                onClick={confirmDeleteAnnouncement}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Announcement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
