#define vector float[D_MAX];

float[D_MAX]  interval(int d, float a, float b, float i, float n) {
  float branching_factor = round(pow(n, 1. / float(d)));
  float[D_MAX] x;

  for (int k = 0; k < d; k++) {
    float exp = float(d - k - 1);
    float dividend = round(i / pow(branching_factor, exp));
    float tmp = mod(dividend, branching_factor) / (branching_factor - 1.);
    x[k] = a + tmp * (b - a);
  }

  return x;
}

float[D_MAX] init_cube(int d, float l, float i, float n) {
  float n_face = round(n / float(d) / 2.);
  float branching_factor = round(pow(n_face, 1. / float(d)));
  float[D_MAX] x;

  for (int k = 0; k < d; k++) {
    float exp = float(d - k - 1);
    float dividend = round(i / pow(branching_factor, exp));
    float tmp = mod(dividend, branching_factor) / (branching_factor - 1.);
    x[k] = l * (tmp - 0.5);
  }

  return x;
}

float[D_MAX] polar2cart(int d, float r, float[D_MAX] x) {
  float[D_MAX] y;
  y[0] = r;
  for (int k = 1; k < d; k++) {
    y[k] = y[0] * sin(x[k - 1]);
    y[0] *= cos(x[k - 1]);
  }

  return y;
}

float[D_MAX] spiral(int d, float r, float[D_MAX] x) {
  return polar2cart(d, r + r * norm(x), x);
}

float[D_MAX] sphere(int d, float r, float[D_MAX] x) {
  return polar2cart(d, r, x);
}

float[D_MAX] lattice(int d, float l, float[D_MAX] x) {
  for (int k = 0; k < d; k++) {
    x[k] = l * (x[k] - 0.5);
  }

  return x;
}

float[D_MAX] cube(int d, float l, float i, float n, float[D_MAX] x) {
  float sign = i <= n / 2. ? 1. : -1.;
  float value = sign * l / 2.;

  int axis = int(mod(i / float(d) / 2., float(d)));
  for (int k = 0; k < D_MAX; k++) {
    if (k == axis) {
      x[k] = value;
      break;
    }
  }

  return x;
}

float[D_MAX] rotate(int d, float phi, int d0, int d1, float[D_MAX] x) {
  float r0 = cos(phi),
        r1 = sin(phi),
        x0 = x[d0],
        x1 = x[d1];

  x[d0] = x0 * r0 - x1 * r1;
  x[d1] = x0 * r1 + x1 * r0;

  return x;
}

float[D_MAX] rotate(int d, float phi, int[D_MAX] d0s, int[D_MAX] d1s, float[D_MAX] x) {
  for (int i0 = 0; i0 < d && d0s[i0] >= 0; i0++) {
    for (int i1 = 0; i1 < d && d1s[i1] >= 0; i1++) {
      if (d0s[i0] == d1s[i1]) continue;

      x = rotate(d, phi, d0s[i0], d1s[i1], x);
    }
  }
  return x;
}

float[D_MAX] torus(int d, float[D_MAX] r, float[D_MAX] x) {
  float[D_MAX] tmp = x;
  x = sphere(2, r[0], x);

  for (int k = 1; k < d - 1; k++) {
    x[0] += r[k];
    x = rotate(d, tmp[k], k - 1, k + 1, x);
  }

  return x;
}

float[D_MAX] stereo(int from, int to, float[D_MAX] x) {
  if (from > to) {
    while (from-- > to) {
      float x0 = x[0];
      for (int k = 0; k < from; k++) {
        x[k] = x[k + 1] / (1. - x0);
      }
    }
  } else if (from < to) {
    while (from++ < to) {
      float n2 = norm2(x);
      float divisor = n2 + 1.;
      for (int k = 1; k < from; k++) {
        x[k] = 2. * x[k - 1] / divisor;
      }
      x[0] = (n2 - 1.) / divisor;
    }
  }

  return x;
}

float[D_MAX] quaternion(float r, float i, float j, float k, float[D_MAX] x) {
  const int R = 0;
  const int I = 1;
  const int J = 2;
  const int K = 3;
  float[D_MAX] y;

  // y += x * r
  y[R] += x[R] * r; // r * r = r
  y[I] += x[I] * r; // i * r = i
  y[J] += x[J] * r; // j * r = j
  y[K] += x[K] * r; // k * r = k

  // y += x * i
  y[R] += -x[I] * i; // i * i = -1
  y[I] +=  x[R] * i; // r * i = i
  y[J] +=  x[K] * i; // k * i = j
  y[K] += -x[J] * i; // j * i = -k

  // y += x *j
  y[R] += -x[J] * j; // j * j = -1
  y[I] += -x[K] * j; // k * j = -i
  y[J] +=  x[R] * j; // r * j = j
  y[K] +=  x[I] * j; // i * j = k
  
  // y += x * k
  y[R] += -x[K] * k; // k * k = -1
  y[I] +=  x[J] * k; // j * k = i
  y[J] += -x[I] * k; // i * k = -j
  y[K] +=  x[R] * k; // r * k = k

  return y;
}

