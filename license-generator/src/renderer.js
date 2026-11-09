const els = {
  customer: document.querySelector("#customer"),
  duration: document.querySelector("#duration"),
  customDateRow: document.querySelector("#customDateRow"),
  expiresAt: document.querySelector("#expiresAt"),
  quantity: document.querySelector("#quantity"),
  generate: document.querySelector("#generate"),
  copy: document.querySelector("#copy"),
  licenseCode: document.querySelector("#licenseCode"),
  status: document.querySelector("#status")
};

let currentLicenseCode = "";

function setStatus(text) {
  els.status.textContent = text;
}

function payloadFromForm() {
  const duration = els.duration.value;
  return {
    customer: els.customer.value.trim(),
    quantity: els.quantity.value,
    days: duration === "custom" || duration === "permanent" ? "" : duration,
    expiresAt: duration === "custom" ? els.expiresAt.value : "",
    permanent: duration === "permanent"
  };
}

els.duration.addEventListener("change", () => {
  els.customDateRow.classList.toggle("hidden", els.duration.value !== "custom");
});

els.generate.addEventListener("click", async () => {
  els.generate.disabled = true;
  els.copy.disabled = true;
  setStatus("正在生成授权码...");
  try {
    const result = await window.licenseApi.generate(payloadFromForm());
    currentLicenseCode = result.licenseCode;
    els.licenseCode.value = result.licenseCode;
    els.copy.disabled = false;
    const first = result.licenses[0].payload;
    const expiresText = first.expiresAt ? first.expiresAt.slice(0, 10) : "永久";
    setStatus(`已生成 ${result.count} 个授权码，并已写入飞书授权表。\n客户：${first.customer}\n授权时长：${first.durationLabel}\n到期：${expiresText}`);
  } catch (error) {
    currentLicenseCode = "";
    els.licenseCode.value = "";
    setStatus(error && error.message ? error.message : String(error));
  } finally {
    els.generate.disabled = false;
  }
});

els.copy.addEventListener("click", async () => {
  if (!currentLicenseCode) return;
  await window.licenseApi.copy(currentLicenseCode);
  setStatus(`${els.status.textContent}\n授权码已复制。`);
});
