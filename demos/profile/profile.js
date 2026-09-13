// The policy in the test allows https://api.example.com. This deployment
// calls a different host, so the browser refuses the connection.
const apiUrl = 'https://identity.customer.com';

const status = document.querySelector('#status');

try {
  const response = await fetch(apiUrl + '/profile');
  const profile = await response.json();
  status.textContent = `Profile loaded: ${profile.name}`;
} catch (error) {
  status.textContent = 'Profile could not load';
  status.className = 'blocked';
  console.error(error);
}
