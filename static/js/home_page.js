/**
 * Description:This file contains the JavaScript for the home_page template. This template mostly used DTL to render the components on the server.
 * However it also includes a SearchBox JavaScript component to enable the user to search for a user's username and id.
 * The component is initalised with the correct settings and enpoint in a config object.
 * The selected user's id is used to redirect the user to the selected user's profile immediately upon selection.
 */


PAGE_SIZE = 10;
SEARCH_USERS_API_BASEURL = 'http://127.0.0.1:8000/search-users'

const searchSection = document.getElementById('search-section');
const userSearch = new SearchBox(SEARCH_USERS_API_BASEURL, {
    id: 'user-search',
    pageSize: PAGE_SIZE,
    placeholder: "Search for a username...",
    closeAfterClear: true,
    maxPage: 7,
    typeDelay: 100,
});
searchSection.insertBefore(userSearch.wrapper, searchSection.firstElementChild);

SearchBox.manageSelectedOptions = function(_mode) {
    if (_mode ==="Add") {
        user = Object.values(SearchBox.selectedOptions)[0];
        id=getIdFromSelectedOption(user)
        window.location.href = `/userprofile/${id}/`
    }
}

//This function is used to get the id from the end of the chosen user's string representation.
function getIdFromSelectedOption(choice) {
    const lastSpaceIndex = choice.lastIndexOf(' ');
    const id = choice.slice(lastSpaceIndex + 1);
    return id;
  }