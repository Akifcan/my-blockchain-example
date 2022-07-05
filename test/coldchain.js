const ColdChain = artifacts.require("ColdChain")
const { expectEvent, BN } = require('@openzeppelin/test-helpers')
const HDWalletProvider = require('@truffle/hdwallet-provider')
const Web3 = require('web3')

contract('ColdChain', (accounts) => {

    before(async () => {
        this.owner = accounts[0]

        this.VACCINE_BRANDS = {
            Pfizer: 'Pfizer-BioNTech',
            Moderna: 'Moderna',
            Sinovac: 'Sinovac Biotech',
            Sputnik: 'Sputnik V'
        }

        this.ModeEnums = {
            ISSUER: { val: 'ISSUER', pos: 0 },
            PROVER: { val: 'PROVER', pos: 1 },
            VERIFIER: { val: 'VERIFIER', pos: 2 },
        }

        this.defaultEntities = {
            manufacturerA: { id: accounts[1], mode: this.ModeEnums.PROVER.val },
            manufacturerB: { id: accounts[2], mode: this.ModeEnums.PROVER.val },
            inspector: { id: accounts[3], mode: this.ModeEnums.ISSUER.val },
            distributorGlobal: { id: accounts[4], mode: this.ModeEnums.VERIFIER.val },
            distributorLocal: { id: accounts[5], mode: this.ModeEnums.VERIFIER.val },
            immunizer: { id: accounts[6], mode: this.ModeEnums.ISSUER.val },
            traveller: { id: accounts[7], mode: this.ModeEnums.PROVER.val },
            bordereAgent: { id: accounts[8], mode: this.ModeEnums.VERIFIER.val }
        }

        this.defaultVaccineBatches = {
            0: {
                brand: this.VACCINE_BRANDS.Pfizer,
                manufacturer: this.defaultEntities.manufacturerA.id
            },
            1: {
                brand: this.VACCINE_BRANDS.Moderna,
                manufacturer: this.defaultEntities.manufacturerA.id
            },
            2: {
                brand: this.VACCINE_BRANDS.Sinovac,
                manufacturer: this.defaultEntities.manufacturerB.id
            },
            3: {
                brand: this.VACCINE_BRANDS.Sputnik,
                manufacturer: this.defaultEntities.manufacturerB.id
            },
            4: {
                brand: this.VACCINE_BRANDS.Pfizer,
                manufacturer: this.defaultEntities.manufacturerB.id
            },
            5: {
                brand: this.VACCINE_BRANDS.Pfizer,
                manufacturer: this.defaultEntities.manufacturerA.id
            },
            6: {
                brand: this.VACCINE_BRANDS.Moderna,
                manufacturer: this.defaultEntities.manufacturerA.id
            },
            7: {
                brand: this.VACCINE_BRANDS.Moderna,
                manufacturer: this.defaultEntities.manufacturerB.id
            },
            8: {
                brand: this.VACCINE_BRANDS.Sputnik,
                manufacturer: this.defaultEntities.manufacturerB.id
            },
            9: {
                brand: this.VACCINE_BRANDS.Sinovac,
                manufacturer: this.defaultEntities.manufacturerA.id
            }
        }

        this.coldChainInstance = await ColdChain.deployed()

    })

    it('should add entities', async () => {
        const coldChainInstance = await ColdChain.deployed()
        // const balance = await coldChainInstance.getBalance.call(accounts[0])

        for (const entity in this.defaultEntities) {
            const { id, mode } = this.defaultEntities[entity]
            const result = await coldChainInstance.addEntity(
                id, mode,
                { from: this.owner }
            )
            expectEvent(
                result.receipt,
                "AddEntity",
                { entityId: id, entityMode: mode }
            )
            const retrievedEntity = await coldChainInstance.entities.call(id)
            assert.equal(id, retrievedEntity.id, "mismatched ids")
            assert.equal(this.ModeEnums[mode].pos, retrievedEntity.mode.toString(), "mismatched modes")
        }

        // assert.equal()
    })

    it('should add vaccine batches', async () => {
        const coldChainInstance = await ColdChain.deployed()
        for (const i in this.defaultVaccineBatches) {
            const { brand, manufacturer } = this.defaultVaccineBatches[i]
            const result = await coldChainInstance.addVaccineBatch(
                brand, manufacturer,
                { from: this.owner }
            )
            expectEvent(
                result.receipt,
                "AddVaccineBatch",
                { vaccineBatchId: i, manufacturer }
            )
        }
    })

    it.skip('should sign a message', async () => {
        const coldChainInstance = await ColdChain.deployed()
        const mnemonic = 'dilemma mixed delay despair box denial health cheap dice gloom head pitch'
        const providerOrUrl = 'http://localhost:8545'
        const provider = new HDWalletProvider({
            mnemonic,
            providerOrUrl
        })
        this.web3 = new Web3(provider)

        const { inspector, manufacturerA } = this.defaultEntities
        const vaccineBatchId = 0
        const message = `Inspector ${inspector.id} has certified vaccine batch #${vaccineBatchId} for manufacturer ${manufacturerA.id}`
        const signature = await this.web3.eth.sign(
            this.web3.utils.keccak256(message),
            inspector.id
        )
        const result = await coldChainInstance.issueCertificate(
            inspector.id,
            manufacturerA.id,
            signature,
            { from: this.owner }
        )
        expectEvent(
            result.receipt,
            "IssueCertificate",
            { issuer: inspector.id, prover: manufacturerA.id }
        )
        const retrievedCertificate = await this.coldChainInstance.certificates.call(0)
        assert.equal(retrievedCertificate.id, 0)
        assert.equal(retrievedCertificate.issuer.id, inspector.id)
        assert.equal(retrievedCertificate.prover.id, manufacturerA.id)
        assert.equal(retrievedCertificate.signature, signature)


    })
})
