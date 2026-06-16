/**
 * defines methods to interact with User documents
 * @module UserController
 */

const User = require('../models/user.model');
const UserErrors = require('../commons/user.errors');
const Config = require('../commons/config');

const Helpers = require('./helpers.controller');
const validator = require('validator');

const bcrypt = require('bcryptjs');
const SALT_WORK_FACTOR = 10;

const {answer} = require('./ControllerAnswer')


/* ************************************************
   functions to test parameters taken from req.body
   WARNING: some tests (on string length, values, ...)
   are already done at the mongodb level
 *********************************************** */
/**
 * check correctness of firstName parameter (from req.body.name)
 * @param {String} login - the parameter to test
 * @returns {boolean} - false if name is not defined
 */
function checkLogin(login) {
  if ((login === undefined) || (!validator.isAlphanumeric(login,'fr-FR',{ignore:'-_'})) ) {
    answer.set(UserErrors.getError(UserErrors.ERR_USER_LOGIN_NOT_DEFINED))
    return false;
  }
  return true;
}

/**
 * check correctness of password (from req.body.password)
 * @param {String} password - the parameter to test
 * @returns {boolean} - false if password is not defined
 */
function checkPassword(password) {
  if (password === undefined) {
    answer.set(UserErrors.getError(UserErrors.ERR_USER_PASSWORD_NOT_DEFINED))
    return false;
  }
  return true;
}

/**
 * check correctness of rights parameter (from req.body.rights) which must be an id
 * @param {Array} rights - the parameter to test
 * @returns {boolean} - false if rights is not defined
 */
function checkRights(rights) {
  if ((rights === undefined) || (!Array.isArray(rights))) {
    answer.set(UserErrors.getError(UserErrors.ERR_USER_RIGHTS_NOT_DEFINED))
    return false;
  }
  let ok = true
  let valid = Config.rights
  rights.forEach(r => {
    if (!valid.includes(r)) ok = false
  })
  if (!ok) {
    answer.set(UserErrors.getError(UserErrors.ERR_USER_RIGHTS_NOT_DEFINED))
    return false;
  }
  return true
}

/**
 * check existence of token
 * @param {String} token - the parameter to test
 * @returns {boolean} - false if password is not defined
 */
function checkCaptchaToken(token) {
  if (token === undefined) {
    answer.set(UserErrors.getError(UserErrors.ERR_USER_CAPTCHATOKEN_NOT_DEFINED))
    return false;
  }
  return true;
}

/**
 * check correctness of email parameter (from req.body.email)
 * @param {String} email - the parameter to test
 * @returns {boolean} - false if name is not defined
 */
function checkEmail(email) {
  if ((email === undefined) || (!validator.isEmail(email)) ) {
    answer.set(UserErrors.getError(UserErrors.ERR_USER_EMAIL_NOT_DEFINED))
    return false;
  }
  return true;
}

/**
 * check correctness of data parameter (from req.body.data)
 * @param {String} data - the parameter to test
 * @returns {boolean} - false if data is not defined
 */
function checkData(data) {
  if (data === undefined) {
    answer.set(UserErrors.getError(UserErrors.ERR_USER_DATA_NOT_DEFINED))
    return false;
  }
  return true;
}



/**
 * create a user (only possible for admin)
 * This function checks if there are already user's with the same name
 * If it's the case, it returns an error.
 * @param {Object} req - The request object (provided by express)
 * @param {Object} req.body - The data payload sent with the request
 * @param {string} req.body.login - The first name of the user to create
 * @param {string} req.body.password - The password of the user to create
 * @param {string} req.body.email - The email of the user to create
 * @param {Array} req.body.rights - The array of rights
 * @param {Object} res - The result object used to send the result to the client (provided by express)
 * @param {Function} next - The next middleware to call
 * @alias module:UserController.create
 */
