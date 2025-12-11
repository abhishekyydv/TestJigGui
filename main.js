const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { SerialPort } = require('serialport');

let port;

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  win.loadFile("./renderer/index.html");
}

app.whenReady().then(createWindow);

// -------- GET LIST OF SERIAL PORTS ----------
ipcMain.handle("getPorts", async () => {
  const ports = await SerialPort.list();
  return ports.map(p => p.path);
});

// -------- CONNECT TO PORT & SEND HANDSHAKE ----------
ipcMain.handle("connectPort", async (event, portName) => {
  return new Promise((resolve, reject) => {
    try {
      port = new SerialPort({ path: portName, baudRate: 9600, autoOpen: false });

      // Listen for data first
      port.on("data", (data) => {
        // Forward raw data to renderer
        event.sender.send("serialData", data);
      });

      port.open((err) => {
        if (err) {
          console.error("Failed to open port:", err);
          reject(err.toString());
          return;
        }
        console.log("Serial port opened:", portName);

        // Wait ~2s for Arduino reset
        setTimeout(() => {
          port.write("*", (err) => {
            if (err) console.error("Error sending handshake:", err);
            else console.log("Handshake sent: *");
          });
        }, 2000);

        resolve("connected");
      });

      port.on("error", (err) => {
        console.error("Serial port error:", err);
      });

    } catch (err) {
      reject(err.toString());
    }
  });
});

// -------- SEND NUMBER TO ARDUINO ----------
ipcMain.handle("sendData", async (event, num) => {
  if (port && port.isOpen) {
    port.write(num.toString(), (err) => {
      if (err) console.error("Error sending number:", err);
      else console.log("Number sent:", num);
    });
    return "sent";
  } else {
    return "no_port";
  }
});
