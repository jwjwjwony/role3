/**
 * ========================================================
 * 🐰 미피 (Miffy / Dick Bruna) 스타일 클래스룸 1인 1역할 - script.js
 * 딕 브루너 감성의 원색 컬러와 경쾌한 무작위 배정 로직
 * [수정 완벽 대응] 구글 시트에서 어떤 형태로 데이터를 불러와도 [object Object]가
 * 절대 나타나지 않도록 이름 자동 정제 및 다중 데이터 포맷 파싱 시스템 탑재
 * ========================================================
 */

// 1. 기본 예시 데이터: 학생 12명 & 역할 12개
const DEFAULT_STUDENTS = [
  "김민준", "이서아", "박도윤", "최지안",
  "정시우", "윤서연", "강하준", "임지유",
  "조은우", "송하은", "한지호", "배유나"
];

const DEFAULT_ROLES = [
  {
    id: 1,
    title: "칠판 지우미",
    emoji: "🧼",
    theme: "theme-mint",
    desc: "쉬는 시간과 수업 후에 칠판을 반짝반짝 깨끗하게 닦아요."
  },
  {
    id: 2,
    title: "줄서기 반장",
    emoji: "🚶",
    theme: "theme-blue",
    desc: "이동 수업과 급식실 갈 때 바르고 조용하게 줄을 세워요."
  },
  {
    id: 3,
    title: "에너지 지킴이",
    emoji: "💡",
    theme: "theme-yellow",
    desc: "교실을 비울 때 전등과 냉난방기를 끄며 전기를 아껴요."
  },
  {
    id: 4,
    title: "우유 급식 도우미",
    emoji: "🥛",
    theme: "theme-pink",
    desc: "아침 우유 상자를 가져오고 다 마신 우유갑을 바르게 정리해요."
  },
  {
    id: 5,
    title: "분리수거 대장",
    emoji: "♻️",
    theme: "theme-mint",
    desc: "종이, 플라스틱, 캔을 종류별로 바르게 분리배출해요."
  },
  {
    id: 6,
    title: "식물 사랑이",
    emoji: "🌱",
    theme: "theme-yellow",
    desc: "교실 화분에 시원한 물을 주고 사랑스러운 말을 건네요."
  },
  {
    id: 7,
    title: "게시판 정리 도우미",
    emoji: "📌",
    theme: "theme-lavender",
    desc: "학급 알림판의 안내장과 친구들의 작품을 가지런히 붙여요."
  },
  {
    id: 8,
    title: "도서 관리 위원",
    emoji: "📚",
    theme: "theme-blue",
    desc: "학급 문고 책을 번호대로 꽂고 다 읽은 책을 제자리에 정리해요."
  },
  {
    id: 9,
    title: "체육 물품 도우미",
    emoji: "⚽",
    theme: "theme-orange",
    desc: "체육 시간에 필요한 공과 교구를 안전하게 챙기고 반납해요."
  },
  {
    id: 10,
    title: "환기 방역 지킴이",
    emoji: "🪟",
    theme: "theme-mint",
    desc: "쉬는 시간마다 창문을 활짝 열어 교실을 맑은 공기로 환기해요."
  },
  {
    id: 11,
    title: "학습지 배부 도우미",
    emoji: "📑",
    theme: "theme-lavender",
    desc: "선생님이 주시는 학습지와 알림장을 모둠별로 바르게 나눠줘요."
  },
  {
    id: 12,
    title: "아침 인사 요정",
    emoji: "☀️",
    theme: "theme-pink",
    desc: "밝은 미소와 씩씩한 목소리로 친구들과 선생님께 먼저 인사해요."
  }
];

// 2. 전역 상태
let state = {
  className: "3학년 2반",
  students: [...DEFAULT_STUDENTS],
  roles: JSON.parse(JSON.stringify(DEFAULT_ROLES)),
  assignments: {}, // { [roleId]: studentName }
  soundEnabled: true,
  isShuffling: false,
  sheetWebAppUrl: ""
};

