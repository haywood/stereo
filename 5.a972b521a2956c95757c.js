(self.webpackJsonp=self.webpackJsonp||[]).push([[5],{102:function(t,e,r){"use strict";var n=r(105),i=r(5),a=r(22),o=r(18),s=r.n(o);function u(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}var c=Math.cos,l=Math.sin,f=(Math.tan,Math.tanh,Math.exp),h=t=>Array.from(new Array(t).keys());class d{constructor(t){var e=this;this.fns=t,u(this,"x",void 0),u(this,"y",void 0),u(this,"sample",(function*(t,e,r){var{fns:n,d:i}=this,[a,...o]=n;if(0==n.length)return[];for(var s of a.sample(t,e,r))this.x.set(s),o.length?d.apply(o,this.x,this.y):this.y.set(s),yield this.y.subarray(0,i)})),u(this,"fn",(function(t){var r=arguments.length>1&&void 0!==arguments[1]?arguments[1]:new Float32Array(e.d),{fns:n,domain:i,d:a}=e;return s.a.equal(t.length,i),s.a.equal(r.length,a),e.x.set(t),d.apply(n,e.x,e.y),r.set(e.y.subarray(0,a)),r})),s()(t.length,"fns cannot be empty");var r=Math.max(this.domainMax,this.dMax);this.x=new Float32Array(r),this.y=new Float32Array(r)}get first(){return this.fns[0]}get last(){return this.fns[this.fns.length-1]}get domain(){return this.first.domain}get d(){return this.last.d}get domainMax(){return this.fns.reduce((t,e)=>Math.max(e.domain,t),0)}get dMax(){return this.fns.reduce((t,e)=>Math.max(e.d,t),0)}}u(d,"apply",(t,e,r)=>{for(var n of(s.a.equal(e.length,r.length),t))n.fn(e.subarray(0,n.domain),r.subarray(0,n.d)),e.set(r)}),u(d,"Builder",class{constructor(){u(this,"fns",[]),u(this,"add",t=>{var{fns:e,last:r}=this;if(r&&t.domain!==r.d)throw new Error("Cannot add ".concat(t," to composite, because its domain is not ").concat(r.d));return e.push(t),this}),u(this,"build",()=>new d(this.fns))}get d(){return this.last.d}get last(){return this.fns[this.fns.length-1]}});var p=r(101);function v(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}class b{constructor(t,e,r){var n=this;this.d=t,this.a=e,this.b=r,v(this,"domain",void 0),v(this,"fn",(function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:new Float32Array(n.d),{a:r,b:i,d:a}=n;s.a.equal(t.length,a),s.a.equal(e.length,a);for(var o=0;o<a;o++)e[o]=r[o]+t[o]*(i[o]-r[o]);return e})),v(this,"sample",(function*(t,e,r){var{d:n,fn:i}=this;t=b.nPerLevel(n,t);for(var a=[[]],o=0;a.length&&o<r;){var s=a.pop();s.length<n?a.push(...u(s)):o++>=e&&(yield i(s))}function*u(e){for(var r=0;r<t;r++)yield[...e,r/t]}})),s.a.equal(e.length,t),s.a.equal(r.length,t),this.domain=t}}function g(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}v(b,"nPerLevel",(t,e)=>Object(p.kc)(Object(p.vd)(e,t))),v(b,"n",(t,e)=>b.nPerLevel(t,e)**t);class m{constructor(t,e){this.d=t,this.l=e,g(this,"interval",void 0),g(this,"fn",(t,e)=>this.interval.fn(t,e)),g(this,"sample",(t,e,r)=>this.interval.sample(t,e,r)),this.interval=new b(t,new Array(t).fill(-e/2),new Array(t).fill(e/2))}get domain(){return this.d}}function y(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}class w{constructor(t,e,r,n){var i=this,a=arguments.length>4&&void 0!==arguments[4]?arguments[4]:c,o=arguments.length>5&&void 0!==arguments[5]?arguments[5]:l;this.d=t,this.theta=e,this.d0=r,this.d1=n,this.f0=a,this.f1=o,y(this,"r0",void 0),y(this,"r1",void 0),y(this,"sample",(function*(t,e,r){var n=new m(this.domain,2);for(var i of n.sample(t,e,r))yield this.fn(i)})),y(this,"fn",(function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:new Float32Array(i.d),{d:r,d0:n,d1:a,r0:o,r1:u}=i;s.a.equal(t.length,r),s.a.equal(e.length,r),e.set(t);var c=t[n],l=t[a];return e[n]=c*o-l*u,e[a]=c*u+l*o,e})),this.r0=a(e),this.r1=o(e)}get domain(){return this.d}}function O(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}class A{constructor(t,e){var r=this;this.d=t,O(this,"root",void 0),O(this,"sample",(function*(t,e,r){var n=new m(this.domain,p.Se);for(var i of n.sample(t,e,r))yield this.fn(i)})),O(this,"fn",(function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:new Float32Array(r.d),{d:n,root:i}=r;s.a.equal(t.length,n-1),s.a.equal(e.length,n);var a=new d(h(n-1).map(e=>new w(n,t[e],0,e+1)));return a.fn(i,e),e})),this.root=new Float32Array(t),this.root[0]=e}get domain(){return this.d-1}}function j(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}class x{constructor(t,e,r){var n=this;this.d=t,this.a=e,this.k=r,j(this,"sphere",void 0),j(this,"sample",(function*(t,e,r){var n=new m(this.domain,2*p.Se);for(var i of n.sample(t,e,r))yield this.fn(i)})),j(this,"fn",(function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:new Float32Array(n.d),{a:r,k:i,domain:a,d:o}=n;s.a.equal(t.length,o-1),s.a.equal(e.length,o),n.sphere.fn(t,e);for(var u=0,c=0;c<a;c++)u+=i[c]*t[c];for(var l=f(u),h=0;h<o;h++)e[h]=e[h]*r[h]*l;return e})),this.sphere=new A(t,1)}get domain(){return this.d-1}}function P(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}class F{constructor(t,e,r){var n=this;this.d=t,this.r=e,this.t=r,P(this,"cross",void 0),P(this,"sample",(function*(t,e,r){var n=new m(this.domain,p.Se);for(var i of n.sample(t,e,r))yield this.fn(i)})),P(this,"fn",(function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:new Float32Array(n.d),{cross:r,d:i,r:a}=n;s.a.equal(t.length,i-1,"torus expects an input of ".concat(i-1,"; got ").concat(t.length));var o=new w(i,t[i-2],0,i-1);return r.fn(t.subarray(0,i-2),e.subarray(0,i-1)),e[0]+=a,o.fn(e,e),e})),s()(t>2,"torus is only defined for d > 2; got ".concat(t)),this.cross=new A(t-1,r)}get domain(){return this.d-1}}function N(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}class q{constructor(t,e,r){var n=this;this.d=t,this.r=e,this.t=r,N(this,"sphere",void 0),N(this,"circle",void 0),N(this,"sample",(function*(t,e,r){var n=new m(this.domain,p.Se);for(var i of n.sample(t,e,r))yield this.fn(i)})),N(this,"fn",(function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:new Float32Array(n.d),{domain:r,d:i,sphere:a,circle:o}=n;s.a.equal(t.length,r),s.a.equal(e.length,i),a.fn(t,e);var u=o.fn(t.subarray(i-2));return e[0]+=u[0],e[i-1]+=u[1],e})),this.sphere=new A(t,r),this.circle=new A(2,e)}get domain(){return this.d-1}}function M(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}class C{constructor(t,e){var r=this;this.from=t,this.to=e,M(this,"fromTemp",void 0),M(this,"toTemp",void 0),M(this,"sample",(function*(t,e,r){var n=new m(this.domain,2);for(var i of n.sample(t,e,r))yield this.fn(i)})),M(this,"fn",(function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:new Float32Array(r.to),{from:n,to:i,fromTemp:a,toTemp:o}=r;if(s.a.equal(t.length,n),s.a.equal(e.length,i),n===i)return e.set(t),e;for(a.set(t);n<i;)C.up(a.subarray(0,n),o.subarray(0,++n)),a.set(o);for(;n>i;)C.down(a.subarray(0,n),o.subarray(0,--n)),a.set(o);return e.set(o.subarray(0,i)),e})),this.fromTemp=new Float32Array(Math.max(t,e)),this.toTemp=new Float32Array(Math.max(t,e))}get domain(){return this.from}get d(){return this.to}}M(C,"up",(t,e)=>{s.a.equal(e.length,t.length+1);var r=L(t),n=r+1;e[0]=(r-1)/n;for(var i=1;i<=t.length;i++)e[i]=2*t[i-1]/n}),M(C,"down",(t,e)=>{s.a.equal(e.length,t.length-1);for(var r=0;r<e.length;r++)e[r]=t[r+1]/(1-t[0])});var L=t=>{for(var e=0,r=0;r<t.length;r++)e+=t[r]*t[r];return e};function S(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}class k{constructor(t){var e=this;this.d=t,S(this,"domain",void 0),S(this,"fn",(function(t){var r=arguments.length>1&&void 0!==arguments[1]?arguments[1]:new Float32Array(e.d),{d:n}=e;return s.a.equal(t.length,n),s.a.equal(r.length,n),r.set(t),r})),S(this,"sample",(function*(t,e,r){throw new Error("identity function does not support sampling")})),this.domain=t}}function E(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}class D{constructor(t){this.scope=t,E(this,"resolve",t=>this.resolvePipeNode(t)),E(this,"resolvePipeNode",t=>{var e=T("chain",t),r=[],n=e.shift(),i=n.args.shift().value,a=this.resolveFirstFunNode(i,n),o=b.n(a.fn.domain,z("n",t));r.push(a);for(var s=0;s<e.length;s++){var u=e[s],c=this.resolveFunNode(r[s].fn,u);r.push(c)}var[l,f]=this.buildComposites(r);return{n:o,init:l,iter:f}}),E(this,"buildComposites",t=>{for(var e=new d.Builder;t.length&&!t[0].isTemporal;)e.add(t.shift().fn);var r=e.build();for(e=(new d.Builder).add(new k(r.d));t.length;)e.add(t.shift().fn);return[r,e.build()]}),E(this,"resolveFirstFunNode",(t,e)=>{var r=T("fn",e),n=T("args",e);return{fn:H[r](t,...n.map(this.resolveFunArgNode)),isTemporal:n.some(_)}}),E(this,"resolveFunNode",(t,e)=>{var r=T("fn",e),n=T("args",e),i=W[r](t.d);return{fn:H[r](i,...n.map(this.resolveFunArgNode)),isTemporal:n.some(_)}}),E(this,"resolveFunArgNode",t=>t.id?this.resolveVarNode(t):this.resolveArithNode(t)),E(this,"resolveArithNode",t=>{if(null!=t.op){var e=V[t.op],[r,n]=T("operands",t).map(this.resolveArithNode);return e(r,n)}return this.resolveNumberNode(t)}),E(this,"resolveVarNode",t=>{var{value:e}=t;return"function"==typeof e?e:this.resolveNumberNode(t)}),E(this,"resolveNumberNode",t=>{var{value:e}=t;if("number"==typeof e)return e;s.a.fail("don't know how to handle number node ".concat(Object(a.a)(t)))})}}var T=(t,e)=>{var r=e[t];return R(null!=r,t,"to be defined",e),r},z=(t,e)=>{var r=e[t];return R("number"==typeof r,t,"a number",e),r},R=(t,e,r,n)=>{s()(t,"Expected ".concat(e," to be ").concat(r," in ").concat(Object(a.a)(n)))},_=t=>"t"===t.id||(t.args?t.args.some(_):!!t.operands&&t.operands.some(_)),V={"+":(t,e)=>t+e,"-":(t,e)=>t-e,"*":(t,e)=>t*e,"/":(t,e)=>t/e,"**":(t,e)=>t**e,"^":(t,e)=>t**e},B=function(t,e,r,n){var i=arguments.length>4&&void 0!==arguments[4]?arguments[4]:Math.cos,a=arguments.length>5&&void 0!==arguments[5]?arguments[5]:Math.sin;return new w(t,e,r,n,i,a)},H={cube:(t,e)=>new m(t,e),sphere:(t,e)=>new A(t,e),spiral:(t,e,r)=>new x(t,new Array(t).fill(e),new Array(t-1).fill(r)),torus:(t,e,r)=>new F(t,e,r),fucked_up_torus:(t,e,r)=>new q(t,e,r),rotate:B,R:B,stereo:(t,e)=>new C(t,e)},W={cube:t=>t,sphere:t=>t+1,spiral:t=>t+1,torus:t=>t+1,fucked_up_torus:t=>t+1,rotate:t=>t,R:t=>t,stereo:t=>t};function I(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}class J{constructor(t,e){this.scope=t,this.substitutions=e,I(this,"simplify",t=>this.simplifyPipeNode(t)),I(this,"simplifyPipeNode",t=>{return{n:Z("n",t),chain:U("chain",t).map(this.simplifyFunNode)}}),I(this,"simplifyFunNode",t=>{return{fn:U("fn",t),args:U("args",t).map(this.simplifyFunArgNode)}}),I(this,"simplifyFunArgNode",t=>t.id?this.simplifyVarNode(t):this.simplifyArithNode(t)),I(this,"simplifyArithNode",t=>{if(null!=t.op){var e=U("operands",t);return{op:t.op,operands:e.map(this.simplifyArithNode)}}return this.simplifyNumberNode(t)}),I(this,"simplifyVarNode",t=>{var e=t.id;return e in this.substitutions?this.simplifyArithNode(this.substitutions[e]):e in Math&&"function"==typeof Math[e]?{id:e,value:Math[e]}:{id:e,value:n.b(e,this.scope)}}),I(this,"simplifyNumberNode",t=>{var{id:e,value:r}=t;if(null!=r)return t;if(e in this.substitutions)return this.simplifyArithNode(this.substitutions[e]);if(e){var i=n.b(e,this.scope);return s.a.equal(typeof i,"number","Expected evaluation of ".concat(Object(a.a)(e)," to produce a number")),{id:e,value:i}}return t})}}var U=(t,e)=>{var r=e[t];return Q(null!=r,t,"to be defined",e),r},Z=(t,e)=>{var r=e[t];return Q("number"==typeof r,t,"a number",e),r},Q=(t,e,r,n)=>{s()(t,"Expected ".concat(e," to be ").concat(r," in ").concat(Object(a.a)(n)))},G=r(96);function K(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}var X=Object(i.getLogger)("Parser");X.setDefaultLevel("info");var Y=(t,e)=>{try{var r=Object(G.parse)(t,e);return X.debug("parsed ".concat(t," into node ").concat(Object(a.a)(r))),r}catch(e){throw X.error("error parsing ".concat(t," at ").concat(Object(a.a)(e.location),": ").concat(e.message)),e}};class ${}K($,"parsePipe",t=>Y(t)),K($,"parseArith",t=>Y(t,{startRule:"arith"}));var tt=Object(i.getLogger)("Compiler");tt.setDefaultLevel("info");class et{constructor(t){var e,r,n;this.scope=t,n=t=>{var e=$.parsePipe(t.pipe);tt.debug("parsed params into ast ".concat(Object(a.a)(e)));var r={theta:$.parseArith(t.theta)},n=new J(this.scope,r);return new D(this.scope).resolve(n.simplify(e))},(r="compile")in(e=this)?Object.defineProperty(e,r,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[r]=n}}var rt=r(35),nt=r(42);function it(t,e){var r=Object.keys(t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(t);e&&(n=n.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),r.push.apply(r,n)}return r}function at(t){for(var e=1;e<arguments.length;e++){var r=null!=arguments[e]?arguments[e]:{};e%2?it(Object(r),!0).forEach((function(e){ot(t,e,r[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(r)):it(Object(r)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(r,e))}))}return t}function ot(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}var st=Object(i.getLogger)("Evaluator");class ut{constructor(t,e,r,n){this.scope=t,this.hl=r,ot(this,"n",void 0),ot(this,"init",void 0),ot(this,"iter",void 0),ot(this,"offset",void 0),ot(this,"limit",void 0),ot(this,"initialize",t=>{var e=new Float32Array(t),{n:r,init:n,offset:i,limit:a}=this,o=rt.a.input(e),s=i;for(var u of n.sample(r,i,a))rt.a.set(o,u,s++,n.d)}),ot(this,"iterate",t=>{var e=new Float32Array(t),{init:r,iter:n,scope:i,n:o,offset:u,limit:c}=this,l=rt.a.input(e),f=rt.a.position(e),h=Date.now();s.a.equal(e[rt.a.nOffset],o,"n(data) != n(evaluator)"),s.a.equal(e[rt.a.inputOffset],r.d,"d0(data) != d0(evaluator)"),s.a.equal(e[rt.a.positionOffset(e)],n.d,"d(data) != d(evaluator)"),st.debug("iterating using ".concat(Object(a.a)(i),", ").concat(Object(a.a)(n)));for(var d=u;d<c;d++)n.fn(rt.a.get(l,d,r.d),rt.a.get(f,d,n.d));this.computeColors(e),st.debug("iteration complete in ".concat(Date.now()-h,"ms"))}),ot(this,"computeColors",t=>{st.debug("computing colors");for(var{d:e,scope:r,hl:n,offset:i,limit:a}=this,o=rt.a.position(t),s=rt.a.color(t),u=i;u<a;u++){var c=at({},r,{p:rt.a.get(o,u,e),i:u}),l=Object(p.de)(n.h.evaluate(c),0),f=Object(p.de)(n.l.evaluate(c),0),h=new nt.c("hsl(".concat(l,", 100%, ").concat(f,"%)"));rt.a.set(s,[h.r,h.g,h.b],u,3)}});var{n:i,init:o,iter:u}=e,c=n.offset,l=n.size,f=c+l;s()(c>=0,"offset must be non-negative; got ".concat(c)),s()(f<=i,"offset + size must be <= n; got ".concat(c," + ").concat(l," = ").concat(f," > ").concat(i)),this.n=i,this.init=o,this.iter=u,this.offset=c,this.limit=f}get d(){return this.iter.d}}function ct(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}r.d(e,"a",(function(){return lt})),Object(i.getLogger)("Pipe").setLevel("info");class lt{}ct(lt,"compile",t=>lt.compileNormal(lt.normalized(t))),ct(lt,"evaluatorFor",(t,e)=>lt.evaluatorForNormal(lt.normalized(t),e)),ct(lt,"evaluatorForNormal",(t,e)=>{var r=lt.compileNormal(t),n=lt.finalScope(t,r),i=lt.compileHL(t);return new ut(n,r,i,e)}),ct(lt,"compileNormal",t=>{var{power:e,chroma:r,t:n}=t;return new et({t:n,power:e,chroma:r}).compile(t)}),ct(lt,"normalized",t=>({pipe:t.pipe,theta:t.theta||"t",h:t.h||"1",l:t.l||"0.5",t:t.t||0,power:t.power||0,chroma:t.chroma||0})),ct(lt,"finalScope",(t,e)=>{var{power:r,t:i,chroma:a}=t,o={t:i,power:r,chroma:a,n:e.n};return o.theta=n.b(t.theta,o),o}),ct(lt,"compileHL",t=>({h:n.a("360 * (".concat(t.h,")")),l:n.a("100 * (".concat(t.l,")"))}))},22:function(t,e,r){"use strict";r.d(e,"a",(function(){return n}));var n=function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:2;return JSON.stringify(t,null,e)}},32:function(t,e,r){"use strict";r.d(e,"a",(function(){return c})),r.d(e,"b",(function(){return l})),r.d(e,"c",(function(){return f}));var n=r(104);function i(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}var a,o="0"!=new URLSearchParams(window.location.search).get("p"),s=(a=window.location.hash.substr(1),new URLSearchParams(a?atob(a):""));class u{constructor(t,e,r){this.id=t,this._value=e,this.persistent=r,i(this,"subject",void 0),i(this,"initFromOrWriteToHash",()=>{this.persistent&&s.has(this.id)?this._value=this.parse(s.get(this.id)):this.persistent&&this.updateHash()}),i(this,"newSubject",()=>new n.a({newValue:this._value})),i(this,"updateHash",()=>{var t=this.stringify(this.value);s.set(this.id,t),document.location.hash=btoa(s.toString())}),o?this.initFromOrWriteToHash():this.persistent=!1,this.subject=this.newSubject()}get stream(){return this.subject.asObservable()}get value(){return this._value}set value(t){var e=this.value;if(this._value=t,this.subject.next({newValue:t,oldValue:e,event:window.event}),this.persistent){var r=this.stringify(t);localStorage.setItem("inputs.".concat(this.id),r),this.updateHash()}}}class c extends u{constructor(t,e){super(t,e,!(arguments.length>2&&void 0!==arguments[2])||arguments[2]),this.id=t,i(this,"disabled",!1)}parse(t){return t}stringify(t){return t}}class l extends u{constructor(t,e,r,n){var i=arguments.length>4&&void 0!==arguments[4]&&arguments[4];super(t,e,!(arguments.length>5&&void 0!==arguments[5])||arguments[5]),this.id=t,this.on=r,this.off=n,this.disabled=i}parse(t){if(/1|true/i.test(t))return!0;if(/0|false/i.test(t))return!1;throw new Error("invalid boolean value for input ".concat(this.id,": ").concat(t))}stringify(t){return t?"1":"0"}}var f={pipe:new c("pipe","10000->sphere(4, 1)->R(theta, 0, 1, cos, tan)->R(theta, 0, 2)->R(theta, 0, 3)->stereo(3)"),theta:new c("theta","pi * (t + power) / 20"),h:new c("h","chroma * i / n"),l:new c("l","power"),animate:new l("animate",!0,"play","pause",!1,!0),mic:new l("mic",!1,"mic","mic_off",!1,!1),fullscreen:new l("fullscreen",!1,"enter_fullscreen","exit_fullscreen",!document.fullscreenEnabled,!1)};window.inputs=f},35:function(t,e,r){"use strict";r.d(e,"a",(function(){return o}));var n=r(18),i=r.n(n);function a(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}class o{constructor(t,e,r,n){this.n=t,this.d=e,this.position=r,this.color=n}}a(o,"fromBuffer",t=>{var e=new Float32Array(t),r=e[o.nOffset],n=e[o.positionOffset(e)],i=o.position(e),a=o.color(e);return new o(r,n,i,a)}),a(o,"bufferFor",(t,e,r)=>{var n=new SharedArrayBuffer(4*(3+t*(e+r+3))),i=new Float32Array(n);return i[o.nOffset]=t,i[o.inputOffset]=e,i[o.positionOffset(i)]=r,n}),a(o,"input",t=>{var e=o.inputOffset+1;return t.subarray(e,e+o.inputLength(t))}),a(o,"position",t=>{var e=o.positionOffset(t)+1;return t.subarray(e,e+o.positionLength(t))}),a(o,"color",t=>{var e=o.colorOffset(t);return t.subarray(e)}),a(o,"nOffset",0),a(o,"inputOffset",o.nOffset+1),a(o,"inputLength",t=>{return t[o.nOffset]*t[o.inputOffset]}),a(o,"positionOffset",t=>o.inputOffset+o.inputLength(t)+1),a(o,"positionLength",t=>{return t[o.nOffset]*t[o.positionOffset(t)]}),a(o,"colorOffset",t=>o.positionOffset(t)+o.positionLength(t)+1),a(o,"get",(t,e,r)=>{var n=e*r;return t.subarray(n,n+r)}),a(o,"set",(t,e,r,n)=>{i()(e.length<=n);var a=r*n;return t.set(e,a)})},59:function(t,e,r){"use strict";(function(t){r.d(e,"b",(function(){return p})),r.d(e,"a",(function(){return w}));var n=r(61),i=r(5),a=r(102),o=r(101),s=r(35);function u(t,e,r,n,i,a,o){try{var s=t[a](o),u=s.value}catch(t){return void r(t)}s.done?e(u):Promise.resolve(u).then(n,i)}function c(t){return function(){var e=this,r=arguments;return new Promise((function(n,i){var a=t.apply(e,r);function o(t){u(a,n,i,o,s,"next",t)}function s(t){u(a,n,i,o,s,"throw",t)}o(void 0)}))}}var l,f,h=Object(i.getLogger)("PipelinePool");h.setLevel("info");var d=0,p=function(){var e=c((function*(e){h.info("starting worker pool"),l=Object(n.Pool)(()=>Object(n.spawn)(new n.Worker(t)),e),d=e,f=new Map;for(var r=[],i=0;i<e;i++)r.push(l.queue(c((function*(){}))));yield Promise.all(r)}));return function(t){return e.apply(this,arguments)}}(),v=(t,e,r)=>y("initialization")(c((function*(){return m(e,function(){var e=c((function*(e){return l.queue(n=>n.initialize(t,e,r))}));return function(t){return e.apply(this,arguments)}}())}))),b=(t,e,r)=>y("iteration")(c((function*(){return m(e,function(){var e=c((function*(e){return l.queue(n=>n.iterate(t,e,r))}));return function(t){return e.apply(this,arguments)}}())}))),g=function(){var t=c((function*(t,e,r,n){var i=(t=>JSON.stringify({pipe:t.pipe,theta:t.theta,h:t.h,l:t.l}))(t);if(!f.has(i)){var a=s.a.bufferFor(e,r,n);yield v(t,e,a),f.set(i,a)}return f.get(i)}));return function(e,r,n,i){return t.apply(this,arguments)}}(),m=function(){var t=c((function*(t,e){for(var r=Object(o.fb)(t/d),n=[],i=0;i<t;i+=r){var a={offset:i,size:Math.min(t-i,r)};n.push(e(a))}yield Promise.all(n)}));return function(e,r){return t.apply(this,arguments)}}(),y=t=>(function(){var e=c((function*(e){var r=Date.now(),n=yield e(),i=Date.now()-r;return h.debug("".concat(t," took ").concat(i,"ms")),n}));return function(t){return e.apply(this,arguments)}})(),w=function(){var t=c((function*(t){var{n:e,init:r,iter:n}=a.a.compile(t),i=yield g(t,e,r.d,n.d);return yield b(t,e,i),i.slice(0)}));return function(e){return t.apply(this,arguments)}}()}).call(this,r(60))},60:function(t,e,r){t.exports=r.p+"0.a74f84a348d6fdb45bda.worker.js"},8:function(t,e,r){"use strict";r.r(e);var n=r(103),i=r(35),a=r(59),o=r(104),s=r(5),u=r(32),c={power:.5,chroma:.5},l=96,f=r(101);function h(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}class d{constructor(){h(this,"process",t=>t.map((t,e)=>this.processFrame(t.length?Array.from(t):[0]))),h(this,"processFrame",t=>{var e=f.y(t),r=f.Tc(e),n=f.Oe(r,1),i=f.td(n);return f.Fe(t.length)/i})}}h(d,"ocatave",t=>f.kc(t/12)),h(d,"chroma",t=>t%12),h(d,"f",t=>{var e=d.ocatave(t),r=d.chroma(t);return 16.35*2**e*f.vd(2,12)**r});var p=r(97),v=r.n(p),b=r(22);function g(t,e,r,n,i,a,o){try{var s=t[a](o),u=s.value}catch(t){return void r(t)}s.done?e(u):Promise.resolve(u).then(n,i)}var m=function(){var t,e=(t=function*(t){t instanceof Error?s.error(t):s.error(Object(b.a)(t))},function(){var e=this,r=arguments;return new Promise((function(n,i){var a=t.apply(e,r);function o(t){g(a,n,i,o,s,"next",t)}function s(t){g(a,n,i,o,s,"throw",t)}o(void 0)}))});return function(t){return e.apply(this,arguments)}}();function y(t,e,r,n,i,a,o){try{var s=t[a](o),u=s.value}catch(t){return void r(t)}s.done?e(u):Promise.resolve(u).then(n,i)}function w(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}class O{constructor(t,e,r){this.ctx=t,w(this,"close",()=>this.ctx.close());var n=new AudioWorkletNode(t,"power",{numberOfInputs:l,channelCountMode:"explicit",channelCount:1});n.port.onmessage=t=>r.next(t.data),n.onprocessorerror=t=>m(t),n.connect(t.destination);for(var i=0;i<l;i++){var a=d.f(i),o=new BiquadFilterNode(t,{type:"bandpass",frequency:a,Q:l/a});e.connect(o).connect(n,0,i)}}}function A(t,e,r,n,i,a,o){try{var s=t[a](o),u=s.value}catch(t){return void r(t)}s.done?e(u):Promise.resolve(u).then(n,i)}w(O,"create",function(){var t,e=(t=function*(t,e){var r=new AudioContext;yield r.audioWorklet.addModule(v.a);var n=new MediaStreamAudioSourceNode(r,{mediaStream:t});return new O(r,n,e)},function(){var e=this,r=arguments;return new Promise((function(n,i){var a=t.apply(e,r);function o(t){y(a,n,i,o,s,"next",t)}function s(t){y(a,n,i,o,s,"throw",t)}o(void 0)}))});return function(t,r){return e.apply(this,arguments)}}());var j,x=Object(s.getLogger)("Audio"),P=new o.a(c),F=P.asObservable();u.c.mic.stream.subscribe(function(){var t,e=(t=function*(t){var{newValue:e,event:r}=t;if(e){x.info("getting user media");var n=yield navigator.mediaDevices.getUserMedia({audio:!0});x.info("starting new audio graph"),j=yield O.create(n,P)}else x.info("closing audio graph"),j&&(yield j.close()),P.next(c)},function(){var e=this,r=arguments;return new Promise((function(n,i){var a=t.apply(e,r);function o(t){A(a,n,i,o,s,"next",t)}function s(t){A(a,n,i,o,s,"throw",t)}o(void 0)}))});return function(t){return e.apply(this,arguments)}}());var N,q=r(106),M=(Object(f.kc)(512),(t,e)=>{var{power:r,chroma:n}=e;return{pipe:u.c.pipe.value,theta:u.c.theta.value,h:u.c.h.value,l:u.c.l.value,t:t,power:r,chroma:n}}),C=new o.a(M(0,c)),L=0;F.subscribe(t=>N=t,m);function S(t,e,r,n,i,a,o){try{var s=t[a](o),u=s.value}catch(t){return void r(t)}s.done?e(u):Promise.resolve(u).then(n,i)}function k(t){return function(){var e=this,r=arguments;return new Promise((function(n,i){var a=t.apply(e,r);function o(t){S(a,n,i,o,s,"next",t)}function s(t){S(a,n,i,o,s,"throw",t)}o(void 0)}))}}Object(q.a)(1e3/60).subscribe(()=>{u.c.animate.value&&C.next(M(L++/60,N))},m),r.d(e,"stream",(function(){return T}));var E=Object(s.getLogger)("Data");E.setDefaultLevel("info");var D=new n.a,T=D.asObservable(),z=function(){var t=k((function*(){console.info("starting web worker data source"),yield Object(a.b)(navigator.hardwareConcurrency);return{getData:t=>Object(a.a)(t).then(i.a.fromBuffer)}}));return function(){return t.apply(this,arguments)}}();k((function*(){var t,{getData:e}=yield z(),r=0;C.subscribe(function(){var n=k((function*(n){if(!t){E.debug("requesting data with params",n),Date.now()-r>=1e3&&(E.debug("sending request for data with params ".concat(Object(b.a)(n))),r=Date.now()),t=e(n);try{D.next(yield t)}catch(t){m(t)}finally{t=null}}}));return function(t){return n.apply(this,arguments)}}(),t=>m(t))}))()},96:function(t,e,r){"use strict";function n(t,e,r,i){this.message=t,this.expected=e,this.found=r,this.location=i,this.name="SyntaxError","function"==typeof Error.captureStackTrace&&Error.captureStackTrace(this,n)}!function(t,e){function r(){this.constructor=t}r.prototype=e.prototype,t.prototype=new r}(n,Error),n.buildMessage=function(t,e){var r={literal:function(t){return'"'+i(t.text)+'"'},class:function(t){var e,r="";for(e=0;e<t.parts.length;e++)r+=t.parts[e]instanceof Array?a(t.parts[e][0])+"-"+a(t.parts[e][1]):a(t.parts[e]);return"["+(t.inverted?"^":"")+r+"]"},any:function(t){return"any character"},end:function(t){return"end of input"},other:function(t){return t.description}};function n(t){return t.charCodeAt(0).toString(16).toUpperCase()}function i(t){return t.replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/\0/g,"\\0").replace(/\t/g,"\\t").replace(/\n/g,"\\n").replace(/\r/g,"\\r").replace(/[\x00-\x0F]/g,(function(t){return"\\x0"+n(t)})).replace(/[\x10-\x1F\x7F-\x9F]/g,(function(t){return"\\x"+n(t)}))}function a(t){return t.replace(/\\/g,"\\\\").replace(/\]/g,"\\]").replace(/\^/g,"\\^").replace(/-/g,"\\-").replace(/\0/g,"\\0").replace(/\t/g,"\\t").replace(/\n/g,"\\n").replace(/\r/g,"\\r").replace(/[\x00-\x0F]/g,(function(t){return"\\x0"+n(t)})).replace(/[\x10-\x1F\x7F-\x9F]/g,(function(t){return"\\x"+n(t)}))}return"Expected "+function(t){var e,n,i,a=new Array(t.length);for(e=0;e<t.length;e++)a[e]=(i=t[e],r[i.type](i));if(a.sort(),a.length>0){for(e=1,n=1;e<a.length;e++)a[e-1]!==a[e]&&(a[n]=a[e],n++);a.length=n}switch(a.length){case 1:return a[0];case 2:return a[0]+" or "+a[1];default:return a.slice(0,-1).join(", ")+", or "+a[a.length-1]}}(t)+" but "+function(t){return t?'"'+i(t)+'"':"end of input"}(e)+" found."},t.exports={SyntaxError:n,parse:function(t,e){e=void 0!==e?e:{};var r,i={},a={pipe:dt,arith:bt},o=dt,s=function(t,e){return{n:parseInt(t),chain:e}},u=function(t,e){return[t,...e]},c=function(t){return[t]},l=function(t,e){return{fn:t,args:e}},f=function(t){return[t]},h=function(t,e,r){return{op:e,operands:[t,r]}},d=function(t){return{value:t}},p=function(t){return t},v=function(t){return{id:t}},b=function(t){return parseFloat(t)},g=function(t){return parseInt(t)},m=/^[a-zA-Z]/,y=ut([["a","z"],["A","Z"]],!1,!1),w=/^[a-zA-Z0-9]/,O=ut([["a","z"],["A","Z"],["0","9"]],!1,!1),A=function(t){return t},j=/^[+\-]/,x=ut(["+","-"],!1,!1),P=/^[0-9]/,F=ut([["0","9"]],!1,!1),N=/^[eE]/,q=ut(["e","E"],!1,!1),M=".",C=st(".",!1),L="+",S=st("+",!1),k="-",E=st("-",!1),D="*",T=st("*",!1),z="/",R=st("/",!1),_="**",V=st("**",!1),B="^",H=st("^",!1),W=function(t){return t},I="(",J=st("(",!1),U=")",Z=st(")",!1),Q=",",G=st(",",!1),K="->",X=st("->",!1),Y="=>",$=st("=>",!1),tt=/^[ \t\n\r]/,et=ut([" ","\t","\n","\r"],!1,!1),rt=0,nt=[{line:1,column:1}],it=0,at=[],ot=0;if("startRule"in e){if(!(e.startRule in a))throw new Error("Can't start parsing from rule \""+e.startRule+'".');o=a[e.startRule]}function st(t,e){return{type:"literal",text:t,ignoreCase:e}}function ut(t,e,r){return{type:"class",parts:t,inverted:e,ignoreCase:r}}function ct(e){var r,n=nt[e];if(n)return n;for(r=e-1;!nt[r];)r--;for(n={line:(n=nt[r]).line,column:n.column};r<e;)10===t.charCodeAt(r)?(n.line++,n.column=1):n.column++,r++;return nt[e]=n,n}function lt(t,e){var r=ct(t),n=ct(e);return{start:{offset:t,line:r.line,column:r.column},end:{offset:e,line:n.line,column:n.column}}}function ft(t){rt<it||(rt>it&&(it=rt,at=[]),at.push(t))}function ht(t,e,r){return new n(n.buildMessage(t,e),t,e,r)}function dt(){var t,e,r;return t=rt,(e=Ot())!==i&&Pt()!==i&&(r=function t(){var e,r,n;e=rt,(r=pt())!==i&&Pt()!==i&&(n=t())!==i?(e,r=u(r,n),e=r):(rt=e,e=i);e===i&&(e=rt,(r=pt())!==i&&(e,r=c(r)),e=r);return e}())!==i?(t,t=e=s(e,r)):(rt=t,t=i),t}function pt(){var e,r,n;return e=rt,(r=yt())!==i&&jt()!==i&&(n=function e(){var r,n,a;r=rt,(n=vt())!==i&&function(){var e,r,n,a;e=rt,(r=Ft())!==i?(44===t.charCodeAt(rt)?(n=Q,rt++):(n=i,0===ot&&ft(G)),n!==i&&(a=Ft())!==i?e=r=[r,n,a]:(rt=e,e=i)):(rt=e,e=i);return e}()!==i&&(a=e())!==i?(r,n=u(n,a),r=n):(rt=r,r=i);r===i&&(r=rt,(n=vt())!==i&&(r,n=f(n)),r=n);return r}())!==i&&xt()!==i?(e,e=r=l(r,n)):(rt=e,e=i),e}function vt(){var t;return(t=mt())===i&&(t=bt()),t}function bt(){var e,r,n,a;return e=rt,(r=gt())!==i&&(n=function(){var e,r,n,a;e=rt,(r=Ft())!==i?(n=rt,43===t.charCodeAt(rt)?(a=L,rt++):(a=i,0===ot&&ft(S)),a===i&&(45===t.charCodeAt(rt)?(a=k,rt++):(a=i,0===ot&&ft(E)),a===i&&(42===t.charCodeAt(rt)?(a=D,rt++):(a=i,0===ot&&ft(T)),a===i&&(47===t.charCodeAt(rt)?(a=z,rt++):(a=i,0===ot&&ft(R)),a===i&&(t.substr(rt,2)===_?(a=_,rt+=2):(a=i,0===ot&&ft(V)),a===i&&(94===t.charCodeAt(rt)?(a=B,rt++):(a=i,0===ot&&ft(H))))))),(n=a!==i?t.substring(n,rt):a)!==i&&(a=Ft())!==i?(e,r=W(n),e=r):(rt=e,e=i)):(rt=e,e=i);return e}())!==i&&(a=bt())!==i?(e,e=r=h(r,n,a)):(rt=e,e=i),e===i&&(e=gt()),e}function gt(){var e,r,n;return e=rt,(r=function(){var e,r,n;e=rt,(r=Ft())!==i&&(n=function(){var e,r,n,a,o,s,u;e=rt,r=rt,j.test(t.charAt(rt))?(n=t.charAt(rt),rt++):(n=i,0===ot&&ft(x));n===i&&(n=null);n!==i?(P.test(t.charAt(rt))?(a=t.charAt(rt),rt++):(a=i,0===ot&&ft(F)),a!==i&&(o=At())!==i?(N.test(t.charAt(rt))?(s=t.charAt(rt),rt++):(s=i,0===ot&&ft(q)),s!==i&&(u=wt())!==i?r=n=[n,a,o,s,u]:(rt=r,r=i)):(rt=r,r=i)):(rt=r,r=i);e=r!==i?t.substring(e,rt):r;e===i&&(e=rt,r=rt,(n=wt())===i&&(n=null),n!==i&&(a=At())!==i?r=n=[n,a]:(rt=r,r=i),e=r!==i?t.substring(e,rt):r);return e}())!==i&&Ft()!==i?(e,r=b(n),e=r):(rt=e,e=i);e===i&&(e=rt,(r=Ft())!==i&&(n=wt())!==i&&Ft()!==i?(e,r=g(n),e=r):(rt=e,e=i));return e}())!==i&&(e,r=d(r)),(e=r)===i&&(e=mt())===i&&(e=rt,(r=jt())!==i&&(n=bt())!==i&&xt()!==i?(e,e=r=p(n)):(rt=e,e=i)),e}function mt(){var t,e;return t=rt,(e=yt())!==i&&(t,e=v(e)),t=e}function yt(){var e,r,n,a,o,s;if(e=rt,Ft()!==i){if(r=rt,n=rt,m.test(t.charAt(rt))?(a=t.charAt(rt),rt++):(a=i,0===ot&&ft(y)),a!==i){for(o=[],w.test(t.charAt(rt))?(s=t.charAt(rt),rt++):(s=i,0===ot&&ft(O));s!==i;)o.push(s),w.test(t.charAt(rt))?(s=t.charAt(rt),rt++):(s=i,0===ot&&ft(O));o!==i?n=a=[a,o]:(rt=n,n=i)}else rt=n,n=i;(r=n!==i?t.substring(r,rt):n)!==i&&(n=Ft())!==i?(e,e=A(r)):(rt=e,e=i)}else rt=e,e=i;return e}function wt(){var e,r,n,a;return e=rt,r=rt,j.test(t.charAt(rt))?(n=t.charAt(rt),rt++):(n=i,0===ot&&ft(x)),n===i&&(n=null),n!==i&&(a=Ot())!==i?r=n=[n,a]:(rt=r,r=i),e=r!==i?t.substring(e,rt):r}function Ot(){var e,r,n;if(e=rt,r=[],P.test(t.charAt(rt))?(n=t.charAt(rt),rt++):(n=i,0===ot&&ft(F)),n!==i)for(;n!==i;)r.push(n),P.test(t.charAt(rt))?(n=t.charAt(rt),rt++):(n=i,0===ot&&ft(F));else r=i;return e=r!==i?t.substring(e,rt):r}function At(){var e,r,n,a;return e=rt,r=rt,46===t.charCodeAt(rt)?(n=M,rt++):(n=i,0===ot&&ft(C)),n!==i&&(a=Ot())!==i?r=n=[n,a]:(rt=r,r=i),e=r!==i?t.substring(e,rt):r}function jt(){var e,r,n,a;return e=rt,(r=Ft())!==i?(40===t.charCodeAt(rt)?(n=I,rt++):(n=i,0===ot&&ft(J)),n!==i&&(a=Ft())!==i?e=r=[r,n,a]:(rt=e,e=i)):(rt=e,e=i),e}function xt(){var e,r,n,a;return e=rt,(r=Ft())!==i?(41===t.charCodeAt(rt)?(n=U,rt++):(n=i,0===ot&&ft(Z)),n!==i&&(a=Ft())!==i?e=r=[r,n,a]:(rt=e,e=i)):(rt=e,e=i),e}function Pt(){var e,r,n,a;return e=rt,(r=Ft())!==i?(n=rt,t.substr(rt,2)===K?(a=K,rt+=2):(a=i,0===ot&&ft(X)),a===i&&(a=function(){var e,r,n;e=rt,r=[],tt.test(t.charAt(rt))?(n=t.charAt(rt),rt++):(n=i,0===ot&&ft(et));if(n!==i)for(;n!==i;)r.push(n),tt.test(t.charAt(rt))?(n=t.charAt(rt),rt++):(n=i,0===ot&&ft(et));else r=i;e=r!==i?t.substring(e,rt):r;return e}())===i&&(t.substr(rt,2)===Y?(a=Y,rt+=2):(a=i,0===ot&&ft($))),(n=a!==i?t.substring(n,rt):a)!==i&&(a=Ft())!==i?e=r=[r,n,a]:(rt=e,e=i)):(rt=e,e=i),e}function Ft(){var e,r;for(e=[],tt.test(t.charAt(rt))?(r=t.charAt(rt),rt++):(r=i,0===ot&&ft(et));r!==i;)e.push(r),tt.test(t.charAt(rt))?(r=t.charAt(rt),rt++):(r=i,0===ot&&ft(et));return e}if((r=o())!==i&&rt===t.length)return r;throw r!==i&&rt<t.length&&ft({type:"end"}),ht(at,it<t.length?t.charAt(it):null,it<t.length?lt(it,it+1):lt(it,it))}}},97:function(t,e,r){t.exports=r.p+"d44f3efd5eed9c8a181e.worklet.js"}}]);
//# sourceMappingURL=5.a972b521a2956c95757c.js.map