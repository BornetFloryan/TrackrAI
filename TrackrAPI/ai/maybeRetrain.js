const { spawn } = require("child_process");
const Session = require("../models/session.model");
const { AI_DIR, PYTHON_EXECUTABLE } = require("../services/ai.service");
const path = require("path");

let retraining = false;

async function maybeRetrain() {
  if (retraining) return;

  const count = await Session.countDocuments({
    "stats.score.global": { $exists: true }
  });

  if (count >= 10 && count % 10 === 0) {
    retraining = true;
    console.log(`[AI] Retraining model (${count} sessions)`);

    const p = spawn(PYTHON_EXECUTABLE, [path.join(AI_DIR, "train_model.py")], {
      detached: true,
      stdio: "ignore",
      env: process.env,
    });

    p.unref();

    setTimeout(() => {
      retraining = false;
    }, 60000);
  }
}

module.exports = { maybeRetrain };
