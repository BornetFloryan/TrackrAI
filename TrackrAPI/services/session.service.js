const Session = require("../models/session.model");
const tcpService = require("./tcp.service");

const MAX_IDLE_MS = 10_000;

setInterval(async () => {
  const now = Date.now();

  const sessions = await Session.find({ endDate: { $exists: false } })
    .populate({ path: "module", select: "key connected" })
    .exec();

  for (const s of sessions) {
    if (!s.lastMeasureAt) continue;

    const idle = now - new Date(s.lastMeasureAt).getTime();
    if (idle > MAX_IDLE_MS) {
      console.log("[WATCHDOG] closing dead session", s.sessionId);

      s.endDate = new Date();
      await s.save();

      if (s.module?.key) {
        try {
          await tcpService.sendToCentralServer(
            `FORCE_DISCONNECT_MODULE ${s.module.key}`
          );
        } catch (_) {
          console.warn("[WATCHDOG] TCP unreachable");
        }
      }
    }
  }
}, 3000);
