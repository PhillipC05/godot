/**************************************************************************/
/*  test_http_client_web.cpp                                              */
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

#include "tests/test_macros.h"

TEST_FORCE_LINK(test_http_client_web)

#include "core/io/http_client.h"

namespace TestHTTPClientWeb {

// Minimal concrete HTTPClient subclass for testing header parsing.
class MockHTTPClient : public HTTPClient {
	GDSOFTCLASS(MockHTTPClient, HTTPClient);

	List<String> mock_headers;

protected:
	Error get_response_headers(List<String> *r_response) override {
		for (const String &E : mock_headers) {
			r_response->push_back(E);
		}
		mock_headers.clear();
		return OK;
	}

public:
	void set_response_headers(const List<String> &p_headers) {
		mock_headers = p_headers;
	}

	// Expose the protected method for testing.
	Dictionary test_response_headers_as_dictionary() {
		return _get_response_headers_as_dictionary();
	}

	// Stubs for pure virtual methods (not exercised in header parsing tests).
	Error request(Method, const String &, const Vector<String> &, const uint8_t *, int) override { return ERR_UNAVAILABLE; }
	Error connect_to_host(const String &, int, Ref<TLSOptions>) override { return ERR_UNAVAILABLE; }
	void set_connection(const Ref<StreamPeer> &) override {}
	Ref<StreamPeer> get_connection() const override { return Ref<StreamPeer>(); }
	void close() override {}
	Status get_status() const override { return STATUS_DISCONNECTED; }
	bool has_response() const override { return false; }
	bool is_response_chunked() const override { return false; }
	int get_response_code() const override { return 0; }
	int64_t get_response_body_length() const override { return -1; }
	PackedByteArray read_response_body_chunk() override { return PackedByteArray(); }
	void set_blocking_mode(bool) override {}
	bool is_blocking_mode_enabled() const override { return false; }
	void set_read_chunk_size(int) override {}
	int get_read_chunk_size() const override { return 0; }
	Error poll() override { return ERR_UNAVAILABLE; }

	MockHTTPClient() {}
};

TEST_CASE("[HTTPClient] _get_response_headers_as_dictionary parses standard headers") {
	MockHTTPClient client;
	List<String> headers;
	headers.push_back("Content-Type: text/html");
	headers.push_back("Content-Length: 42");
	headers.push_back("X-Custom-Header: some-value");
	client.set_response_headers(headers);

	Dictionary result = client.test_response_headers_as_dictionary();
	CHECK_MESSAGE(result.size() == 3, "Should contain 3 headers");
	CHECK_MESSAGE(result["Content-Type"] == "text/html", "Content-Type should be 'text/html'");
	CHECK_MESSAGE(result["Content-Length"] == "42", "Content-Length should be '42'");
	CHECK_MESSAGE(result["X-Custom-Header"] == "some-value", "Custom header should be preserved");
}

TEST_CASE("[HTTPClient] _get_response_headers_as_dictionary strips whitespace") {
	MockHTTPClient client;
	List<String> headers;
	headers.push_back("  Content-Type  :  application/json  ");
	headers.push_back("\tAuthorization:\tBearer token123\t");
	client.set_response_headers(headers);

	Dictionary result = client.test_response_headers_as_dictionary();
	CHECK_MESSAGE(result.size() == 2, "Should contain 2 headers");
	CHECK_MESSAGE(result["Content-Type"] == "application/json", "Key and value should be trimmed");
	CHECK_MESSAGE(result["Authorization"] == "Bearer token123", "Tabs should be stripped");
}

TEST_CASE("[HTTPClient] _get_response_headers_as_dictionary handles colons in value") {
	MockHTTPClient client;
	List<String> headers;
	headers.push_back("Location: http://example.com:8080/path");
	headers.push_back("Host: example.com:443");
	client.set_response_headers(headers);

	Dictionary result = client.test_response_headers_as_dictionary();
	CHECK_MESSAGE(result.size() == 2, "Should contain 2 headers");
	CHECK_MESSAGE(result["Location"] == "http://example.com:8080/path", "Colons in value should be preserved");
	CHECK_MESSAGE(result["Host"] == "example.com:443", "Port in value should be preserved");
}

TEST_CASE("[HTTPClient] _get_response_headers_as_dictionary skips headers without colon") {
	MockHTTPClient client;
	List<String> headers;
	headers.push_back("NoColonHeader");
	headers.push_back("Valid: header");
	headers.push_back("");
	client.set_response_headers(headers);

	Dictionary result = client.test_response_headers_as_dictionary();
	CHECK_MESSAGE(result.size() == 1, "Should contain only the valid header");
	CHECK_MESSAGE(result.has("Valid"), "Valid header should be present");
}

TEST_CASE("[HTTPClient] _get_response_headers_as_dictionary handles empty list") {
	MockHTTPClient client;
	client.set_response_headers(List<String>());

	Dictionary result = client.test_response_headers_as_dictionary();
	CHECK_MESSAGE(result.is_empty(), "Empty header list should produce empty dictionary");
}

TEST_CASE("[HTTPClient] _get_response_headers_as_dictionary handles duplicate keys") {
	MockHTTPClient client;
	List<String> headers;
	headers.push_back("Set-Cookie: a=1");
	headers.push_back("Set-Cookie: b=2");
	client.set_response_headers(headers);

	Dictionary result = client.test_response_headers_as_dictionary();
	// Last value wins for duplicate keys.
	CHECK_MESSAGE(result["Set-Cookie"] == "b=2", "Last duplicate key should win");
}

TEST_CASE("[HTTPClient] _get_response_headers_as_dictionary handles Set-Cookie with semicolons") {
	MockHTTPClient client;
	List<String> headers;
	headers.push_back("Set-Cookie: session=abc123; Path=/; HttpOnly; Secure");
	client.set_response_headers(headers);

	Dictionary result = client.test_response_headers_as_dictionary();
	CHECK_MESSAGE(result["Set-Cookie"] == "session=abc123; Path=/; HttpOnly; Secure",
			"Complex cookie value should be preserved intact");
}

TEST_CASE("[HTTPClient] verify_headers accepts well-formed headers") {
	Ref<HTTPClient> client = HTTPClient::create();
	Vector<String> headers = { "Content-Type: text/plain", "Accept: */*" };
	Error err = client->verify_headers(headers);
	CHECK_MESSAGE(err == OK, "Valid headers should return OK");
}

TEST_CASE("[HTTPClient] verify_headers rejects malformed headers") {
	Ref<HTTPClient> client = HTTPClient::create();

	ERR_PRINT_OFF;
	Vector<String> no_colon = { "BadHeader" };
	CHECK_MESSAGE(client->verify_headers(no_colon) == ERR_INVALID_PARAMETER,
			"Header without colon should be rejected");

	Vector<String> empty = { "" };
	CHECK_MESSAGE(client->verify_headers(empty) == ERR_INVALID_PARAMETER,
			"Empty header should be rejected");

	Vector<String> colon_start = { ": value" };
	CHECK_MESSAGE(client->verify_headers(colon_start) == ERR_INVALID_PARAMETER,
			"Header starting with colon should be rejected");
	ERR_PRINT_ON;
}

} // namespace TestHTTPClientWeb
