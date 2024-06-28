import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getWebSocketURLAttribute } from "../utils";

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
    const webSocket = useRef(null);
    const [latestMessage, setLatestMessage] = useState(null);
    const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);

    var websocketUrlTemp = process.env.REACT_APP_WEBSOCKET_URL;
    if (!websocketUrlTemp) {
        websocketUrlTemp = getWebSocketURLAttribute();
        if (!websocketUrlTemp) {
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

            websocketUrlTemp = "ws://" + path;

            if (window.location.protocol.startsWith("https")) {
                websocketUrlTemp = "wss://" + path;
            }
        }
    }
    
    const webSocketUrl = websocketUrlTemp
    const applicationWebSocketUrl = webSocketUrl + "/application";
    
    useEffect(() => {
            console.log("--> websocket url connection: " + applicationWebSocketUrl);
            webSocket.current = new WebSocket(applicationWebSocketUrl);

            webSocket.current.onopen = () => {
                console.log('WebSocket Connected');
                setIsWebSocketConnected(true);
            };

            webSocket.current.onmessage = (event) => {
                const newMessage = event.data;
                setLatestMessage(newMessage);

                let command = '';
                let parsedMessage = JSON.parse(newMessage);
                if (typeof parsedMessage === 'string') {
                    parsedMessage = JSON.parse(parsedMessage);
                }
                command = parsedMessage.command;

                if (command === 'pong') {
                    console.log('Received pong from server');
                }
            };

            webSocket.current.onclose = () => {
                console.log('WebSocket Disconnected');
                setIsWebSocketConnected(false);
            };

            webSocket.current.onerror = (error) => {
                console.error('WebSocket Error');
            };

            const pingInterval = setInterval(() => {
                if (webSocket.current && webSocket.current.readyState === WebSocket.OPEN) {
                    webSocket.current.send(JSON.stringify({command: "ping"}));
                } else if (webSocket.current && webSocket.current.readyState === WebSocket.CLOSED) {
                    console.log('WebSocket not connected, unable to send ping');
                    webSocket.current = new WebSocket(applicationWebSocketUrl);
                }
            }, 5000);

            return () => {
                webSocket.current.close();
                clearInterval(pingInterval);
            };
    },[applicationWebSocketUrl]);

    const sendMessage = (message) => {
        if (webSocket.current && isWebSocketConnected) {
            webSocket.current.send(message);
        }
    };

    return (
        <WebSocketContext.Provider value={{ sendMessage, latestMessage, isWebSocketConnected}}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => {
    return useContext(WebSocketContext);
};