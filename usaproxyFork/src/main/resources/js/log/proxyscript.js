/** Core UsaProxy JavaScript part.
	This proxyscript.js is used for pure logging of user activity
	without any collaboration functionality */

;(function( document, window, undefined ) {

var jQuery_UsaProxy = window.UsaProxy.jQuery; // Reference to jQuery.
	
var logVal_UsaProxy;			// String: Initialised when page loads. Contains current event log entries
var FLG_writingLogVal_UsaProxy;	// Boolean: if flag set, writing log entry to logVal_UsaProxy not possible

var IVL_saveLog_UsaProxy;		// Interval function variable for sending captured data to UsaProxy

var serverdataId_UsaProxy;      /* String: contains related serverdata ID defined by UsaProxy 
								 * (page ID assigned by UsaProxy when data was cached)*/

var id_UsaProxy;				// String: contains String identifying the current UsaProxy instance
								 
/* timestamp objects */
var startDate_UsaProxy;			/* Date: Initialised by UsaProxy. Load completion timestamp is  
								   calculated relative to this timestamp */
var loadDate_UsaProxy;			// Date: Initialised on load. All further timestamps are calculated
								// by adding the ms passed since page load completion to this
								//  relative timestamp.

var logContents_UsaProxy;		// Log element contents?

var contentsLimit_UsaProxy;		// Limit contents logging to contentsLimit characters. -1 for no limit.

var FLG_LogMousemove_UsaProxy;	// Boolean: while flag set, mousemove logging is interrupted 
								// for all following log attempts
var lastMousePosX_UsaProxy;		// Integer: last x position of the mouse pointer
var lastMousePosY_UsaProxy;		// Integer: last y position of the mouse pointer

var IVL_scrollCheck_UsaProxy;	// Interval function variable for processScroll_UsaProxy()
var lastScrollPosY_UsaProxy;	// Integer: last position of vertical scrollbar resp. top offset of document
var lastScrollPosX_UsaProxy;	// Integer: last position of vhorozontal scrollbar resp. left offset of document

var keyName_UsaProxy;			// String: holds current pressed key/key combination
var FLG_ctrlPressed_UsaProxy;	// Boolean: flag is set when ctrl-key is pressed (and reset when released)
var FLG_ctrl_comb_UsaProxy;		// additional flag for ctrl+key combinations
var FLG_altPressed_UsaProxy;	// Boolean: flag is set when alt-key is pressed (and reset when released)
var FLG_shiftPressed_UsaProxy;	// Boolean: flag is set when shift-key is pressed (and reset when released)
var FLG_keyPress_UsaProxy;		// Boolean: flag disables keypress check; set when any of the control keys is pressed
var FLG_comb_UsaProxy;			// Boolean: flag indicates a key combination
var combMembers_UsaProxy;		// Integer: number of remaining unreleased keys if a key combination was pressed

var lastSelection_UsaProxy;		// String: last selected text

var screenID_UsaProxy = 1;

var lastSavelogExecute = null;

var TIMERINTERVAL = 3000;

/* Initializes all variables, event handlers, and interval functions and
 * invokes the logging of the load event 
 */
function init_UsaProxy() {
	
	logVal_UsaProxy 			= "";
	window.status 				= "";
	FLG_writingLogVal_UsaProxy 	= false;
	
	FLG_LogMousemove_UsaProxy 	= false;
	lastMousePosX_UsaProxy 		= 0;
	lastMousePosY_UsaProxy 		= 0;
	
	/* initialize lastScrollPos_UsaProxy with current top/left offset */
	lastScrollPosY_UsaProxy 	= (window.Event) ? window.pageYOffset : document.body.scrollTop;
	lastScrollPosX_UsaProxy 	= (window.Event) ? window.pageXOffset : document.body.scrollLeft;
	
	lastSelection_UsaProxy 		= "";
	
	keyName_UsaProxy 			= "";
	FLG_ctrlPressed_UsaProxy 	= false;
	FLG_ctrl_comb_UsaProxy		= false;
	FLG_altPressed_UsaProxy 	= false;
	FLG_shiftPressed_UsaProxy 	= false;
	FLG_keyPress_UsaProxy 		= true;
	FLG_comb_UsaProxy 			= false;
	combMembers_UsaProxy 		= 0;
	
	/* retrieve reference string URL parameters */
	var pars_UsaProxy   	= document.getElementById("proxyScript_UsaProxy").src.substring(
			document.getElementById("proxyScript_UsaProxy").src.indexOf("?") );
	// Function for retrieving url parameters
	var getURLParameter = function( pName /* String */ )
	{
		var par_start			= pars_UsaProxy.indexOf("&" + pName + "=");
		if ( par_start === -1 ) par_start = pars_UsaProxy.indexOf("?" + pName + "=");
		if ( par_start === -1 ) return null; // not found
		par_start += pName.length + 2; // scroll to beginning of value
		var par_end				= pars_UsaProxy.indexOf("&", par_start);
		if ( par_end === -1 )	return pars_UsaProxy.substring(par_start);
		return 					pars_UsaProxy.substring(par_start, par_end);
	}
	
	/* retrieve current httptrafficindex which is specified by the parameter sd */
	serverdataId_UsaProxy	= getURLParameter( 'sd' );
	
	/* initialize start date specified by parameter ts */
	startDate_UsaProxy		= date_UsaProxy(getURLParameter( 'ts' ));
	/* initialize UsaProxy instance ID specified by parameter id */
	id_UsaProxy				= getURLParameter( 'id' );
	// Enable/limit contents logging?
	logContents_UsaProxy	= getURLParameter( 'logC' ) === '1';
	contentsLimit_UsaProxy	= parseInt( getURLParameter( 'limC' ) );
	
	/* log load event */
	processLoad_UsaProxy();
	
	/* registration of event handlers
	 * most event handlers are attached to the document/window element
	 * mouse events "bubble" from the target element (such as a button)
	 * to the document element and can be captured there.
	 * Other events such as focus, blur, change need to be directly
	 * captured at the target element */
	
	// NS explicit event capturing
	if(window.Event) {
		document.captureEvents(Event.CHANGE | Event.MOUSEUP | Event.KEYPRESS | Event.KEYDOWN | Event.KEYUP | Event.MOUSEMOVE | Event.MOUSEOVER | Event.FOCUS | Event.BLUR | Event.SELECT);
		window.captureEvents(Event.RESIZE);
	}
	
	/* attach event handlers to avoid overwriting
	 * IE: attachEvent
	 * NS: addEventListener */
	 
	// IE
	if(document.attachEvent) { 
	
		document.attachEvent('onmousedown', processMousedown_UsaProxy);
		document.attachEvent('onkeypress', processKeypress_UsaProxy);
		document.attachEvent('onkeydown', processKeydown_UsaProxy);
		document.attachEvent('onkeyup', processKeyup_UsaProxy);
		document.attachEvent('onmousemove', processMousemove_UsaProxy);
		document.attachEvent('onmouseover', processMouseover_UsaProxy);
		window.attachEvent('onresize', processResize_UsaProxy);
		
		/* change, focus, and blur handler for each relevant element
		 * dropdowns, lists, text fields/areas, file fields, password fields, and checkboxes*/
		/* in addition change, focus, blur, and select listener will be applied to
		 * each relevant element onmouseover (see function processMouseover_UsaProxy) */
		for (var i = 0; i < document.forms.length; ++i) {
			for (var j = 0; j < document.forms[i].elements.length; ++j) {
				if(document.forms[i].elements[j].type) {
					var elType = document.forms[i].elements[j].type;
					if (elType=="select-one" || elType=="select-multiple" || elType=="text" || elType=="textarea" || elType=="file" || elType=="checkbox" || elType=="password" || elType=="radio") {
						document.forms[i].elements[j].attachEvent('onchange', processChange_UsaProxy);
						document.forms[i].elements[j].attachEvent('onblur', processBlur_UsaProxy);
						document.forms[i].elements[j].attachEvent('onfocus', processFocus_UsaProxy);
					}
				}
			}
		}
	}
	
	// NS
	if(document.addEventListener) {
		document.addEventListener('mousedown', processMousedown_UsaProxy, false);
		document.addEventListener('keypress', processKeypress_UsaProxy, false);
		document.addEventListener('keydown', processKeydown_UsaProxy, false);
		document.addEventListener('keyup', processKeyup_UsaProxy, false);
		document.addEventListener('mousemove', processMousemove_UsaProxy, false);
		document.addEventListener('mouseover', processMouseover_UsaProxy, false);
		window.addEventListener('resize', processResize_UsaProxy, false);
		
		/* change, focus, and blur handler for each relevant element
		 * dropdowns, lists, text fields/areas, file fields, password fields, and checkboxes*/
		/* in addition change, focus, blur, and select listener will be applied to
		 * each relevant element onmouseover (see function processMouseover_UsaProxy) */
		for (var i = 0; i < document.forms.length; ++i) {
			for (var j = 0; j < document.forms[i].elements.length; ++j) {
				if(document.forms[i].elements[j].type) {
					var elType = document.forms[i].elements[j].type;
					if (elType=="select-one" || elType=="select-multiple" || elType=="text" || elType=="textarea" || elType=="file" || elType=="checkbox" || elType=="password" || elType=="radio") {
						document.forms[i].elements[j].addEventListener('change', processChange_UsaProxy, false);
						document.forms[i].elements[j].addEventListener('blur', processBlur_UsaProxy, false);
						document.forms[i].elements[j].addEventListener('focus', processFocus_UsaProxy, false);
					}
				}
			}
		}
	}
	
	// Logging element appearances and disappearances
	var waypoints;
	
	// Functions for finding elements' edges' positions within the document
	var getEdgePosition = {
		
		left: function( pElement ) {
			return parseInt( jQuery_UsaProxy( pElement ).offset().left );
		},
		
		top: function( pElement ) {
			return parseInt( jQuery_UsaProxy( pElement ).offset().top );
		},
		
		right: function( pElement ) {
			return getEdgePosition.left( pElement ) + jQuery_UsaProxy( pElement ).innerWidth();
		},
		
		bottom: function( pElement ) {
			return getEdgePosition.top( pElement ) + jQuery_UsaProxy( pElement ).innerHeight();
		}
	};
	
	// Functions for finding the relative positions of elements' edges'
	// Each function returns a number from 0-100. The number is the distance
	// of the element's edge from the document's top/left edge,
	// eg. getRelativeEdgePosition.top() will return the relative distance
	// between the element's top edge and the document's top edge. A distance
	// of 0 means the element's edge is exactly on the document's corresponding
	// edge. A distance of 100 means that the element's edge is on the opposite
	// edge of the document.
	var getRelativeEdgePosition = {
		left: function( pElement ) {
			return (getEdgePosition.left( pElement ) / jQuery_UsaProxy( pElement.ownerDocument ).width()) * 100;
		},
		
		top: function( pElement ) {
			return (getEdgePosition.top( pElement ) / jQuery_UsaProxy( pElement.ownerDocument ).height()) * 100;
		},
		
		right: function( pElement ) {
			return (getEdgePosition.right( pElement ) / jQuery_UsaProxy( pElement.ownerDocument ).width()) * 100;
		},
		
		bottom: function( pElement ) {
			return (getEdgePosition.bottom( pElement ) / jQuery_UsaProxy( pElement.ownerDocument ).height()) * 100;
		}
	};
	
	// Function for resetting a single waypoint.
	// Assumes that the current context (this) is the DOM element being reset.
	var resetWaypoint = function()
	{
		var leftPos = getEdgePosition.left( this );
		var topPos = getEdgePosition.top( this );
		var rightPos = getEdgePosition.right( this );
		var bottomPos = getEdgePosition.bottom( this );
		if ( ! waypoints.left[ leftPos ] )
		{
			waypoints.left[ leftPos ] = [];
		}
		if ( ! waypoints.top[ topPos ] )
		{
			waypoints.top[ topPos ] = [];
		}
		if ( ! waypoints.right[ rightPos ] )
		{
			waypoints.right[ rightPos ] = [];
		}
		if ( ! waypoints.bottom[ bottomPos ] )
		{
			waypoints.bottom[ bottomPos ] = [];
		}
		waypoints.left[ leftPos ].push( this );
		waypoints.top[ topPos ].push( this );
		waypoints.right[ rightPos ].push( this );
		waypoints.bottom[ bottomPos ].push( this );
	};
	
	var getTrackedElements = function( currentFrameDepth, targetDocument, maxFrameDepth )
	{
		// Defaults
		if ( typeof targetDocument === 'undefined' ) targetDocument = document;
		if ( typeof maxFrameDepth === 'undefined' ) maxFrameDepth = window.UsaProxy.maxFrameDepth;
		if ( typeof currentFrameDepth === 'undefined' ) currentFrameDepth = 1;
		
		var els = jQuery_UsaProxy( window.UsaProxy.nodeTypeSelector, targetDocument );

		// Recursion ends when desired depth is reached.
		if ( currentFrameDepth > maxFrameDepth ) return els;
		
		// Contents of frames will be logged (or at least attempted)
		// Same origin may prevent this, but we try it anyway, in case the content
		// is actually from the same origin.
		// Actual frames are logged in their respective httptraffic sessions,
		// but local content is not, which is why we need this.
		jQuery_UsaProxy( 'iframe, frame' ).each( function()
		{
			els = els.add( getTrackedElements( currentFrameDepth + 1, this.contentDocument, maxFrameDepth ) );
		} );
		return els;
	}
	
	var trackedElements = getTrackedElements();
	var resetAllWaypoints = function()
	{
		waypoints = { left: [], top: [], bottom: [], right: [] };
		trackedElements.each( resetWaypoint );
	};
	
	// Events that change the size or shape of the document must also
	// reset all the waypoints. It is impossible to catch every single
	// event that changes the shape of the document. Therefore we do extra
	// checks in the scroll handler.
	jQuery_UsaProxy( document ).ready( resetAllWaypoints );
	jQuery_UsaProxy( window ).on( 'load', resetAllWaypoints );
	jQuery_UsaProxy( 'img' ).on( 'load', resetAllWaypoints );
	
	var getWindow_ = function(doc) {
		  return doc.parentWindow || doc.defaultView;
	};
	
	var logElement = function( pElement, pDisappear, pEdgeName )
	{
		var doc = pElement.ownerDocument;
		relPos = relativeScrollPos( getWindow_( doc ), doc );
		writeLog_UsaProxy( (pDisappear ? "dis" : "") + "appear&nodeName=" + 
			pElement.nodeName + "&nodeId=" + pElement.id + "&edge=" + 
			pEdgeName + "&relativeTop=" + 
			new String( getRelativeEdgePosition.top( pElement ) ).substr(0, 5) + 
			"&relativeBottom=" + 
			new String( getRelativeEdgePosition.bottom( pElement ) ).substr(0, 5) +
			"&relativeLeft=" + 
			new String( getRelativeEdgePosition.left( pElement ) ).substr(0, 5) +
			"&relativeRight=" +
			new String( getRelativeEdgePosition.right( pElement ) ).substr(0, 5) +
			"&viewportTop=" + new String(relPos.top).substr( 0, 5 ) +
			"&viewportBottom=" + new String(relPos.bottom).substr( 0, 5 ) +
			"&viewportLeft=" + new String(relPos.left).substr( 0, 5 ) +
			"&viewportRight=" + new String(relPos.right).substr( 0, 5 ) +
			(logContents_UsaProxy && !pDisappear ? "&contents=" + getContents_UsaProxy(pElement) : "") +
			generateEventString_UsaProxy( pElement ) );
	};
	
	var scrollPos = function( win ) {
		var win = win || window;
		win = jQuery_UsaProxy( win );
		return { 
			top: win.scrollTop(), 
			left: win.scrollLeft(),
			bottom: win.scrollTop() + win.height(),
			right: win.scrollLeft() + win.width()
		} 
	};
	
	var relativeScrollPos = function( win, doc ) {
		var win = win || window;
		var doc = doc || document;
		var pos = scrollPos( win );
		var docHeight = jQuery_UsaProxy( doc ).height();
		var docWidth = jQuery_UsaProxy( doc ).width(); 
		return {
			top: pos.top / docHeight * 100,
			bottom: pos.bottom / docHeight * 100,
			left: pos.left / docWidth * 100,
			right: pos.right / docWidth * 100
		} 
	};
	
	var logScroll = function( pEventName, pSkipPositions )
	{
		var pEventName = pEventName ? pEventName : 'viewportChange';
		var pSkipPositions = pSkipPositions ? pSkipPositions : false;
		relPos = relativeScrollPos();
		
		writeLog_UsaProxy( pEventName + (!pSkipPositions ? ("&top=" + new String(relPos.top).substr( 0, 5 ) +
			"&bottom=" + new String(relPos.bottom).substr( 0, 5 ) +
			"&left=" + new String(relPos.left).substr( 0, 5 ) +
			"&right=" + new String(relPos.right).substr( 0, 5 ) +
			"&documentHeight=" + jQuery_UsaProxy( document ).height() + 
			"&documentWidth=" + jQuery_UsaProxy( document ).width() +
			"&viewportHeight=" + jQuery_UsaProxy( window ).height() +
			"&viewportWidth=" + jQuery_UsaProxy( window ).width()) : "") );
	};
	
	var logScrollStart = function()
	{
		logScroll( 'scrollStart', true );
	};
	
	logScroll(); // log initial scroll position
	
	var elementsPreviouslyInViewport = jQuery_UsaProxy( trackedElements ).filter( ':in-viewport' );
	elementsPreviouslyInViewport.each( function()
	{
		logElement( this, false, 'initial' );
	} );
	
	var previousScrollPos = scrollPos();
	
	// Function for searching for visible elements and logging them.
	// Returns a boolean value that indicates whether any element was out
	// of place.
	var findVisibleElements = function( 
		pSearchFrom, /* <int> Start searching from this pixel offset */
		pSearchTo, /* <int> Stop search at this pixel offset */
		pWaypointEdges, /* <Array> The waypoint edge array to search from (eg. waypoints.top) */
		pGetEdge, /* <Function> A function that takes a DOM element and returns the value that (should) represent the index of the waypoint edge array */
		pFoundElements, /* <out: Array> An array into which the found elements will be pushed */
		pEdgeName /* <String> The name of the edge where the elements are appearing from. Will appear in log as-is. */
		)
	{
		resetWaypoints = false;
		for ( i = pSearchFrom; i < pSearchTo; ++i )
		{
			if ( pWaypointEdges[ i ] )
			{
				for ( j = 0; j < pWaypointEdges[i].length; ++j )
				{
					var element = pWaypointEdges[i][j];
					
					// We only log the element if it is in viewport.
					if ( jQuery_UsaProxy( element ).is( ':in-viewport' ) )
					{
						logElement( element, false, pEdgeName );
						pFoundElements.push( element );
					}
						
					// Extra check: has the element's position changed?
					// The array containing the tracked elements must be
					// reset if there are invalid entries.
					if ( pGetEdge( element ) !== i ) resetWaypoints = true;
				}
			}
		}
		return resetWaypoints;
	};
	
	var checkVisibility = function( noScroll /* Force checking every element instead of just the scroll zone */ )
	{
		// These elements have disappeared from the screen
		var disappearingElements = jQuery_UsaProxy( elementsPreviouslyInViewport )
			.filter( ':not( :in-viewport )' );
		
		var currentScrollPos = scrollPos();
		
		var newlyVisibleElements = [];
		var resetWaypoints = false;
		
		if ( noScroll )
		{
			// The page was not scrolled. Force 'in-viewport' check.
			newlyVisibleElements = trackedElements.filter( ':in-viewport' ).get();
			
			// The elements that were previously in viewport, and still are.
			var elementsStillInViewport =
				elementsPreviouslyInViewport.filter( newlyVisibleElements );
			
			if ( elementsStillInViewport.length === newlyVisibleElements.length )
			{
				// If the list of newly visible elements is exactly the same as the list
				// of previous elements, the view hasn't changed at all. Therefore we
				// exit here.
				return;
			}
			
			// The view has changed if we passed this point.
			
			++screenID_UsaProxy;
			
			logScroll();
			
			// Log element disappearances
			disappearingElements.each( function()
			{
				logElement( this, true, 'unknown' );
			} );
			
			// Log element appearances
			jQuery_UsaProxy( newlyVisibleElements ).not( elementsPreviouslyInViewport ).each( function()
			{
				logElement( this, false, 'unknown' );
			} );
			
			elementsPreviouslyInViewport = jQuery_UsaProxy( newlyVisibleElements );
		}
		else
		{
			// The page was scrolled.
			
			++screenID_UsaProxy; // every screen has a unique id
			
			logScroll();
			
			disappearingElements.each( function()
			{
				logElement( this, true, 'unknown' );
			} );
			
			// Elements whose tops are in the bottom 'scroll zone' are appearing
			// on the screen.
			if ( findVisibleElements( previousScrollPos.bottom, currentScrollPos.bottom, 
				waypoints.top, getEdgePosition.top, newlyVisibleElements, 'bottom' ) ) resetWaypoints = true;
			
			// Elements whose bottoms are in the top 'scroll zone' are appearing
			// on the screen.
			if ( findVisibleElements( currentScrollPos.top, previousScrollPos.top,
					waypoints.bottom, getEdgePosition.bottom, newlyVisibleElements, 'top' ) ) resetWaypoints = true;
					
			// Elements whose right sides are in the left side 'scroll zone' are appearing
			// on the screen.
			if ( findVisibleElements( currentScrollPos.left, previousScrollPos.left,
					waypoints.right, getEdgePosition.right, newlyVisibleElements, 'left' ) ) resetWaypoints = true;
					
			// Elements whose left sides are in the right side 'scroll zone' are appearing
			// on the screen.
			if ( findVisibleElements( currentScrollPos.right, previousScrollPos.right,
					waypoints.left, getEdgePosition.left, newlyVisibleElements, 'right' ) ) resetWaypoints = true;
			
			elementsPreviouslyInViewport = jQuery_UsaProxy( newlyVisibleElements ).add( elementsPreviouslyInViewport.not( disappearingElements ) ) ;
			previousScrollPos = currentScrollPos;
		}
		
		if ( resetWaypoints ) resetAllWaypoints();
	};
	
	// Check element visibility when the page is scrolled. On resize we must
	// also account for the document's change of shape.
	jQuery_UsaProxy( window )
		.on( 'scrollstart', logScrollStart )
		.on( 'scrollstop', function()
		{
			checkVisibility( false );
		} )
		.on( 'resizestop', function()
		{
			resetAllWaypoints();
			checkVisibility( false );
		} );
		
	// An object for handling dynamic page change checking.
	var checkDynamic = 
	{
		dispatcher: (function()
			{
				if ( window.UsaProxy.dynamicDetection === 'TIMER' ||
						( window.UsaProxy.dynamicDetection === 'AUTO' &&
								!jQuery_UsaProxy( document ).mutation( 'supported' ) ) )
				{
					// Timer-based dispatcher
					return {
						
						checkDynamicTimer: null, // handle to the timeout object
						
						// Check visibility every second in case the page is a non-scrolling
						// one with dynamic content.
						setup: function( that )
						{
							that.reset();
							this.checkDynamicTimer = window.setTimeout( function()
							{
								that.checkForChanges();
								that.setup();
							}, 1000 );
						},
					
						// Timer reset
						reset: function()
						{
							window.clearTimeout( this.checkDynamicTimer ); // cancel any previous timer
						} 
					};
				}
				
				if ( window.UsaProxy.dynamicDetection === 'MUTATION_EVENT' || 
						( window.UsaProxy.dynamicDetection === 'AUTO' &&
								jQuery_UsaProxy( document ).mutation( 'supported' ) ) )
				{
					// Mutation event based dispatcher
					return {
						setup: function( that )
						{
							jQuery_UsaProxy( document ).mutation( 'stop', function()
							{
								that.checkForChanges();
							} );
						},
					
						reset: function()
						{
							jQuery_UsaProxy( document ).mutation( 'off' );
						} 
					};
				}
				
				// No-op dispatcher
				return {
					setup: function(){},
					reset: function(){}
				};
			})(),

		reset: function()
		{
			this.dispatcher.reset();
		},
		
		setup: function()
		{
			this.dispatcher.setup( this );
		},
		
		// triggers a full waypoint reset.
		checkForChanges: function()
		{
			// Reset the list and re-calculate waypoints.
			trackedElements = getTrackedElements();
			resetAllWaypoints();
			checkVisibility( true );
		}
	};
	
	checkDynamic.setup();
	
}

/*
 * Turns a javascript object into a URL query part by handling the object as
 * a collection of key-value pairs. Values with no string representation will
 * be ignored.
 */
var objectToQuery = function( pObj )
{
	var queryString = '';
	var ampersand = '';
	for ( var key in pObj )
	{
		var value = pObj[ key ];
		if ( typeof value !== 'number' && typeof value !== 'string' && typeof value !== 'boolean' ) continue;
		var pair = ampersand + key + '=' + value;
		queryString += pair;
		ampersand = '&';
	}
	return queryString;
};

var init_plugins = function() {
		if ( typeof UsaProxy.plugins !== 'object' ) return;
		for ( var i in UsaProxy.plugins )
		{
			var plugin = UsaProxy.plugins[ i ];
			
			// Check the validity of the plugin
			if ( typeof plugin !== 'object' ) continue;
			if ( !jQuery_UsaProxy.isArray( plugin.events ) ) continue;
	
			// Run the plugin's setup function if there is one
			if ( typeof plugin.setup === 'function' ) plugin.setup();
			
			// Bind event handlers for the plugin's events
			for ( var j in plugin.events )
			{
				var event = plugin.events[ j ];

				// Check the validity of the event descriptor
				if ( typeof event.bindTo !== 'function' ) continue;
				if ( typeof event.events !== 'function' ) continue;
				if ( typeof event.onTrigger !== 'function' ) continue;

				// Closure to bind the event object
				(function( event ) {
					var bindFunc = function( bindTo ) {
						bindTo = jQuery_UsaProxy.isArray( bindTo ) ? bindTo : event.bindTo();
						var events = event.events();
						if ( !jQuery_UsaProxy.isArray( bindTo ) ) return;
						if ( !jQuery_UsaProxy.isArray( events ) ) return;
						
						jQuery_UsaProxy( bindTo ).on( events.join( ' ' ), function( e ) {
							var eventAttributes = event.onTrigger( e );
							writeLog_UsaProxy( 'plugin&eventType=' + e.type + '&' + objectToQuery( eventAttributes ) );
						} );
					};
					
					if ( typeof event.deferBind === 'function' )
					{
						event.deferBind( bindFunc );
					}
					else
					{
						bindFunc();
					}
					
				} )( event );
			}
		}
};

/* Invoke init_UsaProxy on load. */
jQuery_UsaProxy( window ).load( function() {
	init_UsaProxy();
	init_plugins();
} );

// Returns a Date object computed from a given datestamp string
function date_UsaProxy(datestamp /*string*/) {
	var datestampTail 	= datestamp;
	var year 			= Number(datestampTail.substring(0,datestampTail.indexOf("-")));
	datestampTail 		= datestampTail.substring(datestampTail.indexOf("-")+1);
	var month 			= Number(datestampTail.substring(0,datestampTail.indexOf("-"))) - 1;
	datestampTail 		= datestampTail.substring(datestampTail.indexOf("-")+1);
	var day 			= Number(datestampTail.substring(0,datestampTail.indexOf(",")));
	datestampTail 		= datestampTail.substring(datestampTail.indexOf(",")+1);
	var hours 			= Number(datestampTail.substring(0,datestampTail.indexOf(":")));
	datestampTail 		= datestampTail.substring(datestampTail.indexOf(":")+1);
	var mins 			= Number(datestampTail.substring(0,datestampTail.indexOf(":")));
	datestampTail 		= datestampTail.substring(datestampTail.indexOf(":")+1);
	var secs 			= Number(datestampTail.substring(0, datestampTail.indexOf(".")));
	datestampTail 		= datestampTail.substring(datestampTail.indexOf(".")+1);
	var millis			= Number(datestampTail);
	return			    new Date(year,month,day,hours,mins,secs,millis);
}

/* Returns a timestamp string of the form "2004-12-31,23:59:59.999".
 * Takes UsaProxy's httptraffic log entry time as start time and adds
 * the difference between load time and current time */
function datestamp_UsaProxy() {
	if (loadDate_UsaProxy==null) loadDate_UsaProxy = new Date();
	var currentDate 	= new Date();
	// get milliseconds from load time
	var diffSecs 		= Math.abs(currentDate.getTime() - loadDate_UsaProxy.getTime());
	// return new Date object according to UsaProxy start time + diffMSecs
	var currentUPDate 	= new Date(startDate_UsaProxy.getTime() + diffSecs);

	return currentUPDate.getFullYear() + "-" + completeDateVals(currentUPDate.getMonth() + 1) + "-"
	  + completeDateVals(currentUPDate.getDate()) + "," + completeDateVals(currentUPDate.getHours())
	  + ":" + completeDateVals(currentUPDate.getMinutes())
	  + ":" + completeDateVals(currentUPDate.getSeconds())
	  + '.' + padWithZeroes( currentUPDate.getMilliseconds(), 3 );
}

function padWithZeroes( string, howmany ) {
	var strArg = new String( string );
	var zeroString = new String();
	for ( var i = 0; i < howmany - strArg.length; ++i ) zeroString = zeroString.concat( '0' );
	return new String( '' + zeroString + strArg );
}

/** Completes single-digit numbers by a "0"-prefix */
function completeDateVals(dateVal) {
	var dateVal = "" + dateVal;
	if (dateVal.length<2) return "0" + dateVal;
	else return dateVal;
}
  
/* Appends an event log entry together with the httptrafficindex referencing this page,
   the client's session ID,
 * and the current timestamp to logVal_UsaProxy */
function writeLog_UsaProxy(text) {
	// if function is already being executed, defer writeLog_UsaProxy for 50ms
	if(FLG_writingLogVal_UsaProxy) { window.setTimeout( function() { writeLog_UsaProxy( text ); },50); return false;}
	
	// generate and append log entry
	var logline;
	logLine = datestamp_UsaProxy() + "&sd=" + serverdataId_UsaProxy + "&sid="
	+ sessionID_UsaProxy + "&event=" + text + "&screenID=" + screenID_UsaProxy;
	
	// set synchronization flag (block function)
	FLG_writingLogVal_UsaProxy = true;
	logVal_UsaProxy = logVal_UsaProxy + logLine + "&xX"; // Add logLine to interaction log
	// reset synchronization flag (release function)
	FLG_writingLogVal_UsaProxy = false;
	
	// Check whether the timer has been working as it should. Reset if not.
	if ( lastSavelogExecute === null || (
			(new Date()).getTime() - lastSavelogExecute.getTime() > 5 * TIMERINTERVAL ) )
	{
		window.clearTimeout( IVL_saveLog_UsaProxy );
		IVL_saveLog_UsaProxy = window.setTimeout( function(){ saveLog_UsaProxy(); },TIMERINTERVAL );
	}
}

function getContents_UsaProxy( node )
{
	var amount = contentsLimit_UsaProxy;
	if ( amount === -1 ) return escape( jQuery_UsaProxy( node ).text() );
	if ( amount > 0 ) return escape( jQuery_UsaProxy( node ).text().substr(0, amount) );
	return '';
}

/* Returns all available node information such as the DOM path, an image name, href, etc. */
function generateEventString_UsaProxy(node /*DOM element*/) {
	var eventString = "";
	eventString = eventString + "&dom=" + getDOMPath(node);  // append DOM path
	
	// if target has a href property
	if (node.href) {
		/* image detection IE: IE doesn't register any src property
		 * instead href contains the file path */
		if(node.nodeName=="img" || node.nodeName=="IMG") {	
			// if linked image (parent node is an <a>-element)
			if(node.parentNode && node.parentNode.href)  
				eventString = eventString + "&img=" + escape(getImageUrl_UsaProxy(node)) + "&link=" + escape(node.parentNode.href);
			else eventString = eventString + "&img=" + escape(getImageUrl_UsaProxy(node));
		}
		// NS+IE: link detection
		else if(node.nodeName=="a" || node.nodeName=="A") {  // if anchor tag
			// IE: innertext property contains link text
			if (node.innerText)
				eventString = eventString + "&link=" + escape(node.href) + "&text=" + escape(node.innerText);
			// NS: text property contains link text
			else eventString = eventString + "&link=" + escape(node.href) + "&text=" + escape(node.text);
		}
	} else {
		// image detection NS
		if (node.src) {		
			if (node.parentNode && node.parentNode.href)
				eventString = eventString + "&img=" + escape(getImageUrl_UsaProxy(node)) + "&link=" + escape(node.parentNode.href);
			else eventString = eventString + "&img=" + escape(getImageUrl_UsaProxy(node));
		}
	}
	
	return eventString;
}

/**
 * Attempts to find out the original image URL for an image node.
 */
function getImageUrl_UsaProxy( pImageNode )
{
	var actualSrc = jQuery_UsaProxy( pImageNode ).attr( "src" );
	if ( actualSrc.charAt( 0 ) === '/' )
	{
		// Relative URL, keep host part
		return window.UsaProxy.originURL.protocol + '://' + window.UsaProxy.originURL.host + 
			( window.UsaProxy.originURL.port === '' ? '' : ':' + window.UsaProxy.originURL.port ) + 
			actualSrc;
	}
	else if ( /[A-z]+:\/\/.*/.test( actualSrc ) )
	{
		// Absolute URL, return as is
		return actualSrc;
	}
	else
	{
		// File name or path, keep host and path
		return window.UsaProxy.originURL.protocol + '://' + window.UsaProxy.originURL.host +
			( window.UsaProxy.originURL.port === '' ? '' : ':' + window.UsaProxy.originURL.port ) + 
			window.UsaProxy.originURL.path.substr( 0, window.UsaProxy.originURL.path.lastIndexOf("/") + 1 ) + 
			actualSrc;
	}
}

/* Returns file name of a URL/path */
function getFileName(path /*string*/) {
	if(path.lastIndexOf("/")>-1)
		return path.substring(path.lastIndexOf("/")+1);
	else return path;
}

/***** AJAX code.
	   Used with each logging request  */

var xmlreqs_UsaProxy = new Array();	/** contains the currently used XMLHttpRequest objects */

/* Creates a new XMLHttpRequest object with a freed parameter 
   which indicates whether the object is currently operating 
   (e.g. expecting a UsaProxy response) */
function OBJ_XHR_UsaProxy(freed /*number*/){
	this.freed = freed;
	this.newReq = false;
	// NS
	if(window.XMLHttpRequest) {
	  	try { this.newReq = new XMLHttpRequest(); }
	  	catch(e) { this.newReq = false; }
	}
	// IE
	else if(window.ActiveXObject) {
	  try { this.newReq = new ActiveXObject("Microsoft.XMLHTTP"); }
	  catch(e) {
		try { this.newReq = new ActiveXObject("Msxml2.XMLHTTP"); }
		catch(e) {
		  this.newReq = false;
		}
	  }
	}
}

/** Sends an asynchronous HTTP request to UsaProxy.
	Examines each existent XMLHttpRequest object in xmlreqs_UsaProxy array,
	whether it is ready to handle this request. If not, a new OBJ_XHR_UsaProxy
	object is created with a freed value of 1 and added to the array.
	Then, the request is sent, freed is set to 0: occupied, and the readystatechange listener
	assigned the specified handler function. */
function xmlreqGET_UsaProxy(url /*string*/, callback_function /*string*/) {
	var pos = -1;
	for (var i=0; i< xmlreqs_UsaProxy.length; i++) {
		if (xmlreqs_UsaProxy[i].freed == 1) { pos = i; break; }
	}
	if (pos == -1) { pos = xmlreqs_UsaProxy.length; xmlreqs_UsaProxy[pos] = new OBJ_XHR_UsaProxy(1); }
	if (xmlreqs_UsaProxy[pos].newReq) {
		xmlreqs_UsaProxy[pos].freed = 0;
		xmlreqs_UsaProxy[pos].newReq.open("GET",url,true);
		xmlreqs_UsaProxy[pos].newReq.onreadystatechange = function() {
			if (window.xmlhttpChange_UsaProxy) { xmlhttpChange_UsaProxy(pos, callback_function); }
		}
		if (window.XMLHttpRequest) {
			xmlreqs_UsaProxy[pos].newReq.send(null);
		} else if (window.ActiveXObject) {
			xmlreqs_UsaProxy[pos].newReq.send();
		}
	}
}

/** Executes the specified handler function and 
    assigns it the received XML response provided by the used XMLHttpRequest object
	(stored in the array at position pos) */
function xmlhttpChange_UsaProxy(pos /*number*/, callback_function /*string*/) {
	if (typeof(xmlreqs_UsaProxy[pos]) != 'undefined' && xmlreqs_UsaProxy[pos].freed == 0 && xmlreqs_UsaProxy[pos].newReq.readyState == 4) {
		// try catch due to status exceptions in Firefox
		try {
			if (xmlreqs_UsaProxy[pos].newReq.status == 200 || xmlreqs_UsaProxy[pos].newReq.status == 304) {
				eval(callback_function + '(xmlreqs_UsaProxy[' + pos + '].newReq.responseXML)'); 
			} else {
				//handle_error();
			}
			xmlreqs_UsaProxy[pos].freed = 1;
		}
		catch( e ) {
		//	alert('Caught Exception: ' + e.description);
		}
	}
}

/** end of AJAX code */

/** Sends tracked usage data (if available) to UsaProxy */
function saveLog_UsaProxy() {

	lastSavelogExecute = new Date();
	
	if(logVal_UsaProxy!="") {
		xmlreqGET_UsaProxy("/usaproxylolo/log?" + logVal_UsaProxy, "");
		logVal_UsaProxy = ""; // reset log data
	}
	IVL_saveLog_UsaProxy = window.setTimeout( function(){ saveLog_UsaProxy(); },TIMERINTERVAL);
}

/** Event logging functionality */

/* Processes load event (logs load event together with the page size) */
function processLoad_UsaProxy(e) {
	/* get size
	 * NS: first case (window.innerWidth/innerHeight available); IE: second case */
	var loadWidth, loadHeight;
	loadWidth 	= (window.innerWidth) ? window.innerWidth : document.body.offsetWidth;  // innerWidth=NS
	loadHeight 	= (window.innerHeight) ? window.innerHeight : document.body.offsetHeight;  // innerHeight=NS
	writeLog_UsaProxy("load&size=" + loadWidth + "x" + loadHeight);
}

/* Processes window resize event (logs resize event together with the page size) */
function processResize_UsaProxy(e) {
	/* get size
	 * NS: first case (window.innerWidth/innerHeight available); IE: second case */
	var newWidth, newHeight;
	newWidth 	= (window.innerWidth) ? window.innerWidth : document.body.offsetWidth;  // innerWidth=NS
	newHeight 	= (window.innerHeight) ? window.innerHeight : document.body.offsetHeight;  // innerHeight=NS
	writeLog_UsaProxy("resize&size=" + newWidth + "x" + newHeight);
}

/* Processes mousemove event if FLG_LogMousemove_UsaProxy isn't set 
   (FLG_LogMousemove_UsaProxy defers the next mousemove logging action
   for 150 ms) */
function processMousemove_UsaProxy(e) {
	
	/* get event target, x, and y value of mouse position
	 * NS: first case (window.Event available); IE: second case */
	var ev 		= (window.Event) ? e : window.event;
	var target 	= (window.Event) ? ev.target : ev.srcElement;
	var x 		= (window.Event) ? ev.pageX : ev.clientX;
	var y 		= (window.Event) ? ev.pageY : ev.clientY; 
	
	var xOffset = x - absLeft(target);	// compute x offset relative to the hovered-over element
	var yOffset = y - absTop(target);	// compute y offset relative to the hovered-over element
	
	// if log mousemove flag is false, set it true and log a mousemove event
	if (!FLG_LogMousemove_UsaProxy
		/** if mouse pointer actually moved */
		&& !(x==lastMousePosX_UsaProxy && y==lastMousePosY_UsaProxy) ) {
			FLG_LogMousemove_UsaProxy = true;
			lastMousePosX_UsaProxy = x;
			lastMousePosY_UsaProxy = y;
			
			writeLog_UsaProxy("mousemove&offset=" + xOffset + "," + yOffset + generateEventString_UsaProxy(target));
			window.setTimeout( function() { setInaktiv_UsaProxy(); },150);
	}
}

/* Resets the log mousemove blocking flag so that the next 
   mousemove event may be logged */
function setInaktiv_UsaProxy() {
	FLG_LogMousemove_UsaProxy = false;
}

/* Processes mouseover event.
 * logs mouseover events on all elements which have either an
 * id, name, href, or src property (logging more would cause a log overload).
   In addition it applies the appropriate direct event listeners to form elements */  
function processMouseover_UsaProxy(e) {
	
	/* get event target
	 * NS: first case (window.Event available); IE: second case */
	var ev = (window.Event) ? e : window.event;
	var target = (window.Event) ? ev.target : ev.srcElement;
	
	/* add appliable event listeners to hovered element */
	/* first, check if element has a type property.
	 * Secondly, check its type and apply listeners */
	 if(target.type) {
		if (target.type=="select-one" 
		 || target.type=="select-multiple"
		 || target.type=="text" 
		 || target.type=="textarea" 
		 || target.type=="file" 
		 || target.type=="checkbox" 
		 || target.type=="password"
		 || target.type=="radio") {
		 	// IE
		 	if(target.attachEvent) { 
				/* first, remove existent event listener
				 * detachEvent doesn�t give any errors if the listener 
				 * to be removed has not been added to target */
				// change listener
				target.detachEvent('onchange', processChange_UsaProxy);
				target.attachEvent('onchange', processChange_UsaProxy);
				if (target.type=="text" 
		 		 || target.type=="textarea" 
		 		 || target.type=="file" 
		 		 || target.type=="password" 
		 		 || target.type=="select-multiple") {
				 	// focus listener
				 	target.detachEvent('onfocus', processFocus_UsaProxy);
				 	target.attachEvent('onfocus', processFocus_UsaProxy);
					// blur listener
					target.detachEvent('onblur', processBlur_UsaProxy);
					target.attachEvent('onblur', processBlur_UsaProxy);
				 }
			}
			// NS
			else if (target.addEventListener) {
				/* first, remove existent event listener (equal to detachEvent) */
				// change listener
				target.removeEventListener('change', processChange_UsaProxy, false);
				target.addEventListener('change', processChange_UsaProxy, false);
				if (target.type=="text" 
		 		 || target.type=="textarea" 
		 		 || target.type=="file" 
		 		 || target.type=="password" 
		 		 || target.type=="select-multiple") {
				 	// focus listener
					target.removeEventListener('focus', processFocus_UsaProxy, false);
				 	target.addEventListener('focus', processFocus_UsaProxy, false);
					// blur listener
					target.removeEventListener('blur', processBlur_UsaProxy, false);
					target.addEventListener('blur', processBlur_UsaProxy, false);
				 }
				 if (target.type=="text" 
		 		  || target.type=="textarea" ) {
				 	// select listener: only for NS
					target.removeEventListener('select', processSelectionNS_UsaProxy, false);
				 	target.addEventListener('select', processSelectionNS_UsaProxy, false);
				 }
			}
		}
	}
	
	// log mouseover coordinates and all available target attributes
	// if element has an id attribute
	if (target.id) 	writeLog_UsaProxy("mouseover&id=" + target.id + generateEventString_UsaProxy(target));
	else {
		// if element has a name attribute
		if(target.name) writeLog_UsaProxy("mouseover&name=" + target.name + generateEventString_UsaProxy(target));
		else {
			// if element has an href or src attribute
			if (target.href || target.src)
				writeLog_UsaProxy("mouseover" + generateEventString_UsaProxy(target));
		}
	}
}

/* no mouseout event since with regular user tracking not necessary */

/* Processes mouse release event.
   Logs mousedown event together with the mouse button type (if middle or
   right button), and the available event target properties.
   Since click might have occured also outside of form fields, images, or, hyperlinks,
   the mouse pointer position is recorded relative to the hovered-over area/element. */
function processMousedown_UsaProxy(e) {

	/* check if text was selected, if true, discontinue, 
	   since this is handled by processSelection_UsaProxy */
	if(processSelection_UsaProxy()) return;
	
	/* get event target, x, and y value of mouse position
	 * NS: first case (window.Event available); IE: second case */
	var ev 		= (window.Event) ? e : window.event;
	var target 	= (window.Event) ? ev.target : ev.srcElement;
	var x 		= (window.Event) ? ev.pageX : ev.clientX;
	var y 		= (window.Event) ? ev.pageY : ev.clientY; 
	
	var xOffset = x - absLeft(target);	// compute x offset relative to the hovered-over element
	var yOffset = y - absTop(target);	// compute y offset relative to the hovered-over element
	
	/** mouse button detection: was middle or right mouse button clicked ?*/
	var mbutton = "left";
	if (ev.which) {  		// NS
		switch(ev.which) {
			case 2: mbutton = "m"; break;	// middle button
			case 3: mbutton = "r"; break;	// right button
		}
	} else if (ev.button) {		// IE
		switch(ev.button) {
			case 4: mbutton = "m"; break;
			case 2: mbutton = "r"; break;
		}
	}
	// log middle and right button events, continue if left button was clicked
	if (mbutton!="left") {
		writeLog_UsaProxy("mousedown&but=" + mbutton + generateEventString_UsaProxy(target));
		return;
	}
	/* end mouse button detection */
	
	// dropdown selection event is handled by function processChange_UsaProxy
	if(target.nodeName=="OPTION" || target.nodeName=="option") return; // do nothing
	if(target.nodeName=="SELECT" || target.nodeName=="select") return; // do nothing
	
	// radio button selection event is handled by function processChange_UsaProxy
	if(target.type && (target.type == "radio")) {
		return;
	}
	
	/* if regular click, log click coordinates relative to the clicked element
	   and all available target properties */
	// if element has an id attribute
	if (target.id) 	writeLog_UsaProxy("mousedown&offset=" + xOffset + "," + yOffset + "&id=" + target.id + generateEventString_UsaProxy(target) );
	else {
		// if element has a name attribute
		if(target.name) writeLog_UsaProxy("mousedown&offset=" + xOffset + "," + yOffset + "&name=" + target.name + generateEventString_UsaProxy(target));
		else {
			writeLog_UsaProxy("mousedown&offset=" + xOffset + "," + yOffset + generateEventString_UsaProxy(target));
		}
	}
}

/* no mouseup event since with regular user tracking not necessary */

/* Processes change event in select lists, input fields, textareas.
   Logs change event together with the corresponding field type, and
   a couple of field content properties such as the new field value. */
function processChange_UsaProxy(e) {
	
	/* get event target
	 * NS: first case (window.Event available); IE: second case */
	var ev 		= (window.Event) ? e : window.event;
	var target 	= (window.Event) ? ev.target : ev.srcElement;
	
	// if select list, log the selected entry's value
	if (target.type=="select-multiple") {
		var value = "";
		// check which entries were selected
		for (var i = 0; i < target.options.length; i++)
			if (target.options[ i ].selected) value = value + target.options[ i ].value;
		// log entries
		if (target.id) {
			writeLog_UsaProxy("change&type=select-multiple&id=" + target.id
						+ generateEventString_UsaProxy(target) + "&value=" + escape(value));
		} else { if (target.name)
					writeLog_UsaProxy("change&type=select-multiple&name=" + target.name
						+ generateEventString_UsaProxy(target) + "&value=" + escape(value)) ;
		}
	}
	
	// if dropdown menu, log the selected entry's value
	else if (target.type=="select-one") { 
		if (target.id) {
			writeLog_UsaProxy("change&type=select-one&id=" + target.id + generateEventString_UsaProxy(target) + "&value="
					+ escape(target.options[target.selectedIndex].value) + "&selected=" + target.selectedIndex);
		} else { if (target.name)
					writeLog_UsaProxy("change&type=select-one&name=" + target.name
							+ generateEventString_UsaProxy(target) + "&value=" 
							+ escape(target.options[target.selectedIndex].value)
							+ "&selected=" + target.selectedIndex);
		}
	}
	
	// if text field/area, file field, log changed value
	else if (target.type=="text" || target.type=="textarea" || target.type=="file") {
		if (target.id) {
			writeLog_UsaProxy("change&type=" + target.type + "&id=" + target.id
							  + generateEventString_UsaProxy(target) + "&value=" + escape(target.value));
		} else { if (target.name)
					writeLog_UsaProxy("change&type=" + target.type + "&name="
							+ target.name + generateEventString_UsaProxy(target) + "&value=" + escape(target.value));
		}
	}
	
	// log that checkbox was checked/unchecked
	else if (target.type=="checkbox") {
		var value = "";
		// check boxes in checkbox group
		if(target.length>1) { 
			for ( i=0 ; i < target.length ; i++ ){ 
				if (target[i].checked==true)  
					value = value + "." + target[i].value;
			}
			if (value=="") value = "none";
		// single checkbox
		} else {value==target.checked}
		// log entries
		if (target.id) {
			writeLog_UsaProxy("change&type=" + target.type + "&id=" + target.id
							  + "&checked=" + target.checked + generateEventString_UsaProxy(target));
		} else { if (target.name)
					writeLog_UsaProxy("change&type=" + target.type + "&name="
							+ target.name + "&checked=" + target.checked + generateEventString_UsaProxy(target));
		}
	}
	
	// in the case of a password field, log only THAT content was modified
	else if (target.type=="password") {
		if (target.id) {
			writeLog_UsaProxy("change&type=" + target.type + "&id="
							  + target.id + generateEventString_UsaProxy(target));
		} else { if (target.name)
					writeLog_UsaProxy("change&type=" + target.type + "&name="
									  + target.name + generateEventString_UsaProxy(target));
		}
	}
	
	// log that radio button was clicked
	else if (target.type=="radio") {
		// log entries
		if (target.id) {
			writeLog_UsaProxy("change&type=" + target.type + "&id=" + target.id
							  + generateEventString_UsaProxy(target));
		} else { if (target.name)
					writeLog_UsaProxy("change&type=" + target.type + "&name="
							+ target.name + generateEventString_UsaProxy(target));
		}
	}
	
}

/* Processes scrolling of the page.
 * Function is invoked periodically since no explicit scroll event is triggered.
   The page offset is logged in the form of a percentage value relative
   to the total HTML document height/width */
function processScroll_UsaProxy() {
	
	/** since total HTML height/width may be modified through font size settings
	    it must be computed each time a scrolling is performed */
		
	var scrollHeight_UsaProxy;
	var scrollWidth_UsaProxy;
	
	if (document.documentElement && document.documentElement.scrollHeight)
		// Explorer 6 Strict
	{
		scrollHeight_UsaProxy = document.documentElement.scrollHeight;
		scrollWidth_UsaProxy = document.documentElement.scrollWidth;
	}
	else if (document.body) // all other Explorers
	{
		scrollHeight_UsaProxy 	= document.documentElement.scrollHeight;
		scrollWidth_UsaProxy 	= document.documentElement.scrollWidth;
	}

	/* get current offset */
	 
	if (self.pageYOffset) // all except Explorer
	{
		currentScrollPosX = self.pageXOffset;
		currentScrollPosY = self.pageYOffset;
	}
	else if (document.documentElement && document.documentElement.scrollTop)
		// Explorer 6 Strict
	{
		currentScrollPosX = document.documentElement.scrollLeft;
		currentScrollPosY = document.documentElement.scrollTop;
	}
	else if (document.body) // all other Explorers
	{
		currentScrollPosX = document.body.scrollLeft;
		currentScrollPosY = document.body.scrollTop;
	}

	// if vertical scrollbar was moved new scrollbar position is logged
	if(lastScrollPosY_UsaProxy != currentScrollPosY) {
	
		/** e.g. 100, 80, 6, 0 */
		var percentOfHeight = "" + Math.round(currentScrollPosY/scrollHeight_UsaProxy * 100);
		/** shift */
		if(percentOfHeight.length==0) percentOfHeight = "000";
		if(percentOfHeight.length==1) percentOfHeight = "00" + percentOfHeight;
		if(percentOfHeight.length==2) percentOfHeight = "0" + percentOfHeight;
		percentOfHeight = percentOfHeight.substring(0,1) + "." + percentOfHeight.substring(1);
	
		writeLog_UsaProxy("scroll&y=" + percentOfHeight);
		// set last scrollbar position
		lastScrollPosY_UsaProxy = currentScrollPosY;
	}
	// if horizontal scrollbar was moved new scrollbar position is logged
	if(lastScrollPosX_UsaProxy != currentScrollPosX) {
	
		var percentOfWidth = "" + Math.round(currentScrollPosX/scrollWidth_UsaProxy * 100);
		/** shift */
		if(percentOfWidth.length==0) percentOfWidth = "000";
		if(percentOfWidth.length==1) percentOfWidth = "00" + percentOfWidth;
		if(percentOfWidth.length==2) percentOfWidth = "0" + percentOfWidth;
		percentOfWidth = percentOfWidth.substring(0,1) + "." + percentOfWidth.substring(1);
	
		writeLog_UsaProxy("scroll&x=" + percentOfWidth);
		// set last scrollbar position
		lastScrollPosX_UsaProxy = currentScrollPosX;
	}
}


/* Detects key combinations: first part - key down
 * flags are set in the case that shift, ctrl, or alt is pressed
 * in case any og those flags is true, a combination is detected and logged.  */
function processKeydown_UsaProxy(e) {

	/* get keycode
	 * IE: first case (window.event available); NS: second case */
	var evtobj 				= window.event ? window.event : e;
	var KeyID 				= evtobj.which ? evtobj.which : evtobj.keyCode;
	FLG_ctrl_comb_UsaProxy 	= false;	// "ctrl key pressed" combinations flag

	switch(KeyID)
	{
		// if shift is pressed
		case 16:		
			FLG_comb_UsaProxy = false;			// reset combination flag
			combMembers_UsaProxy = 0;			// reset combination members
			FLG_shiftPressed_UsaProxy = true;	// set "shift key pressed" flag
			FLG_keyPress_UsaProxy = false;		// keypress-event blocked (keypress event is blocked)
			return false;
		break;
		// if ctrl is pressed
		case 17:		
			FLG_comb_UsaProxy = false;			// reset combination flag
			combMembers_UsaProxy = 0;			// reset combination members
			FLG_ctrlPressed_UsaProxy = true;	// set "ctrl key pressed" flag
			FLG_keyPress_UsaProxy = false;		// keypress-event blocked
			return false;
		break;
		// if alt is pressed
		case 18:		
			FLG_comb_UsaProxy = false;			// reset combination flag
			combMembers_UsaProxy = 0;			// reset combination members
			FLG_altPressed_UsaProxy = true;		// set "alt key pressed" flag
			FLG_keyPress_UsaProxy = false;		// keypress-event blocked
			return false;
		break;
	}
	
	/** the following code is only executed for the character key in a key combination */
	
	/** combination check: if shift-char combination */
	if (FLG_shiftPressed_UsaProxy) {			// if shift was already pressed: keyID holds the char which follows shift
		keyName_UsaProxy = "shift+" + String.fromCharCode(KeyID);	// Select capital
		FLG_comb_UsaProxy = true;		// set key combination flag
		combMembers_UsaProxy = 2;	// 2 keys pressed
	}
	/** combination check: if ctrl-char combination */
	if (FLG_ctrlPressed_UsaProxy) {
		switch(KeyID) {		// if ctrl was already pressed: keyID holds the char which follows ctrl
			case 65: keyName_UsaProxy = "ctrl+a"; break;	// Select Alls command
			case 66: keyName_UsaProxy = "ctrl+b"; break;	// Edit bookmarks command
			case 67: keyName_UsaProxy = "ctrl+c"; break;	// Copy command
			case 68: keyName_UsaProxy = "ctrl+d"; break;	// Add bookmark command
			case 69: keyName_UsaProxy = "ctrl+e"; break;
			case 70: keyName_UsaProxy = "ctrl+f"; break;	// Find command
			case 71: keyName_UsaProxy = "ctrl+g"; break;	// NS: find Again command
			case 72: keyName_UsaProxy = "ctrl+h"; break;	// NS: open history command
			case 73: keyName_UsaProxy = "ctrl+i"; break;	// NS: page info command
			case 74: keyName_UsaProxy = "ctrl+j"; break;	// NS: downloads box
			case 75: keyName_UsaProxy = "ctrl+k"; break;	// NS: google search bar
			case 76: keyName_UsaProxy = "ctrl+l"; break;	// IE: open command
			case 77: keyName_UsaProxy = "ctrl+m"; break;	
			case 78: keyName_UsaProxy = "ctrl+n"; break;	// IE: new window NS: new message command
			case 79: keyName_UsaProxy = "ctrl+o"; break;	// Open command
			case 80: keyName_UsaProxy = "ctrl+p"; break;	// Print command
			case 81: keyName_UsaProxy = "ctrl+q"; break;	// NS: exit command
			case 82: keyName_UsaProxy = "ctrl+r"; break;	// Reload command
			case 83: keyName_UsaProxy = "ctrl+s"; break;	// Save command
			case 84: keyName_UsaProxy = "ctrl+t"; break;	
			case 85: keyName_UsaProxy = "ctrl+u"; break;	// NS: page source command
			case 86: keyName_UsaProxy = "ctrl+v"; break;	// Paste command
			case 87: keyName_UsaProxy = "ctrl+w"; break;	// Close command
			case 88: keyName_UsaProxy = "ctrl+x"; break;	// Cut command
			case 89: keyName_UsaProxy = "ctrl+y"; break;	// Select Alls command
			case 90: keyName_UsaProxy = "ctrl+z"; break;	// Select Alls command
		}
		
		// log ctrl+key combination
		writeLog_UsaProxy("keypress&key=" + keyName_UsaProxy);
		
		keyName_UsaProxy 			= "";				// reset keyName_UsaProxy
		
		/* reset ctrl key pressed flag already at keydown since NS doesn't
		 * trigger any keyup event in case of e.g. ctrl-f */
		FLG_ctrlPressed_UsaProxy 	= false;
		FLG_ctrl_comb_UsaProxy		= true;		/* set additional flag true to be able to
												 * determine a ctrl+key below although FLG_ctrlPressed_UsaProxy
												 * was already set false above */
		
		/* unlock handling of regular key presses:
		 * enable processKeyUp_UsaProxy functionality */
		FLG_keyPress_UsaProxy 		= true;
		
		FLG_comb_UsaProxy 			= true;			// set key combination flag
		combMembers_UsaProxy 		= 2;			// 2 keys pressed
	}
	
	/* NS: in case a combination (ctrl+key) was requested before
	 * which triggered a platform action (such as focus on Firefox find box)
	 * the keyup event won't be triggered. Therefore a reset of a possible
	 * combination must be performed on keydown
	 * since FLG_ctrlPressed_UsaProxy is set false above in the
	 * "if (FLG_ctrlPressed_UsaProxy)" block the additional variable
	 * FLG_ctrl_comb_UsaProxy is used */
	if(!FLG_ctrl_comb_UsaProxy && !FLG_shiftPressed_UsaProxy && !FLG_altPressed_UsaProxy) {
		FLG_comb_UsaProxy 			= false;			// reset key combination flag
		combMembers_UsaProxy 		= 0;
	}
	
}

/* Processes the release of key combinations: second part - key up/released
 * flags are reset in case shift, ctrl, or alt is released
 * in case any flag is true a combination is detected and logged  */
function processKeyup_UsaProxy(e) {

	/* get keycode
	* IE: first case (window.event available); NS: second case */
	var evtobj 	= window.event ? window.event : e;
	var KeyID 	= evtobj.which ? evtobj.which : evtobj.keyCode;
	
	// control key check
	switch(KeyID)
	{	
		// if shift is released
		case 16:
			// in case combination was pressed
			if(FLG_comb_UsaProxy==true) {
				/* if shift key is the first key of the combination which is released
				 * decrease number of remaining combination members */
				if (combMembers_UsaProxy==2) combMembers_UsaProxy=1;
				/* if shift is last released key of the combination */
				else {	
					FLG_comb_UsaProxy 			= false;	// reset key combination
					writeLog_UsaProxy("keyPress&key=" + keyName_UsaProxy);	// log key combination
					keyName_UsaProxy 			= "";		// reset key name
					FLG_shiftPressed_UsaProxy 	= false;	// reset shift pressed flag
					FLG_keyPress_UsaProxy 		= true;		// re-enable keypress event processing
				}
				return false;
			// if shift was pressed without combining it with another key
			} else {
				keyName_UsaProxy 			= "shift";		// set key name	
				FLG_shiftPressed_UsaProxy 	= false;		// reset shift pressed flag
				FLG_keyPress_UsaProxy 		= true;			// re-enable keypress event processing
			}
		break;
		/* if ctrl is released and no key combination was pressed (single ctrl press)
		 * since all combination reset actions were already performed on keydown
		 * no key combination resetting neccessary at this point */
		case 17:
			if(FLG_comb_UsaProxy==false && FLG_ctrlPressed_UsaProxy) {
				keyName_UsaProxy 			= "ctrl";		// set key name
				FLG_ctrlPressed_UsaProxy 	= false;		// reset ctrl pressed flag
				FLG_keyPress_UsaProxy 		= true;			// re-enable keypress event processing
			} 
		break;
		// if alt is released
		case 18:
			if(FLG_comb_UsaProxy==true) {
				/* if alt key is the first key of the combination which is released
				 * decrease number of remaining combination members */
				if (combMembers_UsaProxy==2) combMembers_UsaProxy=1;
				else {	
					FLG_comb_UsaProxy 		= false;		// reset key combination
					writeLog_UsaProxy("keypress&key=" + keyName_UsaProxy);
					keyName_UsaProxy 		= "";			// reset key name
					FLG_altPressed_UsaProxy = false;		// reset alt pressed flag
					FLG_keyPress_UsaProxy 	= true;			// re-enable keypress event processing
				}
				return false;
			// if alt was pressed without combining it with another key
			} else {
				keyName_UsaProxy 			= "alt";		// set key name
				FLG_altPressed_UsaProxy 	= false;		// reset alt pressed flag
				FLG_keyPress_UsaProxy 		= true;			// re-enable keypress event processing
			}
		break;
		// set key name in case of other control keys
		case 19: keyName_UsaProxy = "pause"; break;			// set key name
		case 37: keyName_UsaProxy = "arrowleft"; break;		// set key name
		case 38: keyName_UsaProxy = "arrowup"; break;		// set key name
		case 39: keyName_UsaProxy = "arrowright"; break;	// set key name
		case 40: keyName_UsaProxy = "arrowdown"; break; 	// set key name
		case 46: keyName_UsaProxy = "del"; break; 			// set key name
	}
	
	/* if combination is released (except ctrl+key since all flags
	 * are released on keydown)
	 * if first key of combination, decrease number of combination members
	 * else, reset combination flag */
	if(FLG_comb_UsaProxy) {
		if (combMembers_UsaProxy==2) combMembers_UsaProxy=1;
		else	FLG_comb_UsaProxy = false;
	}

	/* log a single key press or a key combination
	 * single press or end of key combination (last member to be released)
	 * is true if flag FLG_comb_UsaProxy is false and
	 * also the additional ctrl+key combination indicator (since
	 * resetting of all ctrl+key combination (except FLG_ctrl_comb_UsaProxy)
	 * flags occurs on keydown) */
	if(FLG_comb_UsaProxy==false && !FLG_ctrl_comb_UsaProxy && keyName_UsaProxy.length!=0) {
		writeLog_UsaProxy("keypress&key=" + keyName_UsaProxy);
		keyName_UsaProxy = "";
	}
}

/* Logs all regular single key presses. are logged
 * If keyPress flag is enabled (in case no control key is clicked at the same time)
 * the keyPress event returns for regular char keys the correct small case key code. */
function processKeypress_UsaProxy(e) {
	if(FLG_keyPress_UsaProxy) {
		/* get keycode
		 * IE: first case (window.event available); NS: second case */
		var evtobj 	= window.event ? window.event : e;
		var KeyID 	= evtobj.which ? evtobj.which : evtobj.keyCode;
		keyName_UsaProxy = String.fromCharCode(KeyID);
		
		if(FLG_comb_UsaProxy==false && !FLG_ctrl_comb_UsaProxy) {
			writeLog_UsaProxy("keypress&key=" + keyName_UsaProxy);
			keyName_UsaProxy = "";
		}
	}
}

/* Processes blur event */
function processBlur_UsaProxy(e) {

	/* get event target
	 * NS: first case (window.Event available); IE: second case */
	var ev 		= (window.Event) ? e : window.event;
	var target 	= (window.Event) ? ev.target : ev.srcElement;
	
	// log all available target attributes
	// if element has an id attribute
	if (target.id) {
		writeLog_UsaProxy("blur&id=" + target.id + generateEventString_UsaProxy(target));
	// if element has a name attribute
	} else {if (target.name) writeLog_UsaProxy("blur&name=" + target.name + generateEventString_UsaProxy(target));
			// all others
			else
				writeLog_UsaProxy("blur" + generateEventString_UsaProxy(target));
	}
}

/* Processes focus event */
function processFocus_UsaProxy(e) {

	/* get event target
	 * NS: first case (window.Event available); IE: second case */
	var ev 		= (window.Event) ? e : window.event;
	var target 	= (window.Event) ? ev.target : ev.srcElement;
	
	// log all available target attributes
	// if element has an id attribute
	if (target.id) {
		writeLog_UsaProxy("focus&id=" + target.id + generateEventString_UsaProxy(target));
	// if element has a name attribute
	} else { if (target.name) writeLog_UsaProxy("focus&name=" + target.name + generateEventString_UsaProxy(target));
			// all others
			else
				writeLog_UsaProxy("focus" + generateEventString_UsaProxy(target));
	}
}

/* Processes the selection of text within the web page's content.
 * Function is invoked on mousedown */
function processSelection_UsaProxy() {
		var currentSelection;
		// NS
		if (window.getSelection) currentSelection = window.getSelection();
		// safari, konqueror
		else if (document.getSelection) currentSelection = document.getSelection();
		// IE
		else if (document.selection) currentSelection = document.selection.createRange().text;
		
		// if selection is not empty and new text was selected, log select event
		if(currentSelection != "" && lastSelection_UsaProxy != currentSelection) {
			writeLog_UsaProxy("select&text=" + escape(currentSelection));
			// set last selected text
			lastSelection_UsaProxy = currentSelection;
			return true;
		}
		return false;
}

/* NS: Processes text selection event in textfields/areas.
 * Since NS doesn't capture any selected text in text fields/areas over getSelection,
 * function is invoked on select */
function processSelectionNS_UsaProxy(e) {

	/* get event target
	 * NS: first case (window.Event available); IE: second case (not necessary) */
	var ev 		= (window.Event) ? e : window.event;
	var target 	= (window.Event) ? ev.target : ev.srcElement;
	
	// if selection is not empty, log select event with the selected text
	if (target.selectionStart!=target.selectionEnd) {
		writeLog_UsaProxy("select" + generateEventString_UsaProxy(target) + "&text=" + escape(target.value.substring(target.selectionStart,target.selectionEnd)));
	}
}

/** end events logging */

/* Returns the DOM path of the specified DOM node beginning with the first
 * corresponding child node of the document node (i.e. HTML). Returns the empty string
 * for elements with no parents. */
function getDOMPath(node /*DOM element*/) {
	/* Mozilla developer documentation: "parentNode returns null for the 
	 * following node types: Attr, Document, DocumentFragment, Entity, and 
	 * Notation." Basically we want to stop the recursion always when a 
	 * parent node cannot be found. */
	
	// Fail if the recursion gets too deep. A DOM path cannot be determined
	// for elements with no parents.
	if ( node.parentNode === null ) return '';
	
	if ( node.parentNode.parentNode === null ) return getDOMIndex(node);
	
	return getDOMPath(node.parentNode) + getDOMIndex(node);
}

/** Returns the position of the specified node 
    in its parent node's childNodes array */
function getDOMIndex(node /*DOM element*/) {
	var parent = node.parentNode;
	var children = parent.childNodes;
	var length = children.length;
	var position = 0;
	for (var i = 0; i < length; i++) {
		/* if nodeType==1 same as nodetype==Node.ELEMENT_NODE, IE doesn't speak constants */
		if (children[i].nodeType==1) { // count only element nodes
			position += 1;
			if (children[i] == node) return mapToAlph(position);
		} 
	}
}

/* Optional: returns a hex representation of DOM path
 * e.g. having a path of <HTML><BODY><FORM><P>1st<INPUT>
 * results in 2h2h1h1h1h
 * e.g. having a path of <HTML><BODY><FORM><P>34th<INPUT>
 * results in 2h2h1h1h22h
 * with an "h" as hex suffix */
function mapToHex(position /*number*/) {
	return (position.toString(16) + "h");
}

/* Returns an alphabetic representation of the DOM path
 * e.g. having a path of <HTML><BODY><FORM><P>1st<INPUT>
 * results in bbaaa
 * e.g. having a path of <HTML><BODY><FORM><P>34th<INPUT>
 * results in bbaa1h
 * with an optional number as prefix which indicates the extent
 * to which the position exceeds the number of characters available
 * e.g. a position of 54 is represented by 2b (= 2x26 + b)*/
var alphArray = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]
function mapToAlph(position /*number*/) {
	var amountAlphs = 0;
	var alphRemain = "";
	if(position>alphArray.length) { // if position > available indexes
		amountAlphs = Math.floor( (position - 1) / alphArray.length );
		alphRemain = alphArray[ (position - 1) % alphArray.length ];
	} 
	if(amountAlphs>0) return (amountAlphs + alphRemain);
	return (alphArray[position-1]);
}

/* Computes the element's offset from the left edge
   of the browser window */
function absLeft(element) {
	if (element.pageX) return element.pageX;
	else
    	return (element.offsetParent)? 
     	element.offsetLeft + absLeft(element.offsetParent) : element.offsetLeft;
  }

/* Computes the element's offset from the top edge
   of the browser window */
function absTop(element) {
  	if (element.pageY) return element.pageY;
	else
     	return (element.offsetParent)? 
     	element.offsetTop + absTop(element.offsetParent) : element.offsetTop;
}

} )( document, window );