(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var app = require('./public/js/app.js')
var datepickr = require('./public/js/datepickr.js')
},{"./public/js/app.js":2,"./public/js/datepickr.js":3}],2:[function(require,module,exports){
'use strict'

var addStepBtn = document.querySelector('#add-step')
var list = document.querySelector('ol')

if (addStepBtn) {
  addStepBtn.addEventListener('click', function() {
    var li = document.createElement('li')
    var stepHTML = "<div class='step-box'><div class='step-notes'><textarea class='step-text' placeholder='Write step here'></textarea></div><div class='complete-box'><input type='checkbox' class='complete-check' name='step-complete'><input type='time' class='time' name='time' value='09:00'></div><div class='complete-notes'><textarea class='complete-notes-text' placeholder='Write notes here'></textarea><button type='button' class='remove-step'>Remove Step</button></div></div>"
    li.innerHTML = stepHTML

    list.appendChild(li)

  })

  document.querySelector('#recipe-list ol').addEventListener('click', function(event) {
    if (event.target.classList.contains('remove-step')) {
      var li = event.target.closest('li')
      li.parentNode.removeChild(li)
    }
  })
}

window.outputUpdate = function (temp) {
  document.querySelector('#temp-slider-output').value = temp;
}

// gather log data for saving to database
var save = document.querySelector('#save')

if (save) {
  save.addEventListener('click', function() {

    var basicData = {
      date: document.querySelector('#date-select').value, // find a way to get this value
      session_name: document.querySelector('#session-name').value,
      cooking_device: document.querySelector('#cooking-device').value,
      meat: document.querySelector('#meat-type').value,
      weight: document.querySelector('#weight').value,
      meat_notes: document.querySelector('#meat-notes').value,
      cook_temperature: document.querySelector('#temp-slider').value,
      estimated_time: document.querySelector('#estimated-time').value,
      fuel: document.querySelector('#fuel').value,
      brand: document.querySelector('#brand').value,
      wood: document.querySelector('#wood').value,
      rating: document.querySelector('#rating').value
    }

    var ol = document.querySelector('ol')
    var items = ol.getElementsByTagName('li')
    var stepInfo = []
    
    Array.from(items).forEach(function(item) {
      var stepObject = {}
      stepObject.step = item.querySelector('.step-text').value
      stepObject.completed = item.querySelector('.complete-check').checked
      stepObject.time = item.querySelector('.time').value
      stepObject.notes = item.querySelector('.complete-notes').value
      stepInfo.push(stepObject)
    })

    var logData = Object.assign({ steps: stepInfo }, basicData)
    
    sendLog(logData)
  })
}


function sendLog(logData) {
  fetch('/create-log', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(logData),
    mode: 'cors',
    cache: 'default',
    credentials: 'include'
  })
    .then(function() {
      alert('saved')
    })
}


// create FETCH to post log







},{}],3:[function(require,module,exports){
/*
    datepickr 3.0 - pick your date not your nose

    https://github.com/joshsalverda/datepickr

    Copyright © 2014 Josh Salverda <josh.salverda@gmail.com>
    This work is free. You can redistribute it and/or modify it under the
    terms of the Do What The Fuck You Want To Public License, Version 2,
    as published by Sam Hocevar. See http://www.wtfpl.net/ for more details.
*/

document.addEventListener('DOMContentLoaded', function() {
  datepickr('#date-select')
})

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
                return self.currentMonthView === 1 && (((self.currentYearView % 4 === 0) && (self.currentYearView % 100 !== 0)) || (self.currentYearView % 400 === 0)) ? 29 : self.l10n.daysInMonth[self.currentMonthView];
            }
        }
    };

    formatDate = function (dateFormat, milliseconds) {
        var formattedDate = '',
            dateObj = new Date(milliseconds),
            formats = {
                d: function () {
                    var day = formats.j();
                    return (day < 10) ? '0' + day : day;
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
                    return (month < 10) ? '0' + month : month;
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

        monthNavigation  = '<span class="datepickr-prev-month">&lt;</span>';
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
        var parent,
            element;

        self.removeEventListener(document, 'click', documentClick);
        self.removeEventListener(self.element, getOpenEvent(), open);

        parent = self.element.parentNode;
        parent.removeChild(calendarContainer);
        element = parent.removeChild(self.element);
        parent.parentNode.replaceChild(element, parent);
    };

    init = function () {
        var config,
            parsedDate;

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
    hasClass: function (element, className) { return element.classList.contains(className); },
    addClass: function (element, className) { element.classList.add(className); },
    removeClass: function (element, className) { element.classList.remove(className); },
    forEach: function (items, callback) { [].forEach.call(items, callback); },
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

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQuanMiLCJwdWJsaWMvanMvYXBwLmpzIiwicHVibGljL2pzL2RhdGVwaWNrci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgYXBwID0gcmVxdWlyZSgnLi9wdWJsaWMvanMvYXBwLmpzJylcbnZhciBkYXRlcGlja3IgPSByZXF1aXJlKCcuL3B1YmxpYy9qcy9kYXRlcGlja3IuanMnKSIsIid1c2Ugc3RyaWN0J1xuXG52YXIgYWRkU3RlcEJ0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhZGQtc3RlcCcpXG52YXIgbGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ29sJylcblxuaWYgKGFkZFN0ZXBCdG4pIHtcbiAgYWRkU3RlcEJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJylcbiAgICB2YXIgc3RlcEhUTUwgPSBcIjxkaXYgY2xhc3M9J3N0ZXAtYm94Jz48ZGl2IGNsYXNzPSdzdGVwLW5vdGVzJz48dGV4dGFyZWEgY2xhc3M9J3N0ZXAtdGV4dCcgcGxhY2Vob2xkZXI9J1dyaXRlIHN0ZXAgaGVyZSc+PC90ZXh0YXJlYT48L2Rpdj48ZGl2IGNsYXNzPSdjb21wbGV0ZS1ib3gnPjxpbnB1dCB0eXBlPSdjaGVja2JveCcgY2xhc3M9J2NvbXBsZXRlLWNoZWNrJyBuYW1lPSdzdGVwLWNvbXBsZXRlJz48aW5wdXQgdHlwZT0ndGltZScgY2xhc3M9J3RpbWUnIG5hbWU9J3RpbWUnIHZhbHVlPScwOTowMCc+PC9kaXY+PGRpdiBjbGFzcz0nY29tcGxldGUtbm90ZXMnPjx0ZXh0YXJlYSBjbGFzcz0nY29tcGxldGUtbm90ZXMtdGV4dCcgcGxhY2Vob2xkZXI9J1dyaXRlIG5vdGVzIGhlcmUnPjwvdGV4dGFyZWE+PGJ1dHRvbiB0eXBlPSdidXR0b24nIGNsYXNzPSdyZW1vdmUtc3RlcCc+UmVtb3ZlIFN0ZXA8L2J1dHRvbj48L2Rpdj48L2Rpdj5cIlxuICAgIGxpLmlubmVySFRNTCA9IHN0ZXBIVE1MXG5cbiAgICBsaXN0LmFwcGVuZENoaWxkKGxpKVxuXG4gIH0pXG5cbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3JlY2lwZS1saXN0IG9sJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuICAgIGlmIChldmVudC50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdyZW1vdmUtc3RlcCcpKSB7XG4gICAgICB2YXIgbGkgPSBldmVudC50YXJnZXQuY2xvc2VzdCgnbGknKVxuICAgICAgbGkucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChsaSlcbiAgICB9XG4gIH0pXG59XG5cbndpbmRvdy5vdXRwdXRVcGRhdGUgPSBmdW5jdGlvbiAodGVtcCkge1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjdGVtcC1zbGlkZXItb3V0cHV0JykudmFsdWUgPSB0ZW1wO1xufVxuXG4vLyBnYXRoZXIgbG9nIGRhdGEgZm9yIHNhdmluZyB0byBkYXRhYmFzZVxudmFyIHNhdmUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2F2ZScpXG5cbmlmIChzYXZlKSB7XG4gIHNhdmUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcblxuICAgIHZhciBiYXNpY0RhdGEgPSB7XG4gICAgICBkYXRlOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZGF0ZS1zZWxlY3QnKS52YWx1ZSwgLy8gZmluZCBhIHdheSB0byBnZXQgdGhpcyB2YWx1ZVxuICAgICAgc2Vzc2lvbl9uYW1lOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2Vzc2lvbi1uYW1lJykudmFsdWUsXG4gICAgICBjb29raW5nX2RldmljZTogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2Nvb2tpbmctZGV2aWNlJykudmFsdWUsXG4gICAgICBtZWF0OiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWVhdC10eXBlJykudmFsdWUsXG4gICAgICB3ZWlnaHQ6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyN3ZWlnaHQnKS52YWx1ZSxcbiAgICAgIG1lYXRfbm90ZXM6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtZWF0LW5vdGVzJykudmFsdWUsXG4gICAgICBjb29rX3RlbXBlcmF0dXJlOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjdGVtcC1zbGlkZXInKS52YWx1ZSxcbiAgICAgIGVzdGltYXRlZF90aW1lOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZXN0aW1hdGVkLXRpbWUnKS52YWx1ZSxcbiAgICAgIGZ1ZWw6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNmdWVsJykudmFsdWUsXG4gICAgICBicmFuZDogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2JyYW5kJykudmFsdWUsXG4gICAgICB3b29kOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjd29vZCcpLnZhbHVlLFxuICAgICAgcmF0aW5nOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjcmF0aW5nJykudmFsdWVcbiAgICB9XG5cbiAgICB2YXIgb2wgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdvbCcpXG4gICAgdmFyIGl0ZW1zID0gb2wuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2xpJylcbiAgICB2YXIgc3RlcEluZm8gPSBbXVxuICAgIFxuICAgIEFycmF5LmZyb20oaXRlbXMpLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuICAgICAgdmFyIHN0ZXBPYmplY3QgPSB7fVxuICAgICAgc3RlcE9iamVjdC5zdGVwID0gaXRlbS5xdWVyeVNlbGVjdG9yKCcuc3RlcC10ZXh0JykudmFsdWVcbiAgICAgIHN0ZXBPYmplY3QuY29tcGxldGVkID0gaXRlbS5xdWVyeVNlbGVjdG9yKCcuY29tcGxldGUtY2hlY2snKS5jaGVja2VkXG4gICAgICBzdGVwT2JqZWN0LnRpbWUgPSBpdGVtLnF1ZXJ5U2VsZWN0b3IoJy50aW1lJykudmFsdWVcbiAgICAgIHN0ZXBPYmplY3Qubm90ZXMgPSBpdGVtLnF1ZXJ5U2VsZWN0b3IoJy5jb21wbGV0ZS1ub3RlcycpLnZhbHVlXG4gICAgICBzdGVwSW5mby5wdXNoKHN0ZXBPYmplY3QpXG4gICAgfSlcblxuICAgIHZhciBsb2dEYXRhID0gT2JqZWN0LmFzc2lnbih7IHN0ZXBzOiBzdGVwSW5mbyB9LCBiYXNpY0RhdGEpXG4gICAgXG4gICAgc2VuZExvZyhsb2dEYXRhKVxuICB9KVxufVxuXG5cbmZ1bmN0aW9uIHNlbmRMb2cobG9nRGF0YSkge1xuICBmZXRjaCgnL2NyZWF0ZS1sb2cnLCB7XG4gICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgaGVhZGVyczoge1xuICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ1xuICAgIH0sXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkobG9nRGF0YSksXG4gICAgbW9kZTogJ2NvcnMnLFxuICAgIGNhY2hlOiAnZGVmYXVsdCcsXG4gICAgY3JlZGVudGlhbHM6ICdpbmNsdWRlJ1xuICB9KVxuICAgIC50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgYWxlcnQoJ3NhdmVkJylcbiAgICB9KVxufVxuXG5cbi8vIGNyZWF0ZSBGRVRDSCB0byBwb3N0IGxvZ1xuXG5cblxuXG5cblxuIiwiLypcbiAgICBkYXRlcGlja3IgMy4wIC0gcGljayB5b3VyIGRhdGUgbm90IHlvdXIgbm9zZVxuXG4gICAgaHR0cHM6Ly9naXRodWIuY29tL2pvc2hzYWx2ZXJkYS9kYXRlcGlja3JcblxuICAgIENvcHlyaWdodCDCqSAyMDE0IEpvc2ggU2FsdmVyZGEgPGpvc2guc2FsdmVyZGFAZ21haWwuY29tPlxuICAgIFRoaXMgd29yayBpcyBmcmVlLiBZb3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5IGl0IHVuZGVyIHRoZVxuICAgIHRlcm1zIG9mIHRoZSBEbyBXaGF0IFRoZSBGdWNrIFlvdSBXYW50IFRvIFB1YmxpYyBMaWNlbnNlLCBWZXJzaW9uIDIsXG4gICAgYXMgcHVibGlzaGVkIGJ5IFNhbSBIb2NldmFyLiBTZWUgaHR0cDovL3d3dy53dGZwbC5uZXQvIGZvciBtb3JlIGRldGFpbHMuXG4qL1xuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZnVuY3Rpb24oKSB7XG4gIGRhdGVwaWNrcignI2RhdGUtc2VsZWN0Jylcbn0pXG5cbnZhciBkYXRlcGlja3IgPSBmdW5jdGlvbiAoc2VsZWN0b3IsIGNvbmZpZykge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICB2YXIgZWxlbWVudHMsXG4gICAgICAgIGNyZWF0ZUluc3RhbmNlLFxuICAgICAgICBpbnN0YW5jZXMgPSBbXSxcbiAgICAgICAgaTtcblxuICAgIGRhdGVwaWNrci5wcm90b3R5cGUgPSBkYXRlcGlja3IuaW5pdC5wcm90b3R5cGU7XG5cbiAgICBjcmVhdGVJbnN0YW5jZSA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgIGlmIChlbGVtZW50Ll9kYXRlcGlja3IpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuX2RhdGVwaWNrci5kZXN0cm95KCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxlbWVudC5fZGF0ZXBpY2tyID0gbmV3IGRhdGVwaWNrci5pbml0KGVsZW1lbnQsIGNvbmZpZyk7XG4gICAgICAgIHJldHVybiBlbGVtZW50Ll9kYXRlcGlja3I7XG4gICAgfTtcblxuICAgIGlmIChzZWxlY3Rvci5ub2RlTmFtZSkge1xuICAgICAgICByZXR1cm4gY3JlYXRlSW5zdGFuY2Uoc2VsZWN0b3IpO1xuICAgIH1cblxuICAgIGVsZW1lbnRzID0gZGF0ZXBpY2tyLnByb3RvdHlwZS5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcblxuICAgIGlmIChlbGVtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUluc3RhbmNlKGVsZW1lbnRzWzBdKTtcbiAgICB9XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgZWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaW5zdGFuY2VzLnB1c2goY3JlYXRlSW5zdGFuY2UoZWxlbWVudHNbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIGluc3RhbmNlcztcbn07XG5cbmRhdGVwaWNrci5pbml0ID0gZnVuY3Rpb24gKGVsZW1lbnQsIGluc3RhbmNlQ29uZmlnKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIHZhciBzZWxmID0gdGhpcyxcbiAgICAgICAgZGVmYXVsdENvbmZpZyA9IHtcbiAgICAgICAgICAgIGRhdGVGb3JtYXQ6ICdGIGosIFknLFxuICAgICAgICAgICAgYWx0Rm9ybWF0OiBudWxsLFxuICAgICAgICAgICAgYWx0SW5wdXQ6IG51bGwsXG4gICAgICAgICAgICBtaW5EYXRlOiBudWxsLFxuICAgICAgICAgICAgbWF4RGF0ZTogbnVsbCxcbiAgICAgICAgICAgIHNob3J0aGFuZEN1cnJlbnRNb250aDogZmFsc2VcbiAgICAgICAgfSxcbiAgICAgICAgY2FsZW5kYXJDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcbiAgICAgICAgbmF2aWdhdGlvbkN1cnJlbnRNb250aCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKSxcbiAgICAgICAgY2FsZW5kYXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0YWJsZScpLFxuICAgICAgICBjYWxlbmRhckJvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0Ym9keScpLFxuICAgICAgICB3cmFwcGVyRWxlbWVudCxcbiAgICAgICAgY3VycmVudERhdGUgPSBuZXcgRGF0ZSgpLFxuICAgICAgICB3cmFwLFxuICAgICAgICBkYXRlLFxuICAgICAgICBmb3JtYXREYXRlLFxuICAgICAgICBtb250aFRvU3RyLFxuICAgICAgICBpc1NwZWNpZmljRGF5LFxuICAgICAgICBidWlsZFdlZWtkYXlzLFxuICAgICAgICBidWlsZERheXMsXG4gICAgICAgIHVwZGF0ZU5hdmlnYXRpb25DdXJyZW50TW9udGgsXG4gICAgICAgIGJ1aWxkTW9udGhOYXZpZ2F0aW9uLFxuICAgICAgICBoYW5kbGVZZWFyQ2hhbmdlLFxuICAgICAgICBkb2N1bWVudENsaWNrLFxuICAgICAgICBjYWxlbmRhckNsaWNrLFxuICAgICAgICBidWlsZENhbGVuZGFyLFxuICAgICAgICBnZXRPcGVuRXZlbnQsXG4gICAgICAgIGJpbmQsXG4gICAgICAgIG9wZW4sXG4gICAgICAgIGNsb3NlLFxuICAgICAgICBkZXN0cm95LFxuICAgICAgICBpbml0O1xuXG4gICAgY2FsZW5kYXJDb250YWluZXIuY2xhc3NOYW1lID0gJ2RhdGVwaWNrci1jYWxlbmRhcic7XG4gICAgbmF2aWdhdGlvbkN1cnJlbnRNb250aC5jbGFzc05hbWUgPSAnZGF0ZXBpY2tyLWN1cnJlbnQtbW9udGgnO1xuICAgIGluc3RhbmNlQ29uZmlnID0gaW5zdGFuY2VDb25maWcgfHwge307XG5cbiAgICB3cmFwID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB3cmFwcGVyRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICB3cmFwcGVyRWxlbWVudC5jbGFzc05hbWUgPSAnZGF0ZXBpY2tyLXdyYXBwZXInO1xuICAgICAgICBzZWxmLmVsZW1lbnQucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUod3JhcHBlckVsZW1lbnQsIHNlbGYuZWxlbWVudCk7XG4gICAgICAgIHdyYXBwZXJFbGVtZW50LmFwcGVuZENoaWxkKHNlbGYuZWxlbWVudCk7XG4gICAgfTtcblxuICAgIGRhdGUgPSB7XG4gICAgICAgIGN1cnJlbnQ6IHtcbiAgICAgICAgICAgIHllYXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY3VycmVudERhdGUuZ2V0RnVsbFllYXIoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtb250aDoge1xuICAgICAgICAgICAgICAgIGludGVnZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnREYXRlLmdldE1vbnRoKCk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzdHJpbmc6IGZ1bmN0aW9uIChzaG9ydGhhbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1vbnRoID0gY3VycmVudERhdGUuZ2V0TW9udGgoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1vbnRoVG9TdHIobW9udGgsIHNob3J0aGFuZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRheTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjdXJyZW50RGF0ZS5nZXREYXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIG1vbnRoOiB7XG4gICAgICAgICAgICBzdHJpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbW9udGhUb1N0cihzZWxmLmN1cnJlbnRNb250aFZpZXcsIHNlbGYuY29uZmlnLnNob3J0aGFuZEN1cnJlbnRNb250aCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbnVtRGF5czogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8vIGNoZWNrcyB0byBzZWUgaWYgZmVicnVhcnkgaXMgYSBsZWFwIHllYXIgb3RoZXJ3aXNlIHJldHVybiB0aGUgcmVzcGVjdGl2ZSAjIG9mIGRheXNcbiAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5jdXJyZW50TW9udGhWaWV3ID09PSAxICYmICgoKHNlbGYuY3VycmVudFllYXJWaWV3ICUgNCA9PT0gMCkgJiYgKHNlbGYuY3VycmVudFllYXJWaWV3ICUgMTAwICE9PSAwKSkgfHwgKHNlbGYuY3VycmVudFllYXJWaWV3ICUgNDAwID09PSAwKSkgPyAyOSA6IHNlbGYubDEwbi5kYXlzSW5Nb250aFtzZWxmLmN1cnJlbnRNb250aFZpZXddO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIGZvcm1hdERhdGUgPSBmdW5jdGlvbiAoZGF0ZUZvcm1hdCwgbWlsbGlzZWNvbmRzKSB7XG4gICAgICAgIHZhciBmb3JtYXR0ZWREYXRlID0gJycsXG4gICAgICAgICAgICBkYXRlT2JqID0gbmV3IERhdGUobWlsbGlzZWNvbmRzKSxcbiAgICAgICAgICAgIGZvcm1hdHMgPSB7XG4gICAgICAgICAgICAgICAgZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGF5ID0gZm9ybWF0cy5qKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoZGF5IDwgMTApID8gJzAnICsgZGF5IDogZGF5O1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgRDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5sMTBuLndlZWtkYXlzLnNob3J0aGFuZFtmb3JtYXRzLncoKV07XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBqOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkYXRlT2JqLmdldERhdGUoKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYubDEwbi53ZWVrZGF5cy5sb25naGFuZFtmb3JtYXRzLncoKV07XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB3OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkYXRlT2JqLmdldERheSgpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgRjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbW9udGhUb1N0cihmb3JtYXRzLm4oKSAtIDEsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG06IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1vbnRoID0gZm9ybWF0cy5uKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAobW9udGggPCAxMCkgPyAnMCcgKyBtb250aCA6IG1vbnRoO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgTTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbW9udGhUb1N0cihmb3JtYXRzLm4oKSAtIDEsIHRydWUpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGF0ZU9iai5nZXRNb250aCgpICsgMTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIFU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRhdGVPYmouZ2V0VGltZSgpIC8gMTAwMDtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHk6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFN0cmluZyhmb3JtYXRzLlkoKSkuc3Vic3RyaW5nKDIpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgWTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGF0ZU9iai5nZXRGdWxsWWVhcigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmb3JtYXRQaWVjZXMgPSBkYXRlRm9ybWF0LnNwbGl0KCcnKTtcblxuICAgICAgICBzZWxmLmZvckVhY2goZm9ybWF0UGllY2VzLCBmdW5jdGlvbiAoZm9ybWF0UGllY2UsIGluZGV4KSB7XG4gICAgICAgICAgICBpZiAoZm9ybWF0c1tmb3JtYXRQaWVjZV0gJiYgZm9ybWF0UGllY2VzW2luZGV4IC0gMV0gIT09ICdcXFxcJykge1xuICAgICAgICAgICAgICAgIGZvcm1hdHRlZERhdGUgKz0gZm9ybWF0c1tmb3JtYXRQaWVjZV0oKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGZvcm1hdFBpZWNlICE9PSAnXFxcXCcpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9ybWF0dGVkRGF0ZSArPSBmb3JtYXRQaWVjZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBmb3JtYXR0ZWREYXRlO1xuICAgIH07XG5cbiAgICBtb250aFRvU3RyID0gZnVuY3Rpb24gKGRhdGUsIHNob3J0aGFuZCkge1xuICAgICAgICBpZiAoc2hvcnRoYW5kID09PSB0cnVlKSB7XG4gICAgICAgICAgICByZXR1cm4gc2VsZi5sMTBuLm1vbnRocy5zaG9ydGhhbmRbZGF0ZV07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc2VsZi5sMTBuLm1vbnRocy5sb25naGFuZFtkYXRlXTtcbiAgICB9O1xuXG4gICAgaXNTcGVjaWZpY0RheSA9IGZ1bmN0aW9uIChkYXksIG1vbnRoLCB5ZWFyLCBjb21wYXJpc29uKSB7XG4gICAgICAgIHJldHVybiBkYXkgPT09IGNvbXBhcmlzb24gJiYgc2VsZi5jdXJyZW50TW9udGhWaWV3ID09PSBtb250aCAmJiBzZWxmLmN1cnJlbnRZZWFyVmlldyA9PT0geWVhcjtcbiAgICB9O1xuXG4gICAgYnVpbGRXZWVrZGF5cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHdlZWtkYXlDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0aGVhZCcpLFxuICAgICAgICAgICAgZmlyc3REYXlPZldlZWsgPSBzZWxmLmwxMG4uZmlyc3REYXlPZldlZWssXG4gICAgICAgICAgICB3ZWVrZGF5cyA9IHNlbGYubDEwbi53ZWVrZGF5cy5zaG9ydGhhbmQ7XG5cbiAgICAgICAgaWYgKGZpcnN0RGF5T2ZXZWVrID4gMCAmJiBmaXJzdERheU9mV2VlayA8IHdlZWtkYXlzLmxlbmd0aCkge1xuICAgICAgICAgICAgd2Vla2RheXMgPSBbXS5jb25jYXQod2Vla2RheXMuc3BsaWNlKGZpcnN0RGF5T2ZXZWVrLCB3ZWVrZGF5cy5sZW5ndGgpLCB3ZWVrZGF5cy5zcGxpY2UoMCwgZmlyc3REYXlPZldlZWspKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHdlZWtkYXlDb250YWluZXIuaW5uZXJIVE1MID0gJzx0cj48dGg+JyArIHdlZWtkYXlzLmpvaW4oJzwvdGg+PHRoPicpICsgJzwvdGg+PC90cj4nO1xuICAgICAgICBjYWxlbmRhci5hcHBlbmRDaGlsZCh3ZWVrZGF5Q29udGFpbmVyKTtcbiAgICB9O1xuXG4gICAgYnVpbGREYXlzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZmlyc3RPZk1vbnRoID0gbmV3IERhdGUoc2VsZi5jdXJyZW50WWVhclZpZXcsIHNlbGYuY3VycmVudE1vbnRoVmlldywgMSkuZ2V0RGF5KCksXG4gICAgICAgICAgICBudW1EYXlzID0gZGF0ZS5tb250aC5udW1EYXlzKCksXG4gICAgICAgICAgICBjYWxlbmRhckZyYWdtZW50ID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpLFxuICAgICAgICAgICAgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndHInKSxcbiAgICAgICAgICAgIGRheUNvdW50LFxuICAgICAgICAgICAgZGF5TnVtYmVyLFxuICAgICAgICAgICAgdG9kYXkgPSAnJyxcbiAgICAgICAgICAgIHNlbGVjdGVkID0gJycsXG4gICAgICAgICAgICBkaXNhYmxlZCA9ICcnLFxuICAgICAgICAgICAgY3VycmVudFRpbWVzdGFtcDtcblxuICAgICAgICAvLyBPZmZzZXQgdGhlIGZpcnN0IGRheSBieSB0aGUgc3BlY2lmaWVkIGFtb3VudFxuICAgICAgICBmaXJzdE9mTW9udGggLT0gc2VsZi5sMTBuLmZpcnN0RGF5T2ZXZWVrO1xuICAgICAgICBpZiAoZmlyc3RPZk1vbnRoIDwgMCkge1xuICAgICAgICAgICAgZmlyc3RPZk1vbnRoICs9IDc7XG4gICAgICAgIH1cblxuICAgICAgICBkYXlDb3VudCA9IGZpcnN0T2ZNb250aDtcbiAgICAgICAgY2FsZW5kYXJCb2R5LmlubmVySFRNTCA9ICcnO1xuXG4gICAgICAgIC8vIEFkZCBzcGFjZXIgdG8gbGluZSB1cCB0aGUgZmlyc3QgZGF5IG9mIHRoZSBtb250aCBjb3JyZWN0bHlcbiAgICAgICAgaWYgKGZpcnN0T2ZNb250aCA+IDApIHtcbiAgICAgICAgICAgIHJvdy5pbm5lckhUTUwgKz0gJzx0ZCBjb2xzcGFuPVwiJyArIGZpcnN0T2ZNb250aCArICdcIj4mbmJzcDs8L3RkPic7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTdGFydCBhdCAxIHNpbmNlIHRoZXJlIGlzIG5vIDB0aCBkYXlcbiAgICAgICAgZm9yIChkYXlOdW1iZXIgPSAxOyBkYXlOdW1iZXIgPD0gbnVtRGF5czsgZGF5TnVtYmVyKyspIHtcbiAgICAgICAgICAgIC8vIGlmIHdlIGhhdmUgcmVhY2hlZCB0aGUgZW5kIG9mIGEgd2Vlaywgd3JhcCB0byB0aGUgbmV4dCBsaW5lXG4gICAgICAgICAgICBpZiAoZGF5Q291bnQgPT09IDcpIHtcbiAgICAgICAgICAgICAgICBjYWxlbmRhckZyYWdtZW50LmFwcGVuZENoaWxkKHJvdyk7XG4gICAgICAgICAgICAgICAgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndHInKTtcbiAgICAgICAgICAgICAgICBkYXlDb3VudCA9IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRvZGF5ID0gaXNTcGVjaWZpY0RheShkYXRlLmN1cnJlbnQuZGF5KCksIGRhdGUuY3VycmVudC5tb250aC5pbnRlZ2VyKCksIGRhdGUuY3VycmVudC55ZWFyKCksIGRheU51bWJlcikgPyAnIHRvZGF5JyA6ICcnO1xuICAgICAgICAgICAgaWYgKHNlbGYuc2VsZWN0ZWREYXRlKSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0ZWQgPSBpc1NwZWNpZmljRGF5KHNlbGYuc2VsZWN0ZWREYXRlLmRheSwgc2VsZi5zZWxlY3RlZERhdGUubW9udGgsIHNlbGYuc2VsZWN0ZWREYXRlLnllYXIsIGRheU51bWJlcikgPyAnIHNlbGVjdGVkJyA6ICcnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoc2VsZi5jb25maWcubWluRGF0ZSB8fCBzZWxmLmNvbmZpZy5tYXhEYXRlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFRpbWVzdGFtcCA9IG5ldyBEYXRlKHNlbGYuY3VycmVudFllYXJWaWV3LCBzZWxmLmN1cnJlbnRNb250aFZpZXcsIGRheU51bWJlcikuZ2V0VGltZSgpO1xuICAgICAgICAgICAgICAgIGRpc2FibGVkID0gJyc7XG5cbiAgICAgICAgICAgICAgICBpZiAoc2VsZi5jb25maWcubWluRGF0ZSAmJiBjdXJyZW50VGltZXN0YW1wIDwgc2VsZi5jb25maWcubWluRGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZCA9ICcgZGlzYWJsZWQnO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChzZWxmLmNvbmZpZy5tYXhEYXRlICYmIGN1cnJlbnRUaW1lc3RhbXAgPiBzZWxmLmNvbmZpZy5tYXhEYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIGRpc2FibGVkID0gJyBkaXNhYmxlZCc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByb3cuaW5uZXJIVE1MICs9ICc8dGQgY2xhc3M9XCInICsgdG9kYXkgKyBzZWxlY3RlZCArIGRpc2FibGVkICsgJ1wiPjxzcGFuIGNsYXNzPVwiZGF0ZXBpY2tyLWRheVwiPicgKyBkYXlOdW1iZXIgKyAnPC9zcGFuPjwvdGQ+JztcbiAgICAgICAgICAgIGRheUNvdW50Kys7XG4gICAgICAgIH1cblxuICAgICAgICBjYWxlbmRhckZyYWdtZW50LmFwcGVuZENoaWxkKHJvdyk7XG4gICAgICAgIGNhbGVuZGFyQm9keS5hcHBlbmRDaGlsZChjYWxlbmRhckZyYWdtZW50KTtcbiAgICB9O1xuXG4gICAgdXBkYXRlTmF2aWdhdGlvbkN1cnJlbnRNb250aCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbmF2aWdhdGlvbkN1cnJlbnRNb250aC5pbm5lckhUTUwgPSBkYXRlLm1vbnRoLnN0cmluZygpICsgJyAnICsgc2VsZi5jdXJyZW50WWVhclZpZXc7XG4gICAgfTtcblxuICAgIGJ1aWxkTW9udGhOYXZpZ2F0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbW9udGhzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG4gICAgICAgICAgICBtb250aE5hdmlnYXRpb247XG5cbiAgICAgICAgbW9udGhOYXZpZ2F0aW9uICA9ICc8c3BhbiBjbGFzcz1cImRhdGVwaWNrci1wcmV2LW1vbnRoXCI+Jmx0Ozwvc3Bhbj4nO1xuICAgICAgICBtb250aE5hdmlnYXRpb24gKz0gJzxzcGFuIGNsYXNzPVwiZGF0ZXBpY2tyLW5leHQtbW9udGhcIj4mZ3Q7PC9zcGFuPic7XG5cbiAgICAgICAgbW9udGhzLmNsYXNzTmFtZSA9ICdkYXRlcGlja3ItbW9udGhzJztcbiAgICAgICAgbW9udGhzLmlubmVySFRNTCA9IG1vbnRoTmF2aWdhdGlvbjtcblxuICAgICAgICBtb250aHMuYXBwZW5kQ2hpbGQobmF2aWdhdGlvbkN1cnJlbnRNb250aCk7XG4gICAgICAgIHVwZGF0ZU5hdmlnYXRpb25DdXJyZW50TW9udGgoKTtcbiAgICAgICAgY2FsZW5kYXJDb250YWluZXIuYXBwZW5kQ2hpbGQobW9udGhzKTtcbiAgICB9O1xuXG4gICAgaGFuZGxlWWVhckNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHNlbGYuY3VycmVudE1vbnRoVmlldyA8IDApIHtcbiAgICAgICAgICAgIHNlbGYuY3VycmVudFllYXJWaWV3LS07XG4gICAgICAgICAgICBzZWxmLmN1cnJlbnRNb250aFZpZXcgPSAxMTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzZWxmLmN1cnJlbnRNb250aFZpZXcgPiAxMSkge1xuICAgICAgICAgICAgc2VsZi5jdXJyZW50WWVhclZpZXcrKztcbiAgICAgICAgICAgIHNlbGYuY3VycmVudE1vbnRoVmlldyA9IDA7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZG9jdW1lbnRDbGljayA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgcGFyZW50O1xuICAgICAgICBpZiAoZXZlbnQudGFyZ2V0ICE9PSBzZWxmLmVsZW1lbnQgJiYgZXZlbnQudGFyZ2V0ICE9PSB3cmFwcGVyRWxlbWVudCkge1xuICAgICAgICAgICAgcGFyZW50ID0gZXZlbnQudGFyZ2V0LnBhcmVudE5vZGU7XG4gICAgICAgICAgICBpZiAocGFyZW50ICE9PSB3cmFwcGVyRWxlbWVudCkge1xuICAgICAgICAgICAgICAgIHdoaWxlIChwYXJlbnQgIT09IHdyYXBwZXJFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnROb2RlO1xuICAgICAgICAgICAgICAgICAgICBpZiAocGFyZW50ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgY2FsZW5kYXJDbGljayA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0LFxuICAgICAgICAgICAgdGFyZ2V0Q2xhc3MgPSB0YXJnZXQuY2xhc3NOYW1lLFxuICAgICAgICAgICAgY3VycmVudFRpbWVzdGFtcDtcblxuICAgICAgICBpZiAodGFyZ2V0Q2xhc3MpIHtcbiAgICAgICAgICAgIGlmICh0YXJnZXRDbGFzcyA9PT0gJ2RhdGVwaWNrci1wcmV2LW1vbnRoJyB8fCB0YXJnZXRDbGFzcyA9PT0gJ2RhdGVwaWNrci1uZXh0LW1vbnRoJykge1xuICAgICAgICAgICAgICAgIGlmICh0YXJnZXRDbGFzcyA9PT0gJ2RhdGVwaWNrci1wcmV2LW1vbnRoJykge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmN1cnJlbnRNb250aFZpZXctLTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmN1cnJlbnRNb250aFZpZXcrKztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBoYW5kbGVZZWFyQ2hhbmdlKCk7XG4gICAgICAgICAgICAgICAgdXBkYXRlTmF2aWdhdGlvbkN1cnJlbnRNb250aCgpO1xuICAgICAgICAgICAgICAgIGJ1aWxkRGF5cygpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0YXJnZXRDbGFzcyA9PT0gJ2RhdGVwaWNrci1kYXknICYmICFzZWxmLmhhc0NsYXNzKHRhcmdldC5wYXJlbnROb2RlLCAnZGlzYWJsZWQnKSkge1xuICAgICAgICAgICAgICAgIHNlbGYuc2VsZWN0ZWREYXRlID0ge1xuICAgICAgICAgICAgICAgICAgICBkYXk6IHBhcnNlSW50KHRhcmdldC5pbm5lckhUTUwsIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgbW9udGg6IHNlbGYuY3VycmVudE1vbnRoVmlldyxcbiAgICAgICAgICAgICAgICAgICAgeWVhcjogc2VsZi5jdXJyZW50WWVhclZpZXdcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgY3VycmVudFRpbWVzdGFtcCA9IG5ldyBEYXRlKHNlbGYuY3VycmVudFllYXJWaWV3LCBzZWxmLmN1cnJlbnRNb250aFZpZXcsIHNlbGYuc2VsZWN0ZWREYXRlLmRheSkuZ2V0VGltZSgpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuY29uZmlnLmFsdElucHV0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLmNvbmZpZy5hbHRGb3JtYXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuY29uZmlnLmFsdElucHV0LnZhbHVlID0gZm9ybWF0RGF0ZShzZWxmLmNvbmZpZy5hbHRGb3JtYXQsIGN1cnJlbnRUaW1lc3RhbXApO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSSBkb24ndCBrbm93IHdoeSBzb21lb25lIHdvdWxkIHdhbnQgdG8gZG8gdGhpcy4uLiBidXQganVzdCBpbiBjYXNlP1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5jb25maWcuYWx0SW5wdXQudmFsdWUgPSBmb3JtYXREYXRlKHNlbGYuY29uZmlnLmRhdGVGb3JtYXQsIGN1cnJlbnRUaW1lc3RhbXApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LnZhbHVlID0gZm9ybWF0RGF0ZShzZWxmLmNvbmZpZy5kYXRlRm9ybWF0LCBjdXJyZW50VGltZXN0YW1wKTtcblxuICAgICAgICAgICAgICAgIGNsb3NlKCk7XG4gICAgICAgICAgICAgICAgYnVpbGREYXlzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgYnVpbGRDYWxlbmRhciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgYnVpbGRNb250aE5hdmlnYXRpb24oKTtcbiAgICAgICAgYnVpbGRXZWVrZGF5cygpO1xuICAgICAgICBidWlsZERheXMoKTtcblxuICAgICAgICBjYWxlbmRhci5hcHBlbmRDaGlsZChjYWxlbmRhckJvZHkpO1xuICAgICAgICBjYWxlbmRhckNvbnRhaW5lci5hcHBlbmRDaGlsZChjYWxlbmRhcik7XG5cbiAgICAgICAgd3JhcHBlckVsZW1lbnQuYXBwZW5kQ2hpbGQoY2FsZW5kYXJDb250YWluZXIpO1xuICAgIH07XG5cbiAgICBnZXRPcGVuRXZlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChzZWxmLmVsZW1lbnQubm9kZU5hbWUgPT09ICdJTlBVVCcpIHtcbiAgICAgICAgICAgIHJldHVybiAnZm9jdXMnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnY2xpY2snO1xuICAgIH07XG5cbiAgICBiaW5kID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLmFkZEV2ZW50TGlzdGVuZXIoc2VsZi5lbGVtZW50LCBnZXRPcGVuRXZlbnQoKSwgb3Blbik7XG4gICAgICAgIHNlbGYuYWRkRXZlbnRMaXN0ZW5lcihjYWxlbmRhckNvbnRhaW5lciwgJ2NsaWNrJywgY2FsZW5kYXJDbGljayk7XG4gICAgfTtcblxuICAgIG9wZW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlbGYuYWRkRXZlbnRMaXN0ZW5lcihkb2N1bWVudCwgJ2NsaWNrJywgZG9jdW1lbnRDbGljayk7XG4gICAgICAgIHNlbGYuYWRkQ2xhc3Mod3JhcHBlckVsZW1lbnQsICdvcGVuJyk7XG4gICAgfTtcblxuICAgIGNsb3NlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLnJlbW92ZUV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdjbGljaycsIGRvY3VtZW50Q2xpY2spO1xuICAgICAgICBzZWxmLnJlbW92ZUNsYXNzKHdyYXBwZXJFbGVtZW50LCAnb3BlbicpO1xuICAgIH07XG5cbiAgICBkZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcGFyZW50LFxuICAgICAgICAgICAgZWxlbWVudDtcblxuICAgICAgICBzZWxmLnJlbW92ZUV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdjbGljaycsIGRvY3VtZW50Q2xpY2spO1xuICAgICAgICBzZWxmLnJlbW92ZUV2ZW50TGlzdGVuZXIoc2VsZi5lbGVtZW50LCBnZXRPcGVuRXZlbnQoKSwgb3Blbik7XG5cbiAgICAgICAgcGFyZW50ID0gc2VsZi5lbGVtZW50LnBhcmVudE5vZGU7XG4gICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChjYWxlbmRhckNvbnRhaW5lcik7XG4gICAgICAgIGVsZW1lbnQgPSBwYXJlbnQucmVtb3ZlQ2hpbGQoc2VsZi5lbGVtZW50KTtcbiAgICAgICAgcGFyZW50LnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKGVsZW1lbnQsIHBhcmVudCk7XG4gICAgfTtcblxuICAgIGluaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjb25maWcsXG4gICAgICAgICAgICBwYXJzZWREYXRlO1xuXG4gICAgICAgIHNlbGYuY29uZmlnID0ge307XG4gICAgICAgIHNlbGYuZGVzdHJveSA9IGRlc3Ryb3k7XG5cbiAgICAgICAgZm9yIChjb25maWcgaW4gZGVmYXVsdENvbmZpZykge1xuICAgICAgICAgICAgc2VsZi5jb25maWdbY29uZmlnXSA9IGluc3RhbmNlQ29uZmlnW2NvbmZpZ10gfHwgZGVmYXVsdENvbmZpZ1tjb25maWddO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi5lbGVtZW50ID0gZWxlbWVudDtcblxuICAgICAgICBpZiAoc2VsZi5lbGVtZW50LnZhbHVlKSB7XG4gICAgICAgICAgICBwYXJzZWREYXRlID0gRGF0ZS5wYXJzZShzZWxmLmVsZW1lbnQudmFsdWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBhcnNlZERhdGUgJiYgIWlzTmFOKHBhcnNlZERhdGUpKSB7XG4gICAgICAgICAgICBwYXJzZWREYXRlID0gbmV3IERhdGUocGFyc2VkRGF0ZSk7XG4gICAgICAgICAgICBzZWxmLnNlbGVjdGVkRGF0ZSA9IHtcbiAgICAgICAgICAgICAgICBkYXk6IHBhcnNlZERhdGUuZ2V0RGF0ZSgpLFxuICAgICAgICAgICAgICAgIG1vbnRoOiBwYXJzZWREYXRlLmdldE1vbnRoKCksXG4gICAgICAgICAgICAgICAgeWVhcjogcGFyc2VkRGF0ZS5nZXRGdWxsWWVhcigpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgc2VsZi5jdXJyZW50WWVhclZpZXcgPSBzZWxmLnNlbGVjdGVkRGF0ZS55ZWFyO1xuICAgICAgICAgICAgc2VsZi5jdXJyZW50TW9udGhWaWV3ID0gc2VsZi5zZWxlY3RlZERhdGUubW9udGg7XG4gICAgICAgICAgICBzZWxmLmN1cnJlbnREYXlWaWV3ID0gc2VsZi5zZWxlY3RlZERhdGUuZGF5O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VsZi5zZWxlY3RlZERhdGUgPSBudWxsO1xuICAgICAgICAgICAgc2VsZi5jdXJyZW50WWVhclZpZXcgPSBkYXRlLmN1cnJlbnQueWVhcigpO1xuICAgICAgICAgICAgc2VsZi5jdXJyZW50TW9udGhWaWV3ID0gZGF0ZS5jdXJyZW50Lm1vbnRoLmludGVnZXIoKTtcbiAgICAgICAgICAgIHNlbGYuY3VycmVudERheVZpZXcgPSBkYXRlLmN1cnJlbnQuZGF5KCk7XG4gICAgICAgIH1cblxuICAgICAgICB3cmFwKCk7XG4gICAgICAgIGJ1aWxkQ2FsZW5kYXIoKTtcbiAgICAgICAgYmluZCgpO1xuICAgIH07XG5cbiAgICBpbml0KCk7XG5cbiAgICByZXR1cm4gc2VsZjtcbn07XG5cbmRhdGVwaWNrci5pbml0LnByb3RvdHlwZSA9IHtcbiAgICBoYXNDbGFzczogZnVuY3Rpb24gKGVsZW1lbnQsIGNsYXNzTmFtZSkgeyByZXR1cm4gZWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoY2xhc3NOYW1lKTsgfSxcbiAgICBhZGRDbGFzczogZnVuY3Rpb24gKGVsZW1lbnQsIGNsYXNzTmFtZSkgeyBlbGVtZW50LmNsYXNzTGlzdC5hZGQoY2xhc3NOYW1lKTsgfSxcbiAgICByZW1vdmVDbGFzczogZnVuY3Rpb24gKGVsZW1lbnQsIGNsYXNzTmFtZSkgeyBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoY2xhc3NOYW1lKTsgfSxcbiAgICBmb3JFYWNoOiBmdW5jdGlvbiAoaXRlbXMsIGNhbGxiYWNrKSB7IFtdLmZvckVhY2guY2FsbChpdGVtcywgY2FsbGJhY2spOyB9LFxuICAgIHF1ZXJ5U2VsZWN0b3JBbGw6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwuYmluZChkb2N1bWVudCksXG4gICAgaXNBcnJheTogQXJyYXkuaXNBcnJheSxcbiAgICBhZGRFdmVudExpc3RlbmVyOiBmdW5jdGlvbiAoZWxlbWVudCwgdHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpIHtcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyLCB1c2VDYXB0dXJlKTtcbiAgICB9LFxuICAgIHJlbW92ZUV2ZW50TGlzdGVuZXI6IGZ1bmN0aW9uIChlbGVtZW50LCB0eXBlLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSkge1xuICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpO1xuICAgIH0sXG4gICAgbDEwbjoge1xuICAgICAgICB3ZWVrZGF5czoge1xuICAgICAgICAgICAgc2hvcnRoYW5kOiBbJ1N1bicsICdNb24nLCAnVHVlJywgJ1dlZCcsICdUaHUnLCAnRnJpJywgJ1NhdCddLFxuICAgICAgICAgICAgbG9uZ2hhbmQ6IFsnU3VuZGF5JywgJ01vbmRheScsICdUdWVzZGF5JywgJ1dlZG5lc2RheScsICdUaHVyc2RheScsICdGcmlkYXknLCAnU2F0dXJkYXknXVxuICAgICAgICB9LFxuICAgICAgICBtb250aHM6IHtcbiAgICAgICAgICAgIHNob3J0aGFuZDogWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsICdPY3QnLCAnTm92JywgJ0RlYyddLFxuICAgICAgICAgICAgbG9uZ2hhbmQ6IFsnSmFudWFyeScsICdGZWJydWFyeScsICdNYXJjaCcsICdBcHJpbCcsICdNYXknLCAnSnVuZScsICdKdWx5JywgJ0F1Z3VzdCcsICdTZXB0ZW1iZXInLCAnT2N0b2JlcicsICdOb3ZlbWJlcicsICdEZWNlbWJlciddXG4gICAgICAgIH0sXG4gICAgICAgIGRheXNJbk1vbnRoOiBbMzEsIDI4LCAzMSwgMzAsIDMxLCAzMCwgMzEsIDMxLCAzMCwgMzEsIDMwLCAzMV0sXG4gICAgICAgIGZpcnN0RGF5T2ZXZWVrOiAwXG4gICAgfVxufTtcbiJdfQ==
