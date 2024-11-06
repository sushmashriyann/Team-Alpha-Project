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

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'moviewebcom1@gmail.com'  # Replace with your Gmail address
app.config['MAIL_PASSWORD'] = 'qvhj tvho ibnx kdmp'      # Replace with the Gmail app password
app.config['MAIL_DEFAULT_SENDER'] = 'moviewebcom1@gmail.com'  # Replace with the same Gmail address


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

# @app.route('/check_session')
#def check_session():
 #   if 'username' in session:
  #      return jsonify(logged_in=True, username=session['username'])
   # return jsonify(logged_in=False)

@app.route('/check_session', methods=['GET'])
def check_session():
    if 'user_id' in session:
        user_id = session['user_id']
        
        # If initials are already stored in the session, use them
        if 'initials' in session:
            initials = session['initials']
        else:
            # Otherwise, fetch initials from the database using user_id
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT first_name, last_name FROM alpha.user_details WHERE user_id = %s", (user_id,))
            user = cur.fetchone()
            cur.close()
            conn.close()

            initials = f"{user[0][0]}{user[1][0]}"
            session['initials'] = initials  # Store initials in session for future use

        return jsonify(logged_in=True, initials=initials)
    
    return jsonify(logged_in=False)


# Logout route to clear user session

@app.route('/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)  # Remove user_id from session
    session.pop('username', None)  # Optionally remove initials too
    return jsonify({"message": "Successfully logged out"}), 200

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
                # Fetch user details by username or email
                cursor.execute("""
                    SELECT user_id, first_name, last_name, password_hash 
                    FROM alpha.User_Details 
                    WHERE username = %s OR email = %s
                """, (username_or_email, username_or_email))
                user = cursor.fetchone()

                if user and check_password_hash(user['password_hash'], password):
                    # Store user_id and initials in session
                    initials = f"{user['first_name'][0]}{user['last_name'][0]}"
                    session['user_id'] = user['user_id']  # Store user_id for future use
                    session['initials'] = initials  # Store initials instead of username
                    
                    return jsonify({"message": "Login successful!", "initials": initials})
                else:
                    return jsonify({"error": "Invalid credentials"}), 401

    except Exception as e:
        print(f"Error: {e}")  # Log the error for debugging
        return jsonify({"error": "An error occurred during sign-in."}), 500

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

@app.route('/get_preferences_form', methods=['GET'])
def get_preferences_form():
    return render_template('preferences_form.html')

@app.route('/api/save_preferences', methods=['POST'])
def save_preferences():
    data = request.json
    user_id = get_current_user_id()  # Replace with actual user ID fetching logic
    genres = data['genres']
    subgenres = data['subgenres']

    conn = get_db_connection()
    cur = conn.cursor()

    # Save preferences in the database
    cur.execute("DELETE FROM alpha.user_preferences WHERE user_id = %s", (user_id,))
    for subgenre_id in subgenres:
        cur.execute("""
            INSERT INTO alpha.user_preferences (user_id, sub_genre_id) VALUES (%s, %s)
            ON CONFLICT DO NOTHING
        """, (user_id, subgenre_id))

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({'status': 'success'})

@app.route('/api/get_genres', methods=['GET'])
def get_genres():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('SELECT genre_id, genre_name FROM alpha.genres')
        genres = cur.fetchall()
        genre_list = [{"genre_id": row[0], "genre_name": row[1]} for row in genres]
        cur.close()
        conn.close()
        return jsonify(genre_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/get_subgenres', methods=['GET'])
def get_subgenres():
    genre_id = request.args.get('genre_id')
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('SELECT sub_genre_id, sub_genre_name FROM alpha.sub_genres WHERE genre_id = %s', (genre_id,))
        subgenres = cur.fetchall()
        subgenre_list = [{"sub_genre_id": row[0], "sub_genre_name": row[1]} for row in subgenres]
        cur.close()
        conn.close()
        return jsonify(subgenre_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/get_genres_and_subgenres', methods=['GET'])
def get_genres_and_subgenres():
    conn = None
    try:
        # Get the database connection
        conn = get_db_connection()
        cur = conn.cursor()

        # Query the genres and subgenres from your database
        genres_query = """
        SELECT g.genre_id, g.genre_name, 
               json_agg(json_build_object('sub_genre_id', sg.sub_genre_id, 'sub_genre_name', sg.sub_genre_name)) AS subgenres
        FROM alpha.genres g
        LEFT JOIN alpha.sub_genres sg ON g.genre_id = sg.genre_id
        GROUP BY g.genre_id, g.genre_name
        """
        cur.execute(genres_query)
        genres = cur.fetchall()

        # Convert the result into a list of dictionaries
        genres_list = [{
            'genre_id': genre[0],
            'genre_name': genre[1],
            'subgenres': genre[2]
        } for genre in genres]

        # Return the result as a JSON response
        return jsonify(genres_list)

    except Exception as e:
        print(f"Error querying genres and subgenres: {e}")
        return jsonify({"error": "Internal server error"}), 500

    finally:
        if conn:
            conn.close()  # Ensure the connection is closed


@app.route('/submit_preferences', methods=['POST'])
def submit_preferences():
    try:
        user_id = session.get('user_id')  # Assuming user_id is stored in the session
        preferences = request.json.get('preferences', [])

        # Establish database connection
        conn = get_db_connection()
        cur = conn.cursor()

        # Step 1: Delete previous preferences for the user
        cur.execute("DELETE FROM alpha.user_preferences WHERE user_id = %s", (user_id,))

        # Step 2: Insert new preferences
        for pref in preferences:
            genre_id = pref['genre_id']
            sub_genre_id = pref['sub_genre_id']
            cur.execute("""
                INSERT INTO alpha.user_preferences (user_id, genre_id, sub_genre_id)
                VALUES (%s, %s, %s)
            """, (user_id, genre_id, sub_genre_id))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Preferences updated successfully!"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/get_recommendations', methods=['GET'])
def get_recommendations():
    user_id = get_logged_in_user_id()  # Assuming you have a way to get the logged-in user's ID

    # Fetch genres and sub-genres from the database for this user
    cur = conn.cursor()
    cur.execute("""
        SELECT g.genre_id, sg.sub_genre_name
        FROM alpha.user_preferences up
        LEFT JOIN alpha.genres g ON up.genre_id = g.genre_id
        LEFT JOIN alpha.sub_genres sg ON up.sub_genre_id = sg.sub_genre_id
        WHERE up.user_id = %s;
    """, (user_id,))
    preferences = cur.fetchall()

    # Fetch movies from TMDB based on the main genres
    genres = [genre[0] for genre in preferences if genre[0] is not None]
    subgenre_keywords = [subgenre[1] for subgenre in preferences if subgenre[1] is not None]

    tmdb_genre_query = ','.join(map(str, genres))
    tmdb_url = f'https://api.themoviedb.org/3/discover/movie?api_key={TMDB_API_KEY}&with_genres={tmdb_genre_query}'

    response = requests.get(tmdb_url)
    movies = response.json().get('results', [])

    # Filter movies based on sub-genres by checking the description for keywords
    filtered_movies = [movie for movie in movies if any(keyword in movie['overview'] for keyword in subgenre_keywords)]

    return jsonify(filtered_movies)

@app.route('/guest', methods=['POST'])
def guestLogin():
    try:
        guest_user_id = 0  
        initials = "G"
        name = "Guest"

        session['user_id'] = guest_user_id 
        session['initials'] = initials  
        
        return jsonify({"message": "Guest login successful!", "initials": initials, "name": name})

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "An error occurred during guest sign-in."}), 500

# Forgot username route
@app.route('/forgot-username', methods=['POST'])
def forgot_username():
    data = request.get_json()
    
    if data is None or 'email' not in data:
        return jsonify({"error": "Email is required"}), 400

    email = data['email']
    print(f"Received email: {email}")

    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("SELECT username, first_name FROM alpha.User_Details WHERE email = %s", (email,))
                user = cursor.fetchone()

                if user:
                    msg = Message(
                        subject="Moviecom Username Recovery",
                        sender=app.config['MAIL_DEFAULT_SENDER'],
                        recipients=[email]
                    )
                    msg.body = (f"Hi {user['first_name']},\n\nYou've recently made a request to recover your username. "
                                f"Here it is!\n\nUsername: {user['username']}\n\n"
                                "If you did not ask to recover your username, please log in and reset your password "
                                "immediately to avoid unauthorized activity on your account.\n\n"
                                "Thank you,\nThe Moviecom Team")

                    try:
                        mail.send(msg)
                        print("Email sent successfully")
                        return jsonify({"message": "Email Sent!"}), 200
                    except Exception as mail_error:
                        print(f"Error sending email: {mail_error}")
                        return jsonify({"error": "Failed to send email."}), 500

                else:
                    return jsonify({"message": "Email not found."}), 404
    except Exception as e:
        print(f"Error: {e}") 
        return jsonify({"error": "An internal server error occurred."}), 500

# Forgot password route
@app.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()

    if data is None or 'email' not in data:
        return jsonify({"error": "Email is required"}), 400

    email = data['email']
    print(f"Received email for password reset: {email}")

    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("SELECT user_id, first_name FROM alpha.User_Details WHERE email = %s", (email,))
                user = cursor.fetchone()

                if user:
                    reset_token = jwt.encode({
                        'user_id': user['user_id'],
                        'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
                    }, app.secret_key, algorithm="HS256")

                    cursor.execute("""
                        INSERT INTO alpha.Password_Reset (user_id, reset_token, expires_at)
                        VALUES (%s, %s, %s)
                    """, (user['user_id'], reset_token, datetime.datetime.utcnow() + datetime.timedelta(minutes=15)))
                    conn.commit()

                    reset_link = f"http://127.0.0.1:5000/reset-password?token={reset_token}"
                    msg = Message("Moviecom Password Recovery",
                                  sender=app.config['MAIL_DEFAULT_SENDER'],
                                  recipients=[email])

                    msg.html = f"""
                    <p>Hi {user['first_name']},</p>
                    <p>You've recently made a request to reset your password. This link will expire in 15 minutes. Let's reset it now!</p>
                    <a href="{reset_link}" style="display: inline-block; padding: 10px 20px; color: black; background-color: #ff6f61; text-decoration: none; border-radius: 5px;">Reset Password</a>
                    <p>If you did not ask to reset your password, please log in and reset your password immediately to avoid unauthorized activity on your account.</p>
                    <p>Thank you,<br>The Moviecom Team</p>
                    """

                    try:
                        mail.send(msg)
                        print("Password reset email sent successfully")
                        return jsonify({"message": "Email sent."}), 200
                    except Exception as mail_error:
                        print(f"Error sending email: {mail_error}")
                        return jsonify({"error": "Failed to send email."}), 500
                else:
                    return jsonify({"message": "Email not found."}), 404
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "An internal server error occurred."}), 500

