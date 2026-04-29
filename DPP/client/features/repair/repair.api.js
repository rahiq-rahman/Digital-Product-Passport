import api from "../shared/api";

// Existing — log repair directly (used by OTP confirm flow in otp.service.js)
export const addRepair = (data) => api.post("/repairs", data);

// New — fetch all jobs for this repairshop
export const getRepairJobs = () => api.get("/repairs/jobs");

// New — update a repair job status
export const updateRepairStatus = (repair_id, status) =>
  api.patch(`/repairs/${repair_id}/status`, { status });