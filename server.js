const http = require('http');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 8080;

const HTML = `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>小鱼联机 RPG</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;background:#141a24;color:#e8eef7;font-family:system-ui,sans-serif;display:flex;justify-content:center;padding:10px}
  #app{width:100%;max-width:560px;display:flex;flex-direction:column;gap:8px}
  h1{font-size:17px;margin:0;color:#8fd3ff}
  #join{display:flex;gap:8px}
  input{flex:1;padding:10px;border-radius:8px;border:1px solid #33405a;background:#101720;color:#e8eef7}
  button{padding:9px 12px;border:0;border-radius:9px;background:#2c7be5;color:#fff;font-size:13px}
  button:disabled{opacity:.32}
  button.alt{background:#3a4557}
  button.buy{background:#8a5cf6}
  .card{background:#1d2531;border-radius:9px;padding:8px 10px;font-size:12px;line-height:1.55;margin-bottom:5px}
  .card.me{outline:1px solid #2c7be5}
  .card.down{opacity:.42}
  #enemy{background:#1d2531;border-radius:9px;padding:9px 10px;font-size:13px}
  #enemy.boss{outline:1px solid #e05c5c}
  #log{min-height:110px;max-height:170px;background:#0f141c;border-radius:9px;padding:9px;font-size:12px;line-height:1.55;overflow-y:auto}
  #log p{margin:0 0 3px}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
  .grid button{font-size:12px;padding:8px 4px}
  .row{display:flex;gap:6px}
  .row button{flex:1}
  #hint{font-size:11px;opacity:.65}
</style>
</head>
<body>
<div id="app">
  <h1>小鱼联机 RPG</h1>
  <div id="join">
    <input id="room" placeholder="房间号" value="fish">
    <button id="connect">进入</button>
  </div>
  <div id="players"></div>
  <div id="enemy">未连接</div>
  <div id="log"></div>
  <div id="hint"></div>
  <div class="row">
    <button id="attack" disabled>普通攻击</button>
    <button id="potion" class="alt" disabled>喝药</button>
    <button id="restart" class="alt" disabled>重开</button>
  </div>
  <div class="grid" id="skills"></div>
  <div class="grid" id="shop"></div>
</div>
<script>
const $ = (id) => document.getElementById(id);
const roomEl = $('room'), connectBtn = $('connect');
const playersEl = $('players'), enemyEl = $('enemy'), logEl = $('log'), hintEl = $('hint');
const atkBtn = $('attack'), potionBtn = $('potion'), restartBtn = $('restart');
const skillsEl = $('skills'), shopEl = $('shop');

let ws = null;
let mySeat = -1;

function connect() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(proto + '//' + location.host);
  ws.onopen = () => {
    connectBtn.disabled = true;
    ws.send(JSON.stringify({ type: 'join', room: roomEl.value.trim() || 'fish' }));
  };
  ws.onmessage = (ev) => handle(JSON.parse(ev.data));
  ws.onclose = () => { connectBtn.disabled = false; hintEl.textContent = '连接断开了。'; };
}

function handle(data) {
  if (data.type === 'seat') { mySeat = data.seat; hintEl.textContent = '你是 ' + (mySeat + 1) + 'P'; return; }
  if (data.type === 'error') { hintEl.textContent = data.message; connectBtn.disabled = false; return; }
  if (data.type !== 'state') return;

  const me = data.players.find((p) => p.seat === mySeat);

  playersEl.innerHTML = '';
  data.players.forEach((p) => {
    const d = document.createElement('div');
    d.className = 'card' + (p.seat === mySeat ? ' me' : '') + (p.hp <= 0 ? ' down' : '');
    d.innerHTML = '<b>' + p.name + '</b>' + (p.seat === mySeat ? '（你）' : '') +
      ' · Lv' + p.lv +
      '<br>生命 ' + p.hp + '/' + p.max + ' · 攻击 ' + p.atk +
      ' · 金币 ' + p.gold + ' · 药 ' + p.potions +
      (p.weapon || p.armor ? '　武器+' + (p.weapon * 3) + ' 护甲+' + (p.armor * 12) : '');
    playersEl.appendChild(d);
  });

  enemyEl.className = data.enemy && data.enemy.boss ? 'boss' : '';
  enemyEl.textContent = data.enemy
    ? '敌人：' + data.enemy.name + (data.enemy.boss ? '（BOSS）' : '') +
      ' · ' + Math.max(0, data.enemy.hp) + '/' + data.enemy.max + ' HP'
    : (data.win ? '通关了！' : '敌人：无');
  hintEl.textContent = '已击杀 ' + data.kills + ' 只，' + data.bossAt + ' 只后 BOSS 出现' + (data.over ? ' · 本局结束' : '');

  logEl.innerHTML = '';
  data.logs.slice(-14).forEach((t) => {
    const p = document.createElement('p');
    p.textContent = t;
    logEl.appendChild(p);
  });
  logEl.scrollTop = logEl.scrollHeight;

  const alive = me && me.hp > 0 && !data.over;
  atkBtn.disabled = !alive;
  potionBtn.disabled = !alive || me.potions <= 0;
  potionBtn.textContent = '喝药（' + (me ? me.potions : 0) + '）';
  restartBtn.disabled = false;

  skillsEl.innerHTML = '';
  (me ? me.skills : []).forEach((s, i) => {
    const b = document.createElement('button');
    b.className = 'alt';
    const locked = me.lv < s.unlock;
    const cd = me.cds[i];
    b.textContent = s.name + (locked ? '(Lv' + s.unlock + ')' : cd > 0 ? '(' + cd + ')' : '');
    b.disabled = !alive || locked || cd > 0;
    b.onclick = () => ws.send(JSON.stringify({ type: 'skill', index: i }));
    skillsEl.appendChild(b);
  });

  shopEl.innerHTML = '';
  const items = [
    { id: 'potion', text: '买药 ' + data.shop.potion },
    { id: 'weapon', text: '强化武器 ' + data.shop.weapon },
    { id: 'armor', text: '强化护甲 ' + data.shop.armor }
  ];
  items.forEach((it) => {
    const b = document.createElement('button');
    b.className = 'buy';
    b.textContent = it.text;
    b.disabled = !me || me.gold < (it.id === 'potion' ? data.shop.potion : it.id === 'weapon' ? data.shop.weapon : data.shop.armor);
    b.onclick = () => ws.send(JSON.stringify({ type: 'buy', item: it.id }));
    shopEl.appendChild(b);
  });
}

connectBtn.onclick = connect;
atkBtn.onclick = () => ws.send(JSON.stringify({ type: 'attack' }));
potionBtn.onclick = () => ws.send(JSON.stringify({ type: 'potion' }));
restartBtn.onclick = () => ws.send(JSON.stringify({ type: 'restart' }));
</script>
</body>
</html>
`;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(HTML);
});

