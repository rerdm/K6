// cookie_test.ts
// Simple k6 test (TypeScript) that requests Google, extracts cookies from the response, and logs them.

import http from 'k6/http';
import { check, sleep } from 'k6';


// Test options
// vus = virtual users
// iterations = number of iterations per VU

export let options = {
  vus: 1,
  iterations: 1,
};

export default function () {

  // Request to Google
  const url = 'https://www.google.com';
  const res = http.get(url);

  // Basic check if the request was successful
  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  // Losg teh response headers
  console.log('############# Response headers ###########################################################################################################################################################################################################################');
  for (const h in res.headers) {
    console.log(`${h}: ${res.headers[h]}`);
  }
  console.log('###########################################################################################################################################################################################################################################################')
  // Response Handling
  // Save the specific cookie if from teh response header (Log X-Frame-Options) if it is present ( Google-specific)
  // Important when the next reauest depends on the cookie or calkulat a new value form it
  console.log('############# Looking for a specific headers elment ######################################################################################################################################################################################################');

  const uaCompat = res.headers['X-Frame-Options'] || res.headers['x-frame-Options'];
  if (uaCompat) {
    console.log('X-Frame-Options FOUND:', uaCompat);
  } else {
    console.log('X-Frame-Options: not present');
  }
  console.log('###########################################################################################################################################################################################################################################################')
  // Extract cookies from response and log details
  console.log('############# Logging all Cookies form Response name path doman ###########################################################################################################################################################################################################');

  if (res.cookies && Object.keys(res.cookies).length > 0) {
    for (const name in res.cookies) {
      const cookie = res.cookies[name][0];
      console.log(`Cookie: ${name}=${cookie.value}; path=${cookie.path}; domain=${cookie.domain}; httpOnly=${cookie.httpOnly}; secure=${cookie.secure}`);
    }
  } else {
    console.log('No cookies found in response');
  }
 console.log('###########################################################################################################################################################################################################################################################')

  sleep(1);
}
