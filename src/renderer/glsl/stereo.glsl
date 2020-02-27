float[D_MAX] stereo(int from, int to, float[D_MAX] x) {
  if (from == to) return x;

  int d0 = from, d = to;
  float[D_MAX] y;

  while (d0 > d) {
    for (int k = 0; k < d0 - 1; k++) {
      y[k] = x[k + 1] / (1. - x[0]);
    }
    d0--;
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
  }

  return y;
}
