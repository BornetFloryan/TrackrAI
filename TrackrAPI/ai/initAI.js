const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const { AI_DIR, PYTHON_EXECUTABLE } = require("../services/ai.service");

const MODEL_PATH = process.env.AI_MODEL_PATH || path.join(AI_DIR, "model.joblib");

function initAI() {
  const trainOnStart = process.env.AI_TRAIN_ON_START !== "0";

  if (fs.existsSync(MODEL_PATH) && !trainOnStart) {
    console.log("[AI] Existing model kept (AI_TRAIN_ON_START=0)");
    return;
  }

  console.log("[AI] Training model at startup...");

  const p = spawn(PYTHON_EXECUTABLE, [path.join(AI_DIR, "train_model.py")], {
    stdio: "inherit",
    env: process.env,
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
