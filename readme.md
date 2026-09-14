# Gita — AI Guidance, Personalized to You

**Status:** 🚧 Early build — core backend data pipeline complete, frontend in progress.

A user-centric application that gives people personalized guidance drawn from the Bhagavad Gita — share what's on your mind, and get back a real verse with an explanation of what it means for your situation.

This is an early-stage solo project. Keeping this README simple for now — more detail as the build matures.

---

## What's built so far

- Backend pipeline that collects and organizes Gita verse data into a proper database
- Verses tagged by theme (fear, duty, grief, purpose, and more) to support accurate matching
- Frontend chat interface with saved conversation history

## In progress

- Matching a user's message to the right verse
- Personalizing the explanation to the person asking

## Stack

`Next.js` · `TypeScript` · `Node.js` · `PostgreSQL` · `Tailwind CSS` · `Anthropic Claude API`

---

*More to come as this takes shape.*

## A licensing note, since this pulls someone else's dataset

The Sanskrit text itself is ancient and public domain. The seed script
defaults to Shri Purohit Swami's English translation specifically because
he died in 1941 — comfortably out of copyright everywhere. Some of the
*other* translators available in this same API's responses (Swami
Ramsukhdas, Swami Chinmayananda, etc.) are much more recent, and their
translations may still be under copyright even though the API serves them
for free. If you ever want to display more than one translator's version
side by side, check that specific translator's copyright status first
rather than assuming "the API returns it, so it's fine to use."
