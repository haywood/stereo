
import http from 'http';
import WebSocket from 'ws';
import { getLogger, setDefaultLevel } from 'loglevel';
import worker from './pipeline.worker';

setDefaultLevel('info');
const logger = getLogger('Server');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  logger.info('received client connection. starting worker thread.');

  ws.on('message', (msg) => {
    const params = JSON.parse(msg as string);
    worker(params).then((data) => ws.send(JSON.stringify(data))).catch((err) => {
      logger.error(`error handling msg ${msg}`, err);
    });
  });

  ws.on('close', () => {
    logger.info('disconneted from client. stopping worker thread');
  });
});

server.listen(8000);