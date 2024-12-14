

function showProfileSettings() {
    document.querySelector('#profile').classList.add('hidden');
    document.querySelector('#profile-settings').classList.remove('hidden');
}


function saveChanges(event) {
    event.preventDefault();
    alert('Profile changes saved successfully!');
    document.querySelector('#profile-settings').classList.add('hidden');
    document.querySelector('#profile').classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', function () {
    const flashMessages = document.querySelector('.flash-messages');
    if (flashMessages) {
        setTimeout(() => {
            flashMessages.style.display = 'none';
        }, 5000);
    }
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
    const employeeId = document.querySelector('[name="employee_id"]').value;


    const fetchAssignedProjects = () => {
        const assignedProjectsSection = document.getElementById('employee_assigned-projects');
        const allProjectsSection = document.getElementById('employee_all-projects');

        if (!assignedProjectsSection.classList.contains('hidden')) {

            assignedProjectsSection.classList.add('hidden');
        } else {

            fetch(`/fetch_filtered_assigned_projects/${employeeId}`)
                .then(response => response.json())
                .then(data => {
                    const assignedProjectsList = document.getElementById('employee_assigned-projects-list');
                    assignedProjectsList.innerHTML = '';

                    if (data.assigned_projects && data.assigned_projects.length > 0) {
                        data.assigned_projects.forEach(project => {
                            const li = document.createElement('li');
                            li.textContent = `Project #${project.PROJECT_NUM} - Address: ${project.ADDRESS}, Start Date: ${project.START_TIME}, Duration: ${project.ESTIMATE_LENGTH}`;
                            assignedProjectsList.appendChild(li);
                        });
                    } else {
                        assignedProjectsList.innerHTML = '<li>No assigned projects found.</li>';
                    }


                    assignedProjectsSection.classList.remove('hidden');
                    allProjectsSection.classList.add('hidden');
                })
                .catch(error => console.error('Error fetching assigned projects:', error));
        }
    };


    const fetchAllProjects = () => {
        const allProjectsSection = document.getElementById('employee_all-projects');
        const assignedProjectsSection = document.getElementById('employee_assigned-projects');

        if (!allProjectsSection.classList.contains('hidden')) {

            allProjectsSection.classList.add('hidden');
        } else {

            fetch(`/fetch_all_projects_history/${employeeId}`)
                .then(response => response.json())
                .then(data => {
                    const allProjectsList = document.getElementById('employee_all-projects-list');
                    allProjectsList.innerHTML = '';

                    if (data.all_projects && data.all_projects.length > 0) {
                        data.all_projects.forEach(project => {
                            const li = document.createElement('li');
                            li.textContent = `Project #${project.PROJECT_NUM}, Start Date: ${project.START_TIME}, Completion Status: ${project.COMPLETION_STATUS}`;
                            allProjectsList.appendChild(li);
                        });
                    } else {
                        allProjectsList.innerHTML = '<li>No projects found.</li>';
                    }


                    allProjectsSection.classList.remove('hidden');
                    assignedProjectsSection.classList.add('hidden');
                })
                .catch(error => console.error('Error fetching all projects:', error));
        }
    };


    document.getElementById('employee_view-assigned-projects-button').addEventListener('click', fetchAssignedProjects);
    document.getElementById('employee_view-all-projects-button').addEventListener('click', fetchAllProjects);


    const projectDashboard = document.getElementById('project-dashboard');
    const projectTab = document.querySelector('.nav-link[data-section="project-dashboard"]');

    projectTab.addEventListener('click', () => {
        const allSections = document.querySelectorAll('.dashboard-section');
        allSections.forEach(section => section.classList.add('hidden'));


        projectDashboard.classList.remove('hidden');
        document.getElementById('employee_assigned-projects').classList.add('hidden');
        document.getElementById('employee_all-projects').classList.add('hidden');
    });
});






document.addEventListener('DOMContentLoaded', () => {
    const employeeId = document.querySelector('[name="employee_id"]').value;


    document.getElementById('employee_search-project-button').addEventListener('click', () => {
        document.getElementById('project-search-modal').classList.remove('hidden');
    });


    document.getElementById('close-modal').addEventListener('click', () => {
        document.getElementById('project-search-modal').classList.add('hidden');
    });


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

                    document.getElementById('result-project-num').textContent = data.project.PROJECT_NUM;
                    document.getElementById('result-project-address').textContent = data.project.ADDRESS;
                    document.getElementById('result-project-start-date').textContent = data.project.START_TIME;
                    document.getElementById('result-project-duration').textContent = data.project.ESTIMATE_LENGTH;


                    ordersList.innerHTML = '';
                    if (data.orders.length > 0) {
                        data.orders.forEach(order => {
                            const li = document.createElement('li');
                            li.textContent = `Order #${order.ORDER_NUM} - Store: ${order.STORE_NAME}, Status: ${order.COMPLETION_STAT}`;
                            li.dataset.orderNum = order.ORDER_NUM;
                            ordersList.appendChild(li);
                        });

                        confirmOrderFormContainer.classList.remove('hidden');
                        confirmOrderFormContainer.dataset.projectNum = data.project.PROJECT_NUM;
                    } else {
                        ordersList.innerHTML = '<li>No orders found for this project.</li>';
                        confirmOrderFormContainer.classList.add('hidden');
                    }

                    resultSection.classList.remove('hidden');
                } else {
                    alert(data.message);
                    resultSection.classList.add('hidden');
                }


                document.getElementById('project-search-modal').classList.add('hidden');
            })
            .catch(error => {
                console.error('Error fetching project details:', error);
                alert('An error occurred while searching for the project.');
            });
    });


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






