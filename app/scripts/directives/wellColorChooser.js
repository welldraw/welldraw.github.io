var angular = require('angular');

var app = require("../app.js");

module.exports = app.directive('wellColorChooser', ['$compile', '$mdDialog', 'WellPaper', function ($compile, $mdDialog, WellPaper) {
    'use strict';
    return {
        restrict: 'E',
        template: '<span><md-button class="wd-button-wrap" ng-show="selState.changeColor" ng-click="openColor()">' +
            '<img type="button" class="wd-button" ng-src="/app/content/buttons/pick_color_50x50.png"></img>' +
            '<md-tooltip md-direction="bottom">Change Color</md-tooltip>' +
            '</md-button></span>',
        //        templateUrl: '/app/scripts/directives/wellColorChooser.html',
        replace: true,
        link: function (scope, element, attr) {
            var modalInstance;
            scope.openColor = function () {
                //                $mdToast.showSimple("hello");
                $mdDialog.show({
                    templateUrl: '/app/scripts/directives/wellColorChooser.html',
                    clickOutsideToClose: true,
                    controller: 'ColorController',
                    //parent: '#drawingContainer'
                    //position: "bottom right",
                    //parent: document.querySelector("#drawingContainer")
                });
            };



        }
    };
}]);

app.controller('ColorController', ['$scope', '$mdDialog', 'WellPaper', function ($scope, $mdDialog, WellPaper) {
    $scope.returnColor = function (color) {
        $mdDialog.hide();
        WellPaper.changeColorCurrentSelection(color);
    };
}]);
