# 🦁 The Lindenwood SQL Mystery: The Missing Golden Lion

An authentic, immersive forensic database mystery designed specifically for **Lindenwood University** students, revolving around the campus in St. Charles, Missouri.

---

## 🔍 The Story

A revered university trophy has gone missing, and campus security needs your forensic SQL skills:

> **The Golden Lion Trophy** was last seen at Lindenwood University on **October 18, 2025**. The trophy disappeared sometime during the evening from the Spellmann Campus Center, but security does not know exactly when or who took it.
>
> Unfortunately, the original incident report has been misplaced.
>
> You remember only three things:
> - **Incident**: Theft of the Golden Lion Trophy (`type = 'theft'`)
> - **Date**: October 18, 2025 (`date = 20251018`)
> - **Location**: Lindenwood University (`city = 'Lindenwood'`)

Your mission: Retrieve the incident report from the campus security database, follow the clues across witness interviews, gym memberships, car license plates, and event check-ins, and find out who took the Golden Lion!

---

## 🏛️ Database Relational Schema (8 Tables)

The mystery runs on an 8-table relational SQLite database (`lindenwood-mystery.db`):
- `crime_scene_report`: Incident logs and security reports.
- `person`: Registered campus individuals with names, addresses, and license IDs.
- `interview`: Transcripts from witness and suspect interrogations.
- `get_fit_now_member`: Campus fitness facility memberships and tiers.
- `get_fit_now_check_in`: Gym turnstile badge check-in logs.
- `drivers_license`: Department of Motor Vehicles registration records (plates, cars, physical traits).
- `facebook_event_checkin`: Social event check-ins and concert attendance.
- `income`: Annual income records linked by SSN.
- `solution`: Automated database validation trigger for suspects.

---

## 🕵️‍♂️ Investigation Progression

1. **Starting Point**:
   ```sql
   SELECT * FROM crime_scene_report WHERE date = 20251018 AND city = 'Lindenwood';
   ```

2. **Witness Statements**:
   - Witness 1: Lives at the *last house on Northwestern Dr*.
     ```sql
     SELECT * FROM person WHERE address_street_name = 'Northwestern Dr' ORDER BY address_number DESC LIMIT 1;
     ```
     *(Note: 50 residents live on Northwestern Dr, so ordering by address number is required to find Morty Schapiro at 4919!)*
   - Witness 2: *Annabel* living on *Franklin Ave*.
     ```sql
     SELECT * FROM person WHERE name LIKE 'Annabel%' AND address_street_name = 'Franklin Ave';
     ```

3. **Stage 1 &mdash; The Trophy Thief**:
   - Querying the witness interviews in `interview` reveals:
     - The suspect carried a "Get Fit Now Gym" bag starting with `48Z` (gold member) and fled in a car with plate containing `H42W`.
     - Annabel recognized him from a workout on January 9 (`20180109`).
   - Cross-referencing `get_fit_now_member`, `get_fit_now_check_in`, and `drivers_license` identifies the culprit: **Jeremy Bowers**.
   - Submitting `Jeremy Bowers` triggers his confession: he was hired by a wealthy woman!

4. **Stage 2 &mdash; The Mastermind**:
   - Interrogating Jeremy reveals the mastermind: a wealthy woman (height 65"-67", red hair, driving a Tesla Model S) who attended the SQL Symphony Concert 3 times in December 2017.
   - Cross-referencing `facebook_event_checkin`, `drivers_license`, and `income` unmasks: **Miranda Priestly**!

---

## 🚀 How to Run & Play

### Play Online on GitHub Pages
👉 **`https://sagarkalauni.github.io/lindenwood-golden-lion-mystery/`**

### Run Locally (Windows)
Double-click `run_game.bat` or run:
```bash
python serve.py
```
This launches a local web server and opens `http://localhost:8000/index.html`.

---

## 🎓 Course Project Features
- **Student Detective Authentication**: Captures student name, ID, email, and section.
- **Top-to-Bottom Story Flow**: Includes multiple inline runnable code chunks matching the Knight Lab architecture.
- **Submission Hub**:
  - One-click **Print / Save PDF Report** with an official verification hash.
  - One-click **Download Submission JSON** containing the complete query audit log.
  - One-click **Copy Text for Canvas LMS**.

---

## 📜 Credits & License
Created by **Sagar Kalauni** for **Lindenwood University** computer science and data science curricula. Inspired by the open-source mystery concept from Northwestern University Knight Lab.
