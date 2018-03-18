(function () {
  'use strict'

  const electron = require('electron')
  const app = electron.app
  const BrowserWindow = electron.BrowserWindow
  const client = require('electron-connect').client

  const express = require('express')
  const path = require('path')
  const logger = require('morgan')
  const cookieParser = require('cookie-parser')
  const bodyParser = require('body-parser')
  const skipMap = require('skip-map')
  const expressApp = express()
  const debug = require('debug')('express-test:server')
  const http = require('http')
  const MongoClient = require('mongodb').MongoClient;

  const port = process.env.PORT || '3000'
  

  let server;
  let mainWindow;
  let db;

  MongoClient.connect('mongodb://localhost:27017', (err, client) => {
    db = client.db('electron-test'); // database name
  });

  function onListening () {
    let addr = server.address()
    let bind = typeof addr === 'string'
          ? 'pipe ' + addr
          : 'port ' + addr.port
    debug('Listening on ' + bind)

    mainWindow.loadURL('http://localhost:3000');

        // Use Electron Connect when developing for live reloading, and show the devtools
    if (process.env.NODE_ENV === 'development') {
      mainWindow.toggleDevTools()
      client.create(mainWindow)
    };
  }

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  });

  app.on('ready', () => {
    mainWindow = new BrowserWindow({
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: true
      },
      width: 1200,
      height: 900
    });

    expressApp.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      next();
    });
    expressApp.use(skipMap())
    expressApp.use(express.static(path.join(__dirname, 'www')))
    expressApp.use(express.static(path.join(__dirname, 'node_modules')))
    expressApp.use(logger('dev'))
    expressApp.use(bodyParser.json())
    expressApp.use(bodyParser.urlencoded({ extended: false }))
    expressApp.use(cookieParser())
    expressApp.set('port', port)
    expressApp.get('/',(req, res) => {
      res.sendFile(path.join(path.join(__dirname, '/index.html')))
    })

    // handle form request here

    server = http.createServer(expressApp)
    server.listen(port)
    server.on('listening', onListening)

    mainWindow.on('closed', () => {
      mainWindow = null
      server.close()
    })
  })
}());
