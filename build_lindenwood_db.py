import sqlite3
import random
import os

DB_FILE = 'lindenwood-mystery.db'
if os.path.exists(DB_FILE):
    os.remove(DB_FILE)

conn = sqlite3.connect(DB_FILE)
cur = conn.cursor()

# Enable foreign keys
cur.execute("PRAGMA foreign_keys = ON;")

# ==============================================================================
# 1. CREATE SCHEMAS
# ==============================================================================

cur.executescript("""
CREATE TABLE building (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    campus_zone TEXT,
    floors INTEGER
);

CREATE TABLE room (
    id TEXT PRIMARY KEY,
    building_id TEXT REFERENCES building(id),
    room_number TEXT NOT NULL,
    room_type TEXT NOT NULL
);

CREATE TABLE person (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    phone TEXT,
    ssn TEXT UNIQUE
);

CREATE TABLE student (
    person_id INTEGER PRIMARY KEY REFERENCES person(id),
    student_id_code TEXT UNIQUE NOT NULL,
    major TEXT NOT NULL,
    class_year TEXT NOT NULL,
    gpa REAL,
    dorm_building TEXT,
    dorm_room TEXT
);

CREATE TABLE faculty_staff (
    person_id INTEGER PRIMARY KEY REFERENCES person(id),
    department TEXT NOT NULL,
    title TEXT NOT NULL,
    office_building TEXT,
    office_room TEXT
);

CREATE TABLE alumni_donor (
    person_id INTEGER PRIMARY KEY REFERENCES person(id),
    graduation_year INTEGER,
    profession TEXT,
    annual_income INTEGER,
    total_donations INTEGER
);

CREATE TABLE organization (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    meeting_building TEXT REFERENCES building(id)
);

CREATE TABLE organization_member (
    org_id TEXT REFERENCES organization(id),
    person_id INTEGER REFERENCES person(id),
    role TEXT NOT NULL,
    joined_date INTEGER,
    PRIMARY KEY (org_id, person_id)
);

CREATE TABLE vehicle (
    id INTEGER PRIMARY KEY,
    person_id INTEGER REFERENCES person(id),
    license_plate TEXT UNIQUE NOT NULL,
    car_make TEXT NOT NULL,
    car_model TEXT NOT NULL,
    car_color TEXT NOT NULL,
    permit_type TEXT NOT NULL
);

CREATE TABLE parking_record (
    id INTEGER PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicle(id),
    lot_name TEXT NOT NULL,
    entry_date INTEGER NOT NULL,
    entry_time INTEGER NOT NULL,
    exit_time INTEGER
);

CREATE TABLE campus_event (
    id INTEGER PRIMARY KEY,
    event_name TEXT NOT NULL,
    event_date INTEGER NOT NULL,
    start_time INTEGER NOT NULL,
    end_time INTEGER NOT NULL,
    building_id TEXT REFERENCES building(id),
    description TEXT
);

CREATE TABLE event_attendance (
    event_id INTEGER REFERENCES campus_event(id),
    person_id INTEGER REFERENCES person(id),
    check_in_time INTEGER,
    PRIMARY KEY (event_id, person_id)
);

CREATE TABLE card_swipe_access (
    id INTEGER PRIMARY KEY,
    person_id INTEGER REFERENCES person(id),
    building_id TEXT REFERENCES building(id),
    room_id TEXT REFERENCES room(id),
    swipe_date INTEGER NOT NULL,
    swipe_time INTEGER NOT NULL,
    access_result TEXT NOT NULL
);

CREATE TABLE security_report (
    id INTEGER PRIMARY KEY,
    date INTEGER NOT NULL,
    time INTEGER NOT NULL,
    incident_type TEXT NOT NULL,
    building_id TEXT REFERENCES building(id),
    description TEXT NOT NULL
);

CREATE TABLE interview (
    person_id INTEGER PRIMARY KEY REFERENCES person(id),
    interview_date INTEGER NOT NULL,
    transcript TEXT NOT NULL
);

CREATE TABLE solution (
    user INTEGER,
    value TEXT
);
""")

