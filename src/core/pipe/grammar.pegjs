/** RULES */

pipe = n:uint pipe_sep chain:chain {
  return {kind: 'pipe', n: parseInt(n), chain};
}

chain =
  head:step pipe_sep tail:chain { return [head, ...tail]; }
  / f:step { return [f]; }

step =
  fn:identifier lparen args:step_args rparen { return {kind: 'step', fn, args} }

step_args =
  head:arith comma tail:step_args { return [head, ...tail]; }
  / arg:arith { return [arg]; }

arith =
  s:scalar op:arith_op a:arith {
     return {kind: 'arith', op, operands: [s, a]};
  }
  / scalar

scalar =
  value:number { return {kind: 'scalar', value}; }
  / fn
  / id
  / lparen a:arith rparen { return a; }

id = id:identifier { return {kind: 'scalar', id}; }

fn = name:identifier lparen args:fn_args rparen {
  return {kind: 'fn', name, args};
}

fn_args =
  head:arith comma tail:fn_args { return [head, ...tail]; }
  / arg:arith { return [arg]; }

/** TERMINALS */

number =
  _ f:float _ { return parseFloat(f); }
  / _ i:int _ { return parseInt(i); }

identifier = _ id:$([a-zA-Z] [a-zA-Z0-9]*) _ { return id; }

/** TOKENS */

float =
  $([+-]? [0-9] mantissa [eE] int)
  / $(i:int? m:mantissa)

int = $([+-]? uint)

uint = $[0-9]+

mantissa = $('.' uint)

arith_op =
  _ op:$('+' / '-' / '*' / '/' / '**' / '^') _ { return op; }

lparen = _ '(' _

rparen = _ ')' _

comma = _ ',' _

pipe_sep = _ $('->' / __ / '=>') _

_ = [ \t\n\r]*
__ = $[ \t\n\r]+
