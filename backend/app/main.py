from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import sqlite3
import traceback
import os

from fastapi.middleware.cors import CORSMiddleware

ai_module = None
try:
    import app.ai as ai_module 
except Exception as e:
    print("Warning: unable to import app.ai router. AI endpoints will be disabled.")
    traceback.print_exc()

app = FastAPI(title="SkillStack - Robust with safe AI import")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],     
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if ai_module is not None:
    try:
        app.include_router(ai_module.router, prefix="/ai")
    except Exception:
        print("Warning: failed to include AI router. AI endpoints will be disabled.")
        traceback.print_exc()

DB = os.path.join(os.path.dirname(__file__), "..", "skillstack.db")
DB = os.path.normpath(DB)

def get_conn():
    return sqlite3.connect(DB, check_same_thread=False)

def table_columns(table_name: str):
    conn = get_conn()
    c = conn.cursor()
    try:
        c.execute(f"PRAGMA table_info({table_name})")
        cols = [row[1] for row in c.fetchall()] 
    except Exception:
        cols = []
    finally:
        conn.close()
    return cols

def init_db():
    """
    Create table if missing and apply lightweight migrations (add missing columns)
    """
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
    CREATE TABLE IF NOT EXISTS skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        resource_type TEXT,
        platform TEXT,
        progress TEXT DEFAULT 'started',
        hours_spent REAL DEFAULT 0,
        difficulty INTEGER DEFAULT 3,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)
    conn.commit()

    cols = table_columns("skills")
    if "difficulty" not in cols:
        try:
            c.execute("ALTER TABLE skills ADD COLUMN difficulty INTEGER DEFAULT 3")
            conn.commit()
            print("DB: Added missing column 'difficulty' to skills table.")
        except Exception as e:
            print("DB: Failed to add 'difficulty' column:", e)
    conn.close()

init_db()

def init_events_table():
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
    CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        skill_id INTEGER,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        duration_minutes INTEGER DEFAULT 0,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)
    conn.commit()
    conn.close()

init_events_table()

class SkillIn(BaseModel):
    name: str
    resource_type: str = None
    platform: str = None
    progress: str = "started"
    hours_spent: float = 0.0
    difficulty: int = 3
    notes: str = ""

class SkillOut(SkillIn):
    id: int

class SkillPatch(BaseModel):
    name: str = None
    resource_type: str = None
    platform: str = None
    progress: str = None
    hours_spent: float = None
    difficulty: int = None
    notes: str = None

class EventIn(BaseModel):
    skill_id: int = None
    title: str
    date: str   
    duration_minutes: int = 0
    notes: str = ""

class EventOut(EventIn):
    id: int

@app.post("/skills/", response_model=SkillOut)
def create_skill(skill: SkillIn):
    try:
        conn = get_conn()
        c = conn.cursor()
        c.execute(
            "INSERT INTO skills (name, resource_type, platform, progress, hours_spent, difficulty, notes) VALUES (?,?,?,?,?,?,?)",
            (skill.name, skill.resource_type, skill.platform, skill.progress, skill.hours_spent, skill.difficulty, skill.notes)
        )
        conn.commit()
        id = c.lastrowid
        conn.close()
        return {**skill.dict(), "id": id}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/skills/", response_model=List[SkillOut])
def list_skills():
    conn = get_conn()
    c = conn.cursor()
    c.execute("SELECT id, name, resource_type, platform, progress, hours_spent, difficulty, notes FROM skills ORDER BY id DESC")
    rows = c.fetchall()
    conn.close()

    items = []
    for r in rows:
        items.append({
            "id": r[0],
            "name": r[1],
            "resource_type": r[2],
            "platform": r[3],
            "progress": r[4],
            "hours_spent": r[5],
            "difficulty": r[6],
            "notes": r[7]
        })
    return items

@app.patch("/skills/{skill_id}", response_model=SkillOut)
def update_skill(skill_id: int, patch: SkillPatch):
    """
    Partial update of a skill. Only fields present in request will be updated.
    """
    try:
        conn = get_conn()
        c = conn.cursor()
        # check exists
        c.execute("SELECT id FROM skills WHERE id = ?", (skill_id,))
        if not c.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail="Skill not found")

        allowed = ["name","resource_type","platform","progress","hours_spent","difficulty","notes"]
        updates = []
        params = []
        for field in allowed:
            val = getattr(patch, field)
            if val is not None:
                updates.append(f"{field} = ?")
                params.append(val)
        if updates:
            params.append(skill_id)
            sql = f"UPDATE skills SET {', '.join(updates)} WHERE id = ?"
            c.execute(sql, params)
            conn.commit()

        c.execute("SELECT id, name, resource_type, platform, progress, hours_spent, difficulty, notes FROM skills WHERE id = ?", (skill_id,))
        row = c.fetchone()
        conn.close()
        return {
            "id": row[0], "name": row[1], "resource_type": row[2], "platform": row[3],
            "progress": row[4], "hours_spent": row[5], "difficulty": row[6], "notes": row[7]
        }
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/skills/{skill_id}")
def delete_skill(skill_id: int):
    try:
        conn = get_conn()
        c = conn.cursor()
        # check exists
        c.execute("SELECT id FROM skills WHERE id = ?", (skill_id,))
        if not c.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail="Skill not found")
        c.execute("DELETE FROM skills WHERE id = ?", (skill_id,))
        conn.commit()
        conn.close()
        return {"deleted": True, "id": skill_id}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/events/", response_model=EventOut)
def create_event(ev: EventIn):
    try:
        conn = get_conn()
        c = conn.cursor()
        c.execute(
            "INSERT INTO events (skill_id, title, date, duration_minutes, notes) VALUES (?,?,?,?,?)",
            (ev.skill_id, ev.title, ev.date, ev.duration_minutes, ev.notes)
        )
        conn.commit()
        eid = c.lastrowid
        conn.close()
        return {**ev.dict(), "id": eid}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/events/", response_model=List[EventOut])
def list_events(start: str = None, end: str = None):
    """
    List events. Optionally filter by date range (YYYY-MM-DD).
    If start/end not provided, returns all events ordered by date DESC.
    """
    conn = get_conn()
    c = conn.cursor()
    if start and end:
        c.execute("SELECT id, skill_id, title, date, duration_minutes, notes FROM events WHERE date BETWEEN ? AND ? ORDER BY date DESC", (start, end))
    else:
        c.execute("SELECT id, skill_id, title, date, duration_minutes, notes FROM events ORDER BY date DESC")
    rows = c.fetchall()
    conn.close()
    return [{"id": r[0], "skill_id": r[1], "title": r[2], "date": r[3], "duration_minutes": r[4], "notes": r[5]} for r in rows]

@app.delete("/events/{event_id}")
def delete_event(event_id: int):
    try:
        conn = get_conn()
        c = conn.cursor()
        c.execute("SELECT id FROM events WHERE id = ?", (event_id,))
        if not c.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail="Event not found")
        c.execute("DELETE FROM events WHERE id = ?", (event_id,))
        conn.commit()
        conn.close()
        return {"deleted": True, "id": event_id}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
