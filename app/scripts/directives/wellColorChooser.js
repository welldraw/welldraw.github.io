var angular = require('angular');

var app = require("../app.js");

module.exports = app.directive('wellColorChooser', ['$compile', '$uibModal', 'WellPaper', function ($compile, $uibModal, WellPaper) {
    'use strict';
    return {
        restrict: 'E',
        template: '<img type="button" class="wd-button" ng-src="/app/content/buttons/pick_color_50x50.png" uib-tooltip="Change Color" tooltip-placement="bottom" ng-click="openColor()"></img>',
//        templateUrl: '/app/scripts/directives/wellColorChooser.html',
        replace: true,
        link: function (scope, element, attr) { 
            var modalInstance;  
            scope.openColor = function (size) {
                modalInstance = $uibModal.open({
                  animation: true,
                  templateUrl: '/app/scripts/directives/wellColorChooser.html',
//                    template: '<button type="button" class="btn btn-default" ng-click="returnColor(\'black\')">black</button>' + 
//                    '<button type="button" class="btn btn-default" ng-click="returnColor(\'red\')">red</button>' + 
//                    '<button type="button" class="btn btn-default" ng-click="returnColor(\'blue\')">blue</button>' + 
//                    '<button type="button" class="btn btn-default" ng-click="returnColor(\'#aaaaaa\')">gray</button>' + 
//                    '<button type="button" class="btn btn-default" ng-click="returnColor(\'green\')">green</button>' + 
//                    '<button type="button" class="btn btn-default" ng-click="returnColor(\'brown\')">brown</button>',
                  //controller: 'ModalInstanceCtrl',
                  size: 'sm'
                });
                
                modalInstance.result.then(function (selectedItem) {
                  scope.selected = selectedItem;
                }, function () {

                });
            };
            
            scope.returnColor = function(color){
                modalInstance.close();
                WellPaper.changeColorCurrentSelection(color);
            };
            
        }
    };
}]);