const create = async function (req, res, next) {

  answer.reset()
  // sanity check on parameters
  if ((!checkLogin(req.body.login)) ||
    (!checkEmail(req.body.email)) ||
    (!checkRights(req.body.rights)) ||
    (!checkPassword(req.body.password))) {
    return next(answer);
  }

  // check if name does not already exists
  try {
    let user = await User.findOne({login:req.body.login}).exec();
    if (user !== null) {
      answer.set(UserErrors.getError(UserErrors.ERR_USER_CREATE_ALREADY_LOGIN))
      return next(answer);
    }
  }
  catch(err) {
    answer.set(UserErrors.getError(UserErrors.ERR_USER_INVALID_FIND_LOGIN_REQUEST))
    return next(answer);
  }

  // first encrypt password
  let password = '';
  try {
    const salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
    password = await bcrypt.hash(req.body.password, salt);
  } catch (err) {
    answer.set(UserErrors.getError(UserErrors.ERR_USER_CANNOT_ENCRYPT_PASSWORD))
    return next(answer);
  }
  let u = {
    login: req.body.login,
    password: password,
    rights: req.body.rights,
    email: req.body.email,
  };

  if (req.body.coach) {
    u.coach = req.body.coach;
  }

  User.create(u, async function(err, user) {
    if (err) {
      answer.set(UserErrors.getError(UserErrors.ERR_USER_INVALID_CREATE_REQUEST))
      answer.data = answer.data + '\n' + err;
      return next(answer);
    }
    if (user === null) {
      answer.set(UserErrors.getError(UserErrors.ERR_USER_CANNOT_CREATE))
      return next(answer);
    }
    else {
      answer.data = {
        _id: user._id,
        login: user.login,
        email: user.email,
        rights: user.rights,
        coach: user.coach,
      };
      res.status(201).send(answer);
    }
  });
};

/**
 * update a user
 * @param {Object} req - The request object (provided by express)
 * @param {Object} req.body - The data payload sent with the request
 * @param {Object} req.body.idUser - The _id of the project document for which we create a root element
 * @param {string} req.body.data - The data to update (normally containing all fields)
 * @param {Object} res - The result object used to send the result to the client (provided by express)
 * @param {Function} next - The next middleware to call after this one
 * @alias module:UserController.update
 */
const update = async function (req, res, next) {
  answer.reset()
  const { idUser, data } = req.body

  if (!idUser || !checkData(data) || typeof data !== 'object' || Array.isArray(data)) {
    return next(answer);
  }

  let user = null
  try {
    user = await User.findOne({_id:idUser}).exec();
    if (user === null) {
      answer.set(UserErrors.getError(UserErrors.ERR_USER_CANNOT_FIND_ID))
      return next(answer);
    }
  }
  catch(err) {
    answer.set(UserErrors.getError(UserErrors.ERR_USER_INVALID_FIND_ID_REQUEST))
    return next(answer);
  }

  // if no password is given, keep the current one, otherwise encrypt the new one.
  const allowedFields = ['login', 'email', 'rights', 'password', 'coach']
  const updates = Object.fromEntries(
    Object.entries(data).filter(([key]) => allowedFields.includes(key))
  )

  if (updates.login !== undefined && !checkLogin(updates.login)) return next(answer)
  if (updates.email !== undefined && !checkEmail(updates.email)) return next(answer)
  if (updates.rights !== undefined && !checkRights(updates.rights)) return next(answer)

  if (updates.password) {
    let password = '';
    try {
      const salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
      password = await bcrypt.hash(updates.password, salt);
    } catch (err) {
      answer.set(UserErrors.getError(UserErrors.ERR_USER_CANNOT_ENCRYPT_PASSWORD))
      return next(answer);
    }
    updates.password = password;
  } else {
    delete updates.password
  }

  try {
    user.set(updates);
  }
  catch(err) {
    console.log("error while updating whole user");
    answer.set(UserErrors.getError(UserErrors.ERR_USER_CANNOT_UPDATE))
    return next(answer);
  }

  user.save(async function (err) {
    if (err) {
      answer.set(UserErrors.getError(UserErrors.ERR_USER_CANNOT_UPDATE))
      return next(answer);
    }
    answer.data = {
      _id: user._id,
      login: user.login,
      email: user.email,
      rights: user.rights,
      coach: user.coach,
    };
    res.status(200).send(answer);
  });
};

/**
 * get all users
 * @param {Object} req - The request object (provided by express)
 * @param {Object} res - The result object used to send the result to the client (provided by express)
 * @param {Function} next - The next middleware to call after this one
 */
const getUsers = async function (req, res, next) {
  answer.reset()
  console.log('get users');
  let users = null
  try {
    const filter = req.user.rights.includes('admin')
      ? {}
      : {
          $or: [
            { _id: req.user._id },
            { rights: 'basic' },
          ],
        };

    users = await User.find(filter, '_id login email rights coach')
      .populate('coach', '_id login')
      .exec();
  }
  catch(err) {
    answer.set(UserErrors.getError(UserErrors.ERR_USER_INVALID_FIND_USERS_REQUEST))
    return next(answer);
  }
  // sends back all users
  answer.data = users;
  res.status(200).send(answer);
};


module.exports = {
  create,
  update,
  getUsers,
}
