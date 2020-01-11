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
  / step:step { return [step]; }

step =
  cube
  / sphere
  / spiral
  / torus
  / fucked_up_torus
  / rotate
  / stereo

cube 'cube' =
  type:$'cube'i lparen length:scalar rparen {
    return {kind: 'step', type, args: [length]};
  }

sphere 'sphere' =
  type:$'sphere'i lparen r:scalar rparen {
    return {kind: 'step', type, args: [r]};
  }

spiral 'spiral' =
  type:$'spiral'i lparen a:scalar comma k:scalar rparen {
    return {kind: 'step', type, args: [a, k]};
  }

torus 'torus' =
  type:$'torus'i lparen r:scalar comma t:scalar rparen {
    return {kind: 'step', type, args: [r, t]};
  }

fucked_up_torus 'fucked_up_torus' =
  type:$'fucked_up_torus'i lparen r:scalar comma t:scalar rparen {
    return {kind: 'step', type, args: [r, t]};
  }

rotate 'rotate' =
  ('r'i / 'rotate'i)
  lparen
    theta:scalar
    comma d0:scalar
    comma d1:scalar
    f0:(comma id:id { return id})?
    f1:(comma id:id { return id})?
  rparen {
    const args = [theta, d0, d1];
    if (f0) args.push(f0);
    if (f1) args.push(f1);
    return {kind: 'step', type: 'rotate', args};
  }

stereo 'stereo' =
  type:$'stereo'i lparen to:scalar rparen {
    return {kind: 'step', type, args: [to]};
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
  / id
  / lparen a:scalar rparen { return a; }

id = id:identifier { return {kind: 'id', id: id.toLowerCase()}; }

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
