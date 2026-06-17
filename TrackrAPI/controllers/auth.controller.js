/**
 * defines methods to manage jwt and authentication processes
 * @module AuthController
 */
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const Config = require("../commons/config");
const validator = require('validator');

const User = require('../models/user.model');

const UserErrors = require('../commons/user.errors');
const AuthErrors = require('../commons/auth.errors');

const Helpers = require('./helpers.controller');
const {answer} = require('./ControllerAnswer')

const ACCESS_TOKEN_TTL_MINUTES = Number(
  process.env.USER_ACCESS_TOKEN_TTL_MINUTES ||
  (Number(process.env.USER_SESSION_TTL_HOURS || 12) * 60)
)
const REFRESH_TOKEN_TTL_DAYS = Number(process.env.USER_REFRESH_TOKEN_TTL_DAYS || 7)

function buildAccessExpiry() {
  return new Date(Date.now() + ACCESS_TOKEN_TTL_MINUTES * 60 * 1000)
}

function buildRefreshExpiry() {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)
}

function issueTokens(user) {
  user.sessionId = uuidv4()
  user.sessionExpiresAt = buildAccessExpiry()
  user.refreshToken = uuidv4()
  user.refreshExpiresAt = buildRefreshExpiry()
}

function toAuthPayload(user) {
  const coachInfo = user.coach ? {
    _id: user.coach._id,
    login: user.coach.login,
    email: user.coach.email,
  } : null

  return {
    userId: user._id,
    login: user.login,
    coach: coachInfo,
    rights: user.rights,
    token: user.sessionId,
    expiresAt: user.sessionExpiresAt,
    refreshToken: user.refreshToken,
    refreshExpiresAt: user.refreshExpiresAt,
  }
}

/**
 * check correctness of name parameter (from req.body.name)
 * @param {String} name - the parameter to test
 * @returns {boolean} - false if name is not defined
 */
function checkLogin(name) {
  if ((name === undefined) || (!validator.isAlphanumeric(name,'fr-FR'))) {
    answer.set(AuthErrors.getError(AuthErrors.ERR_AUTH_LOGIN_NOT_DEFINED))
    return false;
  }
  return true;
}

/**
 * check correctness of lastName parameter (from req.body.lastName)
 * @param {String} password - the parameter to test
 * @returns {boolean} - false if password is not defined
 */
function checkPassword(password) {
  if (password === undefined) {
    answer.set(AuthErrors.getError(AuthErrors.ERR_AUTH_PASSWORD_NOT_DEFINED))
    return false;
  }
  return true;
}

/**
 * check user credentials
 * @param {Object} req - The request object (provided by express)
 * @param {Object} req.body - The data payload sent with the request
 * @param {string} req.body.login - The login of the user to sign in
 * @param {string} req.body.password - The password of the user to sign in
 * @param {Object} res - The result object used to send the result to the client (provided by express)
 * @param {Function} next - The next middleware to call after this one
 * @alias module:AuthController.signIn
 */
const signIn = async function (req, res, next) {
  answer.reset()

  console.log('sign in');

  // sanity check on parameters
  if ((!checkLogin(req.body.login)) ||
      (!checkPassword(req.body.password))) {
    return next(answer);
  }
  // check if name exists
  let user = null;
  try {
    user = await User.findOne({login:req.body.login})
      .populate('coach', '_id login email')
      .exec();
    if (user === null) {
      answer.set(UserErrors.getError(UserErrors.ERR_USER_CANNOT_FIND_LOGIN))
      return next(answer);
    }
  }
  catch(err) {
    answer.set(UserErrors.getError(UserErrors.ERR_USER_INVALID_FIND_LOGIN_REQUEST))
    return next(answer);
  }
  let passValid = bcrypt.compareSync(req.body.password, user.password);
  if (!passValid) {
    answer.set(AuthErrors.getError(AuthErrors.ERR_AUTH_PASSWORD_NO_MATCH))
    return next(answer);
  }

  issueTokens(user)
  try {
    user = await user.save()
  }
  catch(err) {
    answer.set(UserErrors.getError(UserErrors.ERR_USER_CANNOT_UPDATE))
    return next(answer)
  }

  answer.setPayload(toAuthPayload(user))

  res.status(200).send(answer);
};

