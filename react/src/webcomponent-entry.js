import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import {BrowserRouter} from "react-router-dom";
import {WebSocketProvider} from "Components/WebSocketProvider";

// Import CSS as strings; esbuild will treat .css as text and we'll inject it
import appCss from "./App.css";
import indexCss from "./index.css";

function injectGlobalStyles() {
  if (document.getElementById("conference-react-styles")) {
    return;
  }
  const style = document.createElement("style");
  style.id = "conference-react-styles";
  style.textContent = `${indexCss}\n${appCss}`;
  document.head.appendChild(style);
}

class ConferenceReactElement extends HTMLElement {
  constructor() {
    super();
    this._container = null;
    this._root = null;
  }

  connectedCallback() {
    console.info("<conference-react> connected");
    injectGlobalStyles();
    if (!this._container) {
      this._container = document.createElement("div");
      // Ensure compatibility with existing app utils that expect #root
      this._container.id = "root";
      this._container.setAttribute("usage-mode", "component");
      this.appendChild(this._container);
      this._root = ReactDOM.createRoot(this._container);
      this._root.render(
        <WebSocketProvider>
          <React.StrictMode>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </React.StrictMode>
        </WebSocketProvider>
      );
    }
  }

  disconnectedCallback() {
    if (this._root) {
      this._root.unmount();
      this._root = null;
    }
    if (this._container) {
      this.removeChild(this._container);
      this._container = null;
    }
  }
}

if (!customElements.get("conference-react")) {
  customElements.define("conference-react", ConferenceReactElement);
}


