const { v4: uuidv4 } = require('uuid');

const Session = require('../models/session.model');
const Module = require('../models/module.model');

const SessionErrors = require('../commons/session.errors');
const ModuleErrors = require('../commons/module.errors');

const { answer } = require('./ControllerAnswer');
const tcpService = require('../services/tcp.service');

/**
 * START SESSION
 * Appelé par le FRONT
 */
const start = async function (req, res, next) {
    answer.reset();

    const user = req.user;
    const moduleKey = req.body.moduleKey;

    if (!moduleKey) {
        answer.set(SessionErrors.getError(SessionErrors.ERR_SESSION_INVALID_REQUEST));
        return next(answer);
    }

    // vérifier le module
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

    // refuser si session déjà active
    const active = await Session.findOne({
        module: module._id,
        endDate: { $exists: false }
    }).exec();

    if (active) {
        answer.set(SessionErrors.getError(SessionErrors.ERR_SESSION_ALREADY_ACTIVE));
        return next(answer);
    }

    const sessionId = uuidv4();

    try {
        const s = new Session({
            sessionId,
            user: user._id,
            module: module._id
        });
        await s.save();
    } catch (err) {
        answer.set(SessionErrors.getError(SessionErrors.ERR_SESSION_CANNOT_CREATE));
        return next(answer);
    }

    // NOTIFICATION TCP AU SERVEUR CENTRAL
    try {
        await tcpService.sendToCentralServer(
            `START_SESSION_FOR_MODULE ${moduleKey} ${sessionId}`
        );
    } catch (err) {
        console.error('[TCP] START_SESSION_FOR_MODULE failed:', err.message);
        // volontairement NON bloquant
    }

    answer.setPayload({ sessionId });
    res.status(201).send(answer);
};

/**
 * STOP SESSION
 * Appelé par le FRONT
 */
const stop = async function (req, res, next) {
    console.log('STOP session controller');
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

    let session;
    try {
        session = await Session.findOne({
            module: module._id,
            endDate: { $exists: false }
        }).exec();

        if (!session) {
            answer.set(SessionErrors.getError(SessionErrors.ERR_SESSION_NOT_FOUND));
            return next(answer);
        }
    } catch (err) {
        answer.set(SessionErrors.getError(SessionErrors.ERR_SESSION_NOT_FOUND));
        return next(answer);
    }

    try {
        await tcpService.sendToCentralServer(
            `STOP_SESSION_FOR_MODULE ${moduleKey}`
        );
    } catch (err) {
        console.error('[TCP] STOP_SESSION_FOR_MODULE failed:', err.message);
        answer.set({
            error: 999,
            status: 500,
            data: 'Impossible de contacter le serveur central'
        });
        return next(answer);
    }

    // 4️⃣ fermer la session Mongo
    session.endDate = new Date();
    try {
        await session.save();
    } catch (err) {
        answer.set(SessionErrors.getError(SessionErrors.ERR_SESSION_CANNOT_CLOSE));
        return next(answer);
    }

    res.status(200).send(answer);
};

/**
 * CHECK SESSION ACTIVE
 * utilisé par le serveur TCP Java
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
            endDate: { $exists: false }
        }).exec();

        if (!session) {
            answer.set(SessionErrors.getError(SessionErrors.ERR_SESSION_NOT_FOUND));
            return next(answer);
        }
    } catch (err) {
        answer.set(SessionErrors.getError(SessionErrors.ERR_SESSION_NOT_FOUND));
        return next(answer);
    }

    res.status(200).send(answer);
};

module.exports = {
    start,
    stop,
    active
};
