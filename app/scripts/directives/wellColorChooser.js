var angular = require('angular');

var app = require("../app.js");

module.exports = app.directive('wellColorChooser', ['$compile', 'WellPaper', function ($compile, WellPaper) {
    'use strict';
    return {
        restrict: 'E',
        template: '<img type="button" class="wd-button" ng-src="/app/content/buttons/pick_color_50x50.png" uib-tooltip="Change Color" tooltip-placement="bottom"></img>',
        //templateUrl: '/app/scripts/directives/wellSvgTemplate.html',
        replace: true,
        link: function (scope, element, attr) { 
            
            
        }
    };
}]);