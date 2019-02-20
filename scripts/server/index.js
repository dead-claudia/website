/* eslint-disable global-require */
"use strict"

require("http").createServer(require("./listener")({
    logger: require("./logger"),
    dispatch: require("./dispatch"),
    render: require("./render"),
})).listen(8080, () => {
    console.log("Server ready at http://localhost:8080")
})
