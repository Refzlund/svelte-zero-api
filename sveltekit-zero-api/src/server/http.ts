interface ResponseOptions<Status extends number, StatusText extends string> {
	headers?: HeadersInit
	status?: Status
	statusText?: StatusText
	cause?: unknown
	/** Will be added to headers for you */
	contentType?: string
}
interface Options {
	headers?: HeadersInit
/** If you `throw` the response, you can provide a cause to be logged*/
	cause?: unknown
}

const customInspectSymbol = Symbol.for('nodejs.util.inspect.custom')

/**
 * The reason `KitResponse` extends `Error` is so that we can `throw` it.
 * 
 * Vite does not allow other things that Error to be thrown. So it must be an error.
*/
// @ts-expect-error We declare some Error-properties to be hidden - we do this so we use one type of KitResponse for frontend and backend TYPE. (Frontend is Response, while backend is an Error that partially extends the structure of a Response).
export class KitResponse<
	Status extends StatusCodeType = StatusCodeType,
	StatusText extends StatusTextType = StatusTextType,
	Body = any,
	OK extends boolean = boolean
> extends Error {
	headers: Headers
	status: Status
	statusText: StatusText
	body: Body
	/** A `boolean` stating whether the response was successful (status in the range 200-299) or not. */
	get ok() {
		return (this.status >= 200 && this.status < 300) as OK
	}

	// Declaring them `private` so that this "Error" looks like (aka Emulates) a Response-type structure
	private declare cause?: unknown
	private declare message: string
	private declare name: string
	private declare stack?: string

	constructor(body?: Body, options: ResponseOptions<Status, StatusText> = {}) {
		super()
		this.body = body as Body
		this.headers = new Headers(options.headers || {})
		if (options.contentType) this.headers.set('content-type', options.contentType)

		this.status = (options.status || 200) as Status
		this.statusText = (options.statusText || 'OK') as StatusText
		this.cause = options.cause
		this.message = `Kit ${this.statusText}

    \x1b[94m  ${this.status < 400 ? '\x1b[32m' : '\x1b[91m'}${this.status} ${this.statusText}\x1b[0m
`
		if (this.body) {
			this.message += `\x1b[90m————————————————${Array(this.statusText.length).join('—')}\x1b[0m
${JSON.stringify(body, null, 4)}
`
		}
	}

	[customInspectSymbol]() {
		return (
			'\n' +
			this.stack!.split('\n')
				.slice(2, -2)
				.join('\n')
				.replace(/\n.*at endpointHandler .*\n/, '\n')
		)
	}
}


export interface StatusCode {
	Informational: 100 | 101 | 102 | 103
	Success: 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226
	Redirect: 300 | 301 | 302 | 303 | 304 | 307 | 308
	ClientError:
		| 400
		| 401
		| 402
		| 403
		| 404
		| 405
		| 406
		| 407
		| 408
		| 409
		| 410
		| 411
		| 412
		| 413
		| 414
		| 415
		| 416
		| 417
		| 418
		| 421
		| 422
		| 423
		| 424
		| 425
		| 426
		| 428
		| 429
		| 431
		| 451
	ServerError: 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511
	Error: this['ClientError'] | this['ServerError']
}

export interface Statuses {
	informational: 'Informational'
	success: 'Success'
	redirect: 'Redirect'
	clientError: 'ClientError'
	serverError: 'ServerError'
	error: 'ClientError' | 'ServerError'
}

