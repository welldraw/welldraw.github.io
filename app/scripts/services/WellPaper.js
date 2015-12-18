app.factory('WellPaper', ['$q', 'appConst', 'csLib', function ($q, appConst, csLib) {
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
        groundLevel: 4
    };
    this.selectionTypes = selectionTypes;

    this.createSurface = function (x, y) {


        paper = new Snap(x, y);
        paper.attr({
            stroke: "#000",
            strokeWidth: 4,
            fill: "#000"
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

        return paper;
    };


    /* GLOBAL EVENT HANDLERS ********************************************************************************************************/
    var handleNewString = function (evt) {
        well.makeCasingString(evt.offsetX, evt.offsetY);
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
            evt.srcElement.clickInfo.highlight();
            paper.unhighlight = evt.srcElement.clickInfo.unhighlight;
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
        var y = (paper.height - well.groundLevel) * 0.65;
        well.strings.forEach(function (string) {
            var x1 = Math.max(string.triangles.x1, string.triangles.x2);
            if (string.triangles.bottom < y) y = string.triangles.bottom;
            if (x1 > x) x = x1;
        });
        well.makeCasingString(x + appConst.cementWidth + 6, Math.max(y - well.height * 0.15, well.groundLevel + 100));
    };
    this.addTubing = function () {
        well.addTubingString();
    };
    this.deleteCurrent = function () {
        well.selectedItem.delete();
        delete well.selectedItem;
    };
    this.addPacker = function () {
        if (well.selectedItem.casing) well.selectedItem.casing.addPacker();
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

    /**
     * @function getSign
     * @description get sign indicating which side of the centerline x is on
     * @param   {Number} x coordinate
     * @returns {Number} 1 or -1 as the sign
     */
    function getSign(x) {
        return (x > well.midPoint) ? 1 : -1;
    }



    /**
     * @function registerSelectClickable
     * @description add clickInfo to the element node so it can be accessed when a click happens
     * @param {Object} element the Node.js element object to add
     * @param {Function} handler function to use as a click event handler for when the element is clicked
     */
    var registerSelectClickable = function (element, handler, highlight, unhighlight) {
        element.node.clickInfo = {
            handler: handler,
            highlight: highlight || function () {
                element.strokeColor = element.attr("stroke");
                element.attr({
                    stroke: appConst.highlightHex
                });
                console.log(element.attr("stroke"));
            },
            unhighlight: unhighlight || function () {
                element.attr({
                    stroke: element.strokeColor
                });
            }
        };

    };

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
        selectionDefer.notify({
            selectionType: selectionTypes.none
        });
    };

    var restoreSelection = function () {
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
        well.selectedItem = null;
        notifySelection(selectionTypes.none);
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
            this.tubingStrings(new TubingString(this, x, y));
        },
        checkOHLowest: function (casing) {
            var saveE = casing;
            var bottom = casing.bottom;
            this.strings.forEach(function (element, index) {
                if (element.hasOwnProperty("casing") && element.casing.bottom > bottom) {
                    bottom = element.casing.bottom;
                    saveE = element.casing;
                }
            });
            well.openHole.show();
            //test if casing is currently or used to be the lowest
            if (casing === saveE || this.lowestCasing === casing) {
                this.openHole.move(saveE.x1, null, saveE.bottom);
            }
            this.lowestCasing = saveE;
        },
        checkWidestString: function (casing) {
            var maxx;
            var saveE;
            if (casing) {
                saveE = casing;
                maxx = Math.max(casing.x1, casing.x2);
            } else {
                maxx = paper.midPoint;
            }
            this.strings.forEach(function (element, index) {
                if (element.hasOwnProperty("casing") && Math.max(element.casing.x1, element.casing.x2) > maxx) {
                    maxx = Math.max(element.casing.x1, element.casing.x2);
                    saveE = element.casing;
                }
            });
            //test if casing is currently or used to be the maxx
            if (casing === saveE || this.widestCasing === casing || (casing === null || casing === undefined)) {
                this.groundLine.move(maxx, null);
            }
            this.widestCasing = saveE;
        },
        initOpenHole: function () {
            this.openHole = new OpenHole(100, 700, 100);
        }
    };

    /**
     * @class CasingString
     * @param {Number} x inside bottom corner of the string
     * @param {Number} y bottom of the string
     */
    var CasingString = function (well, x, y) {

        this.well = well;
        //Clear any previous selectino
        deselectCurrent();



        //Make the elements in order of layering
        this.cement = new Cements(this, x, y);
        this.triangles = new Triangles(this, x, y);
        this.casing = new Casing(this, x, y);



        this.well.checkOHLowest(this.casing);
        this.well.checkWidestString(this.casing);


        //Show the handles on the new string
        this.select();
    };
    CasingString.prototype = {
        select: function () { //copy of selectString
            this.showHandles();
            this.well.selectedItem = this;
            console.log("selecting casing");
            notifySelection(selectionTypes.casingString, this.casing.x1, this.casing.bottom);
        },
        /**
         * @function showHandles
         * @description show the handles associated with a string
         */
        showHandles: function () {
            this.casing.elements[0].topHandle.reAdd();
            this.casing.elements[1].topHandle.reAdd();
            this.casing.elements[0].handle.reAdd();
            this.casing.elements[1].handle.reAdd();
            this.cement.elements[0].handle.reAdd();
            this.cement.elements[1].handle.reAdd();
            this.cement.elements[0].topHandle.reAdd();
            this.cement.elements[1].topHandle.reAdd();
        },
        remove: function () {
            this.casing.remove();
            this.triangles.remove();
            this.cement.remove();
        },
        dragMove: function (dx, dy, x, y, evt) {
            x = evt.offsetX;
            y = evt.offsetY;
            this.casing.move(x, y);
            this.triangles.move(x, y);
            this.cement.move(x, y);
            this.well.checkOHLowest(this.casing);
            this.well.checkWidestString(this.casing);
            updateContextMenuPos(x, y);
        },
        highlight: function () {
            this.strokeColor = element.attr("stroke");
            element.attr({
                stroke: appConst.highlightHex
            });
            console.log(element.attr("stroke"));
        },
        unhighlight: function () {
            this.attr({
                stroke: element.strokeColor
            });
        },
        delete: function () {
            var string = this;
            this.well.checkWidestString(string.casing);
            string.remove();
            deselectCurrent();
            this.well.strings.forEach(function (element, index, array) {
                if (element === string) delete array[index];
            });
            string = null;
            this.well.checkWidestString(null);
        }
    };




    /**
     * @class TubingString
     * @param {Number} x inside bottom corner of the string
     * @param {Number} y bottom of the string
     */
    var TubingString = function (well, x, y) {

        this.well = well;
        //Clear any previous selectino
        deselectCurrent();

        //Make the elements in order of layering
        this.casing = new Casing(this, x, y);

        //Show the handles on the new string
        this.select();
    };
    TubingString.prototype = {
        select: function () { //copy of selectString
            this.showHandles();
            this.well.selectedItem = this;
            notifySelection(selectionTypes.casingString, this.casing.x1, this.casing.bottom);
        },
        /**
         * @function showHandles
         * @description show the handles associated with a string
         */
        showHandles: function () {
            this.casing.elements[0].topHandle.reAdd();
            this.casing.elements[1].topHandle.reAdd();
            this.casing.elements[0].handle.reAdd();
            this.casing.elements[1].handle.reAdd();
        },
        remove: function () {
            this.casing.remove();
        },
        dragMove: function (dx, dy, x, y, evt) {
            x = evt.offsetX;
            y = evt.offsetY;
            this.casing.move(x, y);
            updateContextMenuPos(x, y);
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
    };



    var BaseElementSet = function () {
        this.elements = [];
        this.handles = [];
        this.strokeColor = '#000';
    };
    BaseElementSet.prototype = {
        highlight: function () {
            this.elements.forEach(function (element) {
                element.attr({
                    stroke: appConst.highlightHex
                });
            });
        },
        unhighlight: function () {
            var color = this.strokeColor;
            this.elements.forEach(function (element) {
                element.attr({
                    stroke: color
                });
            });
        },
        select: function () {
            this.parent.select();
        },
        registerSelectClickable: function () {
            this.elements.forEach(angular.bind(this, function (element) {
                element.node.clickInfo = {
                    baseElementSet: this
                };
            }));
        }
    };






    /**
     * @class OpenHole
     * @description makes a jagged open hole element at the bottom of the lowest casing
     * @param {Number} x inner x coordinate
     * @param {Number} bottom coordinate for the open hole section
     * @param {Number} top top of the open hole section
     */
    var OpenHole = function (x, bottom, top) {
        this.x1 = x;
        this.x2 = mirrorPoint(this.x1);
        this.bottom = bottom;
        this.top = top;

        this.e1 = paper.path(this.getPathString()).attr({
            fill: 'none',
            stroke: 'brown'
        });
        this.visible = true;

        this.e1.handle = new Handle(well.midPoint, this.bottom, angular.bind(this, this.dragOHBottom));

        this.hide();
        registerSelectClickable(this.e1, angular.bind(this, this.selectOH));
    };
    OpenHole.prototype = {
        selectOH: function (i) {
            well.selectedItem = this;
            this.e1.handle.reAdd();
        },
        dragOHBottom: function (dx, dy, x, y, evt) {
            this.move(null, evt.offsetY, null);
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
            path += "M" + this.x2 + " " + this.top + " " + path;
            path += "h " + (this.x1 - this.x2);
            return "M" + this.x1 + " " + this.top + " " + path;
        },
        move: function (x, bottom, top) {
            if (x >= 0 && x !== undefined && x !== null) this.x1 = x;
            if (bottom >= 0 && bottom !== undefined && bottom !== null) this.bottom = bottom;
            if (top >= 0 && top !== undefined && top !== null) this.top = top;
            if (!this.isVisible) this.show();
            this.enforceBounds();
            this.x2 = mirrorPoint(this.x1);
            this.e1.attr({
                path: this.getPathString()
            });
            this.e1.handle.move(well.midPoint, this.bottom);
        },
        enforceBounds: function () {
            if (this.bottom < this.top) {
                this.bottom = this.top;
            }
        },
        show: function () {
            this.visible = true;
            paper.append(this.e1);
        },
        hide: function () {
            this.visible = false;
            this.e1.remove();
            this.e1.handle.hide();
        },
        isVisible: function () {
            return this.visible;
        },
        xValues: [0, 2, 1, -3, 0, 0, 2, -3, 1, 3, -1, -1, 2, 0, -2, -2, 0, 3, -1, 1, 3, -3, 0, 2, -2, 0, -1, 0, -2, 0, -2, 3, 0],
        yValues: [3, 5, 7, 2, 6, 10, 4, 3, 8, 7, 2, 6, 9, 4, 4, 9, 7, 2, 6, 4, 8, 2, 4, 7, 6, 1, 2, 8, 9, 1, 4, 5, 7, 2, 1, 4, 5, 3, 8, 4, 1, 5, 2]
    };




    /**
     * @function Packer
     * @description packer component that gets added to casingString
     * @param {object}   parent casing element the packer is bound to
     * @param {Number} bottom bottom of packer (optional)
     * @param {Number} height height (optional)
     * @param {number} width  starting width (optional)
     */
    var Packer = function (parentCasing, bottom, height, width) {
        this.myCasing = parentCasing;
        this.bottom = bottom || this.myCasing.bottom - 10;
        this.height = height || 10;
        this.width = width || 15;
        var sign = getSign(this.myCasing.x1);
        this.x1 = this.myCasing.x1 - (sign * this.width);
        this.x2 = mirrorPoint(this.x1);
        console.log(this.myCasing.x1);

        this.e1 = paper.polygon(this.points(this.x1));
        this.e2 = paper.polygon(this.points(this.x2));

        registerSelectClickable(this.e1, angular.bind(this, this.select));
        registerSelectClickable(this.e2, angular.bind(this, this.select));
        this.e2.handle = new Handle(this.handleX(this.x2), this.handleY(), angular.bind(this, this.drag));
        this.e1.handle = new Handle(this.handleX(this.x1), this.handleY(), angular.bind(this, this.drag));
        deselectCurrent();
        this.select();
    };
    Packer.prototype = {
        points: function (x, sign) {
            if (sign === undefined || sign === null) sign = getSign(x);
            return [x, this.bottom, x, this.bottom - this.height, x + (this.width * sign),
                    this.bottom - this.height, x + (this.width * sign), this.bottom];
        },
        handleY: function () {
            return this.bottom - this.height / 2;
        },
        handleX: function (x) {
            return x;
        },
        select: function () {
            this.e1.handle.reAdd();
            this.e2.handle.reAdd();
            well.selectedItem = this;
            notifySelection(selectionTypes.packer, this.x1, this.bottom + this.height);
        },
        drag: function (dx, dy, x, y, evt) {
            this.move(evt.offsetX, evt.offsetY);
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
            var sign = getSign(this.myCasing.x1);
            if (x >= 0 && x !== undefined && x !== null) {
                if (this.e1.handle.e.node === well.drag.element) {
                    this.width = (sign * this.myCasing.x1) - (x * sign);
                } else {
                    this.width = (sign * x) - (this.myCasing.x2 * sign);
                }
            }
        },
        updatePositions: function () {
            var sign = getSign(this.myCasing.x1);
            this.x1 = this.myCasing.x1 - (sign * this.width);
            this.x2 = mirrorPoint(this.x1);
            this.e1.attr({
                points: this.points(this.x1, sign)
            });
            this.e2.attr({
                points: this.points(this.x2, sign * -1)
            });
            this.e1.handle.move(this.handleX(this.x1), this.handleY());
            this.e2.handle.move(this.handleX(this.x2), this.handleY());
            updateContextMenuPos(this.x1, this.bottom + this.height);
        },
        enforceBounds: function () {
            if (this.bottom > this.myCasing.bottom) {
                this.bottom = this.myCasing.bottom;
            }
            if (this.width > (Math.abs(this.myCasing.x1 - this.myCasing.x2) / 2)) {
                this.width = Math.abs(this.myCasing.x1 - this.myCasing.x2) / 2;
            } else if (this.width < 2) {
                this.width = 4;
            }
        },
        remove: function () {
            var i;
            [this.e1, this.e2].forEach(function (element, index) {
                element.remove();
            });
            [this.e1.handle, this.e2.handle].forEach(function (element) {
                element.remove();
            });
            this.myCasing.removePacker(this);
        },
        delete: function () {
            deselectCurrent();
            this.remove();
        }
    };

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
        if (this.width > -4) this.width = -4;
        this.bottom = this.myCasing.top;
    };
    Hanger.prototype.updateY = function (y) {
        if (y >= 0 && y !== undefined && y !== null) {
            this.myCasing.move(null, null, y + (this.height / 2));
        }
    };

    /**
     * @class Casing
     * @description makes the vertical lines for the casing as a new object and provides functions for manipulating them   
     * @param {CasingString} parent the parent CasingString object
     * @param {Number} x inner x coordinate
     * @param {Number} y coordinate for bottom of the casing
     */
    var Casing = function (parent, x, bottom) {
        BaseElementSet.call(this);
        this.packers = [];
        this.bottom = bottom || 100;
        this.x1 = x || well.midPoint + 50;
        this.x2 = mirrorPoint(this.x1);
        this.top = well.groundLevel;
        this.parent = parent;


        this.elements[0] = paper.line(this.x1, this.bottom, this.x1, this.top);
        this.elements[1] = paper.line(this.x2, this.bottom, this.x2, this.top);

        this.hanger = new Hanger(this);
        this.packers.push(this.hanger);

        this.elements[0].topHandle = new Handle(this.x1, this.top, angular.bind(this, this.dragMoveTop));
        this.elements[1].topHandle = new Handle(this.x2, this.top, angular.bind(this, this.dragMoveTop));
        this.elements[0].handle = new Handle(this.x1, this.bottom, angular.bind(this.parent, this.parent.dragMove));
        this.elements[1].handle = new Handle(this.x2, this.bottom, angular.bind(this.parent, this.parent.dragMove));

        this.registerSelectClickable();
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
        move: function (x, bottom, top) {
            if (x >= 0 && x !== undefined && x !== null) this.x1 = x;
            if (bottom >= 0 && bottom !== undefined && bottom !== null) this.bottom = bottom;
            if (top >= 0 && top !== undefined && top !== null) this.top = top;
            this.x2 = mirrorPoint(this.x1);



            this.packers.forEach(function (element) {
                element.move();
            });

            this.elements[0].attr({
                x1: this.x1,
                x2: this.x1,
                y1: this.bottom,
                y2: this.top
            });
            this.elements[1].attr({
                x1: this.x2,
                x2: this.x2,
                y1: this.bottom,
                y2: this.top
            });
            this.elements[0].topHandle.move(this.x1, this.top);
            this.elements[1].topHandle.move(this.x2, this.top);
            this.elements[0].handle.move(this.x1, this.bottom);
            this.elements[1].handle.move(this.x2, this.bottom);
        },
        addPacker: function () {
            this.packers.push(new Packer(this));
        },
        removePacker: function (packer) {
            var i = this.packers.indexOf(packer);
            if (i >= 0) this.packers.splice(i, 1);
        },
        remove: function () {
            var i;
            [this.elements[0], this.elements[1]]
            .forEach(function (element, index) {
                element.remove();
            });
            [this.elements[0].topHandle, this.elements[1].topHandle, this.elements[0].handle, this.elements[1].handle].forEach(function (element) {
                element.remove();
            });
            this.packers.forEach(function (element, index, array) {
                element.delete();
            });
        },
        dragMoveTop: function (dx, dy, x, y, evt) {
            this.move(null, null, evt.offsetY);
        }
    });

    /**
     * @class Triangles
     * @description makes the triangles for the casing as a new object and provides functions for manipulating them   
     * @param {CasingString} parent the parent CasingString object
     * @param {Number} x inner x coordinate
     * @param {Number} y coordinate for bottom of the triangle
     */
    var Triangles = function (parent, x, y) {
        BaseElementSet.call(this);
        this.bottom = y || 100;
        this.x1 = x || well.midPoint + 50;
        this.x2 = mirrorPoint(this.x1);
        this.parent = parent;
        this.elements[0] = paper.polygon(this.triPoints(this.x1, this.bottom)).attr(this.triFormat());
        this.elements[1] = paper.polygon(this.triPoints(this.x2, this.bottom)).attr(this.triFormat());

        registerSelectClickable(this.elements[0], angular.bind(this.parent, this.parent.select));
        registerSelectClickable(this.elements[1], angular.bind(this.parent, this.parent.select));

        return this;
    };
    Triangles.prototype = angular.copy(BaseElementSet.prototype);
    angular.extend(Triangles.prototype, {
        triPoints: function (x, y) {
            var sign = (x > well.midPoint) ? 1 : -1;
            var d = 10;
            return [x, y, x, y - d, x + (d * sign), y];
        },
        triFormat: function () {
            return {
                fill: '#555'
            };
        },
        move: function (x, y) {
            if (csLib.isExistPositive(x)) this.x1 = x;
            if (csLib.isExistPositive(y)) this.bottom = y;
            this.x2 = mirrorPoint(this.x1);
            this.elements[0].attr({
                points: this.triPoints(this.x1, this.bottom)
            });
            this.elements[1].attr({
                points: this.triPoints(this.x2, this.bottom)
            });
        },
        remove: function () {
            var i;
            [this.elements[0], this.elements[1]]
            .forEach(function (element, index) {
                element.remove();
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
        BaseElementSet.call(this);
        this.bottom = y || 100;
        this.x1 = x || well.midPoint + 50;
        this.x2 = mirrorPoint(this.x1);
        this.height = appConst.cementHeight;
        this.top = this.bottom - this.height;
        this.parent = parent;
        var sign = getSign(this.x1);

        this.enforceBounds();

        this.elements[0] = paper.polygon(this.cementPoints(this.x1)).attr(this.cemFormat("#aaaaaa"));
        this.elements[1] = paper.polygon(this.cementPoints(this.x2)).attr(this.cemFormat("#aaaaaa"));
        this.elements[0].handle = new Handle(this.x1 + (appConst.cementWidth * sign), this.bottom - (this.height / 2), angular.bind(this, this.dragCement));
        this.elements[1].handle = new Handle(this.x2 - (appConst.cementWidth * sign), this.bottom - (this.height / 2), angular.bind(this, this.dragCement));
        this.elements[0].topHandle = new Handle(this.x1 + (appConst.cementWidth * sign), this.bottom - this.height, angular.bind(this, this.dragCementTop));
        this.elements[1].topHandle = new Handle(this.x2 - (appConst.cementWidth * sign), this.bottom - this.height, angular.bind(this, this.dragCementTop));

        registerSelectClickable(this.elements[0], angular.bind(this.parent, this.parent.select));
        registerSelectClickable(this.elements[1], angular.bind(this.parent, this.parent.select));
    };
    Cements.prototype = angular.copy(BaseElementSet.prototype);
    angular.extend(Cements.prototype, {
        enforceBounds: function () {
            //helper alias
            var myCasing = this.parent.casing;
            if (myCasing && this.top < myCasing.top) {
                this.height = this.bottom - myCasing.top;
                if (this.height < 10) {
                    this.height = 10;
                    this.bottom = myCasing.top + 10;
                }
            }
            if (myCasing && this.bottom > myCasing.bottom) {
                this.bottom = this.parent.casing.bottom;
            }
        },
        cemFormat: function (color) {
            var custFill = paper.path("M10-5-10,15M15,0,0,15M0-5-20,15").attr({
                fill: "none",
                stroke: color,
                strokeWidth: 5
            }).pattern(0, 0, 10, 10);
            return {
                fill: custFill,
                stroke: color
            };
        },
        cementPoints: function (x) {
            var y = this.bottom;
            var h = this.height;
            var sign = (x > well.midPoint) ? 1 : -1;
            var d = appConst.cementWidth;
            x = x + (sign * 2);
            return [x, y, x, y - h, x + (d * sign), y - h, x + (d * sign), y];
        },
        dragCementTop: function (dx, dy, x, y, evt) {
            this.move(null, null, this.bottom - evt.offsetY);
        },

        dragCement: function (dx, dy, x, y, evt) {
            this.move(null, this.height / 2 + evt.offsetY, null);
        },
        move: function (x, y, h) {
            if (csLib.isExistPositive(x)) this.x1 = x;
            if (csLib.isExistPositive(y)) this.bottom = y;
            if (csLib.isExistPositive(h)) this.height = h;
            this.x2 = mirrorPoint(this.x1);
            var sign = getSign(this.x1);
            this.top = this.bottom - this.height;

            this.enforceBounds();

            var cemPoints = this.cementPoints(this.x1);
            var cemPointso = this.cementPoints(this.x2);
            this.elements[0].attr({
                points: cemPoints
            });
            this.elements[1].attr({
                points: cemPointso
            });
            this.elements[0].topHandle.move(cemPoints[4], cemPoints[5]);
            this.elements[1].topHandle.move(cemPointso[4], cemPointso[5]);
            this.elements[0].handle.move(cemPoints[4], cemPoints[5] + this.height / 2);
            this.elements[1].handle.move(cemPointso[4], cemPointso[5] + this.height / 2);
        },
        remove: function () {
            var i;
            [this.elements[0], this.elements[1]]
            .forEach(function (element, index) {
                element.remove();
            });
            [this.elements[0].topHandle, this.elements[1].topHandle, this.elements[0].handle, this.elements[1].handle].forEach(function (element) {
                element.remove();
            });
        }
    });

    var Handle = function (x, y, dragHandler) {
        this.e = paper.circle(x, y, 5).attr({
            fill: 'yellow',
            stroke: 'red',
            strokeWidth: 2,
            cursor: 'move'
        });
        this.e.drag(dragHandler, this.universalDragStartHandler, this.universalDragEndHandler);
        handles.push(this.e);
    };
    Handle.prototype = {
        universalDragStartHandler: function (x, y, evt) {
            well.drag = {
                element: evt.srcElement,
                happened: true
            };
            well.lastDrag = {
                x: evt.offsetX,
                y: evt.offsetY
            };
            hideSelection();
            hideHandlesDuringDrag(evt.srcElement);
        },
        universalDragEndHandler: function () {
            restoreSelection();
            restoreHandlesAfterDrag();
            well.drag.happened = false;
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
        this.parent = parent;
        this.x1 = Math.max(x, mirrorPoint(x));
        this.x2 = mirrorPoint(this.x1);
        this.maxx = paper.width;
        this.y = y;
        this.e1 = paper.line(this.x1, this.y, this.maxx, this.y).attr(this.style());
        this.e2 = paper.line(0, this.y, this.x2, this.y).attr(this.style());

        this.e1.handle = new Handle(this.handleXPos(), this.y, angular.bind(this, this.dragGroundLevel));

        registerSelectClickable(this.e1, angular.bind(this, this.select));
        registerSelectClickable(this.e2, angular.bind(this, this.select));
    };
    GroundLevel.prototype = {
        style: function () {
            return {
                stroke: "brown"
            };
        },
        move: function (x, y) {
            if (x >= 0 && x !== undefined && x !== null) {
                this.x1 = Math.max(x, mirrorPoint(x));
                this.x2 = mirrorPoint(this.x1);
            }
            if (y >= 0 && y !== undefined && y !== null) this.y = y;

            this.e1.attr({
                x1: this.x1,
                y1: this.y,
                y2: this.y
            });
            this.e2.attr({
                x2: this.x2,
                y1: this.y,
                y2: this.y
            });
            this.e1.handle.move(this.handleXPos(), this.y);
            this.parent.groundLevel = this.y;
        },
        handleXPos: function () {
            return this.x1 + (this.maxx - this.x1) / 2;
        },
        dragGroundLevel: function (dx, dy, x, y, evt) {
            this.move(null, evt.offsetY);
        },
        select: function (i) {
            well.selectedItem = this;
            this.e1.handle.reAdd();
        }
    };


    return this;
}]);
