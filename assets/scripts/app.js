

/*---PARSE URL---*/

let params = getParams();

function getParams() {
  let url = window.location.href.split("?")[0];
  let paramArray = window.location.href.split("&").splice(1);
  let paramObject = {
    url,
  };
  paramArray.forEach(param => {
    param = param.split("=");
    paramObject[param[0]] = param[1];
  })
  return paramObject
}

if (params.gameId) joinGameModal();

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
//play-now button
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
//new Game
$("#new-game").click(function () {
  event.preventDefault();
  createGameModal();
})
//create game button creates game and generates url for joining
$("#create-game").click(function () {
  event.preventDefault();
  $(".chat-text").empty();
  let playerName = $("#name-input").val().trim();
  if (!playerName){
    $("#name-input").after("Please Enter your name");
    return false
  }
  //Create Game
  game.createGame(playerName, function(id) {
    //generates url and updates modal text
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
    $("#enter-game-modal-text").text(`Share this url to invite friends to join your game: `)
    $("#enter-game-modal-text").append($div);
    $("#join-game").hide();
    $("#name-input").hide();
    $("#create-game").hide();
    $(".start-game").show();
  });
});
//join game
$("#join-game").click(function () {
  event.preventDefault();
  let playerName = $("#name-input").val().trim();
  if (!playerName){
    $("#name-input").after("Please Enter your name");
    return false
  }
  game.joinGame(params.gameId, playerName, function() {
    createButtons();
    $("#enter-game-modal").hide();
  });
});
$(document).on("mouseup", "#copy-button", function(e) {
  event.preventDefault();
  var $temp = $("<input>");
  $("body").append($temp);
  $temp.val($(".link-text").text()).select();
  document.execCommand("copy");
  $temp.remove();
  $("#copy-text").text("Copied!")
});
$(document).on("mousedown", "#copy-button", function(e) {
  $("#copy-text").empty();
});
$(".start-game").click(function () {
  game.startGame();
})
let usedLetters = [];
let letterInput = "";
let letters = [];
//Create letter buttons
function createButtons() {
  letters = game.gameData.letters;
  letters.forEach((letter, index)=> {
    let btn = $("<button>")
        .addClass("letter")
        .attr("data-index", index)
        .attr("id", "letter-" + index)
        .text(letter);
    $(".letters").append(btn)
    usedLetters.push("");
  });
}


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
//keyboard events
$("#word-input").keydown(function (event) {
  if(event.which === 46) {
    clearWord();
    return false
  } else if(event.which === 8){
    clearLetter();
    return false
  }
  else {
    event.preventDefault();
    let newLetter = String.fromCharCode(event.which).toUpperCase();
    let letterIndex = letters.indexOf(newLetter);
    if (letterIndex === -1) {
      return false
    }else {
      $("#letter-" + letterIndex).click();
      return false
    }
  }
})
$("#new-word").click(function () {
  event.preventDefault();
  let word = $("#word-input").val()
  if (!word) {
    $("#word-input").after("Please enter a word");
    return false
  }
  game.playWord(word);
  clearWord();
})
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
function clearLetter() {
  //get deleted letter information
  let deletedLetter = letterInput.slice(-1);
  let index = usedLetters.indexOf(deletedLetter);
  //update arrays and input
  letterInput = letterInput.slice(0, -1);
  letters[index] = deletedLetter;
  usedLetters[index] = "";
  //update DOM
  $("#letter-"+index).show();
  $("#word-input").val(letterInput);
}
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
function waitForStart() {
  if(!game.gameData.started){
    setTimeout(waitForStart, 500)
  } else {
    createButtons();
    let time = 60;
    let timer = setInterval(countdown, 1000)
    function countdown() {
      $(".timer").text(`You have ${time} seconds remaining`)
      time --
      if(time === 0){
        clearInterval(timer)
        console.log("timer ended");
      }
    }
  }
}
