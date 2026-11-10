# PreCog

A fun precognition test. Seven shapes (square, circle, triangle, diamond) are drawn at random by the server (Supabase) when you press Begin and held there; your browser only gets a SHA-256 fingerprint until all your guesses are in. Guess them one at a time; nothing is revealed until all seven are in, then you see every answer and your score. Pure guessing averages 25%.

Every round is logged to a shared Supabase table and shown on the All results page (results.html). Real names are never readable from the database: each browser remembers its own players, so you see your own name and a pseudonym for everyone else. Scores are calculated by the database, and the public can only read and add rounds, never edit or delete them.

## Server side

`supabase/server_draw.sql` holds the draw: a private `sessions` table plus two functions. `start_round` draws and seals the cards and returns only the fingerprint; `submit_round` takes all guesses at once, logs the round and only then reveals the cards. The public cannot read `sessions` or insert into `rounds` directly.

## The Mentalist

`mentalist.html` is a second game. The Mentalist secretly picks one of six colours, then talks the player through some patter and questions laced with suggestions for that colour (and a faint tint in the background). It seals its prediction with a SHA-256 fingerprint before the player chooses, then reveals it and shows the cues it used. Results are kept in the player's own browser for now.
