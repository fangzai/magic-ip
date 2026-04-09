const express = require('express');
const { WebSocketServer } = require('ws');
const path = require('path');
const http = require('http');

const { cloudflareIps } = require('./lib/cloudflare-ips');
const IPScanner = require('./lib/ip-scanner');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Single instance of scanner
const scanner = new IPScanner();

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Send initial config/status
  ws.send(JSON.stringify({
    type: 'status',
    data: {
      isScanning: scanner.isScanning,
      cidrs: cloudflareIps.length
    }
  }));

  ws.on('message', (message) => {
    try {
      const msg = JSON.parse(message);
      
      switch (msg.type) {
        case 'start':
          if (!scanner.isScanning) {
            scanner.startScan(cloudflareIps, msg.config);
          }
          break;
        case 'stop':
          scanner.stopScan();
          break;
      }
    } catch (e) {
      console.error('WS Error:', e);
    }
  });
});

// Broadcast helper
function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(JSON.stringify(data));
    }
  });
}

// Scanner event listeners
scanner.on('progress', (progress) => {
  broadcast({
    type: 'progress',
    data: progress
  });
});

scanner.on('result', (result) => {
  broadcast({
    type: 'result',
    data: result
  });
});

scanner.on('done', (results) => {
  broadcast({
    type: 'done',
    data: results
  });
});

app.get('/api/cidrs', (req, res) => {
  res.json({ cidrs: cloudflareIps });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