const wss = new WebSocketServer({ server });
const rooms = new Map();

const MAX_PLAYERS = 4;
const BOSS_AT_KILLS = 12;

const CLASSES = {
  warrior: {
    name: '战士', hp: 52, atk: 6, crit: 0.1,
    skills: [
      { name: '重斩', cd: 3, mult: 2.2 },
      { name: '盾击', cd: 5, mult: 1.4, stun: true },
      { name: '自愈', cd: 4, heal: 0.3 },
      { name: '怒吼', cd: 6, buffAtk: 0.3, buffTurns: 3 },
      { name: '斩杀', cd: 7, mult: 3.4 }
    ]
  },
  mage: {
    name: '法师', hp: 34, atk: 9, crit: 0.08,
    skills: [
      { name: '火球', cd: 2, mult: 2.5 },
      { name: '冰霜', cd: 5, mult: 1.8, stun: true },
      { name: '吸血', cd: 3, mult: 1.4, lifesteal: 0.6 },
      { name: '复活', cd: 8, revive: 0.5 },
      { name: '陨石', cd: 8, mult: 4.2 }
    ]
  },
  ranger: {
    name: '游侠', hp: 38, atk: 7, crit: 0.3,
    skills: [
      { name: '连射', cd: 2, mult: 1.1, hits: 3 },
      { name: '陷阱', cd: 5, mult: 2.4, stun: true },
      { name: '急救', cd: 4, heal: 0.25, sureCrit: true },
      { name: '毒箭', cd: 4, mult: 3.0 },
      { name: '替身', cd: 7, dodge: true }
    ]
  },
  priest: {
    name: '牧师', hp: 40, atk: 5, crit: 0.05,
    skills: [
      { name: '治疗', cd: 2, heal: 0.35, target: 'ally' },
      { name: '群疗', cd: 5, healTeam: 0.2 },
      { name: '圣光', cd: 3, mult: 2.2 },
      { name: '复活', cd: 7, revive: 0.45 },
      { name: '祈祷', cd: 8, healTeam: 0.35, buffAtk: 0.2, buffTurns: 2 }
    ]
  }
};

