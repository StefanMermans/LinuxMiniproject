var mysql = require("mysql");

function REST_ROUTER(router,connection,md5) {
    var self = this;
    self.handleRoutes(router,connection,md5);
}

// Send a query to the database
function SendQuery(connection,query){
    connection.query(query, function(err,rows){
        if(err){
            res.json({"Status" : "Error"});
            throw err;
        } else {
            res.json({"Status" : "Succes", "Data" : rows});
        }
    });
}

/**
 * Function for checking if json is valid
 * Does try to parse json and returns if parsing failed!
 * /returns boolean which is false if parsing failed and true if parsing was Succes
 * /params string in json format
 */
function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
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
                    throw err;
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
                    throw err;
                } else {
                    res.json({"Status" : "Succes", "Data" : rows});
                }
            });
    });
    
    // Method for posting a new measurement to the database
    router.post("/sensor/:id", function(req, res){

        // checking if json is valid
        // TODO still getting errors when invalid json (because node js is trying to parse before)
        // ERROR BECAUSE REQ.BODY IS THE PARSED JSON VALUE!
        if(IsJsonString(req.body)){
            res.json({"Status" : "Error", "error":"No valid json!"});
        }else{
          // Create a SQL query using mysql.escape for safety reasons.
          var query = `
              INSERT INTO MEASUREMENT (SENSOR_ID, VALUE) VALUES(`+
              mysql.escape(req.params.id) + `,`
              +mysql.escape(req.body.value) + `);`;

              connection.query(query, function(err,rows){
                  if(err){
                      res.json({"Status" : "Error", "error":err});
                      throw err;
                  } else {

                      res.json({"Status" : "Succes"});
                  }
              });
          }
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
                    throw err;
                } else {
                    res.json({"Status" : "Succes", "Data" : rows});
                }
            });
    });
}

module.exports = REST_ROUTER;
