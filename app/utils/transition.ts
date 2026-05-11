function onEnter(el: Element) {
  const element = el as HTMLElement;

  element.style.height = "0";
  element.style.opacity = "0";

  requestAnimationFrame(() => {
    element.style.transition = "all 0.25s ease";
    element.style.height = `${element.scrollHeight}px`;
    element.style.opacity = "1";
  });
}

function onAfterEnter(el: Element) {
  const element = el as HTMLElement;

  element.style.height = "auto";
}

function onLeave(el: Element) {
  const element = el as HTMLElement;

  element.style.height = `${element.scrollHeight}px`;
  element.style.opacity = "1";

  requestAnimationFrame(() => {
    element.style.transition = "all 0.25s ease";
    element.style.height = "0";
    element.style.opacity = "0";
  });
}

export {
  onAfterEnter,
  onEnter,
  onLeave,
};
