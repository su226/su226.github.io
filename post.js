(() => {
  document.querySelector(".sidebar").appendChild(document.querySelector(".toc"));

  for (const i of document.querySelectorAll(".tab")) {
    const targets = [];
    const bar = document.createElement("div");
    bar.className = "tab-bar";
    let activeIndex = 0;
    for (const [index, child] of Array.from(i.children).entries()) {
      const target = document.querySelector(child.dataset.target);
      targets.push(target);
      target.classList.add("tab-hidden");
      child.addEventListener("click", () => {
        targets[activeIndex].classList.add("tab-hidden");
        activeIndex = index;
        targets[index].classList.remove("tab-hidden");
        bar.style.left = `${child.offsetLeft}px`;
        bar.style.width = `${child.clientWidth}px`;
      });
    }
    i.appendChild(bar);
    i.firstElementChild.click();
  }
  
  for (const highlight of document.querySelectorAll(".highlight")) {
    const gutter = highlight.querySelector(".gutter pre");
    gutter.className = "gutter-pre";
    const code = highlight.querySelector(".code pre");
    code.className = "code-pre";
    highlight.appendChild(code)
    highlight.appendChild(gutter);
    highlight.firstElementChild.remove();
    highlight.style.paddingLeft = `${gutter.clientWidth}px`;
    const copy = document.createElement("button");
    copy.addEventListener("click", () => {
      const textarea = document.createElement("textarea");
      textarea.textContent = code.textContent;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("Copy");
      textarea.remove();
    });
    copy.className = "copy btn-icon waves-effect mdi mdi-content-copy";
    highlight.appendChild(copy);
  }

  for (const i of document.querySelectorAll(".toc-link")) {
    const elem = document.getElementById(decodeURI(i.hash).slice(1));
    i.addEventListener("click", e => {
      e.preventDefault();
      const top = elem.getBoundingClientRect().top - 80;
      try {
        window.scrollBy({
          top: top,
          behavior: "smooth"
        });
      } catch (e) {
        window.scrollBy(0, top);
      }
    });
  }
  
  const navbar = document.querySelector(".navbar");
  const number = document.createElement("span");
  navbar.insertBefore(number, document.querySelector("#back-to-top"));
  const progress = document.createElement("div");
  progress.className = "page-progress";
  navbar.appendChild(progress);
  const content = document.querySelector("#content");
  function update() {
    const viewHeight = document.documentElement.clientHeight;
    const scrollTop = document.documentElement.scrollTop;
    const pageBottom = content.clientHeight + content.offsetTop;
    const percentage = Math.round(Math.min(scrollTop / (pageBottom - viewHeight), 1) * 100) + "%";
    progress.style.width = percentage;
    number.textContent = percentage;
  }
  window.addEventListener("scroll", update);
  window.addEventListener("resize", update);
  update();
  
  Waves.attach(".tab-item");
  Waves.attach(".toc-link");
})();