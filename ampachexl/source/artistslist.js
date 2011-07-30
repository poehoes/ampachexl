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
	name: "ArtistsList",
	kind: "VFlexBox",
	className: "ArtistsList listContent",
	
	events: {
		onViewSelected: "",
		onDataRequest: "",
		onUpdateSpinner: "",
		onOpenWeb: "",
		onBannerMessage: "",
		onPreviousView: "",
	},
	
	fullResultsList: [],
	resultsList: [],
	
	components: [
		{name: "header", kind: "Toolbar", layoutKind: "VFlexLayout", onclick: "headerClick", components: [
			{name: "headerTitle", kind: "Control", content: "Artists", className: "headerTitle"},
			{name: "headerSubtitle", kind: "Control", className: "headerSubtitle"},
		]},
		
		{name: "artistsSearchInputWrapper", className: "searchInputWrapper", kind: "Item", layoutKind: "HFlexLayout", components: [
			{name: "artistsSearchInput", kind: "Input", hint: "Filter", autoCapitalize: "lowercase", oninput: "artistsInput", flex: 1, components: [
				{name: "artistsSearchClear", kind: "Image", src: "images/11-x@2x.png", showing: false, className: "searchClear", onclick: "resetArtistsSearch"},
				{name: "artistsSearchSpinner", kind: "Spinner"},
			]}
		]},
							
		{name: "artistsVirtualList", kind: "VirtualList", onSetupRow: "setupArtistsItem", flex: 1, components: [
			{name: "artistsDivider", kind: "Divider"},
			{name: "artistsItem", kind: "Item", className: "listItem", layoutKind: "HFlexLayout", align: "center", onclick: "artistsClick", components: [
				{kind: "VFlexBox", flex: 1, components: [
					{name: "artistsTitle", className: "title"},
					{name: "albumsSongCount", className: "subtitle"},
				]},
				{name: "artistsSongCount", className: "count"},
			]},
		]},
		
		{name: "footer", kind: "Toolbar", layoutKind: "HFlexLayout", components: [
			{name: "backCommandIcon", kind: "Control", className: "backCommandIcon", onclick: "doPreviousView"},
			{kind: "Spacer"},
			{name: "refreshCommandButton", icon: "images/menu-icon-refresh.png", onclick: "getArtists"},
			{kind: "Spacer"},
			{name: "backCommandIconSpacer", kind: "Control", className: "backCommandIconSpacer"},
		]},
	],
	
	create: function() {
		if(debug) this.log("create");
		this.inherited(arguments);
	},
	
	activate: function() {
		if(debug) this.log("activate");
		
		this.resize();
		
		if(this.fullResultsList.length == 0) {
			//this.getArtists();
			this.fullResultsList = AmpacheXL.allArtists.concat([]);
			
			//this.resetArtistsSearch();
			
			this.resultsList.length = 0;
			this.resultsList = this.filterArtists(this.fullResultsList);
			
			this.$.headerSubtitle.setContent(this.resultsList.length+" artists");
			
			this.$.artistsVirtualList.punt();
		}
		
	},
	resize: function() {
		if(debug) this.log("resize");
		
		this.$.artistsVirtualList.resized();
	},
	dataRequestResponse: function(inResponse) {
		if(debug) this.log("dataRequestResponse");
		
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
		
		this.fullResultsList.length = 0;
		
		var xmlobject = (new DOMParser()).parseFromString(inResponse, "text/xml");
		
		var errorNodes, singleErrorNode;
		errorNodes = xmlobject.getElementsByTagName("error");
		for(var i = 0; i < errorNodes.length; i++) {
			singleErrorNode = errorNodes[i];
			
			this.doBannerMessage("Error: "+singleErrorNode.childNodes[0].nodeValue, true);
			
		}
		
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
			
			s.type = "artist";
		
			this.fullResultsList.push(s);
		
		}
		
		this.fullResultsList.sort(sort_by("name", false));
		
		if(this.fullResultsList.length == AmpacheXL.connectResponse.artists) {
			if(debug) this.log("was all artists, now saving");
		
			AmpacheXL.allArtists = this.fullResultsList.concat([]);
			
			AmpacheXL.prefsCookie.oldArtistsAuth  = AmpacheXL.connectResponse.auth;
			window.localStorage.setItem("allArtists", enyo.json.stringify(AmpacheXL.allArtists));
		}
		
		//if(debug) this.log("fullResultsList: "+enyo.json.stringify(this.fullResultsList));
		
		this.resetArtistsSearch();
		
	},
	
	getArtists: function() {
		if(debug) this.log("getArtists");
		
		this.doUpdateSpinner(true);
		this.doDataRequest("artistsList", "artists", "");
	},
	resetArtistsSearch: function() {
		if(debug) this.log("resetArtistsSearch");
		
		this.$.artistsSearchInput.setValue("");
		this.$.artistsSearchClear.hide();
		this.$.artistsSearchSpinner.hide();
		
		this.finishedGettingArtists();
	
	},
	finishedGettingArtists: function() {
		if(debug) this.log("finishedGettingArtists");
		
		this.resultsList.length = 0;
		this.resultsList = this.filterArtists(this.fullResultsList);
		
		this.$.headerSubtitle.setContent(this.resultsList.length+" artists");
		
		this.$.artistsVirtualList.punt();
		
		this.doUpdateSpinner(false);
		
	},
	filterArtists: function(inList) {
		if(debug) this.log("filterArtists with list of length: "+inList.length);
		
		var finalList = [];
		var s = {};
		var filterString = this.$.artistsSearchInput.getValue().toUpperCase();
		
		for(var i = 0; i < inList.length; i++) {
			s = inList[i];
		
			if(s.name.toUpperCase().indexOf(filterString) >= 0) {
				finalList.push(s);
			} 
		}	
		
		return finalList;
	},
	setupArtistsItem: function(inSender, inIndex) {
		//if(debug) this.log("setupArtistsItem: "+inIndex);
		
		var row = this.resultsList[inIndex];
		
		if(row) {
		
			this.setupArtistsDivider(inIndex);
			
			this.$.artistsTitle.setContent(row.name);
			
			if(row.songs == 1) {
				this.$.artistsSongCount.setContent("1 song");
			} else {
				this.$.artistsSongCount.setContent(row.songs+" songs");
			}
			
			if(row.albums == 1) {
				this.$.albumsSongCount.setContent("1 album");
			} else {
				this.$.albumsSongCount.setContent(row.albums+" albums");
			}
			
			return true;
		
		}
	},
	setupArtistsDivider: function(inIndex) {
		
		// use group divider at group transition, otherwise use item border for divider
		var group = this.getArtistsGroupName(inIndex);
		this.$.artistsDivider.setCaption(group);
		this.$.artistsDivider.canGenerate = Boolean(group);
		if(Boolean(group)) this.$.artistsItem.applyStyle("border-top", "none");
		//this.$.artistsItem.applyStyle("border-bottom", "none;");
    },
	getArtistsGroupName: function(inIndex) {
		//if(debug) this.log("getArtistsGroupName at index: "+inIndex);
		
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
		
		this.$.artistsVirtualList.punt();
	},
	artistsInput: function() {
		if(debug) this.log("artistsInput: "+this.$.artistsSearchInput.getValue());
		
		this.$.artistsSearchClear.hide();
		this.$.artistsSearchSpinner.show();
		
		enyo.job("artistsSearch", enyo.bind(this, "artistsSearch"),200);
	},
	artistsSearch: function(inSender) {
		if(debug) this.log("artistsSearch: "+this.$.artistsSearchInput.getValue());
		
		this.$.artistsSearchClear.show();
		this.$.artistsSearchSpinner.hide();
		
		this.finishedGettingArtists();
		
		//this.$.artistsSearchInputWrapper.show();
		this.$.artistsVirtualList.resized();
	},
	artistsClick: function(inSender, inEvent) {
		if(debug) this.log("artistsClick: "+inEvent.rowIndex);
		
		var row = this.resultsList[inEvent.rowIndex];
		
		AmpacheXL.selectedArtist = row;
		
		if(debug) this.log("artistsClick: "+enyo.json.stringify(row));
		
		this.doUpdateSpinner(true);
		//this.doDataRequest("songsList", "artist_songs", "&filter="+row.id);
		//this.doViewSelected("songsList");
		this.doDataRequest("albumsList", "artist_albums", "&filter="+row.id);
		this.doViewSelected("albumsList");
				
	},
	
});
