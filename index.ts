// @ts-nocheck

export default function decorate<
  O extends object,
  K extends keyof O,
  P = Parameters<O[K]>,
  R = ReturnType<O[K]>,
  W = (fn: (...args: P) => R) => (...args: P) => R
>(object: O, method: K, wrapper: W) {
  const originalKey = Symbol.for(`${method}$original`)
  const decoratorsKey = Symbol.for(`${method}$decorators`)
  const original = object[originalKey] ?? object[method]

  if (!object[decoratorsKey]) {
    object[originalKey] = original
    object[decoratorsKey] = []
  }

  object[decoratorsKey].push(wrapper)
  wrap(object, method, original, object[decoratorsKey])

  return () => {
    object[decoratorsKey] = object[decoratorsKey].filter(fn => fn !== wrapper)
    wrap(object, method, original, object[decoratorsKey])
  }
}

function wrap(object, method, original, wrappers) {
  object[method] = wrappers.reduce((res, wrapper) => wrapper(res), original)
}

decorate.parameters = function <
  O extends object,
  K extends keyof O,
  P = Parameters<O[K]>,
  W = (args: P) => P
>(object: O, method: K, wrapper: W) {
  return decorate(object, method, fn => function (...args) {
    return fn.call(this, ...wrapper.call(this, args))
  })
}

decorate.returnValue = function <
  O extends object,
  K extends keyof O,
  P = Parameters<O[K]>,
  R = ReturnType<O[K]>,
  W = (args: P, value: R) => R
>(object: O, method: K, wrapper: W) {
  return decorate(object, method, fn => function (...args) {
    const res = fn.call(this, ...args)
    const wrapped = ret => wrapper.call(this, args, ret)
    return res instanceof Promise ? res.then(wrapped) : wrapped(res)
  })
}

decorate.beforeCall = function <
  O extends object,
  K extends keyof O,
  P = Parameters<O[K]>,
  L = (args: P) => void
>(object: O, method: K, listener: L) {
  return decorate.parameters(object, method, function (args) {
    return (listener.call(this, args), args)
  })
}

decorate.afterCall = function <
  O extends object,
  K extends keyof O,
  P = Parameters<O[K]>,
  R = ReturnType<O[K]>,
  L = (args: P, returnVal: R) => void
>(object: O, method: K, listener: L) {
  return decorate.returnValue(object, method, function (args, res) {
    return (listener(args, res), res)
  })
}
