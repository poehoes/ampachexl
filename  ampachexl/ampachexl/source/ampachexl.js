
var AmpacheXL = {};

var debug = true;

AmpacheXL.prefsCookieString = enyo.getCookie("AmpacheXL-prefs");
AmpacheXL.prefsCookie;

enyo.kind({
	name: "AmpacheXL.main",
	kind: "VFlexBox",
	className: "AmpacheXL",
	
	viewMode: "tablet",
	
	dataRequestView: "",
	
	
	components: [
		{kind: "ApplicationEvents", onLoad: "appLoaded", onUnload: "appUnloaded", onError: "appError", onWindowActivated: "windowActivated", onWindowDeactivated: "windowDeactivated", onKeyup: "keypressHandler", onKeydown: "keypressHandler", onKeypress: "keypressHandler", onBack: "backHandler"},
		
		//name: "ampacheConnectService", kind: "WebService", handleAs: "txt", onSuccess: "ampacheConnectResponse", onFailure: "ampacheConnectFailure"},
		{name: "dataRequestService", kind: "WebService", handleAs: "txt", onSuccess: "dataRequestResponse", onFailure: "dataRequestFailure"},
		
		{name: "ampacheConnectService", kind: "WebService", handleAs: "xml", onSuccess: "ampacheConnectResponse", onFailure: "ampacheConnectFailure"},
		//name: "dataRequestService", kind: "WebService", handleAs: "xml", onSuccess: "dataRequestResponse", onFailure: "dataRequestFailure"},
			
		{kind: "AppMenu", components: [
			{caption: "About", onclick: "openAbout"},
			{caption: "Preferences", onclick: "openPreferences"}
		]},
		
		{name: "aboutPopup", kind: "Popup", scrim: true, components: [
			{content: "AmpacheXL", style: "text-align: center; font-size: larger;"},
			{content: "<hr />", allowHtml: true},
			{name: "aboutPopupText", content: "AmpacheXL is a webOS app for Ampache written in the enyo framework and designed for use on a tablet.", style: "text-align: center; font-size: smaller;"},
			{content: "<hr />", allowHtml: true},
			{content: '<a href="http://code.google.com/p/ampachexl/">App homepage</a>', allowHtml: true, style: "text-align: center; font-size: smaller;"},
			{content: "<hr />", allowHtml: true},
			{content: '<a href="http://ampache.org/">Ampache homepage</a>', allowHtml: true, style: "text-align: center; font-size: smaller;"},
			{content: "<hr />", allowHtml: true},
			{kind: "Button", caption: "OK", onclick:"closeAboutPopup"}
		]},
		
		{name: "mainPane", kind: "SlidingPane", flex: 1, onSelectView: "mainPaneViewSelected", components: [
			{name: "leftMenu", className: "leftMenu", components: [
				{name: "leftMenuKind", kind: "LeftMenuKind", flex: 1, onItemSelected: "itemSelected"},
			]},
			{name: "rightContent", className: "rightContent", kind: "Pane", flex: 1, onSelectView: "rightContentViewSelected", onCreateView: "rightContentViewCreated", transitionKind: "enyo.transitions.LeftRightFlyin", components: [	
				{name: "searchSelector", kind: "SearchSelector"},
				
				{name: "artistsList", kind: "ArtistsList", onDataRequest: "dataRequest"},
				{name: "albumsList", kind: "AlbumsList", onDataRequest: "dataRequest"},
				{name: "playlistsList", kind: "PlaylistsList", onDataRequest: "dataRequest"},
				{name: "videosList", kind: "VideosList", onDataRequest: "dataRequest"},
				
				{name: "songsList", kind: "SongsList", onDataRequest: "dataRequest"},
			]},
		]},
		
		{name: "playbackFooter", className: "playbackFooter", kind: "HFlexBox", components: [
			{content: "playbackFooter"},
		]},
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
			
			enyo.setCookie("AmpacheXL-prefs", enyo.json.stringify(AmpacheXL.prefsCookie));
			
		}
			
		enyo.setAllowedOrientation(AmpacheXL.prefsCookie.allowedOrientation);	
		debug = AmpacheXL.prefsCookie.debug;
		
		this.activate();
		
	},
	
	activate: function() {
		if(debug) this.log("activate");
		
		this.ampacheConnect();
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
		
		this.$[inView.name].activate();
	},
	
	itemSelected: function(inSender, inItem) {
		if(debug) this.log("itemSelected: "+inItem);
		
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
		//testing purposes for now.
		
		this.$.ampacheConnectService.setUrl(getAmpacheConnectionUrl(AmpacheXL.prefsCookie.accounts[AmpacheXL.prefsCookie.currentAccountIndex]));
		if(debug) this.log("ampacheConnectService url: "+this.$.ampacheConnectService.getUrl());
		this.$.ampacheConnectService.call();
	},
	ampacheConnectResponse: function(inSender, inResponse) {
		if(debug) this.log("ampacheConnectResponse");
		//if(debug) this.log("ampacheConnectResponse: "+inResponse);
		
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
		
		this.$.leftMenuKind.updateCounts();
		
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
	},
	
});


