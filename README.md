# Xray-Classifier-Lungs TEE v1

# Dapp Address Sidechain: 
0x8326dec6de9546046de50b9fd77703ea9794f399

# DISCLAIMER: CURRENTLY ONLY WORKS ON THE PROVIDED DATASET 
Using images from the web will most likely give you false results.

Download the full (test) dataset here: https://drive.google.com/file/d/1JU4d7waBVl5RYpNZ729PtCzqLOIUtuP6/view?usp=sharing

# STEPS

1.  Create a Pinata account (free) and get your Bearer token ([https://www.pinata.cloud/](https://www.pinata.cloud/))
    
2.  Paste this token in the file encryption.js, that can be found in the directory 'js' (Line 45)

Add the token in the Authorization field and it should look something like this:
  
    var data = new FormData(); 
    data.append('file', file); 
    var config = { 
        method: 'post', 
        url: 'https://api.pinata.cloud/pinning/pinFileToIPFS',
        headers: { 
        //ADD YOUR BEARER TOKEN BELOW 
            'Authorization': 'Bearer eyJhbGciOi....' 
            }, 
        data : data };
    
4.  Save and close index.js
    
5.  Open your command line / terminal
    
6.  Run 'npm install'. This will install the necessary packages needed to run this Dapp.
    
7.  When everything is installed, the Dapp is ready for use. The Dapp can be started with running the command 'node server.js'. 

