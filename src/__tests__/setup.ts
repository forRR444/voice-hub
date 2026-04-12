import "@testing-library/jest-dom/vitest";

// jsdom does not implement IntersectionObserver — provide a minimal stub
class MockIntersectionObserver {
  private callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  observe(el: Element) {
    // Immediately report as intersecting so ScrollRevealWrapper shows content
    this.callback(
      [{ isIntersecting: true, target: el } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    );
  }

  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
