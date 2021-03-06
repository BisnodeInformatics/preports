'use strict';

angular.module('PReports').controller('ReportCtrl', ['$scope',
  '$location',
  '$routeParams',
  'Report',
  '$log',
  '$http',
  'FileUploader',
  'config',
  'errorHandler',
  '$rootScope',
  'language',
  '$timeout',
  '$interval',
  '$interpolate',
  'helper',
  'hotkeys',
  'notification',
  'commandService',
  '$q',
  'reportsService',
  function($scope, $location, $routeParams, Report, $log, $http, FileUploader, config,
    errorHandler, $rootScope, language, $timeout, $interval, $interpolate,
    helper, hotkeys, notificationService, commandService, $q, reportsService) {

    var REPORT_DELETE_TIMEOUT = 3000;

    /**
    * Reports retrieved after search.
    */
    $scope.reports = [];
    $scope.currentReport = null;
    $scope.years = null;
    
    $scope.config = config;

    $scope.projectNames = [];

    //show 404 message
    $scope.reportNotFound = false;

    $scope.commandService = commandService;
    commandService.reset();

    /**
    * The currently via arrow keys selected row in the UI.
    */
    $scope.selectedReportSearchRow = null;

    /**
    * Notification providers available for use.
    */
    $scope.notificationProviders = null;
    
    //Function to load an individual report.
    $scope.loadReport = loadReport;
    
    $scope.loadReports = loadReports;
    
    $scope.createNewReport = createNewReport;

    $scope.language = language;
    
    activate();

    $scope.sortList = function(property) {

      if(!property) {
        return;
      }

      if(property != $rootScope.search.sortProperty) {
        $rootScope.search.sortDirection = 'asc';
        $rootScope.search.sortProperty = property;
      } else {
        if($rootScope.search.sortDirection == 'asc') {
          $rootScope.search.sortDirection = 'desc';
        } else {
          $rootScope.search.sortDirection = 'asc';
        }        
      }

      $scope.loadReports();

    }

    function updateSortableOptions() {
      /**
       * Options used for sortable elements.
       *
       */
      $scope.reportSortableOptions = {
        disabled: $scope.isReportLocked(),
        axis: 'y',
        update: function(event, ui) {
          var updateCommand = {},
              defer = $q.defer(),
              deferUndo = $q.defer(),
              oldOrder = angular.copy($scope.currentReport.milestones);

          updateCommand.promise = defer.promise;
          updateCommand.undoPromise = deferUndo.promise;

          updateCommand.execute = function() {
            $scope.currentReport.$update().then(function() {
              defer.resolve();
            }).catch(function(response) {
              handleUpdateError(response, defer);
            });
          };

          updateCommand.undo = function() {
            $scope.currentReport.milestones = oldOrder;
            $scope.currentReport.$update().then(function() {
              deferUndo.resolve();
            }).catch(function() {
              handleUpdateError(response, deferUndo);
            });
          };

          function arraymove(arr, fromIndex, toIndex) {
            var element = arr[fromIndex];
            arr.splice(fromIndex, 1);
            arr.splice(toIndex, 0, element);
          }

          storeAndExecute(updateCommand);
        }
      };
    }
    

    function loadReports(direction, searchParams) {
      var page;
      
      $log.debug('loadReports');

      $scope.selectedReportSearchRow = null;

      fillWeeks($rootScope.search.year);

      if ($scope.reportsWrapper && $scope.reportsWrapper._links) {
        if (direction == 'next' && $scope.reportsWrapper._links.next) {
          $http.get(config.getCombinedServiceUrl() + $scope.reportsWrapper._links.next.href).success(function(wrapper) {
            $scope.reportsWrapper = wrapper;
            $scope.reports = wrapper.reports;
            $rootScope.search.page = wrapper.currentPage - 1;
            updateAddressBarWithSearchParams($rootScope.search);
          }).error(errorHandler);
          return;
        } else if (direction == 'prev' && $scope.reportsWrapper._links.prev) {
          $scope.reportsWrapper = $http.get(config.getCombinedServiceUrl() + $scope.reportsWrapper._links.prev.href).success(function(wrapper) {
            $scope.reportsWrapper = wrapper;
            $scope.reports = wrapper.reports;
            $rootScope.search.page = wrapper.currentPage - 1;
            updateAddressBarWithSearchParams($rootScope.search);
          }).error(errorHandler);
          return;
        }
      }
      
      reportsService.getReports($rootScope.search)
        .then(function(reportsWrapper) {
            $log.debug("success callback getReports");
            $scope.reportsWrapper = reportsWrapper;            
            $scope.reports = $scope.reportsWrapper.reports;
            //page is  based
            $rootScope.search.page = $scope.reportsWrapper.currentPage - 1;
            updateAddressBarWithSearchParams($rootScope.search);
        })
        .catch(function(response) {
            errorHandler(response);
        });
    }

    function updateAddressBarWithSearchParams(searchParams) {
      var reportQuery = normalizeSearchParameters(searchParams);
      $location.search(reportQuery);
    }

    function extractSearchParamsFromAddressBar() {

      var searchParams = $location.search(),
          normalized;

      if(Object.keys(searchParams).length == 0)
        return;
      
      normalized = normalizeSearchParameters(searchParams);
      
      $rootScope.search = normalized;
    }

    function normalizeSearchParameters(searchParams) {
      var reportQuery = {};

      if(searchParams) {
              if(searchParams.week) {
                reportQuery.week = parseInt(searchParams.week);
              }
              
              if(searchParams.year) {
                reportQuery.year = parseInt(searchParams.year);
              } else {
                reportQuery.year = (new Date()).getFullYear();
              }

              if(searchParams.name) {
                reportQuery.name = searchParams.name;
              }

              if(searchParams.page) {
                reportQuery.page = searchParams.page;
              }

            if(searchParams.sortDirection) {
                reportQuery.sortDirection = searchParams.sortDirection;
            }

             if(searchParams.sortProperty) {
                reportQuery.sortProperty = searchParams.sortProperty;
            }
      }

      return reportQuery;
    }

    /**
     * Registers change listeners for search form.
     * Fields to watch
     *  - name
     *  - year
     *  - week
     */
    function registerWatchForSearch() {
      var tempFilterText = '',
        filterTextTimeout,
        tmpHandle,
        tmpMaxWeekOldYear,
        tmpMaxWeekNewYear;

      $log.debug('registerWatchForSearch');

      if (!$rootScope.watchHandles) {
        $rootScope.watchHandles = [];
      }

      tmpHandle = $rootScope.$watch('search.name', function(newVal, oldVal) {
        if (newVal != oldVal) {
          if (filterTextTimeout) $timeout.cancel(filterTextTimeout);

          tempFilterText = newVal;
          filterTextTimeout = $timeout(function() {
            $scope.filterText = tempFilterText;
            $rootScope.search.page = 0;
            $scope.loadReports();
          }, 250);
        }
      });

      $rootScope.watchHandles.push(tmpHandle);

      tmpHandle = $rootScope.$watch('search.year', function(newVal, oldVal) {
        if (newVal != oldVal) {
          $rootScope.search.page = 0;
          tmpMaxWeekOldYear = helper.getMaxWeeksPerYear(oldVal);
          //if max week was selected, recalculate week. This will trigger
          if($rootScope.search.week === tmpMaxWeekOldYear) {
            tmpMaxWeekNewYear = helper.getMaxWeeksPerYear(newVal);
            if(tmpMaxWeekOldYear > tmpMaxWeekNewYear) {
              //will trigger the watch on search.week and therefore call loadReports
              $rootScope.search.week = tmpMaxWeekNewYear;  
            } else {
              $scope.loadReports();
            }
          } else {
            $scope.loadReports();
          }
        }
      });

      $rootScope.watchHandles.push(tmpHandle);

      tmpHandle = $rootScope.$watch('search.week', function(newVal, oldVal) {
        if (newVal != oldVal) {
          $rootScope.search.page = 0;
          $scope.loadReports();
        }
      });

      $rootScope.watchHandles.push(tmpHandle);
    }

    /**
     * Unregister all change listeners for search form.
     *
     */
    function unregisterWatchForSearch() {
      if ($rootScope.watchHandles && $rootScope.watchHandles.length > 0) {
        angular.forEach($rootScope.watchHandles, function(handle) {
          handle();
        });
      }

      $rootScope.watchHandles = [];
    }

    /**
     * Load a single report. Sets $scope.currentReport with result.
     * @param {String} id
     *   Id of report to load.
     */
    function loadReport(id) {
      if (!id) {
        $log.log('loadReport: No Id provided.');
        return;
      }
      //show 404 message
      $scope.reportNotFound = false;

      $scope.currentReport = Report.get({
        'id': id
      }, function() {
        fillWeeks();
        updateSortableOptions();
      }, function(httpResponse) {
        $scope.reportNotFound = true;
        errorHandler(httpResponse);
      });
    }

    /**
     * Reloads current report after external modifications.
     * @param {Boolean} redoLastModification
     *   If true reapplies the last issued command.
     */
    $scope.reloadReport = function(redoLastModification) {
      if (!$scope.currentReport) {
        $log.log('loadReport: No currentReport.');
        return;
      }

      //show 404 message
      $scope.reportNotFound = false;

      $scope.currentReport = Report.get({
        'id': $scope.currentReport._id
      }, function() {
        // if ($scope.commands && $scope.commands.length > 0) {
          //TODO redo last action not ready for primetime yet! Undo must also be taken into account!
          // if(redoLastModification) {           
          //   var lastCommand = $scope.commands[$scope.commands.length-1];
          //   lastCommand.execute();
          // } 
          // else if(redoLastModification===false) {
          //remove last command
          // $scope.commands.pop();
          // }
        // }
      }, function(httpResponse) {
        $scope.reportNotFound = true;
        errorHandler(httpResponse);
      });
    }

    $scope.showReport = function(id, event) {
      if (!id || !event) {
        return;
      }

      if (event.target.tagName != 'TD') {
        //user clicked action button or link, so do nothing!
        return;
      }

      $location.path('reports/' + id).search({});
    };

    function createNewReport(reportName) {
      var newReport = {},
        date = new Date();

      newReport.year = date.getFullYear();
      newReport.week = date.getWeek();
      newReport.name = reportName || $scope.newReportName;

      newReport.milestones = [];
      
      newReport.costs = angular.copy(config.defaultCostTypes);

      saveReport(newReport);
    };

    /**
     * Update $scope.currentReport by persisting changes.
     * @param {String} modifiedProperty
     *   Property that has been modified.
     * @param {String} prevValue
     *   Previous value used for undo.
     * TODO document all param
     */
    $scope.updateReport = function(modifiedProperty, prevValue, isArray, index, arrayName) {
      var updateCommand,
          defer = $q.defer(),
          deferUndo = $q.defer();


      if (!$scope.currentReport) {
        console.log('updateReport: no current report');
        return;
      }

      //prepare command
      updateCommand = {
        mP: modifiedProperty,
        pV: prevValue,
        iA: isArray,
        i: index,
        aN: arrayName,
        promise: defer.promise,
        undoPromise: deferUndo.promise
      };

      if (isArray && typeof index == 'number' && arrayName) {
        var nestedObject = getNestedObject($scope.currentReport, arrayName);
        updateCommand.nV = nestedObject[index][updateCommand.mP];
      } else {
        updateCommand.nV = $scope.currentReport[updateCommand.mP];
      }

      //always convert to int before saving
      convertYearAndWeekToInt($scope.currentReport);

      updateCommand.execute = function() {
        if (isArray && typeof index === 'number' && arrayName) {
          var nestedObject = getNestedObject($scope.currentReport, arrayName);
          nestedObject[index][updateCommand.mP] = updateCommand.nV;
        } else {
          $scope.currentReport[updateCommand.mP] = updateCommand.nV;
        }

        $scope.currentReport.$update(function() {
          $scope.$emit('report-change-' + updateCommand.mP);
          defer.resolve();
        }, function(response) {
          handleUpdateError(response, defer);
        });
      };

      //only add update command when a modified property exists
      if (updateCommand.mP) {
        updateCommand.undo = function() {
          if (isArray && typeof index === 'number' && arrayName) {
            var nestedObject = getNestedObject($scope.currentReport, arrayName);
            nestedObject[index][updateCommand.mP] = updateCommand.pV;
            // modifiedEntity[updateCommand.mP] = updateCommand.pV;
          } else {
            $scope.currentReport[updateCommand.mP] = updateCommand.pV;
          }

          $scope.currentReport.$update(function() {
            $scope.$emit('report-change-' + updateCommand.mP);
            deferUndo.resolve();
          }, function(response) {
            handleUpdateError(response, deferUndo);
          });
        };
      }

      function getNestedObject(object, nestedProperty) {
        var props,
          tmpObj;

        if (!nestedProperty) {
          return false;
        }

        props = nestedProperty.split('.');

        if (props.length > 0) {
          tmpObj = object;
          for (var i = 0; i < props.length; i++) {
            if (!props[i] || !props[i].length) {
              return false;
            }
            tmpObj = tmpObj[props[i]];
          }
        }

        return tmpObj;
      }

      storeAndExecute(updateCommand);

      updateSortableOptions();
    }

    $scope.updateReportYear = function(newYear, oldYear) {
      var tmpMaxWeekOldYear,
          tmpMaxWeekNewYear,
          updateCommand,
          defer = $q.defer(),
          deferUndo = $q.defer();

     tmpMaxWeekOldYear = helper.getMaxWeeksPerYear(oldYear);
     //if max week was selected, recalculate week.
      if($scope.currentReport.week === tmpMaxWeekOldYear) {
        tmpMaxWeekNewYear = helper.getMaxWeeksPerYear(newYear);
        if(tmpMaxWeekOldYear > tmpMaxWeekNewYear) {              
           adjustAndPersistWeek();
        } else {
          $scope.updateReport('year', parseInt(oldYear), false);  
        }
      } else {
        $scope.updateReport('year', parseInt(oldYear), false);
      }
      //special undo treatment because two fields change at once
      function adjustAndPersistWeek() {
        //save prev values
        updateCommand = {
          'prev': {
            'week': parseInt($scope.currentReport.week),
            'year': parseInt(oldYear)
          },
          'promise': defer.promise,
          'undoPromise': deferUndo.promise
        };

        updateCommand.execute = function() {
          $scope.currentReport.week = parseInt(tmpMaxWeekNewYear);         
          $scope.currentReport.$update(function() {
            defer.resolve();
          }, function(response) {
            handleUpdateError(response, defer);
          });
          $scope.$emit('report-change-year');
        }

        updateCommand.undo = function() {
          var cYear = $scope.currentReport.year;
          $scope.currentReport.week = updateCommand.prev.week;
          $scope.currentReport.year = updateCommand.prev.year;        
          $scope.currentReport.$update(function() {
            deferUndo.resolve();
          }, function(response) {
            handleUpdateError(response, deferUndo);
          });
          $scope.$emit('report-change-year');
        }

        storeAndExecute(updateCommand);
      }

      
    }

    $scope.updateReportWeek = function(newWeek, oldWeek) {
      $scope.updateReport('week', parseInt(oldWeek), false);
    }

    /**
     * Increases or decreases the current report week in steps of +/- 1.
     * Takes changes and start/end of year into consideration.
     * @param direction
     *   dec for decreasing and inc for increasing
     *
     */
    $scope.incrementalUpdateReportWeek = function(direction) {
      var defer = $q.defer(),
          deferUndo = $q.defer();

      if($scope.isReportLocked()) {
        return;
      }

      if (!direction) {
        $log.log('No valid direction given.');
        return;
      }

      if (direction != 'dec' && direction != 'inc') {
        $log.log('No valid direction provided. ' + direction);
        return;
      }

      var oldWeek = $scope.currentReport.week,
        baseYear = (direction == 'dec') ? $scope.currentReport.year - 1 : $scope.currentReport.year,
        //use 28th december since it is always in last years week
        baseDate = new Date(baseYear, 11, 28),
        maxWeek = baseDate.getWeek(),
        updateCommand;

      //save prev values
      updateCommand = {
        prev: {
          week: $scope.currentReport.week,
          year: $scope.currentReport.year
        },
        promise: defer.promise,
        undoPromise: deferUndo.promise
      };

      updateCommand.execute = function() {
        if (direction == 'dec') {
          if ($scope.currentReport.week > 1) {
            $scope.currentReport.week--;
          } else {
            $scope.currentReport.week = maxWeek;
            $scope.currentReport.year--;
          }

        } else if (direction == 'inc') {
          if ($scope.currentReport.week < maxWeek) {
            $scope.currentReport.week++;
          } else {
            $scope.currentReport.week = 1;
            $scope.currentReport.year++;
          }
        }
        $scope.currentReport.$update(function() {
          if (updateCommand.prev.year != $scope.currentReport.year) {
            $scope.$emit('report-change-year');
          }
          defer.resolve();
        }, function(response) {
          handleUpdateError(response, defer);
        });
      }

      updateCommand.undo = function() {
        var cYear = $scope.currentReport.year;
        $scope.currentReport.week = updateCommand.prev.week;
        $scope.currentReport.year = updateCommand.prev.year;

        $scope.currentReport.$update(function() {
          if (cYear != $scope.currentReport.year) {
            $scope.$emit('report-change-year');
          }
          deferUndo.resolve();
        }, function(response) {
          handleUpdateError(response, deferUndo);
        });
      }

      storeAndExecute(updateCommand);
    }

    $scope.deleteReport = function(report) {
      $scope.reportToDelete = report || $scope.currentReport;

      if (!$scope.reportToDelete) {
        console.log('deleteReport: no report to delete');
        return;
      }

      $scope.remainingSecondsBeforeDoomsday = Math.round(REPORT_DELETE_TIMEOUT / 1000);
      $scope.deleteTimer = true;

      $scope.doomsdayInterval = $interval(countDown, 1000, $scope.remainingSecondsBeforeDoomsday + 1);

      function killTheReport() {
        $http.delete(config.getCombinedServiceUrl() + $scope.reportToDelete._links.self.href).
        success(function(data, status, headers, config) {
          if ($location.path() == '/reports') {
            angular.forEach($scope.reports, function(r, index) {
              if ($scope.reportToDelete._id == r._id) {
                $scope.reports.splice(index, 1);
                $scope.reportToDelete = null;
                //exit loop
                return false;
              }
            });
          } else {
            $location.path('/');
          }
        }).error(errorHandler);

        // $scope.reportToDelete.$delete(function() {
        //   $scope.reportToDelete = null;
        //   if($location.path() == '/reports') {
        //     angular.forEach($scope.reports, function(r, index) {
        //       if($scope.reportToDelete._id == r._id) {
        //         $scope.reports.splice(index, 1);
        //         //exit loop
        //         return false;
        //       }
        //     });
        //   } else {
        //     $location.path('/');
        //   }
        // }, errorHandler);        
      }

      function countDown() {
        if ($scope.remainingSecondsBeforeDoomsday > 0) {
          $scope.remainingSecondsBeforeDoomsday = $scope.remainingSecondsBeforeDoomsday - 1;
        } else {
          $scope.deleteTimer = false;
          killTheReport();
        }
      }
    }

    $scope.delayDoomsday = function() {
      $scope.deleteTimer = false;

      if ($scope.doomsdayInterval) {
        $interval.cancel($scope.doomsdayInterval);
        $scope.doomsdayInterval = null;
      }
    }
    
    /**
     * Persist given report.
     */
    function saveReport(report) {
      var resource;

      if (!report) {
        console.log('saveReport: no report given');
        return;
      }

      resource = new Report(report);

      if (report._id) {
        //error
      } else {
        //new
        resource.$create(function(saved) {
          console.log('saved new report');
          $scope.newReportName = null;
          $location.url('reports/' + resource._id)

        }, function(response) {
          if (response.status == 409) {
            response.data.errorKey = 'error.report.clone';
          }

          errorHandler(response);

          if (response.status == 409) {
            //jump to copied report also some problems exist
            $scope.newReportName = null;
            $location.url('reports/' + response.data._id)
          }

        });

      }
    }

    /**
     * Adds a empty object to a collection.
     * @param {String} type
     */
    $scope.addCollectionElement = function(type) {
      var updateCommand = {},
          defer = $q.defer(),
          deferUndo = $q.defer();

      if (!$scope.currentReport) {
        $log.log('addSystem: no current report');
        return;
      }

      if(type == 'milestone') {
        if (!$scope.currentReport.milestones) {
          $scope.currentReport.milestones = [];
        }
      } else if(type == 'recipient') {
        //init correct notification settings structure if it does not already exist
        if (!$scope.currentReport.settings) {
          $scope.currentReport.settings = {};
          $scope.currentReport.settings.notification = {};
          $scope.currentReport.settings.notification.recipients = [];
        } else if (!$scope.currentReport.settings.notification) {
          $scope.currentReport.settings.notification = {};
          $scope.currentReport.settings.settings.notification.recipients = [];
        } else if (!$scope.currentReport.settings.notification.recipients) {
          $scope.currentReport.settings.notification.recipients = [];
        }
      } else if(type == 'system') {
        if (!$scope.currentReport.systems) {
          $scope.currentReport.systems = [];
        }
      } else {
        $log.log('addCollectionElement: unknown type');
        return;
      }


      convertYearAndWeekToInt($scope.currentReport);

      updateCommand.promise = defer.promise;
      updateCommand.undoPromise = deferUndo.promise;

      updateCommand.execute = function() {
        getReportCollectionByType(type).push({});
        $scope.currentReport.$update().then(function() {
          defer.resolve();
        }).catch(function(response) {
          handleUpdateError(response, defer);
        });
      }

      updateCommand.undo = function() {
        getReportCollectionByType(type).pop();
        $scope.currentReport.$update().then(function() {
          deferUndo.resolve();
        }).catch(function(response) {
          handleUpdateError(response, deferUndo);
        });
      }

      storeAndExecute(updateCommand);
    }

    function getReportCollectionByType(type) {
      if(type == 'milestone') {
        return $scope.currentReport.milestones;
      } else if(type == 'recipient') {
        return $scope.currentReport.settings.notification.recipients;
      } else if(type == 'system') {
        return $scope.currentReport.systems;
      } else {
        throw 'getReportCollectionByType: ' + type + ' collection type unknown';
      }
    }

    /**
     * Removes an object from a collection
     * @param {String} type
     * @param {Number} index
     *   Index of object to remove.
     */
    $scope.removeCollectionElement = function(type, index) {
      var updateCommand = {},
          defer = $q.defer(),
          deferUndo = $q.defer(),
          objectToRemove;

      if (!$scope.currentReport) {
        $log.log('removeCollectionElement: no current report');
        return;
      }

      if (!index && index !== 0) {
        $log.log('removeCollectionElement: no index given');
        return;
      }

      if(type == 'milestone') {
        if (!$scope.currentReport.milestones || $scope.currentReport.milestones.length == 0 || !$scope.currentReport.milestones[index]) {
          return;
        }
      } else if(type == 'recipient') {
        if (!$scope.currentReport.settings || !$scope.currentReport.settings.notification || !$scope.currentReport.settings.notification.recipients || $scope.currentReport.settings.notification.recipients.length == 0 || !$scope.currentReport.settings.notification.recipients[index]) {
          $log.log('removeCollectionElement: precondition checks on settings object failed');
          return;
        }
      } else if(type == 'system') {
        if (!$scope.currentReport.systems || $scope.currentReport.systems.length == 0 || !$scope.currentReport.systems[index]) {
          return;
        }
      } else {
        $log.log('removeCollectionElement: unknown type');
       // return;
      }

      convertYearAndWeekToInt($scope.currentReport);

      updateCommand.promise = defer.promise;
      updateCommand.undoPromise = deferUndo.promise;

      updateCommand.execute = function() {
        var collection = getReportCollectionByType(type);
        
        objectToRemove = collection[index];
        collection.splice(index, 1);
        $scope.currentReport.$update().then(function() {
          defer.resolve();
        }).catch(function(response) {
          defer.reject();
        });
      }            

      updateCommand.undo = function() {
        var collection = getReportCollectionByType(type);

        collection.splice(index, 0, objectToRemove);
        $scope.currentReport.$update().then(function() {
          deferUndo.resolve();
        }).catch(function(response) {
          deferUndo.reject();
        });
      }

      storeAndExecute(updateCommand);
    }

    /**
     * Sends a notification to recipients listed in $scope.currentReport.settings.notification.recipients.
     */
    $scope.sendNotifications = function() {
      var subject,
        content,
        templateData;
        
      //TODO move method to notificationService

      if (!$scope.currentReport) {
        console.log('sendNotifications: no current report');
        return;
      }

      $http.post(config.getCombinedServiceUrl() + '/reports/' + $scope.currentReport._id + '/notifications')
        .success(angular.noop)
        .error(function(response) {
          $log.error('Failed so send notifications ' + response);
          errorHandler(response);
        });
    }

    /**
     * Deletes an image.
     * @param {Object} image
     *   Image to delete. Contains only meta data.
     *
     */
    $scope.deleteReportImage = function(image) {
      if (!image) {
        console.log('deleteReportImage: no image given');
        return;
      }

      if (!$scope.currentReport) {
        console.log('deleteReportImage: no current report');
        return;
      }

      $http.delete(config.getCombinedServiceUrl() + image._links.self.href).
      success(function(data, status, headers, config) {
        angular.forEach($scope.currentReport.images, function(object, index) {
          if (object._id == image._id) {
            $scope.currentReport.images.splice(index, 1);
            return false;
          }
        });

        loadReportVersion($scope.currentReport, function(versionInfo) {
          $scope.currentReport.version = versionInfo.version;
        });

      }).error(errorHandler);
    }

    /**
     * Convenience methods. Allows user to show print dialog from the application.
     *
     */
    $scope.printReport = function() {

      if (!$scope.currentReport) {
        console.log('printReport: no current report');
        return;
      }

      window.print();
    }

    function setupFileUpload() {
      var uploader = $scope.uploader = new FileUploader({
        scope: $scope, // to automatically update the html. Default: $rootScope
        // url: config.getCombinedServiceUrl() + '/reports/' + $scope.currentReport._id + '/images',            
        //since setup is performed before loading the report we take the report id from URL
        url: config.getCombinedServiceUrl() + '/reports/' + $routeParams.reportId + '/images',
        alias: 'image',
        removeAfterUpload: true,
        autoUpload: false,
      });

      uploader.filters.push({
        name: 'imageFilter',
        fn: function(item, options) {
          var type = uploader.isHTML5 ? item.type : '/' + item.value.slice(item.value.lastIndexOf('.') + 1);
          type = '|' + type.toLowerCase().slice(type.lastIndexOf('/') + 1) + '|';
          return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
        }
      });

      uploader.onCompleteItem = function(item, response, status, headers) {
        $log.log(response);

        if (status != 200) {
          return;
        }

        if (!$scope.currentReport.images) {
          $scope.currentReport.images = [];
        }

        $scope.currentReport.images.push(response);
      };

      uploader.onCompleteAll = function() {
        //Update report with latest version.
        loadReportVersion($scope.currentReport, function(versionInfo) {
          $scope.currentReport.version = versionInfo.version;
        });

      };

      uploader.onErrorItem = function(item, response, status, headers) {
        console.log('setupFileUpload: upload failed');
        //show global error. for more information have a look inside the errorHandler
        $rootScope.error = true;
        $rootScope.errorMessage = language.translate(response) ||
          language.translate('error.image.upload') ||
          language.translate('error.general') ||
          'Error during communication with service.';
      };
    }

    $scope.copyReport = function(reportToCopy, $event) {
      var date = new Date();

      if (!reportToCopy) {
        console.log('copyReport: no reportToCopy given');
        return;
      }

      //link to original report
      reportToCopy.copyOf = reportToCopy._id;
      delete reportToCopy._id;

      reportToCopy.name = reportToCopy.name + '_copy';
      reportToCopy.week = date.getWeek();
      reportToCopy.year = date.getFullYear();
      reportToCopy.locked = false;

      saveReport(reportToCopy);
    }

    /**
     * Locks currently edited report to prevnt accidential edits.
     */
    $scope.toggleReportLock = function() {
      var prevLockState;
      if (!$scope.currentReport) {
        console.log('copyReport: no currentReport');
        return;
      }

      if (typeof $scope.currentReport.locked != 'undefined') {
        prevLockState = $scope.currentReport.locked;
        $scope.currentReport.locked = !prevLockState;
      } else {
        prevLockState = false;
        $scope.currentReport.locked = true;
      }

      $scope.updateReport();

    }

    $scope.isReportLocked = function() {
      if (!$scope.currentReport) {
        return false;
      }

      return $scope.currentReport.locked;
    }


    $scope.isUrl = function(url) {
      return helper.isUrl(url);
    }

    /**
     * Stores command in queue and executes it. Calls commandService
     * @param {Object} command
     *   Object with execute and undo function.
     */
    function storeAndExecute(command) {
      commandService.storeAndExecuteCmd(command);
    }

    /**
     * Undo last action by executing undo on latest command.
     * Afterwards remove the command from array.
     */
    $scope.removeAndUndoLastCommand = function() {
      // var commandToUndo;

      if($scope.isReportLocked()) {
        return;
      }

      commandService.undo();
    }

    $scope.isZero = function(value) {
      return helper.isZero(value);
    }

    $scope.getStateColor = function(state) {
      var color = '';

      if (!state) {
        return '';
      }

      switch (state) {
        case 1:
          color = 'red';
          break;
        case 2:
          color = 'yellow';
          break;
        case 3:
          color = 'green';
          break;
      }

      return color;
    }

    function loadProjectNames() {
      $http.get($scope.config.getCombinedServiceUrl() + '/reports', {
        headers: {
          'Accept': 'text/plain'
        }
      }).success(function(data, status, headers, config) {
        $scope.projectNames = data;
      }).error(errorHandler);
    }

    /**
     * Converts year and week of a report to Int.
     */
    function convertYearAndWeekToInt(report) {
      if (!report) {
        console.log('convertCalAndWeekToInt: no report given');
        return;
      }

      //always convert to int before saving
      report.year = parseInt(report.year);
      report.week = parseInt(report.week);
    }

    /**
     * Load version information for given report.
     */
    function loadReportVersion(report, callback) {
      if (!report) {
        console.log('loadReportVersion: no report given');
        return;
      }
      $http.get(config.getCombinedServiceUrl() + report._links.self.href + '/version').success(function(versionInfo) {
        console.log('Retrieved version ' + versionInfo.version + ' for report id ' + versionInfo._id);
        callback(versionInfo);
      }).error(errorHandler);
      return;
    }

    /**
     * Fills $scope.weeks based on number of weeks for current report year.
     *
     */
    function fillWeeks(baseYear) {
      //use 28th december since it is always in last years week
      var baseDate,
        maxWeek,
        weeks = [];

      if (baseYear) {
        baseDate = new Date(baseYear, 11, 28);
      } else {
        baseDate = new Date($scope.currentReport.year, 11, 28);
      }

      maxWeek = baseDate.getWeek();

      //fill calendar weeks
      for (var i = 1; i <= maxWeek; i++) {
        weeks.push({
          'week': i
        });
      };

      $scope.weeks = weeks;
    }

    /**
     * Resets year and week search params to current date.
     */
    $scope.resetSearchCal = function() {       
      $rootScope.search.year = (new Date()).getFullYear();
      $rootScope.search.week = (new Date()).getWeek();
    }
    
    /**
     * Load brand logo.
     */
    function getLogo() {
        
        $scope.brandLogoExists = config.brandLogoExists;
        $scope.brandLogo = config.brandLogo;
    }

    /**
     * Register event handlers.
     *
     */
    function registerEventHandlers() {
      $scope.$on('report-change-year', function(eventData) {
        fillWeeks();
      });
    }      

    /**
    * Resgister hotkeys for report detail view.
    *
    */
    function registerReportDetailHotkeys() {
      //Bind to scope. Will unbind the hotkeys when controller scope gets destroyed. 

      hotkeys.bindTo($scope).add(
        {
          combo: 'ctrl+z',
          description: 'Undo',
          callback: function() {
            $scope.removeAndUndoLastCommand();
          }
        }
      )
      .add(
        {
          combo: 'plus',
          description: 'Increase report week',
          callback: function() {
            $scope.incrementalUpdateReportWeek('inc');
          }
        }
      )
      .add(
        {
          combo: '-',
          description: 'Decrease report week',
          callback: function() {
            $scope.incrementalUpdateReportWeek('dec');
          }
        }
      )
      .add(
        {
          combo: 'l',
          description: 'Lock report',
          callback: function() {
            $scope.toggleReportLock();
          }
        }
      );

      hotkeys.del('esc');

      //Disabled since direct call to methods doesn't show the 
      //confirmation window like the directive does

      // hotkeys.add(
      //   {
      //     combo: 'c',
      //     description: 'Hotkey: Copy report',
      //     callback: function() {
      //       $scope.copyReport($scope.currentReport);
      //     }
      //   }
      // );

      // hotkeys.add(
      //   {
      //     combo: 'del',
      //     description: 'Hotkey: Delete report',
      //     callback: function() {
      //       $scope.deleteReport($scope.currentReport);
      //     }
      //   }
      // );
    }

     /**
    * Resgister hotkeys for report detail view.
    *
    */
    function registerReportSearchHotkeys() {
        //Bind to scope. Will unbind the hotkeys when controller scope gets destroyed.

      hotkeys.bindTo($scope).add(
        {
          combo: 'a',
          description: 'Show all weeks',
          callback: function() {
            $scope.search.week = '';
          }
        }
      )
      .add(
        {
          combo: 't',
          description: 'Reset week and year',
          callback: function() {
            $scope.resetSearchCal();
          }
        }
      )
      .add(
        {
          combo: 'r',
          description: 'Reload reports',
          callback: function() {
            $scope.loadReports();
          }
        }
      )
      .add(
        {
          combo: 'c',
          description: 'Clear search',
          callback: function() {
            $scope.search.name = '';
          }
        }
      )
      .add(
        {
          combo: 'n',
          description: 'New report',
          callback: function(event, hotkey) {
            event.preventDefault();
            angular.element('#report_new_title_field').focus();
            angular.element('compose-button .fab').click();
          }
        }
      )
      .add(
        {
          combo: 's',
          description: 'Search',
          callback: function(event, hotkey) {
            event.preventDefault();
            angular.element('#report_search_field').focus();
          }
        }
      )
      .add(
        {
          combo: 'esc',
          description: 'Unfocus field',
          allowIn: ['INPUT'],
          callback: function(event) {
            angular.element('input').blur();
            return true;
          }
        }
      )
      .add(
        {
          combo: 'down',
          description: 'Select next result',
          callback: function() {
            if($scope.selectedReportSearchRow === null) {
              $scope.selectedReportSearchRow = 0;
            } else if($scope.selectedReportSearchRow === $scope.reports.length-1) {
              return;
            }  else {
              $scope.selectedReportSearchRow = $scope.selectedReportSearchRow + 1;
            }
          }
        }
      )
      .add(
        {
          combo: 'up',
          description: 'Select prev result',
          callback: function() {
            if($scope.selectedReportSearchRow === null) {
              $scope.selectedReportSearchRow = $scope.reports.length-1;
            } else if($scope.selectedReportSearchRow === 0) {
              return;
            } else {
              $scope.selectedReportSearchRow = $scope.selectedReportSearchRow - 1;
            }
          }
        }
      )
      .add(
        {
          combo: 'enter',
          description: 'Show selected report',
          callback: function() {
            if($scope.selectedReportSearchRow >= 0 && $scope.selectedReportSearchRow < $scope.reports.length) {
              $location.url('reports/' + $scope.reports[$scope.selectedReportSearchRow]._id);
            }
          }
        }
      )
      .add(
        {
          combo: 'right',
          description: 'Next page',
          callback: function() {
            $scope.loadReports('next');
          }
        }
      )
      .add(
        {
          combo: 'left',
          description: 'Previous page',
          callback: function() {
            $scope.loadReports('prev');
          }
        }
      );

    }

    function getNotificationProviders() {
      notificationService.getProviders(function(providers) {
        $scope.notificationProviders = providers;
      });
    }
    


    function calculateYearRange() {
      var baseYear = config.reportsBaseYear || (new Date()).getFullYear();
      
      $scope.years = helper.getYearsFromToday(baseYear);
    }
   

    //## Init Section

    
    /**
     * Handles all controller initialization logic.
     */
    function activate() {

        $log.debug('activate');

        calculateYearRange();
        
        //initially load reports or report entity based on url
       
        if ($routeParams.reportId) {            
            unregisterWatchForSearch();            
            registerReportDetailHotkeys();
            loadReport($routeParams.reportId);
            getLogo();            
        } else {
            extractSearchParamsFromAddressBar();
            loadReports();
            loadProjectNames();
            registerWatchForSearch();
            registerReportSearchHotkeys();
        }        
        
         //Setup File Upload immediately. Otherwise there will be erors like
        //https://github.com/nervgh/angular-file-upload/issues/183    
        setupFileUpload();

        registerEventHandlers();
        
        getNotificationProviders();        
    }

    //##Init section end

    /**
     * Handles errors during report update.
     * Especially for error 428 when report has been modified externaly. Lost update problem.
     * @param {Object} response
     *  Server resonse
     * @param {Object} defered
     *  Promise that was involved in operation. 
     */
    function handleUpdateError(response, defered) {
      if (!response) {
        return
      }

      if(defered) {
        defered.reject();
      }

      if (response.status == 428) {
        //modified by third party
        $log.log('Failed to update report because it has been modified.');
        //prevent accidential overrides by killing the undo stack
        commandService.reset();
        $('#dialogModifiedReport').modal('toggle');
      } else {
        errorHandler(response);
      }
    }

  }
]);