enyo.kind({
	name: "LeftMenuKind",
	className: "LeftMenuKind",
	kind: "VFlexBox",
	
	events: {
		onItemSelected: "",
	},
		
	
	components: [
		{name: "header", kind: "Toolbar", content: "AmpacheXL"},
		
		{name: "leftMenuScroller", kind: "Scroller", flex: 1, components: [
			{name: "searchItem", kind: "Item", className: "searchItem", layoutKind: "HFlexLayout", onclick: "itemClick", components: [
				{name: "searchTitle", content: "Search", flex: 1},
				{name: "searchCount"},
			]},
			
			{name: "artistsItem", kind: "Item", className: "artistsItem", layoutKind: "HFlexLayout", onclick: "itemClick", components: [
				{name: "artistsTitle", content: "Artists", flex: 1},
				{name: "artistsCount"},
			]},
			{name: "albumsItem", kind: "Item", className: "albumsItem", layoutKind: "HFlexLayout", onclick: "itemClick", components: [
				{name: "albumsTitle", content: "Albums", flex: 1},
				{name: "albumsCount"},
			]},
			{name: "playlistsItem", kind: "Item", className: "playlistsItem", layoutKind: "HFlexLayout", onclick: "itemClick", components: [
				{name: "playlistsTitle", content: "Playlists", flex: 1},
				{name: "playlistsCount"},
			]},
			{name: "videosItem", kind: "Item", className: "videosItem", layoutKind: "HFlexLayout", onclick: "itemClick", components: [
				{name: "videosTitle", content: "Videos", flex: 1},
				{name: "videosCount"},
			]},
			
			{name: "songsItem", kind: "Item", className: "songsItem", layoutKind: "HFlexLayout", onclick: "itemClick", components: [
				{name: "songsTitle", content: "Songs", flex: 1},
				{name: "songsCount"},
			]},
			
			
		]},
		
		{name: "footer", kind: "Toolbar", components: [
			//
		]},
	],
	
	create: function() {
		if(debug) this.log("create");
		this.inherited(arguments);
		
		this.render();
		
		this.$.header.setContent("AmpacheXL");
		
	},
	
	updateCounts: function() {
		if(debug) this.log("updateCounts");
		
		this.$.artistsCount.setContent(AmpacheXL.connectResponse.artists);
		this.$.albumsCount.setContent(AmpacheXL.connectResponse.albums);
		this.$.playlistsCount.setContent(AmpacheXL.connectResponse.playlists);
		this.$.videosCount.setContent(AmpacheXL.connectResponse.videos);
		
		this.$.songsCount.setContent(AmpacheXL.connectResponse.songs);
		
	},
	
	itemClick: function(inSender) {
		if(debug) this.log("itemClick: "+inSender.getName());
		
		switch(inSender.getName()) {
			case "searchItem":
				this.doItemSelected("searchSelector");
				break;
				
			case "artistsItem":
				this.doItemSelected("artistsList");
				break;
			case "albumsItem":
				this.doItemSelected("albumsList");
				break;
			case "playlistsItem":
				this.doItemSelected("playlistsList");
				break;
			case "videosItem":
				this.doItemSelected("videosList");
				break;
				
			case "songsItem":
				this.doItemSelected("songsList");
				break;
		};
		
	},

});
	

