uniform float near;
uniform int n;

float[D_MAX] lattice_01(int d) {
  float branching_factor = round(pow(float(n), 1. / float(d)));
  float[D_MAX] x;

  for (int k = 0; k < d; k++) {
    float exp = float(d - k - 1);
    float dividend = round(position[0] / pow(branching_factor, exp));
    x[k] = float(int(dividend) % int(branching_factor)) / (branching_factor - 1.);
  }

  return x;
}

float[D_MAX] interval(int d, float[D_MAX] x) {
  float[D_MAX] a = float[](-1., -1., -1., -1., -1., -1., -1., -1., -1., -1.);
  float[D_MAX] b = float[](1., 1., 1., 1., 1., 1., 1., 1., 1., 1.);
  float[D_MAX] y;

  for (int k = 0; k < d; k++) {
    y[k] = a[k] + x[k] * (b[k] - a[k]);
  }

  return y;
}

void main() {
  int d = 3;
  float[D_MAX] x = lattice_01(d);
  float[D_MAX] y = interval(d, x);

  vec4 mvPosition = modelViewMatrix * vec4(y[0], y[1], y[2], 1.);
  gl_PointSize = -400. * NEAR / mvPosition.z;
  gl_Position = projectionMatrix * mvPosition;
}
