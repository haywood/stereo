float[D_MAX] lattice(int d, float l, float[D_MAX] x) {
  float[D_MAX] y;

  for (int k = 0; k < d; k++) {
    y[k] = l * (x[k] - 0.5);
  }

  return y;
}
