void stereo(int from, int to) {
  if (from == to) return;

  int d0 = from, d = to;

  while (d0 > d) {
    for (int k = 0; k < d0 - 1; k++) {
      y[k] = x[k + 1] / (1. - x[0]);
    }
    d0--;
    copy(y, x);
  }

  while (d0 < d) {
    float n2 = 0.;
    for (int k = 0; k < d0; k++) {
      n2 += x[k] * x[k];
    }
    float divisor = n2 + 1.;
    x[0] = (n2 - 1.) / divisor;
    for (int k = 0; k <= d0; k++) {
      y[k] = 2. * x[k - 1] / divisor;
    }
    d0++;
    copy(y, x);
  }
}
