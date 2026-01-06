const { computePerformanceScore } = require('./utils/performanceScore')
const { spawnSync } = require('child_process')

const User = require('./models/user.model');
const Module = require('./models/module.model');
const Chipset = require('./models/chipset.model');
const bcrypt = require('bcryptjs');
const Session = require('./models/session.model');
const Measure = require('./models/measure.model');
const SALT_WORK_FACTOR = 10;
const path = require('path')

let gps = null;
let imu = null;
let hr  = null;

async function initChipsets() {
  try {
    gps = await Chipset.findOne({ name: 'gps' }).exec();
    if (!gps) {
      gps = await new Chipset({
        name: "gps",
        description: "GPS position sensor",
        caps: ["latitude", "longitude", "speed"],
      }).save();
      console.log("added gps chipset");
    }
  } catch {
    console.log("cannot add gps chipset");
  }

  try {
    imu = await Chipset.findOne({ name: 'imu' }).exec();
    if (!imu) {
      imu = await new Chipset({
        name: "imu",
        description: "Inertial Measurement Unit (MPU6050)",
        caps: ["acceleration", "gyroscope"],
      }).save();
      console.log("added imu chipset");
    }
  } catch {
    console.log("cannot add imu chipset");
  }

  try {
    hr = await Chipset.findOne({ name: 'hr' }).exec();
    if (!hr) {
      hr = await new Chipset({
        name: "hr",
        description: "Heart rate sensor (BLE)",
        caps: ["heart_rate", "rmssd"],
      }).save();
      console.log("added hr chipset");
    }
  } catch {
    console.log("cannot add hr chipset");
  }
}

async function initModules() {
  try {
    let esp32 = await Module.findOne({ name: 'ESP32 Tracker' }).exec();
    if (!esp32) {
      esp32 = await new Module({
        name: "ESP32 Tracker",
        shortName: "esp32",
        key: "DYNAMIC",
        uc: "esp32",
        chipsets: [gps._id, imu._id, hr._id],
      }).save();
      console.log("added ESP32 reference module");
    }
  } catch {
    console.log("cannot add ESP32 module");
  }
}

async function initUsers() {
  try {
    let admin = await User.findOne({ login: 'admin' }).exec();
    if (!admin) {
      const salt = bcrypt.genSaltSync(SALT_WORK_FACTOR);
      admin = await new User({
        login: "admin",
        password: bcrypt.hashSync('admin', salt),
        email: "sdomas@univ-fcomte.fr",
        rights: ['admin'],
      }).save();
      console.log("added admin");
    }
  } catch {
    console.log("cannot add admin");
  }

  try {
    let test = await User.findOne({ login: 'test' }).exec();
    if (!test) {
      const salt = bcrypt.genSaltSync(SALT_WORK_FACTOR);
      test = await new User({
        login: "test",
        password: bcrypt.hashSync('azer', salt),
        email: "sdomas@univ-fcomte.fr",
        rights: ['basic'],
      }).save();
      console.log("added test");
    }
  } catch {
    console.log("cannot add test");
  }

  try {
    let coach = await User.findOne({ login: 'coach' }).exec();
    if (!coach) {
      const salt = bcrypt.genSaltSync(SALT_WORK_FACTOR);
      coach = await new User({
        login: "coach",
        password: bcrypt.hashSync('coach', salt),
        email: "coach@univ-fcomte.fr",
        rights: ['coach'],
      }).save();
      console.log("added coach");
    }
  } catch {
    console.log("cannot add coach");
  }
}

function rnd(min, max) {
  return min + Math.random() * (max - min);
}
function avg(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
}
function max(arr) {
  return arr.length ? Math.max(...arr) : null;
}

