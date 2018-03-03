/**
*Gambler Fallacy Script BETA verion 1.0.0
*This script will only work on Raigames and Ethcrash
*
*WARNING THIS SCRIPT IS IN BETA AND IS ONLY POSTED HERE FOR PEOPLE WHO WANT TO HELP TEST IT, DO NOT BET LARGE AMOUNTS WITH THIS SCRIPT
*WARNING THIS SCRIPT IS IN BETA AND IS ONLY POSTED HERE FOR PEOPLE WHO WANT TO HELP TEST IT, DO NOT BET LARGE AMOUNTS WITH THIS SCRIPT
*WARNING THIS SCRIPT IS IN BETA AND IS ONLY POSTED HERE FOR PEOPLE WHO WANT TO HELP TEST IT, DO NOT BET LARGE AMOUNTS WITH THIS SCRIPT
*WARNING THIS SCRIPT IS IN BETA AND IS ONLY POSTED HERE FOR PEOPLE WHO WANT TO HELP TEST IT, DO NOT BET LARGE AMOUNTS WITH THIS SCRIPT
*WARNING THIS SCRIPT IS IN BETA AND IS ONLY POSTED HERE FOR PEOPLE WHO WANT TO HELP TEST IT, DO NOT BET LARGE AMOUNTS WITH THIS SCRIPT
*WARNING THIS SCRIPT IS IN BETA AND IS ONLY POSTED HERE FOR PEOPLE WHO WANT TO HELP TEST IT, DO NOT BET LARGE AMOUNTS WITH THIS SCRIPT
*
*If the script does not run the first time just click the run button again, it just means the external scripts did not completely load in time
**/
//You can change these:
var realmOfSaftey = 3;//set this as either 1,2,3 or 4.  This is the odds you will play with, 
  //1 means you will bet on consecutive games of at least 2 that have odds between 1 in 200 and 1 in 1000
  //2 means you will bet on consecutive games of at least 2 that have odds between 1 in 1000 and 1 in 5000
  //3 means you will bet on consecutive games of at least 3 that have odds between 1 in 5000 and 1 in 10000
  //4 means you will bet on consecutive games of at least 4 that have odds between 1 in 10000 and 1 in 25000
var risingBetPercentage = .5;//percent of winnings to reinvest into betting for example if your risingBetPercentage is at .50 and 
//basebet comes out to 100 bits on 1.08 a win would give you 8 bits on win therefore 4 would be reinvested into raising your bets the other 4 would be safe and not used to bet
//if you dont want to reinvest any set it to 0 if you want to reinvest all set it to 1
var safteyMargin = .15; //This number represented as a percent is used to determine up to what percent of total odds the game will bet to
//ie betting on 1.05 being able to withstand 3 losses in a row the odds of that happening are 1 in 5259 so for a 10% saftey margin it will bet up to a max of 525 games
//after this triple loss before switching to a different pattern or stopping until a new bust pattern appears
var wageredBits = 5000;//the total amount of bits you will wager, if there is a long loss streak this is the total amount you would lose
var maxBet = 100000;//this is the max bet size for the server you are on, for Raigames it is 100,000 for BustaBit and Ethcrash it is 500,000
//This should be determined by engine.getMaxBet()/100 but MrBit on Raigames never updated his API code :(

//change these only if you know what your doing, setting them incorrectly could break the script in unexpected ways, as there is no error checking on them
var searchIncrement = 2; //crash increment ie. the program will check 1.05 then 1.10 then 1.15 if the "searchIncrement" is 5
var maxSearch = 198; //this is the max crash point it will check up to, 200 = 2.00x

//Do not change these variables:
var table = []; //array of previous crashes
var currentCashOut = -1; //the multiplyer you will cash out at
var currentBet;//your current bet
var tableLength; //the length of the table, a longer length yeilds more reliable results but a longer initial load time, note this initial load lag happens only once
var tableOfValues = []; //holds the table of min and max times a bust can happen in a row between the odds of 1 and crashes[realmOfSaftey-1] and 1 and crashes[realmOfSaftey-1]
var tableOfOdds = [];
var crashes = [200,1000,5000,10000,25000];//the odds used to calculate max times a bust can happen in a row
var currentLimit; //used to determine how many loses can happen in a row at a given multiplier
var lossStreak = 0;//number of losses in a row
var intendedPlay = false;//sometimes packets do not make it to the server, if this happens the script will on bet the game after just like it would have on the game before,
//so it is like that game you missed never happened
var totalWon = 0;//total profit from the script thus far
var initialWagered = wageredBits;// has to be kept track of so that when increasing wageredBits it will increase it correctly
var userBalance = engine.getBalance()/100;//your balance, is used to verify you have set wageredBits to a number smaller than your balance
var theSeed;//the seed each site uses to determine crash points
var previousHash;//used to make sure all games are consecutive and none have been skipped

/**
* a funcion to make sure that all user parameters make sense
**/
function idiotTest(){
	if(realmOfSaftey>4||realmOfSaftey<1){
		throwError("realmOfSaftey variable must be between 1 and 4 inclusive.");
		engine.stop();
	}
	if(userBalance<wageredBits){
		throwError("wageredBits is higher than your balance");
		engine.stop();
	}
	if(safteyMargin<.01 || safteyMargin>1){
		throwError("use a number between .01 and 1 for max losses inclusive");
		engine.stop();
	}
	if(risingBetPercentage>1 || risingBetPercentage<0){
		throwError("risingBetPercentage must be between 0 and 1 inclusive");
		engine.stop();
	}
}
idiotTest();

