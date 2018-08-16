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
      callback(snapshot.key)
    })
  },

  updateGameData: function (callback) {
    Db.ref(game.gameId).on("value", function(snapshot){
      callback(snapshot.val());
    })
  },

  watchChat: function (callback) {
    Db.ref(`${game.gameID}/chat`).on("child_added", function () {
      callback(snapshot.val());
    })
  },
  playWord: function (word) {
    Db.ref(`${game.gameId}/words`).push(word).then(function () {
      Db.ref(`${game.gameId}/players/${game.playerId}/words`).push(word).then(function () {
        database.addMessage(game.playerName, `played ${word}`)
      });
    });
  },
  startGame: function () {
    Db.ref(`${game.gameId}/started`).set(true)
  },
  addMessage: function (name, message) {
    Db.ref(`${game.gameId}/messages`).push({name, message})
  }
}
