 console.log("game loaded");


const game = {
  vowels: ["A","E","I","O","U","Y"],
  consonants: ["B","C","D","F","G","H","J","K","L","M","N","P","Q","R","S","T","V","W","X","Z"],
  alphabet: [],
  playerId: "",
  gameId: "",
  playerName: "",
  gameData: {
    started: false,
    letters: [],
    words: {}
  },

  combine: function() {
    this.alphabet = this.consonants.concat(this.vowels)
  },

  pushLetter: function(array){
    let randomNumber = Math.floor(Math.random() * array.length);
    this.gameData.letters.push(array[randomNumber])
  },

  getLetters: function () {
    for(let i=1; i<=9; i++){
      if(i<=2){
        this.pushLetter(this.vowels)
      } else if (i<=4) {
        this.pushLetter(this.consonants)
      } else {
        this.combine();
        this.pushLetter(this.alphabet)
      }
    }
  },

  createGame: function(name, callback){
    this.getLetters();
    database.createGame(this.gameData, function (res) {
      game.gameId = res
      game.joinGame(res, name);
      callback(res);
    });
  },

  joinGame: function (id, name, callback) {
    database.joinGame(id, name, function (res) {
      game.gameId = id;
      game.playerId = res;
      game.playerName = name;
      database.updateGameData(function(res){
        game.gameData = res;
        console.log(game.gameData);
      });
      if (callback) callback();
    });
  },
  startGame: function () {
    database.startGame()
  },
  playWord: function (word) {
    database.playWord(word);
  },
  watchChat: function(callback) {
    database.watchChat(function (chat) {
      callback(chat);
    })
  }
}
