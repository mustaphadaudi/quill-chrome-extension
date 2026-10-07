document.getElementById("add").addEventListener("click", () => {
  const label = document.createElement("label");
  label.textContent = "Dynamic textarea";
  const field = document.createElement("textarea");
  field.value = "This field was created after the page loaded.";
  label.append(field);
  document.getElementById("add").before(label);
  field.focus();
});

const shadow=document.getElementById('shadow-host').attachShadow({mode:'open'});const label=document.createElement('label');label.textContent='Shadow-root editor';const rich=document.createElement('div');rich.id='shadow-rich';rich.contentEditable='true';rich.setAttribute('role','textbox');rich.style.cssText='min-height:60px;border:1px solid #ccc;padding:16px';rich.textContent='This are a shadow test sentence.';label.append(rich);shadow.append(label);
