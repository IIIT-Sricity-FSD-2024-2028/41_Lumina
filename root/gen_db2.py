lines = []
lines.append("""import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import {
  User, Student, Department, CourseCatalog, DegreeRequirement,
  CoursePrerequisite, AcademicTerm, Section, CourseSlot, Registration,
  OverrideRequest, AcademicRoadmap, Announcement, EnrollmentPhase,
} from './interfaces';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);
  users: User[] = [];
  students: Student[] = [];
  departments: Department[] = [];
  courseCatalog: CourseCatalog[] = [];
  degreeRequirements: DegreeRequirement[] = [];
  coursePrerequisites: CoursePrerequisite[] = [];
  academicTerms: AcademicTerm[] = [];
  sections: Section[] = [];
  courseSlots: CourseSlot[] = [];
  registrations: Registration[] = [];
  overrideRequests: OverrideRequest[] = [];
  academicRoadmaps: AcademicRoadmap[] = [];
  announcements: Announcement[] = [];
  enrollmentPhases: EnrollmentPhase[] = [];

  onModuleInit(): void {
    this.seed();
    this.logger.log('In-memory database seeded successfully.');
  }

  private seed(): void {""")

lines.append("""
    this.departments = [
      { deptId: 'CSE', deptName: 'Computer Science and Engineering', totalRequiredCredits: 160 },
      { deptId: 'ECE', deptName: 'Electronics and Communication Engineering', totalRequiredCredits: 160 },
      { deptId: 'AIDS', deptName: 'Artificial Intelligence and Data Science', totalRequiredCredits: 160 },
    ];""")

# Users
s24 = [('S2024001','Mahtab Alam','mahtab','CSE'),('S2024002','Roshan Karthik','roshan','CSE'),
('S2024003','Manoj Kumar','manoj','ECE'),('S2024004','Ananya Sharma','ananya','CSE'),
('S2024005','Vikram Reddy','vikram','CSE'),('S2024006','Priya Nair','priya.n','CSE'),
('S2024007','Arjun Mehta','arjun','ECE'),('S2024008','Sneha Gupta','sneha','CSE'),
('S2024009','Rahul Verma','rahul','CSE'),('S2024010','Divya Krishnan','divya','AIDS'),
('S2024011','Aditya Singh','aditya','CSE'),('S2024012','Kavya Menon','kavya','CSE')]
s23 = [('S2023001','Nikhil Sharma','nikhil','CSE'),('S2023002','Rithika Reddy','rithika','CSE'),
('S2023003','Meera Iyer','meera','CSE'),('S2023004','Karthik Rajan','karthik.r','CSE'),
('S2023005','Deepa Pillai','deepa','CSE'),('S2023006','Suresh Kumar','suresh','ECE'),
('S2023007','Lakshmi Venkat','lakshmi','CSE'),('S2023008','Arun Nambiar','arun.n','CSE'),
('S2023009','Pooja Desai','pooja','AIDS'),('S2023010','Sanjay Mohan','sanjay','CSE')]
fac = [('F2024001','Dr. Arun P V','arun.pv','CSE'),('F2024002','Dr. Piyush Joshi','piyush.joshi','CSE'),
('F2024003','Dr. Mainak Thakur','mainak.thakur','CSE'),('F2024004','Dr. Sreeja S R','sreeja.sr','CSE'),
('F2024005','Dr. R Selvi','r.selvi','ECE')]
admins = [('A1_2024001','Ravi Kumar','admin1','Assistant_Dean_1','CSE'),
('A2_2024001','Priya Sharma','admin2','Assistant_Dean_2','CSE'),
('D2024001','Super Dean','dean','Dean','CSE')]

lines.append("\n    this.users = [")
for uid,n,e,d in s24+s23:
    lines.append(f"      {{ userId: '{uid}', fullName: '{n}', email: '{e}@lumina.iiits.in', password: 'password123', role: 'Student', deptId: '{d}' }},")
for uid,n,e,d in fac:
    lines.append(f"      {{ userId: '{uid}', fullName: '{n}', email: '{e}@lumina.iiits.in', password: 'password123', role: 'Faculty', deptId: '{d}' }},")
for uid,n,e,r,d in admins:
    lines.append(f"      {{ userId: '{uid}', fullName: '{n}', email: '{e}@lumina.iiits.in', password: 'password123', role: '{r}', deptId: '{d}' }},")
lines.append("    ];")

