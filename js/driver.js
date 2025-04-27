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

const driverId = payload["cognito:username"]; // Example: 'aj2'

// Dummy placeholder data for now
let assignedJobs = [];
let completedJobs = [];

// Fetch jobs from backend (this will be improved later)
async function fetchDriverJobs() {
  try {
    // Placeholder for real API fetch
    assignedJobs = [
      { job_id: "job_1", cust_name: "John", cust_suburb: "Sydney", status: "assigned" },
      { job_id: "job_2", cust_name: "Mark", cust_suburb: "Thomastown", status: "assigned" }
    ];
    completedJobs = [
      { job_id: "job_3", cust_name: "Alice", cust_suburb: "Melbourne", status: "completed" }
    ];
    showAssignedJobs();
  } catch (err) {
    console.error("Failed to fetch driver jobs:", err);
    document.getElementById("driverJobs").innerHTML = "<p>Error fetching jobs. Please try again later.</p>";
  }
}

function showAssignedJobs() {
  const container = document.getElementById("driverJobs");
  if (!assignedJobs.length) {
    container.innerHTML = "<p>No assigned jobs.</p>";
    return;
  }

  container.innerHTML = assignedJobs.map(job => `
    <div class="job-card" onclick="openJobDetail('${job.job_id}')">
      <strong>${job.cust_name}</strong><br>
      <span>${job.cust_suburb}</span>
    </div>
  `).join('');
}

function showCompletedJobs() {
  const container = document.getElementById("driverJobs");
  if (!completedJobs.length) {
    container.innerHTML = "<p>No completed jobs.</p>";
    return;
  }

  container.innerHTML = completedJobs.map(job => `
    <div class="job-card">
      <strong>${job.cust_name}</strong><br>
      <span>${job.cust_suburb}</span><br>
      <small>Status: Completed</small>
    </div>
  `).join('');
}

function openJobDetail(jobId) {
  const job = assignedJobs.find(j => j.job_id === jobId);
  if (!job) return alert("Job not found");

  const container = document.getElementById("driverJobs");
  container.innerHTML = `
    <h3>Customer: ${job.cust_name}</h3>
    <p><strong>Address:</strong> (address will be here)</p>
    <p><strong>Notes:</strong> (instructions will be here)</p>

    <button onclick="startJob('${job.job_id}')">Start Job</button><br><br>

    <label>Upload Images:</label><br>
    <input type="file" multiple><br><br>

    <label>Driver's Comment:</label><br>
    <textarea rows="4" cols="50"></textarea><br><br>

    <button onclick="completeJob('${job.job_id}')">Delivery Complete</button><br><br>

    <button onclick="showAssignedJobs()">← Back to Assigned Jobs</button>
  `;
}

function startJob(jobId) {
  alert(`Starting job ${jobId}... (send SMS here later)`);
}

function completeJob(jobId) {
  alert(`Completing job ${jobId}... (mark complete later)`);
}

document.getElementById("assignedBtn").addEventListener("click", showAssignedJobs);
document.getElementById("completedBtn").addEventListener("click", showCompletedJobs);

fetchDriverJobs();
