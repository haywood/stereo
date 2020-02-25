uniform float near;
uniform int n;

vec3 lattice_01(int d) {
  float branching_factor = round(pow(float(n), 1. / float(d)));
  vec3 x;

  for (int k = 0; k < d; k++) {
    float exp = float(d - k - 1);
    float dividend = round(position[0] / pow(branching_factor, exp));
    x[k] = float(int(dividend) % int(branching_factor)) / (branching_factor - 1.);
  }

  return x;
}

vec3 interval(int d, vec3 x) {
  vec3 a = vec3(-1.);
  vec3 b = vec3(1.);
  vec3 y;

  for (int k = 0; k < d; k++) {
    y[k] = a[k] + x[k] * (b[k] - a[k]);
  }

  return y;
}

void main() {
  int d = 3;
  vec3 x = lattice_01(d);
  vec3 y = interval(d, x);

  vec4 mvPosition = modelViewMatrix * vec4(y, 1.);
  gl_PointSize = -400. * NEAR / mvPosition.z;
  gl_Position = projectionMatrix * mvPosition;
}
