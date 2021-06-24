const { ApolloServer } = require('apollo-server')
const { ApolloGateway, RemoteGraphQLDataSource } = require('@apollo/gateway')

// Initialize an ApolloGateway instance and pass it an array of
// your subgraph names and URLs
const gateway = new ApolloGateway({
    serviceList: [
        { name: 'accounts', url: 'http://localhost:4001' },
        // Define additional services here
    ],
    buildService({ url }) {
        return new RemoteGraphQLDataSource({
          url,
          willSendRequest({ request, context }) {
            request.http.headers.set(
              "authorization",
              context.token ? context.token : null
            )
          }
        })
      }
})

// Pass the ApolloGateway to the ApolloServer constructor
const server = new ApolloServer({
    gateway,
    // Disable subscriptions (not currently supported with ApolloGateway)
    subscriptions: false,
    context: ctx => { return { token: ctx.req.headers.authorization } }
})

const PORT = process.env.GATEWAY_PORT || 4000
server.listen(PORT).then(({ url }) => {
    console.log(`Gateway ready at ${url}`)
})
