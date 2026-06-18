import axiosClient from "@/src/lib/axiosClient";

export interface Challenge {
    id: number;
    title: string;
    description: string;
    points: number;
    startDate: string;
    endDate: string;
}

export const challengeService = {
    getAllChallenges: (page = 0, size = 20) => {
        return axiosClient.get(`/challenges?page=${page}&size=${size}`);
    },
    
    createChallenge: (data: Challenge) => {
        return axiosClient.post('/challenges', data);
    },

    submitQuizAttempt: async (payload: {
        challengeId: number;
        answers: { questionId: number; selectedAnswerId: number }[];
    }) => {
        return axiosClient.post('/user-challenges/join', payload);
    },

    getQuizResult: async (challengeId: number) => {
        return axiosClient.get(`/user-challenges/${challengeId}/result`);
    }
};