lines.append("\n    this.students = [")
for uid,_,_,_ in s24:
    lines.append(f"      {{ studentId: '{uid}', enrollmentYear: 2024, currentSemester: 4 }},")
for uid,_,_,_ in s23:
    lines.append(f"      {{ studentId: '{uid}', enrollmentYear: 2023, currentSemester: 6 }},")
lines.append("    ];")

# Academic Terms - FALL→MONSOON
lines.append("""
    this.academicTerms = [
      { termId: 'MONSOON2024', termName: 'Monsoon 2024', startTimestamp: '2024-08-01T00:00:00Z', endTimestamp: '2024-12-15T00:00:00Z', minCreditLimit: 12, maxCreditLimit: 22 },
      { termId: 'SPRING2025', termName: 'Spring 2025', startTimestamp: '2025-01-15T00:00:00Z', endTimestamp: '2025-05-30T00:00:00Z', minCreditLimit: 12, maxCreditLimit: 22 },
      { termId: 'MONSOON2025', termName: 'Monsoon 2025', startTimestamp: '2025-08-01T00:00:00Z', endTimestamp: '2025-12-15T00:00:00Z', minCreditLimit: 12, maxCreditLimit: 22 },
      { termId: 'SPRING2026', termName: 'Spring 2026', startTimestamp: '2026-01-15T00:00:00Z', endTimestamp: '2026-05-30T23:59:59Z', minCreditLimit: 12, maxCreditLimit: 20 },
    ];""")

# Courses (unchanged)
courses = [
    ('IC101','Computer Programming',4,60,'CSE'),('IC102','Discrete Structures and Matrix Algebra',4,60,'CSE'),
    ('IC103','Overview of Computers Workshop',2,60,'CSE'),('IC104','Digital Logic Design',4,60,'ECE'),
    ('SEED01','Essential English',2,60,'CSE'),('SEED02','Foundations in Human Values',2,60,'CSE'),
    ('IC201','Probability and Statistics',4,60,'CSE'),('PC201','Data Structures and Algorithms',4,60,'CSE'),
    ('IC202','Signals and Systems',4,60,'ECE'),('IC203','Computer Architecture',4,60,'ECE'),
    ('SEED03','Operational Communication',2,60,'CSE'),
    ('IC301','Real Analysis and Numerical Methods',4,60,'CSE'),('PC301','Object Oriented Programming',4,60,'CSE'),
    ('PC302','Advanced Data Structures and Algorithms',4,60,'CSE'),('PC303','Operating Systems',4,60,'CSE'),
    ('PC304','Database Management Systems',4,60,'CSE'),('SEED04','Professional Communication',2,60,'CSE'),
    ('PC401','Computer and Communication Networks',4,60,'CSE'),('PC402','Fundamentals of Full Stack Development',4,60,'CSE'),
    ('IC401','Theory of Computation',4,60,'CSE'),('PC403','Artificial Intelligence',4,2,'CSE'),
    ('SEED05','Advanced Communication Skills',2,60,'CSE'),
    ('PC501','Framework Driven Front-End Development',4,60,'CSE'),
    ('PC601','Web Services and Backend Development',4,60,'CSE'),
    ('PE501','Cloud Computing',3,60,'CSE'),('PE502','Introduction to Cyber Security',3,60,'CSE'),
    ('PE503','Machine Learning',3,60,'CSE'),('PE504','Deep Learning',3,60,'CSE'),
    ('PE505','Network and Data Security',3,60,'CSE'),
    ('IE501','Applied Stochastic Models',3,60,'CSE'),('IE502','Introduction to Data Analytics',3,60,'AIDS'),
]
lines.append("\n    this.courseCatalog = [")
for cid,nm,cr,cap,dp in courses:
    c = ' // CAPACITY 2 FOR WAITLIST DEMO' if cap==2 else ''
    lines.append(f"      {{ courseId: '{cid}', courseName: '{nm}', credits: {cr}, courseCapacity: {cap}, status: 'Active', deptId: '{dp}' }},{c}")
lines.append("    ];")

lines.append("""
    this.coursePrerequisites = [
      { targetCourseId: 'PC201',  requiredCourseId: 'IC101' },
      { targetCourseId: 'PC302',  requiredCourseId: 'PC201' },
      { targetCourseId: 'IC203',  requiredCourseId: 'IC104' },
      { targetCourseId: 'PC303',  requiredCourseId: 'IC203' },
      { targetCourseId: 'IC201',  requiredCourseId: 'IC102' },
      { targetCourseId: 'PC501',  requiredCourseId: 'PC402' },
      { targetCourseId: 'PC601',  requiredCourseId: 'PC501' },
      { targetCourseId: 'PE503',  requiredCourseId: 'PC403' },
      { targetCourseId: 'PE504',  requiredCourseId: 'PE503' },
    ];""")

