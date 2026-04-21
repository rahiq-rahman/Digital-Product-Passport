import api from "../shared/api";

export const addProduct = (data) => api.post("/products", data);
export const getMyProducts = () => api.get("/products/my");
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);
export const sendToShowroom = (data) => api.post("/showroom/assign", data);
export const getAllShowrooms = () => api.get("/showroom/all");