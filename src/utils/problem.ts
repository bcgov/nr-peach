// Inspired by https://github.com/ahmadnassri/node-api-problem
import { STATUS_CODES } from 'node:http';

import type { Request, Response } from 'express';

const CONTENT_TYPE = 'application/problem+json';
const DEFAULT_TYPE = 'about:blank';
const ERR_STATUS =
  '"status" must be a valid HTTP Error Status Code ([RFC7231], Section 6)';
const ERR_TITLE =
  'missing "title". a short, human-readable summary of the problem type';
const STATUS_CODES_WEB =
  'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/';

/**
 * An RFC 9457 Problem Details error generator.
 * @param status - HTTP Status Code (RFC7231, Section 6)
 * @param opts - Problem Details options
 * @param extra - Extra properties to add to the problem details object
 * @returns An Error with RFC 9457 Problem Details properties
 */
export default class Problem extends Error {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;

  constructor(
    status: number,
    opts?: {
      type?: string;
      title?: string;
      detail?: string;
      instance?: string;
    },
    extra?: object
  ) {
    if (!status) throw new Error(ERR_STATUS);
    if ((status >= 600 || status < 400) && status !== 207) {
      throw new Error(ERR_STATUS);
    }

    let type = opts?.type ?? DEFAULT_TYPE;
    if (type === DEFAULT_TYPE) {
      type = STATUS_CODES_WEB + status;
    }

    let title = opts?.title;
    if (
      !opts?.title &&
      Object.prototype.hasOwnProperty.call(STATUS_CODES, status)
    ) {
      title = STATUS_CODES[status];
    }
    if (!title) throw new Error(ERR_TITLE);

    super(`[${status}] ${title} (${type})`);
    this.type = type;
    this.title = title;
    this.status = status;
    this.detail = opts?.detail;
    this.instance = opts?.instance ?? undefined;

    if (extra) Object.assign(this, extra);
  }

  toString() {
    return `[${this.status}] ${this.title} (${this.type})`;
  }

  toObject() {
    // Escape the Error class
    return Object.fromEntries(new Map(Object.entries(this)));
  }

  send(req: Request, res: Response, space: string | number = 2) {
    this.instance ??= req.originalUrl;
    res.writeHead(this.status, { 'Content-Type': CONTENT_TYPE });
    res.end(JSON.stringify(this, null, space));
  }
}
