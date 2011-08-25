
enyo.kind({
	name: "VideosList",
	kind: "VFlexBox",
	
	events: {
		onDataRequest: "",
	},
	
	fullResultsList: [],
	
	components: [
		{name: "header", kind: "Toolbar", content: "VideosList"},
		
		{name: "contentScroller", kind: "Scroller", flex: 1, components: [
			{name: "mainContent", flex: 1, content: "content"},
		]},
		
		{name: "footer", kind: "Toolbar", components: [
			//
		]},
	],
	
	activate: function() {
		if(debug) this.log("activate");
		
		if(this.$.mainContent.getContent() == "content") {
			this.doDataRequest("videosList", "videos", "&limit=100");
		}
	},
	
	dataRequestResponse: function(inResponse) {
		if(debug) this.log("dataRequestResponse");
		
		//this.$.mainContent.setContent(inResponse);
		
		this.fullResultsList.length = 0;
		
		var xmlobject = (new DOMParser()).parseFromString(inResponse, "text/xml");
		
		var videosNodes, singleVideoNode, singleVideoChildNode;
		var s = {};
		
		videosNodes = xmlobject.getElementsByTagName("video");
		for(var i = 0; i < videosNodes.length; i++) {
			singleVideoNode = videosNodes[i];
			s = {};
			
			s.id = singleVideoNode.getAttributeNode("id").nodeValue;
			
			for(var j = 0; j < singleVideoNode.childNodes.length; j++) {
				singleVideoChildNode = singleVideoNode.childNodes[j];
				
				switch(singleVideoChildNode.nodeName) {
					case "name":
						s.name = singleVideoChildNode.childNodes[0].nodeValue;
						break;
					case "title":
						s.title = singleVideoChildNode.childNodes[0].nodeValue;
						break;
					case "mime":
						s.mime = singleVideoChildNode.childNodes[0].nodeValue;
						break;
					case "resolution":
						s.resolution = singleVideoChildNode.childNodes[0].nodeValue;
						break;
					case "size":
						s.size = singleVideoChildNode.childNodes[0].nodeValue;
						break;
					case "url":
						s.url = singleVideoChildNode.childNodes[0].nodeValue;
						break;
				}
				
			}
		
			this.fullResultsList.push(s);
		
		}
		
		//if(debug) this.log("fullResultsList: "+enyo.json.stringify(this.fullResultsList));
		
		this.$.mainContent.setContent(enyo.json.stringify(this.fullResultsList));
		
		/*
		<video id="1234">
			 <title>Futurama Bender's Big Score</title>
			 <mime>video/avi</mime>
			 <resolution>720x288</resolution>
			 <size>Video Filesize in Bytes</size>
			 <tag id="12131" count="3">Futurama</tag>
			 <tag id="32411" count="1">Movie</tag>
			 <url>http://localhost/play/index.php?oid=123908...</url>
		</video>
		*/
		
	},
	
});