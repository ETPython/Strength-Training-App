// 筋トレメニュー管理アプリ (ローカルストレージ保存)
const STORAGE_KEY = 'workout_menus_v1';
const CUSTOM_KEY = 'workout_custom_menus_v1';
const HISTORY_KEY = 'workout_history_v1';

function uid(){return Date.now().toString(36) + Math.random().toString(36).slice(2,6)}

function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){console.error(e); return []}
}

function save(data){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadHistory(){
  try{
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){console.error(e); return []}
}

function saveHistory(){
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function localDateString(date = new Date()){
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getSetData(item){
  if(Array.isArray(item.setData)){
    return item.setData.map(set => ({ weight: set.weight ?? '', reps: set.reps ?? '' }));
  }
  const setCount = Math.max(1, Number(item.sets) || 4);
  return Array.from({length: setCount}, (_, index) => ({
    weight: '',
    reps: Array.isArray(item.setReps) ? item.setReps[index] ?? '' : ''
  }));
}

function calculateLoad(setData){
  return setData.reduce((total, set) => {
    const weight = Number(set.weight);
    const reps = Number(set.reps);
    return Number.isFinite(weight) && Number.isFinite(reps) ? total + weight * reps : total;
  }, 0);
}

function formatLoad(value){
  return value.toLocaleString('ja-JP', {maximumFractionDigits: 2});
}

function createCard(item){
  const div = document.createElement('div');
  div.className = 'card';
  div.dataset.id = item.id;
  const setData = getSetData(item);
  const setRows = setData.map((set, index) => {
    return `<div class="set-log-row"><span class="set-number">${index + 1}</span><input class="set-weight" type="number" min="0" step="0.5" inputmode="decimal" aria-label="${escapeHtml(item.title)} ${index + 1}セット目の重量（kg）" placeholder="重量" value="${set.weight === '' ? '' : escapeHtml(set.weight)}"><span>kg</span><input class="set-reps" type="number" min="0" step="1" inputmode="numeric" aria-label="${escapeHtml(item.title)} ${index + 1}セット目の回数" placeholder="回数" value="${set.reps === '' ? '' : escapeHtml(set.reps)}"><span>回</span><button class="remove-set" type="button" aria-label="${index + 1}セット目を削除" title="このセットを削除">×</button></div>`;
  }).join('');
  div.innerHTML = `
    <div class="card-heading">
      <div class="info">
        <div class="title">${escapeHtml(item.title)}</div>
        <div class="meta">${setData.length}セット ・ 種類: ${escapeHtml(item.type)}${item.date ? ' ・ 予定日: ' + escapeHtml(item.date) : ''}</div>
      </div>
      <div class="actions">
        <input class="checkbox" type="checkbox" ${item.done ? 'checked' : ''} title="完了">
        <button class="edit">編集</button>
        <button class="del">削除</button>
      </div>
    </div>
    <div class="set-log">
      <div class="set-log-header"><span>セット</span><span>重量</span><span></span><span>回数</span><span></span><span></span></div>
      ${setRows}
    </div>
    <div class="exercise-load">総負荷 <strong class="exercise-load-value">${formatLoad(calculateLoad(setData))}</strong> kg・回</div>
    <button class="add-set" type="button" aria-label="${escapeHtml(item.title)}にセットを追加">＋ セット追加</button>
  `;
  return div;
}

function render(list){
  const container = document.getElementById('list');
  container.innerHTML = '';
  document.getElementById('totalLoad').textContent = formatLoad(menus.reduce((total, item) => total + calculateLoad(getSetData(item)), 0));
  if(list.length === 0){ container.innerHTML = '<p>メニューがありません。上のフォームで追加してください。</p>'; return; }
  list.forEach(item => container.appendChild(createCard(item)));
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])) }

// 初期化
let menus = load();
let history = loadHistory();

