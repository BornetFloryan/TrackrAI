/**
 * defines methods to interact with Measure documents
 * @module MeasureController
 */

const Measure = require("../models/measure.model");
const Module = require("../models/module.model");
const User = require("../models/user.model");
const MeasureErrors = require("../commons/measure.errors");
const ModuleErrors = require("../commons/module.errors");

const Config = require("../commons/config");

const validator = require("validator");

const { answer } = require("./ControllerAnswer");

const Session = require("../models/session.model");
const SessionErrors = require("../commons/session.errors");

/* ************************************************
   functions to test parameters taken from req.body
   WARNING: some tests (on string length, values, ...)
   are already done at the mongodb level
 *********************************************** */
function checkType(type) {
  if (
    type === undefined ||
    !validator.isAlphanumeric(type, "fr-FR", { ignore: "-_" })
  ) {
    answer.set(
      MeasureErrors.getError(MeasureErrors.ERR_MEASURE_TYPE_NOT_DEFINED)
    );
    return false;
  }
  return true;
}

function checkDate(date) {
  if (date === undefined) {
    answer.set(
      MeasureErrors.getError(MeasureErrors.ERR_MEASURE_DATE_NOT_DEFINED)
    );
    return false;
  }
  return true;
}

function checkValue(value) {
  const normalized = value === undefined || value === null ? undefined : String(value);
  if (
    normalized === undefined ||
    !validator.isAlphanumeric(normalized, "fr-FR", { ignore: ".-_" })
  ) {
    answer.set(
      MeasureErrors.getError(MeasureErrors.ERR_MEASURE_VALUE_NOT_DEFINED)
    );
    return false;
  }
  return true;
}

function checkData(data) {
  if (data === undefined) {
    answer.set(
      MeasureErrors.getError(MeasureErrors.ERR_MEASURE_DATA_NOT_DEFINED)
    );
    return false;
  }
  return true;
}

/**
 * create a measure
 * @param {Object} req - The request object (provided by express)
 * @param {Object} req.body - The data payload sent with the request
 * @param {string} req.body.type - The type of measure
 * @param {Date} req.body.date - The timestamp
 * @param {string} req.body.value - The value measured
 * @param {string} req.body.sessionId - The session UUID (mandatory)
 * @param {Function} next - The next middleware to call
 * @alias module:MeasureController.create
 */
const create = async function (req, res, next) {
  answer.reset();

  if (
    !checkType(req.body.type) ||
    !checkDate(req.body.date) ||
    !checkValue(req.body.value)
  ) {
    return next(answer);
  }

  const sessionId = req.body.sessionId;
  if (!sessionId) {
    answer.setPayload({ ignored: true });
    return res.status(200).send(answer);
  }

  let session;
  try {
    session = await Session.findOne({
      sessionId,
      endDate: { $exists: false },
    }).exec();

    if (!session) {
      answer.setPayload({ ignored: true });
      return res.status(200).send(answer);
    }
  } catch (_) {
    answer.setPayload({ ignored: true });
    return res.status(200).send(answer);
  }

  const m = {
    type: req.body.type,
    date: req.body.date,
    value: String(req.body.value),
    module: session.module,
    session: session._id,
  };

  console.log("create measure", m);

  Measure.create(m, async function (err, measure) {
    if (err) {
      answer.set(
        MeasureErrors.getError(MeasureErrors.ERR_MEASURE_INVALID_CREATE_REQUEST)
      );
      return next(answer);
    }

    await Session.updateOne(
      { _id: session._id },
      { $set: { lastMeasureAt: new Date() } }
    ).exec();

    answer.data = measure;
    return res.status(201).send(answer);
  });
};

/**
 * update a measure
 * @param {Object} req - The request object (provided by express)
 * @param {Object} req.body - The data payload sent with the request
 * @param {Object} req.body.idMeasure - The _id of the project document for which we create a root element
 * @param {string} req.body.data - The data to update (normally containing all fields)
 * @param {Object} res - The result object used to send the result to the client (provided by express)
 * @param {Function} next - The next middleware to call after this one
 * @alias module:MeasureController.update
 */
const update = async function (req, res, next) {
  answer.reset();
  const { idMeasure, data } = req.body;

  if (!idMeasure || !checkData(data) || typeof data !== "object" || Array.isArray(data)) {
    return next(answer);
  }

  let measure = null;

  try {
    measure = await Measure.findOne({ _id: idMeasure }).exec();
    if (measure === null) {
      answer.set(
        MeasureErrors.getError(MeasureErrors.ERR_MEASURE_CANNOT_FIND_ID)
      );
      return next(answer);
    }
  } catch (err) {
    answer.set(
      MeasureErrors.getError(MeasureErrors.ERR_MEASURE_INVALID_FIND_ID_REQUEST)
    );
    return next(answer);
  }

  const allowedFields = ["type", "date", "value"];
  const updates = Object.fromEntries(
    Object.entries(data).filter(([key]) => allowedFields.includes(key))
  );

  if (updates.type !== undefined && !checkType(updates.type)) return next(answer);
  if (updates.date !== undefined && !checkDate(updates.date)) return next(answer);
  if (updates.value !== undefined) {
    if (!checkValue(updates.value)) return next(answer);
    updates.value = String(updates.value);
  }

  try {
    measure.set(updates);
  } catch (err) {
    console.log("error while updating whole measure");
    answer.set(MeasureErrors.getError(MeasureErrors.ERR_MEASURE_CANNOT_UPDATE));
    return next(answer);
  }

  measure.save(function (err) {
    if (err) {
      answer.set(
        MeasureErrors.getError(MeasureErrors.ERR_MEASURE_CANNOT_UPDATE)
      );
      return next(answer);
    }

    // sends back the whole measure
    answer.data = measure;
    res.status(200).send(answer);
  });
};

