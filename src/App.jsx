import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";
import MidddleFingerContract from "./constants/MiddleFinger.json";
import { contractAddress } from "./constants";
import { timeSinceLastMiddleFinger } from "./utils";

export default function App() {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [middleFingers, setMiddleFingers] = useState([]);
  const [middleFingerMessage, setMiddleFingerMessage] = useState("");
  const [cooldownTime, setCooldownTime] = useState();
  const [middleFingerContract, setMiddleFingerContract] = useState(null);
  const contractABI = MidddleFingerContract.abi;

  async function checkIfWalletIsConnected() {
    if (!window.ethereum) {
      alert("No metamask");
      console.log("Make sure you have metamask!");
      return;
    } else {
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      if (!!accounts.length) {
        setCurrentAccount(accounts[0]);
      } else {
        console.log("No authorized account found");
      }
    }
  }

  async function connectWallet() {
    try {
      if (!window.ethereum) {
        return;
      } else {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setCurrentAccount(accounts[0] || null);
      }
    } catch (err) {
      console.log("connectWallet err", err);
    }
  }

  async function giveMiddleFinger() {
    try {
      if (window.ethereum && middleFingerContract) {
        const middleFingerTxn = await middleFingerContract.giveMiddleFinger(
          middleFingerMessage,
          { gasLimit: 300000 }
        );
      }
    } catch (err) {
      console.log("giveMiddleFinger err:", err);
    }
  }

  async function getAllMiddleFingers() {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const middleFingerContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        const middleFingers = await middleFingerContract.getAllMiddleFingers();
        if (!!middleFingers.length) {
          const orderedMiddleFingers = middleFingers
            .map((middleFinger) => ({
              address: middleFinger.giver,
              timestamp: new Date(middleFinger.timestamp * 1000),
              message: middleFinger.message,
            }))
            .reverse();
          setMiddleFingers(orderedMiddleFingers);
        }
      }
    } catch (err) {
      console.log("getAllMiddleFingers err:", err);
      console.log(JSON.stringify({ err }));
    }
  }

  function handleMiddleFingerMessage(event) {
    setMiddleFingerMessage(event.target.value);
  }

  function onNewMiddleFinger(from, timestamp, message) {
    setMiddleFingerMessage("");
    setMiddleFingers((prevState) => [
      {
        address: from,
        timestamp: new Date(timestamp * 1000),
        message,
      },
      ...prevState,
    ]);
  }

  useEffect(() => {
    checkIfWalletIsConnected();

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const middleFingerContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      setMiddleFingerContract(middleFingerContract);
      middleFingerContract.on("NewMiddleFinger", onNewMiddleFinger);
      return () => {
        if (middleFingerContract) {
          middleFingerContract.off("NewMiddleFinger", onNewMiddleFinger);
        }
      };
    }
  }, []);

  useEffect(() => {
    if (!!middleFingers.length) {
      const lastMiddleFinger = middleFingers[0];
      const remainingMinutes = timeSinceLastMiddleFinger(
        lastMiddleFinger.timestamp
      );
      setCooldownTime(remainingMinutes);
      let timer;
      clearTimeout(timer);
      timer = setTimeout(() => setCooldownTime(0), remainingMinutes * 60000);
    }
  }, [middleFingers]);

  useEffect(() => {
    if (middleFingerContract) getAllMiddleFingers();
  }, [middleFingerContract]);

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">🖕🏻🎁 Welcome to the Middle Finger Giver!</div>

        <div className="bio">
          This is a place where you can give middle fingers at me if you had a
          bad day. Come on, feel better by giving me the middle finger, you can
          even get ETH by doin' it!
        </div>

        <div className="middleFingerInputContainer">
          <label>Enter your middle finger message:</label>
          <input
            onChange={handleMiddleFingerMessage}
            value={middleFingerMessage}
          />
        </div>

        {cooldownTime && cooldownTime < 16 ? (
          <div className="unable" disabled>
            You have to wait {cooldownTime} minute(s) to give me the middle
            finger again!
          </div>
        ) : (
          <button
            className="middleFingerButton"
            onClick={giveMiddleFinger}
            disabled={!middleFingerMessage}
          >
            Give me the middle finger!
          </button>
        )}
        {!currentAccount && (
          <button
            className="middleFingerButton connectWallet"
            onClick={connectWallet}
          >
            Connect Wallet
          </button>
        )}
        {middleFingers.map((middleFinger, index) => {
          return (
            <div
              key={index}
              style={{
                backgroundColor: "OldLace",
                marginTop: "16px",
                padding: "8px",
              }}
            >
              <div>Address: {middleFinger.address}</div>
              <div>Time: {middleFinger.timestamp.toString()}</div>
              <div>Message: {middleFinger.message}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
