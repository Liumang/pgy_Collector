const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const { createDataStore } = require(path.join(root, 'data-console/src/db'));
const { createApp } = require(path.join(root, 'data-console/src/server'));
const { parseCsvText, parseNumber } = require(path.join(root, 'data-console/src/importer'));
const { bloggersToCsv } = require(path.join(root, 'data-console/src/exporter'));

// Every write in this audit targets an in-memory database, never the user's DB.
const store = createDataStore({ dbPath: ':memory:' });
const findings = [];
function observe(id, value, verify) {
  assert.ok(verify(value), `Observed behavior changed; re-review ${id}`);
  findings.push({ id, observed: value });
}
function put(record, options = {}) {
  return store.importRecords({ records: [record], ...options });
}
function get(id) {
  const row = store.db.prepare('SELECT id FROM bloggers WHERE blogger_id = ?').get(id);
  return row ? store.getBlogger(row.id) : null;
}
const source = fs.readFileSync(path.join(root, 'desktop/src/renderer.js'), 'utf8');
const context = vm.createContext({ state: { apiResponses: new Map() } });
vm.runInContext(source.slice(source.indexOf('function cleanValue('), source.indexOf('function sleep(')), context);

async function main() {
  put({ blogger_id: 'audit-current', nickname: 'Current', collected_at: '2026-09-13T00:00:00Z', fans_count: 50000, coop_30_note_count: 3 });
  put({ blogger_id: 'audit-current', nickname: 'Old', collected_at: '2026-01-01T00:00:00Z', fans_count: 10000 });
  observe('old-import-replaces-latest', { fans: get('audit-current').fans_count, date: get('audit-current').last_collected_at }, x => x.fans === 10000);
  put({ blogger_id: 'audit-partial', nickname: 'Partial', collected_at: '2026-09-12T00:00:00Z', coop_30_note_count: 3, content_tags: 'old-tag' });
  put({ blogger_id: 'audit-partial', nickname: 'Partial', collected_at: '2026-09-13T00:00:00Z', fans_count: 15000, content_tags: 'new-tag' });
  observe('partial-erases-latest-enhanced', get('audit-partial').coop_30_note_count, x => x === null);
  observe('old-tag-still-filters', store.listBloggers({ tags: ['old-tag'] }).total, x => x === 1);
  put({ blogger_id: 'audit-null', nickname: 'Null', recent_note_count: 10 });
  observe('missing-coop-becomes-zero-ratio', get('audit-null').commercial_order_rate, x => x === 0);
  observe('unavailable-text-becomes-zero', ['暂无', 'N/A', 'null'].map(parseNumber), x => x.every(n => n === 0));
  put({ blogger_id: 'audit-id-a', nickname: 'Same', red_id: 'same-red' });
  put({ blogger_id: 'audit-id-b', nickname: 'Same', red_id: 'same-red' });
  observe('different-id-merges-by-name', { oldExists: Boolean(get('audit-id-a')), snapshots: get('audit-id-b').snapshots.length }, x => !x.oldExists && x.snapshots === 2);
  const batch = store.createBatch({});
  const event = { blogger_id: 'audit-retry', nickname: 'Retry' };
  store.appendRecordsToBatch({ batchId: batch.batchId, records: [event] });
  store.appendRecordsToBatch({ batchId: batch.batchId, records: [event] });
  observe('retry-not-idempotent', store.db.prepare('SELECT total_collected n FROM collect_batches WHERE id=?').get(batch.batchId).n, x => x === 2);
  context.state.apiResponses.set('audit-parser', { profile: { totalNoteCount: 999 }, notesRate: {} });
  const parsed = context.parseEnhancedFromCaptured('audit-parser');
  observe('missing-mcn-becomes-none', parsed.mcn_status, x => x === '无机构');
  observe('lifetime-count-used-for-30-days', parsed.recent_note_count, x => x === '999');
  put({ blogger_id: 'audit-mcn', nickname: 'MCN', mcn_status: 'Example MCN' });
  put({ blogger_id: 'audit-mcn', nickname: 'MCN', mcn_status: parsed.mcn_status, detail_collect_status: '需复查' });
  observe('failed-capture-creates-mcn-exit', get('audit-mcn').mcn_history[0].current_mcn_status, x => x === '无机构');
  const metrics = { read_median: '0', interaction_median: '', coop_30_read_median: '321', coop_30_interaction_median: '12' };
  context.fillPrimaryMetricsFromCoop(metrics);
  observe('daily-metrics-filled-from-coop', metrics, x => x.read_median === '321' && x.interaction_median === '12');
  observe('daily-date-buckets-collide', [1, 2].map(date => context.apiKindFromUrl(`/api/solar/kol/data/notes_rate?business=0&dateType=${date}`)), x => x[0] === 'notesRate' && x[1] === 'notesRate');
  const uid = '000000000000000000000abc';
  context.storeApiResponse({url:`https://pgy.xiaohongshu.com/api/solar/kol/data/notes_rate?userId=${uid}&business=0&dateType=1`, status:403, body:{code:403, message:'denied'}});
  observe('error-response-accepted-by-capture', Boolean(context.state.apiResponses.get(uid)?.notesRate), Boolean);
  put({ blogger_id: 'audit-json', nickname: 'Json', raw_api_json: '{"profile":{"example":"test"}}' });
  const jsonDetail = get('audit-json');
  observe('raw-json-double-stored', JSON.parse(jsonDetail.latest_raw_json).raw_api_json === jsonDetail.latest_raw_api_json, Boolean);
  const csv = bloggersToCsv([jsonDetail]);
  observe('raw-api-leaks-into-business-export', { header: csv.split('\n')[0].includes('其他采集数据'), payload: csv.includes('profile') }, x => x.header && x.payload);
  put({ blogger_id: 'audit-search', nickname: '开局一口锅锅' });
  observe('chinese-substring-not-found', { prefix: store.listBloggers({keyword:'开局'}).total, substring: store.listBloggers({keyword:'一口锅'}).total }, x => x.prefix === 1 && x.substring === 0);
  const searchContext = vm.createContext({post:()=>{}, searchNickname:async()=>true, waitForRows:async()=>[{nickname:'Unrelated'}], rowNickname:row=>row.nickname, options:{delayMs:1400}});
  vm.runInContext(source.slice(source.indexOf('  async function findBestSearchRow('), source.indexOf('  async function collectBestSearchResult(')), searchContext);
  const searchResult = await searchContext.findBestSearchRow('Wanted', 1);
  observe('nickname-search-falls-back-to-wrong-person', searchResult.nickname, x => x === 'Unrelated');
  const writeContext = vm.createContext({
    state:{databaseBatchId:1, databaseWriteQueue:Promise.resolve(), databaseSavedCount:0},
    setStatus:()=>{},
    window:{desktopApi:{appendRecordsToDatabase:async()=>({ok:false,message:'simulated failure'}),finishDatabaseBatch:async()=>({ok:true})}}
  });
  vm.runInContext(source.slice(source.indexOf('async function appendRecordsToDatabase('), source.indexOf('function nowFileText(')), writeContext);
  await writeContext.appendRecordsToDatabase([{blogger_id:'fixture'}]);
  const finished = await writeContext.finishDatabaseBatch('完成', 0);
  observe('write-failure-finishes-as-saved', {error:writeContext.state.databaseError,message:finished}, x => x.error && x.message.includes('已边采边写入'));
  const mainSource = fs.readFileSync(path.join(root,'desktop/src/main.js'),'utf8');
  let spawnCount = 0;
  const mainContext = vm.createContext({
    isDataConsoleAlive:async()=>false, dataConsoleServerPath:()=>'/fixture/server.js',
    fs:{access:async()=>{}}, DATA_CONSOLE_URL:'http://127.0.0.1:3188',
    dataConsoleProcess:{killed:false,exitCode:1}, spawn:()=>{spawnCount+=1;}, setTimeout:callback=>callback()
  });
  vm.runInContext(mainSource.slice(mainSource.indexOf('async function ensureDataConsoleRunning('), mainSource.indexOf('ipcMain.handle("desktop:open-data-console"')), mainContext);
  const restart = await mainContext.ensureDataConsoleRunning();
  observe('exited-backend-not-restarted', {ok:restart.ok,spawnCount}, x => !x.ok && x.spawnCount === 0);
  store.importRecords({records:Array.from({length:205}, (_, i) => ({blogger_id:`export-${i}`,nickname:'ExportSample'}))});
  const { app } = createApp({ store });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const exported = await fetch(`${base}/api/bloggers/export?keyword=ExportSample`).then(r => r.text());
    observe('filtered-export-truncated', { total:store.listBloggers({keyword:'ExportSample'}).total, exported:parseCsvText(exported).length }, x => x.total === 205 && x.exported === 200);
    const target = get('audit-null');
    const response = await fetch(`${base}/api/bloggers/${target.id}`, {method:'DELETE'});
    observe('unauthenticated-delete', {status:response.status, deleted:!get('audit-null')}, x => x.status === 200 && x.deleted);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
  console.log(JSON.stringify({meaning:'Assertions confirm current defects, not acceptance passes', findings}, null, 2));
}
main().catch(error => {console.error(error); process.exitCode = 1;}).finally(() => store.db.close());
