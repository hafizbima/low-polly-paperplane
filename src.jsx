import React, {useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Canvas, useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {themes, move, biome, wave, collides, sceneryZ, levels, pace} from './game.js';
import './style.css';

const paper = new THREE.BufferGeometry();
paper.setAttribute('position', new THREE.Float32BufferAttribute([
  0,0,-1.5, -1.4,0,1, 0,.28,.65,
  0,0,-1.5, 0,.28,.65, 1.4,0,1,
  0,0,-1.5, 0,-.3,.8, -.25,0,1,
  0,0,-1.5, .25,0,1, 0,-.3,.8
],3)); paper.computeVertexNormals();
const scenery = Array.from({length:48}, (_,i) => ({side:i%2 ? 1:-1,z:16-Math.floor(i/2)*8-Math.sin(i*4.7)*2,x:8+Math.sin(i*2.3)*2,height:3+(Math.sin(i*7.1)+1)*4,width:1.4+(Math.sin(i*3.7)+1)*.7,depth:2+(Math.cos(i*5.3)+1)}));
function Scene({game, theme, finish, update}) {
  const plane = useRef(); const buildings = useRef(); const mountains = useRef(); const blocks = useRef([]); const clock = useRef(0);
  const [transform] = useState(() => new THREE.Object3D());
  useFrame((_, delta) => {
    const g = game.current; const dt = Math.min(delta,.04);
    if (g.status === 'playing' && !g.paused) {
      const {speed, interval} = pace(g.distance,g.level);
      g.distance += speed * dt; g.spawn -= dt;
      if(g.spawn <= 0) { g.obstacles.push(...wave(g.distance,g.level)); g.spawn = interval; }
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
    blocks.current.forEach((mesh,i) => { if(!mesh) return; const o=g.obstacles[i]; mesh.visible=!!o; if(o) mesh.position.set(o.x*2.7,o.y*2+4,o.z); });
    scenery.forEach((s,i) => {
      const z = sceneryZ(s.z,g.distance);
      if(buildings.current) {
        transform.position.set(s.side*s.x,s.height/2,z);
        transform.scale.set(s.width,s.height,s.depth);
        transform.updateMatrix(); buildings.current.setMatrixAt(i,transform.matrix);
      }
      if(mountains.current) {
        transform.position.set(s.side*(s.x+8),s.height*6/7-1,z);
        transform.scale.set(1,s.height/7,1);
        transform.updateMatrix(); mountains.current.setMatrixAt(i,transform.matrix);
      }
    });
    if(buildings.current) buildings.current.instanceMatrix.needsUpdate=true;
    if(mountains.current) mountains.current.instanceMatrix.needsUpdate=true;
  });
  return <>
    <color attach="background" args={[theme.sky]}/><fog attach="fog" args={[theme.sky,28,95]}/>
    <ambientLight intensity={1.8}/><directionalLight position={[8,14,5]} intensity={2.5}/>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.1,-40]}><planeGeometry args={[220,220]}/><meshStandardMaterial color={theme.floor}/></mesh>
    <gridHelper args={[200,40,theme.floor,'#b9baa5']} position={[0,-.08,-40]}/>
    <group>
      <instancedMesh ref={buildings} args={[null,null,48]} frustumCulled={false}><boxGeometry/><meshStandardMaterial color={theme.color} flatShading/></instancedMesh>
      {theme===themes[0] && <><mesh position={[-10,9,-40]}><boxGeometry args={[1,1,120]}/><meshStandardMaterial color="#ece6d5"/></mesh><mesh position={[10,9,-40]}><boxGeometry args={[1,1,120]}/><meshStandardMaterial color="#ece6d5"/></mesh></>}
      {theme===themes[2] && <instancedMesh ref={mountains} args={[null,null,48]} frustumCulled={false}><coneGeometry args={[6,12,4]}/><meshStandardMaterial color="#638b7b" flatShading/></instancedMesh>}
    </group>
    {Array.from({length:60},(_,i)=><mesh key={i} ref={el=>blocks.current[i]=el} visible={false}>
      {theme===themes[2]?<icosahedronGeometry args={[1,0]}/>:<boxGeometry args={[1.75,1.35,1.1]}/>}
      <meshStandardMaterial color={theme===themes[0]?'#985b46':theme===themes[1]?'#c4853e':'#576879'} flatShading/>
    </mesh>)}
    <group ref={plane} position={[0,4,0]}><mesh geometry={paper}><meshStandardMaterial color="#fff9eb" side={THREE.DoubleSide} flatShading/></mesh>
      {[-1,1].map(side=><mesh key={side} position={[side*.85,-.025,2.6]} rotation={[Math.PI/2,0,0]}><planeGeometry args={[.026,3.5]}/><meshBasicMaterial color="#fffaf0" transparent opacity={.35}/></mesh>)}
    </group>
    <mesh position={[0,.01,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[1.2,3]}/><meshBasicMaterial color="#596654" transparent opacity={.17}/></mesh>
  </>;
}
const initial = (level='medium') => ({status:'ready',level,distance:0,x:0,y:0,px:0,py:4,spawn:.4,obstacles:[],paused:false});
function App() {
  const game=useRef(initial()); const touch=useRef(null);
  const [level,setLevel]=useState('medium');
  const [status,setStatus]=useState('ready'); const [distance,setDistance]=useState(0); const [paused,setPaused]=useState(false);
  const [best,setBest]=useState(()=>{try{return Number(localStorage.getItem('paperflight-best'))||0;}catch{return 0;}});
  const theme=themes[biome(distance)];
  const start=()=>{game.current=initial(game.current.level);game.current.status='playing';setDistance(0);setPaused(false);setStatus('playing');};
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
    <div className="chapter"><span className="dot"/> {String(biome(distance)+1).padStart(2,'0')} / {theme.name.toUpperCase()} · {levels[level].name.toUpperCase()}</div>
    {status==='playing' && <><div className="distance"><span>JARAK TERBANG</span><strong>{Math.floor(distance).toLocaleString('id-ID')}<small> m</small></strong></div><button className="pause" onClick={togglePause} aria-label={paused?'Lanjutkan':'Jeda'}>{paused?'▶':'Ⅱ'}</button><div className="grid" aria-label="Posisi pesawat pada grid">{[1,0,-1].flatMap(y=>[-1,0,1].map(x=><i key={`${x}${y}`} className={game.current.x===x&&game.current.y===y?'active':''}/>))}</div></>}
    {(status==='ready'||status==='over') && <section className="intro"><div className="eyebrow">SELEMBAR KERTAS. SEJAUH MUNGKIN.</div><h1>{status==='ready'?<>Little plane.<br/><em>Big adventure.</em></>:<>Penerbangan<br/><em>yang berkesan.</em></>}</h1><p>{status==='ready'?'Terbang, berbelok, dan temukan jalan di antara rintangan. Seberapa jauh kamu bisa melaju?':`Kamu telah terbang ${Math.floor(distance).toLocaleString('id-ID')} meter. Lipat lagi, terbang lebih jauh.`}</p><fieldset className="difficulty"><legend>Tingkat kesulitan</legend><div>{Object.entries(levels).map(([id,setting])=><button key={id} type="button" aria-pressed={level===id} onClick={()=>{game.current.level=id;setLevel(id);}}>{setting.name}</button>)}</div><small>{levels[level].description}</small></fieldset><button className="primary" onClick={start}>{status==='ready'?'Mulai terbang':'Terbang lagi'} <span>↗</span></button><div className="start-note">{status==='ready'?'atau tekan spasi untuk mulai':distance>=best?'REKOR TERBAIKMU ✦':'Petualangan berikutnya menunggu.'}</div></section>}
    {paused&&status==='playing'&&<div className="pause-screen"><h2>Tarik napas dulu.</h2><button className="primary" onClick={togglePause}>Lanjut terbang ↗</button></div>}
    <footer><div className="controls"><span className="keys">← ↑ ↓ →</span><span><b>Ikuti arahmu</b><br/>WASD / tombol arah / swipe</span></div><div className="journey"><span className={biome(distance)===0?'selected':''}>01 KELAS</span><i/><span className={biome(distance)===1?'selected':''}>02 KOTA</span><i/><span className={biome(distance)===2?'selected':''}>03 PEGUNUNGAN</span></div><span className="footer-note">TAKE A LITTLE FLIGHT.</span></footer>
  </main>;
}
createRoot(document.getElementById('root')).render(<App/>);
if(import.meta.env.PROD && 'serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(console.error));


