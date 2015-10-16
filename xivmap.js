/**
 * Creates a minimap by populating the `config.minimap` element with generated HTML.
 * Attaches event listeners to track viewport location and window resizing.
 *
 * @param {object} [config]
 * @param {string | HTMLElement} [config.minimap] Element that will hold the minimap DOM, '.xivmap' by default.
 * @param {string | string[]} [config.selectors] Selectors for elements that will appear in the minimap.
 * @param {string | HTMLElement} [config.context] Where to look for the selectors, defaults to document body.
 * @param {HTMLElement[] | NodeList} [config.elements] Elements that will appear in the minimap, in addition to selectors.
 * @param {boolean} [config.accurateText = true] Use text nodes instead of elements, makes text more detailed on the minimap.
 * @param {boolean} [config.accurateTextTags] Use text nodes for these types of tags, defaults to P and H1-H6.
 * @param {boolean} [config.renderNoOpacity = false] Whether to show elements with opacity: 0
 * @param {boolean} [config.autohide = false] Only shows the minimap when hovering or scrolling.
 * @param {boolean} [config.autohideDelay = 1500] Hide the minimap after this many milliseconds, when autohide is enabled.
 * @param {boolean} [config.refreshOnLoad = true] By default, xivmap will refresh itself upon hearing the window's load event, change to disable.
 * @returns {{refresh: function, destroy: function}} Methods to force a re-render and to clean up listeners.
 */
