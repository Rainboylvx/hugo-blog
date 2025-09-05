
(function() {
  const lightModeIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>'
  const darkModeIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>'
  const themeSwitcher = document.getElementById('theme-switcher');
  if (!themeSwitcher) {
    return;
  }

  // Set the button text based on the current theme on page load
  let currentTheme = document.documentElement.getAttribute('data-theme');

  // Update the button text
  themeSwitcher.innerHTML = currentTheme === 'dark' ? darkModeIcon : lightModeIcon;

  themeSwitcher.addEventListener('click', () => {
    // Switch theme
    currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';

    // Apply the new theme
    document.documentElement.setAttribute('data-theme', currentTheme);

    // Store the new theme in local storage
    localStorage.setItem('theme', currentTheme);

    // Update the button text
    themeSwitcher.innerHTML = currentTheme === 'dark' ? darkModeIcon : lightModeIcon;
  });
})();
