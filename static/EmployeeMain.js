// Show profile settings section
function showProfileSettings() {
    document.querySelector('#profile').classList.add('hidden');
    document.querySelector('#profile-settings').classList.remove('hidden');
}

// Handle form submission for profile settings
function saveChanges(event) {
    event.preventDefault();
    alert('Profile changes saved successfully!');
    document.querySelector('#profile-settings').classList.add('hidden');
    document.querySelector('#profile').classList.remove('hidden');
}
// Auto-hide flash messages after 5 seconds
document.addEventListener('DOMContentLoaded', function () {
    const flashMessages = document.querySelector('.flash-messages');
    if (flashMessages) {
        setTimeout(() => {
            flashMessages.style.display = 'none';
        }, 5000); // Adjust time as needed (5000ms = 5 seconds)
    }
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
// Fetch all projects and assigned projects for the employee
document.addEventListener('DOMContentLoaded', () => {
    const employeeId = document.querySelector('[name="employee_id"]').value;

    // Function to fetch and toggle assigned projects
    const fetchAssignedProjects = () => {
        const assignedProjectsSection = document.getElementById('employee_assigned-projects');
        const allProjectsSection = document.getElementById('employee_all-projects');

        if (!assignedProjectsSection.classList.contains('hidden')) {
            // If the section is visible, hide it
            assignedProjectsSection.classList.add('hidden');
        } else {
            // Otherwise, fetch and display assigned projects
            fetch(`/fetch_filtered_assigned_projects/${employeeId}`)
                .then(response => response.json())
                .then(data => {
                    const assignedProjectsList = document.getElementById('employee_assigned-projects-list');
                    assignedProjectsList.innerHTML = ''; // Clear the list

                    if (data.assigned_projects && data.assigned_projects.length > 0) {
                        data.assigned_projects.forEach(project => {
                            const li = document.createElement('li');
                            li.textContent = `Project #${project.PROJECT_NUM} - Address: ${project.ADDRESS}, Start Date: ${project.START_TIME}, Duration: ${project.ESTIMATE_LENGTH}`;
                            assignedProjectsList.appendChild(li);
                        });
                    } else {
                        assignedProjectsList.innerHTML = '<li>No assigned projects found.</li>';
                    }

                    // Show assigned projects and hide all projects section
                    assignedProjectsSection.classList.remove('hidden');
                    allProjectsSection.classList.add('hidden');
                })
                .catch(error => console.error('Error fetching assigned projects:', error));
        }
    };

    // Function to fetch and toggle all projects
    const fetchAllProjects = () => {
        const allProjectsSection = document.getElementById('employee_all-projects');
        const assignedProjectsSection = document.getElementById('employee_assigned-projects');

        if (!allProjectsSection.classList.contains('hidden')) {
            // If the section is visible, hide it
            allProjectsSection.classList.add('hidden');
        } else {
            // Otherwise, fetch and display all projects
            fetch(`/fetch_all_projects_history/${employeeId}`)
                .then(response => response.json())
                .then(data => {
                    const allProjectsList = document.getElementById('employee_all-projects-list');
                    allProjectsList.innerHTML = ''; // Clear the list

                    if (data.all_projects && data.all_projects.length > 0) {
                        data.all_projects.forEach(project => {
                            const li = document.createElement('li');
                            li.textContent = `Project #${project.PROJECT_NUM}, Start Date: ${project.START_TIME}, Completion Status: ${project.COMPLETION_STATUS}`;
                            allProjectsList.appendChild(li);
                        });
                    } else {
                        allProjectsList.innerHTML = '<li>No projects found.</li>';
                    }

                    // Show all projects and hide assigned projects section
                    allProjectsSection.classList.remove('hidden');
                    assignedProjectsSection.classList.add('hidden');
                })
                .catch(error => console.error('Error fetching all projects:', error));
        }
    };

    // Event listeners for buttons
    document.getElementById('employee_view-assigned-projects-button').addEventListener('click', fetchAssignedProjects);
    document.getElementById('employee_view-all-projects-button').addEventListener('click', fetchAllProjects);

    // Tab functionality for the Projects tab
    const projectDashboard = document.getElementById('project-dashboard');
    const projectTab = document.querySelector('.nav-link[data-section="project-dashboard"]');

    projectTab.addEventListener('click', () => {
        const allSections = document.querySelectorAll('.dashboard-section');
        allSections.forEach(section => section.classList.add('hidden')); // Hide all sections

        // Show project dashboard and reset visibility of lists
        projectDashboard.classList.remove('hidden');
        document.getElementById('employee_assigned-projects').classList.add('hidden');
        document.getElementById('employee_all-projects').classList.add('hidden');
    });
});






document.addEventListener('DOMContentLoaded', () => {
    const employeeId = document.querySelector('[name="employee_id"]').value;

    // Open Search Project modal
    document.getElementById('employee_search-project-button').addEventListener('click', () => {
        document.getElementById('project-search-modal').classList.remove('hidden');
    });

    // Close modal functionality
    document.getElementById('close-modal').addEventListener('click', () => {
        document.getElementById('project-search-modal').classList.add('hidden');
    });

    // Search project functionality
    document.getElementById('search-project-button').addEventListener('click', () => {
        const projectNumber = document.getElementById('project-num-input').value.trim();

        if (!projectNumber) {
            alert('Please enter a valid project number.');
            return;
        }

        fetch(`/search_project_employee/${employeeId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ project_number: projectNumber }),
        })
            .then(response => response.json())
            .then(data => {
                const resultSection = document.getElementById('employee_project-details');
                const ordersList = document.getElementById('result-orders-list');
                const confirmOrderFormContainer = document.getElementById('confirm-order-form-container');

                if (data.success) {
                    // Populate project details
                    document.getElementById('result-project-num').textContent = data.project.PROJECT_NUM;
                    document.getElementById('result-project-address').textContent = data.project.ADDRESS;
                    document.getElementById('result-project-start-date').textContent = data.project.START_TIME;
                    document.getElementById('result-project-duration').textContent = data.project.ESTIMATE_LENGTH;

                    // Populate orders
                    ordersList.innerHTML = '';
                    if (data.orders.length > 0) {
                        data.orders.forEach(order => {
                            const li = document.createElement('li');
                            li.textContent = `Order #${order.ORDER_NUM} - Store: ${order.STORE_NAME}, Status: ${order.COMPLETION_STAT}`;
                            li.dataset.orderNum = order.ORDER_NUM; // Store order number for reference
                            ordersList.appendChild(li);
                        });

                        confirmOrderFormContainer.classList.remove('hidden');
                        confirmOrderFormContainer.dataset.projectNum = data.project.PROJECT_NUM; // Store project number
                    } else {
                        ordersList.innerHTML = '<li>No orders found for this project.</li>';
                        confirmOrderFormContainer.classList.add('hidden');
                    }

                    resultSection.classList.remove('hidden');
                } else {
                    alert(data.message);
                    resultSection.classList.add('hidden');
                }

                // Close the modal after search
                document.getElementById('project-search-modal').classList.add('hidden');
            })
            .catch(error => {
                console.error('Error fetching project details:', error);
                alert('An error occurred while searching for the project.');
            });
    });

    // Confirm specific order functionality
    document.getElementById('confirm-order-form').addEventListener('submit', (event) => {
        event.preventDefault();

        const orderNumber = document.getElementById('confirm-order-num-input').value.trim();
        const projectNumber = document.getElementById('confirm-order-form-container').dataset.projectNum;

        if (!orderNumber) {
            alert('Please enter a valid order number.');
            return;
        }

        fetch(`/confirm_specific_order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ project_number: projectNumber, order_number: orderNumber }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Order status updated successfully.');
                    // Refresh the order details
                    document.getElementById('search-project-button').click();
                } else {
                    alert(data.message);
                }
            })
            .catch(error => {
                console.error('Error confirming order:', error);
                alert('An error occurred while confirming the order.');
            });
    });
});





// Close modal button functionality
document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('project-search-modal').classList.add('hidden');
});








const uniqueNavLinks = document.querySelectorAll('.nav-link');
const uniqueSections = document.querySelectorAll('.dashboard-section');

function switchToSection(targetId) {
    // Hide all sections
    uniqueSections.forEach((section) => section.classList.add('hidden'));

    // Show the selected section
    document.getElementById(targetId).classList.remove('hidden');
}

// Add event listeners for navigation links
uniqueNavLinks.forEach((link) => {
    link.addEventListener('click', function (e) {
        e.preventDefault();

        // Remove active class from all links
        uniqueNavLinks.forEach((nav) => nav.classList.remove('active'));

        // Add active class to the clicked link
        this.classList.add('active');

        // Show the selected section
        const target = this.dataset.section;
        switchToSection(target);
    });
});

const projectTabs = document.querySelectorAll('.tab-btn');
const projectContent = document.querySelectorAll('.project-content');

function switchTab(event, tabId) {
    projectTabs.forEach(tab => tab.classList.remove('active'));
    projectContent.forEach(content => content.classList.add('hidden'));

    event.target.classList.add('active');
    document.getElementById(tabId).classList.remove('hidden');
}

// Assign click event listeners to tab buttons
projectTabs.forEach(tab => {
    tab.addEventListener('click', function (event) {
        switchTab(event, this.getAttribute('data-tab-id'));
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    const deleteModal = document.getElementById('delete-account-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

    // Show the modal when the delete button is clicked
    deleteAccountBtn.addEventListener('click', () => {
        deleteModal.classList.remove('employee_css_hidden');
    });

    // Handle account deletion
    confirmDeleteBtn.addEventListener('click', () => {
        const deleteForm = document.getElementById('delete-account-form');
        deleteForm.submit(); // Submit the form to trigger the emp_delete_employee route
    });

    // Close the modal when the cancel button is clicked
    cancelDeleteBtn.addEventListener('click', () => {
        deleteModal.classList.add('employee_css_hidden');
    });
});





document.addEventListener('DOMContentLoaded', () => {
    const addMaterialBtn = document.getElementById('material-add-btn'); // Button to open the modal
    const addMaterialModal = document.getElementById('material-add-modal'); // Modal element
    const closeMaterialModal = document.getElementById('material-close-modal'); // Close button
    const addMaterialForm = document.getElementById('material-add-form'); // Form element

    // Open the Add Material modal
    addMaterialBtn.addEventListener('click', () => {
        addMaterialModal.classList.remove('hidden'); // Show the modal
    });

    // Close the modal when clicking the close button
    closeMaterialModal.addEventListener('click', () => {
        addMaterialModal.classList.add('hidden'); // Hide the modal
    });

    // Handle Add Material form submission
    addMaterialForm.addEventListener('submit', (event) => {
        event.preventDefault();

        // Collect form data (excluding Material ID, which will be generated on the backend)
        const materialData = {
            name: document.getElementById('material-name').value.trim(),
            type: document.getElementById('material-type').value.trim(),
            cost: parseInt(document.getElementById('material-cost').value.trim(), 10),
            amount: parseInt(document.getElementById('material-amount').value.trim(), 10),
            order_num: parseInt(document.getElementById('order-num').value.trim(), 10),
        };

        // Send data to the Flask backend
        fetch('/add_material', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(materialData),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Material added successfully!');
                    addMaterialModal.classList.add('hidden'); // Hide the modal
                    addMaterialForm.reset(); // Clear the form fields
                } else {
                    alert(data.message || 'Failed to add material.');
                }
            })
            .catch(error => {
                console.error('Error adding material:', error);
                alert('An error occurred while adding the material.');
            });
    });
});








