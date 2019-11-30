export default () => {
  let fn;
  let points;

  self.onmessage = msg => {
    if (msg.fn) {
      fn = msg.fn;
      points = fn();
    } else if (msg.sendPoints) {
      self.postMessage(points, "");
      points = fn();
    }
  };
}();
