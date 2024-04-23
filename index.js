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
                    let box_blur = document.getElementById("box-blur").value;
                    let gaussian_blur = document.getElementById("gaussian-blur").value;
                    let sharpening = document.getElementById("sharpening").value;
                    let unsharpening_mask = document.getElementById("unsharpening-mask").value;

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
                                let grayscale = (0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2]);
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
                
                    if (box_blur > 0)
                        applyBoxBlur(imageData, box_blur);

                    if (gaussian_blur > 0)
                        applyGaussianBlur(imageData, gaussian_blur);
                    
                    change = true;
                    ctx.putImageData(imageData, 0, 0);
                    if (apply.classList.contains("unavalible"))
                        apply.classList.remove("unavalible");

                }

                function applyBoxBlur(imageData, radius) {
                    let { width, height, data } = imageData;

                    for (let y = 0; y < height; y++) {
                        for (let x = 0; x < width; x++) {
                            let index = (y * width + x) * 4; 
                            let sumR = 0, sumG = 0, sumB = 0, count = 0;

                            for (let dy = -radius; dy <= radius; dy++) {
                                for (let dx = -radius; dx <= radius; dx++) {
                                    let nx = x + dx;
                                    let ny = y + dy;

                                    // Ensure neighboring pixel is within image bounds
                                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                        let _index = (ny * width + nx) * 4; // Calculate index of neighboring pixel
                                        sumR += data[_index]; // Accumulate red channel value
                                        sumG += data[_index + 1]; // Accumulate green channel value
                                        sumB += data[_index + 2]; // Accumulate blue channel value
                                        count++; // Increase count of neighboring pixels
                                    }
                                }
                            }

                            let avgR = sumR / count;
                            let avgG = sumG / count;
                            let avgB = sumB / count;
            
                            data[index] = avgR;
                            data[index + 1] = avgG;
                            data[index + 2] = avgB;
                        }
                    }
                }

                function applyGaussianBlur(imageData, radius) {
                    let { data, width, height } = imageData;
                    let kernel = createGaussianKernel(radius);

                    for (let y = 0; y < height; y++) {
                        for (let x = 0; x < width; x++) {
                            let index = (y * width + x) * 4; 
                            let sumR = 0, sumG = 0, sumB = 0, sumA = 0;

                            for (let ky = -radius; ky <= radius; ky++) {
                                for (let kx = -radius; kx <= radius; kx++) {
                                    let pixelX = x + kx;
                                    let pixelY = y + ky;

                                    if (pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height) {
                                        let _index = (pixelY * width + pixelX) * 4;
                                        let weight = kernel[ky + radius * 1][kx + radius * 1];
                
                                        sumR += data[_index] * weight;
                                        sumG += data[_index + 1] * weight;
                                        sumB += data[_index + 2] * weight;
                                        sumA += data[_index + 3] * weight;
                                    }
                                }
                            }
                
                            data[index] = sumR;
                            data[index + 1] = sumG;
                            data[index + 2] = sumB;
                            data[index + 3] = sumA;
                        }
                    }
                }

                function createGaussianKernel(radius) {
                    let size = radius * 2 + 1;
                    let kernel = [];
                
                    let sigma = radius / 3;
                    let sigma22 = 2 * sigma * sigma;
                    let sqrtPiSigma22 = Math.sqrt(Math.PI * sigma22);
                
                    let sum = 0;
                    for (let y = -radius; y <= radius; y++) {
                        let row = [];
                        for (let x = -radius; x <= radius; x++) {
                            let distance = (x * x + y * y);
                            let weight = Math.exp(-distance / sigma22) / sqrtPiSigma22;
                            sum += weight;
                            row.push(weight);
                        }
                        kernel.push(row);
                    }
                
                    // Normalize the kernel
                    for (let y = 0; y < size; y++) {
                        for (let x = 0; x < size; x++) {
                            kernel[y][x] /= sum;
                        }
                    }
                
                    return kernel;
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