enyo.kind({
	name: "SearchSelector",
	kind: "VFlexBox",
	
	components: [
		{name: "header", kind: "Toolbar", content: "SearchSelector"},
		
		{name: "contentScroller", kind: "Scroller", flex: 1, components: [
			{name: "mainContent", flex: 1, content: "content"},
		]},
		
		{name: "footer", kind: "Toolbar", components: [
			//
		]},
	],
	
	activate: function() {
		if(debug) this.log("activate");
	},
	
	dataRequestResponse: function(inResponse) {
		if(debug) this.log("dataRequestResponse");
		
		this.$.mainContent.setContent(inResponse);
	},
	
});

enyo.kind({
	name: "ArtistsList",
	kind: "VFlexBox",
	
	events: {
		onDataRequest: "",
	},
	
	fullResultsList: [],
	
	components: [
		{name: "header", kind: "Toolbar", content: "ArtistsList"},
		
		{name: "contentScroller", kind: "Scroller", flex: 1, components: [
			{name: "mainContent", flex: 1, content: "content"},
		]},
		
		{name: "footer", kind: "Toolbar", components: [
			//
		]},
	],
	
	activate: function() {
		if(debug) this.log("activate");
		
		if(this.$.mainContent.getContent() == "content") {
			this.doDataRequest("artistsList", "artists", "&limit=100");
		}
	},
	
	dataRequestResponse: function(inResponse) {
		if(debug) this.log("dataRequestResponse");
		
		//this.$.mainContent.setContent(inResponse);
		
		this.fullResultsList.length = 0;
		
		var xmlobject = (new DOMParser()).parseFromString(inResponse, "text/xml");
		
		var artistNodes, singleArtistNode, singleArtistChildNode;
		var s = {};
		
		artistsNodes = xmlobject.getElementsByTagName("artist");
		for(var i = 0; i < artistsNodes.length; i++) {
			singleArtistNode = artistsNodes[i];
			s = {};
			
			s.id = singleArtistNode.getAttributeNode("id").nodeValue;
			
			for(var j = 0; j < singleArtistNode.childNodes.length; j++) {
				singleArtistChildNode = singleArtistNode.childNodes[j];
				
				switch(singleArtistChildNode.nodeName) {
					case "name":
						s.name = singleArtistChildNode.childNodes[0].nodeValue;
						break;
					case "albums":
						s.albums = singleArtistChildNode.childNodes[0].nodeValue;
						break;
					case "songs":
						s.songs = singleArtistChildNode.childNodes[0].nodeValue;
						break;
				}
				
			}
		
			this.fullResultsList.push(s);
		
		}
		
		//if(debug) this.log("fullResultsList: "+enyo.json.stringify(this.fullResultsList));
		
		this.$.mainContent.setContent(enyo.json.stringify(this.fullResultsList));
		
		
		/*
		<artist id="12039">
			<name>Metallica</name>
			<albums># of Albums</albums>
			<songs># of Songs</songs>
			<tag id="2481" count="2">Rock & Roll</tag>
			<tag id="2482" count="1">Rock</tag>
			<tag id="2483" count="1">Roll</tag>
			<preciserating>3</preciserating>
			<rating>2.9</rating>
		</artist>
		*/
	},
	
});

