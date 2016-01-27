var angular = require('angular');

var app = require("../app.js");

module.exports = app.directive('wellOpenFile', ['$compile', '$mdDialog', 'WellPaper', function ($compile, $mdDialog, WellPaper) {
    'use strict';
    return {
        restrict: 'E',
        template: '<span><md-button well-drop class="wd-button-wrap" ng-show="selState.changeColor" ng-click="openFile()">' +
            '<img type="button" class="wd-button" ng-src="/app/content/buttons/open_50x50.png"></img>' +
            '<md-tooltip md-direction="bottom">Load Saved Well</md-tooltip>' +
            '</md-button></span>',
        replace: true,
        link: function (scope, element, attr) {
            var modalInstance;
            scope.openFile = function () {
                //                $mdToast.showSimple("hello");
                $mdDialog.show({
                    templateUrl: '/app/scripts/directives/wellOpenFile.html',
                    clickOutsideToClose: true,
                    controller: 'OpenFileController',
                    //parent: '#drawingContainer'
                    //position: "bottom right",
                    //parent: document.querySelector("#drawingContainer")
                });
            };



        }
    };
}]);

app.controller('OpenFileController', ['$scope', '$mdDialog', 'WellPaper', function ($scope, $mdDialog, WellPaper) {
    $scope.loadFromBrowser = function () {
        $mdDialog.hide();
        WellPaper.openWell();
    };
}]);
