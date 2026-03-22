// src/services/activityLogService.ts
import axiosClient from "@/src/lib/axiosClient";

// Định nghĩa cấu trúc dữ liệu gửi lên Spring Boot (Khớp với DTO ở Backend)
export interface ActivityLogRequest {
  factorId: number;
  quantity: number;
  note?: string;
}

export const activityLogService = {
  // 1. Lưu một hoạt động mới (VD: Đi xe máy 10km)
  logActivity: (data: ActivityLogRequest) => {
    return axiosClient.post("/activity-logs", data); 
  },
  
  // 2. Lấy danh sách lịch sử hoạt động của User đang đăng nhập
  getMyLogs: (page: number = 0, size: number = 20) => {
    return axiosClient.get(`/activity-logs?page=${page}&size=${size}`);
  },

  // 3. Lấy tổng lượng CO2 trong tháng (nếu Backend có API này, nếu chưa có ta sẽ tính ở Frontend tạm)
  getTotalCo2: () => {
    return axiosClient.get("/activity-logs/total-co2");
  },

  getChartData: () => {
    return axiosClient.get("/activity-logs/chart-data");
  }
};