
var defaultCookie = function() {

	var newCookie = {
		accounts: [],
		currentAccountIndex: 0,
		autoLogin: true,
		startingPane: "albumsList",
		
		defaultAction: "queue[]:[]all[]:[]shuffled",
		nowPlayingEnd: "stop[]:[]straight",
		theme: "dark",
		allowedOrientation: "free",
		recent: 0,
		searchType: 0,
		dashboardPlayer: true,
		
		albumsSort: 0,
		artistssSort: 0,
		songsSort: 0,
		playlistsSort: 0,
		videosSort: 0,
		
		allowMetrix: true,
		
		debug: false,
		streamDebug: false,
		
		version: "unknown",
		server: "unknown",
		compatible: "unknown",
	};
	
	return newCookie;
	
};


var sort_by = function(field, reverse, primer){

   reverse = (reverse) ? -1 : 1;

   return function(a,b){

       a = a[field];
       b = b[field];

       if (typeof(primer) != 'undefined'){
           a = primer(a);
           b = primer(b);
       }

       if (a<b) return reverse * -1;
       if (a>b) return reverse * 1;
       return 0;

   }
};

var double_sort_by = function(field1, field2, reverse, primer){

   reverse = (reverse) ? -1 : 1;

   return function(a,b){

       a = a[field1]+"_"+a[field2];
       b = b[field1]+"_"+b[field2];

       if (typeof(primer) != 'undefined'){
           a = primer(a);
           b = primer(b);
       }

       if (a<b) return reverse * -1;
       if (a>b) return reverse * 1;
       
	   return 0;

   }
};

var triple_sort_by = function(field1, field2, field3, reverse, primer){

   reverse = (reverse) ? -1 : 1;

   return function(a,b){

       a = a[field1]+"_"+a[field2]+"_"+a[field3];
       b = b[field1]+"_"+b[field2]+"_"+b[field3];

       if (typeof(primer) != 'undefined'){
           a = primer(a);
           b = primer(b);
       }

       if (a<b) return reverse * -1;
       if (a>b) return reverse * 1;
       
	   return 0;

   }
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


var floatToTime = function(inFloat) {

	var minutes = parseInt(inFloat/60);
	var seconds = parseInt(inFloat - (minutes*60));
	
	if(minutes < 10) minutes = "0"+minutes;
	if(seconds < 10) seconds = "0"+seconds;
	
	return minutes+":"+seconds;

}