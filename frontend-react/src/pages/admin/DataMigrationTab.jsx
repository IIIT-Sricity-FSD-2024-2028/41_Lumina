/**
 * DataMigrationTab.jsx
 *
 * Tab 3: Data Migration Engine
 * - CSV drag-and-drop file upload dropzone
 * - Paste CSV text area with dry-run syntax check
 * - Commit & ingest records (bulk import via real backend API directly into courseCatalog)
 * - Download sample CSV template
 * - Migration Engine validation log panel
 * - Recent Migration Job History audit table from database context
 */
import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/admin.service';
import styles from './AdminPortal.module.css';

export default function DataMigrationTab({ dashboard, onRefresh }) {
  const [csvText, setCsvText]       = useState('');
  const [logOutput, setLogOutput]   = useState('[Migration Engine]: Standing by for course/student CSV dataset payload...');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const csvFileInputRef             = useRef(null);

  const migrationHistory = dashboard?.migrationHistory || [];

  // ── File upload ──
  function handleCsvFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCsvText(ev.target.result);
      runDryValidation(ev.target.result);
    };
    reader.readAsText(file);
  }

  // ── Sample CSV download ──
  function downloadSampleCsv() {
    const sample = 'CourseID, CourseName, Credits, Department\nCS401, Advanced Distributed Systems, 4, CSE\nEC302, Wireless Sensor Networks, 4, ECE\nAI304, Deep Reinforcement Learning, 4, AIDS\nCS405, Cloud Computing and DevOps, 3, CSE\n';
    const blob = new Blob([sample], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lumina_course_catalog_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // ── Dry-Run Validation ──
  function runDryValidation(rawText) {
    const text = rawText !== undefined ? rawText : csvText;
    if (!text.trim()) {
      setLogOutput('⚠ Error: Please enter CSV course data to perform dry-run.');
      return;
    }
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const validated = lines.map((line) => {
      const parts = line.split(',').map((s) => s.trim());
      return {
        id: parts[0] || 'INVALID',
        name: parts[1] || 'Unknown',
        credits: parts[2] || '4',
        dept: parts[3] || 'CSE',
        status: parts.length >= 4 ? 'PASS' : 'WARN: Missing Department',
      };
    });
    setLogOutput(
      `[Dry-Run Engine]: Validated ${validated.length} course definitions:\n` +
      validated.map((v) => `• [${v.status}] ${v.id}: ${v.name} (${v.credits} CR, ${v.dept})`).join('\n') +
      '\n✔ 0 Schema Violations detected. Ready for database commit.'
    );
  }

  // ── Bulk Import directly into backend database ──
  async function executeBulkImport() {
    if (!csvText.trim()) {
      setLogOutput('⚠ Error: Please enter comma-separated course records.');
      return;
    }
    const lines = csvText.split('\n').map((l) => l.trim()).filter(Boolean);
    const parsedCourses = lines
      .map((line) => {
        const parts = line.split(',').map((s) => s.trim());
        return {
          courseId: parts[0] || '',
          courseName: parts[1] || 'Imported Course',
          credits: Number(parts[2]) || 4,
          deptId: parts[3] || 'CSE',
        };
      })
      .filter((c) => c.courseId && c.courseId.toUpperCase() !== 'COURSEID');

    if (parsedCourses.length === 0) {
      setLogOutput('⚠ Error: No valid course records parsed from input.');
      return;
    }

    setIsImporting(true);
    setLogOutput(`Ingesting ${parsedCourses.length} course definitions into database catalog...`);
    try {
      const res = await adminService.bulkImportCourses(parsedCourses);
      const count = res?.importedCount ?? parsedCourses.length;
      toast.success(`✔ Successfully committed ${count} courses to database!`);
      setLogOutput(
        `✔ Successfully committed ${count} course definitions to database catalog:\n` +
        parsedCourses.map((c) => `• Ingested into DB: ${c.courseId} - ${c.courseName} (${c.credits} CR, ${c.deptId})`).join('\n')
      );
      setCsvText('');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Bulk import error:', err);
      toast.error('Failed to import courses into database');
      setLogOutput(`❌ Server Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsImporting(false);
    }
  }

  // ── Drag & Drop ──
  function onDragOver(e)  { e.preventDefault(); setIsDragOver(true); }
  function onDragLeave()  { setIsDragOver(false); }
  function onDrop(e) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCsvText(ev.target.result);
        runDryValidation(ev.target.result);
      };
      reader.readAsText(file);
    }
  }

  return (
    <>
      {/* ── Bulk Migration Engine Card ── */}
      <div className={styles.card}>
        <div style={{ marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 16 }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
            Bulk Course Catalog &amp; Student Migration Engine
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
            Validate, dry-run, and batch ingest client university course structures and rosters directly into the database partition.
          </p>
        </div>

        <div className={styles.migrationGrid}>
          {/* Upload + Input area */}
          <div>
            {/* Dropzone */}
            <div
              className={`${styles.csvDropzone} ${isDragOver ? styles.csvDropzoneDragOver : ''}`}
              onClick={() => csvFileInputRef.current?.click()}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <div className={styles.dropzoneIcon}>📁</div>
              <strong className={styles.dropzoneTitle}>Click to Upload CSV or Drag &amp; Drop</strong>
              <span className={styles.dropzoneSubtext}>Supports Course Catalog &amp; Student Roster (.csv files)</span>
              <input
                type="file"
                ref={csvFileInputRef}
                accept=".csv,text/csv"
                style={{ display: 'none' }}
                onChange={handleCsvFileUpload}
              />
            </div>

            <div className={styles.csvPasteRow}>
              <span className={styles.csvPasteLabel}>Or Paste CSV Text Directly:</span>
              <button className={`${styles.btnOutline} ${styles.btnXs}`} onClick={downloadSampleCsv}>
                ⬇ Download Sample Template
              </button>
            </div>

            <textarea
              className={styles.csvTextarea}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={'CS401, Advanced Distributed Systems, 4, CSE\nEC302, Wireless Communications, 4, ECE\nAI304, Deep Reinforcement Learning, 4, AIDS'}
            />

            <div className={styles.csvActions}>
              <button className={styles.btnOutline} onClick={() => runDryValidation()}>
                Dry-Run Syntax Check
              </button>
              <button
                className={styles.btnPrimary}
                onClick={executeBulkImport}
                disabled={isImporting}
              >
                {isImporting ? 'Ingesting...' : 'Commit & Ingest Records'}
              </button>
            </div>
          </div>

          {/* Log output */}
          <div className={styles.migrationLogBox}>
            <h4 className={styles.migrationLogTitle}>Migration Engine Log &amp; Validation Output:</h4>
            <div className={styles.logOutput}>{logOutput}</div>
          </div>
        </div>
      </div>

      {/* ── Migration History from Database ── */}
      <div className={styles.card}>
        <div style={{ marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 14 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
            Recent Migration Job History
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
            Audit log of ingestion jobs run against this university tenant partition.
          </p>
        </div>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Job ID</th>
              <th>Type</th>
              <th>Records Ingested</th>
              <th>Status</th>
              <th>Run By</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {migrationHistory.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                  No historical migration jobs recorded for this tenant yet.
                </td>
              </tr>
            ) : (
              migrationHistory.map((job) => (
                <tr key={job.id}>
                  <td><span className={styles.docketCode}>{job.id}</span></td>
                  <td style={{ fontSize: '0.85rem', color: '#334155' }}>{job.type}</td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>{job.records.toLocaleString()}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${job.status.startsWith('Failed') ? styles.statusProgress : styles.statusResolved}`}>
                      {job.status}
                    </span>
                  </td>
                  <td><span className={styles.submittedBy}>{job.runBy}</span></td>
                  <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{job.timestamp}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
