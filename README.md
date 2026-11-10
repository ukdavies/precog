# PreCog

A fun precognition test. Seven shapes (square, circle, triangle, diamond) are drawn at random and sealed with a SHA-256 fingerprint before you start. Guess them one at a time; nothing is revealed until all seven are in, then you see every answer and your score. Pure guessing averages 25%.

Every round is logged to a shared Supabase table and shown on the All results page (results.html). Real names are never readable from the database: each browser remembers its own players, so you see your own name and a pseudonym for everyone else. Scores are calculated by the database, and the public can only read and add rounds, never edit or delete them.
