declare module "worker-loader?name=static/[hash].worker.js!*" {
  class StereoWorker extends Worker {
    constructor();
  }

  export default StereoWorker;
}
