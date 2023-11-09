// JavaScript to add a class to the header when it's not at the top of the page
window.addEventListener('scroll', function() {
    var header = document.querySelector('header'); // replace 'header' with your header's selector
    var scrollPosition = window.scrollY || window.pageYOffset;
  
    if (scrollPosition > 0) {
      header.classList.add('is-sticky');
    } else {
      header.classList.remove('is-sticky');
    }
  });
  