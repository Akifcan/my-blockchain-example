const Send = artifacts.require("Send")

module.exports = async function (deployer) {
    const res = await deployer.deploy(Send)
    console.log("deployed send!");
    console.log(res);
};
