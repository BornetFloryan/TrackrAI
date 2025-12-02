const User = require('./models/user.model');
const Module = require('./models/module.model');
const Chipset = require('./models/chipset.model')
const bcrypt = require('bcryptjs');
const SALT_WORK_FACTOR = 10;

// chipsets
let hrm = null;       // capteur de fréquence cardiaque
let imu = null;       // accéléromètre + gyroscope (MPU-6050)
let gps = null;       // optionnel : position / vitesse

async function initChipsets() {

    // Capteur de fréquence cardiaque
    try {
        hrm = await Chipset.findOne({name: 'hrm'}).exec()
        if (hrm === null) {
            hrm = new Chipset({
                name: "hrm",
                description: "Heart rate monitor (type MAX30100/MAX30102)",
                links: ["https://exemple.com/"],
                caps: ["heart_rate"],
            })
            hrm = await hrm.save()
            console.log("added hrm chipset");
        }
    } catch (err) {
        console.log("cannot add hrm chipset")
    }

    // MPU-6050
    try {
        imu = await Chipset.findOne({name: 'mpu6050'}).exec()
        if (imu === null) {
            imu = new Chipset({
                name: "mpu6050",
                description: "Accelerometer + Gyroscope (MPU-6050)",
                links: ["https://exemple.com/"],
                caps: ["acceleration", "rotation"],
            })
            imu = await imu.save()
            console.log("added mpu6050 chipset");
        }
    } catch (err) {
        console.log("cannot add mpu6050 chipset")
    }

    // GPS
    try {
        gps = await Chipset.findOne({name: 'gps'}).exec()
        if (gps === null) {
            gps = new Chipset({
                name: "gps",
                description: "GPS module (position + speed)",
                links: ["https://exemple.com/"],
                caps: ["position", "speed"],
            })
            gps = await gps.save()
            console.log("added gps chipset");
        }
    } catch (err) {
        console.log("cannot add gps chipset")
    }
}

async function initModules() {
    let runner = null;
    let cyclist = null;

    // Module sportif 1 : Runner
    try {
        runner = await Module.findOne({name: 'runner module'}).exec()
        if (runner === null) {
            runner = new Module({
                name: "runner module",
                shortName: "run1",
                key: "11111111-2222-3333-4444-555555555555",
                uc: "esp32",
                chipsets: [ hrm._id, imu._id ],
            })
            runner = await runner.save()
            console.log("added runner module");
        }
    } catch (err) {
        console.log("cannot add runner module")
    }

    // Module sportif 2 : Cyclist
    try {
        cyclist = await Module.findOne({name: 'cyclist module'}).exec()
        if (cyclist === null) {
            cyclist = new Module({
                name: "cyclist module",
                shortName: "cycle1",
                key: "99999999-8888-7777-6666-555555555555",
                uc: "esp32",
                chipsets: [ gps._id, imu._id ],
            })
            cyclist = await cyclist.save()
            console.log("added cyclist module");
        }
    } catch (err) {
        console.log("cannot add cyclist module")
    }
}

async function initUsers() {
    let admin = null
    try {
        admin = await User.findOne({login: 'admin'}).exec()
        if (admin === null) {
            const salt = bcrypt.genSaltSync(SALT_WORK_FACTOR);
            const password = bcrypt.hashSync('admin', salt);
            admin = new User({
                login: "admin",
                password: password,
                email: "admin@trackrai.fr",
                rights: ['admin'],
            })
            admin = await admin.save()
            console.log("added admin");
        }
    } catch (err) {
        console.log("cannot add admin")
    }

    let test = null
    try {
        test = await User.findOne({login: 'test'}).exec()
        if (test === null) {
            const salt = bcrypt.genSaltSync(SALT_WORK_FACTOR);
            const password = bcrypt.hashSync('test', salt);
            test = new User({
                login: "test",
                password: password,
                email: "test@trackrai.fr",
                rights: ['basic'],
            })
            test = await test.save()
            console.log("added test");
        }
    } catch (err) {
        console.log("cannot add test")
    }
}

async function initBdD() {
    await initChipsets()
    await initModules()
    await initUsers()
}

module.exports = {
    initBdD,
};
