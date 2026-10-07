document.getElementById("add").addEventListener("click", () => {
  const label = document.createElement("label");
  label.textContent = "Dynamic textarea";
  const field = document.createElement("textarea");
  field.value = "This field was created after the page loaded.";
  label.append(field);
  document.getElementById("add").before(label);
  field.focus();
});
