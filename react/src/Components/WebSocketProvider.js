import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {getRootAttribute} from "../utils";
import _ from "lodash";

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
    const webSocket = useRef(null);
    const [latestMessage, setLatestMessage] = useState(null);
    const [latestSyncAdministrativeFieldsResponse, setLatestSyncAdministrativeFieldsResponse] = useState(null);
    const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);

    var websocketUrlTemp = getRootAttribute("data-websocket-url");
    if (!websocketUrlTemp) {
      websocketUrlTemp = process.env.REACT_APP_WEBSOCKET_URL;
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

                let command = JSON.parse(newMessage).command;

                if (command === 'syncAdministrativeFieldsResponse' && !_.isEqual(latestSyncAdministrativeFieldsResponse, newMessage)) {
                  setLatestSyncAdministrativeFieldsResponse(newMessage);
                  setLatestMessage(newMessage);
                } else if (command === 'pong') {
                  console.log('Received pong from server');
                  if (window.conference && window.conference.requestSyncAdministrativeFields) {
                    window.conference.requestSyncAdministrativeFields();
                  }
                } else {
                  setLatestMessage(newMessage);
                }
            };

            webSocket.current.onclose = () => {
                console.log('WebSocket Disconnected');
                setIsWebSocketConnected(false);
            };

            webSocket.current.onerror = (error) => {
                console.error('WebSocket Error:', error);
            };

            const pingInterval = setInterval(() => {
              if (webSocket.current && webSocket.current.readyState === WebSocket.OPEN) {
                var jsCmd = {
                  command: "ping"
                }
                webSocket.current.send(JSON.stringify(jsCmd));
              } else if (webSocket.current && webSocket.current.readyState === WebSocket.CLOSED) {
                console.log('WebSocket not connected, unable to send ping');
                webSocket.current = new WebSocket(applicationWebSocketUrl);
              }
            }, 10000);

            return () => {
                webSocket.current.close();
                clearInterval(pingInterval);
            };
    },[applicationWebSocketUrl]); // eslint-disable-line react-hooks/exhaustive-deps

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
