/**
 * Description: This file will be included in the base.html template which means it will be shared across all templates that extend base.html.
 * In this application the only common component to be extended is the navbar. This file contains the JavaScript for the navbar as well as
 * for the csrftoken which other templates that make AJAX requests will require.
 */


/**
 * Retrieves the value of the cookie using its name.
 * @param {string} name 
 * @returns value of the cookie if it exists else undefined
 */
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }

var csrftoken = getCookie('csrftoken');


//The following code is basic JavaScript for the dropdown menu in the navbar.
//It ensures that the menu opens when the user hovers over it.
//It also makes sure that it stays open until the user moves their mouse outside the dropdown menu or the dropdown zone (trigger).

//Get references to the relevant elements
const dropDownZone = document.getElementById("dropdown-zone");
const dropDownMenu = document.getElementById("dropdown-list");

//Add event listeners to enable interactivity.
//A check here is necessary to prevent errors in other templates that extend base.html.
if (dropDownMenu) {
    dropDownZone.addEventListener('mousemove', showDropdown);
    dropDownMenu.addEventListener('mouseenter', mouseEnterMenu);
    dropDownZone.addEventListener('mouseleave', mouseLeaveZone);
    dropDownMenu.addEventListener('mouseleave', mouseLeaveMenu);
}

document.addEventListener('mouseleave', hideDropdown);
window.addEventListener('mousemove', hideDropdown);


//This is the handler for a mousemove event on the dropdown zone. Mousemove is more reliable than mouseenter.
//It shows the dropdown menu but is also responsible for keeping the menu items active.
//It needs an if check to reset the elements affected by the mousemove event to prevent flickering.
function showDropdown() {
    if (dropDownMenu.classList.contains("show-navbar-dropdown")) {
        dropDownMenu.classList.remove("show-navbar-dropdown");
        dropDownZone.classList.remove("keep-active");
        showDropdown();
        return;
    }
    dropDownMenu.classList.toggle("show-navbar-dropdown");
    dropDownZone.classList.toggle("keep-active");
    mouseLeaveZone.mouseOut = false;
    mouseLeaveMenu.mouseOut = true;
}

//This function fires on document's mouseleave and th window's mousemove events.
//It also checks the position of the cursor to avoid unpredictable behaviour.
function hideDropdown() {
    if ((mouseLeaveZone.mouseOut === true) && (mouseLeaveMenu.mouseOut === true)) {
            dropDownMenu.classList.remove("show-navbar-dropdown");
            dropDownZone.classList.remove("keep-active");
    }
}

//Event handler on the dropdown menu's mouseenter event to keep track of cursor position
function mouseEnterMenu() {
    mouseLeaveMenu.mouseOut = false;
}

//Event handler on the dropdown zone's mouseleave event to keep track of cursor position
//setTimeout is used to make sure the menu doesn't close too fast
function mouseLeaveZone() {
    setTimeout(() => {
        mouseLeaveZone.mouseOut = true;
    }, 100);
}

//Event handler on the dropdown menu's mouseleave event to keep track of cursor position
function mouseLeaveMenu() {
    mouseLeaveMenu.mouseOut = true;
}

