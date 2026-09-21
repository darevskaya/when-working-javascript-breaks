// The one file that names an origin. server.js reads this list and puts it in
// connect-src, so the browser allows exactly the origins this file names.
export const config = {
  apiOrigin: 'http://127.0.0.1:4308',
};