export interface StatusText {
	Informational: 'Continue' | 'SwitchingProtocols' | 'Processing' | 'EarlyHints'
	Success:
		| 'OK'
		| 'Created'
		| 'Accepted'
		| 'NonAuthoritativeInformation'
		| 'NoContent'
		| 'ResetContent'
		| 'PartialContent'
		| 'MultiStatus'
		| 'AlreadyReported'
		| 'IMUsed'
	Redirect:
		| 'MultipleChoices'
		| 'MovedPermanently'
		| 'Found'
		| 'SeeOther'
		| 'NotModified'
		| 'TemporaryRedirect'
		| 'PermanentRedirect'
	ClientError:
		| 'BadRequest'
		| 'Unauthorized'
		| 'PaymentRequired'
		| 'Forbidden'
		| 'NotFound'
		| 'MethodNotAllowed'
		| 'NotAcceptable'
		| 'ProxyAuthenticationRequired'
		| 'RequestTimeout'
		| 'Conflict'
		| 'Gone'
		| 'LengthRequired'
		| 'PreconditionFailed'
		| 'PayloadTooLarge'
		| 'URITooLong'
		| 'UnsupportedMediaType'
		| 'RangeNotSatisfiable'
		| 'ExpectationFailed'
		| 'ImATeapot'
		| 'MisdirectedRequest'
		| 'UnprocessableEntity'
		| 'Locked'
		| 'FailedDependency'
		| 'TooEarly'
		| 'UpgradeRequired'
		| 'PreconditionRequired'
		| 'TooManyRequests'
		| 'RequestHeaderFieldsTooLarge'
		| 'UnavailableForLegalReasons'
	ServerError:
		| 'InternalServerError'
		| 'NotImplemented'
		| 'BadGateway'
		| 'ServiceUnavailable'
		| 'GatewayTimeout'
		| 'HTTPVersionNotSupported'
		| 'VariantAlsoNegotiates'
		| 'InsufficientStorage'
		| 'LoopDetected'
		| 'NotExtended'
		| 'NetworkAuthenticationRequired'
	Error: this['ClientError'] | this['ServerError']
}

export type StatusCodeType = StatusCode[keyof StatusCode]
export type StatusTextType = StatusText[keyof StatusText]
	

// *                     *
// *  1×× Informational  *
// *                     *
// #region 1×× Informational

/** 
 * [100 Continue](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/100) — 
 * ndicates that everything so far is OK and that the client should continue with
 * the request or ignore it if it is already finished
*/
export class Continue<const T = undefined> extends KitResponse<100, 'Continue', T, false> {
	constructor(body?: T, options: Options = {}) {
		super(body, { ...options, status: 100, statusText: 'Continue' })
	}
}

/** 
 * [101 Switching Protocols](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/101) — 
 * indicates a protocol to which the server switches. The protocol is specified in the
 * [Upgrade](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Upgrade) request header received from a client.
*/
export class SwitchingProtocols<const T = undefined> extends KitResponse<101, 'SwitchingProtocols', T, false> {
	constructor(body?: T, options: Options = {}) {
		super(body, { ...options, status: 101, statusText: 'SwitchingProtocols' })
	}
}

/** 
 * [102 Processing](https://www.webfx.com/web-development/glossary/http-status-codes/what-is-a-102-status-code/) — 
 * An interim response used to inform the client that the server has accepted the complete request but has not yet completed it
*/
export class Processing<const T = undefined> extends KitResponse<102, 'Processing', T, false> {
	constructor(body?: T, options: Options = {}) {
		super(body, { ...options, status: 102, statusText: 'Processing' })
	}
}

/** 
 * [103 Early Hints](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/103) — 
 * is primarily intended to be used with the [Link](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Link)
 * header to allow the user agent to start preloading resources while the server is still preparing a response
*/
export class EarlyHints<const T = undefined> extends KitResponse<103, 'EarlyHints', T, false> {
	constructor(body?: T, options: Options = {}) {
		super(body, { ...options, status: 103, statusText: 'EarlyHints' })
	}
}

// #endregion





// *               *
// *  2×× Success  *
// *               *
// #region 2×× Success

/** 
 * [200 OK](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/200) — 
 * indicates that the request has succeeded. A 200 response is cacheable by default.
*/
export class OK<const T = undefined> extends KitResponse<200, 'OK', T, true> {
	constructor(body?: T, options: Options = {}) {
		super(body, { ...options, status: 200, statusText: 'OK' })
	}
}

/**
 * [201 Created](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/201) —
 * indicates that the request has succeeded and has led to the creation of a resource.
 * The new resource is effectively created before this response is sent back and the
 * new resource is returned in the body of the message, its location being either the
 * URL of the request, or the content of the
 * [Location](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Location)
 * header.
*/
export class Created<const T = undefined> extends KitResponse<201, 'Created', T, true> {
	constructor(body?: T, options: Options = {}) {
		super(body, { ...options, status: 201, statusText: 'Created' })
	}
}

