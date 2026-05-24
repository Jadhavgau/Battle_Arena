export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  email: string;
  xp: number;
  level: number;
  totalGamesPlayed: number;
  totalWins: number;
  totalLosses: number;
  multiplayerWins: number;
  winStrike: number;
  maxWinStrike: number;
  achievements: string[];
  favorites: string[];
  lastPlayed?: string;
  lastPlayedGameId?: string;
  createdAt: string;
}

export type GameDifficulty = "Easy" | "Medium" | "Hard" | "Extreme";

export interface Game {
  id: string;
  title: string;
  description: string;
  category: "Strategy" | "Action" | "Puzzle" | "Arcade" | "Multiplayer";
  thumbnail: string;
  isMultiplayer: boolean;
  minPlayers?: number;
  maxPlayers?: number;
}

export interface LeaderboardEntry {
  gameId: string;
  uid: string;
  displayName: string;
  photoURL: string;
  score: number;
  timestamp: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  requirement: (profile: UserProfile, gameSpecificData?: any) => boolean;
}

export interface Activity {
  id: string;
  uid: string;
  gameId: string;
  gameTitle: string;
  xpGained: number;
  outcome: "win" | "loss" | "draw";
  timestamp: string;
  difficulty?: GameDifficulty;
}

export interface SocketPlayer {
  id: string;
  uid: string;
  displayName: string;
  photoURL: string;
  isReady: boolean;
  symbol?: string; // For TicTacToe etc
}

export interface GameRoom {
  id: string;
  gameId: string;
  players: SocketPlayer[];
  status: "waiting" | "playing" | "finished";
  gameState: any;
  hostId: string;
}
