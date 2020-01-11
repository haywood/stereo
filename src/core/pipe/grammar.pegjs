/** RULES */

pipe = n:pint connector d0:pint connector steps:steps {
  return {kind: 'pipe', n, d0, steps};
}

pint 'positive integer' = x:uint {
  x = parseInt(x);
  if (x <= 0) {
    expected(`a positive integer`);
  }
  return x;
}

steps =
  head:step connector tail:steps { return [head, ...tail]; }
  / f:step { return [f]; }

step 'step' =
  type:identifier lparen args:step_args rparen {
    return {kind: 'step', type: type.toLowerCase(), args};
  }

step_args =
  head:scalar comma tail:step_args { return [head, ...tail]; }
  / arg:scalar { return [arg]; }

scalar 'scalar' =
  s:term op:operator a:scalar {
     return {kind: 'arith', op, operands: [s, a]};
  }
  / term

term 'term' =
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

number 'number' =
  _ f:float _ { return parseFloat(f); }
  / _ i:int _ { return parseInt(i); }

identifier 'identifier' = _ id:$([a-zA-Z] [a-zA-Z0-9]*) _ { return id; }

/** TOKENS */

float 'float' =
  $([+-]? [0-9] mantissa [eE] int)
  / $(i:int? m:mantissa)

int 'integer' = $([+-]? uint)

uint 'unsigned integer' = $[0-9]+

mantissa = $('.' uint)

operator 'arithmetic operator' =
  _ op:$('+' / '-' / '*' / '/' / '**' / '^') _ { return op; }

lparen 'lparen' = _ '(' _

rparen 'rparen' = _ ')' _

lbrack 'lbrack' = _ '[' _

rbrack 'rbrack' = _ ']' _

comma 'comma' = _ ',' _

connector 'connector' = _ $('->' / __ / '=>') _

_ 'whitespace' = [ \t\n\r]*
__ 'whitespace' = $[ \t\n\r]+