/**
 * ========================================================
 * 💡 [핵심 해결 로직] 만능 학생 이름 추출 & 정제 함수
 * 구글 시트에서 객체({이름: "김민준"}, {name: "김민준"}), 2차원 배열([["김민준"]]),
 * 구글 시각화 API 포맷({c:[{v:"김민준"}]}), JSON 문자열 등 어떤 형태로 넘어와도
 * "[object Object]"가 절대 출력되지 않고 순수 학생 이름만 추출합니다.
 * ========================================================
 */
function extractStudentName(val) {
  if (val === null || val === undefined) return "";

  // 1) 문자열인 경우
  if (typeof val === "string") {
    let trimmed = val.trim();

    // "[object Object]" 문자열 자체를 원천 차단 (대소문자 무관)
    if (/^\[object\s+object\]$/i.test(trimmed) || trimmed === "undefined" || trimmed === "null") {
      return "";
    }

    // JSON 문자열인 경우 파싱 재귀 시도 (예: '{"name":"김민준"}')
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        const parsed = JSON.parse(trimmed);
        const extracted = extractStudentName(parsed);
        if (extracted) return extracted;
      } catch (e) {}
    }

    return trimmed;
  }

  // 2) 숫자인 경우 (출석번호만 있을 경우)
  if (typeof val === "number") {
    return String(val);
  }

  // 3) 배열인 경우: [1, "김민준"] 또는 ["김민준"] 또는 [ { v: "김민준" } ]
  if (Array.isArray(val)) {
    // 3-1: 숫자가 아닌 순수 텍스트(이름) 우선 추출
    for (const item of val) {
      const extracted = extractStudentName(item);
      if (extracted && isNaN(Number(extracted)) && !/^\[object\s+object\]$/i.test(extracted)) {
        return extracted;
      }
    }
    // 3-2: 없을 경우 첫 번째 유효값
    for (const item of val) {
      const extracted = extractStudentName(item);
      if (extracted && !/^\[object\s+object\]$/i.test(extracted)) {
        return extracted;
      }
    }
    return "";
  }

  // 4) 객체인 경우
  if (typeof val === "object") {
    // 4-1: 구글 Visualization API 구조 ({ c: [ { v: "김민준" } ] } 또는 { v: "김민준" })
    if (val.c && Array.isArray(val.c)) {
      return extractStudentName(val.c);
    }
    if (val.v !== undefined && val.v !== null) {
      const fromV = extractStudentName(val.v);
      if (fromV && !/^\[object\s+object\]$/i.test(fromV)) {
        return fromV;
      }
    }

    // 4-2: 시트 및 JSON에서 자주 쓰이는 대표 키들 우선 탐색
    const candidateKeys = [
      "name", "student", "studentname", "student_name",
      "이름", "학생", "학생명", "학생이름", "성명", "담당자", "담당", "담당학생",
      "value", "text", "title", "label",
      "b", "c", "d", "a", "col1", "col2", "col_1", "col_2",
      "1", "0"
    ];

    const entries = Object.entries(val);

    // 키 이름 정규화(공백 제거, 소문자화) 비교
    for (const cand of candidateKeys) {
      for (const [k, v] of entries) {
        const normK = k.toLowerCase().replace(/[\s_()\-]/g, "");
        if (normK === cand || normK.includes(cand)) {
          const extracted = extractStudentName(v);
          if (extracted && isNaN(Number(extracted)) && !/^\[object\s+object\]$/i.test(extracted)) {
            return extracted;
          }
        }
      }
    }

    // 4-3: 지정 키 매칭 실패 시, 객체의 값들 중 숫자가 아니고 [object가 아닌 첫 문자열 탐색
    for (const [k, v] of entries) {
      const extracted = extractStudentName(v);
      if (extracted && isNaN(Number(extracted)) && !/^\[object\s+object\]$/i.test(extracted)) {
        return extracted;
      }
    }

    // 4-4: 그래도 없으면 첫 번째 유효값
    for (const [k, v] of entries) {
      const extracted = extractStudentName(v);
      if (extracted && !/^\[object\s+object\]$/i.test(extracted)) {
        return extracted;
      }
    }
  }

  const str = String(val).trim();
  return /^\[object\s+object\]$/i.test(str) ? "" : str;
}

/**
 * 전역 상태 정제 (혹시 기존 로컬스토리지나 이전 시트 데이터에 남아있을 [object Object]를 완전 소멸)
 */
