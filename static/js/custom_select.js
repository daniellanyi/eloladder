/**
 * Creates a custom select component with a list of provided options.
 */
class CustomSelect {
    static activeDropDown = null;
    static selectedOptions = {};
    static instanceCount = 0;
    static documentOnClick(event) {
        if (CustomSelect.activeDropDown !== null && event.target !== CustomSelect.activeDropDown.selectButton) {
            CustomSelect.activeDropDown.closeSelectionOnClick();
        }
    }

    /**
     * Initializes an instance of the CustomSelect class increments CustomSelect.instanceCount and adds a static event to the 
     * document.
     * @param {object} config - Object that enables the addition of an optional id and a required label and options list.
     */
    constructor(config) {
        if (!(config.options || config.label)) throw Error("Config object must include a label and an options array");
        CustomSelect.instanceCount += 1;
        this.id = config && config.id ? config.id : `custom-select-${CustomSelect.instanceCount}`;
        this.label = config.label;
        this.options = config.options
        this.selectButton = this.createSelectButton();
        this.dropDownList = this.createDropdownList();
        this.container = this.createContainer();
        if (CustomSelect.instanceCount === 1) {
            document.addEventListener('click', CustomSelect.documentOnClick);
        }
    }

    /**
     * Creates the container for component's HTML and adds the required properties.
     * @returns Node object that contains the rest of the component.
     */
    createContainer() {
        const container = document.createElement('div');
        container.id = `${this.id}`;
        container.classList.add('form-item');
        const label = document.createElement('p');
        label.textContent = `${this.label}`;
        container.appendChild(label);
        container.appendChild(this.selectButton);
        container.appendChild(this.dropDownList);
        return container
    }

    /**
     * Creates the select button part of the component with the HTML and required event listeners.
     * It also adds the initial textContent of the select button to the CustomSelect.selectedOptions container as a default value.
     * @returns Node object that is the select button of the component.
     */
    createSelectButton() {
        const selectButton = document.createElement('div');
        selectButton.classList.add('select-button');
        selectButton.id = `select-button-${this.id}`
        selectButton.addEventListener('click', this.openSelectionOnClick.bind(this));
        selectButton.addEventListener('mousedown', (event) => {
            event.target.classList.add('select-button-pressed');
        });
        selectButton.addEventListener('mouseup', (event) => {
            event.target.classList.remove('select-button-pressed');
        });
        selectButton.addEventListener('mouseout', (event) => {
            event.target.classList.remove('select-button-pressed');
        });
        selectButton.addEventListener('dblclick', (event) => {
            event.preventDefault();
        });
        selectButton.addEventListener('mousedown', (event) => {
            event.preventDefault();
        });
        const defaultOption = this.options[0];
        selectButton.textContent = defaultOption
        CustomSelect.selectedOptions[this.id] = defaultOption;
        return selectButton;
    }
   
    /**
     * Creates the HTML for the option list and list items based on each option in config.options appends
     * them to the option list. 
     * @returns Node object ul element containing the option list items
     */
    createDropdownList() {
        const dropDownList = document.createElement('ul');
        dropDownList.classList.add('dropdown-list');
        this.options.forEach(option => {
            const optionElement = document.createElement('li');
            optionElement.textContent = option;
            optionElement.classList.add('select-option');
            optionElement.addEventListener('click', this.selectOnClick.bind(this));
            dropDownList.appendChild(optionElement);
        });
        return dropDownList;
    }

    /**
     * Changes the selectButtons text content to the clicked list items text content.
     * Adds the selected option list items text content to the CustomSelect.selectedOptions container.
     * @param {object} event - click event 
     */
    selectOnClick(event) {
        const selectedOption = event.target.textContent;
        this.selectButton.textContent = selectedOption;
        CustomSelect.selectedOptions[this.id] = selectedOption;
    }

    /**
     * Opens the options list if a select button is clicked on. Makes sure that the options list
     * doesn't remain open if clicked again.
     */
    openSelectionOnClick() {
        if (CustomSelect.activeDropDown) {
            CustomSelect.activeDropDown.dropDownList.classList.remove('show-dropdown-list');
            if (CustomSelect.activeDropDown === this) {
                CustomSelect.activeDropDown = null;
                return;
            }
        }
        CustomSelect.activeDropDown = this;
        this.dropDownList.classList.add('show-dropdown-list');
    }

    /**
     * Closes the active options list when the document is clicked on.
     */
    closeSelectionOnClick = () => {
        CustomSelect.activeDropDown.dropDownList.classList.remove('show-dropdown-list');
    }

    appendTo(parentElement) {
        parentElement.appendChild(this.container);
    }

    /**
     * Deletes the component in a clean way if it needs to be destroyed in JavaScript.
     */
    destroy() {
        CustomSelect.instanceCount -= 1;
        delete CustomSelect.selectedOptions[this.id];
        if (CustomSelect.activeDropDown === this) CustomSelect.activeDropDown = null;
        if (CustomSelect.instanceCount === 0) {
            document.removeEventListener('click', CustomSelect.documentOnClick);
        }
        this.container.innerHTML = '';
        delete this;
    }
}