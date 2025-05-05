const idToken = localStorage.getItem("idToken");
if (!idToken) window.location.href = "login.html";

let drivers = [];

function showSection(sectionId) {
  document.querySelectorAll(".section").forEach(div => div.style.display = "none");
  document.getElementById(sectionId).style.display = "block";

  if (sectionId === "unassigned") loadUnassignedJobs();
  else if (sectionId === "assigned") loadAssignedJobs();
}

async function uploadExcel() {
  const fileInput = document.getElementById("excelFile");
  const file = fileInput.files[0];
  if (!file) {
    alert("Please select a file.");
    return;
  }

  try {
    const res = await fetch("https://iil8njbabl.execute-api.ap-southeast-2.amazonaws.com/prod/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name })
    });

    if (!res.ok) throw new Error(`Presigned URL fetch failed: ${res.status}`);
    const data = await res.json();

    const uploadRes = await fetch(data.url, {
      method: "PUT",
      headers: { "Content-Type": "application/octet-stream" },
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
  } catch (err) {
    console.error("Failed to fetch drivers:", err);
    drivers = [];
  }
}

async function loadUnassignedJobs() {
  const container = document.getElementById("jobContainer");
  container.innerHTML = "<p>Loading jobs...</p>";
  await fetchDrivers();

  try {
    const res = await fetch("https://iil8njbabl.execute-api.ap-southeast-2.amazonaws.com/prod/jobs/unassigned-jobs");
    const jobs = await res.json();

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
  } catch (err) {
    console.error("Error loading unassigned jobs:", err);
    container.innerHTML = "<p>Error loading jobs.</p>";
  }
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
    const result = await res.json();
    alert(result.message || "Assignment complete.");
    loadUnassignedJobs();
  } catch (err) {
    console.error("Assignment failed:", err);
    alert("Assignment failed. Check console.");
  }
}

async function loadAssignedJobs() {
  const container = document.getElementById("assignedJobContainer");
  container.innerHTML = "<p>Loading assigned jobs...</p>";

  try {
    const res = await fetch("https://iil8njbabl.execute-api.ap-southeast-2.amazonaws.com/prod/jobs/getAssignedJobs");
    const jobs = await res.json();

    if (!jobs.length) {
      container.innerHTML = "<p>No assigned jobs found.</p>";
      return;
    }

    container.innerHTML = jobs.map((job, index) => `
      <div class="job-card">
        <div class="job-header">
          <div class="job-number">${index + 1}</div>
          <div class="job-info">
            <strong>${job.job_id}</strong><br>
            ${job.cust_name} (${job.cust_suburb})<br>
            Assigned to: <strong>${job.driver_id}</strong><br>
          </div>
        </div>
        <button onclick="unassignJob('${job.job_id}')">Unassign</button>
      </div>
    `).join('');
  } catch (err) {
    console.error("Failed to fetch assigned jobs:", err);
    container.innerHTML = "<p>Error loading assigned jobs.</p>";
  }
}

async function unassignJob(jobId) {
  try {
    const res = await fetch("https://iil8njbabl.execute-api.ap-southeast-2.amazonaws.com/prod/jobs/unAssignJob", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: jobId })
    });

    const result = await res.json();
    alert(result.message || "Job unassigned.");
    loadAssignedJobs();
  } catch (err) {
    console.error("Unassign failed:", err);
    alert("Failed to unassign job.");
  }
}


async function loadCompletedJobs() {
  const container = document.getElementById("completedJobContainer");
  container.innerHTML = "<p>Loading completed jobs...</p>";

  try {
    const res = await fetch("https://iil8njbabl.execute-api.ap-southeast-2.amazonaws.com/prod/jobs/completedJobs");
    const data = await res.json();
    const jobs = data.jobs || [];

    if (!jobs.length) {
      container.innerHTML = "<p>No completed jobs found.</p>";
      return;
    }

    container.innerHTML = jobs.map((job, index) => `
      <div class="job-card" onclick='showCompletedJobDetail(${JSON.stringify(job)})'>
        <div class="job-header">
          <div class="job-number">${index + 1}</div>
          <div class="job-info">
            <strong>${job.job_id}</strong><br>
            ${job.cust_name} (${job.cust_suburb})<br>
            Driver: <strong>${job.driver_id}</strong><br>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error("Failed to fetch completed jobs:", err);
    container.innerHTML = "<p>Error loading completed jobs.</p>";
  }
}

// Fix for the viewJobPhotos button in showCompletedJobDetail function
function showCompletedJobDetail(job) {
  const container = document.getElementById("completedJobContainer");
  
  // Create a data attribute to store photo keys safely
  const photoKeysAttr = job.photo_keys ? 
    `data-photo-keys='${JSON.stringify(job.photo_keys).replace(/'/g, "&apos;")}'` : '';
  
  container.innerHTML = `
    <div class="job-detail-box">
      <div class="top-bar">
        <button class="back-btn" onclick="loadCompletedJobs()">Back</button>
      </div>

      <h3>Job ID: ${job.job_id}</h3>
      <p><strong>Customer:</strong> ${job.cust_name}</p>
      <p><strong>Phone:</strong> ${job.cust_phone || 'N/A'}</p>
      <p><strong>Address:</strong> ${job.cust_add || 'N/A'} (${job.cust_suburb || ''})</p>
      <p><strong>Driver:</strong> ${job.driver_id}</p>
      <p><strong>Status:</strong> ${job.status}</p>
      <p><strong>Comments:</strong> ${job.comments || '(no comments)'}</p>
      <p><strong>Driver's Comment:</strong> ${job.drivers_comment || '(none)'}</p>

      ${Array.isArray(job.photo_keys) && job.photo_keys.length > 0 ? `
        <button id="viewPhotosBtn" ${photoKeysAttr}>View Photos</button>
        <div id="photoContainer"></div>
      ` : '<p>No photos uploaded.</p>'}
    </div>
  `;
  
  // Add event listener separately after the DOM is updated
  if (Array.isArray(job.photo_keys) && job.photo_keys.length > 0) {
    document.getElementById("viewPhotosBtn").addEventListener("click", function() {
      viewJobPhotos(job.photo_keys);
    });
  }
}


async function viewJobPhotos(photoKeys) {
  if (!Array.isArray(photoKeys) || photoKeys.some(k => typeof k !== 'string' || !k.includes("/"))) {
    console.error("Invalid photo keys:", photoKeys);
    alert("Invalid photo data. Cannot load photos.");
    return;
  }

  try {
    const res = await fetch("https://iil8njbabl.execute-api.ap-southeast-2.amazonaws.com/prod/jobs/photoUrlGenerator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo_keys: photoKeys })
    });

    const data = await res.json();
    const urls = data.photo_urls || [];

    const container = document.getElementById("photoContainer");
    container.innerHTML = "";

    urls.forEach(url => {
      const img = document.createElement("img");
      img.src = url;
      img.style.maxWidth = "300px";
      img.style.margin = "10px";
      img.style.borderRadius = "8px";
      container.appendChild(img);
    });
  } catch (err) {
    console.error("Failed to load photos:", err);
    alert("Could not load photos. Try again later.");
  }
}



function closePhotoModal() {
  document.getElementById("photoModal").style.display = "none";
}

