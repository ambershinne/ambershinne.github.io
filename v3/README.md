# ambershin v3 (redesign)

Open `index.html` / `about.html` through a local server or GitHub Pages
(opening the file directly also works in most browsers).

## Files
- `index.html`, `about.html`: page markup lives inside `<template id="tpl">`.
  `{{ name }}` values and the lists (`<sc-for>`) / conditions (`<sc-if>`)
  come from `renderVals()` in the `<script type="text/x-dc">` block at the
  bottom of each page. Edit text and data there.
- `css/index.css`, `css/about.css`: page styles.
- `js/dc-lite.js`: small runtime that renders the template. No need to edit.
- `images/`: all images used by the two pages.

## Notes
- Email link is still `mailto:[YOUR EMAIL]` in both pages.
- Case study links point to the current live pages on ambershin.com.
- To go live: move these files to the repo root (replacing the old
  index.html / about.html) or point GitHub Pages at this folder.
