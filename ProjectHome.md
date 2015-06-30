Download app here: http://developer.palm.com/appredirect/?packageid=com.thewbman.ampachexl

# Ampache XL #
A webOS app for Ampache written in the enyo framework for webOS tablets.

## Overview ##
A webOS app for Ampache written in the enyo framework and designed for use on a tablet.  The app takes some inspiration and tiny bit of code from the [Ampache Mobile](http://code.google.com/p/ampache-mobile/) app, though it was written from scratch using a completely different framework.

_WARNING: This app requires an Ampache Server to connect to. That means you will be responsible for installing and configuring your very own web server. Setting up Ampache is not a hard task but it's also not trivial. If you are a beginner be sure to read up and look to the forums for help and be prepared to spend some time._

### Current Features ###
  * Connects quickly to an existing Ampache system
  * Multiple Ampache system settings can be saved on the app
  * Supports various Ampache features like album art and transcoding of music files to different formats (configured on server side)
  * Search through your entire music catalog quickly
  * Buffering of next song for seamless playback
  * Dashboard controls

## Upcoming Features ##
  * There isn't a firm list of future updates that might happen, but you can see the latest version of the todo list here: http://ampachexl.googlecode.com/svn/trunk/%20ampachexl/ampachexl/todo.txt

## Screenshots ##
![http://ampachexl.googlecode.com/svn/trunk/%20ampachexl/ampachexl/screenshots/ampachexl_2011-26-07_000231.png](http://ampachexl.googlecode.com/svn/trunk/%20ampachexl/ampachexl/screenshots/ampachexl_2011-26-07_000231.png)
![http://ampachexl.googlecode.com/svn/trunk/%20ampachexl/ampachexl/screenshots/ampachexl_2011-26-07_000302.png](http://ampachexl.googlecode.com/svn/trunk/%20ampachexl/ampachexl/screenshots/ampachexl_2011-26-07_000302.png)
![http://ampachexl.googlecode.com/svn/trunk/%20ampachexl/ampachexl/screenshots/ampachexl_2011-26-07_000438.png](http://ampachexl.googlecode.com/svn/trunk/%20ampachexl/ampachexl/screenshots/ampachexl_2011-26-07_000438.png)

## Setup ##
_These setup instructions are copied from the [Ampache Mobile](http://code.google.com/p/ampache-mobile/) website._
**WARNING: Setting up an Ampache is not a hard task but it's also not trivial, If you are a beginner be sure to read the linked documentation carefully**

  1. Setup instructions of the Ampache Music Server can be found at
    * Windows: [Some Guides and Tutorials](http://code.google.com/p/ampache-mobile/wiki/WindowsAmpacheServer)
    * Other Operating Systems: [Ampache Wiki](http://ampache.org/wiki/)
    * It's best to get Ampache working from a PC first before attempting to use it from your phone. If it doesn't work from a PC it likely won't work on your phone.
  1. Configure the server with an ACL to Allow Remote Access
    * [ACL Guide](http://ampache.org/wiki/config:acl)
  1. (Optional) Transcoding makes the app much more responsive as it requires far less bandwidth to stream a song
    * Get this working on a PC first, it will be much easier to troubleshoot
    * [Ampache Transcoding Guide](http://ampache.org/wiki/config:transcode)
  1. Set up your server for external access
    * If you plan to use this over the internet/cellular network you will need a way to get your home IP address.  http://www.google.com/search?q=free+dynamic+dns
    * Open the correct ports for Ampache on your firewall/router this is usually the standard HTTP port (80)

## Support ##
  * The best way to seek help is on the [Precentral forums](http://forums.precentral.net/webos-apps/288747-announcing-ampachexl-touchpad.html) for the app.  Be sure to see if anyone before you had similar problems and got it fixed.
  * You can also email the developer directly at [ampachexl.help@gmail.com](mailto:ampachexl.help@gmail.com?subject=AmpacheXL+Support) or contact me on twitter [@webmyth\_dev](http://twitter.com/webmyth_dev)

## Donations ##
  * I don't want any donations myself.  But if you would like to donate you can donate to the WebOS Internals group.  They are a phenomenal group who have done so much for the WebOS community.  I am not personally affiliated with them in any way but think they deserve all the support they can get.  http://www.webos-internals.org/wiki/WebOS_Internals:Site_support

**_NOTE:_** Ampache XL uses Metrix for some basic analytics.  The analytics are only used to provide basic information on the total number of users for the app and their country of usage.  http://metrix.webosroundup.com/privacy.
The app will not submit any information to Metrix on its first run.  The app will start submitting anonymous information with the second run of the app unless it is specifically disabled in the app's preferences.

### Other apps I have made ###
  * [WebMyth](http://code.google.com/p/webmyth/): An open source webOS app for controlling a MythTV frontend, made for the Palm Pre and Pixi
  * [KTorrentTouch](http://code.google.com/p/ktorrenttouch/): A webOS app for controlling a KTorrent program, made for the HP TouchPad
  * [WebMyth2](http://code.google.com/p/webmyth2/): A rewrite of WebMyth for the HP TouchPad