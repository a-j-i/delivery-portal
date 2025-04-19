const idToken = localStorage.getItem("idToken");
if (!idToken) window.location.href = "login.html";

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


let drivers = [];

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
  await fetchDrivers();  // fetch drivers first

  const res = await fetch("https://iil8njbabl.execute-api.ap-southeast-2.amazonaws.com/prod/jobs/unassigned-jobs");
  const jobs = await res.json();

  const container = document.getElementById("jobContainer");
  if (!jobs.length) {
    container.innerHTML = "<p>No unassigned jobs found.</p>";
    return;
  }

  let html = `
    <table border="1" cellpadding="5" cellspacing="0">
      <tr>
        <th>Job ID</th>
        <th>Customer Name</th>
        <th>Suburb</th>
        <th>Assign To</th>
        <th>Action</th>
      </tr>
  `;

  jobs.forEach(job => {
    html += `
      <tr>
        <td>${job.job_id}</td>
        <td>${job.cust_name}</td>
        <td>${job.cust_suburb}</td>
        <td>
          <select id="driver-${job.job_id}">
            ${drivers.map(driver => 
  `<option value="${driver.driver_id}">${driver.name || driver.driver_id}</option>`
).join('')}

          </select>
        </td>
        <td>
          <button onclick="assignJob('${job.job_id}')">Assign</button>
        </td>
      </tr>
    `;
  });

  html += `</table>`;
  container.innerHTML = html;
}

async function assignJob(jobId) {
  const select = document.getElementById(`driver-${jobId}`);
  const driverId = select.value;

  try {
    const res = await fetch("https://iil8njbabl.execute-api.ap-southeast-2.amazonaws.com/prod/assign-job", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: jobId, driver_id: driverId })
    });

    const result = await res.json();
    alert(result.message || "Assignment complete.");

    // Refresh job list
    loadUnassignedJobs();
  } catch (err) {
    console.error("Assignment failed:", err);
    alert("Assignment failed. Check console.");
  }
}

