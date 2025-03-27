import { TestNetwork } from "./dist/index.js";

(async () => {
  const network = await TestNetwork.create({});
  console.log("hi");
})();
