const mockDatabase = {
    Department: [
        { Dept_ID: "CSE", Dept_Name: "Computer Science and Engineering", Total_Required_Credits: 160 },
        { Dept_ID: "ECE", Dept_Name: "Electronics and Communication Engineering", Total_Required_Credits: 150 },
        { Dept_ID: "AIDS", Dept_Name: "AI & Data Science", Total_Required_Credits: 140 },
        { Dept_ID: "MATH", Dept_Name: "Mathematics", Total_Required_Credits: 120 }
    ],
    Users: [
        { User_ID: "S1023", Full_Name: "John Miller", Role: "Student", Dept_ID: "CSE" },
        { User_ID: "S1045", Full_Name: "Alice Smith", Role: "Student", Dept_ID: "ECE" },
        { User_ID: "S1089", Full_Name: "Michael Brown", Role: "Student", Dept_ID: "AIDS" }
    ],
    Course_Catalog: [
        { Course_ID: "CSE302", Course_Name: "Data Structures", Credits: 4 },
        { Course_ID: "ECE201", Course_Name: "Digital Logic", Credits: 3 },
        { Course_ID: "ME301", Course_Name: "Thermodynamics", Credits: 4 }
    ],
    Enrollment_Phases: [
        { id: 1, name: "Final Year Registration", eligible: "Final Year", timeline: "Aug 1 - Aug 2", status: "Completed" },
        { id: 2, name: "3rd Year Registration", eligible: "3rd Year", timeline: "Aug 3 - Aug 4", status: "Active" },
        { id: 3, name: "2nd Year Registration", eligible: "2nd Year", timeline: "Aug 5 - Aug 6", status: "Upcoming" },
        { id: 4, name: "1st Year Registration", eligible: "1st Year", timeline: "Aug 7 - Aug 8", status: "Upcoming" },
        { id: 5, name: "Backlog Registration", eligible: "Backlog Students", timeline: "Aug 9 - Aug 10", status: "Upcoming" },
        { id: 6, name: "Add / Drop Period", eligible: "All Students", timeline: "Aug 11 - Aug 12", status: "Upcoming" }
    ],
    Enrollment_Settings: [
        {
            id: 1,
            systemStatus: "Active",
            windowStatus: "Open",
            startDate: "2025-08-01T08:00",
            endDate: "2025-08-10T23:59"
        }
    ],
    Override_Requests: [
        { id: 'OR-1042', name: 'John Miller',   sid: 'S1023', dept: 'CSE',  year: '3rd Year', course: 'CSE302 (Data Structures)',  reason: 'Course Full (Needs seat override)',  date: 'August 12, 2025', status: 'Pending'  },
        { id: 'OR-1088', name: 'Alice Smith',   sid: 'S1045', dept: 'ECE',  year: '2nd Year', course: 'ECE201 (Signals & Systems)', reason: 'Missing Prerequisite (Math 101)',    date: 'August 11, 2025', status: 'Approved' },
        { id: 'OR-1102', name: 'Michael Brown', sid: 'S1089', dept: 'AIDS', year: '3rd Year', course: 'CS301 (Thermodynamics)',      reason: 'Schedule Time Conflict',            date: 'August 10, 2025', status: 'Rejected' },
        { id: 'OR-1105', name: 'Priya Sharma',  sid: 'S1101', dept: 'CSE',  year: '2nd Year', course: 'CSE201 (Algorithms)',         reason: 'Course Full (Needs seat override)',  date: 'August 13, 2025', status: 'Pending'  },
        { id: 'OR-1110', name: 'Rahul Verma',   sid: 'S1115', dept: 'ECE',  year: '4th Year', course: 'ECE401 (VLSI Design)',        reason: 'Missing Prerequisite (ECE301)',      date: 'August 13, 2025', status: 'Pending'  }
    ],
    Academic_Term_Settings: [
        { academicYear: "", term: "Spring", isLocked: false }
    ],
    Policy_Settings: [
        {
            status: "Validated",
            isLocked: false,
            minCredits: 12,
            maxCredits: 21,
            maxCourses: 6,
            enforcePrereq: true,
            allowConditional: false,
            allowAdvisorOverride: true,
            minGpa: 5.0,
            financialClearance: true,
            advisorApproval: true
        }
    ],
    Policy_Change_Log: [
        { message: "Max credits increased to 21", by: "Dr. Jenkins", time: "2 hours ago" },
        { message: "Enforce Prerequisites Enabled", by: "System Admin", time: "5 hours ago" },
        { message: "Term Updated: Fall 2025", by: "Dr. Jenkins", time: "Yesterday" },
        { message: "New Policy Draft Created", by: "Registrar Office", time: "2 days ago" }
    ]
};

function initializeLuminaDB() {
    for (const [tableName, tableData] of Object.entries(mockDatabase)) {
        if (!localStorage.getItem(`Lumina_${tableName}`)) {
            localStorage.setItem(`Lumina_${tableName}`, JSON.stringify(tableData));
        }
    }
}

const DB = {
    get: (table) => {
        const data = localStorage.getItem(`Lumina_${table}`);
        return data ? JSON.parse(data) : [];
    },
    set: (table, data) => localStorage.setItem(`Lumina_${table}`, JSON.stringify(data)),
    reset: () => {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith("Lumina_")) localStorage.removeItem(key);
        });
        initializeLuminaDB();
        location.reload();
    }
};

initializeLuminaDB();
window.resetLuminaDB = DB.reset;
