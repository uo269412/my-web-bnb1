import React from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import detectEthereumProvider from "@metamask/detect-provider";
import { Contract, ethers } from "ethers";
import { useState, useEffect, useRef } from 'react';
import myContractManifest from "./contracts/MyContract.json";
import { decodeError } from 'ethers-decode-error'

function App() {
  const myContract = useRef(null);
  const [tikets, setTikets] = useState([]);
  const [newAdmin, setNewAdmin] = useState('');
  const [contractBalance, setContractBalance] = useState(0);
  const [currentBalanceWei, setBalanceWei] = useState(0);
  const [userBalance, setUserBalance] = useState(0);
  const [bnbAmount, setBnbAmount] = useState(0);


  const submitMyForm = async (e) => {
    e.preventDefault();
    const newValue = e.target.elements[0].value;
    const tx = await myContract.current.transferAdmin(newValue);
    await tx.wait();
    setNewAdmin(newAdmin);
  };
  


  useEffect(() => {
    initContracts();
    updateUserBalance();
  }, [])


  let initContracts = async () => {
    await configureBlockchain();
    let tiketsFromBlockchain = await myContract.current?.getTikets();
    if (tiketsFromBlockchain != null)
      setTikets(tiketsFromBlockchain)
  }

  let configureBlockchain = async () => {
    try {
      let provider = await detectEthereumProvider();
      if (provider) {
        await provider.request({ method: 'eth_requestAccounts' });
        const networkId = await provider.request({ method: 'net_version' })

        provider = new ethers.providers.Web3Provider(provider);
        const signer = provider.getSigner();

        myContract.current = new Contract(
          myContractManifest.networks[networkId].address,
          myContractManifest.abi,
          signer
        );

      }
    } catch (error) { }
  }

  let clickBuyTiket = async (i) => {
    const tx = await myContract.current.buyTiket(i,  {
      value: ethers.utils.parseEther(bnbAmount.toString()),
      gasLimit: 6721975,
      gasPrice: 20000000000,
  });

    try{
      await tx.wait()
    } catch (error) { 
      const errorDecoded  = decodeError(error)
      alert('Revert reason:', errorDecoded.error)
    }

    const tiketsUpdated = await myContract.current.getTikets();
    setTikets(tiketsUpdated);
}

let withdrawBalance = async () => {
    myContract.current.isTicketAvailable().then(
      (result) => { },
      (error) => { alert(error.data.message)}
  );
}

const updateUserBalance = async () => {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const userAddress = await signer.getAddress();
  const balance = await provider.getBalance(userAddress);
  setUserBalance(balance.toString()); 
};

let updateContractBalance = async () => {
  const contractBalanceWei = await myContract.current.getContractBalance();
  const balanceWeiFromContract = await myContract.current.getBalanceWei();
  setContractBalance(contractBalanceWei.toString());
  setBalanceWei(balanceWeiFromContract.toString());
  
};

  return (
    <div>
        <h1>Tikets store</h1>
        <h4>Balance real: {contractBalance} wei</h4>
        <h4>Balance wei: {currentBalanceWei} wei</h4>
        <h4>Wallet del usuario: {userBalance} wei</h4>
        <button onClick={() => updateContractBalance()}>Obtener Balance</button>
        <h4>Traspaso de admin</h4>
          <form className="form-inline" onSubmit={ (e) => submitMyForm(e)}>
            <input type="text" />
            <button type="submit">Transferir Admin</button>
          </form>
          <h4>Introducir BNB</h4>
          <input
          type="number"
          step="0.01" // Permitir incrementos de 0.01 BNB
          min="0.01" // Valor mínimo permitido
          placeholder="Cantidad de BNB"
          value={bnbAmount}
          onChange={(e) => setBnbAmount(e.target.value)}
        />
                  <button onClick={() => withdrawBalance()}>Withdraw Balance</button>
        <ul>
            { tikets.map( (address, i) =>
                <li>Tiket { i } comprado por { address }
                    { address == ethers.constants.AddressZero && 
                        <a href="#" onClick={()=>clickBuyTiket(i)}> buy</a> }
                </li>
            )}
        </ul>
    </div>

)

}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);