import Koa from 'koa';
import path from 'path';
import koaWebpack from 'koa-webpack';
import Router from '@koa/router';
import http2 from 'http2';
import pipeline from './pipeline';
import fs from 'fs';
import logger from 'koa-logger';
import compress from 'koa-compress';

(async () => {
  const app = new Koa();
  const router = new Router();

  const middleware = await koaWebpack();

  router.get('/', async (ctx) => {
    const filename = path.resolve('.dist/index.html')
    ctx.response.type = 'html'
    ctx.response.body = middleware.devMiddleware.fileSystem.createReadStream(filename)
  });

  router.get('/data', async (ctx) => {
    const n = parseInt(ctx.query.n || 4096);
    const t = parseInt(ctx.query.t || 0);
    const rate = parseFloat(ctx.query.rate || Math.PI / 180);
    ctx.body = pipeline(n, t, rate);
  });

  app
    .use(logger())
    .use(compress({threshold: 2048}))
    .use(router.routes())
    .use(router.allowedMethods())
    .use(middleware);

  const server = http2.createSecureServer({
    key: fs.readFileSync('localhost-privkey.pem'),
    cert: fs.readFileSync('localhost-cert.pem'),
  }, app.callback());

  server.listen(8000);
})();
