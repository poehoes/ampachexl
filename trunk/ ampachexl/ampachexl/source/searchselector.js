

enyo.kind({
	name: "SearchSelector",
	kind: "VFlexBox",
	
	components: [
		{name: "header", kind: "Toolbar", content: "SearchSelector"},
		
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
		
		this.$.mainContent.setContent(inResponse);
	},
	
});



//asdf