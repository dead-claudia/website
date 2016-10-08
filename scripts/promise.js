"use strict"

if (require.main === module) {
    throw new Error("This isn't a runnable script!")
}

module.exports = (func, ...args) => new Promise((resolve, reject) => {
    func(...args, (err, data) =>
        err != null ? reject(err) : resolve(data))
})
