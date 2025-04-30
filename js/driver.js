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

const driverId = payload["cognito:username"];

let assignedJobs = [];
let completedJobs = [];

let selectedFiles = [];
let uploadedPhotoKeys = [];

async function fetchDriverJobs() {
  try {
    const res = await fetch(`https://iil8njbabl.execute-api.ap-southeast-2.amazonaws.com/prod/jobs/jobsByDriver?driver_id=${driverId}`);
    const jobs = await res.json();
    assignedJobs = jobs.filter(job => job.status === "assigned");
    completedJobs = jobs.filter(job => job.status === "completed");

    displayAssignedJobs();
  } catch (err) {
    console.error("Failed to fetch driver jobs:", err);
    document.getElementById("driverJobs").innerHTML = "<p>Error fetching jobs. Please try again later.</p>";
  }
}

function displayAssignedJobs() {
  const container = document.getElementById("driverJobs");
  container.innerHTML = `
    <h3>Assigned Jobs</h3>
    ${assignedJobs.length > 0 ? assignedJobs.map(job => `
      <div class="job-card" onclick="openJobDetail('${job.job_id}')">
        <strong>Job ID:</strong> ${job.job_id}<br>
        <strong>Name:</strong> ${job.cust_name}<br>
        <strong>Suburb:</strong> ${job.cust_suburb}<br>
        <strong>Status:</strong> ${job.status}<br>
        <hr>
      </div>
    `).join('') : "<p>No assigned jobs yet.</p>"}
    <button onclick="showCompletedJobs()">Completed Jobs</button>
  `;
}

function showCompletedJobs() {
  const container = document.getElementById("driverJobs");
  container.innerHTML = `
    <h3>Completed Jobs</h3>
    ${completedJobs.length > 0 ? completedJobs.map(job => `
      <div class="job-card">
        <strong>Job ID:</strong> ${job.job_id}<br>
        <strong>Name:</strong> ${job.cust_name}<br>
        <strong>Suburb:</strong> ${job.cust_suburb}<br>
        <strong>Status:</strong> ${job.status}<br>
        <hr>
      </div>
    `).join('') : "<p>No completed jobs yet.</p>"}
    <button onclick="backToJobs()">Back to Jobs</button>
  `;
}

function backToJobs() {
  displayAssignedJobs();
  document.querySelector("h2").style.display = "block";
  document.querySelector("button[onclick='logout()']").style.display = "block";
}

function openJobDetail(jobId) {
  const job = assignedJobs.find(j => j.job_id === jobId);
  if (!job) return alert("Job not found");

  selectedFiles = [];
  uploadedPhotoKeys = [];

  const container = document.getElementById("driverJobs");
  container.innerHTML = `
    <h3>Customer: ${job.cust_name}</h3>
    <p><strong>Phone:</strong> ${job.cust_phone || "N/A"}</p>
    <p><strong>Address:</strong> ${job.cust_add || "N/A"}</p>
    <p><strong>Notes:</strong> ${job.comments || "(no notes)"} </p>

    <button onclick="startJob('${job.job_id}')">Start Job</button><br><br>

    <label>Upload Images:</label><br>
    <input type="file" id="photoInput" multiple onchange="handleFileSelection(event)"><br><br>

    <label>Driver's Comment:</label><br>
    <textarea id="driverComment" rows="4" cols="50"></textarea><br><br>

    <button onclick="completeJob('${job.job_id}')">Delivery Complete</button><br><br>

    <button onclick="backToJobs()">Back to Jobs</button>
  `;

  document.querySelector("h2").style.display = "none";
  document.querySelector("button[onclick='logout()']").style.display = "none";
}

function handleFileSelection(event) {
  selectedFiles = Array.from(event.target.files);
}

async function startJob(jobId) {
  try {
    console.log(`Starting job: ${jobId}`);
    alert("Job started! Notify customer if needed.");
  } catch (err) {
    console.error("Failed to start job:", err);
    alert("Error starting the job.");
  }
}

async function completeJob(jobId) {
  try {
    if (selectedFiles.length > 0) {
      await uploadPhotosToS3(jobId);
    }

    const driverComment = document.getElementById("driverComment").value;

    const payload = {
      job_id: jobId,
      driver_id: driverId,
      driver_comment: driverComment,
      photo_keys: uploadedPhotoKeys
    };
    
    console.log("Payload:", payload);

    const res = await fetch("https://iil8njbabl.execute-api.ap-southeast-2.amazonaws.com/prod/jobs/complete_job", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": idToken
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert("✅ Job marked as completed!");
      fetchDriverJobs();
    } else {
      console.error("Failed to complete job:", await res.text());
      alert("❌ Failed to complete job. Please try again.");
    }
  } catch (err) {
    console.error("Error completing the job:", err);
    alert("❌ Error completing the job. Please try again.");
  }
}

async function uploadPhotosToS3(jobId) {
  try {
    const res = await fetch(`https://iil8njbabl.execute-api.ap-southeast-2.amazonaws.com/prod/jobs/generatePresignedUrls?job_id=${jobId}&driver_id=${driverId}&count=${selectedFiles.length}`);
    console.log("Response from presigned URL API:", res);
    const { urls } = await res.json();
    console.log("Presigned URLs received:", urls);
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const { upload_url, file_key } = urls[i];

      await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file
      });

      uploadedPhotoKeys.push(file_key);
    }
    console.log("✅ All images uploaded successfully.");
  } catch (err) {
    console.error("Photo upload failed:", err);
    alert("❌ Failed to upload photos.");
  }
}

function logout() {
  localStorage.removeItem("idToken");
  window.location.href = "login.html";
}

// Fetch jobs on page load
fetchDriverJobs();
