// No eval or Function calls here. Webpack introduces eval in the broken build.
export function openProfileDialog() {
  const dialog = document.querySelector('#profile-dialog');
  document.querySelector('#display-name').value =
    document.querySelector('#current-name').textContent;
  dialog.showModal();
}
