# 📈 Crypto Market Analytics Dashboard

A real-time, interactive cryptocurrency market tracker and visualizer built with **React**, **AG Grid**, and **Highcharts**. This dashboard provides real-time market overviews, interactive time-series price charts, asset comparisons, and custom watchlists.

---

## ✨ Features

* **Interactive Market Table**: Built with AG Grid v33 supporting pagination, sorting, search filtering, and custom cell renderers (sparklines, change indicators, watchlist toggles).
* **Detailed Asset Analysis**: Interactive area charts powered by Highcharts featuring range selection (`24H`, `7D`, `1M`, `1Y`) and price level indicators.
* **Multi-Asset Performance Comparison**: Compare performance trends across up to 8 top cryptocurrencies over a 7-day period.
* **CSV Export**: Export filtered market data directly to CSV with raw formatted figures.
* **Light / Dark Mode Support**: Adaptive color schemes with dynamic theme token syncing across AG Grid and Highcharts.
* **Watchlist Management**: Pin favorite tokens locally to quickly isolate and track watched assets.
* **Resilient API Handling**: Local fallback mechanism for rate limits (`429 Too Many Requests`) and mock data backstops.

---

## 🛠️ Tech Stack

* **Frontend Framework**: [React 18](https://react.dev/) (with Vite)
* **Data Grid**: [AG Grid Community](https://www.ag-grid.com/) (v33+)
* **Charting Engine**: [Highcharts](https://www.highcharts.com/) & `highcharts-react-official`
* **HTTP Client**: [Axios](https://axios-http.com/)
* **Market Data Source**: CoinGecko API (with built-in fallback/caching)

---

## 🚀 Getting Started

### Prerequisites

Ensure you have Node.js (v18.0.0 or higher) and npm installed.

```bash
node -v
npm -v