# ==============================================================================
# 2. POPULATE BUILDINGS & ROOMS
# ==============================================================================
buildings = [
    ('SPEL', 'Spellmann Campus Center', 'Central Campus', 4),
    ('ROEM', 'Roemer Hall', 'Historic Quad', 3),
    ('HARM', 'Harmon Hall', 'Academic West', 3),
    ('EVAN', 'Evans Commons Recreation Center', 'South Campus', 3),
    ('SCHE', 'J. Scheidegger Center for the Arts', 'Fine Arts Zone', 3),
    ('LARC', 'Library and Academic Resources Center', 'Central Campus', 3),
    ('PFIS', 'Pfister Hall (Residence)', 'Housing North', 4),
    ('COBB', 'Cobbs Hall (Residence)', 'Housing North', 4),
    ('HUNT', 'Hunter Stadium Pavilion', 'Athletic Complex', 2),
]
cur.executemany("INSERT INTO building VALUES (?,?,?,?)", buildings)

rooms = [
    ('SPEL-100', 'SPEL', '100', 'Lobby & Heritage Display'),
    ('SPEL-105', 'SPEL', '105', 'Campus Information Desk'),
    ('SPEL-210', 'SPEL', '210', 'Dining Hall Entrance'),
    ('SPEL-302', 'SPEL', '302', 'Student Government Office'),
    ('ROEM-101', 'ROEM', '101', 'Presidential Suite'),
    ('ROEM-205', 'ROEM', '205', 'Admissions Office'),
    ('HARM-114', 'HARM', '114', 'Computer Science Lab'),
    ('HARM-208', 'HARM', '208', 'Robotics & Hardware Lab'),
    ('EVAN-100', 'EVAN', '100', 'Recreation Welcome Desk'),
    ('EVAN-202', 'EVAN', '202', 'Fitness & Weight Room'),
    ('SCHE-101', 'SCHE', '101', 'Grand Theater & Gala Hall'),
    ('SCHE-102', 'SCHE', '102', 'VIP Donor Green Room'),
    ('LARC-104', 'LARC', '104', 'Quiet Study Hall'),
    ('LARC-220', 'LARC', '220', 'Archives & Special Collections'),
]
cur.executemany("INSERT INTO room VALUES (?,?,?,?)", rooms)

# ==============================================================================
# 3. POPULATE ORGANIZATIONS
# ==============================================================================
orgs = [
    ('ROBOT', 'Lindenwood Robotics Club', 'Technology', 'HARM'),
    ('CYBER', 'Cyber Forensics Society', 'Academic', 'HARM'),
    ('SGA', 'Student Government Association', 'Leadership', 'SPEL'),
    ('AMBASS', 'Campus Tour Ambassadors', 'Student Service', 'ROEM'),
    ('CHESS', 'Lindenwood Chess Guild', 'Special Interest', 'LARC'),
    ('ATHLET', 'Lion Varsity Athletics', 'Athletics', 'EVAN'),
    ('DRAMA', 'Scheidegger Theater Players', 'Arts', 'SCHE'),
    ('BIOL', 'Pre-Med & Biology Society', 'Academic', 'HARM'),
]
cur.executemany("INSERT INTO organization VALUES (?,?,?,?)", orgs)

# ==============================================================================
# 4. POPULATE PEOPLE (STUDENTS, FACULTY, ALUMNI)
# ==============================================================================
first_names = [
    'Alexander', 'Emily', 'James', 'Sophia', 'Benjamin', 'Olivia', 'Daniel', 'Ava',
    'Ethan', 'Mia', 'Lucas', 'Charlotte', 'Mason', 'Amelia', 'Liam', 'Harper',
    'Noah', 'Evelyn', 'Elijah', 'Abigail', 'William', 'Elizabeth', 'Michael', 'Chloe',
    'Carter', 'Ella', 'Jackson', 'Avery', 'Samuel', 'Scarlett', 'Henry', 'Grace',
    'David', 'Lily', 'Joseph', 'Hannah', 'Logan', 'Nora', 'Tyler', 'Zoe'
]

last_names = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Rodriguez',
    'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor',
    'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris',
    'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen'
]

random.seed(42)

people = []
students = []
faculties = []
donors = []
memberships = []
vehicles = []
parking_records = []
swipes = []
attendances = []

majors = [
    'Computer Science', 'Cybersecurity', 'Data Science', 'Business Administration',
    'Biological Sciences', 'Digital Marketing', 'Criminal Justice', 'Mechanical Engineering',
    'Graphic Design', 'Game Design', 'Finance', 'Psychology'
]
dorms = ['PFIS', 'COBB']
makes_models = [
    ('Toyota', 'Camry', 'Silver'), ('Toyota', 'Corolla', 'White'),
    ('Honda', 'Civic', 'Blue'), ('Honda', 'Accord', 'Black'),
    ('Ford', 'F-150', 'Red'), ('Ford', 'Focus', 'Grey'),
    ('Chevrolet', 'Malibu', 'White'), ('Nissan', 'Altima', 'Silver'),
    ('Subaru', 'Outback', 'Green'), ('Hyundai', 'Elantra', 'Black')
]

