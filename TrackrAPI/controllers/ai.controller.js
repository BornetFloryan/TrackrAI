const { spawn } = require("child_process");
const { v4: uuidv4 } = require("uuid");

const Session = require("../models/session.model");
const Measure = require("../models/measure.model");

const { answer } = require("./ControllerAnswer");

function b64json(obj) {
  return Buffer.from(JSON.stringify(obj), "utf-8").toString("base64");
}

const analyzeSession = async (req, res, next) => {
  answer.reset();

  const { sessionId } = req.body;
  if (!sessionId) {
    answer.set({ error: 400, status: 400, data: "sessionId manquant" });
    return next(answer);
  }

  const session = await Session.findOne({ sessionId }).exec();
  if (!session) {
    answer.set({ error: 404, status: 404, data: "Session introuvable" });
    return next(answer);
  }

  const py = spawn("python3", ["ai/analyze_session.py", sessionId], {
    env: process.env,
    cwd: process.cwd(),
  });

  let out = "";
  let err = "";

  py.stdout.on("data", (d) => (out += d.toString("utf-8")));
  py.stderr.on("data", (d) => (err += d.toString("utf-8")));

  py.on("close", async (code) => {
    if (code !== 0) {
      answer.set({
        error: 500,
        status: 500,
        data: `Python error (code ${code}) ${err || out}`,
      });
      return next(answer);
    }

    let parsed;
    try {
      parsed = JSON.parse(out);
    } catch (e) {
      answer.set({ error: 500, status: 500, data: "Sortie python invalide" });
      return next(answer);
    }

    const analysisId = uuidv4();

    // On stocke le rapport IA comme une Measure, réutilisable via GET /analysis/:analysisId
    const m = {
      type: "analysis_report",
      date: new Date(),
      value: b64json(parsed),
      module: session.module,
      session: session._id,
      analysisId,
    };

    const saved = await Measure.create(m);

    answer.setPayload({
      analysisId,
      measureId: saved._id,
      result: parsed,
    });

    return res.status(201).send(answer);
  });
};

module.exports = { analyzeSession };
