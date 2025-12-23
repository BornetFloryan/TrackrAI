const User = require('./models/user.model');
const Module = require('./models/module.model');
const Chipset = require('./models/chipset.model')
const bcrypt = require('bcryptjs');
const SALT_WORK_FACTOR = 10;

/* ================= CHIPSETS ================= */
let gps = null;
let imu = null;
let hr  = null;

async function initChipsets() {
  try {
    gps = await Chipset.findOne({ name: 'gps' }).exec();
    if (gps === null) {
      gps = new Chipset({
        name: "gps",
        description: "GPS position sensor",
        caps: ["latitude", "longitude", "speed"],
      });
      gps = await gps.save();
      console.log("added gps chipset");
    }
  } catch (err) {
    console.log("cannot add gps chipset");
  }

  try {
    imu = await Chipset.findOne({ name: 'imu' }).exec();
    if (imu === null) {
      imu = new Chipset({
        name: "imu",
        description: "Inertial Measurement Unit (MPU6050)",
        caps: ["acceleration", "gyroscope"],
      });
      imu = await imu.save();
      console.log("added imu chipset");
    }
  } catch (err) {
    console.log("cannot add imu chipset");
  }

  try {
    hr = await Chipset.findOne({ name: 'hr' }).exec();
    if (hr === null) {
      hr = new Chipset({
        name: "hr",
        description: "Heart rate sensor (BLE)",
        caps: ["heart_rate", "rmssd"],
      });
      hr = await hr.save();
      console.log("added hr chipset");
    }
  } catch (err) {
    console.log("cannot add hr chipset");
  }
}

/* ================= MODULES ================= */
/*
 * Module de référence ESP32
 * La vraie clé sera générée via AUTOREGISTER
 */
async function initModules() {
  try {
    let esp32 = await Module.findOne({ name: 'ESP32 Tracker' }).exec();
    if (esp32 === null) {
      esp32 = new Module({
        name: "ESP32 Tracker",
        shortName: "esp32",
        key: "DYNAMIC", // IMPORTANT : clé non utilisée, AUTOREGISTER génère la vraie
        uc: "esp32",
        chipsets: [ gps._id, imu._id, hr._id ],
      });
      esp32 = await esp32.save();
      console.log("added ESP32 reference module");
    }
  } catch (err) {
    console.log("cannot add ESP32 module");
  }
}

/* ================= USERS ================= */
async function initUsers() {
  let admin = null;
  try {
    admin = await User.findOne({ login: 'admin' }).exec();
    if (admin === null) {
      const salt = bcrypt.genSaltSync(SALT_WORK_FACTOR);
      const password = bcrypt.hashSync('admin', salt);
      admin = new User({
        login: "admin",
        password: password,
        email: "sdomas@univ-fcomte.fr",
        rights: ['admin'],
      });
      admin = await admin.save();
      console.log("added admin");
    }
  } catch (err) {
    console.log("cannot add admin");
  }

  let test = null;
  try {
    test = await User.findOne({ login: 'test' }).exec();
    if (test === null) {
      const salt = bcrypt.genSaltSync(SALT_WORK_FACTOR);
      const password = bcrypt.hashSync('azer', salt);
      test = new User({
        login: "test",
        password: password,
        email: "sdomas@univ-fcomte.fr",
        rights: ['basic'],
      });
      test = await test.save();
      console.log("added test");
    }
  } catch (err) {
    console.log("cannot add test");
  }
}

/* ================= INIT ================= */
async function initBdD() {
  await initChipsets();
  await initModules();
  await initUsers();
}

module.exports = {
  initBdD,
};
