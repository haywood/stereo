(self.webpackJsonp=self.webpackJsonp||[]).push([[6],{100:function(e,t,i){(t=i(1)(!1)).push([e.i,"@import url(https://fonts.googleapis.com/icon?family=Material+Icons);"]),t.push([e.i,"#inputs{align-items:flex-end;box-sizing:border-box;display:flex;flex-flow:column wrap;justify-content:flex-start;padding:16px;position:absolute;right:0;top:0}#inputs span,#inputs i{padding-bottom:8px}#media{bottom:0;box-sizing:border-box;display:flex;flex-flow:row wrap;padding:32px;position:absolute;width:100%}#media i.material-icons{cursor:pointer;display:'none';font-size:36px}.spacer{flex:1}\n",""]),e.exports=t},32:function(e,t,i){"use strict";i.d(t,"a",(function(){return u})),i.d(t,"b",(function(){return c})),i.d(t,"c",(function(){return h}));var s=i(104);function n(e,t,i){return t in e?Object.defineProperty(e,t,{value:i,enumerable:!0,configurable:!0,writable:!0}):e[t]=i,e}var a,o="0"!=new URLSearchParams(window.location.search).get("p"),l=(a=window.location.hash.substr(1),new URLSearchParams(a?atob(a):""));class r{constructor(e,t,i){this.id=e,this._value=t,this.persistent=i,n(this,"subject",void 0),n(this,"initFromOrWriteToHash",()=>{this.persistent&&l.has(this.id)?this._value=this.parse(l.get(this.id)):this.persistent&&this.updateHash()}),n(this,"newSubject",()=>new s.a({newValue:this._value})),n(this,"updateHash",()=>{var e=this.stringify(this.value);l.set(this.id,e),document.location.hash=btoa(l.toString())}),o?this.initFromOrWriteToHash():this.persistent=!1,this.subject=this.newSubject()}get stream(){return this.subject.asObservable()}get value(){return this._value}set value(e){var t=this.value;if(this._value=e,this.subject.next({newValue:e,oldValue:t,event:window.event}),this.persistent){var i=this.stringify(e);localStorage.setItem("inputs.".concat(this.id),i),this.updateHash()}}}class u extends r{constructor(e,t){super(e,t,!(arguments.length>2&&void 0!==arguments[2])||arguments[2]),this.id=e,n(this,"disabled",!1)}parse(e){return e}stringify(e){return e}}class c extends r{constructor(e,t,i,s){var n=arguments.length>4&&void 0!==arguments[4]&&arguments[4];super(e,t,!(arguments.length>5&&void 0!==arguments[5])||arguments[5]),this.id=e,this.on=i,this.off=s,this.disabled=n}parse(e){if(/1|true/i.test(e))return!0;if(/0|false/i.test(e))return!1;throw new Error("invalid boolean value for input ".concat(this.id,": ").concat(e))}stringify(e){return e?"1":"0"}}var h={pipe:new u("pipe","10000->sphere(4, 1)->R(theta, 0, 1, cos, tan)->R(theta, 0, 2)->R(theta, 0, 3)->stereo(3)"),theta:new u("theta","pi * (t + power) / 20"),h:new u("h","chroma * i / n"),l:new u("l","power"),animate:new c("animate",!0,"play","pause",!1,!0),mic:new c("mic",!1,"mic","mic_off",!1,!1),fullscreen:new c("fullscreen",!1,"enter_fullscreen","exit_fullscreen",!document.fullscreenEnabled,!1)};window.inputs=h},7:function(e,t,i){"use strict";i.r(t),i.d(t,"Controls",(function(){return u}));var s=i(32),n=i(98),a=i.n(n),o=(i(99),i(18)),l=i.n(o);function r(e,t,i){return t in e?Object.defineProperty(e,t,{value:i,enumerable:!0,configurable:!0,writable:!0}):e[t]=i,e}class u{constructor(){r(this,"domElement",document.createElement("div")),r(this,"hasMouse",!1),r(this,"setupInputs",()=>{for(var e of Object.values(s.c))e.disabled||(e instanceof s.a?this.setupText(e):e instanceof s.b&&this.setupToggle(e));s.c.fullscreen.disabled||s.c.fullscreen.stream.subscribe(e=>{var{newValue:t}=e;t?document.body.requestFullscreen():document.fullscreenElement&&document.exitFullscreen()})}),r(this,"querySelector",e=>this.domElement.querySelector(e)),r(this,"setupText",e=>{var t=this.querySelector("#".concat(e.id));l()(t,"Did not find element for input #".concat(e.id)),t.onchange=()=>e.value=t.value,e.stream.subscribe(e=>{var{newValue:i}=e;t.value=i,t.size=i.length})}),r(this,"setupToggle",e=>{var t=this.querySelector("#".concat(e.on)),i=this.querySelector("#".concat(e.off));t.onclick=()=>e.value=!0,i.onclick=()=>e.value=!1,e.stream.subscribe(e=>{var{newValue:s}=e;s?(t.style.display="none",i.style.display="inline"):(t.style.display="inline",i.style.display="none")})}),r(this,"setupShowHideHandlers",()=>{document.onmousemove=this.onmousemove,this.domElement.onmouseover=()=>this.hasMouse=!0,this.domElement.onmouseout=()=>this.hasMouse=!1}),r(this,"setupKeyboardShortcuts",()=>{document.onkeydown=e=>{e.repeat||this.domElement.contains(e.target)||" "===e.key&&(s.c.animate.value=!s.c.animate.value)}}),r(this,"onmousemove",()=>{"1"==this.domElement.style.opacity?setTimeout(this.maybeHide,1e3):this.domElement.style.opacity="1"}),r(this,"maybeHide",()=>{this.hasMouse||this.domElement.contains(document.activeElement)||(this.domElement.style.opacity="0")}),this.domElement.id="controls",this.domElement.innerHTML=a.a,this.setupInputs(),this.setupShowHideHandlers(),this.setupKeyboardShortcuts(),document.onclick=e=>{this.domElement.contains(e.target)||(s.c.animate.value=!s.c.animate.value)}}}},98:function(e,t){e.exports='<div id="inputs">\n    <span>\n        <label for="pipe">Pipe</label>\n        <input id="pipe" />\n    </span>\n\n    <span>\n        <label for="theta">Theta</label>\n        <input id="theta" />\n    </span>\n\n    <span>\n        <label for="h">Hue</label>\n        <input id="h" />\n    </span>\n\n    <span>\n        <label for="l">Lightness</label>\n        <input id="l" />\n    </span>\n</div>\n\n<div id="media">\n    <i id="play" class="material-icons">play_arrow</i>\n    <i id="pause" class="material-icons">pause</i>\n    <i id="mic" class="material-icons">mic</i>\n    <i id="mic_off" class="material-icons">mic_off</i>\n\n    <div class="spacer"></div>\n\n    <i id="enter_fullscreen" class="material-icons">fullscreen</i>\n    <i id="exit_fullscreen" class="material-icons">fullscreen_exit</i>\n</div>\n'},99:function(e,t,i){var s=i(0),n=i(100);"string"==typeof(n=n.__esModule?n.default:n)&&(n=[[e.i,n,""]]);var a={insert:"head",singleton:!1},o=(s(e.i,n,a),n.locals?n.locals:{});e.exports=o}}]);
//# sourceMappingURL=6.a972b521a2956c95757c.js.map