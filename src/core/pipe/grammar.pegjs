{
  function substitute(name) {
    const substitutions = options.substitutions;
    return substitutions && substitutions[name];
  }
}

/** RULES */

pipe = n:uint pipe_sep chain:chain {
  return {n: parseInt(n), chain};
}

chain =
  head:fun pipe_sep tail:chain { return [head, ...tail]; }
  / f:fun { return [f]; }

fun =
  fn:identifier lparen args:fun_args rparen { return {fn, args} }

fun_args =
  head:fun_arg fn_arg_sep tail:fun_args { return [head, ...tail]; }
  / a:fun_arg { return [a]; }

fun_arg = id / arith

arith =
  s:scalar op:arith_op a:arith { return {op, operands: [s, a]}; }
  / scalar
  / lparen a:arith rparen { return a; }

scalar =
  value:number { return {value}; }
  / id

id = id:identifier {
    const sub = substitute(id);
    if (sub) return {id, sub};
    return {id};
  }

/** TOKENS */

number =
  f:float { return parseFloat(f); }
  / i:int { return parseInt(i); }

identifier = $([a-zA-Z] [a-zA-Z0-9]*)

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

fn_arg_sep = _ ',' _

pipe_sep = _ $('->' / __ / '=>') _

_ = [ \t\n\r]*
__ = $[ \t\n\r]+
