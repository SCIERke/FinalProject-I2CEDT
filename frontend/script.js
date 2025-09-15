// ----- Random topics -----
const topics = [
  "The Impact of Technology on Education",
  "Climate Change and Its Consequences",
  "The Importance of Healthy Lifestyle",
  "Artificial Intelligence in Daily Life",
  "Future of Space Exploration"
];

// ----- Sidebar open/close -----
function toggleSidebar(){
  document.getElementById("sidebar").classList.toggle("open");
}

// ----- Random Topic -----
function randomTopic(){
  const title = topics[Math.floor(Math.random()*topics.length)];
  document.getElementById("essay-title").value = title;
}

// ----- Helpers -----
function updateResult(scores, feedback){
  // แสดงแบบ x / 10
  for(let i=1;i<=5;i++){
    const val = Number(scores[i-1] ?? 0);
    document.getElementById(`part${i}`).textContent = `${val} / 10`;
  }
  document.getElementById("feedback").textContent = feedback || "";
  document.getElementById("result").style.display = "block";
}

function scrollToTopSmooth(){
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function escapeHtml(s=""){
  return s.replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}

// ----- Submit & scoring demo (คะแนนเต็ม 10) -----
function submitEssay(){
  const titleEl = document.getElementById("essay-title");
  const textEl  = document.getElementById("essay-input");
  const title = (titleEl.value || "").trim();
  const text  = (textEl.value || "").trim();

  if(!title || !text){
    alert("กรอกหัวข้อและเนื้อหาให้ครบก่อนนะ");
    return;
  }

  // คะแนนสุ่ม 0–10 (เต็ม 10)
  const scores = Array.from({length:5},()=>Math.floor(Math.random()*11));
  const feedback =
    "DEMO: โครงสร้างชัดเจน มีการยกตัวอย่าง แต่ยังขาดการเชื่อมโยงระหว่างย่อหน้าบางส่วน และควรเพิ่มคำศัพท์เชิงวิชาการ";

  // แสดงผล
  updateResult(scores, feedback);

  // บันทึกเข้าประวัติ (พร้อม snapshot)
  addToHistory(title, text, scores, feedback);

  // เลื่อนลงไปดูผลก็ได้ แต่ตาม requirement ล่าสุดไม่ได้บังคับ
  // (คงไว้ที่ตำแหน่งปัจจุบัน)
}

// ----- History render & 3-dots menu -----
const historyList = document.getElementById("history-list");

function addToHistory(title, text, scores, feedback){
  const li = document.createElement("li");
  li.className = "history-item";
  li.dataset.title = title;
  li.dataset.text  = text;
  li.dataset.scores = JSON.stringify(scores || [0,0,0,0,0]);
  li.dataset.feedback = feedback || "";

  // title text
  const span = document.createElement("span");
  span.className = "title";
  span.textContent = title;

  // dots button
  const dots = document.createElement("button");
  dots.className = "dots-btn";
  dots.type = "button";
  dots.setAttribute("aria-label","Open item menu");
  dots.textContent = "⋯";

  // menu
  const menu = document.createElement("div");
  menu.className = "item-menu";
  menu.innerHTML = `
    <button type="button" class="menu-edit">Edit text</button>
    <button type="button" class="menu-delete">Delete</button>
  `;

  li.append(span, dots, menu);
  historyList.prepend(li); // ล่าสุดไว้บน
}

// เปิดเมนู/ลบ/แก้ไขชื่อ/เปิด snapshot
historyList.addEventListener("click", (e)=>{
  const li = e.target.closest(".history-item");
  if(!li) return;

  // 1) เปิด/ปิดเมนูจุดสามจุด
  if(e.target.classList.contains("dots-btn")){
    closeAllMenus();
    const menu = li.querySelector(".item-menu");
    menu.classList.toggle("show");
    return; // ไม่ปิด sidebar
  }

  // 2) ลบรายการ
  if(e.target.classList.contains("menu-delete")){
    li.remove();
    return; // sidebar ยังเปิดค้าง
  }

  // 3) Edit text -> แก้ไข "ชื่อหัวข้อประวัติ"
  if(e.target.classList.contains("menu-edit")){
    openRenameForm(li);
    // เมนูย่อยปิดไปได้ เพื่อไม่เกะกะ
    closeAllMenus();
    return;
  }

  // 4) ถ้าคลิกในฟอร์ม rename ให้ไม่เปิด snapshot
  if(e.target.closest(".rename-form")){
    return;
  }

  // 5) คลิกพื้นที่รายการ/ชื่อ -> โหลด snapshot และเด้งไปบนสุด
  openHistorySnapshot(li);
  scrollToTopSmooth(); // ตาม requirement
});

// คลิกนอกเมนู -> ปิดเมนูย่อย (ไม่ปิด sidebar)
document.addEventListener("click", (e)=>{
  if(e.target.closest(".history-item")) return;
  closeAllMenus();
});

function closeAllMenus(){
  document.querySelectorAll(".item-menu.show").forEach(m=>m.classList.remove("show"));
}

// ----- Inline rename helpers -----
function openRenameForm(li){
  // ถ้ามีฟอร์มอยู่แล้ว ไม่ต้องสร้างซ้ำ
  if(li.querySelector(".rename-form")) return;

  const currentTitle = li.dataset.title || "";
  const form = document.createElement("div");
  form.className = "rename-form";
  form.innerHTML = `
    <input class="rename-input" type="text" value="${escapeHtml(currentTitle)}" />
    <button class="rename-save" type="button">Save</button>
    <button class="rename-cancel" type="button">Cancel</button>
  `;
  li.appendChild(form);

    // เปิดเมนู/ลบ/แก้ไขชื่อ/เปิด snapshot
historyList.addEventListener("click", (e)=>{
  const li = e.target.closest(".history-item");
  if(!li) return;

  if(e.target.classList.contains("dots-btn")){
    closeAllMenus();
    const menu = li.querySelector(".item-menu");
    menu.classList.toggle("show");
    return;
  }

  if(e.target.classList.contains("menu-delete")){
    li.remove();
    return;
  }

  // >>> อัปเดต: Edit text = เปิดฟอร์มแก้ไขชื่อด้านบน, ปุ่มอยู่ล่าง
  if(e.target.classList.contains("menu-edit")){
    openRenameForm(li);
    closeAllMenus();
    return;
  }

  // คลิกภายในฟอร์มแก้ไข ไม่ให้ไปโหลด snapshot
  if(e.target.closest(".rename-form")){
    return;
  }

  // คลิกไอเท็ม = เปิด snapshot + เลื่อนขึ้นบนสุด
  openHistorySnapshot(li);
  scrollToTopSmooth();
});


function openRenameForm(li){
  // ถ้ากำลังเปิดฟอร์มอยู่แล้ว ไม่ต้องสร้างซ้ำ
  if(li.querySelector(".rename-form")) return;

  const currentTitle = li.dataset.title || "";
  const form = document.createElement("div");
  form.className = "rename-form";
  form.innerHTML = `
    <label class="rename-label">Edit title</label>
    <textarea class="rename-input" rows="3">${escapeHtml(currentTitle)}</textarea>
    <div class="rename-actions">
      <button class="rename-cancel" type="button">Cancel</button>
      <button class="rename-save" type="button">Save</button>
    </div>
  `;
  li.appendChild(form);

  const input = form.querySelector(".rename-input");
  input.focus();
  input.select();

  // ปุ่มกดในฟอร์ม
  form.addEventListener("click", (ev)=>{
    if(ev.target.classList.contains("rename-save")){
      const newTitle = input.value.trim() || "Untitled";
      li.dataset.title = newTitle;
      li.querySelector(".title").textContent = newTitle;
      form.remove();
    }
    if(ev.target.classList.contains("rename-cancel")){
      form.remove();
    }
  });

  // คีย์ลัด: Enter = Save, Esc = Cancel
  input.addEventListener("keydown", (ev)=>{
    if(ev.key === "Enter" && !ev.shiftKey){   // Enter บันทึก (Shift+Enter = ขึ้นบรรทัดใหม่)
      ev.preventDefault();
      form.querySelector(".rename-save").click();
    }else if(ev.key === "Escape"){
      ev.preventDefault();
      form.querySelector(".rename-cancel").click();
    }
  });
}

  // โฟกัส input
  const input = form.querySelector(".rename-input");
  input.focus();
  input.select();

  // จัดการปุ่ม
  form.addEventListener("click", (ev)=>{
    if(ev.target.classList.contains("rename-save")){
      const newTitle = input.value.trim() || "Untitled";
      li.dataset.title = newTitle;
      li.querySelector(".title").textContent = newTitle;
      form.remove();
    }
    if(ev.target.classList.contains("rename-cancel")){
      form.remove();
    }
  });

  // Enter = save, Esc = cancel
  input.addEventListener("keydown", (ev)=>{
    if(ev.key === "Enter"){
      form.querySelector(".rename-save").click();
    }else if(ev.key === "Escape"){
      form.querySelector(".rename-cancel").click();
    }
  });
}

// ----- เปิด snapshot กลับสู่หน้าเดิมของรายการ -----
function openHistorySnapshot(li){
  // เติมหัวข้อ/เนื้อหาในกล่องด้านบน
  document.getElementById("essay-title").value = li.dataset.title || "";
  document.getElementById("essay-input").value = li.dataset.text  || "";

  // เติมคะแนน/ฟีดแบ็ก snapshot (และแสดงผล)
  let scores = [0,0,0,0,0];
  try{
    scores = JSON.parse(li.dataset.scores || "[0,0,0,0,0]");
  }catch(_){}
  const feedback = li.dataset.feedback || "";
  updateResult(scores, feedback);
}
