
const droparea = document.querySelector(".droparea");
const submitButton = document.getElementById("submit-button");
const clearButton = document.getElementById("clear-button");
const classname = document.getElementById("class-name");

const files = [];
const types = [];

// create the container object
var container = document.getElementById("container");

droparea.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    droparea.classList.add("hover");
});

droparea.addEventListener("dragleave", () => {
    e.preventDefault();
    e.stopPropagation();
    droparea.classList.remove("hover");
});

droparea.addEventListener("drop", (e) => {
    e.preventDefault();

    const droppedFiles = e.dataTransfer.files;
    for (let i = 0; i < droppedFiles.length; i++) {
        files.push(droppedFiles[i]);
    }
    for (let i = 0; i < files.length; i++) {
        types[i] = files[i].type;
    }
    for (let i = 0; i < types.length; i++) {
        if (types[i] != "application/pdf") {
            droparea.setAttribute("class", "droparea invalid");
            droparea.innerText = "Invalid file format";
            return false;
        }
    }
    droparea.setAttribute("class", "droparea valid");
    let s = files[0].name;
    if (files.length != 1) {
        for (let i = 1; i < files.length - 1; i++) {
            s = s + ", " + files[i].name;
        }
        s = s + " and " + files[files.length - 1].name;
    }
    
    droparea.innerText = "Added " + s;
});

submitButton.addEventListener("click", () => {

    async function readFileAsTypedArray(file) {
        const blob = new Blob([file], {type: 'application/pdf'});
        // Create a new FileReader object
        let reader = new FileReader();
      
        // Read the file as an ArrayBuffer
        reader.readAsArrayBuffer(file);
      
        // Wait for the file to be fully read
        await new Promise(resolve => reader.onloadend = resolve);
      
        // Convert the ArrayBuffer to a typed array
        let typedArray = new Uint8Array(reader.result);
      
        return typedArray;
    }


    for (var ctr = 0; ctr < files.length; ctr++) {
        let noInfo = " --- No info --- ";
        let array1 = [files[ctr].name.split(".")[0], "Late Work", "Plus Minus Grading", "Cumulative Final", "Course Websites"];
        let array2 = ["", noInfo, "No", noInfo, noInfo];

        async function getFinalString() {
            let typedArray = await readFileAsTypedArray(files[ctr]);
            //pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.2.146/build/pdf.min.js';

            var pdf = await pdfjsLib.getDocument(typedArray).promise;
            var totalPages = pdf.numPages;
            var fullText = "";
            for (let i = 1; i <= totalPages; i++) {
                var page = await pdf.getPage(i);
                var textContent = await page.getTextContent();
                var textItems = textContent.items;
                var line = 0;
                for (var j = 0; j < textItems.length; j++) {
                    if (line != textItems[j].transform[5]) {
                        if (line != 0) {
                            fullText +='\r\n';
                        }
                        line = textItems[j].transform[5]
                    }                     
                    var item = textItems[j];
                    fullText += item.str;
                }
            }
            return fullText.trim();
        }
                
        getFinalString().then((syllabus) => {

            var className = syllabus.match(/[A-Z]{2,4}\s*\d{3}/);
            if (className != null) {
                array1[0] = className[0];
            }

            syllabus = syllabus.trim().toLowerCase();
            syllabus = syllabus.replace(/\s+/g, ' ');
            syllabus = syllabus.replace(/[\r\n]+/g, '');

            // Split the text into an array of sentences
            const sentences = syllabus.match(/[^\.!\?]+[\.!\?]+/g);
            for (var k = 0; k < sentences.length; k++) {
                sentences[k] = sentences[k].split('\r\n').join(' ');
                if (sentences[k].includes(" late ") || sentences[k].includes(" deadline ")) {
                    array2[1] = array2[1].replace(noInfo, "");
                    array2[1] += sentences[k];
                }
                if (sentences[k].includes("+")) {
                    array2[2] = "Yes";
                }
                if (sentences[k].includes(" cumulative")) {
                    array2[3] = array2[3].replace(noInfo, "");
                    array2[3] += sentences[k];
                }
            }

            if (syllabus.includes(" canvas ")) {
                array2[4] = array2[4].replace(noInfo, "");
                array2[4] += " Canvas";
            }
            if (syllabus.includes(" moodle ")) {
                array2[4] = array2[4].replace(noInfo, "");
                array2[4] += " Moodle";
            }
            if (syllabus.includes("capa ")) {
                array2[4] = array2[4].replace(noInfo, "");
                array2[4] += " Lon-Capa";
            }

            let table = document.createElement("table");
            table.style.margin = "100px";
            for (let i = 0; i < 5; i++) {
                // Create a new row
                let row = table.insertRow();
            
                // Create two new cells
                let cell1 = row.insertCell();
                let cell2 = row.insertCell();

                cell1.style.border = '1px solid white';
                cell2.style.border = '1px solid white';
                cell1.style.padding = "10px";
                cell2.style.padding = "10px";

                // Fill the cells with the corresponding strings from the arrays
                cell1.innerHTML = array1[i];
                cell2.innerHTML = array2[i];
            }
            
            // Append the table to the body of the HTML document
            document.body.appendChild(table);
        });
    }
});

clearButton.addEventListener("click", () => {
    files.length = 0;
    console.clear();
    droparea.classList.remove("valid");
    droparea.classList.remove("invalid");
    droparea.innerText = "Cleared";
    let tables = document.querySelectorAll("table");
    for (let table of tables) {
        table.remove();
    }
});