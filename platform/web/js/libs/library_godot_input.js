/**************************************************************************/
/*  library_godot_input.js                                                */
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
 * IME (Input Method Editor) API helper for the Godot Web platform.
 * Manages composition events for internationalized text input.
 * @module GodotIME
 */
const GodotIME = {
	$GodotIME__deps: ['$GodotRuntime', '$GodotEventListeners'],
	$GodotIME__postset: 'GodotOS.atexit(function(resolve, reject) { GodotIME.clear(); resolve(); });',
	$GodotIME: {
		ime: null,
		active: false,
		focusTimerIntervalId: -1,

		/**
		 * Computes the modifier key flags from a keyboard event.
		 * @param {KeyboardEvent} evt - The keyboard event.
		 * @returns {number} Bitmask of modifier keys (Shift, Alt, Ctrl, Meta).
		 */
		getModifiers: function (evt) {
			return (evt.shiftKey + 0) + ((evt.altKey + 0) << 1) + ((evt.ctrlKey + 0) << 2) + ((evt.metaKey + 0) << 3);
		},

		/**
		 * Activates or deactivates the IME input element.
		 * @param {boolean} active - Whether to show the IME element.
		 */
		ime_active: function (active) {
			function clearFocusTimerInterval() {
				clearInterval(GodotIME.focusTimerIntervalId);
				GodotIME.focusTimerIntervalId = -1;
			}

			function focusTimer() {
				if (GodotIME.ime == null) {
					clearFocusTimerInterval();
					return;
				}
				GodotIME.ime.focus();
			}

			if (GodotIME.focusTimerIntervalId > -1) {
				clearFocusTimerInterval();
			}

			if (GodotIME.ime == null) {
				return;
			}

			GodotIME.active = active;
			if (active) {
				GodotIME.ime.style.display = 'block';
				GodotIME.focusTimerIntervalId = setInterval(focusTimer, 100);
			} else {
				GodotIME.ime.style.display = 'none';
				GodotConfig.canvas.focus();
			}
		},

		/**
		 * Positions the IME input element at the specified coordinates.
		 * @param {number} x - X coordinate in canvas space.
		 * @param {number} y - Y coordinate in canvas space.
		 */
		ime_position: function (x, y) {
			if (GodotIME.ime == null) {
				return;
			}
			const canvas = GodotConfig.canvas;
			const rect = canvas.getBoundingClientRect();
			const rw = canvas.width / rect.width;
			const rh = canvas.height / rect.height;
			const clx = (x / rw) + rect.x;
			const cly = (y / rh) + rect.y;

			GodotIME.ime.style.left = `${clx}px`;
			GodotIME.ime.style.top = `${cly}px`;
		},

		/**
		 * Initializes the IME input element and event handlers.
		 * @param {number} ime_cb - Callback function pointer for IME composition events.
		 * @param {number} key_cb - Callback function pointer for key events.
		 * @param {number} code - Buffer pointer for key code.
		 * @param {number} key - Buffer pointer for key value.
		 */
		init: function (ime_cb, key_cb, code, key) {
			function key_event_cb(pressed, evt) {
				const modifiers = GodotIME.getModifiers(evt);
				GodotRuntime.stringToHeap(evt.code, code, 32);
				GodotRuntime.stringToHeap(evt.key, key, 32);
				key_cb(pressed, evt.repeat, modifiers);
				evt.preventDefault();
			}
			function ime_event_cb(event) {
				if (GodotIME.ime == null) {
					return;
				}
				switch (event.type) {
				case 'compositionstart':
					ime_cb(0, null);
					GodotIME.ime.textContent = '';
					break;
				case 'compositionupdate': {
					const ptr = GodotRuntime.allocString(event.data);
					ime_cb(1, ptr);
					GodotRuntime.free(ptr);
				} break;
				case 'compositionend': {
					const ptr = GodotRuntime.allocString(event.data);
					ime_cb(2, ptr);
					GodotRuntime.free(ptr);
					GodotIME.ime.textContent = '';
				} break;
				default:
					// Do nothing.
				}
			}

			const ime = document.createElement('div');
			ime.className = 'ime';
			ime.style.background = 'none';
			ime.style.opacity = 0.0;
			ime.style.position = 'fixed';
			ime.style.textAlign = 'left';
			ime.style.fontSize = '1px';
			ime.style.left = '0px';
			ime.style.top = '0px';
			ime.style.width = '100%';
			ime.style.height = '40px';
			ime.style.pointerEvents = 'none';
			ime.style.display = 'none';
			ime.contentEditable = 'true';

			GodotEventListeners.add(ime, 'compositionstart', ime_event_cb, false);
			GodotEventListeners.add(ime, 'compositionupdate', ime_event_cb, false);
			GodotEventListeners.add(ime, 'compositionend', ime_event_cb, false);
			GodotEventListeners.add(ime, 'keydown', key_event_cb.bind(null, 1), false);
			GodotEventListeners.add(ime, 'keyup', key_event_cb.bind(null, 0), false);

			ime.onblur = function () {
				this.style.display = 'none';
				GodotConfig.canvas.focus();
				GodotIME.active = false;
			};

			GodotConfig.canvas.parentElement.appendChild(ime);
			GodotIME.ime = ime;
		},

		/**
		 * Removes the IME input element from the DOM.
		 */
		clear: function () {
			if (GodotIME.ime == null) {
				return;
			}
			if (GodotIME.focusTimerIntervalId > -1) {
				clearInterval(GodotIME.focusTimerIntervalId);
				GodotIME.focusTimerIntervalId = -1;
			}
			GodotIME.ime.remove();
			GodotIME.ime = null;
		},
	},
};
mergeInto(LibraryManager.library, GodotIME);

