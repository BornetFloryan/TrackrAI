/***********************************************************
 * ESP32 – GPS + MPU6050 + BLE HR → Trackr Central Server
 * Protocole SAE : AUTOREGISTER / STOREMEASURE
 * Configuration dynamique via WiFiManager
 ***********************************************************/

#include <WiFi.h>
#include <WiFiClient.h>
#include <WiFiManager.h>

#include <Wire.h>
#include <MPU6050.h>

#include <NMEAGPS.h>

#include <BLEDevice.h>
#include <BLEScan.h>
#include <BLEClient.h>

#include <time.h>
#include <Preferences.h>

#include <math.h>

/* ================= PINS ================= */
#define GPS_RX_PIN 27
#define SDA_PIN    19
#define SCL_PIN    22

/* ================= BLE UUID ================= */
#define HR_SERVICE_UUID "180D"
#define HR_CHAR_UUID    "2A37"

/* ================= FACTORY RESET ================= */
#define RESET_BTN_PIN 0
#define RESET_HOLD_MS 5000

/* ================= GPS QUALITY FILTER ================= */
#define GPS_MIN_DIST_M     1.5     // distance mini entre 2 fixes
#define GPS_MIN_SPEED_KPH  0.5     // vitesse mini crédible
#define GPS_MIN_DT_MS      800     // intervalle mini entre fixes

/* ================= OBJETS ================= */
WiFiClient tcp;
HardwareSerial gpsSerial(2);
MPU6050 mpu;

NMEAGPS gps;
gps_fix fix;

Preferences prefs;

/* BLE */
BLEClient* bleClient = nullptr;
BLERemoteCharacteristic* hrChar = nullptr;

/* Module */
String moduleKey = "";
bool registered = false;

bool recording = false;

/* Cardio */
uint16_t heartRate = 0;

/* ================= CONFIG DYNAMIQUE ================= */
char server_host[64] = "82.64.26.75";
char server_port[6]  = "29000";

/* ================= GPS FILTER ================= */
static bool hasLastFix = false;
static double lastLat = 0.0;
static double lastLon = 0.0;
static unsigned long lastFixMs = 0;

/* ================= IMU WARMUP ================= */
static unsigned long imuStartMs = 0;
static bool imuReady = false;
#define IMU_WARMUP_MS 3000   // 3 secondes

/* ================= TIMING ================= */
unsigned long lastSend = 0;
const unsigned long SEND_INTERVAL = 1000;

/* ================= HRV ================= */
static const int RR_BUF_SIZE = 64;

float rr_ms[RR_BUF_SIZE];
int rrCount = 0;
int rrIndex = 0;

float rmssd = NAN;
volatile bool rmssdDirty = false;

void addRR(float v) {
  rr_ms[rrIndex] = v;
  rrIndex = (rrIndex + 1) % RR_BUF_SIZE;
  if (rrCount < RR_BUF_SIZE) rrCount++;
  rmssdDirty = true;
}

float computeRMSSD() {
  if (rrCount < 3) return NAN;

  float s = 0;
  int start = (rrIndex - rrCount + RR_BUF_SIZE) % RR_BUF_SIZE;

  for (int i = 1; i < rrCount; i++) {
    float a = rr_ms[(start + i - 1) % RR_BUF_SIZE];
    float b = rr_ms[(start + i) % RR_BUF_SIZE];
    float d = b - a;
    s += d * d;
  }
  return sqrt(s / (rrCount - 1));
}

static inline double deg2rad(double d) { return d * 0.017453292519943295; }

// Distance Haversine en mètres
static double haversineMeters(double lat1, double lon1, double lat2, double lon2) {
  const double R = 6371000.0; // m
  const double dLat = deg2rad(lat2 - lat1);
  const double dLon = deg2rad(lon2 - lon1);

  const double a =
    sin(dLat / 2) * sin(dLat / 2) +
    cos(deg2rad(lat1)) * cos(deg2rad(lat2)) *
    sin(dLon / 2) * sin(dLon / 2);

  const double c = 2.0 * atan2(sqrt(a), sqrt(1.0 - a));
  return R * c;
}

/* ================= BLE ================= */
void hrNotifyCallback(
  BLERemoteCharacteristic*,
  uint8_t* data,
  size_t len,
  bool
) {
  uint8_t flags = data[0];
  bool hr16 = flags & 0x01;
  bool rrPresent = flags & 0x10;

  int offset = 1;
  heartRate = hr16 ? (data[offset] | (data[offset + 1] << 8)) : data[offset];
  offset += hr16 ? 2 : 1;

  if (rrPresent) {
    while (offset + 1 < len) {
      uint16_t rr1024 = data[offset] | (data[offset + 1] << 8);
      addRR((rr1024 * 1000.0f) / 1024.0f);
      offset += 2;
    }
  }
}

