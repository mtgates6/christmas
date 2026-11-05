const test = require('node:test');
const assert = require('node:assert/strict');

const {
  findCousinByToken,
  getFamilySummary,
  calculatePortfolioTotals,
  getTickerDetails,
} = require('../src/stockTracker');

const sampleData = {
  tickers: {
    HUMN: 'Roundhill Humanoid Robotics ETF',
    UFO: 'Procure Space ETF',
    IHF: 'iShares U.S. Healthcare Providers ETF'
  },
  cousins: [
    {
      id: 'matthew',
      name: 'Matthew',
      token: 'MATT01',
      holdings: [
        { ticker: 'HUMN', shares: 2, buyPrice: 27.29, currentPrice: 31.5 },
        { ticker: 'UFO', shares: 2, buyPrice: 39.45, currentPrice: 38.1 },
        { ticker: 'IHF', shares: 2, buyPrice: 60.96, currentPrice: 62.3 }
      ]
    },
    {
      id: 'scottie',
      name: 'Scottie',
      token: 'SCOT01',
      holdings: [
        { ticker: 'HUMN', shares: 1, buyPrice: 22.30, currentPrice: 31.10 },
        { ticker: 'UFO', shares: 1, buyPrice: 26.30, currentPrice: 31.10 },
        { ticker: 'IHF', shares: 1, buyPrice: 50.50, currentPrice: 67.20 }
      ]
    }
  ]
};

test('findCousinByToken resolves a valid cousin from a shared private link', () => {
  const cousin = findCousinByToken(sampleData, 'SCOT01');
  assert.equal(cousin.name, 'Scottie');
});

test('calculatePortfolioTotals sums market value and gain/loss for a cousin', () => {
  const summary = calculatePortfolioTotals(sampleData.cousins[0]);

  assert.equal(summary.costBasis, 255.4);
  assert.equal(summary.marketValue, 263.8);
  assert.equal(summary.gainLoss, 8.4);
});

test('getFamilySummary combines totals across all cousins', () => {
  const summary = getFamilySummary(sampleData);

  assert.equal(summary.cousins.length, 2);
  assert.equal(summary.totalCostBasis, 354.5);
  assert.equal(summary.totalMarketValue, 393.2);
  assert.equal(summary.totalGainLoss, 38.7);
  assert.equal(summary.averageCousin.costBasis, 177.25);
  assert.equal(summary.averageCousin.marketValue, 196.6);
  assert.equal(summary.averageCousin.gainLoss, 19.35);
});

test('getTickerDetails returns the ticker description from holdings data', () => {
  const details = getTickerDetails(sampleData, 'HUMN');

  assert.equal(details.ticker, 'HUMN');
  assert.equal(details.description, 'Roundhill Humanoid Robotics ETF');
});
