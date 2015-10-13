/**
 * Creates a minimap by populating the `config.minimap` element with generated HTML.
 * Attaches event listeners to track viewport location and window resizing.
 *
 * @param {object} [config]
 * @param {HTMLElement | string} [config.minimap] Element that will hold the minimap DOM, '.xivmap' by default
 * @param {HTMLElement | string} [config.content] Element whose content will appear in the minimap, defaults to root element
 * @param {string | string[]} [config.selectors] Selectors for which elements will appear in the minimap
 * @param {boolean} [config.autohide=false] Only shows the minimap when hovering or scrolling.
 * @param {boolean} [config.refreshOnLoad=true] By default, xivmap will refresh itself upon hearing the window's load event, change to disable
 * @param {boolean} [config.fixedElementsAtTop=true] Draw fixed position elements at the top of the minimap, recommended.
 * @returns {{render: function, destroy: function}} Methods to force a re-render and to clean up listeners
 */
function xivmap(config) {

	// =======================================================
	// Variables
	// =======================================================
	config = config || {};

	// Prevents the render function from being called too often,
	// such as during window resize operations.
	var debouncedRender = debounce(render, 250);

	// The main config object
	var o = {
		minimap: toEl(config.minimap) || document.querySelector('.xivmap'),
		content: toEl(config.content) || document.documentElement,
		selectors: config.selectors || xivmap.selectors(),
		autohide: config.hasOwnProperty('autohide')? config.autohide : false,
		refreshOnLoad: config.hasOwnProperty('refreshOnLoad')? config.refreshOnLoad : true,
		fixedElementsAtTop: config.hasOwnProperty('fixedElementsAtTop')? config.fixedElementsAtTop : true
	};


	// =======================================================
	// Code execution
	// =======================================================

	if (o.minimap)

	render();
	attachListeners();
	if (config.refreshOnLoad && document.readyState !== 'complete') {
		once(window, 'load', render);
	}

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
		console.log('xivmap rendered');
	}

	function attachListeners() {
		var scrollTarget = o.content === document.documentElement? window : o.content;
		scrollTarget.addEventListener('scroll', updateViewport);
		scrollTarget.addEventListener('resize', debouncedRender);
		o.minimap.addEventListener('mousedown', beginDragTracking);
	}

	function detachListeners() {
		var scrollTarget = o.content === document.documentElement? window : o.content;
		scrollTarget.removeEventListener('scroll', updateViewport);
		scrollTarget.removeEventListener('resize', debouncedRender);
		o.minimap.removeEventListener('mousedown', beginDragTracking);
	}

	function updateDom() {
		var ratio = o.minimap.offsetWidth / o.content.offsetWidth;
		var elements = o.content.querySelectorAll(o.selectors);
		o.minimap.style.height = o.content.offsetHeight * ratio + 'px';
		var viewport = '<div class="xivmap-viewport" style="position: absolute; top: 0"><div></div></div>';

		var html = '';
		for (var i = 0; i < elements.length; i++) {
			var el = elements[i];
			var pos = position(el, o.content, o.fixedElementsAtTop);
			var width = Math.round(el.offsetWidth * ratio);
			var height = Math.round(el.offsetHeight * ratio);
			var top = Math.round(pos.top * ratio);
			var left = Math.round(pos.left * ratio);
			var style = 'style="' +
				'position: absolute; ' +
				'top: '+top+'px; ' +
				'left: '+left+'px; ' +
				'width: '+width+'px; ' +
				'height: '+height+'px;"';
			var tag = 'data-tag="'+el.tagName+'"';
			html += '<div '+style+' '+tag+'></div>';
		}
		html += viewport;

		o.minimap.innerHTML = html;
	}

	/**
	 * Recalculates the size of the viewport indicator.
	 */
	function resizeViewport() {
		var ratio = o.minimap.offsetWidth / o.content.offsetWidth;
		var viewport = o.minimap.querySelector('.xivmap-viewport');
		viewport.style.height = window.innerHeight * ratio + 'px';
	}

	/**
	 * Updates the position of the viewport indicator
	 */
	function updateViewport() {
		var topDistance = o.content === document.documentElement? window.pageYOffset : o.content.scrollTop;
		var ratio = o.minimap.offsetWidth / o.content.offsetWidth;
		var viewport = o.minimap.querySelector('.xivmap-viewport');
		viewport.style['margin-top'] = topDistance * ratio + 'px';
	}

	/**
	 * Triggers the initial animation and prevents FOUC,
	 * but only if an animation was specified through CSS.
	 */
	/*function beginAnimation() {
		console.log(getComputedStyle(o.minimap).getPropertyValue('animation-name'))
		o.minimap.classList.add('xivmap-animate');
	}*/

	/**
	 * Updates scroll position until the mouse button is released
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
		var ratio = o.minimap.offsetWidth / o.content.offsetWidth;
		var distance = mouseDistanceFromTopOfTarget(e);
		var viewport = o.minimap.querySelector('.xivmap-viewport');
		var centeredDistance = distance - viewport.offsetHeight / 2;
		window.scrollTo(0, centeredDistance / ratio);
	}

	function destroy() {
		detachListeners();
		o.minimap.innerHTML = '';
	}

	// =======================================================
	// Helper functions
	// =======================================================

	function toEl(selector) {
		return typeof selector === 'string'? document.querySelector(selector) : selector;
	}

	function mouseDistanceFromTopOfTarget(e) {
		return e.pageY - position(e.currentTarget).top;
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
	 * @param {Boolean} [fixedAtTop] Fixed element positions will be reported as if they were at the top of the page
	 * @returns {{left: number, top: number}}
	 */
	function position(element, ancestor, fixedAtTop) {
		fixedAtTop = typeof ancestor === 'boolean'? ancestor : fixedAtTop;
		var pos = {left: 0, top: 0};
		if (ancestor && typeof ancestor !== 'boolean') {
			var thisPos = position(element, fixedAtTop);
			var ancestorPos = position(ancestor, fixedAtTop);
			pos.left = thisPos.left - ancestorPos.left;
			pos.top = thisPos.top - ancestorPos.top;
		}
		else {
			if (fixedAtTop) do {
				// This method reports fixed elements as if they were
				// at the top of the page... Which is desirable for the minimap.
				pos.left += element.offsetLeft;
				pos.top += element.offsetTop;
			} while (element = element.offsetParent);
			else {
				var rect = element.getBoundingClientRect();
				pos.top = rect.top + window.pageYOffset;
				pos.left = rect.left + window.pageXOffset;
			}
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
		'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'input', 'button',
		'q', 'img', 'map', 'object', 'audio', 'video', 'code', 'textarea',
		'ul', 'ol', 'dl', 'table', 'form', 'blockquote', 'address',
		'p', 'pre'
	];
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
}