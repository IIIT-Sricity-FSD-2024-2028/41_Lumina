
document.addEventListener('DOMContentLoaded', () => {
    
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

    // --- 2. LOGIN FORM VALIDATION & ROUTING ---
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError'); // Grab the error box

    if (loginForm) {
        document.getElementById('username').addEventListener('input', () => loginError.classList.add('hidden'));
        passwordInput.addEventListener('input', () => loginError.classList.add('hidden'));

        loginForm.addEventListener('submit', function (e) {
            e.preventDefault(); 

            // Always hide the error when they hit submit, just in case
            loginError.classList.add('hidden');

            const username = document.getElementById('username').value.trim();
            const password = passwordInput.value;
            const usersData = localStorage.getItem('Lumina_Users');

            if (!usersData) {
                console.error("Database not initialized.");
                return;
            }

            const users = JSON.parse(usersData);
            const validUser = users.find(u => u.User_ID === username && u.Password === password);

            if (validUser) {
                // SUCCESS
                const sessionData = {
                    User_ID: validUser.User_ID,
                    Full_Name: validUser.Full_Name,
                    Role: validUser.Role,
                    Dept_ID: validUser.Dept_ID
                };
                localStorage.setItem('Lumina_Session', JSON.stringify(sessionData));

                // Route to dashboard
                switch (validUser.Role) {
                    case 'Student': window.location.href = 'student.html'; break;
                    case 'Faculty': window.location.href = 'faculty.html'; break;
                    case 'Assistant_Dean_1': window.location.href = 'admin1.html'; break;
                    case 'Assistant_Dean_2': window.location.href = 'admin2.html'; break;
                    case 'Dean': window.location.href = 'dean.html'; break;
                    default: console.error("Unknown role.");
                }
            } else {
                // FAILURE - INDUSTRY STANDARD UX
                // Remove the 'hidden' class to show the red box
                loginError.classList.remove('hidden');
                
                // Clear the password field and put the cursor back in it
                passwordInput.value = '';
                passwordInput.focus();
            }
        });
    }
});