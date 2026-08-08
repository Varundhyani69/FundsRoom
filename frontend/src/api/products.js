import api from "./axios";

export const getProducts = (params) => api.get("/products", { params });
export const getProductById = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post("/products", data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const adjustStock = (id, data) => api.post(`/products/${id}/stock-adjust`, data);
export const getStockMovements = (params) => api.get("/stock-movements", { params });
