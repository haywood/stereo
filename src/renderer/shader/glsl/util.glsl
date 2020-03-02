#define copy(src, dst) for (int k = 0; k < D_MAX; k++) { dst[k] = src[k]; }
#define zero(v) for (int k = 0; k < D_MAX; k++) { v[k] = 0.; }

float round(float x) {
  float r = mod(x, 1.);
  if (r < 0.5) {
    return floor(x);
  } else {
    return ceil(x);
  }
}

float norm2(float x[D_MAX]) {
  float sum;
  for (int k = 0; k < D_MAX; k++) {
    sum += x[k] * x[k];
  }
  return sum;
}

float norm(float x[D_MAX]) {
  return sqrt(norm2(x));
}
