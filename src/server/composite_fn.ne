@builtin "whitespace.ne" # `_` means arbitrary amount of whitespace
@builtin "number.ne"     # `int`, `decimal`, and `percentage` number primitives

main -> int mappings {% ([domain, mappings]) => ({domain, mappings}) %}

mappings -> 
    mapping {% ([mapping]) => [mapping] %}
    | mapping mappings {% ([mapping, mappings]) => [mapping, ...mappings] %}

mapping -> sep expr {% ([_, expr]) => expr %}

sep -> "->" {% id %}

expr ->
    sphere {% id %}
    | spiral {% id %}
    | torus {% id %}
    | fucked_up_torus {% id %}

sphere -> "sphere" of {% ([fn, args]) => ({fn, r: args[0]}) %}

spiral -> "spiral" of {% ([fn, args]) => ({fn, a: args[0], k: args[1]}) %}

torus -> "torus" of {% ([fn, args]) => ({fn, r: args[0], t: args[1]}) %}

fucked_up_torus -> "fucked_up_torus" of {% ([fn, args]) => ({fn, r: args[0], t: args[1]}) %}

of -> "(" args ")" {% ([_, args]) => args %}

args ->
    arg {% ([arg]) => [arg] %}
    | arg arg_sep args {% ([arg, _, args]) => [arg, ...args] %}

arg ->
    int {% id %}
    | decimal {% id %}

arg_sep -> _ "," _ {% () => "," %}