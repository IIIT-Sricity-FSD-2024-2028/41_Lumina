const mockDatabase = {

    // 1. Department Table
    Department: [
        { Dept_ID: "CSE", Dept_Name: "Computer Science and Engineering", Total_Required_Credits: 160 },
        { Dept_ID: "MATH", Dept_Name: "Mathematics", Total_Required_Credits: 120 },
        { Dept_ID: "HUM", Dept_Name: "Humanities", Total_Required_Credits: 120 },
        { Dept_ID: "PHYS", Dept_Name: "Physics", Total_Required_Credits: 120 },
        { Dept_ID: "ECON", Dept_Name: "Economics", Total_Required_Credits: 120 }
    ],

    // 2. Users Table (Added more students for Manoj's roster, kept Prof. Arun)
    Users: [
        { User_ID: "S2024001", Full_Name: "Mahtab Alam", Email: "mahtab@lumina.iiits.in", Password: "password123", Role: "Student", Dept_ID: "CSE" },
        { User_ID: "S2024002", Full_Name: "Roshan Karthik", Email: "roshan@lumina.iiits.in", Password: "password123", Role: "Student", Dept_ID: "CSE" },
        { User_ID: "S2024003", Full_Name: "Jane Doe", Email: "jane@lumina.iiits.in", Password: "password123", Role: "Student", Dept_ID: "MATH" },
        { User_ID: "F2024001", Full_Name: "Dr. Arun P V", Email: "arun.pv@lumina.iiits.in", Password: "password123", Role: "Faculty", Dept_ID: "CSE" },
        { User_ID: "A1_2024001", Full_Name: "Ravi Kumar", Email: "admin1@lumina.iiits.in", Password: "password123", Role: "Assistant_Dean_1", Dept_ID: "CSE" },
        { User_ID: "A2_2024001", Full_Name: "Eswar Vardhan", Email: "admin2@lumina.iiits.in", Password: "password123", Role: "Assistant_Dean_2", Dept_ID: "CSE" },
        { User_ID: "D2024001", Full_Name: "Super Dean", Email: "dean@lumina.iiits.in", Password: "password123", Role: "Dean", Dept_ID: "CSE" }
    ],

    // 3. Students Table
    Students: [
        { Student_ID: "S2024001", Current_Semester: 4, Enrollment_Year: 2024 },
        { Student_ID: "S2024002", Current_Semester: 4, Enrollment_Year: 2024 },
        { Student_ID: "S2024003", Current_Semester: 2, Enrollment_Year: 2025 }
    ],

    // 4. Course_Catalog Table (Expanded to test Roshan's Search/Filter/Pagination)
    Course_Catalog: [
        { Course_ID: "CS101", Course_Name: "Introduction to Programming", Credits: 4, Course_Capacity: 100, Status: "Active", Dept_ID: "CSE" },
        { Course_ID: "CS201", Course_Name: "Introduction to Algorithms", Credits: 4, Course_Capacity: 60, Status: "Active", Dept_ID: "CSE" },
        { Course_ID: "CS301", Course_Name: "Operating Systems", Credits: 4, Course_Capacity: 50, Status: "Active", Dept_ID: "CSE" },
        { Course_ID: "CS440", Course_Name: "Artificial Intelligence", Credits: 4, Course_Capacity: 50, Status: "Active", Dept_ID: "CSE" },
        { Course_ID: "MAT101", Course_Name: "Calculus I", Credits: 3, Course_Capacity: 80, Status: "Active", Dept_ID: "MATH" },
        { Course_ID: "MAT305", Course_Name: "Linear Algebra & Applications", Credits: 3, Course_Capacity: 50, Status: "Active", Dept_ID: "MATH" },
        { Course_ID: "PHY101", Course_Name: "Classical Mechanics", Credits: 4, Course_Capacity: 60, Status: "Active", Dept_ID: "PHYS" },
        { Course_ID: "ENG102", Course_Name: "Technical Writing for Engineers", Credits: 2, Course_Capacity: 40, Status: "Active", Dept_ID: "HUM" },
        { Course_ID: "ECO201", Course_Name: "Macroeconomics 101", Credits: 3, Course_Capacity: 45, Status: "Active", Dept_ID: "ECON" }
    ],

    // 5. Degree_Requirements Table
    Degree_Requirements: [
        { Requirement_ID: 1, Dept_ID: "CSE", Course_ID: "CS101", Course_Type: "Core", Target_Semester: 1 },
        { Requirement_ID: 2, Dept_ID: "CSE", Course_ID: "CS201", Course_Type: "Core", Target_Semester: 3 },
        { Requirement_ID: 3, Dept_ID: "CSE", Course_ID: "CS301", Course_Type: "Core", Target_Semester: 5 },
        { Requirement_ID: 4, Dept_ID: "CSE", Course_ID: "CS440", Course_Type: "Elective", Target_Semester: 6 }
    ],

    // 6. Course_Prerequisite Table (Creates a chain: CS101 -> CS201 -> CS301)
    Course_Prerequisite: [
        { Target_Course_ID: "CS201", Required_Course_ID: "CS101" },
        { Target_Course_ID: "CS301", Required_Course_ID: "CS201" },
        { Target_Course_ID: "CS440", Required_Course_ID: "CS201" }
    ],

    // 7. Academic_Term Table
    Academic_Term: [
        { Term_ID: "FALL2026", Term_Name: "Fall 2026", Start_Timestamp: "2026-08-01T00:00:00Z", End_Timestamp: "2026-12-15T00:00:00Z", Min_Credit_Limit: 12, Max_Credit_Limit: 24 }
    ],

    // 8. Section Table
    Section: [
        { Section_ID: "CS201-S1", Section_Name: "S1", Course_ID: "CS201", Term_ID: "FALL2026" },
        { Section_ID: "CS301-S1", Section_Name: "S1", Course_ID: "CS301", Term_ID: "FALL2026" },
        { Section_ID: "CS440-S1", Section_Name: "S1", Course_ID: "CS440", Term_ID: "FALL2026" }
    ],

    // 9. Course_Slot Table (Assigns Prof. Arun to CS201 and CS440)
    Course_Slot: [
        { Slot_ID: 1, Section_ID: "CS201-S1", Faculty_ID: "F2024001", Room_Number: "Room 101", Day_of_Week: "Monday", Start_Time: "09:00", End_Time: "10:30", Syllabus: "Algorithmic analysis..." },
        { Slot_ID: 2, Section_ID: "CS440-S1", Faculty_ID: "F2024001", Room_Number: "Lab 3", Day_of_Week: "Wednesday", Start_Time: "14:00", End_Time: "16:00", Syllabus: "Neural Networks..." }
    ],

    // 10. Registration Table (Creates a real roster for Manoj to display)
    Registration: [
        { Enrollment_ID: 1, Student_ID: "S2024001", Course_ID: "CS201", Term_ID: "FALL2026", Section_ID: "CS201-S1", Status: "Enrolled", Final_Grade: null },
        { Enrollment_ID: 2, Student_ID: "S2024002", Course_ID: "CS201", Term_ID: "FALL2026", Section_ID: "CS201-S1", Status: "Enrolled", Final_Grade: null },
        { Enrollment_ID: 3, Student_ID: "S2024003", Course_ID: "CS201", Term_ID: "FALL2026", Section_ID: "CS201-S1", Status: "Waitlisted", Final_Grade: null },
        { Enrollment_ID: 4, Student_ID: "S2024001", Course_ID: "CS301", Term_ID: "FALL2026", Section_ID: "CS301-S1", Status: "Enrolled", Final_Grade: null }
    ],

    // 11. Override_Request Table (Gives Eswar multiple statuses to render)
    Override_Request: [
        { Request_ID: 1, Student_ID: "S2024001", Course_ID: "CS440", Reason: "Requesting to take without full prerequisite due to prior experience.", Approval_Status: "Pending", Created_At: "2026-03-29T10:00:00Z" },
        { Request_ID: 2, Student_ID: "S2024002", Course_ID: "MAT305", Reason: "Timetable clash resolution", Approval_Status: "Approved", Created_At: "2026-03-28T14:30:00Z" },
        { Request_ID: 3, Student_ID: "S2024003", Course_ID: "CS301", Reason: "Credit overload request", Approval_Status: "Rejected", Created_At: "2026-03-25T09:15:00Z" }
    ],

    // 12. Academic_Roadmap Table
    Academic_Roadmap: [
        { Roadmap_ID: 1, Student_ID: "S2024001", Course_ID: "CS440", Planned_Term: 5 },
        { Roadmap_ID: 2, Student_ID: "S2024001", Course_ID: "ECO201", Planned_Term: 6 }
    ]
};

function initializeLuminaDB() {
    console.log("Checking Lumina DB Initialization...");

    for (const [tableName, tableData] of Object.entries(mockDatabase)) {
        if (!localStorage.getItem(`Lumina_${tableName}`)) {
            localStorage.setItem(`Lumina_${tableName}`, JSON.stringify(tableData));
            console.log(`Initialized table: Lumina_${tableName}`);
        }
    }
    
    console.log("Lumina Database Ready!");
}

initializeLuminaDB();

// Run this in the browser console to factory reset the app during the presentation
window.resetLuminaDB = function() {
    console.log("Wiping database...");
    for (const key in localStorage) {
        if (key.startsWith("Lumina_")) {
            localStorage.removeItem(key);
        }
    }
    console.log("Database wiped. Re-initializing...");
    initializeLuminaDB();
    alert("Database has been factory reset!");
    location.reload();
};