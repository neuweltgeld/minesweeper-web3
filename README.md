# Minesweeper Web3

A classic Minesweeper game with Web3 integration. Built on Ethereum blockchain, featuring purchasable game rights and a leaderboard system.

## 🎮 Features

- Classic Minesweeper gameplay experience
- Web3 integration (Ethereum)
- Purchasable game rights system
- Leaderboard
- Real-time score tracking
- Responsive design
- Pixel art style interface

## 🛠️ Technologies

- Next.js
- TypeScript
- Tailwind CSS
- Wagmi
- RainbowKit
- Ethers.js
- MongoDB
- Solidity

## 🚀 Installation

1. Clone the repository:
```bash
git clone https://github.com/neuweltgeld/minesweeper-web3.git
cd minesweeper-web3
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address
MONGODB_URI=your_mongodb_uri
```

4. Start the development server:
```bash
npm run dev
```

## 📝 Game Rules

- Each player has 10 free games per day
- Additional game rights can be purchased for 0.001 ETH
- Game is played on a 10x10 board
- There are 20 mines
- Game duration is 120 seconds
- Left click to reveal cells
- Right click to flag mines
- Win by flagging all mines and revealing other cells
- Clicking a mine ends the game

## 🏆 Scoring System

- Score is calculated based on revealed cells and remaining time
- Faster completion yields higher scores
- Highest scores are displayed on the leaderboard

## 🔒 Security

- All transactions are securely executed on the blockchain
- Game rights and scores are stored in a decentralized manner
- User wallets are securely connected

## 🤝 Contributing

1. Fork this repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Developer

- [Neuweltgeld](https://github.com/neuweltgeld)

## 🙏 Acknowledgments

- All users who play the game and provide feedback
- The Web3 community
- The open-source community 