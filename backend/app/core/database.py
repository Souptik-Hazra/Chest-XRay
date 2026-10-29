import sqlite3
import json
from typing import Optional, List, Dict, Any
from .config import settings

def get_db():
    conn = sqlite3.connect(str(settings.DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS analyses (
            id TEXT PRIMARY KEY,
            filename TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            predicted_class TEXT NOT NULL,
            confidence REAL NOT NULL,
            confidence_level TEXT NOT NULL,
            probabilities_json TEXT NOT NULL,
            findings_json TEXT NOT NULL,
            multiview_json TEXT NOT NULL,
            report_json TEXT NOT NULL,
            gradcam_url TEXT,
            status TEXT NOT NULL DEFAULT 'completed'
        )
    """)
    conn.commit()
    conn.close()

def save_analysis(record: Dict[str, Any]):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO analyses (
            id, filename, timestamp, predicted_class, confidence, confidence_level,
            probabilities_json, findings_json, multiview_json, report_json, gradcam_url, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        record["id"],
        record["filename"],
        record["timestamp"],
        record["predicted_class"],
        record["confidence"],
        record["confidence_level"],
        json.dumps(record.get("probabilities", [])),
        json.dumps(record.get("findings", {})),
        json.dumps(record.get("multiview", [])),
        json.dumps(record.get("report", {})),
        record.get("gradcam_url"),
        record.get("status", "completed")
    ))
    conn.commit()
    conn.close()

def get_all_analyses(limit: int = 20, offset: int = 0) -> List[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, filename, timestamp, predicted_class, confidence, confidence_level, findings_json, status
        FROM analyses
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
    """, (limit, offset))
    rows = cursor.fetchall()
    conn.close()
    
    results = []
    for r in rows:
        findings = json.loads(r["findings_json"]) if r["findings_json"] else {}
        results.append({
            "id": r["id"],
            "date": r["timestamp"],
            "filename": r["filename"],
            "predictedClass": r["predicted_class"],
            "confidence": r["confidence"],
            "confidenceLevel": r["confidence_level"],
            "status": r["status"].capitalize(),
            "oodFlag": findings.get("oodDetected", False)
        })
    return results

def get_analysis_by_id(analysis_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM analyses WHERE id = ?", (analysis_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return None
        
    return {
        "id": row["id"],
        "filename": row["filename"],
        "timestamp": row["timestamp"],
        "predictedClass": row["predicted_class"],
        "confidence": row["confidence"],
        "confidenceLevel": row["confidence_level"],
        "probabilities": json.loads(row["probabilities_json"]),
        "findings": json.loads(row["findings_json"]),
        "multiview": json.loads(row["multiview_json"]),
        "report": json.loads(row["report_json"]),
        "gradcamUrl": row["gradcam_url"],
        "status": row["status"]
    }
