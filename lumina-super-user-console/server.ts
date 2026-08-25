import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-Memory Database for Lumina Academic Systems
  let dbUsers = [
    { userId: 'S2024001', fullName: 'Eleanor Vance', email: 'e.vance@lumina.edu', role: 'Student', department: 'CSE' },
    { userId: 'F1092834', fullName: 'Dr. Arthur Pendelton', email: 'a.pendelton@lumina.edu', role: 'Faculty', department: 'ECE' },
    { userId: 'D9920102', fullName: 'Dr. Sarah Connor', email: 's.connor@lumina.edu', role: 'Dean', department: 'AIDS' },
    { userId: 'S2024045', fullName: 'John Doe', email: 'j.doe@lumina.edu', role: 'Student', department: 'CSE' },
    { userId: 'F1092850', fullName: 'Prof. Alan Turing', email: 'a.turing@lumina.edu', role: 'Faculty', department: 'CSE' },
    { userId: 'A8830192', fullName: 'Dr. Evelyn Reed', email: 'e.reed@lumina.edu', role: 'Assistant_Dean_1', department: 'ECE' },
    { userId: 'S2024089', fullName: 'Maya Lin', email: 'm.lin@lumina.edu', role: 'Student', department: 'AIDS' },
    { userId: 'S2024102', fullName: 'Lucas Vance', email: 'l.vance@lumina.edu', role: 'Student', department: 'CSE' }
  ];

  let dbCourses = [
    { courseId: 'C101', courseCode: 'CS101', courseName: 'Introduction to Computer Science', credits: 4, department: 'CSE', description: 'Foundations of programming, memory models, and algorithmic thinking.' },
    { courseId: 'C201', courseCode: 'CS201', courseName: 'Data Structures and Algorithms', credits: 4, department: 'CSE', description: 'Trees, graphs, dynamic programming, and complexity analysis.' },
    { courseId: 'C301', courseCode: 'CS301', courseName: 'Operating Systems', credits: 4, department: 'CSE', description: 'Process synchronization, virtual memory, filesystems, and scheduling.' },
    { courseId: 'C305', courseCode: 'AIDS305', courseName: 'Machine Learning Systems', credits: 4, department: 'AIDS', description: 'Supervised learning, deep neural nets, gradient optimization, and evaluation.' },
    { courseId: 'C204', courseCode: 'EC204', courseName: 'Digital Signal Processing', credits: 3, department: 'ECE', description: 'Fourier analysis, filter design, and discrete-time signal manipulation.' }
  ];

  let dbSections = [
    { sectionId: 'SEC-101', courseCode: 'CS101', sectionNumber: '1', instructorName: 'Prof. Alan Turing', room: 'LH-101', capacity: 60, term: 'Fall 2026' },
    { sectionId: 'SEC-102', courseCode: 'CS101', sectionNumber: '2', instructorName: 'Dr. Arthur Pendelton', room: 'LH-102', capacity: 50, term: 'Fall 2026' },
    { sectionId: 'SEC-201', courseCode: 'CS201', sectionNumber: '1', instructorName: 'Prof. Alan Turing', room: 'LH-201', capacity: 60, term: 'Fall 2026' },
    { sectionId: 'SEC-301', courseCode: 'CS301', sectionNumber: '1', instructorName: 'Dr. Sarah Connor', room: 'LH-301', capacity: 60, term: 'Fall 2026' },
    { sectionId: 'SEC-305', courseCode: 'AIDS305', sectionNumber: '1', instructorName: 'Dr. Sarah Connor', room: 'AI-Lab-1', capacity: 45, term: 'Fall 2026' }
  ];

  let dbCourseSlots = [
    { slotId: 'SLOT-01', dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:30', slotType: 'Lecture', room: 'LH-101' },
    { slotId: 'SLOT-02', dayOfWeek: 'Monday', startTime: '11:00', endTime: '12:30', slotType: 'Lecture', room: 'LH-102' },
    { slotId: 'SLOT-03', dayOfWeek: 'Tuesday', startTime: '14:00', endTime: '16:00', slotType: 'Lab', room: 'CS-Lab-3' },
    { slotId: 'SLOT-04', dayOfWeek: 'Wednesday', startTime: '09:00', endTime: '10:30', slotType: 'Lecture', room: 'LH-201' },
    { slotId: 'SLOT-05', dayOfWeek: 'Thursday', startTime: '10:30', endTime: '12:00', slotType: 'Tutorial', room: 'LH-301' }
  ];

  let dbRegistrations = [
    { registrationId: 'REG-1001', studentId: 'S2024001', studentName: 'Eleanor Vance', courseCode: 'CS301', sectionNumber: '1', grade: 'A', status: 'Enrolled' },
    { registrationId: 'REG-1002', studentId: 'S2024001', studentName: 'Eleanor Vance', courseCode: 'AIDS305', sectionNumber: '1', grade: 'IP', status: 'Enrolled' },
    { registrationId: 'REG-1003', studentId: 'S2024045', studentName: 'John Doe', courseCode: 'CS201', sectionNumber: '1', grade: 'B+', status: 'Enrolled' },
    { registrationId: 'REG-1004', studentId: 'S2024089', studentName: 'Maya Lin', courseCode: 'AIDS305', sectionNumber: '1', grade: 'A-', status: 'Enrolled' },
    { registrationId: 'REG-1005', studentId: 'S2024102', studentName: 'Lucas Vance', courseCode: 'CS101', sectionNumber: '2', grade: 'IP', status: 'Enrolled' }
  ];

  let dbOverrides = [
    { overrideId: 'OVR-501', studentId: 'S2024045', studentName: 'John Doe', courseCode: 'CS301', reason: 'Prerequisite waiver requested based on AP credits', status: 'Pending', requestedAt: '2026-08-24 09:15' },
    { overrideId: 'OVR-502', studentId: 'S2024089', studentName: 'Maya Lin', courseCode: 'CS305', reason: 'Capacity override for graduation requirement', status: 'Approved', requestedAt: '2026-08-23 14:30' },
    { overrideId: 'OVR-503', studentId: 'S2024102', studentName: 'Lucas Vance', courseCode: 'EC204', reason: 'Elective schedule conflict resolution', status: 'Rejected', requestedAt: '2026-08-22 11:20' }
  ];

  let dbEnrollmentPhases = [
    { phaseId: 'PHASE-1', phaseName: 'Senior & Graduate Priority Window', startDate: '2026-08-20T08:00', endDate: '2026-08-25T23:59', status: 'Active', eligibleBatch: '2023, 2024' },
    { phaseId: 'PHASE-2', phaseName: 'General Undergrad Enrollment', startDate: '2026-08-26T08:00', endDate: '2026-09-02T23:59', status: 'Scheduled', eligibleBatch: '2025, 2026' },
    { phaseId: 'PHASE-3', phaseName: 'Add/Drop & Late Adjustment', startDate: '2026-09-03T08:00', endDate: '2026-09-10T23:59', status: 'Scheduled', eligibleBatch: 'All Batches' }
  ];

  let dbAnnouncements = [
    { announcementId: 'ANN-01', title: 'Fall 2026 Course Registration Schedule Published', content: 'Phase 1 begins on August 20 for seniors. Please verify prerequisites prior to slot selection.', author: 'Academic Dean Office', targetAudience: 'All', createdAt: '2026-08-18' },
    { announcementId: 'ANN-02', title: 'New Machine Learning Elective Sections Added', content: 'AIDS305 Section 2 has been opened to accommodate high demand.', author: 'Prof. Alan Turing', targetAudience: 'Students', createdAt: '2026-08-22' }
  ];

  // Global RolesGuard Middleware (Checks x-role header)
  const rolesGuard = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const role = req.headers['x-role'];
    if (!role) {
      return res.status(401).json({ message: 'Unauthorized: Missing x-role authentication header' });
    }
    next();
  };

  // --- API Routes ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Lumina Academic Backend' });
  });

  // Users
  app.get('/users', rolesGuard, (req, res) => res.json(dbUsers));
  app.post('/users', rolesGuard, (req, res) => {
    const newUser = { ...req.body };
    if (!newUser.userId) newUser.userId = `U${Date.now().toString().slice(-6)}`;
    dbUsers.push(newUser);
    res.status(201).json(newUser);
  });
  app.put('/users/:id', rolesGuard, (req, res) => {
    const idx = dbUsers.findIndex(u => u.userId === req.params.id);
    if (idx >= 0) {
      dbUsers[idx] = { ...dbUsers[idx], ...req.body };
      res.json(dbUsers[idx]);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  });
  app.delete('/users/:id', rolesGuard, (req, res) => {
    dbUsers = dbUsers.filter(u => u.userId !== req.params.id);
    res.json({ message: 'User deleted successfully' });
  });

  // Courses
  app.get('/courses', rolesGuard, (req, res) => res.json(dbCourses));
  app.post('/courses', rolesGuard, (req, res) => {
    const newCourse = { ...req.body };
    if (!newCourse.courseId) newCourse.courseId = `C${Date.now().toString().slice(-4)}`;
    dbCourses.push(newCourse);
    res.status(201).json(newCourse);
  });
  app.put('/courses/:id', rolesGuard, (req, res) => {
    const idx = dbCourses.findIndex(c => c.courseId === req.params.id || c.courseCode === req.params.id);
    if (idx >= 0) {
      dbCourses[idx] = { ...dbCourses[idx], ...req.body };
      res.json(dbCourses[idx]);
    } else {
      res.status(404).json({ message: 'Course not found' });
    }
  });

  // Sections
  app.get('/sections', rolesGuard, (req, res) => res.json(dbSections));
  app.post('/sections', rolesGuard, (req, res) => {
    const newSec = { ...req.body };
    if (!newSec.sectionId) newSec.sectionId = `SEC-${Date.now().toString().slice(-4)}`;
    dbSections.push(newSec);
    res.status(201).json(newSec);
  });
  app.put('/sections/:id', rolesGuard, (req, res) => {
    const idx = dbSections.findIndex(s => s.sectionId === req.params.id);
    if (idx >= 0) {
      dbSections[idx] = { ...dbSections[idx], ...req.body };
      res.json(dbSections[idx]);
    } else {
      res.status(404).json({ message: 'Section not found' });
    }
  });
  app.delete('/sections/:id', rolesGuard, (req, res) => {
    dbSections = dbSections.filter(s => s.sectionId !== req.params.id);
    res.json({ message: 'Section deleted successfully' });
  });

  // Course Slots
  app.get('/course-slots', rolesGuard, (req, res) => res.json(dbCourseSlots));
  app.post('/course-slots', rolesGuard, (req, res) => {
    const newSlot = { ...req.body };
    if (!newSlot.slotId) newSlot.slotId = `SLOT-${Date.now().toString().slice(-4)}`;
    dbCourseSlots.push(newSlot);
    res.status(201).json(newSlot);
  });
  app.put('/course-slots/:id', rolesGuard, (req, res) => {
    const idx = dbCourseSlots.findIndex(s => s.slotId === req.params.id);
    if (idx >= 0) {
      dbCourseSlots[idx] = { ...dbCourseSlots[idx], ...req.body };
      res.json(dbCourseSlots[idx]);
    } else {
      res.status(404).json({ message: 'Course slot not found' });
    }
  });
  app.delete('/course-slots/:id', rolesGuard, (req, res) => {
    dbCourseSlots = dbCourseSlots.filter(s => s.slotId !== req.params.id);
    res.json({ message: 'Slot deleted successfully' });
  });

  // Registrations (Read + Grade Edit)
  app.get('/registrations', rolesGuard, (req, res) => res.json(dbRegistrations));
  app.patch('/registrations/:id/grade', rolesGuard, (req, res) => {
    const idx = dbRegistrations.findIndex(r => r.registrationId === req.params.id);
    if (idx >= 0) {
      dbRegistrations[idx].grade = req.body.grade;
      res.json(dbRegistrations[idx]);
    } else {
      res.status(404).json({ message: 'Registration record not found' });
    }
  });

  // Overrides (Read + Status Update)
  app.get('/overrides', rolesGuard, (req, res) => res.json(dbOverrides));
  app.patch('/overrides/:id/status', rolesGuard, (req, res) => {
    const idx = dbOverrides.findIndex(o => o.overrideId === req.params.id);
    if (idx >= 0) {
      dbOverrides[idx].status = req.body.status;
      res.json(dbOverrides[idx]);
    } else {
      res.status(404).json({ message: 'Override request not found' });
    }
  });

  // Enrollment Phases
  app.get('/enrollment-phases', rolesGuard, (req, res) => res.json(dbEnrollmentPhases));
  app.post('/enrollment-phases', rolesGuard, (req, res) => {
    const newPhase = { ...req.body };
    if (!newPhase.phaseId) newPhase.phaseId = `PHASE-${Date.now().toString().slice(-4)}`;
    dbEnrollmentPhases.push(newPhase);
    res.status(201).json(newPhase);
  });
  app.put('/enrollment-phases/:id', rolesGuard, (req, res) => {
    const idx = dbEnrollmentPhases.findIndex(p => p.phaseId === req.params.id);
    if (idx >= 0) {
      dbEnrollmentPhases[idx] = { ...dbEnrollmentPhases[idx], ...req.body };
      res.json(dbEnrollmentPhases[idx]);
    } else {
      res.status(404).json({ message: 'Enrollment phase not found' });
    }
  });
  app.delete('/enrollment-phases/:id', rolesGuard, (req, res) => {
    dbEnrollmentPhases = dbEnrollmentPhases.filter(p => p.phaseId !== req.params.id);
    res.json({ message: 'Enrollment phase deleted successfully' });
  });

  // Announcements (Read + Create)
  app.get('/announcements', rolesGuard, (req, res) => res.json(dbAnnouncements));
  app.post('/announcements', rolesGuard, (req, res) => {
    const newAnn = {
      announcementId: `ANN-${Date.now().toString().slice(-4)}`,
      title: req.body.title,
      content: req.body.content,
      author: 'Super User Admin',
      targetAudience: req.body.targetAudience || 'All',
      createdAt: new Date().toISOString().slice(0, 10)
    };
    dbAnnouncements.push(newAnn);
    res.status(201).json(newAnn);
  });

  // Serve static HTML/CSS/JS assets
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Lumina Server running on http://localhost:${PORT}`);
  });
}

startServer();
