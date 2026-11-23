# Night Shift

[Drive the portfolio](https://sathya991.github.io/night-shift/) of Satya Srivatsav, a full-stack .NET and Angular engineer based in Hyderabad.

Start in a BMW M5 E39 on a short neon-lit drive. The crossroads leads to three GitHub projects and a set of Worksoft engineering case studies. The home page also links directly to the project summaries and résumé.

| Direction | Stop |
| --- | --- |
| Up | CaseBrief AI, a local PDF evidence review prototype |
| Left | AfterMatch, a Dota 2 match review and practice tool |
| Right | My Time, a Flutter and Firebase timetable prototype |
| Down | Worksoft, three enterprise engineering case studies |

Use WASD or the arrow keys to steer, accelerate, and brake. Hold Shift to boost. On a touch screen, use the onscreen controls. Choose **Map** or press Escape to return to the crossroads. **Restart** clears your progress.

## Run locally

From the root of this repository, run:

```sh
python3 -m http.server 8000
```

Open [localhost:8000/night-shift/](http://localhost:8000/night-shift/). The site uses static files and needs no build step, credentials, or third-party requests during the drive.

- `index.html` and `styles.css` contain the portfolio, controls, and responsive layout.
- `trace.js` handles driving, route progress, and the Canvas fallback.
- `scene-3d.js` builds the procedural Three.js city, roads, and car. The vendored Three.js license is in [vendor/LICENSE-three.txt](vendor/LICENSE-three.txt).
- `soundtrack.js` synthesizes the EDM loop and a V8-inspired engine sound with Web Audio. Browser autoplay rules sometimes require a click or keypress. The sound toggle remembers your preference in the current browser.

GitHub Pages serves the site at `/night-shift/`. The portfolio link remains usable even when JavaScript or WebGL2 is unavailable.
