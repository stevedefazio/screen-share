const WebSocket = require('ws');
const screenshot = require('screenshot-desktop');
const robot = require('robotjs');

// Create WebSocket server on port 8080
const wss = new WebSocket.Server({ port: 8080 });

console.log('WebSocket server running on ws://0.0.0.0:8080');

wss.on('connection', (ws) => {
    console.log('Client connected');

    // Send screenshots every 100ms
    const interval = setInterval(async () => {
        try {
            // Capture screenshot as JPEG
            const img = await screenshot({ format: 'jpg' });
            // Convert buffer to base64
            const base64Image = img.toString('base64');
            // Send to client
            if (ws.isAlive !== false) {
                ws.send(JSON.stringify({
                    type: 'image',
                    data: `data:image/jpeg;base64,${base64Image}`
                }));
            }
        } catch (err) {
            console.error('Screenshot error:', err);
        }
    }, 100); // Edit this interval number if stream is too laggy or uses too much bandiwdth (100 > 200 would increase screenshot interval)

    // Handle client disconnect
    ws.on('close', () => {
        console.log('Client disconnected');
        clearInterval(interval);
    });

    // Keep connection alive
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    // Handle client control events
    ws.on('message', (message) => {
        try {
            console.log('Received:', message); // Debug log
            const data = JSON.parse(message);
            if (data.type === 'mouse_move') {
                robot.moveMouse(data.x, data.y);
            } else if (data.type === 'mouse_click') {
                robot.mouseClick(data.button); // 'left' or 'right'
            } else if (data.type === 'key_press') {
                robot.keyTap(data.key);
            }
        } catch (err) {
            console.error('Control error:', err);
        }
    });
});

// Ping clients to check if alive
setInterval(() => {
    wss.clients.forEach((ws) => {
        if (!ws.isAlive) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);




//===========================================
// Serves up the client webpage
const express = require('express');
const app = express();

// Serve client.html on port 8081
app.use(express.static(__dirname));
app.listen(8081, () => {
    console.log('HTTP server running on http://0.0.0.0:8081');
});