void initBLE() {
  BLEDevice::init("");
  BLEScan* scan = BLEDevice::getScan();
  scan->setActiveScan(true);

  BLEScanResults* results = scan->start(5);

  for (int i = 0; i < results->getCount(); i++) {
    BLEAdvertisedDevice dev = results->getDevice(i);
    if (dev.isAdvertisingService(BLEUUID(HR_SERVICE_UUID))) {
      bleClient = BLEDevice::createClient();
      bleClient->connect(&dev);

      BLERemoteService* svc = bleClient->getService(BLEUUID(HR_SERVICE_UUID));
      if (!svc) return;

      hrChar = svc->getCharacteristic(BLEUUID(HR_CHAR_UUID));
      if (!hrChar) return;

      hrChar->registerForNotify(hrNotifyCallback);

      Serial.println("Ceinture cardiaque connectée");
      return;
    }
  }
  Serial.println("Aucune ceinture cardio trouvée");
}

/* ================= TCP UTILS ================= */
bool readLine(String &line, unsigned long timeout = 3000) {
  unsigned long start = millis();
  line = "";

  while (millis() - start < timeout) {
    while (tcp.available()) {
      char c = tcp.read();
      if (c == '\n') return true;
      if (c != '\r') line += c;
    }
    delay(10);
  }
  return false;
}

/* ================= TCP ================= */
void autoRegister() {
  Serial.println("Envoi AUTOREGISTER");
  tcp.println("AUTOREGISTER esp32 gps imu hr");
  tcp.flush();

  String resp;
  if (!readLine(resp)) {
    Serial.println("Pas de réponse serveur");
    return;
  }

  Serial.println("AUTOREGISTER -> " + resp);

  if (resp.startsWith("OK")) {
    int idx = resp.lastIndexOf(',');
    if (idx > 0) {
      moduleKey = resp.substring(idx + 1);
      moduleKey.trim();
      registered = true;

      prefs.putString("moduleKey", moduleKey);
      Serial.println("Module key sauvegardée = " + moduleKey);
    }
  }
}

void sendMeasure(const char* type, float value) {
  if (!registered || !recording) return;

  time_t ts = time(nullptr);
  if (ts < 1600000000) return;

  tcp.print("STOREMEASURE ");
  tcp.print(type);
  tcp.print(" ");
  tcp.print((long long)ts * 1000);
  tcp.print(" ");
  tcp.print(value);
  tcp.print(" ");
  tcp.println(moduleKey);
}

void handleServerCommands() {
  while (tcp.available()) {
    String cmd = tcp.readStringUntil('\n');
    cmd.trim();

    if (cmd.startsWith("START_SESSION")) {
      recording = true;
      imuStartMs = millis();
      imuReady = false;
      Serial.println("Enregistrement démarré (session)");
    } else if (cmd == "STOP_SESSION") {
      recording = false;
      Serial.println("Enregistrement arrêté (session)");
    }
  }
}

/* ================= WIFI MANAGER ================= */
void setupWiFi() {
  WiFiManager wm;

  WiFiManagerParameter p_server("server", "Server host", server_host, 64);
  WiFiManagerParameter p_port("port", "Server port", server_port, 6);

  wm.addParameter(&p_server);
  wm.addParameter(&p_port);

  if (!wm.autoConnect("Trackr-ESP32")) {
    ESP.restart();
  }

  strcpy(server_host, p_server.getValue());
  strcpy(server_port, p_port.getValue());

  // ===== Sauvegarde en flash =====
  prefs.putString("server_host", server_host);
  prefs.putString("server_port", server_port);

  Serial.println("Configuration serveur sauvegardée");
  Serial.printf("Serveur : %s:%s\n", server_host, server_port);
}

/* ===== Factory reset via bouton BOOT ===== */
void factoryReset() {
  Serial.println("\n=== FACTORY RESET ===");

  prefs.clear();
  prefs.end();

  WiFiManager wm;
  wm.resetSettings();

  Serial.println("WiFi + serveur + moduleKey effacés");
  Serial.println("Redémarrage...");
  delay(2000);

  ESP.restart();
}


