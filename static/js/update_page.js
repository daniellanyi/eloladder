/**
 * Description: This file contains the JavaScript for the update page. It enables a convenient way to record games between players.
 * This happens in 3 stages. To navigate between the stages 2 buttons are used.
 * In stage 1 the 2 players are chosen from each SearchBox and the number of games are chosen using increment and decrement buttons.
 * When the next button is pressed the user moves onto stage 2 and the SearchBoxes and the step buttons are disabled.
 * In stage 2 the user will see as many custom select elements as there are games each containing 2 options 1 for each player.
 * In stage 3 the Next button's text content is changed to 'Post'. The handleResultsPost method sends the contents of the
 * select elements to the server in an easy to process format and redirects the user to the home page when the button is clicked.
 */




//Create global settings variables to be used in the rest of the file
const PAGE_URL = 'http://127.0.0.1:8000/update-stats-1v1'
const SEARCH_USERS_API_BASEURL = 'http://127.0.0.1:8000/search-users'
const PAGE_SIZE = 10;
const MAX_GAMES = 11;
const MIN_GAMES = 1;

// ===Adding SearchBoxes===
//Add the SearchBox components with the chosen settings in the config object to the container in the correct positions.
const container = document.getElementById('matchup-form-wrapper');
const gameNmberContainer = document.getElementById('game-number');
const Player1SearchBox = new SearchBox(SEARCH_USERS_API_BASEURL, {
    pageSize: PAGE_SIZE,
    label: "Player 1",
    placeholder: "Search for a username...",
    closeAfterClear: true,
    maxPage: 7,
    typeDelay: 100,
});
const Player2SearchBox = new SearchBox(SEARCH_USERS_API_BASEURL, {
    pageSize: PAGE_SIZE,
    label: "Player 2",
    placeholder: "Search for a username...",
    closeAfterClear: true,
    maxPage: 7,
    typeDelay: 100,
});
container.insertBefore(Player1SearchBox.wrapper, gameNmberContainer);
container.insertBefore(Player2SearchBox.wrapper, gameNmberContainer.nextSibling);
// ===SearchBoxes Added===

// Assign elements to global variables to be used in the rest of the file
const nextButton = document.getElementById('next-button');
const backButton = document.getElementById('back-button');
const numberField = document.getElementById('select-game-number');
const incrementButton = document.getElementById("incrementButton");
const decrementButton = document.getElementById("decrementButton");
const numberDisplayed = document.getElementById('numberDisplay');
const clearButtons = document.querySelectorAll('.clear-btn');
const winnerField = document.getElementById('select-winners');
const winnerList = document.getElementById('winner-list');

// Create state variables that will be used in the rest of the file 
const results = {
    players : [],
    winners: []
};
let players = [];
let numberOfGames = 1;
let readyToPost = false;

//This method is used to enable or disable the Next button based on if both players have been selected.
SearchBox.manageSelectedOptions = function(_mode) {
    players = Object.values(SearchBox.selectedOptions);
    if (Object.keys(SearchBox.selectedOptions).length == 2 && numberOfGames > 0 && !hasDuplicates(players)) {
        nextButton.disabled = false;
    } else {
        nextButton.disabled = true;
    }
}

//===Create step button methods===
//These methods are responsible for changing the number representing the number of games displayed based on the click
//events of the step buttons
incrementButton.addEventListener('click', () => {
    numberOfGames = numberOfGames + 1 < MAX_GAMES ? numberOfGames + 1 : MAX_GAMES;
    numberDisplayed.textContent = numberOfGames;
});

decrementButton.addEventListener('click', () => {
    numberOfGames = numberOfGames - 1 > MIN_GAMES ? numberOfGames - 1 : MIN_GAMES
    numberDisplayed.textContent = numberOfGames;
});
//===Step button methods created===

//===Create navigation buttons===
//These buttons contain the logic of stepping back and forth between stages. They control the state of components and 
//the creation of the Games Form which is a collection of custom select components. These methods also update state variables
//based on the current stage.
nextButton.addEventListener('click', () => {

    if (readyToPost) {
        handleResultsPost();
        return;
    }

    Object.values(SearchBox.instances).forEach(searchBox => {
        searchBox.input.disabled = true;
        searchBox.clearButton.classList.remove('show');
    });
    incrementButton.disabled = true;
    decrementButton.disabled = true;
    createGamesForm();
    readyToPost = true;
    nextButton.textContent = 'Post';
    backButton.disabled = false;
});

backButton.addEventListener('click', () => {
    Object.values(SearchBox.instances).forEach(searchBox => {
        searchBox.input.disabled = false;
        searchBox.clearButton.classList.add('show');
    });
    incrementButton.disabled = false;
    decrementButton.disabled = false;
    readyToPost = false;
    nextButton.textContent = 'Next';
    backButton.disabled = true;
    clearWinnerList();
});
//===Navigation buttons created===


//This method updates the results object with the text contents of the select components and the from the elements of the players container
//which was used to keep the text content of the SearchBox components.It then serializes the object to JSON and sends it to the correct server API.
function handleResultsPost() {
    if (!csrftoken) {
        console.error('CSRF token not found.');
        return;
    }
    backButton.disabled = true;
    results['winners'] = Object.values(CustomSelect.selectedOptions);
    results['players'] = [...players];
    fetch(PAGE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify(results)
    })
    .then(response => {
        if (response.ok) {
            window.location.reload();
        } else {
            throw new Error('Error occurred during the fetch request.');
        }
    })
    .catch(error => {
        console.error('Fetch error:', error);
    });
}


//===Declare Games Form manipulation functions===
//These function are responsible for populating with and clearing of the Games Form with CustomSelect instances. 
function createGamesForm() {
    const fragment = document.createDocumentFragment();
    for (let i = 1; i <= numberOfGames; i++) {
        const gamesFormitem = new CustomSelect({
            id: i,
            label: `Game ${i}`,
            options: players,
        });
        gamesFormitem.appendTo(fragment);
    }
    winnerList.replaceChildren(fragment);

}

function clearWinnerList() {
    while (winnerList.firstChild) {
        winnerList.removeChild(winnerList.firstChild);
    }
}
//===Games Form manipulation functions declared===

//A descriptive helper function used in the SearchBox.manageSelectedOptions method
function hasDuplicates(array) {
    return new Set(array).size !== array.length;
  }


