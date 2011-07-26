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
		onBannerMessage: "",
	},
	
	selectedHostIndex: -1,
	selectedHost: {},
	emptyHost: {name: "", url: "http://", username: "", password: ""},
	
	components: [
	
		{name: "editPopup", kind: "Popup", lazy2: false, onBeforeOpen: "beforeEditPopupOpen", onOpen: "editPopupOpen", showKeyboardWhenOpening: true, scrim: true, components: [
			{content: "AmpacheXL", style: "text-align: center; font-size: larger;"},
			{kind: "Divider", caption: "Name"},
			{name: "nameInput", kind: "Input", autoCapitalize: "lowercase"},
			{kind: "Divider", caption: "URL (including 'http://' and ampache directory)"},
			{name: "urlInput", kind: "Input", value: "http://", autoCapitalize: "lowercase"},
			{kind: "Divider", caption: "Username"},
			{name: "usernameInput", kind: "Input", autoCapitalize: "lowercase"},
			{kind: "Divider", caption: "Password"},
			{name: "passwordInput", kind: "PasswordInput", autoCapitalize: "lowercase"},
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
				{name: "editHost", kind: "Image", src: "images/19-gear@2x-light.png", width: "28px", onclick: "editHost", className: "editHost"},
				{name: "deleteHost", kind: "Image", src: "images/11-x@2x-light.png", width: "28px", onclick: "deleteHost", className: "deleteHost"},
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
		
		this.selectedHostIndex = -1;
		this.selectedHost = this.emptyHost;
		
		this.$.editPopup.openAtCenter();
	},
	beforeEditPopupOpen: function() {
		if(debug) this.log("beforeEditPopupOpen");
		
		this.$.nameInput.setValue(this.selectedHost.name);
		this.$.urlInput.setValue(this.selectedHost.url);
		this.$.usernameInput.setValue(this.selectedHost.username);
		this.$.passwordInput.setValue(this.selectedHost.password);
		
	},
	editPopupOpen: function() {
		if(debug) this.log("editPopupOpen");
		
		this.$.nameInput.forceFocusEnableKeyboard();
	},
	saveNew: function() {
		if(debug) this.log("saveNew");
		
		enyo.keyboard.setManualMode(false);
		
		if(this.selectedHostIndex == -1) {
		
			var newHost = {
				name: this.$.nameInput.getValue(), 
				url: this.$.urlInput.getValue(), 
				username: this.$.usernameInput.getValue(), 
				password: this.$.passwordInput.getValue(), 
			};
			
			AmpacheXL.prefsCookie.accounts.push(newHost);
			
		} else {
		
			AmpacheXL.prefsCookie.accounts[this.selectedHostIndex].name = this.$.nameInput.getValue();
			AmpacheXL.prefsCookie.accounts[this.selectedHostIndex].url =  this.$.urlInput.getValue();
			AmpacheXL.prefsCookie.accounts[this.selectedHostIndex].username =  this.$.usernameInput.getValue();
			AmpacheXL.prefsCookie.accounts[this.selectedHostIndex].password =  this.$.passwordInput.getValue();
			
		}
		
		this.$.hostsVirtualList.punt();
		
		this.$.editPopup.close();
		
		this.doSavePreferences();
		
		if(this.$.urlInput.getValue().toUpperCase().indexOf("AMPACHE") < 0) {
			this.doBannerMessage("The URL you entered did not include 'ampache'.  The URL needs to include the approprite Ampache directory for your system.", true);
		} else if(this.$.urlInput.getValue().toUpperCase().indexOf("HTTP") < 0) {
			this.doBannerMessage("The URL you entered did not include the leading 'http' or 'https'.  You need to include that part of the URL.", true);
		} 
			
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
	editHost: function(inSender, inEvent) {
		if(debug) this.log("editHost: "+inEvent.rowIndex);
		
		this.selectedHostIndex = inEvent.rowIndex;
		this.selectedHost = AmpacheXL.prefsCookie.accounts[inEvent.rowIndex];
		
		this.$.editPopup.openAtCenter();
		
	},
	deleteHost: function(inSender, inEvent) {
		if(debug) this.log("deleteHost: "+inEvent.rowIndex);
		
		this.selectedHostIndex = inEvent.rowIndex;
		
		this.$.deletePopup.openAtCenter();
		
	},
	confirmDeleteHost: function() {
		if(debug) this.log("confirmDeleteHost: "+this.selectedHostIndex);
		
		AmpacheXL.prefsCookie.accounts.splice(this.selectedHostIndex,1);
		
		this.$.deletePopup.close();
		this.$.hostsVirtualList.punt();
		this.doSavePreferences();
	},
	cancelDeleteHost: function() {
		if(debug) this.log("cancelDeleteHost");
		
		this.$.deletePopup.close();
	},
	
});

