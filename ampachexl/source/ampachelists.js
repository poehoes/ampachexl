

enyo.kind({
	name: "AmpacheLists",
	kind: "VFlexBox",
	
	events: {
		onDataRequest: "",
	},
	
	fullResultsList: [],
	
	components: [
		{name: "header", kind: "Toolbar", content: "ArtistsList"},
		
		{name: "contentScroller", kind: "Scroller", flex: 1, components: [
			{name: "mainContent", flex: 1, content: "content"},
		]},
		
		{name: "footer", kind: "Toolbar", components: [
			//
		]},
	],
	
	activate: function() {
		if(debug) this.log("activate");
	},
	
	dataRequestResponse: function(inResponse) {
		if(debug) this.log("dataRequestResponse");
		
	},
	
});
