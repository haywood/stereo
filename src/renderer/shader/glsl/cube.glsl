void cube_face(int d, float l) {
  float n_face = round(float(n) / float(d) / 2.);
  float branching_factor = round(pow(n_face, 1. / float(d)));

  for (int k = 0; k < d; k++) {
    float exp = float(d - k - 1);
    float dividend = round(float(i) / pow(branching_factor, exp));
    float tmp = mod(dividend, branching_factor) / (branching_factor - 1.);
    y[k] = l * (tmp - 0.5);
  }
}

void cube(int d, float l) {
  int axis = int(mod(i / float(d) / 2., float(d)));

  if (i <= n / 2.) {
    y[axis] = l / 2.;
  } else {
    y[axis] = -l / 2.;
  }
}
