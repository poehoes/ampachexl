
var defaultCookie = function() {

	var newCookie = {
		//accounts: [],
		accounts: [{name: "local", url: "http://192.168.1.105/ampache/", username: "ampachexl", password: "ampachexl"}],
		currentAccountIndex: 0,
		streamDebug: false,
		version: "unknown",
		allowedOrientation: "free",
		theme: "defualt",
		recent: 0,
		albumsSort: 0,
		searchType: 0,
		dashboardPlayer: true,
		debug: true,
	};
	
	return newCookie;
	
};

var getAmpacheConnectionUrl = function(accountObject) {

	var time = getAmpacheTime();
	if(debug) console.log("time", time);
	
	var key = SHA256(accountObject.password);
	if(debug) console.log("key", key);
	
	var passphrase = SHA256(time + key);
	if(debug) console.log("passphrase", passphrase);
	
	var connectionUrl = accountObject.url + "/server/xml.server.php?action=handshake&auth=" + passphrase + "&timestamp=" + time + "&version=350001&user=" + accountObject.username;
	if(debug) console.log("connectionUrl", connectionUrl);
	
	return connectionUrl;
	
};
var getAmpacheTime = function() {

	var myDate = new Date();				// Generic JS date object 
	var unixtime_ms = myDate.getTime();		// Returns milliseconds since the epoch 
	var unixtime = parseInt(unixtime_ms / 1000, 10);
	
	return unixtime;

};


