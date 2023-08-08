/**
 * A combination of a typahead component and an infinite scroll option list. It's designed so that multiple of them can be included on one page.
 * It contains static methods and variables to handle common functionality.
 */

class SearchBox {
    static instanceCount = 0;
    static instances = {};
    //The activeSearchBox static variable keeps track of the instance currently being used and closes the result lists of other instances.
    static activeSearchBox = null;
    static selectedOptions = {};
    static documentOnClick(event) {
        if (SearchBox.activeSearchBox !== null && SearchBox.activeSearchBox.input !== event.target) {
                SearchBox.activeSearchBox.unMountListOfMatches();
            }
    }

    /**
     * Description: This method is supposed to be defined outside the class to make changes in external code based on the
     * changes that occur to the state of the container which contains the results.
     * @param {string} _mode - used to decide whether an option was added or removed
     */
    static manageSelectedOptions(_mode) {

    }

    /**
     * Initialise an instance of SearchBox
     * Description: Initialises instance variables and updates static variables and is also responsible for generating the HTML.
     * @param {string} apiBaseUrl - The url of an API endpoint which supports text, limit and page query parameters.
     * @param {object} config - An object that contains optional settings.
     * @param {number} config.pageSize - Specifies the number of items to be returned per page. Defaults to 8.
     * @param {string} config.label - Optional label for the SearchBox instance.
     * @param {string} config.placeholder - Optional placeholder text for the SearchBox input.
     * @param {boolean} config.closeAfterClear - Boolean that specifies if the result list should close when it's cleared. Defaults to false.
     * @param {number} config.maxPage - Maximum number of pages to return. Defaults to 5.
     * @param {number} config.typeDelay - Delay after user stopped typing and before results are fetched.
     * @param {number} config.scrollThresholdPercentage - Controls how far the container needs to be scrolled for the next fetch.
     */
    constructor(apiBaseUrl, config) {
        if (!apiBaseUrl) throw Error("Must include a url to an API");
        SearchBox.instanceCount += 1;
        this.api = apiBaseUrl;
        this.id = config && config.id ? config.id : SearchBox.instanceCount;
        SearchBox.instances[this.id] = this;
        this.pageSize = config && config.pageSize ? config.pageSize : 8;
        this.label = config && config.label ? config.label : null;
        this.placeholder = config && config.placeholder ? config.placeholder : null;
        this.closeAfterClear = config && config.closeAfterClear ? config.closeAfterClear : false;
        this.maxPage = config && config.maxPage ? config.maxPage : 5;
        this.typeDelay = config && config.typeDelay ? config.typeDelay : 300;
        this.scrollThresholdPercentage = config && config.scrollThresholdPercentage ? config.scrollThresholdPercentage: 0.1;
        this.timeoutID;
        this.pageNumber = 1;
        this.activeListItem = ''
        this.canFetchMatchesOnScroll = true;
        this.input = this.createInput();
        this.clearButton = this.createClearButton()
        this.searchBox = this.createSearchBox(this.label);
        this.matchList = this.creatMatchList();
        this.wrapper = this.createWrapper();
        if (SearchBox.instanceCount === 1) {
            document.addEventListener('click', SearchBox.documentOnClick);
        }
    }

    //HTML initialisation methods --------------------------------------------------------------

    createInput() {
        const input = document.createElement('input');
        input.id = `SeachInput-${this.id}`;
        input.classList.add('typeahead');
        input.type = 'text';
        if (this.placeholder !== null) {
            input.placeholder = this.placeholder;
        }
        input.autocomplete = 'off';
        input.addEventListener('click', this.mountListOfMatches);
        input.addEventListener('input', this.fetchMatchesOnType);
        return input;
    }

    createClearButton() {
        const clearButton = document.createElement('span');
        clearButton.classList.add('clear-btn');
        clearButton.id = `clear-button-${this.id}`
        clearButton.addEventListener('click', this.clearButtonOnClick);
        clearButton.textContent = 'X';
        return clearButton;
    }

    createSearchBox(labelText) {
        const wrapper = document.createElement('div');
        wrapper.classList.add('searchbox-inner');
        wrapper.id = `searchbox-inner-${this.id}`
        if (labelText !== null) {
            const label = document.createElement('label');
            label.for = this.input.id;
            label.textContent = `${labelText}`
            wrapper.appendChild(label);
        } else {
            wrapper.classList.add('no-label');
        }
        wrapper.appendChild(this.input);
        wrapper.appendChild(this.clearButton);
        return wrapper;
    }

    creatMatchList() {
        const list = document.createElement('ul');
        list.classList.add('matches-list');
        list.id = `matches-list-${this.id}`;
        return list;
    }

    createWrapper() {
        const wrapper = document.createElement('div');
        wrapper.id = `SearchBox-${this.id}`;
        wrapper.classList.add('searchbox-wrapper');
        wrapper.appendChild(this.searchBox);
        wrapper.appendChild(this.matchList);
        return wrapper;
    }

