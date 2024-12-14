

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modal');
    const forgotPasswordLink = document.querySelector('.forgot-password-link');
    const closeButton = document.querySelector('.close-button');


    forgotPasswordLink.addEventListener('click', (event) => {
        event.preventDefault();
        modal.style.display = 'block';
    });


    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });


    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});
