export type ASTNode = PipeNode | StepNode | Operand | ArithNode | FnNode;

export type PipeNode = {
    kind: 'pipe';
    n: number;
    chain: StepNode[];
};

export type StepNode = {
    kind: 'step';
    type: string;
    args: Operand[];
};


export type Operand = ArithNode | NumberNode | FnNode | IdNode;

export type ArithNode = {
    kind: 'arith';
    op: string;
    operands: [Operand, Operand];
};

export type NumberNode = {
    kind: 'number';
    value: number;
};

export type FnNode = {
    kind: 'fn';
    name: string;
    args: Operand[];
};

export type IdNode = {
    kind: 'id';
    id: string;
};

export type Value = number | Function;
