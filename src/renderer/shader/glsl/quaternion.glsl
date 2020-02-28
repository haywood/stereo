// r = 0
// i = 1
// j = 2
// k = 3

float[D_MAX] apply_r(int d, float r, float[D_MAX] x) {
  float[D_MAX] y;

  y[0] = x[0] * r; // r * r = r
  y[1] = x[1] * r; // i * r = i
  y[2] = x[2] * r; // j * r = j
  y[3] = x[3] * r; // k * r = k

  return y;
}

float[D_MAX] apply_i(int d, float i, float[D_MAX] x) {
  float[D_MAX] y;

  y[0] = -x[1] * i; // i * i = -1
  y[1] = x[0] * i; // r * i = i
  y[2] = x[3] * i; // k * i = j
  y[3] = -x[2] * i; // j * i = -k

  return y;
}

float[D_MAX] apply_j(int d, float j, float[D_MAX] x) {
  float[D_MAX] y;

  y[0] = -x[2] * j; // j * j = -1
  y[1] = -x[3] * j; // k * j = -i
  y[2] = x[0] * j; // r * j = j
  y[3] = x[1] * j; // i * j = k


  return y;
}

float[D_MAX] apply_k(int d, float k, float[D_MAX] x) {
  float[D_MAX] y;

  y[0] = -x[3] * k; // k * k = -1
  y[1] = x[2] * k; // j * k = i
  y[2] = -x[1] * k; // i * k = -j
  y[3] = x[0] * k; // r * k = k


  return y;
}

float[D_MAX] quaternion(int d, float[4] q, float[D_MAX] x) {
  float[D_MAX] y,
    r = apply_r(d, q[0], x),
    i = apply_i(d, q[1], x),
    j = apply_j(d, q[2], x),
    k = apply_k(d, q[3], x);

  for (int n = 0; n < d; n++) {
    y[n] += r[n] + i[n] + j[n] + k[n];
  }

  return y;
}
