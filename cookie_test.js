// cookie_test.ts
import http from "k6/http";
import { check, sleep } from "k6";
var options = {
  vus: 1,
  iterations: 1
};
function cookie_test_default() {
  const url = "https://www.google.com";
  const res = http.get(url);
  check(res, {
    "status is 200": (r) => r.status === 200
  });
  console.log("############# Response headers ###########################################################################################################################################################################################################################");
  for (const h in res.headers) {
    console.log(`${h}: ${res.headers[h]}`);
  }
  console.log("###########################################################################################################################################################################################################################################################");
  console.log("############# Looking for a specific headers elment ######################################################################################################################################################################################################");
  const uaCompat = res.headers["X-Frame-Options"] || res.headers["x-frame-Options"];
  if (uaCompat) {
    console.log("X-Frame-Options FOUND:", uaCompat);
  } else {
    console.log("X-Frame-Options: not present");
  }
  console.log("###########################################################################################################################################################################################################################################################");
  console.log("############# Logging all Cookies form Response name path doman ###########################################################################################################################################################################################################");
  if (res.cookies && Object.keys(res.cookies).length > 0) {
    for (const name in res.cookies) {
      const cookie = res.cookies[name][0];
      console.log(`Cookie: ${name}=${cookie.value}; path=${cookie.path}; domain=${cookie.domain}; httpOnly=${cookie.httpOnly}; secure=${cookie.secure}`);
    }
  } else {
    console.log("No cookies found in response");
  }
  console.log("###########################################################################################################################################################################################################################################################");
  sleep(1);
}
export {
  cookie_test_default as default,
  options
};
