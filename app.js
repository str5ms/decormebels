const works = [
  { src: "assets/work-01.jpeg", title: "Спальня с радиусным зеркалом" },
  { src: "assets/work-02.jpeg", title: "Встроенный шкаф с подсветкой" },
  { src: "assets/work-03.jpeg", title: "Зонирование спальни" },
  { src: "assets/work-04.jpeg", title: "Мягкая стеновая панель" },
  { src: "assets/work-05.jpeg", title: "Рабочая зона" },
  { src: "assets/work-06.jpeg", title: "Шкаф из натурального шпона" },
  { src: "assets/work-07.jpeg", title: "Прихожая с зеркалом" },
  { src: "assets/work-08.jpeg", title: "Столовая с декоративной стеной" },
  { src: "assets/work-09.jpeg", title: "Стол и стеновые панели" },
  { src: "assets/work-10.jpeg", title: "Интерьер столовой" },
  { src: "assets/work-11.jpeg", title: "Деталь деревянных панелей" },
  { src: "assets/work-12.jpeg", title: "Гостиная с диванной зоной" },
  { src: "assets/work-13.jpeg", title: "Гостиная и кухня" },
  { src: "assets/work-14.jpeg", title: "Кухня в светлом дереве" },
  { src: "assets/work-15.jpeg", title: "Спальня со шкафом" },
  { src: "assets/work-16.jpeg", title: "Санузел с подсветкой" },
  { src: "assets/work-17.jpeg", title: "Кухня-столовая" },
  { src: "assets/work-18.jpeg", title: "Встроенная техника и двери" },
  { src: "assets/work-19.jpeg", title: "Обеденная зона" },
  { src: "assets/work-20.jpeg", title: "Санузел с мраморной плитой" },
  { src: "assets/work-21.jpeg", title: "Система шкафов" },
  { src: "assets/work-22.jpeg", title: "Шкафы в спальне" },
  { src: "assets/work-23.jpeg", title: "Коридорная система хранения" },
  { src: "assets/work-24.jpeg", title: "Современная кухня" },
  { src: "assets/work-25.jpeg", title: "Гардеробная" },
  { src: "assets/work-26.jpeg", title: "Декоративная панель с подсветкой" },
  { src: "assets/work-27.jpeg", title: "Деревянная композиция" },
  { src: "assets/work-28.jpeg", title: "Прихожая и хранение" },
  { src: "assets/work-29.jpeg", title: "Лестница и панели" },
  { src: "assets/work-30.jpeg", title: "Лестничная зона" },
  { src: "assets/work-31.jpeg", title: "Интерьер с рейками" },
  { src: "assets/work-32.jpeg", title: "Светлая мебельная группа" }
];

const API_URL =
"https://script.google.com/macros/s/AKfycbynFkaT0LCPYz5NiK__CWfoJ8dSQ6-8nz9ZzzgtAipnnxb51P4T8sj9d9BSe1TL3qDVgw/exec";

async function submitLead(lead) {

  try {

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: lead.name,
        phone: lead.phone,
        project: lead.project,
        budget: lead.budget,
        message: lead.message
      })
    });

    const result = await response.json();

    return result.success === true;

  } catch (error) {

    console.error(error);

    return false;

  }

}

function makeLead(form) {

  const data = new FormData(form);

  return {

    name: (data.get("name") || "").trim(),

    phone: (data.get("phone") || "").trim(),

    project: data.get("project") || "",

    budget: data.get("budget") || "",

    message: (data.get("message") || "").trim()

  };

}
function setupLeadForm() {

  const form = document.querySelector("[data-lead-form]");

  if (!form) return;

  const status = form.querySelector("[data-form-status]");

  form.addEventListener("submit", async (event) => {

    event.preventDefault();

    status.textContent = "";

    const lead = makeLead(form);

    if (!lead.name || !lead.phone) {

      status.textContent =
        "Пожалуйста, заполните имя и телефон.";

      return;

    }

    status.textContent = "Отправляем заявку...";

    const success = await submitLead(lead);

    if (!success) {

      status.textContent =
        "❌ Не удалось отправить заявку. Попробуйте ещё раз.";

      return;

    }

    const text =
`Здравствуйте!

Новая заявка с сайта Decor Mebel KZ.

👤 Имя: ${lead.name}
📞 Телефон: ${lead.phone}
🏠 Проект: ${lead.project || "-"}
💰 Бюджет: ${lead.budget || "-"}
💬 Комментарий: ${lead.message || "-"}`;

    form.reset();

    status.textContent =
      "✅ Заявка успешно отправлена! Сейчас откроется WhatsApp...";

    setTimeout(() => {

      window.open(
        `https://wa.me/77475123621?text=${encodeURIComponent(text)}`,
        "_blank"
      );

    }, 700);

  });

}
/* ===========================
   Галерея
=========================== */

function setupLightbox() {

  const lightbox = document.querySelector("[data-lightbox]");

  if (!lightbox) return;

  const image = lightbox.querySelector("[data-lightbox-image]");
  const title = lightbox.querySelector("[data-lightbox-title]");
  const thumbs = lightbox.querySelector("[data-lightbox-thumbs]");

  let active = 0;

  function render() {

    image.src = works[active].src;
    image.alt = works[active].title;
    title.textContent = works[active].title;

    thumbs.querySelectorAll("button").forEach((button, index) => {
      button.classList.toggle("active", index === active);
    });

  }

  function open(index) {

    active = index;

    lightbox.classList.add("open");

    document.body.style.overflow = "hidden";

    render();

  }

  function close() {

    lightbox.classList.remove("open");

    document.body.style.overflow = "";

  }

  function move(step) {

    active = (active + step + works.length) % works.length;

    render();

  }

  thumbs.innerHTML = works.map((work, index) => `
      <button
        type="button"
        data-thumb="${index}"
        aria-label="${work.title}">
        <img src="${work.src}" alt="${work.title}">
      </button>
  `).join("");

  document.querySelectorAll("[data-gallery-index]").forEach(button => {

    button.addEventListener("click", () => {

      open(Number(button.dataset.galleryIndex));

    });

  });

  thumbs.addEventListener("click", event => {

    const button = event.target.closest("[data-thumb]");

    if (!button) return;

    active = Number(button.dataset.thumb);

    render();

  });

  lightbox
    .querySelector("[data-close]")
    .addEventListener("click", close);

  lightbox
    .querySelector("[data-prev]")
    .addEventListener("click", () => move(-1));

  lightbox
    .querySelector("[data-next]")
    .addEventListener("click", () => move(1));

  lightbox.addEventListener("click", event => {

    if (event.target === lightbox) {

      close();

    }

  });

  window.addEventListener("keydown", event => {

    if (!lightbox.classList.contains("open")) return;

    if (event.key === "Escape") close();

    if (event.key === "ArrowLeft") move(-1);

    if (event.key === "ArrowRight") move(1);

  });

}

/* ===========================
   Галерея работ
=========================== */

function fillGalleryPage() {

  const grid = document.querySelector("[data-gallery-grid]");

  if (!grid) return;

  grid.innerHTML = works.map((work, index) => `
      <button
        type="button"
        data-gallery-index="${index}">
        <img
          src="${work.src}"
          alt="${work.title}">
      </button>
  `).join("");

}

/* ===========================
   Запуск
=========================== */

document.addEventListener("DOMContentLoaded", () => {

    setupLeadForm();

    fillGalleryPage();

    setupLightbox();

});
