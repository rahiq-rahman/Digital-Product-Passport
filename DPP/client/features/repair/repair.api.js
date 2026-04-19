import api from "../shared/api";

export const addRepair = (data) =>
  api.post("/repairs", data);