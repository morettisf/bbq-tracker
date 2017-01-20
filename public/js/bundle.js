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
    var stepHTML = "<div class='step-box'><div class='step-notes'><textarea placeholder='Write step here'></textarea></div><div class='complete'><input type='checkbox' name='step-complete'><input type='time' class='time' name='time' value='09:00'></div><div class='complete-notes'><textarea placeholder='Write notes here'></textarea><button type='button' class='remove-step'>Remove Step</button></div></div>"
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
},{}],3:[function(require,module,exports){
/*
    datepickr 3.0 - pick your date not your nose

    https://github.com/joshsalverda/datepickr

    Copyright © 2014 Josh Salverda <josh.salverda@gmail.com>
    This program is free software. It comes without any warranty, to
    the extent permitted by applicable law. You can redistribute it
    and/or modify it under the terms of the Do What The Fuck You Want
    To Public License, Version 2, as published by Sam Hocevar. See
    http://www.wtfpl.net/ for more details.
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

/**
 * @constructor
 */
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

    bind = function () {
        var openEvent = 'click';

        if (self.element.nodeName === 'INPUT') {
            openEvent = 'focus';
            self.addEventListener(self.element, 'blur', close, false);
        }

        self.addEventListener(self.element, openEvent, open, false);
        self.addEventListener(calendarContainer, 'mousedown', calendarClick, false);
    };

    open = function () {
        self.addEventListener(document, 'click', documentClick, false);
        self.addClass(wrapperElement, 'open');
    };

    close = function () {
        self.removeEventListener(document, 'click', documentClick, false);
        self.removeClass(wrapperElement, 'open');
    };

    destroy = function () {
        var parent,
            element;

        self.removeEventListener(document, 'click', documentClick, false);
        self.removeEventListener(self.element, 'focus', open, false);
        self.removeEventListener(self.element, 'blur', close, false);
        self.removeEventListener(self.element, 'click', open, false);

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQuanMiLCJwdWJsaWMvanMvYXBwLmpzIiwicHVibGljL2pzL2RhdGVwaWNrci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGFwcCA9IHJlcXVpcmUoJy4vcHVibGljL2pzL2FwcC5qcycpXG52YXIgZGF0ZXBpY2tyID0gcmVxdWlyZSgnLi9wdWJsaWMvanMvZGF0ZXBpY2tyLmpzJykiLCIndXNlIHN0cmljdCdcblxudmFyIGFkZFN0ZXBCdG4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWRkLXN0ZXAnKVxudmFyIGxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdvbCcpXG5cbmlmIChhZGRTdGVwQnRuKSB7XG4gIGFkZFN0ZXBCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpXG4gICAgdmFyIHN0ZXBIVE1MID0gXCI8ZGl2IGNsYXNzPSdzdGVwLWJveCc+PGRpdiBjbGFzcz0nc3RlcC1ub3Rlcyc+PHRleHRhcmVhIHBsYWNlaG9sZGVyPSdXcml0ZSBzdGVwIGhlcmUnPjwvdGV4dGFyZWE+PC9kaXY+PGRpdiBjbGFzcz0nY29tcGxldGUnPjxpbnB1dCB0eXBlPSdjaGVja2JveCcgbmFtZT0nc3RlcC1jb21wbGV0ZSc+PGlucHV0IHR5cGU9J3RpbWUnIGNsYXNzPSd0aW1lJyBuYW1lPSd0aW1lJyB2YWx1ZT0nMDk6MDAnPjwvZGl2PjxkaXYgY2xhc3M9J2NvbXBsZXRlLW5vdGVzJz48dGV4dGFyZWEgcGxhY2Vob2xkZXI9J1dyaXRlIG5vdGVzIGhlcmUnPjwvdGV4dGFyZWE+PGJ1dHRvbiB0eXBlPSdidXR0b24nIGNsYXNzPSdyZW1vdmUtc3RlcCc+UmVtb3ZlIFN0ZXA8L2J1dHRvbj48L2Rpdj48L2Rpdj5cIlxuICAgIGxpLmlubmVySFRNTCA9IHN0ZXBIVE1MXG5cbiAgICBsaXN0LmFwcGVuZENoaWxkKGxpKVxuXG4gIH0pXG5cbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3JlY2lwZS1saXN0IG9sJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuICAgIGlmIChldmVudC50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdyZW1vdmUtc3RlcCcpKSB7XG4gICAgICB2YXIgbGkgPSBldmVudC50YXJnZXQuY2xvc2VzdCgnbGknKVxuICAgICAgbGkucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChsaSlcbiAgICB9XG4gIH0pXG59XG5cbndpbmRvdy5vdXRwdXRVcGRhdGUgPSBmdW5jdGlvbiAodGVtcCkge1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjdGVtcC1zbGlkZXItb3V0cHV0JykudmFsdWUgPSB0ZW1wO1xufSIsIi8qXG4gICAgZGF0ZXBpY2tyIDMuMCAtIHBpY2sgeW91ciBkYXRlIG5vdCB5b3VyIG5vc2VcblxuICAgIGh0dHBzOi8vZ2l0aHViLmNvbS9qb3Noc2FsdmVyZGEvZGF0ZXBpY2tyXG5cbiAgICBDb3B5cmlnaHQgwqkgMjAxNCBKb3NoIFNhbHZlcmRhIDxqb3NoLnNhbHZlcmRhQGdtYWlsLmNvbT5cbiAgICBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZS4gSXQgY29tZXMgd2l0aG91dCBhbnkgd2FycmFudHksIHRvXG4gICAgdGhlIGV4dGVudCBwZXJtaXR0ZWQgYnkgYXBwbGljYWJsZSBsYXcuIFlvdSBjYW4gcmVkaXN0cmlidXRlIGl0XG4gICAgYW5kL29yIG1vZGlmeSBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIERvIFdoYXQgVGhlIEZ1Y2sgWW91IFdhbnRcbiAgICBUbyBQdWJsaWMgTGljZW5zZSwgVmVyc2lvbiAyLCBhcyBwdWJsaXNoZWQgYnkgU2FtIEhvY2V2YXIuIFNlZVxuICAgIGh0dHA6Ly93d3cud3RmcGwubmV0LyBmb3IgbW9yZSBkZXRhaWxzLlxuKi9cblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZ1bmN0aW9uKCkge1xuICBkYXRlcGlja3IoJyNkYXRlLXNlbGVjdCcpXG59KVxuXG52YXIgZGF0ZXBpY2tyID0gZnVuY3Rpb24gKHNlbGVjdG9yLCBjb25maWcpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgdmFyIGVsZW1lbnRzLFxuICAgICAgICBjcmVhdGVJbnN0YW5jZSxcbiAgICAgICAgaW5zdGFuY2VzID0gW10sXG4gICAgICAgIGk7XG5cbiAgICBkYXRlcGlja3IucHJvdG90eXBlID0gZGF0ZXBpY2tyLmluaXQucHJvdG90eXBlO1xuXG4gICAgY3JlYXRlSW5zdGFuY2UgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICBpZiAoZWxlbWVudC5fZGF0ZXBpY2tyKSB7XG4gICAgICAgICAgICBlbGVtZW50Ll9kYXRlcGlja3IuZGVzdHJveSgpO1xuICAgICAgICB9XG4gICAgICAgIGVsZW1lbnQuX2RhdGVwaWNrciA9IG5ldyBkYXRlcGlja3IuaW5pdChlbGVtZW50LCBjb25maWcpO1xuICAgICAgICByZXR1cm4gZWxlbWVudC5fZGF0ZXBpY2tyO1xuICAgIH07XG5cbiAgICBpZiAoc2VsZWN0b3Iubm9kZU5hbWUpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUluc3RhbmNlKHNlbGVjdG9yKTtcbiAgICB9XG5cbiAgICBlbGVtZW50cyA9IGRhdGVwaWNrci5wcm90b3R5cGUucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG5cbiAgICBpZiAoZWxlbWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVJbnN0YW5jZShlbGVtZW50c1swXSk7XG4gICAgfVxuXG4gICAgZm9yIChpID0gMDsgaSA8IGVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGluc3RhbmNlcy5wdXNoKGNyZWF0ZUluc3RhbmNlKGVsZW1lbnRzW2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBpbnN0YW5jZXM7XG59O1xuXG4vKipcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5kYXRlcGlja3IuaW5pdCA9IGZ1bmN0aW9uIChlbGVtZW50LCBpbnN0YW5jZUNvbmZpZykge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICAgIGRlZmF1bHRDb25maWcgPSB7XG4gICAgICAgICAgICBkYXRlRm9ybWF0OiAnRiBqLCBZJyxcbiAgICAgICAgICAgIGFsdEZvcm1hdDogbnVsbCxcbiAgICAgICAgICAgIGFsdElucHV0OiBudWxsLFxuICAgICAgICAgICAgbWluRGF0ZTogbnVsbCxcbiAgICAgICAgICAgIG1heERhdGU6IG51bGwsXG4gICAgICAgICAgICBzaG9ydGhhbmRDdXJyZW50TW9udGg6IGZhbHNlXG4gICAgICAgIH0sXG4gICAgICAgIGNhbGVuZGFyQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG4gICAgICAgIG5hdmlnYXRpb25DdXJyZW50TW9udGggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyksXG4gICAgICAgIGNhbGVuZGFyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGFibGUnKSxcbiAgICAgICAgY2FsZW5kYXJCb2R5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGJvZHknKSxcbiAgICAgICAgd3JhcHBlckVsZW1lbnQsXG4gICAgICAgIGN1cnJlbnREYXRlID0gbmV3IERhdGUoKSxcbiAgICAgICAgd3JhcCxcbiAgICAgICAgZGF0ZSxcbiAgICAgICAgZm9ybWF0RGF0ZSxcbiAgICAgICAgbW9udGhUb1N0cixcbiAgICAgICAgaXNTcGVjaWZpY0RheSxcbiAgICAgICAgYnVpbGRXZWVrZGF5cyxcbiAgICAgICAgYnVpbGREYXlzLFxuICAgICAgICB1cGRhdGVOYXZpZ2F0aW9uQ3VycmVudE1vbnRoLFxuICAgICAgICBidWlsZE1vbnRoTmF2aWdhdGlvbixcbiAgICAgICAgaGFuZGxlWWVhckNoYW5nZSxcbiAgICAgICAgZG9jdW1lbnRDbGljayxcbiAgICAgICAgY2FsZW5kYXJDbGljayxcbiAgICAgICAgYnVpbGRDYWxlbmRhcixcbiAgICAgICAgYmluZCxcbiAgICAgICAgb3BlbixcbiAgICAgICAgY2xvc2UsXG4gICAgICAgIGRlc3Ryb3ksXG4gICAgICAgIGluaXQ7XG5cbiAgICBjYWxlbmRhckNvbnRhaW5lci5jbGFzc05hbWUgPSAnZGF0ZXBpY2tyLWNhbGVuZGFyJztcbiAgICBuYXZpZ2F0aW9uQ3VycmVudE1vbnRoLmNsYXNzTmFtZSA9ICdkYXRlcGlja3ItY3VycmVudC1tb250aCc7XG4gICAgaW5zdGFuY2VDb25maWcgPSBpbnN0YW5jZUNvbmZpZyB8fCB7fTtcblxuICAgIHdyYXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHdyYXBwZXJFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHdyYXBwZXJFbGVtZW50LmNsYXNzTmFtZSA9ICdkYXRlcGlja3Itd3JhcHBlcic7XG4gICAgICAgIHNlbGYuZWxlbWVudC5wYXJlbnROb2RlLmluc2VydEJlZm9yZSh3cmFwcGVyRWxlbWVudCwgc2VsZi5lbGVtZW50KTtcbiAgICAgICAgd3JhcHBlckVsZW1lbnQuYXBwZW5kQ2hpbGQoc2VsZi5lbGVtZW50KTtcbiAgICB9O1xuXG4gICAgZGF0ZSA9IHtcbiAgICAgICAgY3VycmVudDoge1xuICAgICAgICAgICAgeWVhcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjdXJyZW50RGF0ZS5nZXRGdWxsWWVhcigpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1vbnRoOiB7XG4gICAgICAgICAgICAgICAgaW50ZWdlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY3VycmVudERhdGUuZ2V0TW9udGgoKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHN0cmluZzogZnVuY3Rpb24gKHNob3J0aGFuZCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbW9udGggPSBjdXJyZW50RGF0ZS5nZXRNb250aCgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbW9udGhUb1N0cihtb250aCwgc2hvcnRoYW5kKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGF5OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnREYXRlLmdldERhdGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgbW9udGg6IHtcbiAgICAgICAgICAgIHN0cmluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBtb250aFRvU3RyKHNlbGYuY3VycmVudE1vbnRoVmlldywgc2VsZi5jb25maWcuc2hvcnRoYW5kQ3VycmVudE1vbnRoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBudW1EYXlzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLy8gY2hlY2tzIHRvIHNlZSBpZiBmZWJydWFyeSBpcyBhIGxlYXAgeWVhciBvdGhlcndpc2UgcmV0dXJuIHRoZSByZXNwZWN0aXZlICMgb2YgZGF5c1xuICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLmN1cnJlbnRNb250aFZpZXcgPT09IDEgJiYgKCgoc2VsZi5jdXJyZW50WWVhclZpZXcgJSA0ID09PSAwKSAmJiAoc2VsZi5jdXJyZW50WWVhclZpZXcgJSAxMDAgIT09IDApKSB8fCAoc2VsZi5jdXJyZW50WWVhclZpZXcgJSA0MDAgPT09IDApKSA/IDI5IDogc2VsZi5sMTBuLmRheXNJbk1vbnRoW3NlbGYuY3VycmVudE1vbnRoVmlld107XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZm9ybWF0RGF0ZSA9IGZ1bmN0aW9uIChkYXRlRm9ybWF0LCBtaWxsaXNlY29uZHMpIHtcbiAgICAgICAgdmFyIGZvcm1hdHRlZERhdGUgPSAnJyxcbiAgICAgICAgICAgIGRhdGVPYmogPSBuZXcgRGF0ZShtaWxsaXNlY29uZHMpLFxuICAgICAgICAgICAgZm9ybWF0cyA9IHtcbiAgICAgICAgICAgICAgICBkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkYXkgPSBmb3JtYXRzLmooKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChkYXkgPCAxMCkgPyAnMCcgKyBkYXkgOiBkYXk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBEOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLmwxMG4ud2Vla2RheXMuc2hvcnRoYW5kW2Zvcm1hdHMudygpXTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGo6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRhdGVPYmouZ2V0RGF0ZSgpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgbDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5sMTBuLndlZWtkYXlzLmxvbmdoYW5kW2Zvcm1hdHMudygpXTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRhdGVPYmouZ2V0RGF5KCk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBGOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtb250aFRvU3RyKGZvcm1hdHMubigpIC0gMSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgbTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbW9udGggPSBmb3JtYXRzLm4oKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChtb250aCA8IDEwKSA/ICcwJyArIG1vbnRoIDogbW9udGg7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBNOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtb250aFRvU3RyKGZvcm1hdHMubigpIC0gMSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBuOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkYXRlT2JqLmdldE1vbnRoKCkgKyAxO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgVTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGF0ZU9iai5nZXRUaW1lKCkgLyAxMDAwO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgeTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gU3RyaW5nKGZvcm1hdHMuWSgpKS5zdWJzdHJpbmcoMik7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBZOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkYXRlT2JqLmdldEZ1bGxZZWFyKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZvcm1hdFBpZWNlcyA9IGRhdGVGb3JtYXQuc3BsaXQoJycpO1xuXG4gICAgICAgIHNlbGYuZm9yRWFjaChmb3JtYXRQaWVjZXMsIGZ1bmN0aW9uIChmb3JtYXRQaWVjZSwgaW5kZXgpIHtcbiAgICAgICAgICAgIGlmIChmb3JtYXRzW2Zvcm1hdFBpZWNlXSAmJiBmb3JtYXRQaWVjZXNbaW5kZXggLSAxXSAhPT0gJ1xcXFwnKSB7XG4gICAgICAgICAgICAgICAgZm9ybWF0dGVkRGF0ZSArPSBmb3JtYXRzW2Zvcm1hdFBpZWNlXSgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoZm9ybWF0UGllY2UgIT09ICdcXFxcJykge1xuICAgICAgICAgICAgICAgICAgICBmb3JtYXR0ZWREYXRlICs9IGZvcm1hdFBpZWNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGZvcm1hdHRlZERhdGU7XG4gICAgfTtcblxuICAgIG1vbnRoVG9TdHIgPSBmdW5jdGlvbiAoZGF0ZSwgc2hvcnRoYW5kKSB7XG4gICAgICAgIGlmIChzaG9ydGhhbmQgPT09IHRydWUpIHtcbiAgICAgICAgICAgIHJldHVybiBzZWxmLmwxMG4ubW9udGhzLnNob3J0aGFuZFtkYXRlXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzZWxmLmwxMG4ubW9udGhzLmxvbmdoYW5kW2RhdGVdO1xuICAgIH07XG5cbiAgICBpc1NwZWNpZmljRGF5ID0gZnVuY3Rpb24gKGRheSwgbW9udGgsIHllYXIsIGNvbXBhcmlzb24pIHtcbiAgICAgICAgcmV0dXJuIGRheSA9PT0gY29tcGFyaXNvbiAmJiBzZWxmLmN1cnJlbnRNb250aFZpZXcgPT09IG1vbnRoICYmIHNlbGYuY3VycmVudFllYXJWaWV3ID09PSB5ZWFyO1xuICAgIH07XG5cbiAgICBidWlsZFdlZWtkYXlzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgd2Vla2RheUNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RoZWFkJyksXG4gICAgICAgICAgICBmaXJzdERheU9mV2VlayA9IHNlbGYubDEwbi5maXJzdERheU9mV2VlayxcbiAgICAgICAgICAgIHdlZWtkYXlzID0gc2VsZi5sMTBuLndlZWtkYXlzLnNob3J0aGFuZDtcblxuICAgICAgICBpZiAoZmlyc3REYXlPZldlZWsgPiAwICYmIGZpcnN0RGF5T2ZXZWVrIDwgd2Vla2RheXMubGVuZ3RoKSB7XG4gICAgICAgICAgICB3ZWVrZGF5cyA9IFtdLmNvbmNhdCh3ZWVrZGF5cy5zcGxpY2UoZmlyc3REYXlPZldlZWssIHdlZWtkYXlzLmxlbmd0aCksIHdlZWtkYXlzLnNwbGljZSgwLCBmaXJzdERheU9mV2VlaykpO1xuICAgICAgICB9XG5cbiAgICAgICAgd2Vla2RheUNvbnRhaW5lci5pbm5lckhUTUwgPSAnPHRyPjx0aD4nICsgd2Vla2RheXMuam9pbignPC90aD48dGg+JykgKyAnPC90aD48L3RyPic7XG4gICAgICAgIGNhbGVuZGFyLmFwcGVuZENoaWxkKHdlZWtkYXlDb250YWluZXIpO1xuICAgIH07XG5cbiAgICBidWlsZERheXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBmaXJzdE9mTW9udGggPSBuZXcgRGF0ZShzZWxmLmN1cnJlbnRZZWFyVmlldywgc2VsZi5jdXJyZW50TW9udGhWaWV3LCAxKS5nZXREYXkoKSxcbiAgICAgICAgICAgIG51bURheXMgPSBkYXRlLm1vbnRoLm51bURheXMoKSxcbiAgICAgICAgICAgIGNhbGVuZGFyRnJhZ21lbnQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCksXG4gICAgICAgICAgICByb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0cicpLFxuICAgICAgICAgICAgZGF5Q291bnQsXG4gICAgICAgICAgICBkYXlOdW1iZXIsXG4gICAgICAgICAgICB0b2RheSA9ICcnLFxuICAgICAgICAgICAgc2VsZWN0ZWQgPSAnJyxcbiAgICAgICAgICAgIGRpc2FibGVkID0gJycsXG4gICAgICAgICAgICBjdXJyZW50VGltZXN0YW1wO1xuXG4gICAgICAgIC8vIE9mZnNldCB0aGUgZmlyc3QgZGF5IGJ5IHRoZSBzcGVjaWZpZWQgYW1vdW50XG4gICAgICAgIGZpcnN0T2ZNb250aCAtPSBzZWxmLmwxMG4uZmlyc3REYXlPZldlZWs7XG4gICAgICAgIGlmIChmaXJzdE9mTW9udGggPCAwKSB7XG4gICAgICAgICAgICBmaXJzdE9mTW9udGggKz0gNztcbiAgICAgICAgfVxuXG4gICAgICAgIGRheUNvdW50ID0gZmlyc3RPZk1vbnRoO1xuICAgICAgICBjYWxlbmRhckJvZHkuaW5uZXJIVE1MID0gJyc7XG5cbiAgICAgICAgLy8gQWRkIHNwYWNlciB0byBsaW5lIHVwIHRoZSBmaXJzdCBkYXkgb2YgdGhlIG1vbnRoIGNvcnJlY3RseVxuICAgICAgICBpZiAoZmlyc3RPZk1vbnRoID4gMCkge1xuICAgICAgICAgICAgcm93LmlubmVySFRNTCArPSAnPHRkIGNvbHNwYW49XCInICsgZmlyc3RPZk1vbnRoICsgJ1wiPiZuYnNwOzwvdGQ+JztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFN0YXJ0IGF0IDEgc2luY2UgdGhlcmUgaXMgbm8gMHRoIGRheVxuICAgICAgICBmb3IgKGRheU51bWJlciA9IDE7IGRheU51bWJlciA8PSBudW1EYXlzOyBkYXlOdW1iZXIrKykge1xuICAgICAgICAgICAgLy8gaWYgd2UgaGF2ZSByZWFjaGVkIHRoZSBlbmQgb2YgYSB3ZWVrLCB3cmFwIHRvIHRoZSBuZXh0IGxpbmVcbiAgICAgICAgICAgIGlmIChkYXlDb3VudCA9PT0gNykge1xuICAgICAgICAgICAgICAgIGNhbGVuZGFyRnJhZ21lbnQuYXBwZW5kQ2hpbGQocm93KTtcbiAgICAgICAgICAgICAgICByb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0cicpO1xuICAgICAgICAgICAgICAgIGRheUNvdW50ID0gMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdG9kYXkgPSBpc1NwZWNpZmljRGF5KGRhdGUuY3VycmVudC5kYXkoKSwgZGF0ZS5jdXJyZW50Lm1vbnRoLmludGVnZXIoKSwgZGF0ZS5jdXJyZW50LnllYXIoKSwgZGF5TnVtYmVyKSA/ICcgdG9kYXknIDogJyc7XG4gICAgICAgICAgICBpZiAoc2VsZi5zZWxlY3RlZERhdGUpIHtcbiAgICAgICAgICAgICAgICBzZWxlY3RlZCA9IGlzU3BlY2lmaWNEYXkoc2VsZi5zZWxlY3RlZERhdGUuZGF5LCBzZWxmLnNlbGVjdGVkRGF0ZS5tb250aCwgc2VsZi5zZWxlY3RlZERhdGUueWVhciwgZGF5TnVtYmVyKSA/ICcgc2VsZWN0ZWQnIDogJyc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzZWxmLmNvbmZpZy5taW5EYXRlIHx8IHNlbGYuY29uZmlnLm1heERhdGUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50VGltZXN0YW1wID0gbmV3IERhdGUoc2VsZi5jdXJyZW50WWVhclZpZXcsIHNlbGYuY3VycmVudE1vbnRoVmlldywgZGF5TnVtYmVyKS5nZXRUaW1lKCk7XG4gICAgICAgICAgICAgICAgZGlzYWJsZWQgPSAnJztcblxuICAgICAgICAgICAgICAgIGlmIChzZWxmLmNvbmZpZy5taW5EYXRlICYmIGN1cnJlbnRUaW1lc3RhbXAgPCBzZWxmLmNvbmZpZy5taW5EYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIGRpc2FibGVkID0gJyBkaXNhYmxlZCc7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuY29uZmlnLm1heERhdGUgJiYgY3VycmVudFRpbWVzdGFtcCA+IHNlbGYuY29uZmlnLm1heERhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQgPSAnIGRpc2FibGVkJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJvdy5pbm5lckhUTUwgKz0gJzx0ZCBjbGFzcz1cIicgKyB0b2RheSArIHNlbGVjdGVkICsgZGlzYWJsZWQgKyAnXCI+PHNwYW4gY2xhc3M9XCJkYXRlcGlja3ItZGF5XCI+JyArIGRheU51bWJlciArICc8L3NwYW4+PC90ZD4nO1xuICAgICAgICAgICAgZGF5Q291bnQrKztcbiAgICAgICAgfVxuXG4gICAgICAgIGNhbGVuZGFyRnJhZ21lbnQuYXBwZW5kQ2hpbGQocm93KTtcbiAgICAgICAgY2FsZW5kYXJCb2R5LmFwcGVuZENoaWxkKGNhbGVuZGFyRnJhZ21lbnQpO1xuICAgIH07XG5cbiAgICB1cGRhdGVOYXZpZ2F0aW9uQ3VycmVudE1vbnRoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBuYXZpZ2F0aW9uQ3VycmVudE1vbnRoLmlubmVySFRNTCA9IGRhdGUubW9udGguc3RyaW5nKCkgKyAnICcgKyBzZWxmLmN1cnJlbnRZZWFyVmlldztcbiAgICB9O1xuXG4gICAgYnVpbGRNb250aE5hdmlnYXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBtb250aHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcbiAgICAgICAgICAgIG1vbnRoTmF2aWdhdGlvbjtcblxuICAgICAgICBtb250aE5hdmlnYXRpb24gID0gJzxzcGFuIGNsYXNzPVwiZGF0ZXBpY2tyLXByZXYtbW9udGhcIj4mbHQ7PC9zcGFuPic7XG4gICAgICAgIG1vbnRoTmF2aWdhdGlvbiArPSAnPHNwYW4gY2xhc3M9XCJkYXRlcGlja3ItbmV4dC1tb250aFwiPiZndDs8L3NwYW4+JztcblxuICAgICAgICBtb250aHMuY2xhc3NOYW1lID0gJ2RhdGVwaWNrci1tb250aHMnO1xuICAgICAgICBtb250aHMuaW5uZXJIVE1MID0gbW9udGhOYXZpZ2F0aW9uO1xuXG4gICAgICAgIG1vbnRocy5hcHBlbmRDaGlsZChuYXZpZ2F0aW9uQ3VycmVudE1vbnRoKTtcbiAgICAgICAgdXBkYXRlTmF2aWdhdGlvbkN1cnJlbnRNb250aCgpO1xuICAgICAgICBjYWxlbmRhckNvbnRhaW5lci5hcHBlbmRDaGlsZChtb250aHMpO1xuICAgIH07XG5cbiAgICBoYW5kbGVZZWFyQ2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoc2VsZi5jdXJyZW50TW9udGhWaWV3IDwgMCkge1xuICAgICAgICAgICAgc2VsZi5jdXJyZW50WWVhclZpZXctLTtcbiAgICAgICAgICAgIHNlbGYuY3VycmVudE1vbnRoVmlldyA9IDExO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNlbGYuY3VycmVudE1vbnRoVmlldyA+IDExKSB7XG4gICAgICAgICAgICBzZWxmLmN1cnJlbnRZZWFyVmlldysrO1xuICAgICAgICAgICAgc2VsZi5jdXJyZW50TW9udGhWaWV3ID0gMDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBkb2N1bWVudENsaWNrID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciBwYXJlbnQ7XG4gICAgICAgIGlmIChldmVudC50YXJnZXQgIT09IHNlbGYuZWxlbWVudCAmJiBldmVudC50YXJnZXQgIT09IHdyYXBwZXJFbGVtZW50KSB7XG4gICAgICAgICAgICBwYXJlbnQgPSBldmVudC50YXJnZXQucGFyZW50Tm9kZTtcbiAgICAgICAgICAgIGlmIChwYXJlbnQgIT09IHdyYXBwZXJFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgd2hpbGUgKHBhcmVudCAhPT0gd3JhcHBlckVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50ID0gcGFyZW50LnBhcmVudE5vZGU7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXJlbnQgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBjYWxlbmRhckNsaWNrID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciB0YXJnZXQgPSBldmVudC50YXJnZXQsXG4gICAgICAgICAgICB0YXJnZXRDbGFzcyA9IHRhcmdldC5jbGFzc05hbWUsXG4gICAgICAgICAgICBjdXJyZW50VGltZXN0YW1wO1xuXG4gICAgICAgIGlmICh0YXJnZXRDbGFzcykge1xuICAgICAgICAgICAgaWYgKHRhcmdldENsYXNzID09PSAnZGF0ZXBpY2tyLXByZXYtbW9udGgnIHx8IHRhcmdldENsYXNzID09PSAnZGF0ZXBpY2tyLW5leHQtbW9udGgnKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRhcmdldENsYXNzID09PSAnZGF0ZXBpY2tyLXByZXYtbW9udGgnKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuY3VycmVudE1vbnRoVmlldy0tO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuY3VycmVudE1vbnRoVmlldysrO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGhhbmRsZVllYXJDaGFuZ2UoKTtcbiAgICAgICAgICAgICAgICB1cGRhdGVOYXZpZ2F0aW9uQ3VycmVudE1vbnRoKCk7XG4gICAgICAgICAgICAgICAgYnVpbGREYXlzKCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRhcmdldENsYXNzID09PSAnZGF0ZXBpY2tyLWRheScgJiYgIXNlbGYuaGFzQ2xhc3ModGFyZ2V0LnBhcmVudE5vZGUsICdkaXNhYmxlZCcpKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5zZWxlY3RlZERhdGUgPSB7XG4gICAgICAgICAgICAgICAgICAgIGRheTogcGFyc2VJbnQodGFyZ2V0LmlubmVySFRNTCwgMTApLFxuICAgICAgICAgICAgICAgICAgICBtb250aDogc2VsZi5jdXJyZW50TW9udGhWaWV3LFxuICAgICAgICAgICAgICAgICAgICB5ZWFyOiBzZWxmLmN1cnJlbnRZZWFyVmlld1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBjdXJyZW50VGltZXN0YW1wID0gbmV3IERhdGUoc2VsZi5jdXJyZW50WWVhclZpZXcsIHNlbGYuY3VycmVudE1vbnRoVmlldywgc2VsZi5zZWxlY3RlZERhdGUuZGF5KS5nZXRUaW1lKCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoc2VsZi5jb25maWcuYWx0SW5wdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYuY29uZmlnLmFsdEZvcm1hdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5jb25maWcuYWx0SW5wdXQudmFsdWUgPSBmb3JtYXREYXRlKHNlbGYuY29uZmlnLmFsdEZvcm1hdCwgY3VycmVudFRpbWVzdGFtcCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJIGRvbid0IGtub3cgd2h5IHNvbWVvbmUgd291bGQgd2FudCB0byBkbyB0aGlzLi4uIGJ1dCBqdXN0IGluIGNhc2U/XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmNvbmZpZy5hbHRJbnB1dC52YWx1ZSA9IGZvcm1hdERhdGUoc2VsZi5jb25maWcuZGF0ZUZvcm1hdCwgY3VycmVudFRpbWVzdGFtcCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQudmFsdWUgPSBmb3JtYXREYXRlKHNlbGYuY29uZmlnLmRhdGVGb3JtYXQsIGN1cnJlbnRUaW1lc3RhbXApO1xuXG4gICAgICAgICAgICAgICAgY2xvc2UoKTtcbiAgICAgICAgICAgICAgICBidWlsZERheXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBidWlsZENhbGVuZGFyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBidWlsZE1vbnRoTmF2aWdhdGlvbigpO1xuICAgICAgICBidWlsZFdlZWtkYXlzKCk7XG4gICAgICAgIGJ1aWxkRGF5cygpO1xuXG4gICAgICAgIGNhbGVuZGFyLmFwcGVuZENoaWxkKGNhbGVuZGFyQm9keSk7XG4gICAgICAgIGNhbGVuZGFyQ29udGFpbmVyLmFwcGVuZENoaWxkKGNhbGVuZGFyKTtcblxuICAgICAgICB3cmFwcGVyRWxlbWVudC5hcHBlbmRDaGlsZChjYWxlbmRhckNvbnRhaW5lcik7XG4gICAgfTtcblxuICAgIGJpbmQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvcGVuRXZlbnQgPSAnY2xpY2snO1xuXG4gICAgICAgIGlmIChzZWxmLmVsZW1lbnQubm9kZU5hbWUgPT09ICdJTlBVVCcpIHtcbiAgICAgICAgICAgIG9wZW5FdmVudCA9ICdmb2N1cyc7XG4gICAgICAgICAgICBzZWxmLmFkZEV2ZW50TGlzdGVuZXIoc2VsZi5lbGVtZW50LCAnYmx1cicsIGNsb3NlLCBmYWxzZSk7XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLmFkZEV2ZW50TGlzdGVuZXIoc2VsZi5lbGVtZW50LCBvcGVuRXZlbnQsIG9wZW4sIGZhbHNlKTtcbiAgICAgICAgc2VsZi5hZGRFdmVudExpc3RlbmVyKGNhbGVuZGFyQ29udGFpbmVyLCAnbW91c2Vkb3duJywgY2FsZW5kYXJDbGljaywgZmFsc2UpO1xuICAgIH07XG5cbiAgICBvcGVuID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLmFkZEV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdjbGljaycsIGRvY3VtZW50Q2xpY2ssIGZhbHNlKTtcbiAgICAgICAgc2VsZi5hZGRDbGFzcyh3cmFwcGVyRWxlbWVudCwgJ29wZW4nKTtcbiAgICB9O1xuXG4gICAgY2xvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlbGYucmVtb3ZlRXZlbnRMaXN0ZW5lcihkb2N1bWVudCwgJ2NsaWNrJywgZG9jdW1lbnRDbGljaywgZmFsc2UpO1xuICAgICAgICBzZWxmLnJlbW92ZUNsYXNzKHdyYXBwZXJFbGVtZW50LCAnb3BlbicpO1xuICAgIH07XG5cbiAgICBkZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcGFyZW50LFxuICAgICAgICAgICAgZWxlbWVudDtcblxuICAgICAgICBzZWxmLnJlbW92ZUV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdjbGljaycsIGRvY3VtZW50Q2xpY2ssIGZhbHNlKTtcbiAgICAgICAgc2VsZi5yZW1vdmVFdmVudExpc3RlbmVyKHNlbGYuZWxlbWVudCwgJ2ZvY3VzJywgb3BlbiwgZmFsc2UpO1xuICAgICAgICBzZWxmLnJlbW92ZUV2ZW50TGlzdGVuZXIoc2VsZi5lbGVtZW50LCAnYmx1cicsIGNsb3NlLCBmYWxzZSk7XG4gICAgICAgIHNlbGYucmVtb3ZlRXZlbnRMaXN0ZW5lcihzZWxmLmVsZW1lbnQsICdjbGljaycsIG9wZW4sIGZhbHNlKTtcblxuICAgICAgICBwYXJlbnQgPSBzZWxmLmVsZW1lbnQucGFyZW50Tm9kZTtcbiAgICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKGNhbGVuZGFyQ29udGFpbmVyKTtcbiAgICAgICAgZWxlbWVudCA9IHBhcmVudC5yZW1vdmVDaGlsZChzZWxmLmVsZW1lbnQpO1xuICAgICAgICBwYXJlbnQucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoZWxlbWVudCwgcGFyZW50KTtcbiAgICB9O1xuXG4gICAgaW5pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGNvbmZpZyxcbiAgICAgICAgICAgIHBhcnNlZERhdGU7XG5cbiAgICAgICAgc2VsZi5jb25maWcgPSB7fTtcbiAgICAgICAgc2VsZi5kZXN0cm95ID0gZGVzdHJveTtcblxuICAgICAgICBmb3IgKGNvbmZpZyBpbiBkZWZhdWx0Q29uZmlnKSB7XG4gICAgICAgICAgICBzZWxmLmNvbmZpZ1tjb25maWddID0gaW5zdGFuY2VDb25maWdbY29uZmlnXSB8fCBkZWZhdWx0Q29uZmlnW2NvbmZpZ107XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLmVsZW1lbnQgPSBlbGVtZW50O1xuXG4gICAgICAgIGlmIChzZWxmLmVsZW1lbnQudmFsdWUpIHtcbiAgICAgICAgICAgIHBhcnNlZERhdGUgPSBEYXRlLnBhcnNlKHNlbGYuZWxlbWVudC52YWx1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocGFyc2VkRGF0ZSAmJiAhaXNOYU4ocGFyc2VkRGF0ZSkpIHtcbiAgICAgICAgICAgIHBhcnNlZERhdGUgPSBuZXcgRGF0ZShwYXJzZWREYXRlKTtcbiAgICAgICAgICAgIHNlbGYuc2VsZWN0ZWREYXRlID0ge1xuICAgICAgICAgICAgICAgIGRheTogcGFyc2VkRGF0ZS5nZXREYXRlKCksXG4gICAgICAgICAgICAgICAgbW9udGg6IHBhcnNlZERhdGUuZ2V0TW9udGgoKSxcbiAgICAgICAgICAgICAgICB5ZWFyOiBwYXJzZWREYXRlLmdldEZ1bGxZZWFyKClcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBzZWxmLmN1cnJlbnRZZWFyVmlldyA9IHNlbGYuc2VsZWN0ZWREYXRlLnllYXI7XG4gICAgICAgICAgICBzZWxmLmN1cnJlbnRNb250aFZpZXcgPSBzZWxmLnNlbGVjdGVkRGF0ZS5tb250aDtcbiAgICAgICAgICAgIHNlbGYuY3VycmVudERheVZpZXcgPSBzZWxmLnNlbGVjdGVkRGF0ZS5kYXk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxmLnNlbGVjdGVkRGF0ZSA9IG51bGw7XG4gICAgICAgICAgICBzZWxmLmN1cnJlbnRZZWFyVmlldyA9IGRhdGUuY3VycmVudC55ZWFyKCk7XG4gICAgICAgICAgICBzZWxmLmN1cnJlbnRNb250aFZpZXcgPSBkYXRlLmN1cnJlbnQubW9udGguaW50ZWdlcigpO1xuICAgICAgICAgICAgc2VsZi5jdXJyZW50RGF5VmlldyA9IGRhdGUuY3VycmVudC5kYXkoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHdyYXAoKTtcbiAgICAgICAgYnVpbGRDYWxlbmRhcigpO1xuICAgICAgICBiaW5kKCk7XG4gICAgfTtcblxuICAgIGluaXQoKTtcblxuICAgIHJldHVybiBzZWxmO1xufTtcblxuZGF0ZXBpY2tyLmluaXQucHJvdG90eXBlID0ge1xuICAgIGhhc0NsYXNzOiBmdW5jdGlvbiAoZWxlbWVudCwgY2xhc3NOYW1lKSB7IHJldHVybiBlbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyhjbGFzc05hbWUpOyB9LFxuICAgIGFkZENsYXNzOiBmdW5jdGlvbiAoZWxlbWVudCwgY2xhc3NOYW1lKSB7IGVsZW1lbnQuY2xhc3NMaXN0LmFkZChjbGFzc05hbWUpOyB9LFxuICAgIHJlbW92ZUNsYXNzOiBmdW5jdGlvbiAoZWxlbWVudCwgY2xhc3NOYW1lKSB7IGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShjbGFzc05hbWUpOyB9LFxuICAgIGZvckVhY2g6IGZ1bmN0aW9uIChpdGVtcywgY2FsbGJhY2spIHsgW10uZm9yRWFjaC5jYWxsKGl0ZW1zLCBjYWxsYmFjayk7IH0sXG4gICAgcXVlcnlTZWxlY3RvckFsbDogZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbC5iaW5kKGRvY3VtZW50KSxcbiAgICBpc0FycmF5OiBBcnJheS5pc0FycmF5LFxuICAgIGFkZEV2ZW50TGlzdGVuZXI6IGZ1bmN0aW9uIChlbGVtZW50LCB0eXBlLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSkge1xuICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpO1xuICAgIH0sXG4gICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcjogZnVuY3Rpb24gKGVsZW1lbnQsIHR5cGUsIGxpc3RlbmVyLCB1c2VDYXB0dXJlKSB7XG4gICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSk7XG4gICAgfSxcbiAgICBsMTBuOiB7XG4gICAgICAgIHdlZWtkYXlzOiB7XG4gICAgICAgICAgICBzaG9ydGhhbmQ6IFsnU3VuJywgJ01vbicsICdUdWUnLCAnV2VkJywgJ1RodScsICdGcmknLCAnU2F0J10sXG4gICAgICAgICAgICBsb25naGFuZDogWydTdW5kYXknLCAnTW9uZGF5JywgJ1R1ZXNkYXknLCAnV2VkbmVzZGF5JywgJ1RodXJzZGF5JywgJ0ZyaWRheScsICdTYXR1cmRheSddXG4gICAgICAgIH0sXG4gICAgICAgIG1vbnRoczoge1xuICAgICAgICAgICAgc2hvcnRoYW5kOiBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJywgJ09jdCcsICdOb3YnLCAnRGVjJ10sXG4gICAgICAgICAgICBsb25naGFuZDogWydKYW51YXJ5JywgJ0ZlYnJ1YXJ5JywgJ01hcmNoJywgJ0FwcmlsJywgJ01heScsICdKdW5lJywgJ0p1bHknLCAnQXVndXN0JywgJ1NlcHRlbWJlcicsICdPY3RvYmVyJywgJ05vdmVtYmVyJywgJ0RlY2VtYmVyJ11cbiAgICAgICAgfSxcbiAgICAgICAgZGF5c0luTW9udGg6IFszMSwgMjgsIDMxLCAzMCwgMzEsIDMwLCAzMSwgMzEsIDMwLCAzMSwgMzAsIDMxXSxcbiAgICAgICAgZmlyc3REYXlPZldlZWs6IDBcbiAgICB9XG59O1xuIl19
