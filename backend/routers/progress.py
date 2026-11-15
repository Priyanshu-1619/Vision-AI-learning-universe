"""
Learner progress persistence router — supports SQLite / Render Persistent Disk / PostgreSQL.
Synchronizes user progress across sessions and deployments.
"""
from __future__ import annotations

import os
import sqlite3
import json
from pathlib import Path
from typing import Any, Dict
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/progress", tags=["progress"])

DATA_DIR = Path(os.environ.get("DATA_DIR", Path(__file__).resolve().parent.parent / "data"))
DB_PATH = DATA_DIR / "learner_progress.db"

def get_db_connection():
    """Create SQLite connection and initialize schema if needed."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    with conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS learner_progress (
                user_id TEXT NOT NULL,
                topic_id TEXT NOT NULL,
                domain TEXT,
                status TEXT,
                record_json TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, topic_id)
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS math_progress (
                user_id TEXT NOT NULL,
                math_id TEXT NOT NULL,
                status TEXT,
                record_json TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, math_id)
            )
        """)
    return conn


class ProgressSyncRequest(BaseModel):
    user_id: str = Field(default="learner_default", alias="userId")
    records: Dict[str, Any] = Field(default_factory=dict)
    math_records: Dict[str, Any] = Field(default_factory=dict, alias="mathRecords")

    model_config = {"populate_by_name": True}


@router.get("/{user_id}")
async def get_user_progress(user_id: str):
    """Retrieve full persisted progress for a user."""
    try:
        conn = get_db_connection()
        with conn:
            cur = conn.execute(
                "SELECT topic_id, record_json FROM learner_progress WHERE user_id = ?",
                (user_id,)
            )
            records = {row["topic_id"]: json.loads(row["record_json"]) for row in cur.fetchall()}

            cur_m = conn.execute(
                "SELECT math_id, record_json FROM math_progress WHERE user_id = ?",
                (user_id,)
            )
            math_records = {row["math_id"]: json.loads(row["record_json"]) for row in cur_m.fetchall()}

        return {
            "userId": user_id,
            "records": records,
            "mathRecords": math_records,
            "count": len(records),
            "mathCount": len(math_records),
        }
    except Exception as exc:
        return {
            "userId": user_id,
            "records": {},
            "mathRecords": {},
            "error": str(exc),
        }


@router.post("/sync")
async def sync_user_progress(req: ProgressSyncRequest):
    """Upsert learner progress records to persistent database."""
    try:
        conn = get_db_connection()
        with conn:
            for topic_id, record in req.records.items():
                domain = record.get("domain", "")
                status = record.get("status", "completed")
                conn.execute("""
                    INSERT INTO learner_progress (user_id, topic_id, domain, status, record_json, updated_at)
                    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(user_id, topic_id) DO UPDATE SET
                        domain = excluded.domain,
                        status = excluded.status,
                        record_json = excluded.record_json,
                        updated_at = CURRENT_TIMESTAMP
                """, (req.user_id, topic_id, domain, status, json.dumps(record)))

            for math_id, m_record in req.math_records.items():
                m_status = m_record.get("status", "completed")
                conn.execute("""
                    INSERT INTO math_progress (user_id, math_id, status, record_json, updated_at)
                    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(user_id, math_id) DO UPDATE SET
                        status = excluded.status,
                        record_json = excluded.record_json,
                        updated_at = CURRENT_TIMESTAMP
                """, (req.user_id, math_id, m_status, json.dumps(m_record)))

        return {
            "status": "ok",
            "syncedTopics": len(req.records),
            "syncedMath": len(req.math_records),
            "saved_records": len(req.records) + len(req.math_records),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database sync failed: {str(exc)}") from exc