# Degree Requirements with specific courseType
def ctype(cid):
    if cid.startswith('IC'): return 'Institute Core'
    if cid.startswith('PC'): return 'Program Core'
    if cid.startswith('SEED'): return 'SEED'
    return 'Elective'

dr = [(1,'IC101',1),(2,'IC102',1),(3,'IC103',1),(4,'IC104',1),(5,'SEED01',1),(6,'SEED02',1),
(7,'IC201',2),(8,'PC201',2),(9,'IC202',2),(10,'IC203',2),(11,'SEED03',2),
(12,'IC301',3),(13,'PC301',3),(14,'PC302',3),(15,'PC303',3),(16,'PC304',3),(17,'SEED04',3),
(18,'PC401',4),(19,'PC402',4),(20,'IC401',4),(21,'PC403',4),(22,'SEED05',4),
(23,'PC501',5),(24,'PC601',6),
(25,'PE501',5),(26,'PE502',5),(27,'PE503',5),(28,'PE504',6),(29,'PE505',6),
(30,'IE501',5),(31,'IE502',6)]
lines.append("\n    this.degreeRequirements = [")
for rid,cid,sem in dr:
    lines.append(f"      {{ requirementId: {rid}, deptId: 'CSE', courseId: '{cid}', targetSemester: {sem}, courseType: '{ctype(cid)}' }},")
lines.append("    ];")

# Sections S1/S2, cross-year faculty assignments in SPRING2026
# Sem2 courses (2025 batch), Sem4 (2024), Sem6 (2023)
secs = [
    # Sem 2 courses (cross-year)
    ('PC201-S1','S1','PC201'),('PC201-S2','S2','PC201'),
    ('IC201-S1','S1','IC201'),('IC203-S1','S1','IC203'),
    ('SEED03-S1','S1','SEED03'),('IC202-S1','S1','IC202'),
    # Sem 4 courses
    ('PC401-S1','S1','PC401'),('PC401-S2','S2','PC401'),
    ('PC402-S1','S1','PC402'),('PC402-S2','S2','PC402'),
    ('IC401-S1','S1','IC401'),('PC403-S1','S1','PC403'),
    ('SEED05-S1','S1','SEED05'),
    # Sem 6 courses
    ('PC601-S1','S1','PC601'),('PC601-S2','S2','PC601'),
    ('PE503-S1','S1','PE503'),('PE504-S1','S1','PE504'),
]
lines.append("\n    this.sections = [")
for sid,sn,cid in secs:
    lines.append(f"      {{ sectionId: '{sid}', sectionName: '{sn}', courseId: '{cid}', termId: 'SPRING2026' }},")
lines.append("    ];")

