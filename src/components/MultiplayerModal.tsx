import React, { useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  Crown,
  Link2,
  Play,
  RefreshCw,
  Send,
  Shield,
  Swords,
  Trophy,
  Users,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { getBikeById, getMeleeWeaponById } from '../data/gameCatalog';
import { ConnectionState } from '../systems/multiplayerClient';
import { SaveData } from '../types/game';
import {
  MultiplayerMode,
  MultiplayerTargetDistance,
  PublicRoomSummary,
  RoomSnapshot,
} from '../types/multiplayer';

interface MultiplayerModalProps {
  open: boolean;
  save: SaveData;
  connectionState: ConnectionState;
  clientId: string | null;
  room: RoomSnapshot | null;
  publicRooms: PublicRoomSummary[];
  initialJoinCode?: string;
  errorMessage: string | null;
  onClearError: () => void;
  onUpdateRiderName: (name: string) => void;
  onClose: () => void;
  onRefreshRooms: () => void;
  onCreateRoom: (
    mode: MultiplayerMode,
    targetDistance: MultiplayerTargetDistance,
    isPublic: boolean
  ) => void;
  onJoinRoom: (code: string) => void;
  onLeaveRoom: () => void;
  onToggleReady: () => void;
  onUpdateConfig: (patch: {
    mode?: MultiplayerMode;
    targetDistance?: MultiplayerTargetDistance;
    isPublic?: boolean;
  }) => void;
  onSendChat: (text: string) => void;
  onStartMatch: () => void;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  open,
  save,
  connectionState,
  clientId,
  room,
  publicRooms,
  initialJoinCode = '',
  errorMessage,
  onClearError,
  onUpdateRiderName,
  onClose,
  onRefreshRooms,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onToggleReady,
  onUpdateConfig,
  onSendChat,
  onStartMatch,
}) => {
  const [nameDraft, setNameDraft] = useState(save.riderName);
  const [createMode, setCreateMode] = useState<MultiplayerMode>('coop');
  const [createTarget, setCreateTarget] = useState<MultiplayerTargetDistance>(1500);
  const [createPublic, setCreatePublic] = useState(true);
  const [joinCode, setJoinCode] = useState(initialJoinCode);
  const [chatText, setChatText] = useState('');
  const [copiedType, setCopiedType] = useState<'code' | 'link' | null>(null);

  useEffect(() => {
    setNameDraft(save.riderName);
  }, [save.riderName]);

  useEffect(() => {
    if (initialJoinCode) {
      setJoinCode(initialJoinCode.toUpperCase());
    }
  }, [initialJoinCode]);

  if (!open) return null;

  const localPlayer = room?.players.find((p) => p.id === clientId) ?? null;
  const isHost = Boolean(localPlayer?.isHost);
  const othersAllReady =
    room?.players.filter((p) => !p.isHost).every((p) => p.ready) ?? true;

  const commitName = () => {
    const clean = nameDraft.trim().slice(0, 18) || 'Rider Nusantara';
    setNameDraft(clean);
    onUpdateRiderName(clean);
  };

  const handleCopy = async (kind: 'code' | 'link') => {
    if (!room) return;
    try {
      const value =
        kind === 'code'
          ? room.code
          : `${window.location.origin}/?room=${room.code}`;
      await navigator.clipboard.writeText(value);
      setCopiedType(kind);
      window.setTimeout(() => setCopiedType(null), 2000);
    } catch {
      // Clipboard blocked in restricted browser context
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;
    onSendChat(chatText);
    setChatText('');
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/82 flex items-start sm:items-center justify-center pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] px-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl hud-panel-amber hud-chamfer p-4 sm:p-6 text-slate-100 my-auto max-h-[90vh] overflow-y-auto hud-scroll">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Users className="w-5 h-5 text-rose-400 shrink-0" />
            <div className="min-w-0">
              <h2 className="font-display text-lg sm:text-xl font-bold text-white truncate">
                MULTIPLAYER ONLINE
              </h2>
              <div className="flex items-center gap-1.5 text-[10px] font-mono-tabular">
                {connectionState === 'connected' ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Wifi className="w-3 h-3" /> SERVER ONLINE
                  </span>
                ) : connectionState === 'connecting' ? (
                  <span className="text-amber-300 flex items-center gap-1">
                    <Wifi className="w-3 h-3" /> MENYAMBUNG...
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1">
                    <WifiOff className="w-3 h-3" /> TERPUTUS
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Multiplayer"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Toast */}
        {errorMessage && (
          <div className="mt-3 bg-rose-950/85 border border-rose-500/60 rounded-lg px-3 py-2 flex items-center justify-between gap-2 text-xs text-rose-200">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={onClearError}
              className="text-rose-300 hover:text-white font-bold cursor-pointer px-1"
            >
              ×
            </button>
          </div>
        )}

        {/* Rider Identity Bar */}
        <div className="mt-3 bg-slate-900/95 border border-white/10 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Nama Rider:</span>
            <input
              type="text"
              maxLength={18}
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  commitName();
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="bg-slate-950 border border-white/15 focus:border-yellow-400 rounded px-2.5 py-1 text-xs font-semibold text-white w-40 outline-none"
            />
          </div>
          <div className="text-[11px] font-mono-tabular text-amber-300">
            {getBikeById(save.selectedBikeId).name} · {getMeleeWeaponById(save.selectedMeleeWeapon).name}
          </div>
        </div>

        {!room ? (
          /* Lobby Browser: Create Room or Join Room */
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            {/* Create Room Panel */}
            <div className="bg-slate-900/95 border border-amber-400/25 rounded-xl p-4 flex flex-col justify-between gap-3">
              <div className="space-y-3">
                <div className="font-display font-bold text-sm text-yellow-400 tracking-wide">
                  BUAT ROOM BARU
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 mb-1.5">Mode Permainan</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCreateMode('coop')}
                      className={`p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                        createMode === 'coop'
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                          : 'bg-slate-950 border-white/10 text-slate-300'
                      }`}
                    >
                      <div className="text-xs font-display font-bold flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5" /> Co-Op Konvoi
                      </div>
                      <div className="text-[10px] opacity-80 mt-0.5">
                        Kompak lawan begal (+25% koin)
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateMode('race')}
                      className={`p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                        createMode === 'race'
                          ? 'bg-rose-500/20 border-rose-400 text-rose-200'
                          : 'bg-slate-950 border-white/10 text-slate-300'
                      }`}
                    >
                      <div className="text-xs font-display font-bold flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5" /> Balap Duel
                      </div>
                      <div className="text-[10px] opacity-80 mt-0.5">
                        Adu cepat &amp; jarak terjauh
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 mb-1.5">Target Finis</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { v: 1500, label: '1.500 m' },
                        { v: 3000, label: '3.000 m' },
                        { v: 0, label: 'Endless' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() => setCreateTarget(opt.v)}
                        className={`min-h-[34px] rounded-md text-xs font-semibold cursor-pointer ${
                          createTarget === opt.v
                            ? 'bg-yellow-400 text-slate-950'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Visibilitas Room</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCreatePublic(true)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                        createPublic ? 'bg-sky-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      Publik
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreatePublic(false)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                        !createPublic ? 'bg-sky-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      Privat
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  commitName();
                  onCreateRoom(createMode, createTarget, createPublic);
                }}
                className="w-full min-h-[44px] bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 text-slate-950 font-display font-bold text-sm rounded-lg cursor-pointer whitespace-nowrap"
              >
                BUAT ROOM &amp; UNDANG TEMAN
              </button>
            </div>

            {/* Join Room + Public Room List */}
            <div className="bg-slate-900/95 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
              <div className="font-display font-bold text-sm text-sky-400 tracking-wide">
                GABUNG ROOM
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="KODE (cth: BR4K)"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && joinCode.trim()) {
                      commitName();
                      onJoinRoom(joinCode.trim());
                    }
                  }}
                  className="flex-1 bg-slate-950 border border-white/15 focus:border-sky-400 rounded-lg px-3 py-2 text-sm font-mono-tabular font-bold text-white uppercase tracking-widest outline-none"
                />
                <button
                  type="button"
                  disabled={!joinCode.trim()}
                  onClick={() => {
                    commitName();
                    onJoinRoom(joinCode.trim());
                  }}
                  className="min-h-[40px] px-4 bg-sky-500 hover:bg-sky-400 disabled:opacity-45 text-slate-950 font-display font-bold text-xs rounded-lg cursor-pointer whitespace-nowrap"
                >
                  GABUNG
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-400">Room Publik Aktif</span>
                <button
                  type="button"
                  onClick={onRefreshRooms}
                  className="text-xs text-sky-300 hover:text-sky-200 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Muat Ulang
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 hud-scroll">
                {publicRooms.length === 0 ? (
                  <div className="bg-slate-950/75 border border-white/8 rounded-lg p-4 text-center text-xs text-slate-400">
                    Belum ada room publik aktif. Buat room baru lalu bagikan kodenya ke teman!
                  </div>
                ) : (
                  publicRooms.map((r) => (
                    <div
                      key={r.code}
                      className="bg-slate-950 border border-white/10 rounded-lg p-2.5 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono-tabular font-bold text-yellow-400 text-xs">
                            #{r.code}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                              r.mode === 'coop'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {r.mode === 'coop' ? 'Co-Op' : 'Duel'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono-tabular">
                            {r.targetDistance > 0 ? `${r.targetDistance}m` : 'Endless'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-300 truncate mt-0.5">
                          Host: {r.hostName} · {r.playerCount}/{r.maxPlayers} Rider
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={r.status !== 'waiting' || r.playerCount >= r.maxPlayers}
                        onClick={() => {
                          commitName();
                          onJoinRoom(r.code);
                        }}
                        className="min-h-[34px] px-3 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-slate-950 font-display font-bold text-xs rounded-md cursor-pointer shrink-0 whitespace-nowrap"
                      >
                        {r.status === 'waiting' ? 'Masuk' : 'Balapan'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Active Room Waiting Lobby & Countdown */
          <div className="mt-4 space-y-3">
            {room.status === 'countdown' && (
              <div className="bg-gradient-to-r from-amber-500/25 via-yellow-400/25 to-amber-500/25 border border-yellow-400 rounded-xl p-4 text-center">
                <div className="text-xs font-mono-tabular tracking-[0.22em] text-yellow-300 uppercase">
                  BERSIAP DI GARIS START
                </div>
                <div className="font-display text-5xl font-bold text-white mt-1 tabular-nums">
                  {room.countdownSec}
                </div>
              </div>
            )}

            {/* Room Code & Share Strip */}
            <div className="bg-slate-900/95 border border-yellow-400/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-widest">
                  Kode Room · {room.mode === 'coop' ? 'CO-OP KONVOI' : 'BALAP DUEL'} ·{' '}
                  {room.targetDistance > 0 ? `${room.targetDistance}M` : 'ENDLESS'}
                </div>
                <div className="font-mono-tabular text-2xl font-bold text-yellow-400 tracking-[0.22em]">
                  {room.code}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy('code')}
                  className="min-h-[36px] px-3 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  {copiedType === 'code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedType === 'code' ? 'Kode Tersalin' : 'Salin Kode'}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy('link')}
                  className="min-h-[36px] px-3 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 rounded-lg text-xs font-semibold text-sky-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  {copiedType === 'link' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5" />}
                  {copiedType === 'link' ? 'Link Tersalin' : 'Link Undang'}
                </button>
              </div>
            </div>

            {/* Host Room Settings Bar */}
            {isHost && room.status === 'waiting' && (
              <div className="bg-slate-900/80 border border-white/10 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onUpdateConfig({ mode: 'coop' })}
                    className={`px-2.5 py-1 rounded font-semibold cursor-pointer ${
                      room.mode === 'coop' ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    Co-Op
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateConfig({ mode: 'race' })}
                    className={`px-2.5 py-1 rounded font-semibold cursor-pointer ${
                      room.mode === 'race' ? 'bg-rose-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    Balap Duel
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {([1500, 3000, 0] as const).map((dist) => (
                    <button
                      key={dist}
                      type="button"
                      onClick={() => onUpdateConfig({ targetDistance: dist })}
                      className={`px-2.5 py-1 rounded font-semibold cursor-pointer ${
                        room.targetDistance === dist
                          ? 'bg-yellow-400 text-slate-950'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {dist > 0 ? `${dist}m` : 'Endless'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Player Slots (Max 4 Riders) */}
            <div className="grid sm:grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, idx) => {
                const p = room.players.find((pl) => pl.slotIndex === idx);
                if (!p) {
                  return (
                    <div
                      key={idx}
                      className="bg-slate-950/60 border border-dashed border-white/10 rounded-lg p-3 flex items-center justify-center text-xs text-slate-500 min-h-[64px]"
                    >
                      Slot #{idx + 1} · Menunggu Rider...
                    </div>
                  );
                }
                const isMe = p.id === clientId;
                return (
                  <div
                    key={p.id}
                    className={`border rounded-lg p-3 flex items-center justify-between gap-2 ${
                      p.ready
                        ? 'bg-emerald-950/25 border-emerald-400/45'
                        : 'bg-slate-900/95 border-white/12'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 font-semibold text-sm text-white">
                        {p.isHost && <Crown className="w-3.5 h-3.5 text-yellow-400 shrink-0" />}
                        <span className="truncate">
                          {p.name} {isMe ? '(Kamu)' : ''}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 truncate">
                        <span>{getBikeById(p.bikeId).name}</span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <Swords className="w-3 h-3 text-amber-400" />
                          {getMeleeWeaponById(p.meleeId).name}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`px-2.5 py-1 rounded text-[10px] font-display font-bold shrink-0 ${
                        p.ready
                          ? 'bg-emerald-400 text-slate-950 flex items-center gap-1'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {p.ready && <CheckCircle2 className="w-3 h-3" />}
                      {p.ready ? 'SIAP' : 'TUNGGU'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Real-time Room Chat */}
            <div className="bg-slate-950/90 border border-white/10 rounded-xl p-3 space-y-2">
              <div className="h-28 overflow-y-auto space-y-1 pr-1 hud-scroll text-xs">
                {room.chat.map((c) => (
                  <div key={c.id} className={c.system ? 'text-amber-300/90' : 'text-slate-200'}>
                    <span className="font-bold">{c.senderName}: </span>
                    <span>{c.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {['Gas!', 'Siap!', 'Awas Begal!', 'Bantu Warga!'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => onSendChat(preset)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <form onSubmit={handleChatSubmit} className="flex gap-2">
                <input
                  type="text"
                  maxLength={120}
                  placeholder="Tulis pesan ke teman room..."
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  className="flex-1 bg-slate-900 border border-white/15 focus:border-yellow-400 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                />
                <button
                  type="submit"
                  className="min-h-[34px] px-3 bg-slate-800 hover:bg-slate-700 text-yellow-400 rounded-lg flex items-center gap-1 text-xs font-semibold cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            {/* Room Footer Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={onLeaveRoom}
                className="min-h-[42px] px-4 bg-rose-950/75 hover:bg-rose-900 border border-rose-500/40 text-rose-200 text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap"
              >
                Keluar Room
              </button>

              <div className="flex items-center gap-2 ml-auto">
                {!isHost && room.status === 'waiting' && (
                  <button
                    type="button"
                    onClick={onToggleReady}
                    className={`min-h-[42px] px-5 font-display font-bold text-sm rounded-lg cursor-pointer whitespace-nowrap ${
                      localPlayer?.ready
                        ? 'bg-slate-800 text-slate-200 border border-white/15'
                        : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
                    }`}
                  >
                    {localPlayer?.ready ? 'BATAL SIAP' : 'SIAP BALAP!'}
                  </button>
                )}

                {isHost && room.status === 'waiting' && (
                  <button
                    type="button"
                    disabled={!othersAllReady}
                    onClick={onStartMatch}
                    className="min-h-[42px] px-5 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 disabled:opacity-45 text-slate-950 font-display font-bold text-sm rounded-lg flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <Play className="w-4 h-4 fill-slate-950" />
                    {othersAllReady ? 'MULAI BALAP!' : 'TUNGGU RIDER SIAP'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
