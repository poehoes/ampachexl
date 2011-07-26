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
	name: "PlaylistsList",
	kind: "VFlexBox",
	className: "PlaylistsList listContent",
	
	events: {
		onViewSelected: "",
		onDataRequest: "",
		onUpdateSpinner: "",
		onOpenWeb: "",
		onBannerMessage: "",
	},
	
	fullResultsList: [],
	resultsList: [],
	
	components: [
		{name: "header", kind: "Toolbar", layoutKind: "VFlexLayout", onclick: "headerClick", components: [
			{name: "headerTitle", kind: "Control", content: "Playlists", className: "headerTitle"},
			{name: "headerSubtitle", kind: "Control", className: "headerSubtitle"},
		]},
		
		{name: "playlistsSearchInputWrapper", className: "searchInputWrapper", kind: "Item", layoutKind: "HFlexLayout", components: [
			{name: "playlistsSearchInput", kind: "Input", hint: "Filter", autoCapitalize: "lowercase", oninput: "playlistsInput", flex: 1, components: [
				{name: "playlistsSearchClear", kind: "Image", src: "images/11-x@2x.png", showing: false, className: "searchClear", onclick: "resetPlaylistsSearch"},
				{name: "playlistsSearchSpinner", kind: "Spinner"},
			]}
		]},
							
		{name: "playlistsVirtualList", kind: "VirtualList", onSetupRow: "setupPlaylistsItem", flex: 1, components: [
			//name: "playlistsDivider", kind: "Divider"},
			{name: "playlistsItem", kind: "Item", className: "listItem", layoutKind: "HFlexLayout", align: "center", onclick: "playlistsClick", components: [
				{kind: "VFlexBox", flex: 1, components: [
					{name: "playlistsTitle", className: "title"},
					{name: "playlistsSongCount", className: "subtitle"},
				]},
			]},
		]},
		
		{name: "footer", kind: "Toolbar", layoutKind: "HFlexLayout", components: [
			{kind: "Spacer"},
			{name: "refreshCommandButton", icon: 'images/menu-icon-refresh.png', onclick: "getPlaylists"},
			{kind: "Spacer"},
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
			//this.getPlaylists();
		}
		
	},
	resize: function() {
		if(debug) this.log("resize");
		
		this.$.playlistsVirtualList.resized();
	},
	dataRequestResponse: function(inResponse) {
		if(debug) this.log("dataRequestResponse");
		
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
		
		this.fullResultsList.length = 0;
		
		var xmlobject = (new DOMParser()).parseFromString(inResponse, "text/xml");
		
		var errorNodes, singleErrorNode;
		errorNodes = xmlobject.getElementsByTagName("error");
		for(var i = 0; i < errorNodes.length; i++) {
			singleErrorNode = errorNodes[i];
			
			this.doBannerMessage("Error: "+singleErrorNode.childNodes[0].nodeValue, true);
			
		}
		
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
		
			s.type = "playlist";
			
			this.fullResultsList.push(s);
		
		}
		
		this.fullResultsList.sort(sort_by("name", false));
		
		if(this.fullResultsList.length == AmpacheXL.connectResponse.playlists) {
			AmpacheXL.allPlaylists = this.fullResultsList.concat([]);
		}
		
		//if(debug) this.log("fullResultsList: "+enyo.json.stringify(this.fullResultsList));
		
		this.resetPlaylistsSearch();
		
	},
	
	getPlaylists: function() {
		if(debug) this.log("getPlaylists");
		
		this.doUpdateSpinner(true);
		this.doDataRequest("playlistsList", "playlists", "");
	},
	resetPlaylistsSearch: function() {
		if(debug) this.log("resetPlaylistsSearch");
		
		this.$.playlistsSearchInput.setValue("");
		this.$.playlistsSearchClear.hide();
		this.$.playlistsSearchSpinner.hide();
		
		this.finishedGettingPlaylists();
	
	},
	finishedGettingPlaylists: function() {
		if(debug) this.log("finishedGettingPlaylists");
		
		this.resultsList.length = 0;
		this.resultsList = this.filterPlaylists(this.fullResultsList);
		
		this.$.headerSubtitle.setContent(this.resultsList.length+" playlists");
		
		this.$.playlistsVirtualList.punt();
		
		this.doUpdateSpinner(false);
		
	},
	filterPlaylists: function(inList) {
		if(debug) this.log("filterPlaylists with list of length: "+inList.length);
		
		var finalList = [];
		var s = {};
		var filterString = this.$.playlistsSearchInput.getValue().toUpperCase();
		
		for(var i = 0; i < inList.length; i++) {
			s = inList[i];
		
			if(s.name.toUpperCase().indexOf(filterString) >= 0) {
				finalList.push(s);
			} 
		}	
		
		return finalList;
	},
	setupPlaylistsItem: function(inSender, inIndex) {
		//if(debug) this.log("setupPlaylistsItem: "+inIndex);
		
		var row = this.resultsList[inIndex];
		
		if(row) {
		
			//this.setupPlaylistsDivider(inIndex);
			this.$.playlistsItem.applyStyle("border-top", "1px solid silver;");
			this.$.playlistsItem.applyStyle("border-bottom", "none;");
			
			this.$.playlistsTitle.setContent(row.name);
			
			if(row.items == 1) {
				this.$.playlistsSongCount.setContent("1 items");
			} else {
				this.$.playlistsSongCount.setContent(row.items+" items");
			}
			
			
			return true;
		
		}
	},
	setupPlaylistsDivider: function(inIndex) {
		
		// use group divider at group transition, otherwise use item border for divider
		var group = this.getPlaylistsGroupName(inIndex);
		this.$.playlistsDivider.setCaption(group);
		this.$.playlistsDivider.canGenerate = Boolean(group);
		this.$.playlistsItem.applyStyle("border-top", Boolean(group) ? "none" : "1px solid silver;");
		this.$.playlistsItem.applyStyle("border-bottom", "none;");
    },
	getPlaylistsGroupName: function(inIndex) {
		//if(debug) this.log("getPlaylistsGroupName at index: "+inIndex);
		
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
		
		this.$.playlistsVirtualList.punt();
	},
	playlistsInput: function() {
		if(debug) this.log("playlistsInput: "+this.$.playlistsSearchInput.getValue());
		
		this.$.playlistsSearchClear.hide();
		this.$.playlistsSearchSpinner.show();
		
		enyo.job("playlistsSearch", enyo.bind(this, "playlistsSearch"),200);
	},
	playlistsSearch: function(inSender) {
		if(debug) this.log("playlistsSearch: "+this.$.playlistsSearchInput.getValue());
		
		this.$.playlistsSearchClear.show();
		this.$.playlistsSearchSpinner.hide();
		
		this.finishedGettingPlaylists();
		
		//this.$.playlistsSearchInputWrapper.show();
		this.$.playlistsVirtualList.resized();
	},
	playlistsClick: function(inSender, inEvent) {
		if(debug) this.log("playlistsClick: "+inEvent.rowIndex);
		
		var row = this.resultsList[inEvent.rowIndex];
		
		AmpacheXL.selectedPlaylist = row;
		AmpacheXL.selectedAlbum = row;
		
		if(debug) this.log("playlistsClick: "+enyo.json.stringify(row));
		
		this.doUpdateSpinner(true);
		this.doDataRequest("songsList", "playlist_songs", "&filter="+row.id);
		this.doViewSelected("songsList");
				
	},
	
});

