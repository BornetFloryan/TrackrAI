/***********************************************************
 * ESP32 – GPS + MPU6050 + BLE HR → Trackr Central Server
 * Protocole SAE : AUTOREGISTER / STOREMEASURE
 * Configuration dynamique via WiFiManager
 ***********************************************************/

#include <WiFi.h>
#include <WiFiClient.h>
#include <WiFiManager.h>

#include <TinyGPSPlus.h>
#include <Wire.h>
#include <MPU6050.h>

#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEScan.h>
#include <BLEClient.h>

#include <time.h>

/* ================= PINS ================= */
#define GPS_RX_PIN 27
#define SDA_PIN    19
#define SCL_PIN    22

/* ================= BLE UUID ================= */
#define HR_SERVICE_UUID "180D"
#define HR_CHAR_UUID    "2A37"

/* ================= OBJETS ================= */
WiFiClient tcp;
TinyGPSPlus gps;
HardwareSerial gpsSerial(2);
MPU6050 mpu;

/* BLE */
BLEClient* bleClient = nullptr;
BLERemoteCharacteristic* hrChar = nullptr;

/* Module */
String moduleKey = "";
bool registered = false;

/* Cardio */
uint16_t heartRate = 0;
float rr_ms[64];
int rrCount = 0;
float rmssd = NAN;

/* ================= CONFIG DYNAMIQUE ================= */
char server_host[64] = "82.64.26.75";
char server_port[6]  = "29000";

/* ================= TIMING ================= */
unsigned long lastSend = 0;
const unsigned long SEND_INTERVAL = 1000;

/* ================= HRV ================= */
void addRR(float v) {
  if (rrCount < 64) rr_ms[rrCount++] = v;
}

float computeRMSSD() {
  if (rrCount < 3) return NAN;
  float s = 0;
  for (int i = 1; i < rrCount; i++) {
    float d = rr_ms[i] - rr_ms[i - 1];
    s += d * d;
  }
  return sqrt(s / (rrCount - 1));
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
      addRR((rr1024 * 1000.0) / 1024.0);
      offset += 2;
    }
    rmssd = computeRMSSD();
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
      Serial.println("Module key = " + moduleKey);
    }
  }
}

void sendMeasure(const char* type, float value) {
  if (!registered) return;

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

  Serial.println("WiFi connecté");
  Serial.printf("Serveur : %s:%s\n", server_host, server_port);
}

/* ================= SETUP ================= */
void setup() {
  Serial.begin(115200);

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

  initBLE();
}

/* ================= LOOP ================= */
void loop() {

  while (gpsSerial.available())
    gps.encode(gpsSerial.read());

  /* ===== TCP CONNECT ===== */
  if (!tcp.connected()) {
    Serial.println("Connexion TCP...");
    if (!tcp.connect(server_host, atoi(server_port))) {
      Serial.println("Échec TCP");
      delay(2000);
      return;
    }
    Serial.println("TCP connecté");
    registered = false;
  }

  if (!registered) {
    autoRegister();
    delay(500);
    return;
  }

  /* ===== TIMING ===== */
  if (millis() - lastSend < SEND_INTERVAL) return;
  lastSend = millis();

  /* ===== GPS ===== */
  if (gps.location.isValid()) {
    sendMeasure("gps_lat", gps.location.lat());
    sendMeasure("gps_lon", gps.location.lng());
    sendMeasure("gps_speed", gps.speed.kmph());
  }

  /* ===== HEART ===== */
  sendMeasure("heart_rate", heartRate);
  if (!isnan(rmssd)) sendMeasure("rmssd", rmssd);

  /* ===== IMU ===== */
  int16_t ax, ay, az, gx, gy, gz;
  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);

  sendMeasure("acc_x", ax);
  sendMeasure("acc_y", ay);
  sendMeasure("acc_z", az);
  sendMeasure("gyro_x", gx);
  sendMeasure("gyro_y", gy);
  sendMeasure("gyro_z", gz);
}
