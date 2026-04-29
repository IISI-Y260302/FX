// ============================================================
// CBC 系統測試問題管理系統 - Google Apps Script API
// ============================================================
// 部署前請至「專案設定 > 指令碼屬性」新增:
//   DRIVE_FOLDER_ID: Google Drive 附件根資料夾 ID
// ============================================================

const MAIN_SHEET_NAME    = '系統測試問題紀錄表';
const TESTCASE_SHEET_NAME = '測試案例編號及功能項目';
const USERS_SHEET_NAME   = '使用者白名單';
const DATA_START_ROW     = 6; // 前 5 列為標題/說明，資料從第 6 列開始

// 欄位索引 (1-based)
const COL = {
  NUMBER:        1,   // 問題單編號
  DATE:          2,   // 提出日期
  REPORTER:      3,   // 提出人員
  TESTCASE:      4,   // 測試案例編號
  FEATURE:       5,   // 測試功能項目
  DESC:          6,   // 問題描述
  SEVERITY:      7,   // 問題嚴重度
  ATTACHMENT:    8,   // 附件連結 (JSON 陣列字串)
  HANDLER:       9,   // 處理人員
  SOLUTION:      10,  // 問題原因及處理方式
  TYPE:          11,  // 問題類型
  RESOLVE_DATE:  12,  // 處理完成日期
  TESTER:        13,  // 測試人員
  TEST_DATE:     14,  // 測試日期
  TEST_RESULT:   15,  // 測試結果
  REVIEWER:      16,  // 業務單位覆測人員
  REVIEW_DATE:   17,  // 覆測日期
  REVIEW_RESULT: 18,  // 覆測結果
  STATUS:        19,  // 問題狀態
  REMARK:        20   // 備註
};

// ─────────────────────────────────────────────────────────────
// HTTP 進入點
// ─────────────────────────────────────────────────────────────

function doGet(e) {
  try {
    const params = e.parameter;
    const auth = authenticate(params.token);
    if (!auth.ok) return buildResponse({ success: false, error: auth.error });

    switch (params.action) {
      case 'getOptions': return buildResponse(getOptions(auth));
      case 'list':       return buildResponse(listIssues(params, auth));
      case 'stats':      return buildResponse(getStats(auth));
      case 'export':     return buildResponse(exportIssues(params, auth));
      default:           return buildResponse({ success: false, error: 'Unknown action' });
    }
  } catch (err) {
    return buildResponse({ success: false, error: err.toString() });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const auth = authenticate(body.token);
    if (!auth.ok) return buildResponse({ success: false, error: auth.error });

    switch (body.action) {
      case 'create':     return buildResponse(createIssue(body, auth));
      case 'update':     return buildResponse(updateIssue(body, auth));
      case 'delete':     return buildResponse(deleteIssue(body, auth));
      case 'restore':    return buildResponse(restoreIssue(body, auth));
      case 'uploadFile': return buildResponse(uploadFile(body, auth));
      default:           return buildResponse({ success: false, error: 'Unknown action' });
    }
  } catch (err) {
    return buildResponse({ success: false, error: err.toString() });
  }
}

function buildResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ─────────────────────────────────────────────────────────────
// 身分驗證
// ─────────────────────────────────────────────────────────────

function authenticate(token) {
  if (!token) return { ok: false, error: 'Missing token' };

  try {
    const url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(token);
    const resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const info = JSON.parse(resp.getContentText());

    if (info.error || !info.email) {
      return { ok: false, error: 'Invalid or expired token' };
    }

    const email = info.email;
    const userInfo = getUserFromWhitelist(email);

    if (!userInfo) {
      return { ok: false, error: 'Access denied: ' + email + ' is not in whitelist' };
    }

    return { ok: true, email, name: userInfo.name, role: userInfo.role };
  } catch (err) {
    return { ok: false, error: 'Auth error: ' + err.toString() };
  }
}

function getUserFromWhitelist(email) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(USERS_SHEET_NAME);
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    if (data[i][0].toString().toLowerCase().trim() === email.toLowerCase().trim()) {
      return { name: data[i][1] ? data[i][1].toString() : email, role: data[i][2] ? data[i][2].toString() : 'user' };
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// 取得下拉選單選項 (action=getOptions)
// ─────────────────────────────────────────────────────────────

function getOptions(auth) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 使用者名單
  const usersSheet = ss.getSheetByName(USERS_SHEET_NAME);
  const usersData = usersSheet ? usersSheet.getDataRange().getValues() : [];
  const users = [];
  for (let i = 1; i < usersData.length; i++) {
    if (usersData[i][1]) users.push(usersData[i][1].toString());
  }

  // 測試案例編號及功能項目
  const tcSheet = ss.getSheetByName(TESTCASE_SHEET_NAME);
  const tcData = tcSheet ? tcSheet.getDataRange().getValues() : [];
  const testCases = [];
  for (let i = 1; i < tcData.length; i++) {
    if (tcData[i][0] && tcData[i][1]) {
      testCases.push({ id: tcData[i][0].toString(), name: tcData[i][1].toString() });
    }
  }

  return {
    success: true,
    data: {
      severity:  ['系統崩潰(嚴重)', '功能無法運作(高)', '一般錯誤(中)', '建議修正(低)'],
      type:      ['Bug', '操作錯誤', '需求', '資料問題'],
      result:    ['OK', 'NG'],
      status:    ['Open', 'Closed', 'Reopen'],
      users,
      testCases
    }
  };
}

