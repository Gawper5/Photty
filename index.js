let dropzone = document.getElementById('dropzone');
let errorDisplay = document.getElementById('errorDisplay');
let image;

window.addEventListener("load", () => {
    let currentURL = window.location.pathname;
    
    if(currentURL.includes("/upload")) {
        dropzone = document.getElementById('dropzone');
        errorDisplay = document.getElementById('errorDisplay');
    
        dropzone.addEventListener("dragover", (e) => {
            e.preventDefault();
            dropzone.classList.remove("dragleave");
            dropzone.classList.add("dragover");
        });
    
        dropzone.addEventListener("dragleave", (e) => {
            e.preventDefault();
            dropzone.classList.remove("dragover");
            dropzone.classList.add("dragleave");
        });
    
        document.ondrop = e => e.preventDefault();
        document.ondragover = e => e.preventDefault();
    
        dropzone.addEventListener("drop", (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove("dragover");
            dropzone.classList.add("dragleave");
            image = e.dataTransfer.files[0];
            validate();
        });
    
        const inputElement = document.getElementById("files");
        inputElement.addEventListener("change", () => {
            image = inputElement.files[0];
            validate();
        });
    
        function validate(){
            const allowedTypes = ['image/*'];
            if (!allowedTypes.includes(image.type)) {
                displayError("Only images are allowed.");
                return;
            }
            clearError();
            console.log(image);
        }
    
        function displayError(message) {
            errorDisplay.textContent = message;
        }
    
        function clearError() {
            errorDisplay.textContent = '';
        }
    }
});

function loadContent(page) {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            document.getElementById("content").innerHTML = this.responseText;
        }
    };
    xhttp.open("GET", page + ".html", true);
    xhttp.send();
}