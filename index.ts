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
  object[method] = wrappers.reduce((res, wrapper) => wrapper(res), original.bind(object))
}

decorate.parameters = function <
  O extends object,
  K extends keyof O,
  P = Parameters<O[K]>,
  W = (args: P) => P
>(object: O, method: K, wrapper: W) {
  return decorate(object, method, fn => (...args) => fn(...wrapper(args)))
}

decorate.returnValue = function <
  O extends object,
  K extends keyof O,
  P = Parameters<O[K]>,
  R = ReturnType<O[K]>,
  W = (args: P, value: R) => R
>(object: O, method: K, wrapper: W) {
  return decorate(object, method, fn => (...args) => {
    const res = fn(...args)
    const wrapped = ret => wrapper(args, ret)
    return res instanceof Promise ? res.then(wrapped) : wrapped(res)
  })
}

decorate.beforeCall = function <
  O extends object,
  K extends keyof O,
  P = Parameters<O[K]>,
  L = (args: P) => void
>(object: O, method: K, listener: L) {
  return decorate.parameters(object, method, (args) => (listener(args), args));
}

decorate.afterCall = function <
  O extends object,
  K extends keyof O,
  P = Parameters<O[K]>,
  R = ReturnType<O[K]>,
  L = (args: P, returnVal: R) => void
>(object: O, method: K, listener: L) {
  return decorate.returnValue(object, method, (args, res) => (listener(args, res), res))
}
