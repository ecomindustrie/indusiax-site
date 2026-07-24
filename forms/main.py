"""Indusiax Forms — micro-service de réception des formulaires du site vitrine.

Reçoit les demandes d'essai (/api/essai) et les messages de contact
(/api/contact), les stocke en SQLite et — si SMTP est configuré — envoie
une notification email à l'éditeur. Sans SMTP, les demandes restent
consultables via GET /api/demandes?token=<ADMIN_TOKEN>.

Anti-abus : pot de miel « site_web » (rempli par les robots → accepté en
silence mais marqué spam), limitation à 10 requêtes/heure/IP.
"""
import json
import os
import smtplib
import sqlite3
import time
from collections import defaultdict, deque
from datetime import datetime, timezone
from email.message import EmailMessage
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, EmailStr

DB_PATH = os.getenv("FORMS_DB", "/data/demandes.db")
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "")

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
NOTIFY_TO = os.getenv("NOTIFY_TO", "contact@indusiax.com")
NOTIFY_FROM = os.getenv("NOTIFY_FROM", SMTP_USER or "contact@indusiax.com")

app = FastAPI(title="Indusiax Forms", docs_url=None, redoc_url=None)

_hits: dict[str, deque] = defaultdict(deque)  # IP -> horodatages (fenêtre 1 h)


def _init_db():
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as c:
        c.execute("""CREATE TABLE IF NOT EXISTS demandes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            kind TEXT NOT NULL,
            payload TEXT NOT NULL,
            spam INTEGER DEFAULT 0,
            created_at TEXT NOT NULL)""")
        c.execute("""CREATE TABLE IF NOT EXISTS newsletter (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            created_at TEXT NOT NULL)""")


_init_db()


def _rate_limit(request: Request):
    ip = (request.headers.get("x-forwarded-for") or request.client.host or "?").split(",")[0].strip()
    now = time.time()
    q = _hits[ip]
    while q and now - q[0] > 3600:
        q.popleft()
    if len(q) >= 10:
        raise HTTPException(429, "Trop de demandes — réessayez dans une heure ou écrivez à contact@indusiax.com")
    q.append(now)


def _store(kind: str, payload: dict, spam: bool) -> int:
    with sqlite3.connect(DB_PATH) as c:
        cur = c.execute(
            "INSERT INTO demandes (kind, payload, spam, created_at) VALUES (?,?,?,?)",
            (kind, json.dumps(payload, ensure_ascii=False), int(spam),
             datetime.now(timezone.utc).isoformat()))
        return cur.lastrowid


def _notify(subject: str, body: str):
    """Notification email best-effort : jamais bloquante pour le visiteur."""
    if not SMTP_HOST:
        return
    try:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = NOTIFY_FROM
        msg["To"] = NOTIFY_TO
        msg.set_content(body)
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as s:
            s.starttls()
            if SMTP_USER:
                s.login(SMTP_USER, SMTP_PASS)
            s.send_message(msg)
    except Exception:
        pass  # la demande est en base : l'email n'est qu'un confort


class EssaiIn(BaseModel):
    produit: str
    societe: str
    nom: str
    email: EmailStr
    telephone: str = ""
    effectif: str = ""
    activite: str = ""
    message: str = ""
    site_web: str = ""  # pot de miel — humain = vide


class ContactIn(BaseModel):
    nom: str
    email: EmailStr
    societe: str = ""
    message: str
    site_web: str = ""  # pot de miel


class RappelIn(BaseModel):
    nom: str
    societe: str
    telephone: str
    creneau: str = ""      # matin / midi / après-midi / peu importe
    produit: str = ""      # intérêt éventuel (stator/rotor/vector/flux/suite/"")
    site_web: str = ""     # pot de miel


@app.post("/api/essai")
def essai(data: EssaiIn, request: Request):
    _rate_limit(request)
    if data.produit not in ("stator", "rotor", "suite"):
        raise HTTPException(400, "Produit inconnu.")
    spam = bool(data.site_web.strip())
    payload = data.model_dump(exclude={"site_web"})
    rid = _store("essai", payload, spam)
    if not spam:
        _notify(
            f"[Indusiax] Demande d'essai #{rid} — {data.produit} — {data.societe}",
            "Nouvelle demande d'essai 30 jours :\n\n"
            + "\n".join(f"{k} : {v}" for k, v in payload.items() if v)
            + "\n\nÀ traiter sous 24 h ouvrées (promesse faite au demandeur).")
    return {"ok": True, "id": rid}


@app.post("/api/contact")
def contact(data: ContactIn, request: Request):
    _rate_limit(request)
    spam = bool(data.site_web.strip())
    payload = data.model_dump(exclude={"site_web"})
    rid = _store("contact", payload, spam)
    if not spam:
        _notify(
            f"[Indusiax] Message de {data.nom}" + (f" ({data.societe})" if data.societe else ""),
            "\n".join(f"{k} : {v}" for k, v in payload.items() if v))
    return {"ok": True, "id": rid}


@app.post("/api/rappel")
def rappel(data: RappelIn, request: Request):
    _rate_limit(request)
    tel = data.telephone.strip()
    if sum(ch.isdigit() for ch in tel) < 8:
        raise HTTPException(400, "Numéro de téléphone incomplet.")
    spam = bool(data.site_web.strip())
    payload = data.model_dump(exclude={"site_web"})
    rid = _store("rappel", payload, spam)
    if not spam:
        _notify(
            f"[Indusiax] Demande de RAPPEL #{rid} — {data.societe} ({tel})",
            "Nouvelle demande de rappel téléphonique :\n\n"
            + "\n".join(f"{k} : {v}" for k, v in payload.items() if v)
            + "\n\nPromesse faite au demandeur : rappel sous 24 h ouvrées, d'industriel à industriel.")
    return {"ok": True, "id": rid}


class NewsletterIn(BaseModel):
    email: EmailStr
    site_web: str = ""  # pot de miel


@app.post("/api/newsletter")
def newsletter(data: NewsletterIn, request: Request):
    _rate_limit(request)
    if data.site_web.strip():
        return {"ok": True}  # robot : réponse silencieuse, rien d'enregistré côté utile
    with sqlite3.connect(DB_PATH) as c:
        try:
            c.execute("INSERT INTO newsletter (email, created_at) VALUES (?,?)",
                       (data.email, datetime.now(timezone.utc).isoformat()))
        except sqlite3.IntegrityError:
            pass  # déjà inscrit — idempotent, pas d'erreur renvoyée au visiteur
    return {"ok": True}


@app.get("/api/demandes")
def liste(token: str = ""):
    """Consultation des demandes par l'éditeur (token ADMIN_TOKEN)."""
    if not ADMIN_TOKEN or token != ADMIN_TOKEN:
        raise HTTPException(403, "Accès refusé.")
    with sqlite3.connect(DB_PATH) as c:
        rows = c.execute(
            "SELECT id, kind, payload, spam, created_at FROM demandes "
            "ORDER BY id DESC LIMIT 200").fetchall()
    return {"demandes": [
        {"id": r[0], "type": r[1], **json.loads(r[2]), "spam": bool(r[3]), "date": r[4]}
        for r in rows]}


@app.get("/api/health")
def health():
    return {"status": "ok", "smtp": bool(SMTP_HOST)}
