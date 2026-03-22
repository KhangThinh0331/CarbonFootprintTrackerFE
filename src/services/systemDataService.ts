import axiosClient from "@/src/lib/axiosClient";

export const systemDataService = {
  getAllCategories: () => {
    return axiosClient.get("/categories");
  },
  
  getFactorsByCategory: (categoryId: number) => {
    return axiosClient.get(`/emission-factors/category/${categoryId}`);
  }
};