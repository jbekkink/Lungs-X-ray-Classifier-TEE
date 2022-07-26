import { IExec } from "iexec";
import {spawnProgressBar, updateProgressBar, displayPreviousDeals, addNewResult, enableDownloadButton, deleteProgressBar} from './tools';
import {refreshUser, encryptDataset, deployDataset, pushSecret} from './encryption'
const networkOutput = document.getElementById("network-output");
const myForm = document.getElementById('myForm');
const myFile = document.getElementById('myFile'); 

const checkStorage = (iexec) => async () => {
  try {
    const isStorageInitialized = await iexec.storage.checkStorageTokenExists(
      await iexec.wallet.getAddress()
    );
    if(!isStorageInitialized) {
        alert('Please initialize your iExec storage');
        initStorage(iexec)();
    }
  } catch (error) {
    alert(error);
  }
};

const initStorage = (iexec) => async () => {
  try {
    const storageToken = await iexec.storage.defaultStorageLogin();
    await iexec.storage.pushStorageToken(storageToken, { forceUpdate: true });
    checkStorage(iexec)();
  } catch (error) {
        alert(error);
  }
};

const buyComputation = (iexec, address, orderHash) => async () => {
  try {
    updateProgressBar('Complete order...');
    const appAddress = '0x3576a5396ffda70978b4ed4c053f478c474a159b';
    const category = 0;
    const dataset = address;
    const workerpool = "0x9849e7496cdbff132c84753591d09b181c25f29a";

    const params = {"iexec_input_files": ["https://github.com/jbekkink/test_classifier/raw/main/classifier.h5"]}

    const { orders: appOrders } = await iexec.orderbook.fetchAppOrderbook(appAddress, {minTag: ['tee']});
    const appOrder = appOrders && appOrders[0] && appOrders[0].order;
    if (!appOrder) throw Error(`no apporder found for app ${appAddress}`);
    const {
      orders: workerpoolOrders
    } = await iexec.orderbook.fetchWorkerpoolOrderbook({category, workerpool, minTag:['tee']});
    console.log(appOrder);
    const workerpoolOrder =
      workerpoolOrders && workerpoolOrders[0] && workerpoolOrders[0].order;
    if (!workerpoolOrder)
      throw Error(`no workerpoolorder found for category ${category}`);
    console.log(workerpoolOrder);
    const { order, remaining } = await iexec.orderbook.fetchDatasetorder(orderHash);
    console.log(order);
    console.log(remaining);
    const userAddress = await iexec.wallet.getAddress();

    const requestOrderToSign = await iexec.order.createRequestorder({
      app: appAddress,
      appmaxprice: appOrder.appprice,
      workerpoolmaxprice: workerpoolOrder.workerpoolprice,
      requester: userAddress,
      volume: 1,
      params: params,
      category: category,
      dataset: dataset,
      trust: 1,
      tag: ['tee']
    });

    const requestOrder = await iexec.order.signRequestorder(requestOrderToSign);

    const res = await iexec.order.matchOrders({
      apporder: appOrder,
      requestorder: requestOrder,
      workerpoolorder: workerpoolOrder,
      datasetorder: order
    }); 
    updateProgressBar('Executing computation...');
    refreshUser(iexec)();
    
    const deal = await iexec.deal.show(res.dealid);
    return deal; 
  } catch (error) {
        alert(error);
  }
};

const init = async () => {
  try {
    const uploadbutton = document.querySelector('.upload form button');
    uploadbutton.disabled = true;
    let ethProvider;
    if (window.ethereum) {
      console.log("using default provider");
      ethProvider = window.ethereum;
      ethProvider.on("chainChanged", (_chainId) => window.location.reload());
      ethProvider.on("accountsChanged", (_accounts) =>
        window.location.reload()
      );
      await window.ethereum.request({
        method: "eth_requestAccounts"
      });
      window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x86",
            chainName: "Bellecour (iExec sidechain)",
            nativeCurrency: {
              name: "xRLC",
              symbol: "xRLC",
              decimals: 18
            },
            rpcUrls: ["https://bellecour.iex.ec"],
            blockExplorerUrls: ["https://blockscout-bellecour.iex.ec"]
          }
        ]
      });
    }

    const { result } = await new Promise((resolve, reject) =>
      ethProvider.sendAsync(
        {
          jsonrpc: "2.0",
          method: "net_version",
          params: []
        },
        (err, res) => {
          if (!err) resolve(res);
          reject(Error(`Failed to get network version from provider: ${err}`));
        }
      )
    );
    const networkVersion = result;

    if (networkVersion !== "134") {
      const error = `Unsupported network ${networkVersion}, please switch to Bellecour (iExec Sidechain)`;
      networkOutput.innerText = "Switch to the iExec Sidechain";
      alert(error);
      throw Error(error);
    }

    networkOutput.innerText = networkOutput.innerText = "Connected to Bellecour (iExec Sidechain)";
        
    const configArgs = { ethProvider: window.ethereum,  chainId : 134};
    const configOptions = { smsURL: 'https://v7.sms.debug-tee-services.bellecour.iex.ec' };
    const iexec = new IExec(configArgs, configOptions);

    await refreshUser(iexec)();
    await checkStorage(iexec)();    

    myForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      uploadbutton.disabled = true;
      const file = myFile.files[0];
      
      spawnProgressBar();
      updateProgressBar('Image uploaded...');

      const output = await encryptDataset(iexec, file)(); //Encrypts the dataset and uploads it to IPFS
      const address = await deployDataset(iexec, output[0], output[1], output[2])(); //Deploy the dataset on the iexec blockchain and get the address of the dataset
      const orderHash = await pushSecret(iexec, address, output[3])(); 
      
      const deal = await buyComputation(iexec, address, orderHash)();
      uploadbutton.disabled = false;
      await addNewResult(iexec, deal);
      await enableDownloadButton(iexec, deal);
      deleteProgressBar();
    });
    uploadbutton.disabled = false;
    console.log("initialized");

  } catch (e) {
    console.error(e.message);
  }
};
init();
