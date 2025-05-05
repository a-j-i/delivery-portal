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

// Updated showCompletedJobDetail function
function showCompletedJobDetail(job) {
  const container = document.getElementById("completedJobContainer");
  
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
        <div class="photo-section">
          <button id="viewPhotosBtn">View Photos</button>
          <div id="photoContainer" class="photo-container"></div>
        </div>
      ` : '<p>No photos uploaded.</p>'}
    </div>
  `;
  
  // Add event listener after DOM is updated
  if (Array.isArray(job.photo_keys) && job.photo_keys.length > 0) {
    const photoBtn = document.getElementById("viewPhotosBtn");
    if (photoBtn) {
      photoBtn.addEventListener("click", function() {
        viewJobPhotos(job.photo_keys);
      });
    }
  }
}

// Updated viewJobPhotos function
async function viewJobPhotos(photoKeys) {
  // Get container and show loading state
  const container = document.getElementById("photoContainer");
  if (!container) {
    console.error("Photo container not found in DOM");
    return;
  }
  
  container.innerHTML = "<p>Loading photos...</p>";
  
  // Validate photo keys
  if (!Array.isArray(photoKeys) || photoKeys.length === 0) {
    container.innerHTML = "<p>No photos available.</p>";
    return;
  }
  
  console.log("Processing photo keys:", photoKeys); // Debug log
  
  try {
    const res = await fetch("https://iil8njbabl.execute-api.ap-southeast-2.amazonaws.com/prod/jobs/photoUrlGenerator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo_keys: photoKeys })
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    console.log("Photo URL response:", data); // Debug log
    
    // Check if we have photo URLs
    if (!data.photo_urls || !Array.isArray(data.photo_urls) || data.photo_urls.length === 0) {
      container.innerHTML = "<p>No photos available from server.</p>";
      return;
    }

    // Clear container before adding images
    container.innerHTML = "";
    
    // Create a photo gallery
    const gallery = document.createElement("div");
    gallery.className = "photo-gallery";
    gallery.style.display = "flex";
    gallery.style.flexWrap = "wrap";
    gallery.style.justifyContent = "center";
    gallery.style.gap = "10px";
    
    // Add each photo to the gallery
    data.photo_urls.forEach((url, index) => {
      const imgContainer = document.createElement("div");
      imgContainer.className = "photo-item";
      imgContainer.style.margin = "10px";
      
      const img = document.createElement("img");
      img.src = url;
      img.alt = `Job photo ${index + 1}`;
      img.style.maxWidth = "300px";
      img.style.maxHeight = "300px";
      img.style.borderRadius = "8px";
      img.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
      img.style.cursor = "pointer";
      
      // Add loading fallback
      img.onerror = () => {
        imgContainer.innerHTML = `<p>Failed to load image ${index + 1}</p>`;
      };
      
      // Optionally add click to enlarge
      img.addEventListener("click", function() {
        window.open(url, "_blank");
      });
      
      imgContainer.appendChild(img);
      gallery.appendChild(imgContainer);
    });
    
    container.appendChild(gallery);
    
  } catch (err) {
    console.error("Failed to load photos:", err);
    container.innerHTML = "<p>Error loading photos: " + err.message + "</p>";
  }
}


function closePhotoModal() {
  document.getElementById("photoModal").style.display = "none";
}

