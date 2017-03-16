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
#define HTTP_ERROR_RESPONSE "REQUEST_FAILED"

int status;
String server = "http://192.168.42.1:3000";
String identifier = "N1";
char * ssid = "AwesomeNetwork";
char * wifiPass = "AwesomePi";
String ip = "INVALID";

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
        ip = ""+WiFi.localIP();
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
  StaticJsonBuffer<200> jsonBuffer;
  JsonObject& root = jsonBuffer.createObject();
  root["value"] = value;
  char buffer[256];
  root.printTo(buffer);
  return buffer;
}
String generateRegister(String ip, String identifier){
  StaticJsonBuffer<200> jsonBuffer;
  JsonObject& root = jsonBuffer.createObject();
  root["id"] = identifier;
  root["ip"] = ip;
  char buffer[256];
  root.printTo(buffer);
  return buffer;
}
/*
 * Check if response is valid and no errors are returned (like device blocked)
 */
boolean errorInResponse(String response){
  StaticJsonBuffer<200> jsonBuffer;
  JsonObject& root = jsonBuffer.parseObject(response);
  if (!root.success()){
    return false;
  }
  if(root.containsKey("Status") && root["Status"] == "Error"){
    return false;
  }
  return true;
}

/*
 * Register device at server
 */
boolean registerDevice(){
    Serial.println(generateRegister(ip, identifier));
    String response = httpRequestPost(server + "/register", generateRegister(ip, identifier));
    if(response != HTTP_ERROR_RESPONSE && !errorInResponse(response)){
      
      Serial.println("REGISTERED");
      return true;
    }
    delay(1000);
    return registerDevice();   //retry recursive
}


void setup() {
    Serial.begin(115200);
    // try to connect to wifi until it's succesfull
    while(!connectToWifi(ssid,wifiPass)){
        delay(1000); // Give it some time
        Serial.println("Retrying connecion...");
    }
    registerDevice();
}


void loop() {
  httpRequestPost(server + "/sensor/3", generateBody(10));
  
  while(1){
    delay(1000);
  }
}
