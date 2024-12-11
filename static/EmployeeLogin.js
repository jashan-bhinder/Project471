
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modal');
    const modal2 = document.getElementById('modal2');
    const forgotPasswordLink = document.querySelector('.forgot-password-link');
    const closeButtons = document.querySelectorAll('.close-button'); // Select all close buttons
    const signUpEmployee = document.querySelector('.sign-up-employee');

    // Show the "Forgot Password" modal when the link is clicked
    forgotPasswordLink.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default link behavior
        modal.style.display = 'block';
    });

    // Show the "Sign Up Employee" modal when the button is clicked
    signUpEmployee.addEventListener('click', (event) => {
        event.preventDefault();
        modal2.style.display = 'block';
    });

    // Hide the modals when any close button is clicked
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modal.style.display = 'none'; // Hide the first modal
            modal2.style.display = 'none'; // Hide the second modal
        });
    });

    // Hide the modal when clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
        if (event.target === modal2) {
            modal2.style.display = 'none';
        }
    });


});