'use strict';

PReports.ReportCtrl =  function ($scope, $location, $routeParams, Report, $log, $http, $fileUploader, config, errorHandler, $rootScope, language, $timeout, $interval) {

    var REPORT_DELETE_TIMEOUT = 5000;

    /**
    * Size of the command queue that holds undo events.
    */
    $scope.COMMAND_QUEUE_SIZE = 20;

  	$scope.reports = [];

    $scope.currentReport = null;

  	$rootScope.search = $rootScope.search || {};

    $rootScope.search.year = ($rootScope.search.hasOwnProperty('year')) ? $rootScope.search.year : (new Date()).getFullYear();
    $rootScope.search.calweek = ($rootScope.search.hasOwnProperty('calweek')) ? $rootScope.search.calweek : getWeek(new Date());
    $rootScope.search.name = ($rootScope.search.hasOwnProperty('name')) ? $rootScope.search.name : '';
  	
  	$scope.calWeeks = [];

  	$scope.config = config;

  	$scope.projectNames = [];

  	//show 404 message
     $scope.reportNotFound = false;

     /**
     * List of executed commands during report editing
     */
     $scope.commands = [];


    //Report Structure

    /*
      {
        name: 'IPM',
        leadDevelopers: 'Fred und Guido',
        projectManagers: 'Meike Rieken',
        start: '2013-01-01'
        golive: '2014-10-31'
        milestones: [
          {
            name: 'Manual Matching',
            start: '2013-11-27',
            end: '2014-03-24'
          }
        ],
        lastWeekTasks: 'String',
        nextWeekTasks: 'String',
        identifiedPotentials: 'String',
        risksAndImpediments: 'String',
        codeReviews: [
          {
            authors: 'Fred',
            underReview: 'Data Migration',
            results: 'String'
          }
        ]
      }
    */

  	//fill calendar weeks
  	for (var i = 1; i < 53; i++) {
  		$scope.calWeeks.push({
  			'week' : i
  		});
  	};


  	$scope.loadReports = function() {
  		console.log('loadReports');
  		$scope.reports = Report.query({
  			'year': $rootScope.search.year,
  			'calweek' : $rootScope.search.calweek
  		}, function() {
  			$('.copy-button').tooltip();
  		}, errorHandler);
  	}

    $scope.loadReport =  function(id) {
      if(!id) {
        $log.log('loadReport: No Id provided.');
        return;
      }
      //show 404 message
      $scope.reportNotFound = false;

      $scope.currentReport = Report.get({'id':id}, function() {      	
      	setupFileUpload();
      }, function(httpResponse) {
      	$scope.reportNotFound = true;
      	errorHandler(httpResponse);
      });

      //Watch changes for year and week because ng-change on select doesn't provide old value
      $scope.$watch("currentReport.year", function(newVal, oldVal) {
        if(newVal && newVal != oldVal) {

        }
      });

      $scope.$watch("currentReport.week", function(newVal, oldVal) {
        if(newVal && newVal != oldVal) {

        }
      });

    }

    $scope.showReport = function(id, event) {
      if(!id || !event) {
        return;
      }

      if(event.target.tagName != "TD") {
        //user clicked action button or link, so do nothing!
        return;
      }

      $location.path('reports/' + id);
    }

  	$scope.createNewReport = function() {
  		var newReport = {},
          date = new Date();

      newReport.year = date.getFullYear();
      newReport.week = getWeek(date);
      newReport.name = $scope.newReportName;

      newReport.milestones = [];

      saveReport(newReport);
  	}

    /**
    * Update $scope.currentReport by persisting changes.
    * @param {String} modifiedProperty
    *   Property that has been modified.
    * @param {String} prevValue
    *   Previous value used for undo.
    * TODO document all param
    */
  	$scope.updateReport = function(modifiedProperty, prevValue, isArray, index, arrayName) {
      var updateCommand = {
        mP: modifiedProperty,
        pV: prevValue,
        iA: isArray,
        i: index,
        aN: arrayName
      };

  		if(!$scope.currentReport) {
  			console.log('updateReport: no current report');
  			return;
  		}
  		
      //always convert to int before saving
      convertYearAndWeekToInt($scope.currentReport);

      updateCommand.execute = function() {
        $scope.currentReport.$update();  
      }

      //only add update command when a modified property exists
      if(updateCommand.mP) {
        updateCommand.undo = function() {
          if(isArray && typeof index == 'number' && arrayName) {
            $scope.currentReport[arrayName][index][updateCommand.mP] = updateCommand.pV;
            // modifiedEntity[updateCommand.mP] = updateCommand.pV;
          } else {
            $scope.currentReport[updateCommand.mP] = updateCommand.pV;  
          }
          $scope.currentReport.$update();
        }
      }      

      storeAndExecute(updateCommand);
  	}

  	$scope.deleteReport = function(report) {
      $scope.reportToDelete = report || $scope.currentReport;

  		if(!$scope.reportToDelete) {
  			console.log('deleteReport: no report to delete');
  			return;
  		}

      $scope.remainingSecondsBeforeDoomsday = Math.round(REPORT_DELETE_TIMEOUT/1000);
      $scope.deleteTimer = true;      

      $scope.doomsdayInterval = $interval(countDown, 1000, $scope.remainingSecondsBeforeDoomsday + 1);

      function killTheReport() {      
        $scope.reportToDelete.$delete(function() {
          $scope.reportToDelete = null;
          if($location.path() == '/reports') {
            angular.forEach($scope.reports, function(r, index) {
              if($scope.reportToDelete._id == r._id) {
                $scope.reports.splice(index, 1);
                //exit loop
                return false;
              }
            });
          } else {
            $location.path('/');
          }
        }, errorHandler);        
      }     

      function countDown() {
        if($scope.remainingSecondsBeforeDoomsday > 0) {
          $scope.remainingSecondsBeforeDoomsday = $scope.remainingSecondsBeforeDoomsday - 1;  
        } else {
          $scope.deleteTimer = false;
          killTheReport();
        }  
      }  		
  	}

     $scope.delayDoomsday = function() {
      $scope.deleteTimer = false;

      if($scope.doomsdayInterval) {        
        $interval.cancel($scope.doomsdayInterval);
        $scope.doomsdayInterval = null;  
      }        
    }

    function saveReport(report) {
      var resource;

      if(!report) {
        console.log('saveReport: no report given');
        return;
      }

      resource = new Report(report);

      if(report._id) {
        //error
      } else {
        //new
        resource.$create(function(saved) {
          console.log('saved new report');
          //$scope.loadReports();
          $scope.newReportName = null;
          $location.path('reports/' + resource._id)
          
        }, function(response) {
          alert('could not save report')
        });
        
      }
    }

    function getWeek(date) {
        var onejan = new Date(date.getFullYear(), 0, 1);
        return Math.ceil((((date - onejan) / 86400000) + onejan.getDay() + 1) / 7);
    }

    /**
    * Add a new milestone to currentReport.
    */
    $scope.addMilestone = function() {
      var updateCommand = {};

    	if(!$scope.currentReport) {
  			console.log('addMilestone: no current report');
  			return;
  		}

  		if(!$scope.currentReport.milestones) {
  			$scope.currentReport.milestones = [];
  		}

      convertYearAndWeekToInt($scope.currentReport);

      updateCommand.execute = function() {
        $scope.currentReport.milestones.push({
          name: 'New milestone'
        });
        $scope.currentReport.$update();
      }

      updateCommand.undo = function() {
        $scope.currentReport.milestones.pop();
        $scope.currentReport.$update();
      }

      storeAndExecute(updateCommand);
    }

    /**
    * Remove milestone from currentReport.
    * @param {Integer} index
    *   Index of milestone to remove in currentReport.milestones.
    */
    $scope.removeMilestone = function(index) {
      var updateCommand = {},
          milestoneToRemove;

    	if(!$scope.currentReport) {
  			console.log('addMilestone: no current report');
  			return;
  		}

  		if(!index && index !== 0) {
  			console.log('addMilestone: no index given');
  			return;
  		}

  		if(!$scope.currentReport.milestones || $scope.currentReport.milestones.length == 0 || !$scope.currentReport.milestones[index]) {
  			return;
  		}
  		

      convertYearAndWeekToInt($scope.currentReport);

      updateCommand.execute = function() {
        milestoneToRemove = $scope.currentReport.milestones[index];
        $scope.currentReport.milestones.splice(index, 1);
        $scope.currentReport.$update();
      }

      updateCommand.undo = function() {
        $scope.currentReport.milestones.splice(index, 0, milestoneToRemove);
        $scope.currentReport.$update();
      }

      storeAndExecute(updateCommand);

    }

    /**
    * Adds a new code review to currentReport.codeReviews.
    *
    */
    $scope.addCodeReview = function() {
      var updateCommand = {};

    	if(!$scope.currentReport) {
  			console.log('addCodeReview: no current report');
  			return;
  		}

  		if(!$scope.currentReport.codeReviews) {
  			$scope.currentReport.codeReviews = [];
  		}

      convertYearAndWeekToInt($scope.currentReport);

      updateCommand.execute = function() {
        $scope.currentReport.codeReviews.push({
          authors: 'Add authors',
        });
        $scope.currentReport.$update();
      }

      updateCommand.undo = function() {
        $scope.currentReport.codeReviews.pop();
        $scope.currentReport.$update();
      }

      storeAndExecute(updateCommand);
    }

    /**
    * Removes a code review from currentReport.
    * @param {Integer} index
    *   Index of code review to remove.
    */
    $scope.removeCodeReview = function(index) {
      var updateCommand = {},
          codeReviewToRemove;

    	if(!$scope.currentReport) {
  			console.log('removeCodeReview: no current report');
  			return;
  		}

  		if(!index && index !== 0) {
  			console.log('removeCodeReview: no index given');
  			return;
  		}

  		if(!$scope.currentReport.codeReviews || $scope.currentReport.codeReviews.length == 0 || !$scope.currentReport.codeReviews[index]) {
  			return;
  		}

      convertYearAndWeekToInt($scope.currentReport);

      updateCommand.execute = function() {
        codeReviewToRemove = $scope.currentReport.codeReviews[index];
        $scope.currentReport.codeReviews.splice(index, 1);
        $scope.currentReport.$update();
      }

      updateCommand.undo = function() {
        $scope.currentReport.codeReviews.splice(index, 0, codeReviewToRemove);
        $scope.currentReport.$update();
      }

      storeAndExecute(updateCommand);
    }

    /**
    * Adds a system (DEV, QA ...) currentReport.systems.
    *
    */
    $scope.addSystem = function() {
      var updateCommand = {};

      if(!$scope.currentReport) {
        console.log('addSystem: no current report');
        return;
      }

      if(!$scope.currentReport.systems) {
        $scope.currentReport.systems = [];
      }

      convertYearAndWeekToInt($scope.currentReport);

      updateCommand.execute = function() {
        $scope.currentReport.systems.push({
        });

        $scope.currentReport.$update();
      }

      updateCommand.undo = function() {
        $scope.currentReport.systems.pop();
        $scope.currentReport.$update();
      }

      storeAndExecute(updateCommand);
    }

    /**
    * Removes a system from currentReport.
    * @param {Integer} index
    *   Index of system to remove.
    */
    $scope.removeSystem = function(index) {
      var updateCommand = {},
          systemToRemove;

      if(!$scope.currentReport) {
        console.log('removeSystem: no current report');
        return;
      }

      if(!index && index !== 0) {
        console.log('removeSystem: no index given');
        return;
      }

      if(!$scope.currentReport.systems || $scope.currentReport.systems.length == 0 || !$scope.currentReport.systems[index]) {
        return;
      }

      convertYearAndWeekToInt($scope.currentReport);

      updateCommand.execute = function() {
        systemToRemove = $scope.currentReport.systems[index];
        $scope.currentReport.systems.splice(index, 1);
        $scope.currentReport.$update();
      }

      updateCommand.undo = function() {
        $scope.currentReport.systems.splice(index, 0, systemToRemove);
        $scope.currentReport.$update();
      }

      storeAndExecute(updateCommand);
    }

    $scope.deleteReportImage = function(image) {
    	if(!image) {
    		console.log('deleteReportImage: no image given');
    		return;
    	}

    	if(!$scope.currentReport) {
  			console.log('deleteReportImage: no current report');
  			return;
  		}

    	$http.delete(config.getCombinedServiceUrl() + '/reports/' + $scope.currentReport._id + '/images/' + image._id).
      	success(function(data, status, headers, config) {
    			angular.forEach($scope.currentReport.images, function(object, index) {
    				if(object._id  == image._id) {
    					$scope.currentReport.images.splice(index, 1);
    					return false;
    				}
    			});
  		  }).error(errorHandler);
    }

    $scope.printReport = function() {
      
      if(!$scope.currentReport) {
        console.log('printReport: no current report');
        return;
      }

      window.print();
    }

    function setupFileUpload() {
     var uploader = $scope.uploader = $fileUploader.create({
            scope: $scope,                          // to automatically update the html. Default: $rootScope
            url: config.getCombinedServiceUrl() + '/reports/' + $scope.currentReport._id + '/images',
            alias: 'image',
            removeAfterUpload: true,
            autoUpload: false,
            filters: [
                function (item) {
                    var type = uploader.isHTML5 ? item.type : '/' + item.value.slice(item.value.lastIndexOf('.') + 1);
		            type = '|' + type.toLowerCase().slice(type.lastIndexOf('/') + 1) + '|';
		            return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
                }
            ]
        });

     	uploader.bind('completeall', function (event, items) {
      		//reload report
            $scope.loadReport($scope.currentReport._id);
        });

        uploader.bind('error', function( event, xhr, item, response) {
        	console.log('setupFileUpload: upload failed');
        	//show global error. for more information have a look inside the errorHandler
        	$rootScope.error = true;
        	$rootScope.errorMessage = language.translate('error.image.upload') || 
        		language.translate('error.general') || 
        		"Error during communication with service.";
        });
 	}

 	$scope.copyReport = function(reportToCopy) {
 		if(!reportToCopy) {
    		console.log('copyReport: no reportToCopy given');
    		return;
    	}

    	//link to original report
    	reportToCopy.copyOf = reportToCopy._id;
    	delete reportToCopy._id;

    	reportToCopy.name = reportToCopy.name +'_copy';

    	saveReport(reportToCopy);
 	}

  /**
  * Stores command in queue and executes it.
  * @param {Function} command
  *   Object with execute and undo function.
  */
  function storeAndExecute(command) {
    var undoFn = true;

    if(!command) {
      $log.log('storeAndExecute: no command given');
      return;
    }

    if(typeof command != 'object') {
      $log.log('storeAndExecute: command is not an object');
      return; 
    }

    if(!command.hasOwnProperty('execute') || typeof command.execute != 'function') {
      $log.log('storeAndExecute: no execute method found or not a function');
      return; 
    }

    if(!command.hasOwnProperty('undo') || typeof command.undo != 'function') {
      $log.log('storeAndExecute: no undo method found or not a function. Command not added to queue.');
      undoFn = false;
    }

    if(undoFn) {
      if($scope.commands.length == $scope.COMMAND_QUEUE_SIZE) {
        //only store last $scope.COMMAND_QUEUE_SIZE commands
        $scope.commands = $scope.commands.slice(1);
        $scope.commands.push(command);
      } else {
        $scope.commands.push(command);  
      }  
    }

    try {
      command.execute();
    } catch(e) {
      $log.log('storeAndExecute: failed to execute command. ' + e);
      $scope.commands.pop(command);
      alert('commmand execution failed!');
    }
    
  }

  /**
  * Undo last action by executing undo on latest command.
  * Afterwards remove the command from array.
  */
  $scope.removeAndUndoLastCommand = function() {
      var commandToUndo;

      if($scope.commands.length > 0) {
        commandToUndo = $scope.commands.pop();
        commandToUndo.undo();  
      } else {
        $log.log('removeAndUndoLastCommand: no commands in queue');
      }
      
  }

 	function loadProjectNames() {
 		$http.get($scope.config.getCombinedServiceUrl() + '/reports/names').success(function(data, status, headers, config) {
 			$scope.projectNames = data;
 		}).error(errorHandler);
 	}

  /**
  * Converts year and week of a report to Int.
  */
  function convertYearAndWeekToInt(report) {
    if(!report) {
      console.log('convertCalAndWeekToInt: no report given');
      return;
    }

      //always convert to int before saving
      report.year = parseInt(report.year);
      report.week = parseInt(report.week);
  }

  	
    //initially load reports or report entity based on url
    if($routeParams.reportId) {
      $scope.loadReport($routeParams.reportId);
    } else {
      $scope.loadReports();
      loadProjectNames();
      //Enable tooltip watch on copy buttons
      // $scope.$watch('reports', function() {
      // 	$('.copy-button').tooltip();	
      // });
      
    }
  
  }

PReports.ReportCtrl.$inject = ['$scope', '$location', '$routeParams', 'Report', '$log', '$http', '$fileUploader', 'config', 'errorHandler', '$rootScope', 'language', '$timeout', '$interval'];