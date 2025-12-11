// =============================
// GLOBAL ELEMENT REFERENCES
// =============================
const portList = document.getElementById("portList");
const refreshBtn = document.getElementById("refreshBtn");
const connectBtn = document.getElementById("connectBtn");
const startBtn = document.getElementById("startBtn"); 
const userInput = document.getElementById("userInput");
const logBox = document.getElementById("log");

let handshakeDone = false;


// =============================
// SAFE LOG FUNCTION
// =============================
function log(msg) {
  if (!logBox) return;
  logBox.innerHTML += msg + "<br>";
  logBox.scrollTop = logBox.scrollHeight;
}


// =============================
// LOAD PORTS FUNCTION
// =============================
async function loadPorts(listElement = portList) {
  if (!listElement) return;

  const ports = await window.api.getPorts();
  listElement.innerHTML = "";

  ports.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.innerText = p;
    listElement.appendChild(opt);
  });
}

// Refresh ports when button clicked
if (refreshBtn) {
  refreshBtn.onclick = () => loadPorts(portList);
}

// Load ports on page load
window.addEventListener("DOMContentLoaded", () => loadPorts(portList));


// =============================
// CONNECT BUTTON
// =============================
if (connectBtn) {
  connectBtn.onclick = async () => {
    if (!portList) return;

    const selected = portList.value;
    if (!selected) {
      alert("Select a COM port!");
      return;
    }

    try {
      await window.api.connectPort(selected);
      log("Attempting handshake...");
    } catch (err) {
      alert("Failed to connect: " + err);
    }
  };
}


// =============================
// LISTEN FOR INCOMING DATA
// =============================
if (window.api && window.api.onData) {
  window.api.onData((data) => {
    const arr = new Uint8Array(data);
    if (!arr.length) return;

    // Handshake detection (# = 0x23)
    if (!handshakeDone && arr[0] === 0x23) {
      handshakeDone = true;
      log("Handshake successful. Port connected!");
      return;
    }

    // After handshake, read value
   /* if (handshakeDone && arr.length >= 2) {
      //const doubled = arr[0] + (arr[1] << 8);
      //log("Doubled number received from Arduino: " + doubled);
    }*/
  });
}


// =============================
// SEND DATA ON CLICK
// =============================
if (startBtn && userInput) {
  startBtn.onclick = async () => {
    if (!handshakeDone) {
      alert("Please complete handshake first!");
      return;
    }

    const num = userInput.value.trim();
    if (!num) {
      alert("Enter a number!");
      return;
    }

    try {
      await window.api.sendData(num);
      log("Sent number: " + num);
    } catch (err) {
      alert("Failed to send data: " + err);
    }
  };
}


// =============================
// PAGE SWITCHING FUNCTIONS
// =============================

// Show selected jig page
function openJig(jigId) {
  document.getElementById("mainPage").style.display = "none";
  document.getElementById(jigId).style.display = "block";

  // Hide stats panel if open
  const stats = document.getElementById("statsPanel");
  if (stats) stats.style.display = "none";
}

// Back to main dashboard
function backToMain() {
  document.getElementById("mainPage").style.display = "block";

  // Hide all jig pages
  const jigPages = ["driverPage", "rmsPage", "ledPage", "performancePage", "ageingPage"];
  jigPages.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  // Hide stats panel
  const stats = document.getElementById("statsPanel");
  if (stats) stats.style.display = "none";
}

