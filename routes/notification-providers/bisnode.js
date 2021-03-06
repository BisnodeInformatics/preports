var config = require('../../config/environment'),
	clone = require('clone'),
	http = require('http'),
	strTpl = require("string-template"),
	logger = require('../../components/logger');

/**
* Services that interacts with Bisnode NotificationService.
*
*/

	var _service = {},
		//the json object consumed by bisnode notification service.
		notificationRequest = {
			"notifications":[
				{
			       "rawNotification":{
			        "notificationDeliveryMode": "EMAIL",
			          "recipients":[
			             // {
			             	//contains all remail recipients
			                // "emailRecipient":{
			                //    "email":"frederik.reifschneider@bisnode.com"
			                // }
			             // }
			          ],
			          "content": "",
			          "subject": ""
			       }
			    }
			]},
	    contentLangKey = "notification.content.template",
	    subjectLangKey = "notification.subject.template",
	    isLive = true,
		PROVIDER_TYPE = 'bisnode',
		SUBJECT_TPL = 'Project report {name} CW {week}|{year}',
		TEMPLATE = 'Project report for {name} - CW {week}|{year} is available under'+
			' {reportUrl} This is an automatically generated notification from preports.';

	/**
	* Send notification.
	*
	*/
	exports.send = function(report, callback, reportUrl) {

		if(!config || !config.notificationProviders) {
			logger.info('PReports.services.com-bisnode-notification.send: config missing');
			callback(true);
			return;
		}

		if(!config.notificationProviders.bisnode) {
			logger.info('PReports.services.com-bisnode-notification.send: config has no url');
			callback(true);
			return;
		}
		
		var notification = notificationRequest.notifications[0].rawNotification,
			handle = false;

		report.reportUrl = reportUrl;
		notification.subject = strTpl(SUBJECT_TPL, report);		
		notification.content = strTpl(TEMPLATE, report);
		notification.recipients = [];
		recipients = report.settings.notification.recipients;

		//Url for slack webhook
		serviceHost = config.notificationProviders.bisnode.host;
		servicePath = config.notificationProviders.bisnode.path;
		servicePort = config.notificationProviders.bisnode.port;

		recipients.forEach(function(r) {
			if(r.type == PROVIDER_TYPE && r.email) {
				notification.recipients.push({
					'emailRecipient': r.email
				});
				handle = true;
			}			
		});
		
		if(handle) {
			logger.info('Sending bisnode notification.');

				//make the call
				var options = {
				  'host': serviceHost,
				  'path': servicePath,
				  'port' : servicePort,
				  'method': 'POST',
				  'headers': {
				    'Content-Type': 'application/json'
				  }
				};


				var req = http.request(options, function(res) {
				  res.setEncoding('utf8');
				  res.on('data', function (chunk) {
				    logger.info('BODY: ' + chunk);			    
				  });
				  res.on('end', function() {
				  	logger.info('bisnode.send: succesfully send notifications');
				    callback(true);
				  })
				});

				req.on('error', function(e) {
				  logger.info('problem with request: ' + e.message);
				  //$log.error("Failed so send slack notification for user " + r + ". Status: " + response.status);
					callback(false, e);
				});

				// write data to request body
				req.write(JSON.stringify(notificationRequest));
				req.end();
			} else {
				logger.info('bisnode.send: No handlers found.');
				callback(true);
			}
		
	}

	exports.getProviderType = function() {
		return PROVIDER_TYPE;
	}



	/**
	* Check if service is online.
	*/
	function checkIsLive(url) {
		$http.get(url)
			.success(function(response) {
				if(response.status !== 0) {
					_service.isLive = true;	
				}				
			})
			.error(function(response) {
				_service.isLive = false;
			});
	}
    

