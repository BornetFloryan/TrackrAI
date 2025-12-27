const { v4: uuidv4 } = require('uuid');

const Session = require('../models/session.model');
const Module = require('../models/module.model');

const SessionErrors = require('../commons/session.errors');
const ModuleErrors = require('../commons/module.errors');

const { answer } = require('./ControllerAnswer');
const tcpService = require('../services/tcp.service');

/**
 * START SESSION - appelé par le FRONT
 */
const start = async function (req, res, next) {
  answer.reset();

  const user = req.user;
  const moduleKey = req.body.moduleKey;

  if (!moduleKey) {
    answer.set(SessionErrors.getError(SessionErrors.ERR_SESSION_INVALID_REQUEST));
    return next(answer);
  }

  // vérifier module
  let module;
  try {
    module = await Module.findOne({ key: moduleKey }).exec();
    if (!module) {
      answer.set(ModuleErrors.getError(ModuleErrors.ERR_MODULE_INVALID_MODULE_KEY));
      return next(answer);
    }
  } catch (err) {
    answer.set(ModuleErrors.getError(ModuleErrors.ERR_MODULE_INVALID_FIND_MODULE_REQUEST));
    return next(answer);
  }

  // refuser si session déjà active pour ce module
  const active = await Session.findOne({
    module: module._id,
    endDate: { $exists: false },
  }).exec();

  if (active) {
    answer.set(SessionErrors.getError(SessionErrors.ERR_SESSION_ALREADY_ACTIVE));
    return next(answer);
  }

  const sessionId = uuidv4();

  // créer session Mongo
  try {
    const s = new Session({
      sessionId,
      user: user._id,
      module: module._id,
    });
    await s.save();
  } catch (err) {
    answer.set(SessionErrors.getError(SessionErrors.ERR_SESSION_CANNOT_CREATE));
    return next(answer);
  }

  // notifier le serveur TCP Java
  try {
    const tcpResp = await tcpService.sendToCentralServer(
      `START_SESSION_FOR_MODULE ${moduleKey} ${sessionId}`
    );
    console.log('TCP response:', tcpResp);

    // optionnel : si tu veux vérifier la réponse
    // si le serveur répond "ERR ..." tu peux annuler la session Mongo
    if (typeof tcpResp === 'string' && tcpResp.startsWith('ERR')) {
      // rollback session Mongo
      await Session.updateOne(
        { sessionId },
        { $set: { endDate: new Date() } }
      ).exec();

      answer.set({ error: 999, status: 500, data: tcpResp });
      return next(answer);
    }
  } catch (err) {
    // ICI tu choisis : bloquant ou non.
    // Pour éviter une session "active" sans démarrage module => on bloque
    await Session.updateOne(
      { sessionId },
      { $set: { endDate: new Date() } }
    ).exec();

    answer.set({ error: 999, status: 500, data: 'Impossible de contacter le serveur central' });
    return next(answer);
  }

  answer.setPayload({ sessionId });
  return res.status(201).send(answer);
};

/**
 * STOP SESSION - appelé par le FRONT
 * Le serveur TCP attend un moduleKey => on stop au moduleKey.
 */
const stop = async function (req, res, next) {
  answer.reset();

  const moduleKey = req.body.moduleKey;
  if (!moduleKey) {
    answer.set(SessionErrors.getError(SessionErrors.ERR_SESSION_INVALID_REQUEST));
    return next(answer);
  }

  // vérifier module
  let module;
  try {
    module = await Module.findOne({ key: moduleKey }).exec();
    if (!module) {
      answer.set(ModuleErrors.getError(ModuleErrors.ERR_MODULE_INVALID_MODULE_KEY));
      return next(answer);
    }
  } catch (err) {
    answer.set(ModuleErrors.getError(ModuleErrors.ERR_MODULE_INVALID_FIND_MODULE_REQUEST));
    return next(answer);
  }

  // récupérer la session active pour ce module
  let session;
  try {
    session = await Session.findOne({
      module: module._id,
      endDate: { $exists: false },
    }).exec();

    if (!session) {
      answer.set(SessionErrors.getError(SessionErrors.ERR_SESSION_NOT_FOUND));
      return next(answer);
    }
  } catch (err) {
    answer.set(SessionErrors.getError(SessionErrors.ERR_SESSION_NOT_FOUND));
    return next(answer);
  }

  // notifier le serveur TCP Java (bloquant pour éviter que l’ESP continue)
  try {
    const tcpResp = await tcpService.sendToCentralServer(
      `STOP_SESSION_FOR_MODULE ${moduleKey}`
    );

    if (typeof tcpResp === 'string' && tcpResp.startsWith('ERR')) {
      answer.set({ error: 999, status: 500, data: tcpResp });
      return next(answer);
    }
  } catch (err) {
    answer.set({ error: 999, status: 500, data: 'Impossible de contacter le serveur central' });
    return next(answer);
  }

  // fermer la session Mongo
  session.endDate = new Date();
  try {
    await session.save();
  } catch (err) {
    answer.set(SessionErrors.getError(SessionErrors.ERR_SESSION_CANNOT_CLOSE));
    return next(answer);
  }

  return res.status(200).send(answer);
};

