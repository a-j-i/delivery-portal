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

  try {
    const res = await fetch("https://iil8njbabl.execute-api.ap-southeast-2.amazonaws.com/prod", {
      method: "POST",
      headers: {
        Authorization: idToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ filename: file.name })
    });

    if (!res.ok) {
      throw new Error(`Presigned URL fetch failed: ${res.status}`);
    }

    const data = await res.json();
    const presignedUrl = data.url;
    const objectKey = data.filename;

    const uploadRes = await fetch(presignedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/octet-stream"
      },
      body: file
    });

    document.getElementById("uploadStatus").innerText =
      uploadRes.ok ? `✅ Uploaded to S3 as ${objectKey}` : "❌ Upload failed.";

  } catch (err) {
    console.error(err);
    document.getElementById("uploadStatus").innerText = "❌ Upload error. Check console.";
  }
}

async function fetchAllJobs() {
  try {
    const res = await fetch("https://38suwmuf43.execute-api.ap-southeast-2.amazonaws.com/prod", {
      headers: { Authorization: idToken }
    });

    if (!res.ok) {
      throw new Error(`GET jobs failed: ${res.status}`);
    }

    const raw = await res.json();
    const jobs = JSON.parse(raw.body); // Lambda proxy response

    if (!Array.isArray(jobs)) throw new Error("Jobs is not an array");
    return jobs;

  } catch (err) {
    console.error("Failed to fetch jobs:", err);
    return [];
  }
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

// Auto-show today's jobs
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