function renderHistory(){
  const selectedDate = document.getElementById('historyDate').value;
  const selectedRecords = history.filter(record => record.date === selectedDate);
  const historyList = document.getElementById('historyList');
  document.getElementById('historyTitle').textContent = `${selectedDate} の記録（${selectedRecords.length}件）`;
  historyList.innerHTML = '';

  if(selectedRecords.length === 0){
    historyList.innerHTML = '<p class="history-empty">この日の完了記録はありません。</p>';
  }else{
    selectedRecords.forEach(record => {
      const item = document.createElement('article');
      item.className = 'history-item';
      const title = document.createElement('strong');
      title.textContent = record.title;
      const details = document.createElement('span');
      details.textContent = `${record.sets}セット ・ ${record.type}${!record.setReps && record.reps ? ` ・ 回数: ${record.reps}` : ''}`;
      item.append(title, details);
      if(Array.isArray(record.setReps)){
        const setLog = document.createElement('div');
        setLog.className = 'history-set-log';
        record.setReps.forEach((reps, index) => {
          const set = document.createElement('span');
          set.textContent = `${index + 1}セット: ${reps === '' || reps == null ? '未入力' : `${reps}回`}`;
          setLog.appendChild(set);
        });
        item.appendChild(setLog);
      }
      if(Array.isArray(record.setData)){
        const setLog = document.createElement('div');
        setLog.className = 'history-set-log';
        record.setData.forEach((set, index) => {
          const detail = document.createElement('span');
          detail.textContent = `${index + 1}セット: ${set.weight === '' ? '未入力' : `${set.weight}kg`} × ${set.reps === '' ? '未入力' : `${set.reps}回`}`;
          setLog.appendChild(detail);
        });
        item.appendChild(setLog);
        const load = document.createElement('span');
        load.textContent = `総負荷 ${formatLoad(record.totalLoad || 0)} kg・回`;
        item.appendChild(load);
      }
      historyList.appendChild(item);
    });
  }

  renderHistoryChart(selectedDate);
}

