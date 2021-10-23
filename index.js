const express = require("express");
const app = express();
const fs = require("fs");
const winston = require('winston');
const tvr = require("trading-view-recommends-parser-nodejs");
const marketAPI = require("@mathieuc/tradingview");
const { loggers } = require("winston");
const dotenv = require('dotenv');
dotenv.config();
const logger = winston.createLogger({
  format:winston.format.combine(winston.format.timestamp(),winston.format.printf((log)=>{
    return `* ${log.timestamp} | ${log.message}`;
  })),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'data.log'})
  ],
});

var flag = false;
var bought_price = 0;
var no_of_coins = 0;
var asset_value = 0;
var total_profit = 0;
var no_of_ProfitTrades = 0;
var no_of_LossTrades = 0;
var result = "";
var profit_percentage_threshold= process.env.PROFIT_THRESHOLD;
var loss_percentage_threshold = process.env.LOSS_THRESHOLD;
var current_asset_value = 0;
var trade_logs=""
trade_logs += "Profit_threshold :"+profit_percentage_threshold+"</br>";
trade_logs += "Loss Thershold :"+loss_percentage_threshold+"</br>";
(async () => {
  const market = marketAPI();

  market.on("logged", async () => {
    console.log("API LOGGED");

    const searchBTC = (await market.search("STPT USDT", "crypto"))[0];
    console.log("Found STPT / USDT:", searchBTC);
    market.subscribe(searchBTC.id);
  });

  market.on("price", (data) => {
    cal(data.price);
  });
})();


async function recommendation() {
  result = await new tvr.TradingViewScan(
    tvr.SCREENERS_ENUM["crypto"],
    tvr.EXCHANGES_ENUM["BINANCE"],
    "STPTUSDT",
    tvr.INTERVALS_ENUM["1m"]
  ).analyze();
  return result.oscillators["RECOMMENDATION"];
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
    trade_logs += "Coins sold at "+cur_price+"</br> ";
    trade_logs += "SELL All the Coins on LOSS| Asset Sold :"+cur_price * no_of_coins +"</br>";

    logger.info("Coins sold at "+cur_price);
    logger.info("SELL All the Coins on LOSS| Asset Sold :"+cur_price * no_of_coins );
    total_profit += (cur_price * no_of_coins)-asset_value;
    no_of_coins = 0;
    no_of_LossTrades += 1;
    flag=false;
  } else if ((cur_price * 100) / bought_price - 100 > profit_percentage_threshold) {
    trade_logs += "Coins sold at "+cur_price+"</br>";
    trade_logs += "SELL All the Coins on Profit| Asset Sold :"+cur_price * no_of_coins +"</br>";

    logger.info("Coins sold at "+cur_price);
    logger.info("SELL ALL Coins Profit | Asset Sold :"+cur_price * no_of_coins);
    total_profit += (cur_price * no_of_coins)-asset_value;
    no_of_coins = 0;
    no_of_ProfitTrades += 1;
    flag=false;
  }
  current_asset_value = no_of_coins * cur_price;
}

function cal(cur_price, symbol) {
  console.log("Current Price",cur_price);
  var prev_profit = 0;
  if (flag == true) {
    master(cur_price);
    // console.log("Current Price :",cur_price,"| Bought on :",bought_price,"| Profit:",(cur_price*no_of_coins)-(bought_price * no_of_coins));
    console.log(
      "Asset Original Value :",
      bought_price * no_of_coins,
      "| Current Asset Value :",
      cur_price * no_of_coins,
      "| Percentage diff",
      (cur_price * 100) / bought_price - 100
    );
  } else {
    console.log("Calling BuyOrSell");
    buyOrSell().then((result) => {
      if (result == true) {
        flag = true;
        bought_price = cur_price;
        no_of_coins = 10 / cur_price;
        trade_logs += "No of coins bought" + no_of_coins +"</br>";
        trade_logs += "Coins Bought at "+bought_price + "</br>";
        logger.info("Number Of coins =>"+no_of_coins);
        logger.info("Coins Bought at "+bought_price);
        asset_value = no_of_coins * cur_price;
      }
    });
  }
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
    current_asset_value +
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

    <a href="/viewlog"><button>See Log</button></a>
    <script>
    window.setInterval('refresh()', 3000); 	
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
app.get("/log",function (req,res) {
  res.download("data.log")
})
app.get("/viewlog",function (req,res) {
  // const content = fs.readFileSync("./data.log");
  // let logs ='';
  // content.toString().split("*").forEach((log)=>{
  //   logs+=log+"</br>";
    
  // })
  // res.send(logs);

  res.send(`<a href="/"><button>Back</button></a><br>`+trade_logs);
})
app.listen(process.env.PORT || 3000, function (req, res) {
  console.log("Listening @3000");
});
