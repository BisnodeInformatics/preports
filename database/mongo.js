/**
* Helper class that init db connection and can be reused accros the application.
*/
var mongo = require('mongodb'),
	test = require('assert'),
	Db,
	Connection,
	Server,
	ObjectID,
	db;

//setup mongo variables
Db = mongo.Db;
Connection = mongo.Connection;
Server = mongo.Server;
BSON = mongo.BSON;
ObjectID = mongo.ObjectID;
MongoClient = mongo.MongoClient; 



exports.connect = function(connectionUrl) {

	console.log("Connecting to db: " + connectionUrl);

    MongoClient.connect(connectionUrl, function(err, _db) {
        test.equal(null, err); 
        test.ok(_db != null);
        console.log("Connected to 'project report' database");
        db = _db;
        createIndexes();
    });
};

exports.getDB = function() {
	return db;
}

/**
* Creates all indexes used by preports.
*/
function createIndexes() {
	getReportsCollection(doCreate);


	function doCreate(err, col) {
		if(err) {
			 console.log('createIndexes: ' + err);
			 return;
		}		

		col.createIndex('searchIndex',{
			'year' : 1,
			'name' : 1
		}, function(err, indexName) {
			if(err) {
				 console.log('createIndexes: failed to create index ' + err);
				 return;
			}	
			console.log('createIndexes: created index ' + indexName);
		});

	}
}

getReportsCollection = function(callback) {
	 db.collection('reports', function(error, reports_collection) {
    	if( error ) {
    		console.log('getReportsCollection: error');
    		callback(error);
    	} else if(!reports_collection) {
    		console.log('getReportsCollection: creating collection reports');
    		db.createCollection('reports', function(_err, _collection) {
    			callback(_err, _collection);
    		});
    	} else {
    		callback(null, reports_collection);
    	}
 	 });
}