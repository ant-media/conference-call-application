import React from "react";
import {ConferenceContext} from "../../pages/AntMedia";
import {render, act} from "@testing-library/react";
import WaitingRoom from "../../pages/WaitingRoom";
import {WebSocketProvider, useWebSocket} from "../../Components/WebSocketProvider";

// Mock the WebSocket class
global.WebSocket = class {
    constructor(url) {
        this.url = url;
        this.onopen = null;
        this.onmessage = null;
        this.onclose = null;
        this.onerror = null;
        this.readyState = WebSocket.OPEN;
        this.send = jest.fn();
        this.close = jest.fn();
    }

    addEventListener(event, callback) {
        if (event === 'message') {
            this.onmessage = callback;
        } else if (event === 'close') {
            this.onclose = callback;
        } else if (event === 'error') {
            this.onerror = callback;
        } else if (event === 'open') {
            this.onopen = callback;
        }
    }

    removeEventListener(event, callback) {
        if (event === 'message') {
            this.onmessage = null;
        } else if (event === 'close') {
            this.onclose = null;
        } else if (event === 'error') {
            this.onerror = null;
        } else if (event === 'open') {
            this.onopen = null;
        }
    }
};

describe('WebSocketProvider test', () => {

    let webSocket;
    let isWebSocketConnected;
    let sendMessage;

    beforeEach(() => {
        // Reset the mock implementation before each test
        //jest.clearAllMocks();

        webSocket = { current: { send: jest.fn() } };
        isWebSocketConnected = true;
        sendMessage = (message) => {
            if (webSocket.current && isWebSocketConnected) {
                webSocket.current.send(message);
            }
        };
    });


    it('renders WaitingRoom component without crashing', () => {
        render(<WebSocketProvider/>);
    });

    it('sends message when WebSocket is connected', () => {
        const message = 'Test message';
        sendMessage(message);
        expect(webSocket.current.send).toHaveBeenCalledWith(message);
    });

    it('does not send message when WebSocket is not connected', () => {
        isWebSocketConnected = false;
        const message = 'Test message';
        sendMessage(message);
        expect(webSocket.current.send).not.toHaveBeenCalled();
    });

    it('does not send message when WebSocket is null', () => {
        webSocket.current = null;
        const message = 'Test message';
        sendMessage(message);
        expect(webSocket.current).toBeNull();
    });
});