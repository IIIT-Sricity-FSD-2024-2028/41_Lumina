
document.addEventListener('DOMContentLoaded', () => {

    const API_BASE = 'http://localhost:3000';
    
    // --- 1. PASSWORD VISIBILITY TOGGLE ---
    const passwordInput = document.getElementById('password');
    const toggleButton = document.querySelector('.password-toggle');

    if (toggleButton && passwordInput) {
        toggleButton.addEventListener('click', () => {
            const isPassword = passwordInput.getAttribute('type') === 'password';
            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
            
            const icon = toggleButton.querySelector('img');
            if (icon) {
                icon.setAttribute('src', isPassword ? 'assets/icons/hide_password.svg' : 'assets/icons/hide_password.svg');
            }
        });
    }

    // --- 2. LOGIN FORM — BACKEND-DRIVEN ---
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');

    if (loginForm) {
        document.getElementById('username').addEventListener('input', () => loginError.classList.add('hidden'));
        passwordInput.addEventListener('input', () => loginError.classList.add('hidden'));

        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault(); 

            loginError.classList.add('hidden');

            const username = document.getElementById('username').value.trim();
            const password = passwordInput.value;

            try {
                const res = await fetch(`${API_BASE}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        User_ID: username,
                        Password: password,
                    }),
                });

                if (!res.ok) {
                    // 401 or other error — show the error box
                    loginError.classList.remove('hidden');
                    passwordInput.value = '';
                    passwordInput.focus();
                    return;
                }

                // SUCCESS — backend returns { User_ID, Full_Name, Role, Dept_ID, Email }
                const sessionData = await res.json();
                localStorage.setItem('Lumina_Session', JSON.stringify(sessionData));

                // Route to dashboard based on role
                switch (sessionData.Role) {
                    case 'Student': window.location.href = 'student_index.html'; break;
                    case 'Faculty': window.location.href = 'faculty_home.html'; break;
                    case 'Assistant_Dean_1': window.location.href = 'Dean1_dashboard.html'; break;
                    case 'Assistant_Dean_2': window.location.href = 'Dean2_index.html'; break;
                    case 'Dean': window.location.href = 'dean.html'; break;
                    default: console.error("Unknown role:", sessionData.Role);
                }

            } catch (err) {
                console.error('Login network error:', err);
                loginError.classList.remove('hidden');
                const errorText = loginError.querySelector('.error-text');
                if (errorText) errorText.textContent = 'Cannot connect to server. Please try again.';
                passwordInput.value = '';
                passwordInput.focus();
            }
        });
    }
});