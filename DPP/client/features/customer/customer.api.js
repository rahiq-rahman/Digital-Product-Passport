import api from "../shared/api";

export const getMyProducts  = ()         => api.get("/customer/products");
export const getMyPassport  = (product_id) => api.get(`/customer/passport/${product_id}`);
export const transferProduct = (data)    => api.post("/customer/transfer", data);

// Keep this for manufacturer passport view (uses general passport route)
export const getPassport = (product_id) => api.get(`/passport/${product_id}`);