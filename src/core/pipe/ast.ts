export type Value = number | Function;
export type Operand = ScalarNode | ArithNode | FnNode;
export type ArithNode = {
    kind: 'arith';
    op: string;
    operands: [Operand, Operand];
};
export type FnNode = {
    kind: 'fn';
    name: string;
    args: Operand[];
};
export type ScalarNode = {
    kind: 'scalar';
    id?: string;
    value?: number | Function;
};
export type StepNode = {
    kind: 'step';
    fn: string;
    args: Operand[];
};
export type PipeNode = {
    kind: 'pipe';
    n: number;
    chain: StepNode[];
};
export type Substitutions = {
    [id: string]: ArithNode;
};
export type ASTNode = PipeNode | StepNode | ScalarNode | ArithNode | FnNode;
