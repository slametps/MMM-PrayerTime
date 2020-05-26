# MMM-PrayerTime [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://raw.githubusercontent.com/slametps/MMM-PrayerTime/master/LICENSE)
This an extension for the [MagicMirror<sup>2</sup>](https://github.com/MichMich/MagicMirror). It will display prayer time (in local time) and also recite Adzan/Adhan. Your mirror will be your helpful assistant to do sholat on time.

## Screenshot
![Screenshot](https://raw.githubusercontent.com/slametps/MMM-PrayerTime/master/screenshot.png)
![Screenshot](https://raw.githubusercontent.com/slametps/MMM-PrayerTime/master/screenshot-alert.png)
![Screenshot](https://raw.githubusercontent.com/slametps/MMM-PrayerTime/master/screenshot2.jpg)
![Screenshot](https://raw.githubusercontent.com/slametps/MMM-PrayerTime/master/screenshot-telegram.png)

## Installation
1. Navigate into your MagicMirror's `modules` folder
2. execute `git clone https://github.com/slametps/MMM-PrayerTime.git`
3. if this module does not run correctly, try `npm install async`

## Using the module

To use this module, add it to the modules array in the `config/config.js` file:
````javascript
modules: [
	{
		module: 'MMM-PrayerTime',
		position: 'top_left',	// This can be any of the regions. Best result is in the top_left/top_right.
		config: {
			apiVersion: '1.0', // please, leave unchanged. reserved for future use.
			lat: false, // latitude of your position (city)
			lon: false, // longitude of your position (city)
			timezone: false, // please refer to http://php.net/manual/en/timezones.php
			timeFormat: 24,
			method: 5,
			playAdzan: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'],
			notDisplayed: ['midnight', 'sunset'],
			useUpdateInterval: true,
			updateInterval: 86400 * 1000, // How often do you want to fetch new praying time? (milliseconds)
			animationSpeed: 2.5 * 1000, // Speed of the update animation. (milliseconds)
			language: config.language,
			showAdzanAlert: true,
			showTomorrow: true,
			vertical: true, // set false for horizontal view
			alertTimer: 15000
		}
	}
]
````

## Configuration options

The following properties can be configured:


<table width="100%">
	<!-- why, markdown... -->
	<thead>
		<tr>
			<th>Option</th>
			<th width="100%">Description</th>
		</tr>
	<thead>
	<tbody>
		<tr>
			<td><code>apiVersion</code></td>
			<td>1.0 (reserved for future use)</td>
		</tr>
		<tr>
			<td><code>lat</code><br>REQUIRED</td>
			<td>latitute of your position (city)
				<br>You can use google maps to get this info
				<br><b>Default value:</b> <code>false</code>
			</td>
		</tr>
		<tr>
			<td><code>lon</code><br>REQUIRED</td>
			<td>longitude of your position (city)
				<br>You can use google maps to get this info
				<br><b>Default value:</b> <code>false</code>
			</td>
		</tr>
		<tr>
			<td><code>timezone</code><br>REQUIRED</td>
			<td>Local timezone.
				<br><b>Possible values:</b> refer to http://php.net/manual/en/timezones.php
				<br><b>Default value:</b> <code>true</code>
			</td>
		</tr>
		<tr>
			<td><code>timeFormat</code>
			<td>12/24 time-format.
				<br><b>Possible values:</b> <code>12, 24</code>
				<br><b>Default value:</b> <code>config.timeFormat or 24</code>
			</td>
		</tr>
		<tr>
			<td><code>method</code><br>REQUIRED</td>
			<td>method to identify various schools of thought about how to compute the timings
				<br><b>Possible values:</b> <code>0-7</code> (0-Shia Ithna-Ashari, 1-University of Islamic Sciences,Karachi, 2-Islamic Society of North America (ISNA), 3-Muslim World League/MWL, 4-Umm al-Qura,Makkah, 5-Egyptian General Authority of Survey, 7-Institute of Geophysics, University of Tehran)
				<br><b>Default value:</b> <code>5</code>
			</td>
		</tr>
                <tr>
                        <td><code>methodSettings</code></td>
                        <td>Create your own calculation method,
				<br>The methodSettings parameter accepts comma separated values in the following order: <code>FajrAngle,MaghribAngleOrMinsAfterSunset,IshaAngleOrMinsAfterSunset</code>
                                <br>Refer to https://aladhan.com/calculation-methods
				<br><b>Method option must be:</b> 99
                                <br><b>Example value:</b> <code>15,null,12</code>
                                <br><b>Default value:</b> <code>false</code>
                        </td>
                </tr>
		<tr>
			<td><code>playAdzan</code></td>
			<td>List/array of the prayer time name to play Adzan.
				<br><b>Possible values:</b> <code>['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'imsak', 'sunrise', 'sunset', 'midnight']</code>
				<br><b>Default value:</b> <code>['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']</code>
			</td>
		</tr>
		<tr>
			<td><code>notDisplayed</code></td>
			<td>List/array of the prayer time name not to be displayed.
				<br><b>Possible values:</b> <code>['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'imsak', 'sunrise', 'sunset', 'midnight']</code>
				<br><b>Default value:</b> <code>['midnight', 'sunset']</code>
			</td>
		</tr>
		<tr>
			<td><code>useUpdateInterval</code></td>
			<td>Using internal update interval or triggered by MMM-ModuleScheduler to fetch and update new praying time? if <code>false</code>, add new schedule entry in MMM-ModuleScheduler:
				<br><code>{notification: 'PRAYER_TIME', schedule: '1 0 * * *', payload: {type: 'UPDATE_PRAYINGTIME'}}</code>
				<br><b>Possible values:</b> <code>true, false</code>
				<br><b>Default value:</b> <code>true</code>
			</td>
		</tr>
		<tr>
			<td><code>updateInterval</code></td>
			<td>How often to fetch new praying time? (milliseconds)
				<br><b>Default value:</b> <code>86400000</code> (1 day)
			</td>
		</tr>
		<tr>
			<td><code>animationSpeed</code></td>
			<td>Speed of the update animation. (milliseconds)<br>
				<br><b>Possible values:</b><code>0</code> - <code>5000</code>
				<br><b>Default value:</b> <code>2500</code> (2.5 seconds)
			</td>
		</tr>
		<tr>
			<td><code>language</code></td>
			<td>module language. Can be different from MM.
				<br><b>Default value:</b> <code>config.language</code> or <code>'en'</code>
			</td>
		</tr>
		<tr>
			<td><code>showAdzanAlert</code></td>
			<td>Display alert when enterigng praying time?
				<br><b>Possible values:</b> <code>true, false</code>
				<br><b>Default value:</b> <code>true</code>
			</td>
		</tr>
		<tr>
			<td><code>showTomorrow</code></td>
			<td>Display tomorrow praying time?
				<br><b>Possible values:</b> <code>true, false</code>
				<br><b>Default value:</b> <code>true</code>
			</td>
		</tr>
		<tr>
			<td><code>vertical</code></td>
			<td>Display vertically?
				<br><b>Possible values:</b> <code>true, false</code>
				<br><b>Default value:</b> <code>true</code>
			</td>
		</tr>
		<tr>
			<td><code>alertTimer</code></td>
			<td>How long alert will be displayed? (milliseconds)<br>
				<br><b>Possible values:</b><code>0</code> - <code>60000</code>
				<br><b>Default value:</b> <code>15000</code> (15 seconds)
			</td>
		</tr>
		<tr>
			<td><code>telegramAlert</code></td>
			<td>Send a notification to your Telegram Bot,
				<br>The telegramAlert is a multidimensional array: <code>[ Status, [["chat_id_1", "chat_id_2", ...], 'bot_token'] ]</code>
				<br>Refer to https://core.telegram.org/bots/api#sendmessage
				<br>Refer to https://www.shellhacks.com/telegram-api-send-message-personal-notification-bot/
				<br><b>Example value:</b> <code>[ true, [["123456789", "987654321", ...], '4334584950:AAEPmjlh94N62Lv9jGWEgOftlxxAfMhB1gs'] ]</code>
				<br><b>Default value:</b> <code>[false]</code>
			</td>
		</tr>
	</tbody>
</table>

## Dependencies
- Access to the internet to download praying time from http://api.aladhan.com
- [MMM-ModuleScheduler](https://github.com/ianperrin/MMM-ModuleScheduler). OPTIONAL.
- omxplayer (<code>sudo apt-get install omxplayer</code>)
- [MMM-TelegramBot](https://github.com/eouia/MMM-TelegramBot). OPTIONAL.

The MIT License (MIT)
=====================

Copyright © 2016-2017 Slamet PS

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the “Software”), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

**The software is provided “as is”, without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and noninfringement. In no event shall the authors or copyright holders be liable for any claim, damages or other liability, whether in an action of contract, tort or otherwise, arising from, out of or in connection with the software or the use or other dealings in the software.**
