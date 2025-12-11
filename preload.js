const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  getPorts: () => ipcRenderer.invoke("getPorts"),
  connectPort: (p) => ipcRenderer.invoke("connectPort", p),
  sendData: (d) => ipcRenderer.invoke("sendData", d),
  onData: (callback) => ipcRenderer.on("serialData", (e, data) => callback(data))
});
