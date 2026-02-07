const formatNumber = (value) =>
  new Intl.NumberFormat("fr-FR").format(Math.round(value));

const metrics = {
  flights: 235120,
  crime: 18450,
  billionaires: 2640,
  ownership: 12900,
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

const updateMetrics = () => {
  Object.keys(metrics).forEach((key) => {
    const drift = (Math.random() - 0.4) * 150;
    metrics[key] = Math.max(0, metrics[key] + drift);
    const element = document.querySelector(`[data-metric="${key}"]`);
    if (element) {
      element.textContent = formatNumber(metrics[key]);
    }
  });
};

const createCharts = () => {
  const flightsCtx = document.getElementById("flightsChart");
  const crimeCtx = document.getElementById("crimeChart");

  if (!flightsCtx || !crimeCtx) return;

  const labels = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"];

  const flightsChart = new Chart(flightsCtx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Vols actifs",
          data: [190, 210, 260, 280, 265, 230],
          borderColor: "#38bdf8",
          backgroundColor: "rgba(56, 189, 248, 0.2)",
          tension: 0.35,
          fill: true,
        },
      ],
    },
    options: {
      plugins: {
        legend: { labels: { color: "#e2e8f0" } },
      },
      scales: {
        x: { ticks: { color: "#94a3b8" } },
        y: { ticks: { color: "#94a3b8" } },
      },
    },
  });

  const crimeChart = new Chart(crimeCtx, {
    type: "bar",
    data: {
      labels: ["Amériques", "Europe", "Afrique", "Asie", "Océanie"],
      datasets: [
        {
          label: "Crimes / min",
          data: [120, 98, 140, 160, 45],
          backgroundColor: "rgba(248, 113, 113, 0.7)",
          borderRadius: 8,
        },
      ],
    },
    options: {
      plugins: {
        legend: { labels: { color: "#e2e8f0" } },
      },
      scales: {
        x: { ticks: { color: "#94a3b8" } },
        y: { ticks: { color: "#94a3b8" } },
      },
    },
  });

  setInterval(() => {
    flightsChart.data.datasets[0].data = flightsChart.data.datasets[0].data.map(
      (value) => Math.max(150, value + (Math.random() - 0.5) * 20)
    );
    crimeChart.data.datasets[0].data = crimeChart.data.datasets[0].data.map(
      (value) => Math.max(30, value + (Math.random() - 0.5) * 15)
    );
    flightsChart.update();
    crimeChart.update();
  }, 4000);
};

updateClock();
updateMetrics();
createCharts();

setInterval(updateClock, 1000);
setInterval(updateMetrics, 5000);
