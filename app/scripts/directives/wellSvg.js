var angular = require('angular');
//var saveAs = require('/app/components/FileSaver.js/FileSaver.js').saveAs;
var saveAs = require('../../components/FileSaver.js/FileSaver.js').saveAs;

var app = require("../app.js");

module.exports = app.directive('wellSvg', ['$compile', '$timeout', 'WellPaper', function ($compile, $timeout, WellPaper) {
    'use strict';
    return {
        restrict: 'E',
        //template: "<div id='drawingContainer'></div>",
        templateUrl: '/app/scripts/directives/wellSvgTemplate.html',
        replace: true,
        link: function (scope, element, attr) {


            var selectionTypes = WellPaper.selectionTypes;
            scope.selState = setVisibility(selectionTypes.none);
            scope.textBoxInfo = {};
            scope.tbStyle = {};

            var s = WellPaper.createSurface(800, 800);

            element.bind('resize', function () {
                WellPaper.setCoords(element[0].getBoundingClientRect());
            });

            element.prepend(s.node);
            s.node.style.border = "1px solid black";
            $timeout(function () {
                WellPaper.setCoords(element[0].getBoundingClientRect());
            });


            var contextControls = angular.element(document.querySelectorAll('#contextControlsContainer'));

            scope.add = WellPaper.addNewString;
            scope.delete = WellPaper.deleteCurrent;
            scope.addPacker = WellPaper.addPacker;
            scope.addTubing = WellPaper.addTubing;
            scope.addTextBox = WellPaper.addTextBox;
            scope.save = scope.saveDownload; //WellPaper.saveWell;
            scope.open = WellPaper.openWell;

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
                scope.textBoxInfo = obj.textBoxInfo;
            });

            scope.$watch('textBoxInfo.width', function (newValue) {
                if (newValue) {
                    scope.tbStyle = {
                        width: newValue + 'px'
                    };
                }
            });

            function setVisibility(selection) {
                var obj = {
                    show: true,
                    delete: true,
                    addPacker: false,
                    changeColor: true,
                    addTextBox: false,
                    editText: false
                };
                if (selection === selectionTypes.none) obj.show = false;
                if (selection === selectionTypes.textBox) obj.editText = true;
                if (selection === selectionTypes.casingString || selection === selectionTypes.tubingString) {
                    obj.addPacker = true;
                    obj.addTextBox = true;
                }
                return obj;
            }

            scope.saveDownload = function () {
                var saveObj = WellPaper.saveWell();
                var blob = new Blob([JSON.stringify(saveObj)], {
                    type: "text/plain;charset=utf-8"
                });
                //temp commentout for testing saveAs(blob, "wellData.json");
            };
        }
    };
}]);
