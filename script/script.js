/*--- const ---*/
var guardianMessages = ["r","ready","i'm ready","ready!!"];
var failCodes = [
    "The Imminent End timer ended. The fireteam wiped.",
    "Dissection incorrect."
];

/*--- var ---*/

var inCallouts = []; //0 = T, 1 = C, 2 = S
var statuesShapes = []; //0 = pyr, 1 = sph, 2 = cub, 3 = pri, 4 = con, 5 = cyl
var playerBuffs = []; //player symbol buffs

//room
var leftKnightAlive;
var midKnightAlive;
var rightKnightAlive;
var leftSymbolOn;
var midSymbolOn;
var rightSymbolOn;
var ogre1;
var ogre2;

var lastDissectedStatue;
var lastDissectedSymbol;

//cpu
var chatIndex;

var timer; //imminent end
var gameOn; //game not paused

/*---- func ----*/

//random integers
function getRandomIntmax(max) {
    return Math.floor(Math.random()*max);
}
function getRandomIntminmax(min,max) {
    return Math.floor(Math.random() * (max - min) + min);
}

function initKnights() {
    leftKnightAlive = true;
    midKnightAlive = true;
    rightKnightAlive = true;
}

//check if ogre needs to spawn
function checkOgre() {
    if(!leftKnightAlive
        && !midKnightAlive
        && !rightKnightAlive
        && !leftSymbolOn
        && !midSymbolOn
        && !rightSymbolOn
    ) {
        ogre1 = true;
        ogre2 = true;
    }
}

//on knight click
function interactKnight(knight) {
    if(knight == 0) {
        leftKnightAlive = false;
        leftSymbolOn = true;
    }
    else if(knight == 1) {
        midKnightAlive = false;
        midSymbolOn = true;
    }
    else {
        rightKnightAlive = false;
        rightSymbolOn = true;
    }
    updateUI();
}

//on ogre click
function interactOgre(ogre) {
    if(ogre == 0)
        ogre1 = false;
    else
        ogre2 = false;
    if(!ogre1 && !ogre2)
        initKnights();
    updateUI();
}

//on symbol click
function interactSymbol(symbol) {
    if(playerBuffs.length < 2) {
        if(symbol == 0) {
            playerBuffs.push(1);
            leftSymbolOn = false;
        }
        else if(symbol == 1) {
            playerBuffs.push(0);
            midSymbolOn = false;
        }
        else {
            playerBuffs.push(2);
            rightSymbolOn = false;
        }
    }
    checkOgre();
    updateUI();
}

function getShapeFromCombination(symbol1,symbol2) {
    if(symbol1 == 0) {
        switch(symbol2) {
            case 0: return 0;
            case 1: return 4;
            case 2: return 3;
        }
    }
    else if(symbol1 == 1) {
        switch(symbol2) {
            case 0: return 4;
            case 1: return 1;
            case 2: return 5;
        }
    }
    else {
        switch(symbol2) {
            case 0: return 3;
            case 1: return 5;
            case 2: return 2;
        }
    }
}

function getOtherSymbol(shape, symbol) {
    switch(shape) {
        case 0: return 0;
        case 1: return 1;
        case 2: return 2;
        case 3: 
            if(symbol == 0) return 2;
            else return 0;
        case 4:
            if(symbol == 0) return 1;
            else return 0;
        case 5:
            if(symbol == 1) return 2;
            else return 1;
    }
}

function litStatue(statue) {
    switch(statue) {
        case 0: 
            $("#statue-container-1").css("filter", "drop-shadow(0px 0px 10px orange)");
            break;
        case 1: 
            $("#statue-container-2").css("filter", "drop-shadow(0px 0px 10px orange)");
            break;
        case 2: 
            $("#statue-container-3").css("filter", "drop-shadow(0px 0px 10px orange)");
            break;
        default: break;
    }
}

function unlitStatue(statue) {
    switch(statue) {
        case 0: 
            $("#statue-container-1").css("filter", "none");
            break;
        case 1: 
            $("#statue-container-2").css("filter", "none");
            break;
        case 2: 
            $("#statue-container-3").css("filter", "none");
            break;
        default: break;
    }
}

function dissectStatue(statue, symbol) {
    if(lastDissectedStatue == -1) {
        lastDissectedStatue = statue;
        lastDissectedSymbol = symbol;
        litStatue(statue);
    }
    else {
        statuesShapes[lastDissectedStatue] = getShapeFromCombination(getOtherSymbol(statuesShapes[lastDissectedStatue],lastDissectedSymbol), symbol);
        statuesShapes[statue] = getShapeFromCombination(getOtherSymbol(statuesShapes[statue],symbol), lastDissectedSymbol);
        unlitStatue(lastDissectedStatue);
        lastDissectedStatue = -1;
        lastDissectedSymbol = -1;
    }
    playerBuffs.pop();
}

