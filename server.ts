import express from 'express';
import http from 'node:http';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';
import type {
  ClientWsMessage,
  MultiplayerMode,
  MultiplayerTargetDistance,
  PlayerLoadout,
  PublicRoomSummary,
  RoomChatMessage,
  RoomPlayerInfo,
  RoomSnapshot,
  ServerWsMessage,
} from './src/types/multiplayer.ts';
import type { BikeId, MeleeWeaponId, RangedWeaponId } from './src/types/game.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const MAX_PLAYERS_PER_ROOM = 4;
const VALID_BIKES = new Set<BikeId>([
  'bebek125',
  'vespa160',
  'matic150',
  'trail250',
  'naked250',
  'chopper400',
  'superbike600',
  'cyberatv',
]);
const VALID_MELEE = new Set<MeleeWeaponId>(['baton', 'golok', 'chain', 'katana']);
const VALID_RANGED = new Set<RangedWeaponId>(['flare', 'shotgun', 'smg', 'rpg']);

interface ConnectedClient {
  id: string;
  ws: WebSocket;
  roomCode: string | null;
  alive: boolean;
}

interface InternalRoom {
  code: string;
  mode: MultiplayerMode;
  targetDistance: MultiplayerTargetDistance;
  isPublic: boolean;
  status: RoomSnapshot['status'];
  countdownSec: number;
  worldSeed: number;
  winnerId: string | null;
  finishReason: string | null;
  finishCounter: number;
  players: Map<string, RoomPlayerInfo>;
  chat: RoomChatMessage[];
  countdownTimer: ReturnType<typeof setInterval> | null;
  broadcastTimer: ReturnType<typeof setInterval> | null;
  dirty: boolean;
}

const clients = new Map<string, ConnectedClient>();
const rooms = new Map<string, InternalRoom>();

function sanitizeName(raw: string): string {
  const cleaned = String(raw || '')
    .replace(/[\r\n\t]+/g, ' ')
    .trim()
    .slice(0, 18);
  return cleaned || 'Rider Malam';
}

function sanitizeLoadout(loadout: Partial<PlayerLoadout> | undefined): PlayerLoadout {
  return {
    name: sanitizeName(loadout?.name || 'Rider Malam'),
    bikeId: VALID_BIKES.has(loadout?.bikeId as BikeId) ? (loadout!.bikeId as BikeId) : 'bebek125',
    meleeId: VALID_MELEE.has(loadout?.meleeId as MeleeWeaponId)
      ? (loadout!.meleeId as MeleeWeaponId)
      : 'baton',
    rangedId: VALID_RANGED.has(loadout?.rangedId as RangedWeaponId)
      ? (loadout!.rangedId as RangedWeaponId)
      : 'flare',
  };
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let attempt = 0; attempt < 30; attempt++) {
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    if (!rooms.has(code)) return code;
  }
  return crypto.randomBytes(2).toString('hex').toUpperCase();
}

function sendToClient(client: ConnectedClient | undefined, msg: ServerWsMessage): void {
  if (!client || client.ws.readyState !== WebSocket.OPEN) return;
  client.ws.send(JSON.stringify(msg));
}

function toSnapshot(room: InternalRoom): RoomSnapshot {
  return {
    code: room.code,
    mode: room.mode,
    targetDistance: room.targetDistance,
    isPublic: room.isPublic,
    status: room.status,
    countdownSec: room.countdownSec,
    worldSeed: room.worldSeed,
    winnerId: room.winnerId,
    finishReason: room.finishReason,
    players: Array.from(room.players.values()).sort((a, b) => a.slotIndex - b.slotIndex),
    chat: room.chat.slice(-24),
  };
}

