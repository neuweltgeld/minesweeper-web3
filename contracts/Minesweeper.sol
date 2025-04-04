// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Minesweeper {
    event GamePurchased(address indexed player, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    uint256 public constant GAME_PRICE = 0.001 ether;
    uint256 public constant MAX_PURCHASE = 10;
    address public constant WITHDRAW_ADDRESS = 0x800b0FC2352a862E1f5b7154Ee399bbD2F4d05eF;

    constructor() {}

    function purchaseGame() public payable {
        require(msg.value == GAME_PRICE, "Incorrect amount sent");
        emit GamePurchased(msg.sender, msg.value);
    }

    function purchaseGames(uint256 amount) public payable {
        require(amount > 0 && amount <= MAX_PURCHASE, "Invalid amount");
        require(msg.value == GAME_PRICE * amount, "Incorrect amount sent");
        emit GamePurchased(msg.sender, msg.value);
    }

    function withdraw() public {
        require(msg.sender == WITHDRAW_ADDRESS, "Only withdraw address can withdraw");
        uint256 balance = address(this).balance;
        payable(WITHDRAW_ADDRESS).transfer(balance);
        emit Withdrawn(WITHDRAW_ADDRESS, balance);
    }
} 