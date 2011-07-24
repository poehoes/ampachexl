
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
		onUpdatePlaybackStatus: "",
	},
	
	movingSlider: false,
	startPlayingTimer: "",
	
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
		
		AmpacheXL.currentAudioObjectIndex = 0;
		AmpacheXL.audioObjects = [];
		AmpacheXL.audioObjects[AmpacheXL.currentAudioObjectIndex] = new Audio();
		
		AmpacheXL.audioObjects[AmpacheXL.currentAudioObjectIndex].addEventListener("playing", enyo.bind(this, "playingEvent"), false);
		AmpacheXL.audioObjects[AmpacheXL.currentAudioObjectIndex].addEventListener("pause", enyo.bind(this, "pauseEvent"), false);
		AmpacheXL.audioObjects[AmpacheXL.currentAudioObjectIndex].addEventListener("timeupdate", enyo.bind(this, "timeupdateEvent"), false);
		AmpacheXL.audioObjects[AmpacheXL.currentAudioObjectIndex].addEventListener("ended", enyo.bind(this, "endedEvent"), false);
		AmpacheXL.audioObjects[AmpacheXL.currentAudioObjectIndex].addEventListener("error", enyo.bind(this, "errorEvent"), false);
		
	},
	
	playSong: function(inSongObject) {
		if(debug) this.log("playSong: "+enyo.json.stringify(inSongObject));
		
		clearTimeout(this.startPlayingTimer);
		
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
		AmpacheXL.audioObjects[AmpacheXL.currentAudioObjectIndex].pause();
		AmpacheXL.audioObjects[AmpacheXL.currentAudioObjectIndex].src = "";
		
		AmpacheXL.audioObjects[AmpacheXL.currentAudioObjectIndex].src = inSongObject.url;
		this.startPlayingTimer = setTimeout(enyo.bind(this, "playingFailed"), 8000);
		AmpacheXL.audioObjects[AmpacheXL.currentAudioObjectIndex].play();
		
		this.$.songTitle.setContent(inSongObject.title);
		this.$.songArtist.setContent(inSongObject.artist);
		this.$.songAlbum.setContent(inSongObject.album);
		
	},
	disconnect: function() {
		if(debug) this.log("disconnect");
		
		AmpacheXL.audioObjects[AmpacheXL.currentAudioObjectIndex].pause();
		AmpacheXL.audioObjects[AmpacheXL.currentAudioObjectIndex].src = "";
		
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
		
		AmpacheXL.audioObjects[AmpacheXL.currentAudioObjectIndex].currentTime = newTime;
		
	},
	pauseClick: function() {
		if(debug) this.log("pauseClick");
		
		//this.$.songSound.audio.pause();
		AmpacheXL.audioObjects[AmpacheXL.currentAudioObjectIndex].pause();
	},
	playClick: function() {
		if(debug) this.log("playClick");
		
		//this.$.songSound.audio.play();
		AmpacheXL.audioObjects[AmpacheXL.currentAudioObjectIndex].play();
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
		
		clearTimeout(this.startPlayingTimer);
		
		this.$.play.hide();
		if(AmpacheXL.connected) this.$.pause.show();
		
		AmpacheXL.currentSong.status = "playing";
		this.doUpdatePlaybackStatus();
		
		//this.$.totalTime.setContent(floatToTime(AmpacheXL.audioObjects[AmpacheXL.currentAudioObjectIndex].duration));
		this.$.totalTime.setContent(floatToTime(AmpacheXL.currentSong.time));
	},
	timeupdateEvent: function() {
		//if(debug) this.log("timeupdateEvent: "+AmpacheXL.audioObjects[AmpacheXL.currentAudioObjectIndex].currentTime);
		
		clearTimeout(this.startPlayingTimer);
		
		//var progress = parseInt(100 * (AmpacheXL.audioObjects[AmpacheXL.currentAudioObjectIndex].currentTime/AmpacheXL.audioObjects[AmpacheXL.currentAudioObjectIndex].duration));
		var progress = parseInt(100 * (AmpacheXL.audioObjects[AmpacheXL.currentAudioObjectIndex].currentTime/AmpacheXL.currentSong.time));
		
		if((!this.movingSlider)&&(AmpacheXL.connected))  {
			this.$.songSlider.setPosition(progress);
			this.$.progressTime.setContent(floatToTime(AmpacheXL.audioObjects[AmpacheXL.currentAudioObjectIndex].currentTime));
		}
	},
	pauseEvent: function() {
		if(debug) this.log("pauseEvent: "+AmpacheXL.audioObjects[AmpacheXL.currentAudioObjectIndex].currentTime);
		
		if(AmpacheXL.connected) this.$.play.show();
		this.$.pause.hide();
		
		AmpacheXL.currentSong.status = "paused";
		this.doUpdatePlaybackStatus();
	},
	endedEvent: function() {
		if(debug) this.log("endedEvent");
		
		if(AmpacheXL.connected) this.$.play.show();
		this.$.pause.hide();
		
		AmpacheXL.currentSong.status = "stopped";
		this.doUpdatePlaybackStatus();
		
		this.doNextTrack();
	},
	errorEvent: function() {
		if(debug) this.log("errorEvent");
		
		clearTimeout(this.startPlayingTimer);
		
		this.error(AmpacheXL.audioObjects[AmpacheXL.currentAudioObjectIndex].error);
		
		this.playingFailed();
		
		//if(AmpacheXL.connected) this.doBannerMessage("Error playing file '"+AmpacheXL.currentSong.title+"'");
		//this.doNextTrack();
	},
	
	playingFailed: function() {
		if(debug) this.log("playingFailed at currentAudioObjectIndex: "+AmpacheXL.currentAudioObjectIndex);
		
		if(AmpacheXL.connected) this.doBannerMessage("Error playing file '"+AmpacheXL.currentSong.title+"'");
		
		AmpacheXL.audioObjects[AmpacheXL.currentAudioObjectIndex].removeEventListener("playing", enyo.bind(this, "playingEvent"), false);
		AmpacheXL.audioObjects[AmpacheXL.currentAudioObjectIndex].removeEventListener("pause", enyo.bind(this, "pauseEvent"), false);
		AmpacheXL.audioObjects[AmpacheXL.currentAudioObjectIndex].removeEventListener("timeupdate", enyo.bind(this, "timeupdateEvent"), false);
		AmpacheXL.audioObjects[AmpacheXL.currentAudioObjectIndex].removeEventListener("ended", enyo.bind(this, "endedEvent"), false);
		AmpacheXL.audioObjects[AmpacheXL.currentAudioObjectIndex].removeEventListener("error", enyo.bind(this, "errorEvent"), false);
		
		AmpacheXL.audioObjects[AmpacheXL.currentAudioObjectIndex].pause();
		AmpacheXL.audioObjects[AmpacheXL.currentAudioObjectIndex].src = "";
		//AmpacheXL.audioObjects[AmpacheXL.currentAudioObjectIndex].destroy();
		
		AmpacheXL.currentAudioObjectIndex++;
		AmpacheXL.audioObjects[AmpacheXL.currentAudioObjectIndex] = new Audio();
		
		AmpacheXL.audioObjects[AmpacheXL.currentAudioObjectIndex].addEventListener("playing", enyo.bind(this, "playingEvent"), false);
		AmpacheXL.audioObjects[AmpacheXL.currentAudioObjectIndex].addEventListener("pause", enyo.bind(this, "pauseEvent"), false);
		AmpacheXL.audioObjects[AmpacheXL.currentAudioObjectIndex].addEventListener("timeupdate", enyo.bind(this, "timeupdateEvent"), false);
		AmpacheXL.audioObjects[AmpacheXL.currentAudioObjectIndex].addEventListener("ended", enyo.bind(this, "endedEvent"), false);
		AmpacheXL.audioObjects[AmpacheXL.currentAudioObjectIndex].addEventListener("error", enyo.bind(this, "errorEvent"), false);
		
		if(AmpacheXL.connected) this.$.play.show();
		this.$.pause.hide();
		
		this.doNextTrack();
	},

});
	

//asdf