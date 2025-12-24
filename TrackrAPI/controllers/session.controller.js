const { v4: uuidv4 } = require('uuid');

const Session = require('../models/session.model');
const Module = require('../models/module.model');

const SessionErrors = require('../commons/session.errors');
const ModuleErrors = require('../commons/module.errors');

const { answer } = require('./ControllerAnswer');

/**
 * START SESSION
 */
const start = async function(req, res, next) {

    answer.reset();

    let user = req.user;
    let moduleKey = req.body.moduleKey;

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

    // check if a session is already active for this module
    let active = await Session.findOne({
        module: module._id,
        endDate: { $exists: false }
    }).exec();

    if (active) {
        answer.set(SessionErrors.getError(SessionErrors.ERR_SESSION_ALREADY_ACTIVE));
        return next(answer);
    }

    let sessionId = uuidv4();

    try {
        let s = new Session({
            sessionId,
            user: user._id,
            module: module._id,
        });
        await s.save();
    } catch (err) {
        answer.set(SessionErrors.getError(SessionErrors.ERR_SESSION_CANNOT_CREATE));
        return next(answer);
    }

    answer.setPayload({ sessionId });
    res.status(201).send(answer);
};

/**
 * STOP SESSION
 */
const stop = async function(req, res, next) {

    answer.reset();

    let sessionId = req.body.sessionId;
    if (!sessionId) {
        answer.set(SessionErrors.getError(SessionErrors.ERR_SESSION_INVALID_REQUEST));
        return next(answer);
    }

    let session;
    try {
        session = await Session.findOne({
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
 * CHECK SESSION ACTIVE (used by TCP server)
 */
const active = async function(req, res, next) {

    answer.reset();

    let sessionId = req.body.sessionId;
    if (!sessionId) {
        answer.set(SessionErrors.getError(SessionErrors.ERR_SESSION_INVALID_REQUEST));
        return next(answer);
    }

    let session;
    try {
        session = await Session.findOne({
            sessionId,
            endDate: { $exists: false }
        }).exec();

        if (!session) {
            answer.set(SessionErrors.getError(SessionErrors.ERR_SESSION_NOT_FOUND));
            return next(answer);
        }
    }
    catch (err) {
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