/*
 * Gamepad API helper.
 */
/**
 * Gamepad input handling for the Godot Web platform.
 * Interfaces with the W3C Gamepad API to provide controller input.
 * @module GodotInputGamepads
 */
const GodotInputGamepads = {
	$GodotInputGamepads__deps: ['$GodotRuntime', '$GodotEventListeners'],
	$GodotInputGamepads: {
		samples: [],

		/**
		 * Retrieves the array of connected gamepads from the browser.
		 * @returns {Array<Gamepad>} Array of gamepad objects.
		 */
		get_pads: function () {
			try {
				// Will throw in iframe when permission is denied.
				// Will throw/warn in the future for insecure contexts.
				// See https://github.com/w3c/gamepad/pull/120
				const pads = navigator.getGamepads();
				if (pads) {
					return pads;
				}
				return [];
			} catch (e) {
				return [];
			}
		},

		/**
		 * Returns the stored gamepad samples.
		 * @returns {Array<Object>} Array of gamepad sample objects.
		 */
		get_samples: function () {
			return GodotInputGamepads.samples;
		},

		/**
		 * Gets a specific gamepad sample by index.
		 * @param {number} index - Index of the sample to retrieve.
		 * @returns {Object|null} The gamepad sample at the index, or null if not found.
		 */
		get_sample: function (index) {
			const samples = GodotInputGamepads.samples;
			return index < samples.length ? samples[index] : null;
		},

		/**
		 * Samples all connected gamepads and stores the state.
		 */
		sample: function () {
			const pads = GodotInputGamepads.get_pads();
			const samples = [];
			for (let i = 0; i < pads.length; i++) {
				const pad = pads[i];
				if (!pad) {
					samples.push(null);
					continue;
				}
				const s = {
					standard: pad.mapping === 'standard',
					buttons: [],
					axes: [],
					connected: pad.connected,
				};
				for (let b = 0; b < pad.buttons.length; b++) {
					s.buttons.push(pad.buttons[b].value);
				}
				for (let a = 0; a < pad.axes.length; a++) {
					s.axes.push(pad.axes[a]);
				}
				samples.push(s);
			}
			GodotInputGamepads.samples = samples;
		},

		/**
		 * Initializes gamepad support and registers connection callbacks.
		 * @param {number} onchange - Callback function pointer for gamepad connect/disconnect events.
		 */
		init: function (onchange) {
			GodotInputGamepads.samples = [];
			function add(pad) {
				const guid = GodotInputGamepads.get_guid(pad);
				const c_id = GodotRuntime.allocString(pad.id);
				const c_guid = GodotRuntime.allocString(guid);
				onchange(pad.index, 1, c_id, c_guid);
				GodotRuntime.free(c_id);
				GodotRuntime.free(c_guid);
			}
			const pads = GodotInputGamepads.get_pads();
			for (let i = 0; i < pads.length; i++) {
				// Might be reserved space.
				if (pads[i]) {
					add(pads[i]);
				}
			}
			GodotEventListeners.add(window, 'gamepadconnected', function (evt) {
				if (evt.gamepad) {
					add(evt.gamepad);
				}
			}, false);
			GodotEventListeners.add(window, 'gamepaddisconnected', function (evt) {
				if (evt.gamepad) {
					onchange(evt.gamepad.index, 0);
				}
			}, false);
		},

		/**
		 * Generates a GUID string for a gamepad based on its vendor and product IDs.
		 * @param {Gamepad} pad - The gamepad object.
		 * @returns {string} The GUID string combining OS, vendor, and product.
		 */
		get_guid: function (pad) {
			if (pad.mapping) {
				return pad.mapping;
			}
			const ua = navigator.userAgent;
			let os = 'Unknown';
			if (ua.indexOf('Android') >= 0) {
				os = 'Android';
			} else if (ua.indexOf('Linux') >= 0) {
				os = 'Linux';
			} else if (ua.indexOf('iPhone') >= 0) {
				os = 'iOS';
			} else if (ua.indexOf('Macintosh') >= 0) {
				// Updated iPads will fall into this category.
				os = 'MacOSX';
			} else if (ua.indexOf('Windows') >= 0) {
				os = 'Windows';
			}

			const id = pad.id;
			// Chrom* style: NAME (Vendor: xxxx Product: xxxx).
			const exp1 = /vendor: ([0-9a-f]{4}) product: ([0-9a-f]{4})/i;
			// Firefox/Safari style (Safari may remove leading zeroes).
			const exp2 = /^([0-9a-f]+)-([0-9a-f]+)-/i;
			let vendor = '';
			let product = '';
			if (exp1.test(id)) {
				const match = exp1.exec(id);
				vendor = match[1].padStart(4, '0');
				product = match[2].padStart(4, '0');
			} else if (exp2.test(id)) {
				const match = exp2.exec(id);
				vendor = match[1].padStart(4, '0');
				product = match[2].padStart(4, '0');
			}
			if (!vendor || !product) {
				return `${os}Unknown`;
			}
			return os + vendor + product;
		},
	},
};
mergeInto(LibraryManager.library, GodotInputGamepads);

