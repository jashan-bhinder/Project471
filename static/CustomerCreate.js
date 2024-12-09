document.querySelector('.registration-form').addEventListener('submit', function (e) {
    e.preventDefault(); // Prevent form submission for validation
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();

    let isValid = true;

    // Clear previous error messages
    clearErrors();

    // Validate Username
    if (username.length < 7) {
        showError('username', 'Username is too short');
        isValid = false;
    }

    // Validate Password
    if (password.length < 10) {
        showError('password', 'Password is too short');
        isValid = false;
    }

    // Validate Phone Number
    if (!/^\d{10}$/.test(phone)) {
        showError('phone', 'Phone number must be 10 numbers long');
        isValid = false;
    }

    // Validate Email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError('email', 'Invalid email format');
        isValid = false;
    }

    if (isValid) {
        // If all validations pass, submit the form
        this.submit();
    }
});

function showError(inputId, message) {
    const inputField = document.getElementById(inputId);
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.innerText = message;
    inputField.parentElement.appendChild(errorElement);
}

function clearErrors() {
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(msg => msg.remove());
}
