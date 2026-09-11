export const themes = [
  { name: 'Ruang kelas', subtitle: 'Petualangan dimulai dari selembar kertas.', sky: '#dedbcd', floor: '#c4b79b', color: '#bc704c' },
  { name: 'Di atas kota', subtitle: 'Lewati atap. Temukan jalanmu.', sky: '#d8e5df', floor: '#93b2aa', color: '#d39458' },
  { name: 'Pegunungan', subtitle: 'Lebih tinggi, lebih jauh.', sky: '#d9e4ed', floor: '#92aea0', color: '#627f91' }
];
export const move = (value, delta) => Math.max(-1, Math.min(1, value + delta));
export const biome = distance => Math.floor(distance / 500) % 3;
export const animationTime = (game, delta) => game.time + (!game.paused && ['ready','playing'].includes(game.status) ? Math.min(delta,.04) : 0);
// Recycle only behind the camera (z=16), back beyond the fog (z=-95).
export const sceneryZ = (start, distance) => 24 - ((24 - start - distance) % 192 + 192) % 192;
export const levels = {
  easy: {name:'Easy', description:'Lebih santai · 3–5 rintangan', count:3, maxCount:5, speed:17, maxSpeed:34, interval:2, minInterval:1.3},
  medium: {name:'Medium', description:'Lebih menantang · 4–7 rintangan', count:4, maxCount:7, speed:22, maxSpeed:42, interval:1.5, minInterval:1},
  hard: {name:'Hard', description:'Refleks cepat · 6–8 rintangan', count:6, maxCount:8, speed:27, maxSpeed:48, interval:1.15, minInterval:.85}
};
export function pace(distance, level) {
  const setting = levels[level];
  return {speed:Math.min(setting.maxSpeed,setting.speed+distance/150), interval:Math.max(setting.minInterval,setting.interval-distance/2000)};
}
export function wave(distance, level = 'easy', random = Math.random, stage = biome(distance)) {
  const setting = levels[level];
  const cells = Array.from({length: 9}, (_, i) => i);
  for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
  const pattern = Math.floor(random()*4), gap = Math.floor(random()*3);
  // Prefer a horizontal, vertical, or diagonal opening; shuffle breaks ties.
  if(pattern<3) cells.sort((a,b)=>{
    const rank=i=>pattern===0?Number(i%3===gap):pattern===1?Number(Math.floor(i/3)===gap):Number((i%3+Math.floor(i/3))%3===gap);
    return rank(a)-rank(b);
  });
  return cells.slice(0, Math.min(setting.maxCount, setting.count + Math.floor(distance / 350))).map(i => ({ x: i % 3 - 1, y: Math.floor(i / 3) - 1, z: -90, biome:stage, variant:Math.floor(random()*3), phase:random()*Math.PI*2, moving:level!=='easy' && random()<.5 }));
}
export function obstacleOffset(obstacle) { return obstacle.moving ? Math.sin((obstacle.z+90)*.13+obstacle.phase)*.3 : 0; }
export function collides(x, y, obstacle) { return Math.abs(x - obstacle.x * 2.7) < 1.1 && Math.abs(y - (obstacle.y * 2 + 4 + obstacleOffset(obstacle))) < 0.9; }
