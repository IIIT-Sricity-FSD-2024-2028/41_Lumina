/**
 * footer-loader.js
 * Lightweight, dependency-free script that injects the canonical
 * Lumina footer from footer.html into every page.
 *
 * Usage — add one of these to your page:
 *   <div id="footer-placeholder"></div>
 *   OR
 *   <footer id="footer"></footer>
 *
 * Then include this script:
 *   <script src="js/footer-loader.js"></script>
 */
(function () {
  'use strict';

  var target =
    document.getElementById('footer-placeholder') ||
    document.getElementById('footer');

  if (!target) return;

  fetch('footer.html')
    .then(function (res) { return res.text(); })
    .then(function (html) {
      // Replace the placeholder element entirely with the fetched content
      target.outerHTML = html;
    })
    .catch(function (err) {
      console.warn('Footer loader: could not fetch footer.html', err);
    });
})();
