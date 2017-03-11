Module.register("MMM-PrayerTime",{
	// Default module config.
	defaults: {
		apiVersion: '1.0',
    lat: false,
    lon: false,
    timezone: false,
    method: 5, // method of timing computation {0-Shia Ithna-Ashari,1-University of Islamic Sciences, Karachi,2-Islamic Society of North America (ISNA),3-Muslim World League (MWL),4-Umm al-Qura, Makkah,5-Egyptian General Authority of Survey,7-Institute of Geophysics, University of Tehran}
    playAdzan: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'],
    notDisplayed: ['midnight', 'sunset'],
    useUpdateInterval: true,
    updateInterval: 86400 * 1000, // How often do you want to fetch new praying time? (milliseconds)
    animationSpeed: 2.5 * 1000, // Speed of the update animation. (milliseconds)
    language: config.language,
    colored: false
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
      'id': 'translations/id.json'
    };
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
    console.log(this.arrTodaySchedule);

    // sort nextday schedule
    this.arrNextdaySchedule = [];
    for(var x in this.nextdaySchedule){
      if (!self.config.notDisplayed.includes(x.toLowerCase()))
        this.arrNextdaySchedule.push([x, this.nextdaySchedule[x]]);
    }
    this.arrNextdaySchedule.sort(sortSchedule);
    console.log(this.arrNextdaySchedule);

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
    console.log("urlToday-" + urlToday);
    console.log("urlNextday-" + urlNextday);
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
          console.log("this.responseText = ["+this.responseText+"]");
          console.log("resultToday = ["+resultToday+"]");
          self.todaySchedule = resultToday.data.timings;
          console.log(self.todaySchedule);
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
          console.log("this.responseText = ["+this.responseText+"]");
          console.log("resultNextday = ["+resultNextday+"]");
          self.nextdaySchedule = resultNextday.data.timings;
          console.log(self.nextdaySchedule);
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
    console.log('this.arrAdzanTime.length-'+this.arrAdzanTime.length);
    console.log(this.arrAdzanTime);
    var curTime = moment().format("HH:mm");
    console.log('curTime-'+curTime);
    if (this.arrAdzanTime.length > 0) {
      if (this.arrAdzanTime.includes(curTime)) {
        console.log('playAdzan@'+curTime);
        this.sendSocketNotification("PLAY_ADZAN", {});
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
    }, 60*1000);
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

      // nextday
      var occasionTimeNext = document.createElement("td");
      occasionTimeNext.className = "occasion-time bright light";
      //occasionTimeNext.innerHTML = this.todaySchedule[t];
      occasionTimeNext.innerHTML = this.translate('TOMORROW');
      row.appendChild(occasionTimeNext);

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
        occasionName.innerHTML = this.translate(this.arrTodaySchedule[t][0]);
        row.appendChild(occasionName);

        // today
        var occasionTime = document.createElement("td");
        occasionTime.className = "occasion-time bright light";
        //occasionTime.innerHTML = this.todaySchedule[t];
        occasionTime.innerHTML = this.arrTodaySchedule[t][1];
        row.appendChild(occasionTime);

        // nextday
        var occasionTimeNext = document.createElement("td");
        occasionTimeNext.className = "occasion-time bright light";
        //occasionTimeNext.innerHTML = this.todaySchedule[t];
        occasionTimeNext.innerHTML = this.arrNextdaySchedule[t][1];
        row.appendChild(occasionTimeNext);
      }

      wrapper.appendChild(table);
    }

		return wrapper;
  },

	notificationReceived: function(notification, payload, sender) {
		Log.log(this.name + ": received notification : " + notification);
    var self = this;
		if (notification == "PRAYER_TIME") {
      if (payload.type == "PLAY_ADZAN") {
        this.sendSocketNotification("PLAY_ADZAN", payload);
      }
      if (payload.type == "UPDATE_PRAYINGTIME") {
        this.updateSchedule(0);
      }
		}
	}
});
