/**
 * Lumina shared layout renderers.
 */

function renderNavbar(activePage, basePath = '') {
  const container = document.getElementById('navbar');
  if (!container) return;
  const assetPath = `${basePath}assets/icons`;

  const links = [
    { id: 'home', label: 'Home', href: `${basePath}Dean1_dashboard.html` },
    { id: 'catalog', label: 'Course Catalog', href: `${basePath}Dean1_course-catalog.html` },
    { id: 'section', label: 'Course Section Allocation', href: `${basePath}Dean1_course-section.html` },
    { id: 'timetable', label: 'Allocate Course Slots', href: `${basePath}Dean1_timetable.html` }
  ];

  const navLinksHTML = links
    .map((link) => `<a href="${link.href}" class="navbar__link ${link.id === activePage ? 'navbar__link--active' : ''}">${link.label}</a>`)
    .join('');

  container.innerHTML = `
    <div class="navbar__brand">
      <img src="${assetPath}/logo.svg" alt="Lumina logo" class="navbar__brand-logo">
      Lumina
    </div>
    <nav class="navbar__links">
      ${navLinksHTML}
    </nav>
    <div class="navbar__right">
      <button class="navbar__bell" aria-label="Notifications">
        <img src="${assetPath}/bell.svg" alt="" class="navbar__icon-image">
        <span class="navbar__bell-dot"></span>
      </button>
      <div class="navbar__profile">
        <div class="navbar__avatar">D1</div>
        Dean1
      </div>
      <button class="navbar__logout" title="Logout" aria-label="Logout" onclick="window.location.href='${basePath}login.html'">
        <img src="${assetPath}/logout.svg" alt="" class="navbar__icon-image">
      </button>
    </div>
  `;
}

function renderFooter(basePath = '') {
  const container = document.getElementById('footer');
  if (!container) return;

  fetch(basePath + 'footer.html')
    .then(function (res) { return res.text(); })
    .then(function (html) {
      container.outerHTML = html;
    })
    .catch(function (err) {
      console.warn('Dean1 footer loader: could not fetch footer.html', err);
    });
}