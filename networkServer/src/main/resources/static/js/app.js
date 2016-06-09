(function () {

    var app = angular.module('networkServer', ['ui.bootstrap', 'ngRoute', 'toaster', 'ngAnimate'])
        .filter('friendlyRoleName', friendlyRoleName)
        .filter('getByProperty', getByProperty)
            .filter('bytes', function() {
            return function(bytes, precision) {
                if (bytes === 0) { return '0 bytes' }
                if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
                if (typeof precision === 'undefined') precision = 1;

                var units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'],
                    number = Math.floor(Math.log(bytes) / Math.log(1024)),
                    val = (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision);

                return  (val.match(/\.0*$/) ? val.substr(0, val.indexOf('.')) : val) +  ' ' + units[number];
            }
        })
        .directive('toNumber', toNumber)
        .directive('fileModel', fileModel)
        .service('transactionService', transactionService)
        .service('toasterService', toasterService)
        .service('fileUpload', fileUpload)
        .service('settingsService', settingsService)
        .controller("NavController", NavController)
        .controller("TransactionController", TransactionController)
        .controller("UploadController", UploadController)
        .config(config)
        .run(['transactionService', function(transactionService) {
            transactionService.initialize();
        }]);



    function config($routeProvider) {
        $routeProvider
            .when("/transaction-report", {
                templateUrl: "transaction-report",
                controller: "TransactionController",
                controllerAs: 'transactionCtrl'
            })
            .when("/upload", {
                templateUrl: "upload",
                controller: "UploadController",
                controllerAs: "uploadCtrl"
            })
            .when("/home", {
                templateUrl: "about"
            })

            .otherwise({
                redirectTo: "home"
            });
    }

    TransactionController.$inject = ['transactionService', 'toasterService'];
    function TransactionController(transactionService, toasterService) {
        var self = this;

        self.transactions = [];
        self.status = 'Complete';
        self.operation = 'Both';
        self.error = null;

        self.startDate = '';
        self.stopDate = '';
        self.openStartDatePopup = openStartDatePopup;
        self.openEndDatePopup = openEndDatePopup;
        self.resend = resend;

        self.getOrgURL = getOrgURL;

        self.totalRecords = 0;
        self.offset = 0;
        self.limit = 10;

        self.startDatePopup = {
            opened: false
        };

        self.endDatePopup = {
            opened: false
        };

        self.dateOptions = {
            formatYear: 'yy',
            maxDate: new Date(2020, 5, 22),
            minDate: new Date(),
            startingDay: 1
        };

        self.getTransactions = getTransactions;

        activate();

        function activate() {

            getTransactions();

        }

        function getOrgURL(orgID) {
            return "http://" + directoryServer + "/services/rest/v1/organizations/" + orgID;
        }

        function resend(tran) {
            transactionService.resend(tran).then(function(data){
                self.transactions.push(data);
                toasterService.success("Successfully resent document.");
            },function(error){
                toasterService.error("Failed to resend document.");
            })
        }


        function today() {
            self.startDate = new Date();
            self.endDate = new Date();
        }

        function clear() {
            self.startDate = null;
            self.endDate = null;
        }

        function openStartDatePopup() {
            self.startDatePopup.opened = true;
        };

        function openEndDatePopup() {
            self.endDatePopup.opened = true;
        };


        function getTransactions() {
            transactionService.getTransactions(
                self.status,
                self.operation,
                self.startDate,
                self.endDate,
                self.limit,
                self.offset).then(function(response){
                    self.transactions = response.data;
                    self.totalRecords = response.headers('X-Total-Count');

            });
        }
    }


    UploadController.$inject = ['fileUpload', 'settingsService'];
    function UploadController(fileUpload, settingsService) {
        var self = this;

        self.uploadFile = uploadFile;
        self.documentFormats = getSupportedDocumentFormatsForEndpoint();
        self.documentFormat = ''; //selected document format.
        self.recipientName = '';
        self.senderName = '';
        self.endpointURL = 'http://';
        self.fileToUpload = '';
        self.schoolCode = '';
        self.schoolCodeType = '';
        self.deliveryMethods = [];

        self.documentTypes = getSupportedDocumentTypes();

        self.documentType = '';

        self.departments = getSupportedDepartments();
        self.department = '';


        //initialize();

        function uploadFile() {
            console.log("Transfer file.");
            fileUpload.uploadFileToUrl(self.fileToUpload,
                self.documentFormat.name,
                self.documentType.name,
                self.department.name,
                self.schoolCode,
                self.schoolCodeType);
        }

        function getDeliveryMethods() {
            settingsService.getDeliveryMethods().then(function (data) {
                self.deliveryMethods = data;
            });
        }

        function getDocumentFormats() {
            settingsService.getDocumentFormats().then(function (data) {
                self.documentFormats = data;
            });
        }

        function getDepartments() {
            settingsService.getDepartments().then(function (data) {
                self.departments = data;
            });
        }

        function getDocumentTypes() {
            settingsService.getDocumentTypes().then(function (data) {
                self.documentTypes = data;
            });
        }


        function initialize() {
            getDocumentFormats();
            //getDocumentTypes();
          //  getDepartments();
            //getDeliveryMethods();
        }

        function getSupportedDocumentTypes() {
            return [
                {
                    "id": 1,
                    "name": "Transcript",
                    "description": "Academic transcript."
                },
                {
                    "id": 2,
                    "name": "Transcript Request",
                    "description": "Academic transcript request."
                }
            ] ;

        }

        function getSupportedDepartments() {
            return [
                {
                    "id": 1,
                    "name": "English",
                    "description": "The English department."
                },
                {
                    "id": 2,
                    "name": "Administration",
                    "description": "Administration department"
                }
            ];
        }
        function getSupportedDocumentFormatsForEndpoint() {
            //TODO : ajax call to endpont to get supported doc formats.
            return [{ id: 1, name: 'XML', description: 'EXtensible Markup Language.'},
                { id: 2, name: 'PDF', description: 'Adobe Portable Document Format.'},
                { id: 3, name: 'PESCXML', description: 'PESC’s Core Component Naming convention is based on the Core Component naming convention described in the UNCEFACT Core Component Technical Specification. The UNCEFACT Core Component Technical Specification’s naming convention is based on the standards outlined ISO 11179 Part 5 – Naming and Identification Principles for Data Elements. The Core Component Technical Specification expands upon the ISO 11179 naming convention standards to include Core Component Types and Business Information Entities.'},
                { id: 4, name: 'TEXT', description: 'A human-readable format'} ];
        }
    }



    NavController.$inject = ['$location'];

    function NavController($location) {
        var self = this;

        self.isActive = function (viewLocation) {
            return viewLocation === $location.path();
        };
    }

    toasterService.$inject = [ 'toaster'] ;

    function toasterService(toaster) {
        var service = {
            success: success,
            error: error,
            ajaxInfo: ajaxInfo,
            renderHtml: renderHtml
        } ;

        return service;

        function success(text) {
            toaster.pop('success', "Success", text);
        }

        function ajaxInfo(responseObject) {
            toaster.pop('info', responseObject.error, responseObject.message);
        }

        function error(text) {
            toaster.pop('error', "Error", text);
        }

        function renderHtml(type, title, html) {
            toaster.pop(type, title, html,null, 'trustedHtml');
        }
    }


    fileUpload.$inject = [ '$http', 'toasterService'] ;

    function fileUpload($http, toasterService) {
        var service = {
            uploadFileToUrl: uploadFileToUrl
        } ;

        return service;

        function uploadFileToUrl(file, fileFormat, documentType, department, schoolCode, schoolCodeType){
            var fd = new FormData();
            fd.append('file', file);
            fd.append('file_format', fileFormat );
            fd.append('school_code', schoolCode);
            fd.append('school_code_type', schoolCodeType);
            fd.append('document_type', documentType);
            fd.append('department', department);

            $http.post('/api/v1/documents/outbox', fd, {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
            })
            .success(function(data){
                toasterService.renderHtml('info', 'Upload', data);
            })
            .error(function(data){
                toasterService.renderHtml('error', 'Upload', data);
            });
        }

    }

    settingsService.$inject = ['$http', '$q', '$cacheFactory', 'toasterService', '$window'];

    function settingsService($http, $q, $cacheFactory, toasterService, $window) {


        var service = {
            getDeliveryMethods: getDeliveryMethods,
            getDocumentFormats: getDocumentFormats,
            getDocumentTypes: getDocumentTypes,
            getDepartments: getDepartments
        };

        return service;

        function getDeliveryMethods() {
            var deferred = $q.defer();

            $http.get('http://' + $window.directoryServer + '/services/rest/v1/delivery-methods', {
                cache: true
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (data) {
                toasterService.ajaxInfo(data);
                deferred.reject("An error occured while fetching delivery methods.");
            });

            return deferred.promise;
        }

        function getDocumentFormats() {
            var deferred = $q.defer();

            $http.get('http://' + $window.directoryServer + '/services/rest/v1/document-formats', {
                headers: {
                    'Access-Control-Allow-Origin': 'http://localhost:8000'
                },
                cache: true
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (data) {
                toasterService.ajaxInfo(data);
                deferred.reject("An error occured while fetching document formats.");
            });

            return deferred.promise;
        }

        function getDepartments() {
            var deferred = $q.defer();

            $http.get('http://' + $window.directoryServer + '/services/rest/v1/departments', {
                cache: true
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (data) {
                toasterService.ajaxInfo(data);
                deferred.reject("An error occured while fetching department definitions.");
            });

            return deferred.promise;
        }

        function getDocumentTypes() {
            var deferred = $q.defer();

            $http.get('http://' + $window.directoryServer + '/services/rest/v1/document-types', {
                cache: true
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function (data) {
                toasterService.ajaxInfo(data);
                deferred.reject("An error occured while fetching document type definitions.");
            });

            return deferred.promise;
        }


    }



    transactionService.$inject = [ '$http', '$q', '$cacheFactory', 'toasterService'];

    function transactionService($http, $q, $cacheFactory, toasterService) {
        var service = {
            getTransactions: getTransactions,
            resend: resend,
            initialize: initialize
        };

        return service;

        function initialize() {
            console.log("TODO: transactionService initialize")
        }

        function resend(tran) {
            var deferred = $q.defer();

            $http.get('/api/v1/documents/send', {
                'params': {
                    'transaction_id': tran.id
                },
                cache: false
            }).success(function (data) {
                deferred.resolve(data);
            }).error(function(data){
                toasterService.ajaxInfo(data);
                deferred.reject("An error occured while sending a document for transaction id " + tran.id);
            });

            return deferred.promise;
        }


        function getTransactions(status, operation, startDate, endDate, limit, offset) {

            var deferred = $q.defer();

            $http.get('/api/v1/transactions', {
                'params': {
                    'operation' : operation,
                    'offset' : offset,
                    'limit' : limit,
                    'from': startDate,
                    'to' : endDate,
                    'status': status
                },
                cache: false
            }).then(function (response) {
                deferred.resolve(response);
            });

            return deferred.promise;
        }
    }

    fileModel.$inject = [ '$parse' ];

    function fileModel($parse) {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                var model = $parse(attrs.fileModel);
                var modelSetter = model.assign;

                element.bind('change', function(){
                    scope.$apply(function(){
                        modelSetter(scope, element[0].files[0]);
                    });
                });
            }
        };
    };


    function toNumber() {
        return {
            require: 'ngModel',
            link: function (scope, element, attrs, ngModel) {
                ngModel.$parsers.push(function (val) {
                    return parseInt(val, 10);
                });
                ngModel.$formatters.push(function (val) {
                    return '' + val;
                });
            }
        }
    }

    function getByProperty() {
        return function(propertyName, propertyValue, collection) {
            var i=0, len=collection.length;
            for (; i<len; i++) {
                if (collection[i][propertyName] == +propertyValue) {
                    return collection[i];
                }
            }
            return null;
        }
    }

    //TODO: refactor roles names for the network server.
    function friendlyRoleName() {
        return function (input) {

            var friendlyName = '';

            switch (input) {
                case 'ROLE_SYSTEM_ADMIN':
                    friendlyName = "System Administrator";
                    break;
                case 'ROLE_ORG_ADMIN':
                    friendlyName = "Organization Administrator";
                    break;
                case 'ROLE_SUPPORT':
                    friendlyName = "Support Technician";
                    break;
                default:
                    friendlyName = "Unknown Role"
            }

            return friendlyName;
        };
    }


})();
