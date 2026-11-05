const express = require('express');
const path = require('node:path');
const {
  loadHoldingsData,
  findCousinByToken,
  calculatePortfolioTotals,
  getFamilySummary,
  getTickerDetails,
  formatCurrency,
} = require('./src/stockTracker');

const app = express();
const port = process.env.PORT || 3000;
const config = {
  familyToken: 'family',
  showFamilyViewLink: true,
  publicMode: true,
};

const data = loadHoldingsData();

function setNoCache(res) {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
}

function renderTickerCell(ticker) {
  const details = getTickerDetails(data, ticker);
  return `
    <div class="ticker-cell">
      <span class="ticker-symbol">${details.ticker}</span>
      <small class="ticker-description">${details.description}</small>
    </div>
  `;
}

function renderLayout(title, content) {
  const assetVersion = Date.now();

  return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
        <link rel="stylesheet" href="/styles.css?v=${assetVersion}" />
      </head>
      <body>
        <div class="page-shell gift-page">
          <div class="gift-reveal" aria-live="polite">
            <div class="gift-box gift-box-left"></div>
            <div class="gift-box gift-box-right"></div>
            <div class="gift-lid"></div>
            <div class="gift-ribbon"></div>
            <button class="gift-trigger" type="button">Open your Christmas gift</button>
          </div>
          <div class="gift-content">
            ${content}
          </div>
        </div>

        <script>
          document.addEventListener('DOMContentLoaded', function () {
            const page = document.querySelector('.gift-page');
            const trigger = document.querySelector('.gift-trigger');
            if (!page || !trigger) return;

            trigger.addEventListener('click', function () {
              page.classList.add('revealed');
            });
          });
        </script>
      </body>
    </html>`;
}

function renderCousinPage(cousin) {
  const summary = calculatePortfolioTotals(cousin);
  const familyLink = config.showFamilyViewLink
    ? `<p class="utility"><a href="/family/${config.familyToken}">Family view</a></p>`
    : '';

  const holdingsRows = cousin.holdings
    .map((holding) => {
      const currentValue = holding.shares * holding.currentPrice;
      const gainLoss = currentValue - holding.shares * holding.buyPrice;
      return `
        <tr>
          <td>${renderTickerCell(holding.ticker)}</td>
          <td>${holding.shares}</td>
          <td>${formatCurrency(holding.buyPrice)}</td>
          <td>${formatCurrency(holding.currentPrice)}</td>
          <td>${formatCurrency(currentValue)}</td>
          <td class="${gainLoss >= 0 ? 'positive' : 'negative'}">${formatCurrency(gainLoss)}</td>
        </tr>`;
    })
    .join('');

  return renderLayout(
    `${cousin.name}'s Christmas Gift`,
    `
      <header class="gift-banner">
        <p class="eyebrow">From Nana & Papa</p>
        <h1>For ${cousin.name}</h1>
        <p class="subtitle">Merry Christmas! This year’s investment is all yours.</p>
        ${familyLink}
      </header>

      <section class="summary-grid">
        <div class="summary-card">
          <span>Cost Basis</span>
          <strong>${formatCurrency(summary.costBasis)}</strong>
        </div>
        <div class="summary-card">
          <span>Current Value</span>
          <strong>${formatCurrency(summary.marketValue)}</strong>
        </div>
        <div class="summary-card ${summary.gainLoss >= 0 ? 'positive' : 'negative'}">
          <span>Net Gain / Loss</span>
          <strong>${formatCurrency(summary.gainLoss)}</strong>
        </div>
      </section>

      <section class="panel">
        <h2>Holdings</h2>
        <table>
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Shares</th>
              <th>Buy Price</th>
              <th>Current Price</th>
              <th>Value</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            ${holdingsRows}
          </tbody>
        </table>
      </section>
    `
  );
}

