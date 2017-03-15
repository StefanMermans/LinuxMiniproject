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
            SELECT * FROM SENSOR_MEASUREMENTS
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

    // Method for posting a new measurement to the database
    router.post("/sensor/:id", function(req, res){
        try {
            var json_value = req.body;
            var params = req.params;
        } catch (e) {
            res.json({"Status" : "Error", "error":"invalid body/params"});
            return;
        }

        if(req.body.value == null || req.params.id == null){
          res.json({"Status" : "Error", "error":"missing params"});
          console.log("missing params! " + req.body);
          return;
        }
        var query = `
            INSERT INTO MEASUREMENT (SENSOR_ID, VALUE) VALUES(`+
            mysql.escape(req.params.id) + `,`
            +mysql.escape(req.body.value) + `);`;
        connection.query(query, function(err,rows){
            if(err){
                res.json({"Status" : "Error", "error":"Database Fail!"});
                console.log("SQL Error " + err);
                return;
            } else {
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
