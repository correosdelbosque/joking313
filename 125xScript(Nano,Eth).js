/**
*For RaiGames, and Ethcrash
*1.25x Script
*
*Features of this script:
*-GUI for clarity in understanding when and what the script will bet
*-remote termination function, so if you start the script on one computer and want to disable it from a different computer you can do that by
*	typing !kill, (note must be in the same chat channel).
**/

//You can change these variables:
var wageredBits = 5000;//the total amount of bits to allow this script to bet with
var maxLosses = 5;//the number of losses you can take in a row, after "maxLosses" losses the program will terminate
var risingBetPercentage = .50;//percent of winnings to reinvest into betting for example if your risingBetPercentage is at .50 and 
//basebet comes out to 100 bits on 1.08 a win would give you 8 bits on win therefore 4 would be reinvested into raising your bets the other 4 would be safe and not used to bet
//if you dont want to reinvest any set it to 0 if you want to reinvest all set it to 1

//You can change these variables but it is recommended to leave them as is unless you know what you are doing
var baseCashout = 1.08;//this is the cashout that will be returned to on a win, the cashout will be variable after a loss (suggested range is 1.04x - 1.08x)
var maxBet = 100000;//RaiGames allows bets no larger than 100000 as of 1/10/18 and they have not updated API this value should be 1,000,000 on bustabit and ethcrash

//Do not change these variables:
var initialWagered = wageredBits;// has to be kept track of so that when increasing wageredBits it will increase it correctly
var currentBet;//used in determining what the current bet amount is
var currentCashout = baseCashout;//used in determining what the current cashout is
//var stopScriptOnLoss = true;//will stop the script in the event of "maxLosses" losses in a row
var lossStreak = 0;//number of losses in a row
var userBalance = engine.getBalance()/100;//the users balance
var divTable = [];//holds elements to pass to the UI to update table results
var totalWon = 0;//total profit from the script thus far
var prevLoss = false;//used to determine if the last game was won or lost to figure out if wageredBits should increase

for(let i = 0;i<maxLosses+1;i++)
		divTable[i] = [];

//used to determine if all user set variables were set to values that make sense
function idiotTest(){
	if(userBalance<wageredBits){
		throwError("wageredBits is higher than your balance");
		engine.stop();
	}
	if(maxLosses<3 || maxLosses>9){
		throwError("Use a number between 3 and 9 for maxLosses inclusive.");
		engine.stop();
	}
	if(risingBetPercentage>1 || risingBetPercentage<0){
		throwError("risingBetPercentage must be between 0 and 1 inclusive.");
		engine.stop();
	}
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
	if(Math.floor(base)<1){
		throwError("Need a min of " + 1*Math.pow(5,limit-1) + " bits to run with your parameters, and you only set wageredBits to " + wageredBits + ".");
		engine.stop();
	}
	return Math.floor(base);
}
currentBet = calcBase(wageredBits,maxLosses);

function calcUnflooredBase(wagered,limit){
	var base = wagered;
	var multiplier = 0.25;
	if(base>maxBet*1.25)
		base = maxBet*1.25;
	for(let i=0;i<limit-1;i++){
		base = (base*multiplier)/(multiplier+1);
	}
	if(Math.floor(base)<1){
		throwError("Need a min of " + 1*Math.pow(5,limit-1) + " bits to run with your parameters, and you only set wageredBits to " + wageredBits + ".");
		engine.stop();
	}
	return base;
}

function createDivTable(){
	var precise = calcBase(wageredBits,maxLosses);
	var sum = precise;
	var unprecise = calcUnflooredBase(wageredBits,maxLosses);
	divTable[0][0] = "Current";
	divTable[0][1] = "TB";
	divTable[0][2] = "AB";
	divTable[0][3] = "Sigma";
	divTable[1][0] = "&#8611;";
	for(let i = 1;i<maxLosses;i++)
		divTable[i+1][0] = " ";
	for(let i = 1;i<maxLosses+1;i++){
		divTable[i][1] = parseFloat(unprecise.toFixed(4));
		if(i==1)
			unprecise*=4;
		else
			unprecise*=5;
	}
	for(let i = 1;i<maxLosses+1;i++){
		divTable[i][2] = precise;
		if(i==1)
			precise*=4;
		else
			precise*=5;
	}
	for(let i = 1;i<maxLosses+1;i++){
		divTable[i][3] = sum;
		sum+=sum*4;
	}
}
createDivTable();

engine.on('game_starting', function(info) {
	console.log("Current balance: " + engine.getBalance() + " will bet " + currentBet + " at " + currentCashout);
	engine.placeBet(currentBet*100, Math.round(currentCashout*100));
});

