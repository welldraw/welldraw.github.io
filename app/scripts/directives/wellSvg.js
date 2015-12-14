app.directive('wellSvg', ['$compile', 'WellPaper', function ($compile, WellPaper) {
    'use strict';
    return {
        restrict: 'E',
        template: "<div id='drawingContainer'></div>",
        replace: true,
        link: function (scope, element, attr) {
            var s = WellPaper.createSurface(800, 800);
            scope.selType = WellPaper.selectionTypes;
            scope.selState = scope.selType.none;
            element.append(s.node);
            s.node.style.border = "1px solid black";

            var controls = angular.element('<div id="controlsContainer"></div>');
            var genControls = angular.element('<div></div>');
            genControls.append(angular.element('<img type="button" ng-src="/app/content/buttons/add_casing_50x50.png" uib-tooltip="Add Casing" width="30" ng-click="add()"></img>'));
            genControls.append(angular.element('<img type="button" ng-src="/app/content/buttons/add_tubing_50x50.png" uib-tooltip="Add Tubing" width="30" ng-click="addTubing()"></img>'));

            var contextControls = angular.element('<div ng-show="selState" id="contextControlsContainer"></div>');
            var casingSelectedControls = angular.element('<div ng-show="selState===selType.casingString"><div>Selected Element Options:</div></div>');
            casingSelectedControls.append(angular.element('<img type="button" ng-src="/app/content/buttons/Remove.png" uib-tooltip="Delete this String" tooltip-placement="bottom" width="30" ng-click="delete()"></img>'));
            casingSelectedControls.append(angular.element('<img type="button" ng-src="/app/content/buttons/add_packer_50x50.png" uib-tooltip="Add Packer to String" tooltip-placement="bottom" width="30" ng-click="addPacker()"></img>'));

            //            casingSelectedControls.append(angular.element('<button type="button" class="btn btn-default" ng-click="addPacker()">Add Packer</button>'));

            var packerSelectedControls = angular.element('<div ng-show="selState===selType.packer"><div>Selected Element Options:</div></div>');
            packerSelectedControls.append(angular.element('<img type="button" ng-src="/app/content/buttons/Remove.png" width="30" ng-click="delete()"></img>'));

            contextControls.append(casingSelectedControls).append(packerSelectedControls);

            controls.append(genControls);
            //controls.append(contextControls); 
            $compile(controls)(scope);
            element.append(controls);
            $compile(contextControls)(scope);
            element.append(contextControls);

            //var dynamicMenuNode = < div


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
