import axiosClient from "@/src/lib/axiosClient";

export const leaderboardService = {
  getMonthlyRanking: (q?: string) => {
    const params = q ? { q } : {};
    return axiosClient.get("/leaderboard/monthly", { params });
  }
};