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
        textBox: 6,
        fluidFill: 7,
        drillString: 8,
        casingRunningString: 9
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


        well.height = y;
        well.width = x;

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
        if (evt.target.hasOwnProperty("clickInfo")) {
            if (evt.target.clickInfo.hasOwnProperty('baseElementSet')) {
                evt.target.clickInfo.baseElementSet.select();
            } else {
                evt.target.clickInfo.handler();
            }
        }

    };
    var handleMouseMove = function (evt) {
        if (paper.hasOwnProperty("unhighlight") && paper.unhighlight) {
            paper.unhighlight();
            delete paper.unhighlight;
        }
        if (evt.target.hasOwnProperty("clickInfo") && !well.drag.happened) {
            if (evt.target.clickInfo.hasOwnProperty('baseElementSet')) {
                evt.target.clickInfo.baseElementSet.highlight();
                paper.unhighlight = angular.bind(evt.target.clickInfo.baseElementSet, evt.target.clickInfo.baseElementSet.unhighlight);
            } else {
                evt.target.clickInfo.highlight();
                paper.unhighlight = evt.target.clickInfo.unhighlight;
            }
        } else {

        }
    };

    /* EXPOSED API CONTROL FUNCTIONS ********************************************************************************************************/
    var API_CONTROL_FUNCTIONS_BOOKMARK = function () {};

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

    this.addDrillString = function () {
        well.addDrillString();
    };

    this.addCasingRunningString = function () {
        well.addCasingRunningString();
    };

    this.setCoords = function (rect) {
        paper.coordRect = rect;
    };

    this.saveWell = function (storeOnBrowser) {
        return well.saveToFile(storeOnBrowser);
    };

    this.openWell = function () {
        return well.restore();
    };

    this.loadFromFile = function (file) {
        var saveObj;
        var reader = new FileReader();
        reader.onload = function () {
            saveObj = JSON.parse(this.result);
            well.restoreFromObj(saveObj);
            console.log(saveObj);
        };
        reader.readAsText(file);
    };

    /* GLOBAL UTILITIES ****************************************************************************************************************/
    /**
     * @function mirrorPoint
     * @description get the x coordinate accross the centerline from the one given
     * @param {Number} x coordinate
     * @returns {Number} mirror x coordinate
     */
    var GLOBAL_UTILITIES_BOOKMARK = function () {};

    function mirrorPoint(x) {
        return paper.midPoint - (x - paper.midPoint);
    }

    var notifySelection = function (selType, x, y, textBoxInfo) {
        well.selectionObject = {
            selectionType: selType,
            x: x,
            y: y,
            textBoxInfo: textBoxInfo
        };
        selectionDefer.notify(well.selectionObject);
    };

    var updateContextMenuPos = function (x, y, textBoxInfo) {
        well.selectionObject.x = x;
        well.selectionObject.y = y;
        if (textBoxInfo) well.selectionObject.textBoxInfo = textBoxInfo;

    };

    var hideSelection = function () {
        //        if (csLib.isExist(well.selectedItem.notifySelection)) {
        selectionDefer.notify({
            selectionType: selectionTypes.none
        });
        //        }
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
            svgX: evt.pageX - paper.coordRect.left,
            svgY: evt.pageY - paper.coordRect.top
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

        this.fluidFill = new FluidFill(this, 100, 700, 100);
        this.groundLine = new GroundLevel(this, this.midPoint, this.groundLevel);
        this.openHole = new OpenHole(this, 100, 700, 100);
        this.openHole.assignFluidMove(angular.bind(this.fluidFill, this.fluidFill.move));
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
            this.updatedString();
            return newCasing;
        },
        addTubingString: function (x, y) {
            x = csLib.useThisOrAlternate(x, this.midPoint + 15);
            y = csLib.useThisOrAlternate(y, this.height * 0.75);
            this.tubingStrings.push(new TubingString(this, x, y));
        },
        addDrillString: function () {
            if (!csLib.isExist(this.drillString) && this.openHole.visible) {
                this.drillString = new DrillString(this);
            }
        },
        addCasingRunningString: function () {
            if (!csLib.isExist(this.casingRunningString) && this.openHole.visible) {
                this.casingRunningString = new CasingRunningString(this);
            }
        },
        moveTops: function (oldy, deltay) {
            this.strings.concat(this.tubingStrings).forEach(function (string) {
                if (string.top < oldy + 10) string.move(null, null, string.top + deltay);
            });
        },
        updatedString: function (string) {
            this.checkOHLowest(string);
            this.checkWidestString(string);
            this.fluidFill.move();
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
        saveToFile: function (storeOnBrowser) {
            var saveObj = BaseElementSet.prototype.save.call(this);

            console.log(JSON.stringify(saveObj));

            if (typeof (Storage) !== "undefined" && storeOnBrowser) {
                localStorage.setItem("wdSaveObj", JSON.stringify(saveObj));
            } else {
                console.log("no local storage support");
            }
            return saveObj;
        },
        restore: function () {
            var saveObj;
            if (typeof (Storage) !== "undefined") {
                saveObj = JSON.parse(localStorage.getItem("wdSaveObj"));
            } else {
                console.log("no local storage support");
            }
            this.restoreFromObj(saveObj);
        },
        restoreFromObj: function (saveObj) {
            if (saveObj) {
                this.strings.concat(this.tubingStrings).forEach(function (string) {
                    string.remove();
                });
                this.openHole.remove();
                this.groundLine.remove();
                if (saveObj.hasOwnProperty("groundLine")) this.groundLine = new GroundLevel(this, saveObj.groundLine.x.right, saveObj.groundLine.y);
                this.restoreEach(saveObj);
                this.openHole.assignFluidMove(angular.bind(this.fluidFill, this.fluidFill.move));
                this.updatedString();
            }
        },
        restoreEach: function (saveObj) {
            Object.keys(saveObj).forEach(angular.bind(this, function (key) {
                var type = typeof saveObj[key];
                if (type === 'object') {
                    if (saveObj[key]) {
                        if (key === 'x') {
                            this[key] = new XSet(saveObj.x.midPoint, saveObj.x.right);
                        } else if (key === 'openHole') {
                            if (this.openHole) this.openHole.remove();
                            this.openHole = new OpenHole(this, saveObj.openHole.x.right, saveObj.openHole.bottom, saveObj.openHole.top);
                            Well.prototype.restoreEach.call(this[key], saveObj[key]);
                        } else if (key === 'drillString') {
                            if (this.drillString) this.drillString.delete();
                            this.drillString = new DrillString(this);
                            Well.prototype.restoreEach.call(this[key], saveObj[key]);
                        } else if (key === 'casingRunningString') {
                            if (this.casingRunningString) this.casingRunningString.delete();
                            this.casingRunningString = new CasingRunningString(this);
                            Well.prototype.restoreEach.call(this[key], saveObj[key]);
                        } else if (key === 'strings') {
                            this[key] = [];
                            saveObj[key].forEach(angular.bind(this, function (elem, index) {
                                this[key].push(new CasingString(this, elem.x.right, elem.bottom));
                                Well.prototype.restoreEach.call(this[key][index], elem);
                                console.log(this[key][index].hanger);
                            }));
                        } else if (key === 'tubingStrings') {
                            this[key] = [];
                            saveObj[key].forEach(angular.bind(this, function (elem, index) {
                                this[key].push(new TubingString(this, elem.x.right, elem.bottom));
                                Well.prototype.restoreEach.call(this[key][index], elem);
                            }));
                        } else if (key === 'packers') {
                            this[key] = [];
                            saveObj[key].forEach(angular.bind(this, function (elem, index) {
                                if (elem.width > 0) {
                                    this[key].push(new Packer(this, elem.bottom, elem.height, elem.width));
                                } else {
                                    this.hanger.width = elem.width;
                                    this[key].push(this.hanger);
                                }
                                Well.prototype.restoreEach.call(this[key][index], elem);
                            }));
                        } else if (key === 'casing' || key === 'cement' || key === 'triangles' || key === 'fluidFill') {
                            Well.prototype.restoreEach.call(this[key], saveObj[key]);
                        } else if (key === 'drillBit' || key === 'drillCollar' || key === 'drillPipe' || key === 'casing' || key === 'shoe') {
                            Well.prototype.restoreEach.call(this[key], saveObj[key]);
                        } else if (key === 'textBoxes') {
                            this[key] = [];
                            saveObj[key].forEach(angular.bind(this, function (elem, index) {
                                this[key].push(new TextBox(this, elem.left, elem.top, elem.text));
                                Well.prototype.restoreEach.call(this[key][index], elem);
                            }));
                        }
                    }
                }

            }));

            Object.keys(saveObj).forEach(angular.bind(this, function (key) {
                var type = typeof saveObj[key];
                if (type !== 'object') {
                    this[key] = saveObj[key];
                }
            }));

            if (this.hasOwnProperty("visible") && this.visible && this.show) this.show(); //for the openHole
            if (this.move) this.move();
            if (this.recolor) this.recolor();

        }
    };

    var XSet = function (midPoint, x) {
        this.config = {
            makeACopy: true
        };
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
        },
        save: function () {
            return BaseElementSet.prototype.save.call(this);
        },
        recreateMe: function (saveObj) {
            return new XSet(saveObj.midPoint, saveObj.right);
        }
    };

    var BaseElementSet = function (parent) {
        if (parent) {
            this.parent = parent;
            this.well = parent.well;
        }
        this.elements = [];
        this.x = [];
        this.strokeColor = '#000';
        this.config = {};
        this.config.selectElement = this;
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
            if (!csLib.isExist(color)) color = this.strokeColor;
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
            well.selectedItem = this.config.selectElement;
            if (csLib.isExist(this.notifySelection)) {
                notifySelection(this.notifySelection, this.config.selectElement.x.right + 10, this.config.selectElement.bottom + 10);
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
                    baseElementSet: this.config.selectElement
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
            return this.x.right - this.x.left;
        },
        save: function () {
            var saveObj = {};
            Object.keys(this).forEach(angular.bind(this, function (key) {
                var type = typeof this[key];

                if (type !== 'object') {
                    if (key === 'width') console.log(this[key]);
                    saveObj[key] = this[key];
                } else {
                    if (this[key] && (this[key].constructor === Array) && this[key][0] && (typeof this[key][0].save === 'function')) {
                        saveObj[key] = [];
                        console.log(key);
                        this[key].forEach(function (elem) {
                            saveObj[key].push(elem.save());
                        });
                    } else if (this[key] && this[key].config && this[key].config.makeACopy && (typeof this[key].save === 'function')) {
                        if (key !== 'parent' && key !== 'well') {
                            saveObj[key] = this[key].save();
                        }
                    }
                }
            }));

            return saveObj;
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
            var oldBottom = this.bottom;
            if (csLib.isExistPositive(x)) this.x.setBoth(x);
            if (csLib.isExistPositive(bottom)) this.bottom = bottom;
            if (csLib.isExistPositive(top)) this.top = top;
            var deltaBottom = this.bottom - oldBottom;
            this.packers.forEach(function (element) {
                element.move();
            });
            this.textBoxes.forEach(function (element) {
                element.move(null, element.top + deltaBottom);
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
            this.textBoxes.push(new TextBox(this, this.x.right + 25, this.bottom - 5, "New Textbox"));
        },
        removePacker: function (packer) {
            var i = this.packers.indexOf(packer);
            if (i >= 0) this.packers.splice(i, 1);
        },
        removeTextBox: function (tb) {
            var i = this.textBoxes.indexOf(tb);
            if (i >= 0) this.textBoxes.splice(i, 1);
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
        save: BaseElementSet.prototype.save
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

        //        this.well.checkOHLowest(this);
        //        this.well.checkWidestString(this);

        //Show the handles on the new string
        this.select();
    };
    CasingString.prototype = angular.copy(ParentString.prototype);
    angular.extend(CasingString.prototype, {
        select: function () { //copy of selectString
            this.casing.select();
            //this.cement.select();
            this.well.selectedItem = this;
            notifySelection(selectionTypes.casingString, this.x.right + 10, this.bottom + 10);
        },
        remove: function () {
            this.casing.remove();
            this.triangles.remove();
            if (this.packers && this.packers.length > 0) this.packers.forEach(function (element) {
                element.remove();
            });
            if (this.textBoxes && this.textBoxes.length > 0) this.textBoxes.forEach(function (element) {
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
            notifySelection(selectionTypes.casingString, this.x.right + 10, this.bottom + 10);
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









    var InWellString = function (well) {
        this.well = well;
        this.config = {
            makeACopy: true
        };
        this.textBoxes = [];

    };
    InWellString.prototype = {
        //        addTextBox: function () {
        //            this.textBoxes.push(new TextBox(this, this.x.right + 50, this.bottom + 10, "New Textbox"));
        //        },
        //        removeTextBox: function (tb) {
        //            var i = this.textBoxes.indexOf(tb);
        //            if (i >= 0) this.textBoxes.splice(i, 1);
        //        },
        changeColor: function (color) {
            var i;
            for (i = 0; i < this.compKeys.length; i++) {
                this[this.compKeys[i]].changeColor(color);
            }
        },
        select: function () {
            var i;
            for (i = 0; i < this.compKeys.length; i++) {
                this[this.compKeys[i]].select();
            }
            if (csLib.isExist(this.notifySelection)) {
                notifySelection(this.notifySelection, this.cMenuTop(), this.cMenuBottom());
            }
        },
        recolor: function (color) {
            var i;
            for (i = 0; i < this.compKeys.length; i++) {
                this[this.compKeys[i]].recolor(color);
            }
        },

        //        dragMoveTop: function (x, y, dx, dy, evt) {
        //            evt = svgXY(evt);
        //            this.move(null, null, evt.svgY);
        //        },
        dragMove: function (dx, dy, x, y, evt) {
            evt = svgXY(evt);
            this.move(evt.svgX, evt.svgY);
        },
        highlight: function () {
            var i;
            for (i = 0; i < this.compKeys.length; i++) {
                this[this.compKeys[i]].highlight();
            }
        },
        unhighlight: function () {
            var i;
            for (i = 0; i < this.compKeys.length; i++) {
                this[this.compKeys[i]].unhighlight();
            }
        },
        dragMoveBottom: function (dx, dy, x, y, evt) {
            evt = svgXY(evt);
            this.moveBottom(evt.svgY);
        },
        delete: function () {
            deselectCurrent();
            var i;
            for (i = 0; i < this.compKeys.length; i++) {
                this[this.compKeys[i]].remove();
            }
            this.well[this.parentKey] = null;
        },
        moveBottom: function (y, movingOH) {
            if (csLib.isExist(y)) this.bottom = y;
            if (this.bottom > paper.height - 5) this.bottom = paper.height - 5;
            if (this.bottom < 10) this.bottom = 10;
            if (this.bottom > this.well.openHole.bottom - 3) {
                if (movingOH) {
                    this.bottom = this.well.openHole.bottom - 3;
                } else {
                    this.well.openHole.move(null, this.bottom + 3, null);
                }
            }

            var i;
            for (i = 0; i < this.compKeys.length; i++) {
                this[this.compKeys[i]].move(null, null, this.compPreserveH[i]);
            }
            updateContextMenuPos(this.cMenuTop(), this.cMenuBottom());
        },
        cMenuBottom: function () {
            return this.bottom - 30;
        },
        cMenuTop: function () {
            return this[this.xKey].x.right + 10;
        },
        save: BaseElementSet.prototype.save
    };

    var DrillString = function (well) {
        InWellString.call(this, well);
        this.notifySelection = selectionTypes.drillString;
        this.bottom = well.openHole.bottom - 3;

        //Make the elements in order of layering
        this.drillPipe = new PipeSection(this, well.openHole.width() / 5, this.bottom - 3);
        this.drillCollar = new PipeSection(this, well.openHole.width() / 3, (this.bottom - this.well.groundLevel) / 4);
        this.drillBit = new PipeSection(this, well.openHole.width() - 5, 10, 10);

        //configure the object to work with the InWellString methods
        this.compKeys = ['drillPipe', 'drillCollar', 'drillBit'];
        this.compPreserveH = [false, true, true];
        this.xKey = 'drillBit';
        this.parentKey = 'drillString';

        //Show the handles on the new string
        this.select();
    };
    DrillString.prototype = angular.copy(InWellString.prototype);
    angular.extend(DrillString.prototype, {});

    /**
     * @class CasingRunningString
     * @description A casing string that is shown being run inside the well, rather than an installed and cemented string.
     * @param {object<Well>} well the parent well for the string
     */
    var CasingRunningString = function (well) {
        InWellString.call(this, well);

        this.notifySelection = selectionTypes.casingRunningString;
        this.bottom = well.openHole.bottom - 3;

        //Make the elements in order of layering
        this.casing = new PipeSection(this, well.openHole.width() * 3 / 5, this.bottom - 3, 15);
        this.shoe = new PipeSection(this, well.openHole.width() * 3 / 5 + 8, 30, 15);

        //configure the object to work with the InWellString methods
        this.compKeys = ['casing', 'shoe']; //names of the PipeSection components this class is responsible for
        this.compPreserveH = [false, true]; //in the same order as compKeys, tells whether to preserve height on a move bottom
        this.xKey = 'shoe'; //the component to use to set the x position of the context menu
        this.parentKey = 'casingRunningString';

        //Show the handles on the new string
        this.select();
    };
    CasingRunningString.prototype = angular.copy(InWellString.prototype);
    angular.extend(CasingRunningString.prototype, {});

    /**
     * @class PipeSection
     * @description makes the section of pipe 
     * @param {InWellString} parent the parent InWellString object
     * @param {Number} x inner x coordinate
     * @param {Number} y coordinate for bottom of the casing
     */
    var PipeSection = function (parent, width, height, bottomCurve) {
        BaseElementSet.call(this, parent);
        this.config.makeACopy = true;
        this.width = csLib.useThisOrAlternate(width, 40);
        this.height = csLib.useThisOrAlternate(height, this.parent.bottom - this.well.groundLevel);
        this.bottomCurve = csLib.useThisOrAlternate(bottomCurve, 0);
        this.top = this.parent.bottom - this.height;
        //this.bottom = parent.well.openHole.bottom;
        this.strokeColor = "black";
        this.x = new XSet(this.well.midPoint, this.well.midPoint + this.width / 2);
        this.config.selectElement = this.parent; //selections should happen at the this level
        this.minH = 5;

        this.elements[0] = paper.path(this.getPath()).attr({ //paper.rect(this.x.left, this.top, this.width, this.height).attr({
            fill: "#eee"
        });


        this.initHandles();
        //handle 0 is for bottom
        this.elements[0].handles[0] = new Handle(this.x.midPoint, this.parent.bottom, angular.bind(this.parent, this.parent.dragMoveBottom));
        //handle 1 is for adjusting width
        this.elements[0].handles[1] = new Handle(this.x.right, this.parent.bottom - (this.height) / 2, angular.bind(this, this.dragMoveWidth));
        //handle 2 is for adjusting top
        this.elements[0].handles[2] = new Handle(this.x.midPoint, this.top, angular.bind(this, this.dragMoveTop));


        this.registerSelectClickable();
        this.postCreate();
    };
    PipeSection.prototype = angular.copy(BaseElementSet.prototype);
    angular.extend(PipeSection.prototype, {
        /**
         * @function move
         * @description set the position of the casing
         * @param {Number} x inner x coordinate.  Leave null to not change x coordinate
         * @param {Number} bottom coordinate for bottom of the casing.  Leave null to not change
         * @param {Number} top Top of the casing string. Leave null to not change
         */
        move: function (x, top, preserveHeight) {
            if (csLib.isExist(x)) this.x.setBoth(x);
            if (csLib.isExist(top)) this.top = top;
            if (!preserveHeight) {
                if (this.top < 1) this.top = 1;
                this.height = this.parent.bottom - this.top;
                if (this.height < this.minH) {
                    this.height = this.minH;
                    this.top = this.parent.bottom - this.height;
                }
            } else {
                this.top = this.parent.bottom - this.height;
            }

            this.elements[0].attr({
                path: this.getPath()
                    //                x: this.x.left,
                    //                y: this.top,
                    //                width: this.x.width(),
                    //                height: this.height
            });
            //handle 0 is for bottom
            this.elements[0].handles[0].move(this.x.midPoint, this.parent.bottom);
            //handle 1 is for adjusting width
            this.elements[0].handles[1].move(this.x.right, this.parent.bottom - (this.height) / 2);
            //handle 2 is for adjusting top
            this.elements[0].handles[2].move(this.x.midPoint, this.top);
        },
        getPath: function () {
            var r;
            var path = "M" + (this.x.left - 2) + " " + this.top;
            path += " L " + this.x.right + " " + this.top;
            if (this.bottomCurve) {
                r = this.bottomCurve;
                path += " L " + this.x.right + " " + (this.parent.bottom - r);
                path += " Q " + this.x.right + " " + this.parent.bottom + ", " + (this.x.right - r) + " " + this.parent.bottom;
                path += " L " + (this.x.left + r) + " " + this.parent.bottom;
                path += " Q " + this.x.left + " " + this.parent.bottom + ", " + (this.x.left) + " " + (this.parent.bottom - r);
            } else {
                path += " L " + this.x.right + " " + this.parent.bottom;
                path += " L " + this.x.left + " " + this.parent.bottom;
            }
            path += " L " + this.x.left + " " + this.top;
            return path;
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
            this.move(null, evt.svgY);
        },
        dragMoveWidth: function (dx, dy, x, y, evt) {
            evt = svgXY(evt);
            this.move(evt.svgX, null);
        }
    });









    var TextBox = function (parent, left, top, text) {
        BaseElementSet.call(this);
        this.parent = parent;
        this.well = parent.well;

        this.left = left;
        this.top = top;
        this.config.selectElement = this;
        this.strokeColor = 'black';
        this.attrs = {
            stroke: this.strokeColor,
            strokeWidth: 0.005
        };
        this.width = 150;

        this.notifySelection = selectionTypes.textBox;

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
            updateContextMenuPos(this.config.selectElement.left, this.config.selectElement.top + this.height + 5, this.myTextBoxInfo());
        },
        delete: function () {
            deselectCurrent();
            this.remove();
            this.parent.removeTextBox(this);
        },
        select: function () {
            var info = this.myTextBoxInfo();
            this.elements[0].handles.forEach(function (element) {
                element.reAdd();
            });
            well.selectedItem = this.config.selectElement;
            if (csLib.isExist(this.notifySelection)) {
                notifySelection(this.notifySelection, this.left, this.config.selectElement.top + this.height + 20, this.myTextBoxInfo());
            }
        },
        myTextBoxInfo: function () {
            return {
                text: this.text,
                width: Math.max(this.width + 6, 50),
                callback: angular.bind(this, function (text) {

                    this.text = text;
                    this.buildWrappedText(this.text, this.width);
                })
            };
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
                    if (wordArr[wordIndex].search(/\n/) >= 0) {
                        lines[lineIndex] += wordArr[wordIndex];
                        lineIndex++;
                    } else {
                        testElem.node.textContent = lines[lineIndex] + wordArr[wordIndex];
                        if (testElem.node.getComputedTextLength() > len) {
                            lineIndex++;
                            wordIndex--;
                        } else {
                            lines[lineIndex] += wordArr[wordIndex];
                        }
                    }

                }
            }
            this.lineHeight = testElem.node.getBBox().height;
            testElem.remove();

            //now assign the lines to the element array
            for (lineIndex = 0; lineIndex < lines.length; lineIndex++) {
                if (!csLib.isExist(this.elements[lineIndex])) {
                    this.elements[lineIndex] = paper.text(this.left, this.top + this.lineHeight * (lineIndex + 1), lines[lineIndex]).attr(this.attrs);
                    if (lineIndex > 0) this.elements[lineIndex].handles = [];
                } else {
                    this.elements[lineIndex].node.textContent = lines[lineIndex];

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
            updateContextMenuPos(this.left, this.top + this.height + 5, this.myTextBoxInfo());
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
        this.config.selectElement = this;
        this.config.makeACopy = true;
        this.well = well;
        this.x = new XSet(this.well.midPoint, 1);
        this.bottom = bottom;
        this.top = top;

        this.strokeColor = 'brown';

        this.elements[0] = paper.path(this.getPathString()).attr({
            fill: 'none',
            stroke: this.strokeColor
        });
        this.visible = true;

        this.initHandles();
        console.log(this.elements);
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
            path = "M" + this.x.right + " " + this.top + " ";
            for (i = 0; i < 10000; i++) {
                curLen += this.yValues[i % maxY];
                diff = Math.max(curLen - length, 0);
                path += "l " + this.xValues[i % maxX] + " " + Number(Number(this.yValues[i % maxY]) - Number(diff)).toString() + " ";
                if (curLen >= length) break;
            }

            path += "h " + (this.x.left - this.x.right) + " ";

            curLen = 0;
            for (; i >= 0; i--) {
                //                curLen += this.yValues[i % maxY];
                //                diff = Math.max(curLen - length, 0);
                path += "l " + String(-1 * this.xValues[i % maxX]) + " " + Number(-1 * (Number(this.yValues[i % maxY]) - Number(diff))).toString() + " ";
                diff = 0;
            }

            //            path += "M" + this.x.left + " " + this.top + " " + path;
            //            path += "h " + (this.x.right - this.x.left);
            //            return "M" + this.x.right + " " + this.top + " " + path;
            return path;
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
            if (this.elements[0].hasOwnProperty("handles")) this.elements[0].handles[0].move(this.x.midPoint, this.bottom);
            if (this.hasOwnProperty("moveFluid")) this.moveFluid(this.x.right, this.bottom, this.top);
            if (this.well.hasOwnProperty("drillString")) this.well.drillString.moveBottom(null, true);
        },
        enforceBounds: function () {
            if (this.bottom < this.top) {
                this.bottom = this.top;
            }
        },
        show: function () {
            this.visible = true;
            paper.append(this.elements[0]);
            this.well.fluidFill.setVisible(true);
        },
        hide: function () {
            this.visible = false;
            this.elements[0].remove();
            this.elements[0].handles[0].hide();
            this.well.fluidFill.setVisible(false);
        },
        isVisible: function () {
            return this.visible;
        },
        assignFluidMove: function (fm) {
            this.moveFluid = fm;
        },
        xValues: [0, 2, 1, -3, 0, 0, 2, -3, 1, 3, -1, -1, 2, 0, -2, -2, 0, 3, -1, 1, 3, -3, 0, 2, -2, 0, -1, 0, -2, 0, -2, 3, 0],
        yValues: [3, 5, 7, 2, 6, 10, 4, 3, 8, 7, 2, 6, 9, 4, 4, 9, 7, 2, 6, 4, 8, 2, 4, 7, 6, 1, 2, 8, 9, 1, 4, 5, 7, 2, 1, 4, 5, 3, 8, 4, 1, 5, 2]
    });

    /**
     * @class FluidFill
     * @description makes a jagged open hole element at the bottom of the lowest casing
     * @param {Number} x inner x coordinate
     * @param {Number} bottom coordinate for the open hole section
     * @param {Number} top top of the open hole section
     */
    var FluidFill = function (well, x, bottom, top) {
        BaseElementSet.call(this);
        this.config.selectElement = this;
        this.config.makeACopy = true;
        this.well = well;
        this.x = new XSet(this.well.midPoint, 1);
        this.bottom = bottom;
        this.top = top;

        this.notifySelection = selectionTypes.fluidFill;
        this.strokeColor = 'white';

        this.elements[0] = paper.path(this.getPathString()).attr({
            fill: this.strokeColor,
            stroke: 'none'
        });
        this.visible = true;


        this.setVisible(false);
        this.registerSelectClickable();
        this.postCreate();
    };
    FluidFill.prototype = angular.copy(OpenHole.prototype); //Includes base element prototype.  Copying this to get the open hole functinos.
    angular.extend(FluidFill.prototype, {
        recolor: function (color) {
            if (!this.visible) return;
            if (!csLib.isExist(color)) color = this.strokeColor;
            this.elements.forEach(function (element) {
                element.attr({
                    //stroke: color,
                    fill: color,
                    'fill-opacity': 0.3
                });
            });
        },
        setVisible: function (vis) {
            this.visible = vis;
        },
        updateFluidPath: function () {
            var s = this.well.strings;
            var cur, path, downPath = "",
                i, j, widerThan, asBottom = 0;
            var minw;
            var topmost;
            path = this.getPathString();

            widerThan = 0;
            topmost = 100000;
            //console.log(s.length);
            for (i = 0; i < s.length; i++) {
                minw = 100000;
                for (j = 0; j < s.length; j++) {
                    if (s[j]) {
                        if (s[j].x.width() < minw && s[j].x.width() > widerThan && ((asBottom === 0) || (s[j].top <= asBottom))) {
                            minw = s[j].x.width();
                            cur = s[j];
                        }
                        if (s[j].top < topmost) topmost = s[j].top;
                    }
                }
                if (asBottom === 0) asBottom = cur.bottom;
                path += " L " + cur.x.left + " " + asBottom + " L " + cur.x.left + " " + cur.top;
                downPath = " L " + cur.x.right + " " + cur.top + " L " + cur.x.right + " " + asBottom + downPath;
                widerThan = cur.x.width();
                asBottom = cur.top;
                if (cur.top <= topmost) break;
            }
            path += downPath;
            return path;
        },
        move: function (x, bottom, top) {
            if (x >= 0 && x !== undefined && x !== null) this.x.right = x;
            if (bottom >= 0 && bottom !== undefined && bottom !== null) this.bottom = bottom;
            if (top >= 0 && top !== undefined && top !== null) this.top = top;
            //if (!this.isVisible) this.show();
            //this.enforceBounds();
            this.x.left = mirrorPoint(this.x.right);
            this.elements[0].attr({
                path: this.updateFluidPath()
            });
        },
        select: function () {
            well.selectedItem = this.config.selectElement;
            if (csLib.isExist(this.notifySelection)) {
                notifySelection(this.notifySelection, this.well.midPoint, (this.config.selectElement.bottom) / 2);
            }
        }
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

        this.config.selectElement = this; //selections should happen at the Packer level
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
        this.config.makeACopy = true;

        this.config.selectElement = this.parent; //selections should happen at the parent level

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
        this.config.makeACopy = true;

        this.config.selectElement = this.parent; //selections should happen at the parent level
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
        this.config.makeACopy = true;

        this.shoeY = this.parent.bottom;
        this.bottom = this.shoeY;
        this.height = appConst.cementHeight;
        this.top = this.bottom - this.height;
        this.x = this.parent.x;

        this.config.selectElement = this; //selections should happen for cement seperate from rest of string
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
            if (!csLib.isExist(color)) color = this.strokeColor;
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

    var Handle = function (x, y, dragHandler, afterDragHandler) {
        this.e = paper.circle(x, y, 5).attr({
            fill: 'yellow',
            stroke: 'red',
            strokeWidth: 2,
            cursor: 'move'
        });
        this.afterDragHandler = afterDragHandler;
        this.e.drag(dragHandler, this.dragStartHandler, this.dragEndHandler);
        handles.push(this.e);
    };
    Handle.prototype = {
        dragStartHandler: function (x, y, evt) {
            evt = svgXY(evt);
            well.drag = {
                element: evt.target,
                happened: true,
                id: evt.timeStamp
            };
            well.lastDrag = {
                x: evt.svgX,
                y: evt.svgY
            };
            hideSelection();
            hideHandlesDuringDrag(evt.target);
        },
        dragEndHandler: function () {
            restoreSelection();
            restoreHandlesAfterDrag();
            well.drag.happened = false;
            well.drag.id = 0;
            if (this.afterDragHandler) this.afterDragHandler();
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
        this.config.makeACopy = true;
        this.well = parent;
        this.x = new XSet(this.well.midPoint, x);
        this.maxx = paper.width;
        this.y = y;
        this.config.selectElement = this;
        this.strokeColor = 'brown';

        this.elements[0] = paper.line(this.x.right, this.y, this.maxx, this.y).attr(this.style());
        this.elements[1] = paper.line(0, this.y, this.x.left, this.y).attr(this.style());

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
                this.x.right = Math.max(x, mirrorPoint(x));
                this.x.left = mirrorPoint(this.x.right);
            }
            if (y >= 0 && y !== undefined && y !== null) this.y = y;
            deltay = this.y - oldy;
            if (deltay) this.parent.moveTops(oldy, deltay);

            this.elements[0].attr({
                x1: this.x.right,
                y1: this.y,
                y2: this.y
            });
            this.elements[1].attr({
                x2: this.x.left,
                y1: this.y,
                y2: this.y
            });
            this.elements[0].handles[0].move(this.handleXPos(), this.y);
            this.parent.groundLevel = this.y;
        },
        handleXPos: function () {
            return this.x.right + (this.maxx - this.x.right) / 2;
        },
        dragGroundLevel: function (dx, dy, x, y, evt) {
            evt = svgXY(evt);
            this.move(null, evt.svgY);
        },
    });


    return this;
}]);