/*
 * Drag and drop helper.
 * This is pretty big, but basically detect dropped files on GodotConfig.canvas,
 * process them one by one (recursively for directories), and copies them to
 * the temporary FS path '/tmp/drop-[random]/' so it can be emitted as a godot
 * event (that requires a string array of paths).
 *
 * NOTE: The temporary files are removed after the callback. This means that
 * deferred callbacks won't be able to access the files.
 */
/**
 * File drag and drop handling for the Godot Web platform.
 * Processes dropped files and copies them to the virtual file system.
 * @module GodotInputDragDrop
 */
const GodotInputDragDrop = {
	$GodotInputDragDrop__deps: ['$FS', '$GodotFS'],
	$GodotInputDragDrop: {
		promises: [],
		pending_files: [],

		/**
		 * Adds a filesystem entry (file or directory) to be processed.
		 * @param {FileSystemFileEntry|FileSystemDirectoryEntry} entry - The filesystem entry.
		 */
		add_entry: function (entry) {
			if (entry.isDirectory) {
				GodotInputDragDrop.add_dir(entry);
			} else if (entry.isFile) {
				GodotInputDragDrop.add_file(entry);
			} else {
				GodotRuntime.error('Unrecognized entry...', entry);
			}
		},

		/**
		 * Processes a directory entry recursively.
		 * @param {FileSystemDirectoryEntry} entry - The directory entry.
		 */
		add_dir: function (entry) {
			GodotInputDragDrop.promises.push(new Promise(function (resolve, reject) {
				const reader = entry.createReader();
				reader.readEntries(function (entries) {
					for (let i = 0; i < entries.length; i++) {
						GodotInputDragDrop.add_entry(entries[i]);
					}
					resolve();
				});
			}));
		},

		/**
		 * Reads a file entry and adds it to the pending files queue.
		 * @param {FileSystemFileEntry} entry - The file entry.
		 */
		add_file: function (entry) {
			GodotInputDragDrop.promises.push(new Promise(function (resolve, reject) {
				entry.file(function (file) {
					const reader = new FileReader();
					reader.onload = function () {
						const f = {
							'path': file.relativePath || file.webkitRelativePath,
							'name': file.name,
							'type': file.type,
							'size': file.size,
							'data': reader.result,
						};
						if (!f['path']) {
							f['path'] = f['name'];
						}
						GodotInputDragDrop.pending_files.push(f);
						resolve();
					};
					reader.onerror = function () {
						GodotRuntime.print('Error reading file');
						reject();
					};
					reader.readAsArrayBuffer(file);
				}, function (err) {
					GodotRuntime.print('Error!');
					reject();
				});
			}));
		},

		/**
		 * Recursively processes all pending file promises.
		 * @param {Function} resolve - Promise resolve callback.
		 * @param {Function} reject - Promise reject callback.
		 */
		process: function (resolve, reject) {
			if (GodotInputDragDrop.promises.length === 0) {
				resolve();
				return;
			}
			GodotInputDragDrop.promises.pop().then(function () {
				setTimeout(function () {
					GodotInputDragDrop.process(resolve, reject);
				}, 0);
			});
		},

		/**
		 * Processes a drop event and prepares files for the callback.
		 * @param {DragEvent} ev - The drop event.
		 * @param {Function} callback - Callback to receive the list of dropped file paths.
		 * @private
		 */
		_process_event: function (ev, callback) {
			ev.preventDefault();
			if (ev.dataTransfer.items) {
				// Use DataTransferItemList interface to access the file(s)
				for (let i = 0; i < ev.dataTransfer.items.length; i++) {
					const item = ev.dataTransfer.items[i];
					let entry = null;
					if ('getAsEntry' in item) {
						entry = item.getAsEntry();
					} else if ('webkitGetAsEntry' in item) {
						entry = item.webkitGetAsEntry();
					}
					if (entry) {
						GodotInputDragDrop.add_entry(entry);
					}
				}
			} else {
				GodotRuntime.error('File upload not supported');
			}
			new Promise(GodotInputDragDrop.process).then(function () {
				const DROP = `/tmp/drop-${parseInt(Math.random() * (1 << 30), 10)}/`;
				const drops = [];
				const files = [];
				FS.mkdir(DROP.slice(0, -1)); // Without trailing slash
				GodotInputDragDrop.pending_files.forEach((elem) => {
					const path = elem['path'];
					GodotFS.copy_to_fs(DROP + path, elem['data']);
					let idx = path.indexOf('/');
					if (idx === -1) {
						// Root file
						drops.push(DROP + path);
					} else {
						// Subdir
						const sub = path.substr(0, idx);
						idx = sub.indexOf('/');
						if (idx < 0 && drops.indexOf(DROP + sub) === -1) {
							drops.push(DROP + sub);
						}
					}
					files.push(DROP + path);
				});
				GodotInputDragDrop.promises = [];
				GodotInputDragDrop.pending_files = [];
				callback(drops);
				if (GodotConfig.persistent_drops) {
					// Delay removal at exit.
					GodotOS.atexit(function (resolve, reject) {
						GodotInputDragDrop.remove_drop(files, DROP);
						resolve();
					});
				} else {
					GodotInputDragDrop.remove_drop(files, DROP);
				}
			});
		},

		/**
		 * Removes dropped files and directories from the virtual file system.
		 * @param {Array<string>} files - Array of file paths to remove.
		 * @param {string} drop_path - The base drop directory path.
		 */
		remove_drop: function (files, drop_path) {
			const dirs = [drop_path.substr(0, drop_path.length - 1)];
			// Remove temporary files
			files.forEach(function (file) {
				FS.unlink(file);
				let dir = file.replace(drop_path, '');
				let idx = dir.lastIndexOf('/');
				while (idx > 0) {
					dir = dir.substr(0, idx);
					if (dirs.indexOf(drop_path + dir) === -1) {
						dirs.push(drop_path + dir);
					}
					idx = dir.lastIndexOf('/');
				}
			});
			// Remove dirs.
			dirs.sort(function (a, b) {
				const al = (a.match(/\//g) || []).length;
				const bl = (b.match(/\//g) || []).length;
				if (al > bl) {
					return -1;
				} else if (al < bl) {
					return 1;
				}
				return 0;
			}).forEach(function (dir) {
				FS.rmdir(dir);
			});
		},

		/**
		 * Creates a drop event handler function.
		 * @param {Function} callback - Callback to receive the dropped file paths.
		 * @returns {Function} The drop event handler function.
		 */
		handler: function (callback) {
			return function (ev) {
				GodotInputDragDrop._process_event(ev, callback);
			};
		},
	},
};
mergeInto(LibraryManager.library, GodotInputDragDrop);

/*
 * Godot exposed input functions.
 */
/**
 * Input handling for the Godot Web platform.
 * Provides mouse, touch, keyboard, gamepad, IME, and drag/drop input support.
 * @module GodotInput
 */
const GodotInput = {
	$GodotInput__deps: ['$GodotRuntime', '$GodotConfig', '$GodotEventListeners', '$GodotInputGamepads', '$GodotInputDragDrop', '$GodotIME'],
	$GodotInput: {
		inputKeyCallback: null,
		setInputKeyData: null,

		/**
		 * Computes the modifier key flags from a keyboard event.
		 * @param {KeyboardEvent|MouseEvent} evt - The input event.
		 * @returns {number} Bitmask of modifier keys (Shift, Alt, Ctrl, Meta).
		 */
		getModifiers: function (evt) {
			return (evt.shiftKey + 0) + ((evt.altKey + 0) << 1) + ((evt.ctrlKey + 0) << 2) + ((evt.metaKey + 0) << 3);
		},

		/**
		 * Computes the position of an event in canvas coordinates.
		 * @param {MouseEvent|TouchEvent} evt - The mouse or touch event.
		 * @param {DOMRect} rect - The canvas bounding rectangle.
		 * @returns {Array<number>} [x, y] coordinates in canvas space.
		 */
		computePosition: function (evt, rect) {
			const canvas = GodotConfig.canvas;
			const rw = canvas.width / rect.width;
			const rh = canvas.height / rect.height;
			const x = (evt.clientX - rect.x) * rw;
			const y = (evt.clientY - rect.y) * rh;
			return [x, y];
		},

		/**
		 * Processes a keyboard event and forwards it to the registered callback.
		 * @param {boolean} pIsPressed - Whether the key is pressed (true) or released (false).
		 * @param {KeyboardEvent} pEvent - The keyboard event.
		 */
		onKeyEvent: function (pIsPressed, pEvent) {
			if (GodotInput.inputKeyCallback == null) {
				throw new TypeError('GodotInput.onKeyEvent(): GodotInput.inputKeyCallback is null, cannot process key event.');
			}
			if (GodotInput.setInputKeyData == null) {
				throw new TypeError('GodotInput.onKeyEvent(): GodotInput.setInputKeyData is null, cannot process key event.');
			}

			const modifiers = GodotInput.getModifiers(pEvent);
			GodotInput.setInputKeyData(pEvent.code, pEvent.key);
			GodotInput.inputKeyCallback(pIsPressed ? 1 : 0, pEvent.repeat, modifiers);
			pEvent.preventDefault();
		},
	},

	/*
	 * Mouse API
	 */
	/**
	 * Registers a callback for mouse move events.
	 * @param {number} callback - Callback function pointer.
	 */
	godot_js_input_mouse_move_cb__proxy: 'sync',
	godot_js_input_mouse_move_cb__sig: 'vi',
	godot_js_input_mouse_move_cb: function (callback) {
		const func = GodotRuntime.get_func(callback);
		const canvas = GodotConfig.canvas;
		let last_x = null;
		let last_y = null;
		function move_cb(evt) {
			const rect = canvas.getBoundingClientRect();
			const pos = GodotInput.computePosition(evt, rect);
			// Firefox fires pointermove with zero movement and an unchanged
			// position while the mouse is stationary (GH #51810); skip those
			// so relative-motion checks (e.g. `relative == Vector2.ZERO`) hold.
			if (evt.movementX === 0 && evt.movementY === 0 && pos[0] === last_x && pos[1] === last_y) {
				return;
			}
			last_x = pos[0];
			last_y = pos[1];
			// Scale movement
			const rw = canvas.width / rect.width;
			const rh = canvas.height / rect.height;
			const rel_pos_x = evt.movementX * rw;
			const rel_pos_y = evt.movementY * rh;
			const modifiers = GodotInput.getModifiers(evt);
			func(pos[0], pos[1], rel_pos_x, rel_pos_y, modifiers, evt.pressure);
		}
		GodotEventListeners.add(window, 'pointermove', move_cb, false);
	},

	/**
	 * Registers a callback for mouse wheel events.
	 * @param {number} callback - Callback function pointer.
	 */
	godot_js_input_mouse_wheel_cb__proxy: 'sync',
	godot_js_input_mouse_wheel_cb__sig: 'vi',
	godot_js_input_mouse_wheel_cb: function (callback) {
		const func = GodotRuntime.get_func(callback);
		function wheel_cb(evt) {
			if (func(evt.deltaMode, evt.deltaX ?? 0, evt.deltaY ?? 0)) {
				evt.preventDefault();
			}
		}
		GodotEventListeners.add(GodotConfig.canvas, 'wheel', wheel_cb, false);
	},

	/**
	 * Registers callbacks for mouse button events.
	 * @param {number} callback - Callback function pointer.
	 */
	godot_js_input_mouse_button_cb__proxy: 'sync',
	godot_js_input_mouse_button_cb__sig: 'vi',
	godot_js_input_mouse_button_cb: function (callback) {
		const func = GodotRuntime.get_func(callback);
		const canvas = GodotConfig.canvas;
		function button_cb(p_pressed, evt) {
			const rect = canvas.getBoundingClientRect();
			const pos = GodotInput.computePosition(evt, rect);
			const modifiers = GodotInput.getModifiers(evt);
			// Since the event is consumed, focus manually.
			// NOTE: The iframe container may not have focus yet, so focus even when already active.
			if (p_pressed) {
				GodotConfig.canvas.focus();
			}
			if (func(p_pressed, evt.button, pos[0], pos[1], modifiers)) {
				evt.preventDefault();
			}
		}
		GodotEventListeners.add(canvas, 'mousedown', button_cb.bind(null, 1), false);
		GodotEventListeners.add(window, 'mouseup', button_cb.bind(null, 0), false);
	},

	/*
	 * Touch API
	 */
	/**
	 * Registers callbacks for touch events.
	 * @param {number} callback - Callback function pointer.
	 * @param {number} ids - Pointer to store touch identifiers.
	 * @param {number} coords - Pointer to store touch coordinates.
	 */
	godot_js_input_touch_cb__proxy: 'sync',
	godot_js_input_touch_cb__sig: 'viii',
	godot_js_input_touch_cb: function (callback, ids, coords) {
		const func = GodotRuntime.get_func(callback);
		const canvas = GodotConfig.canvas;
		function touch_cb(type, evt) {
			// Since the event is consumed, focus manually.
			// NOTE: The iframe container may not have focus yet, so focus even when already active.
			if (type === 0) {
				GodotConfig.canvas.focus();
			}
			const rect = canvas.getBoundingClientRect();
			const touches = evt.changedTouches;
			for (let i = 0; i < touches.length; i++) {
				const touch = touches[i];
				const pos = GodotInput.computePosition(touch, rect);
				GodotRuntime.setHeapValue(coords + (i * 2) * 8, pos[0], 'double');
				GodotRuntime.setHeapValue(coords + (i * 2 + 1) * 8, pos[1], 'double');
				GodotRuntime.setHeapValue(ids + i * 4, touch.identifier, 'i32');
			}
			func(type, touches.length);
			if (evt.cancelable) {
				evt.preventDefault();
			}
		}
		GodotEventListeners.add(canvas, 'touchstart', touch_cb.bind(null, 0), false);
		GodotEventListeners.add(canvas, 'touchend', touch_cb.bind(null, 1), false);
		GodotEventListeners.add(canvas, 'touchcancel', touch_cb.bind(null, 1), false);
		GodotEventListeners.add(canvas, 'touchmove', touch_cb.bind(null, 2), false);
	},

	/*
	 * Key API
	 */
	/**
	 * Registers callbacks for keyboard events.
	 * @param {number} pCallback - Callback function pointer for key events.
	 * @param {number} pCodePtr - Buffer pointer for key code.
	 * @param {number} pKeyPtr - Buffer pointer for key value.
	 */
	godot_js_input_key_cb__proxy: 'sync',
	godot_js_input_key_cb__sig: 'viii',
	godot_js_input_key_cb: function (pCallback, pCodePtr, pKeyPtr) {
		GodotInput.inputKeyCallback = GodotRuntime.get_func(pCallback);
		GodotInput.setInputKeyData = (pCode, pKey) => {
			GodotRuntime.stringToHeap(pCode, pCodePtr, 32);
			GodotRuntime.stringToHeap(pKey, pKeyPtr, 32);
		};
		GodotEventListeners.add(GodotConfig.canvas, 'keydown', GodotInput.onKeyEvent.bind(null, true), false);
		GodotEventListeners.add(GodotConfig.canvas, 'keyup', GodotInput.onKeyEvent.bind(null, false), false);
	},

	/*
	 * IME API
	 */
	/**
	 * Sets the IME active state.
	 * @param {number} p_active - Non-zero to activate IME, 0 to deactivate.
	 */
	godot_js_set_ime_active__proxy: 'sync',
	godot_js_set_ime_active__sig: 'vi',
	godot_js_set_ime_active: function (p_active) {
		GodotIME.ime_active(p_active);
	},

	/**
	 * Sets the IME position.
	 * @param {number} p_x - X coordinate in canvas space.
	 * @param {number} p_y - Y coordinate in canvas space.
	 */
	godot_js_set_ime_position__proxy: 'sync',
	godot_js_set_ime_position__sig: 'vii',
	godot_js_set_ime_position: function (p_x, p_y) {
		GodotIME.ime_position(p_x, p_y);
	},

	/**
	 * Registers IME event callbacks.
	 * @param {number} p_ime_cb - Callback function pointer for IME events.
	 * @param {number} p_key_cb - Callback function pointer for key events.
	 * @param {number} code - Buffer pointer for key code.
	 * @param {number} key - Buffer pointer for key value.
	 */
	godot_js_set_ime_cb__proxy: 'sync',
	godot_js_set_ime_cb__sig: 'viiii',
	godot_js_set_ime_cb: function (p_ime_cb, p_key_cb, code, key) {
		const ime_cb = GodotRuntime.get_func(p_ime_cb);
		const key_cb = GodotRuntime.get_func(p_key_cb);
		GodotIME.init(ime_cb, key_cb, code, key);
	},

	/**
	 * Checks if the IME element is currently focused.
	 * @returns {number} 1 if IME is focused, 0 otherwise.
	 */
	godot_js_is_ime_focused__proxy: 'sync',
	godot_js_is_ime_focused__sig: 'i',
	godot_js_is_ime_focused: function () {
		return GodotIME.active;
	},

	/*
	 * Gamepad API
	 */
	/**
	 * Registers a callback for gamepad connect/disconnect events.
	 * @param {number} change_cb - Callback function pointer.
	 */
	godot_js_input_gamepad_cb__proxy: 'sync',
	godot_js_input_gamepad_cb__sig: 'vi',
	godot_js_input_gamepad_cb: function (change_cb) {
		const onchange = GodotRuntime.get_func(change_cb);
		GodotInputGamepads.init(onchange);
	},

	/**
	 * Returns the number of sampled gamepads.
	 * @returns {number} Number of gamepad samples.
	 */
	godot_js_input_gamepad_sample_count__proxy: 'sync',
	godot_js_input_gamepad_sample_count__sig: 'i',
	godot_js_input_gamepad_sample_count: function () {
		return GodotInputGamepads.get_samples().length;
	},

	/**
	 * Samples all connected gamepads.
	 * @returns {number} Always returns 0.
	 */
	godot_js_input_gamepad_sample__proxy: 'sync',
	godot_js_input_gamepad_sample__sig: 'i',
	godot_js_input_gamepad_sample: function () {
		GodotInputGamepads.sample();
		return 0;
	},

	/**
	 * Retrieves gamepad sample data for a specific index.
	 * @param {number} p_index - Gamepad index.
	 * @param {number} r_btns - Pointer to store button values.
	 * @param {number} r_btns_num - Pointer to store button count.
	 * @param {number} r_axes - Pointer to store axis values.
	 * @param {number} r_axes_num - Pointer to store axis count.
	 * @param {number} r_standard - Pointer to store standard mapping flag.
	 * @returns {number} 0 on success, 1 if gamepad not found or disconnected.
	 */
	godot_js_input_gamepad_sample_get__proxy: 'sync',
	godot_js_input_gamepad_sample_get__sig: 'iiiiiii',
	godot_js_input_gamepad_sample_get: function (p_index, r_btns, r_btns_num, r_axes, r_axes_num, r_standard) {
		const sample = GodotInputGamepads.get_sample(p_index);
		if (!sample || !sample.connected) {
			return 1;
		}
		const btns = sample.buttons;
		const btns_len = btns.length < 16 ? btns.length : 16;
		for (let i = 0; i < btns_len; i++) {
			GodotRuntime.setHeapValue(r_btns + (i << 2), btns[i], 'float');
		}
		GodotRuntime.setHeapValue(r_btns_num, btns_len, 'i32');
		const axes = sample.axes;
		const axes_len = axes.length < 10 ? axes.length : 10;
		for (let i = 0; i < axes_len; i++) {
			GodotRuntime.setHeapValue(r_axes + (i << 2), axes[i], 'float');
		}
		GodotRuntime.setHeapValue(r_axes_num, axes_len, 'i32');
		const is_standard = sample.standard ? 1 : 0;
		GodotRuntime.setHeapValue(r_standard, is_standard, 'i32');
		return 0;
	},

	/*
	 * Drag/Drop API
	 */
	/**
	 * Registers a callback for file drop events.
	 * @param {number} callback - Callback function pointer.
	 */
	godot_js_input_drop_files_cb__proxy: 'sync',
	godot_js_input_drop_files_cb__sig: 'vi',
	godot_js_input_drop_files_cb: function (callback) {
		const func = GodotRuntime.get_func(callback);
		const dropFiles = function (files) {
			const args = files || [];
			if (!args.length) {
				return;
			}
			const argc = args.length;
			const argv = GodotRuntime.allocStringArray(args);
			func(argv, argc);
			GodotRuntime.freeStringArray(argv, argc);
		};
		const canvas = GodotConfig.canvas;
		GodotEventListeners.add(canvas, 'dragover', function (ev) {
			// Prevent default behavior (which would try to open the file(s))
			ev.preventDefault();
		}, false);
		GodotEventListeners.add(canvas, 'drop', GodotInputDragDrop.handler(dropFiles));
	},

	/* Paste API */
	/**
	 * Registers a callback for paste events.
	 * @param {number} callback - Callback function pointer.
	 */
	godot_js_input_paste_cb__proxy: 'sync',
	godot_js_input_paste_cb__sig: 'vi',
	godot_js_input_paste_cb: function (callback) {
		const func = GodotRuntime.get_func(callback);
		GodotEventListeners.add(window, 'paste', function (evt) {
			const text = evt.clipboardData.getData('text');
			const ptr = GodotRuntime.allocString(text);
			func(ptr);
			GodotRuntime.free(ptr);
		}, false);
	},

	/**
	 * Triggers a vibration on handheld devices.
	 * @param {number} p_duration_ms - Vibration duration in milliseconds.
	 */
	godot_js_input_vibrate_handheld__proxy: 'sync',
	godot_js_input_vibrate_handheld__sig: 'vi',
	godot_js_input_vibrate_handheld: function (p_duration_ms) {
		if (typeof navigator.vibrate !== 'function') {
			GodotRuntime.print('This browser does not support vibration.');
		} else {
			navigator.vibrate(p_duration_ms);
		}
	},
};

autoAddDeps(GodotInput, '$GodotInput');
mergeInto(LibraryManager.library, GodotInput);
