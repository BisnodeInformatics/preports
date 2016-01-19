'use strict';
angular.module('PReports.services').factory('errorHandler',['$rootScope','$location','$log','language','config', function($rootScope,$location,$log,langService,config) {
	/**
	*	Service to handle callback for errors during Resource methods.(get,save,query, etc.).
	*	
	*	@param {Object} response Object containing response and request data of the failed HTTP request.
	*/
	function handleError(_response, _status, _headers, _config) {
		var response,
			errorKey,
			responseMessage;

		if(arguments.length > 1) {
			response = {};
			response.data = _response;
			response.status = _status;
			response.headers = _headers;
			response.config = _config;
		}
		else if(_response){

			if(_response.hasOwnProperty('data')) {
				response = _response;	
			}
			else {
				response = {
					'data': _response
				}
			}
			
		} else {
			response = {};
		}

		errorKey = (response.data) ? response.data['errorKey'] || response.data : null,
		responseMessage = (response.data) ? response.data['message'] : null;

		$rootScope.error = true;
		// Set the error message to the first valid message out of the following:
		// - translation from the specified error key
		// - translation from the http status code
		// - untranslated message from the response
		// - translated generic error text
		// - placeholder text

		$rootScope.errorMessage = langService.translate(errorKey) || langService.translate('error.'+ response.status)
			|| responseMessage || langService.translate('error.general') || "Error during communication with service.";

		// Log the response.
		$log.error("Error during http method, response object: " + angular.toJson(response));
	}
	
	handleError.reset = function() {
		$rootScope.error = false;
	};

	return handleError;
}]);

/** 
*   @constructor
*   Factory function for the 'notAuthenticatedInterceptor' service.
*   Returns the service. Acts as an interceptor for http requests.
* Decreases the requestCount of authErrorService when a new request starts and sets $rootScope.ajaxLoading 
* 
*   @author Frederik Reifschneider
* @inspiredby https://groups.google.com/forum/#!msg/angular/BbZ7lQgd1GI/GJBTXcJLQMkJ
*/
angular.module('PReports.services').factory('notAuthenticatedInterceptor', ['$log','$q', '$location', function($log, $q, $location) {
    return {
    	response: function(response) {
    		//$log.log("notAuthenticatedInterceptor intercepted successful request with status " + response.status);
            return response;
    	},
    	responseError: function(response) {
    		if (response.status === 401) {
                	$log.log("Request not authenticated status 401. Redirecting to login!");
		        	window.location.href = '//' + $location.host() + ':' + $location.port() + '/login';
		        }
                return $q.reject(response);
    	}
    };
}]);

/**
* Add angular.module('PReports.services').notAuthenticatedInterceptor as $http interceptor.
*/
angular.module('PReports.services').config(['$httpProvider', function($httpProvider) {
  $httpProvider.interceptors.push('notAuthenticatedInterceptor');
}]);
