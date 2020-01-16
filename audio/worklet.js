!function(){"use strict";var t="undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{},r=[],e=[],n="undefined"!=typeof Uint8Array?Uint8Array:Array,i=!1;function o(){i=!0;for(var t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",n=0,o=t.length;n<o;++n)r[n]=t[n],e[t.charCodeAt(n)]=n;e["-".charCodeAt(0)]=62,e["_".charCodeAt(0)]=63}function s(t,e,n){for(var i,o,s=[],u=e;u<n;u+=3)i=(t[u]<<16)+(t[u+1]<<8)+t[u+2],s.push(r[(o=i)>>18&63]+r[o>>12&63]+r[o>>6&63]+r[63&o]);return s.join("")}function u(t){var e;i||o();for(var n=t.length,u=n%3,f="",a=[],h=0,c=n-u;h<c;h+=16383)a.push(s(t,h,h+16383>c?c:h+16383));return 1===u?(e=t[n-1],f+=r[e>>2],f+=r[e<<4&63],f+="=="):2===u&&(e=(t[n-2]<<8)+t[n-1],f+=r[e>>10],f+=r[e>>4&63],f+=r[e<<2&63],f+="="),a.push(f),a.join("")}function f(t,r,e,n,i){var o,s,u=8*i-n-1,f=(1<<u)-1,a=f>>1,h=-7,c=e?i-1:0,l=e?-1:1,p=t[r+c];for(c+=l,o=p&(1<<-h)-1,p>>=-h,h+=u;h>0;o=256*o+t[r+c],c+=l,h-=8);for(s=o&(1<<-h)-1,o>>=-h,h+=n;h>0;s=256*s+t[r+c],c+=l,h-=8);if(0===o)o=1-a;else{if(o===f)return s?NaN:1/0*(p?-1:1);s+=Math.pow(2,n),o-=a}return(p?-1:1)*s*Math.pow(2,o-n)}function a(t,r,e,n,i,o){var s,u,f,a=8*o-i-1,h=(1<<a)-1,c=h>>1,l=23===i?Math.pow(2,-24)-Math.pow(2,-77):0,p=n?0:o-1,g=n?1:-1,y=r<0||0===r&&1/r<0?1:0;for(r=Math.abs(r),isNaN(r)||r===1/0?(u=isNaN(r)?1:0,s=h):(s=Math.floor(Math.log(r)/Math.LN2),r*(f=Math.pow(2,-s))<1&&(s--,f*=2),(r+=s+c>=1?l/f:l*Math.pow(2,1-c))*f>=2&&(s++,f/=2),s+c>=h?(u=0,s=h):s+c>=1?(u=(r*f-1)*Math.pow(2,i),s+=c):(u=r*Math.pow(2,c-1)*Math.pow(2,i),s=0));i>=8;t[e+p]=255&u,p+=g,u/=256,i-=8);for(s=s<<i|u,a+=i;a>0;t[e+p]=255&s,p+=g,s/=256,a-=8);t[e+p-g]|=128*y}var h={}.toString,c=Array.isArray||function(t){return"[object Array]"==h.call(t)};function l(){return g.TYPED_ARRAY_SUPPORT?2147483647:1073741823}function p(t,r){if(l()<r)throw new RangeError("Invalid typed array length");return g.TYPED_ARRAY_SUPPORT?(t=new Uint8Array(r)).__proto__=g.prototype:(null===t&&(t=new g(r)),t.length=r),t}function g(t,r,e){if(!(g.TYPED_ARRAY_SUPPORT||this instanceof g))return new g(t,r,e);if("number"==typeof t){if("string"==typeof r)throw new Error("If encoding is specified then the first argument must be a string");return w(this,t)}return y(this,t,r,e)}function y(t,r,e,n){if("number"==typeof r)throw new TypeError('"value" argument must not be a number');return"undefined"!=typeof ArrayBuffer&&r instanceof ArrayBuffer?function(t,r,e,n){if(r.byteLength,e<0||r.byteLength<e)throw new RangeError("'offset' is out of bounds");if(r.byteLength<e+(n||0))throw new RangeError("'length' is out of bounds");r=void 0===e&&void 0===n?new Uint8Array(r):void 0===n?new Uint8Array(r,e):new Uint8Array(r,e,n);g.TYPED_ARRAY_SUPPORT?(t=r).__proto__=g.prototype:t=b(t,r);return t}(t,r,e,n):"string"==typeof r?function(t,r,e){"string"==typeof e&&""!==e||(e="utf8");if(!g.isEncoding(e))throw new TypeError('"encoding" must be a valid string encoding');var n=0|_(r,e),i=(t=p(t,n)).write(r,e);i!==n&&(t=t.slice(0,i));return t}(t,r,e):function(t,r){if(m(r)){var e=0|v(r.length);return 0===(t=p(t,e)).length?t:(r.copy(t,0,0,e),t)}if(r){if("undefined"!=typeof ArrayBuffer&&r.buffer instanceof ArrayBuffer||"length"in r)return"number"!=typeof r.length||(n=r.length)!=n?p(t,0):b(t,r);if("Buffer"===r.type&&c(r.data))return b(t,r.data)}var n;throw new TypeError("First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.")}(t,r)}function d(t){if("number"!=typeof t)throw new TypeError('"size" argument must be a number');if(t<0)throw new RangeError('"size" argument must not be negative')}function w(t,r){if(d(r),t=p(t,r<0?0:0|v(r)),!g.TYPED_ARRAY_SUPPORT)for(var e=0;e<r;++e)t[e]=0;return t}function b(t,r){var e=r.length<0?0:0|v(r.length);t=p(t,e);for(var n=0;n<e;n+=1)t[n]=255&r[n];return t}function v(t){if(t>=l())throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x"+l().toString(16)+" bytes");return 0|t}function m(t){return!(null==t||!t._isBuffer)}function _(t,r){if(m(t))return t.length;if("undefined"!=typeof ArrayBuffer&&"function"==typeof ArrayBuffer.isView&&(ArrayBuffer.isView(t)||t instanceof ArrayBuffer))return t.byteLength;"string"!=typeof t&&(t=""+t);var e=t.length;if(0===e)return 0;for(var n=!1;;)switch(r){case"ascii":case"latin1":case"binary":return e;case"utf8":case"utf-8":case void 0:return G(t).length;case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return 2*e;case"hex":return e>>>1;case"base64":return J(t).length;default:if(n)return G(t).length;r=(""+r).toLowerCase(),n=!0}}function E(t,r,e){var n=!1;if((void 0===r||r<0)&&(r=0),r>this.length)return"";if((void 0===e||e>this.length)&&(e=this.length),e<=0)return"";if((e>>>=0)<=(r>>>=0))return"";for(t||(t="utf8");;)switch(t){case"hex":return D(this,r,e);case"utf8":case"utf-8":return B(this,r,e);case"ascii":return I(this,r,e);case"latin1":case"binary":return Y(this,r,e);case"base64":return z(this,r,e);case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return C(this,r,e);default:if(n)throw new TypeError("Unknown encoding: "+t);t=(t+"").toLowerCase(),n=!0}}function A(t,r,e){var n=t[r];t[r]=t[e],t[e]=n}function R(t,r,e,n,i){if(0===t.length)return-1;if("string"==typeof e?(n=e,e=0):e>2147483647?e=2147483647:e<-2147483648&&(e=-2147483648),e=+e,isNaN(e)&&(e=i?0:t.length-1),e<0&&(e=t.length+e),e>=t.length){if(i)return-1;e=t.length-1}else if(e<0){if(!i)return-1;e=0}if("string"==typeof r&&(r=g.from(r,n)),m(r))return 0===r.length?-1:P(t,r,e,n,i);if("number"==typeof r)return r&=255,g.TYPED_ARRAY_SUPPORT&&"function"==typeof Uint8Array.prototype.indexOf?i?Uint8Array.prototype.indexOf.call(t,r,e):Uint8Array.prototype.lastIndexOf.call(t,r,e):P(t,[r],e,n,i);throw new TypeError("val must be string, number or Buffer")}function P(t,r,e,n,i){var o,s=1,u=t.length,f=r.length;if(void 0!==n&&("ucs2"===(n=String(n).toLowerCase())||"ucs-2"===n||"utf16le"===n||"utf-16le"===n)){if(t.length<2||r.length<2)return-1;s=2,u/=2,f/=2,e/=2}function a(t,r){return 1===s?t[r]:t.readUInt16BE(r*s)}if(i){var h=-1;for(o=e;o<u;o++)if(a(t,o)===a(r,-1===h?0:o-h)){if(-1===h&&(h=o),o-h+1===f)return h*s}else-1!==h&&(o-=o-h),h=-1}else for(e+f>u&&(e=u-f),o=e;o>=0;o--){for(var c=!0,l=0;l<f;l++)if(a(t,o+l)!==a(r,l)){c=!1;break}if(c)return o}return-1}function T(t,r,e,n){e=Number(e)||0;var i=t.length-e;n?(n=Number(n))>i&&(n=i):n=i;var o=r.length;if(o%2!=0)throw new TypeError("Invalid hex string");n>o/2&&(n=o/2);for(var s=0;s<n;++s){var u=parseInt(r.substr(2*s,2),16);if(isNaN(u))return s;t[e+s]=u}return s}function x(t,r,e,n){return Z(G(r,t.length-e),t,e,n)}function S(t,r,e,n){return Z(function(t){for(var r=[],e=0;e<t.length;++e)r.push(255&t.charCodeAt(e));return r}(r),t,e,n)}function O(t,r,e,n){return S(t,r,e,n)}function M(t,r,e,n){return Z(J(r),t,e,n)}function U(t,r,e,n){return Z(function(t,r){for(var e,n,i,o=[],s=0;s<t.length&&!((r-=2)<0);++s)e=t.charCodeAt(s),n=e>>8,i=e%256,o.push(i),o.push(n);return o}(r,t.length-e),t,e,n)}function z(t,r,e){return 0===r&&e===t.length?u(t):u(t.slice(r,e))}function B(t,r,e){e=Math.min(t.length,e);for(var n=[],i=r;i<e;){var o,s,u,f,a=t[i],h=null,c=a>239?4:a>223?3:a>191?2:1;if(i+c<=e)switch(c){case 1:a<128&&(h=a);break;case 2:128==(192&(o=t[i+1]))&&(f=(31&a)<<6|63&o)>127&&(h=f);break;case 3:o=t[i+1],s=t[i+2],128==(192&o)&&128==(192&s)&&(f=(15&a)<<12|(63&o)<<6|63&s)>2047&&(f<55296||f>57343)&&(h=f);break;case 4:o=t[i+1],s=t[i+2],u=t[i+3],128==(192&o)&&128==(192&s)&&128==(192&u)&&(f=(15&a)<<18|(63&o)<<12|(63&s)<<6|63&u)>65535&&f<1114112&&(h=f)}null===h?(h=65533,c=1):h>65535&&(h-=65536,n.push(h>>>10&1023|55296),h=56320|1023&h),n.push(h),i+=c}return function(t){var r=t.length;if(r<=4096)return String.fromCharCode.apply(String,t);var e="",n=0;for(;n<r;)e+=String.fromCharCode.apply(String,t.slice(n,n+=4096));return e}(n)}g.TYPED_ARRAY_SUPPORT=void 0===t.TYPED_ARRAY_SUPPORT||t.TYPED_ARRAY_SUPPORT,g.poolSize=8192,g._augment=function(t){return t.__proto__=g.prototype,t},g.from=function(t,r,e){return y(null,t,r,e)},g.TYPED_ARRAY_SUPPORT&&(g.prototype.__proto__=Uint8Array.prototype,g.__proto__=Uint8Array),g.alloc=function(t,r,e){return function(t,r,e,n){return d(r),r<=0?p(t,r):void 0!==e?"string"==typeof n?p(t,r).fill(e,n):p(t,r).fill(e):p(t,r)}(null,t,r,e)},g.allocUnsafe=function(t){return w(null,t)},g.allocUnsafeSlow=function(t){return w(null,t)},g.isBuffer=W,g.compare=function(t,r){if(!m(t)||!m(r))throw new TypeError("Arguments must be Buffers");if(t===r)return 0;for(var e=t.length,n=r.length,i=0,o=Math.min(e,n);i<o;++i)if(t[i]!==r[i]){e=t[i],n=r[i];break}return e<n?-1:n<e?1:0},g.isEncoding=function(t){switch(String(t).toLowerCase()){case"hex":case"utf8":case"utf-8":case"ascii":case"latin1":case"binary":case"base64":case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return!0;default:return!1}},g.concat=function(t,r){if(!c(t))throw new TypeError('"list" argument must be an Array of Buffers');if(0===t.length)return g.alloc(0);var e;if(void 0===r)for(r=0,e=0;e<t.length;++e)r+=t[e].length;var n=g.allocUnsafe(r),i=0;for(e=0;e<t.length;++e){var o=t[e];if(!m(o))throw new TypeError('"list" argument must be an Array of Buffers');o.copy(n,i),i+=o.length}return n},g.byteLength=_,g.prototype._isBuffer=!0,g.prototype.swap16=function(){var t=this.length;if(t%2!=0)throw new RangeError("Buffer size must be a multiple of 16-bits");for(var r=0;r<t;r+=2)A(this,r,r+1);return this},g.prototype.swap32=function(){var t=this.length;if(t%4!=0)throw new RangeError("Buffer size must be a multiple of 32-bits");for(var r=0;r<t;r+=4)A(this,r,r+3),A(this,r+1,r+2);return this},g.prototype.swap64=function(){var t=this.length;if(t%8!=0)throw new RangeError("Buffer size must be a multiple of 64-bits");for(var r=0;r<t;r+=8)A(this,r,r+7),A(this,r+1,r+6),A(this,r+2,r+5),A(this,r+3,r+4);return this},g.prototype.toString=function(){var t=0|this.length;return 0===t?"":0===arguments.length?B(this,0,t):E.apply(this,arguments)},g.prototype.equals=function(t){if(!m(t))throw new TypeError("Argument must be a Buffer");return this===t||0===g.compare(this,t)},g.prototype.inspect=function(){var t="";return this.length>0&&(t=this.toString("hex",0,50).match(/.{2}/g).join(" "),this.length>50&&(t+=" ... ")),"<Buffer "+t+">"},g.prototype.compare=function(t,r,e,n,i){if(!m(t))throw new TypeError("Argument must be a Buffer");if(void 0===r&&(r=0),void 0===e&&(e=t?t.length:0),void 0===n&&(n=0),void 0===i&&(i=this.length),r<0||e>t.length||n<0||i>this.length)throw new RangeError("out of range index");if(n>=i&&r>=e)return 0;if(n>=i)return-1;if(r>=e)return 1;if(this===t)return 0;for(var o=(i>>>=0)-(n>>>=0),s=(e>>>=0)-(r>>>=0),u=Math.min(o,s),f=this.slice(n,i),a=t.slice(r,e),h=0;h<u;++h)if(f[h]!==a[h]){o=f[h],s=a[h];break}return o<s?-1:s<o?1:0},g.prototype.includes=function(t,r,e){return-1!==this.indexOf(t,r,e)},g.prototype.indexOf=function(t,r,e){return R(this,t,r,e,!0)},g.prototype.lastIndexOf=function(t,r,e){return R(this,t,r,e,!1)},g.prototype.write=function(t,r,e,n){if(void 0===r)n="utf8",e=this.length,r=0;else if(void 0===e&&"string"==typeof r)n=r,e=this.length,r=0;else{if(!isFinite(r))throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");r|=0,isFinite(e)?(e|=0,void 0===n&&(n="utf8")):(n=e,e=void 0)}var i=this.length-r;if((void 0===e||e>i)&&(e=i),t.length>0&&(e<0||r<0)||r>this.length)throw new RangeError("Attempt to write outside buffer bounds");n||(n="utf8");for(var o=!1;;)switch(n){case"hex":return T(this,t,r,e);case"utf8":case"utf-8":return x(this,t,r,e);case"ascii":return S(this,t,r,e);case"latin1":case"binary":return O(this,t,r,e);case"base64":return M(this,t,r,e);case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return U(this,t,r,e);default:if(o)throw new TypeError("Unknown encoding: "+n);n=(""+n).toLowerCase(),o=!0}},g.prototype.toJSON=function(){return{type:"Buffer",data:Array.prototype.slice.call(this._arr||this,0)}};function I(t,r,e){var n="";e=Math.min(t.length,e);for(var i=r;i<e;++i)n+=String.fromCharCode(127&t[i]);return n}function Y(t,r,e){var n="";e=Math.min(t.length,e);for(var i=r;i<e;++i)n+=String.fromCharCode(t[i]);return n}function D(t,r,e){var n=t.length;(!r||r<0)&&(r=0),(!e||e<0||e>n)&&(e=n);for(var i="",o=r;o<e;++o)i+=H(t[o]);return i}function C(t,r,e){for(var n=t.slice(r,e),i="",o=0;o<n.length;o+=2)i+=String.fromCharCode(n[o]+256*n[o+1]);return i}function j(t,r,e){if(t%1!=0||t<0)throw new RangeError("offset is not uint");if(t+r>e)throw new RangeError("Trying to access beyond buffer length")}function k(t,r,e,n,i,o){if(!m(t))throw new TypeError('"buffer" argument must be a Buffer instance');if(r>i||r<o)throw new RangeError('"value" argument is out of bounds');if(e+n>t.length)throw new RangeError("Index out of range")}function L(t,r,e,n){r<0&&(r=65535+r+1);for(var i=0,o=Math.min(t.length-e,2);i<o;++i)t[e+i]=(r&255<<8*(n?i:1-i))>>>8*(n?i:1-i)}function N(t,r,e,n){r<0&&(r=4294967295+r+1);for(var i=0,o=Math.min(t.length-e,4);i<o;++i)t[e+i]=r>>>8*(n?i:3-i)&255}function F(t,r,e,n,i,o){if(e+n>t.length)throw new RangeError("Index out of range");if(e<0)throw new RangeError("Index out of range")}function q(t,r,e,n,i){return i||F(t,0,e,4),a(t,r,e,n,23,4),e+4}function $(t,r,e,n,i){return i||F(t,0,e,8),a(t,r,e,n,52,8),e+8}g.prototype.slice=function(t,r){var e,n=this.length;if((t=~~t)<0?(t+=n)<0&&(t=0):t>n&&(t=n),(r=void 0===r?n:~~r)<0?(r+=n)<0&&(r=0):r>n&&(r=n),r<t&&(r=t),g.TYPED_ARRAY_SUPPORT)(e=this.subarray(t,r)).__proto__=g.prototype;else{var i=r-t;e=new g(i,void 0);for(var o=0;o<i;++o)e[o]=this[o+t]}return e},g.prototype.readUIntLE=function(t,r,e){t|=0,r|=0,e||j(t,r,this.length);for(var n=this[t],i=1,o=0;++o<r&&(i*=256);)n+=this[t+o]*i;return n},g.prototype.readUIntBE=function(t,r,e){t|=0,r|=0,e||j(t,r,this.length);for(var n=this[t+--r],i=1;r>0&&(i*=256);)n+=this[t+--r]*i;return n},g.prototype.readUInt8=function(t,r){return r||j(t,1,this.length),this[t]},g.prototype.readUInt16LE=function(t,r){return r||j(t,2,this.length),this[t]|this[t+1]<<8},g.prototype.readUInt16BE=function(t,r){return r||j(t,2,this.length),this[t]<<8|this[t+1]},g.prototype.readUInt32LE=function(t,r){return r||j(t,4,this.length),(this[t]|this[t+1]<<8|this[t+2]<<16)+16777216*this[t+3]},g.prototype.readUInt32BE=function(t,r){return r||j(t,4,this.length),16777216*this[t]+(this[t+1]<<16|this[t+2]<<8|this[t+3])},g.prototype.readIntLE=function(t,r,e){t|=0,r|=0,e||j(t,r,this.length);for(var n=this[t],i=1,o=0;++o<r&&(i*=256);)n+=this[t+o]*i;return n>=(i*=128)&&(n-=Math.pow(2,8*r)),n},g.prototype.readIntBE=function(t,r,e){t|=0,r|=0,e||j(t,r,this.length);for(var n=r,i=1,o=this[t+--n];n>0&&(i*=256);)o+=this[t+--n]*i;return o>=(i*=128)&&(o-=Math.pow(2,8*r)),o},g.prototype.readInt8=function(t,r){return r||j(t,1,this.length),128&this[t]?-1*(255-this[t]+1):this[t]},g.prototype.readInt16LE=function(t,r){r||j(t,2,this.length);var e=this[t]|this[t+1]<<8;return 32768&e?4294901760|e:e},g.prototype.readInt16BE=function(t,r){r||j(t,2,this.length);var e=this[t+1]|this[t]<<8;return 32768&e?4294901760|e:e},g.prototype.readInt32LE=function(t,r){return r||j(t,4,this.length),this[t]|this[t+1]<<8|this[t+2]<<16|this[t+3]<<24},g.prototype.readInt32BE=function(t,r){return r||j(t,4,this.length),this[t]<<24|this[t+1]<<16|this[t+2]<<8|this[t+3]},g.prototype.readFloatLE=function(t,r){return r||j(t,4,this.length),f(this,t,!0,23,4)},g.prototype.readFloatBE=function(t,r){return r||j(t,4,this.length),f(this,t,!1,23,4)},g.prototype.readDoubleLE=function(t,r){return r||j(t,8,this.length),f(this,t,!0,52,8)},g.prototype.readDoubleBE=function(t,r){return r||j(t,8,this.length),f(this,t,!1,52,8)},g.prototype.writeUIntLE=function(t,r,e,n){(t=+t,r|=0,e|=0,n)||k(this,t,r,e,Math.pow(2,8*e)-1,0);var i=1,o=0;for(this[r]=255&t;++o<e&&(i*=256);)this[r+o]=t/i&255;return r+e},g.prototype.writeUIntBE=function(t,r,e,n){(t=+t,r|=0,e|=0,n)||k(this,t,r,e,Math.pow(2,8*e)-1,0);var i=e-1,o=1;for(this[r+i]=255&t;--i>=0&&(o*=256);)this[r+i]=t/o&255;return r+e},g.prototype.writeUInt8=function(t,r,e){return t=+t,r|=0,e||k(this,t,r,1,255,0),g.TYPED_ARRAY_SUPPORT||(t=Math.floor(t)),this[r]=255&t,r+1},g.prototype.writeUInt16LE=function(t,r,e){return t=+t,r|=0,e||k(this,t,r,2,65535,0),g.TYPED_ARRAY_SUPPORT?(this[r]=255&t,this[r+1]=t>>>8):L(this,t,r,!0),r+2},g.prototype.writeUInt16BE=function(t,r,e){return t=+t,r|=0,e||k(this,t,r,2,65535,0),g.TYPED_ARRAY_SUPPORT?(this[r]=t>>>8,this[r+1]=255&t):L(this,t,r,!1),r+2},g.prototype.writeUInt32LE=function(t,r,e){return t=+t,r|=0,e||k(this,t,r,4,4294967295,0),g.TYPED_ARRAY_SUPPORT?(this[r+3]=t>>>24,this[r+2]=t>>>16,this[r+1]=t>>>8,this[r]=255&t):N(this,t,r,!0),r+4},g.prototype.writeUInt32BE=function(t,r,e){return t=+t,r|=0,e||k(this,t,r,4,4294967295,0),g.TYPED_ARRAY_SUPPORT?(this[r]=t>>>24,this[r+1]=t>>>16,this[r+2]=t>>>8,this[r+3]=255&t):N(this,t,r,!1),r+4},g.prototype.writeIntLE=function(t,r,e,n){if(t=+t,r|=0,!n){var i=Math.pow(2,8*e-1);k(this,t,r,e,i-1,-i)}var o=0,s=1,u=0;for(this[r]=255&t;++o<e&&(s*=256);)t<0&&0===u&&0!==this[r+o-1]&&(u=1),this[r+o]=(t/s>>0)-u&255;return r+e},g.prototype.writeIntBE=function(t,r,e,n){if(t=+t,r|=0,!n){var i=Math.pow(2,8*e-1);k(this,t,r,e,i-1,-i)}var o=e-1,s=1,u=0;for(this[r+o]=255&t;--o>=0&&(s*=256);)t<0&&0===u&&0!==this[r+o+1]&&(u=1),this[r+o]=(t/s>>0)-u&255;return r+e},g.prototype.writeInt8=function(t,r,e){return t=+t,r|=0,e||k(this,t,r,1,127,-128),g.TYPED_ARRAY_SUPPORT||(t=Math.floor(t)),t<0&&(t=255+t+1),this[r]=255&t,r+1},g.prototype.writeInt16LE=function(t,r,e){return t=+t,r|=0,e||k(this,t,r,2,32767,-32768),g.TYPED_ARRAY_SUPPORT?(this[r]=255&t,this[r+1]=t>>>8):L(this,t,r,!0),r+2},g.prototype.writeInt16BE=function(t,r,e){return t=+t,r|=0,e||k(this,t,r,2,32767,-32768),g.TYPED_ARRAY_SUPPORT?(this[r]=t>>>8,this[r+1]=255&t):L(this,t,r,!1),r+2},g.prototype.writeInt32LE=function(t,r,e){return t=+t,r|=0,e||k(this,t,r,4,2147483647,-2147483648),g.TYPED_ARRAY_SUPPORT?(this[r]=255&t,this[r+1]=t>>>8,this[r+2]=t>>>16,this[r+3]=t>>>24):N(this,t,r,!0),r+4},g.prototype.writeInt32BE=function(t,r,e){return t=+t,r|=0,e||k(this,t,r,4,2147483647,-2147483648),t<0&&(t=4294967295+t+1),g.TYPED_ARRAY_SUPPORT?(this[r]=t>>>24,this[r+1]=t>>>16,this[r+2]=t>>>8,this[r+3]=255&t):N(this,t,r,!1),r+4},g.prototype.writeFloatLE=function(t,r,e){return q(this,t,r,!0,e)},g.prototype.writeFloatBE=function(t,r,e){return q(this,t,r,!1,e)},g.prototype.writeDoubleLE=function(t,r,e){return $(this,t,r,!0,e)},g.prototype.writeDoubleBE=function(t,r,e){return $(this,t,r,!1,e)},g.prototype.copy=function(t,r,e,n){if(e||(e=0),n||0===n||(n=this.length),r>=t.length&&(r=t.length),r||(r=0),n>0&&n<e&&(n=e),n===e)return 0;if(0===t.length||0===this.length)return 0;if(r<0)throw new RangeError("targetStart out of bounds");if(e<0||e>=this.length)throw new RangeError("sourceStart out of bounds");if(n<0)throw new RangeError("sourceEnd out of bounds");n>this.length&&(n=this.length),t.length-r<n-e&&(n=t.length-r+e);var i,o=n-e;if(this===t&&e<r&&r<n)for(i=o-1;i>=0;--i)t[i+r]=this[i+e];else if(o<1e3||!g.TYPED_ARRAY_SUPPORT)for(i=0;i<o;++i)t[i+r]=this[i+e];else Uint8Array.prototype.set.call(t,this.subarray(e,e+o),r);return o},g.prototype.fill=function(t,r,e,n){if("string"==typeof t){if("string"==typeof r?(n=r,r=0,e=this.length):"string"==typeof e&&(n=e,e=this.length),1===t.length){var i=t.charCodeAt(0);i<256&&(t=i)}if(void 0!==n&&"string"!=typeof n)throw new TypeError("encoding must be a string");if("string"==typeof n&&!g.isEncoding(n))throw new TypeError("Unknown encoding: "+n)}else"number"==typeof t&&(t&=255);if(r<0||this.length<r||this.length<e)throw new RangeError("Out of range index");if(e<=r)return this;var o;if(r>>>=0,e=void 0===e?this.length:e>>>0,t||(t=0),"number"==typeof t)for(o=r;o<e;++o)this[o]=t;else{var s=m(t)?t:G(new g(t,n).toString()),u=s.length;for(o=0;o<e-r;++o)this[o+r]=s[o%u]}return this};var V=/[^+\/0-9A-Za-z-_]/g;function H(t){return t<16?"0"+t.toString(16):t.toString(16)}function G(t,r){var e;r=r||1/0;for(var n=t.length,i=null,o=[],s=0;s<n;++s){if((e=t.charCodeAt(s))>55295&&e<57344){if(!i){if(e>56319){(r-=3)>-1&&o.push(239,191,189);continue}if(s+1===n){(r-=3)>-1&&o.push(239,191,189);continue}i=e;continue}if(e<56320){(r-=3)>-1&&o.push(239,191,189),i=e;continue}e=65536+(i-55296<<10|e-56320)}else i&&(r-=3)>-1&&o.push(239,191,189);if(i=null,e<128){if((r-=1)<0)break;o.push(e)}else if(e<2048){if((r-=2)<0)break;o.push(e>>6|192,63&e|128)}else if(e<65536){if((r-=3)<0)break;o.push(e>>12|224,e>>6&63|128,63&e|128)}else{if(!(e<1114112))throw new Error("Invalid code point");if((r-=4)<0)break;o.push(e>>18|240,e>>12&63|128,e>>6&63|128,63&e|128)}}return o}function J(t){return function(t){var r,s,u,f,a,h;i||o();var c=t.length;if(c%4>0)throw new Error("Invalid string. Length must be a multiple of 4");a="="===t[c-2]?2:"="===t[c-1]?1:0,h=new n(3*c/4-a),u=a>0?c-4:c;var l=0;for(r=0,s=0;r<u;r+=4,s+=3)f=e[t.charCodeAt(r)]<<18|e[t.charCodeAt(r+1)]<<12|e[t.charCodeAt(r+2)]<<6|e[t.charCodeAt(r+3)],h[l++]=f>>16&255,h[l++]=f>>8&255,h[l++]=255&f;return 2===a?(f=e[t.charCodeAt(r)]<<2|e[t.charCodeAt(r+1)]>>4,h[l++]=255&f):1===a&&(f=e[t.charCodeAt(r)]<<10|e[t.charCodeAt(r+1)]<<4|e[t.charCodeAt(r+2)]>>2,h[l++]=f>>8&255,h[l++]=255&f),h}(function(t){if((t=function(t){return t.trim?t.trim():t.replace(/^\s+|\s+$/g,"")}(t).replace(V,"")).length<2)return"";for(;t.length%4!=0;)t+="=";return t}(t))}function Z(t,r,e,n){for(var i=0;i<n&&!(i+e>=r.length||i>=t.length);++i)r[i+e]=t[i];return i}function W(t){return null!=t&&(!!t._isBuffer||K(t)||function(t){return"function"==typeof t.readFloatLE&&"function"==typeof t.slice&&K(t.slice(0,0))}(t))}function K(t){return!!t.constructor&&"function"==typeof t.constructor.isBuffer&&t.constructor.isBuffer(t)}var Q=t.performance||{},X=(Q.now||Q.mozNow||Q.msNow||Q.oNow||Q.webkitNow,"function"==typeof Object.create?function(t,r){t.super_=r,t.prototype=Object.create(r.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}})}:function(t,r){t.super_=r;var e=function(){};e.prototype=r.prototype,t.prototype=new e,t.prototype.constructor=t});function tt(t,r){var e={seen:[],stylize:et};return arguments.length>=3&&(e.depth=arguments[2]),arguments.length>=4&&(e.colors=arguments[3]),st(r)?e.showHidden=r:r&&wt(e,r),at(e.showHidden)&&(e.showHidden=!1),at(e.depth)&&(e.depth=2),at(e.colors)&&(e.colors=!1),at(e.customInspect)&&(e.customInspect=!0),e.colors&&(e.stylize=rt),nt(e,t,e.depth)}function rt(t,r){var e=tt.styles[r];return e?"["+tt.colors[e][0]+"m"+t+"["+tt.colors[e][1]+"m":t}function et(t,r){return t}function nt(t,r,e){if(t.customInspect&&r&&gt(r.inspect)&&r.inspect!==tt&&(!r.constructor||r.constructor.prototype!==r)){var n=r.inspect(e,t);return ft(n)||(n=nt(t,n,e)),n}var i=function(t,r){if(at(r))return t.stylize("undefined","undefined");if(ft(r)){var e="'"+JSON.stringify(r).replace(/^"|"$/g,"").replace(/'/g,"\\'").replace(/\\"/g,'"')+"'";return t.stylize(e,"string")}if(n=r,"number"==typeof n)return t.stylize(""+r,"number");var n;if(st(r))return t.stylize(""+r,"boolean");if(ut(r))return t.stylize("null","null")}(t,r);if(i)return i;var o=Object.keys(r),s=function(t){var r={};return t.forEach((function(t,e){r[t]=!0})),r}(o);if(t.showHidden&&(o=Object.getOwnPropertyNames(r)),pt(r)&&(o.indexOf("message")>=0||o.indexOf("description")>=0))return it(r);if(0===o.length){if(gt(r)){var u=r.name?": "+r.name:"";return t.stylize("[Function"+u+"]","special")}if(ht(r))return t.stylize(RegExp.prototype.toString.call(r),"regexp");if(lt(r))return t.stylize(Date.prototype.toString.call(r),"date");if(pt(r))return it(r)}var f,a,h="",c=!1,l=["{","}"];(f=r,Array.isArray(f)&&(c=!0,l=["[","]"]),gt(r))&&(h=" [Function"+(r.name?": "+r.name:"")+"]");return ht(r)&&(h=" "+RegExp.prototype.toString.call(r)),lt(r)&&(h=" "+Date.prototype.toUTCString.call(r)),pt(r)&&(h=" "+it(r)),0!==o.length||c&&0!=r.length?e<0?ht(r)?t.stylize(RegExp.prototype.toString.call(r),"regexp"):t.stylize("[Object]","special"):(t.seen.push(r),a=c?function(t,r,e,n,i){for(var o=[],s=0,u=r.length;s<u;++s)bt(r,String(s))?o.push(ot(t,r,e,n,String(s),!0)):o.push("");return i.forEach((function(i){i.match(/^\d+$/)||o.push(ot(t,r,e,n,i,!0))})),o}(t,r,e,s,o):o.map((function(n){return ot(t,r,e,s,n,c)})),t.seen.pop(),function(t,r,e){if(t.reduce((function(t,r){return r.indexOf("\n"),t+r.replace(/\u001b\[\d\d?m/g,"").length+1}),0)>60)return e[0]+(""===r?"":r+"\n ")+" "+t.join(",\n  ")+" "+e[1];return e[0]+r+" "+t.join(", ")+" "+e[1]}(a,h,l)):l[0]+h+l[1]}function it(t){return"["+Error.prototype.toString.call(t)+"]"}function ot(t,r,e,n,i,o){var s,u,f;if((f=Object.getOwnPropertyDescriptor(r,i)||{value:r[i]}).get?u=f.set?t.stylize("[Getter/Setter]","special"):t.stylize("[Getter]","special"):f.set&&(u=t.stylize("[Setter]","special")),bt(n,i)||(s="["+i+"]"),u||(t.seen.indexOf(f.value)<0?(u=ut(e)?nt(t,f.value,null):nt(t,f.value,e-1)).indexOf("\n")>-1&&(u=o?u.split("\n").map((function(t){return"  "+t})).join("\n").substr(2):"\n"+u.split("\n").map((function(t){return"   "+t})).join("\n")):u=t.stylize("[Circular]","special")),at(s)){if(o&&i.match(/^\d+$/))return u;(s=JSON.stringify(""+i)).match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)?(s=s.substr(1,s.length-2),s=t.stylize(s,"name")):(s=s.replace(/'/g,"\\'").replace(/\\"/g,'"').replace(/(^"|"$)/g,"'"),s=t.stylize(s,"string"))}return s+": "+u}function st(t){return"boolean"==typeof t}function ut(t){return null===t}function ft(t){return"string"==typeof t}function at(t){return void 0===t}function ht(t){return ct(t)&&"[object RegExp]"===dt(t)}function ct(t){return"object"==typeof t&&null!==t}function lt(t){return ct(t)&&"[object Date]"===dt(t)}function pt(t){return ct(t)&&("[object Error]"===dt(t)||t instanceof Error)}function gt(t){return"function"==typeof t}function yt(t){return null===t||"boolean"==typeof t||"number"==typeof t||"string"==typeof t||"symbol"==typeof t||void 0===t}function dt(t){return Object.prototype.toString.call(t)}function wt(t,r){if(!r||!ct(r))return t;for(var e=Object.keys(r),n=e.length;n--;)t[e[n]]=r[e[n]];return t}function bt(t,r){return Object.prototype.hasOwnProperty.call(t,r)}function vt(t,r){if(t===r)return 0;for(var e=t.length,n=r.length,i=0,o=Math.min(e,n);i<o;++i)if(t[i]!==r[i]){e=t[i],n=r[i];break}return e<n?-1:n<e?1:0}tt.colors={bold:[1,22],italic:[3,23],underline:[4,24],inverse:[7,27],white:[37,39],grey:[90,39],black:[30,39],blue:[34,39],cyan:[36,39],green:[32,39],magenta:[35,39],red:[31,39],yellow:[33,39]},tt.styles={special:"cyan",number:"yellow",boolean:"yellow",undefined:"grey",null:"bold",string:"green",date:"magenta",regexp:"red"};var mt,_t=Object.prototype.hasOwnProperty,Et=Object.keys||function(t){var r=[];for(var e in t)_t.call(t,e)&&r.push(e);return r},At=Array.prototype.slice;function Rt(){return void 0!==mt?mt:mt="foo"===function(){}.name}function Pt(t){return Object.prototype.toString.call(t)}function Tt(r){return!W(r)&&("function"==typeof t.ArrayBuffer&&("function"==typeof ArrayBuffer.isView?ArrayBuffer.isView(r):!!r&&(r instanceof DataView||!!(r.buffer&&r.buffer instanceof ArrayBuffer))))}function xt(t,r){t||Bt(t,!0,r,"==",It)}var St=/\s*function\s+([^\(\s]*)\s*/;function Ot(t){if(gt(t)){if(Rt())return t.name;var r=t.toString().match(St);return r&&r[1]}}function Mt(t){this.name="AssertionError",this.actual=t.actual,this.expected=t.expected,this.operator=t.operator,t.message?(this.message=t.message,this.generatedMessage=!1):(this.message=function(t){return Ut(zt(t.actual),128)+" "+t.operator+" "+Ut(zt(t.expected),128)}(this),this.generatedMessage=!0);var r=t.stackStartFunction||Bt;if(Error.captureStackTrace)Error.captureStackTrace(this,r);else{var e=new Error;if(e.stack){var n=e.stack,i=Ot(r),o=n.indexOf("\n"+i);if(o>=0){var s=n.indexOf("\n",o+1);n=n.substring(s+1)}this.stack=n}}}function Ut(t,r){return"string"==typeof t?t.length<r?t:t.slice(0,r):t}function zt(t){if(Rt()||!gt(t))return tt(t);var r=Ot(t);return"[Function"+(r?": "+r:"")+"]"}function Bt(t,r,e,n,i){throw new Mt({message:e,actual:t,expected:r,operator:n,stackStartFunction:i})}function It(t,r){t||Bt(t,!0,r,"==",It)}function Yt(t,r,e,n){if(t===r)return!0;if(W(t)&&W(r))return 0===vt(t,r);if(lt(t)&&lt(r))return t.getTime()===r.getTime();if(ht(t)&&ht(r))return t.source===r.source&&t.global===r.global&&t.multiline===r.multiline&&t.lastIndex===r.lastIndex&&t.ignoreCase===r.ignoreCase;if(null!==t&&"object"==typeof t||null!==r&&"object"==typeof r){if(Tt(t)&&Tt(r)&&Pt(t)===Pt(r)&&!(t instanceof Float32Array||t instanceof Float64Array))return 0===vt(new Uint8Array(t.buffer),new Uint8Array(r.buffer));if(W(t)!==W(r))return!1;var i=(n=n||{actual:[],expected:[]}).actual.indexOf(t);return-1!==i&&i===n.expected.indexOf(r)||(n.actual.push(t),n.expected.push(r),function(t,r,e,n){if(null==t||null==r)return!1;if(yt(t)||yt(r))return t===r;if(e&&Object.getPrototypeOf(t)!==Object.getPrototypeOf(r))return!1;var i=Dt(t),o=Dt(r);if(i&&!o||!i&&o)return!1;if(i)return t=At.call(t),r=At.call(r),Yt(t,r,e);var s,u,f=Et(t),a=Et(r);if(f.length!==a.length)return!1;for(f.sort(),a.sort(),u=f.length-1;u>=0;u--)if(f[u]!==a[u])return!1;for(u=f.length-1;u>=0;u--)if(s=f[u],!Yt(t[s],r[s],e,n))return!1;return!0}(t,r,e,n))}return e?t===r:t==r}function Dt(t){return"[object Arguments]"==Object.prototype.toString.call(t)}function Ct(t,r){if(!t||!r)return!1;if("[object RegExp]"==Object.prototype.toString.call(r))return r.test(t);try{if(t instanceof r)return!0}catch(t){}return!Error.isPrototypeOf(r)&&!0===r.call({},t)}function jt(t,r,e,n){var i;if("function"!=typeof r)throw new TypeError('"block" argument must be a function');"string"==typeof e&&(n=e,e=null),i=function(t){var r;try{t()}catch(t){r=t}return r}(r),n=(e&&e.name?" ("+e.name+").":".")+(n?" "+n:"."),t&&!i&&Bt(i,e,"Missing expected exception"+n);var o="string"==typeof n,s=!t&&i&&!e;if((!t&&pt(i)&&o&&Ct(i,e)||s)&&Bt(i,e,"Got unwanted exception"+n),t&&i&&e&&!Ct(i,e)||!t&&i)throw i}function kt(t){if(!(this instanceof kt))return new kt(t);if("object"==typeof t&&Array.isArray(t._buffer)&&"number"==typeof t._capacity&&"number"==typeof t._first&&"number"==typeof t._size)for(var r in t)t.hasOwnProperty(r)&&(this[r]=t[r]);else{if("number"!=typeof t||t%1!=0||t<1)throw new TypeError("Invalid capacity");this._buffer=new Array(t),this._capacity=t,this._first=0,this._size=0}}xt.AssertionError=Mt,X(Mt,Error),xt.fail=Bt,xt.ok=It,xt.equal=function t(r,e,n){r!=e&&Bt(r,e,n,"==",t)},xt.notEqual=function t(r,e,n){r==e&&Bt(r,e,n,"!=",t)},xt.deepEqual=function t(r,e,n){Yt(r,e,!1)||Bt(r,e,n,"deepEqual",t)},xt.deepStrictEqual=function t(r,e,n){Yt(r,e,!0)||Bt(r,e,n,"deepStrictEqual",t)},xt.notDeepEqual=function t(r,e,n){Yt(r,e,!1)&&Bt(r,e,n,"notDeepEqual",t)},xt.notDeepStrictEqual=function t(r,e,n){Yt(r,e,!0)&&Bt(r,e,n,"notDeepStrictEqual",t)},xt.strictEqual=function t(r,e,n){r!==e&&Bt(r,e,n,"===",t)},xt.notStrictEqual=function t(r,e,n){r===e&&Bt(r,e,n,"!==",t)},xt.throws=function(t,r,e){jt(!0,t,r,e)},xt.doesNotThrow=function(t,r,e){jt(!1,t,r,e)},xt.ifError=function(t){if(t)throw t},kt.prototype={size:function(){return this._size},capacity:function(){return this._capacity},enq:function(t){this._first>0?this._first--:this._first=this._capacity-1,this._buffer[this._first]=t,this._size<this._capacity&&this._size++},push:function(t){this._size==this._capacity?(this._buffer[this._first]=t,this._first=(this._first+1)%this._capacity):(this._buffer[(this._first+this._size)%this._capacity]=t,this._size++)},deq:function(){if(0==this._size)throw new RangeError("dequeue on empty buffer");var t=this._buffer[(this._first+this._size-1)%this._capacity];return this._size--,t},pop:function(){return this.deq()},shift:function(){if(0==this._size)throw new RangeError("shift on empty buffer");var t=this._buffer[this._first];return this._first==this._capacity-1?this._first=0:this._first++,this._size--,t},get:function(t,r){if(0==this._size&&0==t&&(null==r||0==r))return[];if("number"!=typeof t||t%1!=0||t<0)throw new TypeError("Invalid start");if(t>=this._size)throw new RangeError("Index past end of buffer: "+t);if(null==r)return this._buffer[(this._first+t)%this._capacity];if("number"!=typeof r||r%1!=0||r<0)throw new TypeError("Invalid end");if(r>=this._size)throw new RangeError("Index past end of buffer: "+r);return this._first+t>=this._capacity&&(t-=this._capacity,r-=this._capacity),this._first+r<this._capacity?this._buffer.slice(this._first+t,this._first+r+1):this._buffer.slice(this._first+t,this._capacity).concat(this._buffer.slice(0,this._first+r+1-this._capacity))},toarray:function(){return 0==this._size?[]:this.get(0,this._size-1)}};var Lt=kt;const Nt=Math.pow(2,32)-1,Ft=t=>t,qt=(t,r=Ft)=>t.reduce((t,e)=>t+r(e),0),$t={power:0,dpower:0},{round:Vt,abs:Ht,log2:Gt,min:Jt,max:Zt}=Math,Wt=Vt(sampleRate/128/200);class Kt{constructor(){this.window=new Float32Array(128*Wt),this.analysis=$t,this.dbMin=-1/0,this.dbMax=0}analyze(t){if(0===t.length)return this.analysis;if(currentFrame&&currentFrame%this.window.length==0){const t=this.normalize(this.window.slice()),r=this.power(t),e=Math.abs(r-this.analysis.power);this.analysis={power:r,dpower:e}}return this.window.set(t,currentFrame%this.window.length),this.analysis}power(t){return t.reduce((t,r)=>t+r,0)/t.length}normalize(t){for(let r=0;r<t.length;r++){let e=Ht(t[r]);e=10*Gt(e),e=this.threshold(e),e=Math.pow(2,e/10),t[r]=e}return t}threshold(t){return this.dbMax===this.dbMin?t===this.dbMax?0:-1/0:((t=Jt(this.dbMax,Zt(this.dbMin,t)))-this.dbMax)/(t-this.dbMin)}}class Qt{constructor(t,r){this.dbMin=t,this.dbMax=r}}Qt.octave=t=>Math.floor(t/12),Qt.chroma=t=>t%12,Qt.f=t=>{const r=Qt.octave(t),e=Qt.chroma(t);return 16.35*Math.pow(2,r)*Math.pow(Math.pow(2,1/12),e)};const Xt=Math.round(1*sampleRate/128),tr=Xt/1*200/60;class rr extends AudioWorkletProcessor{constructor(t){super(t),this.notes=new Array(96),this.impulses=new Lt(Xt),this.onsets=new Lt(Xt),this.chroma=t=>{const r=((t,r=Ft)=>t.length?t.reduce((t,e,n)=>(e=r(e))>t.x?{x:e,arg:n}:t,{x:-Nt,arg:-1}).arg:0)(t);return Qt.chroma(r)*(1/12)+Qt.octave(r)*(1/12/8)},this.onset=t=>{const r=qt(t),e=this.impulses.toarray();var n;return this.impulses.push(r),r>.5*(n=e).slice().sort((t,r)=>t-r)[Math.round(n.length/2)]+.5*((t,r=Ft)=>qt(t,r)/t.length)(e)?1:0};for(let t=0;t<96;t++)this.notes[t]=new Kt}static get parameterDescriptors(){return[{name:"dbMin",maxValue:0},{name:"dbMax",maxValue:0}]}process(t,r,e){t.forEach((t,r)=>{xt.equal(t.length,1,`Expected input ${r} to have exactly 1 channel, not ${t.length}`)});const n=t.map(t=>t[0]),i=e.dbMin[0],o=e.dbMax[0];this.notes.forEach((t,r)=>{t.dbMin=i,t.dbMax=o});const s=this.notes.map((t,r)=>t.analyze(n[r])),u=s.reduce((t,{power:r})=>t+r,0)/96;xt(0<=u&&u<=1,`power: Expected 0 <= ${u} <= 1`);const f=this.chroma(s.map(t=>t.power));xt(0<=f&&f<=1,`chroma: Expected 0 <= ${f} <= 1`);const a=this.onset(s.map(t=>t.dpower));this.onsets.push(a);const h=this.onsets.toarray().reduce((t,r)=>t+r,0),c=Math.min(1,h/tr);return this.port.postMessage({power:u,chroma:f,tempo:c,onset:a}),!0}}registerProcessor("power",rr)}();
//# sourceMappingURL=worklet.js.map
