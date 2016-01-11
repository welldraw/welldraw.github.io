var angular = require('angular');

var app = require("../app.js");

module.exports = app.directive('inputFocusFunction', ['$timeout', function ($timeout) {
    'use strict';
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            scope[attr.inputFocusFunction] = function () {
                $timeout(function () {
                    element.focus()
                });
            };
        }
    };
}]);