document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('project-search-modal').classList.add('hidden');
});








const uniqueNavLinks = document.querySelectorAll('.nav-link');
const uniqueSections = document.querySelectorAll('.dashboard-section');

function switchToSection(targetId) {

    uniqueSections.forEach((section) => section.classList.add('hidden'));


    document.getElementById(targetId).classList.remove('hidden');
}

uniqueNavLinks.forEach((link) => {
    link.addEventListener('click', function (e) {
        e.preventDefault();


        uniqueNavLinks.forEach((nav) => nav.classList.remove('active'));


        this.classList.add('active');


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


    deleteAccountBtn.addEventListener('click', () => {
        deleteModal.classList.remove('employee_css_hidden');
    });


    confirmDeleteBtn.addEventListener('click', () => {
        const deleteForm = document.getElementById('delete-account-form');
        deleteForm.submit();
    });


    cancelDeleteBtn.addEventListener('click', () => {
        deleteModal.classList.add('employee_css_hidden');
    });
});





document.addEventListener('DOMContentLoaded', () => {
    const addMaterialBtn = document.getElementById('material-add-btn');
    const addMaterialModal = document.getElementById('material-add-modal');
    const closeMaterialModal = document.getElementById('material-close-modal');
    const addMaterialForm = document.getElementById('material-add-form');

    if (addMaterialBtn) {
        addMaterialBtn.addEventListener('click', () => {
            addMaterialModal.classList.remove('hidden');
        });
    }

    if (closeMaterialModal) {
        closeMaterialModal.addEventListener('click', () => {
            addMaterialModal.classList.add('hidden');
        });
    }

    if (addMaterialForm) {
        addMaterialForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const materialData = {
                name: document.getElementById('material-name').value.trim(),
                type: document.getElementById('material-type').value.trim(),
                cost: parseInt(document.getElementById('material-cost').value.trim(), 10),
                amount: parseInt(document.getElementById('material-amount').value.trim(), 10),
                order_num: parseInt(document.getElementById('order-num').value.trim(), 10),
            };

            const employeeId = document.querySelector('[name="employee_id"]').value;

            fetch(`/add_material/${employeeId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(materialData),
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert(data.message);
                        addMaterialModal.classList.add('hidden');
                        addMaterialForm.reset();
                    } else {
                        alert(data.message);
                    }
                })
                .catch(error => {
                    console.error('Error adding material:', error);
                    alert('An error occurred while adding the material.');
                });
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const viewMaterialsBtn = document.getElementById('material-view-btn');
    const materialsListSection = document.getElementById('materials-list-section');
    const viewMaterialsForm = document.getElementById('view-materials-form');
    const materialsTableBody = document.querySelector('#materials-table tbody');

    if (viewMaterialsBtn) {
        viewMaterialsBtn.addEventListener('click', () => {

            materialsListSection.classList.remove('hidden');
        });
    }

    if (viewMaterialsForm) {
        viewMaterialsForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const orderNum = document.getElementById('view-order-num').value.trim();
            const employeeId = document.querySelector('[name="employee_id"]').value;

            if (!orderNum) {
                alert('Please enter a valid order number.');
                return;
            }

            fetch(`/view_materials/${employeeId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_num: orderNum }),
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        materialsTableBody.innerHTML = '';
                        data.materials.forEach(material => {
                            const row = document.createElement('tr');
                            row.innerHTML = `
                                <td>${material.MATERIAL_ID}</td>
                                <td>${material.NAME}</td>
                                <td>${material.TYPE}</td>
                                <td>${material.COST}</td>
                                <td>${material.AMOUNT}</td>
                            `;
                            materialsTableBody.appendChild(row);
                        });
                    } else {
                        alert(data.message);
                        materialsTableBody.innerHTML = '<tr><td colspan="5">No materials found.</td></tr>';
                    }
                })
                .catch(error => {
                    console.error('Error fetching materials:', error);
                    alert('An error occurred while fetching materials.');
                });
        });
    }
});















