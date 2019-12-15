import http from 'http';
import WebSocket from 'ws';
import { getLogger, setDefaultLevel } from 'loglevel';
import { Params } from '../core/pipe/pipe';
import { startPool, runPipeline, stopPool } from '../core/pipe/pool';

setDefaultLevel('info');
const logger = getLogger('Server');

startPool(2);
process.on('SIGINT', async () => {
  logger.info('caught signit. terminating worker pool.');
  const success = await stopPool();
  if (success) process.exit(0);
  else process.exit(1);
});

const server = http.createServer();
const wss = new WebSocket.Server({ server });
const port = 8000;

wss.on('listening', () => console.info(`server is listening for connections at port ${port}`));

wss.on('connection', (ws) => {
  logger.info('received client connection.');

  ws.on('message', (msg) => {
    runPipeline(JSON.parse(msg as string) as Params)
      .then((data) => ws.send(data))
      .catch((err) => logger.error(`error handling msg ${msg}`, err));
  });
});

server.listen(port);
