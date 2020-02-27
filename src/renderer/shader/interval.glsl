float[D_MAX] interval(int d, float[D_MAX] a, float[D_MAX] b, float[D_MAX] x) {
  float[D_MAX] y;

  for (int k = 0; k < d; k++) {
    y[k] = a[k] + x[k] * (b[k] - a[k]);
  }

  return y;
}