//on statue click
function interactStatue(statue) {
    if(playerBuffs.length > 0 && statue != lastDissectedStatue) {
        if(playerBuffs.length > 1) {
            while(playerBuffs.length) playerBuffs.pop();
        }
        else {
            if(playerBuffs[0] == 0 && (statuesShapes[statue] == 0 || statuesShapes[statue] == 3 || statuesShapes[statue] == 4))
                dissectStatue(statue, 0);
            else if(playerBuffs[0] == 1 && (statuesShapes[statue] == 1 || statuesShapes[statue] == 4 || statuesShapes[statue] == 5))
                dissectStatue(statue, 1);
            else if(playerBuffs[0] == 2 && (statuesShapes[statue] == 2 || statuesShapes[statue] == 3 || statuesShapes[statue] == 5))
                dissectStatue(statue, 2);
        }
    }
    checkOgre();
    updateUI();
}

function getCalloutLetter(n) {
    switch(n) {
        case 0: return "T";
        case 1: return "C";
        case 2: return "S";
        default: return "";
    }
}

//init the game
function setGame() {
    //init buff
    while(playerBuffs.length) playerBuffs.pop();

    //init in callout
    inCallouts[0] = getRandomIntmax(3);
    do { inCallouts[1] = getRandomIntmax(3);}
    while(inCallouts[1] == inCallouts[0]);
    do { inCallouts[2] = getRandomIntmax(3);}
    while(inCallouts[2] == inCallouts[0] || inCallouts[2] == inCallouts[1]);

    $("#tc-chat-n-1").text("Guardian" + getRandomIntminmax(1000,9999) + ":");
    $("#tc-chat-m-1").text(
        getCalloutLetter(inCallouts[0])
        + getCalloutLetter(inCallouts[1])
        + getCalloutLetter(inCallouts[2])
    );

    //randomly fill walls
    let symbolBuffer = [0, 1, 2];
    let randomIndex = getRandomIntmax(3);
    statuesShapes[0] = getShapeFromCombination(inCallouts[0],symbolBuffer[randomIndex]);
    symbolBuffer.splice(randomIndex, 1);
    randomIndex = getRandomIntmax(2);
    statuesShapes[1] = getShapeFromCombination(inCallouts[1],symbolBuffer[randomIndex]);
    symbolBuffer.splice(randomIndex, 1);
    statuesShapes[2] = getShapeFromCombination(inCallouts[2],symbolBuffer[0]);

    initKnights();
    leftSymbolOn = false;
    midSymbolOn = false;
    rightSymbolOn = false;
    ogre1 = false;
    ogre2 = false;

    //init dissection
    lastDissectedStatue = -1;
    lastDissectedSymbol = -1;
    $("#statue-container-1").css("filter", "none");
    $("#statue-container-2").css("filter", "none");
    $("#statue-container-3").css("filter", "none");

    timer = 210;

    $("#message-failure").removeClass("unfold");
    $("#message-success").removeClass("unfold");
    $("#message-failure").css("transform","scale(0)");
    $("#message-success").css("transform","scale(0)");

    gameOn = true;
}

/*---- UI ----*/
function getStatueShape(shape) {
    switch(shape) {
        case 0: return "./resources/images/image_shape_0.png";
        case 1: return "./resources/images/image_shape_1.png";
        case 2: return "./resources/images/image_shape_2.png";
        case 3: return "./resources/images/image_shape_3.png";
        case 4: return "./resources/images/image_shape_4.png";
        case 5: return "./resources/images/image_shape_5.png";
        default: return "";
    }
}

//seconds to m:s format
function timerToText() {
    let minutes = ~~(timer / 60);
    let extraSeconds = timer % 60;
    if(extraSeconds < 10) return minutes + ":0" + extraSeconds;
    else return minutes + ":" + extraSeconds;
}

//set player buff name and icon
function setBuffs() {
    if(playerBuffs.length == 0) {
        $("#buff-shape-icon").attr("src", "./resources/images/icon_empty.svg");
        $("#buff-shape-name").text("---");
    }
    else if(playerBuffs.length == 1) {
        switch(playerBuffs[0]) {
            case 0:
                $("#buff-shape-icon").attr("src", "./resources/images/icon_trigon.svg");
                $("#buff-shape-name").text("Trigon");
                break;
            case 1:
                $("#buff-shape-icon").attr("src", "./resources/images/icon_orbicular.svg");
                $("#buff-shape-name").text("Orbicular");
                break;
            case 2:
                $("#buff-shape-icon").attr("src", "./resources/images/icon_quadrate.svg");
                $("#buff-shape-name").text("Quadrate");
                break;
        }
    }
    else {
        if(playerBuffs[0] == 0 && playerBuffs[1] == 0) {
            $("#buff-shape-icon").attr("src", "./resources/images/icon_pyramidal.svg");
            $("#buff-shape-name").text("Pyramidal");
        }
        else if(playerBuffs[0] == 0 && playerBuffs[1] == 1 || playerBuffs[0] == 1 && playerBuffs[1] == 0) {
            $("#buff-shape-icon").attr("src", "./resources/images/icon_conoid.svg");
            $("#buff-shape-name").text("Conoid");
        }
        else if(playerBuffs[0] == 0 && playerBuffs[1] == 2 || playerBuffs[0] == 2 && playerBuffs[1] == 0) {
            $("#buff-shape-icon").attr("src", "./resources/images/icon_trilateral.svg");
            $("#buff-shape-name").text("Trilateral");
        }
        else if(playerBuffs[0] == 1 && playerBuffs[1] == 1) {
            $("#buff-shape-icon").attr("src", "./resources/images/icon_spherical.svg");
            $("#buff-shape-name").text("Spherical");
        }
        else if(playerBuffs[0] == 1 && playerBuffs[1] == 2 || playerBuffs[0] == 2 && playerBuffs[1] == 1) {
            $("#buff-shape-icon").attr("src", "./resources/images/icon_cylindric.svg");
            $("#buff-shape-name").text("Cylindric");
        }
        else if(playerBuffs[0] == 2 && playerBuffs[1] == 2) {
            $("#buff-shape-icon").attr("src", "./resources/images/icon_cubic.svg");
            $("#buff-shape-name").text("Cubic");
        }
    }
}

