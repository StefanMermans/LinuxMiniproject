#include <Adafruit_Sensor.h>

#include <DHT.h>
#include <DHT_U.h>

#include <ArduinoJson.h>

#include <ESP8266HTTPClient.h>

#include <Arduino.h>

// ESP2866 wifi inlucdes...
#include <ESP8266WiFi.h>
#include <ESP8266WiFiAP.h>
#include <ESP8266WiFiGeneric.h>
#include <ESP8266WiFiMulti.h>
#include <ESP8266WiFiScan.h>
#include <ESP8266WiFiSTA.h>
#include <ESP8266WiFiType.h>
#include <WiFiClient.h>
#include <WiFiClientSecure.h>
#include <WiFiServer.h>
#include <WiFiUdp.h>

// Define the amount of sensors and what identifier they will have
#define MAX_SENSOR_COUNT 2
#define TEMP_SENSOR "S0"
#define HUMID_SENSOR "S1"

#define IP_INVALID_MESSAGE "INVALID"
#define HTTP_ERROR_RESPONSE "REQUEST_FAILED"

// Define the structs for the sensors
typedef struct {
    String identifier;
    float value;
    int databaseId;
} Sensor;

// This is for the ESP8266 processor on ESP-01
// pin, DHT type, ???
DHT dht(D1, DHT11, 11); // 11 works fine for ESP8266

int status;
String server = "http://192.168.42.1:3000";
String identifier = "N1";
char * ssid = "AwesomeNetwork";
char * wifiPass = "AwesomePi";
String ip = IP_INVALID_MESSAGE;

// array to hold all the sensors
Sensor sensorsList[MAX_SENSOR_COUNT];

/**
Initialise the sensors array
test
*/
void initSensors(){
    int index;
  dht.begin();

  for (index = 0; index < MAX_SENSOR_COUNT; index++){
      char sensorId[2];
      Sensor sensor;
      sprintf(sensorId, "S%i",index);
      sensor.identifier = sensorId;
      // initalise to -1 to give it a value which will never succeed
      sensor.databaseId = -1;

      sensorsList[index] = sensor;
  }
}

/**
Read the values from every sensor in the array
*/
void readSensors(){
    int index;

    for (index = 0; index < MAX_SENSOR_COUNT; index++){
        Sensor * currentSensor = &sensorsList[index];

        if(sensorsList[index].identifier == TEMP_SENSOR){
            sensorsList[index].value = dht.readTemperature();
        } else if(sensorsList[index].identifier == HUMID_SENSOR){
            sensorsList[index].value = dht.readHumidity();
        }

        Serial.print("\n");
        Serial.print(sensorsList[index].identifier);
        Serial.print(": Value: ");
        Serial.print(sensorsList[index].value);
    }
}

/**
Connect to a wifi source
@param ssid: The ssid of the desired wifi source
@param password: the password of the desired wifi source
@return 1 if succesfull else 0
*/
boolean connectToWifi(char * ssid, char * password){
    Serial.println("Connecting to: ");
    Serial.print(ssid);

    WiFi.begin(ssid,password);
    status = WiFi.waitForConnectResult();

    if(status != WL_CONNECTED){
        Serial.println("Connecton failed...");

        return false;
    } else{
        Serial.println("Connected!");
        Serial.print("IP Addr:  ");
        Serial.println(WiFi.localIP());

        char buffer[16];
        ip = WiFi.localIP().toString();

        Serial.print("Status: ");
        Serial.println(WiFi.status());

        return true;
    }
}

/*
 * Send response to given target
 * @param target: the target address of server (starting with http://
 * @param content: the  value in json format that will been send to the target (as body)
 * @return response: the response from the server or HTTP_ERROR_RESPONSE when failed! (REQUEST_FAILED)
 */
String httpRequestPost(String target, String content){
  HTTPClient httpClient;
  httpClient.begin(target);
  httpClient.addHeader("Content-Type", "application/json");
  Serial.println(content);

  int httpCode = httpClient.POST(content);

  if(httpCode == HTTP_CODE_OK){
      String payload = httpClient.getString();

      Serial.print("HTTP RESPONSE: ");
      Serial.println(payload);

      httpClient.end();
      return payload;
  }else{
      Serial.print("HTTP ERROR:");
      Serial.println(httpClient.errorToString(httpCode));

      httpClient.end();
      return HTTP_ERROR_RESPONSE;
  }
}

