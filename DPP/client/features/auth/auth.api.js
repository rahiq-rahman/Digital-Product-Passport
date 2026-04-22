import api from "../shared/api";

export const loginUser       = (data) => api.post("/auth/login",           data);
export const verifyLoginOTP  = (data) => api.post("/auth/login/verify",    data);
export const registerUser    = (data) => api.post("/auth/register",        data);
export const verifyRegisterOTP = (data) => api.post("/auth/register/verify", data);