/**
 * [202 Accepted](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/202) —
 * indicates that the request has been accepted for processing, but the processing has
 * not been completed; in fact, processing may not have started yet. The request might
 * or might not eventually be acted upon, as it might be disallowed when processing
 * actually takes place.
*/
export class Accepted<const T = undefined> extends KitResponse<202, 'Accepted', T, true> {
	constructor(body?: T, options: Options = {}) {
		super(body, { ...options, status: 202, statusText: 'Accepted' })
	}
}

/**
 * [203 Non-Authoritative Information](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/203) —
 * indicates that the request was successful but the enclosed payload has been modified
 * by a transforming [proxy](https://developer.mozilla.org/en-US/docs/Glossary/Proxy_server)
 * from that of the origin server's [200](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/200)
 * (OK) response.
*/
export class NonAuthoritativeInformation<const T = undefined> extends KitResponse<203, 'NonAuthoritativeInformation', T, true> {
	constructor(body?: T, options: Options = {}) {
		super(body, { ...options, status: 203, statusText: 'NonAuthoritativeInformation' })
	}
}

/**
 * [204 No Content](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/204) —
 * indicates that a request has succeeded, but that the client doesn't need to navigate away
 * from its current page.
*/
export class NoContent<const T = undefined> extends KitResponse<204, 'NoContent', T, true> {
	constructor(body?: T, options: Options = {}) {
		super(body, { ...options, status: 204, statusText: 'NoContent' })
	}
}

/**
 * [205 Reset Content](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/205) —
 * tells the client to reset the document view, so for example to clear the content of
 * a form, reset a canvas state, or to refresh the UI.
*/
export class ResetContent<const T = undefined> extends KitResponse<205, 'ResetContent', T, true> {
	constructor(body?: T, options: Options = {}) {
		super(body, { ...options, status: 205, statusText: 'ResetContent' })
	}
}

/**
 * [206 Partial Content](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/206) —
 * indicates that the request has succeeded and the body contains the requested ranges
 * of data, as described in the Range header of the request.
*/
export class PartialContent<const T = undefined> extends KitResponse<206, 'PartialContent', T, true> {
	constructor(body?: T, options: Options = {}) {
		super(body, { ...options, status: 206, statusText: 'PartialContent' })
	}
}

/**
 * [207 Mutli-Status](https://www.webfx.com/web-development/glossary/http-status-codes/what-is-a-207-status-code/) —
 * conveys information about multiple resources in situations where multiple status codes
 * might be appropriate.
*/
export class MultiStatus<const T = undefined> extends KitResponse<207, 'MultiStatus', T, true> {
	constructor(body?: T, options: Options = {}) {
		super(body, { ...options, status: 207, statusText: 'MultiStatus' })
	}
}

/**
 * [208 Already Reported](https://www.webfx.com/web-development/glossary/http-status-codes/what-is-a-208-status-code/) —
 * Used inside a DAV: propstat response element to avoid enumerating the internal
 * members of multiple bindings to the same collection repeatedly.
*/
export class AlreadyReported<const T = undefined> extends KitResponse<208, 'AlreadyReported', T, true> {
	constructor(body?: T, options: Options = {}) {
		super(body, { ...options, status: 208, statusText: 'AlreadyReported' })
	}
}

/**
 * [226 IM Used](https://www.webfx.com/web-development/glossary/http-status-codes/what-is-a-226-status-code/) —
 * The server has fulfilled a GET request for the resource, and the response is a
 * representation of the result of one or more instance-manipulations applied to
 * the current instance.
*/
export class IMUsed<const T = undefined> extends KitResponse<226, 'IMUsed', T, true> {
	constructor(body?: T, options: Options = {}) {
		super(body, { ...options, status: 226, statusText: 'IMUsed' })
	}
}

// #endregion





// *                *
// *  3×× Redirect  *
// *                *
// #region 3×× Redirect 

/**
 * [300 Multiple Choices](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/300) —
 * indicates that the request has more than one possible responses. The user-agent or
 * user should choose one of them. As there is no standardized way of choosing one of
 * the responses, this response code is very rarely used.
*/
export class MultipleChoices<const T = undefined> extends KitResponse<300, 'MultipleChoices', T, false> {
	constructor(body?: T, options: Options = {}) {
		super(body, { ...options, status: 300, statusText: 'MultipleChoices' })
	}
}