    //Life cycle methods------------------------------------------------------------------------------
    /**
     * Called on user events and is used to initialise the result list by adding and removing 
     * event listeners, setting relevant variables and making a call to fetch the results.
     */
    mountListOfMatches = () => {
        if (SearchBox.activeSearchBox !== null) {
            SearchBox.activeSearchBox.unMountListOfMatches();
        }
        SearchBox.activeSearchBox = this;
        document.addEventListener('keydown', this.onKeyDownScroll);
        document.addEventListener('keydown', this.onSelect);
        this.pageNumber = 1;
        this.fetchAndAppendMatches();
        this.input.removeEventListener('click', this.mountListOfMatches);
    }

    /**This method cleans up the results list and removes it. */
    unMountListOfMatches() {
        this.matchList.removeEventListener('scroll', this.fetchOnScroll);
        document.removeEventListener('keydown', this.onKeyDownScroll);
        document.removeEventListener('keydown', this.onSelect);
        this.activeListItem = '';
        this.matchList.innerHTML = '';
        this.input.addEventListener('click', this.mountListOfMatches);
    }

    //State handler methods--------------------------------------------------------------------------


    /**
     * This method is called on changes that happen to the state of the searchBox's input element. It keeps track of when an option was added
     * or removed and exact changes based on that change.
     */
    searchBoxOnChange = (mode) => {

        if (mode === 'Add') this.addOptionToSelectedOptions();
        if (mode ==='Remove') this.removeOptionFromSelectedOptions();
        
        SearchBox.manageSelectedOptions(mode);

        if (this.input.value.length > 0) {
            this.clearButton.classList.add('show');
        } else {
            this.clearButton.classList.remove('show');
        }
    }

    addOptionToSelectedOptions() {
        SearchBox.selectedOptions[this.id] = this.input.value;
    }
    removeOptionFromSelectedOptions() {
        delete SearchBox.selectedOptions[this.id];
    }

    //Event handler methods------------------------------------------------------------------------------------

    /**
     * Called on the input event of the input element.
     * Clears the result list and fetches new matches based on the text input of the input element.
     * It also offers the option to set a Timeout before the results are fetched.
     */
    fetchMatchesOnType = () => {
        this.unMountListOfMatches();
        clearTimeout(this.timeoutID);
        this.searchBoxOnChange('Remove');
        this.timeoutID = setTimeout(() => {
            this.mountListOfMatches();
        }, this.typeDelay);
    }

    /**Clears the result list when the clear button is clicked */
    clearButtonOnClick = () => {
        this.input.value = '';
        this.input.focus();
        if (!this.closeAfterClear) this.mountListOfMatches();
        this.searchBoxOnChange('Remove');
    }

  
    /**
     * This method fetches new results when the scrollbar is a certain distance from the container. These new results will then be appended
     * to the result list.
     * @returns undefined if the scrollbar is not beyong the treshhold otherwise calls fetchAndAppendMatches
     */
    fetchOnScroll = () => {
        if (!this.canFetchMatchesOnScroll) return;
        const scrollThreshold = this.scrollThresholdPercentage * this.matchList.clientHeight;
        const bottomSpaceLeftToScroll = this.matchList.scrollHeight - (this.matchList.scrollTop + this.matchList.clientHeight);
        if (bottomSpaceLeftToScroll > scrollThreshold) return;
        this.fetchAndAppendMatches();
    }

    /**
     * Handles the scrolling of list items using arrow keys. It changes the state of this.activeListItem which keeps
     * track of the activated list item. The activated list item becomes the nextElementSibling on ArrowDown and the 
     * previousElementSibling on ArrowUp. The active list item is always scrolled into view and added a class
     * for styling.
     * @param {object} event - Takes a keydown event.
     * @returns undefined if this.canFetchMatchesOnScroll is false
     */
    onKeyDownScroll = (event) => {
        const key = event.key;
        if (key == 'ArrowDown') {
            event.preventDefault();
            if (!this.activeListItem) {
                this.activeListItem = this.matchList.firstElementChild;
                this.activeListItem.classList.add('selected');
                this.activeListItem.scrollIntoView({ block: 'nearest' });
            } else if (this.activeListItem.nextElementSibling) {
                this.activeListItem.classList.remove('selected');
                this.activeListItem = this.activeListItem.nextElementSibling;
                
                this.activeListItem.classList.add('selected');
                this.activeListItem.scrollIntoView({ block: 'nearest' });
                if (this.canFetchMatchesOnScroll) this.fetchOnScroll();
            } else return;

        } else if (key === 'ArrowUp') {
            event.preventDefault();
            if (this.activeListItem && this.activeListItem.previousElementSibling) {
                this.activeListItem.classList.remove('selected');
                this.activeListItem = this.activeListItem.previousElementSibling;

                this.activeListItem.classList.add('selected');
                this.activeListItem.scrollIntoView({ block: 'nearest' });
                if (this.canFetchMatchesOnScroll) this.fetchOnScroll();

            } else if (this.activeListItem && !this.activeListItem.previousElementSibling) {
                this.activeListItem.classList.remove('selected');
                this.activeListItem = '';
            } 
        }
    }

