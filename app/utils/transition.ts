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

function animateTableRows(tbody: HTMLElement) {
  const previousPositions = new Map<Element, DOMRect>();

  function capturePositions() {
    previousPositions.clear();

    Array.from(tbody.children).forEach((child) => {
      previousPositions.set(child, child.getBoundingClientRect());
    });
  }

  function animate() {
    const newPositions = new Map<Element, DOMRect>();

    Array.from(tbody.children).forEach((child) => {
      newPositions.set(child, child.getBoundingClientRect());
    });

    newPositions.forEach((newRect, child) => {
      const oldRect = previousPositions.get(child);

      if (!oldRect)
        return;

      const deltaY = oldRect.top - newRect.top;

      if (Math.abs(deltaY) < 1)
        return;

      const el = child as HTMLElement;

      el.animate(
        [
          {
            transform: `translateY(${deltaY}px)`,
          },
          {
            transform: "translateY(0)",
          },
        ],
        {
          duration: 320,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        },
      );
    });

    capturePositions();
  }

  capturePositions();

  const observer = new MutationObserver(() => {
    requestAnimationFrame(animate);
  });

  observer.observe(tbody, {
    childList: true,
    subtree: false,
  });

  return () => observer.disconnect();
}

export {
  animateTableRows,
  onAfterEnter,
  onEnter,
  onLeave,
};
