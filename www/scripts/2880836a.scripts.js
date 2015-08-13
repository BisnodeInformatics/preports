"use strict";var PReports=PReports||{};angular.module("PReports.resources",[]),angular.module("PReports.directives",[]),angular.module("PReports.services",[]),Date.prototype.getWeek=function(a){a="int"==typeof a?a:1;var b=new Date(this.getFullYear(),0,1),c=b.getDay()-a;c=c>=0?c:c+7;var d,e=Math.floor((this.getTime()-b.getTime()-6e4*(this.getTimezoneOffset()-b.getTimezoneOffset()))/864e5)+1;return 4>c?(d=Math.floor((e+c-1)/7)+1,d>52&&(nYear=new Date(this.getFullYear()+1,0,1),nday=nYear.getDay()-a,nday=nday>=0?nday:nday+7,d=nday<4?1:53)):d=Math.floor((e+c-1)/7),d},PReports=angular.module("PReports",["ngCookies","ngResource","ngSanitize","ngRoute","PReports.resources","PReports.directives","PReports.services","PReports.translations","PReports.filters","angularFileUpload","ui.bootstrap"]).config(["$routeProvider","$httpProvider",function(a,b){a.when("/reports",{templateUrl:"views/reports.html",controller:"PReports.ReportCtrl"}).when("/reports/:reportId",{templateUrl:"views/reports_detail.html",controller:"PReports.ReportCtrl"}).when("/about",{templateUrl:"views/about.html"}).otherwise({redirectTo:"/reports"}),b.defaults.headers.common.Accept="application/json, application/hal+json"}]).run(["$rootScope","config",function(a,b){a.version=b.version}]),PReports.ReportCtrl=function(a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p){function q(){var b,c,d="";j.watchHandles||(j.watchHandles=[]),c=j.$watch("search.name",function(c,e){c!=e&&(b&&l.cancel(b),d=c,b=l(function(){a.filterText=d,j.search.page=0,a.loadReports()},250))}),j.watchHandles.push(c),c=j.$watch("search.year",function(b,c){b!=c&&(j.search.page=0,a.loadReports())}),j.watchHandles.push(c),c=j.$watch("search.week",function(b,c){b!=c&&(j.search.page=0,a.loadReports())}),j.watchHandles.push(c)}function r(){j.watchHandles&&j.watchHandles.length>0&&angular.forEach(j.watchHandles,function(a){a()}),j.watchHandles=[]}function s(c){var e;return c?(e=new d(c),void(c._id||e.$create(function(c){console.log("saved new report"),a.newReportName=null,b.path("reports/"+e._id)},function(a){alert("could not save report")}))):void console.log("saveReport: no report given")}function t(){var b=a.uploader=g.create({scope:a,url:h.getCombinedServiceUrl()+"/reports/"+a.currentReport._id+"/images",alias:"image",removeAfterUpload:!0,autoUpload:!1,filters:[function(a){var c=b.isHTML5?a.type:"/"+a.value.slice(a.value.lastIndexOf(".")+1);return c="|"+c.toLowerCase().slice(c.lastIndexOf("/")+1)+"|",-1!=="|jpg|png|jpeg|bmp|gif|".indexOf(c)}]});b.bind("complete",function(b,c,d,f){e.log(f),a.currentReport.images||(a.currentReport.images=[]),a.currentReport.images.push(f)}),b.bind("completeall",function(a,b){}),b.bind("error",function(a,b,c,d){console.log("setupFileUpload: upload failed"),j.error=!0,j.errorMessage=k.translate("error.image.upload")||k.translate("error.general")||"Error during communication with service."})}function u(b){var c=!0;if(!b)return void e.log("storeAndExecute: no command given");if("object"!=typeof b)return void e.log("storeAndExecute: command is not an object");if(!b.hasOwnProperty("execute")||"function"!=typeof b.execute)return void e.log("storeAndExecute: no execute method found or not a function");b.hasOwnProperty("undo")&&"function"==typeof b.undo||(e.log("storeAndExecute: no undo method found or not a function. Command not added to queue."),c=!1),c&&(a.commands.length==a.COMMAND_QUEUE_SIZE?(a.commands=a.commands.slice(1),a.commands.push(b)):a.commands.push(b));try{b.execute()}catch(d){e.log("storeAndExecute: failed to execute command. "+d),a.commands.pop(b),alert("commmand execution failed!")}}function v(){f.get(a.config.getCombinedServiceUrl()+"/reports",{headers:{Accept:"text/plain"}}).success(function(b,c,d,e){a.projectNames=b}).error(i)}function w(a){return a?(a.year=parseInt(a.year),void(a.week=parseInt(a.week))):void console.log("convertCalAndWeekToInt: no report given")}function x(b){b&&(428==b.status?(e.log("Failed to update report because it has been modified."),a.commands=[],$("#dialogModifiedReport").modal("toggle")):i(b))}var y=5e3,z=25;a.COMMAND_QUEUE_SIZE=20,a.reports=[],a.currentReport=null,j.search=j.search||{},j.search.year=j.search.hasOwnProperty("year")?j.search.year:(new Date).getFullYear(),j.search.week=j.search.hasOwnProperty("week")?j.search.week:(new Date).getWeek(),j.search.name=j.search.hasOwnProperty("name")?j.search.name:"",j.search.limit=z,j.search.page=j.search.hasOwnProperty("page")?j.search.page:0,a.weeks=[],a.config=h,a.projectNames=[],a.reportNotFound=!1,a.commands=[];for(var A=1;53>A;A++)a.weeks.push({week:A});a.loadReports=function(b){if(console.log("loadReports"),a.reportsWrapper&&a.reportsWrapper._links){if("next"==b&&a.reportsWrapper._links.next)return void f.get(h.getCombinedServiceUrl()+a.reportsWrapper._links.next.href).success(function(b){a.reportsWrapper=b,a.reports=b.reports,j.search.page=b.currentPage-1}).error(i);if("prev"==b&&a.reportsWrapper._links.prev)return void(a.reportsWrapper=f.get(h.getCombinedServiceUrl()+a.reportsWrapper._links.prev.href).success(function(b){a.reportsWrapper=b,a.reports=b.reports,j.search.page=b.currentPage-1}).error(i))}a.reportsWrapper=d.query({year:j.search.year,week:j.search.week,name:j.search.name,page:j.search.page,limit:z},function(b){a.reports=a.reportsWrapper.reports,j.search.page=a.reportsWrapper.currentPage-1},i)},a.loadReport=function(b){return b?(a.reportNotFound=!1,void(a.currentReport=d.get({id:b},function(){t()},function(b){a.reportNotFound=!0,i(b)}))):void e.log("loadReport: No Id provided.")},a.reloadReport=function(b){return a.currentReport?(a.reportNotFound=!1,void(a.currentReport=d.get({id:a.currentReport._id},function(){a.commands&&a.commands.length>0},function(b){a.reportNotFound=!0,i(b)}))):void e.log("loadReport: No currentReport.")},a.setSearchAsQueryParams=function(){b.$$search={},j.search.week&&b.search("week",j.search.week),j.search.year&&b.search("year",j.search.year),j.search.name&&b.search("name",j.search.name)},a.showReport=function(a,c){a&&c&&"TD"==c.target.tagName&&b.path("reports/"+a)},a.createNewReport=function(){var b={},c=new Date;b.year=c.getFullYear(),b.week=c.getWeek(),b.name=a.newReportName,b.milestones=[],s(b)},a.updateReport=function(b,c,d,e,f){function g(a,b){var c,d;if(!b)return!1;if(c=b.split("."),c.length>0){d=a;for(var e=0;e<c.length;e++){if(!c[e]||!c[e].length)return!1;d=d[c[e]]}}return d}var h;if(!a.currentReport)return void console.log("updateReport: no current report");if(h={mP:b,pV:c,iA:d,i:e,aN:f},d&&"number"==typeof e&&f){var i=g(a.currentReport,f);h.nV=i[e][h.mP]}else h.nV=a.currentReport[h.mP];w(a.currentReport),h.execute=function(){if(d&&"number"==typeof e&&f){var b=g(a.currentReport,f);b[e][h.mP]=h.nV}else a.currentReport[h.mP]=h.nV;a.currentReport.$update(angular.noop,x)},h.mP&&(h.undo=function(){if(d&&"number"==typeof e&&f){var b=g(a.currentReport,f);b[e][h.mP]=h.pV}else a.currentReport[h.mP]=h.pV;a.currentReport.$update(angular.noop,x)}),u(h)},a.deleteReport=function(c){function d(){f["delete"](h.getCombinedServiceUrl()+a.reportToDelete._links.self.href).success(function(c,d,e,f){"/reports"==b.path()?angular.forEach(a.reports,function(b,c){return a.reportToDelete._id==b._id?(a.reports.splice(c,1),a.reportToDelete=null,!1):void 0}):b.path("/")}).error(i)}function e(){a.remainingSecondsBeforeDoomsday>0?a.remainingSecondsBeforeDoomsday=a.remainingSecondsBeforeDoomsday-1:(a.deleteTimer=!1,d())}return a.reportToDelete=c||a.currentReport,a.reportToDelete?(a.remainingSecondsBeforeDoomsday=Math.round(y/1e3),a.deleteTimer=!0,void(a.doomsdayInterval=m(e,1e3,a.remainingSecondsBeforeDoomsday+1))):void console.log("deleteReport: no report to delete")},a.delayDoomsday=function(){a.deleteTimer=!1,a.doomsdayInterval&&(m.cancel(a.doomsdayInterval),a.doomsdayInterval=null)},a.addMilestone=function(){var b={};return a.currentReport?(a.currentReport.milestones||(a.currentReport.milestones=[]),w(a.currentReport),b.execute=function(){a.currentReport.milestones.push({name:"New milestone"}),a.currentReport.$update(angular.noop,x)},b.undo=function(){a.currentReport.milestones.pop(),a.currentReport.$update(angular.noop,x)},void u(b)):void console.log("addMilestone: no current report")},a.removeMilestone=function(b){var c,d={};return a.currentReport?b||0===b?void(a.currentReport.milestones&&0!=a.currentReport.milestones.length&&a.currentReport.milestones[b]&&(w(a.currentReport),d.execute=function(){c=a.currentReport.milestones[b],a.currentReport.milestones.splice(b,1),a.currentReport.$update(angular.noop,x)},d.undo=function(){a.currentReport.milestones.splice(b,0,c),a.currentReport.$update(angular.noop,x)},u(d))):void console.log("addMilestone: no index given"):void console.log("addMilestone: no current report")},a.addCodeReview=function(){var b={};return a.currentReport?(a.currentReport.codeReviews||(a.currentReport.codeReviews=[]),w(a.currentReport),b.execute=function(){a.currentReport.codeReviews.push({authors:"Add authors"}),a.currentReport.$update()},b.undo=function(){a.currentReport.codeReviews.pop(),a.currentReport.$update()},void u(b)):void console.log("addCodeReview: no current report")},a.removeCodeReview=function(b){var c,d={};return a.currentReport?b||0===b?void(a.currentReport.codeReviews&&0!=a.currentReport.codeReviews.length&&a.currentReport.codeReviews[b]&&(w(a.currentReport),d.execute=function(){c=a.currentReport.codeReviews[b],a.currentReport.codeReviews.splice(b,1),a.currentReport.$update()},d.undo=function(){a.currentReport.codeReviews.splice(b,0,c),a.currentReport.$update()},u(d))):void console.log("removeCodeReview: no index given"):void console.log("removeCodeReview: no current report")},a.addSystem=function(){var b={};return a.currentReport?(a.currentReport.systems||(a.currentReport.systems=[]),w(a.currentReport),b.execute=function(){a.currentReport.systems.push({}),a.currentReport.$update()},b.undo=function(){a.currentReport.systems.pop(),a.currentReport.$update()},void u(b)):void console.log("addSystem: no current report")},a.removeSystem=function(b){var c,d={};return a.currentReport?b||0===b?void(a.currentReport.systems&&0!=a.currentReport.systems.length&&a.currentReport.systems[b]&&(w(a.currentReport),d.execute=function(){c=a.currentReport.systems[b],a.currentReport.systems.splice(b,1),a.currentReport.$update()},d.undo=function(){a.currentReport.systems.splice(b,0,c),a.currentReport.$update()},u(d))):void console.log("removeSystem: no index given"):void console.log("removeSystem: no current report")},a.addRecipient=function(){var b={};return a.currentReport?(a.currentReport.settings?a.currentReport.settings.notification?a.currentReport.settings.notification.recipients||(a.currentReport.settings.notification.recipients=[]):(a.currentReport.settings.notification={},a.currentReport.settings.settings.notification.recipients=[]):(a.currentReport.settings={},a.currentReport.settings.notification={},a.currentReport.settings.notification.recipients=[]),w(a.currentReport),b.execute=function(){a.currentReport.settings.notification.recipients.push({}),a.currentReport.$update()},b.undo=function(){a.currentReport.settings.notification.recipients.pop(),a.currentReport.$update()},void u(b)):void e.log("addSystem: no current report")},a.removeRecipient=function(b){var c,d={};return a.currentReport?b||0===b?a.currentReport.settings&&a.currentReport.settings.notification&&a.currentReport.settings.notification.recipients&&0!=a.currentReport.settings.notification.recipients.length&&a.currentReport.settings.notification.recipients[b]?(w(a.currentReport),d.execute=function(){c=a.currentReport.settings.notification.recipients[b],a.currentReport.settings.notification.recipients.splice(b,1),a.currentReport.$update()},d.undo=function(){a.currentReport.settings.notification.recipients.splice(b,0,c),a.currentReport.$update()},void u(d)):void e.log("removeRecipient: precondition checks on settings object failed"):void e.log("removeRecipient: no index given"):void e.log("removeRecipient: no current report")},a.sendNotifications=function(){function b(a,b){a||i(b)}var c,d,e;return a.currentReport?(e={name:a.currentReport.name,week:a.currentReport.week,year:a.currentReport.year,url:location.href},c=o(k.translate("notification.subject.template")),c=c(e),d=o(k.translate("notification.content.template")),d=d(e),void n.send(c,d,a.currentReport.settings.notification.recipients,b)):void console.log("sendNotifications: no current report")},a.deleteReportImage=function(b){return b?a.currentReport?void f["delete"](h.getCombinedServiceUrl()+b._links.self.href).success(function(c,d,e,f){angular.forEach(a.currentReport.images,function(c,d){return c._id==b._id?(a.currentReport.images.splice(d,1),!1):void 0})}).error(i):void console.log("deleteReportImage: no current report"):void console.log("deleteReportImage: no image given")},a.printReport=function(){return a.currentReport?void window.print():void console.log("printReport: no current report")},a.copyReport=function(a,b){var c=new Date;return a?(a.copyOf=a._id,delete a._id,a.name=a.name+"_copy",a.week=c.getWeek(),a.year=c.getFullYear(),a.locked=!1,void s(a)):void console.log("copyReport: no reportToCopy given")},a.toggleReportLock=function(){var b;return a.currentReport?("undefined"!=typeof a.currentReport.locked?(b=a.currentReport.locked,a.currentReport.locked=!b):(b=!1,a.currentReport.locked=!0),void a.updateReport()):void console.log("copyReport: no currentReport")},a.isUrl=function(a){return p.isUrl(a)},a.removeAndUndoLastCommand=function(){var b;a.commands.length>0?(b=a.commands.pop(),b.undo()):e.log("removeAndUndoLastCommand: no commands in queue")},c.reportId?(r(),a.loadReport(c.reportId)):(a.loadReports(),v(),q())},PReports.ReportCtrl.$inject=["$scope","$location","$routeParams","Report","$log","$http","$fileUploader","config","errorHandler","$rootScope","language","$timeout","$interval","notification","$interpolate","helper"],PReports.NavigationCtrl=function(a,b,c,d,e,f,g,h){function i(){var b;window.localStorage&&(b=window.localStorage.getItem(k),b||(b=c.get()),a.user.language=b)}function j(){f.get(d.getCombinedServiceUrl()+"/reports/count").success(function(a,b,c,d){h.reportsCount=a}).error(function(){g.log("getReportsCount: failed to get reports count")})}var k="com.bisnode.preports.user.language";a.user={},a.setUserLanguage=function(){a.user.language&&window.localStorage&&(window.localStorage.setItem(k,a.user.language),c.set(a.user.language),b.reload())},i(),"/about"==e.path()&&j()},PReports.NavigationCtrl.$inject=["$scope","$route","language","config","$location","$http","$log","$rootScope"],angular.module("PReports.resources").factory("genericResource",["$resource","config","errorHandler",function(a,b,c){function d(d,e,f){var g=a(b.getCombinedServiceUrl()+d,e,f);return g.prototype.saving=!1,g.prototype.isSaving=function(){return g.prototype.saving},g.prototype.setSaving=function(a){g.prototype.saving=a},g.prototype.$create=function(a,b,d){var e,f,g=this,h=angular.noop;switch(arguments.length){case 3:e=a,h=b,f=d;break;case 2:case 1:angular.isFunction(a)?(h=a,f=b||c):(e=a,h=b||angular.noop,f=c);case 0:break;default:throw"Expected between 1-3 arguments [params, success, error], got "+arguments.length+" arguments."}g.setSaving(!0),g.$save(e,function(a,b){g.setSaving(!1),h(a,b)},function(a,b,d,e){g.setSaving(!1),c(a,b,d,e)})},g}return d}]),angular.module("PReports.resources").factory("Report",["genericResource",function(a){var b=a("/reports/:id",{id:"@_id"},{update:{method:"PUT"},query:{method:"GET",isArray:!1}});return b}]),angular.module("PReports.translations",[],["$provide",function(a){var b={"error.image.upload":{DE:"Bild hochladen fehlgeschlagen.",EN:"Image upload failed."},"error.404":{DE:"404 Eine Ressource konnte nicht geladen werden.",EN:"404 Resource not available."},"error.403":{DE:"Ungültige Zugangsdaten oder keine Zugriffsrechte.",EN:"Invalid credentials or insufficient access rights."},"error.general":{DE:"Es gibt ein Problem mit der Verbindung zum Service.",EN:"There has been a connection problem."},"error.appengine":{DE:"Es liegt eine Serverstörung vor. Wir arbeiten an einer Lösung.",EN:"The service has been temporarily interrupted. We are working on a solution."},"common.error.footer":{DE:"Falls dieser Fehler weiterhin besteht, konktaktieren sie <a href='mailto:support@cloobster.com'>support@cloobster.com</a>.",EN:"If this error persists, contact <a href='mailto:support@cloobster.com'>support@cloobster.com</a>."},"common.sending":{DE:"Sende...",EN:"Sending..."},"common.send":{DE:"Sende",EN:"Send"},"common.password.invalid":{DE:"Passwort inkorrekt!",EN:"Password invalid!"},"common.more":{DE:"Mehr",EN:"More"},reports:{DE:"Reports",EN:"Reports"},"reports.back":{DE:"Reportliste",EN:"Reports list"},"reports.new":{DE:"Projektname eingeben und Neuer Report anklicken",EN:"Enter project name and click New report"},"reports.new.button":{DE:"Neuer Report",EN:"New report"},"reports.table.name":{DE:"Projektname",EN:"Project name"},"reports.table.year":{DE:"Jahr",EN:"Year"},"reports.table.week":{DE:"KW",EN:"Week"},"reports.table.images":{DE:"Bilder",EN:"Images"},"reports.table.actions":{DE:"Aktion",EN:"Action"},"report.name":{DE:"Projektname",EN:"Project name"},"report.start.title":{DE:"Start",EN:"Start"},"report.start.ph":{DE:"Startdatum eingeben",EN:"Enter start date"},"report.golive.title":{DE:"Go live",EN:"Go live"},"report.golive.ph":{DE:"Go live eingeben",EN:"Enter go live"},"report.year":{DE:"Jahr",EN:"Year"},"report.week":{DE:"Report Kalenderwoche",EN:"Report calendar week"},"report.leaddevelopers.title":{DE:"Lead developers",EN:"Lead developers"},"report.projectmanagers.title":{DE:"Projektmanager",EN:"Project manager"},"report.leaddevelopers.ph":{DE:"Entwickler eingeben",EN:"Enter developers"},"report.projectmanagers.ph":{DE:"Manager eingeben",EN:"Enter manager"},"report.milestones":{DE:"Meilensteine",EN:"Milestones"},"report.milestones.ph":{DE:"Meilenstein eintragen",EN:"Enter milestone"},"report.milestones.start":{DE:"Meilenstein Start",EN:"Milestone start"},"report.milestones.end":{DE:"Meilenstein Ende",EN:"Milestone end"},"report.milestones.name":{DE:"Name",EN:"Name"},"report.lastweektasks":{DE:"Aufgaben letzte Woche",EN:"Last week tasks"},"report.nextweektasks":{DE:"Aufgaben nächste Woche",EN:"Nextweek tasks"},"report.tasks.ph":{DE:"Aufgaben eingeben",EN:"Enter tasks"},"report.potentials":{DE:"Identifizierte Potentiale",EN:"Identified potentials"},"report.potentials.ph":{DE:"Potentiale eingeben",EN:"Enter potentials"},"report.risks":{DE:"Risiken & Behinderungen",EN:"Risks & Impediments"},"report.risks.ph":{DE:"Risiken/Behinderungen eingeben",EN:"Enter risks/impediments"},"report.codereviews":{DE:"Code Reviews",EN:"Code reviews"},"report.codereviews.reviewer":{DE:"Reviewer",EN:"Reviewer"},"report.codereviews.reviewer.ph":{DE:"Reviewer eintragen",EN:"Enter reviewer"},"report.codereviews.topic":{DE:"Thema",EN:"Topic"},"report.codereviews.topic.ph":{DE:"Thema eintragen",EN:"Enter topic"},"report.codereviews.content":{DE:"Ergebnis",EN:"Result"},"report.codereviews.content.ph":{DE:"Ergenisse eintragen",EN:"Enter results"},"report.systems":{DE:"Systeme",EN:"Systems"},"report.systems.name":{DE:"Systemname",EN:"System name"},"report.systems.name.ph":{DE:"Systemname eintragen",EN:"Enter system name"},"report.systems.url":{DE:"Url",EN:"Url"},"report.systems.url.ph":{DE:"Url eintragen (http://)",EN:"Enter url (http://)"},"report.systems.remarks":{DE:"Bemerkungen",EN:"Remarks"},"report.systems.remarks.ph":{DE:"Bemerkungen eintragen (z. B. Zugangsdaten)",EN:"Enter remarks (e.g. credentials)"},"report.images":{DE:"Architektur-Diagramme",EN:"Architecture diagrams"},"report.delete.title":{DE:"Report löschen",EN:"Delete report"},"report.delete.text":{DE:"Report wird unwideruflich gelöscht!",EN:"Report will be deleted permanent!"},"report.copy.title":{DE:"Report kopieren",EN:"Copy report"},"report.copy.text":{DE:"Erzeugt eine Kopie des Reports, setzt aktuelle Kalenderwoche und Jahr.",EN:"Creates a copy of this report and uses current calendar week."},"report.copyof":{DE:"Dies ist eine Kopie",EN:"This is a copy"},"report.lastmodified":{DE:"Zuletzt geändert"},"report.createdon":{DE:"Erzeugt am"},"report.killing.msg":{DE:"Lösche Report {{reportToDelete.name}} in "},"report.428.title":{DE:"Report wure bearbeitet"},"report.428.msg":{DE:"Der Report wurde in der Zwischenzeit bearbeitet. Sie können Neuladen und die letzte Änderung verwerfen oder abbrechen, Ihre letzte Änderung sichern und manuell neuladen. Der Undo Stack wurde geleert, um Überschreiben zu verhindern."},"report.428.cancel":{DE:"Abbrechen"},"report.428.reload":{DE:"Neuladen und verwerfen"},"report.notification":{DE:"Empfänger für Report-Benachrichtigung",EN:"Recipients for report notification"},"report.notification.info":{DE:"E-Mails von Personen hinzufügen, um diesen Benachrichtigungen schicken zu können.",EN:"Add emails of people you want to notify."},"report.notification.title":{DE:"E-Mail senden",EN:"Send email"},"report.notification.text":{DE:"<strong>BETA Feature</strong><br>E-Mail an eingetragene Empfänger mit Link zu diesem Report schicken?",EN:"<strong>BETA Feature</strong><br>Send an email to recipients with a link to this report?"},"notification.subject.template":{DE:"Technischer Report {{name}} KW {{week}}|{{year}}",EN:"Technical report {{name}} CW {{week}}|{{year}}"},"notification.content.template":{DE:"Der technische Report fuer {{name}} - KW {{week}}|{{year}} ist verfuegbar unter {{url}} Dies ist eine automatisch generierte Benachrichtigung von preports.",EN:"Technical report for {{name}} - CW {{week}}|{{year}} is available under {{url}} This is an automatically generated notification from preports."},"report.notification.recipient":{DE:"Empfänger",EN:"Recipient"},"report.notification.recipient.ph":{DE:"E-Mail eingeben",EN:"Enter email"},back:{DE:"zurück",EN:"back"},start:{DE:"Start",EN:"Start"},end:{DE:"Ende",EN:"End"},save:{DE:"Speichern",EN:"Save"},cancel:{DE:"Abbrechen",EN:"Cancel"},enter:{DE:"Eingeben",EN:"Enter"},or:{DE:"oder",EN:"or"},all:{DE:"alle",EN:"all"},"file.dropzone":{DE:"Bilder hierher ziehen",EN:"Drop images"},search:{DE:"Suche",EN:"Search"},"delete":{DE:"Löschen",EN:"Delete"},copy:{DE:"Kopieren",EN:"Copy"},"error.title":{DE:"Ein Fehler ist aufgetreten",EN:"An error occured"},undo:{DE:"Rückgängig"},next:{DE:"Nächste"},prev:{DE:"Vorherige"},send:{DE:"Senden",EN:"Send"},name:{DE:"Name",EN:"Name"},"propertyeditor.error.required":{DE:"Pflichtfeld",EN:"Required"},"propertyeditor.error.email":{DE:"Bitte gültige E-Mail eingeben.",EN:"Please enter a valid email."}};a.value("translation",b)}]),angular.module("PReports.services").factory("language",["$log","translation",function(a,b){function c(){var a,b=navigator.language?navigator.language:navigator.userLanguage,c="com.bisnode.preports.user.language";return window.localStorage&&(a=window.localStorage.getItem(c)),a?a:(("undefined"===b||0==b.length)&&(b="DE"),b.substring(0,2).toUpperCase())}var d=c(),e={get:function(){return c()},set:function(a){d=a},translate:function(a){return a&&b[a]?b[a][d]||"":""}};return e}]),angular.module("PReports.services").provider("config",function(){var a=this;a.config_={serviceUrl:"http://127.0.0.1",servicePort:"3000",version:"0.5.1 Fancy Fox",notificationProvider:"com-bisnode-notification",notificationUrl:"http://ysr-dev-service-01:8181/rest/notification-service",priceRegExp:/([0123456789]+)\.([0123456789]*)/,currencyFormats:{EUR:"$1,$2 €",USD:"$ $1.$2"}},a.setConfig=function(b){a.config_.serviceUrl=b.serviceUrl,a.config_.servicePort=b.servicePort,a.config_.priceRegExp=b.priceRegExp,a.config_.currencyFormats=b.currencyFormats},a.setServiceUrl=function(b){a.config_.serviceUrl=b},a.setservicePort=function(b){a.config_.servicePort=b},a.setPriceRegExp=function(b){a.config_.priceRegExp=b},a.config_.getCombinedServiceUrl=function(){return a.config_.serviceUrl?a.config_.servicePort?a.config_.serviceUrl+":"+a.config_.servicePort:a.config_.serviceUrl:location.protocol+"//"+location.host},a.setCurrencyFormats=function(b,c){1==arguments.length&&(a.config_.currencyFormats=b),2==arguments.length&&(a.config_.currencyFormats[b]=c)},a.$get=function(){return a.config_}}),angular.module("PReports.services").factory("errorHandler",["$rootScope","$location","$log","language","config",function(a,b,c,d,e){function f(b,e,f,g){var h;arguments.length>1?(h={},h.data=b,h.status=e,h.headers=f,h.config=g):h=b.hasOwnProperty("data")?b:{data:b};var i=h.data.errorKey,j=h.data.message;a.error=!0,a.errorMessage=d.translate(i)||d.translate("error."+h.status)||j||d.translate("error.general")||"Error during communication with service.",c.error("Error during http method, response object: "+angular.toJson(h))}return f.reset=function(){a.error=!1},f}]),angular.module("PReports.services").factory("loadingService",function(){var a={requestCount:0,isLoading:function(){return a.requestCount>0}};return a}),angular.module("PReports.services").factory("onStartInterceptor",["loadingService","$rootScope",function(a,b){return function(c,d){return a.requestCount++,b.ajaxLoading=a.isLoading(),c}}]),angular.module("PReports.services").factory("onCompleteInterceptor",["loadingService","$rootScope","$q",function(a,b,c){return function(d){return d.then(function(c){return a.requestCount--,b.ajaxLoading=a.isLoading(),c},function(d){return a.requestCount--,b.ajaxLoading=a.isLoading(),c.reject(d)})}}]),angular.module("PReports.services").config(["$httpProvider",function(a){a.responseInterceptors.push("onCompleteInterceptor")}]),angular.module("PReports.services").run(["$http","onStartInterceptor",function(a,b){a.defaults.transformRequest.push(b)}]),angular.module("PReports.services").factory("helper",function(){var a={getFieldInputClass:function(a){return a.$dirty&&a.$invalid?"error":a.$dirty&&!a.$invalid?"success":""},isFunction:function(a){var b={};return a&&"[object Function]"===b.toString.call(a)},isUrl:function(a){var b=/(^http|^https):\/\//;return a?b.test(a):!1}};return a}),angular.module("PReports.services").factory("notification",["$http","errorHandler","language","$injector","config","$log",function(a,b,c,d,e,f){function g(){h={},h.url=e.notificationUrl}var h,i={initialized:!1};if(g(),i.send=function(){alert("Notifications not working currently."),f.log("PReports.services.notification.send: no valid notificationProvider to delegate send to")},!e.notificationProvider)return f.log("PReports.services.notification: no notificationProvider configured. Cancel initialization."),i;try{i=d.get(e.notificationProvider),i.config=h}catch(j){return f.error("PReports.services.notification: "+e.notificationProvider+" is not a valid notificationProvider.\n"+j),i}return i.initialized=!0,i}]),angular.module("PReports.services").factory("com-bisnode-notification",["$http","errorHandler","language","$interpolate","helper","$log",function(a,b,c,d,e,f){var g={},h={notifications:[{rawNotification:{notificationDeliveryMode:"EMAIL",recipients:[],content:"",subject:""}}]};return g.send=function(b,c,d,i){if(!g.config)return void f.log("PReports.services.com-bisnode-notification.send: config missing");if(!g.config.url)return void f.log("PReports.services.com-bisnode-notification.send: config has no url");var j=h.notifications[0].rawNotification;j.subject=b,j.content=c,j.recipients=[],angular.forEach(d,function(a){j.recipients.push({emailRecipient:a})}),a.post(g.config.url,h).success(function(a){e.isFunction(i)&&i(!0)}).error(function(a){e.isFunction(i)&&i(!1,a)})},g.isLive=!0,g}]),angular.module("PReports.filters",[]).filter("breakFilter",function(){return function(a){return void 0!==a?a.replace(/\n/g,"<br />"):void 0}}),angular.module("PReports.directives").directive("l",["$locale","language","$interpolate",function(a,b,c){return function(a,d,e,f){function g(f){f&&(h=b.translate(f)||(l?e[l]:d.html()),i=c(h),(j||angular.noop)(),j=a.$watch(i,function(a,b){l?d.attr(l,a):d.html(a)}))}var h,i,j,k=e.l,l=e.lAttribute;e.$observe("l",g),g(k)}}]),angular.module("PReports.directives").directive("simplePropertyEditor",["$timeout","$log","language","helper",function(a,b,c,d){function e(a){return c.translate(a)||a}function f(a){var b,c=(a.hasOwnProperty("editorRequired")?"required='required'":"",a.hasOwnProperty("editorRepeat")),d=(a.hasOwnProperty("editorPattern")?"ng-pattern='"+a.editorPattern+"'":"",a.hasOwnProperty("editorType")?a.editorType:"text");return c?("textarea"==d?b="":("email"!=d&&"password"!=d&&"number"!=d&&(d="text"),b='<div class="control-group" ng-class="getFieldInputClass(simplePropertyForm.repeatProperty.$invalid)"><div class="controls"><input type="'+d+'" name="repeatProperty" ng-model="editorRepeat" l-attribute="placeholder" l="propertyeditor.repeat.placeholder" required ng-change="matchInput()"></input><div class="help-inline" ng-show="simplePropertyForm.repeatProperty.$dirty && simplePropertyForm.repeatProperty.$invalid"><span ng-show="simplePropertyForm.repeatProperty.$error.required">'+e("propertyeditor.error.required")+'</span><span ng-show="simplePropertyForm.repeatProperty.$error.match">'+e("propertyeditor.error.match")+"</span></div></div></div>"),b):""}function g(a,b){var c,d=a.hasOwnProperty("editorRequired")&&!b?"required='required'":"",f=a.hasOwnProperty("editorPattern")?"ng-pattern='"+a.editorPattern+"'":"",g=a.hasOwnProperty("editorRepeat")?"ng-change='matchInput()'":"",h=a.hasOwnProperty("editorMaxLength")?"maxlength='"+a.editorMaxLength+"'":"",i=a.hasOwnProperty("editorPlaceholder")?"placeholder='"+e(a.editorPlaceholder)+"'":"",j=a.hasOwnProperty("editorType")?a.editorType:"text",k=b?"{{'simpleProperty'+"+b+"}}":"simpleProperty",l=b?"editorTranslations["+b+"]":"editorValue";return"textarea"==j?c='<textarea class="property-input" rows="8" cols="100" name="'+k+'" ng-model="'+l+'" '+h+" "+d+" "+f+" "+i+"></textarea>":("email"!=j&&"password"!=j&&"number"!=j&&"url"!=j&&(j="text"),c='<input class="property-input" type="'+j+'" '+i+' name="'+k+'" ng-model="'+l+'" '+h+" "+d+" "+f+" "+g+"></input>"),c}function h(a){return a?"error":a?"":"success"}var i={restrict:"A",replace:!1,transclude:!0,scope:{editorTitle:"@",editorPatternText:"@",editorOnSave:"&",editorEnabled:"=",editorValidate:"&",editorValidateText:"@",editorPlaceholder:"@",editorProperty:"=",editorField:"@",editorEntity:"="},template:function(a,b){var c,d=(b.hasOwnProperty("editorRequired")?"required='required'":"",b.hasOwnProperty("editorPattern")?"ng-pattern='"+b.editorPattern+"'":"",b.hasOwnProperty("editorField")?b.editorField:null),h=b.hasOwnProperty("editorEntity")?b.editorEntity:null;return c=d&&h?'<div class="toggler" ng-transclude></div><div class="simple-property-editor-mask"></div><div class="simple-property-editor" style="display:none; position:absolute; background-color:white;"><h5 class="editor-title" l="{{editorTitle}}">Edit property</h5><form name="simplePropertyForm" novalidate ng-submit="save()" class="edit-property-form"><div class="edit-property-form-inputs"><div class="control-group" ng-class="getFieldInputClass(simplePropertyForm.simpleProperty.$invalid)"><div class="controls">'+g(b)+'<i class="glyphicon glyphicon-remove" ng-click="clearInput()"></i><div class="help-inline text-danger" ng-show="simplePropertyForm.simpleProperty.$dirty && simplePropertyForm.simpleProperty.$invalid"><span ng-show="simplePropertyForm.simpleProperty.$error.required">'+e("propertyeditor.error.required")+'</span><span ng-show="simplePropertyForm.simpleProperty.$error.number">'+e("propertyeditor.error.number")+'</span><span ng-show="simplePropertyForm.simpleProperty.$error.pattern">'+e("propertyeditor.error.pattern")+'</span><span ng-show="simplePropertyForm.simpleProperty.$error.custom">'+e("propertyeditor.error.custom")+'</span><span ng-show="simplePropertyForm.simpleProperty.$error.email" >'+e("propertyeditor.error.email")+'</span></div></div></div><div ng-repeat="t in editorEntity.translations"><div class="control-group" ng-class="getFieldInputClass(simplePropertyForm.simpleProperty{{t.lang}}.$invalid)"><div class="controls"><label>{{getLanguageTitle(t.lang)}}</label>'+g(b,"t.lang")+'<i class="icon-remove icon-black" ng-click="clearInput(t.lang)"></i></div></div></div></div><div class="row-fluid" style="margin-top: 5px"><button type="button" ng-click="closeDialog()" class="btn" data-dismiss="modal" style="margin-right: 5px;">'+e("cancel")+'</button><button type="submit" class="btn btn-primary" ng-disabled="simplePropertyForm.$invalid">'+e("save")+"</button></div></form></div>":'<div class="toggler" ng-transclude></div><div class="simple-property-editor-mask"></div><div class="simple-property-editor" style="display:none; position:absolute; background-color:white;"><h5 class="editor-title" l="{{editorTitle}}">Edit property</h5><form name="simplePropertyForm" novalidate ng-submit="save()" class="edit-property-form"><div class=""><div class="control-group" ng-class="getFieldInputClass(simplePropertyForm.simpleProperty.$invalid)"><div class="controls">'+g(b)+'<i class="glyphicon glyphicon-remove" ng-click="clearInput()"></i><div class="help-inline text-danger" ng-show="simplePropertyForm.simpleProperty.$dirty && simplePropertyForm.simpleProperty.$invalid"><span ng-show="simplePropertyForm.simpleProperty.$error.required">'+e("propertyeditor.error.required")+'</span><span ng-show="simplePropertyForm.simpleProperty.$error.number">'+e("propertyeditor.error.number")+'</span><span ng-show="simplePropertyForm.simpleProperty.$error.pattern">'+e("propertyeditor.error.pattern")+'</span><span ng-show="simplePropertyForm.simpleProperty.$error.custom">'+e("propertyeditor.error.custom")+'</span><span ng-show="simplePropertyForm.simpleProperty.$error.email" >'+e("propertyeditor.error.email")+"</span></div></div></div>"+f(b)+'</div><div class="row-fluid"><button type="button" ng-click="closeDialog()" class="btn span6" data-dismiss="modal">'+e("common.cancel")+'</button><button type="submit" class="btn btn-primary span6" ng-disabled="simplePropertyForm.$invalid">'+e("common.save")+"</button></div></form></div>";
},compile:function(c,d,e){d.hasOwnProperty("editorRequired")?"required='required'":"",d.hasOwnProperty("editorPattern")?"ng-pattern='"+d.editorPattern+"'":"",d.hasOwnProperty("editorField")?d.editorField:null,d.hasOwnProperty("editorEntity")?d.editorEntity:null;return{pre:function(a,b,c,d){},post:function(c,d,e,f){var g=d.find("div.simple-property-editor"),i=d.find("div.simple-property-editor-mask"),j=d.find("input.property-input, textarea.property-input"),k=c.simplePropertyForm.simpleProperty,l=e.hasOwnProperty("editorEntity");e.hasOwnProperty("editorValidate")&&k.$parsers.push(function(a){return c.editorValidate?c.editorValidate({value:a})?(k.$setValidity("custom",!0),a):void k.$setValidity("custom",!1):void 0}),c.save=function(){c.simplePropertyForm.$valid&&!c.saved&&(c.saved=!0,l?(c.prevValue=c.editorEntity[c.editorField],c.editorEntity[c.editorField]=c.editorValue,angular.forEach(c.editorEntity.translations,function(a,b){a[c.editorField]=c.editorTranslations[b]})):c.editorProperty=c.editorValue,a(function(){c.editorOnSave({modifiedProperty:c.editorField,prevValue:c.prevValue})}),i.hide(),g.hide())},c.closeDialog=function(){i.hide(),g.hide()},c.clearInput=function(a){if(a){c.editorTranslations[a]="";var b='[name="simpleProperty'+a+'"]';d.find("input"+b+".property-input, textarea"+b+".property-input").trigger("focus")}else c.editorValue="",j.trigger("focus");c.editorRepeat&&(c.editorRepeat="")},c.matchInput=function(){c.simplePropertyForm.simpleProperty.$viewValue!==c.simplePropertyForm.repeatProperty.$viewValue?c.simplePropertyForm.repeatProperty.$setValidity("match",!1):c.simplePropertyForm.repeatProperty.$setValidity("match",!0)},c.getLanguageTitle=function(a){return a?langcodesMap[a]?langcodesMap[a].lang:a:void 0},d.find("div.toggler").bind("click",function(){if(1==c.editorEnabled||"undefined"==typeof c.editorEnabled){c.editorRepeat="",c.saved=!1,l?(c.editorValue=c.editorEntity[c.editorField],c.editorTranslations={},angular.forEach(c.editorEntity.translations,function(a,b){c.editorTranslations[b]=a[c.editorField]})):c.editorValue=c.editorProperty,c.$digest();var a,e,f,h,k,m;e=d.find("div.toggler").offset().top-d.find("div.toggler").offsetParent().offset().top,a=d.find("h5.editor-title").css("lineHeight"),a=a.replace("px",""),k=d.find("div.value"),f=$(document).height(),h=$(window).width(),i.css({width:h,height:f}),i.show();try{k&&1==k.length&&(m=k.offset().left-k.offsetParent().offset().left,g.css("left",m))}catch(n){b.error("simplePropertyEditor: failed to calculate left")}g.css("top",e-a-25),g.show(),j.trigger("focus")}}),i.bind("click",function(){c.closeDialog()}),g.bind("keyup",function(a){27==a.which&&c.closeDialog()}),c.getFieldInputClass=h}}}};return i}]),angular.module("PReports.directives").directive("simpleConfirmDialog",["language","$log","$timeout",function(a,b,c){var d={restrict:"A",replace:!1,transclude:!0,priority:100,scope:{dialogTitle:"@",dialogText:"@",dialogOnConfirm:"&",dialogConfirmButton:"@",dialogDisabled:"=",dialogConfirmBtnCls:"@"},template:function(a,b){var c,d=b.hasOwnProperty("dialogConfirmBtnCls")?b.dialogConfirmBtnCls:"btn-primary";return c='<span class="toggler" ng-transclude></span><div class="modal confirm-modal"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><button type="button" class="close" data-dismiss="modal">×</button><h4 l="{{dialogTitle}}">Confirm dialog</h4></div><div class="modal-body"><p l="{{dialogText}}"></p></div>  <div class="modal-footer"><button type="button" class="btn" data-dismiss="modal" l="cancel">Cancel</button><button type="button" class="btn '+d+'" data-dismiss="modal" ng-click="confirm()" l="{{dialogConfirmButton}}">Confirm</button></div></div></div></div>'},compile:function(a,b,d){return{pre:function(a,b,c,d){},post:function(a,b,d,e){var f=b.find(".simple-confirm-dialog");a.confirm=function(){f.modal("hide"),c(a.dialogOnConfirm,150)},b.find(".toggler").bind("click",function(){var c;a.dialogDisabled||(c=b.find(".confirm-modal"),c.modal("toggle"))})}}}};return d}]),angular.module("PReports.directives").directive("tooltip",["$locale","language",function(a,b){return function(a,c,d,e){var f,g=d.tooltip,h=d.tooltipPosition||"top";g&&(f=b.translate(g)||g,f&&c.tooltip({title:f,placement:h}))}}]);