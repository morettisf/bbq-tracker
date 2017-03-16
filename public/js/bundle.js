(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var app = require('./public/js/app.js');
var nav = require('./public/js/nav.js');
var datepickr = require('./public/js/datepickr.js');
var moment = require('moment');
var sorttable = require('./public/js/sorttable.js');
var fetch = require('whatwg-fetch');

},{"./public/js/app.js":5,"./public/js/datepickr.js":6,"./public/js/nav.js":7,"./public/js/sorttable.js":8,"moment":3,"whatwg-fetch":4}],2:[function(require,module,exports){
const map = new WeakMap
const wm = o => map.get(o)

function normalizeValue([value, filename]) {
  if (value instanceof Blob)
    value = new File([value], filename, {
      type: value.type,
      lastModified: value.lastModified
    })

  return value
}

function stringify(name) {
  if (!arguments.length) 
    throw new TypeError('1 argument required, but only 0 present.')

  return [name + '']
}

function normalizeArgs(name, value, filename) {
  if (arguments.length < 2) 
    throw new TypeError(`2 arguments required, but only ${arguments.length} present.`)
    
  return value instanceof Blob 
    ? [name + '', value, filename !== undefined 
      ? filename + '' 
      : value[Symbol.toStringTag] === 'File'
        ? value.name 
        : 'Blob']
    : [name + '', value + '']
}

/**
 * @implements {Iterable}
 */
class FormDataPolyfill {

  /**
   * FormData class
   *
   * @param {HTMLElement=} form
   */
  constructor(form) {
    map.set(this, Object.create(null))

    if (!form)
      return this

    for (let {name, type, value, files, checked, selectedOptions} of Array.from(form.elements)) {
      if(!name) continue

      if (type === 'file')
        for (let file of files)
          this.append(name, file)
      else if (type === 'select-multiple' || type === 'select-one')
        for (let elm of selectedOptions)
          this.append(name, elm.value)
      else if (type === 'checkbox')
        if (checked) this.append(name, value)
      else
        this.append(name, value)
    }
  }


  /**
   * Append a field
   *
   * @param   {String}           name      field name
   * @param   {String|Blob|File} value     string / blob / file
   * @param   {String=}          filename  filename to use with blob
   * @return  {Undefined}
   */
  append(name, value, filename) {
    let map = wm(this)

    if (!map[name])
      map[name] = []

    map[name].push([value, filename])
  }


  /**
   * Delete all fields values given name
   *
   * @param   {String}  name  Field name
   * @return  {Undefined}
   */
  delete(name) {
    delete wm(this)[name]
  }


  /**
   * Iterate over all fields as [name, value]
   *
   * @return {Iterator}
   */
  *entries() {
    let map = wm(this)

    for (let name in map)
      for (let value of map[name])
        yield [name, normalizeValue(value)]
  }

  /**
   * Iterate over all fields
   *
   * @param   {Function}  callback  Executed for each item with parameters (value, name, thisArg)
   * @param   {Object=}   thisArg   `this` context for callback function
   * @return  {Undefined}
   */
  forEach(callback, thisArg) {
    for (let [name, value] of this)
      callback.call(thisArg, value, name, this)
  }


  /**
   * Return first field value given name
   *
   * @param   {String}  name  Field name
   * @return  {String|File}   value Fields value
   */
  get(name) {
    let map = wm(this)
    return map[name] ? normalizeValue(map[name][0]) : null
  }


  /**
   * Return all fields values given name
   *
   * @param   {String}  name  Fields name
   * @return  {Array}         [value, value]
   */
  getAll(name) {
    return (wm(this)[name] || []).map(normalizeValue)
  }


  /**
   * Check for field name existence
   *
   * @param   {String}   name  Field name
   * @return  {boolean}
   */
  has(name) {
    return name in wm(this)
  }
  

  /**
   * Iterate over all fields name
   *
   * @return {Iterator}
   */
  *keys() {
    for (let [name] of this)
      yield name
  }


  /**
   * Overwrite all values given name
   *
   * @param   {String}    name      Filed name
   * @param   {String}    value     Field value
   * @param   {String=}   filename  Filename (optional)
   * @return  {Undefined}
   */
  set(name, value, filename) {
    wm(this)[name] = [[value, filename]]
  }


  /**
   * Iterate over all fields
   *
   * @return {Iterator}
   */
  *values() {
    for (let [name, value] of this)
      yield value
  }


  /**
   * Non standard but it has been proposed: https://github.com/w3c/FileAPI/issues/40
   *
   * @return {ReadableStream}
   */
  stream() {
    try {
      return this._blob().stream()
    } catch(e) {
      throw new Error('Include https://github.com/jimmywarting/Screw-FileReader for streaming support')
    }
  }


  /**
   * Return a native (perhaps degraded) FormData with only a `append` method
   * Can throw if it's not supported
   *
   * @return {FormData}
   */
  _asNative() {
    let fd = new FormData

    for (let [name, value] of this)
      fd.append(name, value)

    return fd
  }


  /**
   * [_blob description]
   *
   * @return {Blob} [description]
   */
  _blob() {
    var boundary = '----FormDataPolyfill' + Math.random()
    var chunks = []

    for (let [name, value] of this) {
      chunks.push(`--${boundary}\r\n`)

      if (value[Symbol.toStringTag] === 'File') {
        chunks.push(
          `Content-Disposition: form-data; name="${name}"; filename="${value.name}"\r\n`,
          `Content-Type: ${value.type}\r\n\r\n`,
          value,
          '\r\n'
        )
      } else {
        chunks.push(
          `Content-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`
        )
      }
    }

    chunks.push(`--${boundary}--`)

    return new Blob(chunks, {type: 'multipart/form-data; boundary=' + boundary})
  }


  /**
   * The class itself is iterable
   * alias for formdata.entries()
   *
   * @return  {Iterator}
   */
  [Symbol.iterator]() {
    return this.entries()
  }


  /**
   * Create the default string description.
   * It is accessed internally by the Object.prototype.toString().
   *
   * @return {String} FormData
   */
  get [Symbol.toStringTag]() {
    return 'FormData'
  }
}

for (let [method, overide] of [
  ['append', normalizeArgs],
  ['delete', stringify],
  ['get',    stringify],
  ['getAll', stringify],
  ['has',    stringify],
  ['set',    normalizeArgs]
]) {
  let orig = FormDataPolyfill.prototype[method]
  FormDataPolyfill.prototype[method] = function() {
    return orig.apply(this, overide(...arguments))
  }
}

module.exports = FormDataPolyfill

},{}],3:[function(require,module,exports){
//! moment.js
//! version : 2.17.1
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.moment = factory()
}(this, (function () { 'use strict';

var hookCallback;

function hooks () {
    return hookCallback.apply(null, arguments);
}

// This is done to register the method called with moment()
// without creating circular dependencies.
function setHookCallback (callback) {
    hookCallback = callback;
}

function isArray(input) {
    return input instanceof Array || Object.prototype.toString.call(input) === '[object Array]';
}

function isObject(input) {
    // IE8 will treat undefined and null as object if it wasn't for
    // input != null
    return input != null && Object.prototype.toString.call(input) === '[object Object]';
}

function isObjectEmpty(obj) {
    var k;
    for (k in obj) {
        // even if its not own property I'd still call it non-empty
        return false;
    }
    return true;
}

function isNumber(input) {
    return typeof input === 'number' || Object.prototype.toString.call(input) === '[object Number]';
}

function isDate(input) {
    return input instanceof Date || Object.prototype.toString.call(input) === '[object Date]';
}

function map(arr, fn) {
    var res = [], i;
    for (i = 0; i < arr.length; ++i) {
        res.push(fn(arr[i], i));
    }
    return res;
}

function hasOwnProp(a, b) {
    return Object.prototype.hasOwnProperty.call(a, b);
}

function extend(a, b) {
    for (var i in b) {
        if (hasOwnProp(b, i)) {
            a[i] = b[i];
        }
    }

    if (hasOwnProp(b, 'toString')) {
        a.toString = b.toString;
    }

    if (hasOwnProp(b, 'valueOf')) {
        a.valueOf = b.valueOf;
    }

    return a;
}

function createUTC (input, format, locale, strict) {
    return createLocalOrUTC(input, format, locale, strict, true).utc();
}

function defaultParsingFlags() {
    // We need to deep clone this object.
    return {
        empty           : false,
        unusedTokens    : [],
        unusedInput     : [],
        overflow        : -2,
        charsLeftOver   : 0,
        nullInput       : false,
        invalidMonth    : null,
        invalidFormat   : false,
        userInvalidated : false,
        iso             : false,
        parsedDateParts : [],
        meridiem        : null
    };
}

function getParsingFlags(m) {
    if (m._pf == null) {
        m._pf = defaultParsingFlags();
    }
    return m._pf;
}

var some;
if (Array.prototype.some) {
    some = Array.prototype.some;
} else {
    some = function (fun) {
        var t = Object(this);
        var len = t.length >>> 0;

        for (var i = 0; i < len; i++) {
            if (i in t && fun.call(this, t[i], i, t)) {
                return true;
            }
        }

        return false;
    };
}

var some$1 = some;

function isValid(m) {
    if (m._isValid == null) {
        var flags = getParsingFlags(m);
        var parsedParts = some$1.call(flags.parsedDateParts, function (i) {
            return i != null;
        });
        var isNowValid = !isNaN(m._d.getTime()) &&
            flags.overflow < 0 &&
            !flags.empty &&
            !flags.invalidMonth &&
            !flags.invalidWeekday &&
            !flags.nullInput &&
            !flags.invalidFormat &&
            !flags.userInvalidated &&
            (!flags.meridiem || (flags.meridiem && parsedParts));

        if (m._strict) {
            isNowValid = isNowValid &&
                flags.charsLeftOver === 0 &&
                flags.unusedTokens.length === 0 &&
                flags.bigHour === undefined;
        }

        if (Object.isFrozen == null || !Object.isFrozen(m)) {
            m._isValid = isNowValid;
        }
        else {
            return isNowValid;
        }
    }
    return m._isValid;
}

function createInvalid (flags) {
    var m = createUTC(NaN);
    if (flags != null) {
        extend(getParsingFlags(m), flags);
    }
    else {
        getParsingFlags(m).userInvalidated = true;
    }

    return m;
}

function isUndefined(input) {
    return input === void 0;
}

// Plugins that add properties should also add the key here (null value),
// so we can properly clone ourselves.
var momentProperties = hooks.momentProperties = [];

function copyConfig(to, from) {
    var i, prop, val;

    if (!isUndefined(from._isAMomentObject)) {
        to._isAMomentObject = from._isAMomentObject;
    }
    if (!isUndefined(from._i)) {
        to._i = from._i;
    }
    if (!isUndefined(from._f)) {
        to._f = from._f;
    }
    if (!isUndefined(from._l)) {
        to._l = from._l;
    }
    if (!isUndefined(from._strict)) {
        to._strict = from._strict;
    }
    if (!isUndefined(from._tzm)) {
        to._tzm = from._tzm;
    }
    if (!isUndefined(from._isUTC)) {
        to._isUTC = from._isUTC;
    }
    if (!isUndefined(from._offset)) {
        to._offset = from._offset;
    }
    if (!isUndefined(from._pf)) {
        to._pf = getParsingFlags(from);
    }
    if (!isUndefined(from._locale)) {
        to._locale = from._locale;
    }

    if (momentProperties.length > 0) {
        for (i in momentProperties) {
            prop = momentProperties[i];
            val = from[prop];
            if (!isUndefined(val)) {
                to[prop] = val;
            }
        }
    }

    return to;
}

var updateInProgress = false;

// Moment prototype object
function Moment(config) {
    copyConfig(this, config);
    this._d = new Date(config._d != null ? config._d.getTime() : NaN);
    if (!this.isValid()) {
        this._d = new Date(NaN);
    }
    // Prevent infinite loop in case updateOffset creates new moment
    // objects.
    if (updateInProgress === false) {
        updateInProgress = true;
        hooks.updateOffset(this);
        updateInProgress = false;
    }
}

function isMoment (obj) {
    return obj instanceof Moment || (obj != null && obj._isAMomentObject != null);
}

function absFloor (number) {
    if (number < 0) {
        // -0 -> 0
        return Math.ceil(number) || 0;
    } else {
        return Math.floor(number);
    }
}

function toInt(argumentForCoercion) {
    var coercedNumber = +argumentForCoercion,
        value = 0;

    if (coercedNumber !== 0 && isFinite(coercedNumber)) {
        value = absFloor(coercedNumber);
    }

    return value;
}

// compare two arrays, return the number of differences
function compareArrays(array1, array2, dontConvert) {
    var len = Math.min(array1.length, array2.length),
        lengthDiff = Math.abs(array1.length - array2.length),
        diffs = 0,
        i;
    for (i = 0; i < len; i++) {
        if ((dontConvert && array1[i] !== array2[i]) ||
            (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
            diffs++;
        }
    }
    return diffs + lengthDiff;
}

function warn(msg) {
    if (hooks.suppressDeprecationWarnings === false &&
            (typeof console !==  'undefined') && console.warn) {
        console.warn('Deprecation warning: ' + msg);
    }
}

function deprecate(msg, fn) {
    var firstTime = true;

    return extend(function () {
        if (hooks.deprecationHandler != null) {
            hooks.deprecationHandler(null, msg);
        }
        if (firstTime) {
            var args = [];
            var arg;
            for (var i = 0; i < arguments.length; i++) {
                arg = '';
                if (typeof arguments[i] === 'object') {
                    arg += '\n[' + i + '] ';
                    for (var key in arguments[0]) {
                        arg += key + ': ' + arguments[0][key] + ', ';
                    }
                    arg = arg.slice(0, -2); // Remove trailing comma and space
                } else {
                    arg = arguments[i];
                }
                args.push(arg);
            }
            warn(msg + '\nArguments: ' + Array.prototype.slice.call(args).join('') + '\n' + (new Error()).stack);
            firstTime = false;
        }
        return fn.apply(this, arguments);
    }, fn);
}

var deprecations = {};

function deprecateSimple(name, msg) {
    if (hooks.deprecationHandler != null) {
        hooks.deprecationHandler(name, msg);
    }
    if (!deprecations[name]) {
        warn(msg);
        deprecations[name] = true;
    }
}

hooks.suppressDeprecationWarnings = false;
hooks.deprecationHandler = null;

function isFunction(input) {
    return input instanceof Function || Object.prototype.toString.call(input) === '[object Function]';
}

function set (config) {
    var prop, i;
    for (i in config) {
        prop = config[i];
        if (isFunction(prop)) {
            this[i] = prop;
        } else {
            this['_' + i] = prop;
        }
    }
    this._config = config;
    // Lenient ordinal parsing accepts just a number in addition to
    // number + (possibly) stuff coming from _ordinalParseLenient.
    this._ordinalParseLenient = new RegExp(this._ordinalParse.source + '|' + (/\d{1,2}/).source);
}

function mergeConfigs(parentConfig, childConfig) {
    var res = extend({}, parentConfig), prop;
    for (prop in childConfig) {
        if (hasOwnProp(childConfig, prop)) {
            if (isObject(parentConfig[prop]) && isObject(childConfig[prop])) {
                res[prop] = {};
                extend(res[prop], parentConfig[prop]);
                extend(res[prop], childConfig[prop]);
            } else if (childConfig[prop] != null) {
                res[prop] = childConfig[prop];
            } else {
                delete res[prop];
            }
        }
    }
    for (prop in parentConfig) {
        if (hasOwnProp(parentConfig, prop) &&
                !hasOwnProp(childConfig, prop) &&
                isObject(parentConfig[prop])) {
            // make sure changes to properties don't modify parent config
            res[prop] = extend({}, res[prop]);
        }
    }
    return res;
}

function Locale(config) {
    if (config != null) {
        this.set(config);
    }
}

var keys;

if (Object.keys) {
    keys = Object.keys;
} else {
    keys = function (obj) {
        var i, res = [];
        for (i in obj) {
            if (hasOwnProp(obj, i)) {
                res.push(i);
            }
        }
        return res;
    };
}

var keys$1 = keys;

var defaultCalendar = {
    sameDay : '[Today at] LT',
    nextDay : '[Tomorrow at] LT',
    nextWeek : 'dddd [at] LT',
    lastDay : '[Yesterday at] LT',
    lastWeek : '[Last] dddd [at] LT',
    sameElse : 'L'
};

function calendar (key, mom, now) {
    var output = this._calendar[key] || this._calendar['sameElse'];
    return isFunction(output) ? output.call(mom, now) : output;
}

var defaultLongDateFormat = {
    LTS  : 'h:mm:ss A',
    LT   : 'h:mm A',
    L    : 'MM/DD/YYYY',
    LL   : 'MMMM D, YYYY',
    LLL  : 'MMMM D, YYYY h:mm A',
    LLLL : 'dddd, MMMM D, YYYY h:mm A'
};

function longDateFormat (key) {
    var format = this._longDateFormat[key],
        formatUpper = this._longDateFormat[key.toUpperCase()];

    if (format || !formatUpper) {
        return format;
    }

    this._longDateFormat[key] = formatUpper.replace(/MMMM|MM|DD|dddd/g, function (val) {
        return val.slice(1);
    });

    return this._longDateFormat[key];
}

var defaultInvalidDate = 'Invalid date';

function invalidDate () {
    return this._invalidDate;
}

var defaultOrdinal = '%d';
var defaultOrdinalParse = /\d{1,2}/;

function ordinal (number) {
    return this._ordinal.replace('%d', number);
}

var defaultRelativeTime = {
    future : 'in %s',
    past   : '%s ago',
    s  : 'a few seconds',
    m  : 'a minute',
    mm : '%d minutes',
    h  : 'an hour',
    hh : '%d hours',
    d  : 'a day',
    dd : '%d days',
    M  : 'a month',
    MM : '%d months',
    y  : 'a year',
    yy : '%d years'
};

function relativeTime (number, withoutSuffix, string, isFuture) {
    var output = this._relativeTime[string];
    return (isFunction(output)) ?
        output(number, withoutSuffix, string, isFuture) :
        output.replace(/%d/i, number);
}

function pastFuture (diff, output) {
    var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
    return isFunction(format) ? format(output) : format.replace(/%s/i, output);
}

var aliases = {};

function addUnitAlias (unit, shorthand) {
    var lowerCase = unit.toLowerCase();
    aliases[lowerCase] = aliases[lowerCase + 's'] = aliases[shorthand] = unit;
}

function normalizeUnits(units) {
    return typeof units === 'string' ? aliases[units] || aliases[units.toLowerCase()] : undefined;
}

function normalizeObjectUnits(inputObject) {
    var normalizedInput = {},
        normalizedProp,
        prop;

    for (prop in inputObject) {
        if (hasOwnProp(inputObject, prop)) {
            normalizedProp = normalizeUnits(prop);
            if (normalizedProp) {
                normalizedInput[normalizedProp] = inputObject[prop];
            }
        }
    }

    return normalizedInput;
}

var priorities = {};

function addUnitPriority(unit, priority) {
    priorities[unit] = priority;
}

function getPrioritizedUnits(unitsObj) {
    var units = [];
    for (var u in unitsObj) {
        units.push({unit: u, priority: priorities[u]});
    }
    units.sort(function (a, b) {
        return a.priority - b.priority;
    });
    return units;
}

function makeGetSet (unit, keepTime) {
    return function (value) {
        if (value != null) {
            set$1(this, unit, value);
            hooks.updateOffset(this, keepTime);
            return this;
        } else {
            return get(this, unit);
        }
    };
}

function get (mom, unit) {
    return mom.isValid() ?
        mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]() : NaN;
}

function set$1 (mom, unit, value) {
    if (mom.isValid()) {
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
    }
}

// MOMENTS

function stringGet (units) {
    units = normalizeUnits(units);
    if (isFunction(this[units])) {
        return this[units]();
    }
    return this;
}


function stringSet (units, value) {
    if (typeof units === 'object') {
        units = normalizeObjectUnits(units);
        var prioritized = getPrioritizedUnits(units);
        for (var i = 0; i < prioritized.length; i++) {
            this[prioritized[i].unit](units[prioritized[i].unit]);
        }
    } else {
        units = normalizeUnits(units);
        if (isFunction(this[units])) {
            return this[units](value);
        }
    }
    return this;
}

function zeroFill(number, targetLength, forceSign) {
    var absNumber = '' + Math.abs(number),
        zerosToFill = targetLength - absNumber.length,
        sign = number >= 0;
    return (sign ? (forceSign ? '+' : '') : '-') +
        Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) + absNumber;
}

var formattingTokens = /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g;

var localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g;

var formatFunctions = {};

var formatTokenFunctions = {};

// token:    'M'
// padded:   ['MM', 2]
// ordinal:  'Mo'
// callback: function () { this.month() + 1 }
function addFormatToken (token, padded, ordinal, callback) {
    var func = callback;
    if (typeof callback === 'string') {
        func = function () {
            return this[callback]();
        };
    }
    if (token) {
        formatTokenFunctions[token] = func;
    }
    if (padded) {
        formatTokenFunctions[padded[0]] = function () {
            return zeroFill(func.apply(this, arguments), padded[1], padded[2]);
        };
    }
    if (ordinal) {
        formatTokenFunctions[ordinal] = function () {
            return this.localeData().ordinal(func.apply(this, arguments), token);
        };
    }
}

function removeFormattingTokens(input) {
    if (input.match(/\[[\s\S]/)) {
        return input.replace(/^\[|\]$/g, '');
    }
    return input.replace(/\\/g, '');
}

function makeFormatFunction(format) {
    var array = format.match(formattingTokens), i, length;

    for (i = 0, length = array.length; i < length; i++) {
        if (formatTokenFunctions[array[i]]) {
            array[i] = formatTokenFunctions[array[i]];
        } else {
            array[i] = removeFormattingTokens(array[i]);
        }
    }

    return function (mom) {
        var output = '', i;
        for (i = 0; i < length; i++) {
            output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
        }
        return output;
    };
}

// format date using native date object
function formatMoment(m, format) {
    if (!m.isValid()) {
        return m.localeData().invalidDate();
    }

    format = expandFormat(format, m.localeData());
    formatFunctions[format] = formatFunctions[format] || makeFormatFunction(format);

    return formatFunctions[format](m);
}

function expandFormat(format, locale) {
    var i = 5;

    function replaceLongDateFormatTokens(input) {
        return locale.longDateFormat(input) || input;
    }

    localFormattingTokens.lastIndex = 0;
    while (i >= 0 && localFormattingTokens.test(format)) {
        format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
        localFormattingTokens.lastIndex = 0;
        i -= 1;
    }

    return format;
}

var match1         = /\d/;            //       0 - 9
var match2         = /\d\d/;          //      00 - 99
var match3         = /\d{3}/;         //     000 - 999
var match4         = /\d{4}/;         //    0000 - 9999
var match6         = /[+-]?\d{6}/;    // -999999 - 999999
var match1to2      = /\d\d?/;         //       0 - 99
var match3to4      = /\d\d\d\d?/;     //     999 - 9999
var match5to6      = /\d\d\d\d\d\d?/; //   99999 - 999999
var match1to3      = /\d{1,3}/;       //       0 - 999
var match1to4      = /\d{1,4}/;       //       0 - 9999
var match1to6      = /[+-]?\d{1,6}/;  // -999999 - 999999

var matchUnsigned  = /\d+/;           //       0 - inf
var matchSigned    = /[+-]?\d+/;      //    -inf - inf

var matchOffset    = /Z|[+-]\d\d:?\d\d/gi; // +00:00 -00:00 +0000 -0000 or Z
var matchShortOffset = /Z|[+-]\d\d(?::?\d\d)?/gi; // +00 -00 +00:00 -00:00 +0000 -0000 or Z

var matchTimestamp = /[+-]?\d+(\.\d{1,3})?/; // 123456789 123456789.123

// any word (or two) characters or numbers including two/three word month in arabic.
// includes scottish gaelic two word and hyphenated months
var matchWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i;


var regexes = {};

function addRegexToken (token, regex, strictRegex) {
    regexes[token] = isFunction(regex) ? regex : function (isStrict, localeData) {
        return (isStrict && strictRegex) ? strictRegex : regex;
    };
}

function getParseRegexForToken (token, config) {
    if (!hasOwnProp(regexes, token)) {
        return new RegExp(unescapeFormat(token));
    }

    return regexes[token](config._strict, config._locale);
}

// Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
function unescapeFormat(s) {
    return regexEscape(s.replace('\\', '').replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
        return p1 || p2 || p3 || p4;
    }));
}

function regexEscape(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

var tokens = {};

function addParseToken (token, callback) {
    var i, func = callback;
    if (typeof token === 'string') {
        token = [token];
    }
    if (isNumber(callback)) {
        func = function (input, array) {
            array[callback] = toInt(input);
        };
    }
    for (i = 0; i < token.length; i++) {
        tokens[token[i]] = func;
    }
}

function addWeekParseToken (token, callback) {
    addParseToken(token, function (input, array, config, token) {
        config._w = config._w || {};
        callback(input, config._w, config, token);
    });
}

function addTimeToArrayFromToken(token, input, config) {
    if (input != null && hasOwnProp(tokens, token)) {
        tokens[token](input, config._a, config, token);
    }
}

var YEAR = 0;
var MONTH = 1;
var DATE = 2;
var HOUR = 3;
var MINUTE = 4;
var SECOND = 5;
var MILLISECOND = 6;
var WEEK = 7;
var WEEKDAY = 8;

var indexOf;

if (Array.prototype.indexOf) {
    indexOf = Array.prototype.indexOf;
} else {
    indexOf = function (o) {
        // I know
        var i;
        for (i = 0; i < this.length; ++i) {
            if (this[i] === o) {
                return i;
            }
        }
        return -1;
    };
}

var indexOf$1 = indexOf;

function daysInMonth(year, month) {
    return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

// FORMATTING

addFormatToken('M', ['MM', 2], 'Mo', function () {
    return this.month() + 1;
});

addFormatToken('MMM', 0, 0, function (format) {
    return this.localeData().monthsShort(this, format);
});

addFormatToken('MMMM', 0, 0, function (format) {
    return this.localeData().months(this, format);
});

// ALIASES

addUnitAlias('month', 'M');

// PRIORITY

addUnitPriority('month', 8);

// PARSING

addRegexToken('M',    match1to2);
addRegexToken('MM',   match1to2, match2);
addRegexToken('MMM',  function (isStrict, locale) {
    return locale.monthsShortRegex(isStrict);
});
addRegexToken('MMMM', function (isStrict, locale) {
    return locale.monthsRegex(isStrict);
});

addParseToken(['M', 'MM'], function (input, array) {
    array[MONTH] = toInt(input) - 1;
});

addParseToken(['MMM', 'MMMM'], function (input, array, config, token) {
    var month = config._locale.monthsParse(input, token, config._strict);
    // if we didn't find a month name, mark the date as invalid.
    if (month != null) {
        array[MONTH] = month;
    } else {
        getParsingFlags(config).invalidMonth = input;
    }
});

// LOCALES

var MONTHS_IN_FORMAT = /D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/;
var defaultLocaleMonths = 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_');
function localeMonths (m, format) {
    if (!m) {
        return this._months;
    }
    return isArray(this._months) ? this._months[m.month()] :
        this._months[(this._months.isFormat || MONTHS_IN_FORMAT).test(format) ? 'format' : 'standalone'][m.month()];
}

var defaultLocaleMonthsShort = 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_');
function localeMonthsShort (m, format) {
    if (!m) {
        return this._monthsShort;
    }
    return isArray(this._monthsShort) ? this._monthsShort[m.month()] :
        this._monthsShort[MONTHS_IN_FORMAT.test(format) ? 'format' : 'standalone'][m.month()];
}

function handleStrictParse(monthName, format, strict) {
    var i, ii, mom, llc = monthName.toLocaleLowerCase();
    if (!this._monthsParse) {
        // this is not used
        this._monthsParse = [];
        this._longMonthsParse = [];
        this._shortMonthsParse = [];
        for (i = 0; i < 12; ++i) {
            mom = createUTC([2000, i]);
            this._shortMonthsParse[i] = this.monthsShort(mom, '').toLocaleLowerCase();
            this._longMonthsParse[i] = this.months(mom, '').toLocaleLowerCase();
        }
    }

    if (strict) {
        if (format === 'MMM') {
            ii = indexOf$1.call(this._shortMonthsParse, llc);
            return ii !== -1 ? ii : null;
        } else {
            ii = indexOf$1.call(this._longMonthsParse, llc);
            return ii !== -1 ? ii : null;
        }
    } else {
        if (format === 'MMM') {
            ii = indexOf$1.call(this._shortMonthsParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf$1.call(this._longMonthsParse, llc);
            return ii !== -1 ? ii : null;
        } else {
            ii = indexOf$1.call(this._longMonthsParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf$1.call(this._shortMonthsParse, llc);
            return ii !== -1 ? ii : null;
        }
    }
}

function localeMonthsParse (monthName, format, strict) {
    var i, mom, regex;

    if (this._monthsParseExact) {
        return handleStrictParse.call(this, monthName, format, strict);
    }

    if (!this._monthsParse) {
        this._monthsParse = [];
        this._longMonthsParse = [];
        this._shortMonthsParse = [];
    }

    // TODO: add sorting
    // Sorting makes sure if one month (or abbr) is a prefix of another
    // see sorting in computeMonthsParse
    for (i = 0; i < 12; i++) {
        // make the regex if we don't have it already
        mom = createUTC([2000, i]);
        if (strict && !this._longMonthsParse[i]) {
            this._longMonthsParse[i] = new RegExp('^' + this.months(mom, '').replace('.', '') + '$', 'i');
            this._shortMonthsParse[i] = new RegExp('^' + this.monthsShort(mom, '').replace('.', '') + '$', 'i');
        }
        if (!strict && !this._monthsParse[i]) {
            regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
            this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
        }
        // test the regex
        if (strict && format === 'MMMM' && this._longMonthsParse[i].test(monthName)) {
            return i;
        } else if (strict && format === 'MMM' && this._shortMonthsParse[i].test(monthName)) {
            return i;
        } else if (!strict && this._monthsParse[i].test(monthName)) {
            return i;
        }
    }
}

// MOMENTS

function setMonth (mom, value) {
    var dayOfMonth;

    if (!mom.isValid()) {
        // No op
        return mom;
    }

    if (typeof value === 'string') {
        if (/^\d+$/.test(value)) {
            value = toInt(value);
        } else {
            value = mom.localeData().monthsParse(value);
            // TODO: Another silent failure?
            if (!isNumber(value)) {
                return mom;
            }
        }
    }

    dayOfMonth = Math.min(mom.date(), daysInMonth(mom.year(), value));
    mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
    return mom;
}

function getSetMonth (value) {
    if (value != null) {
        setMonth(this, value);
        hooks.updateOffset(this, true);
        return this;
    } else {
        return get(this, 'Month');
    }
}

function getDaysInMonth () {
    return daysInMonth(this.year(), this.month());
}

var defaultMonthsShortRegex = matchWord;
function monthsShortRegex (isStrict) {
    if (this._monthsParseExact) {
        if (!hasOwnProp(this, '_monthsRegex')) {
            computeMonthsParse.call(this);
        }
        if (isStrict) {
            return this._monthsShortStrictRegex;
        } else {
            return this._monthsShortRegex;
        }
    } else {
        if (!hasOwnProp(this, '_monthsShortRegex')) {
            this._monthsShortRegex = defaultMonthsShortRegex;
        }
        return this._monthsShortStrictRegex && isStrict ?
            this._monthsShortStrictRegex : this._monthsShortRegex;
    }
}

var defaultMonthsRegex = matchWord;
function monthsRegex (isStrict) {
    if (this._monthsParseExact) {
        if (!hasOwnProp(this, '_monthsRegex')) {
            computeMonthsParse.call(this);
        }
        if (isStrict) {
            return this._monthsStrictRegex;
        } else {
            return this._monthsRegex;
        }
    } else {
        if (!hasOwnProp(this, '_monthsRegex')) {
            this._monthsRegex = defaultMonthsRegex;
        }
        return this._monthsStrictRegex && isStrict ?
            this._monthsStrictRegex : this._monthsRegex;
    }
}

function computeMonthsParse () {
    function cmpLenRev(a, b) {
        return b.length - a.length;
    }

    var shortPieces = [], longPieces = [], mixedPieces = [],
        i, mom;
    for (i = 0; i < 12; i++) {
        // make the regex if we don't have it already
        mom = createUTC([2000, i]);
        shortPieces.push(this.monthsShort(mom, ''));
        longPieces.push(this.months(mom, ''));
        mixedPieces.push(this.months(mom, ''));
        mixedPieces.push(this.monthsShort(mom, ''));
    }
    // Sorting makes sure if one month (or abbr) is a prefix of another it
    // will match the longer piece.
    shortPieces.sort(cmpLenRev);
    longPieces.sort(cmpLenRev);
    mixedPieces.sort(cmpLenRev);
    for (i = 0; i < 12; i++) {
        shortPieces[i] = regexEscape(shortPieces[i]);
        longPieces[i] = regexEscape(longPieces[i]);
    }
    for (i = 0; i < 24; i++) {
        mixedPieces[i] = regexEscape(mixedPieces[i]);
    }

    this._monthsRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
    this._monthsShortRegex = this._monthsRegex;
    this._monthsStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
    this._monthsShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
}

// FORMATTING

addFormatToken('Y', 0, 0, function () {
    var y = this.year();
    return y <= 9999 ? '' + y : '+' + y;
});

addFormatToken(0, ['YY', 2], 0, function () {
    return this.year() % 100;
});

addFormatToken(0, ['YYYY',   4],       0, 'year');
addFormatToken(0, ['YYYYY',  5],       0, 'year');
addFormatToken(0, ['YYYYYY', 6, true], 0, 'year');

// ALIASES

addUnitAlias('year', 'y');

// PRIORITIES

addUnitPriority('year', 1);

// PARSING

addRegexToken('Y',      matchSigned);
addRegexToken('YY',     match1to2, match2);
addRegexToken('YYYY',   match1to4, match4);
addRegexToken('YYYYY',  match1to6, match6);
addRegexToken('YYYYYY', match1to6, match6);

addParseToken(['YYYYY', 'YYYYYY'], YEAR);
addParseToken('YYYY', function (input, array) {
    array[YEAR] = input.length === 2 ? hooks.parseTwoDigitYear(input) : toInt(input);
});
addParseToken('YY', function (input, array) {
    array[YEAR] = hooks.parseTwoDigitYear(input);
});
addParseToken('Y', function (input, array) {
    array[YEAR] = parseInt(input, 10);
});

// HELPERS

function daysInYear(year) {
    return isLeapYear(year) ? 366 : 365;
}

function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// HOOKS

hooks.parseTwoDigitYear = function (input) {
    return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
};

// MOMENTS

var getSetYear = makeGetSet('FullYear', true);

function getIsLeapYear () {
    return isLeapYear(this.year());
}

function createDate (y, m, d, h, M, s, ms) {
    //can't just apply() to create a date:
    //http://stackoverflow.com/questions/181348/instantiating-a-javascript-object-by-calling-prototype-constructor-apply
    var date = new Date(y, m, d, h, M, s, ms);

    //the date constructor remaps years 0-99 to 1900-1999
    if (y < 100 && y >= 0 && isFinite(date.getFullYear())) {
        date.setFullYear(y);
    }
    return date;
}

function createUTCDate (y) {
    var date = new Date(Date.UTC.apply(null, arguments));

    //the Date.UTC function remaps years 0-99 to 1900-1999
    if (y < 100 && y >= 0 && isFinite(date.getUTCFullYear())) {
        date.setUTCFullYear(y);
    }
    return date;
}

// start-of-first-week - start-of-year
function firstWeekOffset(year, dow, doy) {
    var // first-week day -- which january is always in the first week (4 for iso, 1 for other)
        fwd = 7 + dow - doy,
        // first-week day local weekday -- which local weekday is fwd
        fwdlw = (7 + createUTCDate(year, 0, fwd).getUTCDay() - dow) % 7;

    return -fwdlw + fwd - 1;
}

//http://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
function dayOfYearFromWeeks(year, week, weekday, dow, doy) {
    var localWeekday = (7 + weekday - dow) % 7,
        weekOffset = firstWeekOffset(year, dow, doy),
        dayOfYear = 1 + 7 * (week - 1) + localWeekday + weekOffset,
        resYear, resDayOfYear;

    if (dayOfYear <= 0) {
        resYear = year - 1;
        resDayOfYear = daysInYear(resYear) + dayOfYear;
    } else if (dayOfYear > daysInYear(year)) {
        resYear = year + 1;
        resDayOfYear = dayOfYear - daysInYear(year);
    } else {
        resYear = year;
        resDayOfYear = dayOfYear;
    }

    return {
        year: resYear,
        dayOfYear: resDayOfYear
    };
}

function weekOfYear(mom, dow, doy) {
    var weekOffset = firstWeekOffset(mom.year(), dow, doy),
        week = Math.floor((mom.dayOfYear() - weekOffset - 1) / 7) + 1,
        resWeek, resYear;

    if (week < 1) {
        resYear = mom.year() - 1;
        resWeek = week + weeksInYear(resYear, dow, doy);
    } else if (week > weeksInYear(mom.year(), dow, doy)) {
        resWeek = week - weeksInYear(mom.year(), dow, doy);
        resYear = mom.year() + 1;
    } else {
        resYear = mom.year();
        resWeek = week;
    }

    return {
        week: resWeek,
        year: resYear
    };
}

function weeksInYear(year, dow, doy) {
    var weekOffset = firstWeekOffset(year, dow, doy),
        weekOffsetNext = firstWeekOffset(year + 1, dow, doy);
    return (daysInYear(year) - weekOffset + weekOffsetNext) / 7;
}

// FORMATTING

addFormatToken('w', ['ww', 2], 'wo', 'week');
addFormatToken('W', ['WW', 2], 'Wo', 'isoWeek');

// ALIASES

addUnitAlias('week', 'w');
addUnitAlias('isoWeek', 'W');

// PRIORITIES

addUnitPriority('week', 5);
addUnitPriority('isoWeek', 5);

// PARSING

addRegexToken('w',  match1to2);
addRegexToken('ww', match1to2, match2);
addRegexToken('W',  match1to2);
addRegexToken('WW', match1to2, match2);

addWeekParseToken(['w', 'ww', 'W', 'WW'], function (input, week, config, token) {
    week[token.substr(0, 1)] = toInt(input);
});

// HELPERS

// LOCALES

function localeWeek (mom) {
    return weekOfYear(mom, this._week.dow, this._week.doy).week;
}

var defaultLocaleWeek = {
    dow : 0, // Sunday is the first day of the week.
    doy : 6  // The week that contains Jan 1st is the first week of the year.
};

function localeFirstDayOfWeek () {
    return this._week.dow;
}

function localeFirstDayOfYear () {
    return this._week.doy;
}

// MOMENTS

function getSetWeek (input) {
    var week = this.localeData().week(this);
    return input == null ? week : this.add((input - week) * 7, 'd');
}

function getSetISOWeek (input) {
    var week = weekOfYear(this, 1, 4).week;
    return input == null ? week : this.add((input - week) * 7, 'd');
}

// FORMATTING

addFormatToken('d', 0, 'do', 'day');

addFormatToken('dd', 0, 0, function (format) {
    return this.localeData().weekdaysMin(this, format);
});

addFormatToken('ddd', 0, 0, function (format) {
    return this.localeData().weekdaysShort(this, format);
});

addFormatToken('dddd', 0, 0, function (format) {
    return this.localeData().weekdays(this, format);
});

addFormatToken('e', 0, 0, 'weekday');
addFormatToken('E', 0, 0, 'isoWeekday');

// ALIASES

addUnitAlias('day', 'd');
addUnitAlias('weekday', 'e');
addUnitAlias('isoWeekday', 'E');

// PRIORITY
addUnitPriority('day', 11);
addUnitPriority('weekday', 11);
addUnitPriority('isoWeekday', 11);

// PARSING

addRegexToken('d',    match1to2);
addRegexToken('e',    match1to2);
addRegexToken('E',    match1to2);
addRegexToken('dd',   function (isStrict, locale) {
    return locale.weekdaysMinRegex(isStrict);
});
addRegexToken('ddd',   function (isStrict, locale) {
    return locale.weekdaysShortRegex(isStrict);
});
addRegexToken('dddd',   function (isStrict, locale) {
    return locale.weekdaysRegex(isStrict);
});

addWeekParseToken(['dd', 'ddd', 'dddd'], function (input, week, config, token) {
    var weekday = config._locale.weekdaysParse(input, token, config._strict);
    // if we didn't get a weekday name, mark the date as invalid
    if (weekday != null) {
        week.d = weekday;
    } else {
        getParsingFlags(config).invalidWeekday = input;
    }
});

addWeekParseToken(['d', 'e', 'E'], function (input, week, config, token) {
    week[token] = toInt(input);
});

// HELPERS

function parseWeekday(input, locale) {
    if (typeof input !== 'string') {
        return input;
    }

    if (!isNaN(input)) {
        return parseInt(input, 10);
    }

    input = locale.weekdaysParse(input);
    if (typeof input === 'number') {
        return input;
    }

    return null;
}

function parseIsoWeekday(input, locale) {
    if (typeof input === 'string') {
        return locale.weekdaysParse(input) % 7 || 7;
    }
    return isNaN(input) ? null : input;
}

// LOCALES

var defaultLocaleWeekdays = 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_');
function localeWeekdays (m, format) {
    if (!m) {
        return this._weekdays;
    }
    return isArray(this._weekdays) ? this._weekdays[m.day()] :
        this._weekdays[this._weekdays.isFormat.test(format) ? 'format' : 'standalone'][m.day()];
}

var defaultLocaleWeekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_');
function localeWeekdaysShort (m) {
    return (m) ? this._weekdaysShort[m.day()] : this._weekdaysShort;
}

var defaultLocaleWeekdaysMin = 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_');
function localeWeekdaysMin (m) {
    return (m) ? this._weekdaysMin[m.day()] : this._weekdaysMin;
}

function handleStrictParse$1(weekdayName, format, strict) {
    var i, ii, mom, llc = weekdayName.toLocaleLowerCase();
    if (!this._weekdaysParse) {
        this._weekdaysParse = [];
        this._shortWeekdaysParse = [];
        this._minWeekdaysParse = [];

        for (i = 0; i < 7; ++i) {
            mom = createUTC([2000, 1]).day(i);
            this._minWeekdaysParse[i] = this.weekdaysMin(mom, '').toLocaleLowerCase();
            this._shortWeekdaysParse[i] = this.weekdaysShort(mom, '').toLocaleLowerCase();
            this._weekdaysParse[i] = this.weekdays(mom, '').toLocaleLowerCase();
        }
    }

    if (strict) {
        if (format === 'dddd') {
            ii = indexOf$1.call(this._weekdaysParse, llc);
            return ii !== -1 ? ii : null;
        } else if (format === 'ddd') {
            ii = indexOf$1.call(this._shortWeekdaysParse, llc);
            return ii !== -1 ? ii : null;
        } else {
            ii = indexOf$1.call(this._minWeekdaysParse, llc);
            return ii !== -1 ? ii : null;
        }
    } else {
        if (format === 'dddd') {
            ii = indexOf$1.call(this._weekdaysParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf$1.call(this._shortWeekdaysParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf$1.call(this._minWeekdaysParse, llc);
            return ii !== -1 ? ii : null;
        } else if (format === 'ddd') {
            ii = indexOf$1.call(this._shortWeekdaysParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf$1.call(this._weekdaysParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf$1.call(this._minWeekdaysParse, llc);
            return ii !== -1 ? ii : null;
        } else {
            ii = indexOf$1.call(this._minWeekdaysParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf$1.call(this._weekdaysParse, llc);
            if (ii !== -1) {
                return ii;
            }
            ii = indexOf$1.call(this._shortWeekdaysParse, llc);
            return ii !== -1 ? ii : null;
        }
    }
}

function localeWeekdaysParse (weekdayName, format, strict) {
    var i, mom, regex;

    if (this._weekdaysParseExact) {
        return handleStrictParse$1.call(this, weekdayName, format, strict);
    }

    if (!this._weekdaysParse) {
        this._weekdaysParse = [];
        this._minWeekdaysParse = [];
        this._shortWeekdaysParse = [];
        this._fullWeekdaysParse = [];
    }

    for (i = 0; i < 7; i++) {
        // make the regex if we don't have it already

        mom = createUTC([2000, 1]).day(i);
        if (strict && !this._fullWeekdaysParse[i]) {
            this._fullWeekdaysParse[i] = new RegExp('^' + this.weekdays(mom, '').replace('.', '\.?') + '$', 'i');
            this._shortWeekdaysParse[i] = new RegExp('^' + this.weekdaysShort(mom, '').replace('.', '\.?') + '$', 'i');
            this._minWeekdaysParse[i] = new RegExp('^' + this.weekdaysMin(mom, '').replace('.', '\.?') + '$', 'i');
        }
        if (!this._weekdaysParse[i]) {
            regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
            this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
        }
        // test the regex
        if (strict && format === 'dddd' && this._fullWeekdaysParse[i].test(weekdayName)) {
            return i;
        } else if (strict && format === 'ddd' && this._shortWeekdaysParse[i].test(weekdayName)) {
            return i;
        } else if (strict && format === 'dd' && this._minWeekdaysParse[i].test(weekdayName)) {
            return i;
        } else if (!strict && this._weekdaysParse[i].test(weekdayName)) {
            return i;
        }
    }
}

// MOMENTS

function getSetDayOfWeek (input) {
    if (!this.isValid()) {
        return input != null ? this : NaN;
    }
    var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
    if (input != null) {
        input = parseWeekday(input, this.localeData());
        return this.add(input - day, 'd');
    } else {
        return day;
    }
}

function getSetLocaleDayOfWeek (input) {
    if (!this.isValid()) {
        return input != null ? this : NaN;
    }
    var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
    return input == null ? weekday : this.add(input - weekday, 'd');
}

function getSetISODayOfWeek (input) {
    if (!this.isValid()) {
        return input != null ? this : NaN;
    }

    // behaves the same as moment#day except
    // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
    // as a setter, sunday should belong to the previous week.

    if (input != null) {
        var weekday = parseIsoWeekday(input, this.localeData());
        return this.day(this.day() % 7 ? weekday : weekday - 7);
    } else {
        return this.day() || 7;
    }
}

var defaultWeekdaysRegex = matchWord;
function weekdaysRegex (isStrict) {
    if (this._weekdaysParseExact) {
        if (!hasOwnProp(this, '_weekdaysRegex')) {
            computeWeekdaysParse.call(this);
        }
        if (isStrict) {
            return this._weekdaysStrictRegex;
        } else {
            return this._weekdaysRegex;
        }
    } else {
        if (!hasOwnProp(this, '_weekdaysRegex')) {
            this._weekdaysRegex = defaultWeekdaysRegex;
        }
        return this._weekdaysStrictRegex && isStrict ?
            this._weekdaysStrictRegex : this._weekdaysRegex;
    }
}

var defaultWeekdaysShortRegex = matchWord;
function weekdaysShortRegex (isStrict) {
    if (this._weekdaysParseExact) {
        if (!hasOwnProp(this, '_weekdaysRegex')) {
            computeWeekdaysParse.call(this);
        }
        if (isStrict) {
            return this._weekdaysShortStrictRegex;
        } else {
            return this._weekdaysShortRegex;
        }
    } else {
        if (!hasOwnProp(this, '_weekdaysShortRegex')) {
            this._weekdaysShortRegex = defaultWeekdaysShortRegex;
        }
        return this._weekdaysShortStrictRegex && isStrict ?
            this._weekdaysShortStrictRegex : this._weekdaysShortRegex;
    }
}

var defaultWeekdaysMinRegex = matchWord;
function weekdaysMinRegex (isStrict) {
    if (this._weekdaysParseExact) {
        if (!hasOwnProp(this, '_weekdaysRegex')) {
            computeWeekdaysParse.call(this);
        }
        if (isStrict) {
            return this._weekdaysMinStrictRegex;
        } else {
            return this._weekdaysMinRegex;
        }
    } else {
        if (!hasOwnProp(this, '_weekdaysMinRegex')) {
            this._weekdaysMinRegex = defaultWeekdaysMinRegex;
        }
        return this._weekdaysMinStrictRegex && isStrict ?
            this._weekdaysMinStrictRegex : this._weekdaysMinRegex;
    }
}


function computeWeekdaysParse () {
    function cmpLenRev(a, b) {
        return b.length - a.length;
    }

    var minPieces = [], shortPieces = [], longPieces = [], mixedPieces = [],
        i, mom, minp, shortp, longp;
    for (i = 0; i < 7; i++) {
        // make the regex if we don't have it already
        mom = createUTC([2000, 1]).day(i);
        minp = this.weekdaysMin(mom, '');
        shortp = this.weekdaysShort(mom, '');
        longp = this.weekdays(mom, '');
        minPieces.push(minp);
        shortPieces.push(shortp);
        longPieces.push(longp);
        mixedPieces.push(minp);
        mixedPieces.push(shortp);
        mixedPieces.push(longp);
    }
    // Sorting makes sure if one weekday (or abbr) is a prefix of another it
    // will match the longer piece.
    minPieces.sort(cmpLenRev);
    shortPieces.sort(cmpLenRev);
    longPieces.sort(cmpLenRev);
    mixedPieces.sort(cmpLenRev);
    for (i = 0; i < 7; i++) {
        shortPieces[i] = regexEscape(shortPieces[i]);
        longPieces[i] = regexEscape(longPieces[i]);
        mixedPieces[i] = regexEscape(mixedPieces[i]);
    }

    this._weekdaysRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
    this._weekdaysShortRegex = this._weekdaysRegex;
    this._weekdaysMinRegex = this._weekdaysRegex;

    this._weekdaysStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
    this._weekdaysShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
    this._weekdaysMinStrictRegex = new RegExp('^(' + minPieces.join('|') + ')', 'i');
}

// FORMATTING

function hFormat() {
    return this.hours() % 12 || 12;
}

function kFormat() {
    return this.hours() || 24;
}

addFormatToken('H', ['HH', 2], 0, 'hour');
addFormatToken('h', ['hh', 2], 0, hFormat);
addFormatToken('k', ['kk', 2], 0, kFormat);

addFormatToken('hmm', 0, 0, function () {
    return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2);
});

addFormatToken('hmmss', 0, 0, function () {
    return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2) +
        zeroFill(this.seconds(), 2);
});

addFormatToken('Hmm', 0, 0, function () {
    return '' + this.hours() + zeroFill(this.minutes(), 2);
});

addFormatToken('Hmmss', 0, 0, function () {
    return '' + this.hours() + zeroFill(this.minutes(), 2) +
        zeroFill(this.seconds(), 2);
});

function meridiem (token, lowercase) {
    addFormatToken(token, 0, 0, function () {
        return this.localeData().meridiem(this.hours(), this.minutes(), lowercase);
    });
}

meridiem('a', true);
meridiem('A', false);

// ALIASES

addUnitAlias('hour', 'h');

// PRIORITY
addUnitPriority('hour', 13);

// PARSING

function matchMeridiem (isStrict, locale) {
    return locale._meridiemParse;
}

addRegexToken('a',  matchMeridiem);
addRegexToken('A',  matchMeridiem);
addRegexToken('H',  match1to2);
addRegexToken('h',  match1to2);
addRegexToken('HH', match1to2, match2);
addRegexToken('hh', match1to2, match2);

addRegexToken('hmm', match3to4);
addRegexToken('hmmss', match5to6);
addRegexToken('Hmm', match3to4);
addRegexToken('Hmmss', match5to6);

addParseToken(['H', 'HH'], HOUR);
addParseToken(['a', 'A'], function (input, array, config) {
    config._isPm = config._locale.isPM(input);
    config._meridiem = input;
});
addParseToken(['h', 'hh'], function (input, array, config) {
    array[HOUR] = toInt(input);
    getParsingFlags(config).bigHour = true;
});
addParseToken('hmm', function (input, array, config) {
    var pos = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos));
    array[MINUTE] = toInt(input.substr(pos));
    getParsingFlags(config).bigHour = true;
});
addParseToken('hmmss', function (input, array, config) {
    var pos1 = input.length - 4;
    var pos2 = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos1));
    array[MINUTE] = toInt(input.substr(pos1, 2));
    array[SECOND] = toInt(input.substr(pos2));
    getParsingFlags(config).bigHour = true;
});
addParseToken('Hmm', function (input, array, config) {
    var pos = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos));
    array[MINUTE] = toInt(input.substr(pos));
});
addParseToken('Hmmss', function (input, array, config) {
    var pos1 = input.length - 4;
    var pos2 = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos1));
    array[MINUTE] = toInt(input.substr(pos1, 2));
    array[SECOND] = toInt(input.substr(pos2));
});

// LOCALES

function localeIsPM (input) {
    // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
    // Using charAt should be more compatible.
    return ((input + '').toLowerCase().charAt(0) === 'p');
}

var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i;
function localeMeridiem (hours, minutes, isLower) {
    if (hours > 11) {
        return isLower ? 'pm' : 'PM';
    } else {
        return isLower ? 'am' : 'AM';
    }
}


// MOMENTS

// Setting the hour should keep the time, because the user explicitly
// specified which hour he wants. So trying to maintain the same hour (in
// a new timezone) makes sense. Adding/subtracting hours does not follow
// this rule.
var getSetHour = makeGetSet('Hours', true);

// months
// week
// weekdays
// meridiem
var baseConfig = {
    calendar: defaultCalendar,
    longDateFormat: defaultLongDateFormat,
    invalidDate: defaultInvalidDate,
    ordinal: defaultOrdinal,
    ordinalParse: defaultOrdinalParse,
    relativeTime: defaultRelativeTime,

    months: defaultLocaleMonths,
    monthsShort: defaultLocaleMonthsShort,

    week: defaultLocaleWeek,

    weekdays: defaultLocaleWeekdays,
    weekdaysMin: defaultLocaleWeekdaysMin,
    weekdaysShort: defaultLocaleWeekdaysShort,

    meridiemParse: defaultLocaleMeridiemParse
};

// internal storage for locale config files
var locales = {};
var localeFamilies = {};
var globalLocale;

function normalizeLocale(key) {
    return key ? key.toLowerCase().replace('_', '-') : key;
}

// pick the locale from the array
// try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
// substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
function chooseLocale(names) {
    var i = 0, j, next, locale, split;

    while (i < names.length) {
        split = normalizeLocale(names[i]).split('-');
        j = split.length;
        next = normalizeLocale(names[i + 1]);
        next = next ? next.split('-') : null;
        while (j > 0) {
            locale = loadLocale(split.slice(0, j).join('-'));
            if (locale) {
                return locale;
            }
            if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                //the next array item is better than a shallower substring of this one
                break;
            }
            j--;
        }
        i++;
    }
    return null;
}

function loadLocale(name) {
    var oldLocale = null;
    // TODO: Find a better way to register and load all the locales in Node
    if (!locales[name] && (typeof module !== 'undefined') &&
            module && module.exports) {
        try {
            oldLocale = globalLocale._abbr;
            require('./locale/' + name);
            // because defineLocale currently also sets the global locale, we
            // want to undo that for lazy loaded locales
            getSetGlobalLocale(oldLocale);
        } catch (e) { }
    }
    return locales[name];
}

// This function will load locale and then set the global locale.  If
// no arguments are passed in, it will simply return the current global
// locale key.
function getSetGlobalLocale (key, values) {
    var data;
    if (key) {
        if (isUndefined(values)) {
            data = getLocale(key);
        }
        else {
            data = defineLocale(key, values);
        }

        if (data) {
            // moment.duration._locale = moment._locale = data;
            globalLocale = data;
        }
    }

    return globalLocale._abbr;
}

function defineLocale (name, config) {
    if (config !== null) {
        var parentConfig = baseConfig;
        config.abbr = name;
        if (locales[name] != null) {
            deprecateSimple('defineLocaleOverride',
                    'use moment.updateLocale(localeName, config) to change ' +
                    'an existing locale. moment.defineLocale(localeName, ' +
                    'config) should only be used for creating a new locale ' +
                    'See http://momentjs.com/guides/#/warnings/define-locale/ for more info.');
            parentConfig = locales[name]._config;
        } else if (config.parentLocale != null) {
            if (locales[config.parentLocale] != null) {
                parentConfig = locales[config.parentLocale]._config;
            } else {
                if (!localeFamilies[config.parentLocale]) {
                    localeFamilies[config.parentLocale] = [];
                }
                localeFamilies[config.parentLocale].push({
                    name: name,
                    config: config
                });
                return null;
            }
        }
        locales[name] = new Locale(mergeConfigs(parentConfig, config));

        if (localeFamilies[name]) {
            localeFamilies[name].forEach(function (x) {
                defineLocale(x.name, x.config);
            });
        }

        // backwards compat for now: also set the locale
        // make sure we set the locale AFTER all child locales have been
        // created, so we won't end up with the child locale set.
        getSetGlobalLocale(name);


        return locales[name];
    } else {
        // useful for testing
        delete locales[name];
        return null;
    }
}

function updateLocale(name, config) {
    if (config != null) {
        var locale, parentConfig = baseConfig;
        // MERGE
        if (locales[name] != null) {
            parentConfig = locales[name]._config;
        }
        config = mergeConfigs(parentConfig, config);
        locale = new Locale(config);
        locale.parentLocale = locales[name];
        locales[name] = locale;

        // backwards compat for now: also set the locale
        getSetGlobalLocale(name);
    } else {
        // pass null for config to unupdate, useful for tests
        if (locales[name] != null) {
            if (locales[name].parentLocale != null) {
                locales[name] = locales[name].parentLocale;
            } else if (locales[name] != null) {
                delete locales[name];
            }
        }
    }
    return locales[name];
}

// returns locale data
function getLocale (key) {
    var locale;

    if (key && key._locale && key._locale._abbr) {
        key = key._locale._abbr;
    }

    if (!key) {
        return globalLocale;
    }

    if (!isArray(key)) {
        //short-circuit everything else
        locale = loadLocale(key);
        if (locale) {
            return locale;
        }
        key = [key];
    }

    return chooseLocale(key);
}

function listLocales() {
    return keys$1(locales);
}

function checkOverflow (m) {
    var overflow;
    var a = m._a;

    if (a && getParsingFlags(m).overflow === -2) {
        overflow =
            a[MONTH]       < 0 || a[MONTH]       > 11  ? MONTH :
            a[DATE]        < 1 || a[DATE]        > daysInMonth(a[YEAR], a[MONTH]) ? DATE :
            a[HOUR]        < 0 || a[HOUR]        > 24 || (a[HOUR] === 24 && (a[MINUTE] !== 0 || a[SECOND] !== 0 || a[MILLISECOND] !== 0)) ? HOUR :
            a[MINUTE]      < 0 || a[MINUTE]      > 59  ? MINUTE :
            a[SECOND]      < 0 || a[SECOND]      > 59  ? SECOND :
            a[MILLISECOND] < 0 || a[MILLISECOND] > 999 ? MILLISECOND :
            -1;

        if (getParsingFlags(m)._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
            overflow = DATE;
        }
        if (getParsingFlags(m)._overflowWeeks && overflow === -1) {
            overflow = WEEK;
        }
        if (getParsingFlags(m)._overflowWeekday && overflow === -1) {
            overflow = WEEKDAY;
        }

        getParsingFlags(m).overflow = overflow;
    }

    return m;
}

// iso 8601 regex
// 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
var extendedIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;
var basicIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;

var tzRegex = /Z|[+-]\d\d(?::?\d\d)?/;

var isoDates = [
    ['YYYYYY-MM-DD', /[+-]\d{6}-\d\d-\d\d/],
    ['YYYY-MM-DD', /\d{4}-\d\d-\d\d/],
    ['GGGG-[W]WW-E', /\d{4}-W\d\d-\d/],
    ['GGGG-[W]WW', /\d{4}-W\d\d/, false],
    ['YYYY-DDD', /\d{4}-\d{3}/],
    ['YYYY-MM', /\d{4}-\d\d/, false],
    ['YYYYYYMMDD', /[+-]\d{10}/],
    ['YYYYMMDD', /\d{8}/],
    // YYYYMM is NOT allowed by the standard
    ['GGGG[W]WWE', /\d{4}W\d{3}/],
    ['GGGG[W]WW', /\d{4}W\d{2}/, false],
    ['YYYYDDD', /\d{7}/]
];

// iso time formats and regexes
var isoTimes = [
    ['HH:mm:ss.SSSS', /\d\d:\d\d:\d\d\.\d+/],
    ['HH:mm:ss,SSSS', /\d\d:\d\d:\d\d,\d+/],
    ['HH:mm:ss', /\d\d:\d\d:\d\d/],
    ['HH:mm', /\d\d:\d\d/],
    ['HHmmss.SSSS', /\d\d\d\d\d\d\.\d+/],
    ['HHmmss,SSSS', /\d\d\d\d\d\d,\d+/],
    ['HHmmss', /\d\d\d\d\d\d/],
    ['HHmm', /\d\d\d\d/],
    ['HH', /\d\d/]
];

var aspNetJsonRegex = /^\/?Date\((\-?\d+)/i;

// date from iso format
function configFromISO(config) {
    var i, l,
        string = config._i,
        match = extendedIsoRegex.exec(string) || basicIsoRegex.exec(string),
        allowTime, dateFormat, timeFormat, tzFormat;

    if (match) {
        getParsingFlags(config).iso = true;

        for (i = 0, l = isoDates.length; i < l; i++) {
            if (isoDates[i][1].exec(match[1])) {
                dateFormat = isoDates[i][0];
                allowTime = isoDates[i][2] !== false;
                break;
            }
        }
        if (dateFormat == null) {
            config._isValid = false;
            return;
        }
        if (match[3]) {
            for (i = 0, l = isoTimes.length; i < l; i++) {
                if (isoTimes[i][1].exec(match[3])) {
                    // match[2] should be 'T' or space
                    timeFormat = (match[2] || ' ') + isoTimes[i][0];
                    break;
                }
            }
            if (timeFormat == null) {
                config._isValid = false;
                return;
            }
        }
        if (!allowTime && timeFormat != null) {
            config._isValid = false;
            return;
        }
        if (match[4]) {
            if (tzRegex.exec(match[4])) {
                tzFormat = 'Z';
            } else {
                config._isValid = false;
                return;
            }
        }
        config._f = dateFormat + (timeFormat || '') + (tzFormat || '');
        configFromStringAndFormat(config);
    } else {
        config._isValid = false;
    }
}

// date from iso format or fallback
function configFromString(config) {
    var matched = aspNetJsonRegex.exec(config._i);

    if (matched !== null) {
        config._d = new Date(+matched[1]);
        return;
    }

    configFromISO(config);
    if (config._isValid === false) {
        delete config._isValid;
        hooks.createFromInputFallback(config);
    }
}

hooks.createFromInputFallback = deprecate(
    'value provided is not in a recognized ISO format. moment construction falls back to js Date(), ' +
    'which is not reliable across all browsers and versions. Non ISO date formats are ' +
    'discouraged and will be removed in an upcoming major release. Please refer to ' +
    'http://momentjs.com/guides/#/warnings/js-date/ for more info.',
    function (config) {
        config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
    }
);

// Pick the first defined of two or three arguments.
function defaults(a, b, c) {
    if (a != null) {
        return a;
    }
    if (b != null) {
        return b;
    }
    return c;
}

function currentDateArray(config) {
    // hooks is actually the exported moment object
    var nowValue = new Date(hooks.now());
    if (config._useUTC) {
        return [nowValue.getUTCFullYear(), nowValue.getUTCMonth(), nowValue.getUTCDate()];
    }
    return [nowValue.getFullYear(), nowValue.getMonth(), nowValue.getDate()];
}

// convert an array to a date.
// the array should mirror the parameters below
// note: all values past the year are optional and will default to the lowest possible value.
// [year, month, day , hour, minute, second, millisecond]
function configFromArray (config) {
    var i, date, input = [], currentDate, yearToUse;

    if (config._d) {
        return;
    }

    currentDate = currentDateArray(config);

    //compute day of the year from weeks and weekdays
    if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
        dayOfYearFromWeekInfo(config);
    }

    //if the day of the year is set, figure out what it is
    if (config._dayOfYear) {
        yearToUse = defaults(config._a[YEAR], currentDate[YEAR]);

        if (config._dayOfYear > daysInYear(yearToUse)) {
            getParsingFlags(config)._overflowDayOfYear = true;
        }

        date = createUTCDate(yearToUse, 0, config._dayOfYear);
        config._a[MONTH] = date.getUTCMonth();
        config._a[DATE] = date.getUTCDate();
    }

    // Default to current date.
    // * if no year, month, day of month are given, default to today
    // * if day of month is given, default month and year
    // * if month is given, default only year
    // * if year is given, don't default anything
    for (i = 0; i < 3 && config._a[i] == null; ++i) {
        config._a[i] = input[i] = currentDate[i];
    }

    // Zero out whatever was not defaulted, including time
    for (; i < 7; i++) {
        config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
    }

    // Check for 24:00:00.000
    if (config._a[HOUR] === 24 &&
            config._a[MINUTE] === 0 &&
            config._a[SECOND] === 0 &&
            config._a[MILLISECOND] === 0) {
        config._nextDay = true;
        config._a[HOUR] = 0;
    }

    config._d = (config._useUTC ? createUTCDate : createDate).apply(null, input);
    // Apply timezone offset from input. The actual utcOffset can be changed
    // with parseZone.
    if (config._tzm != null) {
        config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
    }

    if (config._nextDay) {
        config._a[HOUR] = 24;
    }
}

function dayOfYearFromWeekInfo(config) {
    var w, weekYear, week, weekday, dow, doy, temp, weekdayOverflow;

    w = config._w;
    if (w.GG != null || w.W != null || w.E != null) {
        dow = 1;
        doy = 4;

        // TODO: We need to take the current isoWeekYear, but that depends on
        // how we interpret now (local, utc, fixed offset). So create
        // a now version of current config (take local/utc/offset flags, and
        // create now).
        weekYear = defaults(w.GG, config._a[YEAR], weekOfYear(createLocal(), 1, 4).year);
        week = defaults(w.W, 1);
        weekday = defaults(w.E, 1);
        if (weekday < 1 || weekday > 7) {
            weekdayOverflow = true;
        }
    } else {
        dow = config._locale._week.dow;
        doy = config._locale._week.doy;

        var curWeek = weekOfYear(createLocal(), dow, doy);

        weekYear = defaults(w.gg, config._a[YEAR], curWeek.year);

        // Default to current week.
        week = defaults(w.w, curWeek.week);

        if (w.d != null) {
            // weekday -- low day numbers are considered next week
            weekday = w.d;
            if (weekday < 0 || weekday > 6) {
                weekdayOverflow = true;
            }
        } else if (w.e != null) {
            // local weekday -- counting starts from begining of week
            weekday = w.e + dow;
            if (w.e < 0 || w.e > 6) {
                weekdayOverflow = true;
            }
        } else {
            // default to begining of week
            weekday = dow;
        }
    }
    if (week < 1 || week > weeksInYear(weekYear, dow, doy)) {
        getParsingFlags(config)._overflowWeeks = true;
    } else if (weekdayOverflow != null) {
        getParsingFlags(config)._overflowWeekday = true;
    } else {
        temp = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy);
        config._a[YEAR] = temp.year;
        config._dayOfYear = temp.dayOfYear;
    }
}

// constant that refers to the ISO standard
hooks.ISO_8601 = function () {};

// date from string and format string
function configFromStringAndFormat(config) {
    // TODO: Move this to another part of the creation flow to prevent circular deps
    if (config._f === hooks.ISO_8601) {
        configFromISO(config);
        return;
    }

    config._a = [];
    getParsingFlags(config).empty = true;

    // This array is used to make a Date, either with `new Date` or `Date.UTC`
    var string = '' + config._i,
        i, parsedInput, tokens, token, skipped,
        stringLength = string.length,
        totalParsedInputLength = 0;

    tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];

    for (i = 0; i < tokens.length; i++) {
        token = tokens[i];
        parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
        // console.log('token', token, 'parsedInput', parsedInput,
        //         'regex', getParseRegexForToken(token, config));
        if (parsedInput) {
            skipped = string.substr(0, string.indexOf(parsedInput));
            if (skipped.length > 0) {
                getParsingFlags(config).unusedInput.push(skipped);
            }
            string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
            totalParsedInputLength += parsedInput.length;
        }
        // don't parse if it's not a known token
        if (formatTokenFunctions[token]) {
            if (parsedInput) {
                getParsingFlags(config).empty = false;
            }
            else {
                getParsingFlags(config).unusedTokens.push(token);
            }
            addTimeToArrayFromToken(token, parsedInput, config);
        }
        else if (config._strict && !parsedInput) {
            getParsingFlags(config).unusedTokens.push(token);
        }
    }

    // add remaining unparsed input length to the string
    getParsingFlags(config).charsLeftOver = stringLength - totalParsedInputLength;
    if (string.length > 0) {
        getParsingFlags(config).unusedInput.push(string);
    }

    // clear _12h flag if hour is <= 12
    if (config._a[HOUR] <= 12 &&
        getParsingFlags(config).bigHour === true &&
        config._a[HOUR] > 0) {
        getParsingFlags(config).bigHour = undefined;
    }

    getParsingFlags(config).parsedDateParts = config._a.slice(0);
    getParsingFlags(config).meridiem = config._meridiem;
    // handle meridiem
    config._a[HOUR] = meridiemFixWrap(config._locale, config._a[HOUR], config._meridiem);

    configFromArray(config);
    checkOverflow(config);
}


function meridiemFixWrap (locale, hour, meridiem) {
    var isPm;

    if (meridiem == null) {
        // nothing to do
        return hour;
    }
    if (locale.meridiemHour != null) {
        return locale.meridiemHour(hour, meridiem);
    } else if (locale.isPM != null) {
        // Fallback
        isPm = locale.isPM(meridiem);
        if (isPm && hour < 12) {
            hour += 12;
        }
        if (!isPm && hour === 12) {
            hour = 0;
        }
        return hour;
    } else {
        // this is not supposed to happen
        return hour;
    }
}

// date from string and array of format strings
function configFromStringAndArray(config) {
    var tempConfig,
        bestMoment,

        scoreToBeat,
        i,
        currentScore;

    if (config._f.length === 0) {
        getParsingFlags(config).invalidFormat = true;
        config._d = new Date(NaN);
        return;
    }

    for (i = 0; i < config._f.length; i++) {
        currentScore = 0;
        tempConfig = copyConfig({}, config);
        if (config._useUTC != null) {
            tempConfig._useUTC = config._useUTC;
        }
        tempConfig._f = config._f[i];
        configFromStringAndFormat(tempConfig);

        if (!isValid(tempConfig)) {
            continue;
        }

        // if there is any input that was not parsed add a penalty for that format
        currentScore += getParsingFlags(tempConfig).charsLeftOver;

        //or tokens
        currentScore += getParsingFlags(tempConfig).unusedTokens.length * 10;

        getParsingFlags(tempConfig).score = currentScore;

        if (scoreToBeat == null || currentScore < scoreToBeat) {
            scoreToBeat = currentScore;
            bestMoment = tempConfig;
        }
    }

    extend(config, bestMoment || tempConfig);
}

function configFromObject(config) {
    if (config._d) {
        return;
    }

    var i = normalizeObjectUnits(config._i);
    config._a = map([i.year, i.month, i.day || i.date, i.hour, i.minute, i.second, i.millisecond], function (obj) {
        return obj && parseInt(obj, 10);
    });

    configFromArray(config);
}

function createFromConfig (config) {
    var res = new Moment(checkOverflow(prepareConfig(config)));
    if (res._nextDay) {
        // Adding is smart enough around DST
        res.add(1, 'd');
        res._nextDay = undefined;
    }

    return res;
}

function prepareConfig (config) {
    var input = config._i,
        format = config._f;

    config._locale = config._locale || getLocale(config._l);

    if (input === null || (format === undefined && input === '')) {
        return createInvalid({nullInput: true});
    }

    if (typeof input === 'string') {
        config._i = input = config._locale.preparse(input);
    }

    if (isMoment(input)) {
        return new Moment(checkOverflow(input));
    } else if (isDate(input)) {
        config._d = input;
    } else if (isArray(format)) {
        configFromStringAndArray(config);
    } else if (format) {
        configFromStringAndFormat(config);
    }  else {
        configFromInput(config);
    }

    if (!isValid(config)) {
        config._d = null;
    }

    return config;
}

function configFromInput(config) {
    var input = config._i;
    if (input === undefined) {
        config._d = new Date(hooks.now());
    } else if (isDate(input)) {
        config._d = new Date(input.valueOf());
    } else if (typeof input === 'string') {
        configFromString(config);
    } else if (isArray(input)) {
        config._a = map(input.slice(0), function (obj) {
            return parseInt(obj, 10);
        });
        configFromArray(config);
    } else if (typeof(input) === 'object') {
        configFromObject(config);
    } else if (isNumber(input)) {
        // from milliseconds
        config._d = new Date(input);
    } else {
        hooks.createFromInputFallback(config);
    }
}

function createLocalOrUTC (input, format, locale, strict, isUTC) {
    var c = {};

    if (locale === true || locale === false) {
        strict = locale;
        locale = undefined;
    }

    if ((isObject(input) && isObjectEmpty(input)) ||
            (isArray(input) && input.length === 0)) {
        input = undefined;
    }
    // object construction must be done this way.
    // https://github.com/moment/moment/issues/1423
    c._isAMomentObject = true;
    c._useUTC = c._isUTC = isUTC;
    c._l = locale;
    c._i = input;
    c._f = format;
    c._strict = strict;

    return createFromConfig(c);
}

function createLocal (input, format, locale, strict) {
    return createLocalOrUTC(input, format, locale, strict, false);
}

var prototypeMin = deprecate(
    'moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/',
    function () {
        var other = createLocal.apply(null, arguments);
        if (this.isValid() && other.isValid()) {
            return other < this ? this : other;
        } else {
            return createInvalid();
        }
    }
);

var prototypeMax = deprecate(
    'moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/',
    function () {
        var other = createLocal.apply(null, arguments);
        if (this.isValid() && other.isValid()) {
            return other > this ? this : other;
        } else {
            return createInvalid();
        }
    }
);

// Pick a moment m from moments so that m[fn](other) is true for all
// other. This relies on the function fn to be transitive.
//
// moments should either be an array of moment objects or an array, whose
// first element is an array of moment objects.
function pickBy(fn, moments) {
    var res, i;
    if (moments.length === 1 && isArray(moments[0])) {
        moments = moments[0];
    }
    if (!moments.length) {
        return createLocal();
    }
    res = moments[0];
    for (i = 1; i < moments.length; ++i) {
        if (!moments[i].isValid() || moments[i][fn](res)) {
            res = moments[i];
        }
    }
    return res;
}

// TODO: Use [].sort instead?
function min () {
    var args = [].slice.call(arguments, 0);

    return pickBy('isBefore', args);
}

function max () {
    var args = [].slice.call(arguments, 0);

    return pickBy('isAfter', args);
}

var now = function () {
    return Date.now ? Date.now() : +(new Date());
};

function Duration (duration) {
    var normalizedInput = normalizeObjectUnits(duration),
        years = normalizedInput.year || 0,
        quarters = normalizedInput.quarter || 0,
        months = normalizedInput.month || 0,
        weeks = normalizedInput.week || 0,
        days = normalizedInput.day || 0,
        hours = normalizedInput.hour || 0,
        minutes = normalizedInput.minute || 0,
        seconds = normalizedInput.second || 0,
        milliseconds = normalizedInput.millisecond || 0;

    // representation for dateAddRemove
    this._milliseconds = +milliseconds +
        seconds * 1e3 + // 1000
        minutes * 6e4 + // 1000 * 60
        hours * 1000 * 60 * 60; //using 1000 * 60 * 60 instead of 36e5 to avoid floating point rounding errors https://github.com/moment/moment/issues/2978
    // Because of dateAddRemove treats 24 hours as different from a
    // day when working around DST, we need to store them separately
    this._days = +days +
        weeks * 7;
    // It is impossible translate months into days without knowing
    // which months you are are talking about, so we have to store
    // it separately.
    this._months = +months +
        quarters * 3 +
        years * 12;

    this._data = {};

    this._locale = getLocale();

    this._bubble();
}

function isDuration (obj) {
    return obj instanceof Duration;
}

function absRound (number) {
    if (number < 0) {
        return Math.round(-1 * number) * -1;
    } else {
        return Math.round(number);
    }
}

// FORMATTING

function offset (token, separator) {
    addFormatToken(token, 0, 0, function () {
        var offset = this.utcOffset();
        var sign = '+';
        if (offset < 0) {
            offset = -offset;
            sign = '-';
        }
        return sign + zeroFill(~~(offset / 60), 2) + separator + zeroFill(~~(offset) % 60, 2);
    });
}

offset('Z', ':');
offset('ZZ', '');

// PARSING

addRegexToken('Z',  matchShortOffset);
addRegexToken('ZZ', matchShortOffset);
addParseToken(['Z', 'ZZ'], function (input, array, config) {
    config._useUTC = true;
    config._tzm = offsetFromString(matchShortOffset, input);
});

// HELPERS

// timezone chunker
// '+10:00' > ['10',  '00']
// '-1530'  > ['-15', '30']
var chunkOffset = /([\+\-]|\d\d)/gi;

function offsetFromString(matcher, string) {
    var matches = (string || '').match(matcher);

    if (matches === null) {
        return null;
    }

    var chunk   = matches[matches.length - 1] || [];
    var parts   = (chunk + '').match(chunkOffset) || ['-', 0, 0];
    var minutes = +(parts[1] * 60) + toInt(parts[2]);

    return minutes === 0 ?
      0 :
      parts[0] === '+' ? minutes : -minutes;
}

// Return a moment from input, that is local/utc/zone equivalent to model.
function cloneWithOffset(input, model) {
    var res, diff;
    if (model._isUTC) {
        res = model.clone();
        diff = (isMoment(input) || isDate(input) ? input.valueOf() : createLocal(input).valueOf()) - res.valueOf();
        // Use low-level api, because this fn is low-level api.
        res._d.setTime(res._d.valueOf() + diff);
        hooks.updateOffset(res, false);
        return res;
    } else {
        return createLocal(input).local();
    }
}

function getDateOffset (m) {
    // On Firefox.24 Date#getTimezoneOffset returns a floating point.
    // https://github.com/moment/moment/pull/1871
    return -Math.round(m._d.getTimezoneOffset() / 15) * 15;
}

// HOOKS

// This function will be called whenever a moment is mutated.
// It is intended to keep the offset in sync with the timezone.
hooks.updateOffset = function () {};

// MOMENTS

// keepLocalTime = true means only change the timezone, without
// affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
// 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
// +0200, so we adjust the time as needed, to be valid.
//
// Keeping the time actually adds/subtracts (one hour)
// from the actual represented time. That is why we call updateOffset
// a second time. In case it wants us to change the offset again
// _changeInProgress == true case, then we have to adjust, because
// there is no such time in the given timezone.
function getSetOffset (input, keepLocalTime) {
    var offset = this._offset || 0,
        localAdjust;
    if (!this.isValid()) {
        return input != null ? this : NaN;
    }
    if (input != null) {
        if (typeof input === 'string') {
            input = offsetFromString(matchShortOffset, input);
            if (input === null) {
                return this;
            }
        } else if (Math.abs(input) < 16) {
            input = input * 60;
        }
        if (!this._isUTC && keepLocalTime) {
            localAdjust = getDateOffset(this);
        }
        this._offset = input;
        this._isUTC = true;
        if (localAdjust != null) {
            this.add(localAdjust, 'm');
        }
        if (offset !== input) {
            if (!keepLocalTime || this._changeInProgress) {
                addSubtract(this, createDuration(input - offset, 'm'), 1, false);
            } else if (!this._changeInProgress) {
                this._changeInProgress = true;
                hooks.updateOffset(this, true);
                this._changeInProgress = null;
            }
        }
        return this;
    } else {
        return this._isUTC ? offset : getDateOffset(this);
    }
}

function getSetZone (input, keepLocalTime) {
    if (input != null) {
        if (typeof input !== 'string') {
            input = -input;
        }

        this.utcOffset(input, keepLocalTime);

        return this;
    } else {
        return -this.utcOffset();
    }
}

function setOffsetToUTC (keepLocalTime) {
    return this.utcOffset(0, keepLocalTime);
}

function setOffsetToLocal (keepLocalTime) {
    if (this._isUTC) {
        this.utcOffset(0, keepLocalTime);
        this._isUTC = false;

        if (keepLocalTime) {
            this.subtract(getDateOffset(this), 'm');
        }
    }
    return this;
}

function setOffsetToParsedOffset () {
    if (this._tzm != null) {
        this.utcOffset(this._tzm);
    } else if (typeof this._i === 'string') {
        var tZone = offsetFromString(matchOffset, this._i);
        if (tZone != null) {
            this.utcOffset(tZone);
        }
        else {
            this.utcOffset(0, true);
        }
    }
    return this;
}

function hasAlignedHourOffset (input) {
    if (!this.isValid()) {
        return false;
    }
    input = input ? createLocal(input).utcOffset() : 0;

    return (this.utcOffset() - input) % 60 === 0;
}

function isDaylightSavingTime () {
    return (
        this.utcOffset() > this.clone().month(0).utcOffset() ||
        this.utcOffset() > this.clone().month(5).utcOffset()
    );
}

function isDaylightSavingTimeShifted () {
    if (!isUndefined(this._isDSTShifted)) {
        return this._isDSTShifted;
    }

    var c = {};

    copyConfig(c, this);
    c = prepareConfig(c);

    if (c._a) {
        var other = c._isUTC ? createUTC(c._a) : createLocal(c._a);
        this._isDSTShifted = this.isValid() &&
            compareArrays(c._a, other.toArray()) > 0;
    } else {
        this._isDSTShifted = false;
    }

    return this._isDSTShifted;
}

function isLocal () {
    return this.isValid() ? !this._isUTC : false;
}

function isUtcOffset () {
    return this.isValid() ? this._isUTC : false;
}

function isUtc () {
    return this.isValid() ? this._isUTC && this._offset === 0 : false;
}

// ASP.NET json date format regex
var aspNetRegex = /^(\-)?(?:(\d*)[. ])?(\d+)\:(\d+)(?:\:(\d+)(\.\d*)?)?$/;

// from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
// somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
// and further modified to allow for strings containing both week and day
var isoRegex = /^(-)?P(?:(-?[0-9,.]*)Y)?(?:(-?[0-9,.]*)M)?(?:(-?[0-9,.]*)W)?(?:(-?[0-9,.]*)D)?(?:T(?:(-?[0-9,.]*)H)?(?:(-?[0-9,.]*)M)?(?:(-?[0-9,.]*)S)?)?$/;

function createDuration (input, key) {
    var duration = input,
        // matching against regexp is expensive, do it on demand
        match = null,
        sign,
        ret,
        diffRes;

    if (isDuration(input)) {
        duration = {
            ms : input._milliseconds,
            d  : input._days,
            M  : input._months
        };
    } else if (isNumber(input)) {
        duration = {};
        if (key) {
            duration[key] = input;
        } else {
            duration.milliseconds = input;
        }
    } else if (!!(match = aspNetRegex.exec(input))) {
        sign = (match[1] === '-') ? -1 : 1;
        duration = {
            y  : 0,
            d  : toInt(match[DATE])                         * sign,
            h  : toInt(match[HOUR])                         * sign,
            m  : toInt(match[MINUTE])                       * sign,
            s  : toInt(match[SECOND])                       * sign,
            ms : toInt(absRound(match[MILLISECOND] * 1000)) * sign // the millisecond decimal point is included in the match
        };
    } else if (!!(match = isoRegex.exec(input))) {
        sign = (match[1] === '-') ? -1 : 1;
        duration = {
            y : parseIso(match[2], sign),
            M : parseIso(match[3], sign),
            w : parseIso(match[4], sign),
            d : parseIso(match[5], sign),
            h : parseIso(match[6], sign),
            m : parseIso(match[7], sign),
            s : parseIso(match[8], sign)
        };
    } else if (duration == null) {// checks for null or undefined
        duration = {};
    } else if (typeof duration === 'object' && ('from' in duration || 'to' in duration)) {
        diffRes = momentsDifference(createLocal(duration.from), createLocal(duration.to));

        duration = {};
        duration.ms = diffRes.milliseconds;
        duration.M = diffRes.months;
    }

    ret = new Duration(duration);

    if (isDuration(input) && hasOwnProp(input, '_locale')) {
        ret._locale = input._locale;
    }

    return ret;
}

createDuration.fn = Duration.prototype;

function parseIso (inp, sign) {
    // We'd normally use ~~inp for this, but unfortunately it also
    // converts floats to ints.
    // inp may be undefined, so careful calling replace on it.
    var res = inp && parseFloat(inp.replace(',', '.'));
    // apply sign while we're at it
    return (isNaN(res) ? 0 : res) * sign;
}

function positiveMomentsDifference(base, other) {
    var res = {milliseconds: 0, months: 0};

    res.months = other.month() - base.month() +
        (other.year() - base.year()) * 12;
    if (base.clone().add(res.months, 'M').isAfter(other)) {
        --res.months;
    }

    res.milliseconds = +other - +(base.clone().add(res.months, 'M'));

    return res;
}

function momentsDifference(base, other) {
    var res;
    if (!(base.isValid() && other.isValid())) {
        return {milliseconds: 0, months: 0};
    }

    other = cloneWithOffset(other, base);
    if (base.isBefore(other)) {
        res = positiveMomentsDifference(base, other);
    } else {
        res = positiveMomentsDifference(other, base);
        res.milliseconds = -res.milliseconds;
        res.months = -res.months;
    }

    return res;
}

// TODO: remove 'name' arg after deprecation is removed
function createAdder(direction, name) {
    return function (val, period) {
        var dur, tmp;
        //invert the arguments, but complain about it
        if (period !== null && !isNaN(+period)) {
            deprecateSimple(name, 'moment().' + name  + '(period, number) is deprecated. Please use moment().' + name + '(number, period). ' +
            'See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.');
            tmp = val; val = period; period = tmp;
        }

        val = typeof val === 'string' ? +val : val;
        dur = createDuration(val, period);
        addSubtract(this, dur, direction);
        return this;
    };
}

function addSubtract (mom, duration, isAdding, updateOffset) {
    var milliseconds = duration._milliseconds,
        days = absRound(duration._days),
        months = absRound(duration._months);

    if (!mom.isValid()) {
        // No op
        return;
    }

    updateOffset = updateOffset == null ? true : updateOffset;

    if (milliseconds) {
        mom._d.setTime(mom._d.valueOf() + milliseconds * isAdding);
    }
    if (days) {
        set$1(mom, 'Date', get(mom, 'Date') + days * isAdding);
    }
    if (months) {
        setMonth(mom, get(mom, 'Month') + months * isAdding);
    }
    if (updateOffset) {
        hooks.updateOffset(mom, days || months);
    }
}

var add      = createAdder(1, 'add');
var subtract = createAdder(-1, 'subtract');

function getCalendarFormat(myMoment, now) {
    var diff = myMoment.diff(now, 'days', true);
    return diff < -6 ? 'sameElse' :
            diff < -1 ? 'lastWeek' :
            diff < 0 ? 'lastDay' :
            diff < 1 ? 'sameDay' :
            diff < 2 ? 'nextDay' :
            diff < 7 ? 'nextWeek' : 'sameElse';
}

function calendar$1 (time, formats) {
    // We want to compare the start of today, vs this.
    // Getting start-of-today depends on whether we're local/utc/offset or not.
    var now = time || createLocal(),
        sod = cloneWithOffset(now, this).startOf('day'),
        format = hooks.calendarFormat(this, sod) || 'sameElse';

    var output = formats && (isFunction(formats[format]) ? formats[format].call(this, now) : formats[format]);

    return this.format(output || this.localeData().calendar(format, this, createLocal(now)));
}

function clone () {
    return new Moment(this);
}

function isAfter (input, units) {
    var localInput = isMoment(input) ? input : createLocal(input);
    if (!(this.isValid() && localInput.isValid())) {
        return false;
    }
    units = normalizeUnits(!isUndefined(units) ? units : 'millisecond');
    if (units === 'millisecond') {
        return this.valueOf() > localInput.valueOf();
    } else {
        return localInput.valueOf() < this.clone().startOf(units).valueOf();
    }
}

function isBefore (input, units) {
    var localInput = isMoment(input) ? input : createLocal(input);
    if (!(this.isValid() && localInput.isValid())) {
        return false;
    }
    units = normalizeUnits(!isUndefined(units) ? units : 'millisecond');
    if (units === 'millisecond') {
        return this.valueOf() < localInput.valueOf();
    } else {
        return this.clone().endOf(units).valueOf() < localInput.valueOf();
    }
}

function isBetween (from, to, units, inclusivity) {
    inclusivity = inclusivity || '()';
    return (inclusivity[0] === '(' ? this.isAfter(from, units) : !this.isBefore(from, units)) &&
        (inclusivity[1] === ')' ? this.isBefore(to, units) : !this.isAfter(to, units));
}

function isSame (input, units) {
    var localInput = isMoment(input) ? input : createLocal(input),
        inputMs;
    if (!(this.isValid() && localInput.isValid())) {
        return false;
    }
    units = normalizeUnits(units || 'millisecond');
    if (units === 'millisecond') {
        return this.valueOf() === localInput.valueOf();
    } else {
        inputMs = localInput.valueOf();
        return this.clone().startOf(units).valueOf() <= inputMs && inputMs <= this.clone().endOf(units).valueOf();
    }
}

function isSameOrAfter (input, units) {
    return this.isSame(input, units) || this.isAfter(input,units);
}

function isSameOrBefore (input, units) {
    return this.isSame(input, units) || this.isBefore(input,units);
}

function diff (input, units, asFloat) {
    var that,
        zoneDelta,
        delta, output;

    if (!this.isValid()) {
        return NaN;
    }

    that = cloneWithOffset(input, this);

    if (!that.isValid()) {
        return NaN;
    }

    zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4;

    units = normalizeUnits(units);

    if (units === 'year' || units === 'month' || units === 'quarter') {
        output = monthDiff(this, that);
        if (units === 'quarter') {
            output = output / 3;
        } else if (units === 'year') {
            output = output / 12;
        }
    } else {
        delta = this - that;
        output = units === 'second' ? delta / 1e3 : // 1000
            units === 'minute' ? delta / 6e4 : // 1000 * 60
            units === 'hour' ? delta / 36e5 : // 1000 * 60 * 60
            units === 'day' ? (delta - zoneDelta) / 864e5 : // 1000 * 60 * 60 * 24, negate dst
            units === 'week' ? (delta - zoneDelta) / 6048e5 : // 1000 * 60 * 60 * 24 * 7, negate dst
            delta;
    }
    return asFloat ? output : absFloor(output);
}

function monthDiff (a, b) {
    // difference in months
    var wholeMonthDiff = ((b.year() - a.year()) * 12) + (b.month() - a.month()),
        // b is in (anchor - 1 month, anchor + 1 month)
        anchor = a.clone().add(wholeMonthDiff, 'months'),
        anchor2, adjust;

    if (b - anchor < 0) {
        anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
        // linear across the month
        adjust = (b - anchor) / (anchor - anchor2);
    } else {
        anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
        // linear across the month
        adjust = (b - anchor) / (anchor2 - anchor);
    }

    //check for negative zero, return zero if negative zero
    return -(wholeMonthDiff + adjust) || 0;
}

hooks.defaultFormat = 'YYYY-MM-DDTHH:mm:ssZ';
hooks.defaultFormatUtc = 'YYYY-MM-DDTHH:mm:ss[Z]';

function toString () {
    return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
}

function toISOString () {
    var m = this.clone().utc();
    if (0 < m.year() && m.year() <= 9999) {
        if (isFunction(Date.prototype.toISOString)) {
            // native implementation is ~50x faster, use it when we can
            return this.toDate().toISOString();
        } else {
            return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
        }
    } else {
        return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
    }
}

/**
 * Return a human readable representation of a moment that can
 * also be evaluated to get a new moment which is the same
 *
 * @link https://nodejs.org/dist/latest/docs/api/util.html#util_custom_inspect_function_on_objects
 */
function inspect () {
    if (!this.isValid()) {
        return 'moment.invalid(/* ' + this._i + ' */)';
    }
    var func = 'moment';
    var zone = '';
    if (!this.isLocal()) {
        func = this.utcOffset() === 0 ? 'moment.utc' : 'moment.parseZone';
        zone = 'Z';
    }
    var prefix = '[' + func + '("]';
    var year = (0 < this.year() && this.year() <= 9999) ? 'YYYY' : 'YYYYYY';
    var datetime = '-MM-DD[T]HH:mm:ss.SSS';
    var suffix = zone + '[")]';

    return this.format(prefix + year + datetime + suffix);
}

function format (inputString) {
    if (!inputString) {
        inputString = this.isUtc() ? hooks.defaultFormatUtc : hooks.defaultFormat;
    }
    var output = formatMoment(this, inputString);
    return this.localeData().postformat(output);
}

function from (time, withoutSuffix) {
    if (this.isValid() &&
            ((isMoment(time) && time.isValid()) ||
             createLocal(time).isValid())) {
        return createDuration({to: this, from: time}).locale(this.locale()).humanize(!withoutSuffix);
    } else {
        return this.localeData().invalidDate();
    }
}

function fromNow (withoutSuffix) {
    return this.from(createLocal(), withoutSuffix);
}

function to (time, withoutSuffix) {
    if (this.isValid() &&
            ((isMoment(time) && time.isValid()) ||
             createLocal(time).isValid())) {
        return createDuration({from: this, to: time}).locale(this.locale()).humanize(!withoutSuffix);
    } else {
        return this.localeData().invalidDate();
    }
}

function toNow (withoutSuffix) {
    return this.to(createLocal(), withoutSuffix);
}

// If passed a locale key, it will set the locale for this
// instance.  Otherwise, it will return the locale configuration
// variables for this instance.
function locale (key) {
    var newLocaleData;

    if (key === undefined) {
        return this._locale._abbr;
    } else {
        newLocaleData = getLocale(key);
        if (newLocaleData != null) {
            this._locale = newLocaleData;
        }
        return this;
    }
}

var lang = deprecate(
    'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
    function (key) {
        if (key === undefined) {
            return this.localeData();
        } else {
            return this.locale(key);
        }
    }
);

function localeData () {
    return this._locale;
}

function startOf (units) {
    units = normalizeUnits(units);
    // the following switch intentionally omits break keywords
    // to utilize falling through the cases.
    switch (units) {
        case 'year':
            this.month(0);
            /* falls through */
        case 'quarter':
        case 'month':
            this.date(1);
            /* falls through */
        case 'week':
        case 'isoWeek':
        case 'day':
        case 'date':
            this.hours(0);
            /* falls through */
        case 'hour':
            this.minutes(0);
            /* falls through */
        case 'minute':
            this.seconds(0);
            /* falls through */
        case 'second':
            this.milliseconds(0);
    }

    // weeks are a special case
    if (units === 'week') {
        this.weekday(0);
    }
    if (units === 'isoWeek') {
        this.isoWeekday(1);
    }

    // quarters are also special
    if (units === 'quarter') {
        this.month(Math.floor(this.month() / 3) * 3);
    }

    return this;
}

function endOf (units) {
    units = normalizeUnits(units);
    if (units === undefined || units === 'millisecond') {
        return this;
    }

    // 'date' is an alias for 'day', so it should be considered as such.
    if (units === 'date') {
        units = 'day';
    }

    return this.startOf(units).add(1, (units === 'isoWeek' ? 'week' : units)).subtract(1, 'ms');
}

function valueOf () {
    return this._d.valueOf() - ((this._offset || 0) * 60000);
}

function unix () {
    return Math.floor(this.valueOf() / 1000);
}

function toDate () {
    return new Date(this.valueOf());
}

function toArray () {
    var m = this;
    return [m.year(), m.month(), m.date(), m.hour(), m.minute(), m.second(), m.millisecond()];
}

function toObject () {
    var m = this;
    return {
        years: m.year(),
        months: m.month(),
        date: m.date(),
        hours: m.hours(),
        minutes: m.minutes(),
        seconds: m.seconds(),
        milliseconds: m.milliseconds()
    };
}

function toJSON () {
    // new Date(NaN).toJSON() === null
    return this.isValid() ? this.toISOString() : null;
}

function isValid$1 () {
    return isValid(this);
}

function parsingFlags () {
    return extend({}, getParsingFlags(this));
}

function invalidAt () {
    return getParsingFlags(this).overflow;
}

function creationData() {
    return {
        input: this._i,
        format: this._f,
        locale: this._locale,
        isUTC: this._isUTC,
        strict: this._strict
    };
}

// FORMATTING

addFormatToken(0, ['gg', 2], 0, function () {
    return this.weekYear() % 100;
});

addFormatToken(0, ['GG', 2], 0, function () {
    return this.isoWeekYear() % 100;
});

function addWeekYearFormatToken (token, getter) {
    addFormatToken(0, [token, token.length], 0, getter);
}

addWeekYearFormatToken('gggg',     'weekYear');
addWeekYearFormatToken('ggggg',    'weekYear');
addWeekYearFormatToken('GGGG',  'isoWeekYear');
addWeekYearFormatToken('GGGGG', 'isoWeekYear');

// ALIASES

addUnitAlias('weekYear', 'gg');
addUnitAlias('isoWeekYear', 'GG');

// PRIORITY

addUnitPriority('weekYear', 1);
addUnitPriority('isoWeekYear', 1);


// PARSING

addRegexToken('G',      matchSigned);
addRegexToken('g',      matchSigned);
addRegexToken('GG',     match1to2, match2);
addRegexToken('gg',     match1to2, match2);
addRegexToken('GGGG',   match1to4, match4);
addRegexToken('gggg',   match1to4, match4);
addRegexToken('GGGGG',  match1to6, match6);
addRegexToken('ggggg',  match1to6, match6);

addWeekParseToken(['gggg', 'ggggg', 'GGGG', 'GGGGG'], function (input, week, config, token) {
    week[token.substr(0, 2)] = toInt(input);
});

addWeekParseToken(['gg', 'GG'], function (input, week, config, token) {
    week[token] = hooks.parseTwoDigitYear(input);
});

// MOMENTS

function getSetWeekYear (input) {
    return getSetWeekYearHelper.call(this,
            input,
            this.week(),
            this.weekday(),
            this.localeData()._week.dow,
            this.localeData()._week.doy);
}

function getSetISOWeekYear (input) {
    return getSetWeekYearHelper.call(this,
            input, this.isoWeek(), this.isoWeekday(), 1, 4);
}

function getISOWeeksInYear () {
    return weeksInYear(this.year(), 1, 4);
}

function getWeeksInYear () {
    var weekInfo = this.localeData()._week;
    return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
}

function getSetWeekYearHelper(input, week, weekday, dow, doy) {
    var weeksTarget;
    if (input == null) {
        return weekOfYear(this, dow, doy).year;
    } else {
        weeksTarget = weeksInYear(input, dow, doy);
        if (week > weeksTarget) {
            week = weeksTarget;
        }
        return setWeekAll.call(this, input, week, weekday, dow, doy);
    }
}

function setWeekAll(weekYear, week, weekday, dow, doy) {
    var dayOfYearData = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy),
        date = createUTCDate(dayOfYearData.year, 0, dayOfYearData.dayOfYear);

    this.year(date.getUTCFullYear());
    this.month(date.getUTCMonth());
    this.date(date.getUTCDate());
    return this;
}

// FORMATTING

addFormatToken('Q', 0, 'Qo', 'quarter');

// ALIASES

addUnitAlias('quarter', 'Q');

// PRIORITY

addUnitPriority('quarter', 7);

// PARSING

addRegexToken('Q', match1);
addParseToken('Q', function (input, array) {
    array[MONTH] = (toInt(input) - 1) * 3;
});

// MOMENTS

function getSetQuarter (input) {
    return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
}

// FORMATTING

addFormatToken('D', ['DD', 2], 'Do', 'date');

// ALIASES

addUnitAlias('date', 'D');

// PRIOROITY
addUnitPriority('date', 9);

// PARSING

addRegexToken('D',  match1to2);
addRegexToken('DD', match1to2, match2);
addRegexToken('Do', function (isStrict, locale) {
    return isStrict ? locale._ordinalParse : locale._ordinalParseLenient;
});

addParseToken(['D', 'DD'], DATE);
addParseToken('Do', function (input, array) {
    array[DATE] = toInt(input.match(match1to2)[0], 10);
});

// MOMENTS

var getSetDayOfMonth = makeGetSet('Date', true);

// FORMATTING

addFormatToken('DDD', ['DDDD', 3], 'DDDo', 'dayOfYear');

// ALIASES

addUnitAlias('dayOfYear', 'DDD');

// PRIORITY
addUnitPriority('dayOfYear', 4);

// PARSING

addRegexToken('DDD',  match1to3);
addRegexToken('DDDD', match3);
addParseToken(['DDD', 'DDDD'], function (input, array, config) {
    config._dayOfYear = toInt(input);
});

// HELPERS

// MOMENTS

function getSetDayOfYear (input) {
    var dayOfYear = Math.round((this.clone().startOf('day') - this.clone().startOf('year')) / 864e5) + 1;
    return input == null ? dayOfYear : this.add((input - dayOfYear), 'd');
}

// FORMATTING

addFormatToken('m', ['mm', 2], 0, 'minute');

// ALIASES

addUnitAlias('minute', 'm');

// PRIORITY

addUnitPriority('minute', 14);

// PARSING

addRegexToken('m',  match1to2);
addRegexToken('mm', match1to2, match2);
addParseToken(['m', 'mm'], MINUTE);

// MOMENTS

var getSetMinute = makeGetSet('Minutes', false);

// FORMATTING

addFormatToken('s', ['ss', 2], 0, 'second');

// ALIASES

addUnitAlias('second', 's');

// PRIORITY

addUnitPriority('second', 15);

// PARSING

addRegexToken('s',  match1to2);
addRegexToken('ss', match1to2, match2);
addParseToken(['s', 'ss'], SECOND);

// MOMENTS

var getSetSecond = makeGetSet('Seconds', false);

// FORMATTING

addFormatToken('S', 0, 0, function () {
    return ~~(this.millisecond() / 100);
});

addFormatToken(0, ['SS', 2], 0, function () {
    return ~~(this.millisecond() / 10);
});

addFormatToken(0, ['SSS', 3], 0, 'millisecond');
addFormatToken(0, ['SSSS', 4], 0, function () {
    return this.millisecond() * 10;
});
addFormatToken(0, ['SSSSS', 5], 0, function () {
    return this.millisecond() * 100;
});
addFormatToken(0, ['SSSSSS', 6], 0, function () {
    return this.millisecond() * 1000;
});
addFormatToken(0, ['SSSSSSS', 7], 0, function () {
    return this.millisecond() * 10000;
});
addFormatToken(0, ['SSSSSSSS', 8], 0, function () {
    return this.millisecond() * 100000;
});
addFormatToken(0, ['SSSSSSSSS', 9], 0, function () {
    return this.millisecond() * 1000000;
});


// ALIASES

addUnitAlias('millisecond', 'ms');

// PRIORITY

addUnitPriority('millisecond', 16);

// PARSING

addRegexToken('S',    match1to3, match1);
addRegexToken('SS',   match1to3, match2);
addRegexToken('SSS',  match1to3, match3);

var token;
for (token = 'SSSS'; token.length <= 9; token += 'S') {
    addRegexToken(token, matchUnsigned);
}

function parseMs(input, array) {
    array[MILLISECOND] = toInt(('0.' + input) * 1000);
}

for (token = 'S'; token.length <= 9; token += 'S') {
    addParseToken(token, parseMs);
}
// MOMENTS

var getSetMillisecond = makeGetSet('Milliseconds', false);

// FORMATTING

addFormatToken('z',  0, 0, 'zoneAbbr');
addFormatToken('zz', 0, 0, 'zoneName');

// MOMENTS

function getZoneAbbr () {
    return this._isUTC ? 'UTC' : '';
}

function getZoneName () {
    return this._isUTC ? 'Coordinated Universal Time' : '';
}

var proto = Moment.prototype;

proto.add               = add;
proto.calendar          = calendar$1;
proto.clone             = clone;
proto.diff              = diff;
proto.endOf             = endOf;
proto.format            = format;
proto.from              = from;
proto.fromNow           = fromNow;
proto.to                = to;
proto.toNow             = toNow;
proto.get               = stringGet;
proto.invalidAt         = invalidAt;
proto.isAfter           = isAfter;
proto.isBefore          = isBefore;
proto.isBetween         = isBetween;
proto.isSame            = isSame;
proto.isSameOrAfter     = isSameOrAfter;
proto.isSameOrBefore    = isSameOrBefore;
proto.isValid           = isValid$1;
proto.lang              = lang;
proto.locale            = locale;
proto.localeData        = localeData;
proto.max               = prototypeMax;
proto.min               = prototypeMin;
proto.parsingFlags      = parsingFlags;
proto.set               = stringSet;
proto.startOf           = startOf;
proto.subtract          = subtract;
proto.toArray           = toArray;
proto.toObject          = toObject;
proto.toDate            = toDate;
proto.toISOString       = toISOString;
proto.inspect           = inspect;
proto.toJSON            = toJSON;
proto.toString          = toString;
proto.unix              = unix;
proto.valueOf           = valueOf;
proto.creationData      = creationData;

// Year
proto.year       = getSetYear;
proto.isLeapYear = getIsLeapYear;

// Week Year
proto.weekYear    = getSetWeekYear;
proto.isoWeekYear = getSetISOWeekYear;

// Quarter
proto.quarter = proto.quarters = getSetQuarter;

// Month
proto.month       = getSetMonth;
proto.daysInMonth = getDaysInMonth;

// Week
proto.week           = proto.weeks        = getSetWeek;
proto.isoWeek        = proto.isoWeeks     = getSetISOWeek;
proto.weeksInYear    = getWeeksInYear;
proto.isoWeeksInYear = getISOWeeksInYear;

// Day
proto.date       = getSetDayOfMonth;
proto.day        = proto.days             = getSetDayOfWeek;
proto.weekday    = getSetLocaleDayOfWeek;
proto.isoWeekday = getSetISODayOfWeek;
proto.dayOfYear  = getSetDayOfYear;

// Hour
proto.hour = proto.hours = getSetHour;

// Minute
proto.minute = proto.minutes = getSetMinute;

// Second
proto.second = proto.seconds = getSetSecond;

// Millisecond
proto.millisecond = proto.milliseconds = getSetMillisecond;

// Offset
proto.utcOffset            = getSetOffset;
proto.utc                  = setOffsetToUTC;
proto.local                = setOffsetToLocal;
proto.parseZone            = setOffsetToParsedOffset;
proto.hasAlignedHourOffset = hasAlignedHourOffset;
proto.isDST                = isDaylightSavingTime;
proto.isLocal              = isLocal;
proto.isUtcOffset          = isUtcOffset;
proto.isUtc                = isUtc;
proto.isUTC                = isUtc;

// Timezone
proto.zoneAbbr = getZoneAbbr;
proto.zoneName = getZoneName;

// Deprecations
proto.dates  = deprecate('dates accessor is deprecated. Use date instead.', getSetDayOfMonth);
proto.months = deprecate('months accessor is deprecated. Use month instead', getSetMonth);
proto.years  = deprecate('years accessor is deprecated. Use year instead', getSetYear);
proto.zone   = deprecate('moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/', getSetZone);
proto.isDSTShifted = deprecate('isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information', isDaylightSavingTimeShifted);

function createUnix (input) {
    return createLocal(input * 1000);
}

function createInZone () {
    return createLocal.apply(null, arguments).parseZone();
}

function preParsePostFormat (string) {
    return string;
}

var proto$1 = Locale.prototype;

proto$1.calendar        = calendar;
proto$1.longDateFormat  = longDateFormat;
proto$1.invalidDate     = invalidDate;
proto$1.ordinal         = ordinal;
proto$1.preparse        = preParsePostFormat;
proto$1.postformat      = preParsePostFormat;
proto$1.relativeTime    = relativeTime;
proto$1.pastFuture      = pastFuture;
proto$1.set             = set;

// Month
proto$1.months            =        localeMonths;
proto$1.monthsShort       =        localeMonthsShort;
proto$1.monthsParse       =        localeMonthsParse;
proto$1.monthsRegex       = monthsRegex;
proto$1.monthsShortRegex  = monthsShortRegex;

// Week
proto$1.week = localeWeek;
proto$1.firstDayOfYear = localeFirstDayOfYear;
proto$1.firstDayOfWeek = localeFirstDayOfWeek;

// Day of Week
proto$1.weekdays       =        localeWeekdays;
proto$1.weekdaysMin    =        localeWeekdaysMin;
proto$1.weekdaysShort  =        localeWeekdaysShort;
proto$1.weekdaysParse  =        localeWeekdaysParse;

proto$1.weekdaysRegex       =        weekdaysRegex;
proto$1.weekdaysShortRegex  =        weekdaysShortRegex;
proto$1.weekdaysMinRegex    =        weekdaysMinRegex;

// Hours
proto$1.isPM = localeIsPM;
proto$1.meridiem = localeMeridiem;

function get$1 (format, index, field, setter) {
    var locale = getLocale();
    var utc = createUTC().set(setter, index);
    return locale[field](utc, format);
}

function listMonthsImpl (format, index, field) {
    if (isNumber(format)) {
        index = format;
        format = undefined;
    }

    format = format || '';

    if (index != null) {
        return get$1(format, index, field, 'month');
    }

    var i;
    var out = [];
    for (i = 0; i < 12; i++) {
        out[i] = get$1(format, i, field, 'month');
    }
    return out;
}

// ()
// (5)
// (fmt, 5)
// (fmt)
// (true)
// (true, 5)
// (true, fmt, 5)
// (true, fmt)
function listWeekdaysImpl (localeSorted, format, index, field) {
    if (typeof localeSorted === 'boolean') {
        if (isNumber(format)) {
            index = format;
            format = undefined;
        }

        format = format || '';
    } else {
        format = localeSorted;
        index = format;
        localeSorted = false;

        if (isNumber(format)) {
            index = format;
            format = undefined;
        }

        format = format || '';
    }

    var locale = getLocale(),
        shift = localeSorted ? locale._week.dow : 0;

    if (index != null) {
        return get$1(format, (index + shift) % 7, field, 'day');
    }

    var i;
    var out = [];
    for (i = 0; i < 7; i++) {
        out[i] = get$1(format, (i + shift) % 7, field, 'day');
    }
    return out;
}

function listMonths (format, index) {
    return listMonthsImpl(format, index, 'months');
}

function listMonthsShort (format, index) {
    return listMonthsImpl(format, index, 'monthsShort');
}

function listWeekdays (localeSorted, format, index) {
    return listWeekdaysImpl(localeSorted, format, index, 'weekdays');
}

function listWeekdaysShort (localeSorted, format, index) {
    return listWeekdaysImpl(localeSorted, format, index, 'weekdaysShort');
}

function listWeekdaysMin (localeSorted, format, index) {
    return listWeekdaysImpl(localeSorted, format, index, 'weekdaysMin');
}

getSetGlobalLocale('en', {
    ordinalParse: /\d{1,2}(th|st|nd|rd)/,
    ordinal : function (number) {
        var b = number % 10,
            output = (toInt(number % 100 / 10) === 1) ? 'th' :
            (b === 1) ? 'st' :
            (b === 2) ? 'nd' :
            (b === 3) ? 'rd' : 'th';
        return number + output;
    }
});

// Side effect imports
hooks.lang = deprecate('moment.lang is deprecated. Use moment.locale instead.', getSetGlobalLocale);
hooks.langData = deprecate('moment.langData is deprecated. Use moment.localeData instead.', getLocale);

var mathAbs = Math.abs;

function abs () {
    var data           = this._data;

    this._milliseconds = mathAbs(this._milliseconds);
    this._days         = mathAbs(this._days);
    this._months       = mathAbs(this._months);

    data.milliseconds  = mathAbs(data.milliseconds);
    data.seconds       = mathAbs(data.seconds);
    data.minutes       = mathAbs(data.minutes);
    data.hours         = mathAbs(data.hours);
    data.months        = mathAbs(data.months);
    data.years         = mathAbs(data.years);

    return this;
}

function addSubtract$1 (duration, input, value, direction) {
    var other = createDuration(input, value);

    duration._milliseconds += direction * other._milliseconds;
    duration._days         += direction * other._days;
    duration._months       += direction * other._months;

    return duration._bubble();
}

// supports only 2.0-style add(1, 's') or add(duration)
function add$1 (input, value) {
    return addSubtract$1(this, input, value, 1);
}

// supports only 2.0-style subtract(1, 's') or subtract(duration)
function subtract$1 (input, value) {
    return addSubtract$1(this, input, value, -1);
}

function absCeil (number) {
    if (number < 0) {
        return Math.floor(number);
    } else {
        return Math.ceil(number);
    }
}

function bubble () {
    var milliseconds = this._milliseconds;
    var days         = this._days;
    var months       = this._months;
    var data         = this._data;
    var seconds, minutes, hours, years, monthsFromDays;

    // if we have a mix of positive and negative values, bubble down first
    // check: https://github.com/moment/moment/issues/2166
    if (!((milliseconds >= 0 && days >= 0 && months >= 0) ||
            (milliseconds <= 0 && days <= 0 && months <= 0))) {
        milliseconds += absCeil(monthsToDays(months) + days) * 864e5;
        days = 0;
        months = 0;
    }

    // The following code bubbles up values, see the tests for
    // examples of what that means.
    data.milliseconds = milliseconds % 1000;

    seconds           = absFloor(milliseconds / 1000);
    data.seconds      = seconds % 60;

    minutes           = absFloor(seconds / 60);
    data.minutes      = minutes % 60;

    hours             = absFloor(minutes / 60);
    data.hours        = hours % 24;

    days += absFloor(hours / 24);

    // convert days to months
    monthsFromDays = absFloor(daysToMonths(days));
    months += monthsFromDays;
    days -= absCeil(monthsToDays(monthsFromDays));

    // 12 months -> 1 year
    years = absFloor(months / 12);
    months %= 12;

    data.days   = days;
    data.months = months;
    data.years  = years;

    return this;
}

function daysToMonths (days) {
    // 400 years have 146097 days (taking into account leap year rules)
    // 400 years have 12 months === 4800
    return days * 4800 / 146097;
}

function monthsToDays (months) {
    // the reverse of daysToMonths
    return months * 146097 / 4800;
}

function as (units) {
    var days;
    var months;
    var milliseconds = this._milliseconds;

    units = normalizeUnits(units);

    if (units === 'month' || units === 'year') {
        days   = this._days   + milliseconds / 864e5;
        months = this._months + daysToMonths(days);
        return units === 'month' ? months : months / 12;
    } else {
        // handle milliseconds separately because of floating point math errors (issue #1867)
        days = this._days + Math.round(monthsToDays(this._months));
        switch (units) {
            case 'week'   : return days / 7     + milliseconds / 6048e5;
            case 'day'    : return days         + milliseconds / 864e5;
            case 'hour'   : return days * 24    + milliseconds / 36e5;
            case 'minute' : return days * 1440  + milliseconds / 6e4;
            case 'second' : return days * 86400 + milliseconds / 1000;
            // Math.floor prevents floating point math errors here
            case 'millisecond': return Math.floor(days * 864e5) + milliseconds;
            default: throw new Error('Unknown unit ' + units);
        }
    }
}

// TODO: Use this.as('ms')?
function valueOf$1 () {
    return (
        this._milliseconds +
        this._days * 864e5 +
        (this._months % 12) * 2592e6 +
        toInt(this._months / 12) * 31536e6
    );
}

function makeAs (alias) {
    return function () {
        return this.as(alias);
    };
}

var asMilliseconds = makeAs('ms');
var asSeconds      = makeAs('s');
var asMinutes      = makeAs('m');
var asHours        = makeAs('h');
var asDays         = makeAs('d');
var asWeeks        = makeAs('w');
var asMonths       = makeAs('M');
var asYears        = makeAs('y');

function get$2 (units) {
    units = normalizeUnits(units);
    return this[units + 's']();
}

function makeGetter(name) {
    return function () {
        return this._data[name];
    };
}

var milliseconds = makeGetter('milliseconds');
var seconds      = makeGetter('seconds');
var minutes      = makeGetter('minutes');
var hours        = makeGetter('hours');
var days         = makeGetter('days');
var months       = makeGetter('months');
var years        = makeGetter('years');

function weeks () {
    return absFloor(this.days() / 7);
}

var round = Math.round;
var thresholds = {
    s: 45,  // seconds to minute
    m: 45,  // minutes to hour
    h: 22,  // hours to day
    d: 26,  // days to month
    M: 11   // months to year
};

// helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
    return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
}

function relativeTime$1 (posNegDuration, withoutSuffix, locale) {
    var duration = createDuration(posNegDuration).abs();
    var seconds  = round(duration.as('s'));
    var minutes  = round(duration.as('m'));
    var hours    = round(duration.as('h'));
    var days     = round(duration.as('d'));
    var months   = round(duration.as('M'));
    var years    = round(duration.as('y'));

    var a = seconds < thresholds.s && ['s', seconds]  ||
            minutes <= 1           && ['m']           ||
            minutes < thresholds.m && ['mm', minutes] ||
            hours   <= 1           && ['h']           ||
            hours   < thresholds.h && ['hh', hours]   ||
            days    <= 1           && ['d']           ||
            days    < thresholds.d && ['dd', days]    ||
            months  <= 1           && ['M']           ||
            months  < thresholds.M && ['MM', months]  ||
            years   <= 1           && ['y']           || ['yy', years];

    a[2] = withoutSuffix;
    a[3] = +posNegDuration > 0;
    a[4] = locale;
    return substituteTimeAgo.apply(null, a);
}

// This function allows you to set the rounding function for relative time strings
function getSetRelativeTimeRounding (roundingFunction) {
    if (roundingFunction === undefined) {
        return round;
    }
    if (typeof(roundingFunction) === 'function') {
        round = roundingFunction;
        return true;
    }
    return false;
}

// This function allows you to set a threshold for relative time strings
function getSetRelativeTimeThreshold (threshold, limit) {
    if (thresholds[threshold] === undefined) {
        return false;
    }
    if (limit === undefined) {
        return thresholds[threshold];
    }
    thresholds[threshold] = limit;
    return true;
}

function humanize (withSuffix) {
    var locale = this.localeData();
    var output = relativeTime$1(this, !withSuffix, locale);

    if (withSuffix) {
        output = locale.pastFuture(+this, output);
    }

    return locale.postformat(output);
}

var abs$1 = Math.abs;

function toISOString$1() {
    // for ISO strings we do not use the normal bubbling rules:
    //  * milliseconds bubble up until they become hours
    //  * days do not bubble at all
    //  * months bubble up until they become years
    // This is because there is no context-free conversion between hours and days
    // (think of clock changes)
    // and also not between days and months (28-31 days per month)
    var seconds = abs$1(this._milliseconds) / 1000;
    var days         = abs$1(this._days);
    var months       = abs$1(this._months);
    var minutes, hours, years;

    // 3600 seconds -> 60 minutes -> 1 hour
    minutes           = absFloor(seconds / 60);
    hours             = absFloor(minutes / 60);
    seconds %= 60;
    minutes %= 60;

    // 12 months -> 1 year
    years  = absFloor(months / 12);
    months %= 12;


    // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
    var Y = years;
    var M = months;
    var D = days;
    var h = hours;
    var m = minutes;
    var s = seconds;
    var total = this.asSeconds();

    if (!total) {
        // this is the same as C#'s (Noda) and python (isodate)...
        // but not other JS (goog.date)
        return 'P0D';
    }

    return (total < 0 ? '-' : '') +
        'P' +
        (Y ? Y + 'Y' : '') +
        (M ? M + 'M' : '') +
        (D ? D + 'D' : '') +
        ((h || m || s) ? 'T' : '') +
        (h ? h + 'H' : '') +
        (m ? m + 'M' : '') +
        (s ? s + 'S' : '');
}

var proto$2 = Duration.prototype;

proto$2.abs            = abs;
proto$2.add            = add$1;
proto$2.subtract       = subtract$1;
proto$2.as             = as;
proto$2.asMilliseconds = asMilliseconds;
proto$2.asSeconds      = asSeconds;
proto$2.asMinutes      = asMinutes;
proto$2.asHours        = asHours;
proto$2.asDays         = asDays;
proto$2.asWeeks        = asWeeks;
proto$2.asMonths       = asMonths;
proto$2.asYears        = asYears;
proto$2.valueOf        = valueOf$1;
proto$2._bubble        = bubble;
proto$2.get            = get$2;
proto$2.milliseconds   = milliseconds;
proto$2.seconds        = seconds;
proto$2.minutes        = minutes;
proto$2.hours          = hours;
proto$2.days           = days;
proto$2.weeks          = weeks;
proto$2.months         = months;
proto$2.years          = years;
proto$2.humanize       = humanize;
proto$2.toISOString    = toISOString$1;
proto$2.toString       = toISOString$1;
proto$2.toJSON         = toISOString$1;
proto$2.locale         = locale;
proto$2.localeData     = localeData;

// Deprecations
proto$2.toIsoString = deprecate('toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)', toISOString$1);
proto$2.lang = lang;

// Side effect imports

// FORMATTING

addFormatToken('X', 0, 0, 'unix');
addFormatToken('x', 0, 0, 'valueOf');

// PARSING

addRegexToken('x', matchSigned);
addRegexToken('X', matchTimestamp);
addParseToken('X', function (input, array, config) {
    config._d = new Date(parseFloat(input, 10) * 1000);
});
addParseToken('x', function (input, array, config) {
    config._d = new Date(toInt(input));
});

// Side effect imports


hooks.version = '2.17.1';

setHookCallback(createLocal);

hooks.fn                    = proto;
hooks.min                   = min;
hooks.max                   = max;
hooks.now                   = now;
hooks.utc                   = createUTC;
hooks.unix                  = createUnix;
hooks.months                = listMonths;
hooks.isDate                = isDate;
hooks.locale                = getSetGlobalLocale;
hooks.invalid               = createInvalid;
hooks.duration              = createDuration;
hooks.isMoment              = isMoment;
hooks.weekdays              = listWeekdays;
hooks.parseZone             = createInZone;
hooks.localeData            = getLocale;
hooks.isDuration            = isDuration;
hooks.monthsShort           = listMonthsShort;
hooks.weekdaysMin           = listWeekdaysMin;
hooks.defineLocale          = defineLocale;
hooks.updateLocale          = updateLocale;
hooks.locales               = listLocales;
hooks.weekdaysShort         = listWeekdaysShort;
hooks.normalizeUnits        = normalizeUnits;
hooks.relativeTimeRounding = getSetRelativeTimeRounding;
hooks.relativeTimeThreshold = getSetRelativeTimeThreshold;
hooks.calendarFormat        = getCalendarFormat;
hooks.prototype             = proto;

return hooks;

})));

},{}],4:[function(require,module,exports){
(function(self) {
  'use strict';

  if (self.fetch) {
    return
  }

  var support = {
    searchParams: 'URLSearchParams' in self,
    iterable: 'Symbol' in self && 'iterator' in Symbol,
    blob: 'FileReader' in self && 'Blob' in self && (function() {
      try {
        new Blob()
        return true
      } catch(e) {
        return false
      }
    })(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  }

  if (support.arrayBuffer) {
    var viewClasses = [
      '[object Int8Array]',
      '[object Uint8Array]',
      '[object Uint8ClampedArray]',
      '[object Int16Array]',
      '[object Uint16Array]',
      '[object Int32Array]',
      '[object Uint32Array]',
      '[object Float32Array]',
      '[object Float64Array]'
    ]

    var isDataView = function(obj) {
      return obj && DataView.prototype.isPrototypeOf(obj)
    }

    var isArrayBufferView = ArrayBuffer.isView || function(obj) {
      return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1
    }
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name)
    }
    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value)
    }
    return value
  }

  // Build a destructive iterator for the value list
  function iteratorFor(items) {
    var iterator = {
      next: function() {
        var value = items.shift()
        return {done: value === undefined, value: value}
      }
    }

    if (support.iterable) {
      iterator[Symbol.iterator] = function() {
        return iterator
      }
    }

    return iterator
  }

  function Headers(headers) {
    this.map = {}

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value)
      }, this)
    } else if (Array.isArray(headers)) {
      headers.forEach(function(header) {
        this.append(header[0], header[1])
      }, this)
    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name])
      }, this)
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name)
    value = normalizeValue(value)
    var oldValue = this.map[name]
    this.map[name] = oldValue ? oldValue+','+value : value
  }

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)]
  }

  Headers.prototype.get = function(name) {
    name = normalizeName(name)
    return this.has(name) ? this.map[name] : null
  }

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  }

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = normalizeValue(value)
  }

  Headers.prototype.forEach = function(callback, thisArg) {
    for (var name in this.map) {
      if (this.map.hasOwnProperty(name)) {
        callback.call(thisArg, this.map[name], name, this)
      }
    }
  }

  Headers.prototype.keys = function() {
    var items = []
    this.forEach(function(value, name) { items.push(name) })
    return iteratorFor(items)
  }

  Headers.prototype.values = function() {
    var items = []
    this.forEach(function(value) { items.push(value) })
    return iteratorFor(items)
  }

  Headers.prototype.entries = function() {
    var items = []
    this.forEach(function(value, name) { items.push([name, value]) })
    return iteratorFor(items)
  }

  if (support.iterable) {
    Headers.prototype[Symbol.iterator] = Headers.prototype.entries
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result)
      }
      reader.onerror = function() {
        reject(reader.error)
      }
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader()
    var promise = fileReaderReady(reader)
    reader.readAsArrayBuffer(blob)
    return promise
  }

  function readBlobAsText(blob) {
    var reader = new FileReader()
    var promise = fileReaderReady(reader)
    reader.readAsText(blob)
    return promise
  }

  function readArrayBufferAsText(buf) {
    var view = new Uint8Array(buf)
    var chars = new Array(view.length)

    for (var i = 0; i < view.length; i++) {
      chars[i] = String.fromCharCode(view[i])
    }
    return chars.join('')
  }

  function bufferClone(buf) {
    if (buf.slice) {
      return buf.slice(0)
    } else {
      var view = new Uint8Array(buf.byteLength)
      view.set(new Uint8Array(buf))
      return view.buffer
    }
  }

  function Body() {
    this.bodyUsed = false

    this._initBody = function(body) {
      this._bodyInit = body
      if (!body) {
        this._bodyText = ''
      } else if (typeof body === 'string') {
        this._bodyText = body
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this._bodyText = body.toString()
      } else if (support.arrayBuffer && support.blob && isDataView(body)) {
        this._bodyArrayBuffer = bufferClone(body.buffer)
        // IE 10-11 can't handle a DataView body.
        this._bodyInit = new Blob([this._bodyArrayBuffer])
      } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
        this._bodyArrayBuffer = bufferClone(body)
      } else {
        throw new Error('unsupported BodyInit type')
      }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8')
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type)
        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8')
        }
      }
    }

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyArrayBuffer) {
          return Promise.resolve(new Blob([this._bodyArrayBuffer]))
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      }

      this.arrayBuffer = function() {
        if (this._bodyArrayBuffer) {
          return consumed(this) || Promise.resolve(this._bodyArrayBuffer)
        } else {
          return this.blob().then(readBlobAsArrayBuffer)
        }
      }
    }

    this.text = function() {
      var rejected = consumed(this)
      if (rejected) {
        return rejected
      }

      if (this._bodyBlob) {
        return readBlobAsText(this._bodyBlob)
      } else if (this._bodyArrayBuffer) {
        return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer))
      } else if (this._bodyFormData) {
        throw new Error('could not read FormData body as text')
      } else {
        return Promise.resolve(this._bodyText)
      }
    }

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      }
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    }

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']

  function normalizeMethod(method) {
    var upcased = method.toUpperCase()
    return (methods.indexOf(upcased) > -1) ? upcased : method
  }

  function Request(input, options) {
    options = options || {}
    var body = options.body

    if (input instanceof Request) {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url
      this.credentials = input.credentials
      if (!options.headers) {
        this.headers = new Headers(input.headers)
      }
      this.method = input.method
      this.mode = input.mode
      if (!body && input._bodyInit != null) {
        body = input._bodyInit
        input.bodyUsed = true
      }
    } else {
      this.url = String(input)
    }

    this.credentials = options.credentials || this.credentials || 'omit'
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers)
    }
    this.method = normalizeMethod(options.method || this.method || 'GET')
    this.mode = options.mode || this.mode || null
    this.referrer = null

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body)
  }

  Request.prototype.clone = function() {
    return new Request(this, { body: this._bodyInit })
  }

  function decode(body) {
    var form = new FormData()
    body.trim().split('&').forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=')
        var name = split.shift().replace(/\+/g, ' ')
        var value = split.join('=').replace(/\+/g, ' ')
        form.append(decodeURIComponent(name), decodeURIComponent(value))
      }
    })
    return form
  }

  function parseHeaders(rawHeaders) {
    var headers = new Headers()
    rawHeaders.split(/\r?\n/).forEach(function(line) {
      var parts = line.split(':')
      var key = parts.shift().trim()
      if (key) {
        var value = parts.join(':').trim()
        headers.append(key, value)
      }
    })
    return headers
  }

  Body.call(Request.prototype)

  function Response(bodyInit, options) {
    if (!options) {
      options = {}
    }

    this.type = 'default'
    this.status = 'status' in options ? options.status : 200
    this.ok = this.status >= 200 && this.status < 300
    this.statusText = 'statusText' in options ? options.statusText : 'OK'
    this.headers = new Headers(options.headers)
    this.url = options.url || ''
    this._initBody(bodyInit)
  }

  Body.call(Response.prototype)

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  }

  Response.error = function() {
    var response = new Response(null, {status: 0, statusText: ''})
    response.type = 'error'
    return response
  }

  var redirectStatuses = [301, 302, 303, 307, 308]

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, {status: status, headers: {location: url}})
  }

  self.Headers = Headers
  self.Request = Request
  self.Response = Response

  self.fetch = function(input, init) {
    return new Promise(function(resolve, reject) {
      var request = new Request(input, init)
      var xhr = new XMLHttpRequest()

      xhr.onload = function() {
        var options = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: parseHeaders(xhr.getAllResponseHeaders() || '')
        }
        options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL')
        var body = 'response' in xhr ? xhr.response : xhr.responseText
        resolve(new Response(body, options))
      }

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.ontimeout = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.open(request.method, request.url, true)

      if (request.credentials === 'include') {
        xhr.withCredentials = true
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob'
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value)
      })

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
    })
  }
  self.fetch.polyfill = true
})(typeof self !== 'undefined' ? self : this);

},{}],5:[function(require,module,exports){
'use strict';

var FormData = require('formdata-polyfill');

/***** LOGS *****/

// displaying other device textbox
var deviceList = document.querySelector('#cooking-device');
var otherDevice = document.querySelector('#device-other-box');

if (deviceList) {
  deviceList.addEventListener('change', function () {

    if (deviceList.value === 'Other') {
      otherDevice.classList.remove('hidden');
    } else if (deviceList.value !== 'Other') {
      otherDevice.classList.add('hidden');
    }
  });
}

// displaying other meat textbox
var meatList = document.querySelector('#meat-type');
var otherMeat = document.querySelector('#meat-other-box');

if (meatList) {
  meatList.addEventListener('change', function () {

    if (meatList.value === 'Other') {
      otherMeat.classList.remove('hidden');
    } else if (meatList.value !== 'Other') {
      otherMeat.classList.add('hidden');
    }
  });
}

// displaying other wood textbox
var woodList = document.querySelector('#wood');
var otherWood = document.querySelector('#wood-other-text');

if (woodList) {
  woodList.addEventListener('change', function () {

    if (woodList.value === 'Other') {
      otherWood.classList.remove('hidden');
    } else if (woodList.value !== 'Other') {
      otherWood.classList.add('hidden');
    }
  });
}

// adding step to recipe
var addStepBtn = document.querySelector('#add-step');
var list = document.querySelector('ol');

if (addStepBtn) {
  addStepBtn.addEventListener('click', function () {
    var li = document.createElement('li');
    var stepHTML = "<div class='step-box'><div class='step-notes'><textarea class='step-text' placeholder='Write step here'></textarea></div><div class='complete-box'><label for='complete'><input type='checkbox' class='complete-check' name='step-complete'>Complete</label><input type='time' class='time' name='time' value='09:00'></div><div class='complete-notes'><textarea class='complete-notes-text' placeholder='Write notes here'></textarea><button type='button' class='remove-step'>Remove Step</button></div></div>";
    li.innerHTML = stepHTML;

    list.appendChild(li);
  });

  var logMain = document.querySelector('#log-main');

  document.querySelector('#recipe-list ol').addEventListener('click', function (event) {
    if (event.target.classList.contains('remove-step')) {
      var li = event.target.closest('li');

      var div = document.createElement('div');
      var popHTML = "<p style='margin-top: 40px;'>Confirm delete step?</p><div id='pop-del-options'><button id='del-yes'>Yes</button><button id='del-no'>No</button></div>";

      div.setAttribute('id', 'pop-del');
      div.innerHTML = popHTML;
      logMain.appendChild(div);

      var delNo = document.querySelector('#del-no');
      if (delNo) {
        delNo.addEventListener('click', function () {
          var popDel = document.querySelector('#pop-del');
          popDel.parentNode.removeChild(popDel);
        });
      }

      var delYes = document.querySelector('#del-yes');
      if (delYes) {
        delYes.addEventListener('click', function () {
          li.parentNode.removeChild(li);
          var popDel = document.querySelector('#pop-del');
          popDel.parentNode.removeChild(popDel);
        });
      }
    }
  });
}

// removing pic from log
var removePicBtn = document.querySelector('.remove-pic');
var picsBox = document.querySelector('.pics-box');

if (removePicBtn) {

  var logMain = document.querySelector('#log-main');

  picsBox.addEventListener('click', function (event) {
    if (event.target.classList.contains('remove-pic')) {
      var picDiv = event.target.closest('div');

      var div = document.createElement('div');
      var popHTML = "<p style='margin-top: 40px;'>Confirm delete pic?</p><div id='pop-del-options'><button id='del-yes'>Yes</button><button id='del-no'>No</button></div>";

      div.setAttribute('id', 'pop-del');
      div.innerHTML = popHTML;
      logMain.appendChild(div);

      var delNo = document.querySelector('#del-no');
      if (delNo) {
        delNo.addEventListener('click', function () {
          var popDel = document.querySelector('#pop-del');
          popDel.parentNode.removeChild(popDel);
        });
      }

      var delYes = document.querySelector('#del-yes');
      if (delYes) {
        delYes.addEventListener('click', function () {
          picDiv.parentNode.removeChild(picDiv);
          var popDel = document.querySelector('#pop-del');
          popDel.parentNode.removeChild(popDel);
        });
      }
    }
  });
}

// temperature slider output
window.outputUpdate = function (temp) {
  document.querySelector('#temp-slider-output').value = temp;
};

// save new log data to Mongo
var save = document.querySelector('#save');

if (save) {
  save.addEventListener('click', function () {

    var logBody = document.querySelector('#log-body');
    var div = document.createElement('div');
    var popHTML = "<img src='../images/uploading.gif'>";

    div.classList.add('pop');
    div.innerHTML = popHTML;
    logBody.appendChild(div);

    var radios = document.querySelectorAll('.rating input');
    var ratingSelected;
    radios.forEach(function (radio) {
      if (radio.checked) {
        ratingSelected = radio.value;
      }
    });

    if (!ratingSelected) {
      ratingSelected = 0;
    }

    var status = document.querySelectorAll('#status-box input');
    var statusSelected;
    status.forEach(function (item) {
      if (item.checked) {
        statusSelected = item.value;
      }
    });

    var formData = new FormData();
    var basicData = {
      date: document.querySelector('#date-select').value,
      session_name: document.querySelector('#session-name').value,
      cooking_device: document.querySelector('#cooking-device').value,
      device_other: document.querySelector('#device-other-text').value,
      meat: document.querySelector('#meat-type').value,
      meat_other: document.querySelector('#meat-other-text').value,
      weight: document.querySelector('#weight').value,
      meat_notes: document.querySelector('#meat-notes').value,
      cook_temperature: document.querySelector('#temp-slider').value,
      estimated_time: document.querySelector('#estimated-time').value,
      fuel: document.querySelector('#fuel').value,
      brand: document.querySelector('#brand').value,
      wood: document.querySelector('#wood').value,
      wood_other: document.querySelector('#wood-other-text').value,
      rating: ratingSelected,
      status: statusSelected,
      username: document.querySelector('#username').textContent,
      updated: new Date(),
      votes: 0,
      voters: [],
      other_ingredients: document.querySelector('#other-ingredients').value,
      recipe_guideline: document.querySelector('#recipe-guideline').value,
      pics: [],
      final: document.querySelector('#final-comments').value
    };

    var ol = document.querySelector('ol');
    var items = ol.getElementsByTagName('li');
    var stepInfo = [];

    Array.from(items).forEach(function (item) {
      var stepObject = {};
      stepObject.step = item.querySelector('.step-text').value;
      stepObject.completed = item.querySelector('.complete-check').checked;
      stepObject.time = item.querySelector('.time').value;
      stepObject.notes = item.querySelector('.complete-notes-text').value;
      stepInfo.push(stepObject);
    });

    var logData = Object.assign({ steps: stepInfo }, basicData);

    // if ( navigator.userAgent.match(/Android/i)
    //  || navigator.userAgent.match(/webOS/i)
    //  || navigator.userAgent.match(/iPhone/i)
    //  || navigator.userAgent.match(/iPad/i)
    //  || navigator.userAgent.match(/iPod/i)
    //  || navigator.userAgent.match(/BlackBerry/i)
    //  || navigator.userAgent.match(/Windows Phone/i)
    //  ) {
    //   sendLog(logData)
    // }

    // else {

    var f = new FormData();

    // let blob = new Blob('logData', JSON.stringify(logData))
    // f.append(blob)

    f.append('test', document.querySelector('.complete-notes-text').value);

    // f.append('logData', JSON.stringify(logData))

    f.append('pics', document.querySelector('#file1').files[0]);
    f.append('pics', document.querySelector('#file2').files[0]);
    f.append('pics', document.querySelector('#file3').files[0]);
    f.append('pics', document.querySelector('#file4').files[0]);
    f.append('pics', document.querySelector('#file5').files[0]);

    xhrPromise(f).then(res => {
      window.location = '/log-history?message=Log%20created';
    });

    // }
  });
}

function xhrPromise(f) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open('post', '/create-log');
    xhr.addEventListener('load', function () {
      if (xhr.readyState == XMLHttpRequest.DONE) {
        resolve(xhr.responseText);
      }
    });
    xhr.addEventListener('error', reject);

    xhr.send(f);
  });
}

function sendLog(logData) {
  console.log('sending fetch');
  fetch('/create-log', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(logData),
    mode: 'cors',
    cache: 'default',
    credentials: 'include'
  }).then(function () {
    window.location = '/log-history?message=Log%20created';
  });
}

// update log data to Mongo
var update = document.querySelector('#update');

if (update) {
  update.addEventListener('click', function () {

    var logBody = document.querySelector('#log-body');
    var div = document.createElement('div');
    var popHTML = "<img src='../images/uploading.gif'>";

    div.classList.add('pop');
    div.innerHTML = popHTML;
    logBody.appendChild(div);

    var radios = document.querySelectorAll('.rating input');
    var ratingSelected;
    radios.forEach(function (radio) {
      if (radio.checked) {
        ratingSelected = radio.value;
      }
    });

    if (!ratingSelected) {
      ratingSelected = 0;
    }

    var status = document.querySelectorAll('#status-box input');
    var statusSelected;
    status.forEach(function (item) {
      if (item.checked) {
        statusSelected = item.value;
      }
    });

    var meat = document.querySelector('#meat-type').value;

    if (otherMeat.value !== '') {
      meat = otherMeat.value;
    }

    var cookingDevice = document.querySelector('#cooking-device').value;

    if (otherDevice.value !== '') {
      cookingDevice = otherDevice.value;
    }

    var basicData = {
      date: document.querySelector('#date-select').value, // find a way to get this value
      session_name: document.querySelector('#session-name').value,
      cooking_device: document.querySelector('#cooking-device').value,
      device_other: document.querySelector('#device-other-text').value,
      meat: document.querySelector('#meat-type').value,
      meat_other: document.querySelector('#meat-other-text').value,
      weight: document.querySelector('#weight').value,
      meat_notes: document.querySelector('#meat-notes').value,
      cook_temperature: document.querySelector('#temp-slider').value,
      estimated_time: document.querySelector('#estimated-time').value,
      fuel: document.querySelector('#fuel').value,
      brand: document.querySelector('#brand').value,
      wood: document.querySelector('#wood').value,
      wood_other: document.querySelector('#wood-other-text').value,
      rating: ratingSelected,
      status: statusSelected,
      username: document.querySelector('#username').textContent,
      updated: new Date(),
      other_ingredients: document.querySelector('#other-ingredients').value,
      recipe_guideline: document.querySelector('#recipe-guideline').value,
      final: document.querySelector('#final-comments').value
    };

    var ol = document.querySelector('ol');
    var items = ol.getElementsByTagName('li');
    var stepInfo = [];

    Array.from(items).forEach(function (item) {
      var stepObject = {};
      stepObject.step = item.querySelector('.step-text').value;
      stepObject.completed = item.querySelector('.complete-check').checked;
      stepObject.time = item.querySelector('.time').value;
      stepObject.notes = item.querySelector('.complete-notes').value;
      stepInfo.push(stepObject);
    });

    var displayedPics = document.querySelectorAll('.pic img');
    var displayedPicsArray = [];

    Array.from(displayedPics).forEach(function (displayedPic) {
      var picsObject = {};
      var attr = displayedPic.getAttribute('src');
      var filename = attr.split('/').pop();
      picsObject.filename = filename;
      displayedPicsArray.push(picsObject);
    });

    var logData = Object.assign({ steps: stepInfo }, { pics: displayedPicsArray }, basicData);

    if (navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/BlackBerry/i) || navigator.userAgent.match(/Windows Phone/i)) {
      updateLog(logData);
    } else {

      var f = new FormData();
      f.append('logData', JSON.stringify(logData));

      f.append('pics', document.querySelector('#file1').files[0]);
      f.append('pics', document.querySelector('#file2').files[0]);
      f.append('pics', document.querySelector('#file3').files[0]);
      f.append('pics', document.querySelector('#file4').files[0]);
      f.append('pics', document.querySelector('#file5').files[0]);

      var url = window.location.pathname;
      var logId = url.split('/').pop();

      xhrPromiseUpdate(f).then(res => {

        var loader = document.querySelector('.pop');
        loader.parentNode.removeChild(loader);

        var logBody = document.querySelector('#log-body');
        var div = document.createElement('div');
        var popHTML = "<p>Log updated</p>";

        div.classList.add('pop-update');
        div.innerHTML = popHTML;
        logBody.appendChild(div);

        setTimeout(function () {
          div.classList.add('pop-update-fade');
        }, 0);

        setTimeout(function () {
          div.classList.remove('pop-update-fade');

          setTimeout(function () {
            div.parentNode.removeChild(div);
          }, 1000);
        }, 2000);

        // add/remove public link on update without page refresh
        var h3 = document.querySelector('h3');
        var pubLink = document.querySelector('#pub-link');
        var status = document.querySelectorAll('#status-box input');
        var statusSelected;

        status.forEach(function (item) {
          if (item.checked) {
            statusSelected = item.value;
          }
        });

        if (statusSelected === 'Private' && h3) {
          pubLink.removeChild(h3);
        }

        if (statusSelected === 'Public' && !h3) {
          var h3 = document.createElement('h3');
          var url = window.location.pathname;
          var logId = url.split('/').pop();
          var h3Content = "<a href='/public-log/" + logId + "'>Public link here</a>";
          h3.innerHTML = h3Content;
          pubLink.appendChild(h3);
        }

        // add/remove pictures on update without page refresh
        var picsBox = document.querySelector('.pics-box');
        var logPics = document.querySelectorAll('.pic');

        logPics.forEach(function (pic) {
          pic.parentNode.removeChild(pic);
        });

        var response = JSON.parse(res);
        var newPics = response.pics;

        if (newPics) {
          newPics.forEach(function (pic) {
            var picDiv = document.createElement('div');
            picDiv.classList.add('pic');

            picsBox.appendChild(picDiv);
            picDiv.innerHTML = "<img src='https://s3-us-west-1.amazonaws.com/bbqtracker/" + pic.filename + "'><button type='button' class='remove-pic'>Remove Picture</button>";
          });
        }

        // add/remove file upload fields on update without page refresh
        var uploadBox = document.querySelector('.pics-upload-box');
        var uploadBtns = document.querySelectorAll('.pic-upload');

        uploadBtns.forEach(function (btn) {
          btn.parentNode.removeChild(btn);
        });

        for (var i = 1; i < 6; i++) {
          var uploadDiv = document.createElement('div');
          uploadDiv.classList.add('pic-upload');

          uploadBox.appendChild(uploadDiv);
          uploadDiv.innerHTML = "<label>Upload Picture " + [i] + "</label><input id='file" + [i] + "' type='file' name='file" + [i] + "'>";
        }
      });
    }
  });
}

// updating log
var url = window.location.pathname;
var logId = url.split('/').pop();

function xhrPromiseUpdate(f) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open('put', '/view-log/' + logId);
    xhr.addEventListener('load', function () {
      if (xhr.readyState == XMLHttpRequest.DONE) {
        resolve(xhr.responseText);
      }
    });
    xhr.addEventListener('error', reject);

    xhr.send(f);
  });
}

// updating log - mobile
function updateLog(logData) {
  fetch('/view-log/' + logId, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(logData),
    mode: 'cors',
    cache: 'default',
    credentials: 'include'
  }).then(function () {

    var loader = document.querySelector('.pop');
    loader.parentNode.removeChild(loader);

    var logBody = document.querySelector('#log-body');
    var div = document.createElement('div');
    var popHTML = "<p>Log updated</p>";

    div.classList.add('pop-update');
    div.innerHTML = popHTML;
    logBody.appendChild(div);

    setTimeout(function () {
      div.classList.add('pop-update-fade');
    }, 0);

    setTimeout(function () {
      div.classList.remove('pop-update-fade');

      setTimeout(function () {
        div.parentNode.removeChild(div);
      }, 1000);
    }, 2000);

    // add/remove public link on update without page refresh
    var h3 = document.querySelector('h3');
    var pubLink = document.querySelector('#pub-link');
    var status = document.querySelectorAll('#status-box input');
    var statusSelected;

    status.forEach(function (item) {
      if (item.checked) {
        statusSelected = item.value;
      }
    });

    if (statusSelected === 'Private' && h3) {
      pubLink.removeChild(h3);
    }

    if (statusSelected === 'Public' && !h3) {
      var h3 = document.createElement('h3');
      var url = window.location.pathname;
      var logId = url.split('/').pop();
      var h3Content = "<a href='/public-log/" + logId + "'>Public link here</a>";
      h3.innerHTML = h3Content;
      pubLink.appendChild(h3);
    }
  });
}

// log history controls
var modify = document.querySelector('#log-action-btn');
if (modify) {
  modify.addEventListener('click', function () {
    var modOption = document.querySelector('#log-action-options').value;
    var logs = document.querySelectorAll('.log-select');
    var selectedLogs = [];

    logs.forEach(function (log) {
      if (log.checked) {
        var id = log.closest('tr').getAttribute('id');
        selectedLogs.push(id);
      }
    });

    if (modOption === 'Copy') {
      copyLogs(selectedLogs);
    } else if (modOption === 'Delete') {
      deleteLogs(selectedLogs);
    } else if (modOption === 'Switch Status') {
      statusLogs(selectedLogs);
    }
  });
}

function copyLogs(selected) {
  fetch('/log-history', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(selected),
    mode: 'cors',
    cache: 'default',
    credentials: 'include'
  }).then(function (res) {
    return res.json();
  }).then(function (res) {
    if (res.message === "Logs copied") {
      window.location = '/log-history?message=Logs%20copied';
    } else if (res.error === "No logs selected") {
      window.location = '/log-history?error=No%20logs%20selected';
    }
  });
}

function deleteLogs(selected) {
  fetch('/log-history', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(selected),
    mode: 'cors',
    cache: 'default',
    credentials: 'include'
  }).then(function (res) {
    window.location = '/log-history?message=Logs%20deleted';
  });
}

function statusLogs(selected) {
  fetch('/log-history', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(selected),
    mode: 'cors',
    cache: 'default',
    credentials: 'include'
  }).then(function (res) {
    window.location = '/log-history?message=Log%20status%20switched';
  });
}

// add votes to public log
var voteBtn = document.querySelector('#vote-btn');
if (voteBtn) {
  voteBtn.addEventListener('click', function () {

    var url = window.location.pathname;
    var logId = url.split('/').pop();

    var log = {
      author: document.querySelector('#author').textContent,
      logId: logId
    };

    addVote(log);
  });
}

function addVote(log) {
  fetch('/public-log', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(log),
    mode: 'cors',
    cache: 'default',
    credentials: 'include'
  }).then(function (res) {
    return res.json();
  }).then(function (res) {
    var updatedVotes = res.votes;
    var voteCount = document.querySelector('#vote-count');
    var voteCountBox = document.querySelector('#vote-count-box');
    var voteBtn = document.querySelector('#vote-btn');

    voteCount.innerHTML = updatedVotes;
    voteBtn.parentNode.removeChild(voteBtn);

    var div = document.createElement('div');
    div.style.float = 'right';
    voteCountBox.appendChild(div);
    div.innerHTML = 'Voted';
  });
}

/***** ACCOUNTS PAGE *****/

// displaying option fields on click
var newUsername = document.querySelector('#new-username-btn');
var newEmail = document.querySelector('#new-email-btn');
var newPW = document.querySelector('#new-pw-btn');
var deleteAccount = document.querySelector('#delete-account-btn');

if (newUsername) {
  newUsername.addEventListener('click', function (event) {
    var field = document.querySelector('#new-username-field');
    field.classList.toggle('hidden');
  });
}

if (newEmail) {
  newEmail.addEventListener('click', function (event) {
    var field = document.querySelector('#new-email-field');
    field.classList.toggle('hidden');
  });
}

if (newPW) {
  newPW.addEventListener('click', function (event) {
    var field = document.querySelector('#new-pw-field');
    field.classList.toggle('hidden');
  });
}

if (deleteAccount) {
  deleteAccount.addEventListener('click', function (event) {
    var field = document.querySelector('#delete-account-field');
    field.classList.toggle('hidden');
  });
}

// new username
var newUsernameSubmit = document.querySelector('#new-username-submit');
if (newUsernameSubmit) {
  newUsernameSubmit.addEventListener('click', function () {

    var newUsernameValue = { username: document.querySelector('#new-username').value };
    changeUsername(newUsernameValue);
  });
}

function changeUsername(newUsernameValue) {
  fetch('/account/username', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newUsernameValue),
    mode: 'cors',
    cache: 'default',
    credentials: 'include'
  }).then(function (res) {
    return res.json();
  }).then(function (res) {
    if (res.message === "Username changed") {
      window.location = '/account?message=Username%20changed';
    } else if (res.error === "Supply a new username") {
      window.location = '/account?error=Supply%20a%20new%20username';
    } else if (res.error === "No spaces allowed in username") {
      window.location = '/account?error=No%20spaces%20allowed%20in%20username';
    } else if (res.error === "Username is limited to 15 characters") {
      window.location = '/account?error=Username%20is%20limited%20to%2015%20characters';
    }
  });
}

// change avatar
var cowAvatar = document.querySelector('#cow-avatar');
var chickenAvatar = document.querySelector('#chicken-avatar');
var pigAvatar = document.querySelector('#pig-avatar');

if (cowAvatar && !cowAvatar.classList.contains('avatar-highlight')) {
  cowAvatar.addEventListener('click', function () {
    var avatarReq = { avatar: '../images/cow.svg' };
    changeAvatar(avatarReq);
  });
}

if (chickenAvatar && !chickenAvatar.classList.contains('avatar-highlight')) {
  chickenAvatar.addEventListener('click', function () {
    var avatarReq = { avatar: '../images/chicken.svg' };
    changeAvatar(avatarReq);
  });
}

if (pigAvatar && !pigAvatar.classList.contains('avatar-highlight')) {
  pigAvatar.addEventListener('click', function () {
    var avatarReq = { avatar: '../images/pig.svg' };
    changeAvatar(avatarReq);
  });
}

function changeAvatar(avatarReq) {
  fetch('/account/avatar', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(avatarReq),
    mode: 'cors',
    cache: 'default',
    credentials: 'include'
  }).then(function (res) {
    window.location = '/account?message=Avatar%20changed';
  });
}

// change email
var newEmailSubmit = document.querySelector('#new-email-submit');
if (newEmailSubmit) {
  newEmailSubmit.addEventListener('click', function () {

    var newEmailValue = { email: document.querySelector('#new-reg-email').value };
    changeEmail(newEmailValue);
  });
}

function changeEmail(newEmailValue) {
  fetch('/account/email', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newEmailValue),
    mode: 'cors',
    cache: 'default',
    credentials: 'include'
  }).then(function (res) {
    return res.json();
  }).then(function (res) {
    if (res.message === 'Email changed') {
      window.location = '/account?message=Email%20changed';
    } else if (res.error === 'Supply an email address') {
      window.location = '/account?error=Supply%20an%20email%20address';
    } else if (res.error === 'No spaces allowed in email address') {
      window.location = '/account?error=No%20spaces%20allowed%20in%20email%20address';
    } else if (res.error === 'Email does not contain @') {
      window.location = '/account?error=Email%20does%20not%20contain%20@';
    }
  });
}

// change password
var newPasswordSubmit = document.querySelector('#new-pw-submit');
if (newPasswordSubmit) {
  newPasswordSubmit.addEventListener('click', function () {

    var newPW = {
      password: document.querySelector('#new-pw').value,
      password2: document.querySelector('#new-pw2').value
    };

    changePW(newPW);
  });
}

function changePW(newPW) {
  fetch('/account/password', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newPW),
    mode: 'cors',
    cache: 'default',
    credentials: 'include'
  }).then(function (res) {
    return res.json();
  }).then(function (res) {
    if (res.message === 'Password changed') {
      window.location = '/account?message=Password%20changed';
    } else if (res.error === 'Supply a password') {
      window.location = '/account?error=Supply%20a%20password';
    } else if (res.error === 'Password must be a minimum of 5 characters') {
      window.location = '/account?error=Password%20must%20be%20a%20minimum%20of%205%20characters';
    } else if (res.error === 'Confirm your password') {
      window.location = '/account?error=Confirm%20your%20password';
    } else if (res.error === 'Passwords do not match') {
      window.location = '/account?error=Passwords%20do%20not%20match';
    }
  });
}

// delete account
var popDeleteUser = document.querySelector('#pop-del-user');
var accountMain = document.querySelector('#account-main');

var deleteAccountSubmit = document.querySelector('#delete-account-submit');
if (deleteAccountSubmit) {
  deleteAccountSubmit.addEventListener('click', function () {
    var div = document.createElement('div');
    var popHTML = "<p>Confirming will delete your profile. Are you sure?</p><div id='pop-del-options'><button id='del-yes'>Yes</button><button id='del-no'>No</button></div>";

    div.setAttribute('id', 'pop-del');
    div.innerHTML = popHTML;
    accountMain.appendChild(div);

    var delNo = document.querySelector('#del-no');
    if (delNo) {
      delNo.addEventListener('click', function () {
        var popDel = document.querySelector('#pop-del');
        popDel.parentNode.removeChild(popDel);
      });
    }

    var delYes = document.querySelector('#del-yes');
    if (delYes) {
      delYes.addEventListener('click', function () {
        deleteUser();
      });
    }
  });
}

function deleteUser() {
  fetch('/account', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    mode: 'cors',
    cache: 'default',
    credentials: 'include'
  }).then(function (res) {
    window.location = '/';
  });
}

},{"formdata-polyfill":2}],6:[function(require,module,exports){
/*
    datepickr 3.0 - pick your date not your nose

    https://github.com/joshsalverda/datepickr

    Copyright © 2014 Josh Salverda <josh.salverda@gmail.com>
    This work is free. You can redistribute it and/or modify it under the
    terms of the Do What The Fuck You Want To Public License, Version 2,
    as published by Sam Hocevar. See http://www.wtfpl.net/ for more details.
*/

document.addEventListener('DOMContentLoaded', function () {
    datepickr('#date-select');
});

var datepickr = function (selector, config) {
    'use strict';

    var elements,
        createInstance,
        instances = [],
        i;

    datepickr.prototype = datepickr.init.prototype;

    createInstance = function (element) {
        if (element._datepickr) {
            element._datepickr.destroy();
        }
        element._datepickr = new datepickr.init(element, config);
        return element._datepickr;
    };

    if (selector.nodeName) {
        return createInstance(selector);
    }

    elements = datepickr.prototype.querySelectorAll(selector);

    if (elements.length === 1) {
        return createInstance(elements[0]);
    }

    for (i = 0; i < elements.length; i++) {
        instances.push(createInstance(elements[i]));
    }
    return instances;
};

datepickr.init = function (element, instanceConfig) {
    'use strict';

    var self = this,
        defaultConfig = {
        dateFormat: 'F j, Y',
        altFormat: null,
        altInput: null,
        minDate: null,
        maxDate: null,
        shorthandCurrentMonth: false
    },
        calendarContainer = document.createElement('div'),
        navigationCurrentMonth = document.createElement('span'),
        calendar = document.createElement('table'),
        calendarBody = document.createElement('tbody'),
        wrapperElement,
        currentDate = new Date(),
        wrap,
        date,
        formatDate,
        monthToStr,
        isSpecificDay,
        buildWeekdays,
        buildDays,
        updateNavigationCurrentMonth,
        buildMonthNavigation,
        handleYearChange,
        documentClick,
        calendarClick,
        buildCalendar,
        getOpenEvent,
        bind,
        open,
        close,
        destroy,
        init;

    calendarContainer.className = 'datepickr-calendar';
    navigationCurrentMonth.className = 'datepickr-current-month';
    instanceConfig = instanceConfig || {};

    wrap = function () {
        wrapperElement = document.createElement('div');
        wrapperElement.className = 'datepickr-wrapper';
        self.element.parentNode.insertBefore(wrapperElement, self.element);
        wrapperElement.appendChild(self.element);
    };

    date = {
        current: {
            year: function () {
                return currentDate.getFullYear();
            },
            month: {
                integer: function () {
                    return currentDate.getMonth();
                },
                string: function (shorthand) {
                    var month = currentDate.getMonth();
                    return monthToStr(month, shorthand);
                }
            },
            day: function () {
                return currentDate.getDate();
            }
        },
        month: {
            string: function () {
                return monthToStr(self.currentMonthView, self.config.shorthandCurrentMonth);
            },
            numDays: function () {
                // checks to see if february is a leap year otherwise return the respective # of days
                return self.currentMonthView === 1 && (self.currentYearView % 4 === 0 && self.currentYearView % 100 !== 0 || self.currentYearView % 400 === 0) ? 29 : self.l10n.daysInMonth[self.currentMonthView];
            }
        }
    };

    formatDate = function (dateFormat, milliseconds) {
        var formattedDate = '',
            dateObj = new Date(milliseconds),
            formats = {
            d: function () {
                var day = formats.j();
                return day < 10 ? '0' + day : day;
            },
            D: function () {
                return self.l10n.weekdays.shorthand[formats.w()];
            },
            j: function () {
                return dateObj.getDate();
            },
            l: function () {
                return self.l10n.weekdays.longhand[formats.w()];
            },
            w: function () {
                return dateObj.getDay();
            },
            F: function () {
                return monthToStr(formats.n() - 1, false);
            },
            m: function () {
                var month = formats.n();
                return month < 10 ? '0' + month : month;
            },
            M: function () {
                return monthToStr(formats.n() - 1, true);
            },
            n: function () {
                return dateObj.getMonth() + 1;
            },
            U: function () {
                return dateObj.getTime() / 1000;
            },
            y: function () {
                return String(formats.Y()).substring(2);
            },
            Y: function () {
                return dateObj.getFullYear();
            }
        },
            formatPieces = dateFormat.split('');

        self.forEach(formatPieces, function (formatPiece, index) {
            if (formats[formatPiece] && formatPieces[index - 1] !== '\\') {
                formattedDate += formats[formatPiece]();
            } else {
                if (formatPiece !== '\\') {
                    formattedDate += formatPiece;
                }
            }
        });

        return formattedDate;
    };

    monthToStr = function (date, shorthand) {
        if (shorthand === true) {
            return self.l10n.months.shorthand[date];
        }

        return self.l10n.months.longhand[date];
    };

    isSpecificDay = function (day, month, year, comparison) {
        return day === comparison && self.currentMonthView === month && self.currentYearView === year;
    };

    buildWeekdays = function () {
        var weekdayContainer = document.createElement('thead'),
            firstDayOfWeek = self.l10n.firstDayOfWeek,
            weekdays = self.l10n.weekdays.shorthand;

        if (firstDayOfWeek > 0 && firstDayOfWeek < weekdays.length) {
            weekdays = [].concat(weekdays.splice(firstDayOfWeek, weekdays.length), weekdays.splice(0, firstDayOfWeek));
        }

        weekdayContainer.innerHTML = '<tr><th>' + weekdays.join('</th><th>') + '</th></tr>';
        calendar.appendChild(weekdayContainer);
    };

    buildDays = function () {
        var firstOfMonth = new Date(self.currentYearView, self.currentMonthView, 1).getDay(),
            numDays = date.month.numDays(),
            calendarFragment = document.createDocumentFragment(),
            row = document.createElement('tr'),
            dayCount,
            dayNumber,
            today = '',
            selected = '',
            disabled = '',
            currentTimestamp;

        // Offset the first day by the specified amount
        firstOfMonth -= self.l10n.firstDayOfWeek;
        if (firstOfMonth < 0) {
            firstOfMonth += 7;
        }

        dayCount = firstOfMonth;
        calendarBody.innerHTML = '';

        // Add spacer to line up the first day of the month correctly
        if (firstOfMonth > 0) {
            row.innerHTML += '<td colspan="' + firstOfMonth + '">&nbsp;</td>';
        }

        // Start at 1 since there is no 0th day
        for (dayNumber = 1; dayNumber <= numDays; dayNumber++) {
            // if we have reached the end of a week, wrap to the next line
            if (dayCount === 7) {
                calendarFragment.appendChild(row);
                row = document.createElement('tr');
                dayCount = 0;
            }

            today = isSpecificDay(date.current.day(), date.current.month.integer(), date.current.year(), dayNumber) ? ' today' : '';
            if (self.selectedDate) {
                selected = isSpecificDay(self.selectedDate.day, self.selectedDate.month, self.selectedDate.year, dayNumber) ? ' selected' : '';
            }

            if (self.config.minDate || self.config.maxDate) {
                currentTimestamp = new Date(self.currentYearView, self.currentMonthView, dayNumber).getTime();
                disabled = '';

                if (self.config.minDate && currentTimestamp < self.config.minDate) {
                    disabled = ' disabled';
                }

                if (self.config.maxDate && currentTimestamp > self.config.maxDate) {
                    disabled = ' disabled';
                }
            }

            row.innerHTML += '<td class="' + today + selected + disabled + '"><span class="datepickr-day">' + dayNumber + '</span></td>';
            dayCount++;
        }

        calendarFragment.appendChild(row);
        calendarBody.appendChild(calendarFragment);
    };

    updateNavigationCurrentMonth = function () {
        navigationCurrentMonth.innerHTML = date.month.string() + ' ' + self.currentYearView;
    };

    buildMonthNavigation = function () {
        var months = document.createElement('div'),
            monthNavigation;

        monthNavigation = '<span class="datepickr-prev-month">&lt;</span>';
        monthNavigation += '<span class="datepickr-next-month">&gt;</span>';

        months.className = 'datepickr-months';
        months.innerHTML = monthNavigation;

        months.appendChild(navigationCurrentMonth);
        updateNavigationCurrentMonth();
        calendarContainer.appendChild(months);
    };

    handleYearChange = function () {
        if (self.currentMonthView < 0) {
            self.currentYearView--;
            self.currentMonthView = 11;
        }

        if (self.currentMonthView > 11) {
            self.currentYearView++;
            self.currentMonthView = 0;
        }
    };

    documentClick = function (event) {
        var parent;
        if (event.target !== self.element && event.target !== wrapperElement) {
            parent = event.target.parentNode;
            if (parent !== wrapperElement) {
                while (parent !== wrapperElement) {
                    parent = parent.parentNode;
                    if (parent === null) {
                        close();
                        break;
                    }
                }
            }
        }
    };

    calendarClick = function (event) {
        var target = event.target,
            targetClass = target.className,
            currentTimestamp;

        if (targetClass) {
            if (targetClass === 'datepickr-prev-month' || targetClass === 'datepickr-next-month') {
                if (targetClass === 'datepickr-prev-month') {
                    self.currentMonthView--;
                } else {
                    self.currentMonthView++;
                }

                handleYearChange();
                updateNavigationCurrentMonth();
                buildDays();
            } else if (targetClass === 'datepickr-day' && !self.hasClass(target.parentNode, 'disabled')) {
                self.selectedDate = {
                    day: parseInt(target.innerHTML, 10),
                    month: self.currentMonthView,
                    year: self.currentYearView
                };

                currentTimestamp = new Date(self.currentYearView, self.currentMonthView, self.selectedDate.day).getTime();

                if (self.config.altInput) {
                    if (self.config.altFormat) {
                        self.config.altInput.value = formatDate(self.config.altFormat, currentTimestamp);
                    } else {
                        // I don't know why someone would want to do this... but just in case?
                        self.config.altInput.value = formatDate(self.config.dateFormat, currentTimestamp);
                    }
                }

                self.element.value = formatDate(self.config.dateFormat, currentTimestamp);

                close();
                buildDays();
            }
        }
    };

    buildCalendar = function () {
        buildMonthNavigation();
        buildWeekdays();
        buildDays();

        calendar.appendChild(calendarBody);
        calendarContainer.appendChild(calendar);

        wrapperElement.appendChild(calendarContainer);
    };

    getOpenEvent = function () {
        if (self.element.nodeName === 'INPUT') {
            return 'focus';
        }
        return 'click';
    };

    bind = function () {
        self.addEventListener(self.element, getOpenEvent(), open);
        self.addEventListener(calendarContainer, 'click', calendarClick);
    };

    open = function () {
        self.addEventListener(document, 'click', documentClick);
        self.addClass(wrapperElement, 'open');
    };

    close = function () {
        self.removeEventListener(document, 'click', documentClick);
        self.removeClass(wrapperElement, 'open');
    };

    destroy = function () {
        var parent, element;

        self.removeEventListener(document, 'click', documentClick);
        self.removeEventListener(self.element, getOpenEvent(), open);

        parent = self.element.parentNode;
        parent.removeChild(calendarContainer);
        element = parent.removeChild(self.element);
        parent.parentNode.replaceChild(element, parent);
    };

    init = function () {
        var config, parsedDate;

        self.config = {};
        self.destroy = destroy;

        for (config in defaultConfig) {
            self.config[config] = instanceConfig[config] || defaultConfig[config];
        }

        self.element = element;

        if (self.element.value) {
            parsedDate = Date.parse(self.element.value);
        }

        if (parsedDate && !isNaN(parsedDate)) {
            parsedDate = new Date(parsedDate);
            self.selectedDate = {
                day: parsedDate.getDate(),
                month: parsedDate.getMonth(),
                year: parsedDate.getFullYear()
            };
            self.currentYearView = self.selectedDate.year;
            self.currentMonthView = self.selectedDate.month;
            self.currentDayView = self.selectedDate.day;
        } else {
            self.selectedDate = null;
            self.currentYearView = date.current.year();
            self.currentMonthView = date.current.month.integer();
            self.currentDayView = date.current.day();
        }

        wrap();
        buildCalendar();
        bind();
    };

    init();

    return self;
};

datepickr.init.prototype = {
    hasClass: function (element, className) {
        return element.classList.contains(className);
    },
    addClass: function (element, className) {
        element.classList.add(className);
    },
    removeClass: function (element, className) {
        element.classList.remove(className);
    },
    forEach: function (items, callback) {
        [].forEach.call(items, callback);
    },
    querySelectorAll: document.querySelectorAll.bind(document),
    isArray: Array.isArray,
    addEventListener: function (element, type, listener, useCapture) {
        element.addEventListener(type, listener, useCapture);
    },
    removeEventListener: function (element, type, listener, useCapture) {
        element.removeEventListener(type, listener, useCapture);
    },
    l10n: {
        weekdays: {
            shorthand: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            longhand: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        },
        months: {
            shorthand: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            longhand: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        },
        daysInMonth: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
        firstDayOfWeek: 0
    }
};

},{}],7:[function(require,module,exports){
'use strict';

var hamburger = document.querySelector('#hamburger');

if (hamburger) {
  hamburger.addEventListener('click', function () {
    var mobileOut = document.querySelector('#mobile-out');

    if (mobileOut.classList.contains('visible')) {

      setTimeout(function () {
        mobileOut.classList.add('animateNav');
        mobileOut.classList.toggle('nav-open');

        setTimeout(function () {
          mobileOut.classList.remove('visible');
        }, 400);
      }, 0);
    } else {

      setTimeout(function () {
        mobileOut.classList.add('visible');

        setTimeout(function () {
          mobileOut.classList.add('animateNav');
          mobileOut.classList.toggle('nav-open');

          setTimeout(function () {
            mobileOut.classList.remove('animateNav');
          }, 400);
        }, 100);
      }, 0);
    }
  });
}

},{}],8:[function(require,module,exports){
/*
  SortTable
  version 2
  7th April 2007
  Stuart Langridge, http://www.kryogenix.org/code/browser/sorttable/

  Instructions:
  Download this file
  Add <script src="sorttable.js"></script> to your HTML
  Add class="sortable" to any table you'd like to make sortable
  Click on the headers to sort

  Thanks to many, many people for contributions and suggestions.
  Licenced as X11: http://www.kryogenix.org/code/browser/licence.html
  This basically means: do what you want with it.
*/

var stIsIE = /*@cc_on!@*/false;

sorttable = {
  init: function () {
    // quit if this function has already been called
    if (arguments.callee.done) return;
    // flag this function so we don't do the same thing twice
    arguments.callee.done = true;
    // kill the timer
    if (_timer) clearInterval(_timer);

    if (!document.createElement || !document.getElementsByTagName) return;

    sorttable.DATE_RE = /^(\d\d?)[\/\.-](\d\d?)[\/\.-]((\d\d)?\d\d)$/;

    forEach(document.getElementsByTagName('table'), function (table) {
      if (table.className.search(/\bsortable\b/) != -1) {
        sorttable.makeSortable(table);
      }
    });
  },

  makeSortable: function (table) {
    if (table.getElementsByTagName('thead').length == 0) {
      // table doesn't have a tHead. Since it should have, create one and
      // put the first table row in it.
      the = document.createElement('thead');
      the.appendChild(table.rows[0]);
      table.insertBefore(the, table.firstChild);
    }
    // Safari doesn't support table.tHead, sigh
    if (table.tHead == null) table.tHead = table.getElementsByTagName('thead')[0];

    if (table.tHead.rows.length != 1) return; // can't cope with two header rows

    // Sorttable v1 put rows with a class of "sortbottom" at the bottom (as
    // "total" rows, for example). This is B&R, since what you're supposed
    // to do is put them in a tfoot. So, if there are sortbottom rows,
    // for backwards compatibility, move them to tfoot (creating it if needed).
    sortbottomrows = [];
    for (var i = 0; i < table.rows.length; i++) {
      if (table.rows[i].className.search(/\bsortbottom\b/) != -1) {
        sortbottomrows[sortbottomrows.length] = table.rows[i];
      }
    }
    if (sortbottomrows) {
      if (table.tFoot == null) {
        // table doesn't have a tfoot. Create one.
        tfo = document.createElement('tfoot');
        table.appendChild(tfo);
      }
      for (var i = 0; i < sortbottomrows.length; i++) {
        tfo.appendChild(sortbottomrows[i]);
      }
      // delete sortbottomrows;
      sortbottomrows = null;
    }

    // work through each column and calculate its type
    headrow = table.tHead.rows[0].cells;
    for (var i = 0; i < headrow.length; i++) {
      // manually override the type with a sorttable_type attribute
      if (!headrow[i].className.match(/\bsorttable_nosort\b/)) {
        // skip this col
        mtch = headrow[i].className.match(/\bsorttable_([a-z0-9]+)\b/);
        if (mtch) {
          override = mtch[1];
        }
        if (mtch && typeof sorttable["sort_" + override] == 'function') {
          headrow[i].sorttable_sortfunction = sorttable["sort_" + override];
        } else {
          headrow[i].sorttable_sortfunction = sorttable.guessType(table, i);
        }
        // make it clickable to sort
        headrow[i].sorttable_columnindex = i;
        headrow[i].sorttable_tbody = table.tBodies[0];
        dean_addEvent(headrow[i], "click", sorttable.innerSortFunction = function (e) {

          if (this.className.search(/\bsorttable_sorted\b/) != -1) {
            // if we're already sorted by this column, just
            // reverse the table, which is quicker
            sorttable.reverse(this.sorttable_tbody);
            this.className = this.className.replace('sorttable_sorted', 'sorttable_sorted_reverse');
            this.removeChild(document.getElementById('sorttable_sortfwdind'));
            sortrevind = document.createElement('span');
            sortrevind.id = "sorttable_sortrevind";
            sortrevind.innerHTML = stIsIE ? '&nbsp<font face="webdings">5</font>' : '&nbsp;&#x25B4;';
            this.appendChild(sortrevind);
            return;
          }
          if (this.className.search(/\bsorttable_sorted_reverse\b/) != -1) {
            // if we're already sorted by this column in reverse, just
            // re-reverse the table, which is quicker
            sorttable.reverse(this.sorttable_tbody);
            this.className = this.className.replace('sorttable_sorted_reverse', 'sorttable_sorted');
            this.removeChild(document.getElementById('sorttable_sortrevind'));
            sortfwdind = document.createElement('span');
            sortfwdind.id = "sorttable_sortfwdind";
            sortfwdind.innerHTML = stIsIE ? '&nbsp<font face="webdings">6</font>' : '&nbsp;&#x25BE;';
            this.appendChild(sortfwdind);
            return;
          }

          // remove sorttable_sorted classes
          theadrow = this.parentNode;
          forEach(theadrow.childNodes, function (cell) {
            if (cell.nodeType == 1) {
              // an element
              cell.className = cell.className.replace('sorttable_sorted_reverse', '');
              cell.className = cell.className.replace('sorttable_sorted', '');
            }
          });
          sortfwdind = document.getElementById('sorttable_sortfwdind');
          if (sortfwdind) {
            sortfwdind.parentNode.removeChild(sortfwdind);
          }
          sortrevind = document.getElementById('sorttable_sortrevind');
          if (sortrevind) {
            sortrevind.parentNode.removeChild(sortrevind);
          }

          this.className += ' sorttable_sorted';
          sortfwdind = document.createElement('span');
          sortfwdind.id = "sorttable_sortfwdind";
          sortfwdind.innerHTML = stIsIE ? '&nbsp<font face="webdings">6</font>' : '&nbsp;&#x25BE;';
          this.appendChild(sortfwdind);

          // build an array to sort. This is a Schwartzian transform thing,
          // i.e., we "decorate" each row with the actual sort key,
          // sort based on the sort keys, and then put the rows back in order
          // which is a lot faster because you only do getInnerText once per row
          row_array = [];
          col = this.sorttable_columnindex;
          rows = this.sorttable_tbody.rows;
          for (var j = 0; j < rows.length; j++) {
            row_array[row_array.length] = [sorttable.getInnerText(rows[j].cells[col]), rows[j]];
          }
          /* If you want a stable sort, uncomment the following line */
          //sorttable.shaker_sort(row_array, this.sorttable_sortfunction);
          /* and comment out this one */
          row_array.sort(this.sorttable_sortfunction);

          tb = this.sorttable_tbody;
          for (var j = 0; j < row_array.length; j++) {
            tb.appendChild(row_array[j][1]);
          }

          // delete row_array;
          row_array = null;
        });
      }
    }
  },

  guessType: function (table, column) {
    // guess the type of a column based on its first non-blank row
    sortfn = sorttable.sort_alpha;
    for (var i = 0; i < table.tBodies[0].rows.length; i++) {
      text = sorttable.getInnerText(table.tBodies[0].rows[i].cells[column]);
      if (text != '') {
        if (text.match(/^-?[�$�]?[\d,.]+%?$/)) {
          return sorttable.sort_numeric;
        }
        // check for a date: dd/mm/yyyy or dd/mm/yy
        // can have / or . or - as separator
        // can be mm/dd as well
        possdate = text.match(sorttable.DATE_RE);
        if (possdate) {
          // looks like a date
          first = parseInt(possdate[1]);
          second = parseInt(possdate[2]);
          if (first > 12) {
            // definitely dd/mm
            return sorttable.sort_ddmm;
          } else if (second > 12) {
            return sorttable.sort_mmdd;
          } else {
            // looks like a date, but we can't tell which, so assume
            // that it's dd/mm (English imperialism!) and keep looking
            sortfn = sorttable.sort_ddmm;
          }
        }
      }
    }
    return sortfn;
  },

  getInnerText: function (node) {
    // gets the text we want to use for sorting for a cell.
    // strips leading and trailing whitespace.
    // this is *not* a generic getInnerText function; it's special to sorttable.
    // for example, you can override the cell text with a customkey attribute.
    // it also gets .value for <input> fields.

    if (!node) return "";

    hasInputs = typeof node.getElementsByTagName == 'function' && node.getElementsByTagName('input').length;

    if (node.getAttribute("sorttable_customkey") != null) {
      return node.getAttribute("sorttable_customkey");
    } else if (typeof node.textContent != 'undefined' && !hasInputs) {
      return node.textContent.replace(/^\s+|\s+$/g, '');
    } else if (typeof node.innerText != 'undefined' && !hasInputs) {
      return node.innerText.replace(/^\s+|\s+$/g, '');
    } else if (typeof node.text != 'undefined' && !hasInputs) {
      return node.text.replace(/^\s+|\s+$/g, '');
    } else {
      switch (node.nodeType) {
        case 3:
          if (node.nodeName.toLowerCase() == 'input') {
            return node.value.replace(/^\s+|\s+$/g, '');
          }
        case 4:
          return node.nodeValue.replace(/^\s+|\s+$/g, '');
          break;
        case 1:
        case 11:
          var innerText = '';
          for (var i = 0; i < node.childNodes.length; i++) {
            innerText += sorttable.getInnerText(node.childNodes[i]);
          }
          return innerText.replace(/^\s+|\s+$/g, '');
          break;
        default:
          return '';
      }
    }
  },

  reverse: function (tbody) {
    // reverse the rows in a tbody
    newrows = [];
    for (var i = 0; i < tbody.rows.length; i++) {
      newrows[newrows.length] = tbody.rows[i];
    }
    for (var i = newrows.length - 1; i >= 0; i--) {
      tbody.appendChild(newrows[i]);
    }
    // delete newrows;
    newrows = null;
  },

  /* sort functions
     each sort function takes two parameters, a and b
     you are comparing a[0] and b[0] */
  sort_numeric: function (a, b) {
    aa = parseFloat(a[0].replace(/[^0-9.-]/g, ''));
    if (isNaN(aa)) aa = 0;
    bb = parseFloat(b[0].replace(/[^0-9.-]/g, ''));
    if (isNaN(bb)) bb = 0;
    return aa - bb;
  },
  sort_alpha: function (a, b) {
    if (a[0] == b[0]) return 0;
    if (a[0] < b[0]) return -1;
    return 1;
  },
  sort_ddmm: function (a, b) {
    mtch = a[0].match(sorttable.DATE_RE);
    y = mtch[3];m = mtch[2];d = mtch[1];
    if (m.length == 1) m = '0' + m;
    if (d.length == 1) d = '0' + d;
    dt1 = y + m + d;
    mtch = b[0].match(sorttable.DATE_RE);
    y = mtch[3];m = mtch[2];d = mtch[1];
    if (m.length == 1) m = '0' + m;
    if (d.length == 1) d = '0' + d;
    dt2 = y + m + d;
    if (dt1 == dt2) return 0;
    if (dt1 < dt2) return -1;
    return 1;
  },
  sort_mmdd: function (a, b) {
    mtch = a[0].match(sorttable.DATE_RE);
    y = mtch[3];d = mtch[2];m = mtch[1];
    if (m.length == 1) m = '0' + m;
    if (d.length == 1) d = '0' + d;
    dt1 = y + m + d;
    mtch = b[0].match(sorttable.DATE_RE);
    y = mtch[3];d = mtch[2];m = mtch[1];
    if (m.length == 1) m = '0' + m;
    if (d.length == 1) d = '0' + d;
    dt2 = y + m + d;
    if (dt1 == dt2) return 0;
    if (dt1 < dt2) return -1;
    return 1;
  },

  shaker_sort: function (list, comp_func) {
    // A stable sort function to allow multi-level sorting of data
    // see: http://en.wikipedia.org/wiki/Cocktail_sort
    // thanks to Joseph Nahmias
    var b = 0;
    var t = list.length - 1;
    var swap = true;

    while (swap) {
      swap = false;
      for (var i = b; i < t; ++i) {
        if (comp_func(list[i], list[i + 1]) > 0) {
          var q = list[i];list[i] = list[i + 1];list[i + 1] = q;
          swap = true;
        }
      } // for
      t--;

      if (!swap) break;

      for (var i = t; i > b; --i) {
        if (comp_func(list[i], list[i - 1]) < 0) {
          var q = list[i];list[i] = list[i - 1];list[i - 1] = q;
          swap = true;
        }
      } // for
      b++;
    } // while(swap)
  }
};

/* ******************************************************************
   Supporting functions: bundled here to avoid depending on a library
   ****************************************************************** */

// Dean Edwards/Matthias Miller/John Resig

/* for Mozilla/Opera9 */
if (document.addEventListener) {
  document.addEventListener("DOMContentLoaded", sorttable.init, false);
}

/* for Internet Explorer */
/*@cc_on @*/
/*@if (@_win32)
    document.write("<script id=__ie_onload defer src=javascript:void(0)><\/script>");
    var script = document.getElementById("__ie_onload");
    script.onreadystatechange = function() {
        if (this.readyState == "complete") {
            sorttable.init(); // call the onload handler
        }
    };
/*@end @*/

/* for Safari */
if (/WebKit/i.test(navigator.userAgent)) {
  // sniff
  var _timer = setInterval(function () {
    if (/loaded|complete/.test(document.readyState)) {
      sorttable.init(); // call the onload handler
    }
  }, 10);
}

/* for other browsers */
window.onload = sorttable.init;

// written by Dean Edwards, 2005
// with input from Tino Zijdel, Matthias Miller, Diego Perini

// http://dean.edwards.name/weblog/2005/10/add-event/

function dean_addEvent(element, type, handler) {
  if (element.addEventListener) {
    element.addEventListener(type, handler, false);
  } else {
    // assign each event handler a unique ID
    if (!handler.$$guid) handler.$$guid = dean_addEvent.guid++;
    // create a hash table of event types for the element
    if (!element.events) element.events = {};
    // create a hash table of event handlers for each element/event pair
    var handlers = element.events[type];
    if (!handlers) {
      handlers = element.events[type] = {};
      // store the existing event handler (if there is one)
      if (element["on" + type]) {
        handlers[0] = element["on" + type];
      }
    }
    // store the event handler in the hash table
    handlers[handler.$$guid] = handler;
    // assign a global event handler to do all the work
    element["on" + type] = handleEvent;
  }
};
// a counter used to create unique IDs
dean_addEvent.guid = 1;

function removeEvent(element, type, handler) {
  if (element.removeEventListener) {
    element.removeEventListener(type, handler, false);
  } else {
    // delete the event handler from the hash table
    if (element.events && element.events[type]) {
      delete element.events[type][handler.$$guid];
    }
  }
};

function handleEvent(event) {
  var returnValue = true;
  // grab the event object (IE uses a global event object)
  event = event || fixEvent(((this.ownerDocument || this.document || this).parentWindow || window).event);
  // get a reference to the hash table of event handlers
  var handlers = this.events[event.type];
  // execute each event handler
  for (var i in handlers) {
    this.$$handleEvent = handlers[i];
    if (this.$$handleEvent(event) === false) {
      returnValue = false;
    }
  }
  return returnValue;
};

function fixEvent(event) {
  // add W3C standard event methods
  event.preventDefault = fixEvent.preventDefault;
  event.stopPropagation = fixEvent.stopPropagation;
  return event;
};
fixEvent.preventDefault = function () {
  this.returnValue = false;
};
fixEvent.stopPropagation = function () {
  this.cancelBubble = true;
};

// Dean's forEach: http://dean.edwards.name/base/forEach.js
/*
	forEach, version 1.0
	Copyright 2006, Dean Edwards
	License: http://www.opensource.org/licenses/mit-license.php
*/

// array-like enumeration
if (!Array.forEach) {
  // mozilla already supports this
  Array.forEach = function (array, block, context) {
    for (var i = 0; i < array.length; i++) {
      block.call(context, array[i], i, array);
    }
  };
}

// generic enumeration
Function.prototype.forEach = function (object, block, context) {
  for (var key in object) {
    if (typeof this.prototype[key] == "undefined") {
      block.call(context, object[key], key, object);
    }
  }
};

// character enumeration
String.forEach = function (string, block, context) {
  Array.forEach(string.split(""), function (chr, index) {
    block.call(context, chr, index, string);
  });
};

// globally resolve forEach enumeration
var forEach = function (object, block, context) {
  if (object) {
    var resolve = Object; // default
    if (object instanceof Function) {
      // functions have a "length" property
      resolve = Function;
    } else if (object.forEach instanceof Function) {
      // the object implements a custom forEach method so use that
      object.forEach(block, context);
      return;
    } else if (typeof object == "string") {
      // the object is a string
      resolve = String;
    } else if (typeof object.length == "number") {
      // the object is array-like
      resolve = Array;
    }
    resolve.forEach(object, block, context);
  }
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQuanMiLCJub2RlX21vZHVsZXMvZm9ybWRhdGEtcG9seWZpbGwvRm9ybURhdGEuanMiLCJub2RlX21vZHVsZXMvbW9tZW50L21vbWVudC5qcyIsIm5vZGVfbW9kdWxlcy93aGF0d2ctZmV0Y2gvZmV0Y2guanMiLCJwdWJsaWMvanMvYXBwLmpzIiwicHVibGljL2pzL2RhdGVwaWNrci5qcyIsInB1YmxpYy9qcy9uYXYuanMiLCJwdWJsaWMvanMvc29ydHRhYmxlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsSUFBSSxNQUFNLFFBQVEsb0JBQVIsQ0FBVjtBQUNBLElBQUksTUFBTSxRQUFRLG9CQUFSLENBQVY7QUFDQSxJQUFJLFlBQVksUUFBUSwwQkFBUixDQUFoQjtBQUNBLElBQUksU0FBUyxRQUFRLFFBQVIsQ0FBYjtBQUNBLElBQUksWUFBWSxRQUFRLDBCQUFSLENBQWhCO0FBQ0EsSUFBSSxRQUFRLFFBQVEsY0FBUixDQUFaOzs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN3NJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QjtBQUNBO0FBQ0EsS0FKTSxNQUlBLElBQUksT0FBTyxNQUFQLElBQWlCLFFBQXJCLEVBQStCO0FBQ3JDO0FBQ0EsZ0JBQVUsTUFBVjtBQUNBLEtBSE0sTUFHQSxJQUFJLE9BQU8sT0FBTyxNQUFkLElBQXdCLFFBQTVCLEVBQXNDO0FBQzVDO0FBQ0EsZ0JBQVUsS0FBVjtBQUNBO0FBQ0QsWUFBUSxPQUFSLENBQWdCLE1BQWhCLEVBQXdCLEtBQXhCLEVBQStCLE9BQS9CO0FBQ0E7QUFDRCxDQW5CRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgYXBwID0gcmVxdWlyZSgnLi9wdWJsaWMvanMvYXBwLmpzJylcbnZhciBuYXYgPSByZXF1aXJlKCcuL3B1YmxpYy9qcy9uYXYuanMnKVxudmFyIGRhdGVwaWNrciA9IHJlcXVpcmUoJy4vcHVibGljL2pzL2RhdGVwaWNrci5qcycpXG52YXIgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50JylcbnZhciBzb3J0dGFibGUgPSByZXF1aXJlKCcuL3B1YmxpYy9qcy9zb3J0dGFibGUuanMnKVxudmFyIGZldGNoID0gcmVxdWlyZSgnd2hhdHdnLWZldGNoJykiLCJjb25zdCBtYXAgPSBuZXcgV2Vha01hcFxuY29uc3Qgd20gPSBvID0+IG1hcC5nZXQobylcblxuZnVuY3Rpb24gbm9ybWFsaXplVmFsdWUoW3ZhbHVlLCBmaWxlbmFtZV0pIHtcbiAgaWYgKHZhbHVlIGluc3RhbmNlb2YgQmxvYilcbiAgICB2YWx1ZSA9IG5ldyBGaWxlKFt2YWx1ZV0sIGZpbGVuYW1lLCB7XG4gICAgICB0eXBlOiB2YWx1ZS50eXBlLFxuICAgICAgbGFzdE1vZGlmaWVkOiB2YWx1ZS5sYXN0TW9kaWZpZWRcbiAgICB9KVxuXG4gIHJldHVybiB2YWx1ZVxufVxuXG5mdW5jdGlvbiBzdHJpbmdpZnkobmFtZSkge1xuICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIFxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJzEgYXJndW1lbnQgcmVxdWlyZWQsIGJ1dCBvbmx5IDAgcHJlc2VudC4nKVxuXG4gIHJldHVybiBbbmFtZSArICcnXVxufVxuXG5mdW5jdGlvbiBub3JtYWxpemVBcmdzKG5hbWUsIHZhbHVlLCBmaWxlbmFtZSkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDIpIFxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYDIgYXJndW1lbnRzIHJlcXVpcmVkLCBidXQgb25seSAke2FyZ3VtZW50cy5sZW5ndGh9IHByZXNlbnQuYClcbiAgICBcbiAgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgQmxvYiBcbiAgICA/IFtuYW1lICsgJycsIHZhbHVlLCBmaWxlbmFtZSAhPT0gdW5kZWZpbmVkIFxuICAgICAgPyBmaWxlbmFtZSArICcnIFxuICAgICAgOiB2YWx1ZVtTeW1ib2wudG9TdHJpbmdUYWddID09PSAnRmlsZSdcbiAgICAgICAgPyB2YWx1ZS5uYW1lIFxuICAgICAgICA6ICdCbG9iJ11cbiAgICA6IFtuYW1lICsgJycsIHZhbHVlICsgJyddXG59XG5cbi8qKlxuICogQGltcGxlbWVudHMge0l0ZXJhYmxlfVxuICovXG5jbGFzcyBGb3JtRGF0YVBvbHlmaWxsIHtcblxuICAvKipcbiAgICogRm9ybURhdGEgY2xhc3NcbiAgICpcbiAgICogQHBhcmFtIHtIVE1MRWxlbWVudD19IGZvcm1cbiAgICovXG4gIGNvbnN0cnVjdG9yKGZvcm0pIHtcbiAgICBtYXAuc2V0KHRoaXMsIE9iamVjdC5jcmVhdGUobnVsbCkpXG5cbiAgICBpZiAoIWZvcm0pXG4gICAgICByZXR1cm4gdGhpc1xuXG4gICAgZm9yIChsZXQge25hbWUsIHR5cGUsIHZhbHVlLCBmaWxlcywgY2hlY2tlZCwgc2VsZWN0ZWRPcHRpb25zfSBvZiBBcnJheS5mcm9tKGZvcm0uZWxlbWVudHMpKSB7XG4gICAgICBpZighbmFtZSkgY29udGludWVcblxuICAgICAgaWYgKHR5cGUgPT09ICdmaWxlJylcbiAgICAgICAgZm9yIChsZXQgZmlsZSBvZiBmaWxlcylcbiAgICAgICAgICB0aGlzLmFwcGVuZChuYW1lLCBmaWxlKVxuICAgICAgZWxzZSBpZiAodHlwZSA9PT0gJ3NlbGVjdC1tdWx0aXBsZScgfHwgdHlwZSA9PT0gJ3NlbGVjdC1vbmUnKVxuICAgICAgICBmb3IgKGxldCBlbG0gb2Ygc2VsZWN0ZWRPcHRpb25zKVxuICAgICAgICAgIHRoaXMuYXBwZW5kKG5hbWUsIGVsbS52YWx1ZSlcbiAgICAgIGVsc2UgaWYgKHR5cGUgPT09ICdjaGVja2JveCcpXG4gICAgICAgIGlmIChjaGVja2VkKSB0aGlzLmFwcGVuZChuYW1lLCB2YWx1ZSlcbiAgICAgIGVsc2VcbiAgICAgICAgdGhpcy5hcHBlbmQobmFtZSwgdmFsdWUpXG4gICAgfVxuICB9XG5cblxuICAvKipcbiAgICogQXBwZW5kIGEgZmllbGRcbiAgICpcbiAgICogQHBhcmFtICAge1N0cmluZ30gICAgICAgICAgIG5hbWUgICAgICBmaWVsZCBuYW1lXG4gICAqIEBwYXJhbSAgIHtTdHJpbmd8QmxvYnxGaWxlfSB2YWx1ZSAgICAgc3RyaW5nIC8gYmxvYiAvIGZpbGVcbiAgICogQHBhcmFtICAge1N0cmluZz19ICAgICAgICAgIGZpbGVuYW1lICBmaWxlbmFtZSB0byB1c2Ugd2l0aCBibG9iXG4gICAqIEByZXR1cm4gIHtVbmRlZmluZWR9XG4gICAqL1xuICBhcHBlbmQobmFtZSwgdmFsdWUsIGZpbGVuYW1lKSB7XG4gICAgbGV0IG1hcCA9IHdtKHRoaXMpXG5cbiAgICBpZiAoIW1hcFtuYW1lXSlcbiAgICAgIG1hcFtuYW1lXSA9IFtdXG5cbiAgICBtYXBbbmFtZV0ucHVzaChbdmFsdWUsIGZpbGVuYW1lXSlcbiAgfVxuXG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhbGwgZmllbGRzIHZhbHVlcyBnaXZlbiBuYW1lXG4gICAqXG4gICAqIEBwYXJhbSAgIHtTdHJpbmd9ICBuYW1lICBGaWVsZCBuYW1lXG4gICAqIEByZXR1cm4gIHtVbmRlZmluZWR9XG4gICAqL1xuICBkZWxldGUobmFtZSkge1xuICAgIGRlbGV0ZSB3bSh0aGlzKVtuYW1lXVxuICB9XG5cblxuICAvKipcbiAgICogSXRlcmF0ZSBvdmVyIGFsbCBmaWVsZHMgYXMgW25hbWUsIHZhbHVlXVxuICAgKlxuICAgKiBAcmV0dXJuIHtJdGVyYXRvcn1cbiAgICovXG4gICplbnRyaWVzKCkge1xuICAgIGxldCBtYXAgPSB3bSh0aGlzKVxuXG4gICAgZm9yIChsZXQgbmFtZSBpbiBtYXApXG4gICAgICBmb3IgKGxldCB2YWx1ZSBvZiBtYXBbbmFtZV0pXG4gICAgICAgIHlpZWxkIFtuYW1lLCBub3JtYWxpemVWYWx1ZSh2YWx1ZSldXG4gIH1cblxuICAvKipcbiAgICogSXRlcmF0ZSBvdmVyIGFsbCBmaWVsZHNcbiAgICpcbiAgICogQHBhcmFtICAge0Z1bmN0aW9ufSAgY2FsbGJhY2sgIEV4ZWN1dGVkIGZvciBlYWNoIGl0ZW0gd2l0aCBwYXJhbWV0ZXJzICh2YWx1ZSwgbmFtZSwgdGhpc0FyZylcbiAgICogQHBhcmFtICAge09iamVjdD19ICAgdGhpc0FyZyAgIGB0aGlzYCBjb250ZXh0IGZvciBjYWxsYmFjayBmdW5jdGlvblxuICAgKiBAcmV0dXJuICB7VW5kZWZpbmVkfVxuICAgKi9cbiAgZm9yRWFjaChjYWxsYmFjaywgdGhpc0FyZykge1xuICAgIGZvciAobGV0IFtuYW1lLCB2YWx1ZV0gb2YgdGhpcylcbiAgICAgIGNhbGxiYWNrLmNhbGwodGhpc0FyZywgdmFsdWUsIG5hbWUsIHRoaXMpXG4gIH1cblxuXG4gIC8qKlxuICAgKiBSZXR1cm4gZmlyc3QgZmllbGQgdmFsdWUgZ2l2ZW4gbmFtZVxuICAgKlxuICAgKiBAcGFyYW0gICB7U3RyaW5nfSAgbmFtZSAgRmllbGQgbmFtZVxuICAgKiBAcmV0dXJuICB7U3RyaW5nfEZpbGV9ICAgdmFsdWUgRmllbGRzIHZhbHVlXG4gICAqL1xuICBnZXQobmFtZSkge1xuICAgIGxldCBtYXAgPSB3bSh0aGlzKVxuICAgIHJldHVybiBtYXBbbmFtZV0gPyBub3JtYWxpemVWYWx1ZShtYXBbbmFtZV1bMF0pIDogbnVsbFxuICB9XG5cblxuICAvKipcbiAgICogUmV0dXJuIGFsbCBmaWVsZHMgdmFsdWVzIGdpdmVuIG5hbWVcbiAgICpcbiAgICogQHBhcmFtICAge1N0cmluZ30gIG5hbWUgIEZpZWxkcyBuYW1lXG4gICAqIEByZXR1cm4gIHtBcnJheX0gICAgICAgICBbdmFsdWUsIHZhbHVlXVxuICAgKi9cbiAgZ2V0QWxsKG5hbWUpIHtcbiAgICByZXR1cm4gKHdtKHRoaXMpW25hbWVdIHx8IFtdKS5tYXAobm9ybWFsaXplVmFsdWUpXG4gIH1cblxuXG4gIC8qKlxuICAgKiBDaGVjayBmb3IgZmllbGQgbmFtZSBleGlzdGVuY2VcbiAgICpcbiAgICogQHBhcmFtICAge1N0cmluZ30gICBuYW1lICBGaWVsZCBuYW1lXG4gICAqIEByZXR1cm4gIHtib29sZWFufVxuICAgKi9cbiAgaGFzKG5hbWUpIHtcbiAgICByZXR1cm4gbmFtZSBpbiB3bSh0aGlzKVxuICB9XG4gIFxuXG4gIC8qKlxuICAgKiBJdGVyYXRlIG92ZXIgYWxsIGZpZWxkcyBuYW1lXG4gICAqXG4gICAqIEByZXR1cm4ge0l0ZXJhdG9yfVxuICAgKi9cbiAgKmtleXMoKSB7XG4gICAgZm9yIChsZXQgW25hbWVdIG9mIHRoaXMpXG4gICAgICB5aWVsZCBuYW1lXG4gIH1cblxuXG4gIC8qKlxuICAgKiBPdmVyd3JpdGUgYWxsIHZhbHVlcyBnaXZlbiBuYW1lXG4gICAqXG4gICAqIEBwYXJhbSAgIHtTdHJpbmd9ICAgIG5hbWUgICAgICBGaWxlZCBuYW1lXG4gICAqIEBwYXJhbSAgIHtTdHJpbmd9ICAgIHZhbHVlICAgICBGaWVsZCB2YWx1ZVxuICAgKiBAcGFyYW0gICB7U3RyaW5nPX0gICBmaWxlbmFtZSAgRmlsZW5hbWUgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuICB7VW5kZWZpbmVkfVxuICAgKi9cbiAgc2V0KG5hbWUsIHZhbHVlLCBmaWxlbmFtZSkge1xuICAgIHdtKHRoaXMpW25hbWVdID0gW1t2YWx1ZSwgZmlsZW5hbWVdXVxuICB9XG5cblxuICAvKipcbiAgICogSXRlcmF0ZSBvdmVyIGFsbCBmaWVsZHNcbiAgICpcbiAgICogQHJldHVybiB7SXRlcmF0b3J9XG4gICAqL1xuICAqdmFsdWVzKCkge1xuICAgIGZvciAobGV0IFtuYW1lLCB2YWx1ZV0gb2YgdGhpcylcbiAgICAgIHlpZWxkIHZhbHVlXG4gIH1cblxuXG4gIC8qKlxuICAgKiBOb24gc3RhbmRhcmQgYnV0IGl0IGhhcyBiZWVuIHByb3Bvc2VkOiBodHRwczovL2dpdGh1Yi5jb20vdzNjL0ZpbGVBUEkvaXNzdWVzLzQwXG4gICAqXG4gICAqIEByZXR1cm4ge1JlYWRhYmxlU3RyZWFtfVxuICAgKi9cbiAgc3RyZWFtKCkge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gdGhpcy5fYmxvYigpLnN0cmVhbSgpXG4gICAgfSBjYXRjaChlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luY2x1ZGUgaHR0cHM6Ly9naXRodWIuY29tL2ppbW15d2FydGluZy9TY3Jldy1GaWxlUmVhZGVyIGZvciBzdHJlYW1pbmcgc3VwcG9ydCcpXG4gICAgfVxuICB9XG5cblxuICAvKipcbiAgICogUmV0dXJuIGEgbmF0aXZlIChwZXJoYXBzIGRlZ3JhZGVkKSBGb3JtRGF0YSB3aXRoIG9ubHkgYSBgYXBwZW5kYCBtZXRob2RcbiAgICogQ2FuIHRocm93IGlmIGl0J3Mgbm90IHN1cHBvcnRlZFxuICAgKlxuICAgKiBAcmV0dXJuIHtGb3JtRGF0YX1cbiAgICovXG4gIF9hc05hdGl2ZSgpIHtcbiAgICBsZXQgZmQgPSBuZXcgRm9ybURhdGFcblxuICAgIGZvciAobGV0IFtuYW1lLCB2YWx1ZV0gb2YgdGhpcylcbiAgICAgIGZkLmFwcGVuZChuYW1lLCB2YWx1ZSlcblxuICAgIHJldHVybiBmZFxuICB9XG5cblxuICAvKipcbiAgICogW19ibG9iIGRlc2NyaXB0aW9uXVxuICAgKlxuICAgKiBAcmV0dXJuIHtCbG9ifSBbZGVzY3JpcHRpb25dXG4gICAqL1xuICBfYmxvYigpIHtcbiAgICB2YXIgYm91bmRhcnkgPSAnLS0tLUZvcm1EYXRhUG9seWZpbGwnICsgTWF0aC5yYW5kb20oKVxuICAgIHZhciBjaHVua3MgPSBbXVxuXG4gICAgZm9yIChsZXQgW25hbWUsIHZhbHVlXSBvZiB0aGlzKSB7XG4gICAgICBjaHVua3MucHVzaChgLS0ke2JvdW5kYXJ5fVxcclxcbmApXG5cbiAgICAgIGlmICh2YWx1ZVtTeW1ib2wudG9TdHJpbmdUYWddID09PSAnRmlsZScpIHtcbiAgICAgICAgY2h1bmtzLnB1c2goXG4gICAgICAgICAgYENvbnRlbnQtRGlzcG9zaXRpb246IGZvcm0tZGF0YTsgbmFtZT1cIiR7bmFtZX1cIjsgZmlsZW5hbWU9XCIke3ZhbHVlLm5hbWV9XCJcXHJcXG5gLFxuICAgICAgICAgIGBDb250ZW50LVR5cGU6ICR7dmFsdWUudHlwZX1cXHJcXG5cXHJcXG5gLFxuICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgICdcXHJcXG4nXG4gICAgICAgIClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNodW5rcy5wdXNoKFxuICAgICAgICAgIGBDb250ZW50LURpc3Bvc2l0aW9uOiBmb3JtLWRhdGE7IG5hbWU9XCIke25hbWV9XCJcXHJcXG5cXHJcXG4ke3ZhbHVlfVxcclxcbmBcbiAgICAgICAgKVxuICAgICAgfVxuICAgIH1cblxuICAgIGNodW5rcy5wdXNoKGAtLSR7Ym91bmRhcnl9LS1gKVxuXG4gICAgcmV0dXJuIG5ldyBCbG9iKGNodW5rcywge3R5cGU6ICdtdWx0aXBhcnQvZm9ybS1kYXRhOyBib3VuZGFyeT0nICsgYm91bmRhcnl9KVxuICB9XG5cblxuICAvKipcbiAgICogVGhlIGNsYXNzIGl0c2VsZiBpcyBpdGVyYWJsZVxuICAgKiBhbGlhcyBmb3IgZm9ybWRhdGEuZW50cmllcygpXG4gICAqXG4gICAqIEByZXR1cm4gIHtJdGVyYXRvcn1cbiAgICovXG4gIFtTeW1ib2wuaXRlcmF0b3JdKCkge1xuICAgIHJldHVybiB0aGlzLmVudHJpZXMoKVxuICB9XG5cblxuICAvKipcbiAgICogQ3JlYXRlIHRoZSBkZWZhdWx0IHN0cmluZyBkZXNjcmlwdGlvbi5cbiAgICogSXQgaXMgYWNjZXNzZWQgaW50ZXJuYWxseSBieSB0aGUgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZygpLlxuICAgKlxuICAgKiBAcmV0dXJuIHtTdHJpbmd9IEZvcm1EYXRhXG4gICAqL1xuICBnZXQgW1N5bWJvbC50b1N0cmluZ1RhZ10oKSB7XG4gICAgcmV0dXJuICdGb3JtRGF0YSdcbiAgfVxufVxuXG5mb3IgKGxldCBbbWV0aG9kLCBvdmVyaWRlXSBvZiBbXG4gIFsnYXBwZW5kJywgbm9ybWFsaXplQXJnc10sXG4gIFsnZGVsZXRlJywgc3RyaW5naWZ5XSxcbiAgWydnZXQnLCAgICBzdHJpbmdpZnldLFxuICBbJ2dldEFsbCcsIHN0cmluZ2lmeV0sXG4gIFsnaGFzJywgICAgc3RyaW5naWZ5XSxcbiAgWydzZXQnLCAgICBub3JtYWxpemVBcmdzXVxuXSkge1xuICBsZXQgb3JpZyA9IEZvcm1EYXRhUG9seWZpbGwucHJvdG90eXBlW21ldGhvZF1cbiAgRm9ybURhdGFQb2x5ZmlsbC5wcm90b3R5cGVbbWV0aG9kXSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBvcmlnLmFwcGx5KHRoaXMsIG92ZXJpZGUoLi4uYXJndW1lbnRzKSlcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEZvcm1EYXRhUG9seWZpbGxcbiIsIi8vISBtb21lbnQuanNcbi8vISB2ZXJzaW9uIDogMi4xNy4xXG4vLyEgYXV0aG9ycyA6IFRpbSBXb29kLCBJc2tyZW4gQ2hlcm5ldiwgTW9tZW50LmpzIGNvbnRyaWJ1dG9yc1xuLy8hIGxpY2Vuc2UgOiBNSVRcbi8vISBtb21lbnRqcy5jb21cblxuOyhmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG4gICAgdHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnID8gbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCkgOlxuICAgIHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCA/IGRlZmluZShmYWN0b3J5KSA6XG4gICAgZ2xvYmFsLm1vbWVudCA9IGZhY3RvcnkoKVxufSh0aGlzLCAoZnVuY3Rpb24gKCkgeyAndXNlIHN0cmljdCc7XG5cbnZhciBob29rQ2FsbGJhY2s7XG5cbmZ1bmN0aW9uIGhvb2tzICgpIHtcbiAgICByZXR1cm4gaG9va0NhbGxiYWNrLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG59XG5cbi8vIFRoaXMgaXMgZG9uZSB0byByZWdpc3RlciB0aGUgbWV0aG9kIGNhbGxlZCB3aXRoIG1vbWVudCgpXG4vLyB3aXRob3V0IGNyZWF0aW5nIGNpcmN1bGFyIGRlcGVuZGVuY2llcy5cbmZ1bmN0aW9uIHNldEhvb2tDYWxsYmFjayAoY2FsbGJhY2spIHtcbiAgICBob29rQ2FsbGJhY2sgPSBjYWxsYmFjaztcbn1cblxuZnVuY3Rpb24gaXNBcnJheShpbnB1dCkge1xuICAgIHJldHVybiBpbnB1dCBpbnN0YW5jZW9mIEFycmF5IHx8IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChpbnB1dCkgPT09ICdbb2JqZWN0IEFycmF5XSc7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGlucHV0KSB7XG4gICAgLy8gSUU4IHdpbGwgdHJlYXQgdW5kZWZpbmVkIGFuZCBudWxsIGFzIG9iamVjdCBpZiBpdCB3YXNuJ3QgZm9yXG4gICAgLy8gaW5wdXQgIT0gbnVsbFxuICAgIHJldHVybiBpbnB1dCAhPSBudWxsICYmIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChpbnB1dCkgPT09ICdbb2JqZWN0IE9iamVjdF0nO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdEVtcHR5KG9iaikge1xuICAgIHZhciBrO1xuICAgIGZvciAoayBpbiBvYmopIHtcbiAgICAgICAgLy8gZXZlbiBpZiBpdHMgbm90IG93biBwcm9wZXJ0eSBJJ2Qgc3RpbGwgY2FsbCBpdCBub24tZW1wdHlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoaW5wdXQpIHtcbiAgICByZXR1cm4gdHlwZW9mIGlucHV0ID09PSAnbnVtYmVyJyB8fCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoaW5wdXQpID09PSAnW29iamVjdCBOdW1iZXJdJztcbn1cblxuZnVuY3Rpb24gaXNEYXRlKGlucHV0KSB7XG4gICAgcmV0dXJuIGlucHV0IGluc3RhbmNlb2YgRGF0ZSB8fCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoaW5wdXQpID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5cbmZ1bmN0aW9uIG1hcChhcnIsIGZuKSB7XG4gICAgdmFyIHJlcyA9IFtdLCBpO1xuICAgIGZvciAoaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgcmVzLnB1c2goZm4oYXJyW2ldLCBpKSk7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG59XG5cbmZ1bmN0aW9uIGhhc093blByb3AoYSwgYikge1xuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoYSwgYik7XG59XG5cbmZ1bmN0aW9uIGV4dGVuZChhLCBiKSB7XG4gICAgZm9yICh2YXIgaSBpbiBiKSB7XG4gICAgICAgIGlmIChoYXNPd25Qcm9wKGIsIGkpKSB7XG4gICAgICAgICAgICBhW2ldID0gYltpXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChoYXNPd25Qcm9wKGIsICd0b1N0cmluZycpKSB7XG4gICAgICAgIGEudG9TdHJpbmcgPSBiLnRvU3RyaW5nO1xuICAgIH1cblxuICAgIGlmIChoYXNPd25Qcm9wKGIsICd2YWx1ZU9mJykpIHtcbiAgICAgICAgYS52YWx1ZU9mID0gYi52YWx1ZU9mO1xuICAgIH1cblxuICAgIHJldHVybiBhO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVVVEMgKGlucHV0LCBmb3JtYXQsIGxvY2FsZSwgc3RyaWN0KSB7XG4gICAgcmV0dXJuIGNyZWF0ZUxvY2FsT3JVVEMoaW5wdXQsIGZvcm1hdCwgbG9jYWxlLCBzdHJpY3QsIHRydWUpLnV0YygpO1xufVxuXG5mdW5jdGlvbiBkZWZhdWx0UGFyc2luZ0ZsYWdzKCkge1xuICAgIC8vIFdlIG5lZWQgdG8gZGVlcCBjbG9uZSB0aGlzIG9iamVjdC5cbiAgICByZXR1cm4ge1xuICAgICAgICBlbXB0eSAgICAgICAgICAgOiBmYWxzZSxcbiAgICAgICAgdW51c2VkVG9rZW5zICAgIDogW10sXG4gICAgICAgIHVudXNlZElucHV0ICAgICA6IFtdLFxuICAgICAgICBvdmVyZmxvdyAgICAgICAgOiAtMixcbiAgICAgICAgY2hhcnNMZWZ0T3ZlciAgIDogMCxcbiAgICAgICAgbnVsbElucHV0ICAgICAgIDogZmFsc2UsXG4gICAgICAgIGludmFsaWRNb250aCAgICA6IG51bGwsXG4gICAgICAgIGludmFsaWRGb3JtYXQgICA6IGZhbHNlLFxuICAgICAgICB1c2VySW52YWxpZGF0ZWQgOiBmYWxzZSxcbiAgICAgICAgaXNvICAgICAgICAgICAgIDogZmFsc2UsXG4gICAgICAgIHBhcnNlZERhdGVQYXJ0cyA6IFtdLFxuICAgICAgICBtZXJpZGllbSAgICAgICAgOiBudWxsXG4gICAgfTtcbn1cblxuZnVuY3Rpb24gZ2V0UGFyc2luZ0ZsYWdzKG0pIHtcbiAgICBpZiAobS5fcGYgPT0gbnVsbCkge1xuICAgICAgICBtLl9wZiA9IGRlZmF1bHRQYXJzaW5nRmxhZ3MoKTtcbiAgICB9XG4gICAgcmV0dXJuIG0uX3BmO1xufVxuXG52YXIgc29tZTtcbmlmIChBcnJheS5wcm90b3R5cGUuc29tZSkge1xuICAgIHNvbWUgPSBBcnJheS5wcm90b3R5cGUuc29tZTtcbn0gZWxzZSB7XG4gICAgc29tZSA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICAgICAgdmFyIHQgPSBPYmplY3QodGhpcyk7XG4gICAgICAgIHZhciBsZW4gPSB0Lmxlbmd0aCA+Pj4gMDtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoaSBpbiB0ICYmIGZ1bi5jYWxsKHRoaXMsIHRbaV0sIGksIHQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbn1cblxudmFyIHNvbWUkMSA9IHNvbWU7XG5cbmZ1bmN0aW9uIGlzVmFsaWQobSkge1xuICAgIGlmIChtLl9pc1ZhbGlkID09IG51bGwpIHtcbiAgICAgICAgdmFyIGZsYWdzID0gZ2V0UGFyc2luZ0ZsYWdzKG0pO1xuICAgICAgICB2YXIgcGFyc2VkUGFydHMgPSBzb21lJDEuY2FsbChmbGFncy5wYXJzZWREYXRlUGFydHMsIGZ1bmN0aW9uIChpKSB7XG4gICAgICAgICAgICByZXR1cm4gaSAhPSBudWxsO1xuICAgICAgICB9KTtcbiAgICAgICAgdmFyIGlzTm93VmFsaWQgPSAhaXNOYU4obS5fZC5nZXRUaW1lKCkpICYmXG4gICAgICAgICAgICBmbGFncy5vdmVyZmxvdyA8IDAgJiZcbiAgICAgICAgICAgICFmbGFncy5lbXB0eSAmJlxuICAgICAgICAgICAgIWZsYWdzLmludmFsaWRNb250aCAmJlxuICAgICAgICAgICAgIWZsYWdzLmludmFsaWRXZWVrZGF5ICYmXG4gICAgICAgICAgICAhZmxhZ3MubnVsbElucHV0ICYmXG4gICAgICAgICAgICAhZmxhZ3MuaW52YWxpZEZvcm1hdCAmJlxuICAgICAgICAgICAgIWZsYWdzLnVzZXJJbnZhbGlkYXRlZCAmJlxuICAgICAgICAgICAgKCFmbGFncy5tZXJpZGllbSB8fCAoZmxhZ3MubWVyaWRpZW0gJiYgcGFyc2VkUGFydHMpKTtcblxuICAgICAgICBpZiAobS5fc3RyaWN0KSB7XG4gICAgICAgICAgICBpc05vd1ZhbGlkID0gaXNOb3dWYWxpZCAmJlxuICAgICAgICAgICAgICAgIGZsYWdzLmNoYXJzTGVmdE92ZXIgPT09IDAgJiZcbiAgICAgICAgICAgICAgICBmbGFncy51bnVzZWRUb2tlbnMubGVuZ3RoID09PSAwICYmXG4gICAgICAgICAgICAgICAgZmxhZ3MuYmlnSG91ciA9PT0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKE9iamVjdC5pc0Zyb3plbiA9PSBudWxsIHx8ICFPYmplY3QuaXNGcm96ZW4obSkpIHtcbiAgICAgICAgICAgIG0uX2lzVmFsaWQgPSBpc05vd1ZhbGlkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGlzTm93VmFsaWQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG0uX2lzVmFsaWQ7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUludmFsaWQgKGZsYWdzKSB7XG4gICAgdmFyIG0gPSBjcmVhdGVVVEMoTmFOKTtcbiAgICBpZiAoZmxhZ3MgIT0gbnVsbCkge1xuICAgICAgICBleHRlbmQoZ2V0UGFyc2luZ0ZsYWdzKG0pLCBmbGFncyk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBnZXRQYXJzaW5nRmxhZ3MobSkudXNlckludmFsaWRhdGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gbTtcbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoaW5wdXQpIHtcbiAgICByZXR1cm4gaW5wdXQgPT09IHZvaWQgMDtcbn1cblxuLy8gUGx1Z2lucyB0aGF0IGFkZCBwcm9wZXJ0aWVzIHNob3VsZCBhbHNvIGFkZCB0aGUga2V5IGhlcmUgKG51bGwgdmFsdWUpLFxuLy8gc28gd2UgY2FuIHByb3Blcmx5IGNsb25lIG91cnNlbHZlcy5cbnZhciBtb21lbnRQcm9wZXJ0aWVzID0gaG9va3MubW9tZW50UHJvcGVydGllcyA9IFtdO1xuXG5mdW5jdGlvbiBjb3B5Q29uZmlnKHRvLCBmcm9tKSB7XG4gICAgdmFyIGksIHByb3AsIHZhbDtcblxuICAgIGlmICghaXNVbmRlZmluZWQoZnJvbS5faXNBTW9tZW50T2JqZWN0KSkge1xuICAgICAgICB0by5faXNBTW9tZW50T2JqZWN0ID0gZnJvbS5faXNBTW9tZW50T2JqZWN0O1xuICAgIH1cbiAgICBpZiAoIWlzVW5kZWZpbmVkKGZyb20uX2kpKSB7XG4gICAgICAgIHRvLl9pID0gZnJvbS5faTtcbiAgICB9XG4gICAgaWYgKCFpc1VuZGVmaW5lZChmcm9tLl9mKSkge1xuICAgICAgICB0by5fZiA9IGZyb20uX2Y7XG4gICAgfVxuICAgIGlmICghaXNVbmRlZmluZWQoZnJvbS5fbCkpIHtcbiAgICAgICAgdG8uX2wgPSBmcm9tLl9sO1xuICAgIH1cbiAgICBpZiAoIWlzVW5kZWZpbmVkKGZyb20uX3N0cmljdCkpIHtcbiAgICAgICAgdG8uX3N0cmljdCA9IGZyb20uX3N0cmljdDtcbiAgICB9XG4gICAgaWYgKCFpc1VuZGVmaW5lZChmcm9tLl90em0pKSB7XG4gICAgICAgIHRvLl90em0gPSBmcm9tLl90em07XG4gICAgfVxuICAgIGlmICghaXNVbmRlZmluZWQoZnJvbS5faXNVVEMpKSB7XG4gICAgICAgIHRvLl9pc1VUQyA9IGZyb20uX2lzVVRDO1xuICAgIH1cbiAgICBpZiAoIWlzVW5kZWZpbmVkKGZyb20uX29mZnNldCkpIHtcbiAgICAgICAgdG8uX29mZnNldCA9IGZyb20uX29mZnNldDtcbiAgICB9XG4gICAgaWYgKCFpc1VuZGVmaW5lZChmcm9tLl9wZikpIHtcbiAgICAgICAgdG8uX3BmID0gZ2V0UGFyc2luZ0ZsYWdzKGZyb20pO1xuICAgIH1cbiAgICBpZiAoIWlzVW5kZWZpbmVkKGZyb20uX2xvY2FsZSkpIHtcbiAgICAgICAgdG8uX2xvY2FsZSA9IGZyb20uX2xvY2FsZTtcbiAgICB9XG5cbiAgICBpZiAobW9tZW50UHJvcGVydGllcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGZvciAoaSBpbiBtb21lbnRQcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICBwcm9wID0gbW9tZW50UHJvcGVydGllc1tpXTtcbiAgICAgICAgICAgIHZhbCA9IGZyb21bcHJvcF07XG4gICAgICAgICAgICBpZiAoIWlzVW5kZWZpbmVkKHZhbCkpIHtcbiAgICAgICAgICAgICAgICB0b1twcm9wXSA9IHZhbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0bztcbn1cblxudmFyIHVwZGF0ZUluUHJvZ3Jlc3MgPSBmYWxzZTtcblxuLy8gTW9tZW50IHByb3RvdHlwZSBvYmplY3RcbmZ1bmN0aW9uIE1vbWVudChjb25maWcpIHtcbiAgICBjb3B5Q29uZmlnKHRoaXMsIGNvbmZpZyk7XG4gICAgdGhpcy5fZCA9IG5ldyBEYXRlKGNvbmZpZy5fZCAhPSBudWxsID8gY29uZmlnLl9kLmdldFRpbWUoKSA6IE5hTik7XG4gICAgaWYgKCF0aGlzLmlzVmFsaWQoKSkge1xuICAgICAgICB0aGlzLl9kID0gbmV3IERhdGUoTmFOKTtcbiAgICB9XG4gICAgLy8gUHJldmVudCBpbmZpbml0ZSBsb29wIGluIGNhc2UgdXBkYXRlT2Zmc2V0IGNyZWF0ZXMgbmV3IG1vbWVudFxuICAgIC8vIG9iamVjdHMuXG4gICAgaWYgKHVwZGF0ZUluUHJvZ3Jlc3MgPT09IGZhbHNlKSB7XG4gICAgICAgIHVwZGF0ZUluUHJvZ3Jlc3MgPSB0cnVlO1xuICAgICAgICBob29rcy51cGRhdGVPZmZzZXQodGhpcyk7XG4gICAgICAgIHVwZGF0ZUluUHJvZ3Jlc3MgPSBmYWxzZTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGlzTW9tZW50IChvYmopIHtcbiAgICByZXR1cm4gb2JqIGluc3RhbmNlb2YgTW9tZW50IHx8IChvYmogIT0gbnVsbCAmJiBvYmouX2lzQU1vbWVudE9iamVjdCAhPSBudWxsKTtcbn1cblxuZnVuY3Rpb24gYWJzRmxvb3IgKG51bWJlcikge1xuICAgIGlmIChudW1iZXIgPCAwKSB7XG4gICAgICAgIC8vIC0wIC0+IDBcbiAgICAgICAgcmV0dXJuIE1hdGguY2VpbChudW1iZXIpIHx8IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IobnVtYmVyKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHRvSW50KGFyZ3VtZW50Rm9yQ29lcmNpb24pIHtcbiAgICB2YXIgY29lcmNlZE51bWJlciA9ICthcmd1bWVudEZvckNvZXJjaW9uLFxuICAgICAgICB2YWx1ZSA9IDA7XG5cbiAgICBpZiAoY29lcmNlZE51bWJlciAhPT0gMCAmJiBpc0Zpbml0ZShjb2VyY2VkTnVtYmVyKSkge1xuICAgICAgICB2YWx1ZSA9IGFic0Zsb29yKGNvZXJjZWROdW1iZXIpO1xuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZTtcbn1cblxuLy8gY29tcGFyZSB0d28gYXJyYXlzLCByZXR1cm4gdGhlIG51bWJlciBvZiBkaWZmZXJlbmNlc1xuZnVuY3Rpb24gY29tcGFyZUFycmF5cyhhcnJheTEsIGFycmF5MiwgZG9udENvbnZlcnQpIHtcbiAgICB2YXIgbGVuID0gTWF0aC5taW4oYXJyYXkxLmxlbmd0aCwgYXJyYXkyLmxlbmd0aCksXG4gICAgICAgIGxlbmd0aERpZmYgPSBNYXRoLmFicyhhcnJheTEubGVuZ3RoIC0gYXJyYXkyLmxlbmd0aCksXG4gICAgICAgIGRpZmZzID0gMCxcbiAgICAgICAgaTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgaWYgKChkb250Q29udmVydCAmJiBhcnJheTFbaV0gIT09IGFycmF5MltpXSkgfHxcbiAgICAgICAgICAgICghZG9udENvbnZlcnQgJiYgdG9JbnQoYXJyYXkxW2ldKSAhPT0gdG9JbnQoYXJyYXkyW2ldKSkpIHtcbiAgICAgICAgICAgIGRpZmZzKys7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGRpZmZzICsgbGVuZ3RoRGlmZjtcbn1cblxuZnVuY3Rpb24gd2Fybihtc2cpIHtcbiAgICBpZiAoaG9va3Muc3VwcHJlc3NEZXByZWNhdGlvbldhcm5pbmdzID09PSBmYWxzZSAmJlxuICAgICAgICAgICAgKHR5cGVvZiBjb25zb2xlICE9PSAgJ3VuZGVmaW5lZCcpICYmIGNvbnNvbGUud2Fybikge1xuICAgICAgICBjb25zb2xlLndhcm4oJ0RlcHJlY2F0aW9uIHdhcm5pbmc6ICcgKyBtc2cpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZGVwcmVjYXRlKG1zZywgZm4pIHtcbiAgICB2YXIgZmlyc3RUaW1lID0gdHJ1ZTtcblxuICAgIHJldHVybiBleHRlbmQoZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoaG9va3MuZGVwcmVjYXRpb25IYW5kbGVyICE9IG51bGwpIHtcbiAgICAgICAgICAgIGhvb2tzLmRlcHJlY2F0aW9uSGFuZGxlcihudWxsLCBtc2cpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmaXJzdFRpbWUpIHtcbiAgICAgICAgICAgIHZhciBhcmdzID0gW107XG4gICAgICAgICAgICB2YXIgYXJnO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBhcmcgPSAnJztcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGFyZ3VtZW50c1tpXSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgYXJnICs9ICdcXG5bJyArIGkgKyAnXSAnO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gYXJndW1lbnRzWzBdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmcgKz0ga2V5ICsgJzogJyArIGFyZ3VtZW50c1swXVtrZXldICsgJywgJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBhcmcgPSBhcmcuc2xpY2UoMCwgLTIpOyAvLyBSZW1vdmUgdHJhaWxpbmcgY29tbWEgYW5kIHNwYWNlXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJndW1lbnRzW2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhcmdzLnB1c2goYXJnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHdhcm4obXNnICsgJ1xcbkFyZ3VtZW50czogJyArIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3MpLmpvaW4oJycpICsgJ1xcbicgKyAobmV3IEVycm9yKCkpLnN0YWNrKTtcbiAgICAgICAgICAgIGZpcnN0VGltZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH0sIGZuKTtcbn1cblxudmFyIGRlcHJlY2F0aW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBkZXByZWNhdGVTaW1wbGUobmFtZSwgbXNnKSB7XG4gICAgaWYgKGhvb2tzLmRlcHJlY2F0aW9uSGFuZGxlciAhPSBudWxsKSB7XG4gICAgICAgIGhvb2tzLmRlcHJlY2F0aW9uSGFuZGxlcihuYW1lLCBtc2cpO1xuICAgIH1cbiAgICBpZiAoIWRlcHJlY2F0aW9uc1tuYW1lXSkge1xuICAgICAgICB3YXJuKG1zZyk7XG4gICAgICAgIGRlcHJlY2F0aW9uc1tuYW1lXSA9IHRydWU7XG4gICAgfVxufVxuXG5ob29rcy5zdXBwcmVzc0RlcHJlY2F0aW9uV2FybmluZ3MgPSBmYWxzZTtcbmhvb2tzLmRlcHJlY2F0aW9uSGFuZGxlciA9IG51bGw7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oaW5wdXQpIHtcbiAgICByZXR1cm4gaW5wdXQgaW5zdGFuY2VvZiBGdW5jdGlvbiB8fCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoaW5wdXQpID09PSAnW29iamVjdCBGdW5jdGlvbl0nO1xufVxuXG5mdW5jdGlvbiBzZXQgKGNvbmZpZykge1xuICAgIHZhciBwcm9wLCBpO1xuICAgIGZvciAoaSBpbiBjb25maWcpIHtcbiAgICAgICAgcHJvcCA9IGNvbmZpZ1tpXTtcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24ocHJvcCkpIHtcbiAgICAgICAgICAgIHRoaXNbaV0gPSBwcm9wO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpc1snXycgKyBpXSA9IHByb3A7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5fY29uZmlnID0gY29uZmlnO1xuICAgIC8vIExlbmllbnQgb3JkaW5hbCBwYXJzaW5nIGFjY2VwdHMganVzdCBhIG51bWJlciBpbiBhZGRpdGlvbiB0b1xuICAgIC8vIG51bWJlciArIChwb3NzaWJseSkgc3R1ZmYgY29taW5nIGZyb20gX29yZGluYWxQYXJzZUxlbmllbnQuXG4gICAgdGhpcy5fb3JkaW5hbFBhcnNlTGVuaWVudCA9IG5ldyBSZWdFeHAodGhpcy5fb3JkaW5hbFBhcnNlLnNvdXJjZSArICd8JyArICgvXFxkezEsMn0vKS5zb3VyY2UpO1xufVxuXG5mdW5jdGlvbiBtZXJnZUNvbmZpZ3MocGFyZW50Q29uZmlnLCBjaGlsZENvbmZpZykge1xuICAgIHZhciByZXMgPSBleHRlbmQoe30sIHBhcmVudENvbmZpZyksIHByb3A7XG4gICAgZm9yIChwcm9wIGluIGNoaWxkQ29uZmlnKSB7XG4gICAgICAgIGlmIChoYXNPd25Qcm9wKGNoaWxkQ29uZmlnLCBwcm9wKSkge1xuICAgICAgICAgICAgaWYgKGlzT2JqZWN0KHBhcmVudENvbmZpZ1twcm9wXSkgJiYgaXNPYmplY3QoY2hpbGRDb25maWdbcHJvcF0pKSB7XG4gICAgICAgICAgICAgICAgcmVzW3Byb3BdID0ge307XG4gICAgICAgICAgICAgICAgZXh0ZW5kKHJlc1twcm9wXSwgcGFyZW50Q29uZmlnW3Byb3BdKTtcbiAgICAgICAgICAgICAgICBleHRlbmQocmVzW3Byb3BdLCBjaGlsZENvbmZpZ1twcm9wXSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNoaWxkQ29uZmlnW3Byb3BdICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXNbcHJvcF0gPSBjaGlsZENvbmZpZ1twcm9wXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHJlc1twcm9wXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKHByb3AgaW4gcGFyZW50Q29uZmlnKSB7XG4gICAgICAgIGlmIChoYXNPd25Qcm9wKHBhcmVudENvbmZpZywgcHJvcCkgJiZcbiAgICAgICAgICAgICAgICAhaGFzT3duUHJvcChjaGlsZENvbmZpZywgcHJvcCkgJiZcbiAgICAgICAgICAgICAgICBpc09iamVjdChwYXJlbnRDb25maWdbcHJvcF0pKSB7XG4gICAgICAgICAgICAvLyBtYWtlIHN1cmUgY2hhbmdlcyB0byBwcm9wZXJ0aWVzIGRvbid0IG1vZGlmeSBwYXJlbnQgY29uZmlnXG4gICAgICAgICAgICByZXNbcHJvcF0gPSBleHRlbmQoe30sIHJlc1twcm9wXSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn1cblxuZnVuY3Rpb24gTG9jYWxlKGNvbmZpZykge1xuICAgIGlmIChjb25maWcgIT0gbnVsbCkge1xuICAgICAgICB0aGlzLnNldChjb25maWcpO1xuICAgIH1cbn1cblxudmFyIGtleXM7XG5cbmlmIChPYmplY3Qua2V5cykge1xuICAgIGtleXMgPSBPYmplY3Qua2V5cztcbn0gZWxzZSB7XG4gICAga2V5cyA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgdmFyIGksIHJlcyA9IFtdO1xuICAgICAgICBmb3IgKGkgaW4gb2JqKSB7XG4gICAgICAgICAgICBpZiAoaGFzT3duUHJvcChvYmosIGkpKSB7XG4gICAgICAgICAgICAgICAgcmVzLnB1c2goaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9O1xufVxuXG52YXIga2V5cyQxID0ga2V5cztcblxudmFyIGRlZmF1bHRDYWxlbmRhciA9IHtcbiAgICBzYW1lRGF5IDogJ1tUb2RheSBhdF0gTFQnLFxuICAgIG5leHREYXkgOiAnW1RvbW9ycm93IGF0XSBMVCcsXG4gICAgbmV4dFdlZWsgOiAnZGRkZCBbYXRdIExUJyxcbiAgICBsYXN0RGF5IDogJ1tZZXN0ZXJkYXkgYXRdIExUJyxcbiAgICBsYXN0V2VlayA6ICdbTGFzdF0gZGRkZCBbYXRdIExUJyxcbiAgICBzYW1lRWxzZSA6ICdMJ1xufTtcblxuZnVuY3Rpb24gY2FsZW5kYXIgKGtleSwgbW9tLCBub3cpIHtcbiAgICB2YXIgb3V0cHV0ID0gdGhpcy5fY2FsZW5kYXJba2V5XSB8fCB0aGlzLl9jYWxlbmRhclsnc2FtZUVsc2UnXTtcbiAgICByZXR1cm4gaXNGdW5jdGlvbihvdXRwdXQpID8gb3V0cHV0LmNhbGwobW9tLCBub3cpIDogb3V0cHV0O1xufVxuXG52YXIgZGVmYXVsdExvbmdEYXRlRm9ybWF0ID0ge1xuICAgIExUUyAgOiAnaDptbTpzcyBBJyxcbiAgICBMVCAgIDogJ2g6bW0gQScsXG4gICAgTCAgICA6ICdNTS9ERC9ZWVlZJyxcbiAgICBMTCAgIDogJ01NTU0gRCwgWVlZWScsXG4gICAgTExMICA6ICdNTU1NIEQsIFlZWVkgaDptbSBBJyxcbiAgICBMTExMIDogJ2RkZGQsIE1NTU0gRCwgWVlZWSBoOm1tIEEnXG59O1xuXG5mdW5jdGlvbiBsb25nRGF0ZUZvcm1hdCAoa2V5KSB7XG4gICAgdmFyIGZvcm1hdCA9IHRoaXMuX2xvbmdEYXRlRm9ybWF0W2tleV0sXG4gICAgICAgIGZvcm1hdFVwcGVyID0gdGhpcy5fbG9uZ0RhdGVGb3JtYXRba2V5LnRvVXBwZXJDYXNlKCldO1xuXG4gICAgaWYgKGZvcm1hdCB8fCAhZm9ybWF0VXBwZXIpIHtcbiAgICAgICAgcmV0dXJuIGZvcm1hdDtcbiAgICB9XG5cbiAgICB0aGlzLl9sb25nRGF0ZUZvcm1hdFtrZXldID0gZm9ybWF0VXBwZXIucmVwbGFjZSgvTU1NTXxNTXxERHxkZGRkL2csIGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgcmV0dXJuIHZhbC5zbGljZSgxKTtcbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzLl9sb25nRGF0ZUZvcm1hdFtrZXldO1xufVxuXG52YXIgZGVmYXVsdEludmFsaWREYXRlID0gJ0ludmFsaWQgZGF0ZSc7XG5cbmZ1bmN0aW9uIGludmFsaWREYXRlICgpIHtcbiAgICByZXR1cm4gdGhpcy5faW52YWxpZERhdGU7XG59XG5cbnZhciBkZWZhdWx0T3JkaW5hbCA9ICclZCc7XG52YXIgZGVmYXVsdE9yZGluYWxQYXJzZSA9IC9cXGR7MSwyfS87XG5cbmZ1bmN0aW9uIG9yZGluYWwgKG51bWJlcikge1xuICAgIHJldHVybiB0aGlzLl9vcmRpbmFsLnJlcGxhY2UoJyVkJywgbnVtYmVyKTtcbn1cblxudmFyIGRlZmF1bHRSZWxhdGl2ZVRpbWUgPSB7XG4gICAgZnV0dXJlIDogJ2luICVzJyxcbiAgICBwYXN0ICAgOiAnJXMgYWdvJyxcbiAgICBzICA6ICdhIGZldyBzZWNvbmRzJyxcbiAgICBtICA6ICdhIG1pbnV0ZScsXG4gICAgbW0gOiAnJWQgbWludXRlcycsXG4gICAgaCAgOiAnYW4gaG91cicsXG4gICAgaGggOiAnJWQgaG91cnMnLFxuICAgIGQgIDogJ2EgZGF5JyxcbiAgICBkZCA6ICclZCBkYXlzJyxcbiAgICBNICA6ICdhIG1vbnRoJyxcbiAgICBNTSA6ICclZCBtb250aHMnLFxuICAgIHkgIDogJ2EgeWVhcicsXG4gICAgeXkgOiAnJWQgeWVhcnMnXG59O1xuXG5mdW5jdGlvbiByZWxhdGl2ZVRpbWUgKG51bWJlciwgd2l0aG91dFN1ZmZpeCwgc3RyaW5nLCBpc0Z1dHVyZSkge1xuICAgIHZhciBvdXRwdXQgPSB0aGlzLl9yZWxhdGl2ZVRpbWVbc3RyaW5nXTtcbiAgICByZXR1cm4gKGlzRnVuY3Rpb24ob3V0cHV0KSkgP1xuICAgICAgICBvdXRwdXQobnVtYmVyLCB3aXRob3V0U3VmZml4LCBzdHJpbmcsIGlzRnV0dXJlKSA6XG4gICAgICAgIG91dHB1dC5yZXBsYWNlKC8lZC9pLCBudW1iZXIpO1xufVxuXG5mdW5jdGlvbiBwYXN0RnV0dXJlIChkaWZmLCBvdXRwdXQpIHtcbiAgICB2YXIgZm9ybWF0ID0gdGhpcy5fcmVsYXRpdmVUaW1lW2RpZmYgPiAwID8gJ2Z1dHVyZScgOiAncGFzdCddO1xuICAgIHJldHVybiBpc0Z1bmN0aW9uKGZvcm1hdCkgPyBmb3JtYXQob3V0cHV0KSA6IGZvcm1hdC5yZXBsYWNlKC8lcy9pLCBvdXRwdXQpO1xufVxuXG52YXIgYWxpYXNlcyA9IHt9O1xuXG5mdW5jdGlvbiBhZGRVbml0QWxpYXMgKHVuaXQsIHNob3J0aGFuZCkge1xuICAgIHZhciBsb3dlckNhc2UgPSB1bml0LnRvTG93ZXJDYXNlKCk7XG4gICAgYWxpYXNlc1tsb3dlckNhc2VdID0gYWxpYXNlc1tsb3dlckNhc2UgKyAncyddID0gYWxpYXNlc1tzaG9ydGhhbmRdID0gdW5pdDtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplVW5pdHModW5pdHMpIHtcbiAgICByZXR1cm4gdHlwZW9mIHVuaXRzID09PSAnc3RyaW5nJyA/IGFsaWFzZXNbdW5pdHNdIHx8IGFsaWFzZXNbdW5pdHMudG9Mb3dlckNhc2UoKV0gOiB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZU9iamVjdFVuaXRzKGlucHV0T2JqZWN0KSB7XG4gICAgdmFyIG5vcm1hbGl6ZWRJbnB1dCA9IHt9LFxuICAgICAgICBub3JtYWxpemVkUHJvcCxcbiAgICAgICAgcHJvcDtcblxuICAgIGZvciAocHJvcCBpbiBpbnB1dE9iamVjdCkge1xuICAgICAgICBpZiAoaGFzT3duUHJvcChpbnB1dE9iamVjdCwgcHJvcCkpIHtcbiAgICAgICAgICAgIG5vcm1hbGl6ZWRQcm9wID0gbm9ybWFsaXplVW5pdHMocHJvcCk7XG4gICAgICAgICAgICBpZiAobm9ybWFsaXplZFByb3ApIHtcbiAgICAgICAgICAgICAgICBub3JtYWxpemVkSW5wdXRbbm9ybWFsaXplZFByb3BdID0gaW5wdXRPYmplY3RbcHJvcF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbm9ybWFsaXplZElucHV0O1xufVxuXG52YXIgcHJpb3JpdGllcyA9IHt9O1xuXG5mdW5jdGlvbiBhZGRVbml0UHJpb3JpdHkodW5pdCwgcHJpb3JpdHkpIHtcbiAgICBwcmlvcml0aWVzW3VuaXRdID0gcHJpb3JpdHk7XG59XG5cbmZ1bmN0aW9uIGdldFByaW9yaXRpemVkVW5pdHModW5pdHNPYmopIHtcbiAgICB2YXIgdW5pdHMgPSBbXTtcbiAgICBmb3IgKHZhciB1IGluIHVuaXRzT2JqKSB7XG4gICAgICAgIHVuaXRzLnB1c2goe3VuaXQ6IHUsIHByaW9yaXR5OiBwcmlvcml0aWVzW3VdfSk7XG4gICAgfVxuICAgIHVuaXRzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIGEucHJpb3JpdHkgLSBiLnByaW9yaXR5O1xuICAgIH0pO1xuICAgIHJldHVybiB1bml0cztcbn1cblxuZnVuY3Rpb24gbWFrZUdldFNldCAodW5pdCwga2VlcFRpbWUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgICBzZXQkMSh0aGlzLCB1bml0LCB2YWx1ZSk7XG4gICAgICAgICAgICBob29rcy51cGRhdGVPZmZzZXQodGhpcywga2VlcFRpbWUpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0KHRoaXMsIHVuaXQpO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gZ2V0IChtb20sIHVuaXQpIHtcbiAgICByZXR1cm4gbW9tLmlzVmFsaWQoKSA/XG4gICAgICAgIG1vbS5fZFsnZ2V0JyArIChtb20uX2lzVVRDID8gJ1VUQycgOiAnJykgKyB1bml0XSgpIDogTmFOO1xufVxuXG5mdW5jdGlvbiBzZXQkMSAobW9tLCB1bml0LCB2YWx1ZSkge1xuICAgIGlmIChtb20uaXNWYWxpZCgpKSB7XG4gICAgICAgIG1vbS5fZFsnc2V0JyArIChtb20uX2lzVVRDID8gJ1VUQycgOiAnJykgKyB1bml0XSh2YWx1ZSk7XG4gICAgfVxufVxuXG4vLyBNT01FTlRTXG5cbmZ1bmN0aW9uIHN0cmluZ0dldCAodW5pdHMpIHtcbiAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcbiAgICBpZiAoaXNGdW5jdGlvbih0aGlzW3VuaXRzXSkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXNbdW5pdHNdKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufVxuXG5cbmZ1bmN0aW9uIHN0cmluZ1NldCAodW5pdHMsIHZhbHVlKSB7XG4gICAgaWYgKHR5cGVvZiB1bml0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgdW5pdHMgPSBub3JtYWxpemVPYmplY3RVbml0cyh1bml0cyk7XG4gICAgICAgIHZhciBwcmlvcml0aXplZCA9IGdldFByaW9yaXRpemVkVW5pdHModW5pdHMpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByaW9yaXRpemVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzW3ByaW9yaXRpemVkW2ldLnVuaXRdKHVuaXRzW3ByaW9yaXRpemVkW2ldLnVuaXRdKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModW5pdHMpO1xuICAgICAgICBpZiAoaXNGdW5jdGlvbih0aGlzW3VuaXRzXSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzW3VuaXRzXSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59XG5cbmZ1bmN0aW9uIHplcm9GaWxsKG51bWJlciwgdGFyZ2V0TGVuZ3RoLCBmb3JjZVNpZ24pIHtcbiAgICB2YXIgYWJzTnVtYmVyID0gJycgKyBNYXRoLmFicyhudW1iZXIpLFxuICAgICAgICB6ZXJvc1RvRmlsbCA9IHRhcmdldExlbmd0aCAtIGFic051bWJlci5sZW5ndGgsXG4gICAgICAgIHNpZ24gPSBudW1iZXIgPj0gMDtcbiAgICByZXR1cm4gKHNpZ24gPyAoZm9yY2VTaWduID8gJysnIDogJycpIDogJy0nKSArXG4gICAgICAgIE1hdGgucG93KDEwLCBNYXRoLm1heCgwLCB6ZXJvc1RvRmlsbCkpLnRvU3RyaW5nKCkuc3Vic3RyKDEpICsgYWJzTnVtYmVyO1xufVxuXG52YXIgZm9ybWF0dGluZ1Rva2VucyA9IC8oXFxbW15cXFtdKlxcXSl8KFxcXFwpPyhbSGhdbW0oc3MpP3xNb3xNTT9NP00/fERvfERERG98REQ/RD9EP3xkZGQ/ZD98ZG8/fHdbb3x3XT98V1tvfFddP3xRbz98WVlZWVlZfFlZWVlZfFlZWVl8WVl8Z2coZ2dnPyk/fEdHKEdHRz8pP3xlfEV8YXxBfGhoP3xISD98a2s/fG1tP3xzcz98U3sxLDl9fHh8WHx6ej98Wlo/fC4pL2c7XG5cbnZhciBsb2NhbEZvcm1hdHRpbmdUb2tlbnMgPSAvKFxcW1teXFxbXSpcXF0pfChcXFxcKT8oTFRTfExUfExMP0w/TD98bHsxLDR9KS9nO1xuXG52YXIgZm9ybWF0RnVuY3Rpb25zID0ge307XG5cbnZhciBmb3JtYXRUb2tlbkZ1bmN0aW9ucyA9IHt9O1xuXG4vLyB0b2tlbjogICAgJ00nXG4vLyBwYWRkZWQ6ICAgWydNTScsIDJdXG4vLyBvcmRpbmFsOiAgJ01vJ1xuLy8gY2FsbGJhY2s6IGZ1bmN0aW9uICgpIHsgdGhpcy5tb250aCgpICsgMSB9XG5mdW5jdGlvbiBhZGRGb3JtYXRUb2tlbiAodG9rZW4sIHBhZGRlZCwgb3JkaW5hbCwgY2FsbGJhY2spIHtcbiAgICB2YXIgZnVuYyA9IGNhbGxiYWNrO1xuICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGZ1bmMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpc1tjYWxsYmFja10oKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgaWYgKHRva2VuKSB7XG4gICAgICAgIGZvcm1hdFRva2VuRnVuY3Rpb25zW3Rva2VuXSA9IGZ1bmM7XG4gICAgfVxuICAgIGlmIChwYWRkZWQpIHtcbiAgICAgICAgZm9ybWF0VG9rZW5GdW5jdGlvbnNbcGFkZGVkWzBdXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB6ZXJvRmlsbChmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyksIHBhZGRlZFsxXSwgcGFkZGVkWzJdKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgaWYgKG9yZGluYWwpIHtcbiAgICAgICAgZm9ybWF0VG9rZW5GdW5jdGlvbnNbb3JkaW5hbF0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCkub3JkaW5hbChmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyksIHRva2VuKTtcbiAgICAgICAgfTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUZvcm1hdHRpbmdUb2tlbnMoaW5wdXQpIHtcbiAgICBpZiAoaW5wdXQubWF0Y2goL1xcW1tcXHNcXFNdLykpIHtcbiAgICAgICAgcmV0dXJuIGlucHV0LnJlcGxhY2UoL15cXFt8XFxdJC9nLCAnJyk7XG4gICAgfVxuICAgIHJldHVybiBpbnB1dC5yZXBsYWNlKC9cXFxcL2csICcnKTtcbn1cblxuZnVuY3Rpb24gbWFrZUZvcm1hdEZ1bmN0aW9uKGZvcm1hdCkge1xuICAgIHZhciBhcnJheSA9IGZvcm1hdC5tYXRjaChmb3JtYXR0aW5nVG9rZW5zKSwgaSwgbGVuZ3RoO1xuXG4gICAgZm9yIChpID0gMCwgbGVuZ3RoID0gYXJyYXkubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGZvcm1hdFRva2VuRnVuY3Rpb25zW2FycmF5W2ldXSkge1xuICAgICAgICAgICAgYXJyYXlbaV0gPSBmb3JtYXRUb2tlbkZ1bmN0aW9uc1thcnJheVtpXV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhcnJheVtpXSA9IHJlbW92ZUZvcm1hdHRpbmdUb2tlbnMoYXJyYXlbaV0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChtb20pIHtcbiAgICAgICAgdmFyIG91dHB1dCA9ICcnLCBpO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIG91dHB1dCArPSBhcnJheVtpXSBpbnN0YW5jZW9mIEZ1bmN0aW9uID8gYXJyYXlbaV0uY2FsbChtb20sIGZvcm1hdCkgOiBhcnJheVtpXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH07XG59XG5cbi8vIGZvcm1hdCBkYXRlIHVzaW5nIG5hdGl2ZSBkYXRlIG9iamVjdFxuZnVuY3Rpb24gZm9ybWF0TW9tZW50KG0sIGZvcm1hdCkge1xuICAgIGlmICghbS5pc1ZhbGlkKCkpIHtcbiAgICAgICAgcmV0dXJuIG0ubG9jYWxlRGF0YSgpLmludmFsaWREYXRlKCk7XG4gICAgfVxuXG4gICAgZm9ybWF0ID0gZXhwYW5kRm9ybWF0KGZvcm1hdCwgbS5sb2NhbGVEYXRhKCkpO1xuICAgIGZvcm1hdEZ1bmN0aW9uc1tmb3JtYXRdID0gZm9ybWF0RnVuY3Rpb25zW2Zvcm1hdF0gfHwgbWFrZUZvcm1hdEZ1bmN0aW9uKGZvcm1hdCk7XG5cbiAgICByZXR1cm4gZm9ybWF0RnVuY3Rpb25zW2Zvcm1hdF0obSk7XG59XG5cbmZ1bmN0aW9uIGV4cGFuZEZvcm1hdChmb3JtYXQsIGxvY2FsZSkge1xuICAgIHZhciBpID0gNTtcblxuICAgIGZ1bmN0aW9uIHJlcGxhY2VMb25nRGF0ZUZvcm1hdFRva2VucyhpbnB1dCkge1xuICAgICAgICByZXR1cm4gbG9jYWxlLmxvbmdEYXRlRm9ybWF0KGlucHV0KSB8fCBpbnB1dDtcbiAgICB9XG5cbiAgICBsb2NhbEZvcm1hdHRpbmdUb2tlbnMubGFzdEluZGV4ID0gMDtcbiAgICB3aGlsZSAoaSA+PSAwICYmIGxvY2FsRm9ybWF0dGluZ1Rva2Vucy50ZXN0KGZvcm1hdCkpIHtcbiAgICAgICAgZm9ybWF0ID0gZm9ybWF0LnJlcGxhY2UobG9jYWxGb3JtYXR0aW5nVG9rZW5zLCByZXBsYWNlTG9uZ0RhdGVGb3JtYXRUb2tlbnMpO1xuICAgICAgICBsb2NhbEZvcm1hdHRpbmdUb2tlbnMubGFzdEluZGV4ID0gMDtcbiAgICAgICAgaSAtPSAxO1xuICAgIH1cblxuICAgIHJldHVybiBmb3JtYXQ7XG59XG5cbnZhciBtYXRjaDEgICAgICAgICA9IC9cXGQvOyAgICAgICAgICAgIC8vICAgICAgIDAgLSA5XG52YXIgbWF0Y2gyICAgICAgICAgPSAvXFxkXFxkLzsgICAgICAgICAgLy8gICAgICAwMCAtIDk5XG52YXIgbWF0Y2gzICAgICAgICAgPSAvXFxkezN9LzsgICAgICAgICAvLyAgICAgMDAwIC0gOTk5XG52YXIgbWF0Y2g0ICAgICAgICAgPSAvXFxkezR9LzsgICAgICAgICAvLyAgICAwMDAwIC0gOTk5OVxudmFyIG1hdGNoNiAgICAgICAgID0gL1srLV0/XFxkezZ9LzsgICAgLy8gLTk5OTk5OSAtIDk5OTk5OVxudmFyIG1hdGNoMXRvMiAgICAgID0gL1xcZFxcZD8vOyAgICAgICAgIC8vICAgICAgIDAgLSA5OVxudmFyIG1hdGNoM3RvNCAgICAgID0gL1xcZFxcZFxcZFxcZD8vOyAgICAgLy8gICAgIDk5OSAtIDk5OTlcbnZhciBtYXRjaDV0bzYgICAgICA9IC9cXGRcXGRcXGRcXGRcXGRcXGQ/LzsgLy8gICA5OTk5OSAtIDk5OTk5OVxudmFyIG1hdGNoMXRvMyAgICAgID0gL1xcZHsxLDN9LzsgICAgICAgLy8gICAgICAgMCAtIDk5OVxudmFyIG1hdGNoMXRvNCAgICAgID0gL1xcZHsxLDR9LzsgICAgICAgLy8gICAgICAgMCAtIDk5OTlcbnZhciBtYXRjaDF0bzYgICAgICA9IC9bKy1dP1xcZHsxLDZ9LzsgIC8vIC05OTk5OTkgLSA5OTk5OTlcblxudmFyIG1hdGNoVW5zaWduZWQgID0gL1xcZCsvOyAgICAgICAgICAgLy8gICAgICAgMCAtIGluZlxudmFyIG1hdGNoU2lnbmVkICAgID0gL1srLV0/XFxkKy87ICAgICAgLy8gICAgLWluZiAtIGluZlxuXG52YXIgbWF0Y2hPZmZzZXQgICAgPSAvWnxbKy1dXFxkXFxkOj9cXGRcXGQvZ2k7IC8vICswMDowMCAtMDA6MDAgKzAwMDAgLTAwMDAgb3IgWlxudmFyIG1hdGNoU2hvcnRPZmZzZXQgPSAvWnxbKy1dXFxkXFxkKD86Oj9cXGRcXGQpPy9naTsgLy8gKzAwIC0wMCArMDA6MDAgLTAwOjAwICswMDAwIC0wMDAwIG9yIFpcblxudmFyIG1hdGNoVGltZXN0YW1wID0gL1srLV0/XFxkKyhcXC5cXGR7MSwzfSk/LzsgLy8gMTIzNDU2Nzg5IDEyMzQ1Njc4OS4xMjNcblxuLy8gYW55IHdvcmQgKG9yIHR3bykgY2hhcmFjdGVycyBvciBudW1iZXJzIGluY2x1ZGluZyB0d28vdGhyZWUgd29yZCBtb250aCBpbiBhcmFiaWMuXG4vLyBpbmNsdWRlcyBzY290dGlzaCBnYWVsaWMgdHdvIHdvcmQgYW5kIGh5cGhlbmF0ZWQgbW9udGhzXG52YXIgbWF0Y2hXb3JkID0gL1swLTldKlsnYS16XFx1MDBBMC1cXHUwNUZGXFx1MDcwMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSt8W1xcdTA2MDAtXFx1MDZGRlxcL10rKFxccyo/W1xcdTA2MDAtXFx1MDZGRl0rKXsxLDJ9L2k7XG5cblxudmFyIHJlZ2V4ZXMgPSB7fTtcblxuZnVuY3Rpb24gYWRkUmVnZXhUb2tlbiAodG9rZW4sIHJlZ2V4LCBzdHJpY3RSZWdleCkge1xuICAgIHJlZ2V4ZXNbdG9rZW5dID0gaXNGdW5jdGlvbihyZWdleCkgPyByZWdleCA6IGZ1bmN0aW9uIChpc1N0cmljdCwgbG9jYWxlRGF0YSkge1xuICAgICAgICByZXR1cm4gKGlzU3RyaWN0ICYmIHN0cmljdFJlZ2V4KSA/IHN0cmljdFJlZ2V4IDogcmVnZXg7XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gZ2V0UGFyc2VSZWdleEZvclRva2VuICh0b2tlbiwgY29uZmlnKSB7XG4gICAgaWYgKCFoYXNPd25Qcm9wKHJlZ2V4ZXMsIHRva2VuKSkge1xuICAgICAgICByZXR1cm4gbmV3IFJlZ0V4cCh1bmVzY2FwZUZvcm1hdCh0b2tlbikpO1xuICAgIH1cblxuICAgIHJldHVybiByZWdleGVzW3Rva2VuXShjb25maWcuX3N0cmljdCwgY29uZmlnLl9sb2NhbGUpO1xufVxuXG4vLyBDb2RlIGZyb20gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zNTYxNDkzL2lzLXRoZXJlLWEtcmVnZXhwLWVzY2FwZS1mdW5jdGlvbi1pbi1qYXZhc2NyaXB0XG5mdW5jdGlvbiB1bmVzY2FwZUZvcm1hdChzKSB7XG4gICAgcmV0dXJuIHJlZ2V4RXNjYXBlKHMucmVwbGFjZSgnXFxcXCcsICcnKS5yZXBsYWNlKC9cXFxcKFxcWyl8XFxcXChcXF0pfFxcWyhbXlxcXVxcW10qKVxcXXxcXFxcKC4pL2csIGZ1bmN0aW9uIChtYXRjaGVkLCBwMSwgcDIsIHAzLCBwNCkge1xuICAgICAgICByZXR1cm4gcDEgfHwgcDIgfHwgcDMgfHwgcDQ7XG4gICAgfSkpO1xufVxuXG5mdW5jdGlvbiByZWdleEVzY2FwZShzKSB7XG4gICAgcmV0dXJuIHMucmVwbGFjZSgvWy1cXC9cXFxcXiQqKz8uKCl8W1xcXXt9XS9nLCAnXFxcXCQmJyk7XG59XG5cbnZhciB0b2tlbnMgPSB7fTtcblxuZnVuY3Rpb24gYWRkUGFyc2VUb2tlbiAodG9rZW4sIGNhbGxiYWNrKSB7XG4gICAgdmFyIGksIGZ1bmMgPSBjYWxsYmFjaztcbiAgICBpZiAodHlwZW9mIHRva2VuID09PSAnc3RyaW5nJykge1xuICAgICAgICB0b2tlbiA9IFt0b2tlbl07XG4gICAgfVxuICAgIGlmIChpc051bWJlcihjYWxsYmFjaykpIHtcbiAgICAgICAgZnVuYyA9IGZ1bmN0aW9uIChpbnB1dCwgYXJyYXkpIHtcbiAgICAgICAgICAgIGFycmF5W2NhbGxiYWNrXSA9IHRvSW50KGlucHV0KTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZm9yIChpID0gMDsgaSA8IHRva2VuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRva2Vuc1t0b2tlbltpXV0gPSBmdW5jO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gYWRkV2Vla1BhcnNlVG9rZW4gKHRva2VuLCBjYWxsYmFjaykge1xuICAgIGFkZFBhcnNlVG9rZW4odG9rZW4sIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXksIGNvbmZpZywgdG9rZW4pIHtcbiAgICAgICAgY29uZmlnLl93ID0gY29uZmlnLl93IHx8IHt9O1xuICAgICAgICBjYWxsYmFjayhpbnB1dCwgY29uZmlnLl93LCBjb25maWcsIHRva2VuKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gYWRkVGltZVRvQXJyYXlGcm9tVG9rZW4odG9rZW4sIGlucHV0LCBjb25maWcpIHtcbiAgICBpZiAoaW5wdXQgIT0gbnVsbCAmJiBoYXNPd25Qcm9wKHRva2VucywgdG9rZW4pKSB7XG4gICAgICAgIHRva2Vuc1t0b2tlbl0oaW5wdXQsIGNvbmZpZy5fYSwgY29uZmlnLCB0b2tlbik7XG4gICAgfVxufVxuXG52YXIgWUVBUiA9IDA7XG52YXIgTU9OVEggPSAxO1xudmFyIERBVEUgPSAyO1xudmFyIEhPVVIgPSAzO1xudmFyIE1JTlVURSA9IDQ7XG52YXIgU0VDT05EID0gNTtcbnZhciBNSUxMSVNFQ09ORCA9IDY7XG52YXIgV0VFSyA9IDc7XG52YXIgV0VFS0RBWSA9IDg7XG5cbnZhciBpbmRleE9mO1xuXG5pZiAoQXJyYXkucHJvdG90eXBlLmluZGV4T2YpIHtcbiAgICBpbmRleE9mID0gQXJyYXkucHJvdG90eXBlLmluZGV4T2Y7XG59IGVsc2Uge1xuICAgIGluZGV4T2YgPSBmdW5jdGlvbiAobykge1xuICAgICAgICAvLyBJIGtub3dcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBpZiAodGhpc1tpXSA9PT0gbykge1xuICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9O1xufVxuXG52YXIgaW5kZXhPZiQxID0gaW5kZXhPZjtcblxuZnVuY3Rpb24gZGF5c0luTW9udGgoeWVhciwgbW9udGgpIHtcbiAgICByZXR1cm4gbmV3IERhdGUoRGF0ZS5VVEMoeWVhciwgbW9udGggKyAxLCAwKSkuZ2V0VVRDRGF0ZSgpO1xufVxuXG4vLyBGT1JNQVRUSU5HXG5cbmFkZEZvcm1hdFRva2VuKCdNJywgWydNTScsIDJdLCAnTW8nLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMubW9udGgoKSArIDE7XG59KTtcblxuYWRkRm9ybWF0VG9rZW4oJ01NTScsIDAsIDAsIGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCkubW9udGhzU2hvcnQodGhpcywgZm9ybWF0KTtcbn0pO1xuXG5hZGRGb3JtYXRUb2tlbignTU1NTScsIDAsIDAsIGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCkubW9udGhzKHRoaXMsIGZvcm1hdCk7XG59KTtcblxuLy8gQUxJQVNFU1xuXG5hZGRVbml0QWxpYXMoJ21vbnRoJywgJ00nKTtcblxuLy8gUFJJT1JJVFlcblxuYWRkVW5pdFByaW9yaXR5KCdtb250aCcsIDgpO1xuXG4vLyBQQVJTSU5HXG5cbmFkZFJlZ2V4VG9rZW4oJ00nLCAgICBtYXRjaDF0bzIpO1xuYWRkUmVnZXhUb2tlbignTU0nLCAgIG1hdGNoMXRvMiwgbWF0Y2gyKTtcbmFkZFJlZ2V4VG9rZW4oJ01NTScsICBmdW5jdGlvbiAoaXNTdHJpY3QsIGxvY2FsZSkge1xuICAgIHJldHVybiBsb2NhbGUubW9udGhzU2hvcnRSZWdleChpc1N0cmljdCk7XG59KTtcbmFkZFJlZ2V4VG9rZW4oJ01NTU0nLCBmdW5jdGlvbiAoaXNTdHJpY3QsIGxvY2FsZSkge1xuICAgIHJldHVybiBsb2NhbGUubW9udGhzUmVnZXgoaXNTdHJpY3QpO1xufSk7XG5cbmFkZFBhcnNlVG9rZW4oWydNJywgJ01NJ10sIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXkpIHtcbiAgICBhcnJheVtNT05USF0gPSB0b0ludChpbnB1dCkgLSAxO1xufSk7XG5cbmFkZFBhcnNlVG9rZW4oWydNTU0nLCAnTU1NTSddLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5LCBjb25maWcsIHRva2VuKSB7XG4gICAgdmFyIG1vbnRoID0gY29uZmlnLl9sb2NhbGUubW9udGhzUGFyc2UoaW5wdXQsIHRva2VuLCBjb25maWcuX3N0cmljdCk7XG4gICAgLy8gaWYgd2UgZGlkbid0IGZpbmQgYSBtb250aCBuYW1lLCBtYXJrIHRoZSBkYXRlIGFzIGludmFsaWQuXG4gICAgaWYgKG1vbnRoICE9IG51bGwpIHtcbiAgICAgICAgYXJyYXlbTU9OVEhdID0gbW9udGg7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuaW52YWxpZE1vbnRoID0gaW5wdXQ7XG4gICAgfVxufSk7XG5cbi8vIExPQ0FMRVNcblxudmFyIE1PTlRIU19JTl9GT1JNQVQgPSAvRFtvRF0/KFxcW1teXFxbXFxdXSpcXF18XFxzKStNTU1NPy87XG52YXIgZGVmYXVsdExvY2FsZU1vbnRocyA9ICdKYW51YXJ5X0ZlYnJ1YXJ5X01hcmNoX0FwcmlsX01heV9KdW5lX0p1bHlfQXVndXN0X1NlcHRlbWJlcl9PY3RvYmVyX05vdmVtYmVyX0RlY2VtYmVyJy5zcGxpdCgnXycpO1xuZnVuY3Rpb24gbG9jYWxlTW9udGhzIChtLCBmb3JtYXQpIHtcbiAgICBpZiAoIW0pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21vbnRocztcbiAgICB9XG4gICAgcmV0dXJuIGlzQXJyYXkodGhpcy5fbW9udGhzKSA/IHRoaXMuX21vbnRoc1ttLm1vbnRoKCldIDpcbiAgICAgICAgdGhpcy5fbW9udGhzWyh0aGlzLl9tb250aHMuaXNGb3JtYXQgfHwgTU9OVEhTX0lOX0ZPUk1BVCkudGVzdChmb3JtYXQpID8gJ2Zvcm1hdCcgOiAnc3RhbmRhbG9uZSddW20ubW9udGgoKV07XG59XG5cbnZhciBkZWZhdWx0TG9jYWxlTW9udGhzU2hvcnQgPSAnSmFuX0ZlYl9NYXJfQXByX01heV9KdW5fSnVsX0F1Z19TZXBfT2N0X05vdl9EZWMnLnNwbGl0KCdfJyk7XG5mdW5jdGlvbiBsb2NhbGVNb250aHNTaG9ydCAobSwgZm9ybWF0KSB7XG4gICAgaWYgKCFtKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9tb250aHNTaG9ydDtcbiAgICB9XG4gICAgcmV0dXJuIGlzQXJyYXkodGhpcy5fbW9udGhzU2hvcnQpID8gdGhpcy5fbW9udGhzU2hvcnRbbS5tb250aCgpXSA6XG4gICAgICAgIHRoaXMuX21vbnRoc1Nob3J0W01PTlRIU19JTl9GT1JNQVQudGVzdChmb3JtYXQpID8gJ2Zvcm1hdCcgOiAnc3RhbmRhbG9uZSddW20ubW9udGgoKV07XG59XG5cbmZ1bmN0aW9uIGhhbmRsZVN0cmljdFBhcnNlKG1vbnRoTmFtZSwgZm9ybWF0LCBzdHJpY3QpIHtcbiAgICB2YXIgaSwgaWksIG1vbSwgbGxjID0gbW9udGhOYW1lLnRvTG9jYWxlTG93ZXJDYXNlKCk7XG4gICAgaWYgKCF0aGlzLl9tb250aHNQYXJzZSkge1xuICAgICAgICAvLyB0aGlzIGlzIG5vdCB1c2VkXG4gICAgICAgIHRoaXMuX21vbnRoc1BhcnNlID0gW107XG4gICAgICAgIHRoaXMuX2xvbmdNb250aHNQYXJzZSA9IFtdO1xuICAgICAgICB0aGlzLl9zaG9ydE1vbnRoc1BhcnNlID0gW107XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCAxMjsgKytpKSB7XG4gICAgICAgICAgICBtb20gPSBjcmVhdGVVVEMoWzIwMDAsIGldKTtcbiAgICAgICAgICAgIHRoaXMuX3Nob3J0TW9udGhzUGFyc2VbaV0gPSB0aGlzLm1vbnRoc1Nob3J0KG1vbSwgJycpLnRvTG9jYWxlTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICB0aGlzLl9sb25nTW9udGhzUGFyc2VbaV0gPSB0aGlzLm1vbnRocyhtb20sICcnKS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHN0cmljdCkge1xuICAgICAgICBpZiAoZm9ybWF0ID09PSAnTU1NJykge1xuICAgICAgICAgICAgaWkgPSBpbmRleE9mJDEuY2FsbCh0aGlzLl9zaG9ydE1vbnRoc1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgcmV0dXJuIGlpICE9PSAtMSA/IGlpIDogbnVsbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlpID0gaW5kZXhPZiQxLmNhbGwodGhpcy5fbG9uZ01vbnRoc1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgcmV0dXJuIGlpICE9PSAtMSA/IGlpIDogbnVsbDtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChmb3JtYXQgPT09ICdNTU0nKSB7XG4gICAgICAgICAgICBpaSA9IGluZGV4T2YkMS5jYWxsKHRoaXMuX3Nob3J0TW9udGhzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICBpZiAoaWkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWkgPSBpbmRleE9mJDEuY2FsbCh0aGlzLl9sb25nTW9udGhzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICByZXR1cm4gaWkgIT09IC0xID8gaWkgOiBudWxsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWkgPSBpbmRleE9mJDEuY2FsbCh0aGlzLl9sb25nTW9udGhzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICBpZiAoaWkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWkgPSBpbmRleE9mJDEuY2FsbCh0aGlzLl9zaG9ydE1vbnRoc1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgcmV0dXJuIGlpICE9PSAtMSA/IGlpIDogbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gbG9jYWxlTW9udGhzUGFyc2UgKG1vbnRoTmFtZSwgZm9ybWF0LCBzdHJpY3QpIHtcbiAgICB2YXIgaSwgbW9tLCByZWdleDtcblxuICAgIGlmICh0aGlzLl9tb250aHNQYXJzZUV4YWN0KSB7XG4gICAgICAgIHJldHVybiBoYW5kbGVTdHJpY3RQYXJzZS5jYWxsKHRoaXMsIG1vbnRoTmFtZSwgZm9ybWF0LCBzdHJpY3QpO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5fbW9udGhzUGFyc2UpIHtcbiAgICAgICAgdGhpcy5fbW9udGhzUGFyc2UgPSBbXTtcbiAgICAgICAgdGhpcy5fbG9uZ01vbnRoc1BhcnNlID0gW107XG4gICAgICAgIHRoaXMuX3Nob3J0TW9udGhzUGFyc2UgPSBbXTtcbiAgICB9XG5cbiAgICAvLyBUT0RPOiBhZGQgc29ydGluZ1xuICAgIC8vIFNvcnRpbmcgbWFrZXMgc3VyZSBpZiBvbmUgbW9udGggKG9yIGFiYnIpIGlzIGEgcHJlZml4IG9mIGFub3RoZXJcbiAgICAvLyBzZWUgc29ydGluZyBpbiBjb21wdXRlTW9udGhzUGFyc2VcbiAgICBmb3IgKGkgPSAwOyBpIDwgMTI7IGkrKykge1xuICAgICAgICAvLyBtYWtlIHRoZSByZWdleCBpZiB3ZSBkb24ndCBoYXZlIGl0IGFscmVhZHlcbiAgICAgICAgbW9tID0gY3JlYXRlVVRDKFsyMDAwLCBpXSk7XG4gICAgICAgIGlmIChzdHJpY3QgJiYgIXRoaXMuX2xvbmdNb250aHNQYXJzZVtpXSkge1xuICAgICAgICAgICAgdGhpcy5fbG9uZ01vbnRoc1BhcnNlW2ldID0gbmV3IFJlZ0V4cCgnXicgKyB0aGlzLm1vbnRocyhtb20sICcnKS5yZXBsYWNlKCcuJywgJycpICsgJyQnLCAnaScpO1xuICAgICAgICAgICAgdGhpcy5fc2hvcnRNb250aHNQYXJzZVtpXSA9IG5ldyBSZWdFeHAoJ14nICsgdGhpcy5tb250aHNTaG9ydChtb20sICcnKS5yZXBsYWNlKCcuJywgJycpICsgJyQnLCAnaScpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghc3RyaWN0ICYmICF0aGlzLl9tb250aHNQYXJzZVtpXSkge1xuICAgICAgICAgICAgcmVnZXggPSAnXicgKyB0aGlzLm1vbnRocyhtb20sICcnKSArICd8XicgKyB0aGlzLm1vbnRoc1Nob3J0KG1vbSwgJycpO1xuICAgICAgICAgICAgdGhpcy5fbW9udGhzUGFyc2VbaV0gPSBuZXcgUmVnRXhwKHJlZ2V4LnJlcGxhY2UoJy4nLCAnJyksICdpJyk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gdGVzdCB0aGUgcmVnZXhcbiAgICAgICAgaWYgKHN0cmljdCAmJiBmb3JtYXQgPT09ICdNTU1NJyAmJiB0aGlzLl9sb25nTW9udGhzUGFyc2VbaV0udGVzdChtb250aE5hbWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgfSBlbHNlIGlmIChzdHJpY3QgJiYgZm9ybWF0ID09PSAnTU1NJyAmJiB0aGlzLl9zaG9ydE1vbnRoc1BhcnNlW2ldLnRlc3QobW9udGhOYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgIH0gZWxzZSBpZiAoIXN0cmljdCAmJiB0aGlzLl9tb250aHNQYXJzZVtpXS50ZXN0KG1vbnRoTmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vLyBNT01FTlRTXG5cbmZ1bmN0aW9uIHNldE1vbnRoIChtb20sIHZhbHVlKSB7XG4gICAgdmFyIGRheU9mTW9udGg7XG5cbiAgICBpZiAoIW1vbS5pc1ZhbGlkKCkpIHtcbiAgICAgICAgLy8gTm8gb3BcbiAgICAgICAgcmV0dXJuIG1vbTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgICBpZiAoL15cXGQrJC8udGVzdCh2YWx1ZSkpIHtcbiAgICAgICAgICAgIHZhbHVlID0gdG9JbnQodmFsdWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFsdWUgPSBtb20ubG9jYWxlRGF0YSgpLm1vbnRoc1BhcnNlKHZhbHVlKTtcbiAgICAgICAgICAgIC8vIFRPRE86IEFub3RoZXIgc2lsZW50IGZhaWx1cmU/XG4gICAgICAgICAgICBpZiAoIWlzTnVtYmVyKHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBtb207XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkYXlPZk1vbnRoID0gTWF0aC5taW4obW9tLmRhdGUoKSwgZGF5c0luTW9udGgobW9tLnllYXIoKSwgdmFsdWUpKTtcbiAgICBtb20uX2RbJ3NldCcgKyAobW9tLl9pc1VUQyA/ICdVVEMnIDogJycpICsgJ01vbnRoJ10odmFsdWUsIGRheU9mTW9udGgpO1xuICAgIHJldHVybiBtb207XG59XG5cbmZ1bmN0aW9uIGdldFNldE1vbnRoICh2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgIHNldE1vbnRoKHRoaXMsIHZhbHVlKTtcbiAgICAgICAgaG9va3MudXBkYXRlT2Zmc2V0KHRoaXMsIHRydWUpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZ2V0KHRoaXMsICdNb250aCcpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0RGF5c0luTW9udGggKCkge1xuICAgIHJldHVybiBkYXlzSW5Nb250aCh0aGlzLnllYXIoKSwgdGhpcy5tb250aCgpKTtcbn1cblxudmFyIGRlZmF1bHRNb250aHNTaG9ydFJlZ2V4ID0gbWF0Y2hXb3JkO1xuZnVuY3Rpb24gbW9udGhzU2hvcnRSZWdleCAoaXNTdHJpY3QpIHtcbiAgICBpZiAodGhpcy5fbW9udGhzUGFyc2VFeGFjdCkge1xuICAgICAgICBpZiAoIWhhc093blByb3AodGhpcywgJ19tb250aHNSZWdleCcpKSB7XG4gICAgICAgICAgICBjb21wdXRlTW9udGhzUGFyc2UuY2FsbCh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNTdHJpY3QpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9tb250aHNTaG9ydFN0cmljdFJlZ2V4O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21vbnRoc1Nob3J0UmVnZXg7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoIWhhc093blByb3AodGhpcywgJ19tb250aHNTaG9ydFJlZ2V4JykpIHtcbiAgICAgICAgICAgIHRoaXMuX21vbnRoc1Nob3J0UmVnZXggPSBkZWZhdWx0TW9udGhzU2hvcnRSZWdleDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fbW9udGhzU2hvcnRTdHJpY3RSZWdleCAmJiBpc1N0cmljdCA/XG4gICAgICAgICAgICB0aGlzLl9tb250aHNTaG9ydFN0cmljdFJlZ2V4IDogdGhpcy5fbW9udGhzU2hvcnRSZWdleDtcbiAgICB9XG59XG5cbnZhciBkZWZhdWx0TW9udGhzUmVnZXggPSBtYXRjaFdvcmQ7XG5mdW5jdGlvbiBtb250aHNSZWdleCAoaXNTdHJpY3QpIHtcbiAgICBpZiAodGhpcy5fbW9udGhzUGFyc2VFeGFjdCkge1xuICAgICAgICBpZiAoIWhhc093blByb3AodGhpcywgJ19tb250aHNSZWdleCcpKSB7XG4gICAgICAgICAgICBjb21wdXRlTW9udGhzUGFyc2UuY2FsbCh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNTdHJpY3QpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9tb250aHNTdHJpY3RSZWdleDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9tb250aHNSZWdleDtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICghaGFzT3duUHJvcCh0aGlzLCAnX21vbnRoc1JlZ2V4JykpIHtcbiAgICAgICAgICAgIHRoaXMuX21vbnRoc1JlZ2V4ID0gZGVmYXVsdE1vbnRoc1JlZ2V4O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl9tb250aHNTdHJpY3RSZWdleCAmJiBpc1N0cmljdCA/XG4gICAgICAgICAgICB0aGlzLl9tb250aHNTdHJpY3RSZWdleCA6IHRoaXMuX21vbnRoc1JlZ2V4O1xuICAgIH1cbn1cblxuZnVuY3Rpb24gY29tcHV0ZU1vbnRoc1BhcnNlICgpIHtcbiAgICBmdW5jdGlvbiBjbXBMZW5SZXYoYSwgYikge1xuICAgICAgICByZXR1cm4gYi5sZW5ndGggLSBhLmxlbmd0aDtcbiAgICB9XG5cbiAgICB2YXIgc2hvcnRQaWVjZXMgPSBbXSwgbG9uZ1BpZWNlcyA9IFtdLCBtaXhlZFBpZWNlcyA9IFtdLFxuICAgICAgICBpLCBtb207XG4gICAgZm9yIChpID0gMDsgaSA8IDEyOyBpKyspIHtcbiAgICAgICAgLy8gbWFrZSB0aGUgcmVnZXggaWYgd2UgZG9uJ3QgaGF2ZSBpdCBhbHJlYWR5XG4gICAgICAgIG1vbSA9IGNyZWF0ZVVUQyhbMjAwMCwgaV0pO1xuICAgICAgICBzaG9ydFBpZWNlcy5wdXNoKHRoaXMubW9udGhzU2hvcnQobW9tLCAnJykpO1xuICAgICAgICBsb25nUGllY2VzLnB1c2godGhpcy5tb250aHMobW9tLCAnJykpO1xuICAgICAgICBtaXhlZFBpZWNlcy5wdXNoKHRoaXMubW9udGhzKG1vbSwgJycpKTtcbiAgICAgICAgbWl4ZWRQaWVjZXMucHVzaCh0aGlzLm1vbnRoc1Nob3J0KG1vbSwgJycpKTtcbiAgICB9XG4gICAgLy8gU29ydGluZyBtYWtlcyBzdXJlIGlmIG9uZSBtb250aCAob3IgYWJicikgaXMgYSBwcmVmaXggb2YgYW5vdGhlciBpdFxuICAgIC8vIHdpbGwgbWF0Y2ggdGhlIGxvbmdlciBwaWVjZS5cbiAgICBzaG9ydFBpZWNlcy5zb3J0KGNtcExlblJldik7XG4gICAgbG9uZ1BpZWNlcy5zb3J0KGNtcExlblJldik7XG4gICAgbWl4ZWRQaWVjZXMuc29ydChjbXBMZW5SZXYpO1xuICAgIGZvciAoaSA9IDA7IGkgPCAxMjsgaSsrKSB7XG4gICAgICAgIHNob3J0UGllY2VzW2ldID0gcmVnZXhFc2NhcGUoc2hvcnRQaWVjZXNbaV0pO1xuICAgICAgICBsb25nUGllY2VzW2ldID0gcmVnZXhFc2NhcGUobG9uZ1BpZWNlc1tpXSk7XG4gICAgfVxuICAgIGZvciAoaSA9IDA7IGkgPCAyNDsgaSsrKSB7XG4gICAgICAgIG1peGVkUGllY2VzW2ldID0gcmVnZXhFc2NhcGUobWl4ZWRQaWVjZXNbaV0pO1xuICAgIH1cblxuICAgIHRoaXMuX21vbnRoc1JlZ2V4ID0gbmV3IFJlZ0V4cCgnXignICsgbWl4ZWRQaWVjZXMuam9pbignfCcpICsgJyknLCAnaScpO1xuICAgIHRoaXMuX21vbnRoc1Nob3J0UmVnZXggPSB0aGlzLl9tb250aHNSZWdleDtcbiAgICB0aGlzLl9tb250aHNTdHJpY3RSZWdleCA9IG5ldyBSZWdFeHAoJ14oJyArIGxvbmdQaWVjZXMuam9pbignfCcpICsgJyknLCAnaScpO1xuICAgIHRoaXMuX21vbnRoc1Nob3J0U3RyaWN0UmVnZXggPSBuZXcgUmVnRXhwKCdeKCcgKyBzaG9ydFBpZWNlcy5qb2luKCd8JykgKyAnKScsICdpJyk7XG59XG5cbi8vIEZPUk1BVFRJTkdcblxuYWRkRm9ybWF0VG9rZW4oJ1knLCAwLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHkgPSB0aGlzLnllYXIoKTtcbiAgICByZXR1cm4geSA8PSA5OTk5ID8gJycgKyB5IDogJysnICsgeTtcbn0pO1xuXG5hZGRGb3JtYXRUb2tlbigwLCBbJ1lZJywgMl0sIDAsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy55ZWFyKCkgJSAxMDA7XG59KTtcblxuYWRkRm9ybWF0VG9rZW4oMCwgWydZWVlZJywgICA0XSwgICAgICAgMCwgJ3llYXInKTtcbmFkZEZvcm1hdFRva2VuKDAsIFsnWVlZWVknLCAgNV0sICAgICAgIDAsICd5ZWFyJyk7XG5hZGRGb3JtYXRUb2tlbigwLCBbJ1lZWVlZWScsIDYsIHRydWVdLCAwLCAneWVhcicpO1xuXG4vLyBBTElBU0VTXG5cbmFkZFVuaXRBbGlhcygneWVhcicsICd5Jyk7XG5cbi8vIFBSSU9SSVRJRVNcblxuYWRkVW5pdFByaW9yaXR5KCd5ZWFyJywgMSk7XG5cbi8vIFBBUlNJTkdcblxuYWRkUmVnZXhUb2tlbignWScsICAgICAgbWF0Y2hTaWduZWQpO1xuYWRkUmVnZXhUb2tlbignWVknLCAgICAgbWF0Y2gxdG8yLCBtYXRjaDIpO1xuYWRkUmVnZXhUb2tlbignWVlZWScsICAgbWF0Y2gxdG80LCBtYXRjaDQpO1xuYWRkUmVnZXhUb2tlbignWVlZWVknLCAgbWF0Y2gxdG82LCBtYXRjaDYpO1xuYWRkUmVnZXhUb2tlbignWVlZWVlZJywgbWF0Y2gxdG82LCBtYXRjaDYpO1xuXG5hZGRQYXJzZVRva2VuKFsnWVlZWVknLCAnWVlZWVlZJ10sIFlFQVIpO1xuYWRkUGFyc2VUb2tlbignWVlZWScsIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXkpIHtcbiAgICBhcnJheVtZRUFSXSA9IGlucHV0Lmxlbmd0aCA9PT0gMiA/IGhvb2tzLnBhcnNlVHdvRGlnaXRZZWFyKGlucHV0KSA6IHRvSW50KGlucHV0KTtcbn0pO1xuYWRkUGFyc2VUb2tlbignWVknLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5KSB7XG4gICAgYXJyYXlbWUVBUl0gPSBob29rcy5wYXJzZVR3b0RpZ2l0WWVhcihpbnB1dCk7XG59KTtcbmFkZFBhcnNlVG9rZW4oJ1knLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5KSB7XG4gICAgYXJyYXlbWUVBUl0gPSBwYXJzZUludChpbnB1dCwgMTApO1xufSk7XG5cbi8vIEhFTFBFUlNcblxuZnVuY3Rpb24gZGF5c0luWWVhcih5ZWFyKSB7XG4gICAgcmV0dXJuIGlzTGVhcFllYXIoeWVhcikgPyAzNjYgOiAzNjU7XG59XG5cbmZ1bmN0aW9uIGlzTGVhcFllYXIoeWVhcikge1xuICAgIHJldHVybiAoeWVhciAlIDQgPT09IDAgJiYgeWVhciAlIDEwMCAhPT0gMCkgfHwgeWVhciAlIDQwMCA9PT0gMDtcbn1cblxuLy8gSE9PS1NcblxuaG9va3MucGFyc2VUd29EaWdpdFllYXIgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICByZXR1cm4gdG9JbnQoaW5wdXQpICsgKHRvSW50KGlucHV0KSA+IDY4ID8gMTkwMCA6IDIwMDApO1xufTtcblxuLy8gTU9NRU5UU1xuXG52YXIgZ2V0U2V0WWVhciA9IG1ha2VHZXRTZXQoJ0Z1bGxZZWFyJywgdHJ1ZSk7XG5cbmZ1bmN0aW9uIGdldElzTGVhcFllYXIgKCkge1xuICAgIHJldHVybiBpc0xlYXBZZWFyKHRoaXMueWVhcigpKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlRGF0ZSAoeSwgbSwgZCwgaCwgTSwgcywgbXMpIHtcbiAgICAvL2Nhbid0IGp1c3QgYXBwbHkoKSB0byBjcmVhdGUgYSBkYXRlOlxuICAgIC8vaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xODEzNDgvaW5zdGFudGlhdGluZy1hLWphdmFzY3JpcHQtb2JqZWN0LWJ5LWNhbGxpbmctcHJvdG90eXBlLWNvbnN0cnVjdG9yLWFwcGx5XG4gICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSh5LCBtLCBkLCBoLCBNLCBzLCBtcyk7XG5cbiAgICAvL3RoZSBkYXRlIGNvbnN0cnVjdG9yIHJlbWFwcyB5ZWFycyAwLTk5IHRvIDE5MDAtMTk5OVxuICAgIGlmICh5IDwgMTAwICYmIHkgPj0gMCAmJiBpc0Zpbml0ZShkYXRlLmdldEZ1bGxZZWFyKCkpKSB7XG4gICAgICAgIGRhdGUuc2V0RnVsbFllYXIoeSk7XG4gICAgfVxuICAgIHJldHVybiBkYXRlO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVVVENEYXRlICh5KSB7XG4gICAgdmFyIGRhdGUgPSBuZXcgRGF0ZShEYXRlLlVUQy5hcHBseShudWxsLCBhcmd1bWVudHMpKTtcblxuICAgIC8vdGhlIERhdGUuVVRDIGZ1bmN0aW9uIHJlbWFwcyB5ZWFycyAwLTk5IHRvIDE5MDAtMTk5OVxuICAgIGlmICh5IDwgMTAwICYmIHkgPj0gMCAmJiBpc0Zpbml0ZShkYXRlLmdldFVUQ0Z1bGxZZWFyKCkpKSB7XG4gICAgICAgIGRhdGUuc2V0VVRDRnVsbFllYXIoeSk7XG4gICAgfVxuICAgIHJldHVybiBkYXRlO1xufVxuXG4vLyBzdGFydC1vZi1maXJzdC13ZWVrIC0gc3RhcnQtb2YteWVhclxuZnVuY3Rpb24gZmlyc3RXZWVrT2Zmc2V0KHllYXIsIGRvdywgZG95KSB7XG4gICAgdmFyIC8vIGZpcnN0LXdlZWsgZGF5IC0tIHdoaWNoIGphbnVhcnkgaXMgYWx3YXlzIGluIHRoZSBmaXJzdCB3ZWVrICg0IGZvciBpc28sIDEgZm9yIG90aGVyKVxuICAgICAgICBmd2QgPSA3ICsgZG93IC0gZG95LFxuICAgICAgICAvLyBmaXJzdC13ZWVrIGRheSBsb2NhbCB3ZWVrZGF5IC0tIHdoaWNoIGxvY2FsIHdlZWtkYXkgaXMgZndkXG4gICAgICAgIGZ3ZGx3ID0gKDcgKyBjcmVhdGVVVENEYXRlKHllYXIsIDAsIGZ3ZCkuZ2V0VVRDRGF5KCkgLSBkb3cpICUgNztcblxuICAgIHJldHVybiAtZndkbHcgKyBmd2QgLSAxO1xufVxuXG4vL2h0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvSVNPX3dlZWtfZGF0ZSNDYWxjdWxhdGluZ19hX2RhdGVfZ2l2ZW5fdGhlX3llYXIuMkNfd2Vla19udW1iZXJfYW5kX3dlZWtkYXlcbmZ1bmN0aW9uIGRheU9mWWVhckZyb21XZWVrcyh5ZWFyLCB3ZWVrLCB3ZWVrZGF5LCBkb3csIGRveSkge1xuICAgIHZhciBsb2NhbFdlZWtkYXkgPSAoNyArIHdlZWtkYXkgLSBkb3cpICUgNyxcbiAgICAgICAgd2Vla09mZnNldCA9IGZpcnN0V2Vla09mZnNldCh5ZWFyLCBkb3csIGRveSksXG4gICAgICAgIGRheU9mWWVhciA9IDEgKyA3ICogKHdlZWsgLSAxKSArIGxvY2FsV2Vla2RheSArIHdlZWtPZmZzZXQsXG4gICAgICAgIHJlc1llYXIsIHJlc0RheU9mWWVhcjtcblxuICAgIGlmIChkYXlPZlllYXIgPD0gMCkge1xuICAgICAgICByZXNZZWFyID0geWVhciAtIDE7XG4gICAgICAgIHJlc0RheU9mWWVhciA9IGRheXNJblllYXIocmVzWWVhcikgKyBkYXlPZlllYXI7XG4gICAgfSBlbHNlIGlmIChkYXlPZlllYXIgPiBkYXlzSW5ZZWFyKHllYXIpKSB7XG4gICAgICAgIHJlc1llYXIgPSB5ZWFyICsgMTtcbiAgICAgICAgcmVzRGF5T2ZZZWFyID0gZGF5T2ZZZWFyIC0gZGF5c0luWWVhcih5ZWFyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXNZZWFyID0geWVhcjtcbiAgICAgICAgcmVzRGF5T2ZZZWFyID0gZGF5T2ZZZWFyO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHllYXI6IHJlc1llYXIsXG4gICAgICAgIGRheU9mWWVhcjogcmVzRGF5T2ZZZWFyXG4gICAgfTtcbn1cblxuZnVuY3Rpb24gd2Vla09mWWVhcihtb20sIGRvdywgZG95KSB7XG4gICAgdmFyIHdlZWtPZmZzZXQgPSBmaXJzdFdlZWtPZmZzZXQobW9tLnllYXIoKSwgZG93LCBkb3kpLFxuICAgICAgICB3ZWVrID0gTWF0aC5mbG9vcigobW9tLmRheU9mWWVhcigpIC0gd2Vla09mZnNldCAtIDEpIC8gNykgKyAxLFxuICAgICAgICByZXNXZWVrLCByZXNZZWFyO1xuXG4gICAgaWYgKHdlZWsgPCAxKSB7XG4gICAgICAgIHJlc1llYXIgPSBtb20ueWVhcigpIC0gMTtcbiAgICAgICAgcmVzV2VlayA9IHdlZWsgKyB3ZWVrc0luWWVhcihyZXNZZWFyLCBkb3csIGRveSk7XG4gICAgfSBlbHNlIGlmICh3ZWVrID4gd2Vla3NJblllYXIobW9tLnllYXIoKSwgZG93LCBkb3kpKSB7XG4gICAgICAgIHJlc1dlZWsgPSB3ZWVrIC0gd2Vla3NJblllYXIobW9tLnllYXIoKSwgZG93LCBkb3kpO1xuICAgICAgICByZXNZZWFyID0gbW9tLnllYXIoKSArIDE7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmVzWWVhciA9IG1vbS55ZWFyKCk7XG4gICAgICAgIHJlc1dlZWsgPSB3ZWVrO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHdlZWs6IHJlc1dlZWssXG4gICAgICAgIHllYXI6IHJlc1llYXJcbiAgICB9O1xufVxuXG5mdW5jdGlvbiB3ZWVrc0luWWVhcih5ZWFyLCBkb3csIGRveSkge1xuICAgIHZhciB3ZWVrT2Zmc2V0ID0gZmlyc3RXZWVrT2Zmc2V0KHllYXIsIGRvdywgZG95KSxcbiAgICAgICAgd2Vla09mZnNldE5leHQgPSBmaXJzdFdlZWtPZmZzZXQoeWVhciArIDEsIGRvdywgZG95KTtcbiAgICByZXR1cm4gKGRheXNJblllYXIoeWVhcikgLSB3ZWVrT2Zmc2V0ICsgd2Vla09mZnNldE5leHQpIC8gNztcbn1cblxuLy8gRk9STUFUVElOR1xuXG5hZGRGb3JtYXRUb2tlbigndycsIFsnd3cnLCAyXSwgJ3dvJywgJ3dlZWsnKTtcbmFkZEZvcm1hdFRva2VuKCdXJywgWydXVycsIDJdLCAnV28nLCAnaXNvV2VlaycpO1xuXG4vLyBBTElBU0VTXG5cbmFkZFVuaXRBbGlhcygnd2VlaycsICd3Jyk7XG5hZGRVbml0QWxpYXMoJ2lzb1dlZWsnLCAnVycpO1xuXG4vLyBQUklPUklUSUVTXG5cbmFkZFVuaXRQcmlvcml0eSgnd2VlaycsIDUpO1xuYWRkVW5pdFByaW9yaXR5KCdpc29XZWVrJywgNSk7XG5cbi8vIFBBUlNJTkdcblxuYWRkUmVnZXhUb2tlbigndycsICBtYXRjaDF0bzIpO1xuYWRkUmVnZXhUb2tlbignd3cnLCBtYXRjaDF0bzIsIG1hdGNoMik7XG5hZGRSZWdleFRva2VuKCdXJywgIG1hdGNoMXRvMik7XG5hZGRSZWdleFRva2VuKCdXVycsIG1hdGNoMXRvMiwgbWF0Y2gyKTtcblxuYWRkV2Vla1BhcnNlVG9rZW4oWyd3JywgJ3d3JywgJ1cnLCAnV1cnXSwgZnVuY3Rpb24gKGlucHV0LCB3ZWVrLCBjb25maWcsIHRva2VuKSB7XG4gICAgd2Vla1t0b2tlbi5zdWJzdHIoMCwgMSldID0gdG9JbnQoaW5wdXQpO1xufSk7XG5cbi8vIEhFTFBFUlNcblxuLy8gTE9DQUxFU1xuXG5mdW5jdGlvbiBsb2NhbGVXZWVrIChtb20pIHtcbiAgICByZXR1cm4gd2Vla09mWWVhcihtb20sIHRoaXMuX3dlZWsuZG93LCB0aGlzLl93ZWVrLmRveSkud2Vlaztcbn1cblxudmFyIGRlZmF1bHRMb2NhbGVXZWVrID0ge1xuICAgIGRvdyA6IDAsIC8vIFN1bmRheSBpcyB0aGUgZmlyc3QgZGF5IG9mIHRoZSB3ZWVrLlxuICAgIGRveSA6IDYgIC8vIFRoZSB3ZWVrIHRoYXQgY29udGFpbnMgSmFuIDFzdCBpcyB0aGUgZmlyc3Qgd2VlayBvZiB0aGUgeWVhci5cbn07XG5cbmZ1bmN0aW9uIGxvY2FsZUZpcnN0RGF5T2ZXZWVrICgpIHtcbiAgICByZXR1cm4gdGhpcy5fd2Vlay5kb3c7XG59XG5cbmZ1bmN0aW9uIGxvY2FsZUZpcnN0RGF5T2ZZZWFyICgpIHtcbiAgICByZXR1cm4gdGhpcy5fd2Vlay5kb3k7XG59XG5cbi8vIE1PTUVOVFNcblxuZnVuY3Rpb24gZ2V0U2V0V2VlayAoaW5wdXQpIHtcbiAgICB2YXIgd2VlayA9IHRoaXMubG9jYWxlRGF0YSgpLndlZWsodGhpcyk7XG4gICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyB3ZWVrIDogdGhpcy5hZGQoKGlucHV0IC0gd2VlaykgKiA3LCAnZCcpO1xufVxuXG5mdW5jdGlvbiBnZXRTZXRJU09XZWVrIChpbnB1dCkge1xuICAgIHZhciB3ZWVrID0gd2Vla09mWWVhcih0aGlzLCAxLCA0KS53ZWVrO1xuICAgIHJldHVybiBpbnB1dCA9PSBudWxsID8gd2VlayA6IHRoaXMuYWRkKChpbnB1dCAtIHdlZWspICogNywgJ2QnKTtcbn1cblxuLy8gRk9STUFUVElOR1xuXG5hZGRGb3JtYXRUb2tlbignZCcsIDAsICdkbycsICdkYXknKTtcblxuYWRkRm9ybWF0VG9rZW4oJ2RkJywgMCwgMCwgZnVuY3Rpb24gKGZvcm1hdCkge1xuICAgIHJldHVybiB0aGlzLmxvY2FsZURhdGEoKS53ZWVrZGF5c01pbih0aGlzLCBmb3JtYXQpO1xufSk7XG5cbmFkZEZvcm1hdFRva2VuKCdkZGQnLCAwLCAwLCBmdW5jdGlvbiAoZm9ybWF0KSB7XG4gICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLndlZWtkYXlzU2hvcnQodGhpcywgZm9ybWF0KTtcbn0pO1xuXG5hZGRGb3JtYXRUb2tlbignZGRkZCcsIDAsIDAsIGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCkud2Vla2RheXModGhpcywgZm9ybWF0KTtcbn0pO1xuXG5hZGRGb3JtYXRUb2tlbignZScsIDAsIDAsICd3ZWVrZGF5Jyk7XG5hZGRGb3JtYXRUb2tlbignRScsIDAsIDAsICdpc29XZWVrZGF5Jyk7XG5cbi8vIEFMSUFTRVNcblxuYWRkVW5pdEFsaWFzKCdkYXknLCAnZCcpO1xuYWRkVW5pdEFsaWFzKCd3ZWVrZGF5JywgJ2UnKTtcbmFkZFVuaXRBbGlhcygnaXNvV2Vla2RheScsICdFJyk7XG5cbi8vIFBSSU9SSVRZXG5hZGRVbml0UHJpb3JpdHkoJ2RheScsIDExKTtcbmFkZFVuaXRQcmlvcml0eSgnd2Vla2RheScsIDExKTtcbmFkZFVuaXRQcmlvcml0eSgnaXNvV2Vla2RheScsIDExKTtcblxuLy8gUEFSU0lOR1xuXG5hZGRSZWdleFRva2VuKCdkJywgICAgbWF0Y2gxdG8yKTtcbmFkZFJlZ2V4VG9rZW4oJ2UnLCAgICBtYXRjaDF0bzIpO1xuYWRkUmVnZXhUb2tlbignRScsICAgIG1hdGNoMXRvMik7XG5hZGRSZWdleFRva2VuKCdkZCcsICAgZnVuY3Rpb24gKGlzU3RyaWN0LCBsb2NhbGUpIHtcbiAgICByZXR1cm4gbG9jYWxlLndlZWtkYXlzTWluUmVnZXgoaXNTdHJpY3QpO1xufSk7XG5hZGRSZWdleFRva2VuKCdkZGQnLCAgIGZ1bmN0aW9uIChpc1N0cmljdCwgbG9jYWxlKSB7XG4gICAgcmV0dXJuIGxvY2FsZS53ZWVrZGF5c1Nob3J0UmVnZXgoaXNTdHJpY3QpO1xufSk7XG5hZGRSZWdleFRva2VuKCdkZGRkJywgICBmdW5jdGlvbiAoaXNTdHJpY3QsIGxvY2FsZSkge1xuICAgIHJldHVybiBsb2NhbGUud2Vla2RheXNSZWdleChpc1N0cmljdCk7XG59KTtcblxuYWRkV2Vla1BhcnNlVG9rZW4oWydkZCcsICdkZGQnLCAnZGRkZCddLCBmdW5jdGlvbiAoaW5wdXQsIHdlZWssIGNvbmZpZywgdG9rZW4pIHtcbiAgICB2YXIgd2Vla2RheSA9IGNvbmZpZy5fbG9jYWxlLndlZWtkYXlzUGFyc2UoaW5wdXQsIHRva2VuLCBjb25maWcuX3N0cmljdCk7XG4gICAgLy8gaWYgd2UgZGlkbid0IGdldCBhIHdlZWtkYXkgbmFtZSwgbWFyayB0aGUgZGF0ZSBhcyBpbnZhbGlkXG4gICAgaWYgKHdlZWtkYXkgIT0gbnVsbCkge1xuICAgICAgICB3ZWVrLmQgPSB3ZWVrZGF5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLmludmFsaWRXZWVrZGF5ID0gaW5wdXQ7XG4gICAgfVxufSk7XG5cbmFkZFdlZWtQYXJzZVRva2VuKFsnZCcsICdlJywgJ0UnXSwgZnVuY3Rpb24gKGlucHV0LCB3ZWVrLCBjb25maWcsIHRva2VuKSB7XG4gICAgd2Vla1t0b2tlbl0gPSB0b0ludChpbnB1dCk7XG59KTtcblxuLy8gSEVMUEVSU1xuXG5mdW5jdGlvbiBwYXJzZVdlZWtkYXkoaW5wdXQsIGxvY2FsZSkge1xuICAgIGlmICh0eXBlb2YgaW5wdXQgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiBpbnB1dDtcbiAgICB9XG5cbiAgICBpZiAoIWlzTmFOKGlucHV0KSkge1xuICAgICAgICByZXR1cm4gcGFyc2VJbnQoaW5wdXQsIDEwKTtcbiAgICB9XG5cbiAgICBpbnB1dCA9IGxvY2FsZS53ZWVrZGF5c1BhcnNlKGlucHV0KTtcbiAgICBpZiAodHlwZW9mIGlucHV0ID09PSAnbnVtYmVyJykge1xuICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIHBhcnNlSXNvV2Vla2RheShpbnB1dCwgbG9jYWxlKSB7XG4gICAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIGxvY2FsZS53ZWVrZGF5c1BhcnNlKGlucHV0KSAlIDcgfHwgNztcbiAgICB9XG4gICAgcmV0dXJuIGlzTmFOKGlucHV0KSA/IG51bGwgOiBpbnB1dDtcbn1cblxuLy8gTE9DQUxFU1xuXG52YXIgZGVmYXVsdExvY2FsZVdlZWtkYXlzID0gJ1N1bmRheV9Nb25kYXlfVHVlc2RheV9XZWRuZXNkYXlfVGh1cnNkYXlfRnJpZGF5X1NhdHVyZGF5Jy5zcGxpdCgnXycpO1xuZnVuY3Rpb24gbG9jYWxlV2Vla2RheXMgKG0sIGZvcm1hdCkge1xuICAgIGlmICghbSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fd2Vla2RheXM7XG4gICAgfVxuICAgIHJldHVybiBpc0FycmF5KHRoaXMuX3dlZWtkYXlzKSA/IHRoaXMuX3dlZWtkYXlzW20uZGF5KCldIDpcbiAgICAgICAgdGhpcy5fd2Vla2RheXNbdGhpcy5fd2Vla2RheXMuaXNGb3JtYXQudGVzdChmb3JtYXQpID8gJ2Zvcm1hdCcgOiAnc3RhbmRhbG9uZSddW20uZGF5KCldO1xufVxuXG52YXIgZGVmYXVsdExvY2FsZVdlZWtkYXlzU2hvcnQgPSAnU3VuX01vbl9UdWVfV2VkX1RodV9GcmlfU2F0Jy5zcGxpdCgnXycpO1xuZnVuY3Rpb24gbG9jYWxlV2Vla2RheXNTaG9ydCAobSkge1xuICAgIHJldHVybiAobSkgPyB0aGlzLl93ZWVrZGF5c1Nob3J0W20uZGF5KCldIDogdGhpcy5fd2Vla2RheXNTaG9ydDtcbn1cblxudmFyIGRlZmF1bHRMb2NhbGVXZWVrZGF5c01pbiA9ICdTdV9Nb19UdV9XZV9UaF9Gcl9TYScuc3BsaXQoJ18nKTtcbmZ1bmN0aW9uIGxvY2FsZVdlZWtkYXlzTWluIChtKSB7XG4gICAgcmV0dXJuIChtKSA/IHRoaXMuX3dlZWtkYXlzTWluW20uZGF5KCldIDogdGhpcy5fd2Vla2RheXNNaW47XG59XG5cbmZ1bmN0aW9uIGhhbmRsZVN0cmljdFBhcnNlJDEod2Vla2RheU5hbWUsIGZvcm1hdCwgc3RyaWN0KSB7XG4gICAgdmFyIGksIGlpLCBtb20sIGxsYyA9IHdlZWtkYXlOYW1lLnRvTG9jYWxlTG93ZXJDYXNlKCk7XG4gICAgaWYgKCF0aGlzLl93ZWVrZGF5c1BhcnNlKSB7XG4gICAgICAgIHRoaXMuX3dlZWtkYXlzUGFyc2UgPSBbXTtcbiAgICAgICAgdGhpcy5fc2hvcnRXZWVrZGF5c1BhcnNlID0gW107XG4gICAgICAgIHRoaXMuX21pbldlZWtkYXlzUGFyc2UgPSBbXTtcblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgNzsgKytpKSB7XG4gICAgICAgICAgICBtb20gPSBjcmVhdGVVVEMoWzIwMDAsIDFdKS5kYXkoaSk7XG4gICAgICAgICAgICB0aGlzLl9taW5XZWVrZGF5c1BhcnNlW2ldID0gdGhpcy53ZWVrZGF5c01pbihtb20sICcnKS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgdGhpcy5fc2hvcnRXZWVrZGF5c1BhcnNlW2ldID0gdGhpcy53ZWVrZGF5c1Nob3J0KG1vbSwgJycpLnRvTG9jYWxlTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICB0aGlzLl93ZWVrZGF5c1BhcnNlW2ldID0gdGhpcy53ZWVrZGF5cyhtb20sICcnKS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHN0cmljdCkge1xuICAgICAgICBpZiAoZm9ybWF0ID09PSAnZGRkZCcpIHtcbiAgICAgICAgICAgIGlpID0gaW5kZXhPZiQxLmNhbGwodGhpcy5fd2Vla2RheXNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgIHJldHVybiBpaSAhPT0gLTEgPyBpaSA6IG51bGw7XG4gICAgICAgIH0gZWxzZSBpZiAoZm9ybWF0ID09PSAnZGRkJykge1xuICAgICAgICAgICAgaWkgPSBpbmRleE9mJDEuY2FsbCh0aGlzLl9zaG9ydFdlZWtkYXlzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICByZXR1cm4gaWkgIT09IC0xID8gaWkgOiBudWxsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWkgPSBpbmRleE9mJDEuY2FsbCh0aGlzLl9taW5XZWVrZGF5c1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgcmV0dXJuIGlpICE9PSAtMSA/IGlpIDogbnVsbDtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChmb3JtYXQgPT09ICdkZGRkJykge1xuICAgICAgICAgICAgaWkgPSBpbmRleE9mJDEuY2FsbCh0aGlzLl93ZWVrZGF5c1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgaWYgKGlpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlpID0gaW5kZXhPZiQxLmNhbGwodGhpcy5fc2hvcnRXZWVrZGF5c1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgaWYgKGlpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlpID0gaW5kZXhPZiQxLmNhbGwodGhpcy5fbWluV2Vla2RheXNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgIHJldHVybiBpaSAhPT0gLTEgPyBpaSA6IG51bGw7XG4gICAgICAgIH0gZWxzZSBpZiAoZm9ybWF0ID09PSAnZGRkJykge1xuICAgICAgICAgICAgaWkgPSBpbmRleE9mJDEuY2FsbCh0aGlzLl9zaG9ydFdlZWtkYXlzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICBpZiAoaWkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWkgPSBpbmRleE9mJDEuY2FsbCh0aGlzLl93ZWVrZGF5c1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgaWYgKGlpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlpID0gaW5kZXhPZiQxLmNhbGwodGhpcy5fbWluV2Vla2RheXNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgIHJldHVybiBpaSAhPT0gLTEgPyBpaSA6IG51bGw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpaSA9IGluZGV4T2YkMS5jYWxsKHRoaXMuX21pbldlZWtkYXlzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICBpZiAoaWkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWkgPSBpbmRleE9mJDEuY2FsbCh0aGlzLl93ZWVrZGF5c1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgaWYgKGlpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlpID0gaW5kZXhPZiQxLmNhbGwodGhpcy5fc2hvcnRXZWVrZGF5c1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgcmV0dXJuIGlpICE9PSAtMSA/IGlpIDogbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gbG9jYWxlV2Vla2RheXNQYXJzZSAod2Vla2RheU5hbWUsIGZvcm1hdCwgc3RyaWN0KSB7XG4gICAgdmFyIGksIG1vbSwgcmVnZXg7XG5cbiAgICBpZiAodGhpcy5fd2Vla2RheXNQYXJzZUV4YWN0KSB7XG4gICAgICAgIHJldHVybiBoYW5kbGVTdHJpY3RQYXJzZSQxLmNhbGwodGhpcywgd2Vla2RheU5hbWUsIGZvcm1hdCwgc3RyaWN0KTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuX3dlZWtkYXlzUGFyc2UpIHtcbiAgICAgICAgdGhpcy5fd2Vla2RheXNQYXJzZSA9IFtdO1xuICAgICAgICB0aGlzLl9taW5XZWVrZGF5c1BhcnNlID0gW107XG4gICAgICAgIHRoaXMuX3Nob3J0V2Vla2RheXNQYXJzZSA9IFtdO1xuICAgICAgICB0aGlzLl9mdWxsV2Vla2RheXNQYXJzZSA9IFtdO1xuICAgIH1cblxuICAgIGZvciAoaSA9IDA7IGkgPCA3OyBpKyspIHtcbiAgICAgICAgLy8gbWFrZSB0aGUgcmVnZXggaWYgd2UgZG9uJ3QgaGF2ZSBpdCBhbHJlYWR5XG5cbiAgICAgICAgbW9tID0gY3JlYXRlVVRDKFsyMDAwLCAxXSkuZGF5KGkpO1xuICAgICAgICBpZiAoc3RyaWN0ICYmICF0aGlzLl9mdWxsV2Vla2RheXNQYXJzZVtpXSkge1xuICAgICAgICAgICAgdGhpcy5fZnVsbFdlZWtkYXlzUGFyc2VbaV0gPSBuZXcgUmVnRXhwKCdeJyArIHRoaXMud2Vla2RheXMobW9tLCAnJykucmVwbGFjZSgnLicsICdcXC4/JykgKyAnJCcsICdpJyk7XG4gICAgICAgICAgICB0aGlzLl9zaG9ydFdlZWtkYXlzUGFyc2VbaV0gPSBuZXcgUmVnRXhwKCdeJyArIHRoaXMud2Vla2RheXNTaG9ydChtb20sICcnKS5yZXBsYWNlKCcuJywgJ1xcLj8nKSArICckJywgJ2knKTtcbiAgICAgICAgICAgIHRoaXMuX21pbldlZWtkYXlzUGFyc2VbaV0gPSBuZXcgUmVnRXhwKCdeJyArIHRoaXMud2Vla2RheXNNaW4obW9tLCAnJykucmVwbGFjZSgnLicsICdcXC4/JykgKyAnJCcsICdpJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLl93ZWVrZGF5c1BhcnNlW2ldKSB7XG4gICAgICAgICAgICByZWdleCA9ICdeJyArIHRoaXMud2Vla2RheXMobW9tLCAnJykgKyAnfF4nICsgdGhpcy53ZWVrZGF5c1Nob3J0KG1vbSwgJycpICsgJ3xeJyArIHRoaXMud2Vla2RheXNNaW4obW9tLCAnJyk7XG4gICAgICAgICAgICB0aGlzLl93ZWVrZGF5c1BhcnNlW2ldID0gbmV3IFJlZ0V4cChyZWdleC5yZXBsYWNlKCcuJywgJycpLCAnaScpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHRlc3QgdGhlIHJlZ2V4XG4gICAgICAgIGlmIChzdHJpY3QgJiYgZm9ybWF0ID09PSAnZGRkZCcgJiYgdGhpcy5fZnVsbFdlZWtkYXlzUGFyc2VbaV0udGVzdCh3ZWVrZGF5TmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICB9IGVsc2UgaWYgKHN0cmljdCAmJiBmb3JtYXQgPT09ICdkZGQnICYmIHRoaXMuX3Nob3J0V2Vla2RheXNQYXJzZVtpXS50ZXN0KHdlZWtkYXlOYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgIH0gZWxzZSBpZiAoc3RyaWN0ICYmIGZvcm1hdCA9PT0gJ2RkJyAmJiB0aGlzLl9taW5XZWVrZGF5c1BhcnNlW2ldLnRlc3Qod2Vla2RheU5hbWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgfSBlbHNlIGlmICghc3RyaWN0ICYmIHRoaXMuX3dlZWtkYXlzUGFyc2VbaV0udGVzdCh3ZWVrZGF5TmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vLyBNT01FTlRTXG5cbmZ1bmN0aW9uIGdldFNldERheU9mV2VlayAoaW5wdXQpIHtcbiAgICBpZiAoIXRoaXMuaXNWYWxpZCgpKSB7XG4gICAgICAgIHJldHVybiBpbnB1dCAhPSBudWxsID8gdGhpcyA6IE5hTjtcbiAgICB9XG4gICAgdmFyIGRheSA9IHRoaXMuX2lzVVRDID8gdGhpcy5fZC5nZXRVVENEYXkoKSA6IHRoaXMuX2QuZ2V0RGF5KCk7XG4gICAgaWYgKGlucHV0ICE9IG51bGwpIHtcbiAgICAgICAgaW5wdXQgPSBwYXJzZVdlZWtkYXkoaW5wdXQsIHRoaXMubG9jYWxlRGF0YSgpKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkKGlucHV0IC0gZGF5LCAnZCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBkYXk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRTZXRMb2NhbGVEYXlPZldlZWsgKGlucHV0KSB7XG4gICAgaWYgKCF0aGlzLmlzVmFsaWQoKSkge1xuICAgICAgICByZXR1cm4gaW5wdXQgIT0gbnVsbCA/IHRoaXMgOiBOYU47XG4gICAgfVxuICAgIHZhciB3ZWVrZGF5ID0gKHRoaXMuZGF5KCkgKyA3IC0gdGhpcy5sb2NhbGVEYXRhKCkuX3dlZWsuZG93KSAlIDc7XG4gICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyB3ZWVrZGF5IDogdGhpcy5hZGQoaW5wdXQgLSB3ZWVrZGF5LCAnZCcpO1xufVxuXG5mdW5jdGlvbiBnZXRTZXRJU09EYXlPZldlZWsgKGlucHV0KSB7XG4gICAgaWYgKCF0aGlzLmlzVmFsaWQoKSkge1xuICAgICAgICByZXR1cm4gaW5wdXQgIT0gbnVsbCA/IHRoaXMgOiBOYU47XG4gICAgfVxuXG4gICAgLy8gYmVoYXZlcyB0aGUgc2FtZSBhcyBtb21lbnQjZGF5IGV4Y2VwdFxuICAgIC8vIGFzIGEgZ2V0dGVyLCByZXR1cm5zIDcgaW5zdGVhZCBvZiAwICgxLTcgcmFuZ2UgaW5zdGVhZCBvZiAwLTYpXG4gICAgLy8gYXMgYSBzZXR0ZXIsIHN1bmRheSBzaG91bGQgYmVsb25nIHRvIHRoZSBwcmV2aW91cyB3ZWVrLlxuXG4gICAgaWYgKGlucHV0ICE9IG51bGwpIHtcbiAgICAgICAgdmFyIHdlZWtkYXkgPSBwYXJzZUlzb1dlZWtkYXkoaW5wdXQsIHRoaXMubG9jYWxlRGF0YSgpKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF5KHRoaXMuZGF5KCkgJSA3ID8gd2Vla2RheSA6IHdlZWtkYXkgLSA3KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5kYXkoKSB8fCA3O1xuICAgIH1cbn1cblxudmFyIGRlZmF1bHRXZWVrZGF5c1JlZ2V4ID0gbWF0Y2hXb3JkO1xuZnVuY3Rpb24gd2Vla2RheXNSZWdleCAoaXNTdHJpY3QpIHtcbiAgICBpZiAodGhpcy5fd2Vla2RheXNQYXJzZUV4YWN0KSB7XG4gICAgICAgIGlmICghaGFzT3duUHJvcCh0aGlzLCAnX3dlZWtkYXlzUmVnZXgnKSkge1xuICAgICAgICAgICAgY29tcHV0ZVdlZWtkYXlzUGFyc2UuY2FsbCh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNTdHJpY3QpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl93ZWVrZGF5c1N0cmljdFJlZ2V4O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzUmVnZXg7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoIWhhc093blByb3AodGhpcywgJ193ZWVrZGF5c1JlZ2V4JykpIHtcbiAgICAgICAgICAgIHRoaXMuX3dlZWtkYXlzUmVnZXggPSBkZWZhdWx0V2Vla2RheXNSZWdleDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fd2Vla2RheXNTdHJpY3RSZWdleCAmJiBpc1N0cmljdCA/XG4gICAgICAgICAgICB0aGlzLl93ZWVrZGF5c1N0cmljdFJlZ2V4IDogdGhpcy5fd2Vla2RheXNSZWdleDtcbiAgICB9XG59XG5cbnZhciBkZWZhdWx0V2Vla2RheXNTaG9ydFJlZ2V4ID0gbWF0Y2hXb3JkO1xuZnVuY3Rpb24gd2Vla2RheXNTaG9ydFJlZ2V4IChpc1N0cmljdCkge1xuICAgIGlmICh0aGlzLl93ZWVrZGF5c1BhcnNlRXhhY3QpIHtcbiAgICAgICAgaWYgKCFoYXNPd25Qcm9wKHRoaXMsICdfd2Vla2RheXNSZWdleCcpKSB7XG4gICAgICAgICAgICBjb21wdXRlV2Vla2RheXNQYXJzZS5jYWxsKHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc1N0cmljdCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzU2hvcnRTdHJpY3RSZWdleDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl93ZWVrZGF5c1Nob3J0UmVnZXg7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoIWhhc093blByb3AodGhpcywgJ193ZWVrZGF5c1Nob3J0UmVnZXgnKSkge1xuICAgICAgICAgICAgdGhpcy5fd2Vla2RheXNTaG9ydFJlZ2V4ID0gZGVmYXVsdFdlZWtkYXlzU2hvcnRSZWdleDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fd2Vla2RheXNTaG9ydFN0cmljdFJlZ2V4ICYmIGlzU3RyaWN0ID9cbiAgICAgICAgICAgIHRoaXMuX3dlZWtkYXlzU2hvcnRTdHJpY3RSZWdleCA6IHRoaXMuX3dlZWtkYXlzU2hvcnRSZWdleDtcbiAgICB9XG59XG5cbnZhciBkZWZhdWx0V2Vla2RheXNNaW5SZWdleCA9IG1hdGNoV29yZDtcbmZ1bmN0aW9uIHdlZWtkYXlzTWluUmVnZXggKGlzU3RyaWN0KSB7XG4gICAgaWYgKHRoaXMuX3dlZWtkYXlzUGFyc2VFeGFjdCkge1xuICAgICAgICBpZiAoIWhhc093blByb3AodGhpcywgJ193ZWVrZGF5c1JlZ2V4JykpIHtcbiAgICAgICAgICAgIGNvbXB1dGVXZWVrZGF5c1BhcnNlLmNhbGwodGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzU3RyaWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fd2Vla2RheXNNaW5TdHJpY3RSZWdleDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl93ZWVrZGF5c01pblJlZ2V4O1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCFoYXNPd25Qcm9wKHRoaXMsICdfd2Vla2RheXNNaW5SZWdleCcpKSB7XG4gICAgICAgICAgICB0aGlzLl93ZWVrZGF5c01pblJlZ2V4ID0gZGVmYXVsdFdlZWtkYXlzTWluUmVnZXg7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzTWluU3RyaWN0UmVnZXggJiYgaXNTdHJpY3QgP1xuICAgICAgICAgICAgdGhpcy5fd2Vla2RheXNNaW5TdHJpY3RSZWdleCA6IHRoaXMuX3dlZWtkYXlzTWluUmVnZXg7XG4gICAgfVxufVxuXG5cbmZ1bmN0aW9uIGNvbXB1dGVXZWVrZGF5c1BhcnNlICgpIHtcbiAgICBmdW5jdGlvbiBjbXBMZW5SZXYoYSwgYikge1xuICAgICAgICByZXR1cm4gYi5sZW5ndGggLSBhLmxlbmd0aDtcbiAgICB9XG5cbiAgICB2YXIgbWluUGllY2VzID0gW10sIHNob3J0UGllY2VzID0gW10sIGxvbmdQaWVjZXMgPSBbXSwgbWl4ZWRQaWVjZXMgPSBbXSxcbiAgICAgICAgaSwgbW9tLCBtaW5wLCBzaG9ydHAsIGxvbmdwO1xuICAgIGZvciAoaSA9IDA7IGkgPCA3OyBpKyspIHtcbiAgICAgICAgLy8gbWFrZSB0aGUgcmVnZXggaWYgd2UgZG9uJ3QgaGF2ZSBpdCBhbHJlYWR5XG4gICAgICAgIG1vbSA9IGNyZWF0ZVVUQyhbMjAwMCwgMV0pLmRheShpKTtcbiAgICAgICAgbWlucCA9IHRoaXMud2Vla2RheXNNaW4obW9tLCAnJyk7XG4gICAgICAgIHNob3J0cCA9IHRoaXMud2Vla2RheXNTaG9ydChtb20sICcnKTtcbiAgICAgICAgbG9uZ3AgPSB0aGlzLndlZWtkYXlzKG1vbSwgJycpO1xuICAgICAgICBtaW5QaWVjZXMucHVzaChtaW5wKTtcbiAgICAgICAgc2hvcnRQaWVjZXMucHVzaChzaG9ydHApO1xuICAgICAgICBsb25nUGllY2VzLnB1c2gobG9uZ3ApO1xuICAgICAgICBtaXhlZFBpZWNlcy5wdXNoKG1pbnApO1xuICAgICAgICBtaXhlZFBpZWNlcy5wdXNoKHNob3J0cCk7XG4gICAgICAgIG1peGVkUGllY2VzLnB1c2gobG9uZ3ApO1xuICAgIH1cbiAgICAvLyBTb3J0aW5nIG1ha2VzIHN1cmUgaWYgb25lIHdlZWtkYXkgKG9yIGFiYnIpIGlzIGEgcHJlZml4IG9mIGFub3RoZXIgaXRcbiAgICAvLyB3aWxsIG1hdGNoIHRoZSBsb25nZXIgcGllY2UuXG4gICAgbWluUGllY2VzLnNvcnQoY21wTGVuUmV2KTtcbiAgICBzaG9ydFBpZWNlcy5zb3J0KGNtcExlblJldik7XG4gICAgbG9uZ1BpZWNlcy5zb3J0KGNtcExlblJldik7XG4gICAgbWl4ZWRQaWVjZXMuc29ydChjbXBMZW5SZXYpO1xuICAgIGZvciAoaSA9IDA7IGkgPCA3OyBpKyspIHtcbiAgICAgICAgc2hvcnRQaWVjZXNbaV0gPSByZWdleEVzY2FwZShzaG9ydFBpZWNlc1tpXSk7XG4gICAgICAgIGxvbmdQaWVjZXNbaV0gPSByZWdleEVzY2FwZShsb25nUGllY2VzW2ldKTtcbiAgICAgICAgbWl4ZWRQaWVjZXNbaV0gPSByZWdleEVzY2FwZShtaXhlZFBpZWNlc1tpXSk7XG4gICAgfVxuXG4gICAgdGhpcy5fd2Vla2RheXNSZWdleCA9IG5ldyBSZWdFeHAoJ14oJyArIG1peGVkUGllY2VzLmpvaW4oJ3wnKSArICcpJywgJ2knKTtcbiAgICB0aGlzLl93ZWVrZGF5c1Nob3J0UmVnZXggPSB0aGlzLl93ZWVrZGF5c1JlZ2V4O1xuICAgIHRoaXMuX3dlZWtkYXlzTWluUmVnZXggPSB0aGlzLl93ZWVrZGF5c1JlZ2V4O1xuXG4gICAgdGhpcy5fd2Vla2RheXNTdHJpY3RSZWdleCA9IG5ldyBSZWdFeHAoJ14oJyArIGxvbmdQaWVjZXMuam9pbignfCcpICsgJyknLCAnaScpO1xuICAgIHRoaXMuX3dlZWtkYXlzU2hvcnRTdHJpY3RSZWdleCA9IG5ldyBSZWdFeHAoJ14oJyArIHNob3J0UGllY2VzLmpvaW4oJ3wnKSArICcpJywgJ2knKTtcbiAgICB0aGlzLl93ZWVrZGF5c01pblN0cmljdFJlZ2V4ID0gbmV3IFJlZ0V4cCgnXignICsgbWluUGllY2VzLmpvaW4oJ3wnKSArICcpJywgJ2knKTtcbn1cblxuLy8gRk9STUFUVElOR1xuXG5mdW5jdGlvbiBoRm9ybWF0KCkge1xuICAgIHJldHVybiB0aGlzLmhvdXJzKCkgJSAxMiB8fCAxMjtcbn1cblxuZnVuY3Rpb24ga0Zvcm1hdCgpIHtcbiAgICByZXR1cm4gdGhpcy5ob3VycygpIHx8IDI0O1xufVxuXG5hZGRGb3JtYXRUb2tlbignSCcsIFsnSEgnLCAyXSwgMCwgJ2hvdXInKTtcbmFkZEZvcm1hdFRva2VuKCdoJywgWydoaCcsIDJdLCAwLCBoRm9ybWF0KTtcbmFkZEZvcm1hdFRva2VuKCdrJywgWydraycsIDJdLCAwLCBrRm9ybWF0KTtcblxuYWRkRm9ybWF0VG9rZW4oJ2htbScsIDAsIDAsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gJycgKyBoRm9ybWF0LmFwcGx5KHRoaXMpICsgemVyb0ZpbGwodGhpcy5taW51dGVzKCksIDIpO1xufSk7XG5cbmFkZEZvcm1hdFRva2VuKCdobW1zcycsIDAsIDAsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gJycgKyBoRm9ybWF0LmFwcGx5KHRoaXMpICsgemVyb0ZpbGwodGhpcy5taW51dGVzKCksIDIpICtcbiAgICAgICAgemVyb0ZpbGwodGhpcy5zZWNvbmRzKCksIDIpO1xufSk7XG5cbmFkZEZvcm1hdFRva2VuKCdIbW0nLCAwLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICcnICsgdGhpcy5ob3VycygpICsgemVyb0ZpbGwodGhpcy5taW51dGVzKCksIDIpO1xufSk7XG5cbmFkZEZvcm1hdFRva2VuKCdIbW1zcycsIDAsIDAsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gJycgKyB0aGlzLmhvdXJzKCkgKyB6ZXJvRmlsbCh0aGlzLm1pbnV0ZXMoKSwgMikgK1xuICAgICAgICB6ZXJvRmlsbCh0aGlzLnNlY29uZHMoKSwgMik7XG59KTtcblxuZnVuY3Rpb24gbWVyaWRpZW0gKHRva2VuLCBsb3dlcmNhc2UpIHtcbiAgICBhZGRGb3JtYXRUb2tlbih0b2tlbiwgMCwgMCwgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCkubWVyaWRpZW0odGhpcy5ob3VycygpLCB0aGlzLm1pbnV0ZXMoKSwgbG93ZXJjYXNlKTtcbiAgICB9KTtcbn1cblxubWVyaWRpZW0oJ2EnLCB0cnVlKTtcbm1lcmlkaWVtKCdBJywgZmFsc2UpO1xuXG4vLyBBTElBU0VTXG5cbmFkZFVuaXRBbGlhcygnaG91cicsICdoJyk7XG5cbi8vIFBSSU9SSVRZXG5hZGRVbml0UHJpb3JpdHkoJ2hvdXInLCAxMyk7XG5cbi8vIFBBUlNJTkdcblxuZnVuY3Rpb24gbWF0Y2hNZXJpZGllbSAoaXNTdHJpY3QsIGxvY2FsZSkge1xuICAgIHJldHVybiBsb2NhbGUuX21lcmlkaWVtUGFyc2U7XG59XG5cbmFkZFJlZ2V4VG9rZW4oJ2EnLCAgbWF0Y2hNZXJpZGllbSk7XG5hZGRSZWdleFRva2VuKCdBJywgIG1hdGNoTWVyaWRpZW0pO1xuYWRkUmVnZXhUb2tlbignSCcsICBtYXRjaDF0bzIpO1xuYWRkUmVnZXhUb2tlbignaCcsICBtYXRjaDF0bzIpO1xuYWRkUmVnZXhUb2tlbignSEgnLCBtYXRjaDF0bzIsIG1hdGNoMik7XG5hZGRSZWdleFRva2VuKCdoaCcsIG1hdGNoMXRvMiwgbWF0Y2gyKTtcblxuYWRkUmVnZXhUb2tlbignaG1tJywgbWF0Y2gzdG80KTtcbmFkZFJlZ2V4VG9rZW4oJ2htbXNzJywgbWF0Y2g1dG82KTtcbmFkZFJlZ2V4VG9rZW4oJ0htbScsIG1hdGNoM3RvNCk7XG5hZGRSZWdleFRva2VuKCdIbW1zcycsIG1hdGNoNXRvNik7XG5cbmFkZFBhcnNlVG9rZW4oWydIJywgJ0hIJ10sIEhPVVIpO1xuYWRkUGFyc2VUb2tlbihbJ2EnLCAnQSddLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5LCBjb25maWcpIHtcbiAgICBjb25maWcuX2lzUG0gPSBjb25maWcuX2xvY2FsZS5pc1BNKGlucHV0KTtcbiAgICBjb25maWcuX21lcmlkaWVtID0gaW5wdXQ7XG59KTtcbmFkZFBhcnNlVG9rZW4oWydoJywgJ2hoJ10sIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXksIGNvbmZpZykge1xuICAgIGFycmF5W0hPVVJdID0gdG9JbnQoaW5wdXQpO1xuICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLmJpZ0hvdXIgPSB0cnVlO1xufSk7XG5hZGRQYXJzZVRva2VuKCdobW0nLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5LCBjb25maWcpIHtcbiAgICB2YXIgcG9zID0gaW5wdXQubGVuZ3RoIC0gMjtcbiAgICBhcnJheVtIT1VSXSA9IHRvSW50KGlucHV0LnN1YnN0cigwLCBwb3MpKTtcbiAgICBhcnJheVtNSU5VVEVdID0gdG9JbnQoaW5wdXQuc3Vic3RyKHBvcykpO1xuICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLmJpZ0hvdXIgPSB0cnVlO1xufSk7XG5hZGRQYXJzZVRva2VuKCdobW1zcycsIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXksIGNvbmZpZykge1xuICAgIHZhciBwb3MxID0gaW5wdXQubGVuZ3RoIC0gNDtcbiAgICB2YXIgcG9zMiA9IGlucHV0Lmxlbmd0aCAtIDI7XG4gICAgYXJyYXlbSE9VUl0gPSB0b0ludChpbnB1dC5zdWJzdHIoMCwgcG9zMSkpO1xuICAgIGFycmF5W01JTlVURV0gPSB0b0ludChpbnB1dC5zdWJzdHIocG9zMSwgMikpO1xuICAgIGFycmF5W1NFQ09ORF0gPSB0b0ludChpbnB1dC5zdWJzdHIocG9zMikpO1xuICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLmJpZ0hvdXIgPSB0cnVlO1xufSk7XG5hZGRQYXJzZVRva2VuKCdIbW0nLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5LCBjb25maWcpIHtcbiAgICB2YXIgcG9zID0gaW5wdXQubGVuZ3RoIC0gMjtcbiAgICBhcnJheVtIT1VSXSA9IHRvSW50KGlucHV0LnN1YnN0cigwLCBwb3MpKTtcbiAgICBhcnJheVtNSU5VVEVdID0gdG9JbnQoaW5wdXQuc3Vic3RyKHBvcykpO1xufSk7XG5hZGRQYXJzZVRva2VuKCdIbW1zcycsIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXksIGNvbmZpZykge1xuICAgIHZhciBwb3MxID0gaW5wdXQubGVuZ3RoIC0gNDtcbiAgICB2YXIgcG9zMiA9IGlucHV0Lmxlbmd0aCAtIDI7XG4gICAgYXJyYXlbSE9VUl0gPSB0b0ludChpbnB1dC5zdWJzdHIoMCwgcG9zMSkpO1xuICAgIGFycmF5W01JTlVURV0gPSB0b0ludChpbnB1dC5zdWJzdHIocG9zMSwgMikpO1xuICAgIGFycmF5W1NFQ09ORF0gPSB0b0ludChpbnB1dC5zdWJzdHIocG9zMikpO1xufSk7XG5cbi8vIExPQ0FMRVNcblxuZnVuY3Rpb24gbG9jYWxlSXNQTSAoaW5wdXQpIHtcbiAgICAvLyBJRTggUXVpcmtzIE1vZGUgJiBJRTcgU3RhbmRhcmRzIE1vZGUgZG8gbm90IGFsbG93IGFjY2Vzc2luZyBzdHJpbmdzIGxpa2UgYXJyYXlzXG4gICAgLy8gVXNpbmcgY2hhckF0IHNob3VsZCBiZSBtb3JlIGNvbXBhdGlibGUuXG4gICAgcmV0dXJuICgoaW5wdXQgKyAnJykudG9Mb3dlckNhc2UoKS5jaGFyQXQoMCkgPT09ICdwJyk7XG59XG5cbnZhciBkZWZhdWx0TG9jYWxlTWVyaWRpZW1QYXJzZSA9IC9bYXBdXFwuP20/XFwuPy9pO1xuZnVuY3Rpb24gbG9jYWxlTWVyaWRpZW0gKGhvdXJzLCBtaW51dGVzLCBpc0xvd2VyKSB7XG4gICAgaWYgKGhvdXJzID4gMTEpIHtcbiAgICAgICAgcmV0dXJuIGlzTG93ZXIgPyAncG0nIDogJ1BNJztcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gaXNMb3dlciA/ICdhbScgOiAnQU0nO1xuICAgIH1cbn1cblxuXG4vLyBNT01FTlRTXG5cbi8vIFNldHRpbmcgdGhlIGhvdXIgc2hvdWxkIGtlZXAgdGhlIHRpbWUsIGJlY2F1c2UgdGhlIHVzZXIgZXhwbGljaXRseVxuLy8gc3BlY2lmaWVkIHdoaWNoIGhvdXIgaGUgd2FudHMuIFNvIHRyeWluZyB0byBtYWludGFpbiB0aGUgc2FtZSBob3VyIChpblxuLy8gYSBuZXcgdGltZXpvbmUpIG1ha2VzIHNlbnNlLiBBZGRpbmcvc3VidHJhY3RpbmcgaG91cnMgZG9lcyBub3QgZm9sbG93XG4vLyB0aGlzIHJ1bGUuXG52YXIgZ2V0U2V0SG91ciA9IG1ha2VHZXRTZXQoJ0hvdXJzJywgdHJ1ZSk7XG5cbi8vIG1vbnRoc1xuLy8gd2Vla1xuLy8gd2Vla2RheXNcbi8vIG1lcmlkaWVtXG52YXIgYmFzZUNvbmZpZyA9IHtcbiAgICBjYWxlbmRhcjogZGVmYXVsdENhbGVuZGFyLFxuICAgIGxvbmdEYXRlRm9ybWF0OiBkZWZhdWx0TG9uZ0RhdGVGb3JtYXQsXG4gICAgaW52YWxpZERhdGU6IGRlZmF1bHRJbnZhbGlkRGF0ZSxcbiAgICBvcmRpbmFsOiBkZWZhdWx0T3JkaW5hbCxcbiAgICBvcmRpbmFsUGFyc2U6IGRlZmF1bHRPcmRpbmFsUGFyc2UsXG4gICAgcmVsYXRpdmVUaW1lOiBkZWZhdWx0UmVsYXRpdmVUaW1lLFxuXG4gICAgbW9udGhzOiBkZWZhdWx0TG9jYWxlTW9udGhzLFxuICAgIG1vbnRoc1Nob3J0OiBkZWZhdWx0TG9jYWxlTW9udGhzU2hvcnQsXG5cbiAgICB3ZWVrOiBkZWZhdWx0TG9jYWxlV2VlayxcblxuICAgIHdlZWtkYXlzOiBkZWZhdWx0TG9jYWxlV2Vla2RheXMsXG4gICAgd2Vla2RheXNNaW46IGRlZmF1bHRMb2NhbGVXZWVrZGF5c01pbixcbiAgICB3ZWVrZGF5c1Nob3J0OiBkZWZhdWx0TG9jYWxlV2Vla2RheXNTaG9ydCxcblxuICAgIG1lcmlkaWVtUGFyc2U6IGRlZmF1bHRMb2NhbGVNZXJpZGllbVBhcnNlXG59O1xuXG4vLyBpbnRlcm5hbCBzdG9yYWdlIGZvciBsb2NhbGUgY29uZmlnIGZpbGVzXG52YXIgbG9jYWxlcyA9IHt9O1xudmFyIGxvY2FsZUZhbWlsaWVzID0ge307XG52YXIgZ2xvYmFsTG9jYWxlO1xuXG5mdW5jdGlvbiBub3JtYWxpemVMb2NhbGUoa2V5KSB7XG4gICAgcmV0dXJuIGtleSA/IGtleS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoJ18nLCAnLScpIDoga2V5O1xufVxuXG4vLyBwaWNrIHRoZSBsb2NhbGUgZnJvbSB0aGUgYXJyYXlcbi8vIHRyeSBbJ2VuLWF1JywgJ2VuLWdiJ10gYXMgJ2VuLWF1JywgJ2VuLWdiJywgJ2VuJywgYXMgaW4gbW92ZSB0aHJvdWdoIHRoZSBsaXN0IHRyeWluZyBlYWNoXG4vLyBzdWJzdHJpbmcgZnJvbSBtb3N0IHNwZWNpZmljIHRvIGxlYXN0LCBidXQgbW92ZSB0byB0aGUgbmV4dCBhcnJheSBpdGVtIGlmIGl0J3MgYSBtb3JlIHNwZWNpZmljIHZhcmlhbnQgdGhhbiB0aGUgY3VycmVudCByb290XG5mdW5jdGlvbiBjaG9vc2VMb2NhbGUobmFtZXMpIHtcbiAgICB2YXIgaSA9IDAsIGosIG5leHQsIGxvY2FsZSwgc3BsaXQ7XG5cbiAgICB3aGlsZSAoaSA8IG5hbWVzLmxlbmd0aCkge1xuICAgICAgICBzcGxpdCA9IG5vcm1hbGl6ZUxvY2FsZShuYW1lc1tpXSkuc3BsaXQoJy0nKTtcbiAgICAgICAgaiA9IHNwbGl0Lmxlbmd0aDtcbiAgICAgICAgbmV4dCA9IG5vcm1hbGl6ZUxvY2FsZShuYW1lc1tpICsgMV0pO1xuICAgICAgICBuZXh0ID0gbmV4dCA/IG5leHQuc3BsaXQoJy0nKSA6IG51bGw7XG4gICAgICAgIHdoaWxlIChqID4gMCkge1xuICAgICAgICAgICAgbG9jYWxlID0gbG9hZExvY2FsZShzcGxpdC5zbGljZSgwLCBqKS5qb2luKCctJykpO1xuICAgICAgICAgICAgaWYgKGxvY2FsZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsb2NhbGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobmV4dCAmJiBuZXh0Lmxlbmd0aCA+PSBqICYmIGNvbXBhcmVBcnJheXMoc3BsaXQsIG5leHQsIHRydWUpID49IGogLSAxKSB7XG4gICAgICAgICAgICAgICAgLy90aGUgbmV4dCBhcnJheSBpdGVtIGlzIGJldHRlciB0aGFuIGEgc2hhbGxvd2VyIHN1YnN0cmluZyBvZiB0aGlzIG9uZVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgai0tO1xuICAgICAgICB9XG4gICAgICAgIGkrKztcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGxvYWRMb2NhbGUobmFtZSkge1xuICAgIHZhciBvbGRMb2NhbGUgPSBudWxsO1xuICAgIC8vIFRPRE86IEZpbmQgYSBiZXR0ZXIgd2F5IHRvIHJlZ2lzdGVyIGFuZCBsb2FkIGFsbCB0aGUgbG9jYWxlcyBpbiBOb2RlXG4gICAgaWYgKCFsb2NhbGVzW25hbWVdICYmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykgJiZcbiAgICAgICAgICAgIG1vZHVsZSAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgb2xkTG9jYWxlID0gZ2xvYmFsTG9jYWxlLl9hYmJyO1xuICAgICAgICAgICAgcmVxdWlyZSgnLi9sb2NhbGUvJyArIG5hbWUpO1xuICAgICAgICAgICAgLy8gYmVjYXVzZSBkZWZpbmVMb2NhbGUgY3VycmVudGx5IGFsc28gc2V0cyB0aGUgZ2xvYmFsIGxvY2FsZSwgd2VcbiAgICAgICAgICAgIC8vIHdhbnQgdG8gdW5kbyB0aGF0IGZvciBsYXp5IGxvYWRlZCBsb2NhbGVzXG4gICAgICAgICAgICBnZXRTZXRHbG9iYWxMb2NhbGUob2xkTG9jYWxlKTtcbiAgICAgICAgfSBjYXRjaCAoZSkgeyB9XG4gICAgfVxuICAgIHJldHVybiBsb2NhbGVzW25hbWVdO1xufVxuXG4vLyBUaGlzIGZ1bmN0aW9uIHdpbGwgbG9hZCBsb2NhbGUgYW5kIHRoZW4gc2V0IHRoZSBnbG9iYWwgbG9jYWxlLiAgSWZcbi8vIG5vIGFyZ3VtZW50cyBhcmUgcGFzc2VkIGluLCBpdCB3aWxsIHNpbXBseSByZXR1cm4gdGhlIGN1cnJlbnQgZ2xvYmFsXG4vLyBsb2NhbGUga2V5LlxuZnVuY3Rpb24gZ2V0U2V0R2xvYmFsTG9jYWxlIChrZXksIHZhbHVlcykge1xuICAgIHZhciBkYXRhO1xuICAgIGlmIChrZXkpIHtcbiAgICAgICAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlcykpIHtcbiAgICAgICAgICAgIGRhdGEgPSBnZXRMb2NhbGUoa2V5KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGRhdGEgPSBkZWZpbmVMb2NhbGUoa2V5LCB2YWx1ZXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgICAgIC8vIG1vbWVudC5kdXJhdGlvbi5fbG9jYWxlID0gbW9tZW50Ll9sb2NhbGUgPSBkYXRhO1xuICAgICAgICAgICAgZ2xvYmFsTG9jYWxlID0gZGF0YTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBnbG9iYWxMb2NhbGUuX2FiYnI7XG59XG5cbmZ1bmN0aW9uIGRlZmluZUxvY2FsZSAobmFtZSwgY29uZmlnKSB7XG4gICAgaWYgKGNvbmZpZyAhPT0gbnVsbCkge1xuICAgICAgICB2YXIgcGFyZW50Q29uZmlnID0gYmFzZUNvbmZpZztcbiAgICAgICAgY29uZmlnLmFiYnIgPSBuYW1lO1xuICAgICAgICBpZiAobG9jYWxlc1tuYW1lXSAhPSBudWxsKSB7XG4gICAgICAgICAgICBkZXByZWNhdGVTaW1wbGUoJ2RlZmluZUxvY2FsZU92ZXJyaWRlJyxcbiAgICAgICAgICAgICAgICAgICAgJ3VzZSBtb21lbnQudXBkYXRlTG9jYWxlKGxvY2FsZU5hbWUsIGNvbmZpZykgdG8gY2hhbmdlICcgK1xuICAgICAgICAgICAgICAgICAgICAnYW4gZXhpc3RpbmcgbG9jYWxlLiBtb21lbnQuZGVmaW5lTG9jYWxlKGxvY2FsZU5hbWUsICcgK1xuICAgICAgICAgICAgICAgICAgICAnY29uZmlnKSBzaG91bGQgb25seSBiZSB1c2VkIGZvciBjcmVhdGluZyBhIG5ldyBsb2NhbGUgJyArXG4gICAgICAgICAgICAgICAgICAgICdTZWUgaHR0cDovL21vbWVudGpzLmNvbS9ndWlkZXMvIy93YXJuaW5ncy9kZWZpbmUtbG9jYWxlLyBmb3IgbW9yZSBpbmZvLicpO1xuICAgICAgICAgICAgcGFyZW50Q29uZmlnID0gbG9jYWxlc1tuYW1lXS5fY29uZmlnO1xuICAgICAgICB9IGVsc2UgaWYgKGNvbmZpZy5wYXJlbnRMb2NhbGUgIT0gbnVsbCkge1xuICAgICAgICAgICAgaWYgKGxvY2FsZXNbY29uZmlnLnBhcmVudExvY2FsZV0gIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHBhcmVudENvbmZpZyA9IGxvY2FsZXNbY29uZmlnLnBhcmVudExvY2FsZV0uX2NvbmZpZztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKCFsb2NhbGVGYW1pbGllc1tjb25maWcucGFyZW50TG9jYWxlXSkge1xuICAgICAgICAgICAgICAgICAgICBsb2NhbGVGYW1pbGllc1tjb25maWcucGFyZW50TG9jYWxlXSA9IFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsb2NhbGVGYW1pbGllc1tjb25maWcucGFyZW50TG9jYWxlXS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnOiBjb25maWdcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsb2NhbGVzW25hbWVdID0gbmV3IExvY2FsZShtZXJnZUNvbmZpZ3MocGFyZW50Q29uZmlnLCBjb25maWcpKTtcblxuICAgICAgICBpZiAobG9jYWxlRmFtaWxpZXNbbmFtZV0pIHtcbiAgICAgICAgICAgIGxvY2FsZUZhbWlsaWVzW25hbWVdLmZvckVhY2goZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgICAgICBkZWZpbmVMb2NhbGUoeC5uYW1lLCB4LmNvbmZpZyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGJhY2t3YXJkcyBjb21wYXQgZm9yIG5vdzogYWxzbyBzZXQgdGhlIGxvY2FsZVxuICAgICAgICAvLyBtYWtlIHN1cmUgd2Ugc2V0IHRoZSBsb2NhbGUgQUZURVIgYWxsIGNoaWxkIGxvY2FsZXMgaGF2ZSBiZWVuXG4gICAgICAgIC8vIGNyZWF0ZWQsIHNvIHdlIHdvbid0IGVuZCB1cCB3aXRoIHRoZSBjaGlsZCBsb2NhbGUgc2V0LlxuICAgICAgICBnZXRTZXRHbG9iYWxMb2NhbGUobmFtZSk7XG5cblxuICAgICAgICByZXR1cm4gbG9jYWxlc1tuYW1lXTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyB1c2VmdWwgZm9yIHRlc3RpbmdcbiAgICAgICAgZGVsZXRlIGxvY2FsZXNbbmFtZV07XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gdXBkYXRlTG9jYWxlKG5hbWUsIGNvbmZpZykge1xuICAgIGlmIChjb25maWcgIT0gbnVsbCkge1xuICAgICAgICB2YXIgbG9jYWxlLCBwYXJlbnRDb25maWcgPSBiYXNlQ29uZmlnO1xuICAgICAgICAvLyBNRVJHRVxuICAgICAgICBpZiAobG9jYWxlc1tuYW1lXSAhPSBudWxsKSB7XG4gICAgICAgICAgICBwYXJlbnRDb25maWcgPSBsb2NhbGVzW25hbWVdLl9jb25maWc7XG4gICAgICAgIH1cbiAgICAgICAgY29uZmlnID0gbWVyZ2VDb25maWdzKHBhcmVudENvbmZpZywgY29uZmlnKTtcbiAgICAgICAgbG9jYWxlID0gbmV3IExvY2FsZShjb25maWcpO1xuICAgICAgICBsb2NhbGUucGFyZW50TG9jYWxlID0gbG9jYWxlc1tuYW1lXTtcbiAgICAgICAgbG9jYWxlc1tuYW1lXSA9IGxvY2FsZTtcblxuICAgICAgICAvLyBiYWNrd2FyZHMgY29tcGF0IGZvciBub3c6IGFsc28gc2V0IHRoZSBsb2NhbGVcbiAgICAgICAgZ2V0U2V0R2xvYmFsTG9jYWxlKG5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIHBhc3MgbnVsbCBmb3IgY29uZmlnIHRvIHVudXBkYXRlLCB1c2VmdWwgZm9yIHRlc3RzXG4gICAgICAgIGlmIChsb2NhbGVzW25hbWVdICE9IG51bGwpIHtcbiAgICAgICAgICAgIGlmIChsb2NhbGVzW25hbWVdLnBhcmVudExvY2FsZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgbG9jYWxlc1tuYW1lXSA9IGxvY2FsZXNbbmFtZV0ucGFyZW50TG9jYWxlO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChsb2NhbGVzW25hbWVdICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgbG9jYWxlc1tuYW1lXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbG9jYWxlc1tuYW1lXTtcbn1cblxuLy8gcmV0dXJucyBsb2NhbGUgZGF0YVxuZnVuY3Rpb24gZ2V0TG9jYWxlIChrZXkpIHtcbiAgICB2YXIgbG9jYWxlO1xuXG4gICAgaWYgKGtleSAmJiBrZXkuX2xvY2FsZSAmJiBrZXkuX2xvY2FsZS5fYWJicikge1xuICAgICAgICBrZXkgPSBrZXkuX2xvY2FsZS5fYWJicjtcbiAgICB9XG5cbiAgICBpZiAoIWtleSkge1xuICAgICAgICByZXR1cm4gZ2xvYmFsTG9jYWxlO1xuICAgIH1cblxuICAgIGlmICghaXNBcnJheShrZXkpKSB7XG4gICAgICAgIC8vc2hvcnQtY2lyY3VpdCBldmVyeXRoaW5nIGVsc2VcbiAgICAgICAgbG9jYWxlID0gbG9hZExvY2FsZShrZXkpO1xuICAgICAgICBpZiAobG9jYWxlKSB7XG4gICAgICAgICAgICByZXR1cm4gbG9jYWxlO1xuICAgICAgICB9XG4gICAgICAgIGtleSA9IFtrZXldO1xuICAgIH1cblxuICAgIHJldHVybiBjaG9vc2VMb2NhbGUoa2V5KTtcbn1cblxuZnVuY3Rpb24gbGlzdExvY2FsZXMoKSB7XG4gICAgcmV0dXJuIGtleXMkMShsb2NhbGVzKTtcbn1cblxuZnVuY3Rpb24gY2hlY2tPdmVyZmxvdyAobSkge1xuICAgIHZhciBvdmVyZmxvdztcbiAgICB2YXIgYSA9IG0uX2E7XG5cbiAgICBpZiAoYSAmJiBnZXRQYXJzaW5nRmxhZ3MobSkub3ZlcmZsb3cgPT09IC0yKSB7XG4gICAgICAgIG92ZXJmbG93ID1cbiAgICAgICAgICAgIGFbTU9OVEhdICAgICAgIDwgMCB8fCBhW01PTlRIXSAgICAgICA+IDExICA/IE1PTlRIIDpcbiAgICAgICAgICAgIGFbREFURV0gICAgICAgIDwgMSB8fCBhW0RBVEVdICAgICAgICA+IGRheXNJbk1vbnRoKGFbWUVBUl0sIGFbTU9OVEhdKSA/IERBVEUgOlxuICAgICAgICAgICAgYVtIT1VSXSAgICAgICAgPCAwIHx8IGFbSE9VUl0gICAgICAgID4gMjQgfHwgKGFbSE9VUl0gPT09IDI0ICYmIChhW01JTlVURV0gIT09IDAgfHwgYVtTRUNPTkRdICE9PSAwIHx8IGFbTUlMTElTRUNPTkRdICE9PSAwKSkgPyBIT1VSIDpcbiAgICAgICAgICAgIGFbTUlOVVRFXSAgICAgIDwgMCB8fCBhW01JTlVURV0gICAgICA+IDU5ICA/IE1JTlVURSA6XG4gICAgICAgICAgICBhW1NFQ09ORF0gICAgICA8IDAgfHwgYVtTRUNPTkRdICAgICAgPiA1OSAgPyBTRUNPTkQgOlxuICAgICAgICAgICAgYVtNSUxMSVNFQ09ORF0gPCAwIHx8IGFbTUlMTElTRUNPTkRdID4gOTk5ID8gTUlMTElTRUNPTkQgOlxuICAgICAgICAgICAgLTE7XG5cbiAgICAgICAgaWYgKGdldFBhcnNpbmdGbGFncyhtKS5fb3ZlcmZsb3dEYXlPZlllYXIgJiYgKG92ZXJmbG93IDwgWUVBUiB8fCBvdmVyZmxvdyA+IERBVEUpKSB7XG4gICAgICAgICAgICBvdmVyZmxvdyA9IERBVEU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGdldFBhcnNpbmdGbGFncyhtKS5fb3ZlcmZsb3dXZWVrcyAmJiBvdmVyZmxvdyA9PT0gLTEpIHtcbiAgICAgICAgICAgIG92ZXJmbG93ID0gV0VFSztcbiAgICAgICAgfVxuICAgICAgICBpZiAoZ2V0UGFyc2luZ0ZsYWdzKG0pLl9vdmVyZmxvd1dlZWtkYXkgJiYgb3ZlcmZsb3cgPT09IC0xKSB7XG4gICAgICAgICAgICBvdmVyZmxvdyA9IFdFRUtEQVk7XG4gICAgICAgIH1cblxuICAgICAgICBnZXRQYXJzaW5nRmxhZ3MobSkub3ZlcmZsb3cgPSBvdmVyZmxvdztcbiAgICB9XG5cbiAgICByZXR1cm4gbTtcbn1cblxuLy8gaXNvIDg2MDEgcmVnZXhcbi8vIDAwMDAtMDAtMDAgMDAwMC1XMDAgb3IgMDAwMC1XMDAtMCArIFQgKyAwMCBvciAwMDowMCBvciAwMDowMDowMCBvciAwMDowMDowMC4wMDAgKyArMDA6MDAgb3IgKzAwMDAgb3IgKzAwKVxudmFyIGV4dGVuZGVkSXNvUmVnZXggPSAvXlxccyooKD86WystXVxcZHs2fXxcXGR7NH0pLSg/OlxcZFxcZC1cXGRcXGR8V1xcZFxcZC1cXGR8V1xcZFxcZHxcXGRcXGRcXGR8XFxkXFxkKSkoPzooVHwgKShcXGRcXGQoPzo6XFxkXFxkKD86OlxcZFxcZCg/OlsuLF1cXGQrKT8pPyk/KShbXFwrXFwtXVxcZFxcZCg/Ojo/XFxkXFxkKT98XFxzKlopPyk/JC87XG52YXIgYmFzaWNJc29SZWdleCA9IC9eXFxzKigoPzpbKy1dXFxkezZ9fFxcZHs0fSkoPzpcXGRcXGRcXGRcXGR8V1xcZFxcZFxcZHxXXFxkXFxkfFxcZFxcZFxcZHxcXGRcXGQpKSg/OihUfCApKFxcZFxcZCg/OlxcZFxcZCg/OlxcZFxcZCg/OlsuLF1cXGQrKT8pPyk/KShbXFwrXFwtXVxcZFxcZCg/Ojo/XFxkXFxkKT98XFxzKlopPyk/JC87XG5cbnZhciB0elJlZ2V4ID0gL1p8WystXVxcZFxcZCg/Ojo/XFxkXFxkKT8vO1xuXG52YXIgaXNvRGF0ZXMgPSBbXG4gICAgWydZWVlZWVktTU0tREQnLCAvWystXVxcZHs2fS1cXGRcXGQtXFxkXFxkL10sXG4gICAgWydZWVlZLU1NLUREJywgL1xcZHs0fS1cXGRcXGQtXFxkXFxkL10sXG4gICAgWydHR0dHLVtXXVdXLUUnLCAvXFxkezR9LVdcXGRcXGQtXFxkL10sXG4gICAgWydHR0dHLVtXXVdXJywgL1xcZHs0fS1XXFxkXFxkLywgZmFsc2VdLFxuICAgIFsnWVlZWS1EREQnLCAvXFxkezR9LVxcZHszfS9dLFxuICAgIFsnWVlZWS1NTScsIC9cXGR7NH0tXFxkXFxkLywgZmFsc2VdLFxuICAgIFsnWVlZWVlZTU1ERCcsIC9bKy1dXFxkezEwfS9dLFxuICAgIFsnWVlZWU1NREQnLCAvXFxkezh9L10sXG4gICAgLy8gWVlZWU1NIGlzIE5PVCBhbGxvd2VkIGJ5IHRoZSBzdGFuZGFyZFxuICAgIFsnR0dHR1tXXVdXRScsIC9cXGR7NH1XXFxkezN9L10sXG4gICAgWydHR0dHW1ddV1cnLCAvXFxkezR9V1xcZHsyfS8sIGZhbHNlXSxcbiAgICBbJ1lZWVlEREQnLCAvXFxkezd9L11cbl07XG5cbi8vIGlzbyB0aW1lIGZvcm1hdHMgYW5kIHJlZ2V4ZXNcbnZhciBpc29UaW1lcyA9IFtcbiAgICBbJ0hIOm1tOnNzLlNTU1MnLCAvXFxkXFxkOlxcZFxcZDpcXGRcXGRcXC5cXGQrL10sXG4gICAgWydISDptbTpzcyxTU1NTJywgL1xcZFxcZDpcXGRcXGQ6XFxkXFxkLFxcZCsvXSxcbiAgICBbJ0hIOm1tOnNzJywgL1xcZFxcZDpcXGRcXGQ6XFxkXFxkL10sXG4gICAgWydISDptbScsIC9cXGRcXGQ6XFxkXFxkL10sXG4gICAgWydISG1tc3MuU1NTUycsIC9cXGRcXGRcXGRcXGRcXGRcXGRcXC5cXGQrL10sXG4gICAgWydISG1tc3MsU1NTUycsIC9cXGRcXGRcXGRcXGRcXGRcXGQsXFxkKy9dLFxuICAgIFsnSEhtbXNzJywgL1xcZFxcZFxcZFxcZFxcZFxcZC9dLFxuICAgIFsnSEhtbScsIC9cXGRcXGRcXGRcXGQvXSxcbiAgICBbJ0hIJywgL1xcZFxcZC9dXG5dO1xuXG52YXIgYXNwTmV0SnNvblJlZ2V4ID0gL15cXC8/RGF0ZVxcKChcXC0/XFxkKykvaTtcblxuLy8gZGF0ZSBmcm9tIGlzbyBmb3JtYXRcbmZ1bmN0aW9uIGNvbmZpZ0Zyb21JU08oY29uZmlnKSB7XG4gICAgdmFyIGksIGwsXG4gICAgICAgIHN0cmluZyA9IGNvbmZpZy5faSxcbiAgICAgICAgbWF0Y2ggPSBleHRlbmRlZElzb1JlZ2V4LmV4ZWMoc3RyaW5nKSB8fCBiYXNpY0lzb1JlZ2V4LmV4ZWMoc3RyaW5nKSxcbiAgICAgICAgYWxsb3dUaW1lLCBkYXRlRm9ybWF0LCB0aW1lRm9ybWF0LCB0ekZvcm1hdDtcblxuICAgIGlmIChtYXRjaCkge1xuICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5pc28gPSB0cnVlO1xuXG4gICAgICAgIGZvciAoaSA9IDAsIGwgPSBpc29EYXRlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChpc29EYXRlc1tpXVsxXS5leGVjKG1hdGNoWzFdKSkge1xuICAgICAgICAgICAgICAgIGRhdGVGb3JtYXQgPSBpc29EYXRlc1tpXVswXTtcbiAgICAgICAgICAgICAgICBhbGxvd1RpbWUgPSBpc29EYXRlc1tpXVsyXSAhPT0gZmFsc2U7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRhdGVGb3JtYXQgPT0gbnVsbCkge1xuICAgICAgICAgICAgY29uZmlnLl9pc1ZhbGlkID0gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1hdGNoWzNdKSB7XG4gICAgICAgICAgICBmb3IgKGkgPSAwLCBsID0gaXNvVGltZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzb1RpbWVzW2ldWzFdLmV4ZWMobWF0Y2hbM10pKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIG1hdGNoWzJdIHNob3VsZCBiZSAnVCcgb3Igc3BhY2VcbiAgICAgICAgICAgICAgICAgICAgdGltZUZvcm1hdCA9IChtYXRjaFsyXSB8fCAnICcpICsgaXNvVGltZXNbaV1bMF07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aW1lRm9ybWF0ID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBjb25maWcuX2lzVmFsaWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFhbGxvd1RpbWUgJiYgdGltZUZvcm1hdCAhPSBudWxsKSB7XG4gICAgICAgICAgICBjb25maWcuX2lzVmFsaWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAobWF0Y2hbNF0pIHtcbiAgICAgICAgICAgIGlmICh0elJlZ2V4LmV4ZWMobWF0Y2hbNF0pKSB7XG4gICAgICAgICAgICAgICAgdHpGb3JtYXQgPSAnWic7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbmZpZy5faXNWYWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25maWcuX2YgPSBkYXRlRm9ybWF0ICsgKHRpbWVGb3JtYXQgfHwgJycpICsgKHR6Rm9ybWF0IHx8ICcnKTtcbiAgICAgICAgY29uZmlnRnJvbVN0cmluZ0FuZEZvcm1hdChjb25maWcpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbmZpZy5faXNWYWxpZCA9IGZhbHNlO1xuICAgIH1cbn1cblxuLy8gZGF0ZSBmcm9tIGlzbyBmb3JtYXQgb3IgZmFsbGJhY2tcbmZ1bmN0aW9uIGNvbmZpZ0Zyb21TdHJpbmcoY29uZmlnKSB7XG4gICAgdmFyIG1hdGNoZWQgPSBhc3BOZXRKc29uUmVnZXguZXhlYyhjb25maWcuX2kpO1xuXG4gICAgaWYgKG1hdGNoZWQgIT09IG51bGwpIHtcbiAgICAgICAgY29uZmlnLl9kID0gbmV3IERhdGUoK21hdGNoZWRbMV0pO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uZmlnRnJvbUlTTyhjb25maWcpO1xuICAgIGlmIChjb25maWcuX2lzVmFsaWQgPT09IGZhbHNlKSB7XG4gICAgICAgIGRlbGV0ZSBjb25maWcuX2lzVmFsaWQ7XG4gICAgICAgIGhvb2tzLmNyZWF0ZUZyb21JbnB1dEZhbGxiYWNrKGNvbmZpZyk7XG4gICAgfVxufVxuXG5ob29rcy5jcmVhdGVGcm9tSW5wdXRGYWxsYmFjayA9IGRlcHJlY2F0ZShcbiAgICAndmFsdWUgcHJvdmlkZWQgaXMgbm90IGluIGEgcmVjb2duaXplZCBJU08gZm9ybWF0LiBtb21lbnQgY29uc3RydWN0aW9uIGZhbGxzIGJhY2sgdG8ganMgRGF0ZSgpLCAnICtcbiAgICAnd2hpY2ggaXMgbm90IHJlbGlhYmxlIGFjcm9zcyBhbGwgYnJvd3NlcnMgYW5kIHZlcnNpb25zLiBOb24gSVNPIGRhdGUgZm9ybWF0cyBhcmUgJyArXG4gICAgJ2Rpc2NvdXJhZ2VkIGFuZCB3aWxsIGJlIHJlbW92ZWQgaW4gYW4gdXBjb21pbmcgbWFqb3IgcmVsZWFzZS4gUGxlYXNlIHJlZmVyIHRvICcgK1xuICAgICdodHRwOi8vbW9tZW50anMuY29tL2d1aWRlcy8jL3dhcm5pbmdzL2pzLWRhdGUvIGZvciBtb3JlIGluZm8uJyxcbiAgICBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKGNvbmZpZy5faSArIChjb25maWcuX3VzZVVUQyA/ICcgVVRDJyA6ICcnKSk7XG4gICAgfVxuKTtcblxuLy8gUGljayB0aGUgZmlyc3QgZGVmaW5lZCBvZiB0d28gb3IgdGhyZWUgYXJndW1lbnRzLlxuZnVuY3Rpb24gZGVmYXVsdHMoYSwgYiwgYykge1xuICAgIGlmIChhICE9IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGE7XG4gICAgfVxuICAgIGlmIChiICE9IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGI7XG4gICAgfVxuICAgIHJldHVybiBjO1xufVxuXG5mdW5jdGlvbiBjdXJyZW50RGF0ZUFycmF5KGNvbmZpZykge1xuICAgIC8vIGhvb2tzIGlzIGFjdHVhbGx5IHRoZSBleHBvcnRlZCBtb21lbnQgb2JqZWN0XG4gICAgdmFyIG5vd1ZhbHVlID0gbmV3IERhdGUoaG9va3Mubm93KCkpO1xuICAgIGlmIChjb25maWcuX3VzZVVUQykge1xuICAgICAgICByZXR1cm4gW25vd1ZhbHVlLmdldFVUQ0Z1bGxZZWFyKCksIG5vd1ZhbHVlLmdldFVUQ01vbnRoKCksIG5vd1ZhbHVlLmdldFVUQ0RhdGUoKV07XG4gICAgfVxuICAgIHJldHVybiBbbm93VmFsdWUuZ2V0RnVsbFllYXIoKSwgbm93VmFsdWUuZ2V0TW9udGgoKSwgbm93VmFsdWUuZ2V0RGF0ZSgpXTtcbn1cblxuLy8gY29udmVydCBhbiBhcnJheSB0byBhIGRhdGUuXG4vLyB0aGUgYXJyYXkgc2hvdWxkIG1pcnJvciB0aGUgcGFyYW1ldGVycyBiZWxvd1xuLy8gbm90ZTogYWxsIHZhbHVlcyBwYXN0IHRoZSB5ZWFyIGFyZSBvcHRpb25hbCBhbmQgd2lsbCBkZWZhdWx0IHRvIHRoZSBsb3dlc3QgcG9zc2libGUgdmFsdWUuXG4vLyBbeWVhciwgbW9udGgsIGRheSAsIGhvdXIsIG1pbnV0ZSwgc2Vjb25kLCBtaWxsaXNlY29uZF1cbmZ1bmN0aW9uIGNvbmZpZ0Zyb21BcnJheSAoY29uZmlnKSB7XG4gICAgdmFyIGksIGRhdGUsIGlucHV0ID0gW10sIGN1cnJlbnREYXRlLCB5ZWFyVG9Vc2U7XG5cbiAgICBpZiAoY29uZmlnLl9kKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjdXJyZW50RGF0ZSA9IGN1cnJlbnREYXRlQXJyYXkoY29uZmlnKTtcblxuICAgIC8vY29tcHV0ZSBkYXkgb2YgdGhlIHllYXIgZnJvbSB3ZWVrcyBhbmQgd2Vla2RheXNcbiAgICBpZiAoY29uZmlnLl93ICYmIGNvbmZpZy5fYVtEQVRFXSA9PSBudWxsICYmIGNvbmZpZy5fYVtNT05USF0gPT0gbnVsbCkge1xuICAgICAgICBkYXlPZlllYXJGcm9tV2Vla0luZm8oY29uZmlnKTtcbiAgICB9XG5cbiAgICAvL2lmIHRoZSBkYXkgb2YgdGhlIHllYXIgaXMgc2V0LCBmaWd1cmUgb3V0IHdoYXQgaXQgaXNcbiAgICBpZiAoY29uZmlnLl9kYXlPZlllYXIpIHtcbiAgICAgICAgeWVhclRvVXNlID0gZGVmYXVsdHMoY29uZmlnLl9hW1lFQVJdLCBjdXJyZW50RGF0ZVtZRUFSXSk7XG5cbiAgICAgICAgaWYgKGNvbmZpZy5fZGF5T2ZZZWFyID4gZGF5c0luWWVhcih5ZWFyVG9Vc2UpKSB7XG4gICAgICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5fb3ZlcmZsb3dEYXlPZlllYXIgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgZGF0ZSA9IGNyZWF0ZVVUQ0RhdGUoeWVhclRvVXNlLCAwLCBjb25maWcuX2RheU9mWWVhcik7XG4gICAgICAgIGNvbmZpZy5fYVtNT05USF0gPSBkYXRlLmdldFVUQ01vbnRoKCk7XG4gICAgICAgIGNvbmZpZy5fYVtEQVRFXSA9IGRhdGUuZ2V0VVRDRGF0ZSgpO1xuICAgIH1cblxuICAgIC8vIERlZmF1bHQgdG8gY3VycmVudCBkYXRlLlxuICAgIC8vICogaWYgbm8geWVhciwgbW9udGgsIGRheSBvZiBtb250aCBhcmUgZ2l2ZW4sIGRlZmF1bHQgdG8gdG9kYXlcbiAgICAvLyAqIGlmIGRheSBvZiBtb250aCBpcyBnaXZlbiwgZGVmYXVsdCBtb250aCBhbmQgeWVhclxuICAgIC8vICogaWYgbW9udGggaXMgZ2l2ZW4sIGRlZmF1bHQgb25seSB5ZWFyXG4gICAgLy8gKiBpZiB5ZWFyIGlzIGdpdmVuLCBkb24ndCBkZWZhdWx0IGFueXRoaW5nXG4gICAgZm9yIChpID0gMDsgaSA8IDMgJiYgY29uZmlnLl9hW2ldID09IG51bGw7ICsraSkge1xuICAgICAgICBjb25maWcuX2FbaV0gPSBpbnB1dFtpXSA9IGN1cnJlbnREYXRlW2ldO1xuICAgIH1cblxuICAgIC8vIFplcm8gb3V0IHdoYXRldmVyIHdhcyBub3QgZGVmYXVsdGVkLCBpbmNsdWRpbmcgdGltZVxuICAgIGZvciAoOyBpIDwgNzsgaSsrKSB7XG4gICAgICAgIGNvbmZpZy5fYVtpXSA9IGlucHV0W2ldID0gKGNvbmZpZy5fYVtpXSA9PSBudWxsKSA/IChpID09PSAyID8gMSA6IDApIDogY29uZmlnLl9hW2ldO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciAyNDowMDowMC4wMDBcbiAgICBpZiAoY29uZmlnLl9hW0hPVVJdID09PSAyNCAmJlxuICAgICAgICAgICAgY29uZmlnLl9hW01JTlVURV0gPT09IDAgJiZcbiAgICAgICAgICAgIGNvbmZpZy5fYVtTRUNPTkRdID09PSAwICYmXG4gICAgICAgICAgICBjb25maWcuX2FbTUlMTElTRUNPTkRdID09PSAwKSB7XG4gICAgICAgIGNvbmZpZy5fbmV4dERheSA9IHRydWU7XG4gICAgICAgIGNvbmZpZy5fYVtIT1VSXSA9IDA7XG4gICAgfVxuXG4gICAgY29uZmlnLl9kID0gKGNvbmZpZy5fdXNlVVRDID8gY3JlYXRlVVRDRGF0ZSA6IGNyZWF0ZURhdGUpLmFwcGx5KG51bGwsIGlucHV0KTtcbiAgICAvLyBBcHBseSB0aW1lem9uZSBvZmZzZXQgZnJvbSBpbnB1dC4gVGhlIGFjdHVhbCB1dGNPZmZzZXQgY2FuIGJlIGNoYW5nZWRcbiAgICAvLyB3aXRoIHBhcnNlWm9uZS5cbiAgICBpZiAoY29uZmlnLl90em0gIT0gbnVsbCkge1xuICAgICAgICBjb25maWcuX2Quc2V0VVRDTWludXRlcyhjb25maWcuX2QuZ2V0VVRDTWludXRlcygpIC0gY29uZmlnLl90em0pO1xuICAgIH1cblxuICAgIGlmIChjb25maWcuX25leHREYXkpIHtcbiAgICAgICAgY29uZmlnLl9hW0hPVVJdID0gMjQ7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkYXlPZlllYXJGcm9tV2Vla0luZm8oY29uZmlnKSB7XG4gICAgdmFyIHcsIHdlZWtZZWFyLCB3ZWVrLCB3ZWVrZGF5LCBkb3csIGRveSwgdGVtcCwgd2Vla2RheU92ZXJmbG93O1xuXG4gICAgdyA9IGNvbmZpZy5fdztcbiAgICBpZiAody5HRyAhPSBudWxsIHx8IHcuVyAhPSBudWxsIHx8IHcuRSAhPSBudWxsKSB7XG4gICAgICAgIGRvdyA9IDE7XG4gICAgICAgIGRveSA9IDQ7XG5cbiAgICAgICAgLy8gVE9ETzogV2UgbmVlZCB0byB0YWtlIHRoZSBjdXJyZW50IGlzb1dlZWtZZWFyLCBidXQgdGhhdCBkZXBlbmRzIG9uXG4gICAgICAgIC8vIGhvdyB3ZSBpbnRlcnByZXQgbm93IChsb2NhbCwgdXRjLCBmaXhlZCBvZmZzZXQpLiBTbyBjcmVhdGVcbiAgICAgICAgLy8gYSBub3cgdmVyc2lvbiBvZiBjdXJyZW50IGNvbmZpZyAodGFrZSBsb2NhbC91dGMvb2Zmc2V0IGZsYWdzLCBhbmRcbiAgICAgICAgLy8gY3JlYXRlIG5vdykuXG4gICAgICAgIHdlZWtZZWFyID0gZGVmYXVsdHMody5HRywgY29uZmlnLl9hW1lFQVJdLCB3ZWVrT2ZZZWFyKGNyZWF0ZUxvY2FsKCksIDEsIDQpLnllYXIpO1xuICAgICAgICB3ZWVrID0gZGVmYXVsdHMody5XLCAxKTtcbiAgICAgICAgd2Vla2RheSA9IGRlZmF1bHRzKHcuRSwgMSk7XG4gICAgICAgIGlmICh3ZWVrZGF5IDwgMSB8fCB3ZWVrZGF5ID4gNykge1xuICAgICAgICAgICAgd2Vla2RheU92ZXJmbG93ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGRvdyA9IGNvbmZpZy5fbG9jYWxlLl93ZWVrLmRvdztcbiAgICAgICAgZG95ID0gY29uZmlnLl9sb2NhbGUuX3dlZWsuZG95O1xuXG4gICAgICAgIHZhciBjdXJXZWVrID0gd2Vla09mWWVhcihjcmVhdGVMb2NhbCgpLCBkb3csIGRveSk7XG5cbiAgICAgICAgd2Vla1llYXIgPSBkZWZhdWx0cyh3LmdnLCBjb25maWcuX2FbWUVBUl0sIGN1cldlZWsueWVhcik7XG5cbiAgICAgICAgLy8gRGVmYXVsdCB0byBjdXJyZW50IHdlZWsuXG4gICAgICAgIHdlZWsgPSBkZWZhdWx0cyh3LncsIGN1cldlZWsud2Vlayk7XG5cbiAgICAgICAgaWYgKHcuZCAhPSBudWxsKSB7XG4gICAgICAgICAgICAvLyB3ZWVrZGF5IC0tIGxvdyBkYXkgbnVtYmVycyBhcmUgY29uc2lkZXJlZCBuZXh0IHdlZWtcbiAgICAgICAgICAgIHdlZWtkYXkgPSB3LmQ7XG4gICAgICAgICAgICBpZiAod2Vla2RheSA8IDAgfHwgd2Vla2RheSA+IDYpIHtcbiAgICAgICAgICAgICAgICB3ZWVrZGF5T3ZlcmZsb3cgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHcuZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAvLyBsb2NhbCB3ZWVrZGF5IC0tIGNvdW50aW5nIHN0YXJ0cyBmcm9tIGJlZ2luaW5nIG9mIHdlZWtcbiAgICAgICAgICAgIHdlZWtkYXkgPSB3LmUgKyBkb3c7XG4gICAgICAgICAgICBpZiAody5lIDwgMCB8fCB3LmUgPiA2KSB7XG4gICAgICAgICAgICAgICAgd2Vla2RheU92ZXJmbG93ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGRlZmF1bHQgdG8gYmVnaW5pbmcgb2Ygd2Vla1xuICAgICAgICAgICAgd2Vla2RheSA9IGRvdztcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAod2VlayA8IDEgfHwgd2VlayA+IHdlZWtzSW5ZZWFyKHdlZWtZZWFyLCBkb3csIGRveSkpIHtcbiAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuX292ZXJmbG93V2Vla3MgPSB0cnVlO1xuICAgIH0gZWxzZSBpZiAod2Vla2RheU92ZXJmbG93ICE9IG51bGwpIHtcbiAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuX292ZXJmbG93V2Vla2RheSA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGVtcCA9IGRheU9mWWVhckZyb21XZWVrcyh3ZWVrWWVhciwgd2Vlaywgd2Vla2RheSwgZG93LCBkb3kpO1xuICAgICAgICBjb25maWcuX2FbWUVBUl0gPSB0ZW1wLnllYXI7XG4gICAgICAgIGNvbmZpZy5fZGF5T2ZZZWFyID0gdGVtcC5kYXlPZlllYXI7XG4gICAgfVxufVxuXG4vLyBjb25zdGFudCB0aGF0IHJlZmVycyB0byB0aGUgSVNPIHN0YW5kYXJkXG5ob29rcy5JU09fODYwMSA9IGZ1bmN0aW9uICgpIHt9O1xuXG4vLyBkYXRlIGZyb20gc3RyaW5nIGFuZCBmb3JtYXQgc3RyaW5nXG5mdW5jdGlvbiBjb25maWdGcm9tU3RyaW5nQW5kRm9ybWF0KGNvbmZpZykge1xuICAgIC8vIFRPRE86IE1vdmUgdGhpcyB0byBhbm90aGVyIHBhcnQgb2YgdGhlIGNyZWF0aW9uIGZsb3cgdG8gcHJldmVudCBjaXJjdWxhciBkZXBzXG4gICAgaWYgKGNvbmZpZy5fZiA9PT0gaG9va3MuSVNPXzg2MDEpIHtcbiAgICAgICAgY29uZmlnRnJvbUlTTyhjb25maWcpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uZmlnLl9hID0gW107XG4gICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuZW1wdHkgPSB0cnVlO1xuXG4gICAgLy8gVGhpcyBhcnJheSBpcyB1c2VkIHRvIG1ha2UgYSBEYXRlLCBlaXRoZXIgd2l0aCBgbmV3IERhdGVgIG9yIGBEYXRlLlVUQ2BcbiAgICB2YXIgc3RyaW5nID0gJycgKyBjb25maWcuX2ksXG4gICAgICAgIGksIHBhcnNlZElucHV0LCB0b2tlbnMsIHRva2VuLCBza2lwcGVkLFxuICAgICAgICBzdHJpbmdMZW5ndGggPSBzdHJpbmcubGVuZ3RoLFxuICAgICAgICB0b3RhbFBhcnNlZElucHV0TGVuZ3RoID0gMDtcblxuICAgIHRva2VucyA9IGV4cGFuZEZvcm1hdChjb25maWcuX2YsIGNvbmZpZy5fbG9jYWxlKS5tYXRjaChmb3JtYXR0aW5nVG9rZW5zKSB8fCBbXTtcblxuICAgIGZvciAoaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdG9rZW4gPSB0b2tlbnNbaV07XG4gICAgICAgIHBhcnNlZElucHV0ID0gKHN0cmluZy5tYXRjaChnZXRQYXJzZVJlZ2V4Rm9yVG9rZW4odG9rZW4sIGNvbmZpZykpIHx8IFtdKVswXTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ3Rva2VuJywgdG9rZW4sICdwYXJzZWRJbnB1dCcsIHBhcnNlZElucHV0LFxuICAgICAgICAvLyAgICAgICAgICdyZWdleCcsIGdldFBhcnNlUmVnZXhGb3JUb2tlbih0b2tlbiwgY29uZmlnKSk7XG4gICAgICAgIGlmIChwYXJzZWRJbnB1dCkge1xuICAgICAgICAgICAgc2tpcHBlZCA9IHN0cmluZy5zdWJzdHIoMCwgc3RyaW5nLmluZGV4T2YocGFyc2VkSW5wdXQpKTtcbiAgICAgICAgICAgIGlmIChza2lwcGVkLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS51bnVzZWRJbnB1dC5wdXNoKHNraXBwZWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RyaW5nID0gc3RyaW5nLnNsaWNlKHN0cmluZy5pbmRleE9mKHBhcnNlZElucHV0KSArIHBhcnNlZElucHV0Lmxlbmd0aCk7XG4gICAgICAgICAgICB0b3RhbFBhcnNlZElucHV0TGVuZ3RoICs9IHBhcnNlZElucHV0Lmxlbmd0aDtcbiAgICAgICAgfVxuICAgICAgICAvLyBkb24ndCBwYXJzZSBpZiBpdCdzIG5vdCBhIGtub3duIHRva2VuXG4gICAgICAgIGlmIChmb3JtYXRUb2tlbkZ1bmN0aW9uc1t0b2tlbl0pIHtcbiAgICAgICAgICAgIGlmIChwYXJzZWRJbnB1dCkge1xuICAgICAgICAgICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLmVtcHR5ID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS51bnVzZWRUb2tlbnMucHVzaCh0b2tlbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhZGRUaW1lVG9BcnJheUZyb21Ub2tlbih0b2tlbiwgcGFyc2VkSW5wdXQsIGNvbmZpZyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoY29uZmlnLl9zdHJpY3QgJiYgIXBhcnNlZElucHV0KSB7XG4gICAgICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS51bnVzZWRUb2tlbnMucHVzaCh0b2tlbik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBhZGQgcmVtYWluaW5nIHVucGFyc2VkIGlucHV0IGxlbmd0aCB0byB0aGUgc3RyaW5nXG4gICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuY2hhcnNMZWZ0T3ZlciA9IHN0cmluZ0xlbmd0aCAtIHRvdGFsUGFyc2VkSW5wdXRMZW5ndGg7XG4gICAgaWYgKHN0cmluZy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLnVudXNlZElucHV0LnB1c2goc3RyaW5nKTtcbiAgICB9XG5cbiAgICAvLyBjbGVhciBfMTJoIGZsYWcgaWYgaG91ciBpcyA8PSAxMlxuICAgIGlmIChjb25maWcuX2FbSE9VUl0gPD0gMTIgJiZcbiAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuYmlnSG91ciA9PT0gdHJ1ZSAmJlxuICAgICAgICBjb25maWcuX2FbSE9VUl0gPiAwKSB7XG4gICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLmJpZ0hvdXIgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykucGFyc2VkRGF0ZVBhcnRzID0gY29uZmlnLl9hLnNsaWNlKDApO1xuICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLm1lcmlkaWVtID0gY29uZmlnLl9tZXJpZGllbTtcbiAgICAvLyBoYW5kbGUgbWVyaWRpZW1cbiAgICBjb25maWcuX2FbSE9VUl0gPSBtZXJpZGllbUZpeFdyYXAoY29uZmlnLl9sb2NhbGUsIGNvbmZpZy5fYVtIT1VSXSwgY29uZmlnLl9tZXJpZGllbSk7XG5cbiAgICBjb25maWdGcm9tQXJyYXkoY29uZmlnKTtcbiAgICBjaGVja092ZXJmbG93KGNvbmZpZyk7XG59XG5cblxuZnVuY3Rpb24gbWVyaWRpZW1GaXhXcmFwIChsb2NhbGUsIGhvdXIsIG1lcmlkaWVtKSB7XG4gICAgdmFyIGlzUG07XG5cbiAgICBpZiAobWVyaWRpZW0gPT0gbnVsbCkge1xuICAgICAgICAvLyBub3RoaW5nIHRvIGRvXG4gICAgICAgIHJldHVybiBob3VyO1xuICAgIH1cbiAgICBpZiAobG9jYWxlLm1lcmlkaWVtSG91ciAhPSBudWxsKSB7XG4gICAgICAgIHJldHVybiBsb2NhbGUubWVyaWRpZW1Ib3VyKGhvdXIsIG1lcmlkaWVtKTtcbiAgICB9IGVsc2UgaWYgKGxvY2FsZS5pc1BNICE9IG51bGwpIHtcbiAgICAgICAgLy8gRmFsbGJhY2tcbiAgICAgICAgaXNQbSA9IGxvY2FsZS5pc1BNKG1lcmlkaWVtKTtcbiAgICAgICAgaWYgKGlzUG0gJiYgaG91ciA8IDEyKSB7XG4gICAgICAgICAgICBob3VyICs9IDEyO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaXNQbSAmJiBob3VyID09PSAxMikge1xuICAgICAgICAgICAgaG91ciA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGhvdXI7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gdGhpcyBpcyBub3Qgc3VwcG9zZWQgdG8gaGFwcGVuXG4gICAgICAgIHJldHVybiBob3VyO1xuICAgIH1cbn1cblxuLy8gZGF0ZSBmcm9tIHN0cmluZyBhbmQgYXJyYXkgb2YgZm9ybWF0IHN0cmluZ3NcbmZ1bmN0aW9uIGNvbmZpZ0Zyb21TdHJpbmdBbmRBcnJheShjb25maWcpIHtcbiAgICB2YXIgdGVtcENvbmZpZyxcbiAgICAgICAgYmVzdE1vbWVudCxcblxuICAgICAgICBzY29yZVRvQmVhdCxcbiAgICAgICAgaSxcbiAgICAgICAgY3VycmVudFNjb3JlO1xuXG4gICAgaWYgKGNvbmZpZy5fZi5sZW5ndGggPT09IDApIHtcbiAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuaW52YWxpZEZvcm1hdCA9IHRydWU7XG4gICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKE5hTik7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgY29uZmlnLl9mLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGN1cnJlbnRTY29yZSA9IDA7XG4gICAgICAgIHRlbXBDb25maWcgPSBjb3B5Q29uZmlnKHt9LCBjb25maWcpO1xuICAgICAgICBpZiAoY29uZmlnLl91c2VVVEMgIT0gbnVsbCkge1xuICAgICAgICAgICAgdGVtcENvbmZpZy5fdXNlVVRDID0gY29uZmlnLl91c2VVVEM7XG4gICAgICAgIH1cbiAgICAgICAgdGVtcENvbmZpZy5fZiA9IGNvbmZpZy5fZltpXTtcbiAgICAgICAgY29uZmlnRnJvbVN0cmluZ0FuZEZvcm1hdCh0ZW1wQ29uZmlnKTtcblxuICAgICAgICBpZiAoIWlzVmFsaWQodGVtcENvbmZpZykpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgdGhlcmUgaXMgYW55IGlucHV0IHRoYXQgd2FzIG5vdCBwYXJzZWQgYWRkIGEgcGVuYWx0eSBmb3IgdGhhdCBmb3JtYXRcbiAgICAgICAgY3VycmVudFNjb3JlICs9IGdldFBhcnNpbmdGbGFncyh0ZW1wQ29uZmlnKS5jaGFyc0xlZnRPdmVyO1xuXG4gICAgICAgIC8vb3IgdG9rZW5zXG4gICAgICAgIGN1cnJlbnRTY29yZSArPSBnZXRQYXJzaW5nRmxhZ3ModGVtcENvbmZpZykudW51c2VkVG9rZW5zLmxlbmd0aCAqIDEwO1xuXG4gICAgICAgIGdldFBhcnNpbmdGbGFncyh0ZW1wQ29uZmlnKS5zY29yZSA9IGN1cnJlbnRTY29yZTtcblxuICAgICAgICBpZiAoc2NvcmVUb0JlYXQgPT0gbnVsbCB8fCBjdXJyZW50U2NvcmUgPCBzY29yZVRvQmVhdCkge1xuICAgICAgICAgICAgc2NvcmVUb0JlYXQgPSBjdXJyZW50U2NvcmU7XG4gICAgICAgICAgICBiZXN0TW9tZW50ID0gdGVtcENvbmZpZztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGV4dGVuZChjb25maWcsIGJlc3RNb21lbnQgfHwgdGVtcENvbmZpZyk7XG59XG5cbmZ1bmN0aW9uIGNvbmZpZ0Zyb21PYmplY3QoY29uZmlnKSB7XG4gICAgaWYgKGNvbmZpZy5fZCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGkgPSBub3JtYWxpemVPYmplY3RVbml0cyhjb25maWcuX2kpO1xuICAgIGNvbmZpZy5fYSA9IG1hcChbaS55ZWFyLCBpLm1vbnRoLCBpLmRheSB8fCBpLmRhdGUsIGkuaG91ciwgaS5taW51dGUsIGkuc2Vjb25kLCBpLm1pbGxpc2Vjb25kXSwgZnVuY3Rpb24gKG9iaikge1xuICAgICAgICByZXR1cm4gb2JqICYmIHBhcnNlSW50KG9iaiwgMTApO1xuICAgIH0pO1xuXG4gICAgY29uZmlnRnJvbUFycmF5KGNvbmZpZyk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUZyb21Db25maWcgKGNvbmZpZykge1xuICAgIHZhciByZXMgPSBuZXcgTW9tZW50KGNoZWNrT3ZlcmZsb3cocHJlcGFyZUNvbmZpZyhjb25maWcpKSk7XG4gICAgaWYgKHJlcy5fbmV4dERheSkge1xuICAgICAgICAvLyBBZGRpbmcgaXMgc21hcnQgZW5vdWdoIGFyb3VuZCBEU1RcbiAgICAgICAgcmVzLmFkZCgxLCAnZCcpO1xuICAgICAgICByZXMuX25leHREYXkgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlcztcbn1cblxuZnVuY3Rpb24gcHJlcGFyZUNvbmZpZyAoY29uZmlnKSB7XG4gICAgdmFyIGlucHV0ID0gY29uZmlnLl9pLFxuICAgICAgICBmb3JtYXQgPSBjb25maWcuX2Y7XG5cbiAgICBjb25maWcuX2xvY2FsZSA9IGNvbmZpZy5fbG9jYWxlIHx8IGdldExvY2FsZShjb25maWcuX2wpO1xuXG4gICAgaWYgKGlucHV0ID09PSBudWxsIHx8IChmb3JtYXQgPT09IHVuZGVmaW5lZCAmJiBpbnB1dCA9PT0gJycpKSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVJbnZhbGlkKHtudWxsSW5wdXQ6IHRydWV9KTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJykge1xuICAgICAgICBjb25maWcuX2kgPSBpbnB1dCA9IGNvbmZpZy5fbG9jYWxlLnByZXBhcnNlKGlucHV0KTtcbiAgICB9XG5cbiAgICBpZiAoaXNNb21lbnQoaW5wdXQpKSB7XG4gICAgICAgIHJldHVybiBuZXcgTW9tZW50KGNoZWNrT3ZlcmZsb3coaW5wdXQpKTtcbiAgICB9IGVsc2UgaWYgKGlzRGF0ZShpbnB1dCkpIHtcbiAgICAgICAgY29uZmlnLl9kID0gaW5wdXQ7XG4gICAgfSBlbHNlIGlmIChpc0FycmF5KGZvcm1hdCkpIHtcbiAgICAgICAgY29uZmlnRnJvbVN0cmluZ0FuZEFycmF5KGNvbmZpZyk7XG4gICAgfSBlbHNlIGlmIChmb3JtYXQpIHtcbiAgICAgICAgY29uZmlnRnJvbVN0cmluZ0FuZEZvcm1hdChjb25maWcpO1xuICAgIH0gIGVsc2Uge1xuICAgICAgICBjb25maWdGcm9tSW5wdXQoY29uZmlnKTtcbiAgICB9XG5cbiAgICBpZiAoIWlzVmFsaWQoY29uZmlnKSkge1xuICAgICAgICBjb25maWcuX2QgPSBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiBjb25maWc7XG59XG5cbmZ1bmN0aW9uIGNvbmZpZ0Zyb21JbnB1dChjb25maWcpIHtcbiAgICB2YXIgaW5wdXQgPSBjb25maWcuX2k7XG4gICAgaWYgKGlucHV0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29uZmlnLl9kID0gbmV3IERhdGUoaG9va3Mubm93KCkpO1xuICAgIH0gZWxzZSBpZiAoaXNEYXRlKGlucHV0KSkge1xuICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZShpbnB1dC52YWx1ZU9mKCkpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJykge1xuICAgICAgICBjb25maWdGcm9tU3RyaW5nKGNvbmZpZyk7XG4gICAgfSBlbHNlIGlmIChpc0FycmF5KGlucHV0KSkge1xuICAgICAgICBjb25maWcuX2EgPSBtYXAoaW5wdXQuc2xpY2UoMCksIGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgICAgIHJldHVybiBwYXJzZUludChvYmosIDEwKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbmZpZ0Zyb21BcnJheShjb25maWcpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mKGlucHV0KSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgY29uZmlnRnJvbU9iamVjdChjb25maWcpO1xuICAgIH0gZWxzZSBpZiAoaXNOdW1iZXIoaW5wdXQpKSB7XG4gICAgICAgIC8vIGZyb20gbWlsbGlzZWNvbmRzXG4gICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKGlucHV0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBob29rcy5jcmVhdGVGcm9tSW5wdXRGYWxsYmFjayhjb25maWcpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlTG9jYWxPclVUQyAoaW5wdXQsIGZvcm1hdCwgbG9jYWxlLCBzdHJpY3QsIGlzVVRDKSB7XG4gICAgdmFyIGMgPSB7fTtcblxuICAgIGlmIChsb2NhbGUgPT09IHRydWUgfHwgbG9jYWxlID09PSBmYWxzZSkge1xuICAgICAgICBzdHJpY3QgPSBsb2NhbGU7XG4gICAgICAgIGxvY2FsZSA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBpZiAoKGlzT2JqZWN0KGlucHV0KSAmJiBpc09iamVjdEVtcHR5KGlucHV0KSkgfHxcbiAgICAgICAgICAgIChpc0FycmF5KGlucHV0KSAmJiBpbnB1dC5sZW5ndGggPT09IDApKSB7XG4gICAgICAgIGlucHV0ID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICAvLyBvYmplY3QgY29uc3RydWN0aW9uIG11c3QgYmUgZG9uZSB0aGlzIHdheS5cbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vbW9tZW50L21vbWVudC9pc3N1ZXMvMTQyM1xuICAgIGMuX2lzQU1vbWVudE9iamVjdCA9IHRydWU7XG4gICAgYy5fdXNlVVRDID0gYy5faXNVVEMgPSBpc1VUQztcbiAgICBjLl9sID0gbG9jYWxlO1xuICAgIGMuX2kgPSBpbnB1dDtcbiAgICBjLl9mID0gZm9ybWF0O1xuICAgIGMuX3N0cmljdCA9IHN0cmljdDtcblxuICAgIHJldHVybiBjcmVhdGVGcm9tQ29uZmlnKGMpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVMb2NhbCAoaW5wdXQsIGZvcm1hdCwgbG9jYWxlLCBzdHJpY3QpIHtcbiAgICByZXR1cm4gY3JlYXRlTG9jYWxPclVUQyhpbnB1dCwgZm9ybWF0LCBsb2NhbGUsIHN0cmljdCwgZmFsc2UpO1xufVxuXG52YXIgcHJvdG90eXBlTWluID0gZGVwcmVjYXRlKFxuICAgICdtb21lbnQoKS5taW4gaXMgZGVwcmVjYXRlZCwgdXNlIG1vbWVudC5tYXggaW5zdGVhZC4gaHR0cDovL21vbWVudGpzLmNvbS9ndWlkZXMvIy93YXJuaW5ncy9taW4tbWF4LycsXG4gICAgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3RoZXIgPSBjcmVhdGVMb2NhbC5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgICAgICBpZiAodGhpcy5pc1ZhbGlkKCkgJiYgb3RoZXIuaXNWYWxpZCgpKSB7XG4gICAgICAgICAgICByZXR1cm4gb3RoZXIgPCB0aGlzID8gdGhpcyA6IG90aGVyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGNyZWF0ZUludmFsaWQoKTtcbiAgICAgICAgfVxuICAgIH1cbik7XG5cbnZhciBwcm90b3R5cGVNYXggPSBkZXByZWNhdGUoXG4gICAgJ21vbWVudCgpLm1heCBpcyBkZXByZWNhdGVkLCB1c2UgbW9tZW50Lm1pbiBpbnN0ZWFkLiBodHRwOi8vbW9tZW50anMuY29tL2d1aWRlcy8jL3dhcm5pbmdzL21pbi1tYXgvJyxcbiAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvdGhlciA9IGNyZWF0ZUxvY2FsLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgICAgIGlmICh0aGlzLmlzVmFsaWQoKSAmJiBvdGhlci5pc1ZhbGlkKCkpIHtcbiAgICAgICAgICAgIHJldHVybiBvdGhlciA+IHRoaXMgPyB0aGlzIDogb3RoZXI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gY3JlYXRlSW52YWxpZCgpO1xuICAgICAgICB9XG4gICAgfVxuKTtcblxuLy8gUGljayBhIG1vbWVudCBtIGZyb20gbW9tZW50cyBzbyB0aGF0IG1bZm5dKG90aGVyKSBpcyB0cnVlIGZvciBhbGxcbi8vIG90aGVyLiBUaGlzIHJlbGllcyBvbiB0aGUgZnVuY3Rpb24gZm4gdG8gYmUgdHJhbnNpdGl2ZS5cbi8vXG4vLyBtb21lbnRzIHNob3VsZCBlaXRoZXIgYmUgYW4gYXJyYXkgb2YgbW9tZW50IG9iamVjdHMgb3IgYW4gYXJyYXksIHdob3NlXG4vLyBmaXJzdCBlbGVtZW50IGlzIGFuIGFycmF5IG9mIG1vbWVudCBvYmplY3RzLlxuZnVuY3Rpb24gcGlja0J5KGZuLCBtb21lbnRzKSB7XG4gICAgdmFyIHJlcywgaTtcbiAgICBpZiAobW9tZW50cy5sZW5ndGggPT09IDEgJiYgaXNBcnJheShtb21lbnRzWzBdKSkge1xuICAgICAgICBtb21lbnRzID0gbW9tZW50c1swXTtcbiAgICB9XG4gICAgaWYgKCFtb21lbnRzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gY3JlYXRlTG9jYWwoKTtcbiAgICB9XG4gICAgcmVzID0gbW9tZW50c1swXTtcbiAgICBmb3IgKGkgPSAxOyBpIDwgbW9tZW50cy5sZW5ndGg7ICsraSkge1xuICAgICAgICBpZiAoIW1vbWVudHNbaV0uaXNWYWxpZCgpIHx8IG1vbWVudHNbaV1bZm5dKHJlcykpIHtcbiAgICAgICAgICAgIHJlcyA9IG1vbWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn1cblxuLy8gVE9ETzogVXNlIFtdLnNvcnQgaW5zdGVhZD9cbmZ1bmN0aW9uIG1pbiAoKSB7XG4gICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG5cbiAgICByZXR1cm4gcGlja0J5KCdpc0JlZm9yZScsIGFyZ3MpO1xufVxuXG5mdW5jdGlvbiBtYXggKCkge1xuICAgIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xuXG4gICAgcmV0dXJuIHBpY2tCeSgnaXNBZnRlcicsIGFyZ3MpO1xufVxuXG52YXIgbm93ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBEYXRlLm5vdyA/IERhdGUubm93KCkgOiArKG5ldyBEYXRlKCkpO1xufTtcblxuZnVuY3Rpb24gRHVyYXRpb24gKGR1cmF0aW9uKSB7XG4gICAgdmFyIG5vcm1hbGl6ZWRJbnB1dCA9IG5vcm1hbGl6ZU9iamVjdFVuaXRzKGR1cmF0aW9uKSxcbiAgICAgICAgeWVhcnMgPSBub3JtYWxpemVkSW5wdXQueWVhciB8fCAwLFxuICAgICAgICBxdWFydGVycyA9IG5vcm1hbGl6ZWRJbnB1dC5xdWFydGVyIHx8IDAsXG4gICAgICAgIG1vbnRocyA9IG5vcm1hbGl6ZWRJbnB1dC5tb250aCB8fCAwLFxuICAgICAgICB3ZWVrcyA9IG5vcm1hbGl6ZWRJbnB1dC53ZWVrIHx8IDAsXG4gICAgICAgIGRheXMgPSBub3JtYWxpemVkSW5wdXQuZGF5IHx8IDAsXG4gICAgICAgIGhvdXJzID0gbm9ybWFsaXplZElucHV0LmhvdXIgfHwgMCxcbiAgICAgICAgbWludXRlcyA9IG5vcm1hbGl6ZWRJbnB1dC5taW51dGUgfHwgMCxcbiAgICAgICAgc2Vjb25kcyA9IG5vcm1hbGl6ZWRJbnB1dC5zZWNvbmQgfHwgMCxcbiAgICAgICAgbWlsbGlzZWNvbmRzID0gbm9ybWFsaXplZElucHV0Lm1pbGxpc2Vjb25kIHx8IDA7XG5cbiAgICAvLyByZXByZXNlbnRhdGlvbiBmb3IgZGF0ZUFkZFJlbW92ZVxuICAgIHRoaXMuX21pbGxpc2Vjb25kcyA9ICttaWxsaXNlY29uZHMgK1xuICAgICAgICBzZWNvbmRzICogMWUzICsgLy8gMTAwMFxuICAgICAgICBtaW51dGVzICogNmU0ICsgLy8gMTAwMCAqIDYwXG4gICAgICAgIGhvdXJzICogMTAwMCAqIDYwICogNjA7IC8vdXNpbmcgMTAwMCAqIDYwICogNjAgaW5zdGVhZCBvZiAzNmU1IHRvIGF2b2lkIGZsb2F0aW5nIHBvaW50IHJvdW5kaW5nIGVycm9ycyBodHRwczovL2dpdGh1Yi5jb20vbW9tZW50L21vbWVudC9pc3N1ZXMvMjk3OFxuICAgIC8vIEJlY2F1c2Ugb2YgZGF0ZUFkZFJlbW92ZSB0cmVhdHMgMjQgaG91cnMgYXMgZGlmZmVyZW50IGZyb20gYVxuICAgIC8vIGRheSB3aGVuIHdvcmtpbmcgYXJvdW5kIERTVCwgd2UgbmVlZCB0byBzdG9yZSB0aGVtIHNlcGFyYXRlbHlcbiAgICB0aGlzLl9kYXlzID0gK2RheXMgK1xuICAgICAgICB3ZWVrcyAqIDc7XG4gICAgLy8gSXQgaXMgaW1wb3NzaWJsZSB0cmFuc2xhdGUgbW9udGhzIGludG8gZGF5cyB3aXRob3V0IGtub3dpbmdcbiAgICAvLyB3aGljaCBtb250aHMgeW91IGFyZSBhcmUgdGFsa2luZyBhYm91dCwgc28gd2UgaGF2ZSB0byBzdG9yZVxuICAgIC8vIGl0IHNlcGFyYXRlbHkuXG4gICAgdGhpcy5fbW9udGhzID0gK21vbnRocyArXG4gICAgICAgIHF1YXJ0ZXJzICogMyArXG4gICAgICAgIHllYXJzICogMTI7XG5cbiAgICB0aGlzLl9kYXRhID0ge307XG5cbiAgICB0aGlzLl9sb2NhbGUgPSBnZXRMb2NhbGUoKTtcblxuICAgIHRoaXMuX2J1YmJsZSgpO1xufVxuXG5mdW5jdGlvbiBpc0R1cmF0aW9uIChvYmopIHtcbiAgICByZXR1cm4gb2JqIGluc3RhbmNlb2YgRHVyYXRpb247XG59XG5cbmZ1bmN0aW9uIGFic1JvdW5kIChudW1iZXIpIHtcbiAgICBpZiAobnVtYmVyIDwgMCkge1xuICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCgtMSAqIG51bWJlcikgKiAtMTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gTWF0aC5yb3VuZChudW1iZXIpO1xuICAgIH1cbn1cblxuLy8gRk9STUFUVElOR1xuXG5mdW5jdGlvbiBvZmZzZXQgKHRva2VuLCBzZXBhcmF0b3IpIHtcbiAgICBhZGRGb3JtYXRUb2tlbih0b2tlbiwgMCwgMCwgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb2Zmc2V0ID0gdGhpcy51dGNPZmZzZXQoKTtcbiAgICAgICAgdmFyIHNpZ24gPSAnKyc7XG4gICAgICAgIGlmIChvZmZzZXQgPCAwKSB7XG4gICAgICAgICAgICBvZmZzZXQgPSAtb2Zmc2V0O1xuICAgICAgICAgICAgc2lnbiA9ICctJztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2lnbiArIHplcm9GaWxsKH5+KG9mZnNldCAvIDYwKSwgMikgKyBzZXBhcmF0b3IgKyB6ZXJvRmlsbCh+fihvZmZzZXQpICUgNjAsIDIpO1xuICAgIH0pO1xufVxuXG5vZmZzZXQoJ1onLCAnOicpO1xub2Zmc2V0KCdaWicsICcnKTtcblxuLy8gUEFSU0lOR1xuXG5hZGRSZWdleFRva2VuKCdaJywgIG1hdGNoU2hvcnRPZmZzZXQpO1xuYWRkUmVnZXhUb2tlbignWlonLCBtYXRjaFNob3J0T2Zmc2V0KTtcbmFkZFBhcnNlVG9rZW4oWydaJywgJ1paJ10sIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXksIGNvbmZpZykge1xuICAgIGNvbmZpZy5fdXNlVVRDID0gdHJ1ZTtcbiAgICBjb25maWcuX3R6bSA9IG9mZnNldEZyb21TdHJpbmcobWF0Y2hTaG9ydE9mZnNldCwgaW5wdXQpO1xufSk7XG5cbi8vIEhFTFBFUlNcblxuLy8gdGltZXpvbmUgY2h1bmtlclxuLy8gJysxMDowMCcgPiBbJzEwJywgICcwMCddXG4vLyAnLTE1MzAnICA+IFsnLTE1JywgJzMwJ11cbnZhciBjaHVua09mZnNldCA9IC8oW1xcK1xcLV18XFxkXFxkKS9naTtcblxuZnVuY3Rpb24gb2Zmc2V0RnJvbVN0cmluZyhtYXRjaGVyLCBzdHJpbmcpIHtcbiAgICB2YXIgbWF0Y2hlcyA9IChzdHJpbmcgfHwgJycpLm1hdGNoKG1hdGNoZXIpO1xuXG4gICAgaWYgKG1hdGNoZXMgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgdmFyIGNodW5rICAgPSBtYXRjaGVzW21hdGNoZXMubGVuZ3RoIC0gMV0gfHwgW107XG4gICAgdmFyIHBhcnRzICAgPSAoY2h1bmsgKyAnJykubWF0Y2goY2h1bmtPZmZzZXQpIHx8IFsnLScsIDAsIDBdO1xuICAgIHZhciBtaW51dGVzID0gKyhwYXJ0c1sxXSAqIDYwKSArIHRvSW50KHBhcnRzWzJdKTtcblxuICAgIHJldHVybiBtaW51dGVzID09PSAwID9cbiAgICAgIDAgOlxuICAgICAgcGFydHNbMF0gPT09ICcrJyA/IG1pbnV0ZXMgOiAtbWludXRlcztcbn1cblxuLy8gUmV0dXJuIGEgbW9tZW50IGZyb20gaW5wdXQsIHRoYXQgaXMgbG9jYWwvdXRjL3pvbmUgZXF1aXZhbGVudCB0byBtb2RlbC5cbmZ1bmN0aW9uIGNsb25lV2l0aE9mZnNldChpbnB1dCwgbW9kZWwpIHtcbiAgICB2YXIgcmVzLCBkaWZmO1xuICAgIGlmIChtb2RlbC5faXNVVEMpIHtcbiAgICAgICAgcmVzID0gbW9kZWwuY2xvbmUoKTtcbiAgICAgICAgZGlmZiA9IChpc01vbWVudChpbnB1dCkgfHwgaXNEYXRlKGlucHV0KSA/IGlucHV0LnZhbHVlT2YoKSA6IGNyZWF0ZUxvY2FsKGlucHV0KS52YWx1ZU9mKCkpIC0gcmVzLnZhbHVlT2YoKTtcbiAgICAgICAgLy8gVXNlIGxvdy1sZXZlbCBhcGksIGJlY2F1c2UgdGhpcyBmbiBpcyBsb3ctbGV2ZWwgYXBpLlxuICAgICAgICByZXMuX2Quc2V0VGltZShyZXMuX2QudmFsdWVPZigpICsgZGlmZik7XG4gICAgICAgIGhvb2tzLnVwZGF0ZU9mZnNldChyZXMsIGZhbHNlKTtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gY3JlYXRlTG9jYWwoaW5wdXQpLmxvY2FsKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXREYXRlT2Zmc2V0IChtKSB7XG4gICAgLy8gT24gRmlyZWZveC4yNCBEYXRlI2dldFRpbWV6b25lT2Zmc2V0IHJldHVybnMgYSBmbG9hdGluZyBwb2ludC5cbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vbW9tZW50L21vbWVudC9wdWxsLzE4NzFcbiAgICByZXR1cm4gLU1hdGgucm91bmQobS5fZC5nZXRUaW1lem9uZU9mZnNldCgpIC8gMTUpICogMTU7XG59XG5cbi8vIEhPT0tTXG5cbi8vIFRoaXMgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgd2hlbmV2ZXIgYSBtb21lbnQgaXMgbXV0YXRlZC5cbi8vIEl0IGlzIGludGVuZGVkIHRvIGtlZXAgdGhlIG9mZnNldCBpbiBzeW5jIHdpdGggdGhlIHRpbWV6b25lLlxuaG9va3MudXBkYXRlT2Zmc2V0ID0gZnVuY3Rpb24gKCkge307XG5cbi8vIE1PTUVOVFNcblxuLy8ga2VlcExvY2FsVGltZSA9IHRydWUgbWVhbnMgb25seSBjaGFuZ2UgdGhlIHRpbWV6b25lLCB3aXRob3V0XG4vLyBhZmZlY3RpbmcgdGhlIGxvY2FsIGhvdXIuIFNvIDU6MzE6MjYgKzAzMDAgLS1bdXRjT2Zmc2V0KDIsIHRydWUpXS0tPlxuLy8gNTozMToyNiArMDIwMCBJdCBpcyBwb3NzaWJsZSB0aGF0IDU6MzE6MjYgZG9lc24ndCBleGlzdCB3aXRoIG9mZnNldFxuLy8gKzAyMDAsIHNvIHdlIGFkanVzdCB0aGUgdGltZSBhcyBuZWVkZWQsIHRvIGJlIHZhbGlkLlxuLy9cbi8vIEtlZXBpbmcgdGhlIHRpbWUgYWN0dWFsbHkgYWRkcy9zdWJ0cmFjdHMgKG9uZSBob3VyKVxuLy8gZnJvbSB0aGUgYWN0dWFsIHJlcHJlc2VudGVkIHRpbWUuIFRoYXQgaXMgd2h5IHdlIGNhbGwgdXBkYXRlT2Zmc2V0XG4vLyBhIHNlY29uZCB0aW1lLiBJbiBjYXNlIGl0IHdhbnRzIHVzIHRvIGNoYW5nZSB0aGUgb2Zmc2V0IGFnYWluXG4vLyBfY2hhbmdlSW5Qcm9ncmVzcyA9PSB0cnVlIGNhc2UsIHRoZW4gd2UgaGF2ZSB0byBhZGp1c3QsIGJlY2F1c2Vcbi8vIHRoZXJlIGlzIG5vIHN1Y2ggdGltZSBpbiB0aGUgZ2l2ZW4gdGltZXpvbmUuXG5mdW5jdGlvbiBnZXRTZXRPZmZzZXQgKGlucHV0LCBrZWVwTG9jYWxUaW1lKSB7XG4gICAgdmFyIG9mZnNldCA9IHRoaXMuX29mZnNldCB8fCAwLFxuICAgICAgICBsb2NhbEFkanVzdDtcbiAgICBpZiAoIXRoaXMuaXNWYWxpZCgpKSB7XG4gICAgICAgIHJldHVybiBpbnB1dCAhPSBudWxsID8gdGhpcyA6IE5hTjtcbiAgICB9XG4gICAgaWYgKGlucHV0ICE9IG51bGwpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGlucHV0ID0gb2Zmc2V0RnJvbVN0cmluZyhtYXRjaFNob3J0T2Zmc2V0LCBpbnB1dCk7XG4gICAgICAgICAgICBpZiAoaW5wdXQgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChNYXRoLmFicyhpbnB1dCkgPCAxNikge1xuICAgICAgICAgICAgaW5wdXQgPSBpbnB1dCAqIDYwO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5faXNVVEMgJiYga2VlcExvY2FsVGltZSkge1xuICAgICAgICAgICAgbG9jYWxBZGp1c3QgPSBnZXREYXRlT2Zmc2V0KHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX29mZnNldCA9IGlucHV0O1xuICAgICAgICB0aGlzLl9pc1VUQyA9IHRydWU7XG4gICAgICAgIGlmIChsb2NhbEFkanVzdCAhPSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmFkZChsb2NhbEFkanVzdCwgJ20nKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob2Zmc2V0ICE9PSBpbnB1dCkge1xuICAgICAgICAgICAgaWYgKCFrZWVwTG9jYWxUaW1lIHx8IHRoaXMuX2NoYW5nZUluUHJvZ3Jlc3MpIHtcbiAgICAgICAgICAgICAgICBhZGRTdWJ0cmFjdCh0aGlzLCBjcmVhdGVEdXJhdGlvbihpbnB1dCAtIG9mZnNldCwgJ20nKSwgMSwgZmFsc2UpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICghdGhpcy5fY2hhbmdlSW5Qcm9ncmVzcykge1xuICAgICAgICAgICAgICAgIHRoaXMuX2NoYW5nZUluUHJvZ3Jlc3MgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGhvb2tzLnVwZGF0ZU9mZnNldCh0aGlzLCB0cnVlKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9jaGFuZ2VJblByb2dyZXNzID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5faXNVVEMgPyBvZmZzZXQgOiBnZXREYXRlT2Zmc2V0KHRoaXMpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0U2V0Wm9uZSAoaW5wdXQsIGtlZXBMb2NhbFRpbWUpIHtcbiAgICBpZiAoaW5wdXQgIT0gbnVsbCkge1xuICAgICAgICBpZiAodHlwZW9mIGlucHV0ICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgaW5wdXQgPSAtaW5wdXQ7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnV0Y09mZnNldChpbnB1dCwga2VlcExvY2FsVGltZSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIC10aGlzLnV0Y09mZnNldCgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc2V0T2Zmc2V0VG9VVEMgKGtlZXBMb2NhbFRpbWUpIHtcbiAgICByZXR1cm4gdGhpcy51dGNPZmZzZXQoMCwga2VlcExvY2FsVGltZSk7XG59XG5cbmZ1bmN0aW9uIHNldE9mZnNldFRvTG9jYWwgKGtlZXBMb2NhbFRpbWUpIHtcbiAgICBpZiAodGhpcy5faXNVVEMpIHtcbiAgICAgICAgdGhpcy51dGNPZmZzZXQoMCwga2VlcExvY2FsVGltZSk7XG4gICAgICAgIHRoaXMuX2lzVVRDID0gZmFsc2U7XG5cbiAgICAgICAgaWYgKGtlZXBMb2NhbFRpbWUpIHtcbiAgICAgICAgICAgIHRoaXMuc3VidHJhY3QoZ2V0RGF0ZU9mZnNldCh0aGlzKSwgJ20nKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn1cblxuZnVuY3Rpb24gc2V0T2Zmc2V0VG9QYXJzZWRPZmZzZXQgKCkge1xuICAgIGlmICh0aGlzLl90em0gIT0gbnVsbCkge1xuICAgICAgICB0aGlzLnV0Y09mZnNldCh0aGlzLl90em0pO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHRoaXMuX2kgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHZhciB0Wm9uZSA9IG9mZnNldEZyb21TdHJpbmcobWF0Y2hPZmZzZXQsIHRoaXMuX2kpO1xuICAgICAgICBpZiAodFpvbmUgIT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy51dGNPZmZzZXQodFpvbmUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy51dGNPZmZzZXQoMCwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59XG5cbmZ1bmN0aW9uIGhhc0FsaWduZWRIb3VyT2Zmc2V0IChpbnB1dCkge1xuICAgIGlmICghdGhpcy5pc1ZhbGlkKCkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpbnB1dCA9IGlucHV0ID8gY3JlYXRlTG9jYWwoaW5wdXQpLnV0Y09mZnNldCgpIDogMDtcblxuICAgIHJldHVybiAodGhpcy51dGNPZmZzZXQoKSAtIGlucHV0KSAlIDYwID09PSAwO1xufVxuXG5mdW5jdGlvbiBpc0RheWxpZ2h0U2F2aW5nVGltZSAoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgICAgdGhpcy51dGNPZmZzZXQoKSA+IHRoaXMuY2xvbmUoKS5tb250aCgwKS51dGNPZmZzZXQoKSB8fFxuICAgICAgICB0aGlzLnV0Y09mZnNldCgpID4gdGhpcy5jbG9uZSgpLm1vbnRoKDUpLnV0Y09mZnNldCgpXG4gICAgKTtcbn1cblxuZnVuY3Rpb24gaXNEYXlsaWdodFNhdmluZ1RpbWVTaGlmdGVkICgpIHtcbiAgICBpZiAoIWlzVW5kZWZpbmVkKHRoaXMuX2lzRFNUU2hpZnRlZCkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lzRFNUU2hpZnRlZDtcbiAgICB9XG5cbiAgICB2YXIgYyA9IHt9O1xuXG4gICAgY29weUNvbmZpZyhjLCB0aGlzKTtcbiAgICBjID0gcHJlcGFyZUNvbmZpZyhjKTtcblxuICAgIGlmIChjLl9hKSB7XG4gICAgICAgIHZhciBvdGhlciA9IGMuX2lzVVRDID8gY3JlYXRlVVRDKGMuX2EpIDogY3JlYXRlTG9jYWwoYy5fYSk7XG4gICAgICAgIHRoaXMuX2lzRFNUU2hpZnRlZCA9IHRoaXMuaXNWYWxpZCgpICYmXG4gICAgICAgICAgICBjb21wYXJlQXJyYXlzKGMuX2EsIG90aGVyLnRvQXJyYXkoKSkgPiAwO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2lzRFNUU2hpZnRlZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9pc0RTVFNoaWZ0ZWQ7XG59XG5cbmZ1bmN0aW9uIGlzTG9jYWwgKCkge1xuICAgIHJldHVybiB0aGlzLmlzVmFsaWQoKSA/ICF0aGlzLl9pc1VUQyA6IGZhbHNlO1xufVxuXG5mdW5jdGlvbiBpc1V0Y09mZnNldCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNWYWxpZCgpID8gdGhpcy5faXNVVEMgOiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gaXNVdGMgKCkge1xuICAgIHJldHVybiB0aGlzLmlzVmFsaWQoKSA/IHRoaXMuX2lzVVRDICYmIHRoaXMuX29mZnNldCA9PT0gMCA6IGZhbHNlO1xufVxuXG4vLyBBU1AuTkVUIGpzb24gZGF0ZSBmb3JtYXQgcmVnZXhcbnZhciBhc3BOZXRSZWdleCA9IC9eKFxcLSk/KD86KFxcZCopWy4gXSk/KFxcZCspXFw6KFxcZCspKD86XFw6KFxcZCspKFxcLlxcZCopPyk/JC87XG5cbi8vIGZyb20gaHR0cDovL2RvY3MuY2xvc3VyZS1saWJyYXJ5Lmdvb2dsZWNvZGUuY29tL2dpdC9jbG9zdXJlX2dvb2dfZGF0ZV9kYXRlLmpzLnNvdXJjZS5odG1sXG4vLyBzb21ld2hhdCBtb3JlIGluIGxpbmUgd2l0aCA0LjQuMy4yIDIwMDQgc3BlYywgYnV0IGFsbG93cyBkZWNpbWFsIGFueXdoZXJlXG4vLyBhbmQgZnVydGhlciBtb2RpZmllZCB0byBhbGxvdyBmb3Igc3RyaW5ncyBjb250YWluaW5nIGJvdGggd2VlayBhbmQgZGF5XG52YXIgaXNvUmVnZXggPSAvXigtKT9QKD86KC0/WzAtOSwuXSopWSk/KD86KC0/WzAtOSwuXSopTSk/KD86KC0/WzAtOSwuXSopVyk/KD86KC0/WzAtOSwuXSopRCk/KD86VCg/OigtP1swLTksLl0qKUgpPyg/OigtP1swLTksLl0qKU0pPyg/OigtP1swLTksLl0qKVMpPyk/JC87XG5cbmZ1bmN0aW9uIGNyZWF0ZUR1cmF0aW9uIChpbnB1dCwga2V5KSB7XG4gICAgdmFyIGR1cmF0aW9uID0gaW5wdXQsXG4gICAgICAgIC8vIG1hdGNoaW5nIGFnYWluc3QgcmVnZXhwIGlzIGV4cGVuc2l2ZSwgZG8gaXQgb24gZGVtYW5kXG4gICAgICAgIG1hdGNoID0gbnVsbCxcbiAgICAgICAgc2lnbixcbiAgICAgICAgcmV0LFxuICAgICAgICBkaWZmUmVzO1xuXG4gICAgaWYgKGlzRHVyYXRpb24oaW5wdXQpKSB7XG4gICAgICAgIGR1cmF0aW9uID0ge1xuICAgICAgICAgICAgbXMgOiBpbnB1dC5fbWlsbGlzZWNvbmRzLFxuICAgICAgICAgICAgZCAgOiBpbnB1dC5fZGF5cyxcbiAgICAgICAgICAgIE0gIDogaW5wdXQuX21vbnRoc1xuICAgICAgICB9O1xuICAgIH0gZWxzZSBpZiAoaXNOdW1iZXIoaW5wdXQpKSB7XG4gICAgICAgIGR1cmF0aW9uID0ge307XG4gICAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgICAgIGR1cmF0aW9uW2tleV0gPSBpbnB1dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGR1cmF0aW9uLm1pbGxpc2Vjb25kcyA9IGlucHV0O1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmICghIShtYXRjaCA9IGFzcE5ldFJlZ2V4LmV4ZWMoaW5wdXQpKSkge1xuICAgICAgICBzaWduID0gKG1hdGNoWzFdID09PSAnLScpID8gLTEgOiAxO1xuICAgICAgICBkdXJhdGlvbiA9IHtcbiAgICAgICAgICAgIHkgIDogMCxcbiAgICAgICAgICAgIGQgIDogdG9JbnQobWF0Y2hbREFURV0pICAgICAgICAgICAgICAgICAgICAgICAgICogc2lnbixcbiAgICAgICAgICAgIGggIDogdG9JbnQobWF0Y2hbSE9VUl0pICAgICAgICAgICAgICAgICAgICAgICAgICogc2lnbixcbiAgICAgICAgICAgIG0gIDogdG9JbnQobWF0Y2hbTUlOVVRFXSkgICAgICAgICAgICAgICAgICAgICAgICogc2lnbixcbiAgICAgICAgICAgIHMgIDogdG9JbnQobWF0Y2hbU0VDT05EXSkgICAgICAgICAgICAgICAgICAgICAgICogc2lnbixcbiAgICAgICAgICAgIG1zIDogdG9JbnQoYWJzUm91bmQobWF0Y2hbTUlMTElTRUNPTkRdICogMTAwMCkpICogc2lnbiAvLyB0aGUgbWlsbGlzZWNvbmQgZGVjaW1hbCBwb2ludCBpcyBpbmNsdWRlZCBpbiB0aGUgbWF0Y2hcbiAgICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKCEhKG1hdGNoID0gaXNvUmVnZXguZXhlYyhpbnB1dCkpKSB7XG4gICAgICAgIHNpZ24gPSAobWF0Y2hbMV0gPT09ICctJykgPyAtMSA6IDE7XG4gICAgICAgIGR1cmF0aW9uID0ge1xuICAgICAgICAgICAgeSA6IHBhcnNlSXNvKG1hdGNoWzJdLCBzaWduKSxcbiAgICAgICAgICAgIE0gOiBwYXJzZUlzbyhtYXRjaFszXSwgc2lnbiksXG4gICAgICAgICAgICB3IDogcGFyc2VJc28obWF0Y2hbNF0sIHNpZ24pLFxuICAgICAgICAgICAgZCA6IHBhcnNlSXNvKG1hdGNoWzVdLCBzaWduKSxcbiAgICAgICAgICAgIGggOiBwYXJzZUlzbyhtYXRjaFs2XSwgc2lnbiksXG4gICAgICAgICAgICBtIDogcGFyc2VJc28obWF0Y2hbN10sIHNpZ24pLFxuICAgICAgICAgICAgcyA6IHBhcnNlSXNvKG1hdGNoWzhdLCBzaWduKVxuICAgICAgICB9O1xuICAgIH0gZWxzZSBpZiAoZHVyYXRpb24gPT0gbnVsbCkgey8vIGNoZWNrcyBmb3IgbnVsbCBvciB1bmRlZmluZWRcbiAgICAgICAgZHVyYXRpb24gPSB7fTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBkdXJhdGlvbiA9PT0gJ29iamVjdCcgJiYgKCdmcm9tJyBpbiBkdXJhdGlvbiB8fCAndG8nIGluIGR1cmF0aW9uKSkge1xuICAgICAgICBkaWZmUmVzID0gbW9tZW50c0RpZmZlcmVuY2UoY3JlYXRlTG9jYWwoZHVyYXRpb24uZnJvbSksIGNyZWF0ZUxvY2FsKGR1cmF0aW9uLnRvKSk7XG5cbiAgICAgICAgZHVyYXRpb24gPSB7fTtcbiAgICAgICAgZHVyYXRpb24ubXMgPSBkaWZmUmVzLm1pbGxpc2Vjb25kcztcbiAgICAgICAgZHVyYXRpb24uTSA9IGRpZmZSZXMubW9udGhzO1xuICAgIH1cblxuICAgIHJldCA9IG5ldyBEdXJhdGlvbihkdXJhdGlvbik7XG5cbiAgICBpZiAoaXNEdXJhdGlvbihpbnB1dCkgJiYgaGFzT3duUHJvcChpbnB1dCwgJ19sb2NhbGUnKSkge1xuICAgICAgICByZXQuX2xvY2FsZSA9IGlucHV0Ll9sb2NhbGU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJldDtcbn1cblxuY3JlYXRlRHVyYXRpb24uZm4gPSBEdXJhdGlvbi5wcm90b3R5cGU7XG5cbmZ1bmN0aW9uIHBhcnNlSXNvIChpbnAsIHNpZ24pIHtcbiAgICAvLyBXZSdkIG5vcm1hbGx5IHVzZSB+fmlucCBmb3IgdGhpcywgYnV0IHVuZm9ydHVuYXRlbHkgaXQgYWxzb1xuICAgIC8vIGNvbnZlcnRzIGZsb2F0cyB0byBpbnRzLlxuICAgIC8vIGlucCBtYXkgYmUgdW5kZWZpbmVkLCBzbyBjYXJlZnVsIGNhbGxpbmcgcmVwbGFjZSBvbiBpdC5cbiAgICB2YXIgcmVzID0gaW5wICYmIHBhcnNlRmxvYXQoaW5wLnJlcGxhY2UoJywnLCAnLicpKTtcbiAgICAvLyBhcHBseSBzaWduIHdoaWxlIHdlJ3JlIGF0IGl0XG4gICAgcmV0dXJuIChpc05hTihyZXMpID8gMCA6IHJlcykgKiBzaWduO1xufVxuXG5mdW5jdGlvbiBwb3NpdGl2ZU1vbWVudHNEaWZmZXJlbmNlKGJhc2UsIG90aGVyKSB7XG4gICAgdmFyIHJlcyA9IHttaWxsaXNlY29uZHM6IDAsIG1vbnRoczogMH07XG5cbiAgICByZXMubW9udGhzID0gb3RoZXIubW9udGgoKSAtIGJhc2UubW9udGgoKSArXG4gICAgICAgIChvdGhlci55ZWFyKCkgLSBiYXNlLnllYXIoKSkgKiAxMjtcbiAgICBpZiAoYmFzZS5jbG9uZSgpLmFkZChyZXMubW9udGhzLCAnTScpLmlzQWZ0ZXIob3RoZXIpKSB7XG4gICAgICAgIC0tcmVzLm1vbnRocztcbiAgICB9XG5cbiAgICByZXMubWlsbGlzZWNvbmRzID0gK290aGVyIC0gKyhiYXNlLmNsb25lKCkuYWRkKHJlcy5tb250aHMsICdNJykpO1xuXG4gICAgcmV0dXJuIHJlcztcbn1cblxuZnVuY3Rpb24gbW9tZW50c0RpZmZlcmVuY2UoYmFzZSwgb3RoZXIpIHtcbiAgICB2YXIgcmVzO1xuICAgIGlmICghKGJhc2UuaXNWYWxpZCgpICYmIG90aGVyLmlzVmFsaWQoKSkpIHtcbiAgICAgICAgcmV0dXJuIHttaWxsaXNlY29uZHM6IDAsIG1vbnRoczogMH07XG4gICAgfVxuXG4gICAgb3RoZXIgPSBjbG9uZVdpdGhPZmZzZXQob3RoZXIsIGJhc2UpO1xuICAgIGlmIChiYXNlLmlzQmVmb3JlKG90aGVyKSkge1xuICAgICAgICByZXMgPSBwb3NpdGl2ZU1vbWVudHNEaWZmZXJlbmNlKGJhc2UsIG90aGVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXMgPSBwb3NpdGl2ZU1vbWVudHNEaWZmZXJlbmNlKG90aGVyLCBiYXNlKTtcbiAgICAgICAgcmVzLm1pbGxpc2Vjb25kcyA9IC1yZXMubWlsbGlzZWNvbmRzO1xuICAgICAgICByZXMubW9udGhzID0gLXJlcy5tb250aHM7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlcztcbn1cblxuLy8gVE9ETzogcmVtb3ZlICduYW1lJyBhcmcgYWZ0ZXIgZGVwcmVjYXRpb24gaXMgcmVtb3ZlZFxuZnVuY3Rpb24gY3JlYXRlQWRkZXIoZGlyZWN0aW9uLCBuYW1lKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWwsIHBlcmlvZCkge1xuICAgICAgICB2YXIgZHVyLCB0bXA7XG4gICAgICAgIC8vaW52ZXJ0IHRoZSBhcmd1bWVudHMsIGJ1dCBjb21wbGFpbiBhYm91dCBpdFxuICAgICAgICBpZiAocGVyaW9kICE9PSBudWxsICYmICFpc05hTigrcGVyaW9kKSkge1xuICAgICAgICAgICAgZGVwcmVjYXRlU2ltcGxlKG5hbWUsICdtb21lbnQoKS4nICsgbmFtZSAgKyAnKHBlcmlvZCwgbnVtYmVyKSBpcyBkZXByZWNhdGVkLiBQbGVhc2UgdXNlIG1vbWVudCgpLicgKyBuYW1lICsgJyhudW1iZXIsIHBlcmlvZCkuICcgK1xuICAgICAgICAgICAgJ1NlZSBodHRwOi8vbW9tZW50anMuY29tL2d1aWRlcy8jL3dhcm5pbmdzL2FkZC1pbnZlcnRlZC1wYXJhbS8gZm9yIG1vcmUgaW5mby4nKTtcbiAgICAgICAgICAgIHRtcCA9IHZhbDsgdmFsID0gcGVyaW9kOyBwZXJpb2QgPSB0bXA7XG4gICAgICAgIH1cblxuICAgICAgICB2YWwgPSB0eXBlb2YgdmFsID09PSAnc3RyaW5nJyA/ICt2YWwgOiB2YWw7XG4gICAgICAgIGR1ciA9IGNyZWF0ZUR1cmF0aW9uKHZhbCwgcGVyaW9kKTtcbiAgICAgICAgYWRkU3VidHJhY3QodGhpcywgZHVyLCBkaXJlY3Rpb24pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBhZGRTdWJ0cmFjdCAobW9tLCBkdXJhdGlvbiwgaXNBZGRpbmcsIHVwZGF0ZU9mZnNldCkge1xuICAgIHZhciBtaWxsaXNlY29uZHMgPSBkdXJhdGlvbi5fbWlsbGlzZWNvbmRzLFxuICAgICAgICBkYXlzID0gYWJzUm91bmQoZHVyYXRpb24uX2RheXMpLFxuICAgICAgICBtb250aHMgPSBhYnNSb3VuZChkdXJhdGlvbi5fbW9udGhzKTtcblxuICAgIGlmICghbW9tLmlzVmFsaWQoKSkge1xuICAgICAgICAvLyBObyBvcFxuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdXBkYXRlT2Zmc2V0ID0gdXBkYXRlT2Zmc2V0ID09IG51bGwgPyB0cnVlIDogdXBkYXRlT2Zmc2V0O1xuXG4gICAgaWYgKG1pbGxpc2Vjb25kcykge1xuICAgICAgICBtb20uX2Quc2V0VGltZShtb20uX2QudmFsdWVPZigpICsgbWlsbGlzZWNvbmRzICogaXNBZGRpbmcpO1xuICAgIH1cbiAgICBpZiAoZGF5cykge1xuICAgICAgICBzZXQkMShtb20sICdEYXRlJywgZ2V0KG1vbSwgJ0RhdGUnKSArIGRheXMgKiBpc0FkZGluZyk7XG4gICAgfVxuICAgIGlmIChtb250aHMpIHtcbiAgICAgICAgc2V0TW9udGgobW9tLCBnZXQobW9tLCAnTW9udGgnKSArIG1vbnRocyAqIGlzQWRkaW5nKTtcbiAgICB9XG4gICAgaWYgKHVwZGF0ZU9mZnNldCkge1xuICAgICAgICBob29rcy51cGRhdGVPZmZzZXQobW9tLCBkYXlzIHx8IG1vbnRocyk7XG4gICAgfVxufVxuXG52YXIgYWRkICAgICAgPSBjcmVhdGVBZGRlcigxLCAnYWRkJyk7XG52YXIgc3VidHJhY3QgPSBjcmVhdGVBZGRlcigtMSwgJ3N1YnRyYWN0Jyk7XG5cbmZ1bmN0aW9uIGdldENhbGVuZGFyRm9ybWF0KG15TW9tZW50LCBub3cpIHtcbiAgICB2YXIgZGlmZiA9IG15TW9tZW50LmRpZmYobm93LCAnZGF5cycsIHRydWUpO1xuICAgIHJldHVybiBkaWZmIDwgLTYgPyAnc2FtZUVsc2UnIDpcbiAgICAgICAgICAgIGRpZmYgPCAtMSA/ICdsYXN0V2VlaycgOlxuICAgICAgICAgICAgZGlmZiA8IDAgPyAnbGFzdERheScgOlxuICAgICAgICAgICAgZGlmZiA8IDEgPyAnc2FtZURheScgOlxuICAgICAgICAgICAgZGlmZiA8IDIgPyAnbmV4dERheScgOlxuICAgICAgICAgICAgZGlmZiA8IDcgPyAnbmV4dFdlZWsnIDogJ3NhbWVFbHNlJztcbn1cblxuZnVuY3Rpb24gY2FsZW5kYXIkMSAodGltZSwgZm9ybWF0cykge1xuICAgIC8vIFdlIHdhbnQgdG8gY29tcGFyZSB0aGUgc3RhcnQgb2YgdG9kYXksIHZzIHRoaXMuXG4gICAgLy8gR2V0dGluZyBzdGFydC1vZi10b2RheSBkZXBlbmRzIG9uIHdoZXRoZXIgd2UncmUgbG9jYWwvdXRjL29mZnNldCBvciBub3QuXG4gICAgdmFyIG5vdyA9IHRpbWUgfHwgY3JlYXRlTG9jYWwoKSxcbiAgICAgICAgc29kID0gY2xvbmVXaXRoT2Zmc2V0KG5vdywgdGhpcykuc3RhcnRPZignZGF5JyksXG4gICAgICAgIGZvcm1hdCA9IGhvb2tzLmNhbGVuZGFyRm9ybWF0KHRoaXMsIHNvZCkgfHwgJ3NhbWVFbHNlJztcblxuICAgIHZhciBvdXRwdXQgPSBmb3JtYXRzICYmIChpc0Z1bmN0aW9uKGZvcm1hdHNbZm9ybWF0XSkgPyBmb3JtYXRzW2Zvcm1hdF0uY2FsbCh0aGlzLCBub3cpIDogZm9ybWF0c1tmb3JtYXRdKTtcblxuICAgIHJldHVybiB0aGlzLmZvcm1hdChvdXRwdXQgfHwgdGhpcy5sb2NhbGVEYXRhKCkuY2FsZW5kYXIoZm9ybWF0LCB0aGlzLCBjcmVhdGVMb2NhbChub3cpKSk7XG59XG5cbmZ1bmN0aW9uIGNsb25lICgpIHtcbiAgICByZXR1cm4gbmV3IE1vbWVudCh0aGlzKTtcbn1cblxuZnVuY3Rpb24gaXNBZnRlciAoaW5wdXQsIHVuaXRzKSB7XG4gICAgdmFyIGxvY2FsSW5wdXQgPSBpc01vbWVudChpbnB1dCkgPyBpbnB1dCA6IGNyZWF0ZUxvY2FsKGlucHV0KTtcbiAgICBpZiAoISh0aGlzLmlzVmFsaWQoKSAmJiBsb2NhbElucHV0LmlzVmFsaWQoKSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKCFpc1VuZGVmaW5lZCh1bml0cykgPyB1bml0cyA6ICdtaWxsaXNlY29uZCcpO1xuICAgIGlmICh1bml0cyA9PT0gJ21pbGxpc2Vjb25kJykge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZU9mKCkgPiBsb2NhbElucHV0LnZhbHVlT2YoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbG9jYWxJbnB1dC52YWx1ZU9mKCkgPCB0aGlzLmNsb25lKCkuc3RhcnRPZih1bml0cykudmFsdWVPZigpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaXNCZWZvcmUgKGlucHV0LCB1bml0cykge1xuICAgIHZhciBsb2NhbElucHV0ID0gaXNNb21lbnQoaW5wdXQpID8gaW5wdXQgOiBjcmVhdGVMb2NhbChpbnB1dCk7XG4gICAgaWYgKCEodGhpcy5pc1ZhbGlkKCkgJiYgbG9jYWxJbnB1dC5pc1ZhbGlkKCkpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyghaXNVbmRlZmluZWQodW5pdHMpID8gdW5pdHMgOiAnbWlsbGlzZWNvbmQnKTtcbiAgICBpZiAodW5pdHMgPT09ICdtaWxsaXNlY29uZCcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVPZigpIDwgbG9jYWxJbnB1dC52YWx1ZU9mKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xvbmUoKS5lbmRPZih1bml0cykudmFsdWVPZigpIDwgbG9jYWxJbnB1dC52YWx1ZU9mKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpc0JldHdlZW4gKGZyb20sIHRvLCB1bml0cywgaW5jbHVzaXZpdHkpIHtcbiAgICBpbmNsdXNpdml0eSA9IGluY2x1c2l2aXR5IHx8ICcoKSc7XG4gICAgcmV0dXJuIChpbmNsdXNpdml0eVswXSA9PT0gJygnID8gdGhpcy5pc0FmdGVyKGZyb20sIHVuaXRzKSA6ICF0aGlzLmlzQmVmb3JlKGZyb20sIHVuaXRzKSkgJiZcbiAgICAgICAgKGluY2x1c2l2aXR5WzFdID09PSAnKScgPyB0aGlzLmlzQmVmb3JlKHRvLCB1bml0cykgOiAhdGhpcy5pc0FmdGVyKHRvLCB1bml0cykpO1xufVxuXG5mdW5jdGlvbiBpc1NhbWUgKGlucHV0LCB1bml0cykge1xuICAgIHZhciBsb2NhbElucHV0ID0gaXNNb21lbnQoaW5wdXQpID8gaW5wdXQgOiBjcmVhdGVMb2NhbChpbnB1dCksXG4gICAgICAgIGlucHV0TXM7XG4gICAgaWYgKCEodGhpcy5pc1ZhbGlkKCkgJiYgbG9jYWxJbnB1dC5pc1ZhbGlkKCkpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyB8fCAnbWlsbGlzZWNvbmQnKTtcbiAgICBpZiAodW5pdHMgPT09ICdtaWxsaXNlY29uZCcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVPZigpID09PSBsb2NhbElucHV0LnZhbHVlT2YoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpbnB1dE1zID0gbG9jYWxJbnB1dC52YWx1ZU9mKCk7XG4gICAgICAgIHJldHVybiB0aGlzLmNsb25lKCkuc3RhcnRPZih1bml0cykudmFsdWVPZigpIDw9IGlucHV0TXMgJiYgaW5wdXRNcyA8PSB0aGlzLmNsb25lKCkuZW5kT2YodW5pdHMpLnZhbHVlT2YoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGlzU2FtZU9yQWZ0ZXIgKGlucHV0LCB1bml0cykge1xuICAgIHJldHVybiB0aGlzLmlzU2FtZShpbnB1dCwgdW5pdHMpIHx8IHRoaXMuaXNBZnRlcihpbnB1dCx1bml0cyk7XG59XG5cbmZ1bmN0aW9uIGlzU2FtZU9yQmVmb3JlIChpbnB1dCwgdW5pdHMpIHtcbiAgICByZXR1cm4gdGhpcy5pc1NhbWUoaW5wdXQsIHVuaXRzKSB8fCB0aGlzLmlzQmVmb3JlKGlucHV0LHVuaXRzKTtcbn1cblxuZnVuY3Rpb24gZGlmZiAoaW5wdXQsIHVuaXRzLCBhc0Zsb2F0KSB7XG4gICAgdmFyIHRoYXQsXG4gICAgICAgIHpvbmVEZWx0YSxcbiAgICAgICAgZGVsdGEsIG91dHB1dDtcblxuICAgIGlmICghdGhpcy5pc1ZhbGlkKCkpIHtcbiAgICAgICAgcmV0dXJuIE5hTjtcbiAgICB9XG5cbiAgICB0aGF0ID0gY2xvbmVXaXRoT2Zmc2V0KGlucHV0LCB0aGlzKTtcblxuICAgIGlmICghdGhhdC5pc1ZhbGlkKCkpIHtcbiAgICAgICAgcmV0dXJuIE5hTjtcbiAgICB9XG5cbiAgICB6b25lRGVsdGEgPSAodGhhdC51dGNPZmZzZXQoKSAtIHRoaXMudXRjT2Zmc2V0KCkpICogNmU0O1xuXG4gICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyk7XG5cbiAgICBpZiAodW5pdHMgPT09ICd5ZWFyJyB8fCB1bml0cyA9PT0gJ21vbnRoJyB8fCB1bml0cyA9PT0gJ3F1YXJ0ZXInKSB7XG4gICAgICAgIG91dHB1dCA9IG1vbnRoRGlmZih0aGlzLCB0aGF0KTtcbiAgICAgICAgaWYgKHVuaXRzID09PSAncXVhcnRlcicpIHtcbiAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dCAvIDM7XG4gICAgICAgIH0gZWxzZSBpZiAodW5pdHMgPT09ICd5ZWFyJykge1xuICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0IC8gMTI7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBkZWx0YSA9IHRoaXMgLSB0aGF0O1xuICAgICAgICBvdXRwdXQgPSB1bml0cyA9PT0gJ3NlY29uZCcgPyBkZWx0YSAvIDFlMyA6IC8vIDEwMDBcbiAgICAgICAgICAgIHVuaXRzID09PSAnbWludXRlJyA/IGRlbHRhIC8gNmU0IDogLy8gMTAwMCAqIDYwXG4gICAgICAgICAgICB1bml0cyA9PT0gJ2hvdXInID8gZGVsdGEgLyAzNmU1IDogLy8gMTAwMCAqIDYwICogNjBcbiAgICAgICAgICAgIHVuaXRzID09PSAnZGF5JyA/IChkZWx0YSAtIHpvbmVEZWx0YSkgLyA4NjRlNSA6IC8vIDEwMDAgKiA2MCAqIDYwICogMjQsIG5lZ2F0ZSBkc3RcbiAgICAgICAgICAgIHVuaXRzID09PSAnd2VlaycgPyAoZGVsdGEgLSB6b25lRGVsdGEpIC8gNjA0OGU1IDogLy8gMTAwMCAqIDYwICogNjAgKiAyNCAqIDcsIG5lZ2F0ZSBkc3RcbiAgICAgICAgICAgIGRlbHRhO1xuICAgIH1cbiAgICByZXR1cm4gYXNGbG9hdCA/IG91dHB1dCA6IGFic0Zsb29yKG91dHB1dCk7XG59XG5cbmZ1bmN0aW9uIG1vbnRoRGlmZiAoYSwgYikge1xuICAgIC8vIGRpZmZlcmVuY2UgaW4gbW9udGhzXG4gICAgdmFyIHdob2xlTW9udGhEaWZmID0gKChiLnllYXIoKSAtIGEueWVhcigpKSAqIDEyKSArIChiLm1vbnRoKCkgLSBhLm1vbnRoKCkpLFxuICAgICAgICAvLyBiIGlzIGluIChhbmNob3IgLSAxIG1vbnRoLCBhbmNob3IgKyAxIG1vbnRoKVxuICAgICAgICBhbmNob3IgPSBhLmNsb25lKCkuYWRkKHdob2xlTW9udGhEaWZmLCAnbW9udGhzJyksXG4gICAgICAgIGFuY2hvcjIsIGFkanVzdDtcblxuICAgIGlmIChiIC0gYW5jaG9yIDwgMCkge1xuICAgICAgICBhbmNob3IyID0gYS5jbG9uZSgpLmFkZCh3aG9sZU1vbnRoRGlmZiAtIDEsICdtb250aHMnKTtcbiAgICAgICAgLy8gbGluZWFyIGFjcm9zcyB0aGUgbW9udGhcbiAgICAgICAgYWRqdXN0ID0gKGIgLSBhbmNob3IpIC8gKGFuY2hvciAtIGFuY2hvcjIpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGFuY2hvcjIgPSBhLmNsb25lKCkuYWRkKHdob2xlTW9udGhEaWZmICsgMSwgJ21vbnRocycpO1xuICAgICAgICAvLyBsaW5lYXIgYWNyb3NzIHRoZSBtb250aFxuICAgICAgICBhZGp1c3QgPSAoYiAtIGFuY2hvcikgLyAoYW5jaG9yMiAtIGFuY2hvcik7XG4gICAgfVxuXG4gICAgLy9jaGVjayBmb3IgbmVnYXRpdmUgemVybywgcmV0dXJuIHplcm8gaWYgbmVnYXRpdmUgemVyb1xuICAgIHJldHVybiAtKHdob2xlTW9udGhEaWZmICsgYWRqdXN0KSB8fCAwO1xufVxuXG5ob29rcy5kZWZhdWx0Rm9ybWF0ID0gJ1lZWVktTU0tRERUSEg6bW06c3NaJztcbmhvb2tzLmRlZmF1bHRGb3JtYXRVdGMgPSAnWVlZWS1NTS1ERFRISDptbTpzc1taXSc7XG5cbmZ1bmN0aW9uIHRvU3RyaW5nICgpIHtcbiAgICByZXR1cm4gdGhpcy5jbG9uZSgpLmxvY2FsZSgnZW4nKS5mb3JtYXQoJ2RkZCBNTU0gREQgWVlZWSBISDptbTpzcyBbR01UXVpaJyk7XG59XG5cbmZ1bmN0aW9uIHRvSVNPU3RyaW5nICgpIHtcbiAgICB2YXIgbSA9IHRoaXMuY2xvbmUoKS51dGMoKTtcbiAgICBpZiAoMCA8IG0ueWVhcigpICYmIG0ueWVhcigpIDw9IDk5OTkpIHtcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24oRGF0ZS5wcm90b3R5cGUudG9JU09TdHJpbmcpKSB7XG4gICAgICAgICAgICAvLyBuYXRpdmUgaW1wbGVtZW50YXRpb24gaXMgfjUweCBmYXN0ZXIsIHVzZSBpdCB3aGVuIHdlIGNhblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudG9EYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmb3JtYXRNb21lbnQobSwgJ1lZWVktTU0tRERbVF1ISDptbTpzcy5TU1NbWl0nKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmb3JtYXRNb21lbnQobSwgJ1lZWVlZWS1NTS1ERFtUXUhIOm1tOnNzLlNTU1taXScpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBSZXR1cm4gYSBodW1hbiByZWFkYWJsZSByZXByZXNlbnRhdGlvbiBvZiBhIG1vbWVudCB0aGF0IGNhblxuICogYWxzbyBiZSBldmFsdWF0ZWQgdG8gZ2V0IGEgbmV3IG1vbWVudCB3aGljaCBpcyB0aGUgc2FtZVxuICpcbiAqIEBsaW5rIGh0dHBzOi8vbm9kZWpzLm9yZy9kaXN0L2xhdGVzdC9kb2NzL2FwaS91dGlsLmh0bWwjdXRpbF9jdXN0b21faW5zcGVjdF9mdW5jdGlvbl9vbl9vYmplY3RzXG4gKi9cbmZ1bmN0aW9uIGluc3BlY3QgKCkge1xuICAgIGlmICghdGhpcy5pc1ZhbGlkKCkpIHtcbiAgICAgICAgcmV0dXJuICdtb21lbnQuaW52YWxpZCgvKiAnICsgdGhpcy5faSArICcgKi8pJztcbiAgICB9XG4gICAgdmFyIGZ1bmMgPSAnbW9tZW50JztcbiAgICB2YXIgem9uZSA9ICcnO1xuICAgIGlmICghdGhpcy5pc0xvY2FsKCkpIHtcbiAgICAgICAgZnVuYyA9IHRoaXMudXRjT2Zmc2V0KCkgPT09IDAgPyAnbW9tZW50LnV0YycgOiAnbW9tZW50LnBhcnNlWm9uZSc7XG4gICAgICAgIHpvbmUgPSAnWic7XG4gICAgfVxuICAgIHZhciBwcmVmaXggPSAnWycgKyBmdW5jICsgJyhcIl0nO1xuICAgIHZhciB5ZWFyID0gKDAgPCB0aGlzLnllYXIoKSAmJiB0aGlzLnllYXIoKSA8PSA5OTk5KSA/ICdZWVlZJyA6ICdZWVlZWVknO1xuICAgIHZhciBkYXRldGltZSA9ICctTU0tRERbVF1ISDptbTpzcy5TU1MnO1xuICAgIHZhciBzdWZmaXggPSB6b25lICsgJ1tcIildJztcblxuICAgIHJldHVybiB0aGlzLmZvcm1hdChwcmVmaXggKyB5ZWFyICsgZGF0ZXRpbWUgKyBzdWZmaXgpO1xufVxuXG5mdW5jdGlvbiBmb3JtYXQgKGlucHV0U3RyaW5nKSB7XG4gICAgaWYgKCFpbnB1dFN0cmluZykge1xuICAgICAgICBpbnB1dFN0cmluZyA9IHRoaXMuaXNVdGMoKSA/IGhvb2tzLmRlZmF1bHRGb3JtYXRVdGMgOiBob29rcy5kZWZhdWx0Rm9ybWF0O1xuICAgIH1cbiAgICB2YXIgb3V0cHV0ID0gZm9ybWF0TW9tZW50KHRoaXMsIGlucHV0U3RyaW5nKTtcbiAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCkucG9zdGZvcm1hdChvdXRwdXQpO1xufVxuXG5mdW5jdGlvbiBmcm9tICh0aW1lLCB3aXRob3V0U3VmZml4KSB7XG4gICAgaWYgKHRoaXMuaXNWYWxpZCgpICYmXG4gICAgICAgICAgICAoKGlzTW9tZW50KHRpbWUpICYmIHRpbWUuaXNWYWxpZCgpKSB8fFxuICAgICAgICAgICAgIGNyZWF0ZUxvY2FsKHRpbWUpLmlzVmFsaWQoKSkpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUR1cmF0aW9uKHt0bzogdGhpcywgZnJvbTogdGltZX0pLmxvY2FsZSh0aGlzLmxvY2FsZSgpKS5odW1hbml6ZSghd2l0aG91dFN1ZmZpeCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLmludmFsaWREYXRlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBmcm9tTm93ICh3aXRob3V0U3VmZml4KSB7XG4gICAgcmV0dXJuIHRoaXMuZnJvbShjcmVhdGVMb2NhbCgpLCB3aXRob3V0U3VmZml4KTtcbn1cblxuZnVuY3Rpb24gdG8gKHRpbWUsIHdpdGhvdXRTdWZmaXgpIHtcbiAgICBpZiAodGhpcy5pc1ZhbGlkKCkgJiZcbiAgICAgICAgICAgICgoaXNNb21lbnQodGltZSkgJiYgdGltZS5pc1ZhbGlkKCkpIHx8XG4gICAgICAgICAgICAgY3JlYXRlTG9jYWwodGltZSkuaXNWYWxpZCgpKSkge1xuICAgICAgICByZXR1cm4gY3JlYXRlRHVyYXRpb24oe2Zyb206IHRoaXMsIHRvOiB0aW1lfSkubG9jYWxlKHRoaXMubG9jYWxlKCkpLmh1bWFuaXplKCF3aXRob3V0U3VmZml4KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCkuaW52YWxpZERhdGUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHRvTm93ICh3aXRob3V0U3VmZml4KSB7XG4gICAgcmV0dXJuIHRoaXMudG8oY3JlYXRlTG9jYWwoKSwgd2l0aG91dFN1ZmZpeCk7XG59XG5cbi8vIElmIHBhc3NlZCBhIGxvY2FsZSBrZXksIGl0IHdpbGwgc2V0IHRoZSBsb2NhbGUgZm9yIHRoaXNcbi8vIGluc3RhbmNlLiAgT3RoZXJ3aXNlLCBpdCB3aWxsIHJldHVybiB0aGUgbG9jYWxlIGNvbmZpZ3VyYXRpb25cbi8vIHZhcmlhYmxlcyBmb3IgdGhpcyBpbnN0YW5jZS5cbmZ1bmN0aW9uIGxvY2FsZSAoa2V5KSB7XG4gICAgdmFyIG5ld0xvY2FsZURhdGE7XG5cbiAgICBpZiAoa2V5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvY2FsZS5fYWJicjtcbiAgICB9IGVsc2Uge1xuICAgICAgICBuZXdMb2NhbGVEYXRhID0gZ2V0TG9jYWxlKGtleSk7XG4gICAgICAgIGlmIChuZXdMb2NhbGVEYXRhICE9IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuX2xvY2FsZSA9IG5ld0xvY2FsZURhdGE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufVxuXG52YXIgbGFuZyA9IGRlcHJlY2F0ZShcbiAgICAnbW9tZW50KCkubGFuZygpIGlzIGRlcHJlY2F0ZWQuIEluc3RlYWQsIHVzZSBtb21lbnQoKS5sb2NhbGVEYXRhKCkgdG8gZ2V0IHRoZSBsYW5ndWFnZSBjb25maWd1cmF0aW9uLiBVc2UgbW9tZW50KCkubG9jYWxlKCkgdG8gY2hhbmdlIGxhbmd1YWdlcy4nLFxuICAgIGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sb2NhbGUoa2V5KTtcbiAgICAgICAgfVxuICAgIH1cbik7XG5cbmZ1bmN0aW9uIGxvY2FsZURhdGEgKCkge1xuICAgIHJldHVybiB0aGlzLl9sb2NhbGU7XG59XG5cbmZ1bmN0aW9uIHN0YXJ0T2YgKHVuaXRzKSB7XG4gICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyk7XG4gICAgLy8gdGhlIGZvbGxvd2luZyBzd2l0Y2ggaW50ZW50aW9uYWxseSBvbWl0cyBicmVhayBrZXl3b3Jkc1xuICAgIC8vIHRvIHV0aWxpemUgZmFsbGluZyB0aHJvdWdoIHRoZSBjYXNlcy5cbiAgICBzd2l0Y2ggKHVuaXRzKSB7XG4gICAgICAgIGNhc2UgJ3llYXInOlxuICAgICAgICAgICAgdGhpcy5tb250aCgwKTtcbiAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgY2FzZSAncXVhcnRlcic6XG4gICAgICAgIGNhc2UgJ21vbnRoJzpcbiAgICAgICAgICAgIHRoaXMuZGF0ZSgxKTtcbiAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgY2FzZSAnd2Vlayc6XG4gICAgICAgIGNhc2UgJ2lzb1dlZWsnOlxuICAgICAgICBjYXNlICdkYXknOlxuICAgICAgICBjYXNlICdkYXRlJzpcbiAgICAgICAgICAgIHRoaXMuaG91cnMoMCk7XG4gICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICAgIGNhc2UgJ2hvdXInOlxuICAgICAgICAgICAgdGhpcy5taW51dGVzKDApO1xuICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICBjYXNlICdtaW51dGUnOlxuICAgICAgICAgICAgdGhpcy5zZWNvbmRzKDApO1xuICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICBjYXNlICdzZWNvbmQnOlxuICAgICAgICAgICAgdGhpcy5taWxsaXNlY29uZHMoMCk7XG4gICAgfVxuXG4gICAgLy8gd2Vla3MgYXJlIGEgc3BlY2lhbCBjYXNlXG4gICAgaWYgKHVuaXRzID09PSAnd2VlaycpIHtcbiAgICAgICAgdGhpcy53ZWVrZGF5KDApO1xuICAgIH1cbiAgICBpZiAodW5pdHMgPT09ICdpc29XZWVrJykge1xuICAgICAgICB0aGlzLmlzb1dlZWtkYXkoMSk7XG4gICAgfVxuXG4gICAgLy8gcXVhcnRlcnMgYXJlIGFsc28gc3BlY2lhbFxuICAgIGlmICh1bml0cyA9PT0gJ3F1YXJ0ZXInKSB7XG4gICAgICAgIHRoaXMubW9udGgoTWF0aC5mbG9vcih0aGlzLm1vbnRoKCkgLyAzKSAqIDMpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xufVxuXG5mdW5jdGlvbiBlbmRPZiAodW5pdHMpIHtcbiAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcbiAgICBpZiAodW5pdHMgPT09IHVuZGVmaW5lZCB8fCB1bml0cyA9PT0gJ21pbGxpc2Vjb25kJykge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvLyAnZGF0ZScgaXMgYW4gYWxpYXMgZm9yICdkYXknLCBzbyBpdCBzaG91bGQgYmUgY29uc2lkZXJlZCBhcyBzdWNoLlxuICAgIGlmICh1bml0cyA9PT0gJ2RhdGUnKSB7XG4gICAgICAgIHVuaXRzID0gJ2RheSc7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuc3RhcnRPZih1bml0cykuYWRkKDEsICh1bml0cyA9PT0gJ2lzb1dlZWsnID8gJ3dlZWsnIDogdW5pdHMpKS5zdWJ0cmFjdCgxLCAnbXMnKTtcbn1cblxuZnVuY3Rpb24gdmFsdWVPZiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2QudmFsdWVPZigpIC0gKCh0aGlzLl9vZmZzZXQgfHwgMCkgKiA2MDAwMCk7XG59XG5cbmZ1bmN0aW9uIHVuaXggKCkge1xuICAgIHJldHVybiBNYXRoLmZsb29yKHRoaXMudmFsdWVPZigpIC8gMTAwMCk7XG59XG5cbmZ1bmN0aW9uIHRvRGF0ZSAoKSB7XG4gICAgcmV0dXJuIG5ldyBEYXRlKHRoaXMudmFsdWVPZigpKTtcbn1cblxuZnVuY3Rpb24gdG9BcnJheSAoKSB7XG4gICAgdmFyIG0gPSB0aGlzO1xuICAgIHJldHVybiBbbS55ZWFyKCksIG0ubW9udGgoKSwgbS5kYXRlKCksIG0uaG91cigpLCBtLm1pbnV0ZSgpLCBtLnNlY29uZCgpLCBtLm1pbGxpc2Vjb25kKCldO1xufVxuXG5mdW5jdGlvbiB0b09iamVjdCAoKSB7XG4gICAgdmFyIG0gPSB0aGlzO1xuICAgIHJldHVybiB7XG4gICAgICAgIHllYXJzOiBtLnllYXIoKSxcbiAgICAgICAgbW9udGhzOiBtLm1vbnRoKCksXG4gICAgICAgIGRhdGU6IG0uZGF0ZSgpLFxuICAgICAgICBob3VyczogbS5ob3VycygpLFxuICAgICAgICBtaW51dGVzOiBtLm1pbnV0ZXMoKSxcbiAgICAgICAgc2Vjb25kczogbS5zZWNvbmRzKCksXG4gICAgICAgIG1pbGxpc2Vjb25kczogbS5taWxsaXNlY29uZHMoKVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIHRvSlNPTiAoKSB7XG4gICAgLy8gbmV3IERhdGUoTmFOKS50b0pTT04oKSA9PT0gbnVsbFxuICAgIHJldHVybiB0aGlzLmlzVmFsaWQoKSA/IHRoaXMudG9JU09TdHJpbmcoKSA6IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVmFsaWQkMSAoKSB7XG4gICAgcmV0dXJuIGlzVmFsaWQodGhpcyk7XG59XG5cbmZ1bmN0aW9uIHBhcnNpbmdGbGFncyAoKSB7XG4gICAgcmV0dXJuIGV4dGVuZCh7fSwgZ2V0UGFyc2luZ0ZsYWdzKHRoaXMpKTtcbn1cblxuZnVuY3Rpb24gaW52YWxpZEF0ICgpIHtcbiAgICByZXR1cm4gZ2V0UGFyc2luZ0ZsYWdzKHRoaXMpLm92ZXJmbG93O1xufVxuXG5mdW5jdGlvbiBjcmVhdGlvbkRhdGEoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgaW5wdXQ6IHRoaXMuX2ksXG4gICAgICAgIGZvcm1hdDogdGhpcy5fZixcbiAgICAgICAgbG9jYWxlOiB0aGlzLl9sb2NhbGUsXG4gICAgICAgIGlzVVRDOiB0aGlzLl9pc1VUQyxcbiAgICAgICAgc3RyaWN0OiB0aGlzLl9zdHJpY3RcbiAgICB9O1xufVxuXG4vLyBGT1JNQVRUSU5HXG5cbmFkZEZvcm1hdFRva2VuKDAsIFsnZ2cnLCAyXSwgMCwgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLndlZWtZZWFyKCkgJSAxMDA7XG59KTtcblxuYWRkRm9ybWF0VG9rZW4oMCwgWydHRycsIDJdLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNvV2Vla1llYXIoKSAlIDEwMDtcbn0pO1xuXG5mdW5jdGlvbiBhZGRXZWVrWWVhckZvcm1hdFRva2VuICh0b2tlbiwgZ2V0dGVyKSB7XG4gICAgYWRkRm9ybWF0VG9rZW4oMCwgW3Rva2VuLCB0b2tlbi5sZW5ndGhdLCAwLCBnZXR0ZXIpO1xufVxuXG5hZGRXZWVrWWVhckZvcm1hdFRva2VuKCdnZ2dnJywgICAgICd3ZWVrWWVhcicpO1xuYWRkV2Vla1llYXJGb3JtYXRUb2tlbignZ2dnZ2cnLCAgICAnd2Vla1llYXInKTtcbmFkZFdlZWtZZWFyRm9ybWF0VG9rZW4oJ0dHR0cnLCAgJ2lzb1dlZWtZZWFyJyk7XG5hZGRXZWVrWWVhckZvcm1hdFRva2VuKCdHR0dHRycsICdpc29XZWVrWWVhcicpO1xuXG4vLyBBTElBU0VTXG5cbmFkZFVuaXRBbGlhcygnd2Vla1llYXInLCAnZ2cnKTtcbmFkZFVuaXRBbGlhcygnaXNvV2Vla1llYXInLCAnR0cnKTtcblxuLy8gUFJJT1JJVFlcblxuYWRkVW5pdFByaW9yaXR5KCd3ZWVrWWVhcicsIDEpO1xuYWRkVW5pdFByaW9yaXR5KCdpc29XZWVrWWVhcicsIDEpO1xuXG5cbi8vIFBBUlNJTkdcblxuYWRkUmVnZXhUb2tlbignRycsICAgICAgbWF0Y2hTaWduZWQpO1xuYWRkUmVnZXhUb2tlbignZycsICAgICAgbWF0Y2hTaWduZWQpO1xuYWRkUmVnZXhUb2tlbignR0cnLCAgICAgbWF0Y2gxdG8yLCBtYXRjaDIpO1xuYWRkUmVnZXhUb2tlbignZ2cnLCAgICAgbWF0Y2gxdG8yLCBtYXRjaDIpO1xuYWRkUmVnZXhUb2tlbignR0dHRycsICAgbWF0Y2gxdG80LCBtYXRjaDQpO1xuYWRkUmVnZXhUb2tlbignZ2dnZycsICAgbWF0Y2gxdG80LCBtYXRjaDQpO1xuYWRkUmVnZXhUb2tlbignR0dHR0cnLCAgbWF0Y2gxdG82LCBtYXRjaDYpO1xuYWRkUmVnZXhUb2tlbignZ2dnZ2cnLCAgbWF0Y2gxdG82LCBtYXRjaDYpO1xuXG5hZGRXZWVrUGFyc2VUb2tlbihbJ2dnZ2cnLCAnZ2dnZ2cnLCAnR0dHRycsICdHR0dHRyddLCBmdW5jdGlvbiAoaW5wdXQsIHdlZWssIGNvbmZpZywgdG9rZW4pIHtcbiAgICB3ZWVrW3Rva2VuLnN1YnN0cigwLCAyKV0gPSB0b0ludChpbnB1dCk7XG59KTtcblxuYWRkV2Vla1BhcnNlVG9rZW4oWydnZycsICdHRyddLCBmdW5jdGlvbiAoaW5wdXQsIHdlZWssIGNvbmZpZywgdG9rZW4pIHtcbiAgICB3ZWVrW3Rva2VuXSA9IGhvb2tzLnBhcnNlVHdvRGlnaXRZZWFyKGlucHV0KTtcbn0pO1xuXG4vLyBNT01FTlRTXG5cbmZ1bmN0aW9uIGdldFNldFdlZWtZZWFyIChpbnB1dCkge1xuICAgIHJldHVybiBnZXRTZXRXZWVrWWVhckhlbHBlci5jYWxsKHRoaXMsXG4gICAgICAgICAgICBpbnB1dCxcbiAgICAgICAgICAgIHRoaXMud2VlaygpLFxuICAgICAgICAgICAgdGhpcy53ZWVrZGF5KCksXG4gICAgICAgICAgICB0aGlzLmxvY2FsZURhdGEoKS5fd2Vlay5kb3csXG4gICAgICAgICAgICB0aGlzLmxvY2FsZURhdGEoKS5fd2Vlay5kb3kpO1xufVxuXG5mdW5jdGlvbiBnZXRTZXRJU09XZWVrWWVhciAoaW5wdXQpIHtcbiAgICByZXR1cm4gZ2V0U2V0V2Vla1llYXJIZWxwZXIuY2FsbCh0aGlzLFxuICAgICAgICAgICAgaW5wdXQsIHRoaXMuaXNvV2VlaygpLCB0aGlzLmlzb1dlZWtkYXkoKSwgMSwgNCk7XG59XG5cbmZ1bmN0aW9uIGdldElTT1dlZWtzSW5ZZWFyICgpIHtcbiAgICByZXR1cm4gd2Vla3NJblllYXIodGhpcy55ZWFyKCksIDEsIDQpO1xufVxuXG5mdW5jdGlvbiBnZXRXZWVrc0luWWVhciAoKSB7XG4gICAgdmFyIHdlZWtJbmZvID0gdGhpcy5sb2NhbGVEYXRhKCkuX3dlZWs7XG4gICAgcmV0dXJuIHdlZWtzSW5ZZWFyKHRoaXMueWVhcigpLCB3ZWVrSW5mby5kb3csIHdlZWtJbmZvLmRveSk7XG59XG5cbmZ1bmN0aW9uIGdldFNldFdlZWtZZWFySGVscGVyKGlucHV0LCB3ZWVrLCB3ZWVrZGF5LCBkb3csIGRveSkge1xuICAgIHZhciB3ZWVrc1RhcmdldDtcbiAgICBpZiAoaW5wdXQgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gd2Vla09mWWVhcih0aGlzLCBkb3csIGRveSkueWVhcjtcbiAgICB9IGVsc2Uge1xuICAgICAgICB3ZWVrc1RhcmdldCA9IHdlZWtzSW5ZZWFyKGlucHV0LCBkb3csIGRveSk7XG4gICAgICAgIGlmICh3ZWVrID4gd2Vla3NUYXJnZXQpIHtcbiAgICAgICAgICAgIHdlZWsgPSB3ZWVrc1RhcmdldDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2V0V2Vla0FsbC5jYWxsKHRoaXMsIGlucHV0LCB3ZWVrLCB3ZWVrZGF5LCBkb3csIGRveSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzZXRXZWVrQWxsKHdlZWtZZWFyLCB3ZWVrLCB3ZWVrZGF5LCBkb3csIGRveSkge1xuICAgIHZhciBkYXlPZlllYXJEYXRhID0gZGF5T2ZZZWFyRnJvbVdlZWtzKHdlZWtZZWFyLCB3ZWVrLCB3ZWVrZGF5LCBkb3csIGRveSksXG4gICAgICAgIGRhdGUgPSBjcmVhdGVVVENEYXRlKGRheU9mWWVhckRhdGEueWVhciwgMCwgZGF5T2ZZZWFyRGF0YS5kYXlPZlllYXIpO1xuXG4gICAgdGhpcy55ZWFyKGRhdGUuZ2V0VVRDRnVsbFllYXIoKSk7XG4gICAgdGhpcy5tb250aChkYXRlLmdldFVUQ01vbnRoKCkpO1xuICAgIHRoaXMuZGF0ZShkYXRlLmdldFVUQ0RhdGUoKSk7XG4gICAgcmV0dXJuIHRoaXM7XG59XG5cbi8vIEZPUk1BVFRJTkdcblxuYWRkRm9ybWF0VG9rZW4oJ1EnLCAwLCAnUW8nLCAncXVhcnRlcicpO1xuXG4vLyBBTElBU0VTXG5cbmFkZFVuaXRBbGlhcygncXVhcnRlcicsICdRJyk7XG5cbi8vIFBSSU9SSVRZXG5cbmFkZFVuaXRQcmlvcml0eSgncXVhcnRlcicsIDcpO1xuXG4vLyBQQVJTSU5HXG5cbmFkZFJlZ2V4VG9rZW4oJ1EnLCBtYXRjaDEpO1xuYWRkUGFyc2VUb2tlbignUScsIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXkpIHtcbiAgICBhcnJheVtNT05USF0gPSAodG9JbnQoaW5wdXQpIC0gMSkgKiAzO1xufSk7XG5cbi8vIE1PTUVOVFNcblxuZnVuY3Rpb24gZ2V0U2V0UXVhcnRlciAoaW5wdXQpIHtcbiAgICByZXR1cm4gaW5wdXQgPT0gbnVsbCA/IE1hdGguY2VpbCgodGhpcy5tb250aCgpICsgMSkgLyAzKSA6IHRoaXMubW9udGgoKGlucHV0IC0gMSkgKiAzICsgdGhpcy5tb250aCgpICUgMyk7XG59XG5cbi8vIEZPUk1BVFRJTkdcblxuYWRkRm9ybWF0VG9rZW4oJ0QnLCBbJ0REJywgMl0sICdEbycsICdkYXRlJyk7XG5cbi8vIEFMSUFTRVNcblxuYWRkVW5pdEFsaWFzKCdkYXRlJywgJ0QnKTtcblxuLy8gUFJJT1JPSVRZXG5hZGRVbml0UHJpb3JpdHkoJ2RhdGUnLCA5KTtcblxuLy8gUEFSU0lOR1xuXG5hZGRSZWdleFRva2VuKCdEJywgIG1hdGNoMXRvMik7XG5hZGRSZWdleFRva2VuKCdERCcsIG1hdGNoMXRvMiwgbWF0Y2gyKTtcbmFkZFJlZ2V4VG9rZW4oJ0RvJywgZnVuY3Rpb24gKGlzU3RyaWN0LCBsb2NhbGUpIHtcbiAgICByZXR1cm4gaXNTdHJpY3QgPyBsb2NhbGUuX29yZGluYWxQYXJzZSA6IGxvY2FsZS5fb3JkaW5hbFBhcnNlTGVuaWVudDtcbn0pO1xuXG5hZGRQYXJzZVRva2VuKFsnRCcsICdERCddLCBEQVRFKTtcbmFkZFBhcnNlVG9rZW4oJ0RvJywgZnVuY3Rpb24gKGlucHV0LCBhcnJheSkge1xuICAgIGFycmF5W0RBVEVdID0gdG9JbnQoaW5wdXQubWF0Y2gobWF0Y2gxdG8yKVswXSwgMTApO1xufSk7XG5cbi8vIE1PTUVOVFNcblxudmFyIGdldFNldERheU9mTW9udGggPSBtYWtlR2V0U2V0KCdEYXRlJywgdHJ1ZSk7XG5cbi8vIEZPUk1BVFRJTkdcblxuYWRkRm9ybWF0VG9rZW4oJ0RERCcsIFsnRERERCcsIDNdLCAnREREbycsICdkYXlPZlllYXInKTtcblxuLy8gQUxJQVNFU1xuXG5hZGRVbml0QWxpYXMoJ2RheU9mWWVhcicsICdEREQnKTtcblxuLy8gUFJJT1JJVFlcbmFkZFVuaXRQcmlvcml0eSgnZGF5T2ZZZWFyJywgNCk7XG5cbi8vIFBBUlNJTkdcblxuYWRkUmVnZXhUb2tlbignREREJywgIG1hdGNoMXRvMyk7XG5hZGRSZWdleFRva2VuKCdEREREJywgbWF0Y2gzKTtcbmFkZFBhcnNlVG9rZW4oWydEREQnLCAnRERERCddLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5LCBjb25maWcpIHtcbiAgICBjb25maWcuX2RheU9mWWVhciA9IHRvSW50KGlucHV0KTtcbn0pO1xuXG4vLyBIRUxQRVJTXG5cbi8vIE1PTUVOVFNcblxuZnVuY3Rpb24gZ2V0U2V0RGF5T2ZZZWFyIChpbnB1dCkge1xuICAgIHZhciBkYXlPZlllYXIgPSBNYXRoLnJvdW5kKCh0aGlzLmNsb25lKCkuc3RhcnRPZignZGF5JykgLSB0aGlzLmNsb25lKCkuc3RhcnRPZigneWVhcicpKSAvIDg2NGU1KSArIDE7XG4gICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyBkYXlPZlllYXIgOiB0aGlzLmFkZCgoaW5wdXQgLSBkYXlPZlllYXIpLCAnZCcpO1xufVxuXG4vLyBGT1JNQVRUSU5HXG5cbmFkZEZvcm1hdFRva2VuKCdtJywgWydtbScsIDJdLCAwLCAnbWludXRlJyk7XG5cbi8vIEFMSUFTRVNcblxuYWRkVW5pdEFsaWFzKCdtaW51dGUnLCAnbScpO1xuXG4vLyBQUklPUklUWVxuXG5hZGRVbml0UHJpb3JpdHkoJ21pbnV0ZScsIDE0KTtcblxuLy8gUEFSU0lOR1xuXG5hZGRSZWdleFRva2VuKCdtJywgIG1hdGNoMXRvMik7XG5hZGRSZWdleFRva2VuKCdtbScsIG1hdGNoMXRvMiwgbWF0Y2gyKTtcbmFkZFBhcnNlVG9rZW4oWydtJywgJ21tJ10sIE1JTlVURSk7XG5cbi8vIE1PTUVOVFNcblxudmFyIGdldFNldE1pbnV0ZSA9IG1ha2VHZXRTZXQoJ01pbnV0ZXMnLCBmYWxzZSk7XG5cbi8vIEZPUk1BVFRJTkdcblxuYWRkRm9ybWF0VG9rZW4oJ3MnLCBbJ3NzJywgMl0sIDAsICdzZWNvbmQnKTtcblxuLy8gQUxJQVNFU1xuXG5hZGRVbml0QWxpYXMoJ3NlY29uZCcsICdzJyk7XG5cbi8vIFBSSU9SSVRZXG5cbmFkZFVuaXRQcmlvcml0eSgnc2Vjb25kJywgMTUpO1xuXG4vLyBQQVJTSU5HXG5cbmFkZFJlZ2V4VG9rZW4oJ3MnLCAgbWF0Y2gxdG8yKTtcbmFkZFJlZ2V4VG9rZW4oJ3NzJywgbWF0Y2gxdG8yLCBtYXRjaDIpO1xuYWRkUGFyc2VUb2tlbihbJ3MnLCAnc3MnXSwgU0VDT05EKTtcblxuLy8gTU9NRU5UU1xuXG52YXIgZ2V0U2V0U2Vjb25kID0gbWFrZUdldFNldCgnU2Vjb25kcycsIGZhbHNlKTtcblxuLy8gRk9STUFUVElOR1xuXG5hZGRGb3JtYXRUb2tlbignUycsIDAsIDAsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gfn4odGhpcy5taWxsaXNlY29uZCgpIC8gMTAwKTtcbn0pO1xuXG5hZGRGb3JtYXRUb2tlbigwLCBbJ1NTJywgMl0sIDAsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gfn4odGhpcy5taWxsaXNlY29uZCgpIC8gMTApO1xufSk7XG5cbmFkZEZvcm1hdFRva2VuKDAsIFsnU1NTJywgM10sIDAsICdtaWxsaXNlY29uZCcpO1xuYWRkRm9ybWF0VG9rZW4oMCwgWydTU1NTJywgNF0sIDAsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5taWxsaXNlY29uZCgpICogMTA7XG59KTtcbmFkZEZvcm1hdFRva2VuKDAsIFsnU1NTU1MnLCA1XSwgMCwgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLm1pbGxpc2Vjb25kKCkgKiAxMDA7XG59KTtcbmFkZEZvcm1hdFRva2VuKDAsIFsnU1NTU1NTJywgNl0sIDAsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5taWxsaXNlY29uZCgpICogMTAwMDtcbn0pO1xuYWRkRm9ybWF0VG9rZW4oMCwgWydTU1NTU1NTJywgN10sIDAsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5taWxsaXNlY29uZCgpICogMTAwMDA7XG59KTtcbmFkZEZvcm1hdFRva2VuKDAsIFsnU1NTU1NTU1MnLCA4XSwgMCwgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLm1pbGxpc2Vjb25kKCkgKiAxMDAwMDA7XG59KTtcbmFkZEZvcm1hdFRva2VuKDAsIFsnU1NTU1NTU1NTJywgOV0sIDAsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5taWxsaXNlY29uZCgpICogMTAwMDAwMDtcbn0pO1xuXG5cbi8vIEFMSUFTRVNcblxuYWRkVW5pdEFsaWFzKCdtaWxsaXNlY29uZCcsICdtcycpO1xuXG4vLyBQUklPUklUWVxuXG5hZGRVbml0UHJpb3JpdHkoJ21pbGxpc2Vjb25kJywgMTYpO1xuXG4vLyBQQVJTSU5HXG5cbmFkZFJlZ2V4VG9rZW4oJ1MnLCAgICBtYXRjaDF0bzMsIG1hdGNoMSk7XG5hZGRSZWdleFRva2VuKCdTUycsICAgbWF0Y2gxdG8zLCBtYXRjaDIpO1xuYWRkUmVnZXhUb2tlbignU1NTJywgIG1hdGNoMXRvMywgbWF0Y2gzKTtcblxudmFyIHRva2VuO1xuZm9yICh0b2tlbiA9ICdTU1NTJzsgdG9rZW4ubGVuZ3RoIDw9IDk7IHRva2VuICs9ICdTJykge1xuICAgIGFkZFJlZ2V4VG9rZW4odG9rZW4sIG1hdGNoVW5zaWduZWQpO1xufVxuXG5mdW5jdGlvbiBwYXJzZU1zKGlucHV0LCBhcnJheSkge1xuICAgIGFycmF5W01JTExJU0VDT05EXSA9IHRvSW50KCgnMC4nICsgaW5wdXQpICogMTAwMCk7XG59XG5cbmZvciAodG9rZW4gPSAnUyc7IHRva2VuLmxlbmd0aCA8PSA5OyB0b2tlbiArPSAnUycpIHtcbiAgICBhZGRQYXJzZVRva2VuKHRva2VuLCBwYXJzZU1zKTtcbn1cbi8vIE1PTUVOVFNcblxudmFyIGdldFNldE1pbGxpc2Vjb25kID0gbWFrZUdldFNldCgnTWlsbGlzZWNvbmRzJywgZmFsc2UpO1xuXG4vLyBGT1JNQVRUSU5HXG5cbmFkZEZvcm1hdFRva2VuKCd6JywgIDAsIDAsICd6b25lQWJicicpO1xuYWRkRm9ybWF0VG9rZW4oJ3p6JywgMCwgMCwgJ3pvbmVOYW1lJyk7XG5cbi8vIE1PTUVOVFNcblxuZnVuY3Rpb24gZ2V0Wm9uZUFiYnIgKCkge1xuICAgIHJldHVybiB0aGlzLl9pc1VUQyA/ICdVVEMnIDogJyc7XG59XG5cbmZ1bmN0aW9uIGdldFpvbmVOYW1lICgpIHtcbiAgICByZXR1cm4gdGhpcy5faXNVVEMgPyAnQ29vcmRpbmF0ZWQgVW5pdmVyc2FsIFRpbWUnIDogJyc7XG59XG5cbnZhciBwcm90byA9IE1vbWVudC5wcm90b3R5cGU7XG5cbnByb3RvLmFkZCAgICAgICAgICAgICAgID0gYWRkO1xucHJvdG8uY2FsZW5kYXIgICAgICAgICAgPSBjYWxlbmRhciQxO1xucHJvdG8uY2xvbmUgICAgICAgICAgICAgPSBjbG9uZTtcbnByb3RvLmRpZmYgICAgICAgICAgICAgID0gZGlmZjtcbnByb3RvLmVuZE9mICAgICAgICAgICAgID0gZW5kT2Y7XG5wcm90by5mb3JtYXQgICAgICAgICAgICA9IGZvcm1hdDtcbnByb3RvLmZyb20gICAgICAgICAgICAgID0gZnJvbTtcbnByb3RvLmZyb21Ob3cgICAgICAgICAgID0gZnJvbU5vdztcbnByb3RvLnRvICAgICAgICAgICAgICAgID0gdG87XG5wcm90by50b05vdyAgICAgICAgICAgICA9IHRvTm93O1xucHJvdG8uZ2V0ICAgICAgICAgICAgICAgPSBzdHJpbmdHZXQ7XG5wcm90by5pbnZhbGlkQXQgICAgICAgICA9IGludmFsaWRBdDtcbnByb3RvLmlzQWZ0ZXIgICAgICAgICAgID0gaXNBZnRlcjtcbnByb3RvLmlzQmVmb3JlICAgICAgICAgID0gaXNCZWZvcmU7XG5wcm90by5pc0JldHdlZW4gICAgICAgICA9IGlzQmV0d2VlbjtcbnByb3RvLmlzU2FtZSAgICAgICAgICAgID0gaXNTYW1lO1xucHJvdG8uaXNTYW1lT3JBZnRlciAgICAgPSBpc1NhbWVPckFmdGVyO1xucHJvdG8uaXNTYW1lT3JCZWZvcmUgICAgPSBpc1NhbWVPckJlZm9yZTtcbnByb3RvLmlzVmFsaWQgICAgICAgICAgID0gaXNWYWxpZCQxO1xucHJvdG8ubGFuZyAgICAgICAgICAgICAgPSBsYW5nO1xucHJvdG8ubG9jYWxlICAgICAgICAgICAgPSBsb2NhbGU7XG5wcm90by5sb2NhbGVEYXRhICAgICAgICA9IGxvY2FsZURhdGE7XG5wcm90by5tYXggICAgICAgICAgICAgICA9IHByb3RvdHlwZU1heDtcbnByb3RvLm1pbiAgICAgICAgICAgICAgID0gcHJvdG90eXBlTWluO1xucHJvdG8ucGFyc2luZ0ZsYWdzICAgICAgPSBwYXJzaW5nRmxhZ3M7XG5wcm90by5zZXQgICAgICAgICAgICAgICA9IHN0cmluZ1NldDtcbnByb3RvLnN0YXJ0T2YgICAgICAgICAgID0gc3RhcnRPZjtcbnByb3RvLnN1YnRyYWN0ICAgICAgICAgID0gc3VidHJhY3Q7XG5wcm90by50b0FycmF5ICAgICAgICAgICA9IHRvQXJyYXk7XG5wcm90by50b09iamVjdCAgICAgICAgICA9IHRvT2JqZWN0O1xucHJvdG8udG9EYXRlICAgICAgICAgICAgPSB0b0RhdGU7XG5wcm90by50b0lTT1N0cmluZyAgICAgICA9IHRvSVNPU3RyaW5nO1xucHJvdG8uaW5zcGVjdCAgICAgICAgICAgPSBpbnNwZWN0O1xucHJvdG8udG9KU09OICAgICAgICAgICAgPSB0b0pTT047XG5wcm90by50b1N0cmluZyAgICAgICAgICA9IHRvU3RyaW5nO1xucHJvdG8udW5peCAgICAgICAgICAgICAgPSB1bml4O1xucHJvdG8udmFsdWVPZiAgICAgICAgICAgPSB2YWx1ZU9mO1xucHJvdG8uY3JlYXRpb25EYXRhICAgICAgPSBjcmVhdGlvbkRhdGE7XG5cbi8vIFllYXJcbnByb3RvLnllYXIgICAgICAgPSBnZXRTZXRZZWFyO1xucHJvdG8uaXNMZWFwWWVhciA9IGdldElzTGVhcFllYXI7XG5cbi8vIFdlZWsgWWVhclxucHJvdG8ud2Vla1llYXIgICAgPSBnZXRTZXRXZWVrWWVhcjtcbnByb3RvLmlzb1dlZWtZZWFyID0gZ2V0U2V0SVNPV2Vla1llYXI7XG5cbi8vIFF1YXJ0ZXJcbnByb3RvLnF1YXJ0ZXIgPSBwcm90by5xdWFydGVycyA9IGdldFNldFF1YXJ0ZXI7XG5cbi8vIE1vbnRoXG5wcm90by5tb250aCAgICAgICA9IGdldFNldE1vbnRoO1xucHJvdG8uZGF5c0luTW9udGggPSBnZXREYXlzSW5Nb250aDtcblxuLy8gV2Vla1xucHJvdG8ud2VlayAgICAgICAgICAgPSBwcm90by53ZWVrcyAgICAgICAgPSBnZXRTZXRXZWVrO1xucHJvdG8uaXNvV2VlayAgICAgICAgPSBwcm90by5pc29XZWVrcyAgICAgPSBnZXRTZXRJU09XZWVrO1xucHJvdG8ud2Vla3NJblllYXIgICAgPSBnZXRXZWVrc0luWWVhcjtcbnByb3RvLmlzb1dlZWtzSW5ZZWFyID0gZ2V0SVNPV2Vla3NJblllYXI7XG5cbi8vIERheVxucHJvdG8uZGF0ZSAgICAgICA9IGdldFNldERheU9mTW9udGg7XG5wcm90by5kYXkgICAgICAgID0gcHJvdG8uZGF5cyAgICAgICAgICAgICA9IGdldFNldERheU9mV2VlaztcbnByb3RvLndlZWtkYXkgICAgPSBnZXRTZXRMb2NhbGVEYXlPZldlZWs7XG5wcm90by5pc29XZWVrZGF5ID0gZ2V0U2V0SVNPRGF5T2ZXZWVrO1xucHJvdG8uZGF5T2ZZZWFyICA9IGdldFNldERheU9mWWVhcjtcblxuLy8gSG91clxucHJvdG8uaG91ciA9IHByb3RvLmhvdXJzID0gZ2V0U2V0SG91cjtcblxuLy8gTWludXRlXG5wcm90by5taW51dGUgPSBwcm90by5taW51dGVzID0gZ2V0U2V0TWludXRlO1xuXG4vLyBTZWNvbmRcbnByb3RvLnNlY29uZCA9IHByb3RvLnNlY29uZHMgPSBnZXRTZXRTZWNvbmQ7XG5cbi8vIE1pbGxpc2Vjb25kXG5wcm90by5taWxsaXNlY29uZCA9IHByb3RvLm1pbGxpc2Vjb25kcyA9IGdldFNldE1pbGxpc2Vjb25kO1xuXG4vLyBPZmZzZXRcbnByb3RvLnV0Y09mZnNldCAgICAgICAgICAgID0gZ2V0U2V0T2Zmc2V0O1xucHJvdG8udXRjICAgICAgICAgICAgICAgICAgPSBzZXRPZmZzZXRUb1VUQztcbnByb3RvLmxvY2FsICAgICAgICAgICAgICAgID0gc2V0T2Zmc2V0VG9Mb2NhbDtcbnByb3RvLnBhcnNlWm9uZSAgICAgICAgICAgID0gc2V0T2Zmc2V0VG9QYXJzZWRPZmZzZXQ7XG5wcm90by5oYXNBbGlnbmVkSG91ck9mZnNldCA9IGhhc0FsaWduZWRIb3VyT2Zmc2V0O1xucHJvdG8uaXNEU1QgICAgICAgICAgICAgICAgPSBpc0RheWxpZ2h0U2F2aW5nVGltZTtcbnByb3RvLmlzTG9jYWwgICAgICAgICAgICAgID0gaXNMb2NhbDtcbnByb3RvLmlzVXRjT2Zmc2V0ICAgICAgICAgID0gaXNVdGNPZmZzZXQ7XG5wcm90by5pc1V0YyAgICAgICAgICAgICAgICA9IGlzVXRjO1xucHJvdG8uaXNVVEMgICAgICAgICAgICAgICAgPSBpc1V0YztcblxuLy8gVGltZXpvbmVcbnByb3RvLnpvbmVBYmJyID0gZ2V0Wm9uZUFiYnI7XG5wcm90by56b25lTmFtZSA9IGdldFpvbmVOYW1lO1xuXG4vLyBEZXByZWNhdGlvbnNcbnByb3RvLmRhdGVzICA9IGRlcHJlY2F0ZSgnZGF0ZXMgYWNjZXNzb3IgaXMgZGVwcmVjYXRlZC4gVXNlIGRhdGUgaW5zdGVhZC4nLCBnZXRTZXREYXlPZk1vbnRoKTtcbnByb3RvLm1vbnRocyA9IGRlcHJlY2F0ZSgnbW9udGhzIGFjY2Vzc29yIGlzIGRlcHJlY2F0ZWQuIFVzZSBtb250aCBpbnN0ZWFkJywgZ2V0U2V0TW9udGgpO1xucHJvdG8ueWVhcnMgID0gZGVwcmVjYXRlKCd5ZWFycyBhY2Nlc3NvciBpcyBkZXByZWNhdGVkLiBVc2UgeWVhciBpbnN0ZWFkJywgZ2V0U2V0WWVhcik7XG5wcm90by56b25lICAgPSBkZXByZWNhdGUoJ21vbWVudCgpLnpvbmUgaXMgZGVwcmVjYXRlZCwgdXNlIG1vbWVudCgpLnV0Y09mZnNldCBpbnN0ZWFkLiBodHRwOi8vbW9tZW50anMuY29tL2d1aWRlcy8jL3dhcm5pbmdzL3pvbmUvJywgZ2V0U2V0Wm9uZSk7XG5wcm90by5pc0RTVFNoaWZ0ZWQgPSBkZXByZWNhdGUoJ2lzRFNUU2hpZnRlZCBpcyBkZXByZWNhdGVkLiBTZWUgaHR0cDovL21vbWVudGpzLmNvbS9ndWlkZXMvIy93YXJuaW5ncy9kc3Qtc2hpZnRlZC8gZm9yIG1vcmUgaW5mb3JtYXRpb24nLCBpc0RheWxpZ2h0U2F2aW5nVGltZVNoaWZ0ZWQpO1xuXG5mdW5jdGlvbiBjcmVhdGVVbml4IChpbnB1dCkge1xuICAgIHJldHVybiBjcmVhdGVMb2NhbChpbnB1dCAqIDEwMDApO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVJblpvbmUgKCkge1xuICAgIHJldHVybiBjcmVhdGVMb2NhbC5hcHBseShudWxsLCBhcmd1bWVudHMpLnBhcnNlWm9uZSgpO1xufVxuXG5mdW5jdGlvbiBwcmVQYXJzZVBvc3RGb3JtYXQgKHN0cmluZykge1xuICAgIHJldHVybiBzdHJpbmc7XG59XG5cbnZhciBwcm90byQxID0gTG9jYWxlLnByb3RvdHlwZTtcblxucHJvdG8kMS5jYWxlbmRhciAgICAgICAgPSBjYWxlbmRhcjtcbnByb3RvJDEubG9uZ0RhdGVGb3JtYXQgID0gbG9uZ0RhdGVGb3JtYXQ7XG5wcm90byQxLmludmFsaWREYXRlICAgICA9IGludmFsaWREYXRlO1xucHJvdG8kMS5vcmRpbmFsICAgICAgICAgPSBvcmRpbmFsO1xucHJvdG8kMS5wcmVwYXJzZSAgICAgICAgPSBwcmVQYXJzZVBvc3RGb3JtYXQ7XG5wcm90byQxLnBvc3Rmb3JtYXQgICAgICA9IHByZVBhcnNlUG9zdEZvcm1hdDtcbnByb3RvJDEucmVsYXRpdmVUaW1lICAgID0gcmVsYXRpdmVUaW1lO1xucHJvdG8kMS5wYXN0RnV0dXJlICAgICAgPSBwYXN0RnV0dXJlO1xucHJvdG8kMS5zZXQgICAgICAgICAgICAgPSBzZXQ7XG5cbi8vIE1vbnRoXG5wcm90byQxLm1vbnRocyAgICAgICAgICAgID0gICAgICAgIGxvY2FsZU1vbnRocztcbnByb3RvJDEubW9udGhzU2hvcnQgICAgICAgPSAgICAgICAgbG9jYWxlTW9udGhzU2hvcnQ7XG5wcm90byQxLm1vbnRoc1BhcnNlICAgICAgID0gICAgICAgIGxvY2FsZU1vbnRoc1BhcnNlO1xucHJvdG8kMS5tb250aHNSZWdleCAgICAgICA9IG1vbnRoc1JlZ2V4O1xucHJvdG8kMS5tb250aHNTaG9ydFJlZ2V4ICA9IG1vbnRoc1Nob3J0UmVnZXg7XG5cbi8vIFdlZWtcbnByb3RvJDEud2VlayA9IGxvY2FsZVdlZWs7XG5wcm90byQxLmZpcnN0RGF5T2ZZZWFyID0gbG9jYWxlRmlyc3REYXlPZlllYXI7XG5wcm90byQxLmZpcnN0RGF5T2ZXZWVrID0gbG9jYWxlRmlyc3REYXlPZldlZWs7XG5cbi8vIERheSBvZiBXZWVrXG5wcm90byQxLndlZWtkYXlzICAgICAgID0gICAgICAgIGxvY2FsZVdlZWtkYXlzO1xucHJvdG8kMS53ZWVrZGF5c01pbiAgICA9ICAgICAgICBsb2NhbGVXZWVrZGF5c01pbjtcbnByb3RvJDEud2Vla2RheXNTaG9ydCAgPSAgICAgICAgbG9jYWxlV2Vla2RheXNTaG9ydDtcbnByb3RvJDEud2Vla2RheXNQYXJzZSAgPSAgICAgICAgbG9jYWxlV2Vla2RheXNQYXJzZTtcblxucHJvdG8kMS53ZWVrZGF5c1JlZ2V4ICAgICAgID0gICAgICAgIHdlZWtkYXlzUmVnZXg7XG5wcm90byQxLndlZWtkYXlzU2hvcnRSZWdleCAgPSAgICAgICAgd2Vla2RheXNTaG9ydFJlZ2V4O1xucHJvdG8kMS53ZWVrZGF5c01pblJlZ2V4ICAgID0gICAgICAgIHdlZWtkYXlzTWluUmVnZXg7XG5cbi8vIEhvdXJzXG5wcm90byQxLmlzUE0gPSBsb2NhbGVJc1BNO1xucHJvdG8kMS5tZXJpZGllbSA9IGxvY2FsZU1lcmlkaWVtO1xuXG5mdW5jdGlvbiBnZXQkMSAoZm9ybWF0LCBpbmRleCwgZmllbGQsIHNldHRlcikge1xuICAgIHZhciBsb2NhbGUgPSBnZXRMb2NhbGUoKTtcbiAgICB2YXIgdXRjID0gY3JlYXRlVVRDKCkuc2V0KHNldHRlciwgaW5kZXgpO1xuICAgIHJldHVybiBsb2NhbGVbZmllbGRdKHV0YywgZm9ybWF0KTtcbn1cblxuZnVuY3Rpb24gbGlzdE1vbnRoc0ltcGwgKGZvcm1hdCwgaW5kZXgsIGZpZWxkKSB7XG4gICAgaWYgKGlzTnVtYmVyKGZvcm1hdCkpIHtcbiAgICAgICAgaW5kZXggPSBmb3JtYXQ7XG4gICAgICAgIGZvcm1hdCA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBmb3JtYXQgPSBmb3JtYXQgfHwgJyc7XG5cbiAgICBpZiAoaW5kZXggIT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gZ2V0JDEoZm9ybWF0LCBpbmRleCwgZmllbGQsICdtb250aCcpO1xuICAgIH1cblxuICAgIHZhciBpO1xuICAgIHZhciBvdXQgPSBbXTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgMTI7IGkrKykge1xuICAgICAgICBvdXRbaV0gPSBnZXQkMShmb3JtYXQsIGksIGZpZWxkLCAnbW9udGgnKTtcbiAgICB9XG4gICAgcmV0dXJuIG91dDtcbn1cblxuLy8gKClcbi8vICg1KVxuLy8gKGZtdCwgNSlcbi8vIChmbXQpXG4vLyAodHJ1ZSlcbi8vICh0cnVlLCA1KVxuLy8gKHRydWUsIGZtdCwgNSlcbi8vICh0cnVlLCBmbXQpXG5mdW5jdGlvbiBsaXN0V2Vla2RheXNJbXBsIChsb2NhbGVTb3J0ZWQsIGZvcm1hdCwgaW5kZXgsIGZpZWxkKSB7XG4gICAgaWYgKHR5cGVvZiBsb2NhbGVTb3J0ZWQgPT09ICdib29sZWFuJykge1xuICAgICAgICBpZiAoaXNOdW1iZXIoZm9ybWF0KSkge1xuICAgICAgICAgICAgaW5kZXggPSBmb3JtYXQ7XG4gICAgICAgICAgICBmb3JtYXQgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBmb3JtYXQgPSBmb3JtYXQgfHwgJyc7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZm9ybWF0ID0gbG9jYWxlU29ydGVkO1xuICAgICAgICBpbmRleCA9IGZvcm1hdDtcbiAgICAgICAgbG9jYWxlU29ydGVkID0gZmFsc2U7XG5cbiAgICAgICAgaWYgKGlzTnVtYmVyKGZvcm1hdCkpIHtcbiAgICAgICAgICAgIGluZGV4ID0gZm9ybWF0O1xuICAgICAgICAgICAgZm9ybWF0ID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9ybWF0ID0gZm9ybWF0IHx8ICcnO1xuICAgIH1cblxuICAgIHZhciBsb2NhbGUgPSBnZXRMb2NhbGUoKSxcbiAgICAgICAgc2hpZnQgPSBsb2NhbGVTb3J0ZWQgPyBsb2NhbGUuX3dlZWsuZG93IDogMDtcblxuICAgIGlmIChpbmRleCAhPSBudWxsKSB7XG4gICAgICAgIHJldHVybiBnZXQkMShmb3JtYXQsIChpbmRleCArIHNoaWZ0KSAlIDcsIGZpZWxkLCAnZGF5Jyk7XG4gICAgfVxuXG4gICAgdmFyIGk7XG4gICAgdmFyIG91dCA9IFtdO1xuICAgIGZvciAoaSA9IDA7IGkgPCA3OyBpKyspIHtcbiAgICAgICAgb3V0W2ldID0gZ2V0JDEoZm9ybWF0LCAoaSArIHNoaWZ0KSAlIDcsIGZpZWxkLCAnZGF5Jyk7XG4gICAgfVxuICAgIHJldHVybiBvdXQ7XG59XG5cbmZ1bmN0aW9uIGxpc3RNb250aHMgKGZvcm1hdCwgaW5kZXgpIHtcbiAgICByZXR1cm4gbGlzdE1vbnRoc0ltcGwoZm9ybWF0LCBpbmRleCwgJ21vbnRocycpO1xufVxuXG5mdW5jdGlvbiBsaXN0TW9udGhzU2hvcnQgKGZvcm1hdCwgaW5kZXgpIHtcbiAgICByZXR1cm4gbGlzdE1vbnRoc0ltcGwoZm9ybWF0LCBpbmRleCwgJ21vbnRoc1Nob3J0Jyk7XG59XG5cbmZ1bmN0aW9uIGxpc3RXZWVrZGF5cyAobG9jYWxlU29ydGVkLCBmb3JtYXQsIGluZGV4KSB7XG4gICAgcmV0dXJuIGxpc3RXZWVrZGF5c0ltcGwobG9jYWxlU29ydGVkLCBmb3JtYXQsIGluZGV4LCAnd2Vla2RheXMnKTtcbn1cblxuZnVuY3Rpb24gbGlzdFdlZWtkYXlzU2hvcnQgKGxvY2FsZVNvcnRlZCwgZm9ybWF0LCBpbmRleCkge1xuICAgIHJldHVybiBsaXN0V2Vla2RheXNJbXBsKGxvY2FsZVNvcnRlZCwgZm9ybWF0LCBpbmRleCwgJ3dlZWtkYXlzU2hvcnQnKTtcbn1cblxuZnVuY3Rpb24gbGlzdFdlZWtkYXlzTWluIChsb2NhbGVTb3J0ZWQsIGZvcm1hdCwgaW5kZXgpIHtcbiAgICByZXR1cm4gbGlzdFdlZWtkYXlzSW1wbChsb2NhbGVTb3J0ZWQsIGZvcm1hdCwgaW5kZXgsICd3ZWVrZGF5c01pbicpO1xufVxuXG5nZXRTZXRHbG9iYWxMb2NhbGUoJ2VuJywge1xuICAgIG9yZGluYWxQYXJzZTogL1xcZHsxLDJ9KHRofHN0fG5kfHJkKS8sXG4gICAgb3JkaW5hbCA6IGZ1bmN0aW9uIChudW1iZXIpIHtcbiAgICAgICAgdmFyIGIgPSBudW1iZXIgJSAxMCxcbiAgICAgICAgICAgIG91dHB1dCA9ICh0b0ludChudW1iZXIgJSAxMDAgLyAxMCkgPT09IDEpID8gJ3RoJyA6XG4gICAgICAgICAgICAoYiA9PT0gMSkgPyAnc3QnIDpcbiAgICAgICAgICAgIChiID09PSAyKSA/ICduZCcgOlxuICAgICAgICAgICAgKGIgPT09IDMpID8gJ3JkJyA6ICd0aCc7XG4gICAgICAgIHJldHVybiBudW1iZXIgKyBvdXRwdXQ7XG4gICAgfVxufSk7XG5cbi8vIFNpZGUgZWZmZWN0IGltcG9ydHNcbmhvb2tzLmxhbmcgPSBkZXByZWNhdGUoJ21vbWVudC5sYW5nIGlzIGRlcHJlY2F0ZWQuIFVzZSBtb21lbnQubG9jYWxlIGluc3RlYWQuJywgZ2V0U2V0R2xvYmFsTG9jYWxlKTtcbmhvb2tzLmxhbmdEYXRhID0gZGVwcmVjYXRlKCdtb21lbnQubGFuZ0RhdGEgaXMgZGVwcmVjYXRlZC4gVXNlIG1vbWVudC5sb2NhbGVEYXRhIGluc3RlYWQuJywgZ2V0TG9jYWxlKTtcblxudmFyIG1hdGhBYnMgPSBNYXRoLmFicztcblxuZnVuY3Rpb24gYWJzICgpIHtcbiAgICB2YXIgZGF0YSAgICAgICAgICAgPSB0aGlzLl9kYXRhO1xuXG4gICAgdGhpcy5fbWlsbGlzZWNvbmRzID0gbWF0aEFicyh0aGlzLl9taWxsaXNlY29uZHMpO1xuICAgIHRoaXMuX2RheXMgICAgICAgICA9IG1hdGhBYnModGhpcy5fZGF5cyk7XG4gICAgdGhpcy5fbW9udGhzICAgICAgID0gbWF0aEFicyh0aGlzLl9tb250aHMpO1xuXG4gICAgZGF0YS5taWxsaXNlY29uZHMgID0gbWF0aEFicyhkYXRhLm1pbGxpc2Vjb25kcyk7XG4gICAgZGF0YS5zZWNvbmRzICAgICAgID0gbWF0aEFicyhkYXRhLnNlY29uZHMpO1xuICAgIGRhdGEubWludXRlcyAgICAgICA9IG1hdGhBYnMoZGF0YS5taW51dGVzKTtcbiAgICBkYXRhLmhvdXJzICAgICAgICAgPSBtYXRoQWJzKGRhdGEuaG91cnMpO1xuICAgIGRhdGEubW9udGhzICAgICAgICA9IG1hdGhBYnMoZGF0YS5tb250aHMpO1xuICAgIGRhdGEueWVhcnMgICAgICAgICA9IG1hdGhBYnMoZGF0YS55ZWFycyk7XG5cbiAgICByZXR1cm4gdGhpcztcbn1cblxuZnVuY3Rpb24gYWRkU3VidHJhY3QkMSAoZHVyYXRpb24sIGlucHV0LCB2YWx1ZSwgZGlyZWN0aW9uKSB7XG4gICAgdmFyIG90aGVyID0gY3JlYXRlRHVyYXRpb24oaW5wdXQsIHZhbHVlKTtcblxuICAgIGR1cmF0aW9uLl9taWxsaXNlY29uZHMgKz0gZGlyZWN0aW9uICogb3RoZXIuX21pbGxpc2Vjb25kcztcbiAgICBkdXJhdGlvbi5fZGF5cyAgICAgICAgICs9IGRpcmVjdGlvbiAqIG90aGVyLl9kYXlzO1xuICAgIGR1cmF0aW9uLl9tb250aHMgICAgICAgKz0gZGlyZWN0aW9uICogb3RoZXIuX21vbnRocztcblxuICAgIHJldHVybiBkdXJhdGlvbi5fYnViYmxlKCk7XG59XG5cbi8vIHN1cHBvcnRzIG9ubHkgMi4wLXN0eWxlIGFkZCgxLCAncycpIG9yIGFkZChkdXJhdGlvbilcbmZ1bmN0aW9uIGFkZCQxIChpbnB1dCwgdmFsdWUpIHtcbiAgICByZXR1cm4gYWRkU3VidHJhY3QkMSh0aGlzLCBpbnB1dCwgdmFsdWUsIDEpO1xufVxuXG4vLyBzdXBwb3J0cyBvbmx5IDIuMC1zdHlsZSBzdWJ0cmFjdCgxLCAncycpIG9yIHN1YnRyYWN0KGR1cmF0aW9uKVxuZnVuY3Rpb24gc3VidHJhY3QkMSAoaW5wdXQsIHZhbHVlKSB7XG4gICAgcmV0dXJuIGFkZFN1YnRyYWN0JDEodGhpcywgaW5wdXQsIHZhbHVlLCAtMSk7XG59XG5cbmZ1bmN0aW9uIGFic0NlaWwgKG51bWJlcikge1xuICAgIGlmIChudW1iZXIgPCAwKSB7XG4gICAgICAgIHJldHVybiBNYXRoLmZsb29yKG51bWJlcik7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIE1hdGguY2VpbChudW1iZXIpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gYnViYmxlICgpIHtcbiAgICB2YXIgbWlsbGlzZWNvbmRzID0gdGhpcy5fbWlsbGlzZWNvbmRzO1xuICAgIHZhciBkYXlzICAgICAgICAgPSB0aGlzLl9kYXlzO1xuICAgIHZhciBtb250aHMgICAgICAgPSB0aGlzLl9tb250aHM7XG4gICAgdmFyIGRhdGEgICAgICAgICA9IHRoaXMuX2RhdGE7XG4gICAgdmFyIHNlY29uZHMsIG1pbnV0ZXMsIGhvdXJzLCB5ZWFycywgbW9udGhzRnJvbURheXM7XG5cbiAgICAvLyBpZiB3ZSBoYXZlIGEgbWl4IG9mIHBvc2l0aXZlIGFuZCBuZWdhdGl2ZSB2YWx1ZXMsIGJ1YmJsZSBkb3duIGZpcnN0XG4gICAgLy8gY2hlY2s6IGh0dHBzOi8vZ2l0aHViLmNvbS9tb21lbnQvbW9tZW50L2lzc3Vlcy8yMTY2XG4gICAgaWYgKCEoKG1pbGxpc2Vjb25kcyA+PSAwICYmIGRheXMgPj0gMCAmJiBtb250aHMgPj0gMCkgfHxcbiAgICAgICAgICAgIChtaWxsaXNlY29uZHMgPD0gMCAmJiBkYXlzIDw9IDAgJiYgbW9udGhzIDw9IDApKSkge1xuICAgICAgICBtaWxsaXNlY29uZHMgKz0gYWJzQ2VpbChtb250aHNUb0RheXMobW9udGhzKSArIGRheXMpICogODY0ZTU7XG4gICAgICAgIGRheXMgPSAwO1xuICAgICAgICBtb250aHMgPSAwO1xuICAgIH1cblxuICAgIC8vIFRoZSBmb2xsb3dpbmcgY29kZSBidWJibGVzIHVwIHZhbHVlcywgc2VlIHRoZSB0ZXN0cyBmb3JcbiAgICAvLyBleGFtcGxlcyBvZiB3aGF0IHRoYXQgbWVhbnMuXG4gICAgZGF0YS5taWxsaXNlY29uZHMgPSBtaWxsaXNlY29uZHMgJSAxMDAwO1xuXG4gICAgc2Vjb25kcyAgICAgICAgICAgPSBhYnNGbG9vcihtaWxsaXNlY29uZHMgLyAxMDAwKTtcbiAgICBkYXRhLnNlY29uZHMgICAgICA9IHNlY29uZHMgJSA2MDtcblxuICAgIG1pbnV0ZXMgICAgICAgICAgID0gYWJzRmxvb3Ioc2Vjb25kcyAvIDYwKTtcbiAgICBkYXRhLm1pbnV0ZXMgICAgICA9IG1pbnV0ZXMgJSA2MDtcblxuICAgIGhvdXJzICAgICAgICAgICAgID0gYWJzRmxvb3IobWludXRlcyAvIDYwKTtcbiAgICBkYXRhLmhvdXJzICAgICAgICA9IGhvdXJzICUgMjQ7XG5cbiAgICBkYXlzICs9IGFic0Zsb29yKGhvdXJzIC8gMjQpO1xuXG4gICAgLy8gY29udmVydCBkYXlzIHRvIG1vbnRoc1xuICAgIG1vbnRoc0Zyb21EYXlzID0gYWJzRmxvb3IoZGF5c1RvTW9udGhzKGRheXMpKTtcbiAgICBtb250aHMgKz0gbW9udGhzRnJvbURheXM7XG4gICAgZGF5cyAtPSBhYnNDZWlsKG1vbnRoc1RvRGF5cyhtb250aHNGcm9tRGF5cykpO1xuXG4gICAgLy8gMTIgbW9udGhzIC0+IDEgeWVhclxuICAgIHllYXJzID0gYWJzRmxvb3IobW9udGhzIC8gMTIpO1xuICAgIG1vbnRocyAlPSAxMjtcblxuICAgIGRhdGEuZGF5cyAgID0gZGF5cztcbiAgICBkYXRhLm1vbnRocyA9IG1vbnRocztcbiAgICBkYXRhLnllYXJzICA9IHllYXJzO1xuXG4gICAgcmV0dXJuIHRoaXM7XG59XG5cbmZ1bmN0aW9uIGRheXNUb01vbnRocyAoZGF5cykge1xuICAgIC8vIDQwMCB5ZWFycyBoYXZlIDE0NjA5NyBkYXlzICh0YWtpbmcgaW50byBhY2NvdW50IGxlYXAgeWVhciBydWxlcylcbiAgICAvLyA0MDAgeWVhcnMgaGF2ZSAxMiBtb250aHMgPT09IDQ4MDBcbiAgICByZXR1cm4gZGF5cyAqIDQ4MDAgLyAxNDYwOTc7XG59XG5cbmZ1bmN0aW9uIG1vbnRoc1RvRGF5cyAobW9udGhzKSB7XG4gICAgLy8gdGhlIHJldmVyc2Ugb2YgZGF5c1RvTW9udGhzXG4gICAgcmV0dXJuIG1vbnRocyAqIDE0NjA5NyAvIDQ4MDA7XG59XG5cbmZ1bmN0aW9uIGFzICh1bml0cykge1xuICAgIHZhciBkYXlzO1xuICAgIHZhciBtb250aHM7XG4gICAgdmFyIG1pbGxpc2Vjb25kcyA9IHRoaXMuX21pbGxpc2Vjb25kcztcblxuICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModW5pdHMpO1xuXG4gICAgaWYgKHVuaXRzID09PSAnbW9udGgnIHx8IHVuaXRzID09PSAneWVhcicpIHtcbiAgICAgICAgZGF5cyAgID0gdGhpcy5fZGF5cyAgICsgbWlsbGlzZWNvbmRzIC8gODY0ZTU7XG4gICAgICAgIG1vbnRocyA9IHRoaXMuX21vbnRocyArIGRheXNUb01vbnRocyhkYXlzKTtcbiAgICAgICAgcmV0dXJuIHVuaXRzID09PSAnbW9udGgnID8gbW9udGhzIDogbW9udGhzIC8gMTI7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gaGFuZGxlIG1pbGxpc2Vjb25kcyBzZXBhcmF0ZWx5IGJlY2F1c2Ugb2YgZmxvYXRpbmcgcG9pbnQgbWF0aCBlcnJvcnMgKGlzc3VlICMxODY3KVxuICAgICAgICBkYXlzID0gdGhpcy5fZGF5cyArIE1hdGgucm91bmQobW9udGhzVG9EYXlzKHRoaXMuX21vbnRocykpO1xuICAgICAgICBzd2l0Y2ggKHVuaXRzKSB7XG4gICAgICAgICAgICBjYXNlICd3ZWVrJyAgIDogcmV0dXJuIGRheXMgLyA3ICAgICArIG1pbGxpc2Vjb25kcyAvIDYwNDhlNTtcbiAgICAgICAgICAgIGNhc2UgJ2RheScgICAgOiByZXR1cm4gZGF5cyAgICAgICAgICsgbWlsbGlzZWNvbmRzIC8gODY0ZTU7XG4gICAgICAgICAgICBjYXNlICdob3VyJyAgIDogcmV0dXJuIGRheXMgKiAyNCAgICArIG1pbGxpc2Vjb25kcyAvIDM2ZTU7XG4gICAgICAgICAgICBjYXNlICdtaW51dGUnIDogcmV0dXJuIGRheXMgKiAxNDQwICArIG1pbGxpc2Vjb25kcyAvIDZlNDtcbiAgICAgICAgICAgIGNhc2UgJ3NlY29uZCcgOiByZXR1cm4gZGF5cyAqIDg2NDAwICsgbWlsbGlzZWNvbmRzIC8gMTAwMDtcbiAgICAgICAgICAgIC8vIE1hdGguZmxvb3IgcHJldmVudHMgZmxvYXRpbmcgcG9pbnQgbWF0aCBlcnJvcnMgaGVyZVxuICAgICAgICAgICAgY2FzZSAnbWlsbGlzZWNvbmQnOiByZXR1cm4gTWF0aC5mbG9vcihkYXlzICogODY0ZTUpICsgbWlsbGlzZWNvbmRzO1xuICAgICAgICAgICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIHVuaXQgJyArIHVuaXRzKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gVE9ETzogVXNlIHRoaXMuYXMoJ21zJyk/XG5mdW5jdGlvbiB2YWx1ZU9mJDEgKCkge1xuICAgIHJldHVybiAoXG4gICAgICAgIHRoaXMuX21pbGxpc2Vjb25kcyArXG4gICAgICAgIHRoaXMuX2RheXMgKiA4NjRlNSArXG4gICAgICAgICh0aGlzLl9tb250aHMgJSAxMikgKiAyNTkyZTYgK1xuICAgICAgICB0b0ludCh0aGlzLl9tb250aHMgLyAxMikgKiAzMTUzNmU2XG4gICAgKTtcbn1cblxuZnVuY3Rpb24gbWFrZUFzIChhbGlhcykge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFzKGFsaWFzKTtcbiAgICB9O1xufVxuXG52YXIgYXNNaWxsaXNlY29uZHMgPSBtYWtlQXMoJ21zJyk7XG52YXIgYXNTZWNvbmRzICAgICAgPSBtYWtlQXMoJ3MnKTtcbnZhciBhc01pbnV0ZXMgICAgICA9IG1ha2VBcygnbScpO1xudmFyIGFzSG91cnMgICAgICAgID0gbWFrZUFzKCdoJyk7XG52YXIgYXNEYXlzICAgICAgICAgPSBtYWtlQXMoJ2QnKTtcbnZhciBhc1dlZWtzICAgICAgICA9IG1ha2VBcygndycpO1xudmFyIGFzTW9udGhzICAgICAgID0gbWFrZUFzKCdNJyk7XG52YXIgYXNZZWFycyAgICAgICAgPSBtYWtlQXMoJ3knKTtcblxuZnVuY3Rpb24gZ2V0JDIgKHVuaXRzKSB7XG4gICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyk7XG4gICAgcmV0dXJuIHRoaXNbdW5pdHMgKyAncyddKCk7XG59XG5cbmZ1bmN0aW9uIG1ha2VHZXR0ZXIobmFtZSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhW25hbWVdO1xuICAgIH07XG59XG5cbnZhciBtaWxsaXNlY29uZHMgPSBtYWtlR2V0dGVyKCdtaWxsaXNlY29uZHMnKTtcbnZhciBzZWNvbmRzICAgICAgPSBtYWtlR2V0dGVyKCdzZWNvbmRzJyk7XG52YXIgbWludXRlcyAgICAgID0gbWFrZUdldHRlcignbWludXRlcycpO1xudmFyIGhvdXJzICAgICAgICA9IG1ha2VHZXR0ZXIoJ2hvdXJzJyk7XG52YXIgZGF5cyAgICAgICAgID0gbWFrZUdldHRlcignZGF5cycpO1xudmFyIG1vbnRocyAgICAgICA9IG1ha2VHZXR0ZXIoJ21vbnRocycpO1xudmFyIHllYXJzICAgICAgICA9IG1ha2VHZXR0ZXIoJ3llYXJzJyk7XG5cbmZ1bmN0aW9uIHdlZWtzICgpIHtcbiAgICByZXR1cm4gYWJzRmxvb3IodGhpcy5kYXlzKCkgLyA3KTtcbn1cblxudmFyIHJvdW5kID0gTWF0aC5yb3VuZDtcbnZhciB0aHJlc2hvbGRzID0ge1xuICAgIHM6IDQ1LCAgLy8gc2Vjb25kcyB0byBtaW51dGVcbiAgICBtOiA0NSwgIC8vIG1pbnV0ZXMgdG8gaG91clxuICAgIGg6IDIyLCAgLy8gaG91cnMgdG8gZGF5XG4gICAgZDogMjYsICAvLyBkYXlzIHRvIG1vbnRoXG4gICAgTTogMTEgICAvLyBtb250aHMgdG8geWVhclxufTtcblxuLy8gaGVscGVyIGZ1bmN0aW9uIGZvciBtb21lbnQuZm4uZnJvbSwgbW9tZW50LmZuLmZyb21Ob3csIGFuZCBtb21lbnQuZHVyYXRpb24uZm4uaHVtYW5pemVcbmZ1bmN0aW9uIHN1YnN0aXR1dGVUaW1lQWdvKHN0cmluZywgbnVtYmVyLCB3aXRob3V0U3VmZml4LCBpc0Z1dHVyZSwgbG9jYWxlKSB7XG4gICAgcmV0dXJuIGxvY2FsZS5yZWxhdGl2ZVRpbWUobnVtYmVyIHx8IDEsICEhd2l0aG91dFN1ZmZpeCwgc3RyaW5nLCBpc0Z1dHVyZSk7XG59XG5cbmZ1bmN0aW9uIHJlbGF0aXZlVGltZSQxIChwb3NOZWdEdXJhdGlvbiwgd2l0aG91dFN1ZmZpeCwgbG9jYWxlKSB7XG4gICAgdmFyIGR1cmF0aW9uID0gY3JlYXRlRHVyYXRpb24ocG9zTmVnRHVyYXRpb24pLmFicygpO1xuICAgIHZhciBzZWNvbmRzICA9IHJvdW5kKGR1cmF0aW9uLmFzKCdzJykpO1xuICAgIHZhciBtaW51dGVzICA9IHJvdW5kKGR1cmF0aW9uLmFzKCdtJykpO1xuICAgIHZhciBob3VycyAgICA9IHJvdW5kKGR1cmF0aW9uLmFzKCdoJykpO1xuICAgIHZhciBkYXlzICAgICA9IHJvdW5kKGR1cmF0aW9uLmFzKCdkJykpO1xuICAgIHZhciBtb250aHMgICA9IHJvdW5kKGR1cmF0aW9uLmFzKCdNJykpO1xuICAgIHZhciB5ZWFycyAgICA9IHJvdW5kKGR1cmF0aW9uLmFzKCd5JykpO1xuXG4gICAgdmFyIGEgPSBzZWNvbmRzIDwgdGhyZXNob2xkcy5zICYmIFsncycsIHNlY29uZHNdICB8fFxuICAgICAgICAgICAgbWludXRlcyA8PSAxICAgICAgICAgICAmJiBbJ20nXSAgICAgICAgICAgfHxcbiAgICAgICAgICAgIG1pbnV0ZXMgPCB0aHJlc2hvbGRzLm0gJiYgWydtbScsIG1pbnV0ZXNdIHx8XG4gICAgICAgICAgICBob3VycyAgIDw9IDEgICAgICAgICAgICYmIFsnaCddICAgICAgICAgICB8fFxuICAgICAgICAgICAgaG91cnMgICA8IHRocmVzaG9sZHMuaCAmJiBbJ2hoJywgaG91cnNdICAgfHxcbiAgICAgICAgICAgIGRheXMgICAgPD0gMSAgICAgICAgICAgJiYgWydkJ10gICAgICAgICAgIHx8XG4gICAgICAgICAgICBkYXlzICAgIDwgdGhyZXNob2xkcy5kICYmIFsnZGQnLCBkYXlzXSAgICB8fFxuICAgICAgICAgICAgbW9udGhzICA8PSAxICAgICAgICAgICAmJiBbJ00nXSAgICAgICAgICAgfHxcbiAgICAgICAgICAgIG1vbnRocyAgPCB0aHJlc2hvbGRzLk0gJiYgWydNTScsIG1vbnRoc10gIHx8XG4gICAgICAgICAgICB5ZWFycyAgIDw9IDEgICAgICAgICAgICYmIFsneSddICAgICAgICAgICB8fCBbJ3l5JywgeWVhcnNdO1xuXG4gICAgYVsyXSA9IHdpdGhvdXRTdWZmaXg7XG4gICAgYVszXSA9ICtwb3NOZWdEdXJhdGlvbiA+IDA7XG4gICAgYVs0XSA9IGxvY2FsZTtcbiAgICByZXR1cm4gc3Vic3RpdHV0ZVRpbWVBZ28uYXBwbHkobnVsbCwgYSk7XG59XG5cbi8vIFRoaXMgZnVuY3Rpb24gYWxsb3dzIHlvdSB0byBzZXQgdGhlIHJvdW5kaW5nIGZ1bmN0aW9uIGZvciByZWxhdGl2ZSB0aW1lIHN0cmluZ3NcbmZ1bmN0aW9uIGdldFNldFJlbGF0aXZlVGltZVJvdW5kaW5nIChyb3VuZGluZ0Z1bmN0aW9uKSB7XG4gICAgaWYgKHJvdW5kaW5nRnVuY3Rpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gcm91bmQ7XG4gICAgfVxuICAgIGlmICh0eXBlb2Yocm91bmRpbmdGdW5jdGlvbikgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcm91bmQgPSByb3VuZGluZ0Z1bmN0aW9uO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG4vLyBUaGlzIGZ1bmN0aW9uIGFsbG93cyB5b3UgdG8gc2V0IGEgdGhyZXNob2xkIGZvciByZWxhdGl2ZSB0aW1lIHN0cmluZ3NcbmZ1bmN0aW9uIGdldFNldFJlbGF0aXZlVGltZVRocmVzaG9sZCAodGhyZXNob2xkLCBsaW1pdCkge1xuICAgIGlmICh0aHJlc2hvbGRzW3RocmVzaG9sZF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmIChsaW1pdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB0aHJlc2hvbGRzW3RocmVzaG9sZF07XG4gICAgfVxuICAgIHRocmVzaG9sZHNbdGhyZXNob2xkXSA9IGxpbWl0O1xuICAgIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBodW1hbml6ZSAod2l0aFN1ZmZpeCkge1xuICAgIHZhciBsb2NhbGUgPSB0aGlzLmxvY2FsZURhdGEoKTtcbiAgICB2YXIgb3V0cHV0ID0gcmVsYXRpdmVUaW1lJDEodGhpcywgIXdpdGhTdWZmaXgsIGxvY2FsZSk7XG5cbiAgICBpZiAod2l0aFN1ZmZpeCkge1xuICAgICAgICBvdXRwdXQgPSBsb2NhbGUucGFzdEZ1dHVyZSgrdGhpcywgb3V0cHV0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gbG9jYWxlLnBvc3Rmb3JtYXQob3V0cHV0KTtcbn1cblxudmFyIGFicyQxID0gTWF0aC5hYnM7XG5cbmZ1bmN0aW9uIHRvSVNPU3RyaW5nJDEoKSB7XG4gICAgLy8gZm9yIElTTyBzdHJpbmdzIHdlIGRvIG5vdCB1c2UgdGhlIG5vcm1hbCBidWJibGluZyBydWxlczpcbiAgICAvLyAgKiBtaWxsaXNlY29uZHMgYnViYmxlIHVwIHVudGlsIHRoZXkgYmVjb21lIGhvdXJzXG4gICAgLy8gICogZGF5cyBkbyBub3QgYnViYmxlIGF0IGFsbFxuICAgIC8vICAqIG1vbnRocyBidWJibGUgdXAgdW50aWwgdGhleSBiZWNvbWUgeWVhcnNcbiAgICAvLyBUaGlzIGlzIGJlY2F1c2UgdGhlcmUgaXMgbm8gY29udGV4dC1mcmVlIGNvbnZlcnNpb24gYmV0d2VlbiBob3VycyBhbmQgZGF5c1xuICAgIC8vICh0aGluayBvZiBjbG9jayBjaGFuZ2VzKVxuICAgIC8vIGFuZCBhbHNvIG5vdCBiZXR3ZWVuIGRheXMgYW5kIG1vbnRocyAoMjgtMzEgZGF5cyBwZXIgbW9udGgpXG4gICAgdmFyIHNlY29uZHMgPSBhYnMkMSh0aGlzLl9taWxsaXNlY29uZHMpIC8gMTAwMDtcbiAgICB2YXIgZGF5cyAgICAgICAgID0gYWJzJDEodGhpcy5fZGF5cyk7XG4gICAgdmFyIG1vbnRocyAgICAgICA9IGFicyQxKHRoaXMuX21vbnRocyk7XG4gICAgdmFyIG1pbnV0ZXMsIGhvdXJzLCB5ZWFycztcblxuICAgIC8vIDM2MDAgc2Vjb25kcyAtPiA2MCBtaW51dGVzIC0+IDEgaG91clxuICAgIG1pbnV0ZXMgICAgICAgICAgID0gYWJzRmxvb3Ioc2Vjb25kcyAvIDYwKTtcbiAgICBob3VycyAgICAgICAgICAgICA9IGFic0Zsb29yKG1pbnV0ZXMgLyA2MCk7XG4gICAgc2Vjb25kcyAlPSA2MDtcbiAgICBtaW51dGVzICU9IDYwO1xuXG4gICAgLy8gMTIgbW9udGhzIC0+IDEgeWVhclxuICAgIHllYXJzICA9IGFic0Zsb29yKG1vbnRocyAvIDEyKTtcbiAgICBtb250aHMgJT0gMTI7XG5cblxuICAgIC8vIGluc3BpcmVkIGJ5IGh0dHBzOi8vZ2l0aHViLmNvbS9kb3JkaWxsZS9tb21lbnQtaXNvZHVyYXRpb24vYmxvYi9tYXN0ZXIvbW9tZW50Lmlzb2R1cmF0aW9uLmpzXG4gICAgdmFyIFkgPSB5ZWFycztcbiAgICB2YXIgTSA9IG1vbnRocztcbiAgICB2YXIgRCA9IGRheXM7XG4gICAgdmFyIGggPSBob3VycztcbiAgICB2YXIgbSA9IG1pbnV0ZXM7XG4gICAgdmFyIHMgPSBzZWNvbmRzO1xuICAgIHZhciB0b3RhbCA9IHRoaXMuYXNTZWNvbmRzKCk7XG5cbiAgICBpZiAoIXRvdGFsKSB7XG4gICAgICAgIC8vIHRoaXMgaXMgdGhlIHNhbWUgYXMgQyMncyAoTm9kYSkgYW5kIHB5dGhvbiAoaXNvZGF0ZSkuLi5cbiAgICAgICAgLy8gYnV0IG5vdCBvdGhlciBKUyAoZ29vZy5kYXRlKVxuICAgICAgICByZXR1cm4gJ1AwRCc7XG4gICAgfVxuXG4gICAgcmV0dXJuICh0b3RhbCA8IDAgPyAnLScgOiAnJykgK1xuICAgICAgICAnUCcgK1xuICAgICAgICAoWSA/IFkgKyAnWScgOiAnJykgK1xuICAgICAgICAoTSA/IE0gKyAnTScgOiAnJykgK1xuICAgICAgICAoRCA/IEQgKyAnRCcgOiAnJykgK1xuICAgICAgICAoKGggfHwgbSB8fCBzKSA/ICdUJyA6ICcnKSArXG4gICAgICAgIChoID8gaCArICdIJyA6ICcnKSArXG4gICAgICAgIChtID8gbSArICdNJyA6ICcnKSArXG4gICAgICAgIChzID8gcyArICdTJyA6ICcnKTtcbn1cblxudmFyIHByb3RvJDIgPSBEdXJhdGlvbi5wcm90b3R5cGU7XG5cbnByb3RvJDIuYWJzICAgICAgICAgICAgPSBhYnM7XG5wcm90byQyLmFkZCAgICAgICAgICAgID0gYWRkJDE7XG5wcm90byQyLnN1YnRyYWN0ICAgICAgID0gc3VidHJhY3QkMTtcbnByb3RvJDIuYXMgICAgICAgICAgICAgPSBhcztcbnByb3RvJDIuYXNNaWxsaXNlY29uZHMgPSBhc01pbGxpc2Vjb25kcztcbnByb3RvJDIuYXNTZWNvbmRzICAgICAgPSBhc1NlY29uZHM7XG5wcm90byQyLmFzTWludXRlcyAgICAgID0gYXNNaW51dGVzO1xucHJvdG8kMi5hc0hvdXJzICAgICAgICA9IGFzSG91cnM7XG5wcm90byQyLmFzRGF5cyAgICAgICAgID0gYXNEYXlzO1xucHJvdG8kMi5hc1dlZWtzICAgICAgICA9IGFzV2Vla3M7XG5wcm90byQyLmFzTW9udGhzICAgICAgID0gYXNNb250aHM7XG5wcm90byQyLmFzWWVhcnMgICAgICAgID0gYXNZZWFycztcbnByb3RvJDIudmFsdWVPZiAgICAgICAgPSB2YWx1ZU9mJDE7XG5wcm90byQyLl9idWJibGUgICAgICAgID0gYnViYmxlO1xucHJvdG8kMi5nZXQgICAgICAgICAgICA9IGdldCQyO1xucHJvdG8kMi5taWxsaXNlY29uZHMgICA9IG1pbGxpc2Vjb25kcztcbnByb3RvJDIuc2Vjb25kcyAgICAgICAgPSBzZWNvbmRzO1xucHJvdG8kMi5taW51dGVzICAgICAgICA9IG1pbnV0ZXM7XG5wcm90byQyLmhvdXJzICAgICAgICAgID0gaG91cnM7XG5wcm90byQyLmRheXMgICAgICAgICAgID0gZGF5cztcbnByb3RvJDIud2Vla3MgICAgICAgICAgPSB3ZWVrcztcbnByb3RvJDIubW9udGhzICAgICAgICAgPSBtb250aHM7XG5wcm90byQyLnllYXJzICAgICAgICAgID0geWVhcnM7XG5wcm90byQyLmh1bWFuaXplICAgICAgID0gaHVtYW5pemU7XG5wcm90byQyLnRvSVNPU3RyaW5nICAgID0gdG9JU09TdHJpbmckMTtcbnByb3RvJDIudG9TdHJpbmcgICAgICAgPSB0b0lTT1N0cmluZyQxO1xucHJvdG8kMi50b0pTT04gICAgICAgICA9IHRvSVNPU3RyaW5nJDE7XG5wcm90byQyLmxvY2FsZSAgICAgICAgID0gbG9jYWxlO1xucHJvdG8kMi5sb2NhbGVEYXRhICAgICA9IGxvY2FsZURhdGE7XG5cbi8vIERlcHJlY2F0aW9uc1xucHJvdG8kMi50b0lzb1N0cmluZyA9IGRlcHJlY2F0ZSgndG9Jc29TdHJpbmcoKSBpcyBkZXByZWNhdGVkLiBQbGVhc2UgdXNlIHRvSVNPU3RyaW5nKCkgaW5zdGVhZCAobm90aWNlIHRoZSBjYXBpdGFscyknLCB0b0lTT1N0cmluZyQxKTtcbnByb3RvJDIubGFuZyA9IGxhbmc7XG5cbi8vIFNpZGUgZWZmZWN0IGltcG9ydHNcblxuLy8gRk9STUFUVElOR1xuXG5hZGRGb3JtYXRUb2tlbignWCcsIDAsIDAsICd1bml4Jyk7XG5hZGRGb3JtYXRUb2tlbigneCcsIDAsIDAsICd2YWx1ZU9mJyk7XG5cbi8vIFBBUlNJTkdcblxuYWRkUmVnZXhUb2tlbigneCcsIG1hdGNoU2lnbmVkKTtcbmFkZFJlZ2V4VG9rZW4oJ1gnLCBtYXRjaFRpbWVzdGFtcCk7XG5hZGRQYXJzZVRva2VuKCdYJywgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnKSB7XG4gICAgY29uZmlnLl9kID0gbmV3IERhdGUocGFyc2VGbG9hdChpbnB1dCwgMTApICogMTAwMCk7XG59KTtcbmFkZFBhcnNlVG9rZW4oJ3gnLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5LCBjb25maWcpIHtcbiAgICBjb25maWcuX2QgPSBuZXcgRGF0ZSh0b0ludChpbnB1dCkpO1xufSk7XG5cbi8vIFNpZGUgZWZmZWN0IGltcG9ydHNcblxuXG5ob29rcy52ZXJzaW9uID0gJzIuMTcuMSc7XG5cbnNldEhvb2tDYWxsYmFjayhjcmVhdGVMb2NhbCk7XG5cbmhvb2tzLmZuICAgICAgICAgICAgICAgICAgICA9IHByb3RvO1xuaG9va3MubWluICAgICAgICAgICAgICAgICAgID0gbWluO1xuaG9va3MubWF4ICAgICAgICAgICAgICAgICAgID0gbWF4O1xuaG9va3Mubm93ICAgICAgICAgICAgICAgICAgID0gbm93O1xuaG9va3MudXRjICAgICAgICAgICAgICAgICAgID0gY3JlYXRlVVRDO1xuaG9va3MudW5peCAgICAgICAgICAgICAgICAgID0gY3JlYXRlVW5peDtcbmhvb2tzLm1vbnRocyAgICAgICAgICAgICAgICA9IGxpc3RNb250aHM7XG5ob29rcy5pc0RhdGUgICAgICAgICAgICAgICAgPSBpc0RhdGU7XG5ob29rcy5sb2NhbGUgICAgICAgICAgICAgICAgPSBnZXRTZXRHbG9iYWxMb2NhbGU7XG5ob29rcy5pbnZhbGlkICAgICAgICAgICAgICAgPSBjcmVhdGVJbnZhbGlkO1xuaG9va3MuZHVyYXRpb24gICAgICAgICAgICAgID0gY3JlYXRlRHVyYXRpb247XG5ob29rcy5pc01vbWVudCAgICAgICAgICAgICAgPSBpc01vbWVudDtcbmhvb2tzLndlZWtkYXlzICAgICAgICAgICAgICA9IGxpc3RXZWVrZGF5cztcbmhvb2tzLnBhcnNlWm9uZSAgICAgICAgICAgICA9IGNyZWF0ZUluWm9uZTtcbmhvb2tzLmxvY2FsZURhdGEgICAgICAgICAgICA9IGdldExvY2FsZTtcbmhvb2tzLmlzRHVyYXRpb24gICAgICAgICAgICA9IGlzRHVyYXRpb247XG5ob29rcy5tb250aHNTaG9ydCAgICAgICAgICAgPSBsaXN0TW9udGhzU2hvcnQ7XG5ob29rcy53ZWVrZGF5c01pbiAgICAgICAgICAgPSBsaXN0V2Vla2RheXNNaW47XG5ob29rcy5kZWZpbmVMb2NhbGUgICAgICAgICAgPSBkZWZpbmVMb2NhbGU7XG5ob29rcy51cGRhdGVMb2NhbGUgICAgICAgICAgPSB1cGRhdGVMb2NhbGU7XG5ob29rcy5sb2NhbGVzICAgICAgICAgICAgICAgPSBsaXN0TG9jYWxlcztcbmhvb2tzLndlZWtkYXlzU2hvcnQgICAgICAgICA9IGxpc3RXZWVrZGF5c1Nob3J0O1xuaG9va3Mubm9ybWFsaXplVW5pdHMgICAgICAgID0gbm9ybWFsaXplVW5pdHM7XG5ob29rcy5yZWxhdGl2ZVRpbWVSb3VuZGluZyA9IGdldFNldFJlbGF0aXZlVGltZVJvdW5kaW5nO1xuaG9va3MucmVsYXRpdmVUaW1lVGhyZXNob2xkID0gZ2V0U2V0UmVsYXRpdmVUaW1lVGhyZXNob2xkO1xuaG9va3MuY2FsZW5kYXJGb3JtYXQgICAgICAgID0gZ2V0Q2FsZW5kYXJGb3JtYXQ7XG5ob29rcy5wcm90b3R5cGUgICAgICAgICAgICAgPSBwcm90bztcblxucmV0dXJuIGhvb2tzO1xuXG59KSkpO1xuIiwiKGZ1bmN0aW9uKHNlbGYpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGlmIChzZWxmLmZldGNoKSB7XG4gICAgcmV0dXJuXG4gIH1cblxuICB2YXIgc3VwcG9ydCA9IHtcbiAgICBzZWFyY2hQYXJhbXM6ICdVUkxTZWFyY2hQYXJhbXMnIGluIHNlbGYsXG4gICAgaXRlcmFibGU6ICdTeW1ib2wnIGluIHNlbGYgJiYgJ2l0ZXJhdG9yJyBpbiBTeW1ib2wsXG4gICAgYmxvYjogJ0ZpbGVSZWFkZXInIGluIHNlbGYgJiYgJ0Jsb2InIGluIHNlbGYgJiYgKGZ1bmN0aW9uKCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgbmV3IEJsb2IoKVxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgIH0pKCksXG4gICAgZm9ybURhdGE6ICdGb3JtRGF0YScgaW4gc2VsZixcbiAgICBhcnJheUJ1ZmZlcjogJ0FycmF5QnVmZmVyJyBpbiBzZWxmXG4gIH1cblxuICBpZiAoc3VwcG9ydC5hcnJheUJ1ZmZlcikge1xuICAgIHZhciB2aWV3Q2xhc3NlcyA9IFtcbiAgICAgICdbb2JqZWN0IEludDhBcnJheV0nLFxuICAgICAgJ1tvYmplY3QgVWludDhBcnJheV0nLFxuICAgICAgJ1tvYmplY3QgVWludDhDbGFtcGVkQXJyYXldJyxcbiAgICAgICdbb2JqZWN0IEludDE2QXJyYXldJyxcbiAgICAgICdbb2JqZWN0IFVpbnQxNkFycmF5XScsXG4gICAgICAnW29iamVjdCBJbnQzMkFycmF5XScsXG4gICAgICAnW29iamVjdCBVaW50MzJBcnJheV0nLFxuICAgICAgJ1tvYmplY3QgRmxvYXQzMkFycmF5XScsXG4gICAgICAnW29iamVjdCBGbG9hdDY0QXJyYXldJ1xuICAgIF1cblxuICAgIHZhciBpc0RhdGFWaWV3ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gb2JqICYmIERhdGFWaWV3LnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKG9iailcbiAgICB9XG5cbiAgICB2YXIgaXNBcnJheUJ1ZmZlclZpZXcgPSBBcnJheUJ1ZmZlci5pc1ZpZXcgfHwgZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gb2JqICYmIHZpZXdDbGFzc2VzLmluZGV4T2YoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikpID4gLTFcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBub3JtYWxpemVOYW1lKG5hbWUpIHtcbiAgICBpZiAodHlwZW9mIG5hbWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICBuYW1lID0gU3RyaW5nKG5hbWUpXG4gICAgfVxuICAgIGlmICgvW15hLXowLTlcXC0jJCUmJyorLlxcXl9gfH5dL2kudGVzdChuYW1lKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBjaGFyYWN0ZXIgaW4gaGVhZGVyIGZpZWxkIG5hbWUnKVxuICAgIH1cbiAgICByZXR1cm4gbmFtZS50b0xvd2VyQ2FzZSgpXG4gIH1cblxuICBmdW5jdGlvbiBub3JtYWxpemVWYWx1ZSh2YWx1ZSkge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICB2YWx1ZSA9IFN0cmluZyh2YWx1ZSlcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlXG4gIH1cblxuICAvLyBCdWlsZCBhIGRlc3RydWN0aXZlIGl0ZXJhdG9yIGZvciB0aGUgdmFsdWUgbGlzdFxuICBmdW5jdGlvbiBpdGVyYXRvckZvcihpdGVtcykge1xuICAgIHZhciBpdGVyYXRvciA9IHtcbiAgICAgIG5leHQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdmFsdWUgPSBpdGVtcy5zaGlmdCgpXG4gICAgICAgIHJldHVybiB7ZG9uZTogdmFsdWUgPT09IHVuZGVmaW5lZCwgdmFsdWU6IHZhbHVlfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzdXBwb3J0Lml0ZXJhYmxlKSB7XG4gICAgICBpdGVyYXRvcltTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBpdGVyYXRvclxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBpdGVyYXRvclxuICB9XG5cbiAgZnVuY3Rpb24gSGVhZGVycyhoZWFkZXJzKSB7XG4gICAgdGhpcy5tYXAgPSB7fVxuXG4gICAgaWYgKGhlYWRlcnMgaW5zdGFuY2VvZiBIZWFkZXJzKSB7XG4gICAgICBoZWFkZXJzLmZvckVhY2goZnVuY3Rpb24odmFsdWUsIG5hbWUpIHtcbiAgICAgICAgdGhpcy5hcHBlbmQobmFtZSwgdmFsdWUpXG4gICAgICB9LCB0aGlzKVxuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShoZWFkZXJzKSkge1xuICAgICAgaGVhZGVycy5mb3JFYWNoKGZ1bmN0aW9uKGhlYWRlcikge1xuICAgICAgICB0aGlzLmFwcGVuZChoZWFkZXJbMF0sIGhlYWRlclsxXSlcbiAgICAgIH0sIHRoaXMpXG4gICAgfSBlbHNlIGlmIChoZWFkZXJzKSB7XG4gICAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhoZWFkZXJzKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgdGhpcy5hcHBlbmQobmFtZSwgaGVhZGVyc1tuYW1lXSlcbiAgICAgIH0sIHRoaXMpXG4gICAgfVxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGUuYXBwZW5kID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcbiAgICBuYW1lID0gbm9ybWFsaXplTmFtZShuYW1lKVxuICAgIHZhbHVlID0gbm9ybWFsaXplVmFsdWUodmFsdWUpXG4gICAgdmFyIG9sZFZhbHVlID0gdGhpcy5tYXBbbmFtZV1cbiAgICB0aGlzLm1hcFtuYW1lXSA9IG9sZFZhbHVlID8gb2xkVmFsdWUrJywnK3ZhbHVlIDogdmFsdWVcbiAgfVxuXG4gIEhlYWRlcnMucHJvdG90eXBlWydkZWxldGUnXSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBkZWxldGUgdGhpcy5tYXBbbm9ybWFsaXplTmFtZShuYW1lKV1cbiAgfVxuXG4gIEhlYWRlcnMucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBuYW1lID0gbm9ybWFsaXplTmFtZShuYW1lKVxuICAgIHJldHVybiB0aGlzLmhhcyhuYW1lKSA/IHRoaXMubWFwW25hbWVdIDogbnVsbFxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGUuaGFzID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHJldHVybiB0aGlzLm1hcC5oYXNPd25Qcm9wZXJ0eShub3JtYWxpemVOYW1lKG5hbWUpKVxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcbiAgICB0aGlzLm1hcFtub3JtYWxpemVOYW1lKG5hbWUpXSA9IG5vcm1hbGl6ZVZhbHVlKHZhbHVlKVxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uKGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgZm9yICh2YXIgbmFtZSBpbiB0aGlzLm1hcCkge1xuICAgICAgaWYgKHRoaXMubWFwLmhhc093blByb3BlcnR5KG5hbWUpKSB7XG4gICAgICAgIGNhbGxiYWNrLmNhbGwodGhpc0FyZywgdGhpcy5tYXBbbmFtZV0sIG5hbWUsIHRoaXMpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGUua2V5cyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpdGVtcyA9IFtdXG4gICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlLCBuYW1lKSB7IGl0ZW1zLnB1c2gobmFtZSkgfSlcbiAgICByZXR1cm4gaXRlcmF0b3JGb3IoaXRlbXMpXG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZS52YWx1ZXMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaXRlbXMgPSBbXVxuICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSkgeyBpdGVtcy5wdXNoKHZhbHVlKSB9KVxuICAgIHJldHVybiBpdGVyYXRvckZvcihpdGVtcylcbiAgfVxuXG4gIEhlYWRlcnMucHJvdG90eXBlLmVudHJpZXMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaXRlbXMgPSBbXVxuICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSwgbmFtZSkgeyBpdGVtcy5wdXNoKFtuYW1lLCB2YWx1ZV0pIH0pXG4gICAgcmV0dXJuIGl0ZXJhdG9yRm9yKGl0ZW1zKVxuICB9XG5cbiAgaWYgKHN1cHBvcnQuaXRlcmFibGUpIHtcbiAgICBIZWFkZXJzLnByb3RvdHlwZVtTeW1ib2wuaXRlcmF0b3JdID0gSGVhZGVycy5wcm90b3R5cGUuZW50cmllc1xuICB9XG5cbiAgZnVuY3Rpb24gY29uc3VtZWQoYm9keSkge1xuICAgIGlmIChib2R5LmJvZHlVc2VkKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IFR5cGVFcnJvcignQWxyZWFkeSByZWFkJykpXG4gICAgfVxuICAgIGJvZHkuYm9keVVzZWQgPSB0cnVlXG4gIH1cblxuICBmdW5jdGlvbiBmaWxlUmVhZGVyUmVhZHkocmVhZGVyKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXNvbHZlKHJlYWRlci5yZXN1bHQpXG4gICAgICB9XG4gICAgICByZWFkZXIub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZWplY3QocmVhZGVyLmVycm9yKVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiByZWFkQmxvYkFzQXJyYXlCdWZmZXIoYmxvYikge1xuICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpXG4gICAgdmFyIHByb21pc2UgPSBmaWxlUmVhZGVyUmVhZHkocmVhZGVyKVxuICAgIHJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcihibG9iKVxuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICBmdW5jdGlvbiByZWFkQmxvYkFzVGV4dChibG9iKSB7XG4gICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKClcbiAgICB2YXIgcHJvbWlzZSA9IGZpbGVSZWFkZXJSZWFkeShyZWFkZXIpXG4gICAgcmVhZGVyLnJlYWRBc1RleHQoYmxvYilcbiAgICByZXR1cm4gcHJvbWlzZVxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZEFycmF5QnVmZmVyQXNUZXh0KGJ1Zikge1xuICAgIHZhciB2aWV3ID0gbmV3IFVpbnQ4QXJyYXkoYnVmKVxuICAgIHZhciBjaGFycyA9IG5ldyBBcnJheSh2aWV3Lmxlbmd0aClcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmlldy5sZW5ndGg7IGkrKykge1xuICAgICAgY2hhcnNbaV0gPSBTdHJpbmcuZnJvbUNoYXJDb2RlKHZpZXdbaV0pXG4gICAgfVxuICAgIHJldHVybiBjaGFycy5qb2luKCcnKVxuICB9XG5cbiAgZnVuY3Rpb24gYnVmZmVyQ2xvbmUoYnVmKSB7XG4gICAgaWYgKGJ1Zi5zbGljZSkge1xuICAgICAgcmV0dXJuIGJ1Zi5zbGljZSgwKVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgdmlldyA9IG5ldyBVaW50OEFycmF5KGJ1Zi5ieXRlTGVuZ3RoKVxuICAgICAgdmlldy5zZXQobmV3IFVpbnQ4QXJyYXkoYnVmKSlcbiAgICAgIHJldHVybiB2aWV3LmJ1ZmZlclxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIEJvZHkoKSB7XG4gICAgdGhpcy5ib2R5VXNlZCA9IGZhbHNlXG5cbiAgICB0aGlzLl9pbml0Qm9keSA9IGZ1bmN0aW9uKGJvZHkpIHtcbiAgICAgIHRoaXMuX2JvZHlJbml0ID0gYm9keVxuICAgICAgaWYgKCFib2R5KSB7XG4gICAgICAgIHRoaXMuX2JvZHlUZXh0ID0gJydcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGJvZHkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRoaXMuX2JvZHlUZXh0ID0gYm9keVxuICAgICAgfSBlbHNlIGlmIChzdXBwb3J0LmJsb2IgJiYgQmxvYi5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihib2R5KSkge1xuICAgICAgICB0aGlzLl9ib2R5QmxvYiA9IGJvZHlcbiAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5mb3JtRGF0YSAmJiBGb3JtRGF0YS5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihib2R5KSkge1xuICAgICAgICB0aGlzLl9ib2R5Rm9ybURhdGEgPSBib2R5XG4gICAgICB9IGVsc2UgaWYgKHN1cHBvcnQuc2VhcmNoUGFyYW1zICYmIFVSTFNlYXJjaFBhcmFtcy5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihib2R5KSkge1xuICAgICAgICB0aGlzLl9ib2R5VGV4dCA9IGJvZHkudG9TdHJpbmcoKVxuICAgICAgfSBlbHNlIGlmIChzdXBwb3J0LmFycmF5QnVmZmVyICYmIHN1cHBvcnQuYmxvYiAmJiBpc0RhdGFWaWV3KGJvZHkpKSB7XG4gICAgICAgIHRoaXMuX2JvZHlBcnJheUJ1ZmZlciA9IGJ1ZmZlckNsb25lKGJvZHkuYnVmZmVyKVxuICAgICAgICAvLyBJRSAxMC0xMSBjYW4ndCBoYW5kbGUgYSBEYXRhVmlldyBib2R5LlxuICAgICAgICB0aGlzLl9ib2R5SW5pdCA9IG5ldyBCbG9iKFt0aGlzLl9ib2R5QXJyYXlCdWZmZXJdKVxuICAgICAgfSBlbHNlIGlmIChzdXBwb3J0LmFycmF5QnVmZmVyICYmIChBcnJheUJ1ZmZlci5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihib2R5KSB8fCBpc0FycmF5QnVmZmVyVmlldyhib2R5KSkpIHtcbiAgICAgICAgdGhpcy5fYm9keUFycmF5QnVmZmVyID0gYnVmZmVyQ2xvbmUoYm9keSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcigndW5zdXBwb3J0ZWQgQm9keUluaXQgdHlwZScpXG4gICAgICB9XG5cbiAgICAgIGlmICghdGhpcy5oZWFkZXJzLmdldCgnY29udGVudC10eXBlJykpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBib2R5ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIHRoaXMuaGVhZGVycy5zZXQoJ2NvbnRlbnQtdHlwZScsICd0ZXh0L3BsYWluO2NoYXJzZXQ9VVRGLTgnKVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2JvZHlCbG9iICYmIHRoaXMuX2JvZHlCbG9iLnR5cGUpIHtcbiAgICAgICAgICB0aGlzLmhlYWRlcnMuc2V0KCdjb250ZW50LXR5cGUnLCB0aGlzLl9ib2R5QmxvYi50eXBlKVxuICAgICAgICB9IGVsc2UgaWYgKHN1cHBvcnQuc2VhcmNoUGFyYW1zICYmIFVSTFNlYXJjaFBhcmFtcy5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihib2R5KSkge1xuICAgICAgICAgIHRoaXMuaGVhZGVycy5zZXQoJ2NvbnRlbnQtdHlwZScsICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQ7Y2hhcnNldD1VVEYtOCcpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoc3VwcG9ydC5ibG9iKSB7XG4gICAgICB0aGlzLmJsb2IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHJlamVjdGVkID0gY29uc3VtZWQodGhpcylcbiAgICAgICAgaWYgKHJlamVjdGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHJlamVjdGVkXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5fYm9keUJsb2IpIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuX2JvZHlCbG9iKVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2JvZHlBcnJheUJ1ZmZlcikge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IEJsb2IoW3RoaXMuX2JvZHlBcnJheUJ1ZmZlcl0pKVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2JvZHlGb3JtRGF0YSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY291bGQgbm90IHJlYWQgRm9ybURhdGEgYm9keSBhcyBibG9iJylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG5ldyBCbG9iKFt0aGlzLl9ib2R5VGV4dF0pKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRoaXMuYXJyYXlCdWZmZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuX2JvZHlBcnJheUJ1ZmZlcikge1xuICAgICAgICAgIHJldHVybiBjb25zdW1lZCh0aGlzKSB8fCBQcm9taXNlLnJlc29sdmUodGhpcy5fYm9keUFycmF5QnVmZmVyKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0aGlzLmJsb2IoKS50aGVuKHJlYWRCbG9iQXNBcnJheUJ1ZmZlcilcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMudGV4dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHJlamVjdGVkID0gY29uc3VtZWQodGhpcylcbiAgICAgIGlmIChyZWplY3RlZCkge1xuICAgICAgICByZXR1cm4gcmVqZWN0ZWRcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuX2JvZHlCbG9iKSB7XG4gICAgICAgIHJldHVybiByZWFkQmxvYkFzVGV4dCh0aGlzLl9ib2R5QmxvYilcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUFycmF5QnVmZmVyKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocmVhZEFycmF5QnVmZmVyQXNUZXh0KHRoaXMuX2JvZHlBcnJheUJ1ZmZlcikpXG4gICAgICB9IGVsc2UgaWYgKHRoaXMuX2JvZHlGb3JtRGF0YSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvdWxkIG5vdCByZWFkIEZvcm1EYXRhIGJvZHkgYXMgdGV4dCcpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuX2JvZHlUZXh0KVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzdXBwb3J0LmZvcm1EYXRhKSB7XG4gICAgICB0aGlzLmZvcm1EYXRhID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRleHQoKS50aGVuKGRlY29kZSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmpzb24gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLnRleHQoKS50aGVuKEpTT04ucGFyc2UpXG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8vIEhUVFAgbWV0aG9kcyB3aG9zZSBjYXBpdGFsaXphdGlvbiBzaG91bGQgYmUgbm9ybWFsaXplZFxuICB2YXIgbWV0aG9kcyA9IFsnREVMRVRFJywgJ0dFVCcsICdIRUFEJywgJ09QVElPTlMnLCAnUE9TVCcsICdQVVQnXVxuXG4gIGZ1bmN0aW9uIG5vcm1hbGl6ZU1ldGhvZChtZXRob2QpIHtcbiAgICB2YXIgdXBjYXNlZCA9IG1ldGhvZC50b1VwcGVyQ2FzZSgpXG4gICAgcmV0dXJuIChtZXRob2RzLmluZGV4T2YodXBjYXNlZCkgPiAtMSkgPyB1cGNhc2VkIDogbWV0aG9kXG4gIH1cblxuICBmdW5jdGlvbiBSZXF1ZXN0KGlucHV0LCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cbiAgICB2YXIgYm9keSA9IG9wdGlvbnMuYm9keVxuXG4gICAgaWYgKGlucHV0IGluc3RhbmNlb2YgUmVxdWVzdCkge1xuICAgICAgaWYgKGlucHV0LmJvZHlVc2VkKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FscmVhZHkgcmVhZCcpXG4gICAgICB9XG4gICAgICB0aGlzLnVybCA9IGlucHV0LnVybFxuICAgICAgdGhpcy5jcmVkZW50aWFscyA9IGlucHV0LmNyZWRlbnRpYWxzXG4gICAgICBpZiAoIW9wdGlvbnMuaGVhZGVycykge1xuICAgICAgICB0aGlzLmhlYWRlcnMgPSBuZXcgSGVhZGVycyhpbnB1dC5oZWFkZXJzKVxuICAgICAgfVxuICAgICAgdGhpcy5tZXRob2QgPSBpbnB1dC5tZXRob2RcbiAgICAgIHRoaXMubW9kZSA9IGlucHV0Lm1vZGVcbiAgICAgIGlmICghYm9keSAmJiBpbnB1dC5fYm9keUluaXQgIT0gbnVsbCkge1xuICAgICAgICBib2R5ID0gaW5wdXQuX2JvZHlJbml0XG4gICAgICAgIGlucHV0LmJvZHlVc2VkID0gdHJ1ZVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnVybCA9IFN0cmluZyhpbnB1dClcbiAgICB9XG5cbiAgICB0aGlzLmNyZWRlbnRpYWxzID0gb3B0aW9ucy5jcmVkZW50aWFscyB8fCB0aGlzLmNyZWRlbnRpYWxzIHx8ICdvbWl0J1xuICAgIGlmIChvcHRpb25zLmhlYWRlcnMgfHwgIXRoaXMuaGVhZGVycykge1xuICAgICAgdGhpcy5oZWFkZXJzID0gbmV3IEhlYWRlcnMob3B0aW9ucy5oZWFkZXJzKVxuICAgIH1cbiAgICB0aGlzLm1ldGhvZCA9IG5vcm1hbGl6ZU1ldGhvZChvcHRpb25zLm1ldGhvZCB8fCB0aGlzLm1ldGhvZCB8fCAnR0VUJylcbiAgICB0aGlzLm1vZGUgPSBvcHRpb25zLm1vZGUgfHwgdGhpcy5tb2RlIHx8IG51bGxcbiAgICB0aGlzLnJlZmVycmVyID0gbnVsbFxuXG4gICAgaWYgKCh0aGlzLm1ldGhvZCA9PT0gJ0dFVCcgfHwgdGhpcy5tZXRob2QgPT09ICdIRUFEJykgJiYgYm9keSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQm9keSBub3QgYWxsb3dlZCBmb3IgR0VUIG9yIEhFQUQgcmVxdWVzdHMnKVxuICAgIH1cbiAgICB0aGlzLl9pbml0Qm9keShib2R5KVxuICB9XG5cbiAgUmVxdWVzdC5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFJlcXVlc3QodGhpcywgeyBib2R5OiB0aGlzLl9ib2R5SW5pdCB9KVxuICB9XG5cbiAgZnVuY3Rpb24gZGVjb2RlKGJvZHkpIHtcbiAgICB2YXIgZm9ybSA9IG5ldyBGb3JtRGF0YSgpXG4gICAgYm9keS50cmltKCkuc3BsaXQoJyYnKS5mb3JFYWNoKGZ1bmN0aW9uKGJ5dGVzKSB7XG4gICAgICBpZiAoYnl0ZXMpIHtcbiAgICAgICAgdmFyIHNwbGl0ID0gYnl0ZXMuc3BsaXQoJz0nKVxuICAgICAgICB2YXIgbmFtZSA9IHNwbGl0LnNoaWZ0KCkucmVwbGFjZSgvXFwrL2csICcgJylcbiAgICAgICAgdmFyIHZhbHVlID0gc3BsaXQuam9pbignPScpLnJlcGxhY2UoL1xcKy9nLCAnICcpXG4gICAgICAgIGZvcm0uYXBwZW5kKGRlY29kZVVSSUNvbXBvbmVudChuYW1lKSwgZGVjb2RlVVJJQ29tcG9uZW50KHZhbHVlKSlcbiAgICAgIH1cbiAgICB9KVxuICAgIHJldHVybiBmb3JtXG4gIH1cblxuICBmdW5jdGlvbiBwYXJzZUhlYWRlcnMocmF3SGVhZGVycykge1xuICAgIHZhciBoZWFkZXJzID0gbmV3IEhlYWRlcnMoKVxuICAgIHJhd0hlYWRlcnMuc3BsaXQoL1xccj9cXG4vKS5mb3JFYWNoKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgIHZhciBwYXJ0cyA9IGxpbmUuc3BsaXQoJzonKVxuICAgICAgdmFyIGtleSA9IHBhcnRzLnNoaWZ0KCkudHJpbSgpXG4gICAgICBpZiAoa2V5KSB7XG4gICAgICAgIHZhciB2YWx1ZSA9IHBhcnRzLmpvaW4oJzonKS50cmltKClcbiAgICAgICAgaGVhZGVycy5hcHBlbmQoa2V5LCB2YWx1ZSlcbiAgICAgIH1cbiAgICB9KVxuICAgIHJldHVybiBoZWFkZXJzXG4gIH1cblxuICBCb2R5LmNhbGwoUmVxdWVzdC5wcm90b3R5cGUpXG5cbiAgZnVuY3Rpb24gUmVzcG9uc2UoYm9keUluaXQsIG9wdGlvbnMpIHtcbiAgICBpZiAoIW9wdGlvbnMpIHtcbiAgICAgIG9wdGlvbnMgPSB7fVxuICAgIH1cblxuICAgIHRoaXMudHlwZSA9ICdkZWZhdWx0J1xuICAgIHRoaXMuc3RhdHVzID0gJ3N0YXR1cycgaW4gb3B0aW9ucyA/IG9wdGlvbnMuc3RhdHVzIDogMjAwXG4gICAgdGhpcy5vayA9IHRoaXMuc3RhdHVzID49IDIwMCAmJiB0aGlzLnN0YXR1cyA8IDMwMFxuICAgIHRoaXMuc3RhdHVzVGV4dCA9ICdzdGF0dXNUZXh0JyBpbiBvcHRpb25zID8gb3B0aW9ucy5zdGF0dXNUZXh0IDogJ09LJ1xuICAgIHRoaXMuaGVhZGVycyA9IG5ldyBIZWFkZXJzKG9wdGlvbnMuaGVhZGVycylcbiAgICB0aGlzLnVybCA9IG9wdGlvbnMudXJsIHx8ICcnXG4gICAgdGhpcy5faW5pdEJvZHkoYm9keUluaXQpXG4gIH1cblxuICBCb2R5LmNhbGwoUmVzcG9uc2UucHJvdG90eXBlKVxuXG4gIFJlc3BvbnNlLnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgUmVzcG9uc2UodGhpcy5fYm9keUluaXQsIHtcbiAgICAgIHN0YXR1czogdGhpcy5zdGF0dXMsXG4gICAgICBzdGF0dXNUZXh0OiB0aGlzLnN0YXR1c1RleHQsXG4gICAgICBoZWFkZXJzOiBuZXcgSGVhZGVycyh0aGlzLmhlYWRlcnMpLFxuICAgICAgdXJsOiB0aGlzLnVybFxuICAgIH0pXG4gIH1cblxuICBSZXNwb25zZS5lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciByZXNwb25zZSA9IG5ldyBSZXNwb25zZShudWxsLCB7c3RhdHVzOiAwLCBzdGF0dXNUZXh0OiAnJ30pXG4gICAgcmVzcG9uc2UudHlwZSA9ICdlcnJvcidcbiAgICByZXR1cm4gcmVzcG9uc2VcbiAgfVxuXG4gIHZhciByZWRpcmVjdFN0YXR1c2VzID0gWzMwMSwgMzAyLCAzMDMsIDMwNywgMzA4XVxuXG4gIFJlc3BvbnNlLnJlZGlyZWN0ID0gZnVuY3Rpb24odXJsLCBzdGF0dXMpIHtcbiAgICBpZiAocmVkaXJlY3RTdGF0dXNlcy5pbmRleE9mKHN0YXR1cykgPT09IC0xKSB7XG4gICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW52YWxpZCBzdGF0dXMgY29kZScpXG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBSZXNwb25zZShudWxsLCB7c3RhdHVzOiBzdGF0dXMsIGhlYWRlcnM6IHtsb2NhdGlvbjogdXJsfX0pXG4gIH1cblxuICBzZWxmLkhlYWRlcnMgPSBIZWFkZXJzXG4gIHNlbGYuUmVxdWVzdCA9IFJlcXVlc3RcbiAgc2VsZi5SZXNwb25zZSA9IFJlc3BvbnNlXG5cbiAgc2VsZi5mZXRjaCA9IGZ1bmN0aW9uKGlucHV0LCBpbml0KSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgdmFyIHJlcXVlc3QgPSBuZXcgUmVxdWVzdChpbnB1dCwgaW5pdClcbiAgICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKVxuXG4gICAgICB4aHIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgICAgIHN0YXR1czogeGhyLnN0YXR1cyxcbiAgICAgICAgICBzdGF0dXNUZXh0OiB4aHIuc3RhdHVzVGV4dCxcbiAgICAgICAgICBoZWFkZXJzOiBwYXJzZUhlYWRlcnMoeGhyLmdldEFsbFJlc3BvbnNlSGVhZGVycygpIHx8ICcnKVxuICAgICAgICB9XG4gICAgICAgIG9wdGlvbnMudXJsID0gJ3Jlc3BvbnNlVVJMJyBpbiB4aHIgPyB4aHIucmVzcG9uc2VVUkwgOiBvcHRpb25zLmhlYWRlcnMuZ2V0KCdYLVJlcXVlc3QtVVJMJylcbiAgICAgICAgdmFyIGJvZHkgPSAncmVzcG9uc2UnIGluIHhociA/IHhoci5yZXNwb25zZSA6IHhoci5yZXNwb25zZVRleHRcbiAgICAgICAgcmVzb2x2ZShuZXcgUmVzcG9uc2UoYm9keSwgb3B0aW9ucykpXG4gICAgICB9XG5cbiAgICAgIHhoci5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlamVjdChuZXcgVHlwZUVycm9yKCdOZXR3b3JrIHJlcXVlc3QgZmFpbGVkJykpXG4gICAgICB9XG5cbiAgICAgIHhoci5vbnRpbWVvdXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVqZWN0KG5ldyBUeXBlRXJyb3IoJ05ldHdvcmsgcmVxdWVzdCBmYWlsZWQnKSlcbiAgICAgIH1cblxuICAgICAgeGhyLm9wZW4ocmVxdWVzdC5tZXRob2QsIHJlcXVlc3QudXJsLCB0cnVlKVxuXG4gICAgICBpZiAocmVxdWVzdC5jcmVkZW50aWFscyA9PT0gJ2luY2x1ZGUnKSB7XG4gICAgICAgIHhoci53aXRoQ3JlZGVudGlhbHMgPSB0cnVlXG4gICAgICB9XG5cbiAgICAgIGlmICgncmVzcG9uc2VUeXBlJyBpbiB4aHIgJiYgc3VwcG9ydC5ibG9iKSB7XG4gICAgICAgIHhoci5yZXNwb25zZVR5cGUgPSAnYmxvYidcbiAgICAgIH1cblxuICAgICAgcmVxdWVzdC5oZWFkZXJzLmZvckVhY2goZnVuY3Rpb24odmFsdWUsIG5hbWUpIHtcbiAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIobmFtZSwgdmFsdWUpXG4gICAgICB9KVxuXG4gICAgICB4aHIuc2VuZCh0eXBlb2YgcmVxdWVzdC5fYm9keUluaXQgPT09ICd1bmRlZmluZWQnID8gbnVsbCA6IHJlcXVlc3QuX2JvZHlJbml0KVxuICAgIH0pXG4gIH1cbiAgc2VsZi5mZXRjaC5wb2x5ZmlsbCA9IHRydWVcbn0pKHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJyA/IHNlbGYgOiB0aGlzKTtcbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgRm9ybURhdGEgPSByZXF1aXJlKCdmb3JtZGF0YS1wb2x5ZmlsbCcpXG5cbi8qKioqKiBMT0dTICoqKioqL1xuXG4vLyBkaXNwbGF5aW5nIG90aGVyIGRldmljZSB0ZXh0Ym94XG52YXIgZGV2aWNlTGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNjb29raW5nLWRldmljZScpXG52YXIgb3RoZXJEZXZpY2UgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZGV2aWNlLW90aGVyLWJveCcpXG5cbmlmIChkZXZpY2VMaXN0KSB7XG4gIGRldmljZUxpc3QuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgZnVuY3Rpb24oKSB7XG4gIFxuICAgIGlmIChkZXZpY2VMaXN0LnZhbHVlID09PSAnT3RoZXInKSB7XG4gICAgICBvdGhlckRldmljZS5jbGFzc0xpc3QucmVtb3ZlKCdoaWRkZW4nKVxuICAgIH1cblxuICAgIGVsc2UgaWYgKGRldmljZUxpc3QudmFsdWUgIT09ICdPdGhlcicpIHtcbiAgICAgIG90aGVyRGV2aWNlLmNsYXNzTGlzdC5hZGQoJ2hpZGRlbicpXG4gICAgfVxuXG4gIH0pXG59XG5cbi8vIGRpc3BsYXlpbmcgb3RoZXIgbWVhdCB0ZXh0Ym94XG52YXIgbWVhdExpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWVhdC10eXBlJylcbnZhciBvdGhlck1lYXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWVhdC1vdGhlci1ib3gnKVxuXG5pZiAobWVhdExpc3QpIHtcbiAgbWVhdExpc3QuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgZnVuY3Rpb24oKSB7XG4gIFxuICAgIGlmIChtZWF0TGlzdC52YWx1ZSA9PT0gJ090aGVyJykge1xuICAgICAgb3RoZXJNZWF0LmNsYXNzTGlzdC5yZW1vdmUoJ2hpZGRlbicpXG4gICAgfVxuXG4gICAgZWxzZSBpZiAobWVhdExpc3QudmFsdWUgIT09ICdPdGhlcicpIHtcbiAgICAgIG90aGVyTWVhdC5jbGFzc0xpc3QuYWRkKCdoaWRkZW4nKVxuICAgIH1cblxuICB9KVxufVxuXG4vLyBkaXNwbGF5aW5nIG90aGVyIHdvb2QgdGV4dGJveFxudmFyIHdvb2RMaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3dvb2QnKVxudmFyIG90aGVyV29vZCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyN3b29kLW90aGVyLXRleHQnKVxuXG5pZiAod29vZExpc3QpIHtcbiAgd29vZExpc3QuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgZnVuY3Rpb24oKSB7XG4gIFxuICAgIGlmICh3b29kTGlzdC52YWx1ZSA9PT0gJ090aGVyJykge1xuICAgICAgb3RoZXJXb29kLmNsYXNzTGlzdC5yZW1vdmUoJ2hpZGRlbicpXG4gICAgfVxuXG4gICAgZWxzZSBpZiAod29vZExpc3QudmFsdWUgIT09ICdPdGhlcicpIHtcbiAgICAgIG90aGVyV29vZC5jbGFzc0xpc3QuYWRkKCdoaWRkZW4nKVxuICAgIH1cblxuICB9KVxufVxuXG4vLyBhZGRpbmcgc3RlcCB0byByZWNpcGVcbnZhciBhZGRTdGVwQnRuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FkZC1zdGVwJylcbnZhciBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcignb2wnKVxuXG5pZiAoYWRkU3RlcEJ0bikge1xuICBhZGRTdGVwQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKVxuICAgIHZhciBzdGVwSFRNTCA9IFwiPGRpdiBjbGFzcz0nc3RlcC1ib3gnPjxkaXYgY2xhc3M9J3N0ZXAtbm90ZXMnPjx0ZXh0YXJlYSBjbGFzcz0nc3RlcC10ZXh0JyBwbGFjZWhvbGRlcj0nV3JpdGUgc3RlcCBoZXJlJz48L3RleHRhcmVhPjwvZGl2PjxkaXYgY2xhc3M9J2NvbXBsZXRlLWJveCc+PGxhYmVsIGZvcj0nY29tcGxldGUnPjxpbnB1dCB0eXBlPSdjaGVja2JveCcgY2xhc3M9J2NvbXBsZXRlLWNoZWNrJyBuYW1lPSdzdGVwLWNvbXBsZXRlJz5Db21wbGV0ZTwvbGFiZWw+PGlucHV0IHR5cGU9J3RpbWUnIGNsYXNzPSd0aW1lJyBuYW1lPSd0aW1lJyB2YWx1ZT0nMDk6MDAnPjwvZGl2PjxkaXYgY2xhc3M9J2NvbXBsZXRlLW5vdGVzJz48dGV4dGFyZWEgY2xhc3M9J2NvbXBsZXRlLW5vdGVzLXRleHQnIHBsYWNlaG9sZGVyPSdXcml0ZSBub3RlcyBoZXJlJz48L3RleHRhcmVhPjxidXR0b24gdHlwZT0nYnV0dG9uJyBjbGFzcz0ncmVtb3ZlLXN0ZXAnPlJlbW92ZSBTdGVwPC9idXR0b24+PC9kaXY+PC9kaXY+XCJcbiAgICBsaS5pbm5lckhUTUwgPSBzdGVwSFRNTFxuXG4gICAgbGlzdC5hcHBlbmRDaGlsZChsaSlcblxuICB9KVxuXG4gIHZhciBsb2dNYWluID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xvZy1tYWluJylcblxuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjcmVjaXBlLWxpc3Qgb2wnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgaWYgKGV2ZW50LnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ3JlbW92ZS1zdGVwJykpIHtcbiAgICAgIHZhciBsaSA9IGV2ZW50LnRhcmdldC5jbG9zZXN0KCdsaScpXG5cbiAgICAgIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgICAgdmFyIHBvcEhUTUwgPSBcIjxwIHN0eWxlPSdtYXJnaW4tdG9wOiA0MHB4Oyc+Q29uZmlybSBkZWxldGUgc3RlcD88L3A+PGRpdiBpZD0ncG9wLWRlbC1vcHRpb25zJz48YnV0dG9uIGlkPSdkZWwteWVzJz5ZZXM8L2J1dHRvbj48YnV0dG9uIGlkPSdkZWwtbm8nPk5vPC9idXR0b24+PC9kaXY+XCJcblxuICAgICAgZGl2LnNldEF0dHJpYnV0ZSgnaWQnLCAncG9wLWRlbCcpXG4gICAgICBkaXYuaW5uZXJIVE1MID0gcG9wSFRNTFxuICAgICAgbG9nTWFpbi5hcHBlbmRDaGlsZChkaXYpXG5cbiAgICAgIHZhciBkZWxObyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNkZWwtbm8nKVxuICAgICAgaWYgKGRlbE5vKSB7XG4gICAgICAgIGRlbE5vLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIHBvcERlbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNwb3AtZGVsJylcbiAgICAgICAgICBwb3BEZWwucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChwb3BEZWwpXG4gICAgICAgIH0pXG4gICAgICB9XG5cbiAgICAgIHZhciBkZWxZZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZGVsLXllcycpXG4gICAgICBpZiAoZGVsWWVzKSB7XG4gICAgICAgIGRlbFllcy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGxpLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobGkpXG4gICAgICAgICAgdmFyIHBvcERlbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNwb3AtZGVsJylcbiAgICAgICAgICBwb3BEZWwucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChwb3BEZWwpXG4gICAgICAgIH0pXG4gICAgICB9XG5cbiAgICB9XG4gIH0pXG59XG5cblxuLy8gcmVtb3ZpbmcgcGljIGZyb20gbG9nXG52YXIgcmVtb3ZlUGljQnRuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnJlbW92ZS1waWMnKVxudmFyIHBpY3NCb3ggPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucGljcy1ib3gnKVxuXG5pZiAocmVtb3ZlUGljQnRuKSB7XG5cbiAgdmFyIGxvZ01haW4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbG9nLW1haW4nKVxuXG4gIHBpY3NCb3guYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuICAgIGlmIChldmVudC50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdyZW1vdmUtcGljJykpIHtcbiAgICAgIHZhciBwaWNEaXYgPSBldmVudC50YXJnZXQuY2xvc2VzdCgnZGl2JylcblxuICAgICAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgICB2YXIgcG9wSFRNTCA9IFwiPHAgc3R5bGU9J21hcmdpbi10b3A6IDQwcHg7Jz5Db25maXJtIGRlbGV0ZSBwaWM/PC9wPjxkaXYgaWQ9J3BvcC1kZWwtb3B0aW9ucyc+PGJ1dHRvbiBpZD0nZGVsLXllcyc+WWVzPC9idXR0b24+PGJ1dHRvbiBpZD0nZGVsLW5vJz5ObzwvYnV0dG9uPjwvZGl2PlwiXG5cbiAgICAgIGRpdi5zZXRBdHRyaWJ1dGUoJ2lkJywgJ3BvcC1kZWwnKVxuICAgICAgZGl2LmlubmVySFRNTCA9IHBvcEhUTUxcbiAgICAgIGxvZ01haW4uYXBwZW5kQ2hpbGQoZGl2KVxuXG4gICAgICB2YXIgZGVsTm8gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZGVsLW5vJylcbiAgICAgIGlmIChkZWxObykge1xuICAgICAgICBkZWxOby5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBwb3BEZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjcG9wLWRlbCcpXG4gICAgICAgICAgcG9wRGVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQocG9wRGVsKVxuICAgICAgICB9KVxuICAgICAgfVxuXG4gICAgICB2YXIgZGVsWWVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2RlbC15ZXMnKVxuICAgICAgaWYgKGRlbFllcykge1xuICAgICAgICBkZWxZZXMuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICBwaWNEaXYucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChwaWNEaXYpXG4gICAgICAgICAgdmFyIHBvcERlbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNwb3AtZGVsJylcbiAgICAgICAgICBwb3BEZWwucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChwb3BEZWwpXG4gICAgICAgIH0pXG4gICAgICB9XG5cbiAgICB9XG4gIH0pXG59XG5cblxuXG4vLyB0ZW1wZXJhdHVyZSBzbGlkZXIgb3V0cHV0XG53aW5kb3cub3V0cHV0VXBkYXRlID0gZnVuY3Rpb24gKHRlbXApIHtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3RlbXAtc2xpZGVyLW91dHB1dCcpLnZhbHVlID0gdGVtcDtcbn1cblxuLy8gc2F2ZSBuZXcgbG9nIGRhdGEgdG8gTW9uZ29cbnZhciBzYXZlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3NhdmUnKVxuXG5pZiAoc2F2ZSkge1xuICBzYXZlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgbG9nQm9keSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsb2ctYm9keScpXG4gICAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgdmFyIHBvcEhUTUwgPSBcIjxpbWcgc3JjPScuLi9pbWFnZXMvdXBsb2FkaW5nLmdpZic+XCJcblxuICAgIGRpdi5jbGFzc0xpc3QuYWRkKCdwb3AnKVxuICAgIGRpdi5pbm5lckhUTUwgPSBwb3BIVE1MXG4gICAgbG9nQm9keS5hcHBlbmRDaGlsZChkaXYpXG5cbiAgICB2YXIgcmFkaW9zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnJhdGluZyBpbnB1dCcpXG4gICAgdmFyIHJhdGluZ1NlbGVjdGVkXG4gICAgcmFkaW9zLmZvckVhY2goZnVuY3Rpb24ocmFkaW8pIHtcbiAgICAgIGlmIChyYWRpby5jaGVja2VkKSB7XG4gICAgICAgIHJhdGluZ1NlbGVjdGVkID0gcmFkaW8udmFsdWVcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgaWYgKCFyYXRpbmdTZWxlY3RlZCkge1xuICAgICAgcmF0aW5nU2VsZWN0ZWQgPSAwXG4gICAgfVxuXG4gICAgdmFyIHN0YXR1cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyNzdGF0dXMtYm94IGlucHV0JylcbiAgICB2YXIgc3RhdHVzU2VsZWN0ZWRcbiAgICBzdGF0dXMuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG4gICAgICBpZiAoaXRlbS5jaGVja2VkKSB7XG4gICAgICAgIHN0YXR1c1NlbGVjdGVkID0gaXRlbS52YWx1ZVxuICAgICAgfVxuICAgIH0pXG5cbiAgICB2YXIgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoKVxuICAgIHZhciBiYXNpY0RhdGEgPSB7XG4gICAgICBkYXRlOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZGF0ZS1zZWxlY3QnKS52YWx1ZSxcbiAgICAgIHNlc3Npb25fbmFtZTogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Nlc3Npb24tbmFtZScpLnZhbHVlLFxuICAgICAgY29va2luZ19kZXZpY2U6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNjb29raW5nLWRldmljZScpLnZhbHVlLFxuICAgICAgZGV2aWNlX290aGVyOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZGV2aWNlLW90aGVyLXRleHQnKS52YWx1ZSxcbiAgICAgIG1lYXQ6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtZWF0LXR5cGUnKS52YWx1ZSxcbiAgICAgIG1lYXRfb3RoZXI6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtZWF0LW90aGVyLXRleHQnKS52YWx1ZSxcbiAgICAgIHdlaWdodDogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3dlaWdodCcpLnZhbHVlLFxuICAgICAgbWVhdF9ub3RlczogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21lYXQtbm90ZXMnKS52YWx1ZSxcbiAgICAgIGNvb2tfdGVtcGVyYXR1cmU6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyN0ZW1wLXNsaWRlcicpLnZhbHVlLFxuICAgICAgZXN0aW1hdGVkX3RpbWU6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNlc3RpbWF0ZWQtdGltZScpLnZhbHVlLFxuICAgICAgZnVlbDogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2Z1ZWwnKS52YWx1ZSxcbiAgICAgIGJyYW5kOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYnJhbmQnKS52YWx1ZSxcbiAgICAgIHdvb2Q6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyN3b29kJykudmFsdWUsXG4gICAgICB3b29kX290aGVyOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjd29vZC1vdGhlci10ZXh0JykudmFsdWUsXG4gICAgICByYXRpbmc6IHJhdGluZ1NlbGVjdGVkLFxuICAgICAgc3RhdHVzOiBzdGF0dXNTZWxlY3RlZCxcbiAgICAgIHVzZXJuYW1lOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjdXNlcm5hbWUnKS50ZXh0Q29udGVudCxcbiAgICAgIHVwZGF0ZWQ6IG5ldyBEYXRlKCksXG4gICAgICB2b3RlczogMCxcbiAgICAgIHZvdGVyczogW10sXG4gICAgICBvdGhlcl9pbmdyZWRpZW50czogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI290aGVyLWluZ3JlZGllbnRzJykudmFsdWUsXG4gICAgICByZWNpcGVfZ3VpZGVsaW5lOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjcmVjaXBlLWd1aWRlbGluZScpLnZhbHVlLFxuICAgICAgcGljczogW10sXG4gICAgICBmaW5hbDogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2ZpbmFsLWNvbW1lbnRzJykudmFsdWVcbiAgICB9XG5cbiAgICB2YXIgb2wgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdvbCcpXG4gICAgdmFyIGl0ZW1zID0gb2wuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2xpJylcbiAgICB2YXIgc3RlcEluZm8gPSBbXVxuICAgIFxuICAgIEFycmF5LmZyb20oaXRlbXMpLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuICAgICAgdmFyIHN0ZXBPYmplY3QgPSB7fVxuICAgICAgc3RlcE9iamVjdC5zdGVwID0gaXRlbS5xdWVyeVNlbGVjdG9yKCcuc3RlcC10ZXh0JykudmFsdWVcbiAgICAgIHN0ZXBPYmplY3QuY29tcGxldGVkID0gaXRlbS5xdWVyeVNlbGVjdG9yKCcuY29tcGxldGUtY2hlY2snKS5jaGVja2VkXG4gICAgICBzdGVwT2JqZWN0LnRpbWUgPSBpdGVtLnF1ZXJ5U2VsZWN0b3IoJy50aW1lJykudmFsdWVcbiAgICAgIHN0ZXBPYmplY3Qubm90ZXMgPSBpdGVtLnF1ZXJ5U2VsZWN0b3IoJy5jb21wbGV0ZS1ub3Rlcy10ZXh0JykudmFsdWVcbiAgICAgIHN0ZXBJbmZvLnB1c2goc3RlcE9iamVjdClcbiAgICB9KVxuXG4gICAgdmFyIGxvZ0RhdGEgPSBPYmplY3QuYXNzaWduKHsgc3RlcHM6IHN0ZXBJbmZvIH0sIGJhc2ljRGF0YSlcblxuICAgIC8vIGlmICggbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvQW5kcm9pZC9pKVxuICAgIC8vICB8fCBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC93ZWJPUy9pKVxuICAgIC8vICB8fCBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9pUGhvbmUvaSlcbiAgICAvLyAgfHwgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvaVBhZC9pKVxuICAgIC8vICB8fCBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9pUG9kL2kpXG4gICAgLy8gIHx8IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL0JsYWNrQmVycnkvaSlcbiAgICAvLyAgfHwgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvV2luZG93cyBQaG9uZS9pKVxuICAgIC8vICApIHtcbiAgICAvLyAgIHNlbmRMb2cobG9nRGF0YSlcbiAgICAvLyB9XG5cbiAgICAvLyBlbHNlIHtcblxuICAgICAgdmFyIGYgPSBuZXcgRm9ybURhdGEoKVxuXG4gICAgICAvLyBsZXQgYmxvYiA9IG5ldyBCbG9iKCdsb2dEYXRhJywgSlNPTi5zdHJpbmdpZnkobG9nRGF0YSkpXG4gICAgICAvLyBmLmFwcGVuZChibG9iKVxuXG4gICAgICBmLmFwcGVuZCgndGVzdCcsIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5jb21wbGV0ZS1ub3Rlcy10ZXh0JykudmFsdWUpXG5cbiAgICAgIC8vIGYuYXBwZW5kKCdsb2dEYXRhJywgSlNPTi5zdHJpbmdpZnkobG9nRGF0YSkpXG5cbiAgICAgIGYuYXBwZW5kKCdwaWNzJywgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2ZpbGUxJykuZmlsZXNbMF0pXG4gICAgICBmLmFwcGVuZCgncGljcycsIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNmaWxlMicpLmZpbGVzWzBdKVxuICAgICAgZi5hcHBlbmQoJ3BpY3MnLCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZmlsZTMnKS5maWxlc1swXSlcbiAgICAgIGYuYXBwZW5kKCdwaWNzJywgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2ZpbGU0JykuZmlsZXNbMF0pXG4gICAgICBmLmFwcGVuZCgncGljcycsIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNmaWxlNScpLmZpbGVzWzBdKVxuXG4gICAgICB4aHJQcm9taXNlKGYpXG4gICAgICAgIC50aGVuKChyZXMpID0+IHtcbiAgICAgICAgICB3aW5kb3cubG9jYXRpb24gPSAnL2xvZy1oaXN0b3J5P21lc3NhZ2U9TG9nJTIwY3JlYXRlZCdcbiAgICAgICAgfSlcblxuICAgIC8vIH1cblxuICAgIH0pXG59XG5cbmZ1bmN0aW9uIHhoclByb21pc2UoZikge1xuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKVxuICAgIHhoci5vcGVuKCdwb3N0JywgJy9jcmVhdGUtbG9nJylcbiAgICB4aHIuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uKCl7XG4gICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgPT0gWE1MSHR0cFJlcXVlc3QuRE9ORSkge1xuICAgICAgICByZXNvbHZlKHhoci5yZXNwb25zZVRleHQpXG4gICAgICB9XG4gICAgfSlcbiAgICB4aHIuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCByZWplY3QpXG5cbiAgICB4aHIuc2VuZChmKVxuXG4gIH0pXG59XG5cbmZ1bmN0aW9uIHNlbmRMb2cobG9nRGF0YSkge1xuICBjb25zb2xlLmxvZygnc2VuZGluZyBmZXRjaCcpXG4gIGZldGNoKCcvY3JlYXRlLWxvZycsIHtcbiAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICBoZWFkZXJzOiB7XG4gICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgfSxcbiAgICBib2R5OiBKU09OLnN0cmluZ2lmeShsb2dEYXRhKSxcbiAgICBtb2RlOiAnY29ycycsXG4gICAgY2FjaGU6ICdkZWZhdWx0JyxcbiAgICBjcmVkZW50aWFsczogJ2luY2x1ZGUnXG4gIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICB3aW5kb3cubG9jYXRpb24gPSAnL2xvZy1oaXN0b3J5P21lc3NhZ2U9TG9nJTIwY3JlYXRlZCdcbiAgICB9KVxufVxuXG4vLyB1cGRhdGUgbG9nIGRhdGEgdG8gTW9uZ29cbnZhciB1cGRhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjdXBkYXRlJylcblxuaWYgKHVwZGF0ZSkge1xuICB1cGRhdGUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcblxuICAgIHZhciBsb2dCb2R5ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xvZy1ib2R5JylcbiAgICB2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICB2YXIgcG9wSFRNTCA9IFwiPGltZyBzcmM9Jy4uL2ltYWdlcy91cGxvYWRpbmcuZ2lmJz5cIlxuXG4gICAgZGl2LmNsYXNzTGlzdC5hZGQoJ3BvcCcpXG4gICAgZGl2LmlubmVySFRNTCA9IHBvcEhUTUxcbiAgICBsb2dCb2R5LmFwcGVuZENoaWxkKGRpdilcblxuICAgIHZhciByYWRpb3MgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucmF0aW5nIGlucHV0JylcbiAgICB2YXIgcmF0aW5nU2VsZWN0ZWRcbiAgICByYWRpb3MuZm9yRWFjaChmdW5jdGlvbihyYWRpbykge1xuICAgICAgaWYgKHJhZGlvLmNoZWNrZWQpIHtcbiAgICAgICAgcmF0aW5nU2VsZWN0ZWQgPSByYWRpby52YWx1ZVxuICAgICAgfVxuICAgIH0pXG5cbiAgICBpZiAoIXJhdGluZ1NlbGVjdGVkKSB7XG4gICAgICByYXRpbmdTZWxlY3RlZCA9IDBcbiAgICB9XG5cbiAgICB2YXIgc3RhdHVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnI3N0YXR1cy1ib3ggaW5wdXQnKVxuICAgIHZhciBzdGF0dXNTZWxlY3RlZFxuICAgIHN0YXR1cy5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgIGlmIChpdGVtLmNoZWNrZWQpIHtcbiAgICAgICAgc3RhdHVzU2VsZWN0ZWQgPSBpdGVtLnZhbHVlXG4gICAgICB9XG4gICAgfSlcblxuICAgIHZhciBtZWF0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21lYXQtdHlwZScpLnZhbHVlXG5cbiAgICBpZiAob3RoZXJNZWF0LnZhbHVlICE9PSAnJykge1xuICAgICAgbWVhdCA9IG90aGVyTWVhdC52YWx1ZVxuICAgIH1cblxuICAgIHZhciBjb29raW5nRGV2aWNlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2Nvb2tpbmctZGV2aWNlJykudmFsdWVcblxuICAgIGlmIChvdGhlckRldmljZS52YWx1ZSAhPT0gJycpIHtcbiAgICAgIGNvb2tpbmdEZXZpY2UgPSBvdGhlckRldmljZS52YWx1ZVxuICAgIH1cblxuICAgIHZhciBiYXNpY0RhdGEgPSB7XG4gICAgICBkYXRlOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZGF0ZS1zZWxlY3QnKS52YWx1ZSwgLy8gZmluZCBhIHdheSB0byBnZXQgdGhpcyB2YWx1ZVxuICAgICAgc2Vzc2lvbl9uYW1lOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2Vzc2lvbi1uYW1lJykudmFsdWUsXG4gICAgICBjb29raW5nX2RldmljZTogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2Nvb2tpbmctZGV2aWNlJykudmFsdWUsXG4gICAgICBkZXZpY2Vfb3RoZXI6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNkZXZpY2Utb3RoZXItdGV4dCcpLnZhbHVlLFxuICAgICAgbWVhdDogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21lYXQtdHlwZScpLnZhbHVlLFxuICAgICAgbWVhdF9vdGhlcjogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21lYXQtb3RoZXItdGV4dCcpLnZhbHVlLFxuICAgICAgd2VpZ2h0OiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjd2VpZ2h0JykudmFsdWUsXG4gICAgICBtZWF0X25vdGVzOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWVhdC1ub3RlcycpLnZhbHVlLFxuICAgICAgY29va190ZW1wZXJhdHVyZTogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3RlbXAtc2xpZGVyJykudmFsdWUsXG4gICAgICBlc3RpbWF0ZWRfdGltZTogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2VzdGltYXRlZC10aW1lJykudmFsdWUsXG4gICAgICBmdWVsOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZnVlbCcpLnZhbHVlLFxuICAgICAgYnJhbmQ6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNicmFuZCcpLnZhbHVlLFxuICAgICAgd29vZDogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3dvb2QnKS52YWx1ZSxcbiAgICAgIHdvb2Rfb3RoZXI6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyN3b29kLW90aGVyLXRleHQnKS52YWx1ZSxcbiAgICAgIHJhdGluZzogcmF0aW5nU2VsZWN0ZWQsXG4gICAgICBzdGF0dXM6IHN0YXR1c1NlbGVjdGVkLFxuICAgICAgdXNlcm5hbWU6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyN1c2VybmFtZScpLnRleHRDb250ZW50LFxuICAgICAgdXBkYXRlZDogbmV3IERhdGUoKSxcbiAgICAgIG90aGVyX2luZ3JlZGllbnRzOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjb3RoZXItaW5ncmVkaWVudHMnKS52YWx1ZSxcbiAgICAgIHJlY2lwZV9ndWlkZWxpbmU6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNyZWNpcGUtZ3VpZGVsaW5lJykudmFsdWUsXG4gICAgICBmaW5hbDogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2ZpbmFsLWNvbW1lbnRzJykudmFsdWVcbiAgICB9XG5cbiAgICB2YXIgb2wgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdvbCcpXG4gICAgdmFyIGl0ZW1zID0gb2wuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2xpJylcbiAgICB2YXIgc3RlcEluZm8gPSBbXVxuICAgIFxuICAgIEFycmF5LmZyb20oaXRlbXMpLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuICAgICAgdmFyIHN0ZXBPYmplY3QgPSB7fVxuICAgICAgc3RlcE9iamVjdC5zdGVwID0gaXRlbS5xdWVyeVNlbGVjdG9yKCcuc3RlcC10ZXh0JykudmFsdWVcbiAgICAgIHN0ZXBPYmplY3QuY29tcGxldGVkID0gaXRlbS5xdWVyeVNlbGVjdG9yKCcuY29tcGxldGUtY2hlY2snKS5jaGVja2VkXG4gICAgICBzdGVwT2JqZWN0LnRpbWUgPSBpdGVtLnF1ZXJ5U2VsZWN0b3IoJy50aW1lJykudmFsdWVcbiAgICAgIHN0ZXBPYmplY3Qubm90ZXMgPSBpdGVtLnF1ZXJ5U2VsZWN0b3IoJy5jb21wbGV0ZS1ub3RlcycpLnZhbHVlXG4gICAgICBzdGVwSW5mby5wdXNoKHN0ZXBPYmplY3QpXG4gICAgfSlcblxuICAgIHZhciBkaXNwbGF5ZWRQaWNzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnBpYyBpbWcnKVxuICAgIHZhciBkaXNwbGF5ZWRQaWNzQXJyYXkgPSBbXVxuICAgIFxuICAgIEFycmF5LmZyb20oZGlzcGxheWVkUGljcykuZm9yRWFjaChmdW5jdGlvbihkaXNwbGF5ZWRQaWMpIHtcbiAgICAgIHZhciBwaWNzT2JqZWN0ID0ge31cbiAgICAgIHZhciBhdHRyID0gZGlzcGxheWVkUGljLmdldEF0dHJpYnV0ZSgnc3JjJylcbiAgICAgIHZhciBmaWxlbmFtZSA9IGF0dHIuc3BsaXQoJy8nKS5wb3AoKVxuICAgICAgcGljc09iamVjdC5maWxlbmFtZSA9IGZpbGVuYW1lXG4gICAgICBkaXNwbGF5ZWRQaWNzQXJyYXkucHVzaChwaWNzT2JqZWN0KVxuICAgIH0pXG5cbiAgICB2YXIgbG9nRGF0YSA9IE9iamVjdC5hc3NpZ24oeyBzdGVwczogc3RlcEluZm8gfSwgeyBwaWNzOiBkaXNwbGF5ZWRQaWNzQXJyYXkgfSwgYmFzaWNEYXRhKVxuICAgIFxuICAgIGlmICggbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvQW5kcm9pZC9pKVxuICAgICB8fCBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC93ZWJPUy9pKVxuICAgICB8fCBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9pUGhvbmUvaSlcbiAgICAgfHwgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvaVBhZC9pKVxuICAgICB8fCBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9pUG9kL2kpXG4gICAgIHx8IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL0JsYWNrQmVycnkvaSlcbiAgICAgfHwgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvV2luZG93cyBQaG9uZS9pKVxuICAgICApIHtcbiAgICAgIHVwZGF0ZUxvZyhsb2dEYXRhKVxuICAgIH1cblxuICAgIGVsc2Uge1xuXG4gICAgICB2YXIgZiA9IG5ldyBGb3JtRGF0YSgpXG4gICAgICBmLmFwcGVuZCgnbG9nRGF0YScsIEpTT04uc3RyaW5naWZ5KGxvZ0RhdGEpKVxuXG4gICAgICBmLmFwcGVuZCgncGljcycsIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNmaWxlMScpLmZpbGVzWzBdKVxuICAgICAgZi5hcHBlbmQoJ3BpY3MnLCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZmlsZTInKS5maWxlc1swXSlcbiAgICAgIGYuYXBwZW5kKCdwaWNzJywgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2ZpbGUzJykuZmlsZXNbMF0pXG4gICAgICBmLmFwcGVuZCgncGljcycsIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNmaWxlNCcpLmZpbGVzWzBdKVxuICAgICAgZi5hcHBlbmQoJ3BpY3MnLCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZmlsZTUnKS5maWxlc1swXSlcblxuICAgICAgdmFyIHVybCA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZVxuICAgICAgdmFyIGxvZ0lkID0gdXJsLnNwbGl0KCcvJykucG9wKClcblxuXG4gICAgICB4aHJQcm9taXNlVXBkYXRlKGYpXG4gICAgICAgIC50aGVuKChyZXMpID0+IHtcblxuICAgICAgICAgIHZhciBsb2FkZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucG9wJylcbiAgICAgICAgICBsb2FkZXIucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChsb2FkZXIpXG5cbiAgICAgICAgICB2YXIgbG9nQm9keSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsb2ctYm9keScpXG4gICAgICAgICAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgICAgICAgdmFyIHBvcEhUTUwgPSBcIjxwPkxvZyB1cGRhdGVkPC9wPlwiXG5cbiAgICAgICAgICBkaXYuY2xhc3NMaXN0LmFkZCgncG9wLXVwZGF0ZScpXG4gICAgICAgICAgZGl2LmlubmVySFRNTCA9IHBvcEhUTUxcbiAgICAgICAgICBsb2dCb2R5LmFwcGVuZENoaWxkKGRpdilcblxuXG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgZGl2LmNsYXNzTGlzdC5hZGQoJ3BvcC11cGRhdGUtZmFkZScpXG4gICAgICAgICAgfSwgMClcblxuICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGRpdi5jbGFzc0xpc3QucmVtb3ZlKCdwb3AtdXBkYXRlLWZhZGUnKVxuXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZGl2LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZGl2KSAgICAgICAgXG4gICAgICAgICAgICB9LCAxMDAwKVxuXG4gICAgICAgICAgfSwgMjAwMClcblxuICAgICAgICAgIC8vIGFkZC9yZW1vdmUgcHVibGljIGxpbmsgb24gdXBkYXRlIHdpdGhvdXQgcGFnZSByZWZyZXNoXG4gICAgICAgICAgdmFyIGgzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaDMnKVxuICAgICAgICAgIHZhciBwdWJMaW5rID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3B1Yi1saW5rJylcbiAgICAgICAgICB2YXIgc3RhdHVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnI3N0YXR1cy1ib3ggaW5wdXQnKVxuICAgICAgICAgIHZhciBzdGF0dXNTZWxlY3RlZFxuXG4gICAgICAgICAgc3RhdHVzLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgaWYgKGl0ZW0uY2hlY2tlZCkge1xuICAgICAgICAgICAgICBzdGF0dXNTZWxlY3RlZCA9IGl0ZW0udmFsdWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgaWYgKChzdGF0dXNTZWxlY3RlZCA9PT0gJ1ByaXZhdGUnKSAmJiBoMykge1xuICAgICAgICAgICAgcHViTGluay5yZW1vdmVDaGlsZChoMylcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoKHN0YXR1c1NlbGVjdGVkID09PSAnUHVibGljJykgJiYgIWgzKSB7XG4gICAgICAgICAgICB2YXIgaDMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdoMycpXG4gICAgICAgICAgICB2YXIgdXJsID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lXG4gICAgICAgICAgICB2YXIgbG9nSWQgPSB1cmwuc3BsaXQoJy8nKS5wb3AoKVxuICAgICAgICAgICAgdmFyIGgzQ29udGVudCA9IFwiPGEgaHJlZj0nL3B1YmxpYy1sb2cvXCIgKyBsb2dJZCArIFwiJz5QdWJsaWMgbGluayBoZXJlPC9hPlwiXG4gICAgICAgICAgICBoMy5pbm5lckhUTUwgPSBoM0NvbnRlbnRcbiAgICAgICAgICAgIHB1YkxpbmsuYXBwZW5kQ2hpbGQoaDMpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gYWRkL3JlbW92ZSBwaWN0dXJlcyBvbiB1cGRhdGUgd2l0aG91dCBwYWdlIHJlZnJlc2hcbiAgICAgICAgICB2YXIgcGljc0JveCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5waWNzLWJveCcpXG4gICAgICAgICAgdmFyIGxvZ1BpY3MgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucGljJylcblxuICAgICAgICAgIGxvZ1BpY3MuZm9yRWFjaChmdW5jdGlvbihwaWMpIHtcbiAgICAgICAgICAgIHBpYy5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHBpYylcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgdmFyIHJlc3BvbnNlID0gSlNPTi5wYXJzZShyZXMpXG4gICAgICAgICAgdmFyIG5ld1BpY3MgPSByZXNwb25zZS5waWNzXG5cbiAgICAgICAgICBpZiAobmV3UGljcykge1xuICAgICAgICAgICAgbmV3UGljcy5mb3JFYWNoKGZ1bmN0aW9uKHBpYykge1xuICAgICAgICAgICAgICB2YXIgcGljRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICAgICAgICAgICAgcGljRGl2LmNsYXNzTGlzdC5hZGQoJ3BpYycpXG5cbiAgICAgICAgICAgICAgcGljc0JveC5hcHBlbmRDaGlsZChwaWNEaXYpXG4gICAgICAgICAgICAgIHBpY0Rpdi5pbm5lckhUTUwgPSBcIjxpbWcgc3JjPSdodHRwczovL3MzLXVzLXdlc3QtMS5hbWF6b25hd3MuY29tL2JicXRyYWNrZXIvXCIgKyBwaWMuZmlsZW5hbWUgKyBcIic+PGJ1dHRvbiB0eXBlPSdidXR0b24nIGNsYXNzPSdyZW1vdmUtcGljJz5SZW1vdmUgUGljdHVyZTwvYnV0dG9uPlwiXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIGFkZC9yZW1vdmUgZmlsZSB1cGxvYWQgZmllbGRzIG9uIHVwZGF0ZSB3aXRob3V0IHBhZ2UgcmVmcmVzaFxuICAgICAgICAgIHZhciB1cGxvYWRCb3ggPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucGljcy11cGxvYWQtYm94JylcbiAgICAgICAgICB2YXIgdXBsb2FkQnRucyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5waWMtdXBsb2FkJylcblxuICAgICAgICAgIHVwbG9hZEJ0bnMuZm9yRWFjaChmdW5jdGlvbihidG4pIHtcbiAgICAgICAgICAgIGJ0bi5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGJ0bilcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCA2OyBpKyspIHtcbiAgICAgICAgICAgIHZhciB1cGxvYWREaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgICAgICAgICAgdXBsb2FkRGl2LmNsYXNzTGlzdC5hZGQoJ3BpYy11cGxvYWQnKVxuXG4gICAgICAgICAgICB1cGxvYWRCb3guYXBwZW5kQ2hpbGQodXBsb2FkRGl2KVxuICAgICAgICAgICAgdXBsb2FkRGl2LmlubmVySFRNTCA9IFwiPGxhYmVsPlVwbG9hZCBQaWN0dXJlIFwiICsgW2ldICsgXCI8L2xhYmVsPjxpbnB1dCBpZD0nZmlsZVwiICsgW2ldICsgXCInIHR5cGU9J2ZpbGUnIG5hbWU9J2ZpbGVcIiArIFtpXSArIFwiJz5cIlxuICAgICAgICAgIH1cblxuICAgICAgICB9KVxuICAgICAgfVxuXG4gIH0pXG59XG5cbi8vIHVwZGF0aW5nIGxvZ1xudmFyIHVybCA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZVxudmFyIGxvZ0lkID0gdXJsLnNwbGl0KCcvJykucG9wKClcblxuZnVuY3Rpb24geGhyUHJvbWlzZVVwZGF0ZShmKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpXG4gICAgeGhyLm9wZW4oJ3B1dCcsICcvdmlldy1sb2cvJyArIGxvZ0lkKVxuICAgIHhoci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24oKXtcbiAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSA9PSBYTUxIdHRwUmVxdWVzdC5ET05FKSB7XG4gICAgICAgIHJlc29sdmUoeGhyLnJlc3BvbnNlVGV4dClcbiAgICAgIH1cbiAgICB9KVxuICAgIHhoci5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIHJlamVjdClcblxuICAgIHhoci5zZW5kKGYpXG5cbiAgfSlcbn1cblxuXG4vLyB1cGRhdGluZyBsb2cgLSBtb2JpbGVcbmZ1bmN0aW9uIHVwZGF0ZUxvZyhsb2dEYXRhKSB7XG4gIGZldGNoKCcvdmlldy1sb2cvJyArIGxvZ0lkLCB7XG4gICAgbWV0aG9kOiAnUFVUJyxcbiAgICBoZWFkZXJzOiB7XG4gICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgfSxcbiAgICBib2R5OiBKU09OLnN0cmluZ2lmeShsb2dEYXRhKSxcbiAgICBtb2RlOiAnY29ycycsXG4gICAgY2FjaGU6ICdkZWZhdWx0JyxcbiAgICBjcmVkZW50aWFsczogJ2luY2x1ZGUnXG4gIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24oKSB7XG5cbiAgICAgIHZhciBsb2FkZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucG9wJylcbiAgICAgIGxvYWRlci5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGxvYWRlcilcbiAgICAgICAgICBcbiAgICAgIHZhciBsb2dCb2R5ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xvZy1ib2R5JylcbiAgICAgIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgICAgdmFyIHBvcEhUTUwgPSBcIjxwPkxvZyB1cGRhdGVkPC9wPlwiXG5cbiAgICAgIGRpdi5jbGFzc0xpc3QuYWRkKCdwb3AtdXBkYXRlJylcbiAgICAgIGRpdi5pbm5lckhUTUwgPSBwb3BIVE1MXG4gICAgICBsb2dCb2R5LmFwcGVuZENoaWxkKGRpdilcblxuXG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgIGRpdi5jbGFzc0xpc3QuYWRkKCdwb3AtdXBkYXRlLWZhZGUnKVxuICAgICAgfSwgMClcblxuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICBkaXYuY2xhc3NMaXN0LnJlbW92ZSgncG9wLXVwZGF0ZS1mYWRlJylcblxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBkaXYucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChkaXYpICAgICAgICBcbiAgICAgICAgfSwgMTAwMClcblxuICAgICAgfSwgMjAwMClcblxuICAgICAgLy8gYWRkL3JlbW92ZSBwdWJsaWMgbGluayBvbiB1cGRhdGUgd2l0aG91dCBwYWdlIHJlZnJlc2hcbiAgICAgIHZhciBoMyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2gzJylcbiAgICAgIHZhciBwdWJMaW5rID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3B1Yi1saW5rJylcbiAgICAgIHZhciBzdGF0dXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjc3RhdHVzLWJveCBpbnB1dCcpXG4gICAgICB2YXIgc3RhdHVzU2VsZWN0ZWRcblxuICAgICAgc3RhdHVzLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICBpZiAoaXRlbS5jaGVja2VkKSB7XG4gICAgICAgICAgc3RhdHVzU2VsZWN0ZWQgPSBpdGVtLnZhbHVlXG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIGlmICgoc3RhdHVzU2VsZWN0ZWQgPT09ICdQcml2YXRlJykgJiYgaDMpIHtcbiAgICAgICAgcHViTGluay5yZW1vdmVDaGlsZChoMylcbiAgICAgIH1cblxuICAgICAgaWYgKChzdGF0dXNTZWxlY3RlZCA9PT0gJ1B1YmxpYycpICYmICFoMykge1xuICAgICAgICB2YXIgaDMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdoMycpXG4gICAgICAgIHZhciB1cmwgPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWVcbiAgICAgICAgdmFyIGxvZ0lkID0gdXJsLnNwbGl0KCcvJykucG9wKClcbiAgICAgICAgdmFyIGgzQ29udGVudCA9IFwiPGEgaHJlZj0nL3B1YmxpYy1sb2cvXCIgKyBsb2dJZCArIFwiJz5QdWJsaWMgbGluayBoZXJlPC9hPlwiXG4gICAgICAgIGgzLmlubmVySFRNTCA9IGgzQ29udGVudFxuICAgICAgICBwdWJMaW5rLmFwcGVuZENoaWxkKGgzKVxuICAgICAgfVxuXG4gICAgfSlcbn1cblxuXG4vLyBsb2cgaGlzdG9yeSBjb250cm9sc1xudmFyIG1vZGlmeSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsb2ctYWN0aW9uLWJ0bicpXG5pZiAobW9kaWZ5KSB7XG4gIG1vZGlmeS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBtb2RPcHRpb24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbG9nLWFjdGlvbi1vcHRpb25zJykudmFsdWVcbiAgICB2YXIgbG9ncyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5sb2ctc2VsZWN0JylcbiAgICB2YXIgc2VsZWN0ZWRMb2dzID0gW11cblxuICAgIGxvZ3MuZm9yRWFjaChmdW5jdGlvbihsb2cpIHtcbiAgICAgIGlmIChsb2cuY2hlY2tlZCkge1xuICAgICAgICB2YXIgaWQgPSBsb2cuY2xvc2VzdCgndHInKS5nZXRBdHRyaWJ1dGUoJ2lkJylcbiAgICAgICAgc2VsZWN0ZWRMb2dzLnB1c2goaWQpXG4gICAgICB9XG4gICAgfSlcblxuICAgICAgaWYgKG1vZE9wdGlvbiA9PT0gJ0NvcHknKSB7XG4gICAgICAgIGNvcHlMb2dzKHNlbGVjdGVkTG9ncylcbiAgICAgIH1cblxuICAgICAgZWxzZSBpZiAobW9kT3B0aW9uID09PSAnRGVsZXRlJykge1xuICAgICAgICBkZWxldGVMb2dzKHNlbGVjdGVkTG9ncylcbiAgICAgIH1cblxuICAgICAgZWxzZSBpZiAobW9kT3B0aW9uID09PSAnU3dpdGNoIFN0YXR1cycpIHtcbiAgICAgICAgc3RhdHVzTG9ncyhzZWxlY3RlZExvZ3MpXG4gICAgICB9XG5cbiAgfSlcbn1cblxuZnVuY3Rpb24gY29weUxvZ3Moc2VsZWN0ZWQpIHtcbiAgZmV0Y2goJy9sb2ctaGlzdG9yeScsIHtcbiAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICBoZWFkZXJzOiB7XG4gICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgfSxcbiAgICBib2R5OiBKU09OLnN0cmluZ2lmeShzZWxlY3RlZCksXG4gICAgbW9kZTogJ2NvcnMnLFxuICAgIGNhY2hlOiAnZGVmYXVsdCcsXG4gICAgY3JlZGVudGlhbHM6ICdpbmNsdWRlJ1xuICB9KVxuICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgcmV0dXJuIHJlcy5qc29uKClcbiAgICB9KVxuICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgaWYgKHJlcy5tZXNzYWdlID09PSBcIkxvZ3MgY29waWVkXCIpIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uID0gJy9sb2ctaGlzdG9yeT9tZXNzYWdlPUxvZ3MlMjBjb3BpZWQnXG4gICAgICB9XG4gICAgICBlbHNlIGlmIChyZXMuZXJyb3IgPT09IFwiTm8gbG9ncyBzZWxlY3RlZFwiKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbiA9ICcvbG9nLWhpc3Rvcnk/ZXJyb3I9Tm8lMjBsb2dzJTIwc2VsZWN0ZWQnXG4gICAgICB9XG4gICB9KVxufVxuXG5mdW5jdGlvbiBkZWxldGVMb2dzKHNlbGVjdGVkKSB7XG4gIGZldGNoKCcvbG9nLWhpc3RvcnknLCB7XG4gICAgbWV0aG9kOiAnREVMRVRFJyxcbiAgICBoZWFkZXJzOiB7XG4gICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgfSxcbiAgICBib2R5OiBKU09OLnN0cmluZ2lmeShzZWxlY3RlZCksXG4gICAgbW9kZTogJ2NvcnMnLFxuICAgIGNhY2hlOiAnZGVmYXVsdCcsXG4gICAgY3JlZGVudGlhbHM6ICdpbmNsdWRlJ1xuICB9KVxuICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgd2luZG93LmxvY2F0aW9uID0gJy9sb2ctaGlzdG9yeT9tZXNzYWdlPUxvZ3MlMjBkZWxldGVkJ1xuICAgIH0pXG59XG5cbmZ1bmN0aW9uIHN0YXR1c0xvZ3Moc2VsZWN0ZWQpIHtcbiAgZmV0Y2goJy9sb2ctaGlzdG9yeScsIHtcbiAgICBtZXRob2Q6ICdQVVQnLFxuICAgIGhlYWRlcnM6IHtcbiAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICB9LFxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHNlbGVjdGVkKSxcbiAgICBtb2RlOiAnY29ycycsXG4gICAgY2FjaGU6ICdkZWZhdWx0JyxcbiAgICBjcmVkZW50aWFsczogJ2luY2x1ZGUnXG4gIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgIHdpbmRvdy5sb2NhdGlvbiA9ICcvbG9nLWhpc3Rvcnk/bWVzc2FnZT1Mb2clMjBzdGF0dXMlMjBzd2l0Y2hlZCdcbiAgICB9KVxufVxuXG4vLyBhZGQgdm90ZXMgdG8gcHVibGljIGxvZ1xudmFyIHZvdGVCdG4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjdm90ZS1idG4nKVxuaWYgKHZvdGVCdG4pIHtcbiAgdm90ZUJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXG4gIHZhciB1cmwgPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWVcbiAgdmFyIGxvZ0lkID0gdXJsLnNwbGl0KCcvJykucG9wKClcblxuICAgIHZhciBsb2cgPSB7XG4gICAgICBhdXRob3I6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhdXRob3InKS50ZXh0Q29udGVudCxcbiAgICAgIGxvZ0lkOiBsb2dJZFxuICAgIH1cblxuICAgIGFkZFZvdGUobG9nKVxuICB9KVxufVxuXG5mdW5jdGlvbiBhZGRWb3RlKGxvZykge1xuICBmZXRjaCgnL3B1YmxpYy1sb2cnLCB7XG4gICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgaGVhZGVyczoge1xuICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ1xuICAgIH0sXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkobG9nKSxcbiAgICBtb2RlOiAnY29ycycsXG4gICAgY2FjaGU6ICdkZWZhdWx0JyxcbiAgICBjcmVkZW50aWFsczogJ2luY2x1ZGUnXG4gIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICByZXR1cm4gcmVzLmpzb24oKVxuICAgIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICB2YXIgdXBkYXRlZFZvdGVzID0gcmVzLnZvdGVzXG4gICAgICB2YXIgdm90ZUNvdW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3ZvdGUtY291bnQnKVxuICAgICAgdmFyIHZvdGVDb3VudEJveCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyN2b3RlLWNvdW50LWJveCcpXG4gICAgICB2YXIgdm90ZUJ0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyN2b3RlLWJ0bicpXG5cbiAgICAgIHZvdGVDb3VudC5pbm5lckhUTUwgPSB1cGRhdGVkVm90ZXNcbiAgICAgIHZvdGVCdG4ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh2b3RlQnRuKVxuXG4gICAgICB2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICAgIGRpdi5zdHlsZS5mbG9hdCA9ICdyaWdodCdcbiAgICAgIHZvdGVDb3VudEJveC5hcHBlbmRDaGlsZChkaXYpXG4gICAgICBkaXYuaW5uZXJIVE1MID0gJ1ZvdGVkJ1xuICAgIH0pXG59XG5cblxuXG5cbi8qKioqKiBBQ0NPVU5UUyBQQUdFICoqKioqL1xuXG4vLyBkaXNwbGF5aW5nIG9wdGlvbiBmaWVsZHMgb24gY2xpY2tcbnZhciBuZXdVc2VybmFtZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNuZXctdXNlcm5hbWUtYnRuJylcbnZhciBuZXdFbWFpbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNuZXctZW1haWwtYnRuJylcbnZhciBuZXdQVyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNuZXctcHctYnRuJylcbnZhciBkZWxldGVBY2NvdW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2RlbGV0ZS1hY2NvdW50LWJ0bicpXG5cbmlmIChuZXdVc2VybmFtZSkge1xuICBuZXdVc2VybmFtZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgdmFyIGZpZWxkID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI25ldy11c2VybmFtZS1maWVsZCcpXG4gICAgZmllbGQuY2xhc3NMaXN0LnRvZ2dsZSgnaGlkZGVuJylcbiAgfSlcbn1cblxuaWYgKG5ld0VtYWlsKSB7XG4gIG5ld0VtYWlsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICB2YXIgZmllbGQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbmV3LWVtYWlsLWZpZWxkJylcbiAgICBmaWVsZC5jbGFzc0xpc3QudG9nZ2xlKCdoaWRkZW4nKVxuICB9KVxufVxuXG5pZiAobmV3UFcpIHtcbiAgbmV3UFcuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuICAgIHZhciBmaWVsZCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNuZXctcHctZmllbGQnKVxuICAgIGZpZWxkLmNsYXNzTGlzdC50b2dnbGUoJ2hpZGRlbicpXG4gIH0pXG59XG5cbmlmIChkZWxldGVBY2NvdW50KSB7XG4gIGRlbGV0ZUFjY291bnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuICAgIHZhciBmaWVsZCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNkZWxldGUtYWNjb3VudC1maWVsZCcpXG4gICAgZmllbGQuY2xhc3NMaXN0LnRvZ2dsZSgnaGlkZGVuJylcbiAgfSlcbn1cblxuLy8gbmV3IHVzZXJuYW1lXG52YXIgbmV3VXNlcm5hbWVTdWJtaXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbmV3LXVzZXJuYW1lLXN1Ym1pdCcpXG5pZiAobmV3VXNlcm5hbWVTdWJtaXQpIHtcbiAgbmV3VXNlcm5hbWVTdWJtaXQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcblxuICB2YXIgbmV3VXNlcm5hbWVWYWx1ZSA9IHsgdXNlcm5hbWU6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNuZXctdXNlcm5hbWUnKS52YWx1ZSB9XG4gIGNoYW5nZVVzZXJuYW1lKG5ld1VzZXJuYW1lVmFsdWUpXG5cbiAgfSlcbn1cblxuZnVuY3Rpb24gY2hhbmdlVXNlcm5hbWUobmV3VXNlcm5hbWVWYWx1ZSkge1xuICBmZXRjaCgnL2FjY291bnQvdXNlcm5hbWUnLCB7XG4gICAgbWV0aG9kOiAnUFVUJyxcbiAgICBoZWFkZXJzOiB7XG4gICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgfSxcbiAgICBib2R5OiBKU09OLnN0cmluZ2lmeShuZXdVc2VybmFtZVZhbHVlKSxcbiAgICBtb2RlOiAnY29ycycsXG4gICAgY2FjaGU6ICdkZWZhdWx0JyxcbiAgICBjcmVkZW50aWFsczogJ2luY2x1ZGUnXG4gIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICByZXR1cm4gcmVzLmpzb24oKVxuICAgIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICBpZiAocmVzLm1lc3NhZ2UgPT09IFwiVXNlcm5hbWUgY2hhbmdlZFwiKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbiA9ICcvYWNjb3VudD9tZXNzYWdlPVVzZXJuYW1lJTIwY2hhbmdlZCdcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKHJlcy5lcnJvciA9PT0gXCJTdXBwbHkgYSBuZXcgdXNlcm5hbWVcIikge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24gPSAnL2FjY291bnQ/ZXJyb3I9U3VwcGx5JTIwYSUyMG5ldyUyMHVzZXJuYW1lJ1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAocmVzLmVycm9yID09PSBcIk5vIHNwYWNlcyBhbGxvd2VkIGluIHVzZXJuYW1lXCIpIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uID0gJy9hY2NvdW50P2Vycm9yPU5vJTIwc3BhY2VzJTIwYWxsb3dlZCUyMGluJTIwdXNlcm5hbWUnXG4gICAgICB9XG4gICAgICBlbHNlIGlmIChyZXMuZXJyb3IgPT09IFwiVXNlcm5hbWUgaXMgbGltaXRlZCB0byAxNSBjaGFyYWN0ZXJzXCIpIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uID0gJy9hY2NvdW50P2Vycm9yPVVzZXJuYW1lJTIwaXMlMjBsaW1pdGVkJTIwdG8lMjAxNSUyMGNoYXJhY3RlcnMnXG4gICAgICB9XG5cbiAgICB9KVxufVxuXG4vLyBjaGFuZ2UgYXZhdGFyXG52YXIgY293QXZhdGFyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2Nvdy1hdmF0YXInKVxudmFyIGNoaWNrZW5BdmF0YXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjY2hpY2tlbi1hdmF0YXInKVxudmFyIHBpZ0F2YXRhciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNwaWctYXZhdGFyJylcblxuaWYgKGNvd0F2YXRhciAmJiAhY293QXZhdGFyLmNsYXNzTGlzdC5jb250YWlucygnYXZhdGFyLWhpZ2hsaWdodCcpKSB7XG4gIGNvd0F2YXRhci5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBhdmF0YXJSZXEgPSB7IGF2YXRhcjogJy4uL2ltYWdlcy9jb3cuc3ZnJyB9XG4gICAgY2hhbmdlQXZhdGFyKGF2YXRhclJlcSlcbiAgfSlcbn1cblxuaWYgKGNoaWNrZW5BdmF0YXIgJiYgIWNoaWNrZW5BdmF0YXIuY2xhc3NMaXN0LmNvbnRhaW5zKCdhdmF0YXItaGlnaGxpZ2h0JykpIHtcbiAgY2hpY2tlbkF2YXRhci5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBhdmF0YXJSZXEgPSB7IGF2YXRhcjogJy4uL2ltYWdlcy9jaGlja2VuLnN2ZycgfVxuICAgIGNoYW5nZUF2YXRhcihhdmF0YXJSZXEpXG4gIH0pXG59XG5cbmlmIChwaWdBdmF0YXIgJiYgIXBpZ0F2YXRhci5jbGFzc0xpc3QuY29udGFpbnMoJ2F2YXRhci1oaWdobGlnaHQnKSkge1xuICBwaWdBdmF0YXIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgYXZhdGFyUmVxID0geyBhdmF0YXI6ICcuLi9pbWFnZXMvcGlnLnN2ZycgfVxuICAgIGNoYW5nZUF2YXRhcihhdmF0YXJSZXEpXG4gIH0pXG59XG5cbmZ1bmN0aW9uIGNoYW5nZUF2YXRhcihhdmF0YXJSZXEpIHtcbiAgZmV0Y2goJy9hY2NvdW50L2F2YXRhcicsIHtcbiAgICBtZXRob2Q6ICdQVVQnLFxuICAgIGhlYWRlcnM6IHtcbiAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICB9LFxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGF2YXRhclJlcSksXG4gICAgbW9kZTogJ2NvcnMnLFxuICAgIGNhY2hlOiAnZGVmYXVsdCcsXG4gICAgY3JlZGVudGlhbHM6ICdpbmNsdWRlJ1xuICB9KVxuICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgd2luZG93LmxvY2F0aW9uID0gJy9hY2NvdW50P21lc3NhZ2U9QXZhdGFyJTIwY2hhbmdlZCdcbiAgICB9KVxufVxuXG5cbi8vIGNoYW5nZSBlbWFpbFxudmFyIG5ld0VtYWlsU3VibWl0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI25ldy1lbWFpbC1zdWJtaXQnKVxuaWYgKG5ld0VtYWlsU3VibWl0KSB7XG4gIG5ld0VtYWlsU3VibWl0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cbiAgdmFyIG5ld0VtYWlsVmFsdWUgPSB7IGVtYWlsOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbmV3LXJlZy1lbWFpbCcpLnZhbHVlIH1cbiAgY2hhbmdlRW1haWwobmV3RW1haWxWYWx1ZSlcblxuICB9KVxufVxuXG5mdW5jdGlvbiBjaGFuZ2VFbWFpbChuZXdFbWFpbFZhbHVlKSB7XG4gIGZldGNoKCcvYWNjb3VudC9lbWFpbCcsIHtcbiAgICBtZXRob2Q6ICdQVVQnLFxuICAgIGhlYWRlcnM6IHtcbiAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICB9LFxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KG5ld0VtYWlsVmFsdWUpLFxuICAgIG1vZGU6ICdjb3JzJyxcbiAgICBjYWNoZTogJ2RlZmF1bHQnLFxuICAgIGNyZWRlbnRpYWxzOiAnaW5jbHVkZSdcbiAgfSlcbiAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgIHJldHVybiByZXMuanNvbigpXG4gICAgfSlcbiAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgIGlmIChyZXMubWVzc2FnZSA9PT0gJ0VtYWlsIGNoYW5nZWQnKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbiA9ICcvYWNjb3VudD9tZXNzYWdlPUVtYWlsJTIwY2hhbmdlZCdcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKHJlcy5lcnJvciA9PT0gJ1N1cHBseSBhbiBlbWFpbCBhZGRyZXNzJykge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24gPSAnL2FjY291bnQ/ZXJyb3I9U3VwcGx5JTIwYW4lMjBlbWFpbCUyMGFkZHJlc3MnXG4gICAgICB9XG4gICAgICBlbHNlIGlmIChyZXMuZXJyb3IgPT09ICdObyBzcGFjZXMgYWxsb3dlZCBpbiBlbWFpbCBhZGRyZXNzJykge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24gPSAnL2FjY291bnQ/ZXJyb3I9Tm8lMjBzcGFjZXMlMjBhbGxvd2VkJTIwaW4lMjBlbWFpbCUyMGFkZHJlc3MnXG4gICAgICB9XG4gICAgICBlbHNlIGlmIChyZXMuZXJyb3IgPT09ICdFbWFpbCBkb2VzIG5vdCBjb250YWluIEAnKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbiA9ICcvYWNjb3VudD9lcnJvcj1FbWFpbCUyMGRvZXMlMjBub3QlMjBjb250YWluJTIwQCdcbiAgICAgIH1cbiAgICB9KVxufVxuXG4vLyBjaGFuZ2UgcGFzc3dvcmRcbnZhciBuZXdQYXNzd29yZFN1Ym1pdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNuZXctcHctc3VibWl0JylcbmlmIChuZXdQYXNzd29yZFN1Ym1pdCkge1xuICBuZXdQYXNzd29yZFN1Ym1pdC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXG4gIHZhciBuZXdQVyA9IHsgXG4gICAgcGFzc3dvcmQ6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNuZXctcHcnKS52YWx1ZSxcbiAgICBwYXNzd29yZDI6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNuZXctcHcyJykudmFsdWUsXG4gIH1cblxuICBjaGFuZ2VQVyhuZXdQVylcblxuICB9KVxufVxuXG5mdW5jdGlvbiBjaGFuZ2VQVyhuZXdQVykge1xuICBmZXRjaCgnL2FjY291bnQvcGFzc3dvcmQnLCB7XG4gICAgbWV0aG9kOiAnUFVUJyxcbiAgICBoZWFkZXJzOiB7XG4gICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgfSxcbiAgICBib2R5OiBKU09OLnN0cmluZ2lmeShuZXdQVyksXG4gICAgbW9kZTogJ2NvcnMnLFxuICAgIGNhY2hlOiAnZGVmYXVsdCcsXG4gICAgY3JlZGVudGlhbHM6ICdpbmNsdWRlJ1xuICB9KVxuICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgcmV0dXJuIHJlcy5qc29uKClcbiAgICB9KVxuICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgaWYgKHJlcy5tZXNzYWdlID09PSAnUGFzc3dvcmQgY2hhbmdlZCcpIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uID0gJy9hY2NvdW50P21lc3NhZ2U9UGFzc3dvcmQlMjBjaGFuZ2VkJ1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAocmVzLmVycm9yID09PSAnU3VwcGx5IGEgcGFzc3dvcmQnKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbiA9ICcvYWNjb3VudD9lcnJvcj1TdXBwbHklMjBhJTIwcGFzc3dvcmQnXG4gICAgICB9XG4gICAgICBlbHNlIGlmIChyZXMuZXJyb3IgPT09ICdQYXNzd29yZCBtdXN0IGJlIGEgbWluaW11bSBvZiA1IGNoYXJhY3RlcnMnKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbiA9ICcvYWNjb3VudD9lcnJvcj1QYXNzd29yZCUyMG11c3QlMjBiZSUyMGElMjBtaW5pbXVtJTIwb2YlMjA1JTIwY2hhcmFjdGVycydcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKHJlcy5lcnJvciA9PT0gJ0NvbmZpcm0geW91ciBwYXNzd29yZCcpIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uID0gJy9hY2NvdW50P2Vycm9yPUNvbmZpcm0lMjB5b3VyJTIwcGFzc3dvcmQnXG4gICAgICB9XG4gICAgICBlbHNlIGlmIChyZXMuZXJyb3IgPT09ICdQYXNzd29yZHMgZG8gbm90IG1hdGNoJykge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24gPSAnL2FjY291bnQ/ZXJyb3I9UGFzc3dvcmRzJTIwZG8lMjBub3QlMjBtYXRjaCdcbiAgICAgIH1cbiAgICB9KVxufVxuXG4vLyBkZWxldGUgYWNjb3VudFxudmFyIHBvcERlbGV0ZVVzZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjcG9wLWRlbC11c2VyJylcbnZhciBhY2NvdW50TWFpbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhY2NvdW50LW1haW4nKVxuXG52YXIgZGVsZXRlQWNjb3VudFN1Ym1pdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNkZWxldGUtYWNjb3VudC1zdWJtaXQnKVxuaWYgKGRlbGV0ZUFjY291bnRTdWJtaXQpIHtcbiAgZGVsZXRlQWNjb3VudFN1Ym1pdC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgIHZhciBwb3BIVE1MID0gXCI8cD5Db25maXJtaW5nIHdpbGwgZGVsZXRlIHlvdXIgcHJvZmlsZS4gQXJlIHlvdSBzdXJlPzwvcD48ZGl2IGlkPSdwb3AtZGVsLW9wdGlvbnMnPjxidXR0b24gaWQ9J2RlbC15ZXMnPlllczwvYnV0dG9uPjxidXR0b24gaWQ9J2RlbC1ubyc+Tm88L2J1dHRvbj48L2Rpdj5cIlxuXG4gICAgZGl2LnNldEF0dHJpYnV0ZSgnaWQnLCAncG9wLWRlbCcpXG4gICAgZGl2LmlubmVySFRNTCA9IHBvcEhUTUxcbiAgICBhY2NvdW50TWFpbi5hcHBlbmRDaGlsZChkaXYpXG5cbiAgICB2YXIgZGVsTm8gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZGVsLW5vJylcbiAgICBpZiAoZGVsTm8pIHtcbiAgICAgIGRlbE5vLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBwb3BEZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjcG9wLWRlbCcpXG4gICAgICAgIHBvcERlbC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHBvcERlbClcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgdmFyIGRlbFllcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNkZWwteWVzJylcbiAgICBpZiAoZGVsWWVzKSB7XG4gICAgICBkZWxZZXMuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgZGVsZXRlVXNlcigpXG4gICAgICB9KVxuICAgIH1cblxuICB9KVxufVxuXG5mdW5jdGlvbiBkZWxldGVVc2VyKCkge1xuICBmZXRjaCgnL2FjY291bnQnLCB7XG4gICAgbWV0aG9kOiAnREVMRVRFJyxcbiAgICBoZWFkZXJzOiB7XG4gICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgfSxcbiAgICBtb2RlOiAnY29ycycsXG4gICAgY2FjaGU6ICdkZWZhdWx0JyxcbiAgICBjcmVkZW50aWFsczogJ2luY2x1ZGUnXG4gIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICB3aW5kb3cubG9jYXRpb24gPSAnLydcbiAgICB9KVxufSIsIi8qXG4gICAgZGF0ZXBpY2tyIDMuMCAtIHBpY2sgeW91ciBkYXRlIG5vdCB5b3VyIG5vc2VcblxuICAgIGh0dHBzOi8vZ2l0aHViLmNvbS9qb3Noc2FsdmVyZGEvZGF0ZXBpY2tyXG5cbiAgICBDb3B5cmlnaHQgwqkgMjAxNCBKb3NoIFNhbHZlcmRhIDxqb3NoLnNhbHZlcmRhQGdtYWlsLmNvbT5cbiAgICBUaGlzIHdvcmsgaXMgZnJlZS4gWW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSBpdCB1bmRlciB0aGVcbiAgICB0ZXJtcyBvZiB0aGUgRG8gV2hhdCBUaGUgRnVjayBZb3UgV2FudCBUbyBQdWJsaWMgTGljZW5zZSwgVmVyc2lvbiAyLFxuICAgIGFzIHB1Ymxpc2hlZCBieSBTYW0gSG9jZXZhci4gU2VlIGh0dHA6Ly93d3cud3RmcGwubmV0LyBmb3IgbW9yZSBkZXRhaWxzLlxuKi9cblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZ1bmN0aW9uKCkge1xuICBkYXRlcGlja3IoJyNkYXRlLXNlbGVjdCcpXG59KVxuXG52YXIgZGF0ZXBpY2tyID0gZnVuY3Rpb24gKHNlbGVjdG9yLCBjb25maWcpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgdmFyIGVsZW1lbnRzLFxuICAgICAgICBjcmVhdGVJbnN0YW5jZSxcbiAgICAgICAgaW5zdGFuY2VzID0gW10sXG4gICAgICAgIGk7XG5cbiAgICBkYXRlcGlja3IucHJvdG90eXBlID0gZGF0ZXBpY2tyLmluaXQucHJvdG90eXBlO1xuXG4gICAgY3JlYXRlSW5zdGFuY2UgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICBpZiAoZWxlbWVudC5fZGF0ZXBpY2tyKSB7XG4gICAgICAgICAgICBlbGVtZW50Ll9kYXRlcGlja3IuZGVzdHJveSgpO1xuICAgICAgICB9XG4gICAgICAgIGVsZW1lbnQuX2RhdGVwaWNrciA9IG5ldyBkYXRlcGlja3IuaW5pdChlbGVtZW50LCBjb25maWcpO1xuICAgICAgICByZXR1cm4gZWxlbWVudC5fZGF0ZXBpY2tyO1xuICAgIH07XG5cbiAgICBpZiAoc2VsZWN0b3Iubm9kZU5hbWUpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUluc3RhbmNlKHNlbGVjdG9yKTtcbiAgICB9XG5cbiAgICBlbGVtZW50cyA9IGRhdGVwaWNrci5wcm90b3R5cGUucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG5cbiAgICBpZiAoZWxlbWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVJbnN0YW5jZShlbGVtZW50c1swXSk7XG4gICAgfVxuXG4gICAgZm9yIChpID0gMDsgaSA8IGVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGluc3RhbmNlcy5wdXNoKGNyZWF0ZUluc3RhbmNlKGVsZW1lbnRzW2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBpbnN0YW5jZXM7XG59O1xuXG5kYXRlcGlja3IuaW5pdCA9IGZ1bmN0aW9uIChlbGVtZW50LCBpbnN0YW5jZUNvbmZpZykge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICAgIGRlZmF1bHRDb25maWcgPSB7XG4gICAgICAgICAgICBkYXRlRm9ybWF0OiAnRiBqLCBZJyxcbiAgICAgICAgICAgIGFsdEZvcm1hdDogbnVsbCxcbiAgICAgICAgICAgIGFsdElucHV0OiBudWxsLFxuICAgICAgICAgICAgbWluRGF0ZTogbnVsbCxcbiAgICAgICAgICAgIG1heERhdGU6IG51bGwsXG4gICAgICAgICAgICBzaG9ydGhhbmRDdXJyZW50TW9udGg6IGZhbHNlXG4gICAgICAgIH0sXG4gICAgICAgIGNhbGVuZGFyQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG4gICAgICAgIG5hdmlnYXRpb25DdXJyZW50TW9udGggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyksXG4gICAgICAgIGNhbGVuZGFyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGFibGUnKSxcbiAgICAgICAgY2FsZW5kYXJCb2R5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGJvZHknKSxcbiAgICAgICAgd3JhcHBlckVsZW1lbnQsXG4gICAgICAgIGN1cnJlbnREYXRlID0gbmV3IERhdGUoKSxcbiAgICAgICAgd3JhcCxcbiAgICAgICAgZGF0ZSxcbiAgICAgICAgZm9ybWF0RGF0ZSxcbiAgICAgICAgbW9udGhUb1N0cixcbiAgICAgICAgaXNTcGVjaWZpY0RheSxcbiAgICAgICAgYnVpbGRXZWVrZGF5cyxcbiAgICAgICAgYnVpbGREYXlzLFxuICAgICAgICB1cGRhdGVOYXZpZ2F0aW9uQ3VycmVudE1vbnRoLFxuICAgICAgICBidWlsZE1vbnRoTmF2aWdhdGlvbixcbiAgICAgICAgaGFuZGxlWWVhckNoYW5nZSxcbiAgICAgICAgZG9jdW1lbnRDbGljayxcbiAgICAgICAgY2FsZW5kYXJDbGljayxcbiAgICAgICAgYnVpbGRDYWxlbmRhcixcbiAgICAgICAgZ2V0T3BlbkV2ZW50LFxuICAgICAgICBiaW5kLFxuICAgICAgICBvcGVuLFxuICAgICAgICBjbG9zZSxcbiAgICAgICAgZGVzdHJveSxcbiAgICAgICAgaW5pdDtcblxuICAgIGNhbGVuZGFyQ29udGFpbmVyLmNsYXNzTmFtZSA9ICdkYXRlcGlja3ItY2FsZW5kYXInO1xuICAgIG5hdmlnYXRpb25DdXJyZW50TW9udGguY2xhc3NOYW1lID0gJ2RhdGVwaWNrci1jdXJyZW50LW1vbnRoJztcbiAgICBpbnN0YW5jZUNvbmZpZyA9IGluc3RhbmNlQ29uZmlnIHx8IHt9O1xuXG4gICAgd3JhcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgd3JhcHBlckVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgd3JhcHBlckVsZW1lbnQuY2xhc3NOYW1lID0gJ2RhdGVwaWNrci13cmFwcGVyJztcbiAgICAgICAgc2VsZi5lbGVtZW50LnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKHdyYXBwZXJFbGVtZW50LCBzZWxmLmVsZW1lbnQpO1xuICAgICAgICB3cmFwcGVyRWxlbWVudC5hcHBlbmRDaGlsZChzZWxmLmVsZW1lbnQpO1xuICAgIH07XG5cbiAgICBkYXRlID0ge1xuICAgICAgICBjdXJyZW50OiB7XG4gICAgICAgICAgICB5ZWFyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnREYXRlLmdldEZ1bGxZZWFyKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbW9udGg6IHtcbiAgICAgICAgICAgICAgICBpbnRlZ2VyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjdXJyZW50RGF0ZS5nZXRNb250aCgpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc3RyaW5nOiBmdW5jdGlvbiAoc2hvcnRoYW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBtb250aCA9IGN1cnJlbnREYXRlLmdldE1vbnRoKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtb250aFRvU3RyKG1vbnRoLCBzaG9ydGhhbmQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkYXk6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY3VycmVudERhdGUuZ2V0RGF0ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBtb250aDoge1xuICAgICAgICAgICAgc3RyaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1vbnRoVG9TdHIoc2VsZi5jdXJyZW50TW9udGhWaWV3LCBzZWxmLmNvbmZpZy5zaG9ydGhhbmRDdXJyZW50TW9udGgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG51bURheXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyBjaGVja3MgdG8gc2VlIGlmIGZlYnJ1YXJ5IGlzIGEgbGVhcCB5ZWFyIG90aGVyd2lzZSByZXR1cm4gdGhlIHJlc3BlY3RpdmUgIyBvZiBkYXlzXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYuY3VycmVudE1vbnRoVmlldyA9PT0gMSAmJiAoKChzZWxmLmN1cnJlbnRZZWFyVmlldyAlIDQgPT09IDApICYmIChzZWxmLmN1cnJlbnRZZWFyVmlldyAlIDEwMCAhPT0gMCkpIHx8IChzZWxmLmN1cnJlbnRZZWFyVmlldyAlIDQwMCA9PT0gMCkpID8gMjkgOiBzZWxmLmwxMG4uZGF5c0luTW9udGhbc2VsZi5jdXJyZW50TW9udGhWaWV3XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBmb3JtYXREYXRlID0gZnVuY3Rpb24gKGRhdGVGb3JtYXQsIG1pbGxpc2Vjb25kcykge1xuICAgICAgICB2YXIgZm9ybWF0dGVkRGF0ZSA9ICcnLFxuICAgICAgICAgICAgZGF0ZU9iaiA9IG5ldyBEYXRlKG1pbGxpc2Vjb25kcyksXG4gICAgICAgICAgICBmb3JtYXRzID0ge1xuICAgICAgICAgICAgICAgIGQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRheSA9IGZvcm1hdHMuaigpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKGRheSA8IDEwKSA/ICcwJyArIGRheSA6IGRheTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIEQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYubDEwbi53ZWVrZGF5cy5zaG9ydGhhbmRbZm9ybWF0cy53KCldO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgajogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGF0ZU9iai5nZXREYXRlKCk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLmwxMG4ud2Vla2RheXMubG9uZ2hhbmRbZm9ybWF0cy53KCldO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGF0ZU9iai5nZXREYXkoKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIEY6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1vbnRoVG9TdHIoZm9ybWF0cy5uKCkgLSAxLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBtOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBtb250aCA9IGZvcm1hdHMubigpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKG1vbnRoIDwgMTApID8gJzAnICsgbW9udGggOiBtb250aDtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIE06IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1vbnRoVG9TdHIoZm9ybWF0cy5uKCkgLSAxLCB0cnVlKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG46IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRhdGVPYmouZ2V0TW9udGgoKSArIDE7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBVOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkYXRlT2JqLmdldFRpbWUoKSAvIDEwMDA7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB5OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBTdHJpbmcoZm9ybWF0cy5ZKCkpLnN1YnN0cmluZygyKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIFk6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRhdGVPYmouZ2V0RnVsbFllYXIoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZm9ybWF0UGllY2VzID0gZGF0ZUZvcm1hdC5zcGxpdCgnJyk7XG5cbiAgICAgICAgc2VsZi5mb3JFYWNoKGZvcm1hdFBpZWNlcywgZnVuY3Rpb24gKGZvcm1hdFBpZWNlLCBpbmRleCkge1xuICAgICAgICAgICAgaWYgKGZvcm1hdHNbZm9ybWF0UGllY2VdICYmIGZvcm1hdFBpZWNlc1tpbmRleCAtIDFdICE9PSAnXFxcXCcpIHtcbiAgICAgICAgICAgICAgICBmb3JtYXR0ZWREYXRlICs9IGZvcm1hdHNbZm9ybWF0UGllY2VdKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChmb3JtYXRQaWVjZSAhPT0gJ1xcXFwnKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvcm1hdHRlZERhdGUgKz0gZm9ybWF0UGllY2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gZm9ybWF0dGVkRGF0ZTtcbiAgICB9O1xuXG4gICAgbW9udGhUb1N0ciA9IGZ1bmN0aW9uIChkYXRlLCBzaG9ydGhhbmQpIHtcbiAgICAgICAgaWYgKHNob3J0aGFuZCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIHNlbGYubDEwbi5tb250aHMuc2hvcnRoYW5kW2RhdGVdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHNlbGYubDEwbi5tb250aHMubG9uZ2hhbmRbZGF0ZV07XG4gICAgfTtcblxuICAgIGlzU3BlY2lmaWNEYXkgPSBmdW5jdGlvbiAoZGF5LCBtb250aCwgeWVhciwgY29tcGFyaXNvbikge1xuICAgICAgICByZXR1cm4gZGF5ID09PSBjb21wYXJpc29uICYmIHNlbGYuY3VycmVudE1vbnRoVmlldyA9PT0gbW9udGggJiYgc2VsZi5jdXJyZW50WWVhclZpZXcgPT09IHllYXI7XG4gICAgfTtcblxuICAgIGJ1aWxkV2Vla2RheXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB3ZWVrZGF5Q29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGhlYWQnKSxcbiAgICAgICAgICAgIGZpcnN0RGF5T2ZXZWVrID0gc2VsZi5sMTBuLmZpcnN0RGF5T2ZXZWVrLFxuICAgICAgICAgICAgd2Vla2RheXMgPSBzZWxmLmwxMG4ud2Vla2RheXMuc2hvcnRoYW5kO1xuXG4gICAgICAgIGlmIChmaXJzdERheU9mV2VlayA+IDAgJiYgZmlyc3REYXlPZldlZWsgPCB3ZWVrZGF5cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHdlZWtkYXlzID0gW10uY29uY2F0KHdlZWtkYXlzLnNwbGljZShmaXJzdERheU9mV2Vlaywgd2Vla2RheXMubGVuZ3RoKSwgd2Vla2RheXMuc3BsaWNlKDAsIGZpcnN0RGF5T2ZXZWVrKSk7XG4gICAgICAgIH1cblxuICAgICAgICB3ZWVrZGF5Q29udGFpbmVyLmlubmVySFRNTCA9ICc8dHI+PHRoPicgKyB3ZWVrZGF5cy5qb2luKCc8L3RoPjx0aD4nKSArICc8L3RoPjwvdHI+JztcbiAgICAgICAgY2FsZW5kYXIuYXBwZW5kQ2hpbGQod2Vla2RheUNvbnRhaW5lcik7XG4gICAgfTtcblxuICAgIGJ1aWxkRGF5cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGZpcnN0T2ZNb250aCA9IG5ldyBEYXRlKHNlbGYuY3VycmVudFllYXJWaWV3LCBzZWxmLmN1cnJlbnRNb250aFZpZXcsIDEpLmdldERheSgpLFxuICAgICAgICAgICAgbnVtRGF5cyA9IGRhdGUubW9udGgubnVtRGF5cygpLFxuICAgICAgICAgICAgY2FsZW5kYXJGcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKSxcbiAgICAgICAgICAgIHJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RyJyksXG4gICAgICAgICAgICBkYXlDb3VudCxcbiAgICAgICAgICAgIGRheU51bWJlcixcbiAgICAgICAgICAgIHRvZGF5ID0gJycsXG4gICAgICAgICAgICBzZWxlY3RlZCA9ICcnLFxuICAgICAgICAgICAgZGlzYWJsZWQgPSAnJyxcbiAgICAgICAgICAgIGN1cnJlbnRUaW1lc3RhbXA7XG5cbiAgICAgICAgLy8gT2Zmc2V0IHRoZSBmaXJzdCBkYXkgYnkgdGhlIHNwZWNpZmllZCBhbW91bnRcbiAgICAgICAgZmlyc3RPZk1vbnRoIC09IHNlbGYubDEwbi5maXJzdERheU9mV2VlaztcbiAgICAgICAgaWYgKGZpcnN0T2ZNb250aCA8IDApIHtcbiAgICAgICAgICAgIGZpcnN0T2ZNb250aCArPSA3O1xuICAgICAgICB9XG5cbiAgICAgICAgZGF5Q291bnQgPSBmaXJzdE9mTW9udGg7XG4gICAgICAgIGNhbGVuZGFyQm9keS5pbm5lckhUTUwgPSAnJztcblxuICAgICAgICAvLyBBZGQgc3BhY2VyIHRvIGxpbmUgdXAgdGhlIGZpcnN0IGRheSBvZiB0aGUgbW9udGggY29ycmVjdGx5XG4gICAgICAgIGlmIChmaXJzdE9mTW9udGggPiAwKSB7XG4gICAgICAgICAgICByb3cuaW5uZXJIVE1MICs9ICc8dGQgY29sc3Bhbj1cIicgKyBmaXJzdE9mTW9udGggKyAnXCI+Jm5ic3A7PC90ZD4nO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU3RhcnQgYXQgMSBzaW5jZSB0aGVyZSBpcyBubyAwdGggZGF5XG4gICAgICAgIGZvciAoZGF5TnVtYmVyID0gMTsgZGF5TnVtYmVyIDw9IG51bURheXM7IGRheU51bWJlcisrKSB7XG4gICAgICAgICAgICAvLyBpZiB3ZSBoYXZlIHJlYWNoZWQgdGhlIGVuZCBvZiBhIHdlZWssIHdyYXAgdG8gdGhlIG5leHQgbGluZVxuICAgICAgICAgICAgaWYgKGRheUNvdW50ID09PSA3KSB7XG4gICAgICAgICAgICAgICAgY2FsZW5kYXJGcmFnbWVudC5hcHBlbmRDaGlsZChyb3cpO1xuICAgICAgICAgICAgICAgIHJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RyJyk7XG4gICAgICAgICAgICAgICAgZGF5Q291bnQgPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0b2RheSA9IGlzU3BlY2lmaWNEYXkoZGF0ZS5jdXJyZW50LmRheSgpLCBkYXRlLmN1cnJlbnQubW9udGguaW50ZWdlcigpLCBkYXRlLmN1cnJlbnQueWVhcigpLCBkYXlOdW1iZXIpID8gJyB0b2RheScgOiAnJztcbiAgICAgICAgICAgIGlmIChzZWxmLnNlbGVjdGVkRGF0ZSkge1xuICAgICAgICAgICAgICAgIHNlbGVjdGVkID0gaXNTcGVjaWZpY0RheShzZWxmLnNlbGVjdGVkRGF0ZS5kYXksIHNlbGYuc2VsZWN0ZWREYXRlLm1vbnRoLCBzZWxmLnNlbGVjdGVkRGF0ZS55ZWFyLCBkYXlOdW1iZXIpID8gJyBzZWxlY3RlZCcgOiAnJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHNlbGYuY29uZmlnLm1pbkRhdGUgfHwgc2VsZi5jb25maWcubWF4RGF0ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRUaW1lc3RhbXAgPSBuZXcgRGF0ZShzZWxmLmN1cnJlbnRZZWFyVmlldywgc2VsZi5jdXJyZW50TW9udGhWaWV3LCBkYXlOdW1iZXIpLmdldFRpbWUoKTtcbiAgICAgICAgICAgICAgICBkaXNhYmxlZCA9ICcnO1xuXG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuY29uZmlnLm1pbkRhdGUgJiYgY3VycmVudFRpbWVzdGFtcCA8IHNlbGYuY29uZmlnLm1pbkRhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQgPSAnIGRpc2FibGVkJztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoc2VsZi5jb25maWcubWF4RGF0ZSAmJiBjdXJyZW50VGltZXN0YW1wID4gc2VsZi5jb25maWcubWF4RGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZCA9ICcgZGlzYWJsZWQnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcm93LmlubmVySFRNTCArPSAnPHRkIGNsYXNzPVwiJyArIHRvZGF5ICsgc2VsZWN0ZWQgKyBkaXNhYmxlZCArICdcIj48c3BhbiBjbGFzcz1cImRhdGVwaWNrci1kYXlcIj4nICsgZGF5TnVtYmVyICsgJzwvc3Bhbj48L3RkPic7XG4gICAgICAgICAgICBkYXlDb3VudCsrO1xuICAgICAgICB9XG5cbiAgICAgICAgY2FsZW5kYXJGcmFnbWVudC5hcHBlbmRDaGlsZChyb3cpO1xuICAgICAgICBjYWxlbmRhckJvZHkuYXBwZW5kQ2hpbGQoY2FsZW5kYXJGcmFnbWVudCk7XG4gICAgfTtcblxuICAgIHVwZGF0ZU5hdmlnYXRpb25DdXJyZW50TW9udGggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG5hdmlnYXRpb25DdXJyZW50TW9udGguaW5uZXJIVE1MID0gZGF0ZS5tb250aC5zdHJpbmcoKSArICcgJyArIHNlbGYuY3VycmVudFllYXJWaWV3O1xuICAgIH07XG5cbiAgICBidWlsZE1vbnRoTmF2aWdhdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG1vbnRocyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuICAgICAgICAgICAgbW9udGhOYXZpZ2F0aW9uO1xuXG4gICAgICAgIG1vbnRoTmF2aWdhdGlvbiAgPSAnPHNwYW4gY2xhc3M9XCJkYXRlcGlja3ItcHJldi1tb250aFwiPiZsdDs8L3NwYW4+JztcbiAgICAgICAgbW9udGhOYXZpZ2F0aW9uICs9ICc8c3BhbiBjbGFzcz1cImRhdGVwaWNrci1uZXh0LW1vbnRoXCI+Jmd0Ozwvc3Bhbj4nO1xuXG4gICAgICAgIG1vbnRocy5jbGFzc05hbWUgPSAnZGF0ZXBpY2tyLW1vbnRocyc7XG4gICAgICAgIG1vbnRocy5pbm5lckhUTUwgPSBtb250aE5hdmlnYXRpb247XG5cbiAgICAgICAgbW9udGhzLmFwcGVuZENoaWxkKG5hdmlnYXRpb25DdXJyZW50TW9udGgpO1xuICAgICAgICB1cGRhdGVOYXZpZ2F0aW9uQ3VycmVudE1vbnRoKCk7XG4gICAgICAgIGNhbGVuZGFyQ29udGFpbmVyLmFwcGVuZENoaWxkKG1vbnRocyk7XG4gICAgfTtcblxuICAgIGhhbmRsZVllYXJDaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChzZWxmLmN1cnJlbnRNb250aFZpZXcgPCAwKSB7XG4gICAgICAgICAgICBzZWxmLmN1cnJlbnRZZWFyVmlldy0tO1xuICAgICAgICAgICAgc2VsZi5jdXJyZW50TW9udGhWaWV3ID0gMTE7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2VsZi5jdXJyZW50TW9udGhWaWV3ID4gMTEpIHtcbiAgICAgICAgICAgIHNlbGYuY3VycmVudFllYXJWaWV3Kys7XG4gICAgICAgICAgICBzZWxmLmN1cnJlbnRNb250aFZpZXcgPSAwO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGRvY3VtZW50Q2xpY2sgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIHBhcmVudDtcbiAgICAgICAgaWYgKGV2ZW50LnRhcmdldCAhPT0gc2VsZi5lbGVtZW50ICYmIGV2ZW50LnRhcmdldCAhPT0gd3JhcHBlckVsZW1lbnQpIHtcbiAgICAgICAgICAgIHBhcmVudCA9IGV2ZW50LnRhcmdldC5wYXJlbnROb2RlO1xuICAgICAgICAgICAgaWYgKHBhcmVudCAhPT0gd3JhcHBlckVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICB3aGlsZSAocGFyZW50ICE9PSB3cmFwcGVyRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50Tm9kZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhcmVudCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIGNhbGVuZGFyQ2xpY2sgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIHRhcmdldCA9IGV2ZW50LnRhcmdldCxcbiAgICAgICAgICAgIHRhcmdldENsYXNzID0gdGFyZ2V0LmNsYXNzTmFtZSxcbiAgICAgICAgICAgIGN1cnJlbnRUaW1lc3RhbXA7XG5cbiAgICAgICAgaWYgKHRhcmdldENsYXNzKSB7XG4gICAgICAgICAgICBpZiAodGFyZ2V0Q2xhc3MgPT09ICdkYXRlcGlja3ItcHJldi1tb250aCcgfHwgdGFyZ2V0Q2xhc3MgPT09ICdkYXRlcGlja3ItbmV4dC1tb250aCcpIHtcbiAgICAgICAgICAgICAgICBpZiAodGFyZ2V0Q2xhc3MgPT09ICdkYXRlcGlja3ItcHJldi1tb250aCcpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5jdXJyZW50TW9udGhWaWV3LS07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5jdXJyZW50TW9udGhWaWV3Kys7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaGFuZGxlWWVhckNoYW5nZSgpO1xuICAgICAgICAgICAgICAgIHVwZGF0ZU5hdmlnYXRpb25DdXJyZW50TW9udGgoKTtcbiAgICAgICAgICAgICAgICBidWlsZERheXMoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGFyZ2V0Q2xhc3MgPT09ICdkYXRlcGlja3ItZGF5JyAmJiAhc2VsZi5oYXNDbGFzcyh0YXJnZXQucGFyZW50Tm9kZSwgJ2Rpc2FibGVkJykpIHtcbiAgICAgICAgICAgICAgICBzZWxmLnNlbGVjdGVkRGF0ZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgZGF5OiBwYXJzZUludCh0YXJnZXQuaW5uZXJIVE1MLCAxMCksXG4gICAgICAgICAgICAgICAgICAgIG1vbnRoOiBzZWxmLmN1cnJlbnRNb250aFZpZXcsXG4gICAgICAgICAgICAgICAgICAgIHllYXI6IHNlbGYuY3VycmVudFllYXJWaWV3XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGN1cnJlbnRUaW1lc3RhbXAgPSBuZXcgRGF0ZShzZWxmLmN1cnJlbnRZZWFyVmlldywgc2VsZi5jdXJyZW50TW9udGhWaWV3LCBzZWxmLnNlbGVjdGVkRGF0ZS5kYXkpLmdldFRpbWUoKTtcblxuICAgICAgICAgICAgICAgIGlmIChzZWxmLmNvbmZpZy5hbHRJbnB1dCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5jb25maWcuYWx0Rm9ybWF0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmNvbmZpZy5hbHRJbnB1dC52YWx1ZSA9IGZvcm1hdERhdGUoc2VsZi5jb25maWcuYWx0Rm9ybWF0LCBjdXJyZW50VGltZXN0YW1wKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEkgZG9uJ3Qga25vdyB3aHkgc29tZW9uZSB3b3VsZCB3YW50IHRvIGRvIHRoaXMuLi4gYnV0IGp1c3QgaW4gY2FzZT9cbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuY29uZmlnLmFsdElucHV0LnZhbHVlID0gZm9ybWF0RGF0ZShzZWxmLmNvbmZpZy5kYXRlRm9ybWF0LCBjdXJyZW50VGltZXN0YW1wKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC52YWx1ZSA9IGZvcm1hdERhdGUoc2VsZi5jb25maWcuZGF0ZUZvcm1hdCwgY3VycmVudFRpbWVzdGFtcCk7XG5cbiAgICAgICAgICAgICAgICBjbG9zZSgpO1xuICAgICAgICAgICAgICAgIGJ1aWxkRGF5cygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIGJ1aWxkQ2FsZW5kYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGJ1aWxkTW9udGhOYXZpZ2F0aW9uKCk7XG4gICAgICAgIGJ1aWxkV2Vla2RheXMoKTtcbiAgICAgICAgYnVpbGREYXlzKCk7XG5cbiAgICAgICAgY2FsZW5kYXIuYXBwZW5kQ2hpbGQoY2FsZW5kYXJCb2R5KTtcbiAgICAgICAgY2FsZW5kYXJDb250YWluZXIuYXBwZW5kQ2hpbGQoY2FsZW5kYXIpO1xuXG4gICAgICAgIHdyYXBwZXJFbGVtZW50LmFwcGVuZENoaWxkKGNhbGVuZGFyQ29udGFpbmVyKTtcbiAgICB9O1xuXG4gICAgZ2V0T3BlbkV2ZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoc2VsZi5lbGVtZW50Lm5vZGVOYW1lID09PSAnSU5QVVQnKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2ZvY3VzJztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJ2NsaWNrJztcbiAgICB9O1xuXG4gICAgYmluZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2VsZi5hZGRFdmVudExpc3RlbmVyKHNlbGYuZWxlbWVudCwgZ2V0T3BlbkV2ZW50KCksIG9wZW4pO1xuICAgICAgICBzZWxmLmFkZEV2ZW50TGlzdGVuZXIoY2FsZW5kYXJDb250YWluZXIsICdjbGljaycsIGNhbGVuZGFyQ2xpY2spO1xuICAgIH07XG5cbiAgICBvcGVuID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLmFkZEV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdjbGljaycsIGRvY3VtZW50Q2xpY2spO1xuICAgICAgICBzZWxmLmFkZENsYXNzKHdyYXBwZXJFbGVtZW50LCAnb3BlbicpO1xuICAgIH07XG5cbiAgICBjbG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2VsZi5yZW1vdmVFdmVudExpc3RlbmVyKGRvY3VtZW50LCAnY2xpY2snLCBkb2N1bWVudENsaWNrKTtcbiAgICAgICAgc2VsZi5yZW1vdmVDbGFzcyh3cmFwcGVyRWxlbWVudCwgJ29wZW4nKTtcbiAgICB9O1xuXG4gICAgZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHBhcmVudCxcbiAgICAgICAgICAgIGVsZW1lbnQ7XG5cbiAgICAgICAgc2VsZi5yZW1vdmVFdmVudExpc3RlbmVyKGRvY3VtZW50LCAnY2xpY2snLCBkb2N1bWVudENsaWNrKTtcbiAgICAgICAgc2VsZi5yZW1vdmVFdmVudExpc3RlbmVyKHNlbGYuZWxlbWVudCwgZ2V0T3BlbkV2ZW50KCksIG9wZW4pO1xuXG4gICAgICAgIHBhcmVudCA9IHNlbGYuZWxlbWVudC5wYXJlbnROb2RlO1xuICAgICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQoY2FsZW5kYXJDb250YWluZXIpO1xuICAgICAgICBlbGVtZW50ID0gcGFyZW50LnJlbW92ZUNoaWxkKHNlbGYuZWxlbWVudCk7XG4gICAgICAgIHBhcmVudC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChlbGVtZW50LCBwYXJlbnQpO1xuICAgIH07XG5cbiAgICBpbml0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY29uZmlnLFxuICAgICAgICAgICAgcGFyc2VkRGF0ZTtcblxuICAgICAgICBzZWxmLmNvbmZpZyA9IHt9O1xuICAgICAgICBzZWxmLmRlc3Ryb3kgPSBkZXN0cm95O1xuXG4gICAgICAgIGZvciAoY29uZmlnIGluIGRlZmF1bHRDb25maWcpIHtcbiAgICAgICAgICAgIHNlbGYuY29uZmlnW2NvbmZpZ10gPSBpbnN0YW5jZUNvbmZpZ1tjb25maWddIHx8IGRlZmF1bHRDb25maWdbY29uZmlnXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYuZWxlbWVudCA9IGVsZW1lbnQ7XG5cbiAgICAgICAgaWYgKHNlbGYuZWxlbWVudC52YWx1ZSkge1xuICAgICAgICAgICAgcGFyc2VkRGF0ZSA9IERhdGUucGFyc2Uoc2VsZi5lbGVtZW50LnZhbHVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwYXJzZWREYXRlICYmICFpc05hTihwYXJzZWREYXRlKSkge1xuICAgICAgICAgICAgcGFyc2VkRGF0ZSA9IG5ldyBEYXRlKHBhcnNlZERhdGUpO1xuICAgICAgICAgICAgc2VsZi5zZWxlY3RlZERhdGUgPSB7XG4gICAgICAgICAgICAgICAgZGF5OiBwYXJzZWREYXRlLmdldERhdGUoKSxcbiAgICAgICAgICAgICAgICBtb250aDogcGFyc2VkRGF0ZS5nZXRNb250aCgpLFxuICAgICAgICAgICAgICAgIHllYXI6IHBhcnNlZERhdGUuZ2V0RnVsbFllYXIoKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHNlbGYuY3VycmVudFllYXJWaWV3ID0gc2VsZi5zZWxlY3RlZERhdGUueWVhcjtcbiAgICAgICAgICAgIHNlbGYuY3VycmVudE1vbnRoVmlldyA9IHNlbGYuc2VsZWN0ZWREYXRlLm1vbnRoO1xuICAgICAgICAgICAgc2VsZi5jdXJyZW50RGF5VmlldyA9IHNlbGYuc2VsZWN0ZWREYXRlLmRheTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlbGYuc2VsZWN0ZWREYXRlID0gbnVsbDtcbiAgICAgICAgICAgIHNlbGYuY3VycmVudFllYXJWaWV3ID0gZGF0ZS5jdXJyZW50LnllYXIoKTtcbiAgICAgICAgICAgIHNlbGYuY3VycmVudE1vbnRoVmlldyA9IGRhdGUuY3VycmVudC5tb250aC5pbnRlZ2VyKCk7XG4gICAgICAgICAgICBzZWxmLmN1cnJlbnREYXlWaWV3ID0gZGF0ZS5jdXJyZW50LmRheSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgd3JhcCgpO1xuICAgICAgICBidWlsZENhbGVuZGFyKCk7XG4gICAgICAgIGJpbmQoKTtcbiAgICB9O1xuXG4gICAgaW5pdCgpO1xuXG4gICAgcmV0dXJuIHNlbGY7XG59O1xuXG5kYXRlcGlja3IuaW5pdC5wcm90b3R5cGUgPSB7XG4gICAgaGFzQ2xhc3M6IGZ1bmN0aW9uIChlbGVtZW50LCBjbGFzc05hbWUpIHsgcmV0dXJuIGVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKGNsYXNzTmFtZSk7IH0sXG4gICAgYWRkQ2xhc3M6IGZ1bmN0aW9uIChlbGVtZW50LCBjbGFzc05hbWUpIHsgZWxlbWVudC5jbGFzc0xpc3QuYWRkKGNsYXNzTmFtZSk7IH0sXG4gICAgcmVtb3ZlQ2xhc3M6IGZ1bmN0aW9uIChlbGVtZW50LCBjbGFzc05hbWUpIHsgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKGNsYXNzTmFtZSk7IH0sXG4gICAgZm9yRWFjaDogZnVuY3Rpb24gKGl0ZW1zLCBjYWxsYmFjaykgeyBbXS5mb3JFYWNoLmNhbGwoaXRlbXMsIGNhbGxiYWNrKTsgfSxcbiAgICBxdWVyeVNlbGVjdG9yQWxsOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsLmJpbmQoZG9jdW1lbnQpLFxuICAgIGlzQXJyYXk6IEFycmF5LmlzQXJyYXksXG4gICAgYWRkRXZlbnRMaXN0ZW5lcjogZnVuY3Rpb24gKGVsZW1lbnQsIHR5cGUsIGxpc3RlbmVyLCB1c2VDYXB0dXJlKSB7XG4gICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSk7XG4gICAgfSxcbiAgICByZW1vdmVFdmVudExpc3RlbmVyOiBmdW5jdGlvbiAoZWxlbWVudCwgdHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpIHtcbiAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyLCB1c2VDYXB0dXJlKTtcbiAgICB9LFxuICAgIGwxMG46IHtcbiAgICAgICAgd2Vla2RheXM6IHtcbiAgICAgICAgICAgIHNob3J0aGFuZDogWydTdW4nLCAnTW9uJywgJ1R1ZScsICdXZWQnLCAnVGh1JywgJ0ZyaScsICdTYXQnXSxcbiAgICAgICAgICAgIGxvbmdoYW5kOiBbJ1N1bmRheScsICdNb25kYXknLCAnVHVlc2RheScsICdXZWRuZXNkYXknLCAnVGh1cnNkYXknLCAnRnJpZGF5JywgJ1NhdHVyZGF5J11cbiAgICAgICAgfSxcbiAgICAgICAgbW9udGhzOiB7XG4gICAgICAgICAgICBzaG9ydGhhbmQ6IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLCAnT2N0JywgJ05vdicsICdEZWMnXSxcbiAgICAgICAgICAgIGxvbmdoYW5kOiBbJ0phbnVhcnknLCAnRmVicnVhcnknLCAnTWFyY2gnLCAnQXByaWwnLCAnTWF5JywgJ0p1bmUnLCAnSnVseScsICdBdWd1c3QnLCAnU2VwdGVtYmVyJywgJ09jdG9iZXInLCAnTm92ZW1iZXInLCAnRGVjZW1iZXInXVxuICAgICAgICB9LFxuICAgICAgICBkYXlzSW5Nb250aDogWzMxLCAyOCwgMzEsIDMwLCAzMSwgMzAsIDMxLCAzMSwgMzAsIDMxLCAzMCwgMzFdLFxuICAgICAgICBmaXJzdERheU9mV2VlazogMFxuICAgIH1cbn07XG4iLCIndXNlIHN0cmljdCdcblxudmFyIGhhbWJ1cmdlciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNoYW1idXJnZXInKVxuXG5pZiAoaGFtYnVyZ2VyKSB7XG4gIGhhbWJ1cmdlci5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBtb2JpbGVPdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbW9iaWxlLW91dCcpXG5cbiAgICBpZiAobW9iaWxlT3V0LmNsYXNzTGlzdC5jb250YWlucygndmlzaWJsZScpKSB7XG5cbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIG1vYmlsZU91dC5jbGFzc0xpc3QuYWRkKCdhbmltYXRlTmF2JylcbiAgICAgICAgbW9iaWxlT3V0LmNsYXNzTGlzdC50b2dnbGUoJ25hdi1vcGVuJylcblxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIG1vYmlsZU91dC5jbGFzc0xpc3QucmVtb3ZlKCd2aXNpYmxlJylcbiAgICAgICAgfSwgNDAwKVxuXG4gICAgICB9LCAwKVxuICAgICAgXG4gICAgfVxuXG4gICAgZWxzZSB7XG5cbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIG1vYmlsZU91dC5jbGFzc0xpc3QuYWRkKCd2aXNpYmxlJylcblxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIG1vYmlsZU91dC5jbGFzc0xpc3QuYWRkKCdhbmltYXRlTmF2JylcbiAgICAgICAgICBtb2JpbGVPdXQuY2xhc3NMaXN0LnRvZ2dsZSgnbmF2LW9wZW4nKVxuXG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIG1vYmlsZU91dC5jbGFzc0xpc3QucmVtb3ZlKCdhbmltYXRlTmF2JylcbiAgICAgICAgICB9LCA0MDApXG5cbiAgICAgICAgfSwgMTAwKVxuXG4gICAgICB9LCAwKVxuXG4gICAgfVxuICAgIFxuICB9KVxufSIsIi8qXG4gIFNvcnRUYWJsZVxuICB2ZXJzaW9uIDJcbiAgN3RoIEFwcmlsIDIwMDdcbiAgU3R1YXJ0IExhbmdyaWRnZSwgaHR0cDovL3d3dy5rcnlvZ2VuaXgub3JnL2NvZGUvYnJvd3Nlci9zb3J0dGFibGUvXG5cbiAgSW5zdHJ1Y3Rpb25zOlxuICBEb3dubG9hZCB0aGlzIGZpbGVcbiAgQWRkIDxzY3JpcHQgc3JjPVwic29ydHRhYmxlLmpzXCI+PC9zY3JpcHQ+IHRvIHlvdXIgSFRNTFxuICBBZGQgY2xhc3M9XCJzb3J0YWJsZVwiIHRvIGFueSB0YWJsZSB5b3UnZCBsaWtlIHRvIG1ha2Ugc29ydGFibGVcbiAgQ2xpY2sgb24gdGhlIGhlYWRlcnMgdG8gc29ydFxuXG4gIFRoYW5rcyB0byBtYW55LCBtYW55IHBlb3BsZSBmb3IgY29udHJpYnV0aW9ucyBhbmQgc3VnZ2VzdGlvbnMuXG4gIExpY2VuY2VkIGFzIFgxMTogaHR0cDovL3d3dy5rcnlvZ2VuaXgub3JnL2NvZGUvYnJvd3Nlci9saWNlbmNlLmh0bWxcbiAgVGhpcyBiYXNpY2FsbHkgbWVhbnM6IGRvIHdoYXQgeW91IHdhbnQgd2l0aCBpdC5cbiovXG5cblxudmFyIHN0SXNJRSA9IC8qQGNjX29uIUAqL2ZhbHNlO1xuXG5zb3J0dGFibGUgPSB7XG4gIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgIC8vIHF1aXQgaWYgdGhpcyBmdW5jdGlvbiBoYXMgYWxyZWFkeSBiZWVuIGNhbGxlZFxuICAgIGlmIChhcmd1bWVudHMuY2FsbGVlLmRvbmUpIHJldHVybjtcbiAgICAvLyBmbGFnIHRoaXMgZnVuY3Rpb24gc28gd2UgZG9uJ3QgZG8gdGhlIHNhbWUgdGhpbmcgdHdpY2VcbiAgICBhcmd1bWVudHMuY2FsbGVlLmRvbmUgPSB0cnVlO1xuICAgIC8vIGtpbGwgdGhlIHRpbWVyXG4gICAgaWYgKF90aW1lcikgY2xlYXJJbnRlcnZhbChfdGltZXIpO1xuXG4gICAgaWYgKCFkb2N1bWVudC5jcmVhdGVFbGVtZW50IHx8ICFkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSkgcmV0dXJuO1xuXG4gICAgc29ydHRhYmxlLkRBVEVfUkUgPSAvXihcXGRcXGQ/KVtcXC9cXC4tXShcXGRcXGQ/KVtcXC9cXC4tXSgoXFxkXFxkKT9cXGRcXGQpJC87XG5cbiAgICBmb3JFYWNoKGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCd0YWJsZScpLCBmdW5jdGlvbih0YWJsZSkge1xuICAgICAgaWYgKHRhYmxlLmNsYXNzTmFtZS5zZWFyY2goL1xcYnNvcnRhYmxlXFxiLykgIT0gLTEpIHtcbiAgICAgICAgc29ydHRhYmxlLm1ha2VTb3J0YWJsZSh0YWJsZSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgfSxcblxuICBtYWtlU29ydGFibGU6IGZ1bmN0aW9uKHRhYmxlKSB7XG4gICAgaWYgKHRhYmxlLmdldEVsZW1lbnRzQnlUYWdOYW1lKCd0aGVhZCcpLmxlbmd0aCA9PSAwKSB7XG4gICAgICAvLyB0YWJsZSBkb2Vzbid0IGhhdmUgYSB0SGVhZC4gU2luY2UgaXQgc2hvdWxkIGhhdmUsIGNyZWF0ZSBvbmUgYW5kXG4gICAgICAvLyBwdXQgdGhlIGZpcnN0IHRhYmxlIHJvdyBpbiBpdC5cbiAgICAgIHRoZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RoZWFkJyk7XG4gICAgICB0aGUuYXBwZW5kQ2hpbGQodGFibGUucm93c1swXSk7XG4gICAgICB0YWJsZS5pbnNlcnRCZWZvcmUodGhlLHRhYmxlLmZpcnN0Q2hpbGQpO1xuICAgIH1cbiAgICAvLyBTYWZhcmkgZG9lc24ndCBzdXBwb3J0IHRhYmxlLnRIZWFkLCBzaWdoXG4gICAgaWYgKHRhYmxlLnRIZWFkID09IG51bGwpIHRhYmxlLnRIZWFkID0gdGFibGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3RoZWFkJylbMF07XG5cbiAgICBpZiAodGFibGUudEhlYWQucm93cy5sZW5ndGggIT0gMSkgcmV0dXJuOyAvLyBjYW4ndCBjb3BlIHdpdGggdHdvIGhlYWRlciByb3dzXG5cbiAgICAvLyBTb3J0dGFibGUgdjEgcHV0IHJvd3Mgd2l0aCBhIGNsYXNzIG9mIFwic29ydGJvdHRvbVwiIGF0IHRoZSBib3R0b20gKGFzXG4gICAgLy8gXCJ0b3RhbFwiIHJvd3MsIGZvciBleGFtcGxlKS4gVGhpcyBpcyBCJlIsIHNpbmNlIHdoYXQgeW91J3JlIHN1cHBvc2VkXG4gICAgLy8gdG8gZG8gaXMgcHV0IHRoZW0gaW4gYSB0Zm9vdC4gU28sIGlmIHRoZXJlIGFyZSBzb3J0Ym90dG9tIHJvd3MsXG4gICAgLy8gZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5LCBtb3ZlIHRoZW0gdG8gdGZvb3QgKGNyZWF0aW5nIGl0IGlmIG5lZWRlZCkuXG4gICAgc29ydGJvdHRvbXJvd3MgPSBbXTtcbiAgICBmb3IgKHZhciBpPTA7IGk8dGFibGUucm93cy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHRhYmxlLnJvd3NbaV0uY2xhc3NOYW1lLnNlYXJjaCgvXFxic29ydGJvdHRvbVxcYi8pICE9IC0xKSB7XG4gICAgICAgIHNvcnRib3R0b21yb3dzW3NvcnRib3R0b21yb3dzLmxlbmd0aF0gPSB0YWJsZS5yb3dzW2ldO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoc29ydGJvdHRvbXJvd3MpIHtcbiAgICAgIGlmICh0YWJsZS50Rm9vdCA9PSBudWxsKSB7XG4gICAgICAgIC8vIHRhYmxlIGRvZXNuJ3QgaGF2ZSBhIHRmb290LiBDcmVhdGUgb25lLlxuICAgICAgICB0Zm8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0Zm9vdCcpO1xuICAgICAgICB0YWJsZS5hcHBlbmRDaGlsZCh0Zm8pO1xuICAgICAgfVxuICAgICAgZm9yICh2YXIgaT0wOyBpPHNvcnRib3R0b21yb3dzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRmby5hcHBlbmRDaGlsZChzb3J0Ym90dG9tcm93c1tpXSk7XG4gICAgICB9XG4gICAgICAvLyBkZWxldGUgc29ydGJvdHRvbXJvd3M7XG4gICAgICBzb3J0Ym90dG9tcm93cyA9IG51bGw7XG4gICAgfVxuXG4gICAgLy8gd29yayB0aHJvdWdoIGVhY2ggY29sdW1uIGFuZCBjYWxjdWxhdGUgaXRzIHR5cGVcbiAgICBoZWFkcm93ID0gdGFibGUudEhlYWQucm93c1swXS5jZWxscztcbiAgICBmb3IgKHZhciBpPTA7IGk8aGVhZHJvdy5sZW5ndGg7IGkrKykge1xuICAgICAgLy8gbWFudWFsbHkgb3ZlcnJpZGUgdGhlIHR5cGUgd2l0aCBhIHNvcnR0YWJsZV90eXBlIGF0dHJpYnV0ZVxuICAgICAgaWYgKCFoZWFkcm93W2ldLmNsYXNzTmFtZS5tYXRjaCgvXFxic29ydHRhYmxlX25vc29ydFxcYi8pKSB7IC8vIHNraXAgdGhpcyBjb2xcbiAgICAgICAgbXRjaCA9IGhlYWRyb3dbaV0uY2xhc3NOYW1lLm1hdGNoKC9cXGJzb3J0dGFibGVfKFthLXowLTldKylcXGIvKTtcbiAgICAgICAgaWYgKG10Y2gpIHsgb3ZlcnJpZGUgPSBtdGNoWzFdOyB9XG5cdCAgICAgIGlmIChtdGNoICYmIHR5cGVvZiBzb3J0dGFibGVbXCJzb3J0X1wiK292ZXJyaWRlXSA9PSAnZnVuY3Rpb24nKSB7XG5cdCAgICAgICAgaGVhZHJvd1tpXS5zb3J0dGFibGVfc29ydGZ1bmN0aW9uID0gc29ydHRhYmxlW1wic29ydF9cIitvdmVycmlkZV07XG5cdCAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgaGVhZHJvd1tpXS5zb3J0dGFibGVfc29ydGZ1bmN0aW9uID0gc29ydHRhYmxlLmd1ZXNzVHlwZSh0YWJsZSxpKTtcblx0ICAgICAgfVxuXHQgICAgICAvLyBtYWtlIGl0IGNsaWNrYWJsZSB0byBzb3J0XG5cdCAgICAgIGhlYWRyb3dbaV0uc29ydHRhYmxlX2NvbHVtbmluZGV4ID0gaTtcblx0ICAgICAgaGVhZHJvd1tpXS5zb3J0dGFibGVfdGJvZHkgPSB0YWJsZS50Qm9kaWVzWzBdO1xuXHQgICAgICBkZWFuX2FkZEV2ZW50KGhlYWRyb3dbaV0sXCJjbGlja1wiLCBzb3J0dGFibGUuaW5uZXJTb3J0RnVuY3Rpb24gPSBmdW5jdGlvbihlKSB7XG5cbiAgICAgICAgICBpZiAodGhpcy5jbGFzc05hbWUuc2VhcmNoKC9cXGJzb3J0dGFibGVfc29ydGVkXFxiLykgIT0gLTEpIHtcbiAgICAgICAgICAgIC8vIGlmIHdlJ3JlIGFscmVhZHkgc29ydGVkIGJ5IHRoaXMgY29sdW1uLCBqdXN0XG4gICAgICAgICAgICAvLyByZXZlcnNlIHRoZSB0YWJsZSwgd2hpY2ggaXMgcXVpY2tlclxuICAgICAgICAgICAgc29ydHRhYmxlLnJldmVyc2UodGhpcy5zb3J0dGFibGVfdGJvZHkpO1xuICAgICAgICAgICAgdGhpcy5jbGFzc05hbWUgPSB0aGlzLmNsYXNzTmFtZS5yZXBsYWNlKCdzb3J0dGFibGVfc29ydGVkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnc29ydHRhYmxlX3NvcnRlZF9yZXZlcnNlJyk7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUNoaWxkKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzb3J0dGFibGVfc29ydGZ3ZGluZCcpKTtcbiAgICAgICAgICAgIHNvcnRyZXZpbmQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgICAgICBzb3J0cmV2aW5kLmlkID0gXCJzb3J0dGFibGVfc29ydHJldmluZFwiO1xuICAgICAgICAgICAgc29ydHJldmluZC5pbm5lckhUTUwgPSBzdElzSUUgPyAnJm5ic3A8Zm9udCBmYWNlPVwid2ViZGluZ3NcIj41PC9mb250PicgOiAnJm5ic3A7JiN4MjVCNDsnO1xuICAgICAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChzb3J0cmV2aW5kKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHRoaXMuY2xhc3NOYW1lLnNlYXJjaCgvXFxic29ydHRhYmxlX3NvcnRlZF9yZXZlcnNlXFxiLykgIT0gLTEpIHtcbiAgICAgICAgICAgIC8vIGlmIHdlJ3JlIGFscmVhZHkgc29ydGVkIGJ5IHRoaXMgY29sdW1uIGluIHJldmVyc2UsIGp1c3RcbiAgICAgICAgICAgIC8vIHJlLXJldmVyc2UgdGhlIHRhYmxlLCB3aGljaCBpcyBxdWlja2VyXG4gICAgICAgICAgICBzb3J0dGFibGUucmV2ZXJzZSh0aGlzLnNvcnR0YWJsZV90Ym9keSk7XG4gICAgICAgICAgICB0aGlzLmNsYXNzTmFtZSA9IHRoaXMuY2xhc3NOYW1lLnJlcGxhY2UoJ3NvcnR0YWJsZV9zb3J0ZWRfcmV2ZXJzZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3NvcnR0YWJsZV9zb3J0ZWQnKTtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQ2hpbGQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NvcnR0YWJsZV9zb3J0cmV2aW5kJykpO1xuICAgICAgICAgICAgc29ydGZ3ZGluZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgICAgIHNvcnRmd2RpbmQuaWQgPSBcInNvcnR0YWJsZV9zb3J0ZndkaW5kXCI7XG4gICAgICAgICAgICBzb3J0ZndkaW5kLmlubmVySFRNTCA9IHN0SXNJRSA/ICcmbmJzcDxmb250IGZhY2U9XCJ3ZWJkaW5nc1wiPjY8L2ZvbnQ+JyA6ICcmbmJzcDsmI3gyNUJFOyc7XG4gICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHNvcnRmd2RpbmQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIHJlbW92ZSBzb3J0dGFibGVfc29ydGVkIGNsYXNzZXNcbiAgICAgICAgICB0aGVhZHJvdyA9IHRoaXMucGFyZW50Tm9kZTtcbiAgICAgICAgICBmb3JFYWNoKHRoZWFkcm93LmNoaWxkTm9kZXMsIGZ1bmN0aW9uKGNlbGwpIHtcbiAgICAgICAgICAgIGlmIChjZWxsLm5vZGVUeXBlID09IDEpIHsgLy8gYW4gZWxlbWVudFxuICAgICAgICAgICAgICBjZWxsLmNsYXNzTmFtZSA9IGNlbGwuY2xhc3NOYW1lLnJlcGxhY2UoJ3NvcnR0YWJsZV9zb3J0ZWRfcmV2ZXJzZScsJycpO1xuICAgICAgICAgICAgICBjZWxsLmNsYXNzTmFtZSA9IGNlbGwuY2xhc3NOYW1lLnJlcGxhY2UoJ3NvcnR0YWJsZV9zb3J0ZWQnLCcnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICBzb3J0ZndkaW5kID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NvcnR0YWJsZV9zb3J0ZndkaW5kJyk7XG4gICAgICAgICAgaWYgKHNvcnRmd2RpbmQpIHsgc29ydGZ3ZGluZC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHNvcnRmd2RpbmQpOyB9XG4gICAgICAgICAgc29ydHJldmluZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzb3J0dGFibGVfc29ydHJldmluZCcpO1xuICAgICAgICAgIGlmIChzb3J0cmV2aW5kKSB7IHNvcnRyZXZpbmQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChzb3J0cmV2aW5kKTsgfVxuXG4gICAgICAgICAgdGhpcy5jbGFzc05hbWUgKz0gJyBzb3J0dGFibGVfc29ydGVkJztcbiAgICAgICAgICBzb3J0ZndkaW5kID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICAgIHNvcnRmd2RpbmQuaWQgPSBcInNvcnR0YWJsZV9zb3J0ZndkaW5kXCI7XG4gICAgICAgICAgc29ydGZ3ZGluZC5pbm5lckhUTUwgPSBzdElzSUUgPyAnJm5ic3A8Zm9udCBmYWNlPVwid2ViZGluZ3NcIj42PC9mb250PicgOiAnJm5ic3A7JiN4MjVCRTsnO1xuICAgICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoc29ydGZ3ZGluZCk7XG5cblx0ICAgICAgICAvLyBidWlsZCBhbiBhcnJheSB0byBzb3J0LiBUaGlzIGlzIGEgU2Nod2FydHppYW4gdHJhbnNmb3JtIHRoaW5nLFxuXHQgICAgICAgIC8vIGkuZS4sIHdlIFwiZGVjb3JhdGVcIiBlYWNoIHJvdyB3aXRoIHRoZSBhY3R1YWwgc29ydCBrZXksXG5cdCAgICAgICAgLy8gc29ydCBiYXNlZCBvbiB0aGUgc29ydCBrZXlzLCBhbmQgdGhlbiBwdXQgdGhlIHJvd3MgYmFjayBpbiBvcmRlclxuXHQgICAgICAgIC8vIHdoaWNoIGlzIGEgbG90IGZhc3RlciBiZWNhdXNlIHlvdSBvbmx5IGRvIGdldElubmVyVGV4dCBvbmNlIHBlciByb3dcblx0ICAgICAgICByb3dfYXJyYXkgPSBbXTtcblx0ICAgICAgICBjb2wgPSB0aGlzLnNvcnR0YWJsZV9jb2x1bW5pbmRleDtcblx0ICAgICAgICByb3dzID0gdGhpcy5zb3J0dGFibGVfdGJvZHkucm93cztcblx0ICAgICAgICBmb3IgKHZhciBqPTA7IGo8cm93cy5sZW5ndGg7IGorKykge1xuXHQgICAgICAgICAgcm93X2FycmF5W3Jvd19hcnJheS5sZW5ndGhdID0gW3NvcnR0YWJsZS5nZXRJbm5lclRleHQocm93c1tqXS5jZWxsc1tjb2xdKSwgcm93c1tqXV07XG5cdCAgICAgICAgfVxuXHQgICAgICAgIC8qIElmIHlvdSB3YW50IGEgc3RhYmxlIHNvcnQsIHVuY29tbWVudCB0aGUgZm9sbG93aW5nIGxpbmUgKi9cblx0ICAgICAgICAvL3NvcnR0YWJsZS5zaGFrZXJfc29ydChyb3dfYXJyYXksIHRoaXMuc29ydHRhYmxlX3NvcnRmdW5jdGlvbik7XG5cdCAgICAgICAgLyogYW5kIGNvbW1lbnQgb3V0IHRoaXMgb25lICovXG5cdCAgICAgICAgcm93X2FycmF5LnNvcnQodGhpcy5zb3J0dGFibGVfc29ydGZ1bmN0aW9uKTtcblxuXHQgICAgICAgIHRiID0gdGhpcy5zb3J0dGFibGVfdGJvZHk7XG5cdCAgICAgICAgZm9yICh2YXIgaj0wOyBqPHJvd19hcnJheS5sZW5ndGg7IGorKykge1xuXHQgICAgICAgICAgdGIuYXBwZW5kQ2hpbGQocm93X2FycmF5W2pdWzFdKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICAvLyBkZWxldGUgcm93X2FycmF5O1xuICAgICAgICAgIHJvd19hcnJheSA9IG51bGw7XG5cdCAgICAgIH0pO1xuXHQgICAgfVxuICAgIH1cbiAgfSxcblxuICBndWVzc1R5cGU6IGZ1bmN0aW9uKHRhYmxlLCBjb2x1bW4pIHtcbiAgICAvLyBndWVzcyB0aGUgdHlwZSBvZiBhIGNvbHVtbiBiYXNlZCBvbiBpdHMgZmlyc3Qgbm9uLWJsYW5rIHJvd1xuICAgIHNvcnRmbiA9IHNvcnR0YWJsZS5zb3J0X2FscGhhO1xuICAgIGZvciAodmFyIGk9MDsgaTx0YWJsZS50Qm9kaWVzWzBdLnJvd3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRleHQgPSBzb3J0dGFibGUuZ2V0SW5uZXJUZXh0KHRhYmxlLnRCb2RpZXNbMF0ucm93c1tpXS5jZWxsc1tjb2x1bW5dKTtcbiAgICAgIGlmICh0ZXh0ICE9ICcnKSB7XG4gICAgICAgIGlmICh0ZXh0Lm1hdGNoKC9eLT9b77+9JO+/vV0/W1xcZCwuXSslPyQvKSkge1xuICAgICAgICAgIHJldHVybiBzb3J0dGFibGUuc29ydF9udW1lcmljO1xuICAgICAgICB9XG4gICAgICAgIC8vIGNoZWNrIGZvciBhIGRhdGU6IGRkL21tL3l5eXkgb3IgZGQvbW0veXlcbiAgICAgICAgLy8gY2FuIGhhdmUgLyBvciAuIG9yIC0gYXMgc2VwYXJhdG9yXG4gICAgICAgIC8vIGNhbiBiZSBtbS9kZCBhcyB3ZWxsXG4gICAgICAgIHBvc3NkYXRlID0gdGV4dC5tYXRjaChzb3J0dGFibGUuREFURV9SRSlcbiAgICAgICAgaWYgKHBvc3NkYXRlKSB7XG4gICAgICAgICAgLy8gbG9va3MgbGlrZSBhIGRhdGVcbiAgICAgICAgICBmaXJzdCA9IHBhcnNlSW50KHBvc3NkYXRlWzFdKTtcbiAgICAgICAgICBzZWNvbmQgPSBwYXJzZUludChwb3NzZGF0ZVsyXSk7XG4gICAgICAgICAgaWYgKGZpcnN0ID4gMTIpIHtcbiAgICAgICAgICAgIC8vIGRlZmluaXRlbHkgZGQvbW1cbiAgICAgICAgICAgIHJldHVybiBzb3J0dGFibGUuc29ydF9kZG1tO1xuICAgICAgICAgIH0gZWxzZSBpZiAoc2Vjb25kID4gMTIpIHtcbiAgICAgICAgICAgIHJldHVybiBzb3J0dGFibGUuc29ydF9tbWRkO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBsb29rcyBsaWtlIGEgZGF0ZSwgYnV0IHdlIGNhbid0IHRlbGwgd2hpY2gsIHNvIGFzc3VtZVxuICAgICAgICAgICAgLy8gdGhhdCBpdCdzIGRkL21tIChFbmdsaXNoIGltcGVyaWFsaXNtISkgYW5kIGtlZXAgbG9va2luZ1xuICAgICAgICAgICAgc29ydGZuID0gc29ydHRhYmxlLnNvcnRfZGRtbTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNvcnRmbjtcbiAgfSxcblxuICBnZXRJbm5lclRleHQ6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAvLyBnZXRzIHRoZSB0ZXh0IHdlIHdhbnQgdG8gdXNlIGZvciBzb3J0aW5nIGZvciBhIGNlbGwuXG4gICAgLy8gc3RyaXBzIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHdoaXRlc3BhY2UuXG4gICAgLy8gdGhpcyBpcyAqbm90KiBhIGdlbmVyaWMgZ2V0SW5uZXJUZXh0IGZ1bmN0aW9uOyBpdCdzIHNwZWNpYWwgdG8gc29ydHRhYmxlLlxuICAgIC8vIGZvciBleGFtcGxlLCB5b3UgY2FuIG92ZXJyaWRlIHRoZSBjZWxsIHRleHQgd2l0aCBhIGN1c3RvbWtleSBhdHRyaWJ1dGUuXG4gICAgLy8gaXQgYWxzbyBnZXRzIC52YWx1ZSBmb3IgPGlucHV0PiBmaWVsZHMuXG5cbiAgICBpZiAoIW5vZGUpIHJldHVybiBcIlwiO1xuXG4gICAgaGFzSW5wdXRzID0gKHR5cGVvZiBub2RlLmdldEVsZW1lbnRzQnlUYWdOYW1lID09ICdmdW5jdGlvbicpICYmXG4gICAgICAgICAgICAgICAgIG5vZGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lucHV0JykubGVuZ3RoO1xuXG4gICAgaWYgKG5vZGUuZ2V0QXR0cmlidXRlKFwic29ydHRhYmxlX2N1c3RvbWtleVwiKSAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gbm9kZS5nZXRBdHRyaWJ1dGUoXCJzb3J0dGFibGVfY3VzdG9ta2V5XCIpO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2Ygbm9kZS50ZXh0Q29udGVudCAhPSAndW5kZWZpbmVkJyAmJiAhaGFzSW5wdXRzKSB7XG4gICAgICByZXR1cm4gbm9kZS50ZXh0Q29udGVudC5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJyk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBub2RlLmlubmVyVGV4dCAhPSAndW5kZWZpbmVkJyAmJiAhaGFzSW5wdXRzKSB7XG4gICAgICByZXR1cm4gbm9kZS5pbm5lclRleHQucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2Ygbm9kZS50ZXh0ICE9ICd1bmRlZmluZWQnICYmICFoYXNJbnB1dHMpIHtcbiAgICAgIHJldHVybiBub2RlLnRleHQucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHN3aXRjaCAobm9kZS5ub2RlVHlwZSkge1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgaWYgKG5vZGUubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PSAnaW5wdXQnKSB7XG4gICAgICAgICAgICByZXR1cm4gbm9kZS52YWx1ZS5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJyk7XG4gICAgICAgICAgfVxuICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgcmV0dXJuIG5vZGUubm9kZVZhbHVlLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICBjYXNlIDExOlxuICAgICAgICAgIHZhciBpbm5lclRleHQgPSAnJztcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGUuY2hpbGROb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaW5uZXJUZXh0ICs9IHNvcnR0YWJsZS5nZXRJbm5lclRleHQobm9kZS5jaGlsZE5vZGVzW2ldKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGlubmVyVGV4dC5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJyk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICByZXZlcnNlOiBmdW5jdGlvbih0Ym9keSkge1xuICAgIC8vIHJldmVyc2UgdGhlIHJvd3MgaW4gYSB0Ym9keVxuICAgIG5ld3Jvd3MgPSBbXTtcbiAgICBmb3IgKHZhciBpPTA7IGk8dGJvZHkucm93cy5sZW5ndGg7IGkrKykge1xuICAgICAgbmV3cm93c1tuZXdyb3dzLmxlbmd0aF0gPSB0Ym9keS5yb3dzW2ldO1xuICAgIH1cbiAgICBmb3IgKHZhciBpPW5ld3Jvd3MubGVuZ3RoLTE7IGk+PTA7IGktLSkge1xuICAgICAgIHRib2R5LmFwcGVuZENoaWxkKG5ld3Jvd3NbaV0pO1xuICAgIH1cbiAgICAvLyBkZWxldGUgbmV3cm93cztcbiAgICBuZXdyb3dzID0gbnVsbDtcbiAgfSxcblxuICAvKiBzb3J0IGZ1bmN0aW9uc1xuICAgICBlYWNoIHNvcnQgZnVuY3Rpb24gdGFrZXMgdHdvIHBhcmFtZXRlcnMsIGEgYW5kIGJcbiAgICAgeW91IGFyZSBjb21wYXJpbmcgYVswXSBhbmQgYlswXSAqL1xuICBzb3J0X251bWVyaWM6IGZ1bmN0aW9uKGEsYikge1xuICAgIGFhID0gcGFyc2VGbG9hdChhWzBdLnJlcGxhY2UoL1teMC05Li1dL2csJycpKTtcbiAgICBpZiAoaXNOYU4oYWEpKSBhYSA9IDA7XG4gICAgYmIgPSBwYXJzZUZsb2F0KGJbMF0ucmVwbGFjZSgvW14wLTkuLV0vZywnJykpO1xuICAgIGlmIChpc05hTihiYikpIGJiID0gMDtcbiAgICByZXR1cm4gYWEtYmI7XG4gIH0sXG4gIHNvcnRfYWxwaGE6IGZ1bmN0aW9uKGEsYikge1xuICAgIGlmIChhWzBdPT1iWzBdKSByZXR1cm4gMDtcbiAgICBpZiAoYVswXTxiWzBdKSByZXR1cm4gLTE7XG4gICAgcmV0dXJuIDE7XG4gIH0sXG4gIHNvcnRfZGRtbTogZnVuY3Rpb24oYSxiKSB7XG4gICAgbXRjaCA9IGFbMF0ubWF0Y2goc29ydHRhYmxlLkRBVEVfUkUpO1xuICAgIHkgPSBtdGNoWzNdOyBtID0gbXRjaFsyXTsgZCA9IG10Y2hbMV07XG4gICAgaWYgKG0ubGVuZ3RoID09IDEpIG0gPSAnMCcrbTtcbiAgICBpZiAoZC5sZW5ndGggPT0gMSkgZCA9ICcwJytkO1xuICAgIGR0MSA9IHkrbStkO1xuICAgIG10Y2ggPSBiWzBdLm1hdGNoKHNvcnR0YWJsZS5EQVRFX1JFKTtcbiAgICB5ID0gbXRjaFszXTsgbSA9IG10Y2hbMl07IGQgPSBtdGNoWzFdO1xuICAgIGlmIChtLmxlbmd0aCA9PSAxKSBtID0gJzAnK207XG4gICAgaWYgKGQubGVuZ3RoID09IDEpIGQgPSAnMCcrZDtcbiAgICBkdDIgPSB5K20rZDtcbiAgICBpZiAoZHQxPT1kdDIpIHJldHVybiAwO1xuICAgIGlmIChkdDE8ZHQyKSByZXR1cm4gLTE7XG4gICAgcmV0dXJuIDE7XG4gIH0sXG4gIHNvcnRfbW1kZDogZnVuY3Rpb24oYSxiKSB7XG4gICAgbXRjaCA9IGFbMF0ubWF0Y2goc29ydHRhYmxlLkRBVEVfUkUpO1xuICAgIHkgPSBtdGNoWzNdOyBkID0gbXRjaFsyXTsgbSA9IG10Y2hbMV07XG4gICAgaWYgKG0ubGVuZ3RoID09IDEpIG0gPSAnMCcrbTtcbiAgICBpZiAoZC5sZW5ndGggPT0gMSkgZCA9ICcwJytkO1xuICAgIGR0MSA9IHkrbStkO1xuICAgIG10Y2ggPSBiWzBdLm1hdGNoKHNvcnR0YWJsZS5EQVRFX1JFKTtcbiAgICB5ID0gbXRjaFszXTsgZCA9IG10Y2hbMl07IG0gPSBtdGNoWzFdO1xuICAgIGlmIChtLmxlbmd0aCA9PSAxKSBtID0gJzAnK207XG4gICAgaWYgKGQubGVuZ3RoID09IDEpIGQgPSAnMCcrZDtcbiAgICBkdDIgPSB5K20rZDtcbiAgICBpZiAoZHQxPT1kdDIpIHJldHVybiAwO1xuICAgIGlmIChkdDE8ZHQyKSByZXR1cm4gLTE7XG4gICAgcmV0dXJuIDE7XG4gIH0sXG5cbiAgc2hha2VyX3NvcnQ6IGZ1bmN0aW9uKGxpc3QsIGNvbXBfZnVuYykge1xuICAgIC8vIEEgc3RhYmxlIHNvcnQgZnVuY3Rpb24gdG8gYWxsb3cgbXVsdGktbGV2ZWwgc29ydGluZyBvZiBkYXRhXG4gICAgLy8gc2VlOiBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0NvY2t0YWlsX3NvcnRcbiAgICAvLyB0aGFua3MgdG8gSm9zZXBoIE5haG1pYXNcbiAgICB2YXIgYiA9IDA7XG4gICAgdmFyIHQgPSBsaXN0Lmxlbmd0aCAtIDE7XG4gICAgdmFyIHN3YXAgPSB0cnVlO1xuXG4gICAgd2hpbGUoc3dhcCkge1xuICAgICAgICBzd2FwID0gZmFsc2U7XG4gICAgICAgIGZvcih2YXIgaSA9IGI7IGkgPCB0OyArK2kpIHtcbiAgICAgICAgICAgIGlmICggY29tcF9mdW5jKGxpc3RbaV0sIGxpc3RbaSsxXSkgPiAwICkge1xuICAgICAgICAgICAgICAgIHZhciBxID0gbGlzdFtpXTsgbGlzdFtpXSA9IGxpc3RbaSsxXTsgbGlzdFtpKzFdID0gcTtcbiAgICAgICAgICAgICAgICBzd2FwID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSAvLyBmb3JcbiAgICAgICAgdC0tO1xuXG4gICAgICAgIGlmICghc3dhcCkgYnJlYWs7XG5cbiAgICAgICAgZm9yKHZhciBpID0gdDsgaSA+IGI7IC0taSkge1xuICAgICAgICAgICAgaWYgKCBjb21wX2Z1bmMobGlzdFtpXSwgbGlzdFtpLTFdKSA8IDAgKSB7XG4gICAgICAgICAgICAgICAgdmFyIHEgPSBsaXN0W2ldOyBsaXN0W2ldID0gbGlzdFtpLTFdOyBsaXN0W2ktMV0gPSBxO1xuICAgICAgICAgICAgICAgIHN3YXAgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IC8vIGZvclxuICAgICAgICBiKys7XG5cbiAgICB9IC8vIHdoaWxlKHN3YXApXG4gIH1cbn1cblxuLyogKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICBTdXBwb3J0aW5nIGZ1bmN0aW9uczogYnVuZGxlZCBoZXJlIHRvIGF2b2lkIGRlcGVuZGluZyBvbiBhIGxpYnJhcnlcbiAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiAqL1xuXG4vLyBEZWFuIEVkd2FyZHMvTWF0dGhpYXMgTWlsbGVyL0pvaG4gUmVzaWdcblxuLyogZm9yIE1vemlsbGEvT3BlcmE5ICovXG5pZiAoZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIHNvcnR0YWJsZS5pbml0LCBmYWxzZSk7XG59XG5cbi8qIGZvciBJbnRlcm5ldCBFeHBsb3JlciAqL1xuLypAY2Nfb24gQCovXG4vKkBpZiAoQF93aW4zMilcbiAgICBkb2N1bWVudC53cml0ZShcIjxzY3JpcHQgaWQ9X19pZV9vbmxvYWQgZGVmZXIgc3JjPWphdmFzY3JpcHQ6dm9pZCgwKT48XFwvc2NyaXB0PlwiKTtcbiAgICB2YXIgc2NyaXB0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJfX2llX29ubG9hZFwiKTtcbiAgICBzY3JpcHQub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLnJlYWR5U3RhdGUgPT0gXCJjb21wbGV0ZVwiKSB7XG4gICAgICAgICAgICBzb3J0dGFibGUuaW5pdCgpOyAvLyBjYWxsIHRoZSBvbmxvYWQgaGFuZGxlclxuICAgICAgICB9XG4gICAgfTtcbi8qQGVuZCBAKi9cblxuLyogZm9yIFNhZmFyaSAqL1xuaWYgKC9XZWJLaXQvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpKSB7IC8vIHNuaWZmXG4gICAgdmFyIF90aW1lciA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoL2xvYWRlZHxjb21wbGV0ZS8udGVzdChkb2N1bWVudC5yZWFkeVN0YXRlKSkge1xuICAgICAgICAgICAgc29ydHRhYmxlLmluaXQoKTsgLy8gY2FsbCB0aGUgb25sb2FkIGhhbmRsZXJcbiAgICAgICAgfVxuICAgIH0sIDEwKTtcbn1cblxuLyogZm9yIG90aGVyIGJyb3dzZXJzICovXG53aW5kb3cub25sb2FkID0gc29ydHRhYmxlLmluaXQ7XG5cbi8vIHdyaXR0ZW4gYnkgRGVhbiBFZHdhcmRzLCAyMDA1XG4vLyB3aXRoIGlucHV0IGZyb20gVGlubyBaaWpkZWwsIE1hdHRoaWFzIE1pbGxlciwgRGllZ28gUGVyaW5pXG5cbi8vIGh0dHA6Ly9kZWFuLmVkd2FyZHMubmFtZS93ZWJsb2cvMjAwNS8xMC9hZGQtZXZlbnQvXG5cbmZ1bmN0aW9uIGRlYW5fYWRkRXZlbnQoZWxlbWVudCwgdHlwZSwgaGFuZGxlcikge1xuXHRpZiAoZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKSB7XG5cdFx0ZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGhhbmRsZXIsIGZhbHNlKTtcblx0fSBlbHNlIHtcblx0XHQvLyBhc3NpZ24gZWFjaCBldmVudCBoYW5kbGVyIGEgdW5pcXVlIElEXG5cdFx0aWYgKCFoYW5kbGVyLiQkZ3VpZCkgaGFuZGxlci4kJGd1aWQgPSBkZWFuX2FkZEV2ZW50Lmd1aWQrKztcblx0XHQvLyBjcmVhdGUgYSBoYXNoIHRhYmxlIG9mIGV2ZW50IHR5cGVzIGZvciB0aGUgZWxlbWVudFxuXHRcdGlmICghZWxlbWVudC5ldmVudHMpIGVsZW1lbnQuZXZlbnRzID0ge307XG5cdFx0Ly8gY3JlYXRlIGEgaGFzaCB0YWJsZSBvZiBldmVudCBoYW5kbGVycyBmb3IgZWFjaCBlbGVtZW50L2V2ZW50IHBhaXJcblx0XHR2YXIgaGFuZGxlcnMgPSBlbGVtZW50LmV2ZW50c1t0eXBlXTtcblx0XHRpZiAoIWhhbmRsZXJzKSB7XG5cdFx0XHRoYW5kbGVycyA9IGVsZW1lbnQuZXZlbnRzW3R5cGVdID0ge307XG5cdFx0XHQvLyBzdG9yZSB0aGUgZXhpc3RpbmcgZXZlbnQgaGFuZGxlciAoaWYgdGhlcmUgaXMgb25lKVxuXHRcdFx0aWYgKGVsZW1lbnRbXCJvblwiICsgdHlwZV0pIHtcblx0XHRcdFx0aGFuZGxlcnNbMF0gPSBlbGVtZW50W1wib25cIiArIHR5cGVdO1xuXHRcdFx0fVxuXHRcdH1cblx0XHQvLyBzdG9yZSB0aGUgZXZlbnQgaGFuZGxlciBpbiB0aGUgaGFzaCB0YWJsZVxuXHRcdGhhbmRsZXJzW2hhbmRsZXIuJCRndWlkXSA9IGhhbmRsZXI7XG5cdFx0Ly8gYXNzaWduIGEgZ2xvYmFsIGV2ZW50IGhhbmRsZXIgdG8gZG8gYWxsIHRoZSB3b3JrXG5cdFx0ZWxlbWVudFtcIm9uXCIgKyB0eXBlXSA9IGhhbmRsZUV2ZW50O1xuXHR9XG59O1xuLy8gYSBjb3VudGVyIHVzZWQgdG8gY3JlYXRlIHVuaXF1ZSBJRHNcbmRlYW5fYWRkRXZlbnQuZ3VpZCA9IDE7XG5cbmZ1bmN0aW9uIHJlbW92ZUV2ZW50KGVsZW1lbnQsIHR5cGUsIGhhbmRsZXIpIHtcblx0aWYgKGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcikge1xuXHRcdGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlLCBoYW5kbGVyLCBmYWxzZSk7XG5cdH0gZWxzZSB7XG5cdFx0Ly8gZGVsZXRlIHRoZSBldmVudCBoYW5kbGVyIGZyb20gdGhlIGhhc2ggdGFibGVcblx0XHRpZiAoZWxlbWVudC5ldmVudHMgJiYgZWxlbWVudC5ldmVudHNbdHlwZV0pIHtcblx0XHRcdGRlbGV0ZSBlbGVtZW50LmV2ZW50c1t0eXBlXVtoYW5kbGVyLiQkZ3VpZF07XG5cdFx0fVxuXHR9XG59O1xuXG5mdW5jdGlvbiBoYW5kbGVFdmVudChldmVudCkge1xuXHR2YXIgcmV0dXJuVmFsdWUgPSB0cnVlO1xuXHQvLyBncmFiIHRoZSBldmVudCBvYmplY3QgKElFIHVzZXMgYSBnbG9iYWwgZXZlbnQgb2JqZWN0KVxuXHRldmVudCA9IGV2ZW50IHx8IGZpeEV2ZW50KCgodGhpcy5vd25lckRvY3VtZW50IHx8IHRoaXMuZG9jdW1lbnQgfHwgdGhpcykucGFyZW50V2luZG93IHx8IHdpbmRvdykuZXZlbnQpO1xuXHQvLyBnZXQgYSByZWZlcmVuY2UgdG8gdGhlIGhhc2ggdGFibGUgb2YgZXZlbnQgaGFuZGxlcnNcblx0dmFyIGhhbmRsZXJzID0gdGhpcy5ldmVudHNbZXZlbnQudHlwZV07XG5cdC8vIGV4ZWN1dGUgZWFjaCBldmVudCBoYW5kbGVyXG5cdGZvciAodmFyIGkgaW4gaGFuZGxlcnMpIHtcblx0XHR0aGlzLiQkaGFuZGxlRXZlbnQgPSBoYW5kbGVyc1tpXTtcblx0XHRpZiAodGhpcy4kJGhhbmRsZUV2ZW50KGV2ZW50KSA9PT0gZmFsc2UpIHtcblx0XHRcdHJldHVyblZhbHVlID0gZmFsc2U7XG5cdFx0fVxuXHR9XG5cdHJldHVybiByZXR1cm5WYWx1ZTtcbn07XG5cbmZ1bmN0aW9uIGZpeEV2ZW50KGV2ZW50KSB7XG5cdC8vIGFkZCBXM0Mgc3RhbmRhcmQgZXZlbnQgbWV0aG9kc1xuXHRldmVudC5wcmV2ZW50RGVmYXVsdCA9IGZpeEV2ZW50LnByZXZlbnREZWZhdWx0O1xuXHRldmVudC5zdG9wUHJvcGFnYXRpb24gPSBmaXhFdmVudC5zdG9wUHJvcGFnYXRpb247XG5cdHJldHVybiBldmVudDtcbn07XG5maXhFdmVudC5wcmV2ZW50RGVmYXVsdCA9IGZ1bmN0aW9uKCkge1xuXHR0aGlzLnJldHVyblZhbHVlID0gZmFsc2U7XG59O1xuZml4RXZlbnQuc3RvcFByb3BhZ2F0aW9uID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuY2FuY2VsQnViYmxlID0gdHJ1ZTtcbn1cblxuLy8gRGVhbidzIGZvckVhY2g6IGh0dHA6Ly9kZWFuLmVkd2FyZHMubmFtZS9iYXNlL2ZvckVhY2guanNcbi8qXG5cdGZvckVhY2gsIHZlcnNpb24gMS4wXG5cdENvcHlyaWdodCAyMDA2LCBEZWFuIEVkd2FyZHNcblx0TGljZW5zZTogaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9taXQtbGljZW5zZS5waHBcbiovXG5cbi8vIGFycmF5LWxpa2UgZW51bWVyYXRpb25cbmlmICghQXJyYXkuZm9yRWFjaCkgeyAvLyBtb3ppbGxhIGFscmVhZHkgc3VwcG9ydHMgdGhpc1xuXHRBcnJheS5mb3JFYWNoID0gZnVuY3Rpb24oYXJyYXksIGJsb2NrLCBjb250ZXh0KSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7IGkrKykge1xuXHRcdFx0YmxvY2suY2FsbChjb250ZXh0LCBhcnJheVtpXSwgaSwgYXJyYXkpO1xuXHRcdH1cblx0fTtcbn1cblxuLy8gZ2VuZXJpYyBlbnVtZXJhdGlvblxuRnVuY3Rpb24ucHJvdG90eXBlLmZvckVhY2ggPSBmdW5jdGlvbihvYmplY3QsIGJsb2NrLCBjb250ZXh0KSB7XG5cdGZvciAodmFyIGtleSBpbiBvYmplY3QpIHtcblx0XHRpZiAodHlwZW9mIHRoaXMucHJvdG90eXBlW2tleV0gPT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdFx0YmxvY2suY2FsbChjb250ZXh0LCBvYmplY3Rba2V5XSwga2V5LCBvYmplY3QpO1xuXHRcdH1cblx0fVxufTtcblxuLy8gY2hhcmFjdGVyIGVudW1lcmF0aW9uXG5TdHJpbmcuZm9yRWFjaCA9IGZ1bmN0aW9uKHN0cmluZywgYmxvY2ssIGNvbnRleHQpIHtcblx0QXJyYXkuZm9yRWFjaChzdHJpbmcuc3BsaXQoXCJcIiksIGZ1bmN0aW9uKGNociwgaW5kZXgpIHtcblx0XHRibG9jay5jYWxsKGNvbnRleHQsIGNociwgaW5kZXgsIHN0cmluZyk7XG5cdH0pO1xufTtcblxuLy8gZ2xvYmFsbHkgcmVzb2x2ZSBmb3JFYWNoIGVudW1lcmF0aW9uXG52YXIgZm9yRWFjaCA9IGZ1bmN0aW9uKG9iamVjdCwgYmxvY2ssIGNvbnRleHQpIHtcblx0aWYgKG9iamVjdCkge1xuXHRcdHZhciByZXNvbHZlID0gT2JqZWN0OyAvLyBkZWZhdWx0XG5cdFx0aWYgKG9iamVjdCBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG5cdFx0XHQvLyBmdW5jdGlvbnMgaGF2ZSBhIFwibGVuZ3RoXCIgcHJvcGVydHlcblx0XHRcdHJlc29sdmUgPSBGdW5jdGlvbjtcblx0XHR9IGVsc2UgaWYgKG9iamVjdC5mb3JFYWNoIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcblx0XHRcdC8vIHRoZSBvYmplY3QgaW1wbGVtZW50cyBhIGN1c3RvbSBmb3JFYWNoIG1ldGhvZCBzbyB1c2UgdGhhdFxuXHRcdFx0b2JqZWN0LmZvckVhY2goYmxvY2ssIGNvbnRleHQpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH0gZWxzZSBpZiAodHlwZW9mIG9iamVjdCA9PSBcInN0cmluZ1wiKSB7XG5cdFx0XHQvLyB0aGUgb2JqZWN0IGlzIGEgc3RyaW5nXG5cdFx0XHRyZXNvbHZlID0gU3RyaW5nO1xuXHRcdH0gZWxzZSBpZiAodHlwZW9mIG9iamVjdC5sZW5ndGggPT0gXCJudW1iZXJcIikge1xuXHRcdFx0Ly8gdGhlIG9iamVjdCBpcyBhcnJheS1saWtlXG5cdFx0XHRyZXNvbHZlID0gQXJyYXk7XG5cdFx0fVxuXHRcdHJlc29sdmUuZm9yRWFjaChvYmplY3QsIGJsb2NrLCBjb250ZXh0KTtcblx0fVxufTsiXX0=
