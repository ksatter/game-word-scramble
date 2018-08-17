/*---LOAD STATE---*/
//Parse url
let params = getParams();

function getParams() {
  let url = window.location.href.split("?")[0];
  let paramArray = window.location.href.split("&").splice(1);
  let paramObject = {
    url,
  };
  paramArray.forEach(param => {
    param = param.split("=");
    paramObject[param[0]] = param[1].split("+").join(" ");
  })
  return paramObject
}

let usedLetters = [];
let letterInput = "";
let letters = [];
let waiting = false
game.getLetters(function () {
  createButtons();

})

watchChat();
waitForStart();

/*---MODAL---*/

//open with join content
function joinGameModal() {
  $("#enter-game-modal-text").text(`${params.createdBy} has invited you to play! You can join their game or create your own and invite friends to play.`)
  $("#new-game").hide();
  $("#enter-game-modal").show();
}
//open with new game logic
function createGameModal() {
  $("#enter-game-modal-text").text(`Enter your name and click create to start a game. You'll get a link to send your friends so they can join!`);
  $("#join-game").hide();
  $("#new-game").hide();
  $("#create-game").show();
  $("#enter-game-modal").show();
}
//open with waiting logic
function waitingGameModal() {
  $("#enter-game-modal-text").text(`Waiting for ${params.createdBy} to start the game. You can continue waiting or start a new game.`)
  $("#new-game").hide();
  $("#join-game").hide();
  $("#enter-game-modal").show();
}
// close with "x"
$(".close").click(function () {
  $(this).closest(".modal").hide();
})
//close when clicking outside
$(".modal").on("click", function (event) {
  event.preventDefault();
  if(!$(event.target).closest(".modal-content").length)  {
    $(this).hide();
  }
});

/*----CAME CREATION AND JOIN---*/

//open modal based on current state
if (params.gameId) joinGameModal();

$(".play-now").click(function () {
  event.preventDefault();
  if(params.gameId && game.playerId) waitingGameModal()
  else if (game.playerId) {
    $("#copy-text").empty();
    $("#enter-game-modal").show()
  }
  else if (params.gameId) joinGameModal();
  else createGameModal()
})

$("#new-game").click(function () {
  event.preventDefault();
  createGameModal();
})
//create game button creates game and generates url for joining
$("#create-game").click(function () {
  event.preventDefault();
  $(".chat-text").empty();
  $("#modal-warn").hide();
  //if a previous game was started, change listener for chat to new ref
  if(game.gameId){
    Db.ref(`${game.gameId}/messages`).off("child_added")
    game.gameId = "";
    return false
  }
  //clear previously set data if present
  params.gameId = "";
  params.createdBy = "";
  //get player name
  let playerName = $("#name-input").val().trim();
  if (!playerName){
    $("#modal-warn").show();
    $("#modal-warn").text("Please enter your name");
    return false
  }
  //Create game
  game.createGame(playerName, function(id) {
    //generate link and new elemaents to hold it
    playerName = playerName.split(" ").join("+");
    $div = $("<div>");
    $url = $("<p>")
      .text(`${params.url}?&gameId=${id}&createdBy=${playerName}`)
      .addClass("link-text");
    $btn = $("<button>")
      .addClass("game-buttons")
      .attr("id", "copy-button")
      .text("Copy Url");
    $cp = $("<div>")
      .attr("id", "copy-text");
    $div.append($url, $btn, $cp);
    //Update modal state
    $("#enter-game-modal-text").text(`Share this url to invite friends to join your game: `)
    $("#enter-game-modal-text").append($div);
    $("#join-game").hide();
    $("#name-input").hide();
    $("#create-game").hide();
    $(".start-game").show();
  });
});
//allow user to copy url
$(document).on("mouseup", "#copy-button", function(e) {
  event.preventDefault();
  //sets up dummy element to hold value
  var $temp = $("<input>");
  $("body").append($temp);
  //pushes text to dummy and copies to clipboard
  $temp.val($(".link-text").text()).select();
  document.execCommand("copy");
  //removes dummy
  $temp.remove();
  $("#copy-text").text("Copied!")
});

$(document).on("mousedown", "#copy-button", function(e) {
  $("#copy-text").empty();
});
//join game adds player to game based on params
$("#join-game").click(function () {
  event.preventDefault();
  $("#modal-warn").hide();

  //retrieve name
  let playerName = $("#name-input").val().trim();
  if (!playerName){
    $("#modal-warn").show()
    $("#modal-warn").text("Please enter your name")
    return false
  }
  //join existing game
  joinGame(playerName)
});

function joinGame(name) {
  $("#modal-warn").show();
  let newPlayer = name;
  $("#modal-warn").text(`Attempting to join game`);
  game.checkStatus(params.gameId, function (res) {
    if (res) {
      $("#modal-warn").text(`Waiting for current game to end`);
      setTimeout(joinGame, 3000)
    } else {
      game.joinGame(newPlayer, params.gameId, function(res) {
        waitForStart();
        watchChat()
        $("#enter-game-modal").hide();
      });
    }
  })
}
/*----START GAME---*/

