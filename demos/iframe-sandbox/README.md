# Embedded frame: iframe sandbox

The shop embeds the Orbit ID frame from port 4174. The login is a redirect: the
frame sets `window.top.location`. The pages send no policy. They differ in the
`sandbox` attribute on the iframe.

- `/demo/embed/no-sandbox`: the login works.
- `/demo/embed/no-top-navigation`: `allow-scripts allow-same-origin`. The frame
  renders, but the click throws a `SecurityError` in the frame. The shop sees
  no error.
- `/demo/embed/user-activation`: the same, plus
  `allow-top-navigation-by-user-activation`. The login works.

`npm run lint` flags the redirect in `frame.js`.
