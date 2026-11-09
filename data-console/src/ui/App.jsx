import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { CalendarClock, Database, Download, FileUp, KeyRound, Pause, Play, RefreshCw, Save, Search, StickyNote, Tags, Trash2, Users } from "lucide-react";
import fieldDefinitions from "../field-labels.json";
import LicenseAdmin from "./LicenseAdmin.jsx";
import "./styles.css";

const API = "/api";
const STATUS_OPTIONS = ["未跟进", "已收藏", "黑名单", "待联系", "已合作", "不合适"];
const FIELD_LABELS = fieldDefinitions.labels || {};
const FIELD_GROUPS = fieldDefinitions.groups || [];
const HIDDEN_RAW_FIELDS = new Set(["fans_top_age"]);

function numberText(value) {
  if (value == null || value === "") return "-";
  return Number(value).toLocaleString("zh-CN");
}

function moneyText(value) {
  if (value == null || value === "") return "-";
  return `¥${Number(value).toLocaleString("zh-CN")}`;
}

function percentText(value) {
  if (value == null || value === "") return "-";
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return `${(number * 100).toFixed(1).replace(/\.0$/, "")}%`;
}

function dateText(value) {
  if (!value) return "-";
  const text = String(value);
  if (/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(text)) {
    const date = new Date(text);
    if (!Number.isNaN(date.getTime())) {
      const pad = item => String(item).padStart(2, "0");
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }
  }
  return text.replace("T", " ").replace(/\.\d+Z?$/, "");
}

function cleanText(value) {
  if (value == null) return "";
  if (typeof value === "object") {
    return cleanText(value.tag_name || value.tagName || value.name || value.label || value.title || value.value || "");
  }
  return String(value).trim();
}

function normalizeTags(value) {
  const source = Array.isArray(value) ? value : value ? [value] : [];
  return Array.from(new Set(source.map(cleanText).filter(Boolean)));
}

function mergeTags(...values) {
  return Array.from(new Set(values.flatMap(normalizeTags)));
}

function parseJsonObject(value) {
  if (!value) return {};
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (_) {
    return {};
  }
}

function displayValue(value) {
  if (Array.isArray(value)) return value.map(cleanText).filter(Boolean).join(" | ");
  if (value && typeof value === "object") return cleanText(value) || JSON.stringify(value);
  return cleanText(value) || "-";
}

function parsePercent(value) {
  const match = cleanText(value).match(/(-?\d+(?:\.\d+)?)%/);
  return match ? Number(match[1]) : null;
}

function AgeDistributionValue({ value }) {
  const parts = displayValue(value).split("|").map(item => item.trim()).filter(Boolean);
  if (!parts.length || parts[0] === "-") return <>{displayValue(value)}</>;
  const max = Math.max(...parts.map(item => parsePercent(item) ?? -Infinity));
  return (
    <span className="age-distribution">
      {parts.map(item => {
        const current = parsePercent(item);
        const active = Number.isFinite(max) && current === max;
        return <span key={item} className={active ? "age-max" : ""}>{item}</span>;
      })}
    </span>
  );
}

function fieldLabel(key) {
  return FIELD_LABELS[key] || "其他采集数据";
}

function buildDetailFieldGroups(detail, latestRaw) {
  const merged = {
    ...latestRaw,
    nickname: detail.nickname,
    blogger_id: detail.blogger_id,
    blogger_url: detail.blogger_url,
    red_id: detail.red_id,
    province: detail.province,
    city: detail.city,
    mcn_status: detail.mcn_status,
    collab_status: detail.collab_status,
    tags: detail.tags,
    content_tags: detail.content_tags,
    fans_count: detail.fans_count,
    read_median: detail.read_median,
    interaction_median: detail.interaction_median,
    image_note_price: detail.image_note_price,
    video_note_price: detail.video_note_price,
    coop_30_note_count: detail.coop_30_note_count,
    business_note_count: detail.business_note_count,
    last_collected_at: detail.last_collected_at
  };
  const used = new Set();
  const groups = FIELD_GROUPS.map(group => {
    const fields = (group.keys || []).map(key => {
      used.add(key);
      return { key, label: fieldLabel(key), value: merged[key] };
    });
    return { title: group.title, fields };
  }).filter(group => group.fields.length);
  const otherFields = Object.keys(latestRaw)
    .filter(key => !used.has(key) && !HIDDEN_RAW_FIELDS.has(key) && displayValue(latestRaw[key]) !== "-")
    .map(key => ({ key, label: fieldLabel(key), value: latestRaw[key] }));
  if (otherFields.length) groups.push({ title: "其他采集数据", fields: otherFields });
  return groups;
}