/**
 * get all measures from a module
 * @param {Object} req - The request object (provided by express)
 * @param {Object} [res.query] - the query parameters
 * @param {String} [req.query.key] - The key of the module
 * @param {String} [req.query.type] - The type of measure
 * @param {String} [req.query.after] - The minimal date
 * @param {String} [req.query.until] - The maximal date
 * @param {Function} next - The next middleware to call after this one
 */
const getMeasures = async function (req, res, next) {
  answer.reset();

  let filter = {};
  let module = null;

  if (req.user.rights.includes("admin")) {
    // administrators can inspect every measure
  } else if (req.user.rights.includes("coach")) {
    const athletes = await User.find({ coach: req.user._id }, "_id").lean().exec();
    const sessions = await Session.find(
      { user: { $in: athletes.map((athlete) => athlete._id) } },
      "_id"
    ).lean().exec();
    filter.session = { $in: sessions.map((session) => session._id) };
  } else {
    const sessions = await Session.find({ user: req.user._id }, "_id").lean().exec();
    filter.session = { $in: sessions.map((session) => session._id) };
  }

  // if key is provided
  if (req.query.key) {
    try {
      module = await Module.findOne({ key: req.query.key }).exec();
      if (module === null) {
        answer.set(
          ModuleErrors.getError(ModuleErrors.ERR_MODULE_INVALID_MODULE_KEY)
        );
        return next(answer);
      }
      filter.module = module._id;
    } catch (err) {
      answer.set(
        ModuleErrors.getError(
          ModuleErrors.ERR_MODULE_INVALID_FIND_MODULE_REQUEST
        )
      );
      return next(answer);
    }
  }

  if (req.query.type) {
    filter.type = req.query.type;
  }

  let date = {};
  if (req.query.after) {
    date.$gte = req.query.after;
  }
  if (req.query.until) {
    date.$lte = req.query.until;
  }
  if (date.$gte || date.$lte) {
    filter.date = date;
  }

  console.log("get measures");
  let measures = null;

  try {
    measures = await Measure.find(filter).exec();
  } catch (err) {
    answer.set(
      MeasureErrors.getError(MeasureErrors.ERR_MEASURE_INVALID_FIND_REQUEST)
    );
    return next(answer);
  }

  // sends back all measures
  answer.data = measures;
  res.status(200).send(answer);
};

const getAnalysisById = async function (req, res, next) {
  answer.reset();

  const { analysisId } = req.params;
  if (!analysisId) {
    return res.status(400).send(answer);
  }

  let measure;
  try {
    measure = await Measure.findOne({ analysisId }).exec();
  } catch (err) {
    return next(answer);
  }

  if (!measure) {
    return res.status(404).send(answer);
  }

  let parsed;
  try {
    const jsonStr = Buffer.from(measure.value, "base64").toString("utf-8");
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    parsed = null;
  }

  if (!req.user.rights.includes("admin") && !req.user.rights.includes("coach")) {
    const owner = parsed?.userId;
    const isOwner = owner && (
      String(owner) === String(req.user._id) ||
      String(owner) === String(req.user.login)
    );

    if (!isOwner) {
      return res.status(404).send(answer);
    }
  } else if (req.user.rights.includes("coach") && !req.user.rights.includes("admin")) {
    const athletes = await User.find({ coach: req.user._id }, "_id login").lean().exec();
    const allowedOwners = new Set(
      athletes.flatMap((athlete) => [String(athlete._id), String(athlete.login)])
    );

    const owner = parsed?.userId;
    if (!owner || !allowedOwners.has(String(owner))) {
      return res.status(404).send(answer);
    }
  }

  answer.data = {
    analysisId: measure.analysisId,
    type: measure.type,
    date: measure.date,
    result: parsed,
  };

  return res.status(200).send(answer);
};

function parseStoredAnalysis(measure) {
  let parsed = null;
  try {
    const jsonStr = Buffer.from(measure.value, "base64").toString("utf-8");
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    parsed = null;
  }

  return {
    analysisId: measure.analysisId,
    type: measure.type,
    date: measure.date,
    result: parsed,
  };
}

const getAnalyses = async function (req, res, next) {
  answer.reset();

  const limit = Math.min(Number(req.query.limit || 50), 100);

  let measures;
  try {
    measures = await Measure.find({ analysisId: { $exists: true, $ne: null } })
      .sort({ date: -1 })
      .limit(req.user.rights.includes("admin") ? limit : 500)
      .lean()
      .exec();
  } catch (err) {
    answer.set(
      MeasureErrors.getError(MeasureErrors.ERR_MEASURE_INVALID_FIND_REQUEST)
    );
    return next(answer);
  }

  let analyses = measures.map(parseStoredAnalysis);

  if (!req.user.rights.includes("admin") && !req.user.rights.includes("coach")) {
    const currentUserId = String(req.user._id);
    analyses = analyses.filter((analysis) => {
      const owner = analysis.result?.userId;
      return owner && (
        String(owner) === currentUserId ||
        String(owner) === String(req.user.login)
      );
    });
  } else if (req.user.rights.includes("coach") && !req.user.rights.includes("admin")) {
    const athletes = await User.find({ coach: req.user._id }, "_id login").lean().exec();
    const allowedOwners = new Set(
      athletes.flatMap((athlete) => [String(athlete._id), String(athlete.login)])
    );

    analyses = analyses.filter((analysis) => {
      const owner = analysis.result?.userId;
      return owner && allowedOwners.has(String(owner));
    });
  }

  answer.setPayload(analyses.slice(0, limit));
  return res.status(200).send(answer);
};

module.exports = {
  create,
  update,
  getMeasures,
  getAnalyses,
  getAnalysisById,
};
