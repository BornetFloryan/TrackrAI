const { spawn } = require("child_process");
const Session = require("../models/session.model");

let retraining = false;

async function maybeRetrain() {
  if (retraining) return;

  const count = await Session.countDocuments({
    "stats.score.global": { $exists: true }
  });

  if (count >= 10 && count % 10 === 0) {
    retraining = true;
    console.log(`[AI] Retraining model (${count} sessions)`);

    const p = spawn("python3", ["/app/ai/train_model.py"], {
      detached: true,
      stdio: "ignore"
    });

    p.unref();

    setTimeout(() => {
      retraining = false;
    }, 60000);
  }
}

module.exports = { maybeRetrain };
