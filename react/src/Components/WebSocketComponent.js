import React, { useEffect, useState } from 'react';
import { getWebSocketURLAttribute } from "../utils";

var webSocket

export function WebSocketComponent({ onOpen, onMessage }) {

    webSocket = React.useRef(null);
    var applicationWebSocketUrl;
    var websocketURL = process.env.REACT_APP_WEBSOCKET_URL;
    if (websocketURL) {

        applicationWebSocketUrl = websocketURL + "/application"
    }
    else {
        websocketURL = getWebSocketURLAttribute();
        if (!websocketURL) 
        {
            const appName = window.location.pathname.substring(
                0,
                window.location.pathname.lastIndexOf("/") + 1
            );
            const path =
                window.location.hostname +
                ":" +
                window.location.port +
                appName +
                "websocket";

            websocketURL = "ws://" + path;

            if (window.location.protocol.startsWith("https")) {
                websocketURL = "wss://" + path;
            }

        }
        applicationWebSocketUrl = websocketURL + "/application"
    }

   

    const handleOnOpen = () => {
        onOpen();
    };

    const handleOnMessage = (message) => {
        onMessage(message);
    };

    useEffect(() => {
        if (!webSocket.current) 
        {
            console.log("websocket url: " + applicationWebSocketUrl);
            webSocket.current = new WebSocket(applicationWebSocketUrl);

            webSocket.current.onopen = () => {
                console.log("WebSocket is connected.");
                handleOnOpen();
            };

            webSocket.current.onclose = () => {
                console.log("WebSocket is closed.");
            };

            webSocket.current.onmessage = (event) => {
                handleOnMessage(event.data);
            };

            /*
            return () => {
                if (webSocket.current) {
                    webSocket.current.close();
                }
            };
            */
        }
    }, [onMessage]);

 


    return null; // This component does not render anything
}

export const sendWebSocketMessage = (message) => {
    if (webSocket.current && webSocket.current.readyState === WebSocket.OPEN) {
        webSocket.current.send(message);
    } else {
        console.error("WebSocket is not connected.");
    }
};