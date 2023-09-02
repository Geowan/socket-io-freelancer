const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const https = require('https');

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

let countdown = null;

let arrayData = [];
let arrayPosition = 0;
let interval = null;
let htmlContent = null;

const initData = async () => {
    io.sockets.emit('loadingData');
    const apiUrl = 'https://www.ozgurdua.com/wp-content/uploads/2023/05/dua-1.txt';
    https.get(apiUrl, (response) => {
        let data = '';

        // Handle incoming data chunks
        response.on('data', (chunk) => {
            data += chunk;
        });

        // Handle the end of the response
        response.on('end', () => {
            try {


                //transform the extracted array
                const extractedSections = [];
                const regex = /\[start\]\[(\d+)\](.*?)\[end\]/gs;

                let matches;
                while ((matches = regex.exec(data)) !== null) {
                    const sectionNumber = matches[1]; // Extract the section number
                    const sectionContent = matches[2].trim().replace(/\n/g, '<br/>'); // Extract and replace line breaks
                    extractedSections.push({ sectionNumber, sectionContent });
                }

                arrayData = extractedSections;


                //load the first item
                loadHtmlSection();

            } catch (error) {
                console.error('Error parsing JSON:', error.message);
            }
        });
    }).on('error', (error) => {
        console.error('Error making the request:', error.message);
    });
}
initData();

const loadHtmlSection = () => {
    if (interval) {
        clearInterval(interval);
    }

    //make sure there is data in the array
    if (arrayData.length === 0) {
        return;
    }

    //load data item from the array of items fetched from txt file
    const dataItem = arrayData[arrayPosition];

    countdown = dataItem.sectionNumber;

    htmlContent = dataItem.sectionContent;
    io.sockets.emit('htmlContent', { content: htmlContent });

    //change the array position to the next inorder to load the next item in the array for the next iteration
    if (arrayData.length - 1  === arrayPosition) {
        arrayPosition = 0;
    } else {
        arrayPosition++;
    }

    setTimer();
}





const setTimer = () => {
    if (!countdown || countdown === 0) {
        return;
    }
    interval = setInterval(function () {
        if (countdown <= 0) {
           

            if (interval) {

                //clear interval and load new html section for the data
                clearInterval(interval);
                loadHtmlSection();
            }
            return;
        };
        countdown = countdown - 1;

        io.sockets.emit('timer', { countdown: countdown });
    }, 1000)
}


io.on('connection', (socket) => {
    console.log('a user connected');
    socket.emit('htmlContent', { content: htmlContent })

    socket.on('disconnect', function () {
        console.log("on disconnection ffrom the socket");
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});