(self.webpackJsonp=self.webpackJsonp||[]).push([[7],{6:function(e,t,i){"use strict";i.r(t),i.d(t,"Renderer",(function(){return a}));var n=i(42),r=i(18),s=i.n(r);function o(e,t,i){return t in e?Object.defineProperty(e,t,{value:i,enumerable:!0,configurable:!0,writable:!0}):e[t]=i,e}class a{constructor(){o(this,"renderer",void 0),o(this,"scene",void 0),o(this,"camera",void 0),o(this,"points",void 0),o(this,"z",5),o(this,"setSize",()=>{var e=window.innerWidth,t=window.innerHeight,i=e/t;this.renderer.setSize(e,t),this.camera=new n.d(100,i,.01,1e3),this.camera.position.z=this.z}),o(this,"render",()=>{this.renderer.render(this.scene,this.camera)}),o(this,"update",e=>{var{d:t,position:i,color:r}=e,{points:o}=this,a=o.geometry;s.a.equal(i.length%t,0),s.a.equal(r.length%3,0);for(var h=0;h<i.length;h++){var d=i[h];!isNaN(d)&&isFinite(d)||(i[h]=2**32-1,isNaN(d)||(i[h]*=Math.sign(d)),console.warn("found value ".concat(d," at index ").concat(h,"; setting to ").concat(i[h]," for rendering")))}a.setAttribute("position",new n.a(i,t)),a.setAttribute("color",new n.a(r,3));var c=5;if(t>2){a.computeBoundingSphere();var u=a.boundingSphere;c=Math.min(5,u.center.z+u.radius+1)}this.camera.position.z=this.z=c,requestAnimationFrame(this.render)}),this.renderer=new n.i,this.setSize(),window.onresize=()=>{this.setSize(),requestAnimationFrame(this.render)},this.points=new n.e(new n.b,new n.f({vertexColors:n.h,size:.001})),this.scene=new n.g,this.scene.add(this.points)}get domElement(){return this.renderer.domElement}}}}]);
//# sourceMappingURL=7.aa28df5793c0a32e09a9.js.map