# Lumina: Database Schema

This document outlines the database tables, attributes, data types, and constraints for the Lumina Course Enrollment System.

### `Department`
Stores the master list of academic departments.
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| **Dept_ID** | VARCHAR(10) | **PRIMARY KEY** | Unique department code (e.g., 'CSE', 'ECE'). |
| **Dept_Name** | VARCHAR(100) | NOT NULL | Full name of the department. |
| **Total_Required_Credits**| INT | NOT NULL | Total credits required to graduate from this department. |

### `Users`
Centralized authentication and Role Based Access Control for all system actors.
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| **User_ID** | VARCHAR(20) | **PRIMARY KEY** | Institutional ID (e.g., 'S20240010132'). |
| **Full_Name** | VARCHAR(100) | NOT NULL | The user's full legal name. |
| **Email** | VARCHAR(100) | UNIQUE, NOT NULL | Institutional email used for login. |
| **Password** | VARCHAR(255) | NOT NULL | Hashed password. |
| **Role** | VARCHAR(20) | NOT NULL | Enum: Student, Faculty, Assistant_Dean_1, Assistant_Dean_2, Dean. |
| **Dept_ID** | VARCHAR(10) | **FOREIGN KEY** | Links to `Department(Dept_ID)`. |

### `Students`
A specialization of Users handling subtype data specifically for students to prevent sparse data (NULLs) in the Users table.
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| **Student_ID** | VARCHAR(20) | **PK, FOREIGN KEY** | Links strictly to `Users(User_ID)` with ON DELETE CASCADE. |
| **Current_Semester** | INT | NOT NULL | The student's current B.Tech semester (1-8). |
| **Enrollment_Year** | INT | NOT NULL | The year the student joined the institute. |

---

### `Course_Catalog`
The master list of all available subjects and administrative capacities.
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| **Course_ID** | VARCHAR(20) | **PRIMARY KEY** | Unique course code (e.g., 'CS301'). |
| **Course_Name** | VARCHAR(150) | NOT NULL | Full title of the course. |
| **Credits** | INT | NOT NULL, > 0 | Academic credit weight. |
| **Course_Capacity** | INT | NOT NULL | Global ceiling for total allowed student registrations. |
| **Status** | VARCHAR(20) | DEFAULT 'Active' | Enum: Active, Inactive. |
| **Dept_ID** | VARCHAR(10) | **FOREIGN KEY** | Links to `Department(Dept_ID)`. |

### `Degree_Requirements`
The curriculum matrix linking courses to specific UG semesters for automated advising.
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| **Requirement_ID** | SERIAL | **PRIMARY KEY** | Auto-incrementing internal ID. |
| **Dept_ID** | VARCHAR(10) | **FOREIGN KEY** | Links to `Department(Dept_ID)`. |
| **Course_ID** | VARCHAR(20) | **FOREIGN KEY** | Links to `Course_Catalog(Course_ID)`. |
| **Course_Type** | VARCHAR(20) | NOT NULL | Enum: Core, Elective. |
| **Target_Semester** | INT | NOT NULL | The specific B.Tech semester (1-8) this course is intended for. |

### `Course_Prerequisite`
Self-referencing junction table enforcing enrollment prerequisites.
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| **Target_Course_ID** | VARCHAR(20) | **PK, FOREIGN KEY** | Links to `Course_Catalog(Course_ID)`. The course the student wants to take. |
| **Required_Course_ID**| VARCHAR(20) | **PK, FOREIGN KEY** | Links to `Course_Catalog(Course_ID)`. The course the student must have passed. |

---

### `Academic_Term`
Controls the temporal boundaries of the enrollment windows.
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| **Term_ID** | VARCHAR(20) | **PRIMARY KEY** | Unique term identifier (e.g., 'FALL2026'). |
| **Term_Name** | VARCHAR(50) | NOT NULL | Display name for the UI. |
| **Start_Timestamp** | TIMESTAMP | NOT NULL | Exactly when the registration window opens. |
| **End_Timestamp** | TIMESTAMP | NOT NULL | Exactly when the registration window closes. |
| **Min_Credit_Limit** | INT | NOT NULL | Minimum credits a student must take. |
| **Max_Credit_Limit** | INT | NOT NULL | Maximum credits a student can take. |

