from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify, send_file
import sqlite3
import uuid
import io
import time
from flask_cors import CORS


app = Flask(__name__)
CORS(app)
app.secret_key = 'your_secret_key'


def get_db_connection():
    conn = sqlite3.connect('CustomerDB.db')
    conn.row_factory = sqlite3.Row
    return conn



@app.route('/')
def home():
    return render_template('HomePage.html')


@app.route('/customer_login', methods=['GET', 'POST'])
def customer_login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']


        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM CUSTOMER WHERE USERNAME = ? AND PASSWORD = ?", (username, password))
        customer = cursor.fetchone()
        conn.close()

        if customer:

            return redirect(url_for('customer_main', customer_id=customer['CUSTOMER_ID']))
        else:

            flash("Invalid username or password.", 'error')
            return render_template('CustomerLogin.html')

    return render_template('CustomerLogin.html')


@app.route('/customer_main/<customer_id>')
def customer_main(customer_id):
    conn = get_db_connection()
    cursor = conn.cursor()


    cursor.execute("SELECT * FROM CUSTOMER WHERE CUSTOMER_ID = ?", (customer_id,))
    customer = cursor.fetchone()
    conn.close()

    if customer:

        customer_dict = dict(customer)


        customer_dict['MASKED_PASSWORD'] = '*' * len(customer_dict['PASSWORD'])


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


        customer_id = f"C{str(uuid.uuid4().int)[:8]}"

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
                show_settings=True
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
                show_settings=True
            )


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


    cursor.execute("SELECT * FROM CUSTOMER WHERE CUSTOMER_ID = ?", (customer_id,))
    customer = cursor.fetchone()
    conn.close()

    if customer:
        customer_dict = dict(customer)
        customer_dict['MASKED_PASSWORD'] = '*' * len(customer_dict['PASSWORD'])

        return render_template('CustomerMain.html', customer=customer_dict, show_settings=False)
    else:
        flash("Customer not found.", 'error')
        return redirect(url_for('customer_login'))


@app.route('/fetch_estimates/<customer_id>', methods=['GET'])
def fetch_estimates(customer_id):
    conn = get_db_connection()
    cursor = conn.cursor()


    cursor.execute(
        "SELECT * FROM ESTIMATE WHERE CUSTOMER_ID = ?",
        (customer_id,)
    )
    all_estimates = cursor.fetchall()

    conn.close()


    all_estimates = [dict(row) for row in all_estimates]


    return {"all_estimates": all_estimates}

@app.route('/fetch_recent_estimate/<customer_id>', methods=['GET'])
def fetch_recent_estimate(customer_id):
    conn = get_db_connection()
    cursor = conn.cursor()


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


    if recent_estimate:
        return {"recent_estimate": dict(recent_estimate)}
    else:
        return {"recent_estimate": None}

@app.route('/request_estimate', methods=['POST'])
def request_estimate():
    customer_id = request.form['customer_id']
    address = request.form['address']


    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        estimate_num = uuid.uuid4().int % 100000
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




@app.route('/fetch_all_projects/<customer_id>', methods=['GET'])
def fetch_all_projects(customer_id):
    conn = get_db_connection()
    cursor = conn.cursor()


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


    print("Fetched Projects:", all_projects)


    all_projects = [dict(row) for row in all_projects]

    return {"all_projects": all_projects}


@app.route('/search_project', methods=['POST'])
def search_project():
    project_number = request.form['project_number']
    customer_id = request.form['customer_id']

    conn = get_db_connection()
    cursor = conn.cursor()


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
        project_dict = dict(zip([column[0] for column in cursor.description], project))
        return {"success": True, "project": project_dict}
    else:
        return {"success": False, "message": "Project not found or does not belong to you."}



@app.route('/employee_main/<employee_id>')
def employee_main(employee_id):
    conn = get_db_connection()
    cursor = conn.cursor()


    cursor.execute("SELECT * FROM EMPLOYEE WHERE EMPLOYEE_ID = ?", (employee_id,))
    employee = cursor.fetchone()
    conn.close()

    if employee:

        employee_dict = dict(employee)


        employee_dict['MASKED_PASSWORD'] = '*' * len(employee_dict['PASSWORD'])


        return render_template('EmployeeMain.html', employee=employee_dict)
    else:
        flash("Employee not found.", 'error')
        return redirect(url_for('employee_login'))


@app.route('/employee_dashboard/<employee_id>')
def employee_dashboard(employee_id):
    conn = get_db_connection()
    cursor = conn.cursor()


    cursor.execute("SELECT * FROM EMPLOYEE WHERE EMPLOYEE_ID = ?", (employee_id,))
    employee = cursor.fetchone()
    conn.close()

    if employee:
        employee_dict = dict(employee)

        employee_dict['MASKED_PASSWORD'] = '*' * len(employee_dict['PASSWORD'])
        return render_template('EmployeeMain.html', employee=employee_dict)
    else:
        flash("Employee not found.", 'error')
        return redirect(url_for('employee_login'))



