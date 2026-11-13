import { CellState, PlayerSymbol } from '../types/game';

export interface RoomState {
  roomCode: string;
  hostId: string;
  hostName: string;
  guestId?: string;
  guestName?: string;
  isHostReady: boolean;
  isGuestReady: boolean;
  gameStarted: boolean;
  currentTurn: 'host' | 'guest';
  board: CellState[];
  winner: PlayerSymbol | 'draw' | null;
  rematchRequestedBy?: 'host' | 'guest';
}

export type MultiplayerEvent =
  | { type: 'JOIN_ROOM'; roomCode: string; guestId: string; guestName: string }
  | { type: 'PLAYER_READY'; roomCode: string; role: 'host' | 'guest' }
  | { type: 'MOVE_MADE'; roomCode: string; role: 'host' | 'guest'; index: number; symbol: PlayerSymbol }
  | { type: 'REQUEST_REMATCH'; roomCode: string; role: 'host' | 'guest' }
  | { type: 'LEAVE_ROOM'; roomCode: string; role: 'host' | 'guest' };

export class MultiplayerManager {
  private channel: BroadcastChannel | null = null;
  private currentRoom: RoomState | null = null;
  private myRole: 'host' | 'guest' | null = null;
  private myPlayerId: string;
  private onStateChangeCallback?: (state: RoomState | null) => void;

  constructor() {
    this.myPlayerId = 'player_' + Math.random().toString(36).substring(2, 9);
    try {
      this.channel = new BroadcastChannel('beyond_the_grid_multiplayer');
      this.channel.onmessage = (event: MessageEvent<MultiplayerEvent>) => {
        this.handleIncomingEvent(event.data);
      };
    } catch {
      // BroadcastChannel not available in unsupported environment
    }
  }

  public subscribe(callback: (state: RoomState | null) => void): () => void {
    this.onStateChangeCallback = callback;
    callback(this.currentRoom);
    return () => {
      this.onStateChangeCallback = undefined;
    };
  }

  public createRoom(hostName: string): RoomState {
    const roomCode = 'GRID-' + Math.floor(1000 + Math.random() * 9000);
    this.myRole = 'host';
    this.currentRoom = {
      roomCode,
      hostId: this.myPlayerId,
      hostName,
      isHostReady: true,
      isGuestReady: false,
      gameStarted: false,
      currentTurn: 'host',
      board: Array(9).fill(null),
      winner: null,
    };
    this.notifyState();
    return this.currentRoom;
  }

  public joinRoom(roomCode: string, guestName: string): boolean {
    this.myRole = 'guest';
    const event: MultiplayerEvent = {
      type: 'JOIN_ROOM',
      roomCode: roomCode.trim().toUpperCase(),
      guestId: this.myPlayerId,
      guestName,
    };
    this.channel?.postMessage(event);
    return true;
  }

  public sendMove(index: number, symbol: PlayerSymbol): boolean {
    if (!this.currentRoom || !this.myRole) return false;
    if (this.currentRoom.currentTurn !== this.myRole) return false;
    if (this.currentRoom.board[index] !== null) return false;
    if (this.currentRoom.winner !== null) return false;

    // Apply move locally
    const newBoard = [...this.currentRoom.board];
    newBoard[index] = symbol;

    this.currentRoom = {
      ...this.currentRoom,
      board: newBoard,
      currentTurn: this.myRole === 'host' ? 'guest' : 'host',
    };

    const event: MultiplayerEvent = {
      type: 'MOVE_MADE',
      roomCode: this.currentRoom.roomCode,
      role: this.myRole,
      index,
      symbol,
    };
    this.channel?.postMessage(event);
    this.notifyState();
    return true;
  }

  public requestRematch(): void {
    if (!this.currentRoom || !this.myRole) return;
    const event: MultiplayerEvent = {
      type: 'REQUEST_REMATCH',
      roomCode: this.currentRoom.roomCode,
      role: this.myRole,
    };
    this.channel?.postMessage(event);
  }

  public leaveRoom(): void {
    if (this.currentRoom && this.myRole) {
      const event: MultiplayerEvent = {
        type: 'LEAVE_ROOM',
        roomCode: this.currentRoom.roomCode,
        role: this.myRole,
      };
      this.channel?.postMessage(event);
    }
    this.currentRoom = null;
    this.myRole = null;
    this.notifyState();
  }

  public getRole(): 'host' | 'guest' | null {
    return this.myRole;
  }

  public getCurrentRoom(): RoomState | null {
    return this.currentRoom;
  }

  private handleIncomingEvent(event: MultiplayerEvent): void {
    if (!this.currentRoom && event.type !== 'JOIN_ROOM') return;

    switch (event.type) {
      case 'JOIN_ROOM':
        if (this.myRole === 'host' && this.currentRoom?.roomCode === event.roomCode) {
          this.currentRoom = {
            ...this.currentRoom,
            guestId: event.guestId,
            guestName: event.guestName,
            isGuestReady: true,
            gameStarted: true,
          };
          this.notifyState();
        }
        break;

      case 'MOVE_MADE':
        if (this.currentRoom?.roomCode === event.roomCode && event.role !== this.myRole) {
          const newBoard = [...this.currentRoom.board];
          newBoard[event.index] = event.symbol;
          this.currentRoom = {
            ...this.currentRoom,
            board: newBoard,
            currentTurn: this.myRole,
          };
          this.notifyState();
        }
        break;

      case 'LEAVE_ROOM':
        if (this.currentRoom?.roomCode === event.roomCode && event.role !== this.myRole) {
          alert('Opponent has left the multiplayer room.');
          this.currentRoom = null;
          this.myRole = null;
          this.notifyState();
        }
        break;

      case 'REQUEST_REMATCH':
        if (this.currentRoom?.roomCode === event.roomCode) {
          if (this.currentRoom.rematchRequestedBy && this.currentRoom.rematchRequestedBy !== event.role) {
            // Both requested rematch -> reset board!
            this.currentRoom = {
              ...this.currentRoom,
              board: Array(9).fill(null),
              winner: null,
              rematchRequestedBy: undefined,
              currentTurn: 'host',
            };
          } else {
            this.currentRoom = {
              ...this.currentRoom,
              rematchRequestedBy: event.role,
            };
          }
          this.notifyState();
        }
        break;
    }
  }

  private notifyState(): void {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(this.currentRoom ? { ...this.currentRoom } : null);
    }
  }
}
