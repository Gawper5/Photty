let currentURL = window.location.pathname;
let errorDisplay = document.getElementById('errorDisplay');;
let image;

function validate(){
    if (image) {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedTypes.includes(image.type)) {
            displayError("Only images are allowed.");
            return;
        }
        clearError();
        loadContent('edit');
    }
}

function displayError(message) {
    errorDisplay.textContent = message;
}

function clearError() {
    errorDisplay.textContent = '';
}

function loadContent(page) {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            document.getElementById("content").innerHTML = this.responseText;
            history.pushState({page: page}, "", page);
            currentURL = window.location.pathname;
            
            if (currentURL.includes("/upload")) {
                let dropzone = document.getElementById('dropzone');
            
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
                    if (e.dataTransfer.files.length > 1)
                        image = e.dataTransfer.files[e.dataTransfer.files.length - 1];
                    else 
                        image = e.dataTransfer.files[0];
                    validate();
                });
            
                let inputElement = document.getElementById("files");
                inputElement.addEventListener("change", () => {
                    image = inputElement.files[0];
                    validate();
                });
            }
            else if (currentURL.includes("/edit")) {
                let canvas = document.getElementById("photo");
                let ctx = canvas.getContext("2d");
                let img = new Image;
                img.onload = function() {
                    canvas.height = window.innerHeight - 50
                    canvas.width = canvas.height * 0.875
                    if(window.innerWidth - 50 < canvas.width) {
                        canvas.width = window.innerWidth - 50
                        canvas.height = canvas.width * 1.143
                    }
                    let w = img.naturalWidth;
                    let h = img.naturalHeight;
                    canvas.height = 500;
                    canvas.width = 500;
                    ctx.drawImage(img, 0, 0, 500, 500);
                }
                if (image)
                    img.src = URL.createObjectURL(image);
            }
        }
    };
    xhttp.open("GET", page + ".html", true);
    xhttp.send();
}