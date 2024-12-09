from flask import Flask, render_template, request, redirect, url_for, flash
import sqlite3
import uuid  # For generating unique IDs


app = Flask(__name__)
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



if __name__ == '__main__':
    app.run(debug=True)


