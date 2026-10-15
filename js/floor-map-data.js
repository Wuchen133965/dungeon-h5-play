'use strict';
// Read-only map summaries. Personal loot stays with its owner; no item rolls or room entry hooks run here.
const floorMapFloorId = () => `${G.act}:${G.chapter}:${G.floor}`;
const floorMapLootKey = room => `${floorMapFloorId()}:${rkey(room.gx, room.gy)}`;
function floorMapSelfActor() {
  return typeof coopRuntimeIsActive === 'function' && coopRuntimeIsActive() ? COOP_RUNTIME.actors.get(COOP.selfId) : null;
}
function floorMapRoomOnFloor(room) {
  return !!(room && G.rooms && (G.rooms.get(rkey(room.gx, room.gy)) === room || G.room === room));
}
function floorMapRoomSummary(room, actor = floorMapSelfActor()) {
  if (!floorMapRoomOnFloor(room) || !room.visited) return null;
  const active = typeof coopRuntimeIsActive === 'function' && coopRuntimeIsActive();
  const current = G.room && room.gx === G.room.gx && room.gy === G.room.gy;
  if (active && !coopRuntimeIsHost() && !current) {
    const map = actor && actor.mapRooms;
    return map && map.floor === floorMapFloorId() && Array.isArray(map.rooms) ?
      map.rooms.find(entry => entry.id === rkey(room.gx, room.gy)) || null : null;
  }
  // Visiting a room creates one personal loot record per actor. Never fall back to another actor's/shared supplies.
  const loot = !active ? room : coopRuntimeIsHost() ? actor && actor.loot && actor.loot.get(floorMapLootKey(room)) :
    actor && actor.context && actor.context.roomLoot;
  const chests = active && current && actor && actor.context ? actor.context.chests : loot && loot.chests;
  const count = (items, used) => Array.isArray(items) ? items.filter(item => !item[used]).length : null;
  let hazards = 0;
  for (const hazard of room.hz || []) { if (hazard.v === 3) hazards |= 1; if (hazard.v === 4) hazards |= 2; }
  const exit = room.stairs ? room.stairs.portal ? lastRegion() ? 'end' : 'next-region' : 'next-floor' :
    !room.cleared && (room.type === 'boss' || room.type === 'stairs') ? 'locked' : '';
  return { id: rkey(room.gx, room.gy), chests: count(chests, 'opened'), goods: loot && Array.isArray(loot.shop) ? count(loot.shop, 'sold') : null,
    fountain: loot && loot.fountain ? !loot.fountain.used : null, altar: loot && loot.altar ? !loot.altar.used : null,
    pond: loot && loot.pond ? Math.max(0, Math.floor(loot.pond.casts || 0)) : null,
    pet: loot && loot.pet ? !loot.pet.petted : null, exit, mech: room.mech || '', hazards };
}
function floorMapActorRooms(actor) {
  const rooms = [];
  for (const room of G.rooms.values()) {
    const summary = floorMapRoomSummary(room, actor);
    if (summary) rooms.push(summary);
  }
  const next = { floor: floorMapFloorId(), rooms }, signature = JSON.stringify(next);
  if (actor.mapRoomsSignature !== signature) {
    actor.mapRoomsSignature = signature; actor.mapRooms = next;
  }
  return actor.mapRooms;
}
function floorMapRoomDetails(room, actor = floorMapSelfActor()) {
  if (!floorMapRoomOnFloor(room) || !room.visited) return null;
  const summary = floorMapRoomSummary(room, actor);
  if (!summary) return { chests: null, goods: null, fountain: null, altar: null, pond: null, pet: null,
    exit: '', mechanic: '', description: '房间状态同步中' };
  let region = null;
  for (const act of ACTS) { region = act.regions.find(candidate => candidate.mech === summary.mech); if (region) break; }
  const special = { mazeArena: ['变幻首领竞技场', '战斗中首领会升起墙壁。'],
    godArena: ['终焉首领竞技场', '战斗中会出现黑暗与虚空坑。'] }[summary.mech];
  const mechanics = [];
  if (summary.hazards & 1) mechanics.push('熔岩池');
  if (summary.hazards & 2) mechanics.push('地刺陷阱');
  if (region && region.mechName) mechanics.push(region.mechName);
  else if (special) mechanics.push(special[0]);
  const purpose = { start: '本层入口，可返回整理装备。', combat: '击败敌人后解除封锁。', treasure: '宝箱房，可领取本次冒险的装备。',
    shop: '旅行商人，用本次冒险的金币购买装备和补给。', shrine: '花费金币强化本次冒险的属性。',
    altar: '献祭生命换取宝物。', fountain: '饮用泉水回复生命，每座泉水限用一次。',
    challenge: '击退两波敌人后获得宝箱。', stairs: '击败守卫后开放下一层。', boss: '击败区域首领后开放出口。',
    pond: '使用剩余抛竿次数垂钓。', pet: '与小动物互动，它会在本层陪伴你。', spring: '站在温泉中静止片刻，洗去异常状态。' }[room.type] || '';
  const exit = { 'next-floor': `前往第 ${G.floor + 1} 层`, 'next-region': `前往${regionOf(G.act, G.chapter + 1)?.name || '下一区域'}`,
    end: '离开地牢，完成本幕', locked: room.type === 'boss' ? '击败首领后开放出口' : '击败守卫后开放楼梯' }[summary.exit] || '';
  return { chests: summary.chests, goods: summary.goods, fountain: summary.fountain, altar: summary.altar, pond: summary.pond, pet: summary.pet,
    exit, mechanic: mechanics.join(' · '), description: [purpose, region && region.mechTip || special && special[1]].filter(Boolean).join(' ') };
}
