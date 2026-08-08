import api from "./axios";

export const getCustomers = (params) => api.get("/customers", { params });
export const getCustomerById = (id) => api.get(`/customers/${id}`);
export const createCustomer = (data) => api.post("/customers", data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data);
export const addFollowup = (id, data) => api.post(`/customers/${id}/followups`, data);
