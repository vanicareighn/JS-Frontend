import { useState, useEffect } from "react";
import { ethers } from "ethers";
import atm_abi from "../artifacts/contracts/Assessment.sol/Assessment.json";

export default function HomePage() {
  const [ethWallet, setEthWallet] = useState(undefined);
  const [account, setAccount] = useState(undefined);
  const [atm, setATM] = useState(undefined);
  const [balance, setBalance] = useState(undefined);
  const [showAddress, setShowAddress] = useState(true);
  const [amount, setAmount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const atmABI = atm_abi.abi;

  const getWallet = async () => {
    if (window.ethereum) {
      setEthWallet(window.ethereum);
    }

    if (ethWallet) {
      const accounts = await ethWallet.request({ method: "eth_accounts" });
      handleAccount(accounts);
    }
  };

  const handleAccount = (accounts) => {
    if (accounts && accounts.length > 0) {
      console.log("Account connected: ", accounts[0]);
      setAccount(accounts[0]);
    } else {
      console.log("No account found");
    }
  };

  const connectAccount = async () => {
    if (!ethWallet) {
      alert("MetaMask wallet is required to connect");
      return;
    }

    const accounts = await ethWallet.request({ method: "eth_requestAccounts" });
    handleAccount(accounts);

    getATMContract();
  };

  const getATMContract = () => {
    const provider = new ethers.providers.Web3Provider(ethWallet);
    const signer = provider.getSigner();
    const atmContract = new ethers.Contract(contractAddress, atmABI, signer);

    setATM(atmContract);
  };

  const getBalance = async () => {
    if (atm) {
      setBalance((await atm.getBalance()).toNumber());
    }
  };

  const deposit = async () => {
    if (atm && amount) {
      const depositAmount = parseInt(amount);
      if (depositAmount > 0 && depositAmount <= 10) {
        let tx = await atm.deposit(depositAmount, { value: ethers.utils.parseEther(amount) });
        await tx.wait();
        setBalance(balance + depositAmount);
        setShowError(false);
      } else {
        setErrorMessage("You can only deposit up to 10 Tokens only");
        setShowError(true);
      }
    }
  };

  const withdraw = async () => {
    if (atm && amount) {
      const withdrawAmount = parseInt(amount);
      if (withdrawAmount > 0 && withdrawAmount <= balance) {
        let tx = await atm.withdraw(withdrawAmount);
        await tx.wait();
        setBalance(balance - withdrawAmount);
        setShowError(false);
      } else {
        setErrorMessage("You can only withdraw up to 10 Tokens only");
        setShowError(true);
      }
    }
  };

  const transfer = async () => {
    if (atm) {
      if (!transferAmount && !recipient) {
        setErrorMessage("Please enter a value first");
        setShowError(true);
        return;
      }
  
      if (!transferAmount) {
        setErrorMessage("Please enter an amount of up to 10 tokens");
        setShowError(true);
        return;
      }
  
      if (!recipient) {
        setErrorMessage("Please enter a valid address (e.g., 0x5FbDB2315678afecb367f032d93F642f64180aa3)");
        setShowError(true);
        return;
      }
  
      const amountToTransfer = parseInt(transferAmount);
      if (amountToTransfer > 0 && amountToTransfer <= 10 && ethers.utils.isAddress(recipient)) {
        try {
          let tx = await atm.transfer(recipient, amountToTransfer);
          await tx.wait();
          setBalance(balance - amountToTransfer);
          setShowError(false);
        } catch (error) {
          setErrorMessage("Transfer failed");
          setShowError(true);
        }
      } else {
        setErrorMessage("Please enter a valid recipient address and amount");
        setShowError(true);
      }
    }
  };  

  const toggleAddressVisibility = () => {
    setShowAddress(!showAddress);
  };

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
  };

  const handleTransferAmountChange = (e) => {
    setTransferAmount(e.target.value);
  };

  const handleRecipientChange = (e) => {
    setRecipient(e.target.value);
  };

  const initUser = () => {
    if (!ethWallet) {
      return <p>Please install MetaMask in order to use this wallet.</p>;
    }

    if (!account) {
      return <button onClick={connectAccount}>Open Wallet</button>;
    }

    if (balance === undefined) {
      getBalance();
    }

    return (
      <div className="wallet-container">
        <button onClick={toggleAddressVisibility}>Show or Hide my Address</button>
        {showAddress && <p>My Current Address: {account}</p>}
        <p>Current Balance: {balance}</p>
        <div className="buttons-container">
          <input type="number" value={amount} onChange={handleAmountChange} placeholder="Enter amount" min="1" max="10" />
          <button onClick={deposit}>Deposit</button>
          <button onClick={withdraw}>Withdraw</button>
          <input type="number" value={transferAmount} onChange={handleTransferAmountChange} placeholder="Enter transfer amount" min="1" max="10" />
          <input type="text" value={recipient} onChange={handleRecipientChange} placeholder="Enter recipient address" />
          <button onClick={transfer}>Transfer</button>
        </div>
        {showError && <div className="error-message">{errorMessage}</div>}
      </div>
    );
  };

  useEffect(() => {
    getWallet();
  }, []);

  return (
    <main className="container">
      <header>
        <h1>MetaMask Wallet</h1>
      </header>
      {initUser()}
      <style jsx>{`
        .container {
          text-align: center;
          padding: 20px;
        }
        .wallet-container {
          border: 1px solid #ccc;
          padding: 20px;
          border-radius: 10px;
          background-color: #f9f9f9;
          text-align: center;
          margin-top: 20px;
          width: 300px;
          position: relative;
        }
        .buttons-container {
          margin-top: 20px;
        }
        .buttons-container button {
          margin: 5px;
        }
        .error-message {
          color: red;
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          background-color: #fff;
          padding: 5px 10px;
          border: 1px solid red;
          border-radius: 5px;
        }
      `}</style>
    </main>
  );
}