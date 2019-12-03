import Koa from 'koa';
import path from 'path';
import koaWebpack from 'koa-webpack';
import Router from '@koa/router';
import https from 'https';
import fs from 'fs';
import logger from 'koa-logger';
import compress from 'koa-compress';
import WebSocket from 'ws';
import { Worker } from 'worker_threads';

(async () => {
  const app = new Koa();
  const router = new Router();

  const middleware = await koaWebpack();

  router.get('/', async (ctx) => {
    const filename = path.resolve('.dist/index.html')
    ctx.response.type = 'html'
    ctx.response.body = middleware.devMiddleware.fileSystem.createReadStream(filename)
  });

  app
    .use(logger())
    .use(compress({ threshold: 2048 }))
    .use(router.routes())
    .use(router.allowedMethods())
    .use(middleware);

  const server = https.createServer({
    key: fs.readFileSync('localhost-privkey.pem'),
    cert: fs.readFileSync('localhost-cert.pem'),
  }, app.callback());

  const wss = new WebSocket.Server({ server });
  wss.on('connection', (ws) => {
    console.log('received client connection. starting worker thread.');

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

    ws.on('message', (msg) => {
      worker.postMessage(JSON.parse(msg as string));
    });

    ws.on('conclude', () => {
      console.log('disconneted from client. stopping worker thread');
      worker.terminate();
    })
  })

  server.listen(8000);
})();