function renderHistoryChart(endDate){
  const chart = document.getElementById('historyChart');
  if(!endDate){ chart.innerHTML = '<p class="history-empty">日付を選択してください。</p>'; return; }
  const [year, month, day] = endDate.split('-').map(Number);
  const dates = Array.from({length: 30}, (_, index) => {
    const date = new Date(year, month - 1, day - (29 - index));
    return localDateString(date);
  });
  const counts = dates.map(date => history.filter(record => record.date === date).length);
  const width = 720;
  const height = 250;
  const left = 42;
  const right = 12;
  const top = 18;
  const bottom = 42;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const tickMax = Math.max(2, Math.ceil(Math.max(...counts) / 2) * 2);
  const points = counts.map((count, index) => ({
    x: left + (plotWidth * index) / (counts.length - 1),
    y: top + plotHeight - (count / tickMax) * plotHeight,
    count
  }));
  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
  const grid = Array.from({length: 3}, (_, index) => {
    const value = (tickMax * index) / 2;
    const y = top + plotHeight - (plotHeight * index) / 2;
    return `<line class="chart-grid" x1="${left}" y1="${y}" x2="${width - right}" y2="${y}"/><text class="chart-label" x="${left - 10}" y="${y + 4}" text-anchor="end">${value}</text>`;
  }).join('');
  const labels = [0, 7, 14, 21, 29].map(index => {
    const date = dates[index].slice(5).replace('-', '/');
    return `<text class="chart-label" x="${points[index].x}" y="${height - 12}" text-anchor="middle">${date}</text>`;
  }).join('');
  const circles = points.map((point, index) => `<circle class="chart-point" cx="${point.x}" cy="${point.y}" r="${point.count ? 4 : 2}" aria-label="${dates[index]}: ${point.count}件"><title>${dates[index]}: ${point.count}件</title></circle>`).join('');

  chart.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="過去30日間の日別完了種目数の折れ線グラフ">${grid}<path class="chart-line" d="${line}"/>${circles}${labels}</svg>`;
}

function addHistoryRecord(item){
  history.push({
    id: uid(),
    workoutId: item.id,
    date: localDateString(),
    title: item.title,
    sets: item.sets,
    setData: getSetData(item).map(set => ({...set})),
    totalLoad: calculateLoad(getSetData(item)),
    type: item.type,
    muscle: item.muscle
  });
  saveHistory();
}

function getFormValues(){
  const sets = 4;
  return {
    id: uid(),
    title: document.getElementById('title').value.trim(),
    sets,
    reps: '',
    setReps: Array.from({length: sets}, () => ''),
    setData: Array.from({length: sets}, () => ({weight: '', reps: ''})),
    type: document.getElementById('type').value,
    muscle: document.getElementById('muscle').value || '',
    date: document.getElementById('date').value || '',
    created: Date.now(),
    done: false
  }
}

function clearForm(){ 
  const muscleEl = document.getElementById('muscle');
  if(muscleEl) muscleEl.value = '';
  const title = document.getElementById('title');
  if(title){ title.innerHTML = ''; title.appendChild(new Option('まず部位を選んでください','')); title.disabled = true; }
  document.getElementById('date').value='';
}

function refreshView(){
  // フィルタとソート
  const q = document.getElementById('filter').value.trim().toLowerCase();
  const muscleFilter = document.getElementById('muscleFilter').value;
  const dateFilter = document.getElementById('dateFilter').value;
  const sort = document.getElementById('sort').value;
  let out = menus.filter(m => `${m.title} ${m.type} ${m.reps || ''} ${JSON.stringify(getSetData(m))}`.toLowerCase().includes(q));
  if(muscleFilter){ out = out.filter(m => m.muscle === muscleFilter); }
  if(dateFilter){ out = out.filter(m => m.date === dateFilter); }
  if(sort === 'type') out.sort((a,b)=>a.type.localeCompare(b.type));
  if(sort === 'title') out.sort((a,b)=>a.title.localeCompare(b.title));
  if(sort === 'created') out.sort((a,b)=>a.created - b.created);
  render(out);
}

// イベント
document.getElementById('add').addEventListener('click', ()=>{
  const data = getFormValues();
  if(!data.title){ alert('メニュー名を入力してください'); return; }
  menus.push(data);
  save(menus);
  clearForm();
  refreshView();
});

document.getElementById('clearAll').addEventListener('click', ()=>{
  if(!confirm('本当に全メニューを削除しますか？')) return;
  menus = [];
  save(menus);
  refreshView();
});

document.getElementById('filter').addEventListener('input', refreshView);
document.getElementById('sort').addEventListener('change', refreshView);
document.getElementById('dateFilter').addEventListener('change', refreshView);
document.getElementById('clearDateFilter').addEventListener('click', ()=>{ document.getElementById('dateFilter').value=''; refreshView(); });
// populate muscleFilter options and wire event
const muscleOptions = [
  {v:'', t:'全ての部位'},
  {v:'chest', t:'胸'},
  {v:'back', t:'背中'},
  {v:'legs', t:'脚'},
  {v:'shoulders', t:'肩'},
  {v:'arms', t:'腕'},
  {v:'core', t:'体幹'},
  {v:'calves', t:'ふくらはぎ'},
  {v:'full', t:'全身'}
];
const mf = document.getElementById('muscleFilter');
if(mf){
  mf.innerHTML = '';
  muscleOptions.forEach(o=>{ const opt = document.createElement('option'); opt.value = o.v; opt.textContent = o.t; mf.appendChild(opt); });
  mf.addEventListener('change', refreshView);
}

// メニュー候補を部位ごとに定義（ユーザー指定リスト）
const menuByMuscle = {
  chest: [
    'ベンチプレス（バーベル）',
    'ダンベルフライ',
    '腕立て伏せ（Push-up）',
    'インクラインダンベルプレス'
  ],
  back: [
    '懸垂（Pull-up）',
    'ラットプルダウン',
    'ベントオーバーロウ（バーベル）',
    'シーテッドロー（ケーブル）'
  ],
  shoulders: [
    'ショルダープレス（ダンベル or バーベル）',
    'サイドレイズ',
    'フロントレイズ',
    'リアレイズ'
  ],
  arms: [
    'バイセップカール（ダンベル）',
    'ハンマーカール',
    'トライセップスプッシュダウン（ケーブル）',
    'ディップス'
  ],
  legs: [
    'スクワット（バーベル）',
    'ランジ',
    'レッグプレス',
    'カーフレイズ'
  ],
  core: [
    'クランチ',
    'レッグレイズ',
    'プランク',
    'バイシクルクランチ'
  ],
  calves: ['カーフレイズ'],
  full: ['バーピー','マウンテンクライマー']
};

// カスタムメニューをローカルストレージから読み込む/保存する
function loadCustomMenus(){
  try{
    const raw = localStorage.getItem(CUSTOM_KEY);
    return raw ? JSON.parse(raw) : {};
  }catch(e){ console.error('custom load', e); return {}; }
}
function saveCustomMenus(obj){
  try{ localStorage.setItem(CUSTOM_KEY, JSON.stringify(obj)); }catch(e){ console.error('custom save', e); }
}
let customMenus = loadCustomMenus();

function populateTitleOptions(muscle){
  const title = document.getElementById('title');
  if(!title) return;
  title.innerHTML = '';
  if(!muscle){
    title.appendChild(new Option('まず部位を選んでください',''));
    title.disabled = true;
    return;
  }
  const base = menuByMuscle[muscle] || [];
  const extra = (customMenus && customMenus[muscle]) ? customMenus[muscle] : [];
  const list = base.concat(extra);
  title.disabled = false;
  title.appendChild(new Option('選択してください',''));
  list.forEach(t => title.appendChild(new Option(t,t)));
}

// muscle -> title の連動
const muscleSelect = document.getElementById('muscle');
if(muscleSelect){
  muscleSelect.addEventListener('change', e=> populateTitleOptions(e.target.value));
}

// 新しいメニューを追加するハンドラ
const addMenuBtn = document.getElementById('addMenu');
if(addMenuBtn){
  addMenuBtn.addEventListener('click', ()=>{
    const muscle = document.getElementById('muscle').value;
    const newName = (document.getElementById('newMenu').value || '').trim();
    if(!muscle){ alert('先に部位を選んでください'); return; }
    if(!newName){ alert('追加するメニュー名を入力してください'); return; }
    customMenus[muscle] = customMenus[muscle] || [];
    // 重複チェック
    if(customMenus[muscle].includes(newName) || (menuByMuscle[muscle] || []).includes(newName)){
      alert('そのメニューは既に存在します');
      return;
    }
    customMenus[muscle].push(newName);
    saveCustomMenus(customMenus);
    populateTitleOptions(muscle);
    // 選択状態にする
    const titleEl = document.getElementById('title');
    titleEl.value = newName;
    document.getElementById('newMenu').value = '';
  });
}

// list イベント代理
document.getElementById('list').addEventListener('click', (e)=>{
  const card = e.target.closest('.card');
  if(!card) return;
  const id = card.dataset.id;
  if(e.target.classList.contains('del')){
    if(!confirm('削除してよいですか？')) return;
    menus = menus.filter(m=>m.id !== id);
    save(menus); refreshView();
    return;
  }
  if(e.target.classList.contains('add-set') || e.target.classList.contains('remove-set')){
    const item = menus.find(menu => menu.id === id);
    item.setData = Array.from(card.querySelectorAll('.set-log-row'), row => ({
      weight: row.querySelector('.set-weight').value === '' ? '' : Number(row.querySelector('.set-weight').value),
      reps: row.querySelector('.set-reps').value === '' ? '' : Number(row.querySelector('.set-reps').value)
    }));
    if(e.target.classList.contains('add-set')) item.setData.push({weight: '', reps: ''});
    else if(item.setData.length > 1) item.setData.splice(Array.from(card.querySelectorAll('.remove-set')).indexOf(e.target), 1);
    item.sets = item.setData.length;
    save(menus);
    refreshView();
    return;
  }
  if(e.target.classList.contains('edit')){
    const item = menus.find(m=>m.id===id);
    const newTitle = prompt('メニュー名を編集してください', item.title);
    if(newTitle === null) return;
    item.title = newTitle.trim() || item.title;
    item.type = prompt('種別を編集 (strength / hypertrophy / endurance / mobility)', item.type) || item.type;
    const newMuscle = prompt('部位を編集 (chest/back/legs/shoulders/arms/core/calves/full)', item.muscle || '');
    if(newMuscle !== null){ item.muscle = newMuscle.trim(); }
    const newDate = prompt('予定日を編集 (YYYY-MM-DD 形式で入力、空欄で削除)', item.date || '');
    if(newDate !== null){ item.date = newDate.trim(); }
    save(menus); refreshView();
    return;
  }
});

document.getElementById('list').addEventListener('input', (e)=>{
  if(!e.target.classList.contains('set-reps') && !e.target.classList.contains('set-weight')) return;
  const card = e.target.closest('.card');
  const item = menus.find(menu => menu.id === card.dataset.id);
  item.setData = Array.from(card.querySelectorAll('.set-log-row'), row => ({
    weight: row.querySelector('.set-weight').value === '' ? '' : Number(row.querySelector('.set-weight').value),
    reps: row.querySelector('.set-reps').value === '' ? '' : Number(row.querySelector('.set-reps').value)
  }));
  item.sets = item.setData.length;
  save(menus);
  card.querySelector('.exercise-load-value').textContent = formatLoad(calculateLoad(item.setData));
  document.getElementById('totalLoad').textContent = formatLoad(menus.reduce((total, menu) => total + calculateLoad(getSetData(menu)), 0));
});

// 完了チェック
document.getElementById('list').addEventListener('change', (e)=>{
  if(e.target.classList.contains('checkbox')){
    const card = e.target.closest('.card');
    const id = card.dataset.id;
    const item = menus.find(m=>m.id===id);
    item.setData = Array.from(card.querySelectorAll('.set-log-row'), row => ({
      weight: row.querySelector('.set-weight').value === '' ? '' : Number(row.querySelector('.set-weight').value),
      reps: row.querySelector('.set-reps').value === '' ? '' : Number(row.querySelector('.set-reps').value)
    }));
    item.sets = item.setData.length;
    item.done = e.target.checked;
    if(item.done) addHistoryRecord(item);
    save(menus); refreshView();
    renderHistory();
  }
});

document.getElementById('historyDate').value = localDateString();
document.getElementById('historyDate').addEventListener('change', renderHistory);

// エクスポート
document.getElementById('export').addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify(menus, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'workout_menus.json';
  a.click();
});

// インポート
document.getElementById('importFile').addEventListener('change', (e)=>{
  const f = e.target.files[0];
  if(!f) return;
  const r = new FileReader();
  r.onload = ()=>{
    try{
      const parsed = JSON.parse(r.result);
      if(!Array.isArray(parsed)) throw new Error('JSON must be array');
      // 単純マージ（ID が衝突しないように新しい ID を振る）
      parsed.forEach(p=>{ p.id = uid(); p.date = p.date || ''; p.muscle = p.muscle || ''; menus.push(p); });
      save(menus); refreshView();
      alert('インポート完了');
    }catch(err){ alert('インポート失敗: ' + err.message); }
  };
  r.readAsText(f);
});

// 初期レンダリング
refreshView();
renderHistory();

// 開発補助: sample データが無ければサンプルを追加
if(menus.length === 0){
  fetch('data_sample.json').then(r=>r.json()).then(s=>{ menus = s.map(x=>({ ...x, id: uid(), created: Date.now(), date: x.date || '' })); save(menus); refreshView(); }).catch(()=>{});
}