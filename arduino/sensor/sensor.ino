#include "WiFi.h"
#include <Wire.h>
#include <SPI.h>
#include <SparkFunLSM9DS1.h>
#include <NTPClient.h>

extern "C"
{
#include "sh2lib.h"
}

// connection
const char *ssid = "SSID";
const char *password = "PASSWORD";
const char *endpoint = "https://0.0.0.0:4000";
struct sh2lib_handle hd;

// data
const int CHUNK_SIZE = 50;
float accelX[CHUNK_SIZE];
float accelY[CHUNK_SIZE];
float accelZ[CHUNK_SIZE];
long long accelT[CHUNK_SIZE];
int bufferPos = 0;

bool sending = false;

// time
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP);
long long millisEpoch = 0;

// imu
LSM9DS1 imu;

int handle_post_response(struct sh2lib_handle *handle, const char *data, size_t len, int flags)
{
  Serial.printf("response");
  if (len > 0)
  {
    Serial.printf("%.*s\n", len, data);
  }

  if (flags == DATA_RECV_RST_STREAM)
  {
    Serial.println("STREAM CLOSED");
  }
  return 0;
}

int send_post_data(struct sh2lib_handle *handle, char *buf, size_t length, uint32_t *data_flags)
{
  int contentLength = 38 * CHUNK_SIZE;
  char buffer[contentLength];
  char *end_of_buffer = buffer;
  std::size_t remaining_space = sizeof(buffer);
  for (int i = 0; i < CHUNK_SIZE; i++)
  {
    int written_bytes = sprintf(end_of_buffer, "%f, %f, %f, %lli\n", accelX[i], accelY[i], accelZ[i], accelT[i]);
    if (written_bytes > 0)
    {
      end_of_buffer += written_bytes;
      remaining_space -= written_bytes;
    }
  }
  memcpy(buf, buffer, strlen(buffer));

  (*data_flags) |= NGHTTP2_DATA_FLAG_EOF;
  return strlen(buffer);
}

void postData()
{
  sending = true;
  Serial.println("posting data");
  sh2lib_do_post(&hd, "/", send_post_data, handle_post_response);
  Serial.println("after do_post");

  if (sh2lib_execute(&hd) != ESP_OK)
  {
    Serial.println("Error in execute");
  }
}

void connect(void *args)
{
  Serial.println("Connecting to server..");
  if (sh2lib_connect(&hd, endpoint) != ESP_OK)
  {
    Serial.println("Error connecting to HTTP2 server");
    vTaskDelete(NULL);
  }
  Serial.println("Connected");

  while (1)
  {
    postData();

    vTaskDelay(250);
  }

  vTaskDelete(NULL);
}

void setup()
{
  Serial.begin(115200);

  Wire.begin();
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED)
  {
    delay(1000);
    Serial.println("Connecting to WiFi..");
  }

  if (imu.begin() == false) // with no arguments, this uses default addresses (AG:0x6B, M:0x1E) and i2c port (Wire).
  {
    Serial.println("Failed to communicate with LSM9DS1.");
    Serial.println("Double-check wiring.");
    Serial.println("Default settings in this sketch will "
                   "work for an out of the box LSM9DS1 "
                   "Breakout, but may need to be modified "
                   "if the board jumpers are.");
    while (1)
      ;
  }

  xTaskCreate(connect, "connect", (1024 * 32), NULL, 5, NULL);
}

void loop()
{
  if (!imu.accelAvailable())
  {
    return;
  }

  imu.readAccel();

  accelX[bufferPos] = imu.calcAccel(imu.ax);
  accelY[bufferPos] = imu.calcAccel(imu.ay);
  accelZ[bufferPos] = imu.calcAccel(imu.az);
  accelT[bufferPos] = (unsigned long long)millisEpoch + millis();
  bufferPos++;

  if (bufferPos == CHUNK_SIZE)
  {
    bufferPos = 0;
  }

  delay(50);
}
