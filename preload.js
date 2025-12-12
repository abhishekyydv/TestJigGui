// =======================
// preload.js (FINAL VERSION)
// =======================

const { contextBridge, ipcRenderer } = require("electron");

// Expose safe APIs to renderer
contextBridge.exposeInMainWorld("api", {
  getPorts: () => ipcRenderer.invoke("getPorts"),
  connectPort: (portName) => ipcRenderer.invoke("connectPort", portName),
  sendData: (data) => ipcRenderer.invoke("sendData", data),

  // Listener for incoming serial data
  onData: (callback) => {
    ipcRenderer.on("serialData", (event, data) => {
      callback(data);
    });
  },
});
