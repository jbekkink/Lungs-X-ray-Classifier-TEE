const delay = ms => new Promise(res => setTimeout(res, ms));

//Create a div with relevant information about the related deal
async function addResultBox(iexec, deal, new_block) {
    const result_box = document.createElement('div');
    const deal_id_label = document.createElement('p');
    const time_label = document.createElement('p');
    const name_label = document.createElement('p')
    const app_name = document.createElement('p');
    const dealid = document.createElement('p');
    const timeStamp = document.createElement('p');
    const resultsDownloadButton = document.createElement('button');
    
    result_box.classList.add('result-box');
    name_label.classList.add('label');
    deal_id_label.classList.add('label');
    time_label.classList.add('label');

    name_label.innerHTML = 'App Name:'
    deal_id_label.innerHTML = 'Deal ID:';
    time_label.innerHTML = 'Date:';
    const appAddress = deal.app.pointer;
    const res = await iexec.app.showApp(appAddress);
    app_name.innerHTML = res.app.appName;
    
    const deal_id = deal.dealid;
    dealid.innerHTML = deal_id;
    if(new_block) { //For creating a new block the 'deal' object does not contain a blockTimestamp parameter yet, so for now using this method to obtain the blockTimestamp...(maybe there is a easier way idk)
      const show_deals = await iexec.deal.fetchRequesterDeals(deal.requester);
      const timestamp = show_deals.deals[0].blockTimestamp;
      timeStamp.innerHTML = new Date(timestamp);
      resultsDownloadButton.disabled = 'true';
    }
    else {
      timeStamp.innerHTML = new Date(deal.blockTimestamp);
    }
    resultsDownloadButton.innerHTML = "Download Result";

    resultsDownloadButton.addEventListener("click", function() {
      downloadResults(iexec, deal_id, resultsDownloadButton)();
    });

    result_box.appendChild(name_label);
    result_box.appendChild(app_name);
    result_box.appendChild(deal_id_label);
    result_box.appendChild(dealid);
    result_box.appendChild(time_label);
    result_box.appendChild(timeStamp);
    result_box.appendChild(resultsDownloadButton);

    return result_box;
}

const showPreviousDeals = (iexec) => async () => {
  try {
    const userAddress = await iexec.wallet.getAddress();
    const deals = await iexec.deal.fetchRequesterDeals(userAddress, {appAddress:"0x3576a5396ffda70978b4ed4c053f478c474a159b"}); //Fetch deals only for this app address
    return deals;
  } catch (error) {
      alert(error);
  } 
};

async function displayPreviousDeals(iexec) {
  const results = document.querySelector('.results');
  const results_display = document.createElement('div');
  results_display.classList.add('display-results');
  const deals = await showPreviousDeals(iexec)();

  if(deals.count == 0) {
    results.appendChild(results_display);
  }
  else {
    let max = 4;
    if (deals.count < max) max = deals.count;
    else max = 4;
    for(let i = 0; i < max; i++) { //Display only 4 most recent results (for now)
      const result_box = await addResultBox(iexec, deals.deals[i], false);
      results_display.appendChild(result_box);
    } 
    results.appendChild(results_display);
  }
}

async function addNewResult(iexec, deal) {
  const results = document.querySelector('.results');
  const results_display = document.createElement('div');
  results_display.classList.add('display-results');
  results.appendChild(results_display);
  const result = await addResultBox(iexec, deal, true);
  result.style.boxShadow = "0 1px 15px rgba(255, 230, 0, 0.651)";
  if(results_display.childElementCount == 0) {
    results_display.appendChild(result);
    return;
  }
  else if(results_display.childElementCount == 4) {
    results_display.removeChild(results_display.lastChild);
  }
  results_display.prepend(result);
}

const downloadResults = (iexec, deal_id) => async () => {
  try {
    const deal = await iexec.deal.show(deal_id);
    const taskid = deal.tasks["0"];
    console.log('Downloading results...');
    const res = await iexec.task.fetchResults(taskid);
    const file = await res.blob();
    const fileName = `${taskid}.zip`;
    if (window.navigator.msSaveOrOpenBlob)
      window.navigator.msSaveOrOpenBlob(file, fileName);
    else {
      const a = document.createElement("a");
      const url = URL.createObjectURL(file);
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 0);
    }
  } catch (error) {
    alert(error);
  }
};

//Use  delay function while waiting for the execution to finish
async function enableDownloadButton(iexec, deal) {
  const download_button = document.querySelector('.result-box:first-child button');
  let finished = false;
  await delay(30000);
  
  while(!finished) {
    const taskid = deal.tasks["0"];
    const refresh_deal = await iexec.task.show(taskid);
    if(refresh_deal.status == 3) {
      finished = true; 
      download_button.disabled = false;
    }
    if(refresh_deal.status == 2) {
      await delay(5000)
    }
    else {
      await delay(10000);
    }
  }
}

function spawnProgressBar() {
    const div = document.getElementById('myProgress');
    const status = document.createElement('h2');
    const bar = document.createElement('div');
    bar.classList.add('lds-dual-ring');
    status.innerHTML = 'Uploading Image...';
    div.appendChild(bar);
    div.appendChild(status);
}

function deleteProgressBar() {
    div = document.getElementById('myProgress');
    div.innerHTML = "";
}

function updateProgressBar(status_text) {
    const status = document.querySelector('#myProgress h2');
    status.innerHTML = status_text;
}

export {spawnProgressBar, updateProgressBar, showPreviousDeals, displayPreviousDeals, addNewResult, enableDownloadButton, downloadResults, deleteProgressBar};
