import sqlite3
import random

# assign a (min_distance, max_distance) to each algorithm to simulate realistic variance
ALGORITHMS = [
    ("Genetic Algorithm", 8500, 13000),
    ("Ant Colony Optimization", 8300, 10500),
    ("Particle Swarm", 9000, 14000),     
    ("Metropolis Algorithm", 8000, 12000),
    ("Evolutionary Algorithm", 10000, 15000),
    ("Other", 9000, 16000),
]

LOGINS = ["alice_s", "bob_j", "charlie_99", "diana_opt", "eve_hacker", "frank_tsp", "grace_ai", "hank_code"]
DESCRIPTIONS = [
    "Tweaked the mutation rate to 0.05", 
    "Standard vanilla implementation.", 
    "", 
    "Used a custom heuristic for the starting node.", 
    "", 
    "Crashed a few times but finally got a good route!"
]

# A generic, safely formatted route string that won't break your frontend map
DUMMY_ROUTE = "['Angers', 'Paris', 'Lyon', 'Marseille', 'Grenoble']"

def seed_database(num_records=150):
    print(f"Planting {num_records} dummy submissions into the database...")
    
    conn = sqlite3.connect('tsp_results.db')
    cursor = conn.cursor()
    
    for _ in range(num_records):
        login = random.choice(LOGINS)
        algo_name, min_dist, max_dist = random.choice(ALGORITHMS)
        
        # Generate a random float distance based on the algorithm's specific range
        distance = random.uniform(min_dist, max_dist)
        
        description = random.choice(DESCRIPTIONS)
        
        cursor.execute('''
            INSERT INTO results (login, algorithm, description, distance, route) 
            VALUES (?, ?, ?, ?, ?)
        ''', (login, algo_name, description, distance, DUMMY_ROUTE))
        
    conn.commit()
    conn.close()
    
    print("Success! Database is now full of test data.")


if __name__ == '__main__':
    seed_database()