/**
 * The Lindenwood SQL Mystery: The Missing Golden Lion
 * Game Engine, Database Driver & Course Project Submission Manager
 * Exact Flow & Pattern of SQL Murder Mystery
 */

let dbWorker = null;
let dbReady = false;

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

  renderSubmissionReport();
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
          updateStatus('Database Ready (8 Tables Loaded)', 'ready');
          enableExerciseButtons();
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

function enableExerciseButtons() {
  document.querySelectorAll('input.sql-exercise-submit').forEach(btn => {
    btn.disabled = false;
  });
}

// Custom web component for each interactive SQL block (matches Knight Lab <sql-exercise>)
class SqlExerciseElement extends HTMLElement {
  connectedCallback() {
    const question = this.getAttribute('data-question') || '';
    const comment = this.getAttribute('data-comment') || '';
    const defaultText = this.getAttribute('data-default-text') || '';

    const homeDiv = document.createElement('div');
    homeDiv.className = 'sqlExHomeDiv';

    if (question) {
      homeDiv.insertAdjacentHTML('beforeend', `<div class="sqlExQuestion">${question}</div>`);
    }
    if (comment) {
      homeDiv.insertAdjacentHTML('beforeend', `<div class="sqlExComment">${comment}</div>`);
    }

    const form = document.createElement('form');
    const inputArea = document.createElement('div');
    inputArea.className = 'sqlExInputArea';

    const textArea = document.createElement('textarea');
    textArea.textContent = defaultText;
    inputArea.appendChild(textArea);

    const editor = CodeMirror.fromTextArea(textArea, {
      mode: 'text/x-sql',
      indentWithTabs: true,
      smartIndent: true,
      lineNumbers: true,
      autoRefresh: true,
      viewportMargin: Infinity
    });

    const runBtn = document.createElement('input');
    runBtn.type = 'submit';
    runBtn.className = 'sql-exercise-submit';
    runBtn.value = 'Run Query \u21e9';
    runBtn.disabled = !dbReady;
    inputArea.appendChild(runBtn);

    const resetBtn = document.createElement('input');
    resetBtn.type = 'button';
    resetBtn.value = 'Reset';
    resetBtn.onclick = () => {
      editor.setValue(defaultText);
      outputArea.innerHTML = '';
    };
    inputArea.appendChild(resetBtn);

    form.appendChild(inputArea);

    const outputArea = document.createElement('div');
    outputArea.className = 'sqlExOutputArea';
    form.appendChild(outputArea);

    form.onsubmit = e => {
      if (e) e.preventDefault();
      outputArea.innerHTML = '<div style="color: var(--lu-gold); padding: 8px;">Executing query...</div>';

      const code = editor.getValue();

      executeSQL(
        code,
        results => {
          outputArea.innerHTML = '';
          if (results && results.length > 0) {
            outputArea.appendChild(buildDataTable(results));

            // Check if this was a solution query
            if (code.toLowerCase().includes('solution') && results[0].values.length > 0) {
              const val = String(results[0].values[0][0]);
              handleSolutionResult(val, code);
            }
          } else {
            outputArea.innerHTML = '<div class="returnOkay">Query executed successfully. (0 rows returned)</div>';
          }
        },
        err => {
          outputArea.innerHTML = `<div class="returnError">${err.message}</div>`;
        }
      );
    };

    homeDiv.appendChild(form);
    this.appendChild(homeDiv);
  }
}

if (!customElements.get('sql-exercise')) {
  customElements.define('sql-exercise', SqlExerciseElement);
}

// Handle solution evaluation
function handleSolutionResult(message, code) {
  if (message.includes('brains') || message.includes('champagne')) {
    // Solved Mastermind (Miranda Priestly)
    studentSession.mastermindSolved = true;
    studentSession.mastermindName = 'Miranda Priestly';
    saveStudentSession();
    renderSubmissionReport();
  } else if (message.includes('caught who took') || message.includes('found who took') || message.includes('found the murderer')) {
    // Solved Culprit (Jeremy Bowers)
    studentSession.thiefSolved = true;
    studentSession.thiefName = 'Jeremy Bowers';
    saveStudentSession();
    renderSubmissionReport();
  }
}

function checkSolutionQuick(name) {
  if (!name || !name.trim()) {
    alert('Please enter a suspect name.');
    return;
  }
  const clean = name.trim().replace(/'/g, "''");
  const sql = `INSERT INTO solution VALUES (1, '${clean}'); SELECT value FROM solution;`;
  const resultDiv = document.getElementById('quick-solution-result');
  if (resultDiv) {
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<div style="color:var(--lu-gold);">Checking with campus security...</div>';
  }

  executeSQL(
    sql,
    results => {
      if (resultDiv && results && results.length > 0 && results[0].values.length > 0) {
        const msg = results[0].values[0][0];
        resultDiv.innerHTML = msg.replace(/\n/g, '<br>');
        if (msg.includes('champagne') || msg.includes('brains')) {
          resultDiv.className = 'lu-solution-verdict mastermind';
          handleSolutionResult(msg, sql);
        } else if (msg.includes('caught who took') || msg.includes('found who took')) {
          resultDiv.className = 'lu-solution-verdict correct';
          handleSolutionResult(msg, sql);
        } else {
          resultDiv.className = 'lu-solution-verdict incorrect';
        }
      }
    },
    err => {
      if (resultDiv) {
        resultDiv.className = 'lu-solution-verdict incorrect';
        resultDiv.textContent = 'Error checking solution: ' + err.message;
      }
    }
  );
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
        <div><span class="lu-cert-label">Date &amp; Time:</span> <span class="lu-cert-val">${new Date().toLocaleString()}</span></div>
        <div><span class="lu-cert-label">Forensic Queries:</span> <span class="lu-cert-val">${studentSession.queriesRun.length}</span></div>
      </div>

      <div class="lu-cert-status">
        <p><strong>Culprit (Jeremy Bowers):</strong> ${studentSession.thiefSolved ? '&#9989; Solved' : '&#10060; Unsolved'}</p>
        <p style="margin-top:4px;"><strong>Mastermind (Miranda Priestly):</strong> ${studentSession.mastermindSolved ? '&#9989; Solved' : '&#10060; Unsolved'}</p>
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
      culpritIdentified: studentSession.thiefSolved,
      culpritName: studentSession.thiefName,
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

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

window.addEventListener('DOMContentLoaded', () => {
  loadStudentSession();
  initDatabase('lindenwood-mystery.db');

  // Toggle schema diagram
  const schemaToggle = document.getElementById('show-schema-link');
  const schemaImg = document.getElementById('schema-image-container');
  if (schemaToggle && schemaImg) {
    schemaToggle.addEventListener('click', (e) => {
      e.preventDefault();
      schemaImg.style.display = schemaImg.style.display === 'none' ? 'block' : 'none';
      schemaToggle.textContent = schemaImg.style.display === 'none' ? 'click here to show the schema diagram' : 'click here to hide the schema diagram';
    });
  }
});
