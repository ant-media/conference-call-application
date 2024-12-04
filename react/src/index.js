import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter } from "react-router-dom";
import { getRootAttribute } from "utils";
import { WebSocketProvider } from "Components/WebSocketProvider";
import * as Sentry from "@sentry/react";

Sentry.init({
    dsn: "https://8ddb1dec1e051189186778b8ae5e229b@o4508410592362496.ingest.de.sentry.io/4508410595639376",
    integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
    ],
    // Tracing
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
    tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
    // Session Replay
    replaysSessionSampleRate: 1.0, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
});

const root = ReactDOM.createRoot(document.getElementById("root"));
let appName = undefined
let roomName = getRootAttribute("data-room-name");

if (process.env.NODE_ENV !== 'development' && !roomName) {
  appName = "/" + window.location.pathname.split("/")[1];
  //console.log = function () { };
}

//React.StricMode causes double rendering of components in "development" to detect the problems with the code - mekya 
root.render(
  <WebSocketProvider>
    <React.StrictMode>
      <BrowserRouter basename={appName}>
          <App />
      </BrowserRouter>
    </React.StrictMode>
  </WebSocketProvider> 
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.unregister();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
