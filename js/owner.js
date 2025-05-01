const idToken = localStorage.getItem("idToken");
if (!idToken) window.location.href = "login.html";
let drivers = [];
function showSection(sectionId) {
  document.querySelectorAll(".section").forEach(div => div.style.display = "none");
  document.getElementById(sectionId).style.display = "block";
}

document.getElementById("btn-unassigned").addEventListener("click", () => {
  const container = document.getElementById("jobContainer");
  container.innerHTML = "<p>Loading jobs...</p>";
  loadUnassignedJobs();
});


async function uploadExcel() {
  const fileInput = document.getElementById("excelFile");
  const file = fileInput.files[0];
  if (!file) {
    alert("Please select a file.");
    return;
  }

  try {
    // Get presigned URL from API
    const res = await fetch("https://iil8njbabl.execute-api.ap-southeast-2.amazonaws.com/prod/upload", {
      method: "POST",
      headers: {
        //Authorization: idToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ filename: file.name })
    });

    if (!res.ok) throw new Error(`Presigned URL fetch failed: ${res.status}`);
    const data = await res.json();

    // Upload to S3
    const uploadRes = await fetch(data.url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/octet-stream"
      },
      body: file
    });

    document.getElementById("uploadStatus").innerText =
      uploadRes.ok ? `✅ Uploaded to S3 as ${data.filename}` : "❌ Upload failed.";
  } catch (err) {
    console.error(err);
    document.getElementById("uploadStatus").innerText = "❌ Upload error. See console.";
  }
}

async function fetchDrivers() {
  try {
    const res = await fetch("https://iil8njbabl.execute-api.ap-southeast-2.amazonaws.com/prod/jobs/drivers");
    if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`);
    drivers = await res.json();
    console.log("Drivers:", drivers);
  } catch (err) {
    console.error("Failed to fetch drivers:", err);
    drivers = []; // Fallback to empty list to avoid crashing .map
  }
}

async function loadUnassignedJobs() {
  console.log("New layout loaded");
  await fetchDrivers();

  const res = await fetch("https://iil8njbabl.execute-api.ap-southeast-2.amazonaws.com/prod/jobs/unassigned-jobs");
  const jobs = await res.json();

  const container = document.getElementById("jobContainer");
  if (!jobs.length) {
    container.innerHTML = "<p>No unassigned jobs found.</p>";
    return;
  }

  container.innerHTML = jobs.map((job, index) => `
    <div class="job-card">
      <div class="job-header">
        <div class="job-number">${index + 1}</div>
        <div class="job-info">
          <strong>${job.job_id}</strong><br>
          ${job.cust_name} (${job.cust_suburb})<br>
        </div>
      </div>
      <div style="margin-top: 10px; width: 100%;">
        <select id="driver-${job.job_id}">
          ${drivers.map(driver => `
            <option value="${driver.driver_id}">${driver.name || driver.driver_id}</option>
          `).join('')}
        </select>
        <button onclick="assignJob('${job.job_id}')">Assign</button>
      </div>
    </div>
  `).join('');
}


async function assignJob(jobId) {
  const select = document.getElementById(`driver-${jobId}`);
  const driverId = select.value;

  try {
    const res = await fetch("https://iil8njbabl.execute-api.ap-southeast-2.amazonaws.com/prod/jobs/assign-job", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: jobId, driver_id: driverId })
    });
    await loadUnassignedJobs(); // re-fetch after assignment
    const result = await res.json();
    alert(result.message || "Assignment complete.");

    // Refresh job list
    loadUnassignedJobs();
  } catch (err) {
    console.error("Assignment failed:", err);
    alert("Assignment failed. Check console.");
  }
}

