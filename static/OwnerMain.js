document.addEventListener("DOMContentLoaded", () => {
    const navLinks = document.querySelectorAll(".nav-link");
    const mainContent = document.querySelector(".main-content");


    //Function to remove all child divs except the header of the page
    function Clear_Content() {
        const children = Array.from(mainContent.children);
        children.forEach(child => {
            if (child.tagName.toLowerCase() !== "header") {
                mainContent.removeChild(child);
            }
        });
    }

    //Navigation sidebar links
    navLinks.forEach(link => {
        link.addEventListener("click", (event) => {
            event.preventDefault();

            const target = link.getAttribute("data-target");
            if (target === "estimates") {
                Clear_Content();

                const header = mainContent.querySelector("header");
                header.innerHTML = "<h1>Estimates</h1>";

                const newDiv = document.createElement("div");
                newDiv.innerHTML = `
                    <div class="table-div">
                        <div class="table-container">
                            <h2 class="table-headers">Estimate List</h2>
                            <table class="content-tables">
                                <thead>
                                    <tr>
                                        <th>Estimate Number</th>
                                        <th>Address</th>
                                        <th>Project Cost</th>
                                        <th>Estimate PDF</th>
                                        <th>GST</th>
                                        <th>Total</th>
                                        <th>Pending status</th>
                                        <th>Request Date</th>
                                        <th>Creation Date</th>
                                        <th>Employee ID</th>
                                        <th>Customer ID</th>
                                    </tr>
                                </thead>
                                <tbody id="estimate-table-body">

                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="table-buttons">
                        <a href="#" id="delete-estimate-link"><button>Delete Estimate</button></a>
                        <a href="#" id="search-estimate-link"><button>Search Estimate</button></a>
                        <a href="#" id="update-estimate-link"><button>Update Estimate</button></a>
                    </div>
                    
                    <div id="update-estimate-form-container" class="hidden">
                        <h2>Update Estimate</h2>
                        <form id="update-estimate-form" class="registration-form" enctype="multipart/form-data">
                            <label for="update-estimate-number">Estimate Number</label>
                            <input type="text" id="update-estimate-number" name="estimate_number" readonly required>
                    
                            <label for="update-address">Address</label>
                            <input type="text" id="update-address" name="address" required>
                    
                            <label for="update-project-cost">Project Cost</label>
                            <input type="number" id="update-project-cost" name="project_cost" required>
                    
                            <label for="update-pending-status">Pending Status</label>
                            <input type="checkbox" id="update-pending-status" name="pending_status">
                    
                            <label for="update-request-date">Request Date</label>
                            <input type="date" id="update-request-date" name="request_date" required readonly>
                    
                            <label for="update-creation-date">Creation Date</label>
                            <input type="date" id="update-creation-date" name="creation_date" readonly>
                    
                            <label for="update-employee-id">Employee ID</label>
                            <input type="text" id="update-employee-id" name="employee_id" required>
                    
                            <label for="update-customer-id">Customer ID</label>
                            <input type="text" id="update-customer-id" name="customer_id" required>
                    
                            <label for="update-estimate-pdf">Upload Estimate PDF</label>
                            <input type="file" id="update-estimate-pdf" name="estimate_pdf" accept=".pdf">
                    
                            <button type="submit">Save Changes</button>
                        </form>
                    </div>
                `;
                mainContent.appendChild(newDiv);

                // Fetch estimate data from the backend
                fetch('/api/estimates')
                    .then(response => response.json())
                    .then(data => {
                        const tableBody = document.getElementById('estimate-table-body');
                        tableBody.innerHTML = '';
                        data.estimates.forEach(estimate => {
                            const row = document.createElement('tr');
                            row.innerHTML = `
                                <td>${estimate.estimate_num}</td>
                                <td>${estimate.address}</td>
                                <td>${estimate.project_cost}</td>
                                <td><a href="/api/estimates/download/${estimate.estimate_num}" target="_blank">Download PDF</a></td>
                                <td>${estimate.gst}</td>
                                <td>${estimate.total}</td>
                                <td>${estimate.pending_status ? "Pending" : "Complete"}</td>
                                <td>${estimate.request_date}</td>
                                <td>${estimate.creation_date || "N/A"}</td>
                                <td>${estimate.employee_id}</td>
                                <td>${estimate.customer_id}</td>
                            `;
                            tableBody.appendChild(row);
                        });
                    })
                    .catch(error => console.error('Error fetching estimate data:', error));

                // Handle Delete Estimate button
                document.getElementById('delete-estimate-link').addEventListener('click', (event) => {
                    event.preventDefault();
                    const estimateNum = prompt("Enter the Estimate Number to delete:");

                    if (estimateNum) {
                        fetch(`/api/estimates/delete/${estimateNum}`, {
                            method: 'DELETE',
                        })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    alert('Estimate deleted successfully!');
                                    location.reload();
                                } else {
                                    alert(data.error || 'An error occurred while deleting the estimate.');
                                }
                            })
                            .catch(error => console.error('Error deleting estimate:', error));
                    }
                });

                //Handle search estimate button
                const searchEstimateButton = document.getElementById("search-estimate-link");

                if (searchEstimateButton) {
                    searchEstimateButton.addEventListener("click", (event) => {
                        event.preventDefault();

                        const estimateNum = prompt("Enter the Estimate Number to search:");

                        if (estimateNum) {
                            fetch(`/api/estimates/${estimateNum}`)
                                .then((response) => {
                                    if (!response.ok) {
                                        throw new Error("Estimate not found or an error occurred.");
                                    }
                                    return response.json();
                                })
                                .then((estimateData) => {
                                    let estimateInfo = `
                                        <h2>Estimate Details</h2>
                                        <p><strong>Estimate Number:</strong> ${estimateData.estimate_num}</p>
                                        <p><strong>Address:</strong> ${estimateData.address}</p>
                                        <p><strong>Project Cost:</strong> ${estimateData.project_cost || "N/A"}</p>
                                        <p><strong>GST:</strong> ${estimateData.gst || "N/A"}</p>
                                        <p><strong>Total:</strong> ${estimateData.total || "N/A"}</p>
                                        <p><strong>Pending Status:</strong> ${estimateData.pending_status ? "Pending" : "Complete"}</p>
                                        <p><strong>Request Date:</strong> ${estimateData.request_date || "N/A"}</p>
                                        <p><strong>Creation Date:</strong> ${estimateData.creation_date || "N/A"}</p>
                                        <p><strong>Employee ID:</strong> ${estimateData.employee_id}</p>
                                        <p><strong>Customer ID:</strong> ${estimateData.customer_id}</p>
                                    `;

                                    if (estimateData.pdf_url) {
                                        estimateInfo += `
                                            <p><strong>Estimate PDF:</strong> 
                                                <a href="${estimateData.pdf_url}" target="_blank" download="Estimate_${estimateData.estimate_num}.pdf">
                                                    Download PDF
                                                </a>
                                            </p>
                                        `;
                                    } else {
                                        estimateInfo += `<p><strong>Estimate PDF:</strong> No PDF available</p>`;
                                    }

                                    const popup = window.open("", "Estimate Details", "width=400,height=400");
                                    popup.document.write(`
                                        <html>
                                            <head>
                                                <title>Estimate Details</title>
                                            </head>
                                            <body>
                                                ${estimateInfo}
                                                <button onclick="window.close()">Close</button>
                                            </body>
                                        </html>
                                    `);
                                })
                                .catch((error) => {
                                    alert(error.message || "An error occurred while searching for the estimate.");
                                    console.error("Error fetching estimate data:", error);
                                });
                        }
                    });
                }


                // Handle Update Estimate button
                const updateEstimateButton = document.getElementById("update-estimate-link");
                const updateEstimateFormContainer = document.getElementById("update-estimate-form-container");
                const updateEstimateForm = document.getElementById("update-estimate-form");

                if (updateEstimateButton) {
                    updateEstimateButton.addEventListener("click", (event) => {
                        event.preventDefault();

                        const estimateNum = prompt("Enter the Estimate Number to update:");

                        if (estimateNum && estimateNum.trim() !== "") {
                            fetch(`/api/estimates/${estimateNum}`)
                                .then((response) => {
                                    if (!response.ok) {
                                        throw new Error("Estimate not found or an error occurred.");
                                    }
                                    return response.json();
                                })
                                .then((estimateData) => {
                                    document.getElementById("update-estimate-number").value = estimateData.estimate_num;
                                    document.getElementById("update-address").value = estimateData.address;
                                    document.getElementById("update-project-cost").value = estimateData.project_cost;
                                    document.getElementById("update-employee-id").value = estimateData.employee_id;
                                    document.getElementById("update-customer-id").value = estimateData.customer_id;
                                    document.getElementById("update-pending-status").checked = estimateData.pending_status;
                                    document.getElementById("update-creation-date").value = estimateData.creation_date || "";

                                    updateEstimateFormContainer.classList.remove("hidden");
                                })
                                .catch((error) => {
                                    alert(error.message || "An error occurred while fetching the estimate details.");
                                    console.error("Error fetching estimate data:", error);
                                });
                        }
                    });
                }

                // Handle the Update Estimate form submission
                if (updateEstimateForm) {
                    updateEstimateForm.addEventListener("submit", (event) => {
                        event.preventDefault();

                        const estimateNum = document.getElementById("update-estimate-number").value;
                        const formData = new FormData(updateEstimateForm);

                        fetch(`/api/estimates/update/${estimateNum}`, {
                            method: "POST",
                            body: formData,
                        })
                            .then((response) => response.json())
                            .then((data) => {
                                if (data.success) {
                                    alert("Estimate updated successfully!");
                                    location.reload();
                                } else {
                                    alert(data.error || "An error occurred while updating the estimate.");
                                }
                            })
                            .catch((error) => {
                                alert("An unexpected error occurred. Please try again.");
                                console.error("Error updating estimate:", error);
                            });
                    });
                }
            }



            if (target === "home") {
                Clear_Content();

                const header = mainContent.querySelector("header");
                header.innerHTML = "<h1>Owner Home Page</h1>";

                const newDiv = document.createElement("div");
                newDiv.innerHTML = `
                    <div class="table-div">
                        <div class="table-container">
                            <h2 class="table-headers">Profile</h2>
                            <table class="profile-table">
                                <tbody id="profile-table-body">
                                    <!-- Dynamic rows will be added here -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="table-buttons">
                        <button id="edit-profile-btn">Edit Profile</button>
                    </div>
                    <div id="edit-profile-form-container" class="hidden">
                        <h2>Change Profile</h2>
                        <form id="edit-profile-form" class="registration-form">
                            <label for="fname">First Name</label>
                            <input type="text" id="fname" name="fname" placeholder="Enter your first name" required>
            
                            <label for="lname">Last Name</label>
                            <input type="text" id="lname" name="lname" placeholder="Enter your last name" required>
            
                            <label for="username">Username</label>
                            <input type="text" id="username" name="username" placeholder="Enter new username" required>
            
                            <label for="password">Password</label>
                            <input type="password" id="password" name="password" placeholder="Enter new password" required>
            
                            <label for="phone">Phone Number</label>
                            <input type="text" id="phone" name="phone" placeholder="Enter new phone number" required>
            
                            <label for="email">Email</label>
                            <input type="email" id="email" name="email" placeholder="Enter new email" required>
            
                            <button type="submit">Save Changes</button>
                        </form>
                    </div>
                `;
                mainContent.appendChild(newDiv);

                // Fetch employee data from the backend
                fetch('/api/employees/current')
                    .then((response) => {
                        if (!response.ok) {
                            throw new Error("Failed to fetch employee data");
                        }
                        return response.json();
                    })
                    .then((employeeData) => {
                        const tableBody = document.getElementById("profile-table-body");

                        if (employeeData.error) {
                            tableBody.innerHTML = `<tr><td colspan="2">Error: ${employeeData.error}</td></tr>`;
                            return;
                        }

                        const rows = `
                            <tr>
                                <th>Employee ID:</th>
                                <td>${employeeData.EMPLOYEE_ID}</td>
                            </tr>
                            <tr>
                                <th>First Name:</th>
                                <td>${employeeData.FNAME}</td>
                            </tr>
                            <tr>
                                <th>Last Name:</th>
                                <td>${employeeData.LNAME}</td>
                            </tr>
                            <tr>
                                <th>Phone Number:</th>
                                <td>${employeeData.PHONE_NUMBER}</td>
                            </tr>
                            <tr>
                                <th>Email:</th>
                                <td>${employeeData.EMAIL}</td>
                            </tr>
                            <tr>
                                <th>Start Date:</th>
                                <td>${employeeData.START_DATE}</td>
                            </tr>
                            <tr>
                                <th>Username:</th>
                                <td>${employeeData.USERNAME}</td>
                            </tr>
                        `;

                        tableBody.innerHTML = rows;

                        // handle Edit Profile button
                        const editProfileBtn = document.getElementById("edit-profile-btn");
                        const editProfileFormContainer = document.getElementById("edit-profile-form-container");
                        const editProfileForm = document.getElementById("edit-profile-form");

                        editProfileBtn.addEventListener("click", () => {
                            editProfileFormContainer.classList.toggle("hidden");

                            document.getElementById("fname").value = employeeData.FNAME;
                            document.getElementById("lname").value = employeeData.LNAME;
                            document.getElementById("username").value = employeeData.USERNAME;
                            document.getElementById("password").value = ""; // Do not prefill password
                            document.getElementById("phone").value = employeeData.PHONE_NUMBER;
                            document.getElementById("email").value = employeeData.EMAIL;
                        });

                        editProfileForm.addEventListener("submit", (e) => {
                            e.preventDefault();

                            const updatedData = {
                                fname: document.getElementById("fname").value.trim(),
                                lname: document.getElementById("lname").value.trim(),
                                username: document.getElementById("username").value.trim(),
                                password: document.getElementById("password").value.trim(),
                                phone: document.getElementById("phone").value.trim(),
                                email: document.getElementById("email").value.trim(),
                            };

                            if (updatedData.password.length < 10) {
                                alert("Password must be at least 10 characters long");
                                return;
                            }
                            if (updatedData.phone.length !== 10 || !/^\d+$/.test(updatedData.phone)) {
                                alert("Phone number must be exactly 10 digits");
                                return;
                            }
                            if (updatedData.username.length < 7) {
                                alert("Username must be at least 7 characters long");
                                return;
                            }

                            fetch("/api/employees/update", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify(updatedData),
                            })
                                .then((response) => {
                                    if (!response.ok) {
                                        throw new Error("Failed to update profile");
                                    }
                                    return response.json();
                                })
                                .then((responseData) => {
                                    if (responseData.success) {
                                        alert("Profile updated successfully!");
                                        location.reload(); // Reload the page to reflect changes
                                    } else {
                                        alert(responseData.error || "An error occurred while updating the profile.");
                                    }
                                })
                                .catch((error) => {
                                    alert(`Error: ${error.message}`);
                                });
                        });
                    })
                    .catch((error) => {
                        const tableBody = document.getElementById("profile-table-body");
                        tableBody.innerHTML = `<tr><td colspan="2">Error: ${error.message}</td></tr>`;
                    });
            }



            if (target === "employees") {
                Clear_Content();

                const header = mainContent.querySelector("header");
                header.innerHTML = "<h1>Employees</h1>";

                const newDiv = document.createElement("div");
                newDiv.innerHTML = `
                    <div class="table-div">
                        <div class="table-container">
                            <h2 class="table-headers">Employees</h2>
                            <table class="content-tables">
                                <thead>
                                    <tr>
                                        <th>Employee ID</th>
                                        <th>First Name</th>
                                        <th>Last Name</th>
                                        <th>Phone</th>
                                        <th>Email</th>
                                        <th>Start Date</th>
                                    </tr>
                                </thead>
                                <tbody id="employee-table-body">
                                    <!--Dynamic rows-->
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="table-buttons">
                        <a href="#" id="create-employee-link"><button>Create Employee</button></a>
                        <a href="#" id="delete-employee-link"><button>Delete Employee</button></a>
                        <a href="#" id="search-employee-link"><button>Search Employee</button></a>
                    </div>
                    
                    <div id="create-employee-form-container" class="hidden">
                        <h2>Create New Employee</h2>
                        <form id="create-employee-form" class="registration-form">
                            <label for="new-fname">First Name</label>
                            <input type="text" id="new-fname" name="new-fname" placeholder="Enter first name" required>
            
                            <label for="new-lname">Last Name</label>
                            <input type="text" id="new-lname" name="new-lname" placeholder="Enter last name" required>
            
                            <label for="new-username">Username</label>
                            <input type="text" id="new-username" name="new-username" placeholder="Enter username" required>
            
                            <label for="new-password">Password</label>
                            <input type="password" id="new-password" name="new-password" placeholder="Enter password" required>
            
                            <label for="new-phone">Phone Number</label>
                            <input type="text" id="new-phone" name="new-phone" placeholder="Enter phone number" required>
            
                            <label for="new-email">Email</label>
                            <input type="email" id="new-email" name="new-email" placeholder="Enter email" required>
            
                            <label for="new-start-date">Start Date</label>
                            <input type="date" id="new-start-date" name="new-start-date" required>
            
                            <button type="submit">Create Employee</button>
                        </form>
                    </div>
                    
                    <div class="table-div">
                        <div class="table-container">
                            <h2 class="table-headers">Employee Projects</h2>
                            <table class="content-tables">
                                <thead>
                                    <tr>
                                        <th>Employee ID</th>
                                        <th>Project Number</th>
                                    </tr>
                                </thead>
                                <tbody id="works-on-table-body">
                                    <!--Dynamic rows-->
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="table-buttons">
                        <a href="#" id="add-works-on-link"><button>Assign Project</button></a>
                        <a href="#" id="delete-works-on-link"><button>Delete Project Assignment</button></a>
                        <a href="#" id="search-works-on-link"><button>Search Employee's Projects</button></a>
                    </div>
                    
                    <div id="assign-project-form-container" class="hidden">
                        <h2>Assign Project</h2>
                        <form id="assign-project-form" class="registration-form">
                            <label for="assign-employee-id">Employee ID</label>
                            <input type="text" id="assign-employee-id" name="employee_id" placeholder="Enter Employee ID" required />
                    
                            <label for="assign-project-num">Project Number</label>
                            <input type="text" id="assign-project-num" name="project_num" placeholder="Enter Project Number" required />
                    
                            <button type="submit">Assign</button>
                        </form>
                    </div>
                    `;
                mainContent.appendChild(newDiv);

                // handle search employee's projects button
                const searchProjectsButton = document.getElementById("search-works-on-link");

                if (searchProjectsButton) {
                    searchProjectsButton.addEventListener("click", (event) => {
                        event.preventDefault(); // Prevent default link behavior

                        const employeeId = prompt("Enter the Employee ID to search:");

                        if (employeeId) {
                            fetch(`/api/works_on/search/${employeeId}`)
                                .then((response) => {
                                    if (!response.ok) {
                                        throw new Error("Employee not found or an error occurred.");
                                    }
                                    return response.json();
                                })
                                .then((data) => {
                                    if (data.employee && data.projects) {
                                        const employeeInfo = `
                                            <h2>Employee Details</h2>
                                            <p><strong>ID:</strong> ${data.employee.id}</p>
                                            <p><strong>First Name:</strong> ${data.employee.first_name}</p>
                                            <p><strong>Last Name:</strong> ${data.employee.last_name}</p>
                                            <p><strong>Phone:</strong> ${data.employee.phone}</p>
                                            <p><strong>Email:</strong> ${data.employee.email}</p>
                                            <h3>Projects</h3>
                                            <ul>
                                                ${data.projects.map((project) => `<li>${project}</li>`).join("")}
                                            </ul>
                                        `;

                                        const popup = window.open("", "Employee Projects", "width=500,height=500");
                                        popup.document.write(`
                                            <html>
                                                <head>
                                                    <title>Employee Projects</title>
                                                </head>
                                                <body>
                                                    ${employeeInfo}
                                                    <button onclick="window.close()">Close</button>
                                                </body>
                                            </html>
                                        `);
                                    } else {
                                        alert("No projects found for this employee.");
                                    }
                                })
                                .catch((error) => {
                                    alert(error.message || "An error occurred while searching for the employee's projects.");
                                    console.error("Error fetching employee projects:", error);
                                });
                        }
                    });
                }

                // handle delete project assignment button
                const deleteProjectAssignmentButton = document.getElementById("delete-works-on-link");

                if (deleteProjectAssignmentButton) {
                    deleteProjectAssignmentButton.addEventListener("click", (event) => {
                        event.preventDefault();

                        const employeeId = prompt("Enter the Employee ID:");
                        const projectNum = prompt("Enter the Project Number:");

                        if (employeeId && projectNum) {
                            fetch('/api/works_on/delete', {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ employee_id: employeeId, project_num: projectNum }),
                            })
                                .then((response) => response.json())
                                .then((data) => {
                                    if (data.success) {
                                        alert(data.message);
                                        location.reload();
                                    } else {
                                        alert(data.error || "An error occurred.");
                                    }
                                })
                                .catch((error) => {
                                    alert("An unexpected error occurred. Please try again.");
                                    console.error("Error deleting project assignment:", error);
                                });
                        } else {
                            alert("Employee ID and Project Number are required.");
                        }
                    });
                }


                // handle assign project button
                const assignProjectButton = document.getElementById("add-works-on-link");
                const assignProjectFormContainer = document.getElementById("assign-project-form-container");
                const assignProjectForm = document.getElementById("assign-project-form");

                if (assignProjectButton) {
                    assignProjectButton.addEventListener("click", (event) => {
                        event.preventDefault();
                        assignProjectFormContainer.classList.toggle("hidden");
                    });
                }
                // handle form submission
                if (assignProjectForm) {
                    assignProjectForm.addEventListener("submit", (event) => {
                        event.preventDefault();

                        const formData = new FormData(assignProjectForm);

                        fetch('/api/works_on/assign', {
                            method: "POST",
                            body: formData,
                        })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    alert(data.message);
                                    location.reload(); // Reload the page
                                } else {
                                    alert(data.error || "An error occurred.");
                                }
                            })
                            .catch(error => {
                                console.error("Error:", error);
                                alert("An unexpected error occurred.");
                            });
                    });
                }

                // Fetch all employees from the backend
                fetch('/api/employees')
                    .then(response => response.json())
                    .then(data => {
                        const tableBody = document.getElementById('employee-table-body');
                        tableBody.innerHTML = ''; // Clear existing rows
                        data.employees.forEach(employee => {
                            const row = document.createElement('tr');
                            row.innerHTML = `
                                <td>${employee.id}</td>
                                <td>${employee.first_name}</td>
                                <td>${employee.last_name}</td>
                                <td>${employee.phone}</td>
                                <td>${employee.email}</td>
                                <td>${employee.start_date}</td>
                            `;
                            tableBody.appendChild(row);
                        });
                    })
                    .catch(error => console.error('Error fetching employee data:', error));


                // fetch works_on table from back end
                fetch('/api/works_on')
                    .then(response => response.json())
                    .then(data => {
                        const tableBody = document.getElementById('works-on-table-body');
                        tableBody.innerHTML = '';
                        data.works_on.forEach(works_on => {
                            const row = document.createElement('tr');
                            row.innerHTML = `
                                <td>${works_on.employee_id}</td>
                                <td>${works_on.project_num}</td>
                            `;
                            tableBody.appendChild(row);
                        });
                    })
                    .catch(error => console.error('Error fetching assigned project data:', error));



                // Handle delete employee button
                document.getElementById('delete-employee-link').addEventListener('click', (event) => {
                    event.preventDefault(); // Prevent anchor default behavior
                    const employeeId = prompt("Enter the Employee ID to delete:");

                    if (employeeId) {
                        fetch(`/api/employees/delete/${employeeId}`, {
                            method: 'DELETE',
                        })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    alert('Employee deleted successfully!');
                                    location.reload(); // Reload the employee list
                                } else {
                                    alert(data.error || 'An error occurred while deleting the employee.');
                                }
                            })
                            .catch(error => console.error('Error deleting employee:', error));
                    }
                });

                // Show the create employee form
                document.getElementById('create-employee-link').addEventListener('click', (event) => {
                    event.preventDefault();
                    const formContainer = document.getElementById('create-employee-form-container');
                    formContainer.classList.toggle('hidden');
                });

                // Handle form submission
                document.getElementById('create-employee-form').addEventListener('submit', (e) => {
                    e.preventDefault();

                    const newEmployeeData = {
                        fname: document.getElementById('new-fname').value.trim(),
                        lname: document.getElementById('new-lname').value.trim(),
                        username: document.getElementById('new-username').value.trim(),
                        password: document.getElementById('new-password').value.trim(),
                        phone: document.getElementById('new-phone').value.trim(),
                        email: document.getElementById('new-email').value.trim(),
                        start_date: document.getElementById('new-start-date').value.trim(),
                    };

                    if (newEmployeeData.password.length < 10) {
                        alert("Password must be at least 10 characters long");
                        return;
                    }
                    if (!/^\d+$/.test(newEmployeeData.phone) || newEmployeeData.phone.length !== 10) {
                        alert("Phone number must be exactly 10 digits");
                        return;
                    }
                    if (newEmployeeData.username.length < 7) {
                        alert("Username must be at least 7 characters long");
                        return;
                    }

                    // Submit the new employee data to the backend
                    fetch('/api/employees/create', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newEmployeeData),
                    })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                alert('Employee created successfully!');
                                location.reload(); // Reload the page to see the new employee
                            } else {
                                alert(data.error || 'An error occurred while creating the employee.');
                            }
                        })
                        .catch(error => console.error('Error creating employee:', error));
                });

                //Handle Search employee button
                const searchEmployeeButton = document.getElementById("search-employee-link");

                if (searchEmployeeButton) {
                    searchEmployeeButton.addEventListener("click", (event) => {
                        event.preventDefault(); // Prevent default link behavior

                        const employeeId = prompt("Enter the Employee ID to search:");

                        if (employeeId) {
                            fetch(`/api/employees/${employeeId}`)
                                .then((response) => {
                                    if (!response.ok) {
                                        throw new Error("Employee not found or an error occurred.");
                                    }
                                    return response.json();
                                })
                                .then((employeeData) => {
                                    const employeeInfo = `
                                        <h2>Employee Details</h2>
                                        <p><strong>ID:</strong> ${employeeData.id}</p>
                                        <p><strong>First Name:</strong> ${employeeData.first_name}</p>
                                        <p><strong>Last Name:</strong> ${employeeData.last_name}</p>
                                        <p><strong>Phone:</strong> ${employeeData.phone}</p>
                                        <p><strong>Email:</strong> ${employeeData.email}</p>
                                        <p><strong>Start Date:</strong> ${employeeData.start_date}</p>
                                    `;

                                    const popup = window.open("", "Employee Details", "width=400,height=400");
                                    popup.document.write(`
                                        <html>
                                            <head>
                                                <title>Employee Details</title>
                                            </head>
                                            <body>
                                                ${employeeInfo}
                                                <button onclick="window.close()">Close</button>
                                            </body>
                                        </html>
                                    `);
                                })
                                .catch((error) => {
                                    alert(error.message || "An error occurred while searching for the employee.");
                                    console.error("Error fetching employee data:", error);
                                });
                        }
                    });
                }
            }



            if (target === "projects") {

                Clear_Content();

                const header = mainContent.querySelector("header");
                header.innerHTML = "<h1>Projects</h1>";

                const newDiv = document.createElement("div");
                newDiv.innerHTML = `
                    <div class="table-div">
                        <div class="table-container">
                           <h2 class="table-headers">Projects</h2>
                           <table class="content-tables">
                                <thead>
                                    <tr>
                                        <th>Project Number</th>
                                        <th>Estimate Length</th>
                                        <th>Start Time</th>
                                        <th>Address</th>
                                    </tr>
                                </thead>
                                <tbody id="project-table-body">
                                   <!-- Dynamic rows -->
                               </tbody>
                           </table>
                        </div>
                    </div>
                    
                    <div class="table-buttons">
                        <a href="#" id="add-project-link"><button>Add Project</button></a>
                        <a href="#" id="delete-project-link"><button>Delete Project</button></a>
                        <a href="#" id="search-project-link"><button>Search Project</button></a>
                        <a href="#"><button id="edit-project-link">Edit Project</button></a>
                    </div>
                    
                    <div id="add-project-form-container" class="hidden">
                        <h2>Create New Project</h2>
                        <form id="add-project-form" class="registration-form">
                            <label for="estimate-length">Estimate Length</label>
                            <input type="text" id="estimate-length" name="estimate-length" placeholder="Enter estimate length" required>
                    
                            <label for="start-time">Start Time</label>
                            <input type="date" id="start-time" name="start-time" required>
                    
                            <label for="address">Address</label>
                            <input type="text" id="address" name="address" placeholder="Enter project address" required>
                    
                            <button type="submit">Create Project</button>
                        </form>
                    </div>
                    
                   <div id="edit-project-form-container" class="hidden">
                        <h2>Edit Project</h2>
                        <form id="edit-project-form" class="registration-form">
                            <label for="edit-project-number">Project Number</label>
                            <input type="text" id="edit-project-number" name="project_number" readonly required>
                    
                            <label for="edit-estimate-length">Estimate Length</label>
                            <input type="text" id="edit-estimate-length" name="estimate_length" placeholder="Enter Estimate Length" required>
                    
                            <label for="edit-start-time">Start Time</label>
                            <input type="date" id="edit-start-time" name="start_time" required>
                    
                            <label for="edit-address">Address</label>
                            <input type="text" id="edit-address" name="address" placeholder="Enter Address" required>
                    
                            <label for="edit-employee-id">Employee ID</label>
                            <input type="text" id="edit-employee-id" name="employee_id" placeholder="Enter Employee ID">
                    
                            <button type="submit">Save Changes</button>
                        </form>
                    </div>
                    
                    <div class="table-div">
                        <div class="table-container">
                            <h2 class="table-headers">Completion Certificates</h2>
                            <table class="content-tables">
                                <thead>
                                    <tr>
                                        <th>Certificate Number</th>
                                        <th>Certificate Text</th>
                                        <th>Date</th>
                                        <th>Customer ID</th>
                                        <th>Project Number</th>
                                    </tr>
                                </thead>
                                <tbody id="certificate-table-body">
                                    <!-- Dynamic rows -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="table-buttons">
                        <a href="#" id="add-certificate-link"><button>Add Certificate</button></a>
                        <a href="#" id="delete-certificate-link"><button>Delete Certificate</button></a>
                        <a href="#" id="search-certificate-link"><button>Search Certificate</button></a>
                        <a href="#" id="update-certificate-link"><button>Update Certificate</button></a>
                    </div>
                    
                    <div id="add-certificate-form-container" class="hidden">
                        <h2>Add Certificate</h2>
                        <form id="add-certificate-form" class="registration-form">
                            <label for="certificate-text">Certificate Text</label>
                            <textarea id="certificate-text" name="certificate-text" placeholder="Enter certificate text" required></textarea>
                        
                            <label for="certificate-date">Date</label>
                            <input type="date" id="certificate-date" name="certificate-date" required />
                        
                            <label for="certificate-customer-id">Customer ID</label>
                            <input type="text" id="certificate-customer-id" name="certificate-customer-id" placeholder="Enter customer ID" required />
                        
                            <label for="certificate-project-number">Project Number</label>
                            <input type="text" id="certificate-project-number" name="certificate-project-number" placeholder="Enter project number" />
                        
                            <button type="submit">Create Certificate</button>
                        </form>
                    </div>

                    <div id="update-certificate-form-container" class="hidden">
                        <h2>Update Certificate</h2>
                        <form id="update-certificate-form" class="registration-form">
                            <label for="update-certificate-number">Certificate Number</label>
                            <input type="text" id="update-certificate-number" name="certificate-number" readonly required />
                    
                            <label for="update-certificate-text">Certificate Text</label>
                            <textarea id="update-certificate-text" name="certificate_text" placeholder="Enter certificate text" required></textarea>
                    
                            <label for="update-date">Date</label>
                            <input type="date" id="update-date" name="date" required />
                    
                            <label for="update-customer-id">Customer ID</label>
                            <input type="text" id="update-customer-id" name="customer_id" readonly required />
                    
                            <label for="update-project-number">Project Number</label>
                            <input type="text" id="update-project-number" name="project_num" readonly />
                            
                            <button type="submit">Save Changes</button>
                        </form>
                    </div>
                    
                    <div class="table-div">
                        <div class="table-container">
                            <h2 class="table-headers">Orders</h2>
                            <table class="content-tables">
                                <thead>
                                    <tr>
                                        <th>Order Number</th>
                                        <th>Store Name</th>
                                        <th>Completion Status</th>
                                        <th>Project Number</th>
                                    </tr>
                                </thead>
                                <tbody id="order-table-body">
                                    <!-- Dynamic rows -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="table-buttons">
                        <a href="#" id="add-order-link"><button>Add Order</button></a>
                        <a href="#" id="delete-order-link"><button>Delete Order</button></a>
                        <a href="#" id="search-order-link"><button>Search Order</button></a>
                        <a href="#" id="update-order-status-link"><button>Update Order Status</button></a>
                    </div>
                    
                   <div id="add-order-form-container" class="hidden">
                        <h2>Add Order</h2>
                        <form id="add-order-form" class="registration-form">
                            <label for="store-name">Store Name</label>
                            <input type="text" id="store-name" name="store_name" placeholder="Enter store name" required>
                    
                            <label for="project-num">Project Number</label>
                            <input type="text" id="project-num" name="project_num" placeholder="Enter project number" required>
                    
                            <label for="completion-stat">Completion Status</label>
                            <select id="completion-stat" name="completion_stat">
                                <option value="0">Pending</option>
                                <option value="1">Completed</option>
                            </select>
                    
                            <button type="submit">Add Order</button>
                        </form>
                    </div>
                    
                    <div id="update-order-status-form-container" class="hidden">
                        <h2>Update Order Completion Status</h2>
                        <form id="update-order-status-form" class="registration-form">
                            <label for="update-order-number">Order Number</label>
                            <input type="text" id="update-order-number" name="order-number" placeholder="Enter Order Number" readonly required>
                    
                            <label for="update-completion-status">Completion Status</label>
                            <select id="update-completion-status" name="completion_stat" required>
                                <option value="1">Completed</option>
                                <option value="0">Pending</option>
                            </select>
                    
                            <button type="submit">Save Changes</button>
                        </form>
                    </div>
                    
                    <div class="table-div">
                        <div class="table-container">
                            <h2 class="table-headers">Contracts</h2>
                            <table class="content-tables">
                                <thead>
                                    <tr>
                                        <th>Contract Number</th>
                                        <th>Employee ID</th>
                                        <th>Customer ID</th>
                                        <th>Contract Text</th>
                                    </tr>
                                </thead>
                                <tbody id="contract-table-body">
                                    <!-- Dynamic rows -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="table-buttons">
                        <a href="#" id="add-contract-link"><button>Add Contract</button></a>
                        <a href="#" id="delete-contract-link"><button>Delete Contract</button></a>
                        <a href="#" id="search-contract-link"><button>Search Contract</button></a>
                        <a href="#" id="edit-contract-link"><button>Edit Contract Text</button></a>
                    </div>
                    
                    <div id="add-contract-form-container" class="hidden">
                        <h2>Add New Contract</h2>
                        <form id="add-contract-form" class="registration-form">
                            <label for="contract-pdf">Contract Text</label>
                            <textarea id="contract-pdf" name="contract_pdf" placeholder="Enter contract text" required></textarea>
                    
                            <label for="employee-id">Employee ID</label>
                            <input type="text" id="employee-id" name="employee_id" placeholder="Enter employee ID" required>
                    
                            <label for="customer-id">Customer ID</label>
                            <input type="text" id="customer-id" name="customer_id" placeholder="Enter customer ID" required>
                    
                            <label for="project-number">Project Number</label>
                            <input type="text" id="project-number" name="project_num" placeholder="Enter project number" required>
                    
                            <label for="contract-date">Date</label>
                            <input type="date" id="contract-date" name="date" required>
                    
                            <button type="submit">Add Contract</button>
                        </form>
                    </div>
                    
                    <div id="edit-contract-form-container" class="hidden">
                        <h2>Edit Contract</h2>
                        <form id="edit-contract-form" class="registration-form">
                            <input type="hidden" id="edit-contract-number" name="contract_number">
                    
                            <label for="edit-contract-text">Contract Text:</label>
                            <textarea id="edit-contract-text" name="contract_text" rows="5" placeholder="Enter new contract text" required></textarea>
                    
                            <button type="submit">Save Changes</button>
                        </form>
                    </div>
                    
                    <div class="table-div">
                        <div class="table-container">
                            <h2 class="table-headers">Materials List</h2>
                            <table class="content-tables">
                                <thead>
                                    <tr>
                                        <th>Material ID</th>
                                        <th>Name</th>
                                        <th>Type</th>
                                        <th>Cost</th>
                                        <th>Amount</th>
                                        <th>Order Number</th>
                                    </tr>
                                </thead>
                                <tbody id="materials-table-body">
                                    <!-- Dynamic rows -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="table-buttons">
                        <a href="#" id="add-material-link"><button>Add Material</button></a>
                        <a href="#" id="delete-material-link"><button>Delete Material</button></a>
                        <a href="#" id="search-material-link"><button>Search Material</button></a>
                    </div>
                    
                    <div id="add-material-form-container" class="hidden">
                        <h2>Add Material</h2>
                        <form id="add-material-form" class="registration-form">
                            <label for="material-name">Material Name:</label>
                            <input type="text" id="material-name" name="name" placeholder="Enter material name" required>
                    
                            <label for="material-type">Material Type:</label>
                            <input type="text" id="material-type" name="type" placeholder="Enter material type" required>
                    
                            <label for="material-cost">Cost:</label>
                            <input type="text" id="material-cost" name="cost" placeholder="Enter material cost" required>
                    
                            <label for="material-amount">Amount:</label>
                            <input type="text" id="material-amount" name="amount" placeholder="Enter material amount" required>
                    
                            <label for="order-number">Order Number:</label>
                            <input type="text" id="order-number" name="order_num" placeholder="Enter associated order number" required>
                    
                            <button type="submit">Add Material</button>
                        </form>
                    </div> 
                `;
                mainContent.appendChild(newDiv);


                // handle search material button
                const searchMaterialButton = document.getElementById("search-material-link");

                if (searchMaterialButton) {
                    searchMaterialButton.addEventListener("click", (event) => {
                        event.preventDefault();

                        const materialId = prompt("Enter the Material ID to search:");

                        if (materialId && materialId.trim() !== "") {
                            // Fetch material details from the backend
                            fetch(`/api/materials/search/${materialId}`)
                                .then((response) => {
                                    if (!response.ok) {
                                        throw new Error("Material not found or an error occurred.");
                                    }
                                    return response.json();
                                })
                                .then((materialData) => {
                                    const materialInfo = `
                                        <h2>Material Details</h2>
                                        <p><strong>Material ID:</strong> ${materialData.material_id}</p>
                                        <p><strong>Name:</strong> ${materialData.name}</p>
                                        <p><strong>Type:</strong> ${materialData.type}</p>
                                        <p><strong>Cost:</strong> ${materialData.cost}</p>
                                        <p><strong>Amount:</strong> ${materialData.amount}</p>
                                        <p><strong>Order Number:</strong> ${materialData.order_num}</p>
                                    `;

                                    const popup = window.open("", "Material Details", "width=400,height=400");
                                    popup.document.write(`
                                        <html>
                                            <head>
                                                <title>Material Details</title>
                                            </head>
                                            <body>
                                                ${materialInfo}
                                                <button onclick="window.close()">Close</button>
                                            </body>
                                        </html>
                                    `);
                                })
                                .catch((error) => {
                                    alert(error.message || "An error occurred while searching for the material.");
                                    console.error("Error fetching material data:", error);
                                });
                        }
                    });
                }


                // handle add material button
                const addMaterialButton = document.getElementById("add-material-link");

                if (addMaterialButton) {
                    addMaterialButton.addEventListener("click", (event) => {
                        event.preventDefault(); // Prevent default link behavior
                        document.getElementById("add-material-form-container").classList.toggle("hidden");
                    });
                }

                // Handle form submission for adding a material
                document.getElementById("add-material-form").addEventListener("submit", (event) => {
                    event.preventDefault(); // Prevent default form submission

                    const formData = new FormData(document.getElementById("add-material-form"));

                    fetch(`/api/materials/create`, {
                        method: "POST",
                        body: formData,
                    })
                        .then((response) => response.json())
                        .then((data) => {
                            if (data.success) {
                                alert("Material added successfully!");
                                location.reload(); // Reload the page to refresh the data
                            } else {
                                alert(data.error || "An error occurred while adding the material.");
                            }
                        })
                        .catch((error) => {
                            alert("An unexpected error occurred. Please try again.");
                            console.error("Error adding material:", error);
                        });
                });



                // Fetch all projects from the backend
                fetch('/api/projects')
                    .then(response => response.json())
                    .then(data => {
                        const tableBody = document.getElementById('project-table-body');
                        tableBody.innerHTML = '';
                        data.projects.forEach(project => {
                            const row = document.createElement('tr');
                            row.innerHTML = `
                                <td>${project.project_num}</td>
                                <td>${project.estimate_length}</td>
                                <td>${project.start_time}</td>
                                <td>${project.address}</td>
                            `;
                            tableBody.appendChild(row);
                        });
                    })
                    .catch(error => console.error('Error fetching project data:', error));


                // Fetch all orders from the backend
                fetch('/api/orders')
                    .then(response => response.json())
                    .then(data => {
                        const tableBody = document.getElementById('order-table-body');
                        tableBody.innerHTML = ''; //
                        data.orders.forEach(order => {
                            const row = document.createElement('tr');
                            row.innerHTML = `
                                <td>${order.order_num}</td>
                                <td>${order.store_name}</td>
                                <td>${order.completion_stat ? "Completed" : "Pending"}</td>
                                <td>${order.project_num}</td>
                            `;
                            tableBody.appendChild(row);
                        });
                    })
                    .catch(error => console.error('Error fetching order data:', error));


                // Fetch all certificates from the backend
                fetch('/api/certificates')
                    .then(response => response.json())
                    .then(data => {
                        const tableBody = document.getElementById('certificate-table-body');
                        tableBody.innerHTML = '';
                        data.certificates.forEach(certificate => {
                            const row = document.createElement('tr');
                            row.innerHTML = `
                                <td>${certificate.certificate_num}</td>
                                <td>${certificate.certificate_pdf}</td>
                                <td>${certificate.date}</td>
                                <td>${certificate.customer_id}</td>
                                <td>${certificate.project_num}</td>
                            `;
                            tableBody.appendChild(row);
                        });
                    })
                    .catch(error => console.error('Error fetching certificate data:', error));


                // Fetch contract data from the backend
                fetch('/api/contracts')
                    .then(response => response.json())
                    .then(data => {
                        const tableBody = document.getElementById('contract-table-body');
                        tableBody.innerHTML = '';
                        data.contracts.forEach(contract => {
                            const row = document.createElement('tr');
                            row.innerHTML = `
                                <td>${contract.contract_num}</td>
                                <td>${contract.employee_id}</td>
                                <td>${contract.customer_id}</td>
                                <td>${contract.contract_text}</td>
                            `;
                            tableBody.appendChild(row);
                        });
                    })
                    .catch(error => console.error('Error fetching contract data:', error));


                // fetch Material data from backend
                fetch('/api/materials')
                    .then(response => response.json())
                    .then(data => {
                        const tableBody = document.getElementById('materials-table-body');
                        tableBody.innerHTML = '';
                        data.materials.forEach(material => {
                            const row = document.createElement('tr');
                            row.innerHTML = `
                                <td>${material.material_id}</td>
                                <td>${material.name}</td>
                                <td>${material.type}</td>
                                <td>${material.cost}</td>
                                <td>${material.amount}</td>
                                <td>${material.order_num}</td>
                            `;
                            tableBody.appendChild(row);
                        });
                    })
                    .catch(error => console.error('Error fetching materials data:', error));

                // Handle Delete project button
                document.getElementById('delete-project-link').addEventListener('click', (event) => {
                    event.preventDefault();
                    const projectNum = prompt("Enter the Project Number to delete:");

                    if (projectNum) {
                        fetch(`/api/projects/delete/${projectNum}`, { method: 'DELETE' })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    alert('Project deleted successfully!');
                                    location.reload();
                                } else {
                                    alert(data.error || 'An error occurred while deleting the project.');
                                }
                            })
                            .catch(error => console.error('Error deleting project:', error));
                    }
                });

                // Handle Delete certificate button
                document.getElementById('delete-certificate-link').addEventListener('click', (event) => {
                    event.preventDefault();
                    const certificateNum = prompt("Enter the Certificate Number to delete:");

                    if (certificateNum) {
                        fetch(`/api/certificates/delete/${certificateNum}`, { method: 'DELETE' })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    alert('Certificate deleted successfully!');
                                    location.reload();
                                } else {
                                    alert(data.error || 'An error occurred while deleting the certificate.');
                                }
                            })
                            .catch(error => console.error('Error deleting certificate:', error));
                    }
                });

                // Handle delete order button
                document.getElementById('delete-order-link').addEventListener('click', (event) => {
                    event.preventDefault();
                    const orderNum = prompt("Enter the Order Number to delete:");

                    if (orderNum) {
                        fetch(`/api/orders/delete/${orderNum}`, { method: 'DELETE' })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    alert('Order deleted successfully!');
                                    location.reload();
                                } else {
                                    alert(data.error || 'An error occurred while deleting the order.');
                                }
                            })
                            .catch(error => console.error('Error deleting order:', error));
                    }
                });

                // Handle Delete contract button
                document.getElementById('delete-contract-link').addEventListener('click', (event) => {
                    event.preventDefault();
                    const contractNum = prompt("Enter the Contract Number to delete:");

                    if (contractNum) {
                        fetch(`/api/contracts/delete/${contractNum}`, { method: 'DELETE' })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    alert('Contract deleted successfully!');
                                    location.reload();
                                } else {
                                    alert(data.error || 'An error occurred while deleting the contract.');
                                }
                            })
                            .catch(error => console.error('Error deleting contract:', error));
                    }
                });

                // Handle Delete material button
                document.getElementById('delete-material-link').addEventListener('click', (event) => {
                    event.preventDefault();
                    const materialId = prompt("Enter the Material ID to delete:");

                    if (materialId) {
                        fetch(`/api/materials/delete/${materialId}`, { method: 'DELETE' })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    alert('Material deleted successfully!');
                                    location.reload();
                                } else {
                                    alert(data.error || 'An error occurred while deleting the material.');
                                }
                            })
                            .catch(error => console.error('Error deleting material:', error));
                    }
                });

                // Handle Add Project button visibility
                const addProjectButton = document.getElementById("add-project-link");
                const formContainer = document.getElementById("add-project-form-container");

                addProjectButton.addEventListener("click", (event) => {
                    event.preventDefault(); // Prevent default anchor behavior
                    formContainer.classList.toggle("hidden");
                });

                // Handle Add Project form submission
                document.getElementById("add-project-form").addEventListener("submit", (e) => {
                    e.preventDefault(); // Prevent default form submission

                    // Collect the form data
                    const newProjectData = {
                        estimate_length: document.getElementById("estimate-length").value.trim(),
                        start_time: document.getElementById("start-time").value.trim(),
                        address: document.getElementById("address").value.trim(),
                    };

                    if (!newProjectData.estimate_length) {
                        alert("Estimate Length is required.");
                        return;
                    }
                    if (!newProjectData.start_time) {
                        alert("Start Time is required.");
                        return;
                    }
                    if (!newProjectData.address) {
                        alert("Address is required.");
                        return;
                    }

                    fetch("/api/projects/create", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(newProjectData),
                    })
                        .then((response) => response.json())
                        .then((data) => {
                            if (data.success) {
                                alert(`Project created successfully with ID: ${data.project_num}`);
                                location.reload();
                            } else {
                                alert(data.error || "An error occurred while creating the project.");
                            }
                        })
                        .catch((error) => {
                            console.error("Error creating project:", error);
                            alert("An unexpected error occurred. Please try again.");
                        });
                });



                // Handle Add Certificate button visibility
                const addCertificateButton = document.getElementById("add-certificate-link");
                const certificateFormContainer = document.getElementById("add-certificate-form-container");

                addCertificateButton.addEventListener("click", (event) => {
                    event.preventDefault(); // Prevent default link behavior
                    certificateFormContainer.classList.toggle("hidden"); // Toggle visibility of the form
                });

                // Handle Add Certificate form submission
                document.getElementById("add-certificate-form").addEventListener("submit", (e) => {
                    e.preventDefault(); // Prevent default form submission

                    const newCertificateData = {
                        certificate_pdf: document.getElementById("certificate-text").value.trim(),
                        date: document.getElementById("certificate-date").value.trim(),
                        customer_id: document.getElementById("certificate-customer-id").value.trim(),
                        project_num: document.getElementById("certificate-project-number").value.trim(),
                    };

                    if (!newCertificateData.certificate_pdf || !newCertificateData.date || !newCertificateData.customer_id) {
                        alert("Certificate text, date, and customer ID are required.");
                        return;
                    }

                    fetch("/api/certificates/create", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(newCertificateData),
                    })
                        .then((response) => response.json())
                        .then((data) => {
                            if (data.success) {
                                alert(`Certificate created successfully with ID: ${data.certificate_num}`);
                                location.reload()
                            } else {
                                alert(data.error || "An error occurred while creating the certificate.");
                            }
                        })
                        .catch((error) => {
                            console.error("Error creating certificate:", error);
                            alert("An unexpected error occurred. Please try again.");
                        });
                });

                // Handle search project button
                const searchProjectButton = document.getElementById("search-project-link");

                if (searchProjectButton) {
                    searchProjectButton.addEventListener("click", (event) => {
                        event.preventDefault(); // Prevent default link behavior

                        const projectNum = prompt("Enter the Project Number to search:");

                        if (projectNum && projectNum.trim() !== "") {
                            // Fetch project details from the backend
                            fetch(`/api/projects/${projectNum}`)
                                .then((response) => {
                                    if (!response.ok) {
                                        throw new Error("Project not found or an error occurred.");
                                    }
                                    return response.json();
                                })
                                .then((projectData) => {
                                    const projectInfo = `
                                        <h2>Project Details</h2>
                                        <p><strong>Project Number:</strong> ${projectData.project_num}</p>
                                        <p><strong>Estimate Length:</strong> ${projectData.estimate_length || "Not specified"}</p>
                                        <p><strong>Start Time:</strong> ${projectData.start_time || "Not specified"}</p>
                                        <p><strong>Address:</strong> ${projectData.address}</p>
                                        <p><strong>Employee ID:</strong> ${projectData.employee_id || "Not assigned"}</p>
                                    `;

                                    const popup = window.open("", "Project Details", "width=400,height=400");
                                    popup.document.write(`
                                        <html>
                                            <head>
                                                <title>Project Details</title>
                                            </head>
                                            <body>
                                                ${projectInfo}
                                                <button onclick="window.close()">Close</button>
                                            </body>
                                        </html>
                                    `);
                                })
                                .catch((error) => {
                                    alert(error.message || "An error occurred while searching for the project.");
                                    console.error("Error fetching project data:", error);
                                });
                        }
                    });
                }


                //Handle edit project button
                document.getElementById("edit-project-link").addEventListener("click", (event) => {
                    event.preventDefault();

                    const projectNum = prompt("Enter the Project Number to edit:");

                    if (!projectNum) return;

                    fetch(`/api/projects/${projectNum}`)
                        .then((response) => {
                            if (!response.ok) {
                                throw new Error("Project not found or an error occurred.");
                            }
                            return response.json();
                        })
                        .then((projectData) => {
                            document.getElementById("edit-project-number").value = projectData.project_num;
                            document.getElementById("edit-estimate-length").value = projectData.estimate_length;
                            document.getElementById("edit-start-time").value = projectData.start_time;
                            document.getElementById("edit-address").value = projectData.address;
                            document.getElementById("edit-employee-id").value = projectData.employee_id;

                            const editProjectFormContainer = document.getElementById("edit-project-form-container");
                            editProjectFormContainer.classList.remove("hidden");
                        })
                        .catch((error) => {
                            alert(error.message || "An error occurred while fetching the project data.");
                            console.error("Error fetching project data:", error);
                        });
                });

                // Handle the Edit Project Form submission
                document.getElementById("edit-project-form").addEventListener("submit", (e) => {
                    e.preventDefault();

                    const projectNum = document.getElementById("edit-project-number").value.trim();
                    const updatedData = new FormData(document.getElementById("edit-project-form"));

                    fetch(`/api/projects/update/${projectNum}`, {
                        method: "POST",
                        body: updatedData,
                    })
                        .then((response) => response.json())
                        .then((data) => {
                            if (data.success) {
                                alert("Project updated successfully!");
                                location.reload();
                            } else {
                                alert(data.error || "An error occurred while updating the project.");
                            }
                        })
                        .catch((error) => {
                            console.error("Error updating project:", error);
                            alert("An unexpected error occurred. Please try again.");
                        });
                });


                // Handle Add Order Button
                document.getElementById('add-order-link').addEventListener('click', (event) => {
                    event.preventDefault();

                    document.getElementById('add-order-form-container').classList.toggle('hidden');
                });

                // Handle Add Order form submission
                document.getElementById('add-order-form').addEventListener('submit', (event) => {
                    event.preventDefault(); // Prevent default form submission

                    const formData = new FormData(document.getElementById('add-order-form'));

                    fetch('/api/orders/create', {
                        method: 'POST',
                        body: formData,
                    })
                        .then((response) => response.json())
                        .then((data) => {
                            if (data.success) {
                                alert("Order added successfully!");
                                location.reload(); // Reload the page to refresh the data
                            } else {
                                alert(data.error || "An error occurred while adding the order.");
                            }
                        })
                        .catch((error) => {
                            alert("An unexpected error occurred. Please try again.");
                            console.error("Error adding order:", error);
                        });
                });




                // Handle Search Certificate button
                document.getElementById('search-certificate-link').addEventListener('click', (event) => {
                    event.preventDefault(); // Prevent default anchor behavior

                    const certificateNum = prompt("Enter the Certificate Number to search:");

                    if (certificateNum) {
                        fetch(`/api/certificates/${certificateNum}`)
                            .then((response) => {
                                if (!response.ok) {
                                    throw new Error("Certificate not found or an error occurred.");
                                }
                                return response.json();
                            })
                            .then((certificateData) => {
                                const certificateInfo = `
                                    <h2>Certificate Details</h2>
                                    <p><strong>Certificate Number:</strong> ${certificateData.certificate_num}</p>
                                    <p><strong>Certificate Text:</strong> ${certificateData.certificate_pdf || "No text available"}</p>
                                    <p><strong>Date:</strong> ${certificateData.date}</p>
                                    <p><strong>Customer ID:</strong> ${certificateData.customer_id}</p>
                                    <p><strong>Project Number:</strong> ${certificateData.project_num || "Not linked to a project"}</p>
                                `;

                                const popup = window.open("", "Certificate Details", "width=400,height=400");
                                popup.document.write(`
                                    <html>
                                        <head>
                                            <title>Certificate Details</title>
                                        </head>
                                        <body>
                                            ${certificateInfo}
                                            <button onclick="window.close()">Close</button>
                                        </body>
                                    </html>
                                `);
                            })
                            .catch((error) => {
                                alert(error.message || "An error occurred while searching for the certificate.");
                                console.error("Error fetching certificate data:", error);
                            });
                    }
                });


                // Handle Update Certificate button
                document.getElementById('update-certificate-link').addEventListener('click', (event) => {
                    event.preventDefault();

                    const certificateNum = prompt("Enter the Certificate Number to update:");

                    if (certificateNum) {
                        fetch(`/api/certificates/${certificateNum}`)
                            .then((response) => {
                                if (!response.ok) {
                                    throw new Error("Certificate not found or an error occurred.");
                                }
                                return response.json();
                            })
                            .then((certificateData) => {
                                document.getElementById('update-certificate-number').value = certificateData.certificate_num;
                                document.getElementById('update-certificate-text').value = certificateData.certificate_pdf;
                                document.getElementById('update-date').value = certificateData.date;
                                document.getElementById('update-customer-id').value = certificateData.customer_id;
                                document.getElementById('update-project-number').value = certificateData.project_num;

                                document.getElementById('update-certificate-form-container').classList.remove('hidden');
                            })
                            .catch((error) => {
                                alert(error.message || "An error occurred while fetching the certificate.");
                                console.error("Error fetching certificate data:", error);
                            });
                    }
                });

                // Handle form submission for updating the certificate
                document.getElementById('update-certificate-form').addEventListener('submit', (event) => {
                    event.preventDefault();

                    const certificateNum = document.getElementById('update-certificate-number').value;
                    const formData = new FormData(document.getElementById('update-certificate-form'));

                    fetch(`/api/certificates/update/${certificateNum}`, {
                        method: 'POST',
                        body: formData,
                    })
                        .then((response) => response.json())
                        .then((data) => {
                            if (data.success) {
                                alert("Certificate updated successfully!");
                                location.reload();
                            } else {
                                alert(data.error || "An error occurred while updating the certificate.");
                            }
                        })
                        .catch((error) => {
                            alert("An unexpected error occurred. Please try again.");
                            console.error("Error updating certificate:", error);
                        });
                });


                // Handle Update Order Status button
                const updateOrderStatusButton = document.getElementById("update-order-status-link");
                const updateOrderStatusFormContainer = document.getElementById("update-order-status-form-container");
                const updateOrderStatusForm = document.getElementById("update-order-status-form");

                if (updateOrderStatusButton) {
                    updateOrderStatusButton.addEventListener("click", (event) => {
                        event.preventDefault();

                        const orderNum = prompt("Enter the Order Number to update completion status:");

                        if (orderNum && orderNum.trim() !== "") {
                            // Fetch the existing order details
                            fetch(`/api/orders/search/${orderNum}`)
                                .then((response) => {
                                    if (!response.ok) {
                                        throw new Error("Order not found or an error occurred.");
                                    }
                                    return response.json();
                                })
                                .then((orderData) => {
                                    document.getElementById("update-order-number").value = orderData.order_num;
                                    document.getElementById("update-completion-status").value = orderData.completion_stat === "Completed" ? 1 : 0;

                                    updateOrderStatusFormContainer.classList.remove("hidden");
                                })
                                .catch((error) => {
                                    alert(error.message || "An error occurred while fetching the order details.");
                                    console.error("Error fetching order data:", error);
                                });
                        }
                    });
                }

                // Handle the Update Order Status form submission
                if (updateOrderStatusForm) {
                    updateOrderStatusForm.addEventListener("submit", (event) => {
                        event.preventDefault(); // Prevent default form submission

                        const orderNum = document.getElementById("update-order-number").value;
                        const formData = new FormData(updateOrderStatusForm);

                        fetch(`/api/orders/update_status/${orderNum}`, {
                            method: "POST",
                            body: formData,
                        })
                            .then((response) => response.json())
                            .then((data) => {
                                if (data.success) {
                                    alert("Order completion status updated successfully!");
                                    location.reload(); // Reload the page to refresh the list
                                } else {
                                    alert(data.error || "An error occurred while updating the order.");
                                }
                            })
                            .catch((error) => {
                                alert("An unexpected error occurred. Please try again.");
                                console.error("Error updating order:", error);
                            });
                    });
                }


                //Search order button
                const searchOrderButton = document.getElementById("search-order-link");

                if (searchOrderButton) {
                    searchOrderButton.addEventListener("click", (event) => {
                        event.preventDefault(); // Prevent default link behavior

                        const orderNum = prompt("Enter the Order Number to search:");

                        if (orderNum && orderNum.trim() !== "") {
                            fetch(`/api/orders/search/${orderNum}`)
                                .then((response) => {
                                    if (!response.ok) {
                                        throw new Error("Order not found or an error occurred.");
                                    }
                                    return response.json();
                                })
                                .then((orderData) => {
                                    const orderInfo = `
                                        <h2>Order Details</h2>
                                        <p><strong>Order Number:</strong> ${orderData.order_num}</p>
                                        <p><strong>Store Name:</strong> ${orderData.store_name}</p>
                                        <p><strong>Completion Status:</strong> ${orderData.completion_stat}</p>
                                        <p><strong>Project Number:</strong> ${orderData.project_num}</p>
                                    `;

                                    const popup = window.open("", "Order Details", "width=400,height=400");
                                    popup.document.write(`
                                    <html>
                                        <head>
                                            <title>Order Details</title>
                                        </head>
                                        <body>
                                            ${orderInfo}
                                            <button onclick="window.close()">Close</button>
                                        </body>
                                    </html>
                                `);
                                })
                                .catch((error) => {
                                    alert(error.message || "An error occurred while searching for the order.");
                                    console.error("Error fetching order data:", error);
                                });
                        }
                    });
                }


                //add contract button
                const addContractButton = document.getElementById("add-contract-link");

                if (addContractButton) {
                    addContractButton.addEventListener("click", (event) => {
                        event.preventDefault(); // Prevent default link behavior

                        document.getElementById("add-contract-form-container").classList.toggle("hidden");
                    });
                }

                document.getElementById("add-contract-form").addEventListener("submit", (event) => {
                    event.preventDefault(); // Prevent default form submission

                    const formData = new FormData(document.getElementById("add-contract-form"));

                    fetch("/api/contracts/create", {
                        method: "POST",
                        body: formData,
                    })
                        .then((response) => response.json())
                        .then((data) => {
                            if (data.success) {
                                alert("Contract added successfully!");
                                location.reload();
                            } else {
                                alert(data.error || "An error occurred while adding the contract.");
                            }
                        })
                        .catch((error) => {
                            alert("An unexpected error occurred. Please try again.");
                            console.error("Error adding contract:", error);
                        });
                });


                // Handle Search Contract button
                const searchContractButton = document.getElementById("search-contract-link");

                if (searchContractButton) {
                    searchContractButton.addEventListener("click", (event) => {
                        event.preventDefault(); // Prevent default link behavior

                        const contractNum = prompt("Enter the Contract Number to search:");

                        if (contractNum && contractNum.trim() !== "") {
                            fetch(`/api/contracts/search/${contractNum}`)
                                .then((response) => {
                                    if (!response.ok) {
                                        throw new Error("Contract not found or an error occurred.");
                                    }
                                    return response.json();
                                })
                                .then((contractData) => {
                                    const contractInfo = `
                                        <h2>Contract Details</h2>
                                        <p><strong>Contract Number:</strong> ${contractData.contract_num}</p>
                                        <p><strong>Contract Text:</strong> ${contractData.contract_pdf || "No text provided"}</p>
                                        <p><strong>Employee ID:</strong> ${contractData.employee_id}</p>
                                        <p><strong>Customer ID:</strong> ${contractData.customer_id}</p>
                                        <p><strong>Project Number:</strong> ${contractData.project_num}</p>
                                        <p><strong>Date:</strong> ${contractData.date}</p>
                                    `;

                                    const popup = window.open("", "Contract Details", "width=400,height=400");
                                    popup.document.write(`
                                    <html>
                                        <head>
                                            <title>Contract Details</title>
                                        </head>
                                        <body>
                                            ${contractInfo}
                                            <button onclick="window.close()">Close</button>
                                        </body>
                                    </html>
                                `);
                                })
                                .catch((error) => {
                                    alert(error.message || "An error occurred while searching for the contract.");
                                    console.error("Error fetching contract data:", error);
                                });
                        }
                    });
                }

                // Handle edit contract button
                const editContractButton = document.getElementById("edit-contract-link");

                if (editContractButton) {
                    editContractButton.addEventListener("click", (event) => {
                        event.preventDefault(); // Prevent default link behavior

                        const contractNum = prompt("Enter the Contract Number to edit:");

                        if (contractNum && contractNum.trim() !== "") {
                            fetch(`/api/contracts/search/${contractNum}`)
                                .then((response) => {
                                    if (!response.ok) {
                                        throw new Error("Contract not found or an error occurred.");
                                    }
                                    return response.json();
                                })
                                .then((contractData) => {
                                    document.getElementById("edit-contract-number").value = contractData.contract_num;
                                    document.getElementById("edit-contract-text").value = contractData.contract_pdf || "";

                                    document.getElementById("edit-contract-form-container").classList.remove("hidden");
                                })
                                .catch((error) => {
                                    alert(error.message || "An error occurred while fetching the contract.");
                                    console.error("Error fetching contract data:", error);
                                });
                        }
                    });
                }

                // Handle form submission for editing the contract
                document.getElementById("edit-contract-form").addEventListener("submit", (event) => {
                    event.preventDefault(); // Prevent default form submission

                    const contractNum = document.getElementById("edit-contract-number").value;
                    const contractText = document.getElementById("edit-contract-text").value.trim();

                    fetch(`/api/contracts/update/${contractNum}`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ contract_pdf: contractText }),
                    })
                        .then((response) => response.json())
                        .then((data) => {
                            if (data.success) {
                                alert("Contract updated successfully!");
                                location.reload(); // Reload the page to refresh the data
                            } else {
                                alert(data.error || "An error occurred while updating the contract.");
                            }
                        })
                        .catch((error) => {
                            alert("An unexpected error occurred. Please try again.");
                            console.error("Error updating contract:", error);
                        });
                });

            }
        });
    });
});


