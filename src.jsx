import React, {useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Canvas, useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {themes, move, biome, wave, collides, sceneryZ, levels, pace, obstacleOffset, animationTime} from './game.js';
import './style.css';
import {environments, environmentPart} from './environment.js';
import {obstacleModels, animateObstaclePart} from './obstacle-models.js';

const paper = new THREE.BufferGeometry();
paper.setAttribute('position', new THREE.Float32BufferAttribute([
  0,0,-1.5, -1.4,0,1, 0,.28,.65,
  0,0,-1.5, 0,.28,.65, 1.4,0,1,
  0,0,-1.5, 0,-.3,.8, -.25,0,1,
  0,0,-1.5, .25,0,1, 0,-.3,.8
],3)); paper.computeVertexNormals();
const models = obstacleModels(paper);
const palettes=themes.map(theme=>({sky:new THREE.Color(theme.sky),floor:new THREE.Color(theme.floor)}));
function Obstacles({game}) {
  const meshes=useRef([]);
  const [matrices]=useState(()=>({root:new THREE.Object3D(),part:new THREE.Object3D(),world:new THREE.Matrix4(),counts:new Array(models.length).fill(0)}));
  useFrame(()=>{
    const {root,part,world,counts}=matrices,g=game.current;
    counts.fill(0);
    for(const o of g.obstacles) {
      const model=o.biome*3+o.variant,index=counts[model]++;
      root.position.set(o.x*2.7,o.y*2+4+obstacleOffset(o),o.z);
      root.rotation.z=o.moving?Math.sin((o.z+90)*.13+o.phase)*.12:0;root.updateMatrix();
      models[model].forEach((definition,i)=>{
        const mesh=meshes.current[model]?.[i];if(!mesh)return;
        const pose=animateObstaclePart(definition,g.time,o.phase);
        part.position.set(...pose.position);part.rotation.set(...pose.rotation);part.scale.set(...definition.scale);part.updateMatrix();
        world.multiplyMatrices(root.matrix,part.matrix);mesh.setMatrixAt(index,world);
      });
    }
    models.forEach((model,j)=>model.forEach((_,i)=>{
      const mesh=meshes.current[j]?.[i];if(mesh){mesh.count=counts[j];mesh.instanceMatrix.needsUpdate=true;}
    }));
  });
  return <group dispose={null}>{models.flatMap((model,j)=>model.map((part,i)=><instancedMesh key={`${j}-${i}`} ref={mesh=>{(meshes.current[j]??=[])[i]=mesh;}} args={[part.geometry,part.material,60]} frustumCulled={false}/>))}</group>;
}
const scenery = Array.from({length:48}, (_,i) => ({side:i%2 ? 1:-1,z:16-Math.floor(i/2)*8-Math.sin(i*4.7)*2,x:8+Math.sin(i*2.3)*2,height:3+(Math.sin(i*7.1)+1)*4,width:1.4+(Math.sin(i*3.7)+1)*.7,depth:2+(Math.cos(i*5.3)+1)}));
function Environment({game,theme}) {
  const meshes=useRef([]), markings=useRef(), tiles=useRef();
  const [transform]=useState(()=>new THREE.Object3D());
  const index=themes.indexOf(theme), parts=environments[index];
  useFrame(()=>{
    // Tiles are identical every 2m, so wrapping this uniform grid has no visible jump.
    if(tiles.current) tiles.current.position.z=-40+game.current.distance%2;
    parts.forEach((part,j)=>{
      const mesh=meshes.current[j]; if(!mesh)return;
      scenery.forEach((row,i)=>{
        const travel=game.current.distance+(part.motion==='traffic'?game.current.time*(row.side===1?-6:9):0);
        const {position,scale,rotation}=environmentPart(part,row,sceneryZ(row.z,travel),game.current.time);
        transform.position.set(...position);transform.rotation.set(...rotation);transform.scale.set(...scale);
        if(part.motion==='traffic' && i%3!==0) transform.scale.setScalar(0);
        transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix);
      });
      mesh.instanceMatrix.needsUpdate=true;
    });
    if(markings.current) {
      for(let i=0;i<48;i++) {
        transform.position.set(i%2?1.35:-1.35,.025,sceneryZ(16-Math.floor(i/2)*8,game.current.distance));
        transform.rotation.set(0,0,0);transform.scale.set(.1,.025,3);transform.updateMatrix();markings.current.setMatrixAt(i,transform.matrix);
      }
      markings.current.instanceMatrix.needsUpdate=true;
    }
  });
  return <group>
    {parts.map((part,i)=><instancedMesh key={`${index}-${i}`} ref={mesh=>meshes.current[i]=mesh} args={[null,null,48]} frustumCulled={false}>
      {['cone','mountain','snow'].includes(part.shape)?<coneGeometry args={[1,1,5]}/>:part.shape==='cloud'?<icosahedronGeometry args={[1,0]}/>:part.shape==='fan'?<torusGeometry args={[.5,.06,4,12]}/>:<boxGeometry/>}
      <meshStandardMaterial color={part.color} flatShading/>
    </instancedMesh>)}
    {index===0 && <>
      <gridHelper ref={tiles} args={[200,100,'#bba588','#bba588']} position={[0,-.08,-40]}/>
      {[-1,1].map(side=><group key={side}>
        <mesh position={[side*14,5,-60]}><boxGeometry args={[.3,10,190]}/><meshStandardMaterial color="#e7d8b9"/></mesh>
        <mesh position={[side*13.8,4,-60]}><boxGeometry args={[.05,1,190]}/><meshStandardMaterial color="#588278"/></mesh>
      </group>)}
    </>}
    {index===1 && <>
      <mesh position={[0,-.025,-60]}><boxGeometry args={[11,.1,210]}/><meshStandardMaterial color="#485158"/></mesh>
      {[-1,1].map(side=><group key={side}>
        <mesh position={[side*5.6,.03,-60]}><boxGeometry args={[.22,.18,210]}/><meshStandardMaterial color="#dfdac9"/></mesh>
        <mesh position={[side*4.9,.035,-60]}><boxGeometry args={[.12,.025,210]}/><meshStandardMaterial color="#e7c761"/></mesh>
      </group>)}
      <instancedMesh ref={markings} args={[null,null,48]} frustumCulled={false}><boxGeometry/><meshStandardMaterial color="#f0e8d1"/></instancedMesh>
    </>}
  </group>;
}
function Scene({game, theme, finish, update}) {
  const plane = useRef(); const clock = useRef(0); const ground=useRef();

  useFrame(({scene,camera}, delta) => {
    const g = game.current; const dt = Math.min(delta,.04);
    g.time=animationTime(g,delta);
    const palette=palettes[themes.indexOf(theme)],blend=1-Math.exp(-dt*2);
    scene.background.lerp(palette.sky,blend);scene.fog.color.copy(scene.background);
    ground.current.color.lerp(palette.floor,blend);
    const targetFov=g.status==='playing'?55+Math.min(5,g.distance/400):55;
    camera.fov=THREE.MathUtils.damp(camera.fov,targetFov,2,dt);camera.updateProjectionMatrix();
    if (g.status === 'playing' && !g.paused) {
      const {speed, interval} = pace(g.distance,g.level);
      g.distance += speed * dt; g.spawn -= dt;
      if(g.spawn <= 0) { g.obstacles.push(...wave(g.distance,g.level,Math.random,biome(g.distance+g.startBiome*500))); g.spawn = interval; }
      const tx = g.x*2.7, ty = 4+g.y*2;
      g.px = THREE.MathUtils.damp(g.px,tx,20,dt); g.py = THREE.MathUtils.damp(g.py,ty,20,dt);
      for(const o of g.obstacles) {
        const previous = o.z; o.z += speed*dt;
        if(previous <= 1.1 && o.z >= -1.1 && collides(g.px,g.py,o)) { g.status='crashing'; g.crash=.6; break; }
      }
      g.obstacles = g.obstacles.filter(o => o.z < 8);
      clock.current += dt;
      if(clock.current>.08) { update(g.distance); clock.current=0; }
    } else if(g.status==='crashing' && !g.paused) { g.crash-=dt; if(g.crash<=0) finish(); }
    if(plane.current) {
      plane.current.position.set(g.px,g.py,0);
      plane.current.rotation.z = g.status==='crashing' ? .6-g.crash*4 : -(g.x*2.7-g.px)*.25;
      plane.current.rotation.x = (g.py-(4+g.y*2))*.12;
      plane.current.scale.setScalar(g.status==='crashing' ? Math.max(.2,g.crash/.6) : 1);
    }
  },-1);
  return <>
    <color attach="background" args={[themes[0].sky]}/><fog attach="fog" args={[themes[0].sky,28,95]}/>
    <ambientLight intensity={1.8}/><directionalLight position={[8,14,5]} intensity={2.5}/>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.1,-40]}><planeGeometry args={[220,220]}/><meshStandardMaterial ref={ground} color={themes[0].floor}/></mesh>
    <Environment game={game} theme={theme}/>
    <Obstacles game={game}/>
    <group ref={plane} position={[0,4,0]}><mesh geometry={paper}><meshStandardMaterial color="#fff9eb" side={THREE.DoubleSide} flatShading/></mesh>
      {[-1,1].map(side=><mesh key={side} position={[side*.85,-.025,2.6]} rotation={[Math.PI/2,0,0]}><planeGeometry args={[.026,3.5]}/><meshBasicMaterial color="#fffaf0" transparent opacity={.35}/></mesh>)}
    </group>
    <mesh position={[0,.01,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[1.2,3]}/><meshBasicMaterial color="#596654" transparent opacity={.17}/></mesh>
  </>;
}
const initial = (level='medium',startBiome=0) => ({status:'ready',level,startBiome,time:0,distance:0,x:0,y:0,px:0,py:4,spawn:.4,obstacles:[],paused:false});
function App() {
  const game=useRef(initial()); const touch=useRef(null);
  const [level,setLevel]=useState('medium');
  const [startBiome,setStartBiome]=useState(0);
  const [status,setStatus]=useState('ready'); const [distance,setDistance]=useState(0); const [paused,setPaused]=useState(false);
  const [best,setBest]=useState(()=>{try{return Number(localStorage.getItem('paperflight-best'))||0;}catch{return 0;}});
  const stage=biome(distance+startBiome*500),theme=themes[stage];
  const start=()=>{game.current=initial(game.current.level,game.current.startBiome);game.current.status='playing';setDistance(0);setPaused(false);setStatus('playing');};
  const chooseWorld=index=>{game.current=initial(game.current.level,index);setStartBiome(index);setDistance(0);setPaused(false);setStatus('ready');};
  const finish=()=>{const score=Math.floor(game.current.distance);game.current.status='over';setStatus('over');setDistance(score);setBest(old=>{const next=Math.max(old,score);try{localStorage.setItem('paperflight-best',String(next));}catch{}return next;});};
  const togglePause=()=>{if(game.current.status!=='playing')return;game.current.paused=!game.current.paused;setPaused(game.current.paused);};
  const steer=(dx,dy)=>{const g=game.current;if(g.status!=='playing'||g.paused)return;g.x=move(g.x,dx);g.y=move(g.y,dy);};
  useEffect(()=>{
    const key=e=>{if(e.target instanceof HTMLButtonElement && (e.code==='Space'||e.key==='Enter'))return;const mapping={ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0],ArrowUp:[0,1],w:[0,1],ArrowDown:[0,-1],s:[0,-1]};const dir=mapping[e.key]||mapping[e.key.toLowerCase()];if(dir){e.preventDefault();if(!e.repeat)steer(...dir);}if(e.code==='Space'){e.preventDefault();if(!e.repeat){if(['ready','over'].includes(game.current.status))start();else togglePause();}}if(e.key==='Escape')togglePause();};
    const hidden=()=>{if(document.hidden && game.current.status==='playing'){game.current.paused=true;setPaused(true);}};
    window.addEventListener('keydown',key);document.addEventListener('visibilitychange',hidden);
    return ()=>{window.removeEventListener('keydown',key);document.removeEventListener('visibilitychange',hidden);};
  },[]);
  return <main onPointerDown={e=>{if(e.target.closest('button'))return;touch.current=[e.clientX,e.clientY];}} onPointerUp={e=>{if(!touch.current)return;const dx=e.clientX-touch.current[0],dy=e.clientY-touch.current[1];touch.current=null;if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;Math.abs(dx)>Math.abs(dy)?steer(Math.sign(dx),0):steer(0,-Math.sign(dy));}} onPointerCancel={()=>touch.current=null}>
    <div className="scene"><Canvas dpr={[1,1.5]} camera={{position:[0,8,16],fov:55}} onCreated={({camera})=>camera.lookAt(0,4,-20)}><Scene game={game} theme={theme} finish={finish} update={setDistance}/></Canvas></div>
    <header><a className="brand" href="/" aria-label="Paperflight beranda"><span className="mark">➤</span> paperflight<span className="edition">VOL. 01</span></a><div className="record"><span>REKOR TERBAIK</span><strong>{best.toLocaleString('id-ID')} <small>m</small></strong></div></header>
    <div className="chapter"><span className="dot"/> {String(stage+1).padStart(2,'0')} / {theme.name.toUpperCase()} · {levels[level].name.toUpperCase()}</div>
    {status==='playing' && <><div className="distance"><span>JARAK TERBANG</span><strong>{Math.floor(distance).toLocaleString('id-ID')}<small> m</small></strong></div><button className="pause" onClick={togglePause} aria-label={paused?'Lanjutkan':'Jeda'}>{paused?'▶':'Ⅱ'}</button><div className="grid" aria-label="Posisi pesawat pada grid">{[1,0,-1].flatMap(y=>[-1,0,1].map(x=><i key={`${x}${y}`} className={game.current.x===x&&game.current.y===y?'active':''}/>))}</div></>}
    {(status==='ready'||status==='over') && <section className="intro"><div className="eyebrow">SELEMBAR KERTAS. SEJAUH MUNGKIN.</div><h1>{status==='ready'?<>Little plane.<br/><em>Big adventure.</em></>:<>Penerbangan<br/><em>yang berkesan.</em></>}</h1><p>{status==='ready'?'Terbang, berbelok, dan temukan jalan di antara rintangan. Seberapa jauh kamu bisa melaju?':`Kamu telah terbang ${Math.floor(distance).toLocaleString('id-ID')} meter. Lipat lagi, terbang lebih jauh.`}</p><fieldset className="world-choice"><legend>Mulai petualangan di</legend><div>{["Kelas","Kota","Pegunungan"].map((name,index)=><button key={name} aria-pressed={startBiome===index} onClick={()=>chooseWorld(index)}><span>{["▤","▥","△"][index]}</span>{name}</button>)}</div></fieldset><fieldset className="difficulty"><legend>Tingkat kesulitan</legend><div>{Object.entries(levels).map(([id,setting])=><button key={id} type="button" aria-pressed={level===id} onClick={()=>{game.current.level=id;setLevel(id);}}>{setting.name}</button>)}</div><small>{levels[level].description}</small></fieldset><button className="primary" onClick={start}>{status==='ready'?'Mulai terbang':'Terbang lagi'} <span>↗</span></button><div className="start-note">{status==='ready'?'atau tekan spasi untuk mulai':distance>=best?'REKOR TERBAIKMU ✦':'Petualangan berikutnya menunggu.'}</div></section>}
    {status==="playing" && <div className="stage-progress"><span>Berikutnya: {themes[(stage+1)%3].name}</span><div><i style={{width:`${distance%500/5}%`}}/></div></div>}
    {status==="playing" && distance>=500 && distance%500<55 && <div className="stage-arrival" style={{opacity:Math.min(1,(55-distance%500)/15)}}><small>BABAK BARU</small><strong>{theme.name}</strong></div>}
    {paused&&status==='playing'&&<div className="pause-screen"><h2>Tarik napas dulu.</h2><button className="primary" onClick={togglePause}>Lanjut terbang ↗</button></div>}
    <footer><div className="controls"><span className="keys">← ↑ ↓ →</span><span><b>Ikuti arahmu</b><br/>WASD / tombol arah / swipe</span></div><div className="journey"><span className={stage===0?'selected':''}>01 KELAS</span><i/><span className={stage===1?'selected':''}>02 KOTA</span><i/><span className={stage===2?'selected':''}>03 PEGUNUNGAN</span></div><span className="footer-note">TAKE A LITTLE FLIGHT.</span></footer>
  </main>;
}
createRoot(document.getElementById('root')).render(<App/>);
if(import.meta.env.PROD && 'serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(console.error));


