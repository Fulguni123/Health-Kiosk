# Smart Rural Telemedicine & AI Health Kiosk

A touchscreen kiosk web application designed for rural and low-literacy populations to access healthcare. Features multilingual voice symptom logging, rule-based offline AI triage, adaptive bandwidth WebRTC video consultation, doctor and admin dashboards, and offline-first synchronization.

---

## Tech Stack
- **Frontend**: React (Vite), React Router v7, Axios, Lucide Icons, Recharts, Socket.io-client.
- **Backend**: Node.js + Express + Socket.io (WebRTC signaling & live emergency alerts).
- **Database**: MongoDB (Mongoose) with an automatic zero-crash In-Memory Fallback Store if MongoDB is not running locally.
- **Speech**: Web Speech API (`SpeechRecognition` & `SpeechSynthesis`).
- **Languages**: English (`en-IN`), Hindi (`hi-IN`), Assamese (`as-IN` / `bn-IN`).

---

## Project Structure
```text
Health-Kiosk/
├── package.json              # Root orchestration scripts
├── README.md                 # Project documentation & run guide
├── client/                   # Vite + React Frontend
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── components/       # Shared UI (Navbar, AudioButton, SOS)
│       ├── context/          # PatientContext (vitals, symptoms, triage, voice)
│       ├── hooks/            # useNetworkSpeed (navigator.connection + demo simulation)
│       ├── locales/          # translations.js (English, Hindi, Assamese)
│       ├── pages/            # Home, SymptomLogger, TriageResult, VideoConsult, PrescriptionView, DoctorDashboard, AdminDashboard
│       ├── App.jsx           # React Router route registry
│       ├── main.jsx
│       └── index.css         # Kiosk styling & touch accessibility (min 72px targets)
└── server/                   # Express + Socket.io Backend
    ├── package.json
    ├── server.js             # Express app, Socket.io server & DB bootstrapper
    ├── routes/api.js         # REST endpoints (triage, queue, pharmacy, stats)
    ├── services/             # db.js (Mongo + InMemory fallback), triageService.js (Rule engine)
    └── sockets/              # signalingHandler.js (WebRTC relay & emergency broadcast)
```

---

## How to Run

### 1. Install Dependencies (Done)
If running on a fresh clone:
```powershell
npm run install:all
```
*(Or individually: `cd client && npm install` and `cd server && npm install`)*

### 2. Start the Backend Server
In your first terminal:
```powershell
npm run dev:server
```
- Server runs on **`http://localhost:5000`**
- API Health Check: `http://localhost:5000/api/health`
- *Note:* If MongoDB is not running locally, the server automatically starts the **In-Memory Resilient Store** so testing is never interrupted.

### 3. Start the Frontend Client
In your second terminal:
```powershell
npm run dev:client
```
- Frontend opens at **`http://localhost:5173`**

---

## Available Routes
| Route | Page | Purpose |
|---|---|---|
| `/` | **Home** | Accessible kiosk landing page with language selector, voice guide, emergency SOS, and network speed badge. |
| `/symptoms` | **Symptom Logger** | Interactive SVG body map + Web Speech symptom logging (Phase 2). |
| `/triage` | **AI Triage Result** | Deterministic, explainable red/yellow/green triage evaluation (Phase 3). |
| `/consult` | **Video Consult** | Bandwidth-adaptive WebRTC consultation room (Phase 4). |
| `/prescription` | **Prescription** | Visual picture-based dosage instructions + QR code (Phase 5). |
| `/doctor` | **Doctor Dashboard**| Live triage waiting queue with real-time emergency alert sound (Phase 5). |
| `/admin` | **Admin Surveillance** | Disease outbreak alerts & village epidemiological charts (Phase 6). |

---

## Testing Phase 1 Features
1. Open `http://localhost:5173` in Google Chrome.
2. **Language Toggle**: Click `English`, `हिन्दी`, or `অসমীয়া` to switch all text and trigger voice confirmation.
3. **Listen to Voice Guide**: Click the audio guidance bar to hear text-to-speech instructions.
4. **Network Quality Pill**: Test the network simulation pills (`Auto`, `Good`, `Slow`, `Very Slow`, `Offline`) in the footer bar.
5. **Touch Navigation**: Tap the big green *"Start Health Checkup"* card to navigate to `/symptoms`.
6. **Emergency SOS**: Tap the red SOS button to trigger an emergency route to `/consult` with state `{ emergency: true }`.
7. **2-Minute Demo Shortcut**: Click *"⚡ 2-Min Demo"* to simulate an Assamese farmer with acute chest pain and jump straight to triage.
