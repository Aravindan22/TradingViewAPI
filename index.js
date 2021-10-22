const express = require("express");
const app = express();
const winston = require('winston');
const tvr = require("trading-view-recommends-parser-nodejs");
const marketAPI = require("@mathieuc/tradingview");
const { loggers } = require("winston");

const logger = winston.createLogger({
  format:winston.format.combine(winston.format.timestamp(),winston.format.printf((log)=>{
    return `${log.timestamp} | ${log.message}`;
  })),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'data.log'})
  ],
});

var prev_price = 0;
var profit = 0;
var flag = false;
var bought_price = 0;
var no_of_coins = 0;
var asset_value = 0;
var total_profit = 0;
var no_of_ProfitTrades = 0;
var no_of_LossTrades = 0;
var result = "";
var profit_percentage_threshold=2 |process.env.PROFIT_THRESHOLD;
var loss_percentage_threshold =-1 |process.env.LOSS_THRESHOLD;

(async () => {
  const market = marketAPI();

  market.on("logged", async () => {
    console.log("API LOGGED");

    const searchBTC = (await market.search("STPT USDT", "crypto"))[0];
    console.log("Found STPT / USDT:", searchBTC);
    market.subscribe(searchBTC.id);
  });

  market.on("price", (data) => {
    // console.log(data.symbol, '=>', data.price);

    cal(data.price);
  });
})();

function cal(cur_price, symbol) {
  console.log(cur_price);
  var prev_profit = 0;
  if (flag == true) {
    //   prev_profit = profit;
    // profit += (
    //   (cur_price - prev_price)*no_of_coins
    // )

    master(cur_price);
    // console.log("Current Price :",cur_price,"| Bought on :",bought_price,"| Profit:",(cur_price*no_of_coins)-(bought_price * no_of_coins));
    console.log(
      "Asset Prev Value :"+
      bought_price * no_of_coins+
      "| Current Asset Value :"+
      cur_price * no_of_coins+
      "| Percentage diff"+
      (cur_price * 100) / bought_price - 100
    );
  } else {
    console.log("Calling BuyOrSell");
    buyOrSell().then((result) => {
      if (result == true) {
        flag = true;
        bought_price = cur_price;
        no_of_coins = 10 / cur_price;
        logger.info("Number Of coins =>"+no_of_coins);
        logger.info("Coins Bought at "+bought_price);
        prev_price = cur_price;
        asset_value = no_of_coins * cur_price;
      }
    });
  }
}

async function buyOrSell() {
  return recommendation().then((result) => {
    console.log(result);
    if (result == "BUY") {
      return true;
    } else return false;
  });
}

function master(cur_price) {
  if ((cur_price * 100) / bought_price - 100 <= loss_percentage_threshold && asset_value > 0) {
    logger.info("Coins sold at "+cur_price);
    logger.info("SELL All the Coins on LOSS| Asset Sold :"+cur_price * no_of_coins );
    total_profit += (cur_price * no_of_coins)-asset_value;
    no_of_coins = 0;
    no_of_LossTrades += 1;
    flag=false;
  } else if ((cur_price * 100) / bought_price - 100 > profit_percentage_threshold) {
    logger.info("Coins sold at "+cur_price);
    logger.info("SELL ALL Coins Profit | Asset Sold :"+cur_price * no_of_coins);
    total_profit += (cur_price * no_of_coins)-asset_value;
    no_of_coins = 0;
    no_of_ProfitTrades += 1;
    flag=false;
  }
  asset_value = no_of_coins * cur_price;
}


async function recommendation() {
  result = await new tvr.TradingViewScan(
    tvr.SCREENERS_ENUM["crypto"],
    tvr.EXCHANGES_ENUM["BINANCE"],
    "STPTUSDT",
    tvr.INTERVALS_ENUM["1m"]
    // You can pass axios instance. It's optional argument (you can use it for pass custom headers or proxy)
  ).analyze();

  return result.oscillators["RECOMMENDATION"];
}

app.get("/", function (req, res) {
  let s =
    `<!DOCTYPE html>  <html lang="en"> <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      <title>Tradey</title>
    </head>
    <body>
    <h3>Asset Value :` +
    asset_value +
    `</h3>
    <h3>Total Profit : ` +
    total_profit +
    `</h3>
    <h3>Profit Trades : ` +
    no_of_ProfitTrades +
    `</h3>
    <h3>Loss Trades : ` +
    no_of_LossTrades +
    `</h3>

    <button>Download</button>
    <script>
    window.setInterval('refresh()', 2000); 	
    // Call a function every 1000 milliseconds 
    // (OR 1 second).

    // Refresh or reload page.
    function refresh() {
        window .location.reload();
    }
    </script>
    </body>
  </html>`;
  // let s = "<h1>Asset Value :" +asset_value+"</h1><h1>Total Profit : "+total_profit+"</h1>";
  res.send(s);
});
app.listen(process.env.PORT || 3000, function (req, res) {
  console.log("Listening @3000");
});
