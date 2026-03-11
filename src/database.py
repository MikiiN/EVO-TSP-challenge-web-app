import os
import sqlite3
from dotenv import load_dotenv


load_dotenv()
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, os.getenv("DB"))


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def get_leaderboard():
    conn = get_db_connection()
    query = '''
        SELECT login, algorithm, description, route, MIN(distance) as distance, MAX(submission_time) as submission_time 
        FROM results 
        GROUP BY login 
        ORDER BY distance ASC, submission_time ASC
    '''
    results = conn.execute(query).fetchall()
    conn.close()
    ranked_results = []
    for i in range(len(results)):
        row = dict(results[i]) 
        if i > 0 and row['distance'] == results[i-1]['distance']:
            row['rank'] = ranked_results[-1]['rank']
        else:
            row['rank'] = i + 1
            
        ranked_results.append(row)
    return ranked_results


def write_data(login, algorithm, description, distance, route):
    conn = get_db_connection()
    conn.execute('''
        INSERT INTO results (login, algorithm, description, distance, route) 
        VALUES (?, ?, ?, ?, ?)
    ''', (login, algorithm, description, distance, route))
    conn.commit()
    conn.close()


def get_history(login):
    conn = get_db_connection()
    query = '''
        SELECT distance, algorithm, description, route, submission_time 
        FROM results 
        WHERE login = ? 
        ORDER BY submission_time DESC
    '''
    raw_results = conn.execute(query, (login,)).fetchall()
    conn.close()
    return raw_results


def remove_submission(id):
    conn = get_db_connection()
    conn.execute('DELETE FROM results WHERE id = ?', (id,))
    conn.commit()
    conn.close()


def clear_database():
    conn = get_db_connection()
    conn.execute('DELETE FROM results')
    conn.commit()
    conn.close()