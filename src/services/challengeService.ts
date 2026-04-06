import axiosClient from "@/src/lib/axiosClient";

export interface Challenge {
    id: number;
    title: string;
    description: string;
    points: number;
    targetCo2: number;
    startDate: string;
    endDate: string;
}

export const challengeService = {
    getAllChallenges: (page = 0, size = 20) => {
        return axiosClient.get(`/challenges?page=${page}&size=${size}`);
    },
    
    createChallenge: (data: Challenge) => {
        return axiosClient.post('/challenges', data);
    }
};