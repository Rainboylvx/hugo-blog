
(function() {
  const themeSwitcher = document.getElementById('theme-switcher');
  if (!themeSwitcher) {
    return;
  }

  // Set the button text based on the current theme on page load
  let currentTheme = document.documentElement.getAttribute('data-theme');

  // Update the button text
  themeSwitcher.textContent = currentTheme === 'dark' ? '☀️' : '🌙';

  themeSwitcher.addEventListener('click', () => {
    // Switch theme
    currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';

    // Apply the new theme
    document.documentElement.setAttribute('data-theme', currentTheme);

    // Store the new theme in local storage
    localStorage.setItem('theme', currentTheme);

    // Update the button text
    themeSwitcher.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
  });
})();
