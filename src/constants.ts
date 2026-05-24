import { Game } from "./types";

export const GAMES: Game[] = [
  {
    id: "tic-tac-toe",
    title: "Tic Tac Toe",
    description: "Classic 3x3 grid game. Play against a friend or AI.",
    category: "Strategy",
    thumbnail: "https://images.unsplash.com/photo-1611996575749-79a3a250f948?q=80&w=400&h=300&auto=format&fit=crop",
    isMultiplayer: true,
    minPlayers: 1,
    maxPlayers: 2
  },
  {
    id: "snake",
    title: "Snake Game",
    description: "Navigate the snake to eat food and grow without hitting walls.",
    category: "Arcade",
    thumbnail: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=400&h=300&auto=format&fit=crop",
    isMultiplayer: false
  },
  {
    id: "simon-says",
    title: "Simon Says",
    description: "Listen to the sounds and repeat the sequence of lights.",
    category: "Puzzle",
    thumbnail: "https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=400&h=300&auto=format&fit=crop",
    isMultiplayer: false
  },
  {
    id: "memory-match",
    title: "Memory Match",
    description: "Flip cards and find all the matching pairs.",
    category: "Puzzle",
    thumbnail: "https://images.unsplash.com/photo-1606337329931-57a500ad99d0?q=80&w=400&h=300&auto=format&fit=crop",
    isMultiplayer: false
  },
  {
    id: "rock-paper-scissors",
    title: "Rock Paper Scissors",
    description: "Classic hand game. Fast paced fun.",
    category: "Action",
    thumbnail: "https://images.unsplash.com/photo-1546776310-eef45dd6d63c?q=80&w=400&h=300&auto=format&fit=crop",
    isMultiplayer: true,
    minPlayers: 2,
    maxPlayers: 2
  },
  {
    id: "wordle-clone",
    title: "Wordle",
    description: "Guess the five-letter word in six attempts.",
    category: "Puzzle",
    thumbnail: "https://images.unsplash.com/photo-1591115765373-520b7a21769b?q=80&w=400&h=300&auto=format&fit=crop",
    isMultiplayer: false
  },
  {
    id: "typing-speed",
    title: "Typing Speed",
    description: "Test how fast you can type with accuracy.",
    category: "Arcade",
    thumbnail: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=400&h=300&auto=format&fit=crop",
    isMultiplayer: false
  },
  {
    id: "whack-a-mole",
    title: "Whack-a-Mole",
    description: "Hit the moles as they pop out of the holes.",
    category: "Action",
    thumbnail: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=400&h=300&auto=format&fit=crop",
    isMultiplayer: false
  },
  {
    id: "2048",
    title: "2048",
    description: "Merge identical tiles to reach the 2048 tile.",
    category: "Puzzle",
    thumbnail: "https://images.unsplash.com/photo-1614332284149-6f96611f7ca0?q=80&w=400&h=300&auto=format&fit=crop",
    isMultiplayer: false
  },
  {
    id: "connect-4",
    title: "Connect 4",
    description: "Be the first to connect four of your colored discs.",
    category: "Strategy",
    thumbnail: "https://images.unsplash.com/photo-1611195974226-a6a9be9dd763?q=80&w=400&h=300&auto=format&fit=crop",
    isMultiplayer: true,
    minPlayers: 2,
    maxPlayers: 2
  },
  {
    id: "ludo",
    title: "Ludo",
    description: "Multiplayer strategy board game for two to four players.",
    category: "Strategy",
    thumbnail: "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?q=80&w=400&h=300&auto=format&fit=crop",
    isMultiplayer: true,
    minPlayers: 2,
    maxPlayers: 4
  },
  {
    id: "snakes-and-ladders",
    title: "Snakes & Ladders",
    description: "Classic board game. Climb ladders and avoid snakes to reach 100.",
    category: "Strategy",
    thumbnail: "https://images.unsplash.com/photo-1633545505096-75f9226ac481?q=80&w=400&h=300&auto=format&fit=crop",
    isMultiplayer: true,
    minPlayers: 2,
    maxPlayers: 4
  }
];

export const CATEGORIES = ["All", "Strategy", "Action", "Puzzle", "Arcade", "Multiplayer"];
