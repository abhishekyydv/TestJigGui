// driver-ui.js — FINAL PREMIUM VERSION (Dual Ring + Highlighted Efficiencies + Clean Status Logic)
(function () {
  const ringOuter = document.getElementById("ringOuter");
  const ringInner = document.getElementById("ringInner");
  const coreEffNumber = document.getElementById("coreEffNumber");

  const chStatus = document.getElementById("chargingStatus");
  const disStatus = document.getElementById("dischargingStatus");
  const overallStatus = document.getElementById("overallStatus");
  const overallReason = document.getElementById("overallReason");

  const THRESHOLD = 85;

  /* -------------------------
        RING DRAW FUNCTION
  -------------------------- */
  function setRing(el, percent, color) {
    if (!el) return;
    percent = Math.max(0, Math.min(100, Math.round(percent)));
    const deg = (percent * 360) / 100;

    el.style.background = `conic-gradient(
      ${color} ${deg}deg,
      #e8eef9 ${deg}deg
    )`;
  }

  /* -------------------------
        PASS / FAIL HANDLER
  -------------------------- */
  function updateStatus(element, condition) {
    if (!element) return;
    element.classList.remove("ok", "fail");

    if (condition) {
      element.classList.add("ok");
      element.innerText = "PASS";
    } else {
      element.classList.add("fail");
      element.innerText = "FAIL";
    }
  }

  /* -------------------------
         MAIN UPDATE()
  -------------------------- */
  function update(arr) {
    // Extract bytes
    const sv = arr[0],
      si = arr[1],
      bv = arr[2],
      bi = arr[3];
    const dbv = arr[4],
      dbi = arr[5],
      lv = arr[6],
      li = arr[7];

    // Calculate powers
    const IP = sv * si;
    const OP = bv * bi;

    const DP_IN = dbv * dbi;
    const DP_OUT = lv * li;

    // Efficiencies
    const eff = IP ? Math.round((OP / IP) * 100) : 0;
    const disEff = DP_IN ? Math.round((DP_OUT / DP_IN) * 100) : 0;
    const avg = Math.round((eff + disEff) / 2);

    /* -------------------------
          GAUGE UPDATE
    -------------------------- */
    coreEffNumber.innerText = avg + "%";
    setRing(ringOuter, eff, "#4f87ff"); // Charging ring
    setRing(ringInner, disEff, "#32e2b8"); // Discharging ring

    /* -------------------------
          UPDATE UI VALUES
    -------------------------- */
    solarVoltage.innerText = sv;
    solarCurrent.innerText = si;

    batVoltage.innerText = bv;
    batCurrent.innerText = bi;
    inputPower.innerHTML = IP + "<span>W</span>";
    outputPower.innerHTML = OP + "<span>W</span>";
    efficiency.innerText = eff + "%";

    disBatVoltage.innerText = dbv;
    disBatCurrent.innerText = dbi;
    ledVoltage.innerText = lv;
    ledCurrent.innerText = li;
    disInputPower.innerHTML = DP_IN + "<span>W</span>";
    disOutputPower.innerHTML = DP_OUT + "<span>W</span>";
    disEfficiency.innerText = disEff + "%";

    /* -------------------------
          INDIVIDUAL STATUS
    -------------------------- */
    const chOK = eff >= THRESHOLD;
    const disOK = disEff >= THRESHOLD;

    updateStatus(chStatus, chOK);
    updateStatus(disStatus, disOK);

    /* -------------------------
          OVERALL STATUS
    -------------------------- */
    const okAll = chOK && disOK;
    updateStatus(overallStatus, okAll);

    if (okAll) {
      overallReason.innerText = "System operating normally.";
    } else {
      let reason = "Reason: ";
      if (!chOK) reason += "Charging efficiency low";
      if (!chOK && !disOK) reason += " · ";
      if (!disOK) reason += "Discharging efficiency low";
      overallReason.innerText = reason;
    }
  }

  /* -------------------------
        SERIAL LISTENER
  -------------------------- */
  if (window.api && window.api.onData) {
    window.api.onData((data) => {
      const arr = new Uint8Array(data);
      if (arr.length >= 8) update(arr);
    });
  }
})();
