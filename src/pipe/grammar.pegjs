{
  function step(type, args, min, max = min) {
    if (args.length < min) {
      error(`expected ${type} to have at least ${min} argument${min == 1 ? '' : 's'}, but found ${args.length} instead`);
    } else if (args.length > max) {
      error(`expected ${type} to have at most ${max} argument${max == 1 ? '' : 's'}, but found ${args.length} instead`);
    }
    return {kind: 'step', type, args}
  }

  function arith(op, ...operands) {
    return {kind: 'arith', op, operands};
  }
}

/** RULES */

pipe = _ n:scalar connector d0:pint connector steps:steps _ {
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
  / lattice
  / sphere
  / spiral
  / torus
  / fucked_up_torus
  / rotate
  / stereo

cube 'cube' = type:$'cube'i args:fn_args {
  return step(type, args, 1);
}

lattice 'lattice' = type:$'lattice'i args:fn_args {
  return step(type, args, 1);
}

sphere 'sphere' = type:$'sphere'i args:fn_args {
  return step(type, args, 1);
}

spiral 'spiral' = type:$'spiral'i args:fn_args {
  return step(type, args, 1, Infinity);
}

torus 'torus' = type:$'torus'i args:fn_args {
  return step(type, args, 0, Infinity);
}

fucked_up_torus 'fucked_up_torus' = type:$'fucked_up_torus'i args:fn_args {
  return step(type, args, 2);
}

rotate 'rotate' =
  'r'i args:fn_args  {
    return step('rotate', args, 3, 5);
  }
  / 'rotate'i args:fn_args {
    return step('rotate', args, 3, 5);
  }

stereo 'stereo' = type:$'stereo'i args:fn_args {
  return step(type, args, 1);
}

step_args =
  head:scalar comma tail:step_args { return [head, ...tail]; }
  / arg:scalar { return [arg]; }

scalar 'scalar' = additive

additive =
  a:multiplicative _ op:('+' / '-') _ b:additive {
    return arith(op, a, b);
  }
  / multiplicative

multiplicative =
  a:exponential _ op:('*' / '/') _ b:multiplicative {
    return arith(op, a, b);
  }
  / exponential

exponential =
  a:term _ op:('**' / '^') _ b:exponential {
    return arith(op, a, b);
  }
  / term

term 'term' =
  op:'-' a:term { return arith(op, a); }
  / value:number { return {kind: 'number', value}; }
  / name:identifier args:fn_args {
    return {kind: 'fn', name: name.toLowerCase(), args};
  }
  / id:identifier lbrack index:scalar rbrack { return {kind: 'access', id, index}; }
  / id:identifier _ '.' _ index:id { return {kind: 'access', id, index}; }
  / id
  / lparen scalar:scalar rparen { return {kind: 'paren', scalar}; }

id = id:identifier { return {kind: 'id', id: id.toLowerCase()}; }

fn_args = lparen args:fn_args_list rparen { return args }

fn_args_list =
  head:scalar comma tail:fn_args_list { return [head, ...tail]; }
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
