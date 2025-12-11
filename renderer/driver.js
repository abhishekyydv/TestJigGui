// Make these functions global
window.openJig = function(jigName) {
  const mainPage = document.getElementById('mainPage');
  const driverPage = document.getElementById('driverPage');
  if (!mainPage || !driverPage) return;

  mainPage.style.display = 'none';
  if(jigName === 'driver'){
    driverPage.style.display = 'block';
  }
};

window.backToMain = function() {
  const mainPage = document.getElementById('mainPage');
  const driverPage = document.getElementById('driverPage');
  if (!mainPage || !driverPage) return;

  driverPage.style.display = 'none';
  mainPage.style.display = 'block';
};

// Helper to safely update text and class
function safeUpdate(id, value, className=null) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerText = value;
  if (className !== null) el.className = className;
}

// Map serial data to charging/discharging
if (window.api && window.api.onData) {
  window.api.onData((data) => {
    const arr = new Uint8Array(data);
    if(arr.length < 8) return; // need 8 bytes for this mapping

    // Charging section
    const inputPower = arr[0]*arr[1];
    const outputPower = arr[2]*arr[3];
    const efficiency = inputPower ? (outputPower/inputPower)*100 : 0;

    safeUpdate('solarVoltage', arr[0]);
    safeUpdate('solarCurrent', arr[1]);
    safeUpdate('batVoltage', arr[2]);
    safeUpdate('batCurrent', arr[3]);
    safeUpdate('inputPower', inputPower.toFixed(1));
    safeUpdate('outputPower', outputPower.toFixed(1));
    safeUpdate('efficiency', efficiency.toFixed(1));
    safeUpdate('chargingStatus', efficiency>90?'PASS':'FAIL', 'passfail-bar ' + (efficiency>90?'PASS':'FAIL'));

    // Discharging section
    const disInputPower = arr[4]*arr[5];
    const disOutputPower = arr[6]*arr[7];
    const disEfficiency = disInputPower ? (disOutputPower/disInputPower)*100 : 0;

    safeUpdate('disBatVoltage', arr[4]);
    safeUpdate('disBatCurrent', arr[5]);
    safeUpdate('ledVoltage', arr[6]);
    safeUpdate('ledCurrent', arr[7]);
    safeUpdate('disInputPower', disInputPower.toFixed(1));
    safeUpdate('disOutputPower', disOutputPower.toFixed(1));
    safeUpdate('disEfficiency', disEfficiency.toFixed(1));
    safeUpdate('dischargingStatus', disEfficiency>90?'PASS':'FAIL', 'passfail-bar ' + (disEfficiency>90?'PASS':'FAIL'));
  });
}
