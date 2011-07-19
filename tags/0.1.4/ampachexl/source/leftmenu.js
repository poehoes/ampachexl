
enyo.kind({
	name: "LeftMenuKind",
	className: "LeftMenuKind",
	kind: "VFlexBox",
	
	events: {
		onViewSelected: "",
		onDataRequest: "",
		onUpdateSpinner: "",
		onBannerMessage: "",
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
			
			//random
			
			{name: "searchItem", kind: "Item", className: "menuItem", layoutKind: "HFlexLayout", onclick: "itemClick", components: [
				{name: "searchItemTitle", content: "Search", flex: 1},
				{name: "searchItemCount"},
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
			this.$.nowplayingItemCount.setContent(AmpacheXL.nowplayingIndex+"/"+AmpacheXL.nowplaying.length);
		}	
		
		this.$.artistsItemCount.setContent(AmpacheXL.connectResponse.artists);
		this.$.albumsItemCount.setContent(AmpacheXL.connectResponse.albums);
		this.$.playlistsItemCount.setContent(AmpacheXL.connectResponse.playlists);
		this.$.videosItemCount.setContent(AmpacheXL.connectResponse.videos);
		this.$.songsItemCount.setContent(AmpacheXL.connectResponse.songs);
		
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
			case "videosItem":
				if(AmpacheXL.allVideos.length == 0) {
					this.doUpdateSpinner(true);
					this.doDataRequest("videosList", "videos", "");
				}
				this.doViewSelected("videosList");
				break;
				
			case "songsItem":
				AmpacheXL.selectedAlbum = null;
				this.doUpdateSpinner(true);
				this.doDataRequest("songsList", "songs", "");
				this.doViewSelected("songsList");
				break;
		};
		
		} else {
			this.doBannerMessage("You must connect to a host first", true);
		}
	},

});
	

//asdf