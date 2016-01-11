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
        template: '<img type="button" class="wd-button" ng-src="/app/content/buttons/pick_color_50x50.png" ng-click="openColor()"></img>',
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
                //                    parent: element[0],
                //                    hideDelay: 6000
                //                });
            };



        }
    };
}]);
