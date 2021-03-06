/*
 * UsaProxyLogParser - Java API for UsaProxy-fork logs
 *  Copyright (C) 2012 Teemu P��kk�nen - University of Tampere
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

package fi.uta.infim.usaproxylogparser;

import java.util.HashMap;

/**
 * A viewport change event is triggered when the user scrolls the page or
 * resizes the browser window. Viewport and document dimensions are logged each
 * time this event occurs.
 * @author Teemu P��kk�nen
 *
 */
public class UsaProxyViewportChangeEvent extends UsaProxyPageEvent {

	protected UsaProxyViewportChangeEvent() {
		super();
	}

	/**
	 * Constructs a full viewport change event object.
	 * @param eventType event name as logged
	 * @param attributes event attributes, map
	 * @param sessionID session id as logged
	 * @param httpTrafficIndex http traffic id as logged
	 * @param ip user's ip address as logged
	 * @param entry the log entry that contains this event
	 */
	UsaProxyViewportChangeEvent(String eventType,
			HashMap<String, String> attributes, String sessionID,
			String httpTrafficIndex, String ip, UsaProxyPageEventEntry entry) {
		super(eventType, attributes, sessionID, httpTrafficIndex, ip, entry);
		
		setViewportTop( Double.valueOf( attributes.get("top") ) );
		setViewportBottom( Double.valueOf( attributes.get("bottom") ) );
		setViewportLeft( Double.valueOf( attributes.get("left") ) );
		setViewportRight( Double.valueOf( attributes.get("right") ) );
		
		setDocumentHeight( Integer.valueOf( attributes.get( "documentHeight" ) ) );
		setDocumentWidth( Integer.valueOf( attributes.get( "documentWidth" ) ) );
		
		setViewportHeight( Integer.valueOf( attributes.get("viewportHeight")));
		setViewportWidth( Integer.valueOf( attributes.get("viewportWidth")));
		
		attributes.remove( "top" );
		attributes.remove( "bottom" );
		attributes.remove( "left" );
		attributes.remove( "right" );
		
		attributes.remove( "documentHeight" );
		attributes.remove( "documentWidth" );
		
		attributes.remove( "viewportHeight" );
		attributes.remove( "viewportWidth" );
		
		getScreen().setInitialViewportEvent(this);
		getScreen().setHttpTrafficSession(getHttpTrafficSession());
	}

	/**
	 * 
	 */
	private static final long serialVersionUID = -2564037375339245988L;

	/**
	 * The position of the viewport's top, relative to the document's height.
	 * Percentage. 0% = top, 100% = bottom.
	 */
	private Double viewportTop;
	
	/**
	 * The position of the viewport's bottom, relative to the document's height.
	 * Percentage. 0% = top, 100% = bottom.
	 */
	private Double viewportBottom;
	
	/**
	 * The position of the viewport's left edge, relative to the document's width.
	 * Percentage. 0% = left edge, 100% = right edge.
	 */
	private Double viewportLeft;
	
	/**
	 * The position of the viewport's right edge, relative to the document's width.
	 * Percentage. 0% = left edge, 100% = right edge.
	 */
	private Double viewportRight;
	
	/**
	 * Current height of the document in pixels.
	 */
	private Integer documentHeight;
	
	/**
	 * Current width of the document in pixels.
	 */
	private Integer documentWidth;
	
	/**
	 * Current height of the viewport in pixels.
	 */
	private Integer viewportHeight;
	
	/**
	 * Current width of the viewport in pixels.
	 */
	private Integer viewportWidth;

	/**
	 * Returns viewport's top's position
	 * @return The position of the viewport's top, relative to the document's height.
	 * Percentage. 0% = top, 100% = bottom.
	 */
	public Double getViewportTop() {
		return viewportTop;
	}

	void setViewportTop(Double viewportTop) {
		this.viewportTop = viewportTop;
	}

	/**
	 * Return viewport's bottom's position
	 * @return The position of the viewport's bottom, relative to the document's height.
	 * Percentage. 0% = top, 100% = bottom.
	 */
	public Double getViewportBottom() {
		return viewportBottom;
	}

	void setViewportBottom(Double viewportBottom) {
		this.viewportBottom = viewportBottom;
	}

	/**
	 * Returns viewport's left edge's position
	 * @return The position of the viewport's left edge, relative to the document's width.
	 * Percentage. 0% = top, 100% = bottom.
	 */
	public Double getViewportLeft() {
		return viewportLeft;
	}

	void setViewportLeft(Double viewportLeft) {
		this.viewportLeft = viewportLeft;
	}

	/**
	 * Returns viewport's right edge's position
	 * @return The position of the viewport's right edge, relative to the document's width.
	 * Percentage. 0% = top, 100% = bottom.
	 */
	public Double getViewportRight() {
		return viewportRight;
	}

	void setViewportRight(Double viewportRight) {
		this.viewportRight = viewportRight;
	}

	/**
	 * Returns document's height
	 * @return Document's height in pixels
	 */
	public Integer getDocumentHeight() {
		return documentHeight;
	}

	void setDocumentHeight(Integer documentHeight) {
		this.documentHeight = documentHeight;
	}

	/**
	 * Returns document's width
	 * @return document's width in pixels
	 */
	public Integer getDocumentWidth() {
		return documentWidth;
	}

	void setDocumentWidth(Integer documentWidth) {
		this.documentWidth = documentWidth;
	}

	/**
	 * Returns viewport's height
	 * @return Height of browser window (viewport) in pixels
	 */
	public Integer getViewportHeight() {
		return viewportHeight;
	}

	void setViewportHeight(Integer viewportHeight) {
		this.viewportHeight = viewportHeight;
	}

	/**
	 * Returns viewport's width
	 * @return Width of the browser window (viewport) in pixels.
	 */
	public Integer getViewportWidth() {
		return viewportWidth;
	}

	void setViewportWidth(Integer viewportWidth) {
		this.viewportWidth = viewportWidth;
	}
	
	
}
