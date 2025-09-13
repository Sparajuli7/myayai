## MyAyAI – AI Prompt Optimizer (Chrome Extension)

Transform into an AI power‑user with one‑click prompt optimization. MyAyAI upgrades your prompts for clarity, specificity, and structure—tuned to each platform (ChatGPT, Claude, Gemini, Perplexity, Copilot, Poe)—so you get better answers on the first try.

### Installation
- From Chrome Web Store (recommended): Coming soon – search for “MyAyAI”.
- Manual (developer mode):
  1. Clone this repo
  2. Install dependencies in `myayai-extension`
  3. Build for Chrome: `npm run build:chrome`
  4. Visit chrome://extensions → Enable Developer mode → Load unpacked → select `myayai-extension/dist/chrome`

### Development setup
Prerequisites: Node >= 16, npm >= 8

Commands (run inside `myayai-extension`):
- `npm install`
- `npm run dev` – watch build
- `npm run dev:hot` – dev server with HMR (if configured)
- `npm run build:chrome` – production build for Chrome
- `npm run build:firefox` – build for Firefox
- `npm run build:all` – build for all configured browsers
- `npm run pack` – zip artifacts for submission

### Project structure
- `myayai-extension/manifest.json` – MV3 manifest
- `background/` – service worker and background logic
- `content/` – content script orchestrator and platform detectors
- `popup/` – popup UI
- `optimization/` – core Prompt Optimizer and Optimization Engine
- `privacy/` – privacy controls and consent management
- `utils/` + `ui/` – shared utilities and UI helpers

### Architecture overview
- Content script (`content/content-script.js`): detects platform inputs, injects UI, manages events
- Background (`background/service-worker.js`): lifecycle, messaging, heartbeat
- Optimizer (`optimization/prompt-optimizer.js`): style + platform‑aware prompt upgrades
- Engine (`optimization/optimization-engine.js`): analysis, suggestions, alternatives, analytics
- Suggestions (`optimization/prompt-suggestions.js`): templates and real‑time guidance

### API quick start
Use the optimizer/engine directly (for tests or future APIs):

```javascript
// In a browser context where these classes are available on window/self
const optimizer = new PromptOptimizer({ defaultStyle: 'professional' });
const result = optimizer.optimizePrompt("Help me write a product update", 'chatgpt', 'professional');
console.log(result.optimized, result.scores, result.improvements);

const engine = new OptimizationEngine();
engine.optimize("Draft a marketing plan", { platform: 'claude', includeSuggestions: true })
  .then(r => console.log(r.optimized.text, r.suggestions))
  .catch(console.error);
```

### Privacy
Processing runs locally in the extension context. We do not transmit your prompts to any external servers. See `myayai-extension/docs/privacy-policy.html` and `myayai-extension/docs/PRIVACY.md`.

### Support
- Issues: https://github.com/myayai/chrome-extension/issues
- Email: support@myayai.com
- Website: https://myayai.com

### Version roadmap
- Near‑term: inline before/after diff, improved platform adapters, more templates
- Mid‑term: team presets and shared templates, import/export
- Long‑term: optional cloud sync (opt‑in), public API

### License
MIT © MyAyAI Team


