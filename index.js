const express = require("express");
const app = express();

const tvr = require("trading-view-recommends-parser-nodejs");
const marketAPI = require("@mathieuc/tradingview");

var prev_price = 0;
var profit = 0;
var flag = false;
var bought_price = 0;
var no_of_coins = 0;

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
    cal(data.price, data.symbol);
  });
})();

function cal(cur_price, symbol) {
  var prev_profit = 0;
  if (flag == true) {
    //   prev_profit = profit;
    // profit += (
    //   (cur_price - prev_price)*no_of_coins
    // )

    master(cur_price);
    // console.log("Current Price :",cur_price,"| Bought on :",bought_price,"| Profit:",(cur_price*no_of_coins)-(bought_price * no_of_coins));
    console.log("Asset Prev Value :", bought_price * no_of_coins, "| Current Asset Value :", cur_price * no_of_coins, "| Percentage diff",  (cur_price * 100) / bought_price - 100 );
    
  } 
  else {
    buyOrSell().then((result) => {
      if (result == true) {
        flag = true;
        bought_price = cur_price;
        no_of_coins = 10 / cur_price;
        console.log("Number Of coins =>", no_of_coins);
        prev_price = cur_price;
      }
    });
  }
}

async function buyOrSell() {
  return t().then((result) => {
    console.log(result);
    if (result == "BUY") {
      return true;
    } else return false;
  });
}

function master(cur_price) {
  if ((cur_price * 100) / bought_price - 100 <= -2) {
    console.log("SELL All the Coins | Asset Sold :", cur_price * no_of_coins);
  } else if ((cur_price * 100) / bought_price - 100 > 2) {
    console.log(
      "SELL ALL Coins Profit | Asset Sold :",
      cur_price * no_of_coins
    );
  }
}

var result = "";
async function t() {
  result = await new tvr.TradingViewScan(
    tvr.SCREENERS_ENUM["crypto"],
    tvr.EXCHANGES_ENUM["BINANCE"],
    "STPTUSDT",
    tvr.INTERVALS_ENUM["1m"]
    // You can pass axios instance. It's optional argument (you can use it for pass custom headers or proxy)
  ).analyze();
  // console.log(result.oscillators['RECOMMENDATION']);
  // console.log(JSON.stringify(result));
  return result.oscillators["RECOMMENDATION"];
}
// var intervalId = setInterval(function(){
//     t()
//   }, 100000);
app.get("/",function (req,res) {
  res.send("<h1>Hi Im working</h1>")
})
app.listen(process.env.PORT || 3000,function (req,res) {
  console.log("Listening @3000");
})