@app.route('/update_employee', methods=['POST'])
def update_employee():

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

        cursor.execute("SELECT * FROM EMPLOYEE WHERE USERNAME = ? AND EMPLOYEE_ID != ?", (username, employee_id))
        if cursor.fetchone():
            flash('Username is already taken.', 'error')
            return redirect(url_for('employee_main', employee_id=employee_id))

        cursor.execute("SELECT * FROM EMPLOYEE WHERE EMAIL = ? AND EMPLOYEE_ID != ?", (email, employee_id))
        if cursor.fetchone():
            flash('Email is already taken.', 'error')
            return redirect(url_for('employee_main', employee_id=employee_id))


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

            session['username'] = employee['USERNAME']

            if employee['IS_OWNER']:
                return render_template('OwnerMain.html', employee=dict(employee))
            elif employee['IS_WORKER']:
                return render_template('EmployeeMain.html', employee=dict(employee))
        else:
            flash("Invalid username or password.", 'error')
            return render_template('EmployeeLogin.html')

    return render_template('EmployeeLogin.html')



@app.route('/fetch_filtered_assigned_projects/<employee_id>', methods=['GET'])
def fetch_filtered_assigned_projects(employee_id):
    conn = get_db_connection()
    cursor = conn.cursor()


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


    assigned_projects = [
        {
            "PROJECT_NUM": row[0],
            "ADDRESS": row[1],
            "START_TIME": row[2],
            "ESTIMATE_LENGTH": str(row[3])
        }
        for row in assigned_projects
    ]

    return {"assigned_projects": assigned_projects}

@app.route('/fetch_all_projects_history/<employee_id>', methods=['GET'])
def fetch_all_projects_history(employee_id):
    conn = get_db_connection()
    cursor = conn.cursor()


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

        cursor.execute("""
            SELECT P.PROJECT_NUM, P.ADDRESS, P.START_TIME, P.ESTIMATE_LENGTH
            FROM WORKS_ON WO
            JOIN PROJECT P ON WO.PROJECT_NUM = P.PROJECT_NUM
            WHERE WO.EMPLOYEE_ID = ? AND P.PROJECT_NUM = ?
        """, (employee_id, project_number))
        project = cursor.fetchone()

        if not project:
            return {"success": False, "message": "You are not assigned to this project or it does not exist."}


        cursor.execute("""
            SELECT O.ORDER_NUM, O.STORE_NAME, O.COMPLETION_STAT
            FROM ORDERS O
            WHERE O.PROJECT_NUM = ?
        """, (project_number,))
        orders = cursor.fetchall()


        project_data = {
            "PROJECT_NUM": project[0],
            "ADDRESS": project[1],
            "START_TIME": project[2],
            "ESTIMATE_LENGTH": str(project[3]),
        }


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

        cursor.execute("""
            SELECT 1
            FROM ORDERS
            WHERE PROJECT_NUM = ? AND ORDER_NUM = ?
        """, (project_number, order_number))
        order = cursor.fetchone()

        if not order:
            return {"success": False, "message": "The specified order does not belong to this project."}


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


