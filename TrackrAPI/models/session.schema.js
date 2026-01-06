const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let SessionSchema = new Schema({

    sessionId: { type: String, required: true, unique: true },

    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    module: { type: Schema.Types.ObjectId, ref: 'Modules', required: true },

    startDate: { type: Date, required: true, default: Date.now },

    lastMeasureAt: { type: Date },

    endDate: { type: Date },

    stats: { type: mongoose.Schema.Types.Mixed },

},{ versionKey: false });

module.exports = SessionSchema;
