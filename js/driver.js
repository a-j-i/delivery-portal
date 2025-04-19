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

const driverId = payload["cognito:username"]; // This will be 'aj2'

async function fetchDriverJobs() {
  try {
    const res = await fetch(`https://iil8njbabl.execute-api.ap-southeast-2.amazonaws.com/prod/jobs/jobsByDriver?driver_id=${driverId}`);
    const jobs = await res.json();

    const container = document.getElementById("driverJobs");
    if (!jobs.length) {
      container.innerHTML = "<p>No jobs assigned to you yet.</p>";
      return;
    }

    container.innerHTML = jobs.map(job => `
      <div class="job-card">
        <strong>Job ID:</strong> ${job.job_id}<br>
        <strong>Name:</strong> ${job.cust_name}<br>
        <strong>Suburb:</strong> ${job.cust_suburb}<br>
        <strong>Status:</strong> ${job.status}<br>
        <hr>
      </div>
    `).join('');
  } catch (err) {
    console.error("Failed to fetch driver jobs:", err);
    document.getElementById("driverJobs").innerHTML = "<p>Error fetching jobs. Please try again later.</p>";
  }
}

fetchDriverJobs();
