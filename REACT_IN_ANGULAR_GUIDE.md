## Run the React app inside Angular (Web Component approach)

This guide documents how we wrapped the existing React app under `react/` as a Custom Element and consumed it in a new Angular app under `angular/`.

### Overview

- React is bundled to a single browser script that registers a custom element `<conference-react>`.
- Angular loads that script and renders `<conference-react>` in the template.
- We proxy WebSocket/REST calls during Angular dev to your Ant Media backend.

### React side (producer)

1) Add a Web Component entry
- File: `react/src/webcomponent-entry.js`
- What it does:
  - Creates a DOM container with `id="root"` and `usage-mode="component"` (matches app utils expectations).
  - Injects global styles by importing `index.css` and `App.css` as text once.
  - Mounts the existing React tree (`<App/>` wrapped with `BrowserRouter` and `WebSocketProvider`).
  - Registers the custom element: `customElements.define("conference-react", ConferenceReactElement);`

2) Add a dedicated build using esbuild
- File: `react/scripts/build-webcomponent.mjs`
- Key points in the build:
  - Bundles `src/webcomponent-entry.js` to `react/dist/react-mfe/react-mfe.js`.
  - `loader` sets `.js` → `jsx`, `.css` → `text`, and images/fonts to `file`.
  - Path aliases for CRA-style absolute imports: `Components`, `styles`, `pages`, `CustomRoutes`, `utils`.
  - `jsx: "automatic"` with `jsxImportSource: "react"` to avoid the classic "React is not defined".
  - Injected browser shims via `banner`:
    - `var global = window;`
    - `var process = window.process || { env: { NODE_ENV: 'production' } };`
  - `define` for `process.env.NODE_ENV` and `process.env.REACT_APP_FORCE_THEME`.

3) Package scripts
- File: `react/package.json`
- Added:
  - `build:webcomponent`: builds the custom element bundle
  - `watch:webcomponent`: builds in watch mode
- Dev dependency: `esbuild`.

4) Build

```bash
cd react
npm install --legacy-peer-deps  # resolve peer conflicts (React 19)
npm run build:webcomponent
```

Output: `react/dist/react-mfe/react-mfe.js` (+ possibly emitted assets under `react/dist/react-mfe/assets/`).

Notes
- We did not enable Shadow DOM to keep styling straightforward with MUI; you can switch later if you prefer isolation.
- The entry injects CSS globally once; if you need finer control, move to scoped styles or Shadow DOM.

### Angular side (consumer)

1) Scaffold Angular app

```bash
npx -y @angular/cli@17 new angular --routing --style=css --skip-git --skip-install --standalone=false
cd angular && npm install
```

2) Add the React bundle to assets
- Copy built file:

```bash
cp ../react/dist/react-mfe/react-mfe.js src/assets/react-mfe.js
mkdir -p src/assets/react-mfe/assets && cp -R ../react/dist/react-mfe/assets/* src/assets/react-mfe/assets/ 2>/dev/null || true
```

3) Load the bundle early
- File: `angular/src/index.html`
- Add:

```html
<script src="assets/react-mfe.js" defer></script>
```

4) Allow custom elements and render the element
- File: `angular/src/app/app.module.ts`
  - Add `CUSTOM_ELEMENTS_SCHEMA` to `schemas`.
- File: `angular/src/app/app.component.html`
  - Replace template with:

```html
<conference-react style="display:block;width:100%;height:100vh;"></conference-react>
```

5) Angular builder config
- File: `angular/angular.json`
  - Ensure no global scripts include for the React bundle (avoid `scripts.js import outside module` error):
    - Under `architect.build.options.scripts`: keep it empty (`[]`).
  - Dev proxy:
    - Add `proxyConfig: "proxy.conf.json"` under `architect.serve.configurations.development`.

6) Dev proxy for backend
- File: `angular/proxy.conf.json`

```json
{
  "/websocket": {
    "target": "http://localhost:5080/Conference",
    "secure": false,
    "ws": true,
    "changeOrigin": true,
    "logLevel": "debug"
  },
  "/rest": {
    "target": "http://localhost:5080/Conference",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

This lets the React app connect to `ws://localhost:4200/websocket/...` and be proxied to your Ant Media server.

7) Run Angular dev

```bash
cd angular
npm start
# open http://localhost:4200
```

You should see logs like:
- `i18n is initialized`, `Language is set to en`
- `<conference-react> connected`
- `--> websocket url connection: ws://localhost:4200/websocket/application`
- `WebSocket Connected`

### Troubleshooting we fixed (and how)

- "Cannot use import statement outside a module" in `scripts.js`
  - Cause: bundling the React bundle via `angular.json` global `scripts` (treated as classic script) collides with ESM.
  - Fix: remove from `angular.json` `scripts` and include via `index.html` `<script src=... defer>`.

- `process is not defined`
  - Cause: some dependencies expect Node-like globals in browser.
  - Fix: esbuild `banner` shims `global` and `process` before app code runs.

- `React is not defined` from function components (e.g., `SvgIcon`)
  - Cause: classic JSX runtime requires `import React` in scope.
  - Fix: esbuild `jsx: "automatic"` and `jsxImportSource: "react"`.

- WebSocket connecting to Angular instead of backend
  - Intentional for dev: `ws://localhost:4200/websocket/...` routes through the proxy to `http://localhost:5080/Conference`.
  - If your backend URL differs, edit `proxy.conf.json` targets accordingly.

### Dev workflow

In one terminal:

```bash
cd react
npm run watch:webcomponent
```

In another:

```bash
cd angular
npm start
```

When React rebuilds, copy the fresh bundle to Angular assets (or automate with a simple script) and refresh the browser.

### Production options

- Copy artifact into Angular assets in CI before `ng build`.
- Or host the React bundle on a CDN and load via `<script src="https://cdn/.../react-mfe.js" defer>`.
- Or publish the web component as a private npm package and import it in Angular’s build step.

### Passing configuration

- Current WebSocket URL logic in `WebSocketProvider` uses:
  - `data-websocket-url` attribute on the container `#root` (we set it up for component mode)
  - `REACT_APP_WEBSOCKET_URL`
  - Fallback to current origin `/<app>/websocket`

To force a specific URL in Angular, you can set it at runtime by adding an attribute to the inner `#root` after the element is connected, or adapt `webcomponent-entry.js` to read attributes on `<conference-react>` and forward them to `#root`.

### Notes

- We kept Shadow DOM off for now to avoid MUI style isolation issues.
- If you want isolation later, set a shadow root and inject styles into it (and test MUI portal/popover behaviors).


