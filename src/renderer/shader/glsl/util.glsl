#define copy(src, dst) for (int k = 0; k < D_MAX; k++) { dst[k] = src[k]; }

float round(float x) {
  float r = mod(x, 1.);
  if (r < 0.5) {
    return floor(x);
  } else {
    return ceil(x);
  }
}
