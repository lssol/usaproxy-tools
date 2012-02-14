// This is a lexer for UsaProxy 2.0 log files. Originally generated by the 
// ANTLR3 Maven Archetype generator. This lexer tries to avoid embedding
// code into the grammar file.

lexer grammar TLexer;

options {

   language=Java;  // Default

   // Tell ANTLR to make the generated lexer class extend the
   // the named class, which is where any supporting code and 
   // variables will be placed.
   //
   superClass = AbstractTLexer;
   
   filter = true;
}

// What package should the generated source exist in?
//
@header {

    package fi.uta.infim.usaproxylogparser;
}

// An IPv4 address, such as '127.0.0.1' - IPv6 not supported
//
IPADDRESS
	:	IPFRAGMENT '.' IPFRAGMENT '.' IPFRAGMENT '.' IPFRAGMENT
	;

// Date, in format 'YYYY-(M)M-(D)D'
// 
fragment
DATE
	:	YEAR '-' MONTH '-' DAY
	;

// Time, in format '(H)H:(m)m:(s)s'
//
fragment
TIME
	:	HOURS ':' MINUTES ':' SECONDS
	;

// Timestamp. Date and time separated by a comma (,).
// eg. '2012-01-14,15:00'
//
TIMESTAMP
	:	date=DATE ',' time=TIME
	;

// HTTP traffic index is given by the attribute 'sd'.
// The traffic index identifies the page being viewed. Changes for every new
// page being loaded.
//
HTTPTRAFFICINDEXATTRIBUTENAME
	:	'sd='
	;

// Session id is given by the attribute 'sid'.
// Session id changes on browser restart.
//
SESSIONIDATTRIBUTENAME
	:	'sid='
	;

// A DOM event, eg. 'event=mouseover'
//
EVENTATTRIBUTENAME
	:	'event='
	;

// URLs are logged for HTTP traffic start lines and certain DOM events.
//
URLATTRIBUTENAME
	:	'url='
	;

// An attribute other than the previously specified ones, 
// eg. 'id=base-image-4505287'
//
ATTRIBUTENAME
	:	ATTRIBNAMEPART '=' { setText( $ATTRIBNAMEPART.text ); } // drop the '=' 
	;

fragment
ATTRIBNAMEPART
	:	(ALPHA | DIGIT | '_')+
	;

// The string 'httptraffic' - marks the event when a page is loaded using 
// the proxy.
//
HTTPTRAFFIC
	:	'httptraffic'
	;

ATTRIBUTEVALUE
	:	(~(WS))+
	;

// Upper and lower case characters. English alphabet.
//
fragment
ALPHA : 'A'..'Z' | 'a'..'z' ;

// Hour part of a timestamp, eg. '3', '05' or '22'
//
fragment
HOURS : DIGIT | ('0'..'1' DIGIT) | ('2' '0'..'3') ;

// Minutes part of a timestamp, eg. '5', '09' or '59'
//
fragment
MINUTES : DIGIT | ('0'..'5' DIGIT) ;

// Seconds part of a timestamp, eg. '5', '09' or '59'
//
fragment
SECONDS : DIGIT | ('0'..'5' DIGIT) ;

// Year part of a timestamp, four digits, eg. '1994'
//
fragment
YEAR : DIGIT DIGIT DIGIT DIGIT ;

// Month part of a timestamp, eg. '3', '05' or '12'
//
fragment
MONTH : ('0'? '1'..'9') | '10' | '11' | '12' ;

// Date part of a timestamp, eg. '3', '07' or '31'
// 
fragment
DAY : ('0'? '1'..'9') | ('1'..'2' DIGIT) | '30' | '31' ;

// Single byte of an IP address in decimal format, eg. '1', '66' or '255'
//
fragment
IPFRAGMENT : DIGIT | (('0'..'1')? (DIGIT DIGIT)) | '2' '0'..'4' DIGIT | '25' '0'..'5' ; 

// A single digit.
//
fragment
DIGIT : '0'..'9' ;

// A new line (end of line). Used as the terminator character in the log file.
// Linux and Windows newlines supported.
//
NEWLINE
	:	( '\r'? '\n' )
	;

// White space. Any character that is considered as white space. List available
// for example at http://en.wikipedia.org/wiki/Whitespace_character
//
WS  :   ( ' '
        | '\t'
        | '\r'
        | '\n'
        )
    ;


	