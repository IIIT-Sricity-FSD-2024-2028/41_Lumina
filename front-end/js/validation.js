
const Validator = {
    // --- Validation Rules ---
    isNotEmpty: (value) => value.trim().length > 0,
    
    // Checks if it looks like S2024001, F2024001, or A1_2024001
    isInstituteId: (id) => /^[a-zA-Z0-9_]{5,12}$/.test(id.trim()), 
    
    isEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),

    // --- UI Feedback Functions ---
    showError: (inputElement, errorMessage) => {
        // Prevent adding multiple error messages
        Validator.clearError(inputElement); 

        inputElement.classList.add('input-error'); // Adds red border
        
        // Create the red text below the input
        const errorText = document.createElement('span');
        errorText.className = 'error-message text-sm text-red mt-1';
        errorText.style.color = '#b91c1c';
        errorText.style.fontSize = '0.75rem';
        errorText.style.display = 'block';
        errorText.style.marginTop = '4px';
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
    
    // 1. Validate the Contact Form (on index.html)
    const contactForm = document.querySelector('.contact-form');
    
    if (contactForm) {
        // Clear errors as the user types to be user-friendly
        const inputs = contactForm.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', () => Validator.clearError(input));
        });

        contactForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Stop page reload
            Validator.clearAllErrors(contactForm);
            let isValid = true;

            // Grab the fields based on their placeholder or type (since we didn't add IDs earlier)
            const nameInput = contactForm.querySelector('input[placeholder="John Doe"]');
            const idInput = contactForm.querySelector('input[placeholder="S20230010xxx"]');
            const messageInput = contactForm.querySelector('textarea');

            // Validate Name
            if (!Validator.isNotEmpty(nameInput.value)) {
                Validator.showError(nameInput, "Full name is required.");
                isValid = false;
            }

            // Validate Institute ID
            if (!Validator.isNotEmpty(idInput.value)) {
                Validator.showError(idInput, "Institute ID is required.");
                isValid = false;
            } else if (!Validator.isInstituteId(idInput.value)) {
                Validator.showError(idInput, "Invalid ID format (e.g., S2024001).");
                isValid = false;
            }

            // Validate Message
            if (!Validator.isNotEmpty(messageInput.value)) {
                Validator.showError(messageInput, "Please enter a message.");
                isValid = false;
            } else if (messageInput.value.trim().length < 10) {
                Validator.showError(messageInput, "Message must be at least 10 characters long.");
                isValid = false;
            }

            /*if (isValid) {
                alert("Message sent successfully to Lumina Support!");
                contactForm.reset();
            }*/
        });
    }
});