import api from "../shared/api";

export const addProduct = (data) => api.post("/products", data);
export const getMyProducts = () => api.get("/products/my");