/**
 * [301 Moved Permanently](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/301) —
 * indicates that the resource has been moved permanently to a new location, and that
 * future references should use a new URI with their requests.
*/
export class MovedPermanently<const T = undefined> extends KitResponse<301, 'MovedPermanently', T, false> {
	constructor(body?: T, options: Options = {}) {
		super(body, { ...options, status: 301, statusText: 'MovedPermanently' })
	}
}

/**
 * [302 Found](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/302) —
 * indicates that the resource has been moved temporarily to a different location, but that
 * future references should still use the original URI to access the resource.
*/
export class Found<const T = undefined> extends KitResponse<302, 'Found', T, false> {
	constructor(body?: T, options: Options = {}) {
		super(body, { ...options, status: 302, statusText: 'Found' })
	}
}

/**
 * [303 See Other](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/303) —
 * indicates that the response to the request can be found under a different URI.
*/
export class SeeOther<const T = undefined> extends KitResponse<303, 'SeeOther', T, false> {
	constructor(body?: T, options: Options = {}) {
		super(body, { ...options, status: 303, statusText: 'SeeOther' })
	}
}

/**
 * [304 Not Modified](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/304) —
 * indicates that the request has not been modified since the last request.
*/
export class NotModified<const T = undefined> extends KitResponse<304, 'NotModified', T, false> {
	constructor(body?: T, options: Options = {}) {
		super(body, { ...options, status: 304, statusText: 'NotModified' })
	}
}

/**
 * [307 Temporary Redirect](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/307) —
 * indicates that the resource is located temporarily under a different URI. Since the
 * redirection might be altered on occasion, the client should continue to use the original
 * effective request URI for future requests.
*/
export class TemporaryRedirect<const T = undefined> extends KitResponse<307, 'TemporaryRedirect', T, false> {
	constructor(body?: T, options: Options = {}) {
		super(body, { ...options, status: 307, statusText: 'TemporaryRedirect' })
	}
}

/**
 * [308 Permanent Redirect](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/308) —
 * indicates that the resource has been moved permanently to a new location, and that
 * future references should use a new URI with their requests.
*/
export class PermanentRedirect<const T = undefined> extends KitResponse<308, 'PermanentRedirect', T, false> {
	constructor(body?: T, options: Options = {}) {
		super(body, { ...options, status: 308, statusText: 'PermanentRedirect' })
	}
}

// #endregion





// *                     *
// *  4×× Client Errors  *
// *                     *
// #region 4×× Client Errors

/**
 * [400 Bad Request](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/400) —
 * indicates that the server cannot or will not process the request due to an apparent
 * client error.
*/
export class BadRequest<const T = undefined> extends KitResponse<400, 'BadRequest', T, false> {
	constructor(body?: T, options: Options = {}) {
		super(body, { ...options, status: 400, statusText: 'BadRequest' })
	}
}

/**
 * [401 Unauthorized](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401) —
 * indicates that the request has not been applied because it lacks valid authentication
 * credentials for the target resource.
*/
export class Unauthorized<const T = undefined> extends KitResponse<401, 'Unauthorized', T, false> {
	constructor(body?: T, options: Options = {}) {
		super(body, { ...options, status: 401, statusText: 'Unauthorized' })
	}
}

/**
 * [402 Payment Required](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/402) —
 * is reserved for future use. The original intention was that this code might be used
 * as part of some form of digital cash or micropayment scheme, but that has not happened,
 * and this code is not usually used.
*/
export class PaymentRequired<const T = undefined> extends KitResponse<402, 'PaymentRequired', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 402, statusText: 'PaymentRequired' });
    }
}

/**
 * [403 Forbidden](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/403) —
 * indicates that the server understood the request but refuses to authorize it.
*/
export class Forbidden<const T = undefined> extends KitResponse<403, 'Forbidden', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 403, statusText: 'Forbidden' });
    }
}

/**
 * [404 Not Found](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/404) —
 * indicates that the origin server did not find a current representation for the
 * target resource or is not willing to disclose that one exists.
*/
export class NotFound<const T = undefined> extends KitResponse<404, 'NotFound', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 404, statusText: 'NotFound' });
    }
}

