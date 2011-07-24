


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
	},
	
	listMode: "play",
	
	components: [
		{name: "header", kind: "Toolbar", layoutKind: "VFlexLayout", onclick: "headerClick", components: [
			{name: "headerTitle", kind: "Control", content: "Now Playing", className: "headerTitle"},
			{name: "headerSubtitle", kind: "Control", className: "headerSubtitle"},
		]},
							
		{name: "nowplayingVirtualList", kind: "VirtualList", onSetupRow: "setupNowplayingItem", flex: 1, components: [
			{name: "nowplayingItem", kind: "Item", className: "listItem", layoutKind: "HFlexLayout", align: "center", components: [
				{name: "nowplayingIndex", onclick: "nowplayingClick", className: "listIndex"},
				{kind: "VFlexBox", flex: 1, onclick: "nowplayingClick", components: [
					{name: "nowplayingTitle", className: "title"},
					{name: "nowplayingArtist", className: "subtitle"},
				]},
				{name: "nowplayingAlbumWrapper", onclick: "nowplayingClick", kind: "VFlexBox", components: [
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
				AmpacheXL.nowplayingIndex = currentIndex;
				break;
		}
		
		this.$.nowplayingVirtualList.refresh();
		this.doUpdateCounts();
		
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
					
					AmpacheXL.nowplayingIndex = 1;
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
				AmpacheXL.nowplayingIndex = currentIndex+2;
				break;
		}
		
		this.$.nowplayingVirtualList.refresh();
		this.doUpdateCounts();
	},
	nowplayingUpdated: function(inPlayAction) {
		if(debug) this.log("nowplayingUpdated: "+inPlayAction);
		
		if(inPlayAction == "play") {
			
			var row = AmpacheXL.nowplaying[0];
			
			AmpacheXL.nowplayingIndex = 1;
			AmpacheXL.currentSong = row;
			
			this.doPlaySong(row);
			
			this.$.nowplayingVirtualList.refresh();
			this.doUpdateCounts();
			
		} else if(AmpacheXL.currentSong.artist) {
			//are already playing a song, so dont interfere
		} else {
		
			//first addition to playlist
			var row = AmpacheXL.nowplaying[0];
			
			AmpacheXL.nowplayingIndex = 1;
			AmpacheXL.currentSong = row;
			
			this.doPlaySong(row);
			
			this.$.nowplayingVirtualList.refresh();
			this.doUpdateCounts();
			
		}
		
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
		AmpacheXL.nowplayingIndex = currentIndex+1;
		
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
	nowplayingClick: function(inSender, inEvent) {
		if(debug) this.log("nowplayingClick: "+inEvent.rowIndex);
		
		var row = AmpacheXL.nowplaying[inEvent.rowIndex];
		
		AmpacheXL.nowplayingIndex = inEvent.rowIndex+1;
		AmpacheXL.currentSong = row;
		
		if(debug) this.log("nowplayingClick: "+enyo.json.stringify(row));
		
		this.doPlaySong(row);
		
		this.$.nowplayingVirtualList.refresh();
		this.doUpdateCounts();
		
	},
	nowplayingMoveUp: function(inSender, inEvent) {
		if(debug) this.log("nowplayingMoveUp: "+inEvent.rowIndex);
		
		var row = AmpacheXL.nowplaying.splice(inEvent.rowIndex, 1)[0];
		AmpacheXL.nowplaying.splice(inEvent.rowIndex - 1, 0, row);
		
		var currentIndex = -1;
		for(var i = 0; i < AmpacheXL.nowplaying.length; i++) {
		
			s = AmpacheXL.nowplaying[i];
			if(s.id == AmpacheXL.currentSong.id) currentIndex = i;
		
		}
		AmpacheXL.nowplayingIndex = currentIndex+1;
		
		this.$.nowplayingVirtualList.refresh();
		this.doUpdateCounts();
		this.$.headerSubtitle.setContent(AmpacheXL.nowplaying.length+" items");
		
	},
	nowplayingMoveDown: function(inSender, inEvent) {
		if(debug) this.log("nowplayingMoveDown: "+inEvent.rowIndex);
		
		var row = AmpacheXL.nowplaying.splice(inEvent.rowIndex, 1)[0];
		AmpacheXL.nowplaying.splice(inEvent.rowIndex + 1, 0, row);
		
		var currentIndex = -1;
		for(var i = 0; i < AmpacheXL.nowplaying.length; i++) {
		
			s = AmpacheXL.nowplaying[i];
			if(s.id == AmpacheXL.currentSong.id) currentIndex = i;
		
		}
		AmpacheXL.nowplayingIndex = currentIndex+1;
		
		this.$.nowplayingVirtualList.refresh();
		this.doUpdateCounts();
		this.$.headerSubtitle.setContent(AmpacheXL.nowplaying.length+" items");
		
	},
	nowplayingRemove: function(inSender, inEvent) {
		if(debug) this.log("nowplayingRemove: "+inEvent.rowIndex);
		
		if(AmpacheXL.nowplayingIndex == inEvent.rowIndex+1) {
			this.doBannerMessage("You cannot remove the song that is currently playing", true);
		} else {
			var row = AmpacheXL.nowplaying.splice(inEvent.rowIndex, 1)[0];
		}
		
		var currentIndex = -1;
		for(var i = 0; i < AmpacheXL.nowplaying.length; i++) {
		
			s = AmpacheXL.nowplaying[i];
			if(s.id == AmpacheXL.currentSong.id) currentIndex = i;
		
		}
		AmpacheXL.nowplayingIndex = currentIndex+1;
		
		this.$.nowplayingVirtualList.refresh();
		this.doUpdateCounts();
		this.$.headerSubtitle.setContent(AmpacheXL.nowplaying.length+" items");
		
	},
	
});