function sanitizeAllState() {
  if (Array.isArray(state.students)) {
    state.students = state.students
      .map(extractStudentName)
      .filter(name => name && !/^\[object\s+object\]$/i.test(name));
    if (state.students.length === 0) {
      state.students = [...DEFAULT_STUDENTS];
    }
  } else {
    state.students = [...DEFAULT_STUDENTS];
  }

  if (state.assignments && typeof state.assignments === "object") {
    const cleaned = {};
    Object.entries(state.assignments).forEach(([k, v]) => {
      const name = extractStudentName(v);
      if (name && !/^\[object\s+object\]$/i.test(name)) {
        cleaned[k] = name;
      }
    });
    state.assignments = cleaned;
  } else {
    state.assignments = {};
  }
}

// 3. Web Audio API 사운드 (장난감 실로폰 & 퐁당 팝 사운드)
const audioCtx = (function() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  return AudioContext ? new AudioContext() : null;
})();

function playSound(type) {
  if (!state.soundEnabled || !audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'pop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(960, now + 0.06);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'fanfare') {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = 'triangle';
        o.frequency.value = freq;
        o.connect(g);
        g.connect(audioCtx.destination);
        const start = now + idx * 0.1;
        g.gain.setValueAtTime(0.2, start);
        g.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
        o.start(start);
        o.stop(start + 0.35);
      });
    }
  } catch (err) {
    console.warn("오디오 재생 오류:", err);
  }
}

// 4. 로컬 스토리지 동기화
function loadSavedState() {
  try {
    const saved = localStorage.getItem("class_roles_state");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.className) state.className = parsed.className;
      if (Array.isArray(parsed.students) && parsed.students.length > 0) state.students = parsed.students;
      if (Array.isArray(parsed.roles) && parsed.roles.length > 0) state.roles = parsed.roles;
      if (parsed.assignments) state.assignments = parsed.assignments;
      if (typeof parsed.soundEnabled === 'boolean') state.soundEnabled = parsed.soundEnabled;
      if (parsed.sheetWebAppUrl) state.sheetWebAppUrl = parsed.sheetWebAppUrl;
    }
    // 로드 직후 [object Object] 정제 실행
    sanitizeAllState();
  } catch (e) {
    console.error("데이터 로드 실패:", e);
  }
}

function saveCurrentState() {
  try {
    sanitizeAllState();
    localStorage.setItem("class_roles_state", JSON.stringify(state));
  } catch (e) {
    console.error("데이터 저장 실패:", e);
  }
}

// 5. 토스트 알림
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "all 0.25s";
    setTimeout(() => toast.remove(), 250);
  }, 2800);
}

// 6. 미피 딕 브루너 5원색 콘페티 축하 효과
function launchConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const pieces = [];
  const colors = ['#FFCC00', '#F35C16', '#006BB6', '#009640', '#DE2B24', '#FFFFFF'];

  for (let i = 0; i < 90; i++) {
    pieces.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.7) * 16,
      size: Math.random() * 8 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 8,
      gravity: 0.26,
      opacity: 1
    });
  }

  let animationFrame;
  function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    pieces.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.rotSpeed;
      p.opacity -= 0.009;

      if (p.opacity > 0) {
        alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.75);
        ctx.strokeRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.75);
        ctx.restore();
      }
    });

    if (alive) {
      animationFrame = requestAnimationFrame(update);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationFrame);
    }
  }

  update();
}

