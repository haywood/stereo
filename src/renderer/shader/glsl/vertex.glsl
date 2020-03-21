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
