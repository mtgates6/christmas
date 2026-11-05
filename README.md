# Cousins' Christmas Stock Tracker

A small public holiday stock tracker with two kinds of views:

- Personal gift pages for each cousin at `/c/<name-or-token>`
- A family summary at `/family`

The data file `holdings.json` is the single source of truth.

## Run locally

```bash
npm install
npm start
```

Then open:

- http://localhost:3000/
- http://localhost:3000/c/matthew
- http://localhost:3000/c/MATT01
- http://localhost:3000/family
- http://localhost:3000/family/family

## Config

The app exposes a small config object in `server.js`:

```js
const config = {
  familyToken: 'family',
  showFamilyViewLink: true,
  publicMode: true,
};
```

Set `publicMode` to `false` if you want the old private-link gate back.
