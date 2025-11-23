<!-- filepath: c:\Users\rerdmann\OneDrive - Capgemini\1. Sogeti\19. Tools_Programming\GitHub\K6\README.md -->
# k6 — Guide for Performance Testing (TypeScript)

This guide explains what k6 is, how to install it, and how to write, configure, and run performance tests using TypeScript. The goal is to enable you to install k6, set up necessary dependencies, create a working test script, and handle cookies across requests.

## Table of Contents
- [1. Introduction](#introduction)
- [2. Prerequisites](#prerequisites)
- [3. Installing k6](#installing-k6)
  - [Windows (downloaded .exe)](#windows)
  - [Linux (Debian/Ubuntu example)](#linux)
  - [Verify installation](#verify-installation)
- [4. TypeScript workflow](#typescript-workflow)
  - [tsc example](#tsc-example)
  - [esbuild example](#esbuild-example)
  - [Project example: cookie_test.ts and package.json](#project-example)
- [5. Basic structure of a k6 script](#basic-structure)
- [6. Load profile configuration (virtual users, stages, thresholds)](#load-profile)
  - [virtual users (VUs) / duration](#virtual-users)
  - [stages](#stages)
  - [thresholds](#thresholds)
- [7. HTTP requests: GET, POST, headers](#http-requests)
  - [GET example](#get-example)
  - [POST with JSON](#post-json)
  - [Setting custom headers](#custom-headers)
- [8. Mini Projekt: cookie_test.ts](#cookies)
  - [Extract cookie from a response](#extract-cookie)
  - [Reading response headers & Set-Cookie](#reading-headers)
  - [Send cookies in subsequent requests](#send-cookies)
  - [Notes on k6 cookie handling](#cookie-notes)
- [9. Running tests](#running-tests)
  - [Compile (TypeScript)](#compile-ts)
  - [Run with k6](#run-k6)
  - [CI / export results](#ci-export)
- [10. Logging](#logging)
- [11. Reports](#reports)
- [12. Troubleshooting](#troubleshooting)
- [13. Useful links](#useful-links)

---

<a id="introduction"></a>
## 1. Introduction

k6 is an open-source load testing tool for writing automated performance tests in JavaScript/TypeScript. Typical use cases:
- Load and stress testing of APIs and web applications
- Measuring latency, throughput, and error rates
- Integration into CI/CD pipelines

k6 is lightweight, implemented in Go, and distributed as a native binary. It executes JavaScript; if you use TypeScript, compile `.ts` files to `.js` before running.

---

<a id="prerequisites"></a>
## 2. Prerequisites

- Node.js (for TypeScript development and build tools)
- npm or yarn
- TypeScript (if you write `.ts` files)
- k6 binary

Optional: install TypeScript globally for development:

```sh
npm install -g typescript
```

---

<a id="installing-k6"></a>
## 3. Installing k6

<a id="windows"></a>
### Windows (downloaded .exe)

If you downloaded the k6 Windows executable or installer from https://k6.io/open-source/, run the installer or place the k6 binary in a folder on your PATH. Typical steps:

1. Run the downloaded installer (if it's an installer `.exe`) and follow prompts.
2. If you have a standalone `k6.exe`, move it to a directory on your PATH (for example `C:\Windows\System32` or a custom folder added to PATH).
3. Open a new PowerShell or Command Prompt and verify `k6` is accessible.

<a id="linux"></a>
### Linux (Debian/Ubuntu example)

```sh
sudo apt install -y gnupg
curl -s https://dl.k6.io/key.gpg | sudo apt-key add -
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt update
sudo apt install k6
```

<a id="verify-installation"></a>
### Verify installation

```sh
k6 --version
```




<a id="basic-structure"></a>
## 5. Basic structure of a k6 script

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 10,          // concurrent virtual users
  duration: '30s',  // test duration
};

export default function () {
  const res = http.get('https://test.k6.io');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
```

---

<a id="load-profile"></a>
## 6. Load profile configuration (virtual users, stages, thresholds)

<a id="virtual-users"></a>
### virtual users (vus) / duration

Key options:
- `vus`: fixed number of virtual users (VUs) — the number of concurrent simulated users that execute the script and generate load
- `duration`: total test duration (e.g. '30s', '5m')

<a id="stages"></a>
### stages

- `stages`: ramp up/down profile

<a id="thresholds"></a>
### thresholds

- `thresholds`: pass/fail criteria for metrics

Example with stages and threshold:

```javascript
export let options = {
  stages: [
    { duration: '1m', target: 20 },
    { duration: '3m', target: 20 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95) < 500'],
  },
};
```

---

<a id="http-requests"></a>
## 7. HTTP requests: GET, POST, headers

<a id="get-example"></a>
### GET example

```javascript
const res = http.get('https://example.com/api/resource');
```

<a id="post-json"></a>
### POST with JSON

```javascript
const payload = JSON.stringify({ key: 'value' });
const params = { headers: { 'Content-Type': 'application/json' } };
const res = http.post('https://example.com/api', payload, params);
```

<a id="custom-headers"></a>
### Setting custom headers

```javascript
const res = http.get('https://example.com', { headers: { 'Accept': 'application/json' } });
```

---


## 8. Mini Projekt : cookie_test.ts

This project (`cookie_test`) demonstrates how to use k6 to send HTTP requests and handle cookies returned by the server. It shows both the high-level, structured access k6 provides (`res.cookies`) and the raw header approach, and explains how to reuse a cookie for an authenticated follow-up request. Note: k6 automatically stores and sends cookies for subsequent requests within the same VU, but manual extraction is useful when you need to inspect, transform, or forward cookies explicitly.

<a id="extract-cookie"></a>
### Extract cookie from a response

Example — extract a cookie value (structured) and send it back:

```javascript
import http from 'k6/http';

export default function () {
  const loginRes = http.post('https://example.com/login', JSON.stringify({ user: 'alice', pass: 'secret' }), {
    headers: { 'Content-Type': 'application/json' },
  });

  // structured access (recommended)
  const sessionCookie = loginRes.cookies['session'] ? loginRes.cookies['session'][0].value : null;

  if (sessionCookie) {
    const params = { headers: { Cookie: `session=${sessionCookie}` } };
    const protectedRes = http.get('https://example.com/protected', params);
  }
}
```

<a id="reading-headers"></a>
### Reading response headers & Set-Cookie

Example — read raw Set-Cookie header (when you need the full header string):

```javascript
// raw Set-Cookie header may contain attributes; use with care
const rawSetCookie = loginRes.headers['Set-Cookie'];
const params = { headers: { Cookie: rawSetCookie } };
```

<a id="send-cookies"></a>
### Send cookies in subsequent requests

To manually send cookies you can set the `Cookie` header as shown above. Prefer `res.cookies` for simple access; use manual headers when you need full control over attributes or to forward Set-Cookie strings between domains or different clients.

<a id="cookie-notes"></a>
### Notes on k6 cookie handling

- k6 automatically manages cookies per VU for requests made by the same VU.
- Use `res.cookies` for structured access to cookie values and attributes.
- Use raw `Set-Cookie` header only when you need to forward the full header or preserve attributes verbatim.
Tip: prefer res.cookies for simple access. Use manual headers when you need full control over cookie attributes or to forward Set-Cookie strings between domains or different clients.

---


<a id="running-tests"></a>
## 9. Running tests

Run compiled JS with the k6 binary or use the `k6` CLI directly against a JS file.

<a id="compile-ts"></a>
### Compile (TypeScript)

Compile TypeScript to JavaScript before running k6 (see the TypeScript workflow above).

<a id="ci-export"></a>
### CI / export results

Use `k6 run --out json=results.json script.js` to export machine-readable results for CI.


<a id="running-tests"></a>

<a id="run-k6"></a>
### Run with k6

```sh
k6 run script.js
```

---

<a id="logging"></a>
## 10. Logging

Below is a representative example of output you may see when running a k6 test. This is a simplified sample to illustrate common lines and the end-of-run summary:

```text
$ k6 run --vus 10 --duration 30s script.js
running (30.0s), 10/10 VUs, 300 complete and 0 interrupted iterations
default ✓ [======================================] 10 VUs  30s
     data_received........: 1.23 MB  41 kB/s
     data_sent............: 12.3 kB 410 B/s
     http_reqs............: 300      10.000/s
     iteration_duration...: avg=120ms p(95)=240ms max=400ms
     http_req_duration....: avg=100ms p(95)=220ms max=350ms
     checks...............: 300 100.00% passed
     vus_max..............: 10

thresholds................: all passed
```

Explanations of the main components:
- Running line: shows elapsed time, current/target VUs, and iteration counts (completed / interrupted).
- Scenario progress line: visual progress bar, VUs and planned duration.
- data_received / data_sent: total bandwidth transferred during the test.
- http_reqs: total number of HTTP requests and average request rate.
- iteration_duration / http_req_duration: latency/response time metrics (avg, p(95), max).
- checks: number and percentage of passed checks (useful for functional assertions in the script).
- vus_max: the maximum number of VUs reached during the run.
- thresholds: overall pass/fail status if thresholds were defined in options.

If thresholds failed, k6 will print failed thresholds and exit with non-zero exit code — useful for CI to mark the run as failed.

<a id="reports"></a>
## 11. Reports

JSON export (built-in):
  - `k6 run --out json=test-restults/result.json cookie_test.js` — produces a machine-readable results file that can be archived or processed by CI steps.
<a id="troubleshooting"></a>
### 12.1 Troubleshooting

If you run into build or runtime errors when using the TypeScript example, here are the concrete steps that fix the most common issues (short and actionable):

1. tsc not found in PATH
  - Problem: Running `tsc cookie_test.ts --outFile cookie_test.js` may fail if you don't have the TypeScript compiler installed globally.
  - Fix: Use the project-local TypeScript (installed via npm) or install globally:

```powershell
npm install        # installs local devDependencies defined in package.json
npm run build      # builds the script using esbuild (configured to keep k6 imports external)
```

3. Build and run (example)
  - Build with the project's script (uses esbuild and keeps k6 external):

```powershell
npm install
npm run build
```

  - Run k6 and create a JSON report:

```powershell
k6 run --out json=results.json cookie_test.js
```

---

<a id="useful-links"></a>
## 12. Useful links

- Official k6 docs: https://k6.io/docs
- k6 GitHub: https://github.com/grafana/k6

---

End of guide. Use or extend this README as needed for your project.
