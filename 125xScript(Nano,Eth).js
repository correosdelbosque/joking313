//For RaiGames, and Ethcrash
//1.25x Script

//You can change these variables:
var wageredBits = 5000;//the total amount of bits to allow this script to bet with
var maxLosses = 6;//the number of losses you can take in a row, after "maxLosses" losses the program will terminate
var risingBetPercentage = .50;//percent of winnings to reinvest into betting for example if your risingBetPercentage is at .50 and 
//basebet comes out to 100 bits on 1.08 a win would give you 8 bits on win therefore 4 would be reinvested into raising your bets the other 4 would be safe and not used to bet
//if you dont want to reinvest any set it to 0 if you want to reinvest all set it to 1

//You can change these variables but it is recommended to leave them as is:
var baseCashout = 1.06;//this is the cashout that will be returned to on a win, the cashout will be variable after a loss (suggested range is 1.04x - 1.08x)
var maxBet = 100000;//RaiGames allows bets no larger than 100000 as of 1/10/18 and they have not updated API this value should be 1,000,000 on bustabit and ethcrash

//Do not change these variables:
var initialWagered = wageredBits;// has to be kept track of so that when increasing wageredBits it will increase it correctly
var currentBet;//used in determining what the current bet amount is
var currentCashout = baseCashout;//used in determining what the current cashout is
//var stopScriptOnLoss = true;//will stop the script in the event of "maxLosses" losses in a row
var playing = false;//will delay initial start by one game so that if script is ran between 'game_started' and 'game_crash' phase 
//it will not prematurly increase bet if busts below "currentCashout"
var lossStreak = 0;//number of losses in a row
var userBalance = engine.getBalance()/100;//the users balance

//used to determine if all user set variables were set to values that make sense
function idiotTest(){
	if(userBalance<wageredBits){
		throwError("wageredBits is higher than your balance");
		engine.stop();
	}
	if(maxLosses<3 || maxLosses>9){
		throwError("use a number between 3 and 9 for max losses inclusive");
		engine.stop();
	}
	if(risingBetPercentage>1 || risingBetPercentage<0){
		throwError("risingBetPercentage must be between 0 and 1 inclusive");
		engine.stop();
	}
}
idiotTest();

//calculates the base bet as determined by your maxLosses and wageredBits
function calcBase(wagered,limit){
	var base = wagered;
	var multiplier = 0.25;
	if(base>maxBet)
		base = maxBet;
	for(let i=0;i<limit-1;i++){
		base = (base*multiplier)/(multiplier+1);
	}
	if(Math.floor(base)<1){
		throwError("Need a min of " + 1*Math.pow(5,limit-1) + " bits to run with your parameters, and you only set wageredBits to " + wageredBits);
		engine.stop();
	}
	return Math.floor(base);
}
currentBet = calcBase(wageredBits,maxLosses);
//console.log(currentBet);

engine.on('game_starting', function(info) {
	if(playing){
		console.log("Current balance: " + engine.getBalance() + " will bet " + currentBet + " at " + currentCashout);
		engine.placeBet(currentBet*100, currentCashout*100);
	}
});

engine.on('game_crash', function(data) {
	if(!playing){
		playing = true;
		console.log("Game start!");
		return;
	}
	if((data.game_crash/100)<currentCashout){
		currentCashout = 1.25;
		if(lossStreak==0)
			currentBet *= 4;
		else
			currentBet *= 5;
		lossStreak++;
		console.log("LOST: new bet is " + currentBet + " new cashout is " + currentCashout);
	}
	else{
		currentBet = calcBase(Math.floor(wageredBits),maxLosses);
		currentCashout = baseCashout;
		lossStreak = 0;
		if(risingBetPercentage!=0){
			wageredBits = initialWagered;
			var newBal = parseFloat((engine.getBalance()/100-userBalance).toFixed(2));
			wageredBits += newBal*risingBetPercentage
			currentBet = calcBase(Math.floor(wageredBits),maxLosses);
		}
		console.log("WON: "+ "new bet is " + currentBet + " new cashout is " + currentCashout);
	}
	if(lossStreak==maxLosses){
		throwError("Max Losses reached")
		engine.stop();
	}
});

//Displays error screen when something bad happens, created my own div popup, instead of using javascript:alert, because
//it lays the groundwork for the next feature of the script, and it looks nicer too
//Still looks kind of ugly right now despite that, however I wanted to get a functioning error box so people who dont know how to
//use the console can still assess what is wrong with the script
function throwError(message){
	var error = document.createElement("div");
	error.style.maxWidth = "400px";
	error.style.maxHeight = "100px";
	error.style.top = 0;
	error.style.left = 0;
	error.style.bottom = 0;
	error.style.right = 0;
	error.style.position = "absolute";
	error.style.margin = "auto";
	error.style.zIndex = 1000;
	error.style.background = "grey";
	error.style.color = "white";
	error.style.borderRadius = "10px";
	
	var header = document.createElement("div");
	header.style.borderRadius = "10px 10px 0px 0px";
	header.style.background = "red";
	header.style.textAlign = "center";
	header.innerHTML = "Error!";
	var close = document.createElement("p");
	close.innerHTML = "&#9746;";
	close.style.display = "inline";
	close.style.position = "absolute";
	close.style.right = "10px";
	close.style.cursor = "pointer";
	header.appendChild(close);
	close.addEventListener("click", function(){
		document.body.removeChild(error);
	});
	error.appendChild(header);
	
	var para = document.createElement("p");
	para.style.padding = "5px"
	para.innerHTML = message;
	para.style.textAlign = "center";
	para.style.top = "500px";
	error.appendChild(para);
	
	document.body.appendChild(error);
}
