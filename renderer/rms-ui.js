// rms-ui.js — Premium RMS Version (Dual Ring + Highlighted Efficiencies)
(function () {
  /* ------------------------------------------------------
       ELEMENT REFERENCES (RMS ONLY)
  ------------------------------------------------------ */
  const ringOuter = document.getElementById("rmsRingOuter");
  const ringInner = document.getElementById("rmsRingInner");
  const coreEffNumber = document.getElementById("rmsCoreEff");

  const rmsStatusLeft = document.getElementById("rmsStatusLeft");
  const rmsStatusRight = document.getElementById("rmsStatusRight");

  const rmsOverallStatus = document.getElementById("rmsOverallStatus");
  const rmsOverallReason = document.getElementById("rmsOverallReason");

  /* RMS IO Value Elements */
  const rmsInVolt = document.getElementById("rmsInVolt");
  const rmsInCurr = document.getElementById("rmsInCurr");

  const rmsOutVolt = document.getElementById("rmsOutVolt");
  const rmsOutCurr = document.getElementById("rmsOutCurr");

  const rmsInPower = document.getElementById("rmsInputPower");
  const rmsOutPower = document.getElementById("rmsOutputPower");

  const rmsEff = document.getElementById("rmsEfficiency");
  const rmsEff2 = document.getElementById("rmsEfficiency2");

  const THRESHOLD = 85;

  /* ------------------------------------------------------
         FUNCTION: Draw dual ring segment
  ------------------------------------------------------ */
  function setRing(el, percent, color) {
    if (!el) return;

    percent = Math.max(0, Math.min(100, Math.round(percent)));
    const deg = (percent * 360) / 100;

    el.style.background = `conic-gradient(
      ${color} ${deg}deg,
      #ececff ${deg}deg
    )`;
  }

  /* ------------------------------------------------------
         FUNCTION: Update PASS / FAIL pill
  ------------------------------------------------------ */
  function updateStatus(element, ok) {
    if (!element) return;

    element.classList.remove("ok", "fail");
    if (ok) {
      element.classList.add("ok");
      element.innerText = "PASS";
    } else {
      element.classList.add("fail");
      element.innerText = "FAIL";
    }
  }

  /* ------------------------------------------------------
         MAIN UPDATE FUNCTION
  ------------------------------------------------------ */
  function update(arr) {
    // Extract raw MCU bytes
    const a = arr[0],
      b = arr[1],
      c = arr[2],
      d = arr[3];
    const e = arr[4],
      f = arr[5],
      g = arr[6],
      h = arr[7];

    // Example RMS PROCESSING
    // You will replace this with RMS-specific calculations later.
    const P1 = a * b;
    const P2 = c * d;

    const P3 = e * f;
    const P4 = g * h;

    const eff1 = P1 ? Math.round((P2 / P1) * 100) : 0;
    const eff2 = P3 ? Math.round((P4 / P3) * 100) : 0;

    const avg = Math.round((eff1 + eff2) / 2);

    /* --------------------------
       RING GAUGE UPDATE
    -------------------------- */
    coreEffNumber.innerText = avg + "%";
    setRing(ringOuter, eff1, "#6a5af9"); // Purple tone
    setRing(ringInner, eff2, "#4ce1d6"); // Aqua tone

    /* --------------------------
       RMS VALUES UPDATE
    -------------------------- */
    rmsInVolt.innerText = a;
    rmsInCurr.innerText = b;

    rmsOutVolt.innerText = c;
    rmsOutCurr.innerText = d;

    rmsInPower.innerHTML = P1 + "<span>W</span>";
    rmsOutPower.innerHTML = P2 + "<span>W</span>";
    rmsEff.innerText = eff1 + "%";

    rmsEff2.innerText = eff2 + "%";

    /* --------------------------
       PASS / FAIL LOGIC
    -------------------------- */
    const ok1 = eff1 >= THRESHOLD;
    const ok2 = eff2 >= THRESHOLD;

    updateStatus(rmsStatusLeft, ok1);
    updateStatus(rmsStatusRight, ok2);

    /* --------------------------
       OVERALL STATUS
    -------------------------- */
    const overallOK = ok1 && ok2;
    updateStatus(rmsOverallStatus, overallOK);

    if (overallOK) {
      rmsOverallReason.innerText = "RMS system operating normally.";
    } else {
      let reason = "Reason: ";
      if (!ok1) reason += "Section-1 efficiency low";
      if (!ok1 && !ok2) reason += " · ";
      if (!ok2) reason += "Section-2 efficiency low";
      rmsOverallReason.innerText = reason;
    }
  }

  /* ------------------------------------------------------
       SERIAL LISTENER FOR RMS PAGE
  ------------------------------------------------------ */
  if (window.api && window.api.onData) {
    window.api.onData((data) => {
      const arr = new Uint8Array(data);
      if (arr.length >= 8) update(arr);
    });
  }
})();