lots = ['Spellmann Lot A', 'Spellmann Lot B', 'Roemer Lot', 'Evans Commons Lot', 'Scheidegger Arts Lot', 'LARC North Lot']

# Generate 300 background citizens/students
person_id_counter = 2000

for i in range(260):
    pid = person_id_counter
    person_id_counter += 1
    fn = random.choice(first_names)
    ln = random.choice(last_names)
    name = f"{fn} {ln}"
    email = f"{fn.lower()}.{ln.lower()}{random.randint(10,99)}@lindenwood.edu"
    phone = f"636-{random.randint(200,999)}-{random.randint(1000,9999)}"
    ssn = f"{random.randint(100,999)}-{random.randint(10,99)}-{random.randint(1000,9999)}"
    
    # 75% students, 15% faculty, 10% alumni
    r_val = random.random()
    if r_val < 0.75:
        role = 'Student'
        people.append((pid, name, email, role, phone, ssn))
        sid = f"A{random.randint(10000000, 99999999)}"
        maj = random.choice(majors)
        year = random.choice(['Freshman', 'Sophomore', 'Junior', 'Senior'])
        gpa = round(random.uniform(2.5, 3.98), 2)
        dorm = random.choice(dorms)
        d_room = f"{random.randint(101, 420)}"
        students.append((pid, sid, maj, year, gpa, dorm, d_room))
        
        # Org membership
        if random.random() < 0.65:
            org = random.choice(orgs)[0]
            memberships.append((org, pid, 'Member', 20240901))
            
    elif r_val < 0.90:
        role = 'Faculty'
        people.append((pid, name, email, role, phone, ssn))
        dept = random.choice(['Mathematics & Computer Science', 'Business & Management', 'Sciences', 'Humanities', 'Fine Arts'])
        title = random.choice(['Assistant Professor', 'Associate Professor', 'Professor', 'Instructor'])
        faculties.append((pid, dept, title, 'HARM', f"{random.randint(201, 350)}"))
    else:
        role = 'Alumnus'
        people.append((pid, name, email, role, phone, ssn))
        income = random.randint(55000, 220000)
        donations = random.randint(100, 15000)
        donors.append((pid, random.randint(1985, 2022), 'Corporate Executive', income, donations))

    # Vehicles (for ~50% of people)
    if random.random() < 0.5:
        mm = random.choice(makes_models)
        plate = f"MO-{random.randint(100,999)}-{chr(random.randint(65,90))}{chr(random.randint(65,90))}"
        permit = 'Student Commuter' if role == 'Student' else ('Faculty/Staff' if role == 'Faculty' else 'Visitor')
        vid = len(vehicles) + 1
        vehicles.append((vid, pid, plate, mm[0], mm[1], mm[2], permit))
        
        # Parking record on incident date Oct 18, 2025
        if random.random() < 0.7:
            park_lot = random.choice(lots)
            parking_records.append((len(parking_records)+1, vid, park_lot, 20251018, random.randint(1700, 2000), random.randint(2100, 2300)))

# ==============================================================================
# 5. INJECT KEY CHARACTERS & WITNESSES
# ==============================================================================

# KEY WITNESS 1: Samantha Reed (Spellmann Information Desk Worker)
W1_ID = 1040
people.append((W1_ID, 'Samantha Reed', 'samantha.reed@lindenwood.edu', 'Student', '636-949-8120', '581-22-9011'))
students.append((W1_ID, 'A00491022', 'Criminal Justice', 'Senior', 3.82, 'PFIS', '312'))
memberships.append(('AMBASS', W1_ID, 'Tour Guide Lead', 20230825))

# KEY WITNESS 2: Derek Zhang (North Exit Study Lounge Student)
W2_ID = 1041
people.append((W2_ID, 'Derek Zhang', 'derek.zhang@lindenwood.edu', 'Student', '636-949-8432', '581-34-4412'))
students.append((W2_ID, 'A00512890', 'Data Science', 'Junior', 3.91, 'COBB', '405'))
memberships.append(('CYBER', W2_ID, 'Vice President', 20240115))

