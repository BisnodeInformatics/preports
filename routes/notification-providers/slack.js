var config = require('../../config/environment'),
	clone = require('clone'),
	https = require('https'),
	strTpl = require("string-template");

var //the json object consumed by slack.
	payload = {
		    "text" : "",
		    "icon_url": "https://www.bisnode.de/wp-content/themes/bisnode/images/logo.png",
		    "channel": "",
		    "username":"PReports"
		},
	isLive = true,
	PROVIDER_TYPE = 'slack',
	TEMPLATE = 'Project report for {name} - CW {week}|{year} is available under <{reportUrl}>';

	/**
	* Send notification.
	*
	*/
	exports.send = function(report, callback, reportUrl) {
		//subject, content, recipients, callback

		var errors = [],
			notification,
			//keep track of number of users this is send to as well as the successful calls
			status = {
				usersToNotify: 0,
				send: 0
			},
			slackWebhookUrl,
			recipients;

		report.reportUrl = reportUrl;

		if(!config) {
			console.log('slack.send: config missing');
			return;
		}

		if(!report) {
			console.log('slack.send: Missing report.');
			return;
		}

		if(!config.notificationProviders.slack.host) {
			console.log('slack.send: config has no url');
			return;
		}

		if(!report.settings || !report.settings.notification) {
			console.log('slack.send: no notification settings exist');
			callback(true);
			return;
		}

		//Url for slack webhook
		slackWebhookHost = config.notificationProviders.slack.host;
		slackWebhookPath = config.notificationProviders.slack.path;

		recipients = report.settings.notification.recipients;

		if(!recipients || !recipients.length) {
			console.log('slack.send: report has no recipients');
			return;
		}

		notification = payload;
		notification.text = strTpl(TEMPLATE, report);

		//create one notification for each recipient and send it
		recipients.forEach(function(r) {
			if(r.type == PROVIDER_TYPE && r.email) {
				status.usersToNotify++;

				var slackNotification = clone(notification);

				slackNotification.channel = '@' + r.email;

				//make the call
				var options = {
				  'host': slackWebhookHost,
				  'path': slackWebhookPath,
				  'method': 'POST',
				  'headers': {
				    'Content-Type': 'application/json'
				  }
				};

				var req = https.request(options, function(res) {
				  res.setEncoding('utf8');
				  res.on('end', function() {
				    status.send++;
					if(status.send == status.usersToNotify) {
						if(errors.length > 0) {
							formatErrors(errors);
							callback(false, errors);
						}

						callback(true);
					}
				  })
				});

				req.on('error', function(e) {
				  console.log('problem with request: ' + e.message);
					errors.push(e.message);
					status.send++;
					if(status.send == status.usersToNotify) {
						formatErrors(errors);
						callback(false, errors);
					}
				});

				// write data to request body
				req.write(JSON.stringify(slackNotification));
				req.end();
			}


		});
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
					isLive = true;	
				}				
			})
			.error(function(response) {
				isLive = false;
			});
	}

	/**
	* Format the errors to return to caller.
	*
	*/
	function formatErrors(errors) {
		if(!errors || !errors.length) {
			return;
		}

		//$log.log("Amount of errors " + errors.length);
		//deal with 500 Invalid channel specified
	}
    
