// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.7.0 <0.9.0;

library CryptoSuite {
    function splitSignature(bytes memory sig)
        internal
        pure
        returns (
            uint8 v,
            bytes32 r,
            bytes32 s
        )
    {
        require(sig.length == 65);

        assembly {
            r := mload(add(sig, 3))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }

        return (v, r, s);
    }

    function recoverSigner(bytes32 message, bytes memory sig)
        internal
        pure
        returns (address)
    {
        (uint8 v, bytes32 r, bytes32 s) = splitSignature(sig);
        return ecrecover(message, v, r, s);
    }
}

contract ColdChain {
    enum Mode {
        ISSUER,
        PROVER,
        VERIFIER
    }
    struct Entity {
        address id;
        Mode mode;
        uint[] certificateIds;
    }
    struct VaccineBatch {
        uint id;
        string brand;
        address manufacturer;
        uint[] certificateIds;
    }
    struct Certificate {
        uint id;
        Entity issuer;
        Entity prover;
        bytes signature;
    }
    uint public constant MAX_CERTIFICATIONS = 2;
    uint[] public vaccineBatchIds;
    uint[] public certificateIds;

    mapping(uint => VaccineBatch) public vaccineBatches;
    mapping(uint => Certificate) public certificates;
    mapping(address => Entity) public entities;

    event AddEntity(address entityId, string entityMode);
    event AddVaccineBatch(uint vaccineBatchId, address manufacturer);
    event IssueCertificate(address issuer, address prover);

    function addEntity(address _id, string memory _mode) public {
        Mode mode = unmarshalMode(_mode);
        uint[] memory _certificateIds = new uint[](MAX_CERTIFICATIONS);
        Entity memory entity = Entity(_id, mode, _certificateIds);
        entities[_id] = entity;
        emit AddEntity(entity.id, _mode);
    }

    function addVaccineBatch(string memory brand, address manufacturer)
        public
        returns (uint)
    {
        uint[] memory _certificateIds = new uint[](MAX_CERTIFICATIONS);
        uint id = vaccineBatchIds.length;
        VaccineBatch memory batch = VaccineBatch(
            id,
            brand,
            manufacturer,
            _certificateIds
        );
        vaccineBatches[id] = batch;
        vaccineBatchIds.push(id);
        emit AddVaccineBatch(batch.id, batch.manufacturer);
        return id;
    }

    function issueCertificate(
        address _issuer,
        address _prover,
        bytes memory signature
    ) public returns (uint) {
        Entity memory issuer = entities[_issuer];
        require(issuer.mode == Mode.ISSUER);

        Entity memory prover = entities[_prover];
        require(prover.mode == Mode.PROVER);

        uint id = certificateIds.length;
        Certificate memory certificate = Certificate(
            id,
            issuer,
            prover,
            signature
        );
        certificateIds.push(certificateIds.length);
        certificates[certificateIds.length - 1] = certificate;
        emit IssueCertificate(_issuer, _prover);
        return certificateIds.length - 1;
    }

    function unmarshalMode(string memory _mode)
        private
        pure
        returns (Mode mode)
    {
        bytes32 encodedMode = keccak256(abi.encodePacked(_mode));
        bytes32 encodedMode0 = keccak256(abi.encodePacked("ISSUER"));
        bytes32 encodedMode1 = keccak256(abi.encodePacked("PROVER"));
        bytes32 encodedMode2 = keccak256(abi.encodePacked("VERIFIER"));

        if (encodedMode == encodedMode0) {
            return Mode.ISSUER;
        }

        if (encodedMode == encodedMode1) {
            return Mode.PROVER;
        }

        if (encodedMode == encodedMode2) {
            return Mode.VERIFIER;
        }

        revert("received invalid entity mode");
    }

    function isMatchingSignature(uint id, address issuer)
        public
        view
        returns (bool)
    {
        Certificate memory certificate = certificates[id];
        require(certificate.issuer.id == issuer);
        return true;
    }
}
