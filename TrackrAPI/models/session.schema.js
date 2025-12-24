const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let SessionSchema = new Schema({

    sessionId: { type: String, required: true, unique: true },

    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    module: { type: Schema.Types.ObjectId, ref: 'Module', required: true },

    startDate: { type: Date, required: true, default: Date.now },

    endDate: { type: Date }

},{ versionKey: false });

module.exports = SessionSchema;
