import api from "../shared/api";

export const getPassport = (id) =>
  api.get(`/passport/${id}`);