const button = document.querySelector('#complete-login');

button.addEventListener('click', () => {
  location.assign(`/login/approve${location.search}`);
});
