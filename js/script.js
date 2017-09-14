var level = 0;
var strict = false;
var gameOngoing = false;
var userTurn = false; //false or a number ranging from 1 to level
var audio = {}; //Object responsible for audio
var pattern = []; //Will be a list of the current btn pattern
var timeout; //The id of the timeout function that is called in the recursive loop of nextComputerTurn function

$(document).ready(function() {

  //Begins by creating the sound
  makeAudio();

  /* events when btns are clicked */
  $("#strict").click(function() {
    strict = strict ? false : true; // changes strict according to what it currently is
    if (strict) {
      $("#strict-light").css({"background": "yellow"});
    }
    else {
      $("#strict-light").css({"background": "whitesmoke"});
    }
  });

  $("#start").click(startOrStopGame);

  var mouseWasDown = false; //Makes sure the user does not accidentaly trigger a mouseup or mouseleave event on a btn he or she has not even pressed
  $(".game-btn").on({
    "mousedown": function() {
      if(!userTurn) {
        //It is not the users turn
        return;
      }
      mouseWasDown = true;

      $(this).addClass("active");
      var id = $(this).attr("id");
      var idNum = id[id.length-1];
      audio.play(idNum);
    },
    "mouseup": function() {
      if (!mouseWasDown) {
        return;
      }
      nextUserTurn(this);
      mouseWasDown = false;
    },
    "mouseleave": function() {
      if (!mouseWasDown) {
        return;
      }
      nextUserTurn(this);
      mouseWasDown = false;
    }
  });
  /* ------- */
});

/* init functions that are only called once */
function makeAudio() {
  //Creates the audio object that is used to control all audio
  audio.ctx = new (window.AudioContext || window.webkitAudioContext)();

  var freqs = [];
  for (var i = 1; i <= 4; i++) {
    var randomFreq = Math.floor(Math.random()*100) + i*100 + 20;
    freqs.push(randomFreq);
  }
  audio.oscillators = freqs.map(function(frq) {
    var o = audio.ctx.createOscillator();
    o.frequency.value = frq;
    o.type = "sine";
    o.start(0);
    return o;
  });
  audio.gainNodes = audio.oscillators.map(function(o) {
    var gain = audio.ctx.createGain();
    gain.gain.value = 0; //The volume should be zero at the beginning
    o.connect(gain);
    gain.connect(audio.ctx.destination);
    return gain;
  });
  audio.play = function(id) {
    var volume = Math.pow(1.0045, -1 * audio.oscillators[id].frequency.value); //Found this to be a good formula
    audio.gainNodes[id].gain.linearRampToValueAtTime(volume, audio.ctx.currentTime + 0.1);
  };
  audio.stop = function(id) {
    audio.gainNodes[id].gain.linearRampToValueAtTime(0, audio.ctx.currentTime + 0.1);
  };
}
/* ------------- */

/* Functions that are purely there to change the document */
function changeLevel() {
  //Just changes the level-count according to what level it is
  if (level == 0) {
    $("#level-count").text("--");
  }
  else if (level < 10) {
    $("#level-count").text("0" + level);
  }
  else {
    $("#level-count").text("0" + level);
  }
}

function makeWrongScreen() {
  //Signals the user that he or she was wrong
  $("body").css({"background": "red"});
  setTimeout(function() {
    $("body").css({"background": "white"});
  }, 400);
}

function makeEndScreen() {
  $("body").css({"background": "green"});
  setTimeout(function() {
    $("body").css({"background": "white"});
  }, 2000);
}
/* ------------ */

/* Game functions */
function startOrStopGame() {
  //Pretty self explanatory
  if (gameOngoing) {
    //resets everything
    clearTimeout(timeout);
    gameOngoing = false;
    userTurn = false;
    pattern = [];
    level = 0;
    changeLevel();
    return;
  }

  gameOngoing = true;
  pattern = createPattern();
  level = 1;
  changeLevel();
  timeout = setTimeout(nextComputerTurn, 600, 0);
}

function createPattern() {
  /* Creates simons pattern and returns it as a list */
  var ptrn = [];
  for (var i = 0; i < 20; i++) {
    var num = Math.floor(Math.random()*4); // Random number between 0 and 3
    ptrn.push(num);
  }
  return ptrn;
}

function nextUserTurn(btn) {
  if(!userTurn) {
    //It is not the users turn
    return;
  }
  //First we stop the sound and makes the btn non-active
  $(btn).removeClass("active");

  var id = $(btn).attr("id");
  id = id[id.length-1];
  audio.stop(id);

  //Next we check if the user remembered correctly
  if (id != pattern[userTurn-1]) { //subtracts 1 since userTurn is 1 when it's the first guess
    //This means the user was wrong
    makeWrongScreen();
    if(strict) {
      startOrStopGame();
      startOrStopGame(); //The first call stops the game and the second starts a new one
    }
    else {
      setTimeout(nextComputerTurn, 500, 0); //Shows the user again
    }
  }
  else {
    //The user remembered correctly
    if (userTurn == 20) {
      //The user succeeded :O
      makeEndScreen();
      startOrStopGame();
      $("#level-count").text("corr!");
      return;
    }
    else if(userTurn == level) {
      level++;
      changeLevel();
      setTimeout(nextComputerTurn, 600, 0);
    }
    else {
      userTurn++;
    }
  }
}

function nextComputerTurn(count, onlyForRecursion) {
  /* A recursive function that calls itself until it has played the requiered number of levels.
  The parameter onlyForRecursion is used as a sort of sleep command for the function itself so that it waits between function presses */

  if (count == 0) {
    //First time the function is called
    userTurn = false; // The user should not be able to press btns while Simon is showing his pattern
  }
  else {
    //First removes the active class from the previous game-btn and removes its corresponding sound
    var prev = pattern[count-1];
    $(".game-btn").removeClass("active");
    audio.stop(prev);
  }

  if (onlyForRecursion) {
    //Sleeps for half a second before the next btn press
    timeout = setTimeout(nextComputerTurn, 500, count);
    return;
  }

  if (count == level) {
    //It is now the users turn
    userTurn = 1;
    return;
  }

  //Next simon presses a new btn
  var curr = pattern[count];
  $("#btn" + curr).addClass("active");
  audio.play(curr);

  count++;
  timeout = setTimeout(nextComputerTurn, 400, count, true);
}
/* ------------ */
