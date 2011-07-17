
var AmpacheXL = {};

var debug = true;

AmpacheXL.prefsCookieString = enyo.getCookie("AmpacheXL-prefs");
AmpacheXL.prefsCookie;

AmpacheXL.connected = false;

AmpacheXL.nowplaying = [];
AmpacheXL.allArtists = [];
AmpacheXL.allAlbums = [];
AmpacheXL.allPlaylists = [];
AmpacheXL.allVideos = [];

enyo.kind({
	name: "AmpacheXL.main",
	kind: "VFlexBox",
	className: "AmpacheXL",
	
	viewMode: "tablet",
	
	dataRequestView: "",
	bannerMessageId: "",
	
	components: [
		{kind: "ApplicationEvents", onLoad: "appLoaded", onUnload: "appUnloaded", onError: "appError", onWindowActivated: "windowActivated", onWindowDeactivated: "windowDeactivated", onKeyup: "keypressHandler", onKeydown: "keypressHandler", onKeypress: "keypressHandler", onBack: "backHandler"},
		
		//name: "ampacheConnectService", kind: "WebService", handleAs: "txt", onSuccess: "ampacheConnectResponse", onFailure: "ampacheConnectFailure"},
		{name: "dataRequestService", kind: "WebService", handleAs: "txt", onSuccess: "dataRequestResponse", onFailure: "dataRequestFailure"},
		
		{name: "ampacheConnectService", kind: "WebService", handleAs: "xml", onSuccess: "ampacheConnectResponse", onFailure: "ampacheConnectFailure"},
		//name: "dataRequestService", kind: "WebService", handleAs: "xml", onSuccess: "dataRequestResponse", onFailure: "dataRequestFailure"},
			
		{kind: "AppMenu", components: [
			{caption: "About", onclick: "openAbout"},
			{caption: "Disconnect", onclick: "disconnect"},
			{caption: "Preferences", onclick: "openPreferences"},
		]},
		
		{name: "aboutPopup", kind: "Popup", scrim: true, components: [
			{content: "AmpacheXL", style: "text-align: center; font-size: larger;"},
			{content: "<hr />", allowHtml: true},
			{name: "aboutPopupText", content: "AmpacheXL is an app for Ampache written for use on a webOS tablet.", style: "text-align: center; font-size: smaller;"},
			{content: "<hr />", allowHtml: true},
			{content: '<a href="http://code.google.com/p/ampachexl/">App homepage</a>', allowHtml: true, style: "text-align: center; font-size: smaller;"},
			{content: "<hr />", allowHtml: true},
			{content: '<a href="http://ampache.org/">Ampache homepage</a>', allowHtml: true, style: "text-align: center; font-size: smaller;"},
			{content: "<hr />", allowHtml: true},
			{kind: "Button", caption: "OK", onclick:"closeAboutPopup"}
		]},
		
		{name: "bannerMessagePopup", kind: "Popup", scrim: true, onBeforeOpen: "beforeBannerMessageOpen", components: [
			{name: "bannerMessagePopupText", style: "text-align: center;"},
			{kind: "Button", caption: "OK", onclick:"closeBannerMessagePopup"}
		]},
		
		{name: "loadingPopup", kind: "Popup", scrim: true, dismissWithClick: true, dismissWithEscape: true, components: [
			{kind: "HFlexBox", align: "center", pack: "center", components: [
				//{kind: "Spacer"},
				{kind: "SpinnerLarge"},
				//{kind: "Spacer"},
			]},
		]},
		
		{name: "mainPane", kind: "HFlexBox", kind2: "SlidingPane", flex: 1, onSelectView: "mainPaneViewSelected", components: [
			{name: "leftMenu", className: "leftMenu", width: "300px", layoutKind: "VFlexLayout", components: [
				
				{name: "leftMenuKind", kind: "LeftMenuKind", flex: 1, onViewSelected: "viewSelected", onDataRequest: "dataRequest", onUpdateSpinner: "updateSpinner", onBannerMessage: "bannerMessage"},
				
				{name: "playback", kind: "Playback", onViewSelected: "viewSelected", onDataRequest: "dataRequest", onUpdateSpinner: "updateSpinner", onPreviousTrack: "previousTrack", onNextTrack: "nextTrack", onBannerMessage: "bannerMessage"},
			
			]},
			{name: "rightContent", className: "rightContent", kind: "Pane", flex: 1, onSelectView: "rightContentViewSelected", onCreateView: "rightContentViewCreated", transitionKind: "enyo.transitions.LeftRightFlyin", components: [	
				
				{name: "hosts", kind: "Hosts", onViewSelected: "viewSelected", onDataRequest: "dataRequest", onUpdateSpinner: "updateSpinner", onPlaySong: "playSong", onBannerMessage: "bannerMessage", onUpdateCounts: "updateCounts", onAmpacheConnect: "ampacheConnect"},
				
				{name: "nowplaying", kind: "Nowplaying", onViewSelected: "viewSelected", onDataRequest: "dataRequest", onUpdateSpinner: "updateSpinner", onPlaySong: "playSong", onBannerMessage: "bannerMessage", onUpdateCounts: "updateCounts"},
				
				{name: "searchSelector", kind: "SearchSelector", onBannerMessage: "bannerMessage"},
				
				{name: "artistsList", kind: "ArtistsList", onViewSelected: "viewSelected", onDataRequest: "dataRequest", onUpdateSpinner: "updateSpinner", onBannerMessage: "bannerMessage"},
				{name: "albumsList", kind: "AlbumsList", onViewSelected: "viewSelected", onDataRequest: "dataRequest", onUpdateSpinner: "updateSpinner", onBannerMessage: "bannerMessage"},
				{name: "playlistsList", kind: "PlaylistsList", onViewSelected: "viewSelected", onDataRequest: "dataRequest", onUpdateSpinner: "updateSpinner", onBannerMessage: "bannerMessage"},
				{name: "videosList", kind: "VideosList", onViewSelected: "viewSelected", onDataRequest: "dataRequest", onUpdateSpinner: "updateSpinner", onBannerMessage: "bannerMessage"},
				
				{name: "songsList", kind: "SongsList", onViewSelected: "viewSelected", onDataRequest: "dataRequest", onUpdateSpinner: "updateSpinner", onPlaySong: "playSong", onBannerMessage: "bannerMessage"},
			
			]},
		]},
		
		/*
		{name: "playbackFooter", showing: false, className: "playbackFooter", kind: "HFlexBox", components: [
			{content: "playbackFooter"},
		]},
		*/
	],
	
	create: function() {
		if(debug) this.log("create");
		this.inherited(arguments);
		
		AmpacheXL.Metrix = new Metrix(); 
		
		if((AmpacheXL.prefsCookieString)&&(true)) {
		
			if(debug) this.log("we have cookie");
			AmpacheXL.prefsCookie = enyo.json.parse(AmpacheXL.prefsCookieString);
			
			if(AmpacheXL.prefsCookie.allowMetrix) setTimeout(enyo.bind(this,"submitMetrix"),500);
			
		} else {
		
			if(debug) this.log("we don't have cookie");
			AmpacheXL.prefsCookie = defaultCookie();
			
		}
		
		this.savePreferences();
			
		enyo.setAllowedOrientation(AmpacheXL.prefsCookie.allowedOrientation);	
		debug = AmpacheXL.prefsCookie.debug;
		
		this.activate();
		
	},
	
	activate: function() {
		if(debug) this.log("activate");
		
		//this.ampacheConnect();
	},
	savePreferences: function() {
		if(debug) this.log("savePreferences");
		
		enyo.setCookie("AmpacheXL-prefs", enyo.json.stringify(AmpacheXL.prefsCookie));
	},
	submitMetrix: function() {
		if(debug) this.log("submitMetrix");
		
		AmpacheXL.Metrix.postDeviceData();
		
		AmpacheXL.Metrix.checkBulletinBoard(1, false);
		
	},
	openAbout: function() {
		if(debug) this.log("openAbout");
		
		this.$.aboutPopup.openAtCenter();
	},
	closeAboutPopup: function() {
		if(debug) this.log("closeAboutPopup");
		
		this.$.aboutPopup.close();
	},
	disconnect: function() {
		if(debug) this.log("disconnect");
		
		AmpacheXL.connected = false;
		
		AmpacheXL.connectResponse.auth = "";
		AmpacheXL.connectResponse.update = "";
		AmpacheXL.connectResponse.add = "";
		AmpacheXL.connectResponse.clean = "";
		AmpacheXL.connectResponse.songs = "";
		AmpacheXL.connectResponse.artists = "";
		AmpacheXL.connectResponse.albums = "";
		AmpacheXL.connectResponse.playlists = "";
		AmpacheXL.connectResponse.videos = "";
				
		AmpacheXL.connectResponse.tags = "";
		AmpacheXL.connectResponse.api = "";
		
		AmpacheXL.nowplaying.length = 0;
		AmpacheXL.allArtists.length = 0;
		AmpacheXL.allAlbums.length = 0;
		AmpacheXL.allPlaylists.length = 0;
		AmpacheXL.allVideos.length = 0;

		this.updateCounts();
		this.$.playback.disconnect();
		this.$.rightContent.selectViewByName("hosts");
	},
	openPreferences: function() {
		if(debug) this.log("openPreferences");
	},
	headerClick: function() {
		if(debug) this.log("got header click");
		
	},
	mainPaneViewSelected: function(inSender, inView, inPreviousView) {
		if(debug) this.log("mainPaneViewSelected from "+inPreviousView.name+" to "+inView.name);
		
		this.currentView = inView.name;
		
		//probably a better way to note activation
		switch(this.currentView) {
			case "asdf":
				this.$.asdf.activate();
			  break;
		}
	},
	rightContentViewSelected: function(inSender, inView, inPreviousView) {
		if(inPreviousView) {
			if(debug) this.log("rightContentViewSelected changing  from "+inPreviousView.name+" to "+inView.name);
			this.currentRightPane = inView.name;
			this.previousRightPane = inPreviousView.name;
		}
		
		this.savePreferences();
		
		this.updateCounts();
		this.$[inView.name].activate();
	},
	
	
	bannerMessage: function(inSender, inMessage, forcePopup) {
		if(debug) this.log("bannerMessage: "+inMessage);
		
		if(inMessage == "Error: Session Expired") this.disconnect();
		
		if((forcePopup)||(!window.PalmSystem)){
			this.bannerMessageText = inMessage;
			this.$.bannerMessagePopup.openAtCenter();
		} else {
			enyo.windows.removeBannerMessage(this.bannerMessageId);
			this.bannerMessageId = enyo.windows.addBannerMessage(inMessage, "{}");
		}
		
	},
	beforeBannerMessageOpen: function() {
		if(debug) this.log("beforeBannerMessageOpen");
		
		this.$.bannerMessagePopupText.setContent(this.bannerMessageText);
	},
	closeBannerMessagePopup: function() {
		if(debug) this.log("closeBannerMessagePopup");
		
		this.$.bannerMessagePopup.close();
		
	},
	viewSelected: function(inSender, inItem) {
		if(debug) this.log("viewSelected: "+inItem);
		
		this.updateCounts();
		this.$.rightContent.selectViewByName(inItem);
	},
	dataRequest: function(inSender, inView, inMethod, inParameters) {
		if(debug) this.log("dataRequest: "+inView+" "+inMethod+" "+inParameters);
		
		this.dataRequestView = inView;
		
		if(AmpacheXL.connectResponse.success) {
		
			var requestUrl = AmpacheXL.prefsCookie.accounts[AmpacheXL.prefsCookie.currentAccountIndex].url;
			requestUrl += "/server/xml.server.php?";
			requestUrl += "auth="+AmpacheXL.connectResponse.auth;
			requestUrl += "&action="+inMethod;
			requestUrl += inParameters;
		
			this.$.dataRequestService.setUrl(requestUrl);
			if(debug) this.log("dataRequestService url: "+this.$.dataRequestService.getUrl());
			this.$.dataRequestService.call();
		
		}
	},
	updateSpinner: function(inSender, inShow) {
		if(debug) this.log("updateSpinner: "+inShow);
		
		if(inShow) {
			this.$.loadingPopup.openAtCenter();
			this.$.spinnerLarge.show();
		} else {
			this.$.loadingPopup.close();
			this.$.spinnerLarge.hide();
		}
	},
	playSong: function(inSender, inSongObject) {
		if(debug) this.log("playSong: "+enyo.json.stringify(inSongObject));
		
		this.$.playback.playSong(inSongObject);
	},
	previousTrack: function() {
		if(debug) this.log("previousTrack");
		
		this.$.nowplaying.previousTrack();
	},
	nextTrack: function() {
		if(debug) this.log("nextTrack");
		
		this.$.nowplaying.nextTrack();
	},
	updateCounts: function() {
		if(debug) this.log("updateCounts");
		
		this.$.leftMenuKind.updateCounts();
	},
	
	backHandler: function(inSender, e) {
		if(debug) this.log("backHandler");
		/*
		switch(this.currentView) {
			case 'kttTorrentsList':
				this.$.pane.selectViewByName("kttHostsList");
			  break;
			case 'kttTorrentDetails':
				this.$.pane.selectViewByName("kttTorrentsList");
			  break;
		}
		*/
		
		e.preventDefault();
		
		if(this.currentMode == "torrents") {
			this.$.slidingPane.back(e);
		} else if(this.currentMode == "preferences") {
			this.$.kttPreferences.gotBack(e);
		}
		
		return true;
	},
	resizeHandler: function() {
		if(debug) this.log("doing resize to "+document.body.clientWidth+"x"+document.body.clientHeight);
		
	},

	ampacheConnect: function() {
		if(debug) this.log("ampacheConnect");
		
		this.$.ampacheConnectService.setUrl(getAmpacheConnectionUrl(AmpacheXL.prefsCookie.accounts[AmpacheXL.prefsCookie.currentAccountIndex]));
		if(debug) this.log("ampacheConnectService url: "+this.$.ampacheConnectService.getUrl());
		this.$.ampacheConnectService.call();
	},
	ampacheConnectResponse: function(inSender, inResponse) {
		if(debug) this.log("ampacheConnectResponse");
		//if(debug) this.log("ampacheConnectResponse: "+inResponse);
		
		AmpacheXL.connected = true;
		
		AmpacheXL.connectResponse = {};
		
		var xmlobject = inResponse;
		
		if(xmlobject.getElementsByTagName("auth").length > 0) {
			if(debug) this.log("found auth field in XML so we have valid response");
			
			AmpacheXL.connectResponse.success = true;
			
			try {
				AmpacheXL.connectResponse.auth = xmlobject.getElementsByTagName("auth")[0].childNodes[0].nodeValue;
				AmpacheXL.connectResponse.update = xmlobject.getElementsByTagName("update")[0].childNodes[0].nodeValue;
				AmpacheXL.connectResponse.add = xmlobject.getElementsByTagName("add")[0].childNodes[0].nodeValue;
				AmpacheXL.connectResponse.clean = xmlobject.getElementsByTagName("clean")[0].childNodes[0].nodeValue;
				AmpacheXL.connectResponse.songs = xmlobject.getElementsByTagName("songs")[0].childNodes[0].nodeValue;
				AmpacheXL.connectResponse.artists = xmlobject.getElementsByTagName("artists")[0].childNodes[0].nodeValue;
				AmpacheXL.connectResponse.albums = xmlobject.getElementsByTagName("albums")[0].childNodes[0].nodeValue;
				AmpacheXL.connectResponse.playlists = xmlobject.getElementsByTagName("playlists")[0].childNodes[0].nodeValue;
				AmpacheXL.connectResponse.videos = xmlobject.getElementsByTagName("videos")[0].childNodes[0].nodeValue;
				
				AmpacheXL.connectResponse.tags = xmlobject.getElementsByTagName("tags")[0].childNodes[0].nodeValue;
				AmpacheXL.connectResponse.api = xmlobject.getElementsByTagName("api")[0].childNodes[0].nodeValue;
			} catch(e) {
				if(debug) this.log(e)
			}
			
			/*
			http://ampache.org/wiki/dev:xmlapi
			
			<root>
				<auth>AUTHENTICATION TOKEN</auth>
				<version>APIVERSION</version>
				<update>Last Update ISO 8601 Date</update>
				<add>Last Add ISO 8601 Date</add>
				<clean>Last Clean ISO 8601 Date</clean>
				<songs>Total # of Songs</songs>
				<artists>Total # of Artists</artists>
				<albums>Total # of Albums</albums>
				<tags>Total # of Tags</tags>
				<videos>Total # of Videos</videos>
			</root>
			
			*/
			
		} else {
			if(debug) this.log("did not find auth, so we got rejected from Ampache");
			
			AmpacheXL.connectResponse.success = false;
		}
		
		if(debug) this.log("connectResponse: "+enyo.json.stringify(AmpacheXL.connectResponse));
		
		this.updateCounts();
		
		this.updateSpinner("amapchexl", true);
		this.dataRequest("amapchexl", "artistsList", "artists", "");
		this.$.rightContent.selectViewByName("artistsList");
		
	},
	ampacheConnectFailure: function(inSender, inResponse) {
		if(debug) this.log("ampacheConnectFailure");
	},
	
	dataRequestResponse: function(inSender, inResponse) {
		//if(debug) this.log("dataRequestResponse: "+inResponse);
		if(debug) this.log("dataRequestResponse");
		
		this.$[this.dataRequestView].dataRequestResponse(inResponse);
		
	},
	dataRequestFailure: function(inSender, inResponse) {
		if(debug) this.log("dataRequestFailure");
		
		this.bannerMessare("amapchexl", "Data request failed", true);
	},
	
});


//asdf