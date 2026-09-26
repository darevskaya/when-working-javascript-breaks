import { test, expect } from '@playwright/test';
import { usePolicy } from './policy.js';

const pagePath = '/demo/playwright-policies/iframe';

usePolicy(pagePath);

test('the page loads inside the iframe under the policy of this project', async ({
  page,
}, testInfo) => {
  test.fail(
    testInfo.project.name === 'strict',
    "frame-ancestors 'none' refuses the page inside an iframe.",
  );
  await page.goto('/');
  const pageLoadedInIframe = await page.evaluate(
    ({ src, expectedTitle }) =>
      new Promise((resolve) => {
        const iframe = document.createElement('iframe');
        iframe.src = src;
        iframe.addEventListener('load', () => {
          // A blocked iframe still fires "load", but with an error page
          // that the parent cannot read.
          let loadedTitle = null;
          try {
            loadedTitle = iframe.contentDocument?.title ?? null;
          } catch {}
          resolve(loadedTitle === expectedTitle);
        });
        document.body.append(iframe);
      }),
    { src: pagePath, expectedTitle: 'A page inside an iframe' },
  );
  expect(pageLoadedInIframe, 'the page loads inside the iframe').toBe(true);
});
