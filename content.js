// TODO: allow navigating search result table with J and K? ON HOLD
// TODO: allow for custom bindings/settings?
// if so, then have the scrolling on selection change be an option
// option to not skip "videos" section of all?
// option to change selection color

// preferences
const defaultLight = "#F5F5F5";
const defaultColor = undefined;

const resultsContainer = document.querySelector("#search #rso");
const searchFormRect = document
  .querySelector("#searchform")
  .getBoundingClientRect();
const section = document.querySelectorAll('[aria-current="page"]');

const IGNORE = ".related-question-pair, .kp-blk, .g-blk, .xpdopen, .xpd";
const topOffset = searchFormRect.bottom - searchFormRect.top; // height of top bar
const selectColor = defaultColor ? defaultColor : themeColor();

// array of all results
const results = resultsContainer
  ? [...resultsContainer.querySelectorAll("a > h3")]
      .filter((h3) => {
        // Ensure it's a visible standard link and not part of special boxes
        const parent = h3.parentElement.closest("[data-hveid]");
        return parent && !parent.closest(IGNORE);
      })
      .map((element) => {
        while (
          !element.parentElement.hasAttribute("data-rpos") &&
          !element.parentElement.hasAttribute("data-hveid")
        )
          element = element.parentElement;
        return element;
      })
  : [];

let prevKeyG = false;
let index = 0;

function themeColor() {
  const bgColor = getComputedStyle(document.body).backgroundColor;
  if (bgColor === "rgb(255, 255, 255)") return defaultLight;

  const currRGB = bgColor.match(/\d+/g);

  // rough interpretation of if light mode or dark mode
  const increment = parseInt(currRGB[0]) < 230 ? 10 : -10;

  // Convert strings to numbers and increment each by 10
  const newRGB = currRGB.map((num) => {
    let val = parseInt(num) + increment;
    return val > 255 ? 255 : val; // clamp at 255
  });

  return `rgb(${newRGB[0]}, ${newRGB[1]}, ${newRGB[2]})`;
}

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

  const selected = results[index];
  const selectedTop = selected.getBoundingClientRect().top;

  // style
  selected.style.setProperty("background-color", selectColor);
  selected.style.caretColor = "transparent";
  selected.querySelector("span > a").focus();

  // scroll
  if (direction === "first") window.scrollTo(0, 0);
  else if (direction === "last") window.scrollTo(0, document.body.scrollHeight);
  else
    selected.scrollIntoView({
      behavior: "auto",
      block: index === 0 || index === bottom ? "center" : "nearest",
    });

  // move view up by amount the selected is blocked by the top bar
  if (selectedTop < topOffset && direction !== "first")
    window.scrollBy(0, selectedTop - topOffset);
}

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

// init
updateSelected("first");
window.scrollTo(0, 0); // make the window load at the top of the page