// ─────────────────────────────────────────────────────────────
// 問題單列表 (action=list)
// ─────────────────────────────────────────────────────────────

function listIssues(params, auth) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MAIN_SHEET_NAME);
  if (!sheet) return { success: false, error: '找不到工作表：' + MAIN_SHEET_NAME + '，請確認 Google Sheets 中有此分頁名稱' };
  const lastRow = sheet.getLastRow();
  if (lastRow < DATA_START_ROW) return { success: true, data: [] };

  const rows = sheet.getRange(DATA_START_ROW, 1, lastRow - DATA_START_ROW + 1, 20).getValues();

  const filterStatus   = params.status   || '';
  const filterSeverity = params.severity || '';
  const filterReporter = params.reporter || '';
  const filterKeyword  = (params.keyword || '').toLowerCase();
  const showDeleted    = params.showDeleted === 'true' && auth.role === 'admin';

  const issues = [];
  for (const row of rows) {
    if (!row[COL.NUMBER - 1]) continue;

    const status = row[COL.STATUS - 1] ? row[COL.STATUS - 1].toString() : 'Open';
    if (status === '已刪除' && !showDeleted) continue;
    if (filterStatus   && status !== filterStatus) continue;
    if (filterSeverity && row[COL.SEVERITY  - 1].toString() !== filterSeverity) continue;
    if (filterReporter && row[COL.REPORTER  - 1].toString() !== filterReporter) continue;
    if (filterKeyword) {
      const hay = [row[COL.DESC-1], row[COL.FEATURE-1], row[COL.SOLUTION-1]].join(' ').toLowerCase();
      if (!hay.includes(filterKeyword)) continue;
    }

    issues.push(rowToIssue(row));
  }

  return { success: true, data: issues };
}

// 匯出用（回傳完整欄位，不過濾）
function exportIssues(params, auth) {
  const result = listIssues(params, auth);
  return result;
}

function rowToIssue(row) {
  return {
    number:       fmtVal(row[COL.NUMBER       - 1]),
    date:         fmtDate(row[COL.DATE        - 1]),
    reporter:     fmtVal(row[COL.REPORTER     - 1]),
    testCase:     fmtVal(row[COL.TESTCASE     - 1]),
    feature:      fmtVal(row[COL.FEATURE      - 1]),
    desc:         fmtVal(row[COL.DESC         - 1]),
    severity:     fmtVal(row[COL.SEVERITY     - 1]),
    attachment:   fmtVal(row[COL.ATTACHMENT   - 1]),
    handler:      fmtVal(row[COL.HANDLER      - 1]),
    solution:     fmtVal(row[COL.SOLUTION     - 1]),
    type:         fmtVal(row[COL.TYPE         - 1]),
    resolveDate:  fmtDate(row[COL.RESOLVE_DATE - 1]),
    tester:       fmtVal(row[COL.TESTER       - 1]),
    testDate:     fmtDate(row[COL.TEST_DATE   - 1]),
    testResult:   fmtVal(row[COL.TEST_RESULT  - 1]),
    reviewer:     fmtVal(row[COL.REVIEWER     - 1]),
    reviewDate:   fmtDate(row[COL.REVIEW_DATE - 1]),
    reviewResult: fmtVal(row[COL.REVIEW_RESULT - 1]),
    status:       fmtVal(row[COL.STATUS       - 1]) || 'Open',
    remark:       fmtVal(row[COL.REMARK       - 1])
  };
}

function fmtVal(v) { return v != null ? v.toString() : ''; }

function fmtDate(v) {
  if (!v) return '';
  if (v instanceof Date) return Utilities.formatDate(v, 'Asia/Taipei', 'yyyy/MM/dd');
  return v.toString();
}

// ─────────────────────────────────────────────────────────────
// 新增問題單 (action=create)
// ─────────────────────────────────────────────────────────────

