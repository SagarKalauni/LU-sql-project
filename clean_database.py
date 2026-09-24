import sqlite3

conn = sqlite3.connect('lindenwood-mystery.db')
cur = conn.cursor()

# Clean crime_scene_report
cur.execute("DELETE FROM crime_scene_report WHERE date = 20251018")
cur.execute("DELETE FROM crime_scene_report WHERE date = 20180115 AND city = 'SQL City' AND description LIKE '%Golden Lion%'")

# The suspenseful Lindenwood Golden Lion report
desc_lindenwood = (
    "Security footage shows that the historic Golden Lion Trophy was stolen from the display case in the Spellmann Campus Center. "
    "There were 2 witnesses. The first witness lives at the last house on 'Northwestern Dr'. "
    "The second witness, named Annabel, lives somewhere on 'Franklin Ave'."
)

# Insert the official Lindenwood report
cur.execute("INSERT INTO crime_scene_report VALUES (20251018, 'theft', ?, 'Lindenwood')", (desc_lindenwood,))

# Keep the original 20180115 report intact
desc_original = (
    "Security footage shows that there were 2 witnesses. "
    "The first witness lives at the last house on \"Northwestern Dr\". "
    "The second witness, named Annabel, lives somewhere on \"Franklin Ave\"."
)
cur.execute("INSERT INTO crime_scene_report VALUES (20180115, 'murder', ?, 'SQL City')", (desc_original,))

# Ensure trigger is suspenseful and perfect
cur.execute("DROP TRIGGER IF EXISTS check_solution")
cur.executescript("""
CREATE TRIGGER check_solution AFTER INSERT ON solution
    WHEN new.user==1
    BEGIN
        DELETE FROM solution;
        INSERT INTO solution VALUES (0,
        CASE WHEN hex(trim(new.value))=='4A6572656D7920426F77657273' THEN 
"Congrats, you caught who took the Golden Lion Trophy!

During interrogation by campus security, Jeremy Bowers broke down:
'I didn't steal it for myself! I was hired by a wealthy, powerful woman on campus who paid me a massive sum to steal it for her private collection. She promised me all the money in the world!'

If you are a true forensic detective, try querying the interview transcript of Jeremy Bowers to find the clues to expose the real mastermind behind this heist! Find mastermind and also verify she is the one. Use this same INSERT statement with your new suspect to check your answer."

             WHEN hex(trim(new.value))=='4D6972616E6461205072696573746C79' THEN 
"Incredible forensic detective work! You exposed Miranda Priestly as the true mastermind behind the theft of the Golden Lion Trophy!

Campus security and St. Charles police recovered the Golden Lion unharmed from her private vault. Everyone at Lindenwood University hails you as the greatest forensic SQL detective in university history! 🦁🏆
Time to celebrate at Evans Commons!"

             ELSE "That's not the right person. Review the evidence, check the logs, and try again!"
        END
        );
    END;
""")

conn.commit()
print("Cleaned and updated database!")

# Verify
cur.execute("SELECT * FROM crime_scene_report WHERE date = 20251018")
print("Lindenwood report:", cur.fetchone())

cur.execute("INSERT INTO solution VALUES (1, 'Jeremy Bowers')")
cur.execute("SELECT value FROM solution")
print("\n--- Test Jeremy Bowers ---\n", cur.fetchone()[0][:120], "...\n")

cur.execute("INSERT INTO solution VALUES (1, 'Miranda Priestly')")
cur.execute("SELECT value FROM solution")
print("--- Test Miranda Priestly ---\n", cur.fetchone()[0][:120], "...\n")

conn.close()
