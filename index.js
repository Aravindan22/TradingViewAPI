const express = require("express");
const app = express();

const tvr = require("trading-view-recommends-parser-nodejs");
const marketAPI = require("@mathieuc/tradingview");

var prev_price = 0;
var profit = 0;
var flag = false;
var bought_price = 0;
var no_of_coins = 0;
var asset_value=0;
var total_profit=0;
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
        asset_value = no_of_coins * cur_price;
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
  if ((cur_price * 100) / bought_price - 100 <= -1) {
    console.log("SELL All the Coins | Asset Sold :", cur_price * no_of_coins);
    total_profit += asset_value - (cur_price*no_of_coins);
    no_of_coins=0;
  } else if ((cur_price * 100) / bought_price - 100 > 2) {
    console.log("SELL ALL Coins Profit | Asset Sold :",cur_price * no_of_coins);
    total_profit += asset_value - (cur_price*no_of_coins);
    no_of_coins=0;
  }
  asset_value=no_of_coins*cur_price;
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


  let s =`<!DOCTYPE html>  <html lang="en"> <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      <title>Tradey</title>
    </head>
    <body>
    <h1>Asset Value :`+asset_value+`</h1>
    <h1>Total Profit : `+total_profit+`</h1>
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
  </html>`
  // let s = "<h1>Asset Value :" +asset_value+"</h1><h1>Total Profit : "+total_profit+"</h1>";
  res.send(s);
})
app.listen(process.env.PORT || 3000,function (req,res) {
  console.log("Listening @3000");
})