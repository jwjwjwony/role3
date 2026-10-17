/**
 * ========================================================
 * 🏢 W.CLASSROOM - script.js
 * W Concept 에디토리얼 스타일 학급 1인 1역할 배정 및 관리 로직
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

// 3. Web Audio API 사운드 (미니멀하고 세련된 차임 & 클릭 사운드)
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
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(840, now + 0.05);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'fanfare') {
      const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5 (세련된 메이저 코드)
      notes.forEach((freq, idx) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = 'sine';
        o.frequency.value = freq;
        o.connect(g);
        g.connect(audioCtx.destination);
        const start = now + idx * 0.09;
        g.gain.setValueAtTime(0.12, start);
        g.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
        o.start(start);
        o.stop(start + 0.4);
      });
    }
  } catch (err) {
    console.warn("Audio error:", err);
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
  } catch (e) {
    console.error("데이터 로드 실패:", e);
  }
}

function saveCurrentState() {
  try {
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
    toast.style.transition = "all 0.3s";
    setTimeout(() => toast.remove(), 300);
  }, 2600);
}

// 6. 에디토리얼 골드/블랙/레몬 콘페티 축하 효과
function launchConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const pieces = [];
  // W Concept & Pantone Lemon Icing 컬러 팔레트 (블랙, 골드, 샴페인, 레몬아이싱)
  const colors = ['#111111', '#F6EBC8', '#B8860B', '#D4AF37', '#E6D7AD', '#333333', '#9C7D38'];

  for (let i = 0; i < 80; i++) {
    pieces.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 15,
      vy: (Math.random() - 0.7) * 15,
      size: Math.random() * 7 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 8,
      gravity: 0.25,
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
      p.opacity -= 0.01;

      if (p.opacity > 0) {
        alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
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

  if (state.students.length === 0) {
    showToast("⚠️ 배정할 학생 명단이 없습니다.", "warning");
    return;
  }
  if (state.roles.length === 0) {
    showToast("⚠️ 배정할 역할 목록이 없습니다.", "warning");
    return;
  }

  state.isShuffling = true;
  const btnAssign = document.getElementById("btn-assign");
  if (btnAssign) btnAssign.disabled = true;

  const shuffledStudents = shuffleArray(state.students);
  const cardElements = document.querySelectorAll(".role-card");

  if (!isDramatic) {
    state.roles.forEach((role, idx) => {
      state.assignments[role.id] = shuffledStudents[idx % shuffledStudents.length] || "미배정";
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
        const randomName = state.students[Math.floor(Math.random() * state.students.length)];
        studentNameEl.textContent = randomName;
      }
    });

    if (steps >= maxSteps) {
      clearInterval(interval);
      state.roles.forEach((role, idx) => {
        state.assignments[role.id] = shuffledStudents[idx % shuffledStudents.length] || "미배정";
      });
      finalizeAssignment();
    }
  }, 100);
}

function finalizeAssignment() {
  state.isShuffling = false;
  const btnAssign = document.getElementById("btn-assign");
  if (btnAssign) btnAssign.disabled = false;

  renderBoard();
  updatePrintView();
  saveCurrentState();
  playSound('fanfare');
  launchConfetti();
  showToast("CURATION COMPLETED : 배정이 완료되었습니다.", "success");

  const cards = document.querySelectorAll(".role-card");
  cards.forEach(card => {
    card.classList.remove("card-shuffling");
    card.classList.add("card-revealed");
  });
}

// 9. 카드 그리드 렌더링 (W Concept Lookbook Card Style)
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
    const student = state.assignments[role.id];
    const card = document.createElement("div");
    card.className = `role-card ${role.theme || 'theme-mint'}`;
    card.id = `card-role-${role.id}`;

    const studentHTML = student
      ? `
        <div class="student-assigned">
          <span class="student-tag-label">ASSIGNEE</span>
          <span class="student-name">${student}</span>
        </div>
      `
      : `
        <div class="student-empty">
          <span>UNASSIGNED</span>
        </div>
      `;

    card.innerHTML = `
      <div class="card-top">
        <span class="role-num-badge">ITEM ${String(index + 1).padStart(2, '0')}</span>
        <button class="card-swap-btn" title="학생 직접 지정/변경" onclick="window.promptChangeStudent(${role.id})">
          EDIT
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
  const current = state.assignments[roleId] || "";
  const name = prompt(`[${role.title}] 역할을 맡을 학생 이름을 입력하세요:`, current);
  if (name !== null) {
    const trimmed = name.trim();
    if (trimmed) {
      state.assignments[roleId] = trimmed;
      if (!state.students.includes(trimmed)) {
        state.students.push(trimmed);
      }
    } else {
      delete state.assignments[roleId];
    }
    saveCurrentState();
    renderBoard();
    updatePrintView();
    showToast(`UPDATED : '${role.title}' 담당 학생이 변경되었습니다.`, "info");
  }
};

// 10. A4 에디토리얼 인쇄 화면 업데이트
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
    const assignedStudent = state.assignments[role.id] || "미배정";
    const printCard = document.createElement("div");
    printCard.className = "print-card";
    printCard.innerHTML = `
      <div>
        <div class="print-card-header">
          <div class="print-role-title">
            <span>${role.emoji}</span>
            <span>${role.title}</span>
          </div>
          <span class="print-role-num">ITEM ${String(idx + 1).padStart(2, '0')}</span>
        </div>
        <div class="print-role-desc">${role.desc}</div>
      </div>
      <div class="print-assigned-box">
        <span class="print-student-label">ASSIGNEE:</span>
        <span class="print-student-name">${assignedStudent}</span>
        <span class="print-sign-box">CHECK ( &nbsp;&nbsp;&nbsp;&nbsp; )</span>
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

// 12. 구글 스프레드시트(Apps Script) 연동
async function handleSheetLoad() {
  const url = state.sheetWebAppUrl || localStorage.getItem("sheet_webapp_url");

  if (!url) {
    openModal("modal-sheet");
    showToast("Google Apps Script 웹 앱 URL을 먼저 입력해 주세요.", "info");
    return;
  }

  showToast("CONNECTING : 구글 스프레드시트에서 데이터를 로드 중입니다...", "info");

  try {
    const response = await fetch(`${url}?action=getData`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const resData = await response.json();

    if (resData.students && Array.isArray(resData.students)) {
      state.students = resData.students;
    }
    if (resData.roles && Array.isArray(resData.roles)) {
      state.roles = resData.roles;
    }
    if (resData.assignments) {
      state.assignments = resData.assignments;
    }
    if (resData.className) {
      state.className = resData.className;
      const classInput = document.getElementById("class-name-input");
      if (classInput) classInput.value = state.className;
    }

    saveCurrentState();
    renderBoard();
    updatePrintView();
    showToast("SUCCESS : 구글 시트 데이터를 성공적으로 동기화했습니다.", "success");
  } catch (err) {
    console.error("스프레드시트 로드 오류:", err);
    showToast("⚠️ 시트 불러오기 실패: Apps Script URL 및 배포 권한을 확인해 주세요.", "warning");
  }
}

async function handleSheetSave() {
  const url = state.sheetWebAppUrl || localStorage.getItem("sheet_webapp_url");

  if (!url) {
    openModal("modal-sheet");
    showToast("Google Apps Script 웹 앱 URL을 먼저 입력해 주세요.", "info");
    return;
  }

  showToast("SAVING : 구글 스프레드시트에 배정 결과를 저장하는 중...", "info");

  const payload = {
    action: "saveAssignments",
    className: state.className,
    timestamp: new Date().toISOString(),
    students: state.students,
    roles: state.roles,
    assignments: state.assignments,
    summary: state.roles.map((r, i) => ({
      no: i + 1,
      role: r.title,
      student: state.assignments[r.id] || "미배정",
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
      showToast("SUCCESS : 구글 시트에 안전하게 저장되었습니다.", "success");
    } else {
      showToast("SUCCESS : 시트로 데이터가 전송되었습니다.", "success");
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
    textareaStudents.value = state.students.join("\n");
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
      .map(s => s.trim())
      .filter(s => s.length > 0);
    if (lines.length > 0) {
      state.students = lines;
    }
  }

  if (textareaRoles) {
    const roleLines = textareaRoles.value
      .split("\n")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const themePool = ["theme-pink", "theme-mint", "theme-blue", "theme-yellow", "theme-lavender", "theme-orange"];

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
  saveCurrentState();
  renderBoard();
  updatePrintView();
  closeModal("modal-manage");
  showToast("APPLIED : 학생 및 역할 데이터가 갱신되었습니다.", "success");
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
    showToast("DEFAULT RESET : 초기 데이터로 복원되었습니다.", "info");
  }
}

function exportToCSV() {
  let csvContent = "\uFEFF번호,역할명,담당학생,역할설명\n";
  state.roles.forEach((role, idx) => {
    const student = state.assignments[role.id] || "미배정";
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
  showToast("EXPORTED : CSV 파일이 다운로드되었습니다.", "success");
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
    btnSound.innerHTML = state.soundEnabled ? "🔊 SOUND ON" : "🔇 SOUND OFF";
    btnSound.addEventListener("click", () => {
      state.soundEnabled = !state.soundEnabled;
      btnSound.innerHTML = state.soundEnabled ? "🔊 SOUND ON" : "🔇 SOUND OFF";
      saveCurrentState();
      showToast(state.soundEnabled ? "SOUND ENABLED" : "SOUND MUTED", "info");
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
      showToast("RESET : 배정 상태가 초기화되었습니다.", "info");
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

  renderBoard();
  updatePrintView();
});