/**
 * [405 Method Not Allowed](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/405) —
 * indicates that the method received in the request-line is known by the origin
 * server but not supported by the target resource.
*/
export class MethodNotAllowed<const T = undefined> extends KitResponse<405, 'MethodNotAllowed', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 405, statusText: 'MethodNotAllowed' });
    }
}

/**
 * [406 Not Acceptable](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/406) —
 * indicates that the server cannot produce a response matching the list of
 * acceptable values defined in the request's proactive
 * [content negotiation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Content_negotiation)
 * headers, and that the server is unwilling to supply a default representation.
*/
export class NotAcceptable<const T = undefined> extends KitResponse<406, 'NotAcceptable', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 406, statusText: 'NotAcceptable' });
    }
}

/**
 * [407 Proxy Authentication Required](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/407) —
 * indicates that the client needs to authenticate itself in order to use a
 * [proxy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Proxy_servers).
*/
export class ProxyAuthenticationRequired<const T = undefined> extends KitResponse<407, 'ProxyAuthenticationRequired', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 407, statusText: 'ProxyAuthenticationRequired' });
    }
}

/**
 * [408 Request Timeout](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/408) —
 * indicates that the server did not receive a complete request message within
 * the time that it was prepared to wait.
*/
export class RequestTimeout<const T = undefined> extends KitResponse<408, 'RequestTimeout', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 408, statusText: 'RequestTimeout' });
    }
}

/**
 * [409 Conflict](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/409) —
 * indicates that the request could not be completed due to a conflict with the
 * current state of the target resource.
*/
export class Conflict<const T = undefined> extends KitResponse<409, 'Conflict', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 409, statusText: 'Conflict' });
    }
}

/**
 * [410 Gone](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/410) —
 * indicates that access to the target resource is no longer available at the
 * origin server and that this condition is likely to be permanent.
*/
export class Gone<const T = undefined> extends KitResponse<410, 'Gone', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 410, statusText: 'Gone' });
    }
}

/**
 * [411 Length Required](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/411) —
 * indicates that the server refuses to accept the request without a defined
 * [Content-Length](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Length).
*/
export class LengthRequired<const T = undefined> extends KitResponse<411, 'LengthRequired', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 411, statusText: 'LengthRequired' });
    }
}

/**
 * [412 Precondition Failed](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/412) —
 * indicates that one or more conditions given in the request header fields
 * evaluated to false when tested on the server.
*/
export class PreconditionFailed<const T = undefined> extends KitResponse<412, 'PreconditionFailed', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 412, statusText: 'PreconditionFailed' });
    }
}

/**
 * [413 Payload Too Large](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/413) —
 * indicates that the server is refusing to process a request because the
 * request payload is larger than the server is willing or able to process.
*/
export class PayloadTooLarge<const T = undefined> extends KitResponse<413, 'PayloadTooLarge', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 413, statusText: 'PayloadTooLarge' });
    }
}

/**
 * [414 URI Too Long](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/414) —
 * indicates that the server is refusing to service the request because the
 * request-target is longer than the server is willing to interpret.
*/
export class URITooLong<const T = undefined> extends KitResponse<414, 'URITooLong', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 414, statusText: 'URITooLong' });
    }
}

/**
 * [415 Unsupported Media Type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/415) —
 * indicates that the origin server is refusing to service the request because the payload is in a
 * format not supported by this method on the target resource.
*/
export class UnsupportedMediaType<const T = undefined> extends KitResponse<415, 'UnsupportedMediaType', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 415, statusText: 'UnsupportedMediaType' });
    }
}

/**
 * [416 Range Not Satisfiable](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/416) —
 * indicates that none of the ranges in the request's [Range](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Range)
 * header field (Section 14.35 of [RFC7233](https://tools.ietf.org/html/rfc7233)) overlap the current
 * extent of the selected resource or that the set of ranges requested has been rejected due to
 * invalid ranges or an excessive request of small or overlapping ranges.
*/
export class RangeNotSatisfiable<const T = undefined> extends KitResponse<416, 'RangeNotSatisfiable', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 416, statusText: 'RangeNotSatisfiable' });
    }
}

