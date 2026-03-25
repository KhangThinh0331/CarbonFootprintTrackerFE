import axiosClient from "@/src/lib/axiosClient";

export const userService = {
  getMyProfile: () => {
    return axiosClient.get("/users/me");
  },
}