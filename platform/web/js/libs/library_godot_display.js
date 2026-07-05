/**************************************************************************/
/*  library_godot_display.js                                              */
/**************************************************************************/
/*                         This file is part of:                          */
/*                             GODOT ENGINE                               */
/*                        https://godotengine.org                         */
/**************************************************************************/
/* Copyright (c) 2014-present Godot Engine contributors (see AUTHORS.md). */
/* Copyright (c) 2007-2014 Juan Linietsky, Ariel Manzur.                  */
/*                                                                        */
/* Permission is hereby granted, free of charge, to any person obtaining  */
/* a copy of this software and associated documentation files (the        */
/* "Software"), to deal in the Software without restriction, including    */
/* without limitation the rights to use, copy, modify, merge, publish,    */
/* distribute, sublicense, and/or sell copies of the Software, and to     */
/* permit persons to whom the Software is furnished to do so, subject to  */
/* the following conditions:                                              */
/*                                                                        */
/* The above copyright notice and this permission notice shall be         */
/* included in all copies or substantial portions of the Software.        */
/*                                                                        */
/* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,        */
/* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF     */
/* MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. */
/* IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY   */
/* CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,   */
/* TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE      */
/* SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.                 */
/**************************************************************************/

/**
 * Virtual keyboard helper for the Godot Web platform.
 * Creates and manages hidden input/textarea elements for capturing text input on mobile devices.
 * @module GodotDisplayVK
 */
const GodotDisplayVK = {

	$GodotDisplayVK__deps: ['$GodotRuntime', '$GodotConfig', '$GodotEventListeners', '$GodotInput'],
	$GodotDisplayVK__postset: 'GodotOS.atexit(function(resolve, reject) { GodotDisplayVK.clear(); resolve(); });',
	$GodotDisplayVK: {
		textinput: null,
		textarea: null,

		/**
		 * Checks if the virtual keyboard is available (requires touch support and virtual_keyboard enabled).
		 * @returns {boolean} True if virtual keyboard can be used.
		 */
		available: function () {
			return GodotConfig.virtual_keyboard && 'ontouchstart' in window;
		},

		/**
		 * Initializes the virtual keyboard input elements.
		 * @param {number} input_cb - Callback function pointer for text input events.
		 */
		init: function (input_cb) {
			function create(what) {
				const elem = document.createElement(what);
				elem.style.display = 'none';
				elem.style.position = 'absolute';
				elem.style.zIndex = '-1';
				elem.style.background = 'transparent';
				elem.style.padding = '0px';
				elem.style.margin = '0px';
				elem.style.overflow = 'hidden';
				elem.style.width = '0px';
				elem.style.height = '0px';
				elem.style.border = '0px';
				elem.style.outline = 'none';
				elem.readonly = true;
				elem.disabled = true;
				GodotEventListeners.add(elem, 'input', function (evt) {
					const c_str = GodotRuntime.allocString(elem.value);
					input_cb(c_str, elem.selectionEnd);
					GodotRuntime.free(c_str);
				}, false);
				if (what === 'input') {
					// Handling the "Enter" key.
					const onKey = (pEvent, pEventName) => {
						if (pEvent.key !== 'Enter') {
							return;
						}
						GodotInput.onKeyEvent(pEventName === 'keydown', pEvent);
					};
					GodotEventListeners.add(elem, 'keydown', (pEvent) => onKey(pEvent, 'keydown'), false);
					GodotEventListeners.add(elem, 'keyup', (pEvent) => onKey(pEvent, 'keyup'), false);
				}
				GodotEventListeners.add(elem, 'blur', function (evt) {
					elem.style.display = 'none';
					elem.readonly = true;
					elem.disabled = true;
				}, false);
				GodotConfig.canvas.insertAdjacentElement('beforebegin', elem);
				return elem;
			}
			GodotDisplayVK.textinput = create('input');
			GodotDisplayVK.textarea = create('textarea');
			GodotDisplayVK.updateSize();
		},

		/**
		 * Shows the virtual keyboard with the specified text and configuration.
		 * @param {string} text - Initial text to display.
		 * @param {number} type - Keyboard type (0=DEFAULT, 1=MULTILINE, 2=NUMBER, etc.).
		 * @param {number} start - Selection start position.
		 * @param {number} end - Selection end position.
		 */
		show: function (text, type, start, end) {
			if (!GodotDisplayVK.textinput || !GodotDisplayVK.textarea) {
				return;
			}
			if (GodotDisplayVK.textinput.style.display !== '' || GodotDisplayVK.textarea.style.display !== '') {
				GodotDisplayVK.hide();
			}
			GodotDisplayVK.updateSize();

			let elem = GodotDisplayVK.textinput;
			switch (type) {
			case 0: // DisplayServerEnums::KEYBOARD_TYPE_DEFAULT
				elem.type = 'text';
				elem.inputmode = '';
				break;
			case 1: // DisplayServerEnums::KEYBOARD_TYPE_MULTILINE
				elem = GodotDisplayVK.textarea;
				break;
			case 2: // DisplayServerEnums::KEYBOARD_TYPE_NUMBER
				elem.type = 'text';
				elem.inputmode = 'numeric';
				break;
			case 3: // DisplayServerEnums::KEYBOARD_TYPE_NUMBER_DECIMAL
				elem.type = 'text';
				elem.inputmode = 'decimal';
				break;
			case 4: // DisplayServerEnums::KEYBOARD_TYPE_PHONE
				elem.type = 'tel';
				elem.inputmode = '';
				break;
			case 5: // DisplayServerEnums::KEYBOARD_TYPE_EMAIL_ADDRESS
				elem.type = 'email';
				elem.inputmode = '';
				break;
			case 6: // DisplayServerEnums::KEYBOARD_TYPE_PASSWORD
				elem.type = 'password';
				elem.inputmode = '';
				break;
			case 7: // DisplayServerEnums::KEYBOARD_TYPE_URL
				elem.type = 'url';
				elem.inputmode = '';
				break;
			default:
				elem.type = 'text';
				elem.inputmode = '';
				break;
			}

			elem.readonly = false;
			elem.disabled = false;
			elem.value = text;
			elem.style.display = 'block';
			elem.focus();
			elem.setSelectionRange(start, end);
		},

		/**
		 * Hides the virtual keyboard elements.
		 */
		hide: function () {
			if (!GodotDisplayVK.textinput || !GodotDisplayVK.textarea) {
				return;
			}
			[GodotDisplayVK.textinput, GodotDisplayVK.textarea].forEach(function (elem) {
				elem.blur();
				elem.style.display = 'none';
				elem.value = '';
			});
		},

		/**
		 * Updates the size and position of the virtual keyboard elements to match the canvas.
		 */
		updateSize: function () {
			if (!GodotDisplayVK.textinput || !GodotDisplayVK.textarea) {
				return;
			}
			const rect = GodotConfig.canvas.getBoundingClientRect();
			function update(elem) {
				elem.style.left = `${rect.left}px`;
				elem.style.top = `${rect.top}px`;
				elem.style.width = `${rect.width}px`;
				elem.style.height = `${rect.height}px`;
			}
			update(GodotDisplayVK.textinput);
			update(GodotDisplayVK.textarea);
		},

		/**
		 * Removes the virtual keyboard elements from the DOM.
		 */
		clear: function () {
			if (GodotDisplayVK.textinput) {
				GodotDisplayVK.textinput.remove();
				GodotDisplayVK.textinput = null;
			}
			if (GodotDisplayVK.textarea) {
				GodotDisplayVK.textarea.remove();
				GodotDisplayVK.textarea = null;
			}
		},
	},
};
mergeInto(LibraryManager.library, GodotDisplayVK);