/**
 * [417 Expectation Failed](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/417) —
 * indicates that the expectation given in the request's [Expect](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Expect)
 * header field (Section 5.1.1 of [RFC7231](https://tools.ietf.org/html/rfc7231)) could not be met
 * by at least one of the inbound servers.
*/
export class ExpectationFailed<const T = undefined> extends KitResponse<417, 'ExpectationFailed', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 417, statusText: 'ExpectationFailed' });
    }
}

/**
 * [418 I'm a teapot](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/418) —
 * indicates that the server refuses to brew coffee because it is, permanently, a teapot.
 * A combined coffee/tea pot that is temporarily out of coffee should instead return 503.
 * This error is a reference to Hyper Text Coffee Pot Control Protocol defined in April Fools' jokes in 1998 and 2014.
*/
export class ImATeapot<const T = undefined> extends KitResponse<418, 'ImATeapot', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 418, statusText: 'ImATeapot' });
    }
}

/**
 * [421 Misdirected Request](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/421) —
 * indicates that the request was directed at a server that is not able to produce a response.
*/
export class MisdirectedRequest<const T = undefined> extends KitResponse<421, 'MisdirectedRequest', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 421, statusText: 'MisdirectedRequest' });
    }
}

/**
 * [422 Unprocessable Entity](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422) —
 * indicates that the server understands the content type of the request entity (hence a
 * [415](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/415) [Unsupported Media Type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/415)
 * status code is inappropriate), and the syntax of the request entity is correct (thus a
 * [400](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/400) [Bad Request](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/400)
 * status code is inappropriate) but was unable to process the contained instructions.
*/
export class UnprocessableEntity<const T = undefined> extends KitResponse<422, 'UnprocessableEntity', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 422, statusText: 'UnprocessableEntity' });
    }
}

/**
 * [423 Locked](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/423) —
 * indicates that the access to the target resource is denied.
*/
export class Locked<const T = undefined> extends KitResponse<423, 'Locked', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 423, statusText: 'Locked' });
    }
}

/**
 * [424 Failed Dependency](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/424) —
 * indicates that the method could not be performed on the resource because the
 * requested action depended on another action and that action failed.
*/
export class FailedDependency<const T = undefined> extends KitResponse<424, 'FailedDependency', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 424, statusText: 'FailedDependency' });
    }
}

/**
 * [425 Too Early](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/425) —
 * indicates that the server is unwilling to risk processing a request that might
 * be replayed.
*/
export class TooEarly<const T = undefined> extends KitResponse<425, 'TooEarly', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 425, statusText: 'TooEarly' });
    }
}

/**
 * [426 Upgrade Required](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/426) —
 * indicates that the server refuses to perform the request using the current protocol
 * but might be willing to do so after the client upgrades to a different protocol.
 * The server sends an [Upgrade](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Upgrade)
 * header field in a 426 response to indicate the required protocol(s).
*/
export class UpgradeRequired<const T = undefined> extends KitResponse<426, 'UpgradeRequired', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 426, statusText: 'UpgradeRequired' });
    }
}

/**
 * [428 Precondition Required](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/428) —
 * indicates that the origin server requires the request to be conditional.
*/
export class PreconditionRequired<const T = undefined> extends KitResponse<428, 'PreconditionRequired', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 428, statusText: 'PreconditionRequired' });
    }
}

/**
 * [429 Too Many Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429) —
 * indicates that the user has sent too many requests in a given amount of time ("rate limiting").
*/
export class TooManyRequests<const T = undefined> extends KitResponse<429, 'TooManyRequests', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 429, statusText: 'TooManyRequests' });
    }
}

/**
 * [431 Request Header Fields Too Large](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/431) —
 * indicates that the server is unwilling to process the request because its header fields
 * are too large. The request may be resubmitted after reducing the size of the request
 * header fields.
*/
export class RequestHeaderFieldsTooLarge<const T = undefined> extends KitResponse<431, 'RequestHeaderFieldsTooLarge', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 431, statusText: 'RequestHeaderFieldsTooLarge' });
    }
}

/**
 * [451 Unavailable For Legal Reasons](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/451) —
 * indicates that the user requested a resource that is not available for legal reasons,
 * such as a web page censored by a government.
*/
export class UnavailableForLegalReasons<const T = undefined> extends KitResponse<451, 'UnavailableForLegalReasons', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 451, statusText: 'UnavailableForLegalReasons' });
    }
}
// #endregion





