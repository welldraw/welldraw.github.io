var angular = require('angular');

var app = require("../app.js");

app.controller('ToastController', ['$scope', '$mdToast', 'WellPaper', function ($scope, $mdToast, WellPaper) {
    $scope.returnColor = function (color) {
        $mdToast.hide();
        WellPaper.changeColorCurrentSelection(color);
    };
}]);

module.exports = app.directive('wellColorChooser', ['$compile', '$mdToast', 'WellPaper', function ($compile, $mdToast, WellPaper) {
    'use strict';
    return {
        restrict: 'E',
        template: '<span><md-button style="min-width:0px; padding:0px; margin:0px" ng-show="selState.changeColor" ng-click="openColor()">' +
            '<img type="button" class="wd-button" ng-src="/app/content/buttons/pick_color_50x50.png"></img>' +
            '<md-tooltip md-direction="bottom">Change Color</md-tooltip>' +
            '</md-button></span>',
        //        templateUrl: '/app/scripts/directives/wellColorChooser.html',
        replace: true,
        link: function (scope, element, attr) {
            var modalInstance;
            scope.openColor = function () {
                //                $mdToast.showSimple("hello");
                $mdToast.show({
                    templateUrl: '/app/scripts/directives/wellColorChooser.html',
                    hideDelay: 6000,
                    controller: 'ToastController',
                    position: "bottom right",
                    parent: document.querySelector("#drawingContainer")
                });
            };



        }
    };
}]);