/* ================= SETUP ================= */
void setup() {
  Serial.begin(115200);

  pinMode(RESET_BTN_PIN, INPUT_PULLUP);
  Serial.println("Maintenir BOOT 5s pour reset configuration");

  unsigned long t0 = millis();
  while (digitalRead(RESET_BTN_PIN) == LOW) {
    if (millis() - t0 > RESET_HOLD_MS) {
      factoryReset();
    }
    delay(10);
  }

  prefs.begin("trackr", false);

  moduleKey = prefs.getString("moduleKey", "");
  if (moduleKey.length() > 0) {
    registered = true;
    Serial.println("Module déjà enregistré");
    Serial.println("Module key = " + moduleKey);
  } else {
    Serial.println("Aucune moduleKey trouvée, auto-enregistrement requis");
  }

  String sh = prefs.getString("server_host", "");
  String sp = prefs.getString("server_port", "");

  if (sh.length() > 0) {
    strcpy(server_host, sh.c_str());
    Serial.println("Server host chargé depuis flash : " + sh);
  }

  if (sp.length() > 0) {
    strcpy(server_port, sp.c_str());
    Serial.println("Server port chargé depuis flash : " + sp);
  }

  setupWiFi();
  configTime(0, 0, "pool.ntp.org");

  Serial.print("Synchronisation NTP");
  time_t now = time(nullptr);
  while (now < 1600000000) {
    delay(500);
    Serial.print(".");
    now = time(nullptr);
  }
  Serial.println("\nHeure NTP synchronisée");


  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX_PIN, -1);
  Wire.begin(SDA_PIN, SCL_PIN);
  mpu.initialize();

  mpu.CalibrateAccel(6);
  mpu.CalibrateGyro(6);
  mpu.setDLPFMode(MPU6050_DLPF_BW_20);

  initBLE();
}

void sendHello() {
  if (!tcp.connected()) return;
  tcp.print("HELLO ");
  tcp.println(moduleKey);
  tcp.flush();
  Serial.println("HELLO envoyé : " + moduleKey);
}

/* ================= LOOP ================= */
void loop() {
  handleServerCommands();

  while (gps.available(gpsSerial))
    fix = gps.read();

  // 1) Assurer la connexion TCP (une seule connexion persistante)
  if (!tcp.connected()) {
    Serial.println("Connexion TCP...");
    if (!tcp.connect(server_host, atoi(server_port))) {
      Serial.println("Échec TCP");
      delay(2000);
      return;
    }
    Serial.println("TCP connecté");

    // Si déjà enregistré, on s'identifie tout de suite
    if (registered && moduleKey.length() > 0) {
      sendHello();
    }
  }

  // 2) Si pas enregistré : AUTOREGISTER sur LA MEME socket, puis HELLO
  if (!registered) {
    autoRegister();

    // autoRegister() met registered=true + moduleKey si OK
    if (registered && moduleKey.length() > 0) {
      sendHello();          // IMPORTANT : même socket, tout de suite
    }

    delay(500);
    return;                 // on laisse le serveur traiter + éventuellement envoyer START_SESSION
  }

  // 3) Timing
  if (millis() - lastSend < SEND_INTERVAL) return;
  lastSend = millis();

  // 4) On n'envoie des mesures que si session active
  if (!recording) return;

  // 5) GPS (filtré)
  if (fix.valid.location && fix.valid.speed) {
    if (!hasLastFix) {
      sendMeasure("gps_lat", fix.latitude());
      sendMeasure("gps_lon", fix.longitude());
    }

    unsigned long nowMs = millis();

    if (hasLastFix && (nowMs - lastFixMs) > GPS_MIN_DT_MS) {
      double dM = haversineMeters(
        fix.latitude(), fix.longitude(),
        lastLat, lastLon
      );

      if (dM >= GPS_MIN_DIST_M && fix.speed_kph() >= GPS_MIN_SPEED_KPH) {

        sendMeasure("gps_lat", fix.latitude());
        sendMeasure("gps_lon", fix.longitude());
        sendMeasure("gps_speed", fix.speed_kph());
      }
    }

    lastLat   = fix.latitude();
    lastLon   = fix.longitude();
    lastFixMs = nowMs;
    hasLastFix = true;
  }

  // 6) HEART
  sendMeasure("heart_rate", heartRate);

  if (rmssdDirty) {
    rmssd = computeRMSSD();
    rmssdDirty = false;

    if (!isnan(rmssd)) {
      sendMeasure("rmssd", rmssd);
    }
  }

  // 7) IMU (avec warmup)
  if (imuReady || millis() - imuStartMs >= IMU_WARMUP_MS) {

    imuReady = true;

    int16_t ax, ay, az, gx, gy, gz;
    mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);

    sendMeasure("acc_x", ax);
    sendMeasure("acc_y", ay);
    sendMeasure("acc_z", az);
    sendMeasure("gyro_x", gx);
    sendMeasure("gyro_y", gy);
    sendMeasure("gyro_z", gz);
  }
}


