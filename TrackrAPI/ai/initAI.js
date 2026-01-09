const { spawn } = require("child_process");
const fs = require("fs");

const MODEL_PATH = process.env.AI_MODEL_PATH || "/app/ai/model.joblib";

function initAI() {
  if (fs.existsSync(MODEL_PATH)) {
    console.log("[AI] Model already exists");
    return;
  }

  console.log("[AI] No model found, training at startup…");

  const p = spawn("python3", ["/app/ai/train_model.py"], {
    stdio: "inherit"
  });

  p.on("close", (code) => {
    if (code === 0) {
      console.log("[AI] Initial training done");
    } else {
      console.error("[AI] Training failed");
    }
  });
}

module.exports = { initAI };
