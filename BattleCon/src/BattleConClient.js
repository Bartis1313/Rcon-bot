import BattleCon from "../src/BattleCon";
import { webHookKickSenderBF4, webHookKickSenderBF3, webHookPB } from './webHook.js'

class BattleConClient {
  constructor(host, port, password) {
    this._connection = new BattleCon(host, port, password).use(process.env.GAME);
    this.initialize()
  }

  initialize() {
    let reconnectInterval = null;

    let connection = this._connection
    let version = '';
    this._connection.on("connect", function () {
      console.log("# Connected to " + connection.host + ":" + connection.port);
      if (reconnectInterval !== null) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
      }
    });

    this._connection.on("login", function () {
      console.log("# Login successful");
    });

    this._connection.on("ready", function () {
      // Execute raw commands:
      connection.exec("version", function (err, msg) {
        console.log("# Server is running " + msg[0] + ", version " + msg[1]);
        version = msg[1];
      });

      // Execute module commands (core.js):
      connection.serverInfo(function (err, info) {
        if (process.env.NODE_ENV === 'development') {
        }
      });

      connection.on("event", function (msg) {
        //console.log("event", msg);
      });

      connection.listPlayers(function (err, players) {
        console.log("There are " + players.length + " connected players:");
        for (var i = 0; i < players.length; i++) {

        }
      });
    });

    this._connection.on("player.disconnect", function (name, reason) {
      webHookKickSenderBF4(connection, name, reason);
    });

    this._connection.on("close", () => {
      const date = new Date();
      console.log(`Disconnect: ${date.toLocaleString()}`);
      this._connection.disconnect();
      if (reconnectInterval === null) {
        reconnectInterval = setInterval(() => {
          this._connection.connect();
          console.log("Retried to connect");
        }, 60_000); // 60secs
      }
    });

    this._connection.on("error", (err) => {
      //console.log("# Error: " + err.message, err.stack);
    });

    connection.on("player.chat", function (name, text, subset) {
      //console.log("# " + name + " -> " + subset.join(' ') + ": " + text);
      webHookKickSenderBF3(connection, name, text, subset);
    });

