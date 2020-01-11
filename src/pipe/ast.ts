export type PipeNode = {
  kind: 'pipe';
  n: number;
  d0: number;
  steps: StepNode[];
};

export type StepNode = {
  kind: 'step';
  type: string;
  args: Scalar[];
};

export type Scalar = ArithNode | NumberNode | FnNode | AccessNode | IdNode;

export type ArithNode = {
  kind: 'arith';
  op: string;
  operands: [Scalar, Scalar];
};

export type NumberNode = {
  kind: 'number';
  value: number;
};

export type FnNode = {
  kind: 'fn';
  name: string;
  args: Scalar[];
};

export type AccessNode = {
  kind: 'access';
  id: string;
  index: Scalar;
};

export type IdNode = {
  kind: 'id';
  id: string;
};

export type Value = number | Function;
