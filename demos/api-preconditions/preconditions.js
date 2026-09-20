// Eleven web APIs that ask for very different things before they run. Each entry
// keeps the assumptions next to the call, so the page can show what the API
// wants and what the browser did with it. The `needs` lines come from MDN, and
// `mdn` links to the page they come from.
const mdn = (path) => `https://developer.mozilla.org/en-US/docs/Web/${path}`;

export const apis = [
  {
    id: 'digest',
    call: 'crypto.subtle.digest()',
    needs: ['secure context'],
    mdn: mdn('API/SubtleCrypto/digest'),
    async run() {
      const bytes = new TextEncoder().encode('when working javascript breaks');
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      return `${digest.byteLength * 8}-bit digest`;
    },
  },
  {
    id: 'service-worker',
    call: 'navigator.serviceWorker.register()',
    needs: ['secure context', 'same-origin script URL'],
    mdn: mdn('API/ServiceWorkerContainer/register'),
    async run() {
      const registration =
        await navigator.serviceWorker.register('/service-worker.js');
      await registration.unregister();
      return `scope ${new URL(registration.scope).pathname}`;
    },
  },
  {
    id: 'storage',
    call: 'navigator.storage.estimate()',
    needs: ['secure context'],
    mdn: mdn('API/StorageManager/estimate'),
    async run() {
      const { quota } = await navigator.storage.estimate();
      return `quota ${Math.round(quota / 1e6)} MB`;
    },
  },
  {
    id: 'clipboard',
    call: 'navigator.clipboard.writeText()',
    needs: ['secure context', 'transient activation'],
    permission: 'clipboard-write',
    mdn: mdn('API/Clipboard/writeText'),
    async run() {
      await navigator.clipboard.writeText('when working javascript breaks');
      return 'text written';
    },
  },
  {
    id: 'clipboard-timer',
    call: 'navigator.clipboard.writeText() one second later',
    needs: ['secure context', 'transient activation that still holds'],
    mdn: mdn('Security/Defenses/User_activation'),
    run() {
      return new Promise((resolve, reject) => {
        // Lint flags this line. Transient activation expires, so a timer
        // callback can run without it. One second is short enough that
        // Chrome still allows the call, and lint is the only thing that sees
        // the problem.
        setTimeout(
          () =>
            navigator.clipboard
              .writeText('late text')
              .then(() => resolve('text written after the timer'), reject),
          1000,
        );
      });
    },
  },
  {
    id: 'fullscreen',
    call: 'document.documentElement.requestFullscreen()',
    needs: ['transient activation', 'Permissions-Policy: fullscreen'],
    permission: 'fullscreen',
    mdn: mdn('API/Element/requestFullscreen'),
    async run() {
      await document.documentElement.requestFullscreen();
      await document.exitFullscreen();
      return 'entered and left fullscreen';
    },
  },
  {
    id: 'geolocation',
    call: 'navigator.geolocation.getCurrentPosition()',
    needs: [
      'secure context',
      'user permission',
      'Permissions-Policy: geolocation',
    ],
    permission: 'geolocation',
    mdn: mdn('API/Geolocation/getCurrentPosition'),
    run() {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) =>
            resolve(
              `${coords.latitude.toFixed(1)}, ${coords.longitude.toFixed(1)}`,
            ),
          (failure) =>
            reject(new Error(`code ${failure.code}: ${failure.message}`)),
          { timeout: 3000 },
        );
      });
    },
  },
  {
    id: 'wake-lock',
    call: 'navigator.wakeLock.request()',
    needs: [
      'secure context',
      'visible document',
      'Permissions-Policy: screen-wake-lock',
    ],
    permission: 'screen-wake-lock',
    mdn: mdn('API/WakeLock/request'),
    async run() {
      // Lint flags this guard. The property is there in this browser, and the
      // call can still fail on the policy, on the visibility state, or on a
      // low battery.
      if (navigator.wakeLock) {
        const sentinel = await navigator.wakeLock.request('screen');
        await sentinel.release();
        return 'screen lock held and released';
      }
      return 'no wakeLock in this browser';
    },
  },
  {
    id: 'shared-memory',
    call: 'new SharedArrayBuffer()',
    needs: ['secure context', 'cross-origin isolation (COOP and COEP)'],
    mdn: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer',
    async run() {
      const buffer = new SharedArrayBuffer(16);
      return `${buffer.byteLength} shared bytes`;
    },
  },
  {
    id: 'audio',
    call: 'new AudioContext()',
    needs: ['sticky activation for sound'],
    mdn: mdn('Media/Guides/Autoplay'),
    async run() {
      const context = new AudioContext();
      const { state } = context;
      await context.close();
      return `state ${state}`;
    },
  },
  {
    id: 'notification',
    call: 'Notification.requestPermission()',
    needs: ['secure context', 'a user gesture in Chrome and Safari'],
    permission: 'notifications',
    mdn: mdn('API/Notification/requestPermission_static'),
    async run() {
      return `answer ${await Notification.requestPermission()}`;
    },
  },
];