/**
* since different sites have different seeds these seeds need to be hardcoded in and this script will only work on certain sites that are added below
**/
function getSite(){
	if(document.location.host=="www.ethcrash.io")
		theSeed = "0x8039f1f45f2df637488cbdbb3f2eb86615a10fe96a7ce79f721355035f3adb59";
	else if(document.location.host=="raigames.io" || document.location.host=="nanogames.io")
		theSeed = "000000000000000007a9a31ff7f07463d91af6b5454241d5faf282e5e0fe1b3a";
	else{
		throwError("Unknown site, this script currently only runs on Raigames and Ethcrash");
		engine.stop();
	}
}
getSite();

tableLength = crashes[realmOfSaftey];
for(let i=100+searchIncrement,count = 0;i<=maxSearch;i+=searchIncrement,count++){
	let keeper = 1;
	tableOfValues[count] = [];
	tableOfOdds[count] = [];
	tableOfValues[count][0] = i;
	tableOfOdds[count][0] = i;
	let inBounds = true;
	let loseProb = 1 - winProb(i);
	while(inBounds){
		let current = Math.round(1/Math.pow(loseProb,keeper));
		let next = Math.round(1/Math.pow(loseProb,keeper+1));
		let prev = Math.round(1/Math.pow(loseProb,keeper-1));
		if(current<crashes[realmOfSaftey-1] && next>crashes[realmOfSaftey]){//some multipliers such as 1.20x have odds below 1 in 200 and above 1 in 1000 but not in between
			tableOfValues[count][1] = 0;
			tableOfOdds[count][1] = 0;
			inBounds = false;
		}
		else if(prev<crashes[realmOfSaftey-1] && current>crashes[realmOfSaftey-1]){
			tableOfValues[count][1] = keeper;
			tableOfOdds[count][1] = current;
		}
		else if(current>crashes[realmOfSaftey-1] && next<crashes[realmOfSaftey]){
			tableOfValues[count][tableOfValues[count].length] = keeper;
			tableOfOdds[count][tableOfOdds[count].length] = current;
		}
		else if(current<crashes[realmOfSaftey] && next>crashes[realmOfSaftey]){
			tableOfValues[count][tableOfValues[count].length] = keeper;
			tableOfOdds[count][tableOfOdds[count].length] = current;
			inBounds = false;
		}
		if(current>crashes[realmOfSaftey])
			inBounds=false;
		keeper++;
	}
}

/**
* function that makes sure that the user has enough in wageredBits for at least one strategy 
*
*@param int wagered, the amount of bits that the user is letting the script bet with
**/
function checkMinBalanceNeeded(wagered){
	let oneFlag = false;//flag for determining if the user has at least enough balance to meet one of the strategies
	for(let i=0;i<tableOfValues.length;i++){
		if(tableOfValues[i][1]==0)
			continue;
		let needed = 1;
		let totalLoss = needed;
		for(let k = 1;k<tableOfValues[i][1];k++){
			needed = Math.ceil(totalLoss/((tableOfValues[i][0]/100)-1));
			totalLoss+=needed;
		}
		if(totalLoss<=wagered){
			oneFlag = true;
		}
	}
	if(!oneFlag){
		throwError("Dont have enough");
		engine.stop();
	}
}
checkMinBalanceNeeded(wageredBits);

/**
* this function is from the bustabit github and will calculate the probability of winning at a certain multiplier
*
*@param int cashOut, the multiplier that you want to find out the winning probability of
**/
function winProb(cashOut) {
  var factor = Math.ceil(100 * cashOut / 100);
  return (9900 / (101*(factor-1)));
}

/**
* this function throws errors in the script, usually followed by an engine.stop() call
**/
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
	error.style.zIndex = 10000;
	error.style.background = "grey";
	error.style.color = "white";
	error.style.borderRadius = "10px";
	error.style.fontFamily = "Verdana";
	
	var header = document.createElement("div");
	header.style.borderRadius = "10px 10px 0px 0px";
	header.style.background = "black";
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
	para.style.padding = "5px";
	para.innerHTML = message;
	para.style.textAlign = "center";
	para.style.top = "500px";
	error.appendChild(para);
	
	document.body.appendChild(error);
}

//Do not tamper with the following three variables, doing so will break the script, they are used for calculating sha256 hashes in order to determine previous crash points
var imported = document.createElement('script');
imported.src = "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.2/components/core.js";
document.head.appendChild(imported);

setTimeout(function(){
var imported1 = document.createElement('script');
imported1.src = "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.2/components/sha256.js";
document.head.appendChild(imported1);

var imported2 = document.createElement('script');
imported2.src = "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.2/components/hmac.js";
document.head.appendChild(imported2);
},500);

