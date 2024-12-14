
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modal');
    const modal2 = document.getElementById('modal2');
    const forgotPasswordLink = document.querySelector('.forgot-password-link');
    const closeButtons = document.querySelectorAll('.close-button');
    const signUpEmployee = document.querySelector('.sign-up-employee');


    forgotPasswordLink.addEventListener('click', (event) => {
        event.preventDefault();
        modal.style.display = 'block';
    });


    signUpEmployee.addEventListener('click', (event) => {
        event.preventDefault();
        modal2.style.display = 'block';
    });


    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modal.style.display = 'none';
            modal2.style.display = 'none';
        });
    });


    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
        if (event.target === modal2) {
            modal2.style.display = 'none';
        }
    });


});