const SEATS = ['warrior', 'mage', 'ranger', 'priest'];

const POOL = [
  { name: '史莱姆', hp: 16, atk: 3, gold: 8 },
  { name: '野狼', hp: 24, atk: 4, gold: 12 },
  { name: '骷髅兵', hp: 32, atk: 5, gold: 18 },
  { name: '强盗', hp: 40, atk: 6, gold: 24 },
  { name: '沼泽巨蜥', hp: 54, atk: 7, gold: 32 },
  { name: '石像鬼', hp: 66, atk: 8, gold: 40 }
];

const BOSS = { name: '灰烬王·终焉', hp: 420, atk: 13, gold: 300 };

const SHOP = {
  potion: { name: '药水', price: 15 },
  weapon: { name: '武器强化', base: 60 },
  armor: { name: '护甲强化', base: 50 }
};

function newPlayer(seat) {
  const c = CLASSES[SEATS[seat]];
  return {
    seat,
    cls: SEATS[seat],
    name: (seat + 1) + 'P ' + c.name,
    lv: 1, exp: 0, need: 12,
    hp: c.hp, max: c.hp,
    atk: c.atk,
    crit: c.crit,
    weapon: 0,
    armor: 0,
    potions: 3,
    gold: 0,
    cds: [0, 0, 0, 0, 0],
    buff: 0,
    buffTurns: 0,
    dodge: false,
    alive: true
  };
}

function weaponBonus(p) { return p.weapon * 3; }
function armorBonus(p) { return p.armor * 12; }
function realAtk(p) { return p.atk + weaponBonus(p) + (p.buffTurns > 0 ? Math.round(p.atk * p.buff) : 0); }

function createRoom(id) {
  const room = {
    id,
    seats: new Array(MAX_PLAYERS).fill(null),
    players: new Array(MAX_PLAYERS).fill(null),
    enemy: null,
    kills: 0,
    over: false,
    win: false,
    logs: []
  };
  spawnEnemy(room);
  rooms.set(id, room);
  return room;
}

function pushLog(room, text) {
  room.logs.push(text);
  if (room.logs.length > 80) room.logs.shift();
}

function makeEnemy(room) {
  const count = room.players.filter(Boolean).length || 1;
  if (room.kills >= BOSS_AT_KILLS && !room.win) {
    const bonus = Math.max(0, count - 2) * 120;
    return {
      name: BOSS.name, hp: BOSS.hp + bonus, max: BOSS.hp + bonus,
      atk: BOSS.atk, gold: BOSS.gold, boss: true
    };
  }
  const tier = Math.min(POOL.length - 1, Math.floor(room.kills / 2));
  const b = POOL[tier];
  const bonus = Math.max(0, count - 2) * 0.5;
  return {
    name: b.name,
    hp: Math.round(b.hp * (1 + bonus)),
    max: Math.round(b.hp * (1 + bonus)),
    atk: b.atk, gold: b.gold, boss: false
  };
}

