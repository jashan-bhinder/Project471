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

// Show profile settings section
function showProfileSettings() {
    showSection('profile-settings');
}

// Handle form submission for profile settings
function saveChanges(event) {
    event.preventDefault();
    alert('Profile changes saved successfully!');
    showSection('profile');
}

// Handle estimate tab switching
function showEstimateTab(event, tabId) {
    event.preventDefault();

    // Hide all tabbed content
    document.querySelectorAll('.estimate-content').forEach((content) =>
        content.classList.add('hidden')
    );

    // Show the selected tab's content
    document.getElementById(tabId).classList.remove('hidden');

    // Update active button styling
    document.querySelectorAll('.tab-btn').forEach((btn) =>
        btn.classList.remove('active')
    );
    event.target.classList.add('active');
}


// Fetch pending estimates
document.addEventListener('DOMContentLoaded', () => {
    const customerId = document.querySelector('[name="customer_id"]').value;
    const pendingList = document.getElementById('pending-list');

    fetch(`/fetch_estimates/${customerId}`)
        .then((response) => response.json())
        .then((data) => {
            pendingList.innerHTML = ''; // Clear the list

            if (data.pending_estimates.length > 0) {
                // Populate Pending Estimates
                data.pending_estimates.forEach((estimate) => {
                    const li = document.createElement('li');
                    li.textContent = `Estimate #${estimate.ESTIMATE_NUM} - Requested on ${estimate.REQUEST_DATE}`;
                    pendingList.appendChild(li);
                });
            } else {
                // Show "No Pending Estimates" message
                const li = document.createElement('li');
                li.textContent = 'No pending estimates found.';
                pendingList.appendChild(li);
            }
        })
        .catch((error) =>
            console.error('Error fetching pending estimates:', error)
        );
});

// Form validation for profile settings
document.querySelector('.settings-form').addEventListener('submit', function (e) {
    e.preventDefault(); // Prevent form submission for validation
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();

    let isValid = true;

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
        this.submit();
    }
});

// Show error messages below the input field
function showError(inputId, message) {
    const inputField = document.getElementById(inputId);
    inputField.classList.add('error-highlight'); // Highlight input field
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.innerText = message;
    inputField.parentElement.appendChild(errorElement);
}

// Clear all error messages
function clearErrors() {
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach((msg) => msg.remove());
    const errorFields = document.querySelectorAll('.error-highlight');
    errorFields.forEach((field) => field.classList.remove('error-highlight'));
}

// Submit estimate request
document.addEventListener('DOMContentLoaded', () => {
    const customerId = document.querySelector('[name="customer_id"]').value; // Dynamically fetch the logged-in customer ID
    const pendingList = document.getElementById('pending-list'); // Pending Estimates list
    const allList = document.getElementById('all-list'); // All Estimates list
    const recentInfo = document.getElementById('recent-estimate-info'); // Recently Accepted Estimate section

    // Fetch all estimates and recently accepted estimate for the customer
    Promise.all([
        fetch(`/fetch_estimates/${customerId}`).then(response => response.json()), // Fetch all estimates
        fetch(`/fetch_recent_estimate/${customerId}`).then(response => response.json()), // Fetch recently accepted estimate
    ])
        .then(([estimatesData, recentData]) => {
            // Clear any previous content in the lists
            pendingList.innerHTML = '';
            allList.innerHTML = '';

            // Populate Pending Estimates
            estimatesData.all_estimates.forEach(estimate => {
                if (estimate.PENDING_STATUS) {
                    const li = document.createElement('li');
                    li.textContent = `Estimate #${estimate.ESTIMATE_NUM} - Requested on ${estimate.REQUEST_DATE}`;
                    pendingList.appendChild(li);
                }
            });

            // Populate All Estimates
            estimatesData.all_estimates.forEach(estimate => {
                const li = document.createElement('li');
                li.textContent = `Estimate #${estimate.ESTIMATE_NUM} - Requested on ${estimate.REQUEST_DATE} - ${
                    estimate.PENDING_STATUS ? 'Pending' : 'Accepted'
                }`;
                allList.appendChild(li);
            });

            // Populate Recently Accepted Estimate
            if (recentData.recent_estimate) {
                const estimate = recentData.recent_estimate;
                recentInfo.textContent = `Estimate #${estimate.ESTIMATE_NUM} - Created on ${estimate.CREATION_DATE}, Address: ${estimate.ADDRESS}, Total Cost: $${estimate.TOTAL}`;
            } else {
                recentInfo.textContent = 'No recently accepted estimate.';
            }
        })
        .catch(error => console.error('Error fetching estimates or recent estimate:', error));
});


