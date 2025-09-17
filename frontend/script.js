// ----- Script.js สำหรับ Essay Checker -----
// Auto-resize helper
function autoResize(el) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
}

// Escape HTML
function escapeHtml(s = "") {
    return String(s).replace(
        /[&<>"']/g,
        (m) =>
        ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        }[m])
    );
}
document.querySelector(".menu-btn")
    .addEventListener("click", toggleSidebar);

document.getElementById("rand-btn")
    .addEventListener("click", randomTopic);

document.getElementById("submit-btn")
    .addEventListener("click", submitEssay);
let activeSubmissionId = null;
// ----- Sidebar open/close -----
function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("open");
}

// ----- Title preview & lock -----
let titleLockedByChatName = false;

function setTitlePreview(text) {
    const el = document.getElementById("title-preview");
    if (el) el.textContent = text || "";
}

// ----- Random Topic (backend only) -----
async function randomTopic() {
    try {
        const res = await fetch("/api/topics/random");
        const j = await res.json();
        if (!j.topic) {
            alert("No unused topics left. You can reset seed or allow reuse.");
            return;
        }
        const titleInput = document.getElementById("essay-title");
        titleInput.value = j.topic;
        titleInput.dataset.topicId = j.topicId;
        if (!titleLockedByChatName) setTitlePreview(j.topic);
        autoResize(titleInput);
    } catch (err) {
        console.error("randomTopic error:", err);
        alert("ไม่สามารถดึงหัวข้อจากเซิร์ฟเวอร์ได้");
    }
}

// ----- Update result -----
function setResultVisibility(visible) {
    document.getElementById("result").style.display = visible ? "block" : "none";
}

// ปรับปรุง: แสดง feedback แยกหัวข้อ
function updateResultFromResultObj(result) {
    if (!result) return setResultVisibility(false);
    const crit = result.scores || {};
    const scores = [
        crit ? crit.taskResponse.score : "-",
        crit ? crit.coherenceCohesion.score : "-",
        crit ? crit.lexicalResource.score : "-",
        crit ? crit.grammaticalRange.score : "-",
        crit ? crit.overall : "-",
    ];

    for (let i = 1; i <= 5; i++) {
        const scoreSpan = document.getElementById(`part${i}`);
        if (scoreSpan) scoreSpan.textContent = scores[i - 1] + " / 9";

        const fbEl = document.getElementById(`part${i}-fb`);
        if (fbEl) {
            let fbText = "";
            switch (i) {
                case 1:
                    fbText = crit ? crit.taskResponse.feedback : "";
                    break;
                case 2:
                    fbText = crit ? crit.coherenceCohesion.feedback : "";
                    break;
                case 3:
                    fbText = crit ? crit.lexicalResource.feedback : "";
                    break;
                case 4:
                    fbText = crit ? crit.grammaticalRange.feedback : "";
                    break;
                case 5:
                    fbText = crit ? crit.feedback : "";
                    break;
            }
            fbEl.innerHTML = `<strong>${
        i === 5 ? "Feedback" : "Reasoning"
      }:</strong> ${escapeHtml(fbText)}`;
        }
    }
    setResultVisibility(true);
}

// ----- Submit essay -----
async function submitEssay() {
    const titleEl = document.getElementById("essay-title");
    const textEl = document.getElementById("essay-input");
    const title = (titleEl.value || "").trim();
    const text = (textEl.value || "").trim();
    const topicId = titleEl.dataset.topicId || null;

    if (!title || !text) {
        alert("กรอกหัวข้อและเนื้อหาให้ครบก่อนนะ");
        return;
    }

    try {
        const submitBtn = document.getElementById("submit-btn");
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting...";

        const payload = topicId ? { topicId, essay: text } : { topic: title, essay: text };

        payload.user = localStorage.getItem("username")
        if (activeSubmissionId) {
            payload.submissionId = activeSubmissionId;
        } else
        if (topicId) {
            payload.topicId = topicId;
        }
        const res = await fetch("/api/submissions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ message: "server error" }));
            throw new Error(err.message || "Submission failed");
        }
        const response = await res.json();
        updateResultFromResultObj(response.submission.result);


        addToHistoryItem({
            id: response.submission.id,
            topic: response.submission.topic,
            topicId: topicId || response.submission.topicId,
            essay: response.submission.essay,
            result: response,
            createdAt: new Date().toISOString(),
        });

        // textEl.value = "";
        titleEl.dataset.topicId = "";
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit";
        await loadHistory();
    } catch (err) {
        console.error("submitEssay error:", err);
        alert("ไม่สามารถส่ง essay ได้: " + (err.message || err));
        const submitBtn = document.getElementById("submit-btn");
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit";
    }
}

// ----- Sidebar history -----
const historyList = document.getElementById("history-list");

function createHistoryElement(item) {
    const li = document.createElement("li");
    li.className = "history-item";
    li.dataset.id = item.id || "";
    li.dataset.title = item.topic || "";
    li.dataset.text = item.essay || "";

    li.dataset.result = JSON.stringify(item.result || {});
    li.innerHTML = `
    <span class="title">${escapeHtml(item.topic)}</span>
    <button class="dots-btn" aria-label="Open item menu">⋯</button>
    <div class="item-menu">
      <button class="menu-edit">Edit</button>
      <button class="menu-delete">Delete</button>
    </div>
  `;
    return li;
}

