{
  function step(type, args, min, max = min) {
    if (args.length < min) {
      error(`expected ${type} to have at least ${min} argument${min == 1 ? '' : 's'}, but found ${args.length} instead`);
    } else if (args.length > max) {
      error(`expected ${type} to have at most ${max} argument${max == 1 ? '' : 's'}, but found ${args.length} instead`);
    }
    return {kind: 'step', type, args}
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
  / sphere
  / spiral
  / torus
  / fucked_up_torus
  / rotate
  / stereo

cube 'cube' = type:$'cube'i args:fn_args {
  return step(type, args, 1);
}

sphere 'sphere' = type:$'sphere'i args:fn_args {
  return step(type, args, 1);
}

spiral 'spiral' = type:$'spiral'i args:fn_args {
  return step(type, args, 2);
}

torus 'torus' = type:$'torus'i args:fn_args {
  return step(type, args, 2);
}

fucked_up_torus 'fucked_up_torus' = type:$'fucked_up_torus'i args:fn_args {
  return step(type, args, 2);
}

rotate 'rotate' = (('r'i) / ('rotate'i)) args:fn_args  {
  return step('rotate', args, 3, 5);
}

stereo 'stereo' = type:$'stereo'i args:fn_args {
  return step(type, args, 1);
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
  / name:identifier args:fn_args {
    return {kind: 'fn', name: name.toLowerCase(), args};
  }
  / id:identifier lbrack index:scalar rbrack { return {kind: 'access', id, index}; }
  / id
  / lparen a:scalar rparen { return {...a, parens: true}; }

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
