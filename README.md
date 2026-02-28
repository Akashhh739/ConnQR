<div align="center">

# 🎟️ ConQR
### *Stop ticket scams before they happen.*

![Python](https://img.shields.io/badge/Python-3.11-blue?style=flat-square&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.133-009688?style=flat-square&logo=fastapi)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=flat-square&logo=postgresql)

> **"I spotted a real-world scam and built a real-world solution in days."**

</div>

---

## 💡 The Problem

You find a concert ticket being resold on WhatsApp. You pay. You show up on event day. Someone else is already inside with the **exact same QR code**.

You just got scammed.

This happens because QR codes are just images — anyone can screenshot and sell the same one to 10 different buyers. There's no way to know before you pay.

**ConQR solves this.**

---

## 🧠 How I Thought Through It

```
OBSERVE  → QR tickets are just image files. Infinitely shareable, zero traceability.
IDENTIFY → There's no public registry to verify if a QR has already been sold.
DESIGN   → Two roles: Sellers list their QR. Buyers check before they pay.
BUILD    → FastAPI backend decodes QR from image + PostgreSQL stores registrations.
REFINE   → Normalize & deduplicate QR values at the data layer. No bypasses.
```

This is how I approach every problem — curiosity first, code second.

---

## 🖥️ How It Works

```
 ┌──────────────────────────────────────────────────────┐
 │                      ConQR UI                        │
 │                                                      │
 │   [ 🔍 Check Before Buying ]  [ 📋 Register Mine ]  │
 │                                                      │
 │   ┌──────────────────────────────────────────────┐  │
 │   │  Drop your QR image here to check it  ⬆     │  │
 │   └──────────────────────────────────────────────┘  │
 │               [ Check This QR ]                      │
 │                                                      │
 │   ✅ SAFE TO BUY — Not in our system. Looks legit.  │
 │          — or —                                      │
 │   🚨 DO NOT BUY — Already registered.               │
 │      Seller may be scamming multiple buyers.         │
 └──────────────────────────────────────────────────────┘
```

### The Flow

| Who | What they do | Why |
|---|---|---|
| **Seller** | Registers their QR on ConQR | Proves they legitimately listed it once |
| **Buyer** | Uploads the QR before paying | Instantly sees if the ticket is clean or already listed |
| **Scammer** | Tries to sell the same QR twice | Second buyer is warned — **DO NOT BUY** |

---

## ⚡ Features

| | Feature | Description |
|---|---|---|
| 🔍 | **Buyer Verification** | Upload a QR image — get an instant SAFE or SCAM verdict |
| 📋 | **Seller Registration** | List your ticket QR to build buyer trust |
| 🚨 | **Duplicate Detection** | Same QR registered twice? Blocked at the database level |
| ⚡ | **Image-Based Decode** | Uses OpenCV to read QR codes from photos — no manual input |
| 🌐 | **Zero Login Required** | No accounts, no friction — just upload and check |

---

## 🛠 Tech Stack

**Frontend**
- React 19 + Vite — fast, modern SPA
- Vanilla CSS — glassmorphism dark mode
- Google Fonts (Inter) — clean typography

**Backend**
- FastAPI — async Python web framework
- OpenCV (`cv2`) — QR code decoding from images
- PostgreSQL + SQLAlchemy — persistent, relational data store
- Uvicorn — ASGI server

---

## 📁 Project Structure

```
ConQR/
├── app/
│   ├── main.py          # FastAPI routes (/register-image, /verify-image)
│   ├── models.py        # SQLAlchemy DB models (User, RegisteredQR)
│   ├── services.py      # Business logic (register_qr, verify_qr)
│   ├── qr_utils.py      # OpenCV QR decoder
│   └── database.py      # DB connection + session factory
├── frontend/
│   └── src/
│       ├── App.jsx       # Main UI — Check & Register tabs
│       ├── App.css       # Full design system (glassmorphism)
│       └── index.css     # Global styles + CSS variables
├── requirements.txt
├── start.sh              # Runs both servers with one command
└── README.md
```

---

## 📦 Setup & Run

### Prerequisites
- Python 3.11+, Node.js 18+, PostgreSQL running locally
- Set your `DATABASE_URL` in a `.env` file

### Quickstart
```bash
git clone https://github.com/your-username/ConQR.git
cd ConQR

# Start everything
./start.sh
```

### Manual Setup
```bash
# Backend
source conquer/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload   # → http://127.0.0.1:8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev                     # → http://localhost:5173
```

---

## 🗺️ Roadmap

- [ ] Webcam-based QR scanning (no image upload needed)
- [ ] Public shareable ticket verification link
- [ ] Seller reputation score
- [ ] Admin dashboard with fraud analytics
- [ ] Mobile PWA support

---

## 👤 About Me

I don't wait for interesting problems — I find them in everyday life and build solutions before anyone asks me to.

ConQR started as a 5-minute observation at a concert and became a full-stack product within days.

---

<div align="center">

*Made with curiosity, caffeine, and a stubborn refusal to accept scams.* ☕

