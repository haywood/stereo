float[D_MAX] torus(int d, float[D_MAX] r, float[D_MAX] x) {
  float[D_MAX] y = sphere(2, r[0], x);

  for (int k = 1; k < d - 1; k++) {
    y[0] += r[k];
    y = rotate(d, x[k], k - 1, k + 1, y);
  }

  return y;
}
