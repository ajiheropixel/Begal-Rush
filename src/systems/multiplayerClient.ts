import type {
  ClientWsMessage,
  MultiplayerMode,
  MultiplayerTargetDistance,
  PlayerActionKind,
  PlayerLoadout,
  PlayerTelemetryPayload,
  PublicRoomSummary,
  RoomSnapshot,
  ServerWsMessage,
} from '../types/multiplayer';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected';

type SnapshotListener = (room: RoomSnapshot | null) => void;
type RoomsListener = (rooms: PublicRoomSummary[]) => void;
type ActionListener = (event: { playerId: string; playerName: string; action: PlayerActionKind }) => void;
type ErrorListener = (message: string) => void;
type ConnectionListener = (state: ConnectionState, clientId: string | null) => void;

class MultiplayerClient {
  private ws: WebSocket | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private clientId: string | null = null;
  private currentRoom: RoomSnapshot | null = null;
  private reconnectTimer: number | null = null;
  private pingTimer: number | null = null;
  private intentionalClose = false;
  private reconnectAttempts = 0;

  private snapshotListeners = new Set<SnapshotListener>();
  private roomsListeners = new Set<RoomsListener>();
  private actionListeners = new Set<ActionListener>();
  private errorListeners = new Set<ErrorListener>();
  private connListeners = new Set<ConnectionListener>();

  public getClientId(): string | null {
    return this.clientId;
  }

  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  public getCurrentRoom(): RoomSnapshot | null {
    return this.currentRoom;
  }

  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.intentionalClose = false;
    this.setConnectionState('connecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/ws/multiplayer`;
    const socket = new WebSocket(url);
    this.ws = socket;

    socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.setConnectionState('connected');
      this.startHeartbeat();
      this.send({ type: 'room:list' });
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(String(event.data)) as ServerWsMessage;
        this.handleServerMessage(msg);
      } catch {
        // Ignore malformed packet
      }
    };

    socket.onclose = () => {
      this.stopHeartbeat();
      this.ws = null;
      this.setConnectionState('disconnected');
      if (!this.intentionalClose) {
        this.scheduleReconnect();
      }
    };

    socket.onerror = () => {
      // onclose will handle reconnect
    };
  }

  public disconnect(): void {
    this.intentionalClose = true;
    this.stopHeartbeat();
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.currentRoom = null;
    this.clientId = null;
    this.setConnectionState('disconnected');
    this.emitSnapshot(null);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null) return;
    const delay = Math.min(8000, 1000 * Math.pow(1.5, this.reconnectAttempts));
    this.reconnectAttempts += 1;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.pingTimer = window.setInterval(() => {
      this.send({ type: 'ping' });
    }, 12000);
  }

  private stopHeartbeat(): void {
    if (this.pingTimer !== null) {
      window.clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private setConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    for (const cb of this.connListeners) cb(state, this.clientId);
  }

  private emitSnapshot(room: RoomSnapshot | null): void {
    this.currentRoom = room;
    for (const cb of this.snapshotListeners) cb(room);
  }

  private handleServerMessage(msg: ServerWsMessage): void {
    switch (msg.type) {
      case 'welcome':
        this.clientId = msg.clientId;
        this.setConnectionState('connected');
        break;
      case 'room:list':
        for (const cb of this.roomsListeners) cb(msg.rooms);
        break;
      case 'room:snapshot':
        this.emitSnapshot(msg.room);
        break;
      case 'room:left':
        this.emitSnapshot(null);
        break;
      case 'room:error':
        for (const cb of this.errorListeners) cb(msg.message);
        break;
      case 'player:action':
        for (const cb of this.actionListeners) {
          cb({ playerId: msg.playerId, playerName: msg.playerName, action: msg.action });
        }
        break;
      case 'pong':
        break;
    }
  }

  private send(msg: ClientWsMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(msg));
  }

  public requestRoomList(): void {
    this.connect();
    this.send({ type: 'room:list' });
  }

  public createRoom(
    mode: MultiplayerMode,
    targetDistance: MultiplayerTargetDistance,
    isPublic: boolean,
    loadout: PlayerLoadout
  ): void {
    this.connect();
    this.send({ type: 'room:create', mode, targetDistance, isPublic, loadout });
  }

  public joinRoom(code: string, loadout: PlayerLoadout): void {
    this.connect();
    this.send({ type: 'room:join', code, loadout });
  }

  public leaveRoom(): void {
    this.send({ type: 'room:leave' });
    this.emitSnapshot(null);
  }

  public toggleReady(): void {
    this.send({ type: 'room:toggle_ready' });
  }

  public updateLoadout(loadout: PlayerLoadout): void {
    this.send({ type: 'room:update_loadout', loadout });
  }

  public updateConfig(patch: {
    mode?: MultiplayerMode;
    targetDistance?: MultiplayerTargetDistance;
    isPublic?: boolean;
  }): void {
    this.send({ type: 'room:update_config', ...patch });
  }

  public sendChat(text: string): void {
    this.send({ type: 'room:chat', text });
  }

  public startMatch(): void {
    this.send({ type: 'room:start' });
  }

  public requestRematch(): void {
    this.send({ type: 'room:rematch' });
  }

  public sendTelemetry(data: PlayerTelemetryPayload): void {
    this.send({ type: 'player:telemetry', data });
  }

  public sendAction(action: PlayerActionKind): void {
    this.send({ type: 'player:action', action });
  }

  public sendCrash(distanceMeters: number, enemiesDefeated: number, civiliansSaved: number): void {
    this.send({ type: 'player:crash', distanceMeters, enemiesDefeated, civiliansSaved });
  }

  public onSnapshot(cb: SnapshotListener): () => void {
    this.snapshotListeners.add(cb);
    return () => this.snapshotListeners.delete(cb);
  }

  public onRoomsList(cb: RoomsListener): () => void {
    this.roomsListeners.add(cb);
    return () => this.roomsListeners.delete(cb);
  }

  public onAction(cb: ActionListener): () => void {
    this.actionListeners.add(cb);
    return () => this.actionListeners.delete(cb);
  }

  public onError(cb: ErrorListener): () => void {
    this.errorListeners.add(cb);
    return () => this.errorListeners.delete(cb);
  }

  public onConnectionChange(cb: ConnectionListener): () => void {
    this.connListeners.add(cb);
    return () => this.connListeners.delete(cb);
  }
}

export const multiplayerClient = new MultiplayerClient();
