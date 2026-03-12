import ast
from flask import Flask, request, render_template, redirect, jsonify, session
import json
import os
from dotenv import load_dotenv

import src.dataset as dt
import src.database as db

load_dotenv()

CITY_DATASET = dt.fr225
ADMIN_PASSWORD = os.getenv("PASSWORD")


app = Flask(__name__)

app.secret_key = os.getenv("SECRET_KEY") 

_, _, _, distances = dt.calc_city_distances(CITY_DATASET)


def check_city_existence(city):
    return city in dt.get_cities()


def validate_and_parse_route(route):
    input_string = route.strip()
    if not (input_string.startswith('[') and input_string.endswith(']')):
        return [], "Rejected: Input does not structurally look like a list."

    try:
        tree = ast.parse(input_string, mode='eval')
        if not isinstance(tree.body, ast.List):
            return [], f"Rejected: Input is a {type(tree.body).__name__}, not a list."
        for element in tree.body.elts:
            if not (isinstance(element, ast.Constant) and isinstance(element.value, str)):
                 return [], "Rejected: The list contains non-string elements (like numbers or variables)."
            
        input_list = ast.literal_eval(tree)
        
        input_cities = set(input_list)
        valid_cities = set(CITY_DATASET.keys())

        if len(input_cities) != len(valid_cities):
            return [], f"Rejected: Route does not contain all cities."
        
        if valid_cities.issubset(input_cities):
            return input_list, None
        else:
            invalid_cities = input_cities - valid_cities
            return [], f"Rejected: List contains unknown cities: {list(invalid_cities)}"
            
    except SyntaxError:
        return False, "Rejected: Malformed Python syntax."


def calculate_tsp_distance(cities: str):
    distance = dt.get_route_length(distances, cities)
    return distance


# ==========================================
# INDEX PAGE ROUTES
# ==========================================
@app.route('/')
def leaderboard():
    ranked_results = db.get_leaderboard()
    best_route_string = ranked_results[0]['route'] if ranked_results else None
    js_cities = {str(k): {"x": v[2], "y": v[3]} for k, v in CITY_DATASET.items()}
    return render_template(
        'index.html', 
        results=ranked_results, 
        best_route=best_route_string, 
        cities=json.dumps(js_cities),
        alg_options=dt.BASE_ALGORITHMS
    )


@app.route('/submit', methods=['POST'])
def submit():
    login = request.form['login']
    algorithm = request.form['algorithm']
    description = request.form.get('description', '')
    route_string = request.form['route'] 

    if not algorithm in dt.BASE_ALGORITHMS:
        return jsonify({"status": "error", "message": "Invalid Base algorithm value"}), 400
    
    # validation and parsing
    route, error_message = validate_and_parse_route(route_string)
    
    # If validation fails, show the error
    if error_message:
        return jsonify({"status": "error", "message": error_message}), 400

    # If it passes, calculate distance and save it to the database
    calculated_distance = calculate_tsp_distance(route)
    db.write_data(login, algorithm, description, calculated_distance, route_string)
    
    return jsonify({"status": "success"}), 200


@app.route('/history/<login>')
def get_history(login):
    raw_results = db.get_history(login)
    history_data = [dict(row) for row in raw_results]
    return jsonify(history_data), 200


# ==========================================
# ADMIN AUTHENTICATION ROUTES
# ==========================================

@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        if request.form.get('password') == ADMIN_PASSWORD:
            session['is_admin'] = True 
            return redirect('/admin')
        else:
            error = "Incorrect password. Nice try!"
            
    return render_template('login.html', error=error)


@app.route('/logout')
def logout():
    session.pop('is_admin', None)
    return redirect('/')



# ==========================================
# ADMIN DASHBOARD ROUTES
# ==========================================

@app.route('/admin')
def admin():
    if not session.get('is_admin'):
        return redirect('/login')

    conn = db.get_db_connection()
    # Fetch EVERY submission, ordered by newest first
    query = 'SELECT * FROM results ORDER BY submission_time DESC'
    all_results = conn.execute(query).fetchall()
    conn.close()
    
    return render_template('admin.html', results=all_results)


@app.route('/admin/delete/<int:submission_id>', methods=['POST'])
def admin_delete(submission_id):
    if not session.get('is_admin'):
        return redirect('/login')
    
    db.remove_submission(submission_id)
    return redirect('/admin')


@app.route('/admin/clear', methods=['POST'])
def admin_clear():
    if not session.get('is_admin'):
        return redirect('/login')

    db.clear_database()
    return redirect('/admin')


if __name__ == '__main__':
    app.run(debug=True)