function addToHistoryItem(item) {
    const el = createHistoryElement(item);
    historyList.prepend(el);
}

// ----- History click events -----
historyList.addEventListener("click", (e) => {
    const li = e.target.closest(".history-item");
    if (!li) return;

    if (e.target.classList.contains("dots-btn")) {
        closeAllMenus();
        li.querySelector(".item-menu").classList.toggle("show");
        return;
    }

    if (e.target.classList.contains("menu-edit")) {
        if (li.querySelector(".edit-box")) return;
        const currentTitle = li.dataset.title || "";
        const editBox = document.createElement("div");
        editBox.className = "edit-box";
        editBox.innerHTML = `
      <input type="text" class="edit-input" value="${escapeHtml(
        currentTitle
      )}" />
      <div class="edit-buttons">
        <button class="edit-save">Save</button>
        <button class="edit-cancel">Cancel</button>
      </div>
    `;
        li.appendChild(editBox);
        editBox.querySelector(".edit-input").focus();
        closeAllMenus();
        return;
    }

    if (e.target.classList.contains("edit-save")) {
        const editBox = e.target.closest(".edit-box");
        const newTitle = editBox.querySelector(".edit-input").value.trim();
        if (!newTitle) return alert("กรอกชื่อหัวข้อให้ถูกต้อง");
        const id = li.dataset.id;
        fetch(`/api/submissions/${id}/topic`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newTopic: newTitle }),
            })
            .then((res) => res.json())
            .then((j) => {
                li.dataset.title = j.topic;
                li.querySelector(".title").textContent = j.topic;
                editBox.remove();
            })
            .catch((err) => {
                console.error(err);
                alert("ไม่สามารถแก้ไขชื่อหัวข้อได้");
            });
        return;
    }

    if (e.target.classList.contains("edit-cancel")) {
        const editBox = e.target.closest(".edit-box");
        editBox.remove();
        return;
    }

    if (e.target.classList.contains("menu-delete")) {
        async function deleteSubmissionFromServer(li) {
            const id = li.dataset.id;
            if (!id) return;
            try {
                const res = await fetch(`/api/submissions/${id}`, { method: "DELETE" });
                const j = await res.json().catch(() => ({}));
                if (res.status !== 200) throw new Error(j.message || "Delete failed");
                li.remove();
                await loadHistory();
            } catch (err) {
                console.error("Delete submission error:", err);
                alert("ไม่สามารถลบ submission ได้: " + (err.message || ""));
            }
        }
        deleteSubmissionFromServer(li);
        closeAllMenus();
        return;
    }
    openHistorySnapshot(li);
    closeAllMenus();
});

function closeAllMenus() {
    document
        .querySelectorAll(".item-menu.show")
        .forEach((m) => m.classList.remove("show"));
}

document.addEventListener("click", (e) => {
    if (e.target.closest(".history-item")) return;
    closeAllMenus();
});

// ----- Open snapshot -----
function openHistorySnapshot(li) {
    activeSubmissionId = li.dataset.id; // <-- เพิ่มบรรทัดนี้
    const titleEl = document.getElementById("essay-title");
    const textEl = document.getElementById("essay-input");
    titleEl.value = li.dataset.title || "";
    textEl.value = li.dataset.text || "";
    const result = JSON.parse(li.dataset.result || "{}");
    updateResultFromResultObj(result);
    autoResize(titleEl);
    autoResize(textEl);
}

// ----- Load history from backend -----
async function loadHistory() {
    try {
        const username = localStorage.getItem("username");
        console.log(username)

        const res = await fetch(`/api/submissions/history?username=${encodeURIComponent(username)} `, {
            method: "GET", // ต้องระบุ method
        });
        const j = await res.json();
        historyList.innerHTML = "";
        if (!j.submissions || !j.submissions.length) {
            historyList.innerHTML = "<li class='small'>No submissions yet.</li>";
            return;
        }
        j.submissions.forEach((s) =>
            addToHistoryItem({
                id: s.id,
                topic: s.topic,
                essay: s.essay,
                result: s.result,
                createdAt: s.createdAt,
            })
        );
    } catch (err) {
        console.error("loadHistory error:", err);
        historyList.innerHTML = "<li class='small'>Cannot load history.</li>";
    }
}

// ----- Initialize -----
document.addEventListener("DOMContentLoaded", () => {
    setResultVisibility(false);
    loadHistory();

    const titleEl = document.getElementById("essay-title");
    if (titleEl) {
        titleEl.addEventListener("input", () => autoResize(titleEl));
        autoResize(titleEl);
    }
    const textEl = document.getElementById("essay-input");
    if (textEl) textEl.addEventListener("input", () => autoResize(textEl));

    document.getElementById("submit-btn").addEventListener("click", submitEssay);
    document.getElementById("rand-btn").addEventListener("click", randomTopic);
    const menuBtn = document.querySelector(".menu-btn");
    if (menuBtn) menuBtn.addEventListener("click", toggleSidebar);
});