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
