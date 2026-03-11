-- ==============================================================================
-- LUMINA COURSE ENROLLMENT SYSTEM - FINAL DB SCHEMA
-- ==============================================================================

CREATE TABLE Department (
    Dept_ID VARCHAR(10) PRIMARY KEY,
    Dept_Name VARCHAR(100) NOT NULL,
    Total_Required_Credits INT NOT NULL
);

CREATE TABLE Users (
    User_ID VARCHAR(20) PRIMARY KEY,
    Full_Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL,
    Role VARCHAR(20) NOT NULL CHECK (Role IN ('Student', 'Faculty', 'Assistant_Dean_1', 'Assistant_Dean_2', 'Dean')),
    Dept_ID VARCHAR(10) NOT NULL,
    FOREIGN KEY (Dept_ID) REFERENCES Department(Dept_ID)
);

CREATE TABLE Students (
    Student_ID VARCHAR(20) PRIMARY KEY,
    Current_Semester INT NOT NULL CHECK (Current_Semester BETWEEN 1 AND 8),
    Enrollment_Year INT NOT NULL,
    FOREIGN KEY (Student_ID) REFERENCES Users(User_ID) ON DELETE CASCADE
);

CREATE TABLE Course_Catalog (
    Course_ID VARCHAR(20) PRIMARY KEY,
    Course_Name VARCHAR(150) NOT NULL,
    Credits INT NOT NULL CHECK (Credits > 0),
    Course_Capacity INT NOT NULL,
    Status VARCHAR(20) DEFAULT 'Active' CHECK (Status IN ('Active', 'Inactive')),
    Dept_ID VARCHAR(10) NOT NULL,
    FOREIGN KEY (Dept_ID) REFERENCES Department(Dept_ID)
);

CREATE TABLE Degree_Requirements (
    Requirement_ID SERIAL PRIMARY KEY,
    Dept_ID VARCHAR(10) NOT NULL,
    Course_ID VARCHAR(20) NOT NULL,
    Course_Type VARCHAR(20) NOT NULL CHECK (Course_Type IN ('Core', 'Elective')),
    Target_Semester INT NOT NULL CHECK (Target_Semester BETWEEN 1 AND 8),
    FOREIGN KEY (Dept_ID) REFERENCES Department(Dept_ID),
    FOREIGN KEY (Course_ID) REFERENCES Course_Catalog(Course_ID)
);

CREATE TABLE Course_Prerequisite (
    Target_Course_ID VARCHAR(20) NOT NULL,
    Required_Course_ID VARCHAR(20) NOT NULL,
    PRIMARY KEY (Target_Course_ID, Required_Course_ID),
    FOREIGN KEY (Target_Course_ID) REFERENCES Course_Catalog(Course_ID),
    FOREIGN KEY (Required_Course_ID) REFERENCES Course_Catalog(Course_ID)
);

CREATE TABLE Academic_Term (
    Term_ID VARCHAR(20) PRIMARY KEY,
    Term_Name VARCHAR(50) NOT NULL,
    Start_Timestamp TIMESTAMP NOT NULL,
    End_Timestamp TIMESTAMP NOT NULL,
    Min_Credit_Limit INT NOT NULL,
    Max_Credit_Limit INT NOT NULL,
    CHECK (Start_Timestamp < End_Timestamp)
);

CREATE TABLE Section (
    Section_ID VARCHAR(30) PRIMARY KEY,
    Section_Name VARCHAR(10) NOT NULL,
    Course_ID VARCHAR(20) NOT NULL,
    Term_ID VARCHAR(20) NOT NULL,
    FOREIGN KEY (Course_ID) REFERENCES Course_Catalog(Course_ID),
    FOREIGN KEY (Term_ID) REFERENCES Academic_Term(Term_ID)
);

CREATE TABLE Course_Slot (
    Slot_ID SERIAL PRIMARY KEY,
    Section_ID VARCHAR(30) NOT NULL,
    Faculty_ID VARCHAR(20) NOT NULL,
    Room_Number VARCHAR(50) NOT NULL,
    Day_of_Week VARCHAR(15) NOT NULL,
    Start_Time TIME NOT NULL,
    End_Time TIME NOT NULL,
    Syllabus TEXT,
    FOREIGN KEY (Section_ID) REFERENCES Section(Section_ID),
    FOREIGN KEY (Faculty_ID) REFERENCES Users(User_ID),
    CHECK (Start_Time < End_Time)
);

CREATE TABLE Registration (
    Enrollment_ID SERIAL PRIMARY KEY,
    Student_ID VARCHAR(20) NOT NULL,
    Course_ID VARCHAR(20) NOT NULL,
    Term_ID VARCHAR(20) NOT NULL,
    Section_ID VARCHAR(30),
    Status VARCHAR(30) NOT NULL DEFAULT 'Pending_Allocation' CHECK (Status IN ('Pending_Allocation', 'Enrolled', 'Waitlisted', 'Dropped')),
    Final_Grade VARCHAR(5),
    FOREIGN KEY (Student_ID) REFERENCES Users(User_ID),
    FOREIGN KEY (Course_ID) REFERENCES Course_Catalog(Course_ID),
    FOREIGN KEY (Term_ID) REFERENCES Academic_Term(Term_ID),
    FOREIGN KEY (Section_ID) REFERENCES Section(Section_ID),
    UNIQUE (Student_ID, Course_ID, Term_ID)
);

CREATE TABLE Override_Request (
    Request_ID SERIAL PRIMARY KEY,
    Student_ID VARCHAR(20) NOT NULL,
    Course_ID VARCHAR(20) NOT NULL,
    Reason TEXT NOT NULL,
    Approval_Status VARCHAR(20) DEFAULT 'Pending' CHECK (Approval_Status IN ('Pending', 'Approved', 'Rejected')),
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Student_ID) REFERENCES Users(User_ID),
    FOREIGN KEY (Course_ID) REFERENCES Course_Catalog(Course_ID)
);

CREATE TABLE Academic_Roadmap (
    Roadmap_ID SERIAL PRIMARY KEY,
    Student_ID VARCHAR(20) NOT NULL,
    Course_ID VARCHAR(20) NOT NULL,
    Planned_Term INT NOT NULL CHECK (Planned_Term BETWEEN 1 AND 8),
    FOREIGN KEY (Student_ID) REFERENCES Users(User_ID),
    FOREIGN KEY (Course_ID) REFERENCES Course_Catalog(Course_ID)
);