# MeetingLens — AI Meeting Transcriber & Summarizer

Interactive demo: paste a meeting transcript and get a summary, the decisions
that were made, and action items with owners and due dates — plus meeting
stats and per-speaker talking time. Everything runs locally in the browser;
nothing is uploaded.

**Live demo:** https://frenkiofficial.github.io/ai-meeting-transcriber/

## What it does

- **Paste or type a transcript** — one speaker per line, `Name: …` format.
  Two ready-to-click samples included: a product launch planning meeting
  (4 speakers) and a weekly sales sync (3 speakers).
- **Summary** — key sentences scored and picked automatically.
- **Decisions** — sentences with decision language pulled out.
- **Action items** — commitments matched to the speaker who made them, with
  due dates extracted from the text (`by Friday`, `by Dec 2`). Check them off
  as they get done.
- **Meeting stats** — duration, speaker count, word count, decisions and
  action-item totals, plus a who-talked-most bar chart.
- **Export** — copy any section, copy all notes, or download the full notes
  as `.txt` or `.md`.

## Files

- `index.html` — page structure
- `styles.css` — styling (modern minimal, one accent)
- `app.js` — parsing, extraction, rendering, export
- `data.js` — two sample transcripts (fictional demo data)

## Note

Demo with sample data. Transcripts shown are fictional examples, not real
meetings. No audio is processed and no data leaves the browser.
