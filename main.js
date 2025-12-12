// =======================
// main.js  (FINAL VERSION)
// =======================

const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { SerialPort } = require("serialport");

let port; // active serial port instance

function createWindow() {
  const win = new BrowserWindow({
    width: 1300,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadFile("./renderer/index.html");
}

app.whenReady().then(createWindow);

// ==========================
// GET LIST OF SERIAL PORTS
// ==========================
ipcMain.handle("getPorts", async () => {
  const ports = await SerialPort.list();
  return ports.map((p) => p.path);
});

// ==========================
// CONNECT SERIAL PORT
// ==========================
ipcMain.handle("connectPort", async (event, portName) => {
  return new Promise((resolve, reject) => {
    try {
      port = new SerialPort({
        path: portName,
        baudRate: 9600,
        autoOpen: false,
      });

      // When data arrives → forward to renderer
      port.on("data", (data) => {
        event.sender.send("serialData", data);
      });

      port.on("error", (err) => {
        console.log("Serial Error:", err);
      });

      port.open((err) => {
        if (err) {
          reject(err.toString());
          return;
        }

        console.log("Port opened:", portName);

        // Send handshake after Arduino reset (2s)
        setTimeout(() => {
          port.write("*", (err) => {
            if (err) console.log("Handshake Failed:", err);
            else console.log("Handshake Sent: *");
          });
        }, 2000);

        resolve("connected");
      });
    } catch (err) {
      reject(err.toString());
    }
  });
});

// ==========================
// SEND USER DATA
// ==========================
ipcMain.handle("sendData", async (event, num) => {
  if (port && port.isOpen) {
    port.write(num.toString());
    return "sent";
  }
  return "no_port";
});