//update view
function updateUI() {
    $("#statue-shape-1").attr("src",getStatueShape(statuesShapes[0]));
    $("#statue-shape-2").attr("src",getStatueShape(statuesShapes[1]));
    $("#statue-shape-3").attr("src",getStatueShape(statuesShapes[2]));

    if(leftKnightAlive) $("#knight-left").css("display","block");
    else $("#knight-left").css("display","none");
    if(leftSymbolOn) {
        $("#symbol-left").css("display","block");
        $("#symbol-left").attr("src", "./resources/images/image_symbol_circle.png");
    }
    else $("#symbol-left").css("display","none");

    if(midKnightAlive) $("#knight-mid").css("display","block");
    else $("#knight-mid").css("display","none");
    if(midSymbolOn) {
        $("#symbol-mid").css("display","block");
        $("#symbol-mid").attr("src", "./resources/images/image_symbol_triangle.png");
    }
    else $("#symbol-mid").css("display","none");

    if(rightKnightAlive) $("#knight-right").css("display","block");
    else $("#knight-right").css("display","none");
    if(rightSymbolOn) {
        $("#symbol-right").css("display","block");
        $("#symbol-right").attr("src", "./resources/images/image_symbol_square.png");
    }
    else $("#symbol-right").css("display","none");

    if(ogre1) $("#ogre-1").css("display","block");
    else $("#ogre-1").css("display","none");
    if(ogre2) $("#ogre-2").css("display","block");
    else $("#ogre-2").css("display","none");

    setBuffs();
}

//set fail code text and show fail dialog
function showFail(code) {
    gameOn = false;
    $("#failure-reason").text(failCodes[code]);
    $("#message-failure").addClass("unfold");
}

//show success dialog
function showSuccess() {
    gameOn = false;
    $("#message-success").addClass("unfold");
}

/*---- intervals ----*/
var timerInterval = setInterval(function() {
    if(gameOn) {
        timer -= 1;
        $("#imminent-end-time").text(timerToText());
        if(timer == 0) showFail(0)
    }
}, 1000);

/*---- START ----*/
function startGame() {
    setGame();
    $("#imminent-end-time").text(timerToText());
    updateUI();

    $("#knight-left").click(function(){ interactKnight(0); });
    $("#knight-mid").click(function(){ interactKnight(1); });
    $("#knight-right").click(function(){ interactKnight(2); });
    $("#symbol-left").click(function(){ interactSymbol(0); });
    $("#symbol-mid").click(function(){ interactSymbol(1); });
    $("#symbol-right").click(function(){ interactSymbol(2); });
    $("#ogre-1").click(function(){ interactOgre(0); });
    $("#ogre-2").click(function(){ interactOgre(1); });
    $("#statue-container-1").click(function(){ interactStatue(0); });
    $("#statue-container-2").click(function(){ interactStatue(1); });
    $("#statue-container-3").click(function(){ interactStatue(2); });
    $("#tc-input").click(function(){ dissectionDone(); });
    $("#try-again-fail").click(function(){ tryAgain(); });
    $("#try-again-success").click(function(){ tryAgain(); });
}

function statueCorrect(statue) {
    if(inCallouts[statue] == 0 && statuesShapes[statue] == 5) return true;
    else if(inCallouts[statue] == 1 && statuesShapes[statue] == 3) return true;
    else if(inCallouts[statue] == 2 && statuesShapes[statue] == 4) return true;
    else return false;
}

//on get out button click
function dissectionDone() {
    if(statueCorrect(0) && statueCorrect(1) && statueCorrect(2)) showSuccess();
    else showFail(1)
}

//restart the game
function tryAgain() {
    setGame();
    $("#imminent-end-time").text(timerToText());
    updateUI();
}

startGame();
