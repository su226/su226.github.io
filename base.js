let navbar = document.querySelector(".navbar");
let header = document.querySelector(".post-header");

function scroll() {
  navbar.classList.toggle("navbar-active", document.documentElement.scrollTop > 0)
}

scroll();
window.addEventListener("scroll", scroll);

if (
  localStorage.getItem("sidebar-toggled") == "true" &&
  document.documentElement.clientWidth > 768
) {
  document.body.classList.add("no-transition");
  document.body.classList.add("sidebar-toggled");
  requestAnimationFrame(() => {
    document.body.classList.remove("no-transition");
  });
}

document.querySelector("#toggle-menu").addEventListener("click", () => {
  const value = document.body.classList.toggle("sidebar-toggled");
  localStorage.setItem("sidebar-toggled", value);
});

document.querySelector("#back-to-top").addEventListener("click", () => {
  try {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  } catch (e) {
    window.scrollTo(0, 0);
  }
});

document.querySelector(".sidebar-background").addEventListener("click", () => {
  document.body.classList.remove("sidebar-toggled");
});

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

let beginX = 0;
const DRAG_THRESOLD = 32;
const sidebar = document.querySelector(".sidebar");

window.addEventListener("touchstart", e => {
  beginX = e.touches[0].clientX;
});

window.addEventListener("touchmove", e => {
  if (document.documentElement.clientWidth > 768) {
    return;
  }
  const deltaX = e.touches[0].clientX - beginX;
  if (document.body.classList.contains("sidebar-toggled")) {
    if (deltaX < -32) {
      sidebar.style.marginLeft = `${clamp(deltaX + 32, -240, 0)}px`;
      document.body.classList.add("sidebar-dragging");
    }
  } else {
    if (deltaX > 32) {
      sidebar.style.marginLeft = `${clamp(deltaX - 32, 0, 240)}px`;
      document.body.classList.add("sidebar-dragging");
    }
  }
});

window.addEventListener("touchend", e => {
  if (document.body.classList.contains("sidebar-toggled")) {
    if (parseInt(sidebar.style.marginLeft) < -120) {
      document.body.classList.remove("sidebar-toggled");
    }
  } else {
    if (parseInt(sidebar.style.marginLeft) > 120) {
      document.body.classList.add("sidebar-toggled");
    }
  }
  document.body.classList.remove("sidebar-dragging");
  sidebar.style.marginLeft = "0px";
});

Waves.init();
Waves.attach(".btn-icon");
Waves.attach(".menu-link");
Waves.attach(".post-link");
Waves.attach(".chip");
Waves.attach(".filter a");
