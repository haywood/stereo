import http from 'http';
import WebSocket from 'ws';
import { getLogger, setDefaultLevel } from 'loglevel';
import { spawn, Thread, Worker, Pool } from "threads"
import { Params, runPipeline } from '../core/pipeline';

setDefaultLevel('info');
const logger = getLogger('Server');

logger.info('starting worker pool');
const pool = Pool(() => spawn(new Worker('../core/pipeline.worker')), 2);

pool.events().subscribe((event: any) => {
  if (event.error) {
    logger.error('received error event from worker pool', event);
  }
})

process.on('SIGINT', async () => {
  logger.info('caught signit. terminating worker pool.');
  try {
    await pool.terminate();
  } catch (err) {
    logger.error('error terminating worker pool', err);
    process.exit(1);
  }
  process.exit(0);
});

const server = http.createServer();
const wss = new WebSocket.Server({ server });
const port = 8000;

wss.on('listening', () => console.info(`server is listening for connections at port ${port}`))

wss.on('connection', (ws) => {
  logger.info('received client connection.');

  ws.on('message', (msg) => {
    pool.queue(async runPipeline =>
      runPipeline(JSON.parse(msg as string) as Params)
        .then((data) => ws.send(JSON.stringify(data)))
        .catch((err) => logger.error(`error handling msg ${msg}`, err)));
  });
});

server.listen(port);