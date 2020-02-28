float[D_MAX] rotate(int d, float phi, int d0, int d1, float[D_MAX] x) {
  float r0 = cos(phi), r1 = sin(phi), x0 = x[d0], x1 = x[d1];

  x[d0] = x0 * r0 - x1 * r1;
  x[d1] = x0 * r1 + x1 * r0;

  return x;
}
