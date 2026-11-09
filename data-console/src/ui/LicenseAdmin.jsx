import React, { useEffect, useMemo, useState } from "react";
import { Ban, Copy, KeyRound, RefreshCw, RotateCcw, Search, ShieldCheck } from "lucide-react";

const LICENSE_STATUSES = ["", "未激活", "已激活", "已停用", "已过期"];

function dateText(value) {
  if (!value) return "-";
  return String(value).replace("T", " ").replace(/\.\d+Z?$/, "");
}

function statusClass(value) {
  return `license-status license-${value || "unknown"}`;
}

function GeneratedCodes({ codes, onCopy }) {
  if (!codes.length) return null;
  return (
    <section className="generated-codes">
      <div className="section-title">
        <KeyRound size={15} /> 本次生成的授权码
        <button type="button" onClick={onCopy}><Copy size={14} /> 复制全部</button>
      </div>
      <textarea readOnly value={codes.join("\n")} />
      <p className="muted">完整授权码只在生成后展示一次；后台列表仅保存脱敏码和哈希。</p>
    </section>
  );
}

export default function LicenseAdmin({ apiBase }) {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [licenses, setLicenses] = useState([]);
  const [stats, setStats] = useState({ total: 0, byStatus: [], recentEvents: [] });
  const [selected, setSelected] = useState(null);
  const [generatedCodes, setGeneratedCodes] = useState([]);
  const [message, setMessage] = useState("正在读取授权数据");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    durationDays: "30",
    quantity: "1",
    permanent: false,
    note: ""
  });

  const statusSummary = useMemo(() => {
    const map = new Map((stats.byStatus || []).map(item => [item.status, item.count]));
    return LICENSE_STATUSES.filter(Boolean).map(item => ({ status: item, count: map.get(item) || 0 }));
  }, [stats.byStatus]);

  async function loadLicenses() {
    setBusy(true);
    try {
      const query = new URLSearchParams();
      if (keyword.trim()) query.set("keyword", keyword.trim());
      if (status) query.set("status", status);
      const response = await fetch(`${apiBase}/licenses?${query}`);
      const json = await response.json();
      setLicenses(json.items || []);
      setMessage(`已加载 ${json.items?.length || 0} 条授权记录`);
      if (!selected && json.items?.[0]) setSelected(json.items[0]);
    } catch (error) {
      setMessage(`授权数据读取失败：${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function loadStats() {
    const response = await fetch(`${apiBase}/licenses/stats`);
    const json = await response.json();
    setStats(json);
  }

  async function loadDetail(id) {
    if (!id) return;
    const response = await fetch(`${apiBase}/licenses/${id}`);
    const json = await response.json();
    setSelected(json);
  }

  useEffect(() => {
    loadLicenses();
    loadStats();
  }, []);

  function updateForm(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function generateLicenses(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch(`${apiBase}/licenses/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName,
          durationDays: form.permanent ? "" : Number(form.durationDays || 30),
          permanent: form.permanent,
          quantity: Number(form.quantity || 1),
          note: form.note,
          generatedBy: "owner"
        })
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "授权码生成失败");
      const codes = (json.licenses || []).map(item => item.licenseCode).filter(Boolean);
      setGeneratedCodes(codes);
      setMessage(`已生成 ${json.count || codes.length} 个授权码`);
      await loadLicenses();
      await loadStats();
    } catch (error) {
      setMessage(`生成失败：${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function copyGeneratedCodes() {
    await navigator.clipboard.writeText(generatedCodes.join("\n"));
    setMessage("授权码已复制。");
  }

  async function updateLicenseStatus(item, nextStatus) {
    if (!item) return;
    setBusy(true);
    try {
      const response = await fetch(`${apiBase}/licenses/${item.id}/status`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: nextStatus, operator: "owner" })
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "状态更新失败");
      setMessage(`已将 ${item.customer_name} 的授权状态改为 ${nextStatus}`);
      await loadLicenses();
      await loadStats();
      await loadDetail(item.id);
    } catch (error) {
      setMessage(`状态更新失败：${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function resetMachine(item) {
    if (!item) return;
    setBusy(true);
    try {
      const response = await fetch(`${apiBase}/licenses/${item.id}/reset-machine`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ operator: "owner" })
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "重置失败");
      setMessage(`已重置 ${item.customer_name} 的机器绑定`);
      await loadLicenses();
      await loadStats();
      await loadDetail(item.id);
    } catch (error) {
      setMessage(`重置失败：${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <aside className="license-sidebar">
        <form className="license-form" onSubmit={generateLicenses}>
          <div className="section-title"><KeyRound size={16} /> 生成授权码</div>
          <label>客户名<input value={form.customerName} onChange={e => updateForm("customerName", e.target.value)} placeholder="例如：南京样板客户" /></label>
          <div className="grid-2">
            <label>授权天数<input type="number" min="1" disabled={form.permanent} value={form.durationDays} onChange={e => updateForm("durationDays", e.target.value)} /></label>
            <label>生成数量<input type="number" min="1" max="500" value={form.quantity} onChange={e => updateForm("quantity", e.target.value)} /></label>
          </div>
          <label className="check-row"><input type="checkbox" checked={form.permanent} onChange={e => updateForm("permanent", e.target.checked)} /> 永久授权</label>
          <label>备注<textarea value={form.note} onChange={e => updateForm("note", e.target.value)} placeholder="渠道、交付对象、付款情况等" /></label>
          <button className="primary" type="submit" disabled={busy}><ShieldCheck size={15} /> 生成授权码</button>
        </form>
        <GeneratedCodes codes={generatedCodes} onCopy={copyGeneratedCodes} />
      </aside>

      <section className="license-content">
        <header className="content-header">
          <div>
            <h1>授权管理</h1>
            <p>{message}</p>
          </div>
          <button type="button" onClick={() => { loadLicenses(); loadStats(); }} disabled={busy}><RefreshCw size={15} /> 刷新</button>
        </header>

        <div className="license-stats">
          <div><span>授权总数</span><strong>{stats.total || 0}</strong></div>
          {statusSummary.map(item => <div key={item.status}><span>{item.status}</span><strong>{item.count}</strong></div>)}
        </div>

        <div className="license-toolbar">
          <label><Search size={15} /> 搜索<input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="客户名 / 机器码 / 备注" /></label>
          <label>状态
            <select value={status} onChange={e => setStatus(e.target.value)}>
              {LICENSE_STATUSES.map(item => <option key={item || "all"} value={item}>{item || "全部"}</option>)}
            </select>
          </label>
          <button type="button" onClick={loadLicenses}>应用筛选</button>
        </div>

        <div className="license-grid">
          <div className="license-table-shell">
            <table>
              <thead>
                <tr>
                  <th>客户</th>
                  <th>授权码</th>
                  <th>状态</th>
                  <th>到期时间</th>
                  <th>绑定机器</th>
                  <th>最近登录</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {licenses.map(item => (
                  <tr key={item.id} className={selected?.id === item.id ? "selected" : ""} onClick={() => loadDetail(item.id)}>
                    <td><strong>{item.customer_name}</strong><br /><span className="muted">{item.duration_label}</span></td>
                    <td>{item.code_mask}</td>
                    <td><span className={statusClass(item.status)}>{item.status}</span></td>
                    <td>{dateText(item.expires_at)}</td>
                    <td className="machine-cell">{item.machine_code || "-"}</td>
                    <td>{dateText(item.last_seen_at || item.activated_at)}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" onClick={event => { event.stopPropagation(); resetMachine(item); }} disabled={!item.machine_code || busy}><RotateCcw size={13} /> 重置</button>
                        <button type="button" onClick={event => { event.stopPropagation(); updateLicenseStatus(item, item.status === "已停用" ? "未激活" : "已停用"); }} disabled={busy}><Ban size={13} /> {item.status === "已停用" ? "启用" : "停用"}</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!licenses.length && <tr><td colSpan="7" className="empty-row">暂无授权记录</td></tr>}
              </tbody>
            </table>
          </div>

          <aside className="license-detail">
            {!selected ? (
              <p className="muted">选择一条授权记录查看使用历史。</p>
            ) : (
              <>
                <h2>{selected.customer_name}</h2>
                <div className="detail-meta">
                  <span>{selected.code_mask}</span>
                  <span>{selected.duration_label}</span>
                  <span>{selected.status}</span>
                </div>
                <div className="license-detail-list">
                  <div><span>授权ID</span><strong>{selected.license_id}</strong></div>
                  <div><span>生成时间</span><strong>{dateText(selected.created_at)}</strong></div>
                  <div><span>激活时间</span><strong>{dateText(selected.activated_at)}</strong></div>
                  <div><span>到期时间</span><strong>{dateText(selected.expires_at)}</strong></div>
                  <div><span>绑定机器码</span><strong>{selected.machine_code || "-"}</strong></div>
                  <div><span>登录次数</span><strong>{selected.activation_count || 0}</strong></div>
                  <div><span>备注</span><strong>{selected.note || "-"}</strong></div>
                </div>
                <div className="section-title">使用记录</div>
                <div className="license-events">
                  {(selected.events || []).map(event => (
                    <article key={event.id}>
                      <strong>{event.event_type} · {dateText(event.created_at)}</strong>
                      <p>{event.message || "-"}</p>
                      <span>{event.machine_code || "-"} · {event.ip || "-"}</span>
                    </article>
                  ))}
                  {!selected.events?.length && <p className="muted">暂无使用记录</p>}
                </div>
              </>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}
