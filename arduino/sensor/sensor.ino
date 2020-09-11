
// The SFE_LSM9DS1 library requires both Wire and SPI be
// included BEFORE including the 9DS1 library.
#include <Wire.h>
#include <SPI.h>
#include <SparkFunLSM9DS1.h>
#include <NTPClient.h>
#include <WiFi.h>


// WiFi network name and password:
const char * networkName = "Schloss Neidstein";
const char * networkPswd = "cagerage";
const char * host = "192.168.0.32";
const uint16_t port = 1337;

const int BUTTON_PIN = 0;
const int LED_PIN = 5;
const int CHUNK_SIZE = 100;

float accelX[CHUNK_SIZE];
float accelY[CHUNK_SIZE];
float accelZ[CHUNK_SIZE];
long long accelT[CHUNK_SIZE];
int bufferPos = 0;

LSM9DS1 imu;
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP);
long long millisEpoch = 0;

//Function definitions
void printAccel();

void connectToWiFi(const char * ssid, const char * pwd)
{
  int ledState = 0;

  printLine();
  Serial.println("Connecting to WiFi network: " + String(ssid));
  WiFi.begin(ssid, pwd);

  while (WiFi.status() != WL_CONNECTED) 
  {
    // Blink LED while we're connecting:
    digitalWrite(LED_PIN, ledState);
    ledState = (ledState + 1) % 2; // Flip ledState
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void postData()
{ 
  printLine();
  Serial.println("Connecting to domain: " + String(host));

  // Use WiFiClient class to create TCP connections
  WiFiClient client;
  if (!client.connect(host, port))
  {
    Serial.println("connection failed");
    return;
  }
  Serial.println("Connected!");
  printLine();

  char str[CHUNK_SIZE];
  int contentLength = 46 * CHUNK_SIZE;
  // This will send the request to the server
  client.print((String)"POST /sensor HTTP/1.1\r\n" +
               "Host: " + String(host) + "\r\n" +
               "Content-Length: " + contentLength + "\r\n\r\n");
  for (int i=0;i<CHUNK_SIZE;i++) {
    sprintf(str, "%f, %f, %f, %lli\n", accelX[i], accelY[i], accelZ[i], accelT[i]);
    client.print(str);
  }
  unsigned long timeout = millis();
  while (client.available() == 0) 
  {
    if (millis() - timeout > 5000) 
    {
      Serial.println(">>> Client Timeout !");
      client.stop();
      return;
    }
  }

  // Read all the lines of the reply from server and print them to Serial
  while (client.available()) 
  {
    String line = client.readStringUntil('\r');
    Serial.print(line);
  }

  Serial.println();
  Serial.println("closing connection");
  client.stop();
}

void setup()
{
  Serial.begin(115200);

  Wire.begin();
  connectToWiFi(networkName, networkPswd);

  timeClient.begin();
  timeClient.update();
  millisEpoch = (unsigned long long)timeClient.getEpochTime() * 1000;
  

  if (imu.begin() == false) // with no arguments, this uses default addresses (AG:0x6B, M:0x1E) and i2c port (Wire).
  {
    Serial.println("Failed to communicate with LSM9DS1.");
    Serial.println("Double-check wiring.");
    Serial.println("Default settings in this sketch will " \
                   "work for an out of the box LSM9DS1 " \
                   "Breakout, but may need to be modified " \
                   "if the board jumpers are.");
    while (1);
  }
}

void loop()
{
  if (!imu.accelAvailable()) {
    return;
  }

  imu.readAccel();

  accelX[bufferPos] = imu.calcAccel(imu.ax);
  accelY[bufferPos] = imu.calcAccel(imu.ay);
  accelZ[bufferPos] = imu.calcAccel(imu.az); 
  accelT[bufferPos] = (unsigned long long)millisEpoch + millis();
  bufferPos++;

  if (bufferPos == CHUNK_SIZE) {
    postData();
    bufferPos = 0;
  }
}

void printLine()
{
  Serial.println();
  for (int i=0; i<30; i++)
    Serial.print("-");
  Serial.println();
}
