const idToken = localStorage.getItem("idToken");
if (!idToken) {
  window.location.href = "login.html";
}

const payload = JSON.parse(atob(idToken.split('.')[1]));
const groups = payload["cognito:groups"] || [];

if (!groups.includes("owner")) {
  alert("Access denied. Not an owner.");
  window.location.href = "login.html";
}

function logout() {
  localStorage.removeItem("idToken");
  window.location.href = "login.html";
}

