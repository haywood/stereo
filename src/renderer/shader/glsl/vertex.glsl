void interval(int d, float a, float b) {
  float branching_factor = round(pow(n, 1. / float(d)));

  for (int k = 0; k < d; k++) {
    float exp = float(d - k - 1);
    float dividend = round(i / pow(branching_factor, exp));
    float tmp = mod(dividend, branching_factor) / (branching_factor - 1.);
    x[k] = a + tmp * (b - a);
  }
}

void cube(int d, float l) {
  float n_face = round(n / float(d) / 2.);
  float branching_factor = round(pow(n_face, 1. / float(d)));

  for (int k = 0; k < d; k++) {
    float exp = float(d - k - 1);
    float dividend = round(i / pow(branching_factor, exp));
    float tmp = mod(dividend, branching_factor) / (branching_factor - 1.);
    y[k] = l * (tmp - 0.5);
  }
}

void polar2cart(int d, float r) {
  y[0] = r;
  for (int k = 1; k < d; k++) {
    y[k] = y[0] * sin(x[k - 1]);
    y[0] *= cos(x[k - 1]);
  }
}

void quaternion(float r, float i, float j, float k) {
  zero(y);

  // y += x * r
  y[Q_R] += x[Q_R] * r; // r * r = r
  y[Q_I] += x[Q_I] * r; // i * r = i
  y[Q_J] += x[Q_J] * r; // j * r = j
  y[Q_K] += x[Q_K] * r; // k * r = k

  // y += x * i
  y[Q_R] += -x[Q_I] * i; // i * i = -1
  y[Q_I] += x[Q_R] * i; // r * i = i
  y[Q_J] += x[Q_K] * i; // k * i = j
  y[Q_K] += -x[Q_J] * i; // j * i = -k

  // y += x *j
  y[Q_R] += -x[Q_J] * j; // j * j = -1
  y[Q_I] += -x[Q_K] * j; // k * j = -i
  y[Q_J] += x[Q_R] * j; // r * j = j
  y[Q_K] += x[Q_I] * j; // i * j = k
  
  // y += x * k
  y[Q_R] += -x[Q_K] * k; // k * k = -1
  y[Q_I] += x[Q_J] * k; // j * k = i
  y[Q_J] += -x[Q_I] * k; // i * k = -j
  y[Q_K] += x[Q_R] * k; // r * k = k
}

