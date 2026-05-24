import { useState } from "react";
import { useAuth } from "./useAuth";
import { updateProgression as updateProgressionService } from "../services/progressionService";
import { GameDifficulty } from "../types";

export const useProgression = () => {
  const { profile } = useAuth();
  const [levelUpData, setLevelUpData] = useState<{
    show: boolean;
    level: number;
    xpGained: number;
    achievements: string[];
  }>({
    show: false,
    level: 1,
    xpGained: 0,
    achievements: []
  });

  const completeGame = async (
    gameId: string, 
    gameTitle: string, 
    outcome: "win" | "loss" | "draw", 
    difficulty: GameDifficulty = "Medium",
    isMultiplayer: boolean = false,
    gameSpecificData?: any
  ) => {
    if (!profile) return;

    try {
      const result = await updateProgressionService(
        profile,
        gameId,
        gameTitle,
        outcome,
        difficulty,
        isMultiplayer,
        gameSpecificData
      );

      if (result.hasLeveledUp || result.newAchievements.length > 0) {
        setLevelUpData({
          show: true,
          level: result.newLevel,
          xpGained: result.xpGained,
          achievements: result.newAchievements
        });
      }

      return result;
    } catch (error) {
      console.error("Progression update failed:", error);
    }
  };

  const closeLevelUp = () => {
    setLevelUpData(prev => ({ ...prev, show: false }));
  };

  return {
    completeGame,
    levelUpData,
    closeLevelUp
  };
};
