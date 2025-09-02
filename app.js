const $ = (id) => document.getElementById(id);

const themeSel = $("theme");
document.documentElement.dataset.theme = themeSel.value;
themeSel.addEventListener("change", () => {
    document.documentElement.dataset.theme = themeSel.value;
});

const modeSel = $("mode"),
    dyn1 = $("dyn1"),
    qrArea = $("qrArea"),
    sizeRange = $("size"),
    sizeVal = $("sizeVal"),
    darkPicker = $("dark"),
    lightPicker = $("light"),
    shapeSel = $("shape"),
    cornersSel = $("corners"),
    marginRange = $("margin"),
    contrastMsg = $("contrastMsg");

function renderFields() {
    if (modeSel.value === "text") {
        dyn1.innerHTML = `
      <label><b>Text / URL</b></label>
      <div class="row" style="margin-top:6px">
        <input id="text" type="text" placeholder="Enter text or URL" value="https://example.com"/>
      </div>`;
    } else {
        dyn1.innerHTML = `
      <div class="grid">
        <div class="card"><label>To</label><input id="email-to" type="text" placeholder="me@example.com"></div>
        <div class="card"><label>Subject</label><input id="email-subject" type="text" placeholder="Hello"></div>
        <div class="card" style="grid-column:1/-1"><label>Body</label><input id="email-body" type="text" placeholder="Message..."></div>
      </div>`;
    }
}
renderFields();

function hexToRgb(h) { const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h); return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : { r: 0, g: 0, b: 0 }; }
function luminance({ r, g, b }) { const a = [r, g, b].map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4) }); return .2126 * a[0] + .7152 * a[1] + .0722 * a[2]; }
function contrastRatio(c1, c2) { const L1 = luminance(hexToRgb(c1)), L2 = luminance(hexToRgb(c2)); const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1]; return (hi + 0.05) / (lo + 0.05); }
function updateContrastWarning() { const cr = contrastRatio(darkPicker.value, lightPicker.value); if (cr < 2) { contrastMsg.style.display = "block"; contrastMsg.textContent = `Low contrast (${cr.toFixed(2)})`; } else { contrastMsg.style.display = "none"; } }

function buildData() {
    if (modeSel.value === "text") {
        return document.getElementById("text")?.value.trim() || " ";
    }
    const to = (document.getElementById("email-to")?.value || "").trim();
    const subject = encodeURIComponent((document.getElementById("email-subject")?.value || "").trim());
    const body = encodeURIComponent((document.getElementById("email-body")?.value || "").trim());
    return `mailto:${to}?subject=${subject}&body=${body}`;
}

let qr = new QRCodeStyling({
    width: parseInt(sizeRange.value, 10),
    height: parseInt(sizeRange.value, 10),
    type: "svg",
    data: buildData(),
    qrOptions: { errorCorrectionLevel: "H" },
    dotsOptions: { type: shapeSel.value, color: darkPicker.value },
    cornersSquareOptions: { type: cornersSel.value, color: darkPicker.value },
    cornersDotOptions: { color: darkPicker.value },
    backgroundOptions: { color: lightPicker.value },
    margin: parseInt(marginRange.value, 10)
});
qr.append(qrArea);

function regenerate() {
    const size = parseInt(sizeRange.value, 10); sizeVal.textContent = size;
    qr.update({
        width: size, height: size, data: buildData(),
        qrOptions: { errorCorrectionLevel: "H" },
        dotsOptions: { type: shapeSel.value, color: darkPicker.value },
        cornersSquareOptions: { type: cornersSel.value, color: darkPicker.value },
        cornersDotOptions: { color: darkPicker.value },
        backgroundOptions: { color: lightPicker.value },
        margin: parseInt(marginRange.value, 10)
    });
    updateContrastWarning();
}

modeSel.onchange = () => { renderFields(); regenerate(); };
document.addEventListener("input", (e) => {
    if (["text", "email-to", "email-subject", "email-body"].includes(e.target.id)) {
        clearTimeout(window.__t); window.__t = setTimeout(regenerate, 250);
    }
});
["size", "dark", "light", "shape", "corners", "margin"].forEach(id => {
    $(id).addEventListener("input", regenerate);
    $(id).addEventListener("change", regenerate);
});
$("generate").onclick = regenerate;
$("invert").onclick = () => { const d = darkPicker.value, l = lightPicker.value; darkPicker.value = l; lightPicker.value = d; regenerate(); };


$("downloadPng").onclick = () => {
    qr.update({ type: "canvas" });
    qr.download({ name: "qr", extension: "png" });
    qr.update({ type: "svg" });
};
$("downloadSvg").onclick = () => {
    qr.update({ type: "svg" });
    qr.download({ name: "qr", extension: "svg" });
};
$("copyPng").onclick = async () => {
    try {
        qr.update({ type: "canvas" });
        const canvas = qrArea.querySelector("canvas");
        if (!canvas) { alert("Generate a QR first"); return; }
        const blob = await new Promise(res => canvas.toBlob(res, "image/png"));
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        alert("Copied image");
    } catch (e) {
        alert("Copy failed, use Download PNG instead.");
    } finally {
        qr.update({ type: "svg" });
    }
};

regenerate();