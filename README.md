# Course Enrollment and Academic Planning

## Problem Statement

At many universities, including IIIT Sri City, elective and core course registrations are often handled through manual, fragmented tools like Google Forms. These methods suffer from critical flaws:

- **No Real Time Validation:** They cannot check for seat availability or prerequisite fulfillment at the moment of submission.
- **Administrative Overhead:** Academic coordinators must manually resolve schedule clashes and credit violations.
- **Data Inconsistency:** Manual consolidation often lead to errors in final academic rosters.

Lumina is a centralized enrollment engine designed to automate the registration lifecycle. By replacing manual forms with a rule-based system, Lumina ensures that every transaction is validated instantly against institutional constraints, providing a Single Source of Truth for students, faculty, and the Academic Office.

## Identified Actors & Responsibilities

### **1. Student**

The primary user navigating the registration process. Students use Lumina to enroll in courses and plan their tentative long-term academic path toward graduation

### **2. Faculty**

The content and evaluation owners. Faculty are responsible for maintaining the instructional data for their assigned courses and ensuring student performance is recorded to update academic history.

### **3. Assistant Dean 1**

The administrator who allocates course slots, maintains the course catalogs and handles schedule conflicts.

### **4. Assistant Dean 2**

The administrator who defines enrollment constraints, configures enrollment window and manages gradesheets for students.

### **5. Dean**

The administrator who oversees and manages everything related to Assistant Dean 1 and Assistant Dean 2.

## Planned Features

### **Student**

- **Course Search & Filter:** Ability to discover courses by department, instructor, or subject area.

- **Course Enrollment Service:** Real-time seat booking with automated prerequisite and credit-limit verification.

- **Personalized Schedule:** A dynamic view of the student's class schedules.

- **Academic Progress and Planning:** Centralized view of grades, completed credits, and future courses required to fullfill Degree Requirements.

- **Notification System:** Real time alerts for enrollment window openings, deadlines, and registration approvals.

### **Faculty**

- **Academic Roster Management:** Access to the official list of students currently enrolled in their assigned courses.

- **Course Detail Management:** Tools to upload and update course descriptions, syllabi, and learning materials.

- **Schedule Management:** Ability to update or modify specific timing details for their assigned course sections.

- **Course Load Overview:** A dedicated view of all courses assigned to the faculty for the current and future terms.

- **Student Communication:** Integrated channels to broadcast updates or communicate directly with enrolled students.

### **Assistant Dean 1**

- **Course Catalog Administration:** Tools to define the master list of subjects, including Course Credits and Prerequisite chains.

- **Conflict Free Slot Allocation:** Administrative tools to assign time and rooms using an engine that prevents faculty or student batch overlaps.

### **Assistant Dean 2**

- **Enrollment Policy Configuration:** Setting the time limit and defining rules for the Enrollment Window.

- **Active Window Status:** A single toggle to emergency-pause or extend the Enrollment Window if technical issues or institutional changes arise.

- **Gradesheet Management:** Managing the gradesheet of all students.

### **Dean**

- **Mangement of Assistant Deans:** Dean can manage and overview everything that the assistant deans do.

- **Automated Roster Generation:** Exporting final, verified Academic Rosters for the Academic Office at the click of a button, replacing the need to consolidate messy Google Sheet responses.
