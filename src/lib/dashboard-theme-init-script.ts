/**
 * Runs before React hydration on dashboard/settings routes to avoid theme flash.
 * Dashboard defaults to dark; only stays light if user explicitly chose it on dashboard.
 * Does not set theme-color / html background — mobile safe area uses system browser chrome.
 *
 * Never removeChild theme-color metas: Next viewport owns them; detaching orphans React
 * fibers and crashes soft nav / locale switch (removeChild of null).
 */
export const DASHBOARD_THEME_INIT_SCRIPT = `(function(){try{var p=location.pathname;if(!/(?:^|\\/)(?:dashboard|settings)(?:\\/|$)/.test(p))return;var dash=localStorage.getItem("ptu-dashboard-theme");var explicit=localStorage.getItem("ptu-dashboard-theme-explicit")==="1";var dark=true;if(dash==="technology")dark=true;else if(dash==="default"&&explicit)dark=false;if(dark)document.documentElement.classList.add("ptu-theme-technology");else document.documentElement.classList.remove("ptu-theme-technology");document.documentElement.style.backgroundColor="";if(document.body)document.body.style.backgroundColor="";document.querySelectorAll('meta[name="theme-color"]').forEach(function(el){el.setAttribute("content","");});document.querySelectorAll('meta[name="apple-mobile-web-app-status-bar-style"]').forEach(function(el){el.setAttribute("content","default");});}catch(e){}})();`;
