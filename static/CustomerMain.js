
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.dashboard-section');

function showSection(target) {
    sections.forEach((section) => section.classList.add('hidden'));
    document.getElementById(target).classList.remove('hidden');
}

navLinks.forEach((link) => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        navLinks.forEach((l) => l.classList.remove('active'));
        this.classList.add('active');
        const target = this.dataset.section;
        showSection(target);
    });
});


function showProfileSettings() {
    showSection('profile-settings');
}


function saveChanges(event) {
    event.preventDefault();
    alert('Profile changes saved successfully!');
    showSection('profile');
}


function showEstimateTab(event, tabId) {
    event.preventDefault();


    document.querySelectorAll('.estimate-content').forEach((content) =>
        content.classList.add('hidden')
    );


    document.getElementById(tabId).classList.remove('hidden');


    document.querySelectorAll('.tab-btn').forEach((btn) =>
        btn.classList.remove('active')
    );
    event.target.classList.add('active');
}



document.addEventListener('DOMContentLoaded', () => {
    const customerId = document.querySelector('[name="customer_id"]').value;
    const pendingList = document.getElementById('pending-list');

    fetch(`/fetch_estimates/${customerId}`)
        .then((response) => response.json())
        .then((data) => {
            pendingList.innerHTML = '';

            if (data.pending_estimates.length > 0) {

                data.pending_estimates.forEach((estimate) => {
                    const li = document.createElement('li');
                    li.textContent = `Estimate #${estimate.ESTIMATE_NUM} - Requested on ${estimate.REQUEST_DATE}`;
                    pendingList.appendChild(li);
                });
            } else {

                const li = document.createElement('li');
                li.textContent = 'No pending estimates found.';
                pendingList.appendChild(li);
            }
        })
        .catch((error) =>
            console.error('Error fetching pending estimates:', error)
        );
});


document.querySelector('.settings-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();

    let isValid = true;

    clearErrors();


    if (username.length < 7) {
        showError('username', 'Username is too short');
        isValid = false;
    }


    if (password.length < 10) {
        showError('password', 'Password is too short');
        isValid = false;
    }


    if (!/^\d{10}$/.test(phone)) {
        showError('phone', 'Phone number must be 10 numbers long');
        isValid = false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError('email', 'Invalid email format');
        isValid = false;
    }

    if (isValid) {
        this.submit();
    }
});


function showError(inputId, message) {
    const inputField = document.getElementById(inputId);
    inputField.classList.add('error-highlight');
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.innerText = message;
    inputField.parentElement.appendChild(errorElement);
}


function clearErrors() {
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach((msg) => msg.remove());
    const errorFields = document.querySelectorAll('.error-highlight');
    errorFields.forEach((field) => field.classList.remove('error-highlight'));
}


document.addEventListener('DOMContentLoaded', () => {
    const customerId = document.querySelector('[name="customer_id"]').value;
    const pendingList = document.getElementById('pending-list');
    const allList = document.getElementById('all-list');
    const recentInfo = document.getElementById('recent-estimate-info');


    Promise.all([
        fetch(`/fetch_estimates/${customerId}`).then(response => response.json()),
        fetch(`/fetch_recent_estimate/${customerId}`).then(response => response.json()),
    ])
        .then(([estimatesData, recentData]) => {

            pendingList.innerHTML = '';
            allList.innerHTML = '';


            estimatesData.all_estimates.forEach(estimate => {
                if (estimate.PENDING_STATUS) {
                    const li = document.createElement('li');
                    li.textContent = `Estimate #${estimate.ESTIMATE_NUM} - Requested on ${estimate.REQUEST_DATE}`;
                    pendingList.appendChild(li);
                }
            });


            estimatesData.all_estimates.forEach(estimate => {
                const li = document.createElement('li');
                li.textContent = `Estimate #${estimate.ESTIMATE_NUM} - Requested on ${estimate.REQUEST_DATE} - ${
                    estimate.PENDING_STATUS ? 'Pending' : 'Accepted'
                }`;
                allList.appendChild(li);
            });


            if (recentData.recent_estimate) {
                const estimate = recentData.recent_estimate;
                recentInfo.textContent = `Estimate #${estimate.ESTIMATE_NUM} - Created on ${estimate.CREATION_DATE}, Address: ${estimate.ADDRESS}, Total Cost: $${estimate.TOTAL}`;
            } else {
                recentInfo.textContent = 'No recently accepted estimate.';
            }
        })
        .catch(error => console.error('Error fetching estimates or recent estimate:', error));
});



document.addEventListener('DOMContentLoaded', () => {
    const customerId = document.querySelector('[name="customer_id"]').value;
    const allProjectsList = document.getElementById('all-projects-list');


    fetch(`/fetch_all_projects/${customerId}`)
        .then(response => response.json())
        .then(data => {
            allProjectsList.innerHTML = ''; // Clear the list

            if (data.all_projects && data.all_projects.length > 0) {

                data.all_projects.forEach(project => {
                    const li = document.createElement('li');
                    li.textContent = `Project #${project.PROJECT_NUM} - Address: ${project.ADDRESS}, Start Date: ${project.START_TIME}, Duration: ${project.ESTIMATE_LENGTH}`;
                    allProjectsList.appendChild(li);
                });
            } else {
                const li = document.createElement('li');
                li.textContent = 'No projects found.';
                allProjectsList.appendChild(li);
            }
        })
        .catch(error => console.error('Error fetching projects:', error));
});




