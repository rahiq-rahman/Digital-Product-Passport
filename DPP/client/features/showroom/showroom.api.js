import api from "../shared/api";

export const assignProduct = (data) => api.post("/showroom/assign", data);
export const getInventory = () => api.get("/showroom/inventory");
export const transferOwnership = (data) => api.post("/ownership/transfer", data);