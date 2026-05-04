/* ==========================================================================
   COURSE CATALOG LOGIC (course.js)
   Fetches courses from the NestJS backend, handles dynamic filtering, 
   and powers pagination (9 per page).
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
    
    const API_BASE = 'http://localhost:3000';
    const courseGrid = document.getElementById('course-grid');
    const filterForm = document.getElementById('course-filter-form');
    const paginationContainer = document.querySelector('.pagination');
    
    const searchInput = document.getElementById('search-input');
    const deptSelect = document.getElementById('dept-select');
    const typeSelect = document.getElementById('type-select');
    const creditSelect = document.getElementById('credit-select');

    let allCourses = [];
    let currentFilteredCourses = [];
    let currentPage = 1;
    const itemsPerPage = 9;

    // --- 1. Fetch from Backend ---
    async function loadCourses() {
        try {
            const res = await fetch(`${API_BASE}/courses`, {
                headers: { 'x-role': 'Student' }
            });
            if (res.ok) {
                const backendCourses = await res.json();
                allCourses = backendCourses.map(course => ({
                    Course_ID: course.courseId,
                    Course_Name: course.courseName,
                    Credits: course.credits,
                    Dept_ID: course.deptId,
                    Status: course.status,
                    Course_Type: 'Program Core'
                }));
            }
        } catch (e) {
            console.error('Failed to fetch courses from backend:', e);
        }

        currentFilteredCourses = allCourses;
        renderCourses();
    }

    // --- 2. Render HTML Cards (With Pagination Slice) ---
    function renderCourses() {
        courseGrid.innerHTML = '';

        if (currentFilteredCourses.length === 0) {
            courseGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #64748b;">
                    <h3>No courses found</h3>
                    <p>Try adjusting your search filters.</p>
                </div>`;
            paginationContainer.innerHTML = '';
            return;
        }

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const coursesToDisplay = currentFilteredCourses.slice(startIndex, endIndex);

        coursesToDisplay.forEach(course => {
            let badgeClass = 'badge-elective'; 
            if (course.Course_Type === 'Institute Core') badgeClass = 'badge-institute-core';
            if (course.Course_Type === 'Program Core') badgeClass = 'badge-program-core';
            if (course.Course_Type === 'SEED') badgeClass = 'badge-seed';

            const cardHTML = `
                <article class="course-card">
                    <div class="card-top">
                        <span class="course-code">${course.Course_ID}</span>
                        <span class="badge ${badgeClass}">${course.Course_Type}</span>
                    </div>
                    <h2 class="course-title">${course.Course_Name}</h2>
                    <div class="course-meta">
                        <span class="meta-item">
                            <img src="assets/icons/credit_icon.svg" alt="" style="width: 16px; margin-right: 4px;"> 
                            Credits: ${course.Credits}
                        </span>
                        <span class="meta-item">
                            <img src="assets/icons/dept.svg" alt="" style="width: 16px; margin-right: 4px;"> 
                            Department: ${course.Dept_ID}
                        </span>
                    </div>
                </article>
            `;
            courseGrid.insertAdjacentHTML('beforeend', cardHTML);
        });

        renderPaginationUI();
    }

    // --- 3. Render Pagination Buttons ---
    function renderPaginationUI() {
        const totalPages = Math.ceil(currentFilteredCourses.length / itemsPerPage);
        paginationContainer.innerHTML = '';

        if (totalPages <= 1) return;

        const prevDisabled = currentPage === 1 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : '';
        paginationContainer.innerHTML += `<button class="page-btn text-muted" id="prev-btn" ${prevDisabled}>Previous</button>`;

        for (let i = 1; i <= totalPages; i++) {
            const activeClass = i === currentPage ? 'active' : '';
            paginationContainer.innerHTML += `<button class="page-btn page-num ${activeClass}" data-page="${i}">${i}</button>`;
        }

        const nextDisabled = currentPage === totalPages ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : '';
        paginationContainer.innerHTML += `<button class="page-btn text-muted" id="next-btn" ${nextDisabled}>Next</button>`;

        if (currentPage > 1) {
            document.getElementById('prev-btn').addEventListener('click', () => {
                currentPage--;
                renderCourses();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
        
        if (currentPage < totalPages) {
            document.getElementById('next-btn').addEventListener('click', () => {
                currentPage++;
                renderCourses();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        document.querySelectorAll('.page-num').forEach(btn => {
            btn.addEventListener('click', (e) => {
                currentPage = parseInt(e.target.getAttribute('data-page'));
                renderCourses();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    }

    // --- 4. Filter Logic ---
    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedDept = deptSelect.value;
        const selectedType = typeSelect.value;
        const selectedCredit = creditSelect.value;

        currentFilteredCourses = allCourses.filter(course => {
            const matchesSearch = course.Course_ID.toLowerCase().includes(searchTerm) || 
                                  course.Course_Name.toLowerCase().includes(searchTerm);
            
            const matchesDept = selectedDept === 'all' || course.Dept_ID === selectedDept;
            const matchesType = selectedType === 'all' || course.Course_Type === selectedType;
            const matchesCredit = selectedCredit === 'all' || course.Credits.toString() === selectedCredit;

            return matchesSearch && matchesDept && matchesType && matchesCredit;
        });

        currentPage = 1; 
        renderCourses();
    }

    // --- 5. Event Listeners ---
    filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        applyFilters();
    });

    deptSelect.addEventListener('change', applyFilters);
    typeSelect.addEventListener('change', applyFilters);
    creditSelect.addEventListener('change', applyFilters);
    searchInput.addEventListener('input', applyFilters); 

    // Initialize the page
    await loadCourses();
});