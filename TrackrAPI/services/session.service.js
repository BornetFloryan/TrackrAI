const Session = require("../models/session.model");
const Measure = require("../models/measure.model");
const tcpService = require("./tcp.service");
const { computeSessionStats } = require("../utils/sessionStats");

const MAX_IDLE_MS = Number(process.env.SESSION_MAX_IDLE_MS || 10_000);
const MAX_HEART_RATE_IDLE_MS = Number(process.env.SESSION_MAX_HEART_RATE_IDLE_MS || 45_000);

async function closeSession(session, reason) {
  if (session.endDate) return;

  console.log(`[WATCHDOG] closing session ${session.sessionId}: ${reason}`);

  try {
    const measures = await Measure.find({ session: session._id }).lean().exec();
    session.stats = computeSessionStats(measures);
    session.markModified("stats");
  } catch (e) {
    console.warn("[WATCHDOG] stats computation failed", e.message);
  }

  session.endDate = new Date();
  await session.save();

  if (session.module?.key) {
    try {
      await tcpService.sendToCentralServer(`FORCE_DISCONNECT_MODULE ${session.module.key}`);
    } catch (_) {
      console.warn("[WATCHDOG] TCP unreachable");
    }
  }
}

async function getLastPositiveHeartRateAt(session) {
  if (session.lastHeartRateAt) {
    return new Date(session.lastHeartRateAt).getTime();
  }

  const lastHr = await Measure.findOne({
    session: session._id,
    type: "heart_rate",
    value: { $nin: ["0", "0.0", "0.00", "0.000"] },
  })
    .sort({ date: -1 })
    .lean()
    .exec();

  if (!lastHr || Number(lastHr.value) <= 0) return null;

  session.lastHeartRateAt = new Date(lastHr.date);
  await session.save();
  return new Date(lastHr.date).getTime();
}

setInterval(async () => {
  const now = Date.now();

  const sessions = await Session.find({ endDate: { $exists: false } })
    .populate({ path: "module", select: "key connected" })
    .exec();

  for (const s of sessions) {
    const startedAt = new Date(s.startDate || Date.now()).getTime();
    const lastMeasureAt = s.lastMeasureAt ? new Date(s.lastMeasureAt).getTime() : startedAt;
    const measureIdle = now - lastMeasureAt;

    if (s.module && s.module.connected === false) {
      await closeSession(s, "module disconnected");
      continue;
    }

    if (measureIdle > MAX_IDLE_MS) {
      await closeSession(s, `no measures for ${measureIdle}ms`);
      continue;
    }

    const sessionAge = now - startedAt;
    if (sessionAge <= MAX_HEART_RATE_IDLE_MS) continue;

    const lastHeartRateAt = await getLastPositiveHeartRateAt(s);
    if (!lastHeartRateAt) {
      await closeSession(s, "no valid heart_rate received");
      continue;
    }

    const heartRateIdle = now - lastHeartRateAt;
    if (heartRateIdle > MAX_HEART_RATE_IDLE_MS) {
      await closeSession(s, `no valid heart_rate for ${heartRateIdle}ms`);
    }
  }
}, 3000);