document.addEventListener("DOMContentLoaded", () => {
    // Function to fetch and display the profile
    const loadProfile = () => {
        fetch('/api/employees/current')
            .then((response) => response.json())
            .then((employeeData) => {
                if (employeeData.error) {
                    console.error("Error fetching employee data:", employeeData.error);
                    return;
                }
                const tableBody = document.getElementById("profile-table-body");
                const rows = `
                    <tr>
                        <th>Employee ID:</th>
                        <td>${employeeData.EMPLOYEE_ID}</td>
                    </tr>
                    <tr>
                        <th>First Name:</th>
                        <td>${employeeData.FNAME}</td>
                    </tr>
                    <tr>
                        <th>Last Name:</th>
                        <td>${employeeData.LNAME}</td>
                    </tr>
                    <tr>
                        <th>Phone Number:</th>
                        <td>${employeeData.PHONE_NUMBER}</td>
                    </tr>
                    <tr>
                        <th>Email:</th>
                        <td>${employeeData.EMAIL}</td>
                    </tr>
                    <tr>
                        <th>Start Date:</th>
                        <td>${employeeData.START_DATE}</td>
                    </tr>
                    <tr>
                        <th>Username:</th>
                        <td>${employeeData.USERNAME}</td>
                    </tr>
                `;
                tableBody.innerHTML = rows;
            })
            .catch((error) => console.error("Error fetching employee data:", error));
    };

    // Load the profile by default on page load
    loadProfile();

    //Edit profile button
    document.getElementById('edit-profile-btn').addEventListener('click', function () {
        const formContainer = document.getElementById('edit-profile-form-container');

        formContainer.classList.toggle('hidden');

        fetch('/api/employees/current')
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                    return;
                }

                document.getElementById('fname').value = data.FNAME;
                document.getElementById('lname').value = data.LNAME;
                document.getElementById('username').value = data.USERNAME;
                document.getElementById('password').value = "";                 // security measure so no one can get password from front end
                document.getElementById('phone').value = data.PHONE_NUMBER;
                document.getElementById('email').value = data.EMAIL;
            })
            .catch(error => console.error('Error fetching employee data:', error));
    });


    // Handle form submission
    document.getElementById('edit-profile-form').addEventListener('submit', function (e) {
        e.preventDefault();

        const fname = document.getElementById('fname').value.trim();
        const lname = document.getElementById('lname').value.trim();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim();

        fetch('/api/employees/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fname,
                lname,
                username,
                password,
                phone,
                email,
            }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Profile updated successfully!');
                    location.reload(); // Reload the page to show changes
                } else {
                    alert(data.error || 'An error occurred.');
                }
            })
            .catch(error => console.error('Error updating profile:', error));
    });
});