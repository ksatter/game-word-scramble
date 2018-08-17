// Initialize Firebase
var config = {
  apiKey: "AIzaSyBs3K7ZZP7Ff9B7LjYwAtt4pcEcgxyd-WU",
  authDomain: "game-word-scramble.firebaseapp.com",
  databaseURL: "https://game-word-scramble.firebaseio.com",
  projectId: "game-word-scramble",
  storageBucket: "game-word-scramble.appspot.com",
  messagingSenderId: "817701834297"
};
firebase.initializeApp(config);

const Db = firebase.database()

const database = {

  createGame: function (gameData, callback) {
    Db.ref().push(gameData)
      .then(function (snapshot){
        callback(snapshot.key);
    });
  },
  joinGame: function (id, name, callback) {
    Db.ref(`/${id}/players`).push({name}).then(function(snapshot){
      game.playerId = snapshot.key;
      Db.ref(id).once("value", function (snapshot) {
        game.gameData = snapshot.val();
        callback(game.playerId);
      })

    })
  },
  setupRound: function (callback) {
    Db.ref(game.gameId).set(game.gameData)
      .then(function (){
        callback();
    });
  },
  watchGameData: function (callback) {
    Db.ref(game.gameId).on("value", function(snapshot){
      callback(snapshot.val());
    })
  },

  watchChat: function (callback) {
    console.log("called!!!");
    Db.ref(`${game.gameId}/messages`).on("child_added", function (snapshot) {
      callback(snapshot.val());
    })
  },
  playWord: function (word) {
    Db.ref(`${game.gameId}/words`).push(word).then(function () {
      Db.ref(`${game.gameId}/players/${game.playerId}/words`).push(word).then(function () {
        database.addMessage("Game update", `${game.playerName} played ${word}`)
      });
    });
  },
  changeState: function () {
    if(game.gameData.roundStarted)  Db.ref(`${game.gameId}/roundStarted`).set(false)
    else Db.ref(`${game.gameId}/roundStarted`).set(true)

  },
  addMessage: function (player, message) {
    Db.ref(`${game.gameId}/messages`).push({player, message})
  }
}
