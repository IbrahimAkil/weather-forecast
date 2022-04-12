"use script";

// All selector elements
let searchContainer;
let searchFunc;
let searchBtn;
let searchTxtField;
let weatherContainer;
let newsContainer;
let arrows;
let arrowLeft;
let arrowRight;
let numberTotalDays;
let forecastDays;
let forecastContainer;
let weatherArrowsContainer;
let btnInp;
let buttonTryAgain;
let errorMsg;

/* 
search specific variables:
numberOfTotalDays: The amount of days the app forecasts (including the current day)
clicked: Default value is false, when the search icon is clicked it turn true;
The variable clicked is used as a control variable to delete the elements of the
previous search result !
*/
let numberOfTotalDays;
let clicked;

/*
lat: latitude of a city
lon: longitude of a city
*/
let lat;
let lon;

// imageMap:  Maps the weather description strings from the API to its appropiate image
const imageMap = {
    Clouds: "/images/cloud-img.png",
    Rain: "/images/icons8-rain-64.png",
    Snow: "/images/icons8-snow-64.png",
    Clear: "/images/icons8-sun-80.png",
};

// initialize the selector-element-variables and clicked variable
function init() {
    searchContainer = document.querySelector(".search-container");
    searchFunc = document.querySelector(".search-func");
    searchBtn = document.querySelector(".searchButton");
    searchTxtField = document.querySelector(".city-search");
    weatherContainer = document.querySelector(".weather-container");
    newsContainer = document.querySelector(".news-container");
    arrows = document.querySelectorAll(".arrows");
    arrowLeft = document.querySelector(".arrow--0");
    arrowRight = document.querySelector(".arrow--1");
    numberTotalDays = document.querySelector(".number-total-days");
    forecastDays = document.querySelector("#forecast-days");
    forecastContainer = document.querySelector(".forecast-container");
    weatherArrowsContainer = document.querySelector(
        ".weather-arrows-container"
    );
    btnInp = document.querySelector(".btn-inp");
    buttonTryAgain = document.querySelector(".btn-try-again");
    errorMsg = document.querySelector(".error-msg");

    clicked = false;
}
init();

// Styles the look of the two input fields, so they appear better on the site
forecastDays.setAttribute("style", `height:${searchContainer.offsetHeight}px`);

// This function checks if there is an overflow, or in other words it checks if there is a slider
function isOverflown(element) {
    return element.scrollWidth > element.clientWidth;
}

// Converts the temperature fahrenheit into Celcius
const fahrToCelcConverter = function (fahr) {
    return (((fahr - 32.0) * 5.0) / 9.0).toFixed(0);
};

// Converts the temperature kelvin into Celcius
// and also if celcTemp === -0 => it then gets converted to 0
const kelvinToCelcConverter = function (kelvin) {
    const celcTemp = Number((kelvin - 273.15).toFixed(0));

    if (celcTemp === 0) {
        return Math.abs(celcTemp);
    }
    return celcTemp;
};

// Turns the search button black when mouse hovers over it,
// and returns to its default blue color when mouse leaves the search button
searchBtn.addEventListener("mouseover", function (e) {
    e.preventDefault();
    searchTxtField.classList.add("city-search-black");
});
searchBtn.addEventListener("mouseout", function (e) {
    e.preventDefault();
    searchTxtField.classList.remove("city-search-black");
});

// Returns true when scroll bar is at the beginning
// Return false when scroll bar is NOT at the beginning
const isScrollWidthZero = function () {
    if (weatherContainer.scrollLeft === 0) {
        return true;
    }
    return false;
};

/*
arrowSetter:
Two parameter: leftAttr, rightAttr
leftAttr and rightAttr are control variables and they
represent the display attribute for the left arrow or right arrow resprectivly.
If one of them is set to "add", then the respective arrow gets hidden, 
when one of the attributes is set to "remove", then the respective arrow gets visible
*/
const arrowSetter = function (leftAttr, rightAttr) {
    if (leftAttr === "add") {
        arrowLeft.classList.add("hide");
    } else if (leftAttr === "remove") {
        arrowLeft.classList.remove("hide");
    }

    if (rightAttr === "add") {
        arrowRight.classList.add("hide");
    } else if (rightAttr === "remove") {
        arrowRight.classList.remove("hide");
    }
};

/* Checks if there is an slider,
if yes it sets the arrows accordingly
if no it removes the arrows*/
const arrowPlacer = function () {
    if (isOverflown(weatherContainer)) {
        if (isScrollWidthZero()) {
            arrowSetter("add", "remove");
        } else {
            arrowSetter("remove", "remove");
        }
    } else {
        arrowSetter("add", "add");
    }
};

// Resets the page to its initial values and style
const resetPage = function () {
    searchContainer.classList.remove("hide");
    weatherArrowsContainer.classList.remove("hide");
    buttonTryAgain.classList.add("hide");

    arrowSetter("add", "add");

    searchTxtField.value = "";
    forecastDays.value = 2;
};

