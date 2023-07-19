# decorate.js

Decorate object method use function. Can use for monkey patching.

## Installation

Install using [npm](https://www.npmjs.org/):

```sh
npm i -P @plylrnsdy/decorate.js
```

## API

### decorate

```javascript
decorate(app, 'openFile', fn => (...args) => {
  if (!args[0].endsWith('.md')) {
    openWithDefaultApp(args[0])
    return
  }
  fn(...args)
})
```

### decorate.parameters

```javascript
decorate.parameters(logger, 'log', (args) => {
  args.unshift(`[${new Date().toLocaleString()}]`)
  return args
})
```

### decorate.returnValue

```javascript
decorate.returnValue(settings, 'load', (args, res) => {
  return Object.assign(Object.create(DEFALUT_SETTINGS), res)
})
```

### decorate.beforeCall

```javascript
decorate.beforeCall(app, 'openFile', (args) => {
  events.emit('willOpenFile', args[0])
})
```

### decorate.afterCall

```javascript
decorate.afterCall(app, 'openFile', (args, res) => {
  events.emit('openFile', args[0])
})
```
