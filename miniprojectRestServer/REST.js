function REST_ROUTER(router,connection,md5) {
    var self = this;
    self.handleRoutes(router,connection,md5);
}

REST_ROUTER.prototype.handleRoutes= function(router,connection,md5) {
    router.get("/",function(req,res){
        res.json({"Message" : "Hello World !"});
    })
    router.get("/test", function(req, res){
	res.json({"Message" : "No hello world!"});
    })
}

module.exports = REST_ROUTER;
