(function () {
  const apiBaseUrl = window.LIONHEART_API_BASE_URL || "";

  if (!apiBaseUrl) {
    console.warn("LIONHEART_API_BASE_URL is not set; AI panel is disabled.");
    return;
  }

  const style = document.createElement("style");
  style.textContent = `
    .lh-ai-toggle {
      position: fixed;
      right: 16px;
      bottom: 16px;
      z-index: 9999;
      border: 0;
      border-radius: 999px;
      background: #cda34f;
      color: #111;
      font-weight: 700;
      padding: 10px 14px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
      cursor: pointer;
    }
    .lh-ai-panel {
      position: fixed;
      right: 16px;
      bottom: 64px;
      width: min(360px, calc(100vw - 24px));
      max-height: 72vh;
      display: none;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      border-radius: 14px;
      background: rgba(17, 17, 17, 0.95);
      color: #f5f5f5;
      box-shadow: 0 14px 30px rgba(0, 0, 0, 0.38);
      z-index: 9999;
      font-family: "Segoe UI", sans-serif;
    }
    .lh-ai-panel.open {
      display: flex;
    }
    .lh-ai-title {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      color: #cda34f;
    }
    .lh-ai-messages {
      min-height: 180px;
      max-height: 42vh;
      overflow: auto;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.06);
      padding: 8px;
      font-size: 13px;
      line-height: 1.45;
      white-space: pre-wrap;
    }
    .lh-ai-input,
    .lh-ai-context {
      width: 100%;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
      padding: 8px;
      font-size: 13px;
      box-sizing: border-box;
    }
    .lh-ai-row {
      display: flex;
      gap: 8px;
    }
    .lh-ai-btn {
      border: 0;
      border-radius: 10px;
      padding: 8px 10px;
      font-size: 12px;
      cursor: pointer;
      font-weight: 600;
    }
    .lh-ai-btn.primary {
      background: #cda34f;
      color: #111;
    }
    .lh-ai-btn.secondary {
      background: #2a2a2a;
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
  `;
  document.head.appendChild(style);

  const toggle = document.createElement("button");
  toggle.className = "lh-ai-toggle";
  toggle.textContent = "Lion AI";

  const panel = document.createElement("div");
  panel.className = "lh-ai-panel";
  panel.innerHTML = `
    <div class="lh-ai-title">Lion Heart AI Assistant</div>
    <div id="lhAiMessages" class="lh-ai-messages">Ask for game plans, opponent analysis, or training focus.</div>
    <textarea id="lhAiContext" class="lh-ai-context" rows="2" placeholder="Optional context (fighter profile, upcoming matchup, goals)"></textarea>
    <textarea id="lhAiInput" class="lh-ai-input" rows="3" placeholder="Ask Lion AI..."></textarea>
    <div class="lh-ai-row">
      <button id="lhAiSend" class="lh-ai-btn primary">Send</button>
      <button id="lhAiAnalyze" class="lh-ai-btn secondary">Analyze Opponent Notes</button>
    </div>
  `;

  document.body.appendChild(toggle);
  document.body.appendChild(panel);

  const messages = panel.querySelector("#lhAiMessages");
  const input = panel.querySelector("#lhAiInput");
  const context = panel.querySelector("#lhAiContext");
  const send = panel.querySelector("#lhAiSend");
  const analyze = panel.querySelector("#lhAiAnalyze");

  function appendMessage(role, text) {
    const entry = `${role}: ${text}`;
    messages.textContent = `${messages.textContent}\n\n${entry}`;
    messages.scrollTop = messages.scrollHeight;
  }

  async function post(path, payload) {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Request failed (${response.status})`);
    }
    return response.json();
  }

  toggle.addEventListener("click", function () {
    panel.classList.toggle("open");
  });

  send.addEventListener("click", async function () {
    const message = input.value.trim();
    if (!message) {
      return;
    }

    appendMessage("You", message);
    input.value = "";

    try {
      const data = await post("/api/ai/chat", {
        message,
        context: context.value.trim(),
      });
      appendMessage("Lion AI", data.reply || "No response.");
    } catch (error) {
      appendMessage("Error", error.message || "Request failed.");
    }
  });

  analyze.addEventListener("click", async function () {
    const notes = input.value.trim();
    if (!notes) {
      appendMessage("Hint", "Paste opponent notes into the input box, then click analyze.");
      return;
    }

    appendMessage("You", `Analyze these notes:\n${notes}`);

    try {
      const data = await post("/api/ai/analyze", {
        opponentNotes: notes,
        fighterStyle: context.value.trim(),
      });
      appendMessage("Lion AI", data.analysis || "No analysis returned.");
    } catch (error) {
      appendMessage("Error", error.message || "Analysis failed.");
    }
  });
})();
