float[D_MAX] sphere(int d, float r, float[D_MAX] x) {
  float[D_MAX] y;

  y[0] = r;
  for (int k = 1; k < d; k++) {
    y[k] = y[0] * sin(x[k - 1]);
    y[0] *= cos(x[k - 1]);
  }

  return y;
}
