const formatNumber = (value, options = {}) =>
  new Intl.NumberFormat("fr-FR", options).format(value);

const charts = {};
const issHistory = { labels: [], velocity: [], altitude: [] };

const setMetric = (key, value, suffix = "") => {
  const element = document.querySelector(`[data-metric="${key}"]`);
  if (element) {
    element.textContent = `${value}${suffix}`;
  }
};

const setSourceStatus = (key, status, isError = false) => {
  const element = document.querySelector(`[data-source="${key}"]`);
  if (element) {
    element.textContent = status;
    element.style.color = isError ? "#fca5a5" : "#94a3b8";
  }
};

const updateClock = () => {
  const now = new Date();
  const formatted = now.toLocaleString("fr-FR", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const clock = document.getElementById("liveClock");
  if (clock) {
    clock.textContent = `Dernière mise à jour : ${formatted}`;
  }
};

const createBarChart = (ctx, label, color) =>
  new Chart(ctx, {
    type: "bar",
    data: { labels: [], datasets: [{ label, data: [], backgroundColor: color }] },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: "#e2e8f0" } } },
      scales: {
        x: { ticks: { color: "#94a3b8" } },
        y: { ticks: { color: "#94a3b8" } },
      },
    },
  });

const createLineChart = (ctx, label, color) =>
  new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label,
          data: [],
          borderColor: color,
          backgroundColor: color.replace("1)", "0.2)"),
          tension: 0.35,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: "#e2e8f0" } } },
      scales: {
        x: { ticks: { color: "#94a3b8" } },
        y: { ticks: { color: "#94a3b8" } },
      },
    },
  });

const createDualLineChart = (ctx, labels, datasetConfigs) =>
  new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: datasetConfigs,
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: "#e2e8f0" } } },
      scales: {
        x: { ticks: { color: "#94a3b8" } },
        y: { ticks: { color: "#94a3b8" } },
      },
    },
  });

const initCharts = () => {
  charts.crypto = createBarChart(
    document.getElementById("cryptoChart"),
    "Prix USD",
    "rgba(56, 189, 248, 0.8)"
  );
  charts.cryptoChange = createBarChart(
    document.getElementById("cryptoChangeChart"),
    "Variation 24h (%)",
    "rgba(248, 113, 113, 0.8)"
  );
  charts.fx = createBarChart(
    document.getElementById("fxChart"),
    "Taux",
    "rgba(34, 197, 94, 0.8)"
  );
  charts.temp = createLineChart(
    document.getElementById("tempChart"),
    "Température °C",
    "rgba(99, 102, 241, 1)"
  );
  charts.wind = createLineChart(
    document.getElementById("windChart"),
    "Vent km/h",
    "rgba(14, 165, 233, 1)"
  );
  charts.quakes = createBarChart(
    document.getElementById("quakesChart"),
    "Magnitude",
    "rgba(251, 146, 60, 0.8)"
  );
  charts.air = createBarChart(
    document.getElementById("airChart"),
    "PM2.5 µg/m³",
    "rgba(129, 140, 248, 0.8)"
  );
  charts.spacex = createBarChart(
    document.getElementById("spacexChart"),
    "Lancements",
    "rgba(45, 212, 191, 0.8)"
  );
  charts.bikes = createBarChart(
    document.getElementById("bikesChart"),
    "Vélos disponibles",
    "rgba(192, 132, 252, 0.8)"
  );
  charts.iss = createDualLineChart(document.getElementById("issChart"), [], [
    {
      label: "Vitesse km/h",
      data: [],
      borderColor: "rgba(248, 113, 113, 1)",
      backgroundColor: "rgba(248, 113, 113, 0.2)",
      tension: 0.35,
      fill: true,
    },
    {
      label: "Altitude km",
      data: [],
      borderColor: "rgba(59, 130, 246, 1)",
      backgroundColor: "rgba(59, 130, 246, 0.2)",
      tension: 0.35,
      fill: true,
    },
  ]);
};

const safeFetch = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Bad response");
    return await response.json();
  } catch (error) {
    return null;
  }
};

const updateCrypto = async () => {
  const data = await safeFetch(
    "https://api.coincap.io/v2/assets?ids=bitcoin,ethereum,solana,cardano,binance-coin"
  );
  if (!data) {
    setSourceStatus("crypto", "CoinCap indisponible", true);
    setSourceStatus("cryptoChange", "CoinCap indisponible", true);
    return;
  }

  const assets = data.data;
  charts.crypto.data.labels = assets.map((asset) => asset.symbol);
  charts.crypto.data.datasets[0].data = assets.map((asset) =>
    Number(asset.priceUsd)
  );
  charts.crypto.update();

  charts.cryptoChange.data.labels = assets.map((asset) => asset.symbol);
  charts.cryptoChange.data.datasets[0].data = assets.map((asset) =>
    Number(asset.changePercent24Hr)
  );
  charts.cryptoChange.update();

  const btc = assets.find((asset) => asset.id === "bitcoin");
  if (btc) {
    setMetric("btc", `$${formatNumber(Number(btc.priceUsd), {
      maximumFractionDigits: 0,
    })}`);
  }

  setSourceStatus("crypto", "Source : CoinCap (temps réel)");
  setSourceStatus("cryptoChange", "Source : CoinCap (24h)");
};