function createIssue(body, auth) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MAIN_SHEET_NAME);
  const newNumber = generateNumber(sheet);
  const today = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy/MM/dd');

  const row = new Array(20).fill('');
  row[COL.NUMBER   - 1] = newNumber;
  row[COL.DATE     - 1] = body.date || today;
  row[COL.REPORTER - 1] = auth.name;          // 自動帶入登入者姓名
  row[COL.TESTCASE - 1] = body.testCase  || '';
  row[COL.FEATURE  - 1] = body.feature   || '';
  row[COL.DESC     - 1] = body.desc      || '';
  row[COL.SEVERITY - 1] = body.severity  || '';
  row[COL.ATTACHMENT-1] = body.attachment || '';
  row[COL.STATUS   - 1] = 'Open';
  row[COL.REMARK   - 1] = body.remark    || '';

  sheet.appendRow(row);
  return { success: true, data: { number: newNumber } };
}

function generateNumber(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < DATA_START_ROW) return '0001';

  const nums = sheet.getRange(DATA_START_ROW, COL.NUMBER, lastRow - DATA_START_ROW + 1, 1).getValues();
  let max = 0;
  for (const r of nums) {
    const n = parseInt(r[0]);
    if (!isNaN(n) && n > max) max = n;
  }
  return String(max + 1).padStart(4, '0');
}

// ─────────────────────────────────────────────────────────────
// 更新問題單 (action=update)
// ─────────────────────────────────────────────────────────────

function updateIssue(body, auth) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MAIN_SHEET_NAME);
  const rowIdx = findRowByNumber(sheet, body.number);
  if (!rowIdx) return { success: false, error: '問題單不存在: ' + body.number };

  const existing = sheet.getRange(rowIdx, 1, 1, 20).getValues()[0];
  const reporter = existing[COL.REPORTER - 1].toString();
  const isReporter = reporter === auth.name;
  const isAdmin    = auth.role === 'admin';

  // 提出階段欄位（只有提出人員或管理員可修改）
  if (isReporter || isAdmin) {
    setCell(sheet, rowIdx, COL.DATE,       body.date);
    setCell(sheet, rowIdx, COL.TESTCASE,   body.testCase);
    setCell(sheet, rowIdx, COL.FEATURE,    body.feature);
    setCell(sheet, rowIdx, COL.DESC,       body.desc);
    setCell(sheet, rowIdx, COL.SEVERITY,   body.severity);
    setCell(sheet, rowIdx, COL.ATTACHMENT, body.attachment);
  }

  // 處理/覆測階段欄位（所有人皆可填寫）
  setCell(sheet, rowIdx, COL.HANDLER,       body.handler);
  setCell(sheet, rowIdx, COL.SOLUTION,      body.solution);
  setCell(sheet, rowIdx, COL.TYPE,          body.type);
  setCell(sheet, rowIdx, COL.RESOLVE_DATE,  body.resolveDate);
  setCell(sheet, rowIdx, COL.TESTER,        body.tester);
  setCell(sheet, rowIdx, COL.TEST_DATE,     body.testDate);
  setCell(sheet, rowIdx, COL.TEST_RESULT,   body.testResult);
  setCell(sheet, rowIdx, COL.REVIEWER,      body.reviewer);
  setCell(sheet, rowIdx, COL.REVIEW_DATE,   body.reviewDate);
  setCell(sheet, rowIdx, COL.REVIEW_RESULT, body.reviewResult);
  setCell(sheet, rowIdx, COL.REMARK,        body.remark);

  autoUpdateStatus(sheet, rowIdx);
  return { success: true };
}

function setCell(sheet, rowIdx, colIdx, value) {
  if (value === undefined) return;
  sheet.getRange(rowIdx, colIdx).setValue(value === null ? '' : value);
}

function autoUpdateStatus(sheet, rowIdx) {
  const row = sheet.getRange(rowIdx, 1, 1, 20).getValues()[0];
  const current      = row[COL.STATUS       - 1].toString();
  const solution     = row[COL.SOLUTION     - 1].toString();
  const resolveDate  = row[COL.RESOLVE_DATE - 1].toString();
  const testResult   = row[COL.TEST_RESULT  - 1].toString();
  const reviewResult = row[COL.REVIEW_RESULT - 1].toString();

  if (current === '已刪除') return;

  let newStatus = current;
  if (testResult === 'NG' || reviewResult === 'NG') {
    newStatus = 'Reopen';
  } else if (solution && resolveDate) {
    newStatus = 'Closed';
  }

  if (newStatus !== current) {
    sheet.getRange(rowIdx, COL.STATUS).setValue(newStatus);
  }
}

// ─────────────────────────────────────────────────────────────
// 軟刪除 (action=delete)
// ─────────────────────────────────────────────────────────────

function deleteIssue(body, auth) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MAIN_SHEET_NAME);
  const rowIdx = findRowByNumber(sheet, body.number);
  if (!rowIdx) return { success: false, error: '問題單不存在' };

  const row = sheet.getRange(rowIdx, 1, 1, 20).getValues()[0];
  const reporter = row[COL.REPORTER - 1].toString();

  if (auth.role !== 'admin' && reporter !== auth.name) {
    return { success: false, error: '無刪除權限：只有提出人員或管理員可刪除' };
  }

  sheet.getRange(rowIdx, COL.STATUS).setValue('已刪除');
  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// 還原問題單 (action=restore) - 管理員限定
