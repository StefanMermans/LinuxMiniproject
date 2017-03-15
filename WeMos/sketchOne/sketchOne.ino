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

int status;
char * ip;

/**
Connect to a wifi source
@param ssid: The ssid of the desired wifi source
@param password: the password of the desired wifi source
@return 1 if succesfull else 0
*/
int connectToWifi(char * ssid, char * password){
    ip = "http://192.168.42.1:3000/sensor/1"; // TODO not hardcoded

    Serial.println("Connecting to: ");
    Serial.print(ssid);

    WiFi.begin(ssid,password);

    status = WiFi.waitForConnectResult();
    if(status != WL_CONNECTED){
        Serial.println("Connecton failed...");
        return 0;
    } else{
        Serial.println("Connected.");
        Serial.print("MAC Addr: ");
        Serial.println(WiFi.macAddress());
        Serial.print("IP Addr:  ");
        Serial.println(WiFi.localIP());
        Serial.print("Subnet:   ");
        Serial.println(WiFi.subnetMask());
        Serial.print("Gateway:  ");
        Serial.println(WiFi.gatewayIP());
        Serial.print("DNS Addr: ");
        Serial.println(WiFi.dnsIP());
        Serial.print("Channel:  ");
        Serial.println(WiFi.channel());
        Serial.print("Status: ");
        Serial.println(WiFi.status());
        return 1;
    }
}

void setup() {
    char * ssid = "AwesomeNetwork";
    char * wifiPass = "AwesomePi";

    Serial.begin(115200);

    // try to connect to wifi until it's succesfull
    while(!connectToWifi(ssid,wifiPass)){
        delay(1000); // Give it some time
        Serial.println("Retrying connecion...");
    }
}

void loop() {
  HTTPClient httpClient;
//
//  httpClient.begin(ip);
//
//  int httpCode = httpClient.GET();
//
//  Serial.println("Http response code: ");
//
  httpClient.begin(ip);

  int httpCode = httpClient.POST("{ 'value' : 2 }");
  
  if(httpCode == HTTP_CODE_OK){
      String payload = httpClient.getString();
      Serial.println("Http got: ");
      Serial.print(payload);
  }else{
      Serial.print(httpClient.errorToString(httpCode));
  }

  httpClient.end();  
}
