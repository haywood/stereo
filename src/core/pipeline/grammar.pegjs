pipe = chain:chain { return {chain}; }

chain =
 f:function '->' rest:chain { return [f, ...rest]; }
 / f:function { return [f]; }

function = op:identifier lparen args:function_args rparen {
    return {op, args};
}

function_args =
 arg:scalar _ comma _ rest:function_args { return [arg, ...rest]; }
 / arg:scalar { return [arg] }

arithmetic =
 add / sub / mul / div / exp / scalar
 / lparen _ x:arithmetic _ rparen { return x; }

add = a:scalar _ '+' _ b:arithmetic { return {op: '+', args: [a, b]}; }
sub = a:scalar _ '-' _ b:arithmetic { return {op: '-', args: [a, b]}; }
mul = a:scalar _ '*' _ b:arithmetic { return {op: '*', args: [a, b]}; }
div = a:scalar _ '/' _ b:arithmetic { return {op: '/', args: [a, b]}; }
exp = a:scalar _ ('**' / '^') _ b:scalar { return {op: '**', args: [a, b]}; }

scalar =
  id:identifier { return {id}; }
  / value:number { return {value}; }

number =
 f:float { return parseFloat(f); }
 / i:int { return parseInt(i); }

identifier = $ ([a-zA-Z] [a-zA-Z0-9]*)

float =
 $([+-]? [0-9] mantissa [eE] int)
 / $(i:int? m:mantissa)

int = $([+-]? uint)

uint = $[0-9]+

mantissa = $('.' uint)

lparen = '('

rparen = ')'

comma = ','

_ = $[ \t\n\r]*