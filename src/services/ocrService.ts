import axiosClient from "@/src/lib/axiosClient";

export const ocrService = {
  // Thay đổi kiểu nhận vào là FormData thay vì File
  scanReceipt: (formData: FormData) => {
    return axiosClient.post("/ocr/scan", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};