import axiosClient from "@/src/lib/axiosClient";

export const leaderboardService = {
  getRanking: (q?: string) => {
    const params = q ? { q } : {};
    return axiosClient.get("/leaderboard", { params });
  }
};