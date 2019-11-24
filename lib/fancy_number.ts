type N = FancyNumber;

const r = "r";
const i = "i";
const j = "j";
const k = "k";
const l = "l";
const m = "m";
const n = "n";
const o = "o";
export const components = [r, i, j, k, l, m, n, o];

export class FancyNumber {
  constructor(private readonly bag: Bag) {
    for (const c in bag) {
      if (bag[c] === 0) delete bag[c];
    }
  }

  static r = r => new FancyNumber({ r });
  static i = i => new FancyNumber({ i });
  static j = j => new FancyNumber({ j });
  static k = k => new FancyNumber({ k });

  static of(v: number[]): N {
    const bag = {};
    for (let i = 0; i < v.length; i++) {
      bag[components[i]] = v[i];
    }
    return new FancyNumber(bag);
  }

  static zero = () => {
    return new FancyNumber({});
  };

  at(c) {
    return this.bag[c] || 0;
  }

  get vector(): number[] {
    const v = [];
    for (const c of components) {
      v.push(this.at(c));
    }
    return v;
  }

  add(that: N): N {
    return this.componentWise(that, (a, b) => a + b);
  }

  sub(that: N): N {
    return this.componentWise(that, (a, b) => a - b);
  }

  mul = (that: N): N => {
    return Object.keys(this.bag)
      .map(c => this.distribute(c, that))
      .reduce((a, b) => a.add(b));
  };

  div(that: N): N {
    return this.mul(that.inv());
  }

  dot(that: N) {
    const p = this.componentWise(that, (a, b) => a * b);
    let sum = 0;
    for (const c in this.bag) {
      sum += p[c];
    }
    return sum;
  }

  norm(): number {
    return Math.sqrt(this.dot(this));
  }

  dist(that: N): number {
    return this.sub(that).norm();
  }

  inv(): N {
    return FancyNumber.r(this.norm() ** 2).mul(
      new FancyNumber({
        r: this.bag.r,
        i: -this.bag.i,
        j: -this.bag.j,
        k: -this.bag.k
      })
    );
  }

  neg(): N {
    const bag = {};
    for (const c in this.bag) {
      bag[c] = -this.at(c);
    }
    return new FancyNumber(bag);
  }

  equals(that: N): boolean {
    for (const c of components) {
      if (this.at(c) !== that.at(c)) return false;
    }
    return true;
  }

  private componentWise(that: N, op: (a: number, b: number) => number): N {
    const bag: Bag = {};
    for (const c of components) {
      bag[c] = op(this.at(c), that.at(c));
    }
    return new FancyNumber(bag);
  }

  private distribute(c0, that: FancyNumber) {
    const rule = table[c0];
    const bag = {};
    const a = this.at(c0);
    for (const c1 in that.bag) {
      const { c, v } = rule[c1](a, that.at(c1));
      bag[c] = (bag[c] || 0) + v;
    }
    return new FancyNumber(bag);
  }
}

const table = (() => {
  const pos = c => (a, b) => ({ c, v: a * b });
  const neg = c => (a, b) => ({ c, v: -a * b });
  const sign = (c0, c1) => 1;
  const pairs = {
    // prettier-ignore
    r: { r: r, i: i, j: j, k: k, l: l, m: m, n: n, o: o },
    i: { r: i, i: r, j: k, k: j, l: m, m: l, n: o, o: n },
    j: { r: j, i: k, j: r, k: i, l: n, m: o, n: l, o: l },
    k: { r: k, i: j, j: i, k: r, l: o, m: n, n: n, o: l },
    l: { r: l, i: m, j: n, k: o, l: r, m: j, n: j, o: k },
    m: { r: m, i: k, j: o, k: n, l: i, m: r, n: k, o: j },
    n: { r: n, i: o, j: k, k: l, l: j, m: k, n: r, o: i },
    o: { r: o, i: n, j: l, k: m, l: k, m: j, n: i, o: r }
  };
  const component = (c0, c1) => {};
  return components.reduce((rules, c0) => {
    rules[c0] = components.reduce((rule, c1) => {
      if (c0 === r) {
        rule[c1] = pos(c1);
      } else if (c1 === r) {
        rule[c1] = pos(c0);
      } else {
        const s = c0 < c1 ? 1 : -1;
        const c = pairs[c0][c1];
        rule[c1] = (a, b) => ({ c, v: s * a * b });
      }
      return rule;
    }, {});
    return rules;
  }, {});
})();

type Bag = {
  r?: number;
  i?: number;
  j?: number;
  k?: number;
  l?: number;
  m?: number;
  n?: number;
  o?: number;
};