function spawnEnemy(room) {
  room.enemy = makeEnemy(room);
  pushLog(room, room.enemy.name + ' 出现了！' + (room.enemy.boss ? '（最终 BOSS）' : ''));
}

function alivePlayers(room) {
  return room.players.filter((p) => p && p.hp > 0);
}

function checkOver(room) {
  if (alivePlayers(room).length === 0) {
    room.over = true;
    pushLog(room, '全员倒下……点「重开」再战。');
    return true;
  }
  return false;
}

function tickBuff(p) {
  if (p.buffTurns > 0) {
    p.buffTurns--;
    if (p.buffTurns === 0) p.buff = 0;
  }
}

function enemyTurn(room) {
  if (!room.enemy || room.over) return;
  const alive = alivePlayers(room);
  if (!alive.length) return;
  const t = alive[Math.floor(Math.random() * alive.length)];

  if (t.dodge) {
    t.dodge = false;
    pushLog(room, t.name + ' 用替身躲开了攻击。');
    return;
  }

  const dmg = Math.max(1, room.enemy.atk + Math.floor(Math.random() * 3) - 1);
  t.hp = Math.max(0, t.hp - dmg);
  pushLog(room, room.enemy.name + ' 攻击 ' + t.name + '，造成 ' + dmg + ' 点伤害。');
  checkOver(room);
}

function gainExp(room, p, amount) {
  p.exp += amount;
  while (p.exp >= p.need) {
    p.exp -= p.need;
    p.lv++;
    p.need = Math.round(p.need * 1.45);
    p.atk += 2;
    p.max = CLASSES[p.cls].hp + armorBonus(p) + (p.lv - 1) * 6;
    p.hp = p.max;
    pushLog(room, p.name + ' 升到 ' + p.lv + ' 级，攻击 +2，血回满。');
    const unlockAt = [2, 4, 6, 8, 10];
    const idx = unlockAt.indexOf(p.lv);
    if (idx >= 0) pushLog(room, p.name + ' 解锁技能：' + CLASSES[p.cls].skills[idx].name + '。');
  }
}

function hitEnemy(room, p, dmg) {
  if (!room.enemy) return false;
  room.enemy.hp -= dmg;
  if (room.enemy.hp > 0) return false;

  const wasBoss = room.enemy.boss;
  room.kills++;
  const gold = room.enemy.gold;
  p.gold += gold;
  pushLog(room, room.enemy.name + ' 被打倒了，' + p.name + ' 获得 ' + gold + ' 金币。');
  gainExp(room, p, 8 + room.kills * 3);

  if (wasBoss) {
    room.win = true;
    room.over = true;
    room.enemy = null;
    pushLog(room, '★ 灰烬王被击败，你们通关了！');
    return true;
  }

  spawnEnemy(room);
  return true;
}

