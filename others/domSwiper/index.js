export class SwiperBox {
  constructor(opt) {
    this.dom = opt.ele;
    this.num = 60;
    this.actDom = null;

    this.init();
  }
  init() {
    this.drawDomElement();
    this.drawInnerElement();
  }
  swipering() {
    setTimeout(() => {
      this.swiperAnimation();
    }, 0);
  }
  async swiperAnimation() {
    const swiper = this.dom.querySelector(".swiper-box");
    if (!swiper.style.transform) {
      swiper.style.transform = `translateY(calc(-100% + 9 * 70px))`;
      await this.delay(3000);
      this.domActive(
        this.dom.querySelectorAll(".swiper-item")[
          Math.floor(Math.random() * 9) + this.num - 9
        ]
      );
    } else {
      swiper.style.transform = "";
      await this.delay(3000);
      this.domActive(
        this.dom.querySelectorAll(".swiper-item")[Math.floor(Math.random() * 9)]
      );
    }
  }
  domActive(dom) {
    if (this.actDom) this.actDom.classList.remove("act-swiper-item");
    this.actDom = dom;
    this.actDom.classList.add("act-swiper-item");
  }
  drawDomElement() {
    const temp = `
    <div  class="swiper-wrap">
    <div class="box-title">
    <img src="./img/title-icon.png" alt="" /> AI 指纹库
  </div>
  <div class="swiper">
    <div class="swiper-box swiper-transition">
    </div>
  </div>
    </div>
    `;
    this.dom.insertAdjacentHTML("beforeEnd", temp);
  }
  drawInnerElement() {
    new Array(this.num).fill(0).forEach((item, i) => {
      const temp = `
      <div class="swiper-item">
            <span></span>
            <div class="canvas-box${i}"></div>
            <img src="./img/finger${i % 6}.png" />
      </div>
      `;
      this.dom
        .querySelector(".swiper-box")
        .insertAdjacentHTML("beforeEnd", temp);
      this.dom.querySelector(`.canvas-box${i}`).appendChild(this.makeLine());
    });
  }

  makeLine() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const height = 45;
    const width = 300;
    const margin = 10;
    const Horizontal = 15;
    canvas.height = height;
    canvas.width = width;
    ctx.lineJoin = "round";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin, height / 2);
    let x = margin + Horizontal;
    ctx.lineTo(x, height / 2);

    new Array(16).fill(0).forEach((item, i) => {
      const symble = i % 2 === 0 ? -1 : 1;
      ctx.lineTo(
        (x += Math.random() * 10 + 10),
        Math.random() * (height / 2) * symble + height / 2
      );
    });
    ctx.lineTo((x += Horizontal), height / 2);
    ctx.lineTo((x += margin), height / 2);
    ctx.strokeStyle = "#00ffff";
    ctx.stroke();
    return canvas;
  }
  delay(time = 1000) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  }
}