function renderFamilyPage() {
  const summary = getFamilySummary(data);

  const aggregateRows = summary.aggregateHoldings
    .map(
      (holding) => `
        <tr>
          <td>${renderTickerCell(holding.ticker)}</td>
          <td>${holding.shares}</td>
          <td>${formatCurrency(holding.costBasis)}</td>
          <td>${formatCurrency(holding.marketValue)}</td>
          <td class="${holding.gainLoss >= 0 ? 'positive' : 'negative'}">${formatCurrency(holding.gainLoss)}</td>
        </tr>`
    )
    .join('');

  return renderLayout(
    "Grandparents' Family View",
    `
      <header class="gift-banner family-banner">
        <p class="eyebrow">Family Christmas Review</p>
        <h1>Grandparents' Portfolio Overview</h1>
        <p class="subtitle">A festive look at this year’s family investment gift, all together.</p>
      </header>

      <section class="summary-grid">
        <div class="summary-card">
          <span>Total Cost Basis</span>
          <strong>${formatCurrency(summary.totalCostBasis)}</strong>
        </div>
        <div class="summary-card">
          <span>Total Market Value</span>
          <strong>${formatCurrency(summary.totalMarketValue)}</strong>
        </div>
        <div class="summary-card ${summary.totalGainLoss >= 0 ? 'positive' : 'negative'}">
          <span>Total Gain / Loss</span>
          <strong>${formatCurrency(summary.totalGainLoss)}</strong>
        </div>
      </section>

      <section class="panel">
        <h2>Aggregated Holdings</h2>
        <table>
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Shares</th>
              <th>Cost Basis</th>
              <th>Current Value</th>
              <th>Gain / Loss</th>
            </tr>
          </thead>
          <tbody>${aggregateRows}</tbody>
        </table>
      </section>

      <section class="panel">
        <h2>Per Cousin Performance</h2>
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Cost Basis</td>
              <td>${formatCurrency(summary.averageCousin.costBasis)}</td>
            </tr>
            <tr>
              <td>Current Value</td>
              <td>${formatCurrency(summary.averageCousin.marketValue)}</td>
            </tr>
            <tr>
              <td>Gain / Loss</td>
              <td class="${summary.averageCousin.gainLoss >= 0 ? 'positive' : 'negative'}">${formatCurrency(summary.averageCousin.gainLoss)}</td>
            </tr>
          </tbody>
        </table>
      </section>
    `
  );
}

app.use((req, res, next) => {
  if (req.path.endsWith('.css') || req.path.endsWith('.js')) {
    setNoCache(res);
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (_req, res) => {
  setNoCache(res);
  res.send(
    renderLayout(
      'Private Christmas Tracker',
      `
        <header class="gift-banner">
          <p class="eyebrow">Private Holiday Gift</p>
          <h1>Christmas Stock Tracker</h1>
          <p class="subtitle">A little personal Christmas investment surprise, just for the family.</p>
        </header>
      `
    )
  );
});

app.get('/c/:token', (req, res) => {
  setNoCache(res);
  const cousin = findCousinByToken(data, req.params.token);

  if (!cousin) {
    res.status(404).send(
      renderLayout(
        'Not Found',
        `
          <header class="gift-banner">
            <p class="eyebrow">Private Link</p>
            <h1>That page could not be found.</h1>
            <p class="subtitle">Please check the link provided in your holiday message.</p>
          </header>
        `
      )
    );
    return;
  }

  res.send(renderCousinPage(cousin));
});

app.get('/family', (_req, res) => {
  setNoCache(res);
  res.send(renderFamilyPage());
});

app.get('/family/:token', (req, res) => {
  setNoCache(res);

  if (config.publicMode) {
    res.send(renderFamilyPage());
    return;
  }

  if (req.params.token.toUpperCase() !== config.familyToken.toUpperCase()) {
    res.status(404).send(
      renderLayout(
        'Not Found',
        `
          <header class="gift-banner">
            <p class="eyebrow">Private Link</p>
            <h1>Family page unavailable.</h1>
            <p class="subtitle">This grandparent view requires the correct private family link.</p>
          </header>
        `
      )
    );
    return;
  }

  res.send(renderFamilyPage());
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Christmas stock tracker running on http://localhost:${port}`);
  });
}

module.exports = app;
