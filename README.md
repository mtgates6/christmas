# Cousins' Christmas Stock Tracker

A small private holiday stock tracker with two kinds of views:

- Personal gift pages for each cousin at `/c/<token>`
- A grandparent family summary at `/family/<token>`

The data file `holdings.json` is the single source of truth.

## Run locally

```bash
npm install
npm start
```

Then open:

- http://localhost:3000/
- http://localhost:3000/c/MATT01
- http://localhost:3000/family/FAMILY1

## Config

The app exposes a small config object in `server.js`:

```js
const config = {
  familyToken: 'FAMILY1',
  showFamilyViewLink: false,
};
```

Set `showFamilyViewLink` to `true` if you want the family summary link to appear on cousin pages.