@app.route('/add_material/<string:employee_id>', methods=['POST'])
def add_material(employee_id):
    data = request.get_json()

    name = data.get('name')
    material_type = data.get('type')
    cost = data.get('cost')
    amount = data.get('amount')
    order_num = data.get('order_num')

    conn = get_db_connection()
    cursor = conn.cursor()

    try:

        cursor.execute("""
            SELECT 1
            FROM WORKS_ON WO
            JOIN PROJECT P ON WO.PROJECT_NUM = P.PROJECT_NUM
            JOIN ORDERS O ON P.PROJECT_NUM = O.PROJECT_NUM
            WHERE WO.EMPLOYEE_ID = ? AND O.ORDER_NUM = ?
        """, (employee_id, order_num))
        authorized = cursor.fetchone()

        if not authorized:
            return jsonify({"success": False, "message": "You are not authorized to add materials to this order."})


        material_id = f"MAT-{int(time.time() * 1000)}"


        cursor.execute("""
            INSERT INTO MATERIALS (MATERIAL_ID, NAME, TYPE, COST, AMOUNT, ORDER_NUM)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (material_id, name, material_type, cost, amount, order_num))
        conn.commit()

        return jsonify({"success": True, "message": "Material added successfully."})
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"success": False, "message": "An error occurred while adding the material."})
    finally:
        conn.close()



@app.route('/view_materials/<string:employee_id>', methods=['POST'])
def view_materials(employee_id):
    data = request.get_json()
    order_num = data.get('order_num')

    conn = get_db_connection()
    cursor = conn.cursor()

    try:

        cursor.execute("""
            SELECT 1
            FROM WORKS_ON WO
            JOIN PROJECT P ON WO.PROJECT_NUM = P.PROJECT_NUM
            JOIN ORDERS O ON P.PROJECT_NUM = O.PROJECT_NUM
            WHERE WO.EMPLOYEE_ID = ? AND O.ORDER_NUM = ?
        """, (employee_id, order_num))
        authorized = cursor.fetchone()

        if not authorized:
            return jsonify({"success": False, "message": "You are not authorized to view materials for this order."})


        cursor.execute("""
            SELECT MATERIAL_ID, NAME, TYPE, COST, AMOUNT
            FROM MATERIALS
            WHERE ORDER_NUM = ?
        """, (order_num,))
        materials = cursor.fetchall()

        materials_data = [
            {
                "MATERIAL_ID": material[0],
                "NAME": material[1],
                "TYPE": material[2],
                "COST": material[3],
                "AMOUNT": material[4],
            }
            for material in materials
        ]

        return jsonify({"success": True, "materials": materials_data})

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"success": False, "message": "An error occurred while fetching materials."})
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
        return redirect(url_for('home'))
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
        return redirect(url_for('home'))
    except Exception as e:
        conn.close()
        flash(f"An error occurred: {e}", 'error')
        return redirect(url_for('customer_main', customer_id=customer_id))

















@app.route('/api/employees', methods=['GET'])
def owner_get_employees():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT EMPLOYEE_ID, FNAME, LNAME, PHONE_NUMBER, EMAIL, START_DATE FROM EMPLOYEE")
    employees = cursor.fetchall()
    conn.close()

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

# Function to get all tuples from works_on table
@app.route('/api/works_on', methods=['GET'])
def owner_get_works_on():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT EMPLOYEE_ID, PROJECT_NUM FROM WORKS_ON")
    works_on = cursor.fetchall()
    conn.close()

    works_on_list = [
        {
            'employee_id': row['EMPLOYEE_ID'],
            'project_num': row['PROJECT_NUM'],
        }
        for row in works_on
    ]

    return {'works_on': works_on_list}

@app.route('/api/employees/current', methods=['GET'])
def owner_get_current_employee():

    current_username = session.get('username')

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
        return {
            "EMPLOYEE_ID": employee["EMPLOYEE_ID"],
            "FNAME": employee["FNAME"],
            "LNAME": employee["LNAME"],
            "PHONE_NUMBER": employee["PHONE_NUMBER"],
            "EMAIL": employee["EMAIL"],
            "START_DATE": employee["START_DATE"],
            "USERNAME": employee["USERNAME"],
        }
    else:
        return {"error": "Employee not found"}, 404


# Update functions for Owner to update profile
@app.route('/api/employees/update', methods=['POST'])
def Owner_update_profile():
    data = request.get_json()  # Parse the JSON payload
    if not data:
        return {'error': 'Invalid JSON payload'}, 400

    username = data.get('username', '').strip()
    fname = data.get('fname', '').strip()
    lname = data.get('lname', '').strip()
    password = data.get('password', '').strip()
    phone = data.get('phone', '').strip()
    email = data.get('email', '').strip()

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

    cursor.execute("""
        SELECT PROJECT_NUM, ESTIMATE_LENGTH, START_TIME, ADDRESS
        FROM PROJECT
    """)
    projects = cursor.fetchall()
    conn.close()

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

    cursor.execute("""
        SELECT ORDER_NUM, STORE_NAME, COMPLETION_STAT, PROJECT_NUM
        FROM ORDERS
    """)
    orders = cursor.fetchall()
    conn.close()

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
    try:
        conn = get_db_connection()
        certificates = conn.execute("""
            SELECT CERTIFICATE_NUM, CERTIFICATE_PDF, DATE, CUSTOMER_ID, PROJECT_NUM
            FROM COMPLETION_CERTIFICATE
        """).fetchall()
        conn.close()

        if not certificates:
            return jsonify({"certificates": []}), 200

        certificate_list = [
            {
                "certificate_num": row["CERTIFICATE_NUM"],
                "certificate_pdf": row["CERTIFICATE_PDF"],
                "date": row["DATE"],
                "customer_id": row["CUSTOMER_ID"],
                "project_num": row["PROJECT_NUM"],
            }
            for row in certificates
        ]

        return jsonify({"certificates": certificate_list}), 200

    except sqlite3.Error as e:
        return jsonify({"error": "Database error occurred.", "details": str(e)}), 500
    except Exception as e:
        return jsonify({"error": "An unexpected error occurred.", "details": str(e)}), 500

# fetch all contracts function
@app.route('/api/contracts', methods=['GET'])
def Owner_get_contracts():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT CONTRACT_NUM, EMPLOYEE_ID, CUSTOMER_ID, CONTRACT_PDF
        FROM CONTRACT
    """)
    contracts = cursor.fetchall()
    conn.close()

    contract_list = [
        {
            'contract_num': row['CONTRACT_NUM'],
            'employee_id': row['EMPLOYEE_ID'],
            'customer_id': row['CUSTOMER_ID'],
            'contract_text': row['CONTRACT_PDF']
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
        cursor.execute("""
            SELECT MATERIAL_ID, NAME, TYPE, COST, AMOUNT, ORDER_NUM
            FROM MATERIALS
        """)
        materials = cursor.fetchall()

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
        cursor.execute("SELECT * FROM ESTIMATE WHERE ESTIMATE_NUM = ?", (estimate_num,))
        estimate = cursor.fetchone()

        if not estimate:
            return {'error': 'Estimate not found'}, 404

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
        cursor.execute("SELECT * FROM PROJECT WHERE PROJECT_NUM = ?", (project_num,))
        project = cursor.fetchone()

        if not project:
            return {'error': 'Project not found'}, 404

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
        cursor.execute("SELECT * FROM COMPLETION_CERTIFICATE WHERE CERTIFICATE_NUM = ?", (certificate_num,))
        certificate = cursor.fetchone()

        if not certificate:
            return {'error': 'Certificate not found'}, 404

        cursor.execute("DELETE FROM COMPLETION_CERTIFICATE WHERE CERTIFICATE_NUM = ?", (certificate_num,))
        conn.commit()

        cursor.execute("DELETE FROM SIGNS_CERTIFICATE WHERE CERTIFICATE_NUM = ?", (certificate_num,))
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
        cursor.execute("SELECT * FROM ORDERS WHERE ORDER_NUM = ?", (order_num,))
        order = cursor.fetchone()

        if not order:
            return {'error': 'Order not found'}, 404

        cursor.execute("DELETE FROM ORDERS WHERE ORDER_NUM = ?", (order_num,))
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
        cursor.execute("SELECT * FROM CONTRACT WHERE CONTRACT_NUM = ?", (contract_num,))
        contract = cursor.fetchone()

        if not contract:
            return {'error': 'Contract not found'}, 404

        cursor.execute("DELETE FROM CONTRACT WHERE CONTRACT_NUM = ?", (contract_num,))
        conn.commit()

        cursor.execute("DELETE FROM SIGNS_CONTRACT WHERE CONTRACT_NUM = ?", (contract_num,))
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
        cursor.execute("SELECT * FROM MATERIALS WHERE MATERIAL_ID = ?", (material_id,))
        material = cursor.fetchone()

        if not material:
            return {'error': 'Material not found'}, 404

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

    employee_id = f"E{str(uuid.uuid4().int)[:8]}"

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

    project_num = f"{str(uuid.uuid4().int)[:8]}"
    estimate_length = data.get('estimate_length', '').strip()
    start_time = data.get('start_time', '').strip()
    address = data.get('address', '').strip()

    if not estimate_length or not start_time or not address:
        return {'error': 'All fields are required (Estimate Length, Start Time, Address).'}, 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
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
    try:
        data = request.get_json()
        if not data:
            return {'error': 'Invalid JSON payload'}, 400

        certificate_pdf = data.get('certificate_pdf', '').strip()
        date = data.get('date', '').strip()
        customer_id = data.get('customer_id', '').strip()
        project_num = data.get('project_num', '').strip() or None

        certificate_num = int(uuid.uuid4().int % 1e8)

        if not date or not customer_id:
            return {'error': 'Date, and Customer ID are required.'}, 400

        conn = get_db_connection()
        cursor = conn.cursor()

        customer_check = cursor.execute(
            "SELECT 1 FROM CUSTOMER WHERE CUSTOMER_ID = ?",
            (customer_id,)
        ).fetchone()
        if not customer_check:
            return {'error': f'Customer ID {customer_id} does not exist.'}, 404

        if project_num:
            project_check = cursor.execute(
                "SELECT 1 FROM PROJECT WHERE PROJECT_NUM = ?",
                (project_num,)
            ).fetchone()
            if not project_check:
                return {'error': f'Project Number {project_num} does not exist.'}, 404

        cursor.execute(
            """
            INSERT INTO COMPLETION_CERTIFICATE (CERTIFICATE_NUM, CERTIFICATE_PDF, DATE, CUSTOMER_ID, PROJECT_NUM)
            VALUES (?, ?, ?, ?, ?)
            """,
            (certificate_num, certificate_pdf, date, customer_id, project_num)
        )

        cursor.execute(
            """
            INSERT INTO SIGNS_CERTIFICATE (CERTIFICATE_NUM, EMPLOYEE_ID, CUSTOMER_ID, PROJECT_NUM)
            VALUES (?, ?, ?, ?)
            """,
            (certificate_num, 'E00000001', customer_id, project_num)
        )

        conn.commit()
        return {'success': True, 'certificate_num': certificate_num}

    except sqlite3.Error as e:
        return {'error': f'Database error: {str(e)}'}, 500
    finally:
        conn.close()


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

# function to get all estimates
@app.route('/api/estimates', methods=['GET'])
def Owner_get_all_estimates():
    try:
        conn = get_db_connection()
        estimates = conn.execute(
            "SELECT * FROM ESTIMATE"
        ).fetchall()
        conn.close()

        if not estimates:
            return jsonify({"estimates": []}), 200

        estimate_list = [
            {
                "estimate_num": row["ESTIMATE_NUM"],
                "address": row["ADDRESS"],
                "project_cost": row["PROJECT_COST"],
                "estimate_text": None if row["ESTIMATE_PDF"] is None else "PDF Available",
                "gst": row["GST"],
                "total": row["TOTAL"],
                "pending_status": row["PENDING_STATUS"],
                "request_date": row["REQUEST_DATE"],
                "creation_date": row["CREATION_DATE"],
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
def Owner_get_estimate(estimate_num):
    try:
        conn = get_db_connection()
        estimate = conn.execute(
            "SELECT * FROM ESTIMATE WHERE ESTIMATE_NUM = ?",
            (estimate_num,)
        ).fetchone()
        conn.close()

        if estimate:
            pdf_url = f"/api/estimates/download/{estimate['ESTIMATE_NUM']}" if estimate["ESTIMATE_PDF"] else None

            estimate_dict = {
                "estimate_num": estimate["ESTIMATE_NUM"],
                "address": estimate["ADDRESS"],
                "project_cost": estimate["PROJECT_COST"],
                "gst": estimate["GST"],
                "total": estimate["TOTAL"],
                "pending_status": estimate["PENDING_STATUS"],
                "request_date": estimate["REQUEST_DATE"],
                "creation_date": estimate["CREATION_DATE"],
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


# Update estimate function
@app.route('/api/estimates/update/<int:estimate_num>', methods=['POST'])
def Owner_update_estimate(estimate_num):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM ESTIMATE WHERE ESTIMATE_NUM = ?", (estimate_num,))
        estimate = cursor.fetchone()

        if not estimate:
            return jsonify({"error": "Estimate not found"}), 404

        data = request.form
        address = data.get("address", "").strip()
        project_cost = data.get("project_cost", "").strip()
        employee_id = data.get("employee_id", "").strip()
        customer_id = data.get("customer_id", "").strip()
        pending_status = data.get("pending_status", "True").lower() == "true"

        if not address or not project_cost or not employee_id or not customer_id:
            return jsonify({"error": "All fields are required."}), 400

        try:
            project_cost = float(project_cost)
            gst = project_cost * 0.05
            total = project_cost + gst
        except ValueError:
            return jsonify({"error": "Invalid project cost format."}), 400

        cursor.execute(
            """
            UPDATE ESTIMATE
            SET ADDRESS = ?, PROJECT_COST = ?, GST = ?, TOTAL = ?, PENDING_STATUS = ?, EMPLOYEE_ID = ?, CUSTOMER_ID = ?
            WHERE ESTIMATE_NUM = ?
            """,
            (address, project_cost, gst, total, pending_status, employee_id, customer_id, estimate_num)
        )
        conn.commit()
        return jsonify({"success": True, "message": "Estimate updated successfully."}), 200

    except sqlite3.Error as e:
        return jsonify({"error": "Database error occurred.", "details": str(e)}), 500
    except Exception as e:
        return jsonify({"error": "An unexpected error occurred.", "details": str(e)}), 500
    finally:
        conn.close()

# Search project funtion
@app.route('/api/projects/<project_num>', methods=['GET'])
def get_project_by_num(project_num):
    try:
        if not project_num.isdigit():
            project_num = ''.join(filter(str.isdigit, project_num))

        project_num = int(project_num)

        conn = get_db_connection()
        project = conn.execute(
            "SELECT * FROM PROJECT WHERE PROJECT_NUM = ?",
            (project_num,)
        ).fetchone()
        conn.close()

        if project:
            project_dict = {
                "project_num": project["PROJECT_NUM"],
                "estimate_length": project["ESTIMATE_LENGTH"],
                "start_time": project["START_TIME"],
                "address": project["ADDRESS"],
                "employee_id": project["EMPLOYEE_ID"],
            }
            return jsonify(project_dict), 200
        else:
            return jsonify({"error": "Project not found"}), 404

    except ValueError:
        return jsonify({"error": "Invalid project number format"}), 400
    except sqlite3.Error as e:
        return jsonify({"error": "Database error occurred.", "details": str(e)}), 500
    except Exception as e:
        return jsonify({"error": "An unexpected error occurred.", "details": str(e)}), 500

#Update project function
@app.route('/api/projects/update/<int:project_num>', methods=['POST'])
def Owner_update_project(project_num):
    try:
        data = request.form
        estimate_length = data.get('estimate_length')
        start_time = data.get('start_time')
        address = data.get('address')
        employee_id = data.get('employee_id')

        if not estimate_length or not start_time or not address:
            return jsonify({"error": "All fields (Estimate Length, Start Time, Address) are required."}), 400

        conn = get_db_connection()
        conn.execute(
            """
            UPDATE PROJECT
            SET ESTIMATE_LENGTH = ?, START_TIME = ?, ADDRESS = ?, EMPLOYEE_ID = ?
            WHERE PROJECT_NUM = ?
            """,
            (estimate_length, start_time, address, employee_id, project_num)
        )
        conn.commit()
        conn.close()

        return jsonify({"success": True, "message": "Project updated successfully."}), 200

    except sqlite3.Error as e:
        return jsonify({"error": "Database error occurred.", "details": str(e)}), 500
    except Exception as e:
        return jsonify({"error": "An unexpected error occurred.", "details": str(e)}), 500

# Function to search orders
@app.route('/api/orders/search/<int:order_num>', methods=['GET'])
def search_order(order_num):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM ORDERS WHERE ORDER_NUM = ?", (order_num,))
        order = cursor.fetchone()

        conn.close()

        if order:
            order_data = {
                "order_num": order["ORDER_NUM"],
                "store_name": order["STORE_NAME"],
                "completion_stat": "Completed" if order["COMPLETION_STAT"] else "Pending",
                "project_num": order["PROJECT_NUM"]
            }
            return jsonify(order_data), 200
        else:
            return jsonify({"error": "Order not found"}), 404

    except sqlite3.Error as e:
        return jsonify({"error": f"Database error occurred: {str(e)}"}), 500

# Update order completion status function
@app.route('/api/orders/update_status/<int:order_num>', methods=['POST'])
def Owner_update_order_status(order_num):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM ORDERS WHERE ORDER_NUM = ?", (order_num,))
        order = cursor.fetchone()

        if not order:
            return jsonify({"error": "Order not found"}), 404

        data = request.form
        completion_stat = data.get("completion_stat", "").strip()

        if completion_stat not in ["0", "1"]:
            return jsonify({"error": "Invalid completion status. Must be 0 (Pending) or 1 (Completed)."}), 400

        cursor.execute(
            """
            UPDATE ORDERS
            SET COMPLETION_STAT = ?
            WHERE ORDER_NUM = ?
            """,
            (int(completion_stat), order_num)
        )
        conn.commit()

        return jsonify({"success": True, "message": "Order completion status updated successfully"}), 200

    except sqlite3.Error as e:
        return jsonify({"error": "Database error occurred.", "details": str(e)}), 500
    except Exception as e:
        return jsonify({"error": "An unexpected error occurred.", "details": str(e)}), 500
    finally:
        conn.close()


# Function for searching certificate
@app.route('/api/certificates/<int:certificate_num>', methods=['GET'])
def Owner_search_certificate(certificate_num):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT CERTIFICATE_NUM, CERTIFICATE_PDF, DATE, CUSTOMER_ID, PROJECT_NUM "
            "FROM COMPLETION_CERTIFICATE WHERE CERTIFICATE_NUM = ?",
            (certificate_num,)
        )
        certificate = cursor.fetchone()
        conn.close()

        if certificate:
            certificate_data = {
                "certificate_num": certificate["CERTIFICATE_NUM"],
                "certificate_pdf": certificate["CERTIFICATE_PDF"],
                "date": certificate["DATE"],
                "customer_id": certificate["CUSTOMER_ID"],
                "project_num": certificate["PROJECT_NUM"]
            }
            return jsonify(certificate_data), 200
        else:
            return jsonify({"error": "Certificate not found"}), 404

    except sqlite3.Error as e:
        return jsonify({"error": "Database error occurred.", "details": str(e)}), 500
    except Exception as e:
        return jsonify({"error": "An unexpected error occurred.", "details": str(e)}), 500


# Update certificate function
@app.route('/api/certificates/update/<int:certificate_num>', methods=['POST'])
def Owner_update_certificate(certificate_num):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM COMPLETION_CERTIFICATE WHERE CERTIFICATE_NUM = ?", (certificate_num,))
        certificate = cursor.fetchone()

        if not certificate:
            return jsonify({"error": "Certificate not found"}), 404

        certificate_text = request.form.get("certificate_text", "").strip()
        date = request.form.get("date", "").strip()

        cursor.execute(
            """
            UPDATE COMPLETION_CERTIFICATE
            SET CERTIFICATE_PDF = ?, DATE = ?
            WHERE CERTIFICATE_NUM = ?
            """,
            (certificate_text, date, certificate_num)
        )
        conn.commit()

        return jsonify({"success": True, "message": "Certificate updated successfully"}), 200

    except sqlite3.Error as e:
        return jsonify({"error": f"Database error occurred: {str(e)}"}), 500
    finally:
        conn.close()


# Add order function
@app.route('/api/orders/create', methods=['POST'])
def Owner_add_order():
    try:
        store_name = request.form.get("store_name", "").strip()
        project_num = request.form.get("project_num", "").strip()
        completion_stat = request.form.get("completion_stat", "0").strip()

        if not store_name or not project_num:
            return jsonify({"error": "Store Name and Project Number are required."}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT 1 FROM PROJECT WHERE PROJECT_NUM = ?", (project_num,))
        project = cursor.fetchone()
        if not project:
            return jsonify({"error": f"Project Number {project_num} does not exist."}), 404

        order_num = int(uuid.uuid4().int % 1e8)

        cursor.execute(
            """
            INSERT INTO ORDERS (ORDER_NUM, STORE_NAME, COMPLETION_STAT, PROJECT_NUM)
            VALUES (?, ?, ?, ?)
            """,
            (order_num, store_name, int(completion_stat), project_num)
        )
        conn.commit()

        return jsonify({"success": True, "message": "Order added successfully", "order_num": order_num}), 201

    except sqlite3.Error as e:
        return jsonify({"error": f"Database error occurred: {str(e)}"}), 500
    finally:
        conn.close()

# fucntion to crete contract
@app.route('/api/contracts/create', methods=['POST'])
def Owner_create_contract():
    try:
        # Parse the form data
        contract_pdf = request.form.get("contract_pdf", "").strip()
        employee_id = request.form.get("employee_id", "").strip()
        customer_id = request.form.get("customer_id", "").strip()
        project_num = request.form.get("project_num", "").strip()
        contract_date = request.form.get("date", "").strip()

        if not contract_pdf or not employee_id or not customer_id or not project_num or not contract_date:
            return jsonify({"error": "All fields are required."}), 400

        contract_num = f"C{str(uuid.uuid4().int)[:8]}"

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT 1 FROM EMPLOYEE WHERE EMPLOYEE_ID = ?", (employee_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Employee ID does not exist."}), 404

        cursor.execute("SELECT 1 FROM CUSTOMER WHERE CUSTOMER_ID = ?", (customer_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Customer ID does not exist."}), 404

        cursor.execute("SELECT 1 FROM PROJECT WHERE PROJECT_NUM = ?", (project_num,))
        if not cursor.fetchone():
            return jsonify({"error": "Project Number does not exist."}), 404

        cursor.execute(
            """
            INSERT INTO CONTRACT (CONTRACT_NUM, CONTRACT_PDF, EMPLOYEE_ID, CUSTOMER_ID)
            VALUES (?, ?, ?, ?)
            """,
            (contract_num, contract_pdf, employee_id, customer_id)
        )

        cursor.execute(
            """
            INSERT INTO SIGNS_CONTRACT (EMPLOYEE_ID, CUSTOMER_ID, CONTRACT_NUM, PROJECT_NUM, DATE)
            VALUES (?, ?, ?, ?, ?)
            """,
            (employee_id, customer_id, contract_num, project_num, contract_date)
        )

        conn.commit()
        conn.close()

        return jsonify({"success": True, "message": "Contract and signing record created successfully.", "contract_num": contract_num}), 201

    except sqlite3.Error as e:
        return jsonify({"error": "Database error occurred.", "details": str(e)}), 500
    except Exception as e:
        return jsonify({"error": "An unexpected error occurred.", "details": str(e)}), 500


# function for searching new contract
@app.route('/api/contracts/search/<contract_num>', methods=['GET'])
def Owner_search_contract(contract_num):
    try:
        # Connect to the database
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT C.CONTRACT_NUM, C.CONTRACT_PDF, C.EMPLOYEE_ID, C.CUSTOMER_ID, 
                   S.PROJECT_NUM, S.DATE
            FROM CONTRACT C
            JOIN SIGNS_CONTRACT S ON C.CONTRACT_NUM = S.CONTRACT_NUM
            WHERE C.CONTRACT_NUM = ?
            """,
            (contract_num,)
        )
        contract = cursor.fetchone()
        conn.close()

        if not contract:
            return jsonify({"error": "Contract not found"}), 404

        contract_data = {
            "contract_num": contract["CONTRACT_NUM"],
            "contract_pdf": contract["CONTRACT_PDF"],
            "employee_id": contract["EMPLOYEE_ID"],
            "customer_id": contract["CUSTOMER_ID"],
            "project_num": contract["PROJECT_NUM"],
            "date": contract["DATE"],
        }

        return jsonify(contract_data), 200

    except sqlite3.Error as e:
        return jsonify({"error": "Database error occurred.", "details": str(e)}), 500
    except Exception as e:
        return jsonify({"error": "An unexpected error occurred.", "details": str(e)}), 500


# Function for editing contract
@app.route('/api/contracts/update/<contract_num>', methods=['POST'])
def Owner_update_contract(contract_num):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM CONTRACT WHERE CONTRACT_NUM = ?", (contract_num,))
        contract = cursor.fetchone()

        if not contract:
            return jsonify({"error": "Contract not found"}), 404

        data = request.get_json()
        contract_text = data.get("contract_pdf", "").strip()

        if not contract_text:
            return jsonify({"error": "Contract Text is required."}), 400

        cursor.execute(
            """
            UPDATE CONTRACT
            SET CONTRACT_PDF = ?
            WHERE CONTRACT_NUM = ?
            """,
            (contract_text, contract_num)
        )
        conn.commit()

        return jsonify({"success": True, "message": "Contract updated successfully"}), 200

    except sqlite3.Error as e:
        return jsonify({"error": f"Database error occurred: {str(e)}"}), 500
    finally:
        conn.close()


# Function to add material
@app.route('/api/materials/create', methods=['POST'])
def Owner_create_material():
    try:

        conn = get_db_connection()
        cursor = conn.cursor()

        material_id = f"M{str(uuid.uuid4().int)[:8]}"
        name = request.form.get("name", "").strip()
        material_type = request.form.get("type", "").strip()
        cost = request.form.get("cost", "").strip()
        amount = request.form.get("amount", "").strip()
        order_num = request.form.get("order_num", "").strip()

        if not name or not material_type or not cost or not amount or not order_num:
            return jsonify({"error": "All fields are required."}), 400
        if not cost.isdigit() or not amount.isdigit():
            return jsonify({"error": "Cost and amount must be numeric."}), 400

        cursor.execute("SELECT 1 FROM ORDERS WHERE ORDER_NUM = ?", (order_num,))
        if not cursor.fetchone():
            return jsonify({"error": f"Order Number {order_num} does not exist."}), 404

        cursor.execute(
            """
            INSERT INTO MATERIALS (MATERIAL_ID, NAME, TYPE, COST, AMOUNT, ORDER_NUM)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (material_id, name, material_type, int(cost), int(amount), order_num)
        )
        conn.commit()

        return jsonify({"success": True, "message": "Material added successfully"}), 201

    except sqlite3.Error as e:
        return jsonify({"error": f"Database error occurred: {str(e)}"}), 500
    finally:
        conn.close()


@app.route('/api/materials/search/<material_id>', methods=['GET'])
def Owner_get_material_by_id(material_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT MATERIAL_ID, NAME, TYPE, COST, AMOUNT, ORDER_NUM
            FROM MATERIALS
            WHERE MATERIAL_ID = ?
            """,
            (material_id,)
        )
        material = cursor.fetchone()
        conn.close()

        if material:

            material_data = {
                "material_id": material["MATERIAL_ID"],
                "name": material["NAME"],
                "type": material["TYPE"],
                "cost": material["COST"],
                "amount": material["AMOUNT"],
                "order_num": material["ORDER_NUM"],
            }
            return jsonify(material_data), 200
        else:
            return jsonify({"error": "Material not found"}), 404

    except sqlite3.Error as e:
        return jsonify({"error": f"Database error occurred: {str(e)}"}), 500


# Funtion to assign employee to project in works_on table
@app.route('/api/works_on/assign', methods=['POST'])
def Owner_assign_project():
    try:
        employee_id = request.form.get("employee_id", "").strip()
        project_num = request.form.get("project_num", "").strip()

        if not employee_id or not project_num:
            return jsonify({"error": "Both Employee ID and Project Number are required."}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT 1 FROM EMPLOYEE WHERE EMPLOYEE_ID = ?", (employee_id,))
        if not cursor.fetchone():
            return jsonify({"error": f"Employee ID {employee_id} does not exist."}), 404

        cursor.execute("SELECT 1 FROM PROJECT WHERE PROJECT_NUM = ?", (project_num,))
        if not cursor.fetchone():
            return jsonify({"error": f"Project Number {project_num} does not exist."}), 404

        cursor.execute(
            "SELECT 1 FROM WORKS_ON WHERE EMPLOYEE_ID = ? AND PROJECT_NUM = ?",
            (employee_id, project_num)
        )
        if cursor.fetchone():
            return jsonify({"error": "This Employee is already assigned to the Project."}), 400

        cursor.execute(
            "INSERT INTO WORKS_ON (EMPLOYEE_ID, PROJECT_NUM) VALUES (?, ?)",
            (employee_id, project_num)
        )
        conn.commit()

        return jsonify({"success": True, "message": "Employee successfully assigned to the project."}), 201

    except sqlite3.Error as e:
        return jsonify({"error": f"Database error occurred: {str(e)}"}), 500
    finally:
        conn.close()

# Function to delete project assignment
@app.route('/api/works_on/delete', methods=['DELETE'])
def Owner_delete_project_assignment():
    data = request.get_json()
    employee_id = data.get('employee_id')
    project_num = data.get('project_num')

    if not employee_id or not project_num:
        return {'error': 'Employee ID and Project Number are required.'}, 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "SELECT * FROM WORKS_ON WHERE EMPLOYEE_ID = ? AND PROJECT_NUM = ?",
            (employee_id, project_num)
        )
        assignment = cursor.fetchone()

        if not assignment:
            return {'error': 'Assignment not found.'}, 404

        cursor.execute(
            "DELETE FROM WORKS_ON WHERE EMPLOYEE_ID = ? AND PROJECT_NUM = ?",
            (employee_id, project_num)
        )
        conn.commit()
        return {'success': True, 'message': 'Project assignment deleted successfully.'}, 200
    except sqlite3.Error as e:
        return {'error': str(e)}, 500
    finally:
        conn.close()

#function for searching up an employees projects they are asisgned to in works_on table
@app.route('/api/works_on/search/<employee_id>', methods=['GET'])
def Owner_search_employee_projects(employee_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT * FROM EMPLOYEE WHERE EMPLOYEE_ID = ?", (employee_id,))
        employee = cursor.fetchone()

        if not employee:
            return {"error": "Employee not found"}, 404

        cursor.execute(
            "SELECT PROJECT_NUM FROM WORKS_ON WHERE EMPLOYEE_ID = ?", (employee_id,)
        )
        projects = cursor.fetchall()

        employee_projects = {
            "employee": {
                "id": employee["EMPLOYEE_ID"],
                "first_name": employee["FNAME"],
                "last_name": employee["LNAME"],
                "phone": employee["PHONE_NUMBER"],
                "email": employee["EMAIL"],
            },
            "projects": [project["PROJECT_NUM"] for project in projects],
        }

        return employee_projects, 200
    except sqlite3.Error as e:
        return {"error": f"Database error: {str(e)}"}, 500
    finally:
        conn.close()


# Run the app
if __name__ == '__main__':
    app.run(debug=True)