let time, timer;
//listens for game state to change
function waitForStart() {
  //determine if user game creator
  if(params.createdBy){
    $(".timer").text(`Waiting for ${params.createdBy} to start the game`);
  }
  //keep listening for game to start
  if(!game.gameData.roundStarted){
    setTimeout(waitForStart, 500)
  //once game started, create new buttons and start timer
} else if(game.gameData.roundStarted){
    //if user is creator, update STATE
    if(!params.createdBy) game.addMessage("Game update", "Started")
    createButtons();
    time = 60;
    timer = setInterval(countdown, 1000)
  }
}
//update game state when buton pressed (only visible ig current user created game)
$(".start-game").click(function () {
  game.changeState();
  $(".start-game").hide();
  $("#enter-game-modal").hide();
})
//Create letter buttons
function createButtons() {
  //clear previous data
  letters = game.gameData.letters;
  usedLetters = [];
  letterInput = "";
  $(".letters").empty();
  //generate letter buttons and attatch
  letters.forEach((letter, index)=> {
    let btn = $("<button>")
        .addClass("letter")
        .attr("data-index", index)
        .attr("id", "letter-" + index)
        .text(letter);
    $(".letters").append(btn)
    //setup placeholders for used letters
    usedLetters.push("");
  });
}
//timer functionality
function countdown() {
  //count down
  time --
  $(".timer").text(`You have ${time} seconds remaining`)
  //end game
  if(time === 0){
    $(".timer").text(`Time's Up!`);
    clearInterval(timer)

    //if creator, set up new game
    if(!params.createdBy){
      game.endGame(function () {
        $(".start-game").show();
        waitForStart();
      })
    //if not reator, ,wait for new game
    } else  waitForStart();

  }
}

/*----GAME PLAY----*/

//Click function for rearranging letter buttons
$("#shuffle").click(() => {
  $(".letters").children().sort(() => Math.random() - 0.5)
                .detach().appendTo(".letters")
})
//click event for selecting letter
$(document).on("click", ".letter", function () {
  //get index and update arrays and input string
  let index = $(this).data("index")
  usedLetters[index] = $(this).text();
  letters[index] = "";
  letterInput+= $(this).text();
  //update DOM
  $(this).hide();
  $("#word-input").val(letterInput)
});

//click event for clear word button
$("#clear-word").click(function () {
  event.preventDefault();
  clearWord();
})
//click event for clear  letter button
$("#clear-letter").click(function () {
  event.preventDefault();
  clearLetter();
})
//click event for submit word button
$("#new-word").click(function () {
  event.preventDefault();
  submitWord();
})
//keyboard events
$("#word-input").keydown(function (event) {
  event.preventDefault();
  $("#word-warn").hide()
  //delete
  if(event.which === 46) {
    clearWord();
    return
  //backspace
  } else if(event.which === 8){
    clearLetter();
    return
  //enter
  } else if(event.which === 13){
    submitWord();
    return
  //anything else
  } else {
    event.preventDefault();
    //get input and see if a valid letter, add letter if it is
    let newLetter = String.fromCharCode(event.which).toUpperCase();
    let letterIndex = letters.indexOf(newLetter);
    if (letterIndex === -1) {
      return false
    } else {
      $("#letter-" + letterIndex).click();
    }
  }
})
//clear entire word
function clearWord() {
  //move used letters back in to letters array
  usedLetters.forEach((letter, index) => {
    if(letter){
      letters[index] = letter;
      usedLetters[index] = "";
    }
  });
  //update input and DOM
  letterInput = "";
  $(".letter").show();
  $("#word-input").val(letterInput);
}
//remove last letter
function clearLetter() {
  //get deleted letter information
  let deletedLetter = letterInput.slice(-1);
  let index = usedLetters.indexOf(deletedLetter);
  //update arrays
  letterInput = letterInput.slice(0, -1);
  letters[index] = deletedLetter;
  usedLetters[index] = "";
  //update DOM
  $("#letter-"+index).show();
  $("#word-input").val(letterInput);
}
//submit word
function submitWord() {
  //don't allow if game is not currently started
  $("#word-warn").hide()
  if(!game.gameData.roundStarted || waiting) {
    $("#word-warn").show();
    $("#word-warn").text("Waiting for game");
    return false
  }
  //get and validate word (needs dictionary ref)
  let word = $("#word-input").val()
  if (!word || word.length < 3) {
    $("#word-warn").show()
    $("#word-warn").text("Please enter a word")
    return false
  }
  //validates word not already played and updates game state
  game.playWord(word, function (res) {
    //word already played
    if (!res) {
      $("#word-warn").show();
      $("#word-warn").text(`${word} has already been played`);
      clearWord();
    //word added successfully
    } else clearWord();
  });
}

/*----CHAT----*/

$("#new-comment").click(function () {
  event.preventDefault();
  let message = $("#chat-input").val().trim();
  if (!message || !game.gameId) return false;
  game.addMessage(game.playerName, message);
  $("#chat-input").val("");
})



function watchChat() {
  if (!game.gameId){
    setTimeout(watchChat, 500);
  } else {
    Db.ref(`${game.gameId}/messages`).on("child_added", function (snapshot) {
      comment = snapshot.val();
      $comment = $("<li>")
        .addClass("comment");
      $name = $("<span>")
        .addClass("comment-player")
        .text(comment.player);
      $message = $("<span>")
        .addClass("comment-message")
        .text(comment.message);
      $comment.append($name, " : ", $message);
      $(".chat-text").append($comment)
    })
  }
}
