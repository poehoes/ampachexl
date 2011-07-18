


enyo.kind({
	name: "Hosts",
	kind: "VFlexBox",
	className: "Hosts listContent",
	
	events: {
		onViewSelected: "",
		onDataRequest: "",
		onUpdateSpinner: "",
		onOpenWeb: "",
		onPlaySong: "",
		onUpdateCounts: "",
		onAmpacheConnect: "",
		onSavePreferences: "",
	},
	
	components: [
	
		{name: "addPopup", kind: "Popup", lazy: false, showKeyboardWhenOpening: true, scrim: true, components: [
			{content: "AmpacheXL", style: "text-align: center; font-size: larger;"},
			{kind: "Divider", caption: "Name"},
			{name: "nameInput", kind: "Input"},
			{kind: "Divider", caption: "URL (including 'http://' and ampache directory)"},
			{name: "urlInput", kind: "Input", value: "http://"},
			{kind: "Divider", caption: "Username"},
			{name: "usernameInput", kind: "Input"},
			{kind: "Divider", caption: "Password"},
			{name: "passwordInput", kind: "PasswordInput"},
			{kind: "Button", caption: "Save", onclick:"saveNew"},
		]},
		
		{name: "deletePopup", kind: "Popup", scrim: true, components: [
			{content: "Are you sure you want to delete this host?", style: "text-align: center; font-size: smaller;"},
			{kind: "Button", caption: "Yes", className: "enyo-button-affirmative", onclick:"confirmDeleteHost"},
			{kind: "Button", caption: "No", className: "enyo-button-negative", onclick:"cancelDeleteHost"},
		]},
	
		{name: "header", kind: "Toolbar", layoutKind: "VFlexLayout", onclick: "headerClick", components: [
			{name: "headerTitle", kind: "Control", content: "Hosts", className: "headerTitle"},
			{name: "headerSubtitle", kind: "Control", content: "Select your Ampache system", className: "headerSubtitle"},
		]},
							
		{name: "hostsVirtualList", kind: "VirtualList", onSetupRow: "setupHostsItem", flex: 1, components: [
			{name: "hostsItem", kind: "Item", className: "listItem", layoutKind: "HFlexLayout", align: "center", components: [
				{kind: "VFlexBox", flex: 1, onclick: "hostsClick", components: [
					{name: "hostsName", className: "title"},
					{name: "hostsUrl", className: "subtitle"},
				]},
				{kind: "VFlexBox", onclick: "hostsClick", components: [
					{name: "hostsUsername", className: "count"},
					{name: "hostsPassword", className: "count"},
				]},
				{name: "deleteHost", kind: "Image", src: "images/11-x@2x.png", onclick: "deleteHost", className: "deleteHost"},
			]},
		]},
		
		{name: "footer", kind: "Toolbar", layoutKind: "HFlexLayout", components: [
			{kind: "Spacer"},
			{content: "Add", onclick: "addClick"},
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
		
		this.$.hostsVirtualList.punt();
		
		//this.$.headerSubtitle.setContent(AmpacheXL.hosts.length+" items");
		
	},
	resize: function() {
		if(debug) this.log("resize");
		
		this.$.hostsVirtualList.resized();
	},
	
	addClick: function() {
		if(debug) this.log("addClick");
		
		this.$.addPopup.openAtCenter();
	},
	saveNew: function() {
		if(debug) this.log("saveNew");
		
		enyo.keyboard.setManualMode(false);
		
		var newHost = {
			name: this.$.nameInput.getValue(), 
			url: this.$.urlInput.getValue(), 
			username: this.$.usernameInput.getValue(), 
			password: this.$.passwordInput.getValue(), 
		};
		
		AmpacheXL.prefsCookie.accounts.push(newHost);
		
		this.$.hostsVirtualList.punt();
		
		this.$.addPopup.close();
		
		this.doSavePreferences();
	},
	
	setupHostsItem: function(inSender, inIndex) {
		//if(debug) this.log("setupHostsItem: "+inIndex);
		
		var row = AmpacheXL.prefsCookie.accounts[inIndex];
		
		if(row) {
		
			//accounts: [{name: "local", url: "http://192.168.1.105/ampache/", username: "ampachexl", password: "ampachexl"}],
		
			this.$.hostsItem.applyStyle("border-top", "1px solid silver;");
			this.$.hostsItem.applyStyle("border-bottom", "none;");
			
			this.$.hostsName.setContent(row.name);
			this.$.hostsUrl.setContent(row.url);
			
			this.$.hostsUsername.setContent(row.username);
			this.$.hostsPassword.setContent("*********");
			
			return true;
		
		}
	},
	
	headerClick: function() {
		if(debug) this.log("headerClick");
		
		this.$.hostsVirtualList.punt();
	},
	hostsClick: function(inSender, inEvent) {
		if(debug) this.log("hostsClick: "+inEvent.rowIndex);
		
		var row = AmpacheXL.prefsCookie.accounts[inEvent.rowIndex];
		
		AmpacheXL.prefsCookie.currentAccountIndex = inEvent.rowIndex;
		
		this.doAmpacheConnect();
		
	},
	deleteHost: function(inSender, inEvent) {
		if(debug) this.log("deleteHost: "+inEvent.rowIndex);
		
		this.selectedHost = inEvent.rowIndex;
		
		this.$.deletePopup.openAtCenter();
		
	},
	confirmDeleteHost: function() {
		if(debug) this.log("confirmDeleteHost: "+this.selectedHost);
		
		AmpacheXL.prefsCookie.accounts.splice(this.selectedHost,1);
		
		this.$.deletePopup.close();
		this.$.hostsVirtualList.punt();
		this.doSavePreferences();
	},
	cancelDeleteHost: function() {
		if(debug) this.log("cancelDeleteHost");
		
		this.$.deletePopup.close();
	},
	
});