// Hides all elements shows Button to Try Again and displays Error Message for why the program crashed
const showError = function (error) {
    searchContainer.classList.add("hide");
    weatherArrowsContainer.classList.add("hide");
    buttonTryAgain.classList.remove("hide");
    errorMsg.textContent = `${error.message}. TRY AGAIN!`;
};

// The heart of the application:
// When the search button is clicked, the API calls and
// the rendering of the page starts
searchBtn.addEventListener("click", function (e) {
    // number of days the user want to get weather-information about
    const selectedValue = document.getElementById("forecast-days").value;
    numberOfTotalDays = selectedValue;

    // When an user searches for the next city,
    // then all of the previous weather elements for that previous city
    // get removed
    if (clicked) {
        const weatherDay = document.querySelectorAll(".weather-day");
        for (let i = 0; i < weatherDay.length; i++) {
            weatherDay[i].remove();
        }
    }

    // Indication that the search icon has been clicked
    clicked = true;

    e.preventDefault();
    let html;
    const cityName = searchTxtField.value;
    const errorPrintMsg = `No city is called ${cityName}`;

    // At first the Geocoding API https://openweathermap.org/api/geocoding-api API gets called, through the city name that the user enters
    // and gives us the geolocations of the city so that the forecast API call can be called
    fetch(
        `http://api.openweathermap.org/geo/1.0/direct?q=${cityName}&appid=bae645fed936e72ce50b3f4fc9a309d4`
    )
        .then((response) => {
            // if there are characters which get rejected right away from the API, then
            //  the response.ok attribute is false, and therefore the cityName wasn't typed correctly
            if (!response.ok) {
                throw new Error(errorPrintMsg);
            }

            return response.json();
        })
        .then((data) => {
            // if the entered cityName consist of legal characters, then the response will be
            // successful but the cityName itself could be non-existing in this API
            if (!data.length) {
                throw new Error(errorPrintMsg);
            }

            // get the longitude and latitude of the city, and calls the One-Call-API https://openweathermap.org/api/one-call-api
            lat = data[0].lat;
            lon = data[0].lon;
            return fetch(
                `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&appid=bae645fed936e72ce50b3f4fc9a309d4`
            );
        })
        .then((response) => response.json())
        .then((data) => {
            // hides the arrows
            arrowSetter("add", "add");

            let dateDay = new Date();

            // For each number of days that the user entered,
            // an element get created which includes:
            // 1. Date: Current date, and forecasted ones) -
            // the first day is always the current day and the remaining days
            // are the days that come after it
            // For example: If the user wants to know the weather for 3 days,
            // then the first day is the current day, the second day is the next day,
            // and the thrid day is the next day.
            // 2. Image: Depending on what the description of the weather is, an
            // appropriate image gets displayed.
            // For example: If it is sunny, then a sun gets displaced on
            // the UI
            // 3. Temperature: The actual temperature gets displayed on the UI
            // 4. Feels-Like_Temperature: How it actually feels like.
            for (let i = 0; i < numberOfTotalDays; i++) {
                const dailyMainWeather = data.daily[i].weather[0].main;
                html = `<div class="weather-day">
                <p class="date-day">${dateDay.toLocaleDateString("en-US")}</p>
                <img class="weather-img" src=${imageMap[dailyMainWeather]} />
                <p class="real-celc">Temp: ${kelvinToCelcConverter(
                    data.daily[i].temp.day
                )} °C</p>
                <p class="feels-like-celc">Feels Like: ${kelvinToCelcConverter(
                    data.daily[i].feels_like.day
                )} °C</p>
                <p class="weather-descrip">Description: ${dailyMainWeather}</p>
            </div>`;
                weatherContainer.insertAdjacentHTML("beforeend", html);
                dateDay.setDate(dateDay.getDate() + 1);
            }

            // Places the arrows
            arrowPlacer();
        })
        .catch((error) => {
            // catches any error and renders it properly
            showError(error);
        });
});

// When the arrows are clicked the slider,
// goes to the right or left respectivly
arrowLeft.addEventListener("click", function () {
    weatherContainer.scrollLeft -= 115;
});
arrowRight.addEventListener("click", function () {
    weatherContainer.scrollLeft += 115;
});

// Try Again Button, when clicked resets the page!
btnInp.addEventListener("click", function () {
    resetPage();
});

// When scrolling the arrows, they have to adapt to the position of the container,
// If the slider is at the left-most side, then only the right arrow is visiable
// If the slider is at the right-most side, then only the left arrow is visiable
// If the slider is in-between, then both arrows are visiable
weatherContainer.addEventListener("scroll", (event) => {
    if (isScrollWidthZero()) {
        arrowSetter("add", "remove");
    } else if (
        weatherContainer.offsetWidth + weatherContainer.scrollLeft >=
        weatherContainer.scrollWidth
    ) {
        arrowSetter("remove", "add");
    } else {
        arrowSetter("remove", "remove");
    }
});

// When resizing the window the arrows have still to be set accordingly
window.addEventListener("resize", function () {
    arrowPlacer();
});
