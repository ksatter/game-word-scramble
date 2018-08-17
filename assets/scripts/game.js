 console.log("game loaded");


const game = {
  vowels: ["A","E","I","O","U","Y"],
  consonants: ["B","C","D","F","G","H","J","K","L","M","N","P","Q","R","S","T","V","W","X","Z"],
  common: ["E","T","A","O","I","N","S","R","H","L","D","C"],
  playerId: "",
  gameId: "",
  playerName: "",
  gameData: {
    roundStarted: false,
    letters: [],
    words: {}
  },
  //create array of 9 unique letters
  getLetters: function (callback) {
    this.gameData.letters = [];
    let i = 0;
    while(i < 9){
      console.log(i);
      //guarantee 2 vowels
      if(i<=2){
        this.pushLetter(this.vowels)
      //guarantee 2 consonants
      } else if (i<=4) {
        this.pushLetter(this.consonants)
      //remainder of letters will be commonly used letters
      } else {
        this.pushLetter(this.common)
      }
      i = this.gameData.letters.length;
    }
    callback(this.gameData);
  },
  //get random letter from array and push if new letter
  pushLetter: function(array){
    let random = Math.floor(Math.random() * array.length);
    if(this.gameData.letters.indexOf(array[random]) < 0) {
      this.gameData.letters.push(array[random])
    }
  },
  //create entry in firebase and set up game
  createGame: function(name, callback){
    this.setupRound(function (gameData) {
      database.createGame(gameData, function (id) {
        game.gameId = id;
        game.joinGame(game.gameId, name, function (res) {
          callback(game.gameId);
        });
      });
    })
  },
  //add new player to firebase and start listening from changes to game state
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
  //trigger start of round
  changeState: function (state) {
    database.changeState(state)
  },
  playWord: function (word) {
    if(!this.gameData.words) database.playWord(word)
    let played = false;
    for(var key in this.gameData.words){
      if (this.gameData.words[key] === word) played = true;
    }
    if(!played) database.playWord(word)
  },
  watchChat: function(callback) {
      database.watchChat(function (chat) {
      callback(chat)
    });
  },
  setupRound: function (callback) {
    this.gameData = {
      roundStarted: false,
      letters: [],
      words: {}
    };
    this.getLetters(function (gameData) {
      callback(gameData);
    })
  }
}
