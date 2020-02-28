#define Q_R 0
#define Q_I 1
#define Q_J 2
#define Q_K 3

float[D_MAX] quaternion_r(int d, float r, float[D_MAX] x) {
  float[D_MAX] y;

  y[Q_R] = x[Q_R] * r; // r * r = r
  y[Q_I] = x[Q_I] * r; // i * r = i
  y[Q_J] = x[Q_J] * r; // j * r = j
  y[Q_K] = x[Q_K] * r; // k * r = k

  return y;
}

float[D_MAX] quaternion_i(int d, float i, float[D_MAX] x) {
  float[D_MAX] y;

  y[Q_R] = -x[Q_I] * i; // i * i = -1
  y[Q_I] = x[Q_R] * i; // r * i = i
  y[Q_J] = x[Q_K] * i; // k * i = j
  y[Q_K] = -x[Q_J] * i; // j * i = -k

  return y;
}

float[D_MAX] quaternion_j(int d, float j, float[D_MAX] x) {
  float[D_MAX] y;

  y[Q_R] = -x[Q_J] * j; // j * j = -1
  y[Q_I] = -x[Q_K] * j; // k * j = -i
  y[Q_J] = x[Q_R] * j; // r * j = j
  y[Q_K] = x[Q_I] * j; // i * j = k


  return y;
}

float[D_MAX] quaternion_k(int d, float k, float[D_MAX] x) {
  float[D_MAX] y;

  y[Q_R] = -x[Q_K] * k; // k * k = -1
  y[Q_I] = x[Q_J] * k; // j * k = i
  y[Q_J] = -x[Q_I] * k; // i * k = -j
  y[Q_K] = x[Q_R] * k; // r * k = k


  return y;
}

float[D_MAX] quaternion(int d, float[4] q, float[D_MAX] x) {
  float[D_MAX] y,
    r = quaternion_r(d, q[Q_R], x),
    i = quaternion_i(d, q[Q_I], x),
    j = quaternion_j(d, q[Q_J], x),
    k = quaternion_k(d, q[Q_K], x);

  for (int n = 0; n < d; n++) {
    y[n] += r[n] + i[n] + j[n] + k[n];
  }

  return y;
}
