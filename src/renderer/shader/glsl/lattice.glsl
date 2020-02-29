void lattice(int d, float l) {
  for (int k = 0; k < d; k++) {
    y[k] = l * (x[k] - 0.5);
  }
}
