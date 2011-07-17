


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
	},
	
	components: [
		{name: "header", kind: "Toolbar", layoutKind: "VFlexLayout", onclick: "headerClick", components: [
			{name: "headerTitle", kind: "Control", content: "Now Playing", className: "headerTitle"},
			{name: "headerSubtitle", kind: "Control", className: "headerSubtitle"},
		]},
							
		{name: "nowplayingVirtualList", kind: "VirtualList", onSetupRow: "setupNowplayingItem", flex: 1, components: [
			{name: "nowplayingItem", kind: "Item", className: "listItem", layoutKind: "HFlexLayout", align: "center", onclick: "nowplayingClick", components: [
				{name: "nowplayingIndex", className: "listIndex"},
				{kind: "VFlexBox", flex: 1, components: [
					{name: "nowplayingTitle", className: "title"},
					{name: "nowplayingArtist", className: "subtitle"},
				]},
				{kind: "VFlexBox", components: [
					{name: "nowplayingAlbum", className: "count"},
					{name: "nowplayingTrack", className: "count"},
				]},
			]},
		]},
		
		{name: "footer", kind: "Toolbar", layoutKind: "HFlexLayout", components: [
			{kind: "Spacer"},
			//name: "refreshCommandButton", icon: 'images/menu-icon-refresh.png', onclick: "getNowplaying"},
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
				this.log("could not find current song");
				break;
			case 0:
				this.log("current song is first in list");
				break;
			default:
				this.log("found current song at index: "+currentIndex);
				
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
				this.log("could not find current song");
				break;
			case AmpacheXL.nowplaying.length-1:
				this.log("current song is last in list");
				break;
			default:
				this.log("found current song at index: "+currentIndex);
				
				this.doPlaySong(AmpacheXL.nowplaying[currentIndex+1]);
				AmpacheXL.nowplayingIndex = currentIndex+2;
				break;
		}
		
		this.$.nowplayingVirtualList.refresh();
		this.doUpdateCounts();
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
	
});

