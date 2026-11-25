import type { BikeId, KarmaCapStatus, MeleeWeaponId, RangedWeaponId } from './game';

export type MultiplayerMode = 'coop' | 'race';
export type MultiplayerTargetDistance = 1500 | 3000 | 0; // 0 = Endless Survival
export type RoomStatus = 'waiting' | 'countdown' | 'playing' | 'finished';
export type PlayerActionKind = 'attack' | 'ranged' | 'emp' | 'police_ult' | 'horn';

export interface PlayerLoadout {
  name: string;
  bikeId: BikeId;
  meleeId: MeleeWeaponId;
  rangedId: RangedWeaponId;
}

export interface RoomPlayerInfo {
  id: string;
  name: string;
  bikeId: BikeId;
  meleeId: MeleeWeaponId;
  rangedId: RangedWeaponId;
  slotIndex: number;
  ready: boolean;
  isHost: boolean;
  alive: boolean;
  finished: boolean;
  finishOrder: number | null;
  distanceMeters: number;
  enemiesDefeated: number;
  civiliansSaved: number;
  hp: number;
  maxHp: number;
  x: number;
  y: number;
  z: number;
  speed: number;
  lean: number;
  nosActive: boolean;
  isWheelie: boolean;
  karmaCap: KarmaCapStatus;
}

export interface RoomChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  system: boolean;
  timestamp: number;
}

export interface RoomSnapshot {
  code: string;
  mode: MultiplayerMode;
  targetDistance: MultiplayerTargetDistance;
  isPublic: boolean;
  status: RoomStatus;
  countdownSec: number;
  worldSeed: number;
  winnerId: string | null;
  finishReason: string | null;
  players: RoomPlayerInfo[];
  chat: RoomChatMessage[];
}

export interface PublicRoomSummary {
  code: string;
  hostName: string;
  mode: MultiplayerMode;
  targetDistance: MultiplayerTargetDistance;
  playerCount: number;
  maxPlayers: number;
  status: RoomStatus;
}

export interface PlayerTelemetryPayload {
  x: number;
  y: number;
  z: number;
  speed: number;
  lean: number;
  hp: number;
  maxHp: number;
  nosActive: boolean;
  isWheelie: boolean;
  distanceMeters: number;
  enemiesDefeated: number;
  civiliansSaved: number;
  karmaCap: KarmaCapStatus;
}

export type ClientWsMessage =
  | { type: 'ping' }
  | { type: 'room:list' }
  | {
      type: 'room:create';
      mode: MultiplayerMode;
      targetDistance: MultiplayerTargetDistance;
      isPublic: boolean;
      loadout: PlayerLoadout;
    }
  | {
      type: 'room:join';
      code: string;
      loadout: PlayerLoadout;
    }
  | { type: 'room:leave' }
  | { type: 'room:toggle_ready' }
  | { type: 'room:update_loadout'; loadout: PlayerLoadout }
  | {
      type: 'room:update_config';
      mode?: MultiplayerMode;
      targetDistance?: MultiplayerTargetDistance;
      isPublic?: boolean;
    }
  | { type: 'room:chat'; text: string }
  | { type: 'room:start' }
  | { type: 'room:rematch' }
  | { type: 'player:telemetry'; data: PlayerTelemetryPayload }
  | { type: 'player:action'; action: PlayerActionKind }
  | { type: 'player:crash'; distanceMeters: number; enemiesDefeated: number; civiliansSaved: number };

export type ServerWsMessage =
  | { type: 'pong'; serverTime: number }
  | { type: 'welcome'; clientId: string }
  | { type: 'room:list'; rooms: PublicRoomSummary[] }
  | { type: 'room:snapshot'; room: RoomSnapshot }
  | { type: 'room:left' }
  | { type: 'room:error'; message: string }
  | { type: 'player:action'; playerId: string; playerName: string; action: PlayerActionKind };
