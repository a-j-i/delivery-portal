const idToken = localStorage.getItem("idToken");
if (!idToken) window.location.href = "login.html";

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


async function uploadExcel() {
  const fileInput = document.getElementById("excelFile");
  const file = fileInput.files[0];
  if (!file) {
    alert("Please select a file.");
    return;
  }

  // Step 1: Ask backend for presigned URL
  const res = await fetch("https://iil8njbabl.execute-api.ap-southeast-2.amazonaws.com/prod", {
    method: "POST",
    headers: {
      Authorization: idToken,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ filename: file.name })
  });

  const data = await res.json();
  const presignedUrl = data.url;
  const objectKey = data.filename;

  // Step 2: Upload to S3 using the presigned URL
  const uploadRes = await fetch(presignedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "application/octet-stream"
    },
    body: file
  });

  document.getElementById("uploadStatus").innerText = 
    uploadRes.ok ? `✅ Uploaded to S3 as ${objectKey}` : "❌ Upload failed.";
}


async function fetchAllJobs() {
  const res = await fetch("https://38suwmuf43.execute-api.ap-southeast-2.amazonaws.com/prod", {
    headers: { Authorization: idToken }
  });
  return await res.json();
}

async function getUnassignedJobs() {
  const jobs = await fetchAllJobs();
  const filtered = jobs.filter(job => job.status === "unassigned");

  const container = document.getElementById("unassignedJobs");
  container.innerHTML = filtered.map(job => `
    <div class="job-card">
      <strong>${job.job_id}</strong> - ${job.cust_name} (${job.cust_suburb})<br>
      Status: ${job.status}
    </div>
  `).join('') || "<p>No unassigned jobs found.</p>";
}

async function getIncompleteJobs() {
  const jobs = await fetchAllJobs();
  const filtered = jobs.filter(job => job.status !== "completed");

  const container = document.getElementById("incompleteJobs");
  container.innerHTML = filtered.map(job => `
    <div class="job-card">
      <strong>${job.job_id}</strong> - ${job.cust_name}<br>
      Status: ${job.status}
    </div>
  `).join('') || "<p>No incomplete jobs found.</p>";
}

// Optional: show today’s jobs automatically
(async function showTodaysJobs() {
  const jobs = await fetchAllJobs();
  const today = new Date().toISOString().split('T')[0];

  const todayJobs = jobs.filter(job => {
    const checkTime = job.completion_time || job.assigned_on;
    return checkTime && checkTime.startsWith(today);
  });

  const container = document.getElementById("todaysJobs");
  container.innerHTML = todayJobs.map(job => `
    <div class="job-card">
      <strong>${job.job_id}</strong> - ${job.cust_name}<br>
      Status: ${job.status}<br>
      Completed: ${job.completion_time || "Not yet"}
    </div>
  `).join('') || "<p>No jobs for today yet.</p>";
})();