# Reset password route
@app.route('/reset-password', methods=['GET', 'POST'])
def reset_password():
    if request.method == 'GET':
        return '''
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <title>Reset Password</title>
          </head>
          <body>
            <h2>Reset Password</h2>
            <form action="/reset-password" method="POST">
              <input type="hidden" name="token" value="{token}">
              <label for="new_password">New Password:</label><br>
              <input type="password" id="new_password" name="new_password" required><br><br>
              <button type="submit">Reset Password</button>
            </form>
          </body>
        </html>
        '''.format(token=request.args.get('token'))
    elif request.method == 'POST':
        data = request.form
        token = data.get('token')
        new_password = data.get('new_password')

        if not token or not new_password:
            return jsonify({"error": "Token and new password are required"}), 400

        try:
            decoded_token = jwt.decode(token, app.secret_key, algorithms=["HS256"])
            user_id = decoded_token.get('user_id')

            with get_db_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute("""
                        SELECT * FROM alpha.Password_Reset 
                        WHERE user_id = %s AND reset_token = %s AND expires_at > %s
                    """, (user_id, token, datetime.datetime.utcnow()))
                    
                    token_data = cursor.fetchone()
                    
                    if not token_data:
                        return jsonify({"error": "Invalid or expired token"}), 400

                    hashed_password = generate_password_hash(new_password)

                    cursor.execute("""
                        UPDATE alpha.User_Details 
                        SET password_hash = %s  
                        WHERE user_id = %s
                    """, (hashed_password, user_id))

                    cursor.execute("DELETE FROM alpha.Password_Reset WHERE user_id = %s", (user_id,))
                    conn.commit()

                    return jsonify({"message": "Password has been reset successfully!"}), 200

        except jwt.ExpiredSignatureError:
            return jsonify({"error": "The token has expired"}), 400
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 400
        except Exception as e:
            print(f"Error: {e}")
            return jsonify({"error": "An error occurred while resetting the password"}), 500

# Initialize and start the scheduler
scheduler = BackgroundScheduler()
scheduler.add_job(func=update_movie_list, trigger="interval", hours=24)
scheduler.start()

if __name__ == '__main__':
    app.run(debug=True)
