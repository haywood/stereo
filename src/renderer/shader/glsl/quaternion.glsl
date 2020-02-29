#define Q_R 0
#define Q_I 1
#define Q_J 2
#define Q_K 3

void quaternion_r(int d, float r) {
  y[Q_R] += x[Q_R] * r; // r * r = r
  y[Q_I] += x[Q_I] * r; // i * r = i
  y[Q_J] += x[Q_J] * r; // j * r = j
  y[Q_K] += x[Q_K] * r; // k * r = k
}

void quaternion_i(int d, float i) {
  y[Q_R] += -x[Q_I] * i; // i * i = -1
  y[Q_I] += x[Q_R] * i; // r * i = i
  y[Q_J] += x[Q_K] * i; // k * i = j
  y[Q_K] += -x[Q_J] * i; // j * i = -k
}

void quaternion_j(int d, float j) {
  y[Q_R] += -x[Q_J] * j; // j * j = -1
  y[Q_I] += -x[Q_K] * j; // k * j = -i
  y[Q_J] += x[Q_R] * j; // r * j = j
  y[Q_K] += x[Q_I] * j; // i * j = k
}

void quaternion_k(int d, float k) {
  y[Q_R] += -x[Q_K] * k; // k * k = -1
  y[Q_I] += x[Q_J] * k; // j * k = i
  y[Q_J] += -x[Q_I] * k; // i * k = -j
  y[Q_K] += x[Q_R] * k; // r * k = k
}

void quaternion(int d, float r, float i, float j, float k) {
  quaternion_r(d, r);
  quaternion_i(d, i);
  quaternion_j(d, j);
  quaternion_k(d, k);
}
