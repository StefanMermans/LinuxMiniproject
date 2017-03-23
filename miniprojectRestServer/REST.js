var mysql = require("mysql");

function REST_ROUTER(router,connection,md5) {
    var self = this;
    self.handleRoutes(router,connection,md5);
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
        var query = `
          SELECT ID,VALUE FROM SENSOR_MEASUREMENTS
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

    router.post("/register", function(req, res){
      try {
          var json_value = req.body;
          var params = req.params;
      } catch (e) {
          res.json({"Status" : "Error", "error":"invalid body/params"});
          return;
      }

      if(req.body.ip == null){
        res.json({"Status" : "Error", "error":"missing params"});
        console.log("missing params! " + req.body);
        return;
      }

        var ip = req.body.ip;
        var device_id = null;
        var sensors = req.body.sensors;
        connection.query("SELECT * FROM SENSOR", function(err,rows){
            if(err){
                res.json({"Status" : "Error"});
                console.log("SQL Error " + err);
                return;
            } else {
                var found_sensors = [];
                console.log(rows);
                for (var row in rows) {
                  var found = null;
                  var db_sensor = rows[row];
                  for(var sensor in sensors){
                    console.log("SENSOR RECEIVED:" + sensor);
                    console.log(db_sensor);
                    if(sensor == db_sensor["IDENTIFIER"]){
                      found = db_sensor;
                      device_id = db_sensor["DEVICE_ID"];
                      break;
                    }
                  }
                  if(found != null){
                    console.log(found);
                    console.log("FOUND SENSOR");
                    found_sensors.push({"id":found["IDENTIFIER"],"database_id":found["ID"]});
                  }
                }
                console.log(found_sensors);
                if(device_id == null){
                  console.log("INVALID DEVICE ID!");
                  res.json(
                    {
                      "Status" : "Error",
                      "error":"Invalid device id"
                    });
                }else{
                  console.log("DEVICE REGISTERED ["+ device_id +"]");
                  res.json(
                    {
                      "Status" : "Registered",
                      "ip":ip,
                      "device":device_id,
                      "found":found_sensors
                    });
                }
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
