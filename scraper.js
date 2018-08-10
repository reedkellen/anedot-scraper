//NPM MODULES
//Require the fs module
const fs = require('fs');
//Require AXIOS
const axios = require('axios');
//Require jsonexport
const jsonexport = require('jsonexport');

//GLOBAL VARIABLES
//Creating a variable for the error log's name and file path.  Will be used in the fs.appendFileSync method later.
const errorFilePath = './scraper-error.log';
//Create a variable for the CSV file name and path.
const filePathName = 'data/' + getCurrentDate() + '.csv';
//Check for a directory called 'data' and save to variable
const dataDirectory = fs.existsSync('./data');

//REQUIRED data
//Import the private data needed to access the API
const config = require('./config.js');

//GLOBAL FUNCTIONS
//Gets the current time and outputs a string containing the year/month/day, and hour/minute/seconds.
function getCurrentTime() {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const formattedDate = `[${year}/${month}/${day}, ${hours}:${minutes}:${seconds}]`;
  return formattedDate;
}

//Gets the current time and outputs a string containing the year-month-day.
function getCurrentDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const formattedDate = `${year}-${month}-${day}`;
  return formattedDate;
}

//SCRAPER SET UP
//If data exists, do nothing.  Else, create it.
if (dataDirectory) {
  console.log('"data" directory exists, Continuing...');
} else {
  //Make the directory
  fs.mkdirSync('./data');

  //Save the error to the log file.
  let dataDirectoryError = getCurrentTime() + ' - "data" directory did not exist.  Created directory.\n';
  fs.appendFileSync(errorFilePath, dataDirectoryError);
};

//If the file already exists, delete it.  If it can't be deleted, log the error.
fs.unlink(filePathName, (err) => {
  if (err) {
    let oldFileDeletionError = getCurrentTime() + ' - Trouble deleting old file.  Received this message -> ' + err.message + '\n';
    fs.appendFileSync(errorFilePath, oldFileDeletionError);
  };
});

//SEND A REQUEST TO THE ANEDOT API AND SAVE THE DATA TO A CSV
axios.get(`https://${config.userEmail}:${config.apiKey}@api.anedot.com/v2/campaigns/${config.campaignID}/donations?all=true`)
  .then(function (response) {
    const allDonorData = response.data;
    const modifiedDonorData = [];
    for ( let i = 0; i < allDonorData.length; i ++ ) {
      let donorObject = allDonorData[i];
      let modifiedDonorObject = {
        email : donorObject.email,
        fullName : donorObject.name,
        firstName : donorObject.first_name,
        lastName : donorObject.last_name,
        city : donorObject.city,
        state : donorObject.state,
        date: donorObject.date,
      };
      modifiedDonorData.push(modifiedDonorObject);
    };

    //Use jsonexport to turn the shirtsArray into a CSV file.
    jsonexport(modifiedDonorData, function(err, csv){
      if (err) {
        let jsonExportError = getCurrentTime() + ' - Trouble using jsonexport.  Received this message -> ' + err.message + '\n';
        fs.appendFileSync(errorFilePath, jsonExportError);
      };
      fs.writeFileSync(filePathName, csv, (err) => {
        if (err) {
          let csvFileWriteError = getCurrentTime() + ' - Trouble writing CSV file.  Received this message -> ' + err.message + '\n';
          fs.appendFileSync(errorFilePath, csvFileWriteError);
        };
      }); //end fs.writeFileSync
    }); //end jsonexport
    console.log('Successfully created the CSV file.');
  })
  .catch(function (error) {
    console.log(error);
  });
