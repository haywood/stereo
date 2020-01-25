import assert from 'assert';

export class Polar {
  static from(
    r: number,
    phi: Float32Array,
    y = new Float32Array(phi.length + 1)
  ) {
    assert.equal(y.length, phi.length + 1);

    y[0] = r;
    for (let i = 1; i < y.length; i++) {
      const sin = Math.sin(phi[i - 1]);
      const cos = Math.cos(phi[i - 1]);
      y[i] = y[0] * sin;
      y[0] *= cos;
    }
    return y;
  }
}
