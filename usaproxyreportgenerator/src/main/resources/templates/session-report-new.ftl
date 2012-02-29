<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <title>UsaProxy session report - ${session.timestamp?datetime} - ${session.id}</title>
        
        <!-- jQuery UI CSS -->
        <link type="text/css" href="http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.17/themes/base/jquery-ui.css" rel="Stylesheet" />
        <link type="text/css" href="http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.17/themes/smoothness/jquery-ui.css" rel="Stylesheet" />
        
        <!-- Our very own CSS -->
		<link type="text/css" href="css/session-report.css" rel="Stylesheet" />
		
		<!-- jQuery and jQuery UI -->
        <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js" type="text/javascript"></script>
        <script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/jquery-ui.min.js" type="text/javascript"></script>
        
        <!-- Flot and flot plugins -->
        <script src="js/flot-0.7/jquery.flot.min.js" type="text/javascript"></script>
        <script src="js/flot-0.7/jquery.flot.fillbetween.min.js" type="text/javascript"></script>
        <script src="js/flot-0.7/jquery.mousewheel.min.js" type="text/javascript"></script>
        <script src="js/flot-0.7/jquery.flot.navigate.js" type="text/javascript"></script>
        
        <!-- UsaProxy session data from the log file -->
        <script type="text/javascript">
        	var USAPROXYREPORT = {};
        	USAPROXYREPORT.session = ${session.data};
        </script>
        
        <!-- Our very own JS -->
        <script src="js/utils.js" type="text/javascript"></script>
        <script src="js/main.js" type="text/javascript"></script>
    </head>
    <body>
		<div id="outerContainer">
			<div id="leftBar">
				<div id="header">
					<h1>UsaProxy session report</h1>
					<ul id="header-list">
						<li>
							<span class="list-title">Started at</span>
							<span class="list-content">${session.timestamp?datetime}</span>
						</li>
						<li>
							<span class="list-title">Session ID</span>
							<span class="list-content">${session.id}</span>
						</li>
						<li>
							<span class="list-title">IP address</span>
							<span class="list-content">${session.ip}</span>
						</li>
					</ul>
				</div>
				<div id="httpTraffic">
					<h2>HTTP traffic</h2>
					<ul id="httpTraffic-list">
						<#list session.httpTraffics as httpTraffic>
							<li class="trafficlistitem" id="${httpTrafficListIdPrefix}${httpTraffic.sessionID}">
								<span class="list-content">${httpTraffic.entry.timestamp?datetime}</span>
								<span class="list-sub-content">${httpTraffic.url}</span>
							</li>
							<script type="text/javascript">
								$( document ).ready( function()
								{
									$( "#${httpTrafficListIdPrefix}${httpTraffic.sessionID}" )
										.one( 'click', function()
										{
											$( document ).trigger( 'init-plot', 
												[ ${httpTraffic.sessionID}, 
												document.getElementById('${placeholderIdPrefix}${httpTraffic.sessionID}') ] );
										} )
										.click( function()
										{
											$( '.placeholder' ).hide();
											$( '#${placeholderIdPrefix}${httpTraffic.sessionID}' ).show();
											$( '.trafficlistitem' ).removeClass( 'selected' );
											$( this ).addClass( 'selected' );
										} )
										.css( {
                            				cursor: 'pointer'
                        				} )
                        				.hover( function()
                        				{
                        					$( this ).toggleClass( 'hilight' );
                        				} );
								} );
							</script>
						</#list>
					</ul>
				</div>
			</div>
			<div id="rightContent">
				<#list session.httpTraffics as httpTraffic>
					<div class="placeholder" id="${placeholderIdPrefix}${httpTraffic.sessionID}" />
				</#list>
			</div>
		</div>
	</body>
</html>