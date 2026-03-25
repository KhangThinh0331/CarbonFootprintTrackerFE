import axiosClient from "@/src/lib/axiosClient";

export const leaderboardService = {
  getMonthlyRanking: () => {
    return axiosClient.get("/leaderboard/monthly");
  }
};