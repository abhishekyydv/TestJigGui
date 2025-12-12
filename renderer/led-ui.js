// led-ui.js — LED Gauge + PCB LDR-driven replica
(function () {
  // safe get helper
  const $ = (id) => document.getElementById(id);

  // Existing gauge/core elements (if present)
  const ringOuter = $("ledRingOuter");
  const ringInner = $("ledRingInner");
  const coreEffNumber = $("ledCoreEffNumber");

  const overallStatus = $("ledOverallStatus");
  const overallReason = $("ledOverallReason");

  // existing IO values (if present)
  const ledInVolt = $("ledInVolt");
  const ledInCurr = $("ledInCurr");
  const ledOutVolt = $("ledOutVolt");
  const ledOutCurr = $("ledOutCurr");
  const ledInPower = $("ledInputPower");
  const ledOutPower = $("ledOutputPower");
  const ledEfficiency = $("ledEfficiency");

  // PCB elements (6 leds)
  const ledLights = [
    $("ledCell1")?.querySelector(".led-light"),
    $("ledCell2")?.querySelector(".led-light"),
    $("ledCell3")?.querySelector(".led-light"),
    $("ledCell4")?.querySelector(".led-light"),
    $("ledCell5")?.querySelector(".led-light"),
    $("ledCell6")?.querySelector(".led-light"),
  ];

  const ledVals = [
    $("ledVal1"),
    $("ledVal2"),
    $("ledVal3"),
    $("ledVal4"),
    $("ledVal5"),
    $("ledVal6"),
  ];

  // indicators
  const indBlue = $("ledIndBlue");
  const indRed = $("ledIndRed");
  const indGreen = $("ledIndGreen");

  const indValBlue = $("ledIndValBlue");
  const indValRed = $("ledIndValRed");
  const indValGreen = $("ledIndValGreen");

  const TH_OFF = 100; // <100 off
  const TH_DIM = 400; // 100-399 dim
  const TH_MED = 700; // 400-699 medium
  // 700+ full

  // helper: map 0..1023 to intensity 0..1 (smooth after threshold)
  function computeIntensity(v) {
    const n = Math.max(0, Math.min(1023, Number(v)));
    if (n < TH_OFF) return 0;
    // map [TH_OFF .. 1023] -> [0.2 .. 1]
    const start = TH_OFF;
    const end = 1023;
    const t = (n - start) / (end - start);
    // start intensity small so dim visible
    return Math.min(1, 0.2 + t * 0.8);
  }

  // set LED visual using CSS variable and on/off attr
  function setLedVisual(el, intensity) {
    if (!el) return;
    // intensity 0..1
    el.style.setProperty("--intensity", intensity.toFixed(3));
    el.dataset.on = intensity > 0 ? "true" : "false";

    // also set pseudo-element color by changing inline box-shadow color via a small hack:
    // since pseudoelement can't be set inline, we adjust background & box-shadow using classes
    // (we keep default warm-white look; no per-led color needed)
    el.style.filter = `brightness(${0.45 + intensity * 1.4})`;
    el.style.transform =
      intensity > 0.6
        ? "scale(1.03)"
        : intensity > 0.25
        ? "scale(1.01)"
        : "scale(0.98)";
  }

  // set indicator on/off
  function setIndicator(el, on) {
    if (!el) return;
    if (on) el.classList.add("on");
    else el.classList.remove("on");
  }

  // draw ring helper (if ring elements exist)
  function setRing(el, percent, color) {
    if (!el) return;
    percent = Math.max(0, Math.min(100, Math.round(percent)));
    const deg = (percent * 360) / 100;
    el.style.background = `conic-gradient(${color} ${deg}deg, #eaf9ff ${deg}deg)`;
  }

  // main update from MCU data (expects Uint8Array / arr)
  function updateFromMCU(arr) {
    if (!arr || arr.length < 9) return; // need at least 9 for indicators
    // LED LDRs
    const ldr = [];
    for (let i = 0; i < 9; i++) ldr.push(arr[i]); // arr[0..8]

    // update LED cells 1..6
    for (let i = 0; i < 6; i++) {
      const v = ldr[i];
      const intensity = computeIntensity(v);
      setLedVisual(ledLights[i], intensity);

      // show textual value
      if (ledVals[i]) ledVals[i].innerText = v;
    }

    // indicators: arr[6]=blue, arr[7]=red, arr[8]=green
    const blueVal = ldr[6],
      redVal = ldr[7],
      greenVal = ldr[8];

    setIndicator(indBlue, blueVal >= TH_OFF);
    setIndicator(indRed, redVal >= TH_OFF);
    setIndicator(indGreen, greenVal >= TH_OFF);

    if (indValBlue) indValBlue.innerText = blueVal;
    if (indValRed) indValRed.innerText = redVal;
    if (indValGreen) indValGreen.innerText = greenVal;

    // Optionally update overall gauge / numbers if present (example)
    // We'll compute small efficiencies using LED inputs/outputs if those fields exist
    // Use arr[0..5] as sample inputs to show small derived metrics

    // Example simple calculation for center gauge if present:
    if (coreEffNumber) {
      // make a simple 'avg brightness percent' indicator from LEDs
      const avgRaw = Math.round(ldr.slice(0, 6).reduce((s, x) => s + x, 0) / 6);
      const avgPct = Math.round((avgRaw / 1023) * 100);
      coreEffNumber.innerText = avgPct + "%";
      // set rings if present
      setRing(ringOuter, Math.round((ldr[0] / 1023) * 100), "#44b4f0");
      setRing(ringInner, Math.round((ldr[1] / 1023) * 100), "#28d4b8");
    }

    // If basic IO elements present, fill them with some values (non destructive)
    if (ledInVolt) ledInVolt.innerText = ldr[0];
    if (ledInCurr) ledInCurr.innerText = ldr[1];
    if (ledOutVolt) ledOutVolt.innerText = ldr[2];
    if (ledOutCurr) ledOutCurr.innerText = ldr[3];

    if (ledInPower) ledInPower.innerHTML = `${ldr[0] * ldr[1]}<span>W</span>`;
    if (ledOutPower) ledOutPower.innerHTML = `${ldr[2] * ldr[3]}<span>W</span>`;

    if (ledEfficiency) {
      // a mock efficiency derived from average brightness
      const avg = Math.round(
        ldr.slice(0, 6).reduce((s, x) => s + x, 0) / 6 / 10.23
      );
      ledEfficiency.innerText = avg + "%";
    }

    // Optionally set overall pass/fail text if present
    if (overallStatus) {
      // overall PASS if all 6 leds have intensity > 0.6 (approx)
      const okAll = ldr.slice(0, 6).every((v) => computeIntensity(v) >= 0.6);
      if (okAll) {
        overallStatus.classList.remove("fail");
        overallStatus.classList.add("ok");
        overallStatus.innerText = "PASS";
        if (overallReason)
          overallReason.innerText = "LED PCB matched expected brightness.";
      } else {
        overallStatus.classList.remove("ok");
        overallStatus.classList.add("fail");
        overallStatus.innerText = "FAIL";
        if (overallReason)
          overallReason.innerText = "Some LEDs below brightness threshold.";
      }
    }
  }

  // Listen for serial data (same API as before)
  if (window.api && window.api.onData) {
    window.api.onData((data) => {
      const arr = new Uint8Array(data);
      // Typical controller may send many bytes; we expect first 9 useful for LDRs
      if (arr.length >= 9) {
        updateFromMCU(arr);
      }
    });
  }

  // Also expose a helper for local testing: window.simLedData([values...])
  window.simLedData = function (values) {
    // values: array of length >=9
    const arr = new Uint8Array(9);
    for (let i = 0; i < 9; i++) arr[i] = values[i] || 0;
    updateFromMCU(arr);
  };
})();
