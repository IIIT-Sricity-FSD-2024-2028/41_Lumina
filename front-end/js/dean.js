/* ==========================================================================
   DEAN DASHBOARD LOGIC (dean.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SESSION PROTECTION ---
    const sessionData = localStorage.getItem('Lumina_Session');
    if (!sessionData) {
        window.location.href = 'login.html';
        return;
    }
    const currentUser = JSON.parse(sessionData);
    if (currentUser.Role !== 'Dean') {
        window.location.href = 'login.html';
        return;
    }

    // Logout logic
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('Lumina_Session');
        window.location.href = 'login.html';
    });

    // --- 2. FETCH DATABASE ---
    let users = JSON.parse(localStorage.getItem('Lumina_Users')) || [];
    const courses = JSON.parse(localStorage.getItem('Lumina_Course_Catalog')) || [];
    const registrations = JSON.parse(localStorage.getItem('Lumina_Registration')) || [];

    // --- 3. DYNAMIC ASSISTANT DEANS ---
    const assistantDeans = users.filter(u => u.Role.includes('Assistant_Dean'));
    const deansListContainer = document.getElementById('assistant-deans-list');
    
    assistantDeans.forEach(dean => {
        const cleanRoleName = dean.Role.replace(/_/g, ' '); 
        deansListContainer.innerHTML += `
            <div class="dean-row">
                <div class="dean-info">
                    <div class="dean-avatar"></div>
                    ${dean.Full_Name} (${cleanRoleName})
                </div>
                <span class="badge-active">ACTIVE</span>
            </div>
        `;
    });

    // --- 4. CALCULATE REAL ENROLLMENT STATISTICS ---
    const totalCourses = courses.length;
    const availableCourses = courses.filter(course => {
        const enrolledInCourse = registrations.filter(r => r.Course_ID === course.Course_ID).length;
        return enrolledInCourse < course.Course_Capacity;
    });
    
    const availablePercent = Math.round((availableCourses.length / totalCourses) * 100) || 0;
    
    document.getElementById('course-availability-percent').innerText = `${availablePercent}%`;
    document.getElementById('course-bar').style.width = `${availablePercent}%`;
    document.getElementById('course-availability-text').innerText = `${availableCourses.length} of ${totalCourses} courses have open seats`;

    const uniqueStudentsEnrolled = new Set(registrations.map(r => r.Student_ID)).size;
    const instituteCap = 2000;
    const studentPercent = Math.round((uniqueStudentsEnrolled / instituteCap) * 100);

    document.getElementById('student-enrollment-count').innerText = `${uniqueStudentsEnrolled}/${instituteCap}`;
    document.getElementById('student-bar').style.width = `${studentPercent}%`;
    document.getElementById('student-enrollment-text').innerText = `${studentPercent}% of total university capacity reached`;


    // --- 5. DOWNLOAD FORMS TOAST LOGIC ---
    const downloadLink = document.getElementById('download-forms-link');
    const downloadToast = document.getElementById('download-toast');
    const closeToastBtn = document.getElementById('close-download-toast');
    let toastTimeout;

    downloadLink.addEventListener('click', (e) => {
        e.preventDefault();
        downloadToast.classList.add('show');
        
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            downloadToast.classList.remove('show');
        }, 4000);
    });

    closeToastBtn.addEventListener('click', () => {
        downloadToast.classList.remove('show');
        clearTimeout(toastTimeout);
    });


    // --- 6. IMPORT DATA BUTTON LOGIC ---
    const importBtn = document.getElementById('import-data-btn');
    const importToast = document.getElementById('import-toast');
    const closeImportToastBtn = document.getElementById('close-import-toast');
    let importToastTimeout;

    importBtn.addEventListener('click', (e) => {
        e.preventDefault();
        importToast.classList.add('show');
        
        clearTimeout(importToastTimeout);
        importToastTimeout = setTimeout(() => {
            importToast.classList.remove('show');
        }, 4000);
    });

    closeImportToastBtn.addEventListener('click', () => {
        importToast.classList.remove('show');
        clearTimeout(importToastTimeout);
    });


    // --- 7. SYSTEM DIRECTORY (FULL CRUD ENGINE) ---
    const tableBody = document.getElementById('user-table-body');
    const modal = document.getElementById('crud-modal');
    const crudForm = document.getElementById('crud-form');
    const modalTitle = document.getElementById('modal-title');
    const btnDelete = document.getElementById('delete-btn');
    
    const inputId = document.getElementById('modal-id');
    const inputName = document.getElementById('modal-name');
    const inputEmail = document.getElementById('modal-email');
    const inputRole = document.getElementById('modal-role');
    const inputDept = document.getElementById('modal-dept');

    let isEditing = false; 

    // RENDER TABLE
    function renderTable() {
        tableBody.innerHTML = '';
        users.forEach(user => {
            const rowHTML = `
                <tr style="border-bottom: 1px solid #e5e7eb; transition: background-color 0.2s;">
                    <td style="padding: 12px 8px; font-weight: 500; color: #111827;">${user.User_ID}</td>
                    <td style="padding: 12px 8px; color: #4b5563;">${user.Full_Name}</td>
                    <td style="padding: 12px 8px;">
                        <span style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; border: 1px solid #e5e7eb;">
                            ${user.Role.replace(/_/g, ' ')}
                        </span>
                    </td>
                    <td style="padding: 12px 8px;">
                        <button class="btn-outline btn-sm" onclick="openModal('${user.User_ID}')">Manage</button>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', rowHTML);
        });
    }

    // OPEN MODAL
    window.openModal = function(userId = null) {
        
        inputRole.innerHTML = `
            <option value="Student">Student</option>
            <option value="Faculty">Faculty</option>
            <option value="Assistant_Dean_1">Assistant Dean 1</option>
            <option value="Assistant_Dean_2">Assistant Dean 2</option>
        `;

        if (userId) {
            isEditing = true;
            modalTitle.innerText = "Edit User Details";
            const targetUser = users.find(u => u.User_ID === userId);
            
            inputId.value = targetUser.User_ID;
            inputId.disabled = true; 
            inputId.style.backgroundColor = "#f3f4f6"; 
            
            inputName.value = targetUser.Full_Name;
            inputEmail.value = targetUser.Email;
            inputDept.value = targetUser.Dept_ID;
            
            if (userId === currentUser.User_ID) {
                inputRole.innerHTML += `<option value="Dean">Dean</option>`;
                inputRole.value = "Dean";
                inputRole.disabled = true; 
                inputRole.style.backgroundColor = "#f3f4f6";
                btnDelete.classList.add('hidden'); 
            } else {
                inputRole.value = targetUser.Role;
                inputRole.disabled = false;
                inputRole.style.backgroundColor = "#ffffff";
                btnDelete.classList.remove('hidden'); 
            }
        } else {
            isEditing = false;
            modalTitle.innerText = "Add New User";
            crudForm.reset(); 
            
            inputId.disabled = false;
            inputId.style.backgroundColor = "#ffffff";
            inputRole.disabled = false;
            inputRole.style.backgroundColor = "#ffffff";
            btnDelete.classList.add('hidden');
        }
        
        modal.classList.remove('hidden');
    };

    // CLOSE MODAL
    function closeModal() { 
        modal.classList.add('hidden'); 
    }
    
    document.getElementById('close-modal-btn').addEventListener('click', closeModal);
    document.getElementById('cancel-btn').addEventListener('click', closeModal);

    // SAVE USER
    crudForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (isEditing) {
            const index = users.findIndex(u => u.User_ID === inputId.value.trim());
            if (index !== -1) {
                users[index].Full_Name = inputName.value.trim();
                users[index].Email = inputEmail.value.trim();
                users[index].Role = inputRole.value;
                users[index].Dept_ID = inputDept.value;
            }
            
            if (users[index].User_ID === currentUser.User_ID) {
                currentUser.Full_Name = users[index].Full_Name;
                localStorage.setItem('Lumina_Session', JSON.stringify(currentUser));
            }
        } else {
            if (users.some(u => u.User_ID === inputId.value.trim())) {
                alert("Error: This User ID already exists in the system.");
                return;
            }
            
            const newUser = {
                User_ID: inputId.value.trim(),
                Full_Name: inputName.value.trim(),
                Email: inputEmail.value.trim(),
                Password: "password123", // System default password
                Role: inputRole.value, 
                Dept_ID: inputDept.value
            };
            users.push(newUser);
        }

        localStorage.setItem('Lumina_Users', JSON.stringify(users));
        renderTable();
        closeModal();
    });

    // DELETE USER
    btnDelete.addEventListener('click', (e) => {
        e.preventDefault();

        if (inputId.value === currentUser.User_ID) {
            alert("You cannot delete your own active session.");
            return;
        }

        const index = users.findIndex(u => u.User_ID === inputId.value);
        if (index > -1) {
            users.splice(index, 1);
            localStorage.setItem('Lumina_Users', JSON.stringify(users));
            renderTable();
            closeModal();
        }
    });

    document.getElementById('add-user-btn').addEventListener('click', () => openModal(null));
    renderTable();
});