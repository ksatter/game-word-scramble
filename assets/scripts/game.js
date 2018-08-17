 console.log("game loaded");


const game = {
  vowels: ["A","E","I","O","U","Y"],
  consonants: ["B","C","D","F","G","H","J","K","L","M","N","P","Q","R","S","T","V","W","X","Z"],
  common: ["E","T","A","O","I","N","S","R","H","L","D","C"],
  playerId: "",
  gameId: "",
  playerName: "",
  gameData: {
    started: false,
    letters: [],
    words: {}
  },

  pushLetter: function(array){
    let random = Math.floor(Math.random() * array.length);
    if(this.gameData.letters.indexOf(array[random]) < 0) {
      this.gameData.letters.push(array[random])
    }
  },

  getLetters: function (callback) {
    this.gameData.letters = [];
    let i = 0;
    while(i < 9){
      console.log(i);
      if(i<=2){
        this.pushLetter(this.vowels)
      } else if (i<=4) {
        this.pushLetter(this.consonants)
      } else {
        this.pushLetter(this.common)
      }
      i = this.gameData.letters.length;
    }
    callback(this.gameData);
  },

  createGame: function(name, callback){
    this.getLetters(function (gameData) {
      database.createGame(gameData, function (id) {
        game.gameId = id;
        game.joinGame(game.gameId, name, function (res) {
          callback(game.gameId);
        });
      });
    });
  },

  joinGame: function (id, name, callback) {
    this.playerName = name;
    this.gameId = id;
    database.joinGame(id, name, function (res) {
      game.playerId = res;
      database.addMessage(game.playerName, "Has joined the game");
      database.updateGameData(function(res){
        game.gameData = res;
        console.log(game.gameData);
      });
      callback();
    });
  },
  startGame: function () {
    database.startGame()
  },
  playWord: function (word) {
    if(!this.gameData.words) database.playWord(word)
    let played = false;
    for(var key in this.gameData.words){
      if (this.gameData.words[key] === word) played = true;
    }
    if(!played) database.playWord(word)
    // if(!this.gameData.words || this.gameData.words.indexOf(word)) {
    //
    // }
  },
  watchChat: function(callback) {
      database.watchChat(function (chat) {
      callback(chat)
    });
  },
}
