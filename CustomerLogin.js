// Modal Functionality
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modal');
    const forgotPasswordLink = document.querySelector('.forgot-password-link');
    const closeButton = document.querySelector('.close-button');

    // Show the modal when the link is clicked
    forgotPasswordLink.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default link behavior
        modal.style.display = 'block';
    });

    // Hide the modal when the close button is clicked
    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Hide the modal when clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});