# Course Slots - 1h grid, G01-G06, each faculty 3-4 courses across years
# F2024001 Arun: PC402-S1(Sem4), PC601-S1(Sem6), PC201-S1(Sem2) = 3 courses
# F2024002 Piyush: PC403-S1(Sem4), PE503-S1(Sem6), PC201-S2(Sem2), IC201-S1(Sem2) = 4
# F2024003 Mainak: PC401-S1(Sem4), PE504-S1(Sem6), PC401-S2(Sem4), IC203-S1(Sem2) = 4
# F2024004 Sreeja: IC401-S1(Sem4), PC601-S2(Sem6), PC402-S2(Sem4) = 3
# F2024005 Selvi: SEED05-S1(Sem4), SEED03-S1(Sem2), IC202-S1(Sem2) = 3
slots = [
    (1,'PC402-S1','F2024001','G01','Monday','08:45','09:45'),
    (2,'PC402-S1','F2024001','G01','Wednesday','08:45','09:45'),
    (3,'PC601-S1','F2024001','G02','Tuesday','08:45','09:45'),
    (4,'PC601-S1','F2024001','G02','Thursday','08:45','09:45'),
    (5,'PC201-S1','F2024001','G01','Friday','08:45','09:45'),
    (6,'PC403-S1','F2024002','G03','Monday','11:00','12:00'),
    (7,'PC403-S1','F2024002','G03','Wednesday','11:00','12:00'),
    (8,'PE503-S1','F2024002','G03','Tuesday','11:00','12:00'),
    (9,'PE503-S1','F2024002','G03','Thursday','11:00','12:00'),
    (10,'PC201-S2','F2024002','G04','Friday','11:00','12:00'),
    (11,'IC201-S1','F2024002','G04','Monday','14:15','15:15'),
    (12,'PC401-S1','F2024003','G04','Monday','08:45','09:45'),
    (13,'PC401-S1','F2024003','G04','Wednesday','08:45','09:45'),
    (14,'PC401-S2','F2024003','G04','Tuesday','08:45','09:45'),
    (15,'PE504-S1','F2024003','G03','Friday','14:15','15:15'),
    (16,'IC203-S1','F2024003','G04','Thursday','14:15','15:15'),
    (17,'IC401-S1','F2024004','G05','Tuesday','14:15','15:15'),
    (18,'IC401-S1','F2024004','G05','Thursday','14:15','15:15'),
    (19,'PC601-S2','F2024004','G05','Monday','11:00','12:00'),
    (20,'PC402-S2','F2024004','G05','Wednesday','14:15','15:15'),
    (21,'SEED05-S1','F2024005','G06','Tuesday','14:15','15:15'),
    (22,'SEED05-S1','F2024005','G06','Friday','14:15','15:15'),
    (23,'SEED03-S1','F2024005','G06','Monday','14:15','15:15'),
    (24,'IC202-S1','F2024005','G06','Wednesday','11:00','12:00'),
]
lines.append("\n    this.courseSlots = [")
for sid,sec,f,rm,day,st,et in slots:
    lines.append(f"      {{ slotId: {sid}, sectionId: '{sec}', facultyId: '{f}', roomNumber: '{rm}', dayOfWeek: '{day}', startTime: '{st}', endTime: '{et}', syllabus: null }},")
lines.append("    ];")

# Registrations - MONSOON instead of FALL
eid = 100; regs = []
gr = ['A','A','B','B','A','C','A','B','A','A','B','A']
for i,(uid,_,_,_) in enumerate(s24):
    eid+=1; regs.append((eid,uid,'IC101','MONSOON2024','IC101-S1','Enrolled',gr[i]))
    eid+=1; regs.append((eid,uid,'IC104','MONSOON2024','IC104-S1','Enrolled',gr[(i+1)%12]))
    eid+=1; regs.append((eid,uid,'IC102','MONSOON2024','IC102-S1','Enrolled',gr[(i+2)%12]))
for i,(uid,_,_,_) in enumerate(s24):
    g = 'F' if uid=='S2024002' else gr[i]
    eid+=1; regs.append((eid,uid,'PC201','SPRING2025','PC201-S1','Enrolled',g))
    eid+=1; regs.append((eid,uid,'IC203','SPRING2025','IC203-S1','Enrolled',gr[(i+3)%12]))
for i,(uid,_,_,_) in enumerate(s24):
    if uid!='S2024002':
        eid+=1; regs.append((eid,uid,'PC303','MONSOON2025','PC303-S1','Enrolled',gr[i]))
for i,(uid,_,_,_) in enumerate(s23[:8]):
    eid+=1; regs.append((eid,uid,'PC501','MONSOON2025','PC501-S1','Enrolled',gr[i]))
# SPRING2026 current
for uid,_,_,_ in s24[:8]:
    eid+=1; regs.append((eid,uid,'PC402','SPRING2026','PC402-S1','Enrolled',None))
for uid,_,_,_ in s24[8:]:
    eid+=1; regs.append((eid,uid,'PC402','SPRING2026','PC402-S2','Enrolled',None))
for uid,_,_,_ in s24[:6]:
    eid+=1; regs.append((eid,uid,'PC401','SPRING2026','PC401-S1','Enrolled',None))
for uid,_,_,_ in s24[6:10]:
    eid+=1; regs.append((eid,uid,'PC401','SPRING2026','PC401-S2','Enrolled',None))
for uid,_,_,_ in s24[:5]:
    eid+=1; regs.append((eid,uid,'IC401','SPRING2026','IC401-S1','Enrolled',None))
eid+=1; regs.append((eid,'S2024003','PC403','SPRING2026','PC403-S1','Enrolled',None))
eid+=1; regs.append((eid,'S2024007','PC403','SPRING2026','PC403-S1','Enrolled',None))
for uid,_,_,_ in s24[4:8]:
    eid+=1; regs.append((eid,uid,'SEED05','SPRING2026','SEED05-S1','Enrolled',None))
