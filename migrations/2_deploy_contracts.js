const ColdChain = artifacts.require("ColdChain")

module.exports = async function (deployer) {
  const res = await deployer.deploy(ColdChain)
  console.log("deployed");
  console.log(res);
};
