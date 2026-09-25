const button = document.querySelector('#complete-login');

button.addEventListener('click', () => {
  location.assign(`/provider/login/approve${location.search}`);
});
