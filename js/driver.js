const idToken = localStorage.getItem("idToken");
if (!idToken) {
  window.location.href = "login.html";
}

const payload = JSON.parse(atob(idToken.split('.')[1]));
const groups = payload["cognito:groups"] || [];

if (!groups.includes("driver")) {
  alert("Access denied. Not a driver.");
  window.location.href = "login.html";
}

function logout() {
  localStorage.removeItem("idToken");
  window.location.href = "login.html";
}

