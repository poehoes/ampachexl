/*
 *   AmapcheXL - A webOS app for Ampache written in the enyo framework and designed for use on a tablet. 
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
	},
	
	fullResultsList: [],
	resultsList: [],
	
	selectedSong: {},
	selectedIndex: -1,
	
	songsMouseTimer: "",
	
	components: [
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
		
			s.type = "song";
			
			this.fullResultsList.push(s);
			
			//if(debug) this.log("added song to list. curent length = "+this.fullResultsList.length);
		
		}
		
		//if(debug) this.log("fullResultsList: "+enyo.json.stringify(this.fullResultsList));
		
		//this.fullResultsList.sort(sort_by("title", false));
		
		if((this.fullResultsList.length == AmpacheXL.connectResponse.songs)||(this.fullResultsList.length == 5000)) {
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
		}
		
		//if(debug) this.log("fullResultsList: "+enyo.json.stringify(this.fullResultsList));
		
		this.resetSongsSearch();
		
	},
	
	
	getSongs: function() {
		if(debug) this.log("getSongs");
		
		this.doUpdateSpinner(true);
		this.doDataRequest("songsList", "songs", "&limit="+AmpacheXL.connectResponse.songs);
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
			this.$.songsItem.applyStyle("border-top", "1px solid silver;");
			this.$.songsItem.applyStyle("border-bottom", "none;");
			
			if(AmpacheXL.prefsCookie.artOnLists) {
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
		this.$.songsItem.applyStyle("border-top", Boolean(group) ? "none" : "1px solid silver;");
		this.$.songsItem.applyStyle("border-bottom", "none;");
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
		
		AmpacheXL.nowplaying.length = 0;
		AmpacheXL.nowplaying = newSongs;
		
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
				{name: "Artist: "+this.selectedSong.artist, caption: "Artist: "+this.selectedSong.artist},
				{name: "Album: "+this.selectedSong.album, caption: "Album: "+this.selectedSong.album},
				
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
});


