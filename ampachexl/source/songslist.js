/*
 *   AmpacheXL - A webOS app for Ampache written in the enyo framework and designed for use on a tablet. 
 *   http://code.google.com/p/ampachexl/
 *   Copyright (C) 2011  Wes Brown
 *
 *   This program is free software; you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation; either version 2 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License along
 *   with this program; if not, write to the Free Software Foundation, Inc.,
 *   51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */


enyo.kind({
	name: "SongsList",
	kind: "VFlexBox",
	className: "SongsList listContent",
	
	events: {
		onViewSelected: "",
		onDataRequest: "",
		onUpdateSpinner: "",
		onOpenWeb: "",
		onPlaySong: "",
		onBannerMessage: "",
		onNowplayingUpdated: "",
		onPreviousView: "",
		onSavePreferences: "",
	},
	
	fullResultsList: [],
	resultsList: [],
	
	selectedSong: {},
	selectedIndex: -1,
	
	songsMouseTimer: "",
	
	sqlArray: [],
	
	components: [
		{name: "allSongsRequestService", kind: "WebService", handleAs: "txt", onSuccess: "allSongsRequestResponse", onFailure: "allSongsRequestFailure"},
		
		{name: "header", kind: "Toolbar", layoutKind: "VFlexLayout", onclick: "headerClick", components: [
			{name: "headerTitle", kind: "Control", content: "Songs", className: "headerTitle"},
			{name: "headerSubtitle", kind: "Control", className: "headerSubtitle"},
		]},
		
		{name: "songsSearchInputWrapper", className: "searchInputWrapper", kind: "Item", layoutKind: "HFlexLayout", components: [
			{name: "songsSearchInput", kind: "Input", autoCapitalize: "lowercase", hint: "Filter", oninput: "songsInput", flex: 1, components: [
				{name: "songsSearchClear", kind: "Image", src: "images/11-x@2x.png", showing: false, className: "searchClear", onclick: "resetSongsSearch"},
				{name: "songsSearchSpinner", kind: "Spinner"},
			]}
		]},
							
		{name: "songsVirtualList", kind: "ScrollerVirtualList", onSetupRow: "setupSongsItem", flex: 1, components: [
			//{name: "songsDivider", kind: "Divider"},
			{name: "songsItem", kind: "Item", className: "listItem", layoutKind: "HFlexLayout", align: "center", components: [
				{name: "listArt", kind: "Image", onclick2: "songsClick", onmousedown: "songsMousedown", onmouseup: "songsMouseup", className: "listArt"},
				{kind: "VFlexBox", flex: 1, onclick2: "songsClick", onmousedown: "songsMousedown", onmouseup: "songsMouseup", components: [
					{name: "songsTitle", className: "title"},
					{name: "songsArtist", className: "subtitle"},
				]},
				{kind: "VFlexBox", onclick2: "songsClick", onmousedown: "songsMousedown", onmouseup: "songsMouseup", components: [
					{name: "songsAlbum", className: "count"},
					{name: "songsTrack", className: "count"},
				]},
				//name: "songsMoreButton", kind: "Button", caption: "...", onclick: "songsMoreClick"},
				//name: "songsMoreIcon", kind: "Image", src: "images/16-play@2x-light.png", className: "songsMoreIcon", onclick: "songsMoreClick"},
			]},
		]},
		
		{name: "footer", kind: "Toolbar", components: [
			{name: "backCommandIcon", kind: "Control", className: "backCommandIcon", onclick: "doPreviousView"},
			{kind: "Spacer"},
			{name: "refreshCommandButton", icon: "images/menu-icon-refresh.png", onclick: "getSongs"},
			{kind: "Spacer"},
			{name: "backCommandIconSpacer", kind: "Control", className: "backCommandIconSpacer"},
		]},
		
		{name: "morePopupMenu", kind: "PopupSelect", className: "morePopupMenu", scrim: true, onBeforeOpen2: "beforeMoreOpen", onSelect: "moreSelect", onClose: "moreClosed", components: [
			//
		]},
	],
	
	create: function() {
		if(debug) this.log("create");
		this.inherited(arguments);
	},
	
	activate: function() {
		if(debug) this.log("activate");
		
		if(this.fullResultsList.length == 0) {
			//this.getSongs();
			this.fullResultsList = AmpacheXL.allSongs.concat([]);
			//this.resetSongsSearch();
			this.$.songsVirtualList.punt();
		}
		
		this.resize();
		
		/*
		if(AmpacheXL.selectedAlbum) {
			this.$.headerSubtitle.setContent(AmpacheXL.selectedAlbum.name);
		} else {
			this.$.headerSubtitle.setContent("All Artists");
		}
		*/
	},
	resize: function() {
		if(debug) this.log("resize");
		
		this.$.songsVirtualList.resized();
	},
	dataRequestResponse: function(inResponse) {
		if(debug) this.log("dataRequestResponse");
		
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
		
		this.fullResultsList.length = 0;
		
		var xmlobject = (new DOMParser()).parseFromString(inResponse, "text/xml");
		
		var songsNodes, singleSongNode, singleSongChildNode;
		var s = {};
		
		//fix timeout error here - https://developer.palm.com/distribution/viewtopic.php?f=11&t=10561
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
						s.track = parseInt(singleSongChildNode.childNodes[0].nodeValue);
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
		
			s.type = "song";
			
			this.fullResultsList.push(s);
			
			//if(debug) this.log("added song to list. curent length = "+this.fullResultsList.length);
		
		}
		
		//if(debug) this.log("fullResultsList: "+enyo.json.stringify(this.fullResultsList));
		
		//this.fullResultsList.sort(sort_by("title", false));
		
		/*if((this.fullResultsList.length == AmpacheXL.connectResponse.songs)||(this.fullResultsList.length == 5000)) {
			if(debug) this.log("was all songs, now saving");
		
			AmpacheXL.allSongs = this.fullResultsList.concat([]);
			
			AmpacheXL.prefsCookie.oldSongsAuth  = AmpacheXL.connectResponse.auth;
			window.localStorage.setItem("allSongs", "[]");
			
			try {
				window.localStorage.setItem("allSongs", enyo.json.stringify(AmpacheXL.allSongs));
			} catch(e) {
				this.error(e);
				window.localStorage.setItem("allSongs", "[]");
			}
		}*/
		
		//if(debug) this.log("fullResultsList: "+enyo.json.stringify(this.fullResultsList));
		
		this.resetSongsSearch();
		
	},
	allSongs: function() {
		if(debug) this.log("allSongs AmpacheXL.allSongs.length: "+AmpacheXL.allSongs.length+" AmpacheXL.connectResponse.songs: "+AmpacheXL.connectResponse.songs+" AmpacheXL.prefsCookie.oldSongsCount: "+AmpacheXL.prefsCookie.oldSongsCount);
		
		this.fullResultsList.length = 0;
		this.resultsList.length = 0;
		
		if(AmpacheXL.allSongs.length == AmpacheXL.connectResponse.songs) {
		
			this.fullResultsList = AmpacheXL.allSongs.concat([]);
			
			this.resetSongsSearch();
		
		} else if(AmpacheXL.prefsCookie.oldSongsCount == AmpacheXL.connectResponse.songs) {
			if(debug) this.log("have correct number of saved songs in DB");
			
			this.doUpdateSpinner(true);
			
			this.resultsList.splice(0,0,{title: "Loading locally saved "+AmpacheXL.connectResponse.songs+" songs", artist: "", album: "", track: AmpacheXL.connectResponse.songs, url: "", art: ""});
			this.$.songsVirtualList.punt();
			
			//html5sql.process("SELECT * FROM songs;", enyo.bind(this, "selectSuccess"), enyo.bind(this, "selectFailure"));
			//html5sql.process("SELECT * FROM songs;", function(transaction, results) { console.log("results: "+results); enyo.bind(this, "selectSuccess", transaction, results); }, enyo.bind(this, "selectFailure"));
			//html5sql.process({ "sql": "SELECT * FROM songs; ", "data": [], "success": function(transaction, results) {enyo.bind(this, "selectResults", transaction, results)}}, enyo.bind(this, "selectSuccess"), enyo.bind(this, "selectFailure"));
			html5sql.database.transaction(function(tx) {    
				tx.executeSql('SELECT * FROM songs', 
					[], 
					enyo.bind(this, "selectResults"), 
					enyo.bind(this, "selectFailure") 
				);
			}.bind(this));
			
		} else {
			this.getSongs();
		}
	},
	localplaylistSongs: function(inPlaylistId, inAuth) {
		if(debug) this.log("localplaylistSongs: "+inPlaylistId+" "+inAuth);
	
		this.localPlaylistId = inPlaylistId;
		this.localPlaylistAuth = inAuth;
		
		html5sql.database.transaction(function(tx) {    
			tx.executeSql('SELECT * FROM localplaylist_songs WHERE playlist_id = ?', 
				[this.localPlaylistId], 
				enyo.bind(this, "selectLocalplaylistSongsResults"), 
				enyo.bind(this, "selectLocalplaylistSongsFailures") 
			);
		}.bind(this));
	
	},
	
	
	getSongs: function() {
		if(debug) this.log("getSongs");
		
		this.doUpdateSpinner(true);
		//this.doDataRequest("songsList", "songs", "&limit="+AmpacheXL.connectResponse.songs);
		
		AmpacheXL.prefsCookie.oldSongsCount = 0;
		
		html5sql.process("DELETE FROM songs;", enyo.bind(this, "truncateSuccess"), enyo.bind(this, "truncateFailure"));
		this.sqlArray.length = 0;
		
		this.fullResultsList.length = 0;
		this.resultsList.length = 0;
		
		this.$.headerSubtitle.setContent("0 songs");
		
		this.$.songsVirtualList.punt();
		
		this.resultsList.push({title: "Attempting to get "+AmpacheXL.connectResponse.songs+" songs", artist: "", album: "", track: AmpacheXL.connectResponse.songs, url: "", art: ""});
		this.$.songsVirtualList.punt();
			
		//this.allSongsOffset = 0;
		this.getSomeSongs(0);
	},
	getSomeSongs: function(inOffset) {
		if(debug) this.log("getSomeSongs at offset "+inOffset);
		
		if(AmpacheXL.connectResponse.success) {
		
			var requestUrl = AmpacheXL.prefsCookie.accounts[AmpacheXL.prefsCookie.currentAccountIndex].url;
			requestUrl += "/server/xml.server.php?";
			requestUrl += "auth="+AmpacheXL.connectResponse.auth;
			requestUrl += "&action=songs";
			requestUrl += "&limit=1000";
			requestUrl += "&offset="+inOffset;
		
			this.$.allSongsRequestService.setUrl(requestUrl);
			if(debug) this.log("allSongsRequestService url: "+this.$.allSongsRequestService.getUrl());
			this.$.allSongsRequestService.call();
		
		}
	},
	allSongsRequestResponse: function(inSender, inResponse) {
		//if(debug) this.log("allSongsRequestResponse: "+inResponse);
		if(debug) this.log("allSongsRequestResponse");
		
		var xmlobject = (new DOMParser()).parseFromString(inResponse, "text/xml");
		
		var songsNodes, singleSongNode, singleSongChildNode;
		var s = {};
		
		//fix timeout error here - https://developer.palm.com/distribution/viewtopic.php?f=11&t=10561
		songsNodes = xmlobject.getElementsByTagName("song");
		for(var i = 0; i < songsNodes.length; i++) {
			singleSongNode = songsNodes[i];
			s = {};
			
			s.id = singleSongNode.getAttributeNode("id").nodeValue;
			
			for(var j = 0; j < singleSongNode.childNodes.length; j++) {
				singleSongChildNode = singleSongNode.childNodes[j];
				
				switch(singleSongChildNode.nodeName) {
					case "title":
						s.title = singleSongChildNode.childNodes[0].nodeValue.replace(/"/g,"");
						break;
					case "artist":
						s.artist = singleSongChildNode.childNodes[0].nodeValue.replace(/"/g,"");
						s.artist_id = singleSongChildNode.getAttributeNode("id").nodeValue;
						break;
					case "album":
						s.album = singleSongChildNode.childNodes[0].nodeValue.replace(/"/g,"");
						s.album_id = singleSongChildNode.getAttributeNode("id").nodeValue;
						break;
					case "track":
						s.track = parseInt(singleSongChildNode.childNodes[0].nodeValue);
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
		
			s.type = "song";
			
			this.fullResultsList.push(s);
			
			this.sqlArray.push('INSERT INTO songs (id, title, artist, artist_id, album, album_id, track, time, oldUrl, oldArt) VALUES ('+s.id+', "'+s.title+'", "'+s.artist+'", '+s.artist_id+', "'+s.album+'", '+s.album_id+', '+s.track+', '+s.time+', "'+s.url+'", "'+s.art+'");');

			//if(debug) this.log("added song to list. curent length = "+this.fullResultsList.length);
		
		}
		
		if(this.fullResultsList.length >= AmpacheXL.connectResponse.songs) {
			if(debug) this.log("finished getting all songs: "+this.fullResultsList.length);
			
			AmpacheXL.allSongs = this.fullResultsList.concat([]);
			
			AmpacheXL.prefsCookie.oldSongsAuth  = AmpacheXL.connectResponse.auth;
			
			this.doSavePreferences();
			
			//if(debug) this.log("about to do sqlArray: "+enyo.json.stringify(this.sqlArray));
			html5sql.process(this.sqlArray, enyo.bind(this, "insertSuccess"), enyo.bind(this, "insertFailure"));
		
			this.resetSongsSearch();
			
		} else {
			if(debug) this.log("got some songs ("+this.fullResultsList.length+") but less than total ("+AmpacheXL.connectResponse.songs+")");
			
			if(this.fullResultsList.length == 1) {
				this.$.headerSubtitle.setContent(this.fullResultsList.length+" song");
			} else {
				this.$.headerSubtitle.setContent(this.fullResultsList.length+" songs");
			}
			
			//this.resultsList.push({title: "Loaded "+this.fullResultsList.length+" of "+AmpacheXL.connectResponse.songs+" songs", artist: "", album: "", track: this.fullResultsList.length, url: "", art: ""});
			this.resultsList.splice(0,0,{title: "Loaded "+this.fullResultsList.length+" of "+AmpacheXL.connectResponse.songs+" songs", artist: "", album: "", track: this.fullResultsList.length, url: "", art: ""});
			this.$.songsVirtualList.punt();
			
			this.getSomeSongs(this.fullResultsList.length);
		}
	},
	resetSongsSearch: function() {
		if(debug) this.log("resetSongsSearch");
		
		this.$.songsSearchInput.setValue("");
		this.$.songsSearchClear.hide();
		this.$.songsSearchSpinner.hide();
		
		this.finishedGettingSongs();
	
	},
	finishedGettingSongs: function() {
		if(debug) this.log("finishedGettingSongs");
		
		this.resultsList.length = 0;
		this.resultsList = this.filterSongs(this.fullResultsList);
		
		if(this.resultsList.length == 1) {
			this.$.headerSubtitle.setContent(this.resultsList.length+" song");
		} else {
			this.$.headerSubtitle.setContent(this.resultsList.length+" songs");
		}
		
		this.$.songsVirtualList.punt();
		
		this.doUpdateSpinner(false);
		
	},
	filterSongs: function(inList) {
		if(debug) this.log("filterSongs with list of length: "+inList.length);
		
		var finalList = [];
		var s = {};
		var filterString = this.$.songsSearchInput.getValue().toUpperCase();
		
		for(var i = 0; i < inList.length; i++) {
			s = inList[i];
		
			if(s.title.toUpperCase().indexOf(filterString) >= 0) {
				finalList.push(s);
			} else if(s.artist.toUpperCase().indexOf(filterString) >= 0) {
				finalList.push(s);
			} else if(s.album.toUpperCase().indexOf(filterString) >= 0) {
				finalList.push(s);
			} 
		}	
		
		return finalList;
	},
	setupSongsItem: function(inSender, inIndex) {
		//if(debug) this.log("setupSongsItem: "+inIndex);
		
		var row = this.resultsList[inIndex];
		
		if(row) {
		
			//this.setupSongsDivider(inIndex);
			//this.$.songsItem.applyStyle("border-top", "1px solid silver;");
			//this.$.songsItem.applyStyle("border-bottom", "none;");
			
			if((row.type == "song")&&(AmpacheXL.prefsCookie.artOnLists)) {
				this.$.listArt.setSrc(row.art);
				this.$.listArt.show();
			} else {
				this.$.listArt.hide();
			}
			
			this.$.songsTitle.setContent(row.title);
			this.$.songsArtist.setContent(row.artist);
			
			this.$.songsAlbum.setContent(row.album);
			this.$.songsTrack.setContent("Track #"+row.track);
			
			return true;
		
		}
	},
	setupSongsDivider: function(inIndex) {
		
		// use group divider at group transition, otherwise use item border for divider
		var group = this.getSongsGroupName(inIndex);
		this.$.songsDivider.setCaption(group);
		this.$.songsDivider.canGenerate = Boolean(group);
		if(Boolean(group)) this.$.songsItem.applyStyle("border-top", "none");
		//this.$.songsItem.applyStyle("border-bottom", "none;");
    },
	getSongsGroupName: function(inIndex) {
		//if(debug) this.log("getSongsGroupName at index: "+inIndex);
		
		var r0 = this.resultsList[inIndex-1];
		var r1 = this.resultsList[inIndex];
		
		var a = r0 && r0.name.substring(0,1);
		var b = r1.name.substring(0,1);
		
		if(!enyo.g11n.Char.isLetter(a)) a = "#";
		if(!enyo.g11n.Char.isLetter(b)) b = "#";
		
		if(inIndex == 0) {
			return b;
		} else {
			return a != b ? b : null;
		}
	},
	
	headerClick: function() {
		if(debug) this.log("headerClick");
		
		this.$.songsVirtualList.punt();
	},
	songsInput: function() {
		if(debug) this.log("songsInput: "+this.$.songsSearchInput.getValue());
		
		this.$.songsSearchClear.hide();
		this.$.songsSearchSpinner.show();
		
		enyo.job("songsSearch", enyo.bind(this, "songsSearch"),200);
	},
	songsSearch: function(inSender) {
		if(debug) this.log("songsSearch: "+this.$.songsSearchInput.getValue());
		
		this.$.songsSearchClear.show();
		this.$.songsSearchSpinner.hide();
		
		this.finishedGettingSongs();
		
		//this.$.songsSearchInputWrapper.show();
		this.$.songsVirtualList.resized();
	},
	songsMousedown: function(inSender, inEvent) {
		if(debug) this.log("songsMousedown: "+this.$.songsVirtualList.getScrollTop()) 
		
		this.newClick = true;
		this.listOffset = this.$.songsVirtualList.getScrollTop();
		this.songsMouseTimer = setTimeout(enyo.bind(this, "songsMoreClick", inSender, inEvent), 500);
		
	},
	songsMouseup: function(inSender, inEvent) {
		if(debug) this.log("songsMouseup: "+this.$.songsVirtualList.getScrollTop()) 
		
		clearTimeout(this.songsMouseTimer);
		
		if(this.newClick) this.songsClick(inSender, inEvent);
		
		this.newClick = false;
		
	},
	songsClick: function(inSender, inEvent) {
		if(debug) this.log("songsClick: "+inEvent.rowIndex);
		
		if(Math.abs(this.$.songsVirtualList.getScrollTop() - this.listOffset) > 5) {
		
			if(debug) this.log("change in scroller offset is too large: "+Math.abs(this.$.songsVirtualList.getScrollTop() - this.listOffset));
		
		} else {
			this.selectedSong = this.resultsList[inEvent.rowIndex];
			this.selectedIndex = inEvent.rowIndex;
			
			if(debug) this.log("songsClick: "+enyo.json.stringify(this.selectedSong));
			
			this.songsAction(AmpacheXL.prefsCookie.defaultAction);
		}
	}, 
	songsAction: function(inAction) {
	
		var actionArray = inAction.split("[]:[]");
		var playAction = actionArray[0];
		var playSongs = actionArray[1];
		var playOrder = actionArray[2];
		
		var row = this.selectedSong;
		
		var newSongs = [], s = {};
		
		if(playAction == "queue") newSongs = newSongs.concat(AmpacheXL.nowplaying);
		
		if(playSongs == "single") {
		
			newSongs.push(row);
			
		} else {
		
			if(playOrder == "straight") {
			
				newSongs = newSongs.concat(this.resultsList);
				
			} else {
			
				var originalList = this.resultsList.concat([]);
			
				//add selected song first
				s = originalList.splice(this.selectedIndex, 1)[0];
				newSongs.push(s);
					
				while(originalList.length > 0) {
				
					var randomSong = Math.floor(Math.random()*originalList.length);
					
					s = originalList.splice(randomSong, 1)[0];
					newSongs.push(s);
					
					//if(debug) this.log("splicing random song at index "+randomSong+": "+enyo.json.stringify(s));
					
				} 
				
			}
		}
		
		var previousLength = AmpacheXL.nowplaying.length;
		
		AmpacheXL.nowplaying.length = 0;
		AmpacheXL.nowplaying = newSongs;
		
		if((playAction == "play")||(previousLength == 0)) {
			AmpacheXL.nowplayingIndex = 0;
			AmpacheXL.audioPlayer.newPlayList(AmpacheXL.nowplaying, false, 0);
			AmpacheXL.audioPlayer.play();
		} else {
			AmpacheXL.audioPlayer.reorderPlayList(AmpacheXL.nowplaying, AmpacheXL.currentSong.id);
		}
		
		this.doNowplayingUpdated(playAction);
		
		this.doViewSelected("nowplaying");
		
	},
	songsMoreClick: function(inSender, inEvent) {
		if(debug) this.log("songsMoreClick: "+inEvent.rowIndex+" with offset:"+this.$.songsVirtualList.getScrollTop());
		
		this.newClick = false;
		
		if(Math.abs(this.$.songsVirtualList.getScrollTop() - this.listOffset) > 5) {
		
			if(debug) this.log("change in scroller offset is too large: "+Math.abs(this.$.songsVirtualList.getScrollTop() - this.listOffset));
		
		} else {
		
			this.selectedSong = this.resultsList[inEvent.rowIndex];
			this.selectedIndex = inEvent.rowIndex;
			
			this.$.morePopupMenu.setItems([
				{caption: $L("Play"), components: [
					{name: "Play all", caption: "Play all"},
					{name: "Play all, shuffled", caption: "Play all, shuffled"},
					{name: "Play single song", caption: "Play single song"},
				]},
				{caption: $L("Queue"), components: [
					{name: "Queue all", caption: "Queue all"},
					{name: "Queue all, shuffled", caption: "Queue all, shuffled"},
					{name: "Queue single song", caption: "Queue single song"},
				]},
				{name: "Album: "+this.selectedSong.album, caption: "Album: "+this.selectedSong.album},
				{name: "Artist: "+this.selectedSong.artist, caption: "Artist: "+this.selectedSong.artist},
				
				/*
				{caption: $L("Web"), components: [
					{name: "Google", caption: "Google"},
					{name: "Wikipedia", caption: "Wikipedia"},
				]},
				
				//download
				*/
			]);
								
			this.$.morePopupMenu.openAtEvent(inEvent);
		
		}
		
	},
	moreSelect: function(inSender, inEvent) {
		if(inEvent) {
			if(debug) this.log("moreSelect: "+inEvent.value);
			
			switch(inEvent.value) {
				case "Play":
					//
					break;
				case "Play all":
					this.songsAction("play[]:[]all[]:[]straight");
					break;
				case "Play all, shuffled":
					this.songsAction("play[]:[]all[]:[]shuffled");
					break;
				case "Play single song":
					this.songsAction("play[]:[]single[]:[]straight");
					break;
				case "Queue":
					//
					break;
				case "Queue all":
					this.songsAction("queue[]:[]all[]:[]straight");
					break;
				case "Queue all, shuffled":
					this.songsAction("queue[]:[]all[]:[]shuffled");
					break;
				case "Queue single song":
					this.songsAction("queue[]:[]single[]:[]straight");
					break;
				default: 
					
					if(inEvent.value.substring(0,5) == "Album") {
						this.doUpdateSpinner(true);
						this.doDataRequest("songsList", "album_songs", "&filter="+this.selectedSong.album_id);
						this.doViewSelected("songsList");
					} else if(inEvent.value.substring(0,6) == "Artist") {
						this.selectedSong.type = "artist";
						this.selectedSong.songs = "all";
						this.selectedSong.name = this.selectedSong.artist;
						this.selectedSong.id = this.selectedSong.artist_id;
						AmpacheXL.selectedArtist = this.selectedSong;
						this.doUpdateSpinner(true);
						this.doDataRequest("albumsList", "artist_albums", "&filter="+this.selectedSong.artist_id);
						this.doViewSelected("albumsList");
					} else {
						this.log("unknown more command: "+inEvent.value);
					}
					
					break;
			}
		}
	},
	
	truncateSuccess: function() {
		if(debug) this.log("truncateSuccess");
		
	},
	truncateFailure: function() {
		if(debug) this.error("truncateFailure");
		
	},
	insertSuccess: function() {
		if(debug) this.log("insertSuccess");
		
		AmpacheXL.prefsCookie.oldSongsCount = this.fullResultsList.length;
		
		this.doSavePreferences();
		
		if(window.PalmSystem) this.doBannerMessage("Finished saving songs");
		
	},
	insertFailure: function(inError) {
		if(debug) this.error("insertFailure: "+inError.message);
		
	},
	selectResults: function(transaction, results) {
		//if(debug) this.log("selectResults: "+enyo.json.stringify(results));
		if(debug) this.log("selectResults");

		if(debug) this.log("will replace "+AmpacheXL.prefsCookie.oldSongsAuth+" with "+AmpacheXL.connectResponse.auth);
		
		for(var i = 0; i < results.rows.length; i++) {
			var row = results.rows.item(i);
			
			row.type = "song";
			
			row.url = row.oldUrl.replace(AmpacheXL.prefsCookie.oldSongsAuth, AmpacheXL.connectResponse.auth);
			row.art = row.oldArt.replace(AmpacheXL.prefsCookie.oldSongsAuth, AmpacheXL.connectResponse.auth);

			//if(debug) this.log("row: "+enyo.json.stringify(row));
			
			this.fullResultsList.push(row);

		}
		
		AmpacheXL.allSongs.length = 0;
		AmpacheXL.allSongs = this.fullResultsList.concat([]);
			
		this.resetSongsSearch();
		
	},
	selectSuccess: function(results) {
		if(debug) this.log("selectSuccess");
		
	},
	selectFailure: function(inError) {
		if(debug) this.error("selectFailure: "+inError.message);
		
		this.getSongs();
	},
	
	selectLocalplaylistSongsResults: function(transaction, results) {
		//if(debug) this.log("selectLocalplaylistSongsResults");
		if(debug) this.log("selectLocalplaylistSongsResults: "+enyo.json.stringify(results.rows.item));
		
		var playlistSongs = [];
		
		for(var i = 0; i < results.rows.length; i++) {
			var row = results.rows.item(i);
			//if(debug) this.log("row: "+enyo.json.stringify(row));

			row.type = "song";
			row.art = row.oldArt.replace(this.localPlaylistAuth, AmpacheXL.connectResponse.auth);
			row.url = row.oldUrl.replace(this.localPlaylistAuth, AmpacheXL.connectResponse.auth);
			
			playlistSongs.push(row);

		}
		
		if(debug) this.log("playlistSongs: "+enyo.json.stringify(playlistSongs));
		
		this.fullResultsList.length = 0;
		this.fullResultsList = playlistSongs;
		
		this.resetSongsSearch();
		
		this.doUpdateSpinner(false);
	},
	selectLocalplaylistSongsFailures: function() {
		if(debug) this.log("selectLocalplaylistSongsFailures");
		
		this.doUpdateSpinner(false);
		
		this.doBannerMessage("Error getting local playlist songs", true);
	},
	
});