for uid,_,_,_ in s23[:6]:
    eid+=1; regs.append((eid,uid,'PC601','SPRING2026','PC601-S1','Enrolled',None))
for uid,_,_,_ in s23[:4]:
    eid+=1; regs.append((eid,uid,'PE503','SPRING2026','PE503-S1','Enrolled',None))
for uid,_,_,_ in s23[4:7]:
    eid+=1; regs.append((eid,uid,'PE504','SPRING2026','PE504-S1','Enrolled',None))

lines.append("\n    this.registrations = [")
for r in regs:
    gv = f"'{r[6]}'" if r[6] else 'null'
    c = ' // Roshan FAILED - prerequisite demo' if r[1]=='S2024002' and r[2]=='PC201' and r[6]=='F' else ''
    lines.append(f"      {{ enrollmentId: {r[0]}, studentId: '{r[1]}', courseId: '{r[2]}', termId: '{r[3]}', sectionId: '{r[4]}', status: '{r[5]}', finalGrade: {gv} }},{c}")
lines.append("    ];")

lines.append("""
    this.overrideRequests = [
      { requestId: 1, studentId: 'S2024002', courseId: 'PC302', reason: 'Failed prerequisite PC201 but need Advanced DSA to graduate on time.', approvalStatus: 'Pending', createdAt: '2026-04-24T10:00:00Z' },
      { requestId: 2, studentId: 'S2024010', courseId: 'PC303', reason: 'Timetable clash with IC401 section.', approvalStatus: 'Approved', createdAt: '2026-04-20T12:45:00Z' },
      { requestId: 3, studentId: 'S2023006', courseId: 'PE503', reason: 'Need ML elective for placement preparation.', approvalStatus: 'Pending', createdAt: '2026-04-22T09:30:00Z' },
    ];
    this.academicRoadmaps = [];
    this.announcements = [
      { announcementId: 1, facultyId: 'F2024001', courseId: 'PC402', title: 'Welcome to Full Stack Development', message: 'Please review the syllabus and set up your development environment before the first lab.', createdAt: '2026-04-20T08:00:00Z' },
      { announcementId: 2, facultyId: 'F2024002', courseId: 'PC403', title: 'AI Lab Guidelines', message: 'Python 3.10+ and Jupyter Notebook are required. Install before Monday.', createdAt: '2026-04-21T09:30:00Z' },
      { announcementId: 3, facultyId: 'F2024004', courseId: 'PC601', title: 'Project Submission Deadline', message: 'Final backend project submissions are due by May 15th. No extensions.', createdAt: '2026-04-25T14:00:00Z' },
      { announcementId: 4, facultyId: 'F2024003', courseId: 'PC401', title: 'Midterm Exam Schedule', message: 'Networks midterm is scheduled for May 10th, 10:00 AM in G04.', createdAt: '2026-04-26T11:00:00Z' },
      { announcementId: 5, facultyId: 'F2024002', courseId: 'PE503', title: 'ML Assignment 1 Released', message: 'Assignment 1 on Linear Regression is now available. Due in 2 weeks.', createdAt: '2026-04-27T10:00:00Z' },
    ];
    this.enrollmentPhases = [
      { id: 1, name: 'Final Year Registration', eligibleGroups: 'Final Year', timeline: 'Apr 25 - Apr 27', status: 'Completed' },
      { id: 2, name: '3rd Year Registration', eligibleGroups: '3rd Year', timeline: 'Apr 28 - Apr 30', status: 'Completed' },
      { id: 3, name: 'Open Enrollment', eligibleGroups: 'All Students', timeline: 'May 1 - May 10', status: 'Active' },
    ];
  }
}
""")

with open('/home/mahtab/FFSD/root/back-end/src/database/database.service.ts','w') as f:
    f.write('\n'.join(lines))

# Faculty course summary
fac_courses = {}
for _,sec,f,_,_,_,_ in slots:
    cid = sec.rsplit('-',1)[0]
    fac_courses.setdefault(f,set()).add(cid)
print("Faculty course assignments:")
fnames = {'F2024001':'Arun','F2024002':'Piyush','F2024003':'Mainak','F2024004':'Sreeja','F2024005':'Selvi'}
for f,cs in fac_courses.items():
    print(f"  {fnames[f]}: {sorted(cs)} ({len(cs)} courses)")
print(f"Registrations: {len(regs)}")
