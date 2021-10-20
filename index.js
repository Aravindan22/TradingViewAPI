const express = require('express')
const app= express()

const tvr = require('trading-view-recommends-parser-nodejs')
var result='';
async function t() {
     result = await new tvr.TradingViewScan(
        tvr.SCREENERS_ENUM['crypto'],
        tvr.EXCHANGES_ENUM['BINANCE'],
        'STPTUSDT',
        tvr.INTERVALS_ENUM['1m'],
        // You can pass axios instance. It's optional argument (you can use it for pass custom headers or proxy)
      ).analyze();
    //   console.log(result.oscillators['RECOMMENDATION']);
    console.log(JSON.stringify(result));
}
// var intervalId = setInterval(function(){
//     t()
//   }, 100000);
t()