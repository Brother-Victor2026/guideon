window.addEventListener('load', function() {
  setTimeout(function() {
    var s = document.getElementById('splashScreen');
    s.style.transition = 'opacity 0.5s';
    s.style.opacity = '0';
    setTimeout(function() { s.remove(); }, 500);
  }, 1200);
});
