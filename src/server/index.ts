import http from 'http';
import WebSocket from 'ws';
import { getLogger, setDefaultLevel } from 'loglevel';
import { spawn, Thread, Worker } from "threads"
import { Params } from '../core/pipeline';

export default () => {
  setDefaultLevel('info');
  const logger = getLogger('Server');

  const server = http.createServer();
  const wss = new WebSocket.Server({ server });

  wss.on('connection', async (ws) => {
    logger.info('received client connection. starting worker thread.');
    const runPipeline = await spawn(new Worker('../core/pipeline.worker'));

    ws.on('message', (msg) => {
      const params: Params = JSON.parse(msg as string);
      runPipeline(params)
        .then((data) => ws.send(JSON.stringify(data)))
        .catch((err) => logger.error(`error handling msg ${msg}`, err));
    });

    ws.on('close', () => {
      logger.info('disconneted from client. stopping worker thread');
      Thread.terminate(runPipeline);
    });
  });

  server.listen(8000);
};
