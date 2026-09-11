import {test} from 'node:test';
import assert from 'node:assert/strict';
import {move, biome, wave, collides, sceneryZ, levels, pace} from './game.js';
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
