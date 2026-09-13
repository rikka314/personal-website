# Editorial redesign validation

## Passed

- `npm run lint`, `npm run build`, `npm run test:editorial` (3 tests), and `git diff --check`.
- Browser geometry: 112 combinations across home, projects, blog, column, article, admin dashboard, and editor; each checked at 375, 768, 1024, and 1440px in English/Chinese and light/dark. No document-wide horizontal overflow. Results: `artifacts/editorial/responsive-checks.json`.
- Visual inspection and screenshots of home, projects, blog, article, login, dashboard, desktop split editor, and mobile editor/preview. Original revision rendered separately for the before screenshot.
- Keyboard: mobile menu Escape closes and returns focus; editor tabs support arrow keys. Mobile filter and TOC expansion expose expanded state.
- Blog: pagination updates URL; searching FinGPT returns its project; missing query shows empty results; language filtering and locked column routes work; Chinese punctuation in headings resolves to the actual anchor IDs.
- In-memory admin fixtures: existing and new article saves, publishing, withdrawing, reload persistence, metadata changes, adding a column, Markdown import, image upload/insertion, login/logout. Simulated save failure displays an error and retains text. Editor/preview switching preserves the draft; copy shows confirmation.
- Theme token contrast: text, muted text, and accent against background/card/soft surfaces all pass 4.5:1; minimum measured 5.16:1.
- Inspected reduced-motion rules in the rendered CSS; transitions, animations, and smooth scrolling are disabled by the media query. Theme transitions also check the preference before starting.

## Limits

- Backend interaction verification uses the standalone local fixture server, not production PHP storage or GitHub OAuth. Live publishing was not performed.
- Browser viewport geometry is automated; screenshots were inspected at representative states. OS-level text scaling and reduced-motion preference emulation were not available in the browser tool; their runtime device behavior still needs a real-device check.
- The build retains the existing >500 kB warning for the lazy-loaded Markdown/KaTeX/highlighting bundle.

## Artifacts

Open `artifacts/editorial/index.html` for the screenshot gallery. Fixture screenshots contain demonstration content and are not published site data.
