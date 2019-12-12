import http from 'http';
import WebSocket from 'ws';
import { getLogger, setDefaultLevel } from 'loglevel';
import { spawn, Thread, Worker } from "threads"
import { Params } from '../core/pipeline';

setDefaultLevel('info');
const logger = getLogger('Server');

spawn(new Worker('../core/pipeline.worker')).then(runPipeline => {
  Thread.errors(runPipeline)
    .subscribe(error => logger.error('error in worker thread', error));

  const server = http.createServer();
  const wss = new WebSocket.Server({ server });
  wss.on('connection', (ws) => {
    logger.info('received client connection.');

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
});