enyo.kind({
	name: "AlbumsList",
	kind: "VFlexBox",
	
	events: {
		onDataRequest: "",
	},
	
	fullResultsList: [],
	
	components: [
		{name: "header", kind: "Toolbar", content: "AlbumsList"},
		
		{name: "contentScroller", kind: "Scroller", flex: 1, components: [
			{name: "mainContent", flex: 1, content: "content"},
		]},
		
		{name: "footer", kind: "Toolbar", components: [
			//
		]},
	],
	
	activate: function() {
		if(debug) this.log("activate");
		
		if(this.$.mainContent.getContent() == "content") {
			this.doDataRequest("albumsList", "albums", "&limit=100");
		}
	},
	
	dataRequestResponse: function(inResponse) {
		if(debug) this.log("dataRequestResponse");
		
		//this.$.mainContent.setContent(inResponse);
		
		this.fullResultsList.length = 0;
		
		var xmlobject = (new DOMParser()).parseFromString(inResponse, "text/xml");
		
		var albumsNodes, singleAlbumNode, singleAlbumChildNode;
		var s = {};
		
		albumsNodes = xmlobject.getElementsByTagName("album");
		for(var i = 0; i < albumsNodes.length; i++) {
			singleAlbumNode = albumsNodes[i];
			s = {};
			
			s.id = singleAlbumNode.getAttributeNode("id").nodeValue;
			
			for(var j = 0; j < singleAlbumNode.childNodes.length; j++) {
				singleAlbumChildNode = singleAlbumNode.childNodes[j];
				
				switch(singleAlbumChildNode.nodeName) {
					case "name":
						s.name = singleAlbumChildNode.childNodes[0].nodeValue;
						break;
					case "artist":
						s.artist = singleAlbumChildNode.childNodes[0].nodeValue;
						s.artist_id = singleAlbumChildNode.getAttributeNode("id").nodeValue;
						break;
					case "year":
						s.year = singleAlbumChildNode.childNodes[0].nodeValue;
						break;
					case "tracks":
						s.tracks = singleAlbumChildNode.childNodes[0].nodeValue;
						break;
					case "art":
						s.art = singleAlbumChildNode.childNodes[0].nodeValue;
						break;
				}
				
			}
		
			this.fullResultsList.push(s);
		
		}
		
		//if(debug) this.log("fullResultsList: "+enyo.json.stringify(this.fullResultsList));
		
		this.$.mainContent.setContent(enyo.json.stringify(this.fullResultsList));
		
		
		/*
		<album id="2910">
				<name>Back in Black</name>
				<artist id="129348">AC/DC</artist>
				<year>1984</year>
				<tracks>12</tracks>
				<disk>1</disk>
				<tag id="2481" count="2">Rock & Roll</tag>
				<tag id="2482" count="1">Rock</tag>
				<tag id="2483" count="1">Roll</tag>
				<art>http://localhost/image.php?id=129348</art>
				<preciserating>3</preciserating>
				<rating>2.9</rating>
		</album>
		*/
	},
	
});