function broadcastRoomSnapshot(room: InternalRoom): void {
  const payload = JSON.stringify({
    type: 'room:snapshot',
    room: toSnapshot(room),
  } satisfies ServerWsMessage);
  for (const playerId of room.players.keys()) {
    const client = clients.get(playerId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
  room.dirty = false;
}

function broadcastRoomAction(
  room: InternalRoom,
  senderId: string,
  senderName: string,
  action: 'attack' | 'ranged' | 'emp' | 'police_ult' | 'horn'
): void {
  const payload = JSON.stringify({
    type: 'player:action',
    playerId: senderId,
    playerName: senderName,
    action,
  } satisfies ServerWsMessage);
  for (const playerId of room.players.keys()) {
    if (playerId === senderId) continue;
    const client = clients.get(playerId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}

function appendChat(room: InternalRoom, senderId: string, senderName: string, text: string, system = false): void {
  const clean = text.replace(/[\r\n\t]+/g, ' ').trim().slice(0, 140);
  if (!clean) return;
  room.chat.push({
    id: crypto.randomUUID(),
    senderId,
    senderName,
    text: clean,
    system,
    timestamp: Date.now(),
  });
  if (room.chat.length > 30) {
    room.chat.splice(0, room.chat.length - 30);
  }
}

function listPublicRooms(): PublicRoomSummary[] {
  const list: PublicRoomSummary[] = [];
  for (const room of rooms.values()) {
    if (!room.isPublic) continue;
    if (room.status === 'finished' && room.players.size === 0) continue;
    const host = Array.from(room.players.values()).find((p) => p.isHost);
    list.push({
      code: room.code,
      hostName: host?.name ?? 'Rider',
      mode: room.mode,
      targetDistance: room.targetDistance,
      playerCount: room.players.size,
      maxPlayers: MAX_PLAYERS_PER_ROOM,
      status: room.status,
    });
  }
  return list.slice(0, 16);
}

function stopRoomTimers(room: InternalRoom): void {
  if (room.countdownTimer) {
    clearInterval(room.countdownTimer);
    room.countdownTimer = null;
  }
  if (room.broadcastTimer) {
    clearInterval(room.broadcastTimer);
    room.broadcastTimer = null;
  }
}

function assignFreeSlot(room: InternalRoom): number {
  const used = new Set(Array.from(room.players.values()).map((p) => p.slotIndex));
  for (let i = 0; i < MAX_PLAYERS_PER_ROOM; i++) {
    if (!used.has(i)) return i;
  }
  return room.players.size;
}

function createPlayerEntry(
  id: string,
  loadout: PlayerLoadout,
  slotIndex: number,
  isHost: boolean
): RoomPlayerInfo {
  const laneStarts = [-4.2, -1.45, 1.45, 4.2];
  return {
    id,
    name: loadout.name,
    bikeId: loadout.bikeId,
    meleeId: loadout.meleeId,
    rangedId: loadout.rangedId,
    slotIndex,
    ready: isHost,
    isHost,
    alive: true,
    finished: false,
    finishOrder: null,
    distanceMeters: 0,
    enemiesDefeated: 0,
    civiliansSaved: 0,
    hp: 100,
    maxHp: 100,
    x: laneStarts[slotIndex % laneStarts.length] ?? 1.45,
    y: 0,
    z: 0,
    speed: 0,
    lean: 0,
    nosActive: false,
    isWheelie: false,
    karmaCap: 'netral',
  };
}

function evaluateMatchCompletion(room: InternalRoom): void {
  if (room.status !== 'playing') return;
  const players = Array.from(room.players.values());
  if (players.length === 0) return;

  // Check target distance finish (for timed/distance modes)
  if (room.targetDistance > 0) {
    for (const p of players) {
      if (!p.finished && p.distanceMeters >= room.targetDistance) {
        p.finished = true;
        room.finishCounter += 1;
        p.finishOrder = room.finishCounter;
        appendChat(room, 'system', 'RACE', `${p.name} mencapai garis finis ${room.targetDistance}m!`, true);
        if (!room.winnerId) {
          room.winnerId = p.id;
        }
      }
    }

    if (room.mode === 'race' && room.winnerId) {
      const winner = room.players.get(room.winnerId);
      room.status = 'finished';
      room.finishReason = `${winner?.name ?? 'Rider'} menjuarai balapan ${room.targetDistance}m!`;
      stopRoomTimers(room);
      broadcastRoomSnapshot(room);
      return;
    }

    if (room.mode === 'coop' && players.every((p) => p.finished || !p.alive)) {
      const top = [...players].sort((a, b) => b.distanceMeters - a.distanceMeters)[0];
      room.winnerId = top?.id ?? null;
      room.status = 'finished';
      room.finishReason = players.some((p) => p.finished)
        ? `Konvoi menembus target ${room.targetDistance}m!`
        : 'Semua rider tumbang di jalanan malam!';
      stopRoomTimers(room);
      broadcastRoomSnapshot(room);
      return;
    }
  }

  const alivePlayers = players.filter((p) => p.alive);
  if (room.mode === 'race' && players.length >= 2 && alivePlayers.length <= 1) {
    const survivor = alivePlayers[0];
    if (survivor) {
      room.winnerId = survivor.id;
      room.finishReason = `${survivor.name} bertahan paling terakhir!`;
    } else {
      const top = [...players].sort((a, b) => b.distanceMeters - a.distanceMeters)[0];
      room.winnerId = top?.id ?? null;
      room.finishReason = 'Semua pembalap tumbang!';
    }
    room.status = 'finished';
    stopRoomTimers(room);
    broadcastRoomSnapshot(room);
    return;
  }

  if (alivePlayers.length === 0) {
    const top = [...players].sort((a, b) => b.distanceMeters - a.distanceMeters)[0];
    room.winnerId = top?.id ?? null;
    room.status = 'finished';
    room.finishReason =
      room.mode === 'coop'
        ? `Konvoi bertahan hingga ${top?.distanceMeters ?? 0}m!`
        : `${top?.name ?? 'Rider'} menempuh jarak terjauh!`;
    stopRoomTimers(room);
    broadcastRoomSnapshot(room);
  }
}

function removeClientFromRoom(client: ConnectedClient, notifyClient = false): void {
  if (!client.roomCode) return;
  const room = rooms.get(client.roomCode);
  const prevCode = client.roomCode;
  client.roomCode = null;
  if (!room) {
    if (notifyClient) sendToClient(client, { type: 'room:left' });
    return;
  }

  const departing = room.players.get(client.id);
  room.players.delete(client.id);

  if (room.players.size === 0) {
    stopRoomTimers(room);
    rooms.delete(prevCode);
    if (notifyClient) sendToClient(client, { type: 'room:left' });
    return;
  }

  if (departing) {
    appendChat(room, 'system', 'ROOM', `${departing.name} keluar dari room.`, true);
    if (departing.isHost) {
      const nextHost = Array.from(room.players.values()).sort((a, b) => a.slotIndex - b.slotIndex)[0];
      if (nextHost) {
        nextHost.isHost = true;
        nextHost.ready = true;
        appendChat(room, 'system', 'ROOM', `${nextHost.name} menjadi Host baru.`, true);
      }
    }
  }

  if (room.status === 'countdown' && room.players.size < 1) {
    stopRoomTimers(room);
    room.status = 'waiting';
  } else if (room.status === 'playing') {
    evaluateMatchCompletion(room);
  }

  broadcastRoomSnapshot(room);
  if (notifyClient) sendToClient(client, { type: 'room:left' });
}

function startRoomCountdown(room: InternalRoom): void {
  stopRoomTimers(room);
  room.status = 'countdown';
  room.countdownSec = 3;
  room.winnerId = null;
  room.finishReason = null;
  room.finishCounter = 0;
  room.worldSeed = Math.floor(Math.random() * 900000) + 100000;

  const laneStarts = [-4.2, -1.45, 1.45, 4.2];
  for (const p of room.players.values()) {
    p.alive = true;
    p.finished = false;
    p.finishOrder = null;
    p.distanceMeters = 0;
    p.enemiesDefeated = 0;
    p.civiliansSaved = 0;
    p.x = laneStarts[p.slotIndex % laneStarts.length] ?? 1.45;
    p.y = 0;
    p.z = 0;
    p.speed = 0;
    p.lean = 0;
    p.nosActive = false;
    p.isWheelie = false;
    p.karmaCap = 'netral';
  }

  appendChat(room, 'system', 'RACE', 'Hitungan mundur dimulai! Bersiap di garis start!', true);
  broadcastRoomSnapshot(room);

  room.countdownTimer = setInterval(() => {
    room.countdownSec -= 1;
    if (room.countdownSec <= 0) {
      if (room.countdownTimer) {
        clearInterval(room.countdownTimer);
        room.countdownTimer = null;
      }
      room.status = 'playing';
      room.countdownSec = 0;
      broadcastRoomSnapshot(room);

      room.broadcastTimer = setInterval(() => {
        if (room.dirty && room.status === 'playing') {
          broadcastRoomSnapshot(room);
        }
      }, 50); // 20 Hz state sync
    } else {
      broadcastRoomSnapshot(room);
    }
  }, 1000);
}

function handleClientMessage(client: ConnectedClient, msg: ClientWsMessage): void {
  switch (msg.type) {
    case 'ping': {
      sendToClient(client, { type: 'pong', serverTime: Date.now() });
      return;
    }
    case 'room:list': {
      sendToClient(client, { type: 'room:list', rooms: listPublicRooms() });
      return;
    }
    case 'room:create': {
      removeClientFromRoom(client, false);
      const code = generateRoomCode();
      const loadout = sanitizeLoadout(msg.loadout);
      const room: InternalRoom = {
        code,
        mode: msg.mode === 'race' ? 'race' : 'coop',
        targetDistance:
          msg.targetDistance === 1500 || msg.targetDistance === 3000 ? msg.targetDistance : 0,
        isPublic: Boolean(msg.isPublic),
        status: 'waiting',
        countdownSec: 0,
        worldSeed: Math.floor(Math.random() * 900000) + 100000,
        winnerId: null,
        finishReason: null,
        finishCounter: 0,
        players: new Map(),
        chat: [],
        countdownTimer: null,
        broadcastTimer: null,
        dirty: false,
      };
      const hostPlayer = createPlayerEntry(client.id, loadout, 0, true);
      room.players.set(client.id, hostPlayer);
      appendChat(room, 'system', 'ROOM', `Room ${code} dibuat oleh ${hostPlayer.name}.`, true);
      rooms.set(code, room);
      client.roomCode = code;
      broadcastRoomSnapshot(room);
      return;
    }
    case 'room:join': {
      const code = String(msg.code || '')
        .trim()
        .toUpperCase();
      const room = rooms.get(code);
      if (!room) {
        sendToClient(client, {
          type: 'room:error',
          message: `Room "${code}" tidak ditemukan atau sudah bubar.`,
        });
        return;
      }
      if (room.players.size >= MAX_PLAYERS_PER_ROOM) {
        sendToClient(client, { type: 'room:error', message: 'Room sudah penuh (maksimal 4 rider).' });
        return;
      }
      if (room.status === 'playing' || room.status === 'countdown') {
        sendToClient(client, {
          type: 'room:error',
          message: 'Balapan sedang berlangsung di room ini. Tunggu ronde selesai.',
        });
        return;
      }
      if (client.roomCode === code && room.players.has(client.id)) {
        broadcastRoomSnapshot(room);
        return;
      }
      removeClientFromRoom(client, false);
      const loadout = sanitizeLoadout(msg.loadout);
      const slot = assignFreeSlot(room);
      const player = createPlayerEntry(client.id, loadout, slot, false);
      room.players.set(client.id, player);
      client.roomCode = code;
      appendChat(room, 'system', 'ROOM', `${player.name} bergabung ke room.`, true);
      broadcastRoomSnapshot(room);
      return;
    }
    case 'room:leave': {
      removeClientFromRoom(client, true);
      return;
    }
    case 'room:toggle_ready': {
      if (!client.roomCode) return;
      const room = rooms.get(client.roomCode);
      const player = room?.players.get(client.id);
      if (!room || !player || room.status !== 'waiting') return;
      player.ready = !player.ready;
      broadcastRoomSnapshot(room);
      return;
    }
    case 'room:update_loadout': {
      if (!client.roomCode) return;
      const room = rooms.get(client.roomCode);
      const player = room?.players.get(client.id);
      if (!room || !player) return;
      const clean = sanitizeLoadout(msg.loadout);
      player.name = clean.name;
      player.bikeId = clean.bikeId;
      player.meleeId = clean.meleeId;
      player.rangedId = clean.rangedId;
      broadcastRoomSnapshot(room);
      return;
    }
    case 'room:update_config': {
      if (!client.roomCode) return;
      const room = rooms.get(client.roomCode);
      const player = room?.players.get(client.id);
      if (!room || !player || !player.isHost || room.status !== 'waiting') return;
      if (msg.mode === 'coop' || msg.mode === 'race') room.mode = msg.mode;
      if (msg.targetDistance === 0 || msg.targetDistance === 1500 || msg.targetDistance === 3000) {
        room.targetDistance = msg.targetDistance;
      }
      if (typeof msg.isPublic === 'boolean') room.isPublic = msg.isPublic;
      broadcastRoomSnapshot(room);
      return;
    }
    case 'room:chat': {
      if (!client.roomCode) return;
      const room = rooms.get(client.roomCode);
      const player = room?.players.get(client.id);
      if (!room || !player) return;
      appendChat(room, player.id, player.name, msg.text, false);
      broadcastRoomSnapshot(room);
      return;
    }
    case 'room:start': {
      if (!client.roomCode) return;
      const room = rooms.get(client.roomCode);
      const player = room?.players.get(client.id);
      if (!room || !player || !player.isHost || room.status !== 'waiting') return;
      const allOthersReady = Array.from(room.players.values())
        .filter((p) => !p.isHost)
        .every((p) => p.ready);
      if (!allOthersReady) {
        sendToClient(client, {
          type: 'room:error',
          message: 'Semua rider lain harus menekan SIAP terlebih dahulu.',
        });
        return;
      }
      startRoomCountdown(room);
      return;
    }
    case 'room:rematch': {
      if (!client.roomCode) return;
      const room = rooms.get(client.roomCode);
      const player = room?.players.get(client.id);
      if (!room || !player || room.status !== 'finished') return;
      stopRoomTimers(room);
      room.status = 'waiting';
      room.winnerId = null;
      room.finishReason = null;
      room.finishCounter = 0;
      for (const p of room.players.values()) {
        p.ready = p.isHost;
        p.alive = true;
        p.finished = false;
        p.finishOrder = null;
        p.distanceMeters = 0;
        p.enemiesDefeated = 0;
        p.civiliansSaved = 0;
      }
      appendChat(room, 'system', 'ROOM', `${player.name} kembali ke lobi untuk rematch!`, true);
      broadcastRoomSnapshot(room);
      return;
    }
    case 'player:telemetry': {
      if (!client.roomCode) return;
      const room = rooms.get(client.roomCode);
      const player = room?.players.get(client.id);
      if (!room || !player || room.status !== 'playing' || !player.alive) return;
      const d = msg.data;
      player.x = Math.max(-7, Math.min(7, Number(d.x) || 0));
      player.y = Math.max(0, Math.min(12, Number(d.y) || 0));
      player.z = Number(d.z) || 0;
      player.speed = Math.max(0, Math.min(180, Number(d.speed) || 0));
      player.lean = Math.max(-1, Math.min(1, Number(d.lean) || 0));
      player.hp = Math.max(0, Number(d.hp) || 0);
      player.maxHp = Math.max(1, Number(d.maxHp) || 100);
      player.nosActive = Boolean(d.nosActive);
      player.isWheelie = Boolean(d.isWheelie);
      player.distanceMeters = Math.max(player.distanceMeters, Math.floor(Number(d.distanceMeters) || 0));
      player.enemiesDefeated = Math.max(player.enemiesDefeated, Math.floor(Number(d.enemiesDefeated) || 0));
      player.civiliansSaved = Math.max(player.civiliansSaved, Math.floor(Number(d.civiliansSaved) || 0));
      player.karmaCap =
        d.karmaCap === 'pelindung' || d.karmaCap === 'egois' ? d.karmaCap : 'netral';
      room.dirty = true;
      evaluateMatchCompletion(room);
      return;
    }
    case 'player:action': {
      if (!client.roomCode) return;
      const room = rooms.get(client.roomCode);
      const player = room?.players.get(client.id);
      if (!room || !player || room.status !== 'playing') return;
      broadcastRoomAction(room, player.id, player.name, msg.action);
      if (msg.action === 'police_ult' && room.mode === 'coop') {
        appendChat(room, 'system', 'POLISI', `${player.name} memanggil Raziya Polisi!`, true);
        broadcastRoomSnapshot(room);
      }
      return;
    }
    case 'player:crash': {
      if (!client.roomCode) return;
      const room = rooms.get(client.roomCode);
      const player = room?.players.get(client.id);
      if (!room || !player || room.status !== 'playing') return;
      player.alive = false;
      player.hp = 0;
      player.distanceMeters = Math.max(player.distanceMeters, Math.floor(Number(msg.distanceMeters) || 0));
      player.enemiesDefeated = Math.max(player.enemiesDefeated, Math.floor(Number(msg.enemiesDefeated) || 0));
      player.civiliansSaved = Math.max(player.civiliansSaved, Math.floor(Number(msg.civiliansSaved) || 0));
      appendChat(
        room,
        'system',
        'CRASH',
        `${player.name} tumbang di ${player.distanceMeters}m.`,
        true
      );
      evaluateMatchCompletion(room);
      broadcastRoomSnapshot(room);
      return;
    }
  }
}

async function bootstrapServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, rooms: rooms.size, clients: clients.size });
  });

  app.get('/api/multiplayer/rooms', (_req, res) => {
    res.json({ rooms: listPublicRooms() });
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws/multiplayer' });

  wss.on('connection', (ws) => {
    const clientId = crypto.randomUUID().slice(0, 12);
    const client: ConnectedClient = {
      id: clientId,
      ws,
      roomCode: null,
      alive: true,
    };
    clients.set(clientId, client);
    sendToClient(client, { type: 'welcome', clientId });

    ws.on('pong', () => {
      client.alive = true;
    });

    ws.on('message', (raw) => {
      try {
        const parsed = JSON.parse(raw.toString()) as ClientWsMessage;
        handleClientMessage(client, parsed);
      } catch {
        // Ignore malformed packets
      }
    });

    ws.on('close', () => {
      removeClientFromRoom(client, false);
      clients.delete(clientId);
    });
  });

  // Prune stale sockets cleanly
  const heartbeat = setInterval(() => {
    for (const [id, client] of clients.entries()) {
      if (!client.alive) {
        client.ws.terminate();
        removeClientFromRoom(client, false);
        clients.delete(id);
        continue;
      }
      client.alive = false;
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.ping();
      }
    }
  }, 15000);

  wss.on('close', () => clearInterval(heartbeat));

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`BEGAL RUSUH server listening on http://0.0.0.0:${PORT}`);
  });
}

bootstrapServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
