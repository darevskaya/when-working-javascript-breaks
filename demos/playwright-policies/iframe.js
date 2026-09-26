const status = document.querySelector('#iframe-status');
const frame = document.querySelector('#frame');

const say = (text, blocked) => {
  status.textContent = text;
  status.className = blocked ? 'blocked' : 'allowed';
};

// A refused frame still fires "load", but with an error page that this
// page cannot read.
function frameTitle() {
  try {
    return frame.contentDocument?.title ?? null;
  } catch {
    return null;
  }
}

frame.addEventListener('load', () => {
  if (frameTitle() === 'A page inside an iframe') {
    say('The page loaded inside the iframe.', false);
  } else {
    say('The browser refused the page inside the iframe.', true);
  }
});
