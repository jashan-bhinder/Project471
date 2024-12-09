from flask import Flask, render_template, request, redirect, url_for, flash
import sqlite3
import uuid  # Import for generating unique IDs

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

    # Fetch customer details
    cursor.execute("SELECT * FROM CUSTOMER WHERE CUSTOMER_ID = ?", (customer_id,))
    customer = cursor.fetchone()
    conn.close()

    if customer:
        # Map the SQL result to a dictionary
        customer_dict = {
            'customer_id': customer[0],
            'username': customer[1],
            'password': customer[2],
            'address': customer[3],
            'phone_number': customer[4],
            'name': customer[5],
            'email': customer[6],  # Include the email in the customer dictionary
        }
        return render_template('CustomerMain.html', customer=customer_dict)
    else:
        return "Customer not found", 404

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



# Run the app
if __name__ == '__main__':
    app.run(debug=True)
