import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

if (typeof window !== "undefined" && "scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

const jumpToTop = () => {
  const html = document.documentElement;
  const prev = html.style.scrollBehavior;
  html.style.scrollBehavior = "auto"; // kill smooth scrolling
  window.scrollTo(0, 0);
  html.scrollTop = 0;
  document.body.scrollTop = 0;
  document
    .querySelectorAll<HTMLElement>(".scroll-region")
    .forEach((el) => (el.scrollTop = 0));
  html.style.scrollBehavior = prev;
};

export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useLayoutEffect(() => {
    if (hash) return;
    jumpToTop(); // runs before paint, so no visible scrolling
  }, [pathname, search, hash]);

  return null;
}
