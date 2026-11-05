const fs = require('node:fs');
const path = require('node:path');

function loadHoldingsData() {
  const dataFile = path.join(__dirname, '..', 'holdings.json');
  return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
}

function toNormalizedToken(value) {
  return String(value || '').trim().toUpperCase();
}

function findCousinByToken(data, token) {
  const normalizedToken = toNormalizedToken(token);
  return (data.cousins || []).find((cousin) => toNormalizedToken(cousin.token) === normalizedToken) || null;
}

function calculatePortfolioTotals(cousin) {
  const holdings = cousin?.holdings || [];

  let costBasis = 0;
  let marketValue = 0;

  for (const holding of holdings) {
    const shares = Number(holding.shares || 0);
    const buyPrice = Number(holding.buyPrice || 0);
    const currentPrice = Number(holding.currentPrice || 0);

    costBasis += shares * buyPrice;
    marketValue += shares * currentPrice;
  }

  return {
    costBasis: Number(costBasis.toFixed(2)),
    marketValue: Number(marketValue.toFixed(2)),
    gainLoss: Number((marketValue - costBasis).toFixed(2)),
  };
}

function getFamilySummary(data) {
  const cousins = data.cousins || [];
  const familyMembers = cousins.map((cousin) => ({
    ...cousin,
    summary: calculatePortfolioTotals(cousin),
  }));

  const aggregateByTicker = new Map();

  for (const cousin of cousins) {
    for (const holding of cousin.holdings || []) {
      const ticker = holding.ticker;
      const shares = Number(holding.shares || 0);
      const buyPrice = Number(holding.buyPrice || 0);
      const currentPrice = Number(holding.currentPrice || 0);

      if (!aggregateByTicker.has(ticker)) {
        aggregateByTicker.set(ticker, {
          ticker,
          shares: 0,
          costBasis: 0,
          marketValue: 0,
          gainLoss: 0,
        });
      }

      const aggregated = aggregateByTicker.get(ticker);
      aggregated.shares += shares;
      aggregated.costBasis += shares * buyPrice;
      aggregated.marketValue += shares * currentPrice;
      aggregated.gainLoss = aggregated.marketValue - aggregated.costBasis;
    }
  }

  const totalCostBasis = familyMembers.reduce((sum, cousin) => sum + cousin.summary.costBasis, 0);
  const totalMarketValue = familyMembers.reduce((sum, cousin) => sum + cousin.summary.marketValue, 0);
  const totalGainLoss = totalMarketValue - totalCostBasis;
  const averageCousin = familyMembers.length
    ? {
        costBasis: Number((totalCostBasis / familyMembers.length).toFixed(2)),
        marketValue: Number((totalMarketValue / familyMembers.length).toFixed(2)),
        gainLoss: Number((totalGainLoss / familyMembers.length).toFixed(2)),
      }
    : { costBasis: 0, marketValue: 0, gainLoss: 0 };

  return {
    cousins: familyMembers,
    averageCousin,
    aggregateHoldings: Array.from(aggregateByTicker.values()).map((holding) => ({
      ...holding,
      costBasis: Number(holding.costBasis.toFixed(2)),
      marketValue: Number(holding.marketValue.toFixed(2)),
      gainLoss: Number(holding.gainLoss.toFixed(2)),
    })),
    totalCostBasis: Number(totalCostBasis.toFixed(2)),
    totalMarketValue: Number(totalMarketValue.toFixed(2)),
    totalGainLoss: Number(totalGainLoss.toFixed(2)),
  };
}

function getTickerDetails(data, ticker) {
  const normalizedTicker = String(ticker || '').trim().toUpperCase();
  const description = data?.tickers?.[normalizedTicker] || 'Private investment holding';

  return {
    ticker: normalizedTicker,
    description,
  };
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

module.exports = {
  loadHoldingsData,
  findCousinByToken,
  calculatePortfolioTotals,
  getFamilySummary,
  getTickerDetails,
  formatCurrency,
};
