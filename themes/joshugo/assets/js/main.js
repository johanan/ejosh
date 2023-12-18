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

function createCarousel(speed, element) {
  var images = element.querySelectorAll("img")

  const update = index => () => {
    let previous = (index + images.length - 1) % images.length;
    let next = (index + 1) % images.length;

    const nextImage = images[index];
    nextImage.classList.add('active');
    const prevImage = images[previous];
    prevImage.classList.remove('active');
    setTimeout(update(next), speed)
  }

  update(0)();
}

window.addEventListener('load', () => {
  createCarousel(3000, document.querySelector(".carousel"));
});