// FIX: result "ee" breaks for selecting twitter; try filtering by class?
// TODO: don't scroll on load
// TODO: allow for custom bindings/settings?
// if so, then have the scrolling on selection change be an option

const resultsContainer = document.querySelector("#search #rso");
const searchFormRect = document
  .querySelector("#searchform")
  .getBoundingClientRect();
const section = document.querySelectorAll('[aria-current="page"]');

const IGNORE = ".related-question-pair, .kp-blk, .g-blk, .xpdopen, .xpd";
const topOffset = searchFormRect.bottom - searchFormRect.top; // height of top bar

let prevKeyG = false;
let index = 0;

const results = resultsContainer
  ? [...resultsContainer.querySelectorAll("a > h3")]
      .filter((h3) => {
        // Ensure it's a visible standard link and not part of special boxes
        const parent = h3.parentElement.closest("[data-hveid]");
        return parent && !parent.closest(IGNORE);
      })
      .map(
        (h3) =>
          h3.parentElement.parentElement.parentElement.parentElement
            .parentElement.parentElement,
      )
  : [];

function checkSection() {
  const html = section[0]?.innerHTML ?? "";
  return !(html.includes("Images") || html.includes("Short videos"));
}

function updateSelected(direction) {
  if (!results || !results.length || !checkSection()) return;

  const bottom = results.length - 1;

  // remove colour from curr selection before changing selection
  results[index].style.setProperty("background-color", "initial");

  switch (direction) {
    case "down":
      if (index < bottom) index++;
      break;
    case "up":
      if (index > 0) index--;
      break;
    case "first":
      index = 0;
      break;
    case "last":
      index = bottom;
      break;
  }

  // style
  results[index].style.setProperty("background-color", "#282828");
  const link = results[index];
  link.style.caretColor = "transparent";
  link.querySelector("span > a").focus();

  // scroll
  if (direction === "first") window.scrollTo(0, 0);
  else if (direction === "last") window.scrollTo(0, document.body.scrollHeight);
  else if (index === 0 || index === bottom)
    results[index].scrollIntoView({ behavior: "auto", block: "center" });
  else results[index].scrollIntoView({ behavior: "auto", block: "nearest" });

  // move view up by amount the selected is blocked by the top bar
  const selectedTop = results[index].getBoundingClientRect().top;
  if (selectedTop < topOffset && direction !== "first")
    window.scrollBy(0, selectedTop - topOffset);
}

// init
updateSelected("first");
window.scrollTo(0, 0); // hacky workaround to make the window load at the top of the page

addEventListener("keydown", (e) => {
  const active = document.activeElement;
  const link = results[index]?.querySelector("span > a").href;

  // is typing
  if (
    ["TEXTAREA", "INPUT"].includes(active?.tagName) ||
    active?.isContentEditable
  )
    return;

  let code = e.code;

  // handle trailingG
  if (code === "KeyG") {
    if (e.shiftKey) code = "UpG";
    else if (prevKeyG) code = "GG";
    else {
      prevKeyG = true;
      return;
    }
  }

  prevKeyG = false;

  switch (code) {
    case "UpG":
      updateSelected("last");
      break;
    case "GG":
      updateSelected("first");
      break;
    case "KeyJ":
      updateSelected("down");
      break;
    case "KeyK":
      updateSelected("up");
      break;

    case "Enter":
    case "KeyL":
      if (!link) break;
      e.preventDefault();
      console.log(link);

      if (e.shiftKey) window.open(link, "_blank");
      else window.location.href = link;

      break;
  }
});