const updateFx = async () => {
  const data = await safeFetch(
    "https://api.exchangerate.host/latest?base=EUR&symbols=USD,GBP,JPY,CHF,CAD"
  );
  if (!data) {
    setSourceStatus("fx", "ExchangeRate.host indisponible", true);
    return;
  }

  const entries = Object.entries(data.rates);
  charts.fx.data.labels = entries.map(([symbol]) => symbol);
  charts.fx.data.datasets[0].data = entries.map(([, value]) => value);
  charts.fx.update();

  const eurUsd = data.rates.USD;
  if (eurUsd) {
    setMetric("eurusd", formatNumber(eurUsd, { maximumFractionDigits: 3 }));
  }

  setSourceStatus("fx", "Source : ExchangeRate.host");
};

const updateWeather = async () => {
  const data = await safeFetch(
    "https://api.open-meteo.com/v1/forecast?latitude=48.8566&longitude=2.3522&hourly=temperature_2m,wind_speed_10m&forecast_hours=12&timezone=Europe%2FParis"
  );
  if (!data) {
    setSourceStatus("weather", "Open-Meteo indisponible", true);
    setSourceStatus("wind", "Open-Meteo indisponible", true);
    return;
  }

  const labels = data.hourly.time.map((time) => time.slice(11, 16));
  charts.temp.data.labels = labels;
  charts.temp.data.datasets[0].data = data.hourly.temperature_2m;
  charts.temp.update();

  charts.wind.data.labels = labels;
  charts.wind.data.datasets[0].data = data.hourly.wind_speed_10m;
  charts.wind.update();

  setSourceStatus("weather", "Source : Open-Meteo");
  setSourceStatus("wind", "Source : Open-Meteo");
};

const updateQuakes = async () => {
  const data = await safeFetch(
    "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
  );
  if (!data) {
    setSourceStatus("quakes", "USGS indisponible", true);
    return;
  }

  const features = data.features
    .filter((feature) => feature.properties.mag !== null)
    .sort((a, b) => b.properties.mag - a.properties.mag)
    .slice(0, 8);

  charts.quakes.data.labels = features.map((feature) =>
    feature.properties.place.split(",")[0]
  );
  charts.quakes.data.datasets[0].data = features.map(
    (feature) => feature.properties.mag
  );
  charts.quakes.update();

  setMetric("quakes", formatNumber(data.metadata.count));
  setSourceStatus("quakes", "Source : USGS (24h)");
};

const updateAir = async () => {
  const data = await safeFetch(
    "https://api.openaq.org/v2/latest?limit=5&parameter=pm25&sort=desc"
  );
  if (!data) {
    setSourceStatus("air", "OpenAQ indisponible", true);
    return;
  }

  const results = data.results.map((entry) => {
    const value = entry.measurements[0]?.value ?? 0;
    return { city: entry.city || entry.location, value };
  });

  charts.air.data.labels = results.map((entry) => entry.city);
  charts.air.data.datasets[0].data = results.map((entry) => entry.value);
  charts.air.update();

  setSourceStatus("air", "Source : OpenAQ (PM2.5)");
};

const updateSpaceX = async () => {
  const data = await safeFetch("https://api.spacexdata.com/v4/launches/upcoming");
  if (!data) {
    setSourceStatus("spacex", "SpaceX indisponible", true);
    return;
  }

  const counts = data.reduce((acc, launch) => {
    const year = new Date(launch.date_utc).getFullYear();
    acc[year] = (acc[year] || 0) + 1;
    return acc;
  }, {});

  const labels = Object.keys(counts).sort();
  charts.spacex.data.labels = labels;
  charts.spacex.data.datasets[0].data = labels.map((year) => counts[year]);
  charts.spacex.update();

  setMetric("launches", formatNumber(data.length));
  setSourceStatus("spacex", "Source : SpaceX API");
};

const updateBikes = async () => {
  const data = await safeFetch("https://api.citybik.es/v2/networks/velib");
  if (!data) {
    setSourceStatus("bikes", "CityBikes indisponible", true);
    return;
  }

  const stations = data.network.stations
    .sort((a, b) => b.free_bikes - a.free_bikes)
    .slice(0, 6);

  charts.bikes.data.labels = stations.map((station) => station.name);
  charts.bikes.data.datasets[0].data = stations.map(
    (station) => station.free_bikes
  );
  charts.bikes.update();

  setSourceStatus("bikes", "Source : CityBikes (Vélib)");
};

const updateIss = async () => {
  const data = await safeFetch(
    "https://api.wheretheiss.at/v1/satellites/25544"
  );
  if (!data) {
    setSourceStatus("iss", "WhereTheISS indisponible", true);
    return;
  }

  const timestamp = new Date(data.timestamp * 1000).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  issHistory.labels.push(timestamp);
  issHistory.velocity.push(data.velocity);
  issHistory.altitude.push(data.altitude);

  if (issHistory.labels.length > 10) {
    issHistory.labels.shift();
    issHistory.velocity.shift();
    issHistory.altitude.shift();
  }

  charts.iss.data.labels = [...issHistory.labels];
  charts.iss.data.datasets[0].data = [...issHistory.velocity];
  charts.iss.data.datasets[1].data = [...issHistory.altitude];
  charts.iss.update();

  setSourceStatus("iss", "Source : WhereTheISS.at");
};

const refreshAll = () => {
  updateCrypto();
  updateFx();
  updateWeather();
  updateQuakes();
  updateAir();
  updateSpaceX();
  updateBikes();
  updateIss();
};

initCharts();
updateClock();
refreshAll();

setInterval(updateClock, 1000);
setInterval(refreshAll, 60000);
setInterval(updateIss, 5000);
