// src/services/authService.ts
import axiosClient from "@/src/lib/axiosClient";

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

export interface ResetPasswordData {
  email: string;
  otpCode: string;
  newPassword: string;
}

export interface GoogleData {
  idToken: string;
}

export const authService = {
  login: (data: LoginData) => {
    return axiosClient.post("/auth/login", data);
  },
  
  register: (data: RegisterData) => {
    return axiosClient.post("/auth/register", data);
  },
  
  verifyEmail: (otp: string) => {
    return axiosClient.post(`/auth/verify-email?otp=${otp}`);
  },

  resendOtp: (email: string) => {
    return axiosClient.post(`/auth/resend-otp?email=${email}`);
  },
  
  // Sau này có quên mật khẩu thì viết tiếp vào đây...
  forgotPassword: (email: string) => {
    return axiosClient.post(`/auth/forgot-password?email=${email}`);
  },

  resetPassword: (data: ResetPasswordData) => {
    return axiosClient.post("/auth/reset-password", data);
  },

  resendForgotPasswordOtp: (email: string) => {
    return axiosClient.post(`/auth/resend-forgot-password-otp?email=${email}`);
  },

  googleLogin: (data: GoogleData) => {
    return axiosClient.post("/auth/google", data);
  }
};