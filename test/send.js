const Send = artifacts.require("Send")

contract('ColdChain', (accounts) => {
    before(() => {
        this.current = accounts[3]
        console.log(this.current);
    })

    it('should send eth', async () => {
        const sendInstance = await Send.deployed()
        const result = await sendInstance.sendEth(this.current, { value: 1 })
        // console.log(result)
        assert.equal(result.receipt.status, true, "not true")
    })
})
