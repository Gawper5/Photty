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
            
            if (currentURL === "/upload") {
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
            else if (currentURL === "/edit") {
                if(!image) return loadContent('upload');
                let canvas = document.getElementById("photo");
                let ctx = canvas.getContext("2d");
                let img = new Image;
                img.onload = function() {
                    let w = img.naturalWidth;
                    let h = img.naturalHeight;
                    if (w <= window.innerWidth - 50) {
                        if (h <= (window.innerHeight - 50) * 0.5) {
                            canvas.width = w;
                            canvas.height = h;
                        }
                        else {
                            canvas.height = (window.innerHeight - 50) * 0.5;
                            let heightScale = canvas.height / h;
                            canvas.width = w * heightScale;
                        }
                    }
                    else {
                        if (h <= (window.innerHeight - 50) * 0.5) {
                            canvas.width = window.innerWidth - 50;
                            let widthScale = canvas.width / w;
                            canvas.height = h * widthScale;
                        }
                        else {
                            let widthScale = (window.innerWidth - 50) / w;
                            let heightScale = ((window.innerHeight - 50) * 0.5) / h;
                            if (widthScale < heightScale) {
                                canvas.width = window.innerWidth - 50;
                                canvas.height = h * widthScale;
                            } else {
                                canvas.height = (window.innerHeight - 50) * 0.5;
                                canvas.width = w * heightScale;
                            }
                        }
                    }
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                }
                if (image)
                    img.src = URL.createObjectURL(image);
            }
        }
    };
    xhttp.open("GET", page + ".html", true);
    xhttp.send();
}