// Wait until DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const loginBtn = document.getElementById("loginBtn");
    const registerBtn = document.getElementById("registerBtn");


    function collectPayload(actionType) {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!username || !password) {
            alert("Please fill in both username and password.");
            return;
        }

        const payload = { username, password };

        let url = "";
        if (actionType === "register") {
            console.log("Registering user:");
            url = "/api/users/register";
        } else if (actionType === "login") {
            console.log("Logging in user:");
            url = "/api/users/login";
        }

        console.log("Sending payload:", payload, "to", url);

        fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                console.log("Server response:", data);
                alert(data.message || "Request completed");

                // ✅ ถ้า login/register สำเร็จ ให้ redirect ไปหน้าเว็บหลัก
                if (data.message.includes("successfully") || data.message.includes("successful")) {
                    // เปลี่ยน URL ให้ตรงกับเว็บตรวจ essay ของคุณ
                    localStorage.setItem("username", username);

                    window.location.href = "index.html"; // ตอนนี้เชื่อมด้วย keyword ไปก่อน เดี๋ยวจะกลับมาหาวิธีให้เชื่อมไปได้ทันที ไม่ต้องกด
                }
            })
            .catch(err => {
                console.error("Error:", err);
                alert("Error connecting to server");
            });
    }


    // Event listeners for buttons
    loginBtn.addEventListener("click", () => collectPayload("login"));
    registerBtn.addEventListener("click", () => collectPayload("register"));
});