function applySkill(room, p, sk) {
  if (sk.revive) {
    const downed = room.players.filter((x) => x && x.hp <= 0);
    if (!downed.length) {
      pushLog(room, p.name + ' 想复活队友，可没人倒下。');
      return;
    }
    const target = downed[0];
    target.hp = Math.round(target.max * sk.revive);
    pushLog(room, p.name + ' 用' + sk.name + '救起了 ' + target.name + '（' + target.hp + ' HP）。');
    return;
  }

  if (sk.healTeam) {
    room.players.forEach((x) => {
      if (x && x.hp > 0) x.hp = Math.min(x.max, x.hp + Math.round(x.max * sk.healTeam));
    });
    pushLog(room, p.name + ' 使用' + sk.name + '，全队回血。');
  } else if (sk.heal && sk.target === 'ally') {
    const target = alivePlayers(room).sort((a, b) => a.hp / a.max - b.hp / b.max)[0] || p;
    target.hp = Math.min(target.max, target.hp + Math.round(target.max * sk.heal));
    pushLog(room, p.name + ' 治疗了 ' + target.name + '。');
  } else if (sk.heal && !sk.mult) {
    p.hp = Math.min(p.max, p.hp + Math.round(p.max * sk.heal));
    pushLog(room, p.name + ' 使用' + sk.name + '，回复生命。');
  }

  if (sk.buffAtk) {
    p.buff = sk.buffAtk;
    p.buffTurns = sk.buffTurns || 2;
    pushLog(room, p.name + ' 攻击力提升。');
  }

  if (sk.dodge) {
    p.dodge = true;
    pushLog(room, p.name + ' 准备替身。');
  }

  if (sk.sureCrit) p.sureCrit = true;

  if (sk.mult) {
    let total = 0;
    const hits = sk.hits || 1;
    for (let i = 0; i < hits; i++) {
      let d = Math.max(1, realAtk(p) + Math.floor(Math.random() * 3) - 1) * sk.mult;
      if (p.sureCrit || Math.random() < p.crit) { d *= 2; p.sureCrit = false; }
      total += Math.round(d);
    }
    pushLog(room, p.name + ' 使用' + sk.name + '，造成 ' + total + ' 点伤害。');
    if (sk.lifesteal) {
      p.hp = Math.min(p.max, p.hp + Math.round(total * sk.lifesteal));
    }
    if (sk.stun) room.enemy.stunned = true;

    if (!hitEnemy(room, p, total)) {
      if (!room.enemy.stunned) enemyTurn(room);
      else {
        room.enemy.stunned = false;
        pushLog(room, room.enemy.name + ' 被控住，这回合动不了。');
      }
    }
  }
}

function act(room, seat, type, index) {
  if (room.over) return;
  const p = room.players[seat];
  if (!p || p.hp <= 0) return;

  if (type === 'attack') {
    let d = Math.max(1, realAtk(p) + Math.floor(Math.random() * 3) - 1);
    if (Math.random() < p.crit) d *= 2;
    pushLog(room, p.name + ' 攻击，造成 ' + d + ' 点伤害。');
    if (!hitEnemy(room, p, d)) enemyTurn(room);
  } else if (type === 'skill') {
    const sk = CLASSES[p.cls].skills[index];
    if (!sk) return;
    const unlockAt = [2, 4, 6, 8, 10];
    if (p.lv < unlockAt[index] || p.cds[index] > 0) return;
    p.cds[index] = sk.cd;
    applySkill(room, p, sk);
  }

  p.cds = p.cds.map((c) => Math.max(0, c - 1));
  tickBuff(p);
}

function buy(room, seat, item) {
  const p = room.players[seat];
  if (!p) return;
  if (item === 'potion') {
    if (p.gold < SHOP.potion.price) { pushLog(room, p.name + ' 金币不够。'); return; }
    p.gold -= SHOP.potion.price;
    p.potions++;
    pushLog(room, p.name + ' 买了一瓶药。');
  } else if (item === 'weapon') {
    const price = SHOP.weapon.base * (p.weapon + 1);
    if (p.gold < price) { pushLog(room, p.name + ' 金币不够。'); return; }
    p.gold -= price;
    p.weapon++;
    pushLog(room, p.name + ' 强化了武器，攻击 +3。');
  } else if (item === 'armor') {
    const price = SHOP.armor.base * (p.armor + 1);
    if (p.gold < price) { pushLog(room, p.name + ' 金币不够。'); return; }
    p.gold -= price;
    p.armor++;
    p.max = CLASSES[p.cls].hp + armorBonus(p) + (p.lv - 1) * 6;
    p.hp = Math.min(p.max, p.hp + 12);
    pushLog(room, p.name + ' 强化了护甲，生命 +12。');
  }
}

