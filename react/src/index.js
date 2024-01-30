import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter } from "react-router-dom";
import { getRoomNameAttribute } from "utils";
import { WebSocketProvider } from "Components/WebSocketProvider";

const root = ReactDOM.createRoot(document.getElementById("root"));
let appName = undefined
let roomName = getRoomNameAttribute();

if (process.env.NODE_ENV !== 'development' && !roomName) {
  appName = "/" + window.location.pathname.split("/")[1];
  console.log = function () { };
}

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
