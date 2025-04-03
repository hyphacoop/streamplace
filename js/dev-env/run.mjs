import { TestNetwork } from "./dist/index.js";

(async () => {
  const network = await TestNetwork.create({});
  console.log(network.pds.url);
  console.log(network.pds.port);
  console.log(network.plc.url);
  console.log(network.plc.port);
  console.log("hi");
})();
