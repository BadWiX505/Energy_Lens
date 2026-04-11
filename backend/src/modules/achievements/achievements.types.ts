/**
 * Achievements Module — Type Definitions
 */

export interface AchievementResponse {
  id: string;
  name: string;
  description: string;
  lucideIconName: string;
  scoreValue: number;
  unlocked: boolean;
  earnedAt?: string;
  isRead: boolean;
  userAchievementId?: string;
}

export interface CommunityStats {
  yourScore: number;
  avgScore: number;
  topScore: number;
  totalHomes: number;
  yourPercentile: number; // 0–100 (how many homes you beat)
}

export interface AchievementsPageResponse {
  achievements: AchievementResponse[];
  communityStats: CommunityStats;
  newAchievements: AchievementResponse[]; // unlocked this session (isRead=false)
  totalScore: number; // up-to-date Home.totalScore after any awards
}
