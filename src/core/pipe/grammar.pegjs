{
  function substitute(name) {
    const substitutions = options.substitutions;
    return substitutions && substitutions[name];
  }
}

pipe = n:uint '->' chain:chain { return {n: parseInt(n), chain}; }

chain =
 f:function '->' rest:chain { return [f, ...rest]; }
 / f:function { return [f]; }

function = op:identifier lparen args:function_args rparen {
    return {op, args};
}

function_args =
 arithmetic:arithmetic _ comma _ rest:function_args { return [{arithmetic}, ...rest]; }
 / arithmetic:arithmetic { return [{arithmetic}] }

arithmetic =
 _ scalar: scalar _ op:arithmetic_op _ arithmetic:arithmetic _ {
   return {op, args: [{scalar}, {arithmetic}]}
 }
 / _ id:identifier _ {
    const substitution = substitute(id);
    if (substitution) return substitution;
    else return {scalar: {id}};
 }
 / scalar:scalar { return {scalar}; }
 / lparen _ x:arithmetic _ rparen { return x; }

// TODO
// - inline number where scalar appears
// - define substitutable to handle substitutions
scalar =
  id:identifier { return {id}; }
  / value:number { return {value}; }

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

arithmetic_op = $('+' / '-' / '*' / '/' / '**' / '^')

lparen = '('

rparen = ')'

comma = ','

_ = $[ \t\n\r]*