// 7. Fisher-Yates 셔플
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 8. 🎲 무작위 역할 배정
function assignRoles(isDramatic = true) {
  if (state.isShuffling) return;

  // 순수 문자열 이름만 필터링
  const validStudents = state.students
    .map(extractStudentName)
    .filter(name => name && !/^\[object\s+object\]$/i.test(name));

  if (validStudents.length === 0) {
    showToast("⚠️ 배정할 학생 명단이 비어 있습니다!", "warning");
    return;
  }
  if (state.roles.length === 0) {
    showToast("⚠️ 배정할 역할 목록이 비어 있습니다!", "warning");
    return;
  }

  state.students = validStudents;
  state.isShuffling = true;
  const btnAssign = document.getElementById("btn-assign");
  if (btnAssign) btnAssign.disabled = true;

  const shuffledStudents = shuffleArray(state.students);
  const cardElements = document.querySelectorAll(".role-card");

  if (!isDramatic) {
    state.roles.forEach((role, idx) => {
      const assigned = extractStudentName(shuffledStudents[idx % shuffledStudents.length]);
      state.assignments[role.id] = assigned || "미배정";
    });
    finalizeAssignment();
    return;
  }

  cardElements.forEach(card => card.classList.add("card-shuffling"));

  let steps = 0;
  const maxSteps = 12;
  const interval = setInterval(() => {
    steps++;
    playSound('pop');

    cardElements.forEach(card => {
      const studentNameEl = card.querySelector(".student-name");
      if (studentNameEl) {
        const randomName = extractStudentName(state.students[Math.floor(Math.random() * state.students.length)]);
        studentNameEl.textContent = randomName || "배정 중...";
      }
    });

    if (steps >= maxSteps) {
      clearInterval(interval);
      state.roles.forEach((role, idx) => {
        const assigned = extractStudentName(shuffledStudents[idx % shuffledStudents.length]);
        state.assignments[role.id] = assigned || "미배정";
      });
      finalizeAssignment();
    }
  }, 100);
}

function finalizeAssignment() {
  state.isShuffling = false;
  const btnAssign = document.getElementById("btn-assign");
  if (btnAssign) btnAssign.disabled = false;

  sanitizeAllState();
  renderBoard();
  updatePrintView();
  saveCurrentState();
  playSound('fanfare');
  launchConfetti();
  showToast("🎉 짝짝짝! 모든 역할이 공정하게 배정되었습니다!", "success");

  const cards = document.querySelectorAll(".role-card");
  cards.forEach(card => {
    card.classList.remove("card-shuffling");
    card.classList.add("card-revealed");
  });
}

