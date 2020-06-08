Module.register("MMM-PrayerTime",{
	// Default module config.
	defaults: {
		apiVersion: '1.0',
    lat: false,
    lon: false,
    timezone: false,
    timeFormat: config.timeFormat || 24,
    method: 5, // method of timing computation {0-Shia Ithna-Ashari,1-University of Islamic Sciences, Karachi,2-Islamic Society of North America (ISNA),3-Muslim World League (MWL),4-Umm al-Qura, Makkah,5-Egyptian General Authority of Survey,7-Institute of Geophysics, University of Tehran}
    methodSettings: false,
    school: 0, // 0 = Shafii, 1 = Hanafi
    adjustment: 0, // 0 = no days of adjustment to hijri date(s)
    tune: '', // Comma Separated String of integers to offset timings returned by the API in minutes. Example: 5,3,5,7,9,7. See https://aladhan.com/calculation-methods
    midnightMode: 0, // 0 for Standard (Mid Sunset to Sunrise), 1 for Jafari (Mid Sunset to Fajr). If you leave this empty, it defaults to Standard.
    latitudeAdjustmentMethod: '', // Method for adjusting times higher latitudes - for instance, if you are checking timings in the UK or Sweden. 1 - Middle of the Night, 2 - One Seventh, 3 - Angle Based
    playAdzan: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'],
    notDisplayed: ['midnight', 'sunset'],
    useUpdateInterval: true,
    updateInterval: 86400 * 1000, // How often do you want to fetch new praying time? (milliseconds)
    animationSpeed: 2.5 * 1000, // Speed of the update animation. (milliseconds)
    language: config.language || "en",
    colored: false,
    showAdzanAlert: true,
    showTomorrow: true,
    vertical: true, // set false to horizontal view
    alertTimer: 15000
	},

	getScripts: function() {
	    return ["moment.js"];
	},

	getStyles: function() {
		return ["MMM-PrayerTime.css"];
	},

  // Define required translations.
	getTranslations: function() {
    return {
      'en': 'translations/en.json',
      'id': 'translations/id.json',
      'ar': 'translations/ar.json',
      'fr': 'translations/fr.json',
      'de': 'translations/de.json',
      'bn': 'translations/bn.json'
    };
	},

  getCommands: function(commander) {
    commander.add({
      command: 'prayertime',
      description: this.translate("TXT_PRAYERTIME_DESC"),
      callback: 'cmd_prayertime'
    })
  },

  cmd_prayertime: function(command, handler) {
    var text = "";
    text += "*" + this.translate("TXT_PRAYERTIME") + "*\n";
    text += "*" + this.translate("TODAY") + "*\n";
    for (var t in this.arrTodaySchedule) {
      text += "*" + this.translate(this.arrTodaySchedule[t][0].toUpperCase()) + ":* `" + (this.config.timeFormat == 12 ? moment(this.arrTodaySchedule[t][1], ["HH:mm"]).format("h:mm A") : this.arrTodaySchedule[t][1]) + "`\n";
    }
    text += "\n*" + this.translate("TOMORROW") + "*\n";
    for (var t in this.arrNextdaySchedule) {
      text += "*" + this.translate(this.arrNextdaySchedule[t][0].toUpperCase()) + ":* `" + (this.config.timeFormat == 12 ? moment(this.arrNextdaySchedule[t][1], ["HH:mm"]).format("h:mm A") : this.arrNextdaySchedule[t][1]) + "`\n";
    }
    handler.reply("TEXT", text, {parse_mode:'Markdown'});
  },


  /* getParams
	 * Generates an url with api parameters based on the config.
	 *
	 * return String - URL params.
	 */
	getParams: function(unixTime) {
		var params = unixTime + "?";
		if(this.config.lat) {
			params += "latitude=" + this.config.lat;
		}
    if (this.config.lon) {
			params += "&longitude=" + this.config.lon;
		}
    if (this.config.timezone) {
			params += "&timezonestring=" + this.config.timezone;
    }
		if (this.config.method) {
			params += "&method=" + this.config.method;
    }
    if (this.config.methodSettings) {
      params += "&methodSettings=" + encodeURI(this.config.methodSettings);
    }
    if (this.config.school) {
      params += "&school=" + this.config.school;
    }
    if (this.config.adjustment) {
      params += "&adjustment=" + this.config.adjustment;
    }
    if (this.config.tune) {
      params += "&tune=" + encodeURI(this.config.tune);
    }
    if (this.config.midnightMode) {
      params += "&midnightMode=" + this.config.midnightMode;
    }
    if (this.config.latitudeAdjustmentMethod) {
      params += "&latitudeAdjustmentMethod=" + this.config.latitudeAdjustmentMethod;
    }

		return params;
	},

	/* processSchedule
	 * process downloaded scheduled.
	 */
  processSchedule: function() {
    var self = this;

    function sortSchedule(a, b) {
      if (a[1] < b[1]) {
        return -1;
      }
      if (a[1] > b[1]) {
        return 1;
      }

      // names must be equal
      return 0;
    }

    // sort today schedule
    this.arrTodaySchedule = [];
    this.arrAdzanTime = [];
    for(var x in this.todaySchedule){
      if (!self.config.notDisplayed.includes(x.toLowerCase()))
        this.arrTodaySchedule.push([x, this.todaySchedule[x]]);
      if (self.config.playAdzan.includes(x.toLowerCase()))
        this.arrAdzanTime.push(this.todaySchedule[x]);
    }
    this.arrTodaySchedule.sort(sortSchedule);

    // sort nextday schedule
    this.arrNextdaySchedule = [];
    for(var x in this.nextdaySchedule){
      if (!self.config.notDisplayed.includes(x.toLowerCase()))
        this.arrNextdaySchedule.push([x, this.nextdaySchedule[x]]);
    }
    this.arrNextdaySchedule.sort(sortSchedule);

    this.loaded = true;
		this.updateDom(this.config.animationSpeed);
  },

  updateSchedule: function(delay) {
    var self = this;
    Log.log(self.name + ': updateSchedule');
    var urlBase = "http://api.aladhan.com/timings/";
    var curUnixTime = moment().unix();
    var urlToday = urlBase + this.getParams(curUnixTime);
    var urlNextday = urlBase + this.getParams(curUnixTime + 86400);
    var resultToday = {};
    var resultNextday = {};
    var nbReq = 2;
    var nbRes = 0;

    var todayRequest = new XMLHttpRequest();
		todayRequest.open("GET", urlToday, true);
		todayRequest.onreadystatechange = function() {
			if (this.readyState === 4) {
				if (this.status === 200) {
          resultToday = JSON.parse(this.responseText);
          self.todaySchedule = resultToday.data.timings;
          // debug/testing only
          //self.todaySchedule = {"Fajr":"04:30", "Dhuhr":"12:00", "Asr":"16:14", "Maghrib":"18:00", "Isha":"20:50", "Imsak":"04:20"};
          nbRes++;
          if (nbRes == nbReq)
            self.processSchedule();
				} else {
					Log.error(self.name + ": got HTTP status-" + this.status);
          retry = true;
				}
			}
		};
		todayRequest.send();

    var nextdayRequest = new XMLHttpRequest();
		nextdayRequest.open("GET", urlNextday, true);
		nextdayRequest.onreadystatechange = function() {
			if (this.readyState === 4) {
				if (this.status === 200) {
          resultNextday = JSON.parse(this.responseText);
          self.nextdaySchedule = resultNextday.data.timings;
          nbRes++;
          if (nbRes == nbReq)
            self.processSchedule();
				} else {
					Log.error(self.name + ": got HTTP status-" + this.status);
          retry = true;
				}
			}
		};
		nextdayRequest.send();
  },

  isAdzanNow: function() {
    var curTime = moment().format("HH:mm:ss");
    var indexAdzan = -1;
    //console.log(this.arrTodaySchedule);
    if (this.arrTodaySchedule.length > 0)
    {
      function isAdzan(el, idx, arr) {
        return (el[1] + ':00') == curTime;
      }
      indexAdzan = this.arrTodaySchedule.findIndex(isAdzan);
      //console.log("indexAdzan-"+indexAdzan);

      if (indexAdzan > -1) {
        //console.log(this.config.playAdzan);
        //console.log("this.arrTodaySchedule[indexAdzan][0]).toLowerCase()-"+(this.arrTodaySchedule[indexAdzan][0]).toLowerCase());
        //console.log("this.config.playAdzan.findIndex((this.arrTodaySchedule[indexAdzan][0]).toLowerCase())-"+this.config.playAdzan.findIndex((this.arrTodaySchedule[indexAdzan][0]).toLowerCase()));
        if (this.config.playAdzan.includes((this.arrTodaySchedule[indexAdzan][0]).toLowerCase())) {
          if (this.config.showAdzanAlert) {
            var occasionNameUpper = (this.arrTodaySchedule[indexAdzan][0]).toUpperCase();
            var alertMsg = "ALERT_ADZAN_MSG";
            var adzanImsak = "ADZAN";
            //console.log("occasionNameUpper-"+occasionNameUpper);
            if (occasionNameUpper == "IMSAK") {
              alertMsg = "ALERT_IMSAK_MSG";
              adzanImsak = "IMSAK";
            }
            this.sendNotification("SHOW_ALERT", {title: this.translate(adzanImsak).toUpperCase(), imageFA: 'bullhorn', message: this.translate(alertMsg).replace("%OCCASION", this.translate(occasionNameUpper)), timer: this.config.alertTimer});
          }
          //console.log("this.arrTodaySchedule[indexAdzan][0]).toUpperCase()-"+(this.arrTodaySchedule[indexAdzan][0]).toUpperCase());
          this.sendSocketNotification("PLAY_ADZAN", {occasion: (this.arrTodaySchedule[indexAdzan][0]).toUpperCase()});
        }
      }
    }
  },

	start: function() {
		Log.info("Starting module: " + this.name);
		var self = this;

    // Set locale.
		moment.locale(this.config.language);

    this.todaySchedule = {};
    this.nextdaySchedule = {};
    this.arrTodaySchedule = [];
    this.arrNextdaySchedule = [];
    this.arrAdzanTime = [];

    this.loaded = false;
    var self = this;

    // first update
    self.updateSchedule(0);
    // periodic update if defined
    if (self.config.useUpdateInterval) {
      Log.log(self.name + ': using periodic update is activated');
      setInterval(function() {
        self.updateSchedule(0);
      }, self.config.updateInterval);
    }
    // adzan-checker
    self.isAdzanNow();
    setInterval(function() {
      self.isAdzanNow();
    }, 1000);
	},

	// Override dom generator.
	getDom: function() {
		Log.log("Updating MMM-PrayerTime DOM.");
    var self = this;
    var wrapper = document.createElement("div");

    if (!this.loaded) {
			wrapper.innerHTML = this.translate("LOADING");
			wrapper.className = "dimmed light small";
		}
    else {
      var table = document.createElement("table");
      table.className = "small";

      if (this.config.vertical) { // vertical view
        var row = document.createElement("tr");
        if (this.config.colored) {
          row.className = "colored";
        }
        table.appendChild(row);

        var occasionName = document.createElement("td");
        occasionName.className = "occasion-name bright light";
        occasionName.innerHTML = '&nbsp;';
        row.appendChild(occasionName);

        // today
        var occasionTime = document.createElement("td");
        occasionTime.className = "occasion-time bright light";
        occasionTime.innerHTML = this.translate('TODAY');
        row.appendChild(occasionTime);

        if (this.config.showTomorrow) {
          // nextday
          var occasionTimeNext = document.createElement("td");
          occasionTimeNext.className = "occasion-time bright light";
          //occasionTimeNext.innerHTML = this.todaySchedule[t];
          occasionTimeNext.innerHTML = this.translate('TOMORROW');
          row.appendChild(occasionTimeNext);
        }

        //for (var i = 0, count = this.todaySchedule.length; i < count; i++) {
        //for (t in this.todaySchedule)
        for (t in this.arrTodaySchedule)
        {
          row = document.createElement("tr");
          if (this.config.colored) {
            row.className = "colored";
          }
          table.appendChild(row);

          var occasionName = document.createElement("td");
          occasionName.className = "occasion-name bright light";
          //occasionName.innerHTML = this.translate(t);
          occasionName.innerHTML = this.translate(this.arrTodaySchedule[t][0].toUpperCase());
          row.appendChild(occasionName);

          // today
          var occasionTime = document.createElement("td");
          occasionTime.className = "occasion-time bright light";
          //occasionTime.innerHTML = this.todaySchedule[t];
          occasionTime.innerHTML = (this.config.timeFormat == 12 ? moment(this.arrTodaySchedule[t][1], ["HH:mm"]).format("h:mm A") : this.arrTodaySchedule[t][1]);
          row.appendChild(occasionTime);

          if (this.config.showTomorrow) {
            // nextday
            var occasionTimeNext = document.createElement("td");
            occasionTimeNext.className = "occasion-time bright light";
            //occasionTimeNext.innerHTML = this.todaySchedule[t];
            occasionTimeNext.innerHTML = (this.config.timeFormat == 12 ? moment(this.arrNextdaySchedule[t][1], ["HH:mm"]).format("h:mm A") : this.arrNextdaySchedule[t][1]);
            row.appendChild(occasionTimeNext);
          }
        }
      }
      else { // horizontal view
        var table = document.createElement("table");
        table.className = "small";

        var row = document.createElement("tr");
        if (this.config.colored) {
          row.className = "colored";
        }
        table.appendChild(row);

        var occasionName = document.createElement("td");
        occasionName.className = "occasion-name bright light";
        occasionName.innerHTML = '&nbsp;';
        row.appendChild(occasionName);

        // column label
        for (t in this.arrTodaySchedule) {
          var occasionTime = document.createElement("td");
          occasionTime.className = "occasion-time bright light";
          occasionTime.innerHTML = this.translate(this.arrTodaySchedule[t][0].toUpperCase());
          row.appendChild(occasionTime);
        }

        // today
        var rowToday = document.createElement("tr");
        if (this.config.colored) {
          rowToday.className = "colored";
        }
        table.appendChild(rowToday);

        var occasionNameToday = document.createElement("td");
        occasionNameToday.className = "occasion-time bright light";
        occasionNameToday.innerHTML = this.translate('TODAY');
        rowToday.appendChild(occasionNameToday);
        for (t in this.arrTodaySchedule) {
          var occasionTimeToday = document.createElement("td");
          occasionTimeToday.className = "occasion-time bright light";
          occasionTimeToday.innerHTML = (this.config.timeFormat == 12 ? moment(this.arrTodaySchedule[t][1], ["HH:mm"]).format("h:mm A") : this.arrTodaySchedule[t][1]);
          rowToday.appendChild(occasionTimeToday);
        }

        if (this.config.showTomorrow) {
          // nextday
          var rowNext = document.createElement("tr");
          if (this.config.colored) {
            rowNext.className = "colored";
          }
          table.appendChild(rowNext);

          var occasionNameNext = document.createElement("td");
          occasionNameNext.className = "occasion-time bright light";
          occasionNameNext.innerHTML = this.translate('TOMORROW');
          rowNext.appendChild(occasionNameNext);
          for (t in this.arrTodaySchedule) {
            var occasionTimeNext = document.createElement("td");
            occasionTimeNext.className = "occasion-time bright light";
            occasionTimeNext.innerHTML = (this.config.timeFormat == 12 ? moment(this.arrNextdaySchedule[t][1], ["HH:mm"]).format("h:mm A") : this.arrNextdaySchedule[t][1]);
            rowNext.appendChild(occasionTimeNext);
          }
        }
      }
      wrapper.appendChild(table);
    }

		return wrapper;
  },

	notificationReceived: function(notification, payload, sender) {
		Log.log(this.name + ": received notification : " + notification);
		if (notification == "PRAYER_TIME") {
      if (payload.type == "PLAY_ADZAN") {
        if (this.config.showAdzanAlert)
          this.sendNotification("SHOW_ALERT", {title: this.translate("ADZAN"), message: this.translate("ALERT_ADZAN_MSG").replace("%OCCASION", this.translate("ASR")), timer: this.config.alertTimer});
        this.sendSocketNotification("PLAY_ADZAN", {occasion: 'ASR'});
      }
      if (payload.type == "UPDATE_PRAYINGTIME") {
        this.updateSchedule(0);
      }
		}
	}
});
