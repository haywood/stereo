float[D_MAX] interval(int d, float a, float b) {
  float branching_factor = round(pow(float(n), 1. / float(d)));
  float[D_MAX] y;

  for (int k = 0; k < d; k++) {
    float exp = float(d - k - 1);
    float dividend = round(float(i) / pow(branching_factor, exp));
    float x = float(int(dividend) % int(branching_factor)) / (branching_factor - 1.);
    y[k] = a + x * (b - a);
  }

  return y;
}