// *                     *
// *  5×× Server Errors  *
// *                     *
// #region 5×× Server Errors






/**
 * [500 Internal Server Error](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/500) —
 * indicates that the server encountered an unexpected condition that prevented it
 * from fulfilling the request.
*/
export class InternalServerError<const T = undefined> extends KitResponse<500, 'InternalServerError', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 500, statusText: 'InternalServerError' });
    }
}

/**
 * [501 Not Implemented](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/501) —
 * indicates that the server does not support the functionality required to fulfill the request.
*/
export class NotImplemented<const T = undefined> extends KitResponse<501, 'NotImplemented', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 501, statusText: 'NotImplemented' });
    }
}

/**
 * [502 Bad Gateway](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/502) —
 * indicates that the server, while acting as a gateway or proxy, received an invalid response
 * from the upstream server it accessed in attempting to fulfill the request.
*/
export class BadGateway<const T = undefined> extends KitResponse<502, 'BadGateway', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 502, statusText: 'BadGateway' });
    }
}

/**
 * [503 Service Unavailable](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/503) —
 * indicates that the server is currently unable to handle the request due to a temporary overload
 * or scheduled maintenance, which will likely be alleviated after some delay.
*/
export class ServiceUnavailable<const T = undefined> extends KitResponse<503, 'ServiceUnavailable', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 503, statusText: 'ServiceUnavailable' });
    }
}

/**
 * [504 Gateway Timeout](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/504) —
 * indicates that the server, while acting as a gateway or proxy, did not receive a timely response
 * from the upstream server specified by the URI (e.g. [HTTP](https://developer.mozilla.org/en-US/docs/Glossary/HTTP)
 * or [FTP](https://developer.mozilla.org/en-US/docs/Glossary/FTP)) or some other auxiliary server (e.g. DNS)
 * it needed to access in attempting to complete the request.
*/
export class GatewayTimeout<const T = undefined> extends KitResponse<504, 'GatewayTimeout', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 504, statusText: 'GatewayTimeout' });
    }
}

/**
 * [505 HTTP Version Not Supported](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/505) —
 * indicates that the server does not support, or refuses to support, the
 * [HTTP protocol](https://developer.mozilla.org/en-US/docs/Glossary/HTTP) version that was used
 * in the request message.
*/
export class HTTPVersionNotSupported<const T = undefined> extends KitResponse<505, 'HTTPVersionNotSupported', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 505, statusText: 'HTTPVersionNotSupported' });
    }
}

/**
 * [506 Variant Also Negotiates](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/506) —
 * indicates that the server has an internal configuration error: the chosen variant resource is
 * configured to engage in transparent content negotiation itself, and is therefore not a proper
 * end point in the negotiation process.
*/
export class VariantAlsoNegotiates<const T = undefined> extends KitResponse<506, 'VariantAlsoNegotiates', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 506, statusText: 'VariantAlsoNegotiates' });
    }
}

/**
 * [507 Insufficient Storage](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/507) —
 * indicates that the method could not be performed on the resource because the server is unable
 * to store the representation needed to successfully complete the request.
*/
export class InsufficientStorage<const T = undefined> extends KitResponse<507, 'InsufficientStorage', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 507, statusText: 'InsufficientStorage' });
    }
}

/**
 * [508 Loop Detected](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/508) —
 * indicates that the server terminated an operation because it encountered an infinite loop while
 * processing a request with "Depth: infinity". This status indicates that the entire operation failed.
*/
export class LoopDetected<const T = undefined> extends KitResponse<508, 'LoopDetected', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 508, statusText: 'LoopDetected' });
    }
}

/**
 * [510 Not Extended](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/510) —
 * indicates that further extensions to the request are required for the server to fulfill it.
*/
export class NotExtended<const T = undefined> extends KitResponse<510, 'NotExtended', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 510, statusText: 'NotExtended' });
    }
}

/**
 * [511 Network Authentication Required](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/511) —
 * indicates that the client needs to authenticate to gain network access.
*/
export class NetworkAuthenticationRequired<const T = undefined> extends KitResponse<511, 'NetworkAuthenticationRequired', T, false> {
    constructor(body?: T, options: Options = {}) {
        super(body, { ...options, status: 511, statusText: 'NetworkAuthenticationRequired' });
    }
}

// #endregion




