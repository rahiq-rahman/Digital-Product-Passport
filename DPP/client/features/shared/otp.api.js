import api from "../shared/api";

// Showroom sale
export const initiateSale    = (data) => api.post("/otp/sale/initiate",    data);
export const confirmSale     = (data) => api.post("/otp/sale/confirm",     data);

// Customer transfer
export const initiateTransfer = (data) => api.post("/otp/transfer/initiate", data);
export const confirmTransfer  = (data) => api.post("/otp/transfer/confirm",  data);

// Repair
export const initiateRepair  = (data) => api.post("/otp/repair/initiate",  data);
export const confirmRepair   = (data) => api.post("/otp/repair/confirm",   data);