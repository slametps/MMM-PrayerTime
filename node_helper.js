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
      var adzanCmd = '/usr/bin/omxplayer -o hdmi modules/MMM-PrayerTime/res/' + (payload.occasion && payload.occasion=="FAJR" ? 'adzan-fajr.mp3' : 'adzan.mp3') + ' &';
      async.parallel([
        async.apply(exec, adzanCmd)
      ],
      function (err, res) {
      });
		}
	},
});
