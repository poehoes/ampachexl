
enyo.kind({
	name: "Playback",
	className: "Playback",
	kind: "Control",
	
	events: {
		onViewSelected: "",
		onDataRequest: "",
		onUpdateSpinner: "",
		onPreviousTrack: "",
		onNextTrack: "",
		onBannerMessage: "",
	},
	
	movingSlider: false,
	
	components: [
		
		//{name: "leftMenuScroller", kind: "Scroller", flex: 1, components: [
			
			
			{name: "songArt", kind: "Image"},
			
			{name: "songArtist", content: "&nbsp;", allowHtml: true, className: "playbackSongArtist truncating"},
			{name: "songTitle", content: "&nbsp;", allowHtml: true, className: "playbackSongTitle truncating"},
			{name: "songAlbum", content: "&nbsp;", allowHtml: true, className: "playbackSongAlbum truncating"},
			
			{name: "songTimeWrapper", kind: "HFlexBox", className: "songTimeWrapper", align: "center", pack: "center", components: [
				{name: "progressTime", className: "playbackTime"},
				{name: "songSlider", kind: "Slider", className: "songSlider", showing: false, flex: 1, onChanging: "songSliderChanging", onChange: "songSliderChange", animationPosition: false},
				{name: "totalTime", className: "playbackTime"},
			]},
		//]},
		
			//{name: "songSoundWrapper", className: "songSoundWrapper", showing: true, kind: "Item", layoutKind: "HFlexLayout", align: "center", pack: "center", components: [
				//{name: "songVideo", kind: "Video", src: "", showControls: true, flex: 1, width: "280px", height: "25px"},
				{name: "songSound", kind: "Sound", src: "", showControls: true, flex: 1, width: "280px", height: "25px"},
			//]},
			
		{name: "footer", kind: "Toolbar", components: [
			{kind: "Spacer"},
			{name: "previous", caption: "<<", showing: false, allowHtml: true, onclick: "previousClick"},
			{kind: "Spacer"},
			{name: "play", caption: "Play", showing: false, onclick: "playClick"},
			{name: "pause", caption: "Pause", showing: false, onclick: "pauseClick"},
			{kind: "Spacer"},
			{name: "next", caption: ">>", showing: false, allowHtml: true, onclick: "nextClick"},
			{kind: "Spacer"},
		]},
	],
	
	create: function() {
		if(debug) this.log("create");
		this.inherited(arguments);
		
		//this.render();
		
		AmpacheXL.audioObject = new Audio();
		
		AmpacheXL.audioObject.addEventListener("playing", enyo.bind(this, "playingEvent"), false);
		AmpacheXL.audioObject.addEventListener("pause", enyo.bind(this, "pauseEvent"), false);
		AmpacheXL.audioObject.addEventListener("timeupdate", enyo.bind(this, "timeupdateEvent"), false);
		//AmpacheXL.audioObject.addEventListener("play", enyo.bind(this, "playEvent"), false);
		AmpacheXL.audioObject.addEventListener("ended", enyo.bind(this, "endedEvent"), false);
		AmpacheXL.audioObject.addEventListener("error", enyo.bind(this, "errorEvent"), false);
		
	},
	
	playSong: function(inSongObject) {
		if(debug) this.log("playSong: "+enyo.json.stringify(inSongObject));
		
		AmpacheXL.currentSong = inSongObject;
		
		this.$.songSlider.show();
		this.$.previous.show();
		this.$.play.hide();
		this.$.pause.show();
		this.$.next.show();
		
		this.$.songArt.addClass("playbackSongArt");
		this.$.songArt.setSrc(inSongObject.art);
		
		this.render();
		
		//remove previous song
		AmpacheXL.audioObject.pause();
		AmpacheXL.audioObject.src = "";
		
		AmpacheXL.audioObject.src = inSongObject.url;
		AmpacheXL.audioObject.play();
		
		this.$.songTitle.setContent(inSongObject.title);
		this.$.songArtist.setContent(inSongObject.artist);
		this.$.songAlbum.setContent(inSongObject.album);
		
	},
	disconnect: function() {
		if(debug) this.log("disconnect");
		
		AmpacheXL.audioObject.pause();
		AmpacheXL.audioObject.src = "";
		
		this.$.songSlider.hide();
		this.$.previous.hide();
		this.$.play.hide();
		this.$.pause.hide();
		this.$.next.hide();
		
		this.$.songArt.removeClass("playbackSongArt");
		this.$.songArt.setSrc("");
		
		this.$.songTitle.setContent("");
		this.$.songArtist.setContent("");
		this.$.songAlbum.setContent("");
		
		this.$.progressTime.setContent("");
		this.$.totalTime.setContent("");
		
		this.render();
	},
	
	songSliderChanging: function(inSender, inEvent) {
		if(debug) this.log("songSliderChanging: "+this.$.songSlider.getPosition());
		
		this.movingSlider = true;
		
		var newTime = parseInt(this.$.songSlider.getPosition()*AmpacheXL.currentSong.time/100);
		
		this.$.progressTime.setContent(floatToTime(newTime));
		
	},
	songSliderChange: function(inSender, inEvent) {
		if(debug) this.log("songSliderChange: "+this.$.songSlider.getPosition());
		
		this.movingSlider = false;
		
		var newTime = parseInt(this.$.songSlider.getPosition()*AmpacheXL.currentSong.time/100);
		
		AmpacheXL.audioObject.currentTime = newTime;
		
	},
	pauseClick: function() {
		if(debug) this.log("pauseClick");
		
		//this.$.songSound.audio.pause();
		AmpacheXL.audioObject.pause();
	},
	playClick: function() {
		if(debug) this.log("playClick");
		
		//this.$.songSound.audio.play();
		AmpacheXL.audioObject.play();
	},
	previousClick: function() {
		if(debug) this.log("previousClick");
		
		this.doPreviousTrack();
	},
	nextClick: function() {
		if(debug) this.log("nextClick");
		
		this.doNextTrack();
	},
	
	playingEvent: function() {
		if(debug) this.log("playingEvent");
		
		this.$.play.hide();
		if(AmpacheXL.connected) this.$.pause.show();
		
		//this.$.totalTime.setContent(floatToTime(AmpacheXL.audioObject.duration));
		this.$.totalTime.setContent(floatToTime(AmpacheXL.currentSong.time));
	},
	timeupdateEvent: function() {
		//if(debug) this.log("timeupdateEvent: "+AmpacheXL.audioObject.currentTime);
		
		//var progress = parseInt(100 * (AmpacheXL.audioObject.currentTime/AmpacheXL.audioObject.duration));
		var progress = parseInt(100 * (AmpacheXL.audioObject.currentTime/AmpacheXL.currentSong.time));
		
		if(!this.movingSlider) {
			this.$.songSlider.setPosition(progress);
			this.$.progressTime.setContent(floatToTime(AmpacheXL.audioObject.currentTime));
		}
	},
	pauseEvent: function() {
		if(debug) this.log("pauseEvent: "+AmpacheXL.audioObject.currentTime);
		
		if(AmpacheXL.connected) this.$.play.show();
		this.$.pause.hide();
	},
	endedEvent: function() {
		if(debug) this.log("endedEvent");
		
		if(AmpacheXL.connected) this.$.play.show();
		this.$.pause.hide();
		
		this.doNextTrack();
	},
	errorEvent: function() {
		if(debug) this.log("errorEvent");
		
		console.error(AmpacheXL.audioObject.error);
		
		this.doBannerMessage("Error playing file '"+AmpacheXL.currentSong.title+"'");
		
		this.doNextTrack();
	},

});
	

//asdf