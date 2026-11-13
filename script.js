
(function() {
'use strict';

// Select elements from the page.
const select = (selector, parent = document) => parent.querySelector(selector);

const selectAll = (selector, parent = document) =>
    Array.from(parent.querySelectorAll(selector));

// Check whether the user prefers reduced motion.
const reduceMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- DARK AND LIGHT MODE ----------

function initTheme() {
  const themeButton = select('#theme-toggle');

  if (!themeButton) return;

  // Update the theme and the toggle button.
  function applyTheme(theme, saveTheme = false) {
    const isDark = theme === 'dark';

    document.documentElement.dataset.theme = theme;

    themeButton.setAttribute('aria-pressed', String(isDark));
    themeButton.setAttribute(
        'aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');

    themeButton.textContent = isDark ? 'Light mode' : 'Dark mode';

    // Save the user's preference for future visits.
    if (saveTheme) {
      try {
        localStorage.setItem('theme', theme);
      } catch (error) {
        // Continue if browser storage is unavailable.
      }
    }
  }

  // Use the theme already selected when the page loaded.
  const initialTheme =
      document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';

  applyTheme(initialTheme);

  // Switch themes when the button is clicked.
  themeButton.addEventListener('click', () => {
    const nextTheme =
        document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';

    applyTheme(nextTheme, true);
  });
}

// ---------- SCROLLREVEAL LIBRARY ----------

function initReveal() {
  // Skip animations if the library is missing or motion is reduced.
  if (!window.ScrollReveal || reduceMotion) return;

  ScrollReveal().reveal('.reveal', {
    distance: '14px',
    duration: 700,
    origin: 'bottom',
    interval: 80,
    cleanup: true
  });
}

// ---------- INTERACTIVE PROJECT SCRAPBOOK ----------

function initBook() {
  const bookCover = select('#book-cover');
  const openBookElement = select('#book-open');
  const flipElement = select('#flip');

  if (!bookCover || !openBookElement || !flipElement) return;

  const pages = selectAll('.page', flipElement);
  const projectButtons = selectAll('.project-switch button');
  const bookStatus = select('#book-status');
  const previousButton = select('#prev');
  const nextButton = select('#next');
  const closeButton = select('#close-book');
  const projectCollection = select('#project-collection');

  let pageFlip = null;
  let fallbackProject = 0;

  // Check whether the scrapbook is displaying two pages.
  function isLandscape() {
    return pageFlip && pageFlip.getOrientation() === 'landscape';
  }

  // Find the current page.
  function currentPage() {
    return pageFlip ? pageFlip.getCurrentPageIndex() : fallbackProject * 2;
  }

  // Turn two pages on desktop and one page on smaller screens.
  function pageStep() {
    return isLandscape() ? 2 : 1;
  }

  // Update the project buttons, page controls, and accessibility.
  function syncBook() {
    const pageIndex = currentPage();
    const showSpread = isLandscape() || !pageFlip;

    function isPageVisible(index) {
      if (!pageFlip) {
        return Math.floor(index / 2) === fallbackProject;
      }

      if (showSpread) {
        return index === pageIndex || index === pageIndex + 1;
      }

      return index === pageIndex;
    }

    pages.forEach((page, index) => {
      const visible = isPageVisible(index);

      page.inert = !visible;

      if (!pageFlip) {
        page.hidden = !visible;
      }
    });

    const projectIndex = Math.floor(pageIndex / 2);

    projectButtons.forEach((button, index) => {
      button.setAttribute('aria-pressed', String(index === projectIndex));
    });

    previousButton.disabled = pageIndex <= 0;

    nextButton.disabled =
        pageFlip ? pageIndex + pageStep() >= pages.length : true;

    previousButton.hidden = !pageFlip;
    nextButton.hidden = !pageFlip;

    // Announce the selected project to screen readers.
    if (bookStatus && projectButtons[projectIndex]) {
      const projectName =
          projectButtons[projectIndex].getAttribute('aria-label');

      bookStatus.textContent = 'Showing ' + projectName + '.';
    }
  }

  // ---------- PAGEFLIP LIBRARY ----------

  function initPageFlip() {
    if (pageFlip) {
      pageFlip.update();
      return;
    }

    // Display a simpler layout if the library cannot load.
    if (!window.St || !window.St.PageFlip ||
        !flipElement.getBoundingClientRect().width) {
      projectCollection.classList.add('no-flip');
      return;
    }

    const bookWidth = flipElement.getBoundingClientRect().width;

    const pageHeight = bookWidth < 520 ? 560 : bookWidth < 960 ? 500 : 430;

    try {
      pageFlip = new St.PageFlip(flipElement, {
        width: 323,
        height: pageHeight,
        size: 'stretch',
        minWidth: 260,
        maxWidth: 560,
        minHeight: 346,
        maxHeight: 1000,
        showCover: false,
        usePortrait: true,
        useMouseEvents: false,
        drawShadow: true,
        maxShadowOpacity: 0.3,
        flippingTime: 800,
        autoSize: true
      });

      pageFlip.loadFromHTML(pages);

      // Keep the controls updated after turning a page.
      pageFlip.on('flip', syncBook);
      pageFlip.on('changeOrientation', syncBook);
    } catch (error) {
      pageFlip = null;
      projectCollection.classList.add('no-flip');
    }
  }

  // Turn to a specific page.
  function turnToPage(pageIndex) {
    if (!pageFlip) return;

    if (reduceMotion) {
      pageFlip.turnToPage(pageIndex);
    } else {
      pageFlip.flip(pageIndex);
    }
  }

  // Switch between the CSE 325 and CSE 335 projects.
  function goToProject(projectIndex) {
    if (pageFlip) {
      const currentProject = Math.floor(currentPage() / 2);

      if (currentProject !== projectIndex) {
        turnToPage(projectIndex * 2);
      }

      if (reduceMotion || currentProject === projectIndex) {
        syncBook();
      }
    } else {
      fallbackProject = projectIndex;
      syncBook();
    }
  }

  // ---------- OPEN AND CLOSE SCRAPBOOK ----------

  function openBook() {
    bookCover.hidden = true;
    openBookElement.hidden = false;

    bookCover.setAttribute('aria-expanded', 'true');

    initPageFlip();
    syncBook();

    // Move keyboard focus to the selected project button.
    const activeButton = projectButtons.find(
        button => button.getAttribute('aria-pressed') === 'true');

    (activeButton || projectButtons[0]).focus();
  }

  function closeBook() {
    openBookElement.hidden = true;
    bookCover.hidden = false;

    bookCover.setAttribute('aria-expanded', 'false');
    bookCover.focus();
  }

  // ---------- BUTTON EVENTS ----------

  bookCover.addEventListener('click', openBook);
  closeButton.addEventListener('click', closeBook);

  // Allow users to close the scrapbook using Escape.
  openBookElement.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeBook();
    }
  });

  // Select a project using its button.
  projectButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
      goToProject(index);
    });
  });

  // Turn to the previous page.
  previousButton.addEventListener('click', () => {
    if (!pageFlip) return;

    if (reduceMotion) {
      pageFlip.turnToPage(Math.max(0, currentPage() - pageStep()));
      syncBook();
    } else {
      pageFlip.flipPrev();
    }
  });

  // Turn to the next page.
  nextButton.addEventListener('click', () => {
    if (!pageFlip) return;

    if (reduceMotion) {
      pageFlip.turnToPage(currentPage() + pageStep());
      syncBook();
    } else {
      pageFlip.flipNext();
    }
  });

  // Adjust the scrapbook when the browser is resized.
  window.addEventListener('resize', () => {
    if (pageFlip && !openBookElement.hidden) {
      pageFlip.update();
      syncBook();
    }
  });

  // Keep closed scrapbook pages out of keyboard navigation.
  pages.forEach(page => {
    page.inert = true;
  });
}

// ---------- INITIALIZE WEBSITE FEATURES ----------

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initReveal();
  initBook();
});
})();
