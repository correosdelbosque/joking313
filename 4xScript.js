//You can change these variables:
var baseBet = 1;//bet to return to on win
var maxLoses = 4;//the number of losses you can take in a row
//this means you will need baseBet*4^(maxLoses-1) bits

//You can change these variables but it is recommended to leave them as is:
var baseCashout = 1.04;//this is the cashout that will be returned to on a win, the cashout will be variable after a loss

//Do not change these variables:
var currentBet = baseBet;//used in determining what the current bet amount is
var percent;//based on your baseBet and you maxLoses this will calculate what percent of your bits you will lose if you suffer more than "maxLoses" in a row
//this will be used to find out by how much to proportionally increase your bet while remaining under the original percent
var currentCashout = baseCashout;//used in determining what the current cashout is
var betTotal = baseBet*Math.pow(4,maxLoses-1);
var stopScriptOnLoss = true;//will terminate script on a loss,do not change this for now will update soon
var cumulativeLoss = 0;//on loss this is used to determine how much to bet at the given cashout to break back to even
var playing = false;//will delay initial start by one game so that if script is ran between 'game_started' and 'game_crash' phase 
//it will not prematurly increase bet if busts below "currentCashout"

//function used to determine if user has enough funds for the strategy they selected
function balCheck(){
	let bal = (engine.getBalance()/100);
	if(bal<betTotal){
		console.log("Based on your parameters you need a minimum of " + betTotal + " to use this strategy, and you only have " + bal);
		engine.stop();
	}
	else
		percent = betTotal/bal;
}
balCheck();


engine.on('game_starting', function(info) {
    engine.placeBet(currentBet*100, currentCashout*100);
});

engine.on('game_crash', function(data) {
	if(!playing){
		playing = true;
		return;
	}
        if((data.game_crash/100)<currentCashout && currentBet==betTotal){
		console.log("Max Loses reached")
		if(stopScriptOnLoss)
			engine.stop();
		else{//currently this is dead code
			currentBet = baseBet;
			currentCashout = baseCashout;
			cumulativeLoss = 0;
		}
	}
	else if((data.game_crash/100)<currentCashout){
		cumulativeLoss+=currentBet;
		currentBet*=4;
		currentCashout = ((cumulativeLoss/currentBet)+1).toFixed(2);
	}
	else{
		currentBet = baseBet;
		currentCashout = baseCashout;
		cumulativeLoss = 0;
		let incTest = baseBet+1;
		let incTotal = incTest*Math.pow(4,maxLoses-1);
		let bal = (engine.getBalance()/100);
		if((incTotal/bal)<percent)
			baseBet=incTest;
	}	
});
