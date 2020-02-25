uniform int d;
uniform int n;

float[D_MAX] lattice_01(const int d) {
  float branching_factor = round(pow(float(n), 1. / float(d)));
  float[D_MAX] x;

  for (int k = 0; k < d; k++) {
    float exp = float(d - k - 1);
    float dividend = round(position[0] / pow(branching_factor, exp));
    x[k] = float(int(dividend) % int(branching_factor)) / (branching_factor - 1.);
  }

  return x;
}

float[D_MAX] interval(const int d, const float[D_MAX] x) {
  float[D_MAX] a = float[](-1., -1., -1., -1., -1., -1., -1., -1., -1., -1.);
  float[D_MAX] b = float[](1., 1., 1., 1., 1., 1., 1., 1., 1., 1.);
  float[D_MAX] y;

  for (int k = 0; k < d; k++) {
    y[k] = a[k] + x[k] * (b[k] - a[k]);
  }

  return y;
}

vec4 to_position(float[D_MAX] y) {
  vec4 p;

  for (int k = 0; k < d; k++) {
    p[k] = y[k];
  }

  if (d < 4) {
    p[3] = 1.;
  }

  return p;
}

void main() {
  float[D_MAX] x = lattice_01(d);
  float[D_MAX] y = interval(d, x);

  vec4 mvPosition = modelViewMatrix * to_position(y);
  gl_PointSize = -400. * NEAR / mvPosition.z;
  gl_Position = projectionMatrix * mvPosition;
}
