//var Snap = require("snapsvg");
var angular = require('angular');
var app = require("../app.js");

module.exports = app.factory('WellPaper', ['$q', 'appConst', 'csLib', function ($q, appConst, csLib) {
    'use strict';
    var well;
    var paper;
    var handles = [];
    var selectionDefer = $q.defer();
    this.selectionMade = selectionDefer.promise;

    var selectionTypes = {
        none: 0,
        casingString: 1,
        packer: 2,
        openHole: 3,
        groundLevel: 4,
        cement: 5,
        textBox: 6
    };
    this.selectionTypes = selectionTypes;

    this.createSurface = function (x, y) {


        paper = new Snap(x, y);
        paper.attr({
            stroke: "#000",
            strokeWidth: 4,
            fill: "#000",
            fontSize: "12"
        });
        paper.dblclick(handleNewString);
        paper.click(handleClick);
        paper.mousemove(handleMouseMove);
        paper.width = x;
        paper.height = y;
        paper.midPoint = x / 2;


        well = new Well(x / 2);
        this.well = well;

        console.log(well);
        well.height = y;
        well.width = x;
        well.initOpenHole();

        well.groundLine.select();



        return paper;
    };


    /* GLOBAL EVENT HANDLERS ********************************************************************************************************/
    var handleNewString = function (evt) {
        evt = svgXY(evt);
        well.makeCasingString(evt.svgX, evt.svgY);
    };
    var handleClick = function (evt) {
        if (well.drag.happened) {
            well.drag.happened = false;
            return;
        }

        if (well.selectedItem) {
            deselectCurrent();
        }

        //Find the registered clickable elements
        if (evt.srcElement.hasOwnProperty("clickInfo")) {
            if (evt.srcElement.clickInfo.hasOwnProperty('baseElementSet')) {
                evt.srcElement.clickInfo.baseElementSet.select();
            } else {
                evt.srcElement.clickInfo.handler();
            }
        }

    };
    var handleMouseMove = function (evt) {
        if (paper.hasOwnProperty("unhighlight") && paper.unhighlight) {
            paper.unhighlight();
            delete paper.unhighlight;
        }
        if (evt.srcElement.hasOwnProperty("clickInfo") && !well.drag.happened) {
            if (evt.srcElement.clickInfo.hasOwnProperty('baseElementSet')) {
                evt.srcElement.clickInfo.baseElementSet.highlight();
                paper.unhighlight = angular.bind(evt.srcElement.clickInfo.baseElementSet, evt.srcElement.clickInfo.baseElementSet.unhighlight);
            } else {
                evt.srcElement.clickInfo.highlight();
                paper.unhighlight = evt.srcElement.clickInfo.unhighlight;
            }
        } else {

        }
    };

    /* EXPOSED API CONTROL FUNCTIONS ********************************************************************************************************/
    this.addNewString = function () {
        var x = well.midPoint + 40;
        var y = (paper.height - well.groundLevel) * 0.7 + well.groundLevel;
        well.strings.forEach(function (string) {
            if (string.bottom < y) y = string.bottom;
            if (string.x.right > x) x = string.x.right;
        });
        well.makeCasingString(x + appConst.cementWidth + 6, Math.max(y - ((paper.height - well.groundLevel) * 0.15), well.groundLevel + 100));
    };
    this.addTubing = function () {
        well.addTubingString();
    };
    this.deleteCurrent = function () {
        well.selectedItem.delete();
        delete well.selectedItem;
    };
    this.addPacker = function () {
        if (well.selectedItem) well.selectedItem.addPacker();
    };

    this.changeColorCurrentSelection = function (color) {
        if (well.selectedItem) well.selectedItem.changeColor(color);
    };

    this.addTextBox = function () {
        if (well.selectedItem) well.selectedItem.addTextBox();
    };

    this.setCoords = function (rect) {
        paper.rect = rect;
    };

    /* GLOBAL UTILITIES ****************************************************************************************************************/
    /**
     * @function mirrorPoint
     * @description get the x coordinate accross the centerline from the one given
     * @param {Number} x coordinate
     * @returns {Number} mirror x coordinate
     */
    function mirrorPoint(x) {
        return paper.midPoint - (x - paper.midPoint);
    }

    var notifySelection = function (selType, x, y) {
        well.selectionObject = {
            selectionType: selType,
            x: x,
            y: y
        };
        selectionDefer.notify(well.selectionObject);
    };

    var updateContextMenuPos = function (x, y) {
        well.selectionObject.x = x;
        well.selectionObject.y = y;
    };

    var hideSelection = function () {
        //        if (csLib.isExist(well.selectedItem.notifySelection)) {
        selectionDefer.notify({
            selectionType: selectionTypes.none
        });
        //        }
    };

    var restoreSelection = function () {
        //        if (csLib.isExist(well.selectedItem.notifySelection))
        console.log(well.selectionObject);
        selectionDefer.notify(well.selectionObject);
    };

    /**
     * @function deselectCurrent
     * @description removes but not delete the handles from the paper
     */
    var deselectCurrent = function () {
        handles.forEach(function (element, index) {
            element.remove();
        });
        handles = [];
        if (well) {
            well.selectedItem = null;
            notifySelection(selectionTypes.none);
        }
    };

    /**
     * @function hideHandlesDuringDrag
     * @description temporarily removes handles that aren't actively being dragged so the user can see what's going on with the drag.
     */
    var hideHandlesDuringDrag = function (beingDragged) {
        handles.forEach(function (element, index) {
            //if (element.node !== beingDragged) 
            element.remove();
        });
    };

    /**
     * @function restoreHandlesAfterDrag
     * @description restores handles after the drag.
     */
    var restoreHandlesAfterDrag = function () {
        handles.forEach(function (element, index) {
            paper.append(element);
        });
    };

    var svgXY = function (evt) {
        var obj = {
            svgX: evt.x - paper.rect.left,
            svgY: evt.y - paper.rect.top
        };
        return obj;
    };




    /* CLASSES ****************************************************************************************************************/
    /**
     * @class Well
     * @description the entire well being displayed
     * @param {Number} center x coordinate of the center of the well
     */
    var Well = function (center) {
        this.midPoint = center;
        this.groundLevel = 50;
        this.strings = [];
        this.tubingStrings = [];
        this.drag = {};
        this.lowestCasing = this.groundLevel;

        this.groundLine = new GroundLevel(this, center, this.groundLevel);
    };
    Well.prototype = {
        /**
         * @function makeCasingString
         * @description make a casing set with casing, cement, and triangle
         * @param   {Number} x coordinate
         * @param   {Number} y coordinate
         * @returns {Number} well.strings[] index of the new casing
         */
        makeCasingString: function (x, y) {
            var newCasing = new CasingString(this, x, y);
            this.strings.push(newCasing);
            return newCasing;
        },
        addTubingString: function (x, y) {
            x = csLib.useThisOrAlternate(x, this.midPoint + 15);
            y = csLib.useThisOrAlternate(y, this.height * 0.75);
            this.tubingStrings.push(new TubingString(this, x, y));
        },
        moveTops: function (oldy, deltay) {
            this.strings.concat(this.tubingStrings).forEach(function (string) {
                if (string.hasOwnProperty('casing')) {
                    if (string.top < oldy + 10) string.move(null, null, string.top + deltay);
                }
            });
        },
        updatedString: function (string) {
            this.checkOHLowest(string);
            this.checkWidestString(string);
        },
        checkOHLowest: function (string) {
            var saveE = string;
            var bottom = 0;
            this.strings.forEach(function (element, index) {
                if (element.bottom > bottom) {
                    bottom = element.bottom;
                    saveE = element;
                }
            });
            if (!csLib.isExist(saveE)) {
                well.openHole.hide();
            }
            //test if string is currently or used to be the lowest
            else if (!csLib.isExist(string) || (string === saveE || this.lowestString === string)) {
                well.openHole.show();
                this.openHole.move(saveE.x.right, null, saveE.bottom);
            }
            this.lowestString = saveE;
        },
        checkWidestString: function (string) {
            var maxw;
            var saveE;
            if (string) {
                saveE = string;
                maxw = string.x.width();
            } else {
                maxw = 0;
            }
            this.strings.forEach(function (element, index) {
                if (element.x.width() > maxw) {
                    maxw = element.x.width();
                    saveE = element;
                }
            });
            if (!csLib.isExist(saveE)) {
                this.groundLine.move(this.midPoint, null);
            }
            //test if casing is currently or used to be the maxw
            else if (string === saveE || this.widestString === string || (string === null || string === undefined)) {
                this.groundLine.move(saveE.x.right, null);
            }
            this.widestString = saveE;
        },
        initOpenHole: function () {
            this.openHole = new OpenHole(this, 100, 700, 100);
        }
    };

    var XSet = function (midPoint, x) {
        this.midPoint = midPoint;
        if (csLib.isExistPositive(x)) {
            this.setBoth(x);
        }
    };
    XSet.prototype = {
        mirrorPoint: function (x) {
            return this.midPoint - (x - this.midPoint);
        },
        setBoth: function (x) {
            this.right = Math.max(x, this.mirrorPoint(x));
            this.left = this.mirrorPoint(this.right);
            this.enforceBounds();
        },
        enforceBounds: function () {
            if (this.right - this.left < 2) {
                this.right = this.midPoint + 1;
                this.left = this.midPoint - 1;
            }
        },
        width: function () {
            return this.right - this.left;
        },
        /**
         * @function getSign
         * @description get sign indicating which side of the centerline x is on
         * @param   {Number} x coordinate
         * @returns {Number} 1 or -1 as the sign
         */
        getSign: function (x) {
            return (x > this.midPoint) ? 1 : -1;
        }
    };

    var ParentString = function (well, x, y) {
        this.well = well;
        this.x = new XSet(well.midPoint, x);
        this.bottom = y;
        this.top = well.groundLevel;
        this.minHeight = 20;

        this.packers = [];
        this.textBoxes = [];
        this.hanger = new Hanger(this);
        this.packers.push(this.hanger);
    };
    ParentString.prototype = {
        move: function (x, bottom, top) {
            if (csLib.isExistPositive(x)) this.x.setBoth(x);
            if (csLib.isExistPositive(bottom)) this.bottom = bottom;
            if (csLib.isExistPositive(top)) this.top = top;
            this.packers.forEach(function (element) {
                element.move();
            });
            this.enforceMinHeight();
            this.updateElementPos();
            updateContextMenuPos(this.x.right, this.bottom);
        },
        enforceMinHeight: function () {
            if (this.bottom - this.top < this.minHeight) this.bottom = this.top + this.minHeight;
        },
        addPacker: function () {
            this.packers.push(new Packer(this));
        },
        addTextBox: function () {
            this.textBoxes.push(new TextBox(this, this.x.right + 50, this.bottom + 10, "New Textbox for you to try out to see how it goes"));
        },
        removePacker: function (packer) {
            var i = this.packers.indexOf(packer);
            if (i >= 0) this.packers.splice(i, 1);
        },
        changeColor: function (color) {
            this.casing.changeColor(color);
        },
        dragMoveTop: function (x, y, dx, dy, evt) {
            evt = svgXY(evt);
            this.move(null, null, evt.svgY);
        },
        dragMove: function (dx, dy, x, y, evt) {
            evt = svgXY(evt);
            this.move(evt.svgX, evt.svgY);
        },
    };

    var BaseElementSet = function (parent) {
        if (parent) {
            this.parent = parent;
            this.well = parent.well;
        }
        this.elements = [];
        this.x = [];
        this.strokeColor = '#000';
        this.selectElement = this;
        /** @private notifySelection
         * @description can be set to a member from selectionTypes to indicate that the DOM should be notified of the selection so that it can display the proper menu
         * if it is left null the DOM will not be notified
         */
        this.notifySelection = null;
    };
    BaseElementSet.prototype = {
        highlight: function () {
            this.recolor(appConst.highlightHex);
        },
        unhighlight: function () {
            this.recolor(this.strokeColor);
        },
        changeColor: function (color) {
            this.strokeColor = color;
            this.recolor(this.strokeColor);
        },
        recolor: function (color) {
            this.elements.forEach(function (element) {
                element.attr({
                    stroke: color
                });
            });
        },
        select: function () {
            this.elements.forEach(function (element, index) {
                element.handles.forEach(function (element) {
                    element.reAdd();
                });
            });
            well.selectedItem = this.selectElement;
            if (csLib.isExist(this.notifySelection)) {
                notifySelection(this.notifySelection, this.selectElement.x.right, this.selectElement.bottom + 5);
            }
        },
        postCreate: function () {
            deselectCurrent();
        },
        /**
         * @function remove
         * @description removes the elementSet and all assciated elements from the paper.  Does not delete.  Overloaded
         * with the same property name as the Snap.svg elements, Handles, and String classes, so remove() can be called agnostically
         */
        remove: function () {

            this.elements.forEach(function (element, index) {
                element.handles.forEach(function (element) {
                    element.remove();
                });
                element.remove();
            });

        },
        /**
         * @function registerSelectClickable
         * @description add clickInfo to the element node so it can be accessed when a click happens
         */
        registerSelectClickable: function () {
            this.elements.forEach(angular.bind(this, function (element) {
                element.node.clickInfo = {
                    baseElementSet: this.selectElement
                };
            }));
        },

        /**
         * @function initHandles
         *                   @description make an empty handles array for each element if it doesn't already exist
         */
        initHandles: function () {
            this.elements.forEach(function (element) {
                if (!element.handles) element.handles = [];
            });
        },
        /**
         * @function showHandles
         * @description show the handles associated with a string
         */
        showHandles: function () {
            this.elements.forEach(angular.bind(this, function (element) {
                element.handles.forEach(function (handle) {
                    handle.reAdd();
                });
            }));
        },
        width: function () {
            return Math.abs(x[1] - x[0]);
        }
    };

    /**
     * @class CasingString
     * @param {Number} x inside bottom corner of the string
     * @param {Number} y bottom of the string
     */
    var CasingString = function (well, x, y) {
        ParentString.call(this, well, x, y);


        //Make the elements in order of layering
        this.cement = new Cements(this);
        this.triangles = new Triangles(this);
        this.casing = new Casing(this);

        this.well.checkOHLowest(this);
        this.well.checkWidestString(this);

        //Show the handles on the new string
        this.select();
    };
    CasingString.prototype = angular.copy(ParentString.prototype);
    angular.extend(CasingString.prototype, {
        select: function () { //copy of selectString
            this.casing.select();
            //this.cement.select();
            this.well.selectedItem = this;
            notifySelection(selectionTypes.casingString, this.x.right, this.bottom);
        },
        remove: function () {
            this.casing.remove();
            this.triangles.remove();
            if (this.packers && this.packers.length > 0) this.packers.forEach(function (element, index, array) {
                element.remove();
            });
            this.cement.remove();

        },
        highlight: function () {
            this.casing.highlight();
            this.triangles.highlight();
            //this.cement.highlight();
        },
        unhighlight: function () {
            this.casing.unhighlight();
            this.triangles.unhighlight();
            //this.cement.unhighlight();
        },
        updateElementPos: function () {
            this.casing.move();
            this.triangles.move();
            this.cement.move();
            this.well.updatedString(this);
        },
        delete: function () {
            var string = this;
            string.remove();
            deselectCurrent();
            this.well.strings.forEach(function (element, index, array) {
                if (element === string) delete array[index];
            });
            string = null;
            this.well.updatedString(null);
        }
    });




    /**
     * @class TubingString
     * @param {Number} x inside bottom corner of the string
     * @param {Number} y bottom of the string
     */
    var TubingString = function (well, x, y) {
        ParentString.call(this, well, x, y);
        this.well = well;

        //Make the elements in order of layering
        this.casing = new Casing(this, x, y);

        //Show the handles on the new string
        this.select();
    };
    TubingString.prototype = angular.copy(ParentString.prototype);
    angular.extend(TubingString.prototype, {
        select: function () { //copy of selectString
            this.casing.select();
            this.well.selectedItem = this;
            notifySelection(selectionTypes.casingString, this.x.right, this.bottom);
        },
        remove: function () {
            this.casing.remove();
            if (this.packers && this.packers.length > 0) this.packers.forEach(function (element, index, array) {
                element.remove();
            });
        },
        highlight: function () {
            this.casing.highlight();
        },
        unhighlight: function () {
            this.casing.unhighlight();
        },
        updateElementPos: function () {
            this.casing.move();
        },
        delete: function () {
            var string = this;
            string.remove();
            deselectCurrent();
            this.well.strings.forEach(function (element, index, array) {
                if (element === string) delete array[index];
            });
            string = null;
        }
    });


    var TextBox = function (parent, left, top, text) {
        BaseElementSet.call(this);
        this.parent = parent;
        this.well = parent.well;

        this.left = left;
        this.top = top;
        this.selectElement = this;
        this.strokeColor = 'black';
        this.attrs = {
            stroke: this.strokeColor,
            strokeWidth: 0.005
        };
        this.width = 150;

        this.text = text;
        this.textElems = [];

        this.buildWrappedText(this.text, this.width);

        this.visible = true;

        this.initHandles();
        this.elements[0].handles[0] = new Handle(this.left - 10, this.top + this.halfH, angular.bind(this, this.dragMove));
        this.elements[0].handles[1] = new Handle(this.left + this.width + 10, this.top + this.halfH, angular.bind(this, this.dragResizeWidth));

        this.registerSelectClickable();
        this.postCreate();
        this.select();
    };
    TextBox.prototype = angular.copy(BaseElementSet.prototype);
    angular.extend(TextBox.prototype, {
        dragMove: function (dx, dy, x, y, evt) {
            evt = svgXY(evt);

            this.move(evt.svgX + 10, evt.svgY - this.halfH);
        },
        dragResizeWidth: function (dx, dy, x, y, evt) {
            evt = svgXY(evt);
            //            this.move(evt.svgX, evt.svgY);
            var oldX = this.elements[0].handles[1].e.attr('cx');
            dx = evt.svgX - oldX;
            this.width += dx;
            this.buildWrappedText(this.text, this.width);
            this.elements[0].handles[0].move(this.left - 10, this.top + this.halfH);
            this.elements[0].handles[1].move(this.left + this.width + 10, this.top + this.halfH);
        },
        move: function (left, top) {
            var i;
            if (csLib.isExistPositive(left)) this.left = left;
            if (csLib.isExistPositive(top)) this.top = top;
            for (i = 0; i < this.elements.length; i++) {
                this.elements[i].attr({
                    x: this.left,
                    y: this.top + (this.lineHeight * (i + 1)),
                });
            }
            this.elements[0].handles[0].move(this.left - 10, this.top + this.halfH);
            this.elements[0].handles[1].move(this.left + this.width + 10, this.top + this.halfH);
        },
        buildWrappedText: function (text, len) {
            var wordArr = text.split(/(\s|-)/);
            var wordIndex,
                lineIndex = 0,
                lines = [];
            var testElem = paper.text(0, 0, "");
            for (wordIndex = 0; wordIndex < wordArr.length; wordIndex++) {
                if (!csLib.isExist(lines[lineIndex])) {
                    if (wordArr[wordIndex].search(/\s|-/) >= 0) {
                        if (lineIndex > 0) lines[lineIndex - 1] += wordArr[wordIndex];
                    } else {
                        lines[lineIndex] = wordArr[wordIndex];
                    }
                } else {
                    testElem.node.innerHTML = lines[lineIndex] + wordArr[wordIndex];
                    if (testElem.node.getComputedTextLength() > len) {
                        lineIndex++;
                        wordIndex--;
                    } else {
                        lines[lineIndex] += wordArr[wordIndex];
                    }

                }
            }
            this.lineHeight = testElem.node.getBBox().height;
            testElem.remove();
            //var g = [];
            for (lineIndex = 0; lineIndex < lines.length; lineIndex++) {
                if (!csLib.isExist(this.elements[lineIndex])) {
                    this.elements[lineIndex] = paper.text(this.left, this.top + this.lineHeight * (lineIndex + 1), lines[lineIndex]).attr(this.attrs);
                    if (lineIndex > 0) this.elements[lineIndex].handles = [];
                } else {
                    this.elements[lineIndex].node.innerHTML = lines[lineIndex];
                    if (this.elements[lineIndex].hasOwnProperty('hasBeenRemoved')) {
                        paper.append(this.elements[lineIndex]);
                        delete this.elements[lineIndex].hasBeenRemoved;
                    }
                }
            }
            this.height = lineIndex * this.lineHeight;
            this.halfH = this.height / 2;

            //continue for any further elements using lineIndex to remove text
            for (; lineIndex < this.elements.length; lineIndex++) {
                if (csLib.isExist(this.elements[lineIndex])) {
                    //                    this.elements[lineIndex].node.innerHTML = "";
                    this.elements[lineIndex].remove();
                    this.elements[lineIndex].hasBeenRemoved = true;
                    //this.elements[lineIndex] = [];
                }
            }

            this.registerSelectClickable();
            //            this.move();
        }
    });




    /**
     * @class OpenHole
     * @description makes a jagged open hole element at the bottom of the lowest casing
     * @param {Number} x inner x coordinate
     * @param {Number} bottom coordinate for the open hole section
     * @param {Number} top top of the open hole section
     */
    var OpenHole = function (well, x, bottom, top) {
        BaseElementSet.call(this);
        this.well = well;
        this.x = new XSet(this.well.midPoint, 1);
        this.bottom = bottom;
        this.top = top;
        this.selectElement = this;
        this.strokeColor = 'brown';

        this.elements[0] = paper.path(this.getPathString()).attr({
            fill: 'none',
            stroke: this.strokeColor
        });
        this.visible = true;

        this.initHandles();
        this.elements[0].handles[0] = new Handle(well.midPoint, this.bottom, angular.bind(this, this.dragOHBottom));

        this.hide();
        this.registerSelectClickable();
        this.postCreate();
    };
    OpenHole.prototype = angular.copy(BaseElementSet.prototype);
    angular.extend(OpenHole.prototype, {
        dragOHBottom: function (dx, dy, x, y, evt) {
            evt = svgXY(evt);
            this.move(null, evt.svgY, null);
        },
        getPathString: function () {
            var path = "";
            var length = this.bottom - this.top;
            var curLen = 0;
            var i;
            var diff;
            var maxY = this.yValues.length - 1;
            var maxX = this.xValues.length - 1;
            for (i = 0; i < 10000; i++) {
                curLen += this.yValues[i % maxY];
                diff = Math.max(curLen - length, 0);
                path += "l " + this.xValues[i % maxX] + " " + Number(Number(this.yValues[i % maxY]) - Number(diff)).toString() + " ";
                if (curLen >= length) break;
            }
            path += "M" + this.x.left + " " + this.top + " " + path;
            path += "h " + (this.x.right - this.x.left);
            return "M" + this.x.right + " " + this.top + " " + path;
        },
        move: function (x, bottom, top) {
            if (x >= 0 && x !== undefined && x !== null) this.x.right = x;
            if (bottom >= 0 && bottom !== undefined && bottom !== null) this.bottom = bottom;
            if (top >= 0 && top !== undefined && top !== null) this.top = top;
            if (!this.isVisible) this.show();
            this.enforceBounds();
            this.x.left = mirrorPoint(this.x.right);
            this.elements[0].attr({
                path: this.getPathString()
            });
            this.elements[0].handles[0].move(this.x.midPoint, this.bottom);
        },
        enforceBounds: function () {
            if (this.bottom < this.top) {
                this.bottom = this.top;
            }
        },
        show: function () {
            this.visible = true;
            paper.append(this.elements[0]);

        },
        hide: function () {
            this.visible = false;
            this.elements[0].remove();
            this.elements[0].handles[0].hide();
        },
        isVisible: function () {
            return this.visible;
        },
        xValues: [0, 2, 1, -3, 0, 0, 2, -3, 1, 3, -1, -1, 2, 0, -2, -2, 0, 3, -1, 1, 3, -3, 0, 2, -2, 0, -1, 0, -2, 0, -2, 3, 0],
        yValues: [3, 5, 7, 2, 6, 10, 4, 3, 8, 7, 2, 6, 9, 4, 4, 9, 7, 2, 6, 4, 8, 2, 4, 7, 6, 1, 2, 8, 9, 1, 4, 5, 7, 2, 1, 4, 5, 3, 8, 4, 1, 5, 2]
    });




    /**
     * @function Packer
     * @description packer component that gets added to casingString
     * @param {object}   parent casing element the packer is bound to
     * @param {Number} bottom bottom of packer (optional)
     * @param {Number} height height (optional)
     * @param {number} width  starting width (optional)
     */
    var Packer = function (parent, bottom, height, width) {
        BaseElementSet.call(this, parent);
        this.bottom = bottom || this.parent.bottom - 10;
        this.height = height || 10;
        this.width = width || 15;
        this.dragInfo = {
            startX: 0
        };

        this.x = new XSet(this.well.midPoint, this.parent.x.right - this.width);

        this.selectElement = this; //selections should happen at the Packer level
        this.notifySelection = selectionTypes.packer;

        this.elements[0] = paper.polygon(this.points(this.x.right));
        this.elements[1] = paper.polygon(this.points(this.x.left));

        this.initHandles();
        this.elements[1].handles[0] = new Handle(this.handleX(this.x.left), this.handleY(), angular.bind(this, this.drag));
        this.elements[0].handles[0] = new Handle(this.handleX(this.x.right), this.handleY(), angular.bind(this, this.drag));

        this.registerSelectClickable();

        deselectCurrent();
        this.select();
    };
    Packer.prototype = angular.copy(BaseElementSet.prototype);
    angular.extend(Packer.prototype, {
        points: function (x, sign) {
            if (sign === undefined || sign === null) sign = this.x.getSign(x);
            return [x, this.bottom, x, this.bottom - this.height, x + (this.width * sign),
                    this.bottom - this.height, x + (this.width * sign), this.bottom];
        },
        handleY: function () {
            return this.bottom - this.height / 2;
        },
        handleX: function (x) {
            return x;
        },
        drag: function (dx, dy, x, y, evt) {
            evt = svgXY(evt);
            this.move(evt.svgX, evt.svgY);
        },
        move: function (x, y) {
            this.updateX(x);
            this.updateY(y);

            this.enforceBounds();
            this.updatePositions();
        },
        updateY: function (y) {
            if (y >= 0 && y !== undefined && y !== null) this.bottom = y + this.height / 2;
        },
        updateX: function (x) {
            if (csLib.isExistPositive(x)) {
                this.x.setBoth(x);
                this.width = (this.parent.x.right - this.x.right);
            } else {
                if (this.dragInfo.id !== this.well.drag.id) {
                    this.dragInfo.id = this.well.drag.id;
                }
                //                if (!this.dragInfo.preserveWidth) {
                this.width = (this.parent.x.right - this.x.right);
                //                }
            }

        },
        updatePositions: function () {
            this.elements[0].attr({
                points: this.points(this.x.right)
            });
            this.elements[1].attr({
                points: this.points(this.x.left)
            });
            this.elements[0].handles[0].move(this.handleX(this.x.right), this.handleY());
            this.elements[1].handles[0].move(this.handleX(this.x.left), this.handleY());
            updateContextMenuPos(this.x.right, this.bottom + this.height);
        },
        enforceBounds: function () {
            if (this.bottom > this.parent.bottom) {
                this.bottom = this.parent.bottom;
            }
            if (this.width < 5) {
                this.width = 5;
                this.x.setBoth(this.parent.x.right - this.width);
            }
        },
        delete: function () {
            console.log(this);
            deselectCurrent();
            this.remove();
            this.parent.removePacker(this);
        }
    });

    /**
     * @function Hanger
     * @description a hanger element fixed to the top of each casing object.  Inherits from Packer and is essentially a packer with negative width
     * @param {object} parentCasing the casing its attached to
     */
    var Hanger = function (parentCasing) {
        this.height = 6;
        Packer.call(this, parentCasing, parentCasing.top, 6, -6);
    };
    Hanger.prototype = angular.copy(Packer.prototype);
    Hanger.prototype.enforceBounds = function () {
        if (this.width > -5) {
            this.width = -5;
        }
        this.x.setBoth(this.parent.x.right - this.width);
        this.bottom = this.parent.top;
    };
    Hanger.prototype.updateY = function (y) {
        if (y >= 0 && y !== undefined && y !== null) {
            this.parent.move(null, null, y + (this.height / 2));
        }
    };

    /**
     * @class Casing
     * @description makes the vertical lines for the casing as a new object and provides functions for manipulating them   
     * @param {CasingString} parent the parent CasingString object
     * @param {Number} x inner x coordinate
     * @param {Number} y coordinate for bottom of the casing
     */
    var Casing = function (parent) {
        BaseElementSet.call(this, parent);


        this.selectElement = this.parent; //selections should happen at the parent level

        this.elements[0] = paper.line(this.parent.x.right, this.parent.bottom, this.parent.x.right, this.parent.top);
        this.elements[1] = paper.line(this.parent.x.left, this.parent.bottom, this.parent.x.left, this.parent.top);


        this.initHandles();
        this.elements[0].handles[1] = new Handle(this.parent.x.right, this.parent.top, angular.bind(this.parent, this.parent.dragMoveTop));
        this.elements[1].handles[1] = new Handle(this.parent.x.left, this.parent.top, angular.bind(this.parent, this.parent.dragMoveTop));
        this.elements[0].handles[0] = new Handle(this.parent.x.right, this.parent.bottom, angular.bind(this.parent, this.parent.dragMove));
        this.elements[1].handles[0] = new Handle(this.parent.x.left, this.parent.bottom, angular.bind(this.parent, this.parent.dragMove));

        this.registerSelectClickable();
        this.postCreate();
    };
    Casing.prototype = angular.copy(BaseElementSet.prototype);
    angular.extend(Casing.prototype, {
        /**
         * @function move
         * @description set the position of the casing
         * @param {Number} x inner x coordinate.  Leave null to not change x coordinate
         * @param {Number} bottom coordinate for bottom of the casing.  Leave null to not change
         * @param {Number} top Top of the casing string. Leave null to not change
         */
        move: function () {
            this.elements[0].attr({
                x1: this.parent.x.right,
                x2: this.parent.x.right,
                y1: this.parent.bottom,
                y2: this.parent.top
            });
            this.elements[1].attr({
                x1: this.parent.x.left,
                x2: this.parent.x.left,
                y1: this.parent.bottom,
                y2: this.parent.top
            });
            this.elements[0].handles[1].move(this.parent.x.right, this.parent.top);
            this.elements[1].handles[1].move(this.parent.x.left, this.parent.top);
            this.elements[0].handles[0].move(this.parent.x.right, this.parent.bottom);
            this.elements[1].handles[0].move(this.parent.x.left, this.parent.bottom);
        },
        enforceBounds: function () {
            if ((this.parent.bottom - this.parent.top) < 15) this.parent.bottom = this.parent.top + 15;
            if (this.parent.x.right - this.parent.x.left < 10) {
                this.parent.x.right = well.midPoint + 5;
                this.parent.x.left = well.midPoint - 5;
            }
        },
        dragMoveTop: function (dx, dy, x, y, evt) {
            evt = svgXY(evt);
            this.move(null, null, evt.svgY);
            if (this.parent.triangles) this.parent.triangles.move();
            if (this.parent.cement) this.parent.cement.move();
        }
    });

    /**
     * @class Triangles
     * @description makes the triangles for the casing as a new object and provides functions for manipulating them   
     * @param {CasingString} parent the parent CasingString object
     * @param {Number} x inner x coordinate
     * @param {Number} y coordinate for bottom of the triangle
     */
    var Triangles = function (parent) {
        BaseElementSet.call(this, parent);


        this.selectElement = this.parent; //selections should happen at the parent level
        this.elements[0] = paper.polygon(this.triPoints(this.parent.x.right, this.parent.bottom)).attr(this.triFormat());
        this.elements[1] = paper.polygon(this.triPoints(this.parent.x.left, this.parent.bottom)).attr(this.triFormat());

        this.initHandles();
        this.registerSelectClickable();
        this.postCreate();
    };
    Triangles.prototype = angular.copy(BaseElementSet.prototype);
    angular.extend(Triangles.prototype, {
        triPoints: function (x, y) {
            var sign = this.parent.x.getSign(x);
            var d = 10;
            return [x, y, x, y - d, x + (d * sign), y];
        },
        triFormat: function () {
            return {
                fill: '#555'
            };
        },
        move: function () {
            this.elements[0].attr({
                points: this.triPoints(this.parent.x.right, this.parent.bottom)
            });
            this.elements[1].attr({
                points: this.triPoints(this.parent.x.left, this.parent.bottom)
            });
        }
    });



    /**
     * @class Cements
     * @description makes the vertical lines for the casing as a new object and provides functions for manipulating them   
     * @param {CasingString} parent the parent CasingString object
     * @param {Number} x inner x coordinate
     * @param {Number} y coordinate for bottom of the casing
     */
    var Cements = function (parent, x, y) {
        BaseElementSet.call(this, parent);

        this.shoeY = this.parent.bottom;
        this.bottom = this.shoeY;
        this.height = appConst.cementHeight;
        this.top = this.bottom - this.height;
        this.x = this.parent.x;

        this.selectElement = this; //selections should happen for cement seperate from rest of string
        this.strokeColor = "#aaaaaa";
        this.notifySelection = selectionTypes.packer;


        this.enforceBounds();

        this.elements[0] = paper.polygon(this.cementPoints(this.parent.x.right)).attr(this.cemFormat(this.strokeColor));
        this.elements[1] = paper.polygon(this.cementPoints(this.parent.x.left)).attr(this.cemFormat(this.strokeColor));

        this.initHandles();
        this.elements[0].handles[0] = new Handle(this.parent.x.right + (appConst.cementWidth), this.bottom - (this.height / 2), angular.bind(this, this.dragCement));
        this.elements[1].handles[0] = new Handle(this.parent.x.left - (appConst.cementWidth), this.bottom - (this.height / 2), angular.bind(this, this.dragCement));
        this.elements[0].handles[1] = new Handle(this.parent.x.right + (appConst.cementWidth), this.bottom - this.height, angular.bind(this, this.dragCementTop));
        this.elements[1].handles[1] = new Handle(this.parent.x.left - (appConst.cementWidth), this.bottom - this.height, angular.bind(this, this.dragCementTop));

        this.registerSelectClickable();
        this.postCreate();
    };
    Cements.prototype = angular.copy(BaseElementSet.prototype);
    angular.extend(Cements.prototype, {
        enforceBounds: function () {
            if (this.top < this.parent.top) {
                this.height = this.bottom - this.parent.top;
                if (this.height < 10) {
                    this.height = 10;
                    this.bottom = this.parent.top + 10;
                }
            }
            if (this.bottom > this.parent.bottom) {
                this.bottom = this.parent.bottom;
            }
        },
        cemFormat: function (color) {
            var custFill = paper.path("M10-5-10,15M15,0,0,15M0-5-20,15").attr({
                fill: "none",
                stroke: color,
                strokeWidth: 4
            }).pattern(0, 0, 10, 10);
            return {
                fill: custFill,
                stroke: color
            };
        },
        recolor: function (color) {
            this.elements.forEach(angular.bind(this, function (element) {
                element.attr(this.cemFormat(color));
            }));
        },
        cementPoints: function (x) {
            var y = this.bottom;
            var h = this.height;
            var sign = this.parent.x.getSign(x);
            var d = appConst.cementWidth;
            x = x + (sign * 2);
            return [x, y, x, y - h, x + (d * sign), y - h, x + (d * sign), y];
        },
        dragCementTop: function (dx, dy, x, y, evt) {
            evt = svgXY(evt);
            this.move(null, this.bottom - evt.svgY);
        },
        dragCement: function (dx, dy, x, y, evt) {
            evt = svgXY(evt);
            this.move(this.height / 2 + evt.svgY, null);
        },
        move: function (y, h) {
            if (csLib.isExistPositive(y)) this.bottom = y;
            if (csLib.isExistPositive(h)) this.height = h;

            this.bottom += (this.parent.bottom - this.shoeY);
            this.shoeY = this.parent.bottom;

            this.top = this.bottom - this.height;

            this.enforceBounds();

            var cemPoints = this.cementPoints(this.parent.x.right);
            var cemPointso = this.cementPoints(this.parent.x.left);
            this.elements[0].attr({
                points: cemPoints
            });
            this.elements[1].attr({
                points: cemPointso
            });
            this.elements[0].handles[1].move(cemPoints[4], cemPoints[5]);
            this.elements[1].handles[1].move(cemPointso[4], cemPointso[5]);
            this.elements[0].handles[0].move(cemPoints[4], cemPoints[5] + this.height / 2);
            this.elements[1].handles[0].move(cemPointso[4], cemPointso[5] + this.height / 2);


            if (this.well.selectedItem === this) updateContextMenuPos(this.parent.x.right, this.bottom);
        }
    });

    var Handle = function (x, y, dragHandler) {
        this.e = paper.circle(x, y, 5).attr({
            fill: 'yellow',
            stroke: 'red',
            strokeWidth: 2,
            cursor: 'move'
        });
        this.e.drag(dragHandler, this.dragStartHandler, this.dragEndHandler);
        handles.push(this.e);
    };
    Handle.prototype = {
        dragStartHandler: function (x, y, evt) {
            evt = svgXY(evt);
            well.drag = {
                element: evt.srcElement,
                happened: true,
                id: evt.timeStamp
            };
            well.lastDrag = {
                x: evt.svgX,
                y: evt.svgY
            };
            hideSelection();
            hideHandlesDuringDrag(evt.srcElement);
        },
        dragEndHandler: function () {
            restoreSelection();
            restoreHandlesAfterDrag();
            well.drag.happened = false;
            well.drag.id = 0;
        },
        reAdd: function () {
            paper.append(this.e);
            handles.push(this.e);
        },
        move: function (x, y) {
            this.e.attr({
                cx: x,
                cy: y
            });
        },
        hide: function () {
            this.e.remove();
        },
        remove: function () {
            this.hide();
            this.e.undrag();
        }
    };

    var GroundLevel = function (parent, x, y) {
        BaseElementSet.call(this, parent);
        this.x[0] = Math.max(x, mirrorPoint(x));
        this.x[1] = mirrorPoint(this.x[0]);
        this.maxx = paper.width;
        this.y = y;
        this.selectElement = this;
        this.strokeColor = 'brown';

        this.elements[0] = paper.line(this.x[0], this.y, this.maxx, this.y).attr(this.style());
        this.elements[1] = paper.line(0, this.y, this.x[1], this.y).attr(this.style());

        this.initHandles();
        this.elements[0].handles[0] = new Handle(this.handleXPos(), this.y, angular.bind(this, this.dragGroundLevel));

        this.registerSelectClickable();
        this.postCreate();
    };
    GroundLevel.prototype = angular.copy(BaseElementSet.prototype);
    angular.extend(GroundLevel.prototype, {
        style: function () {
            return {
                stroke: this.strokeColor
            };
        },
        move: function (x, y) {
            var oldy = this.y;
            var deltay;
            if (x >= 0 && x !== undefined && x !== null) {
                this.x[0] = Math.max(x, mirrorPoint(x));
                this.x[1] = mirrorPoint(this.x[0]);
            }
            if (y >= 0 && y !== undefined && y !== null) this.y = y;
            deltay = this.y - oldy;
            if (deltay) this.parent.moveTops(oldy, deltay);

            this.elements[0].attr({
                x1: this.x[0],
                y1: this.y,
                y2: this.y
            });
            this.elements[1].attr({
                x2: this.x[1],
                y1: this.y,
                y2: this.y
            });
            this.elements[0].handles[0].move(this.handleXPos(), this.y);
            this.parent.groundLevel = this.y;
        },
        handleXPos: function () {
            return this.x[0] + (this.maxx - this.x[0]) / 2;
        },
        dragGroundLevel: function (dx, dy, x, y, evt) {
            evt = svgXY(evt);
            this.move(null, evt.svgY);
        },
    });


    return this;
            }]);
