const answer = ({ kind, amounts }) => {
  if (kind === 'total') {
    return amounts.reduce((total, amount) => total + amount, 0).toFixed(2);
  }
  return 'ok';
};

onmessage = ({ data }) => postMessage(answer(data));
