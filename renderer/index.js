// =============================
// GLOBAL ELEMENT REFERENCES
// =============================
const portList = document.getElementById("portList");
const refreshBtn = document.getElementById("refreshBtn");
const connectBtn = document.getElementById("connectBtn");
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
// LOAD PORTS
// =============================
async function loadPorts() {
  const ports = await window.api.getPorts();
  portList.innerHTML = "";

  ports.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.innerText = p;
    portList.appendChild(opt);
  });
}

refreshBtn.onclick = loadPorts;
window.addEventListener("DOMContentLoaded", loadPorts);

// =============================
// CONNECT BUTTON
// =============================
connectBtn.onclick = async () => {
  const selected = portList.value;
  if (!selected) return alert("Select COM port!");

  await window.api.connectPort(selected);
  log("Attempting handshake...");
};

// =============================
// LISTEN FOR SERIAL DATA
// =============================
if (window.api && window.api.onData) {
  window.api.onData((data) => {
    const arr = new Uint8Array(data);
    if (!arr.length) return;

    // detect handshake '#'
    if (!handshakeDone && arr[0] === 0x23) {
      handshakeDone = true;
      log("Handshake successful!");
      return;
    }

    // 🔥 Forward raw 8 bytes to driver UI handler:
    if (typeof window.updateDriverUI === "function") {
      window.updateDriverUI(arr);
    }
  });
}

// =============================
// TESTER NAME — enter key locks
// =============================
document.getElementById("testerNameInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.target.disabled = true;
    e.target.style.background = "#e5ffe9";
  }
});

// =============================
// PRODUCT ID — enter key locks
// =============================
document.getElementById("productIDInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.target.disabled = true;
    e.target.style.background = "#fff7d5";
  }
});

// =============================
// PAGE SWITCHING
// =============================
window.openJig = function (jigId) {
  document.getElementById("mainPage").style.display = "none";
  document.getElementById(jigId).style.display = "block";
};

window.backToMain = function () {
  document.getElementById("mainPage").style.display = "block";

  ["driverPage", "rmsPage", "ledPage", "performancePage", "ageingPage"].forEach(
    (id) => {
      const el = document.getElementById(id);
      if (el) el.style.display = "none";
    }
  );
};