enyo.kind({
	name: "PlaylistsList",
	kind: "VFlexBox",
	
	events: {
		onDataRequest: "",
	},
	
	fullResultsList: [],
	
	components: [
		{name: "header", kind: "Toolbar", content: "PlaylistsList"},
		
		{name: "contentScroller", kind: "Scroller", flex: 1, components: [
			{name: "mainContent", flex: 1, content: "content"},
		]},
		
		{name: "footer", kind: "Toolbar", components: [
			//
		]},
	],
	
	activate: function() {
		if(debug) this.log("activate");
		
		if(this.$.mainContent.getContent() == "content") {
			this.doDataRequest("playlistsList", "playlists", "&limit=100");
		}
	},
	
	dataRequestResponse: function(inResponse) {
		if(debug) this.log("dataRequestResponse");
		
		//this.$.mainContent.setContent(inResponse);
		
		this.fullResultsList.length = 0;
		
		var xmlobject = (new DOMParser()).parseFromString(inResponse, "text/xml");
		
		var playlistsNodes, singlePlaylistNode, singlePlaylistChildNode;
		var s = {};
		
		playlistsNodes = xmlobject.getElementsByTagName("playlist");
		for(var i = 0; i < playlistsNodes.length; i++) {
			singlePlaylistNode = playlistsNodes[i];
			s = {};
			
			s.id = singlePlaylistNode.getAttributeNode("id").nodeValue;
			
			for(var j = 0; j < singlePlaylistNode.childNodes.length; j++) {
				singlePlaylistChildNode = singlePlaylistNode.childNodes[j];
				
				switch(singlePlaylistChildNode.nodeName) {
					case "name":
						s.name = singlePlaylistChildNode.childNodes[0].nodeValue;
						break;
					case "owner":
						s.owner = singlePlaylistChildNode.childNodes[0].nodeValue;
						break;
					case "items":
						s.items = singlePlaylistChildNode.childNodes[0].nodeValue;
						break;
					case "type":
						s.type = singlePlaylistChildNode.childNodes[0].nodeValue;
						break;
				}
				
			}
		
			this.fullResultsList.push(s);
		
		}
		
		//if(debug) this.log("fullResultsList: "+enyo.json.stringify(this.fullResultsList));
		
		this.$.mainContent.setContent(enyo.json.stringify(this.fullResultsList));
		
		/*
		<playlist id="1234">
			<name>The Good Stuff</name>
			<owner>Karl Vollmer</owner>
			<items>50</items>
			<tag id="2481" count="2">Rock & Roll</tag>
			<tag id="2482" count="2">Rock</tag>
			<tag id="2483" count="1">Roll</tag>
			<type>Public</type>
		</playlist>
		*/
		
		
	},
	
});

enyo.kind({
	name: "VideosList",
	kind: "VFlexBox",
	
	events: {
		onDataRequest: "",
	},
	
	fullResultsList: [],
	
	components: [
		{name: "header", kind: "Toolbar", content: "VideosList"},
		
		{name: "contentScroller", kind: "Scroller", flex: 1, components: [
			{name: "mainContent", flex: 1, content: "content"},
		]},
		
		{name: "footer", kind: "Toolbar", components: [
			//
		]},
	],
	
	activate: function() {
		if(debug) this.log("activate");
		
		if(this.$.mainContent.getContent() == "content") {
			this.doDataRequest("videosList", "videos", "&limit=100");
		}
	},
	
	dataRequestResponse: function(inResponse) {
		if(debug) this.log("dataRequestResponse");
		
		//this.$.mainContent.setContent(inResponse);
		
		this.fullResultsList.length = 0;
		
		var xmlobject = (new DOMParser()).parseFromString(inResponse, "text/xml");
		
		var videosNodes, singleVideoNode, singleVideoChildNode;
		var s = {};
		
		videosNodes = xmlobject.getElementsByTagName("video");
		for(var i = 0; i < videosNodes.length; i++) {
			singleVideoNode = videosNodes[i];
			s = {};
			
			s.id = singleVideoNode.getAttributeNode("id").nodeValue;
			
			for(var j = 0; j < singleVideoNode.childNodes.length; j++) {
				singleVideoChildNode = singleVideoNode.childNodes[j];
				
				switch(singleVideoChildNode.nodeName) {
					case "name":
						s.name = singleVideoChildNode.childNodes[0].nodeValue;
						break;
					case "title":
						s.title = singleVideoChildNode.childNodes[0].nodeValue;
						break;
					case "mime":
						s.mime = singleVideoChildNode.childNodes[0].nodeValue;
						break;
					case "resolution":
						s.resolution = singleVideoChildNode.childNodes[0].nodeValue;
						break;
					case "size":
						s.size = singleVideoChildNode.childNodes[0].nodeValue;
						break;
					case "url":
						s.url = singleVideoChildNode.childNodes[0].nodeValue;
						break;
				}
				
			}
		
			this.fullResultsList.push(s);
		
		}
		
		//if(debug) this.log("fullResultsList: "+enyo.json.stringify(this.fullResultsList));
		
		this.$.mainContent.setContent(enyo.json.stringify(this.fullResultsList));
		
		/*
		<video id="1234">
			 <title>Futurama Bender's Big Score</title>
			 <mime>video/avi</mime>
			 <resolution>720x288</resolution>
			 <size>Video Filesize in Bytes</size>
			 <tag id="12131" count="3">Futurama</tag>
			 <tag id="32411" count="1">Movie</tag>
			 <url>http://localhost/play/index.php?oid=123908...</url>
		</video>
		*/
		
	},
	
});


