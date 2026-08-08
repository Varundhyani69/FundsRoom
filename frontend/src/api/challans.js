import api from "./axios";

export const getChallans = (params) => api.get("/challans", { params });
export const getChallanById = (id) => api.get(`/challans/${id}`);
export const createChallan = (data) => api.post("/challans", data);
export const confirmChallan = (id) => api.put(`/challans/${id}/confirm`);
export const cancelChallan = (id) => api.put(`/challans/${id}/cancel`);