# THE THIEF: Marcus Vance (Stage 1 Culprit)
THIEF_ID = 1042
people.append((THIEF_ID, 'Marcus Vance', 'marcus.vance@lindenwood.edu', 'Student', '636-949-7719', '581-88-2931'))
students.append((THIEF_ID, 'A00389211', 'Cybersecurity', 'Senior', 2.85, 'PFIS', '218'))
memberships.append(('ROBOT', THIEF_ID, 'Hardware Engineer', 20230910))

# Marcus's Vehicle: Silver Honda Civic, plate 'LU-8291'
THIEF_VID = 901
vehicles.append((THIEF_VID, THIEF_ID, 'LU-8291', 'Honda', 'Civic', 'Silver', 'Student Resident'))
parking_records.append((len(parking_records)+1, THIEF_VID, 'Spellmann Lot A', 20251018, 1945, 2055))

# Marcus's Door Swipes:
# Swipes at Spellmann north side door at 2038 (8:38 PM)
swipes.append((len(swipes)+1, THIEF_ID, 'SPEL', 'SPEL-100', 20251018, 2038, 'Granted'))
# Swipes into Evans Commons parking access door at 2046
swipes.append((len(swipes)+1, THIEF_ID, 'EVAN', 'EVAN-100', 20251018, 2046, 'Granted'))

# THE MASTERMIND: Victoria Sterling (Stage 2 Culprit)
MASTERMIND_ID = 1043
people.append((MASTERMIND_ID, 'Victoria Sterling', 'vsterling@sterlingvc.com', 'Alumna/Donor', '314-555-0199', '492-11-8820'))
donors.append((MASTERMIND_ID, 2008, 'Managing Partner, Sterling Venture Capital', 850000, 250000))

# Victoria's Vehicle: Red Porsche 911, vanity plate 'GOLD-911'
MASTERMIND_VID = 902
vehicles.append((MASTERMIND_VID, MASTERMIND_ID, 'GOLD-911', 'Porsche', '911 Carrera', 'Red', 'VIP Trustee'))
parking_records.append((len(parking_records)+1, MASTERMIND_VID, 'Scheidegger Arts Lot', 20251017, 1815, 2300))

# Victoria's Attendance at President's Gala
attendances.append((501, MASTERMIND_ID, 1835))
# Door swipe at VIP Green Room
swipes.append((len(swipes)+1, MASTERMIND_ID, 'SCHE', 'SCHE-102', 20251017, 1910, 'Granted'))

# Add background swipes on 20251018 around Spellmann and Evans
for pid, name, email, role, phone, ssn in people[:60]:
    if pid not in [THIEF_ID, W1_ID, W2_ID]:
        s_time = random.randint(1800, 2200)
        b_pick = random.choice(['SPEL', 'EVAN', 'ROEM'])
        r_pick = f"{b_pick}-100" if b_pick in ['SPEL', 'EVAN'] else 'ROEM-101'
        swipes.append((len(swipes)+1, pid, b_pick, r_pick, 20251018, s_time, 'Granted'))

# ==============================================================================
# 6. CAMPUS EVENTS
# ==============================================================================
events = [
    (501, "President's Alumni & Donor Gala", 20251017, 1830, 2230, 'SCHE', 'Annual black-tie philanthropic reception honoring Lindenwood distinguished alumni and executive benefactors.'),
    (502, 'Lindenwood Homecoming Pep Rally & Bonfire', 20251018, 1700, 1930, 'HUNT', 'Campus-wide pep rally celebrating Lion spirit prior to Homecoming weekend games.'),
    (503, 'Cyber Defense CTF Competition', 20251018, 1300, 1800, 'HARM', 'Regional student collegiate cybersecurity capture-the-flag hackathon.'),
    (504, 'Fine Arts Symphony Showcase', 20251019, 1400, 1630, 'SCHE', 'Student instrumental ensemble recital at the J. Scheidegger Center.'),
]
cur.executemany("INSERT INTO campus_event VALUES (?,?,?,?,?,?,?)", events)

# Add 25 other guests to President's Gala
for pid, name, email, role, phone, ssn in people[150:175]:
    attendances.append((501, pid, random.randint(1820, 1850)))

