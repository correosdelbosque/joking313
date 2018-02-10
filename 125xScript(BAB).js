//For BustABit
//1.25x Script

//You can change these variables:
var wageredBits = 5000;//the total amount of bits to allow this script to bet with
var maxLosses = 6;//the number of losses you can take in a row, after "maxLosses" losses the program will terminate
var risingBetPercentage = .50;//percent of winnings to reinvest into betting for example if your risingBetPercentage is at .50 and 
//basebet comes out to 100 bits on 1.08 a win would give you 8 bits on win therefore 4 would be reinvested into raising your bets the other 4 would be safe and not used to bet
//if you dont want to reinvest any set it to 0 if you want to reinvest all set it to 1

//You can change these variables but it is recommended to leave them as is:
var baseCashout = 1.08;//this is the cashout that will be returned to on a win, the cashout will be variable after a loss (suggested range is 1.04x - 1.08x)
var maxBet = 1000000;//RaiGames allows bets no larger than 100000 as of 1/10/18 and they have not updated API this value should be 1,000,000 on bustabit and ethcrash

//Do not change these variables:
var initialWagered = wageredBits;// has to be kept track of so that when increasing wageredBits it will increase it correctly
var currentBet;//used in determining what the current bet amount is
var currentCashout = baseCashout;//used in determining what the current cashout is
//var stopScriptOnLoss = true;//will stop the script in the event of "maxLosses" losses in a row
var lossStreak = 0;//number of losses in a row
var userBalance = userInfo.balance/100;//the users balance
var totalWon = 0;//total profit from the script thus far
var prevLoss = false;//used to determine if the last game was won or lost to figure out if wageredBits should increase

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
function calcBase(wagered,limit){
	var base = wagered;
	var multiplier = 0.25;
	if(base>maxBet*1.25)
		base = maxBet*1.25;
	for(let i=0;i<limit-1;i++){
		base = (base*multiplier)/(multiplier+1);
	}
	if(Math.floor(base)<1)
		stop("Need a min of " + 1*Math.pow(5,limit-1) + " bits to run with your parameters, and you only set wageredBits to " + wageredBits);
	return Math.floor(base);
}
currentBet = calcBase(wageredBits,maxLosses);

engine.on('GAME_STARTING', function() {
	log("Current balance: " + userInfo.balance + " will bet " + currentBet + " at " + currentCashout);
	engine.bet(currentBet*100, currentCashout);
});

engine.on('GAME_ENDED', function() {
	if(engine.history.first().bust<currentCashout && engine.history.first().wager!=0){
		currentCashout = 1.25;
		if(lossStreak==0)
			currentBet *= 4;
		else
			currentBet *= 5;	
		lossStreak++;
		log("LOST: new bet is " + currentBet + " new cashout is " + currentCashout);
		prevLoss = true;
	}
	else if(engine.history.first().wager==0){
		log("Either first game or bet packet lost");
		return;
	}
	else{
		currentBet = calcBase(Math.floor(wageredBits),maxLosses);
		currentCashout = baseCashout;
		lossStreak = 0;
		if(risingBetPercentage!=0 && !prevLoss){
			wageredBits = initialWagered;
			totalWon += parseFloat((currentBet*currentCashout-currentBet).toFixed(2));
			wageredBits += totalWon*risingBetPercentage;
			currentBet = calcBase(Math.floor(wageredBits),maxLosses);
		}
		prevLoss = false;
		log("WON: "+ "new bet is " + currentBet + " new cashout is " + currentCashout);
	}
	if(lossStreak==maxLosses){
		stop("Max Losses reached");
	}
});