function handleSearch() {
    const estimateNumber = document.getElementById('estimate-number').value.trim();
    const customerId = document.querySelector('[name="customer_id"]').value;

    if (!estimateNumber) {
        alert('Please enter a valid estimate number.');
        return;
    }

    fetch('/search_estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            estimate_number: estimateNumber,
            customer_id: customerId,
        }),
    })
        .then(response => response.json())
        .then(data => {
            const modalContainer = document.getElementById('modal-content-container');
            const modal = document.getElementById('search-modal');

            if (data.success) {
                const estimate = data.estimate;

                modalContainer.innerHTML = `
                    <table class="profile-table">
                        <tr><td><strong>Estimate Number</strong></td><td>${estimate.ESTIMATE_NUM}</td></tr>
                        <tr><td><strong>Address</strong></td><td>${estimate.ADDRESS}</td></tr>
                        <tr><td><strong>Project Cost</strong></td><td>${estimate.PROJECT_COST || 'Pending'}</td></tr>
                        <tr><td><strong>GST</strong></td><td>${estimate.GST || 'Pending'}</td></tr>
                        <tr><td><strong>Total</strong></td><td>${estimate.TOTAL || 'Pending'}</td></tr>
                        <tr><td><strong>Request Date</strong></td><td>${estimate.REQUEST_DATE}</td></tr>
                        <tr><td><strong>Creation Date</strong></td><td>${estimate.CREATION_DATE || 'Pending'}</td></tr>
                        <tr><td><strong>PDF</strong></td><td>${estimate.ESTIMATE_PDF ? `<a href="${estimate.ESTIMATE_PDF}" target="_blank">View PDF</a>` : 'Not Available'}</td></tr>
                    </table>
                `;
                modal.style.display = 'block';
            } else {
                modalContainer.innerHTML = `<p style="color: red;">${data.message}</p>`;
                modal.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error fetching estimate:', error);
            const modalContainer = document.getElementById('modal-content-container');
            modalContainer.innerHTML = '<p style="color: red;">An error occurred while searching for the estimate.</p>';
            document.getElementById('search-modal').style.display = 'block';
        });
}

document.addEventListener('DOMContentLoaded', () => {
    const customerId = document.querySelector('[name="customer_id"]').value;
    const allProjectsList = document.getElementById('all-projects-list');


    fetch(`/fetch_all_projects/${customerId}`)
        .then(response => response.json())
        .then(data => {
            allProjectsList.innerHTML = '';

            if (data.all_projects.length > 0) {

                data.all_projects.forEach(project => {
                    const li = document.createElement('li');
                    li.textContent = `Project #${project.PROJECT_NUM} - Address: ${project.ADDRESS}, Start Date: ${project.START_TIME}, Duration: ${project.ESTIMATE_LENGTH}`;
                    allProjectsList.appendChild(li);
                });
            } else {
                const li = document.createElement('li');
                li.textContent = 'No projects found.';
                allProjectsList.appendChild(li);
            }
        })
        .catch(error => console.error('Error fetching projects:', error));
});

function handleProjectSearch() {
    const projectNum = document.getElementById('project-num').value.trim();
    const customerId = document.querySelector('[name="customer_id"]').value;

    if (!projectNum) {
        alert('Please enter a valid project number.');
        return;
    }

    fetch('/search_project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            project_number: projectNum,
            customer_id: customerId,
        }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const project = data.project;

                document.getElementById('result-project-num').textContent = project.PROJECT_NUM || 'N/A';
                document.getElementById('result-address').textContent = project.ADDRESS || 'N/A';
                document.getElementById('result-start-date').textContent = project.START_DATE || 'N/A';
                document.getElementById('result-duration').textContent = project.DURATION || 'N/A';
                document.getElementById('result-contract-num').textContent = project.CONTRACT_NUM || 'N/A';
                document.getElementById('result-contract-pdf').textContent = project.CONTRACT_PDF || 'Not Available';
                document.getElementById('result-contract-date').textContent = project.CONTRACT_DATE || 'N/A';
                document.getElementById('result-certificate-num').textContent = project.CERTIFICATE_NUM || 'N/A';
                document.getElementById('result-certificate-pdf').textContent = project.CERTIFICATE_PDF || 'Not Available';
                document.getElementById('result-certificate-date').textContent = project.CERTIFICATE_DATE || 'N/A';

                document.getElementById('search-result').classList.remove('hidden');
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching project details:', error);
            alert('An error occurred while searching for the project.');
        });
}


document.addEventListener('DOMContentLoaded', () => {
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    const deleteModal = document.getElementById('delete-account-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');


    deleteAccountBtn.addEventListener('click', () => {
        deleteModal.classList.remove('customer_css_hidden');
    });


    confirmDeleteBtn.addEventListener('click', () => {
        const deleteForm = document.getElementById('delete-account-form');
        deleteForm.submit();
    });


    cancelDeleteBtn.addEventListener('click', () => {
        deleteModal.classList.add('customer_css_hidden');
    });
});






function closeModal() {
    document.getElementById('search-modal').style.display = 'none';
}
