float[D_MAX] spiral(int d, float r, float[D_MAX] x) {
  float norm_x;
  for (int k = 0; k < d; k++) {
    norm_x += x[k] * x[k];
  }
  norm_x = sqrt(norm_x);
  return polar2cart(d, r * norm_x, x);
}
