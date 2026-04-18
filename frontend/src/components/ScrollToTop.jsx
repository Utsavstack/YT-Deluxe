import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
 const { pathname } = useLocation();

 useLayoutEffect(() => {
  if ('scrollRestoration' in window.history) {
   window.history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);
 }, [pathname]);

 return null;
};

export default ScrollToTop;