/**************************************************************************/
/*  library_godot_emscripten.js                                           */
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
 * Emscripten-specific helper functions for the Godot Web platform.
 * Provides information about the Emscripten runtime environment.
 * @module GodotEmscripten
 */
const GodotEmscripten = {
	$GodotEmscripten__deps: ['$GodotRuntime'],
	$GodotEmscripten: {},

	/**
	 * Returns the Emscripten runtime version as a string.
	 * @returns {number} Pointer to the version string in the WebAssembly heap.
	 * @description Note: The caller is responsible for freeing the returned string pointer.
	 */
	godot_js_emscripten_get_version__proxy: 'sync',
	godot_js_emscripten_get_version__sig: 'p',
	godot_js_emscripten_get_version: function () {
		// WARNING: The caller needs to free the string pointer.
		const emscriptenVersionPtr = GodotRuntime.allocString('{{{ EMSCRIPTEN_VERSION }}}');
		return emscriptenVersionPtr;
	},
};
autoAddDeps(GodotEmscripten, '$GodotEmscripten');
addToLibrary(GodotEmscripten);
