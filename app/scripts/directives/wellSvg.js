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
            scope.saveControls = false;

            var s = WellPaper.createSurface(800, 800);

            window.onresize = function () {
                WellPaper.setCoords(element[0].getBoundingClientRect());
            };

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
            scope.addDrillString = WellPaper.addDrillString;
            scope.addCasingRunningString = WellPaper.addCasingRunningString;
            scope.save = scope.saveDownload; //WellPaper.saveWell;
            scope.open = WellPaper.openWell;

            WellPaper.selectionMade.then(null, null, function (obj) {
                scope.selState = setVisibility(obj.selectionType);
                if (obj.x && obj.y) {
                    contextControls.css({
                        left: String(obj.x) + 'px',
                        top: String(obj.y) + 'px'
                    });
                } else {
                    contextControls.css({
                        left: '5px',
                        top: '5px'
                    });
                }
                scope.textBoxInfo = obj.textBoxInfo;
                if (obj.textBoxInfo) scope.tbText = obj.textBoxInfo.text;
            });

            scope.tbChange = function () {
                scope.textBoxInfo.callback(scope.tbVar);
            };

            scope.$watch('textBoxInfo.width', function (newValue) {
                if (newValue) {
                    scope.tbStyle = {
                        width: newValue + 'px'
                    };
                }
            });

            scope.$watch('tbText', function (newValue) {
                if (newValue) {
                    scope.textBoxInfo.callback(newValue);
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
                if (selection === selectionTypes.fluidFill) obj.delete = false;
                if (selection === selectionTypes.none) obj.show = false;
                if (selection === selectionTypes.textBox) obj.editText = true;
                if (selection === selectionTypes.casingString || selection === selectionTypes.tubingString) {
                    obj.addPacker = true;
                    obj.addTextBox = true;
                }
                return obj;
            }

            scope.startSave = function () {
                console.log("starting save");
                scope.saveControls = true;
                scope.focusOnSaveInput();
            };

            scope.saveToBrowser = function () {
                WellPaper.saveWell(true);
                scope.saveControls = false;
            };

            scope.saveDownload = function () {
                var saveObj = WellPaper.saveWell(false);
                var blob = new Blob([JSON.stringify(saveObj)], {
                    type: "text/plain;charset=utf-8"
                });
                scope.saveControls = false;
                var name;
                name = scope.saveName && scope.saveName.length > 0 ? scope.saveName : "well drawing";
                saveAs(blob, name + ".json");
            };
        }
    };
}]);