/*
 * Display server cursor helper.
 * Keeps track of cursor status and custom shapes.
 */
/**
 * Cursor management for the Godot Web platform.
 * Handles cursor visibility, custom shapes, and pointer lock functionality.
 * @module GodotDisplayCursor
 */
const GodotDisplayCursor = {
	$GodotDisplayCursor__deps: ['$GodotOS', '$GodotConfig'],
	$GodotDisplayCursor__postset: 'GodotOS.atexit(function(resolve, reject) { GodotDisplayCursor.clear(); resolve(); });',
	$GodotDisplayCursor: {
		shape: 'default',
		visible: true,
		cursors: {},

		/**
		 * Sets the CSS cursor style on the canvas.
		 * @param {string} style - CSS cursor style string.
		 */
		set_style: function (style) {
			GodotConfig.canvas.style.cursor = style;
		},

		/**
		 * Sets the cursor shape, applying custom cursor CSS if needed.
		 * @param {string} shape - Cursor shape name.
		 */
		set_shape: function (shape) {
			GodotDisplayCursor.shape = shape;
			let css = shape;
			if (shape in GodotDisplayCursor.cursors) {
				const c = GodotDisplayCursor.cursors[shape];
				css = `url("${c.url}") ${c.x} ${c.y}, default`;
			}
			if (GodotDisplayCursor.visible) {
				GodotDisplayCursor.set_style(css);
			}
		},

		/**
		 * Clears cursor state and revokes custom cursor object URLs.
		 */
		clear: function () {
			GodotDisplayCursor.set_style('');
			GodotDisplayCursor.shape = 'default';
			GodotDisplayCursor.visible = true;
			Object.keys(GodotDisplayCursor.cursors).forEach(function (key) {
				URL.revokeObjectURL(GodotDisplayCursor.cursors[key]);
				delete GodotDisplayCursor.cursors[key];
			});
		},

		/**
		 * Requests pointer lock on the canvas element.
		 */
		lockPointer: function () {
			const canvas = GodotConfig.canvas;
			if (canvas.requestPointerLock) {
				canvas.requestPointerLock();
			}
		},

		/**
		 * Releases the pointer lock if active.
		 */
		releasePointer: function () {
			if (document.exitPointerLock) {
				document.exitPointerLock();
			}
		},

		/**
		 * Checks if the pointer is locked to the canvas.
		 * @returns {boolean} True if pointer is locked to the canvas.
		 */
		isPointerLocked: function () {
			return document.pointerLockElement === GodotConfig.canvas;
		},
	},
};
mergeInto(LibraryManager.library, GodotDisplayCursor);

