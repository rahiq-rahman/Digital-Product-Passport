export const saveAuth = (data) => {
  localStorage.setItem("token", data.token);
  localStorage.setItem("role", data.user.role);
};