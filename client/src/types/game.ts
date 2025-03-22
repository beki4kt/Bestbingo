export interface GameInfo {
  gameId: string;
  playerCount: number;
  stake: number;
  countdown: number;
  currentCall?: number | null;
  calledNumbers: number[];
  boardNumber: number;
}

export interface BingoCard {
  numbers: number[][];
  markedNumbers: number[];
}

export interface UserInfo {
  userId: number;
  username: string;
  wallet: number;
}

export interface WsMessage {
  type: string;
  payload: any;
}