### `Section`
The physical student batches generated post-registration by the Assistant Dean.
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| **Section_ID** | VARCHAR(30) | **PRIMARY KEY** | Unique batch identifier (e.g., 'CS301-F26-A'). |
| **Section_Name** | VARCHAR(10) | NOT NULL | Display name (e.g., 'A', 'B', 'C'). |
| **Course_ID** | VARCHAR(20) | **FOREIGN KEY** | Links to `Course_Catalog(Course_ID)`. |
| **Term_ID** | VARCHAR(20) | **FOREIGN KEY** | Links to `Academic_Term(Term_ID)`. |

### `Course_Slot`
The physical timetable scheduling a section to a room and faculty member.
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| **Slot_ID** | SERIAL | **PRIMARY KEY** | Auto-incrementing internal ID. |
| **Section_ID** | VARCHAR(30) | **FOREIGN KEY** | Links to `Section(Section_ID)`. |
| **Faculty_ID** | VARCHAR(20) | **FOREIGN KEY** | Links to `Users(User_ID)`. The professor teaching this specific slot. |
| **Room_Number** | VARCHAR(50) | NOT NULL | The physical location. |
| **Day_of_Week** | VARCHAR(15) | NOT NULL | Day the slot occurs. |
| **Start_Time** | TIME | NOT NULL | Start time of the lecture/lab. |
| **End_Time** | TIME | NOT NULL | End time of the lecture/lab. |
| **Syllabus** | TEXT | NULLABLE | Specific syllabus or notes for this block. |

---

### `Registration`
The master enrollment table.
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| **Enrollment_ID** | SERIAL | **PRIMARY KEY** | Auto-incrementing internal ID. |
| **Student_ID** | VARCHAR(20) | **FOREIGN KEY** | Links to `Users(User_ID)`. |
| **Course_ID** | VARCHAR(20) | **FOREIGN KEY** | Links to `Course_Catalog(Course_ID)`. |
| **Term_ID** | VARCHAR(20) | **FOREIGN KEY** | Links to `Academic_Term(Term_ID)`. |
| **Section_ID** | VARCHAR(30) | **FOREIGN KEY** | Links to `Section(Section_ID)`. **NULL upon initial registration.** |
| **Status** | VARCHAR(30) | NOT NULL | Enum: Pending_Allocation, Enrolled, Waitlisted, Dropped. |
| **Final_Grade** | VARCHAR(5) | NULLABLE | Recorded by faculty at the end of the term. |

### `Override_Request`
Auditable log of administrative exception requests submitted by students.
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| **Request_ID** | SERIAL | **PRIMARY KEY** | Auto-incrementing internal ID. |
| **Student_ID** | VARCHAR(20) | **FOREIGN KEY** | Links to `Users(User_ID)`. |
| **Course_ID** | VARCHAR(20) | **FOREIGN KEY** | Links to `Course_Catalog(Course_ID)`. |
| **Reason** | TEXT | NOT NULL | Student's justification for the override. |
| **Approval_Status** | VARCHAR(20) | DEFAULT 'Pending' | Enum: Pending, Approved, Rejected. |
| **Created_At** | TIMESTAMP | DEFAULT NOW() | Timestamp of request submission. |

### `Academic_Roadmap`
Stores the student's planned future semester paths.
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| **Roadmap_ID** | SERIAL | **PRIMARY KEY** | Auto-incrementing internal ID. |
| **Student_ID** | VARCHAR(20) | **FOREIGN KEY** | Links to `Users(User_ID)`. |
| **Course_ID** | VARCHAR(20) | **FOREIGN KEY** | Links to `Course_Catalog(Course_ID)`. |
| **Planned_Term**| INT | NOT NULL | The specific B.Tech semester (1-8) this course is intended for. |