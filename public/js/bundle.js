(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var app = require('./public/js/app.js')
var datepickr = require('./public/js/datepickr.js')
},{"./public/js/app.js":2,"./public/js/datepickr.js":3}],2:[function(require,module,exports){
'use strict'



window.outputUpdate = function (temp) {
  document.querySelector('#temp-slider-output').value = temp;
}

var addStepBtn = document.querySelector('#add-step')
var list = document.querySelector('ol')


if (addStepBtn) {
  addStepBtn.addEventListener('click', function() {
    var li = document.createElement('li')
    var stepHTML = "<div class='step-box'><div class='step-notes'><textarea placeholder='Write step here'></textarea></div><div class='complete'><input type='checkbox' name='step-complete'><input type='time' class='time' name='time' value='09:00'></div><div class='complete-notes'><textarea placeholder='Write notes here'></textarea><button type='button' class='remove-step'>Remove Step</button></div></div>"
    li.innerHTML = stepHTML

    list.appendChild(li)

  // WORK ON THIS
    var remove = document.querySelector('.remove-step')
    remove.addEventListener('click', function(event) {
      this.parentNode.removeChild('li')
    })

    // $('.remove-step').on('click', function(event) {
    //   $(this).parents('li').remove()
    // })

  })

}

window.checkReg = function() {
  var email = document.querySelector('#reg-email').value
  var password = document.querySelector('#reg-pw').value
  var password2 = document.querySelector('#reg-pw2').value
 
  if (password === '') {
    alert('Supply a password')
    return false
  }

  if (password2 === '') {
    alert('Confirm your password')
    return false
  }

  if (password !== password2) {
    alert('Passwords do not match, try again')
    return false
  }

  if (email === '') {
    alert('Supply an email address')
    return false
  }

  if (email.indexOf(' ') !== -1) {
    alert('No spaces allowed in email address')
    return false
  }

  if (email.indexOf('@') < 0) {
    alert('Email does not contain @')
    return false
  }

}

window.checkSignIn = function() {
  var email = document.querySelector('#sign-email').value
  var password = document.querySelector('#sign-pw').value

  if (email.indexOf(' ') !== -1) {
    alert('No spaces allowed in email address')
    return false
  }

  if (email === '') {
    alert('Supply an email address')
    return false
  }

  if (email.indexOf('@') < 0) {
    alert('Email does not contain @')
    return false
  }

  if (password === '') {
    alert('Supply a password')
    return false
  }

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjbGllbnQuanMiLCJwdWJsaWMvanMvYXBwLmpzIiwicHVibGljL2pzL2RhdGVwaWNrci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgYXBwID0gcmVxdWlyZSgnLi9wdWJsaWMvanMvYXBwLmpzJylcbnZhciBkYXRlcGlja3IgPSByZXF1aXJlKCcuL3B1YmxpYy9qcy9kYXRlcGlja3IuanMnKSIsIid1c2Ugc3RyaWN0J1xuXG5cblxud2luZG93Lm91dHB1dFVwZGF0ZSA9IGZ1bmN0aW9uICh0ZW1wKSB7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyN0ZW1wLXNsaWRlci1vdXRwdXQnKS52YWx1ZSA9IHRlbXA7XG59XG5cbnZhciBhZGRTdGVwQnRuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FkZC1zdGVwJylcbnZhciBsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcignb2wnKVxuXG5cbmlmIChhZGRTdGVwQnRuKSB7XG4gIGFkZFN0ZXBCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpXG4gICAgdmFyIHN0ZXBIVE1MID0gXCI8ZGl2IGNsYXNzPSdzdGVwLWJveCc+PGRpdiBjbGFzcz0nc3RlcC1ub3Rlcyc+PHRleHRhcmVhIHBsYWNlaG9sZGVyPSdXcml0ZSBzdGVwIGhlcmUnPjwvdGV4dGFyZWE+PC9kaXY+PGRpdiBjbGFzcz0nY29tcGxldGUnPjxpbnB1dCB0eXBlPSdjaGVja2JveCcgbmFtZT0nc3RlcC1jb21wbGV0ZSc+PGlucHV0IHR5cGU9J3RpbWUnIGNsYXNzPSd0aW1lJyBuYW1lPSd0aW1lJyB2YWx1ZT0nMDk6MDAnPjwvZGl2PjxkaXYgY2xhc3M9J2NvbXBsZXRlLW5vdGVzJz48dGV4dGFyZWEgcGxhY2Vob2xkZXI9J1dyaXRlIG5vdGVzIGhlcmUnPjwvdGV4dGFyZWE+PGJ1dHRvbiB0eXBlPSdidXR0b24nIGNsYXNzPSdyZW1vdmUtc3RlcCc+UmVtb3ZlIFN0ZXA8L2J1dHRvbj48L2Rpdj48L2Rpdj5cIlxuICAgIGxpLmlubmVySFRNTCA9IHN0ZXBIVE1MXG5cbiAgICBsaXN0LmFwcGVuZENoaWxkKGxpKVxuXG4gIC8vIFdPUksgT04gVEhJU1xuICAgIHZhciByZW1vdmUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucmVtb3ZlLXN0ZXAnKVxuICAgIHJlbW92ZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICB0aGlzLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoJ2xpJylcbiAgICB9KVxuXG4gICAgLy8gJCgnLnJlbW92ZS1zdGVwJykub24oJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAvLyAgICQodGhpcykucGFyZW50cygnbGknKS5yZW1vdmUoKVxuICAgIC8vIH0pXG5cbiAgfSlcblxufVxuXG53aW5kb3cuY2hlY2tSZWcgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGVtYWlsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3JlZy1lbWFpbCcpLnZhbHVlXG4gIHZhciBwYXNzd29yZCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNyZWctcHcnKS52YWx1ZVxuICB2YXIgcGFzc3dvcmQyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3JlZy1wdzInKS52YWx1ZVxuIFxuICBpZiAocGFzc3dvcmQgPT09ICcnKSB7XG4gICAgYWxlcnQoJ1N1cHBseSBhIHBhc3N3b3JkJylcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIGlmIChwYXNzd29yZDIgPT09ICcnKSB7XG4gICAgYWxlcnQoJ0NvbmZpcm0geW91ciBwYXNzd29yZCcpXG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICBpZiAocGFzc3dvcmQgIT09IHBhc3N3b3JkMikge1xuICAgIGFsZXJ0KCdQYXNzd29yZHMgZG8gbm90IG1hdGNoLCB0cnkgYWdhaW4nKVxuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgaWYgKGVtYWlsID09PSAnJykge1xuICAgIGFsZXJ0KCdTdXBwbHkgYW4gZW1haWwgYWRkcmVzcycpXG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICBpZiAoZW1haWwuaW5kZXhPZignICcpICE9PSAtMSkge1xuICAgIGFsZXJ0KCdObyBzcGFjZXMgYWxsb3dlZCBpbiBlbWFpbCBhZGRyZXNzJylcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIGlmIChlbWFpbC5pbmRleE9mKCdAJykgPCAwKSB7XG4gICAgYWxlcnQoJ0VtYWlsIGRvZXMgbm90IGNvbnRhaW4gQCcpXG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxufVxuXG53aW5kb3cuY2hlY2tTaWduSW4gPSBmdW5jdGlvbigpIHtcbiAgdmFyIGVtYWlsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3NpZ24tZW1haWwnKS52YWx1ZVxuICB2YXIgcGFzc3dvcmQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2lnbi1wdycpLnZhbHVlXG5cbiAgaWYgKGVtYWlsLmluZGV4T2YoJyAnKSAhPT0gLTEpIHtcbiAgICBhbGVydCgnTm8gc3BhY2VzIGFsbG93ZWQgaW4gZW1haWwgYWRkcmVzcycpXG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICBpZiAoZW1haWwgPT09ICcnKSB7XG4gICAgYWxlcnQoJ1N1cHBseSBhbiBlbWFpbCBhZGRyZXNzJylcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIGlmIChlbWFpbC5pbmRleE9mKCdAJykgPCAwKSB7XG4gICAgYWxlcnQoJ0VtYWlsIGRvZXMgbm90IGNvbnRhaW4gQCcpXG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICBpZiAocGFzc3dvcmQgPT09ICcnKSB7XG4gICAgYWxlcnQoJ1N1cHBseSBhIHBhc3N3b3JkJylcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG59IiwiLypcbiAgICBkYXRlcGlja3IgMy4wIC0gcGljayB5b3VyIGRhdGUgbm90IHlvdXIgbm9zZVxuXG4gICAgaHR0cHM6Ly9naXRodWIuY29tL2pvc2hzYWx2ZXJkYS9kYXRlcGlja3JcblxuICAgIENvcHlyaWdodCDCqSAyMDE0IEpvc2ggU2FsdmVyZGEgPGpvc2guc2FsdmVyZGFAZ21haWwuY29tPlxuICAgIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlLiBJdCBjb21lcyB3aXRob3V0IGFueSB3YXJyYW50eSwgdG9cbiAgICB0aGUgZXh0ZW50IHBlcm1pdHRlZCBieSBhcHBsaWNhYmxlIGxhdy4gWW91IGNhbiByZWRpc3RyaWJ1dGUgaXRcbiAgICBhbmQvb3IgbW9kaWZ5IGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgRG8gV2hhdCBUaGUgRnVjayBZb3UgV2FudFxuICAgIFRvIFB1YmxpYyBMaWNlbnNlLCBWZXJzaW9uIDIsIGFzIHB1Ymxpc2hlZCBieSBTYW0gSG9jZXZhci4gU2VlXG4gICAgaHR0cDovL3d3dy53dGZwbC5uZXQvIGZvciBtb3JlIGRldGFpbHMuXG4qL1xuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZnVuY3Rpb24oKSB7XG4gIGRhdGVwaWNrcignI2RhdGUtc2VsZWN0Jylcbn0pXG5cbnZhciBkYXRlcGlja3IgPSBmdW5jdGlvbiAoc2VsZWN0b3IsIGNvbmZpZykge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICB2YXIgZWxlbWVudHMsXG4gICAgICAgIGNyZWF0ZUluc3RhbmNlLFxuICAgICAgICBpbnN0YW5jZXMgPSBbXSxcbiAgICAgICAgaTtcblxuICAgIGRhdGVwaWNrci5wcm90b3R5cGUgPSBkYXRlcGlja3IuaW5pdC5wcm90b3R5cGU7XG5cbiAgICBjcmVhdGVJbnN0YW5jZSA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgIGlmIChlbGVtZW50Ll9kYXRlcGlja3IpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuX2RhdGVwaWNrci5kZXN0cm95KCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxlbWVudC5fZGF0ZXBpY2tyID0gbmV3IGRhdGVwaWNrci5pbml0KGVsZW1lbnQsIGNvbmZpZyk7XG4gICAgICAgIHJldHVybiBlbGVtZW50Ll9kYXRlcGlja3I7XG4gICAgfTtcblxuICAgIGlmIChzZWxlY3Rvci5ub2RlTmFtZSkge1xuICAgICAgICByZXR1cm4gY3JlYXRlSW5zdGFuY2Uoc2VsZWN0b3IpO1xuICAgIH1cblxuICAgIGVsZW1lbnRzID0gZGF0ZXBpY2tyLnByb3RvdHlwZS5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcblxuICAgIGlmIChlbGVtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUluc3RhbmNlKGVsZW1lbnRzWzBdKTtcbiAgICB9XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgZWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaW5zdGFuY2VzLnB1c2goY3JlYXRlSW5zdGFuY2UoZWxlbWVudHNbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIGluc3RhbmNlcztcbn07XG5cbi8qKlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmRhdGVwaWNrci5pbml0ID0gZnVuY3Rpb24gKGVsZW1lbnQsIGluc3RhbmNlQ29uZmlnKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIHZhciBzZWxmID0gdGhpcyxcbiAgICAgICAgZGVmYXVsdENvbmZpZyA9IHtcbiAgICAgICAgICAgIGRhdGVGb3JtYXQ6ICdGIGosIFknLFxuICAgICAgICAgICAgYWx0Rm9ybWF0OiBudWxsLFxuICAgICAgICAgICAgYWx0SW5wdXQ6IG51bGwsXG4gICAgICAgICAgICBtaW5EYXRlOiBudWxsLFxuICAgICAgICAgICAgbWF4RGF0ZTogbnVsbCxcbiAgICAgICAgICAgIHNob3J0aGFuZEN1cnJlbnRNb250aDogZmFsc2VcbiAgICAgICAgfSxcbiAgICAgICAgY2FsZW5kYXJDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcbiAgICAgICAgbmF2aWdhdGlvbkN1cnJlbnRNb250aCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKSxcbiAgICAgICAgY2FsZW5kYXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0YWJsZScpLFxuICAgICAgICBjYWxlbmRhckJvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0Ym9keScpLFxuICAgICAgICB3cmFwcGVyRWxlbWVudCxcbiAgICAgICAgY3VycmVudERhdGUgPSBuZXcgRGF0ZSgpLFxuICAgICAgICB3cmFwLFxuICAgICAgICBkYXRlLFxuICAgICAgICBmb3JtYXREYXRlLFxuICAgICAgICBtb250aFRvU3RyLFxuICAgICAgICBpc1NwZWNpZmljRGF5LFxuICAgICAgICBidWlsZFdlZWtkYXlzLFxuICAgICAgICBidWlsZERheXMsXG4gICAgICAgIHVwZGF0ZU5hdmlnYXRpb25DdXJyZW50TW9udGgsXG4gICAgICAgIGJ1aWxkTW9udGhOYXZpZ2F0aW9uLFxuICAgICAgICBoYW5kbGVZZWFyQ2hhbmdlLFxuICAgICAgICBkb2N1bWVudENsaWNrLFxuICAgICAgICBjYWxlbmRhckNsaWNrLFxuICAgICAgICBidWlsZENhbGVuZGFyLFxuICAgICAgICBiaW5kLFxuICAgICAgICBvcGVuLFxuICAgICAgICBjbG9zZSxcbiAgICAgICAgZGVzdHJveSxcbiAgICAgICAgaW5pdDtcblxuICAgIGNhbGVuZGFyQ29udGFpbmVyLmNsYXNzTmFtZSA9ICdkYXRlcGlja3ItY2FsZW5kYXInO1xuICAgIG5hdmlnYXRpb25DdXJyZW50TW9udGguY2xhc3NOYW1lID0gJ2RhdGVwaWNrci1jdXJyZW50LW1vbnRoJztcbiAgICBpbnN0YW5jZUNvbmZpZyA9IGluc3RhbmNlQ29uZmlnIHx8IHt9O1xuXG4gICAgd3JhcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgd3JhcHBlckVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgd3JhcHBlckVsZW1lbnQuY2xhc3NOYW1lID0gJ2RhdGVwaWNrci13cmFwcGVyJztcbiAgICAgICAgc2VsZi5lbGVtZW50LnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKHdyYXBwZXJFbGVtZW50LCBzZWxmLmVsZW1lbnQpO1xuICAgICAgICB3cmFwcGVyRWxlbWVudC5hcHBlbmRDaGlsZChzZWxmLmVsZW1lbnQpO1xuICAgIH07XG5cbiAgICBkYXRlID0ge1xuICAgICAgICBjdXJyZW50OiB7XG4gICAgICAgICAgICB5ZWFyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnREYXRlLmdldEZ1bGxZZWFyKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbW9udGg6IHtcbiAgICAgICAgICAgICAgICBpbnRlZ2VyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjdXJyZW50RGF0ZS5nZXRNb250aCgpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc3RyaW5nOiBmdW5jdGlvbiAoc2hvcnRoYW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBtb250aCA9IGN1cnJlbnREYXRlLmdldE1vbnRoKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtb250aFRvU3RyKG1vbnRoLCBzaG9ydGhhbmQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkYXk6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY3VycmVudERhdGUuZ2V0RGF0ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBtb250aDoge1xuICAgICAgICAgICAgc3RyaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1vbnRoVG9TdHIoc2VsZi5jdXJyZW50TW9udGhWaWV3LCBzZWxmLmNvbmZpZy5zaG9ydGhhbmRDdXJyZW50TW9udGgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG51bURheXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyBjaGVja3MgdG8gc2VlIGlmIGZlYnJ1YXJ5IGlzIGEgbGVhcCB5ZWFyIG90aGVyd2lzZSByZXR1cm4gdGhlIHJlc3BlY3RpdmUgIyBvZiBkYXlzXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYuY3VycmVudE1vbnRoVmlldyA9PT0gMSAmJiAoKChzZWxmLmN1cnJlbnRZZWFyVmlldyAlIDQgPT09IDApICYmIChzZWxmLmN1cnJlbnRZZWFyVmlldyAlIDEwMCAhPT0gMCkpIHx8IChzZWxmLmN1cnJlbnRZZWFyVmlldyAlIDQwMCA9PT0gMCkpID8gMjkgOiBzZWxmLmwxMG4uZGF5c0luTW9udGhbc2VsZi5jdXJyZW50TW9udGhWaWV3XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBmb3JtYXREYXRlID0gZnVuY3Rpb24gKGRhdGVGb3JtYXQsIG1pbGxpc2Vjb25kcykge1xuICAgICAgICB2YXIgZm9ybWF0dGVkRGF0ZSA9ICcnLFxuICAgICAgICAgICAgZGF0ZU9iaiA9IG5ldyBEYXRlKG1pbGxpc2Vjb25kcyksXG4gICAgICAgICAgICBmb3JtYXRzID0ge1xuICAgICAgICAgICAgICAgIGQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRheSA9IGZvcm1hdHMuaigpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKGRheSA8IDEwKSA/ICcwJyArIGRheSA6IGRheTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIEQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYubDEwbi53ZWVrZGF5cy5zaG9ydGhhbmRbZm9ybWF0cy53KCldO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgajogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGF0ZU9iai5nZXREYXRlKCk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLmwxMG4ud2Vla2RheXMubG9uZ2hhbmRbZm9ybWF0cy53KCldO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGF0ZU9iai5nZXREYXkoKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIEY6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1vbnRoVG9TdHIoZm9ybWF0cy5uKCkgLSAxLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBtOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBtb250aCA9IGZvcm1hdHMubigpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKG1vbnRoIDwgMTApID8gJzAnICsgbW9udGggOiBtb250aDtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIE06IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1vbnRoVG9TdHIoZm9ybWF0cy5uKCkgLSAxLCB0cnVlKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG46IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRhdGVPYmouZ2V0TW9udGgoKSArIDE7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBVOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkYXRlT2JqLmdldFRpbWUoKSAvIDEwMDA7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB5OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBTdHJpbmcoZm9ybWF0cy5ZKCkpLnN1YnN0cmluZygyKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIFk6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRhdGVPYmouZ2V0RnVsbFllYXIoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZm9ybWF0UGllY2VzID0gZGF0ZUZvcm1hdC5zcGxpdCgnJyk7XG5cbiAgICAgICAgc2VsZi5mb3JFYWNoKGZvcm1hdFBpZWNlcywgZnVuY3Rpb24gKGZvcm1hdFBpZWNlLCBpbmRleCkge1xuICAgICAgICAgICAgaWYgKGZvcm1hdHNbZm9ybWF0UGllY2VdICYmIGZvcm1hdFBpZWNlc1tpbmRleCAtIDFdICE9PSAnXFxcXCcpIHtcbiAgICAgICAgICAgICAgICBmb3JtYXR0ZWREYXRlICs9IGZvcm1hdHNbZm9ybWF0UGllY2VdKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChmb3JtYXRQaWVjZSAhPT0gJ1xcXFwnKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvcm1hdHRlZERhdGUgKz0gZm9ybWF0UGllY2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gZm9ybWF0dGVkRGF0ZTtcbiAgICB9O1xuXG4gICAgbW9udGhUb1N0ciA9IGZ1bmN0aW9uIChkYXRlLCBzaG9ydGhhbmQpIHtcbiAgICAgICAgaWYgKHNob3J0aGFuZCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIHNlbGYubDEwbi5tb250aHMuc2hvcnRoYW5kW2RhdGVdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHNlbGYubDEwbi5tb250aHMubG9uZ2hhbmRbZGF0ZV07XG4gICAgfTtcblxuICAgIGlzU3BlY2lmaWNEYXkgPSBmdW5jdGlvbiAoZGF5LCBtb250aCwgeWVhciwgY29tcGFyaXNvbikge1xuICAgICAgICByZXR1cm4gZGF5ID09PSBjb21wYXJpc29uICYmIHNlbGYuY3VycmVudE1vbnRoVmlldyA9PT0gbW9udGggJiYgc2VsZi5jdXJyZW50WWVhclZpZXcgPT09IHllYXI7XG4gICAgfTtcblxuICAgIGJ1aWxkV2Vla2RheXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB3ZWVrZGF5Q29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGhlYWQnKSxcbiAgICAgICAgICAgIGZpcnN0RGF5T2ZXZWVrID0gc2VsZi5sMTBuLmZpcnN0RGF5T2ZXZWVrLFxuICAgICAgICAgICAgd2Vla2RheXMgPSBzZWxmLmwxMG4ud2Vla2RheXMuc2hvcnRoYW5kO1xuXG4gICAgICAgIGlmIChmaXJzdERheU9mV2VlayA+IDAgJiYgZmlyc3REYXlPZldlZWsgPCB3ZWVrZGF5cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHdlZWtkYXlzID0gW10uY29uY2F0KHdlZWtkYXlzLnNwbGljZShmaXJzdERheU9mV2Vlaywgd2Vla2RheXMubGVuZ3RoKSwgd2Vla2RheXMuc3BsaWNlKDAsIGZpcnN0RGF5T2ZXZWVrKSk7XG4gICAgICAgIH1cblxuICAgICAgICB3ZWVrZGF5Q29udGFpbmVyLmlubmVySFRNTCA9ICc8dHI+PHRoPicgKyB3ZWVrZGF5cy5qb2luKCc8L3RoPjx0aD4nKSArICc8L3RoPjwvdHI+JztcbiAgICAgICAgY2FsZW5kYXIuYXBwZW5kQ2hpbGQod2Vla2RheUNvbnRhaW5lcik7XG4gICAgfTtcblxuICAgIGJ1aWxkRGF5cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGZpcnN0T2ZNb250aCA9IG5ldyBEYXRlKHNlbGYuY3VycmVudFllYXJWaWV3LCBzZWxmLmN1cnJlbnRNb250aFZpZXcsIDEpLmdldERheSgpLFxuICAgICAgICAgICAgbnVtRGF5cyA9IGRhdGUubW9udGgubnVtRGF5cygpLFxuICAgICAgICAgICAgY2FsZW5kYXJGcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKSxcbiAgICAgICAgICAgIHJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RyJyksXG4gICAgICAgICAgICBkYXlDb3VudCxcbiAgICAgICAgICAgIGRheU51bWJlcixcbiAgICAgICAgICAgIHRvZGF5ID0gJycsXG4gICAgICAgICAgICBzZWxlY3RlZCA9ICcnLFxuICAgICAgICAgICAgZGlzYWJsZWQgPSAnJyxcbiAgICAgICAgICAgIGN1cnJlbnRUaW1lc3RhbXA7XG5cbiAgICAgICAgLy8gT2Zmc2V0IHRoZSBmaXJzdCBkYXkgYnkgdGhlIHNwZWNpZmllZCBhbW91bnRcbiAgICAgICAgZmlyc3RPZk1vbnRoIC09IHNlbGYubDEwbi5maXJzdERheU9mV2VlaztcbiAgICAgICAgaWYgKGZpcnN0T2ZNb250aCA8IDApIHtcbiAgICAgICAgICAgIGZpcnN0T2ZNb250aCArPSA3O1xuICAgICAgICB9XG5cbiAgICAgICAgZGF5Q291bnQgPSBmaXJzdE9mTW9udGg7XG4gICAgICAgIGNhbGVuZGFyQm9keS5pbm5lckhUTUwgPSAnJztcblxuICAgICAgICAvLyBBZGQgc3BhY2VyIHRvIGxpbmUgdXAgdGhlIGZpcnN0IGRheSBvZiB0aGUgbW9udGggY29ycmVjdGx5XG4gICAgICAgIGlmIChmaXJzdE9mTW9udGggPiAwKSB7XG4gICAgICAgICAgICByb3cuaW5uZXJIVE1MICs9ICc8dGQgY29sc3Bhbj1cIicgKyBmaXJzdE9mTW9udGggKyAnXCI+Jm5ic3A7PC90ZD4nO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU3RhcnQgYXQgMSBzaW5jZSB0aGVyZSBpcyBubyAwdGggZGF5XG4gICAgICAgIGZvciAoZGF5TnVtYmVyID0gMTsgZGF5TnVtYmVyIDw9IG51bURheXM7IGRheU51bWJlcisrKSB7XG4gICAgICAgICAgICAvLyBpZiB3ZSBoYXZlIHJlYWNoZWQgdGhlIGVuZCBvZiBhIHdlZWssIHdyYXAgdG8gdGhlIG5leHQgbGluZVxuICAgICAgICAgICAgaWYgKGRheUNvdW50ID09PSA3KSB7XG4gICAgICAgICAgICAgICAgY2FsZW5kYXJGcmFnbWVudC5hcHBlbmRDaGlsZChyb3cpO1xuICAgICAgICAgICAgICAgIHJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RyJyk7XG4gICAgICAgICAgICAgICAgZGF5Q291bnQgPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0b2RheSA9IGlzU3BlY2lmaWNEYXkoZGF0ZS5jdXJyZW50LmRheSgpLCBkYXRlLmN1cnJlbnQubW9udGguaW50ZWdlcigpLCBkYXRlLmN1cnJlbnQueWVhcigpLCBkYXlOdW1iZXIpID8gJyB0b2RheScgOiAnJztcbiAgICAgICAgICAgIGlmIChzZWxmLnNlbGVjdGVkRGF0ZSkge1xuICAgICAgICAgICAgICAgIHNlbGVjdGVkID0gaXNTcGVjaWZpY0RheShzZWxmLnNlbGVjdGVkRGF0ZS5kYXksIHNlbGYuc2VsZWN0ZWREYXRlLm1vbnRoLCBzZWxmLnNlbGVjdGVkRGF0ZS55ZWFyLCBkYXlOdW1iZXIpID8gJyBzZWxlY3RlZCcgOiAnJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHNlbGYuY29uZmlnLm1pbkRhdGUgfHwgc2VsZi5jb25maWcubWF4RGF0ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRUaW1lc3RhbXAgPSBuZXcgRGF0ZShzZWxmLmN1cnJlbnRZZWFyVmlldywgc2VsZi5jdXJyZW50TW9udGhWaWV3LCBkYXlOdW1iZXIpLmdldFRpbWUoKTtcbiAgICAgICAgICAgICAgICBkaXNhYmxlZCA9ICcnO1xuXG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuY29uZmlnLm1pbkRhdGUgJiYgY3VycmVudFRpbWVzdGFtcCA8IHNlbGYuY29uZmlnLm1pbkRhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQgPSAnIGRpc2FibGVkJztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoc2VsZi5jb25maWcubWF4RGF0ZSAmJiBjdXJyZW50VGltZXN0YW1wID4gc2VsZi5jb25maWcubWF4RGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZCA9ICcgZGlzYWJsZWQnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcm93LmlubmVySFRNTCArPSAnPHRkIGNsYXNzPVwiJyArIHRvZGF5ICsgc2VsZWN0ZWQgKyBkaXNhYmxlZCArICdcIj48c3BhbiBjbGFzcz1cImRhdGVwaWNrci1kYXlcIj4nICsgZGF5TnVtYmVyICsgJzwvc3Bhbj48L3RkPic7XG4gICAgICAgICAgICBkYXlDb3VudCsrO1xuICAgICAgICB9XG5cbiAgICAgICAgY2FsZW5kYXJGcmFnbWVudC5hcHBlbmRDaGlsZChyb3cpO1xuICAgICAgICBjYWxlbmRhckJvZHkuYXBwZW5kQ2hpbGQoY2FsZW5kYXJGcmFnbWVudCk7XG4gICAgfTtcblxuICAgIHVwZGF0ZU5hdmlnYXRpb25DdXJyZW50TW9udGggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG5hdmlnYXRpb25DdXJyZW50TW9udGguaW5uZXJIVE1MID0gZGF0ZS5tb250aC5zdHJpbmcoKSArICcgJyArIHNlbGYuY3VycmVudFllYXJWaWV3O1xuICAgIH07XG5cbiAgICBidWlsZE1vbnRoTmF2aWdhdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG1vbnRocyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuICAgICAgICAgICAgbW9udGhOYXZpZ2F0aW9uO1xuXG4gICAgICAgIG1vbnRoTmF2aWdhdGlvbiAgPSAnPHNwYW4gY2xhc3M9XCJkYXRlcGlja3ItcHJldi1tb250aFwiPiZsdDs8L3NwYW4+JztcbiAgICAgICAgbW9udGhOYXZpZ2F0aW9uICs9ICc8c3BhbiBjbGFzcz1cImRhdGVwaWNrci1uZXh0LW1vbnRoXCI+Jmd0Ozwvc3Bhbj4nO1xuXG4gICAgICAgIG1vbnRocy5jbGFzc05hbWUgPSAnZGF0ZXBpY2tyLW1vbnRocyc7XG4gICAgICAgIG1vbnRocy5pbm5lckhUTUwgPSBtb250aE5hdmlnYXRpb247XG5cbiAgICAgICAgbW9udGhzLmFwcGVuZENoaWxkKG5hdmlnYXRpb25DdXJyZW50TW9udGgpO1xuICAgICAgICB1cGRhdGVOYXZpZ2F0aW9uQ3VycmVudE1vbnRoKCk7XG4gICAgICAgIGNhbGVuZGFyQ29udGFpbmVyLmFwcGVuZENoaWxkKG1vbnRocyk7XG4gICAgfTtcblxuICAgIGhhbmRsZVllYXJDaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChzZWxmLmN1cnJlbnRNb250aFZpZXcgPCAwKSB7XG4gICAgICAgICAgICBzZWxmLmN1cnJlbnRZZWFyVmlldy0tO1xuICAgICAgICAgICAgc2VsZi5jdXJyZW50TW9udGhWaWV3ID0gMTE7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2VsZi5jdXJyZW50TW9udGhWaWV3ID4gMTEpIHtcbiAgICAgICAgICAgIHNlbGYuY3VycmVudFllYXJWaWV3Kys7XG4gICAgICAgICAgICBzZWxmLmN1cnJlbnRNb250aFZpZXcgPSAwO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGRvY3VtZW50Q2xpY2sgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIHBhcmVudDtcbiAgICAgICAgaWYgKGV2ZW50LnRhcmdldCAhPT0gc2VsZi5lbGVtZW50ICYmIGV2ZW50LnRhcmdldCAhPT0gd3JhcHBlckVsZW1lbnQpIHtcbiAgICAgICAgICAgIHBhcmVudCA9IGV2ZW50LnRhcmdldC5wYXJlbnROb2RlO1xuICAgICAgICAgICAgaWYgKHBhcmVudCAhPT0gd3JhcHBlckVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICB3aGlsZSAocGFyZW50ICE9PSB3cmFwcGVyRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50Tm9kZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhcmVudCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIGNhbGVuZGFyQ2xpY2sgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIHRhcmdldCA9IGV2ZW50LnRhcmdldCxcbiAgICAgICAgICAgIHRhcmdldENsYXNzID0gdGFyZ2V0LmNsYXNzTmFtZSxcbiAgICAgICAgICAgIGN1cnJlbnRUaW1lc3RhbXA7XG5cbiAgICAgICAgaWYgKHRhcmdldENsYXNzKSB7XG4gICAgICAgICAgICBpZiAodGFyZ2V0Q2xhc3MgPT09ICdkYXRlcGlja3ItcHJldi1tb250aCcgfHwgdGFyZ2V0Q2xhc3MgPT09ICdkYXRlcGlja3ItbmV4dC1tb250aCcpIHtcbiAgICAgICAgICAgICAgICBpZiAodGFyZ2V0Q2xhc3MgPT09ICdkYXRlcGlja3ItcHJldi1tb250aCcpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5jdXJyZW50TW9udGhWaWV3LS07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5jdXJyZW50TW9udGhWaWV3Kys7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaGFuZGxlWWVhckNoYW5nZSgpO1xuICAgICAgICAgICAgICAgIHVwZGF0ZU5hdmlnYXRpb25DdXJyZW50TW9udGgoKTtcbiAgICAgICAgICAgICAgICBidWlsZERheXMoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGFyZ2V0Q2xhc3MgPT09ICdkYXRlcGlja3ItZGF5JyAmJiAhc2VsZi5oYXNDbGFzcyh0YXJnZXQucGFyZW50Tm9kZSwgJ2Rpc2FibGVkJykpIHtcbiAgICAgICAgICAgICAgICBzZWxmLnNlbGVjdGVkRGF0ZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgZGF5OiBwYXJzZUludCh0YXJnZXQuaW5uZXJIVE1MLCAxMCksXG4gICAgICAgICAgICAgICAgICAgIG1vbnRoOiBzZWxmLmN1cnJlbnRNb250aFZpZXcsXG4gICAgICAgICAgICAgICAgICAgIHllYXI6IHNlbGYuY3VycmVudFllYXJWaWV3XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGN1cnJlbnRUaW1lc3RhbXAgPSBuZXcgRGF0ZShzZWxmLmN1cnJlbnRZZWFyVmlldywgc2VsZi5jdXJyZW50TW9udGhWaWV3LCBzZWxmLnNlbGVjdGVkRGF0ZS5kYXkpLmdldFRpbWUoKTtcblxuICAgICAgICAgICAgICAgIGlmIChzZWxmLmNvbmZpZy5hbHRJbnB1dCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5jb25maWcuYWx0Rm9ybWF0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmNvbmZpZy5hbHRJbnB1dC52YWx1ZSA9IGZvcm1hdERhdGUoc2VsZi5jb25maWcuYWx0Rm9ybWF0LCBjdXJyZW50VGltZXN0YW1wKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEkgZG9uJ3Qga25vdyB3aHkgc29tZW9uZSB3b3VsZCB3YW50IHRvIGRvIHRoaXMuLi4gYnV0IGp1c3QgaW4gY2FzZT9cbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuY29uZmlnLmFsdElucHV0LnZhbHVlID0gZm9ybWF0RGF0ZShzZWxmLmNvbmZpZy5kYXRlRm9ybWF0LCBjdXJyZW50VGltZXN0YW1wKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC52YWx1ZSA9IGZvcm1hdERhdGUoc2VsZi5jb25maWcuZGF0ZUZvcm1hdCwgY3VycmVudFRpbWVzdGFtcCk7XG5cbiAgICAgICAgICAgICAgICBjbG9zZSgpO1xuICAgICAgICAgICAgICAgIGJ1aWxkRGF5cygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIGJ1aWxkQ2FsZW5kYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGJ1aWxkTW9udGhOYXZpZ2F0aW9uKCk7XG4gICAgICAgIGJ1aWxkV2Vla2RheXMoKTtcbiAgICAgICAgYnVpbGREYXlzKCk7XG5cbiAgICAgICAgY2FsZW5kYXIuYXBwZW5kQ2hpbGQoY2FsZW5kYXJCb2R5KTtcbiAgICAgICAgY2FsZW5kYXJDb250YWluZXIuYXBwZW5kQ2hpbGQoY2FsZW5kYXIpO1xuXG4gICAgICAgIHdyYXBwZXJFbGVtZW50LmFwcGVuZENoaWxkKGNhbGVuZGFyQ29udGFpbmVyKTtcbiAgICB9O1xuXG4gICAgYmluZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG9wZW5FdmVudCA9ICdjbGljayc7XG5cbiAgICAgICAgaWYgKHNlbGYuZWxlbWVudC5ub2RlTmFtZSA9PT0gJ0lOUFVUJykge1xuICAgICAgICAgICAgb3BlbkV2ZW50ID0gJ2ZvY3VzJztcbiAgICAgICAgICAgIHNlbGYuYWRkRXZlbnRMaXN0ZW5lcihzZWxmLmVsZW1lbnQsICdibHVyJywgY2xvc2UsIGZhbHNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYuYWRkRXZlbnRMaXN0ZW5lcihzZWxmLmVsZW1lbnQsIG9wZW5FdmVudCwgb3BlbiwgZmFsc2UpO1xuICAgICAgICBzZWxmLmFkZEV2ZW50TGlzdGVuZXIoY2FsZW5kYXJDb250YWluZXIsICdtb3VzZWRvd24nLCBjYWxlbmRhckNsaWNrLCBmYWxzZSk7XG4gICAgfTtcblxuICAgIG9wZW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlbGYuYWRkRXZlbnRMaXN0ZW5lcihkb2N1bWVudCwgJ2NsaWNrJywgZG9jdW1lbnRDbGljaywgZmFsc2UpO1xuICAgICAgICBzZWxmLmFkZENsYXNzKHdyYXBwZXJFbGVtZW50LCAnb3BlbicpO1xuICAgIH07XG5cbiAgICBjbG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2VsZi5yZW1vdmVFdmVudExpc3RlbmVyKGRvY3VtZW50LCAnY2xpY2snLCBkb2N1bWVudENsaWNrLCBmYWxzZSk7XG4gICAgICAgIHNlbGYucmVtb3ZlQ2xhc3Mod3JhcHBlckVsZW1lbnQsICdvcGVuJyk7XG4gICAgfTtcblxuICAgIGRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBwYXJlbnQsXG4gICAgICAgICAgICBlbGVtZW50O1xuXG4gICAgICAgIHNlbGYucmVtb3ZlRXZlbnRMaXN0ZW5lcihkb2N1bWVudCwgJ2NsaWNrJywgZG9jdW1lbnRDbGljaywgZmFsc2UpO1xuICAgICAgICBzZWxmLnJlbW92ZUV2ZW50TGlzdGVuZXIoc2VsZi5lbGVtZW50LCAnZm9jdXMnLCBvcGVuLCBmYWxzZSk7XG4gICAgICAgIHNlbGYucmVtb3ZlRXZlbnRMaXN0ZW5lcihzZWxmLmVsZW1lbnQsICdibHVyJywgY2xvc2UsIGZhbHNlKTtcbiAgICAgICAgc2VsZi5yZW1vdmVFdmVudExpc3RlbmVyKHNlbGYuZWxlbWVudCwgJ2NsaWNrJywgb3BlbiwgZmFsc2UpO1xuXG4gICAgICAgIHBhcmVudCA9IHNlbGYuZWxlbWVudC5wYXJlbnROb2RlO1xuICAgICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQoY2FsZW5kYXJDb250YWluZXIpO1xuICAgICAgICBlbGVtZW50ID0gcGFyZW50LnJlbW92ZUNoaWxkKHNlbGYuZWxlbWVudCk7XG4gICAgICAgIHBhcmVudC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChlbGVtZW50LCBwYXJlbnQpO1xuICAgIH07XG5cbiAgICBpbml0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY29uZmlnLFxuICAgICAgICAgICAgcGFyc2VkRGF0ZTtcblxuICAgICAgICBzZWxmLmNvbmZpZyA9IHt9O1xuICAgICAgICBzZWxmLmRlc3Ryb3kgPSBkZXN0cm95O1xuXG4gICAgICAgIGZvciAoY29uZmlnIGluIGRlZmF1bHRDb25maWcpIHtcbiAgICAgICAgICAgIHNlbGYuY29uZmlnW2NvbmZpZ10gPSBpbnN0YW5jZUNvbmZpZ1tjb25maWddIHx8IGRlZmF1bHRDb25maWdbY29uZmlnXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYuZWxlbWVudCA9IGVsZW1lbnQ7XG5cbiAgICAgICAgaWYgKHNlbGYuZWxlbWVudC52YWx1ZSkge1xuICAgICAgICAgICAgcGFyc2VkRGF0ZSA9IERhdGUucGFyc2Uoc2VsZi5lbGVtZW50LnZhbHVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwYXJzZWREYXRlICYmICFpc05hTihwYXJzZWREYXRlKSkge1xuICAgICAgICAgICAgcGFyc2VkRGF0ZSA9IG5ldyBEYXRlKHBhcnNlZERhdGUpO1xuICAgICAgICAgICAgc2VsZi5zZWxlY3RlZERhdGUgPSB7XG4gICAgICAgICAgICAgICAgZGF5OiBwYXJzZWREYXRlLmdldERhdGUoKSxcbiAgICAgICAgICAgICAgICBtb250aDogcGFyc2VkRGF0ZS5nZXRNb250aCgpLFxuICAgICAgICAgICAgICAgIHllYXI6IHBhcnNlZERhdGUuZ2V0RnVsbFllYXIoKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHNlbGYuY3VycmVudFllYXJWaWV3ID0gc2VsZi5zZWxlY3RlZERhdGUueWVhcjtcbiAgICAgICAgICAgIHNlbGYuY3VycmVudE1vbnRoVmlldyA9IHNlbGYuc2VsZWN0ZWREYXRlLm1vbnRoO1xuICAgICAgICAgICAgc2VsZi5jdXJyZW50RGF5VmlldyA9IHNlbGYuc2VsZWN0ZWREYXRlLmRheTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlbGYuc2VsZWN0ZWREYXRlID0gbnVsbDtcbiAgICAgICAgICAgIHNlbGYuY3VycmVudFllYXJWaWV3ID0gZGF0ZS5jdXJyZW50LnllYXIoKTtcbiAgICAgICAgICAgIHNlbGYuY3VycmVudE1vbnRoVmlldyA9IGRhdGUuY3VycmVudC5tb250aC5pbnRlZ2VyKCk7XG4gICAgICAgICAgICBzZWxmLmN1cnJlbnREYXlWaWV3ID0gZGF0ZS5jdXJyZW50LmRheSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgd3JhcCgpO1xuICAgICAgICBidWlsZENhbGVuZGFyKCk7XG4gICAgICAgIGJpbmQoKTtcbiAgICB9O1xuXG4gICAgaW5pdCgpO1xuXG4gICAgcmV0dXJuIHNlbGY7XG59O1xuXG5kYXRlcGlja3IuaW5pdC5wcm90b3R5cGUgPSB7XG4gICAgaGFzQ2xhc3M6IGZ1bmN0aW9uIChlbGVtZW50LCBjbGFzc05hbWUpIHsgcmV0dXJuIGVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKGNsYXNzTmFtZSk7IH0sXG4gICAgYWRkQ2xhc3M6IGZ1bmN0aW9uIChlbGVtZW50LCBjbGFzc05hbWUpIHsgZWxlbWVudC5jbGFzc0xpc3QuYWRkKGNsYXNzTmFtZSk7IH0sXG4gICAgcmVtb3ZlQ2xhc3M6IGZ1bmN0aW9uIChlbGVtZW50LCBjbGFzc05hbWUpIHsgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKGNsYXNzTmFtZSk7IH0sXG4gICAgZm9yRWFjaDogZnVuY3Rpb24gKGl0ZW1zLCBjYWxsYmFjaykgeyBbXS5mb3JFYWNoLmNhbGwoaXRlbXMsIGNhbGxiYWNrKTsgfSxcbiAgICBxdWVyeVNlbGVjdG9yQWxsOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsLmJpbmQoZG9jdW1lbnQpLFxuICAgIGlzQXJyYXk6IEFycmF5LmlzQXJyYXksXG4gICAgYWRkRXZlbnRMaXN0ZW5lcjogZnVuY3Rpb24gKGVsZW1lbnQsIHR5cGUsIGxpc3RlbmVyLCB1c2VDYXB0dXJlKSB7XG4gICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lciwgdXNlQ2FwdHVyZSk7XG4gICAgfSxcbiAgICByZW1vdmVFdmVudExpc3RlbmVyOiBmdW5jdGlvbiAoZWxlbWVudCwgdHlwZSwgbGlzdGVuZXIsIHVzZUNhcHR1cmUpIHtcbiAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyLCB1c2VDYXB0dXJlKTtcbiAgICB9LFxuICAgIGwxMG46IHtcbiAgICAgICAgd2Vla2RheXM6IHtcbiAgICAgICAgICAgIHNob3J0aGFuZDogWydTdW4nLCAnTW9uJywgJ1R1ZScsICdXZWQnLCAnVGh1JywgJ0ZyaScsICdTYXQnXSxcbiAgICAgICAgICAgIGxvbmdoYW5kOiBbJ1N1bmRheScsICdNb25kYXknLCAnVHVlc2RheScsICdXZWRuZXNkYXknLCAnVGh1cnNkYXknLCAnRnJpZGF5JywgJ1NhdHVyZGF5J11cbiAgICAgICAgfSxcbiAgICAgICAgbW9udGhzOiB7XG4gICAgICAgICAgICBzaG9ydGhhbmQ6IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLCAnT2N0JywgJ05vdicsICdEZWMnXSxcbiAgICAgICAgICAgIGxvbmdoYW5kOiBbJ0phbnVhcnknLCAnRmVicnVhcnknLCAnTWFyY2gnLCAnQXByaWwnLCAnTWF5JywgJ0p1bmUnLCAnSnVseScsICdBdWd1c3QnLCAnU2VwdGVtYmVyJywgJ09jdG9iZXInLCAnTm92ZW1iZXInLCAnRGVjZW1iZXInXVxuICAgICAgICB9LFxuICAgICAgICBkYXlzSW5Nb250aDogWzMxLCAyOCwgMzEsIDMwLCAzMSwgMzAsIDMxLCAzMSwgMzAsIDMxLCAzMCwgMzFdLFxuICAgICAgICBmaXJzdERheU9mV2VlazogMFxuICAgIH1cbn07XG4iXX0=
