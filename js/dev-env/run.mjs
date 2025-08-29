import { TestNetwork } from "./dist/index.js";

(async () => {
  const network = await TestNetwork.create({});
  console.log(`PDS: ${network.pds.url}`);
  console.log(`PLC: ${network.plc.url}`);
})();
