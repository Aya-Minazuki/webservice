const http = require('http');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 8080;

const HTML = Buffer.from('PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9InpoIj4KPGhlYWQ+CjxtZXRhIGNoYXJzZXQ9InV0Zi04Ij4KPG1ldGEgbmFtZT0idmlld3BvcnQiIGNvbnRlbnQ9IndpZHRoPWRldmljZS13aWR0aCxpbml0aWFsLXNjYWxlPTEiPgo8dGl0bGU+5bCP6bG86IGU5py6IFJQRzwvdGl0bGU+CjxzdHlsZT4KICAqe2JveC1zaXppbmc6Ym9yZGVyLWJveH0KICBib2R5e21hcmdpbjowO21pbi1oZWlnaHQ6MTAwdmg7YmFja2dyb3VuZDojMTQxYTI0O2NvbG9yOiNlOGVlZjc7Zm9udC1mYW1pbHk6c3lzdGVtLXVpLHNhbnMtc2VyaWY7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpjZW50ZXI7cGFkZGluZzoxMHB4fQogICNhcHB7d2lkdGg6MTAwJTttYXgtd2lkdGg6NTYwcHg7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjtnYXA6OHB4fQogIGgxe2ZvbnQtc2l6ZToxN3B4O21hcmdpbjowO2NvbG9yOiM4ZmQzZmZ9CiAgI2pvaW57ZGlzcGxheTpmbGV4O2dhcDo4cHh9CiAgaW5wdXR7ZmxleDoxO3BhZGRpbmc6MTBweDtib3JkZXItcmFkaXVzOjhweDtib3JkZXI6MXB4IHNvbGlkICMzMzQwNWE7YmFja2dyb3VuZDojMTAxNzIwO2NvbG9yOiNlOGVlZjd9CiAgYnV0dG9ue3BhZGRpbmc6OXB4IDEycHg7Ym9yZGVyOjA7Ym9yZGVyLXJhZGl1czo5cHg7YmFja2dyb3VuZDojMmM3YmU1O2NvbG9yOiNmZmY7Zm9udC1zaXplOjEzcHh9CiAgYnV0dG9uOmRpc2FibGVke29wYWNpdHk6LjMyfQogIGJ1dHRvbi5hbHR7YmFja2dyb3VuZDojM2E0NTU3fQogIGJ1dHRvbi5idXl7YmFja2dyb3VuZDojOGE1Y2Y2fQogIC5jYXJke2JhY2tncm91bmQ6IzFkMjUzMTtib3JkZXItcmFkaXVzOjlweDtwYWRkaW5nOjhweCAxMHB4O2ZvbnQtc2l6ZToxMnB4O2xpbmUtaGVpZ2h0OjEuNTU7bWFyZ2luLWJvdHRvbTo1cHh9CiAgLmNhcmQubWV7b3V0bGluZToxcHggc29saWQgIzJjN2JlNX0KICAuY2FyZC5kb3due29wYWNpdHk6LjQyfQogICNlbmVteXtiYWNrZ3JvdW5kOiMxZDI1MzE7Ym9yZGVyLXJhZGl1czo5cHg7cGFkZGluZzo5cHggMTBweDtmb250LXNpemU6MTNweH0KICAjZW5lbXkuYm9zc3tvdXRsaW5lOjFweCBzb2xpZCAjZTA1YzVjfQogICNsb2d7bWluLWhlaWdodDoxMTBweDttYXgtaGVpZ2h0OjE3MHB4O2JhY2tncm91bmQ6IzBmMTQxYztib3JkZXItcmFkaXVzOjlweDtwYWRkaW5nOjlweDtmb250LXNpemU6MTJweDtsaW5lLWhlaWdodDoxLjU1O292ZXJmbG93LXk6YXV0b30KICAjbG9nIHB7bWFyZ2luOjAgMCAzcHh9CiAgLmdyaWR7ZGlzcGxheTpncmlkO2dyaWQtdGVtcGxhdGUtY29sdW1uczpyZXBlYXQoMywxZnIpO2dhcDo2cHh9CiAgLmdyaWQgYnV0dG9ue2ZvbnQtc2l6ZToxMnB4O3BhZGRpbmc6OHB4IDRweH0KICAucm93e2Rpc3BsYXk6ZmxleDtnYXA6NnB4fQogIC5yb3cgYnV0dG9ue2ZsZXg6MX0KICAjaGludHtmb250LXNpemU6MTFweDtvcGFjaXR5Oi42NX0KPC9zdHlsZT4KPC9oZWFkPgo8Ym9keT4KPGRpdiBpZD0iYXBwIj4KICA8aDE+5bCP6bG86IGU5py6IFJQRzwvaDE+CiAgPGRpdiBpZD0iam9pbiI+CiAgICA8aW5wdXQgaWQ9InJvb20iIHBsYWNlaG9sZGVyPSLmiL/pl7Tlj7ciIHZhbHVlPSJmaXNoIj4KICAgIDxidXR0b24gaWQ9ImNvbm5lY3QiPui/m+WFpTwvYnV0dG9uPgogIDwvZGl2PgogIDxkaXYgaWQ9InBsYXllcnMiPjwvZGl2PgogIDxkaXYgaWQ9ImVuZW15Ij7mnKrov57mjqU8L2Rpdj4KICA8ZGl2IGlkPSJsb2ciPjwvZGl2PgogIDxkaXYgaWQ9ImhpbnQiPjwvZGl2PgogIDxkaXYgY2xhc3M9InJvdyI+CiAgICA8YnV0dG9uIGlkPSJhdHRhY2siIGRpc2FibGVkPuaZrumAmuaUu+WHuzwvYnV0dG9uPgogICAgPGJ1dHRvbiBpZD0icG90aW9uIiBjbGFzcz0iYWx0IiBkaXNhYmxlZD7llp3oja88L2J1dHRvbj4KICAgIDxidXR0b24gaWQ9InJlc3RhcnQiIGNsYXNzPSJhbHQiIGRpc2FibGVkPumHjeW8gDwvYnV0dG9uPgogIDwvZGl2PgogIDxkaXYgY2xhc3M9ImdyaWQiIGlkPSJza2lsbHMiPjwvZGl2PgogIDxkaXYgY2xhc3M9ImdyaWQiIGlkPSJzaG9wIj48L2Rpdj4KPC9kaXY+CjxzY3JpcHQ+CmNvbnN0ICQgPSAoaWQpID0+IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTsKY29uc3Qgcm9vbUVsID0gJCgncm9vbScpLCBjb25uZWN0QnRuID0gJCgnY29ubmVjdCcpOwpjb25zdCBwbGF5ZXJzRWwgPSAkKCdwbGF5ZXJzJyksIGVuZW15RWwgPSAkKCdlbmVteScpLCBsb2dFbCA9ICQoJ2xvZycpLCBoaW50RWwgPSAkKCdoaW50Jyk7CmNvbnN0IGF0a0J0biA9ICQoJ2F0dGFjaycpLCBwb3Rpb25CdG4gPSAkKCdwb3Rpb24nKSwgcmVzdGFydEJ0biA9ICQoJ3Jlc3RhcnQnKTsKY29uc3Qgc2tpbGxzRWwgPSAkKCdza2lsbHMnKSwgc2hvcEVsID0gJCgnc2hvcCcpOwoKbGV0IHdzID0gbnVsbDsKbGV0IG15U2VhdCA9IC0xOwoKZnVuY3Rpb24gY29ubmVjdCgpIHsKICBjb25zdCBwcm90byA9IGxvY2F0aW9uLnByb3RvY29sID09PSAnaHR0cHM6JyA/ICd3c3M6JyA6ICd3czonOwogIHdzID0gbmV3IFdlYlNvY2tldChwcm90byArICcvLycgKyBsb2NhdGlvbi5ob3N0KTsKICB3cy5vbm9wZW4gPSAoKSA9PiB7CiAgICBjb25uZWN0QnRuLmRpc2FibGVkID0gdHJ1ZTsKICAgIHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoeyB0eXBlOiAnam9pbicsIHJvb206IHJvb21FbC52YWx1ZS50cmltKCkgfHwgJ2Zpc2gnIH0pKTsKICB9OwogIHdzLm9ubWVzc2FnZSA9IChldikgPT4gaGFuZGxlKEpTT04ucGFyc2UoZXYuZGF0YSkpOwogIHdzLm9uY2xvc2UgPSAoKSA9PiB7IGNvbm5lY3RCdG4uZGlzYWJsZWQgPSBmYWxzZTsgaGludEVsLnRleHRDb250ZW50ID0gJ+i/nuaOpeaWreW8gOS6huOAgic7IH07Cn0KCmZ1bmN0aW9uIGhhbmRsZShkYXRhKSB7CiAgaWYgKGRhdGEudHlwZSA9PT0gJ3NlYXQnKSB7IG15U2VhdCA9IGRhdGEuc2VhdDsgaGludEVsLnRleHRDb250ZW50ID0gJ+S9oOaYryAnICsgKG15U2VhdCArIDEpICsgJ1AnOyByZXR1cm47IH0KICBpZiAoZGF0YS50eXBlID09PSAnZXJyb3InKSB7IGhpbnRFbC50ZXh0Q29udGVudCA9IGRhdGEubWVzc2FnZTsgY29ubmVjdEJ0bi5kaXNhYmxlZCA9IGZhbHNlOyByZXR1cm47IH0KICBpZiAoZGF0YS50eXBlICE9PSAnc3RhdGUnKSByZXR1cm47CgogIGNvbnN0IG1lID0gZGF0YS5wbGF5ZXJzLmZpbmQoKHApID0+IHAuc2VhdCA9PT0gbXlTZWF0KTsKCiAgcGxheWVyc0VsLmlubmVySFRNTCA9ICcnOwogIGRhdGEucGxheWVycy5mb3JFYWNoKChwKSA9PiB7CiAgICBjb25zdCBkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgICBkLmNsYXNzTmFtZSA9ICdjYXJkJyArIChwLnNlYXQgPT09IG15U2VhdCA/ICcgbWUnIDogJycpICsgKHAuaHAgPD0gMCA/ICcgZG93bicgOiAnJyk7CiAgICBkLmlubmVySFRNTCA9ICc8Yj4nICsgcC5uYW1lICsgJzwvYj4nICsgKHAuc2VhdCA9PT0gbXlTZWF0ID8gJ++8iOS9oO+8iScgOiAnJykgKwogICAgICAnIMK3IEx2JyArIHAubHYgKwogICAgICAnPGJyPueUn+WRvSAnICsgcC5ocCArICcvJyArIHAubWF4ICsgJyDCtyDmlLvlh7sgJyArIHAuYXRrICsKICAgICAgJyDCtyDph5HluIEgJyArIHAuZ29sZCArICcgwrcg6I2vICcgKyBwLnBvdGlvbnMgKwogICAgICAocC53ZWFwb24gfHwgcC5hcm1vciA/ICfjgIDmrablmagrJyArIChwLndlYXBvbiAqIDMpICsgJyDmiqTnlLIrJyArIChwLmFybW9yICogMTIpIDogJycpOwogICAgcGxheWVyc0VsLmFwcGVuZENoaWxkKGQpOwogIH0pOwoKICBlbmVteUVsLmNsYXNzTmFtZSA9IGRhdGEuZW5lbXkgJiYgZGF0YS5lbmVteS5ib3NzID8gJ2Jvc3MnIDogJyc7CiAgZW5lbXlFbC50ZXh0Q29udGVudCA9IGRhdGEuZW5lbXkKICAgID8gJ+aVjOS6uu+8micgKyBkYXRhLmVuZW15Lm5hbWUgKyAoZGF0YS5lbmVteS5ib3NzID8gJ++8iEJPU1PvvIknIDogJycpICsKICAgICAgJyDCtyAnICsgTWF0aC5tYXgoMCwgZGF0YS5lbmVteS5ocCkgKyAnLycgKyBkYXRhLmVuZW15Lm1heCArICcgSFAnCiAgICA6IChkYXRhLndpbiA/ICfpgJrlhbPkuobvvIEnIDogJ+aVjOS6uu+8muaXoCcpOwogIGhpbnRFbC50ZXh0Q29udGVudCA9ICflt7Llh7vmnYAgJyArIGRhdGEua2lsbHMgKyAnIOWPqu+8jCcgKyBkYXRhLmJvc3NBdCArICcg5Y+q5ZCOIEJPU1Mg5Ye6546wJyArIChkYXRhLm92ZXIgPyAnIMK3IOacrOWxgOe7k+adnycgOiAnJyk7CgogIGxvZ0VsLmlubmVySFRNTCA9ICcnOwogIGRhdGEubG9ncy5zbGljZSgtMTQpLmZvckVhY2goKHQpID0+IHsKICAgIGNvbnN0IHAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7CiAgICBwLnRleHRDb250ZW50ID0gdDsKICAgIGxvZ0VsLmFwcGVuZENoaWxkKHApOwogIH0pOwogIGxvZ0VsLnNjcm9sbFRvcCA9IGxvZ0VsLnNjcm9sbEhlaWdodDsKCiAgY29uc3QgYWxpdmUgPSBtZSAmJiBtZS5ocCA+IDAgJiYgIWRhdGEub3ZlcjsKICBhdGtCdG4uZGlzYWJsZWQgPSAhYWxpdmU7CiAgcG90aW9uQnRuLmRpc2FibGVkID0gIWFsaXZlIHx8IG1lLnBvdGlvbnMgPD0gMDsKICBwb3Rpb25CdG4udGV4dENvbnRlbnQgPSAn5Zad6I2v77yIJyArIChtZSA/IG1lLnBvdGlvbnMgOiAwKSArICfvvIknOwogIHJlc3RhcnRCdG4uZGlzYWJsZWQgPSBmYWxzZTsKCiAgc2tpbGxzRWwuaW5uZXJIVE1MID0gJyc7CiAgKG1lID8gbWUuc2tpbGxzIDogW10pLmZvckVhY2goKHMsIGkpID0+IHsKICAgIGNvbnN0IGIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTsKICAgIGIuY2xhc3NOYW1lID0gJ2FsdCc7CiAgICBjb25zdCBsb2NrZWQgPSBtZS5sdiA8IHMudW5sb2NrOwogICAgY29uc3QgY2QgPSBtZS5jZHNbaV07CiAgICBiLnRleHRDb250ZW50ID0gcy5uYW1lICsgKGxvY2tlZCA/ICcoTHYnICsgcy51bmxvY2sgKyAnKScgOiBjZCA+IDAgPyAnKCcgKyBjZCArICcpJyA6ICcnKTsKICAgIGIuZGlzYWJsZWQgPSAhYWxpdmUgfHwgbG9ja2VkIHx8IGNkID4gMDsKICAgIGIub25jbGljayA9ICgpID0+IHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoeyB0eXBlOiAnc2tpbGwnLCBpbmRleDogaSB9KSk7CiAgICBza2lsbHNFbC5hcHBlbmRDaGlsZChiKTsKICB9KTsKCiAgc2hvcEVsLmlubmVySFRNTCA9ICcnOwogIGNvbnN0IGl0ZW1zID0gWwogICAgeyBpZDogJ3BvdGlvbicsIHRleHQ6ICfkubDoja8gJyArIGRhdGEuc2hvcC5wb3Rpb24gfSwKICAgIHsgaWQ6ICd3ZWFwb24nLCB0ZXh0OiAn5by65YyW5q2m5ZmoICcgKyBkYXRhLnNob3Aud2VhcG9uIH0sCiAgICB7IGlkOiAnYXJtb3InLCB0ZXh0OiAn5by65YyW5oqk55SyICcgKyBkYXRhLnNob3AuYXJtb3IgfQogIF07CiAgaXRlbXMuZm9yRWFjaCgoaXQpID0+IHsKICAgIGNvbnN0IGIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTsKICAgIGIuY2xhc3NOYW1lID0gJ2J1eSc7CiAgICBiLnRleHRDb250ZW50ID0gaXQudGV4dDsKICAgIGIuZGlzYWJsZWQgPSAhbWUgfHwgbWUuZ29sZCA8IChpdC5pZCA9PT0gJ3BvdGlvbicgPyBkYXRhLnNob3AucG90aW9uIDogaXQuaWQgPT09ICd3ZWFwb24nID8gZGF0YS5zaG9wLndlYXBvbiA6IGRhdGEuc2hvcC5hcm1vcik7CiAgICBiLm9uY2xpY2sgPSAoKSA9PiB3cy5zZW5kKEpTT04uc3RyaW5naWZ5KHsgdHlwZTogJ2J1eScsIGl0ZW06IGl0LmlkIH0pKTsKICAgIHNob3BFbC5hcHBlbmRDaGlsZChiKTsKICB9KTsKfQoKY29ubmVjdEJ0bi5vbmNsaWNrID0gY29ubmVjdDsKYXRrQnRuLm9uY2xpY2sgPSAoKSA9PiB3cy5zZW5kKEpTT04uc3RyaW5naWZ5KHsgdHlwZTogJ2F0dGFjaycgfSkpOwpwb3Rpb25CdG4ub25jbGljayA9ICgpID0+IHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoeyB0eXBlOiAncG90aW9uJyB9KSk7CnJlc3RhcnRCdG4ub25jbGljayA9ICgpID0+IHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoeyB0eXBlOiAncmVzdGFydCcgfSkpOwo8L3NjcmlwdD4KPC9ib2R5Pgo8L2h0bWw+Cg==', 'base64').toString('utf8');

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
  const alive = room.players.filter((x) => x && x.hp > 0);
  const share = Math.max(1, Math.floor(gold / Math.max(1, alive.length)));
  alive.forEach((x) => { x.gold += share; });
  pushLog(room, room.enemy.name + ' 被打倒了，全队每人分到 ' + share + ' 金币。');
  const expGain = 8 + room.kills * 3;
  room.players.forEach((x) => {
    if (x && x.hp > 0) gainExp(room, x, expGain);
  });

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
