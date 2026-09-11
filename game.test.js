import {test} from 'node:test';
import assert from 'node:assert/strict';
import {environments, environmentPart} from './environment.js';
import {obstacleModels, animateObstaclePart} from './obstacle-models.js';
import * as THREE from 'three';
import {move, biome, wave, collides, sceneryZ, levels, pace, obstacleOffset, animationTime} from './game.js';
test('grid boundaries, biome milestones, passable unique waves and collisions', () => {
  assert.equal(move(1, 1), 1); assert.equal(move(-1, -1), -1); assert.equal(move(0, 1), 1);
  assert.deepEqual([0,499,500,1000,1500].map(biome), [0,0,1,2,0]);
  for (const distance of [0,500,2000,100000]) {
    const obstacles = wave(distance);
    assert.ok(obstacles.length >= 2 && obstacles.length <= 5);
    assert.equal(new Set(obstacles.map(o => `${o.x},${o.y}`)).size, obstacles.length);
  }
  assert.ok(collides(0,4,{x:0,y:0})); assert.ok(!collides(2.7,4,{x:0,y:0}));
});
test('scenery stays continuous across 7m boundaries and recycles outside view', () => {
  for (const start of [16, -2, -80, -166]) {
    for(let distance=0;distance<2000;distance+=.5) {
      const before=sceneryZ(start,distance), after=sceneryZ(start,distance+.5);
      assert.ok(after>=-168 && after<=24);
      if(after<before) { assert.ok(before>23); assert.ok(after<-167); }
      else assert.ok(Math.abs(after-before-.5)<1e-8);
    }
  }
  assert.ok(Math.abs(sceneryZ(-40,7.01)-sceneryZ(-40,6.99)-.02)<1e-8);
});
test('difficulty increases density and speed while every wave leaves an escape', () => {
  for(const distance of [0,350,1000,100000]) {
    let previousSpeed=0, previousCount=0, previousInterval=Infinity;
    for(const level of Object.keys(levels)) {
      const obstacles=wave(distance,level);
      const {speed,interval}=pace(distance,level);
      assert.ok(obstacles.length>=previousCount && obstacles.length<9);
      assert.equal(new Set(obstacles.map(o=>`${o.x},${o.y}`)).size,obstacles.length);
      assert.ok(speed>previousSpeed && interval<previousInterval);
      // At least 0.85 seconds between waves; four grid moves take about 0.6s.
      assert.ok(interval>=.85);
      assert.ok(Math.ceil(98/speed/interval)*obstacles.length<=60);
      previousSpeed=speed;previousCount=obstacles.length;previousInterval=interval;
    }
  }
});
test('moving obstacles share collision position and never invade empty grid cells', () => {
  let seed=123;
  const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  const variants=new Set();
  for(const distance of [0,500,1000]) for(const level of Object.keys(levels)) {
    const obstacles=wave(distance,level,random);
    for(const o of obstacles) {
      variants.add(`${o.biome}:${o.variant}`);
      assert.equal(o.biome,biome(distance));
      if(level==='easy') assert.equal(o.moving,false);
      for(let z=-90;z<8;z+=.5) {
        o.z=z;
        assert.ok(Math.abs(obstacleOffset(o))<=.3);
        assert.ok(collides(o.x*2.7,o.y*2+4+obstacleOffset(o),o));
        for(let y=-1;y<=1;y++) for(let x=-1;x<=1;x++) {
          if(x!==o.x || y!==o.y) assert.ok(!collides(x*2.7,y*2+4,o));
        }
      }
    }
  }
  assert.equal(variants.size,9);
});
test('environment parts move together, stay grounded and outside the flight lanes',()=>{
  for(const parts of environments) for(const part of parts) for(const side of [-1,1]) {
    const row={side,x:6,height:7};
    const a=environmentPart(part,row,-20),b=environmentPart(part,row,-19.5);
    assert.equal(b.position[2]-a.position[2],.5);
    assert.ok(a.scale.every(n=>Number.isFinite(n)&&n>0));
    assert.ok(a.position[1]-a.scale[1]/2>=-.001);
    if(part.motion==='traffic') {
      assert.ok(a.position[1]+a.scale[1]/2<1.5);
      assert.ok(Math.abs(a.position[0])-a.scale[0]/2>3.5);
    } else assert.ok(Math.abs(a.position[0])-a.scale[0]/2>3.8);
  }
});
test('animations vary over time, pause together, and have valid instance transforms',()=>{
  const state={time:2,status:'playing',paused:false};
  assert.equal(animationTime(state,.02),2.02);
  assert.equal(animationTime({...state,paused:true},.02),2);
  assert.equal(animationTime({...state,status:'over'},.02),2);
  assert.equal(animationTime(state,10),2.04);
  const mountainStart=wave(0,'easy',()=>.4,2);
  assert.equal(mountainStart.length,3);
  assert.ok(mountainStart.every(o=>o.biome===2));
  for(const parts of environments) for(const part of parts) {
    const row={side:1,x:8,height:5,z:-30};
    const a=environmentPart(part,row,-10,0),b=environmentPart(part,row,-10,.2);
    assert.ok([...a.position,...a.rotation,...a.scale,...b.position,...b.rotation].every(Number.isFinite));
    if(['paper','fan','wind','cloud'].includes(part.motion)) assert.notDeepEqual(a,b);
  }
  const models=obstacleModels(new THREE.BufferGeometry());
  assert.equal(models.length,9);
  for(const model of models) for(const part of model) {
    assert.ok(part.scale.every(n=>n>0));
    const before=JSON.stringify(part.position);
    for(const time of [0,.2,10,100]) {
      const pose=animateObstaclePart(part,time,.3);
      assert.ok([...pose.position,...pose.rotation].every(Number.isFinite));
    }
    assert.equal(JSON.stringify(part.position),before);
  }
});
