import os
from flask import Flask, request, jsonify, render_template, session
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder='static')
CORS(app)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'default_secret_key')

def get_db_connection():
    conn = psycopg2.connect(
        host='localhost',
        port='5433', 
        database='MovieWeb',
        user='postgres',
        password=os.getenv('DB_PASSWORD', 'default_password') 
    )
    return conn

@app.route('/check_session')
def check_session():
    if 'username' in session:
        return jsonify(logged_in=True, username=session['username'])
    return jsonify(logged_in=False)

@app.route('/')
def home():
    return render_template('index.html')

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
        print(f"Error: {e}") 
        return jsonify({"error": "An error occurred during signup."}), 400

@app.route('/signin', methods=['POST'])
def signin():
    data = request.get_json()
    username_or_email = data['username']
    password = data['password']

    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""SELECT * FROM alpha.User_Details WHERE username = %s OR email = %s""",
                               (username_or_email, username_or_email))
                user = cursor.fetchone()

                if user and check_password_hash(user['password_hash'], password):
                    session['username'] = user['username'] 
                    return jsonify({"message": "Login successful!", "username": user['username']})
                else:
                    return jsonify({"message": "Invalid credentials"}), 401
    except Exception as e:
        print(f"Error: {e}") 
        return jsonify({"error": "An error occurred during sign-in."}), 500

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
        print(f"Error: {e}") 
        return jsonify({"error": "An error occurred."}), 500

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
                    cursor.execute("""INSERT INTO alpha.Password_Reset (user_id, reset_token, expires_at) 
                                      VALUES (%s, %s, %s)""",
                                   (user['user_id'], reset_token, datetime.datetime.utcnow() + datetime.timedelta(minutes=15)))
                    conn.commit()
                    return jsonify({"message": "Password reset link has been sent!", "reset_token": reset_token}), 200
                else:
                    return jsonify({"message": "Email not found"}), 404
    except Exception as e:
        print(f"Error: {e}")  
        return jsonify({"error": "An error occurred."}), 500

if __name__ == '__main__':
    app.run(debug=True)