setTimeout(function(){
/**
* a function for finiding the starting bet at a certain multiplier with a certain limit
*
*@param int wagered, the total amount the better has wagered with the script
*@param int multiplier, the multiplier that the script will cash the better out at in the form 105, equaling 1.05x
*@param int limit, the number of times a better can bet in a row at a certain multiplier
**/
function calculateBaseBet(wagered,multiplier,limit){
	var base = wagered;
	var correctedMultiplier = parseFloat((multiplier/100-1).toFixed(2));
	if(base>maxBet*(correctedMultiplier+1))
		base = maxBet*(correctedMultiplier+1);
	for(let i=0;i<limit-1;i++){
		base = (base*correctedMultiplier)/(correctedMultiplier+1);
	}
	base = Math.floor(base);
	while(!testBase(base,wagered,multiplier,limit)){
		base--;
	}
	return base;
}
//console.log(calculateBaseBet(2500,162,8));

/**
*This function though not nessesary in previous scripts is needed because sometimes values come out to decimals, and due to me having to call Math.ceil on bets after losses 
*in order to make sure that it completely recovers previous losses the value had the possibility of exceeding either maxBet,wageredBits, or both
*
*@param int base, the base bet to test to make sure it exceds neither maxBet nor wageredBits
*@param int wagered, the total amount the better has wagered with the script
*@param int multiplier, the multiplier that the script will cash the better out at in the form 105, equaling 1.05x
*@param int limit, the number of times a better can bet in a row at a certain multiplier
**/
function testBase(base,wagered,multiplier,limit){
	let tempBet = base;
	let tempLoss = tempBet;
	for(let i=1;i<limit;i++){
		tempBet = Math.ceil(tempLoss/((multiplier/100)-1));
		tempLoss += tempBet;
	}
	if(wagered<tempLoss || tempBet>maxBet)
		return false;	
	else
		return true;
}

var eligibleTable = [];

/**
*Function for finding out at which multipliers a person can play with a certain wageredBits as determined by the bust limit.
*
**/
function createEligibleTable(){
	eligibleTable = [];
	let count = 0;
	for(let i=0;i<tableOfValues.length;i++){
		for(let k=1;k<tableOfValues[i].length;k++){
			eligibleTable[count] = [];
			eligibleTable[count][0] = tableOfValues[i][0];
			if(tableOfValues[i][k]==0){
				eligibleTable[count][1] = "NE";
				count++;
				continue;
			}
			let needed = 1;
			let totalLoss = needed;
			for(let j = 1; j<tableOfValues[i][k];j++){
				needed = Math.ceil(totalLoss/((tableOfValues[i][0]/100)-1));
				totalLoss+=needed;
			}
			if(totalLoss>wageredBits)
				eligibleTable[count][1] = "NE";
			else
				eligibleTable[count][1] = "E";
			count++;
		}
	}
}
createEligibleTable();

/**
* The next four functions are from the JSFiddle for calculating the crash points from the hash
**/
function divisible(hash, mod) {
    var val = 0;
    var o = hash.length % 4;
    for (var i = o > 0 ? o - 4 : 0; i < hash.length; i += 4) {
        val = ((val << 16) + parseInt(hash.substring(i, i+4), 16)) % mod;
    }
    return val === 0;
}

function genGameHash(serverSeed) {
    return CryptoJS.SHA256(serverSeed).toString()
};


function hmac(key, v) {
    var hmacHasher = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, key);
    return hmacHasher.finalize(v).toString();
}

function crashPointFromHash(serverSeed) {
    var hash = hmac(serverSeed, theSeed);

    if (divisible(hash, 101))
        return 0;

    var h = parseInt(hash.slice(0,52/4),16);
    var e = Math.pow(2,52);

    return (Math.floor((100 * e - h) / (e - h))/100).toFixed(2);
};

/**
* this funcion will generate the table of previous crash points given the most recent game hash
*
*@param String crash, the hash from the most recent game
**/
function genTable(crash){
  let hash = crash;
  for(let i=0;i<tableLength;i++){
    let outcome = crashPointFromHash(hash);
	hash = genGameHash(hash);
    table[i] = outcome;
  }
  for(let i=0;i<tableLength;i++){
    table[i] = parseFloat(table[i]);
  }
}

/**
* this function calculates the patterns of previous crashes and when they are due to appear again
**/
function calculatePatterns(){
	var prevPattern = [];
	let count = 0;
	for(let i=0;i<tableOfValues.length;i++){
		prevPattern[i] = [];
		prevPattern[i][0] = tableOfValues[i][0];
		for(let k=1;k<tableOfValues[i].length;k++){
			if(tableOfValues[i][k]==0 || eligibleTable[count][1]=="NE")
				prevPattern[i][k] = "NA";
			else
				prevPattern[i][k] = calcBreak(prevPattern[i][0]/100,tableOfValues[i][k]);
			if(prevPattern[i][k]!="NA" && prevPattern[i][k]!="overdue"){
				//console.log(prevPattern[i][0] + " " + prevPattern[i][k] + " " + prevPattern[i][k]/tableOfOdds[i][k])
				prevPattern[i][k] = prevPattern[i][k]/tableOfOdds[i][k];
				if(prevPattern[i][k]>1)
					prevPattern[i][k] = "overdue";
			}	
			count++;
		}
	}
	return prevPattern;
}
/**
* this function calculates how long ago a 'limit' busts under 'mult' happened
*
*@param double mult, the multiplier that you are looking for busts below
*@param int limit, the number of busts below mult you are looking for
**/
function calcBreak(mult,limit){
	let count = 0;
	for(let i=0;i<table.length;i++){
		if(table[i]<mult){
			count++;
			if(count==limit)
				return i-count+1;
		}
		else
			count=0;
	}
	return "overdue";
}

var theEngine = engine.getEngine();
previousHash = theEngine.tableHistory[0].hash;
genTable(previousHash);

var pattern = calculatePatterns();
var cashoutAndLimit = findLowestOdds(pattern);
if(cashoutAndLimit=="NP")
	currentCashOut="NP";
else
	currentCashOut = cashoutAndLimit[0];
if(currentCashOut!="NP"){
	currentLimit = cashoutAndLimit[1];
	currentBet = calculateBaseBet(wageredBits,currentCashOut,currentLimit);
	totalLoss = currentBet;
	intendedPlay = true;
}
else{
	intendedPlay = false;
}
/**
* this function finds the multiplier at a certain limit that has the least likelyhood of happening again soon
*
*@param array pattern, the array of previous crashes at certain multipliers
**/
function findLowestOdds(pattern){
	var lowestMult = safteyMargin;//will hold the multiplier with the lowest odds of crashing again soon
	var theMult = [-1,0];
	for(let i=0;i<pattern.length;i++)
		for(let k=1;k<pattern[i].length;k++)
			if(pattern[i][k]!="overdue" && pattern[i][k]!="NA" && pattern[i][k]<lowestMult){
				lowestMult = pattern[i][k];
				theMult[0] = pattern[i][0];
				theMult[1] = tableOfValues[i][k];
			}
	if(theMult[0]==-1)
		return "NP";//stands for not playing
	return theMult;	
}
/**
* this function is called when the game starts to place bet
**/
engine.on('game_starting', function(info) {
	if(currentCashOut!="NP"){//NP means not playing
		console.log("would bet " + currentBet + " at " + currentCashOut);
		engine.placeBet(currentBet*100,currentCashOut);
	}
});
/**
* this function analyzes what happened in the previous game and how to respond to it
**/
engine.on('game_crash', function(data) {
    table.unshift(data.game_crash/100);
    table.pop();
	if(genGameHash(data.hash)!=previousHash)
		genTable(data.hash);
	previousHash = data.hash;
	pattern = calculatePatterns();
	createOddsTable(pattern);
	updateOddsTable(OddsTable);
	if(engine.lastGamePlay()=='NOT_PLAYED'){
		if(intendedPlay)
			return;
		else{
			lossStreak = 0;
			var cashoutAndLimit = findLowestOdds(pattern);
			if(cashoutAndLimit=="NP")
				currentCashOut="NP";
			else
				currentCashOut = cashoutAndLimit[0];
			if(currentCashOut!="NP"){
				currentLimit = cashoutAndLimit[1];
				currentBet = calculateBaseBet(wageredBits,currentCashOut,currentLimit);
				totalLoss = currentBet;
				intendedPlay = true;
			}
			else{
				intendedPlay = false;
			}
			createBetTable();
			updateBetTable(betTable);
		}
	}
	else if(engine.lastGamePlay()=='LOST'){
		currentBet = Math.ceil(totalLoss/((currentCashOut/100)-1));
		totalLoss += currentBet;
		lossStreak++;
		console.log("LOST: new bet is " + currentBet + ", cashout is " + currentCashOut);
		betTable[lossStreak][1] = data.game_crash/100;
		if(lossStreak<currentLimit){
			betTable[lossStreak+1][1] = "&#8611;";
		}
		updateBetTable(betTable);
	}
	else{
		if(risingBetPercentage!=0 && lossStreak==0){
			wageredBits = initialWagered;
			totalWon += parseFloat((currentBet*(currentCashOut/100)-currentBet).toFixed(2));
			wageredBits += totalWon*risingBetPercentage;
			createEligibleTable();
		}
		lossStreak = 0;
		var cashoutAndLimit = findLowestOdds(pattern);
		if(cashoutAndLimit=="NP")
			currentCashOut="NP";
		else
			currentCashOut = cashoutAndLimit[0];
		if(currentCashOut!="NP"){
			currentLimit = cashoutAndLimit[1];
			currentBet = calculateBaseBet(wageredBits,currentCashOut,currentLimit);
			totalLoss = currentBet;
			intendedPlay = true;
		}
		else{
			intendedPlay = false;
		}
		console.log("WON: new bet is " + currentBet + ", cashout is " + currentCashOut);
		createBetTable();
		updateBetTable(betTable);
		
	}
	if(lossStreak==currentLimit){
		console.log("Max Losses Reached");
		engine.stop();
	}
});

var OddsTable = [];
var betTable = [];

/**
* this function creates the bet table that appears on the GUI
**/
function createBetTable(){
	betTable = [];
	betTable[0] = [];
	if(currentCashOut=="NP")
		betTable[0][0] = "NO Current Bet";
	else{
		let tempBet = currentBet;
		let tempLoss = totalLoss;
		for(let i=1;i<currentLimit+1;i++)
			betTable[i] = [];
		betTable[0][0] = "Multiplier"
		betTable[0][1] = "Current";
		betTable[0][2] = "Bet";
		betTable[0][3] = "Sigma";
		for(let i=1;i<currentLimit+1;i++)
			betTable[i][0] = currentCashOut;
		for(let i=1;i<currentLimit+1;i++)
			betTable[i][1] = " ";
		for(let i=1;i<currentLimit+1;i++){
			betTable[i][2] = tempBet;
			tempBet = Math.ceil(tempLoss/((currentCashOut/100)-1));
			tempLoss += tempBet;
		}
		tempLoss = totalLoss;
		for(let i=1;i<currentLimit+1;i++){
			betTable[i][3] = tempLoss;
			tempBet = Math.ceil(tempLoss/((currentCashOut/100)-1));
			tempLoss += tempBet;
		}
		betTable[1][1] = "&#8611;";
	}
}
createBetTable();

/**
* this function creates the odds table that appears on the GUI
**/
function createOddsTable(pattern){
	OddsTable = [];
	OddsTable[0] = [];
	OddsTable[0][0] = "Multiplier";
	OddsTable[0][1] = "Busts";
	OddsTable[0][2] = "Odds";
	OddsTable[0][3] = "Recent";
	let count = 1;
	for(let i=0;i<tableOfOdds.length;i++){
		for(let k=1;k<tableOfOdds[i].length;k++){
		OddsTable[count] = [];
		OddsTable[count][0] = tableOfOdds[i][0];
		OddsTable[count][1] = tableOfValues[i][k];
		OddsTable[count][2] = tableOfOdds[i][k];
		if(pattern[i][k]!="NA" && pattern[i][k]!="overdue")
			OddsTable[count][3] = parseFloat(pattern[i][k].toFixed(6));
		else
			OddsTable[count][3] = pattern[i][k];
		count++;
		}
	}
}
createOddsTable(calculatePatterns());

/**
* this function updates the bet table moving the arrow on a bust, or changing it entirely if it is switching strategies
*
*@param array matrix, matrix of bet table data
**/
var betTableData = [];
function updateBetTable(matrix){
	if(matrix[0].length==1){
		betTableData[0][0].innerHTML = matrix[0][0];
		for(let i=1;i<15;i++)
			tableOfRows[i].style.display = "none";
		for(let k = 1;k<4;k++)
			betTableData[0][k].style.display = "none";
	}
	else{
		for(let i=0;i<15;i++){
			if(i>=matrix.length){
				tableOfRows[i].style.display = "none";
			}
			else{
				tableOfRows[i].style.display = "table-row";
				for(let k=0;k<4;k++){
					betTableData[i][k].innerHTML = matrix[i][k];
					betTableData[i][k].style.display = "table-cell";
				}
			}
		}
		for(i=1;i<matrix.length;i++){
			if(betTableData[i][1].innerHTML=="↣"){
				betTableData[i][1].style.color = "DarkGreen";
				betTableData[i][1].style.fontSize = "large";
			}
			else if(betTableData[i][1].innerHTML!=" "){
				betTableData[i][1].style.color = "DarkRed";
				betTableData[i][1].style.fontSize = "x-small";
			}
		}
	}	
}

var oddsTableData = [];
/**
* this function updates the odds table, updating the appearence of previous crash patterns and allowing certain strategies if user has aquired enough bits
*
*@param array matrix, matrix of odds table data
**/
function updateOddsTable(matrix){
	for(let i=0;i<matrix.length;i++)
		for(let k=0;k<matrix[i].length;k++){
			oddsTableData[i][k].innerHTML = matrix[i][k];
		}
	for(let i=1;i<OddsTable.length;i++){
		if(OddsTable[i][2]==0)
			tableOfOddRows[i].style.color = "black";
		else if(eligibleTable[i-1][1]=="NE")
			tableOfOddRows[i].style.color = "red";
		else
			tableOfOddRows[i].style.color = "white";
	}
}

var tableOfOddRows = [];
var tableOfRows = [];

/**
* this function creates the main GUI table
**/
function createTable(){
	let div = document.createElement("div");
	div.style.minWidth = "120px";
	div.style.top = "0px";
	div.style.left = "0px";
	div.style.zIndex = 10000;
	//div.style.background = "rgba(0,0,0,0)";
	//div.style.opacity = ".75";
	div.style.color = "white";
	div.style.position = "absolute";
	div.style.borderRadius = "10px";
	div.style.fontFamily = "Verdana";
	div.style.fontSize = "x-small";
	div.style.textAlign = "center";
	div.style.backgroundColor = "black";
	
	let header = document.createElement("div");
	header.style.background = "black";
	header.style.padding = "5px";
	header.innerHTML = "Script Stats";
	header.style.borderRadius = "10px 10px 0px 0px";
	header.style.cursor = "move";
	let close = document.createElement("p");
	close.innerHTML = "&#9746;";
	close.style.display = "inline";
	close.style.position = "absolute";
	close.style.right = "10px";
	close.style.cursor = "pointer";
	header.appendChild(close);
	close.addEventListener("click", function(){
		document.body.removeChild(div);
		engine.stop();
	});
	div.appendChild(header);
	
	let betHeader = document.createElement("div");
	betHeader.style.background = "black";
	betHeader.style.padding = "5px";
	betHeader.innerHTML = "Current Bet";
	div.appendChild(betHeader);
	
	let collapseBet = document.createElement("p");
	collapseBet.style.position = "absolute";
	collapseBet.style.left = "10px";
	collapseBet.innerHTML = "&#8650;";
	collapseBet.style.display = "inline";
	collapseBet.style.cursor = "pointer";
	let collapseFlagBet = true;
	collapseBet.addEventListener("click",function(){
		if(collapseFlagBet){
			tableBet.style.display = "none";
			collapseFlagBet = false;
		}
		else{
			tableBet.style.display = "table";
			collapseFlagBet = true;
		}
	});
	betHeader.appendChild(collapseBet);
	
	let tableBet = document.createElement("TABLE");
	for(let i=0;i<15;i++){
		betTableData[i] = [];
		let row = document.createElement("TR");
		if(i%2!=0)
			row.style.backgroundColor = "LightSlateGray";
		else
			row.style.backgroundColor = "gray";
		tableOfRows[i] = row;
		if(i>=betTable.length){
			tableOfRows[i].style.display = "none";
		}
		else
			tableOfRows[i].style.display = "table-row";
		tableBet.appendChild(row);
		for(let k = 0;k<4;k++){
			let elem = document.createElement("TD");
			elem.style.display = "table-cell";
			if(betTable[0].length==1 && k>0)
				elem.style.display = "none";
			elem.style.borderLeft = "2px solid white";
			elem.style.borderRight = "2px solid white";
			elem.innerHTML = "";
			elem.style.textAlign = "center";
			elem.style.padding = "5px";
			betTableData[i][k] = elem;
			tableOfRows[i].appendChild(elem);
		}
	}
	for(let i=0;i<betTable.length;i++){
		for(let k = 0;k<betTable[i].length;k++){
			betTableData[i][k].innerHTML = betTable[i][k];
		}
	}
	for(i=1;i<betTableData.length;i++){
		if(betTableData[i][1].innerHTML=="↣"){
			betTableData[i][1].style.color = "DarkGreen";
			betTableData[i][1].style.fontSize = "large";
		}
		else if(betTableData[i][1].innerHTML!=" "){
			betTableData[i][1].style.color = "DarkRed";
			betTableData[i][1].style.fontSize = "x-small";
		}
	}
	tableBet.style.margin = "0 auto";
	tableBet.style.border = "3px solid white";
	div.appendChild(tableBet);
	
	let tableDiv = document.createElement("div");
	tableDiv.style.height = "200px";
	tableDiv.style.overflowY = "scroll";
	
	let oddHeader = document.createElement("div");
	oddHeader.style.background = "black";
	oddHeader.style.padding = "5px";
	oddHeader.innerHTML = "The Odds";
	
	let collapse = document.createElement("p");
	collapse.style.position = "absolute";
	collapse.style.left = "10px";
	collapse.innerHTML = "&#8650;";
	collapse.style.display = "inline";
	collapse.style.cursor = "pointer";
	let collapseFlag = true;
	collapse.addEventListener("click",function(){
		if(collapseFlag){
			tableDiv.style.display = "none";
			collapseFlag = false;
		}
		else{
			tableDiv.style.display = "block";
			collapseFlag = true;
		}
	});
	oddHeader.appendChild(collapse);
	
	div.appendChild(oddHeader);
	
	let table = document.createElement("TABLE");
	for(i=0;i<OddsTable.length;i++){
		oddsTableData[i] = [];
		let row = document.createElement("TR");
		if(i%2!=0)
			row.style.backgroundColor = "LightSlateGray";
		else
			row.style.backgroundColor = "gray";
		table.appendChild(row);
		tableOfOddRows[i] = row;
		for(let k = 0;k<OddsTable[i].length;k++){
			let elem = document.createElement("TD");
			elem.style.borderLeft = "2px solid white";
			elem.style.borderRight = "2px solid white";
			elem.innerHTML = OddsTable[i][k];
			elem.style.textAlign = "center";
			elem.style.padding = "5px";
			oddsTableData[i][k] = elem;
			row.appendChild(elem);
		}
	}
	for(let i=1;i<OddsTable.length;i++){
		if(OddsTable[i][2]==0){
			tableOfOddRows[i].style.color = "black";
		}
		else if(eligibleTable[i-1][1]=="NE")
			tableOfOddRows[i].style.color = "red";
	}
	table.style.border = "3px solid white";
	tableDiv.appendChild(table);
	div.appendChild(tableDiv);
	
	let menu = document.createElement("div");
	menu.style.background = "black";
	menu.innerHTML = "Menu";
	menu.style.textAlign = "center";
	menu.style.padding = "5px";
	menu.style.borderRadius = "0px 0px 10px 10px";
	menu.style.cursor = "pointer";
	menu.addEventListener("mouseover",function(){
		menu.style.backgroundColor = "DarkSlateGray";
	});
	menu.addEventListener("mouseout",function(){
		menu.style.backgroundColor = "black";
	});
	let flag = 0;
	menu.addEventListener("click",function(){
		if(flag%2==0){
			div.appendChild(help);
			div.appendChild(contact);
			div.appendChild(donate);
			menu.style.borderRadius = "0px 0px 0px 0px";
		}
		else{
			div.removeChild(help);
			div.removeChild(contact);
			div.removeChild(donate);
			menu.style.borderRadius = "0px 0px 10px 10px";
		}
		flag++;
	});
	div.appendChild(menu);
	
	let help = document.createElement("div");
	help.style.background = "black";
	help.innerHTML = "Help";
	help.style.padding = "5px";
	help.style.cursor = "pointer";
	help.addEventListener("mouseover",function(){
		help.style.backgroundColor = "DarkSlateGray";
	});
	help.addEventListener("click",createHelpBox);
	help.addEventListener("mouseout",function(){
		help.style.backgroundColor = "black";
	});
	
	let contact = document.createElement("div");
	contact.style.background = "black";
	contact.innerHTML = "Contact";
	contact.style.padding = "5px";
	contact.style.cursor = "pointer";
	contact.addEventListener("mouseover",function(){
		contact.style.backgroundColor = "DarkSlateGray";
	});
	contact.addEventListener("click",createContactBox);
	contact.addEventListener("mouseout",function(){
		contact.style.backgroundColor = "black";
	});
	
	let donate = document.createElement("div");
	donate.style.background = "black";
	donate.innerHTML = "Donate";
	donate.style.padding = "5px";
	donate.style.borderRadius = "0px 0px 10px 10px";
	donate.style.cursor = "pointer";
	donate.addEventListener("mouseover",function(){
		donate.style.backgroundColor = "DarkSlateGray";
	});
	donate.addEventListener("click",createDonateBox);
	donate.addEventListener("mouseout",function(){
		donate.style.backgroundColor = "black";
	});
	
	document.body.appendChild(div);
	
	document.getElementsByClassName("strategy-stop")[0].addEventListener("click",function inner(){
		document.body.removeChild(div);
		document.getElementsByClassName("strategy-stop")[0].removeEventListener("click",inner);
	});
	
	dragElement(div,header);
}
createTable();
/**
* this function is used to drag elements around on the screen
*
*@param element header, where the object can be grabbed where move is enabled
*@param element elmnt, the object that is to move around the screen
**/
function dragElement(elmnt,header) {
	var x1 = 0, x2 = 0, y1 = 0, y2 = 0;
	header.onmousedown = dragMouseDown;

	function dragMouseDown(e) {
		e = e || window.event;
		y1 = e.clientX;
		y2 = e.clientY;
		document.onmouseup = closeDragElement;
		document.onmousemove = elementDrag;
	}

	function elementDrag(e) {
		e = e || window.event;
		x1 = y1 - e.clientX;
		x2 = y2 - e.clientY;
		y1 = e.clientX;
		y2 = e.clientY;
		elmnt.style.top = (elmnt.offsetTop - x2) + "px";
		elmnt.style.left = (elmnt.offsetLeft - x1) + "px";
	}

	function closeDragElement() {
		document.onmouseup = null;
		document.onmousemove = null;
	}
}

/**
* this function is the donation box that appears on screen from the menu
**/
function createDonateBox(){
	let div = document.createElement("div");
	div.style.minWidth = "120px";
	div.style.top = "0px";
	div.style.left = "0px";
	div.style.zIndex = 10001;
	div.style.color = "white";
	div.style.position = "absolute";
	div.style.borderRadius = "10px";
	div.style.fontFamily = "Verdana"
	div.style.fontSize = "x-small";
	div.style.textAlign = "center";
	
	let header = document.createElement("div");
	header.style.background = "black";
	header.style.padding = "5px";
	header.innerHTML = "Donate";
	header.style.borderRadius = "10px 10px 0px 0px";
	header.style.cursor = "move";
	let close = document.createElement("p");
	close.innerHTML = "&#9746;";
	close.style.display = "inline";
	close.style.position = "absolute";
	close.style.right = "10px";
	close.style.cursor = "pointer";
	header.appendChild(close);
	close.addEventListener("click", function(){
		document.body.removeChild(div);
	});
	div.appendChild(header);
	
	let para = document.createElement("p");
	para.style.backgroundColor = "grey";
	para.style.padding = "5px";
	para.style.maxWidth = "350px";
	para.style.borderRadius = "0px 0px 10px 10px";
	para.innerHTML = "All my scripts are availible free to use, however it you would like to show your support for my scripts feel free to send me tips to the account Joking313 on BustaBit, Raigames, and Ethcrash. I appreciate it :)";
	div.appendChild(para);
	
	dragElement(div,header);
	
	document.getElementsByClassName("strategy-stop")[0].addEventListener("click",function inner(){
		document.body.removeChild(div);
		document.getElementsByClassName("strategy-stop")[0].removeEventListener("click",inner);
	});
	
	document.body.appendChild(div);
}

/**
* this function is the contact box that appears on screen from the menu
**/
function createContactBox(){
	let div = document.createElement("div");
	div.style.minWidth = "120px";
	div.style.top = "0px";
	div.style.left = "0px";
	div.style.zIndex = 10001;
	div.style.color = "white";
	div.style.position = "absolute";
	div.style.borderRadius = "10px";
	div.style.fontFamily = "Verdana"
	div.style.fontSize = "x-small";
	div.style.textAlign = "center";
	
	let header = document.createElement("div");
	header.style.background = "black";
	header.style.padding = "5px";
	header.innerHTML = "Contact";
	header.style.borderRadius = "10px 10px 0px 0px";
	header.style.cursor = "move";
	let close = document.createElement("p");
	close.innerHTML = "&#9746;";
	close.style.display = "inline";
	close.style.position = "absolute";
	close.style.right = "10px";
	close.style.cursor = "pointer";
	header.appendChild(close);
	close.addEventListener("click", function(){
		document.body.removeChild(div);
	});
	div.appendChild(header);
	
	let para = document.createElement("p");
	para.style.backgroundColor = "grey";
	para.style.padding = "5px";
	para.style.maxWidth = "350px";
	para.style.borderRadius = "0px 0px 10px 10px";
	para.innerHTML = "If you have any questions, comments, concerns, or requests feel free to contact me on discord at '8 ฿ł₮ ₮Ɽł₱#6510'.";
	div.appendChild(para);
	
	dragElement(div,header);
	
	document.getElementsByClassName("strategy-stop")[0].addEventListener("click",function inner(){
		document.body.removeChild(div);
		document.getElementsByClassName("strategy-stop")[0].removeEventListener("click",inner);
	});
	
	document.body.appendChild(div);
}

/**
* this function is the help box that appears on screen from the menu
**/
function createHelpBox(){
	let div = document.createElement("div");
	div.style.minWidth = "120px";
	div.style.maxWidth = "550px"
	div.style.top = "0px";
	div.style.left = "0px";
	div.style.zIndex = 10001;
	div.style.color = "white";
	div.style.position = "absolute";
	div.style.borderRadius = "10px";
	div.style.fontFamily = "Verdana"
	div.style.fontSize = "x-small";
	div.style.textAlign = "center";
	
	let header = document.createElement("div");
	header.style.background = "black";
	header.style.padding = "5px";
	header.innerHTML = "Help";
	header.style.borderRadius = "10px 10px 0px 0px";
	header.style.cursor = "move";
	let close = document.createElement("p");
	close.innerHTML = "&#9746;";
	close.style.display = "inline";
	close.style.position = "absolute";
	close.style.right = "10px";
	close.style.cursor = "pointer";
	header.appendChild(close);
	close.addEventListener("click", function(){
		document.body.removeChild(div);
	});
	div.appendChild(header);
	
	let question = document.createElement("h1");
	question.style.fontSize = "small";
	question.style.backgroundColor = "grey";
	question.style.padding = "5px";
	question.innerHTML = "What does 'current' mean in the table?";
	div.appendChild(question);
	
	let para = document.createElement("p");
	para.style.backgroundColor = "grey";
	para.style.padding = "5px";
	para.innerHTML = "The 'current' value points to the current bet amount and listing previous crash points if it busted.";
	div.appendChild(para);
	
	let question1 = document.createElement("h1"); 
	question1.style.fontSize = "small";
	question1.style.backgroundColor = "grey";
	question1.style.padding = "5px";
	question1.innerHTML = "Why are some values blacked out?";
	div.appendChild(question1);
	
	let para1 = document.createElement("p");
	para1.style.backgroundColor = "grey";
	para1.style.padding = "5px";
	para1.innerHTML = "Those values are blacked out because they do not have odds between whatever you set realmOfSaftey at and thus the script will never bet at those multipliers.";
	div.appendChild(para1);
	
	let question2 = document.createElement("h1");
	question2.style.fontSize = "small";
	question2.style.backgroundColor = "grey";
	question2.style.padding = "5px";
	question2.innerHTML = "Why are some values red?";
	div.appendChild(question2);
	
	let para2 = document.createElement("p");
	para2.style.backgroundColor = "grey";
	para2.style.padding = "5px";
	para2.innerHTML = "Those values are redded out because you did not set wageredBits high enough to recover from the certain amount of busts at that multiplier, although as long as risingBetPercentage is not set to 0 when you make enough money they will stop being red and will be able to be played.";
	div.appendChild(para2);
	
	let question3 = document.createElement("h1");
	question3.style.fontSize = "small";
	question3.style.backgroundColor = "grey";
	question3.style.padding = "5px";
	question3.innerHTML = "What does 'Sigma' mean in the table?";
	div.appendChild(question3);
	
	let para3 = document.createElement("p");
	para3.style.backgroundColor = "grey";
	para3.style.padding = "5px";
	para3.innerHTML = "The 'Sigma' value indicates the sum of bits lost at each level, so the last value in sigma is the total amount of bits you will lose if a loss streak that long happens.";
	div.appendChild(para3);
	
	let question4 = document.createElement("h1");
	question4.style.fontSize = "small";
	question4.style.backgroundColor = "grey";
	question4.style.padding = "5px";
	question4.innerHTML = "What does 'Recent' mean in the table?";
	div.appendChild(question4);
	
	let para4 = document.createElement("p");
	para4.style.backgroundColor = "grey";
	para4.style.padding = "5px";
	para4.innerHTML = "The 'Recent' value is statistically how long until the next pattern below each multiplier at a given bust limit should happen, so at 1 that means that statistically it is should happen the next game, below 1 is the percent of when it should statistically happen again.";
	div.appendChild(para4);
	
	let last = document.createElement("p");
	last.style.backgroundColor = "grey";
	last.style.padding = "15px";
	last.style.borderRadius = "0px 0px 10px 10px";
	last.innerHTML = "If you have any other questions click on the contact section.";
	div.appendChild(last);
	
	dragElement(div,header);
	
	document.getElementsByClassName("strategy-stop")[0].addEventListener("click",function inner(){
		document.body.removeChild(div);
		document.getElementsByClassName("strategy-stop")[0].removeEventListener("click",inner);
	});
	
	document.body.appendChild(div);
}
},1000);
