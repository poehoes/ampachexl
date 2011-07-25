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
	name: "Nowplaying",
	kind: "VFlexBox",
	className: "Nowplaying listContent",
	
	events: {
		onViewSelected: "",
		onDataRequest: "",
		onUpdateSpinner: "",
		onOpenWeb: "",
		onPlaySong: "",
		onUpdateCounts: "",
		onBannerMessage: "",
		onQueueNextSong: "",
	},
	
	listMode: "play",
	nowplayingMouseTimer: "",
	
	components: [
		{name: "header", kind: "Toolbar", layoutKind: "VFlexLayout", onclick: "headerClick", components: [
			{name: "headerTitle", kind: "Control", content: "Now Playing", className: "headerTitle"},
			{name: "headerSubtitle", kind: "Control", className: "headerSubtitle"},
		]},
							
		{name: "nowplayingVirtualList", kind: "ScrollerVirtualList", onSetupRow: "setupNowplayingItem", flex: 1, components: [
			{name: "nowplayingItem", kind: "Item", className: "listItem", layoutKind: "HFlexLayout", align: "center", components: [
				{name: "nowplayingIndex", onclick2: "nowplayingClick", onmousedown: "nowplayingMousedown", onmouseup: "nowplayingMouseup", className: "listIndex"},
				{kind: "VFlexBox", flex: 1, onclick2: "nowplayingClick", onmousedown: "nowplayingMousedown", onmouseup: "nowplayingMouseup", components: [
					{name: "nowplayingTitle", className: "title"},
					{name: "nowplayingArtist", className: "subtitle"},
				]},
				{name: "nowplayingAlbumWrapper", onclick2: "nowplayingClick", onmousedown: "nowplayingMousedown", onmouseup: "nowplayingMouseup", kind: "VFlexBox", components: [
					{name: "nowplayingAlbum", className: "count"},
					{name: "nowplayingTrack", className: "count"},
				]},
				{name: "nowplayingMoveUp", kind: "Image", onclick: "nowplayingMoveUp", src: "images/07-arrow-north@2x-light.png", className: "nowplayingMoveUp"},
				{name: "nowplayingMoveUpSpacer", content: "&nbsp;", allowHtml: true},
				{name: "nowplayingMoveDown", kind: "Image", onclick: "nowplayingMoveDown", src: "images/03-arrow-south@2x-light.png", className: "nowplayingMoveDown"},
				{name: "nowplayingMoveDownSpacer", content: "&nbsp;", allowHtml: true},
				{name: "nowplayingRemove", kind: "Image", onclick: "nowplayingRemove", src: "images/11-x@2x-light.png", className: "nowplayingRemove"},
			]},
		]},
		
		{name: "footer", kind: "Toolbar", layoutKind: "HFlexLayout", components: [
			{kind: "Spacer"},
			{name: "shuffleButton", caption: "Shuffle", onclick: "shuffleClick"},
			{name: "shuffleSpacer", kind: "Spacer"},
			{name: "editButton", caption: "Edit", onclick: "editClick"},
			{kind: "Spacer"},
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
		
		if(AmpacheXL.nowplaying.length < 15) {
			this.$.nowplayingVirtualList.punt();
		} else {
			this.$.nowplayingVirtualList.refresh();
		}
		
		this.$.headerSubtitle.setContent(AmpacheXL.nowplaying.length+" items");
		
		this.listMode = "play";
		this.$.shuffleButton.show();
		this.$.shuffleSpacer.show();
		this.$.editButton.setCaption("Edit");
		this.$.footer.render();
		
	},
	resize: function() {
		if(debug) this.log("resize");
		
		this.$.nowplayingVirtualList.resized();
	},
	previousTrack: function() {
		if(debug) this.log("previousTrack");
		
		var s = {};
		var currentIndex = -1;
		
		for(var i = 0; i < AmpacheXL.nowplaying.length; i++) {
		
			s = AmpacheXL.nowplaying[i];
			
			if(s.id == AmpacheXL.currentSong.id) currentIndex = i;
		
		}
		
		switch(currentIndex) {
			case -1:
				if(debug) this.log("could not find current song");
				break;
			case 0:
				if(debug) this.log("current song is first in list");
				break;
			default:
				if(debug) this.log("found current song at index: "+currentIndex);
				
				this.doPlaySong(AmpacheXL.nowplaying[currentIndex-1]);
				AmpacheXL.nowplayingIndex = currentIndex-1;
				break;
		}
		
		this.$.nowplayingVirtualList.refresh();
		this.doUpdateCounts();
		
		enyo.job("getNextSong", enyo.bind(this, "getNextSong"), 5000);
		
	},
	nextTrack: function() {
		if(debug) this.log("nextTrack");
		
		var s = {};
		var currentIndex = -1;
		
		for(var i = 0; i < AmpacheXL.nowplaying.length; i++) {
		
			s = AmpacheXL.nowplaying[i];
			
			if(s.id == AmpacheXL.currentSong.id) currentIndex = i;
		
		}
		
		switch(currentIndex) {
			case -1:
				if(debug) this.log("could not find current song");
				break;
			case AmpacheXL.nowplaying.length-1:
				if(debug) this.log("current song is last in list: "+AmpacheXL.prefsCookie.nowPlayingEnd);
				
				var actionArray = AmpacheXL.prefsCookie.nowPlayingEnd.split("[]:[]");
				var playAction = actionArray[0];
				var playOrder = actionArray[1];
		
				switch(playOrder) {
					case "shuffled":
						var newSongs = [], s = {};
		
						var originalList = AmpacheXL.nowplaying.concat([]);
						
						do {
						
							var randomSong = Math.floor(Math.random()*originalList.length);
							
							s = originalList.splice(randomSong, 1)[0];
							newSongs.push(s);
							
							//if(debug) this.log("splicing random song at index "+randomSong+": "+enyo.json.stringify(s));
							
						} while(originalList.length > 0);
						
						AmpacheXL.nowplaying.length = 0;
						AmpacheXL.nowplaying = newSongs;
				
						break;
					default: 
						//keep list as is
						break;
				}
				
				if(playAction == "play") {
				
					var row = AmpacheXL.nowplaying[0];
					
					AmpacheXL.nowplayingIndex = 0;
					AmpacheXL.currentSong = row;
					
					this.doPlaySong(row);
					
					this.$.nowplayingVirtualList.refresh();
					this.doUpdateCounts();
					
				} else {
					//
				}
				
				break;
				
			default:
				if(debug) this.log("found current song at index: "+currentIndex);
				
				this.doPlaySong(AmpacheXL.nowplaying[currentIndex+1]);
				AmpacheXL.nowplayingIndex = currentIndex+1;
				break;
		}
		
		this.$.nowplayingVirtualList.refresh();
		this.doUpdateCounts();
		
		enyo.job("getNextSong", enyo.bind(this, "getNextSong"), 5000);
	},
	nowplayingUpdated: function(inPlayAction) {
		if(debug) this.log("nowplayingUpdated: "+inPlayAction);
		
		//check for bad inputs
		for(var i = 0; i < AmpacheXL.nowplaying.length; i++) {
		
			s = AmpacheXL.nowplaying[i];
			
			if((s)&&(s.id)) {
				//song is OK
			} else {
				AmpacheXL.nowplaying.splice(i, 1);
			}
		}
		
		if(inPlayAction == "play") {
			
			var row = AmpacheXL.nowplaying[0];
			
			AmpacheXL.nowplayingIndex = 0;
			AmpacheXL.currentSong = row;
			
			this.doPlaySong(row);
			
			this.$.nowplayingVirtualList.refresh();
			this.doUpdateCounts();
			
		} else if(AmpacheXL.currentSong.artist) {
			//are already playing a song, so dont interfere
			
			this.$.nowplayingVirtualList.refresh();
			this.doUpdateCounts();
			
		} else {
		
			//first addition to playlist
			var row = AmpacheXL.nowplaying[0];
			
			AmpacheXL.nowplayingIndex = 0;
			AmpacheXL.currentSong = row;
			
			this.doPlaySong(row);
			
			this.$.nowplayingVirtualList.refresh();
			this.doUpdateCounts();
			
		}
		
		enyo.job("getNextSong", enyo.bind(this, "getNextSong"), 5000);
	},
	
	setupNowplayingItem: function(inSender, inIndex) {
		//if(debug) this.log("setupNowplayingItem: "+inIndex);
		
		var row = AmpacheXL.nowplaying[inIndex];
		
		if(row) {
		
			this.$.nowplayingItem.applyStyle("border-top", "1px solid silver;");
			this.$.nowplayingItem.applyStyle("border-bottom", "none;");
			
			this.$.nowplayingIndex.setContent(inIndex+1);
		
			this.$.nowplayingTitle.setContent(row.title);
			this.$.nowplayingArtist.setContent(row.artist);
			
			this.$.nowplayingAlbum.setContent(row.album);
			this.$.nowplayingTrack.setContent("Track #"+row.track);
			
			if(this.listMode == "edit") {
				this.$.nowplayingAlbumWrapper.hide();
				this.$.nowplayingMoveUp.show();
				this.$.nowplayingMoveUpSpacer.show();
				this.$.nowplayingMoveDown.show();
				this.$.nowplayingMoveDownSpacer.show();
				this.$.nowplayingRemove.show();
			} else {
				this.$.nowplayingAlbumWrapper.show();
				this.$.nowplayingMoveUp.hide();
				this.$.nowplayingMoveUpSpacer.hide();
				this.$.nowplayingMoveDown.hide();
				this.$.nowplayingMoveDownSpacer.hide();
				this.$.nowplayingRemove.hide();
			} 
			
			if(AmpacheXL.currentSong.id == row.id) {
				this.$.nowplayingItem.addClass("selected");
			} else {
				this.$.nowplayingItem.removeClass("selected");
			}
			
			return true;
		
		}
	},
	
	headerClick: function() {
		if(debug) this.log("headerClick");
		
		this.$.nowplayingVirtualList.punt();
	},
	shuffleClick: function() {
		if(debug) this.log("shuffleClick");
		
		var newSongs = [], s = {};
		
		var originalList = AmpacheXL.nowplaying.concat([]);
						
		do {
		
			var randomSong = Math.floor(Math.random()*originalList.length);
			
			s = originalList.splice(randomSong, 1)[0];
			newSongs.push(s);
			
			//if(debug) this.log("splicing random song at index "+randomSong+": "+enyo.json.stringify(s));
			
		} while(originalList.length > 0);
		
		AmpacheXL.nowplaying.length = 0;
		AmpacheXL.nowplaying = newSongs;
		
		var currentIndex = -1;
		for(var i = 0; i < AmpacheXL.nowplaying.length; i++) {
		
			s = AmpacheXL.nowplaying[i];
			if(s.id == AmpacheXL.currentSong.id) currentIndex = i;
		
		}
		AmpacheXL.nowplayingIndex = currentIndex;
		
		this.$.nowplayingVirtualList.punt();
		this.doUpdateCounts();
		this.$.headerSubtitle.setContent(AmpacheXL.nowplaying.length+" items");
	},
	editClick: function() {
		if(debug) this.log("editClick");
		
		switch(this.listMode) {
			case "play":
				this.listMode = "edit";
				//this.$.shuffleButton.hide();
				//this.$.shuffleSpacer.hide();
				this.$.editButton.setCaption("Done");
				this.$.footer.render();
				break;
			case "edit":
				this.listMode = "play";
				//this.$.shuffleButton.show();
				//this.$.shuffleSpacer.show();
				this.$.editButton.setCaption("Edit");
				this.$.footer.render();
				break;
		}
		
		this.$.nowplayingVirtualList.refresh();
		
	},
	nowplayingMousedown: function(inSender, inEvent) {
		if(debug) this.log("nowplayingMousedown: "+this.$.nowplayingVirtualList.getScrollTop()) 
		
		this.newClick = true;
		this.listOffset = this.$.nowplayingVirtualList.getScrollTop();
		this.nowplayingMouseTimer = setTimeout(enyo.bind(this, "nowplayingMoreClick", inSender, inEvent), 500);
		
	},
	nowplayingMouseup: function(inSender, inEvent) {
		if(debug) this.log("nowplayingMouseup: "+this.$.nowplayingVirtualList.getScrollTop()) 
		
		clearTimeout(this.nowplayingMouseTimer);
		
		if(this.newClick) this.nowplayingClick(inSender, inEvent);
		
		this.newClick = false;
		
	},
	nowplayingClick: function(inSender, inEvent) {
		if(debug) this.log("nowplayingClick: "+inEvent.rowIndex);
		
		var row = AmpacheXL.nowplaying[inEvent.rowIndex];
		
		AmpacheXL.nowplayingIndex = inEvent.rowIndex;
		AmpacheXL.currentSong = row;
		
		if(debug) this.log("nowplayingClick: "+enyo.json.stringify(row));
		
		this.doPlaySong(row);
		
		this.$.nowplayingVirtualList.refresh();
		this.doUpdateCounts();
		
		enyo.job("getNextSong", enyo.bind(this, "getNextSong"), 5000);
		
	},	
	nowplayingMoreClick: function(inSender, inEvent) {
		if(debug) this.log("nowplayingMoreClick: "+inEvent.rowIndex+" with offset:"+this.$.nowplayingVirtualList.getScrollTop());
		
		this.newClick = false;
		
		if(Math.abs(this.$.nowplayingVirtualList.getScrollTop() - this.listOffset) > 5) {
		
			if(debug) this.log("change in scroller offset is too large: "+Math.abs(this.$.nowplayingVirtualList.getScrollTop() - this.listOffset));
		
		} else {
		
			this.selectedSong = AmpacheXL.nowplaying[inEvent.rowIndex];
			this.selectedIndex = inEvent.rowIndex;
			
			this.$.morePopupMenu.setItems([
				{caption: "Play"},
				{name: "Artist: "+this.selectedSong.artist, caption: "Artist: "+this.selectedSong.artist},
				{name: "Album: "+this.selectedSong.album, caption: "Album: "+this.selectedSong.album},
				{caption: $L("Move"), components: [
					{caption: "Move up"},
					{caption: "Move down"},
					{caption: "Move to top"},
					{caption: "Move to bottom"},
					{caption: "Move to next"},
				]},
				{caption: $L("Remove")},
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
					this.nowplayingClick("nowplaying", {rowIndex: this.selectedIndex});
					break;
				case "Move":
					//
					break;
				case "Move up":
					this.nowplayingMoveUp("nowplaying", {rowIndex: this.selectedIndex});
					break;
				case "Move down":
					this.nowplayingMoveDown("nowplaying", {rowIndex: this.selectedIndex});
					break;
				case "Move to top":
					this.nowplayingMoveToTop("nowplaying", {rowIndex: this.selectedIndex});
					break;
				case "Move to bottom":
					this.nowplayingMoveToBottom("nowplaying", {rowIndex: this.selectedIndex});
					break;
				case "Move to next":
					this.nowplayingMoveToNext("nowplaying", {rowIndex: this.selectedIndex});
					break;
				case "Remove":
					this.nowplayingRemove("nowplaying", {rowIndex: this.selectedIndex});
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
	nowplayingMoveUp: function(inSender, inEvent) {
		if(debug) this.log("nowplayingMoveUp: "+inEvent.rowIndex);
		
		var row = AmpacheXL.nowplaying.splice(inEvent.rowIndex, 1)[0];
		AmpacheXL.nowplaying.splice(inEvent.rowIndex - 1, 0, row);
		
		this.finishedMoving();
		
	},
	nowplayingMoveDown: function(inSender, inEvent) {
		if(debug) this.log("nowplayingMoveDown: "+inEvent.rowIndex);
		
		var row = AmpacheXL.nowplaying.splice(inEvent.rowIndex, 1)[0];
		AmpacheXL.nowplaying.splice(inEvent.rowIndex + 1, 0, row);
		
		this.finishedMoving();
		
	},
	nowplayingMoveToTop: function(inSender, inEvent) {
		if(debug) this.log("nowplayingMoveToTop: "+inEvent.rowIndex);
		
		var row = AmpacheXL.nowplaying.splice(inEvent.rowIndex, 1)[0];
		AmpacheXL.nowplaying.splice(0, 0, row);
		
		this.finishedMoving();
		
	},
	nowplayingMoveToBottom: function(inSender, inEvent) {
		if(debug) this.log("nowplayingMoveToBottom: "+inEvent.rowIndex);
		
		var row = AmpacheXL.nowplaying.splice(inEvent.rowIndex, 1)[0];
		AmpacheXL.nowplaying.push(row);
		
		this.finishedMoving();
		
	},
	nowplayingMoveToNext: function(inSender, inEvent) {
		if(debug) this.log("nowplayingMoveToNext: "+inEvent.rowIndex);
		
		var row = AmpacheXL.nowplaying.splice(inEvent.rowIndex, 1)[0];
		
		var currentIndex = -1;
		for(var i = 0; i < AmpacheXL.nowplaying.length; i++) {
		
			s = AmpacheXL.nowplaying[i];
			if(s.id == AmpacheXL.currentSong.id) currentIndex = i;
		
		}
		AmpacheXL.nowplayingIndex = currentIndex;
		
		AmpacheXL.nowplaying.splice(AmpacheXL.nowplayingIndex+1, 0, row);
		
		this.finishedMoving();
		
	},
	nowplayingRemove: function(inSender, inEvent) {
		if(debug) this.log("nowplayingRemove: "+inEvent.rowIndex);
		
		if(AmpacheXL.nowplayingIndex == inEvent.rowIndex) {
			this.doBannerMessage("You cannot remove the song that is currently playing", true);
		} else {
			var row = AmpacheXL.nowplaying.splice(inEvent.rowIndex, 1)[0];
		}
		
		this.finishedMoving();
	},
	finishedMoving: function() {
		if(debug) this.log("finishedMoving");
		
		var currentIndex = -1;
		for(var i = 0; i < AmpacheXL.nowplaying.length; i++) {
		
			s = AmpacheXL.nowplaying[i];
			if(s.id == AmpacheXL.currentSong.id) currentIndex = i;
		
		}
		AmpacheXL.nowplayingIndex = currentIndex;
		
		this.$.nowplayingVirtualList.refresh();
		this.doUpdateCounts();
		this.$.headerSubtitle.setContent(AmpacheXL.nowplaying.length+" items");
		
		enyo.job("getNextSong", enyo.bind(this, "getNextSong"), 5000);
	},
	getNextSong: function() {
		if(debug) this.log("getNextSong");
		
		var row = AmpacheXL.nowplaying[AmpacheXL.nowplayingIndex+1];
		
		if(row) {
		
			this.doQueueNextSong(row);
		
		}
	},
	
});

