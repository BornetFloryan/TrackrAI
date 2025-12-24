const mongoose = require('mongoose');
const SessionSchema = require('./session.schema');

module.exports = mongoose.model('Session', SessionSchema);