const verifyToken = async function (req, res, next) {

  answer.reset()

  // suppose that the session id is in the request headers
  let id = req.headers["x-session-id"];
  // first check if xsrf token exists, and if not it is assumed that no login was sucessful
  if (!id) {
    answer.set(AuthErrors.getError(AuthErrors.ERR_AUTH_NO_TOKEN));
    return next(answer);
  }
  // now find if user in in DB and bind it the req
  try {
    let user = await User.findOne({sessionId: id})
      .populate('coach', '_id login email')
      .exec()
    if (user === null) {
      answer.set (AuthErrors.getError(AuthErrors.ERR_AUTH_NOT_AUTHORIZED));
      return next(answer);
    }
    if (user.sessionExpiresAt && user.sessionExpiresAt.getTime() < Date.now()) {
      user.sessionId = undefined
      user.sessionExpiresAt = undefined
      await user.save()
      answer.set(AuthErrors.getError(AuthErrors.ERR_AUTH_NOT_AUTHORIZED))
      return next(answer)
    }
    req.user = user;
  }
  catch(err) {
    answer.set (AuthErrors.getError(AuthErrors.ERR_AUTH_NOT_AUTHORIZED));
    return next(answer);
  }
  return next();

}

const logout = async function (req, res, next) {
  answer.reset()

  req.user.sessionId = undefined
  req.user.sessionExpiresAt = undefined
  req.user.refreshToken = undefined
  req.user.refreshExpiresAt = undefined
  await req.user.save()

  answer.setPayload({ loggedOut: true })
  return res.status(200).send(answer)
}

const me = async function (req, res) {
  answer.reset()
  answer.setPayload(toAuthPayload(req.user))
  return res.status(200).send(answer)
}

const refresh = async function (req, res, next) {
  answer.reset()

  const token = req.body?.refreshToken || req.headers["x-refresh-token"]
  if (!token) {
    answer.set(AuthErrors.getError(AuthErrors.ERR_AUTH_NO_TOKEN))
    return next(answer)
  }

  let user
  try {
    user = await User.findOne({ refreshToken: token })
      .populate('coach', '_id login email')
      .exec()
  } catch (_) {
    answer.set(AuthErrors.getError(AuthErrors.ERR_AUTH_NOT_AUTHORIZED))
    return next(answer)
  }

  if (!user || !user.refreshExpiresAt || user.refreshExpiresAt.getTime() < Date.now()) {
    if (user) {
      user.sessionId = undefined
      user.sessionExpiresAt = undefined
      user.refreshToken = undefined
      user.refreshExpiresAt = undefined
      await user.save()
    }
    answer.set(AuthErrors.getError(AuthErrors.ERR_AUTH_NOT_AUTHORIZED))
    return next(answer)
  }

  issueTokens(user)
  await user.save()

  answer.setPayload(toAuthPayload(user))
  return res.status(200).send(answer)
}

const verifyServiceSecret = async function (req, res, next) {
  answer.reset()

  const expected = process.env.SERVICE_SECRET
  if (!expected) {
    return next()
  }

  const provided = req.headers["x-service-secret"]
  if (provided && provided === expected) {
    return next()
  }

  answer.set(AuthErrors.getError(AuthErrors.ERR_AUTH_NOT_AUTHORIZED))
  return next(answer)
}

/**
 * checks if the current user (get from a valid token) is admin
 * @param {Object} req - The request object (provided by express)
 * @param {String} req.user - The user object (filled by verifyToken)
 * @param {Object} res - The result object used to send the result to the client (provided by express)
 * @param {Function} next - The next middleware to call after this one
 */
const onlyAdmin = async function(req, res, next) {
  answer.reset()
  if (!req.user) {
    console.log("onlyAdmin(): no user found in req");
    answer.set(AuthErrors.getError(AuthErrors.ERR_AUTH_NOT_AUTHORIZED))
    return next(answer);
  }
  if (req.user.rights.includes("admin")) {
    return next();
  }
  answer.set(AuthErrors.getError(AuthErrors.ERR_AUTH_INVALID_RIGHT))
  return next(answer);
};

const onlyAdminOrCoach = async function(req, res, next) {
  answer.reset()
  if (req.user?.rights?.some((right) => right === "admin" || right === "coach")) {
    return next();
  }
  answer.set(AuthErrors.getError(AuthErrors.ERR_AUTH_INVALID_RIGHT))
  return next(answer);
};

module.exports = {
  verifyToken,
  verifyServiceSecret,
  onlyAdmin,
  onlyAdminOrCoach,
  signIn,
  logout,
  me,
  refresh,
};
