import * as THREE from 'three';

const box=new THREE.BoxGeometry(1,1,1), cone=new THREE.ConeGeometry(1,1,6);
const rock=new THREE.IcosahedronGeometry(1,0), diamond=new THREE.OctahedronGeometry(1);
const ring=new THREE.TorusGeometry(.64,.065,4,12);
const wing=new THREE.BufferGeometry();
wing.setAttribute('position',new THREE.Float32BufferAttribute([0,0,-.5, 0,0,.5, 1,0,.35],3));wing.computeVertexNormals();
const leftWing=wing.clone().scale(-1,1,1);
const materials=new Map();
function part(geometry,color,scale,position=[0,0,0],motion='') {
  if(!materials.has(color)) materials.set(color,new THREE.MeshStandardMaterial({color,flatShading:true,side:THREE.DoubleSide}));
  return {geometry,material:materials.get(color),scale,position,motion};
}
export function obstacleModels(paper) {
  return [
    // Open books: two covers and visible cream pages fold in the breeze.
    [part(box,'#bd5d4c',[.8,.13,1.15],[-.4,0,0],'bookLeft'),part(box,'#f8e8b8',[.74,.16,1.06],[-.4,.13,0],'bookLeft'),part(box,'#bd5d4c',[.8,.13,1.15],[.4,0,0],'bookRight'),part(box,'#f8e8b8',[.74,.16,1.06],[.4,.13,0],'bookRight'),part(box,'#784536',[.12,.25,1.2])],
    // A circular fan with rotating blades and a fixed guard.
    [part(ring,'#d3a253',[1,1,1]),part(box,'#e9d7a4',[1.1,.12,.1],[0,0,0],'rotor'),part(box,'#e9d7a4',[.12,1.1,.1],[0,0,0],'rotor'),part(rock,'#6e7e74',[.18,.18,.18])],
    [part(box,'#d8aa48',[1.6,.24,.24],[0,-.25,0],'pencil'),part(cone,'#f1d5a0',[.17,.38,.17],[.85,-.25,0],'pencilTip'),part(box,'#638b86',[1.5,.24,.24],[0,.15,.15],'pencil'),part(cone,'#f1d5a0',[.17,.38,.17],[.8,.15,.15],'pencilTip'),part(box,'#c57260',[.18,.26,.26],[-.76,-.25,0])],
    [part(diamond,'#df7854',[.72,.68,.13]),part(box,'#f2d987',[.035,1.2,.05],[0,0,.14]),part(box,'#f2d987',[1.15,.035,.05],[0,0,.14]),part(box,'#675855',[.035,.38,.035],[0,-.8,0],'tail'),part(diamond,'#d8b35b',[.15,.1,.04],[.07,-.85,0],'tail')],
    [part(rock,'#435a68',[.22,.25,.52]),part(wing,'#587889',[.72,1,1],[.12,0,0],'wingRight'),part(leftWing,'#587889',[.72,1,1],[-.12,0,0],'wingLeft'),part(cone,'#e7b857',[.12,.3,.12],[0,0,-.55],'beak')],
    [part(box,'#d4b86d',[.75,.3,.65]),part(box,'#435665',[1.4,.08,.12]),part(box,'#435665',[.12,.08,1.3]),...[-.6,.6].flatMap(x=>[-.48,.48].map(z=>part(box,'#5c7379',[.42,.045,.1],[x,.14,z],'propeller'))),part(rock,'#8bbec3',[.17,.15,.15],[0,-.08,.35])],
    [part(rock,'#627187',[.7,.52,.62]),part(rock,'#8493a6',[.48,.4,.5],[-.48,.05,0]),part(rock,'#9eabb8',[.42,.34,.4],[.5,.03,0]),part(box,'#edca6b',[.14,.36,.1],[-.06,-.5,.12],'lightning'),part(box,'#edca6b',[.14,.28,.1],[.07,-.68,.12],'lightning')],
    [part(rock,'#755849',[.2,.22,.48]),part(wing,'#a67e57',[.76,1,1.1],[.1,0,0],'wingRight'),part(leftWing,'#a67e57',[.76,1,1.1],[-.1,0,0],'wingLeft'),part(rock,'#eee3ca',[.17,.17,.23],[0,.08,-.38]),part(cone,'#d9aa50',[.1,.25,.1],[0,.03,-.6],'beak')],
    [part(paper,'#d98e59',[.59,.85,.65]),part(box,'#fff1c4',[.05,.04,.9],[0,.09,0]),part(box,'#815f50',[.55,.06,.08],[0,.05,.54])]
  ];
}

export function animateObstaclePart(part,time,phase=0) {
  const position=[...part.position],rotation=[0,0,0];
  const flap=Math.sin(time*6+phase)*.45;
  if(part.motion==='wingRight') rotation[2]=flap;
  if(part.motion==='wingLeft') rotation[2]=-flap;
  if(part.motion==='bookRight' || part.motion==='bookLeft') {
    const sign=part.motion==='bookLeft'?-1:1;
    rotation[2]=sign*(.25+Math.sin(time*2+phase)*.18);
    position[1]+=Math.abs(Math.sin(rotation[2]))*.4;
  }
  if(part.motion==='rotor') rotation[2]=time*8+phase;
  if(part.motion==='propeller') rotation[1]=time*20+phase;
  if(part.motion==='beak') rotation[0]=-Math.PI/2;
  if(part.motion==='pencilTip') rotation[2]=-Math.PI/2;
  if(part.motion==='tail') {position[0]+=Math.sin(time*3+phase)*.08;rotation[2]=Math.sin(time*3+phase)*.18;}
  if(part.motion==='lightning') rotation[2]=-.35;
  return {position,rotation};
}

