@builtin "whitespace.ne" # `_` means arbitrary amount of whitespace
@builtin "number.ne"     # `int`, `decimal`, and `percentage` number primitives
@builtin "string.ne"

main ->
    int mappings {% ([domain, mappings]) => ({domain, mappings}) %}
    | fn mappings {%
        ([fn, mappings]) => {
            return {mappings: [fn, ...mappings]};
        }
    %}
    | fn {% ([fn]) => ({mappings: [fn]}) %}

mappings -> 
    mapping {% ([mapping]) => [mapping] %}
    | mapping mappings {% ([mapping, mappings]) => [mapping, ...mappings] %}

mapping -> sep fn {% ([_, fn]) => fn %}

sep -> "->" {% id %}

fn ->
    sphere {% id %}
    | spiral {% id %}
    | torus {% id %}
    | fucked_up_torus {% id %}
    | rotation {% id %}
    | stereo {% id %}

sphere -> "sphere" of {% ([fn, args]) => ({fn, r: args[0]}) %}

spiral -> "spiral" of {% ([fn, args]) => ({fn, a: args[0], k: args[1]}) %}

torus -> "torus" of {% ([fn, args]) => ({fn, r: args[0], t: args[1]}) %}

fucked_up_torus -> "fucked_up_torus" of {% ([fn, args]) => ({fn, r: args[0], t: args[1]}) %}

rotation -> "R" of {%
    ([fn, args]) => {
        if (args.length < 2) {
            throw new Error(`rotation requires at least 2 args, but received only ${args.length}`);            
        }
        const [phiSpec, d0, d1] = args;

        return {fn, phiSpec, d0, d1};
    }
%}

stereo -> "stereo" of {%
    ([fn, args]) => {
        const [to] = args;
        return {fn, to};
    }
%}

of -> "(" args ")" {% ([_, args]) => args %}

args ->
    arg {% ([arg]) => [arg] %}
    | arg arg_sep args {% ([arg, _, args]) => [arg, ...args] %}

arg ->
    int {% id %}
    | decimal {% id %}
    | dqstring {% id %}
    | expr {% id %}

expr ->
    term {% id %}
    | term plus term {% ([a, _, b]) => `${a} + ${b}` %}
    | term minus term {% ([a, _, b]) => `${a} - ${b}` %}
    | term times term {% ([a, _, b]) => `${a} * ${b}` %}
    | term divided_by term {% ([a, _, b]) => `${a} / ${b}` %}
    | term to_the term {%([a, _, b]) => `${a}^${b}` %}
    | "(" expr ")" {% ([_, expr]) => expr %}


term ->
    decimal {% id %}
    | identifier

identifier -> [a-zA-Z_0-9]:+ {% ([letters]) => letters.join('') %}

plus -> _ "+" _
minus -> _ "-" _
times -> _ "*" _
divided_by -> _ "/" _
to_the -> _ "**" _ | _ "^" _

arg_sep -> _ "," _ {% () => "," %}

range_sep -> _ "..." _ {% () => "..." %}