/**
 * CHECK SESSION ACTIVE - utilisé par le serveur TCP Java
 * (il envoie sessionId)
 */
const active = async function (req, res, next) {
  answer.reset();

  const sessionId = req.body.sessionId;
  if (!sessionId) {
    answer.set(SessionErrors.getError(SessionErrors.ERR_SESSION_INVALID_REQUEST));
    return next(answer);
  }

  try {
    const session = await Session.findOne({
      sessionId,
      endDate: { $exists: false },
    }).exec();

    if (!session) {
      answer.set(SessionErrors.getError(SessionErrors.ERR_SESSION_NOT_FOUND));
      return next(answer);
    }
  } catch (err) {
    answer.set(SessionErrors.getError(SessionErrors.ERR_SESSION_NOT_FOUND));
    return next(answer);
  }

  return res.status(200).send(answer);
};

/**
 * ACTIVE FOR MODULE - utilisé par le FRONT (reprise après refresh)
 */
const activeForModule = async function (req, res, next) {
  answer.reset();

  const moduleKey = req.body.moduleKey;
  if (!moduleKey) {
    answer.set(SessionErrors.getError(SessionErrors.ERR_SESSION_INVALID_REQUEST));
    return next(answer);
  }

  let module;
  try {
    module = await Module.findOne({ key: moduleKey }).exec();
    if (!module) {
      answer.set(ModuleErrors.getError(ModuleErrors.ERR_MODULE_INVALID_MODULE_KEY));
      return next(answer);
    }
  } catch (err) {
    answer.set(ModuleErrors.getError(ModuleErrors.ERR_MODULE_INVALID_FIND_MODULE_REQUEST));
    return next(answer);
  }

  const session = await Session.findOne({
    module: module._id,
    endDate: { $exists: false },
  }).exec();

  if (!session) {
    answer.setPayload({ active: false });
    return res.status(200).send(answer);
  }

  answer.setPayload({ active: true, sessionId: session.sessionId });
  return res.status(200).send(answer);
};

/**
 * HISTORIQUE DES SESSIONS
 * - admin : toutes les sessions
 * - autres : uniquement celles du user connecté
 */
const history = async function (req, res, next) {
  answer.reset()

  if (!req.user) {
    answer.set(SessionErrors.getError(SessionErrors.ERR_SESSION_NOT_AUTHORIZED))
    return next(answer)
  }

  const user = req.user
  const isAdmin = user.rights.includes('admin')
  const isCoach = user.rights.includes('coach')

  const filter = {}
  if (!isAdmin && !isCoach) {
    filter.user = user._id
  }

  try {
    const sessions = await Session.find(filter)
      .populate({
        path: 'module',
        select: 'name uc key',
        options: { strictPopulate: false },
      })
      .populate({
        path: 'user',
        select: 'login',
        options: { strictPopulate: false },
      })
      .sort({ startDate: -1 })
      .lean()
      .exec()

    answer.setPayload(sessions)
    return res.status(200).send(answer)
  } catch (err) {
    console.error('SESSION HISTORY ERROR:', err)
    answer.set(SessionErrors.getError(SessionErrors.ERR_SESSION_INVALID_FIND_REQUEST))
    return next(answer)
  }
}


module.exports = {
  start,
  stop,
  active,
  activeForModule,
  history,
};
