/* Logo: the ring spins once on click */
document.addEventListener('click', function (e) {
  var b = e.target.closest && e.target.closest('.brand, .gnb__brand');
  if (!b) return;
  var r = b.querySelector('.lring');
  if (!r || !r.animate) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  r.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 700, easing: 'cubic-bezier(.65,0,.35,1)' });
  var href = b.getAttribute('href') || '';
  if (href.charAt(0) === '#' || e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
  e.preventDefault();
  setTimeout(function () { window.location.href = b.href; }, 520);
});