function usePotion(room, seat) {
  const p = room.players[seat];
  if (!p || p.potions <= 0) return;
  p.potions--;
  p.hp = Math.min(p.max, p.hp + Math.round(p.max * 0.4));
  pushLog(room, p.name + ' 喝了一瓶药。');
  enemyTurn(room);
}

function restart(room) {
  room.players.forEach((p) => {
    if (!p) return;
    Object.assign(p, newPlayer(p.seat));
  });
  room.kills = 0;
  room.over = false;
  room.win = false;
  room.logs = [];
  spawnEnemy(room);
}

function snapshot(room, seat) {
  return {
    type: 'state',
    seat,
    players: room.players.filter(Boolean).map((p) => ({
      seat: p.seat,
      name: p.name,
      cls: p.cls,
      clsName: CLASSES[p.cls].name,
      lv: p.lv,
      hp: p.hp,
      max: p.max,
      atk: realAtk(p),
      gold: p.gold,
      potions: p.potions,
      weapon: p.weapon,
      armor: p.armor,
      cds: p.cds,
      skills: CLASSES[p.cls].skills.map((s, i) => ({ name: s.name, unlock: [2, 4, 6, 8, 10][i] }))
    })),
    enemy: room.enemy,
    kills: room.kills,
    bossAt: BOSS_AT_KILLS,
    over: room.over,
    win: room.win,
    logs: room.logs,
    shop: {
      potion: SHOP.potion.price,
      weapon: SHOP.weapon.base * ((room.players[seat] ? room.players[seat].weapon : 0) + 1),
      armor: SHOP.armor.base * ((room.players[seat] ? room.players[seat].armor : 0) + 1)
    }
  };
}

function broadcast(room) {
  room.seats.forEach((ws, i) => {
    if (ws && ws.readyState === 1) ws.send(JSON.stringify(snapshot(room, i)));
  });
}

wss.on('connection', (ws) => {
  ws.roomId = null;
  ws.seat = -1;

  ws.on('message', (raw) => {
    let data;
    try {
      data = JSON.parse(raw.toString());
    } catch (e) {
      return;
    }

    if (data.type === 'join') {
      const id = String(data.room || 'fish').slice(0, 24);
      let room = rooms.get(id);
      if (!room) room = createRoom(id);

      const seat = room.seats.indexOf(null);
      if (seat < 0) {
        ws.send(JSON.stringify({ type: 'error', message: '房间满了（最多 4 人）' }));
        return;
      }

      ws.roomId = id;
      ws.seat = seat;
      room.seats[seat] = ws;
      const fresh = newPlayer(seat);
      room.players[seat] = fresh;
      pushLog(room, fresh.name + ' 加入了。');
      ws.send(JSON.stringify({ type: 'seat', seat }));
      broadcast(room);
      return;
    }

    const room = rooms.get(ws.roomId);
    if (!room || ws.seat < 0 || room.over) return;

    if (data.type === 'attack') act(room, ws.seat, 'attack');
    else if (data.type === 'skill') act(room, ws.seat, 'skill', Number(data.index) || 0);
    else if (data.type === 'potion') usePotion(room, ws.seat);
    else if (data.type === 'buy') buy(room, ws.seat, String(data.item));
    else if (data.type === 'restart') { restart(room); }
    else return;

    broadcast(room);
  });

  ws.on('close', () => {
    const room = rooms.get(ws.roomId);
    if (!room || ws.seat < 0) return;
    if (room.seats[ws.seat] === ws) room.seats[ws.seat] = null;
    if (room.players[ws.seat]) pushLog(room, room.players[ws.seat].name + ' 离开了。');
    broadcast(room);
    if (room.seats.every((s) => s === null)) rooms.delete(room.id);
  });
});

server.listen(PORT, () => {
  console.log('listening on ' + PORT);
});
