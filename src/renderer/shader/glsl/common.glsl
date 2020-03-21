#define zero(v) v = float[](0., 0., 0., 0., 0., 0., 0., 0., 0., 0.);

float round(float x) {
  float r = mod(x, 1.);
  if (r < 0.5) {
    return floor(x);
  } else {
    return ceil(x);
  }
}

float norm2(float[D_MAX] x) {
  float sum;
  for (int k = 0; k < D_MAX; k++) {
    sum += x[k] * x[k];
  }
  return sum;
}

float norm(float[D_MAX] x) {
  return sqrt(norm2(x));
}
