/**
 * Appease the jQuery masses by just wrapping it in a plugin
 */
if (jQuery) {
	jQuery.fn.xivmap = function(config) {
		config = config || {};
		config.minimap = config.minimap || this.get(0);
		return xivmap(config);
	}
}

/**
 * Returns a list of the default selectors used to create the minimap if
 * no selectors are provided via the configuration object.
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
 * Creates a minimap by populating the `config.minimap` element with generated HTML
 * Attached event listeners to track viewport location and window resizing.
 *
 * @param {object} config
 * @param {HTMLElement | string} config.minimap Element that will hold the minimap DOM
 * @param {HTMLElement | string} [config.content] Element whose content will appear in the minimap, defaults to root element
 * @param {string | string[]} [config.selectors] Selectors for which elements will appear in the minimap
 * @returns {{render: function, destroy: function}} Methods to force a re-render and to clean up listeners
 */
function xivmap(config) {
	var debouncedRender = debounce(render, 250);
	var o = {
		minimap: toEl(config.minimap) || document.querySelector('.xivmap'),
		content: toEl(config.content) || document.documentElement,
		selectors: config.selectors || xivmap.selectors()
	};

	render();
	attachListeners();

	return {
		render: render,
		destroy: destroy
	};

	function render() {
		updateDom();
		resizeViewport();
		updateViewport();
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
		var expander = '<div style="height: '+o.content.offsetHeight*ratio+'px"></div>';
		var viewport = '<div class="xivmap-viewport" style="position: absolute; top: 0"></div>';
		var html = expander;
		for (var i = 0; i < elements.length; i++) {
			var el = elements[i];
			var pos = position(el, o.content, true);
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

	function resizeViewport() {
		var ratio = o.minimap.offsetWidth / o.content.offsetWidth;
		var viewport = o.minimap.querySelector('.xivmap-viewport');
		console.log(viewport);
		viewport.style.height = window.innerHeight * ratio + 'px';
	}

	function updateViewport() {
		var topDistance = o.content === document.documentElement? window.pageYOffset : o.content.scrollTop;
		var ratio = o.minimap.offsetWidth / o.content.offsetWidth;
		var viewport = o.minimap.querySelector('.xivmap-viewport');
		viewport.style['margin-top'] = topDistance * ratio + 'px';
	}

	function destroy() {
		detachListeners();
		o.minimap.innerHTML = '';
	}

	function toEl(selector) {
		return typeof selector === 'string'? document.querySelector(selector) : selector;
	}

	function mouseDistanceFromTopOfTarget(e) {
		return e.pageY - position(e.currentTarget).top;
	}

	function beginDragTracking(e) {
		updateScrollPosition(e);
		o.minimap.addEventListener('mousemove', updateScrollPosition);
		window.addEventListener('mouseup', function() {
			o.minimap.removeEventListener('mousemove', updateScrollPosition);
		});
	}

	function updateScrollPosition(e) {
		var ratio = o.minimap.offsetWidth / o.content.offsetWidth;
		var distance = mouseDistanceFromTopOfTarget(e);
		var viewport = o.minimap.querySelector('.xivmap-viewport');
		var centeredDistance = distance - viewport.offsetHeight / 2;
		window.scrollTo(0, centeredDistance / ratio);
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

			if (last < wait && last >= 0) {
				timeout = setTimeout(later, wait - last);
			} else {
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
}