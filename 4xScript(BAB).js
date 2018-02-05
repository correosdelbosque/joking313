//BustABit 4x

//You can change these variables:
var wageredBits = 5000;//the total amount of bits to allow this script to bet with
var maxLosses = 6;//the number of losses you can take in a row, after "maxLosses" losses the program will terminate
var risingBetPercentage = .50;//percent of winnings to reinvest into betting for example if your risingBetPercentage is at .50 and 
//basebet comes out to 100 bits on 1.08 a win would give you 8 bits, therefore 4 would be reinvested into raising your bets the other 4 would be safe and not used to bet
//if you dont want to reinvest any set it to 0 if you want to reinvest all set it to 1

//You can change these variables but it is recommended to leave them as is:
var baseCashout = 1.06;//this is the cashout that will be returned to on a win, the cashout will be variable after a loss (suggested range is 1.04x - 1.08x)
var maxBet = 1000000;//RaiGames allows bets no larger than 100000 as of 1/10/18 and they have not updated API this value should be 1,000,000 on bustabit and ethcrash

//Do not change these variables:
var initialWagered = wageredBits;// has to be kept track of so that when increasing wageredBits it will increase it correctly
var currentBet;//used in determining what the current bet amount is
var currentCashout = baseCashout;//used in determining what the current cashout is
//var stopScriptOnLoss = true;//will stop the script in the event of "maxLosses" losses in a row
var cumulativeLoss = 0;// the cumulative loss of the current loss streak
var playing = false;//will delay initial start by one game so that if script is ran between 'game_started' and 'game_crash' phase 
//it will not prematurly increase bet if busts below "currentCashout"
var lossStreak = 0;//number of losses in a row
var userBalance = userInfo.balance/100;//the users balancce

//used to determine if all user set variables were set to values that make sense
function idiotTest(){
	if(userBalance<wageredBits)
		stop("wageredBits is higher than your balance");
	if(maxLosses<3 || maxLosses>9)
		stop("use a number between 3 and 9 for max losses inclusive");
	if(risingBetPercentage>1 || risingBetPercentage<0)
		stop("risingBetPercentage must be between 0 and 1 inclusive");
}
idiotTest();

//calculates the base bet as determined by your maxLosses and wageredBits
function calcBase(bits,num){
	var sigma = [1,5,21,85,341,1365,5461,21845,87381];
	var bases = [1,4,16,64,256,1024,4096,16384,65536];
	if(bits/sigma[num-1]<1)
		stop("You need at least " + sigma[num-1] + " bits to run with your parameters, and you only set wageredBits to " + wageredBits);
	else if(bits/sigma[num-1]*bases[num-1]>maxBet){
		var maxBet = maxBet;
		for(let i=0;i<num-1;i++)
			maxBet /= 4;
		return Math.floor(maxBet);
	}
	else{
		return Math.floor(bits/sigma[num-1]);
	}
}
currentBet = calcBase(wageredBits,maxLosses);

engine.on('GAME_STARTING', function() {
	if(playing){
		log("Current balance: " + userInfo.balance + " will bet " + currentBet + " at " + currentCashout);
		engine.bet(currentBet*100, currentCashout);
	}
});

engine.on('GAME_ENDED', function() {
	if(!playing){
		playing = true;
		log("Game start!");
		return;
	}
	if(engine.history.first().bust<currentCashout){
		cumulativeLoss+=currentBet;
		currentBet*=4;
		currentCashout = parseFloat(((cumulativeLoss/currentBet)+1).toFixed(2));
		lossStreak++;
		log("LOST: new bet is " + currentBet + " new cashout is " + currentCashout);
	}
	else{
		log("WON");
		currentBet = calcBase(Math.floor(wageredBits),maxLosses);
		currentCashout = baseCashout;
		cumulativeLoss = 0;
		lossStreak = 0;
		if(risingBetPercentage!=0){
			wageredBits = initialWagered;
			var newBal = parseFloat((userInfo.balance/100-userBalance).toFixed(2));
			wageredBits += newBal*risingBetPercentage;
			log("wagered bits is now " + wageredBits);
			currentBet = calcBase(wageredBits,maxLosses);
		}
	}
	if(lossStreak==maxLosses){
		stop("Max Losses reached");
	}
});
