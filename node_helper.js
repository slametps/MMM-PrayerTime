/* Magic Mirror
 * Node Helper: MMM-PrayerTime
 *
 * By Slamet PS/slametps@gmail.com
 * MIT Licensed.
 */

var NodeHelper = require("node_helper");
var async = require('async');
var exec = require('child_process').exec;

module.exports = NodeHelper.create({
	// Subclass start method.
	start: function() {
		console.log("Starting node_helper.js for MMM-PrayerTime.");
	},

	socketNotificationReceived: function(notification, payload) {
    console.log(this.name + " node helper received a socket notification: " + notification + " - Payload: " + payload);
    if (notification == "PLAY_ADZAN") {
      var adzanSound = 'adzan.mp3';
      if (payload.occasion) {
        if (payload.occasion=="FAJR") {
          adzanSound = 'adzan-fajr.mp3';
        }
        else if (payload.occasion=="IMSAK") {
          adzanSound = 'imsak.mp3';
        }
      }
      var adzanCmd = '/usr/bin/omxplayer -o both modules/MMM-PrayerTime/res/' + adzanSound + ' &';
      async.parallel([
        async.apply(exec, adzanCmd)
      ],
      function (err, res) {
      });
    }
	else if (notification == "TELEGRAM_ALERT") {
		var chat_ids = payload.telegramAlert_params[0];
		console.log("CCCCCCCCCCCCCC");
		chat_ids.forEach(function(chat_id) {
			var telegramCmd = "curl -s --max-time 10 -d 'chat_id=" + chat_id + "&disable_web_page_preview=1&text=" + encodeURI(payload.telegramTxt).replace(/'/g, '%27') + "' https://api.telegram.org/bot" + payload.telegramAlert_params[1] + "/sendMessage";
			async.parallel([
				async.apply(exec, telegramCmd)
			],
			function (err, res) {
			});
		});
	}
  }
});