# ==============================================================================
# 7. SECURITY INCIDENT REPORTS
# ==============================================================================
reports = [
    (101, 20251018, 2145, 'Theft of Golden Lion Trophy', 'SPEL', 
     "INCIDENT REPORT #2025-1018-04: The university's revered Golden Lion Trophy was discovered missing from the historic heritage showcase in the Spellmann Campus Center lobby. Campus security determined the lock mechanism was picked between 8:15 PM and 8:45 PM on Homecoming evening. Two witnesses were flagged near the scene: (1) Samantha Reed, who was staffing the Spellmann Info Desk, observed a suspicious individual leaving with a heavy duffel bag toward Evans Commons lot; (2) Derek Zhang, who was studying in the north lounge, reported someone swiping through the exit door at approximately 8:38 PM."),
    (102, 20251018, 1420, 'Bicycle Missing', 'PFIS', 'Student reported an unlocked mountain bike removed from the outdoor bike racks near Pfister Hall.'),
    (103, 20251017, 2315, 'Noise Complaint', 'COBB', 'Resident Advisor notified security regarding loud music on the 3rd floor.'),
    (104, 20251016, 930, 'Water Leak', 'HARM', 'Facilities management dispatched to repair a minor pipe leak in Harmon Hall basement.'),
]
cur.executemany("INSERT INTO security_report VALUES (?,?,?,?,?,?)", reports)

# ==============================================================================
# 8. INTERVIEWS
# ==============================================================================
interviews = [
    (W1_ID, 20251019, 
     "I was working at the Spellmann Info Desk that evening. Around 8:40 PM, a young man hurried past wearing a black windbreaker with a gold 'Lindenwood Robotics' club emblem embroidered on the shoulder. He was carrying a long, weighted black duffel bag that looked exactly the size of the Golden Lion Trophy. I saw him head directly across the walkway toward Evans Commons Lot A and hop into a silver Honda with a Missouri plate starting with 'LU-8'."),
    
    (W2_ID, 20251019, 
     "I was studying right next to the north glass exit doors of Spellmann. At 8:38 PM sharp, a guy in a dark hoodie rushed out. He swiped his student ID card at the electronic badge scanner to unlock the outer latch, and the green LED flashed 'Access Granted'. When he pushed through the door in a hurry, he dropped a flash drive containing code files for 'DSCI 35600 / CS Hardware'."),
    
    (THIEF_ID, 20251020, 
     "Alright, you caught me! I'm sorry, I never meant to disrespect Lindenwood! I stole the Golden Lion Trophy from the Spellmann display case, but I didn't keep it. I was paid a $15,000 cash bribe by an ultra-wealthy alumna who planned the entire heist! She approached me at the President's Alumni & Donor Gala held at the J. Scheidegger Center on the night of Oct 17. She wasn't a student—she was an executive donor driving a fiery red Porsche 911 with a vanity license plate containing 'GOLD'. She boasted that she earns over $750,000 a year and that the trophy belonged in her high-rise penthouse. She told me she had access to the Scheidegger VIP Donor Room (Room 102). Find her! She's the real mastermind!"),
    
    (MASTERMIND_ID, 20251021, 
     "My lawyer will be speaking to the Board of Trustees about this outrageous accusation! ...Fine, you got me. The Golden Lion is locked in my safe in Clayton. I wanted it as the centerpiece for my private collection.")
]

# Insert people, students, faculties, donors, memberships, vehicles, parking_records, swipes, attendances
cur.executemany("INSERT INTO person VALUES (?,?,?,?,?,?)", people)
cur.executemany("INSERT INTO interview VALUES (?,?,?)", interviews)
cur.executemany("INSERT INTO student VALUES (?,?,?,?,?,?,?)", students)
cur.executemany("INSERT INTO faculty_staff VALUES (?,?,?,?,?)", faculties)
cur.executemany("INSERT INTO alumni_donor VALUES (?,?,?,?,?)", donors)
cur.executemany("INSERT INTO organization_member VALUES (?,?,?,?)", memberships)
cur.executemany("INSERT INTO vehicle VALUES (?,?,?,?,?,?,?)", vehicles)
cur.executemany("INSERT INTO parking_record VALUES (?,?,?,?,?,?)", parking_records)
cur.executemany("INSERT INTO card_swipe_access VALUES (?,?,?,?,?,?,?)", swipes)
cur.executemany("INSERT INTO event_attendance VALUES (?,?,?)", attendances)

# ==============================================================================
# 9. SOLUTION VERIFICATION TRIGGER (HEX OBFUSCATED)
# ==============================================================================
# hex('Marcus Vance') = 4D61726375732056616E6365
# hex('Victoria Sterling') = 566963746F72696120537465726C696E67

