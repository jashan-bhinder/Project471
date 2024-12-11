document.addEventListener("DOMContentLoaded", () => {
    const navLinks = document.querySelectorAll(".nav-link");
    const mainContent = document.querySelector(".main-content");


    //Function to remove all child divs except the header of the page
    function Clear_Content() {
        const children = Array.from(mainContent.children); // Get all children of main-content
        children.forEach(child => {
            if (child.tagName.toLowerCase() !== "header") {
                mainContent.removeChild(child); // Remove all elements except the header
            }
        });
    }

    //Navigation sidebar links
    navLinks.forEach(link => {
        link.addEventListener("click", (event) => {
            event.preventDefault(); // Prevent default link behavior

            // Get the target section from the `data-target` attribute
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
                                        <th>Employee ID</th>
                                        <th>Customer ID</th>
                                    </tr>
                                </thead>
                                <tbody id="estimate-table-body">
                                    <!-- Dynamic rows will be added here -->
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
                            <input type="text" id="update-estimate-number" name="update-estimate-number" placeholder="Enter Estimate Number" readonly required>
                    
                            <label for="update-address">Address</label>
                            <input type="text" id="update-address" name="update-address" placeholder="Enter Address" required>
                    
                            <label for="update-project-cost">Project Cost</label>
                            <input type="number" id="update-project-cost" name="update-project-cost" placeholder="Enter Project Cost" required>
                    
                            <label for="update-estimate-pdf">Upload Estimate PDF</label>
                            <input type="file" id="update-estimate-pdf" name="update-estimate-pdf" accept=".pdf">
                    
                    
                            <label for="update-gst">GST</label>
                            <input type="number" id="update-gst" name="update-gst" placeholder="Enter GST" readonly required>
                    
                            <label for="update-total">Total</label>
                            <input type="number" id="update-total" name="update-total" placeholder="Enter Total" readonly required>
                    
                            <label for="update-employee-id">Employee ID</label>
                            <input type="text" id="update-employee-id" name="update-employee-id" placeholder="Enter Employee ID" required>
                    
                            <label for="update-customer-id">Customer ID</label>
                            <input type="text" id="update-customer-id" name="update-customer-id" placeholder="Enter Customer ID" required>
                    
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
                        tableBody.innerHTML = ''; // Clear any existing rows
                        data.estimates.forEach(estimate => {
                            const row = document.createElement('tr');
                            row.innerHTML = `
                                <td>${estimate.estimate_num}</td>
                                <td>${estimate.address}</td>
                                <td>${estimate.project_cost}</td>
                                <td><a href="/api/estimates/download/${estimate.estimate_num}" target="_blank">Download PDF</a></td>
                                <td>${estimate.gst}</td>
                                <td>${estimate.total}</td>
                                <td>${estimate.employee_id}</td>
                                <td>${estimate.customer_id}</td>
                            `;
                            tableBody.appendChild(row);
                        });
                    })
                    .catch(error => console.error('Error fetching estimate data:', error));

                // Handle Delete Estimate button
                document.getElementById('delete-estimate-link').addEventListener('click', (event) => {
                    event.preventDefault(); // Prevent anchor default behavior
                    const estimateNum = prompt("Enter the Estimate Number to delete:");

                    if (estimateNum) {
                        // Send delete request to the backend
                        fetch(`/api/estimates/delete/${estimateNum}`, {
                            method: 'DELETE',
                        })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    alert('Estimate deleted successfully!');
                                    location.reload(); // Reload the estimate list
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
                        event.preventDefault(); // Prevent default link behavior

                        // Prompt the user to enter the Estimate Number
                        const estimateNum = prompt("Enter the Estimate Number to search:");

                        if (estimateNum) {
                            // Fetch estimate details from the backend
                            fetch(`/api/estimates/${estimateNum}`)
                                .then((response) => {
                                    if (!response.ok) {
                                        throw new Error("Estimate not found or an error occurred.");
                                    }
                                    return response.json();
                                })
                                .then((estimateData) => {
                                    // Construct the estimate information
                                    let estimateInfo = `
                                        <h2>Estimate Details</h2>
                                        <p><strong>Estimate Number:</strong> ${estimateData.estimate_num}</p>
                                        <p><strong>Address:</strong> ${estimateData.address}</p>
                                        <p><strong>Project Cost:</strong> ${estimateData.project_cost}</p>
                                        <p><strong>GST:</strong> ${estimateData.gst}</p>
                                        <p><strong>Total:</strong> ${estimateData.total}</p>
                                        <p><strong>Employee ID:</strong> ${estimateData.employee_id}</p>
                                        <p><strong>Customer ID:</strong> ${estimateData.customer_id}</p>
                                    `;

                                    // Add a link to download the PDF if available
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

                                    // Show the information in a pop-up window
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

                        // Populate the Profile table with employee data
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

                        // Set up the Edit Profile button functionality
                        const editProfileBtn = document.getElementById("edit-profile-btn");
                        const editProfileFormContainer = document.getElementById("edit-profile-form-container");
                        const editProfileForm = document.getElementById("edit-profile-form");

                        editProfileBtn.addEventListener("click", () => {
                            // Toggle visibility of the edit form
                            editProfileFormContainer.classList.toggle("hidden");

                            // Populate form fields with current data
                            document.getElementById("fname").value = employeeData.FNAME;
                            document.getElementById("lname").value = employeeData.LNAME;
                            document.getElementById("username").value = employeeData.USERNAME;
                            document.getElementById("password").value = ""; // Do not prefill password
                            document.getElementById("phone").value = employeeData.PHONE_NUMBER;
                            document.getElementById("email").value = employeeData.EMAIL;
                        });

                        // Handle form submission
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

                            // Validate the input data
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

                            // Submit updated data to the backend
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
                            <h2 class="table-headers">Employee List</h2>
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
                    
                    `;
                mainContent.appendChild(newDiv);

                // Fetch employee data from the backend
                fetch('/api/employees')
                    .then(response => response.json())
                    .then(data => {
                        const tableBody = document.getElementById('employee-table-body');
                        tableBody.innerHTML = ''; // Clear any existing rows
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


                // Handle Delete Employee button
                document.getElementById('delete-employee-link').addEventListener('click', (event) => {
                    event.preventDefault(); // Prevent anchor default behavior
                    const employeeId = prompt("Enter the Employee ID to delete:");

                    if (employeeId) {
                        // Send delete request to the backend
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
                    formContainer.classList.toggle('hidden'); // Toggle the visibility of the form
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

                    // Validation checks
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

                        // Prompt the user to enter the Employee ID
                        const employeeId = prompt("Enter the Employee ID to search:");

                        if (employeeId) {
                            // Fetch employee details from the backend
                            fetch(`/api/employees/${employeeId}`)
                                .then((response) => {
                                    if (!response.ok) {
                                        throw new Error("Employee not found or an error occurred.");
                                    }
                                    return response.json();
                                })
                                .then((employeeData) => {
                                    // Construct the employee information
                                    const employeeInfo = `
                                        <h2>Employee Details</h2>
                                        <p><strong>ID:</strong> ${employeeData.id}</p>
                                        <p><strong>First Name:</strong> ${employeeData.first_name}</p>
                                        <p><strong>Last Name:</strong> ${employeeData.last_name}</p>
                                        <p><strong>Phone:</strong> ${employeeData.phone}</p>
                                        <p><strong>Email:</strong> ${employeeData.email}</p>
                                        <p><strong>Start Date:</strong> ${employeeData.start_date}</p>
                                    `;

                                    // Show the information in a pop-up window
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
                                   <!-- Dynamic rows will be added here -->
                               </tbody>
                           </table>
                        </div>
                    </div>
                    
                    <div class="table-buttons">
                        <a href="" id="add-project-link"><button>Add Project</button></a>
                        <a href="#" id="delete-project-link"><button>Delete Project</button></a>
                        <a href="#"><button>Search Project</button></a>
                        <a href="#"><button id="edit-project-link">Edit Project</button></a>
                    </div>
                    
                    <div id="add-project-form-container" class="hidden">
                        <h2>Create New Project</h2>
                        <form id="add-project-form" class="registration-form">
                            <label for="estimate-length">Estimate Length</label>
                            <input type="text" id="estimate-length" name="estimate-length" placeholder="Enter estimate length" required>
                    
                            <label for="start-time">Start Time</label>
                            <input type="datetime-local" id="start-time" name="start-time" required>
                    
                            <label for="address">Address</label>
                            <input type="text" id="address" name="address" placeholder="Enter project address" required>
                    
                            <button type="submit">Create Project</button>
                        </form>
                    </div>
                    
                   <div id="edit-project-form-container" class="hidden">
                        <h2>Edit Project</h2>
                        <form id="edit-project-form" class="registration-form">
                            <label for="edit-estimate-length">Estimate Length</label>
                            <input type="text" id="edit-estimate-length" name="estimate-length" placeholder="Enter estimate length" required>
                    
                            <label for="edit-start-time">Start Time</label>
                            <input type="datetime-local" id="edit-start-time" name="start-time" required>
                    
                            <label for="edit-address">Address</label>
                            <input type="text" id="edit-address" name="address" placeholder="Enter project address" required>
                    
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
                                    </tr>
                                </thead>
                                <tbody id="certificate-table-body">
                                    <!-- Dynamic rows will be added here -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="table-buttons">
                        <a href="#" id="add-certificate-link"><button>Add Certificate</button></a>
                        <a href="#" id="delete-certificate-link"><button>Delete Certificate</button></a>
                        <a href="#"><button>Search Certificate</button></a>
                        <a href="#"><button>Update Certificate</button></a>
                    </div>
                    
                    <div id="add-certificate-form-container" class="hidden">
                        <h2>Create New Certificate</h2>
                        <form id="add-certificate-form" class="registration-form">
                            <label for="certificate-text">Certificate Text</label>
                            <input type="text" id="certificate-text" name="certificate-text" placeholder="Enter certificate text" required>
                    
                            <label for="certificate-date">Date</label>
                            <input type="date" id="certificate-date" name="certificate-date" required>
                    
                            <label for="certificate-customer-id">Customer ID</label>
                            <input type="text" id="certificate-customer-id" name="certificate-customer-id" placeholder="Enter customer ID" required>
                    
                            <button type="submit">Create Certificate</button>
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
                                    <!-- Dynamic rows will be added here -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="table-buttons">
                        <a href="" id="add-order-link"><button>Add Order</button></a>
                        <a href="" id="delete-order-link"><button>Delete Order</button></a>
                        <a href="#"><button>Search Order</button></a>
                    </div>
                    
                    <div id="add-order-form-container" class="hidden">
                        <h2>Add Order</h2>
                        <form id="add-order-form" class="registration-form">
                            <label for="store-name">Store Name</label>
                            <input type="text" id="store-name" name="store-name" placeholder="Enter store name" required>
                    
                            <label for="completion-status">Completion Status</label>
                            <input type="checkbox" id="completion-status" name="completion-status">
                    
                            <label for="project-number">Project Number</label>
                            <input type="text" id="project-number" name="project-number" placeholder="Enter project number" required>
                    
                            <button type="submit">Create Order</button>
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
                                    <!-- Dynamic rows will be added here -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="table-buttons">
                        <a href="#" id="add-contract-link"><button>Add Contract</button></a>
                        <a href="#" id="delete-contract-link"><button>Delete Contract</button></a>
                        <a href="#"><button>Search Contract</button></a>
                        <a href="#"><button>Edit Contract</button></a>
                    </div>
                    
                    <div id="add-contract-form-container" class="hidden">
                        <h2>Add Contract</h2>
                        <form id="add-contract-form" class="registration-form">
                            <label for="contract-text">Contract Text</label>
                            <textarea id="contract-text" name="contract-text" placeholder="Enter contract text" required></textarea>
                    
                            <label for="employee-id">Employee ID</label>
                            <input type="text" id="employee-id" name="employee-id" placeholder="Enter employee ID" required>
                    
                            <label for="customer-id">Customer ID</label>
                            <input type="text" id="customer-id" name="customer-id" placeholder="Enter customer ID" required>
                    
                            <button type="submit">Create Contract</button>
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
                                    <!-- Dynamic rows will be added here -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="table-buttons">
                        <a href="#"><button>Add Material</button></a>
                        <a href="#" id="delete-material-link"><button>Delete Material</button></a>
                        <a href="#"><button>Search Material</button></a>
                    </div>
                   
                `;
                mainContent.appendChild(newDiv);

                // Fetch project data from the backend
                fetch('/api/projects')
                    .then(response => response.json())
                    .then(data => {
                        const tableBody = document.getElementById('project-table-body');
                        tableBody.innerHTML = ''; // Clear any existing rows
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

                // Fetch order data from the backend
                fetch('/api/orders')
                    .then(response => response.json())
                    .then(data => {
                        const tableBody = document.getElementById('order-table-body');
                        tableBody.innerHTML = ''; // Clear any existing rows
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

                // Fetch certificate data from the backend
                fetch('/api/certificates')
                    .then(response => response.json())
                    .then(data => {
                        const tableBody = document.getElementById('certificate-table-body');
                        tableBody.innerHTML = ''; // Clear any existing rows
                        data.certificates.forEach(certificate => {
                            const row = document.createElement('tr');
                            row.innerHTML = `
                                <td>${certificate.certificate_num}</td>
                                <td>${certificate.certificate_text}</td>
                                <td>${certificate.date}</td>
                                <td>${certificate.customer_id}</td>
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
                        tableBody.innerHTML = ''; // Clear any existing rows
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
                        tableBody.innerHTML = ''; // Clear any existing rows
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
                    formContainer.classList.toggle("hidden"); // Toggle visibility of the form
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

                    // Validate inputs
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

                    // Send data to the backend
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
                                location.reload(); // Reload the page to refresh the list
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

                // Show the Add Certificate form when the button is clicked
                addCertificateButton.addEventListener("click", (event) => {
                    event.preventDefault(); // Prevent default link behavior
                    certificateFormContainer.classList.toggle("hidden"); // Toggle visibility of the form
                });

                // Handle Add Certificate form submission
                document.getElementById("add-certificate-form").addEventListener("submit", (e) => {
                    e.preventDefault(); // Prevent default form submission

                    // Collect the form data
                    const newCertificateData = {
                        certificate_text: document.getElementById("certificate-text").value.trim(),
                        date: document.getElementById("certificate-date").value.trim(),
                        customer_id: document.getElementById("certificate-customer-id").value.trim(),
                    };

                    // Validate inputs
                    if (!newCertificateData.certificate_text) {
                        alert("Certificate Text is required.");
                        return;
                    }
                    if (!newCertificateData.date) {
                        alert("Date is required.");
                        return;
                    }
                    if (!newCertificateData.customer_id) {
                        alert("Customer ID is required.");
                        return;
                    }

                    // Send the data to the backend
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
                                location.reload(); // Reload the page to refresh the certificate list
                            } else {
                                alert(data.error || "An error occurred while creating the certificate.");
                            }
                        })
                        .catch((error) => {
                            console.error("Error creating certificate:", error);
                            alert("An unexpected error occurred. Please try again.");
                        });
                });



                //Handle edit project button
                document.getElementById("edit-project-link").addEventListener("click", (event) => {
                    event.preventDefault(); // Prevent default anchor behavior
                    const formContainer = document.getElementById("edit-project-form-container");

                    // Toggle visibility of the form
                    formContainer.classList.toggle("hidden");

                    // Prompt the user for the project number
                    const projectNum = prompt("Enter the Project Number to edit:");

                    if (!projectNum) {
                        alert("Project Number is required.");
                        formContainer.classList.add("hidden");
                        return;
                    }

                    // Fetch project details to prefill the form
                    fetch(`/api/projects/${projectNum}`)
                        .then((response) => {
                            if (!response.ok) {
                                throw new Error("Project not found or an error occurred.");
                            }
                            return response.json();
                        })
                        .then((projectData) => {
                            // Populate the form fields with project data
                            document.getElementById("edit-estimate-length").value = projectData.estimate_length;
                            document.getElementById("edit-start-time").value = new Date(projectData.start_time)
                                .toISOString()
                                .slice(0, 16); // Convert to "YYYY-MM-DDTHH:mm" format
                            document.getElementById("edit-address").value = projectData.address;
                        })
                        .catch((error) => {
                            alert(error.message || "An error occurred while fetching the project data.");
                            console.error("Error fetching project data:", error);
                            formContainer.classList.add("hidden");
                        });
                });

                // Handle form submission for updating a project
                document.getElementById("edit-project-form").addEventListener("submit", (e) => {
                    e.preventDefault();

                    // Get the updated data from the form
                    const updatedProjectData = {
                        estimate_length: document.getElementById("edit-estimate-length").value.trim(),
                        start_time: document.getElementById("edit-start-time").value.trim(),
                        address: document.getElementById("edit-address").value.trim(),
                    };

                    // Validate the inputs
                    if (!updatedProjectData.estimate_length || !updatedProjectData.start_time || !updatedProjectData.address) {
                        alert("All fields are required.");
                        return;
                    }

                    // Submit the updated project data to the backend
                    const projectNum = prompt("Confirm the Project Number for this update:");
                    if (!projectNum) {
                        alert("Project Number is required for update.");
                        return;
                    }

                    fetch(`/api/projects/update/${projectNum}`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(updatedProjectData),
                    })
                        .then((response) => response.json())
                        .then((data) => {
                            if (data.success) {
                                alert("Project updated successfully!");
                                location.reload(); // Reload the page to reflect the changes
                            } else {
                                alert(data.error || "An error occurred while updating the project.");
                            }
                        })
                        .catch((error) => {
                            console.error("Error updating project:", error);
                            alert("An unexpected error occurred. Please try again.");
                        });
                });


                //Handle add order button
                const addOrderButton = document.getElementById("add-order-link");
                const addOrderFormContainer = document.getElementById("add-order-form-container");

                // Show or hide the Add Order form when the button is clicked
                addOrderButton.addEventListener("click", (event) => {
                    event.preventDefault(); // Prevent default link behavior
                    addOrderFormContainer.classList.toggle("hidden"); // Toggle visibility of the form
                });

                // Handle Add Order form submission
                document.getElementById("add-order-form").addEventListener("submit", (e) => {
                    e.preventDefault(); // Prevent default form submission

                    // Collect the form data
                    const newOrderData = {
                        store_name: document.getElementById("store-name").value.trim(),
                        completion_stat: document.getElementById("completion-status").checked ? 1 : 0, // Convert checkbox to 1/0
                        project_num: parseInt(document.getElementById("project-number").value.trim(), 10), // Ensure project_num is an integer
                    };

                    // Validate inputs
                    if (!newOrderData.store_name || isNaN(newOrderData.project_num)) {
                        alert("Store Name and valid Project Number are required.");
                        return;
                    }

                    // Send data to the backend
                    fetch("/api/orders/create", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(newOrderData),
                    })
                        .then((response) => response.json())
                        .then((data) => {
                            if (data.success) {
                                alert("Order created successfully.");
                                location.reload(); // Reload the page to refresh the list
                            } else {
                                alert(data.error || "An error occurred while creating the order.");
                            }
                        })
                        .catch((error) => {
                            console.error("Error creating order:", error);
                            alert("An unexpected error occurred. Please try again.");
                        });
                });

                //Handle add contract button
                const addContractButton = document.getElementById("add-contract-link");
                const addContractFormContainer = document.getElementById("add-contract-form-container");

                // Show or hide the Add Contract form when the button is clicked
                addContractButton.addEventListener("click", (event) => {
                    event.preventDefault(); // Prevent default link behavior
                    addContractFormContainer.classList.toggle("hidden"); // Toggle visibility of the form
                });

                // Handle Add Contract form submission
                document.getElementById("add-contract-form").addEventListener("submit", (e) => {
                    e.preventDefault(); // Prevent default form submission

                    // Collect the form data
                    const newContractData = {
                        contract_text: document.getElementById("contract-text").value.trim(),
                        employee_id: document.getElementById("employee-id").value.trim(),
                        customer_id: document.getElementById("customer-id").value.trim(),
                    };

                    // Validate inputs
                    if (!newContractData.contract_text || !newContractData.employee_id || !newContractData.customer_id) {
                        alert("All fields are required.");
                        return;
                    }

                    // Send data to the backend
                    fetch("/api/contracts/create", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(newContractData),
                    })
                        .then((response) => response.json())
                        .then((data) => {
                            if (data.success) {
                                alert("Contract created successfully.");
                                location.reload(); // Reload the page to refresh the list
                            } else {
                                alert(data.error || "An error occurred while creating the contract.");
                            }
                        })
                        .catch((error) => {
                            console.error("Error creating contract:", error);
                            alert("An unexpected error occurred. Please try again.");
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
                // Populate the Profile table with employee data
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
                tableBody.innerHTML = rows; // Add rows to the table body
            })
            .catch((error) => console.error("Error fetching employee data:", error));
    };

    // Load the profile by default on page load
    loadProfile();

    //Edit profile button
    document.getElementById('edit-profile-btn').addEventListener('click', function () {
        const formContainer = document.getElementById('edit-profile-form-container');

        // Toggle visibility of the form
        formContainer.classList.toggle('hidden');

        // Fetch current profile data
        fetch('/api/employees/current')
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                    return;
                }

                // Populate form fields with current profile data
                document.getElementById('fname').value = data.FNAME;
                document.getElementById('lname').value = data.LNAME;
                document.getElementById('username').value = data.USERNAME;
                document.getElementById('password').value = ""; // Password shouldn't be prefilled for security reasons
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

        // Validate fields (optional)
        let isValid = true;

        if (isValid) {
            // Submit updated profile data
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
                        location.reload(); // Reload the page to reflect changes
                    } else {
                        alert(data.error || 'An error occurred.');
                    }
                })
                .catch(error => console.error('Error updating profile:', error));
        }
    });
});