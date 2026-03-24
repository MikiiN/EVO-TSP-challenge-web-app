# TSP Challenge Leaderboard

A full-stack web application built to track, rank, and visualize student submissions for a Traveling Salesperson Problem (TSP) algorithm competition in the EVO course at FIT BUT. 

This platform allows students to submit their algorithm's route and distance, instantly seeing how they stack up against their classmates on a live leaderboard with interactive statistical charts.

## Features
* **Live Leaderboard:** Automatically ranks submissions by lowest distance.
* **Route Mapping:** Draws the submitted coordinate route on a canvas map.
* **Admin Dashboard:** Manage and clear database submissions.

## Tech Stack
* **Backend:** Python 3, Flask, SQLite3
* **Frontend:** HTML5, CSS3 (Bootstrap 5), JavaScript

---

## Local development setup

Follow these steps to run the application on your local machine.

### 1. Clone the repository
```bash
git clone https://github.com/MikiiN/EVO-TSP-challenge-web-app
cd EVO-TSP-challenge-web-app
```

### 2. Set up a virtual environment (Optional but recommended)
```bash
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure environment variables
Create a `.env` file in the root directory and add your secret keys.
```
PASSWORD=your_admin_password
SECRET_KEY=your_secret_key
DB=your_db_name
```

### 5. Seed the database
If you want to populate the application with dummy data for testing.
```bash
python seed_db.py
```

### Run the application
```bash
python app.py
```
Open your browser and navigate to `http://127.0.0.1:5000`.
