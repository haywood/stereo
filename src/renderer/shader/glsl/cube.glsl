float[D_MAX] cube_face(int d, float l) {
  float n_face = round(float(n) / float(d) / 2.);
  float branching_factor = round(pow(n_face, 1. / float(d)));
  float[D_MAX] y;

  for (int k = 0; k < d; k++) {
    float exp = float(d - k - 1);
    float dividend = round(float(i) / pow(branching_factor, exp));
    float x = mod(dividend, branching_factor) / (branching_factor - 1.);
    y[k] = l * (x - 0.5);
  }

  return y;
}

float[D_MAX] cube(int d, float l, float[D_MAX] x) {
  int axis = int(float(i) / float(d) / 2.) % d;

  if (i <= n / 2) {
    x[axis] = l / 2.;
  } else {
    x[axis] = -l / 2.;
  }

  return x;
}
