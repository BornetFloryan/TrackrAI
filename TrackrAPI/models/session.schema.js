const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let SessionSchema = new Schema({

    sessionId: { type: String, required: true, unique: true },

    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    module: { type: Schema.Types.ObjectId, ref: 'Modules', required: true },

    startDate: { type: Date, required: true, default: Date.now },

    lastMeasureAt: { type: Date },

    endDate: { type: Date },

    stats: {
        durationMs: Number,
        distanceKm: Number,
        steps: Number,
        hrAvg: Number,
        hrMax: Number,
        stress: Number,
        score: Number,
      },
      
    isFinalized: { type: Boolean, default: false },

},{ versionKey: false });

module.exports = SessionSchema;
