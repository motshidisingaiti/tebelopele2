# Tshedimoso

A single static page — no build step, no backend required. Everything is in
`index.html`. Themed with Tebelopele Wellness Centre's own brand colors
(maroon, magenta, orange, gold — sampled from their RFP letterhead and logo).

## Deploy with GitHub Pages (free, ~2 minutes)

1. Create a new repository on GitHub (e.g. `tshedimoso`).
2. Push this folder to it:
   ```bash
   git init
   git add .
   git commit -m "Tshedimoso site — Tebelopele theme"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
3. On GitHub: go to the repo's **Settings → Pages**, set **Source** to
   `Deploy from a branch`, branch `main`, folder `/ (root)`, then **Save**.
4. GitHub gives you a live URL a minute or two later, usually
   `https://<your-username>.github.io/<your-repo>/`.

## Editing

One plain HTML file with inline CSS — open `index.html` in any editor and
change the text or the color variables at the top of the `<style>` block
directly. No dependencies to install.

## Later

When you're ready to make the chat and admin sections actually functional
(booking, staff login, live data) rather than a visual demo, that's a separate,
bigger piece of work — connecting this page to a real backend API.
