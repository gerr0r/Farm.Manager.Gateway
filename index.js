const { ApolloServer } = require("apollo-server");
const { ApolloGateway, RemoteGraphQLDataSource } = require("@apollo/gateway");
const tcpPortUsed = require("tcp-port-used");

const serviceList = [
  {
    name: "account",
    url: process.env.MS_ACCOUNT || "http://localhost:4001",
  },
  {
    name: "location",
    url: process.env.MS_LOCATION || "http://localhost:4002",
  },
  { name: "farm", url: process.env.MS_FARM || "http://localhost:4003" },
  { name: "crop", url: process.env.MS_CROP || "http://localhost:4004" },
  {
    name: "machine",
    url: process.env.MS_MACHINE || "http://localhost:4005",
  },
  {
    name: "employee",
    url: process.env.MS_EMPLOYEE || "http://localhost:4006",
  },
];

function serviceCheck() {
  const list = [];

  serviceList.forEach((service) => {
    const servicePort = Number(service.url.split(":")[2]);
    list.push(
      tcpPortUsed
        .waitUntilUsedOnHost(
          servicePort,
          service.name || "localhost",
          500,
          30000
        )
        .then(
          function () {
            console.log(
              `GW: ${service.name} service detected on ${service.url}`
            );
          },
          function (err) {
            console.error(
              `GW Error: Service: ${service.name}. Reason: ${err.message}`
            );
          }
        )
    );
  });

  return list;
}

Promise.all(serviceCheck())
  .then((values) => {
    // Initialize an ApolloGateway instance and pass it an array of
    // your subgraph names and URLs
    const gateway = new ApolloGateway({
      serviceList,
      buildService({ url }) {
        return new RemoteGraphQLDataSource({
          url,
          willSendRequest({ request, context }) {
            request.http.headers.set(
              "authorization",
              context.token ? context.token : null
            );
          },
        });
      },
    });

    // Pass the ApolloGateway to the ApolloServer constructor
    const server = new ApolloServer({
      gateway,
      // Disable subscriptions (not currently supported with ApolloGateway)
      subscriptions: false,
      context: (ctx) => {
        return { token: ctx.req.headers.authorization };
      },
    });

    const PORT = process.env.GATEWAY_PORT || 4000;
    server.listen(PORT).then(({ url }) => {
      console.log(`Gateway ready at ${url}`);
    });
  })
  .catch((error) => {
    console.error("GW Error:", error.message);
  });
