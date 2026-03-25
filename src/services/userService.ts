import axiosClient from "@/src/lib/axiosClient";

export const userService = {
  getMyProfile: () => {
    return axiosClient.get("/users/me");
  },

  updateProfile: (data: { fullName: string; avatarUrl: string; targetCo2Month: number }) => {
    return axiosClient.put("/users/me", data);
  },
   
  changePassword: (data: { oldPassword: string; newPassword: string; }) => {
    return axiosClient.put("/users/me/password", data);
  }
}