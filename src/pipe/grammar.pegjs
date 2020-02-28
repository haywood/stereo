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

pipe = _ n:pint connector d0:pint connector steps:steps _ {
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
  / rotate
  / stereo
  / quaternion

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

quaternion 'q' =
  'q'i args:fn_args {
    return step('q', args, 4)
  }

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
  / a:number b:id { return arith('*', a, b); }
  / a:number lparen b:scalar rparen { return arith('*', a, b); }
  / exponential

exponential =
  a:term _ op:('**' / '^') _ b:exponential {
    return arith(op, a, b);
  }
  / term

term 'term' =
  op:'-' a:term { return arith(op, a); }
  / number
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
  _ f:float _ { return {kind: 'number', value: parseFloat(f)}; }
  / _ i:int _ { return {kind: 'number', value: parseInt(i)}; }

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
