
var AmpacheXL = {};

var debug = false;

AmpacheXL.prefsCookieString = enyo.getCookie("AmpacheXL-prefs");
AmpacheXL.prefsCookie;

AmpacheXL.connected = false;

AmpacheXL.nowplaying = [];
AmpacheXL.allArtists = [];
AmpacheXL.allAlbums = [];
AmpacheXL.allPlaylists = [];
AmpacheXL.allVideos = [];

AmpacheXL.currentSong = {};

enyo.kind({
	name: "AmpacheXL.main",
	kind: "VFlexBox",
	className: "AmpacheXL",
	
	viewMode: "tablet",
	
	currentRightPane: "hosts",
	
	dataRequestView: "",
	bannerMessageId: "",
	
	components: [
		{kind: "ApplicationEvents", onLoad: "appLoaded", onUnload: "appUnloaded", onError: "appError", onWindowActivated: "windowActivated", onWindowDeactivated: "windowDeactivated", onBack: "backHandler", onWindowParamsChange: "windowParamsChangeHandler"},
		
		{name: "ampacheConnectService", kind: "WebService", handleAs: "xml", onSuccess: "ampacheConnectResponse", onFailure: "ampacheConnectFailure"},
		//name: "dataRequestService", kind: "WebService", handleAs: "xml", onSuccess: "dataRequestResponse", onFailure: "dataRequestFailure"},
		{name: "dataRequestService", kind: "WebService", handleAs: "txt", onSuccess: "dataRequestResponse", onFailure: "dataRequestFailure"},
		{name: "pingService", kind: "WebService", handleAs: "xml", onSuccess: "ampachePingResponse", onFailure: "ampachePingFailure"},
			
		{kind: "AppMenu", components: [
			{caption: "About", onclick: "openAbout"},
			{caption: "Disconnect", onclick: "disconnect"},
			{caption: "Preferences", onclick: "openPreferences"},
			{caption: "Help", components: [
				{caption: "Open in browser", onclick: "openBrowser"},
				{caption: "Email Developer", onclick: "emailDeveloper"},
			]},
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
		
		{name: "loadingPopup", kind: "Popup", lazy: false, scrim: true, dismissWithClick: true, dismissWithEscape: true, components: [
			{kind: "HFlexBox", align: "center", pack: "center", components: [
				{kind: "SpinnerLarge"},
			]},
		]},
		
		{name: "preferencesPopup", kind: "Popup", scrim: true, onBeforeOpen: "beforePreferencesOpen", components: [
			{name: "preferencesHeader", style: "text-align: center;"},
			{content: "<hr/>", allowHtml: true},
			{kind: "Item", align: "center", tapHighlight: false, layoutKind: "HFlexLayout", components: [
				{content: "Automatically connect to server on app open&nbsp;&nbsp;&nbsp;", allowHtml: true, flex: 1},
				{name: "autoLogin", kind: "ToggleButton", onChange: "autoLoginToggle"},
			]},
			{kind: "Item", align: "center", tapHighlight: false, layoutKind: "HFlexLayout", components: [
				{name: "startingPane", kind: "ListSelector", label: "Starting view after login", onChange: "startingPaneSelect", flex: 1, items: [
					{caption: "Random", value: "random"},
					{caption: "Artists", value: "artistsList"},
					{caption: "Albums", value: "albumsList"},
					{caption: "Playlists", value: "playlistsList"},
				]},
			]},
			{kind: "Item", align: "center", tapHighlight: false, layoutKind: "HFlexLayout", components: [
				{name: "defaultAction", kind: "ListSelector", label: "Default Action", onChange: "defaultActionSelect", flex: 1, items: [
					{caption: "Play all", value: "play[]:[]all[]:[]straight"},
					{caption: "Play all, shuffled", value: "play[]:[]all[]:[]shuffled"},
					{caption: "Play single song", value: "play[]:[]single[]:[]straight"},
					{caption: "Queue all", value: "queue[]:[]all[]:[]straight"},
					{caption: "Queue all, shuffled", value: "queue[]:[]all[]:[]shuffled"},
					{caption: "Queue single song", value: "queue[]:[]single[]:[]straight"},
				]},
			]},
			{kind: "Item", align: "center", tapHighlight: false, layoutKind: "HFlexLayout", components: [
				{name: "nowPlayingEnd", kind: "ListSelector", label: "When playback ends", onChange: "nowPlayingEndSelect", flex: 1, items: [
					{caption: "Stop", value: "stop[]:[]straight"},
					{caption: "Play again", value: "play[]:[]straight"},
					{caption: "Play again, shuffled", value: "play[]:[]shuffled"},
				]},
			]},
			{kind: "Item", align: "center", tapHighlight: false, layoutKind: "HFlexLayout", components: [
				{content: "Dashboard playback controls", flex: 1},
				{name: "dashboardPlayer", kind: "ToggleButton", onChange: "dashboardPlayerToggle"},
			]},
			{kind: "Item", align: "center", tapHighlight: false, layoutKind: "HFlexLayout", components: [
				{name: "theme", kind: "ListSelector", label: "Theme", onChange: "themeSelect", flex: 1, items: [
					{caption: "Dark", value: "dark"},
				]},
			]},
			{kind: "Item", align: "center", tapHighlight: false, layoutKind: "HFlexLayout", components: [
				{content: "Show album art on lists", flex: 1},
				{name: "artOnLists", kind: "ToggleButton", onChange: "artOnListsToggle"},
			]},
			{kind: "Item", align: "center", tapHighlight: false, layoutKind: "HFlexLayout", components: [
				{content: "Usage statitistics with Metrix", flex: 1},
				{name: "allowMetrix", kind: "ToggleButton", onChange: "allowMetrixToggle"},
			]},
			{kind: "Item", align: "center", tapHighlight: false, layoutKind: "HFlexLayout", components: [
				{content: "Debug mode", flex: 1},
				{name: "debug", kind: "ToggleButton", onChange: "debugToggle"},
			]},
			{kind: "Button", caption: "Save", onclick:"saveNewPreferences"}
		]},
		
		{name: "searchPopup", kind: "Popup", scrim: true, onBeforeOpen: "beforeSearchOpen", onOpen: "searchOpen", showKeyboardWhenOpening: true, components: [
			{name: "searchHeader", content: "Search", style: "text-align: center;"},
			{name: "searchInput", kind: "Input", autoCapitalize: "lowercase"},
			{name: "artistsSearch", caption: "Artists", kind: "Button", className: "searchButton", onclick: "searchClick"},
			{name: "albumsSearch", caption: "Albums", kind: "Button", className: "searchButton", onclick: "searchClick"},
			{name: "playlistsSearch", caption: "Playlists", kind: "Button", className: "searchButton", onclick: "searchClick"},
			{name: "songsSearch", caption: "Songs", kind: "Button", className: "searchButton", onclick: "searchClick"},
			{name: "allSearch", caption: "All of the above", kind: "Button", className: "searchButton", onclick: "searchClick"},
		]},
		
		{name: "dashboard", kind:"Dashboard", onMessageTap: "messageTap", onIconTap: "iconTap", onUserClose: "dashboardClose"},
		
		{name: "mainPane", kind: "HFlexBox", kind2: "SlidingPane", flex: 1, onSelectView: "mainPaneViewSelected", components: [
			{name: "leftMenu", className: "leftMenu", width: "300px", layoutKind: "VFlexLayout", components: [
				
				{name: "leftMenuKind", kind: "LeftMenuKind", flex: 1, onViewSelected: "viewSelected", onDataRequest: "dataRequest", onUpdateSpinner: "updateSpinner", onBannerMessage: "bannerMessage", onOpenAppMenu: "openAppMenu"},
				
				{name: "playback", kind: "Playback", onViewSelected: "viewSelected", onDataRequest: "dataRequest", onUpdateSpinner: "updateSpinner", onPreviousTrack: "previousTrack", onNextTrack: "nextTrack", onBannerMessage: "bannerMessage", onUpdatePlaybackStatus: "updatePlaybackStatus"},
			
			]},
			{name: "rightContent", className: "rightContent", kind: "Pane", flex: 1, onSelectView: "rightContentViewSelected", onCreateView: "rightContentViewCreated", transitionKind: "enyo.transitions.Simple", components: [	
				
				{name: "hosts", kind: "Hosts", onViewSelected: "viewSelected", onDataRequest: "dataRequest", onUpdateSpinner: "updateSpinner", onPlaySong: "playSong", onBannerMessage: "bannerMessage", onUpdateCounts: "updateCounts", onAmpacheConnect: "ampacheConnect", onSavePreferences: "savePreferences"},
				
				{name: "nowplaying", kind: "Nowplaying", onViewSelected: "viewSelected", onDataRequest: "dataRequest", onUpdateSpinner: "updateSpinner", onPlaySong: "playSong", onBannerMessage: "bannerMessage", onUpdateCounts: "updateCounts"},
				
				{name: "random", kind: "Random", onViewSelected: "viewSelected", onDataRequest: "dataRequest", onUpdateSpinner: "updateSpinner", onBannerMessage: "bannerMessage"},
				
				{name: "artistsList", kind: "ArtistsList", onViewSelected: "viewSelected", onDataRequest: "dataRequest", onUpdateSpinner: "updateSpinner", onBannerMessage: "bannerMessage"},
				{name: "albumsList", kind: "AlbumsList", onViewSelected: "viewSelected", onDataRequest: "dataRequest", onUpdateSpinner: "updateSpinner", onBannerMessage: "bannerMessage"},
				{name: "playlistsList", kind: "PlaylistsList", onViewSelected: "viewSelected", onDataRequest: "dataRequest", onUpdateSpinner: "updateSpinner", onBannerMessage: "bannerMessage"},
				
				{name: "songsList", kind: "SongsList", onViewSelected: "viewSelected", onDataRequest: "dataRequest", onUpdateSpinner: "updateSpinner", onPlaySong: "playSong", onBannerMessage: "bannerMessage", onNowplayingUpdated: "nowplayingUpdated"},
				
				{name: "videosList", kind: "VideosList", onViewSelected: "viewSelected", onDataRequest: "dataRequest", onUpdateSpinner: "updateSpinner", onBannerMessage: "bannerMessage"},
				
			]},
		]},
		
	],
	
	create: function() {
		if(debug) this.log("create");
		this.inherited(arguments);
		
		enyo.keyboard.setResizesWindow(false);
		
		AmpacheXL.Metrix = new Metrix(); 
		
		if((AmpacheXL.prefsCookieString)&&(true)) {
		
			if(debug) this.log("we have cookie");
			AmpacheXL.prefsCookie = enyo.json.parse(AmpacheXL.prefsCookieString);
			
			if(AmpacheXL.prefsCookie.allowMetrix) setTimeout(enyo.bind(this,"submitMetrix"),10000);
			
			if(AmpacheXL.prefsCookie.autoLogin) setTimeout(enyo.bind(this,"ampacheConnect"),50);
			
		} else {
		
			if(debug) this.log("we don't have cookie");
			AmpacheXL.prefsCookie = defaultCookie();
			
			setTimeout(enyo.bind(this, "openAbout"),150);
			
		}
		
		this.savePreferences();
			
		enyo.setAllowedOrientation(AmpacheXL.prefsCookie.allowedOrientation);	
		debug = AmpacheXL.prefsCookie.debug;
		
		//this.activate();
		
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
		
		AmpacheXL.Metrix.checkBulletinBoard(10, false);
		
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
		
		AmpacheXL.currentSong = {};
		
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
		clearInterval(AmpacheXL.pingInterval);
	},
	openPreferences: function() {
		if(debug) this.log("openPreferences");
		
		this.$.preferencesPopup.openAtCenter();
	},
	beforePreferencesOpen: function() {
		if(debug) this.log("beforePreferencesOpen");
		
		var appInfo = enyo.fetchAppInfo();
		this.$.preferencesHeader.setContent(appInfo.title+" - "+appInfo.version);
		
		this.$.autoLogin.setState(AmpacheXL.prefsCookie.autoLogin);
		this.$.startingPane.setValue(AmpacheXL.prefsCookie.startingPane);
		this.$.defaultAction.setValue(AmpacheXL.prefsCookie.defaultAction);
		this.$.nowPlayingEnd.setValue(AmpacheXL.prefsCookie.nowPlayingEnd);
		this.$.dashboardPlayer.setState(AmpacheXL.prefsCookie.dashboardPlayer);
		this.$.theme.setValue(AmpacheXL.prefsCookie.theme);
		this.$.artOnLists.setState(AmpacheXL.prefsCookie.artOnLists);
		this.$.allowMetrix.setState(AmpacheXL.prefsCookie.allowMetrix);
		this.$.debug.setState(AmpacheXL.prefsCookie.debug);
			
	},
	saveNewPreferences: function() {
		if(debug) this.log("saveNewPreferences");
		
		AmpacheXL.prefsCookie.autoLogin = this.$.autoLogin.getState();
		AmpacheXL.prefsCookie.startingPane = this.$.startingPane.getValue();
		AmpacheXL.prefsCookie.defaultAction = this.$.defaultAction.getValue();
		AmpacheXL.prefsCookie.nowPlayingEnd = this.$.nowPlayingEnd.getValue();
		AmpacheXL.prefsCookie.dashboardPlayer = this.$.dashboardPlayer.getState();
		AmpacheXL.prefsCookie.theme = this.$.theme.getValue();
		AmpacheXL.prefsCookie.artOnLists = this.$.artOnLists.getState();
		AmpacheXL.prefsCookie.allowMetrix = this.$.allowMetrix.getState();
		AmpacheXL.prefsCookie.debug = this.$.debug.getState();
		
		
		debug = this.$.debug.getState();
		
		this.savePreferences();
		this.$.preferencesPopup.close();
		
	},
	openBrowser: function() {
		if(debug) this.log("openBrowser") 
		
		window.open(AmpacheXL.prefsCookie.accounts[AmpacheXL.prefsCookie.currentAccountIndex].url);
	},	
	emailDeveloper: function() {
		if(debug) this.log("emailDeveloper") 
		
		var appInfo = enyo.fetchAppInfo();
		
		window.open("mailto:ampachexl.help@gmail.com?subject=AmpacheXL Help - v"+appInfo.version);
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
	
	doBannerMessage: function(inMessage, forcePopup) {
		this.bannerMessage("amapchexl", inMessage, forcePopup);
	},
	bannerMessage: function(inSender, inMessage, forcePopup) {
		if(debug) this.log("bannerMessage: "+inMessage);
		
		if(inMessage == "Error: Session Expired") this.disconnect();
		
		if((forcePopup)||(!window.PalmSystem)){
			this.bannerMessageText = inMessage;
			this.$.bannerMessagePopup.openAtCenter();
		} else {
			try {
				enyo.windows.removeBannerMessage(this.bannerMessageId);
			} catch(e) {
				this.error(e);
			}
			
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
	openAppMenu: function() {
		if(debug) this.log("openAppMenu");
		
		this.$.appMenu.open();
	},
	viewSelected: function(inSender, inItem) {
		if(debug) this.log("viewSelected: "+inItem);
		
		this.updateCounts();
		
		if(inItem == "searchSelector") {
			this.$.searchPopup.openAtCenter();
		} else {
			this.$.rightContent.selectViewByName(inItem);
		}
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
		
		try {
			enyo.windows.setWindowParams(this.dashWindow, inSongObject);
		} catch(e) {
			if(debug) this.log(e);
		}
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
	nowplayingUpdated: function(inSender, inPlayAction) {
		if(debug) this.log("nowplayingUpdated: "+inPlayAction) 
		
		this.$.nowplaying.nowplayingUpdated(inPlayAction);
	},
	updatePlaybackStatus: function() {
		if(debug) this.log("updatePlaybackStatus");
		
		try {
			enyo.windows.setWindowParams(this.dashWindow, AmpacheXL.currentSong);
		} catch(e) {
			if(debug) this.log(e);
		}
		
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
		
		this.$[this.currentRightPane].resize();
		
	},
	windowActivated: function() {
		if(debug) this.log("windowActivated");
		
		try {
			//if(this.doneFirstActivated) enyo.windows.setWindowParams(this.dashWindow, {close: true});
			if(this.doneFirstActivated) this.dashWindow.close();
			
			this.doneFirstActivated = true;
			
		} catch(e) {
			this.error(e);
		}
	},
	windowDeactivated: function() {
		if(debug) this.log("windowDeactivated");
		
		if((AmpacheXL.prefsCookie.dashboardPlayer)&&(AmpacheXL.currentSong)) this.dashWindow = enyo.windows.openDashboard("dashboard.html", "dashWindowName", AmpacheXL.currentSong, {clickableWhenLocked: true});
		
	},
	windowParamsChangeHandler: function() {
		if(debug) this.log("windowParamsChangeHandler: "+enyo.json.stringify(enyo.windowParams))
		
		switch(enyo.windowParams.playAction) {
			case "previous":
				this.previousTrack();
				break;
			case "next":
				this.nextTrack();
				break;
			case "play":
				this.$.playback.playClick();
				break;
			case "pause":
				this.$.playback.pauseClick();
				break;
		}
		
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
		
		try {
		
			if(xmlobject.getElementsByTagName("auth").length > 0) {
				if(debug) this.log("found auth field in XML so we have valid response");
				
				AmpacheXL.connectResponse.success = true;
				
				try {
				
					//AmpacheXL.prefsCookie.newAuth = xmlobject.getElementsByTagName("auth")[0].childNodes[0].nodeValue;
				
					AmpacheXL.connectResponse.auth = xmlobject.getElementsByTagName("auth")[0].childNodes[0].nodeValue;
					AmpacheXL.connectResponse.update = xmlobject.getElementsByTagName("update")[0].childNodes[0].nodeValue;
					AmpacheXL.connectResponse.add = xmlobject.getElementsByTagName("add")[0].childNodes[0].nodeValue;
					AmpacheXL.connectResponse.clean = xmlobject.getElementsByTagName("clean")[0].childNodes[0].nodeValue;
					AmpacheXL.connectResponse.songs = xmlobject.getElementsByTagName("songs")[0].childNodes[0].nodeValue;
					AmpacheXL.connectResponse.artists = xmlobject.getElementsByTagName("artists")[0].childNodes[0].nodeValue;
					AmpacheXL.connectResponse.albums = xmlobject.getElementsByTagName("albums")[0].childNodes[0].nodeValue;
					AmpacheXL.connectResponse.playlists = xmlobject.getElementsByTagName("playlists")[0].childNodes[0].nodeValue;
					AmpacheXL.connectResponse.videos = xmlobject.getElementsByTagName("videos")[0].childNodes[0].nodeValue;
					
					if(debug) this.log("finshied most of connection parsing.  now trying tags and api");
					
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
				
				//if(debug) this.log("connectResponse: "+enyo.json.stringify(AmpacheXL.connectResponse));
				
				this.updateCounts();
				
				switch(AmpacheXL.prefsCookie.startingPane) {
					case "random":
						this.$.rightContent.selectViewByName("random");
						break;
					case "artistsList":
						this.updateSpinner("AmpacheXL", true);
						this.dataRequest("AmpacheXL", "artistsList", "artists", "");
						this.$.rightContent.selectViewByName("artistsList");
						break;
					case "albumsList":
						this.updateSpinner("AmpacheXL", true);
						this.dataRequest("AmpacheXL", "albumsList", "albums", "");
						this.$.rightContent.selectViewByName("albumsList");
						break;
					case "playlistsList":
						this.updateSpinner("AmpacheXL", true);
						this.dataRequest("AmpacheXL", "playlistsList", "playlists", "");
						this.$.rightContent.selectViewByName("playlistsList");
						break;
					//more here
					default: 
						this.updateSpinner("AmpacheXL", true);
						this.dataRequest("AmpacheXL", "artistsList", "artists", "");
						this.$.rightContent.selectViewByName("artistsList");
						break;
				}
				
			} else {
			
				if(debug) this.log("did not find auth, so we got rejected from Ampache");
				
				AmpacheXL.connectResponse.success = false;
				
				var errorNodes, singleErrorNode;
				errorNodes = xmlobject.getElementsByTagName("error");
				for(var i = 0; i < errorNodes.length; i++) {
					singleErrorNode = errorNodes[i];
					
					this.doBannerMessage(singleErrorNode.childNodes[0].nodeValue, true);
					
				}
				
			}
			
			AmpacheXL.pingInterval = setInterval(enyo.bind(this, "ampachePing"),5000);
		
		} catch(e) {
		
			this.error(e);
			
			this.doBannerMessage("Could not connect to ampache.  Check you settings.", true);
			
		}
		
	},
	ampacheConnectFailure: function(inSender, inResponse) {
		if(debug) this.log("ampacheConnectFailure");
		
		this.bannerMessage("amapchexl", "Failed to connect to AmpacheXL.  Check your settings.", true);
	},
	
	ampachePing: function() {
		if(debug) this.log("ampachePing") 
		
		var requestUrl = AmpacheXL.prefsCookie.accounts[AmpacheXL.prefsCookie.currentAccountIndex].url;
		requestUrl += "/server/xml.server.php?";
		requestUrl += "auth="+AmpacheXL.connectResponse.auth;
		requestUrl += "&action=ping";
		
		this.$.pingService.setUrl(requestUrl);
		if(debug) this.log("pingService url: "+this.$.pingService.getUrl());
		this.$.pingService.call();
		
	},
	ampachePingResponse: function(inSender, inResponse) {
		if(debug) this.log("ampachePingResponse");
		
		clearInterval(AmpacheXL.pingInterval);
		
		var xmlobject = inResponse;
		
		var rootNodes, singleRootNode, singleRootChildNode;
		var s = {};
		
		rootNodes = xmlobject.getElementsByTagName("root");
		for(var i = 0; i < rootNodes.length; i++) {
			singleRootNode = rootNodes[i];
			
			for(var j = 0; j < singleRootNode.childNodes.length; j++) {
				singleRootChildNode = singleRootNode.childNodes[j];
				
				switch(singleRootChildNode.nodeName) {
					case "session_expire":
						AmpacheXL.session_expire = singleRootChildNode.childNodes[0].nodeValue;
						break;
					case "server":
						AmpacheXL.prefsCookie.server = singleRootChildNode.childNodes[0].nodeValue;
						break;
					case "version":
						AmpacheXL.prefsCookie.version = singleRootChildNode.childNodes[0].nodeValue;
						break;
					case "compatible":
						AmpacheXL.prefsCookie.compatible = singleRootChildNode.childNodes[0].nodeValue;
						break;
				}
				
			}
		
		}
		
		var expiresUTC = Date.parse(AmpacheXL.session_expire);
		var currentTime = new Date();
		var currentUTC = currentTime.getTime();
		var timeRemaining = expiresUTC - currentUTC;
		timeRemaining *= 0.45;
		
		if(debug) this.log("ping session expires "+AmpacheXL.session_expire+" so we will ping in "+parseInt(timeRemaining/1000)+" seconds");
		
		//Set minimum ping time to 10 minutes
		AmpacheXL.pingInterval = setInterval(enyo.bind(this, "ampachePing"),parseInt(Math.max(timeRemaining,600000)));
		
	},
	ampachePingFailure: function(inSender) {
		if(debug) this.log("ampachePingFailure");
		
	},
	
	dataRequestResponse: function(inSender, inResponse) {
		//if(debug) this.log("dataRequestResponse: "+inResponse);
		if(debug) this.log("dataRequestResponse");
		
		this.$[this.dataRequestView].dataRequestResponse(inResponse);
		
	},
	dataRequestFailure: function(inSender, inResponse) {
		if(debug) this.log("dataRequestFailure");
		
		this.bannerMessare("AmpacheXL", "Data request failed", true);
	},
	
	beforeSearchOpen: function() {
		if(debug) this.log("beforeSearchOpen");
		
		this.$.searchInput.setValue("");
	},
	searchOpen: function() {
		if(debug) this.log("searchOpen");
		
		this.$.searchInput.forceFocusEnableKeyboard();
	},
	searchClick: function(inSender) {
		if(debug) this.log("searchClick: "+inSender.getName());
		
		switch(inSender.getName()) {
			case "artistsSearch":
				this.updateSpinner("amapchexl", true);
				this.dataRequest("amapchexl", "artistsList", "artists", "&filter="+this.$.searchInput.getValue());
				this.viewSelected("amapchexl", "artistsList");
				break;
			case "albumsSearch":
				AmpacheXL.selectedArtist = {};
				AmpacheXL.selectedArtist.name = this.$.searchInput.getValue();
				AmpacheXL.selectedArtist.type = "artistSearch";
				this.updateSpinner("amapchexl", true);
				this.dataRequest("amapchexl", "albumsList", "albums", "&filter="+this.$.searchInput.getValue());
				this.viewSelected("amapchexl", "albumsList");
				break;
			case "playlistsSearch":
				this.updateSpinner("amapchexl", true);
				this.dataRequest("amapchexl", "playlistsList", "playlists", "&filter="+this.$.searchInput.getValue());
				this.viewSelected("amapchexl", "playlistsList");
				break;
			case "songsSearch":
				this.updateSpinner("amapchexl", true);
				this.dataRequest("amapchexl", "songsList", "songs", "&filter="+this.$.searchInput.getValue());
				this.viewSelected("amapchexl", "songsList");
				break;
			case "allSearch":
				this.updateSpinner("amapchexl", true);
				this.dataRequest("amapchexl", "songsList", "search_songs", "&filter="+this.$.searchInput.getValue());
				this.viewSelected("amapchexl", "songsList");
				break;
				
		}
		
		this.$.searchPopup.close();
		
		enyo.keyboard.setManualMode(false);
		
	},
	
});