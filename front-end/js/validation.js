
const Validator = {
    // --- Validation Rules ---
    isNotEmpty: (value) => value.trim().length > 0,
    
    // Matches actual Lumina DB user-ID formats:
    //   Students:  S2024001   (S + 7 digits)
    //   Faculty:   F2024001   (F + 7 digits)
    //   Dean:      D2024001   (D + 7 digits)
    //   Asst Dean: A1_2024001 or A2_2024001
    isInstituteId: (id) => /^(S|F|D)\d{7}$|^A[12]_\d{7}$/.test(id.trim()), 
    
    isEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),

    // --- UI Feedback Functions ---
    showError: (inputElement, errorMessage) => {
        // Prevent adding multiple error messages
        Validator.clearError(inputElement); 

        inputElement.classList.add('input-error'); // Adds red border + background
        
        // Create the error text below the input
        const errorText = document.createElement('span');
        errorText.className = 'error-message';
        errorText.innerText = errorMessage;

        // Insert it right after the input field
        inputElement.parentNode.insertBefore(errorText, inputElement.nextSibling);
    },

    clearError: (inputElement) => {
        inputElement.classList.remove('input-error');
        // Find the error message next to this input and remove it
        const nextElement = inputElement.nextElementSibling;
        if (nextElement && nextElement.classList.contains('error-message')) {
            nextElement.remove();
        }
    },

    clearAllErrors: (formElement) => {
        const inputs = formElement.querySelectorAll('input, textarea, select');
        inputs.forEach(input => Validator.clearError(input));
    }
};


document.addEventListener('DOMContentLoaded', () => {
    
    // === Contact Form Validation (index.html) ===
    const contactForm = document.getElementById('main-contact-form');
    
    if (contactForm) {
        // Clear errors as the user types for a friendly UX
        const inputs = contactForm.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', () => Validator.clearError(input));
        });

        contactForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Stop page reload
            Validator.clearAllErrors(contactForm);
            let isValid = true;

            // Grab the fields by ID
            const nameInput = document.getElementById('contact-name');
            const idInput = document.getElementById('contact-id');
            const messageInput = document.getElementById('contact-message');

            // Validate Name — must not be empty
            if (!Validator.isNotEmpty(nameInput.value)) {
                Validator.showError(nameInput, "Full name is required.");
                isValid = false;
            }

            // Validate Institute ID — must not be empty AND match format
            if (!Validator.isNotEmpty(idInput.value)) {
                Validator.showError(idInput, "Institute ID is required.");
                isValid = false;
            } else if (!Validator.isInstituteId(idInput.value)) {
                Validator.showError(idInput, "Invalid ID format (e.g., S2024001).");
                isValid = false;
            }

            // Validate Message — must not be empty AND at least 10 chars
            if (!Validator.isNotEmpty(messageInput.value)) {
                Validator.showError(messageInput, "Please enter a message.");
                isValid = false;
            } else if (messageInput.value.trim().length < 10) {
                Validator.showError(messageInput, "Message must be at least 10 characters long.");
                isValid = false;
            }

            // --- Only show toast + reset form if everything is valid ---
            if (isValid) {
                const toast = document.getElementById('contact-toast');
                const closeBtn = document.getElementById('close-contact-toast');

                if (toast) {
                    toast.classList.add('show');

                    // Auto-hide after 4 seconds
                    const toastTimeout = setTimeout(() => {
                        toast.classList.remove('show');
                    }, 4000);

                    // Allow manual close
                    if (closeBtn) {
                        closeBtn.onclick = () => {
                            toast.classList.remove('show');
                            clearTimeout(toastTimeout);
                        };
                    }
                }

                contactForm.reset();
            } else {
                // Add a subtle shake to the form on invalid submit
                contactForm.classList.add('form-shake');
                setTimeout(() => contactForm.classList.remove('form-shake'), 500);
            }
        });
    }
});