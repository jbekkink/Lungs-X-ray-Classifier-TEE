import axios from 'axios';

const refreshUser = (iexec) => async () => {
    const userAddress = await iexec.wallet.getAddress();
    const [wallet, account] = await Promise.all([iexec.wallet.checkBalances(userAddress),
      iexec.account.checkBalance(userAddress)]);
  };

const generateDatasetKey = (iexec) => () => {
    try {
      const key = iexec.dataset.generateEncryptionKey();
      return key;
    } catch (error) {
      alert(error);
    }
};

const encryptDataset = (iexec, file) => async () => {
    try {
      if (!file) {
        throw Error("No file selected");
      }
      const filename = file.name;

      const fileBytes = await new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.readAsArrayBuffer(file);
        fileReader.onload = (e) => resolve(e.target.result);
        fileReader.onerror = () =>
          reject(Error(`Failed to read file: ${fileReader.error}`));
        fileReader.onabort = () => reject(Error(`Failed to read file: aborted`));
      });
  
      const key = generateDatasetKey(iexec)();
      const encrypted = await iexec.dataset.encrypt(fileBytes, key);
      const checksum = await iexec.dataset.computeEncryptedFileChecksum(encrypted);
      
      var data = new FormData();
      data.append('file', new Blob([encrypted]));
      var config = {
        method: 'post',
        url: 'https://api.pinata.cloud/pinning/pinFileToIPFS',
        headers: { 
          //ADD YOUR BEARER TOKEN BELOW
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI0ZGM4YzhkZS1hMTQ4LTRlMzEtYWI0Ni1jN2ZhOTExY2MwZGMiLCJlbWFpbCI6ImpvZXlqb2V5YjA5QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImlkIjoiRlJBMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiIwMDkwNjY0OGVmODY0YmFmZjlmMCIsInNjb3BlZEtleVNlY3JldCI6Ijc2NDZkZmE5MzQ2YzY4Y2EyNjQ1NzUyYjRiNjBmYTkxYmU4ZTM4NTgxYWU2NzliY2Y5MDM4ZTU5MDgxYjM0ZjIiLCJpYXQiOjE2NTY1NzM5MDV9.dFuNAiO-YmrNZIC5qW-ksMt6xPJPwYa1NYzNQ9Mc8eA'
        },
        data : data
      };

      const res = await axios(config);
      console.log(res);
      const cid = res.data.IpfsHash;
      const multiaddr=`/ipfs/${cid}`;
      const ipfs_url = `https://gateway.pinata.cloud${multiaddr}`+ '?filename=' + filename + '.enc';
      console.log(ipfs_url);
      await fetch(ipfs_url).then((res) => {
        if (!res.ok) {
          throw Error(`Failed to load uploaded file at ${ipfs_url}`);
        }
      });
      
      return [filename, multiaddr, checksum, key];
    } catch (error) {
      alert(error)
    }
};

const deployDataset = (iexec, filename, input_multiaddr, input_checksum) => async () => {
  try {
    const owner = await iexec.wallet.getAddress();
    const name = filename;
    const multiaddr = input_multiaddr;
    const checksum = input_checksum;
    const { address } = await iexec.dataset.deployDataset({
      owner,
      name,
      multiaddr,
      checksum
    });
    console.log(`Dataset deployed at address ${address}`);
    refreshUser(iexec)();
    return address; 
  } catch (error) {
    alert(error);
  }
};

const pushSecret = (iexec, address, input_key) => async () => {
    try {
      const datasetAddress = address;
      const key = input_key;
      await iexec.dataset.pushDatasetSecret(datasetAddress, key);
      console.log(`Encryption key pushed for datastet ${datasetAddress}`);
      const orderHash = await publishOrder(iexec, datasetAddress)();
      return orderHash;
    } catch (error) {
      alert(error);
    }
  };

const publishOrder = (iexec, datasetAddress) => async () => {
    try {

      const dataset = datasetAddress;
      const datasetprice = 0; 
      const volume = 1;
      const apprestrict = "0x3576a5396ffda70978b4ed4c053f478c474a159b";
      const tag = "tee";
      const signedOrder = await iexec.order.signDatasetorder(
        await iexec.order.createDatasetorder({dataset, datasetprice, volume, apprestrict, tag}));
      const orderHash = await iexec.order.publishDatasetorder(signedOrder);
      console.log(`Order published with hash ${orderHash}`);
      return orderHash; 
    } catch (error) {
      alert(error);
    }
};

export {refreshUser, encryptDataset, deployDataset, pushSecret}