function xivmap(config) {

	// =======================================================
	// Variables
	// =======================================================

	// Prevent undefined errors if no argument is passed
	config = config || {};

	// Prevent the render function from being called too often,
	// such as during window resize operations.
	var debouncedRender = debounce(render, 350);

	// Need a variable to keep track of timeouts when using autohide
	var autohideScrollTimer = null;

	// The main config object
	var o = {
		minimap: toEl(config.minimap) || document.querySelector('.xivmap'),
		selectors: config.selectors || xivmap.selectors(),
		context: toEl(config.context) || document.body,
		elements: config.elements || [],
		accurateText: config.hasOwnProperty('accurateText')? config.accurateText : true,
		accurateTextTags: config.accurateTextTags || xivmap.accurateTextTags(),
		renderNoOpacity: config.hasOwnProperty('renderNoOpacity')? config.renderNoOpacity : false,
		autohide: config.hasOwnProperty('autohide')? config.autohide : false,
		autohideDelay: config.hasOwnProperty('autohideDelay')? config.autohideDelay : 1500,
		refreshOnLoad: config.hasOwnProperty('refreshOnLoad')? config.refreshOnLoad : true,
	};


	// =======================================================
	// Code execution
	// =======================================================

	if (!o.minimap) throw Error('Xivmap could not find a suitable container, please add a div with the "xivmap" class');

	render();
	attachListeners();
	if (o.refreshOnLoad) refreshOnPageLoad();
	if (o.autohide) autohideOnLoad();

	return {
		refresh: render,
		destroy: destroy
	};


	// =======================================================
	// Core functions
	// =======================================================

	function render() {
		updateDom();
		resizeViewport();
		updateViewport();
	}

	function attachListeners() {
		window.addEventListener('scroll', updateViewport);
		window.addEventListener('resize', debouncedRender);
		o.minimap.addEventListener('mousedown', beginDragTracking);

		if (o.autohide) {
			window.addEventListener('scroll', showMomentarily);
			o.minimap.addEventListener('mousemove', showMomentarily);
		}
	}

	function detachListeners() {
		window.removeEventListener('scroll', updateViewport);
		window.removeEventListener('resize', debouncedRender);
		o.minimap.removeEventListener('mousedown', beginDragTracking);
	}

	/**
	 * Puts together the representation of each element
	 * into the minimap element.
	 */
	function updateDom() {
		var ratio = o.minimap.offsetWidth / document.body.offsetWidth;
		var elements = uniq(mergeElementLists(o.context.querySelectorAll(o.selectors), o.elements));
		console.log('result', elements.length);
		console.log(o.context.querySelectorAll(o.selectors).length);
		o.minimap.style.height = document.body.offsetHeight * ratio + 'px';
		var viewport = '<div class="xivmap-viewport" style="position: absolute; top: 0"><div></div></div>';
		var html = '';
		for (var i = 0; i < elements.length; i++) {
			if (isElementVisible(elements[i], {opacity: o.renderNoOpacity})) {
				if (o.accurateText && contains(o.accurateTextTags, elements[i].tagName)) {
					html += makeAccurateRectangle(elements[i], ratio);
				}
				else html += makeRectangle(elements[i], ratio);
			}
		}
		html += viewport;
		o.minimap.innerHTML = html;
	}

	/**
	 * If the window's load event hasn't happened yet, then
	 * refresh the minimap once it does.
	 */
	function refreshOnPageLoad() {
		if (document.readyState !== 'complete') {
			once(window, 'load', render);
		}
	}

	/**
	 * When autohide is enabled, do not hide the minimap right away.
	 * Give it a chance to play entry animations first.
	 */
	function autohideOnLoad() {
		setTimeout(function() {
			if (!autohideScrollTimer) o.minimap.classList.add('xivmap-hidden');
		}, o.autohideDelay);
	}

	/**
	 * Recalculates the size of the viewport indicator.
	 * Should probably be used when resizing the window.
	 */
	function resizeViewport() {
		var ratio = o.minimap.offsetWidth / document.body.offsetWidth;
		var viewport = o.minimap.querySelector('.xivmap-viewport');
		viewport.style.height = window.innerHeight * ratio + 'px';
	}

	/**
	 * Updates the position of the viewport indicator.
	 * Should probably be used when scrolling.
	 */
	function updateViewport() {
		var topDistance = window.pageYOffset;
		var ratio = o.minimap.offsetWidth / document.body.offsetWidth;
		var viewport = o.minimap.querySelector('.xivmap-viewport');
		viewport.style['margin-top'] = topDistance * ratio + 'px';
	}

	/**
	 * Show the minimap for a few moments, according to autohideDelay, and
	 * then hide it. Used by various methods when autohide is enabled.
	 */
	function showMomentarily() {
		o.minimap.classList.remove('xivmap-hidden');
		if (autohideScrollTimer) clearTimeout(autohideScrollTimer);
		autohideScrollTimer = setTimeout(function() {
			o.minimap.classList.add('xivmap-hidden');
		}, o.autohideDelay);
	}

	/**
	 * Takes care of updating the window scroll position as the
	 * user drags along the minimap.
	 *
	 * @param {MouseEvent} e
	 */
	function beginDragTracking(e) {
		updateScrollPosition(e);
		o.minimap.addEventListener('mousemove', updateScrollPosition);
		once(window, 'mouseup', function() {
			o.minimap.removeEventListener('mousemove', updateScrollPosition);
		});
	}

	/**
	 * Scrolls the page or element according to the current
	 * cursor location in the minimap.
	 *
	 * @param {MouseEvent} e
	 */
	function updateScrollPosition(e) {
		var ratio = o.minimap.offsetWidth / document.body.offsetWidth;
		var distance = mouseDistanceFromTopOfTarget(e);
		var viewport = o.minimap.querySelector('.xivmap-viewport');
		var centeredDistance = distance - viewport.offsetHeight / 2;
		window.scrollTo(0, centeredDistance / ratio);
	}

	/**
	 * Clean up after itself
	 */
	function destroy() {
		detachListeners();
		o.minimap.innerHTML = '';
	}

	// =======================================================
	// Helper functions
	// =======================================================

	/**
	 * Combines NodeList and Element arrays
	 *
	 * @param {... (HTMLElement[] | NodeList)}
	 * @returns {HTMLElement[]}
	 */
	function mergeElementLists() {
		var elements = [];
		for (var i = 0; i < arguments.length; i++) {
			for (var j = 0; j < arguments[i].length; j++) {
				elements.push(arguments[i][j]);
			}
		}
		return elements;
	}

	/**
	 * Returns a new array with duplicates removed
	 *
	 * @param {[]} a
	 * @returns {[]}
	 */
	function uniq(a) {
		return a.filter(function(value, index, self) {
			return self.indexOf(value) === index;
		});
	}

	/**
	 * Returns an absolutely positioned representation of an element,
	 * ready to be used by xivmap.
	 *
	 * @param {HTMLElement | ClientRect} element
	 * @param {number} ratio Decimal ratio of viewport size to minimap size
	 * @param {HTMLElement} [originalElement] In cases where a ClientRect is passed as first argument
	 * @returns {string} The representation of the element, as an HTML string
	 */
	function makeRectangle(element, ratio, originalElement) {
		var rectangle = element instanceof HTMLElement? position(element) : element;
		if (!rectangle.width || !rectangle.height) return '';
		var style = 'style="' +
			'position: absolute; ' +
			'top: ' + r(rectangle.top * ratio) + 'px; ' +
			'left: ' + r(rectangle.left * ratio) + 'px; ' +
			'width: ' + r(rectangle.width * ratio) + 'px; ' +
			'height: ' + r(rectangle.height * ratio) + 'px;"';
		var tag = 'data-tag="' + (element.tagName || originalElement.tagName) + '"';
		return '<div '+style+' '+tag+'></div>';

		function r(number) {
			return Math.round(number);
		}
	}

	/**
	 * Wrapper for makeRectangle, but potentially using text nodes
	 *
	 * @param {HTMLElement} element
	 * @param {number} ratio
	 * @returns {string}
	 */
	function makeAccurateRectangle(element, ratio) {
		var html = '';
		var range = document.createRange();
		range.selectNodeContents(element);
		var rects = range.getClientRects();
		if (rects.length) {
			for (var i = 0; i < rects.length; i++) {
				var rect = clientRectAbsolutePosition(rects[i]);
				html += makeRectangle(rect, ratio, element);
			}
			return html;
		}
		return makeRectangle(element, ratio);
	}

	/**
	 * Returns true if item is in array
	 *
	 * @param {[]} array
	 * @param item
	 * @returns {boolean}
	 */
	function contains(array, item) {
		return array.indexOf(item) > -1;
	}

	/**
	 * Converts a client rectangle to one with positions
	 * calculated from the top of the document
	 *
	 * @param clientRect
	 * @returns {{top: number, left: number, width: number, height: number}}
	 */
	function clientRectAbsolutePosition(clientRect) {
		return {
			top: clientRect.top + window.pageYOffset,
			left: clientRect.left + window.pageXOffset,
			width: clientRect.width,
			height: clientRect.height
		}
	}

	/**
	 * Convert selector to element, if necessary
	 *
	 * @param {string | HTMLElement} selector
	 * @returns {HTMLElement}
	 */
	function toEl(selector) {
		return typeof selector === 'string'? document.querySelector(selector) : selector;
	}

	/**
	 * Given a MouseEvent, returns the distance from the top of the clicked element
	 *
	 * @param {MouseEvent} e
	 * @returns {number}
	 */
	function mouseDistanceFromTopOfTarget(e) {
		return e.pageY - position(e.currentTarget).top;
	}

	/**
	 * Calculates if an element is visible or would be visible to humans
	 * if they scrolled to it.
	 *
	 * @param {HTMLElement} element
	 * @param {object} [exceptions]
	 * @param {boolean} [exceptions.display = false] True means "Show elements with display: none"
	 * @param {boolean} [exceptions.visibility = false] True means "Show elements visibility: hidden"
	 * @param {boolean} [exceptions.opacity = false] True means "Show elements with opacity: 0"
	 * @returns {boolean}
	 */
	function isElementVisible(element, exceptions) {
		exceptions = exceptions || {};
		var currentElement = element.parentElement;
		while(currentElement) {
			var styles = getComputedStyle(currentElement);
			if (styles.getPropertyValue('overflow') !== 'visible' && !isInside(element, currentElement)) return false;
			if (!exceptions.display && styles.getPropertyValue('display') === 'none') return false;
			if (!exceptions.visibility && styles.getPropertyValue('visibility') === 'hidden') return false;
			if (!exceptions.opacity && styles.getPropertyValue('opacity') === '0') return false;
			currentElement = currentElement.parentElement;
		}
		return true;
	}

	/**
	 * Returns true if element's center point is inside the box
	 * created by host's four corners.
	 *
	 * @param {HTMLElement} element
	 * @param {HTMLElement} host
	 * @returns {boolean}
	 */
	function isInside(element, host) {
		var elRect = element.getBoundingClientRect();
		var hostRect = host.getBoundingClientRect();

		var elCenter = {x: 0, y: 0};
		elCenter.y = (elRect.bottom - elRect.top) / 2 + elRect.top;
		elCenter.x = (elRect.right - elRect.left) / 2 + elRect.left;

		return !!(
			hostRect.left <= elCenter.x
			&& elCenter.x <= hostRect.right
			&& hostRect.top <= elCenter.y
			&& elCenter.y <= hostRect.bottom
		);
	}

	/**
	 * Get position relative to the root element
	 * position(el)
	 *
	 * Get position relative to ancestor
	 * position(el, ancestor)
	 *
	 * @param {HTMLElement} element
	 * @param {HTMLElement} [ancestor]
	 * @returns {{left: number, top: number, width: number, height: number}}
	 */
	function position(element, ancestor) {
		var pos = {left: 0, top: 0, width: 0, height: 0};
		if (ancestor) {
			var thisPos = position(element);
			var ancestorPos = position(ancestor);
			pos.left = thisPos.left - ancestorPos.left;
			pos.top = thisPos.top - ancestorPos.top;
			pos.width = thisPos.width;
			pos.height = thisPos.height;
		}
		else {
			var rect = element.getBoundingClientRect();
			pos.top = rect.top + window.pageYOffset;
			pos.left = rect.left + window.pageXOffset;
			pos.width = rect.width;
			pos.height = rect.height;
		}
		return pos;
	}

	/**
	 * Debounce function taken from Underscore:
	 * http://underscorejs.org/docs/underscore.html
	 *
	 * Modified _.now to Date.now
	 */
	function debounce(func, wait, immediate) {
		var timeout, args, context, timestamp, result;
		var later = function() {
			var last = Date.now() - timestamp;
			if (last < wait && last >= 0) timeout = setTimeout(later, wait - last);
			else {
				timeout = null;
				if (!immediate) {
					result = func.apply(context, args);
					if (!timeout) context = args = null;
				}
			}
		};
		return function() {
			context = this;
			args = arguments;
			timestamp = Date.now();
			var callNow = immediate && !timeout;
			if (!timeout) timeout = setTimeout(later, wait);
			if (callNow) {
				result = func.apply(context, args);
				context = args = null;
			}
			return result;
		};
	}

	/**
	 * Registers an event on 'node' and removes it once it fires
	 *
	 * @param {EventTarget | object} node
	 * @param {string} type
	 * @param {function} callback
	 */
	function once(node, type, callback) {
		node.addEventListener(type, handler);
		function handler() {
			node.removeEventListener(type, handler);
			callback.apply(this, arguments);
		}
	}
}

/**
 * Returns a list of the default selectors used to create the minimap in
 * cases where no selectors are provided via the configuration object.
 *
 * @returns {string[]}
 */
xivmap.selectors = function() {
	return [
		'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'input', 'button', 'label',
		'q', 'img', 'map', 'object', 'audio', 'video', 'iframe', 'code', 'textarea',
		'li', 'tr', 'form', 'blockquote', 'address',
		'p', 'pre', '.include-in-xivmap'
	];
};

/**
 * Returns a list of tags for which to use text nodes instead of the
 * element. Using text nodes means more accurate boxes based on text length.
 *
 * @returns {string[]}
 */
xivmap.accurateTextTags = function() {
	return ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P'];
};

/**
 * If jQuery is available, add xivmap as a plugin
 */
if (jQuery) {
	jQuery.fn.xivmap = function(config) {
		config = config || {};
		config.minimap = config.minimap || this.get(0);
		return xivmap(config);
	};

	jQuery.fn.xivmap.selectors = xivmap.selectors;
	jQuery.fn.xivmap.accurateTextTags = xivmap.accurateTextTags;
}