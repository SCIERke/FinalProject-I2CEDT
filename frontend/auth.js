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

        // Build payload object
        const payload = {
            action: actionType, // "login" or "register"
            username: username,
            password: password
        };

        console.log("Payload collected:", payload);

        // (Optional) Send payload to backend
        // fetch("/api/auth", {
        //     method: "POST",
        //     headers: { "Content-Type": "application/json" },
        //     body: JSON.stringify(payload)
        // }).then(response => response.json())
        //   .then(data => console.log("Server response:", data));
    }

    // Event listeners for buttons
    loginBtn.addEventListener("click", () => collectPayload("login"));
    registerBtn.addEventListener("click", () => collectPayload("register"));
});
