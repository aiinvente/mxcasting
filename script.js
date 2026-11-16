"use strict";

const menuButton = document.querySelector(".menu-button");
const navigation = document.querySelector(".navigation");
const compactNavigation = window.matchMedia("(max-width: 810px)");

function setMenuOpen(isOpen) {
  menuButton.setAttribute("aria-expanded", String(isOpen));
  navigation.classList.toggle("is-open", isOpen);
}

function syncNavigation() {
  menuButton.hidden = !compactNavigation.matches;
  setMenuOpen(false);
}

menuButton.addEventListener("click", () => setMenuOpen(menuButton.getAttribute("aria-expanded") !== "true"));
navigation.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenuOpen(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || menuButton.getAttribute("aria-expanded") !== "true") return;
  setMenuOpen(false);
  menuButton.focus();
});
compactNavigation.addEventListener("change", syncNavigation);
document.documentElement.classList.add("enhanced");
syncNavigation();

const form = document.querySelector("#form-orcamento");
const serviceCheckboxes = [...form.querySelectorAll('input[name="servicos"]')];
const serviceButtons = [...document.querySelectorAll(".service-toggle")];
const selection = document.querySelector("#selecao");
const formStatus = document.querySelector("#envio");
const whatsappLink = document.querySelector("#pedido-whatsapp");

function clearPreparedQuote() {
  formStatus.hidden = true;
  whatsappLink.removeAttribute("href");
}

function syncServices() {
  const selectedIds = new Set(serviceCheckboxes.filter((input) => input.checked).map((input) => input.id));
  for (const button of serviceButtons) {
    const isSelected = selectedIds.has(button.dataset.service);
    button.closest(".service-card").classList.toggle("is-selected", isSelected);
    button.querySelector(".service-action").textContent = isSelected ? "Remover do orçamento" : "Incluir no orçamento";
    button.querySelector("use").setAttribute("href", isSelected ? "#i-check" : "#i-plus");
  }
  const count = selectedIds.size;
  selection.textContent = count === 1 ? "1 serviço selecionado" : `${count} serviços selecionados`;
}

for (const button of serviceButtons) {
  button.hidden = false;
  button.addEventListener("click", () => {
    const checkbox = document.getElementById(button.dataset.service);
    checkbox.checked = !checkbox.checked;
    clearPreparedQuote();
    syncServices();
  });
}

form.addEventListener("change", (event) => {
  if (event.target.name === "servicos") syncServices();
  clearPreparedQuote();
});
form.addEventListener("input", (event) => {
  event.target.setCustomValidity("");
  clearPreparedQuote();
});

function formatEventDate(value) {
  return value ? value.split("-").reverse().join("/") : "A definir";
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const values = new FormData(form);
  const get = (name) => values.get(name).trim();

  for (const name of ["nome", "empresa", "cidade"]) {
    if (!get(name)) form.elements[name].setCustomValidity("Preencha este campo.");
  }
  const phone = get("telefone");
  const digits = phone.replace(/\D/g, "");
  if (!/^\+?[\d\s().-]+$/.test(phone) || digits.length < 8 || digits.length > 15) {
    form.elements.telefone.setCustomValidity("Informe um telefone válido, com DDD.");
  }
  if (!form.reportValidity()) return;

  const services = values.getAll("servicos");
  const message = [
    "Olá, MX Casting! Gostaria de solicitar um orçamento para um evento.",
    "",
    `Nome: ${get("nome")}`,
    `Empresa: ${get("empresa")}`,
    `E-mail: ${get("email")}`,
    `Telefone: ${phone}`,
    `Cidade e UF: ${get("cidade")}`,
    `Data do evento: ${formatEventDate(get("data"))}`,
    `Serviços: ${services.length ? services.join(", ") : "A definir"}`,
  ];
  if (get("detalhes")) message.push(`Detalhes: ${get("detalhes")}`);

  const url = new URL("https://wa.me/5511997099086");
  url.searchParams.set("text", message.join("\n"));
  whatsappLink.href = url.href;
  formStatus.hidden = false;
  whatsappLink.click();
});

form.hidden = false;
syncServices();

if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.replace("reveal-pending", "reveal-visible");
      observer.unobserve(entry.target);
    }
  }, { rootMargin: "0px 0px 24px", threshold: 0.08 });

  for (const element of document.querySelectorAll("[data-reveal]")) {
    if (element.getBoundingClientRect().top <= window.innerHeight) continue;
    element.classList.add("reveal-pending");
    observer.observe(element);
  }
}