cur.executescript("""
CREATE TRIGGER check_solution AFTER INSERT ON solution
WHEN new.user == 1
BEGIN
    DELETE FROM solution;
    INSERT INTO solution VALUES (0,
    CASE 
        WHEN hex(trim(new.value)) == '4D61726375732056616E6365' THEN
            "Congrats, you caught the trophy thief, Marcus Vance!
During interrogation by campus security, Marcus broke down and confessed:
'I didn't want to steal the Lion! I was paid a $15,000 cash bribe by an influential alumna on campus who orchestrated the entire heist! She promised to wipe out my college tuition. Query my interview transcript (person_id = 1042) to find the clues to expose the real mastermind!'

If you are a true forensic investigator, follow the clues in Marcus Vance's interview to unmask the real mastermind behind the heist! Use this same verification to submit the mastermind's name."

        WHEN hex(trim(new.value)) == '566963746F72696120537465726C696E67' THEN
            "Incredible forensic detective work! You exposed Victoria Sterling as the mastermind behind the heist of the Golden Lion Trophy!
Campus security and St. Charles police recovered the Golden Lion unharmed from her private vault.
The Lindenwood University President, faculty, and fellow Lions hail you as the greatest forensic SQL investigator in university history! 🦁🏆
Time to celebrate at Evans Commons!"

        ELSE
            "That's not the right person. Review the evidence, check the logs, and try again!"
    END
    );
END;
""")

conn.commit()
print("Database generated successfully:", DB_FILE)

# ==============================================================================
# 10. VERIFY PUZZLE TRAIL WITH SQL
# ==============================================================================
print("\n--- Verifying Puzzle Trail ---")

# Step 1: Incident
cur.execute("SELECT description FROM security_report WHERE date = 20251018 AND incident_type LIKE '%Golden Lion%'")
print("1. Incident:", cur.fetchone()[0][:80], "...")

# Step 2: Witness 1
cur.execute("SELECT transcript FROM interview WHERE person_id = 1040")
print("2. Witness 1 Interview:", cur.fetchone()[0][:80], "...")

# Step 3: Witness 2
cur.execute("SELECT transcript FROM interview WHERE person_id = 1041")
print("3. Witness 2 Interview:", cur.fetchone()[0][:80], "...")

# Step 4: Card swipes matching 20251018 between 2030 and 2045 at SPEL
cur.execute("""
SELECT p.name, s.swipe_time, s.building_id, o.name AS club, v.license_plate, v.car_make, v.car_color
FROM card_swipe_access s
JOIN person p ON s.person_id = p.id
JOIN organization_member om ON p.id = om.person_id
JOIN organization o ON om.org_id = o.id
JOIN vehicle v ON p.id = v.person_id
WHERE s.swipe_date = 20251018 AND s.swipe_time BETWEEN 2030 AND 2045 AND s.building_id = 'SPEL'
""")
row = cur.fetchone()
print("4. Identified Thief:", row)

# Step 5: Test Solution for Marcus Vance
cur.execute("INSERT INTO solution VALUES (1, 'Marcus Vance')")
cur.execute("SELECT value FROM solution")
sol_v1 = cur.fetchone()[0]
print("5. Stage 1 Verdict:\n", sol_v1[:100], "...")

# Step 6: Query Marcus Interview
cur.execute("SELECT transcript FROM interview WHERE person_id = 1042")
print("6. Marcus's Confession:", cur.fetchone()[0][:100], "...")

# Step 7: Mastermind query matching President Gala + Red Porsche + Income > 750k
cur.execute("""
SELECT p.name, ad.annual_income, v.car_make, v.car_model, v.car_color, v.license_plate
FROM event_attendance ea
JOIN campus_event ce ON ea.event_id = ce.id
JOIN person p ON ea.person_id = p.id
JOIN alumni_donor ad ON p.id = ad.person_id
JOIN vehicle v ON p.id = v.person_id
WHERE ce.event_name LIKE '%President%Gala%'
  AND v.car_make = 'Porsche'
  AND v.car_color = 'Red'
  AND ad.annual_income > 750000
""")
mastermind = cur.fetchone()
print("7. Identified Mastermind:", mastermind)

# Step 8: Test Solution for Victoria Sterling
cur.execute("INSERT INTO solution VALUES (1, 'Victoria Sterling')")
cur.execute("SELECT value FROM solution")
sol_v2 = cur.fetchone()[0]
print("8. Stage 2 Verdict:\n", sol_v2[:100], "...")

conn.close()