/**
 * Screen management for the Godot Web platform.
 * Handles fullscreen, pixel ratio, and canvas size updates.
 * @module GodotDisplayScreen
 */
const GodotDisplayScreen = {
	$GodotDisplayScreen__deps: ['$GodotConfig', '$GodotOS', '$GL', 'emscripten_webgl_get_current_context'],
	$GodotDisplayScreen: {
		desired_size: [0, 0],
		hidpi: true,

		/**
		 * Returns the device pixel ratio, accounting for HiDPI setting.
		 * @returns {number} The pixel ratio (1 or devicePixelRatio).
		 */
		getPixelRatio: function () {
			return GodotDisplayScreen.hidpi ? window.devicePixelRatio || 1 : 1;
		},

		/**
		 * Checks if the canvas is currently in fullscreen mode.
		 * @returns {boolean} True if canvas is in fullscreen.
		 */
		isFullscreen: function () {
			const elem = document.fullscreenElement || document.mozFullscreenElement
				|| document.webkitFullscreenElement || document.msFullscreenElement;
			if (elem) {
				return elem === GodotConfig.canvas;
			}
			// But maybe knowing the element is not supported.
			return document.fullscreen || document.mozFullScreen
				|| document.webkitIsFullscreen;
		},

		/**
		 * Checks if fullscreen API is available in the browser.
		 * @returns {boolean} True if fullscreen can be requested.
		 */
		hasFullscreen: function () {
			return document.fullscreenEnabled || document.mozFullScreenEnabled
				|| document.webkitFullscreenEnabled;
		},

		/**
		 * Requests fullscreen mode for the canvas.
		 * @returns {number} 0 on success, 1 on failure.
		 */
		requestFullscreen: function () {
			if (!GodotDisplayScreen.hasFullscreen()) {
				return 1;
			}
			const canvas = GodotConfig.canvas;
			try {
				const promise = (canvas.requestFullscreen || canvas.msRequestFullscreen
					|| canvas.mozRequestFullScreen || canvas.mozRequestFullscreen
					|| canvas.webkitRequestFullscreen
				).call(canvas);
				// Some browsers (Safari) return undefined.
				// For the standard ones, we need to catch it.
				if (promise) {
					promise.catch(function () {
						// nothing to do.
					});
				}
			} catch (e) {
				return 1;
			}
			return 0;
		},

		/**
		 * Exits fullscreen mode if currently active.
		 * @returns {number} 0 on success, 1 if not in fullscreen.
		 */
		exitFullscreen: function () {
			if (!GodotDisplayScreen.isFullscreen()) {
				return 0;
			}
			try {
				const promise = document.exitFullscreen();
				if (promise) {
					promise.catch(function () {
						// nothing to do.
					});
				}
			} catch (e) {
				return 1;
			}
			return 0;
		},

		/**
		 * Updates the WebGL framebuffer size to match the canvas.
		 * @private
		 */
		_updateGL: function () {
			const gl_context_handle = _emscripten_webgl_get_current_context();
			const gl = GL.getContext(gl_context_handle);
			if (gl) {
				GL.resizeOffscreenFramebuffer(gl);
			}
		},

		/**
		 * Updates the canvas size based on desired size and fullscreen state.
		 * @returns {number} 1 if size was updated, 0 otherwise.
		 */
		updateSize: function () {
			const isFullscreen = GodotDisplayScreen.isFullscreen();
			const wantsFullWindow = GodotConfig.canvas_resize_policy === 2;
			const noResize = GodotConfig.canvas_resize_policy === 0;
			const dWidth = GodotDisplayScreen.desired_size[0];
			const dHeight = GodotDisplayScreen.desired_size[1];
			const canvas = GodotConfig.canvas;
			let width = dWidth;
			let height = dHeight;
			if (noResize) {
				// Don't resize canvas, just update GL if needed.
				if (canvas.width !== width || canvas.height !== height) {
					GodotDisplayScreen.desired_size = [canvas.width, canvas.height];
					GodotDisplayScreen._updateGL();
					return 1;
				}
				return 0;
			}
			const scale = GodotDisplayScreen.getPixelRatio();
			if (isFullscreen || wantsFullWindow) {
				// We need to match screen size.
				width = Math.floor(window.innerWidth * scale);
				height = Math.floor(window.innerHeight * scale);
			}
			const csw = `${Math.floor(width / scale)}px`;
			const csh = `${Math.floor(height / scale)}px`;
			if (canvas.style.width !== csw || canvas.style.height !== csh || canvas.width !== width || canvas.height !== height) {
				// Size doesn't match.
				// Resize canvas, set correct CSS pixel size, update GL.
				canvas.width = width;
				canvas.height = height;
				canvas.style.width = csw;
				canvas.style.height = csh;
				GodotDisplayScreen._updateGL();
				return 1;
			}
			return 0;
		},
	},
};
mergeInto(LibraryManager.library, GodotDisplayScreen);

