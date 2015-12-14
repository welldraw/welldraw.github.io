app.directive('wellSvg', ['$compile', 'WellPaper', function ($compile, WellPaper) {
    'use strict';
    return {
        restrict: 'E',
        //template: "<div id='drawingContainer'></div>",
        templateUrl: '/app/scripts/directives/wellSvgTemplate.html',
        replace: true,
        link: function (scope, element, attr) {
            var s = WellPaper.createSurface(800, 800);
            scope.selType = WellPaper.selectionTypes;
            scope.selState = scope.selType.none;
            element.prepend(s.node);
            s.node.style.border = "1px solid black";

            var contextControls = angular.element(document.querySelectorAll('#contextControlsContainer'));

            scope.add = WellPaper.addNewString;
            scope.delete = WellPaper.deleteCurrent;
            scope.addPacker = WellPaper.addPacker;
            scope.addTubing = WellPaper.addTubing;

            WellPaper.selectionMade.then(null, null, function (obj) {
                scope.selState = obj.selectionType;
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
        }
    };
}]);
