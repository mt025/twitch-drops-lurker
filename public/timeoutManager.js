//From https://stackoverflow.com/a/17069840/4775650

;(function () {
    window.timeouts = {},
    window.intervals = {},
    window.osetTimeout = window.setTimeout,
    window.osetInterval = window.setInterval,
    window.oclearTimeout = window.clearTimeout,
    window.oclearInterval = window.clearInterval,
    window.setTimeout = function () {
        var args = _parseArgs('timeouts', arguments),
            timeout = window.osetTimeout.apply(this, args.args);
        window.timeouts[args.ns].push(timeout);
        return timeout;
    },
    window.setInterval = function () {
        var args = _parseArgs('intervals', arguments),
            interval = window.osetInterval.apply(this, args.args);
        window.intervals[args.ns].push(interval);
        return interval;
    },
    window.clearTimeout = function () {
        _removeTimer('timeouts', arguments);
    },
    window.clearInterval = function () {
        _removeTimer('intervals', arguments);
    },
    window.clearAllTimeout = function () {
        _clearAllTimer('timeouts', arguments[0]);
    },
    window.clearAllInterval = function () {
        _clearAllTimer('intervals', arguments[0]);
    };

    function _parseArgs(type, args) {
        var ns = typeof args[0] === "function" ? "no_ns" : args[0];
        if (ns !== "no_ns")[].splice.call(args, 0, 1);
        if (!window[type][ns]) window[type][ns] = [];
        return {
            ns: ns,
            args: args
        };
    }

    function _removeTimer(type, args) {
        var fnToCall = type === "timeouts" ? "oclearTimeout" : "oclearInterval",
            timerId = args[0];
        window[fnToCall].apply(this, args);
        for (var k in window[type]) {
            for (var i = 0, z = window[type][k].length; i < z; i++) {
                if (window[type][k][i] === timerId) {
                    window[type][k].splice(i, 1);
                    if (!window[type][k].length) delete window[type][k];
                    return;                        
                }
            }
        }
    }

    function _clearAllTimer(type, ns) {
        var timersToClear = ns ? window[type][ns] : (function () {
            var timers = [];
            for (var k in window[type]) {
                timers = timers.concat(window[type][k]);
            }
            return timers;
        }());
        for (var i = 0, z = timersToClear.length; i < z; i++) {
            _removeTimer(type, [timersToClear[i]]);
        }
    }
}());