engine.on('game_crash', function(data) {
	if(engine.lastGamePlay()=='NOT_PLAYED')
		return;
	if(engine.lastGamePlay()=='LOST'){
		currentCashout = 1.25;
		if(lossStreak==0)
			currentBet *= 4;
		else
			currentBet *= 5;
		lossStreak++;
		console.log("LOST: new bet is " + currentBet + " new cashout is " + currentCashout);
		divTable[lossStreak][0] = data.game_crash/100;
		if(lossStreak<maxLosses){
			divTable[lossStreak+1][0] = "&#8611;";
		}
		prevLoss = true;
		updateTable(divTable);
	}
	else{
		currentBet = calcBase(Math.floor(wageredBits),maxLosses);
		currentCashout = baseCashout;
		lossStreak = 0;
		if(risingBetPercentage!=0 && !prevLoss){
			wageredBits = initialWagered;
			totalWon += parseFloat((currentBet*currentCashout-currentBet).toFixed(2));
			console.log("Total won " + totalWon);
			wageredBits += totalWon*risingBetPercentage;
			console.log("Wagered Bits " + wageredBits);
			currentBet = calcBase(Math.floor(wageredBits),maxLosses);
		}
		prevLoss = false;
		console.log("WON: "+ "new bet is " + currentBet + " new cashout is " + currentCashout);
		createDivTable();
		updateTable(divTable);
	}
	if(lossStreak==maxLosses){
		console.log("Max Losses reached")
		engine.stop();
	}
});

engine.on('msg', function(data) {
    if(data.username==engine.getUsername() && data.message=="!kill"){
		engine.chat("Script remotely terminated.");
		engine.stop();
	}
});

var tableData = [];

function updateTable(matrix){
	for(let i=0;i<matrix.length;i++)
		for(let k=0;k<matrix[i].length;k++){
			tableData[i][k].innerHTML = matrix[i][k];
		}
	for(i=1;i<matrix.length;i++){
		if(tableData[i][0].innerHTML=="↣"){
			tableData[i][0].style.color = "DarkGreen";
			tableData[i][0].style.fontSize = "large";
		}
		else if(tableData[i][0].innerHTML!=" "){
			tableData[i][0].style.color = "DarkRed";
			tableData[i][0].style.fontSize = "x-small";
		}
	}
}

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

function createTable(matrix){
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
	
	let table = document.createElement("TABLE");
	   
	for(i=0;i<matrix.length;i++){
		tableData[i] = [];
		let row = document.createElement("TR");
		if(i%2!=0)
			row.style.backgroundColor = "LightSlateGray";
		else
			row.style.backgroundColor = "gray";
		table.appendChild(row);
		for(let k = 0;k<matrix[i].length;k++){
			let elem = document.createElement("TD");
			elem.style.borderLeft = "2px solid white";
			elem.style.borderRight = "2px solid white";
			elem.innerHTML = matrix[i][k];
			elem.style.textAlign = "center";
			elem.style.padding = "5px";
			tableData[i][k] = elem;
			row.appendChild(elem);
		}
	}
	for(i=1;i<matrix.length;i++){
		if(tableData[i][0].innerHTML=="↣"){
			tableData[i][0].style.color = "DarkGreen";
			tableData[i][0].style.fontSize = "large";
		}
		else if(tableData[i][0].innerHTML!=" "){
			tableData[i][0].style.color = "DarkRed";
			tableData[i][0].style.fontSize = "x-small";
		}
	}
	table.style.border = "3px solid white";
	div.appendChild(table);
	
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
createTable(divTable);

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
	question1.innerHTML = "What does the 'TB' value mean?";
	div.appendChild(question1);
	
	let para1 = document.createElement("p");
	para1.style.backgroundColor = "grey";
	para1.style.padding = "5px";
	para1.innerHTML = "The 'TB' value stands for Theoretical Bet, which is the bet that would be placed if betting with decimals is allowed, summed up this value should equal wageredBits but may be slightly different due to rounding.";
	div.appendChild(para1);
	
	let question2 = document.createElement("h1");
	question2.style.fontSize = "small";
	question2.style.backgroundColor = "grey";
	question2.style.padding = "5px";
	question2.innerHTML = "What does the 'AB' value mean?";
	div.appendChild(question2);
	
	let para2 = document.createElement("p");
	para2.style.backgroundColor = "grey";
	para2.style.padding = "5px";
	para2.innerHTML = "The 'AB' value stands for the Actual Bet that will be placed during the round that 'current' indicates.";
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