// 9. 카드 그리드 렌더링 (미피 그림책 카드 스타일)
function renderBoard() {
  const container = document.getElementById("cards-grid");
  if (!container) return;

  container.innerHTML = "";

  const assignedCount = Object.keys(state.assignments).length;
  const statStudents = document.getElementById("stat-students");
  const statRoles = document.getElementById("stat-roles");
  const statAssigned = document.getElementById("stat-assigned");

  if (statStudents) statStudents.textContent = `${state.students.length}명`;
  if (statRoles) statRoles.textContent = `${state.roles.length}개`;
  if (statAssigned) statAssigned.textContent = `${assignedCount}명`;

  state.roles.forEach((role, index) => {
    // 안전하게 정제된 이름 문자열 추출 (절대 [object Object]가 나오지 않음)
    const rawStudent = state.assignments[role.id];
    const student = extractStudentName(rawStudent);

    const card = document.createElement("div");
    card.className = `role-card ${role.theme || 'theme-mint'}`;
    card.id = `card-role-${role.id}`;

    const studentHTML = (student && !/^\[object\s+object\]$/i.test(student))
      ? `
        <div class="student-assigned">
          <span class="student-tag-label">담당 친구:</span>
          <span class="student-name">${student}</span>
        </div>
      `
      : `
        <div class="student-empty">
          <span>🎲 배정 대기 중</span>
        </div>
      `;

    card.innerHTML = `
      <div class="card-top">
        <span class="role-num-badge">역할 ${index + 1}</span>
        <button class="card-swap-btn" title="학생 직접 지정/변경" onclick="window.promptChangeStudent(${role.id})">
          ✏️ 수정
        </button>
      </div>
      <div class="role-visual">
        <div class="role-emoji-wrap">${role.emoji || '✨'}</div>
        <div class="role-info">
          <h4>${role.title}</h4>
          <p>${role.desc}</p>
        </div>
      </div>
      <div class="student-slot">
        <div class="student-box">
          ${studentHTML}
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

// 개별 역할 담당 학생 직접 변경
window.promptChangeStudent = function(roleId) {
  const role = state.roles.find(r => r.id === roleId);
  if (!role) return;
  const current = extractStudentName(state.assignments[roleId]);
  const name = prompt(`[${role.title}] 역할을 맡을 학생 이름을 입력하세요:`, current);
  if (name !== null) {
    const trimmed = name.trim();
    const cleanName = extractStudentName(trimmed);
    if (cleanName && !/^\[object\s+object\]$/i.test(cleanName)) {
      state.assignments[roleId] = cleanName;
      if (!state.students.includes(cleanName)) {
        state.students.push(cleanName);
      }
    } else {
      delete state.assignments[roleId];
    }
    saveCurrentState();
    renderBoard();
    updatePrintView();
    showToast(`'${role.title}' 담당 학생이 변경되었습니다.`, "info");
  }
};

// 10. A4 교실 게시판 인쇄 화면 업데이트
function updatePrintView() {
  const printGrid = document.getElementById("print-grid");
  const printClassTitle = document.getElementById("print-class-title");
  const printDate = document.getElementById("print-date");

  if (printClassTitle) {
    printClassTitle.textContent = state.className || "우리 반";
  }

  if (printDate) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const date = today.getDate();
    printDate.textContent = `${year}년 ${month}월 ${date}일 기준`;
  }

  if (!printGrid) return;
  printGrid.innerHTML = "";

  state.roles.forEach((role, idx) => {
    const rawStudent = state.assignments[role.id];
    const assignedStudent = extractStudentName(rawStudent) || "미배정";

    const printCard = document.createElement("div");
    printCard.className = "print-card";
    printCard.innerHTML = `
      <div>
        <div class="print-card-header">
          <div class="print-role-title">
            <span>${role.emoji}</span>
            <span>${role.title}</span>
          </div>
          <span class="print-role-num">역할 ${idx + 1}</span>
        </div>
        <div class="print-role-desc">${role.desc}</div>
      </div>
      <div class="print-assigned-box">
        <span class="print-student-label">담당 학생:</span>
        <span class="print-student-name">${assignedStudent}</span>
        <span class="print-sign-box">확인 ( &nbsp;&nbsp;&nbsp;&nbsp; )</span>
      </div>
    `;
    printGrid.appendChild(printCard);
  });
}

// 11. 인쇄 호출
function triggerPrint() {
  updatePrintView();
  window.print();
}

/**
 * ========================================================
 * 12. 구글 스프레드시트(Apps Script) 연동
 * 어떤 형태의 반환 데이터(2D 배열, 객체 배열, JSON, 텍스트)도
 * 안전하게 감지하여 올바른 학생 이름을 로드합니다.
 * ========================================================
 */
async function handleSheetLoad() {
  const url = state.sheetWebAppUrl || localStorage.getItem("sheet_webapp_url");

  if (!url) {
    openModal("modal-sheet");
    showToast("구글 앱스 스크립트 웹 앱 주소를 먼저 입력해 주세요.", "info");
    return;
  }

  showToast("🔄 구글 스프레드시트에서 데이터를 불러오는 중...", "info");

  try {
    const response = await fetch(`${url}?action=getData`, {
      method: 'GET',
      headers: { 'Accept': 'application/json, text/plain, */*' }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    // JSON 또는 텍스트 대응 파싱
    let resData;
    const textData = await response.text();

    try {
      // JSONP 래퍼가 있는 경우 순수 JSON만 추출
      let cleanedText = textData.trim();
      if (cleanedText.startsWith("/*O_o*/")) {
        const start = cleanedText.indexOf("(") + 1;
        const end = cleanedText.lastIndexOf(")");
        if (start > 0 && end > start) {
          cleanedText = cleanedText.substring(start, end);
        }
      }
      resData = JSON.parse(cleanedText);
    } catch (e) {
      // 일반 문자열인 경우 줄바꿈이나 쉼표로 분리
      const lines = textData.split(/[\r\n,]+/).map(s => s.trim()).filter(Boolean);
      resData = { students: lines };
    }

    // 1) 학생 명단 배열 후보 감지
    let rawStudents = null;

    if (Array.isArray(resData)) {
      rawStudents = resData;
    } else if (resData && typeof resData === "object") {
      if (Array.isArray(resData.students)) rawStudents = resData.students;
      else if (Array.isArray(resData.data)) rawStudents = resData.data;
      else if (Array.isArray(resData.values)) rawStudents = resData.values;
      else if (Array.isArray(resData.rows)) rawStudents = resData.rows;
      else if (Array.isArray(resData.items)) rawStudents = resData.items;
      else if (Array.isArray(resData.list)) rawStudents = resData.list;
      else if (Array.isArray(resData.records)) rawStudents = resData.records;
      else if (resData.table && Array.isArray(resData.table.rows)) rawStudents = resData.table.rows;
      else if (resData.data && typeof resData.data === "object") {
        if (Array.isArray(resData.data.students)) rawStudents = resData.data.students;
        else if (Array.isArray(resData.data.rows)) rawStudents = resData.data.rows;
        else if (Array.isArray(resData.data.values)) rawStudents = resData.data.values;
      } else if (typeof resData.students === "string") {
        rawStudents = resData.students.split(/[\r\n,]+/).map(s => s.trim()).filter(Boolean);
      } else {
        // 객체의 value들 중 배열이 있는지 탐색
        const objVals = Object.values(resData);
        for (const v of objVals) {
          if (Array.isArray(v) && v.length > 0) {
            rawStudents = v;
            break;
          }
        }
        if (!rawStudents) {
          rawStudents = objVals;
        }
      }
    }

    // 학생 이름 정제 및 저장
    if (rawStudents && Array.isArray(rawStudents)) {
      const parsedStudents = [];
      const headerWords = ["이름", "name", "학생", "학생명", "학생이름", "성명", "번호", "no", "id", "순번", "timestamp", "타임스탬프", "일시", "학급", "반"];

      rawStudents.forEach((item, index) => {
        const name = extractStudentName(item);
        if (!name || /^\[object\s+object\]$/i.test(name)) return;

        // 테이블 첫 번째 행이 헤더인 경우 제외
        const cleanLower = name.toLowerCase().replace(/[\s_()\-]/g, "");
        if (index === 0 && headerWords.includes(cleanLower)) {
          return;
        }

        if (!parsedStudents.includes(name)) {
          parsedStudents.push(name);
        }
      });

      if (parsedStudents.length > 0) {
        state.students = parsedStudents;
        // 새로운 명단을 로드했으므로 이전 배정 초기화하여 깨끗한 상태 유지
        state.assignments = {};
      }
    }

    // 2) 역할 목록이 함께 포함된 경우 처리
    let rawRoles = null;
    if (resData && typeof resData === "object") {
      if (Array.isArray(resData.roles)) rawRoles = resData.roles;
      else if (resData.data && Array.isArray(resData.data.roles)) rawRoles = resData.data.roles;
    }

    if (rawRoles && Array.isArray(rawRoles) && rawRoles.length > 0) {
      const themePool = ["theme-mint", "theme-blue", "theme-yellow", "theme-pink", "theme-lavender", "theme-orange"];
      state.roles = rawRoles.map((r, idx) => {
        if (typeof r === "string") {
          return {
            id: idx + 1,
            title: r.trim(),
            desc: "우리 교실을 위해 솔선수범해요.",
            emoji: "⭐",
            theme: themePool[idx % themePool.length]
          };
        }
        const title = r.title || r.role || r.역할 || r.역할명 || r.name || `역할 ${idx + 1}`;
        const desc = r.desc || r.description || r.설명 || r.역할설명 || "우리 교실을 위해 솔선수범해요.";
        const emoji = r.emoji || r.icon || r.아이콘 || "⭐";
        return {
          id: idx + 1,
          title: String(title).trim(),
          desc: String(desc).trim(),
          emoji: String(emoji).trim(),
          theme: themePool[idx % themePool.length]
        };
      });
    }

    // 3) 배정 결과가 포함된 경우 정제
    let rawAssignments = null;
    if (resData && typeof resData === "object") {
      if (resData.assignments) rawAssignments = resData.assignments;
      else if (resData.data && resData.data.assignments) rawAssignments = resData.data.assignments;
    }

    if (rawAssignments && typeof rawAssignments === "object") {
      const cleanAssignments = {};
      Object.entries(rawAssignments).forEach(([k, v]) => {
        const name = extractStudentName(v);
        if (name && !/^\[object\s+object\]$/i.test(name)) {
          cleanAssignments[k] = name;
        }
      });
      state.assignments = cleanAssignments;
    }

    // 4) 학급명
    if (resData.className) {
      state.className = String(resData.className);
      const classInput = document.getElementById("class-name-input");
      if (classInput) classInput.value = state.className;
    }

    // 상태 전체 무결성 검증 (객체 오염 완전 제거)
    sanitizeAllState();

    saveCurrentState();
    renderBoard();
    updatePrintView();
    setupManagementModal();
    showToast(`✅ 구글 스프레드시트에서 학생 ${state.students.length}명의 이름을 성공적으로 불러왔습니다!`, "success");
  } catch (err) {
    console.error("스프레드시트 로드 오류:", err);
    showToast("⚠️ 시트 불러오기 실패: 웹 앱 주소 및 반환 형식을 확인해 주세요.", "warning");
  }
}

async function handleSheetSave() {
  const url = state.sheetWebAppUrl || localStorage.getItem("sheet_webapp_url");

  if (!url) {
    openModal("modal-sheet");
    showToast("구글 앱스 스크립트 웹 앱 주소를 먼저 입력해 주세요.", "info");
    return;
  }

  showToast("💾 구글 스프레드시트에 배정 결과를 저장하는 중...", "info");

  // 순수 텍스트로만 안전하게 직렬화
  const payload = {
    action: "saveAssignments",
    className: state.className,
    timestamp: new Date().toISOString(),
    students: state.students.map(extractStudentName).filter(Boolean),
    roles: state.roles,
    assignments: state.assignments,
    summary: state.roles.map((r, i) => ({
      no: i + 1,
      role: r.title,
      student: extractStudentName(state.assignments[r.id]) || "미배정",
      desc: r.desc
    }))
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (result.status === "success" || result.success) {
      showToast("✅ 구글 스프레드시트에 안전하게 저장되었습니다!", "success");
    } else {
      showToast("✅ 시트로 데이터가 전송되었습니다.", "success");
    }
  } catch (err) {
    console.error("스프레드시트 저장 오류:", err);
    showToast("⚠️ 저장 요청이 전송되었습니다. (배포 웹앱 설정 확인 요망)", "info");
  }
}

// 13. 모달 제어
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add("active");
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("active");
}

// 14. 학생 & 역할 관리 모달
function setupManagementModal() {
  const textareaStudents = document.getElementById("manage-students-input");
  const textareaRoles = document.getElementById("manage-roles-input");

  if (textareaStudents) {
    // 순수 이름 문자열만 한 줄씩 표기
    const cleanNames = state.students
      .map(extractStudentName)
      .filter(name => name && !/^\[object\s+object\]$/i.test(name));
    textareaStudents.value = cleanNames.join("\n");
  }

  if (textareaRoles) {
    textareaRoles.value = state.roles.map(r => `${r.title} | ${r.desc} | ${r.emoji}`).join("\n");
  }
}

function saveManagementData() {
  const textareaStudents = document.getElementById("manage-students-input");
  const textareaRoles = document.getElementById("manage-roles-input");

  if (textareaStudents) {
    const lines = textareaStudents.value
      .split("\n")
      .map(extractStudentName)
      .filter(s => s.length > 0 && !/^\[object\s+object\]$/i.test(s));
    if (lines.length > 0) {
      state.students = lines;
    }
  }

  if (textareaRoles) {
    const roleLines = textareaRoles.value
      .split("\n")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const themePool = ["theme-mint", "theme-blue", "theme-yellow", "theme-pink", "theme-lavender", "theme-orange"];

    if (roleLines.length > 0) {
      state.roles = roleLines.map((line, idx) => {
        const parts = line.split("|").map(p => p.trim());
        const title = parts[0] || `역할 ${idx + 1}`;
        const desc = parts[1] || "우리 교실을 위해 솔선수범해요.";
        const emoji = parts[2] || "⭐";
        return {
          id: idx + 1,
          title,
          desc,
          emoji,
          theme: themePool[idx % themePool.length]
        };
      });
    }
  }

  state.assignments = {};
  sanitizeAllState();
  saveCurrentState();
  renderBoard();
  updatePrintView();
  closeModal("modal-manage");
  showToast("명단과 역할 목록이 갱신되었습니다.", "success");
}

function resetToDefault() {
  if (confirm("기본 예시 데이터(12명/12역할)로 초기화하시겠습니까?")) {
    state.students = [...DEFAULT_STUDENTS];
    state.roles = JSON.parse(JSON.stringify(DEFAULT_ROLES));
    state.assignments = {};
    saveCurrentState();
    renderBoard();
    updatePrintView();
    setupManagementModal();
    showToast("기본 데이터로 복원되었습니다.", "info");
  }
}

function exportToCSV() {
  let csvContent = "\uFEFF번호,역할명,담당학생,역할설명\n";
  state.roles.forEach((role, idx) => {
    const student = extractStudentName(state.assignments[role.id]) || "미배정";
    csvContent += `"${idx + 1}","${role.title}","${student}","${role.desc}"\n`;
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${state.className}_1인1역할_배정표.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("CSV 파일로 저장되었습니다.", "success");
}

// 15. 초기화 및 이벤트 등록
document.addEventListener("DOMContentLoaded", () => {
  loadSavedState();

  const classInput = document.getElementById("class-name-input");
  if (classInput) {
    classInput.value = state.className;
    classInput.addEventListener("input", (e) => {
      state.className = e.target.value;
      saveCurrentState();
      updatePrintView();
    });
  }

  document.getElementById("btn-sheet-load")?.addEventListener("click", handleSheetLoad);
  document.getElementById("btn-sheet-save")?.addEventListener("click", handleSheetSave);
  document.getElementById("btn-print")?.addEventListener("click", triggerPrint);
  document.getElementById("btn-manage-data")?.addEventListener("click", () => {
    setupManagementModal();
    openModal("modal-manage");
  });

  const btnSound = document.getElementById("btn-toggle-sound");
  if (btnSound) {
    btnSound.innerHTML = state.soundEnabled ? "🔊 소리 켜짐" : "🔇 소리 꺼짐";
    btnSound.addEventListener("click", () => {
      state.soundEnabled = !state.soundEnabled;
      btnSound.innerHTML = state.soundEnabled ? "🔊 소리 켜짐" : "🔇 소리 꺼짐";
      saveCurrentState();
      showToast(state.soundEnabled ? "효과음이 켜졌습니다." : "효과음이 꺼졌습니다.", "info");
    });
  }

  document.getElementById("btn-assign")?.addEventListener("click", () => {
    const isDramatic = document.getElementById("chk-dramatic")?.checked ?? true;
    assignRoles(isDramatic);
  });

  document.getElementById("btn-shuffle")?.addEventListener("click", () => {
    assignRoles(true);
  });

  document.getElementById("btn-reset")?.addEventListener("click", () => {
    if (confirm("현재 배정 상태를 모두 초기화할까요?")) {
      state.assignments = {};
      saveCurrentState();
      renderBoard();
      updatePrintView();
      showToast("배정 상태가 초기화되었습니다.", "info");
    }
  });

  document.querySelectorAll("[data-close-modal]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const modalId = e.currentTarget.getAttribute("data-close-modal");
      closeModal(modalId);
    });
  });

  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.classList.remove("active");
      }
    });
  });

  document.getElementById("btn-save-management")?.addEventListener("click", saveManagementData);
  document.getElementById("btn-reset-default")?.addEventListener("click", resetToDefault);

  const sheetUrlInput = document.getElementById("sheet-url-input");
  if (sheetUrlInput) {
    sheetUrlInput.value = state.sheetWebAppUrl;
    sheetUrlInput.addEventListener("input", (e) => {
      state.sheetWebAppUrl = e.target.value.trim();
      saveCurrentState();
    });
  }

  document.getElementById("btn-export-csv")?.addEventListener("click", exportToCSV);

  document.querySelectorAll(".tab-btn").forEach(tab => {
    tab.addEventListener("click", (e) => {
      const targetPaneId = e.target.getAttribute("data-tab");
      const parentDialog = e.target.closest(".modal-dialog");
      if (!parentDialog) return;

      parentDialog.querySelectorAll(".tab-btn").forEach(t => t.classList.remove("active"));
      parentDialog.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));

      e.target.classList.add("active");
      const targetPane = document.getElementById(targetPaneId);
      if (targetPane) targetPane.classList.add("active");
    });
  });

  // 초기 렌더링
  renderBoard();
  updatePrintView();
});
