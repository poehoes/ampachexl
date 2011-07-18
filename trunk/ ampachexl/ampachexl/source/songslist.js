



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
	},
	
	fullResultsList: [],
	resultsList: [],
	
	components: [
		{name: "header", kind: "Toolbar", layoutKind: "VFlexLayout", onclick: "headerClick", components: [
			{name: "headerTitle", kind: "Control", content: "Songs", className: "headerTitle"},
			{name: "headerSubtitle", kind: "Control", className: "headerSubtitle"},
		]},
		
		{name: "songsSearchInputWrapper", className: "searchInputWrapper", kind: "Item", layoutKind: "HFlexLayout", components: [
			{name: "songsSearchInput", kind: "Input", hint: "Filter", oninput: "songsInput", flex: 1, components: [
				{name: "songsSearchClear", kind: "Image", src: "images/11-x@2x.png", showing: false, className: "searchClear", onclick: "resetSongsSearch"},
				{name: "songsSearchSpinner", kind: "Spinner"},
			]}
		]},
							
		{name: "songsVirtualList", kind: "VirtualList", onSetupRow: "setupSongsItem", flex: 1, components: [
			//{name: "songsDivider", kind: "Divider"},
			{name: "songsItem", kind: "Item", className: "listItem", layoutKind: "HFlexLayout", align: "center", onclick: "songsClick", components: [
				{kind: "VFlexBox", flex: 1, components: [
					{name: "songsTitle", className: "title"},
					{name: "songsArtist", className: "subtitle"},
				]},
				{kind: "VFlexBox", components: [
					{name: "songsAlbum", className: "count"},
					{name: "songsTrack", className: "count"},
				]},
			]},
		]},
		
		{name: "footer", kind: "Toolbar", components: [
			//
		]},
	],
	
	create: function() {
		if(debug) this.log("create");
		this.inherited(arguments);
	},
	
	activate: function() {
		if(debug) this.log("activate");
		
		this.resize();
		
		if(AmpacheXL.selectedAlbum) {
			this.$.headerSubtitle.setContent(AmpacheXL.selectedAlbum.name);
		} else {
			this.$.headerSubtitle.setContent("All Artists");
		}
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
		
		}
		
		//if(debug) this.log("fullResultsList: "+enyo.json.stringify(this.fullResultsList));
		
		//this.fullResultsList.sort(sort_by("title", false));
		
		//if(debug) this.log("fullResultsList: "+enyo.json.stringify(this.fullResultsList));
		
		this.resetSongsSearch();
		
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
	songsClick: function(inSender, inEvent) {
		if(debug) this.log("songsClick: "+inEvent.rowIndex);
		
		var row = this.resultsList[inEvent.rowIndex];
		
		if(debug) this.log("songsClick: "+enyo.json.stringify(row));
		
		this.doPlaySong(row);
		
		//give more options like enqueue, replace, etc.
		AmpacheXL.nowplaying.length = 0;
		AmpacheXL.nowplaying = this.resultsList.concat([]);
		
		AmpacheXL.nowplayingIndex = inEvent.rowIndex+1;
		
		this.doViewSelected("nowplaying");
		
	},
	
});


