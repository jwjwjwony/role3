/**
 * ========================================================
 * 🏫 학급 1인 1역할 배정 도우미 - script.js
 * 역할 무작위 매칭, A4 인쇄, 구글 스프레드시트 연동 준비 로직
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

// 2. 전역 상태 (Local Storage와 동기화)
let state = {
  className: "3학년 2반",
  students: [...DEFAULT_STUDENTS],
  roles: JSON.parse(JSON.stringify(DEFAULT_ROLES)),
  assignments: {}, // { [roleId]: studentName }
  soundEnabled: true,
  isShuffling: false,
  sheetWebAppUrl: ""
};

// 3. Web Audio API 사운드 시스템 (외부 파일 없이 순수 브라우저 합성음)
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
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'fanfare') {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = 'triangle';
        o.frequency.value = freq;
        o.connect(g);
        g.connect(audioCtx.destination);
        const start = now + idx * 0.1;
        g.gain.setValueAtTime(0.18, start);
        g.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
        o.start(start);
        o.stop(start + 0.35);
      });
    }
  } catch (err) {
    console.warn("오디오 재생 오류:", err);
  }
}

// 4. 로컬 스토리지 저장 및 불러오기
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

// 5. 토스트 알림 표시
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
  }, 2800);
}

// 6. Confetti 축하 효과 (순수 Canvas 구현)
function launchConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const pieces = [];
  const colors = ['#ff8fab', '#a7e8bd', '#a2d2ff', '#f6d860', '#d8b4fe', '#ffb703', '#fb8500'];

  for (let i = 0; i < 90; i++) {
    pieces.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.7) * 16,
      size: Math.random() * 8 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
      gravity: 0.28,
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
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
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

// 7. Fisher-Yates 셔플 알고리즘
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 8. 🎲 무작위 역할 배정 실행
function assignRoles(isDramatic = true) {
  if (state.isShuffling) return;

  if (state.students.length === 0) {
    showToast("⚠️ 배정할 학생 명단이 비어 있습니다!", "warning");
    return;
  }
  if (state.roles.length === 0) {
    showToast("⚠️ 배정할 역할 목록이 비어 있습니다!", "warning");
    return;
  }

  state.isShuffling = true;
  const btnAssign = document.getElementById("btn-assign");
  if (btnAssign) btnAssign.disabled = true;

  const shuffledStudents = shuffleArray(state.students);
  const cardElements = document.querySelectorAll(".role-card");

  if (!isDramatic) {
    // 즉시 배정
    state.roles.forEach((role, idx) => {
      state.assignments[role.id] = shuffledStudents[idx % shuffledStudents.length] || "미배정";
    });
    finalizeAssignment();
    return;
  }

  // 두구두구 셔플 애니메이션
  cardElements.forEach(card => card.classList.add("card-shuffling"));

  let steps = 0;
  const maxSteps = 12;
  const interval = setInterval(() => {
    steps++;
    playSound('pop');

    // 임의의 이름들로 빠르게 스크롤되는 연출
    cardElements.forEach(card => {
      const studentNameEl = card.querySelector(".student-name");
      if (studentNameEl) {
        const randomName = state.students[Math.floor(Math.random() * state.students.length)];
        studentNameEl.textContent = randomName;
      }
    });

    if (steps >= maxSteps) {
      clearInterval(interval);
      // 최종 확정 배정 반영
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
  showToast("🎉 모든 역할이 공정하게 배정되었습니다!", "success");

  // 카드 등장 효과
  const cards = document.querySelectorAll(".role-card");
  cards.forEach(card => {
    card.classList.remove("card-shuffling");
    card.classList.add("card-revealed");
  });
}

// 9. 카드 그리드 화면 렌더링
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
          <div class="student-avatar">${student.charAt(0)}</div>
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
        <span class="role-num-badge">No. ${index + 1}</span>
        <button class="card-swap-btn" title="학생 직접 지정/변경" onclick="window.promptChangeStudent(${role.id})">
          ✏️ 변경
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

// 특정 카드의 학생 직접 변경/지정
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
    showToast(`'${role.title}' 담당자가 변경되었습니다.`, "info");
  }
};

// 10. 교실 게시판 부착용 A4 인쇄 화면 업데이트
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

// 11. 🖨️ 인쇄 기능 호출
function triggerPrint() {
  updatePrintView();
  window.print();
}

// 12. 🔄 구글 스프레드시트(Apps Script) 연동 핸들러
async function handleSheetLoad() {
  const url = state.sheetWebAppUrl || localStorage.getItem("sheet_webapp_url");

  if (!url) {
    // URL이 설정되지 않은 경우 모달을 열어 안내
    openModal("modal-sheet");
    showToast("연동할 구글 스프레드시트 Apps Script 웹 앱 URL을 먼저 입력해 주세요.", "info");
    return;
  }

  showToast("🔄 구글 스프레드시트에서 데이터를 불러오는 중...", "info");

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
    showToast("✅ 구글 스프레드시트 데이터를 성공적으로 불러왔습니다!", "success");
  } catch (err) {
    console.error("스프레드시트 로드 오류:", err);
    showToast("⚠️ 시트 불러오기 실패: Apps Script URL 및 CORS 설정을 확인해 주세요.", "warning");
  }
}

async function handleSheetSave() {
  const url = state.sheetWebAppUrl || localStorage.getItem("sheet_webapp_url");

  if (!url) {
    openModal("modal-sheet");
    showToast("저장할 구글 스프레드시트 Apps Script 웹 앱 URL을 먼저 입력해 주세요.", "info");
    return;
  }

  showToast("💾 구글 스프레드시트에 결과 저장 중...", "info");

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
        "Content-Type": "text/plain;charset=utf-8" // GAS redirection compatibility
      },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (result.status === "success" || result.success) {
      showToast("✅ 구글 스프레드시트에 배정 결과가 저장되었습니다!", "success");
    } else {
      showToast("✅ 시트에 데이터가 전송되었습니다.", "success");
    }
  } catch (err) {
    console.error("스프레드시트 저장 오류:", err);
    showToast("⚠️ 시트 저장 요청이 전송되었습니다. (배포 웹앱 설정 확인 요망)", "info");
  }
}

// 13. 모달 제어 함수
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add("active");
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("active");
}

// 14. 학생 & 역할 관리 모달 채우기 및 저장
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

  // 기존 배정 초기화 후 다시 맞추기
  state.assignments = {};
  saveCurrentState();
  renderBoard();
  updatePrintView();
  closeModal("modal-manage");
  showToast("명단과 역할 목록이 갱신되었습니다.", "success");
}

// 15. 초기 데이터로 리셋
function resetToDefault() {
  if (confirm("정말 기본 예시 데이터(12명/12역할)로 초기화하시겠습니까?")) {
    state.students = [...DEFAULT_STUDENTS];
    state.roles = JSON.parse(JSON.stringify(DEFAULT_ROLES));
    state.assignments = {};
    saveCurrentState();
    renderBoard();
    updatePrintView();
    setupManagementModal();
    showToast("기본 예시 데이터로 초기화되었습니다.", "info");
  }
}

// 16. CSV/JSON 다운로드 백업 기능 (스프레드시트 대용 및 백업용)
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
  showToast("CSV 파일로 저장되었습니다.", "success");
}

// 17. 초기화 및 이벤트 리스너 바인딩
document.addEventListener("DOMContentLoaded", () => {
  loadSavedState();

  // 학급명 바인딩
  const classInput = document.getElementById("class-name-input");
  if (classInput) {
    classInput.value = state.className;
    classInput.addEventListener("input", (e) => {
      state.className = e.target.value;
      saveCurrentState();
      updatePrintView();
    });
  }

  // 상단 툴바 버튼
  document.getElementById("btn-sheet-load")?.addEventListener("click", handleSheetLoad);
  document.getElementById("btn-sheet-save")?.addEventListener("click", handleSheetSave);
  document.getElementById("btn-print")?.addEventListener("click", triggerPrint);
  document.getElementById("btn-manage-data")?.addEventListener("click", () => {
    setupManagementModal();
    openModal("modal-manage");
  });

  // 사운드 토글
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

  // 메인 액션 버튼
  document.getElementById("btn-assign")?.addEventListener("click", () => {
    const isDramatic = document.getElementById("chk-dramatic")?.checked ?? true;
    assignRoles(isDramatic);
  });

  document.getElementById("btn-shuffle")?.addEventListener("click", () => {
    assignRoles(true);
  });

  document.getElementById("btn-reset")?.addEventListener("click", () => {
    if (confirm("배정된 학생을 모두 지우고 초기화할까요?")) {
      state.assignments = {};
      saveCurrentState();
      renderBoard();
      updatePrintView();
      showToast("배정 상태가 초기화되었습니다.", "info");
    }
  });

  // 모달 닫기 버튼들
  document.querySelectorAll("[data-close-modal]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const modalId = e.currentTarget.getAttribute("data-close-modal");
      closeModal(modalId);
    });
  });

  // 모달 바깥 배경 클릭시 닫기
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.classList.remove("active");
      }
    });
  });

  // 명단 관리 모달 저장 & 리셋 버튼
  document.getElementById("btn-save-management")?.addEventListener("click", saveManagementData);
  document.getElementById("btn-reset-default")?.addEventListener("click", resetToDefault);

  // 스프레드시트 설정 모달 바인딩
  const sheetUrlInput = document.getElementById("sheet-url-input");
  if (sheetUrlInput) {
    sheetUrlInput.value = state.sheetWebAppUrl;
    sheetUrlInput.addEventListener("input", (e) => {
      state.sheetWebAppUrl = e.target.value.trim();
      saveCurrentState();
    });
  }

  document.getElementById("btn-export-csv")?.addEventListener("click", exportToCSV);

  // 탭 전환 핸들러
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

  // 화면 첫 렌더링
  renderBoard();
  updatePrintView();
});