// Handle estimate request submission
document.addEventListener('DOMContentLoaded', () => {
    const customerId = document.querySelector('[name="customer_id"]').value;
    const allProjectsList = document.getElementById('all-projects-list');

    // Fetch all projects
    fetch(`/fetch_all_projects/${customerId}`)
        .then(response => response.json())
        .then(data => {
            allProjectsList.innerHTML = ''; // Clear the list

            if (data.all_projects && data.all_projects.length > 0) {
                // Populate all projects
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



// Search for an estimate
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

    // Fetch all projects
    fetch(`/fetch_all_projects/${customerId}`)
        .then(response => response.json())
        .then(data => {
            allProjectsList.innerHTML = ''; // Clear the list

            if (data.all_projects.length > 0) {
                // Populate all projects
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
    const projectNumber = document.getElementById('project-num').value.trim();
    const customerId = document.querySelector('[name="customer_id"]').value;

    if (!projectNumber) {
        alert('Please enter a valid project number.');
        return;
    }

    fetch('/search_project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            project_number: projectNumber,
            customer_id: customerId,
        }),
    })
        .then(response => response.json())
        .then(data => {
            const resultSection = document.getElementById('search-result');

            if (data.success) {
                const project = data.project;

                document.getElementById('result-project-num').textContent = project.PROJECT_NUM;
                document.getElementById('result-address').textContent = project.ADDRESS;
                document.getElementById('result-start-date').textContent = project.START_DATE;
                document.getElementById('result-duration').textContent = project.DURATION || 'N/A';
                document.getElementById('result-contract-num').textContent = project.CONTRACT_NUM || 'NULL';
                document.getElementById('result-contract-pdf').innerHTML = project.CONTRACT_PDF
                    ? `<a href="${project.CONTRACT_PDF}" target="_blank">View PDF</a>`
                    : 'NULL';
                document.getElementById('result-contract-date').textContent = project.CONTRACT_DATE || 'NULL';
                document.getElementById('result-certificate-num').textContent = project.CERTIFICATE_NUM || 'NULL';
                document.getElementById('result-certificate-pdf').innerHTML = project.CERTIFICATE_PDF
                    ? `<a href="${project.CERTIFICATE_PDF}" target="_blank">View PDF</a>`
                    : 'NULL';
                document.getElementById('result-certificate-date').textContent = project.CERTIFICATE_DATE || 'NULL';

                resultSection.classList.remove('hidden'); // Show the search result
            } else {
                alert(data.message);
                resultSection.classList.add('hidden'); // Hide the search result if no data is found
            }
        })
        .catch(error => {
            console.error('Error fetching project:', error);
            alert('An error occurred while searching for the project.');
        });
}

document.addEventListener('DOMContentLoaded', () => {
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    const deleteModal = document.getElementById('delete-account-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

    // Show the modal when the delete button is clicked
    deleteAccountBtn.addEventListener('click', () => {
        deleteModal.classList.remove('customer_css_hidden');
    });

    // Handle account deletion
    confirmDeleteBtn.addEventListener('click', () => {
        const deleteForm = document.getElementById('delete-account-form');
        deleteForm.submit(); // Submit the form to trigger the `cust_delete_customer` route
    });

    // Close the modal when the cancel button is clicked
    cancelDeleteBtn.addEventListener('click', () => {
        deleteModal.classList.add('customer_css_hidden');
    });
});





// Close the modal
function closeModal() {
    document.getElementById('search-modal').style.display = 'none';
}
