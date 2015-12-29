var angular = require('angular');

var app = require("../app.js");

module.exports = app.directive('wellSvg', ['$compile', 'WellPaper', function ($compile, WellPaper) {
    'use strict';
    return {
        restrict: 'E',
        //template: "<div id='drawingContainer'></div>",
        templateUrl: '/app/scripts/directives/wellSvgTemplate.html',
        replace: true,
        link: function (scope, element, attr) {


            var selectionTypes = WellPaper.selectionTypes;
            scope.selState = setVisibility(selectionTypes.none);

            var s = WellPaper.createSurface(800, 800);
            WellPaper.setCoords(element[0].getBoundingClientRect());
            element.bind('resize', function () {
                WellPaper.setCoords(element[0].getBoundingClientRect());
            });

            element.prepend(s.node);
            s.node.style.border = "1px solid black";



            var contextControls = angular.element(document.querySelectorAll('#contextControlsContainer'));

            scope.add = WellPaper.addNewString;
            scope.delete = WellPaper.deleteCurrent;
            scope.addPacker = WellPaper.addPacker;
            scope.addTubing = WellPaper.addTubing;
            scope.addTextBox = WellPaper.addTextBox;

            WellPaper.selectionMade.then(null, null, function (obj) {
                scope.selState = setVisibility(obj.selectionType);
                if (obj.x && obj.y) {
                    contextControls.css({
                        left: String(obj.x - 20) + 'px',
                        top: String(obj.y + 10) + 'px'
                    });
                } else {
                    contextControls.css({
                        left: '5px',
                        top: '5px'
                    });
                }
            });

            function setVisibility(selection) {
                var obj = {
                    show: true,
                    delete: true,
                    addPacker: false,
                    changeColor: true,
                    addTextBox: false
                };
                if (selection === selectionTypes.none) obj.show = false;
                if (selection === selectionTypes.casingString || selection === selectionTypes.tubingString) {
                    obj.addPacker = true;
                    obj.addTextBox = true;
                }
                return obj;
            }
        }
    };
}]);
