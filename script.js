const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

const elements = {
  form: document.querySelector("#search-form"),
  input: document.querySelector("#city-input"),
  status: document.querySelector("#status-message"),
  dashboard: document.querySelector("#weather-dashboard"),
  location: document.querySelector("#location-name"),
  date: document.querySelector("#date-label"),
  icon: document.querySelector("#weather-icon"),
  temperature: document.querySelector("#temperature"),
  description: document.querySelector("#weather-description"),
  feelsLike: document.querySelector("#feels-like"),
  humidity: document.querySelector("#humidity"),
  windSpeed: document.querySelector("#wind-speed"),
  visibility: document.querySelector("#visibility"),
  forecast: document.querySelector("#forecast-list"),
};

const weatherCodes = {
  0: ["Despejado", "☀"], 1: ["Mayormente despejado", "🌤"], 2: ["Parcialmente nublado", "⛅"],
  3: ["Nublado", "☁"], 45: ["Niebla", "〰"], 48: ["Niebla", "〰"],
  51: ["Llovizna", "🌦"], 53: ["Llovizna", "🌦"], 55: ["Llovizna", "🌦"],
  61: ["Lluvia ligera", "🌧"], 63: ["Lluvia", "🌧"], 65: ["Lluvia fuerte", "🌧"],
  71: ["Nieve ligera", "🌨"], 73: ["Nieve", "🌨"], 75: ["Nieve fuerte", "❄"],
  80: ["Chubascos", "🌦"], 81: ["Chubascos", "🌦"], 82: ["Chubascos fuertes", "⛈"],
  95: ["Tormenta", "⛈"], 96: ["Tormenta con granizo", "⛈"], 99: ["Tormenta con granizo", "⛈"],
};

function getWeatherInfo(code) {
  return weatherCodes[code] || ["Condiciones variables", "☁"];
}

function setLoading(isLoading) {
  elements.form.querySelector("button").disabled = isLoading;
  elements.dashboard.classList.toggle("is-loading", isLoading);
  elements.dashboard.setAttribute("aria-busy", String(isLoading));
}

function formatDate(dateString, options) {
  return new Intl.DateTimeFormat("es-ES", options).format(new Date(`${dateString}T12:00:00`));
}

function renderForecast(weather) {
  elements.forecast.replaceChildren();
  weather.daily.time.forEach((date, index) => {
    const [description, icon] = getWeatherInfo(weather.daily.weather_code[index]);
    const card = document.createElement("article");
    card.className = "forecast-day";
    card.innerHTML = `
      <span>${index === 0 ? "Hoy" : formatDate(date, { weekday: "short" })}</span>
      <strong>${icon}</strong>
      <small>${description}</small>
      <b>${Math.round(weather.daily.temperature_2m_max[index])}° <em>${Math.round(weather.daily.temperature_2m_min[index])}°</em></b>
    `;
    elements.forecast.append(card);
  });
}

function renderWeather(place, weather) {
  const [description, icon] = getWeatherInfo(weather.current.weather_code);
  elements.location.textContent = `${place.name}, ${place.country_code}`;
  elements.date.textContent = formatDate(weather.current.time.slice(0, 10), { weekday: "long", day: "numeric", month: "long" });
  elements.icon.textContent = icon;
  elements.temperature.textContent = Math.round(weather.current.temperature_2m);
  elements.description.textContent = description;
  elements.feelsLike.textContent = Math.round(weather.current.apparent_temperature);
  elements.humidity.textContent = weather.current.relative_humidity_2m;
  elements.windSpeed.textContent = Math.round(weather.current.wind_speed_10m);
  elements.visibility.textContent = (weather.current.visibility / 1000).toFixed(1);
  renderForecast(weather);
  elements.status.textContent = "";
}

async function searchWeather(city) {
  setLoading(true);
  elements.status.textContent = "";
  try {
    const locationResponse = await fetch(`${GEOCODING_URL}?name=${encodeURIComponent(city)}&count=1&language=es&format=json`);
    if (!locationResponse.ok) throw new Error("No fue posible buscar la ciudad.");
    const locationData = await locationResponse.json();
    const place = locationData.results?.[0];
    if (!place) throw new Error(`No encontramos resultados para “${city}”.`);

    const params = new URLSearchParams({
      latitude: place.latitude, longitude: place.longitude, timezone: "auto",
      current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,visibility",
      daily: "weather_code,temperature_2m_max,temperature_2m_min", forecast_days: "5",
    });
    const weatherResponse = await fetch(`${WEATHER_URL}?${params}`);
    if (!weatherResponse.ok) throw new Error("No fue posible consultar el clima.");
    renderWeather(place, await weatherResponse.json());
  } catch (error) {
    console.error("Weather request failed:", error);
    elements.status.textContent = error.message || "Ocurrió un error. Intenta de nuevo.";
  } finally {
    setLoading(false);
  }
}

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = elements.input.value.trim();
  if (city) searchWeather(city);
});

searchWeather("Bogotá");
