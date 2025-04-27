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

const driverId = payload["cognito:username"]; // This will be 'aj2'

let assignedJobs = [];
let completedJobs = []; // Store completed jobs for later use

async function fetchDriverJobs() {
  try {
    const res = await fetch(`https://iil8njbabl.execute-api.ap-southeast-2.amazonaws.com/prod/jobs/jobsByDriver?driver_id=${driverId}`);
    const jobs = await res.json();
    assignedJobs = jobs.filter(job => job.status === "assigned");
    completedJobs = jobs.filter(job => job.status === "completed");

    const container = document.getElementById("driverJobs");
    if (!assignedJobs.length) {
      container.innerHTML = "<p>No jobs assigned to you yet.</p>";
      return;
    }

    container.innerHTML = `
      <div>
        <h3>Assigned Jobs</h3>
        <div id="assignedJobsContainer">
          ${assignedJobs.map(job => `
            <div class="job-card" onclick="openJobDetail('${job.job_id}')">
              <strong>Job ID:</strong> ${job.job_id}<br>
              <strong>Name:</strong> ${job.cust_name}<br>
              <strong>Suburb:</strong> ${job.cust_suburb}<br>
              <strong>Status:</strong> ${job.status}<br>
              <hr>
            </div>
          `).join('')}
        </div>
        <br>

        <h3>Completed Jobs</h3>
        <div id="completedJobsContainer">
          ${completedJobs.length > 0 ? completedJobs.map(job => `
            <div class="job-card">
              <strong>Job ID:</strong> ${job.job_id}<br>
              <strong>Name:</strong> ${job.cust_name}<br>
              <strong>Suburb:</strong> ${job.cust_suburb}<br>
              <strong>Status:</strong> ${job.status}<br>
              <hr>
            </div>
          `).join('') : "<p>No completed jobs yet.</p>"}
        </div>
      </div>
    `;
  } catch (err) {
    console.error("Failed to fetch driver jobs:", err);
    document.getElementById("driverJobs").innerHTML = "<p>Error fetching jobs. Please try again later.</p>";
  }
}

fetchDriverJobs();

// Opens job details when driver clicks a job
function openJobDetail(jobId) {
  const job = assignedJobs.find(j => j.job_id === jobId);
  if (!job) return alert("Job not found");

  // Hide dashboard buttons and logout button
  document.getElementById("dashboard-buttons").style.display = "none";
  document.querySelector("h2").style.display = "none"; // Hide "Welcome Driver"
  document.querySelector("button[onclick='logout()']").style.display = "none"; // Hide logout button

  const container = document.getElementById("driverJobs");
  container.innerHTML = `
    <h3>Customer: ${job.cust_name}</h3>
    <p><strong>Ph:</strong> ${job.cust_phone || "N/A"}</p>
    <p><strong>Address:</strong> ${job.cust_add || "(address not available)"}</p>
    <p><strong>Notes:</strong> ${job.comments || "(no notes)"} </p>

    <button onclick="startJob('${job.job_id}')">Start Job</button><br><br>

    <label>Upload Images:</label><br>
    <input type="file" multiple><br><br>

    <label>Driver's Comment:</label><br>
    <textarea rows="4" cols="50"></textarea><br><br>

    <button onclick="completeJob('${job.job_id}')">Delivery Complete</button><br><br>

    <button onclick="goBack()">← Back to Jobs</button>
  `;
}

// Go back to the main dashboard (Assigned and Completed Jobs)
function goBack() {
  // Re-render the job list with Assigned and Completed Jobs buttons
  document.getElementById("dashboard-buttons").style.display = "block";
  document.querySelector("h2").style.display = "block"; 
  document.querySelector("button[onclick='logout()']").style.display = "inline"; 

  fetchDriverJobs(); // Re-fetch and show the assigned/completed jobs list
}

// Start job button functionality (you'll implement the backend later)
async function startJob(jobId) {
  try {
    // Placeholder logic to start a job
    console.log(`Starting job with ID: ${jobId}`);
    // You can call an API here to update job status to 'in-progress'

    alert("Job started! Notify customer via SMS.");
    // Code to send SMS can be added here

  } catch (err) {
    console.error("Failed to start the job:", err);
    alert("Error starting the job. Please try again.");
  }
}

// Complete job button functionality (you'll implement the backend later)
async function completeJob(jobId) {
  try {
    // Placeholder logic to complete a job
    console.log(`Completing job with ID: ${jobId}`);
    // You can call an API here to update job status to 'completed'

    alert("Job completed! Notify customer via SMS.");
    // Code to send SMS can be added here

  } catch (err) {
    console.error("Failed to complete the job:", err);
    alert("Error completing the job. Please try again.");
  }
}

// Log out function
function logout() {
  localStorage.removeItem("idToken");
  window.location.href = "login.html";
}