/**
 * Display server interface.
 *
 * Exposes all the functions needed by DisplayServer implementation.
 * @module GodotDisplay
 */
const GodotDisplay = {
	$GodotDisplay__deps: ['$GodotConfig', '$GodotRuntime', '$GodotDisplayCursor', '$GodotEventListeners', '$GodotDisplayScreen', '$GodotDisplayVK'],
	$GodotDisplay: {
		window_icon: '',

		/**
		 * Returns the DPI of the screen based on device pixel ratio.
		 * @returns {number} The DPI value (minimum 96).
		 */
		getDPI: function () {
			// devicePixelRatio is given in dppx
			// https://drafts.csswg.org/css-values/#resolution
			// > due to the 1:96 fixed ratio of CSS *in* to CSS *px*, 1dppx is equivalent to 96dpi.
			const dpi = Math.round(window.devicePixelRatio * 96);
			return dpi >= 96 ? dpi : 96;
		},
	},

	/**
	 * Checks if the platform uses swap-style OK/Cancel buttons (Windows).
	 * @returns {number} 1 if Windows platform, 0 otherwise.
	 */
	godot_js_display_is_swap_ok_cancel__proxy: 'sync',
	godot_js_display_is_swap_ok_cancel__sig: 'i',
	godot_js_display_is_swap_ok_cancel: function () {
		const win = (['Windows', 'Win64', 'Win32', 'WinCE']);
		const plat = navigator.platform || '';
		if (win.indexOf(plat) !== -1) {
			return 1;
		}
		return 0;
	},

	/**
	 * Checks if the speech synthesis system is currently speaking.
	 * @returns {boolean} True if speech is in progress.
	 */
	godot_js_tts_is_speaking__proxy: 'sync',
	godot_js_tts_is_speaking__sig: 'i',
	godot_js_tts_is_speaking: function () {
		return window.speechSynthesis.speaking;
	},

	/**
	 * Checks if the speech synthesis system is currently paused.
	 * @returns {boolean} True if speech is paused.
	 */
	godot_js_tts_is_paused__proxy: 'sync',
	godot_js_tts_is_paused__sig: 'i',
	godot_js_tts_is_paused: function () {
		return window.speechSynthesis.paused;
	},

	/**
	 * Retrieves available speech synthesis voices and passes them to a callback.
	 * @param {number} p_callback - Callback function pointer to receive the voices.
	 */
	godot_js_tts_get_voices__proxy: 'sync',
	godot_js_tts_get_voices__sig: 'vi',
	godot_js_tts_get_voices: function (p_callback) {
		const func = GodotRuntime.get_func(p_callback);
		try {
			const arr = [];
			const voices = window.speechSynthesis.getVoices();
			for (let i = 0; i < voices.length; i++) {
				arr.push(`${voices[i].lang};${voices[i].name}`);
			}
			const c_ptr = GodotRuntime.allocStringArray(arr);
			func(arr.length, c_ptr);
			GodotRuntime.freeStringArray(c_ptr, arr.length);
		} catch (e) {
			// Fail graciously.
		}
	},

	/**
	 * Speaks the given text using the Web Speech API.
	 * @param {number} p_text - Pointer to the text to speak.
	 * @param {number} p_voice - Pointer to the voice name to use.
	 * @param {number} p_volume - Volume level (0-100).
	 * @param {number} p_pitch - Pitch level.
	 * @param {number} p_rate - Speaking rate.
	 * @param {number} p_utterance_id - Identifier for the utterance.
	 * @param {number} p_callback - Callback function pointer for utterance events.
	 */
	godot_js_tts_speak__proxy: 'sync',
	godot_js_tts_speak__sig: 'viiiffii',
	godot_js_tts_speak: function (p_text, p_voice, p_volume, p_pitch, p_rate, p_utterance_id, p_callback) {
		const func = GodotRuntime.get_func(p_callback);

		function listener_end(evt) {
			evt.currentTarget.cb(1 /* DisplayServerEnums::TTS_UTTERANCE_ENDED */, evt.currentTarget.id, 0);
		}

		function listener_start(evt) {
			evt.currentTarget.cb(0 /* DisplayServerEnums::TTS_UTTERANCE_STARTED */, evt.currentTarget.id, 0);
		}

		function listener_error(evt) {
			evt.currentTarget.cb(2 /* DisplayServerEnums::TTS_UTTERANCE_CANCELED */, evt.currentTarget.id, 0);
		}

		function listener_bound(evt) {
			evt.currentTarget.cb(3 /* DisplayServerEnums::TTS_UTTERANCE_BOUNDARY */, evt.currentTarget.id, evt.charIndex);
		}

		const utterance = new SpeechSynthesisUtterance(GodotRuntime.parseString(p_text));
		utterance.rate = p_rate;
		utterance.pitch = p_pitch;
		utterance.volume = p_volume / 100.0;
		utterance.addEventListener('end', listener_end);
		utterance.addEventListener('start', listener_start);
		utterance.addEventListener('error', listener_error);
		utterance.addEventListener('boundary', listener_bound);
		utterance.id = p_utterance_id;
		utterance.cb = func;
		const voice = GodotRuntime.parseString(p_voice);
		const voices = window.speechSynthesis.getVoices();
		for (let i = 0; i < voices.length; i++) {
			if (voices[i].name === voice) {
				utterance.voice = voices[i];
				break;
			}
		}
		window.speechSynthesis.resume();
		window.speechSynthesis.speak(utterance);
	},

	/**
	 * Pauses speech synthesis.
	 */
	godot_js_tts_pause__proxy: 'sync',
	godot_js_tts_pause__sig: 'v',
	godot_js_tts_pause: function () {
		window.speechSynthesis.pause();
	},

	/**
	 * Resumes speech synthesis.
	 */
	godot_js_tts_resume__proxy: 'sync',
	godot_js_tts_resume__sig: 'v',
	godot_js_tts_resume: function () {
		window.speechSynthesis.resume();
	},

	/**
	 * Stops all speech synthesis and resumes the queue.
	 */
	godot_js_tts_stop__proxy: 'sync',
	godot_js_tts_stop__sig: 'v',
	godot_js_tts_stop: function () {
		window.speechSynthesis.cancel();
		window.speechSynthesis.resume();
	},

	/**
	 * Shows an alert dialog with the given message.
	 * @param {number} p_text - Pointer to the message text.
	 */
	godot_js_display_alert__proxy: 'sync',
	godot_js_display_alert__sig: 'vi',
	godot_js_display_alert: function (p_text) {
		window.alert(GodotRuntime.parseString(p_text)); // eslint-disable-line no-alert
	},

	/**
	 * Gets the screen DPI.
	 * @returns {number} The screen DPI value.
	 */
	godot_js_display_screen_dpi_get__proxy: 'sync',
	godot_js_display_screen_dpi_get__sig: 'i',
	godot_js_display_screen_dpi_get: function () {
		return GodotDisplay.getDPI();
	},

	/**
	 * Gets the device pixel ratio.
	 * @returns {number} The pixel ratio.
	 */
	godot_js_display_pixel_ratio_get__proxy: 'sync',
	godot_js_display_pixel_ratio_get__sig: 'f',
	godot_js_display_pixel_ratio_get: function () {
		return GodotDisplayScreen.getPixelRatio();
	},

	/**
	 * Requests fullscreen mode for the canvas.
	 * @returns {number} 0 on success, 1 on failure.
	 */
	godot_js_display_fullscreen_request__proxy: 'sync',
	godot_js_display_fullscreen_request__sig: 'i',
	godot_js_display_fullscreen_request: function () {
		return GodotDisplayScreen.requestFullscreen();
	},

	/**
	 * Exits fullscreen mode.
	 * @returns {number} 0 on success, 1 on failure.
	 */
	godot_js_display_fullscreen_exit__proxy: 'sync',
	godot_js_display_fullscreen_exit__sig: 'i',
	godot_js_display_fullscreen_exit: function () {
		return GodotDisplayScreen.exitFullscreen();
	},

	/**
	 * Sets the desired canvas size and triggers an update.
	 * @param {number} width - Desired width in pixels.
	 * @param {number} height - Desired height in pixels.
	 */
	godot_js_display_desired_size_set__proxy: 'sync',
	godot_js_display_desired_size_set__sig: 'vii',
	godot_js_display_desired_size_set: function (width, height) {
		GodotDisplayScreen.desired_size = [width, height];
		GodotDisplayScreen.updateSize();
	},

	/**
	 * Updates the display size and returns whether it changed.
	 * @returns {number} 1 if size was updated, 0 otherwise.
	 */
	godot_js_display_size_update__proxy: 'sync',
	godot_js_display_size_update__sig: 'i',
	godot_js_display_size_update: function () {
		const updated = GodotDisplayScreen.updateSize();
		if (updated) {
			GodotDisplayVK.updateSize();
		}
		return updated;
	},

	/**
	 * Gets the screen size in pixels.
	 * @param {number} width - Pointer to store width.
	 * @param {number} height - Pointer to store height.
	 */
	godot_js_display_screen_size_get__proxy: 'sync',
	godot_js_display_screen_size_get__sig: 'vii',
	godot_js_display_screen_size_get: function (width, height) {
		const scale = GodotDisplayScreen.getPixelRatio();
		GodotRuntime.setHeapValue(width, window.screen.width * scale, 'i32');
		GodotRuntime.setHeapValue(height, window.screen.height * scale, 'i32');
	},

	/**
	 * Gets the current canvas window size.
	 * @param {number} p_width - Pointer to store width.
	 * @param {number} p_height - Pointer to store height.
	 */
	godot_js_display_window_size_get__proxy: 'sync',
	godot_js_display_window_size_get__sig: 'vii',
	godot_js_display_window_size_get: function (p_width, p_height) {
		GodotRuntime.setHeapValue(p_width, GodotConfig.canvas.width, 'i32');
		GodotRuntime.setHeapValue(p_height, GodotConfig.canvas.height, 'i32');
	},

	/**
	 * Checks if WebGL is available for the specified version.
	 * @param {number} p_version - WebGL version (1 or 2).
	 * @returns {boolean} True if WebGL is available.
	 */
	godot_js_display_has_webgl__proxy: 'sync',
	godot_js_display_has_webgl__sig: 'ii',
	godot_js_display_has_webgl: function (p_version) {
		if (p_version !== 1 && p_version !== 2) {
			return false;
		}
		try {
			return !!document.createElement('canvas').getContext(p_version === 2 ? 'webgl2' : 'webgl');
		} catch (e) { /* Not available */ }
		return false;
	},

	/*
	 * Canvas
	 */
	/**
	 * Focuses the canvas element.
	 */
	godot_js_display_canvas_focus__proxy: 'sync',
	godot_js_display_canvas_focus__sig: 'v',
	godot_js_display_canvas_focus: function () {
		GodotConfig.canvas.focus();
	},

	/**
	 * Checks if the canvas element is currently focused.
	 * @returns {number} 1 if focused, 0 otherwise.
	 */
	godot_js_display_canvas_is_focused__proxy: 'sync',
	godot_js_display_canvas_is_focused__sig: 'i',
	godot_js_display_canvas_is_focused: function () {
		return document.activeElement === GodotConfig.canvas;
	},

	/*
	 * Touchscreen
	 */
	/**
	 * Checks if touch input is available.
	 * @returns {number} 1 if touch is available, 0 otherwise.
	 */
	godot_js_display_touchscreen_is_available__proxy: 'sync',
	godot_js_display_touchscreen_is_available__sig: 'i',
	godot_js_display_touchscreen_is_available: function () {
		return 'ontouchstart' in window;
	},

	/*
	 * Clipboard
	 */
	/**
	 * Sets the clipboard content to the given text.
	 * @param {number} p_text - Pointer to the text to copy.
	 * @returns {number} 0 on success, 1 if clipboard API not available.
	 */
	godot_js_display_clipboard_set__proxy: 'sync',
	godot_js_display_clipboard_set__sig: 'ii',
	godot_js_display_clipboard_set: function (p_text) {
		const text = GodotRuntime.parseString(p_text);
		if (!navigator.clipboard || !navigator.clipboard.writeText) {
			return 1;
		}
		navigator.clipboard.writeText(text).catch(function (e) {
			// Setting OS clipboard is only possible from an input callback.
			GodotRuntime.error('Setting OS clipboard is only possible from an input callback for the Web platform. Exception:', e);
		});
		return 0;
	},

	/**
	 * Gets the clipboard text content asynchronously.
	 * @param {number} callback - Callback function pointer to receive the text.
	 */
	godot_js_display_clipboard_get__proxy: 'sync',
	godot_js_display_clipboard_get__sig: 'ii',
	godot_js_display_clipboard_get: function (callback) {
		const func = GodotRuntime.get_func(callback);
		try {
			navigator.clipboard.readText().then(function (result) {
				const ptr = GodotRuntime.allocString(result);
				func(ptr);
				GodotRuntime.free(ptr);
			}).catch(function (e) {
				// Fail graciously.
			});
		} catch (e) {
			// Fail graciously.
		}
	},

	/*
	 * Window
	 */
	/**
	 * Sets the window title.
	 * @param {number} p_data - Pointer to the title string.
	 */
	godot_js_display_window_title_set__proxy: 'sync',
	godot_js_display_window_title_set__sig: 'vi',
	godot_js_display_window_title_set: function (p_data) {
		document.title = GodotRuntime.parseString(p_data);
	},

	/**
	 * Sets the window icon from a PNG buffer.
	 * @param {number} p_ptr - Pointer to the PNG data in the heap.
	 * @param {number} p_len - Length of the PNG data.
	 */
	godot_js_display_window_icon_set__proxy: 'sync',
	godot_js_display_window_icon_set__sig: 'vii',
	godot_js_display_window_icon_set: function (p_ptr, p_len) {
		let link = document.getElementById('-gd-engine-icon');
		const old_icon = GodotDisplay.window_icon;
		if (p_ptr) {
			if (link === null) {
				link = document.createElement('link');
				link.rel = 'icon';
				link.id = '-gd-engine-icon';
				document.head.appendChild(link);
			}
			const png = new Blob([GodotRuntime.heapSlice(HEAPU8, p_ptr, p_len)], { type: 'image/png' });
			GodotDisplay.window_icon = URL.createObjectURL(png);
			link.href = GodotDisplay.window_icon;
		} else {
			if (link) {
				link.remove();
			}
			GodotDisplay.window_icon = null;
		}
		if (old_icon) {
			URL.revokeObjectURL(old_icon);
		}
	},

	/*
	 * Cursor
	 */
	/**
	 * Sets the cursor visibility.
	 * @param {number} p_visible - Non-zero to show cursor, 0 to hide.
	 */
	godot_js_display_cursor_set_visible__proxy: 'sync',
	godot_js_display_cursor_set_visible__sig: 'vi',
	godot_js_display_cursor_set_visible: function (p_visible) {
		const visible = p_visible !== 0;
		if (visible === GodotDisplayCursor.visible) {
			return;
		}
		GodotDisplayCursor.visible = visible;
		if (visible) {
			GodotDisplayCursor.set_shape(GodotDisplayCursor.shape);
		} else {
			GodotDisplayCursor.set_style('none');
		}
	},

	/**
	 * Checks if the cursor is hidden.
	 * @returns {number} 1 if hidden, 0 if visible.
	 */
	godot_js_display_cursor_is_hidden__proxy: 'sync',
	godot_js_display_cursor_is_hidden__sig: 'i',
	godot_js_display_cursor_is_hidden: function () {
		return !GodotDisplayCursor.visible;
	},

	/**
	 * Sets the cursor shape.
	 * @param {number} p_string - Pointer to the cursor shape name.
	 */
	godot_js_display_cursor_set_shape__proxy: 'sync',
	godot_js_display_cursor_set_shape__sig: 'vi',
	godot_js_display_cursor_set_shape: function (p_string) {
		GodotDisplayCursor.set_shape(GodotRuntime.parseString(p_string));
	},

	/**
	 * Sets a custom cursor shape from a PNG buffer.
	 * @param {number} p_shape - Pointer to the shape name.
	 * @param {number} p_ptr - Pointer to the PNG data in the heap.
	 * @param {number} p_len - Length of the PNG data.
	 * @param {number} p_hotspot_x - X coordinate of the cursor hotspot.
	 * @param {number} p_hotspot_y - Y coordinate of the cursor hotspot.
	 */
	godot_js_display_cursor_set_custom_shape__proxy: 'sync',
	godot_js_display_cursor_set_custom_shape__sig: 'viiiii',
	godot_js_display_cursor_set_custom_shape: function (p_shape, p_ptr, p_len, p_hotspot_x, p_hotspot_y) {
		const shape = GodotRuntime.parseString(p_shape);
		const old_shape = GodotDisplayCursor.cursors[shape];
		if (p_len > 0) {
			const png = new Blob([GodotRuntime.heapSlice(HEAPU8, p_ptr, p_len)], { type: 'image/png' });
			const url = URL.createObjectURL(png);
			GodotDisplayCursor.cursors[shape] = {
				url: url,
				x: p_hotspot_x,
				y: p_hotspot_y,
			};
		} else {
			delete GodotDisplayCursor.cursors[shape];
		}
		if (shape === GodotDisplayCursor.shape) {
			GodotDisplayCursor.set_shape(GodotDisplayCursor.shape);
		}
		if (old_shape) {
			URL.revokeObjectURL(old_shape.url);
		}
	},

	/**
	 * Sets the pointer lock state.
	 * @param {number} p_lock - Non-zero to lock pointer, 0 to release.
	 */
	godot_js_display_cursor_lock_set__proxy: 'sync',
	godot_js_display_cursor_lock_set__sig: 'vi',
	godot_js_display_cursor_lock_set: function (p_lock) {
		if (p_lock) {
			GodotDisplayCursor.lockPointer();
		} else {
			GodotDisplayCursor.releasePointer();
		}
	},

	/**
	 * Checks if the pointer is locked.
	 * @returns {number} 1 if pointer is locked, 0 otherwise.
	 */
	godot_js_display_cursor_is_locked__proxy: 'sync',
	godot_js_display_cursor_is_locked__sig: 'i',
	godot_js_display_cursor_is_locked: function () {
		return GodotDisplayCursor.isPointerLocked() ? 1 : 0;
	},

	/*
	 * Listeners
	 */
	/**
	 * Registers a callback for fullscreen change events.
	 * @param {number} callback - Callback function pointer.
	 */
	godot_js_display_fullscreen_cb__proxy: 'sync',
	godot_js_display_fullscreen_cb__sig: 'vi',
	godot_js_display_fullscreen_cb: function (callback) {
		const canvas = GodotConfig.canvas;
		const func = GodotRuntime.get_func(callback);
		function change_cb(evt) {
			if (evt.target === canvas) {
				func(GodotDisplayScreen.isFullscreen());
			}
		}
		GodotEventListeners.add(document, 'fullscreenchange', change_cb, false);
		GodotEventListeners.add(document, 'mozfullscreenchange', change_cb, false);
		GodotEventListeners.add(document, 'webkitfullscreenchange', change_cb, false);
	},

	/**
	 * Registers a callback for window blur events.
	 * @param {number} callback - Callback function pointer.
	 */
	godot_js_display_window_blur_cb__proxy: 'sync',
	godot_js_display_window_blur_cb__sig: 'vi',
	godot_js_display_window_blur_cb: function (callback) {
		const func = GodotRuntime.get_func(callback);
		GodotEventListeners.add(window, 'blur', function () {
			func();
		}, false);
	},

	/**
	 * Registers callbacks for canvas notification events (mouse enter/leave, focus/blur).
	 * @param {number} callback - Callback function pointer.
	 * @param {number} p_enter - Enter event index.
	 * @param {number} p_exit - Exit event index.
	 * @param {number} p_in - Focus event index.
	 * @param {number} p_out - Blur event index.
	 */
	godot_js_display_notification_cb__proxy: 'sync',
	godot_js_display_notification_cb__sig: 'viiiii',
	godot_js_display_notification_cb: function (callback, p_enter, p_exit, p_in, p_out) {
		const canvas = GodotConfig.canvas;
		const func = GodotRuntime.get_func(callback);
		const notif = [p_enter, p_exit, p_in, p_out];
		['mouseover', 'mouseleave', 'focus', 'blur'].forEach(function (evt_name, idx) {
			GodotEventListeners.add(canvas, evt_name, function () {
				func(notif[idx]);
			}, true);
		});
	},

	/**
	 * Sets up the canvas for display with event handlers and initial sizing.
	 * @param {number} p_width - Initial width.
	 * @param {number} p_height - Initial height.
	 * @param {number} p_fullscreen - Non-zero to start in fullscreen.
	 * @param {number} p_hidpi - Non-zero to enable HiDPI scaling.
	 */
	godot_js_display_setup_canvas__proxy: 'sync',
	godot_js_display_setup_canvas__sig: 'viiii',
	godot_js_display_setup_canvas: function (p_width, p_height, p_fullscreen, p_hidpi) {
		const canvas = GodotConfig.canvas;
		GodotEventListeners.add(canvas, 'contextmenu', function (ev) {
			ev.preventDefault();
		}, false);
		GodotEventListeners.add(canvas, 'webglcontextlost', function (ev) {
			alert('WebGL context lost, please reload the page'); // eslint-disable-line no-alert
			ev.preventDefault();
		}, false);
		GodotDisplayScreen.hidpi = !!p_hidpi;
		switch (GodotConfig.canvas_resize_policy) {
		case 0: // None
			GodotDisplayScreen.desired_size = [canvas.width, canvas.height];
			break;
		case 1: // Project
			GodotDisplayScreen.desired_size = [p_width, p_height];
			break;
		default: // Full window
			// Ensure we display in the right place, the size will be handled by updateSize
			canvas.style.position = 'absolute';
			canvas.style.top = 0;
			canvas.style.left = 0;
			break;
		}
		GodotDisplayScreen.updateSize();
		if (p_fullscreen) {
			GodotDisplayScreen.requestFullscreen();
		}
	},

	/*
	 * Virtual Keyboard
	 */
	/**
	 * Shows the virtual keyboard with the given text and configuration.
	 * @param {number} p_text - Pointer to the text to edit.
	 * @param {number} p_type - Keyboard type (0-7).
	 * @param {number} p_start - Selection start position.
	 * @param {number} p_end - Selection end position.
	 */
	godot_js_display_vk_show__proxy: 'sync',
	godot_js_display_vk_show__sig: 'viiii',
	godot_js_display_vk_show: function (p_text, p_type, p_start, p_end) {
		const text = GodotRuntime.parseString(p_text);
		const start = p_start > 0 ? p_start : 0;
		const end = p_end > 0 ? p_end : start;
		GodotDisplayVK.show(text, p_type, start, end);
	},

	/**
	 * Hides the virtual keyboard.
	 */
	godot_js_display_vk_hide__proxy: 'sync',
	godot_js_display_vk_hide__sig: 'v',
	godot_js_display_vk_hide: function () {
		GodotDisplayVK.hide();
	},

	/**
	 * Checks if the virtual keyboard is available.
	 * @returns {number} 1 if available, 0 otherwise.
	 */
	godot_js_display_vk_available__proxy: 'sync',
	godot_js_display_vk_available__sig: 'i',
	godot_js_display_vk_available: function () {
		return GodotDisplayVK.available();
	},

	/**
	 * Checks if text-to-speech is available.
	 * @returns {number} 1 if speechSynthesis is available, 0 otherwise.
	 */
	godot_js_display_tts_available__proxy: 'sync',
	godot_js_display_tts_available__sig: 'i',
	godot_js_display_tts_available: function () {
		return 'speechSynthesis' in window;
	},

	/**
	 * Registers the virtual keyboard input callback.
	 * @param {number} p_input_cb - Callback function pointer for text input events.
	 */
	godot_js_display_vk_cb__proxy: 'sync',
	godot_js_display_vk_cb__sig: 'vi',
	godot_js_display_vk_cb: function (p_input_cb) {
		const input_cb = GodotRuntime.get_func(p_input_cb);
		if (GodotDisplayVK.available()) {
			GodotDisplayVK.init(input_cb);
		}
	},
};

autoAddDeps(GodotDisplay, '$GodotDisplay');
mergeInto(LibraryManager.library, GodotDisplay);
