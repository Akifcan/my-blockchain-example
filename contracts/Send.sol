// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.7.0 <0.9.0;

contract Send {
    function sendEth(address payable wallet) public payable returns (bool) {
        wallet.transfer(msg.value);
        return true;
    }
}
