from flask import Flask, render_template, request, session, jsonify
from flask_cors import CORS
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from werkzeug.security import generate_password_hash, check_password_hash
from apscheduler.schedulers.background import BackgroundScheduler
import jwt
import datetime
from dotenv import load_dotenv
from flask_mail import Mail, Message
import requests


# Load environment variables
load_dotenv()

# TMDB API Key
TMDB_API_KEY = '242a2ba5f4ab590b9cc98651955f4509'

# Initialize Flask app
app = Flask(__name__, static_folder='static')
CORS(app)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'default_secret_key')  # Use an environment variable for the secret key

# Initialize Flask-Mail
app.config['MAIL_SERVER'] = 'smtp.att.yahoo.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
mail = Mail(app)

# Database connection function
def get_db_connection():
    conn = psycopg2.connect(
        host='localhost',
        port='5433',
        database='MovieWeb',
        user='postgres',
        password=os.getenv('DB_PASSWORD', 'default_password')  # Use an environment variable for the DB password
    )
    return conn

# Route to display user session details
@app.route('/user_session', methods=['GET'])
def user_session():
    if 'username' in session:
        username = session['username']  # Retrieve username from session
        return jsonify({"message": "You are logged in!", "username": username})
    else:
        return jsonify({"message": "No active session. Please log in."}), 401

@app.route('/check_session')
def check_session():
    if 'username' in session:
        return jsonify(logged_in=True, username=session['username'])
    return jsonify(logged_in=False)

# Logout route to clear user session
@app.route('/logout', methods=['POST'])
def logout():
    session.pop('username', None)  # Remove the username from session
    return jsonify({"message": "You have been logged out."})

# Serve the landing page
@app.route('/')
def home():
    return render_template('index.html')

# Sign-up route
@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data['username']
    password = generate_password_hash(data['password'])
    email = data['email']
    first_name = data['first_name']
    last_name = data['last_name']

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""INSERT INTO alpha.User_Details 
                                  (username, password_hash, email, first_name, last_name)
                                  VALUES (%s, %s, %s, %s, %s)""",
                               (username, password, email, first_name, last_name))
                conn.commit()
        return jsonify({"message": "User registered successfully!"}), 201
    except Exception as e:
        print(f"Error: {e}")  # Log the error for debugging
        return jsonify({"error": "An error occurred during signup."}), 400

@app.route('/signin', methods=['POST'])
def signin():
    data = request.get_json()
    username_or_email = data['username']
    password = data['password']

    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""SELECT first_name, last_name, password_hash FROM alpha.User_Details 
                                  WHERE username = %s OR email = %s""",
                               (username_or_email, username_or_email))
                user = cursor.fetchone()

                if user and check_password_hash(user['password_hash'], password):
                    # Store initials in session and send back to client
                    initials = f"{user['first_name'][0]}{user['last_name'][0]}"
                    session['username'] = initials
                    return jsonify({"message": "Login successful!", "initials": initials})
                else:
                    return jsonify({"error": "Invalid credentials"}), 401
    except Exception as e:
        print(f"Error: {e}")  # Log the error for debugging
        return jsonify({"error": "An error occurred during sign-in."}), 500


# Forgot username route
@app.route('/forgot-username', methods=['POST'])
def forgot_username():
    data = request.get_json()
    email = data['email']

    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("SELECT username FROM alpha.User_Details WHERE email = %s", (email,))
                user = cursor.fetchone()

                if user:
                    return jsonify({"username": user['username']}), 200
                else:
                    return jsonify({"message": "Email not found"}), 404
    except Exception as e:
        print(f"Error: {e}")  # Log the error for debugging
        return jsonify({"error": "An error occurred."}), 500

# Forgot password route
@app.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data['email']

    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("SELECT user_id FROM alpha.User_Details WHERE email = %s", (email,))
                user = cursor.fetchone()

                if user:
                    reset_token = jwt.encode({
                        'user_id': user['user_id'],
                        'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
                    }, app.secret_key)

                    # Save the token in Password_Reset table (if required)
                    cursor.execute("""INSERT INTO alpha.Password_Reset (user_id, reset_token, expires_at) 
                                      VALUES (%s, %s, %s)""",
                                   (user['user_id'], reset_token, datetime.datetime.utcnow() + datetime.timedelta(minutes=15)))
                    conn.commit()

                    # Send email with reset link
                    msg = Message("Password Reset Request",
                                  sender=os.getenv('MAIL_USERNAME'),  # Use environment variable for sender
                                  recipients=[email])
                    msg.body = f"Your password reset link: http://your-domain.com/reset-password?token={reset_token}"
                    mail.send(msg)

                    return jsonify({"message": "Password reset link has been sent!"}), 200
                else:
                    return jsonify({"message": "Email not found"}), 404
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "An error occurred."}), 500

@app.route('/movie/<int:movie_id>')
def movie_details(movie_id):
    movie_details = get_movie_details_from_tmdb(movie_id)  # Function to fetch details
    return render_template('movie_details.html', movie=movie_details)

def get_movie_details_from_tmdb(movie_id):
    url = f'https://api.themoviedb.org/3/movie/{movie_id}?api_key={TMDB_API_KEY}&append_to_response=videos'
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    else:
        return {}

def update_movie_list():
    # Logic to fetch movies from Trakt and update your database or TMDb library.
    pass

# Initialize and start the scheduler
scheduler = BackgroundScheduler()
scheduler.add_job(func=update_movie_list, trigger="interval", hours=24)
scheduler.start()

if __name__ == '__main__':
    app.run(debug=True)
