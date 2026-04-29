// ============================================================
// CBC 系統測試問題管理系統 - 前端應用
// Vue 3 + Tailwind CSS (CDN)
// ============================================================

// ── 1. 設定（請填入您的值）───────────────────────────────────
const CONFIG = {
  GAS_URL:          'https://script.google.com/macros/s/AKfycbz6umovm7oZKGQ2gOmFSFpolQV9vbBhGJE1d8Rnox9x_2dgYQphwPcTSF1vGNwiZ7kS/exec',
  GOOGLE_CLIENT_ID: '1032610689790-977idfq4tsh9v72dvr0t3elctpj6cvsj.apps.googleusercontent.com'
};

// ── 2. 全域狀態 ───────────────────────────────────────────────
const { createApp, ref, reactive, computed, onMounted, watch, nextTick } = Vue;

const store = reactive({
  user:    null,   // { name, email, role }
  token:   null,
  options: null,   // { severity, type, result, status, users, testCases }
  loading: false,
  toast:   null
});

// ── 3. API 模組 ───────────────────────────────────────────────
const api = {
  async get(params) {
    if (!store.token) throw new Error('Not authenticated');
    const qs = new URLSearchParams({ ...params, token: store.token }).toString();
    const res = await fetch(`${CONFIG.GAS_URL}?${qs}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = await res.arrayBuffer();
    const text = new TextDecoder('utf-8').decode(buf);
    const data = JSON.parse(text);
    if (!data.success) throw new Error(data.error || 'API error');
    return data;
  },

  async post(body) {
    if (!store.token) throw new Error('Not authenticated');
    const res = await fetch(CONFIG.GAS_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ...body, token: store.token })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = await res.arrayBuffer();
    const text = new TextDecoder('utf-8').decode(buf);
    const data = JSON.parse(text);
    if (!data.success) throw new Error(data.error || 'API error');
    return data;
  },

  getOptions:   ()       => api.get({ action: 'getOptions' }),
  listIssues:   (f = {}) => api.get({ action: 'list', ...f }),
  exportIssues: (f = {}) => api.get({ action: 'export', ...f }),
  getStats:     ()       => api.get({ action: 'stats' }),

  createIssue:  (d) => api.post({ action: 'create',     ...d }),
  updateIssue:  (d) => api.post({ action: 'update',     ...d }),
  deleteIssue:  (n) => api.post({ action: 'delete',     number: n }),
  restoreIssue: (n) => api.post({ action: 'restore',    number: n }),
  uploadFile:   (d) => api.post({ action: 'uploadFile', ...d })
};

// ── 4. 工具函式 ───────────────────────────────────────────────
function showToast(msg, type = 'success') {
  store.toast = { msg, type };
  setTimeout(() => { store.toast = null; }, 3000);
}

function today() {
  return new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
    .replace(/\//g, '/');
}

function formatDate(d) {
  if (!d) return '';
  return d.toString().replace(/-/g, '/');
}

function severityColor(s) {
  const map = {
    '系統崩潰(嚴重)':   'bg-red-100 text-red-800',
    '功能無法運作(高)':  'bg-orange-100 text-orange-800',
    '一般錯誤(中)':      'bg-yellow-100 text-yellow-800',
    '建議修正(低)':      'bg-green-100 text-green-800'
  };
  return map[s] || 'bg-gray-100 text-gray-700';
}

function statusColor(s) {
  const map = { 'Open': 'bg-blue-100 text-blue-800', 'Closed': 'bg-green-100 text-green-800', 'Reopen': 'bg-orange-100 text-orange-800', '已刪除': 'bg-gray-200 text-gray-500' };
  return map[s] || 'bg-gray-100 text-gray-700';
}

// ── 5. 路由 (Hash-based) ──────────────────────────────────────
const router = reactive({
  current: window.location.hash || '#/list',
  params:  {}
});

function parseHash() {
  const hash = window.location.hash || '#/list';
  const [path, ...rest] = hash.slice(1).split('/').filter(Boolean);
  router.current = '/' + (path || 'list');
  router.params  = { id: rest[0] || null };
}

window.addEventListener('hashchange', parseHash);
parseHash();

function navigate(path) {
  window.location.hash = '#' + path;
}

// ── 6. Google OAuth ───────────────────────────────────────────
function initGoogleAuth() {
  if (!window.google || !CONFIG.GOOGLE_CLIENT_ID || CONFIG.GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') return;
  google.accounts.id.initialize({
    client_id: CONFIG.GOOGLE_CLIENT_ID,
    callback:  handleGoogleSignIn,
    auto_select: false
  });
  const btn = document.getElementById('google-signin-btn');
  if (btn) {
    google.accounts.id.renderButton(btn, { theme: 'outline', size: 'large', locale: 'zh-TW' });
  }
}

function handleGoogleSignIn(response) {
  try {
    // 暫存 token，姓名等 API 回應後從白名單取得（避免 JWT 中文亂碼）
    store.token = response.credential;
    store.user  = { name: '', email: '', role: null };
    sessionStorage.setItem('cbc_token', response.credential);
    loadOptionsAndNavigate();
  } catch (e) {
    showToast('登入失敗: ' + e.message, 'error');
  }
}

async function loadOptionsAndNavigate() {
  try {
    store.loading = true;
    const res = await api.getOptions();
    store.options = res.data;
    // 姓名與角色完全從後端白名單取得，不依賴 JWT payload
    if (res.currentUser) {
      store.user = { name: res.currentUser.name, email: res.currentUser.email || store.user.email, role: res.currentUser.role };
      sessionStorage.setItem('cbc_user', JSON.stringify(store.user));
    }
    navigate('/list');
  } catch (e) {
    store.token = null;
    store.user  = null;
    sessionStorage.removeItem('cbc_token');
    sessionStorage.removeItem('cbc_user');
    showToast(e.message, 'error');
  } finally {
    store.loading = false;
  }
}

function logout() {
  if (window.google) google.accounts.id.disableAutoSelect();
  store.token = null;
  store.user  = null;
  store.options = null;
  sessionStorage.removeItem('cbc_token');
  sessionStorage.removeItem('cbc_user');
  navigate('/login');
}

// 嘗試從 sessionStorage 恢復登入
function restoreSession() {
  const t = sessionStorage.getItem('cbc_token');
  const u = sessionStorage.getItem('cbc_user');
  if (t && u) {
    try {
      const base64 = t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const binary = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const payload = JSON.parse(new TextDecoder('utf-8').decode(binary));
      if (payload.exp && payload.exp * 1000 > Date.now()) {
        store.token = t;
        store.user  = JSON.parse(u);
        return true;
      }
    } catch (_) {}
    sessionStorage.removeItem('cbc_token');
    sessionStorage.removeItem('cbc_user');
  }
  return false;
}

// ── 7. 元件定義 ───────────────────────────────────────────────

// ──── 7.1 AppHeader ────
const AppHeader = {
  template: `
    <header class="bg-white shadow-sm sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <div class="flex items-center gap-6">
          <span class="font-bold text-blue-700 text-lg cursor-pointer" @click="navigate('/list')">CBC 問題管理</span>
          <nav class="flex gap-4 text-sm">
            <a @click.prevent="navigate('/list')"      href="#" :class="navClass('/list')">問題單列表</a>
            <a @click.prevent="navigate('/new')"       href="#" :class="navClass('/new')">新增問題單</a>
            <a @click.prevent="navigate('/dashboard')" href="#" :class="navClass('/dashboard')">儀表板</a>
          </nav>
        </div>
        <div class="flex items-center gap-3 text-sm">
          <span class="text-gray-600">{{ store.user?.name }}</span>
          <span v-if="store.user?.role === 'admin'" class="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">管理員</span>
          <button @click="logout" class="text-gray-500 hover:text-red-600 transition">登出</button>
        </div>
      </div>
    </header>
  `,
  setup() {
    const navClass = (path) => ({
      'text-blue-600 font-semibold': router.current === path,
      'text-gray-500 hover:text-blue-600': router.current !== path,
      'cursor-pointer transition': true
    });
    return { store, router, navigate, logout, navClass };
  }
};

// ──── 7.2 LoginView ────
const LoginView = {
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div class="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md text-center">
        <div class="text-3xl mb-2">📋</div>
        <h1 class="text-2xl font-bold text-gray-800 mb-1">CBC 系統測試問題管理</h1>
        <p class="text-gray-500 text-sm mb-8">中央銀行外匯資料處理系統</p>
        <div v-if="configMissing" class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm text-left">
          ⚠️ 請先在 <code>app.js</code> 設定 <code>CONFIG.GAS_URL</code> 與 <code>CONFIG.GOOGLE_CLIENT_ID</code>
        </div>
        <div id="google-signin-btn" class="flex justify-center"></div>
        <p class="mt-4 text-xs text-gray-400">僅限授權人員登入</p>
      </div>
    </div>
  `,
  setup() {
    const configMissing = computed(() =>
      CONFIG.GAS_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL' ||
      CONFIG.GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID'
    );
    onMounted(() => {
      nextTick(() => initGoogleAuth());
    });
    return { configMissing };
  }
};

// ──── 7.3 IssueListView ────
const IssueListView = {
  template: `
    <div>
      <app-header />
      <div class="max-w-7xl mx-auto px-4 py-6">
        <!-- 篩選列 -->
        <div class="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-end">
          <div class="flex-1 min-w-36">
            <label class="block text-xs text-gray-500 mb-1">狀態</label>
            <select v-model="filters.status" @change="load" class="w-full border rounded px-2 py-1.5 text-sm">
              <option value="">全部</option>
              <option v-for="s in statusOpts" :key="s">{{ s }}</option>
            </select>
          </div>
          <div class="flex-1 min-w-36">
            <label class="block text-xs text-gray-500 mb-1">嚴重度</label>
            <select v-model="filters.severity" @change="load" class="w-full border rounded px-2 py-1.5 text-sm">
              <option value="">全部</option>
              <option v-for="s in severityOpts" :key="s">{{ s }}</option>
            </select>
          </div>
          <div class="flex-1 min-w-36">
            <label class="block text-xs text-gray-500 mb-1">提出人員</label>
            <select v-model="filters.reporter" @change="load" class="w-full border rounded px-2 py-1.5 text-sm">
              <option value="">全部</option>
              <option v-for="u in userOpts" :key="u">{{ u }}</option>
            </select>
          </div>
          <div class="flex-1 min-w-48">
            <label class="block text-xs text-gray-500 mb-1">關鍵字</label>
            <input v-model="filters.keyword" @keyup.enter="load" placeholder="問題描述/功能/處理方式" class="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
          <div v-if="isAdmin" class="flex items-center gap-1">
            <input type="checkbox" id="showDeleted" v-model="filters.showDeleted" @change="load" class="rounded" />
            <label for="showDeleted" class="text-sm text-gray-600">顯示已刪除</label>
          </div>
          <button @click="load" class="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">搜尋</button>
          <button @click="resetFilters" class="px-4 py-1.5 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300">重置</button>
        </div>

        <!-- 工具列 -->
        <div class="flex justify-between items-center mb-3">
          <div class="text-sm text-gray-500">共 {{ issues.length }} 筆</div>
          <div class="flex gap-2">
            <button @click="navigate('/new')" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1">
              <span>＋</span> 新增問題單
            </button>
            <button @click="exportExcel" class="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">📊 匯出 Excel</button>
            <button @click="exportPdf"   class="px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">📄 匯出 PDF</button>
          </div>
        </div>

        <!-- 表格 -->
        <div class="bg-white rounded-xl shadow-sm overflow-x-auto">
          <div v-if="loading" class="p-10 text-center text-gray-400">載入中...</div>
          <div v-else-if="issues.length === 0" class="p-10 text-center text-gray-400">無符合條件的問題單</div>
          <table v-else class="w-full text-sm">
            <thead class="bg-gray-50 border-b">
              <tr>
                <th class="px-3 py-3 text-left font-medium text-gray-600 whitespace-nowrap">編號</th>
                <th class="px-3 py-3 text-left font-medium text-gray-600 whitespace-nowrap">提出日期</th>
                <th class="px-3 py-3 text-left font-medium text-gray-600 whitespace-nowrap">提出人員</th>
                <th class="px-3 py-3 text-left font-medium text-gray-600">功能項目</th>
                <th class="px-3 py-3 text-left font-medium text-gray-600">問題描述</th>
                <th class="px-3 py-3 text-left font-medium text-gray-600 whitespace-nowrap">嚴重度</th>
                <th class="px-3 py-3 text-left font-medium text-gray-600 whitespace-nowrap">狀態</th>
                <th class="px-3 py-3 text-left font-medium text-gray-600 whitespace-nowrap">類型</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="issue in issues" :key="issue.number"
                  :class="['hover:bg-blue-50 cursor-pointer transition', issue.status === '已刪除' ? 'bg-gray-50 opacity-60' : '']"
                  @click="navigate('/detail/' + issue.number)">
                <td class="px-3 py-3 text-blue-600 font-medium whitespace-nowrap">{{ issue.number }}</td>
                <td class="px-3 py-3 text-gray-600 whitespace-nowrap">{{ issue.date }}</td>
                <td class="px-3 py-3 text-gray-600 whitespace-nowrap">{{ issue.reporter }}</td>
                <td class="px-3 py-3 text-gray-700 max-w-xs truncate">{{ issue.feature }}</td>
                <td class="px-3 py-3 text-gray-700 max-w-sm truncate">{{ issue.desc }}</td>
                <td class="px-3 py-3 whitespace-nowrap">
                  <span :class="['px-2 py-0.5 rounded-full text-xs font-medium', severityColor(issue.severity)]">{{ issue.severity }}</span>
                </td>
                <td class="px-3 py-3 whitespace-nowrap">
                  <span :class="['px-2 py-0.5 rounded-full text-xs font-medium', statusColor(issue.status)]">{{ issue.status }}</span>
                </td>
                <td class="px-3 py-3 text-gray-500 whitespace-nowrap">{{ issue.type }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  components: { AppHeader },
  setup() {
    const issues  = ref([]);
    const loading = ref(false);
    const filters = reactive({ status: '', severity: '', reporter: '', keyword: '', showDeleted: false });

    const isAdmin      = computed(() => store.user?.role === 'admin');
    const statusOpts   = computed(() => store.options?.status   || []);
    const severityOpts = computed(() => store.options?.severity || []);
    const userOpts     = computed(() => store.options?.users    || []);

    async function load() {
      loading.value = true;
      try {
        const params = {};
        if (filters.status)      params.status      = filters.status;
        if (filters.severity)    params.severity    = filters.severity;
        if (filters.reporter)    params.reporter    = filters.reporter;
        if (filters.keyword)     params.keyword     = filters.keyword;
        if (filters.showDeleted) params.showDeleted = 'true';
        const res = await api.listIssues(params);
        issues.value = res.data;
      } catch (e) {
        showToast(e.message, 'error');
      } finally {
        loading.value = false;
      }
    }

    function resetFilters() {
      Object.assign(filters, { status: '', severity: '', reporter: '', keyword: '', showDeleted: false });
      load();
    }

    function exportExcel() {
      if (issues.value.length === 0) { showToast('無資料可匯出', 'error'); return; }
      const headers = ['編號','提出日期','提出人員','測試案例','功能項目','問題描述','嚴重度','處理人員','問題類型','處理完成日期','測試人員','測試結果','覆測人員','覆測結果','問題狀態','備註'];
      const rows = issues.value.map(i => [i.number, i.date, i.reporter, i.testCase, i.feature, i.desc, i.severity, i.handler, i.type, i.resolveDate, i.tester, i.testResult, i.reviewer, i.reviewResult, i.status, i.remark]);
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '系統測試問題紀錄表');
      XLSX.writeFile(wb, `CBC系統測試問題紀錄表_${new Date().toISOString().slice(0,10).replace(/-/g,'')}.xlsx`);
    }

    function exportPdf() {
      if (issues.value.length === 0) { showToast('無資料可匯出', 'error'); return; }
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      doc.setFont('helvetica');
      doc.setFontSize(14);
      doc.text('CBC \u7cfb\u7d71\u6e2c\u8a66\u554f\u984c\u7d00\u9304\u8868', 14, 15);
      doc.autoTable({
        startY: 22,
        head: [['編號','提出日期','提出人員','功能項目','嚴重度','狀態','類型']],
        body: issues.value.map(i => [i.number, i.date, i.reporter, i.feature, i.severity, i.status, i.type]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [37, 99, 235] }
      });
      doc.save(`CBC系統測試問題紀錄表_${new Date().toISOString().slice(0,10).replace(/-/g,'')}.pdf`);
    }

    onMounted(load);
    return { issues, loading, filters, isAdmin, statusOpts, severityOpts, userOpts, load, resetFilters, navigate, exportExcel, exportPdf, severityColor, statusColor };
  }
};

// ──── 7.4 IssueFormView (新增/編輯) ────
const IssueFormView = {
  template: `
    <div>
      <app-header />
      <div class="max-w-4xl mx-auto px-4 py-6">
        <div class="flex items-center gap-3 mb-6">
          <button @click="navigate('/list')" class="text-gray-400 hover:text-gray-600">← 返回列表</button>
          <h1 class="text-xl font-bold text-gray-800">{{ isEdit ? '編輯問題單 ' + form.number : '新增問題單' }}</h1>
        </div>

        <form @submit.prevent="submit" class="space-y-6">

          <!-- 提出階段 -->
          <div class="bg-white rounded-xl shadow-sm p-6">
            <h2 class="text-base font-semibold text-blue-700 mb-4 border-b pb-2">📝 提出階段</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-if="isEdit">
                <label class="label">問題單編號</label>
                <input :value="form.number" readonly class="input bg-gray-50 text-gray-500" />
              </div>
              <div>
                <label class="label">提出日期 <span class="text-red-500">*</span></label>
                <input v-model="form.date" type="date" :readonly="!canEditReporter" :class="['input', !canEditReporter && 'bg-gray-50']" required />
              </div>
              <div>
                <label class="label">提出人員</label>
                <input :value="store.user?.name" readonly class="input bg-gray-50 text-gray-500" />
              </div>
              <div>
                <label class="label">測試案例編號</label>
                <select v-model="form.testCase" @change="onTestCaseChange" :disabled="!canEditReporter" class="input">
                  <option value="">請選擇</option>
                  <option v-for="tc in testCaseOpts" :key="tc.id" :value="tc.id">{{ tc.id }}</option>
                </select>
              </div>
              <div>
                <label class="label">測試功能項目</label>
                <input v-model="form.feature" :readonly="!canEditReporter" :class="['input', !canEditReporter && 'bg-gray-50']" placeholder="自動填入或手動輸入" />
              </div>
              <div class="md:col-span-2">
                <label class="label">問題描述 <span class="text-red-500">*</span></label>
                <textarea v-model="form.desc" :readonly="!canEditReporter" rows="3" :class="['input resize-none', !canEditReporter && 'bg-gray-50']" required placeholder="詳細描述問題現象..."></textarea>
              </div>
              <div>
                <label class="label">問題嚴重度 <span class="text-red-500">*</span></label>
                <select v-model="form.severity" :disabled="!canEditReporter" class="input" required>
                  <option value="">請選擇</option>
                  <option v-for="s in severityOpts" :key="s">{{ s }}</option>
                </select>
              </div>
              <div>
                <label class="label">備註</label>
                <input v-model="form.remark" class="input" placeholder="選填" />
              </div>
            </div>

            <!-- 附件上傳 -->
            <div class="mt-4">
              <label class="label">附件 (JPG/PNG/GIF，每檔 ≤5MB，最多 5 個)</label>
              <div class="flex flex-wrap gap-3 mt-2">
                <div v-for="(att, idx) in attachments" :key="idx" class="relative group">
                  <img :src="att.url" class="w-20 h-20 object-cover rounded border" />
                  <button type="button" @click="removeAttachment(idx)" class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition">✕</button>
                  <div class="text-xs text-center text-gray-400 mt-1 w-20 truncate">{{ att.name }}</div>
                </div>
                <label v-if="attachments.length < 5 && canEditReporter" class="w-20 h-20 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition text-gray-400">
                  <span class="text-2xl">＋</span>
                  <span class="text-xs">上傳附件</span>
                  <input type="file" accept="image/jpeg,image/png,image/gif" class="hidden" @change="handleFileUpload" />
                </label>
              </div>
              <div v-if="uploadingFile" class="text-sm text-blue-500 mt-2">上傳中...</div>
            </div>
          </div>

          <!-- 處理階段 -->
          <div class="bg-white rounded-xl shadow-sm p-6">
            <h2 class="text-base font-semibold text-orange-600 mb-4 border-b pb-2">🔧 處理階段</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="label">處理人員</label>
                <select v-model="form.handler" class="input">
                  <option value="">請選擇</option>
                  <option v-for="u in userOpts" :key="u">{{ u }}</option>
                </select>
              </div>
              <div>
                <label class="label">問題類型</label>
                <select v-model="form.type" class="input">
                  <option value="">請選擇</option>
                  <option v-for="t in typeOpts" :key="t">{{ t }}</option>
                </select>
              </div>
              <div class="md:col-span-2">
                <label class="label">問題原因及處理方式</label>
                <textarea v-model="form.solution" rows="3" class="input resize-none" placeholder="描述問題原因及處理方式..."></textarea>
              </div>
              <div>
                <label class="label">處理完成日期</label>
                <input v-model="form.resolveDate" type="date" class="input" />
              </div>
            </div>
          </div>

          <!-- 覆測階段 -->
          <div class="bg-white rounded-xl shadow-sm p-6">
            <h2 class="text-base font-semibold text-green-600 mb-4 border-b pb-2">✅ 覆測階段</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="label">測試人員</label>
                <select v-model="form.tester" class="input">
                  <option value="">請選擇</option>
                  <option v-for="u in userOpts" :key="u">{{ u }}</option>
                </select>
              </div>
              <div>
                <label class="label">測試日期</label>
                <input v-model="form.testDate" type="date" class="input" />
              </div>
              <div>
                <label class="label">測試結果</label>
                <select v-model="form.testResult" class="input">
                  <option value="">請選擇</option>
                  <option v-for="r in resultOpts" :key="r">{{ r }}</option>
                </select>
              </div>
              <div>
                <label class="label">業務單位覆測人員</label>
                <select v-model="form.reviewer" class="input">
                  <option value="">請選擇</option>
                  <option v-for="u in userOpts" :key="u">{{ u }}</option>
                </select>
              </div>
              <div>
                <label class="label">覆測日期</label>
                <input v-model="form.reviewDate" type="date" class="input" />
              </div>
              <div>
                <label class="label">覆測結果</label>
                <select v-model="form.reviewResult" class="input">
                  <option value="">請選擇</option>
                  <option v-for="r in resultOpts" :key="r">{{ r }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 送出 -->
          <div class="flex gap-3 justify-end">
            <button type="button" @click="navigate('/list')" class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">取消</button>
            <button type="submit" :disabled="submitting" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {{ submitting ? '儲存中...' : (isEdit ? '儲存變更' : '新增問題單') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  components: { AppHeader },
  setup() {
    const isEdit    = computed(() => !!router.params.id);
    const submitting = ref(false);
    const uploadingFile = ref(false);
    const attachments = ref([]);   // [{ name, url, viewUrl }]

    const form = reactive({
      number: '', date: '', testCase: '', feature: '', desc: '',
      severity: '', remark: '', handler: '', type: '', solution: '',
      resolveDate: '', tester: '', testDate: '', testResult: '',
      reviewer: '', reviewDate: '', reviewResult: ''
    });

    const canEditReporter = computed(() => {
      if (!isEdit.value) return true;
      return store.user?.role === 'admin' || store.user?.name === form.reporter;
    });

    const severityOpts  = computed(() => store.options?.severity  || []);
    const typeOpts      = computed(() => store.options?.type      || []);
    const resultOpts    = computed(() => store.options?.result    || []);
    const userOpts      = computed(() => store.options?.users     || []);
    const testCaseOpts  = computed(() => store.options?.testCases || []);

    function onTestCaseChange() {
      const tc = testCaseOpts.value.find(t => t.id === form.testCase);
      if (tc) form.feature = tc.name;
    }

    async function loadIssue() {
      if (!isEdit.value) {
        form.date = new Date().toISOString().slice(0, 10);
        return;
      }
      try {
        const res = await api.listIssues({ keyword: router.params.id });
        const issue = res.data.find(i => i.number === router.params.id);
        if (issue) {
          Object.assign(form, {
            ...issue,
            date:        issue.date?.replace(/\//g, '-'),
            resolveDate: issue.resolveDate?.replace(/\//g, '-'),
            testDate:    issue.testDate?.replace(/\//g, '-'),
            reviewDate:  issue.reviewDate?.replace(/\//g, '-')
          });
          if (issue.attachment) {
            try { attachments.value = JSON.parse(issue.attachment); } catch (_) { attachments.value = []; }
          }
        }
      } catch (e) { showToast(e.message, 'error'); }
    }

    async function handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        showToast('僅支援 JPG、PNG、GIF 格式', 'error'); return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast('檔案大小不得超過 5MB', 'error'); return;
      }
      if (attachments.value.length >= 5) {
        showToast('每張問題單最多 5 個附件', 'error'); return;
      }
      uploadingFile.value = true;
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const res = await api.uploadFile({
            fileData:    e.target.result,
            fileName:    file.name,
            mimeType:    file.type,
            issueNumber: form.number || 'new'
          });
          attachments.value.push(res.data);
        } catch (err) {
          showToast('上傳失敗: ' + err.message, 'error');
        } finally {
          uploadingFile.value = false;
        }
      };
      reader.readAsDataURL(file);
      event.target.value = '';
    }

    function removeAttachment(idx) {
      attachments.value.splice(idx, 1);
    }

    async function submit() {
      submitting.value = true;
      try {
        const payload = {
          ...form,
          attachment: JSON.stringify(attachments.value)
        };
        if (isEdit.value) {
          await api.updateIssue(payload);
          showToast('問題單已更新');
        } else {
          await api.createIssue(payload);
          showToast('問題單已新增');
        }
        navigate('/list');
      } catch (e) {
        showToast(e.message, 'error');
      } finally {
        submitting.value = false;
      }
    }

    onMounted(loadIssue);
    return { isEdit, form, submitting, uploadingFile, attachments, canEditReporter, severityOpts, typeOpts, resultOpts, userOpts, testCaseOpts, onTestCaseChange, handleFileUpload, removeAttachment, submit, store, navigate };
  }
};

// ──── 7.5 IssueDetailView ────
const IssueDetailView = {
  template: `
    <div>
      <app-header />
      <div class="max-w-4xl mx-auto px-4 py-6">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <button @click="navigate('/list')" class="text-gray-400 hover:text-gray-600">← 返回列表</button>
            <h1 class="text-xl font-bold text-gray-800">問題單 {{ issue?.number }}</h1>
            <span v-if="issue" :class="['px-2 py-0.5 rounded-full text-xs font-medium', statusColor(issue.status)]">{{ issue.status }}</span>
          </div>
          <div class="flex gap-2">
            <button v-if="canEdit" @click="navigate('/edit/' + issue.number)" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">✏️ 編輯</button>
            <button v-if="canDelete && issue?.status !== '已刪除'" @click="confirmDelete" class="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">🗑 刪除</button>
            <button v-if="isAdmin && issue?.status === '已刪除'" @click="doRestore" class="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700">↩ 還原</button>
            <button @click="exportDetailPdf" class="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700">📄 匯出 PDF</button>
          </div>
        </div>

        <div v-if="loading" class="p-10 text-center text-gray-400">載入中...</div>
        <div v-else-if="!issue" class="p-10 text-center text-gray-400">找不到問題單</div>
        <template v-else>
          <!-- 提出階段 -->
          <div class="bg-white rounded-xl shadow-sm p-6 mb-4">
            <h2 class="text-base font-semibold text-blue-700 mb-4 border-b pb-2">📝 提出階段</h2>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div><div class="label">提出日期</div><div>{{ issue.date }}</div></div>
              <div><div class="label">提出人員</div><div>{{ issue.reporter }}</div></div>
              <div><div class="label">測試案例編號</div><div>{{ issue.testCase || '—' }}</div></div>
              <div class="col-span-2"><div class="label">測試功能項目</div><div>{{ issue.feature || '—' }}</div></div>
              <div><div class="label">問題嚴重度</div><span :class="['px-2 py-0.5 rounded-full text-xs font-medium', severityColor(issue.severity)]">{{ issue.severity }}</span></div>
              <div class="col-span-2 md:col-span-3"><div class="label">問題描述</div><div class="whitespace-pre-wrap bg-gray-50 p-3 rounded">{{ issue.desc }}</div></div>
              <div><div class="label">備註</div><div>{{ issue.remark || '—' }}</div></div>
            </div>
            <!-- 附件 -->
            <div v-if="parsedAttachments.length" class="mt-4">
              <div class="label mb-2">附件</div>
              <div class="flex flex-wrap gap-3">
                <a v-for="(att, i) in parsedAttachments" :key="i" :href="att.viewUrl" target="_blank" class="group relative">
                  <img :src="att.url" class="w-24 h-24 object-cover rounded border group-hover:opacity-80 transition" />
                  <div class="text-xs text-center text-gray-400 mt-1 w-24 truncate">{{ att.name }}</div>
                </a>
              </div>
            </div>
          </div>

          <!-- 處理階段 -->
          <div class="bg-white rounded-xl shadow-sm p-6 mb-4">
            <h2 class="text-base font-semibold text-orange-600 mb-4 border-b pb-2">🔧 處理階段</h2>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div><div class="label">處理人員</div><div>{{ issue.handler || '—' }}</div></div>
              <div><div class="label">問題類型</div><div>{{ issue.type || '—' }}</div></div>
              <div><div class="label">處理完成日期</div><div>{{ issue.resolveDate || '—' }}</div></div>
              <div class="col-span-2 md:col-span-3"><div class="label">問題原因及處理方式</div><div class="whitespace-pre-wrap bg-gray-50 p-3 rounded">{{ issue.solution || '（尚未填寫）' }}</div></div>
            </div>
          </div>

          <!-- 覆測階段 -->
          <div class="bg-white rounded-xl shadow-sm p-6">
            <h2 class="text-base font-semibold text-green-600 mb-4 border-b pb-2">✅ 覆測階段</h2>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div><div class="label">測試人員</div><div>{{ issue.tester || '—' }}</div></div>
              <div><div class="label">測試日期</div><div>{{ issue.testDate || '—' }}</div></div>
              <div><div class="label">測試結果</div>
                <span v-if="issue.testResult" :class="['px-2 py-0.5 rounded text-xs font-medium', issue.testResult === 'OK' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">{{ issue.testResult }}</span>
                <span v-else>—</span>
              </div>
              <div><div class="label">業務單位覆測人員</div><div>{{ issue.reviewer || '—' }}</div></div>
              <div><div class="label">覆測日期</div><div>{{ issue.reviewDate || '—' }}</div></div>
              <div><div class="label">覆測結果</div>
                <span v-if="issue.reviewResult" :class="['px-2 py-0.5 rounded text-xs font-medium', issue.reviewResult === 'OK' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">{{ issue.reviewResult }}</span>
                <span v-else>—</span>
              </div>
            </div>
          </div>
        </template>

        <!-- 刪除確認 Modal -->
        <div v-if="showDeleteModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div class="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 class="font-bold text-gray-800 mb-2">確認刪除</h3>
            <p class="text-sm text-gray-600 mb-4">確定要刪除問題單 <strong>{{ issue?.number }}</strong>？<br/>（管理員可還原）</p>
            <div class="flex gap-3 justify-end">
              <button @click="showDeleteModal = false" class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm">取消</button>
              <button @click="doDelete" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">確認刪除</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  components: { AppHeader },
  setup() {
    const issue = ref(null);
    const loading = ref(false);
    const showDeleteModal = ref(false);

    const isAdmin  = computed(() => store.user?.role === 'admin');
    const canEdit  = computed(() => issue.value && (isAdmin.value || issue.value.reporter === store.user?.name));
    const canDelete = computed(() => issue.value && (isAdmin.value || issue.value.reporter === store.user?.name));
    const parsedAttachments = computed(() => {
      if (!issue.value?.attachment) return [];
      try { return JSON.parse(issue.value.attachment); } catch (_) { return []; }
    });

    async function loadIssue() {
      loading.value = true;
      try {
        const res = await api.listIssues({ showDeleted: isAdmin.value ? 'true' : 'false' });
        issue.value = res.data.find(i => i.number === router.params.id) || null;
      } catch (e) { showToast(e.message, 'error'); }
      finally { loading.value = false; }
    }

    function confirmDelete() { showDeleteModal.value = true; }

    async function doDelete() {
      try {
        await api.deleteIssue(issue.value.number);
        showToast('問題單已刪除');
        navigate('/list');
      } catch (e) { showToast(e.message, 'error'); }
      showDeleteModal.value = false;
    }

    async function doRestore() {
      try {
        await api.restoreIssue(issue.value.number);
        showToast('問題單已還原');
        await loadIssue();
      } catch (e) { showToast(e.message, 'error'); }
    }

    function exportDetailPdf() {
      if (!issue.value) return;
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const i = issue.value;
      let y = 15;
      doc.setFontSize(14);
      doc.text(`\u554f\u984c\u55ae ${i.number}`, 14, y); y += 10;
      doc.setFontSize(9);
      const rows = [
        ['\u63d0\u51fa\u65e5\u671f', i.date, '\u63d0\u51fa\u4eba\u54e1', i.reporter],
        ['\u6e2c\u8a66\u529f\u80fd\u9805\u76ee', i.feature, '\u554f\u984c\u56b4\u91cd\u5ea6', i.severity],
        ['\u554f\u984c\u63cf\u8ff0', i.desc, '', ''],
        ['\u8655\u7406\u4eba\u54e1', i.handler, '\u554f\u984c\u985e\u578b', i.type],
        ['\u8655\u7406\u65b9\u5f0f', i.solution, '\u8655\u7406\u5b8c\u6210\u65e5\u671f', i.resolveDate],
        ['\u6e2c\u8a66\u4eba\u54e1', i.tester, '\u6e2c\u8a66\u7d50\u679c', i.testResult],
        ['\u8986\u6e2c\u4eba\u54e1', i.reviewer, '\u8986\u6e2c\u7d50\u679c', i.reviewResult],
        ['\u554f\u984c\u72c0\u614b', i.status, '\u5099\u8a3b', i.remark]
      ];
      doc.autoTable({ startY: y, body: rows, styles: { fontSize: 8 }, columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 }, 2: { fontStyle: 'bold', cellWidth: 35 } } });
      doc.save(`CBC_\u554f\u984c\u55ae_${i.number}.pdf`);
    }

    onMounted(loadIssue);
    return { issue, loading, isAdmin, canEdit, canDelete, parsedAttachments, showDeleteModal, confirmDelete, doDelete, doRestore, exportDetailPdf, navigate, severityColor, statusColor };
  }
};

// ──── 7.6 DashboardView ────
const DashboardView = {
  template: `
    <div>
      <app-header />
      <div class="max-w-7xl mx-auto px-4 py-6">
        <h1 class="text-xl font-bold text-gray-800 mb-6">📊 問題統計儀表板</h1>

        <!-- 摘要卡片 -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-white rounded-xl shadow-sm p-5 text-center">
            <div class="text-3xl font-bold text-gray-800">{{ stats?.totals?.total || 0 }}</div>
            <div class="text-sm text-gray-500 mt-1">問題單總數</div>
          </div>
          <div class="bg-blue-50 rounded-xl shadow-sm p-5 text-center">
            <div class="text-3xl font-bold text-blue-700">{{ stats?.totals?.open || 0 }}</div>
            <div class="text-sm text-blue-500 mt-1">Open 中</div>
          </div>
          <div class="bg-green-50 rounded-xl shadow-sm p-5 text-center">
            <div class="text-3xl font-bold text-green-700">{{ stats?.totals?.weekNew || 0 }}</div>
            <div class="text-sm text-green-500 mt-1">本週新增</div>
          </div>
          <div class="bg-purple-50 rounded-xl shadow-sm p-5 text-center">
            <div class="text-3xl font-bold text-purple-700">{{ stats?.totals?.weekClosed || 0 }}</div>
            <div class="text-sm text-purple-500 mt-1">本週關閉</div>
          </div>
        </div>

        <div v-if="loading" class="p-10 text-center text-gray-400">載入中...</div>
        <template v-else>
          <!-- 圖表第一列 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div class="bg-white rounded-xl shadow-sm p-5">
              <h3 class="text-sm font-semibold text-gray-600 mb-4">問題狀態分布</h3>
              <div class="h-52"><canvas id="statusChart"></canvas></div>
            </div>
            <div class="bg-white rounded-xl shadow-sm p-5">
              <h3 class="text-sm font-semibold text-gray-600 mb-4">問題嚴重度分布</h3>
              <div class="h-52"><canvas id="severityChart"></canvas></div>
            </div>
          </div>
          <!-- 圖表第二列 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-white rounded-xl shadow-sm p-5">
              <h3 class="text-sm font-semibold text-gray-600 mb-4">問題類型分布</h3>
              <div class="h-52"><canvas id="typeChart"></canvas></div>
            </div>
            <div class="bg-white rounded-xl shadow-sm p-5">
              <h3 class="text-sm font-semibold text-gray-600 mb-4">近 30 天每日新增趨勢</h3>
              <div class="h-52"><canvas id="dailyChart"></canvas></div>
            </div>
          </div>
        </template>
      </div>
    </div>
  `,
  components: { AppHeader },
  setup() {
    const stats   = ref(null);
    const loading = ref(false);
    const charts  = {};

    function destroyCharts() {
      Object.values(charts).forEach(c => c && c.destroy());
    }

    function buildCharts(data) {
      nextTick(() => {
        destroyCharts();

        // 狀態圓餅圖
        const statusCtx = document.getElementById('statusChart');
        if (statusCtx) {
          const labels = Object.keys(data.statusDist);
          charts.status = new Chart(statusCtx, {
            type: 'pie',
            data: { labels, datasets: [{ data: labels.map(l => data.statusDist[l]), backgroundColor: ['#3b82f6','#22c55e','#f97316','#9ca3af'] }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
          });
        }

        // 嚴重度長條圖
        const sevCtx = document.getElementById('severityChart');
        if (sevCtx) {
          const labels = ['系統崩潰(嚴重)','功能無法運作(高)','一般錯誤(中)','建議修正(低)'];
          charts.severity = new Chart(sevCtx, {
            type: 'bar',
            data: { labels, datasets: [{ label: '問題數', data: labels.map(l => data.severityDist[l] || 0), backgroundColor: ['#ef4444','#f97316','#eab308','#22c55e'] }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
          });
        }

        // 類型長條圖
        const typeCtx = document.getElementById('typeChart');
        if (typeCtx) {
          const labels = Object.keys(data.typeDist);
          charts.type = new Chart(typeCtx, {
            type: 'bar',
            data: { labels, datasets: [{ label: '問題數', data: labels.map(l => data.typeDist[l]), backgroundColor: '#6366f1' }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
          });
        }

        // 每日折線圖（近30天）
        const dailyCtx = document.getElementById('dailyChart');
        if (dailyCtx) {
          const sortedDates = Object.keys(data.daily).sort();
          charts.daily = new Chart(dailyCtx, {
            type: 'line',
            data: { labels: sortedDates, datasets: [{ label: '新增數', data: sortedDates.map(d => data.daily[d]), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', tension: 0.4, fill: true }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
          });
        }
      });
    }

    async function loadStats() {
      loading.value = true;
      try {
        const res = await api.getStats();
        stats.value = res.data;
        buildCharts(res.data);
      } catch (e) {
        showToast(e.message, 'error');
      } finally {
        loading.value = false;
      }
    }

    onMounted(loadStats);
    return { stats, loading };
  }
};

// ── 8. 主應用 ─────────────────────────────────────────────────
const App = {
  template: `
    <div>
      <!-- Toast 通知 -->
      <transition name="toast">
        <div v-if="store.toast"
             :class="['fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all', store.toast.type === 'error' ? 'bg-red-500' : 'bg-green-500']">
          {{ store.toast.msg }}
        </div>
      </transition>

      <!-- 全域 Loading -->
      <div v-if="store.loading" class="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
        <div class="bg-white rounded-xl p-6 shadow-xl text-gray-600">驗證中...</div>
      </div>

      <!-- 路由視圖 -->
      <component :is="currentView" />
    </div>
  `,
  setup() {
    const currentView = computed(() => {
      if (!store.user) return LoginView;
      const path = router.current;
      if (path === '/list')              return IssueListView;
      if (path === '/new')               return IssueFormView;
      if (path === '/edit')              return IssueFormView;
      if (path === '/detail')            return IssueDetailView;
      if (path === '/dashboard')         return DashboardView;
      return IssueListView;
    });
    return { store, currentView };
  }
};

// ── 9. 啟動 ───────────────────────────────────────────────────
const app = createApp(App);

// 全域 CSS class（Tailwind 不支援動態 class 字串，需注入）
const style = document.createElement('style');
style.textContent = `
  .label { @apply block text-xs font-medium text-gray-500 mb-1; }
  .input  { @apply w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent; }
  .toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
  .toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(100%); }
`;
document.head.appendChild(style);

app.mount('#app');

// 嘗試恢復 session 並載入選單
(async () => {
  if (restoreSession()) {
    try {
      const res = await api.getOptions();
      store.options = res.data;
    } catch (_) {
      store.token = null;
      store.user = null;
    }
  }
})();