String httpRequestGet(String target){
  HTTPClient httpClient;
  httpClient.begin(target);

  int httpCode = httpClient.GET();

  if(httpCode == HTTP_CODE_OK){
      String payload = httpClient.getString();

      Serial.print("HTTP RESPONSE: ");
      Serial.println(payload);

      httpClient.end();

      return payload;
  }else{
      Serial.print("HTTP ERROR:");
      Serial.println(httpClient.errorToString(httpCode));

      httpClient.end();

      return HTTP_ERROR_RESPONSE;
  }
}

/*
 * generate default body for sending sensor data to the server
 * Will be returned as string in json format (and value will been inserted as value)
 * @param value: float that will be inserted as value
 * @return body: the filled/generated json body
 */
String generateBody(float value){
  StaticJsonBuffer<400> jsonBuffer;
  JsonObject& root = jsonBuffer.createObject();

  root["value"] = value;

  char buffer[256];
  root.printTo(buffer);

  return buffer;
}

String generateRegister(String ip, String identifier){
    int index;

    StaticJsonBuffer<400> jsonBuffer;
    JsonObject& root = jsonBuffer.createObject();

    JsonArray& sensors = root.createNestedArray("sensors");
    for(index = 0; index < MAX_SENSOR_COUNT; index++){
        sensors.add(sensorsList[index].identifier);
    }

    root["sensors"] = sensors;
    root["ip"] = ip;

    char buffer[256];
    root.printTo(buffer);

    return buffer;
}

/*
 * Check if response is valid and no errors are returned (like device blocked)
 */
boolean errorInResponse(String response){
  StaticJsonBuffer<400> jsonBuffer;
  JsonObject& root = jsonBuffer.parseObject(response);
  if (!root.success()){
    return true;
  }
  if(root.containsKey("Status") && root["Status"] == "Error"){
    return true;
  }
  return false;
}

/*
 * Register device at server
 */
boolean registerDevice(String body){

    // char buffer[100];
    // sprintf(buffer, "http://192.168.42.1:3000/register", server);

    String response = httpRequestPost(server + "/register", body);

    Serial.println("Checking register response");
    if(response != HTTP_ERROR_RESPONSE && !errorInResponse(response)){
        Serial.println("Parsing response");

        // Set the databaseid's for the sensors
        StaticJsonBuffer<400> jsonBuffer;
        JsonObject& root = jsonBuffer.parseObject(response);

        Serial.println("Response size:");
        Serial.println(response.length());

        if(root.success()){
            Serial.println("It's not the json");
        } else{
            Serial.println("It might be the json");
        }
        if(root.success() && root.containsKey("found")){
            int index;

            // Serial.println("REGISTER:\n" + response);
            Serial.println("REGISTERED succesfully!");
            Serial.println(response);

            for(index = 0; index < MAX_SENSOR_COUNT; index++){
                // JsonArray& array = root['found'];
                sensorsList[index].databaseId = root["found"][index]["database_id"];
            }

            return true;
        }
    }
    Serial.println("Delay");
    delay(1000);
    Serial.println("Retrying register, recursively");
    return registerDevice(body);   //retry recursive
}

/*
 * Send the data of a sensor to the server
 * @param sensor: the sensor of which the value will be sent
 * @return response: the response from the server or HTTP_ERROR_RESPONSE when failed! (REQUEST_FAILED)
*/
String sendSensorData(Sensor sensor){
    char buffer[100];
    sprintf(buffer, "/sensor/%i", sensor.databaseId);
    // Serial.println(buffer);

    if(isnan(sensor.value)){
      return "NAN value";
    }
    return httpRequestPost(server + buffer, generateBody(sensor.value));
}

void setup() {
    Serial.begin(115200);
    // try to connect to wifi until it's succesfull
    while(!connectToWifi(ssid,wifiPass)){
        delay(1000); // Give it some time
        Serial.println("Retrying connecion...");
    }
    initSensors();
    registerDevice(generateRegister(ip, identifier));
    Serial.println("Done registering!");
}

void loop() {
    Serial.println("loop!");
    int index;

    // Update the value in the sensors
    readSensors();

    // Send the date for every sensor
    for(index = 0; index < MAX_SENSOR_COUNT; index++){
        sendSensorData(sensorsList[index]);
    }

    delay(1000);
}
