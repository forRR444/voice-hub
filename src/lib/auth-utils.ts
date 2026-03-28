export function preserveTemplate() {
  const template = new URLSearchParams(window.location.search).get("template");
  if (template) {
    localStorage.setItem("voicehub_template", template);
  }
}
