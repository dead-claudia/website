"use strict"

if (require.main === module) {
    throw new Error("This isn't a runnable script!")
}

exports.call = call
function call(func) {
    const args = []
    for (let i = 1; i < arguments.length; i++) {
        args.push(arguments[i])
    }
    return new Promise((resolve, reject) => {
        return func.apply(null, args.concat([
            (err, data) => err != null ? reject(err) : resolve(data),
        ]))
    })
}

exports.promisify = promisify
function promisify(func) {
    return function () {
        const args = [func]
        for (let i = 0; i < arguments.length; i++) args.push(arguments[i])
        return call.apply(null, args)
    }
}

exports.promisifyAll = function (obj, methods) {
    if (methods == null) {
        methods = Object.keys(obj).filter(x => !/sync$/i.test(x))
    }
    methods.forEach(prop => {
        obj[`${prop}Async`] = promisify(obj[prop])
    })
    return obj
}
