# QA & English Interview Roadmap & Real-Time Progress Tracker

An interactive, multi-subject roadmap and active recall interview preparation web application with real-time Firebase cloud synchronization across mobile and desktop devices.

## 🚀 Live Application
- **Hosting URL:** [https://qa-roadmap-progress-app.web.app](https://qa-roadmap-progress-app.web.app)

---

## 🌟 Key Features

1. **Multi-Subject Learning Catalog:**
   - **QA Engineering:** 7 Tiers, 76 Master Interview Questions spanning Vocabulary, Core Fundamentals, Applied Senior Skills, Leadership, Specialized 2026 Topics, Practical/Live exercises, and Behavioral rounds.
   - **English Fluency:** 9 Comprehensive Foundation Modules covering Parts of Speech, Conversational Sentence Frames, and Workplace Drills.

2. **⚡ Real-Time Two-Way Cloud Synchronization:**
   - Powered by **Firebase Firestore** real-time snapshot listeners (`onSnapshot`).
   - Any progress updates, custom questions, notes, or review streaks made on mobile are instantly updated on desktop in real-time.

3. **🔗 1-Click Universal Device Pairing:**
   - In the **☁️ Cloud Sync** modal, generate or copy a 1-click pairing URL (`?sync=YOUR_KEY`).
   - Opening that link on any device pairs them automatically in 1 tap without copy-pasting keys.

4. **🧠 4-Stage Active Recall Study Engine (Resume Mode):**
   - **Preview:** Read the question and understand the context.
   - **Recall:** Type recollections and practice answers before revealing.
   - **Reveal & Compare:** Compare against standard answers, key bullet points, and ELI5 analogies.
   - **Decide (Spaced Repetition):** Mark as *Still Learning* or *Confident* with automatic 1d, 3d, 7d, 14d, 30d review scheduling.

5. **✍️ Custom Questions & Notes:**
   - Add your own custom interview questions, key ideas, and analogies.
   - Custom additions seamlessly enter the active study queue and are categorized under 'My Custom Additions'.

6. **🎨 Dark / Light Mode & Font Scaling:**
   - High-contrast, gentle slate palettes designed for long study sessions.
   - Adjustable font sizes (Normal, Large, Extra Large).

7. **📅 Analog Clock & Interactive Calendar Popover:**
   - Draggable floating clock widget with live date badge and full calendar navigator.

---

## 📁 Project Structure

```text
QA-RDM/
├── public/
│   ├── index.html              # Main web application & live sync engine
│   └── favicon.svg             # App favicon
├── Subjects/
│   ├── English.docx            # English syllabus & modules source
│   └── Qa/                     # QA interview guides & documents
├── calendar-widget-mac/        # Native macOS companion widget source
├── firebase.json               # Firebase Hosting & Firestore configuration
├── firestore.rules             # Cloud Firestore security rules
├── firestore.indexes.json      # Firestore composite indexes
├── build_multisubject_app.py   # Multi-subject data generator script
├── generate_docx.py            # Word document generator for offline printing
└── requirements.txt            # Python dependencies
```

---

## 🛠️ Development & Deployment

### Run Locally:
```bash
# Open public/index.html in any browser or use a simple HTTP server:
python3 -m http.server 8080 --directory public
```

### Deploy to Firebase Hosting:
```bash
firebase deploy --only hosting
```
