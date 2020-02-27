float[D_MAX] interval(int d, float a, float b, float[D_MAX] x) {
  float[D_MAX] y;

  for (int k = 0; k < d; k++) {
    y[k] = a + x[k] * (b - a);
  }

  return y;
}
