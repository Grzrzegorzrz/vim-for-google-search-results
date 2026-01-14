// TODO: allow navigating search result table with J and K? ON HOLD
// TODO: allow for custom bindings/settings?
// if so, then have the scrolling on selection change be an option
// option to not skip "videos" section of all?
// option to change selection color

// -- preferences --
const defaultColor = undefined;

// scroll behavior
const gScroll = "smooth";
const jkScroll = "instant";
const resultScroll = "nearest";
const showNext = true; // show search result above/below curr selection

// selected result styling (in px)
const selectExtrude = "10";
const selectRounding = "5";

// strat for handling custom key sequences:
// - vim way:
//   - traverse trie
//   - store trie in json

const resultsContainer = document.querySelector("#search #rso");
const searchFormRect = document
  .querySelector("#searchform")
  .getBoundingClientRect();
const section = document.querySelectorAll('[aria-current="page"]');

const IGNORE = ".related-question-pair, .kp-blk, .g-blk, .xpdopen, .xpd";
const topOffset = searchFormRect.bottom - searchFormRect.top; // height of top bar
const selectColor = defaultColor || themeColor();

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

  const currRGB = bgColor.match(/\d+/g);
  // interpret if light mode or dark mode
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
  results[index].style.backgroundColor = "initial";
  results[index].style.boxShadow = "initial";
  results[index].style.borderRadius = "intial";

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

  let selected = results[index];
  const selectedTop = selected.getBoundingClientRect().top;

  // style
  selected.style.backgroundColor = selectColor;
  selected.style.boxShadow = `-4px 0 0 ${selectExtrude}px ${selectColor}`;
  selected.style.borderRadius = selectRounding + "px";
  selected.style.caretColor = "transparent";
  selected.querySelector("span > a").focus({ preventScroll: true });

  // extra space for on scroll
  if (showNext) {
    if (direction === "down" && index != bottom) selected = results[index + 1];
    else if (direction === "up" && index != 0) selected = results[index - 1];
  }

  // scroll
  if (direction === "first")
    window.scrollTo({
      behavior: gScroll,
      top: 0,
    });
  else if (direction === "last")
    window.scrollTo({
      behavior: gScroll,
      top: document.body.scrollHeight,
    });
  else {
    selected.scrollIntoView({
      behavior: jkScroll,
      block: index === 0 || index === bottom ? "center" : resultScroll,
    });
  }

  // move view up by amount the selected is blocked by the top bar
  if (selectedTop < topOffset && direction !== "first")
    window.scrollBy({
      behavior: jkScroll,
      top: selectedTop - topOffset,
    });
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
