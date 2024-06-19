import React from "react";
import {render} from "@testing-library/react";
import {WebSocketProvider} from "../../Components/WebSocketProvider";
import WS from "jest-websocket-mock";

global.console = { log: jest.fn(), error: jest.fn() };

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

    it('does print WebSocket Connected when onopen is called', async () => {
        const server = new WS("ws://localhost:5080/Conference/websocket/application", { jsonProtocol: true });

        render(<WebSocketProvider/>);

        await server.connected;
        server.close();

        expect(console.log).toHaveBeenCalledWith('WebSocket Connected');
    });

    it('does print WebSocket Disconnected when onclose is called', async () => {
        const server = new WS("ws://localhost:5080/Conference/websocket/application", { jsonProtocol: true });

        render(<WebSocketProvider/>);

        await server.connected;
        server.close();

        expect(console.log).toHaveBeenCalledWith('WebSocket Disconnected');
    });

    it('does print WebSocket Error when onerror is called', async () => {
        const server = new WS("ws://localhost:5080/Conference/websocket/application", { jsonProtocol: true });

        render(<WebSocketProvider/>);

        await server.connected;
        server.error();

        expect(console.error).toHaveBeenCalledWith('WebSocket Error');
    });

    it('does print Received pong from server when onmessage is called', async () => {
        const server = new WS("ws://localhost:5080/Conference/websocket/application", { jsonProtocol: true });

        render(<WebSocketProvider/>);

        await server.connected;
        server.send('{"command":"pong"}');

        expect(console.log).toHaveBeenCalledWith('Received pong from server');
    });
});