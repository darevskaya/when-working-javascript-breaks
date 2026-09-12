const controls = document.querySelector('#controls');
let frame = document.querySelector('#account-frame');

function reload() {
  const policy = controls.elements.policy.value;
  const build = controls.elements.build.value;

  // Reload the document so the browser applies the selected HTTP headers.
  const nextFrame = frame.cloneNode(false);
  nextFrame.src = `/demo/eval?policy=${policy}&build=${build}`;
  frame.replaceWith(nextFrame);
  frame = nextFrame;
}

controls.addEventListener('change', reload);
reload();
