import path from 'path';
import https from 'https';
import fs from 'fs';
import WebSocket from 'ws';
import { Worker } from 'worker_threads';

const server = https.createServer({
  key: fs.readFileSync('localhost-privkey.pem'),
  cert: fs.readFileSync('localhost-cert.pem'),
});

const wss = new WebSocket.Server({ server });

const startWorker = (ws: WebSocket) => {
  const worker = new Worker(path.resolve(__dirname, 'worker.js'));
  worker.on('message', (value) => ws.send(JSON.stringify(value)));

  worker.on('error', (err) => {
    console.error('worker thread encountered error');
    console.error(err);
  });

  worker.on('exit', (code) => {
    console.warn(`worker thread exited with code ${code}. disconnecting from client`);
    ws.close();
  });

  return worker;
};

wss.on('connection', (ws) => {
  console.log('received client connection. starting worker thread.');

  const worker = startWorker(ws);

  ws.on('message', (msg) => {
    worker.postMessage(JSON.parse(msg as string));
  });

  ws.on('close', () => {
    console.log('disconneted from client. stopping worker thread');
    worker.postMessage('exit');
  });
});

server.listen(8000);