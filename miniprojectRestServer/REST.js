var mysql = require("mysql");
var plotly = require('plotly')("bartmachielsen", "GzsHENwzo5wDDEuw3Wqa");

function REST_ROUTER(router,connection,md5) {
    var self = this;
    self.handleRoutes(router,connection,md5);
}


function UpdateDevice(connection,device_id, device_ip){
    var query =`UPDATE DEVICE SET IP=`+mysql.escape(device_ip)+`
                WHERE ID = ` + mysql.escape(device_id);
    connection.query(query, function(err,rows){
        if(err){
            console.log("COULD NOT UPDATE DEVICE BECAUSE: \n" + err);
        }
    });
}


REST_ROUTER.prototype.handleRoutes= function(router,connection,md5) {
    router.get("/",function(req,res){
        res.json({"Message" : "Hello, welcome to our domotica API"});
    });

    router.get("/sensortype/:type", function(req, res){
        // Create a SQL query using mysql.escape for safety reasons.
        var query = `
            SELECT * FROM COMBINED_MEASUREMENTS
            WHERE SENSOR_TYPE_NAME = `+
            mysql.escape(req.params.type);

            connection.query(query, function(err,rows){
                if(err){
                    res.json({"Status" : "Error"});
                    console.log("SQL Error " + err);
                    return;
                } else {
                    res.json({"Status" : "Succes", "Data" : rows});
                }
            });
    });


    router.get("/sensor/:id", function(req, res){
        // Create a SQL query using mysql.escape for safety reasons.
        res.setHeader('Access-Control-Allow-Origin', '*');
        var query = `
          SELECT ID,VALUE,MEASURED FROM SENSOR_MEASUREMENTS
          WHERE SENSOR_ID = `+
          mysql.escape(req.params.id);

        connection.query(query, function(err,rows){
            if(err){
                res.json({"Status" : "Error"});
                console.log("SQL Error " + err);
                return;
            } else {
                res.json({"Status" : "Succes", "Data" : rows});
            }
        });
    });

/**
*   Method for registering/ device into server
*   Needed values:
*   Body in json containing IP, SENSORS (as identifier)
**/
    router.post("/register", function(req, res){
      // check if valid json
      try {
          var json_value = req.body;
          console.log(json_value);
      } catch (e) {
          res.json({"Status" : "Error", "error":"invalid body/params"});
          return;
      }
      //    check if received all params needed
      if(json_value.ip == null || json_value.sensors == null){
        res.json({"Status" : "Error", "error":"missing params"});
        console.log("missing params! " + req.body);
        return;
      }
        var ip = json_value.ip;
        var sensors = json_value.sensors;

        // get all sensors from database
        connection.query("SELECT * FROM SENSOR", function(err,rows){
            if(err){
                //  no sensors found -->
                res.json({"Status" : "Error"});
                console.log("SQL Error (loading sensors)" + err);
                return;
            } else {
                var found_sensors = [];
                var device_id = -1;
                for(var sensor_id in sensors){
                    var sensor = sensors[sensor_id];
                    var found_db_sensor = null;
                    for(var row_id in rows){
                        var db_sensor = rows[row_id];
                        if(db_sensor["IDENTIFIER"] == sensor){
                            found_db_sensor = db_sensor;
                            break;
                        }
                    }
                    if(found_db_sensor == null){
                        console.log("SENSOR NOT FOUND IN DB ["+sensor + "]");
                        var query =  `INSERT INTO SENSOR (IDENTIFIER) VALUES(`+mysql.escape(sensor)+`)`;
                        console.log(query);
                        connection.query(query, function(err,rows){
                            var new_id = -1;
                            if(err){
                                console.log("COULD NOT INSERT SENSOR BECAUSE: \n" + err);
                            }else{
                                new_id = rows.insertId;
                                console.log(new_id);
                            }
                            found_sensors.push(
                                                {
                                                    "id": sensor,
                                                    "database_id": new_id
                                                }
                                            );
                        });

                        // TODO INSERT INTO SENSOR
                        // TODO CREATE DEVICE

                    }else{
                        if(found_db_sensor["DEVICE_ID"] != 0 && found_db_sensor["DEVICE_ID"] != null){
                            device_id = found_db_sensor["DEVICE_ID"];
                        }
                        // collect found sensors in a neat list
                        found_sensors.push(
                                            {
                                                "id": sensor,
                                                "database_id": found_db_sensor["ID"]
                                            }
                                        );
                    }
                }
                // check if could convert device id
                if(device_id == -1){
                  console.log("INVALID DEVICE ID!");
                  res.json(
                    {
                      "Status" : "Error",
                      "error":"Invalid device id"
                    });
                }else{
                    // confirm registration
                  console.log("DEVICE REGISTERED ["+ device_id +"]");
                  res.json(
                    {
                      "Status" : "Registered",
                      "ip":ip,
                      "device":device_id,
                      "found":found_sensors
                    });
                    UpdateDevice(connection, device_id, ip);
                }
            }

        });
    });
    // Method for posting a new measurement to the database
    router.get("/sensors", function(req, res){
        connection.query("SELECT * FROM SENSOR", function(err,rows){
            if(err){
                res.json({"Status" : "Error"});
                console.log("SQL Error (loading sensors)" + err);
                return;
            }else{
                res.json({"Status":"Succes","Data":rows});
            }
        });
    });


    // Method for posting a new measurement to the database
    router.post("/sensor/:id", function(req, res){
        console.log("REQUEST!");
        try {
            var json_value = req.body;
            var params = req.params;
            var value = req.body.value;
            var id = req.params.id;
            console.log(json_value);
            console.log(params);
        } catch (e) {
            res.json({"Status" : "Error", "error":"invalid body/params"});
            return;
        }

        if(value == null || id == null){
          res.json({"Status" : "Error", "error":"missing params"});
          console.log("missing params! " + req.body);
          return;
        }
        console.log("got a question from stefan..");
        //console.log(req);
        var query = `
            INSERT INTO MEASUREMENT (SENSOR_ID, VALUE) VALUES(`+
            mysql.escape(id) + `,`
            +mysql.escape(value) + `);`;
        console.log(query)
        connection.query(query, function(err,rows){
            if(err){
                res.json({"Status" : "Error", "error":"Database Fail!"});
                console.log("SQL Error " + err);
                return;
            } else {
                console.log("SUCCES!!")
                res.json({"Status" : "Succes"});
            }
        });


    });

    router.get("/device/:id", function(req, res){
        // Create a SQL query using mysql.escape for safety reasons.
        var query = `
            SELECT * FROM DEVICE_SENSORS
            WHERE DEVICE_ID = `+
            mysql.escape(req.params.id);

            connection.query(query, function(err,rows){
                if(err){
                    res.json({"Status" : "Error"});
                    console.log("SQL Error " + err);
                    return;
                } else {
                    res.json({"Status" : "Succes", "Data" : rows});
                }
            });
    });
}

module.exports = REST_ROUTER;
