(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var app = require('./public/js/app.js');
var nav = require('./public/js/nav.js');
var datepickr = require('./public/js/datepickr.js');
var moment = require('moment');
var sorttable = require('./public/js/sorttable.js');
var fetch = require('whatwg-fetch');
var FormDataPolyfill = require('formdata-polyfill');

},{"./public/js/app.js":5,"./public/js/datepickr.js":6,"./public/js/nav.js":7,"./public/js/sorttable.js":8,"formdata-polyfill":2,"moment":3,"whatwg-fetch":4}],2:[function(require,module,exports){
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

    if (navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/BlackBerry/i) || navigator.userAgent.match(/Windows Phone/i)) {
      sendLog(logData);
    } else {

      var f = new FormDataPolyfill();

      f.append('logData', JSON.stringify(logData));

      f.append('pics', document.querySelector('#file1').files[0]);
      f.append('pics', document.querySelector('#file2').files[0]);
      f.append('pics', document.querySelector('#file3').files[0]);
      f.append('pics', document.querySelector('#file4').files[0]);
      f.append('pics', document.querySelector('#file5').files[0]);

      xhrPromise(f).then(res => {
        window.location = '/log-history?message=Log%20created';
      });
    }
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

},{}],6:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQuanMiLCJub2RlX21vZHVsZXMvZm9ybWRhdGEtcG9seWZpbGwvRm9ybURhdGEuanMiLCJub2RlX21vZHVsZXMvbW9tZW50L21vbWVudC5qcyIsIm5vZGVfbW9kdWxlcy93aGF0d2ctZmV0Y2gvZmV0Y2guanMiLCJwdWJsaWMvanMvYXBwLmpzIiwicHVibGljL2pzL2RhdGVwaWNrci5qcyIsInB1YmxpYy9qcy9uYXYuanMiLCJwdWJsaWMvanMvc29ydHRhYmxlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsSUFBSSxNQUFNLFFBQVEsb0JBQVIsQ0FBVjtBQUNBLElBQUksTUFBTSxRQUFRLG9CQUFSLENBQVY7QUFDQSxJQUFJLFlBQVksUUFBUSwwQkFBUixDQUFoQjtBQUNBLElBQUksU0FBUyxRQUFRLFFBQVIsQ0FBYjtBQUNBLElBQUksWUFBWSxRQUFRLDBCQUFSLENBQWhCO0FBQ0EsSUFBSSxRQUFRLFFBQVEsY0FBUixDQUFaO0FBQ0EsSUFBSSxtQkFBbUIsUUFBUSxtQkFBUixDQUF2Qjs7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdzSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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RkQ7QUFHQSxDQUpEOztBQU1BO0FBQ0EsSUFBSSxVQUFVLFVBQVMsTUFBVCxFQUFpQixLQUFqQixFQUF3QixPQUF4QixFQUFpQztBQUM5QyxNQUFJLE1BQUosRUFBWTtBQUNYLFFBQUksVUFBVSxNQUFkLENBRFcsQ0FDVztBQUN0QixRQUFJLGtCQUFrQixRQUF0QixFQUFnQztBQUMvQjtBQUNBLGdCQUFVLFFBQVY7QUFDQSxLQUhELE1BR08sSUFBSSxPQUFPLE9BQVAsWUFBMEIsUUFBOUIsRUFBd0M7QUFDOUM7QUFDQSxhQUFPLE9BQVAsQ0FBZSxLQUFmLEVBQXNCLE9BQXRCO0FBQ0E7QUFDQSxLQUpNLE1BSUEsSUFBSSxPQUFPLE1BQVAsSUFBaUIsUUFBckIsRUFBK0I7QUFDckM7QUFDQSxnQkFBVSxNQUFWO0FBQ0EsS0FITSxNQUdBLElBQUksT0FBTyxPQUFPLE1BQWQsSUFBd0IsUUFBNUIsRUFBc0M7QUFDNUM7QUFDQSxnQkFBVSxLQUFWO0FBQ0E7QUFDRCxZQUFRLE9BQVIsQ0FBZ0IsTUFBaEIsRUFBd0IsS0FBeEIsRUFBK0IsT0FBL0I7QUFDQTtBQUNELENBbkJEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBhcHAgPSByZXF1aXJlKCcuL3B1YmxpYy9qcy9hcHAuanMnKVxudmFyIG5hdiA9IHJlcXVpcmUoJy4vcHVibGljL2pzL25hdi5qcycpXG52YXIgZGF0ZXBpY2tyID0gcmVxdWlyZSgnLi9wdWJsaWMvanMvZGF0ZXBpY2tyLmpzJylcbnZhciBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKVxudmFyIHNvcnR0YWJsZSA9IHJlcXVpcmUoJy4vcHVibGljL2pzL3NvcnR0YWJsZS5qcycpXG52YXIgZmV0Y2ggPSByZXF1aXJlKCd3aGF0d2ctZmV0Y2gnKVxudmFyIEZvcm1EYXRhUG9seWZpbGwgPSByZXF1aXJlKCdmb3JtZGF0YS1wb2x5ZmlsbCcpIiwiY29uc3QgbWFwID0gbmV3IFdlYWtNYXBcbmNvbnN0IHdtID0gbyA9PiBtYXAuZ2V0KG8pXG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVZhbHVlKFt2YWx1ZSwgZmlsZW5hbWVdKSB7XG4gIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEJsb2IpXG4gICAgdmFsdWUgPSBuZXcgRmlsZShbdmFsdWVdLCBmaWxlbmFtZSwge1xuICAgICAgdHlwZTogdmFsdWUudHlwZSxcbiAgICAgIGxhc3RNb2RpZmllZDogdmFsdWUubGFzdE1vZGlmaWVkXG4gICAgfSlcblxuICByZXR1cm4gdmFsdWVcbn1cblxuZnVuY3Rpb24gc3RyaW5naWZ5KG5hbWUpIHtcbiAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSBcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCcxIGFyZ3VtZW50IHJlcXVpcmVkLCBidXQgb25seSAwIHByZXNlbnQuJylcblxuICByZXR1cm4gW25hbWUgKyAnJ11cbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplQXJncyhuYW1lLCB2YWx1ZSwgZmlsZW5hbWUpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAyKSBcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGAyIGFyZ3VtZW50cyByZXF1aXJlZCwgYnV0IG9ubHkgJHthcmd1bWVudHMubGVuZ3RofSBwcmVzZW50LmApXG4gICAgXG4gIHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIEJsb2IgXG4gICAgPyBbbmFtZSArICcnLCB2YWx1ZSwgZmlsZW5hbWUgIT09IHVuZGVmaW5lZCBcbiAgICAgID8gZmlsZW5hbWUgKyAnJyBcbiAgICAgIDogdmFsdWVbU3ltYm9sLnRvU3RyaW5nVGFnXSA9PT0gJ0ZpbGUnXG4gICAgICAgID8gdmFsdWUubmFtZSBcbiAgICAgICAgOiAnQmxvYiddXG4gICAgOiBbbmFtZSArICcnLCB2YWx1ZSArICcnXVxufVxuXG4vKipcbiAqIEBpbXBsZW1lbnRzIHtJdGVyYWJsZX1cbiAqL1xuY2xhc3MgRm9ybURhdGFQb2x5ZmlsbCB7XG5cbiAgLyoqXG4gICAqIEZvcm1EYXRhIGNsYXNzXG4gICAqXG4gICAqIEBwYXJhbSB7SFRNTEVsZW1lbnQ9fSBmb3JtXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihmb3JtKSB7XG4gICAgbWFwLnNldCh0aGlzLCBPYmplY3QuY3JlYXRlKG51bGwpKVxuXG4gICAgaWYgKCFmb3JtKVxuICAgICAgcmV0dXJuIHRoaXNcblxuICAgIGZvciAobGV0IHtuYW1lLCB0eXBlLCB2YWx1ZSwgZmlsZXMsIGNoZWNrZWQsIHNlbGVjdGVkT3B0aW9uc30gb2YgQXJyYXkuZnJvbShmb3JtLmVsZW1lbnRzKSkge1xuICAgICAgaWYoIW5hbWUpIGNvbnRpbnVlXG5cbiAgICAgIGlmICh0eXBlID09PSAnZmlsZScpXG4gICAgICAgIGZvciAobGV0IGZpbGUgb2YgZmlsZXMpXG4gICAgICAgICAgdGhpcy5hcHBlbmQobmFtZSwgZmlsZSlcbiAgICAgIGVsc2UgaWYgKHR5cGUgPT09ICdzZWxlY3QtbXVsdGlwbGUnIHx8IHR5cGUgPT09ICdzZWxlY3Qtb25lJylcbiAgICAgICAgZm9yIChsZXQgZWxtIG9mIHNlbGVjdGVkT3B0aW9ucylcbiAgICAgICAgICB0aGlzLmFwcGVuZChuYW1lLCBlbG0udmFsdWUpXG4gICAgICBlbHNlIGlmICh0eXBlID09PSAnY2hlY2tib3gnKVxuICAgICAgICBpZiAoY2hlY2tlZCkgdGhpcy5hcHBlbmQobmFtZSwgdmFsdWUpXG4gICAgICBlbHNlXG4gICAgICAgIHRoaXMuYXBwZW5kKG5hbWUsIHZhbHVlKVxuICAgIH1cbiAgfVxuXG5cbiAgLyoqXG4gICAqIEFwcGVuZCBhIGZpZWxkXG4gICAqXG4gICAqIEBwYXJhbSAgIHtTdHJpbmd9ICAgICAgICAgICBuYW1lICAgICAgZmllbGQgbmFtZVxuICAgKiBAcGFyYW0gICB7U3RyaW5nfEJsb2J8RmlsZX0gdmFsdWUgICAgIHN0cmluZyAvIGJsb2IgLyBmaWxlXG4gICAqIEBwYXJhbSAgIHtTdHJpbmc9fSAgICAgICAgICBmaWxlbmFtZSAgZmlsZW5hbWUgdG8gdXNlIHdpdGggYmxvYlxuICAgKiBAcmV0dXJuICB7VW5kZWZpbmVkfVxuICAgKi9cbiAgYXBwZW5kKG5hbWUsIHZhbHVlLCBmaWxlbmFtZSkge1xuICAgIGxldCBtYXAgPSB3bSh0aGlzKVxuXG4gICAgaWYgKCFtYXBbbmFtZV0pXG4gICAgICBtYXBbbmFtZV0gPSBbXVxuXG4gICAgbWFwW25hbWVdLnB1c2goW3ZhbHVlLCBmaWxlbmFtZV0pXG4gIH1cblxuXG4gIC8qKlxuICAgKiBEZWxldGUgYWxsIGZpZWxkcyB2YWx1ZXMgZ2l2ZW4gbmFtZVxuICAgKlxuICAgKiBAcGFyYW0gICB7U3RyaW5nfSAgbmFtZSAgRmllbGQgbmFtZVxuICAgKiBAcmV0dXJuICB7VW5kZWZpbmVkfVxuICAgKi9cbiAgZGVsZXRlKG5hbWUpIHtcbiAgICBkZWxldGUgd20odGhpcylbbmFtZV1cbiAgfVxuXG5cbiAgLyoqXG4gICAqIEl0ZXJhdGUgb3ZlciBhbGwgZmllbGRzIGFzIFtuYW1lLCB2YWx1ZV1cbiAgICpcbiAgICogQHJldHVybiB7SXRlcmF0b3J9XG4gICAqL1xuICAqZW50cmllcygpIHtcbiAgICBsZXQgbWFwID0gd20odGhpcylcblxuICAgIGZvciAobGV0IG5hbWUgaW4gbWFwKVxuICAgICAgZm9yIChsZXQgdmFsdWUgb2YgbWFwW25hbWVdKVxuICAgICAgICB5aWVsZCBbbmFtZSwgbm9ybWFsaXplVmFsdWUodmFsdWUpXVxuICB9XG5cbiAgLyoqXG4gICAqIEl0ZXJhdGUgb3ZlciBhbGwgZmllbGRzXG4gICAqXG4gICAqIEBwYXJhbSAgIHtGdW5jdGlvbn0gIGNhbGxiYWNrICBFeGVjdXRlZCBmb3IgZWFjaCBpdGVtIHdpdGggcGFyYW1ldGVycyAodmFsdWUsIG5hbWUsIHRoaXNBcmcpXG4gICAqIEBwYXJhbSAgIHtPYmplY3Q9fSAgIHRoaXNBcmcgICBgdGhpc2AgY29udGV4dCBmb3IgY2FsbGJhY2sgZnVuY3Rpb25cbiAgICogQHJldHVybiAge1VuZGVmaW5lZH1cbiAgICovXG4gIGZvckVhY2goY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICBmb3IgKGxldCBbbmFtZSwgdmFsdWVdIG9mIHRoaXMpXG4gICAgICBjYWxsYmFjay5jYWxsKHRoaXNBcmcsIHZhbHVlLCBuYW1lLCB0aGlzKVxuICB9XG5cblxuICAvKipcbiAgICogUmV0dXJuIGZpcnN0IGZpZWxkIHZhbHVlIGdpdmVuIG5hbWVcbiAgICpcbiAgICogQHBhcmFtICAge1N0cmluZ30gIG5hbWUgIEZpZWxkIG5hbWVcbiAgICogQHJldHVybiAge1N0cmluZ3xGaWxlfSAgIHZhbHVlIEZpZWxkcyB2YWx1ZVxuICAgKi9cbiAgZ2V0KG5hbWUpIHtcbiAgICBsZXQgbWFwID0gd20odGhpcylcbiAgICByZXR1cm4gbWFwW25hbWVdID8gbm9ybWFsaXplVmFsdWUobWFwW25hbWVdWzBdKSA6IG51bGxcbiAgfVxuXG5cbiAgLyoqXG4gICAqIFJldHVybiBhbGwgZmllbGRzIHZhbHVlcyBnaXZlbiBuYW1lXG4gICAqXG4gICAqIEBwYXJhbSAgIHtTdHJpbmd9ICBuYW1lICBGaWVsZHMgbmFtZVxuICAgKiBAcmV0dXJuICB7QXJyYXl9ICAgICAgICAgW3ZhbHVlLCB2YWx1ZV1cbiAgICovXG4gIGdldEFsbChuYW1lKSB7XG4gICAgcmV0dXJuICh3bSh0aGlzKVtuYW1lXSB8fCBbXSkubWFwKG5vcm1hbGl6ZVZhbHVlKVxuICB9XG5cblxuICAvKipcbiAgICogQ2hlY2sgZm9yIGZpZWxkIG5hbWUgZXhpc3RlbmNlXG4gICAqXG4gICAqIEBwYXJhbSAgIHtTdHJpbmd9ICAgbmFtZSAgRmllbGQgbmFtZVxuICAgKiBAcmV0dXJuICB7Ym9vbGVhbn1cbiAgICovXG4gIGhhcyhuYW1lKSB7XG4gICAgcmV0dXJuIG5hbWUgaW4gd20odGhpcylcbiAgfVxuICBcblxuICAvKipcbiAgICogSXRlcmF0ZSBvdmVyIGFsbCBmaWVsZHMgbmFtZVxuICAgKlxuICAgKiBAcmV0dXJuIHtJdGVyYXRvcn1cbiAgICovXG4gICprZXlzKCkge1xuICAgIGZvciAobGV0IFtuYW1lXSBvZiB0aGlzKVxuICAgICAgeWllbGQgbmFtZVxuICB9XG5cblxuICAvKipcbiAgICogT3ZlcndyaXRlIGFsbCB2YWx1ZXMgZ2l2ZW4gbmFtZVxuICAgKlxuICAgKiBAcGFyYW0gICB7U3RyaW5nfSAgICBuYW1lICAgICAgRmlsZWQgbmFtZVxuICAgKiBAcGFyYW0gICB7U3RyaW5nfSAgICB2YWx1ZSAgICAgRmllbGQgdmFsdWVcbiAgICogQHBhcmFtICAge1N0cmluZz19ICAgZmlsZW5hbWUgIEZpbGVuYW1lIChvcHRpb25hbClcbiAgICogQHJldHVybiAge1VuZGVmaW5lZH1cbiAgICovXG4gIHNldChuYW1lLCB2YWx1ZSwgZmlsZW5hbWUpIHtcbiAgICB3bSh0aGlzKVtuYW1lXSA9IFtbdmFsdWUsIGZpbGVuYW1lXV1cbiAgfVxuXG5cbiAgLyoqXG4gICAqIEl0ZXJhdGUgb3ZlciBhbGwgZmllbGRzXG4gICAqXG4gICAqIEByZXR1cm4ge0l0ZXJhdG9yfVxuICAgKi9cbiAgKnZhbHVlcygpIHtcbiAgICBmb3IgKGxldCBbbmFtZSwgdmFsdWVdIG9mIHRoaXMpXG4gICAgICB5aWVsZCB2YWx1ZVxuICB9XG5cblxuICAvKipcbiAgICogTm9uIHN0YW5kYXJkIGJ1dCBpdCBoYXMgYmVlbiBwcm9wb3NlZDogaHR0cHM6Ly9naXRodWIuY29tL3czYy9GaWxlQVBJL2lzc3Vlcy80MFxuICAgKlxuICAgKiBAcmV0dXJuIHtSZWFkYWJsZVN0cmVhbX1cbiAgICovXG4gIHN0cmVhbSgpIHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIHRoaXMuX2Jsb2IoKS5zdHJlYW0oKVxuICAgIH0gY2F0Y2goZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbmNsdWRlIGh0dHBzOi8vZ2l0aHViLmNvbS9qaW1teXdhcnRpbmcvU2NyZXctRmlsZVJlYWRlciBmb3Igc3RyZWFtaW5nIHN1cHBvcnQnKVxuICAgIH1cbiAgfVxuXG5cbiAgLyoqXG4gICAqIFJldHVybiBhIG5hdGl2ZSAocGVyaGFwcyBkZWdyYWRlZCkgRm9ybURhdGEgd2l0aCBvbmx5IGEgYGFwcGVuZGAgbWV0aG9kXG4gICAqIENhbiB0aHJvdyBpZiBpdCdzIG5vdCBzdXBwb3J0ZWRcbiAgICpcbiAgICogQHJldHVybiB7Rm9ybURhdGF9XG4gICAqL1xuICBfYXNOYXRpdmUoKSB7XG4gICAgbGV0IGZkID0gbmV3IEZvcm1EYXRhXG5cbiAgICBmb3IgKGxldCBbbmFtZSwgdmFsdWVdIG9mIHRoaXMpXG4gICAgICBmZC5hcHBlbmQobmFtZSwgdmFsdWUpXG5cbiAgICByZXR1cm4gZmRcbiAgfVxuXG5cbiAgLyoqXG4gICAqIFtfYmxvYiBkZXNjcmlwdGlvbl1cbiAgICpcbiAgICogQHJldHVybiB7QmxvYn0gW2Rlc2NyaXB0aW9uXVxuICAgKi9cbiAgX2Jsb2IoKSB7XG4gICAgdmFyIGJvdW5kYXJ5ID0gJy0tLS1Gb3JtRGF0YVBvbHlmaWxsJyArIE1hdGgucmFuZG9tKClcbiAgICB2YXIgY2h1bmtzID0gW11cblxuICAgIGZvciAobGV0IFtuYW1lLCB2YWx1ZV0gb2YgdGhpcykge1xuICAgICAgY2h1bmtzLnB1c2goYC0tJHtib3VuZGFyeX1cXHJcXG5gKVxuXG4gICAgICBpZiAodmFsdWVbU3ltYm9sLnRvU3RyaW5nVGFnXSA9PT0gJ0ZpbGUnKSB7XG4gICAgICAgIGNodW5rcy5wdXNoKFxuICAgICAgICAgIGBDb250ZW50LURpc3Bvc2l0aW9uOiBmb3JtLWRhdGE7IG5hbWU9XCIke25hbWV9XCI7IGZpbGVuYW1lPVwiJHt2YWx1ZS5uYW1lfVwiXFxyXFxuYCxcbiAgICAgICAgICBgQ29udGVudC1UeXBlOiAke3ZhbHVlLnR5cGV9XFxyXFxuXFxyXFxuYCxcbiAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAnXFxyXFxuJ1xuICAgICAgICApXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjaHVua3MucHVzaChcbiAgICAgICAgICBgQ29udGVudC1EaXNwb3NpdGlvbjogZm9ybS1kYXRhOyBuYW1lPVwiJHtuYW1lfVwiXFxyXFxuXFxyXFxuJHt2YWx1ZX1cXHJcXG5gXG4gICAgICAgIClcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjaHVua3MucHVzaChgLS0ke2JvdW5kYXJ5fS0tYClcblxuICAgIHJldHVybiBuZXcgQmxvYihjaHVua3MsIHt0eXBlOiAnbXVsdGlwYXJ0L2Zvcm0tZGF0YTsgYm91bmRhcnk9JyArIGJvdW5kYXJ5fSlcbiAgfVxuXG5cbiAgLyoqXG4gICAqIFRoZSBjbGFzcyBpdHNlbGYgaXMgaXRlcmFibGVcbiAgICogYWxpYXMgZm9yIGZvcm1kYXRhLmVudHJpZXMoKVxuICAgKlxuICAgKiBAcmV0dXJuICB7SXRlcmF0b3J9XG4gICAqL1xuICBbU3ltYm9sLml0ZXJhdG9yXSgpIHtcbiAgICByZXR1cm4gdGhpcy5lbnRyaWVzKClcbiAgfVxuXG5cbiAgLyoqXG4gICAqIENyZWF0ZSB0aGUgZGVmYXVsdCBzdHJpbmcgZGVzY3JpcHRpb24uXG4gICAqIEl0IGlzIGFjY2Vzc2VkIGludGVybmFsbHkgYnkgdGhlIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcoKS5cbiAgICpcbiAgICogQHJldHVybiB7U3RyaW5nfSBGb3JtRGF0YVxuICAgKi9cbiAgZ2V0IFtTeW1ib2wudG9TdHJpbmdUYWddKCkge1xuICAgIHJldHVybiAnRm9ybURhdGEnXG4gIH1cbn1cblxuZm9yIChsZXQgW21ldGhvZCwgb3ZlcmlkZV0gb2YgW1xuICBbJ2FwcGVuZCcsIG5vcm1hbGl6ZUFyZ3NdLFxuICBbJ2RlbGV0ZScsIHN0cmluZ2lmeV0sXG4gIFsnZ2V0JywgICAgc3RyaW5naWZ5XSxcbiAgWydnZXRBbGwnLCBzdHJpbmdpZnldLFxuICBbJ2hhcycsICAgIHN0cmluZ2lmeV0sXG4gIFsnc2V0JywgICAgbm9ybWFsaXplQXJnc11cbl0pIHtcbiAgbGV0IG9yaWcgPSBGb3JtRGF0YVBvbHlmaWxsLnByb3RvdHlwZVttZXRob2RdXG4gIEZvcm1EYXRhUG9seWZpbGwucHJvdG90eXBlW21ldGhvZF0gPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gb3JpZy5hcHBseSh0aGlzLCBvdmVyaWRlKC4uLmFyZ3VtZW50cykpXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBGb3JtRGF0YVBvbHlmaWxsXG4iLCIvLyEgbW9tZW50LmpzXG4vLyEgdmVyc2lvbiA6IDIuMTcuMVxuLy8hIGF1dGhvcnMgOiBUaW0gV29vZCwgSXNrcmVuIENoZXJuZXYsIE1vbWVudC5qcyBjb250cmlidXRvcnNcbi8vISBsaWNlbnNlIDogTUlUXG4vLyEgbW9tZW50anMuY29tXG5cbjsoZnVuY3Rpb24gKGdsb2JhbCwgZmFjdG9yeSkge1xuICAgIHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyA/IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpIDpcbiAgICB0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgPyBkZWZpbmUoZmFjdG9yeSkgOlxuICAgIGdsb2JhbC5tb21lbnQgPSBmYWN0b3J5KClcbn0odGhpcywgKGZ1bmN0aW9uICgpIHsgJ3VzZSBzdHJpY3QnO1xuXG52YXIgaG9va0NhbGxiYWNrO1xuXG5mdW5jdGlvbiBob29rcyAoKSB7XG4gICAgcmV0dXJuIGhvb2tDYWxsYmFjay5hcHBseShudWxsLCBhcmd1bWVudHMpO1xufVxuXG4vLyBUaGlzIGlzIGRvbmUgdG8gcmVnaXN0ZXIgdGhlIG1ldGhvZCBjYWxsZWQgd2l0aCBtb21lbnQoKVxuLy8gd2l0aG91dCBjcmVhdGluZyBjaXJjdWxhciBkZXBlbmRlbmNpZXMuXG5mdW5jdGlvbiBzZXRIb29rQ2FsbGJhY2sgKGNhbGxiYWNrKSB7XG4gICAgaG9va0NhbGxiYWNrID0gY2FsbGJhY2s7XG59XG5cbmZ1bmN0aW9uIGlzQXJyYXkoaW5wdXQpIHtcbiAgICByZXR1cm4gaW5wdXQgaW5zdGFuY2VvZiBBcnJheSB8fCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoaW5wdXQpID09PSAnW29iamVjdCBBcnJheV0nO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChpbnB1dCkge1xuICAgIC8vIElFOCB3aWxsIHRyZWF0IHVuZGVmaW5lZCBhbmQgbnVsbCBhcyBvYmplY3QgaWYgaXQgd2Fzbid0IGZvclxuICAgIC8vIGlucHV0ICE9IG51bGxcbiAgICByZXR1cm4gaW5wdXQgIT0gbnVsbCAmJiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoaW5wdXQpID09PSAnW29iamVjdCBPYmplY3RdJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3RFbXB0eShvYmopIHtcbiAgICB2YXIgaztcbiAgICBmb3IgKGsgaW4gb2JqKSB7XG4gICAgICAgIC8vIGV2ZW4gaWYgaXRzIG5vdCBvd24gcHJvcGVydHkgSSdkIHN0aWxsIGNhbGwgaXQgbm9uLWVtcHR5XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGlucHV0KSB7XG4gICAgcmV0dXJuIHR5cGVvZiBpbnB1dCA9PT0gJ251bWJlcicgfHwgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGlucHV0KSA9PT0gJ1tvYmplY3QgTnVtYmVyXSc7XG59XG5cbmZ1bmN0aW9uIGlzRGF0ZShpbnB1dCkge1xuICAgIHJldHVybiBpbnB1dCBpbnN0YW5jZW9mIERhdGUgfHwgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGlucHV0KSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuXG5mdW5jdGlvbiBtYXAoYXJyLCBmbikge1xuICAgIHZhciByZXMgPSBbXSwgaTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHJlcy5wdXNoKGZuKGFycltpXSwgaSkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuXG5mdW5jdGlvbiBoYXNPd25Qcm9wKGEsIGIpIHtcbiAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGEsIGIpO1xufVxuXG5mdW5jdGlvbiBleHRlbmQoYSwgYikge1xuICAgIGZvciAodmFyIGkgaW4gYikge1xuICAgICAgICBpZiAoaGFzT3duUHJvcChiLCBpKSkge1xuICAgICAgICAgICAgYVtpXSA9IGJbaV07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaGFzT3duUHJvcChiLCAndG9TdHJpbmcnKSkge1xuICAgICAgICBhLnRvU3RyaW5nID0gYi50b1N0cmluZztcbiAgICB9XG5cbiAgICBpZiAoaGFzT3duUHJvcChiLCAndmFsdWVPZicpKSB7XG4gICAgICAgIGEudmFsdWVPZiA9IGIudmFsdWVPZjtcbiAgICB9XG5cbiAgICByZXR1cm4gYTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlVVRDIChpbnB1dCwgZm9ybWF0LCBsb2NhbGUsIHN0cmljdCkge1xuICAgIHJldHVybiBjcmVhdGVMb2NhbE9yVVRDKGlucHV0LCBmb3JtYXQsIGxvY2FsZSwgc3RyaWN0LCB0cnVlKS51dGMoKTtcbn1cblxuZnVuY3Rpb24gZGVmYXVsdFBhcnNpbmdGbGFncygpIHtcbiAgICAvLyBXZSBuZWVkIHRvIGRlZXAgY2xvbmUgdGhpcyBvYmplY3QuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZW1wdHkgICAgICAgICAgIDogZmFsc2UsXG4gICAgICAgIHVudXNlZFRva2VucyAgICA6IFtdLFxuICAgICAgICB1bnVzZWRJbnB1dCAgICAgOiBbXSxcbiAgICAgICAgb3ZlcmZsb3cgICAgICAgIDogLTIsXG4gICAgICAgIGNoYXJzTGVmdE92ZXIgICA6IDAsXG4gICAgICAgIG51bGxJbnB1dCAgICAgICA6IGZhbHNlLFxuICAgICAgICBpbnZhbGlkTW9udGggICAgOiBudWxsLFxuICAgICAgICBpbnZhbGlkRm9ybWF0ICAgOiBmYWxzZSxcbiAgICAgICAgdXNlckludmFsaWRhdGVkIDogZmFsc2UsXG4gICAgICAgIGlzbyAgICAgICAgICAgICA6IGZhbHNlLFxuICAgICAgICBwYXJzZWREYXRlUGFydHMgOiBbXSxcbiAgICAgICAgbWVyaWRpZW0gICAgICAgIDogbnVsbFxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGdldFBhcnNpbmdGbGFncyhtKSB7XG4gICAgaWYgKG0uX3BmID09IG51bGwpIHtcbiAgICAgICAgbS5fcGYgPSBkZWZhdWx0UGFyc2luZ0ZsYWdzKCk7XG4gICAgfVxuICAgIHJldHVybiBtLl9wZjtcbn1cblxudmFyIHNvbWU7XG5pZiAoQXJyYXkucHJvdG90eXBlLnNvbWUpIHtcbiAgICBzb21lID0gQXJyYXkucHJvdG90eXBlLnNvbWU7XG59IGVsc2Uge1xuICAgIHNvbWUgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgICAgIHZhciB0ID0gT2JqZWN0KHRoaXMpO1xuICAgICAgICB2YXIgbGVuID0gdC5sZW5ndGggPj4+IDA7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgaWYgKGkgaW4gdCAmJiBmdW4uY2FsbCh0aGlzLCB0W2ldLCBpLCB0KSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG59XG5cbnZhciBzb21lJDEgPSBzb21lO1xuXG5mdW5jdGlvbiBpc1ZhbGlkKG0pIHtcbiAgICBpZiAobS5faXNWYWxpZCA9PSBudWxsKSB7XG4gICAgICAgIHZhciBmbGFncyA9IGdldFBhcnNpbmdGbGFncyhtKTtcbiAgICAgICAgdmFyIHBhcnNlZFBhcnRzID0gc29tZSQxLmNhbGwoZmxhZ3MucGFyc2VkRGF0ZVBhcnRzLCBmdW5jdGlvbiAoaSkge1xuICAgICAgICAgICAgcmV0dXJuIGkgIT0gbnVsbDtcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBpc05vd1ZhbGlkID0gIWlzTmFOKG0uX2QuZ2V0VGltZSgpKSAmJlxuICAgICAgICAgICAgZmxhZ3Mub3ZlcmZsb3cgPCAwICYmXG4gICAgICAgICAgICAhZmxhZ3MuZW1wdHkgJiZcbiAgICAgICAgICAgICFmbGFncy5pbnZhbGlkTW9udGggJiZcbiAgICAgICAgICAgICFmbGFncy5pbnZhbGlkV2Vla2RheSAmJlxuICAgICAgICAgICAgIWZsYWdzLm51bGxJbnB1dCAmJlxuICAgICAgICAgICAgIWZsYWdzLmludmFsaWRGb3JtYXQgJiZcbiAgICAgICAgICAgICFmbGFncy51c2VySW52YWxpZGF0ZWQgJiZcbiAgICAgICAgICAgICghZmxhZ3MubWVyaWRpZW0gfHwgKGZsYWdzLm1lcmlkaWVtICYmIHBhcnNlZFBhcnRzKSk7XG5cbiAgICAgICAgaWYgKG0uX3N0cmljdCkge1xuICAgICAgICAgICAgaXNOb3dWYWxpZCA9IGlzTm93VmFsaWQgJiZcbiAgICAgICAgICAgICAgICBmbGFncy5jaGFyc0xlZnRPdmVyID09PSAwICYmXG4gICAgICAgICAgICAgICAgZmxhZ3MudW51c2VkVG9rZW5zLmxlbmd0aCA9PT0gMCAmJlxuICAgICAgICAgICAgICAgIGZsYWdzLmJpZ0hvdXIgPT09IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChPYmplY3QuaXNGcm96ZW4gPT0gbnVsbCB8fCAhT2JqZWN0LmlzRnJvemVuKG0pKSB7XG4gICAgICAgICAgICBtLl9pc1ZhbGlkID0gaXNOb3dWYWxpZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBpc05vd1ZhbGlkO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtLl9pc1ZhbGlkO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVJbnZhbGlkIChmbGFncykge1xuICAgIHZhciBtID0gY3JlYXRlVVRDKE5hTik7XG4gICAgaWYgKGZsYWdzICE9IG51bGwpIHtcbiAgICAgICAgZXh0ZW5kKGdldFBhcnNpbmdGbGFncyhtKSwgZmxhZ3MpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKG0pLnVzZXJJbnZhbGlkYXRlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIG07XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGlucHV0KSB7XG4gICAgcmV0dXJuIGlucHV0ID09PSB2b2lkIDA7XG59XG5cbi8vIFBsdWdpbnMgdGhhdCBhZGQgcHJvcGVydGllcyBzaG91bGQgYWxzbyBhZGQgdGhlIGtleSBoZXJlIChudWxsIHZhbHVlKSxcbi8vIHNvIHdlIGNhbiBwcm9wZXJseSBjbG9uZSBvdXJzZWx2ZXMuXG52YXIgbW9tZW50UHJvcGVydGllcyA9IGhvb2tzLm1vbWVudFByb3BlcnRpZXMgPSBbXTtcblxuZnVuY3Rpb24gY29weUNvbmZpZyh0bywgZnJvbSkge1xuICAgIHZhciBpLCBwcm9wLCB2YWw7XG5cbiAgICBpZiAoIWlzVW5kZWZpbmVkKGZyb20uX2lzQU1vbWVudE9iamVjdCkpIHtcbiAgICAgICAgdG8uX2lzQU1vbWVudE9iamVjdCA9IGZyb20uX2lzQU1vbWVudE9iamVjdDtcbiAgICB9XG4gICAgaWYgKCFpc1VuZGVmaW5lZChmcm9tLl9pKSkge1xuICAgICAgICB0by5faSA9IGZyb20uX2k7XG4gICAgfVxuICAgIGlmICghaXNVbmRlZmluZWQoZnJvbS5fZikpIHtcbiAgICAgICAgdG8uX2YgPSBmcm9tLl9mO1xuICAgIH1cbiAgICBpZiAoIWlzVW5kZWZpbmVkKGZyb20uX2wpKSB7XG4gICAgICAgIHRvLl9sID0gZnJvbS5fbDtcbiAgICB9XG4gICAgaWYgKCFpc1VuZGVmaW5lZChmcm9tLl9zdHJpY3QpKSB7XG4gICAgICAgIHRvLl9zdHJpY3QgPSBmcm9tLl9zdHJpY3Q7XG4gICAgfVxuICAgIGlmICghaXNVbmRlZmluZWQoZnJvbS5fdHptKSkge1xuICAgICAgICB0by5fdHptID0gZnJvbS5fdHptO1xuICAgIH1cbiAgICBpZiAoIWlzVW5kZWZpbmVkKGZyb20uX2lzVVRDKSkge1xuICAgICAgICB0by5faXNVVEMgPSBmcm9tLl9pc1VUQztcbiAgICB9XG4gICAgaWYgKCFpc1VuZGVmaW5lZChmcm9tLl9vZmZzZXQpKSB7XG4gICAgICAgIHRvLl9vZmZzZXQgPSBmcm9tLl9vZmZzZXQ7XG4gICAgfVxuICAgIGlmICghaXNVbmRlZmluZWQoZnJvbS5fcGYpKSB7XG4gICAgICAgIHRvLl9wZiA9IGdldFBhcnNpbmdGbGFncyhmcm9tKTtcbiAgICB9XG4gICAgaWYgKCFpc1VuZGVmaW5lZChmcm9tLl9sb2NhbGUpKSB7XG4gICAgICAgIHRvLl9sb2NhbGUgPSBmcm9tLl9sb2NhbGU7XG4gICAgfVxuXG4gICAgaWYgKG1vbWVudFByb3BlcnRpZXMubGVuZ3RoID4gMCkge1xuICAgICAgICBmb3IgKGkgaW4gbW9tZW50UHJvcGVydGllcykge1xuICAgICAgICAgICAgcHJvcCA9IG1vbWVudFByb3BlcnRpZXNbaV07XG4gICAgICAgICAgICB2YWwgPSBmcm9tW3Byb3BdO1xuICAgICAgICAgICAgaWYgKCFpc1VuZGVmaW5lZCh2YWwpKSB7XG4gICAgICAgICAgICAgICAgdG9bcHJvcF0gPSB2YWw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdG87XG59XG5cbnZhciB1cGRhdGVJblByb2dyZXNzID0gZmFsc2U7XG5cbi8vIE1vbWVudCBwcm90b3R5cGUgb2JqZWN0XG5mdW5jdGlvbiBNb21lbnQoY29uZmlnKSB7XG4gICAgY29weUNvbmZpZyh0aGlzLCBjb25maWcpO1xuICAgIHRoaXMuX2QgPSBuZXcgRGF0ZShjb25maWcuX2QgIT0gbnVsbCA/IGNvbmZpZy5fZC5nZXRUaW1lKCkgOiBOYU4pO1xuICAgIGlmICghdGhpcy5pc1ZhbGlkKCkpIHtcbiAgICAgICAgdGhpcy5fZCA9IG5ldyBEYXRlKE5hTik7XG4gICAgfVxuICAgIC8vIFByZXZlbnQgaW5maW5pdGUgbG9vcCBpbiBjYXNlIHVwZGF0ZU9mZnNldCBjcmVhdGVzIG5ldyBtb21lbnRcbiAgICAvLyBvYmplY3RzLlxuICAgIGlmICh1cGRhdGVJblByb2dyZXNzID09PSBmYWxzZSkge1xuICAgICAgICB1cGRhdGVJblByb2dyZXNzID0gdHJ1ZTtcbiAgICAgICAgaG9va3MudXBkYXRlT2Zmc2V0KHRoaXMpO1xuICAgICAgICB1cGRhdGVJblByb2dyZXNzID0gZmFsc2U7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpc01vbWVudCAob2JqKSB7XG4gICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIE1vbWVudCB8fCAob2JqICE9IG51bGwgJiYgb2JqLl9pc0FNb21lbnRPYmplY3QgIT0gbnVsbCk7XG59XG5cbmZ1bmN0aW9uIGFic0Zsb29yIChudW1iZXIpIHtcbiAgICBpZiAobnVtYmVyIDwgMCkge1xuICAgICAgICAvLyAtMCAtPiAwXG4gICAgICAgIHJldHVybiBNYXRoLmNlaWwobnVtYmVyKSB8fCAwO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBNYXRoLmZsb29yKG51bWJlcik7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB0b0ludChhcmd1bWVudEZvckNvZXJjaW9uKSB7XG4gICAgdmFyIGNvZXJjZWROdW1iZXIgPSArYXJndW1lbnRGb3JDb2VyY2lvbixcbiAgICAgICAgdmFsdWUgPSAwO1xuXG4gICAgaWYgKGNvZXJjZWROdW1iZXIgIT09IDAgJiYgaXNGaW5pdGUoY29lcmNlZE51bWJlcikpIHtcbiAgICAgICAgdmFsdWUgPSBhYnNGbG9vcihjb2VyY2VkTnVtYmVyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWU7XG59XG5cbi8vIGNvbXBhcmUgdHdvIGFycmF5cywgcmV0dXJuIHRoZSBudW1iZXIgb2YgZGlmZmVyZW5jZXNcbmZ1bmN0aW9uIGNvbXBhcmVBcnJheXMoYXJyYXkxLCBhcnJheTIsIGRvbnRDb252ZXJ0KSB7XG4gICAgdmFyIGxlbiA9IE1hdGgubWluKGFycmF5MS5sZW5ndGgsIGFycmF5Mi5sZW5ndGgpLFxuICAgICAgICBsZW5ndGhEaWZmID0gTWF0aC5hYnMoYXJyYXkxLmxlbmd0aCAtIGFycmF5Mi5sZW5ndGgpLFxuICAgICAgICBkaWZmcyA9IDAsXG4gICAgICAgIGk7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGlmICgoZG9udENvbnZlcnQgJiYgYXJyYXkxW2ldICE9PSBhcnJheTJbaV0pIHx8XG4gICAgICAgICAgICAoIWRvbnRDb252ZXJ0ICYmIHRvSW50KGFycmF5MVtpXSkgIT09IHRvSW50KGFycmF5MltpXSkpKSB7XG4gICAgICAgICAgICBkaWZmcysrO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkaWZmcyArIGxlbmd0aERpZmY7XG59XG5cbmZ1bmN0aW9uIHdhcm4obXNnKSB7XG4gICAgaWYgKGhvb2tzLnN1cHByZXNzRGVwcmVjYXRpb25XYXJuaW5ncyA9PT0gZmFsc2UgJiZcbiAgICAgICAgICAgICh0eXBlb2YgY29uc29sZSAhPT0gICd1bmRlZmluZWQnKSAmJiBjb25zb2xlLndhcm4pIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdEZXByZWNhdGlvbiB3YXJuaW5nOiAnICsgbXNnKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRlcHJlY2F0ZShtc2csIGZuKSB7XG4gICAgdmFyIGZpcnN0VGltZSA9IHRydWU7XG5cbiAgICByZXR1cm4gZXh0ZW5kKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKGhvb2tzLmRlcHJlY2F0aW9uSGFuZGxlciAhPSBudWxsKSB7XG4gICAgICAgICAgICBob29rcy5kZXByZWNhdGlvbkhhbmRsZXIobnVsbCwgbXNnKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZmlyc3RUaW1lKSB7XG4gICAgICAgICAgICB2YXIgYXJncyA9IFtdO1xuICAgICAgICAgICAgdmFyIGFyZztcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgYXJnID0gJyc7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBhcmd1bWVudHNbaV0gPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyZyArPSAnXFxuWycgKyBpICsgJ10gJztcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIGFyZ3VtZW50c1swXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJnICs9IGtleSArICc6ICcgKyBhcmd1bWVudHNbMF1ba2V5XSArICcsICc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJnLnNsaWNlKDAsIC0yKTsgLy8gUmVtb3ZlIHRyYWlsaW5nIGNvbW1hIGFuZCBzcGFjZVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYXJncy5wdXNoKGFyZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB3YXJuKG1zZyArICdcXG5Bcmd1bWVudHM6ICcgKyBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmdzKS5qb2luKCcnKSArICdcXG4nICsgKG5ldyBFcnJvcigpKS5zdGFjayk7XG4gICAgICAgICAgICBmaXJzdFRpbWUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9LCBmbik7XG59XG5cbnZhciBkZXByZWNhdGlvbnMgPSB7fTtcblxuZnVuY3Rpb24gZGVwcmVjYXRlU2ltcGxlKG5hbWUsIG1zZykge1xuICAgIGlmIChob29rcy5kZXByZWNhdGlvbkhhbmRsZXIgIT0gbnVsbCkge1xuICAgICAgICBob29rcy5kZXByZWNhdGlvbkhhbmRsZXIobmFtZSwgbXNnKTtcbiAgICB9XG4gICAgaWYgKCFkZXByZWNhdGlvbnNbbmFtZV0pIHtcbiAgICAgICAgd2Fybihtc2cpO1xuICAgICAgICBkZXByZWNhdGlvbnNbbmFtZV0gPSB0cnVlO1xuICAgIH1cbn1cblxuaG9va3Muc3VwcHJlc3NEZXByZWNhdGlvbldhcm5pbmdzID0gZmFsc2U7XG5ob29rcy5kZXByZWNhdGlvbkhhbmRsZXIgPSBudWxsO1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGlucHV0KSB7XG4gICAgcmV0dXJuIGlucHV0IGluc3RhbmNlb2YgRnVuY3Rpb24gfHwgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGlucHV0KSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJztcbn1cblxuZnVuY3Rpb24gc2V0IChjb25maWcpIHtcbiAgICB2YXIgcHJvcCwgaTtcbiAgICBmb3IgKGkgaW4gY29uZmlnKSB7XG4gICAgICAgIHByb3AgPSBjb25maWdbaV07XG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHByb3ApKSB7XG4gICAgICAgICAgICB0aGlzW2ldID0gcHJvcDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXNbJ18nICsgaV0gPSBwcm9wO1xuICAgICAgICB9XG4gICAgfVxuICAgIHRoaXMuX2NvbmZpZyA9IGNvbmZpZztcbiAgICAvLyBMZW5pZW50IG9yZGluYWwgcGFyc2luZyBhY2NlcHRzIGp1c3QgYSBudW1iZXIgaW4gYWRkaXRpb24gdG9cbiAgICAvLyBudW1iZXIgKyAocG9zc2libHkpIHN0dWZmIGNvbWluZyBmcm9tIF9vcmRpbmFsUGFyc2VMZW5pZW50LlxuICAgIHRoaXMuX29yZGluYWxQYXJzZUxlbmllbnQgPSBuZXcgUmVnRXhwKHRoaXMuX29yZGluYWxQYXJzZS5zb3VyY2UgKyAnfCcgKyAoL1xcZHsxLDJ9Lykuc291cmNlKTtcbn1cblxuZnVuY3Rpb24gbWVyZ2VDb25maWdzKHBhcmVudENvbmZpZywgY2hpbGRDb25maWcpIHtcbiAgICB2YXIgcmVzID0gZXh0ZW5kKHt9LCBwYXJlbnRDb25maWcpLCBwcm9wO1xuICAgIGZvciAocHJvcCBpbiBjaGlsZENvbmZpZykge1xuICAgICAgICBpZiAoaGFzT3duUHJvcChjaGlsZENvbmZpZywgcHJvcCkpIHtcbiAgICAgICAgICAgIGlmIChpc09iamVjdChwYXJlbnRDb25maWdbcHJvcF0pICYmIGlzT2JqZWN0KGNoaWxkQ29uZmlnW3Byb3BdKSkge1xuICAgICAgICAgICAgICAgIHJlc1twcm9wXSA9IHt9O1xuICAgICAgICAgICAgICAgIGV4dGVuZChyZXNbcHJvcF0sIHBhcmVudENvbmZpZ1twcm9wXSk7XG4gICAgICAgICAgICAgICAgZXh0ZW5kKHJlc1twcm9wXSwgY2hpbGRDb25maWdbcHJvcF0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjaGlsZENvbmZpZ1twcm9wXSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmVzW3Byb3BdID0gY2hpbGRDb25maWdbcHJvcF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSByZXNbcHJvcF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yIChwcm9wIGluIHBhcmVudENvbmZpZykge1xuICAgICAgICBpZiAoaGFzT3duUHJvcChwYXJlbnRDb25maWcsIHByb3ApICYmXG4gICAgICAgICAgICAgICAgIWhhc093blByb3AoY2hpbGRDb25maWcsIHByb3ApICYmXG4gICAgICAgICAgICAgICAgaXNPYmplY3QocGFyZW50Q29uZmlnW3Byb3BdKSkge1xuICAgICAgICAgICAgLy8gbWFrZSBzdXJlIGNoYW5nZXMgdG8gcHJvcGVydGllcyBkb24ndCBtb2RpZnkgcGFyZW50IGNvbmZpZ1xuICAgICAgICAgICAgcmVzW3Byb3BdID0gZXh0ZW5kKHt9LCByZXNbcHJvcF0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXM7XG59XG5cbmZ1bmN0aW9uIExvY2FsZShjb25maWcpIHtcbiAgICBpZiAoY29uZmlnICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy5zZXQoY29uZmlnKTtcbiAgICB9XG59XG5cbnZhciBrZXlzO1xuXG5pZiAoT2JqZWN0LmtleXMpIHtcbiAgICBrZXlzID0gT2JqZWN0LmtleXM7XG59IGVsc2Uge1xuICAgIGtleXMgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIHZhciBpLCByZXMgPSBbXTtcbiAgICAgICAgZm9yIChpIGluIG9iaikge1xuICAgICAgICAgICAgaWYgKGhhc093blByb3Aob2JqLCBpKSkge1xuICAgICAgICAgICAgICAgIHJlcy5wdXNoKGkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfTtcbn1cblxudmFyIGtleXMkMSA9IGtleXM7XG5cbnZhciBkZWZhdWx0Q2FsZW5kYXIgPSB7XG4gICAgc2FtZURheSA6ICdbVG9kYXkgYXRdIExUJyxcbiAgICBuZXh0RGF5IDogJ1tUb21vcnJvdyBhdF0gTFQnLFxuICAgIG5leHRXZWVrIDogJ2RkZGQgW2F0XSBMVCcsXG4gICAgbGFzdERheSA6ICdbWWVzdGVyZGF5IGF0XSBMVCcsXG4gICAgbGFzdFdlZWsgOiAnW0xhc3RdIGRkZGQgW2F0XSBMVCcsXG4gICAgc2FtZUVsc2UgOiAnTCdcbn07XG5cbmZ1bmN0aW9uIGNhbGVuZGFyIChrZXksIG1vbSwgbm93KSB7XG4gICAgdmFyIG91dHB1dCA9IHRoaXMuX2NhbGVuZGFyW2tleV0gfHwgdGhpcy5fY2FsZW5kYXJbJ3NhbWVFbHNlJ107XG4gICAgcmV0dXJuIGlzRnVuY3Rpb24ob3V0cHV0KSA/IG91dHB1dC5jYWxsKG1vbSwgbm93KSA6IG91dHB1dDtcbn1cblxudmFyIGRlZmF1bHRMb25nRGF0ZUZvcm1hdCA9IHtcbiAgICBMVFMgIDogJ2g6bW06c3MgQScsXG4gICAgTFQgICA6ICdoOm1tIEEnLFxuICAgIEwgICAgOiAnTU0vREQvWVlZWScsXG4gICAgTEwgICA6ICdNTU1NIEQsIFlZWVknLFxuICAgIExMTCAgOiAnTU1NTSBELCBZWVlZIGg6bW0gQScsXG4gICAgTExMTCA6ICdkZGRkLCBNTU1NIEQsIFlZWVkgaDptbSBBJ1xufTtcblxuZnVuY3Rpb24gbG9uZ0RhdGVGb3JtYXQgKGtleSkge1xuICAgIHZhciBmb3JtYXQgPSB0aGlzLl9sb25nRGF0ZUZvcm1hdFtrZXldLFxuICAgICAgICBmb3JtYXRVcHBlciA9IHRoaXMuX2xvbmdEYXRlRm9ybWF0W2tleS50b1VwcGVyQ2FzZSgpXTtcblxuICAgIGlmIChmb3JtYXQgfHwgIWZvcm1hdFVwcGVyKSB7XG4gICAgICAgIHJldHVybiBmb3JtYXQ7XG4gICAgfVxuXG4gICAgdGhpcy5fbG9uZ0RhdGVGb3JtYXRba2V5XSA9IGZvcm1hdFVwcGVyLnJlcGxhY2UoL01NTU18TU18RER8ZGRkZC9nLCBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgIHJldHVybiB2YWwuc2xpY2UoMSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcy5fbG9uZ0RhdGVGb3JtYXRba2V5XTtcbn1cblxudmFyIGRlZmF1bHRJbnZhbGlkRGF0ZSA9ICdJbnZhbGlkIGRhdGUnO1xuXG5mdW5jdGlvbiBpbnZhbGlkRGF0ZSAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2ludmFsaWREYXRlO1xufVxuXG52YXIgZGVmYXVsdE9yZGluYWwgPSAnJWQnO1xudmFyIGRlZmF1bHRPcmRpbmFsUGFyc2UgPSAvXFxkezEsMn0vO1xuXG5mdW5jdGlvbiBvcmRpbmFsIChudW1iZXIpIHtcbiAgICByZXR1cm4gdGhpcy5fb3JkaW5hbC5yZXBsYWNlKCclZCcsIG51bWJlcik7XG59XG5cbnZhciBkZWZhdWx0UmVsYXRpdmVUaW1lID0ge1xuICAgIGZ1dHVyZSA6ICdpbiAlcycsXG4gICAgcGFzdCAgIDogJyVzIGFnbycsXG4gICAgcyAgOiAnYSBmZXcgc2Vjb25kcycsXG4gICAgbSAgOiAnYSBtaW51dGUnLFxuICAgIG1tIDogJyVkIG1pbnV0ZXMnLFxuICAgIGggIDogJ2FuIGhvdXInLFxuICAgIGhoIDogJyVkIGhvdXJzJyxcbiAgICBkICA6ICdhIGRheScsXG4gICAgZGQgOiAnJWQgZGF5cycsXG4gICAgTSAgOiAnYSBtb250aCcsXG4gICAgTU0gOiAnJWQgbW9udGhzJyxcbiAgICB5ICA6ICdhIHllYXInLFxuICAgIHl5IDogJyVkIHllYXJzJ1xufTtcblxuZnVuY3Rpb24gcmVsYXRpdmVUaW1lIChudW1iZXIsIHdpdGhvdXRTdWZmaXgsIHN0cmluZywgaXNGdXR1cmUpIHtcbiAgICB2YXIgb3V0cHV0ID0gdGhpcy5fcmVsYXRpdmVUaW1lW3N0cmluZ107XG4gICAgcmV0dXJuIChpc0Z1bmN0aW9uKG91dHB1dCkpID9cbiAgICAgICAgb3V0cHV0KG51bWJlciwgd2l0aG91dFN1ZmZpeCwgc3RyaW5nLCBpc0Z1dHVyZSkgOlxuICAgICAgICBvdXRwdXQucmVwbGFjZSgvJWQvaSwgbnVtYmVyKTtcbn1cblxuZnVuY3Rpb24gcGFzdEZ1dHVyZSAoZGlmZiwgb3V0cHV0KSB7XG4gICAgdmFyIGZvcm1hdCA9IHRoaXMuX3JlbGF0aXZlVGltZVtkaWZmID4gMCA/ICdmdXR1cmUnIDogJ3Bhc3QnXTtcbiAgICByZXR1cm4gaXNGdW5jdGlvbihmb3JtYXQpID8gZm9ybWF0KG91dHB1dCkgOiBmb3JtYXQucmVwbGFjZSgvJXMvaSwgb3V0cHV0KTtcbn1cblxudmFyIGFsaWFzZXMgPSB7fTtcblxuZnVuY3Rpb24gYWRkVW5pdEFsaWFzICh1bml0LCBzaG9ydGhhbmQpIHtcbiAgICB2YXIgbG93ZXJDYXNlID0gdW5pdC50b0xvd2VyQ2FzZSgpO1xuICAgIGFsaWFzZXNbbG93ZXJDYXNlXSA9IGFsaWFzZXNbbG93ZXJDYXNlICsgJ3MnXSA9IGFsaWFzZXNbc2hvcnRoYW5kXSA9IHVuaXQ7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVVuaXRzKHVuaXRzKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB1bml0cyA9PT0gJ3N0cmluZycgPyBhbGlhc2VzW3VuaXRzXSB8fCBhbGlhc2VzW3VuaXRzLnRvTG93ZXJDYXNlKCldIDogdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVPYmplY3RVbml0cyhpbnB1dE9iamVjdCkge1xuICAgIHZhciBub3JtYWxpemVkSW5wdXQgPSB7fSxcbiAgICAgICAgbm9ybWFsaXplZFByb3AsXG4gICAgICAgIHByb3A7XG5cbiAgICBmb3IgKHByb3AgaW4gaW5wdXRPYmplY3QpIHtcbiAgICAgICAgaWYgKGhhc093blByb3AoaW5wdXRPYmplY3QsIHByb3ApKSB7XG4gICAgICAgICAgICBub3JtYWxpemVkUHJvcCA9IG5vcm1hbGl6ZVVuaXRzKHByb3ApO1xuICAgICAgICAgICAgaWYgKG5vcm1hbGl6ZWRQcm9wKSB7XG4gICAgICAgICAgICAgICAgbm9ybWFsaXplZElucHV0W25vcm1hbGl6ZWRQcm9wXSA9IGlucHV0T2JqZWN0W3Byb3BdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG5vcm1hbGl6ZWRJbnB1dDtcbn1cblxudmFyIHByaW9yaXRpZXMgPSB7fTtcblxuZnVuY3Rpb24gYWRkVW5pdFByaW9yaXR5KHVuaXQsIHByaW9yaXR5KSB7XG4gICAgcHJpb3JpdGllc1t1bml0XSA9IHByaW9yaXR5O1xufVxuXG5mdW5jdGlvbiBnZXRQcmlvcml0aXplZFVuaXRzKHVuaXRzT2JqKSB7XG4gICAgdmFyIHVuaXRzID0gW107XG4gICAgZm9yICh2YXIgdSBpbiB1bml0c09iaikge1xuICAgICAgICB1bml0cy5wdXNoKHt1bml0OiB1LCBwcmlvcml0eTogcHJpb3JpdGllc1t1XX0pO1xuICAgIH1cbiAgICB1bml0cy5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgIHJldHVybiBhLnByaW9yaXR5IC0gYi5wcmlvcml0eTtcbiAgICB9KTtcbiAgICByZXR1cm4gdW5pdHM7XG59XG5cbmZ1bmN0aW9uIG1ha2VHZXRTZXQgKHVuaXQsIGtlZXBUaW1lKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgICAgICAgc2V0JDEodGhpcywgdW5pdCwgdmFsdWUpO1xuICAgICAgICAgICAgaG9va3MudXBkYXRlT2Zmc2V0KHRoaXMsIGtlZXBUaW1lKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGdldCh0aGlzLCB1bml0KTtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGdldCAobW9tLCB1bml0KSB7XG4gICAgcmV0dXJuIG1vbS5pc1ZhbGlkKCkgP1xuICAgICAgICBtb20uX2RbJ2dldCcgKyAobW9tLl9pc1VUQyA/ICdVVEMnIDogJycpICsgdW5pdF0oKSA6IE5hTjtcbn1cblxuZnVuY3Rpb24gc2V0JDEgKG1vbSwgdW5pdCwgdmFsdWUpIHtcbiAgICBpZiAobW9tLmlzVmFsaWQoKSkge1xuICAgICAgICBtb20uX2RbJ3NldCcgKyAobW9tLl9pc1VUQyA/ICdVVEMnIDogJycpICsgdW5pdF0odmFsdWUpO1xuICAgIH1cbn1cblxuLy8gTU9NRU5UU1xuXG5mdW5jdGlvbiBzdHJpbmdHZXQgKHVuaXRzKSB7XG4gICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyk7XG4gICAgaWYgKGlzRnVuY3Rpb24odGhpc1t1bml0c10pKSB7XG4gICAgICAgIHJldHVybiB0aGlzW3VuaXRzXSgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn1cblxuXG5mdW5jdGlvbiBzdHJpbmdTZXQgKHVuaXRzLCB2YWx1ZSkge1xuICAgIGlmICh0eXBlb2YgdW5pdHMgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIHVuaXRzID0gbm9ybWFsaXplT2JqZWN0VW5pdHModW5pdHMpO1xuICAgICAgICB2YXIgcHJpb3JpdGl6ZWQgPSBnZXRQcmlvcml0aXplZFVuaXRzKHVuaXRzKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcmlvcml0aXplZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGhpc1twcmlvcml0aXplZFtpXS51bml0XSh1bml0c1twcmlvcml0aXplZFtpXS51bml0XSk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24odGhpc1t1bml0c10pKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpc1t1bml0c10odmFsdWUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufVxuXG5mdW5jdGlvbiB6ZXJvRmlsbChudW1iZXIsIHRhcmdldExlbmd0aCwgZm9yY2VTaWduKSB7XG4gICAgdmFyIGFic051bWJlciA9ICcnICsgTWF0aC5hYnMobnVtYmVyKSxcbiAgICAgICAgemVyb3NUb0ZpbGwgPSB0YXJnZXRMZW5ndGggLSBhYnNOdW1iZXIubGVuZ3RoLFxuICAgICAgICBzaWduID0gbnVtYmVyID49IDA7XG4gICAgcmV0dXJuIChzaWduID8gKGZvcmNlU2lnbiA/ICcrJyA6ICcnKSA6ICctJykgK1xuICAgICAgICBNYXRoLnBvdygxMCwgTWF0aC5tYXgoMCwgemVyb3NUb0ZpbGwpKS50b1N0cmluZygpLnN1YnN0cigxKSArIGFic051bWJlcjtcbn1cblxudmFyIGZvcm1hdHRpbmdUb2tlbnMgPSAvKFxcW1teXFxbXSpcXF0pfChcXFxcKT8oW0hoXW1tKHNzKT98TW98TU0/TT9NP3xEb3xERERvfEREP0Q/RD98ZGRkP2Q/fGRvP3x3W298d10/fFdbb3xXXT98UW8/fFlZWVlZWXxZWVlZWXxZWVlZfFlZfGdnKGdnZz8pP3xHRyhHR0c/KT98ZXxFfGF8QXxoaD98SEg/fGtrP3xtbT98c3M/fFN7MSw5fXx4fFh8eno/fFpaP3wuKS9nO1xuXG52YXIgbG9jYWxGb3JtYXR0aW5nVG9rZW5zID0gLyhcXFtbXlxcW10qXFxdKXwoXFxcXCk/KExUU3xMVHxMTD9MP0w/fGx7MSw0fSkvZztcblxudmFyIGZvcm1hdEZ1bmN0aW9ucyA9IHt9O1xuXG52YXIgZm9ybWF0VG9rZW5GdW5jdGlvbnMgPSB7fTtcblxuLy8gdG9rZW46ICAgICdNJ1xuLy8gcGFkZGVkOiAgIFsnTU0nLCAyXVxuLy8gb3JkaW5hbDogICdNbydcbi8vIGNhbGxiYWNrOiBmdW5jdGlvbiAoKSB7IHRoaXMubW9udGgoKSArIDEgfVxuZnVuY3Rpb24gYWRkRm9ybWF0VG9rZW4gKHRva2VuLCBwYWRkZWQsIG9yZGluYWwsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGZ1bmMgPSBjYWxsYmFjaztcbiAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnc3RyaW5nJykge1xuICAgICAgICBmdW5jID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXNbY2FsbGJhY2tdKCk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGlmICh0b2tlbikge1xuICAgICAgICBmb3JtYXRUb2tlbkZ1bmN0aW9uc1t0b2tlbl0gPSBmdW5jO1xuICAgIH1cbiAgICBpZiAocGFkZGVkKSB7XG4gICAgICAgIGZvcm1hdFRva2VuRnVuY3Rpb25zW3BhZGRlZFswXV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gemVyb0ZpbGwoZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpLCBwYWRkZWRbMV0sIHBhZGRlZFsyXSk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGlmIChvcmRpbmFsKSB7XG4gICAgICAgIGZvcm1hdFRva2VuRnVuY3Rpb25zW29yZGluYWxdID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLm9yZGluYWwoZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpLCB0b2tlbik7XG4gICAgICAgIH07XG4gICAgfVxufVxuXG5mdW5jdGlvbiByZW1vdmVGb3JtYXR0aW5nVG9rZW5zKGlucHV0KSB7XG4gICAgaWYgKGlucHV0Lm1hdGNoKC9cXFtbXFxzXFxTXS8pKSB7XG4gICAgICAgIHJldHVybiBpbnB1dC5yZXBsYWNlKC9eXFxbfFxcXSQvZywgJycpO1xuICAgIH1cbiAgICByZXR1cm4gaW5wdXQucmVwbGFjZSgvXFxcXC9nLCAnJyk7XG59XG5cbmZ1bmN0aW9uIG1ha2VGb3JtYXRGdW5jdGlvbihmb3JtYXQpIHtcbiAgICB2YXIgYXJyYXkgPSBmb3JtYXQubWF0Y2goZm9ybWF0dGluZ1Rva2VucyksIGksIGxlbmd0aDtcblxuICAgIGZvciAoaSA9IDAsIGxlbmd0aCA9IGFycmF5Lmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChmb3JtYXRUb2tlbkZ1bmN0aW9uc1thcnJheVtpXV0pIHtcbiAgICAgICAgICAgIGFycmF5W2ldID0gZm9ybWF0VG9rZW5GdW5jdGlvbnNbYXJyYXlbaV1dO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXJyYXlbaV0gPSByZW1vdmVGb3JtYXR0aW5nVG9rZW5zKGFycmF5W2ldKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiAobW9tKSB7XG4gICAgICAgIHZhciBvdXRwdXQgPSAnJywgaTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBvdXRwdXQgKz0gYXJyYXlbaV0gaW5zdGFuY2VvZiBGdW5jdGlvbiA/IGFycmF5W2ldLmNhbGwobW9tLCBmb3JtYXQpIDogYXJyYXlbaV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9O1xufVxuXG4vLyBmb3JtYXQgZGF0ZSB1c2luZyBuYXRpdmUgZGF0ZSBvYmplY3RcbmZ1bmN0aW9uIGZvcm1hdE1vbWVudChtLCBmb3JtYXQpIHtcbiAgICBpZiAoIW0uaXNWYWxpZCgpKSB7XG4gICAgICAgIHJldHVybiBtLmxvY2FsZURhdGEoKS5pbnZhbGlkRGF0ZSgpO1xuICAgIH1cblxuICAgIGZvcm1hdCA9IGV4cGFuZEZvcm1hdChmb3JtYXQsIG0ubG9jYWxlRGF0YSgpKTtcbiAgICBmb3JtYXRGdW5jdGlvbnNbZm9ybWF0XSA9IGZvcm1hdEZ1bmN0aW9uc1tmb3JtYXRdIHx8IG1ha2VGb3JtYXRGdW5jdGlvbihmb3JtYXQpO1xuXG4gICAgcmV0dXJuIGZvcm1hdEZ1bmN0aW9uc1tmb3JtYXRdKG0pO1xufVxuXG5mdW5jdGlvbiBleHBhbmRGb3JtYXQoZm9ybWF0LCBsb2NhbGUpIHtcbiAgICB2YXIgaSA9IDU7XG5cbiAgICBmdW5jdGlvbiByZXBsYWNlTG9uZ0RhdGVGb3JtYXRUb2tlbnMoaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIGxvY2FsZS5sb25nRGF0ZUZvcm1hdChpbnB1dCkgfHwgaW5wdXQ7XG4gICAgfVxuXG4gICAgbG9jYWxGb3JtYXR0aW5nVG9rZW5zLmxhc3RJbmRleCA9IDA7XG4gICAgd2hpbGUgKGkgPj0gMCAmJiBsb2NhbEZvcm1hdHRpbmdUb2tlbnMudGVzdChmb3JtYXQpKSB7XG4gICAgICAgIGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKGxvY2FsRm9ybWF0dGluZ1Rva2VucywgcmVwbGFjZUxvbmdEYXRlRm9ybWF0VG9rZW5zKTtcbiAgICAgICAgbG9jYWxGb3JtYXR0aW5nVG9rZW5zLmxhc3RJbmRleCA9IDA7XG4gICAgICAgIGkgLT0gMTtcbiAgICB9XG5cbiAgICByZXR1cm4gZm9ybWF0O1xufVxuXG52YXIgbWF0Y2gxICAgICAgICAgPSAvXFxkLzsgICAgICAgICAgICAvLyAgICAgICAwIC0gOVxudmFyIG1hdGNoMiAgICAgICAgID0gL1xcZFxcZC87ICAgICAgICAgIC8vICAgICAgMDAgLSA5OVxudmFyIG1hdGNoMyAgICAgICAgID0gL1xcZHszfS87ICAgICAgICAgLy8gICAgIDAwMCAtIDk5OVxudmFyIG1hdGNoNCAgICAgICAgID0gL1xcZHs0fS87ICAgICAgICAgLy8gICAgMDAwMCAtIDk5OTlcbnZhciBtYXRjaDYgICAgICAgICA9IC9bKy1dP1xcZHs2fS87ICAgIC8vIC05OTk5OTkgLSA5OTk5OTlcbnZhciBtYXRjaDF0bzIgICAgICA9IC9cXGRcXGQ/LzsgICAgICAgICAvLyAgICAgICAwIC0gOTlcbnZhciBtYXRjaDN0bzQgICAgICA9IC9cXGRcXGRcXGRcXGQ/LzsgICAgIC8vICAgICA5OTkgLSA5OTk5XG52YXIgbWF0Y2g1dG82ICAgICAgPSAvXFxkXFxkXFxkXFxkXFxkXFxkPy87IC8vICAgOTk5OTkgLSA5OTk5OTlcbnZhciBtYXRjaDF0bzMgICAgICA9IC9cXGR7MSwzfS87ICAgICAgIC8vICAgICAgIDAgLSA5OTlcbnZhciBtYXRjaDF0bzQgICAgICA9IC9cXGR7MSw0fS87ICAgICAgIC8vICAgICAgIDAgLSA5OTk5XG52YXIgbWF0Y2gxdG82ICAgICAgPSAvWystXT9cXGR7MSw2fS87ICAvLyAtOTk5OTk5IC0gOTk5OTk5XG5cbnZhciBtYXRjaFVuc2lnbmVkICA9IC9cXGQrLzsgICAgICAgICAgIC8vICAgICAgIDAgLSBpbmZcbnZhciBtYXRjaFNpZ25lZCAgICA9IC9bKy1dP1xcZCsvOyAgICAgIC8vICAgIC1pbmYgLSBpbmZcblxudmFyIG1hdGNoT2Zmc2V0ICAgID0gL1p8WystXVxcZFxcZDo/XFxkXFxkL2dpOyAvLyArMDA6MDAgLTAwOjAwICswMDAwIC0wMDAwIG9yIFpcbnZhciBtYXRjaFNob3J0T2Zmc2V0ID0gL1p8WystXVxcZFxcZCg/Ojo/XFxkXFxkKT8vZ2k7IC8vICswMCAtMDAgKzAwOjAwIC0wMDowMCArMDAwMCAtMDAwMCBvciBaXG5cbnZhciBtYXRjaFRpbWVzdGFtcCA9IC9bKy1dP1xcZCsoXFwuXFxkezEsM30pPy87IC8vIDEyMzQ1Njc4OSAxMjM0NTY3ODkuMTIzXG5cbi8vIGFueSB3b3JkIChvciB0d28pIGNoYXJhY3RlcnMgb3IgbnVtYmVycyBpbmNsdWRpbmcgdHdvL3RocmVlIHdvcmQgbW9udGggaW4gYXJhYmljLlxuLy8gaW5jbHVkZXMgc2NvdHRpc2ggZ2FlbGljIHR3byB3b3JkIGFuZCBoeXBoZW5hdGVkIG1vbnRoc1xudmFyIG1hdGNoV29yZCA9IC9bMC05XSpbJ2EtelxcdTAwQTAtXFx1MDVGRlxcdTA3MDAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0rfFtcXHUwNjAwLVxcdTA2RkZcXC9dKyhcXHMqP1tcXHUwNjAwLVxcdTA2RkZdKyl7MSwyfS9pO1xuXG5cbnZhciByZWdleGVzID0ge307XG5cbmZ1bmN0aW9uIGFkZFJlZ2V4VG9rZW4gKHRva2VuLCByZWdleCwgc3RyaWN0UmVnZXgpIHtcbiAgICByZWdleGVzW3Rva2VuXSA9IGlzRnVuY3Rpb24ocmVnZXgpID8gcmVnZXggOiBmdW5jdGlvbiAoaXNTdHJpY3QsIGxvY2FsZURhdGEpIHtcbiAgICAgICAgcmV0dXJuIChpc1N0cmljdCAmJiBzdHJpY3RSZWdleCkgPyBzdHJpY3RSZWdleCA6IHJlZ2V4O1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIGdldFBhcnNlUmVnZXhGb3JUb2tlbiAodG9rZW4sIGNvbmZpZykge1xuICAgIGlmICghaGFzT3duUHJvcChyZWdleGVzLCB0b2tlbikpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZWdFeHAodW5lc2NhcGVGb3JtYXQodG9rZW4pKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVnZXhlc1t0b2tlbl0oY29uZmlnLl9zdHJpY3QsIGNvbmZpZy5fbG9jYWxlKTtcbn1cblxuLy8gQ29kZSBmcm9tIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMzU2MTQ5My9pcy10aGVyZS1hLXJlZ2V4cC1lc2NhcGUtZnVuY3Rpb24taW4tamF2YXNjcmlwdFxuZnVuY3Rpb24gdW5lc2NhcGVGb3JtYXQocykge1xuICAgIHJldHVybiByZWdleEVzY2FwZShzLnJlcGxhY2UoJ1xcXFwnLCAnJykucmVwbGFjZSgvXFxcXChcXFspfFxcXFwoXFxdKXxcXFsoW15cXF1cXFtdKilcXF18XFxcXCguKS9nLCBmdW5jdGlvbiAobWF0Y2hlZCwgcDEsIHAyLCBwMywgcDQpIHtcbiAgICAgICAgcmV0dXJuIHAxIHx8IHAyIHx8IHAzIHx8IHA0O1xuICAgIH0pKTtcbn1cblxuZnVuY3Rpb24gcmVnZXhFc2NhcGUocykge1xuICAgIHJldHVybiBzLnJlcGxhY2UoL1stXFwvXFxcXF4kKis/LigpfFtcXF17fV0vZywgJ1xcXFwkJicpO1xufVxuXG52YXIgdG9rZW5zID0ge307XG5cbmZ1bmN0aW9uIGFkZFBhcnNlVG9rZW4gKHRva2VuLCBjYWxsYmFjaykge1xuICAgIHZhciBpLCBmdW5jID0gY2FsbGJhY2s7XG4gICAgaWYgKHR5cGVvZiB0b2tlbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgdG9rZW4gPSBbdG9rZW5dO1xuICAgIH1cbiAgICBpZiAoaXNOdW1iZXIoY2FsbGJhY2spKSB7XG4gICAgICAgIGZ1bmMgPSBmdW5jdGlvbiAoaW5wdXQsIGFycmF5KSB7XG4gICAgICAgICAgICBhcnJheVtjYWxsYmFja10gPSB0b0ludChpbnB1dCk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGZvciAoaSA9IDA7IGkgPCB0b2tlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICB0b2tlbnNbdG9rZW5baV1dID0gZnVuYztcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGFkZFdlZWtQYXJzZVRva2VuICh0b2tlbiwgY2FsbGJhY2spIHtcbiAgICBhZGRQYXJzZVRva2VuKHRva2VuLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5LCBjb25maWcsIHRva2VuKSB7XG4gICAgICAgIGNvbmZpZy5fdyA9IGNvbmZpZy5fdyB8fCB7fTtcbiAgICAgICAgY2FsbGJhY2soaW5wdXQsIGNvbmZpZy5fdywgY29uZmlnLCB0b2tlbik7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGFkZFRpbWVUb0FycmF5RnJvbVRva2VuKHRva2VuLCBpbnB1dCwgY29uZmlnKSB7XG4gICAgaWYgKGlucHV0ICE9IG51bGwgJiYgaGFzT3duUHJvcCh0b2tlbnMsIHRva2VuKSkge1xuICAgICAgICB0b2tlbnNbdG9rZW5dKGlucHV0LCBjb25maWcuX2EsIGNvbmZpZywgdG9rZW4pO1xuICAgIH1cbn1cblxudmFyIFlFQVIgPSAwO1xudmFyIE1PTlRIID0gMTtcbnZhciBEQVRFID0gMjtcbnZhciBIT1VSID0gMztcbnZhciBNSU5VVEUgPSA0O1xudmFyIFNFQ09ORCA9IDU7XG52YXIgTUlMTElTRUNPTkQgPSA2O1xudmFyIFdFRUsgPSA3O1xudmFyIFdFRUtEQVkgPSA4O1xuXG52YXIgaW5kZXhPZjtcblxuaWYgKEFycmF5LnByb3RvdHlwZS5pbmRleE9mKSB7XG4gICAgaW5kZXhPZiA9IEFycmF5LnByb3RvdHlwZS5pbmRleE9mO1xufSBlbHNlIHtcbiAgICBpbmRleE9mID0gZnVuY3Rpb24gKG8pIHtcbiAgICAgICAgLy8gSSBrbm93XG4gICAgICAgIHZhciBpO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgaWYgKHRoaXNbaV0gPT09IG8pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gLTE7XG4gICAgfTtcbn1cblxudmFyIGluZGV4T2YkMSA9IGluZGV4T2Y7XG5cbmZ1bmN0aW9uIGRheXNJbk1vbnRoKHllYXIsIG1vbnRoKSB7XG4gICAgcmV0dXJuIG5ldyBEYXRlKERhdGUuVVRDKHllYXIsIG1vbnRoICsgMSwgMCkpLmdldFVUQ0RhdGUoKTtcbn1cblxuLy8gRk9STUFUVElOR1xuXG5hZGRGb3JtYXRUb2tlbignTScsIFsnTU0nLCAyXSwgJ01vJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLm1vbnRoKCkgKyAxO1xufSk7XG5cbmFkZEZvcm1hdFRva2VuKCdNTU0nLCAwLCAwLCBmdW5jdGlvbiAoZm9ybWF0KSB7XG4gICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLm1vbnRoc1Nob3J0KHRoaXMsIGZvcm1hdCk7XG59KTtcblxuYWRkRm9ybWF0VG9rZW4oJ01NTU0nLCAwLCAwLCBmdW5jdGlvbiAoZm9ybWF0KSB7XG4gICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLm1vbnRocyh0aGlzLCBmb3JtYXQpO1xufSk7XG5cbi8vIEFMSUFTRVNcblxuYWRkVW5pdEFsaWFzKCdtb250aCcsICdNJyk7XG5cbi8vIFBSSU9SSVRZXG5cbmFkZFVuaXRQcmlvcml0eSgnbW9udGgnLCA4KTtcblxuLy8gUEFSU0lOR1xuXG5hZGRSZWdleFRva2VuKCdNJywgICAgbWF0Y2gxdG8yKTtcbmFkZFJlZ2V4VG9rZW4oJ01NJywgICBtYXRjaDF0bzIsIG1hdGNoMik7XG5hZGRSZWdleFRva2VuKCdNTU0nLCAgZnVuY3Rpb24gKGlzU3RyaWN0LCBsb2NhbGUpIHtcbiAgICByZXR1cm4gbG9jYWxlLm1vbnRoc1Nob3J0UmVnZXgoaXNTdHJpY3QpO1xufSk7XG5hZGRSZWdleFRva2VuKCdNTU1NJywgZnVuY3Rpb24gKGlzU3RyaWN0LCBsb2NhbGUpIHtcbiAgICByZXR1cm4gbG9jYWxlLm1vbnRoc1JlZ2V4KGlzU3RyaWN0KTtcbn0pO1xuXG5hZGRQYXJzZVRva2VuKFsnTScsICdNTSddLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5KSB7XG4gICAgYXJyYXlbTU9OVEhdID0gdG9JbnQoaW5wdXQpIC0gMTtcbn0pO1xuXG5hZGRQYXJzZVRva2VuKFsnTU1NJywgJ01NTU0nXSwgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnLCB0b2tlbikge1xuICAgIHZhciBtb250aCA9IGNvbmZpZy5fbG9jYWxlLm1vbnRoc1BhcnNlKGlucHV0LCB0b2tlbiwgY29uZmlnLl9zdHJpY3QpO1xuICAgIC8vIGlmIHdlIGRpZG4ndCBmaW5kIGEgbW9udGggbmFtZSwgbWFyayB0aGUgZGF0ZSBhcyBpbnZhbGlkLlxuICAgIGlmIChtb250aCAhPSBudWxsKSB7XG4gICAgICAgIGFycmF5W01PTlRIXSA9IG1vbnRoO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLmludmFsaWRNb250aCA9IGlucHV0O1xuICAgIH1cbn0pO1xuXG4vLyBMT0NBTEVTXG5cbnZhciBNT05USFNfSU5fRk9STUFUID0gL0Rbb0RdPyhcXFtbXlxcW1xcXV0qXFxdfFxccykrTU1NTT8vO1xudmFyIGRlZmF1bHRMb2NhbGVNb250aHMgPSAnSmFudWFyeV9GZWJydWFyeV9NYXJjaF9BcHJpbF9NYXlfSnVuZV9KdWx5X0F1Z3VzdF9TZXB0ZW1iZXJfT2N0b2Jlcl9Ob3ZlbWJlcl9EZWNlbWJlcicuc3BsaXQoJ18nKTtcbmZ1bmN0aW9uIGxvY2FsZU1vbnRocyAobSwgZm9ybWF0KSB7XG4gICAgaWYgKCFtKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9tb250aHM7XG4gICAgfVxuICAgIHJldHVybiBpc0FycmF5KHRoaXMuX21vbnRocykgPyB0aGlzLl9tb250aHNbbS5tb250aCgpXSA6XG4gICAgICAgIHRoaXMuX21vbnRoc1sodGhpcy5fbW9udGhzLmlzRm9ybWF0IHx8IE1PTlRIU19JTl9GT1JNQVQpLnRlc3QoZm9ybWF0KSA/ICdmb3JtYXQnIDogJ3N0YW5kYWxvbmUnXVttLm1vbnRoKCldO1xufVxuXG52YXIgZGVmYXVsdExvY2FsZU1vbnRoc1Nob3J0ID0gJ0phbl9GZWJfTWFyX0Fwcl9NYXlfSnVuX0p1bF9BdWdfU2VwX09jdF9Ob3ZfRGVjJy5zcGxpdCgnXycpO1xuZnVuY3Rpb24gbG9jYWxlTW9udGhzU2hvcnQgKG0sIGZvcm1hdCkge1xuICAgIGlmICghbSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbW9udGhzU2hvcnQ7XG4gICAgfVxuICAgIHJldHVybiBpc0FycmF5KHRoaXMuX21vbnRoc1Nob3J0KSA/IHRoaXMuX21vbnRoc1Nob3J0W20ubW9udGgoKV0gOlxuICAgICAgICB0aGlzLl9tb250aHNTaG9ydFtNT05USFNfSU5fRk9STUFULnRlc3QoZm9ybWF0KSA/ICdmb3JtYXQnIDogJ3N0YW5kYWxvbmUnXVttLm1vbnRoKCldO1xufVxuXG5mdW5jdGlvbiBoYW5kbGVTdHJpY3RQYXJzZShtb250aE5hbWUsIGZvcm1hdCwgc3RyaWN0KSB7XG4gICAgdmFyIGksIGlpLCBtb20sIGxsYyA9IG1vbnRoTmFtZS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xuICAgIGlmICghdGhpcy5fbW9udGhzUGFyc2UpIHtcbiAgICAgICAgLy8gdGhpcyBpcyBub3QgdXNlZFxuICAgICAgICB0aGlzLl9tb250aHNQYXJzZSA9IFtdO1xuICAgICAgICB0aGlzLl9sb25nTW9udGhzUGFyc2UgPSBbXTtcbiAgICAgICAgdGhpcy5fc2hvcnRNb250aHNQYXJzZSA9IFtdO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgMTI7ICsraSkge1xuICAgICAgICAgICAgbW9tID0gY3JlYXRlVVRDKFsyMDAwLCBpXSk7XG4gICAgICAgICAgICB0aGlzLl9zaG9ydE1vbnRoc1BhcnNlW2ldID0gdGhpcy5tb250aHNTaG9ydChtb20sICcnKS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgdGhpcy5fbG9uZ01vbnRoc1BhcnNlW2ldID0gdGhpcy5tb250aHMobW9tLCAnJykudG9Mb2NhbGVMb3dlckNhc2UoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzdHJpY3QpIHtcbiAgICAgICAgaWYgKGZvcm1hdCA9PT0gJ01NTScpIHtcbiAgICAgICAgICAgIGlpID0gaW5kZXhPZiQxLmNhbGwodGhpcy5fc2hvcnRNb250aHNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgIHJldHVybiBpaSAhPT0gLTEgPyBpaSA6IG51bGw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpaSA9IGluZGV4T2YkMS5jYWxsKHRoaXMuX2xvbmdNb250aHNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgIHJldHVybiBpaSAhPT0gLTEgPyBpaSA6IG51bGw7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoZm9ybWF0ID09PSAnTU1NJykge1xuICAgICAgICAgICAgaWkgPSBpbmRleE9mJDEuY2FsbCh0aGlzLl9zaG9ydE1vbnRoc1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgaWYgKGlpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlpID0gaW5kZXhPZiQxLmNhbGwodGhpcy5fbG9uZ01vbnRoc1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgcmV0dXJuIGlpICE9PSAtMSA/IGlpIDogbnVsbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlpID0gaW5kZXhPZiQxLmNhbGwodGhpcy5fbG9uZ01vbnRoc1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgaWYgKGlpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlpID0gaW5kZXhPZiQxLmNhbGwodGhpcy5fc2hvcnRNb250aHNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgIHJldHVybiBpaSAhPT0gLTEgPyBpaSA6IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGxvY2FsZU1vbnRoc1BhcnNlIChtb250aE5hbWUsIGZvcm1hdCwgc3RyaWN0KSB7XG4gICAgdmFyIGksIG1vbSwgcmVnZXg7XG5cbiAgICBpZiAodGhpcy5fbW9udGhzUGFyc2VFeGFjdCkge1xuICAgICAgICByZXR1cm4gaGFuZGxlU3RyaWN0UGFyc2UuY2FsbCh0aGlzLCBtb250aE5hbWUsIGZvcm1hdCwgc3RyaWN0KTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuX21vbnRoc1BhcnNlKSB7XG4gICAgICAgIHRoaXMuX21vbnRoc1BhcnNlID0gW107XG4gICAgICAgIHRoaXMuX2xvbmdNb250aHNQYXJzZSA9IFtdO1xuICAgICAgICB0aGlzLl9zaG9ydE1vbnRoc1BhcnNlID0gW107XG4gICAgfVxuXG4gICAgLy8gVE9ETzogYWRkIHNvcnRpbmdcbiAgICAvLyBTb3J0aW5nIG1ha2VzIHN1cmUgaWYgb25lIG1vbnRoIChvciBhYmJyKSBpcyBhIHByZWZpeCBvZiBhbm90aGVyXG4gICAgLy8gc2VlIHNvcnRpbmcgaW4gY29tcHV0ZU1vbnRoc1BhcnNlXG4gICAgZm9yIChpID0gMDsgaSA8IDEyOyBpKyspIHtcbiAgICAgICAgLy8gbWFrZSB0aGUgcmVnZXggaWYgd2UgZG9uJ3QgaGF2ZSBpdCBhbHJlYWR5XG4gICAgICAgIG1vbSA9IGNyZWF0ZVVUQyhbMjAwMCwgaV0pO1xuICAgICAgICBpZiAoc3RyaWN0ICYmICF0aGlzLl9sb25nTW9udGhzUGFyc2VbaV0pIHtcbiAgICAgICAgICAgIHRoaXMuX2xvbmdNb250aHNQYXJzZVtpXSA9IG5ldyBSZWdFeHAoJ14nICsgdGhpcy5tb250aHMobW9tLCAnJykucmVwbGFjZSgnLicsICcnKSArICckJywgJ2knKTtcbiAgICAgICAgICAgIHRoaXMuX3Nob3J0TW9udGhzUGFyc2VbaV0gPSBuZXcgUmVnRXhwKCdeJyArIHRoaXMubW9udGhzU2hvcnQobW9tLCAnJykucmVwbGFjZSgnLicsICcnKSArICckJywgJ2knKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXN0cmljdCAmJiAhdGhpcy5fbW9udGhzUGFyc2VbaV0pIHtcbiAgICAgICAgICAgIHJlZ2V4ID0gJ14nICsgdGhpcy5tb250aHMobW9tLCAnJykgKyAnfF4nICsgdGhpcy5tb250aHNTaG9ydChtb20sICcnKTtcbiAgICAgICAgICAgIHRoaXMuX21vbnRoc1BhcnNlW2ldID0gbmV3IFJlZ0V4cChyZWdleC5yZXBsYWNlKCcuJywgJycpLCAnaScpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHRlc3QgdGhlIHJlZ2V4XG4gICAgICAgIGlmIChzdHJpY3QgJiYgZm9ybWF0ID09PSAnTU1NTScgJiYgdGhpcy5fbG9uZ01vbnRoc1BhcnNlW2ldLnRlc3QobW9udGhOYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgIH0gZWxzZSBpZiAoc3RyaWN0ICYmIGZvcm1hdCA9PT0gJ01NTScgJiYgdGhpcy5fc2hvcnRNb250aHNQYXJzZVtpXS50ZXN0KG1vbnRoTmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICB9IGVsc2UgaWYgKCFzdHJpY3QgJiYgdGhpcy5fbW9udGhzUGFyc2VbaV0udGVzdChtb250aE5hbWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gTU9NRU5UU1xuXG5mdW5jdGlvbiBzZXRNb250aCAobW9tLCB2YWx1ZSkge1xuICAgIHZhciBkYXlPZk1vbnRoO1xuXG4gICAgaWYgKCFtb20uaXNWYWxpZCgpKSB7XG4gICAgICAgIC8vIE5vIG9wXG4gICAgICAgIHJldHVybiBtb207XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgaWYgKC9eXFxkKyQvLnRlc3QodmFsdWUpKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHRvSW50KHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhbHVlID0gbW9tLmxvY2FsZURhdGEoKS5tb250aHNQYXJzZSh2YWx1ZSk7XG4gICAgICAgICAgICAvLyBUT0RPOiBBbm90aGVyIHNpbGVudCBmYWlsdXJlP1xuICAgICAgICAgICAgaWYgKCFpc051bWJlcih2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbW9tO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZGF5T2ZNb250aCA9IE1hdGgubWluKG1vbS5kYXRlKCksIGRheXNJbk1vbnRoKG1vbS55ZWFyKCksIHZhbHVlKSk7XG4gICAgbW9tLl9kWydzZXQnICsgKG1vbS5faXNVVEMgPyAnVVRDJyA6ICcnKSArICdNb250aCddKHZhbHVlLCBkYXlPZk1vbnRoKTtcbiAgICByZXR1cm4gbW9tO1xufVxuXG5mdW5jdGlvbiBnZXRTZXRNb250aCAodmFsdWUpIHtcbiAgICBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgICBzZXRNb250aCh0aGlzLCB2YWx1ZSk7XG4gICAgICAgIGhvb2tzLnVwZGF0ZU9mZnNldCh0aGlzLCB0cnVlKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGdldCh0aGlzLCAnTW9udGgnKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldERheXNJbk1vbnRoICgpIHtcbiAgICByZXR1cm4gZGF5c0luTW9udGgodGhpcy55ZWFyKCksIHRoaXMubW9udGgoKSk7XG59XG5cbnZhciBkZWZhdWx0TW9udGhzU2hvcnRSZWdleCA9IG1hdGNoV29yZDtcbmZ1bmN0aW9uIG1vbnRoc1Nob3J0UmVnZXggKGlzU3RyaWN0KSB7XG4gICAgaWYgKHRoaXMuX21vbnRoc1BhcnNlRXhhY3QpIHtcbiAgICAgICAgaWYgKCFoYXNPd25Qcm9wKHRoaXMsICdfbW9udGhzUmVnZXgnKSkge1xuICAgICAgICAgICAgY29tcHV0ZU1vbnRoc1BhcnNlLmNhbGwodGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzU3RyaWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbW9udGhzU2hvcnRTdHJpY3RSZWdleDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9tb250aHNTaG9ydFJlZ2V4O1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCFoYXNPd25Qcm9wKHRoaXMsICdfbW9udGhzU2hvcnRSZWdleCcpKSB7XG4gICAgICAgICAgICB0aGlzLl9tb250aHNTaG9ydFJlZ2V4ID0gZGVmYXVsdE1vbnRoc1Nob3J0UmVnZXg7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX21vbnRoc1Nob3J0U3RyaWN0UmVnZXggJiYgaXNTdHJpY3QgP1xuICAgICAgICAgICAgdGhpcy5fbW9udGhzU2hvcnRTdHJpY3RSZWdleCA6IHRoaXMuX21vbnRoc1Nob3J0UmVnZXg7XG4gICAgfVxufVxuXG52YXIgZGVmYXVsdE1vbnRoc1JlZ2V4ID0gbWF0Y2hXb3JkO1xuZnVuY3Rpb24gbW9udGhzUmVnZXggKGlzU3RyaWN0KSB7XG4gICAgaWYgKHRoaXMuX21vbnRoc1BhcnNlRXhhY3QpIHtcbiAgICAgICAgaWYgKCFoYXNPd25Qcm9wKHRoaXMsICdfbW9udGhzUmVnZXgnKSkge1xuICAgICAgICAgICAgY29tcHV0ZU1vbnRoc1BhcnNlLmNhbGwodGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzU3RyaWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbW9udGhzU3RyaWN0UmVnZXg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbW9udGhzUmVnZXg7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoIWhhc093blByb3AodGhpcywgJ19tb250aHNSZWdleCcpKSB7XG4gICAgICAgICAgICB0aGlzLl9tb250aHNSZWdleCA9IGRlZmF1bHRNb250aHNSZWdleDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fbW9udGhzU3RyaWN0UmVnZXggJiYgaXNTdHJpY3QgP1xuICAgICAgICAgICAgdGhpcy5fbW9udGhzU3RyaWN0UmVnZXggOiB0aGlzLl9tb250aHNSZWdleDtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVNb250aHNQYXJzZSAoKSB7XG4gICAgZnVuY3Rpb24gY21wTGVuUmV2KGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIGIubGVuZ3RoIC0gYS5sZW5ndGg7XG4gICAgfVxuXG4gICAgdmFyIHNob3J0UGllY2VzID0gW10sIGxvbmdQaWVjZXMgPSBbXSwgbWl4ZWRQaWVjZXMgPSBbXSxcbiAgICAgICAgaSwgbW9tO1xuICAgIGZvciAoaSA9IDA7IGkgPCAxMjsgaSsrKSB7XG4gICAgICAgIC8vIG1ha2UgdGhlIHJlZ2V4IGlmIHdlIGRvbid0IGhhdmUgaXQgYWxyZWFkeVxuICAgICAgICBtb20gPSBjcmVhdGVVVEMoWzIwMDAsIGldKTtcbiAgICAgICAgc2hvcnRQaWVjZXMucHVzaCh0aGlzLm1vbnRoc1Nob3J0KG1vbSwgJycpKTtcbiAgICAgICAgbG9uZ1BpZWNlcy5wdXNoKHRoaXMubW9udGhzKG1vbSwgJycpKTtcbiAgICAgICAgbWl4ZWRQaWVjZXMucHVzaCh0aGlzLm1vbnRocyhtb20sICcnKSk7XG4gICAgICAgIG1peGVkUGllY2VzLnB1c2godGhpcy5tb250aHNTaG9ydChtb20sICcnKSk7XG4gICAgfVxuICAgIC8vIFNvcnRpbmcgbWFrZXMgc3VyZSBpZiBvbmUgbW9udGggKG9yIGFiYnIpIGlzIGEgcHJlZml4IG9mIGFub3RoZXIgaXRcbiAgICAvLyB3aWxsIG1hdGNoIHRoZSBsb25nZXIgcGllY2UuXG4gICAgc2hvcnRQaWVjZXMuc29ydChjbXBMZW5SZXYpO1xuICAgIGxvbmdQaWVjZXMuc29ydChjbXBMZW5SZXYpO1xuICAgIG1peGVkUGllY2VzLnNvcnQoY21wTGVuUmV2KTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgMTI7IGkrKykge1xuICAgICAgICBzaG9ydFBpZWNlc1tpXSA9IHJlZ2V4RXNjYXBlKHNob3J0UGllY2VzW2ldKTtcbiAgICAgICAgbG9uZ1BpZWNlc1tpXSA9IHJlZ2V4RXNjYXBlKGxvbmdQaWVjZXNbaV0pO1xuICAgIH1cbiAgICBmb3IgKGkgPSAwOyBpIDwgMjQ7IGkrKykge1xuICAgICAgICBtaXhlZFBpZWNlc1tpXSA9IHJlZ2V4RXNjYXBlKG1peGVkUGllY2VzW2ldKTtcbiAgICB9XG5cbiAgICB0aGlzLl9tb250aHNSZWdleCA9IG5ldyBSZWdFeHAoJ14oJyArIG1peGVkUGllY2VzLmpvaW4oJ3wnKSArICcpJywgJ2knKTtcbiAgICB0aGlzLl9tb250aHNTaG9ydFJlZ2V4ID0gdGhpcy5fbW9udGhzUmVnZXg7XG4gICAgdGhpcy5fbW9udGhzU3RyaWN0UmVnZXggPSBuZXcgUmVnRXhwKCdeKCcgKyBsb25nUGllY2VzLmpvaW4oJ3wnKSArICcpJywgJ2knKTtcbiAgICB0aGlzLl9tb250aHNTaG9ydFN0cmljdFJlZ2V4ID0gbmV3IFJlZ0V4cCgnXignICsgc2hvcnRQaWVjZXMuam9pbignfCcpICsgJyknLCAnaScpO1xufVxuXG4vLyBGT1JNQVRUSU5HXG5cbmFkZEZvcm1hdFRva2VuKCdZJywgMCwgMCwgZnVuY3Rpb24gKCkge1xuICAgIHZhciB5ID0gdGhpcy55ZWFyKCk7XG4gICAgcmV0dXJuIHkgPD0gOTk5OSA/ICcnICsgeSA6ICcrJyArIHk7XG59KTtcblxuYWRkRm9ybWF0VG9rZW4oMCwgWydZWScsIDJdLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMueWVhcigpICUgMTAwO1xufSk7XG5cbmFkZEZvcm1hdFRva2VuKDAsIFsnWVlZWScsICAgNF0sICAgICAgIDAsICd5ZWFyJyk7XG5hZGRGb3JtYXRUb2tlbigwLCBbJ1lZWVlZJywgIDVdLCAgICAgICAwLCAneWVhcicpO1xuYWRkRm9ybWF0VG9rZW4oMCwgWydZWVlZWVknLCA2LCB0cnVlXSwgMCwgJ3llYXInKTtcblxuLy8gQUxJQVNFU1xuXG5hZGRVbml0QWxpYXMoJ3llYXInLCAneScpO1xuXG4vLyBQUklPUklUSUVTXG5cbmFkZFVuaXRQcmlvcml0eSgneWVhcicsIDEpO1xuXG4vLyBQQVJTSU5HXG5cbmFkZFJlZ2V4VG9rZW4oJ1knLCAgICAgIG1hdGNoU2lnbmVkKTtcbmFkZFJlZ2V4VG9rZW4oJ1lZJywgICAgIG1hdGNoMXRvMiwgbWF0Y2gyKTtcbmFkZFJlZ2V4VG9rZW4oJ1lZWVknLCAgIG1hdGNoMXRvNCwgbWF0Y2g0KTtcbmFkZFJlZ2V4VG9rZW4oJ1lZWVlZJywgIG1hdGNoMXRvNiwgbWF0Y2g2KTtcbmFkZFJlZ2V4VG9rZW4oJ1lZWVlZWScsIG1hdGNoMXRvNiwgbWF0Y2g2KTtcblxuYWRkUGFyc2VUb2tlbihbJ1lZWVlZJywgJ1lZWVlZWSddLCBZRUFSKTtcbmFkZFBhcnNlVG9rZW4oJ1lZWVknLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5KSB7XG4gICAgYXJyYXlbWUVBUl0gPSBpbnB1dC5sZW5ndGggPT09IDIgPyBob29rcy5wYXJzZVR3b0RpZ2l0WWVhcihpbnB1dCkgOiB0b0ludChpbnB1dCk7XG59KTtcbmFkZFBhcnNlVG9rZW4oJ1lZJywgZnVuY3Rpb24gKGlucHV0LCBhcnJheSkge1xuICAgIGFycmF5W1lFQVJdID0gaG9va3MucGFyc2VUd29EaWdpdFllYXIoaW5wdXQpO1xufSk7XG5hZGRQYXJzZVRva2VuKCdZJywgZnVuY3Rpb24gKGlucHV0LCBhcnJheSkge1xuICAgIGFycmF5W1lFQVJdID0gcGFyc2VJbnQoaW5wdXQsIDEwKTtcbn0pO1xuXG4vLyBIRUxQRVJTXG5cbmZ1bmN0aW9uIGRheXNJblllYXIoeWVhcikge1xuICAgIHJldHVybiBpc0xlYXBZZWFyKHllYXIpID8gMzY2IDogMzY1O1xufVxuXG5mdW5jdGlvbiBpc0xlYXBZZWFyKHllYXIpIHtcbiAgICByZXR1cm4gKHllYXIgJSA0ID09PSAwICYmIHllYXIgJSAxMDAgIT09IDApIHx8IHllYXIgJSA0MDAgPT09IDA7XG59XG5cbi8vIEhPT0tTXG5cbmhvb2tzLnBhcnNlVHdvRGlnaXRZZWFyID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgcmV0dXJuIHRvSW50KGlucHV0KSArICh0b0ludChpbnB1dCkgPiA2OCA/IDE5MDAgOiAyMDAwKTtcbn07XG5cbi8vIE1PTUVOVFNcblxudmFyIGdldFNldFllYXIgPSBtYWtlR2V0U2V0KCdGdWxsWWVhcicsIHRydWUpO1xuXG5mdW5jdGlvbiBnZXRJc0xlYXBZZWFyICgpIHtcbiAgICByZXR1cm4gaXNMZWFwWWVhcih0aGlzLnllYXIoKSk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZURhdGUgKHksIG0sIGQsIGgsIE0sIHMsIG1zKSB7XG4gICAgLy9jYW4ndCBqdXN0IGFwcGx5KCkgdG8gY3JlYXRlIGEgZGF0ZTpcbiAgICAvL2h0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTgxMzQ4L2luc3RhbnRpYXRpbmctYS1qYXZhc2NyaXB0LW9iamVjdC1ieS1jYWxsaW5nLXByb3RvdHlwZS1jb25zdHJ1Y3Rvci1hcHBseVxuICAgIHZhciBkYXRlID0gbmV3IERhdGUoeSwgbSwgZCwgaCwgTSwgcywgbXMpO1xuXG4gICAgLy90aGUgZGF0ZSBjb25zdHJ1Y3RvciByZW1hcHMgeWVhcnMgMC05OSB0byAxOTAwLTE5OTlcbiAgICBpZiAoeSA8IDEwMCAmJiB5ID49IDAgJiYgaXNGaW5pdGUoZGF0ZS5nZXRGdWxsWWVhcigpKSkge1xuICAgICAgICBkYXRlLnNldEZ1bGxZZWFyKHkpO1xuICAgIH1cbiAgICByZXR1cm4gZGF0ZTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlVVRDRGF0ZSAoeSkge1xuICAgIHZhciBkYXRlID0gbmV3IERhdGUoRGF0ZS5VVEMuYXBwbHkobnVsbCwgYXJndW1lbnRzKSk7XG5cbiAgICAvL3RoZSBEYXRlLlVUQyBmdW5jdGlvbiByZW1hcHMgeWVhcnMgMC05OSB0byAxOTAwLTE5OTlcbiAgICBpZiAoeSA8IDEwMCAmJiB5ID49IDAgJiYgaXNGaW5pdGUoZGF0ZS5nZXRVVENGdWxsWWVhcigpKSkge1xuICAgICAgICBkYXRlLnNldFVUQ0Z1bGxZZWFyKHkpO1xuICAgIH1cbiAgICByZXR1cm4gZGF0ZTtcbn1cblxuLy8gc3RhcnQtb2YtZmlyc3Qtd2VlayAtIHN0YXJ0LW9mLXllYXJcbmZ1bmN0aW9uIGZpcnN0V2Vla09mZnNldCh5ZWFyLCBkb3csIGRveSkge1xuICAgIHZhciAvLyBmaXJzdC13ZWVrIGRheSAtLSB3aGljaCBqYW51YXJ5IGlzIGFsd2F5cyBpbiB0aGUgZmlyc3Qgd2VlayAoNCBmb3IgaXNvLCAxIGZvciBvdGhlcilcbiAgICAgICAgZndkID0gNyArIGRvdyAtIGRveSxcbiAgICAgICAgLy8gZmlyc3Qtd2VlayBkYXkgbG9jYWwgd2Vla2RheSAtLSB3aGljaCBsb2NhbCB3ZWVrZGF5IGlzIGZ3ZFxuICAgICAgICBmd2RsdyA9ICg3ICsgY3JlYXRlVVRDRGF0ZSh5ZWFyLCAwLCBmd2QpLmdldFVUQ0RheSgpIC0gZG93KSAlIDc7XG5cbiAgICByZXR1cm4gLWZ3ZGx3ICsgZndkIC0gMTtcbn1cblxuLy9odHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0lTT193ZWVrX2RhdGUjQ2FsY3VsYXRpbmdfYV9kYXRlX2dpdmVuX3RoZV95ZWFyLjJDX3dlZWtfbnVtYmVyX2FuZF93ZWVrZGF5XG5mdW5jdGlvbiBkYXlPZlllYXJGcm9tV2Vla3MoeWVhciwgd2Vlaywgd2Vla2RheSwgZG93LCBkb3kpIHtcbiAgICB2YXIgbG9jYWxXZWVrZGF5ID0gKDcgKyB3ZWVrZGF5IC0gZG93KSAlIDcsXG4gICAgICAgIHdlZWtPZmZzZXQgPSBmaXJzdFdlZWtPZmZzZXQoeWVhciwgZG93LCBkb3kpLFxuICAgICAgICBkYXlPZlllYXIgPSAxICsgNyAqICh3ZWVrIC0gMSkgKyBsb2NhbFdlZWtkYXkgKyB3ZWVrT2Zmc2V0LFxuICAgICAgICByZXNZZWFyLCByZXNEYXlPZlllYXI7XG5cbiAgICBpZiAoZGF5T2ZZZWFyIDw9IDApIHtcbiAgICAgICAgcmVzWWVhciA9IHllYXIgLSAxO1xuICAgICAgICByZXNEYXlPZlllYXIgPSBkYXlzSW5ZZWFyKHJlc1llYXIpICsgZGF5T2ZZZWFyO1xuICAgIH0gZWxzZSBpZiAoZGF5T2ZZZWFyID4gZGF5c0luWWVhcih5ZWFyKSkge1xuICAgICAgICByZXNZZWFyID0geWVhciArIDE7XG4gICAgICAgIHJlc0RheU9mWWVhciA9IGRheU9mWWVhciAtIGRheXNJblllYXIoeWVhcik7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmVzWWVhciA9IHllYXI7XG4gICAgICAgIHJlc0RheU9mWWVhciA9IGRheU9mWWVhcjtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICB5ZWFyOiByZXNZZWFyLFxuICAgICAgICBkYXlPZlllYXI6IHJlc0RheU9mWWVhclxuICAgIH07XG59XG5cbmZ1bmN0aW9uIHdlZWtPZlllYXIobW9tLCBkb3csIGRveSkge1xuICAgIHZhciB3ZWVrT2Zmc2V0ID0gZmlyc3RXZWVrT2Zmc2V0KG1vbS55ZWFyKCksIGRvdywgZG95KSxcbiAgICAgICAgd2VlayA9IE1hdGguZmxvb3IoKG1vbS5kYXlPZlllYXIoKSAtIHdlZWtPZmZzZXQgLSAxKSAvIDcpICsgMSxcbiAgICAgICAgcmVzV2VlaywgcmVzWWVhcjtcblxuICAgIGlmICh3ZWVrIDwgMSkge1xuICAgICAgICByZXNZZWFyID0gbW9tLnllYXIoKSAtIDE7XG4gICAgICAgIHJlc1dlZWsgPSB3ZWVrICsgd2Vla3NJblllYXIocmVzWWVhciwgZG93LCBkb3kpO1xuICAgIH0gZWxzZSBpZiAod2VlayA+IHdlZWtzSW5ZZWFyKG1vbS55ZWFyKCksIGRvdywgZG95KSkge1xuICAgICAgICByZXNXZWVrID0gd2VlayAtIHdlZWtzSW5ZZWFyKG1vbS55ZWFyKCksIGRvdywgZG95KTtcbiAgICAgICAgcmVzWWVhciA9IG1vbS55ZWFyKCkgKyAxO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc1llYXIgPSBtb20ueWVhcigpO1xuICAgICAgICByZXNXZWVrID0gd2VlaztcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICB3ZWVrOiByZXNXZWVrLFxuICAgICAgICB5ZWFyOiByZXNZZWFyXG4gICAgfTtcbn1cblxuZnVuY3Rpb24gd2Vla3NJblllYXIoeWVhciwgZG93LCBkb3kpIHtcbiAgICB2YXIgd2Vla09mZnNldCA9IGZpcnN0V2Vla09mZnNldCh5ZWFyLCBkb3csIGRveSksXG4gICAgICAgIHdlZWtPZmZzZXROZXh0ID0gZmlyc3RXZWVrT2Zmc2V0KHllYXIgKyAxLCBkb3csIGRveSk7XG4gICAgcmV0dXJuIChkYXlzSW5ZZWFyKHllYXIpIC0gd2Vla09mZnNldCArIHdlZWtPZmZzZXROZXh0KSAvIDc7XG59XG5cbi8vIEZPUk1BVFRJTkdcblxuYWRkRm9ybWF0VG9rZW4oJ3cnLCBbJ3d3JywgMl0sICd3bycsICd3ZWVrJyk7XG5hZGRGb3JtYXRUb2tlbignVycsIFsnV1cnLCAyXSwgJ1dvJywgJ2lzb1dlZWsnKTtcblxuLy8gQUxJQVNFU1xuXG5hZGRVbml0QWxpYXMoJ3dlZWsnLCAndycpO1xuYWRkVW5pdEFsaWFzKCdpc29XZWVrJywgJ1cnKTtcblxuLy8gUFJJT1JJVElFU1xuXG5hZGRVbml0UHJpb3JpdHkoJ3dlZWsnLCA1KTtcbmFkZFVuaXRQcmlvcml0eSgnaXNvV2VlaycsIDUpO1xuXG4vLyBQQVJTSU5HXG5cbmFkZFJlZ2V4VG9rZW4oJ3cnLCAgbWF0Y2gxdG8yKTtcbmFkZFJlZ2V4VG9rZW4oJ3d3JywgbWF0Y2gxdG8yLCBtYXRjaDIpO1xuYWRkUmVnZXhUb2tlbignVycsICBtYXRjaDF0bzIpO1xuYWRkUmVnZXhUb2tlbignV1cnLCBtYXRjaDF0bzIsIG1hdGNoMik7XG5cbmFkZFdlZWtQYXJzZVRva2VuKFsndycsICd3dycsICdXJywgJ1dXJ10sIGZ1bmN0aW9uIChpbnB1dCwgd2VlaywgY29uZmlnLCB0b2tlbikge1xuICAgIHdlZWtbdG9rZW4uc3Vic3RyKDAsIDEpXSA9IHRvSW50KGlucHV0KTtcbn0pO1xuXG4vLyBIRUxQRVJTXG5cbi8vIExPQ0FMRVNcblxuZnVuY3Rpb24gbG9jYWxlV2VlayAobW9tKSB7XG4gICAgcmV0dXJuIHdlZWtPZlllYXIobW9tLCB0aGlzLl93ZWVrLmRvdywgdGhpcy5fd2Vlay5kb3kpLndlZWs7XG59XG5cbnZhciBkZWZhdWx0TG9jYWxlV2VlayA9IHtcbiAgICBkb3cgOiAwLCAvLyBTdW5kYXkgaXMgdGhlIGZpcnN0IGRheSBvZiB0aGUgd2Vlay5cbiAgICBkb3kgOiA2ICAvLyBUaGUgd2VlayB0aGF0IGNvbnRhaW5zIEphbiAxc3QgaXMgdGhlIGZpcnN0IHdlZWsgb2YgdGhlIHllYXIuXG59O1xuXG5mdW5jdGlvbiBsb2NhbGVGaXJzdERheU9mV2VlayAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3dlZWsuZG93O1xufVxuXG5mdW5jdGlvbiBsb2NhbGVGaXJzdERheU9mWWVhciAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3dlZWsuZG95O1xufVxuXG4vLyBNT01FTlRTXG5cbmZ1bmN0aW9uIGdldFNldFdlZWsgKGlucHV0KSB7XG4gICAgdmFyIHdlZWsgPSB0aGlzLmxvY2FsZURhdGEoKS53ZWVrKHRoaXMpO1xuICAgIHJldHVybiBpbnB1dCA9PSBudWxsID8gd2VlayA6IHRoaXMuYWRkKChpbnB1dCAtIHdlZWspICogNywgJ2QnKTtcbn1cblxuZnVuY3Rpb24gZ2V0U2V0SVNPV2VlayAoaW5wdXQpIHtcbiAgICB2YXIgd2VlayA9IHdlZWtPZlllYXIodGhpcywgMSwgNCkud2VlaztcbiAgICByZXR1cm4gaW5wdXQgPT0gbnVsbCA/IHdlZWsgOiB0aGlzLmFkZCgoaW5wdXQgLSB3ZWVrKSAqIDcsICdkJyk7XG59XG5cbi8vIEZPUk1BVFRJTkdcblxuYWRkRm9ybWF0VG9rZW4oJ2QnLCAwLCAnZG8nLCAnZGF5Jyk7XG5cbmFkZEZvcm1hdFRva2VuKCdkZCcsIDAsIDAsIGZ1bmN0aW9uIChmb3JtYXQpIHtcbiAgICByZXR1cm4gdGhpcy5sb2NhbGVEYXRhKCkud2Vla2RheXNNaW4odGhpcywgZm9ybWF0KTtcbn0pO1xuXG5hZGRGb3JtYXRUb2tlbignZGRkJywgMCwgMCwgZnVuY3Rpb24gKGZvcm1hdCkge1xuICAgIHJldHVybiB0aGlzLmxvY2FsZURhdGEoKS53ZWVrZGF5c1Nob3J0KHRoaXMsIGZvcm1hdCk7XG59KTtcblxuYWRkRm9ybWF0VG9rZW4oJ2RkZGQnLCAwLCAwLCBmdW5jdGlvbiAoZm9ybWF0KSB7XG4gICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLndlZWtkYXlzKHRoaXMsIGZvcm1hdCk7XG59KTtcblxuYWRkRm9ybWF0VG9rZW4oJ2UnLCAwLCAwLCAnd2Vla2RheScpO1xuYWRkRm9ybWF0VG9rZW4oJ0UnLCAwLCAwLCAnaXNvV2Vla2RheScpO1xuXG4vLyBBTElBU0VTXG5cbmFkZFVuaXRBbGlhcygnZGF5JywgJ2QnKTtcbmFkZFVuaXRBbGlhcygnd2Vla2RheScsICdlJyk7XG5hZGRVbml0QWxpYXMoJ2lzb1dlZWtkYXknLCAnRScpO1xuXG4vLyBQUklPUklUWVxuYWRkVW5pdFByaW9yaXR5KCdkYXknLCAxMSk7XG5hZGRVbml0UHJpb3JpdHkoJ3dlZWtkYXknLCAxMSk7XG5hZGRVbml0UHJpb3JpdHkoJ2lzb1dlZWtkYXknLCAxMSk7XG5cbi8vIFBBUlNJTkdcblxuYWRkUmVnZXhUb2tlbignZCcsICAgIG1hdGNoMXRvMik7XG5hZGRSZWdleFRva2VuKCdlJywgICAgbWF0Y2gxdG8yKTtcbmFkZFJlZ2V4VG9rZW4oJ0UnLCAgICBtYXRjaDF0bzIpO1xuYWRkUmVnZXhUb2tlbignZGQnLCAgIGZ1bmN0aW9uIChpc1N0cmljdCwgbG9jYWxlKSB7XG4gICAgcmV0dXJuIGxvY2FsZS53ZWVrZGF5c01pblJlZ2V4KGlzU3RyaWN0KTtcbn0pO1xuYWRkUmVnZXhUb2tlbignZGRkJywgICBmdW5jdGlvbiAoaXNTdHJpY3QsIGxvY2FsZSkge1xuICAgIHJldHVybiBsb2NhbGUud2Vla2RheXNTaG9ydFJlZ2V4KGlzU3RyaWN0KTtcbn0pO1xuYWRkUmVnZXhUb2tlbignZGRkZCcsICAgZnVuY3Rpb24gKGlzU3RyaWN0LCBsb2NhbGUpIHtcbiAgICByZXR1cm4gbG9jYWxlLndlZWtkYXlzUmVnZXgoaXNTdHJpY3QpO1xufSk7XG5cbmFkZFdlZWtQYXJzZVRva2VuKFsnZGQnLCAnZGRkJywgJ2RkZGQnXSwgZnVuY3Rpb24gKGlucHV0LCB3ZWVrLCBjb25maWcsIHRva2VuKSB7XG4gICAgdmFyIHdlZWtkYXkgPSBjb25maWcuX2xvY2FsZS53ZWVrZGF5c1BhcnNlKGlucHV0LCB0b2tlbiwgY29uZmlnLl9zdHJpY3QpO1xuICAgIC8vIGlmIHdlIGRpZG4ndCBnZXQgYSB3ZWVrZGF5IG5hbWUsIG1hcmsgdGhlIGRhdGUgYXMgaW52YWxpZFxuICAgIGlmICh3ZWVrZGF5ICE9IG51bGwpIHtcbiAgICAgICAgd2Vlay5kID0gd2Vla2RheTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5pbnZhbGlkV2Vla2RheSA9IGlucHV0O1xuICAgIH1cbn0pO1xuXG5hZGRXZWVrUGFyc2VUb2tlbihbJ2QnLCAnZScsICdFJ10sIGZ1bmN0aW9uIChpbnB1dCwgd2VlaywgY29uZmlnLCB0b2tlbikge1xuICAgIHdlZWtbdG9rZW5dID0gdG9JbnQoaW5wdXQpO1xufSk7XG5cbi8vIEhFTFBFUlNcblxuZnVuY3Rpb24gcGFyc2VXZWVrZGF5KGlucHV0LCBsb2NhbGUpIHtcbiAgICBpZiAodHlwZW9mIGlucHV0ICE9PSAnc3RyaW5nJykge1xuICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgfVxuXG4gICAgaWYgKCFpc05hTihpbnB1dCkpIHtcbiAgICAgICAgcmV0dXJuIHBhcnNlSW50KGlucHV0LCAxMCk7XG4gICAgfVxuXG4gICAgaW5wdXQgPSBsb2NhbGUud2Vla2RheXNQYXJzZShpbnB1dCk7XG4gICAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgcmV0dXJuIGlucHV0O1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBwYXJzZUlzb1dlZWtkYXkoaW5wdXQsIGxvY2FsZSkge1xuICAgIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiBsb2NhbGUud2Vla2RheXNQYXJzZShpbnB1dCkgJSA3IHx8IDc7XG4gICAgfVxuICAgIHJldHVybiBpc05hTihpbnB1dCkgPyBudWxsIDogaW5wdXQ7XG59XG5cbi8vIExPQ0FMRVNcblxudmFyIGRlZmF1bHRMb2NhbGVXZWVrZGF5cyA9ICdTdW5kYXlfTW9uZGF5X1R1ZXNkYXlfV2VkbmVzZGF5X1RodXJzZGF5X0ZyaWRheV9TYXR1cmRheScuc3BsaXQoJ18nKTtcbmZ1bmN0aW9uIGxvY2FsZVdlZWtkYXlzIChtLCBmb3JtYXQpIHtcbiAgICBpZiAoIW0pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzO1xuICAgIH1cbiAgICByZXR1cm4gaXNBcnJheSh0aGlzLl93ZWVrZGF5cykgPyB0aGlzLl93ZWVrZGF5c1ttLmRheSgpXSA6XG4gICAgICAgIHRoaXMuX3dlZWtkYXlzW3RoaXMuX3dlZWtkYXlzLmlzRm9ybWF0LnRlc3QoZm9ybWF0KSA/ICdmb3JtYXQnIDogJ3N0YW5kYWxvbmUnXVttLmRheSgpXTtcbn1cblxudmFyIGRlZmF1bHRMb2NhbGVXZWVrZGF5c1Nob3J0ID0gJ1N1bl9Nb25fVHVlX1dlZF9UaHVfRnJpX1NhdCcuc3BsaXQoJ18nKTtcbmZ1bmN0aW9uIGxvY2FsZVdlZWtkYXlzU2hvcnQgKG0pIHtcbiAgICByZXR1cm4gKG0pID8gdGhpcy5fd2Vla2RheXNTaG9ydFttLmRheSgpXSA6IHRoaXMuX3dlZWtkYXlzU2hvcnQ7XG59XG5cbnZhciBkZWZhdWx0TG9jYWxlV2Vla2RheXNNaW4gPSAnU3VfTW9fVHVfV2VfVGhfRnJfU2EnLnNwbGl0KCdfJyk7XG5mdW5jdGlvbiBsb2NhbGVXZWVrZGF5c01pbiAobSkge1xuICAgIHJldHVybiAobSkgPyB0aGlzLl93ZWVrZGF5c01pblttLmRheSgpXSA6IHRoaXMuX3dlZWtkYXlzTWluO1xufVxuXG5mdW5jdGlvbiBoYW5kbGVTdHJpY3RQYXJzZSQxKHdlZWtkYXlOYW1lLCBmb3JtYXQsIHN0cmljdCkge1xuICAgIHZhciBpLCBpaSwgbW9tLCBsbGMgPSB3ZWVrZGF5TmFtZS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xuICAgIGlmICghdGhpcy5fd2Vla2RheXNQYXJzZSkge1xuICAgICAgICB0aGlzLl93ZWVrZGF5c1BhcnNlID0gW107XG4gICAgICAgIHRoaXMuX3Nob3J0V2Vla2RheXNQYXJzZSA9IFtdO1xuICAgICAgICB0aGlzLl9taW5XZWVrZGF5c1BhcnNlID0gW107XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IDc7ICsraSkge1xuICAgICAgICAgICAgbW9tID0gY3JlYXRlVVRDKFsyMDAwLCAxXSkuZGF5KGkpO1xuICAgICAgICAgICAgdGhpcy5fbWluV2Vla2RheXNQYXJzZVtpXSA9IHRoaXMud2Vla2RheXNNaW4obW9tLCAnJykudG9Mb2NhbGVMb3dlckNhc2UoKTtcbiAgICAgICAgICAgIHRoaXMuX3Nob3J0V2Vla2RheXNQYXJzZVtpXSA9IHRoaXMud2Vla2RheXNTaG9ydChtb20sICcnKS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgdGhpcy5fd2Vla2RheXNQYXJzZVtpXSA9IHRoaXMud2Vla2RheXMobW9tLCAnJykudG9Mb2NhbGVMb3dlckNhc2UoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzdHJpY3QpIHtcbiAgICAgICAgaWYgKGZvcm1hdCA9PT0gJ2RkZGQnKSB7XG4gICAgICAgICAgICBpaSA9IGluZGV4T2YkMS5jYWxsKHRoaXMuX3dlZWtkYXlzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICByZXR1cm4gaWkgIT09IC0xID8gaWkgOiBudWxsO1xuICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdCA9PT0gJ2RkZCcpIHtcbiAgICAgICAgICAgIGlpID0gaW5kZXhPZiQxLmNhbGwodGhpcy5fc2hvcnRXZWVrZGF5c1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgcmV0dXJuIGlpICE9PSAtMSA/IGlpIDogbnVsbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlpID0gaW5kZXhPZiQxLmNhbGwodGhpcy5fbWluV2Vla2RheXNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgIHJldHVybiBpaSAhPT0gLTEgPyBpaSA6IG51bGw7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoZm9ybWF0ID09PSAnZGRkZCcpIHtcbiAgICAgICAgICAgIGlpID0gaW5kZXhPZiQxLmNhbGwodGhpcy5fd2Vla2RheXNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgIGlmIChpaSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaWk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpaSA9IGluZGV4T2YkMS5jYWxsKHRoaXMuX3Nob3J0V2Vla2RheXNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgIGlmIChpaSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaWk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpaSA9IGluZGV4T2YkMS5jYWxsKHRoaXMuX21pbldlZWtkYXlzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICByZXR1cm4gaWkgIT09IC0xID8gaWkgOiBudWxsO1xuICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdCA9PT0gJ2RkZCcpIHtcbiAgICAgICAgICAgIGlpID0gaW5kZXhPZiQxLmNhbGwodGhpcy5fc2hvcnRXZWVrZGF5c1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgaWYgKGlpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlpID0gaW5kZXhPZiQxLmNhbGwodGhpcy5fd2Vla2RheXNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgIGlmIChpaSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaWk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpaSA9IGluZGV4T2YkMS5jYWxsKHRoaXMuX21pbldlZWtkYXlzUGFyc2UsIGxsYyk7XG4gICAgICAgICAgICByZXR1cm4gaWkgIT09IC0xID8gaWkgOiBudWxsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWkgPSBpbmRleE9mJDEuY2FsbCh0aGlzLl9taW5XZWVrZGF5c1BhcnNlLCBsbGMpO1xuICAgICAgICAgICAgaWYgKGlpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlpID0gaW5kZXhPZiQxLmNhbGwodGhpcy5fd2Vla2RheXNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgIGlmIChpaSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaWk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpaSA9IGluZGV4T2YkMS5jYWxsKHRoaXMuX3Nob3J0V2Vla2RheXNQYXJzZSwgbGxjKTtcbiAgICAgICAgICAgIHJldHVybiBpaSAhPT0gLTEgPyBpaSA6IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGxvY2FsZVdlZWtkYXlzUGFyc2UgKHdlZWtkYXlOYW1lLCBmb3JtYXQsIHN0cmljdCkge1xuICAgIHZhciBpLCBtb20sIHJlZ2V4O1xuXG4gICAgaWYgKHRoaXMuX3dlZWtkYXlzUGFyc2VFeGFjdCkge1xuICAgICAgICByZXR1cm4gaGFuZGxlU3RyaWN0UGFyc2UkMS5jYWxsKHRoaXMsIHdlZWtkYXlOYW1lLCBmb3JtYXQsIHN0cmljdCk7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLl93ZWVrZGF5c1BhcnNlKSB7XG4gICAgICAgIHRoaXMuX3dlZWtkYXlzUGFyc2UgPSBbXTtcbiAgICAgICAgdGhpcy5fbWluV2Vla2RheXNQYXJzZSA9IFtdO1xuICAgICAgICB0aGlzLl9zaG9ydFdlZWtkYXlzUGFyc2UgPSBbXTtcbiAgICAgICAgdGhpcy5fZnVsbFdlZWtkYXlzUGFyc2UgPSBbXTtcbiAgICB9XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgNzsgaSsrKSB7XG4gICAgICAgIC8vIG1ha2UgdGhlIHJlZ2V4IGlmIHdlIGRvbid0IGhhdmUgaXQgYWxyZWFkeVxuXG4gICAgICAgIG1vbSA9IGNyZWF0ZVVUQyhbMjAwMCwgMV0pLmRheShpKTtcbiAgICAgICAgaWYgKHN0cmljdCAmJiAhdGhpcy5fZnVsbFdlZWtkYXlzUGFyc2VbaV0pIHtcbiAgICAgICAgICAgIHRoaXMuX2Z1bGxXZWVrZGF5c1BhcnNlW2ldID0gbmV3IFJlZ0V4cCgnXicgKyB0aGlzLndlZWtkYXlzKG1vbSwgJycpLnJlcGxhY2UoJy4nLCAnXFwuPycpICsgJyQnLCAnaScpO1xuICAgICAgICAgICAgdGhpcy5fc2hvcnRXZWVrZGF5c1BhcnNlW2ldID0gbmV3IFJlZ0V4cCgnXicgKyB0aGlzLndlZWtkYXlzU2hvcnQobW9tLCAnJykucmVwbGFjZSgnLicsICdcXC4/JykgKyAnJCcsICdpJyk7XG4gICAgICAgICAgICB0aGlzLl9taW5XZWVrZGF5c1BhcnNlW2ldID0gbmV3IFJlZ0V4cCgnXicgKyB0aGlzLndlZWtkYXlzTWluKG1vbSwgJycpLnJlcGxhY2UoJy4nLCAnXFwuPycpICsgJyQnLCAnaScpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5fd2Vla2RheXNQYXJzZVtpXSkge1xuICAgICAgICAgICAgcmVnZXggPSAnXicgKyB0aGlzLndlZWtkYXlzKG1vbSwgJycpICsgJ3xeJyArIHRoaXMud2Vla2RheXNTaG9ydChtb20sICcnKSArICd8XicgKyB0aGlzLndlZWtkYXlzTWluKG1vbSwgJycpO1xuICAgICAgICAgICAgdGhpcy5fd2Vla2RheXNQYXJzZVtpXSA9IG5ldyBSZWdFeHAocmVnZXgucmVwbGFjZSgnLicsICcnKSwgJ2knKTtcbiAgICAgICAgfVxuICAgICAgICAvLyB0ZXN0IHRoZSByZWdleFxuICAgICAgICBpZiAoc3RyaWN0ICYmIGZvcm1hdCA9PT0gJ2RkZGQnICYmIHRoaXMuX2Z1bGxXZWVrZGF5c1BhcnNlW2ldLnRlc3Qod2Vla2RheU5hbWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgfSBlbHNlIGlmIChzdHJpY3QgJiYgZm9ybWF0ID09PSAnZGRkJyAmJiB0aGlzLl9zaG9ydFdlZWtkYXlzUGFyc2VbaV0udGVzdCh3ZWVrZGF5TmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICB9IGVsc2UgaWYgKHN0cmljdCAmJiBmb3JtYXQgPT09ICdkZCcgJiYgdGhpcy5fbWluV2Vla2RheXNQYXJzZVtpXS50ZXN0KHdlZWtkYXlOYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgIH0gZWxzZSBpZiAoIXN0cmljdCAmJiB0aGlzLl93ZWVrZGF5c1BhcnNlW2ldLnRlc3Qod2Vla2RheU5hbWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gTU9NRU5UU1xuXG5mdW5jdGlvbiBnZXRTZXREYXlPZldlZWsgKGlucHV0KSB7XG4gICAgaWYgKCF0aGlzLmlzVmFsaWQoKSkge1xuICAgICAgICByZXR1cm4gaW5wdXQgIT0gbnVsbCA/IHRoaXMgOiBOYU47XG4gICAgfVxuICAgIHZhciBkYXkgPSB0aGlzLl9pc1VUQyA/IHRoaXMuX2QuZ2V0VVRDRGF5KCkgOiB0aGlzLl9kLmdldERheSgpO1xuICAgIGlmIChpbnB1dCAhPSBudWxsKSB7XG4gICAgICAgIGlucHV0ID0gcGFyc2VXZWVrZGF5KGlucHV0LCB0aGlzLmxvY2FsZURhdGEoKSk7XG4gICAgICAgIHJldHVybiB0aGlzLmFkZChpbnB1dCAtIGRheSwgJ2QnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZGF5O1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0U2V0TG9jYWxlRGF5T2ZXZWVrIChpbnB1dCkge1xuICAgIGlmICghdGhpcy5pc1ZhbGlkKCkpIHtcbiAgICAgICAgcmV0dXJuIGlucHV0ICE9IG51bGwgPyB0aGlzIDogTmFOO1xuICAgIH1cbiAgICB2YXIgd2Vla2RheSA9ICh0aGlzLmRheSgpICsgNyAtIHRoaXMubG9jYWxlRGF0YSgpLl93ZWVrLmRvdykgJSA3O1xuICAgIHJldHVybiBpbnB1dCA9PSBudWxsID8gd2Vla2RheSA6IHRoaXMuYWRkKGlucHV0IC0gd2Vla2RheSwgJ2QnKTtcbn1cblxuZnVuY3Rpb24gZ2V0U2V0SVNPRGF5T2ZXZWVrIChpbnB1dCkge1xuICAgIGlmICghdGhpcy5pc1ZhbGlkKCkpIHtcbiAgICAgICAgcmV0dXJuIGlucHV0ICE9IG51bGwgPyB0aGlzIDogTmFOO1xuICAgIH1cblxuICAgIC8vIGJlaGF2ZXMgdGhlIHNhbWUgYXMgbW9tZW50I2RheSBleGNlcHRcbiAgICAvLyBhcyBhIGdldHRlciwgcmV0dXJucyA3IGluc3RlYWQgb2YgMCAoMS03IHJhbmdlIGluc3RlYWQgb2YgMC02KVxuICAgIC8vIGFzIGEgc2V0dGVyLCBzdW5kYXkgc2hvdWxkIGJlbG9uZyB0byB0aGUgcHJldmlvdXMgd2Vlay5cblxuICAgIGlmIChpbnB1dCAhPSBudWxsKSB7XG4gICAgICAgIHZhciB3ZWVrZGF5ID0gcGFyc2VJc29XZWVrZGF5KGlucHV0LCB0aGlzLmxvY2FsZURhdGEoKSk7XG4gICAgICAgIHJldHVybiB0aGlzLmRheSh0aGlzLmRheSgpICUgNyA/IHdlZWtkYXkgOiB3ZWVrZGF5IC0gNyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF5KCkgfHwgNztcbiAgICB9XG59XG5cbnZhciBkZWZhdWx0V2Vla2RheXNSZWdleCA9IG1hdGNoV29yZDtcbmZ1bmN0aW9uIHdlZWtkYXlzUmVnZXggKGlzU3RyaWN0KSB7XG4gICAgaWYgKHRoaXMuX3dlZWtkYXlzUGFyc2VFeGFjdCkge1xuICAgICAgICBpZiAoIWhhc093blByb3AodGhpcywgJ193ZWVrZGF5c1JlZ2V4JykpIHtcbiAgICAgICAgICAgIGNvbXB1dGVXZWVrZGF5c1BhcnNlLmNhbGwodGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzU3RyaWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fd2Vla2RheXNTdHJpY3RSZWdleDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl93ZWVrZGF5c1JlZ2V4O1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCFoYXNPd25Qcm9wKHRoaXMsICdfd2Vla2RheXNSZWdleCcpKSB7XG4gICAgICAgICAgICB0aGlzLl93ZWVrZGF5c1JlZ2V4ID0gZGVmYXVsdFdlZWtkYXlzUmVnZXg7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzU3RyaWN0UmVnZXggJiYgaXNTdHJpY3QgP1xuICAgICAgICAgICAgdGhpcy5fd2Vla2RheXNTdHJpY3RSZWdleCA6IHRoaXMuX3dlZWtkYXlzUmVnZXg7XG4gICAgfVxufVxuXG52YXIgZGVmYXVsdFdlZWtkYXlzU2hvcnRSZWdleCA9IG1hdGNoV29yZDtcbmZ1bmN0aW9uIHdlZWtkYXlzU2hvcnRSZWdleCAoaXNTdHJpY3QpIHtcbiAgICBpZiAodGhpcy5fd2Vla2RheXNQYXJzZUV4YWN0KSB7XG4gICAgICAgIGlmICghaGFzT3duUHJvcCh0aGlzLCAnX3dlZWtkYXlzUmVnZXgnKSkge1xuICAgICAgICAgICAgY29tcHV0ZVdlZWtkYXlzUGFyc2UuY2FsbCh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNTdHJpY3QpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl93ZWVrZGF5c1Nob3J0U3RyaWN0UmVnZXg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fd2Vla2RheXNTaG9ydFJlZ2V4O1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCFoYXNPd25Qcm9wKHRoaXMsICdfd2Vla2RheXNTaG9ydFJlZ2V4JykpIHtcbiAgICAgICAgICAgIHRoaXMuX3dlZWtkYXlzU2hvcnRSZWdleCA9IGRlZmF1bHRXZWVrZGF5c1Nob3J0UmVnZXg7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzU2hvcnRTdHJpY3RSZWdleCAmJiBpc1N0cmljdCA/XG4gICAgICAgICAgICB0aGlzLl93ZWVrZGF5c1Nob3J0U3RyaWN0UmVnZXggOiB0aGlzLl93ZWVrZGF5c1Nob3J0UmVnZXg7XG4gICAgfVxufVxuXG52YXIgZGVmYXVsdFdlZWtkYXlzTWluUmVnZXggPSBtYXRjaFdvcmQ7XG5mdW5jdGlvbiB3ZWVrZGF5c01pblJlZ2V4IChpc1N0cmljdCkge1xuICAgIGlmICh0aGlzLl93ZWVrZGF5c1BhcnNlRXhhY3QpIHtcbiAgICAgICAgaWYgKCFoYXNPd25Qcm9wKHRoaXMsICdfd2Vla2RheXNSZWdleCcpKSB7XG4gICAgICAgICAgICBjb21wdXRlV2Vla2RheXNQYXJzZS5jYWxsKHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc1N0cmljdCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlZWtkYXlzTWluU3RyaWN0UmVnZXg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fd2Vla2RheXNNaW5SZWdleDtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICghaGFzT3duUHJvcCh0aGlzLCAnX3dlZWtkYXlzTWluUmVnZXgnKSkge1xuICAgICAgICAgICAgdGhpcy5fd2Vla2RheXNNaW5SZWdleCA9IGRlZmF1bHRXZWVrZGF5c01pblJlZ2V4O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl93ZWVrZGF5c01pblN0cmljdFJlZ2V4ICYmIGlzU3RyaWN0ID9cbiAgICAgICAgICAgIHRoaXMuX3dlZWtkYXlzTWluU3RyaWN0UmVnZXggOiB0aGlzLl93ZWVrZGF5c01pblJlZ2V4O1xuICAgIH1cbn1cblxuXG5mdW5jdGlvbiBjb21wdXRlV2Vla2RheXNQYXJzZSAoKSB7XG4gICAgZnVuY3Rpb24gY21wTGVuUmV2KGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIGIubGVuZ3RoIC0gYS5sZW5ndGg7XG4gICAgfVxuXG4gICAgdmFyIG1pblBpZWNlcyA9IFtdLCBzaG9ydFBpZWNlcyA9IFtdLCBsb25nUGllY2VzID0gW10sIG1peGVkUGllY2VzID0gW10sXG4gICAgICAgIGksIG1vbSwgbWlucCwgc2hvcnRwLCBsb25ncDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgNzsgaSsrKSB7XG4gICAgICAgIC8vIG1ha2UgdGhlIHJlZ2V4IGlmIHdlIGRvbid0IGhhdmUgaXQgYWxyZWFkeVxuICAgICAgICBtb20gPSBjcmVhdGVVVEMoWzIwMDAsIDFdKS5kYXkoaSk7XG4gICAgICAgIG1pbnAgPSB0aGlzLndlZWtkYXlzTWluKG1vbSwgJycpO1xuICAgICAgICBzaG9ydHAgPSB0aGlzLndlZWtkYXlzU2hvcnQobW9tLCAnJyk7XG4gICAgICAgIGxvbmdwID0gdGhpcy53ZWVrZGF5cyhtb20sICcnKTtcbiAgICAgICAgbWluUGllY2VzLnB1c2gobWlucCk7XG4gICAgICAgIHNob3J0UGllY2VzLnB1c2goc2hvcnRwKTtcbiAgICAgICAgbG9uZ1BpZWNlcy5wdXNoKGxvbmdwKTtcbiAgICAgICAgbWl4ZWRQaWVjZXMucHVzaChtaW5wKTtcbiAgICAgICAgbWl4ZWRQaWVjZXMucHVzaChzaG9ydHApO1xuICAgICAgICBtaXhlZFBpZWNlcy5wdXNoKGxvbmdwKTtcbiAgICB9XG4gICAgLy8gU29ydGluZyBtYWtlcyBzdXJlIGlmIG9uZSB3ZWVrZGF5IChvciBhYmJyKSBpcyBhIHByZWZpeCBvZiBhbm90aGVyIGl0XG4gICAgLy8gd2lsbCBtYXRjaCB0aGUgbG9uZ2VyIHBpZWNlLlxuICAgIG1pblBpZWNlcy5zb3J0KGNtcExlblJldik7XG4gICAgc2hvcnRQaWVjZXMuc29ydChjbXBMZW5SZXYpO1xuICAgIGxvbmdQaWVjZXMuc29ydChjbXBMZW5SZXYpO1xuICAgIG1peGVkUGllY2VzLnNvcnQoY21wTGVuUmV2KTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgNzsgaSsrKSB7XG4gICAgICAgIHNob3J0UGllY2VzW2ldID0gcmVnZXhFc2NhcGUoc2hvcnRQaWVjZXNbaV0pO1xuICAgICAgICBsb25nUGllY2VzW2ldID0gcmVnZXhFc2NhcGUobG9uZ1BpZWNlc1tpXSk7XG4gICAgICAgIG1peGVkUGllY2VzW2ldID0gcmVnZXhFc2NhcGUobWl4ZWRQaWVjZXNbaV0pO1xuICAgIH1cblxuICAgIHRoaXMuX3dlZWtkYXlzUmVnZXggPSBuZXcgUmVnRXhwKCdeKCcgKyBtaXhlZFBpZWNlcy5qb2luKCd8JykgKyAnKScsICdpJyk7XG4gICAgdGhpcy5fd2Vla2RheXNTaG9ydFJlZ2V4ID0gdGhpcy5fd2Vla2RheXNSZWdleDtcbiAgICB0aGlzLl93ZWVrZGF5c01pblJlZ2V4ID0gdGhpcy5fd2Vla2RheXNSZWdleDtcblxuICAgIHRoaXMuX3dlZWtkYXlzU3RyaWN0UmVnZXggPSBuZXcgUmVnRXhwKCdeKCcgKyBsb25nUGllY2VzLmpvaW4oJ3wnKSArICcpJywgJ2knKTtcbiAgICB0aGlzLl93ZWVrZGF5c1Nob3J0U3RyaWN0UmVnZXggPSBuZXcgUmVnRXhwKCdeKCcgKyBzaG9ydFBpZWNlcy5qb2luKCd8JykgKyAnKScsICdpJyk7XG4gICAgdGhpcy5fd2Vla2RheXNNaW5TdHJpY3RSZWdleCA9IG5ldyBSZWdFeHAoJ14oJyArIG1pblBpZWNlcy5qb2luKCd8JykgKyAnKScsICdpJyk7XG59XG5cbi8vIEZPUk1BVFRJTkdcblxuZnVuY3Rpb24gaEZvcm1hdCgpIHtcbiAgICByZXR1cm4gdGhpcy5ob3VycygpICUgMTIgfHwgMTI7XG59XG5cbmZ1bmN0aW9uIGtGb3JtYXQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaG91cnMoKSB8fCAyNDtcbn1cblxuYWRkRm9ybWF0VG9rZW4oJ0gnLCBbJ0hIJywgMl0sIDAsICdob3VyJyk7XG5hZGRGb3JtYXRUb2tlbignaCcsIFsnaGgnLCAyXSwgMCwgaEZvcm1hdCk7XG5hZGRGb3JtYXRUb2tlbignaycsIFsna2snLCAyXSwgMCwga0Zvcm1hdCk7XG5cbmFkZEZvcm1hdFRva2VuKCdobW0nLCAwLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICcnICsgaEZvcm1hdC5hcHBseSh0aGlzKSArIHplcm9GaWxsKHRoaXMubWludXRlcygpLCAyKTtcbn0pO1xuXG5hZGRGb3JtYXRUb2tlbignaG1tc3MnLCAwLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICcnICsgaEZvcm1hdC5hcHBseSh0aGlzKSArIHplcm9GaWxsKHRoaXMubWludXRlcygpLCAyKSArXG4gICAgICAgIHplcm9GaWxsKHRoaXMuc2Vjb25kcygpLCAyKTtcbn0pO1xuXG5hZGRGb3JtYXRUb2tlbignSG1tJywgMCwgMCwgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAnJyArIHRoaXMuaG91cnMoKSArIHplcm9GaWxsKHRoaXMubWludXRlcygpLCAyKTtcbn0pO1xuXG5hZGRGb3JtYXRUb2tlbignSG1tc3MnLCAwLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICcnICsgdGhpcy5ob3VycygpICsgemVyb0ZpbGwodGhpcy5taW51dGVzKCksIDIpICtcbiAgICAgICAgemVyb0ZpbGwodGhpcy5zZWNvbmRzKCksIDIpO1xufSk7XG5cbmZ1bmN0aW9uIG1lcmlkaWVtICh0b2tlbiwgbG93ZXJjYXNlKSB7XG4gICAgYWRkRm9ybWF0VG9rZW4odG9rZW4sIDAsIDAsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLm1lcmlkaWVtKHRoaXMuaG91cnMoKSwgdGhpcy5taW51dGVzKCksIGxvd2VyY2FzZSk7XG4gICAgfSk7XG59XG5cbm1lcmlkaWVtKCdhJywgdHJ1ZSk7XG5tZXJpZGllbSgnQScsIGZhbHNlKTtcblxuLy8gQUxJQVNFU1xuXG5hZGRVbml0QWxpYXMoJ2hvdXInLCAnaCcpO1xuXG4vLyBQUklPUklUWVxuYWRkVW5pdFByaW9yaXR5KCdob3VyJywgMTMpO1xuXG4vLyBQQVJTSU5HXG5cbmZ1bmN0aW9uIG1hdGNoTWVyaWRpZW0gKGlzU3RyaWN0LCBsb2NhbGUpIHtcbiAgICByZXR1cm4gbG9jYWxlLl9tZXJpZGllbVBhcnNlO1xufVxuXG5hZGRSZWdleFRva2VuKCdhJywgIG1hdGNoTWVyaWRpZW0pO1xuYWRkUmVnZXhUb2tlbignQScsICBtYXRjaE1lcmlkaWVtKTtcbmFkZFJlZ2V4VG9rZW4oJ0gnLCAgbWF0Y2gxdG8yKTtcbmFkZFJlZ2V4VG9rZW4oJ2gnLCAgbWF0Y2gxdG8yKTtcbmFkZFJlZ2V4VG9rZW4oJ0hIJywgbWF0Y2gxdG8yLCBtYXRjaDIpO1xuYWRkUmVnZXhUb2tlbignaGgnLCBtYXRjaDF0bzIsIG1hdGNoMik7XG5cbmFkZFJlZ2V4VG9rZW4oJ2htbScsIG1hdGNoM3RvNCk7XG5hZGRSZWdleFRva2VuKCdobW1zcycsIG1hdGNoNXRvNik7XG5hZGRSZWdleFRva2VuKCdIbW0nLCBtYXRjaDN0bzQpO1xuYWRkUmVnZXhUb2tlbignSG1tc3MnLCBtYXRjaDV0bzYpO1xuXG5hZGRQYXJzZVRva2VuKFsnSCcsICdISCddLCBIT1VSKTtcbmFkZFBhcnNlVG9rZW4oWydhJywgJ0EnXSwgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnKSB7XG4gICAgY29uZmlnLl9pc1BtID0gY29uZmlnLl9sb2NhbGUuaXNQTShpbnB1dCk7XG4gICAgY29uZmlnLl9tZXJpZGllbSA9IGlucHV0O1xufSk7XG5hZGRQYXJzZVRva2VuKFsnaCcsICdoaCddLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5LCBjb25maWcpIHtcbiAgICBhcnJheVtIT1VSXSA9IHRvSW50KGlucHV0KTtcbiAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5iaWdIb3VyID0gdHJ1ZTtcbn0pO1xuYWRkUGFyc2VUb2tlbignaG1tJywgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnKSB7XG4gICAgdmFyIHBvcyA9IGlucHV0Lmxlbmd0aCAtIDI7XG4gICAgYXJyYXlbSE9VUl0gPSB0b0ludChpbnB1dC5zdWJzdHIoMCwgcG9zKSk7XG4gICAgYXJyYXlbTUlOVVRFXSA9IHRvSW50KGlucHV0LnN1YnN0cihwb3MpKTtcbiAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5iaWdIb3VyID0gdHJ1ZTtcbn0pO1xuYWRkUGFyc2VUb2tlbignaG1tc3MnLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5LCBjb25maWcpIHtcbiAgICB2YXIgcG9zMSA9IGlucHV0Lmxlbmd0aCAtIDQ7XG4gICAgdmFyIHBvczIgPSBpbnB1dC5sZW5ndGggLSAyO1xuICAgIGFycmF5W0hPVVJdID0gdG9JbnQoaW5wdXQuc3Vic3RyKDAsIHBvczEpKTtcbiAgICBhcnJheVtNSU5VVEVdID0gdG9JbnQoaW5wdXQuc3Vic3RyKHBvczEsIDIpKTtcbiAgICBhcnJheVtTRUNPTkRdID0gdG9JbnQoaW5wdXQuc3Vic3RyKHBvczIpKTtcbiAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5iaWdIb3VyID0gdHJ1ZTtcbn0pO1xuYWRkUGFyc2VUb2tlbignSG1tJywgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnKSB7XG4gICAgdmFyIHBvcyA9IGlucHV0Lmxlbmd0aCAtIDI7XG4gICAgYXJyYXlbSE9VUl0gPSB0b0ludChpbnB1dC5zdWJzdHIoMCwgcG9zKSk7XG4gICAgYXJyYXlbTUlOVVRFXSA9IHRvSW50KGlucHV0LnN1YnN0cihwb3MpKTtcbn0pO1xuYWRkUGFyc2VUb2tlbignSG1tc3MnLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5LCBjb25maWcpIHtcbiAgICB2YXIgcG9zMSA9IGlucHV0Lmxlbmd0aCAtIDQ7XG4gICAgdmFyIHBvczIgPSBpbnB1dC5sZW5ndGggLSAyO1xuICAgIGFycmF5W0hPVVJdID0gdG9JbnQoaW5wdXQuc3Vic3RyKDAsIHBvczEpKTtcbiAgICBhcnJheVtNSU5VVEVdID0gdG9JbnQoaW5wdXQuc3Vic3RyKHBvczEsIDIpKTtcbiAgICBhcnJheVtTRUNPTkRdID0gdG9JbnQoaW5wdXQuc3Vic3RyKHBvczIpKTtcbn0pO1xuXG4vLyBMT0NBTEVTXG5cbmZ1bmN0aW9uIGxvY2FsZUlzUE0gKGlucHV0KSB7XG4gICAgLy8gSUU4IFF1aXJrcyBNb2RlICYgSUU3IFN0YW5kYXJkcyBNb2RlIGRvIG5vdCBhbGxvdyBhY2Nlc3Npbmcgc3RyaW5ncyBsaWtlIGFycmF5c1xuICAgIC8vIFVzaW5nIGNoYXJBdCBzaG91bGQgYmUgbW9yZSBjb21wYXRpYmxlLlxuICAgIHJldHVybiAoKGlucHV0ICsgJycpLnRvTG93ZXJDYXNlKCkuY2hhckF0KDApID09PSAncCcpO1xufVxuXG52YXIgZGVmYXVsdExvY2FsZU1lcmlkaWVtUGFyc2UgPSAvW2FwXVxcLj9tP1xcLj8vaTtcbmZ1bmN0aW9uIGxvY2FsZU1lcmlkaWVtIChob3VycywgbWludXRlcywgaXNMb3dlcikge1xuICAgIGlmIChob3VycyA+IDExKSB7XG4gICAgICAgIHJldHVybiBpc0xvd2VyID8gJ3BtJyA6ICdQTSc7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGlzTG93ZXIgPyAnYW0nIDogJ0FNJztcbiAgICB9XG59XG5cblxuLy8gTU9NRU5UU1xuXG4vLyBTZXR0aW5nIHRoZSBob3VyIHNob3VsZCBrZWVwIHRoZSB0aW1lLCBiZWNhdXNlIHRoZSB1c2VyIGV4cGxpY2l0bHlcbi8vIHNwZWNpZmllZCB3aGljaCBob3VyIGhlIHdhbnRzLiBTbyB0cnlpbmcgdG8gbWFpbnRhaW4gdGhlIHNhbWUgaG91ciAoaW5cbi8vIGEgbmV3IHRpbWV6b25lKSBtYWtlcyBzZW5zZS4gQWRkaW5nL3N1YnRyYWN0aW5nIGhvdXJzIGRvZXMgbm90IGZvbGxvd1xuLy8gdGhpcyBydWxlLlxudmFyIGdldFNldEhvdXIgPSBtYWtlR2V0U2V0KCdIb3VycycsIHRydWUpO1xuXG4vLyBtb250aHNcbi8vIHdlZWtcbi8vIHdlZWtkYXlzXG4vLyBtZXJpZGllbVxudmFyIGJhc2VDb25maWcgPSB7XG4gICAgY2FsZW5kYXI6IGRlZmF1bHRDYWxlbmRhcixcbiAgICBsb25nRGF0ZUZvcm1hdDogZGVmYXVsdExvbmdEYXRlRm9ybWF0LFxuICAgIGludmFsaWREYXRlOiBkZWZhdWx0SW52YWxpZERhdGUsXG4gICAgb3JkaW5hbDogZGVmYXVsdE9yZGluYWwsXG4gICAgb3JkaW5hbFBhcnNlOiBkZWZhdWx0T3JkaW5hbFBhcnNlLFxuICAgIHJlbGF0aXZlVGltZTogZGVmYXVsdFJlbGF0aXZlVGltZSxcblxuICAgIG1vbnRoczogZGVmYXVsdExvY2FsZU1vbnRocyxcbiAgICBtb250aHNTaG9ydDogZGVmYXVsdExvY2FsZU1vbnRoc1Nob3J0LFxuXG4gICAgd2VlazogZGVmYXVsdExvY2FsZVdlZWssXG5cbiAgICB3ZWVrZGF5czogZGVmYXVsdExvY2FsZVdlZWtkYXlzLFxuICAgIHdlZWtkYXlzTWluOiBkZWZhdWx0TG9jYWxlV2Vla2RheXNNaW4sXG4gICAgd2Vla2RheXNTaG9ydDogZGVmYXVsdExvY2FsZVdlZWtkYXlzU2hvcnQsXG5cbiAgICBtZXJpZGllbVBhcnNlOiBkZWZhdWx0TG9jYWxlTWVyaWRpZW1QYXJzZVxufTtcblxuLy8gaW50ZXJuYWwgc3RvcmFnZSBmb3IgbG9jYWxlIGNvbmZpZyBmaWxlc1xudmFyIGxvY2FsZXMgPSB7fTtcbnZhciBsb2NhbGVGYW1pbGllcyA9IHt9O1xudmFyIGdsb2JhbExvY2FsZTtcblxuZnVuY3Rpb24gbm9ybWFsaXplTG9jYWxlKGtleSkge1xuICAgIHJldHVybiBrZXkgPyBrZXkudG9Mb3dlckNhc2UoKS5yZXBsYWNlKCdfJywgJy0nKSA6IGtleTtcbn1cblxuLy8gcGljayB0aGUgbG9jYWxlIGZyb20gdGhlIGFycmF5XG4vLyB0cnkgWydlbi1hdScsICdlbi1nYiddIGFzICdlbi1hdScsICdlbi1nYicsICdlbicsIGFzIGluIG1vdmUgdGhyb3VnaCB0aGUgbGlzdCB0cnlpbmcgZWFjaFxuLy8gc3Vic3RyaW5nIGZyb20gbW9zdCBzcGVjaWZpYyB0byBsZWFzdCwgYnV0IG1vdmUgdG8gdGhlIG5leHQgYXJyYXkgaXRlbSBpZiBpdCdzIGEgbW9yZSBzcGVjaWZpYyB2YXJpYW50IHRoYW4gdGhlIGN1cnJlbnQgcm9vdFxuZnVuY3Rpb24gY2hvb3NlTG9jYWxlKG5hbWVzKSB7XG4gICAgdmFyIGkgPSAwLCBqLCBuZXh0LCBsb2NhbGUsIHNwbGl0O1xuXG4gICAgd2hpbGUgKGkgPCBuYW1lcy5sZW5ndGgpIHtcbiAgICAgICAgc3BsaXQgPSBub3JtYWxpemVMb2NhbGUobmFtZXNbaV0pLnNwbGl0KCctJyk7XG4gICAgICAgIGogPSBzcGxpdC5sZW5ndGg7XG4gICAgICAgIG5leHQgPSBub3JtYWxpemVMb2NhbGUobmFtZXNbaSArIDFdKTtcbiAgICAgICAgbmV4dCA9IG5leHQgPyBuZXh0LnNwbGl0KCctJykgOiBudWxsO1xuICAgICAgICB3aGlsZSAoaiA+IDApIHtcbiAgICAgICAgICAgIGxvY2FsZSA9IGxvYWRMb2NhbGUoc3BsaXQuc2xpY2UoMCwgaikuam9pbignLScpKTtcbiAgICAgICAgICAgIGlmIChsb2NhbGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbG9jYWxlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5leHQgJiYgbmV4dC5sZW5ndGggPj0gaiAmJiBjb21wYXJlQXJyYXlzKHNwbGl0LCBuZXh0LCB0cnVlKSA+PSBqIC0gMSkge1xuICAgICAgICAgICAgICAgIC8vdGhlIG5leHQgYXJyYXkgaXRlbSBpcyBiZXR0ZXIgdGhhbiBhIHNoYWxsb3dlciBzdWJzdHJpbmcgb2YgdGhpcyBvbmVcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGotLTtcbiAgICAgICAgfVxuICAgICAgICBpKys7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBsb2FkTG9jYWxlKG5hbWUpIHtcbiAgICB2YXIgb2xkTG9jYWxlID0gbnVsbDtcbiAgICAvLyBUT0RPOiBGaW5kIGEgYmV0dGVyIHdheSB0byByZWdpc3RlciBhbmQgbG9hZCBhbGwgdGhlIGxvY2FsZXMgaW4gTm9kZVxuICAgIGlmICghbG9jYWxlc1tuYW1lXSAmJiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpICYmXG4gICAgICAgICAgICBtb2R1bGUgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIG9sZExvY2FsZSA9IGdsb2JhbExvY2FsZS5fYWJicjtcbiAgICAgICAgICAgIHJlcXVpcmUoJy4vbG9jYWxlLycgKyBuYW1lKTtcbiAgICAgICAgICAgIC8vIGJlY2F1c2UgZGVmaW5lTG9jYWxlIGN1cnJlbnRseSBhbHNvIHNldHMgdGhlIGdsb2JhbCBsb2NhbGUsIHdlXG4gICAgICAgICAgICAvLyB3YW50IHRvIHVuZG8gdGhhdCBmb3IgbGF6eSBsb2FkZWQgbG9jYWxlc1xuICAgICAgICAgICAgZ2V0U2V0R2xvYmFsTG9jYWxlKG9sZExvY2FsZSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHsgfVxuICAgIH1cbiAgICByZXR1cm4gbG9jYWxlc1tuYW1lXTtcbn1cblxuLy8gVGhpcyBmdW5jdGlvbiB3aWxsIGxvYWQgbG9jYWxlIGFuZCB0aGVuIHNldCB0aGUgZ2xvYmFsIGxvY2FsZS4gIElmXG4vLyBubyBhcmd1bWVudHMgYXJlIHBhc3NlZCBpbiwgaXQgd2lsbCBzaW1wbHkgcmV0dXJuIHRoZSBjdXJyZW50IGdsb2JhbFxuLy8gbG9jYWxlIGtleS5cbmZ1bmN0aW9uIGdldFNldEdsb2JhbExvY2FsZSAoa2V5LCB2YWx1ZXMpIHtcbiAgICB2YXIgZGF0YTtcbiAgICBpZiAoa2V5KSB7XG4gICAgICAgIGlmIChpc1VuZGVmaW5lZCh2YWx1ZXMpKSB7XG4gICAgICAgICAgICBkYXRhID0gZ2V0TG9jYWxlKGtleSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBkYXRhID0gZGVmaW5lTG9jYWxlKGtleSwgdmFsdWVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgICAgICAvLyBtb21lbnQuZHVyYXRpb24uX2xvY2FsZSA9IG1vbWVudC5fbG9jYWxlID0gZGF0YTtcbiAgICAgICAgICAgIGdsb2JhbExvY2FsZSA9IGRhdGE7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZ2xvYmFsTG9jYWxlLl9hYmJyO1xufVxuXG5mdW5jdGlvbiBkZWZpbmVMb2NhbGUgKG5hbWUsIGNvbmZpZykge1xuICAgIGlmIChjb25maWcgIT09IG51bGwpIHtcbiAgICAgICAgdmFyIHBhcmVudENvbmZpZyA9IGJhc2VDb25maWc7XG4gICAgICAgIGNvbmZpZy5hYmJyID0gbmFtZTtcbiAgICAgICAgaWYgKGxvY2FsZXNbbmFtZV0gIT0gbnVsbCkge1xuICAgICAgICAgICAgZGVwcmVjYXRlU2ltcGxlKCdkZWZpbmVMb2NhbGVPdmVycmlkZScsXG4gICAgICAgICAgICAgICAgICAgICd1c2UgbW9tZW50LnVwZGF0ZUxvY2FsZShsb2NhbGVOYW1lLCBjb25maWcpIHRvIGNoYW5nZSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2FuIGV4aXN0aW5nIGxvY2FsZS4gbW9tZW50LmRlZmluZUxvY2FsZShsb2NhbGVOYW1lLCAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2NvbmZpZykgc2hvdWxkIG9ubHkgYmUgdXNlZCBmb3IgY3JlYXRpbmcgYSBuZXcgbG9jYWxlICcgK1xuICAgICAgICAgICAgICAgICAgICAnU2VlIGh0dHA6Ly9tb21lbnRqcy5jb20vZ3VpZGVzLyMvd2FybmluZ3MvZGVmaW5lLWxvY2FsZS8gZm9yIG1vcmUgaW5mby4nKTtcbiAgICAgICAgICAgIHBhcmVudENvbmZpZyA9IGxvY2FsZXNbbmFtZV0uX2NvbmZpZztcbiAgICAgICAgfSBlbHNlIGlmIChjb25maWcucGFyZW50TG9jYWxlICE9IG51bGwpIHtcbiAgICAgICAgICAgIGlmIChsb2NhbGVzW2NvbmZpZy5wYXJlbnRMb2NhbGVdICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBwYXJlbnRDb25maWcgPSBsb2NhbGVzW2NvbmZpZy5wYXJlbnRMb2NhbGVdLl9jb25maWc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICghbG9jYWxlRmFtaWxpZXNbY29uZmlnLnBhcmVudExvY2FsZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgbG9jYWxlRmFtaWxpZXNbY29uZmlnLnBhcmVudExvY2FsZV0gPSBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbG9jYWxlRmFtaWxpZXNbY29uZmlnLnBhcmVudExvY2FsZV0ucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZzogY29uZmlnXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbG9jYWxlc1tuYW1lXSA9IG5ldyBMb2NhbGUobWVyZ2VDb25maWdzKHBhcmVudENvbmZpZywgY29uZmlnKSk7XG5cbiAgICAgICAgaWYgKGxvY2FsZUZhbWlsaWVzW25hbWVdKSB7XG4gICAgICAgICAgICBsb2NhbGVGYW1pbGllc1tuYW1lXS5mb3JFYWNoKGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICAgICAgZGVmaW5lTG9jYWxlKHgubmFtZSwgeC5jb25maWcpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBiYWNrd2FyZHMgY29tcGF0IGZvciBub3c6IGFsc28gc2V0IHRoZSBsb2NhbGVcbiAgICAgICAgLy8gbWFrZSBzdXJlIHdlIHNldCB0aGUgbG9jYWxlIEFGVEVSIGFsbCBjaGlsZCBsb2NhbGVzIGhhdmUgYmVlblxuICAgICAgICAvLyBjcmVhdGVkLCBzbyB3ZSB3b24ndCBlbmQgdXAgd2l0aCB0aGUgY2hpbGQgbG9jYWxlIHNldC5cbiAgICAgICAgZ2V0U2V0R2xvYmFsTG9jYWxlKG5hbWUpO1xuXG5cbiAgICAgICAgcmV0dXJuIGxvY2FsZXNbbmFtZV07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gdXNlZnVsIGZvciB0ZXN0aW5nXG4gICAgICAgIGRlbGV0ZSBsb2NhbGVzW25hbWVdO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUxvY2FsZShuYW1lLCBjb25maWcpIHtcbiAgICBpZiAoY29uZmlnICE9IG51bGwpIHtcbiAgICAgICAgdmFyIGxvY2FsZSwgcGFyZW50Q29uZmlnID0gYmFzZUNvbmZpZztcbiAgICAgICAgLy8gTUVSR0VcbiAgICAgICAgaWYgKGxvY2FsZXNbbmFtZV0gIT0gbnVsbCkge1xuICAgICAgICAgICAgcGFyZW50Q29uZmlnID0gbG9jYWxlc1tuYW1lXS5fY29uZmlnO1xuICAgICAgICB9XG4gICAgICAgIGNvbmZpZyA9IG1lcmdlQ29uZmlncyhwYXJlbnRDb25maWcsIGNvbmZpZyk7XG4gICAgICAgIGxvY2FsZSA9IG5ldyBMb2NhbGUoY29uZmlnKTtcbiAgICAgICAgbG9jYWxlLnBhcmVudExvY2FsZSA9IGxvY2FsZXNbbmFtZV07XG4gICAgICAgIGxvY2FsZXNbbmFtZV0gPSBsb2NhbGU7XG5cbiAgICAgICAgLy8gYmFja3dhcmRzIGNvbXBhdCBmb3Igbm93OiBhbHNvIHNldCB0aGUgbG9jYWxlXG4gICAgICAgIGdldFNldEdsb2JhbExvY2FsZShuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBwYXNzIG51bGwgZm9yIGNvbmZpZyB0byB1bnVwZGF0ZSwgdXNlZnVsIGZvciB0ZXN0c1xuICAgICAgICBpZiAobG9jYWxlc1tuYW1lXSAhPSBudWxsKSB7XG4gICAgICAgICAgICBpZiAobG9jYWxlc1tuYW1lXS5wYXJlbnRMb2NhbGUgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGxvY2FsZXNbbmFtZV0gPSBsb2NhbGVzW25hbWVdLnBhcmVudExvY2FsZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobG9jYWxlc1tuYW1lXSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGxvY2FsZXNbbmFtZV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGxvY2FsZXNbbmFtZV07XG59XG5cbi8vIHJldHVybnMgbG9jYWxlIGRhdGFcbmZ1bmN0aW9uIGdldExvY2FsZSAoa2V5KSB7XG4gICAgdmFyIGxvY2FsZTtcblxuICAgIGlmIChrZXkgJiYga2V5Ll9sb2NhbGUgJiYga2V5Ll9sb2NhbGUuX2FiYnIpIHtcbiAgICAgICAga2V5ID0ga2V5Ll9sb2NhbGUuX2FiYnI7XG4gICAgfVxuXG4gICAgaWYgKCFrZXkpIHtcbiAgICAgICAgcmV0dXJuIGdsb2JhbExvY2FsZTtcbiAgICB9XG5cbiAgICBpZiAoIWlzQXJyYXkoa2V5KSkge1xuICAgICAgICAvL3Nob3J0LWNpcmN1aXQgZXZlcnl0aGluZyBlbHNlXG4gICAgICAgIGxvY2FsZSA9IGxvYWRMb2NhbGUoa2V5KTtcbiAgICAgICAgaWYgKGxvY2FsZSkge1xuICAgICAgICAgICAgcmV0dXJuIGxvY2FsZTtcbiAgICAgICAgfVxuICAgICAgICBrZXkgPSBba2V5XTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2hvb3NlTG9jYWxlKGtleSk7XG59XG5cbmZ1bmN0aW9uIGxpc3RMb2NhbGVzKCkge1xuICAgIHJldHVybiBrZXlzJDEobG9jYWxlcyk7XG59XG5cbmZ1bmN0aW9uIGNoZWNrT3ZlcmZsb3cgKG0pIHtcbiAgICB2YXIgb3ZlcmZsb3c7XG4gICAgdmFyIGEgPSBtLl9hO1xuXG4gICAgaWYgKGEgJiYgZ2V0UGFyc2luZ0ZsYWdzKG0pLm92ZXJmbG93ID09PSAtMikge1xuICAgICAgICBvdmVyZmxvdyA9XG4gICAgICAgICAgICBhW01PTlRIXSAgICAgICA8IDAgfHwgYVtNT05USF0gICAgICAgPiAxMSAgPyBNT05USCA6XG4gICAgICAgICAgICBhW0RBVEVdICAgICAgICA8IDEgfHwgYVtEQVRFXSAgICAgICAgPiBkYXlzSW5Nb250aChhW1lFQVJdLCBhW01PTlRIXSkgPyBEQVRFIDpcbiAgICAgICAgICAgIGFbSE9VUl0gICAgICAgIDwgMCB8fCBhW0hPVVJdICAgICAgICA+IDI0IHx8IChhW0hPVVJdID09PSAyNCAmJiAoYVtNSU5VVEVdICE9PSAwIHx8IGFbU0VDT05EXSAhPT0gMCB8fCBhW01JTExJU0VDT05EXSAhPT0gMCkpID8gSE9VUiA6XG4gICAgICAgICAgICBhW01JTlVURV0gICAgICA8IDAgfHwgYVtNSU5VVEVdICAgICAgPiA1OSAgPyBNSU5VVEUgOlxuICAgICAgICAgICAgYVtTRUNPTkRdICAgICAgPCAwIHx8IGFbU0VDT05EXSAgICAgID4gNTkgID8gU0VDT05EIDpcbiAgICAgICAgICAgIGFbTUlMTElTRUNPTkRdIDwgMCB8fCBhW01JTExJU0VDT05EXSA+IDk5OSA/IE1JTExJU0VDT05EIDpcbiAgICAgICAgICAgIC0xO1xuXG4gICAgICAgIGlmIChnZXRQYXJzaW5nRmxhZ3MobSkuX292ZXJmbG93RGF5T2ZZZWFyICYmIChvdmVyZmxvdyA8IFlFQVIgfHwgb3ZlcmZsb3cgPiBEQVRFKSkge1xuICAgICAgICAgICAgb3ZlcmZsb3cgPSBEQVRFO1xuICAgICAgICB9XG4gICAgICAgIGlmIChnZXRQYXJzaW5nRmxhZ3MobSkuX292ZXJmbG93V2Vla3MgJiYgb3ZlcmZsb3cgPT09IC0xKSB7XG4gICAgICAgICAgICBvdmVyZmxvdyA9IFdFRUs7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGdldFBhcnNpbmdGbGFncyhtKS5fb3ZlcmZsb3dXZWVrZGF5ICYmIG92ZXJmbG93ID09PSAtMSkge1xuICAgICAgICAgICAgb3ZlcmZsb3cgPSBXRUVLREFZO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKG0pLm92ZXJmbG93ID0gb3ZlcmZsb3c7XG4gICAgfVxuXG4gICAgcmV0dXJuIG07XG59XG5cbi8vIGlzbyA4NjAxIHJlZ2V4XG4vLyAwMDAwLTAwLTAwIDAwMDAtVzAwIG9yIDAwMDAtVzAwLTAgKyBUICsgMDAgb3IgMDA6MDAgb3IgMDA6MDA6MDAgb3IgMDA6MDA6MDAuMDAwICsgKzAwOjAwIG9yICswMDAwIG9yICswMClcbnZhciBleHRlbmRlZElzb1JlZ2V4ID0gL15cXHMqKCg/OlsrLV1cXGR7Nn18XFxkezR9KS0oPzpcXGRcXGQtXFxkXFxkfFdcXGRcXGQtXFxkfFdcXGRcXGR8XFxkXFxkXFxkfFxcZFxcZCkpKD86KFR8ICkoXFxkXFxkKD86OlxcZFxcZCg/OjpcXGRcXGQoPzpbLixdXFxkKyk/KT8pPykoW1xcK1xcLV1cXGRcXGQoPzo6P1xcZFxcZCk/fFxccypaKT8pPyQvO1xudmFyIGJhc2ljSXNvUmVnZXggPSAvXlxccyooKD86WystXVxcZHs2fXxcXGR7NH0pKD86XFxkXFxkXFxkXFxkfFdcXGRcXGRcXGR8V1xcZFxcZHxcXGRcXGRcXGR8XFxkXFxkKSkoPzooVHwgKShcXGRcXGQoPzpcXGRcXGQoPzpcXGRcXGQoPzpbLixdXFxkKyk/KT8pPykoW1xcK1xcLV1cXGRcXGQoPzo6P1xcZFxcZCk/fFxccypaKT8pPyQvO1xuXG52YXIgdHpSZWdleCA9IC9afFsrLV1cXGRcXGQoPzo6P1xcZFxcZCk/LztcblxudmFyIGlzb0RhdGVzID0gW1xuICAgIFsnWVlZWVlZLU1NLUREJywgL1srLV1cXGR7Nn0tXFxkXFxkLVxcZFxcZC9dLFxuICAgIFsnWVlZWS1NTS1ERCcsIC9cXGR7NH0tXFxkXFxkLVxcZFxcZC9dLFxuICAgIFsnR0dHRy1bV11XVy1FJywgL1xcZHs0fS1XXFxkXFxkLVxcZC9dLFxuICAgIFsnR0dHRy1bV11XVycsIC9cXGR7NH0tV1xcZFxcZC8sIGZhbHNlXSxcbiAgICBbJ1lZWVktREREJywgL1xcZHs0fS1cXGR7M30vXSxcbiAgICBbJ1lZWVktTU0nLCAvXFxkezR9LVxcZFxcZC8sIGZhbHNlXSxcbiAgICBbJ1lZWVlZWU1NREQnLCAvWystXVxcZHsxMH0vXSxcbiAgICBbJ1lZWVlNTUREJywgL1xcZHs4fS9dLFxuICAgIC8vIFlZWVlNTSBpcyBOT1QgYWxsb3dlZCBieSB0aGUgc3RhbmRhcmRcbiAgICBbJ0dHR0dbV11XV0UnLCAvXFxkezR9V1xcZHszfS9dLFxuICAgIFsnR0dHR1tXXVdXJywgL1xcZHs0fVdcXGR7Mn0vLCBmYWxzZV0sXG4gICAgWydZWVlZREREJywgL1xcZHs3fS9dXG5dO1xuXG4vLyBpc28gdGltZSBmb3JtYXRzIGFuZCByZWdleGVzXG52YXIgaXNvVGltZXMgPSBbXG4gICAgWydISDptbTpzcy5TU1NTJywgL1xcZFxcZDpcXGRcXGQ6XFxkXFxkXFwuXFxkKy9dLFxuICAgIFsnSEg6bW06c3MsU1NTUycsIC9cXGRcXGQ6XFxkXFxkOlxcZFxcZCxcXGQrL10sXG4gICAgWydISDptbTpzcycsIC9cXGRcXGQ6XFxkXFxkOlxcZFxcZC9dLFxuICAgIFsnSEg6bW0nLCAvXFxkXFxkOlxcZFxcZC9dLFxuICAgIFsnSEhtbXNzLlNTU1MnLCAvXFxkXFxkXFxkXFxkXFxkXFxkXFwuXFxkKy9dLFxuICAgIFsnSEhtbXNzLFNTU1MnLCAvXFxkXFxkXFxkXFxkXFxkXFxkLFxcZCsvXSxcbiAgICBbJ0hIbW1zcycsIC9cXGRcXGRcXGRcXGRcXGRcXGQvXSxcbiAgICBbJ0hIbW0nLCAvXFxkXFxkXFxkXFxkL10sXG4gICAgWydISCcsIC9cXGRcXGQvXVxuXTtcblxudmFyIGFzcE5ldEpzb25SZWdleCA9IC9eXFwvP0RhdGVcXCgoXFwtP1xcZCspL2k7XG5cbi8vIGRhdGUgZnJvbSBpc28gZm9ybWF0XG5mdW5jdGlvbiBjb25maWdGcm9tSVNPKGNvbmZpZykge1xuICAgIHZhciBpLCBsLFxuICAgICAgICBzdHJpbmcgPSBjb25maWcuX2ksXG4gICAgICAgIG1hdGNoID0gZXh0ZW5kZWRJc29SZWdleC5leGVjKHN0cmluZykgfHwgYmFzaWNJc29SZWdleC5leGVjKHN0cmluZyksXG4gICAgICAgIGFsbG93VGltZSwgZGF0ZUZvcm1hdCwgdGltZUZvcm1hdCwgdHpGb3JtYXQ7XG5cbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuaXNvID0gdHJ1ZTtcblxuICAgICAgICBmb3IgKGkgPSAwLCBsID0gaXNvRGF0ZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoaXNvRGF0ZXNbaV1bMV0uZXhlYyhtYXRjaFsxXSkpIHtcbiAgICAgICAgICAgICAgICBkYXRlRm9ybWF0ID0gaXNvRGF0ZXNbaV1bMF07XG4gICAgICAgICAgICAgICAgYWxsb3dUaW1lID0gaXNvRGF0ZXNbaV1bMl0gIT09IGZhbHNlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChkYXRlRm9ybWF0ID09IG51bGwpIHtcbiAgICAgICAgICAgIGNvbmZpZy5faXNWYWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtYXRjaFszXSkge1xuICAgICAgICAgICAgZm9yIChpID0gMCwgbCA9IGlzb1RpbWVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChpc29UaW1lc1tpXVsxXS5leGVjKG1hdGNoWzNdKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBtYXRjaFsyXSBzaG91bGQgYmUgJ1QnIG9yIHNwYWNlXG4gICAgICAgICAgICAgICAgICAgIHRpbWVGb3JtYXQgPSAobWF0Y2hbMl0gfHwgJyAnKSArIGlzb1RpbWVzW2ldWzBdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGltZUZvcm1hdCA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLl9pc1ZhbGlkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghYWxsb3dUaW1lICYmIHRpbWVGb3JtYXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgY29uZmlnLl9pc1ZhbGlkID0gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1hdGNoWzRdKSB7XG4gICAgICAgICAgICBpZiAodHpSZWdleC5leGVjKG1hdGNoWzRdKSkge1xuICAgICAgICAgICAgICAgIHR6Rm9ybWF0ID0gJ1onO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25maWcuX2lzVmFsaWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uZmlnLl9mID0gZGF0ZUZvcm1hdCArICh0aW1lRm9ybWF0IHx8ICcnKSArICh0ekZvcm1hdCB8fCAnJyk7XG4gICAgICAgIGNvbmZpZ0Zyb21TdHJpbmdBbmRGb3JtYXQoY29uZmlnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25maWcuX2lzVmFsaWQgPSBmYWxzZTtcbiAgICB9XG59XG5cbi8vIGRhdGUgZnJvbSBpc28gZm9ybWF0IG9yIGZhbGxiYWNrXG5mdW5jdGlvbiBjb25maWdGcm9tU3RyaW5nKGNvbmZpZykge1xuICAgIHZhciBtYXRjaGVkID0gYXNwTmV0SnNvblJlZ2V4LmV4ZWMoY29uZmlnLl9pKTtcblxuICAgIGlmIChtYXRjaGVkICE9PSBudWxsKSB7XG4gICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKCttYXRjaGVkWzFdKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbmZpZ0Zyb21JU08oY29uZmlnKTtcbiAgICBpZiAoY29uZmlnLl9pc1ZhbGlkID09PSBmYWxzZSkge1xuICAgICAgICBkZWxldGUgY29uZmlnLl9pc1ZhbGlkO1xuICAgICAgICBob29rcy5jcmVhdGVGcm9tSW5wdXRGYWxsYmFjayhjb25maWcpO1xuICAgIH1cbn1cblxuaG9va3MuY3JlYXRlRnJvbUlucHV0RmFsbGJhY2sgPSBkZXByZWNhdGUoXG4gICAgJ3ZhbHVlIHByb3ZpZGVkIGlzIG5vdCBpbiBhIHJlY29nbml6ZWQgSVNPIGZvcm1hdC4gbW9tZW50IGNvbnN0cnVjdGlvbiBmYWxscyBiYWNrIHRvIGpzIERhdGUoKSwgJyArXG4gICAgJ3doaWNoIGlzIG5vdCByZWxpYWJsZSBhY3Jvc3MgYWxsIGJyb3dzZXJzIGFuZCB2ZXJzaW9ucy4gTm9uIElTTyBkYXRlIGZvcm1hdHMgYXJlICcgK1xuICAgICdkaXNjb3VyYWdlZCBhbmQgd2lsbCBiZSByZW1vdmVkIGluIGFuIHVwY29taW5nIG1ham9yIHJlbGVhc2UuIFBsZWFzZSByZWZlciB0byAnICtcbiAgICAnaHR0cDovL21vbWVudGpzLmNvbS9ndWlkZXMvIy93YXJuaW5ncy9qcy1kYXRlLyBmb3IgbW9yZSBpbmZvLicsXG4gICAgZnVuY3Rpb24gKGNvbmZpZykge1xuICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZShjb25maWcuX2kgKyAoY29uZmlnLl91c2VVVEMgPyAnIFVUQycgOiAnJykpO1xuICAgIH1cbik7XG5cbi8vIFBpY2sgdGhlIGZpcnN0IGRlZmluZWQgb2YgdHdvIG9yIHRocmVlIGFyZ3VtZW50cy5cbmZ1bmN0aW9uIGRlZmF1bHRzKGEsIGIsIGMpIHtcbiAgICBpZiAoYSAhPSBudWxsKSB7XG4gICAgICAgIHJldHVybiBhO1xuICAgIH1cbiAgICBpZiAoYiAhPSBudWxsKSB7XG4gICAgICAgIHJldHVybiBiO1xuICAgIH1cbiAgICByZXR1cm4gYztcbn1cblxuZnVuY3Rpb24gY3VycmVudERhdGVBcnJheShjb25maWcpIHtcbiAgICAvLyBob29rcyBpcyBhY3R1YWxseSB0aGUgZXhwb3J0ZWQgbW9tZW50IG9iamVjdFxuICAgIHZhciBub3dWYWx1ZSA9IG5ldyBEYXRlKGhvb2tzLm5vdygpKTtcbiAgICBpZiAoY29uZmlnLl91c2VVVEMpIHtcbiAgICAgICAgcmV0dXJuIFtub3dWYWx1ZS5nZXRVVENGdWxsWWVhcigpLCBub3dWYWx1ZS5nZXRVVENNb250aCgpLCBub3dWYWx1ZS5nZXRVVENEYXRlKCldO1xuICAgIH1cbiAgICByZXR1cm4gW25vd1ZhbHVlLmdldEZ1bGxZZWFyKCksIG5vd1ZhbHVlLmdldE1vbnRoKCksIG5vd1ZhbHVlLmdldERhdGUoKV07XG59XG5cbi8vIGNvbnZlcnQgYW4gYXJyYXkgdG8gYSBkYXRlLlxuLy8gdGhlIGFycmF5IHNob3VsZCBtaXJyb3IgdGhlIHBhcmFtZXRlcnMgYmVsb3dcbi8vIG5vdGU6IGFsbCB2YWx1ZXMgcGFzdCB0aGUgeWVhciBhcmUgb3B0aW9uYWwgYW5kIHdpbGwgZGVmYXVsdCB0byB0aGUgbG93ZXN0IHBvc3NpYmxlIHZhbHVlLlxuLy8gW3llYXIsIG1vbnRoLCBkYXkgLCBob3VyLCBtaW51dGUsIHNlY29uZCwgbWlsbGlzZWNvbmRdXG5mdW5jdGlvbiBjb25maWdGcm9tQXJyYXkgKGNvbmZpZykge1xuICAgIHZhciBpLCBkYXRlLCBpbnB1dCA9IFtdLCBjdXJyZW50RGF0ZSwgeWVhclRvVXNlO1xuXG4gICAgaWYgKGNvbmZpZy5fZCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY3VycmVudERhdGUgPSBjdXJyZW50RGF0ZUFycmF5KGNvbmZpZyk7XG5cbiAgICAvL2NvbXB1dGUgZGF5IG9mIHRoZSB5ZWFyIGZyb20gd2Vla3MgYW5kIHdlZWtkYXlzXG4gICAgaWYgKGNvbmZpZy5fdyAmJiBjb25maWcuX2FbREFURV0gPT0gbnVsbCAmJiBjb25maWcuX2FbTU9OVEhdID09IG51bGwpIHtcbiAgICAgICAgZGF5T2ZZZWFyRnJvbVdlZWtJbmZvKGNvbmZpZyk7XG4gICAgfVxuXG4gICAgLy9pZiB0aGUgZGF5IG9mIHRoZSB5ZWFyIGlzIHNldCwgZmlndXJlIG91dCB3aGF0IGl0IGlzXG4gICAgaWYgKGNvbmZpZy5fZGF5T2ZZZWFyKSB7XG4gICAgICAgIHllYXJUb1VzZSA9IGRlZmF1bHRzKGNvbmZpZy5fYVtZRUFSXSwgY3VycmVudERhdGVbWUVBUl0pO1xuXG4gICAgICAgIGlmIChjb25maWcuX2RheU9mWWVhciA+IGRheXNJblllYXIoeWVhclRvVXNlKSkge1xuICAgICAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykuX292ZXJmbG93RGF5T2ZZZWFyID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRhdGUgPSBjcmVhdGVVVENEYXRlKHllYXJUb1VzZSwgMCwgY29uZmlnLl9kYXlPZlllYXIpO1xuICAgICAgICBjb25maWcuX2FbTU9OVEhdID0gZGF0ZS5nZXRVVENNb250aCgpO1xuICAgICAgICBjb25maWcuX2FbREFURV0gPSBkYXRlLmdldFVUQ0RhdGUoKTtcbiAgICB9XG5cbiAgICAvLyBEZWZhdWx0IHRvIGN1cnJlbnQgZGF0ZS5cbiAgICAvLyAqIGlmIG5vIHllYXIsIG1vbnRoLCBkYXkgb2YgbW9udGggYXJlIGdpdmVuLCBkZWZhdWx0IHRvIHRvZGF5XG4gICAgLy8gKiBpZiBkYXkgb2YgbW9udGggaXMgZ2l2ZW4sIGRlZmF1bHQgbW9udGggYW5kIHllYXJcbiAgICAvLyAqIGlmIG1vbnRoIGlzIGdpdmVuLCBkZWZhdWx0IG9ubHkgeWVhclxuICAgIC8vICogaWYgeWVhciBpcyBnaXZlbiwgZG9uJ3QgZGVmYXVsdCBhbnl0aGluZ1xuICAgIGZvciAoaSA9IDA7IGkgPCAzICYmIGNvbmZpZy5fYVtpXSA9PSBudWxsOyArK2kpIHtcbiAgICAgICAgY29uZmlnLl9hW2ldID0gaW5wdXRbaV0gPSBjdXJyZW50RGF0ZVtpXTtcbiAgICB9XG5cbiAgICAvLyBaZXJvIG91dCB3aGF0ZXZlciB3YXMgbm90IGRlZmF1bHRlZCwgaW5jbHVkaW5nIHRpbWVcbiAgICBmb3IgKDsgaSA8IDc7IGkrKykge1xuICAgICAgICBjb25maWcuX2FbaV0gPSBpbnB1dFtpXSA9IChjb25maWcuX2FbaV0gPT0gbnVsbCkgPyAoaSA9PT0gMiA/IDEgOiAwKSA6IGNvbmZpZy5fYVtpXTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBmb3IgMjQ6MDA6MDAuMDAwXG4gICAgaWYgKGNvbmZpZy5fYVtIT1VSXSA9PT0gMjQgJiZcbiAgICAgICAgICAgIGNvbmZpZy5fYVtNSU5VVEVdID09PSAwICYmXG4gICAgICAgICAgICBjb25maWcuX2FbU0VDT05EXSA9PT0gMCAmJlxuICAgICAgICAgICAgY29uZmlnLl9hW01JTExJU0VDT05EXSA9PT0gMCkge1xuICAgICAgICBjb25maWcuX25leHREYXkgPSB0cnVlO1xuICAgICAgICBjb25maWcuX2FbSE9VUl0gPSAwO1xuICAgIH1cblxuICAgIGNvbmZpZy5fZCA9IChjb25maWcuX3VzZVVUQyA/IGNyZWF0ZVVUQ0RhdGUgOiBjcmVhdGVEYXRlKS5hcHBseShudWxsLCBpbnB1dCk7XG4gICAgLy8gQXBwbHkgdGltZXpvbmUgb2Zmc2V0IGZyb20gaW5wdXQuIFRoZSBhY3R1YWwgdXRjT2Zmc2V0IGNhbiBiZSBjaGFuZ2VkXG4gICAgLy8gd2l0aCBwYXJzZVpvbmUuXG4gICAgaWYgKGNvbmZpZy5fdHptICE9IG51bGwpIHtcbiAgICAgICAgY29uZmlnLl9kLnNldFVUQ01pbnV0ZXMoY29uZmlnLl9kLmdldFVUQ01pbnV0ZXMoKSAtIGNvbmZpZy5fdHptKTtcbiAgICB9XG5cbiAgICBpZiAoY29uZmlnLl9uZXh0RGF5KSB7XG4gICAgICAgIGNvbmZpZy5fYVtIT1VSXSA9IDI0O1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZGF5T2ZZZWFyRnJvbVdlZWtJbmZvKGNvbmZpZykge1xuICAgIHZhciB3LCB3ZWVrWWVhciwgd2Vlaywgd2Vla2RheSwgZG93LCBkb3ksIHRlbXAsIHdlZWtkYXlPdmVyZmxvdztcblxuICAgIHcgPSBjb25maWcuX3c7XG4gICAgaWYgKHcuR0cgIT0gbnVsbCB8fCB3LlcgIT0gbnVsbCB8fCB3LkUgIT0gbnVsbCkge1xuICAgICAgICBkb3cgPSAxO1xuICAgICAgICBkb3kgPSA0O1xuXG4gICAgICAgIC8vIFRPRE86IFdlIG5lZWQgdG8gdGFrZSB0aGUgY3VycmVudCBpc29XZWVrWWVhciwgYnV0IHRoYXQgZGVwZW5kcyBvblxuICAgICAgICAvLyBob3cgd2UgaW50ZXJwcmV0IG5vdyAobG9jYWwsIHV0YywgZml4ZWQgb2Zmc2V0KS4gU28gY3JlYXRlXG4gICAgICAgIC8vIGEgbm93IHZlcnNpb24gb2YgY3VycmVudCBjb25maWcgKHRha2UgbG9jYWwvdXRjL29mZnNldCBmbGFncywgYW5kXG4gICAgICAgIC8vIGNyZWF0ZSBub3cpLlxuICAgICAgICB3ZWVrWWVhciA9IGRlZmF1bHRzKHcuR0csIGNvbmZpZy5fYVtZRUFSXSwgd2Vla09mWWVhcihjcmVhdGVMb2NhbCgpLCAxLCA0KS55ZWFyKTtcbiAgICAgICAgd2VlayA9IGRlZmF1bHRzKHcuVywgMSk7XG4gICAgICAgIHdlZWtkYXkgPSBkZWZhdWx0cyh3LkUsIDEpO1xuICAgICAgICBpZiAod2Vla2RheSA8IDEgfHwgd2Vla2RheSA+IDcpIHtcbiAgICAgICAgICAgIHdlZWtkYXlPdmVyZmxvdyA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBkb3cgPSBjb25maWcuX2xvY2FsZS5fd2Vlay5kb3c7XG4gICAgICAgIGRveSA9IGNvbmZpZy5fbG9jYWxlLl93ZWVrLmRveTtcblxuICAgICAgICB2YXIgY3VyV2VlayA9IHdlZWtPZlllYXIoY3JlYXRlTG9jYWwoKSwgZG93LCBkb3kpO1xuXG4gICAgICAgIHdlZWtZZWFyID0gZGVmYXVsdHMody5nZywgY29uZmlnLl9hW1lFQVJdLCBjdXJXZWVrLnllYXIpO1xuXG4gICAgICAgIC8vIERlZmF1bHQgdG8gY3VycmVudCB3ZWVrLlxuICAgICAgICB3ZWVrID0gZGVmYXVsdHMody53LCBjdXJXZWVrLndlZWspO1xuXG4gICAgICAgIGlmICh3LmQgIT0gbnVsbCkge1xuICAgICAgICAgICAgLy8gd2Vla2RheSAtLSBsb3cgZGF5IG51bWJlcnMgYXJlIGNvbnNpZGVyZWQgbmV4dCB3ZWVrXG4gICAgICAgICAgICB3ZWVrZGF5ID0gdy5kO1xuICAgICAgICAgICAgaWYgKHdlZWtkYXkgPCAwIHx8IHdlZWtkYXkgPiA2KSB7XG4gICAgICAgICAgICAgICAgd2Vla2RheU92ZXJmbG93ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh3LmUgIT0gbnVsbCkge1xuICAgICAgICAgICAgLy8gbG9jYWwgd2Vla2RheSAtLSBjb3VudGluZyBzdGFydHMgZnJvbSBiZWdpbmluZyBvZiB3ZWVrXG4gICAgICAgICAgICB3ZWVrZGF5ID0gdy5lICsgZG93O1xuICAgICAgICAgICAgaWYgKHcuZSA8IDAgfHwgdy5lID4gNikge1xuICAgICAgICAgICAgICAgIHdlZWtkYXlPdmVyZmxvdyA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBkZWZhdWx0IHRvIGJlZ2luaW5nIG9mIHdlZWtcbiAgICAgICAgICAgIHdlZWtkYXkgPSBkb3c7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKHdlZWsgPCAxIHx8IHdlZWsgPiB3ZWVrc0luWWVhcih3ZWVrWWVhciwgZG93LCBkb3kpKSB7XG4gICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLl9vdmVyZmxvd1dlZWtzID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKHdlZWtkYXlPdmVyZmxvdyAhPSBudWxsKSB7XG4gICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLl9vdmVyZmxvd1dlZWtkYXkgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRlbXAgPSBkYXlPZlllYXJGcm9tV2Vla3Mod2Vla1llYXIsIHdlZWssIHdlZWtkYXksIGRvdywgZG95KTtcbiAgICAgICAgY29uZmlnLl9hW1lFQVJdID0gdGVtcC55ZWFyO1xuICAgICAgICBjb25maWcuX2RheU9mWWVhciA9IHRlbXAuZGF5T2ZZZWFyO1xuICAgIH1cbn1cblxuLy8gY29uc3RhbnQgdGhhdCByZWZlcnMgdG8gdGhlIElTTyBzdGFuZGFyZFxuaG9va3MuSVNPXzg2MDEgPSBmdW5jdGlvbiAoKSB7fTtcblxuLy8gZGF0ZSBmcm9tIHN0cmluZyBhbmQgZm9ybWF0IHN0cmluZ1xuZnVuY3Rpb24gY29uZmlnRnJvbVN0cmluZ0FuZEZvcm1hdChjb25maWcpIHtcbiAgICAvLyBUT0RPOiBNb3ZlIHRoaXMgdG8gYW5vdGhlciBwYXJ0IG9mIHRoZSBjcmVhdGlvbiBmbG93IHRvIHByZXZlbnQgY2lyY3VsYXIgZGVwc1xuICAgIGlmIChjb25maWcuX2YgPT09IGhvb2tzLklTT184NjAxKSB7XG4gICAgICAgIGNvbmZpZ0Zyb21JU08oY29uZmlnKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbmZpZy5fYSA9IFtdO1xuICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLmVtcHR5ID0gdHJ1ZTtcblxuICAgIC8vIFRoaXMgYXJyYXkgaXMgdXNlZCB0byBtYWtlIGEgRGF0ZSwgZWl0aGVyIHdpdGggYG5ldyBEYXRlYCBvciBgRGF0ZS5VVENgXG4gICAgdmFyIHN0cmluZyA9ICcnICsgY29uZmlnLl9pLFxuICAgICAgICBpLCBwYXJzZWRJbnB1dCwgdG9rZW5zLCB0b2tlbiwgc2tpcHBlZCxcbiAgICAgICAgc3RyaW5nTGVuZ3RoID0gc3RyaW5nLmxlbmd0aCxcbiAgICAgICAgdG90YWxQYXJzZWRJbnB1dExlbmd0aCA9IDA7XG5cbiAgICB0b2tlbnMgPSBleHBhbmRGb3JtYXQoY29uZmlnLl9mLCBjb25maWcuX2xvY2FsZSkubWF0Y2goZm9ybWF0dGluZ1Rva2VucykgfHwgW107XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgdG9rZW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRva2VuID0gdG9rZW5zW2ldO1xuICAgICAgICBwYXJzZWRJbnB1dCA9IChzdHJpbmcubWF0Y2goZ2V0UGFyc2VSZWdleEZvclRva2VuKHRva2VuLCBjb25maWcpKSB8fCBbXSlbMF07XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCd0b2tlbicsIHRva2VuLCAncGFyc2VkSW5wdXQnLCBwYXJzZWRJbnB1dCxcbiAgICAgICAgLy8gICAgICAgICAncmVnZXgnLCBnZXRQYXJzZVJlZ2V4Rm9yVG9rZW4odG9rZW4sIGNvbmZpZykpO1xuICAgICAgICBpZiAocGFyc2VkSW5wdXQpIHtcbiAgICAgICAgICAgIHNraXBwZWQgPSBzdHJpbmcuc3Vic3RyKDAsIHN0cmluZy5pbmRleE9mKHBhcnNlZElucHV0KSk7XG4gICAgICAgICAgICBpZiAoc2tpcHBlZC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykudW51c2VkSW5wdXQucHVzaChza2lwcGVkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0cmluZyA9IHN0cmluZy5zbGljZShzdHJpbmcuaW5kZXhPZihwYXJzZWRJbnB1dCkgKyBwYXJzZWRJbnB1dC5sZW5ndGgpO1xuICAgICAgICAgICAgdG90YWxQYXJzZWRJbnB1dExlbmd0aCArPSBwYXJzZWRJbnB1dC5sZW5ndGg7XG4gICAgICAgIH1cbiAgICAgICAgLy8gZG9uJ3QgcGFyc2UgaWYgaXQncyBub3QgYSBrbm93biB0b2tlblxuICAgICAgICBpZiAoZm9ybWF0VG9rZW5GdW5jdGlvbnNbdG9rZW5dKSB7XG4gICAgICAgICAgICBpZiAocGFyc2VkSW5wdXQpIHtcbiAgICAgICAgICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5lbXB0eSA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykudW51c2VkVG9rZW5zLnB1c2godG9rZW4pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYWRkVGltZVRvQXJyYXlGcm9tVG9rZW4odG9rZW4sIHBhcnNlZElucHV0LCBjb25maWcpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGNvbmZpZy5fc3RyaWN0ICYmICFwYXJzZWRJbnB1dCkge1xuICAgICAgICAgICAgZ2V0UGFyc2luZ0ZsYWdzKGNvbmZpZykudW51c2VkVG9rZW5zLnB1c2godG9rZW4pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gYWRkIHJlbWFpbmluZyB1bnBhcnNlZCBpbnB1dCBsZW5ndGggdG8gdGhlIHN0cmluZ1xuICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLmNoYXJzTGVmdE92ZXIgPSBzdHJpbmdMZW5ndGggLSB0b3RhbFBhcnNlZElucHV0TGVuZ3RoO1xuICAgIGlmIChzdHJpbmcubGVuZ3RoID4gMCkge1xuICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS51bnVzZWRJbnB1dC5wdXNoKHN0cmluZyk7XG4gICAgfVxuXG4gICAgLy8gY2xlYXIgXzEyaCBmbGFnIGlmIGhvdXIgaXMgPD0gMTJcbiAgICBpZiAoY29uZmlnLl9hW0hPVVJdIDw9IDEyICYmXG4gICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLmJpZ0hvdXIgPT09IHRydWUgJiZcbiAgICAgICAgY29uZmlnLl9hW0hPVVJdID4gMCkge1xuICAgICAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5iaWdIb3VyID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLnBhcnNlZERhdGVQYXJ0cyA9IGNvbmZpZy5fYS5zbGljZSgwKTtcbiAgICBnZXRQYXJzaW5nRmxhZ3MoY29uZmlnKS5tZXJpZGllbSA9IGNvbmZpZy5fbWVyaWRpZW07XG4gICAgLy8gaGFuZGxlIG1lcmlkaWVtXG4gICAgY29uZmlnLl9hW0hPVVJdID0gbWVyaWRpZW1GaXhXcmFwKGNvbmZpZy5fbG9jYWxlLCBjb25maWcuX2FbSE9VUl0sIGNvbmZpZy5fbWVyaWRpZW0pO1xuXG4gICAgY29uZmlnRnJvbUFycmF5KGNvbmZpZyk7XG4gICAgY2hlY2tPdmVyZmxvdyhjb25maWcpO1xufVxuXG5cbmZ1bmN0aW9uIG1lcmlkaWVtRml4V3JhcCAobG9jYWxlLCBob3VyLCBtZXJpZGllbSkge1xuICAgIHZhciBpc1BtO1xuXG4gICAgaWYgKG1lcmlkaWVtID09IG51bGwpIHtcbiAgICAgICAgLy8gbm90aGluZyB0byBkb1xuICAgICAgICByZXR1cm4gaG91cjtcbiAgICB9XG4gICAgaWYgKGxvY2FsZS5tZXJpZGllbUhvdXIgIT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gbG9jYWxlLm1lcmlkaWVtSG91cihob3VyLCBtZXJpZGllbSk7XG4gICAgfSBlbHNlIGlmIChsb2NhbGUuaXNQTSAhPSBudWxsKSB7XG4gICAgICAgIC8vIEZhbGxiYWNrXG4gICAgICAgIGlzUG0gPSBsb2NhbGUuaXNQTShtZXJpZGllbSk7XG4gICAgICAgIGlmIChpc1BtICYmIGhvdXIgPCAxMikge1xuICAgICAgICAgICAgaG91ciArPSAxMjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlzUG0gJiYgaG91ciA9PT0gMTIpIHtcbiAgICAgICAgICAgIGhvdXIgPSAwO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBob3VyO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIHRoaXMgaXMgbm90IHN1cHBvc2VkIHRvIGhhcHBlblxuICAgICAgICByZXR1cm4gaG91cjtcbiAgICB9XG59XG5cbi8vIGRhdGUgZnJvbSBzdHJpbmcgYW5kIGFycmF5IG9mIGZvcm1hdCBzdHJpbmdzXG5mdW5jdGlvbiBjb25maWdGcm9tU3RyaW5nQW5kQXJyYXkoY29uZmlnKSB7XG4gICAgdmFyIHRlbXBDb25maWcsXG4gICAgICAgIGJlc3RNb21lbnQsXG5cbiAgICAgICAgc2NvcmVUb0JlYXQsXG4gICAgICAgIGksXG4gICAgICAgIGN1cnJlbnRTY29yZTtcblxuICAgIGlmIChjb25maWcuX2YubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGdldFBhcnNpbmdGbGFncyhjb25maWcpLmludmFsaWRGb3JtYXQgPSB0cnVlO1xuICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZShOYU4pO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZm9yIChpID0gMDsgaSA8IGNvbmZpZy5fZi5sZW5ndGg7IGkrKykge1xuICAgICAgICBjdXJyZW50U2NvcmUgPSAwO1xuICAgICAgICB0ZW1wQ29uZmlnID0gY29weUNvbmZpZyh7fSwgY29uZmlnKTtcbiAgICAgICAgaWYgKGNvbmZpZy5fdXNlVVRDICE9IG51bGwpIHtcbiAgICAgICAgICAgIHRlbXBDb25maWcuX3VzZVVUQyA9IGNvbmZpZy5fdXNlVVRDO1xuICAgICAgICB9XG4gICAgICAgIHRlbXBDb25maWcuX2YgPSBjb25maWcuX2ZbaV07XG4gICAgICAgIGNvbmZpZ0Zyb21TdHJpbmdBbmRGb3JtYXQodGVtcENvbmZpZyk7XG5cbiAgICAgICAgaWYgKCFpc1ZhbGlkKHRlbXBDb25maWcpKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIHRoZXJlIGlzIGFueSBpbnB1dCB0aGF0IHdhcyBub3QgcGFyc2VkIGFkZCBhIHBlbmFsdHkgZm9yIHRoYXQgZm9ybWF0XG4gICAgICAgIGN1cnJlbnRTY29yZSArPSBnZXRQYXJzaW5nRmxhZ3ModGVtcENvbmZpZykuY2hhcnNMZWZ0T3ZlcjtcblxuICAgICAgICAvL29yIHRva2Vuc1xuICAgICAgICBjdXJyZW50U2NvcmUgKz0gZ2V0UGFyc2luZ0ZsYWdzKHRlbXBDb25maWcpLnVudXNlZFRva2Vucy5sZW5ndGggKiAxMDtcblxuICAgICAgICBnZXRQYXJzaW5nRmxhZ3ModGVtcENvbmZpZykuc2NvcmUgPSBjdXJyZW50U2NvcmU7XG5cbiAgICAgICAgaWYgKHNjb3JlVG9CZWF0ID09IG51bGwgfHwgY3VycmVudFNjb3JlIDwgc2NvcmVUb0JlYXQpIHtcbiAgICAgICAgICAgIHNjb3JlVG9CZWF0ID0gY3VycmVudFNjb3JlO1xuICAgICAgICAgICAgYmVzdE1vbWVudCA9IHRlbXBDb25maWc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBleHRlbmQoY29uZmlnLCBiZXN0TW9tZW50IHx8IHRlbXBDb25maWcpO1xufVxuXG5mdW5jdGlvbiBjb25maWdGcm9tT2JqZWN0KGNvbmZpZykge1xuICAgIGlmIChjb25maWcuX2QpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBpID0gbm9ybWFsaXplT2JqZWN0VW5pdHMoY29uZmlnLl9pKTtcbiAgICBjb25maWcuX2EgPSBtYXAoW2kueWVhciwgaS5tb250aCwgaS5kYXkgfHwgaS5kYXRlLCBpLmhvdXIsIGkubWludXRlLCBpLnNlY29uZCwgaS5taWxsaXNlY29uZF0sIGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgcmV0dXJuIG9iaiAmJiBwYXJzZUludChvYmosIDEwKTtcbiAgICB9KTtcblxuICAgIGNvbmZpZ0Zyb21BcnJheShjb25maWcpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVGcm9tQ29uZmlnIChjb25maWcpIHtcbiAgICB2YXIgcmVzID0gbmV3IE1vbWVudChjaGVja092ZXJmbG93KHByZXBhcmVDb25maWcoY29uZmlnKSkpO1xuICAgIGlmIChyZXMuX25leHREYXkpIHtcbiAgICAgICAgLy8gQWRkaW5nIGlzIHNtYXJ0IGVub3VnaCBhcm91bmQgRFNUXG4gICAgICAgIHJlcy5hZGQoMSwgJ2QnKTtcbiAgICAgICAgcmVzLl9uZXh0RGF5ID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHJldHVybiByZXM7XG59XG5cbmZ1bmN0aW9uIHByZXBhcmVDb25maWcgKGNvbmZpZykge1xuICAgIHZhciBpbnB1dCA9IGNvbmZpZy5faSxcbiAgICAgICAgZm9ybWF0ID0gY29uZmlnLl9mO1xuXG4gICAgY29uZmlnLl9sb2NhbGUgPSBjb25maWcuX2xvY2FsZSB8fCBnZXRMb2NhbGUoY29uZmlnLl9sKTtcblxuICAgIGlmIChpbnB1dCA9PT0gbnVsbCB8fCAoZm9ybWF0ID09PSB1bmRlZmluZWQgJiYgaW5wdXQgPT09ICcnKSkge1xuICAgICAgICByZXR1cm4gY3JlYXRlSW52YWxpZCh7bnVsbElucHV0OiB0cnVlfSk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgY29uZmlnLl9pID0gaW5wdXQgPSBjb25maWcuX2xvY2FsZS5wcmVwYXJzZShpbnB1dCk7XG4gICAgfVxuXG4gICAgaWYgKGlzTW9tZW50KGlucHV0KSkge1xuICAgICAgICByZXR1cm4gbmV3IE1vbWVudChjaGVja092ZXJmbG93KGlucHV0KSk7XG4gICAgfSBlbHNlIGlmIChpc0RhdGUoaW5wdXQpKSB7XG4gICAgICAgIGNvbmZpZy5fZCA9IGlucHV0O1xuICAgIH0gZWxzZSBpZiAoaXNBcnJheShmb3JtYXQpKSB7XG4gICAgICAgIGNvbmZpZ0Zyb21TdHJpbmdBbmRBcnJheShjb25maWcpO1xuICAgIH0gZWxzZSBpZiAoZm9ybWF0KSB7XG4gICAgICAgIGNvbmZpZ0Zyb21TdHJpbmdBbmRGb3JtYXQoY29uZmlnKTtcbiAgICB9ICBlbHNlIHtcbiAgICAgICAgY29uZmlnRnJvbUlucHV0KGNvbmZpZyk7XG4gICAgfVxuXG4gICAgaWYgKCFpc1ZhbGlkKGNvbmZpZykpIHtcbiAgICAgICAgY29uZmlnLl9kID0gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gY29uZmlnO1xufVxuXG5mdW5jdGlvbiBjb25maWdGcm9tSW5wdXQoY29uZmlnKSB7XG4gICAgdmFyIGlucHV0ID0gY29uZmlnLl9pO1xuICAgIGlmIChpbnB1dCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKGhvb2tzLm5vdygpKTtcbiAgICB9IGVsc2UgaWYgKGlzRGF0ZShpbnB1dCkpIHtcbiAgICAgICAgY29uZmlnLl9kID0gbmV3IERhdGUoaW5wdXQudmFsdWVPZigpKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgY29uZmlnRnJvbVN0cmluZyhjb25maWcpO1xuICAgIH0gZWxzZSBpZiAoaXNBcnJheShpbnB1dCkpIHtcbiAgICAgICAgY29uZmlnLl9hID0gbWFwKGlucHV0LnNsaWNlKDApLCBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gcGFyc2VJbnQob2JqLCAxMCk7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25maWdGcm9tQXJyYXkoY29uZmlnKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZihpbnB1dCkgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIGNvbmZpZ0Zyb21PYmplY3QoY29uZmlnKTtcbiAgICB9IGVsc2UgaWYgKGlzTnVtYmVyKGlucHV0KSkge1xuICAgICAgICAvLyBmcm9tIG1pbGxpc2Vjb25kc1xuICAgICAgICBjb25maWcuX2QgPSBuZXcgRGF0ZShpbnB1dCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaG9va3MuY3JlYXRlRnJvbUlucHV0RmFsbGJhY2soY29uZmlnKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUxvY2FsT3JVVEMgKGlucHV0LCBmb3JtYXQsIGxvY2FsZSwgc3RyaWN0LCBpc1VUQykge1xuICAgIHZhciBjID0ge307XG5cbiAgICBpZiAobG9jYWxlID09PSB0cnVlIHx8IGxvY2FsZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgc3RyaWN0ID0gbG9jYWxlO1xuICAgICAgICBsb2NhbGUgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgaWYgKChpc09iamVjdChpbnB1dCkgJiYgaXNPYmplY3RFbXB0eShpbnB1dCkpIHx8XG4gICAgICAgICAgICAoaXNBcnJheShpbnB1dCkgJiYgaW5wdXQubGVuZ3RoID09PSAwKSkge1xuICAgICAgICBpbnB1dCA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgLy8gb2JqZWN0IGNvbnN0cnVjdGlvbiBtdXN0IGJlIGRvbmUgdGhpcyB3YXkuXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL21vbWVudC9tb21lbnQvaXNzdWVzLzE0MjNcbiAgICBjLl9pc0FNb21lbnRPYmplY3QgPSB0cnVlO1xuICAgIGMuX3VzZVVUQyA9IGMuX2lzVVRDID0gaXNVVEM7XG4gICAgYy5fbCA9IGxvY2FsZTtcbiAgICBjLl9pID0gaW5wdXQ7XG4gICAgYy5fZiA9IGZvcm1hdDtcbiAgICBjLl9zdHJpY3QgPSBzdHJpY3Q7XG5cbiAgICByZXR1cm4gY3JlYXRlRnJvbUNvbmZpZyhjKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlTG9jYWwgKGlucHV0LCBmb3JtYXQsIGxvY2FsZSwgc3RyaWN0KSB7XG4gICAgcmV0dXJuIGNyZWF0ZUxvY2FsT3JVVEMoaW5wdXQsIGZvcm1hdCwgbG9jYWxlLCBzdHJpY3QsIGZhbHNlKTtcbn1cblxudmFyIHByb3RvdHlwZU1pbiA9IGRlcHJlY2F0ZShcbiAgICAnbW9tZW50KCkubWluIGlzIGRlcHJlY2F0ZWQsIHVzZSBtb21lbnQubWF4IGluc3RlYWQuIGh0dHA6Ly9tb21lbnRqcy5jb20vZ3VpZGVzLyMvd2FybmluZ3MvbWluLW1heC8nLFxuICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG90aGVyID0gY3JlYXRlTG9jYWwuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICAgICAgaWYgKHRoaXMuaXNWYWxpZCgpICYmIG90aGVyLmlzVmFsaWQoKSkge1xuICAgICAgICAgICAgcmV0dXJuIG90aGVyIDwgdGhpcyA/IHRoaXMgOiBvdGhlcjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBjcmVhdGVJbnZhbGlkKCk7XG4gICAgICAgIH1cbiAgICB9XG4pO1xuXG52YXIgcHJvdG90eXBlTWF4ID0gZGVwcmVjYXRlKFxuICAgICdtb21lbnQoKS5tYXggaXMgZGVwcmVjYXRlZCwgdXNlIG1vbWVudC5taW4gaW5zdGVhZC4gaHR0cDovL21vbWVudGpzLmNvbS9ndWlkZXMvIy93YXJuaW5ncy9taW4tbWF4LycsXG4gICAgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3RoZXIgPSBjcmVhdGVMb2NhbC5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgICAgICBpZiAodGhpcy5pc1ZhbGlkKCkgJiYgb3RoZXIuaXNWYWxpZCgpKSB7XG4gICAgICAgICAgICByZXR1cm4gb3RoZXIgPiB0aGlzID8gdGhpcyA6IG90aGVyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGNyZWF0ZUludmFsaWQoKTtcbiAgICAgICAgfVxuICAgIH1cbik7XG5cbi8vIFBpY2sgYSBtb21lbnQgbSBmcm9tIG1vbWVudHMgc28gdGhhdCBtW2ZuXShvdGhlcikgaXMgdHJ1ZSBmb3IgYWxsXG4vLyBvdGhlci4gVGhpcyByZWxpZXMgb24gdGhlIGZ1bmN0aW9uIGZuIHRvIGJlIHRyYW5zaXRpdmUuXG4vL1xuLy8gbW9tZW50cyBzaG91bGQgZWl0aGVyIGJlIGFuIGFycmF5IG9mIG1vbWVudCBvYmplY3RzIG9yIGFuIGFycmF5LCB3aG9zZVxuLy8gZmlyc3QgZWxlbWVudCBpcyBhbiBhcnJheSBvZiBtb21lbnQgb2JqZWN0cy5cbmZ1bmN0aW9uIHBpY2tCeShmbiwgbW9tZW50cykge1xuICAgIHZhciByZXMsIGk7XG4gICAgaWYgKG1vbWVudHMubGVuZ3RoID09PSAxICYmIGlzQXJyYXkobW9tZW50c1swXSkpIHtcbiAgICAgICAgbW9tZW50cyA9IG1vbWVudHNbMF07XG4gICAgfVxuICAgIGlmICghbW9tZW50cy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUxvY2FsKCk7XG4gICAgfVxuICAgIHJlcyA9IG1vbWVudHNbMF07XG4gICAgZm9yIChpID0gMTsgaSA8IG1vbWVudHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgaWYgKCFtb21lbnRzW2ldLmlzVmFsaWQoKSB8fCBtb21lbnRzW2ldW2ZuXShyZXMpKSB7XG4gICAgICAgICAgICByZXMgPSBtb21lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXM7XG59XG5cbi8vIFRPRE86IFVzZSBbXS5zb3J0IGluc3RlYWQ/XG5mdW5jdGlvbiBtaW4gKCkge1xuICAgIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xuXG4gICAgcmV0dXJuIHBpY2tCeSgnaXNCZWZvcmUnLCBhcmdzKTtcbn1cblxuZnVuY3Rpb24gbWF4ICgpIHtcbiAgICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcblxuICAgIHJldHVybiBwaWNrQnkoJ2lzQWZ0ZXInLCBhcmdzKTtcbn1cblxudmFyIG5vdyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gRGF0ZS5ub3cgPyBEYXRlLm5vdygpIDogKyhuZXcgRGF0ZSgpKTtcbn07XG5cbmZ1bmN0aW9uIER1cmF0aW9uIChkdXJhdGlvbikge1xuICAgIHZhciBub3JtYWxpemVkSW5wdXQgPSBub3JtYWxpemVPYmplY3RVbml0cyhkdXJhdGlvbiksXG4gICAgICAgIHllYXJzID0gbm9ybWFsaXplZElucHV0LnllYXIgfHwgMCxcbiAgICAgICAgcXVhcnRlcnMgPSBub3JtYWxpemVkSW5wdXQucXVhcnRlciB8fCAwLFxuICAgICAgICBtb250aHMgPSBub3JtYWxpemVkSW5wdXQubW9udGggfHwgMCxcbiAgICAgICAgd2Vla3MgPSBub3JtYWxpemVkSW5wdXQud2VlayB8fCAwLFxuICAgICAgICBkYXlzID0gbm9ybWFsaXplZElucHV0LmRheSB8fCAwLFxuICAgICAgICBob3VycyA9IG5vcm1hbGl6ZWRJbnB1dC5ob3VyIHx8IDAsXG4gICAgICAgIG1pbnV0ZXMgPSBub3JtYWxpemVkSW5wdXQubWludXRlIHx8IDAsXG4gICAgICAgIHNlY29uZHMgPSBub3JtYWxpemVkSW5wdXQuc2Vjb25kIHx8IDAsXG4gICAgICAgIG1pbGxpc2Vjb25kcyA9IG5vcm1hbGl6ZWRJbnB1dC5taWxsaXNlY29uZCB8fCAwO1xuXG4gICAgLy8gcmVwcmVzZW50YXRpb24gZm9yIGRhdGVBZGRSZW1vdmVcbiAgICB0aGlzLl9taWxsaXNlY29uZHMgPSArbWlsbGlzZWNvbmRzICtcbiAgICAgICAgc2Vjb25kcyAqIDFlMyArIC8vIDEwMDBcbiAgICAgICAgbWludXRlcyAqIDZlNCArIC8vIDEwMDAgKiA2MFxuICAgICAgICBob3VycyAqIDEwMDAgKiA2MCAqIDYwOyAvL3VzaW5nIDEwMDAgKiA2MCAqIDYwIGluc3RlYWQgb2YgMzZlNSB0byBhdm9pZCBmbG9hdGluZyBwb2ludCByb3VuZGluZyBlcnJvcnMgaHR0cHM6Ly9naXRodWIuY29tL21vbWVudC9tb21lbnQvaXNzdWVzLzI5NzhcbiAgICAvLyBCZWNhdXNlIG9mIGRhdGVBZGRSZW1vdmUgdHJlYXRzIDI0IGhvdXJzIGFzIGRpZmZlcmVudCBmcm9tIGFcbiAgICAvLyBkYXkgd2hlbiB3b3JraW5nIGFyb3VuZCBEU1QsIHdlIG5lZWQgdG8gc3RvcmUgdGhlbSBzZXBhcmF0ZWx5XG4gICAgdGhpcy5fZGF5cyA9ICtkYXlzICtcbiAgICAgICAgd2Vla3MgKiA3O1xuICAgIC8vIEl0IGlzIGltcG9zc2libGUgdHJhbnNsYXRlIG1vbnRocyBpbnRvIGRheXMgd2l0aG91dCBrbm93aW5nXG4gICAgLy8gd2hpY2ggbW9udGhzIHlvdSBhcmUgYXJlIHRhbGtpbmcgYWJvdXQsIHNvIHdlIGhhdmUgdG8gc3RvcmVcbiAgICAvLyBpdCBzZXBhcmF0ZWx5LlxuICAgIHRoaXMuX21vbnRocyA9ICttb250aHMgK1xuICAgICAgICBxdWFydGVycyAqIDMgK1xuICAgICAgICB5ZWFycyAqIDEyO1xuXG4gICAgdGhpcy5fZGF0YSA9IHt9O1xuXG4gICAgdGhpcy5fbG9jYWxlID0gZ2V0TG9jYWxlKCk7XG5cbiAgICB0aGlzLl9idWJibGUoKTtcbn1cblxuZnVuY3Rpb24gaXNEdXJhdGlvbiAob2JqKSB7XG4gICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIER1cmF0aW9uO1xufVxuXG5mdW5jdGlvbiBhYnNSb3VuZCAobnVtYmVyKSB7XG4gICAgaWYgKG51bWJlciA8IDApIHtcbiAgICAgICAgcmV0dXJuIE1hdGgucm91bmQoLTEgKiBudW1iZXIpICogLTE7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIE1hdGgucm91bmQobnVtYmVyKTtcbiAgICB9XG59XG5cbi8vIEZPUk1BVFRJTkdcblxuZnVuY3Rpb24gb2Zmc2V0ICh0b2tlbiwgc2VwYXJhdG9yKSB7XG4gICAgYWRkRm9ybWF0VG9rZW4odG9rZW4sIDAsIDAsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG9mZnNldCA9IHRoaXMudXRjT2Zmc2V0KCk7XG4gICAgICAgIHZhciBzaWduID0gJysnO1xuICAgICAgICBpZiAob2Zmc2V0IDwgMCkge1xuICAgICAgICAgICAgb2Zmc2V0ID0gLW9mZnNldDtcbiAgICAgICAgICAgIHNpZ24gPSAnLSc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNpZ24gKyB6ZXJvRmlsbCh+fihvZmZzZXQgLyA2MCksIDIpICsgc2VwYXJhdG9yICsgemVyb0ZpbGwofn4ob2Zmc2V0KSAlIDYwLCAyKTtcbiAgICB9KTtcbn1cblxub2Zmc2V0KCdaJywgJzonKTtcbm9mZnNldCgnWlonLCAnJyk7XG5cbi8vIFBBUlNJTkdcblxuYWRkUmVnZXhUb2tlbignWicsICBtYXRjaFNob3J0T2Zmc2V0KTtcbmFkZFJlZ2V4VG9rZW4oJ1paJywgbWF0Y2hTaG9ydE9mZnNldCk7XG5hZGRQYXJzZVRva2VuKFsnWicsICdaWiddLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5LCBjb25maWcpIHtcbiAgICBjb25maWcuX3VzZVVUQyA9IHRydWU7XG4gICAgY29uZmlnLl90em0gPSBvZmZzZXRGcm9tU3RyaW5nKG1hdGNoU2hvcnRPZmZzZXQsIGlucHV0KTtcbn0pO1xuXG4vLyBIRUxQRVJTXG5cbi8vIHRpbWV6b25lIGNodW5rZXJcbi8vICcrMTA6MDAnID4gWycxMCcsICAnMDAnXVxuLy8gJy0xNTMwJyAgPiBbJy0xNScsICczMCddXG52YXIgY2h1bmtPZmZzZXQgPSAvKFtcXCtcXC1dfFxcZFxcZCkvZ2k7XG5cbmZ1bmN0aW9uIG9mZnNldEZyb21TdHJpbmcobWF0Y2hlciwgc3RyaW5nKSB7XG4gICAgdmFyIG1hdGNoZXMgPSAoc3RyaW5nIHx8ICcnKS5tYXRjaChtYXRjaGVyKTtcblxuICAgIGlmIChtYXRjaGVzID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHZhciBjaHVuayAgID0gbWF0Y2hlc1ttYXRjaGVzLmxlbmd0aCAtIDFdIHx8IFtdO1xuICAgIHZhciBwYXJ0cyAgID0gKGNodW5rICsgJycpLm1hdGNoKGNodW5rT2Zmc2V0KSB8fCBbJy0nLCAwLCAwXTtcbiAgICB2YXIgbWludXRlcyA9ICsocGFydHNbMV0gKiA2MCkgKyB0b0ludChwYXJ0c1syXSk7XG5cbiAgICByZXR1cm4gbWludXRlcyA9PT0gMCA/XG4gICAgICAwIDpcbiAgICAgIHBhcnRzWzBdID09PSAnKycgPyBtaW51dGVzIDogLW1pbnV0ZXM7XG59XG5cbi8vIFJldHVybiBhIG1vbWVudCBmcm9tIGlucHV0LCB0aGF0IGlzIGxvY2FsL3V0Yy96b25lIGVxdWl2YWxlbnQgdG8gbW9kZWwuXG5mdW5jdGlvbiBjbG9uZVdpdGhPZmZzZXQoaW5wdXQsIG1vZGVsKSB7XG4gICAgdmFyIHJlcywgZGlmZjtcbiAgICBpZiAobW9kZWwuX2lzVVRDKSB7XG4gICAgICAgIHJlcyA9IG1vZGVsLmNsb25lKCk7XG4gICAgICAgIGRpZmYgPSAoaXNNb21lbnQoaW5wdXQpIHx8IGlzRGF0ZShpbnB1dCkgPyBpbnB1dC52YWx1ZU9mKCkgOiBjcmVhdGVMb2NhbChpbnB1dCkudmFsdWVPZigpKSAtIHJlcy52YWx1ZU9mKCk7XG4gICAgICAgIC8vIFVzZSBsb3ctbGV2ZWwgYXBpLCBiZWNhdXNlIHRoaXMgZm4gaXMgbG93LWxldmVsIGFwaS5cbiAgICAgICAgcmVzLl9kLnNldFRpbWUocmVzLl9kLnZhbHVlT2YoKSArIGRpZmYpO1xuICAgICAgICBob29rcy51cGRhdGVPZmZzZXQocmVzLCBmYWxzZSk7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUxvY2FsKGlucHV0KS5sb2NhbCgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0RGF0ZU9mZnNldCAobSkge1xuICAgIC8vIE9uIEZpcmVmb3guMjQgRGF0ZSNnZXRUaW1lem9uZU9mZnNldCByZXR1cm5zIGEgZmxvYXRpbmcgcG9pbnQuXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL21vbWVudC9tb21lbnQvcHVsbC8xODcxXG4gICAgcmV0dXJuIC1NYXRoLnJvdW5kKG0uX2QuZ2V0VGltZXpvbmVPZmZzZXQoKSAvIDE1KSAqIDE1O1xufVxuXG4vLyBIT09LU1xuXG4vLyBUaGlzIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIHdoZW5ldmVyIGEgbW9tZW50IGlzIG11dGF0ZWQuXG4vLyBJdCBpcyBpbnRlbmRlZCB0byBrZWVwIHRoZSBvZmZzZXQgaW4gc3luYyB3aXRoIHRoZSB0aW1lem9uZS5cbmhvb2tzLnVwZGF0ZU9mZnNldCA9IGZ1bmN0aW9uICgpIHt9O1xuXG4vLyBNT01FTlRTXG5cbi8vIGtlZXBMb2NhbFRpbWUgPSB0cnVlIG1lYW5zIG9ubHkgY2hhbmdlIHRoZSB0aW1lem9uZSwgd2l0aG91dFxuLy8gYWZmZWN0aW5nIHRoZSBsb2NhbCBob3VyLiBTbyA1OjMxOjI2ICswMzAwIC0tW3V0Y09mZnNldCgyLCB0cnVlKV0tLT5cbi8vIDU6MzE6MjYgKzAyMDAgSXQgaXMgcG9zc2libGUgdGhhdCA1OjMxOjI2IGRvZXNuJ3QgZXhpc3Qgd2l0aCBvZmZzZXRcbi8vICswMjAwLCBzbyB3ZSBhZGp1c3QgdGhlIHRpbWUgYXMgbmVlZGVkLCB0byBiZSB2YWxpZC5cbi8vXG4vLyBLZWVwaW5nIHRoZSB0aW1lIGFjdHVhbGx5IGFkZHMvc3VidHJhY3RzIChvbmUgaG91cilcbi8vIGZyb20gdGhlIGFjdHVhbCByZXByZXNlbnRlZCB0aW1lLiBUaGF0IGlzIHdoeSB3ZSBjYWxsIHVwZGF0ZU9mZnNldFxuLy8gYSBzZWNvbmQgdGltZS4gSW4gY2FzZSBpdCB3YW50cyB1cyB0byBjaGFuZ2UgdGhlIG9mZnNldCBhZ2FpblxuLy8gX2NoYW5nZUluUHJvZ3Jlc3MgPT0gdHJ1ZSBjYXNlLCB0aGVuIHdlIGhhdmUgdG8gYWRqdXN0LCBiZWNhdXNlXG4vLyB0aGVyZSBpcyBubyBzdWNoIHRpbWUgaW4gdGhlIGdpdmVuIHRpbWV6b25lLlxuZnVuY3Rpb24gZ2V0U2V0T2Zmc2V0IChpbnB1dCwga2VlcExvY2FsVGltZSkge1xuICAgIHZhciBvZmZzZXQgPSB0aGlzLl9vZmZzZXQgfHwgMCxcbiAgICAgICAgbG9jYWxBZGp1c3Q7XG4gICAgaWYgKCF0aGlzLmlzVmFsaWQoKSkge1xuICAgICAgICByZXR1cm4gaW5wdXQgIT0gbnVsbCA/IHRoaXMgOiBOYU47XG4gICAgfVxuICAgIGlmIChpbnB1dCAhPSBudWxsKSB7XG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBpbnB1dCA9IG9mZnNldEZyb21TdHJpbmcobWF0Y2hTaG9ydE9mZnNldCwgaW5wdXQpO1xuICAgICAgICAgICAgaWYgKGlucHV0ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoTWF0aC5hYnMoaW5wdXQpIDwgMTYpIHtcbiAgICAgICAgICAgIGlucHV0ID0gaW5wdXQgKiA2MDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuX2lzVVRDICYmIGtlZXBMb2NhbFRpbWUpIHtcbiAgICAgICAgICAgIGxvY2FsQWRqdXN0ID0gZ2V0RGF0ZU9mZnNldCh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9vZmZzZXQgPSBpbnB1dDtcbiAgICAgICAgdGhpcy5faXNVVEMgPSB0cnVlO1xuICAgICAgICBpZiAobG9jYWxBZGp1c3QgIT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5hZGQobG9jYWxBZGp1c3QsICdtJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9mZnNldCAhPT0gaW5wdXQpIHtcbiAgICAgICAgICAgIGlmICgha2VlcExvY2FsVGltZSB8fCB0aGlzLl9jaGFuZ2VJblByb2dyZXNzKSB7XG4gICAgICAgICAgICAgICAgYWRkU3VidHJhY3QodGhpcywgY3JlYXRlRHVyYXRpb24oaW5wdXQgLSBvZmZzZXQsICdtJyksIDEsIGZhbHNlKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIXRoaXMuX2NoYW5nZUluUHJvZ3Jlc3MpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jaGFuZ2VJblByb2dyZXNzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBob29rcy51cGRhdGVPZmZzZXQodGhpcywgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fY2hhbmdlSW5Qcm9ncmVzcyA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lzVVRDID8gb2Zmc2V0IDogZ2V0RGF0ZU9mZnNldCh0aGlzKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldFNldFpvbmUgKGlucHV0LCBrZWVwTG9jYWxUaW1lKSB7XG4gICAgaWYgKGlucHV0ICE9IG51bGwpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBpbnB1dCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGlucHV0ID0gLWlucHV0O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy51dGNPZmZzZXQoaW5wdXQsIGtlZXBMb2NhbFRpbWUpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAtdGhpcy51dGNPZmZzZXQoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHNldE9mZnNldFRvVVRDIChrZWVwTG9jYWxUaW1lKSB7XG4gICAgcmV0dXJuIHRoaXMudXRjT2Zmc2V0KDAsIGtlZXBMb2NhbFRpbWUpO1xufVxuXG5mdW5jdGlvbiBzZXRPZmZzZXRUb0xvY2FsIChrZWVwTG9jYWxUaW1lKSB7XG4gICAgaWYgKHRoaXMuX2lzVVRDKSB7XG4gICAgICAgIHRoaXMudXRjT2Zmc2V0KDAsIGtlZXBMb2NhbFRpbWUpO1xuICAgICAgICB0aGlzLl9pc1VUQyA9IGZhbHNlO1xuXG4gICAgICAgIGlmIChrZWVwTG9jYWxUaW1lKSB7XG4gICAgICAgICAgICB0aGlzLnN1YnRyYWN0KGdldERhdGVPZmZzZXQodGhpcyksICdtJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59XG5cbmZ1bmN0aW9uIHNldE9mZnNldFRvUGFyc2VkT2Zmc2V0ICgpIHtcbiAgICBpZiAodGhpcy5fdHptICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy51dGNPZmZzZXQodGhpcy5fdHptKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB0aGlzLl9pID09PSAnc3RyaW5nJykge1xuICAgICAgICB2YXIgdFpvbmUgPSBvZmZzZXRGcm9tU3RyaW5nKG1hdGNoT2Zmc2V0LCB0aGlzLl9pKTtcbiAgICAgICAgaWYgKHRab25lICE9IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMudXRjT2Zmc2V0KHRab25lKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMudXRjT2Zmc2V0KDAsIHRydWUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufVxuXG5mdW5jdGlvbiBoYXNBbGlnbmVkSG91ck9mZnNldCAoaW5wdXQpIHtcbiAgICBpZiAoIXRoaXMuaXNWYWxpZCgpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaW5wdXQgPSBpbnB1dCA/IGNyZWF0ZUxvY2FsKGlucHV0KS51dGNPZmZzZXQoKSA6IDA7XG5cbiAgICByZXR1cm4gKHRoaXMudXRjT2Zmc2V0KCkgLSBpbnB1dCkgJSA2MCA9PT0gMDtcbn1cblxuZnVuY3Rpb24gaXNEYXlsaWdodFNhdmluZ1RpbWUgKCkge1xuICAgIHJldHVybiAoXG4gICAgICAgIHRoaXMudXRjT2Zmc2V0KCkgPiB0aGlzLmNsb25lKCkubW9udGgoMCkudXRjT2Zmc2V0KCkgfHxcbiAgICAgICAgdGhpcy51dGNPZmZzZXQoKSA+IHRoaXMuY2xvbmUoKS5tb250aCg1KS51dGNPZmZzZXQoKVxuICAgICk7XG59XG5cbmZ1bmN0aW9uIGlzRGF5bGlnaHRTYXZpbmdUaW1lU2hpZnRlZCAoKSB7XG4gICAgaWYgKCFpc1VuZGVmaW5lZCh0aGlzLl9pc0RTVFNoaWZ0ZWQpKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pc0RTVFNoaWZ0ZWQ7XG4gICAgfVxuXG4gICAgdmFyIGMgPSB7fTtcblxuICAgIGNvcHlDb25maWcoYywgdGhpcyk7XG4gICAgYyA9IHByZXBhcmVDb25maWcoYyk7XG5cbiAgICBpZiAoYy5fYSkge1xuICAgICAgICB2YXIgb3RoZXIgPSBjLl9pc1VUQyA/IGNyZWF0ZVVUQyhjLl9hKSA6IGNyZWF0ZUxvY2FsKGMuX2EpO1xuICAgICAgICB0aGlzLl9pc0RTVFNoaWZ0ZWQgPSB0aGlzLmlzVmFsaWQoKSAmJlxuICAgICAgICAgICAgY29tcGFyZUFycmF5cyhjLl9hLCBvdGhlci50b0FycmF5KCkpID4gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9pc0RTVFNoaWZ0ZWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5faXNEU1RTaGlmdGVkO1xufVxuXG5mdW5jdGlvbiBpc0xvY2FsICgpIHtcbiAgICByZXR1cm4gdGhpcy5pc1ZhbGlkKCkgPyAhdGhpcy5faXNVVEMgOiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gaXNVdGNPZmZzZXQgKCkge1xuICAgIHJldHVybiB0aGlzLmlzVmFsaWQoKSA/IHRoaXMuX2lzVVRDIDogZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGlzVXRjICgpIHtcbiAgICByZXR1cm4gdGhpcy5pc1ZhbGlkKCkgPyB0aGlzLl9pc1VUQyAmJiB0aGlzLl9vZmZzZXQgPT09IDAgOiBmYWxzZTtcbn1cblxuLy8gQVNQLk5FVCBqc29uIGRhdGUgZm9ybWF0IHJlZ2V4XG52YXIgYXNwTmV0UmVnZXggPSAvXihcXC0pPyg/OihcXGQqKVsuIF0pPyhcXGQrKVxcOihcXGQrKSg/OlxcOihcXGQrKShcXC5cXGQqKT8pPyQvO1xuXG4vLyBmcm9tIGh0dHA6Ly9kb2NzLmNsb3N1cmUtbGlicmFyeS5nb29nbGVjb2RlLmNvbS9naXQvY2xvc3VyZV9nb29nX2RhdGVfZGF0ZS5qcy5zb3VyY2UuaHRtbFxuLy8gc29tZXdoYXQgbW9yZSBpbiBsaW5lIHdpdGggNC40LjMuMiAyMDA0IHNwZWMsIGJ1dCBhbGxvd3MgZGVjaW1hbCBhbnl3aGVyZVxuLy8gYW5kIGZ1cnRoZXIgbW9kaWZpZWQgdG8gYWxsb3cgZm9yIHN0cmluZ3MgY29udGFpbmluZyBib3RoIHdlZWsgYW5kIGRheVxudmFyIGlzb1JlZ2V4ID0gL14oLSk/UCg/OigtP1swLTksLl0qKVkpPyg/OigtP1swLTksLl0qKU0pPyg/OigtP1swLTksLl0qKVcpPyg/OigtP1swLTksLl0qKUQpPyg/OlQoPzooLT9bMC05LC5dKilIKT8oPzooLT9bMC05LC5dKilNKT8oPzooLT9bMC05LC5dKilTKT8pPyQvO1xuXG5mdW5jdGlvbiBjcmVhdGVEdXJhdGlvbiAoaW5wdXQsIGtleSkge1xuICAgIHZhciBkdXJhdGlvbiA9IGlucHV0LFxuICAgICAgICAvLyBtYXRjaGluZyBhZ2FpbnN0IHJlZ2V4cCBpcyBleHBlbnNpdmUsIGRvIGl0IG9uIGRlbWFuZFxuICAgICAgICBtYXRjaCA9IG51bGwsXG4gICAgICAgIHNpZ24sXG4gICAgICAgIHJldCxcbiAgICAgICAgZGlmZlJlcztcblxuICAgIGlmIChpc0R1cmF0aW9uKGlucHV0KSkge1xuICAgICAgICBkdXJhdGlvbiA9IHtcbiAgICAgICAgICAgIG1zIDogaW5wdXQuX21pbGxpc2Vjb25kcyxcbiAgICAgICAgICAgIGQgIDogaW5wdXQuX2RheXMsXG4gICAgICAgICAgICBNICA6IGlucHV0Ll9tb250aHNcbiAgICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKGlzTnVtYmVyKGlucHV0KSkge1xuICAgICAgICBkdXJhdGlvbiA9IHt9O1xuICAgICAgICBpZiAoa2V5KSB7XG4gICAgICAgICAgICBkdXJhdGlvbltrZXldID0gaW5wdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkdXJhdGlvbi5taWxsaXNlY29uZHMgPSBpbnB1dDtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAoISEobWF0Y2ggPSBhc3BOZXRSZWdleC5leGVjKGlucHV0KSkpIHtcbiAgICAgICAgc2lnbiA9IChtYXRjaFsxXSA9PT0gJy0nKSA/IC0xIDogMTtcbiAgICAgICAgZHVyYXRpb24gPSB7XG4gICAgICAgICAgICB5ICA6IDAsXG4gICAgICAgICAgICBkICA6IHRvSW50KG1hdGNoW0RBVEVdKSAgICAgICAgICAgICAgICAgICAgICAgICAqIHNpZ24sXG4gICAgICAgICAgICBoICA6IHRvSW50KG1hdGNoW0hPVVJdKSAgICAgICAgICAgICAgICAgICAgICAgICAqIHNpZ24sXG4gICAgICAgICAgICBtICA6IHRvSW50KG1hdGNoW01JTlVURV0pICAgICAgICAgICAgICAgICAgICAgICAqIHNpZ24sXG4gICAgICAgICAgICBzICA6IHRvSW50KG1hdGNoW1NFQ09ORF0pICAgICAgICAgICAgICAgICAgICAgICAqIHNpZ24sXG4gICAgICAgICAgICBtcyA6IHRvSW50KGFic1JvdW5kKG1hdGNoW01JTExJU0VDT05EXSAqIDEwMDApKSAqIHNpZ24gLy8gdGhlIG1pbGxpc2Vjb25kIGRlY2ltYWwgcG9pbnQgaXMgaW5jbHVkZWQgaW4gdGhlIG1hdGNoXG4gICAgICAgIH07XG4gICAgfSBlbHNlIGlmICghIShtYXRjaCA9IGlzb1JlZ2V4LmV4ZWMoaW5wdXQpKSkge1xuICAgICAgICBzaWduID0gKG1hdGNoWzFdID09PSAnLScpID8gLTEgOiAxO1xuICAgICAgICBkdXJhdGlvbiA9IHtcbiAgICAgICAgICAgIHkgOiBwYXJzZUlzbyhtYXRjaFsyXSwgc2lnbiksXG4gICAgICAgICAgICBNIDogcGFyc2VJc28obWF0Y2hbM10sIHNpZ24pLFxuICAgICAgICAgICAgdyA6IHBhcnNlSXNvKG1hdGNoWzRdLCBzaWduKSxcbiAgICAgICAgICAgIGQgOiBwYXJzZUlzbyhtYXRjaFs1XSwgc2lnbiksXG4gICAgICAgICAgICBoIDogcGFyc2VJc28obWF0Y2hbNl0sIHNpZ24pLFxuICAgICAgICAgICAgbSA6IHBhcnNlSXNvKG1hdGNoWzddLCBzaWduKSxcbiAgICAgICAgICAgIHMgOiBwYXJzZUlzbyhtYXRjaFs4XSwgc2lnbilcbiAgICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKGR1cmF0aW9uID09IG51bGwpIHsvLyBjaGVja3MgZm9yIG51bGwgb3IgdW5kZWZpbmVkXG4gICAgICAgIGR1cmF0aW9uID0ge307XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZHVyYXRpb24gPT09ICdvYmplY3QnICYmICgnZnJvbScgaW4gZHVyYXRpb24gfHwgJ3RvJyBpbiBkdXJhdGlvbikpIHtcbiAgICAgICAgZGlmZlJlcyA9IG1vbWVudHNEaWZmZXJlbmNlKGNyZWF0ZUxvY2FsKGR1cmF0aW9uLmZyb20pLCBjcmVhdGVMb2NhbChkdXJhdGlvbi50bykpO1xuXG4gICAgICAgIGR1cmF0aW9uID0ge307XG4gICAgICAgIGR1cmF0aW9uLm1zID0gZGlmZlJlcy5taWxsaXNlY29uZHM7XG4gICAgICAgIGR1cmF0aW9uLk0gPSBkaWZmUmVzLm1vbnRocztcbiAgICB9XG5cbiAgICByZXQgPSBuZXcgRHVyYXRpb24oZHVyYXRpb24pO1xuXG4gICAgaWYgKGlzRHVyYXRpb24oaW5wdXQpICYmIGhhc093blByb3AoaW5wdXQsICdfbG9jYWxlJykpIHtcbiAgICAgICAgcmV0Ll9sb2NhbGUgPSBpbnB1dC5fbG9jYWxlO1xuICAgIH1cblxuICAgIHJldHVybiByZXQ7XG59XG5cbmNyZWF0ZUR1cmF0aW9uLmZuID0gRHVyYXRpb24ucHJvdG90eXBlO1xuXG5mdW5jdGlvbiBwYXJzZUlzbyAoaW5wLCBzaWduKSB7XG4gICAgLy8gV2UnZCBub3JtYWxseSB1c2Ugfn5pbnAgZm9yIHRoaXMsIGJ1dCB1bmZvcnR1bmF0ZWx5IGl0IGFsc29cbiAgICAvLyBjb252ZXJ0cyBmbG9hdHMgdG8gaW50cy5cbiAgICAvLyBpbnAgbWF5IGJlIHVuZGVmaW5lZCwgc28gY2FyZWZ1bCBjYWxsaW5nIHJlcGxhY2Ugb24gaXQuXG4gICAgdmFyIHJlcyA9IGlucCAmJiBwYXJzZUZsb2F0KGlucC5yZXBsYWNlKCcsJywgJy4nKSk7XG4gICAgLy8gYXBwbHkgc2lnbiB3aGlsZSB3ZSdyZSBhdCBpdFxuICAgIHJldHVybiAoaXNOYU4ocmVzKSA/IDAgOiByZXMpICogc2lnbjtcbn1cblxuZnVuY3Rpb24gcG9zaXRpdmVNb21lbnRzRGlmZmVyZW5jZShiYXNlLCBvdGhlcikge1xuICAgIHZhciByZXMgPSB7bWlsbGlzZWNvbmRzOiAwLCBtb250aHM6IDB9O1xuXG4gICAgcmVzLm1vbnRocyA9IG90aGVyLm1vbnRoKCkgLSBiYXNlLm1vbnRoKCkgK1xuICAgICAgICAob3RoZXIueWVhcigpIC0gYmFzZS55ZWFyKCkpICogMTI7XG4gICAgaWYgKGJhc2UuY2xvbmUoKS5hZGQocmVzLm1vbnRocywgJ00nKS5pc0FmdGVyKG90aGVyKSkge1xuICAgICAgICAtLXJlcy5tb250aHM7XG4gICAgfVxuXG4gICAgcmVzLm1pbGxpc2Vjb25kcyA9ICtvdGhlciAtICsoYmFzZS5jbG9uZSgpLmFkZChyZXMubW9udGhzLCAnTScpKTtcblxuICAgIHJldHVybiByZXM7XG59XG5cbmZ1bmN0aW9uIG1vbWVudHNEaWZmZXJlbmNlKGJhc2UsIG90aGVyKSB7XG4gICAgdmFyIHJlcztcbiAgICBpZiAoIShiYXNlLmlzVmFsaWQoKSAmJiBvdGhlci5pc1ZhbGlkKCkpKSB7XG4gICAgICAgIHJldHVybiB7bWlsbGlzZWNvbmRzOiAwLCBtb250aHM6IDB9O1xuICAgIH1cblxuICAgIG90aGVyID0gY2xvbmVXaXRoT2Zmc2V0KG90aGVyLCBiYXNlKTtcbiAgICBpZiAoYmFzZS5pc0JlZm9yZShvdGhlcikpIHtcbiAgICAgICAgcmVzID0gcG9zaXRpdmVNb21lbnRzRGlmZmVyZW5jZShiYXNlLCBvdGhlcik7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmVzID0gcG9zaXRpdmVNb21lbnRzRGlmZmVyZW5jZShvdGhlciwgYmFzZSk7XG4gICAgICAgIHJlcy5taWxsaXNlY29uZHMgPSAtcmVzLm1pbGxpc2Vjb25kcztcbiAgICAgICAgcmVzLm1vbnRocyA9IC1yZXMubW9udGhzO1xuICAgIH1cblxuICAgIHJldHVybiByZXM7XG59XG5cbi8vIFRPRE86IHJlbW92ZSAnbmFtZScgYXJnIGFmdGVyIGRlcHJlY2F0aW9uIGlzIHJlbW92ZWRcbmZ1bmN0aW9uIGNyZWF0ZUFkZGVyKGRpcmVjdGlvbiwgbmFtZSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsLCBwZXJpb2QpIHtcbiAgICAgICAgdmFyIGR1ciwgdG1wO1xuICAgICAgICAvL2ludmVydCB0aGUgYXJndW1lbnRzLCBidXQgY29tcGxhaW4gYWJvdXQgaXRcbiAgICAgICAgaWYgKHBlcmlvZCAhPT0gbnVsbCAmJiAhaXNOYU4oK3BlcmlvZCkpIHtcbiAgICAgICAgICAgIGRlcHJlY2F0ZVNpbXBsZShuYW1lLCAnbW9tZW50KCkuJyArIG5hbWUgICsgJyhwZXJpb2QsIG51bWJlcikgaXMgZGVwcmVjYXRlZC4gUGxlYXNlIHVzZSBtb21lbnQoKS4nICsgbmFtZSArICcobnVtYmVyLCBwZXJpb2QpLiAnICtcbiAgICAgICAgICAgICdTZWUgaHR0cDovL21vbWVudGpzLmNvbS9ndWlkZXMvIy93YXJuaW5ncy9hZGQtaW52ZXJ0ZWQtcGFyYW0vIGZvciBtb3JlIGluZm8uJyk7XG4gICAgICAgICAgICB0bXAgPSB2YWw7IHZhbCA9IHBlcmlvZDsgcGVyaW9kID0gdG1wO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFsID0gdHlwZW9mIHZhbCA9PT0gJ3N0cmluZycgPyArdmFsIDogdmFsO1xuICAgICAgICBkdXIgPSBjcmVhdGVEdXJhdGlvbih2YWwsIHBlcmlvZCk7XG4gICAgICAgIGFkZFN1YnRyYWN0KHRoaXMsIGR1ciwgZGlyZWN0aW9uKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gYWRkU3VidHJhY3QgKG1vbSwgZHVyYXRpb24sIGlzQWRkaW5nLCB1cGRhdGVPZmZzZXQpIHtcbiAgICB2YXIgbWlsbGlzZWNvbmRzID0gZHVyYXRpb24uX21pbGxpc2Vjb25kcyxcbiAgICAgICAgZGF5cyA9IGFic1JvdW5kKGR1cmF0aW9uLl9kYXlzKSxcbiAgICAgICAgbW9udGhzID0gYWJzUm91bmQoZHVyYXRpb24uX21vbnRocyk7XG5cbiAgICBpZiAoIW1vbS5pc1ZhbGlkKCkpIHtcbiAgICAgICAgLy8gTm8gb3BcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHVwZGF0ZU9mZnNldCA9IHVwZGF0ZU9mZnNldCA9PSBudWxsID8gdHJ1ZSA6IHVwZGF0ZU9mZnNldDtcblxuICAgIGlmIChtaWxsaXNlY29uZHMpIHtcbiAgICAgICAgbW9tLl9kLnNldFRpbWUobW9tLl9kLnZhbHVlT2YoKSArIG1pbGxpc2Vjb25kcyAqIGlzQWRkaW5nKTtcbiAgICB9XG4gICAgaWYgKGRheXMpIHtcbiAgICAgICAgc2V0JDEobW9tLCAnRGF0ZScsIGdldChtb20sICdEYXRlJykgKyBkYXlzICogaXNBZGRpbmcpO1xuICAgIH1cbiAgICBpZiAobW9udGhzKSB7XG4gICAgICAgIHNldE1vbnRoKG1vbSwgZ2V0KG1vbSwgJ01vbnRoJykgKyBtb250aHMgKiBpc0FkZGluZyk7XG4gICAgfVxuICAgIGlmICh1cGRhdGVPZmZzZXQpIHtcbiAgICAgICAgaG9va3MudXBkYXRlT2Zmc2V0KG1vbSwgZGF5cyB8fCBtb250aHMpO1xuICAgIH1cbn1cblxudmFyIGFkZCAgICAgID0gY3JlYXRlQWRkZXIoMSwgJ2FkZCcpO1xudmFyIHN1YnRyYWN0ID0gY3JlYXRlQWRkZXIoLTEsICdzdWJ0cmFjdCcpO1xuXG5mdW5jdGlvbiBnZXRDYWxlbmRhckZvcm1hdChteU1vbWVudCwgbm93KSB7XG4gICAgdmFyIGRpZmYgPSBteU1vbWVudC5kaWZmKG5vdywgJ2RheXMnLCB0cnVlKTtcbiAgICByZXR1cm4gZGlmZiA8IC02ID8gJ3NhbWVFbHNlJyA6XG4gICAgICAgICAgICBkaWZmIDwgLTEgPyAnbGFzdFdlZWsnIDpcbiAgICAgICAgICAgIGRpZmYgPCAwID8gJ2xhc3REYXknIDpcbiAgICAgICAgICAgIGRpZmYgPCAxID8gJ3NhbWVEYXknIDpcbiAgICAgICAgICAgIGRpZmYgPCAyID8gJ25leHREYXknIDpcbiAgICAgICAgICAgIGRpZmYgPCA3ID8gJ25leHRXZWVrJyA6ICdzYW1lRWxzZSc7XG59XG5cbmZ1bmN0aW9uIGNhbGVuZGFyJDEgKHRpbWUsIGZvcm1hdHMpIHtcbiAgICAvLyBXZSB3YW50IHRvIGNvbXBhcmUgdGhlIHN0YXJ0IG9mIHRvZGF5LCB2cyB0aGlzLlxuICAgIC8vIEdldHRpbmcgc3RhcnQtb2YtdG9kYXkgZGVwZW5kcyBvbiB3aGV0aGVyIHdlJ3JlIGxvY2FsL3V0Yy9vZmZzZXQgb3Igbm90LlxuICAgIHZhciBub3cgPSB0aW1lIHx8IGNyZWF0ZUxvY2FsKCksXG4gICAgICAgIHNvZCA9IGNsb25lV2l0aE9mZnNldChub3csIHRoaXMpLnN0YXJ0T2YoJ2RheScpLFxuICAgICAgICBmb3JtYXQgPSBob29rcy5jYWxlbmRhckZvcm1hdCh0aGlzLCBzb2QpIHx8ICdzYW1lRWxzZSc7XG5cbiAgICB2YXIgb3V0cHV0ID0gZm9ybWF0cyAmJiAoaXNGdW5jdGlvbihmb3JtYXRzW2Zvcm1hdF0pID8gZm9ybWF0c1tmb3JtYXRdLmNhbGwodGhpcywgbm93KSA6IGZvcm1hdHNbZm9ybWF0XSk7XG5cbiAgICByZXR1cm4gdGhpcy5mb3JtYXQob3V0cHV0IHx8IHRoaXMubG9jYWxlRGF0YSgpLmNhbGVuZGFyKGZvcm1hdCwgdGhpcywgY3JlYXRlTG9jYWwobm93KSkpO1xufVxuXG5mdW5jdGlvbiBjbG9uZSAoKSB7XG4gICAgcmV0dXJuIG5ldyBNb21lbnQodGhpcyk7XG59XG5cbmZ1bmN0aW9uIGlzQWZ0ZXIgKGlucHV0LCB1bml0cykge1xuICAgIHZhciBsb2NhbElucHV0ID0gaXNNb21lbnQoaW5wdXQpID8gaW5wdXQgOiBjcmVhdGVMb2NhbChpbnB1dCk7XG4gICAgaWYgKCEodGhpcy5pc1ZhbGlkKCkgJiYgbG9jYWxJbnB1dC5pc1ZhbGlkKCkpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyghaXNVbmRlZmluZWQodW5pdHMpID8gdW5pdHMgOiAnbWlsbGlzZWNvbmQnKTtcbiAgICBpZiAodW5pdHMgPT09ICdtaWxsaXNlY29uZCcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVPZigpID4gbG9jYWxJbnB1dC52YWx1ZU9mKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGxvY2FsSW5wdXQudmFsdWVPZigpIDwgdGhpcy5jbG9uZSgpLnN0YXJ0T2YodW5pdHMpLnZhbHVlT2YoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGlzQmVmb3JlIChpbnB1dCwgdW5pdHMpIHtcbiAgICB2YXIgbG9jYWxJbnB1dCA9IGlzTW9tZW50KGlucHV0KSA/IGlucHV0IDogY3JlYXRlTG9jYWwoaW5wdXQpO1xuICAgIGlmICghKHRoaXMuaXNWYWxpZCgpICYmIGxvY2FsSW5wdXQuaXNWYWxpZCgpKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHMoIWlzVW5kZWZpbmVkKHVuaXRzKSA/IHVuaXRzIDogJ21pbGxpc2Vjb25kJyk7XG4gICAgaWYgKHVuaXRzID09PSAnbWlsbGlzZWNvbmQnKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlT2YoKSA8IGxvY2FsSW5wdXQudmFsdWVPZigpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNsb25lKCkuZW5kT2YodW5pdHMpLnZhbHVlT2YoKSA8IGxvY2FsSW5wdXQudmFsdWVPZigpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaXNCZXR3ZWVuIChmcm9tLCB0bywgdW5pdHMsIGluY2x1c2l2aXR5KSB7XG4gICAgaW5jbHVzaXZpdHkgPSBpbmNsdXNpdml0eSB8fCAnKCknO1xuICAgIHJldHVybiAoaW5jbHVzaXZpdHlbMF0gPT09ICcoJyA/IHRoaXMuaXNBZnRlcihmcm9tLCB1bml0cykgOiAhdGhpcy5pc0JlZm9yZShmcm9tLCB1bml0cykpICYmXG4gICAgICAgIChpbmNsdXNpdml0eVsxXSA9PT0gJyknID8gdGhpcy5pc0JlZm9yZSh0bywgdW5pdHMpIDogIXRoaXMuaXNBZnRlcih0bywgdW5pdHMpKTtcbn1cblxuZnVuY3Rpb24gaXNTYW1lIChpbnB1dCwgdW5pdHMpIHtcbiAgICB2YXIgbG9jYWxJbnB1dCA9IGlzTW9tZW50KGlucHV0KSA/IGlucHV0IDogY3JlYXRlTG9jYWwoaW5wdXQpLFxuICAgICAgICBpbnB1dE1zO1xuICAgIGlmICghKHRoaXMuaXNWYWxpZCgpICYmIGxvY2FsSW5wdXQuaXNWYWxpZCgpKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModW5pdHMgfHwgJ21pbGxpc2Vjb25kJyk7XG4gICAgaWYgKHVuaXRzID09PSAnbWlsbGlzZWNvbmQnKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlT2YoKSA9PT0gbG9jYWxJbnB1dC52YWx1ZU9mKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaW5wdXRNcyA9IGxvY2FsSW5wdXQudmFsdWVPZigpO1xuICAgICAgICByZXR1cm4gdGhpcy5jbG9uZSgpLnN0YXJ0T2YodW5pdHMpLnZhbHVlT2YoKSA8PSBpbnB1dE1zICYmIGlucHV0TXMgPD0gdGhpcy5jbG9uZSgpLmVuZE9mKHVuaXRzKS52YWx1ZU9mKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpc1NhbWVPckFmdGVyIChpbnB1dCwgdW5pdHMpIHtcbiAgICByZXR1cm4gdGhpcy5pc1NhbWUoaW5wdXQsIHVuaXRzKSB8fCB0aGlzLmlzQWZ0ZXIoaW5wdXQsdW5pdHMpO1xufVxuXG5mdW5jdGlvbiBpc1NhbWVPckJlZm9yZSAoaW5wdXQsIHVuaXRzKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNTYW1lKGlucHV0LCB1bml0cykgfHwgdGhpcy5pc0JlZm9yZShpbnB1dCx1bml0cyk7XG59XG5cbmZ1bmN0aW9uIGRpZmYgKGlucHV0LCB1bml0cywgYXNGbG9hdCkge1xuICAgIHZhciB0aGF0LFxuICAgICAgICB6b25lRGVsdGEsXG4gICAgICAgIGRlbHRhLCBvdXRwdXQ7XG5cbiAgICBpZiAoIXRoaXMuaXNWYWxpZCgpKSB7XG4gICAgICAgIHJldHVybiBOYU47XG4gICAgfVxuXG4gICAgdGhhdCA9IGNsb25lV2l0aE9mZnNldChpbnB1dCwgdGhpcyk7XG5cbiAgICBpZiAoIXRoYXQuaXNWYWxpZCgpKSB7XG4gICAgICAgIHJldHVybiBOYU47XG4gICAgfVxuXG4gICAgem9uZURlbHRhID0gKHRoYXQudXRjT2Zmc2V0KCkgLSB0aGlzLnV0Y09mZnNldCgpKSAqIDZlNDtcblxuICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModW5pdHMpO1xuXG4gICAgaWYgKHVuaXRzID09PSAneWVhcicgfHwgdW5pdHMgPT09ICdtb250aCcgfHwgdW5pdHMgPT09ICdxdWFydGVyJykge1xuICAgICAgICBvdXRwdXQgPSBtb250aERpZmYodGhpcywgdGhhdCk7XG4gICAgICAgIGlmICh1bml0cyA9PT0gJ3F1YXJ0ZXInKSB7XG4gICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQgLyAzO1xuICAgICAgICB9IGVsc2UgaWYgKHVuaXRzID09PSAneWVhcicpIHtcbiAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dCAvIDEyO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZGVsdGEgPSB0aGlzIC0gdGhhdDtcbiAgICAgICAgb3V0cHV0ID0gdW5pdHMgPT09ICdzZWNvbmQnID8gZGVsdGEgLyAxZTMgOiAvLyAxMDAwXG4gICAgICAgICAgICB1bml0cyA9PT0gJ21pbnV0ZScgPyBkZWx0YSAvIDZlNCA6IC8vIDEwMDAgKiA2MFxuICAgICAgICAgICAgdW5pdHMgPT09ICdob3VyJyA/IGRlbHRhIC8gMzZlNSA6IC8vIDEwMDAgKiA2MCAqIDYwXG4gICAgICAgICAgICB1bml0cyA9PT0gJ2RheScgPyAoZGVsdGEgLSB6b25lRGVsdGEpIC8gODY0ZTUgOiAvLyAxMDAwICogNjAgKiA2MCAqIDI0LCBuZWdhdGUgZHN0XG4gICAgICAgICAgICB1bml0cyA9PT0gJ3dlZWsnID8gKGRlbHRhIC0gem9uZURlbHRhKSAvIDYwNDhlNSA6IC8vIDEwMDAgKiA2MCAqIDYwICogMjQgKiA3LCBuZWdhdGUgZHN0XG4gICAgICAgICAgICBkZWx0YTtcbiAgICB9XG4gICAgcmV0dXJuIGFzRmxvYXQgPyBvdXRwdXQgOiBhYnNGbG9vcihvdXRwdXQpO1xufVxuXG5mdW5jdGlvbiBtb250aERpZmYgKGEsIGIpIHtcbiAgICAvLyBkaWZmZXJlbmNlIGluIG1vbnRoc1xuICAgIHZhciB3aG9sZU1vbnRoRGlmZiA9ICgoYi55ZWFyKCkgLSBhLnllYXIoKSkgKiAxMikgKyAoYi5tb250aCgpIC0gYS5tb250aCgpKSxcbiAgICAgICAgLy8gYiBpcyBpbiAoYW5jaG9yIC0gMSBtb250aCwgYW5jaG9yICsgMSBtb250aClcbiAgICAgICAgYW5jaG9yID0gYS5jbG9uZSgpLmFkZCh3aG9sZU1vbnRoRGlmZiwgJ21vbnRocycpLFxuICAgICAgICBhbmNob3IyLCBhZGp1c3Q7XG5cbiAgICBpZiAoYiAtIGFuY2hvciA8IDApIHtcbiAgICAgICAgYW5jaG9yMiA9IGEuY2xvbmUoKS5hZGQod2hvbGVNb250aERpZmYgLSAxLCAnbW9udGhzJyk7XG4gICAgICAgIC8vIGxpbmVhciBhY3Jvc3MgdGhlIG1vbnRoXG4gICAgICAgIGFkanVzdCA9IChiIC0gYW5jaG9yKSAvIChhbmNob3IgLSBhbmNob3IyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBhbmNob3IyID0gYS5jbG9uZSgpLmFkZCh3aG9sZU1vbnRoRGlmZiArIDEsICdtb250aHMnKTtcbiAgICAgICAgLy8gbGluZWFyIGFjcm9zcyB0aGUgbW9udGhcbiAgICAgICAgYWRqdXN0ID0gKGIgLSBhbmNob3IpIC8gKGFuY2hvcjIgLSBhbmNob3IpO1xuICAgIH1cblxuICAgIC8vY2hlY2sgZm9yIG5lZ2F0aXZlIHplcm8sIHJldHVybiB6ZXJvIGlmIG5lZ2F0aXZlIHplcm9cbiAgICByZXR1cm4gLSh3aG9sZU1vbnRoRGlmZiArIGFkanVzdCkgfHwgMDtcbn1cblxuaG9va3MuZGVmYXVsdEZvcm1hdCA9ICdZWVlZLU1NLUREVEhIOm1tOnNzWic7XG5ob29rcy5kZWZhdWx0Rm9ybWF0VXRjID0gJ1lZWVktTU0tRERUSEg6bW06c3NbWl0nO1xuXG5mdW5jdGlvbiB0b1N0cmluZyAoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2xvbmUoKS5sb2NhbGUoJ2VuJykuZm9ybWF0KCdkZGQgTU1NIEREIFlZWVkgSEg6bW06c3MgW0dNVF1aWicpO1xufVxuXG5mdW5jdGlvbiB0b0lTT1N0cmluZyAoKSB7XG4gICAgdmFyIG0gPSB0aGlzLmNsb25lKCkudXRjKCk7XG4gICAgaWYgKDAgPCBtLnllYXIoKSAmJiBtLnllYXIoKSA8PSA5OTk5KSB7XG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKERhdGUucHJvdG90eXBlLnRvSVNPU3RyaW5nKSkge1xuICAgICAgICAgICAgLy8gbmF0aXZlIGltcGxlbWVudGF0aW9uIGlzIH41MHggZmFzdGVyLCB1c2UgaXQgd2hlbiB3ZSBjYW5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnRvRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZm9ybWF0TW9tZW50KG0sICdZWVlZLU1NLUREW1RdSEg6bW06c3MuU1NTW1pdJyk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZm9ybWF0TW9tZW50KG0sICdZWVlZWVktTU0tRERbVF1ISDptbTpzcy5TU1NbWl0nKTtcbiAgICB9XG59XG5cbi8qKlxuICogUmV0dXJuIGEgaHVtYW4gcmVhZGFibGUgcmVwcmVzZW50YXRpb24gb2YgYSBtb21lbnQgdGhhdCBjYW5cbiAqIGFsc28gYmUgZXZhbHVhdGVkIHRvIGdldCBhIG5ldyBtb21lbnQgd2hpY2ggaXMgdGhlIHNhbWVcbiAqXG4gKiBAbGluayBodHRwczovL25vZGVqcy5vcmcvZGlzdC9sYXRlc3QvZG9jcy9hcGkvdXRpbC5odG1sI3V0aWxfY3VzdG9tX2luc3BlY3RfZnVuY3Rpb25fb25fb2JqZWN0c1xuICovXG5mdW5jdGlvbiBpbnNwZWN0ICgpIHtcbiAgICBpZiAoIXRoaXMuaXNWYWxpZCgpKSB7XG4gICAgICAgIHJldHVybiAnbW9tZW50LmludmFsaWQoLyogJyArIHRoaXMuX2kgKyAnICovKSc7XG4gICAgfVxuICAgIHZhciBmdW5jID0gJ21vbWVudCc7XG4gICAgdmFyIHpvbmUgPSAnJztcbiAgICBpZiAoIXRoaXMuaXNMb2NhbCgpKSB7XG4gICAgICAgIGZ1bmMgPSB0aGlzLnV0Y09mZnNldCgpID09PSAwID8gJ21vbWVudC51dGMnIDogJ21vbWVudC5wYXJzZVpvbmUnO1xuICAgICAgICB6b25lID0gJ1onO1xuICAgIH1cbiAgICB2YXIgcHJlZml4ID0gJ1snICsgZnVuYyArICcoXCJdJztcbiAgICB2YXIgeWVhciA9ICgwIDwgdGhpcy55ZWFyKCkgJiYgdGhpcy55ZWFyKCkgPD0gOTk5OSkgPyAnWVlZWScgOiAnWVlZWVlZJztcbiAgICB2YXIgZGF0ZXRpbWUgPSAnLU1NLUREW1RdSEg6bW06c3MuU1NTJztcbiAgICB2YXIgc3VmZml4ID0gem9uZSArICdbXCIpXSc7XG5cbiAgICByZXR1cm4gdGhpcy5mb3JtYXQocHJlZml4ICsgeWVhciArIGRhdGV0aW1lICsgc3VmZml4KTtcbn1cblxuZnVuY3Rpb24gZm9ybWF0IChpbnB1dFN0cmluZykge1xuICAgIGlmICghaW5wdXRTdHJpbmcpIHtcbiAgICAgICAgaW5wdXRTdHJpbmcgPSB0aGlzLmlzVXRjKCkgPyBob29rcy5kZWZhdWx0Rm9ybWF0VXRjIDogaG9va3MuZGVmYXVsdEZvcm1hdDtcbiAgICB9XG4gICAgdmFyIG91dHB1dCA9IGZvcm1hdE1vbWVudCh0aGlzLCBpbnB1dFN0cmluZyk7XG4gICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLnBvc3Rmb3JtYXQob3V0cHV0KTtcbn1cblxuZnVuY3Rpb24gZnJvbSAodGltZSwgd2l0aG91dFN1ZmZpeCkge1xuICAgIGlmICh0aGlzLmlzVmFsaWQoKSAmJlxuICAgICAgICAgICAgKChpc01vbWVudCh0aW1lKSAmJiB0aW1lLmlzVmFsaWQoKSkgfHxcbiAgICAgICAgICAgICBjcmVhdGVMb2NhbCh0aW1lKS5pc1ZhbGlkKCkpKSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVEdXJhdGlvbih7dG86IHRoaXMsIGZyb206IHRpbWV9KS5sb2NhbGUodGhpcy5sb2NhbGUoKSkuaHVtYW5pemUoIXdpdGhvdXRTdWZmaXgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxvY2FsZURhdGEoKS5pbnZhbGlkRGF0ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZnJvbU5vdyAod2l0aG91dFN1ZmZpeCkge1xuICAgIHJldHVybiB0aGlzLmZyb20oY3JlYXRlTG9jYWwoKSwgd2l0aG91dFN1ZmZpeCk7XG59XG5cbmZ1bmN0aW9uIHRvICh0aW1lLCB3aXRob3V0U3VmZml4KSB7XG4gICAgaWYgKHRoaXMuaXNWYWxpZCgpICYmXG4gICAgICAgICAgICAoKGlzTW9tZW50KHRpbWUpICYmIHRpbWUuaXNWYWxpZCgpKSB8fFxuICAgICAgICAgICAgIGNyZWF0ZUxvY2FsKHRpbWUpLmlzVmFsaWQoKSkpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUR1cmF0aW9uKHtmcm9tOiB0aGlzLCB0bzogdGltZX0pLmxvY2FsZSh0aGlzLmxvY2FsZSgpKS5odW1hbml6ZSghd2l0aG91dFN1ZmZpeCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpLmludmFsaWREYXRlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB0b05vdyAod2l0aG91dFN1ZmZpeCkge1xuICAgIHJldHVybiB0aGlzLnRvKGNyZWF0ZUxvY2FsKCksIHdpdGhvdXRTdWZmaXgpO1xufVxuXG4vLyBJZiBwYXNzZWQgYSBsb2NhbGUga2V5LCBpdCB3aWxsIHNldCB0aGUgbG9jYWxlIGZvciB0aGlzXG4vLyBpbnN0YW5jZS4gIE90aGVyd2lzZSwgaXQgd2lsbCByZXR1cm4gdGhlIGxvY2FsZSBjb25maWd1cmF0aW9uXG4vLyB2YXJpYWJsZXMgZm9yIHRoaXMgaW5zdGFuY2UuXG5mdW5jdGlvbiBsb2NhbGUgKGtleSkge1xuICAgIHZhciBuZXdMb2NhbGVEYXRhO1xuXG4gICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9sb2NhbGUuX2FiYnI7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgbmV3TG9jYWxlRGF0YSA9IGdldExvY2FsZShrZXkpO1xuICAgICAgICBpZiAobmV3TG9jYWxlRGF0YSAhPSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLl9sb2NhbGUgPSBuZXdMb2NhbGVEYXRhO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn1cblxudmFyIGxhbmcgPSBkZXByZWNhdGUoXG4gICAgJ21vbWVudCgpLmxhbmcoKSBpcyBkZXByZWNhdGVkLiBJbnN0ZWFkLCB1c2UgbW9tZW50KCkubG9jYWxlRGF0YSgpIHRvIGdldCB0aGUgbGFuZ3VhZ2UgY29uZmlndXJhdGlvbi4gVXNlIG1vbWVudCgpLmxvY2FsZSgpIHRvIGNoYW5nZSBsYW5ndWFnZXMuJyxcbiAgICBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIGlmIChrZXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlRGF0YSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxlKGtleSk7XG4gICAgICAgIH1cbiAgICB9XG4pO1xuXG5mdW5jdGlvbiBsb2NhbGVEYXRhICgpIHtcbiAgICByZXR1cm4gdGhpcy5fbG9jYWxlO1xufVxuXG5mdW5jdGlvbiBzdGFydE9mICh1bml0cykge1xuICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModW5pdHMpO1xuICAgIC8vIHRoZSBmb2xsb3dpbmcgc3dpdGNoIGludGVudGlvbmFsbHkgb21pdHMgYnJlYWsga2V5d29yZHNcbiAgICAvLyB0byB1dGlsaXplIGZhbGxpbmcgdGhyb3VnaCB0aGUgY2FzZXMuXG4gICAgc3dpdGNoICh1bml0cykge1xuICAgICAgICBjYXNlICd5ZWFyJzpcbiAgICAgICAgICAgIHRoaXMubW9udGgoMCk7XG4gICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICAgIGNhc2UgJ3F1YXJ0ZXInOlxuICAgICAgICBjYXNlICdtb250aCc6XG4gICAgICAgICAgICB0aGlzLmRhdGUoMSk7XG4gICAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICAgIGNhc2UgJ3dlZWsnOlxuICAgICAgICBjYXNlICdpc29XZWVrJzpcbiAgICAgICAgY2FzZSAnZGF5JzpcbiAgICAgICAgY2FzZSAnZGF0ZSc6XG4gICAgICAgICAgICB0aGlzLmhvdXJzKDApO1xuICAgICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICBjYXNlICdob3VyJzpcbiAgICAgICAgICAgIHRoaXMubWludXRlcygwKTtcbiAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgY2FzZSAnbWludXRlJzpcbiAgICAgICAgICAgIHRoaXMuc2Vjb25kcygwKTtcbiAgICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgY2FzZSAnc2Vjb25kJzpcbiAgICAgICAgICAgIHRoaXMubWlsbGlzZWNvbmRzKDApO1xuICAgIH1cblxuICAgIC8vIHdlZWtzIGFyZSBhIHNwZWNpYWwgY2FzZVxuICAgIGlmICh1bml0cyA9PT0gJ3dlZWsnKSB7XG4gICAgICAgIHRoaXMud2Vla2RheSgwKTtcbiAgICB9XG4gICAgaWYgKHVuaXRzID09PSAnaXNvV2VlaycpIHtcbiAgICAgICAgdGhpcy5pc29XZWVrZGF5KDEpO1xuICAgIH1cblxuICAgIC8vIHF1YXJ0ZXJzIGFyZSBhbHNvIHNwZWNpYWxcbiAgICBpZiAodW5pdHMgPT09ICdxdWFydGVyJykge1xuICAgICAgICB0aGlzLm1vbnRoKE1hdGguZmxvb3IodGhpcy5tb250aCgpIC8gMykgKiAzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbn1cblxuZnVuY3Rpb24gZW5kT2YgKHVuaXRzKSB7XG4gICAgdW5pdHMgPSBub3JtYWxpemVVbml0cyh1bml0cyk7XG4gICAgaWYgKHVuaXRzID09PSB1bmRlZmluZWQgfHwgdW5pdHMgPT09ICdtaWxsaXNlY29uZCcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLy8gJ2RhdGUnIGlzIGFuIGFsaWFzIGZvciAnZGF5Jywgc28gaXQgc2hvdWxkIGJlIGNvbnNpZGVyZWQgYXMgc3VjaC5cbiAgICBpZiAodW5pdHMgPT09ICdkYXRlJykge1xuICAgICAgICB1bml0cyA9ICdkYXknO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnN0YXJ0T2YodW5pdHMpLmFkZCgxLCAodW5pdHMgPT09ICdpc29XZWVrJyA/ICd3ZWVrJyA6IHVuaXRzKSkuc3VidHJhY3QoMSwgJ21zJyk7XG59XG5cbmZ1bmN0aW9uIHZhbHVlT2YgKCkge1xuICAgIHJldHVybiB0aGlzLl9kLnZhbHVlT2YoKSAtICgodGhpcy5fb2Zmc2V0IHx8IDApICogNjAwMDApO1xufVxuXG5mdW5jdGlvbiB1bml4ICgpIHtcbiAgICByZXR1cm4gTWF0aC5mbG9vcih0aGlzLnZhbHVlT2YoKSAvIDEwMDApO1xufVxuXG5mdW5jdGlvbiB0b0RhdGUgKCkge1xuICAgIHJldHVybiBuZXcgRGF0ZSh0aGlzLnZhbHVlT2YoKSk7XG59XG5cbmZ1bmN0aW9uIHRvQXJyYXkgKCkge1xuICAgIHZhciBtID0gdGhpcztcbiAgICByZXR1cm4gW20ueWVhcigpLCBtLm1vbnRoKCksIG0uZGF0ZSgpLCBtLmhvdXIoKSwgbS5taW51dGUoKSwgbS5zZWNvbmQoKSwgbS5taWxsaXNlY29uZCgpXTtcbn1cblxuZnVuY3Rpb24gdG9PYmplY3QgKCkge1xuICAgIHZhciBtID0gdGhpcztcbiAgICByZXR1cm4ge1xuICAgICAgICB5ZWFyczogbS55ZWFyKCksXG4gICAgICAgIG1vbnRoczogbS5tb250aCgpLFxuICAgICAgICBkYXRlOiBtLmRhdGUoKSxcbiAgICAgICAgaG91cnM6IG0uaG91cnMoKSxcbiAgICAgICAgbWludXRlczogbS5taW51dGVzKCksXG4gICAgICAgIHNlY29uZHM6IG0uc2Vjb25kcygpLFxuICAgICAgICBtaWxsaXNlY29uZHM6IG0ubWlsbGlzZWNvbmRzKClcbiAgICB9O1xufVxuXG5mdW5jdGlvbiB0b0pTT04gKCkge1xuICAgIC8vIG5ldyBEYXRlKE5hTikudG9KU09OKCkgPT09IG51bGxcbiAgICByZXR1cm4gdGhpcy5pc1ZhbGlkKCkgPyB0aGlzLnRvSVNPU3RyaW5nKCkgOiBudWxsO1xufVxuXG5mdW5jdGlvbiBpc1ZhbGlkJDEgKCkge1xuICAgIHJldHVybiBpc1ZhbGlkKHRoaXMpO1xufVxuXG5mdW5jdGlvbiBwYXJzaW5nRmxhZ3MgKCkge1xuICAgIHJldHVybiBleHRlbmQoe30sIGdldFBhcnNpbmdGbGFncyh0aGlzKSk7XG59XG5cbmZ1bmN0aW9uIGludmFsaWRBdCAoKSB7XG4gICAgcmV0dXJuIGdldFBhcnNpbmdGbGFncyh0aGlzKS5vdmVyZmxvdztcbn1cblxuZnVuY3Rpb24gY3JlYXRpb25EYXRhKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIGlucHV0OiB0aGlzLl9pLFxuICAgICAgICBmb3JtYXQ6IHRoaXMuX2YsXG4gICAgICAgIGxvY2FsZTogdGhpcy5fbG9jYWxlLFxuICAgICAgICBpc1VUQzogdGhpcy5faXNVVEMsXG4gICAgICAgIHN0cmljdDogdGhpcy5fc3RyaWN0XG4gICAgfTtcbn1cblxuLy8gRk9STUFUVElOR1xuXG5hZGRGb3JtYXRUb2tlbigwLCBbJ2dnJywgMl0sIDAsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy53ZWVrWWVhcigpICUgMTAwO1xufSk7XG5cbmFkZEZvcm1hdFRva2VuKDAsIFsnR0cnLCAyXSwgMCwgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmlzb1dlZWtZZWFyKCkgJSAxMDA7XG59KTtcblxuZnVuY3Rpb24gYWRkV2Vla1llYXJGb3JtYXRUb2tlbiAodG9rZW4sIGdldHRlcikge1xuICAgIGFkZEZvcm1hdFRva2VuKDAsIFt0b2tlbiwgdG9rZW4ubGVuZ3RoXSwgMCwgZ2V0dGVyKTtcbn1cblxuYWRkV2Vla1llYXJGb3JtYXRUb2tlbignZ2dnZycsICAgICAnd2Vla1llYXInKTtcbmFkZFdlZWtZZWFyRm9ybWF0VG9rZW4oJ2dnZ2dnJywgICAgJ3dlZWtZZWFyJyk7XG5hZGRXZWVrWWVhckZvcm1hdFRva2VuKCdHR0dHJywgICdpc29XZWVrWWVhcicpO1xuYWRkV2Vla1llYXJGb3JtYXRUb2tlbignR0dHR0cnLCAnaXNvV2Vla1llYXInKTtcblxuLy8gQUxJQVNFU1xuXG5hZGRVbml0QWxpYXMoJ3dlZWtZZWFyJywgJ2dnJyk7XG5hZGRVbml0QWxpYXMoJ2lzb1dlZWtZZWFyJywgJ0dHJyk7XG5cbi8vIFBSSU9SSVRZXG5cbmFkZFVuaXRQcmlvcml0eSgnd2Vla1llYXInLCAxKTtcbmFkZFVuaXRQcmlvcml0eSgnaXNvV2Vla1llYXInLCAxKTtcblxuXG4vLyBQQVJTSU5HXG5cbmFkZFJlZ2V4VG9rZW4oJ0cnLCAgICAgIG1hdGNoU2lnbmVkKTtcbmFkZFJlZ2V4VG9rZW4oJ2cnLCAgICAgIG1hdGNoU2lnbmVkKTtcbmFkZFJlZ2V4VG9rZW4oJ0dHJywgICAgIG1hdGNoMXRvMiwgbWF0Y2gyKTtcbmFkZFJlZ2V4VG9rZW4oJ2dnJywgICAgIG1hdGNoMXRvMiwgbWF0Y2gyKTtcbmFkZFJlZ2V4VG9rZW4oJ0dHR0cnLCAgIG1hdGNoMXRvNCwgbWF0Y2g0KTtcbmFkZFJlZ2V4VG9rZW4oJ2dnZ2cnLCAgIG1hdGNoMXRvNCwgbWF0Y2g0KTtcbmFkZFJlZ2V4VG9rZW4oJ0dHR0dHJywgIG1hdGNoMXRvNiwgbWF0Y2g2KTtcbmFkZFJlZ2V4VG9rZW4oJ2dnZ2dnJywgIG1hdGNoMXRvNiwgbWF0Y2g2KTtcblxuYWRkV2Vla1BhcnNlVG9rZW4oWydnZ2dnJywgJ2dnZ2dnJywgJ0dHR0cnLCAnR0dHR0cnXSwgZnVuY3Rpb24gKGlucHV0LCB3ZWVrLCBjb25maWcsIHRva2VuKSB7XG4gICAgd2Vla1t0b2tlbi5zdWJzdHIoMCwgMildID0gdG9JbnQoaW5wdXQpO1xufSk7XG5cbmFkZFdlZWtQYXJzZVRva2VuKFsnZ2cnLCAnR0cnXSwgZnVuY3Rpb24gKGlucHV0LCB3ZWVrLCBjb25maWcsIHRva2VuKSB7XG4gICAgd2Vla1t0b2tlbl0gPSBob29rcy5wYXJzZVR3b0RpZ2l0WWVhcihpbnB1dCk7XG59KTtcblxuLy8gTU9NRU5UU1xuXG5mdW5jdGlvbiBnZXRTZXRXZWVrWWVhciAoaW5wdXQpIHtcbiAgICByZXR1cm4gZ2V0U2V0V2Vla1llYXJIZWxwZXIuY2FsbCh0aGlzLFxuICAgICAgICAgICAgaW5wdXQsXG4gICAgICAgICAgICB0aGlzLndlZWsoKSxcbiAgICAgICAgICAgIHRoaXMud2Vla2RheSgpLFxuICAgICAgICAgICAgdGhpcy5sb2NhbGVEYXRhKCkuX3dlZWsuZG93LFxuICAgICAgICAgICAgdGhpcy5sb2NhbGVEYXRhKCkuX3dlZWsuZG95KTtcbn1cblxuZnVuY3Rpb24gZ2V0U2V0SVNPV2Vla1llYXIgKGlucHV0KSB7XG4gICAgcmV0dXJuIGdldFNldFdlZWtZZWFySGVscGVyLmNhbGwodGhpcyxcbiAgICAgICAgICAgIGlucHV0LCB0aGlzLmlzb1dlZWsoKSwgdGhpcy5pc29XZWVrZGF5KCksIDEsIDQpO1xufVxuXG5mdW5jdGlvbiBnZXRJU09XZWVrc0luWWVhciAoKSB7XG4gICAgcmV0dXJuIHdlZWtzSW5ZZWFyKHRoaXMueWVhcigpLCAxLCA0KTtcbn1cblxuZnVuY3Rpb24gZ2V0V2Vla3NJblllYXIgKCkge1xuICAgIHZhciB3ZWVrSW5mbyA9IHRoaXMubG9jYWxlRGF0YSgpLl93ZWVrO1xuICAgIHJldHVybiB3ZWVrc0luWWVhcih0aGlzLnllYXIoKSwgd2Vla0luZm8uZG93LCB3ZWVrSW5mby5kb3kpO1xufVxuXG5mdW5jdGlvbiBnZXRTZXRXZWVrWWVhckhlbHBlcihpbnB1dCwgd2Vlaywgd2Vla2RheSwgZG93LCBkb3kpIHtcbiAgICB2YXIgd2Vla3NUYXJnZXQ7XG4gICAgaWYgKGlucHV0ID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHdlZWtPZlllYXIodGhpcywgZG93LCBkb3kpLnllYXI7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgd2Vla3NUYXJnZXQgPSB3ZWVrc0luWWVhcihpbnB1dCwgZG93LCBkb3kpO1xuICAgICAgICBpZiAod2VlayA+IHdlZWtzVGFyZ2V0KSB7XG4gICAgICAgICAgICB3ZWVrID0gd2Vla3NUYXJnZXQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNldFdlZWtBbGwuY2FsbCh0aGlzLCBpbnB1dCwgd2Vlaywgd2Vla2RheSwgZG93LCBkb3kpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc2V0V2Vla0FsbCh3ZWVrWWVhciwgd2Vlaywgd2Vla2RheSwgZG93LCBkb3kpIHtcbiAgICB2YXIgZGF5T2ZZZWFyRGF0YSA9IGRheU9mWWVhckZyb21XZWVrcyh3ZWVrWWVhciwgd2Vlaywgd2Vla2RheSwgZG93LCBkb3kpLFxuICAgICAgICBkYXRlID0gY3JlYXRlVVRDRGF0ZShkYXlPZlllYXJEYXRhLnllYXIsIDAsIGRheU9mWWVhckRhdGEuZGF5T2ZZZWFyKTtcblxuICAgIHRoaXMueWVhcihkYXRlLmdldFVUQ0Z1bGxZZWFyKCkpO1xuICAgIHRoaXMubW9udGgoZGF0ZS5nZXRVVENNb250aCgpKTtcbiAgICB0aGlzLmRhdGUoZGF0ZS5nZXRVVENEYXRlKCkpO1xuICAgIHJldHVybiB0aGlzO1xufVxuXG4vLyBGT1JNQVRUSU5HXG5cbmFkZEZvcm1hdFRva2VuKCdRJywgMCwgJ1FvJywgJ3F1YXJ0ZXInKTtcblxuLy8gQUxJQVNFU1xuXG5hZGRVbml0QWxpYXMoJ3F1YXJ0ZXInLCAnUScpO1xuXG4vLyBQUklPUklUWVxuXG5hZGRVbml0UHJpb3JpdHkoJ3F1YXJ0ZXInLCA3KTtcblxuLy8gUEFSU0lOR1xuXG5hZGRSZWdleFRva2VuKCdRJywgbWF0Y2gxKTtcbmFkZFBhcnNlVG9rZW4oJ1EnLCBmdW5jdGlvbiAoaW5wdXQsIGFycmF5KSB7XG4gICAgYXJyYXlbTU9OVEhdID0gKHRvSW50KGlucHV0KSAtIDEpICogMztcbn0pO1xuXG4vLyBNT01FTlRTXG5cbmZ1bmN0aW9uIGdldFNldFF1YXJ0ZXIgKGlucHV0KSB7XG4gICAgcmV0dXJuIGlucHV0ID09IG51bGwgPyBNYXRoLmNlaWwoKHRoaXMubW9udGgoKSArIDEpIC8gMykgOiB0aGlzLm1vbnRoKChpbnB1dCAtIDEpICogMyArIHRoaXMubW9udGgoKSAlIDMpO1xufVxuXG4vLyBGT1JNQVRUSU5HXG5cbmFkZEZvcm1hdFRva2VuKCdEJywgWydERCcsIDJdLCAnRG8nLCAnZGF0ZScpO1xuXG4vLyBBTElBU0VTXG5cbmFkZFVuaXRBbGlhcygnZGF0ZScsICdEJyk7XG5cbi8vIFBSSU9ST0lUWVxuYWRkVW5pdFByaW9yaXR5KCdkYXRlJywgOSk7XG5cbi8vIFBBUlNJTkdcblxuYWRkUmVnZXhUb2tlbignRCcsICBtYXRjaDF0bzIpO1xuYWRkUmVnZXhUb2tlbignREQnLCBtYXRjaDF0bzIsIG1hdGNoMik7XG5hZGRSZWdleFRva2VuKCdEbycsIGZ1bmN0aW9uIChpc1N0cmljdCwgbG9jYWxlKSB7XG4gICAgcmV0dXJuIGlzU3RyaWN0ID8gbG9jYWxlLl9vcmRpbmFsUGFyc2UgOiBsb2NhbGUuX29yZGluYWxQYXJzZUxlbmllbnQ7XG59KTtcblxuYWRkUGFyc2VUb2tlbihbJ0QnLCAnREQnXSwgREFURSk7XG5hZGRQYXJzZVRva2VuKCdEbycsIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXkpIHtcbiAgICBhcnJheVtEQVRFXSA9IHRvSW50KGlucHV0Lm1hdGNoKG1hdGNoMXRvMilbMF0sIDEwKTtcbn0pO1xuXG4vLyBNT01FTlRTXG5cbnZhciBnZXRTZXREYXlPZk1vbnRoID0gbWFrZUdldFNldCgnRGF0ZScsIHRydWUpO1xuXG4vLyBGT1JNQVRUSU5HXG5cbmFkZEZvcm1hdFRva2VuKCdEREQnLCBbJ0REREQnLCAzXSwgJ0RERG8nLCAnZGF5T2ZZZWFyJyk7XG5cbi8vIEFMSUFTRVNcblxuYWRkVW5pdEFsaWFzKCdkYXlPZlllYXInLCAnREREJyk7XG5cbi8vIFBSSU9SSVRZXG5hZGRVbml0UHJpb3JpdHkoJ2RheU9mWWVhcicsIDQpO1xuXG4vLyBQQVJTSU5HXG5cbmFkZFJlZ2V4VG9rZW4oJ0RERCcsICBtYXRjaDF0bzMpO1xuYWRkUmVnZXhUb2tlbignRERERCcsIG1hdGNoMyk7XG5hZGRQYXJzZVRva2VuKFsnREREJywgJ0REREQnXSwgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnKSB7XG4gICAgY29uZmlnLl9kYXlPZlllYXIgPSB0b0ludChpbnB1dCk7XG59KTtcblxuLy8gSEVMUEVSU1xuXG4vLyBNT01FTlRTXG5cbmZ1bmN0aW9uIGdldFNldERheU9mWWVhciAoaW5wdXQpIHtcbiAgICB2YXIgZGF5T2ZZZWFyID0gTWF0aC5yb3VuZCgodGhpcy5jbG9uZSgpLnN0YXJ0T2YoJ2RheScpIC0gdGhpcy5jbG9uZSgpLnN0YXJ0T2YoJ3llYXInKSkgLyA4NjRlNSkgKyAxO1xuICAgIHJldHVybiBpbnB1dCA9PSBudWxsID8gZGF5T2ZZZWFyIDogdGhpcy5hZGQoKGlucHV0IC0gZGF5T2ZZZWFyKSwgJ2QnKTtcbn1cblxuLy8gRk9STUFUVElOR1xuXG5hZGRGb3JtYXRUb2tlbignbScsIFsnbW0nLCAyXSwgMCwgJ21pbnV0ZScpO1xuXG4vLyBBTElBU0VTXG5cbmFkZFVuaXRBbGlhcygnbWludXRlJywgJ20nKTtcblxuLy8gUFJJT1JJVFlcblxuYWRkVW5pdFByaW9yaXR5KCdtaW51dGUnLCAxNCk7XG5cbi8vIFBBUlNJTkdcblxuYWRkUmVnZXhUb2tlbignbScsICBtYXRjaDF0bzIpO1xuYWRkUmVnZXhUb2tlbignbW0nLCBtYXRjaDF0bzIsIG1hdGNoMik7XG5hZGRQYXJzZVRva2VuKFsnbScsICdtbSddLCBNSU5VVEUpO1xuXG4vLyBNT01FTlRTXG5cbnZhciBnZXRTZXRNaW51dGUgPSBtYWtlR2V0U2V0KCdNaW51dGVzJywgZmFsc2UpO1xuXG4vLyBGT1JNQVRUSU5HXG5cbmFkZEZvcm1hdFRva2VuKCdzJywgWydzcycsIDJdLCAwLCAnc2Vjb25kJyk7XG5cbi8vIEFMSUFTRVNcblxuYWRkVW5pdEFsaWFzKCdzZWNvbmQnLCAncycpO1xuXG4vLyBQUklPUklUWVxuXG5hZGRVbml0UHJpb3JpdHkoJ3NlY29uZCcsIDE1KTtcblxuLy8gUEFSU0lOR1xuXG5hZGRSZWdleFRva2VuKCdzJywgIG1hdGNoMXRvMik7XG5hZGRSZWdleFRva2VuKCdzcycsIG1hdGNoMXRvMiwgbWF0Y2gyKTtcbmFkZFBhcnNlVG9rZW4oWydzJywgJ3NzJ10sIFNFQ09ORCk7XG5cbi8vIE1PTUVOVFNcblxudmFyIGdldFNldFNlY29uZCA9IG1ha2VHZXRTZXQoJ1NlY29uZHMnLCBmYWxzZSk7XG5cbi8vIEZPUk1BVFRJTkdcblxuYWRkRm9ybWF0VG9rZW4oJ1MnLCAwLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIH5+KHRoaXMubWlsbGlzZWNvbmQoKSAvIDEwMCk7XG59KTtcblxuYWRkRm9ybWF0VG9rZW4oMCwgWydTUycsIDJdLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIH5+KHRoaXMubWlsbGlzZWNvbmQoKSAvIDEwKTtcbn0pO1xuXG5hZGRGb3JtYXRUb2tlbigwLCBbJ1NTUycsIDNdLCAwLCAnbWlsbGlzZWNvbmQnKTtcbmFkZEZvcm1hdFRva2VuKDAsIFsnU1NTUycsIDRdLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMubWlsbGlzZWNvbmQoKSAqIDEwO1xufSk7XG5hZGRGb3JtYXRUb2tlbigwLCBbJ1NTU1NTJywgNV0sIDAsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5taWxsaXNlY29uZCgpICogMTAwO1xufSk7XG5hZGRGb3JtYXRUb2tlbigwLCBbJ1NTU1NTUycsIDZdLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMubWlsbGlzZWNvbmQoKSAqIDEwMDA7XG59KTtcbmFkZEZvcm1hdFRva2VuKDAsIFsnU1NTU1NTUycsIDddLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMubWlsbGlzZWNvbmQoKSAqIDEwMDAwO1xufSk7XG5hZGRGb3JtYXRUb2tlbigwLCBbJ1NTU1NTU1NTJywgOF0sIDAsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5taWxsaXNlY29uZCgpICogMTAwMDAwO1xufSk7XG5hZGRGb3JtYXRUb2tlbigwLCBbJ1NTU1NTU1NTUycsIDldLCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMubWlsbGlzZWNvbmQoKSAqIDEwMDAwMDA7XG59KTtcblxuXG4vLyBBTElBU0VTXG5cbmFkZFVuaXRBbGlhcygnbWlsbGlzZWNvbmQnLCAnbXMnKTtcblxuLy8gUFJJT1JJVFlcblxuYWRkVW5pdFByaW9yaXR5KCdtaWxsaXNlY29uZCcsIDE2KTtcblxuLy8gUEFSU0lOR1xuXG5hZGRSZWdleFRva2VuKCdTJywgICAgbWF0Y2gxdG8zLCBtYXRjaDEpO1xuYWRkUmVnZXhUb2tlbignU1MnLCAgIG1hdGNoMXRvMywgbWF0Y2gyKTtcbmFkZFJlZ2V4VG9rZW4oJ1NTUycsICBtYXRjaDF0bzMsIG1hdGNoMyk7XG5cbnZhciB0b2tlbjtcbmZvciAodG9rZW4gPSAnU1NTUyc7IHRva2VuLmxlbmd0aCA8PSA5OyB0b2tlbiArPSAnUycpIHtcbiAgICBhZGRSZWdleFRva2VuKHRva2VuLCBtYXRjaFVuc2lnbmVkKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VNcyhpbnB1dCwgYXJyYXkpIHtcbiAgICBhcnJheVtNSUxMSVNFQ09ORF0gPSB0b0ludCgoJzAuJyArIGlucHV0KSAqIDEwMDApO1xufVxuXG5mb3IgKHRva2VuID0gJ1MnOyB0b2tlbi5sZW5ndGggPD0gOTsgdG9rZW4gKz0gJ1MnKSB7XG4gICAgYWRkUGFyc2VUb2tlbih0b2tlbiwgcGFyc2VNcyk7XG59XG4vLyBNT01FTlRTXG5cbnZhciBnZXRTZXRNaWxsaXNlY29uZCA9IG1ha2VHZXRTZXQoJ01pbGxpc2Vjb25kcycsIGZhbHNlKTtcblxuLy8gRk9STUFUVElOR1xuXG5hZGRGb3JtYXRUb2tlbigneicsICAwLCAwLCAnem9uZUFiYnInKTtcbmFkZEZvcm1hdFRva2VuKCd6eicsIDAsIDAsICd6b25lTmFtZScpO1xuXG4vLyBNT01FTlRTXG5cbmZ1bmN0aW9uIGdldFpvbmVBYmJyICgpIHtcbiAgICByZXR1cm4gdGhpcy5faXNVVEMgPyAnVVRDJyA6ICcnO1xufVxuXG5mdW5jdGlvbiBnZXRab25lTmFtZSAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2lzVVRDID8gJ0Nvb3JkaW5hdGVkIFVuaXZlcnNhbCBUaW1lJyA6ICcnO1xufVxuXG52YXIgcHJvdG8gPSBNb21lbnQucHJvdG90eXBlO1xuXG5wcm90by5hZGQgICAgICAgICAgICAgICA9IGFkZDtcbnByb3RvLmNhbGVuZGFyICAgICAgICAgID0gY2FsZW5kYXIkMTtcbnByb3RvLmNsb25lICAgICAgICAgICAgID0gY2xvbmU7XG5wcm90by5kaWZmICAgICAgICAgICAgICA9IGRpZmY7XG5wcm90by5lbmRPZiAgICAgICAgICAgICA9IGVuZE9mO1xucHJvdG8uZm9ybWF0ICAgICAgICAgICAgPSBmb3JtYXQ7XG5wcm90by5mcm9tICAgICAgICAgICAgICA9IGZyb207XG5wcm90by5mcm9tTm93ICAgICAgICAgICA9IGZyb21Ob3c7XG5wcm90by50byAgICAgICAgICAgICAgICA9IHRvO1xucHJvdG8udG9Ob3cgICAgICAgICAgICAgPSB0b05vdztcbnByb3RvLmdldCAgICAgICAgICAgICAgID0gc3RyaW5nR2V0O1xucHJvdG8uaW52YWxpZEF0ICAgICAgICAgPSBpbnZhbGlkQXQ7XG5wcm90by5pc0FmdGVyICAgICAgICAgICA9IGlzQWZ0ZXI7XG5wcm90by5pc0JlZm9yZSAgICAgICAgICA9IGlzQmVmb3JlO1xucHJvdG8uaXNCZXR3ZWVuICAgICAgICAgPSBpc0JldHdlZW47XG5wcm90by5pc1NhbWUgICAgICAgICAgICA9IGlzU2FtZTtcbnByb3RvLmlzU2FtZU9yQWZ0ZXIgICAgID0gaXNTYW1lT3JBZnRlcjtcbnByb3RvLmlzU2FtZU9yQmVmb3JlICAgID0gaXNTYW1lT3JCZWZvcmU7XG5wcm90by5pc1ZhbGlkICAgICAgICAgICA9IGlzVmFsaWQkMTtcbnByb3RvLmxhbmcgICAgICAgICAgICAgID0gbGFuZztcbnByb3RvLmxvY2FsZSAgICAgICAgICAgID0gbG9jYWxlO1xucHJvdG8ubG9jYWxlRGF0YSAgICAgICAgPSBsb2NhbGVEYXRhO1xucHJvdG8ubWF4ICAgICAgICAgICAgICAgPSBwcm90b3R5cGVNYXg7XG5wcm90by5taW4gICAgICAgICAgICAgICA9IHByb3RvdHlwZU1pbjtcbnByb3RvLnBhcnNpbmdGbGFncyAgICAgID0gcGFyc2luZ0ZsYWdzO1xucHJvdG8uc2V0ICAgICAgICAgICAgICAgPSBzdHJpbmdTZXQ7XG5wcm90by5zdGFydE9mICAgICAgICAgICA9IHN0YXJ0T2Y7XG5wcm90by5zdWJ0cmFjdCAgICAgICAgICA9IHN1YnRyYWN0O1xucHJvdG8udG9BcnJheSAgICAgICAgICAgPSB0b0FycmF5O1xucHJvdG8udG9PYmplY3QgICAgICAgICAgPSB0b09iamVjdDtcbnByb3RvLnRvRGF0ZSAgICAgICAgICAgID0gdG9EYXRlO1xucHJvdG8udG9JU09TdHJpbmcgICAgICAgPSB0b0lTT1N0cmluZztcbnByb3RvLmluc3BlY3QgICAgICAgICAgID0gaW5zcGVjdDtcbnByb3RvLnRvSlNPTiAgICAgICAgICAgID0gdG9KU09OO1xucHJvdG8udG9TdHJpbmcgICAgICAgICAgPSB0b1N0cmluZztcbnByb3RvLnVuaXggICAgICAgICAgICAgID0gdW5peDtcbnByb3RvLnZhbHVlT2YgICAgICAgICAgID0gdmFsdWVPZjtcbnByb3RvLmNyZWF0aW9uRGF0YSAgICAgID0gY3JlYXRpb25EYXRhO1xuXG4vLyBZZWFyXG5wcm90by55ZWFyICAgICAgID0gZ2V0U2V0WWVhcjtcbnByb3RvLmlzTGVhcFllYXIgPSBnZXRJc0xlYXBZZWFyO1xuXG4vLyBXZWVrIFllYXJcbnByb3RvLndlZWtZZWFyICAgID0gZ2V0U2V0V2Vla1llYXI7XG5wcm90by5pc29XZWVrWWVhciA9IGdldFNldElTT1dlZWtZZWFyO1xuXG4vLyBRdWFydGVyXG5wcm90by5xdWFydGVyID0gcHJvdG8ucXVhcnRlcnMgPSBnZXRTZXRRdWFydGVyO1xuXG4vLyBNb250aFxucHJvdG8ubW9udGggICAgICAgPSBnZXRTZXRNb250aDtcbnByb3RvLmRheXNJbk1vbnRoID0gZ2V0RGF5c0luTW9udGg7XG5cbi8vIFdlZWtcbnByb3RvLndlZWsgICAgICAgICAgID0gcHJvdG8ud2Vla3MgICAgICAgID0gZ2V0U2V0V2VlaztcbnByb3RvLmlzb1dlZWsgICAgICAgID0gcHJvdG8uaXNvV2Vla3MgICAgID0gZ2V0U2V0SVNPV2VlaztcbnByb3RvLndlZWtzSW5ZZWFyICAgID0gZ2V0V2Vla3NJblllYXI7XG5wcm90by5pc29XZWVrc0luWWVhciA9IGdldElTT1dlZWtzSW5ZZWFyO1xuXG4vLyBEYXlcbnByb3RvLmRhdGUgICAgICAgPSBnZXRTZXREYXlPZk1vbnRoO1xucHJvdG8uZGF5ICAgICAgICA9IHByb3RvLmRheXMgICAgICAgICAgICAgPSBnZXRTZXREYXlPZldlZWs7XG5wcm90by53ZWVrZGF5ICAgID0gZ2V0U2V0TG9jYWxlRGF5T2ZXZWVrO1xucHJvdG8uaXNvV2Vla2RheSA9IGdldFNldElTT0RheU9mV2VlaztcbnByb3RvLmRheU9mWWVhciAgPSBnZXRTZXREYXlPZlllYXI7XG5cbi8vIEhvdXJcbnByb3RvLmhvdXIgPSBwcm90by5ob3VycyA9IGdldFNldEhvdXI7XG5cbi8vIE1pbnV0ZVxucHJvdG8ubWludXRlID0gcHJvdG8ubWludXRlcyA9IGdldFNldE1pbnV0ZTtcblxuLy8gU2Vjb25kXG5wcm90by5zZWNvbmQgPSBwcm90by5zZWNvbmRzID0gZ2V0U2V0U2Vjb25kO1xuXG4vLyBNaWxsaXNlY29uZFxucHJvdG8ubWlsbGlzZWNvbmQgPSBwcm90by5taWxsaXNlY29uZHMgPSBnZXRTZXRNaWxsaXNlY29uZDtcblxuLy8gT2Zmc2V0XG5wcm90by51dGNPZmZzZXQgICAgICAgICAgICA9IGdldFNldE9mZnNldDtcbnByb3RvLnV0YyAgICAgICAgICAgICAgICAgID0gc2V0T2Zmc2V0VG9VVEM7XG5wcm90by5sb2NhbCAgICAgICAgICAgICAgICA9IHNldE9mZnNldFRvTG9jYWw7XG5wcm90by5wYXJzZVpvbmUgICAgICAgICAgICA9IHNldE9mZnNldFRvUGFyc2VkT2Zmc2V0O1xucHJvdG8uaGFzQWxpZ25lZEhvdXJPZmZzZXQgPSBoYXNBbGlnbmVkSG91ck9mZnNldDtcbnByb3RvLmlzRFNUICAgICAgICAgICAgICAgID0gaXNEYXlsaWdodFNhdmluZ1RpbWU7XG5wcm90by5pc0xvY2FsICAgICAgICAgICAgICA9IGlzTG9jYWw7XG5wcm90by5pc1V0Y09mZnNldCAgICAgICAgICA9IGlzVXRjT2Zmc2V0O1xucHJvdG8uaXNVdGMgICAgICAgICAgICAgICAgPSBpc1V0YztcbnByb3RvLmlzVVRDICAgICAgICAgICAgICAgID0gaXNVdGM7XG5cbi8vIFRpbWV6b25lXG5wcm90by56b25lQWJiciA9IGdldFpvbmVBYmJyO1xucHJvdG8uem9uZU5hbWUgPSBnZXRab25lTmFtZTtcblxuLy8gRGVwcmVjYXRpb25zXG5wcm90by5kYXRlcyAgPSBkZXByZWNhdGUoJ2RhdGVzIGFjY2Vzc29yIGlzIGRlcHJlY2F0ZWQuIFVzZSBkYXRlIGluc3RlYWQuJywgZ2V0U2V0RGF5T2ZNb250aCk7XG5wcm90by5tb250aHMgPSBkZXByZWNhdGUoJ21vbnRocyBhY2Nlc3NvciBpcyBkZXByZWNhdGVkLiBVc2UgbW9udGggaW5zdGVhZCcsIGdldFNldE1vbnRoKTtcbnByb3RvLnllYXJzICA9IGRlcHJlY2F0ZSgneWVhcnMgYWNjZXNzb3IgaXMgZGVwcmVjYXRlZC4gVXNlIHllYXIgaW5zdGVhZCcsIGdldFNldFllYXIpO1xucHJvdG8uem9uZSAgID0gZGVwcmVjYXRlKCdtb21lbnQoKS56b25lIGlzIGRlcHJlY2F0ZWQsIHVzZSBtb21lbnQoKS51dGNPZmZzZXQgaW5zdGVhZC4gaHR0cDovL21vbWVudGpzLmNvbS9ndWlkZXMvIy93YXJuaW5ncy96b25lLycsIGdldFNldFpvbmUpO1xucHJvdG8uaXNEU1RTaGlmdGVkID0gZGVwcmVjYXRlKCdpc0RTVFNoaWZ0ZWQgaXMgZGVwcmVjYXRlZC4gU2VlIGh0dHA6Ly9tb21lbnRqcy5jb20vZ3VpZGVzLyMvd2FybmluZ3MvZHN0LXNoaWZ0ZWQvIGZvciBtb3JlIGluZm9ybWF0aW9uJywgaXNEYXlsaWdodFNhdmluZ1RpbWVTaGlmdGVkKTtcblxuZnVuY3Rpb24gY3JlYXRlVW5peCAoaW5wdXQpIHtcbiAgICByZXR1cm4gY3JlYXRlTG9jYWwoaW5wdXQgKiAxMDAwKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlSW5ab25lICgpIHtcbiAgICByZXR1cm4gY3JlYXRlTG9jYWwuYXBwbHkobnVsbCwgYXJndW1lbnRzKS5wYXJzZVpvbmUoKTtcbn1cblxuZnVuY3Rpb24gcHJlUGFyc2VQb3N0Rm9ybWF0IChzdHJpbmcpIHtcbiAgICByZXR1cm4gc3RyaW5nO1xufVxuXG52YXIgcHJvdG8kMSA9IExvY2FsZS5wcm90b3R5cGU7XG5cbnByb3RvJDEuY2FsZW5kYXIgICAgICAgID0gY2FsZW5kYXI7XG5wcm90byQxLmxvbmdEYXRlRm9ybWF0ICA9IGxvbmdEYXRlRm9ybWF0O1xucHJvdG8kMS5pbnZhbGlkRGF0ZSAgICAgPSBpbnZhbGlkRGF0ZTtcbnByb3RvJDEub3JkaW5hbCAgICAgICAgID0gb3JkaW5hbDtcbnByb3RvJDEucHJlcGFyc2UgICAgICAgID0gcHJlUGFyc2VQb3N0Rm9ybWF0O1xucHJvdG8kMS5wb3N0Zm9ybWF0ICAgICAgPSBwcmVQYXJzZVBvc3RGb3JtYXQ7XG5wcm90byQxLnJlbGF0aXZlVGltZSAgICA9IHJlbGF0aXZlVGltZTtcbnByb3RvJDEucGFzdEZ1dHVyZSAgICAgID0gcGFzdEZ1dHVyZTtcbnByb3RvJDEuc2V0ICAgICAgICAgICAgID0gc2V0O1xuXG4vLyBNb250aFxucHJvdG8kMS5tb250aHMgICAgICAgICAgICA9ICAgICAgICBsb2NhbGVNb250aHM7XG5wcm90byQxLm1vbnRoc1Nob3J0ICAgICAgID0gICAgICAgIGxvY2FsZU1vbnRoc1Nob3J0O1xucHJvdG8kMS5tb250aHNQYXJzZSAgICAgICA9ICAgICAgICBsb2NhbGVNb250aHNQYXJzZTtcbnByb3RvJDEubW9udGhzUmVnZXggICAgICAgPSBtb250aHNSZWdleDtcbnByb3RvJDEubW9udGhzU2hvcnRSZWdleCAgPSBtb250aHNTaG9ydFJlZ2V4O1xuXG4vLyBXZWVrXG5wcm90byQxLndlZWsgPSBsb2NhbGVXZWVrO1xucHJvdG8kMS5maXJzdERheU9mWWVhciA9IGxvY2FsZUZpcnN0RGF5T2ZZZWFyO1xucHJvdG8kMS5maXJzdERheU9mV2VlayA9IGxvY2FsZUZpcnN0RGF5T2ZXZWVrO1xuXG4vLyBEYXkgb2YgV2Vla1xucHJvdG8kMS53ZWVrZGF5cyAgICAgICA9ICAgICAgICBsb2NhbGVXZWVrZGF5cztcbnByb3RvJDEud2Vla2RheXNNaW4gICAgPSAgICAgICAgbG9jYWxlV2Vla2RheXNNaW47XG5wcm90byQxLndlZWtkYXlzU2hvcnQgID0gICAgICAgIGxvY2FsZVdlZWtkYXlzU2hvcnQ7XG5wcm90byQxLndlZWtkYXlzUGFyc2UgID0gICAgICAgIGxvY2FsZVdlZWtkYXlzUGFyc2U7XG5cbnByb3RvJDEud2Vla2RheXNSZWdleCAgICAgICA9ICAgICAgICB3ZWVrZGF5c1JlZ2V4O1xucHJvdG8kMS53ZWVrZGF5c1Nob3J0UmVnZXggID0gICAgICAgIHdlZWtkYXlzU2hvcnRSZWdleDtcbnByb3RvJDEud2Vla2RheXNNaW5SZWdleCAgICA9ICAgICAgICB3ZWVrZGF5c01pblJlZ2V4O1xuXG4vLyBIb3Vyc1xucHJvdG8kMS5pc1BNID0gbG9jYWxlSXNQTTtcbnByb3RvJDEubWVyaWRpZW0gPSBsb2NhbGVNZXJpZGllbTtcblxuZnVuY3Rpb24gZ2V0JDEgKGZvcm1hdCwgaW5kZXgsIGZpZWxkLCBzZXR0ZXIpIHtcbiAgICB2YXIgbG9jYWxlID0gZ2V0TG9jYWxlKCk7XG4gICAgdmFyIHV0YyA9IGNyZWF0ZVVUQygpLnNldChzZXR0ZXIsIGluZGV4KTtcbiAgICByZXR1cm4gbG9jYWxlW2ZpZWxkXSh1dGMsIGZvcm1hdCk7XG59XG5cbmZ1bmN0aW9uIGxpc3RNb250aHNJbXBsIChmb3JtYXQsIGluZGV4LCBmaWVsZCkge1xuICAgIGlmIChpc051bWJlcihmb3JtYXQpKSB7XG4gICAgICAgIGluZGV4ID0gZm9ybWF0O1xuICAgICAgICBmb3JtYXQgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgZm9ybWF0ID0gZm9ybWF0IHx8ICcnO1xuXG4gICAgaWYgKGluZGV4ICE9IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGdldCQxKGZvcm1hdCwgaW5kZXgsIGZpZWxkLCAnbW9udGgnKTtcbiAgICB9XG5cbiAgICB2YXIgaTtcbiAgICB2YXIgb3V0ID0gW107XG4gICAgZm9yIChpID0gMDsgaSA8IDEyOyBpKyspIHtcbiAgICAgICAgb3V0W2ldID0gZ2V0JDEoZm9ybWF0LCBpLCBmaWVsZCwgJ21vbnRoJyk7XG4gICAgfVxuICAgIHJldHVybiBvdXQ7XG59XG5cbi8vICgpXG4vLyAoNSlcbi8vIChmbXQsIDUpXG4vLyAoZm10KVxuLy8gKHRydWUpXG4vLyAodHJ1ZSwgNSlcbi8vICh0cnVlLCBmbXQsIDUpXG4vLyAodHJ1ZSwgZm10KVxuZnVuY3Rpb24gbGlzdFdlZWtkYXlzSW1wbCAobG9jYWxlU29ydGVkLCBmb3JtYXQsIGluZGV4LCBmaWVsZCkge1xuICAgIGlmICh0eXBlb2YgbG9jYWxlU29ydGVkID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgaWYgKGlzTnVtYmVyKGZvcm1hdCkpIHtcbiAgICAgICAgICAgIGluZGV4ID0gZm9ybWF0O1xuICAgICAgICAgICAgZm9ybWF0ID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9ybWF0ID0gZm9ybWF0IHx8ICcnO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZvcm1hdCA9IGxvY2FsZVNvcnRlZDtcbiAgICAgICAgaW5kZXggPSBmb3JtYXQ7XG4gICAgICAgIGxvY2FsZVNvcnRlZCA9IGZhbHNlO1xuXG4gICAgICAgIGlmIChpc051bWJlcihmb3JtYXQpKSB7XG4gICAgICAgICAgICBpbmRleCA9IGZvcm1hdDtcbiAgICAgICAgICAgIGZvcm1hdCA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvcm1hdCA9IGZvcm1hdCB8fCAnJztcbiAgICB9XG5cbiAgICB2YXIgbG9jYWxlID0gZ2V0TG9jYWxlKCksXG4gICAgICAgIHNoaWZ0ID0gbG9jYWxlU29ydGVkID8gbG9jYWxlLl93ZWVrLmRvdyA6IDA7XG5cbiAgICBpZiAoaW5kZXggIT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gZ2V0JDEoZm9ybWF0LCAoaW5kZXggKyBzaGlmdCkgJSA3LCBmaWVsZCwgJ2RheScpO1xuICAgIH1cblxuICAgIHZhciBpO1xuICAgIHZhciBvdXQgPSBbXTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgNzsgaSsrKSB7XG4gICAgICAgIG91dFtpXSA9IGdldCQxKGZvcm1hdCwgKGkgKyBzaGlmdCkgJSA3LCBmaWVsZCwgJ2RheScpO1xuICAgIH1cbiAgICByZXR1cm4gb3V0O1xufVxuXG5mdW5jdGlvbiBsaXN0TW9udGhzIChmb3JtYXQsIGluZGV4KSB7XG4gICAgcmV0dXJuIGxpc3RNb250aHNJbXBsKGZvcm1hdCwgaW5kZXgsICdtb250aHMnKTtcbn1cblxuZnVuY3Rpb24gbGlzdE1vbnRoc1Nob3J0IChmb3JtYXQsIGluZGV4KSB7XG4gICAgcmV0dXJuIGxpc3RNb250aHNJbXBsKGZvcm1hdCwgaW5kZXgsICdtb250aHNTaG9ydCcpO1xufVxuXG5mdW5jdGlvbiBsaXN0V2Vla2RheXMgKGxvY2FsZVNvcnRlZCwgZm9ybWF0LCBpbmRleCkge1xuICAgIHJldHVybiBsaXN0V2Vla2RheXNJbXBsKGxvY2FsZVNvcnRlZCwgZm9ybWF0LCBpbmRleCwgJ3dlZWtkYXlzJyk7XG59XG5cbmZ1bmN0aW9uIGxpc3RXZWVrZGF5c1Nob3J0IChsb2NhbGVTb3J0ZWQsIGZvcm1hdCwgaW5kZXgpIHtcbiAgICByZXR1cm4gbGlzdFdlZWtkYXlzSW1wbChsb2NhbGVTb3J0ZWQsIGZvcm1hdCwgaW5kZXgsICd3ZWVrZGF5c1Nob3J0Jyk7XG59XG5cbmZ1bmN0aW9uIGxpc3RXZWVrZGF5c01pbiAobG9jYWxlU29ydGVkLCBmb3JtYXQsIGluZGV4KSB7XG4gICAgcmV0dXJuIGxpc3RXZWVrZGF5c0ltcGwobG9jYWxlU29ydGVkLCBmb3JtYXQsIGluZGV4LCAnd2Vla2RheXNNaW4nKTtcbn1cblxuZ2V0U2V0R2xvYmFsTG9jYWxlKCdlbicsIHtcbiAgICBvcmRpbmFsUGFyc2U6IC9cXGR7MSwyfSh0aHxzdHxuZHxyZCkvLFxuICAgIG9yZGluYWwgOiBmdW5jdGlvbiAobnVtYmVyKSB7XG4gICAgICAgIHZhciBiID0gbnVtYmVyICUgMTAsXG4gICAgICAgICAgICBvdXRwdXQgPSAodG9JbnQobnVtYmVyICUgMTAwIC8gMTApID09PSAxKSA/ICd0aCcgOlxuICAgICAgICAgICAgKGIgPT09IDEpID8gJ3N0JyA6XG4gICAgICAgICAgICAoYiA9PT0gMikgPyAnbmQnIDpcbiAgICAgICAgICAgIChiID09PSAzKSA/ICdyZCcgOiAndGgnO1xuICAgICAgICByZXR1cm4gbnVtYmVyICsgb3V0cHV0O1xuICAgIH1cbn0pO1xuXG4vLyBTaWRlIGVmZmVjdCBpbXBvcnRzXG5ob29rcy5sYW5nID0gZGVwcmVjYXRlKCdtb21lbnQubGFuZyBpcyBkZXByZWNhdGVkLiBVc2UgbW9tZW50LmxvY2FsZSBpbnN0ZWFkLicsIGdldFNldEdsb2JhbExvY2FsZSk7XG5ob29rcy5sYW5nRGF0YSA9IGRlcHJlY2F0ZSgnbW9tZW50LmxhbmdEYXRhIGlzIGRlcHJlY2F0ZWQuIFVzZSBtb21lbnQubG9jYWxlRGF0YSBpbnN0ZWFkLicsIGdldExvY2FsZSk7XG5cbnZhciBtYXRoQWJzID0gTWF0aC5hYnM7XG5cbmZ1bmN0aW9uIGFicyAoKSB7XG4gICAgdmFyIGRhdGEgICAgICAgICAgID0gdGhpcy5fZGF0YTtcblxuICAgIHRoaXMuX21pbGxpc2Vjb25kcyA9IG1hdGhBYnModGhpcy5fbWlsbGlzZWNvbmRzKTtcbiAgICB0aGlzLl9kYXlzICAgICAgICAgPSBtYXRoQWJzKHRoaXMuX2RheXMpO1xuICAgIHRoaXMuX21vbnRocyAgICAgICA9IG1hdGhBYnModGhpcy5fbW9udGhzKTtcblxuICAgIGRhdGEubWlsbGlzZWNvbmRzICA9IG1hdGhBYnMoZGF0YS5taWxsaXNlY29uZHMpO1xuICAgIGRhdGEuc2Vjb25kcyAgICAgICA9IG1hdGhBYnMoZGF0YS5zZWNvbmRzKTtcbiAgICBkYXRhLm1pbnV0ZXMgICAgICAgPSBtYXRoQWJzKGRhdGEubWludXRlcyk7XG4gICAgZGF0YS5ob3VycyAgICAgICAgID0gbWF0aEFicyhkYXRhLmhvdXJzKTtcbiAgICBkYXRhLm1vbnRocyAgICAgICAgPSBtYXRoQWJzKGRhdGEubW9udGhzKTtcbiAgICBkYXRhLnllYXJzICAgICAgICAgPSBtYXRoQWJzKGRhdGEueWVhcnMpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG59XG5cbmZ1bmN0aW9uIGFkZFN1YnRyYWN0JDEgKGR1cmF0aW9uLCBpbnB1dCwgdmFsdWUsIGRpcmVjdGlvbikge1xuICAgIHZhciBvdGhlciA9IGNyZWF0ZUR1cmF0aW9uKGlucHV0LCB2YWx1ZSk7XG5cbiAgICBkdXJhdGlvbi5fbWlsbGlzZWNvbmRzICs9IGRpcmVjdGlvbiAqIG90aGVyLl9taWxsaXNlY29uZHM7XG4gICAgZHVyYXRpb24uX2RheXMgICAgICAgICArPSBkaXJlY3Rpb24gKiBvdGhlci5fZGF5cztcbiAgICBkdXJhdGlvbi5fbW9udGhzICAgICAgICs9IGRpcmVjdGlvbiAqIG90aGVyLl9tb250aHM7XG5cbiAgICByZXR1cm4gZHVyYXRpb24uX2J1YmJsZSgpO1xufVxuXG4vLyBzdXBwb3J0cyBvbmx5IDIuMC1zdHlsZSBhZGQoMSwgJ3MnKSBvciBhZGQoZHVyYXRpb24pXG5mdW5jdGlvbiBhZGQkMSAoaW5wdXQsIHZhbHVlKSB7XG4gICAgcmV0dXJuIGFkZFN1YnRyYWN0JDEodGhpcywgaW5wdXQsIHZhbHVlLCAxKTtcbn1cblxuLy8gc3VwcG9ydHMgb25seSAyLjAtc3R5bGUgc3VidHJhY3QoMSwgJ3MnKSBvciBzdWJ0cmFjdChkdXJhdGlvbilcbmZ1bmN0aW9uIHN1YnRyYWN0JDEgKGlucHV0LCB2YWx1ZSkge1xuICAgIHJldHVybiBhZGRTdWJ0cmFjdCQxKHRoaXMsIGlucHV0LCB2YWx1ZSwgLTEpO1xufVxuXG5mdW5jdGlvbiBhYnNDZWlsIChudW1iZXIpIHtcbiAgICBpZiAobnVtYmVyIDwgMCkge1xuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihudW1iZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBNYXRoLmNlaWwobnVtYmVyKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGJ1YmJsZSAoKSB7XG4gICAgdmFyIG1pbGxpc2Vjb25kcyA9IHRoaXMuX21pbGxpc2Vjb25kcztcbiAgICB2YXIgZGF5cyAgICAgICAgID0gdGhpcy5fZGF5cztcbiAgICB2YXIgbW9udGhzICAgICAgID0gdGhpcy5fbW9udGhzO1xuICAgIHZhciBkYXRhICAgICAgICAgPSB0aGlzLl9kYXRhO1xuICAgIHZhciBzZWNvbmRzLCBtaW51dGVzLCBob3VycywgeWVhcnMsIG1vbnRoc0Zyb21EYXlzO1xuXG4gICAgLy8gaWYgd2UgaGF2ZSBhIG1peCBvZiBwb3NpdGl2ZSBhbmQgbmVnYXRpdmUgdmFsdWVzLCBidWJibGUgZG93biBmaXJzdFxuICAgIC8vIGNoZWNrOiBodHRwczovL2dpdGh1Yi5jb20vbW9tZW50L21vbWVudC9pc3N1ZXMvMjE2NlxuICAgIGlmICghKChtaWxsaXNlY29uZHMgPj0gMCAmJiBkYXlzID49IDAgJiYgbW9udGhzID49IDApIHx8XG4gICAgICAgICAgICAobWlsbGlzZWNvbmRzIDw9IDAgJiYgZGF5cyA8PSAwICYmIG1vbnRocyA8PSAwKSkpIHtcbiAgICAgICAgbWlsbGlzZWNvbmRzICs9IGFic0NlaWwobW9udGhzVG9EYXlzKG1vbnRocykgKyBkYXlzKSAqIDg2NGU1O1xuICAgICAgICBkYXlzID0gMDtcbiAgICAgICAgbW9udGhzID0gMDtcbiAgICB9XG5cbiAgICAvLyBUaGUgZm9sbG93aW5nIGNvZGUgYnViYmxlcyB1cCB2YWx1ZXMsIHNlZSB0aGUgdGVzdHMgZm9yXG4gICAgLy8gZXhhbXBsZXMgb2Ygd2hhdCB0aGF0IG1lYW5zLlxuICAgIGRhdGEubWlsbGlzZWNvbmRzID0gbWlsbGlzZWNvbmRzICUgMTAwMDtcblxuICAgIHNlY29uZHMgICAgICAgICAgID0gYWJzRmxvb3IobWlsbGlzZWNvbmRzIC8gMTAwMCk7XG4gICAgZGF0YS5zZWNvbmRzICAgICAgPSBzZWNvbmRzICUgNjA7XG5cbiAgICBtaW51dGVzICAgICAgICAgICA9IGFic0Zsb29yKHNlY29uZHMgLyA2MCk7XG4gICAgZGF0YS5taW51dGVzICAgICAgPSBtaW51dGVzICUgNjA7XG5cbiAgICBob3VycyAgICAgICAgICAgICA9IGFic0Zsb29yKG1pbnV0ZXMgLyA2MCk7XG4gICAgZGF0YS5ob3VycyAgICAgICAgPSBob3VycyAlIDI0O1xuXG4gICAgZGF5cyArPSBhYnNGbG9vcihob3VycyAvIDI0KTtcblxuICAgIC8vIGNvbnZlcnQgZGF5cyB0byBtb250aHNcbiAgICBtb250aHNGcm9tRGF5cyA9IGFic0Zsb29yKGRheXNUb01vbnRocyhkYXlzKSk7XG4gICAgbW9udGhzICs9IG1vbnRoc0Zyb21EYXlzO1xuICAgIGRheXMgLT0gYWJzQ2VpbChtb250aHNUb0RheXMobW9udGhzRnJvbURheXMpKTtcblxuICAgIC8vIDEyIG1vbnRocyAtPiAxIHllYXJcbiAgICB5ZWFycyA9IGFic0Zsb29yKG1vbnRocyAvIDEyKTtcbiAgICBtb250aHMgJT0gMTI7XG5cbiAgICBkYXRhLmRheXMgICA9IGRheXM7XG4gICAgZGF0YS5tb250aHMgPSBtb250aHM7XG4gICAgZGF0YS55ZWFycyAgPSB5ZWFycztcblxuICAgIHJldHVybiB0aGlzO1xufVxuXG5mdW5jdGlvbiBkYXlzVG9Nb250aHMgKGRheXMpIHtcbiAgICAvLyA0MDAgeWVhcnMgaGF2ZSAxNDYwOTcgZGF5cyAodGFraW5nIGludG8gYWNjb3VudCBsZWFwIHllYXIgcnVsZXMpXG4gICAgLy8gNDAwIHllYXJzIGhhdmUgMTIgbW9udGhzID09PSA0ODAwXG4gICAgcmV0dXJuIGRheXMgKiA0ODAwIC8gMTQ2MDk3O1xufVxuXG5mdW5jdGlvbiBtb250aHNUb0RheXMgKG1vbnRocykge1xuICAgIC8vIHRoZSByZXZlcnNlIG9mIGRheXNUb01vbnRoc1xuICAgIHJldHVybiBtb250aHMgKiAxNDYwOTcgLyA0ODAwO1xufVxuXG5mdW5jdGlvbiBhcyAodW5pdHMpIHtcbiAgICB2YXIgZGF5cztcbiAgICB2YXIgbW9udGhzO1xuICAgIHZhciBtaWxsaXNlY29uZHMgPSB0aGlzLl9taWxsaXNlY29uZHM7XG5cbiAgICB1bml0cyA9IG5vcm1hbGl6ZVVuaXRzKHVuaXRzKTtcblxuICAgIGlmICh1bml0cyA9PT0gJ21vbnRoJyB8fCB1bml0cyA9PT0gJ3llYXInKSB7XG4gICAgICAgIGRheXMgICA9IHRoaXMuX2RheXMgICArIG1pbGxpc2Vjb25kcyAvIDg2NGU1O1xuICAgICAgICBtb250aHMgPSB0aGlzLl9tb250aHMgKyBkYXlzVG9Nb250aHMoZGF5cyk7XG4gICAgICAgIHJldHVybiB1bml0cyA9PT0gJ21vbnRoJyA/IG1vbnRocyA6IG1vbnRocyAvIDEyO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGhhbmRsZSBtaWxsaXNlY29uZHMgc2VwYXJhdGVseSBiZWNhdXNlIG9mIGZsb2F0aW5nIHBvaW50IG1hdGggZXJyb3JzIChpc3N1ZSAjMTg2NylcbiAgICAgICAgZGF5cyA9IHRoaXMuX2RheXMgKyBNYXRoLnJvdW5kKG1vbnRoc1RvRGF5cyh0aGlzLl9tb250aHMpKTtcbiAgICAgICAgc3dpdGNoICh1bml0cykge1xuICAgICAgICAgICAgY2FzZSAnd2VlaycgICA6IHJldHVybiBkYXlzIC8gNyAgICAgKyBtaWxsaXNlY29uZHMgLyA2MDQ4ZTU7XG4gICAgICAgICAgICBjYXNlICdkYXknICAgIDogcmV0dXJuIGRheXMgICAgICAgICArIG1pbGxpc2Vjb25kcyAvIDg2NGU1O1xuICAgICAgICAgICAgY2FzZSAnaG91cicgICA6IHJldHVybiBkYXlzICogMjQgICAgKyBtaWxsaXNlY29uZHMgLyAzNmU1O1xuICAgICAgICAgICAgY2FzZSAnbWludXRlJyA6IHJldHVybiBkYXlzICogMTQ0MCAgKyBtaWxsaXNlY29uZHMgLyA2ZTQ7XG4gICAgICAgICAgICBjYXNlICdzZWNvbmQnIDogcmV0dXJuIGRheXMgKiA4NjQwMCArIG1pbGxpc2Vjb25kcyAvIDEwMDA7XG4gICAgICAgICAgICAvLyBNYXRoLmZsb29yIHByZXZlbnRzIGZsb2F0aW5nIHBvaW50IG1hdGggZXJyb3JzIGhlcmVcbiAgICAgICAgICAgIGNhc2UgJ21pbGxpc2Vjb25kJzogcmV0dXJuIE1hdGguZmxvb3IoZGF5cyAqIDg2NGU1KSArIG1pbGxpc2Vjb25kcztcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcignVW5rbm93biB1bml0ICcgKyB1bml0cyk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vIFRPRE86IFVzZSB0aGlzLmFzKCdtcycpP1xuZnVuY3Rpb24gdmFsdWVPZiQxICgpIHtcbiAgICByZXR1cm4gKFxuICAgICAgICB0aGlzLl9taWxsaXNlY29uZHMgK1xuICAgICAgICB0aGlzLl9kYXlzICogODY0ZTUgK1xuICAgICAgICAodGhpcy5fbW9udGhzICUgMTIpICogMjU5MmU2ICtcbiAgICAgICAgdG9JbnQodGhpcy5fbW9udGhzIC8gMTIpICogMzE1MzZlNlxuICAgICk7XG59XG5cbmZ1bmN0aW9uIG1ha2VBcyAoYWxpYXMpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcyhhbGlhcyk7XG4gICAgfTtcbn1cblxudmFyIGFzTWlsbGlzZWNvbmRzID0gbWFrZUFzKCdtcycpO1xudmFyIGFzU2Vjb25kcyAgICAgID0gbWFrZUFzKCdzJyk7XG52YXIgYXNNaW51dGVzICAgICAgPSBtYWtlQXMoJ20nKTtcbnZhciBhc0hvdXJzICAgICAgICA9IG1ha2VBcygnaCcpO1xudmFyIGFzRGF5cyAgICAgICAgID0gbWFrZUFzKCdkJyk7XG52YXIgYXNXZWVrcyAgICAgICAgPSBtYWtlQXMoJ3cnKTtcbnZhciBhc01vbnRocyAgICAgICA9IG1ha2VBcygnTScpO1xudmFyIGFzWWVhcnMgICAgICAgID0gbWFrZUFzKCd5Jyk7XG5cbmZ1bmN0aW9uIGdldCQyICh1bml0cykge1xuICAgIHVuaXRzID0gbm9ybWFsaXplVW5pdHModW5pdHMpO1xuICAgIHJldHVybiB0aGlzW3VuaXRzICsgJ3MnXSgpO1xufVxuXG5mdW5jdGlvbiBtYWtlR2V0dGVyKG5hbWUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YVtuYW1lXTtcbiAgICB9O1xufVxuXG52YXIgbWlsbGlzZWNvbmRzID0gbWFrZUdldHRlcignbWlsbGlzZWNvbmRzJyk7XG52YXIgc2Vjb25kcyAgICAgID0gbWFrZUdldHRlcignc2Vjb25kcycpO1xudmFyIG1pbnV0ZXMgICAgICA9IG1ha2VHZXR0ZXIoJ21pbnV0ZXMnKTtcbnZhciBob3VycyAgICAgICAgPSBtYWtlR2V0dGVyKCdob3VycycpO1xudmFyIGRheXMgICAgICAgICA9IG1ha2VHZXR0ZXIoJ2RheXMnKTtcbnZhciBtb250aHMgICAgICAgPSBtYWtlR2V0dGVyKCdtb250aHMnKTtcbnZhciB5ZWFycyAgICAgICAgPSBtYWtlR2V0dGVyKCd5ZWFycycpO1xuXG5mdW5jdGlvbiB3ZWVrcyAoKSB7XG4gICAgcmV0dXJuIGFic0Zsb29yKHRoaXMuZGF5cygpIC8gNyk7XG59XG5cbnZhciByb3VuZCA9IE1hdGgucm91bmQ7XG52YXIgdGhyZXNob2xkcyA9IHtcbiAgICBzOiA0NSwgIC8vIHNlY29uZHMgdG8gbWludXRlXG4gICAgbTogNDUsICAvLyBtaW51dGVzIHRvIGhvdXJcbiAgICBoOiAyMiwgIC8vIGhvdXJzIHRvIGRheVxuICAgIGQ6IDI2LCAgLy8gZGF5cyB0byBtb250aFxuICAgIE06IDExICAgLy8gbW9udGhzIHRvIHllYXJcbn07XG5cbi8vIGhlbHBlciBmdW5jdGlvbiBmb3IgbW9tZW50LmZuLmZyb20sIG1vbWVudC5mbi5mcm9tTm93LCBhbmQgbW9tZW50LmR1cmF0aW9uLmZuLmh1bWFuaXplXG5mdW5jdGlvbiBzdWJzdGl0dXRlVGltZUFnbyhzdHJpbmcsIG51bWJlciwgd2l0aG91dFN1ZmZpeCwgaXNGdXR1cmUsIGxvY2FsZSkge1xuICAgIHJldHVybiBsb2NhbGUucmVsYXRpdmVUaW1lKG51bWJlciB8fCAxLCAhIXdpdGhvdXRTdWZmaXgsIHN0cmluZywgaXNGdXR1cmUpO1xufVxuXG5mdW5jdGlvbiByZWxhdGl2ZVRpbWUkMSAocG9zTmVnRHVyYXRpb24sIHdpdGhvdXRTdWZmaXgsIGxvY2FsZSkge1xuICAgIHZhciBkdXJhdGlvbiA9IGNyZWF0ZUR1cmF0aW9uKHBvc05lZ0R1cmF0aW9uKS5hYnMoKTtcbiAgICB2YXIgc2Vjb25kcyAgPSByb3VuZChkdXJhdGlvbi5hcygncycpKTtcbiAgICB2YXIgbWludXRlcyAgPSByb3VuZChkdXJhdGlvbi5hcygnbScpKTtcbiAgICB2YXIgaG91cnMgICAgPSByb3VuZChkdXJhdGlvbi5hcygnaCcpKTtcbiAgICB2YXIgZGF5cyAgICAgPSByb3VuZChkdXJhdGlvbi5hcygnZCcpKTtcbiAgICB2YXIgbW9udGhzICAgPSByb3VuZChkdXJhdGlvbi5hcygnTScpKTtcbiAgICB2YXIgeWVhcnMgICAgPSByb3VuZChkdXJhdGlvbi5hcygneScpKTtcblxuICAgIHZhciBhID0gc2Vjb25kcyA8IHRocmVzaG9sZHMucyAmJiBbJ3MnLCBzZWNvbmRzXSAgfHxcbiAgICAgICAgICAgIG1pbnV0ZXMgPD0gMSAgICAgICAgICAgJiYgWydtJ10gICAgICAgICAgIHx8XG4gICAgICAgICAgICBtaW51dGVzIDwgdGhyZXNob2xkcy5tICYmIFsnbW0nLCBtaW51dGVzXSB8fFxuICAgICAgICAgICAgaG91cnMgICA8PSAxICAgICAgICAgICAmJiBbJ2gnXSAgICAgICAgICAgfHxcbiAgICAgICAgICAgIGhvdXJzICAgPCB0aHJlc2hvbGRzLmggJiYgWydoaCcsIGhvdXJzXSAgIHx8XG4gICAgICAgICAgICBkYXlzICAgIDw9IDEgICAgICAgICAgICYmIFsnZCddICAgICAgICAgICB8fFxuICAgICAgICAgICAgZGF5cyAgICA8IHRocmVzaG9sZHMuZCAmJiBbJ2RkJywgZGF5c10gICAgfHxcbiAgICAgICAgICAgIG1vbnRocyAgPD0gMSAgICAgICAgICAgJiYgWydNJ10gICAgICAgICAgIHx8XG4gICAgICAgICAgICBtb250aHMgIDwgdGhyZXNob2xkcy5NICYmIFsnTU0nLCBtb250aHNdICB8fFxuICAgICAgICAgICAgeWVhcnMgICA8PSAxICAgICAgICAgICAmJiBbJ3knXSAgICAgICAgICAgfHwgWyd5eScsIHllYXJzXTtcblxuICAgIGFbMl0gPSB3aXRob3V0U3VmZml4O1xuICAgIGFbM10gPSArcG9zTmVnRHVyYXRpb24gPiAwO1xuICAgIGFbNF0gPSBsb2NhbGU7XG4gICAgcmV0dXJuIHN1YnN0aXR1dGVUaW1lQWdvLmFwcGx5KG51bGwsIGEpO1xufVxuXG4vLyBUaGlzIGZ1bmN0aW9uIGFsbG93cyB5b3UgdG8gc2V0IHRoZSByb3VuZGluZyBmdW5jdGlvbiBmb3IgcmVsYXRpdmUgdGltZSBzdHJpbmdzXG5mdW5jdGlvbiBnZXRTZXRSZWxhdGl2ZVRpbWVSb3VuZGluZyAocm91bmRpbmdGdW5jdGlvbikge1xuICAgIGlmIChyb3VuZGluZ0Z1bmN0aW9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHJvdW5kO1xuICAgIH1cbiAgICBpZiAodHlwZW9mKHJvdW5kaW5nRnVuY3Rpb24pID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJvdW5kID0gcm91bmRpbmdGdW5jdGlvbjtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuLy8gVGhpcyBmdW5jdGlvbiBhbGxvd3MgeW91IHRvIHNldCBhIHRocmVzaG9sZCBmb3IgcmVsYXRpdmUgdGltZSBzdHJpbmdzXG5mdW5jdGlvbiBnZXRTZXRSZWxhdGl2ZVRpbWVUaHJlc2hvbGQgKHRocmVzaG9sZCwgbGltaXQpIHtcbiAgICBpZiAodGhyZXNob2xkc1t0aHJlc2hvbGRdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAobGltaXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdGhyZXNob2xkc1t0aHJlc2hvbGRdO1xuICAgIH1cbiAgICB0aHJlc2hvbGRzW3RocmVzaG9sZF0gPSBsaW1pdDtcbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gaHVtYW5pemUgKHdpdGhTdWZmaXgpIHtcbiAgICB2YXIgbG9jYWxlID0gdGhpcy5sb2NhbGVEYXRhKCk7XG4gICAgdmFyIG91dHB1dCA9IHJlbGF0aXZlVGltZSQxKHRoaXMsICF3aXRoU3VmZml4LCBsb2NhbGUpO1xuXG4gICAgaWYgKHdpdGhTdWZmaXgpIHtcbiAgICAgICAgb3V0cHV0ID0gbG9jYWxlLnBhc3RGdXR1cmUoK3RoaXMsIG91dHB1dCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGxvY2FsZS5wb3N0Zm9ybWF0KG91dHB1dCk7XG59XG5cbnZhciBhYnMkMSA9IE1hdGguYWJzO1xuXG5mdW5jdGlvbiB0b0lTT1N0cmluZyQxKCkge1xuICAgIC8vIGZvciBJU08gc3RyaW5ncyB3ZSBkbyBub3QgdXNlIHRoZSBub3JtYWwgYnViYmxpbmcgcnVsZXM6XG4gICAgLy8gICogbWlsbGlzZWNvbmRzIGJ1YmJsZSB1cCB1bnRpbCB0aGV5IGJlY29tZSBob3Vyc1xuICAgIC8vICAqIGRheXMgZG8gbm90IGJ1YmJsZSBhdCBhbGxcbiAgICAvLyAgKiBtb250aHMgYnViYmxlIHVwIHVudGlsIHRoZXkgYmVjb21lIHllYXJzXG4gICAgLy8gVGhpcyBpcyBiZWNhdXNlIHRoZXJlIGlzIG5vIGNvbnRleHQtZnJlZSBjb252ZXJzaW9uIGJldHdlZW4gaG91cnMgYW5kIGRheXNcbiAgICAvLyAodGhpbmsgb2YgY2xvY2sgY2hhbmdlcylcbiAgICAvLyBhbmQgYWxzbyBub3QgYmV0d2VlbiBkYXlzIGFuZCBtb250aHMgKDI4LTMxIGRheXMgcGVyIG1vbnRoKVxuICAgIHZhciBzZWNvbmRzID0gYWJzJDEodGhpcy5fbWlsbGlzZWNvbmRzKSAvIDEwMDA7XG4gICAgdmFyIGRheXMgICAgICAgICA9IGFicyQxKHRoaXMuX2RheXMpO1xuICAgIHZhciBtb250aHMgICAgICAgPSBhYnMkMSh0aGlzLl9tb250aHMpO1xuICAgIHZhciBtaW51dGVzLCBob3VycywgeWVhcnM7XG5cbiAgICAvLyAzNjAwIHNlY29uZHMgLT4gNjAgbWludXRlcyAtPiAxIGhvdXJcbiAgICBtaW51dGVzICAgICAgICAgICA9IGFic0Zsb29yKHNlY29uZHMgLyA2MCk7XG4gICAgaG91cnMgICAgICAgICAgICAgPSBhYnNGbG9vcihtaW51dGVzIC8gNjApO1xuICAgIHNlY29uZHMgJT0gNjA7XG4gICAgbWludXRlcyAlPSA2MDtcblxuICAgIC8vIDEyIG1vbnRocyAtPiAxIHllYXJcbiAgICB5ZWFycyAgPSBhYnNGbG9vcihtb250aHMgLyAxMik7XG4gICAgbW9udGhzICU9IDEyO1xuXG5cbiAgICAvLyBpbnNwaXJlZCBieSBodHRwczovL2dpdGh1Yi5jb20vZG9yZGlsbGUvbW9tZW50LWlzb2R1cmF0aW9uL2Jsb2IvbWFzdGVyL21vbWVudC5pc29kdXJhdGlvbi5qc1xuICAgIHZhciBZID0geWVhcnM7XG4gICAgdmFyIE0gPSBtb250aHM7XG4gICAgdmFyIEQgPSBkYXlzO1xuICAgIHZhciBoID0gaG91cnM7XG4gICAgdmFyIG0gPSBtaW51dGVzO1xuICAgIHZhciBzID0gc2Vjb25kcztcbiAgICB2YXIgdG90YWwgPSB0aGlzLmFzU2Vjb25kcygpO1xuXG4gICAgaWYgKCF0b3RhbCkge1xuICAgICAgICAvLyB0aGlzIGlzIHRoZSBzYW1lIGFzIEMjJ3MgKE5vZGEpIGFuZCBweXRob24gKGlzb2RhdGUpLi4uXG4gICAgICAgIC8vIGJ1dCBub3Qgb3RoZXIgSlMgKGdvb2cuZGF0ZSlcbiAgICAgICAgcmV0dXJuICdQMEQnO1xuICAgIH1cblxuICAgIHJldHVybiAodG90YWwgPCAwID8gJy0nIDogJycpICtcbiAgICAgICAgJ1AnICtcbiAgICAgICAgKFkgPyBZICsgJ1knIDogJycpICtcbiAgICAgICAgKE0gPyBNICsgJ00nIDogJycpICtcbiAgICAgICAgKEQgPyBEICsgJ0QnIDogJycpICtcbiAgICAgICAgKChoIHx8IG0gfHwgcykgPyAnVCcgOiAnJykgK1xuICAgICAgICAoaCA/IGggKyAnSCcgOiAnJykgK1xuICAgICAgICAobSA/IG0gKyAnTScgOiAnJykgK1xuICAgICAgICAocyA/IHMgKyAnUycgOiAnJyk7XG59XG5cbnZhciBwcm90byQyID0gRHVyYXRpb24ucHJvdG90eXBlO1xuXG5wcm90byQyLmFicyAgICAgICAgICAgID0gYWJzO1xucHJvdG8kMi5hZGQgICAgICAgICAgICA9IGFkZCQxO1xucHJvdG8kMi5zdWJ0cmFjdCAgICAgICA9IHN1YnRyYWN0JDE7XG5wcm90byQyLmFzICAgICAgICAgICAgID0gYXM7XG5wcm90byQyLmFzTWlsbGlzZWNvbmRzID0gYXNNaWxsaXNlY29uZHM7XG5wcm90byQyLmFzU2Vjb25kcyAgICAgID0gYXNTZWNvbmRzO1xucHJvdG8kMi5hc01pbnV0ZXMgICAgICA9IGFzTWludXRlcztcbnByb3RvJDIuYXNIb3VycyAgICAgICAgPSBhc0hvdXJzO1xucHJvdG8kMi5hc0RheXMgICAgICAgICA9IGFzRGF5cztcbnByb3RvJDIuYXNXZWVrcyAgICAgICAgPSBhc1dlZWtzO1xucHJvdG8kMi5hc01vbnRocyAgICAgICA9IGFzTW9udGhzO1xucHJvdG8kMi5hc1llYXJzICAgICAgICA9IGFzWWVhcnM7XG5wcm90byQyLnZhbHVlT2YgICAgICAgID0gdmFsdWVPZiQxO1xucHJvdG8kMi5fYnViYmxlICAgICAgICA9IGJ1YmJsZTtcbnByb3RvJDIuZ2V0ICAgICAgICAgICAgPSBnZXQkMjtcbnByb3RvJDIubWlsbGlzZWNvbmRzICAgPSBtaWxsaXNlY29uZHM7XG5wcm90byQyLnNlY29uZHMgICAgICAgID0gc2Vjb25kcztcbnByb3RvJDIubWludXRlcyAgICAgICAgPSBtaW51dGVzO1xucHJvdG8kMi5ob3VycyAgICAgICAgICA9IGhvdXJzO1xucHJvdG8kMi5kYXlzICAgICAgICAgICA9IGRheXM7XG5wcm90byQyLndlZWtzICAgICAgICAgID0gd2Vla3M7XG5wcm90byQyLm1vbnRocyAgICAgICAgID0gbW9udGhzO1xucHJvdG8kMi55ZWFycyAgICAgICAgICA9IHllYXJzO1xucHJvdG8kMi5odW1hbml6ZSAgICAgICA9IGh1bWFuaXplO1xucHJvdG8kMi50b0lTT1N0cmluZyAgICA9IHRvSVNPU3RyaW5nJDE7XG5wcm90byQyLnRvU3RyaW5nICAgICAgID0gdG9JU09TdHJpbmckMTtcbnByb3RvJDIudG9KU09OICAgICAgICAgPSB0b0lTT1N0cmluZyQxO1xucHJvdG8kMi5sb2NhbGUgICAgICAgICA9IGxvY2FsZTtcbnByb3RvJDIubG9jYWxlRGF0YSAgICAgPSBsb2NhbGVEYXRhO1xuXG4vLyBEZXByZWNhdGlvbnNcbnByb3RvJDIudG9Jc29TdHJpbmcgPSBkZXByZWNhdGUoJ3RvSXNvU3RyaW5nKCkgaXMgZGVwcmVjYXRlZC4gUGxlYXNlIHVzZSB0b0lTT1N0cmluZygpIGluc3RlYWQgKG5vdGljZSB0aGUgY2FwaXRhbHMpJywgdG9JU09TdHJpbmckMSk7XG5wcm90byQyLmxhbmcgPSBsYW5nO1xuXG4vLyBTaWRlIGVmZmVjdCBpbXBvcnRzXG5cbi8vIEZPUk1BVFRJTkdcblxuYWRkRm9ybWF0VG9rZW4oJ1gnLCAwLCAwLCAndW5peCcpO1xuYWRkRm9ybWF0VG9rZW4oJ3gnLCAwLCAwLCAndmFsdWVPZicpO1xuXG4vLyBQQVJTSU5HXG5cbmFkZFJlZ2V4VG9rZW4oJ3gnLCBtYXRjaFNpZ25lZCk7XG5hZGRSZWdleFRva2VuKCdYJywgbWF0Y2hUaW1lc3RhbXApO1xuYWRkUGFyc2VUb2tlbignWCcsIGZ1bmN0aW9uIChpbnB1dCwgYXJyYXksIGNvbmZpZykge1xuICAgIGNvbmZpZy5fZCA9IG5ldyBEYXRlKHBhcnNlRmxvYXQoaW5wdXQsIDEwKSAqIDEwMDApO1xufSk7XG5hZGRQYXJzZVRva2VuKCd4JywgZnVuY3Rpb24gKGlucHV0LCBhcnJheSwgY29uZmlnKSB7XG4gICAgY29uZmlnLl9kID0gbmV3IERhdGUodG9JbnQoaW5wdXQpKTtcbn0pO1xuXG4vLyBTaWRlIGVmZmVjdCBpbXBvcnRzXG5cblxuaG9va3MudmVyc2lvbiA9ICcyLjE3LjEnO1xuXG5zZXRIb29rQ2FsbGJhY2soY3JlYXRlTG9jYWwpO1xuXG5ob29rcy5mbiAgICAgICAgICAgICAgICAgICAgPSBwcm90bztcbmhvb2tzLm1pbiAgICAgICAgICAgICAgICAgICA9IG1pbjtcbmhvb2tzLm1heCAgICAgICAgICAgICAgICAgICA9IG1heDtcbmhvb2tzLm5vdyAgICAgICAgICAgICAgICAgICA9IG5vdztcbmhvb2tzLnV0YyAgICAgICAgICAgICAgICAgICA9IGNyZWF0ZVVUQztcbmhvb2tzLnVuaXggICAgICAgICAgICAgICAgICA9IGNyZWF0ZVVuaXg7XG5ob29rcy5tb250aHMgICAgICAgICAgICAgICAgPSBsaXN0TW9udGhzO1xuaG9va3MuaXNEYXRlICAgICAgICAgICAgICAgID0gaXNEYXRlO1xuaG9va3MubG9jYWxlICAgICAgICAgICAgICAgID0gZ2V0U2V0R2xvYmFsTG9jYWxlO1xuaG9va3MuaW52YWxpZCAgICAgICAgICAgICAgID0gY3JlYXRlSW52YWxpZDtcbmhvb2tzLmR1cmF0aW9uICAgICAgICAgICAgICA9IGNyZWF0ZUR1cmF0aW9uO1xuaG9va3MuaXNNb21lbnQgICAgICAgICAgICAgID0gaXNNb21lbnQ7XG5ob29rcy53ZWVrZGF5cyAgICAgICAgICAgICAgPSBsaXN0V2Vla2RheXM7XG5ob29rcy5wYXJzZVpvbmUgICAgICAgICAgICAgPSBjcmVhdGVJblpvbmU7XG5ob29rcy5sb2NhbGVEYXRhICAgICAgICAgICAgPSBnZXRMb2NhbGU7XG5ob29rcy5pc0R1cmF0aW9uICAgICAgICAgICAgPSBpc0R1cmF0aW9uO1xuaG9va3MubW9udGhzU2hvcnQgICAgICAgICAgID0gbGlzdE1vbnRoc1Nob3J0O1xuaG9va3Mud2Vla2RheXNNaW4gICAgICAgICAgID0gbGlzdFdlZWtkYXlzTWluO1xuaG9va3MuZGVmaW5lTG9jYWxlICAgICAgICAgID0gZGVmaW5lTG9jYWxlO1xuaG9va3MudXBkYXRlTG9jYWxlICAgICAgICAgID0gdXBkYXRlTG9jYWxlO1xuaG9va3MubG9jYWxlcyAgICAgICAgICAgICAgID0gbGlzdExvY2FsZXM7XG5ob29rcy53ZWVrZGF5c1Nob3J0ICAgICAgICAgPSBsaXN0V2Vla2RheXNTaG9ydDtcbmhvb2tzLm5vcm1hbGl6ZVVuaXRzICAgICAgICA9IG5vcm1hbGl6ZVVuaXRzO1xuaG9va3MucmVsYXRpdmVUaW1lUm91bmRpbmcgPSBnZXRTZXRSZWxhdGl2ZVRpbWVSb3VuZGluZztcbmhvb2tzLnJlbGF0aXZlVGltZVRocmVzaG9sZCA9IGdldFNldFJlbGF0aXZlVGltZVRocmVzaG9sZDtcbmhvb2tzLmNhbGVuZGFyRm9ybWF0ICAgICAgICA9IGdldENhbGVuZGFyRm9ybWF0O1xuaG9va3MucHJvdG90eXBlICAgICAgICAgICAgID0gcHJvdG87XG5cbnJldHVybiBob29rcztcblxufSkpKTtcbiIsIihmdW5jdGlvbihzZWxmKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBpZiAoc2VsZi5mZXRjaCkge1xuICAgIHJldHVyblxuICB9XG5cbiAgdmFyIHN1cHBvcnQgPSB7XG4gICAgc2VhcmNoUGFyYW1zOiAnVVJMU2VhcmNoUGFyYW1zJyBpbiBzZWxmLFxuICAgIGl0ZXJhYmxlOiAnU3ltYm9sJyBpbiBzZWxmICYmICdpdGVyYXRvcicgaW4gU3ltYm9sLFxuICAgIGJsb2I6ICdGaWxlUmVhZGVyJyBpbiBzZWxmICYmICdCbG9iJyBpbiBzZWxmICYmIChmdW5jdGlvbigpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIG5ldyBCbG9iKClcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cbiAgICB9KSgpLFxuICAgIGZvcm1EYXRhOiAnRm9ybURhdGEnIGluIHNlbGYsXG4gICAgYXJyYXlCdWZmZXI6ICdBcnJheUJ1ZmZlcicgaW4gc2VsZlxuICB9XG5cbiAgaWYgKHN1cHBvcnQuYXJyYXlCdWZmZXIpIHtcbiAgICB2YXIgdmlld0NsYXNzZXMgPSBbXG4gICAgICAnW29iamVjdCBJbnQ4QXJyYXldJyxcbiAgICAgICdbb2JqZWN0IFVpbnQ4QXJyYXldJyxcbiAgICAgICdbb2JqZWN0IFVpbnQ4Q2xhbXBlZEFycmF5XScsXG4gICAgICAnW29iamVjdCBJbnQxNkFycmF5XScsXG4gICAgICAnW29iamVjdCBVaW50MTZBcnJheV0nLFxuICAgICAgJ1tvYmplY3QgSW50MzJBcnJheV0nLFxuICAgICAgJ1tvYmplY3QgVWludDMyQXJyYXldJyxcbiAgICAgICdbb2JqZWN0IEZsb2F0MzJBcnJheV0nLFxuICAgICAgJ1tvYmplY3QgRmxvYXQ2NEFycmF5XSdcbiAgICBdXG5cbiAgICB2YXIgaXNEYXRhVmlldyA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIG9iaiAmJiBEYXRhVmlldy5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihvYmopXG4gICAgfVxuXG4gICAgdmFyIGlzQXJyYXlCdWZmZXJWaWV3ID0gQXJyYXlCdWZmZXIuaXNWaWV3IHx8IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIG9iaiAmJiB2aWV3Q2xhc3Nlcy5pbmRleE9mKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopKSA+IC0xXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gbm9ybWFsaXplTmFtZShuYW1lKSB7XG4gICAgaWYgKHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJykge1xuICAgICAgbmFtZSA9IFN0cmluZyhuYW1lKVxuICAgIH1cbiAgICBpZiAoL1teYS16MC05XFwtIyQlJicqKy5cXF5fYHx+XS9pLnRlc3QobmFtZSkpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgY2hhcmFjdGVyIGluIGhlYWRlciBmaWVsZCBuYW1lJylcbiAgICB9XG4gICAgcmV0dXJuIG5hbWUudG9Mb3dlckNhc2UoKVxuICB9XG5cbiAgZnVuY3Rpb24gbm9ybWFsaXplVmFsdWUodmFsdWUpIHtcbiAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJykge1xuICAgICAgdmFsdWUgPSBTdHJpbmcodmFsdWUpXG4gICAgfVxuICAgIHJldHVybiB2YWx1ZVxuICB9XG5cbiAgLy8gQnVpbGQgYSBkZXN0cnVjdGl2ZSBpdGVyYXRvciBmb3IgdGhlIHZhbHVlIGxpc3RcbiAgZnVuY3Rpb24gaXRlcmF0b3JGb3IoaXRlbXMpIHtcbiAgICB2YXIgaXRlcmF0b3IgPSB7XG4gICAgICBuZXh0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHZhbHVlID0gaXRlbXMuc2hpZnQoKVxuICAgICAgICByZXR1cm4ge2RvbmU6IHZhbHVlID09PSB1bmRlZmluZWQsIHZhbHVlOiB2YWx1ZX1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoc3VwcG9ydC5pdGVyYWJsZSkge1xuICAgICAgaXRlcmF0b3JbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gaXRlcmF0b3JcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gaXRlcmF0b3JcbiAgfVxuXG4gIGZ1bmN0aW9uIEhlYWRlcnMoaGVhZGVycykge1xuICAgIHRoaXMubWFwID0ge31cblxuICAgIGlmIChoZWFkZXJzIGluc3RhbmNlb2YgSGVhZGVycykge1xuICAgICAgaGVhZGVycy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlLCBuYW1lKSB7XG4gICAgICAgIHRoaXMuYXBwZW5kKG5hbWUsIHZhbHVlKVxuICAgICAgfSwgdGhpcylcbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoaGVhZGVycykpIHtcbiAgICAgIGhlYWRlcnMuZm9yRWFjaChmdW5jdGlvbihoZWFkZXIpIHtcbiAgICAgICAgdGhpcy5hcHBlbmQoaGVhZGVyWzBdLCBoZWFkZXJbMV0pXG4gICAgICB9LCB0aGlzKVxuICAgIH0gZWxzZSBpZiAoaGVhZGVycykge1xuICAgICAgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoaGVhZGVycykuZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHRoaXMuYXBwZW5kKG5hbWUsIGhlYWRlcnNbbmFtZV0pXG4gICAgICB9LCB0aGlzKVxuICAgIH1cbiAgfVxuXG4gIEhlYWRlcnMucHJvdG90eXBlLmFwcGVuZCA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XG4gICAgbmFtZSA9IG5vcm1hbGl6ZU5hbWUobmFtZSlcbiAgICB2YWx1ZSA9IG5vcm1hbGl6ZVZhbHVlKHZhbHVlKVxuICAgIHZhciBvbGRWYWx1ZSA9IHRoaXMubWFwW25hbWVdXG4gICAgdGhpcy5tYXBbbmFtZV0gPSBvbGRWYWx1ZSA/IG9sZFZhbHVlKycsJyt2YWx1ZSA6IHZhbHVlXG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZVsnZGVsZXRlJ10gPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgZGVsZXRlIHRoaXMubWFwW25vcm1hbGl6ZU5hbWUobmFtZSldXG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgbmFtZSA9IG5vcm1hbGl6ZU5hbWUobmFtZSlcbiAgICByZXR1cm4gdGhpcy5oYXMobmFtZSkgPyB0aGlzLm1hcFtuYW1lXSA6IG51bGxcbiAgfVxuXG4gIEhlYWRlcnMucHJvdG90eXBlLmhhcyA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICByZXR1cm4gdGhpcy5tYXAuaGFzT3duUHJvcGVydHkobm9ybWFsaXplTmFtZShuYW1lKSlcbiAgfVxuXG4gIEhlYWRlcnMucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XG4gICAgdGhpcy5tYXBbbm9ybWFsaXplTmFtZShuYW1lKV0gPSBub3JtYWxpemVWYWx1ZSh2YWx1ZSlcbiAgfVxuXG4gIEhlYWRlcnMucHJvdG90eXBlLmZvckVhY2ggPSBmdW5jdGlvbihjYWxsYmFjaywgdGhpc0FyZykge1xuICAgIGZvciAodmFyIG5hbWUgaW4gdGhpcy5tYXApIHtcbiAgICAgIGlmICh0aGlzLm1hcC5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xuICAgICAgICBjYWxsYmFjay5jYWxsKHRoaXNBcmcsIHRoaXMubWFwW25hbWVdLCBuYW1lLCB0aGlzKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIEhlYWRlcnMucHJvdG90eXBlLmtleXMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaXRlbXMgPSBbXVxuICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSwgbmFtZSkgeyBpdGVtcy5wdXNoKG5hbWUpIH0pXG4gICAgcmV0dXJuIGl0ZXJhdG9yRm9yKGl0ZW1zKVxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGUudmFsdWVzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGl0ZW1zID0gW11cbiAgICB0aGlzLmZvckVhY2goZnVuY3Rpb24odmFsdWUpIHsgaXRlbXMucHVzaCh2YWx1ZSkgfSlcbiAgICByZXR1cm4gaXRlcmF0b3JGb3IoaXRlbXMpXG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZS5lbnRyaWVzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGl0ZW1zID0gW11cbiAgICB0aGlzLmZvckVhY2goZnVuY3Rpb24odmFsdWUsIG5hbWUpIHsgaXRlbXMucHVzaChbbmFtZSwgdmFsdWVdKSB9KVxuICAgIHJldHVybiBpdGVyYXRvckZvcihpdGVtcylcbiAgfVxuXG4gIGlmIChzdXBwb3J0Lml0ZXJhYmxlKSB7XG4gICAgSGVhZGVycy5wcm90b3R5cGVbU3ltYm9sLml0ZXJhdG9yXSA9IEhlYWRlcnMucHJvdG90eXBlLmVudHJpZXNcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbnN1bWVkKGJvZHkpIHtcbiAgICBpZiAoYm9keS5ib2R5VXNlZCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBUeXBlRXJyb3IoJ0FscmVhZHkgcmVhZCcpKVxuICAgIH1cbiAgICBib2R5LmJvZHlVc2VkID0gdHJ1ZVxuICB9XG5cbiAgZnVuY3Rpb24gZmlsZVJlYWRlclJlYWR5KHJlYWRlcikge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVzb2x2ZShyZWFkZXIucmVzdWx0KVxuICAgICAgfVxuICAgICAgcmVhZGVyLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVqZWN0KHJlYWRlci5lcnJvcilcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZEJsb2JBc0FycmF5QnVmZmVyKGJsb2IpIHtcbiAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKVxuICAgIHZhciBwcm9taXNlID0gZmlsZVJlYWRlclJlYWR5KHJlYWRlcilcbiAgICByZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIoYmxvYilcbiAgICByZXR1cm4gcHJvbWlzZVxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZEJsb2JBc1RleHQoYmxvYikge1xuICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpXG4gICAgdmFyIHByb21pc2UgPSBmaWxlUmVhZGVyUmVhZHkocmVhZGVyKVxuICAgIHJlYWRlci5yZWFkQXNUZXh0KGJsb2IpXG4gICAgcmV0dXJuIHByb21pc2VcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWRBcnJheUJ1ZmZlckFzVGV4dChidWYpIHtcbiAgICB2YXIgdmlldyA9IG5ldyBVaW50OEFycmF5KGJ1ZilcbiAgICB2YXIgY2hhcnMgPSBuZXcgQXJyYXkodmlldy5sZW5ndGgpXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHZpZXcubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNoYXJzW2ldID0gU3RyaW5nLmZyb21DaGFyQ29kZSh2aWV3W2ldKVxuICAgIH1cbiAgICByZXR1cm4gY2hhcnMuam9pbignJylcbiAgfVxuXG4gIGZ1bmN0aW9uIGJ1ZmZlckNsb25lKGJ1Zikge1xuICAgIGlmIChidWYuc2xpY2UpIHtcbiAgICAgIHJldHVybiBidWYuc2xpY2UoMClcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIHZpZXcgPSBuZXcgVWludDhBcnJheShidWYuYnl0ZUxlbmd0aClcbiAgICAgIHZpZXcuc2V0KG5ldyBVaW50OEFycmF5KGJ1ZikpXG4gICAgICByZXR1cm4gdmlldy5idWZmZXJcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBCb2R5KCkge1xuICAgIHRoaXMuYm9keVVzZWQgPSBmYWxzZVxuXG4gICAgdGhpcy5faW5pdEJvZHkgPSBmdW5jdGlvbihib2R5KSB7XG4gICAgICB0aGlzLl9ib2R5SW5pdCA9IGJvZHlcbiAgICAgIGlmICghYm9keSkge1xuICAgICAgICB0aGlzLl9ib2R5VGV4dCA9ICcnXG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBib2R5ID09PSAnc3RyaW5nJykge1xuICAgICAgICB0aGlzLl9ib2R5VGV4dCA9IGJvZHlcbiAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5ibG9iICYmIEJsb2IucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkpIHtcbiAgICAgICAgdGhpcy5fYm9keUJsb2IgPSBib2R5XG4gICAgICB9IGVsc2UgaWYgKHN1cHBvcnQuZm9ybURhdGEgJiYgRm9ybURhdGEucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkpIHtcbiAgICAgICAgdGhpcy5fYm9keUZvcm1EYXRhID0gYm9keVxuICAgICAgfSBlbHNlIGlmIChzdXBwb3J0LnNlYXJjaFBhcmFtcyAmJiBVUkxTZWFyY2hQYXJhbXMucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkpIHtcbiAgICAgICAgdGhpcy5fYm9keVRleHQgPSBib2R5LnRvU3RyaW5nKClcbiAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5hcnJheUJ1ZmZlciAmJiBzdXBwb3J0LmJsb2IgJiYgaXNEYXRhVmlldyhib2R5KSkge1xuICAgICAgICB0aGlzLl9ib2R5QXJyYXlCdWZmZXIgPSBidWZmZXJDbG9uZShib2R5LmJ1ZmZlcilcbiAgICAgICAgLy8gSUUgMTAtMTEgY2FuJ3QgaGFuZGxlIGEgRGF0YVZpZXcgYm9keS5cbiAgICAgICAgdGhpcy5fYm9keUluaXQgPSBuZXcgQmxvYihbdGhpcy5fYm9keUFycmF5QnVmZmVyXSlcbiAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5hcnJheUJ1ZmZlciAmJiAoQXJyYXlCdWZmZXIucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkgfHwgaXNBcnJheUJ1ZmZlclZpZXcoYm9keSkpKSB7XG4gICAgICAgIHRoaXMuX2JvZHlBcnJheUJ1ZmZlciA9IGJ1ZmZlckNsb25lKGJvZHkpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Vuc3VwcG9ydGVkIEJvZHlJbml0IHR5cGUnKVxuICAgICAgfVxuXG4gICAgICBpZiAoIXRoaXMuaGVhZGVycy5nZXQoJ2NvbnRlbnQtdHlwZScpKSB7XG4gICAgICAgIGlmICh0eXBlb2YgYm9keSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICB0aGlzLmhlYWRlcnMuc2V0KCdjb250ZW50LXR5cGUnLCAndGV4dC9wbGFpbjtjaGFyc2V0PVVURi04JylcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5QmxvYiAmJiB0aGlzLl9ib2R5QmxvYi50eXBlKSB7XG4gICAgICAgICAgdGhpcy5oZWFkZXJzLnNldCgnY29udGVudC10eXBlJywgdGhpcy5fYm9keUJsb2IudHlwZSlcbiAgICAgICAgfSBlbHNlIGlmIChzdXBwb3J0LnNlYXJjaFBhcmFtcyAmJiBVUkxTZWFyY2hQYXJhbXMucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkpIHtcbiAgICAgICAgICB0aGlzLmhlYWRlcnMuc2V0KCdjb250ZW50LXR5cGUnLCAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkO2NoYXJzZXQ9VVRGLTgnKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHN1cHBvcnQuYmxvYikge1xuICAgICAgdGhpcy5ibG9iID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciByZWplY3RlZCA9IGNvbnN1bWVkKHRoaXMpXG4gICAgICAgIGlmIChyZWplY3RlZCkge1xuICAgICAgICAgIHJldHVybiByZWplY3RlZFxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuX2JvZHlCbG9iKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLl9ib2R5QmxvYilcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5QXJyYXlCdWZmZXIpIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG5ldyBCbG9iKFt0aGlzLl9ib2R5QXJyYXlCdWZmZXJdKSlcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5Rm9ybURhdGEpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvdWxkIG5vdCByZWFkIEZvcm1EYXRhIGJvZHkgYXMgYmxvYicpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShuZXcgQmxvYihbdGhpcy5fYm9keVRleHRdKSlcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aGlzLmFycmF5QnVmZmVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLl9ib2R5QXJyYXlCdWZmZXIpIHtcbiAgICAgICAgICByZXR1cm4gY29uc3VtZWQodGhpcykgfHwgUHJvbWlzZS5yZXNvbHZlKHRoaXMuX2JvZHlBcnJheUJ1ZmZlcilcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5ibG9iKCkudGhlbihyZWFkQmxvYkFzQXJyYXlCdWZmZXIpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnRleHQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciByZWplY3RlZCA9IGNvbnN1bWVkKHRoaXMpXG4gICAgICBpZiAocmVqZWN0ZWQpIHtcbiAgICAgICAgcmV0dXJuIHJlamVjdGVkXG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLl9ib2R5QmxvYikge1xuICAgICAgICByZXR1cm4gcmVhZEJsb2JBc1RleHQodGhpcy5fYm9keUJsb2IpXG4gICAgICB9IGVsc2UgaWYgKHRoaXMuX2JvZHlBcnJheUJ1ZmZlcikge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlYWRBcnJheUJ1ZmZlckFzVGV4dCh0aGlzLl9ib2R5QXJyYXlCdWZmZXIpKVxuICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5Rm9ybURhdGEpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjb3VsZCBub3QgcmVhZCBGb3JtRGF0YSBib2R5IGFzIHRleHQnKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLl9ib2R5VGV4dClcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoc3VwcG9ydC5mb3JtRGF0YSkge1xuICAgICAgdGhpcy5mb3JtRGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy50ZXh0KCkudGhlbihkZWNvZGUpXG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5qc29uID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy50ZXh0KCkudGhlbihKU09OLnBhcnNlKVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvLyBIVFRQIG1ldGhvZHMgd2hvc2UgY2FwaXRhbGl6YXRpb24gc2hvdWxkIGJlIG5vcm1hbGl6ZWRcbiAgdmFyIG1ldGhvZHMgPSBbJ0RFTEVURScsICdHRVQnLCAnSEVBRCcsICdPUFRJT05TJywgJ1BPU1QnLCAnUFVUJ11cblxuICBmdW5jdGlvbiBub3JtYWxpemVNZXRob2QobWV0aG9kKSB7XG4gICAgdmFyIHVwY2FzZWQgPSBtZXRob2QudG9VcHBlckNhc2UoKVxuICAgIHJldHVybiAobWV0aG9kcy5pbmRleE9mKHVwY2FzZWQpID4gLTEpID8gdXBjYXNlZCA6IG1ldGhvZFxuICB9XG5cbiAgZnVuY3Rpb24gUmVxdWVzdChpbnB1dCwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XG4gICAgdmFyIGJvZHkgPSBvcHRpb25zLmJvZHlcblxuICAgIGlmIChpbnB1dCBpbnN0YW5jZW9mIFJlcXVlc3QpIHtcbiAgICAgIGlmIChpbnB1dC5ib2R5VXNlZCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBbHJlYWR5IHJlYWQnKVxuICAgICAgfVxuICAgICAgdGhpcy51cmwgPSBpbnB1dC51cmxcbiAgICAgIHRoaXMuY3JlZGVudGlhbHMgPSBpbnB1dC5jcmVkZW50aWFsc1xuICAgICAgaWYgKCFvcHRpb25zLmhlYWRlcnMpIHtcbiAgICAgICAgdGhpcy5oZWFkZXJzID0gbmV3IEhlYWRlcnMoaW5wdXQuaGVhZGVycylcbiAgICAgIH1cbiAgICAgIHRoaXMubWV0aG9kID0gaW5wdXQubWV0aG9kXG4gICAgICB0aGlzLm1vZGUgPSBpbnB1dC5tb2RlXG4gICAgICBpZiAoIWJvZHkgJiYgaW5wdXQuX2JvZHlJbml0ICE9IG51bGwpIHtcbiAgICAgICAgYm9keSA9IGlucHV0Ll9ib2R5SW5pdFxuICAgICAgICBpbnB1dC5ib2R5VXNlZCA9IHRydWVcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy51cmwgPSBTdHJpbmcoaW5wdXQpXG4gICAgfVxuXG4gICAgdGhpcy5jcmVkZW50aWFscyA9IG9wdGlvbnMuY3JlZGVudGlhbHMgfHwgdGhpcy5jcmVkZW50aWFscyB8fCAnb21pdCdcbiAgICBpZiAob3B0aW9ucy5oZWFkZXJzIHx8ICF0aGlzLmhlYWRlcnMpIHtcbiAgICAgIHRoaXMuaGVhZGVycyA9IG5ldyBIZWFkZXJzKG9wdGlvbnMuaGVhZGVycylcbiAgICB9XG4gICAgdGhpcy5tZXRob2QgPSBub3JtYWxpemVNZXRob2Qob3B0aW9ucy5tZXRob2QgfHwgdGhpcy5tZXRob2QgfHwgJ0dFVCcpXG4gICAgdGhpcy5tb2RlID0gb3B0aW9ucy5tb2RlIHx8IHRoaXMubW9kZSB8fCBudWxsXG4gICAgdGhpcy5yZWZlcnJlciA9IG51bGxcblxuICAgIGlmICgodGhpcy5tZXRob2QgPT09ICdHRVQnIHx8IHRoaXMubWV0aG9kID09PSAnSEVBRCcpICYmIGJvZHkpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0JvZHkgbm90IGFsbG93ZWQgZm9yIEdFVCBvciBIRUFEIHJlcXVlc3RzJylcbiAgICB9XG4gICAgdGhpcy5faW5pdEJvZHkoYm9keSlcbiAgfVxuXG4gIFJlcXVlc3QucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBSZXF1ZXN0KHRoaXMsIHsgYm9keTogdGhpcy5fYm9keUluaXQgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlY29kZShib2R5KSB7XG4gICAgdmFyIGZvcm0gPSBuZXcgRm9ybURhdGEoKVxuICAgIGJvZHkudHJpbSgpLnNwbGl0KCcmJykuZm9yRWFjaChmdW5jdGlvbihieXRlcykge1xuICAgICAgaWYgKGJ5dGVzKSB7XG4gICAgICAgIHZhciBzcGxpdCA9IGJ5dGVzLnNwbGl0KCc9JylcbiAgICAgICAgdmFyIG5hbWUgPSBzcGxpdC5zaGlmdCgpLnJlcGxhY2UoL1xcKy9nLCAnICcpXG4gICAgICAgIHZhciB2YWx1ZSA9IHNwbGl0LmpvaW4oJz0nKS5yZXBsYWNlKC9cXCsvZywgJyAnKVxuICAgICAgICBmb3JtLmFwcGVuZChkZWNvZGVVUklDb21wb25lbnQobmFtZSksIGRlY29kZVVSSUNvbXBvbmVudCh2YWx1ZSkpXG4gICAgICB9XG4gICAgfSlcbiAgICByZXR1cm4gZm9ybVxuICB9XG5cbiAgZnVuY3Rpb24gcGFyc2VIZWFkZXJzKHJhd0hlYWRlcnMpIHtcbiAgICB2YXIgaGVhZGVycyA9IG5ldyBIZWFkZXJzKClcbiAgICByYXdIZWFkZXJzLnNwbGl0KC9cXHI/XFxuLykuZm9yRWFjaChmdW5jdGlvbihsaW5lKSB7XG4gICAgICB2YXIgcGFydHMgPSBsaW5lLnNwbGl0KCc6JylcbiAgICAgIHZhciBrZXkgPSBwYXJ0cy5zaGlmdCgpLnRyaW0oKVxuICAgICAgaWYgKGtleSkge1xuICAgICAgICB2YXIgdmFsdWUgPSBwYXJ0cy5qb2luKCc6JykudHJpbSgpXG4gICAgICAgIGhlYWRlcnMuYXBwZW5kKGtleSwgdmFsdWUpXG4gICAgICB9XG4gICAgfSlcbiAgICByZXR1cm4gaGVhZGVyc1xuICB9XG5cbiAgQm9keS5jYWxsKFJlcXVlc3QucHJvdG90eXBlKVxuXG4gIGZ1bmN0aW9uIFJlc3BvbnNlKGJvZHlJbml0LCBvcHRpb25zKSB7XG4gICAgaWYgKCFvcHRpb25zKSB7XG4gICAgICBvcHRpb25zID0ge31cbiAgICB9XG5cbiAgICB0aGlzLnR5cGUgPSAnZGVmYXVsdCdcbiAgICB0aGlzLnN0YXR1cyA9ICdzdGF0dXMnIGluIG9wdGlvbnMgPyBvcHRpb25zLnN0YXR1cyA6IDIwMFxuICAgIHRoaXMub2sgPSB0aGlzLnN0YXR1cyA+PSAyMDAgJiYgdGhpcy5zdGF0dXMgPCAzMDBcbiAgICB0aGlzLnN0YXR1c1RleHQgPSAnc3RhdHVzVGV4dCcgaW4gb3B0aW9ucyA/IG9wdGlvbnMuc3RhdHVzVGV4dCA6ICdPSydcbiAgICB0aGlzLmhlYWRlcnMgPSBuZXcgSGVhZGVycyhvcHRpb25zLmhlYWRlcnMpXG4gICAgdGhpcy51cmwgPSBvcHRpb25zLnVybCB8fCAnJ1xuICAgIHRoaXMuX2luaXRCb2R5KGJvZHlJbml0KVxuICB9XG5cbiAgQm9keS5jYWxsKFJlc3BvbnNlLnByb3RvdHlwZSlcblxuICBSZXNwb25zZS5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFJlc3BvbnNlKHRoaXMuX2JvZHlJbml0LCB7XG4gICAgICBzdGF0dXM6IHRoaXMuc3RhdHVzLFxuICAgICAgc3RhdHVzVGV4dDogdGhpcy5zdGF0dXNUZXh0LFxuICAgICAgaGVhZGVyczogbmV3IEhlYWRlcnModGhpcy5oZWFkZXJzKSxcbiAgICAgIHVybDogdGhpcy51cmxcbiAgICB9KVxuICB9XG5cbiAgUmVzcG9uc2UuZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcmVzcG9uc2UgPSBuZXcgUmVzcG9uc2UobnVsbCwge3N0YXR1czogMCwgc3RhdHVzVGV4dDogJyd9KVxuICAgIHJlc3BvbnNlLnR5cGUgPSAnZXJyb3InXG4gICAgcmV0dXJuIHJlc3BvbnNlXG4gIH1cblxuICB2YXIgcmVkaXJlY3RTdGF0dXNlcyA9IFszMDEsIDMwMiwgMzAzLCAzMDcsIDMwOF1cblxuICBSZXNwb25zZS5yZWRpcmVjdCA9IGZ1bmN0aW9uKHVybCwgc3RhdHVzKSB7XG4gICAgaWYgKHJlZGlyZWN0U3RhdHVzZXMuaW5kZXhPZihzdGF0dXMpID09PSAtMSkge1xuICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0ludmFsaWQgc3RhdHVzIGNvZGUnKVxuICAgIH1cblxuICAgIHJldHVybiBuZXcgUmVzcG9uc2UobnVsbCwge3N0YXR1czogc3RhdHVzLCBoZWFkZXJzOiB7bG9jYXRpb246IHVybH19KVxuICB9XG5cbiAgc2VsZi5IZWFkZXJzID0gSGVhZGVyc1xuICBzZWxmLlJlcXVlc3QgPSBSZXF1ZXN0XG4gIHNlbGYuUmVzcG9uc2UgPSBSZXNwb25zZVxuXG4gIHNlbGYuZmV0Y2ggPSBmdW5jdGlvbihpbnB1dCwgaW5pdCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHZhciByZXF1ZXN0ID0gbmV3IFJlcXVlc3QoaW5wdXQsIGluaXQpXG4gICAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KClcblxuICAgICAgeGhyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICBzdGF0dXM6IHhoci5zdGF0dXMsXG4gICAgICAgICAgc3RhdHVzVGV4dDogeGhyLnN0YXR1c1RleHQsXG4gICAgICAgICAgaGVhZGVyczogcGFyc2VIZWFkZXJzKHhoci5nZXRBbGxSZXNwb25zZUhlYWRlcnMoKSB8fCAnJylcbiAgICAgICAgfVxuICAgICAgICBvcHRpb25zLnVybCA9ICdyZXNwb25zZVVSTCcgaW4geGhyID8geGhyLnJlc3BvbnNlVVJMIDogb3B0aW9ucy5oZWFkZXJzLmdldCgnWC1SZXF1ZXN0LVVSTCcpXG4gICAgICAgIHZhciBib2R5ID0gJ3Jlc3BvbnNlJyBpbiB4aHIgPyB4aHIucmVzcG9uc2UgOiB4aHIucmVzcG9uc2VUZXh0XG4gICAgICAgIHJlc29sdmUobmV3IFJlc3BvbnNlKGJvZHksIG9wdGlvbnMpKVxuICAgICAgfVxuXG4gICAgICB4aHIub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZWplY3QobmV3IFR5cGVFcnJvcignTmV0d29yayByZXF1ZXN0IGZhaWxlZCcpKVxuICAgICAgfVxuXG4gICAgICB4aHIub250aW1lb3V0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlamVjdChuZXcgVHlwZUVycm9yKCdOZXR3b3JrIHJlcXVlc3QgZmFpbGVkJykpXG4gICAgICB9XG5cbiAgICAgIHhoci5vcGVuKHJlcXVlc3QubWV0aG9kLCByZXF1ZXN0LnVybCwgdHJ1ZSlcblxuICAgICAgaWYgKHJlcXVlc3QuY3JlZGVudGlhbHMgPT09ICdpbmNsdWRlJykge1xuICAgICAgICB4aHIud2l0aENyZWRlbnRpYWxzID0gdHJ1ZVxuICAgICAgfVxuXG4gICAgICBpZiAoJ3Jlc3BvbnNlVHlwZScgaW4geGhyICYmIHN1cHBvcnQuYmxvYikge1xuICAgICAgICB4aHIucmVzcG9uc2VUeXBlID0gJ2Jsb2InXG4gICAgICB9XG5cbiAgICAgIHJlcXVlc3QuaGVhZGVycy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlLCBuYW1lKSB7XG4gICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKG5hbWUsIHZhbHVlKVxuICAgICAgfSlcblxuICAgICAgeGhyLnNlbmQodHlwZW9mIHJlcXVlc3QuX2JvZHlJbml0ID09PSAndW5kZWZpbmVkJyA/IG51bGwgOiByZXF1ZXN0Ll9ib2R5SW5pdClcbiAgICB9KVxuICB9XG4gIHNlbGYuZmV0Y2gucG9seWZpbGwgPSB0cnVlXG59KSh0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcgPyBzZWxmIDogdGhpcyk7XG4iLCIndXNlIHN0cmljdCdcblxuLyoqKioqIExPR1MgKioqKiovXG5cbi8vIGRpc3BsYXlpbmcgb3RoZXIgZGV2aWNlIHRleHRib3hcbnZhciBkZXZpY2VMaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2Nvb2tpbmctZGV2aWNlJylcbnZhciBvdGhlckRldmljZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNkZXZpY2Utb3RoZXItYm94JylcblxuaWYgKGRldmljZUxpc3QpIHtcbiAgZGV2aWNlTGlzdC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbigpIHtcbiAgXG4gICAgaWYgKGRldmljZUxpc3QudmFsdWUgPT09ICdPdGhlcicpIHtcbiAgICAgIG90aGVyRGV2aWNlLmNsYXNzTGlzdC5yZW1vdmUoJ2hpZGRlbicpXG4gICAgfVxuXG4gICAgZWxzZSBpZiAoZGV2aWNlTGlzdC52YWx1ZSAhPT0gJ090aGVyJykge1xuICAgICAgb3RoZXJEZXZpY2UuY2xhc3NMaXN0LmFkZCgnaGlkZGVuJylcbiAgICB9XG5cbiAgfSlcbn1cblxuLy8gZGlzcGxheWluZyBvdGhlciBtZWF0IHRleHRib3hcbnZhciBtZWF0TGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtZWF0LXR5cGUnKVxudmFyIG90aGVyTWVhdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtZWF0LW90aGVyLWJveCcpXG5cbmlmIChtZWF0TGlzdCkge1xuICBtZWF0TGlzdC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbigpIHtcbiAgXG4gICAgaWYgKG1lYXRMaXN0LnZhbHVlID09PSAnT3RoZXInKSB7XG4gICAgICBvdGhlck1lYXQuY2xhc3NMaXN0LnJlbW92ZSgnaGlkZGVuJylcbiAgICB9XG5cbiAgICBlbHNlIGlmIChtZWF0TGlzdC52YWx1ZSAhPT0gJ090aGVyJykge1xuICAgICAgb3RoZXJNZWF0LmNsYXNzTGlzdC5hZGQoJ2hpZGRlbicpXG4gICAgfVxuXG4gIH0pXG59XG5cbi8vIGRpc3BsYXlpbmcgb3RoZXIgd29vZCB0ZXh0Ym94XG52YXIgd29vZExpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjd29vZCcpXG52YXIgb3RoZXJXb29kID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3dvb2Qtb3RoZXItdGV4dCcpXG5cbmlmICh3b29kTGlzdCkge1xuICB3b29kTGlzdC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbigpIHtcbiAgXG4gICAgaWYgKHdvb2RMaXN0LnZhbHVlID09PSAnT3RoZXInKSB7XG4gICAgICBvdGhlcldvb2QuY2xhc3NMaXN0LnJlbW92ZSgnaGlkZGVuJylcbiAgICB9XG5cbiAgICBlbHNlIGlmICh3b29kTGlzdC52YWx1ZSAhPT0gJ090aGVyJykge1xuICAgICAgb3RoZXJXb29kLmNsYXNzTGlzdC5hZGQoJ2hpZGRlbicpXG4gICAgfVxuXG4gIH0pXG59XG5cbi8vIGFkZGluZyBzdGVwIHRvIHJlY2lwZVxudmFyIGFkZFN0ZXBCdG4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWRkLXN0ZXAnKVxudmFyIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdvbCcpXG5cbmlmIChhZGRTdGVwQnRuKSB7XG4gIGFkZFN0ZXBCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpXG4gICAgdmFyIHN0ZXBIVE1MID0gXCI8ZGl2IGNsYXNzPSdzdGVwLWJveCc+PGRpdiBjbGFzcz0nc3RlcC1ub3Rlcyc+PHRleHRhcmVhIGNsYXNzPSdzdGVwLXRleHQnIHBsYWNlaG9sZGVyPSdXcml0ZSBzdGVwIGhlcmUnPjwvdGV4dGFyZWE+PC9kaXY+PGRpdiBjbGFzcz0nY29tcGxldGUtYm94Jz48bGFiZWwgZm9yPSdjb21wbGV0ZSc+PGlucHV0IHR5cGU9J2NoZWNrYm94JyBjbGFzcz0nY29tcGxldGUtY2hlY2snIG5hbWU9J3N0ZXAtY29tcGxldGUnPkNvbXBsZXRlPC9sYWJlbD48aW5wdXQgdHlwZT0ndGltZScgY2xhc3M9J3RpbWUnIG5hbWU9J3RpbWUnIHZhbHVlPScwOTowMCc+PC9kaXY+PGRpdiBjbGFzcz0nY29tcGxldGUtbm90ZXMnPjx0ZXh0YXJlYSBjbGFzcz0nY29tcGxldGUtbm90ZXMtdGV4dCcgcGxhY2Vob2xkZXI9J1dyaXRlIG5vdGVzIGhlcmUnPjwvdGV4dGFyZWE+PGJ1dHRvbiB0eXBlPSdidXR0b24nIGNsYXNzPSdyZW1vdmUtc3RlcCc+UmVtb3ZlIFN0ZXA8L2J1dHRvbj48L2Rpdj48L2Rpdj5cIlxuICAgIGxpLmlubmVySFRNTCA9IHN0ZXBIVE1MXG5cbiAgICBsaXN0LmFwcGVuZENoaWxkKGxpKVxuXG4gIH0pXG5cbiAgdmFyIGxvZ01haW4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbG9nLW1haW4nKVxuXG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNyZWNpcGUtbGlzdCBvbCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBpZiAoZXZlbnQudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygncmVtb3ZlLXN0ZXAnKSkge1xuICAgICAgdmFyIGxpID0gZXZlbnQudGFyZ2V0LmNsb3Nlc3QoJ2xpJylcblxuICAgICAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgICB2YXIgcG9wSFRNTCA9IFwiPHAgc3R5bGU9J21hcmdpbi10b3A6IDQwcHg7Jz5Db25maXJtIGRlbGV0ZSBzdGVwPzwvcD48ZGl2IGlkPSdwb3AtZGVsLW9wdGlvbnMnPjxidXR0b24gaWQ9J2RlbC15ZXMnPlllczwvYnV0dG9uPjxidXR0b24gaWQ9J2RlbC1ubyc+Tm88L2J1dHRvbj48L2Rpdj5cIlxuXG4gICAgICBkaXYuc2V0QXR0cmlidXRlKCdpZCcsICdwb3AtZGVsJylcbiAgICAgIGRpdi5pbm5lckhUTUwgPSBwb3BIVE1MXG4gICAgICBsb2dNYWluLmFwcGVuZENoaWxkKGRpdilcblxuICAgICAgdmFyIGRlbE5vID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2RlbC1ubycpXG4gICAgICBpZiAoZGVsTm8pIHtcbiAgICAgICAgZGVsTm8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgcG9wRGVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3BvcC1kZWwnKVxuICAgICAgICAgIHBvcERlbC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHBvcERlbClcbiAgICAgICAgfSlcbiAgICAgIH1cblxuICAgICAgdmFyIGRlbFllcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNkZWwteWVzJylcbiAgICAgIGlmIChkZWxZZXMpIHtcbiAgICAgICAgZGVsWWVzLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgbGkucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChsaSlcbiAgICAgICAgICB2YXIgcG9wRGVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3BvcC1kZWwnKVxuICAgICAgICAgIHBvcERlbC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHBvcERlbClcbiAgICAgICAgfSlcbiAgICAgIH1cblxuICAgIH1cbiAgfSlcbn1cblxuXG4vLyByZW1vdmluZyBwaWMgZnJvbSBsb2dcbnZhciByZW1vdmVQaWNCdG4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucmVtb3ZlLXBpYycpXG52YXIgcGljc0JveCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5waWNzLWJveCcpXG5cbmlmIChyZW1vdmVQaWNCdG4pIHtcblxuICB2YXIgbG9nTWFpbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsb2ctbWFpbicpXG5cbiAgcGljc0JveC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgaWYgKGV2ZW50LnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ3JlbW92ZS1waWMnKSkge1xuICAgICAgdmFyIHBpY0RpdiA9IGV2ZW50LnRhcmdldC5jbG9zZXN0KCdkaXYnKVxuXG4gICAgICB2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICAgIHZhciBwb3BIVE1MID0gXCI8cCBzdHlsZT0nbWFyZ2luLXRvcDogNDBweDsnPkNvbmZpcm0gZGVsZXRlIHBpYz88L3A+PGRpdiBpZD0ncG9wLWRlbC1vcHRpb25zJz48YnV0dG9uIGlkPSdkZWwteWVzJz5ZZXM8L2J1dHRvbj48YnV0dG9uIGlkPSdkZWwtbm8nPk5vPC9idXR0b24+PC9kaXY+XCJcblxuICAgICAgZGl2LnNldEF0dHJpYnV0ZSgnaWQnLCAncG9wLWRlbCcpXG4gICAgICBkaXYuaW5uZXJIVE1MID0gcG9wSFRNTFxuICAgICAgbG9nTWFpbi5hcHBlbmRDaGlsZChkaXYpXG5cbiAgICAgIHZhciBkZWxObyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNkZWwtbm8nKVxuICAgICAgaWYgKGRlbE5vKSB7XG4gICAgICAgIGRlbE5vLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIHBvcERlbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNwb3AtZGVsJylcbiAgICAgICAgICBwb3BEZWwucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChwb3BEZWwpXG4gICAgICAgIH0pXG4gICAgICB9XG5cbiAgICAgIHZhciBkZWxZZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZGVsLXllcycpXG4gICAgICBpZiAoZGVsWWVzKSB7XG4gICAgICAgIGRlbFllcy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHBpY0Rpdi5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHBpY0RpdilcbiAgICAgICAgICB2YXIgcG9wRGVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3BvcC1kZWwnKVxuICAgICAgICAgIHBvcERlbC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHBvcERlbClcbiAgICAgICAgfSlcbiAgICAgIH1cblxuICAgIH1cbiAgfSlcbn1cblxuXG5cbi8vIHRlbXBlcmF0dXJlIHNsaWRlciBvdXRwdXRcbndpbmRvdy5vdXRwdXRVcGRhdGUgPSBmdW5jdGlvbiAodGVtcCkge1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjdGVtcC1zbGlkZXItb3V0cHV0JykudmFsdWUgPSB0ZW1wO1xufVxuXG4vLyBzYXZlIG5ldyBsb2cgZGF0YSB0byBNb25nb1xudmFyIHNhdmUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2F2ZScpXG5cbmlmIChzYXZlKSB7XG4gIHNhdmUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcblxuICAgIHZhciBsb2dCb2R5ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xvZy1ib2R5JylcbiAgICB2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICB2YXIgcG9wSFRNTCA9IFwiPGltZyBzcmM9Jy4uL2ltYWdlcy91cGxvYWRpbmcuZ2lmJz5cIlxuXG4gICAgZGl2LmNsYXNzTGlzdC5hZGQoJ3BvcCcpXG4gICAgZGl2LmlubmVySFRNTCA9IHBvcEhUTUxcbiAgICBsb2dCb2R5LmFwcGVuZENoaWxkKGRpdilcblxuICAgIHZhciByYWRpb3MgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucmF0aW5nIGlucHV0JylcbiAgICB2YXIgcmF0aW5nU2VsZWN0ZWRcbiAgICByYWRpb3MuZm9yRWFjaChmdW5jdGlvbihyYWRpbykge1xuICAgICAgaWYgKHJhZGlvLmNoZWNrZWQpIHtcbiAgICAgICAgcmF0aW5nU2VsZWN0ZWQgPSByYWRpby52YWx1ZVxuICAgICAgfVxuICAgIH0pXG5cbiAgICBpZiAoIXJhdGluZ1NlbGVjdGVkKSB7XG4gICAgICByYXRpbmdTZWxlY3RlZCA9IDBcbiAgICB9XG5cbiAgICB2YXIgc3RhdHVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnI3N0YXR1cy1ib3ggaW5wdXQnKVxuICAgIHZhciBzdGF0dXNTZWxlY3RlZFxuICAgIHN0YXR1cy5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgIGlmIChpdGVtLmNoZWNrZWQpIHtcbiAgICAgICAgc3RhdHVzU2VsZWN0ZWQgPSBpdGVtLnZhbHVlXG4gICAgICB9XG4gICAgfSlcblxuICAgIHZhciBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpXG4gICAgdmFyIGJhc2ljRGF0YSA9IHtcbiAgICAgIGRhdGU6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNkYXRlLXNlbGVjdCcpLnZhbHVlLFxuICAgICAgc2Vzc2lvbl9uYW1lOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2Vzc2lvbi1uYW1lJykudmFsdWUsXG4gICAgICBjb29raW5nX2RldmljZTogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2Nvb2tpbmctZGV2aWNlJykudmFsdWUsXG4gICAgICBkZXZpY2Vfb3RoZXI6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNkZXZpY2Utb3RoZXItdGV4dCcpLnZhbHVlLFxuICAgICAgbWVhdDogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21lYXQtdHlwZScpLnZhbHVlLFxuICAgICAgbWVhdF9vdGhlcjogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21lYXQtb3RoZXItdGV4dCcpLnZhbHVlLFxuICAgICAgd2VpZ2h0OiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjd2VpZ2h0JykudmFsdWUsXG4gICAgICBtZWF0X25vdGVzOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWVhdC1ub3RlcycpLnZhbHVlLFxuICAgICAgY29va190ZW1wZXJhdHVyZTogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3RlbXAtc2xpZGVyJykudmFsdWUsXG4gICAgICBlc3RpbWF0ZWRfdGltZTogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2VzdGltYXRlZC10aW1lJykudmFsdWUsXG4gICAgICBmdWVsOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZnVlbCcpLnZhbHVlLFxuICAgICAgYnJhbmQ6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNicmFuZCcpLnZhbHVlLFxuICAgICAgd29vZDogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3dvb2QnKS52YWx1ZSxcbiAgICAgIHdvb2Rfb3RoZXI6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyN3b29kLW90aGVyLXRleHQnKS52YWx1ZSxcbiAgICAgIHJhdGluZzogcmF0aW5nU2VsZWN0ZWQsXG4gICAgICBzdGF0dXM6IHN0YXR1c1NlbGVjdGVkLFxuICAgICAgdXNlcm5hbWU6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyN1c2VybmFtZScpLnRleHRDb250ZW50LFxuICAgICAgdXBkYXRlZDogbmV3IERhdGUoKSxcbiAgICAgIHZvdGVzOiAwLFxuICAgICAgdm90ZXJzOiBbXSxcbiAgICAgIG90aGVyX2luZ3JlZGllbnRzOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjb3RoZXItaW5ncmVkaWVudHMnKS52YWx1ZSxcbiAgICAgIHJlY2lwZV9ndWlkZWxpbmU6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNyZWNpcGUtZ3VpZGVsaW5lJykudmFsdWUsXG4gICAgICBwaWNzOiBbXSxcbiAgICAgIGZpbmFsOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZmluYWwtY29tbWVudHMnKS52YWx1ZVxuICAgIH1cblxuICAgIHZhciBvbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ29sJylcbiAgICB2YXIgaXRlbXMgPSBvbC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnbGknKVxuICAgIHZhciBzdGVwSW5mbyA9IFtdXG4gICAgXG4gICAgQXJyYXkuZnJvbShpdGVtcykuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG4gICAgICB2YXIgc3RlcE9iamVjdCA9IHt9XG4gICAgICBzdGVwT2JqZWN0LnN0ZXAgPSBpdGVtLnF1ZXJ5U2VsZWN0b3IoJy5zdGVwLXRleHQnKS52YWx1ZVxuICAgICAgc3RlcE9iamVjdC5jb21wbGV0ZWQgPSBpdGVtLnF1ZXJ5U2VsZWN0b3IoJy5jb21wbGV0ZS1jaGVjaycpLmNoZWNrZWRcbiAgICAgIHN0ZXBPYmplY3QudGltZSA9IGl0ZW0ucXVlcnlTZWxlY3RvcignLnRpbWUnKS52YWx1ZVxuICAgICAgc3RlcE9iamVjdC5ub3RlcyA9IGl0ZW0ucXVlcnlTZWxlY3RvcignLmNvbXBsZXRlLW5vdGVzLXRleHQnKS52YWx1ZVxuICAgICAgc3RlcEluZm8ucHVzaChzdGVwT2JqZWN0KVxuICAgIH0pXG5cbiAgICB2YXIgbG9nRGF0YSA9IE9iamVjdC5hc3NpZ24oeyBzdGVwczogc3RlcEluZm8gfSwgYmFzaWNEYXRhKVxuXG4gICAgaWYgKCBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9BbmRyb2lkL2kpXG4gICAgIHx8IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL3dlYk9TL2kpXG4gICAgIHx8IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL2lQaG9uZS9pKVxuICAgICB8fCBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9pUGFkL2kpXG4gICAgIHx8IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL2lQb2QvaSlcbiAgICAgfHwgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvQmxhY2tCZXJyeS9pKVxuICAgICB8fCBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9XaW5kb3dzIFBob25lL2kpXG4gICAgICkge1xuICAgICAgc2VuZExvZyhsb2dEYXRhKVxuICAgIH1cblxuICAgIGVsc2Uge1xuXG4gICAgICB2YXIgZiA9IG5ldyBGb3JtRGF0YVBvbHlmaWxsKClcblxuICAgICAgZi5hcHBlbmQoJ2xvZ0RhdGEnLCBKU09OLnN0cmluZ2lmeShsb2dEYXRhKSlcblxuICAgICAgZi5hcHBlbmQoJ3BpY3MnLCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZmlsZTEnKS5maWxlc1swXSlcbiAgICAgIGYuYXBwZW5kKCdwaWNzJywgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2ZpbGUyJykuZmlsZXNbMF0pXG4gICAgICBmLmFwcGVuZCgncGljcycsIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNmaWxlMycpLmZpbGVzWzBdKVxuICAgICAgZi5hcHBlbmQoJ3BpY3MnLCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZmlsZTQnKS5maWxlc1swXSlcbiAgICAgIGYuYXBwZW5kKCdwaWNzJywgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2ZpbGU1JykuZmlsZXNbMF0pXG5cbiAgICAgIHhoclByb21pc2UoZilcbiAgICAgICAgLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbiA9ICcvbG9nLWhpc3Rvcnk/bWVzc2FnZT1Mb2clMjBjcmVhdGVkJ1xuICAgICAgICB9KVxuXG4gICAgfVxuXG4gICAgfSlcbn1cblxuZnVuY3Rpb24geGhyUHJvbWlzZShmKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpXG4gICAgeGhyLm9wZW4oJ3Bvc3QnLCAnL2NyZWF0ZS1sb2cnKVxuICAgIHhoci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24oKXtcbiAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSA9PSBYTUxIdHRwUmVxdWVzdC5ET05FKSB7XG4gICAgICAgIHJlc29sdmUoeGhyLnJlc3BvbnNlVGV4dClcbiAgICAgIH1cbiAgICB9KVxuICAgIHhoci5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIHJlamVjdClcblxuICAgIHhoci5zZW5kKGYpXG5cbiAgfSlcbn1cblxuZnVuY3Rpb24gc2VuZExvZyhsb2dEYXRhKSB7XG4gIGNvbnNvbGUubG9nKCdzZW5kaW5nIGZldGNoJylcbiAgZmV0Y2goJy9jcmVhdGUtbG9nJywge1xuICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgIGhlYWRlcnM6IHtcbiAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICB9LFxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGxvZ0RhdGEpLFxuICAgIG1vZGU6ICdjb3JzJyxcbiAgICBjYWNoZTogJ2RlZmF1bHQnLFxuICAgIGNyZWRlbnRpYWxzOiAnaW5jbHVkZSdcbiAgfSlcbiAgICAudGhlbihmdW5jdGlvbigpIHtcbiAgICAgIHdpbmRvdy5sb2NhdGlvbiA9ICcvbG9nLWhpc3Rvcnk/bWVzc2FnZT1Mb2clMjBjcmVhdGVkJ1xuICAgIH0pXG59XG5cbi8vIHVwZGF0ZSBsb2cgZGF0YSB0byBNb25nb1xudmFyIHVwZGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyN1cGRhdGUnKVxuXG5pZiAodXBkYXRlKSB7XG4gIHVwZGF0ZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIGxvZ0JvZHkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbG9nLWJvZHknKVxuICAgIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgIHZhciBwb3BIVE1MID0gXCI8aW1nIHNyYz0nLi4vaW1hZ2VzL3VwbG9hZGluZy5naWYnPlwiXG5cbiAgICBkaXYuY2xhc3NMaXN0LmFkZCgncG9wJylcbiAgICBkaXYuaW5uZXJIVE1MID0gcG9wSFRNTFxuICAgIGxvZ0JvZHkuYXBwZW5kQ2hpbGQoZGl2KVxuXG4gICAgdmFyIHJhZGlvcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5yYXRpbmcgaW5wdXQnKVxuICAgIHZhciByYXRpbmdTZWxlY3RlZFxuICAgIHJhZGlvcy5mb3JFYWNoKGZ1bmN0aW9uKHJhZGlvKSB7XG4gICAgICBpZiAocmFkaW8uY2hlY2tlZCkge1xuICAgICAgICByYXRpbmdTZWxlY3RlZCA9IHJhZGlvLnZhbHVlXG4gICAgICB9XG4gICAgfSlcblxuICAgIGlmICghcmF0aW5nU2VsZWN0ZWQpIHtcbiAgICAgIHJhdGluZ1NlbGVjdGVkID0gMFxuICAgIH1cblxuICAgIHZhciBzdGF0dXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjc3RhdHVzLWJveCBpbnB1dCcpXG4gICAgdmFyIHN0YXR1c1NlbGVjdGVkXG4gICAgc3RhdHVzLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuICAgICAgaWYgKGl0ZW0uY2hlY2tlZCkge1xuICAgICAgICBzdGF0dXNTZWxlY3RlZCA9IGl0ZW0udmFsdWVcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgdmFyIG1lYXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWVhdC10eXBlJykudmFsdWVcblxuICAgIGlmIChvdGhlck1lYXQudmFsdWUgIT09ICcnKSB7XG4gICAgICBtZWF0ID0gb3RoZXJNZWF0LnZhbHVlXG4gICAgfVxuXG4gICAgdmFyIGNvb2tpbmdEZXZpY2UgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjY29va2luZy1kZXZpY2UnKS52YWx1ZVxuXG4gICAgaWYgKG90aGVyRGV2aWNlLnZhbHVlICE9PSAnJykge1xuICAgICAgY29va2luZ0RldmljZSA9IG90aGVyRGV2aWNlLnZhbHVlXG4gICAgfVxuXG4gICAgdmFyIGJhc2ljRGF0YSA9IHtcbiAgICAgIGRhdGU6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNkYXRlLXNlbGVjdCcpLnZhbHVlLCAvLyBmaW5kIGEgd2F5IHRvIGdldCB0aGlzIHZhbHVlXG4gICAgICBzZXNzaW9uX25hbWU6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzZXNzaW9uLW5hbWUnKS52YWx1ZSxcbiAgICAgIGNvb2tpbmdfZGV2aWNlOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjY29va2luZy1kZXZpY2UnKS52YWx1ZSxcbiAgICAgIGRldmljZV9vdGhlcjogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2RldmljZS1vdGhlci10ZXh0JykudmFsdWUsXG4gICAgICBtZWF0OiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWVhdC10eXBlJykudmFsdWUsXG4gICAgICBtZWF0X290aGVyOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWVhdC1vdGhlci10ZXh0JykudmFsdWUsXG4gICAgICB3ZWlnaHQ6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyN3ZWlnaHQnKS52YWx1ZSxcbiAgICAgIG1lYXRfbm90ZXM6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtZWF0LW5vdGVzJykudmFsdWUsXG4gICAgICBjb29rX3RlbXBlcmF0dXJlOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjdGVtcC1zbGlkZXInKS52YWx1ZSxcbiAgICAgIGVzdGltYXRlZF90aW1lOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZXN0aW1hdGVkLXRpbWUnKS52YWx1ZSxcbiAgICAgIGZ1ZWw6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNmdWVsJykudmFsdWUsXG4gICAgICBicmFuZDogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2JyYW5kJykudmFsdWUsXG4gICAgICB3b29kOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjd29vZCcpLnZhbHVlLFxuICAgICAgd29vZF9vdGhlcjogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3dvb2Qtb3RoZXItdGV4dCcpLnZhbHVlLFxuICAgICAgcmF0aW5nOiByYXRpbmdTZWxlY3RlZCxcbiAgICAgIHN0YXR1czogc3RhdHVzU2VsZWN0ZWQsXG4gICAgICB1c2VybmFtZTogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3VzZXJuYW1lJykudGV4dENvbnRlbnQsXG4gICAgICB1cGRhdGVkOiBuZXcgRGF0ZSgpLFxuICAgICAgb3RoZXJfaW5ncmVkaWVudHM6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNvdGhlci1pbmdyZWRpZW50cycpLnZhbHVlLFxuICAgICAgcmVjaXBlX2d1aWRlbGluZTogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3JlY2lwZS1ndWlkZWxpbmUnKS52YWx1ZSxcbiAgICAgIGZpbmFsOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZmluYWwtY29tbWVudHMnKS52YWx1ZVxuICAgIH1cblxuICAgIHZhciBvbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ29sJylcbiAgICB2YXIgaXRlbXMgPSBvbC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnbGknKVxuICAgIHZhciBzdGVwSW5mbyA9IFtdXG4gICAgXG4gICAgQXJyYXkuZnJvbShpdGVtcykuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG4gICAgICB2YXIgc3RlcE9iamVjdCA9IHt9XG4gICAgICBzdGVwT2JqZWN0LnN0ZXAgPSBpdGVtLnF1ZXJ5U2VsZWN0b3IoJy5zdGVwLXRleHQnKS52YWx1ZVxuICAgICAgc3RlcE9iamVjdC5jb21wbGV0ZWQgPSBpdGVtLnF1ZXJ5U2VsZWN0b3IoJy5jb21wbGV0ZS1jaGVjaycpLmNoZWNrZWRcbiAgICAgIHN0ZXBPYmplY3QudGltZSA9IGl0ZW0ucXVlcnlTZWxlY3RvcignLnRpbWUnKS52YWx1ZVxuICAgICAgc3RlcE9iamVjdC5ub3RlcyA9IGl0ZW0ucXVlcnlTZWxlY3RvcignLmNvbXBsZXRlLW5vdGVzJykudmFsdWVcbiAgICAgIHN0ZXBJbmZvLnB1c2goc3RlcE9iamVjdClcbiAgICB9KVxuXG4gICAgdmFyIGRpc3BsYXllZFBpY3MgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucGljIGltZycpXG4gICAgdmFyIGRpc3BsYXllZFBpY3NBcnJheSA9IFtdXG4gICAgXG4gICAgQXJyYXkuZnJvbShkaXNwbGF5ZWRQaWNzKS5mb3JFYWNoKGZ1bmN0aW9uKGRpc3BsYXllZFBpYykge1xuICAgICAgdmFyIHBpY3NPYmplY3QgPSB7fVxuICAgICAgdmFyIGF0dHIgPSBkaXNwbGF5ZWRQaWMuZ2V0QXR0cmlidXRlKCdzcmMnKVxuICAgICAgdmFyIGZpbGVuYW1lID0gYXR0ci5zcGxpdCgnLycpLnBvcCgpXG4gICAgICBwaWNzT2JqZWN0LmZpbGVuYW1lID0gZmlsZW5hbWVcbiAgICAgIGRpc3BsYXllZFBpY3NBcnJheS5wdXNoKHBpY3NPYmplY3QpXG4gICAgfSlcblxuICAgIHZhciBsb2dEYXRhID0gT2JqZWN0LmFzc2lnbih7IHN0ZXBzOiBzdGVwSW5mbyB9LCB7IHBpY3M6IGRpc3BsYXllZFBpY3NBcnJheSB9LCBiYXNpY0RhdGEpXG4gICAgXG4gICAgaWYgKCBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9BbmRyb2lkL2kpXG4gICAgIHx8IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL3dlYk9TL2kpXG4gICAgIHx8IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL2lQaG9uZS9pKVxuICAgICB8fCBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9pUGFkL2kpXG4gICAgIHx8IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL2lQb2QvaSlcbiAgICAgfHwgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvQmxhY2tCZXJyeS9pKVxuICAgICB8fCBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9XaW5kb3dzIFBob25lL2kpXG4gICAgICkge1xuICAgICAgdXBkYXRlTG9nKGxvZ0RhdGEpXG4gICAgfVxuXG4gICAgZWxzZSB7XG5cbiAgICAgIHZhciBmID0gbmV3IEZvcm1EYXRhKClcbiAgICAgIGYuYXBwZW5kKCdsb2dEYXRhJywgSlNPTi5zdHJpbmdpZnkobG9nRGF0YSkpXG5cbiAgICAgIGYuYXBwZW5kKCdwaWNzJywgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2ZpbGUxJykuZmlsZXNbMF0pXG4gICAgICBmLmFwcGVuZCgncGljcycsIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNmaWxlMicpLmZpbGVzWzBdKVxuICAgICAgZi5hcHBlbmQoJ3BpY3MnLCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZmlsZTMnKS5maWxlc1swXSlcbiAgICAgIGYuYXBwZW5kKCdwaWNzJywgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2ZpbGU0JykuZmlsZXNbMF0pXG4gICAgICBmLmFwcGVuZCgncGljcycsIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNmaWxlNScpLmZpbGVzWzBdKVxuXG4gICAgICB2YXIgdXJsID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lXG4gICAgICB2YXIgbG9nSWQgPSB1cmwuc3BsaXQoJy8nKS5wb3AoKVxuXG5cbiAgICAgIHhoclByb21pc2VVcGRhdGUoZilcbiAgICAgICAgLnRoZW4oKHJlcykgPT4ge1xuXG4gICAgICAgICAgdmFyIGxvYWRlciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wb3AnKVxuICAgICAgICAgIGxvYWRlci5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGxvYWRlcilcblxuICAgICAgICAgIHZhciBsb2dCb2R5ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xvZy1ib2R5JylcbiAgICAgICAgICB2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICAgICAgICB2YXIgcG9wSFRNTCA9IFwiPHA+TG9nIHVwZGF0ZWQ8L3A+XCJcblxuICAgICAgICAgIGRpdi5jbGFzc0xpc3QuYWRkKCdwb3AtdXBkYXRlJylcbiAgICAgICAgICBkaXYuaW5uZXJIVE1MID0gcG9wSFRNTFxuICAgICAgICAgIGxvZ0JvZHkuYXBwZW5kQ2hpbGQoZGl2KVxuXG5cbiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBkaXYuY2xhc3NMaXN0LmFkZCgncG9wLXVwZGF0ZS1mYWRlJylcbiAgICAgICAgICB9LCAwKVxuXG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgZGl2LmNsYXNzTGlzdC5yZW1vdmUoJ3BvcC11cGRhdGUtZmFkZScpXG5cbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBkaXYucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChkaXYpICAgICAgICBcbiAgICAgICAgICAgIH0sIDEwMDApXG5cbiAgICAgICAgICB9LCAyMDAwKVxuXG4gICAgICAgICAgLy8gYWRkL3JlbW92ZSBwdWJsaWMgbGluayBvbiB1cGRhdGUgd2l0aG91dCBwYWdlIHJlZnJlc2hcbiAgICAgICAgICB2YXIgaDMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdoMycpXG4gICAgICAgICAgdmFyIHB1YkxpbmsgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjcHViLWxpbmsnKVxuICAgICAgICAgIHZhciBzdGF0dXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjc3RhdHVzLWJveCBpbnB1dCcpXG4gICAgICAgICAgdmFyIHN0YXR1c1NlbGVjdGVkXG5cbiAgICAgICAgICBzdGF0dXMuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICBpZiAoaXRlbS5jaGVja2VkKSB7XG4gICAgICAgICAgICAgIHN0YXR1c1NlbGVjdGVkID0gaXRlbS52YWx1ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBpZiAoKHN0YXR1c1NlbGVjdGVkID09PSAnUHJpdmF0ZScpICYmIGgzKSB7XG4gICAgICAgICAgICBwdWJMaW5rLnJlbW92ZUNoaWxkKGgzKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICgoc3RhdHVzU2VsZWN0ZWQgPT09ICdQdWJsaWMnKSAmJiAhaDMpIHtcbiAgICAgICAgICAgIHZhciBoMyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2gzJylcbiAgICAgICAgICAgIHZhciB1cmwgPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWVcbiAgICAgICAgICAgIHZhciBsb2dJZCA9IHVybC5zcGxpdCgnLycpLnBvcCgpXG4gICAgICAgICAgICB2YXIgaDNDb250ZW50ID0gXCI8YSBocmVmPScvcHVibGljLWxvZy9cIiArIGxvZ0lkICsgXCInPlB1YmxpYyBsaW5rIGhlcmU8L2E+XCJcbiAgICAgICAgICAgIGgzLmlubmVySFRNTCA9IGgzQ29udGVudFxuICAgICAgICAgICAgcHViTGluay5hcHBlbmRDaGlsZChoMylcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBhZGQvcmVtb3ZlIHBpY3R1cmVzIG9uIHVwZGF0ZSB3aXRob3V0IHBhZ2UgcmVmcmVzaFxuICAgICAgICAgIHZhciBwaWNzQm94ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnBpY3MtYm94JylcbiAgICAgICAgICB2YXIgbG9nUGljcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5waWMnKVxuXG4gICAgICAgICAgbG9nUGljcy5mb3JFYWNoKGZ1bmN0aW9uKHBpYykge1xuICAgICAgICAgICAgcGljLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQocGljKVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICB2YXIgcmVzcG9uc2UgPSBKU09OLnBhcnNlKHJlcylcbiAgICAgICAgICB2YXIgbmV3UGljcyA9IHJlc3BvbnNlLnBpY3NcblxuICAgICAgICAgIGlmIChuZXdQaWNzKSB7XG4gICAgICAgICAgICBuZXdQaWNzLmZvckVhY2goZnVuY3Rpb24ocGljKSB7XG4gICAgICAgICAgICAgIHZhciBwaWNEaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgICAgICAgICAgICBwaWNEaXYuY2xhc3NMaXN0LmFkZCgncGljJylcblxuICAgICAgICAgICAgICBwaWNzQm94LmFwcGVuZENoaWxkKHBpY0RpdilcbiAgICAgICAgICAgICAgcGljRGl2LmlubmVySFRNTCA9IFwiPGltZyBzcmM9J2h0dHBzOi8vczMtdXMtd2VzdC0xLmFtYXpvbmF3cy5jb20vYmJxdHJhY2tlci9cIiArIHBpYy5maWxlbmFtZSArIFwiJz48YnV0dG9uIHR5cGU9J2J1dHRvbicgY2xhc3M9J3JlbW92ZS1waWMnPlJlbW92ZSBQaWN0dXJlPC9idXR0b24+XCJcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gYWRkL3JlbW92ZSBmaWxlIHVwbG9hZCBmaWVsZHMgb24gdXBkYXRlIHdpdGhvdXQgcGFnZSByZWZyZXNoXG4gICAgICAgICAgdmFyIHVwbG9hZEJveCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5waWNzLXVwbG9hZC1ib3gnKVxuICAgICAgICAgIHZhciB1cGxvYWRCdG5zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnBpYy11cGxvYWQnKVxuXG4gICAgICAgICAgdXBsb2FkQnRucy5mb3JFYWNoKGZ1bmN0aW9uKGJ0bikge1xuICAgICAgICAgICAgYnRuLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoYnRuKVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IDY7IGkrKykge1xuICAgICAgICAgICAgdmFyIHVwbG9hZERpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgICAgICAgICB1cGxvYWREaXYuY2xhc3NMaXN0LmFkZCgncGljLXVwbG9hZCcpXG5cbiAgICAgICAgICAgIHVwbG9hZEJveC5hcHBlbmRDaGlsZCh1cGxvYWREaXYpXG4gICAgICAgICAgICB1cGxvYWREaXYuaW5uZXJIVE1MID0gXCI8bGFiZWw+VXBsb2FkIFBpY3R1cmUgXCIgKyBbaV0gKyBcIjwvbGFiZWw+PGlucHV0IGlkPSdmaWxlXCIgKyBbaV0gKyBcIicgdHlwZT0nZmlsZScgbmFtZT0nZmlsZVwiICsgW2ldICsgXCInPlwiXG4gICAgICAgICAgfVxuXG4gICAgICAgIH0pXG4gICAgICB9XG5cbiAgfSlcbn1cblxuLy8gdXBkYXRpbmcgbG9nXG52YXIgdXJsID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lXG52YXIgbG9nSWQgPSB1cmwuc3BsaXQoJy8nKS5wb3AoKVxuXG5mdW5jdGlvbiB4aHJQcm9taXNlVXBkYXRlKGYpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KClcbiAgICB4aHIub3BlbigncHV0JywgJy92aWV3LWxvZy8nICsgbG9nSWQpXG4gICAgeGhyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbigpe1xuICAgICAgaWYgKHhoci5yZWFkeVN0YXRlID09IFhNTEh0dHBSZXF1ZXN0LkRPTkUpIHtcbiAgICAgICAgcmVzb2x2ZSh4aHIucmVzcG9uc2VUZXh0KVxuICAgICAgfVxuICAgIH0pXG4gICAgeGhyLmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgcmVqZWN0KVxuXG4gICAgeGhyLnNlbmQoZilcblxuICB9KVxufVxuXG5cbi8vIHVwZGF0aW5nIGxvZyAtIG1vYmlsZVxuZnVuY3Rpb24gdXBkYXRlTG9nKGxvZ0RhdGEpIHtcbiAgZmV0Y2goJy92aWV3LWxvZy8nICsgbG9nSWQsIHtcbiAgICBtZXRob2Q6ICdQVVQnLFxuICAgIGhlYWRlcnM6IHtcbiAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICB9LFxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGxvZ0RhdGEpLFxuICAgIG1vZGU6ICdjb3JzJyxcbiAgICBjYWNoZTogJ2RlZmF1bHQnLFxuICAgIGNyZWRlbnRpYWxzOiAnaW5jbHVkZSdcbiAgfSlcbiAgICAudGhlbihmdW5jdGlvbigpIHtcblxuICAgICAgdmFyIGxvYWRlciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wb3AnKVxuICAgICAgbG9hZGVyLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobG9hZGVyKVxuICAgICAgICAgIFxuICAgICAgdmFyIGxvZ0JvZHkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbG9nLWJvZHknKVxuICAgICAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgICB2YXIgcG9wSFRNTCA9IFwiPHA+TG9nIHVwZGF0ZWQ8L3A+XCJcblxuICAgICAgZGl2LmNsYXNzTGlzdC5hZGQoJ3BvcC11cGRhdGUnKVxuICAgICAgZGl2LmlubmVySFRNTCA9IHBvcEhUTUxcbiAgICAgIGxvZ0JvZHkuYXBwZW5kQ2hpbGQoZGl2KVxuXG5cbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgZGl2LmNsYXNzTGlzdC5hZGQoJ3BvcC11cGRhdGUtZmFkZScpXG4gICAgICB9LCAwKVxuXG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgIGRpdi5jbGFzc0xpc3QucmVtb3ZlKCdwb3AtdXBkYXRlLWZhZGUnKVxuXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIGRpdi5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGRpdikgICAgICAgIFxuICAgICAgICB9LCAxMDAwKVxuXG4gICAgICB9LCAyMDAwKVxuXG4gICAgICAvLyBhZGQvcmVtb3ZlIHB1YmxpYyBsaW5rIG9uIHVwZGF0ZSB3aXRob3V0IHBhZ2UgcmVmcmVzaFxuICAgICAgdmFyIGgzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaDMnKVxuICAgICAgdmFyIHB1YkxpbmsgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjcHViLWxpbmsnKVxuICAgICAgdmFyIHN0YXR1cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyNzdGF0dXMtYm94IGlucHV0JylcbiAgICAgIHZhciBzdGF0dXNTZWxlY3RlZFxuXG4gICAgICBzdGF0dXMuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgIGlmIChpdGVtLmNoZWNrZWQpIHtcbiAgICAgICAgICBzdGF0dXNTZWxlY3RlZCA9IGl0ZW0udmFsdWVcbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgaWYgKChzdGF0dXNTZWxlY3RlZCA9PT0gJ1ByaXZhdGUnKSAmJiBoMykge1xuICAgICAgICBwdWJMaW5rLnJlbW92ZUNoaWxkKGgzKVxuICAgICAgfVxuXG4gICAgICBpZiAoKHN0YXR1c1NlbGVjdGVkID09PSAnUHVibGljJykgJiYgIWgzKSB7XG4gICAgICAgIHZhciBoMyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2gzJylcbiAgICAgICAgdmFyIHVybCA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZVxuICAgICAgICB2YXIgbG9nSWQgPSB1cmwuc3BsaXQoJy8nKS5wb3AoKVxuICAgICAgICB2YXIgaDNDb250ZW50ID0gXCI8YSBocmVmPScvcHVibGljLWxvZy9cIiArIGxvZ0lkICsgXCInPlB1YmxpYyBsaW5rIGhlcmU8L2E+XCJcbiAgICAgICAgaDMuaW5uZXJIVE1MID0gaDNDb250ZW50XG4gICAgICAgIHB1YkxpbmsuYXBwZW5kQ2hpbGQoaDMpXG4gICAgICB9XG5cbiAgICB9KVxufVxuXG5cbi8vIGxvZyBoaXN0b3J5IGNvbnRyb2xzXG52YXIgbW9kaWZ5ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xvZy1hY3Rpb24tYnRuJylcbmlmIChtb2RpZnkpIHtcbiAgbW9kaWZ5LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIG1vZE9wdGlvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsb2ctYWN0aW9uLW9wdGlvbnMnKS52YWx1ZVxuICAgIHZhciBsb2dzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmxvZy1zZWxlY3QnKVxuICAgIHZhciBzZWxlY3RlZExvZ3MgPSBbXVxuXG4gICAgbG9ncy5mb3JFYWNoKGZ1bmN0aW9uKGxvZykge1xuICAgICAgaWYgKGxvZy5jaGVja2VkKSB7XG4gICAgICAgIHZhciBpZCA9IGxvZy5jbG9zZXN0KCd0cicpLmdldEF0dHJpYnV0ZSgnaWQnKVxuICAgICAgICBzZWxlY3RlZExvZ3MucHVzaChpZClcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgICBpZiAobW9kT3B0aW9uID09PSAnQ29weScpIHtcbiAgICAgICAgY29weUxvZ3Moc2VsZWN0ZWRMb2dzKVxuICAgICAgfVxuXG4gICAgICBlbHNlIGlmIChtb2RPcHRpb24gPT09ICdEZWxldGUnKSB7XG4gICAgICAgIGRlbGV0ZUxvZ3Moc2VsZWN0ZWRMb2dzKVxuICAgICAgfVxuXG4gICAgICBlbHNlIGlmIChtb2RPcHRpb24gPT09ICdTd2l0Y2ggU3RhdHVzJykge1xuICAgICAgICBzdGF0dXNMb2dzKHNlbGVjdGVkTG9ncylcbiAgICAgIH1cblxuICB9KVxufVxuXG5mdW5jdGlvbiBjb3B5TG9ncyhzZWxlY3RlZCkge1xuICBmZXRjaCgnL2xvZy1oaXN0b3J5Jywge1xuICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgIGhlYWRlcnM6IHtcbiAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICB9LFxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHNlbGVjdGVkKSxcbiAgICBtb2RlOiAnY29ycycsXG4gICAgY2FjaGU6ICdkZWZhdWx0JyxcbiAgICBjcmVkZW50aWFsczogJ2luY2x1ZGUnXG4gIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICByZXR1cm4gcmVzLmpzb24oKVxuICAgIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICBpZiAocmVzLm1lc3NhZ2UgPT09IFwiTG9ncyBjb3BpZWRcIikge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24gPSAnL2xvZy1oaXN0b3J5P21lc3NhZ2U9TG9ncyUyMGNvcGllZCdcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKHJlcy5lcnJvciA9PT0gXCJObyBsb2dzIHNlbGVjdGVkXCIpIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uID0gJy9sb2ctaGlzdG9yeT9lcnJvcj1ObyUyMGxvZ3MlMjBzZWxlY3RlZCdcbiAgICAgIH1cbiAgIH0pXG59XG5cbmZ1bmN0aW9uIGRlbGV0ZUxvZ3Moc2VsZWN0ZWQpIHtcbiAgZmV0Y2goJy9sb2ctaGlzdG9yeScsIHtcbiAgICBtZXRob2Q6ICdERUxFVEUnLFxuICAgIGhlYWRlcnM6IHtcbiAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICB9LFxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHNlbGVjdGVkKSxcbiAgICBtb2RlOiAnY29ycycsXG4gICAgY2FjaGU6ICdkZWZhdWx0JyxcbiAgICBjcmVkZW50aWFsczogJ2luY2x1ZGUnXG4gIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICB3aW5kb3cubG9jYXRpb24gPSAnL2xvZy1oaXN0b3J5P21lc3NhZ2U9TG9ncyUyMGRlbGV0ZWQnXG4gICAgfSlcbn1cblxuZnVuY3Rpb24gc3RhdHVzTG9ncyhzZWxlY3RlZCkge1xuICBmZXRjaCgnL2xvZy1oaXN0b3J5Jywge1xuICAgIG1ldGhvZDogJ1BVVCcsXG4gICAgaGVhZGVyczoge1xuICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ1xuICAgIH0sXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkoc2VsZWN0ZWQpLFxuICAgIG1vZGU6ICdjb3JzJyxcbiAgICBjYWNoZTogJ2RlZmF1bHQnLFxuICAgIGNyZWRlbnRpYWxzOiAnaW5jbHVkZSdcbiAgfSlcbiAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgd2luZG93LmxvY2F0aW9uID0gJy9sb2ctaGlzdG9yeT9tZXNzYWdlPUxvZyUyMHN0YXR1cyUyMHN3aXRjaGVkJ1xuICAgIH0pXG59XG5cbi8vIGFkZCB2b3RlcyB0byBwdWJsaWMgbG9nXG52YXIgdm90ZUJ0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyN2b3RlLWJ0bicpXG5pZiAodm90ZUJ0bikge1xuICB2b3RlQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cbiAgdmFyIHVybCA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZVxuICB2YXIgbG9nSWQgPSB1cmwuc3BsaXQoJy8nKS5wb3AoKVxuXG4gICAgdmFyIGxvZyA9IHtcbiAgICAgIGF1dGhvcjogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2F1dGhvcicpLnRleHRDb250ZW50LFxuICAgICAgbG9nSWQ6IGxvZ0lkXG4gICAgfVxuXG4gICAgYWRkVm90ZShsb2cpXG4gIH0pXG59XG5cbmZ1bmN0aW9uIGFkZFZvdGUobG9nKSB7XG4gIGZldGNoKCcvcHVibGljLWxvZycsIHtcbiAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICBoZWFkZXJzOiB7XG4gICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgfSxcbiAgICBib2R5OiBKU09OLnN0cmluZ2lmeShsb2cpLFxuICAgIG1vZGU6ICdjb3JzJyxcbiAgICBjYWNoZTogJ2RlZmF1bHQnLFxuICAgIGNyZWRlbnRpYWxzOiAnaW5jbHVkZSdcbiAgfSlcbiAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgIHJldHVybiByZXMuanNvbigpXG4gICAgfSlcbiAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgIHZhciB1cGRhdGVkVm90ZXMgPSByZXMudm90ZXNcbiAgICAgIHZhciB2b3RlQ291bnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjdm90ZS1jb3VudCcpXG4gICAgICB2YXIgdm90ZUNvdW50Qm94ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3ZvdGUtY291bnQtYm94JylcbiAgICAgIHZhciB2b3RlQnRuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3ZvdGUtYnRuJylcblxuICAgICAgdm90ZUNvdW50LmlubmVySFRNTCA9IHVwZGF0ZWRWb3Rlc1xuICAgICAgdm90ZUJ0bi5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHZvdGVCdG4pXG5cbiAgICAgIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgICAgZGl2LnN0eWxlLmZsb2F0ID0gJ3JpZ2h0J1xuICAgICAgdm90ZUNvdW50Qm94LmFwcGVuZENoaWxkKGRpdilcbiAgICAgIGRpdi5pbm5lckhUTUwgPSAnVm90ZWQnXG4gICAgfSlcbn1cblxuXG5cblxuLyoqKioqIEFDQ09VTlRTIFBBR0UgKioqKiovXG5cbi8vIGRpc3BsYXlpbmcgb3B0aW9uIGZpZWxkcyBvbiBjbGlja1xudmFyIG5ld1VzZXJuYW1lID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI25ldy11c2VybmFtZS1idG4nKVxudmFyIG5ld0VtYWlsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI25ldy1lbWFpbC1idG4nKVxudmFyIG5ld1BXID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI25ldy1wdy1idG4nKVxudmFyIGRlbGV0ZUFjY291bnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZGVsZXRlLWFjY291bnQtYnRuJylcblxuaWYgKG5ld1VzZXJuYW1lKSB7XG4gIG5ld1VzZXJuYW1lLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICB2YXIgZmllbGQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbmV3LXVzZXJuYW1lLWZpZWxkJylcbiAgICBmaWVsZC5jbGFzc0xpc3QudG9nZ2xlKCdoaWRkZW4nKVxuICB9KVxufVxuXG5pZiAobmV3RW1haWwpIHtcbiAgbmV3RW1haWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuICAgIHZhciBmaWVsZCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNuZXctZW1haWwtZmllbGQnKVxuICAgIGZpZWxkLmNsYXNzTGlzdC50b2dnbGUoJ2hpZGRlbicpXG4gIH0pXG59XG5cbmlmIChuZXdQVykge1xuICBuZXdQVy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgdmFyIGZpZWxkID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI25ldy1wdy1maWVsZCcpXG4gICAgZmllbGQuY2xhc3NMaXN0LnRvZ2dsZSgnaGlkZGVuJylcbiAgfSlcbn1cblxuaWYgKGRlbGV0ZUFjY291bnQpIHtcbiAgZGVsZXRlQWNjb3VudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgdmFyIGZpZWxkID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2RlbGV0ZS1hY2NvdW50LWZpZWxkJylcbiAgICBmaWVsZC5jbGFzc0xpc3QudG9nZ2xlKCdoaWRkZW4nKVxuICB9KVxufVxuXG4vLyBuZXcgdXNlcm5hbWVcbnZhciBuZXdVc2VybmFtZVN1Ym1pdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNuZXctdXNlcm5hbWUtc3VibWl0JylcbmlmIChuZXdVc2VybmFtZVN1Ym1pdCkge1xuICBuZXdVc2VybmFtZVN1Ym1pdC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXG4gIHZhciBuZXdVc2VybmFtZVZhbHVlID0geyB1c2VybmFtZTogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI25ldy11c2VybmFtZScpLnZhbHVlIH1cbiAgY2hhbmdlVXNlcm5hbWUobmV3VXNlcm5hbWVWYWx1ZSlcblxuICB9KVxufVxuXG5mdW5jdGlvbiBjaGFuZ2VVc2VybmFtZShuZXdVc2VybmFtZVZhbHVlKSB7XG4gIGZldGNoKCcvYWNjb3VudC91c2VybmFtZScsIHtcbiAgICBtZXRob2Q6ICdQVVQnLFxuICAgIGhlYWRlcnM6IHtcbiAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICB9LFxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KG5ld1VzZXJuYW1lVmFsdWUpLFxuICAgIG1vZGU6ICdjb3JzJyxcbiAgICBjYWNoZTogJ2RlZmF1bHQnLFxuICAgIGNyZWRlbnRpYWxzOiAnaW5jbHVkZSdcbiAgfSlcbiAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgIHJldHVybiByZXMuanNvbigpXG4gICAgfSlcbiAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgIGlmIChyZXMubWVzc2FnZSA9PT0gXCJVc2VybmFtZSBjaGFuZ2VkXCIpIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uID0gJy9hY2NvdW50P21lc3NhZ2U9VXNlcm5hbWUlMjBjaGFuZ2VkJ1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAocmVzLmVycm9yID09PSBcIlN1cHBseSBhIG5ldyB1c2VybmFtZVwiKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbiA9ICcvYWNjb3VudD9lcnJvcj1TdXBwbHklMjBhJTIwbmV3JTIwdXNlcm5hbWUnXG4gICAgICB9XG4gICAgICBlbHNlIGlmIChyZXMuZXJyb3IgPT09IFwiTm8gc3BhY2VzIGFsbG93ZWQgaW4gdXNlcm5hbWVcIikge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24gPSAnL2FjY291bnQ/ZXJyb3I9Tm8lMjBzcGFjZXMlMjBhbGxvd2VkJTIwaW4lMjB1c2VybmFtZSdcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKHJlcy5lcnJvciA9PT0gXCJVc2VybmFtZSBpcyBsaW1pdGVkIHRvIDE1IGNoYXJhY3RlcnNcIikge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24gPSAnL2FjY291bnQ/ZXJyb3I9VXNlcm5hbWUlMjBpcyUyMGxpbWl0ZWQlMjB0byUyMDE1JTIwY2hhcmFjdGVycydcbiAgICAgIH1cblxuICAgIH0pXG59XG5cbi8vIGNoYW5nZSBhdmF0YXJcbnZhciBjb3dBdmF0YXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjY293LWF2YXRhcicpXG52YXIgY2hpY2tlbkF2YXRhciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNjaGlja2VuLWF2YXRhcicpXG52YXIgcGlnQXZhdGFyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3BpZy1hdmF0YXInKVxuXG5pZiAoY293QXZhdGFyICYmICFjb3dBdmF0YXIuY2xhc3NMaXN0LmNvbnRhaW5zKCdhdmF0YXItaGlnaGxpZ2h0JykpIHtcbiAgY293QXZhdGFyLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGF2YXRhclJlcSA9IHsgYXZhdGFyOiAnLi4vaW1hZ2VzL2Nvdy5zdmcnIH1cbiAgICBjaGFuZ2VBdmF0YXIoYXZhdGFyUmVxKVxuICB9KVxufVxuXG5pZiAoY2hpY2tlbkF2YXRhciAmJiAhY2hpY2tlbkF2YXRhci5jbGFzc0xpc3QuY29udGFpbnMoJ2F2YXRhci1oaWdobGlnaHQnKSkge1xuICBjaGlja2VuQXZhdGFyLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGF2YXRhclJlcSA9IHsgYXZhdGFyOiAnLi4vaW1hZ2VzL2NoaWNrZW4uc3ZnJyB9XG4gICAgY2hhbmdlQXZhdGFyKGF2YXRhclJlcSlcbiAgfSlcbn1cblxuaWYgKHBpZ0F2YXRhciAmJiAhcGlnQXZhdGFyLmNsYXNzTGlzdC5jb250YWlucygnYXZhdGFyLWhpZ2hsaWdodCcpKSB7XG4gIHBpZ0F2YXRhci5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBhdmF0YXJSZXEgPSB7IGF2YXRhcjogJy4uL2ltYWdlcy9waWcuc3ZnJyB9XG4gICAgY2hhbmdlQXZhdGFyKGF2YXRhclJlcSlcbiAgfSlcbn1cblxuZnVuY3Rpb24gY2hhbmdlQXZhdGFyKGF2YXRhclJlcSkge1xuICBmZXRjaCgnL2FjY291bnQvYXZhdGFyJywge1xuICAgIG1ldGhvZDogJ1BVVCcsXG4gICAgaGVhZGVyczoge1xuICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ1xuICAgIH0sXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkoYXZhdGFyUmVxKSxcbiAgICBtb2RlOiAnY29ycycsXG4gICAgY2FjaGU6ICdkZWZhdWx0JyxcbiAgICBjcmVkZW50aWFsczogJ2luY2x1ZGUnXG4gIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICB3aW5kb3cubG9jYXRpb24gPSAnL2FjY291bnQ/bWVzc2FnZT1BdmF0YXIlMjBjaGFuZ2VkJ1xuICAgIH0pXG59XG5cblxuLy8gY2hhbmdlIGVtYWlsXG52YXIgbmV3RW1haWxTdWJtaXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbmV3LWVtYWlsLXN1Ym1pdCcpXG5pZiAobmV3RW1haWxTdWJtaXQpIHtcbiAgbmV3RW1haWxTdWJtaXQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcblxuICB2YXIgbmV3RW1haWxWYWx1ZSA9IHsgZW1haWw6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNuZXctcmVnLWVtYWlsJykudmFsdWUgfVxuICBjaGFuZ2VFbWFpbChuZXdFbWFpbFZhbHVlKVxuXG4gIH0pXG59XG5cbmZ1bmN0aW9uIGNoYW5nZUVtYWlsKG5ld0VtYWlsVmFsdWUpIHtcbiAgZmV0Y2goJy9hY2NvdW50L2VtYWlsJywge1xuICAgIG1ldGhvZDogJ1BVVCcsXG4gICAgaGVhZGVyczoge1xuICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ1xuICAgIH0sXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkobmV3RW1haWxWYWx1ZSksXG4gICAgbW9kZTogJ2NvcnMnLFxuICAgIGNhY2hlOiAnZGVmYXVsdCcsXG4gICAgY3JlZGVudGlhbHM6ICdpbmNsdWRlJ1xuICB9KVxuICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgcmV0dXJuIHJlcy5qc29uKClcbiAgICB9KVxuICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgaWYgKHJlcy5tZXNzYWdlID09PSAnRW1haWwgY2hhbmdlZCcpIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uID0gJy9hY2NvdW50P21lc3NhZ2U9RW1haWwlMjBjaGFuZ2VkJ1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAocmVzLmVycm9yID09PSAnU3VwcGx5IGFuIGVtYWlsIGFkZHJlc3MnKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbiA9ICcvYWNjb3VudD9lcnJvcj1TdXBwbHklMjBhbiUyMGVtYWlsJTIwYWRkcmVzcydcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKHJlcy5lcnJvciA9PT0gJ05vIHNwYWNlcyBhbGxvd2VkIGluIGVtYWlsIGFkZHJlc3MnKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbiA9ICcvYWNjb3VudD9lcnJvcj1ObyUyMHNwYWNlcyUyMGFsbG93ZWQlMjBpbiUyMGVtYWlsJTIwYWRkcmVzcydcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKHJlcy5lcnJvciA9PT0gJ0VtYWlsIGRvZXMgbm90IGNvbnRhaW4gQCcpIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uID0gJy9hY2NvdW50P2Vycm9yPUVtYWlsJTIwZG9lcyUyMG5vdCUyMGNvbnRhaW4lMjBAJ1xuICAgICAgfVxuICAgIH0pXG59XG5cbi8vIGNoYW5nZSBwYXNzd29yZFxudmFyIG5ld1Bhc3N3b3JkU3VibWl0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI25ldy1wdy1zdWJtaXQnKVxuaWYgKG5ld1Bhc3N3b3JkU3VibWl0KSB7XG4gIG5ld1Bhc3N3b3JkU3VibWl0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cbiAgdmFyIG5ld1BXID0geyBcbiAgICBwYXNzd29yZDogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI25ldy1wdycpLnZhbHVlLFxuICAgIHBhc3N3b3JkMjogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI25ldy1wdzInKS52YWx1ZSxcbiAgfVxuXG4gIGNoYW5nZVBXKG5ld1BXKVxuXG4gIH0pXG59XG5cbmZ1bmN0aW9uIGNoYW5nZVBXKG5ld1BXKSB7XG4gIGZldGNoKCcvYWNjb3VudC9wYXNzd29yZCcsIHtcbiAgICBtZXRob2Q6ICdQVVQnLFxuICAgIGhlYWRlcnM6IHtcbiAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICB9LFxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KG5ld1BXKSxcbiAgICBtb2RlOiAnY29ycycsXG4gICAgY2FjaGU6ICdkZWZhdWx0JyxcbiAgICBjcmVkZW50aWFsczogJ2luY2x1ZGUnXG4gIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICByZXR1cm4gcmVzLmpzb24oKVxuICAgIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICBpZiAocmVzLm1lc3NhZ2UgPT09ICdQYXNzd29yZCBjaGFuZ2VkJykge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24gPSAnL2FjY291bnQ/bWVzc2FnZT1QYXNzd29yZCUyMGNoYW5nZWQnXG4gICAgICB9XG4gICAgICBlbHNlIGlmIChyZXMuZXJyb3IgPT09ICdTdXBwbHkgYSBwYXNzd29yZCcpIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uID0gJy9hY2NvdW50P2Vycm9yPVN1cHBseSUyMGElMjBwYXNzd29yZCdcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKHJlcy5lcnJvciA9PT0gJ1Bhc3N3b3JkIG11c3QgYmUgYSBtaW5pbXVtIG9mIDUgY2hhcmFjdGVycycpIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uID0gJy9hY2NvdW50P2Vycm9yPVBhc3N3b3JkJTIwbXVzdCUyMGJlJTIwYSUyMG1pbmltdW0lMjBvZiUyMDUlMjBjaGFyYWN0ZXJzJ1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAocmVzLmVycm9yID09PSAnQ29uZmlybSB5b3VyIHBhc3N3b3JkJykge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24gPSAnL2FjY291bnQ/ZXJyb3I9Q29uZmlybSUyMHlvdXIlMjBwYXNzd29yZCdcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKHJlcy5lcnJvciA9PT0gJ1Bhc3N3b3JkcyBkbyBub3QgbWF0Y2gnKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbiA9ICcvYWNjb3VudD9lcnJvcj1QYXNzd29yZHMlMjBkbyUyMG5vdCUyMG1hdGNoJ1xuICAgICAgfVxuICAgIH0pXG59XG5cbi8vIGRlbGV0ZSBhY2NvdW50XG52YXIgcG9wRGVsZXRlVXNlciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNwb3AtZGVsLXVzZXInKVxudmFyIGFjY291bnRNYWluID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FjY291bnQtbWFpbicpXG5cbnZhciBkZWxldGVBY2NvdW50U3VibWl0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2RlbGV0ZS1hY2NvdW50LXN1Ym1pdCcpXG5pZiAoZGVsZXRlQWNjb3VudFN1Ym1pdCkge1xuICBkZWxldGVBY2NvdW50U3VibWl0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgdmFyIHBvcEhUTUwgPSBcIjxwPkNvbmZpcm1pbmcgd2lsbCBkZWxldGUgeW91ciBwcm9maWxlLiBBcmUgeW91IHN1cmU/PC9wPjxkaXYgaWQ9J3BvcC1kZWwtb3B0aW9ucyc+PGJ1dHRvbiBpZD0nZGVsLXllcyc+WWVzPC9idXR0b24+PGJ1dHRvbiBpZD0nZGVsLW5vJz5ObzwvYnV0dG9uPjwvZGl2PlwiXG5cbiAgICBkaXYuc2V0QXR0cmlidXRlKCdpZCcsICdwb3AtZGVsJylcbiAgICBkaXYuaW5uZXJIVE1MID0gcG9wSFRNTFxuICAgIGFjY291bnRNYWluLmFwcGVuZENoaWxkKGRpdilcblxuICAgIHZhciBkZWxObyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNkZWwtbm8nKVxuICAgIGlmIChkZWxObykge1xuICAgICAgZGVsTm8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHBvcERlbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNwb3AtZGVsJylcbiAgICAgICAgcG9wRGVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQocG9wRGVsKVxuICAgICAgfSlcbiAgICB9XG5cbiAgICB2YXIgZGVsWWVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2RlbC15ZXMnKVxuICAgIGlmIChkZWxZZXMpIHtcbiAgICAgIGRlbFllcy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICBkZWxldGVVc2VyKClcbiAgICAgIH0pXG4gICAgfVxuXG4gIH0pXG59XG5cbmZ1bmN0aW9uIGRlbGV0ZVVzZXIoKSB7XG4gIGZldGNoKCcvYWNjb3VudCcsIHtcbiAgICBtZXRob2Q6ICdERUxFVEUnLFxuICAgIGhlYWRlcnM6IHtcbiAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICB9LFxuICAgIG1vZGU6ICdjb3JzJyxcbiAgICBjYWNoZTogJ2RlZmF1bHQnLFxuICAgIGNyZWRlbnRpYWxzOiAnaW5jbHVkZSdcbiAgfSlcbiAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgIHdpbmRvdy5sb2NhdGlvbiA9ICcvJ1xuICAgIH0pXG59IiwiLypcbiAgICBkYXRlcGlja3IgMy4wIC0gcGljayB5b3VyIGRhdGUgbm90IHlvdXIgbm9zZVxuXG4gICAgaHR0cHM6Ly9naXRodWIuY29tL2pvc2hzYWx2ZXJkYS9kYXRlcGlja3JcblxuICAgIENvcHlyaWdodCDCqSAyMDE0IEpvc2ggU2FsdmVyZGEgPGpvc2guc2FsdmVyZGFAZ21haWwuY29tPlxuICAgIFRoaXMgd29yayBpcyBmcmVlLiBZb3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0IHVuZGVyIHRoZVxuICAgIHRlcm1zIG9mIHRoZSBEbyBXaGF0IFRoZSBGdWNrIFlvdSBXYW50IFRvIFB1YmxpYyBMaWNlbnNlLCBWZXJzaW9uIDIsXG4gICAgYXMgcHVibGlzaGVkIGJ5IFNhbSBIb2NldmFyLiBTZWUgaHR0cDovL3d3dy53dGZwbC5uZXQvIGZvciBtb3JlIGRldGFpbHMuXG4qL1xuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZnVuY3Rpb24oKSB7XG4gIGRhdGVwaWNrcignI2RhdGUtc2VsZWN0Jylcbn0pXG5cbnZhciBkYXRlcGlja3IgPSBmdW5jdGlvbiAoc2VsZWN0b3IsIGNvbmZpZykge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICB2YXIgZWxlbWVudHMsXG4gICAgICAgIGNyZWF0ZUluc3RhbmNlLFxuICAgICAgICBpbnN0YW5jZXMgPSBbXSxcbiAgICAgICAgaTtcblxuICAgIGRhdGVwaWNrci5wcm90b3R5cGUgPSBkYXRlcGlja3IuaW5pdC5wcm90b3R5cGU7XG5cbiAgICBjcmVhdGVJbnN0YW5jZSA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgIGlmIChlbGVtZW50Ll9kYXRlcGlja3IpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuX2RhdGVwaWNrci5kZXN0cm95KCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxlbWVudC5fZGF0ZXBpY2tyID0gbmV3IGRhdGVwaWNrci5pbml0KGVsZW1lbnQsIGNvbmZpZyk7XG4gICAgICAgIHJldHVybiBlbGVtZW50Ll9kYXRlcGlja3I7XG4gICAgfTtcblxuICAgIGlmIChzZWxlY3Rvci5ub2RlTmFtZSkge1xuICAgICAgICByZXR1cm4gY3JlYXRlSW5zdGFuY2Uoc2VsZWN0b3IpO1xuICAgIH1cblxuICAgIGVsZW1lbnRzID0gZGF0ZXBpY2tyLnByb3RvdHlwZS5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcblxuICAgIGlmIChlbGVtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUluc3RhbmNlKGVsZW1lbnRzWzBdKTtcbiAgICB9XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgZWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaW5zdGFuY2VzLnB1c2goY3JlYXRlSW5zdGFuY2UoZWxlbWVudHNbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIGluc3RhbmNlcztcbn07XG5cbmRhdGVwaWNrci5pbml0ID0gZnVuY3Rpb24gKGVsZW1lbnQsIGluc3RhbmNlQ29uZmlnKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIHZhciBzZWxmID0gdGhpcyxcbiAgICAgICAgZGVmYXVsdENvbmZpZyA9IHtcbiAgICAgICAgICAgIGRhdGVGb3JtYXQ6ICdGIGosIFknLFxuICAgICAgICAgICAgYWx0Rm9ybWF0OiBudWxsLFxuICAgICAgICAgICAgYWx0SW5wdXQ6IG51bGwsXG4gICAgICAgICAgICBtaW5EYXRlOiBudWxsLFxuICAgICAgICAgICAgbWF4RGF0ZTogbnVsbCxcbiAgICAgICAgICAgIHNob3J0aGFuZEN1cnJlbnRNb250aDogZmFsc2VcbiAgICAgICAgfSxcbiAgICAgICAgY2FsZW5kYXJDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcbiAgICAgICAgbmF2aWdhdGlvbkN1cnJlbnRNb250aCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKSxcbiAgICAgICAgY2FsZW5kYXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0YWJsZScpLFxuICAgICAgICBjYWxlbmRhckJvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0Ym9keScpLFxuICAgICAgICB3cmFwcGVyRWxlbWVudCxcbiAgICAgICAgY3VycmVudERhdGUgPSBuZXcgRGF0ZSgpLFxuICAgICAgICB3cmFwLFxuICAgICAgICBkYXRlLFxuICAgICAgICBmb3JtYXREYXRlLFxuICAgICAgICBtb250aFRvU3RyLFxuICAgICAgICBpc1NwZWNpZmljRGF5LFxuICAgICAgICBidWlsZFdlZWtkYXlzLFxuICAgICAgICBidWlsZERheXMsXG4gICAgICAgIHVwZGF0ZU5hdmlnYXRpb25DdXJyZW50TW9udGgsXG4gICAgICAgIGJ1aWxkTW9udGhOYXZpZ2F0aW9uLFxuICAgICAgICBoYW5kbGVZZWFyQ2hhbmdlLFxuICAgICAgICBkb2N1bWVudENsaWNrLFxuICAgICAgICBjYWxlbmRhckNsaWNrLFxuICAgICAgICBidWlsZENhbGVuZGFyLFxuICAgICAgICBnZXRPcGVuRXZlbnQsXG4gICAgICAgIGJpbmQsXG4gICAgICAgIG9wZW4sXG4gICAgICAgIGNsb3NlLFxuICAgICAgICBkZXN0cm95LFxuICAgICAgICBpbml0O1xuXG4gICAgY2FsZW5kYXJDb250YWluZXIuY2xhc3NOYW1lID0gJ2RhdGVwaWNrci1jYWxlbmRhcic7XG4gICAgbmF2aWdhdGlvbkN1cnJlbnRNb250aC5jbGFzc05hbWUgPSAnZGF0ZXBpY2tyLWN1cnJlbnQtbW9udGgnO1xuICAgIGluc3RhbmNlQ29uZmlnID0gaW5zdGFuY2VDb25maWcgfHwge307XG5cbiAgICB3cmFwID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB3cmFwcGVyRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICB3cmFwcGVyRWxlbWVudC5jbGFzc05hbWUgPSAnZGF0ZXBpY2tyLXdyYXBwZXInO1xuICAgICAgICBzZWxmLmVsZW1lbnQucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUod3JhcHBlckVsZW1lbnQsIHNlbGYuZWxlbWVudCk7XG4gICAgICAgIHdyYXBwZXJFbGVtZW50LmFwcGVuZENoaWxkKHNlbGYuZWxlbWVudCk7XG4gICAgfTtcblxuICAgIGRhdGUgPSB7XG4gICAgICAgIGN1cnJlbnQ6IHtcbiAgICAgICAgICAgIHllYXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY3VycmVudERhdGUuZ2V0RnVsbFllYXIoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtb250aDoge1xuICAgICAgICAgICAgICAgIGludGVnZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnREYXRlLmdldE1vbnRoKCk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzdHJpbmc6IGZ1bmN0aW9uIChzaG9ydGhhbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1vbnRoID0gY3VycmVudERhdGUuZ2V0TW9udGgoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1vbnRoVG9TdHIobW9udGgsIHNob3J0aGFuZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRheTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjdXJyZW50RGF0ZS5nZXREYXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIG1vbnRoOiB7XG4gICAgICAgICAgICBzdHJpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbW9udGhUb1N0cihzZWxmLmN1cnJlbnRNb250aFZpZXcsIHNlbGYuY29uZmlnLnNob3J0aGFuZEN1cnJlbnRNb250aCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbnVtRGF5czogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8vIGNoZWNrcyB0byBzZWUgaWYgZmVicnVhcnkgaXMgYSBsZWFwIHllYXIgb3RoZXJ3aXNlIHJldHVybiB0aGUgcmVzcGVjdGl2ZSAjIG9mIGRheXNcbiAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5jdXJyZW50TW9udGhWaWV3ID09PSAxICYmICgoKHNlbGYuY3VycmVudFllYXJWaWV3ICUgNCA9PT0gMCkgJiYgKHNlbGYuY3VycmVudFllYXJWaWV3ICUgMTAwICE9PSAwKSkgfHwgKHNlbGYuY3VycmVudFllYXJWaWV3ICUgNDAwID09PSAwKSkgPyAyOSA6IHNlbGYubDEwbi5kYXlzSW5Nb250aFtzZWxmLmN1cnJlbnRNb250aFZpZXddO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIGZvcm1hdERhdGUgPSBmdW5jdGlvbiAoZGF0ZUZvcm1hdCwgbWlsbGlzZWNvbmRzKSB7XG4gICAgICAgIHZhciBmb3JtYXR0ZWREYXRlID0gJycsXG4gICAgICAgICAgICBkYXRlT2JqID0gbmV3IERhdGUobWlsbGlzZWNvbmRzKSxcbiAgICAgICAgICAgIGZvcm1hdHMgPSB7XG4gICAgICAgICAgICAgICAgZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGF5ID0gZm9ybWF0cy5qKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoZGF5IDwgMTApID8gJzAnICsgZGF5IDogZGF5O1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgRDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5sMTBuLndlZWtkYXlzLnNob3J0aGFuZFtmb3JtYXRzLncoKV07XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBqOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkYXRlT2JqLmdldERhdGUoKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYubDEwbi53ZWVrZGF5cy5sb25naGFuZFtmb3JtYXRzLncoKV07XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB3OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkYXRlT2JqLmdldERheSgpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgRjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbW9udGhUb1N0cihmb3JtYXRzLm4oKSAtIDEsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG06IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1vbnRoID0gZm9ybWF0cy5uKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAobW9udGggPCAxMCkgPyAnMCcgKyBtb250aCA6IG1vbnRoO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgTTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbW9udGhUb1N0cihmb3JtYXRzLm4oKSAtIDEsIHRydWUpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGF0ZU9iai5nZXRNb250aCgpICsgMTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIFU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRhdGVPYmouZ2V0VGltZSgpIC8gMTAwMDtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHk6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFN0cmluZyhmb3JtYXRzLlkoKSkuc3Vic3RyaW5nKDIpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgWTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGF0ZU9iai5nZXRGdWxsWWVhcigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmb3JtYXRQaWVjZXMgPSBkYXRlRm9ybWF0LnNwbGl0KCcnKTtcblxuICAgICAgICBzZWxmLmZvckVhY2goZm9ybWF0UGllY2VzLCBmdW5jdGlvbiAoZm9ybWF0UGllY2UsIGluZGV4KSB7XG4gICAgICAgICAgICBpZiAoZm9ybWF0c1tmb3JtYXRQaWVjZV0gJiYgZm9ybWF0UGllY2VzW2luZGV4IC0gMV0gIT09ICdcXFxcJykge1xuICAgICAgICAgICAgICAgIGZvcm1hdHRlZERhdGUgKz0gZm9ybWF0c1tmb3JtYXRQaWVjZV0oKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGZvcm1hdFBpZWNlICE9PSAnXFxcXCcpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9ybWF0dGVkRGF0ZSArPSBmb3JtYXRQaWVjZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBmb3JtYXR0ZWREYXRlO1xuICAgIH07XG5cbiAgICBtb250aFRvU3RyID0gZnVuY3Rpb24gKGRhdGUsIHNob3J0aGFuZCkge1xuICAgICAgICBpZiAoc2hvcnRoYW5kID09PSB0cnVlKSB7XG4gICAgICAgICAgICByZXR1cm4gc2VsZi5sMTBuLm1vbnRocy5zaG9ydGhhbmRbZGF0ZV07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc2VsZi5sMTBuLm1vbnRocy5sb25naGFuZFtkYXRlXTtcbiAgICB9O1xuXG4gICAgaXNTcGVjaWZpY0RheSA9IGZ1bmN0aW9uIChkYXksIG1vbnRoLCB5ZWFyLCBjb21wYXJpc29uKSB7XG4gICAgICAgIHJldHVybiBkYXkgPT09IGNvbXBhcmlzb24gJiYgc2VsZi5jdXJyZW50TW9udGhWaWV3ID09PSBtb250aCAmJiBzZWxmLmN1cnJlbnRZZWFyVmlldyA9PT0geWVhcjtcbiAgICB9O1xuXG4gICAgYnVpbGRXZWVrZGF5cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHdlZWtkYXlDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0aGVhZCcpLFxuICAgICAgICAgICAgZmlyc3REYXlPZldlZWsgPSBzZWxmLmwxMG4uZmlyc3REYXlPZldlZWssXG4gICAgICAgICAgICB3ZWVrZGF5cyA9IHNlbGYubDEwbi53ZWVrZGF5cy5zaG9ydGhhbmQ7XG5cbiAgICAgICAgaWYgKGZpcnN0RGF5T2ZXZWVrID4gMCAmJiBmaXJzdERheU9mV2VlayA8IHdlZWtkYXlzLmxlbmd0aCkge1xuICAgICAgICAgICAgd2Vla2RheXMgPSBbXS5jb25jYXQod2Vla2RheXMuc3BsaWNlKGZpcnN0RGF5T2ZXZWVrLCB3ZWVrZGF5cy5sZW5ndGgpLCB3ZWVrZGF5cy5zcGxpY2UoMCwgZmlyc3REYXlPZldlZWspKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHdlZWtkYXlDb250YWluZXIuaW5uZXJIVE1MID0gJzx0cj48dGg+JyArIHdlZWtkYXlzLmpvaW4oJzwvdGg+PHRoPicpICsgJzwvdGg+PC90cj4nO1xuICAgICAgICBjYWxlbmRhci5hcHBlbmRDaGlsZCh3ZWVrZGF5Q29udGFpbmVyKTtcbiAgICB9O1xuXG4gICAgYnVpbGREYXlzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZmlyc3RPZk1vbnRoID0gbmV3IERhdGUoc2VsZi5jdXJyZW50WWVhclZpZXcsIHNlbGYuY3VycmVudE1vbnRoVmlldywgMSkuZ2V0RGF5KCksXG4gICAgICAgICAgICBudW1EYXlzID0gZGF0ZS5tb250aC5udW1EYXlzKCksXG4gICAgICAgICAgICBjYWxlbmRhckZyYWdtZW50ID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpLFxuICAgICAgICAgICAgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndHInKSxcbiAgICAgICAgICAgIGRheUNvdW50LFxuICAgICAgICAgICAgZGF5TnVtYmVyLFxuICAgICAgICAgICAgdG9kYXkgPSAnJyxcbiAgICAgICAgICAgIHNlbGVjdGVkID0gJycsXG4gICAgICAgICAgICBkaXNhYmxlZCA9ICcnLFxuICAgICAgICAgICAgY3VycmVudFRpbWVzdGFtcDtcblxuICAgICAgICAvLyBPZmZzZXQgdGhlIGZpcnN0IGRheSBieSB0aGUgc3BlY2lmaWVkIGFtb3VudFxuICAgICAgICBmaXJzdE9mTW9udGggLT0gc2VsZi5sMTBuLmZpcnN0RGF5T2ZXZWVrO1xuICAgICAgICBpZiAoZmlyc3RPZk1vbnRoIDwgMCkge1xuICAgICAgICAgICAgZmlyc3RPZk1vbnRoICs9IDc7XG4gICAgICAgIH1cblxuICAgICAgICBkYXlDb3VudCA9IGZpcnN0T2ZNb250aDtcbiAgICAgICAgY2FsZW5kYXJCb2R5LmlubmVySFRNTCA9ICcnO1xuXG4gICAgICAgIC8vIEFkZCBzcGFjZXIgdG8gbGluZSB1cCB0aGUgZmlyc3QgZGF5IG9mIHRoZSBtb250aCBjb3JyZWN0bHlcbiAgICAgICAgaWYgKGZpcnN0T2ZNb250aCA+IDApIHtcbiAgICAgICAgICAgIHJvdy5pbm5lckhUTUwgKz0gJzx0ZCBjb2xzcGFuPVwiJyArIGZpcnN0T2ZNb250aCArICdcIj4mbmJzcDs8L3RkPic7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTdGFydCBhdCAxIHNpbmNlIHRoZXJlIGlzIG5vIDB0aCBkYXlcbiAgICAgICAgZm9yIChkYXlOdW1iZXIgPSAxOyBkYXlOdW1iZXIgPD0gbnVtRGF5czsgZGF5TnVtYmVyKyspIHtcbiAgICAgICAgICAgIC8vIGlmIHdlIGhhdmUgcmVhY2hlZCB0aGUgZW5kIG9mIGEgd2Vlaywgd3JhcCB0byB0aGUgbmV4dCBsaW5lXG4gICAgICAgICAgICBpZiAoZGF5Q291bnQgPT09IDcpIHtcbiAgICAgICAgICAgICAgICBjYWxlbmRhckZyYWdtZW50LmFwcGVuZENoaWxkKHJvdyk7XG4gICAgICAgICAgICAgICAgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndHInKTtcbiAgICAgICAgICAgICAgICBkYXlDb3VudCA9IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRvZGF5ID0gaXNTcGVjaWZpY0RheShkYXRlLmN1cnJlbnQuZGF5KCksIGRhdGUuY3VycmVudC5tb250aC5pbnRlZ2VyKCksIGRhdGUuY3VycmVudC55ZWFyKCksIGRheU51bWJlcikgPyAnIHRvZGF5JyA6ICcnO1xuICAgICAgICAgICAgaWYgKHNlbGYuc2VsZWN0ZWREYXRlKSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0ZWQgPSBpc1NwZWNpZmljRGF5KHNlbGYuc2VsZWN0ZWREYXRlLmRheSwgc2VsZi5zZWxlY3RlZERhdGUubW9udGgsIHNlbGYuc2VsZWN0ZWREYXRlLnllYXIsIGRheU51bWJlcikgPyAnIHNlbGVjdGVkJyA6ICcnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoc2VsZi5jb25maWcubWluRGF0ZSB8fCBzZWxmLmNvbmZpZy5tYXhEYXRlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFRpbWVzdGFtcCA9IG5ldyBEYXRlKHNlbGYuY3VycmVudFllYXJWaWV3LCBzZWxmLmN1cnJlbnRNb250aFZpZXcsIGRheU51bWJlcikuZ2V0VGltZSgpO1xuICAgICAgICAgICAgICAgIGRpc2FibGVkID0gJyc7XG5cbiAgICAgICAgICAgICAgICBpZiAoc2VsZi5jb25maWcubWluRGF0ZSAmJiBjdXJyZW50VGltZXN0YW1wIDwgc2VsZi5jb25maWcubWluRGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZCA9ICcgZGlzYWJsZWQnO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChzZWxmLmNvbmZpZy5tYXhEYXRlICYmIGN1cnJlbnRUaW1lc3RhbXAgPiBzZWxmLmNvbmZpZy5tYXhEYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIGRpc2FibGVkID0gJyBkaXNhYmxlZCc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByb3cuaW5uZXJIVE1MICs9ICc8dGQgY2xhc3M9XCInICsgdG9kYXkgKyBzZWxlY3RlZCArIGRpc2FibGVkICsgJ1wiPjxzcGFuIGNsYXNzPVwiZGF0ZXBpY2tyLWRheVwiPicgKyBkYXlOdW1iZXIgKyAnPC9zcGFuPjwvdGQ+JztcbiAgICAgICAgICAgIGRheUNvdW50Kys7XG4gICAgICAgIH1cblxuICAgICAgICBjYWxlbmRhckZyYWdtZW50LmFwcGVuZENoaWxkKHJvdyk7XG4gICAgICAgIGNhbGVuZGFyQm9keS5hcHBlbmRDaGlsZChjYWxlbmRhckZyYWdtZW50KTtcbiAgICB9O1xuXG4gICAgdXBkYXRlTmF2aWdhdGlvbkN1cnJlbnRNb250aCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbmF2aWdhdGlvbkN1cnJlbnRNb250aC5pbm5lckhUTUwgPSBkYXRlLm1vbnRoLnN0cmluZygpICsgJyAnICsgc2VsZi5jdXJyZW50WWVhclZpZXc7XG4gICAgfTtcblxuICAgIGJ1aWxkTW9udGhOYXZpZ2F0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbW9udGhzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG4gICAgICAgICAgICBtb250aE5hdmlnYXRpb247XG5cbiAgICAgICAgbW9udGhOYXZpZ2F0aW9uICA9ICc8c3BhbiBjbGFzcz1cImRhdGVwaWNrci1wcmV2LW1vbnRoXCI+Jmx0Ozwvc3Bhbj4nO1xuICAgICAgICBtb250aE5hdmlnYXRpb24gKz0gJzxzcGFuIGNsYXNzPVwiZGF0ZXBpY2tyLW5leHQtbW9udGhcIj4mZ3Q7PC9zcGFuPic7XG5cbiAgICAgICAgbW9udGhzLmNsYXNzTmFtZSA9ICdkYXRlcGlja3ItbW9udGhzJztcbiAgICAgICAgbW9udGhzLmlubmVySFRNTCA9IG1vbnRoTmF2aWdhdGlvbjtcblxuICAgICAgICBtb250aHMuYXBwZW5kQ2hpbGQobmF2aWdhdGlvbkN1cnJlbnRNb250aCk7XG4gICAgICAgIHVwZGF0ZU5hdmlnYXRpb25DdXJyZW50TW9udGgoKTtcbiAgICAgICAgY2FsZW5kYXJDb250YWluZXIuYXBwZW5kQ2hpbGQobW9udGhzKTtcbiAgICB9O1xuXG4gICAgaGFuZGxlWWVhckNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHNlbGYuY3VycmVudE1vbnRoVmlldyA8IDApIHtcbiAgICAgICAgICAgIHNlbGYuY3VycmVudFllYXJWaWV3LS07XG4gICAgICAgICAgICBzZWxmLmN1cnJlbnRNb250aFZpZXcgPSAxMTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzZWxmLmN1cnJlbnRNb250aFZpZXcgPiAxMSkge1xuICAgICAgICAgICAgc2VsZi5jdXJyZW50WWVhclZpZXcrKztcbiAgICAgICAgICAgIHNlbGYuY3VycmVudE1vbnRoVmlldyA9IDA7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZG9jdW1lbnRDbGljayA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgcGFyZW50O1xuICAgICAgICBpZiAoZXZlbnQudGFyZ2V0ICE9PSBzZWxmLmVsZW1lbnQgJiYgZXZlbnQudGFyZ2V0ICE9PSB3cmFwcGVyRWxlbWVudCkge1xuICAgICAgICAgICAgcGFyZW50ID0gZXZlbnQudGFyZ2V0LnBhcmVudE5vZGU7XG4gICAgICAgICAgICBpZiAocGFyZW50ICE9PSB3cmFwcGVyRWxlbWVudCkge1xuICAgICAgICAgICAgICAgIHdoaWxlIChwYXJlbnQgIT09IHdyYXBwZXJFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnROb2RlO1xuICAgICAgICAgICAgICAgICAgICBpZiAocGFyZW50ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgY2FsZW5kYXJDbGljayA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0LFxuICAgICAgICAgICAgdGFyZ2V0Q2xhc3MgPSB0YXJnZXQuY2xhc3NOYW1lLFxuICAgICAgICAgICAgY3VycmVudFRpbWVzdGFtcDtcblxuICAgICAgICBpZiAodGFyZ2V0Q2xhc3MpIHtcbiAgICAgICAgICAgIGlmICh0YXJnZXRDbGFzcyA9PT0gJ2RhdGVwaWNrci1wcmV2LW1vbnRoJyB8fCB0YXJnZXRDbGFzcyA9PT0gJ2RhdGVwaWNrci1uZXh0LW1vbnRoJykge1xuICAgICAgICAgICAgICAgIGlmICh0YXJnZXRDbGFzcyA9PT0gJ2RhdGVwaWNrci1wcmV2LW1vbnRoJykge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmN1cnJlbnRNb250aFZpZXctLTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmN1cnJlbnRNb250aFZpZXcrKztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBoYW5kbGVZZWFyQ2hhbmdlKCk7XG4gICAgICAgICAgICAgICAgdXBkYXRlTmF2aWdhdGlvbkN1cnJlbnRNb250aCgpO1xuICAgICAgICAgICAgICAgIGJ1aWxkRGF5cygpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0YXJnZXRDbGFzcyA9PT0gJ2RhdGVwaWNrci1kYXknICYmICFzZWxmLmhhc0NsYXNzKHRhcmdldC5wYXJlbnROb2RlLCAnZGlzYWJsZWQnKSkge1xuICAgICAgICAgICAgICAgIHNlbGYuc2VsZWN0ZWREYXRlID0ge1xuICAgICAgICAgICAgICAgICAgICBkYXk6IHBhcnNlSW50KHRhcmdldC5pbm5lckhUTUwsIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgbW9udGg6IHNlbGYuY3VycmVudE1vbnRoVmlldyxcbiAgICAgICAgICAgICAgICAgICAgeWVhcjogc2VsZi5jdXJyZW50WWVhclZpZXdcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgY3VycmVudFRpbWVzdGFtcCA9IG5ldyBEYXRlKHNlbGYuY3VycmVudFllYXJWaWV3LCBzZWxmLmN1cnJlbnRNb250aFZpZXcsIHNlbGYuc2VsZWN0ZWREYXRlLmRheSkuZ2V0VGltZSgpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuY29uZmlnLmFsdElucHV0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLmNvbmZpZy5hbHRGb3JtYXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuY29uZmlnLmFsdElucHV0LnZhbHVlID0gZm9ybWF0RGF0ZShzZWxmLmNvbmZpZy5hbHRGb3JtYXQsIGN1cnJlbnRUaW1lc3RhbXApO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSSBkb24ndCBrbm93IHdoeSBzb21lb25lIHdvdWxkIHdhbnQgdG8gZG8gdGhpcy4uLiBidXQganVzdCBpbiBjYXNlP1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5jb25maWcuYWx0SW5wdXQudmFsdWUgPSBmb3JtYXREYXRlKHNlbGYuY29uZmlnLmRhdGVGb3JtYXQsIGN1cnJlbnRUaW1lc3RhbXApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LnZhbHVlID0gZm9ybWF0RGF0ZShzZWxmLmNvbmZpZy5kYXRlRm9ybWF0LCBjdXJyZW50VGltZXN0YW1wKTtcblxuICAgICAgICAgICAgICAgIGNsb3NlKCk7XG4gICAgICAgICAgICAgICAgYnVpbGREYXlzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgYnVpbGRDYWxlbmRhciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgYnVpbGRNb250aE5hdmlnYXRpb24oKTtcbiAgICAgICAgYnVpbGRXZWVrZGF5cygpO1xuICAgICAgICBidWlsZERheXMoKTtcblxuICAgICAgICBjYWxlbmRhci5hcHBlbmRDaGlsZChjYWxlbmRhckJvZHkpO1xuICAgICAgICBjYWxlbmRhckNvbnRhaW5lci5hcHBlbmRDaGlsZChjYWxlbmRhcik7XG5cbiAgICAgICAgd3JhcHBlckVsZW1lbnQuYXBwZW5kQ2hpbGQoY2FsZW5kYXJDb250YWluZXIpO1xuICAgIH07XG5cbiAgICBnZXRPcGVuRXZlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChzZWxmLmVsZW1lbnQubm9kZU5hbWUgPT09ICdJTlBVVCcpIHtcbiAgICAgICAgICAgIHJldHVybiAnZm9jdXMnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnY2xpY2snO1xuICAgIH07XG5cbiAgICBiaW5kID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLmFkZEV2ZW50TGlzdGVuZXIoc2VsZi5lbGVtZW50LCBnZXRPcGVuRXZlbnQoKSwgb3Blbik7XG4gICAgICAgIHNlbGYuYWRkRXZlbnRMaXN0ZW5lcihjYWxlbmRhckNvbnRhaW5lciwgJ2NsaWNrJywgY2FsZW5kYXJDbGljayk7XG4gICAgfTtcblxuICAgIG9wZW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlbGYuYWRkRXZlbnRMaXN0ZW5lcihkb2N1bWVudCwgJ2NsaWNrJywgZG9jdW1lbnRDbGljayk7XG4gICAgICAgIHNlbGYuYWRkQ2xhc3Mod3JhcHBlckVsZW1lbnQsICdvcGVuJyk7XG4gICAgfTtcblxuICAgIGNsb3NlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLnJlbW92ZUV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdjbGljaycsIGRvY3VtZW50Q2xpY2spO1xuICAgICAgICBzZWxmLnJlbW92ZUNsYXNzKHdyYXBwZXJFbGVtZW50LCAnb3BlbicpO1xuICAgIH07XG5cbiAgICBkZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcGFyZW50LFxuICAgICAgICAgICAgZWxlbWVudDtcblxuICAgICAgICBzZWxmLnJlbW92ZUV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdjbGljaycsIGRvY3VtZW50Q2xpY2spO1xuICAgICAgICBzZWxmLnJlbW92ZUV2ZW50TGlzdGVuZXIoc2VsZi5lbGVtZW50LCBnZXRPcGVuRXZlbnQoKSwgb3Blbik7XG5cbiAgICAgICAgcGFyZW50ID0gc2VsZi5lbGVtZW50LnBhcmVudE5vZGU7XG4gICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChjYWxlbmRhckNvbnRhaW5lcik7XG4gICAgICAgIGVsZW1lbnQgPSBwYXJlbnQucmVtb3ZlQ2hpbGQoc2VsZi5lbGVtZW50KTtcbiAgICAgICAgcGFyZW50LnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKGVsZW1lbnQsIHBhcmVudCk7XG4gICAgfTtcblxuICAgIGluaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjb25maWcsXG4gICAgICAgICAgICBwYXJzZWREYXRlO1xuXG4gICAgICAgIHNlbGYuY29uZmlnID0ge307XG4gICAgICAgIHNlbGYuZGVzdHJveSA9IGRlc3Ryb3k7XG5cbiAgICAgICAgZm9yIChjb25maWcgaW4gZGVmYXVsdENvbmZpZykge1xuICAgICAgICAgICAgc2VsZi5jb25maWdbY29uZmlnXSA9IGluc3RhbmNlQ29uZmlnW2NvbmZpZ10gfHwgZGVmYXVsdENvbmZpZ1tjb25maWddO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi5lbGVtZW50ID0gZWxlbWVudDtcblxuICAgICAgICBpZiAoc2VsZi5lbGVtZW50LnZhbHVlKSB7XG4gICAgICAgICAgICBwYXJzZWREYXRlID0gRGF0ZS5wYXJzZShzZWxmLmVsZW1lbnQudmFsdWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBhcnNlZERhdGUgJiYgIWlzTmFOKHBhcnNlZERhdGUpKSB7XG4gICAgICAgICAgICBwYXJzZWREYXRlID0gbmV3IERhdGUocGFyc2VkRGF0ZSk7XG4gICAgICAgICAgICBzZWxmLnNlbGVjdGVkRGF0ZSA9IHtcbiAgICAgICAgICAgICAgICBkYXk6IHBhcnNlZERhdGUuZ2V0RGF0ZSgpLFxuICAgICAgICAgICAgICAgIG1vbnRoOiBwYXJzZWREYXRlLmdldE1vbnRoKCksXG4gICAgICAgICAgICAgICAgeWVhcjogcGFyc2VkRGF0ZS5nZXRGdWxsWWVhcigpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgc2VsZi5jdXJyZW50WWVhclZpZXcgPSBzZWxmLnNlbGVjdGVkRGF0ZS55ZWFyO1xuICAgICAgICAgICAgc2VsZi5jdXJyZW50TW9udGhWaWV3ID0gc2VsZi5zZWxlY3RlZERhdGUubW9udGg7XG4gICAgICAgICAgICBzZWxmLmN1cnJlbnREYXlWaWV3ID0gc2VsZi5zZWxlY3RlZERhdGUuZGF5O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VsZi5zZWxlY3RlZERhdGUgPSBudWxsO1xuICAgICAgICAgICAgc2VsZi5jdXJyZW50WWVhclZpZXcgPSBkYXRlLmN1cnJlbnQueWVhcigpO1xuICAgICAgICAgICAgc2VsZi5jdXJyZW50TW9udGhWaWV3ID0gZGF0ZS5jdXJyZW50Lm1vbnRoLmludGVnZXIoKTtcbiAgICAgICAgICAgIHNlbGYuY3VycmVudERheVZpZXcgPSBkYXRlLmN1cnJlbnQuZGF5KCk7XG4gICAgICAgIH1cblxuICAgICAgICB3cmFwKCk7XG4gICAgICAgIGJ1aWxkQ2FsZW5kYXIoKTtcbiAgICAgICAgYmluZCgpO1xuICAgIH07XG5cbiAgICBpbml0KCk7XG5cbiAgICByZXR1cm4gc2VsZjtcbn07XG5cbmRhdGVwaWNrci5pbml0LnByb3RvdHlwZSA9IHtcbiAgICBoYXNDbGFzczogZnVuY3Rpb24gKGVsZW1lbnQsIGNsYXNzTmFtZSkgeyByZXR1cm4gZWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoY2xhc3NOYW1lKTsgfSxcbiAgICBhZGRDbGFzczogZnVuY3Rpb24gKGVsZW1lbnQsIGNsYXNzTmFtZSkgeyBlbGVtZW50LmNsYXNzTGlzdC5hZGQoY2xhc3NOYW1lKTsgfSxcbiAgICByZW1vdmVDbGFzczogZnVuY3Rpb24gKGVsZW1lbnQsIGNsYXNzTmFtZSkgeyBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoY2xhc3NOYW1lKTsgfSxcbiAgICBmb3JFYWNoOiBmdW5jdGlvbiAoaXRlbXMsIGNhbGxiYWNrKSB7IFtdLmZvckVhY2guY2FsbChpdGVtcywgY2FsbGJhY2spOyB9LFxuICAgIHF1ZXJ5U2VsZWN0b3JBbGw6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwuYmluZChkb2N1bWVudCksXG4gICAgaXNBcnJheTogQXJyYXkuaXNBcnJheSxcbiAgICBhZGRFdmVudExpc3RlbmVyOiBmdW5jdGlvbiAoZWxlbWVudCwgdHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpIHtcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyLCB1c2VDYXB0dXJlKTtcbiAgICB9LFxuICAgIHJlbW92ZUV2ZW50TGlzdGVuZXI6IGZ1bmN0aW9uIChlbGVtZW50LCB0eXBlLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSkge1xuICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpO1xuICAgIH0sXG4gICAgbDEwbjoge1xuICAgICAgICB3ZWVrZGF5czoge1xuICAgICAgICAgICAgc2hvcnRoYW5kOiBbJ1N1bicsICdNb24nLCAnVHVlJywgJ1dlZCcsICdUaHUnLCAnRnJpJywgJ1NhdCddLFxuICAgICAgICAgICAgbG9uZ2hhbmQ6IFsnU3VuZGF5JywgJ01vbmRheScsICdUdWVzZGF5JywgJ1dlZG5lc2RheScsICdUaHVyc2RheScsICdGcmlkYXknLCAnU2F0dXJkYXknXVxuICAgICAgICB9LFxuICAgICAgICBtb250aHM6IHtcbiAgICAgICAgICAgIHNob3J0aGFuZDogWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsICdPY3QnLCAnTm92JywgJ0RlYyddLFxuICAgICAgICAgICAgbG9uZ2hhbmQ6IFsnSmFudWFyeScsICdGZWJydWFyeScsICdNYXJjaCcsICdBcHJpbCcsICdNYXknLCAnSnVuZScsICdKdWx5JywgJ0F1Z3VzdCcsICdTZXB0ZW1iZXInLCAnT2N0b2JlcicsICdOb3ZlbWJlcicsICdEZWNlbWJlciddXG4gICAgICAgIH0sXG4gICAgICAgIGRheXNJbk1vbnRoOiBbMzEsIDI4LCAzMSwgMzAsIDMxLCAzMCwgMzEsIDMxLCAzMCwgMzEsIDMwLCAzMV0sXG4gICAgICAgIGZpcnN0RGF5T2ZXZWVrOiAwXG4gICAgfVxufTtcbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgaGFtYnVyZ2VyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2hhbWJ1cmdlcicpXG5cbmlmIChoYW1idXJnZXIpIHtcbiAgaGFtYnVyZ2VyLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIG1vYmlsZU91dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtb2JpbGUtb3V0JylcblxuICAgIGlmIChtb2JpbGVPdXQuY2xhc3NMaXN0LmNvbnRhaW5zKCd2aXNpYmxlJykpIHtcblxuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgbW9iaWxlT3V0LmNsYXNzTGlzdC5hZGQoJ2FuaW1hdGVOYXYnKVxuICAgICAgICBtb2JpbGVPdXQuY2xhc3NMaXN0LnRvZ2dsZSgnbmF2LW9wZW4nKVxuXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgbW9iaWxlT3V0LmNsYXNzTGlzdC5yZW1vdmUoJ3Zpc2libGUnKVxuICAgICAgICB9LCA0MDApXG5cbiAgICAgIH0sIDApXG4gICAgICBcbiAgICB9XG5cbiAgICBlbHNlIHtcblxuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgbW9iaWxlT3V0LmNsYXNzTGlzdC5hZGQoJ3Zpc2libGUnKVxuXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgbW9iaWxlT3V0LmNsYXNzTGlzdC5hZGQoJ2FuaW1hdGVOYXYnKVxuICAgICAgICAgIG1vYmlsZU91dC5jbGFzc0xpc3QudG9nZ2xlKCduYXYtb3BlbicpXG5cbiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgbW9iaWxlT3V0LmNsYXNzTGlzdC5yZW1vdmUoJ2FuaW1hdGVOYXYnKVxuICAgICAgICAgIH0sIDQwMClcblxuICAgICAgICB9LCAxMDApXG5cbiAgICAgIH0sIDApXG5cbiAgICB9XG4gICAgXG4gIH0pXG59IiwiLypcbiAgU29ydFRhYmxlXG4gIHZlcnNpb24gMlxuICA3dGggQXByaWwgMjAwN1xuICBTdHVhcnQgTGFuZ3JpZGdlLCBodHRwOi8vd3d3LmtyeW9nZW5peC5vcmcvY29kZS9icm93c2VyL3NvcnR0YWJsZS9cblxuICBJbnN0cnVjdGlvbnM6XG4gIERvd25sb2FkIHRoaXMgZmlsZVxuICBBZGQgPHNjcmlwdCBzcmM9XCJzb3J0dGFibGUuanNcIj48L3NjcmlwdD4gdG8geW91ciBIVE1MXG4gIEFkZCBjbGFzcz1cInNvcnRhYmxlXCIgdG8gYW55IHRhYmxlIHlvdSdkIGxpa2UgdG8gbWFrZSBzb3J0YWJsZVxuICBDbGljayBvbiB0aGUgaGVhZGVycyB0byBzb3J0XG5cbiAgVGhhbmtzIHRvIG1hbnksIG1hbnkgcGVvcGxlIGZvciBjb250cmlidXRpb25zIGFuZCBzdWdnZXN0aW9ucy5cbiAgTGljZW5jZWQgYXMgWDExOiBodHRwOi8vd3d3LmtyeW9nZW5peC5vcmcvY29kZS9icm93c2VyL2xpY2VuY2UuaHRtbFxuICBUaGlzIGJhc2ljYWxseSBtZWFuczogZG8gd2hhdCB5b3Ugd2FudCB3aXRoIGl0LlxuKi9cblxuXG52YXIgc3RJc0lFID0gLypAY2Nfb24hQCovZmFsc2U7XG5cbnNvcnR0YWJsZSA9IHtcbiAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgLy8gcXVpdCBpZiB0aGlzIGZ1bmN0aW9uIGhhcyBhbHJlYWR5IGJlZW4gY2FsbGVkXG4gICAgaWYgKGFyZ3VtZW50cy5jYWxsZWUuZG9uZSkgcmV0dXJuO1xuICAgIC8vIGZsYWcgdGhpcyBmdW5jdGlvbiBzbyB3ZSBkb24ndCBkbyB0aGUgc2FtZSB0aGluZyB0d2ljZVxuICAgIGFyZ3VtZW50cy5jYWxsZWUuZG9uZSA9IHRydWU7XG4gICAgLy8ga2lsbCB0aGUgdGltZXJcbiAgICBpZiAoX3RpbWVyKSBjbGVhckludGVydmFsKF90aW1lcik7XG5cbiAgICBpZiAoIWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgfHwgIWRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKSByZXR1cm47XG5cbiAgICBzb3J0dGFibGUuREFURV9SRSA9IC9eKFxcZFxcZD8pW1xcL1xcLi1dKFxcZFxcZD8pW1xcL1xcLi1dKChcXGRcXGQpP1xcZFxcZCkkLztcblxuICAgIGZvckVhY2goZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3RhYmxlJyksIGZ1bmN0aW9uKHRhYmxlKSB7XG4gICAgICBpZiAodGFibGUuY2xhc3NOYW1lLnNlYXJjaCgvXFxic29ydGFibGVcXGIvKSAhPSAtMSkge1xuICAgICAgICBzb3J0dGFibGUubWFrZVNvcnRhYmxlKHRhYmxlKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICB9LFxuXG4gIG1ha2VTb3J0YWJsZTogZnVuY3Rpb24odGFibGUpIHtcbiAgICBpZiAodGFibGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3RoZWFkJykubGVuZ3RoID09IDApIHtcbiAgICAgIC8vIHRhYmxlIGRvZXNuJ3QgaGF2ZSBhIHRIZWFkLiBTaW5jZSBpdCBzaG91bGQgaGF2ZSwgY3JlYXRlIG9uZSBhbmRcbiAgICAgIC8vIHB1dCB0aGUgZmlyc3QgdGFibGUgcm93IGluIGl0LlxuICAgICAgdGhlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGhlYWQnKTtcbiAgICAgIHRoZS5hcHBlbmRDaGlsZCh0YWJsZS5yb3dzWzBdKTtcbiAgICAgIHRhYmxlLmluc2VydEJlZm9yZSh0aGUsdGFibGUuZmlyc3RDaGlsZCk7XG4gICAgfVxuICAgIC8vIFNhZmFyaSBkb2Vzbid0IHN1cHBvcnQgdGFibGUudEhlYWQsIHNpZ2hcbiAgICBpZiAodGFibGUudEhlYWQgPT0gbnVsbCkgdGFibGUudEhlYWQgPSB0YWJsZS5nZXRFbGVtZW50c0J5VGFnTmFtZSgndGhlYWQnKVswXTtcblxuICAgIGlmICh0YWJsZS50SGVhZC5yb3dzLmxlbmd0aCAhPSAxKSByZXR1cm47IC8vIGNhbid0IGNvcGUgd2l0aCB0d28gaGVhZGVyIHJvd3NcblxuICAgIC8vIFNvcnR0YWJsZSB2MSBwdXQgcm93cyB3aXRoIGEgY2xhc3Mgb2YgXCJzb3J0Ym90dG9tXCIgYXQgdGhlIGJvdHRvbSAoYXNcbiAgICAvLyBcInRvdGFsXCIgcm93cywgZm9yIGV4YW1wbGUpLiBUaGlzIGlzIEImUiwgc2luY2Ugd2hhdCB5b3UncmUgc3VwcG9zZWRcbiAgICAvLyB0byBkbyBpcyBwdXQgdGhlbSBpbiBhIHRmb290LiBTbywgaWYgdGhlcmUgYXJlIHNvcnRib3R0b20gcm93cyxcbiAgICAvLyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHksIG1vdmUgdGhlbSB0byB0Zm9vdCAoY3JlYXRpbmcgaXQgaWYgbmVlZGVkKS5cbiAgICBzb3J0Ym90dG9tcm93cyA9IFtdO1xuICAgIGZvciAodmFyIGk9MDsgaTx0YWJsZS5yb3dzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodGFibGUucm93c1tpXS5jbGFzc05hbWUuc2VhcmNoKC9cXGJzb3J0Ym90dG9tXFxiLykgIT0gLTEpIHtcbiAgICAgICAgc29ydGJvdHRvbXJvd3Nbc29ydGJvdHRvbXJvd3MubGVuZ3RoXSA9IHRhYmxlLnJvd3NbaV07XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChzb3J0Ym90dG9tcm93cykge1xuICAgICAgaWYgKHRhYmxlLnRGb290ID09IG51bGwpIHtcbiAgICAgICAgLy8gdGFibGUgZG9lc24ndCBoYXZlIGEgdGZvb3QuIENyZWF0ZSBvbmUuXG4gICAgICAgIHRmbyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3Rmb290Jyk7XG4gICAgICAgIHRhYmxlLmFwcGVuZENoaWxkKHRmbyk7XG4gICAgICB9XG4gICAgICBmb3IgKHZhciBpPTA7IGk8c29ydGJvdHRvbXJvd3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGZvLmFwcGVuZENoaWxkKHNvcnRib3R0b21yb3dzW2ldKTtcbiAgICAgIH1cbiAgICAgIC8vIGRlbGV0ZSBzb3J0Ym90dG9tcm93cztcbiAgICAgIHNvcnRib3R0b21yb3dzID0gbnVsbDtcbiAgICB9XG5cbiAgICAvLyB3b3JrIHRocm91Z2ggZWFjaCBjb2x1bW4gYW5kIGNhbGN1bGF0ZSBpdHMgdHlwZVxuICAgIGhlYWRyb3cgPSB0YWJsZS50SGVhZC5yb3dzWzBdLmNlbGxzO1xuICAgIGZvciAodmFyIGk9MDsgaTxoZWFkcm93Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAvLyBtYW51YWxseSBvdmVycmlkZSB0aGUgdHlwZSB3aXRoIGEgc29ydHRhYmxlX3R5cGUgYXR0cmlidXRlXG4gICAgICBpZiAoIWhlYWRyb3dbaV0uY2xhc3NOYW1lLm1hdGNoKC9cXGJzb3J0dGFibGVfbm9zb3J0XFxiLykpIHsgLy8gc2tpcCB0aGlzIGNvbFxuICAgICAgICBtdGNoID0gaGVhZHJvd1tpXS5jbGFzc05hbWUubWF0Y2goL1xcYnNvcnR0YWJsZV8oW2EtejAtOV0rKVxcYi8pO1xuICAgICAgICBpZiAobXRjaCkgeyBvdmVycmlkZSA9IG10Y2hbMV07IH1cblx0ICAgICAgaWYgKG10Y2ggJiYgdHlwZW9mIHNvcnR0YWJsZVtcInNvcnRfXCIrb3ZlcnJpZGVdID09ICdmdW5jdGlvbicpIHtcblx0ICAgICAgICBoZWFkcm93W2ldLnNvcnR0YWJsZV9zb3J0ZnVuY3Rpb24gPSBzb3J0dGFibGVbXCJzb3J0X1wiK292ZXJyaWRlXTtcblx0ICAgICAgfSBlbHNlIHtcblx0ICAgICAgICBoZWFkcm93W2ldLnNvcnR0YWJsZV9zb3J0ZnVuY3Rpb24gPSBzb3J0dGFibGUuZ3Vlc3NUeXBlKHRhYmxlLGkpO1xuXHQgICAgICB9XG5cdCAgICAgIC8vIG1ha2UgaXQgY2xpY2thYmxlIHRvIHNvcnRcblx0ICAgICAgaGVhZHJvd1tpXS5zb3J0dGFibGVfY29sdW1uaW5kZXggPSBpO1xuXHQgICAgICBoZWFkcm93W2ldLnNvcnR0YWJsZV90Ym9keSA9IHRhYmxlLnRCb2RpZXNbMF07XG5cdCAgICAgIGRlYW5fYWRkRXZlbnQoaGVhZHJvd1tpXSxcImNsaWNrXCIsIHNvcnR0YWJsZS5pbm5lclNvcnRGdW5jdGlvbiA9IGZ1bmN0aW9uKGUpIHtcblxuICAgICAgICAgIGlmICh0aGlzLmNsYXNzTmFtZS5zZWFyY2goL1xcYnNvcnR0YWJsZV9zb3J0ZWRcXGIvKSAhPSAtMSkge1xuICAgICAgICAgICAgLy8gaWYgd2UncmUgYWxyZWFkeSBzb3J0ZWQgYnkgdGhpcyBjb2x1bW4sIGp1c3RcbiAgICAgICAgICAgIC8vIHJldmVyc2UgdGhlIHRhYmxlLCB3aGljaCBpcyBxdWlja2VyXG4gICAgICAgICAgICBzb3J0dGFibGUucmV2ZXJzZSh0aGlzLnNvcnR0YWJsZV90Ym9keSk7XG4gICAgICAgICAgICB0aGlzLmNsYXNzTmFtZSA9IHRoaXMuY2xhc3NOYW1lLnJlcGxhY2UoJ3NvcnR0YWJsZV9zb3J0ZWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdzb3J0dGFibGVfc29ydGVkX3JldmVyc2UnKTtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQ2hpbGQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NvcnR0YWJsZV9zb3J0ZndkaW5kJykpO1xuICAgICAgICAgICAgc29ydHJldmluZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgICAgIHNvcnRyZXZpbmQuaWQgPSBcInNvcnR0YWJsZV9zb3J0cmV2aW5kXCI7XG4gICAgICAgICAgICBzb3J0cmV2aW5kLmlubmVySFRNTCA9IHN0SXNJRSA/ICcmbmJzcDxmb250IGZhY2U9XCJ3ZWJkaW5nc1wiPjU8L2ZvbnQ+JyA6ICcmbmJzcDsmI3gyNUI0Oyc7XG4gICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHNvcnRyZXZpbmQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodGhpcy5jbGFzc05hbWUuc2VhcmNoKC9cXGJzb3J0dGFibGVfc29ydGVkX3JldmVyc2VcXGIvKSAhPSAtMSkge1xuICAgICAgICAgICAgLy8gaWYgd2UncmUgYWxyZWFkeSBzb3J0ZWQgYnkgdGhpcyBjb2x1bW4gaW4gcmV2ZXJzZSwganVzdFxuICAgICAgICAgICAgLy8gcmUtcmV2ZXJzZSB0aGUgdGFibGUsIHdoaWNoIGlzIHF1aWNrZXJcbiAgICAgICAgICAgIHNvcnR0YWJsZS5yZXZlcnNlKHRoaXMuc29ydHRhYmxlX3Rib2R5KTtcbiAgICAgICAgICAgIHRoaXMuY2xhc3NOYW1lID0gdGhpcy5jbGFzc05hbWUucmVwbGFjZSgnc29ydHRhYmxlX3NvcnRlZF9yZXZlcnNlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnc29ydHRhYmxlX3NvcnRlZCcpO1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVDaGlsZChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc29ydHRhYmxlX3NvcnRyZXZpbmQnKSk7XG4gICAgICAgICAgICBzb3J0ZndkaW5kID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICAgICAgc29ydGZ3ZGluZC5pZCA9IFwic29ydHRhYmxlX3NvcnRmd2RpbmRcIjtcbiAgICAgICAgICAgIHNvcnRmd2RpbmQuaW5uZXJIVE1MID0gc3RJc0lFID8gJyZuYnNwPGZvbnQgZmFjZT1cIndlYmRpbmdzXCI+NjwvZm9udD4nIDogJyZuYnNwOyYjeDI1QkU7JztcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoc29ydGZ3ZGluZCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gcmVtb3ZlIHNvcnR0YWJsZV9zb3J0ZWQgY2xhc3Nlc1xuICAgICAgICAgIHRoZWFkcm93ID0gdGhpcy5wYXJlbnROb2RlO1xuICAgICAgICAgIGZvckVhY2godGhlYWRyb3cuY2hpbGROb2RlcywgZnVuY3Rpb24oY2VsbCkge1xuICAgICAgICAgICAgaWYgKGNlbGwubm9kZVR5cGUgPT0gMSkgeyAvLyBhbiBlbGVtZW50XG4gICAgICAgICAgICAgIGNlbGwuY2xhc3NOYW1lID0gY2VsbC5jbGFzc05hbWUucmVwbGFjZSgnc29ydHRhYmxlX3NvcnRlZF9yZXZlcnNlJywnJyk7XG4gICAgICAgICAgICAgIGNlbGwuY2xhc3NOYW1lID0gY2VsbC5jbGFzc05hbWUucmVwbGFjZSgnc29ydHRhYmxlX3NvcnRlZCcsJycpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHNvcnRmd2RpbmQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc29ydHRhYmxlX3NvcnRmd2RpbmQnKTtcbiAgICAgICAgICBpZiAoc29ydGZ3ZGluZCkgeyBzb3J0ZndkaW5kLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc29ydGZ3ZGluZCk7IH1cbiAgICAgICAgICBzb3J0cmV2aW5kID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NvcnR0YWJsZV9zb3J0cmV2aW5kJyk7XG4gICAgICAgICAgaWYgKHNvcnRyZXZpbmQpIHsgc29ydHJldmluZC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHNvcnRyZXZpbmQpOyB9XG5cbiAgICAgICAgICB0aGlzLmNsYXNzTmFtZSArPSAnIHNvcnR0YWJsZV9zb3J0ZWQnO1xuICAgICAgICAgIHNvcnRmd2RpbmQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgICAgc29ydGZ3ZGluZC5pZCA9IFwic29ydHRhYmxlX3NvcnRmd2RpbmRcIjtcbiAgICAgICAgICBzb3J0ZndkaW5kLmlubmVySFRNTCA9IHN0SXNJRSA/ICcmbmJzcDxmb250IGZhY2U9XCJ3ZWJkaW5nc1wiPjY8L2ZvbnQ+JyA6ICcmbmJzcDsmI3gyNUJFOyc7XG4gICAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChzb3J0ZndkaW5kKTtcblxuXHQgICAgICAgIC8vIGJ1aWxkIGFuIGFycmF5IHRvIHNvcnQuIFRoaXMgaXMgYSBTY2h3YXJ0emlhbiB0cmFuc2Zvcm0gdGhpbmcsXG5cdCAgICAgICAgLy8gaS5lLiwgd2UgXCJkZWNvcmF0ZVwiIGVhY2ggcm93IHdpdGggdGhlIGFjdHVhbCBzb3J0IGtleSxcblx0ICAgICAgICAvLyBzb3J0IGJhc2VkIG9uIHRoZSBzb3J0IGtleXMsIGFuZCB0aGVuIHB1dCB0aGUgcm93cyBiYWNrIGluIG9yZGVyXG5cdCAgICAgICAgLy8gd2hpY2ggaXMgYSBsb3QgZmFzdGVyIGJlY2F1c2UgeW91IG9ubHkgZG8gZ2V0SW5uZXJUZXh0IG9uY2UgcGVyIHJvd1xuXHQgICAgICAgIHJvd19hcnJheSA9IFtdO1xuXHQgICAgICAgIGNvbCA9IHRoaXMuc29ydHRhYmxlX2NvbHVtbmluZGV4O1xuXHQgICAgICAgIHJvd3MgPSB0aGlzLnNvcnR0YWJsZV90Ym9keS5yb3dzO1xuXHQgICAgICAgIGZvciAodmFyIGo9MDsgajxyb3dzLmxlbmd0aDsgaisrKSB7XG5cdCAgICAgICAgICByb3dfYXJyYXlbcm93X2FycmF5Lmxlbmd0aF0gPSBbc29ydHRhYmxlLmdldElubmVyVGV4dChyb3dzW2pdLmNlbGxzW2NvbF0pLCByb3dzW2pdXTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgLyogSWYgeW91IHdhbnQgYSBzdGFibGUgc29ydCwgdW5jb21tZW50IHRoZSBmb2xsb3dpbmcgbGluZSAqL1xuXHQgICAgICAgIC8vc29ydHRhYmxlLnNoYWtlcl9zb3J0KHJvd19hcnJheSwgdGhpcy5zb3J0dGFibGVfc29ydGZ1bmN0aW9uKTtcblx0ICAgICAgICAvKiBhbmQgY29tbWVudCBvdXQgdGhpcyBvbmUgKi9cblx0ICAgICAgICByb3dfYXJyYXkuc29ydCh0aGlzLnNvcnR0YWJsZV9zb3J0ZnVuY3Rpb24pO1xuXG5cdCAgICAgICAgdGIgPSB0aGlzLnNvcnR0YWJsZV90Ym9keTtcblx0ICAgICAgICBmb3IgKHZhciBqPTA7IGo8cm93X2FycmF5Lmxlbmd0aDsgaisrKSB7XG5cdCAgICAgICAgICB0Yi5hcHBlbmRDaGlsZChyb3dfYXJyYXlbal1bMV0pO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8vIGRlbGV0ZSByb3dfYXJyYXk7XG4gICAgICAgICAgcm93X2FycmF5ID0gbnVsbDtcblx0ICAgICAgfSk7XG5cdCAgICB9XG4gICAgfVxuICB9LFxuXG4gIGd1ZXNzVHlwZTogZnVuY3Rpb24odGFibGUsIGNvbHVtbikge1xuICAgIC8vIGd1ZXNzIHRoZSB0eXBlIG9mIGEgY29sdW1uIGJhc2VkIG9uIGl0cyBmaXJzdCBub24tYmxhbmsgcm93XG4gICAgc29ydGZuID0gc29ydHRhYmxlLnNvcnRfYWxwaGE7XG4gICAgZm9yICh2YXIgaT0wOyBpPHRhYmxlLnRCb2RpZXNbMF0ucm93cy5sZW5ndGg7IGkrKykge1xuICAgICAgdGV4dCA9IHNvcnR0YWJsZS5nZXRJbm5lclRleHQodGFibGUudEJvZGllc1swXS5yb3dzW2ldLmNlbGxzW2NvbHVtbl0pO1xuICAgICAgaWYgKHRleHQgIT0gJycpIHtcbiAgICAgICAgaWYgKHRleHQubWF0Y2goL14tP1vvv70k77+9XT9bXFxkLC5dKyU/JC8pKSB7XG4gICAgICAgICAgcmV0dXJuIHNvcnR0YWJsZS5zb3J0X251bWVyaWM7XG4gICAgICAgIH1cbiAgICAgICAgLy8gY2hlY2sgZm9yIGEgZGF0ZTogZGQvbW0veXl5eSBvciBkZC9tbS95eVxuICAgICAgICAvLyBjYW4gaGF2ZSAvIG9yIC4gb3IgLSBhcyBzZXBhcmF0b3JcbiAgICAgICAgLy8gY2FuIGJlIG1tL2RkIGFzIHdlbGxcbiAgICAgICAgcG9zc2RhdGUgPSB0ZXh0Lm1hdGNoKHNvcnR0YWJsZS5EQVRFX1JFKVxuICAgICAgICBpZiAocG9zc2RhdGUpIHtcbiAgICAgICAgICAvLyBsb29rcyBsaWtlIGEgZGF0ZVxuICAgICAgICAgIGZpcnN0ID0gcGFyc2VJbnQocG9zc2RhdGVbMV0pO1xuICAgICAgICAgIHNlY29uZCA9IHBhcnNlSW50KHBvc3NkYXRlWzJdKTtcbiAgICAgICAgICBpZiAoZmlyc3QgPiAxMikge1xuICAgICAgICAgICAgLy8gZGVmaW5pdGVseSBkZC9tbVxuICAgICAgICAgICAgcmV0dXJuIHNvcnR0YWJsZS5zb3J0X2RkbW07XG4gICAgICAgICAgfSBlbHNlIGlmIChzZWNvbmQgPiAxMikge1xuICAgICAgICAgICAgcmV0dXJuIHNvcnR0YWJsZS5zb3J0X21tZGQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGxvb2tzIGxpa2UgYSBkYXRlLCBidXQgd2UgY2FuJ3QgdGVsbCB3aGljaCwgc28gYXNzdW1lXG4gICAgICAgICAgICAvLyB0aGF0IGl0J3MgZGQvbW0gKEVuZ2xpc2ggaW1wZXJpYWxpc20hKSBhbmQga2VlcCBsb29raW5nXG4gICAgICAgICAgICBzb3J0Zm4gPSBzb3J0dGFibGUuc29ydF9kZG1tO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc29ydGZuO1xuICB9LFxuXG4gIGdldElubmVyVGV4dDogZnVuY3Rpb24obm9kZSkge1xuICAgIC8vIGdldHMgdGhlIHRleHQgd2Ugd2FudCB0byB1c2UgZm9yIHNvcnRpbmcgZm9yIGEgY2VsbC5cbiAgICAvLyBzdHJpcHMgbGVhZGluZyBhbmQgdHJhaWxpbmcgd2hpdGVzcGFjZS5cbiAgICAvLyB0aGlzIGlzICpub3QqIGEgZ2VuZXJpYyBnZXRJbm5lclRleHQgZnVuY3Rpb247IGl0J3Mgc3BlY2lhbCB0byBzb3J0dGFibGUuXG4gICAgLy8gZm9yIGV4YW1wbGUsIHlvdSBjYW4gb3ZlcnJpZGUgdGhlIGNlbGwgdGV4dCB3aXRoIGEgY3VzdG9ta2V5IGF0dHJpYnV0ZS5cbiAgICAvLyBpdCBhbHNvIGdldHMgLnZhbHVlIGZvciA8aW5wdXQ+IGZpZWxkcy5cblxuICAgIGlmICghbm9kZSkgcmV0dXJuIFwiXCI7XG5cbiAgICBoYXNJbnB1dHMgPSAodHlwZW9mIG5vZGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUgPT0gJ2Z1bmN0aW9uJykgJiZcbiAgICAgICAgICAgICAgICAgbm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaW5wdXQnKS5sZW5ndGg7XG5cbiAgICBpZiAobm9kZS5nZXRBdHRyaWJ1dGUoXCJzb3J0dGFibGVfY3VzdG9ta2V5XCIpICE9IG51bGwpIHtcbiAgICAgIHJldHVybiBub2RlLmdldEF0dHJpYnV0ZShcInNvcnR0YWJsZV9jdXN0b21rZXlcIik7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBub2RlLnRleHRDb250ZW50ICE9ICd1bmRlZmluZWQnICYmICFoYXNJbnB1dHMpIHtcbiAgICAgIHJldHVybiBub2RlLnRleHRDb250ZW50LnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKTtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIG5vZGUuaW5uZXJUZXh0ICE9ICd1bmRlZmluZWQnICYmICFoYXNJbnB1dHMpIHtcbiAgICAgIHJldHVybiBub2RlLmlubmVyVGV4dC5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJyk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBub2RlLnRleHQgIT0gJ3VuZGVmaW5lZCcgJiYgIWhhc0lucHV0cykge1xuICAgICAgcmV0dXJuIG5vZGUudGV4dC5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJyk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgc3dpdGNoIChub2RlLm5vZGVUeXBlKSB7XG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICBpZiAobm9kZS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09ICdpbnB1dCcpIHtcbiAgICAgICAgICAgIHJldHVybiBub2RlLnZhbHVlLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKTtcbiAgICAgICAgICB9XG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICByZXR1cm4gbm9kZS5ub2RlVmFsdWUucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgIGNhc2UgMTE6XG4gICAgICAgICAgdmFyIGlubmVyVGV4dCA9ICcnO1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZS5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpbm5lclRleHQgKz0gc29ydHRhYmxlLmdldElubmVyVGV4dChub2RlLmNoaWxkTm9kZXNbaV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gaW5uZXJUZXh0LnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIHJldmVyc2U6IGZ1bmN0aW9uKHRib2R5KSB7XG4gICAgLy8gcmV2ZXJzZSB0aGUgcm93cyBpbiBhIHRib2R5XG4gICAgbmV3cm93cyA9IFtdO1xuICAgIGZvciAodmFyIGk9MDsgaTx0Ym9keS5yb3dzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBuZXdyb3dzW25ld3Jvd3MubGVuZ3RoXSA9IHRib2R5LnJvd3NbaV07XG4gICAgfVxuICAgIGZvciAodmFyIGk9bmV3cm93cy5sZW5ndGgtMTsgaT49MDsgaS0tKSB7XG4gICAgICAgdGJvZHkuYXBwZW5kQ2hpbGQobmV3cm93c1tpXSk7XG4gICAgfVxuICAgIC8vIGRlbGV0ZSBuZXdyb3dzO1xuICAgIG5ld3Jvd3MgPSBudWxsO1xuICB9LFxuXG4gIC8qIHNvcnQgZnVuY3Rpb25zXG4gICAgIGVhY2ggc29ydCBmdW5jdGlvbiB0YWtlcyB0d28gcGFyYW1ldGVycywgYSBhbmQgYlxuICAgICB5b3UgYXJlIGNvbXBhcmluZyBhWzBdIGFuZCBiWzBdICovXG4gIHNvcnRfbnVtZXJpYzogZnVuY3Rpb24oYSxiKSB7XG4gICAgYWEgPSBwYXJzZUZsb2F0KGFbMF0ucmVwbGFjZSgvW14wLTkuLV0vZywnJykpO1xuICAgIGlmIChpc05hTihhYSkpIGFhID0gMDtcbiAgICBiYiA9IHBhcnNlRmxvYXQoYlswXS5yZXBsYWNlKC9bXjAtOS4tXS9nLCcnKSk7XG4gICAgaWYgKGlzTmFOKGJiKSkgYmIgPSAwO1xuICAgIHJldHVybiBhYS1iYjtcbiAgfSxcbiAgc29ydF9hbHBoYTogZnVuY3Rpb24oYSxiKSB7XG4gICAgaWYgKGFbMF09PWJbMF0pIHJldHVybiAwO1xuICAgIGlmIChhWzBdPGJbMF0pIHJldHVybiAtMTtcbiAgICByZXR1cm4gMTtcbiAgfSxcbiAgc29ydF9kZG1tOiBmdW5jdGlvbihhLGIpIHtcbiAgICBtdGNoID0gYVswXS5tYXRjaChzb3J0dGFibGUuREFURV9SRSk7XG4gICAgeSA9IG10Y2hbM107IG0gPSBtdGNoWzJdOyBkID0gbXRjaFsxXTtcbiAgICBpZiAobS5sZW5ndGggPT0gMSkgbSA9ICcwJyttO1xuICAgIGlmIChkLmxlbmd0aCA9PSAxKSBkID0gJzAnK2Q7XG4gICAgZHQxID0geSttK2Q7XG4gICAgbXRjaCA9IGJbMF0ubWF0Y2goc29ydHRhYmxlLkRBVEVfUkUpO1xuICAgIHkgPSBtdGNoWzNdOyBtID0gbXRjaFsyXTsgZCA9IG10Y2hbMV07XG4gICAgaWYgKG0ubGVuZ3RoID09IDEpIG0gPSAnMCcrbTtcbiAgICBpZiAoZC5sZW5ndGggPT0gMSkgZCA9ICcwJytkO1xuICAgIGR0MiA9IHkrbStkO1xuICAgIGlmIChkdDE9PWR0MikgcmV0dXJuIDA7XG4gICAgaWYgKGR0MTxkdDIpIHJldHVybiAtMTtcbiAgICByZXR1cm4gMTtcbiAgfSxcbiAgc29ydF9tbWRkOiBmdW5jdGlvbihhLGIpIHtcbiAgICBtdGNoID0gYVswXS5tYXRjaChzb3J0dGFibGUuREFURV9SRSk7XG4gICAgeSA9IG10Y2hbM107IGQgPSBtdGNoWzJdOyBtID0gbXRjaFsxXTtcbiAgICBpZiAobS5sZW5ndGggPT0gMSkgbSA9ICcwJyttO1xuICAgIGlmIChkLmxlbmd0aCA9PSAxKSBkID0gJzAnK2Q7XG4gICAgZHQxID0geSttK2Q7XG4gICAgbXRjaCA9IGJbMF0ubWF0Y2goc29ydHRhYmxlLkRBVEVfUkUpO1xuICAgIHkgPSBtdGNoWzNdOyBkID0gbXRjaFsyXTsgbSA9IG10Y2hbMV07XG4gICAgaWYgKG0ubGVuZ3RoID09IDEpIG0gPSAnMCcrbTtcbiAgICBpZiAoZC5sZW5ndGggPT0gMSkgZCA9ICcwJytkO1xuICAgIGR0MiA9IHkrbStkO1xuICAgIGlmIChkdDE9PWR0MikgcmV0dXJuIDA7XG4gICAgaWYgKGR0MTxkdDIpIHJldHVybiAtMTtcbiAgICByZXR1cm4gMTtcbiAgfSxcblxuICBzaGFrZXJfc29ydDogZnVuY3Rpb24obGlzdCwgY29tcF9mdW5jKSB7XG4gICAgLy8gQSBzdGFibGUgc29ydCBmdW5jdGlvbiB0byBhbGxvdyBtdWx0aS1sZXZlbCBzb3J0aW5nIG9mIGRhdGFcbiAgICAvLyBzZWU6IGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQ29ja3RhaWxfc29ydFxuICAgIC8vIHRoYW5rcyB0byBKb3NlcGggTmFobWlhc1xuICAgIHZhciBiID0gMDtcbiAgICB2YXIgdCA9IGxpc3QubGVuZ3RoIC0gMTtcbiAgICB2YXIgc3dhcCA9IHRydWU7XG5cbiAgICB3aGlsZShzd2FwKSB7XG4gICAgICAgIHN3YXAgPSBmYWxzZTtcbiAgICAgICAgZm9yKHZhciBpID0gYjsgaSA8IHQ7ICsraSkge1xuICAgICAgICAgICAgaWYgKCBjb21wX2Z1bmMobGlzdFtpXSwgbGlzdFtpKzFdKSA+IDAgKSB7XG4gICAgICAgICAgICAgICAgdmFyIHEgPSBsaXN0W2ldOyBsaXN0W2ldID0gbGlzdFtpKzFdOyBsaXN0W2krMV0gPSBxO1xuICAgICAgICAgICAgICAgIHN3YXAgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IC8vIGZvclxuICAgICAgICB0LS07XG5cbiAgICAgICAgaWYgKCFzd2FwKSBicmVhaztcblxuICAgICAgICBmb3IodmFyIGkgPSB0OyBpID4gYjsgLS1pKSB7XG4gICAgICAgICAgICBpZiAoIGNvbXBfZnVuYyhsaXN0W2ldLCBsaXN0W2ktMV0pIDwgMCApIHtcbiAgICAgICAgICAgICAgICB2YXIgcSA9IGxpc3RbaV07IGxpc3RbaV0gPSBsaXN0W2ktMV07IGxpc3RbaS0xXSA9IHE7XG4gICAgICAgICAgICAgICAgc3dhcCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gLy8gZm9yXG4gICAgICAgIGIrKztcblxuICAgIH0gLy8gd2hpbGUoc3dhcClcbiAgfVxufVxuXG4vKiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgIFN1cHBvcnRpbmcgZnVuY3Rpb25zOiBidW5kbGVkIGhlcmUgdG8gYXZvaWQgZGVwZW5kaW5nIG9uIGEgbGlicmFyeVxuICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqICovXG5cbi8vIERlYW4gRWR3YXJkcy9NYXR0aGlhcyBNaWxsZXIvSm9obiBSZXNpZ1xuXG4vKiBmb3IgTW96aWxsYS9PcGVyYTkgKi9cbmlmIChkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgc29ydHRhYmxlLmluaXQsIGZhbHNlKTtcbn1cblxuLyogZm9yIEludGVybmV0IEV4cGxvcmVyICovXG4vKkBjY19vbiBAKi9cbi8qQGlmIChAX3dpbjMyKVxuICAgIGRvY3VtZW50LndyaXRlKFwiPHNjcmlwdCBpZD1fX2llX29ubG9hZCBkZWZlciBzcmM9amF2YXNjcmlwdDp2b2lkKDApPjxcXC9zY3JpcHQ+XCIpO1xuICAgIHZhciBzY3JpcHQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIl9faWVfb25sb2FkXCIpO1xuICAgIHNjcmlwdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMucmVhZHlTdGF0ZSA9PSBcImNvbXBsZXRlXCIpIHtcbiAgICAgICAgICAgIHNvcnR0YWJsZS5pbml0KCk7IC8vIGNhbGwgdGhlIG9ubG9hZCBoYW5kbGVyXG4gICAgICAgIH1cbiAgICB9O1xuLypAZW5kIEAqL1xuXG4vKiBmb3IgU2FmYXJpICovXG5pZiAoL1dlYktpdC9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIHsgLy8gc25pZmZcbiAgICB2YXIgX3RpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICgvbG9hZGVkfGNvbXBsZXRlLy50ZXN0KGRvY3VtZW50LnJlYWR5U3RhdGUpKSB7XG4gICAgICAgICAgICBzb3J0dGFibGUuaW5pdCgpOyAvLyBjYWxsIHRoZSBvbmxvYWQgaGFuZGxlclxuICAgICAgICB9XG4gICAgfSwgMTApO1xufVxuXG4vKiBmb3Igb3RoZXIgYnJvd3NlcnMgKi9cbndpbmRvdy5vbmxvYWQgPSBzb3J0dGFibGUuaW5pdDtcblxuLy8gd3JpdHRlbiBieSBEZWFuIEVkd2FyZHMsIDIwMDVcbi8vIHdpdGggaW5wdXQgZnJvbSBUaW5vIFppamRlbCwgTWF0dGhpYXMgTWlsbGVyLCBEaWVnbyBQZXJpbmlcblxuLy8gaHR0cDovL2RlYW4uZWR3YXJkcy5uYW1lL3dlYmxvZy8yMDA1LzEwL2FkZC1ldmVudC9cblxuZnVuY3Rpb24gZGVhbl9hZGRFdmVudChlbGVtZW50LCB0eXBlLCBoYW5kbGVyKSB7XG5cdGlmIChlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIpIHtcblx0XHRlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgaGFuZGxlciwgZmFsc2UpO1xuXHR9IGVsc2Uge1xuXHRcdC8vIGFzc2lnbiBlYWNoIGV2ZW50IGhhbmRsZXIgYSB1bmlxdWUgSURcblx0XHRpZiAoIWhhbmRsZXIuJCRndWlkKSBoYW5kbGVyLiQkZ3VpZCA9IGRlYW5fYWRkRXZlbnQuZ3VpZCsrO1xuXHRcdC8vIGNyZWF0ZSBhIGhhc2ggdGFibGUgb2YgZXZlbnQgdHlwZXMgZm9yIHRoZSBlbGVtZW50XG5cdFx0aWYgKCFlbGVtZW50LmV2ZW50cykgZWxlbWVudC5ldmVudHMgPSB7fTtcblx0XHQvLyBjcmVhdGUgYSBoYXNoIHRhYmxlIG9mIGV2ZW50IGhhbmRsZXJzIGZvciBlYWNoIGVsZW1lbnQvZXZlbnQgcGFpclxuXHRcdHZhciBoYW5kbGVycyA9IGVsZW1lbnQuZXZlbnRzW3R5cGVdO1xuXHRcdGlmICghaGFuZGxlcnMpIHtcblx0XHRcdGhhbmRsZXJzID0gZWxlbWVudC5ldmVudHNbdHlwZV0gPSB7fTtcblx0XHRcdC8vIHN0b3JlIHRoZSBleGlzdGluZyBldmVudCBoYW5kbGVyIChpZiB0aGVyZSBpcyBvbmUpXG5cdFx0XHRpZiAoZWxlbWVudFtcIm9uXCIgKyB0eXBlXSkge1xuXHRcdFx0XHRoYW5kbGVyc1swXSA9IGVsZW1lbnRbXCJvblwiICsgdHlwZV07XG5cdFx0XHR9XG5cdFx0fVxuXHRcdC8vIHN0b3JlIHRoZSBldmVudCBoYW5kbGVyIGluIHRoZSBoYXNoIHRhYmxlXG5cdFx0aGFuZGxlcnNbaGFuZGxlci4kJGd1aWRdID0gaGFuZGxlcjtcblx0XHQvLyBhc3NpZ24gYSBnbG9iYWwgZXZlbnQgaGFuZGxlciB0byBkbyBhbGwgdGhlIHdvcmtcblx0XHRlbGVtZW50W1wib25cIiArIHR5cGVdID0gaGFuZGxlRXZlbnQ7XG5cdH1cbn07XG4vLyBhIGNvdW50ZXIgdXNlZCB0byBjcmVhdGUgdW5pcXVlIElEc1xuZGVhbl9hZGRFdmVudC5ndWlkID0gMTtcblxuZnVuY3Rpb24gcmVtb3ZlRXZlbnQoZWxlbWVudCwgdHlwZSwgaGFuZGxlcikge1xuXHRpZiAoZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKSB7XG5cdFx0ZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGhhbmRsZXIsIGZhbHNlKTtcblx0fSBlbHNlIHtcblx0XHQvLyBkZWxldGUgdGhlIGV2ZW50IGhhbmRsZXIgZnJvbSB0aGUgaGFzaCB0YWJsZVxuXHRcdGlmIChlbGVtZW50LmV2ZW50cyAmJiBlbGVtZW50LmV2ZW50c1t0eXBlXSkge1xuXHRcdFx0ZGVsZXRlIGVsZW1lbnQuZXZlbnRzW3R5cGVdW2hhbmRsZXIuJCRndWlkXTtcblx0XHR9XG5cdH1cbn07XG5cbmZ1bmN0aW9uIGhhbmRsZUV2ZW50KGV2ZW50KSB7XG5cdHZhciByZXR1cm5WYWx1ZSA9IHRydWU7XG5cdC8vIGdyYWIgdGhlIGV2ZW50IG9iamVjdCAoSUUgdXNlcyBhIGdsb2JhbCBldmVudCBvYmplY3QpXG5cdGV2ZW50ID0gZXZlbnQgfHwgZml4RXZlbnQoKCh0aGlzLm93bmVyRG9jdW1lbnQgfHwgdGhpcy5kb2N1bWVudCB8fCB0aGlzKS5wYXJlbnRXaW5kb3cgfHwgd2luZG93KS5ldmVudCk7XG5cdC8vIGdldCBhIHJlZmVyZW5jZSB0byB0aGUgaGFzaCB0YWJsZSBvZiBldmVudCBoYW5kbGVyc1xuXHR2YXIgaGFuZGxlcnMgPSB0aGlzLmV2ZW50c1tldmVudC50eXBlXTtcblx0Ly8gZXhlY3V0ZSBlYWNoIGV2ZW50IGhhbmRsZXJcblx0Zm9yICh2YXIgaSBpbiBoYW5kbGVycykge1xuXHRcdHRoaXMuJCRoYW5kbGVFdmVudCA9IGhhbmRsZXJzW2ldO1xuXHRcdGlmICh0aGlzLiQkaGFuZGxlRXZlbnQoZXZlbnQpID09PSBmYWxzZSkge1xuXHRcdFx0cmV0dXJuVmFsdWUgPSBmYWxzZTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIHJldHVyblZhbHVlO1xufTtcblxuZnVuY3Rpb24gZml4RXZlbnQoZXZlbnQpIHtcblx0Ly8gYWRkIFczQyBzdGFuZGFyZCBldmVudCBtZXRob2RzXG5cdGV2ZW50LnByZXZlbnREZWZhdWx0ID0gZml4RXZlbnQucHJldmVudERlZmF1bHQ7XG5cdGV2ZW50LnN0b3BQcm9wYWdhdGlvbiA9IGZpeEV2ZW50LnN0b3BQcm9wYWdhdGlvbjtcblx0cmV0dXJuIGV2ZW50O1xufTtcbmZpeEV2ZW50LnByZXZlbnREZWZhdWx0ID0gZnVuY3Rpb24oKSB7XG5cdHRoaXMucmV0dXJuVmFsdWUgPSBmYWxzZTtcbn07XG5maXhFdmVudC5zdG9wUHJvcGFnYXRpb24gPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5jYW5jZWxCdWJibGUgPSB0cnVlO1xufVxuXG4vLyBEZWFuJ3MgZm9yRWFjaDogaHR0cDovL2RlYW4uZWR3YXJkcy5uYW1lL2Jhc2UvZm9yRWFjaC5qc1xuLypcblx0Zm9yRWFjaCwgdmVyc2lvbiAxLjBcblx0Q29weXJpZ2h0IDIwMDYsIERlYW4gRWR3YXJkc1xuXHRMaWNlbnNlOiBodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL21pdC1saWNlbnNlLnBocFxuKi9cblxuLy8gYXJyYXktbGlrZSBlbnVtZXJhdGlvblxuaWYgKCFBcnJheS5mb3JFYWNoKSB7IC8vIG1vemlsbGEgYWxyZWFkeSBzdXBwb3J0cyB0aGlzXG5cdEFycmF5LmZvckVhY2ggPSBmdW5jdGlvbihhcnJheSwgYmxvY2ssIGNvbnRleHQpIHtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRibG9jay5jYWxsKGNvbnRleHQsIGFycmF5W2ldLCBpLCBhcnJheSk7XG5cdFx0fVxuXHR9O1xufVxuXG4vLyBnZW5lcmljIGVudW1lcmF0aW9uXG5GdW5jdGlvbi5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uKG9iamVjdCwgYmxvY2ssIGNvbnRleHQpIHtcblx0Zm9yICh2YXIga2V5IGluIG9iamVjdCkge1xuXHRcdGlmICh0eXBlb2YgdGhpcy5wcm90b3R5cGVba2V5XSA9PSBcInVuZGVmaW5lZFwiKSB7XG5cdFx0XHRibG9jay5jYWxsKGNvbnRleHQsIG9iamVjdFtrZXldLCBrZXksIG9iamVjdCk7XG5cdFx0fVxuXHR9XG59O1xuXG4vLyBjaGFyYWN0ZXIgZW51bWVyYXRpb25cblN0cmluZy5mb3JFYWNoID0gZnVuY3Rpb24oc3RyaW5nLCBibG9jaywgY29udGV4dCkge1xuXHRBcnJheS5mb3JFYWNoKHN0cmluZy5zcGxpdChcIlwiKSwgZnVuY3Rpb24oY2hyLCBpbmRleCkge1xuXHRcdGJsb2NrLmNhbGwoY29udGV4dCwgY2hyLCBpbmRleCwgc3RyaW5nKTtcblx0fSk7XG59O1xuXG4vLyBnbG9iYWxseSByZXNvbHZlIGZvckVhY2ggZW51bWVyYXRpb25cbnZhciBmb3JFYWNoID0gZnVuY3Rpb24ob2JqZWN0LCBibG9jaywgY29udGV4dCkge1xuXHRpZiAob2JqZWN0KSB7XG5cdFx0dmFyIHJlc29sdmUgPSBPYmplY3Q7IC8vIGRlZmF1bHRcblx0XHRpZiAob2JqZWN0IGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcblx0XHRcdC8vIGZ1bmN0aW9ucyBoYXZlIGEgXCJsZW5ndGhcIiBwcm9wZXJ0eVxuXHRcdFx0cmVzb2x2ZSA9IEZ1bmN0aW9uO1xuXHRcdH0gZWxzZSBpZiAob2JqZWN0LmZvckVhY2ggaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuXHRcdFx0Ly8gdGhlIG9iamVjdCBpbXBsZW1lbnRzIGEgY3VzdG9tIGZvckVhY2ggbWV0aG9kIHNvIHVzZSB0aGF0XG5cdFx0XHRvYmplY3QuZm9yRWFjaChibG9jaywgY29udGV4dCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fSBlbHNlIGlmICh0eXBlb2Ygb2JqZWN0ID09IFwic3RyaW5nXCIpIHtcblx0XHRcdC8vIHRoZSBvYmplY3QgaXMgYSBzdHJpbmdcblx0XHRcdHJlc29sdmUgPSBTdHJpbmc7XG5cdFx0fSBlbHNlIGlmICh0eXBlb2Ygb2JqZWN0Lmxlbmd0aCA9PSBcIm51bWJlclwiKSB7XG5cdFx0XHQvLyB0aGUgb2JqZWN0IGlzIGFycmF5LWxpa2Vcblx0XHRcdHJlc29sdmUgPSBBcnJheTtcblx0XHR9XG5cdFx0cmVzb2x2ZS5mb3JFYWNoKG9iamVjdCwgYmxvY2ssIGNvbnRleHQpO1xuXHR9XG59OyJdfQ==