// ─────────────────────────────────────────────────────────────

function restoreIssue(body, auth) {
  if (auth.role !== 'admin') return { success: false, error: '僅管理員可還原問題單' };

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MAIN_SHEET_NAME);
  const rowIdx = findRowByNumber(sheet, body.number);
  if (!rowIdx) return { success: false, error: '問題單不存在' };

  sheet.getRange(rowIdx, COL.STATUS).setValue('Open');
  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// 上傳附件至 Google Drive (action=uploadFile)
// ─────────────────────────────────────────────────────────────

function uploadFile(body, auth) {
  try {
    const folderId = PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID');
    if (!folderId) return { success: false, error: 'DRIVE_FOLDER_ID 未設定於指令碼屬性' };

    const parent = DriveApp.getFolderById(folderId);

    // 取得或建立問題單子資料夾
    const subName = body.issueNumber ? ('問題單_' + body.issueNumber) : 'temp';
    let subFolder;
    const existing = parent.getFoldersByName(subName);
    subFolder = existing.hasNext() ? existing.next() : parent.createFolder(subName);

    // 解碼 base64 並建立檔案
    const base64 = body.fileData.replace(/^data:[^;]+;base64,/, '');
    const blob   = Utilities.newBlob(Utilities.base64Decode(base64), body.mimeType, body.fileName);
    const file   = subFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return {
      success: true,
      data: {
        fileId:  file.getId(),
        name:    body.fileName,
        url:     'https://drive.google.com/uc?id=' + file.getId(),
        viewUrl: 'https://drive.google.com/file/d/' + file.getId() + '/view'
      }
    };
  } catch (err) {
    return { success: false, error: '上傳失敗: ' + err.toString() };
  }
}

// ─────────────────────────────────────────────────────────────
// 統計數據 (action=stats)
// ─────────────────────────────────────────────────────────────

function getStats(auth) {
  const sheet  = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MAIN_SHEET_NAME);
  const lastRow = sheet.getLastRow();

  if (lastRow < DATA_START_ROW) {
    return { success: true, data: { statusDist: {}, severityDist: {}, typeDist: {}, daily: {}, totals: { total: 0, open: 0, weekNew: 0, weekClosed: 0 } } };
  }

  const rows = sheet.getRange(DATA_START_ROW, 1, lastRow - DATA_START_ROW + 1, 20).getValues();

  const statusDist = {}, severityDist = {}, typeDist = {}, daily = {};
  let total = 0, open = 0, weekNew = 0, weekClosed = 0;

  const now      = new Date();
  const weekAgo  = new Date(now.getTime() - 7  * 86400000);
  const monthAgo = new Date(now.getTime() - 30 * 86400000);

  for (const row of rows) {
    if (!row[COL.NUMBER - 1]) continue;
    const status = fmtVal(row[COL.STATUS - 1]) || 'Open';
    if (status === '已刪除') continue;

    total++;
    statusDist[status] = (statusDist[status] || 0) + 1;
    if (status === 'Open') open++;

    const severity = fmtVal(row[COL.SEVERITY - 1]) || '未設定';
    severityDist[severity] = (severityDist[severity] || 0) + 1;

    const type = fmtVal(row[COL.TYPE - 1]);
    if (type) typeDist[type] = (typeDist[type] || 0) + 1;

    const issueDate = row[COL.DATE - 1];
    if (issueDate instanceof Date) {
      if (issueDate >= monthAgo) {
        const key = Utilities.formatDate(issueDate, 'Asia/Taipei', 'yyyy/MM/dd');
        daily[key] = (daily[key] || 0) + 1;
      }
      if (issueDate >= weekAgo) weekNew++;
    }

    const resolveDate = row[COL.RESOLVE_DATE - 1];
    if (resolveDate instanceof Date && resolveDate >= weekAgo && status === 'Closed') {
      weekClosed++;
    }
  }

  return { success: true, data: { statusDist, severityDist, typeDist, daily, totals: { total, open, weekNew, weekClosed } } };
}

// ─────────────────────────────────────────────────────────────
// 工具函式
// ─────────────────────────────────────────────────────────────

function findRowByNumber(sheet, number) {
  const lastRow = sheet.getLastRow();
  if (lastRow < DATA_START_ROW) return null;

  const nums = sheet.getRange(DATA_START_ROW, COL.NUMBER, lastRow - DATA_START_ROW + 1, 1).getValues();
  for (let i = 0; i < nums.length; i++) {
    if (nums[i][0].toString() === number.toString()) return DATA_START_ROW + i;
  }
  return null;
}
