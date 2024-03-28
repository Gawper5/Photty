let currentURL = window.location.pathname;
let errorDisplay = document.getElementById('errorDisplay');;
let image;
const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];

function validate(){
    if (image) {
        if (!allowedTypes.includes(image.type)) {
            displayError("Only png, jpeg and jpg are allowed");
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
    if (page === "edit" && (image == null || !allowedTypes.includes(image.type))) return; 
    clearError();
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
                dropzone.onclick = () => {
                    inputElement.click();
                }
                inputElement.addEventListener("change", () => {
                    image = inputElement.files[0];
                    validate();
                });
            }
            else if (currentURL === "/edit") {
                let precanvas = document.getElementById("prephoto");
                let canvas = document.getElementById("photo");
                let prectx = precanvas.getContext("2d");
                let ctx = canvas.getContext("2d");
                let img = new Image;
                let history = Array();
                let historyIndex = 0;
                let imageData;
                let change = false;
                img.onload = function() {
                    let w = img.naturalWidth;
                    let h = img.naturalHeight;
                    let offset = window.innerWidth * 0.01;
                    let widthScale = (window.innerWidth - offset) / w;
                    let heightScale = ((window.innerHeight - offset) * 0.4) / h;

                    if (widthScale < heightScale) {
                        precanvas.width = window.innerWidth - offset;
                        precanvas.height = h * widthScale;
                        canvas.width = window.innerWidth - offset;
                        canvas.height = h * widthScale;
                    } else {
                        precanvas.height = (window.innerHeight - offset) * 0.4;
                        precanvas.width = w * heightScale;
                        canvas.height = (window.innerHeight - offset) * 0.4;
                        canvas.width = w * heightScale;
                    }

                    prectx.drawImage(img, 0, 0, precanvas.width, precanvas.height);
                    imageData = prectx.getImageData(0, 0, canvas.width, canvas.height);
                    ctx.putImageData(imageData, 0, 0);
                    history.push(imageData);
                }
                if (image)
                    img.src = URL.createObjectURL(image);

                let input = document.querySelectorAll("div input");
                let span = document.querySelectorAll("div span");

                input.forEach((inp, i) => {
                    span[i].innerHTML = inp.value;
                    inp.addEventListener("input", () => {
                        span[i].innerHTML = inp.value;
                        updateImage();
                    });
                });

                document.getElementById("clear").onclick = () => clear();
                document.getElementById("reset").onclick = () => reset();
                let undo = document.getElementById("undo");
                let redo = document.getElementById("redo");
                let apply = document.getElementById("apply");
                undo.onclick = () => undoF();
                redo.onclick = () => redoF();
                apply.onclick = () => applyF();
                
                let grayBut = document.getElementById("grayscale");
                grayBut.onclick = () => {
                    if (grayBut.classList.contains("toggled"))
                        grayBut.classList.remove("toggled");
                    else 
                        grayBut.classList.add("toggled");
                    updateImage()
                }

                function updateImage() {
                    imageData = new ImageData(history[historyIndex].width, history[historyIndex].height);
                    imageData.data.set(history[historyIndex].data);

                    let r = (document.getElementsByClassName("r")[0].value / document.getElementsByClassName("r")[1].value);
                    let g = (document.getElementsByClassName("g")[0].value / document.getElementsByClassName("g")[1].value);
                    let b = (document.getElementsByClassName("b")[0].value / document.getElementsByClassName("b")[1].value);
                    let brightness = document.getElementById("brightness").value;
                    let threshold = document.getElementById("threshold").value;

                    let { width, height, data } = imageData;

                    for (let y = 0; y < height; y++) {
                        for (let x = 0; x < width; x++) {
                            let index = (y * width + x) * 4; 
                            if (threshold > 0) {
                                let thresholdV = ((data[index] + data[index + 1] + data[index + 2]) / 3) >= threshold ? 255 : 0;
                                data[index] = thresholdV; //r
                                data[index + 1] = thresholdV; //g
                                data[index + 2] = thresholdV; //b
                            }
                            else if (grayBut.classList.contains("toggled")) {
                                let grayscale = ((data[index] + data[index + 1] + data[index + 2]) / 3);
                                data[index] = grayscale; //r
                                data[index + 1] = grayscale; //g
                                data[index + 2] = grayscale; //b
                            }
                                
                            data[index] *= (brightness * r); //g
                            data[index + 1] *= (brightness * g); //g
                            data[index + 2] *= (brightness * b); //b

                            data[index + 3]; //a
                        }
                    }

                    ctx.putImageData(imageData, 0, 0);
                    change = true;
                    if (apply.classList.contains("unavalible"))
                        apply.classList.remove("unavalible");

                }

                function clear() {
                    if (history.length > 1) {
                        history.splice(1);
                        historyIndex = 0;
                    }
                    reset();
                }

                function undoF() {
                    if (historyIndex > 0)
                        historyIndex--;
                    reset();
                }

                function redoF() {
                    if (historyIndex < history.length - 1)
                        historyIndex++;
                    reset();
                }

                function applyF() {
                    if (change) {
                        if (historyIndex < history.length - 1)
                            history.splice(historyIndex + 1);
                        history.push(imageData);
                        historyIndex++;
                    }
                    reset();
                }

                function reset() {
                    if (change)
                        change = false;
                    if (!change)
                        apply.classList.add("unavalible");
                    if(historyIndex == 0)
                        undo.classList.add("unavalible");
                    else
                        undo.classList.remove("unavalible");
                    if(historyIndex == history.length - 1)
                        redo.classList.add("unavalible");
                    else
                        redo.classList.remove("unavalible");

                    imageData = history[historyIndex];
                    prectx.putImageData(imageData, 0, 0);
                    ctx.putImageData(imageData, 0, 0);

                    input.forEach((inp) => {
                        inp.value = 0;
                    });

                    document.getElementById("brightness").value = 1;

                    input.forEach((inp, i) => {
                        span[i].innerHTML = inp.value;
                    });

                    grayBut.classList.remove("toggled");
                }
            }
        }
    };
    xhttp.open("GET", page + ".html", true);
    xhttp.send();
}

loadContent('home');

function map_range(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}