const { v4: uuidv4 } = require("uuid");

const Session = require("../models/session.model");
const Module = require("../models/module.model");

const SessionErrors = require("../commons/session.errors");
const ModuleErrors = require("../commons/module.errors");

const { answer } = require("./ControllerAnswer");
const tcpService = require("../services/tcp.service");

const Measure = require('../models/measure.model')
const { computeSessionStats } = require('../utils/sessionStats')

const { maybeRetrain } = require("../ai/maybeRetrain");
const aiService = require("../services/ai.service");


const start = async (req, res, next) => {
  answer.reset();

  const user = req.user;
  const { moduleKey } = req.body;

  if (!moduleKey) {
    answer.set(
      SessionErrors.getError(SessionErrors.ERR_SESSION_INVALID_REQUEST)
    );
    return next(answer);
  }

  const module = await Module.findOne({ key: moduleKey }).exec();
  if (!module) {
    answer.set(
      ModuleErrors.getError(ModuleErrors.ERR_MODULE_INVALID_MODULE_KEY)
    );
    return next(answer);
  }

  const existing = await Session.findOne({
    module: module._id,
    endDate: { $exists: false },
  }).exec();

  if (existing) {
    if (String(existing.user) === String(user._id)) {
      answer.setPayload({
        alreadyActive: true,
        sessionId: existing.sessionId,
        sessionMongoId: existing._id,
        moduleKey,
        startDate: existing.startDate,
        lastMeasureAt: existing.lastMeasureAt,
        lastHeartRateAt: existing.lastHeartRateAt,
      });
      return res.status(200).send(answer);
    }

    answer.set(
      SessionErrors.getError(SessionErrors.ERR_SESSION_ALREADY_ACTIVE)
    );
    return next(answer);
  }

  const sessionId = uuidv4();

  const session = new Session({
    sessionId,
    user: user._id,
    module: module._id,
    startDate: new Date(),
    lastMeasureAt: new Date(),
    lastHeartRateAt: null,
  });

  await session.save();

  try {
    const tcpResp = await tcpService.sendToCentralServer(
      `START_SESSION_FOR_MODULE ${moduleKey} ${sessionId}`
    );

    if (!tcpResp || tcpResp.startsWith("ERR")) {
      session.endDate = new Date();
      await session.save();

      answer.set({
        error: 999,
        status: 500,
        data: tcpResp || "TCP START FAILED",
      });
      return next(answer);
    }
  } catch (e) {
    session.endDate = new Date();
    await session.save();

    answer.set({
      error: 998,
      status: 503,
      data: "Central TCP unreachable",
    });
    return next(answer);
  }

  answer.setPayload({ sessionId });
  return res.status(201).send(answer);
};

const stop = async (req, res, next) => {
  answer.reset()

  const { moduleKey } = req.body
  if (!moduleKey) {
    answer.set(
      SessionErrors.getError(SessionErrors.ERR_SESSION_INVALID_REQUEST)
    )
    return next(answer)
  }

  const module = await Module.findOne({ key: moduleKey }).exec()
  if (!module) {
    answer.set(
      ModuleErrors.getError(ModuleErrors.ERR_MODULE_INVALID_MODULE_KEY)
    )
    return next(answer)
  }

  const session = await Session.findOne({
    module: module._id,
    endDate: { $exists: false },
  }).exec()

  if (!session) {
    answer.setPayload({ stopped: true, alreadyStopped: true })
    return res.status(200).send(answer)
  }

  let tcpResp
  try {
    tcpResp = await tcpService.sendToCentralServer(
      `STOP_SESSION_FOR_MODULE ${moduleKey}`
    )
  } catch (e) {
    answer.set({
      error: 998,
      status: 503,
      data: "Central TCP unreachable",
    })
    return next(answer)
  }

  if (!tcpResp || !tcpResp.startsWith("OK STOPPED")) {
    answer.set({
      error: 997,
      status: 502,
      data: tcpResp || "Invalid TCP response",
    })
    return next(answer)
  }

  const measures = await Measure.find({ session: session._id }).lean().exec()

  const stats = computeSessionStats(measures)

  session.stats = stats
  session.endDate = new Date()
  await session.save()
  
  await maybeRetrain()

  try {
    const ai = aiService.predictSession(session.sessionId)
    if (ai.ok && ai.global != null && session.stats?.score) {
      session.stats.score.global = ai.global
      session.stats.score.confidence = ai.confidence
      session.stats.aiExplain = ai.explain
      session.stats.aiModel = ai.model
      session.markModified('stats')
      await session.save()
    }
  } catch (e) {
    console.error(`[AI] Prediction failed for session ${session.sessionId}:`, e.message)
  }

  answer.setPayload({ stopped: true, sessionMongoId: session._id, sessionId: session.sessionId })
  return res.status(200).send(answer)
}

const active = async (req, res) => {
  answer.reset();

  const { sessionId } = req.body;
  if (!sessionId) {
    answer.setPayload({ active: false });
    return res.status(200).send(answer);
  }

  const session = await Session.findOne({
    sessionId,
    endDate: { $exists: false },
  }).exec();

  answer.setPayload({ active: !!session });
  return res.status(200).send(answer);
};

const activeForModule = async (req, res) => {
  answer.reset();

  const { moduleKey } = req.body;
  if (!moduleKey) {
    answer.setPayload({ active: false });
    return res.status(200).send(answer);
  }

  const module = await Module.findOne({ key: moduleKey }).exec();
  if (!module) {
    answer.setPayload({ active: false });
    return res.status(200).send(answer);
  }

  const session = await Session.findOne({
    module: module._id,
    endDate: { $exists: false },
  }).exec();

  if (!session) {
    answer.setPayload({ active: false });
    return res.status(200).send(answer);
  }

  answer.setPayload({
    active: true,
    sessionId: session.sessionId,
    sessionMongoId: session._id,
    moduleKey,
    startDate: session.startDate,
    lastMeasureAt: session.lastMeasureAt,
    lastHeartRateAt: session.lastHeartRateAt,
  });
  return res.status(200).send(answer);
};

const history = async (req, res, next) => {
  answer.reset()

  if (!req.user) {
    answer.set(SessionErrors.getError(SessionErrors.ERR_SESSION_NOT_AUTHORIZED))
    return next(answer)
  }

  const { _id, rights } = req.user
  let filter = { user: _id }

  if (rights.includes('admin')) {
    filter = {}
  } else if (rights.includes('coach')) {
    const User = require('../models/user.model')
    const athletes = await User.find({ coach: _id }, '_id').lean().exec()
    filter = { user: { $in: athletes.map((u) => u._id) } }
  }

  const sessions = await Session.find(filter)
    .populate('module', 'name uc key')
    .populate('user', 'login')
    .sort({ startDate: -1 })
    .lean()
    .exec()

  answer.setPayload(sessions)
  return res.status(200).send(answer)
}

module.exports = { start, stop, active, activeForModule, history };