    connection.on("pb.message", function (msg) {
      //console.log(msg)
      webHookPB(connection, version, msg);
    });
  }

  connect() {

    this._connection.connect(); // Connects and logs in
  }

  version() {
    let connection = this._connection
    return new Promise(function (resolve, reject) {
      connection.exec("version", function (err, msg) {
        err ? reject(err.message) : resolve(msg)
      });
    })
  }

  serverInfo() {
    let connection = this._connection
    return new Promise(function (resolve, reject) {
      connection.exec("serverInfo", function (err, msg) {
        err ? reject(err.message) : resolve(msg)
      });
    })
  }

  killPlayer(playerName) {
    let connection = this._connection
    return new Promise(function (resolve, reject) {
      if (!playerName) reject('Player name is required.')

      connection.exec(["admin.killPlayer", playerName], function (err, msg) {
        err ? reject(err.message) : resolve({ playerName: playerName })
      });
    })
  }

  kickPlayer(playerName, reason) {
    let connection = this._connection
    return new Promise(function (resolve, reject) {
      if (!playerName) reject('Player name is required.')
      reason = reason ? reason : "Kicked by administrator"

      connection.exec(["admin.kickPlayer", playerName, reason], function (err, msg) {
        err ? reject(err.message) : resolve({ playerName: playerName, reason: reason })
      });
    })
  }

  banPlayer(banType, banId, timeout, reason) {
    let connection = this._connection
    return new Promise(function (resolve, reject) {
      if (!banType) reject('Ban Type is required.')
      if (!banId) reject('Ban ID is required.')
      if (!timeout) reject('Timeout is required.')
      let banTimeoutType = timeout
      let banTimeout = null

      let command = ["banList.add", banType, banId]

      if (timeout === "perm") command.push("perm")
      else if (timeout.startsWith("seconds") || timeout.startsWith("rounds")) {
        let parts = timeout.split(' ')
        banTimeoutType = parts[0]
        banTimeout = parts[1]

        command.push(parts[0])
        command.push(parts[1])
      }

      reason = reason ? reason : "Banned by admin"
      command.push(reason)

      connection.exec(command, function (err, msg) {
        if (err) reject(err.message)

        connection.exec(["banList.save"], function (err, msg) {
          err ? reject(err.message) : resolve({
            banType: banType,
            banId: banId,
            banTimeoutType: banTimeoutType,
            banTimeout: banTimeout,
            banReason: reason
          })
        });
      });
    })
  }
  vipPlayer(soldierName) {
    let connection = this._connection
    return new Promise(function (resolve, reject) {
      if (!soldierName) reject('Player name is required.')

      connection.exec(["reservedSlotsList.add", soldierName], function (err, msg) {
        err ? reject(err.message) : resolve({ soldierName: soldierName })
      });
      connection.exec(["reservedSlotsList.save"], function (err, msg) {
        err ? reject(err.message) : resolve({ soldierName: soldierName })
      });
    })
  }

  listPlayers() {
    let connection = this._connection
    return new Promise(function (resolve, reject) {
      connection.listPlayers(function (err, players) {
        err ? reject(err.message) : resolve({ players: players })
      });
    })
  }

  team_1() {
    let connection = this._connection
    return new Promise(function (resolve, reject) {
      connection.team_1(function (err, players) {
        for (var i = 0; i < players.length; i++) {
        }
        err ? reject(err.message) : resolve({ players: players })
      });
    })
  }

  team_2() {
    let connection = this._connection
    return new Promise(function (resolve, reject) {
      connection.team_2(function (err, players) {
        for (var i = 0; i < players.length; i++) {
        }
        err ? reject(err.message) : resolve({ players: players })
      });
    })
  }
  serverFPS() {
    let connection = this._connection
    return new Promise(function (resolve, reject) {
      connection.exec("vars.serverTickTime", function (err, msg) {
        err ? reject(err.message) : resolve(msg)
      });
    })
  }
  listOfMaps() {
    let connection = this._connection
    return new Promise(function (resolve, reject) {
      connection.exec("mapList.list", function (err, msg) {
        err ? reject(err.message) : resolve(msg)
      });
    })
  }
  setNextMap(indexNum) {
    let connection = this._connection
    return new Promise(function (resolve, reject) {
      if (!indexNum) reject('Index is required.')

      connection.exec(["mapList.setNextMapIndex", indexNum], function (err, msg) {
        err ? reject(err.message) : resolve({ indexNum: indexNum })
      });
    })
  }
  // use offset for more bans
  printBanList() {
    let connection = this._connection
    return new Promise(function (resolve, reject) {
      connection.exec("banList.list", function (err, msg) {
        err ? reject(err.message) : resolve(msg)
      });
    })
  }
  unban(banType, banId) {
    let connection = this._connection
    return new Promise(function (resolve, reject) {
      if (!banType || !banId) reject('type of unban is required.')

      connection.exec(["banlist.remove", banType, banId], function (err, msg) {
        err ? reject(err.message) : resolve({ banType: banType, banId: banId })
      });
    })
  }
  getAllInfo() {
    let connection = this._connection
    return new Promise(function (resolve, reject) {
      connection.exec("serverInfo", function (err, msg) {
        err ? reject(err.message) : resolve(msg)
      });
    })
  }
  getMapIndices() {
    let connection = this._connection
    return new Promise(function (resolve, reject) {
      connection.exec("mapList.getMapIndices", function (err, msg) {
        err ? reject(err.message) : resolve(msg)
      });
    })
  }
  switchPlayer(playerName, teamId, squadId, force) {
    let connection = this._connection
    return new Promise(function (resolve, reject) {
      if (!playerName || !teamId ||
        !squadId || !force) {
        reject("Not enough arguments")
      }
      connection.exec(["admin.movePlayer", playerName, teamId, squadId, force], function (err, msg) {
        err ? reject(err.message) : resolve(msg)
      })
    })
  }
  adminSayall(what) {
    let connection = this._connection
    return new Promise(function (resolve, reject) {
      if (!what) reject('admin say failed.')
      connection.exec(["admin.say", what, "all"], function (err, msg) {
        err ? reject(err.message) : resolve(msg)
      });
    })
  }

  adminYellall(what, duration) {
    let connection = this._connection
    if (duration < 0) duration = 0;
    let d = duration >>> 0;
    return new Promise(function (resolve, reject) {
      if (!what || !duration) reject('admin yell failed.')
      connection.exec(["admin.yell", what, d.toString(), "all"], function (err, msg) {
        err ? reject(err.message) : resolve(msg)
      });
    })
  }

  adminSayPlayer(what, playerName) {
    let connection = this._connection
    return new Promise(function (resolve, reject) {
      if (!what || !playerName) reject('admin say failed.')
      let player = "player";
      connection.exec(["admin.say", what, player, playerName], function (err, msg) {
        err ? reject(err.message) : resolve(msg)
      });
    })
  }

  adminYellPlayer(what, duration, playerName) {
    let du = Number(duration);
    if (du < 0) du = 0;
    let d = du >>> 0;
    let connection = this._connection
    return new Promise(function (resolve, reject) {
      if (!what || !playerName) reject('admin yell failed.')
      let player = "player";
      connection.exec(["admin.yell", what, d.toString(), player, playerName], function (err, msg) {
        err ? reject(err.message) : resolve(msg)
      });
    })
  }

  customCommand(command, params) {
    let connection = this._connection
    return new Promise(function (resolve, reject) {
      if (!command) reject('command name is required.')

      connection.exec(command, params ? params : null, function (err, msg) {
        err ? reject(err.message) : resolve(msg)
      });
    })
  }
}


export default BattleConClient