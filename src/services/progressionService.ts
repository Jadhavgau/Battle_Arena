import { db } from "../lib/firebase";
import { doc, updateDoc, increment, arrayUnion, setDoc, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { UserProfile, Achievement, Activity, GameDifficulty } from "../types";

export const XP_PER_LEVEL = 1000;
export const XP_MULTIPLIER = 1.5;

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-victory",
    name: "First Victory",
    description: "Secure your first win in any game",
    icon: "🏆",
    xpReward: 100,
    requirement: (profile) => profile.totalWins >= 1
  },
  {
    id: "tic-tac-toe-master",
    name: "Tic Tac Toe Master",
    description: "Win 10 games of Tic Tac Toe",
    icon: "❌",
    xpReward: 250,
    requirement: (profile, data) => data?.gameId === "tic-tac-toe" && profile.totalWins >= 10
  },
  {
    id: "speed-demon",
    name: "Speed Demon",
    description: "Reach 80+ WPM in Typing Speed",
    icon: "⚡",
    xpReward: 300,
    requirement: (profile, data) => data?.gameId === "typing-speed" && data?.wpm >= 80
  },
  {
    id: "multiplayer-warrior",
    name: "Multiplayer Warrior",
    description: "Win 5 multiplayer matches",
    icon: "⚔️",
    xpReward: 500,
    requirement: (profile) => profile.multiplayerWins >= 5
  },
  {
    id: "arena-champion",
    name: "Arena Champion",
    description: "Reach Level 5",
    icon: "🏅",
    xpReward: 1000,
    requirement: (profile) => profile.level >= 5
  },
  {
    id: "win-streak-5",
    name: "Unstoppable",
    description: "Reach a 5-win streak",
    icon: "🔥",
    xpReward: 400,
    requirement: (profile) => profile.winStrike >= 5
  }
];

export const calculateXP = (outcome: "win" | "loss" | "draw", difficulty: GameDifficulty = "Medium", isMultiplayer: boolean = false) => {
  let baseXP = 50;
  if (outcome === "win") baseXP = 200;
  if (outcome === "draw") baseXP = 100;

  const difficultyMultipliers: Record<GameDifficulty, number> = {
    "Easy": 0.8,
    "Medium": 1,
    "Hard": 1.5,
    "Extreme": 2.5
  };

  let finalXP = baseXP * difficultyMultipliers[difficulty];
  if (isMultiplayer) finalXP *= 1.2;

  return Math.round(finalXP);
};

export const getXPForLevel = (level: number) => {
  return Math.floor(XP_PER_LEVEL * Math.pow(XP_MULTIPLIER, level - 1));
};

export const updateProgression = async (
  profile: UserProfile, 
  gameId: string, 
  gameTitle: string,
  outcome: "win" | "loss" | "draw", 
  difficulty: GameDifficulty = "Medium",
  isMultiplayer: boolean = false,
  gameSpecificData?: any
) => {
  const xpGained = calculateXP(outcome, difficulty, isMultiplayer);
  
  const newXP = profile.xp + xpGained;
  const nextLevelXP = getXPForLevel(profile.level);
  
  let newLevel = profile.level;
  let hasLeveledUp = false;
  
  if (newXP >= nextLevelXP) {
    newLevel += 1;
    hasLeveledUp = true;
  }

  const updates: any = {
    xp: newXP,
    level: newLevel,
    totalGamesPlayed: increment(1),
    lastPlayed: new Date().toISOString(),
    lastPlayedGameId: gameId
  };

  if (outcome === "win") {
    updates.totalWins = increment(1);
    updates.winStrike = increment(1);
    updates.maxWinStrike = Math.max(profile.maxWinStrike, profile.winStrike + 1);
    if (isMultiplayer) updates.multiplayerWins = increment(1);
  } else if (outcome === "loss") {
    updates.totalLosses = increment(1);
    updates.winStrike = 0;
  }

  // Check for achievements
  const newAchievements: string[] = [];
  const updatedProfileMock = { 
    ...profile, 
    ...updates, 
    totalWins: outcome === "win" ? profile.totalWins + 1 : profile.totalWins,
    multiplayerWins: (outcome === "win" && isMultiplayer) ? profile.multiplayerWins + 1 : profile.multiplayerWins,
    winStrike: outcome === "win" ? profile.winStrike + 1 : 0
  } as UserProfile;

  for (const achievement of ACHIEVEMENTS) {
    if (!profile.achievements.includes(achievement.id)) {
      if (achievement.requirement(updatedProfileMock, { gameId, ...gameSpecificData })) {
        newAchievements.push(achievement.id);
        updates.xp += achievement.xpReward; // Bonus XP for achievement
      }
    }
  }

  if (newAchievements.length > 0) {
    updates.achievements = arrayUnion(...newAchievements);
  }

  // Update Firestore
  const userRef = doc(db, "users", profile.uid);
  await updateDoc(userRef, updates);

  // Log activity
  const activityRef = doc(collection(db, "activity"));
  const activity: Activity = {
    id: activityRef.id,
    uid: profile.uid,
    gameId,
    gameTitle,
    xpGained,
    outcome,
    timestamp: new Date().toISOString(),
    difficulty
  };
  await setDoc(activityRef, activity);

  return {
    xpGained,
    hasLeveledUp,
    newLevel,
    newAchievements
  };
};

export const getRecentActivity = async (uid: string, limitCount: number = 5) => {
  const activityQuery = query(
    collection(db, "activity"),
    where("uid", "==", uid),
    orderBy("timestamp", "desc"),
    limit(limitCount)
  );

  const querySnapshot = await getDocs(activityQuery);
  return querySnapshot.docs.map(doc => doc.data() as Activity);
};
