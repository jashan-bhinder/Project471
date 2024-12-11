
from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify, send_file
import sqlite3
import uuid  # For generating unique IDs
import io
from flask_cors import CORS


app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
app.secret_key = 'your_secret_key'  # Needed for flashing messages

# Database connection helper
def get_db_connection():
    conn = sqlite3.connect('CustomerDB.db')
    conn.row_factory = sqlite3.Row  # Access rows like dictionaries
    return conn


# Home route
@app.route('/')
def home():
    return render_template('HomePage.html')

# Customer login page
@app.route('/customer_login', methods=['GET', 'POST'])
def customer_login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        # Check username and password in the database
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM CUSTOMER WHERE USERNAME = ? AND PASSWORD = ?", (username, password))
        customer = cursor.fetchone()
        conn.close()

        if customer:
            # Redirect to the customer dashboard if credentials are correct
            return redirect(url_for('customer_main', customer_id=customer['CUSTOMER_ID']))
        else:
            # Show an error if login fails
            flash("Invalid username or password.", 'error')
            return render_template('CustomerLogin.html')

    return render_template('CustomerLogin.html')

# Customer dashboard page
@app.route('/customer_main/<customer_id>')
def customer_main(customer_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Fetch customer details using customer_id
    cursor.execute("SELECT * FROM CUSTOMER WHERE CUSTOMER_ID = ?", (customer_id,))
    customer = cursor.fetchone()
    conn.close()

    if customer:
        # Convert SQLite Row object to a dictionary
        customer_dict = dict(customer)

        # Pass the actual password for the form and a masked password for the profile display
        customer_dict['MASKED_PASSWORD'] = '*' * len(customer_dict['PASSWORD'])

        # Pass customer data to the template
        return render_template('CustomerMain.html', customer=customer_dict)
    else:
        flash("Customer not found.", 'error')
        return redirect(url_for('customer_login'))



@app.route('/customer_create', methods=['GET', 'POST'])
def customer_create():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        name = request.form['name']
        address = request.form['address']
        phone = request.form['phone']
        email = request.form['email']

        # Generate a unique CUSTOMER_ID
        customer_id = f"C{str(uuid.uuid4().int)[:8]}"  # Shorten UUID to 8 digits

        conn = get_db_connection()
        try:
            conn.execute(
                'INSERT INTO CUSTOMER (CUSTOMER_ID, USERNAME, PASSWORD, ADDRESS, PHONE_NUMBER, NAME, EMAIL) '
                'VALUES (?, ?, ?, ?, ?, ?, ?)',
                (customer_id, username, password, address, phone, name, email)
            )
            conn.commit()
            flash('Account created successfully. Please log in.', 'success')
            return redirect(url_for('customer_login'))
        except sqlite3.IntegrityError as e:
            if "USERNAME" in str(e):
                flash('Username is already taken.', 'error')
            elif "EMAIL" in str(e):
                flash('Email is already taken.', 'error')
            else:
                flash('An unexpected error occurred. Please try again.', 'error')
            return redirect(url_for('customer_create'))
        finally:
            conn.close()

    return render_template('CustomerCreate.html')


@app.route('/update_customer', methods=['POST'])
def update_customer():
    # Get form data
    customer_id = request.form['customer_id']
    name = request.form['name']
    username = request.form['username']
    password = request.form['password']
    address = request.form['address']
    phone = request.form['phone']
    email = request.form['email']

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Check for existing username or email (excluding current customer)
        cursor.execute("SELECT * FROM CUSTOMER WHERE USERNAME = ? AND CUSTOMER_ID != ?", (username, customer_id))
        if cursor.fetchone():
            flash('Username is already taken.', 'error')
            return render_template(
                'CustomerMain.html',
                customer={
                    'CUSTOMER_ID': customer_id,
                    'NAME': name,
                    'USERNAME': username,
                    'PASSWORD': password,
                    'ADDRESS': address,
                    'PHONE_NUMBER': phone,
                    'EMAIL': email,
                },
                show_settings=True  # Pass a flag to keep the profile settings section visible
            )

        cursor.execute("SELECT * FROM CUSTOMER WHERE EMAIL = ? AND CUSTOMER_ID != ?", (email, customer_id))
        if cursor.fetchone():
            flash('Email is already taken.', 'error')
            return render_template(
                'CustomerMain.html',
                customer={
                    'CUSTOMER_ID': customer_id,
                    'NAME': name,
                    'USERNAME': username,
                    'PASSWORD': password,
                    'ADDRESS': address,
                    'PHONE_NUMBER': phone,
                    'EMAIL': email,
                },
                show_settings=True  # Pass a flag to keep the profile settings section visible
            )

        # Update customer record
        cursor.execute("""
            UPDATE CUSTOMER SET NAME = ?, USERNAME = ?, PASSWORD = ?, ADDRESS = ?, PHONE_NUMBER = ?, EMAIL = ?
            WHERE CUSTOMER_ID = ?
        """, (name, username, password, address, phone, email, customer_id))
        conn.commit()
        flash('Profile updated successfully!', 'success')
    except sqlite3.IntegrityError as e:
        flash(f"An error occurred: {e}", 'error')
    finally:
        conn.close()

    return redirect(url_for('customer_main', customer_id=customer_id))

    conn = get_db_connection()
    cursor = conn.cursor()

    # Fetch customer details using customer_id
    cursor.execute("SELECT * FROM CUSTOMER WHERE CUSTOMER_ID = ?", (customer_id,))
    customer = cursor.fetchone()
    conn.close()

    if customer:
        customer_dict = dict(customer)
        customer_dict['MASKED_PASSWORD'] = '*' * len(customer_dict['PASSWORD'])

        return render_template('CustomerMain.html', customer=customer_dict, show_settings=False)  # Default to profile view
    else:
        flash("Customer not found.", 'error')
        return redirect(url_for('customer_login'))


@app.route('/fetch_estimates/<customer_id>', methods=['GET'])
def fetch_estimates(customer_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Fetch all estimates for the logged-in customer
    cursor.execute(
        "SELECT * FROM ESTIMATE WHERE CUSTOMER_ID = ?",
        (customer_id,)
    )
    all_estimates = cursor.fetchall()

    conn.close()

    # Convert results to dictionaries
    all_estimates = [dict(row) for row in all_estimates]

    # Return as JSON to the frontend
    return {"all_estimates": all_estimates}

@app.route('/fetch_recent_estimate/<customer_id>', methods=['GET'])
def fetch_recent_estimate(customer_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Fetch the most recently accepted estimate for the customer
    cursor.execute(
        """
        SELECT * FROM ESTIMATE
        WHERE CUSTOMER_ID = ? AND PENDING_STATUS = FALSE
        ORDER BY CREATION_DATE DESC
        LIMIT 1
        """,
        (customer_id,)
    )
    recent_estimate = cursor.fetchone()
    conn.close()

    # Return the recent estimate or an empty response if none exists
    if recent_estimate:
        return {"recent_estimate": dict(recent_estimate)}
    else:
        return {"recent_estimate": None}

@app.route('/request_estimate', methods=['POST'])
def request_estimate():
    customer_id = request.form['customer_id']
    address = request.form['address']

    # Example logic for inserting a new estimate
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        estimate_num = uuid.uuid4().int % 100000  # Generate a random estimate number
        cursor.execute("""
            INSERT INTO ESTIMATE (ESTIMATE_NUM, ADDRESS, CUSTOMER_ID, PENDING_STATUS, REQUEST_DATE)
            VALUES (?, ?, ?, ?, DATE('now'))
        """, (estimate_num, address, customer_id, True))
        conn.commit()
        flash("Estimate requested successfully!", "success")
    except Exception as e:
        flash(f"An error occurred: {e}", "error")
    finally:
        conn.close()

    return redirect(url_for('customer_main', customer_id=customer_id))

@app.route('/search_estimate', methods=['POST'])
def search_estimate():
    customer_id = request.form['customer_id']
    estimate_number = request.form['estimate_number']

    print(f"Received search for Customer ID: {customer_id}, Estimate Number: {estimate_number}")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM ESTIMATE WHERE CUSTOMER_ID = ? AND ESTIMATE_NUM = ?",
        (customer_id, estimate_number)
    )
    estimate = cursor.fetchone()
    conn.close()

    if estimate:
        estimate_dict = dict(estimate)
        print(f"Found estimate: {estimate_dict}")
        return {"success": True, "estimate": estimate_dict}
    else:
        print("Estimate not found")
        return {"success": False, "message": "Estimate not found or does not belong to you."}, 404



# Fetch all projects for a customer
@app.route('/fetch_all_projects/<customer_id>', methods=['GET'])
def fetch_all_projects(customer_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Fetch all projects associated with the customer
    cursor.execute(
        """
        SELECT P.PROJECT_NUM, P.ADDRESS, P.START_TIME, P.ESTIMATE_LENGTH
        FROM PROJECT P
        JOIN SIGNS_CONTRACT SC ON P.PROJECT_NUM = SC.PROJECT_NUM
        WHERE SC.CUSTOMER_ID = ?
        """,
        (customer_id,)
    )
    all_projects = cursor.fetchall()
    conn.close()

    # Debug: Log the fetched projects
    print("Fetched Projects:", all_projects)

    # Convert results to dictionaries
    all_projects = [dict(row) for row in all_projects]

    return {"all_projects": all_projects}


@app.route('/search_project', methods=['POST'])
def search_project():
    project_number = request.form['project_number']
    customer_id = request.form['customer_id']

    conn = get_db_connection()
    cursor = conn.cursor()

    # Fetch project with contract and certificate details
    cursor.execute(
        """
        SELECT 
            P.PROJECT_NUM,
            P.ADDRESS,
            P.START_TIME AS START_DATE,
            P.ESTIMATE_LENGTH AS DURATION,
            SC.CONTRACT_NUM,
            C.CONTRACT_PDF,
            SC.DATE AS CONTRACT_DATE,
            SCC.CERTIFICATE_NUM,
            CC.CERTIFICATE_PDF,
            CC.DATE AS CERTIFICATE_DATE
        FROM PROJECT P
        LEFT JOIN SIGNS_CONTRACT SC ON P.PROJECT_NUM = SC.PROJECT_NUM
        LEFT JOIN CONTRACT C ON SC.CONTRACT_NUM = C.CONTRACT_NUM
        LEFT JOIN SIGNS_CERTIFICATE SCC ON P.PROJECT_NUM = SCC.PROJECT_NUM
        LEFT JOIN COMPLETION_CERTIFICATE CC ON SCC.CERTIFICATE_NUM = CC.CERTIFICATE_NUM
        WHERE P.PROJECT_NUM = ? AND 
              (SC.CUSTOMER_ID = ? OR SCC.CUSTOMER_ID = ?)
        """,
        (project_number, customer_id, customer_id)
    )

    project = cursor.fetchone()
    conn.close()

    if project:
        project_dict = dict(project)
        return {"success": True, "project": project_dict}
    else:
        return {"success": False, "message": "Project not found or does not belong to you."}



@app.route('/employee_main/<employee_id>')
def employee_main(employee_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Fetch employee details using employee_id
    cursor.execute("SELECT * FROM EMPLOYEE WHERE EMPLOYEE_ID = ?", (employee_id,))
    employee = cursor.fetchone()
    conn.close()

    if employee:
        # Convert SQLite Row object to a dictionary
        employee_dict = dict(employee)

        # Mask the password for display
        employee_dict['MASKED_PASSWORD'] = '*' * len(employee_dict['PASSWORD'])

        # Pass employee data to the template
        return render_template('EmployeeMain.html', employee=employee_dict)
    else:
        flash("Employee not found.", 'error')
        return redirect(url_for('employee_login'))


@app.route('/employee_dashboard/<employee_id>')
def employee_dashboard(employee_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Fetch employee details
    cursor.execute("SELECT * FROM EMPLOYEE WHERE EMPLOYEE_ID = ?", (employee_id,))
    employee = cursor.fetchone()
    conn.close()

    if employee:
        employee_dict = dict(employee)
        # Add MASKED_PASSWORD for display purposes
        employee_dict['MASKED_PASSWORD'] = '*' * len(employee_dict['PASSWORD'])
        return render_template('EmployeeMain.html', employee=employee_dict)
    else:
        flash("Employee not found.", 'error')
        return redirect(url_for('employee_login'))



@app.route('/update_employee', methods=['POST'])
def update_employee():
    # Get form data
    employee_id = request.form['employee_id']
    fname = request.form['fname']
    lname = request.form['lname']
    username = request.form['username']
    password = request.form['password']
    phone = request.form['phone']
    email = request.form['email']

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Check for existing username or email (excluding the current employee)
        cursor.execute("SELECT * FROM EMPLOYEE WHERE USERNAME = ? AND EMPLOYEE_ID != ?", (username, employee_id))
        if cursor.fetchone():
            flash('Username is already taken.', 'error')
            return redirect(url_for('employee_main', employee_id=employee_id))

        cursor.execute("SELECT * FROM EMPLOYEE WHERE EMAIL = ? AND EMPLOYEE_ID != ?", (email, employee_id))
        if cursor.fetchone():
            flash('Email is already taken.', 'error')
            return redirect(url_for('employee_main', employee_id=employee_id))

        # Update employee record
        cursor.execute("""
            UPDATE EMPLOYEE
            SET FNAME = ?, LNAME = ?, USERNAME = ?, PASSWORD = ?, PHONE_NUMBER = ?, EMAIL = ?
            WHERE EMPLOYEE_ID = ?
        """, (fname, lname, username, password, phone, email, employee_id))
        conn.commit()

        flash('Profile updated successfully!', 'success')
    except sqlite3.IntegrityError as e:
        flash(f"An error occurred: {e}", 'error')
    finally:
        conn.close()

    return redirect(url_for('employee_main', employee_id=employee_id))




@app.route('/employee_login', methods=['GET', 'POST'])
def employee_login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM EMPLOYEE WHERE USERNAME = ? AND PASSWORD = ?",
            (username, password)
        )
        employee = cursor.fetchone()
        conn.close()

        if employee:
            employee_dict = dict(employee)
            employee_dict['MASKED_PASSWORD'] = '*' * len(employee_dict['PASSWORD'])  # Mask the password

            if employee['IS_OWNER']:
                return render_template('OwnerMain.html', employee=employee_dict)
            elif employee['IS_WORKER']:
                return render_template('EmployeeMain.html', employee=employee_dict)
        else:
            flash("Invalid username or password.", 'error')
            return render_template('EmployeeLogin.html')

    return render_template('EmployeeLogin.html')



@app.route('/fetch_filtered_assigned_projects/<employee_id>', methods=['GET'])
def fetch_filtered_assigned_projects(employee_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Query to fetch assigned projects excluding completed ones
    cursor.execute("""
        SELECT P.PROJECT_NUM, P.ADDRESS, P.START_TIME, P.ESTIMATE_LENGTH
        FROM WORKS_ON WO
        JOIN PROJECT P ON WO.PROJECT_NUM = P.PROJECT_NUM
        WHERE WO.EMPLOYEE_ID = ?
          AND P.PROJECT_NUM NOT IN (
              SELECT PROJECT_NUM FROM SIGNS_CERTIFICATE
          )
    """, (employee_id,))
    assigned_projects = cursor.fetchall()
    conn.close()

    # Convert results to a list of dictionaries
    assigned_projects = [
        {
            "PROJECT_NUM": row[0],
            "ADDRESS": row[1],
            "START_TIME": row[2],
            "ESTIMATE_LENGTH": str(row[3])  # Ensure time is string formatted
        }
        for row in assigned_projects
    ]

    return {"assigned_projects": assigned_projects}

@app.route('/fetch_all_projects_history/<employee_id>', methods=['GET'])
def fetch_all_projects_history(employee_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Query to fetch all projects for the employee
    cursor.execute("""
        SELECT P.PROJECT_NUM, P.START_TIME,
               CASE WHEN P.PROJECT_NUM IN (
                   SELECT PROJECT_NUM FROM SIGNS_CERTIFICATE
               ) THEN 'Completed' ELSE 'Incomplete' END AS COMPLETION_STATUS
        FROM WORKS_ON WO
        JOIN PROJECT P ON WO.PROJECT_NUM = P.PROJECT_NUM
        WHERE WO.EMPLOYEE_ID = ?
    """, (employee_id,))
    all_projects = cursor.fetchall()
    conn.close()

    # Convert results to a list of dictionaries
    all_projects = [
        {
            "PROJECT_NUM": row[0],
            "START_TIME": row[1],
            "COMPLETION_STATUS": row[2]
        }
        for row in all_projects
    ]

    return {"all_projects": all_projects}



@app.route('/search_project_employee/<string:employee_id>', methods=['POST'])
def search_project_employee(employee_id):
    project_number = request.form['project_number']

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Validate if the employee works on the project
        cursor.execute("""
            SELECT P.PROJECT_NUM, P.ADDRESS, P.START_TIME, P.ESTIMATE_LENGTH
            FROM WORKS_ON WO
            JOIN PROJECT P ON WO.PROJECT_NUM = P.PROJECT_NUM
            WHERE WO.EMPLOYEE_ID = ? AND P.PROJECT_NUM = ?
        """, (employee_id, project_number))
        project = cursor.fetchone()

        if not project:
            return {"success": False, "message": "You are not assigned to this project or it does not exist."}

        # Fetch orders associated with the project
        cursor.execute("""
            SELECT O.ORDER_NUM, O.STORE_NAME, O.COMPLETION_STAT
            FROM ORDERS O
            WHERE O.PROJECT_NUM = ?
        """, (project_number,))
        orders = cursor.fetchall()

        # Format the project details
        project_data = {
            "PROJECT_NUM": project[0],
            "ADDRESS": project[1],
            "START_TIME": project[2],
            "ESTIMATE_LENGTH": str(project[3]),  # Ensure time is string formatted
        }

        # Format the orders
        order_data = [
            {
                "ORDER_NUM": order[0],
                "STORE_NAME": order[1],
                "COMPLETION_STAT": "Completed" if order[2] else "Incomplete",
            }
            for order in orders
        ]

        return {"success": True, "project": project_data, "orders": order_data}

    except Exception as e:
        print(f"Error: {e}")
        return {"success": False, "message": "An error occurred while fetching project details."}
    finally:
        conn.close()

@app.route('/confirm_order/<project_number>', methods=['POST'])
def confirm_order(project_number):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Update the COMPLETION_STAT of the orders for the project
        cursor.execute("""
            UPDATE ORDERS
            SET COMPLETION_STAT = 1
            WHERE PROJECT_NUM = ?
        """, (project_number,))
        conn.commit()

        return {"success": True, "message": "Order status updated successfully."}
    except Exception as e:
        print(f"Error: {e}")
        return {"success": False, "message": "Failed to update order status."}
    finally:
        conn.close()
@app.route('/confirm_specific_order', methods=['POST'])
def confirm_specific_order():
    project_number = request.form['project_number']
    order_number = request.form['order_number']

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Validate if the order belongs to the project
        cursor.execute("""
            SELECT 1
            FROM ORDERS
            WHERE PROJECT_NUM = ? AND ORDER_NUM = ?
        """, (project_number, order_number))
        order = cursor.fetchone()

        if not order:
            return {"success": False, "message": "The specified order does not belong to this project."}

        # Update the COMPLETION_STAT of the order
        cursor.execute("""
            UPDATE ORDERS
            SET COMPLETION_STAT = 1
            WHERE ORDER_NUM = ?
        """, (order_number,))
        conn.commit()

        return {"success": True, "message": "Order status updated successfully."}
    except Exception as e:
        print(f"Error: {e}")
        return {"success": False, "message": "Failed to update order status."}
    finally:
        conn.close()



@app.route('/emp_delete_employee', methods=['POST'])
def emp_delete_employee():
    employee_id = request.form.get('employee_id')

    if not employee_id:
        flash('Invalid employee ID.', 'error')
        return redirect(url_for('employee_main', employee_id=employee_id))

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("DELETE FROM EMPLOYEE WHERE EMPLOYEE_ID = ?", (employee_id,))
        conn.commit()

        if cursor.rowcount == 0:
            flash('Employee not found.', 'error')
        else:
            flash('Account successfully deleted.', 'success')

        conn.close()
        return redirect(url_for('home'))  # Redirect to home after deletion
    except Exception as e:
        conn.close()
        flash(f"An error occurred: {e}", 'error')
        return redirect(url_for('employee_main', employee_id=employee_id))

@app.route('/cust_delete_customer', methods=['POST'])
def cust_delete_customer():
    customer_id = request.form.get('customer_id')

    if not customer_id:
        flash('Invalid customer ID.', 'error')
        return redirect(url_for('customer_main', customer_id=customer_id))

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("DELETE FROM CUSTOMER WHERE CUSTOMER_ID = ?", (customer_id,))
        conn.commit()

        if cursor.rowcount == 0:
            flash('Customer not found.', 'error')
        else:
            flash('Account successfully deleted.', 'success')

        conn.close()
        return redirect(url_for('home'))  # Redirect to home after deletion
    except Exception as e:
        conn.close()
        flash(f"An error occurred: {e}", 'error')
        return redirect(url_for('customer_main', customer_id=customer_id))



















# Function to get all employees to store in manager's employee list
@app.route('/api/employees', methods=['GET'])
def owner_get_employees():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Fetch all employees
    cursor.execute("SELECT EMPLOYEE_ID, FNAME, LNAME, PHONE_NUMBER, EMAIL, START_DATE FROM EMPLOYEE")
    employees = cursor.fetchall()
    conn.close()

    # Convert rows to JSON-compatible dictionaries
    employee_list = [
        {
            'id': row['EMPLOYEE_ID'],
            'first_name': row['FNAME'],
            'last_name': row['LNAME'],
            'phone': row['PHONE_NUMBER'],
            'email': row['EMAIL'],
            'start_date': row['START_DATE']
        }
        for row in employees
    ]

    return {'employees': employee_list}


@app.route('/api/employees/current', methods=['GET'])
def owner_get_current_employee():
    # Fetch the username from the session
    current_username = session.get('username')  # Retrieve the logged-in username

    if not current_username:
        return {"error": "No logged-in employee"}, 401

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT EMPLOYEE_ID, FNAME, LNAME, PHONE_NUMBER, EMAIL, START_DATE, USERNAME "
        "FROM EMPLOYEE WHERE USERNAME = ?",
        (current_username,)
    )
    employee = cursor.fetchone()
    conn.close()

    if employee:
        # Convert row to a dictionary and return as JSON
        return {
            "EMPLOYEE_ID": employee["EMPLOYEE_ID"],
            "FNAME": employee["FNAME"],
            "LNAME": employee["LNAME"],
            "PHONE_NUMBER": employee["PHONE_NUMBER"],
            "EMAIL": employee["EMAIL"],
            "START_DATE": employee["START_DATE"],
            "USERNAME": employee["USERNAME"],  # Include the USERNAME field
        }
    else:
        return {"error": "Employee not found"}, 404



    # Convert rows to JSON-compatible dictionaries
    estimate_list = []
    for row in estimates:
        estimate = {
            'estimate_num': row['ESTIMATE_NUM'],
            'address': row['ADDRESS'],
            'project_cost': row['PROJECT_COST'],
            'gst': row['GST'],
            'total': row['TOTAL'],
            'employee_id': row['EMPLOYEE_ID'],
            'customer_id': row['CUSTOMER_ID'],
        }

        # Handle the PDF field (convert binary to Base64 or skip if None)
        if row['ESTIMATE_PDF']:
            estimate['estimate_pdf'] = row['ESTIMATE_PDF'].hex()  # Convert to a hex string
        else:
            estimate['estimate_pdf'] = None

        estimate_list.append(estimate)

    return jsonify({'estimates': estimate_list})

# Update functions for Owner to update employee
@app.route('/api/employees/update', methods=['POST'])
def Owner_update_employee():
    data = request.get_json()  # Parse the JSON payload
    if not data:
        return {'error': 'Invalid JSON payload'}, 400

    username = data.get('username', '').strip()
    fname = data.get('fname', '').strip()
    lname = data.get('lname', '').strip()
    password = data.get('password', '').strip()
    phone = data.get('phone', '').strip()
    email = data.get('email', '').strip()

    # Fetch the logged-in username from the session
    current_username = session.get('username')

    if not current_username:
        return {'error': 'No logged-in employee'}, 401

    # Validation checks
    if len(username) < 7:
        return {'error': 'Username must be at least 7 characters long'}, 400
    if len(password) < 10:
        return {'error': 'Password must be at least 10 characters long'}, 400
    if not phone.isdigit() or len(phone) != 10:
        return {'error': 'Phone number must be exactly 10 digits'}, 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            UPDATE EMPLOYEE
            SET FNAME = ?, LNAME = ?, USERNAME = ?, PASSWORD = ?, PHONE_NUMBER = ?, EMAIL = ?
            WHERE USERNAME = ?
            """,
            (fname, lname, username, password, phone, email, current_username)
        )
        conn.commit()
        return {'success': True}
    except sqlite3.IntegrityError as e:
        if "USERNAME" in str(e):
            return {'error': 'Username is already taken'}, 400
        elif "EMAIL" in str(e):
            return {'error': 'Email is already taken'}, 400
        return {'error': 'An unexpected error occurred'}, 500
    finally:
        conn.close()

# function to get all projects
@app.route('/api/projects', methods=['GET'])
def owner_get_projects():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Fetch all projects
    cursor.execute("""
        SELECT PROJECT_NUM, ESTIMATE_LENGTH, START_TIME, ADDRESS
        FROM PROJECT
    """)
    projects = cursor.fetchall()
    conn.close()

    # Convert rows to JSON-compatible dictionaries
    project_list = [
        {
            'project_num': row['PROJECT_NUM'],
            'estimate_length': row['ESTIMATE_LENGTH'],
            'start_time': row['START_TIME'],
            'address': row['ADDRESS'],
        }
        for row in projects
    ]
    return {'projects': project_list}

# fetch all orders function
@app.route('/api/orders', methods=['GET'])
def Owner_get_orders():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Fetch all orders
    cursor.execute("""
        SELECT ORDER_NUM, STORE_NAME, COMPLETION_STAT, PROJECT_NUM
        FROM "ORDER"
    """)
    orders = cursor.fetchall()
    conn.close()

    # Convert rows to JSON-compatible dictionaries
    order_list = [
        {
            'order_num': row['ORDER_NUM'],
            'store_name': row['STORE_NAME'],
            'completion_stat': bool(row['COMPLETION_STAT']),
            'project_num': row['PROJECT_NUM']
        }
        for row in orders
    ]

    return {'orders': order_list}

# fetch all certificates function
@app.route('/api/certificates', methods=['GET'])
def Owner_get_certificates():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Fetch all completion certificates
    cursor.execute("""
        SELECT CERTIFICATE_NUM, CERTIFICATE_TEXT, DATE, CUSTOMER_ID
        FROM COMPLETION_CERTIFICATE
    """)
    certificates = cursor.fetchall()
    conn.close()

    # Convert rows to JSON-compatible dictionaries
    certificate_list = [
        {
            'certificate_num': row['CERTIFICATE_NUM'],
            'certificate_text': row['CERTIFICATE_TEXT'],
            'date': row['DATE'],
            'customer_id': row['CUSTOMER_ID']
        }
        for row in certificates
    ]

    return {'certificates': certificate_list}

# fetch all contracts function
@app.route('/api/contracts', methods=['GET'])
def Owner_get_contracts():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Fetch all contracts
    cursor.execute("""
        SELECT CONTRACT_NUM, EMPLOYEE_ID, CUSTOMER_ID, CONTRACT_TEXT
        FROM CONTRACT
    """)
    contracts = cursor.fetchall()
    conn.close()

    # Convert rows to JSON-compatible dictionaries
    contract_list = [
        {
            'contract_num': row['CONTRACT_NUM'],
            'employee_id': row['EMPLOYEE_ID'],
            'customer_id': row['CUSTOMER_ID'],
            'contract_text': row['CONTRACT_TEXT']
        }
        for row in contracts
    ]

    return {'contracts': contract_list}

# Fetch all materials function
@app.route('/api/materials', methods=['GET'])
def Owner_get_materials():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Fetch all materials
        cursor.execute("""
            SELECT MATERIAL_ID, NAME, TYPE, COST, AMOUNT, ORDER_NUM
            FROM MATERIALS
        """)
        materials = cursor.fetchall()

        # Convert rows to JSON-compatible dictionaries
        materials_list = [
            {
                'material_id': row['MATERIAL_ID'],
                'name': row['NAME'],
                'type': row['TYPE'],
                'cost': row['COST'],
                'amount': row['AMOUNT'],
                'order_num': row['ORDER_NUM']
            }
            for row in materials
        ]

        return {'materials': materials_list}
    except sqlite3.Error as e:
        return {'error': str(e)}, 500
    finally:
        conn.close()

# Delete button for employee
@app.route('/api/employees/delete/<employee_id>', methods=['DELETE'])
def Owner_delete_employee(employee_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Delete the employee with the given Employee_ID
        cursor.execute("DELETE FROM EMPLOYEE WHERE EMPLOYEE_ID = ?", (employee_id,))
        conn.commit()

        if cursor.rowcount == 0:
            return {'error': 'Employee not found'}, 404

        return {'success': True}
    except sqlite3.Error as e:
        return {'error': str(e)}, 500
    finally:
        conn.close()

# Delete button for estimates
@app.route('/api/estimates/delete/<estimate_num>', methods=['DELETE'])
def Owner_delete_estimate(estimate_num):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Check if the estimate exists
        cursor.execute("SELECT * FROM ESTIMATE WHERE ESTIMATE_NUM = ?", (estimate_num,))
        estimate = cursor.fetchone()

        if not estimate:
            return {'error': 'Estimate not found'}, 404

        # Delete the estimate
        cursor.execute("DELETE FROM ESTIMATE WHERE ESTIMATE_NUM = ?", (estimate_num,))
        conn.commit()

        return {'success': True}
    except sqlite3.Error as e:
        return {'error': str(e)}, 500
    finally:
        conn.close()


# DELETE functions for project section
@app.route('/api/projects/delete/<project_num>', methods=['DELETE'])
def Onwer_delete_project(project_num):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Check if the project exists
        cursor.execute("SELECT * FROM PROJECT WHERE PROJECT_NUM = ?", (project_num,))
        project = cursor.fetchone()

        if not project:
            return {'error': 'Project not found'}, 404

        # Delete the project
        cursor.execute("DELETE FROM PROJECT WHERE PROJECT_NUM = ?", (project_num,))
        conn.commit()

        return {'success': True}
    except sqlite3.Error as e:
        return {'error': str(e)}, 500
    finally:
        conn.close()

# Function for deleting certificate on owner side
@app.route('/api/certificates/delete/<certificate_num>', methods=['DELETE'])
def Owner_delete_certificate(certificate_num):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Check if the certificate exists
        cursor.execute("SELECT * FROM COMPLETION_CERTIFICATE WHERE CERTIFICATE_NUM = ?", (certificate_num,))
        certificate = cursor.fetchone()

        if not certificate:
            return {'error': 'Certificate not found'}, 404

        # Delete the certificate
        cursor.execute("DELETE FROM COMPLETION_CERTIFICATE WHERE CERTIFICATE_NUM = ?", (certificate_num,))
        conn.commit()

        return {'success': True}
    except sqlite3.Error as e:
        return {'error': str(e)}, 500
    finally:
        conn.close()

# function to delete order from owner side
@app.route('/api/orders/delete/<order_num>', methods=['DELETE'])
def Owner_delete_order(order_num):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Check if the order exists
        cursor.execute("SELECT * FROM ORDER WHERE ORDER_NUM = ?", (order_num,))
        order = cursor.fetchone()

        if not order:
            return {'error': 'Order not found'}, 404

        # Delete the order
        cursor.execute("DELETE FROM ORDER WHERE ORDER_NUM = ?", (order_num,))
        conn.commit()

        return {'success': True}
    except sqlite3.Error as e:
        return {'error': str(e)}, 500
    finally:
        conn.close()

#Funtion to delete contract from owner side
@app.route('/api/contracts/delete/<contract_num>', methods=['DELETE'])
def Owner_delete_contract(contract_num):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Check if the contract exists
        cursor.execute("SELECT * FROM CONTRACT WHERE CONTRACT_NUM = ?", (contract_num,))
        contract = cursor.fetchone()

        if not contract:
            return {'error': 'Contract not found'}, 404

        # Delete the contract
        cursor.execute("DELETE FROM CONTRACT WHERE CONTRACT_NUM = ?", (contract_num,))
        conn.commit()

        return {'success': True}
    except sqlite3.Error as e:
        return {'error': str(e)}, 500
    finally:
        conn.close()

# Function to delete material from owner side
@app.route('/api/materials/delete/<material_id>', methods=['DELETE'])
def Owner_delete_material(material_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Check if the material exists
        cursor.execute("SELECT * FROM MATERIALS WHERE MATERIAL_ID = ?", (material_id,))
        material = cursor.fetchone()

        if not material:
            return {'error': 'Material not found'}, 404

        # Delete the material
        cursor.execute("DELETE FROM MATERIALS WHERE MATERIAL_ID = ?", (material_id,))
        conn.commit()

        return {'success': True}
    except sqlite3.Error as e:
        return {'error': str(e)}, 500
    finally:
        conn.close()

# Creat employee function from owner side
@app.route('/api/employees/create', methods=['POST'])
def Owner_create_employee():
    data = request.get_json()
    if not data:
        return {'error': 'Invalid JSON payload'}, 400

    # Extract all fields from the request
    fname = data.get('fname', '').strip()
    lname = data.get('lname', '').strip()
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    phone = data.get('phone', '').strip()
    email = data.get('email', '').strip()
    start_date = data.get('start_date', '').strip()

    # Generate a unique EMPLOYEE_ID
    employee_id = f"E{str(uuid.uuid4().int)[:8]}"  # Short UUID-like ID (E + 8 digits)

    # Validation checks
    if len(username) < 7:
        return {'error': 'Username must be at least 7 characters long'}, 400
    if len(password) < 10:
        return {'error': 'Password must be at least 10 characters long'}, 400
    if not phone.isdigit() or len(phone) != 10:
        return {'error': 'Phone number must be exactly 10 digits'}, 400
    if not fname or not lname or not start_date:
        return {'error': 'First name, last name, and start date are required'}, 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Insert the new employee into the database
        cursor.execute(
            """
            INSERT INTO EMPLOYEE (EMPLOYEE_ID, FNAME, LNAME, USERNAME, PASSWORD, PHONE_NUMBER, EMAIL, START_DATE)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (employee_id, fname, lname, username, password, phone, email, start_date)
        )
        conn.commit()
        return {'success': True, 'employee_id': employee_id}
    except sqlite3.IntegrityError as e:
        if "USERNAME" in str(e):
            return {'error': 'Username is already taken'}, 400
        elif "EMAIL" in str(e):
            return {'error': 'Email is already taken'}, 400
        return {'error': f'Database error: {str(e)}'}, 500
    except Exception as e:
        return {'error': f'Unexpected error: {str(e)}'}, 500
    finally:
        conn.close()

# Create project function from ownser side
@app.route('/api/projects/create', methods=['POST'])
def Owner_create_project():
    data = request.get_json()
    if not data:
        return {'error': 'Invalid JSON payload'}, 400

    # Extract project details
    project_num = f"P{str(uuid.uuid4().int)[:8]}"  # Generate unique Project ID
    estimate_length = data.get('estimate_length', '').strip()
    start_time = data.get('start_time', '').strip()
    address = data.get('address', '').strip()

    # Validation checks
    if not estimate_length or not start_time or not address:
        return {'error': 'All fields are required (Estimate Length, Start Time, Address).'}, 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Insert the new project into the database
        cursor.execute(
            """
            INSERT INTO PROJECT (PROJECT_NUM, ESTIMATE_LENGTH, START_TIME, ADDRESS)
            VALUES (?, ?, ?, ?)
            """,
            (project_num, estimate_length, start_time, address)
        )
        conn.commit()
        return {'success': True, 'project_num': project_num}
    except sqlite3.IntegrityError as e:
        return {'error': f'Database error: {str(e)}'}, 500
    except Exception as e:
        return {'error': f'Unexpected error: {str(e)}'}, 500
    finally:
        conn.close()

# create certificate function
@app.route('/api/certificates/create', methods=['POST'])
def Owner_create_certificate():
    data = request.get_json()
    if not data:
        return {'error': 'Invalid JSON payload'}, 400

    # Extract certificate details
    certificate_text = data.get('certificate_text', '').strip()
    date = data.get('date', '').strip()
    customer_id = data.get('customer_id', '').strip()

    # Generate a unique Certificate ID
    certificate_num = f"CERT{str(uuid.uuid4().int)[:8]}"

    # Validation
    if not certificate_text or not date or not customer_id:
        return {'error': 'All fields are required (Certificate Text, Date, Customer ID).'}, 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Insert the new certificate into the database
        cursor.execute(
            """
            INSERT INTO COMPLETION_CERTIFICATE (CERTIFICATE_NUM, CERTIFICATE_TEXT, DATE, CUSTOMER_ID)
            VALUES (?, ?, ?, ?)
            """,
            (certificate_num, certificate_text, date, customer_id)
        )
        conn.commit()
        return {'success': True, 'certificate_num': certificate_num}
    except sqlite3.Error as e:
        return {'error': f'Database error: {str(e)}'}, 500
    finally:
        conn.close()

# Create order function
@app.route('/api/orders/create', methods=['POST'])
def Owner_create_order():
    try:
        # Get data from the request
        data = request.get_json()
        store_name = data.get("store_name")
        completion_stat = int(data.get("completion_stat", 0))  # Convert to integer (0 or 1)
        project_num = int(data.get("project_num"))  # Convert project_num to integer

        # Validate input
        if not store_name or not project_num:
            return jsonify({"error": "Store Name and Project Number are required."}), 400

        # Check if the project number exists in the PROJECT table
        conn = get_db_connection()
        project = conn.execute("SELECT * FROM PROJECT WHERE PROJECT_NUM = ?", (project_num,)).fetchone()
        if not project:
            return jsonify({"error": "Project Number does not exist."}), 404

        # Insert the new order into the ORDERS table
        conn.execute(
            "INSERT INTO ORDERS (STORE_NAME, COMPLETION_STAT, PROJECT_NUM) VALUES (?, ?, ?)",
            (store_name, completion_stat, project_num)
        )
        conn.commit()
        conn.close()

        return jsonify({"success": True, "message": "Order created successfully."}), 201

    except sqlite3.Error as e:
        return jsonify({"error": "Database error occurred.", "details": str(e)}), 500
    except Exception as e:
        return jsonify({"error": "An unexpected error occurred.", "details": str(e)}), 500

# Add contract Function
@app.route('/api/contracts/create', methods=['POST'])
def Owner_create_contract():
    try:
        # Get data from the request
        data = request.get_json()
        contract_text = data.get("contract_text")
        employee_id = data.get("employee_id")
        customer_id = data.get("customer_id")

        # Validate input
        if not contract_text or not employee_id or not customer_id:
            return jsonify({"error": "All fields are required."}), 400

        # Check if the employee ID exists
        conn = get_db_connection()
        employee = conn.execute("SELECT * FROM EMPLOYEE WHERE EMPLOYEE_ID = ?", (employee_id,)).fetchone()
        if not employee:
            return jsonify({"error": "Employee ID does not exist."}), 404

        # Check if the customer ID exists
        customer = conn.execute("SELECT * FROM CUSTOMER WHERE CUSTOMER_ID = ?", (customer_id,)).fetchone()
        if not customer:
            return jsonify({"error": "Customer ID does not exist."}), 404

        # Insert the new contract into the CONTRACT table
        conn.execute(
            "INSERT INTO CONTRACT (CONTRACT_TEXT, EMPLOYEE_ID, CUSTOMER_ID) VALUES (?, ?, ?)",
            (contract_text, employee_id, customer_id)
        )
        conn.commit()
        conn.close()

        return jsonify({"success": True, "message": "Contract created successfully."}), 201

    except sqlite3.Error as e:
        return jsonify({"error": "Database error occurred.", "details": str(e)}), 500
    except Exception as e:
        return jsonify({"error": "An unexpected error occurred.", "details": str(e)}), 500



# Search employee function
@app.route('/api/employees/<employee_id>', methods=['GET'])
def Owner_get_employee_by_id(employee_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT EMPLOYEE_ID, FNAME, LNAME, PHONE_NUMBER, EMAIL, START_DATE FROM EMPLOYEE WHERE EMPLOYEE_ID = ?",
        (employee_id,)
    )
    employee = cursor.fetchone()
    conn.close()

    if employee:
        return {
            'id': employee["EMPLOYEE_ID"],
            'first_name': employee["FNAME"],
            'last_name': employee["LNAME"],
            'phone': employee["PHONE_NUMBER"],
            'email': employee["EMAIL"],
            'start_date': employee["START_DATE"],
        }
    else:
        return {"error": "Employee not found"}, 404



# Function to fetch project details by project number
@app.route('/api/projects/<project_num>', methods=['GET'])
def Owner_get_project(project_num):
    project = db.session.execute(
        "SELECT * FROM PROJECT WHERE PROJECT_NUM = :project_num",
        {"project_num": project_num}
    ).fetchone()
    if project:
        return jsonify(dict(project)), 200
    else:
        return jsonify({"error": "Project not found"}), 404

# Function to update a project
@app.route('/api/projects/update/<project_num>', methods=['POST'])
def Owner_update_project(project_num):
    project = db.session.execute(
        "SELECT * FROM PROJECT WHERE PROJECT_NUM = :project_num",
        {"project_num": project_num}
    ).fetchone()
    if not project:
        return jsonify({"error": "Project not found"}), 404

    data = request.get_json()
    estimate_length = data.get("estimate_length")
    start_time = data.get("start_time")
    address = data.get("address")

    if not start_time or not address:
        return jsonify({"error": "Start time and address are required"}), 400

    try:
        start_time = datetime.strptime(start_time, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid start time format. Use YYYY-MM-DD"}), 400

    # Update the project in the database
    db.session.execute(
        """
        UPDATE PROJECT
        SET ESTIMATE_LENGTH = :estimate_length, START_TIME = :start_time, ADDRESS = :address
        WHERE PROJECT_NUM = :project_num
        """,
        {
            "estimate_length": estimate_length,
            "start_time": start_time,
            "address": address,
            "project_num": project_num
        }
    )
    db.session.commit()

    return jsonify({"success": True, "message": "Project updated successfully"}), 200

# get estimate function
@app.route('/api/estimates', methods=['GET'])
def Owner_get_all_estimates():
    try:
        # Connect to the database
        conn = get_db_connection()
        estimates = conn.execute(
            "SELECT * FROM ESTIMATE"
        ).fetchall()
        conn.close()

        if not estimates:
            return jsonify({"estimates": []}), 200  # Return empty list if no estimates found

        # Convert the SQLite rows to dictionaries
        estimate_list = [
            {
                "estimate_num": row["ESTIMATE_NUM"],
                "address": row["ADDRESS"],
                "project_cost": row["PROJECT_COST"],
                "estimate_text": None if row["ESTIMATE_PDF"] is None else "PDF Available",
                "gst": row["GST"],
                "total": row["TOTAL"],
                "employee_id": row["EMPLOYEE_ID"],
                "customer_id": row["CUSTOMER_ID"],
            }
            for row in estimates
        ]

        return jsonify({"estimates": estimate_list}), 200

    except sqlite3.Error as e:
        return jsonify({"error": "Database error occurred.", "details": str(e)}), 500
    except Exception as e:
        return jsonify({"error": "An unexpected error occurred.", "details": str(e)}), 500

#function to allow you to download pdf
@app.route('/api/estimates/download/<int:estimate_num>', methods=['GET'])
def Owner_download_estimate_pdf(estimate_num):
    try:
        # Connect to the database
        conn = get_db_connection()
        estimate = conn.execute(
            "SELECT ESTIMATE_PDF FROM ESTIMATE WHERE ESTIMATE_NUM = ?",
            (estimate_num,)
        ).fetchone()
        conn.close()

        if estimate and estimate["ESTIMATE_PDF"]:
            pdf_data = estimate["ESTIMATE_PDF"]
            return send_file(
                io.BytesIO(pdf_data),
                mimetype="application/pdf",
                as_attachment=True,
                download_name=f"Estimate_{estimate_num}.pdf",
            )
        else:
            return jsonify({"error": "PDF not found for this estimate"}), 404

    except sqlite3.Error as e:
        return jsonify({"error": "Database error occurred.", "details": str(e)}), 500
    except Exception as e:
        return jsonify({"error": "An unexpected error occurred.", "details": str(e)}), 500


# function to search estimate
@app.route('/api/estimates/<int:estimate_num>', methods=['GET'])
def Owner_et_estimate(estimate_num):
    try:
        # Connect to the database
        conn = get_db_connection()
        estimate = conn.execute(
            "SELECT * FROM ESTIMATE WHERE ESTIMATE_NUM = ?",
            (estimate_num,)
        ).fetchone()
        conn.close()

        if estimate:
            # Check if the PDF exists and generate the download URL if available
            pdf_url = f"/api/estimates/download/{estimate['ESTIMATE_NUM']}" if estimate["ESTIMATE_PDF"] else None

            estimate_dict = {
                "estimate_num": estimate["ESTIMATE_NUM"],
                "address": estimate["ADDRESS"],
                "project_cost": estimate["PROJECT_COST"],
                "gst": estimate["GST"],
                "total": estimate["TOTAL"],
                "employee_id": estimate["EMPLOYEE_ID"],
                "customer_id": estimate["CUSTOMER_ID"],
                "pdf_url": pdf_url,
            }
            return jsonify(estimate_dict), 200
        else:
            return jsonify({"error": "Estimate not found"}), 404

    except sqlite3.Error as e:
        return jsonify({"error": "Database error occurred.", "details": str(e)}), 500
    except Exception as e:
        return jsonify({"error": "An unexpected error occurred.", "details": str(e)}), 500



if __name__ == '__main__':
    app.run(debug=True)




