# SkillStack – Personal Skill-Building Tracker  

SkillStack is a clean and modern application that helps users track skills, monitor learning progress, log daily activities, and use AI tools for recommendations and summaries.

---

## Features

### Skill Management  
- Add, edit, delete skills  
- Track hours, difficulty, and progress  
- Add notes and platforms (Coursera, Udemy, etc.)  
- Search and filter skills instantly  

### Activity Timeline  
- Add daily learning events  
- View a list-based timeline  
- See a 7-day activity streak bar

### AI Tools  
- Get recommended resources for any skill  
- Summarize long notes using AI  

### Modern Dashboard  
- Sidebar statistics  
- Clean card-based UI  
- Quick Tips panel  
- Responsive and minimal design

---

## Tech Stack

### Frontend
- React + Vite  
- Axios for API calls  
- Modern CSS and responsive layouts  

### Backend
- FastAPI  
- SQLite database  
- Pydantic models  
- AI endpoints for summarization and recommendations  

---

## Project Structure

```
skillstack/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── ai.py
│   │   └── __init__.py
│   └── skillstack.db
│
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    └── package.json
```

---

## Setup Instructions

### 1️. Backend Setup (FastAPI)

**Step 1:** Open terminal inside:

```
skillstack/backend/
```

Step 2: Install dependencies:

```
pip install fastapi uvicorn pydantic sqlite-utils
```

Step 3: Run backend server:

```
uvicorn app.main:app --reload
```

Backend starts at:

```
http://localhost:8000
```

---

### 2️. Frontend Setup (React + Vite)

Step 1: Open terminal inside:

```
skillstack/frontend/
```

Step 2: Install dependencies:

```
npm install
```

Step 3: Create `.env` file in frontend folder:

```
VITE_API_URL=http://localhost:8000
```

Step 4: Start frontend:

```
npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

---

Author  
Mohammed Jasil M K  
SkillStack – 2025
  
