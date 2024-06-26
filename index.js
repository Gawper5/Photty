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
                let ctx = canvas.getContext("2d", { willReadFrequently: true });
                let img = new Image;
                let history = Array();
                let historyIndex = 0;
                let imageData;
                let change = false;
                let temp_imgdata;
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

                    imageData = new ImageData(canvas.width, canvas.height);
                    temp_imgdata = new ImageData(canvas.width, canvas.height);
                    prectx.drawImage(img, 0, 0, precanvas.width, precanvas.height);
                    imageData.data.set(prectx.getImageData(0, 0, canvas.width, canvas.height).data);
                    ctx.putImageData(imageData, 0, 0);
                    history.push(imageData.data);
                    temp_imgdata.data.set(imageData.data);
                    updateGraph(imageData);
                }
                if (image)
                    img.src = URL.createObjectURL(image);

                let input = document.querySelectorAll('div input[type="range"]');
                let span = document.querySelectorAll("div span");

                input.forEach((inp, i) => {
                    span[i].innerHTML = inp.value;
                    inp.addEventListener("input", () => {
                        span[i].innerHTML = inp.value;
                        if (inp.id != "brush_size" && inp.id != "kernel_size")
                            updateImage();
                    });
                });

                let initialData = {
                    labels: ["0 - 50", "51 - 101", "102 - 152", "153 - 203", "204 - 255"],
                    datasets: [{
                        label: "Red",
                        data: [0, 0, 0, 0, 0], 
                        backgroundColor: "rgba(255, 99, 132, 0.5)",
                        borderColor: "rgba(255, 99, 132, 1)",
                        borderWidth: 1
                    }, 
                    {
                        label: "Green",
                        data: [0, 0, 0, 0, 0], 
                        backgroundColor: "rgba(75, 192, 192, 0.5)",
                        borderColor: "rgba(75, 192, 192, 1)",
                        borderWidth: 1
                    }, 
                    {
                        label: "Blue",
                        data: [0, 0, 0, 0, 0], 
                        backgroundColor: "rgba(54, 162, 235, 0.5)",
                        borderColor: "rgba(54, 162, 235, 1)",
                        borderWidth: 1
                    }]
                };
                
                let options = {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                };
  
                let graph = document.getElementById('histogram');
                let grapgh_ctx = graph.getContext('2d');

                let histogram = new Chart(grapgh_ctx, {
                    type: 'bar',
                    data: initialData,
                    options: options
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

                let sobelBut = document.getElementById("sobel");
                sobelBut.onclick = () => {
                    if (sobelBut.classList.contains("toggled"))
                        sobelBut.classList.remove("toggled");
                    else 
                        sobelBut.classList.add("toggled");
                    updateImage()
                }

                let laplaceBut = document.getElementById("laplace");
                laplaceBut.onclick = () => {
                    if (laplaceBut.classList.contains("toggled"))
                        laplaceBut.classList.remove("toggled");
                    else 
                        laplaceBut.classList.add("toggled");
                    updateImage()
                }

                let sharpBut = document.getElementById("sharp");
                sharpBut.onclick = () => {
                    if (sharpBut.classList.contains("toggled"))
                        sharpBut.classList.remove("toggled");
                    else 
                        sharpBut.classList.add("toggled");
                    updateImage()
                }

                let unsharpBut = document.getElementById("unsharp");
                unsharpBut.onclick = () => {
                    if (unsharpBut.classList.contains("toggled"))
                        unsharpBut.classList.remove("toggled");
                    else 
                        unsharpBut.classList.add("toggled");
                    updateImage()
                }

                let brushBut = document.getElementById("brush");
                brushBut.onclick = () => {
                    if (brushBut.classList.contains("toggled"))
                        brushBut.classList.remove("toggled");
                    else 
                        brushBut.classList.add("toggled");
                }

                let matrixBut = document.getElementById("matrix_but");
                matrixBut.onclick = () => {
                    let matrix = document.querySelectorAll('div[id="grid"] input');
                    let kernel = [];
                    matrix.forEach(e => {
                        kernel.push(e.value);
                    });
                    imageData = new ImageData(canvas.width, canvas.height);
                    imageData.data.set(temp_imgdata.data);
                    applyMatrix(imageData, kernel);
                    showPic(imageData);
                }

                let matrixSlider = document.getElementById("kernel_size");
                matrixSlider.oninput = () => {
                    let grid = document.getElementById("grid");
                    while (grid.firstChild) {
                        grid.removeChild(grid.firstChild);
                    }
                    for (let i = 0; i < matrixSlider.value * matrixSlider.value; i++) {
                        let newInput = document.createElement("input");
                        newInput.setAttribute("type", "number");
                        newInput.setAttribute("value", "0");
                        grid.append(newInput);
                    }
                    grid.style.gridTemplateRows = `repeat(${matrixSlider.value}, minmax(25px, 1fr))`;
                    grid.style.gridTemplateColumns = `repeat(${matrixSlider.value}, minmax(25px, 1fr))`;
                }
                
                let isDrawing = false;
                let x = 0, y = 0;

                canvas.addEventListener('mousedown', e => {
                    if (brushBut.classList.contains("toggled")) {
                        let rect = canvas.getBoundingClientRect();
                        x = e.clientX - rect.left;
                        y = e.clientY - rect.top;
                        isDrawing = true;
                    }
                    else isDrawing = false;
                });

                canvas.addEventListener('mousemove', e => {
                    if (isDrawing === true) {
                        let rect = canvas.getBoundingClientRect();
                        drawLine(x, y, e.clientX - rect.left, e.clientY - rect.top);
                        x = e.clientX - rect.left;
                        y = e.clientY - rect.top;
                        change = true;
                    }
                });

                canvas.addEventListener('mouseup', e => {
                    if (isDrawing === true) {
                        let rect = canvas.getBoundingClientRect();
                        drawLine(x, y, e.clientX - rect.left, e.clientY - rect.top);
                        x = 0;
                        y = 0;
                        isDrawing = false;
                        temp_imgdata.data.set(ctx.getImageData(0, 0, temp_imgdata.width, temp_imgdata.height).data);
                        imageData = new ImageData(canvas.width, canvas.height);
                        imageData.data.set(temp_imgdata.data);
                        change = true;

                        if (apply.classList.contains("unavalible"))
                            apply.classList.remove("unavalible");
                    }
                });

                function drawLine(x1, y1, x2, y2) {
                    let brush_color = document.getElementById("brush_color").value;
                    let brush_size = document.getElementById("brush_size").value;
                    
                    ctx.beginPath();
                    ctx.strokeStyle = brush_color;
                    ctx.lineWidth = brush_size;
                    ctx.lineCap = "round";
                    ctx.lineJoin = "round";
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                    ctx.closePath();
                }

                function updateImage() {
                    imageData = new ImageData(canvas.width, canvas.height); //! Funny JS ce tega ni
                    imageData.data.set(temp_imgdata.data);

                    let r = (document.getElementsByClassName("r")[0].value / document.getElementsByClassName("r")[1].value);
                    let g = (document.getElementsByClassName("g")[0].value / document.getElementsByClassName("g")[1].value);
                    let b = (document.getElementsByClassName("b")[0].value / document.getElementsByClassName("b")[1].value);
                    let brightness = document.getElementById("brightness").value;
                    let threshold = document.getElementById("threshold").value;
                    let box_blur = document.getElementById("box-blur").value;
                    let gaussian_blur = document.getElementById("gaussian-blur").value;
    
                    let { width, height, data } = imageData;

                    if (box_blur > 0)
                        applyBoxBlur(imageData, box_blur);

                    if (gaussian_blur > 0)
                        applyGaussianBlur(imageData, gaussian_blur);

                    if (sobelBut.classList.contains("toggled"))
                        applySobel(imageData);

                    if (laplaceBut.classList.contains("toggled"))
                        applyMatrix(imageData, [-1,-1,-1,-1,8,-1,-1,-1,-1]);

                    if (sharpBut.classList.contains("toggled"))
                        applyMatrix(imageData, [0,-1,0,-1,5,-1,0,-1,0]);

                    if (unsharpBut.classList.contains("toggled"))
                        applyUnsharpMasking(imageData, 0.2, 2);

                    for (let y = 0; y < height; y++) {
                        for (let x = 0; x < width; x++) {
                            let index = (y * width + x) * 4; 
                            
                            if (threshold > 0) {
                                let thresholdV = (0.2126 * data[index] + 0.7152 * data[index + 1] + 0.0722 * data[index + 2]) >= threshold ? 255 : 0;
                                data[index] = thresholdV; //r
                                data[index + 1] = thresholdV; //g
                                data[index + 2] = thresholdV; //b
                            }
                            else if (grayBut.classList.contains("toggled")) {
                                let grayscale = (0.2126 * data[index] + 0.7152 * data[index + 1] + 0.0722 * data[index + 2]);
                                data[index] = grayscale; //r
                                data[index + 1] = grayscale; //g
                                data[index + 2] = grayscale; //b
                            }
                            
                            if (brightness != 1) {
                                data[index] = Math.pow(data[index], brightness); //r
                                data[index + 1] = Math.pow(data[index + 1], brightness); //g
                                data[index + 2] = Math.pow(data[index + 2], brightness); //b
                            }
            
                            if (r != 1)
                                data[index] *= r; //r
                            if (g != 1)
                                data[index + 1] *= g; //g
                            if (b != 1)
                                data[index + 2] *= b; //b
                        }
                    }
                    
                    showPic(imageData);
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

                                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                        let _index = (ny * width + nx) * 4;
                                        sumR += data[_index];
                                        sumG += data[_index + 1];
                                        sumB += data[_index + 2];
                                        count++;
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

                    let x = new ImageData(width, height, data);
                    return x;
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

                    for (let y = 0; y < size; y++) {
                        for (let x = 0; x < size; x++) {
                            kernel[y][x] /= sum;
                        }
                    }
                
                    return kernel;
                }

                function applySobel(imageData) {
                    let { data, width, height } = imageData;
                    let grayscaleData = convertToGrayscale(imageData);
                
                    let sobelX = [
                        [-1, 0, 1],
                        [-2, 0, 2],
                        [-1, 0, 1]
                    ];
                    let sobelY = [
                        [-1, -2, -1],
                        [ 0,  0,  0],
                        [ 1,  2,  1]
                    ];
                
                    for (let y = 0; y < height; y++) {
                        for (let x = 0; x < width; x++) {
                            let sumX = 0, sumY = 0;
                
                            for (let ky = 0; ky <= 2; ky++) {
                                for (let kx = 0; kx <= 2; kx++) {
                                    let pixelX = x + kx;
                                    let pixelY = y + ky;

                                    if (pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height) {
                                        let kernelValueX = sobelX[ky][kx];
                                        let kernelValueY = sobelY[ky][kx];

                                        let grayscaleIndex = (pixelY * width + pixelX) * 4;
                                        let intensity = grayscaleData[grayscaleIndex];
                                        sumX += intensity * kernelValueX;
                                        sumY += intensity * kernelValueY;
                                    }
                                }
                            }

                            let gradientMagnitude = Math.sqrt(sumX * sumX + sumY * sumY);
                            let pixelIndex = (y * width + x) * 4;
                            data[pixelIndex] = gradientMagnitude; // R
                            data[pixelIndex + 1] = gradientMagnitude; // G
                            data[pixelIndex + 2] = gradientMagnitude; // B
                            data[pixelIndex + 3] = 255;
                        }
                    }
                }

                function convertToGrayscale(imageData) {
                    let { data } = imageData;
                    let grayscaleData = new Uint8ClampedArray(data.length);

                    for (let i = 0; i < data.length; i += 4) {
                        let intensity = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];

                        grayscaleData[i] = intensity; // R
                        grayscaleData[i + 1] = intensity; // G
                        grayscaleData[i + 2] = intensity; // B
                        grayscaleData[i + 3] = data[i + 3];
                    }
                
                    return grayscaleData;
                }

                function applyMatrix(imageData, kernel) {
                    let { width, height, data } = imageData;

                    let kernelSize = Math.sqrt(kernel.length);

                    for (let y = 1; y < height - 1; y++) {
                        for (let x = 1; x < width - 1; x++) {
                            let sumR = 0, sumG = 0, sumB = 0;

                            for (let ky = 0; ky < kernelSize; ky++) {
                                for (let kx = 0; kx < kernelSize; kx++) {
                                    let pixelIndex = ((y + ky) * width + (x + kx)) * 4;
                                    let kernelValue = kernel[ky * kernelSize + kx];
                                    sumR += data[pixelIndex] * kernelValue;
                                    sumG += data[pixelIndex + 1] * kernelValue;
                                    sumB += data[pixelIndex + 2] * kernelValue;
                                }
                            }

                            let index = (y * width + x) * 4;
                            data[index] = sumR;
                            data[index + 1] = sumG;
                            data[index + 2] = sumB;
                            data[index + 3] = 255;
                        }
                    }
                }

                function applyUnsharpMasking(imageData, strength, radius) {
                    let blurredImageData = applyGaussianBlur(imageData, radius);

                    let { width, height, data } = imageData;
                    for (let i = 0; i < data.length; i++) {
                        data[i] += strength * (imageData.data[i] - blurredImageData.data[i]);
                    }
                }

                function updateGraph(imageData) {
                    let { width, height, data } = imageData;

                    let graphData = {
                        r: [0, 0, 0, 0, 0],
                        b: [0, 0, 0, 0, 0],
                        g: [0, 0, 0, 0, 0]
                    }

                    for (let y = 0; y < height; y++) {
                        for (let x = 0; x < width; x++) {
                            let index = (y * width + x) * 4;
                            
                            let r = data[index];
                            let g = data[index + 1];
                            let b = data[index + 2];

                            if (r < 51) graphData.r[0]++;
                            else if (r >= 51 && r < 102) graphData.r[1]++;
                            else if (r >= 102 && r < 153) graphData.r[2]++;
                            else if (r >= 153 && r < 204) graphData.r[3]++;
                            else if (r >= 204) graphData.r[4]++;

                            if (b < 51) graphData.b[0]++;
                            else if (b >= 51 && b < 102) graphData.b[1]++;
                            else if (b >= 102 && b < 153) graphData.b[2]++;
                            else if (b >= 153 && b < 204) graphData.b[3]++;
                            else if (b >= 204) graphData.b[4]++;

                            if (g < 51) graphData.g[0]++;
                            else if (g >= 51 && g < 102) graphData.g[1]++;
                            else if (g >= 102 && g < 153) graphData.g[2]++;
                            else if (g >= 153 && g < 204) graphData.g[3]++;
                            else if (g >= 204) graphData.r[4]++;
                        }
                    }

                    histogram.data.datasets[0].data = [graphData.r[0], graphData.r[1], graphData.r[2], graphData.r[3], graphData.r[4]];
                    histogram.data.datasets[1].data = [graphData.g[0], graphData.g[1], graphData.g[2], graphData.g[3], graphData.g[4]];
                    histogram.data.datasets[2].data = [graphData.b[0], graphData.b[1], graphData.b[2], graphData.b[3], graphData.b[4]];
                    histogram.update();
                }

                function showPic(imageData) {
                    change = true;
                    ctx.putImageData(imageData, 0, 0);
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
                    if (historyIndex > 0) {
                        historyIndex--;
                        reset();
                    }
                }

                function redoF() {
                    if (historyIndex < history.length - 1) {
                        historyIndex++;
                        reset();
                    }
                }

                function applyF() {
                    if (change) {
                        if (historyIndex < history.length - 1)
                            history.splice(historyIndex + 1);
                        history.push(imageData.data);
                        historyIndex++;
                        reset();
                    }
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

                    temp_imgdata.data.set(history[historyIndex]);
                    prectx.putImageData(temp_imgdata, 0, 0);
                    ctx.putImageData(temp_imgdata, 0, 0);

                    input.forEach((inp) => {
                        inp.value = 0;
                    });

                    document.getElementById("brightness").value = 1;

                    input.forEach((inp, i) => {
                        span[i].innerHTML = inp.value;
                    });

                    grayBut.classList.remove("toggled");
                    sobelBut.classList.remove("toggled");
                    laplaceBut.classList.remove("toggled");
                    sharpBut.classList.remove("toggled");
                    unsharpBut.classList.remove("toggled");
                    brushBut.classList.remove("toggled");

                    let grid = document.getElementById("grid");
                    while (grid.firstChild) {
                        grid.removeChild(grid.firstChild);
                    }
                    for (let i = 0; i < matrixSlider.value * matrixSlider.value; i++) {
                        let newInput = document.createElement("input");
                        newInput.setAttribute("type", "number");
                        newInput.setAttribute("value", "0");
                        grid.append(newInput);
                    }
                    grid.style.gridTemplateRows = `repeat(${matrixSlider.value}, minmax(25px, 1fr))`;
                    grid.style.gridTemplateColumns = `repeat(${matrixSlider.value}, minmax(25px, 1fr))`;

                    updateGraph(temp_imgdata);
                }
            }
        }
    };
    xhttp.open("GET", page + ".html", true);
    xhttp.send();
}

loadContent('home');