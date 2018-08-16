

/*---PARSE URL---*/

let params = getParams();
console.log(params);
function getParams() {
  let url = window.location.href.split("?")[0];
  let paramArray = window.location.href.split("&").splice(1);
  let paramObject = {
    url,
  };
  paramArray.forEach(param => {
    param = param.split("=");
    console.log(param);
    paramObject[param[0]] = param[1];
  })
  return paramObject
}

if (params.gameID) joinGameModal()

/*---MODAL---*/

//open with join content
function joinGameModal() {
  $("#enter-game-modal-text").text(`${params.createdBy} has invited you to play! You can join their game or create your own and invite friends to play.`)
  $(".start-game").hide();
  $("#new-game").hide();
  $("#enter-game-modal").show();
}
//open with new game logic
function createGameModal() {
  $("#enter-game-modal-text").text(`Enter your name and click create to start a game. You'll get a link to send your friends so they can join!`);
  $(".join-game").hide();
  $("#new-game").hide();
  $(".create-game").show();
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
  if(params.createdBy) joinGameModal()
  else createGameModal()
})
//new Game
$(".new-game").click(function () {
  event.preventDefault();
  createGameModal();
})
//create game button creates game and generates url for joining
$(".create-game").click(function () {
  event.preventDefault();
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
      .text(`${params.url}?&gameID=${id}&createdBy=${playerName}`)
      .addClass("link-text");
    $btn = $("<button>")
      .addClass("copy-button")
      .text("Copy Url");
    $div.append($url, $btn);
    $("#enter-game-modal-text").text(`Share this url to invite friends to join your game: `)
    $("#enter-game-modal-text").append($div);
    $(".join-game").hide();
    $("#name-input").hide();
    $(".create-game").hide();
    createButtons();
    watchChat();
  });
});
//join game
$(".join-game").click(function () {
  event.preventDefault();
  let playerName = $("#name-input").val().trim();
  if (!playerName){
    $("#name-input").after("Please Enter your name");
    return false
  }
  game.joinGame(name, function() {
    createButtons();
    watchChat();
  });
});
$(document).on("click", ".copy-button", function() {
  event.preventDefault();
  var $temp = $("<input>");
  $("body").append($temp);
  $temp.val($(".link-text").text()).select();
  document.execCommand("copy");
  $temp.remove();
  $(this).after("Copied!")
});
let usedLetters = [];
let letterInput = "";
//Create letter buttons
function createButtons() {
  game.gameData.letters.forEach((letter, index)=> {
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
  game.gameData.letters[index] = "";
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

/*---CHAT FUNCTIONALITY---*/
function watchChat() {
  game.watchChat(function (message) {
    console.log(message);
  })
}
