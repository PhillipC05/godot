/**************************************************************************/
/*  library_godot_runtime.js                                              */
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
 * Runtime helper functions for interacting with the Emscripten WebAssembly module.
 * Provides access to function pointers, memory operations, and string utilities.
 * @module GodotRuntime
 */
const GodotRuntime = {
	$GodotRuntime: {
		/*
		 * Functions
		 */
		/**
		 * Retrieves a JavaScript function from the WebAssembly table by its pointer.
		 * @param {number} ptr - The function pointer index in the WebAssembly table.
		 * @returns {Function} The JavaScript function at the given pointer.
		 */
		get_func: function (ptr) {
			return wasmTable.get(ptr);
		},

		/*
		 * Prints
		 */
		/**
		 * Outputs an error message to the console via Emscripten's error handler.
		 * @param {...*} args - The values to output as an error.
		 */
		error: function () {
			err.apply(null, Array.from(arguments)); // eslint-disable-line no-undef
		},

		/**
		 * Outputs values to the console via Emscripten's standard output.
		 * @param {...*} args - The values to output.
		 */
		print: function () {
			out.apply(null, Array.from(arguments)); // eslint-disable-line no-undef
		},

		/*
		 * Memory
		 */
		/**
		 * Allocates a block of memory in the WebAssembly heap.
		 * @param {number} p_size - The number of bytes to allocate.
		 * @returns {number} Pointer to the allocated memory block.
		 */
		malloc: function (p_size) {
			return _malloc(p_size);
		},

		/**
		 * Frees a previously allocated block of memory in the WebAssembly heap.
		 * @param {number} p_ptr - Pointer to the memory block to free.
		 */
		free: function (p_ptr) {
			_free(p_ptr);
		},

		/**
		 * Reads a value from the WebAssembly heap at the specified pointer.
		 * @param {number} p_ptr - Pointer to the value in the heap.
		 * @param {string} p_type - The type of the value to read (e.g., 'i32', 'float', 'double').
		 * @returns {*} The value read from the heap.
		 */
		getHeapValue: function (p_ptr, p_type) {
			return getValue(p_ptr, p_type);
		},

		/**
		 * Writes a value to the WebAssembly heap at the specified pointer.
		 * @param {number} p_ptr - Pointer to the location in the heap.
		 * @param {*} p_value - The value to write.
		 * @param {string} p_type - The type of the value to write (e.g., 'i32', 'float', 'double').
		 */
		setHeapValue: function (p_ptr, p_value, p_type) {
			setValue(p_ptr, p_value, p_type);
		},

		/**
		 * Creates a view into a portion of a typed array heap buffer.
		 * @param {Object} p_heap - The typed array constructor (e.g., HEAP32, HEAPF32).
		 * @param {number} p_ptr - Starting pointer in the heap.
		 * @param {number} p_len - Number of elements to include.
		 * @returns {TypedArray} A view of the heap buffer.
		 */
		heapSub: function (p_heap, p_ptr, p_len) {
			const bytes = p_heap.BYTES_PER_ELEMENT;
			return p_heap.subarray(p_ptr / bytes, p_ptr / bytes + p_len);
		},

		/**
		 * Creates a copy of a portion of a typed array heap buffer.
		 * @param {Object} p_heap - The typed array constructor (e.g., HEAPU8, HEAP32).
		 * @param {number} p_ptr - Starting pointer in the heap.
		 * @param {number} p_len - Number of elements to copy.
		 * @returns {TypedArray} A new array containing the copied elements.
		 */
		heapSlice: function (p_heap, p_ptr, p_len) {
			const bytes = p_heap.BYTES_PER_ELEMENT;
			return p_heap.slice(p_ptr / bytes, p_ptr / bytes + p_len);
		},

		/**
		 * Copies elements from one typed array to another in the heap.
		 * @param {TypedArray} p_dst - Destination typed array.
		 * @param {TypedArray} p_src - Source typed array.
		 * @param {number} p_ptr - Starting pointer in the destination.
		 * @returns {void}
		 */
		heapCopy: function (p_dst, p_src, p_ptr) {
			const bytes = p_src.BYTES_PER_ELEMENT;
			return p_dst.set(p_src, p_ptr / bytes);
		},

		/*
		 * Strings
		 */
		/**
		 * Converts a null-terminated UTF-8 string from the WebAssembly heap to a JavaScript string.
		 * @param {number} p_ptr - Pointer to the string in the heap.
		 * @returns {string} The decoded JavaScript string.
		 */
		parseString: function (p_ptr) {
			return UTF8ToString(p_ptr);
		},

		/**
		 * Parses an array of null-terminated UTF-8 strings from the WebAssembly heap.
		 * @param {number} p_ptr - Pointer to the array of string pointers.
		 * @param {number} p_size - Number of strings in the array.
		 * @returns {Array<string>} Array of decoded JavaScript strings.
		 */
		parseStringArray: function (p_ptr, p_size) {
			const strings = [];
			const ptrs = GodotRuntime.heapSub(HEAP32, p_ptr, p_size); // TODO wasm64
			ptrs.forEach(function (ptr) {
				strings.push(GodotRuntime.parseString(ptr));
			});
			return strings;
		},

		/**
		 * Calculates the byte length of a string when encoded as UTF-8.
		 * @param {string} p_str - The string to measure.
		 * @returns {number} The byte length of the UTF-8 encoded string.
		 */
		strlen: function (p_str) {
			return lengthBytesUTF8(p_str);
		},

		/**
		 * Allocates memory and copies a string to the WebAssembly heap as UTF-8.
		 * @param {string} p_str - The string to copy.
		 * @returns {number} Pointer to the allocated string in the heap.
		 */
		allocString: function (p_str) {
			const length = GodotRuntime.strlen(p_str) + 1;
			const c_str = GodotRuntime.malloc(length);
			stringToUTF8(p_str, c_str, length);
			return c_str;
		},

		/**
		 * Allocates memory for an array of strings and copies each string to the heap.
		 * @param {Array<string>} p_strings - Array of strings to copy.
		 * @returns {number} Pointer to the array of string pointers in the heap.
		 */
		allocStringArray: function (p_strings) {
			const size = p_strings.length;
			const c_ptr = GodotRuntime.malloc(size * 4);
			for (let i = 0; i < size; i++) {
				HEAP32[(c_ptr >> 2) + i] = GodotRuntime.allocString(p_strings[i]);
			}
			return c_ptr;
		},

		/**
		 * Frees an array of strings and their constituent pointers in the heap.
		 * @param {number} p_ptr - Pointer to the array of string pointers.
		 * @param {number} p_len - Number of strings in the array.
		 */
		freeStringArray: function (p_ptr, p_len) {
			for (let i = 0; i < p_len; i++) {
				GodotRuntime.free(HEAP32[(p_ptr >> 2) + i]);
			}
			GodotRuntime.free(p_ptr);
		},

		/**
		 * Copies a JavaScript string to a pre-allocated buffer in the WebAssembly heap.
		 * @param {string} p_str - The string to copy.
		 * @param {number} p_ptr - Pointer to the destination buffer.
		 * @param {number} p_len - Maximum number of characters to copy.
		 */
		stringToHeap: function (p_str, p_ptr, p_len) {
			return stringToUTF8Array(p_str, HEAP8, p_ptr, p_len);
		},
	},
};
autoAddDeps(GodotRuntime, '$GodotRuntime');
mergeInto(LibraryManager.library, GodotRuntime);
