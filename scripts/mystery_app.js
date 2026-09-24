/**
 * The Lindenwood SQL Mystery: The Missing Golden Lion
 * Game Engine, Database Driver & Course Project Submission Manager
 */

let dbWorker = null;
let dbReady = false;
let workbenchEditor = null;
let currentResultsData = null;

// Student Course Project Session State
const DEFAULT_SESSION = {
  name: '',
  studentId: '',
  email: '',
  course: 'DSCI 35600 / Computer Science',
  loginTime: null,
  queriesRun: [],
  thiefSolved: false,
  thiefName: '',
  mastermindSolved: false,
  mastermindName: '',
  notes: ''
};

let studentSession = { ...DEFAULT_SESSION };

// Load student session from localStorage
function loadStudentSession() {
  try {
    const raw = localStorage.getItem('lu_golden_lion_session');
    if (raw) {
      studentSession = { ...DEFAULT_SESSION, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Could not read session from localStorage', e);
  }
  updateStudentUI();
}

function saveStudentSession() {
  try {
    localStorage.setItem('lu_golden_lion_session', JSON.stringify(studentSession));
  } catch (e) {
    console.warn('Could not save session to localStorage', e);
  }
  updateStudentUI();
}

function updateStudentUI() {
  const badge = document.getElementById('lu-student-info');
  if (badge) {
    if (studentSession.name) {
      badge.innerHTML = `
        <span>&#128100; Detective: <strong>${escapeHtml(studentSession.name)}</strong> (${escapeHtml(studentSession.studentId || 'ID: --')})</span>
        <button onclick="promptStudentLogin()">Edit Info</button>
      `;
    } else {
      badge.innerHTML = `
        <button onclick="promptStudentLogin()" class="lu-btn lu-btn-gold lu-btn-sm" style="font-size:0.75rem;">
          &#128100; Student Login
        </button>
      `;
    }
  }

  // Update submission report if view is open
  if (studentSession.thiefSolved || studentSession.mastermindSolved) {
    renderSubmissionReport();
  }
}

function promptStudentLogin() {
  const modal = document.getElementById('student-login-modal');
  if (modal) {
    document.getElementById('input-student-name').value = studentSession.name || '';
    document.getElementById('input-student-id').value = studentSession.studentId || '';
    document.getElementById('input-student-email').value = studentSession.email || '';
    document.getElementById('input-student-course').value = studentSession.course || 'DSCI 35600';
    modal.style.display = 'flex';
  }
}

function closeStudentModal() {
  const modal = document.getElementById('student-login-modal');
  if (modal) modal.style.display = 'none';
}

function submitStudentLogin(e) {
  if (e) e.preventDefault();
  const name = document.getElementById('input-student-name').value.trim();
  const sid = document.getElementById('input-student-id').value.trim();
  const email = document.getElementById('input-student-email').value.trim();
  const course = document.getElementById('input-student-course').value.trim();

  if (!name) {
    alert('Please enter your full name.');
    return;
  }

  studentSession.name = name;
  studentSession.studentId = sid;
  studentSession.email = email;
  studentSession.course = course || 'Lindenwood Course Project';
  if (!studentSession.loginTime) {
    studentSession.loginTime = new Date().toISOString();
  }

  saveStudentSession();
  closeStudentModal();
}

function logQuery(sql) {
  if (!sql) return;
  studentSession.queriesRun.push({
    timestamp: new Date().toLocaleTimeString(),
    query: sql.trim()
  });
  saveStudentSession();
}

// Database tables schema metadata
const SCHEMA_METADATA = {
  security_report: [
    { name: 'id', type: 'integer', pk: true },
    { name: 'date', type: 'integer' },
    { name: 'time', type: 'integer' },
    { name: 'incident_type', type: 'text' },
    { name: 'building_id', type: 'text', fk: 'building(id)' },
    { name: 'description', type: 'text' }
  ],
  person: [
    { name: 'id', type: 'integer', pk: true },
    { name: 'name', type: 'text' },
    { name: 'email', type: 'text' },
    { name: 'role', type: 'text' },
    { name: 'phone', type: 'text' },
    { name: 'ssn', type: 'text' }
  ],
  student: [
    { name: 'person_id', type: 'integer', pk: true, fk: 'person(id)' },
    { name: 'student_id_code', type: 'text' },
    { name: 'major', type: 'text' },
    { name: 'class_year', type: 'text' },
    { name: 'gpa', type: 'real' },
    { name: 'dorm_building', type: 'text' },
    { name: 'dorm_room', type: 'text' }
  ],
  faculty_staff: [
    { name: 'person_id', type: 'integer', pk: true, fk: 'person(id)' },
    { name: 'department', type: 'text' },
    { name: 'title', type: 'text' },
    { name: 'office_building', type: 'text' },
    { name: 'office_room', type: 'text' }
  ],
  alumni_donor: [
    { name: 'person_id', type: 'integer', pk: true, fk: 'person(id)' },
    { name: 'graduation_year', type: 'integer' },
    { name: 'profession', type: 'text' },
    { name: 'annual_income', type: 'integer' },
    { name: 'total_donations', type: 'integer' }
  ],
  organization: [
    { name: 'id', type: 'text', pk: true },
    { name: 'name', type: 'text' },
    { name: 'category', type: 'text' },
    { name: 'meeting_building', type: 'text', fk: 'building(id)' }
  ],
  organization_member: [
    { name: 'org_id', type: 'text', pk: true, fk: 'organization(id)' },
    { name: 'person_id', type: 'integer', pk: true, fk: 'person(id)' },
    { name: 'role', type: 'text' },
    { name: 'joined_date', type: 'integer' }
  ],
  building: [
    { name: 'id', type: 'text', pk: true },
    { name: 'name', type: 'text' },
    { name: 'campus_zone', type: 'text' },
    { name: 'floors', type: 'integer' }
  ],
  room: [
    { name: 'id', type: 'text', pk: true },
    { name: 'building_id', type: 'text', fk: 'building(id)' },
    { name: 'room_number', type: 'text' },
    { name: 'room_type', type: 'text' }
  ],
  card_swipe_access: [
    { name: 'id', type: 'integer', pk: true },
    { name: 'person_id', type: 'integer', fk: 'person(id)' },
    { name: 'building_id', type: 'text', fk: 'building(id)' },
    { name: 'room_id', type: 'text', fk: 'room(id)' },
    { name: 'swipe_date', type: 'integer' },
    { name: 'swipe_time', type: 'integer' },
    { name: 'access_result', type: 'text' }
  ],
  vehicle: [
    { name: 'id', type: 'integer', pk: true },
    { name: 'person_id', type: 'integer', fk: 'person(id)' },
    { name: 'license_plate', type: 'text' },
    { name: 'car_make', type: 'text' },
    { name: 'car_model', type: 'text' },
    { name: 'car_color', type: 'text' },
    { name: 'permit_type', type: 'text' }
  ],
  parking_record: [
    { name: 'id', type: 'integer', pk: true },
    { name: 'vehicle_id', type: 'integer', fk: 'vehicle(id)' },
    { name: 'lot_name', type: 'text' },
    { name: 'entry_date', type: 'integer' },
    { name: 'entry_time', type: 'integer' },
    { name: 'exit_time', type: 'integer' }
  ],
  campus_event: [
    { name: 'id', type: 'integer', pk: true },
    { name: 'event_name', type: 'text' },
    { name: 'event_date', type: 'integer' },
    { name: 'start_time', type: 'integer' },
    { name: 'end_time', type: 'integer' },
    { name: 'building_id', type: 'text', fk: 'building(id)' },
    { name: 'description', type: 'text' }
  ],
  event_attendance: [
    { name: 'event_id', type: 'integer', pk: true, fk: 'campus_event(id)' },
    { name: 'person_id', type: 'integer', pk: true, fk: 'person(id)' },
    { name: 'check_in_time', type: 'integer' }
  ],
  interview: [
    { name: 'person_id', type: 'integer', pk: true, fk: 'person(id)' },
    { name: 'interview_date', type: 'integer' },
    { name: 'transcript', type: 'text' }
  ]
};

// Initialize DB worker and load SQLite database
function initDatabase(dbPath = 'lindenwood-mystery.db') {
  updateStatus('Loading SQLite database...', 'loading');

  try {
    dbWorker = new Worker('scripts/worker.sql.js');
  } catch (err) {
    console.warn('Worker creation failed:', err);
    updateStatus('Worker Error', 'error');
    return;
  }

  const xhr = new XMLHttpRequest();
  xhr.open('GET', dbPath, true);
  xhr.responseType = 'arraybuffer';

  xhr.onload = function () {
    if (xhr.status === 200 || (xhr.status === 0 && xhr.response && xhr.response.byteLength > 0)) {
      const uInt8Array = new Uint8Array(xhr.response);

      dbWorker.onmessage = function (event) {
        if (event.data.ready) {
          dbReady = true;
          updateStatus('Database Online (15 Tables)', 'ready');
          renderSchemaCards();
        }
      };

      dbWorker.postMessage({
        id: 1,
        action: 'open',
        buffer: uInt8Array
      });
    } else {
      updateStatus('Failed to load database file', 'error');
    }
  };

  xhr.onerror = function () {
    updateStatus('CORS / File protocol restriction', 'error');
  };

  xhr.send();
}

function updateStatus(text, state) {
  const label = document.getElementById('db-status-label');
  const dot = document.getElementById('db-status-dot');
  if (label) label.textContent = text;
  if (dot) {
    dot.className = 'lu-status-dot ' + (state === 'ready' ? 'ready' : (state === 'error' ? 'error' : ''));
  }
}

// SQL Execution dispatcher
let queryCallbackId = 2;
const pendingCallbacks = new Map();

function executeSQL(sql, onSuccess, onError) {
  if (!dbReady || !dbWorker) {
    if (onError) onError(new Error('Database is still initializing. Please wait a moment.'));
    return;
  }

  logQuery(sql);

  const id = ++queryCallbackId;
  pendingCallbacks.set(id, { onSuccess, onError });

  dbWorker.onerror = function (e) {
    const cb = pendingCallbacks.get(id);
    if (cb && cb.onError) {
      cb.onError(new Error(e.message || 'SQL Execution error'));
    }
  };

  const oldHandler = dbWorker.onmessage;
  dbWorker.onmessage = function (event) {
    if (event.data && event.data.id === id) {
      const cb = pendingCallbacks.get(id);
      pendingCallbacks.delete(id);
      if (cb && cb.onSuccess) {
        cb.onSuccess(event.data.results || []);
      }
    } else if (oldHandler) {
      oldHandler(event);
    }
  };

  dbWorker.postMessage({
    id: id,
    action: 'exec',
    sql: sql
  });
}

function buildDataTable(data) {
  if (!data || data.length === 0 || !data[0].columns) {
    return document.createTextNode('Query executed successfully. (0 rows returned)');
  }

  currentResultsData = data[0];
  const columns = data[0].columns;
  const values = data[0].values || [];

  const table = document.createElement('table');
  table.className = 'datatable';

  const thead = table.createTHead();
  const headerRow = thead.insertRow();
  columns.forEach(colName => {
    const th = document.createElement('th');
    th.textContent = colName;
    headerRow.appendChild(th);
  });

  const tbody = table.createTBody();
  values.forEach(row => {
    const tr = tbody.insertRow();
    row.forEach(val => {
      const td = tr.insertCell();
      td.textContent = (val === null || val === undefined) ? 'NULL' : val;
    });
  });

  return table;
}

function renderSchemaCards() {
  const container = document.getElementById('schema-cards-container');
  if (!container) return;

  container.innerHTML = '';
  for (const [table, columns] of Object.entries(SCHEMA_METADATA)) {
    const card = document.createElement('div');
    card.className = 'lu-table-card';

    let colsHtml = '';
    columns.forEach(col => {
      const pkBadge = col.pk ? '<span class="lu-col-pk">PK</span>' : '';
      const fkBadge = col.fk ? `<span class="lu-col-type">&rarr; ${col.fk}</span>` : '';
      colsHtml += `
        <li class="lu-column-item" onclick="insertSnippet('${col.name}')" title="Click to insert '${col.name}'">
          <span>${col.name} ${pkBadge}</span>
          <span class="lu-col-type">${col.type} ${fkBadge}</span>
        </li>
      `;
    });

    card.innerHTML = `
      <div class="lu-table-card-head">
        <span class="lu-table-name">${table}</span>
        <button class="lu-btn lu-btn-outline lu-btn-sm" onclick="previewTable('${table}')">Preview</button>
      </div>
      <ul class="lu-column-list">${colsHtml}</ul>
    `;
    container.appendChild(card);
  }
}

function previewTable(tableName) {
  switchTab('investigation');
  const sql = `SELECT * FROM ${tableName} LIMIT 10;`;
  if (workbenchEditor) {
    workbenchEditor.setValue(sql);
    runWorkbenchQuery();
  }
}

function insertSnippet(text) {
  if (!workbenchEditor) return;
  const doc = workbenchEditor.getDoc();
  const cursor = doc.getCursor();
  doc.replaceRange(text, cursor);
  workbenchEditor.focus();
}

function runWorkbenchQuery() {
  if (!workbenchEditor) return;
  const sql = workbenchEditor.getValue().trim();
  if (!sql) return;

  const resultsBox = document.getElementById('workbench-results');
  const countBadge = document.getElementById('results-count');
  const timeBadge = document.getElementById('results-time');

  resultsBox.innerHTML = '<div style="padding: 16px; color: var(--lu-gold);">Executing query...</div>';
  const startTime = performance.now();

  executeSQL(
    sql,
    results => {
      const duration = (performance.now() - startTime).toFixed(1);
      resultsBox.innerHTML = '';
      if (results && results.length > 0) {
        const rowCount = results[0].values.length;
        if (countBadge) countBadge.textContent = `${rowCount} rows returned`;
        if (timeBadge) timeBadge.textContent = `${duration} ms`;
        resultsBox.appendChild(buildDataTable(results));
      } else {
        if (countBadge) countBadge.textContent = `0 rows`;
        if (timeBadge) timeBadge.textContent = `${duration} ms`;
        resultsBox.innerHTML = '<div style="padding: 16px; color: var(--lu-text-muted);">Query executed successfully. (0 rows returned)</div>';
      }
    },
    error => {
      if (countBadge) countBadge.textContent = `Error`;
      if (timeBadge) timeBadge.textContent = `--`;
      resultsBox.innerHTML = `<div class="returnError">${error.message}</div>`;
    }
  );
}

// Solution check: runs directly against SQLite solution table trigger!
function checkSolutionSuspect(suspectName) {
  const verdictDiv = document.getElementById('solution-verdict');
  if (!suspectName || !suspectName.trim()) {
    if (verdictDiv) {
      verdictDiv.className = 'lu-solution-verdict incorrect';
      verdictDiv.style.display = 'block';
      verdictDiv.textContent = 'Please enter a suspect name.';
    }
    return;
  }

  const cleanName = suspectName.trim().replace(/'/g, "''");
  const testSql = `
    INSERT INTO solution VALUES (1, '${cleanName}');
    SELECT value FROM solution;
  `;

  executeSQL(
    testSql,
    results => {
      if (results && results.length > 0 && results[0].values.length > 0) {
        const message = results[0].values[0][0];
        displayVerdict(message, cleanName);
      }
    },
    err => {
      if (verdictDiv) {
        verdictDiv.className = 'lu-solution-verdict incorrect';
        verdictDiv.style.display = 'block';
        verdictDiv.textContent = 'Error checking solution: ' + err.message;
      }
    }
  );
}

function displayVerdict(message, suspectName) {
  const verdictDiv = document.getElementById('solution-verdict');
  if (!verdictDiv) return;

  verdictDiv.style.display = 'block';
  verdictDiv.innerHTML = message.replace(/\n/g, '<br>');

  if (message.includes('mastermind')) {
    // Solved Mastermind (Stage 2)!
    verdictDiv.className = 'lu-solution-verdict mastermind';
    studentSession.mastermindSolved = true;
    studentSession.mastermindName = suspectName;
    saveStudentSession();
    renderSubmissionReport();
  } else if (message.includes('trophy thief')) {
    // Solved Thief (Stage 1)!
    verdictDiv.className = 'lu-solution-verdict correct';
    studentSession.thiefSolved = true;
    studentSession.thiefName = suspectName;
    saveStudentSession();
    renderSubmissionReport();

    // Reveal the Mastermind Stage 2 challenge note dynamically!
    const s2Card = document.getElementById('stage-two-challenge-card');
    if (s2Card) s2Card.style.display = 'block';
  } else {
    verdictDiv.className = 'lu-solution-verdict incorrect';
  }
}

function renderSubmissionReport() {
  const container = document.getElementById('submission-report-container');
  if (!container) return;

  const hash = generateVerificationCode();

  container.innerHTML = `
    <div class="lu-certificate">
      <div class="lu-cert-header">
        <h2>LINDENWOOD UNIVERSITY</h2>
        <p>THE MISSING GOLDEN LION &bull; OFFICIAL FORENSIC SUBMISSION DOSSIER</p>
      </div>

      <div class="lu-cert-grid">
        <div><span class="lu-cert-label">Student Detective:</span> <span class="lu-cert-val">${escapeHtml(studentSession.name || 'Not logged in')}</span></div>
        <div><span class="lu-cert-label">Student ID:</span> <span class="lu-cert-val">${escapeHtml(studentSession.studentId || 'N/A')}</span></div>
        <div><span class="lu-cert-label">Course / Section:</span> <span class="lu-cert-val">${escapeHtml(studentSession.course || 'N/A')}</span></div>
        <div><span class="lu-cert-label">Student Email:</span> <span class="lu-cert-val">${escapeHtml(studentSession.email || 'N/A')}</span></div>
        <div><span class="lu-cert-label">Submission Date:</span> <span class="lu-cert-val">${new Date().toLocaleString()}</span></div>
        <div><span class="lu-cert-label">Total Forensic Queries:</span> <span class="lu-cert-val">${studentSession.queriesRun.length}</span></div>
      </div>

      <div class="lu-cert-status">
        <p><strong>Thief Identified:</strong> ${studentSession.thiefSolved ? '&#9989; ' + escapeHtml(studentSession.thiefName) : '&#10060; Unsolved'}</p>
        <p style="margin-top:4px;"><strong>Mastermind Exposed:</strong> ${studentSession.mastermindSolved ? '&#9989; ' + escapeHtml(studentSession.mastermindName) : '&#10060; Unsolved'}</p>
      </div>

      <div style="margin-bottom:16px;">
        <span class="lu-cert-label">Verification Code:</span>
        <div class="lu-cert-hash">${hash}</div>
      </div>

      <div style="display:flex; gap:10px; justify-content:center; margin-top:20px;" class="no-print">
        <button class="lu-btn lu-btn-gold" onclick="window.print()">Print / Save PDF Report</button>
        <button class="lu-btn lu-btn-outline" onclick="downloadSubmissionJSON()">Download Submission JSON</button>
        <button class="lu-btn lu-btn-outline" onclick="copyCanvasSubmission()">Copy Text for Canvas</button>
      </div>
    </div>
  `;
}

function generateVerificationCode() {
  const seed = `${studentSession.studentId}|${studentSession.name}|${studentSession.thiefSolved}|${studentSession.mastermindSolved}|${studentSession.queriesRun.length}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return 'LU-LION-' + Math.abs(hash).toString(16).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
}

function downloadSubmissionJSON() {
  const submissionData = {
    university: 'Lindenwood University',
    caseTitle: 'The Missing Golden Lion SQL Mystery',
    student: {
      name: studentSession.name,
      studentId: studentSession.studentId,
      email: studentSession.email,
      course: studentSession.course
    },
    findings: {
      thiefIdentified: studentSession.thiefSolved,
      thiefName: studentSession.thiefName,
      mastermindExposed: studentSession.mastermindSolved,
      mastermindName: studentSession.mastermindName,
      queriesExecuted: studentSession.queriesRun.length
    },
    verificationHash: generateVerificationCode(),
    queryLog: studentSession.queriesRun,
    submissionTimestamp: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(submissionData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `LU_Golden_Lion_${(studentSession.studentId || 'submission')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function copyCanvasSubmission() {
  const text = `
LINDENWOOD UNIVERSITY - THE MISSING GOLDEN LION SUBMISSION
==========================================================
Student: ${studentSession.name} (ID: ${studentSession.studentId})
Course: ${studentSession.course}
Email: ${studentSession.email}
Timestamp: ${new Date().toLocaleString()}

FINDINGS:
- Trophy Thief: ${studentSession.thiefSolved ? studentSession.thiefName : 'Incomplete'}
- Mastermind: ${studentSession.mastermindSolved ? studentSession.mastermindName : 'Incomplete'}
- Forensic Queries Executed: ${studentSession.queriesRun.length}
- Verification Token: ${generateVerificationCode()}
==========================================================
`.trim();

  navigator.clipboard.writeText(text).then(() => {
    alert('Submission text copied to clipboard! You can paste it into Canvas LMS.');
  });
}

function exportCurrentToCSV() {
  if (!currentResultsData) {
    alert('No query results available to export.');
    return;
  }

  const { columns, values } = currentResultsData;
  let csv = columns.map(c => `"${c.replace(/"/g, '""')}"`).join(',') + '\n';

  values.forEach(row => {
    csv += row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',') + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'lindenwood_lion_query_results.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function startMystery() {
  const poster = document.getElementById('mystery-poster');
  const mainContent = document.getElementById('mystery-main-content');
  if (poster) poster.style.display = 'none';
  if (mainContent) {
    mainContent.style.display = 'block';
    mainContent.scrollIntoView({ behavior: 'smooth' });
  }
  switchTab('investigation');
}

function switchTab(tabId) {
  document.querySelectorAll('.lu-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });
  document.querySelectorAll('.tab-content').forEach(section => {
    section.classList.toggle('active', section.id === `tab-${tabId}`);
  });

  if (tabId === 'investigation' && workbenchEditor) {
    setTimeout(() => workbenchEditor.refresh(), 50);
  }

  if (tabId === 'submission') {
    renderSubmissionReport();
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

window.addEventListener('DOMContentLoaded', () => {
  loadStudentSession();

  const workbenchTextarea = document.getElementById('workbench-code');
  if (workbenchTextarea) {
    workbenchEditor = CodeMirror.fromTextArea(workbenchTextarea, {
      mode: 'text/x-sql',
      indentWithTabs: true,
      smartIndent: true,
      lineNumbers: true,
      autoRefresh: true,
      viewportMargin: 10
    });

    workbenchEditor.setOption('extraKeys', {
      'Ctrl-Enter': () => runWorkbenchQuery(),
      'Cmd-Enter': () => runWorkbenchQuery()
    });
  }

  document.querySelectorAll('.lu-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  initDatabase('lindenwood-mystery.db');
});