function domIdFromTitle(title) {
  return `detail-${String(title || "section").replace(/[^\w\u4e00-\u9fa5]+/g, "-")}`;
}

function queryString(filters, page) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...filters, page })) {
    if (Array.isArray(value)) {
      if (value.length) query.set(key, value.join(","));
    } else if (value !== "" && value != null) {
      query.set(key, value);
    }
  }
  return query.toString();
}

function App() {
  const [view, setView] = useState("bloggers");
  const [config, setConfig] = useState({ licenseAdminEnabled: false });
  const [filters, setFilters] = useState({
    keyword: "",
    province: "",
    city: "",
    tags: "",
    statuses: "",
    fansMin: "",
    fansMax: "",
    interactionMin: "",
    priceMax: "",
    coop30Min: "",
    sortBy: "last_collected_at",
    sortDir: "desc",
    pageSize: 50
  });
  const [page, setPage] = useState(1);
  const [bloggers, setBloggers] = useState({ total: 0, items: [], page: 1, pageSize: 50 });
  const [batches, setBatches] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(1);
  const [newStaffName, setNewStaffName] = useState("");
  const [note, setNote] = useState("");
  const [noteStatus, setNoteStatus] = useState("待联系");
  const [editingNote, setEditingNote] = useState(null);
  const [message, setMessage] = useState("正在读取本地数据库");
  const [busy, setBusy] = useState(false);
  const [refreshingBloggerId, setRefreshingBloggerId] = useState(null);
  const [refreshMessage, setRefreshMessage] = useState("");
  const [updateJobState, setUpdateJobState] = useState({ job: null, runs: [] });
  const [updateRunDetail, setUpdateRunDetail] = useState({ run: null, items: [], failedItems: [] });
  const [updateJobDraft, setUpdateJobDraft] = useState({ status: "PAUSED", run_time: "09:30", daily_limit: 1000 });
  const [updateJobMessage, setUpdateJobMessage] = useState("");

  async function loadBloggers(nextPage = page) {
    setBusy(true);
    try {
      const response = await fetch(`${API}/bloggers?${queryString(filters, nextPage)}`);
      const json = await response.json();
      setBloggers(json);
      setMessage(`已加载 ${json.total} 位博主`);
      if (!selected && json.items[0]) setSelected(json.items[0]);
    } catch (error) {
      setMessage(`读取失败：${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function loadBatches() {
    const response = await fetch(`${API}/batches`);
    const json = await response.json();
    setBatches(json.items || []);
  }

  async function loadUsers() {
    const response = await fetch(`${API}/users`);
    const json = await response.json();
    setUsers(json.items || []);
  }

  async function loadConfig() {
    const response = await fetch(`${API}/config`);
    const json = await response.json();
    setConfig(json || {});
  }

  async function loadUpdateJob() {
    try {
      const response = await fetch(`${API}/update-job`);
      const json = await response.json();
      const job = json.job || null;
      const runs = json.runs || [];
      setUpdateJobState({ job, runs });
      if (job) {
        setUpdateJobDraft({
          status: job.status || "PAUSED",
          run_time: job.run_time || "09:30",
          daily_limit: job.daily_limit || 1000
        });
      }
      if (runs[0]) loadUpdateRunDetail(runs[0].id);
    } catch (error) {
      setUpdateJobMessage(`更新计划读取失败：${error.message}`);
    }
  }

  async function loadUpdateRunDetail(runId) {
    if (!runId) {
      setUpdateRunDetail({ run: null, items: [], failedItems: [] });
      return;
    }
    try {
      const response = await fetch(`${API}/update-job/runs/${runId}?limit=120`);
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "读取失败");
      setUpdateRunDetail({
        run: json.run || null,
        items: json.items || [],
        failedItems: json.failedItems || []
      });
    } catch (error) {
      setUpdateJobMessage(`更新清单读取失败：${error.message}`);
    }
  }

  async function loadDetail(id) {
    if (!id) return;
    const response = await fetch(`${API}/bloggers/${id}`);
    const json = await response.json();
    setDetail(json);
  }

  useEffect(() => {
    loadConfig();
    loadBloggers(1);
    loadBatches();
    loadUsers();
    loadUpdateJob();
  }, []);

  useEffect(() => {
    if (view === "licenses" && !config.licenseAdminEnabled) setView("bloggers");
  }, [view, config.licenseAdminEnabled]);

  useEffect(() => {
    if (selected) loadDetail(selected.id);
  }, [selected?.id]);

  useEffect(() => {
    function handleRefreshResult(event) {
      const result = event.detail || {};
      if (result.id) setRefreshingBloggerId(result.running ? Number(result.id) : null);
      if (result.message) {
        setRefreshMessage(result.message);
        setMessage(result.message);
      }
      if (result.running) return;
      const refreshedId = result.id ? Number(result.id) : 0;
      const shouldReturnToFirstPage = refreshedId && filters.sortBy === "last_collected_at" && filters.sortDir === "desc";
      const nextPage = shouldReturnToFirstPage ? 1 : page;
      if (shouldReturnToFirstPage) setPage(1);
      loadBloggers(nextPage);
      if (refreshedId) loadDetail(refreshedId);
    }
    window.addEventListener("pgy-refresh-result", handleRefreshResult);
    return () => window.removeEventListener("pgy-refresh-result", handleRefreshResult);
  }, [filters.sortBy, filters.sortDir, page]);

  useEffect(() => {
    function handleUpdateJobResult(event) {
      const result = event.detail || {};
      if (result.message) {
        setUpdateJobMessage(result.message);
        setMessage(result.message);
      }
      if (result.run) {
        setUpdateJobState(prev => ({
          job: prev.job,
          runs: [result.run, ...prev.runs.filter(item => item.id !== result.run.id)].slice(0, 10)
        }));
        loadUpdateRunDetail(result.run.id);
      }
      if (result.complete || result.status === "完成" || result.status === "异常" || result.status === "中止") {
        loadUpdateJob();
        loadBloggers(page);
        loadBatches();
      }
    }
    window.addEventListener("pgy-update-job-result", handleUpdateJobResult);
    return () => window.removeEventListener("pgy-update-job-result", handleUpdateJobResult);
  }, [page]);

  const columns = useMemo(() => [
    {
      accessorKey: "nickname",
      header: "博主",
      cell: info => (
        <button className="name-button" onClick={() => setSelected(info.row.original)}>
          <strong>{info.getValue() || "-"}</strong>
          <span>{info.row.original.red_id || info.row.original.blogger_id || "-"}</span>
        </button>
      )
    },
    { accessorKey: "province", header: "地区", cell: info => `${info.row.original.province || "-"} ${info.row.original.city || ""}` },
    { accessorKey: "tags", header: "标签", cell: info => <TagList tags={info.getValue()} /> },
    { accessorKey: "fans_count", header: "粉丝", cell: info => numberText(info.getValue()) },
    { accessorKey: "fans_growth_num", header: "最近30天涨粉", cell: info => numberText(info.getValue()) },
    { accessorKey: "read_median", header: "阅读中位数", cell: info => numberText(info.getValue()) },
    { accessorKey: "interaction_median", header: "互动中位数", cell: info => numberText(info.getValue()) },
    { accessorKey: "image_note_price", header: "图文报价", cell: info => moneyText(info.getValue()) },
    { accessorKey: "coop_30_note_count", header: "近30天合作笔记数", cell: info => numberText(info.getValue()) },
    { accessorKey: "recent_note_count", header: "近30天笔记数", cell: info => numberText(info.getValue()) },
    { accessorKey: "commercial_order_rate", header: "近30天商单占比", cell: info => percentText(info.getValue()) },
    { accessorKey: "last_collected_at", header: "最近更新时间", cell: info => dateText(info.getValue()) },
    { accessorKey: "collab_status", header: "状态", cell: info => <span className={`status-pill status-${info.getValue()}`}>{info.getValue()}</span> }
  ], []);

  const table = useReactTable({
    data: bloggers.items,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  function updateFilter(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  }

  async function submitFilters(event) {
    event.preventDefault();
    await loadBloggers(1);
  }

  async function importCsv(file) {
    if (!file) return;
    const text = await file.text();
    setBusy(true);
    try {
      const response = await fetch(`${API}/import-csv`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, sourceName: file.name })
      });
      const json = await response.json();
      setMessage(`导入完成：${json.imported} 条，批次 #${json.batchId}`);
      await loadBloggers(1);
      await loadBatches();
    } catch (error) {
      setMessage(`导入失败：${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function saveNote() {
    if (!detail || !note.trim()) return;
    await fetch(editingNote ? `${API}/notes/${editingNote.id}` : `${API}/bloggers/${detail.id}/notes`, {
      method: editingNote ? "PUT" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: note, status: noteStatus, userId: currentUserId })
    });
    setNote("");
    setEditingNote(null);
    await loadDetail(detail.id);
    await loadBloggers(page);
  }

  function beginEditNote(item) {
    setEditingNote(item);
    setNote(item.content || "");
    setNoteStatus(item.status || "待联系");
  }

  async function removeNote(noteId) {
    if (!detail) return;
    await fetch(`${API}/notes/${noteId}?userId=${currentUserId}`, { method: "DELETE" });
    await loadDetail(detail.id);
    await loadBloggers(page);
  }

  async function deleteBlogger(blogger) {
    if (!blogger) return;
    const name = blogger.nickname || blogger.red_id || blogger.blogger_id || `#${blogger.id}`;
    const confirmed = window.confirm(`确定删除“${name}”吗？\n\n删除后会移除这个博主的详情、历史快照、标签和备注，采集批次记录会保留。`);
    if (!confirmed) return;
    setBusy(true);
    try {
      const response = await fetch(`${API}/bloggers/${blogger.id}?userId=${currentUserId}`, { method: "DELETE" });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.message || "删除失败");

      setSelected(null);
      setDetail(null);
      setNote("");
      setEditingNote(null);
      setRefreshMessage("");
      setMessage(`已删除博主：${name}`);
      const nextPage = bloggers.items.length <= 1 && page > 1 ? page - 1 : page;
      if (nextPage !== page) setPage(nextPage);
      await loadBloggers(nextPage);
      await loadBatches();
    } catch (error) {
      setMessage(`删除失败：${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function addStaff() {
    const name = newStaffName.trim();
    if (!name) return;
    const response = await fetch(`${API}/users`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, loginName: name, role: "staff" })
    });
    const user = await response.json();
    setNewStaffName("");
    await loadUsers();
    if (user.id) setCurrentUserId(user.id);
  }

  async function setStatus(status) {
    if (!detail) return;
    await fetch(`${API}/bloggers/${detail.id}/status`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status, userId: currentUserId })
    });
    await loadDetail(detail.id);
    await loadBloggers(page);
  }

  function refreshBlogger(blogger) {
    if (!blogger || !blogger.blogger_id) {
      setRefreshMessage("这个博主缺少博主ID，无法重刷。");
      return;
    }
    setRefreshingBloggerId(blogger.id);
    const nextMessage = `已提交“${blogger.nickname || blogger.blogger_id}”重刷请求，请保持采集助手登录状态。`;
    setRefreshMessage(nextMessage);
    setMessage(nextMessage);
    window.postMessage({
      source: "pgy-data-console",
      type: "refresh-blogger",
      blogger: {
        id: blogger.id,
        blogger_id: blogger.blogger_id,
        blogger_url: blogger.blogger_url,
        nickname: blogger.nickname,
        red_id: blogger.red_id,
        province: blogger.province,
        city: blogger.city,
        tags: blogger.tags,
        fans_count: blogger.fans_count,
        read_median: blogger.read_median,
        interaction_median: blogger.interaction_median,
        image_note_price: blogger.image_note_price,
        video_note_price: blogger.video_note_price
      }
    }, "*");
  }

  async function saveUpdateJob(event) {
    event.preventDefault();
    setUpdateJobMessage("正在保存每日更新计划...");
    try {
      const response = await fetch(`${API}/update-job`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(updateJobDraft)
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "保存失败");
      setUpdateJobState(prev => ({ ...prev, job: json.job || prev.job }));
      setUpdateJobMessage(json.job?.status === "ACTIVE"
        ? `已启用：每天 ${json.job.run_time} 更新 ${json.job.daily_limit} 位博主。`
        : "已暂停每日增强更新。");
    } catch (error) {
      setUpdateJobMessage(`保存失败：${error.message}`);
    }
  }

  function runUpdateJobNow() {
    const job = { ...(updateJobState.job || {}), ...updateJobDraft };
    setUpdateJobMessage(`已提交立即更新请求：本次最多 ${job.daily_limit || 1000} 位。`);
    window.postMessage({
      source: "pgy-data-console",
      type: "run-update-job",
      job
    }, "*");
  }

  function stopUpdateJobNow() {
    setUpdateJobMessage("已提交暂停请求，当前博主处理完后停止。");
    window.postMessage({
      source: "pgy-data-console",
      type: "stop-update-job"
    }, "*");
  }

  const pageCount = Math.max(1, Math.ceil(bloggers.total / Number(filters.pageSize || 50)));

  if (view === "licenses") {
    return (
      <main className="workspace license-workspace">
        <aside className="sidebar">
          <BrandBlock />
          <ViewNav view={view} setView={setView} licenseAdminEnabled={config.licenseAdminEnabled} />
          <div className="side-note">
            <strong>线上授权中心</strong>
            <span>生成授权码、绑定机器码、记录激活和登录历史。后续服务器部署后，桌面端会通过这里验证授权。</span>
          </div>
        </aside>
        <LicenseAdmin apiBase={API} />
      </main>
    );
  }

  return (
    <main className="workspace">
      <aside className="sidebar">
        <BrandBlock />
        <ViewNav view={view} setView={setView} licenseAdminEnabled={config.licenseAdminEnabled} />
        <UpdateJobPanel
          draft={updateJobDraft}
          setDraft={setUpdateJobDraft}
          state={updateJobState}
          runDetail={updateRunDetail}
          message={updateJobMessage}
          onSave={saveUpdateJob}
          onRunNow={runUpdateJobNow}
          onStop={stopUpdateJobNow}
          onLoadRunDetail={loadUpdateRunDetail}
        />
      </aside>

      <section className="content">
        <header className="content-header">
          <div>
            <h1>博主库</h1>
            <p>{message}</p>
          </div>
          <div className="sorts">
            <select value={filters.sortBy} onChange={e => updateFilter("sortBy", e.target.value)}>
              <option value="last_collected_at">最近采集</option>
              <option value="fans_count">粉丝数</option>
              <option value="fans_growth_num">最近30天涨粉</option>
              <option value="interaction_median">互动中位数</option>
              <option value="image_note_price">图文报价</option>
              <option value="coop_30_note_count">近30天合作笔记数</option>
              <option value="recent_note_count">近30天笔记数</option>
              <option value="commercial_order_rate">近30天商单占比</option>
            </select>
            <select value={filters.sortDir} onChange={e => updateFilter("sortDir", e.target.value)}>
              <option value="desc">降序</option>
              <option value="asc">升序</option>
            </select>
          </div>
        </header>

        <TopFilters
          filters={filters}
          updateFilter={updateFilter}
          submitFilters={submitFilters}
          busy={busy}
          batches={batches}
          importCsv={importCsv}
          users={users}
          currentUserId={currentUserId}
          setCurrentUserId={setCurrentUserId}
          newStaffName={newStaffName}
          setNewStaffName={setNewStaffName}
          addStaff={addStaff}
        />

        <div className="table-shell">
          <table>
            <thead>
              {table.getHeaderGroups().map(group => (
                <tr key={group.id}>
                  {group.headers.map(header => <th key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</th>)}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className={selected?.id === row.original.id ? "selected" : ""} onClick={() => setSelected(row.original)}>
                  {row.getVisibleCells().map(cell => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="pager">
          <button disabled={page <= 1} onClick={() => { const next = page - 1; setPage(next); loadBloggers(next); }}>上一页</button>
          <span>第 {page} / {pageCount} 页，共 {bloggers.total} 位</span>
          <button disabled={page >= pageCount} onClick={() => { const next = page + 1; setPage(next); loadBloggers(next); }}>下一页</button>
        </footer>
      </section>

      <DetailPanel
        detail={detail}
        note={note}
        setNote={setNote}
        noteStatus={noteStatus}
        setNoteStatus={setNoteStatus}
        saveNote={saveNote}
        setStatus={setStatus}
        editingNote={editingNote}
        beginEditNote={beginEditNote}
        removeNote={removeNote}
        refreshBlogger={refreshBlogger}
        refreshing={Boolean(detail && refreshingBloggerId === detail.id)}
        refreshMessage={refreshMessage}
        deleteBlogger={deleteBlogger}
      />
    </main>
  );
}

function BrandBlock() {
  return (
    <div className="brand">
      <Database size={22} />
      <div>
        <strong>蒲公英博主数据库</strong>
        <span>localhost:3188</span>
      </div>
    </div>
  );
}

function ViewNav({ view, setView, licenseAdminEnabled }) {
  return (
    <nav className="view-nav" aria-label="后台模块">
      <button type="button" className={view === "bloggers" ? "active" : ""} onClick={() => setView("bloggers")}><Database size={15} /> 博主库</button>
      {licenseAdminEnabled && <button type="button" className={view === "licenses" ? "active" : ""} onClick={() => setView("licenses")}><KeyRound size={15} /> 授权管理</button>}
    </nav>
  );
}

function TagList({ tags }) {
  const items = normalizeTags(tags);
  if (!items.length) return <span className="muted">-</span>;
  return <div className="tag-list">{items.slice(0, 4).map(tag => <span key={tag}>{tag}</span>)}</div>;
}

function TopFilters({
  filters,
  updateFilter,
  submitFilters,
  busy,
  batches,
  importCsv,
  users,
  currentUserId,
  setCurrentUserId,
  newStaffName,
  setNewStaffName,
  addStaff
}) {
  return (
    <section className="top-filter-panel">
      <form className="top-filters" onSubmit={submitFilters}>
        <label className="keyword-filter">
          <Search size={15} /> 关键词
          <input value={filters.keyword} onChange={e => updateFilter("keyword", e.target.value)} placeholder="昵称 / 机构 / 备注 / 标签" />
        </label>
        <label>省<input value={filters.province} onChange={e => updateFilter("province", e.target.value)} /></label>
        <label>市<input value={filters.city} onChange={e => updateFilter("city", e.target.value)} /></label>
        <label>
          <Tags size={15} /> 标签
          <input value={filters.tags} onChange={e => updateFilter("tags", e.target.value)} placeholder="多个用逗号分隔" />
        </label>
        <label>
          状态
          <select value={filters.statuses} onChange={e => updateFilter("statuses", e.target.value)}>
            <option value="">全部</option>
            {STATUS_OPTIONS.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label>粉丝下限<input type="number" value={filters.fansMin} onChange={e => updateFilter("fansMin", e.target.value)} /></label>
        <label>粉丝上限<input type="number" value={filters.fansMax} onChange={e => updateFilter("fansMax", e.target.value)} /></label>
        <label>互动下限<input type="number" value={filters.interactionMin} onChange={e => updateFilter("interactionMin", e.target.value)} /></label>
        <label>报价上限<input type="number" value={filters.priceMax} onChange={e => updateFilter("priceMax", e.target.value)} /></label>
        <label>合作30日下限<input type="number" value={filters.coop30Min} onChange={e => updateFilter("coop30Min", e.target.value)} /></label>
        <label className="batch-filter">
          采集批次
          <select value={filters.batchId || ""} onChange={e => updateFilter("batchId", e.target.value)}>
            <option value="">全部批次</option>
            {batches.map(batch => <option key={batch.id} value={batch.id}>#{batch.id} {batch.source_name || batch.task_mode}</option>)}
          </select>
        </label>
        <button className="primary apply-filter" type="submit" disabled={busy}><RefreshCw size={15} /> 应用筛选</button>
      </form>
      <div className="top-filter-actions">
        <div className="staff-inline">
          <Users size={15} />
          <select value={currentUserId} onChange={e => setCurrentUserId(Number(e.target.value))}>
            {users.map(user => <option key={user.id} value={user.id}>{user.name} · {user.role}</option>)}
          </select>
          <input value={newStaffName} onChange={e => setNewStaffName(e.target.value)} placeholder="新增员工姓名" />
          <button type="button" onClick={addStaff}>新增</button>
        </div>
        <div className="import-inline">
          <label className="file-button">
            <FileUp size={15} /> 导入历史 CSV
            <input type="file" accept=".csv" onChange={e => importCsv(e.target.files?.[0])} />
          </label>
          <a className="export-link" href={`${API}/bloggers/export?${queryString(filters, 1)}`}><Download size={15} /> 导出当前筛选</a>
        </div>
      </div>
    </section>
  );
}

function isFailedRunItem(item) {
  if (!item) return false;
  return Boolean(
    (item.status && !["成功", "完成"].includes(item.status)) ||
    item.missing_fields ||
    item.error_message
  );
}

function UpdateJobPanel({ draft, setDraft, state, runDetail, message, onSave, onRunNow, onStop, onLoadRunDetail }) {
  const latestRun = state.runs?.[0] || null;
  const total = Number(latestRun?.total_target || 0);
  const processed = Number(latestRun?.processed_count || 0);
  const progress = total ? Math.min(100, Math.round((processed / total) * 100)) : 0;
  const candidateCount = Number(state.job?.candidate_pool_count || 0);
  const runStatus = latestRun?.status || "";
  const running = runStatus === "运行中" || runStatus === "中止中";
  const items = runDetail?.items || [];
  const failedItems = runDetail?.failedItems || [];
  return (
    <section className="update-job-panel">
      <div className="section-title"><CalendarClock size={15} /> 每日增强更新</div>
      <form onSubmit={onSave} className="update-job-form">
        <label>
          状态
          <select value={draft.status} onChange={e => setDraft(prev => ({ ...prev, status: e.target.value }))}>
            <option value="PAUSED">暂停</option>
            <option value="ACTIVE">启用</option>
          </select>
        </label>
        <div className="grid-2">
          <label>
            时间
            <input type="time" value={draft.run_time} onChange={e => setDraft(prev => ({ ...prev, run_time: e.target.value }))} />
          </label>
          <label>
            数量
            <input type="number" min="1" max="5000" value={draft.daily_limit} onChange={e => setDraft(prev => ({ ...prev, daily_limit: e.target.value }))} />
          </label>
        </div>
        <div className="update-job-actions">
          <button type="submit"><Save size={14} /> 保存</button>
          <button type="button" className="primary" onClick={onRunNow}><Play size={14} /> 立即更新</button>
          <button type="button" className="danger-action" disabled={!running} onClick={onStop}><Pause size={14} /> 暂停本次</button>
          <button type="button" disabled={!latestRun} onClick={() => latestRun && onLoadRunDetail(latestRun.id)}><RefreshCw size={14} /> 刷新清单</button>
        </div>
      </form>
      <div className="update-job-meta">
        <span>可更新池：{candidateCount.toLocaleString("zh-CN")} 位</span>
        <span>下次：{dateText(state.job?.next_run_at)}</span>
      </div>
      {latestRun && (
        <div className="update-run">
          <div>
            <strong>{latestRun.status}</strong>
            <span>{processed}/{total || "-"} · 成功 {latestRun.success_count || 0} · 失败 {latestRun.failed_count || 0}</span>
          </div>
          <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
          {latestRun.message && <p>{latestRun.message}</p>}
        </div>
      )}
      {latestRun && (
        <div className="update-run-list">
          <div className="run-list-heading">
            <strong>本次清单</strong>
            <span>{items.length ? `最近 ${items.length} 条` : "暂无明细"}</span>
          </div>
          {failedItems.length ? (
            <div className="failed-list">
              <strong>失败 / 需复查</strong>
              {failedItems.slice(0, 8).map(item => (
                <div key={`failed-${item.id}`}>
                  <span>{item.nickname || item.seed_nickname || item.blogger_id || "-"}</span>
                  <small>{item.missing_fields || item.error_message || item.status || "需复查"}</small>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">暂无失败或需复查博主</p>
          )}
          <div className="run-items">
            {items.slice(0, 24).map(item => (
              <div className={`run-item ${isFailedRunItem(item) ? "run-item-failed" : ""}`} key={item.id}>
                <strong>{item.nickname || item.seed_nickname || item.blogger_id || "-"}</strong>
                <span>{item.status || "成功"}{item.missing_fields ? `｜${item.missing_fields}` : ""}</span>
              </div>
            ))}
            {!items.length && <p className="muted">本次更新开始写入后会显示博主清单。</p>}
          </div>
        </div>
      )}
      {message && <p className="update-job-message">{message}</p>}
    </section>
  );
}

function DetailPanel({ detail, note, setNote, noteStatus, setNoteStatus, saveNote, setStatus, editingNote, beginEditNote, removeNote, refreshBlogger, refreshing, refreshMessage, deleteBlogger }) {
  if (!detail) {
    return <aside className="detail-panel empty">选择一个博主查看详情</aside>;
  }
  const latestRaw = parseJsonObject(detail.latest_raw_json || detail.snapshots?.[0]?.raw_json);
  const rawApiSaved = Boolean(detail.latest_raw_api_json || detail.snapshots?.[0]?.raw_api_json);
  const fullFieldGroups = buildDetailFieldGroups(detail, latestRaw);
  return (
    <aside className="detail-panel">
      <section className="detail-profile">
        <header className="detail-profile-header">
          <div>
            <h2>{detail.nickname || "-"}</h2>
            <a href={detail.blogger_url} target="_blank" rel="noreferrer">打开小红书主页</a>
          </div>
          <div className="detail-header-actions">
            <button className="refresh-detail" type="button" disabled={refreshing || !detail.blogger_id} onClick={() => refreshBlogger(detail)}>
              <RefreshCw size={14} /> {refreshing ? "重刷中" : "重刷最新数据"}
            </button>
            <button className="delete-detail" type="button" disabled={refreshing} onClick={() => deleteBlogger(detail)}>
              <Trash2 size={14} /> 删除博主
            </button>
          </div>
        </header>
        {refreshMessage && <div className="detail-refresh-message">{refreshMessage}</div>}
        <div className="detail-meta">
          <span>{detail.province || "-"} {detail.city || ""}</span>
          <span>{detail.mcn_status || "机构未知"}</span>
          <span>{detail.red_id || "无小红书号"}</span>
          <span>{dateText(detail.last_collected_at)}</span>
        </div>
        <TagList tags={mergeTags(detail.tags, detail.content_tags, detail.sub_content_tags, detail.feature_tags)} />
      </section>

      <section className="detail-section">
        <div className="section-title">核心指标</div>
        <div className="metric-grid metric-grid-featured">
          <Metric label="粉丝数" value={numberText(detail.fans_count)} />
          <Metric label="获赞与收藏" value={numberText(latestRaw.like_collect_count)} />
          <Metric label="阅读中位数（日常近30日）" value={numberText(detail.read_median)} />
          <Metric label="互动中位数（日常近30日）" value={numberText(detail.interaction_median)} />
          <Metric label="近30天涨粉" value={numberText(latestRaw.fans_growth_num ?? detail.fans_growth_num)} />
          <Metric label="近30天商单占比" value={percentText(detail.commercial_order_rate)} />
        </div>
      </section>

      <section className="detail-section quote-section">
        <div className="section-title">合作报价</div>
        <div className="quote-grid">
          <Metric label="图文笔记一口价" value={moneyText(detail.image_note_price)} />
          <Metric label="视频笔记一口价" value={moneyText(detail.video_note_price)} />
        </div>
      </section>

      <section className="detail-section">
        <div className="section-title">全部采集字段</div>
        <p className="section-hint">所有已配置采集字段都会展示，未采到的数据显示为 -。</p>
        <nav className="field-nav" aria-label="详情分组导航">
          {fullFieldGroups.map(group => <a key={group.title} href={`#${domIdFromTitle(group.title)}`}>{group.title}</a>)}
        </nav>
        <div className="field-groups">
          {fullFieldGroups.map(group => (
            <div className="field-group" id={domIdFromTitle(group.title)} key={group.title}>
              <h3>{group.title}</h3>
              <div className="field-grid">
                {group.fields.map(field => <Field key={`${group.title}-${field.key}`} fieldKey={field.key} label={field.label} value={field.value} />)}
              </div>
            </div>
          ))}
          {!fullFieldGroups.length && <p className="muted">暂无完整采集字段</p>}
        </div>
      </section>

      <section className="detail-section">
        <div className="section-title"><StickyNote size={16} /> 员工备注</div>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="记录沟通情况、适合品牌、报价备注等" />
        <div className="note-actions">
          <select value={noteStatus} onChange={e => setNoteStatus(e.target.value)}>
            {STATUS_OPTIONS.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
          <button className="primary" onClick={saveNote}>{editingNote ? "更新备注" : "保存备注"}</button>
        </div>
        <div className="notes">
          {(detail.notes || []).map(item => (
            <article key={item.id}>
              <strong>{item.user_name || "员工"} · {item.status || "备注"}</strong>
              <p>{item.content}</p>
              <div className="note-row">
                <time>{dateText(item.created_at)}</time>
                <span>
                  <button onClick={() => beginEditNote(item)}>编辑</button>
                  <button onClick={() => removeNote(item.id)}>删除</button>
                </span>
              </div>
            </article>
          ))}
          {!detail.notes?.length && <p className="muted">暂无备注</p>}
        </div>
      </section>

      <section className="detail-section">
        <div className="section-title"><Users size={16} /> 协作状态</div>
        <div className="status-actions">
          {STATUS_OPTIONS.map(item => <button key={item} onClick={() => setStatus(item)} className={detail.collab_status === item ? "active" : ""}>{item}</button>)}
        </div>
      </section>

      <section className="detail-section mcn-history-section">
        <div className="section-title">MCN 历史</div>
        <div className="mcn-history">
          {(detail.mcn_history || []).map(item => (
            <div className="mcn-change" key={item.id}>
              <span>{dateText(item.changed_at)}</span>
              <strong>{item.previous_mcn_status || "未记录"} → {item.current_mcn_status || "-"}</strong>
            </div>
          ))}
          {!detail.mcn_history?.length && <p className="muted">暂无 MCN 变化记录</p>}
        </div>
      </section>

      <section className="detail-section">
        <div className="section-title">历史采集</div>
        <div className="history">
          {(detail.snapshots || []).slice(0, 8).map(item => (
            <div key={item.id}>
              <span>{dateText(item.collected_at)}</span>
              <strong>{numberText(item.fans_count)} 粉丝</strong>
            </div>
          ))}
        </div>
        <p className="section-hint">{rawApiSaved ? "原始接口数据已保存，后续可继续扩展字段。" : "本条暂无原始接口数据快照。"}</p>
      </section>
    </aside>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Field({ fieldKey, label, value }) {
  return (
    <div className="field-row">
      <span>{label}</span>
      <strong>{fieldKey === "fans_age_distribution" ? <AgeDistributionValue value={value} /> : displayValue(value)}</strong>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