enyo.kind({
	name: "SongsList",
	kind: "VFlexBox",
	
	events: {
		onDataRequest: "",
	},
	
	fullResultsList: [],
	
	components: [
		{name: "header", kind: "Toolbar", content: "SongsList"},
		
		{name: "contentScroller", kind: "Scroller", flex: 1, components: [
			{name: "mainContent", flex: 1, content: "content"},
		]},
		
		{name: "footer", kind: "Toolbar", components: [
			//
		]},
	],
	
	activate: function() {
		if(debug) this.log("activate");
		
		if(this.$.mainContent.getContent() == "content") {
			this.doDataRequest("songsList", "songs", "&limit=100");
		}
	},
	
	dataRequestResponse: function(inResponse) {
		if(debug) this.log("dataRequestResponse");
		
		//this.$.mainContent.setContent(inResponse);
		
		this.fullResultsList.length = 0;
		
		var xmlobject = (new DOMParser()).parseFromString(inResponse, "text/xml");
		
		var songsNodes, singleSongNode, singleSongChildNode;
		var s = {};
		
		songsNodes = xmlobject.getElementsByTagName("song");
		for(var i = 0; i < songsNodes.length; i++) {
			singleSongNode = songsNodes[i];
			s = {};
			
			s.id = singleSongNode.getAttributeNode("id").nodeValue;
			
			for(var j = 0; j < singleSongNode.childNodes.length; j++) {
				singleSongChildNode = singleSongNode.childNodes[j];
				
				switch(singleSongChildNode.nodeName) {
					case "title":
						s.title = singleSongChildNode.childNodes[0].nodeValue;
						break;
					case "artist":
						s.artist = singleSongChildNode.childNodes[0].nodeValue;
						s.artist_id = singleSongChildNode.getAttributeNode("id").nodeValue;
						break;
					case "album":
						s.album = singleSongChildNode.childNodes[0].nodeValue;
						s.album_id = singleSongChildNode.getAttributeNode("id").nodeValue;
						break;
					case "track":
						s.track = singleSongChildNode.childNodes[0].nodeValue;
						break;
					case "time":
						s.time = singleSongChildNode.childNodes[0].nodeValue;
						break;
					case "url":
						s.url = singleSongChildNode.childNodes[0].nodeValue;
						break;
					case "size":
						s.size = singleSongChildNode.childNodes[0].nodeValue;
						break;
					case "art":
						s.art = singleSongChildNode.childNodes[0].nodeValue;
						break;
				}
				
			}
		
			this.fullResultsList.push(s);
		
		}
		
		//if(debug) this.log("fullResultsList: "+enyo.json.stringify(this.fullResultsList));
		
		this.$.mainContent.setContent(enyo.json.stringify(this.fullResultsList));
		
		/*
		<song id="3180">
			<title>Hells Bells</title>
			<artist id="129348">AC/DC</artist>
			<album id="2910">Back in Black</album>
			<tag id="2481" count="3">Rock & Roll</tag>
			<tag id="2482" count="1">Rock</tag>
			<tag id="2483" count="1">Roll</tag>
			<track>4</track>
			<time>234</time>
			<url>http://localhost/play/index.php?oid=123908...</url>
			<size>Song Filesize in Bytes</size>
			<art>http://localhost/image.php?id=129348</art>
			<preciserating>3</preciserating>
			<rating>2.9</rating>
		</song>
		*/
		
	},
	
});



//asdf