async function initDemoData() {
  try {
    const user = await User.findOne({ login: "test" }).exec();
    const module = await Module.findOne({ name: "ESP32 Tracker" }).exec();
    if (!user || !module) return;

    const existing = await Session.findOne({ sessionId: /^DEMO-SESSION-/ }).exec();
    if (existing) {
      console.log("demo sessions already exist");
      return;
    }

    const now = Date.now();
    const days = 7;
    const sessionDurationMin = 15;
    const stepMs = 10 * 1000;

    for (let d = 0; d < days; d++) {
      const dayOffset = (days - 1 - d) * 24 * 60 * 60 * 1000;
      const startDate = new Date(now - dayOffset);
      const endDate = new Date(startDate.getTime() + sessionDurationMin * 60 * 1000);

      const session = await new Session({
        sessionId: `DEMO-SESSION-${d + 1}`,
        user: user._id,
        module: module._id,
        startDate,
        lastMeasureAt: endDate,
        endDate,
      }).save();

      const measures = [];
      const points = Math.floor((sessionDurationMin * 60 * 1000) / stepMs);

      let baseLat = 47.2400 + d * 0.0005;
      let baseLon = 6.0200 + d * 0.0005;
      const fatigue = d * 0.1;

      for (let i = 0; i < points; i++) {
        const t = new Date(startDate.getTime() + i * stepMs);

        const hrVal = Math.round(120 + Math.sin(i / 8) * 20 + fatigue * 15 + rnd(-4, 4));
        const rmssd = Math.max(18, 40 - fatigue * 8 + rnd(-3, 3));
        const speed = Math.max(2.3, 2.8 - fatigue * 0.3 + rnd(-0.2, 0.2));

        baseLat += rnd(0.00001, 0.00003);
        baseLon += rnd(0.00001, 0.00003);

        const push = (type, value) => measures.push({
          type,
          date: t,
          value: String(value),
          module: module._id,
          session: session._id,
        });

        push("heart_rate", hrVal);
        push("rmssd", rmssd.toFixed(1));
        push("gps_speed", speed.toFixed(2));
        push("gps_lat", baseLat.toFixed(6));
        push("gps_lon", baseLon.toFixed(6));
        push("acc_x", Math.round(rnd(-1200, 1200)));
        push("acc_y", Math.round(rnd(-1200, 1200)));
        push("acc_z", Math.round(16384 + rnd(-1000, 1000)));
      }

      await Measure.insertMany(measures);

      const durationMs = endDate - startDate;

      const speeds = measures
        .filter(m => m.type === 'gps_speed')
        .map(m => Number(m.value))
        .filter(v => v > 0);

      const distanceKm = speeds.reduce(
        (sum, v) => sum + (v * 10) / 1000,
        0
      );

      const steps = Math.round(distanceKm * 1300);

      const hrValues = measures
        .filter(m => m.type === 'heart_rate')
        .map(m => Number(m.value))
        .filter(v => v > 0);

      const stress =
        Math.round(
          50 +
          (avg(hrValues) - 110) * 0.5 -
          (steps / durationMs) * 1000
        )

      session.stats = {
        durationMs,
        distanceKm,
        steps,
        hrAvg: avg(hrValues),
        hrMax: max(hrValues),
        stress: Math.max(0, Math.min(100, stress)),
        score: computePerformanceScore({
          distanceKm,
          hrAvg: avg(hrValues),
          stress
        })
      };

      await session.save();

      const script = path.join(__dirname, 'python', 'predict_session.py')
      const out = spawnSync('python3', [script, session.sessionId], {
        encoding: 'utf-8',
        env: process.env,
      })

      if (out.status === 0 && out.stdout) {
        const ai = JSON.parse(out.stdout)
        session.stats.aiScore = ai.aiScore
        session.stats.aiExplain = ai.explain
        await session.save()
      }

      console.log(`added DEMO session ${d + 1} (15 min)`);
    }
  } catch (e) {
    console.log("cannot add demo session data", e);
  }
}

async function initBdD() {
  await initChipsets();
  await initModules();
  await initUsers();
  await initDemoData();
}

module.exports = { initBdD };
