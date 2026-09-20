# iframe sandbox: top navigation

The page embeds the Orbit ID frame from port 4302. The login is a redirect: the
frame sets `window.top.location`. The pages send no policy. They differ in the
`sandbox` attribute on the iframe.

- `/demo/iframe-sandbox/no-sandbox`: the login works.
- `/demo/iframe-sandbox/sandbox-without-top-navigation`: `allow-scripts allow-same-origin`. The frame
  renders, but the click throws a `SecurityError` in the frame. The page sees
  no error.
- `/demo/iframe-sandbox/top-navigation-by-user-activation`: the same, plus
  `allow-top-navigation-by-user-activation`. The login works.

`npm run lint` flags the redirect in `redirect-frame.js`.
