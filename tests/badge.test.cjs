const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const site=path.resolve(__dirname,'..');
const {BadgePhysics}=require('../badge.js');
function assertBounds(m){const sin=Math.sin(m.angle),cos=Math.cos(m.angle);for(const[x,y]of [[-m.cardWidth/2,28],[m.cardWidth/2,28],[-m.cardWidth/2,m.cardHeight+28],[m.cardWidth/2,m.cardHeight+28],[-18,-78],[18,-78]]){const px=m.x+x*cos-y*sin,py=m.y+x*sin+y*cos;assert(px>=11.99&&px<=m.width-11.99,`Horizontal overflow ${px}/${m.width}`);assert(py>=39.99&&py<=m.height-63.99,`Vertical overflow ${py}/${m.height}`)}for(const key of ['x','y','vx','vy','angle'])assert(Number.isFinite(m[key]),key)}
for(const[w,h,cw,ch]of [[460,800,260,385],[460,700,250,385],[340,640,250,385],[340,760,240,385],[272,760,216,385],[720,800,260,385],[272,640,216,385]]){
 const m=new BadgePhysics(w,h,cw,ch);assertBounds(m);
 for(const[dx,dy]of [[-40,0],[40,0],[0,-40],[0,40]]){
  m.reset();const startX=m.x,startY=m.y;m.drag(startX+dx,startY+dy,1/60);assertBounds(m);
  assert(dx?Math.sign(dx)*(m.x-startX)>4:Math.sign(dy)*(m.y-startY)>4,'Room to pull in every direction');
 }
 for(const[x,y]of [[-300,-200],[900,1000],[w*.8,150],[w*.2,100]]){m.drag(x,y,1/60);m.angle=m.maxAngle; m.constrain();assertBounds(m);let settled=false;for(let i=0;i<1800;i++){const active=m.step(1/60);assertBounds(m);if(!active){settled=true;break}}assert(settled,'Badge must settle');assert(Math.abs(m.x-m.anchor.x)<.4)}
 m.resize(w,h,cw,ch);assert.equal(m.vx,0);assert.equal(m.angle,0);
}
console.log('PASS physics: extreme drags remain inside desktop/tablet/mobile hero bounds, gravity and damping settle, resize resets safely.');
// A vertical release should visibly rebound more than once, then lose energy.
{
 const m=new BadgePhysics(460,800,250,385),rest=m.y;
 m.y+=30;m.constrain();let previous=m.y-rest,crossings=0,latePeak=0;
 for(let i=0;i<360;i++){m.step(1/60);assertBounds(m);const offset=m.y-rest;if(offset*previous<0&&Math.abs(previous)>.01)crossings++;previous=offset;if(i>300)latePeak=Math.max(latePeak,Math.abs(offset));}
 assert(crossings>=3,'Release must produce repeated elastic rebounds');
 assert(latePeak<1,'Rebounds must damp down rather than continue indefinitely');
 console.log('PASS bounce: repeated vertical rebounds decay to less than one pixel.');
}
function setup(reduced=false){
 const callbacks={},windowEvents={},docEvents={},frames=new Map();let now=1000,frameID=0;
 function element(){return {style:{},attrs:{},classList:{add:k=>callbacks['class:'+k]=true,remove:k=>delete callbacks['class:'+k]},setAttribute(k,v){this.attrs[k]=v},addEventListener(k,f){this.events[k]=f},events:{},focus(){this.focused=true}}}
 const stage=element();stage.clientWidth=340;stage.clientHeight=760;stage.getBoundingClientRect=()=>({left:20,top:100});
 const card=element();card.offsetWidth=240;card.offsetHeight=385;card.capture=null;card.setPointerCapture=id=>card.capture=id;card.hasPointerCapture=id=>card.capture===id;card.releasePointerCapture=()=>card.capture=null;
 const rope=element(),paths=[element(),element(),element()];const els={'#badge-scene':stage,'#id-badge':card,'#badge-lanyard':rope,'#lanyard-edge':paths[0],'#lanyard-fabric':paths[1],'#lanyard-stitch':paths[2]};const media={matches:reduced,addEventListener:(_,f)=>callbacks.motion=f};const doc={hidden:false,querySelector:s=>els[s]||(els[s]=element()),addEventListener:(k,f)=>docEvents[k]=f};
 vm.runInNewContext(fs.readFileSync(path.join(site,'badge.js'),'utf8'),{document:doc,window:{matchMedia:()=>media,addEventListener:(k,f)=>windowEvents[k]=f},performance:{now:()=>now},requestAnimationFrame:f=>{frames.set(++frameID,f);return frameID},cancelAnimationFrame:id=>frames.delete(id),ResizeObserver:class{constructor(f){callbacks.resize=f}observe(){}},Math});
 const event=(x,y,id=1,type='mouse')=>({pointerId:id,pointerType:type,isPrimary:true,button:0,clientX:x,clientY:y,preventDefault(){this.prevented=true}});
 return {card,paths,frames,media,doc,callbacks,windowEvents,docEvents,els,event,tick(ms=16.67){now+=ms;for(const[id,f]of [...frames]){frames.delete(id);f(now)}},advance(ms=16){now+=ms}};
}
for(const type of ['mouse','touch']){
 const s=setup();const initial=s.card.style.transform;const upperLeft=s.paths[0].attrs.d.split(' Q')[0];const upperRight=s.els['#lanyard-right-fabric'].attrs.d.split(' ').slice(-2).join(' ');assert.equal(upperLeft,'M20 -12');assert.equal(upperRight,'320 -12');const initialBuckle=s.els['#lanyard-buckle'].attrs.transform;assert.equal(s.frames.size,0,'No idle animation');
 const down=s.event(170,280,1,type);down.target={tagName:'IMG'};s.card.events.pointerdown(down);assert(down.prevented);assert.equal(s.card.capture,1);assert(s.card.focused);
 s.advance();const move=s.event(210,300,1,type);move.target={tagName:'P'};s.card.events.pointermove(move);assert.notEqual(s.card.style.transform,initial,'Dragging photo/text moves entire card');const moved=s.card.style.transform;assert(s.paths[0].attrs.d.includes(' Q'),'Strap bends');assert.equal(s.paths[0].attrs.d.split(' Q')[0],upperLeft,'Upper-left end stays anchored');assert.equal(s.els['#lanyard-right-fabric'].attrs.d.split(' ').slice(-2).join(' '),upperRight,'Upper-right end stays anchored');assert.notEqual(s.els['#lanyard-buckle'].attrs.transform,initialBuckle,'Buckle follows card');assert(s.els['#lanyard-right-fabric'].attrs.d.includes(' Q'),'Second strap bends');assert(s.els['#lanyard-tail-fabric'].attrs.d.includes(' Q'),'Lower connector bends');
 s.card.events.pointermove(s.event(50,100,2,type));assert.equal(s.card.style.transform,moved,'Other pointers ignored');
 s.card.events.pointerup(s.event(210,300,1,type));assert.equal(s.card.capture,null);assert(s.frames.size>0,'Release starts swing');assert.equal(s.card.style.transform,moved,'No jump at release');for(let i=0;i<1800&&s.frames.size;i++)s.tick();assert.equal(s.frames.size,0,'Animation stops after settling');
 s.card.events.pointerdown(s.event(170,280,1,type));s.card.events.pointercancel(s.event(170,280,1,type));assert.equal(s.card.capture,null);s.windowEvents.blur();assert.equal(s.frames.size,0);
}
const reduced=setup(true);reduced.card.events.pointerdown(reduced.event(170,280));reduced.advance();reduced.card.events.pointermove(reduced.event(190,300));reduced.card.events.pointerup(reduced.event(190,300));assert.equal(reduced.frames.size,0,'Reduced motion has no release/idle animation');
const keyboard=setup();keyboard.card.events.keydown({key:'ArrowRight',preventDefault(){}});assert(keyboard.frames.size);keyboard.card.events.keydown({key:'Home',preventDefault(){}});keyboard.windowEvents.blur();assert.equal(keyboard.frames.size,0);keyboard.callbacks.resize();assert.equal(keyboard.card.capture,null);
const css=fs.readFileSync(path.join(site,'style.css'),'utf8');assert(css.includes('touch-action:pan-y'));assert(css.includes('touch-action:none;user-select:none'));assert(css.includes('overflow:clip'));console.log('PASS controller: entire-card mouse/touch drag, capture, secondary pointer rejection, smooth release, cancelled gestures, idle stop, reduced motion, keyboard reset, blur and resize. Touch and rendering checks simulated; no browser gesture verification.');
