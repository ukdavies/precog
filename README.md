# PreCog

A fun precognition test. Ten shapes (square, circle, triangle, diamond) are drawn at random and sealed with a SHA-256 fingerprint before you start. Guess them one at a time; the answer is revealed after each guess and you get a score at the end. Pure guessing averages 25%.

Every round is logged to a shared Supabase table. Scores are calculated by the database, and the public can only read and add rounds, never edit or delete them.
