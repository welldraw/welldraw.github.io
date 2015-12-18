var app = angular.module('WellDraw', ['ui.bootstrap']);

app.value('appConst', {
    cementHeight: 100,
    cementWidth: 15,
    highlightHex: "#EE0"
});

app.value('csLib', {
    isExist: function (x) {
        return (x !== undefined && x !== null);
    },
    isExistPositive: function (x) {
        return (x >= 0 && x !== undefined && x !== null);
    },
    useThisOrAlternate: function (x, alternate) {
        if (x !== undefined && x !== null) {
            return x;
        } else {
            return alternate;
        }
    }
});

//http://stackoverflow.com/questions/9308938/inline-text-editing-in-svg

//@todo: get rid of clickable array
//@todo
