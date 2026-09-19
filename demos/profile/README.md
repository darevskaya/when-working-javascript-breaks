# Profile: connect-src

The server sends no policy. `npm run stage` runs a Playwright test that adds
`connect-src 'self' https://api.example.com` to the document response. The
page calls `https://identity.customer.com`, so the browser refuses the
connection. The test fails on purpose.

`npm run lint` flags the API host in `profile.js`.