    /**
     * Allows the user to select the active list item by pressing the Enter key. It will become the value of the input
     * element and will be added to the selectedOptions container. The result list is cleared by calling this.unMountListOfMatches 
     * @param {object} event - keydown event
     */
    onSelect = (event) => {
        if (event.keyCode === 13 || event.which === 13) {
            if (this.activeListItem) {
              this.input.value = this.activeListItem.textContent;
              this.unMountListOfMatches();
              this.searchBoxOnChange('Add');
            }
          }
    }

    /**
     * Assigns the targeted list item to this.activeListItem giving it the selected class for styling.
     * @param {object} event - mousemove event
     */
    listItemMouseMove = (event) => {
        if (this.activeListItem) {
            this.activeListItem.classList.remove('selected');
        }
        this.activeListItem = event.target;
        this.activeListItem.classList.add('selected');
        this.activeListItem.addEventListener('mouseout', this.unselectListItemOnMouseOut)
    }

    /**
     * The input elements value becomes the clicked list items text content and it is also added to the selectedOptions container.
     * @param {object} event - click event 
     */
    listItemOnclick = (event) => {
        this.input.value = event.target.textContent;
        this.searchBoxOnChange('Add');
    }

    /**
     * Resets this.activeListItem when the cursor leaves its area.
     * @param {object} event - mouseout event 
     */
    unselectListItemOnMouseOut = (event) => {
        if (event.target === this.activeListItem) {
            this.activeListItem.classList.remove('selected');
            this.activeListItem = '';
          }
          event.target.removeEventListener('mouseout', this.unselectListItemOnMouseOut);
    }

    //Methods for making API requests--------------------------------------------------------------------------

    /**
     * Fetches the results from the API endpoint provided upon instantiation. Uses the createUrl method to create URL object for the request. 
     * Increments the this.pageNumber variable which is used in the createUrl method as a search parameter. It adds to and removes from 
     * the result list a scroll event listener and manages the this.canFetchMatchesOnScroll variable based on the hasNext property of the API. 
     */
    fetchAndAppendMatches = () => {
        this.canFetchMatchesOnScroll = false;
        const url = this.createUrl();
        fetch(url)
        .then(res => res.json())
        .then(data => {
            const [matches, hasNext] = Object.values(data);
            this.createAndAppendMatchList(matches);
            if (hasNext && this.pageNumber < this.maxPage) {
                this.pageNumber += 1;
                this.matchList.addEventListener('scroll', this.fetchOnScroll);
                this.canFetchMatchesOnScroll = true;
            } else {
                this.matchList.removeEventListener('scroll', this.fetchOnScroll);
            }   
        });
    }

    /**
     * Creates a URL object based on the specified search paramaters.
     * @returns URL object
     */
    createUrl() {
        const url = new URL(this.api);
        url.searchParams.set('text', this.input.value);
        url.searchParams.set('limit', this.pageSize);
        url.searchParams.set('page', this.pageNumber);
        return url;
    }

    //Methods for generating HTML for the result list-----------------------------------------------------

    /**Creates the HTML for the result list */
    creatMatchList() {
        const list = document.createElement('ul');
        list.classList.add('matches-list');
        list.id = `matches-list-${this.id}`;
        return list;
    }

    /**
     * Appends list items to the result list and calls this.createListItem for each match.
     * @param {list} matches - List of matching items from the API 
     */
    createAndAppendMatchList(matches) {
        const fragment = document.createDocumentFragment();
        matches.forEach(match => {
            fragment.appendChild(this.createListItem(match));
            });
            this.matchList.appendChild(fragment);
    }

    /**
     * Creates list item for a match
     * @param {string} match 
     * @returns Node object li element
     */
    createListItem(match) {
        const listItem = document.createElement('li');
        listItem.classList.add('searchbox-match-item');
        listItem.textContent = match;
        listItem.addEventListener('click', this.listItemOnclick);
        listItem.addEventListener('mousemove', this.listItemMouseMove);
        return listItem;
    }

    //Cleanup methods--------------------------------------------------------------------------------------

    /**
     * Removes the component in a clean way if the component needs to be destroyed in JavaScript.
     */
    destroy() {
        if (this === SearchBox.activeSearchBox) this.searchBox.activeSearchBox = null;
        this.unMountListOfMatches();
        this.input.removeEventListener('click', this.mountListOfMatches);
        this.input.removeEventListener('input', this.fetchMatchesOnType);
        SearchBox.instanceCount -= 1;
        if (SearchBox.instanceCount == 0) {
            document.removeEventListener('click', SearchBox.documentOnClick);
        }
        this.removeOptionFromSelectedOptions();
        delete SearchBox.instances[this.id];
        delete this;
    }

}

