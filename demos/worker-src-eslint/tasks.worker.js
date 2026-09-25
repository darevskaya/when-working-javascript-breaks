// The work the page moves off the main thread.
const answer = ({ kind, amounts }) => {
  if (kind === 'total') {
    const sum = amounts.reduce((running, amount) => running + amount, 0);
    return sum.toFixed(2);
  }
  return 'ok';
};

onmessage = ({ data }) => postMessage(answer(data));
