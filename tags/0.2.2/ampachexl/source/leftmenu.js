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
	name: "LeftMenuKind",
	className: "LeftMenuKind",
	kind: "VFlexBox",
	
	events: {
		onViewSelected: "",
		onDataRequest: "",
		onUpdateSpinner: "",
		onBannerMessage: "",
		onOpenAppMenu: "",
	},
		
	
	components: [
		{name: "header", kind: "Toolbar", layoutKind: "VFlexLayout", onclick: "headerClick", components: [
			{name: "headerTitle", kind: "Control", content: "Ampache XL", className: "headerTitle"},
			{name: "headerSubtitle", kind: "Control", className: "headerSubtitle"},
		]},
		
		{name: "leftMenuScroller", kind: "Scroller", flex: 1, components: [
			{name: "nowplayingItem", kind: "Item", className: "menuItem", layoutKind: "HFlexLayout", onclick: "itemClick", components: [
				{name: "nowplayingItemTitle", content: "Now Playing", flex: 1},
				{name: "nowplayingItemCount"},
			]},
			
			{name: "searchItem", kind: "Item", className: "menuItem", layoutKind: "HFlexLayout", onclick: "itemClick", components: [
				{name: "searchItemTitle", content: "Search", flex: 1},
				//name: "searchItemCount"},
			]},
			
			{name: "randomItem", kind: "Item", className: "menuItem", layoutKind: "HFlexLayout", onclick: "itemClick", components: [
				{name: "randomItemTitle", content: "Random Album", flex: 1},
				//name: "randomItemCount"},
			]},
			
			{name: "artistsItem", kind: "Item", className: "menuItem", layoutKind: "HFlexLayout", onclick: "itemClick", components: [
				{name: "artistsItemTitle", content: "Artists", flex: 1},
				{name: "artistsItemCount"},
			]},
			{name: "albumsItem", kind: "Item", className: "menuItem", layoutKind: "HFlexLayout", onclick: "itemClick", components: [
				{name: "albumsItemTitle", content: "Albums", flex: 1},
				{name: "albumsItemCount"},
			]},
			{name: "playlistsItem", kind: "Item", className: "menuItem", layoutKind: "HFlexLayout", onclick: "itemClick", components: [
				{name: "playlistsItemTitle", content: "Playlists", flex: 1},
				{name: "playlistsItemCount"},
			]},
			{name: "tagsItem", kind: "Item", className: "menuItem", layoutKind: "HFlexLayout", onclick: "itemClick", components: [
				{name: "tagsItemTitle", content: "Genres", flex: 1},
				{name: "tagsItemCount"},
			]},
			{name: "songsItem", showing: false, kind: "Item", className: "menuItem", layoutKind: "HFlexLayout", onclick: "itemClick", components: [
				{name: "songsItemTitle", content: "Songs", flex: 1},
				{name: "songsItemCount"},
			]},
			{name: "videosItem", showing: false, kind: "Item", className: "menuItem", layoutKind: "HFlexLayout", onclick: "itemClick", components: [
				{name: "videosItemTitle", content: "Videos", flex: 1},
				{name: "videosItemCount"},
			]},
		
		]},		
		
	],
	
	create: function() {
		if(debug) this.log("create");
		this.inherited(arguments);
		
		this.render();
		
		this.$.header.setContent("Ampache XL");
		
	},
	
	updateCounts: function() {
		if(debug) this.log("updateCounts");
		
		if(AmpacheXL.connected) {
			this.$.headerSubtitle.setContent(AmpacheXL.prefsCookie.accounts[AmpacheXL.prefsCookie.currentAccountIndex].name);
		} else {
			this.$.headerSubtitle.setContent("");
		}
		
		if(AmpacheXL.nowplaying.length == 0) {
			this.$.nowplayingItemCount.setContent("");
		} else {
			this.$.nowplayingItemCount.setContent((AmpacheXL.nowplayingIndex+1)+"/"+AmpacheXL.nowplaying.length);
		}	
		
		if(AmpacheXL.connectResponse) {
			this.$.artistsItemCount.setContent(AmpacheXL.connectResponse.artists);
			this.$.albumsItemCount.setContent(AmpacheXL.connectResponse.albums);
			this.$.playlistsItemCount.setContent(AmpacheXL.connectResponse.playlists);
			this.$.songsItemCount.setContent(AmpacheXL.connectResponse.songs);
			if(AmpacheXL.connectResponse.tags) this.$.tagsItemCount.setContent(AmpacheXL.connectResponse.tags);
			this.$.videosItemCount.setContent(AmpacheXL.connectResponse.videos);
			
			if(parseInt(AmpacheXL.connectResponse.videos) == 0) {
				this.$.videosItem.hide();
			} else {
				this.$.videosItem.show();
			}
		}
	},
	
	headerClick: function() {
		if(debug) this.log("headerClick");
		
		this.doOpenAppMenu();
	},
	itemClick: function(inSender) {
		if(debug) this.log("itemClick: "+inSender.getName());
		
		if(AmpacheXL.connected) {
		
		switch(inSender.getName()) {
			case "nowplayingItem":
				this.doViewSelected("nowplaying");
				break;
				
			case "searchItem":
				this.doViewSelected("searchSelector");
				break;
				
			case "randomItem":
				this.doViewSelected("random");
				break;
				
			case "artistsItem":
				if(AmpacheXL.allArtists.length == 0) {
					this.doUpdateSpinner(true);
					this.doDataRequest("artistsList", "artists", "");
				}
				this.doViewSelected("artistsList");
				break;
			case "albumsItem":
				AmpacheXL.selectedArtist = null;
				if(AmpacheXL.allAlbums.length == 0) {
					this.doUpdateSpinner(true);
					this.doDataRequest("albumsList", "albums", "");
				}
				this.doViewSelected("albumsList");
				break;
			case "playlistsItem":
				if(AmpacheXL.allPlaylists.length == 0) {
					this.doUpdateSpinner(true);
					this.doDataRequest("playlistsList", "playlists", "");
				}
				this.doViewSelected("playlistsList");
				break;
			case "tagsItem":
				if(AmpacheXL.allTags.length == 0) {
					this.doUpdateSpinner(true);
					this.doDataRequest("tagsList", "tags", "");
				}
				this.doViewSelected("tagsList");
				break;
				
			case "songsItem":
				AmpacheXL.selectedAlbum = null;
				if(AmpacheXL.allSongs.length == 0) {
					this.doUpdateSpinner(true);
					this.doDataRequest("songsList", "songs", "&limit="+AmpacheXL.connectResponse.songs);
				}
				this.doViewSelected("songsList");
				break;
				
			case "videosItem":
				if(AmpacheXL.allVideos.length == 0) {
					this.doUpdateSpinner(true);
					this.doDataRequest("videosList", "videos", "");
				}
				this.doViewSelected("videosList");
				break;
		};
		
		} else {
			this.doBannerMessage("You must connect to a host first", true);
		}
	},

});
	

//asdf