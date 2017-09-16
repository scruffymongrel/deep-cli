const ipv4 = require('deep-ipv4')
const link = require('deep-link')
const serve = require('deep-serve')

const fs = require('fs')
const path = require('path')

module.exports = () => {
  const args = process.argv.slice(3)
  const command = process.argv[2]
  if (!command) {
    commands.run('help')
  } else {
    commands.run(command, args)
  }
}

const commands = {
  help: () => {
    console.log('\u2693 Deep makes it incredibly easy to share content and functionality across devices.')
    console.log('\u2693 `deep serve ([valid path])` launches a static server which can be linked to.')
    console.log('\u2693 `deep link [:port|url]` links you to servers via a local port or a URL.')
    console.log('\u2693 Either command creates a deep.io URL which connects to your target.')
    process.exit(1)
  },
  link: (args) => {
    const isValidUrl = /^(http|https|ws):\/\/(\b(1?[0-9]{1,2}|2[0-4][0-9]|25[0-5])\b\.\b(1?[0-9]{1,2}|2[0-4][0-9]|25[0-5])\b\.\b(1?[0-9]{1,2}|2[0-4][0-9]|25[0-5])\b\.\b(1?[0-9]{1,2}|2[0-4][0-9]|25[0-5])\b|[-a-zA-Z0-9_.]{2,}\.[A-Za-z]{2,})(:(?:[0-5]?[0-9]{1,4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-6]))?(\/[-a-zA-Z0-9@:%_\+.~#?&/=]*)?$/.test(args[0])
    if (isValidUrl) {
      link(args[0])
    }

    function findPort () {
      let match = args.filter((arg) => {
        if (arg.charAt(0) == ':') {
          return true
        }
      })
      if (match.length) {
        const port = match[0].substr(1)
        if (port === 12345) {
          console.log(`Port ${port} is reserved for deep server`)
          process.exit(1)
        } else if (port > 65536) {
          console.log(`Port ${port} is not a valid port`)
          process.exit(1)
        }
        return `:${port}`
      }
    }

    const target = {}
    target.port = findPort()

    if (target.port) {
      function findPath () {
        let match = args.filter((arg) => {
          if (arg.charAt(0) == '/') {
            return true
          }
        })
        if (match.length) {
          return match[0]
        }
      }
      function findProtocol () {
        let match = args.filter((arg) => {
           if (arg.charAt(arg.length -1) == ':') {
            return true
          }
        })
        if (match.length) {
          const protocol = match[0]
          const validProtocols = ['http:', 'https:', 'ws:']
          if (!protocol.indexOf(validProtocols)) {
            console.log(`Invalid protocol. Deep server only supports HTTP, HTTPS, and WebSockets`)
            process.exit(1)
          }
          return protocol
        }
      }

      target.path = findPath() || ''
      target.protocol = findProtocol() || 'http:'
      link(`${target.protocol}//${ipv4}${target.port}${target.path}`)
    } else {
      console.log('Link requires a port or a URL')
      process.exit(1)
    }
  },

  run: function (command, args) {
    if (!this[command]) {
      console.log(`'${command}' is not a valid Deep command`)
      this.help()
    } else {
      this[command](args)
    }
  },

  serve: (args) => {
    const pathFragment = args[0] || ''
    const servePath = path.normalize(path.join(process.cwd(), pathFragment))
    const target = {}

    fs.stat(servePath, (err, data) => {
      if (err) {
        console.log(`${servePath} does not exist`)
        process.exit(1)
      }
      if (data.isDirectory()) {
        target.dir = servePath
        target.url = `http://${ipv4}:12345`
      } else if (data.isFile()) {
        const lastSlash = servePath.lastIndexOf('/')
        target.dir = servePath.substr(0, lastSlash)
        target.file = servePath.substr(lastSlash + 1)
        target.url = `http://${ipv4}:12345/${target.file}`
      } else {
        console.log(`${servePath} is not a valid directory or file`)
        process.exit(1)
      }

      link(serve(target))
    })
  }
}
