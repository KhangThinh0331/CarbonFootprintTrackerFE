import axiosClient from "@/src/lib/axiosClient";

export interface Goal {
    id: number;
    goalName: string;
    targetValue: number;
    currentValue: number;
    deadline: string;
    status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
}

export const goalService = {
    getMyGoals: (page: number, size: number, status?: string) => {
        let url = `/goals?page=${page}&size=${size}`;
        if (status && status !== 'ALL') {
            url += `&status=${status}`;
        }
        return axiosClient.get(url);
    },

    createGoal: (data: { goalName: string; targetValue: number; deadline: string }) => {
        return axiosClient.post('/goals', data);
    },

    updateProgress: (goalId: number, addedValue: number) => {
        return axiosClient.put(`/goals/${goalId}/progress?addedValue=${addedValue}`);
    }
};