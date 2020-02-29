void torus(int d, float[D_MAX] r) {
  sphere(2, r[0]);

  float tmp[D_MAX];
  copy(x, tmp);
  copy(y, x);
  for (int k = 1; k < d - 1; k++) {
    x[0] += r[k];
    rotate(d, tmp[k], k - 1, k + 1);
  }
  copy(x, y);
}
