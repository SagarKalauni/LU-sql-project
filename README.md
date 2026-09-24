# 🦁 The Lindenwood SQL Mystery: The Missing Golden Lion

An authentic, immersive forensic database mystery designed specifically for **Lindenwood University** students, revolving completely around the Lindenwood campus in St. Charles, Missouri.

---

## 🔍 The Story
A revered university trophy has gone missing, and campus security needs your forensic SQL skills:

> **The Golden Lion Trophy** was last seen at Lindenwood University on **October 18, 2025**. The trophy disappeared sometime during the evening from the Spellmann Campus Center, but security does not know exactly when or who took it.
>
> Unfortunately, the original incident report has been misplaced.
>
> You remember only three things:
> - **Date**: October 18, 2025 (`20251018`)
> - **Location**: Lindenwood University
> - **Incident**: Missing Golden Lion Trophy

Your mission: Start by querying the university security database for the incident report, follow the clues across card swipes, student organizations, vehicles, and interviews, and find out who took the Golden Lion!

---

## 🏛️ Campus Database Schema (14 Tables)
The mystery runs on a complete relational SQLite database (`lindenwood-mystery.db`):
- `person` (students, faculty, alumni, staff)
- `student` (majors, class years, GPAs, dorms)
- `faculty_staff` (academic departments, titles, offices)
- `alumni_donor` (graduation year, profession, income, donations)
- `building` (Spellmann, Roemer, Harmon, Evans Commons, Scheidegger, LARC, etc.)
- `room` (labs, offices, lounges, gala halls)
- `organization` (Robotics Club, Cyber Forensics, SGA, etc.)
- `organization_member` (roles, join dates)
- `vehicle` (makes, models, colors, license plates, permit types)
- `parking_record` (lots, entry and exit times)
- `card_swipe_access` (badge scans at building/room doors with timestamps)
- `campus_event` (events, times, locations)
- `event_attendance` (check-in records)
- `security_report` (incident logs and security reports)
- `interview` (witness and suspect interview transcripts)
- `solution` (automated validation trigger)

---

## 🕵️‍♂️ Investigation Progression (Hidden Two-Stage Mystery)
1. **Starting Point**:
   ```sql
   SELECT * FROM security_report WHERE date = 20251018;
   ```
2. **Witness Statements**:
   - Witness 1 (Samantha Reed): Spellmann Info Desk &mdash; notices a member of the Lindenwood Robotics Club carrying a heavy duffel bag toward Evans Commons lot and leaving in a silver Honda with plate starting with `LU-8`.
   - Witness 2 (Derek Zhang): North exit lounge &mdash; observes card swipe at Spellmann side door at 8:38 PM (`2038`).
3. **Stage 1 &mdash; The Thief**:
   - Cross-referencing `card_swipe_access`, `organization_member`, `vehicle`, and `parking_record` identifies the culprit: **Marcus Vance**.
   - Entering `Marcus Vance` into the solution verifier triggers his confession: he was hired for $15,000 by an influential alumna to steal the trophy!
4. **Stage 2 &mdash; The Mastermind**:
   - Querying Marcus's interview transcript (`interview` table) reveals details about the mastermind: she attended the President's Alumni & Donor Gala on Oct 17, drives a red Porsche 911 with a vanity plate containing 'GOLD', and has an annual income exceeding $750,000.
   - Cross-referencing `campus_event`, `event_attendance`, `vehicle`, `alumni_donor`, and `person` exposes: **Victoria Sterling**!
   - Entering `Victoria Sterling` closes the case with a campus celebration!

---

## 🚀 How to Run & Play

### Play Online on GitHub Pages
👉 **`https://sagarkalauni.github.io/lindenwood-golden-lion-mystery/`**

### Run Locally (Windows)
Double-click `run_game.bat` or run:
```bash
python serve.py
```
This starts a lightweight server and opens `http://localhost:8000/index.html` in your browser.

---

## 🎓 Course Project Features
- **Student Authentication Modal**: Captures student name, ID, email, and course code.
- **Automatic Session Persistence**: All progress and query history stored in `localStorage`.
- **Submission Hub**:
  - One-click **Print / Save PDF Report** with an official verification hash.
  - One-click **Download Submission JSON** containing the complete query audit log.
  - One-click **Copy Text for Canvas LMS**.

---

## 📜 Credits & License
Created by **Sagar Kalauni** for **Lindenwood University** forensic data science and database curricula. Inspired by the educational mystery concept from the Northwestern University Knight Lab.
