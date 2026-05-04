/* ==========================================================================
   DEAN DASHBOARD LOGIC (dean.js) — Backend-Driven
   ========================================================================== */

const API_BASE = 'http://localhost:3000';

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

    const headers = {
        'Content-Type': 'application/json',
        'x-role': currentUser.Role,
    };

    // Logout logic
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('Lumina_Session');
        window.location.href = 'login.html';
    });

    // --- 2. IN-MEMORY DATA ARRAYS (populated from backend) ---
    let users = [];
    let courses = [];
    let registrations = [];

    // --- 3. SYSTEM DIRECTORY (FULL CRUD ENGINE) ---
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

    // RENDER TABLE (uses camelCase keys from backend)
    function renderTable() {
        tableBody.innerHTML = '';
        users.forEach(user => {
            const rowHTML = `
                <tr style="border-bottom: 1px solid #e5e7eb; transition: background-color 0.2s;">
                    <td style="padding: 12px 8px; font-weight: 500; color: #111827;">${user.userId}</td>
                    <td style="padding: 12px 8px; color: #4b5563;">${user.fullName}</td>
                    <td style="padding: 12px 8px;">
                        <span style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; border: 1px solid #e5e7eb;">
                            ${user.role.replace(/_/g, ' ')}
                        </span>
                    </td>
                    <td style="padding: 12px 8px;">
                        <button class="btn-outline btn-sm" onclick="openModal('${user.userId}')">Manage</button>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', rowHTML);
        });
    }

    // RENDER ASSISTANT DEANS
    function renderAssistantDeans() {
        const assistantDeans = users.filter(u => u.role && u.role.includes('Assistant_Dean'));
        const deansListContainer = document.getElementById('assistant-deans-list');
        deansListContainer.innerHTML = '';
        
        assistantDeans.forEach(dean => {
            const cleanRoleName = dean.role.replace(/_/g, ' '); 
            deansListContainer.innerHTML += `
                <div class="dean-row">
                    <div class="dean-info">
                        <div class="dean-avatar"></div>
                        ${dean.fullName} (${cleanRoleName})
                    </div>
                    <span class="badge-active">ACTIVE</span>
                </div>
            `;
        });
    }

    // RENDER ENROLLMENT STATISTICS
    function renderStats() {
        const totalCourses = courses.length;
        const availableCourses = courses.filter(course => {
            const enrolledInCourse = registrations.filter(r => r.courseId === course.courseId).length;
            return enrolledInCourse < course.courseCapacity;
        });
        
        const availablePercent = totalCourses > 0
            ? Math.round((availableCourses.length / totalCourses) * 100)
            : 0;
        
        document.getElementById('course-availability-percent').innerText = `${availablePercent}%`;
        document.getElementById('course-bar').style.width = `${availablePercent}%`;
        document.getElementById('course-availability-text').innerText = `${availableCourses.length} of ${totalCourses} courses have open seats`;

        const uniqueStudentsEnrolled = new Set(registrations.map(r => r.studentId)).size;
        const instituteCap = 2000;
        const studentPercent = Math.round((uniqueStudentsEnrolled / instituteCap) * 100);

        document.getElementById('student-enrollment-count').innerText = `${uniqueStudentsEnrolled}/${instituteCap}`;
        document.getElementById('student-bar').style.width = `${studentPercent}%`;
        document.getElementById('student-enrollment-text').innerText = `${studentPercent}% of total university capacity reached`;
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
            const targetUser = users.find(u => u.userId === userId);
            
            inputId.value = targetUser.userId;
            inputId.disabled = true; 
            inputId.style.backgroundColor = "#f3f4f6"; 
            
            inputName.value = targetUser.fullName;
            inputEmail.value = targetUser.email;
            inputDept.value = targetUser.deptId;
            
            if (userId === currentUser.User_ID) {
                inputRole.innerHTML += `<option value="Dean">Dean</option>`;
                inputRole.value = "Dean";
                inputRole.disabled = true; 
                inputRole.style.backgroundColor = "#f3f4f6";
                btnDelete.classList.add('hidden'); 
            } else {
                inputRole.value = targetUser.role;
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
    document.getElementById('add-user-btn').addEventListener('click', () => openModal(null));

    // SAVE USER (POST for create, PUT for update → backend)
    crudForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
            if (isEditing) {
                const res = await fetch(`${API_BASE}/users/${inputId.value.trim()}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({
                        Full_Name: inputName.value.trim(),
                        Email: inputEmail.value.trim(),
                        Role: inputRole.value,
                        Dept_ID: inputDept.value,
                    }),
                });

                if (!res.ok) {
                    const err = await res.json();
                    alert(`Update failed: ${err.message}`);
                    return;
                }

                const updatedUser = await res.json();
                const idx = users.findIndex(u => u.userId === updatedUser.userId);
                if (idx !== -1) users[idx] = updatedUser;

                if (updatedUser.userId === currentUser.User_ID) {
                    currentUser.Full_Name = updatedUser.fullName;
                    localStorage.setItem('Lumina_Session', JSON.stringify(currentUser));
                }
            } else {
                const res = await fetch(`${API_BASE}/users`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        User_ID: inputId.value.trim(),
                        Full_Name: inputName.value.trim(),
                        Email: inputEmail.value.trim(),
                        Password: 'password123',
                        Role: inputRole.value,
                        Dept_ID: inputDept.value,
                    }),
                });

                if (!res.ok) {
                    const err = await res.json();
                    alert(`Create failed: ${err.message}`);
                    return;
                }

                const newUser = await res.json();
                users.push(newUser);
            }

            renderTable();
            closeModal();
        } catch (err) {
            console.error('Save error:', err);
            alert('Network error. Please check the backend connection.');
        }
    });

    // DELETE USER (DELETE /users/:id → backend)
    btnDelete.addEventListener('click', async (e) => {
        e.preventDefault();

        if (inputId.value === currentUser.User_ID) {
            alert("You cannot delete your own active session.");
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/users/${inputId.value}`, {
                method: 'DELETE',
                headers,
            });

            if (!res.ok) {
                const err = await res.json();
                alert(`Delete failed: ${err.message}`);
                return;
            }

            const index = users.findIndex(u => u.userId === inputId.value);
            if (index > -1) users.splice(index, 1);
            
            renderTable();
            closeModal();
        } catch (err) {
            console.error('Delete error:', err);
            alert('Network error. Please check the backend connection.');
        }
    });

    // --- 4. DOWNLOAD FORMS TOAST LOGIC ---
    const downloadLink = document.getElementById('download-forms-link');
    const downloadToast = document.getElementById('download-toast');
    const closeToastBtn = document.getElementById('close-download-toast');
    let toastTimeout;

    downloadLink.addEventListener('click', (e) => {
        e.preventDefault();
        downloadToast.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => { downloadToast.classList.remove('show'); }, 4000);
    });

    closeToastBtn.addEventListener('click', () => {
        downloadToast.classList.remove('show');
        clearTimeout(toastTimeout);
    });

    // --- 5. IMPORT DATA BUTTON LOGIC ---
    const importBtn = document.getElementById('import-data-btn');
    const importToast = document.getElementById('import-toast');
    const closeImportToastBtn = document.getElementById('close-import-toast');
    let importToastTimeout;

    importBtn.addEventListener('click', (e) => {
        e.preventDefault();
        importToast.classList.add('show');
        clearTimeout(importToastTimeout);
        importToastTimeout = setTimeout(() => { importToast.classList.remove('show'); }, 4000);
    });

    closeImportToastBtn.addEventListener('click', () => {
        importToast.classList.remove('show');
        clearTimeout(importToastTimeout);
    });

    // --- 6. FETCH DATA FROM BACKEND & RENDER ---
    async function loadDashboard() {
        try {
            const [usersRes, coursesRes, registrationsRes] = await Promise.all([
                fetch(`${API_BASE}/users`, { headers }),
                fetch(`${API_BASE}/courses`, { headers }),
                fetch(`${API_BASE}/registrations`, { headers }),
            ]);

            if (!usersRes.ok) throw new Error(`Users API: ${usersRes.status}`);
            if (!coursesRes.ok) throw new Error(`Courses API: ${coursesRes.status}`);
            if (!registrationsRes.ok) throw new Error(`Registrations API: ${registrationsRes.status}`);

            users = await usersRes.json();
            courses = await coursesRes.json();
            registrations = await registrationsRes.json();
        } catch (err) {
            console.error('Failed to fetch data from backend:', err);
            document.getElementById('course-availability-text').innerText = 'Backend unavailable';
            document.getElementById('student-enrollment-text').innerText = 'Backend unavailable';
        }

        renderAssistantDeans();
        renderStats();
        renderTable();
    }

    // Kick off data loading (non-blocking — UI is already interactive)
    loadDashboard();
});