/** @module drop.js */


var angular = require('angular');
var app = require("../app.js");


/** @function wellDrop
 * @description directive for handling drop of anything a lens can have dropped
 */
app.directive('wellDrop', ['WellPaper', function (WellPaper) {
    'use strict';
    var loadDragInfo;

    /**@enum dragType 
     * @description indicates type of drag and drop event
     */
    var dragTypes = {
        notSupported: 0,
        token: 1,
        file: 2,
        url: 3
    };

    /**
     * @function linkFunc
     * @description sets up the directive and adds the event listeners to the element
     * @param {Object} scope   scope of the directive
     * @param {Object} element element
     * @param {Object} attrs   attributes attached to the directive (none supported)
     */
    var linkFunc = function (scope, element, attrs) {


        /**
         * @function wasDropped
         * @description handler for the drop
         * @param {Object} e drop event
         */
        function wasDropped(e) {
            if (e.preventDefault) {
                e.preventDefault();
            }
            if (e.stopPropogation) {
                e.stopPropogation();
            }

            loadDragInfo(e);

            angular.element(element).removeClass("dragoverAccept");

            if (e.dragInfo.type === dragTypes.file) {
                WellPaper.loadFromFile(e.dataTransfer.files[0]);
                //RecordsWalletService.upload(e.dataTransfer.files, scope.handle.token);
            } else if (e.dragInfo.type === dragTypes.url) {
                console.log("handle url:" + e.dragInfo.url);
            }
        }

        /**
         * @function handleDragOver
         * @description handle the drag over event so the dropEffect can be registered
         * @param   {Object}  e event
         * @returns {Boolean} 
         */
        function handleDrag(e) {
            if (e.preventDefault) {
                e.preventDefault();
            }
            e.dataTransfer.dropEffect = 'copy';
            angular.element(element).addClass("dragoverAccept");
            return false;
        }

        /**
         * @function handleDragLeave
         * @description removes the styling from the element when the drag leaves it's focus
         */
        function handleDragLeave() {
            angular.element(element).removeClass("dragoverAccept");
        }


        /**
         * @function loadDragInfo
         * @description determines information about the drag and drop event.  Saves it by extending event e with e.dragInfo
         * @param   {Object}            e event
         * @returns {Object<dragTypes>} enum dragType indicating what type of drag and drop event it is
         */
        function loadDragInfo(e) {
            var id, url, fName;
            e.dragInfo = {};
            e.dragInfo.type = dragTypes.notSupported;
            console.log(e.dataTransfer.getData("text/html"));
            if (e.dataTransfer.files.length > 0) {
                fName = e.dataTransfer.files.item(0).name;
                e.dragInfo.type = dragTypes.file;
            } else {
                id = angular.element(e.dataTransfer.getData("text/html")).attr('id');
                url = e.dataTransfer.getData("Url");
                if (typeof id !== "undefined") {
                    //extend the event to save the token
                    e.dragInfo.token = id;
                    e.dragInfo.type = dragTypes.token;
                } else if (typeof url !== "undefined") {
                    e.dragInfo.url = url;
                    e.dragInfo.type = dragTypes.url;
                }
            }

            return e.dragInfo.type;
        }


        element[0].addEventListener("drop", wasDropped, false);
        element[0].addEventListener("dragover", handleDrag, false);
        element[0].addEventListener("dragleave", handleDragLeave, false);

    };

    return {
        restrict: "A",
        link: linkFunc
    };
}]);
