
const MY_APP = 'AUTO_COMPLETE_APP';
(
  function () {
    const API_URL = 'https://restcountries.eu/rest/v2/all';
    const CRITERIA_TO_SEARCH = 'alpha3Code'; // Configurable Options

    /**
     * Dom Object references
     */
    const inputObj = document.getElementById('countryCode');
    const suggestListObj = document.getElementById('suggestionList');
    const tagContainerObj = document.getElementById('tagContainer');
    const resultWrapperObj = document.getElementById('resultWrapper');

    /**
     * All necessary variables declares on global scope
     */
    let allCountriesDetailList = null;
    let codeToCountryMap;
    let countryCodeList;
    let matchList;
    let orderedMatchedList;
    let selectedCodeList = [];


    /**
     * Event handler attached
     */
    inputObj.addEventListener('keyup', handleInputChange);
    suggestionList.addEventListener('click', selectListItem);
    tagContainerObj.addEventListener('click', removeTaggedItem);


    /**
     * Trigger on any value keyed on Input-box, Handled the input value and show suggestion based on that
     * @param {Object} evt Input Field Event 
     */
    function handleInputChange(evt) {
      let inputVal = evt.target.value.trim().toUpperCase();

      if (inputVal.length > 0) {
        if (evt.keyCode === 13) {
          if (orderedMatchedList.length > 0) {
            addSuggestedTag(orderedMatchedList[0])
          } else {
            return false;
          }
        }
        else {
          matchList = getMatchedCodeList(inputVal, countryCodeList);
          orderedMatchedList = getPrioritizedList(matchList, inputVal);
          displaySuggestedCountry(orderedMatchedList);
        }
      }
      else {
        if (selectedCodeList.length > 0 && evt.keyCode === 8) {
          removeLastCode(selectedCodeList[selectedCodeList.length - 1]);
        }

        if (suggestListObj.classList.contains('show')) {
          suggestListObj.classList.remove('show')
        }
      }
    }

    /**
     * Generate the new list in a manner that most matched item are to be put on starting and so on.
     * @param {Array} list List of Code in order of API response
     * @param {String} val 
     */
    function getPrioritizedList(list, val) {
      let fullMatch = new RegExp(val, 'i');
      let firstChar = val.charAt(0);

      let firstPriority = [];
      let secondPriority = [];
      let restList = [];

      list.forEach((item) => {
        if (item.match(fullMatch) && (firstChar === item.charAt(0))) {
          firstPriority.push(item);
        }
        else if (item.match(fullMatch)) {
          secondPriority.push(item);
        }
        else {
          restList.push(item);
        }
      })

      return [...firstPriority, ...secondPriority, ...restList]
    }

    /**
     * Select the list on click on any suggested list item and find out the selected code
     * @param {Object} evt Suggestion List item Event 
     */
    function selectListItem(evt) {
      let currItem = evt.target;
      addSuggestedTag(currItem.dataset.code);
    }

    /**
     * Clicking cross of Tagged Selected code, remove the item from list and respective places.
     * @param {Object} evt Cross of Tagged Code Event
     */
    function removeTaggedItem(evt) {
      let currItem = evt.target;
      let spanObj = currItem.parentNode;

      if (currItem.nodeName === 'I') {
        selectedCodeList.splice(selectedCodeList.indexOf(currItem.dataset.code), 1);
        countryCodeList.push(currItem.dataset.code)

        spanObj.parentNode.removeChild(spanObj);
        displayCountriesDetails(selectedCodeList);
      }
    }

    /**
     * Removed last code on backspace of input
     * @param {String} code Country code to be removed
     */
    function removeLastCode(code) {
      let currItem = document.querySelector(`#tagContainer i[data-code=${code}]`);
      let spanObj = currItem.parentNode;

      if (currItem.nodeName === 'I') {
        countryCodeList.push(code)

        spanObj.parentNode.removeChild(spanObj);
        selectedCodeList.pop();
        displayCountriesDetails(selectedCodeList);
      }
    }

    /**
     * Selected code will be added in list, tagged
     * @param {String} code Country Code to added as tag
     */
    function addSuggestedTag(code) {
      selectedCodeList.push(code);
      countryCodeList.splice(countryCodeList.indexOf(code), 1);
      tagContainerObj.innerHTML += `<span>${code}<i data-code="${code}"></i></span>`;
      inputObj.value = '';

      if (suggestListObj.classList.contains('show')) {
        suggestListObj.classList.remove('show')
      }

      displayCountriesDetails(selectedCodeList);
    }

    /**
     * Display the Countries detail of selected code list
     * @param {Array} list Selected Code List
     */
    function displayCountriesDetails(list) {
      let countryList = [], finalHtml = "<br />";

      list.forEach((item) => {
        const countryDetails = `Name: ${codeToCountryMap[item].name}, Languages: [${codeToCountryMap[item].languages.map(language => language.name)}], Currencies: [${codeToCountryMap[item].currencies.map(currency => currency.name)}]`;
        countryList.push(countryDetails);
      });

      countryList.forEach(detail =>{
        finalHtml += detail + "<br />";
      })

      resultWrapperObj.innerHTML = JSON.stringify(countryList.length ? finalHtml : []);
    }

    /**
     * Display the dom node on suggestion box
     * @param {Array} list List to be shown on suggestion
     */
    function displaySuggestedCountry(list) {
      let listContent = '<ul>';
      if (list.length > 0) {
        list.forEach(item => {
          listContent += `<li data-code="${item}"><span data-code="${item}">${codeToCountryMap[item].name}</span>: ${item}</li>`;
        });
      }
      else {
        listContent += `<li>No Result Found</li>`;
      }

      suggestListObj.innerHTML = listContent + '</ul>';
      suggestListObj.classList.add('show');
    }

    /**
     * Find out the matched code based on input value and return array of those item.
     * @param {String} val Entered input value
     * @param {Array} list All available country code list
     */
    function getMatchedCodeList(val, list) {
      var regex = new RegExp(val.split('').join('\\w*\\s*\\w*').replace(/\W/, ""), 'i');
      return list.filter((item) => {
        if (item.match(regex)) {
          return item;
        }
      });
    }

    /**
     * Make a map like { country_code: country_name}
     * @param {Array} list All countries list
     */
    function makeCountryToCodeMap(list) {
      let obj = {};
      for (let item of list) {
        obj[item[CRITERIA_TO_SEARCH]] = item;
      }
      return obj;
    }

    /**
     * Generate the map and code list from API response
     * @param {Object} response API response - All countries list
     */
    function makeInitialMap(response) {
      allCountriesDetailList = response;
      codeToCountryMap = makeCountryToCodeMap(allCountriesDetailList);
      countryCodeList = Object.keys(codeToCountryMap);
    }

    /**
     * Make AJAX call to get All countries details
     * @param {Function} callback To be invoked after getting API response
     */
    function getCountriesDetail(callback) {
      let xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
          callback(JSON.parse(this.responseText));
        }
      }
      xhttp.open('GET', API_URL, true);
      xhttp.send();
    }

    /**
     * Invoke this function on load, make API call and the after getting response invoke callback.
     */
    getCountriesDetail(makeInitialMap);


  }
)(MY_APP);