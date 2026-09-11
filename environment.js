// Each part is instanced across the same recycled rows; offsets stay together.
const part = (color, scale, offset=[0,0,0], shape='box', motion='') => ({color,scale,offset,shape,motion});
export const environments = [
  [
    part('#af784b',[4,.3,2.8],[0,2.5,0]),
    ...[-1.65,1.65].flatMap(x=>[-1,1].map(z=>part('#575951',[.2,2.4,.2],[x,1.2,z]))),
    part('#3d7069',[1.6,.34,1.15],[-.6,2.82,0]),
    part('#f0e4c6',[1.52,.2,1.1],[-.6,2.82,.04]),
    part('#b65547',[1.4,.3,1],[-.45,3.14,.1]),
    part('#f0e4c6',[1.32,.16,.95],[-.45,3.14,.14]),
    part('#d6a648',[1,.15,.75],[1,2.74,.3]),
    part('#f7f2db',[.95,.025,.7],[.75,3.5,-.3],'box','paper'),
    part('#65817d',[1.35,.16,1.2],[0,1.35,2.25]),
    part('#65817d',[1.35,1.3,.14],[0,2,2.8]),
    ...[-.5,.5].flatMap(x=>[1.8,2.7].map(z=>part('#575951',[.12,1.3,.12],[x,.65,z]))),
    part('#688f88',[.55,.12,.45],[1.15,2.75,-.5]),
    part('#566a62',[.1,.7,.1],[1.15,3.12,-.5]),
    part('#dbb35d',[1,1,.7],[1.15,3.65,-.5],'fan'),
    part('#f0e5be',[.9,.12,.08],[1.15,3.65,-.38],'box','fan'),
    part('#f0e5be',[.12,.9,.08],[1.15,3.65,-.38],'box','fan'),
    part('#b5d3ce',[.08,3.5,3.8],[0,6,-2],'windowWall'),
    part('#fff0c8',[.12,.12,4],[0,6,-2],'windowWall'),
    part('#fff0c8',[.12,3.7,.12],[0,6,-2],'windowWall'),
  ],
  [
    part('#758e97',[3.8,1,4],[0,.5,0],'tower'),
    part('#b1c9c7',[4,.2,4.2],[0,1,0],'roof'),
    ...[.18,.36,.54,.72,.9].flatMap(y=>[-1.1,0,1.1].map(x=>part('#efdfa1',[.55,.65,.035],[x,y,2.02],'window'))),
    part('#e1a254',[1.1,.5,2.3],[0,.55,0],'box','traffic'),
    part('#90bdc6',[.88,.4,1.15],[0,.98,-.1],'box','traffic'),
    ...[-.56,.56].flatMap(x=>[-.72,.72].map(z=>part('#303e43',[.16,.34,.38],[x,.28,z],'box','traffic'))),
    ...[-.35,.35].map(x=>part('#fff2bb',[.2,.15,.08],[x,.57,1.16],'box','traffic')),
    part('#495e63',[.12,5.5,.12],[0,2.75,2]),
    part('#495e63',[1.1,.12,.12],[-.5,5.5,2]),
    part('#fae4a1',[.6,.14,.35],[-.8,5.43,2]),
    part('#ca7057',[1.4,1.1,.16],[0,.8,2.15],'billboard'),
  ],
  [
    part('#715541',[.5,2.6,.5],[0,1.3,0]),
    part('#397354',[2,3.8,2],[0,3.3,0],'cone','wind'),
    part('#5d9167',[1.5,3.2,1.5],[0,4.6,0],'cone','wind'),
    part('#80958a',[7,1,7],[12,.5,-3],'mountain'),
    part('#e4ece4',[2.15,.302,2.15],[12,.851,-3],'snow'),
    part('#f0f3e7',[3.5,1,2],[5,10,-4],'cloud','cloud'),
    part('#e4ece4',[2,1.6,1.7],[6.6,10.2,-4],'cloud','cloud'),
    part('#89958c',[1.3,.75,1.1],[-1,.55,1.5],'cloud'),
  ]
];
export function environmentPart(part, row, z, time=0) {
  const height=9+row.height*1.5;
  const scale=[...part.scale], position=[row.side*(row.x+part.offset[0]),part.offset[1],z+part.offset[2]];
  const rotation=[0,0,0], phase=(row.z??0)*.19;
  if(['tower','roof','window'].includes(part.shape)) {
    position[1]*=height;
    if(part.shape==='tower') scale[1]*=height;
  }
  if(['mountain','snow'].includes(part.shape)) {
    position[1]*=height; scale[1]*=height;
  }
  if(part.shape==='billboard') position[1]*=height;
  if(part.shape==='windowWall') position[0]=row.side*13.75;
  if(part.motion==='wind') {
    const sway=Math.sin(time*1.4+phase)*.07;
    rotation[2]=sway;position[0]-=sway*(position[1]-1.3);
  }
  if(part.motion==='paper') {
    position[1]+=Math.sin(time*2+phase)*.25;position[0]+=Math.cos(time+phase)*.18;
    rotation[0]=Math.sin(time*2+phase)*.3;rotation[2]=Math.cos(time*1.7+phase)*.25;
  }
  if(part.motion==='fan') rotation[2]=time*7+phase;
  if(part.motion==='traffic') position[0]=row.side*(4.25+part.offset[0]);
  if(part.motion==='cloud') position[0]+=Math.sin(time*.17+phase)*2;
  return {scale,position,rotation};
}
