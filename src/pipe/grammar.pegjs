{
  const ast = options.ast;
  const variables = options.variables;

  function step(type, args, min, max = min) {
    if (args.length < min) {
      error(`expected ${type} to have at least ${min} argument${min == 1 ? '' : 's'}, but found ${args.length} instead`);
    } else if (args.length > max) {
      error(`expected ${type} to have at most ${max} argument${max == 1 ? '' : 's'}, but found ${args.length} instead`);
    }

    return ast.step(type, args);
  }
}

/** RULES */

pipe = _ (assignments _)? steps:steps _ {
  return ast.pipe(variables, steps);
}

assignments 'assignments' = assignment __ assignments / assignment

assignment 'assignment' =
  'n'i eq n:pint { variables.n = ast.number(n); }
  / 'd0'i eq d0:pint { variables.d0 = ast.number(d0); }
  / id:identifier eq s:scalar { variables[id.toLowerCase()] = s; }

eq = _ '=' _

pint 'positive integer' = x:uint {
  x = parseInt(x);
  if (x <= 0) {
    expected(`a positive integer`);
  }
  return x;
}

steps =
  _ head:step _ tail:steps _ { return [head, ...tail]; }
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
    return step('quaternion', args, 4)
  }

scalar 'scalar' = additive

additive =
  a:multiplicative _ op:('+' / '-') _ b:additive {
    return ast.arith(op, a, b);
  }
  / multiplicative

multiplicative =
  a:exponential _ op:('*' / '/') _ b:multiplicative {
    return ast.arith(op, a, b);
  }
  / a:number b:id { return ast.arith('*', a, b); }
  / a:number lparen b:scalar rparen { return ast.arith('*', a, b); }
  / exponential

exponential =
  a:term _ op:('**' / '^') _ b:exponential {
    return arith(op, a, b);
  }
  / term

term 'term' =
  op:'-' a:term { return ast.arith(op, a); }
  / number
  / name:identifier args:fn_args { return ast.fn(name, args); }
  / id:identifier lbrack index:scalar rbrack { return ast.access(id, index); }
  / id:identifier _ '.' _ index:id { return ast.access(id, index); }
  / id
  / lparen scalar:scalar rparen { return ast.paren(scalar); }

id = id:identifier { return ast.id(id.toLowerCase()); }

fn_args = _ lparen args:fn_args_list rparen { return args }

fn_args_list =
  head:scalar comma tail:fn_args_list { return [head, ...tail]; }
  / arg:scalar { return [arg]; }

/** TERMINALS */

number 'number' =
  f:float { return ast.number(parseFloat(f)); }
  / i:int { return ast.number(parseInt(i)); }

identifier 'identifier' = id:$([a-zA-Z] [a-zA-Z0-9]*) { return id; }

/** TOKENS */

float 'float' =
  $([+-]? [0-9] mantissa [eE] int)
  / $(i:int? m:mantissa)

int 'integer' = $([+-]? uint)

uint 'unsigned integer' = $[0-9]+

mantissa = $('.' uint)

operator 'arithmetic operator' =
  _ op:$('+' / '-' / '*' / '/' / '**' / '^') _ { return op; }

lparen 'lparen' = '(' _

rparen 'rparen' = _ ')'

lbrack 'lbrack' = _ '[' _

rbrack 'rbrack' = _ ']' _

comma 'comma' = _ ',' _

_ 'optional whitespace' = [ \t\n\r]*
__ 'required whitespace' = $[ \t\n\r]+
