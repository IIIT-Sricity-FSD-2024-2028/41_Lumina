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

  // Ensure global-grace-guard.js is loaded across all pages
  if (!document.getElementById('lumina-grace-guard-script')) {
    var guardScript = document.createElement('script');
    guardScript.id = 'lumina-grace-guard-script';
    guardScript.src = 'js/global-grace-guard.js';
    document.head.appendChild(guardScript);
  }

  var target =
    document.getElementById('footer-placeholder') ||
    document.getElementById('footer');

  if (!target) return;

  fetch('footer.html')
    .then(function (res) { return res.text(); })
    .then(function (html) {
      // Replace the placeholder element entirely with the fetched content
      target.outerHTML = html;

      // Ensure bug_report_modal.js is loaded
      if (!document.getElementById('lumina-bug-modal-script')) {
        var s = document.createElement('script');
        s.id = 'lumina-bug-modal-script';
        s.src = 'js/bug_report_modal.js';
        document.body.appendChild(s);
      }
    })
    .catch(function (err) {
      console.warn('Footer loader: could not fetch footer.html', err);
    });
})();

