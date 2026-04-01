/* ==============================================================================
   LUMINA MOCK DATABASE (mockData.js) - INSTITUTE SPECIFIC DATASET
   ============================================================================== */

const mockDatabase = {
  Department: [
    { Dept_ID: 'CSE', Dept_Name: 'Computer Science and Engineering', Total_Required_Credits: 160 },
    { Dept_ID: 'ECE', Dept_Name: 'Electronics and Communication Engineering', Total_Required_Credits: 160 },
    { Dept_ID: 'AIDS', Dept_Name: 'Artificial Intelligence and Data Science', Total_Required_Credits: 160 }
  ],

  Users: [
    { User_ID: 'S2024001', Full_Name: 'Mahtab Alam', Email: 'mahtab@lumina.iiits.in', Password: 'password123', Role: 'Student', Dept_ID: 'CSE' },
    { User_ID: 'S2024002', Full_Name: 'Roshan Karthik', Email: 'roshan@lumina.iiits.in', Password: 'password123', Role: 'Student', Dept_ID: 'CSE' },
    { User_ID: 'S2024003', Full_Name: 'Manoj Kumar', Email: 'manoj@lumina.iiits.in', Password: 'password123', Role: 'Student', Dept_ID: 'ECE' },
    { User_ID: 'S2024004', Full_Name: 'Priya Sharma', Email: 'priya@lumina.iiits.in', Password: 'password123', Role: 'Student', Dept_ID: 'AIDS' },
    { User_ID: 'S2024005', Full_Name: 'Rahul Verma', Email: 'rahul@lumina.iiits.in', Password: 'password123', Role: 'Student', Dept_ID: 'CSE' },
    { User_ID: 'S2024006', Full_Name: 'Ananya Singh', Email: 'ananya@lumina.iiits.in', Password: 'password123', Role: 'Student', Dept_ID: 'ECE' },
    { User_ID: 'S2024007', Full_Name: 'Karthik Reddy', Email: 'karthik@lumina.iiits.in', Password: 'password123', Role: 'Student', Dept_ID: 'AIDS' },
    { User_ID: 'S2024008', Full_Name: 'Neha Gupta', Email: 'neha@lumina.iiits.in', Password: 'password123', Role: 'Student', Dept_ID: 'CSE' },
    { User_ID: 'S2024009', Full_Name: 'Aditya Desai', Email: 'aditya@lumina.iiits.in', Password: 'password123', Role: 'Student', Dept_ID: 'ECE' },
    { User_ID: 'S2024010', Full_Name: 'Sneha Patel', Email: 'sneha@lumina.iiits.in', Password: 'password123', Role: 'Student', Dept_ID: 'AIDS' },
    { User_ID: 'S2023011', Full_Name: 'Dev Kumar', Email: 'dev@lumina.iiits.in', Password: 'password123', Role: 'Student', Dept_ID: 'CSE' },
    { User_ID: 'S2023012', Full_Name: 'Fatima Khan', Email: 'fatima@lumina.iiits.in', Password: 'password123', Role: 'Student', Dept_ID: 'ECE' },
    { User_ID: 'S2023013', Full_Name: 'Vivek Nair', Email: 'vivek@lumina.iiits.in', Password: 'password123', Role: 'Student', Dept_ID: 'AIDS' },
    { User_ID: 'S2023014', Full_Name: 'Harsha Menon', Email: 'harsha@lumina.iiits.in', Password: 'password123', Role: 'Student', Dept_ID: 'CSE' },
    { User_ID: 'S2023015', Full_Name: 'Farhan Ali', Email: 'farhan@lumina.iiits.in', Password: 'password123', Role: 'Student', Dept_ID: 'ECE' },
    { User_ID: 'S2022014', Full_Name: 'Rohit Sen', Email: 'rohitsen@lumina.iiits.in', Password: 'password123', Role: 'Student', Dept_ID: 'CSE' },
    { User_ID: 'S2022015', Full_Name: 'Meera Iyer', Email: 'meera@lumina.iiits.in', Password: 'password123', Role: 'Student', Dept_ID: 'ECE' },
    { User_ID: 'S2022016', Full_Name: 'Arjun Das', Email: 'arjun@lumina.iiits.in', Password: 'password123', Role: 'Student', Dept_ID: 'AIDS' },
    { User_ID: 'S2022017', Full_Name: 'Naveen Raj', Email: 'naveen@lumina.iiits.in', Password: 'password123', Role: 'Student', Dept_ID: 'CSE' },
    { User_ID: 'S2022018', Full_Name: 'Sara Thomas', Email: 'sarathomas@lumina.iiits.in', Password: 'password123', Role: 'Student', Dept_ID: 'ECE' },
    { User_ID: 'S2021017', Full_Name: 'Nikita Roy', Email: 'nikita@lumina.iiits.in', Password: 'password123', Role: 'Student', Dept_ID: 'CSE' },
    { User_ID: 'S2021018', Full_Name: 'Sahil Jain', Email: 'sahil@lumina.iiits.in', Password: 'password123', Role: 'Student', Dept_ID: 'ECE' },
    { User_ID: 'S2021019', Full_Name: 'Isha Rao', Email: 'isha@lumina.iiits.in', Password: 'password123', Role: 'Student', Dept_ID: 'AIDS' },
    { User_ID: 'S2021020', Full_Name: 'Aditi Kulkarni', Email: 'aditi@lumina.iiits.in', Password: 'password123', Role: 'Student', Dept_ID: 'CSE' },
    { User_ID: 'S2021021', Full_Name: 'Joel Mathew', Email: 'joel@lumina.iiits.in', Password: 'password123', Role: 'Student', Dept_ID: 'ECE' },
    { User_ID: 'F2024001', Full_Name: 'Dr. Arun P V', Email: 'arun.pv@lumina.iiits.in', Password: 'password123', Role: 'Faculty', Dept_ID: 'CSE' },
    { User_ID: 'F2024002', Full_Name: 'Dr. Sriram K', Email: 'sriram@lumina.iiits.in', Password: 'password123', Role: 'Faculty', Dept_ID: 'ECE' },
    { User_ID: 'F2024003', Full_Name: 'Dr. Megha R', Email: 'megha@lumina.iiits.in', Password: 'password123', Role: 'Faculty', Dept_ID: 'AIDS' },
    { User_ID: 'F2024010', Full_Name: 'Dr. Raja Vara Prasad', Email: 'raja.varaprasad@lumina.iiits.in', Password: 'password123', Role: 'Faculty', Dept_ID: 'CSE' },
    { User_ID: 'F2024011', Full_Name: 'Dr. Bulla Rajesh', Email: 'bulla.rajesh@lumina.iiits.in', Password: 'password123', Role: 'Faculty', Dept_ID: 'CSE' },
    { User_ID: 'F2024012', Full_Name: 'Dr. Mrinmoy Ghorai', Email: 'mrinmoy.ghorai@lumina.iiits.in', Password: 'password123', Role: 'Faculty', Dept_ID: 'CSE' },
    { User_ID: 'A1_2024001', Full_Name: 'Ravi Kumar', Email: 'admin1@lumina.iiits.in', Password: 'password123', Role: 'Assistant_Dean_1', Dept_ID: 'CSE' },
    { User_ID: 'A2_2024001', Full_Name: 'Eswar Vardhan', Email: 'admin2@lumina.iiits.in', Password: 'password123', Role: 'Assistant_Dean_2', Dept_ID: 'CSE' },
    { User_ID: 'D2024001', Full_Name: 'Super Dean', Email: 'dean@lumina.iiits.in', Password: 'password123', Role: 'Dean', Dept_ID: 'CSE' }
  ],

  Students: [
    { Student_ID: 'S2024001', Current_Semester: 2, Enrollment_Year: 2024 },
    { Student_ID: 'S2024002', Current_Semester: 4, Enrollment_Year: 2024 },
    { Student_ID: 'S2024003', Current_Semester: 2, Enrollment_Year: 2024 },
    { Student_ID: 'S2024004', Current_Semester: 2, Enrollment_Year: 2024 },
    { Student_ID: 'S2024005', Current_Semester: 2, Enrollment_Year: 2024 },
    { Student_ID: 'S2024006', Current_Semester: 2, Enrollment_Year: 2024 },
    { Student_ID: 'S2024007', Current_Semester: 2, Enrollment_Year: 2024 },
    { Student_ID: 'S2024008', Current_Semester: 2, Enrollment_Year: 2024 },
    { Student_ID: 'S2024009', Current_Semester: 2, Enrollment_Year: 2024 },
    { Student_ID: 'S2024010', Current_Semester: 2, Enrollment_Year: 2024 },
    { Student_ID: 'S2023011', Current_Semester: 4, Enrollment_Year: 2023 },
    { Student_ID: 'S2023012', Current_Semester: 4, Enrollment_Year: 2023 },
    { Student_ID: 'S2023013', Current_Semester: 4, Enrollment_Year: 2023 },
    { Student_ID: 'S2023014', Current_Semester: 4, Enrollment_Year: 2023 },
    { Student_ID: 'S2023015', Current_Semester: 4, Enrollment_Year: 2023 },
    { Student_ID: 'S2022014', Current_Semester: 6, Enrollment_Year: 2022 },
    { Student_ID: 'S2022015', Current_Semester: 6, Enrollment_Year: 2022 },
    { Student_ID: 'S2022016', Current_Semester: 6, Enrollment_Year: 2022 },
    { Student_ID: 'S2022017', Current_Semester: 6, Enrollment_Year: 2022 },
    { Student_ID: 'S2022018', Current_Semester: 6, Enrollment_Year: 2022 },
    { Student_ID: 'S2021017', Current_Semester: 8, Enrollment_Year: 2021 },
    { Student_ID: 'S2021018', Current_Semester: 8, Enrollment_Year: 2021 },
    { Student_ID: 'S2021019', Current_Semester: 8, Enrollment_Year: 2021 },
    { Student_ID: 'S2021020', Current_Semester: 8, Enrollment_Year: 2021 },
    { Student_ID: 'S2021021', Current_Semester: 8, Enrollment_Year: 2021 }
  ],

  Course_Catalog: [
    { Course_ID: 'IC101', Course_Name: 'Computational Thinking', Credits: 4, Course_Capacity: 120, Status: 'Active', Dept_ID: 'CSE' },
    { Course_ID: 'PC101', Course_Name: 'Programming Studio', Credits: 4, Course_Capacity: 60, Status: 'Active', Dept_ID: 'CSE' },
    { Course_ID: 'EL101', Course_Name: 'Creative Computing', Credits: 3, Course_Capacity: 60, Status: 'Active', Dept_ID: 'CSE' },
    { Course_ID: 'EL111', Course_Name: 'Circuit Prototyping Basics', Credits: 3, Course_Capacity: 60, Status: 'Active', Dept_ID: 'ECE' },
    { Course_ID: 'EL121', Course_Name: 'Foundations of Analytics', Credits: 3, Course_Capacity: 60, Status: 'Active', Dept_ID: 'AIDS' },
    { Course_ID: 'SE101', Course_Name: 'Design Thinking & Innovation', Credits: 2, Course_Capacity: 120, Status: 'Active', Dept_ID: 'CSE' },
    { Course_ID: 'IC102', Course_Name: 'Discrete Mathematics', Credits: 4, Course_Capacity: 120, Status: 'Active', Dept_ID: 'CSE' },
    { Course_ID: 'PC102', Course_Name: 'Digital Systems Fundamentals', Credits: 4, Course_Capacity: 60, Status: 'Active', Dept_ID: 'ECE' },
    { Course_ID: 'EL102', Course_Name: 'Professional Communication', Credits: 3, Course_Capacity: 60, Status: 'Active', Dept_ID: 'ECE' },
    { Course_ID: 'SE102', Course_Name: 'Ethics and Everyday Life', Credits: 2, Course_Capacity: 120, Status: 'Active', Dept_ID: 'CSE' },
    { Course_ID: 'IC201', Course_Name: 'Data Structures', Credits: 4, Course_Capacity: 120, Status: 'Active', Dept_ID: 'CSE' },
    { Course_ID: 'PC201', Course_Name: 'Signals and Systems', Credits: 4, Course_Capacity: 60, Status: 'Active', Dept_ID: 'ECE' },
    { Course_ID: 'EL201', Course_Name: 'Open Source Tools Lab', Credits: 3, Course_Capacity: 60, Status: 'Active', Dept_ID: 'CSE' },
    { Course_ID: 'EL211', Course_Name: 'Communication Circuits Workshop', Credits: 3, Course_Capacity: 60, Status: 'Active', Dept_ID: 'ECE' },
    { Course_ID: 'EL221', Course_Name: 'Applied Data Storytelling', Credits: 3, Course_Capacity: 60, Status: 'Active', Dept_ID: 'AIDS' },
    { Course_ID: 'SE201', Course_Name: 'Skills for Employability', Credits: 2, Course_Capacity: 120, Status: 'Active', Dept_ID: 'CSE' },
    { Course_ID: 'IC202', Course_Name: 'Probability and Statistics', Credits: 4, Course_Capacity: 120, Status: 'Active', Dept_ID: 'CSE' },
    { Course_ID: 'PC202', Course_Name: 'Machine Learning Fundamentals', Credits: 4, Course_Capacity: 60, Status: 'Active', Dept_ID: 'AIDS' },
    { Course_ID: 'EL202', Course_Name: 'Data Visualization Basics', Credits: 3, Course_Capacity: 60, Status: 'Active', Dept_ID: 'AIDS' },
    { Course_ID: 'SE202', Course_Name: 'Quantitative and Reasoning Aptitude', Credits: 2, Course_Capacity: 120, Status: 'Active', Dept_ID: 'CSE' },
    { Course_ID: 'IC301', Course_Name: 'Operating Systems', Credits: 4, Course_Capacity: 120, Status: 'Active', Dept_ID: 'CSE' },
    { Course_ID: 'PC301', Course_Name: 'Microprocessors and Microcontrollers', Credits: 4, Course_Capacity: 60, Status: 'Active', Dept_ID: 'ECE' },
    { Course_ID: 'EL301', Course_Name: 'Cloud Fundamentals', Credits: 3, Course_Capacity: 60, Status: 'Active', Dept_ID: 'CSE' },
    { Course_ID: 'EL311', Course_Name: 'Embedded Interface Design', Credits: 3, Course_Capacity: 60, Status: 'Active', Dept_ID: 'ECE' },
    { Course_ID: 'EL321', Course_Name: 'Applied AI Systems', Credits: 3, Course_Capacity: 60, Status: 'Active', Dept_ID: 'AIDS' },
    { Course_ID: 'SE301', Course_Name: 'Personal Growth Programme', Credits: 2, Course_Capacity: 120, Status: 'Active', Dept_ID: 'CSE' },
    { Course_ID: 'IC302', Course_Name: 'Database Management Systems', Credits: 4, Course_Capacity: 120, Status: 'Active', Dept_ID: 'CSE' },
    { Course_ID: 'PC302', Course_Name: 'Deep Learning', Credits: 4, Course_Capacity: 60, Status: 'Active', Dept_ID: 'AIDS' },
    { Course_ID: 'EL302', Course_Name: 'Embedded Applications', Credits: 3, Course_Capacity: 60, Status: 'Active', Dept_ID: 'ECE' },
    { Course_ID: 'SE302', Course_Name: 'Macro-economics and Personal Finance', Credits: 2, Course_Capacity: 120, Status: 'Active', Dept_ID: 'CSE' },
    { Course_ID: 'IC401', Course_Name: 'Computer Networks', Credits: 4, Course_Capacity: 120, Status: 'Active', Dept_ID: 'CSE' },
    { Course_ID: 'PC401', Course_Name: 'VLSI Design', Credits: 4, Course_Capacity: 60, Status: 'Active', Dept_ID: 'ECE' },
    { Course_ID: 'EL411', Course_Name: 'Secure Systems Practice', Credits: 3, Course_Capacity: 60, Status: 'Active', Dept_ID: 'CSE' },
    { Course_ID: 'EL401', Course_Name: 'IoT Systems Design', Credits: 3, Course_Capacity: 60, Status: 'Active', Dept_ID: 'ECE' },
    { Course_ID: 'EL421', Course_Name: 'Responsible Data Platforms', Credits: 3, Course_Capacity: 60, Status: 'Active', Dept_ID: 'AIDS' },
    { Course_ID: 'SE401', Course_Name: 'Climate Change and its Implications', Credits: 2, Course_Capacity: 120, Status: 'Active', Dept_ID: 'CSE' },
    { Course_ID: 'IC402', Course_Name: 'Software Engineering', Credits: 4, Course_Capacity: 120, Status: 'Active', Dept_ID: 'CSE' },
    { Course_ID: 'PC402', Course_Name: 'Big Data Analytics', Credits: 4, Course_Capacity: 60, Status: 'Active', Dept_ID: 'AIDS' },
    { Course_ID: 'EL402', Course_Name: 'Responsible AI Practices', Credits: 3, Course_Capacity: 60, Status: 'Active', Dept_ID: 'AIDS' },
    { Course_ID: 'SE402', Course_Name: 'ICT for Development', Credits: 2, Course_Capacity: 120, Status: 'Active', Dept_ID: 'CSE' }
  ],

  Degree_Requirements: [
    { Requirement_ID: 1, Dept_ID: 'CSE', Course_ID: 'IC101', Course_Type: 'Institute Core', Target_Semester: 1 },
    { Requirement_ID: 2, Dept_ID: 'CSE', Course_ID: 'PC101', Course_Type: 'Program Core', Target_Semester: 1 },
    { Requirement_ID: 3, Dept_ID: 'CSE', Course_ID: 'EL101', Course_Type: 'Elective', Target_Semester: 1 },
    { Requirement_ID: 4, Dept_ID: 'ECE', Course_ID: 'EL111', Course_Type: 'Elective', Target_Semester: 1 },
    { Requirement_ID: 5, Dept_ID: 'AIDS', Course_ID: 'EL121', Course_Type: 'Elective', Target_Semester: 1 },
    { Requirement_ID: 6, Dept_ID: 'CSE', Course_ID: 'SE101', Course_Type: 'SEED', Target_Semester: 1 },
    { Requirement_ID: 7, Dept_ID: 'CSE', Course_ID: 'IC102', Course_Type: 'Institute Core', Target_Semester: 2 },
    { Requirement_ID: 8, Dept_ID: 'ECE', Course_ID: 'PC102', Course_Type: 'Program Core', Target_Semester: 2 },
    { Requirement_ID: 9, Dept_ID: 'ECE', Course_ID: 'EL102', Course_Type: 'Elective', Target_Semester: 2 },
    { Requirement_ID: 10, Dept_ID: 'CSE', Course_ID: 'SE102', Course_Type: 'SEED', Target_Semester: 2 },
    { Requirement_ID: 11, Dept_ID: 'CSE', Course_ID: 'IC201', Course_Type: 'Institute Core', Target_Semester: 3 },
    { Requirement_ID: 12, Dept_ID: 'ECE', Course_ID: 'PC201', Course_Type: 'Program Core', Target_Semester: 3 },
    { Requirement_ID: 13, Dept_ID: 'CSE', Course_ID: 'EL201', Course_Type: 'Elective', Target_Semester: 3 },
    { Requirement_ID: 14, Dept_ID: 'ECE', Course_ID: 'EL211', Course_Type: 'Elective', Target_Semester: 3 },
    { Requirement_ID: 15, Dept_ID: 'AIDS', Course_ID: 'EL221', Course_Type: 'Elective', Target_Semester: 3 },
    { Requirement_ID: 16, Dept_ID: 'CSE', Course_ID: 'SE201', Course_Type: 'SEED', Target_Semester: 3 },
    { Requirement_ID: 17, Dept_ID: 'CSE', Course_ID: 'IC202', Course_Type: 'Institute Core', Target_Semester: 4 },
    { Requirement_ID: 18, Dept_ID: 'AIDS', Course_ID: 'PC202', Course_Type: 'Program Core', Target_Semester: 4 },
    { Requirement_ID: 19, Dept_ID: 'AIDS', Course_ID: 'EL202', Course_Type: 'Elective', Target_Semester: 4 },
    { Requirement_ID: 20, Dept_ID: 'CSE', Course_ID: 'SE202', Course_Type: 'SEED', Target_Semester: 4 },
    { Requirement_ID: 21, Dept_ID: 'CSE', Course_ID: 'IC301', Course_Type: 'Institute Core', Target_Semester: 5 },
    { Requirement_ID: 22, Dept_ID: 'ECE', Course_ID: 'PC301', Course_Type: 'Program Core', Target_Semester: 5 },
    { Requirement_ID: 23, Dept_ID: 'CSE', Course_ID: 'EL301', Course_Type: 'Elective', Target_Semester: 5 },
    { Requirement_ID: 24, Dept_ID: 'ECE', Course_ID: 'EL311', Course_Type: 'Elective', Target_Semester: 5 },
    { Requirement_ID: 25, Dept_ID: 'AIDS', Course_ID: 'EL321', Course_Type: 'Elective', Target_Semester: 5 },
    { Requirement_ID: 26, Dept_ID: 'CSE', Course_ID: 'SE301', Course_Type: 'SEED', Target_Semester: 5 },
    { Requirement_ID: 27, Dept_ID: 'CSE', Course_ID: 'IC302', Course_Type: 'Institute Core', Target_Semester: 6 },
    { Requirement_ID: 28, Dept_ID: 'AIDS', Course_ID: 'PC302', Course_Type: 'Program Core', Target_Semester: 6 },
    { Requirement_ID: 29, Dept_ID: 'ECE', Course_ID: 'EL302', Course_Type: 'Elective', Target_Semester: 6 },
    { Requirement_ID: 30, Dept_ID: 'CSE', Course_ID: 'SE302', Course_Type: 'SEED', Target_Semester: 6 },
    { Requirement_ID: 31, Dept_ID: 'CSE', Course_ID: 'IC401', Course_Type: 'Institute Core', Target_Semester: 7 },
    { Requirement_ID: 32, Dept_ID: 'ECE', Course_ID: 'PC401', Course_Type: 'Program Core', Target_Semester: 7 },
    { Requirement_ID: 33, Dept_ID: 'CSE', Course_ID: 'EL411', Course_Type: 'Elective', Target_Semester: 7 },
    { Requirement_ID: 34, Dept_ID: 'ECE', Course_ID: 'EL401', Course_Type: 'Elective', Target_Semester: 7 },
    { Requirement_ID: 35, Dept_ID: 'AIDS', Course_ID: 'EL421', Course_Type: 'Elective', Target_Semester: 7 },
    { Requirement_ID: 36, Dept_ID: 'CSE', Course_ID: 'SE401', Course_Type: 'SEED', Target_Semester: 7 },
    { Requirement_ID: 37, Dept_ID: 'CSE', Course_ID: 'IC402', Course_Type: 'Institute Core', Target_Semester: 8 },
    { Requirement_ID: 38, Dept_ID: 'AIDS', Course_ID: 'PC402', Course_Type: 'Program Core', Target_Semester: 8 },
    { Requirement_ID: 39, Dept_ID: 'AIDS', Course_ID: 'EL402', Course_Type: 'Elective', Target_Semester: 8 },
    { Requirement_ID: 40, Dept_ID: 'CSE', Course_ID: 'SE402', Course_Type: 'SEED', Target_Semester: 8 }
  ],

  Course_Prerequisite: [
    { Target_Course_ID: 'IC201', Required_Course_ID: 'IC101' },
    { Target_Course_ID: 'IC301', Required_Course_ID: 'IC201' },
    { Target_Course_ID: 'IC302', Required_Course_ID: 'IC201' },
    { Target_Course_ID: 'IC401', Required_Course_ID: 'IC301' },
    { Target_Course_ID: 'IC402', Required_Course_ID: 'IC302' },
    { Target_Course_ID: 'PC201', Required_Course_ID: 'PC102' },
    { Target_Course_ID: 'PC202', Required_Course_ID: 'IC202' },
    { Target_Course_ID: 'PC301', Required_Course_ID: 'PC201' },
    { Target_Course_ID: 'PC302', Required_Course_ID: 'PC202' },
    { Target_Course_ID: 'PC401', Required_Course_ID: 'PC301' },
    { Target_Course_ID: 'PC402', Required_Course_ID: 'PC302' }
  ],

  Academic_Term: [
    { Term_ID: 'MONSOON2026', Term_Name: 'Monsoon 2026', Start_Timestamp: '2026-08-01T00:00:00Z', End_Timestamp: '2026-12-15T00:00:00Z', Min_Credit_Limit: 12, Max_Credit_Limit: 26 },
    { Term_ID: 'SPRING2027', Term_Name: 'Spring 2027', Start_Timestamp: '2027-01-05T00:00:00Z', End_Timestamp: '2027-05-15T00:00:00Z', Min_Credit_Limit: 12, Max_Credit_Limit: 26 }
  ],

  Section: [
    { Section_ID: 'IC101-S1', Section_Name: 'S1', Course_ID: 'IC101', Term_ID: 'MONSOON2026' },
    { Section_ID: 'PC101-S1', Section_Name: 'S1', Course_ID: 'PC101', Term_ID: 'MONSOON2026' },
    { Section_ID: 'EL101-S1', Section_Name: 'S1', Course_ID: 'EL101', Term_ID: 'MONSOON2026' },
    { Section_ID: 'EL111-S1', Section_Name: 'S1', Course_ID: 'EL111', Term_ID: 'MONSOON2026' },
    { Section_ID: 'EL121-S1', Section_Name: 'S1', Course_ID: 'EL121', Term_ID: 'MONSOON2026' },
    { Section_ID: 'SE101-S1', Section_Name: 'S1', Course_ID: 'SE101', Term_ID: 'MONSOON2026' },
    { Section_ID: 'IC201-S1', Section_Name: 'S1', Course_ID: 'IC201', Term_ID: 'MONSOON2026' },
    { Section_ID: 'PC201-S1', Section_Name: 'S1', Course_ID: 'PC201', Term_ID: 'MONSOON2026' },
    { Section_ID: 'EL201-S1', Section_Name: 'S1', Course_ID: 'EL201', Term_ID: 'MONSOON2026' },
    { Section_ID: 'EL211-S1', Section_Name: 'S1', Course_ID: 'EL211', Term_ID: 'MONSOON2026' },
    { Section_ID: 'EL221-S1', Section_Name: 'S1', Course_ID: 'EL221', Term_ID: 'MONSOON2026' },
    { Section_ID: 'SE201-S1', Section_Name: 'S1', Course_ID: 'SE201', Term_ID: 'MONSOON2026' },
    { Section_ID: 'IC301-S1', Section_Name: 'S1', Course_ID: 'IC301', Term_ID: 'MONSOON2026' },
    { Section_ID: 'PC301-S1', Section_Name: 'S1', Course_ID: 'PC301', Term_ID: 'MONSOON2026' },
    { Section_ID: 'EL301-S1', Section_Name: 'S1', Course_ID: 'EL301', Term_ID: 'MONSOON2026' },
    { Section_ID: 'EL311-S1', Section_Name: 'S1', Course_ID: 'EL311', Term_ID: 'MONSOON2026' },
    { Section_ID: 'EL321-S1', Section_Name: 'S1', Course_ID: 'EL321', Term_ID: 'MONSOON2026' },
    { Section_ID: 'SE301-S1', Section_Name: 'S1', Course_ID: 'SE301', Term_ID: 'MONSOON2026' },
    { Section_ID: 'IC401-S1', Section_Name: 'S1', Course_ID: 'IC401', Term_ID: 'MONSOON2026' },
    { Section_ID: 'PC401-S1', Section_Name: 'S1', Course_ID: 'PC401', Term_ID: 'MONSOON2026' },
    { Section_ID: 'EL411-S1', Section_Name: 'S1', Course_ID: 'EL411', Term_ID: 'MONSOON2026' },
    { Section_ID: 'EL401-S1', Section_Name: 'S1', Course_ID: 'EL401', Term_ID: 'MONSOON2026' },
    { Section_ID: 'EL421-S1', Section_Name: 'S1', Course_ID: 'EL421', Term_ID: 'MONSOON2026' },
    { Section_ID: 'SE401-S1', Section_Name: 'S1', Course_ID: 'SE401', Term_ID: 'MONSOON2026' }
  ],
  Course_Slot: [
    { Slot_ID: 1, Section_ID: 'IC101-S1', Faculty_ID: 'F2024001', Room_Number: 'G01', Day_of_Week: 'Monday', Start_Time: '08:45', End_Time: '09:45', Syllabus: 'Intro programming' },
    { Slot_ID: 2, Section_ID: 'PC101-S1', Faculty_ID: 'F2024001', Room_Number: 'G02', Day_of_Week: 'Tuesday', Start_Time: '09:45', End_Time: '10:45', Syllabus: 'Programming studio' },
    { Slot_ID: 3, Section_ID: 'EL101-S1', Faculty_ID: 'F2024002', Room_Number: 'G03', Day_of_Week: 'Wednesday', Start_Time: '09:45', End_Time: '10:45', Syllabus: 'Creative computing applications' },
    { Slot_ID: 4, Section_ID: 'EL111-S1', Faculty_ID: 'F2024002', Room_Number: 'G04', Day_of_Week: 'Thursday', Start_Time: '11:00', End_Time: '12:00', Syllabus: 'Circuit prototyping practice' },
    { Slot_ID: 5, Section_ID: 'EL121-S1', Faculty_ID: 'F2024003', Room_Number: 'B01', Day_of_Week: 'Friday', Start_Time: '09:45', End_Time: '10:45', Syllabus: 'Analytics foundations' },
    { Slot_ID: 6, Section_ID: 'SE101-S1', Faculty_ID: 'F2024003', Room_Number: 'B02', Day_of_Week: 'Wednesday', Start_Time: '11:00', End_Time: '12:00', Syllabus: 'Design thinking' },
    { Slot_ID: 7, Section_ID: 'IC201-S1', Faculty_ID: 'F2024001', Room_Number: 'G05', Day_of_Week: 'Monday', Start_Time: '09:45', End_Time: '10:45', Syllabus: 'DSA' },
    { Slot_ID: 8, Section_ID: 'PC201-S1', Faculty_ID: 'F2024002', Room_Number: 'B03', Day_of_Week: 'Wednesday', Start_Time: '14:15', End_Time: '15:15', Syllabus: 'Signals and systems' },
    { Slot_ID: 9, Section_ID: 'EL201-S1', Faculty_ID: 'F2024001', Room_Number: 'G06', Day_of_Week: 'Thursday', Start_Time: '09:45', End_Time: '10:45', Syllabus: 'Open source workflows' },
    { Slot_ID: 10, Section_ID: 'EL211-S1', Faculty_ID: 'F2024002', Room_Number: 'B04', Day_of_Week: 'Thursday', Start_Time: '12:00', End_Time: '13:00', Syllabus: 'Communication circuits' },
    { Slot_ID: 11, Section_ID: 'EL221-S1', Faculty_ID: 'F2024003', Room_Number: 'B05', Day_of_Week: 'Friday', Start_Time: '11:00', End_Time: '12:00', Syllabus: 'Data storytelling lab' },
    { Slot_ID: 12, Section_ID: 'SE201-S1', Faculty_ID: 'F2024003', Room_Number: 'B06', Day_of_Week: 'Friday', Start_Time: '12:00', End_Time: '13:00', Syllabus: 'Employability skills' },
    { Slot_ID: 13, Section_ID: 'IC301-S1', Faculty_ID: 'F2024001', Room_Number: 'G07', Day_of_Week: 'Monday', Start_Time: '12:00', End_Time: '13:00', Syllabus: 'Operating systems' },
    { Slot_ID: 14, Section_ID: 'PC301-S1', Faculty_ID: 'F2024002', Room_Number: 'G08', Day_of_Week: 'Wednesday', Start_Time: '15:15', End_Time: '16:15', Syllabus: 'Microprocessors' },
    { Slot_ID: 15, Section_ID: 'EL301-S1', Faculty_ID: 'F2024001', Room_Number: 'G09', Day_of_Week: 'Tuesday', Start_Time: '14:15', End_Time: '15:15', Syllabus: 'Cloud computing basics' },
    { Slot_ID: 16, Section_ID: 'EL311-S1', Faculty_ID: 'F2024002', Room_Number: 'G10', Day_of_Week: 'Thursday', Start_Time: '14:15', End_Time: '15:15', Syllabus: 'Embedded interface design' },
    { Slot_ID: 17, Section_ID: 'EL321-S1', Faculty_ID: 'F2024003', Room_Number: 'B01', Day_of_Week: 'Friday', Start_Time: '14:15', End_Time: '15:15', Syllabus: 'Applied AI systems' },
    { Slot_ID: 18, Section_ID: 'SE301-S1', Faculty_ID: 'F2024003', Room_Number: 'B02', Day_of_Week: 'Tuesday', Start_Time: '11:00', End_Time: '12:00', Syllabus: 'Personal growth' },
    { Slot_ID: 19, Section_ID: 'IC401-S1', Faculty_ID: 'F2024001', Room_Number: 'G01', Day_of_Week: 'Wednesday', Start_Time: '16:30', End_Time: '17:30', Syllabus: 'Computer networks' },
    { Slot_ID: 20, Section_ID: 'PC401-S1', Faculty_ID: 'F2024002', Room_Number: 'B03', Day_of_Week: 'Thursday', Start_Time: '09:45', End_Time: '10:45', Syllabus: 'VLSI design' },
    { Slot_ID: 21, Section_ID: 'EL411-S1', Faculty_ID: 'F2024001', Room_Number: 'G02', Day_of_Week: 'Tuesday', Start_Time: '16:30', End_Time: '17:30', Syllabus: 'Secure systems practice' },
    { Slot_ID: 22, Section_ID: 'EL401-S1', Faculty_ID: 'F2024002', Room_Number: 'B04', Day_of_Week: 'Friday', Start_Time: '15:15', End_Time: '16:15', Syllabus: 'IoT systems design' },
    { Slot_ID: 23, Section_ID: 'EL421-S1', Faculty_ID: 'F2024003', Room_Number: 'B05', Day_of_Week: 'Friday', Start_Time: '16:30', End_Time: '17:30', Syllabus: 'Responsible data platforms' },
    { Slot_ID: 24, Section_ID: 'SE401-S1', Faculty_ID: 'F2024003', Room_Number: 'B06', Day_of_Week: 'Friday', Start_Time: '12:00', End_Time: '13:00', Syllabus: 'Climate change' }
  ],

  Registration: [
    { Enrollment_ID: 1, Student_ID: 'S2024001', Course_ID: 'IC101', Term_ID: 'MONSOON2026', Section_ID: 'IC101-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 2, Student_ID: 'S2024002', Course_ID: 'IC101', Term_ID: 'MONSOON2026', Section_ID: 'IC101-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 3, Student_ID: 'S2024003', Course_ID: 'IC101', Term_ID: 'MONSOON2026', Section_ID: 'IC101-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 4, Student_ID: 'S2024004', Course_ID: 'IC101', Term_ID: 'MONSOON2026', Section_ID: 'IC101-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 5, Student_ID: 'S2024005', Course_ID: 'IC101', Term_ID: 'MONSOON2026', Section_ID: 'IC101-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 6, Student_ID: 'S2024006', Course_ID: 'PC101', Term_ID: 'MONSOON2026', Section_ID: 'PC101-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 7, Student_ID: 'S2024007', Course_ID: 'PC101', Term_ID: 'MONSOON2026', Section_ID: 'PC101-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 8, Student_ID: 'S2024008', Course_ID: 'PC101', Term_ID: 'MONSOON2026', Section_ID: 'PC101-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 9, Student_ID: 'S2024009', Course_ID: 'PC101', Term_ID: 'MONSOON2026', Section_ID: 'PC101-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 10, Student_ID: 'S2024010', Course_ID: 'PC101', Term_ID: 'MONSOON2026', Section_ID: 'PC101-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 11, Student_ID: 'S2024001', Course_ID: 'EL101', Term_ID: 'MONSOON2026', Section_ID: 'EL101-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 12, Student_ID: 'S2024002', Course_ID: 'EL101', Term_ID: 'MONSOON2026', Section_ID: 'EL101-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 13, Student_ID: 'S2024003', Course_ID: 'EL101', Term_ID: 'MONSOON2026', Section_ID: 'EL101-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 14, Student_ID: 'S2024004', Course_ID: 'EL101', Term_ID: 'MONSOON2026', Section_ID: 'EL101-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 15, Student_ID: 'S2024005', Course_ID: 'EL101', Term_ID: 'MONSOON2026', Section_ID: 'EL101-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 16, Student_ID: 'S2024001', Course_ID: 'EL111', Term_ID: 'MONSOON2026', Section_ID: 'EL111-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 17, Student_ID: 'S2024002', Course_ID: 'EL111', Term_ID: 'MONSOON2026', Section_ID: 'EL111-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 18, Student_ID: 'S2024006', Course_ID: 'EL111', Term_ID: 'MONSOON2026', Section_ID: 'EL111-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 19, Student_ID: 'S2024008', Course_ID: 'EL111', Term_ID: 'MONSOON2026', Section_ID: 'EL111-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 20, Student_ID: 'S2024009', Course_ID: 'EL111', Term_ID: 'MONSOON2026', Section_ID: 'EL111-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 21, Student_ID: 'S2024003', Course_ID: 'EL121', Term_ID: 'MONSOON2026', Section_ID: 'EL121-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 22, Student_ID: 'S2024004', Course_ID: 'EL121', Term_ID: 'MONSOON2026', Section_ID: 'EL121-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 23, Student_ID: 'S2024005', Course_ID: 'EL121', Term_ID: 'MONSOON2026', Section_ID: 'EL121-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 24, Student_ID: 'S2024007', Course_ID: 'EL121', Term_ID: 'MONSOON2026', Section_ID: 'EL121-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 25, Student_ID: 'S2024010', Course_ID: 'EL121', Term_ID: 'MONSOON2026', Section_ID: 'EL121-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 26, Student_ID: 'S2024006', Course_ID: 'SE101', Term_ID: 'MONSOON2026', Section_ID: 'SE101-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 27, Student_ID: 'S2024007', Course_ID: 'SE101', Term_ID: 'MONSOON2026', Section_ID: 'SE101-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 28, Student_ID: 'S2024008', Course_ID: 'SE101', Term_ID: 'MONSOON2026', Section_ID: 'SE101-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 29, Student_ID: 'S2024009', Course_ID: 'SE101', Term_ID: 'MONSOON2026', Section_ID: 'SE101-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 30, Student_ID: 'S2024010', Course_ID: 'SE101', Term_ID: 'MONSOON2026', Section_ID: 'SE101-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 31, Student_ID: 'S2023011', Course_ID: 'IC201', Term_ID: 'MONSOON2026', Section_ID: 'IC201-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 32, Student_ID: 'S2023012', Course_ID: 'IC201', Term_ID: 'MONSOON2026', Section_ID: 'IC201-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 33, Student_ID: 'S2023013', Course_ID: 'IC201', Term_ID: 'MONSOON2026', Section_ID: 'IC201-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 34, Student_ID: 'S2023014', Course_ID: 'IC201', Term_ID: 'MONSOON2026', Section_ID: 'IC201-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 35, Student_ID: 'S2023015', Course_ID: 'IC201', Term_ID: 'MONSOON2026', Section_ID: 'IC201-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 36, Student_ID: 'S2023011', Course_ID: 'PC201', Term_ID: 'MONSOON2026', Section_ID: 'PC201-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 37, Student_ID: 'S2023012', Course_ID: 'PC201', Term_ID: 'MONSOON2026', Section_ID: 'PC201-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 38, Student_ID: 'S2023013', Course_ID: 'PC201', Term_ID: 'MONSOON2026', Section_ID: 'PC201-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 39, Student_ID: 'S2023014', Course_ID: 'PC201', Term_ID: 'MONSOON2026', Section_ID: 'PC201-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 40, Student_ID: 'S2023015', Course_ID: 'PC201', Term_ID: 'MONSOON2026', Section_ID: 'PC201-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 41, Student_ID: 'S2023011', Course_ID: 'EL201', Term_ID: 'MONSOON2026', Section_ID: 'EL201-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 42, Student_ID: 'S2023012', Course_ID: 'EL201', Term_ID: 'MONSOON2026', Section_ID: 'EL201-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 43, Student_ID: 'S2023013', Course_ID: 'EL201', Term_ID: 'MONSOON2026', Section_ID: 'EL201-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 44, Student_ID: 'S2023014', Course_ID: 'EL201', Term_ID: 'MONSOON2026', Section_ID: 'EL201-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 45, Student_ID: 'S2023015', Course_ID: 'EL201', Term_ID: 'MONSOON2026', Section_ID: 'EL201-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 46, Student_ID: 'S2023011', Course_ID: 'EL211', Term_ID: 'MONSOON2026', Section_ID: 'EL211-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 47, Student_ID: 'S2023012', Course_ID: 'EL211', Term_ID: 'MONSOON2026', Section_ID: 'EL211-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 48, Student_ID: 'S2023013', Course_ID: 'EL211', Term_ID: 'MONSOON2026', Section_ID: 'EL211-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 49, Student_ID: 'S2023014', Course_ID: 'EL211', Term_ID: 'MONSOON2026', Section_ID: 'EL211-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 50, Student_ID: 'S2023015', Course_ID: 'EL211', Term_ID: 'MONSOON2026', Section_ID: 'EL211-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 51, Student_ID: 'S2023011', Course_ID: 'EL221', Term_ID: 'MONSOON2026', Section_ID: 'EL221-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 52, Student_ID: 'S2023012', Course_ID: 'EL221', Term_ID: 'MONSOON2026', Section_ID: 'EL221-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 53, Student_ID: 'S2023013', Course_ID: 'EL221', Term_ID: 'MONSOON2026', Section_ID: 'EL221-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 54, Student_ID: 'S2023014', Course_ID: 'EL221', Term_ID: 'MONSOON2026', Section_ID: 'EL221-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 55, Student_ID: 'S2023015', Course_ID: 'EL221', Term_ID: 'MONSOON2026', Section_ID: 'EL221-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 56, Student_ID: 'S2023011', Course_ID: 'SE201', Term_ID: 'MONSOON2026', Section_ID: 'SE201-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 57, Student_ID: 'S2023012', Course_ID: 'SE201', Term_ID: 'MONSOON2026', Section_ID: 'SE201-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 58, Student_ID: 'S2023013', Course_ID: 'SE201', Term_ID: 'MONSOON2026', Section_ID: 'SE201-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 59, Student_ID: 'S2023014', Course_ID: 'SE201', Term_ID: 'MONSOON2026', Section_ID: 'SE201-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 60, Student_ID: 'S2023015', Course_ID: 'SE201', Term_ID: 'MONSOON2026', Section_ID: 'SE201-S1', Status: 'Enrolled', Final_Grade: null },

    { Enrollment_ID: 61, Student_ID: 'S2022014', Course_ID: 'IC301', Term_ID: 'MONSOON2026', Section_ID: 'IC301-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 62, Student_ID: 'S2022015', Course_ID: 'IC301', Term_ID: 'MONSOON2026', Section_ID: 'IC301-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 63, Student_ID: 'S2022016', Course_ID: 'IC301', Term_ID: 'MONSOON2026', Section_ID: 'IC301-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 64, Student_ID: 'S2022017', Course_ID: 'IC301', Term_ID: 'MONSOON2026', Section_ID: 'IC301-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 65, Student_ID: 'S2022018', Course_ID: 'IC301', Term_ID: 'MONSOON2026', Section_ID: 'IC301-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 66, Student_ID: 'S2022014', Course_ID: 'PC301', Term_ID: 'MONSOON2026', Section_ID: 'PC301-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 67, Student_ID: 'S2022015', Course_ID: 'PC301', Term_ID: 'MONSOON2026', Section_ID: 'PC301-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 68, Student_ID: 'S2022016', Course_ID: 'PC301', Term_ID: 'MONSOON2026', Section_ID: 'PC301-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 69, Student_ID: 'S2022017', Course_ID: 'PC301', Term_ID: 'MONSOON2026', Section_ID: 'PC301-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 70, Student_ID: 'S2022018', Course_ID: 'PC301', Term_ID: 'MONSOON2026', Section_ID: 'PC301-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 71, Student_ID: 'S2022014', Course_ID: 'EL301', Term_ID: 'MONSOON2026', Section_ID: 'EL301-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 72, Student_ID: 'S2022015', Course_ID: 'EL301', Term_ID: 'MONSOON2026', Section_ID: 'EL301-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 73, Student_ID: 'S2022016', Course_ID: 'EL301', Term_ID: 'MONSOON2026', Section_ID: 'EL301-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 74, Student_ID: 'S2022017', Course_ID: 'EL301', Term_ID: 'MONSOON2026', Section_ID: 'EL301-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 75, Student_ID: 'S2022018', Course_ID: 'EL301', Term_ID: 'MONSOON2026', Section_ID: 'EL301-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 76, Student_ID: 'S2022014', Course_ID: 'EL311', Term_ID: 'MONSOON2026', Section_ID: 'EL311-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 77, Student_ID: 'S2022015', Course_ID: 'EL311', Term_ID: 'MONSOON2026', Section_ID: 'EL311-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 78, Student_ID: 'S2022016', Course_ID: 'EL311', Term_ID: 'MONSOON2026', Section_ID: 'EL311-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 79, Student_ID: 'S2022017', Course_ID: 'EL311', Term_ID: 'MONSOON2026', Section_ID: 'EL311-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 80, Student_ID: 'S2022018', Course_ID: 'EL311', Term_ID: 'MONSOON2026', Section_ID: 'EL311-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 81, Student_ID: 'S2022014', Course_ID: 'EL321', Term_ID: 'MONSOON2026', Section_ID: 'EL321-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 82, Student_ID: 'S2022015', Course_ID: 'EL321', Term_ID: 'MONSOON2026', Section_ID: 'EL321-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 83, Student_ID: 'S2022016', Course_ID: 'EL321', Term_ID: 'MONSOON2026', Section_ID: 'EL321-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 84, Student_ID: 'S2022017', Course_ID: 'EL321', Term_ID: 'MONSOON2026', Section_ID: 'EL321-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 85, Student_ID: 'S2022018', Course_ID: 'EL321', Term_ID: 'MONSOON2026', Section_ID: 'EL321-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 86, Student_ID: 'S2022014', Course_ID: 'SE301', Term_ID: 'MONSOON2026', Section_ID: 'SE301-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 87, Student_ID: 'S2022015', Course_ID: 'SE301', Term_ID: 'MONSOON2026', Section_ID: 'SE301-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 88, Student_ID: 'S2022016', Course_ID: 'SE301', Term_ID: 'MONSOON2026', Section_ID: 'SE301-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 89, Student_ID: 'S2022017', Course_ID: 'SE301', Term_ID: 'MONSOON2026', Section_ID: 'SE301-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 90, Student_ID: 'S2022018', Course_ID: 'SE301', Term_ID: 'MONSOON2026', Section_ID: 'SE301-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 91, Student_ID: 'S2021017', Course_ID: 'IC401', Term_ID: 'MONSOON2026', Section_ID: 'IC401-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 92, Student_ID: 'S2021018', Course_ID: 'IC401', Term_ID: 'MONSOON2026', Section_ID: 'IC401-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 93, Student_ID: 'S2021019', Course_ID: 'IC401', Term_ID: 'MONSOON2026', Section_ID: 'IC401-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 94, Student_ID: 'S2021020', Course_ID: 'IC401', Term_ID: 'MONSOON2026', Section_ID: 'IC401-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 95, Student_ID: 'S2021021', Course_ID: 'IC401', Term_ID: 'MONSOON2026', Section_ID: 'IC401-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 96, Student_ID: 'S2021017', Course_ID: 'PC401', Term_ID: 'MONSOON2026', Section_ID: 'PC401-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 97, Student_ID: 'S2021018', Course_ID: 'PC401', Term_ID: 'MONSOON2026', Section_ID: 'PC401-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 98, Student_ID: 'S2021019', Course_ID: 'PC401', Term_ID: 'MONSOON2026', Section_ID: 'PC401-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 99, Student_ID: 'S2021020', Course_ID: 'PC401', Term_ID: 'MONSOON2026', Section_ID: 'PC401-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 100, Student_ID: 'S2021021', Course_ID: 'PC401', Term_ID: 'MONSOON2026', Section_ID: 'PC401-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 101, Student_ID: 'S2021017', Course_ID: 'EL411', Term_ID: 'MONSOON2026', Section_ID: 'EL411-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 102, Student_ID: 'S2021018', Course_ID: 'EL411', Term_ID: 'MONSOON2026', Section_ID: 'EL411-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 103, Student_ID: 'S2021019', Course_ID: 'EL411', Term_ID: 'MONSOON2026', Section_ID: 'EL411-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 104, Student_ID: 'S2021020', Course_ID: 'EL411', Term_ID: 'MONSOON2026', Section_ID: 'EL411-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 105, Student_ID: 'S2021021', Course_ID: 'EL411', Term_ID: 'MONSOON2026', Section_ID: 'EL411-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 106, Student_ID: 'S2021017', Course_ID: 'EL401', Term_ID: 'MONSOON2026', Section_ID: 'EL401-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 107, Student_ID: 'S2021018', Course_ID: 'EL401', Term_ID: 'MONSOON2026', Section_ID: 'EL401-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 108, Student_ID: 'S2021019', Course_ID: 'EL401', Term_ID: 'MONSOON2026', Section_ID: 'EL401-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 109, Student_ID: 'S2021020', Course_ID: 'EL401', Term_ID: 'MONSOON2026', Section_ID: 'EL401-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 110, Student_ID: 'S2021021', Course_ID: 'EL401', Term_ID: 'MONSOON2026', Section_ID: 'EL401-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 111, Student_ID: 'S2021017', Course_ID: 'EL421', Term_ID: 'MONSOON2026', Section_ID: 'EL421-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 112, Student_ID: 'S2021018', Course_ID: 'EL421', Term_ID: 'MONSOON2026', Section_ID: 'EL421-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 113, Student_ID: 'S2021019', Course_ID: 'EL421', Term_ID: 'MONSOON2026', Section_ID: 'EL421-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 114, Student_ID: 'S2021020', Course_ID: 'EL421', Term_ID: 'MONSOON2026', Section_ID: 'EL421-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 115, Student_ID: 'S2021021', Course_ID: 'EL421', Term_ID: 'MONSOON2026', Section_ID: 'EL421-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 116, Student_ID: 'S2021017', Course_ID: 'SE401', Term_ID: 'MONSOON2026', Section_ID: 'SE401-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 117, Student_ID: 'S2021018', Course_ID: 'SE401', Term_ID: 'MONSOON2026', Section_ID: 'SE401-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 118, Student_ID: 'S2021019', Course_ID: 'SE401', Term_ID: 'MONSOON2026', Section_ID: 'SE401-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 119, Student_ID: 'S2021020', Course_ID: 'SE401', Term_ID: 'MONSOON2026', Section_ID: 'SE401-S1', Status: 'Enrolled', Final_Grade: null },
    { Enrollment_ID: 120, Student_ID: 'S2021021', Course_ID: 'SE401', Term_ID: 'MONSOON2026', Section_ID: 'SE401-S1', Status: 'Enrolled', Final_Grade: null }
  ],

  Override_Request: [
    { Request_ID: 1, Student_ID: 'S2024001', Course_ID: 'IC401', Reason: 'Prerequisite waiver requested. Have completed NPTEL equivalent.', Approval_Status: 'Pending', Created_At: '2026-03-30T10:00:00Z' },
    { Request_ID: 2, Student_ID: 'S2024002', Course_ID: 'IC302', Reason: 'Timetable clash with Program Core course. Requesting slot adjustment.', Approval_Status: 'Approved', Created_At: '2026-03-29T14:30:00Z' },
    { Request_ID: 3, Student_ID: 'S2024004', Course_ID: 'PC302', Reason: 'Credit overload to 26 credits to graduate on time.', Approval_Status: 'Pending', Created_At: '2026-03-31T09:15:00Z' },
    { Request_ID: 4, Student_ID: 'S2024006', Course_ID: 'PC401', Reason: 'Requesting enrollment despite low CGPA constraint.', Approval_Status: 'Rejected', Created_At: '2026-03-25T11:00:00Z' },
    { Request_ID: 5, Student_ID: 'S2024008', Course_ID: 'IC402', Reason: 'Need this specific elective for BTP alignment.', Approval_Status: 'Pending', Created_At: '2026-03-31T12:45:00Z' }
  ],

  Academic_Roadmap: [
    { Roadmap_ID: 1, Student_ID: 'S2024001', Course_ID: 'IC401', Planned_Term: 5 },
    { Roadmap_ID: 2, Student_ID: 'S2024001', Course_ID: 'IC402', Planned_Term: 6 },
    { Roadmap_ID: 3, Student_ID: 'S2024003', Course_ID: 'PC301', Planned_Term: 5 }
  ]
};

function initializeLuminaDB() {
  for (const [tableName, tableData] of Object.entries(mockDatabase)) {
    if (!localStorage.getItem(`Lumina_${tableName}`)) {
      localStorage.setItem(`Lumina_${tableName}`, JSON.stringify(tableData));
    }
  }
}

initializeLuminaDB();

function ensureSemester4RegistrationSetup() {
  function readTable(name) {
    try { return JSON.parse(localStorage.getItem(`Lumina_${name}`)) || []; }
    catch (e) { return []; }
  }

  function writeTable(name, value) {
    localStorage.setItem(`Lumina_${name}`, JSON.stringify(value));
  }

  var currentStudentId = 'S2024002';
  var currentDeptId = 'CSE';
  if (!localStorage.getItem('Lumina_Current_Student_ID') && !sessionStorage.getItem('Lumina_Current_Student_ID')) {
    localStorage.setItem('Lumina_Current_Student_ID', currentStudentId);
  }
  var semester4Faculty = [
    { User_ID: 'F2024010', Full_Name: 'Dr. Raja Vara Prasad', Email: 'raja.varaprasad@lumina.iiits.in', Password: 'password123', Role: 'Faculty', Dept_ID: 'CSE' },
    { User_ID: 'F2024011', Full_Name: 'Dr. Bulla Rajesh', Email: 'bulla.rajesh@lumina.iiits.in', Password: 'password123', Role: 'Faculty', Dept_ID: 'CSE' },
    { User_ID: 'F2024012', Full_Name: 'Dr. Mrinmoy Ghorai', Email: 'mrinmoy.ghorai@lumina.iiits.in', Password: 'password123', Role: 'Faculty', Dept_ID: 'CSE' }
  ];
  var semester4Courses = [
    { Course_ID: 'IC241', Course_Name: 'Computer Communication Networks', Credits: 4, Course_Capacity: 120, Status: 'Active', Dept_ID: 'CSE' },
    { Course_ID: 'PC241', Course_Name: 'Artificial Intelligence', Credits: 4, Course_Capacity: 60, Status: 'Active', Dept_ID: 'CSE' },
    { Course_ID: 'IC242', Course_Name: 'Theory of Computation', Credits: 4, Course_Capacity: 120, Status: 'Active', Dept_ID: 'CSE' },
    { Course_ID: 'PC242', Course_Name: 'Full Stack Development', Credits: 4, Course_Capacity: 60, Status: 'Active', Dept_ID: 'CSE' },
    { Course_ID: 'EL241', Course_Name: 'Advanced Communication Skills', Credits: 2, Course_Capacity: 60, Status: 'Active', Dept_ID: 'CSE' },
    { Course_ID: 'SE241', Course_Name: 'Logical Reasoning', Credits: 2, Course_Capacity: 120, Status: 'Active', Dept_ID: 'CSE' }
  ];
  var semester4Requirements = [
    { Requirement_ID: 1001, Dept_ID: currentDeptId, Course_ID: 'IC241', Course_Type: 'Institute Core', Target_Semester: 4 },
    { Requirement_ID: 1002, Dept_ID: currentDeptId, Course_ID: 'PC241', Course_Type: 'Program Core', Target_Semester: 4 },
    { Requirement_ID: 1003, Dept_ID: currentDeptId, Course_ID: 'IC242', Course_Type: 'Institute Core', Target_Semester: 4 },
    { Requirement_ID: 1004, Dept_ID: currentDeptId, Course_ID: 'PC242', Course_Type: 'Program Core', Target_Semester: 4 },
    { Requirement_ID: 1005, Dept_ID: currentDeptId, Course_ID: 'EL241', Course_Type: 'Elective', Target_Semester: 4 },
    { Requirement_ID: 1006, Dept_ID: currentDeptId, Course_ID: 'SE241', Course_Type: 'SEED', Target_Semester: 4 }
  ];
  var spring2026Term = {
    Term_ID: 'SPRING2026',
    Term_Name: 'Spring 2026',
    Start_Timestamp: '2026-01-05T00:00:00Z',
    End_Timestamp: '2026-05-15T00:00:00Z',
    Min_Credit_Limit: 12,
    Max_Credit_Limit: 26
  };
  var semester4Sections = [
    { Section_ID: 'IC241-S1', Section_Name: 'S1', Course_ID: 'IC241', Term_ID: 'SPRING2026' },
    { Section_ID: 'PC241-S1', Section_Name: 'S1', Course_ID: 'PC241', Term_ID: 'SPRING2026' },
    { Section_ID: 'IC242-S1', Section_Name: 'S1', Course_ID: 'IC242', Term_ID: 'SPRING2026' },
    { Section_ID: 'PC242-S1', Section_Name: 'S1', Course_ID: 'PC242', Term_ID: 'SPRING2026' },
    { Section_ID: 'EL241-S1', Section_Name: 'S1', Course_ID: 'EL241', Term_ID: 'SPRING2026' },
    { Section_ID: 'SE241-S1', Section_Name: 'S1', Course_ID: 'SE241', Term_ID: 'SPRING2026' }
  ];
  var semester4Slots = [
    { Slot_ID: 1001, Section_ID: 'IC241-S1', Faculty_ID: 'F2024010', Room_Number: 'G11', Day_of_Week: 'Monday', Start_Time: '08:45', End_Time: '09:45', Syllabus: 'Network models and routing' },
    { Slot_ID: 1002, Section_ID: 'PC241-S1', Faculty_ID: 'F2024011', Room_Number: 'B07', Day_of_Week: 'Tuesday', Start_Time: '11:00', End_Time: '12:00', Syllabus: 'AI search and reasoning' },
    { Slot_ID: 1003, Section_ID: 'IC242-S1', Faculty_ID: 'F2024001', Room_Number: 'G12', Day_of_Week: 'Wednesday', Start_Time: '09:45', End_Time: '10:45', Syllabus: 'Automata and computability' },
    { Slot_ID: 1004, Section_ID: 'PC242-S1', Faculty_ID: 'F2024012', Room_Number: 'G13', Day_of_Week: 'Thursday', Start_Time: '14:15', End_Time: '15:15', Syllabus: 'Frontend and backend foundations' },
    { Slot_ID: 1005, Section_ID: 'EL241-S1', Faculty_ID: 'F2024002', Room_Number: 'B08', Day_of_Week: 'Friday', Start_Time: '10:45', End_Time: '11:45', Syllabus: 'Professional speaking and writing' },
    { Slot_ID: 1006, Section_ID: 'SE241-S1', Faculty_ID: 'F2024003', Room_Number: 'B09', Day_of_Week: 'Friday', Start_Time: '12:00', End_Time: '13:00', Syllabus: 'Reasoning and aptitude practice' }
  ];
  var seededRegistrations = [
    { Student_ID: currentStudentId, Course_ID: 'IC241', Term_ID: 'SPRING2026', Section_ID: 'IC241-S1', Status: 'Enrolled', Final_Grade: null },
    { Student_ID: currentStudentId, Course_ID: 'PC241', Term_ID: 'SPRING2026', Section_ID: 'PC241-S1', Status: 'Enrolled', Final_Grade: null }
  ];

  var students = readTable('Students');
  var studentUpdated = false;
  students = students.map(function(student) {
    if (student.Student_ID === currentStudentId) {
      studentUpdated = true;
      return {
        Student_ID: student.Student_ID,
        Current_Semester: 4,
        Enrollment_Year: student.Enrollment_Year
      };
    }
    return student;
  });
  if (!studentUpdated) {
    students.push({ Student_ID: currentStudentId, Current_Semester: 4, Enrollment_Year: 2024 });
  }
  writeTable('Students', students);

  var users = readTable('Users');
  semester4Faculty.forEach(function(faculty) {
    var existingIndex = users.findIndex(function(user) { return user.User_ID === faculty.User_ID; });
    if (existingIndex === -1) {
      users.push(faculty);
    } else {
      users[existingIndex] = faculty;
    }
  });
  writeTable('Users', users);

  var terms = readTable('Academic_Term');
  if (!terms.some(function(term) { return term.Term_ID === spring2026Term.Term_ID; })) {
    terms.unshift(spring2026Term);
    writeTable('Academic_Term', terms);
  }

  var catalog = readTable('Course_Catalog');
  semester4Courses.forEach(function(course) {
    if (!catalog.some(function(item) { return item.Course_ID === course.Course_ID; })) {
      catalog.push(course);
    }
  });
  writeTable('Course_Catalog', catalog);

  var degreeReqs = readTable('Degree_Requirements');
  semester4Requirements.forEach(function(req) {
    if (!degreeReqs.some(function(item) { return item.Course_ID === req.Course_ID && item.Target_Semester === 4 && item.Dept_ID === currentDeptId; })) {
      degreeReqs.push(req);
    }
  });
  writeTable('Degree_Requirements', degreeReqs);

  var sections = readTable('Section');
  semester4Sections.forEach(function(section) {
    if (!sections.some(function(item) { return item.Section_ID === section.Section_ID; })) {
      sections.push(section);
    }
  });
  writeTable('Section', sections);

  var slots = readTable('Course_Slot');
  semester4Slots.forEach(function(slot) {
    var existingIndex = slots.findIndex(function(item) { return item.Section_ID === slot.Section_ID; });
    if (existingIndex === -1) {
      slots.push(slot);
    } else {
      slots[existingIndex] = slot;
    }
  });
  writeTable('Course_Slot', slots);

  var registrations = readTable('Registration');
  var nextEnrollmentId = registrations.reduce(function(max, item) {
    return Math.max(max, item.Enrollment_ID || 0);
  }, 0) + 1;
  seededRegistrations.forEach(function(registration) {
    var exists = registrations.some(function(item) {
      return item.Student_ID === registration.Student_ID &&
             item.Course_ID === registration.Course_ID &&
             item.Term_ID === registration.Term_ID;
    });
    if (!exists) {
      registrations.push({
        Enrollment_ID: nextEnrollmentId++,
        Student_ID: registration.Student_ID,
        Course_ID: registration.Course_ID,
        Term_ID: registration.Term_ID,
        Section_ID: registration.Section_ID,
        Status: registration.Status,
        Final_Grade: registration.Final_Grade
      });
    }
  });
  writeTable('Registration', registrations);
}

ensureSemester4RegistrationSetup();

window.resetLuminaDB = function resetLuminaDB() {
  for (const key in localStorage) {
    if (key.startsWith('Lumina_')) {
      localStorage.removeItem(key);
    }
  }
  localStorage.removeItem('lumina_enrolled');
  initializeLuminaDB();
  alert('Database has been factory reset with the latest Monsoon schedule!');
  location.reload();
};
