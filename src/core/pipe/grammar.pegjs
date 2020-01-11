/** RULES */

pipe = n:uint connector steps:steps {
  return {kind: 'pipe', n: parseInt(n), steps};
}

steps =
  head:step connector tail:steps { return [head, ...tail]; }
  / f:step { return [f]; }

step =
  type:identifier lparen args:step_args rparen {
    return {kind: 'step', type: type.toLowerCase(), args};
  }

step_args =
  head:scalar comma tail:step_args { return [head, ...tail]; }
  / arg:scalar { return [arg]; }

scalar =
  s:term op:operator a:scalar {
     return {kind: 'arith', op, operands: [s, a]};
  }
  / term

term =
  value:number { return {kind: 'number', value}; }
  / name:identifier lparen args:fn_args rparen {
    return {kind: 'fn', name: name.toLowerCase(), args};
  }
  / id:identifier lbrack index:scalar rbrack { return {kind: 'access', id, index}; }
  / id:identifier { return {kind: 'id', id: id.toLowerCase()}; }
  / lparen a:scalar rparen { return a; }

fn_args =
  head:scalar comma tail:fn_args { return [head, ...tail]; }
  / arg:scalar { return [arg]; }

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

operator =
  _ op:$('+' / '-' / '*' / '/' / '**' / '^') _ { return op; }

lparen = _ '(' _

rparen = _ ')' _

lbrack = _ '[' _

rbrack = _ ']' _

comma = _ ',' _

connector = _ $('->' / __ / '=>') _

_ = [ \t\n\r]*
__ = $[ \t\n\r]+
